import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ApiError } from "./http.ts";
import {
  findCapture,
  PAYPAL_CURRENCY,
  PAYPAL_PLANS,
  PayPalPlanId,
  validateCompletedCapture,
  validatePayPalPurchaseUnit,
} from "./paypal.ts";

export function requireLivePayPal() {
  if (Deno.env.get("PAYPAL_ENVIRONMENT") !== "production") {
    throw new ApiError(503, "PAYPAL_NOT_LIVE", "Live PayPal checkout is temporarily unavailable.", { retryable: true });
  }

  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new ApiError(503, "PAYPAL_NOT_CONFIGURED", "Live PayPal checkout is temporarily unavailable.", { retryable: true });
  }

  return { clientId, clientSecret, apiBase: "https://api-m.paypal.com" };
}

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function generatePayPalAccessToken(requestId: string) {
  const { clientId, clientSecret, apiBase } = requireLivePayPal();
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "PayPal-Request-Id": requestId.slice(0, 38),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.access_token !== "string") {
    throw new ApiError(502, "PAYPAL_AUTH_FAILED", "PayPal is temporarily unavailable. Please try again.", {
      retryable: true,
      internal: data.error_description || data.error || response.status,
    });
  }
  return data.access_token as string;
}

export async function paypalRequest(path: string, accessToken: string, init: RequestInit = {}) {
  const { apiBase } = requireLivePayPal();
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

export type StoredPayPalOrder = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  plan_id: PayPalPlanId;
  raw: Record<string, unknown>;
};

export async function loadStoredOrder(orderId: string, userId?: string): Promise<StoredPayPalOrder> {
  const supabase = adminClient();
  let query = supabase
    .from("payments")
    .select("id,user_id,amount,currency,status,plan_id,raw")
    .eq("id", orderId)
    .eq("provider_event_type", "paypal.order.created");
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new ApiError(500, "ORDER_LOOKUP_FAILED", "We could not verify this order. Please try again.", { retryable: true, internal: error.message });
  }
  if (!data || !Object.hasOwn(PAYPAL_PLANS, data.plan_id)) {
    throw new ApiError(404, "ORDER_NOT_FOUND", "This PayPal order was not found for the signed-in account.");
  }
  return data as StoredPayPalOrder;
}

export function expectedFromStoredOrder(order: StoredPayPalOrder) {
  const plan = PAYPAL_PLANS[order.plan_id];
  if (order.amount !== plan.amount || order.currency !== PAYPAL_CURRENCY) {
    throw new ApiError(409, "STORED_ORDER_INVALID", "This order could not be verified. Please start checkout again.");
  }
  return { userId: order.user_id, plan: order.plan_id, amount: plan.amount, currency: PAYPAL_CURRENCY };
}

export async function fulfillOrder(order: StoredPayPalOrder, paypalOrder: Record<string, any>) {
  const expected = expectedFromStoredOrder(order);
  const purchaseUnit = paypalOrder.purchase_units?.[0];
  validatePayPalPurchaseUnit(purchaseUnit, expected);
  const capture = validateCompletedCapture(findCapture(paypalOrder), expected);

  const raw = {
    order_id: order.id,
    capture_id: capture.id,
    status: capture.status,
    amount: capture.amount,
    create_time: capture.create_time || null,
    update_time: capture.update_time || null,
  };

  const { data, error } = await adminClient().rpc("fulfill_paypal_capture", {
    p_capture_id: capture.id,
    p_order_id: order.id,
    p_user_id: order.user_id,
    p_plan_id: order.plan_id,
    p_amount: expected.amount,
    p_currency: expected.currency,
    p_capture_status: capture.status,
    p_raw: raw,
  });

  if (error) {
    throw new ApiError(500, "FULFILLMENT_FAILED", "Your payment was received, but activation is still processing. Please retry from this page or contact support.", {
      retryable: true,
      internal: error.message,
    });
  }

  const { error: orderUpdateError } = await adminClient()
    .from("payments")
    .update({ status: "COMPLETED", raw: { ...(order.raw || {}), capture_id: capture.id } })
    .eq("id", order.id);
  if (orderUpdateError) {
    console.error(JSON.stringify({ operation: "mark-paypal-order-completed", orderId: order.id, error: orderUpdateError.message }));
  }

  return { capture, entitlement: data };
}
