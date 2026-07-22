import { ApiError } from "./http.ts";

export const PAYPAL_CURRENCY = "PHP";

export const PAYPAL_PLANS = {
  monthly: { id: "monthly", amount: 29_900, price: "299.00", name: "ApplyGuard Premium - 30 Days", days: 30 },
  yearly: { id: "yearly", amount: 299_000, price: "2990.00", name: "ApplyGuard Premium - 365 Days", days: 365 },
  pack: { id: "pack", amount: 14_900, price: "149.00", name: "ApplyGuard PH Message Pack", days: 0 },
} as const;

export type PayPalPlanId = keyof typeof PAYPAL_PLANS;

export type TrustedOrderMetadata = {
  version: 1;
  userId: string;
  plan: PayPalPlanId;
};

export function isPlanId(value: unknown): value is PayPalPlanId {
  return typeof value === "string" && Object.hasOwn(PAYPAL_PLANS, value);
}

export function buildTrustedOrderMetadata(userId: string, plan: PayPalPlanId): TrustedOrderMetadata {
  return { version: 1, userId, plan };
}

export function parseTrustedOrderMetadata(value: unknown): TrustedOrderMetadata {
  if (typeof value !== "string") {
    throw new ApiError(409, "ORDER_METADATA_INVALID", "This order could not be verified. Please start checkout again.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new ApiError(409, "ORDER_METADATA_INVALID", "This order could not be verified. Please start checkout again.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new ApiError(409, "ORDER_METADATA_INVALID", "This order could not be verified. Please start checkout again.");
  }

  const metadata = parsed as Record<string, unknown>;
  if (metadata.version !== 1 || typeof metadata.userId !== "string" || !isPlanId(metadata.plan)) {
    throw new ApiError(409, "ORDER_METADATA_INVALID", "This order could not be verified. Please start checkout again.");
  }

  return metadata as TrustedOrderMetadata;
}

export function amountToCentavos(value: unknown) {
  if (typeof value !== "string" || !/^\d+\.\d{2}$/.test(value)) {
    throw new ApiError(409, "ORDER_AMOUNT_INVALID", "This order amount could not be verified. Please start checkout again.");
  }
  return Math.round(Number(value) * 100);
}

type ExpectedOrder = {
  userId: string;
  plan: PayPalPlanId;
  amount: number;
  currency: string;
};

export function validatePayPalPurchaseUnit(purchaseUnit: Record<string, any> | undefined, expected: ExpectedOrder) {
  if (!purchaseUnit) {
    throw new ApiError(409, "ORDER_DETAILS_MISSING", "This order could not be verified. Please start checkout again.");
  }

  const metadata = parseTrustedOrderMetadata(purchaseUnit.custom_id);
  const amount = amountToCentavos(purchaseUnit.amount?.value);
  const currency = purchaseUnit.amount?.currency_code;

  if (metadata.userId !== expected.userId || metadata.plan !== expected.plan) {
    throw new ApiError(409, "ORDER_OWNER_MISMATCH", "This order does not belong to the signed-in account.");
  }
  if (amount !== expected.amount || currency !== expected.currency) {
    throw new ApiError(409, "ORDER_TOTAL_MISMATCH", "This order total could not be verified. Please start checkout again.");
  }

  return metadata;
}

export function findCapture(order: Record<string, any>) {
  const captures = order.purchase_units?.[0]?.payments?.captures;
  return Array.isArray(captures) ? captures[0] : null;
}

export function validateCompletedCapture(capture: Record<string, any> | null, expected: ExpectedOrder) {
  if (!capture || typeof capture.id !== "string") {
    throw new ApiError(502, "CAPTURE_MISSING", "PayPal did not return a completed payment. Please try again.", { retryable: true });
  }
  if (capture.status !== "COMPLETED") {
    throw new ApiError(202, "PAYMENT_PENDING", "Your payment is still processing. Premium will activate when PayPal confirms it.", { retryable: true });
  }

  const amount = amountToCentavos(capture.amount?.value);
  if (amount !== expected.amount || capture.amount?.currency_code !== expected.currency) {
    throw new ApiError(409, "CAPTURE_TOTAL_MISMATCH", "The captured payment total did not match the order.");
  }

  return capture;
}
