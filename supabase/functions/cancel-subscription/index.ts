// cancel-subscription — Supabase Edge Function (Deno)
// Protected by JWT. Cancels the user's active subscription at PayMongo.
// The user keeps Premium until the paid-through date.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYMONGO_SK = Deno.env.get("PAYMONGO_SECRET_KEY")!;

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

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  // Look up the subscription
  const { data: ent } = await supabase
    .from("entitlements")
    .select("provider_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ent?.provider_subscription_id) {
    return new Response(JSON.stringify({ error: "No active subscription found" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Cancel at PayMongo
  const cancelRes = await fetch(`${PAYMONGO}/subscriptions/${ent.provider_subscription_id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({ data: { attributes: {} } }),
  });

  const cancelBody = await cancelRes.json();
  if (!cancelRes.ok) {
    return new Response(JSON.stringify({ error: cancelBody.errors?.[0]?.detail || "Cancel failed at PayMongo" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ cancelled: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
