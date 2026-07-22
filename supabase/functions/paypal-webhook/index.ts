import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { ApiError, errorResponse, jsonResponse, optionsResponse, requestId } from "../_shared/http.ts";
import {
  fulfillOrder,
  generatePayPalAccessToken,
  loadStoredOrder,
  paypalRequest,
  requireLivePayPal,
} from "../_shared/paypal-runtime.ts";

const WEBHOOK_EVENT = "PAYMENT.CAPTURE.COMPLETED";

function requiredHeader(req: Request, name: string) {
  const value = req.headers.get(name);
  if (!value) throw new ApiError(400, "WEBHOOK_HEADERS_MISSING", "Required PayPal webhook headers were missing.");
  return value;
}

async function configureWebhook(req: Request, id: string) {
  const setupToken = Deno.env.get("PAYPAL_SETUP_TOKEN");
  if (!setupToken || req.headers.get("X-PayPal-Setup-Token") !== setupToken) {
    throw new ApiError(404, "NOT_FOUND", "Not found.");
  }

  const accessToken = await generatePayPalAccessToken(id);
  const { clientId } = requireLivePayPal();
  const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/paypal-webhook`;
  const { response: listResponse, body: listBody } = await paypalRequest("/v1/notifications/webhooks", accessToken);
  if (!listResponse.ok) {
    throw new ApiError(502, "PAYPAL_WEBHOOK_LIST_FAILED", "PayPal webhook setup failed.", { internal: listBody.message || listResponse.status });
  }

  const existing = Array.isArray(listBody.webhooks)
    ? listBody.webhooks.find((item: Record<string, any>) => item.url === webhookUrl)
    : null;
  if (existing?.id) {
    return jsonResponse(req, { id: existing.id, url: webhookUrl, clientId, existing: true, requestId: id });
  }

  const { response, body } = await paypalRequest("/v1/notifications/webhooks", accessToken, {
    method: "POST",
    body: JSON.stringify({ url: webhookUrl, event_types: [{ name: WEBHOOK_EVENT }] }),
  });
  if (!response.ok || typeof body.id !== "string") {
    throw new ApiError(502, "PAYPAL_WEBHOOK_CREATE_FAILED", "PayPal webhook setup failed.", {
      internal: body.message || body.name || response.status,
    });
  }
  return jsonResponse(req, { id: body.id, url: webhookUrl, clientId, existing: false, requestId: id }, 201);
}

serve(async (req) => {
  const id = requestId(req);
  if (req.method === "OPTIONS") return optionsResponse(req);

  try {
    if (req.method === "PUT") return await configureWebhook(req, id);
    if (req.method !== "POST") throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed.");

    const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
    if (!webhookId) {
      throw new ApiError(503, "WEBHOOK_NOT_CONFIGURED", "PayPal webhook verification is not configured.", { retryable: true });
    }

    const rawBody = await req.text();
    let event: Record<string, any>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new ApiError(400, "INVALID_WEBHOOK_JSON", "Invalid webhook payload.");
    }

    const accessToken = await generatePayPalAccessToken(id);
    const { response: verifyResponse, body: verifyBody } = await paypalRequest(
      "/v1/notifications/verify-webhook-signature",
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({
          transmission_id: requiredHeader(req, "PayPal-Transmission-Id"),
          transmission_time: requiredHeader(req, "PayPal-Transmission-Time"),
          cert_url: requiredHeader(req, "PayPal-Cert-Url"),
          auth_algo: requiredHeader(req, "PayPal-Auth-Algo"),
          transmission_sig: requiredHeader(req, "PayPal-Transmission-Sig"),
          webhook_id: webhookId,
          webhook_event: event,
        }),
      },
    );

    if (!verifyResponse.ok || verifyBody.verification_status !== "SUCCESS") {
      throw new ApiError(401, "WEBHOOK_SIGNATURE_INVALID", "Invalid PayPal webhook signature.", {
        internal: verifyBody.verification_status || verifyBody.message || verifyResponse.status,
      });
    }

    if (event.event_type !== WEBHOOK_EVENT) {
      return jsonResponse(req, { received: true, ignored: true, requestId: id });
    }

    const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
    if (typeof orderId !== "string") {
      throw new ApiError(400, "WEBHOOK_ORDER_MISSING", "PayPal webhook did not include an order ID.");
    }

    const storedOrder = await loadStoredOrder(orderId);
    const { response: orderResponse, body: paypalOrder } = await paypalRequest(`/v2/checkout/orders/${orderId}`, accessToken);
    if (!orderResponse.ok) {
      throw new ApiError(502, "PAYPAL_ORDER_LOOKUP_FAILED", "PayPal order reconciliation failed.", {
        retryable: true,
        internal: paypalOrder.message || orderResponse.status,
      });
    }

    const { entitlement } = await fulfillOrder(storedOrder, paypalOrder);
    return jsonResponse(req, { received: true, fulfilled: true, entitlement, requestId: id });
  } catch (error) {
    return errorResponse(req, error, id, "paypal-webhook");
  }
});
