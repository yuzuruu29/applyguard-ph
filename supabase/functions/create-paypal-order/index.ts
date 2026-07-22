import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ApiError, errorResponse, jsonResponse, optionsResponse, requestId } from "../_shared/http.ts";
import { buildTrustedOrderMetadata, isPlanId, PAYPAL_CURRENCY, PAYPAL_PLANS } from "../_shared/paypal.ts";
import { adminClient, generatePayPalAccessToken, paypalRequest } from "../_shared/paypal-runtime.ts";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,38}$/;

async function scopedPayPalRequestId(userId: string, clientKey: string) {
  const bytes = new TextEncoder().encode(`${userId}:${clientKey}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 38);
}

serve(async (req) => {
  const id = requestId(req);
  if (req.method === "OPTIONS") return optionsResponse(req);
  if (req.method !== "POST") return errorResponse(req, new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed."), id, "create-paypal-order");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new ApiError(401, "AUTH_REQUIRED", "Sign in before starting checkout.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError(401, "AUTH_INVALID", "Your session expired. Sign in and try again.");

    let body: { plan?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "INVALID_JSON", "The checkout request was invalid.");
    }
    if (!isPlanId(body.plan)) throw new ApiError(400, "INVALID_PLAN", "Choose a valid ApplyGuard plan.");

    const idempotencyKey = req.headers.get("X-Idempotency-Key") || id;
    if (!IDEMPOTENCY_KEY.test(idempotencyKey)) {
      throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", "The checkout request could not be verified.");
    }
    const paypalRequestId = await scopedPayPalRequestId(user.id, idempotencyKey);

    const plan = PAYPAL_PLANS[body.plan];
    const metadata = buildTrustedOrderMetadata(user.id, body.plan);
    const accessToken = await generatePayPalAccessToken(id);
    const { response, body: order } = await paypalRequest("/v2/checkout/orders", accessToken, {
      method: "POST",
      headers: { "PayPal-Request-Id": paypalRequestId },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: `applyguard-${body.plan}`,
          amount: { currency_code: PAYPAL_CURRENCY, value: plan.price },
          description: plan.name,
          custom_id: JSON.stringify(metadata),
        }],
        application_context: {
          brand_name: "ApplyGuard PH",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: "https://applyguard.ph/account",
          cancel_url: "https://applyguard.ph/offers",
        },
      }),
    });

    if (!response.ok || typeof order.id !== "string") {
      throw new ApiError(502, "PAYPAL_ORDER_FAILED", "PayPal could not start checkout. Please try again.", {
        retryable: response.status >= 500,
        internal: order.message || order.name || response.status,
      });
    }

    const { error: recordError } = await adminClient().from("payments").upsert({
      id: order.id,
      user_id: user.id,
      provider_event: order.id,
      provider_event_type: "paypal.order.created",
      amount: plan.amount,
      currency: PAYPAL_CURRENCY,
      status: order.status || "CREATED",
      plan_id: body.plan,
      raw: { paypal_order_id: order.id, environment: "production", paypal_request_id: paypalRequestId },
    }, { onConflict: "id" });

    if (recordError) {
      throw new ApiError(500, "ORDER_RECORD_FAILED", "Checkout could not be prepared. Please try again.", {
        retryable: true,
        internal: recordError.message,
      });
    }

    return jsonResponse(req, { id: order.id, requestId: id }, 200);
  } catch (error) {
    return errorResponse(req, error, id, "create-paypal-order");
  }
});
