import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_ENVIRONMENT") === "production" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateAccessToken() {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "Failed to generate access token");
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { orderID } = await req.json();
    if (!orderID) throw new Error("Order ID is required");

    const accessToken = await generateAccessToken();

    // Capture the PayPal Order
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captureData = await response.json();
    if (!response.ok) throw new Error(captureData.message || "Failed to capture order");

    // Order is successfully captured
    const purchaseUnit = captureData.purchase_units[0];
    const capture = purchaseUnit.payments.captures[0];
    
    let metadata;
    try {
      metadata = JSON.parse(purchaseUnit.custom_id);
    } catch {
      throw new Error("Invalid custom_id metadata from PayPal");
    }

    if (metadata.userId !== user.id) {
      throw new Error("Order user ID mismatch");
    }

    const plan = metadata.plan;
    const amount = Math.round(parseFloat(capture.amount.value) * 100);

    // Use Service Role to bypass RLS for DB writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Log the payment
    await supabaseAdmin.from("payments").upsert({
      id: capture.id,
      user_id: user.id,
      provider_event: "paypal.capture",
      provider_event_type: "paypal.capture",
      amount: amount,
      currency: "PHP",
      status: capture.status,
      plan_id: plan,
      raw: captureData,
    }, { onConflict: "id" });

    // 2. Grant entitlements
    if (plan === "pack") {
      await supabaseAdmin.from("entitlements").upsert({
        user_id: user.id,
        has_message_pack: true,
        provider_payment_id: capture.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    } else {
      // 30 days (or 365 for yearly)
      const days = plan === "yearly" ? 365 : 30;
      const end = new Date();
      end.setDate(end.getDate() + days);
      const periodEnd = end.toISOString().slice(0, 10);
      
      await supabaseAdmin.from("entitlements").upsert({
        user_id: user.id,
        tier: "premium",
        status: "active",
        current_period_end: periodEnd,
        provider_payment_id: capture.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    return new Response(JSON.stringify({ success: true, capture }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
