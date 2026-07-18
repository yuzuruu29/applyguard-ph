// paymongo-webhook — Supabase Edge Function (Deno)
// Receives PayMongo webhook events, verifies the signature, and writes
// entitlements. This is the ONLY writer of entitlements — the browser
// can never self-upgrade. Must be registered at the PayMongo dashboard.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("PAYMONGO_WEBHOOK_SECRET")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function verifySignature(body, sigHeader) {
  if (!sigHeader) return false;
  const parts = sigHeader.split(",");
  const timestamp = parts.find((p) => p.trim().startsWith("t="))?.split("=")[1];
  const expected = parts.find((p) => p.trim().startsWith("te="))?.split("=")[1];
  if (!timestamp || !expected) return false;
  const hmac = createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(`${timestamp}.${body}`);
  const actual = hmac.digest("hex");
  return actual === expected;
}

serve(async (req) => {
  const sigHeader = req.headers.get("paymongo-signature");
  const rawBody = await req.text();

  if (!verifySignature(rawBody, sigHeader)) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const { type, data } = event;
  const attrs = data?.attributes || {};
  const userId = attrs?.metadata?.user_id || data?.attributes?.metadata?.user_id;
  if (!userId) return new Response(JSON.stringify({ error: "No user_id in metadata" }), { status: 400 });

  const eventId = data?.id || `${type}-${Date.now()}`;
  const amount = attrs?.amount || attrs?.data?.attributes?.amount || 0;

  // Log every event to the payments audit table
  await supabase.from("payments").upsert({
    id: eventId,
    user_id: userId,
    provider_event: type,
    provider_event_type: type,
    amount,
    currency: "PHP",
    status: attrs?.status || type,
    plan_id: attrs?.metadata?.plan || "",
    raw: event,
  }, { onConflict: "id" });

  // ── Entitlement transitions ─────────────────────────────────────
  // Subscription created or renewed (invoice.paid / subscription payment)
  if (
    type === "subscription.created" ||
    type === "subscription.updated" ||
    type === "invoice.paid"
  ) {
    const periodEnd = attrs?.current_period_end
      ? new Date(attrs.current_period_end * 1000).toISOString().slice(0, 10)
      : attrs?.data?.attributes?.current_period_end
        ? new Date(attrs.data.attributes.current_period_end * 1000).toISOString().slice(0, 10)
        : null;

    if (periodEnd) {
      await supabase.from("entitlements").upsert({
        user_id: userId,
        tier: "premium",
        status: attrs?.status === "past_due" ? "past_due" : "active",
        current_period_end: periodEnd,
        provider_subscription_id: attrs?.subscription_id || attrs?.data?.attributes?.subscription_id || null,
        provider_payment_id: attrs?.payment_id || eventId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  }

  // Subscription cancelled
  if (type === "subscription.cancelled") {
    await supabase.from("entitlements").upsert({
      user_id: userId,
      status: "cancelled",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  }

  // Checkout session paid (GCash / one-time)
  if (type === "checkout_session.payment.paid") {
    const plan = attrs?.metadata?.plan || data?.attributes?.metadata?.plan;
    if (plan === "gcash_30d") {
      // Grant 30 days of premium from now
      const end = new Date();
      end.setDate(end.getDate() + 30);
      const periodEnd = end.toISOString().slice(0, 10);
      await supabase.from("entitlements").upsert({
        user_id: userId,
        tier: "premium",
        status: "active",
        current_period_end: periodEnd,
        provider_payment_id: eventId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
    // For "pack" (one-time), no entitlement change — handled by email delivery
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
