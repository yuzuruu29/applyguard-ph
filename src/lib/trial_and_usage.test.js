import { describe, it, expect } from "vitest";
import { effectiveTier, trialState, TRIAL_ALLOWANCES } from "./entitlement.js";
import { calculateHaikuCostUsd, DAILY_BUDGET_CIRCUIT_BREAKER, DAILY_BUDGET_WARNING, DAILY_BUDGET_ADMIN_ALERT } from "../../supabase/functions/_shared/budget.ts";

const NOW = new Date("2026-07-23T10:00:00Z");

describe("Trial & Usage System Unit Tests", () => {
  describe("trialState function", () => {
    it("returns eligible status for default user entitlement", () => {
      const state = trialState({ trial_status: "eligible" }, NOW);
      expect(state.status).toBe("eligible");
      expect(state.isTrialActive).toBe(false);
      expect(state.daysRemaining).toBe(7);
    });

    it("returns active status and calculates days remaining for active trial", () => {
      const expiresAt = new Date("2026-07-28T10:00:00Z").toISOString();
      const state = trialState({ trial_status: "active", trial_expires_at: expiresAt }, NOW);
      expect(state.isTrialActive).toBe(true);
      expect(state.isExpired).toBe(false);
      expect(state.daysRemaining).toBe(5);
    });

    it("marks trial as expired when past trial_expires_at", () => {
      const expiresAt = new Date("2026-07-22T10:00:00Z").toISOString();
      const state = trialState({ trial_status: "active", trial_expires_at: expiresAt }, NOW);
      expect(state.isTrialActive).toBe(false);
      expect(state.isExpired).toBe(true);
      expect(state.status).toBe("expired");
    });

    it("identifies converted trial status upon paid subscription", () => {
      const state = trialState({ trial_status: "converted" }, NOW);
      expect(state.isConverted).toBe(true);
      expect(state.isTrialActive).toBe(false);
    });

    it("paid access overrides trial limits in effectiveTier", () => {
      const entitlement = {
        tier: "premium",
        status: "active",
        current_period_end: "2026-08-23",
        trial_status: "converted",
      };
      expect(effectiveTier(entitlement, NOW)).toBe("premium");
    });
  });

  describe("Phase 5 & 6 Budget, Pricing & Abuse Control Tests", () => {
    it("calculates cost accurately for Haiku 4.5 standard and cache tokens", () => {
      // 100k input ($0.10), 10k output ($0.05), 50k cache read ($0.005), 10k cache create ($0.0125)
      const usage = {
        input_tokens: 100_000,
        output_tokens: 10_000,
        cache_read_input_tokens: 50_000,
        cache_creation_input_tokens: 10_000,
      };
      const cost = calculateHaikuCostUsd(usage);
      expect(cost).toBeCloseTo(0.1675, 4);
    });

    it("enforces correct daily budget thresholds", () => {
      expect(DAILY_BUDGET_WARNING).toBe(3.00);
      expect(DAILY_BUDGET_ADMIN_ALERT).toBe(5.00);
      expect(DAILY_BUDGET_CIRCUIT_BREAKER).toBe(10.00);
    });
  });

  describe("Trial Feature Quotas & Allowances", () => {
    it("defines correct feature allowances for trial period", () => {
      expect(TRIAL_ALLOWANCES.deep_scan).toBe(3);
      expect(TRIAL_ALLOWANCES.resume).toBe(2);
      expect(TRIAL_ALLOWANCES.outreach).toBe(5);
      expect(TRIAL_ALLOWANCES.mock_interview).toBe(1);
      expect(TRIAL_ALLOWANCES.backgroundcheck).toBe(2);
    });
  });
});
