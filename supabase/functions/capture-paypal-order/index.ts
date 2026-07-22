import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ApiError, errorResponse, jsonResponse, optionsResponse, requestId } from "../_shared/http.ts";
import { findCapture, validatePayPalPurchaseUnit } from "../_shared/paypal.ts";
import {
  expectedFromStoredOrder,
  fulfillOrder,
  generatePayPalAccessToken,
  loadStoredOrder,
  paypalRequest,
} from "../_shared/paypal-runtime.ts";

const ORDER_ID = /^[A-Z0-9]{8,30}$/;

function paypalIssue(body: Record<string, any>) {
  return body.details?.[0]?.issue || body.name || "";
}

serve(async (req) => {
  const id = requestId(req);
  if (req.method === "OPTIONS") return optionsResponse(req);
  if (req.method !== "POST") return errorResponse(req, new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed."), id, "capture-paypal-order");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new ApiError(401, "AUTH_REQUIRED", "Sign in before completing checkout.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError(401, "AUTH_INVALID", "Your session expired. Sign in and try again.");

    let body: { orderID?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "INVALID_JSON", "The payment request was invalid.");
    }
    if (typeof body.orderID !== "string" || !ORDER_ID.test(body.orderID)) {
      throw new ApiError(400, "INVALID_ORDER_ID", "The PayPal order ID was invalid.");
    }

    const storedOrder = await loadStoredOrder(body.orderID, user.id);
    const expected = expectedFromStoredOrder(storedOrder);
    const accessToken = await generatePayPalAccessToken(id);

    const { response: getResponse, body: existingOrder } = await paypalRequest(`/v2/checkout/orders/${body.orderID}`, accessToken);
    if (!getResponse.ok) {
      throw new ApiError(getResponse.status === 404 ? 404 : 502, "PAYPAL_ORDER_LOOKUP_FAILED", "PayPal could not verify this order. Please try again.", {
        retryable: getResponse.status >= 500,
        internal: existingOrder.message || getResponse.status,
      });
    }
    validatePayPalPurchaseUnit(existingOrder.purchase_units?.[0], expected);

    let paypalOrder = existingOrder;
    if (existingOrder.status !== "COMPLETED") {
      if (existingOrder.status !== "APPROVED") {
        throw new ApiError(409, "ORDER_NOT_APPROVED", "Approve the payment in PayPal before completing checkout.");
      }

      const { response: captureResponse, body: captureBody } = await paypalRequest(
        `/v2/checkout/orders/${body.orderID}/capture`,
        accessToken,
        {
          method: "POST",
          headers: { "PayPal-Request-Id": `capture-${body.orderID}`.slice(0, 38) },
          body: "{}",
        },
      );

      if (!captureResponse.ok) {
        const issue = paypalIssue(captureBody);
        if (issue === "INSTRUMENT_DECLINED") {
          throw new ApiError(422, "INSTRUMENT_DECLINED", "PayPal declined that funding source. Choose another one and try again.", { retryable: true });
        }
        throw new ApiError(502, "PAYPAL_CAPTURE_FAILED", "PayPal could not complete the payment. Please try again.", {
          retryable: captureResponse.status >= 500,
          internal: issue || captureBody.message || captureResponse.status,
        });
      }
      paypalOrder = captureBody;
    }

    const capture = findCapture(paypalOrder);
    if (capture?.status === "PENDING") {
      return jsonResponse(req, {
        success: false,
        pending: true,
        message: "Your payment is processing. Premium will activate automatically when PayPal confirms it.",
        requestId: id,
      }, 202);
    }

    const { entitlement } = await fulfillOrder(storedOrder, paypalOrder);
    return jsonResponse(req, {
      success: true,
      pending: false,
      plan: storedOrder.plan_id,
      entitlement,
      requestId: id,
    }, 200);
  } catch (error) {
    if (error instanceof ApiError && error.status === 202) {
      return jsonResponse(req, {
        success: false,
        pending: true,
        message: error.message,
        requestId: id,
      }, 202);
    }
    return errorResponse(req, error, id, "capture-paypal-order");
  }
});
