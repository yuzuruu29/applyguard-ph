import { describe, it, expect } from "vitest";
import { scanFlags, riskLevel } from "./redflags.js";

const CLEAN_POST = `We are a remote customer support team helping SaaS companies in the US.
You will manage our shared inbox, reply to customer emails in Zendesk, and keep our help docs up to date.
Requirements: solid written English, experience with customer support, and comfort with Zendesk.
This is a full-time, home-based role, 40 hours per week, day shift aligned to US business hours.
Pay is PHP 45,000 monthly, sent every 15th and 30th through Wise.
We run two short interviews before hiring. Apply with a note about your support background.`;

describe("scanFlags — hard flags", () => {
  it('flags a "training fee" as a HARD scam signal', () => {
    const { hard } = scanFlags(
      "Earn from home. Pay a one-time training fee of 1500 pesos to get started."
    );
    expect(hard.length).toBeGreaterThan(0);
    expect(hard.some((f) => f.id === "upfront-fee")).toBe(true);
  });

  it("flags requests for card / OTP details", () => {
    const { hard } = scanFlags("To onboard, send your card number and the OTP we text you.");
    expect(hard.some((f) => f.id === "bank-card-details")).toBe(true);
  });

  it("flags guaranteed income promises", () => {
    const { hard } = scanFlags("Guaranteed income of $300 per day, no skills required!");
    expect(hard.some((f) => f.id === "guaranteed-income")).toBe(true);
  });
});

describe("scanFlags — soft flags", () => {
  it("flags moving to WhatsApp/Telegram and urgency", () => {
    const { soft } = scanFlags("Urgent hiring! Message us on WhatsApp to start.");
    const ids = soft.map((f) => f.id);
    expect(ids).toContain("off-platform");
    expect(ids).toContain("urgency");
  });

  it("flags a personal email used for an official role", () => {
    const { soft } = scanFlags("Send your application to hr.recruiter2024@gmail.com.");
    expect(soft.some((f) => f.id === "personal-email")).toBe(true);
  });
});

describe("scanFlags — clean post", () => {
  it("finds no hard or soft flags in a well-written post", () => {
    const flags = scanFlags(CLEAN_POST);
    expect(flags.hard).toHaveLength(0);
    expect(flags.soft).toHaveLength(0);
  });
});

describe("riskLevel", () => {
  it("is High when any hard flag is present", () => {
    expect(riskLevel({ hard: [{ id: "x" }], soft: [] })).toBe("High");
  });

  it('"training fee" text resolves to High risk', () => {
    const flags = scanFlags("There is a training fee before we hire you.");
    expect(riskLevel(flags)).toBe("High");
  });

  it("is High with 3+ soft flags", () => {
    expect(riskLevel({ hard: [], soft: [{}, {}, {}] })).toBe("High");
  });

  it("is Medium with 1–2 soft flags", () => {
    expect(riskLevel({ hard: [], soft: [{}] })).toBe("Medium");
    expect(riskLevel({ hard: [], soft: [{}, {}] })).toBe("Medium");
  });

  it("is Low with no flags", () => {
    expect(riskLevel({ hard: [], soft: [] })).toBe("Low");
  });
});
