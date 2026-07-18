import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
const PAYPAL_API_BASE = Deno.env.get("PAYPAL_ENVIRONMENT") === "production" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

const PLANS: Record<string, { price: string, name: string }> = {
  monthly: { price: "299.00", name: "Premium - 30 Days" },
  yearly: { price: "2990.00", name: "Premium - 365 Days" },
  gcash_30d: { price: "299.00", name: "Premium - 30 Days" },
  pack: { price: "149.00", name: "Message Pack" }
};

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { plan, metadata } = await req.json();
    if (!PLANS[plan]) throw new Error("Invalid plan ID");

    const accessToken = await generateAccessToken();
    
    // Merge userId and plan into metadata if provided, otherwise create base object
    const customIdData = { userId: user.id, plan, ...(metadata || {}) };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `${user.id}_${plan}`,
            amount: {
              currency_code: "PHP",
              value: PLANS[plan].price,
            },
            description: PLANS[plan].name,
            custom_id: JSON.stringify(customIdData),
          },
        ],
      }),
    });

    const order = await response.json();
    if (!response.ok) throw new Error(order.message || "Failed to create order");

    return new Response(JSON.stringify({ id: order.id }), {
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
