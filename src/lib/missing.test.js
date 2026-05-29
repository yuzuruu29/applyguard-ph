import { describe, it, expect } from "vitest";
import { detectMissingInfo } from "./missing.js";
import { buildClarificationPrompt, buildApplicationPrompt } from "./prompt.js";

const RATE_Q = "How much does this pay? No rate or salary is stated.";
const HOURS_Q = "How many hours per week? The time commitment isn't clear.";

const FULL_POST = `We are a remote customer support team helping SaaS companies.
You will manage our shared inbox and reply to customer emails in Zendesk.
Requirements: strong written English and customer support experience.
This is a full-time, home-based role, 40 hours per week.
Pay is PHP 45,000 monthly, sent every 15th and 30th through Wise.`;

const FULL_INTAKE = {
  role: "Customer Support Specialist",
  skills: "customer support, email, zendesk",
  experience: "Intermediate",
  rate: 45000,
  rateType: "Monthly",
  hours: "40+ hrs/week",
};

describe("detectMissingInfo", () => {
  it("reports missing rate and hours when neither post nor intake states them", () => {
    const raw =
      "Looking for a virtual assistant for a long-term role. You will handle admin tasks and scheduling. Message me if interested.";
    const intake = { role: "VA", skills: "admin", rate: 0, rateType: "Not stated", hours: "Not stated" };
    const missing = detectMissingInfo(raw, intake);
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).toContain(RATE_Q);
    expect(missing).toContain(HOURS_Q);
  });

  it("returns an empty list for a complete post + intake", () => {
    expect(detectMissingInfo(FULL_POST, FULL_INTAKE)).toEqual([]);
  });

  it("uses the pasted post even when intake is blank", () => {
    const missing = detectMissingInfo(FULL_POST, {});
    expect(missing).not.toContain(RATE_Q);
    expect(missing).not.toContain(HOURS_Q);
  });
});

describe("clarification prompt is used when info is missing", () => {
  it("buildClarificationPrompt lists the missing questions and quotes the post", () => {
    const raw = "Looking for a VA. Message me if interested.";
    const missingInfo = detectMissingInfo(raw, { rate: 0, rateType: "Not stated", hours: "Not stated" });
    const prompt = buildClarificationPrompt({ rawText: raw, missingInfo });
    expect(typeof prompt).toBe("string");
    expect(prompt).toContain(RATE_Q);
    expect(prompt).toContain(HOURS_Q);
    expect(prompt).toContain(raw);
  });

  it("buildApplicationPrompt is the one that quotes my skills (used when nothing is missing)", () => {
    const prompt = buildApplicationPrompt({ rawText: FULL_POST, intake: FULL_INTAKE }, { name: "Jules" });
    expect(prompt).toContain("Jules");
    expect(prompt).toContain("zendesk");
  });
});
