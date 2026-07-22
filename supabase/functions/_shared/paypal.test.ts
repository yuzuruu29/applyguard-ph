import { describe, expect, it } from "vitest";
import {
  amountToCentavos,
  buildTrustedOrderMetadata,
  PAYPAL_CURRENCY,
  PAYPAL_PLANS,
  parseTrustedOrderMetadata,
  validateCompletedCapture,
  validatePayPalPurchaseUnit,
} from "./paypal.ts";

const expected = {
  userId: "8f1ac019-fd03-4de5-a932-281a15531aca",
  plan: "monthly" as const,
  amount: PAYPAL_PLANS.monthly.amount,
  currency: PAYPAL_CURRENCY,
};

function purchaseUnit(overrides: Record<string, unknown> = {}) {
  return {
    custom_id: JSON.stringify(buildTrustedOrderMetadata(expected.userId, expected.plan)),
    amount: { value: PAYPAL_PLANS.monthly.price, currency_code: PAYPAL_CURRENCY },
    ...overrides,
  };
}

describe("trusted PayPal order metadata", () => {
  it("contains only server-owned identity and plan fields", () => {
    expect(buildTrustedOrderMetadata(expected.userId, "pack")).toEqual({
      version: 1,
      userId: expected.userId,
      plan: "pack",
    });
  });

  it("rejects missing, malformed, and unknown plans", () => {
    expect(() => parseTrustedOrderMetadata(null)).toThrow("order could not be verified");
    expect(() => parseTrustedOrderMetadata("not-json")).toThrow("order could not be verified");
    expect(() => parseTrustedOrderMetadata(JSON.stringify({ version: 1, userId: expected.userId, plan: "lifetime" })))
      .toThrow("order could not be verified");
  });
});

describe("PayPal total verification", () => {
  it("converts strict two-decimal PHP values to centavos", () => {
    expect(amountToCentavos("299.00")).toBe(29_900);
    expect(() => amountToCentavos("299")).toThrow("amount could not be verified");
  });

  it("accepts the exact user, plan, currency, and amount", () => {
    expect(validatePayPalPurchaseUnit(purchaseUnit(), expected)).toEqual({
      version: 1,
      userId: expected.userId,
      plan: "monthly",
    });
  });

  it("rejects plan substitution and underpayment", () => {
    const yearlyMetadata = JSON.stringify(buildTrustedOrderMetadata(expected.userId, "yearly"));
    expect(() => validatePayPalPurchaseUnit(purchaseUnit({ custom_id: yearlyMetadata }), expected))
      .toThrow("does not belong");
    expect(() => validatePayPalPurchaseUnit(purchaseUnit({ amount: { value: "149.00", currency_code: "PHP" } }), expected))
      .toThrow("total could not be verified");
  });

  it("rejects non-completed captures and accepts exact completed captures", () => {
    const pending = { id: "CAPTURE1", status: "PENDING", amount: { value: "299.00", currency_code: "PHP" } };
    expect(() => validateCompletedCapture(pending, expected)).toThrow("still processing");

    const completed = { ...pending, status: "COMPLETED" };
    expect(validateCompletedCapture(completed, expected)).toBe(completed);
  });
});
