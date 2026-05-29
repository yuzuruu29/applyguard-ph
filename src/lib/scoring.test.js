import { describe, it, expect } from "vitest";
import { computeScore, deriveVerdict } from "./scoring.js";
import { scanFlags, riskLevel } from "./redflags.js";
import { detectMissingInfo } from "./missing.js";

const CLEAN_POST = `We are a remote customer support team helping SaaS companies in the US.
You will manage our shared inbox, reply to customer emails in Zendesk, and keep our help docs up to date.
Requirements: solid written English, experience with customer support, and comfort with Zendesk.
This is a full-time, home-based role, 40 hours per week, day shift aligned to US business hours.
Pay is PHP 45,000 monthly, sent every 15th and 30th through Wise.
We run two short interviews before hiring.`;

const GOOD_INTAKE = {
  role: "Customer Support Specialist",
  skills: "customer support, email, zendesk",
  experience: "Intermediate",
  rate: 45000,
  rateType: "Monthly",
  hours: "40+ hrs/week",
};

const SETTINGS = { minRate: 30000, currency: "PHP" };

// Helper that mirrors how the app assembles a job before scoring.
function buildJob(rawText, intake, settings = SETTINGS) {
  const flags = scanFlags(rawText, intake);
  return { rawText, intake, settings, flags };
}

describe("computeScore — fit components", () => {
  it("sums the four components to 100 before penalties", () => {
    const { breakdown } = computeScore(buildJob(CLEAN_POST, GOOD_INTAKE));
    const sum = breakdown.components.reduce((a, c) => a + c.value, 0);
    expect(sum).toBe(breakdown.base);
    const maxSum = breakdown.components.reduce((a, c) => a + c.max, 0);
    expect(maxSum).toBe(100);
  });

  it("a clean, well-paid, skill-matched post scores 80+", () => {
    const { score } = computeScore(buildJob(CLEAN_POST, GOOD_INTAKE));
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it("subtracts 8 per soft flag with a floor of 0", () => {
    const job = buildJob(CLEAN_POST, GOOD_INTAKE);
    const baseline = computeScore(job).score;
    const withOneSoft = computeScore({ ...job, flags: { hard: [], soft: [{ id: "a" }] } }).score;
    expect(withOneSoft).toBe(baseline - 8);

    const floored = computeScore({
      ...job,
      flags: { hard: [], soft: Array.from({ length: 20 }, (_, i) => ({ id: i })) },
    }).score;
    expect(floored).toBe(0);
  });

  it("caps fit at 15 when any hard flag is present", () => {
    const raw = "Earn from home. Pay a one-time training fee of 1500 pesos to get started.";
    const { score } = computeScore(buildJob(raw, {}));
    expect(score).toBeLessThanOrEqual(15);
  });
});

describe("deriveVerdict", () => {
  it("a clean, skill-matched, well-paid post => Apply", () => {
    const job = buildJob(CLEAN_POST, GOOD_INTAKE);
    const { score } = computeScore(job);
    const risk = riskLevel(job.flags);
    const missing = detectMissingInfo(CLEAN_POST, GOOD_INTAKE);
    expect(risk).toBe("Low");
    expect(missing).toEqual([]);
    expect(deriveVerdict(score, risk, missing)).toBe("Apply");
  });

  it('"training fee" => High risk, Skip verdict', () => {
    const raw = "Earn from home. Pay a one-time training fee of 1500 pesos to get started.";
    const job = buildJob(raw, {});
    const { score } = computeScore(job);
    const risk = riskLevel(job.flags);
    expect(job.flags.hard.length).toBeGreaterThan(0);
    expect(risk).toBe("High");
    expect(deriveVerdict(score, risk, [])).toBe("Skip");
  });

  it("missing info forces Caution even with a decent score", () => {
    expect(deriveVerdict(85, "Low", ["How much does this pay?"])).toBe("Caution");
  });

  it("medium risk => Caution", () => {
    expect(deriveVerdict(90, "Medium", [])).toBe("Caution");
  });

  it("a clean but poor-fit post (low score, no risk) => Skip", () => {
    expect(deriveVerdict(30, "Low", [])).toBe("Skip");
  });
});
