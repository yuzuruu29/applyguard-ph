import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackerStats } from "./stats.js";

// ── helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-07-18";

/** Build a minimal tracker job, merging overrides on top of defaults. */
const job = (overrides = {}) => ({
  id: "j1",
  status: "Saved",
  followUpBy: "",
  title: "Test Job",
  rawText: "",
  intake: {},
  score: 50,
  breakdown: {},
  verdict: "Caution",
  riskLevel: "Medium",
  missingInfo: [],
  flags: { hard: [], soft: [] },
  notes: "",
  createdAt: "2026-07-10",
  updatedAt: "2026-07-10",
  ...overrides,
});

// ── freeze today ───────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-18T12:00:00+08:00"));
});

afterEach(() => {
  vi.useRealTimers();
});

// ── trackerStats ──────────────────────────────────────────────────────────

describe("trackerStats", () => {
  it("returns correct defaults for an empty array", () => {
    expect(trackerStats([])).toEqual({
      total: 0,
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      closed: 0,
      highRiskDodged: 0,
      overdueFollowUps: 0,
      bestScore: null,
      avgScore: null,
    });
  });

  it("handles null, undefined, and non-array input gracefully", () => {
    const empty = {
      total: 0,
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      closed: 0,
      highRiskDodged: 0,
      overdueFollowUps: 0,
      bestScore: null,
      avgScore: null,
    };
    expect(trackerStats(null)).toEqual(empty);
    expect(trackerStats(undefined)).toEqual(empty);
    expect(trackerStats("not an array")).toEqual(empty);
  });

  it("counts a single Saved job correctly", () => {
    const result = trackerStats([job({ status: "Saved", score: 72 })]);
    expect(result).toEqual({
      total: 1,
      saved: 1,
      applied: 0,
      interview: 0,
      offer: 0,
      closed: 0,
      highRiskDodged: 0,
      overdueFollowUps: 0,
      bestScore: 72,
      avgScore: 72,
    });
  });

  it("counts individual statuses correctly", () => {
    expect(trackerStats([job({ status: "Applied", score: 60 })]).applied).toBe(1);
    expect(trackerStats([job({ status: "Interview", score: 80 })]).interview).toBe(1);
    expect(trackerStats([job({ status: "Offer", score: 90 })]).offer).toBe(1);
    expect(trackerStats([job({ status: "Closed", score: 45 })]).closed).toBe(1);
  });

  it("counts mixed statuses correctly", () => {
    const jobs = [
      job({ id: "a", status: "Saved", score: 50 }),
      job({ id: "b", status: "Saved", score: 60 }),
      job({ id: "c", status: "Applied", score: 70 }),
      job({ id: "d", status: "Applied", score: 80 }),
      job({ id: "e", status: "Applied", score: 90 }),
      job({ id: "f", status: "Interview", score: 75 }),
      job({ id: "g", status: "Offer", score: 95 }),
      job({ id: "h", status: "Closed", score: 40 }),
      job({ id: "i", status: "Closed", score: 30 }),
    ];

    const result = trackerStats(jobs);

    expect(result.total).toBe(9);
    expect(result.saved).toBe(2);
    expect(result.applied).toBe(3);
    expect(result.interview).toBe(1);
    expect(result.offer).toBe(1);
    expect(result.closed).toBe(2);
    expect(result.bestScore).toBe(95);
    // avg = (50+60+70+80+90+75+95+40+30)/9 = 590/9 = 65.555… → 66
    expect(result.avgScore).toBe(66);
  });

  it("counts highRiskDodged only for High risk + Applied/Offer", () => {
    const jobs = [
      job({ id: "a", status: "Applied", riskLevel: "High" }),
      job({ id: "b", status: "Offer", riskLevel: "High" }),
      job({ id: "c", status: "Saved", riskLevel: "High" }),       // wrong status
      job({ id: "d", status: "Interview", riskLevel: "High" }),    // wrong status
      job({ id: "e", status: "Closed", riskLevel: "High" }),       // wrong status
      job({ id: "f", status: "Applied", riskLevel: "Medium" }),    // wrong risk
      job({ id: "g", status: "Offer", riskLevel: "Low" }),          // wrong risk
    ];

    expect(trackerStats(jobs).highRiskDodged).toBe(2);
  });

  it("counts overdueFollowUps for past followUpBy on non-Closed jobs", () => {
    const jobs = [
      job({ id: "a", status: "Applied", followUpBy: "2026-07-15" }),   // overdue
      job({ id: "b", status: "Saved", followUpBy: "2026-07-17" }),     // overdue
      job({ id: "c", status: "Closed", followUpBy: "2026-07-01" }),    // closed → excluded
      job({ id: "d", status: "Interview", followUpBy: TODAY }),         // today → not overdue
      job({ id: "e", status: "Offer", followUpBy: "2026-07-25" }),      // future
      job({ id: "f", status: "Applied", followUpBy: "" }),              // empty
      job({ id: "g", status: "Applied" }),                              // no key
    ];

    expect(trackerStats(jobs).overdueFollowUps).toBe(2);
  });

  it("finds bestScore among mixed scores", () => {
    const result = trackerStats([
      job({ id: "a", score: 10 }),
      job({ id: "b", score: 90 }),
      job({ id: "c", score: 50 }),
    ]);

    expect(result.bestScore).toBe(90);
  });

  it("computes avgScore correctly", () => {
    const result = trackerStats([
      job({ id: "a", score: 10 }),
      job({ id: "b", score: 90 }),
      job({ id: "c", score: 50 }),
    ]);

    // (10 + 90 + 50) / 3 = 50
    expect(result.avgScore).toBe(50);
  });

  it("rounds avgScore to nearest integer", () => {
    // 65 + 66 = 131, avg = 65.5 → Math.round = 66
    const result = trackerStats([
      job({ id: "a", score: 65 }),
      job({ id: "b", score: 66 }),
    ]);
    expect(result.avgScore).toBe(66);
  });

  it("returns null bestScore and avgScore when no jobs have numeric scores", () => {
    const jobs = [
      job({ id: "a", score: undefined }),
      job({ id: "b", score: null }),
      job({ id: "c" }),
    ];
    delete jobs[2].score;

    const result = trackerStats(jobs);

    expect(result.bestScore).toBeNull();
    expect(result.avgScore).toBeNull();
  });

  it("total counts all jobs including those without scores", () => {
    const jobs = [
      job({ id: "a", status: "Saved", score: 80 }),
      job({ id: "b", status: "Applied", score: undefined }),
    ];
    // delete score from b so it truly has no numeric score
    delete jobs[1].score;

    const result = trackerStats(jobs);

    expect(result.total).toBe(2);
    expect(result.saved).toBe(1);
    expect(result.applied).toBe(1);
    expect(result.bestScore).toBe(80);
    expect(result.avgScore).toBe(80); // only one scored job
  });
});
