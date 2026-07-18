import { describe, it, expect } from "vitest";
import { effectiveTier, monthlyUsage, AI_MONTHLY_CAP } from "./entitlement.js";

const NOW = new Date("2026-07-18T10:00:00Z");

describe("effectiveTier", () => {
  it("returns free for null / undefined / non-object", () => {
    expect(effectiveTier(null, NOW)).toBe("free");
    expect(effectiveTier(undefined, NOW)).toBe("free");
    expect(effectiveTier("premium", NOW)).toBe("free");
  });

  it("returns free when tier is free", () => {
    expect(effectiveTier({ tier: "free", current_period_end: "2026-10-01" }, NOW)).toBe("free");
  });

  it("returns premium when tier is premium and paid-through date is today or future", () => {
    expect(effectiveTier({ tier: "premium", current_period_end: "2026-07-18" }, NOW)).toBe("premium");
    expect(effectiveTier({ tier: "premium", current_period_end: "2026-10-01" }, NOW)).toBe("premium");
  });

  it("returns free when paid-through date is in the past (expired)", () => {
    expect(effectiveTier({ tier: "premium", current_period_end: "2026-07-17" }, NOW)).toBe("free");
  });

  it("returns free when current_period_end is missing", () => {
    expect(effectiveTier({ tier: "premium" }, NOW)).toBe("free");
  });

  it("returns free when current_period_end is not a string", () => {
    expect(effectiveTier({ tier: "premium", current_period_end: 123 }, NOW)).toBe("free");
  });

  it("keeps premium across status values (past_due, cancelled) as long as date is current", () => {
    expect(effectiveTier({ tier: "premium", status: "past_due", current_period_end: "2026-10-01" }, NOW)).toBe("premium");
    expect(effectiveTier({ tier: "premium", status: "cancelled", current_period_end: "2026-10-01" }, NOW)).toBe("premium");
  });
});

describe("monthlyUsage", () => {
  const at = (iso) => ({ created_at: iso });

  it("counts only the current calendar month", () => {
    const rows = [at("2026-07-01T00:00:00Z"), at("2026-07-18T01:00:00Z"), at("2026-06-30T23:59:00Z")];
    expect(monthlyUsage(rows, NOW)).toBe(2);
  });

  it("is zero for empty input", () => {
    expect(monthlyUsage([], NOW)).toBe(0);
    expect(monthlyUsage(null, NOW)).toBe(0);
  });

  it("exposes the cap", () => {
    expect(AI_MONTHLY_CAP).toBe(60);
  });
});
