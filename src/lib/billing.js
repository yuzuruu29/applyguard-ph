// Browser-side PayPal helpers. Plan prices and fulfillment remain server-owned;
// the browser only requests an order ID and asks the server to reconcile it.

import { supabase } from "./supabase.js";

export class BillingError extends Error {
  constructor(message, { code = "BILLING_ERROR", status = 0, retryable = false, requestId = null } = {}) {
    super(message);
    this.name = "BillingError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.requestId = requestId;
  }
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function accessToken() {
  if (!supabase) throw new BillingError("Payments are not configured.", { code: "BACKEND_NOT_CONFIGURED" });
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new BillingError("Sign in before starting checkout.", { code: "AUTH_REQUIRED", status: 401 });
  return session.access_token;
}

function billingError(body, status) {
  const error = body?.error;
  return new BillingError(
    typeof error === "string" ? error : error?.message || "PayPal could not complete this request.",
    {
      code: error?.code || "PAYPAL_REQUEST_FAILED",
      status,
      retryable: Boolean(error?.retryable) || status >= 500,
      requestId: body?.requestId || null,
    },
  );
}

async function requestJson(path, { method = "POST", body, idempotencyKey, retries = 2 } = {}) {
  const token = await accessToken();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const responseBody = await response.json().catch(() => ({}));
      if (response.ok) return { body: responseBody, status: response.status };

      const error = billingError(responseBody, response.status);
      if (!error.retryable || attempt === retries) throw error;
      lastError = error;
    } catch (error) {
      const normalized = error instanceof BillingError
        ? error
        : new BillingError("The payment connection was interrupted. Retrying…", { code: "NETWORK_ERROR", retryable: true });
      if (!normalized.retryable || attempt === retries) throw normalized;
      lastError = normalized;
    }
    await wait(350 * (attempt + 1));
  }

  throw lastError || new BillingError("PayPal could not complete this request.");
}

export async function createPayPalOrder(planId) {
  const idempotencyKey = crypto.randomUUID();
  const { body } = await requestJson("create-paypal-order", {
    body: { plan: planId },
    idempotencyKey,
  });
  if (typeof body.id !== "string") throw new BillingError("PayPal did not return an order ID.", { code: "ORDER_ID_MISSING" });
  return body.id;
}

export async function capturePayPalOrder(orderID) {
  const { body } = await requestJson("capture-paypal-order", { body: { orderID }, retries: 3 });
  return body;
}

export async function downloadMessagePack() {
  const token = await accessToken();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-message-pack`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw billingError(body, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "ApplyGuard-PH-Message-Pack.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
