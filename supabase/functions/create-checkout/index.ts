// create-checkout — Supabase Edge Function (Deno)
// Protected by JWT. Reads the user's plan choice, creates a PayMongo
// subscription (card/Maya) or checkout session (GCash/one-time).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYMONGO_SK = Deno.env.get("PAYMONGO_SECRET_KEY")!;
const PAYMONGO_PLAN_MONTHLY_ID = Deno.env.get("PAYMONGO_PLAN_MONTHLY_ID")!;
const PAYMONGO_PLAN_YEARLY_ID = Deno.env.get("PAYMONGO_PLAN_YEARLY_ID")!;
const APP_ORIGIN = Deno.env.get("APP_ORIGIN") || "http://localhost:5173";

const PAYMONGO = "https://api.paymongo.com/v1";
const auth = btoa(PAYMONGO_SK + ":");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth — must be a logged-in user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { plan: planId } = await req.json();

  // Monthly / yearly → PayMongo subscriptions (card/Maya auto-renew)
  if (planId === "monthly" || planId === "yearly") {
    const planPmId = planId === "monthly" ? PAYMONGO_PLAN_MONTHLY_ID : PAYMONGO_PLAN_YEARLY_ID;

    const subRes = await fetch(`${PAYMONGO}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: "subscription",
            plan_id: planPmId,
            redirect: {
              success: `${APP_ORIGIN}/account?paid=1`,
              failed: `${APP_ORIGIN}/offers`,
            },
            metadata: { user_id: user.id },
          },
        },
      }),
    });
    const subBody = await subRes.json();
    if (!subRes.ok) return new Response(JSON.stringify({ error: subBody.errors?.[0]?.detail || "Subscription creation failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ checkout_url: subBody.data.attributes.redirect.checkout_url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // GCash / one-time → PayMongo checkout session
  const amount = planId === "gcash_30d" ? 29900 : 14900;
  const desc = planId === "gcash_30d" ? "Premium — 30 days (GCash)" : "Message Pack";
  const success = planId === "gcash_30d"
    ? `${APP_ORIGIN}/account?paid=1`
    : `${APP_ORIGIN}/offers?paid=1`;

  const chkRes = await fetch(`${PAYMONGO}/checkout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              name: desc,
              description: desc,
              amount: amount,
              currency: "PHP",
              quantity: 1,
            }
          ],
          payment_method_types: planId === "gcash_30d" ? ["gcash"] : ["gcash", "card", "paymaya"],
          success_url: success,
          cancel_url: `${APP_ORIGIN}/offers`,
          description: desc,
          send_email_receipt: true,
          metadata: { user_id: user.id, plan: planId },
        },
      },
    }),
  });
  const chkBody = await chkRes.json();
  if (!chkRes.ok) return new Response(JSON.stringify({ error: chkBody.errors?.[0]?.detail || "Checkout creation failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ checkout_url: chkBody.data.attributes.checkout_url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
