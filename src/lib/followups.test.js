import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { followUpState, dueFollowUps, todayLocalISO } from "./followups.js";

// ── helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-07-18";

/** Build a minimal tracker job, merging overrides on top of defaults. */
const job = (overrides = {}) => ({
  id: "j1",
  status: "Applied",
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
  // Noon in the Philippines – safely mid-day in any APAC timezone.
  vi.setSystemTime(new Date("2026-07-18T12:00:00+08:00"));
});

afterEach(() => {
  vi.useRealTimers();
});

// ── todayLocalISO ──────────────────────────────────────────────────────────

describe("todayLocalISO", () => {
  it("returns a string matching YYYY-MM-DD", () => {
    expect(todayLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the mocked today when system time is frozen", () => {
    expect(todayLocalISO()).toBe(TODAY);
  });
});

// ── followUpState ─────────────────────────────────────────────────────────

describe("followUpState", () => {
  it('returns "none" (with empty date) when followUpBy is empty', () => {
    expect(followUpState(job({ followUpBy: "" }))).toEqual({
      state: "none",
      date: "",
    });
  });

  it('returns "none" (with empty date) when followUpBy is undefined', () => {
    const j = job();
    delete j.followUpBy;
    expect(followUpState(j)).toEqual({ state: "none", date: "" });
  });

  it('returns "none" for closed jobs even when overdue', () => {
    expect(
      followUpState(job({ status: "Closed", followUpBy: "2026-07-01" }))
    ).toEqual({ state: "none", date: "" });
  });

  it('returns "overdue" for dates before today', () => {
    expect(followUpState(job({ followUpBy: "2026-07-17" }))).toEqual({
      state: "overdue",
      date: "2026-07-17",
    });
  });

  it('returns "today" for the exact date', () => {
    expect(followUpState(job({ followUpBy: TODAY }))).toEqual({
      state: "today",
      date: TODAY,
    });
  });

  it('returns "upcoming" for future dates', () => {
    expect(followUpState(job({ followUpBy: "2026-07-19" }))).toEqual({
      state: "upcoming",
      date: "2026-07-19",
    });
  });

  it("never throws on a malformed job", () => {
    expect(followUpState(null)).toEqual({ state: "none", date: "" });
    expect(followUpState({ followUpBy: 42 })).toEqual({
      state: "none",
      date: "",
    });
    expect(followUpState(undefined)).toEqual({ state: "none", date: "" });
  });

  it("treats whitespace-only followUpBy as empty", () => {
    expect(followUpState(job({ followUpBy: "   " }))).toEqual({
      state: "none",
      date: "",
    });
  });
});

// ── dueFollowUps ───────────────────────────────────────────────────────────

describe("dueFollowUps", () => {
  it("groups jobs into overdue, today, and upcoming", () => {
    const jobs = [
      job({ id: "a", followUpBy: "2026-07-01" }),
      job({ id: "b", followUpBy: "2026-07-15" }),
      job({ id: "c", followUpBy: TODAY }),
      job({ id: "d", followUpBy: "2026-07-31" }),
      job({ id: "e", followUpBy: "2026-08-15" }),
    ];

    const result = dueFollowUps(jobs);

    expect(result.overdue.map((j) => j.id)).toEqual(["a", "b"]);
    expect(result.today.map((j) => j.id)).toEqual(["c"]);
    expect(result.upcoming.map((j) => j.id)).toEqual(["d", "e"]);
  });

  it("sorts each bucket by followUpBy ascending", () => {
    const jobs = [
      job({ id: "a", followUpBy: "2026-07-15" }),
      job({ id: "b", followUpBy: "2026-07-01" }),
      job({ id: "c", followUpBy: "2026-08-15" }),
      job({ id: "d", followUpBy: "2026-07-31" }),
    ];

    const result = dueFollowUps(jobs);

    // overdue: 07-01 < 07-15, so b before a
    expect(result.overdue.map((j) => j.id)).toEqual(["b", "a"]);
    // upcoming: 07-31 < 08-15, so d before c
    expect(result.upcoming.map((j) => j.id)).toEqual(["d", "c"]);
  });

  it("excludes closed jobs from all buckets", () => {
    const jobs = [
      job({ id: "a", followUpBy: "2026-07-01" }),
      job({ id: "b", status: "Closed", followUpBy: "2026-07-01" }),
      job({ id: "c", status: "Closed", followUpBy: TODAY }),
      job({ id: "d", status: "Closed", followUpBy: "2026-08-15" }),
    ];

    const result = dueFollowUps(jobs);

    expect(result.overdue.map((j) => j.id)).toEqual(["a"]);
    expect(result.today).toHaveLength(0);
    expect(result.upcoming).toHaveLength(0);
  });

  it("skips jobs with empty followUpBy", () => {
    const jobs = [
      job({ id: "a", followUpBy: "2026-07-01" }),
      job({ id: "b", followUpBy: "" }),
      job({ id: "c", followUpBy: TODAY }),
      job({ id: "d" }), // no followUpBy key at all
    ];

    const result = dueFollowUps(jobs);

    expect(result.overdue.map((j) => j.id)).toEqual(["a"]);
    expect(result.today.map((j) => j.id)).toEqual(["c"]);
    expect(result.upcoming).toHaveLength(0);
  });

  it("returns empty buckets for non-array or null input", () => {
    const empty = { overdue: [], today: [], upcoming: [] };
    expect(dueFollowUps(null)).toEqual(empty);
    expect(dueFollowUps(undefined)).toEqual(empty);
    expect(dueFollowUps("not an array")).toEqual(empty);
  });

  it("returns empty buckets for an empty array", () => {
    expect(dueFollowUps([])).toEqual({
      overdue: [],
      today: [],
      upcoming: [],
    });
  });

  it("handles jobs with only upcoming follow-ups", () => {
    const jobs = [
      job({ id: "x", followUpBy: "2026-08-01" }),
      job({ id: "y", followUpBy: "2026-09-15" }),
    ];

    const result = dueFollowUps(jobs);

    expect(result.overdue).toHaveLength(0);
    expect(result.today).toHaveLength(0);
    expect(result.upcoming.map((j) => j.id)).toEqual(["x", "y"]);
  });
});
