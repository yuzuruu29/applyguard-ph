// backgroundcheck.test.js — daily free-check limit + local-date semantics.
// The free tier allows DAILY_FREE_LIMIT heuristic checks per LOCAL day.
// Regression test: the day key must follow the user's local calendar date
// (like todayLocalISO in followups.js), NOT UTC — UTC would reset the limit
// at 8 AM in the Philippines (UTC+8) instead of midnight.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  STORAGE_KEY,
  DAILY_FREE_LIMIT,
  getFreeChecksUsed,
  incrementFreeCheck,
  canUseFreeCheck,
} from "./backgroundcheck.js";

// ── localStorage stub (vitest env is "node", not jsdom) ──────────────
let store;

beforeEach(() => {
  store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  delete globalThis.localStorage;
});

/** Independent local-calendar-date computation (local getters), used as the
 *  portable expectation so the test passes in any runner timezone. */
const localKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

describe("daily free-check limit", () => {
  it("starts unused and allows checks up to the daily limit", () => {
    vi.setSystemTime(new Date("2026-07-18T12:00:00+08:00"));

    expect(getFreeChecksUsed()).toBe(0);
    expect(canUseFreeCheck()).toBe(true);

    for (let i = 1; i <= DAILY_FREE_LIMIT; i += 1) {
      expect(incrementFreeCheck()).toBe(i);
    }

    expect(getFreeChecksUsed()).toBe(DAILY_FREE_LIMIT);
    expect(canUseFreeCheck()).toBe(false);
  });

  it("resets the counter on a new local day", () => {
    vi.setSystemTime(new Date("2026-07-18T12:00:00+08:00"));
    for (let i = 0; i < DAILY_FREE_LIMIT; i += 1) incrementFreeCheck();
    expect(canUseFreeCheck()).toBe(false);

    vi.setSystemTime(new Date("2026-07-19T12:00:00+08:00"));
    expect(getFreeChecksUsed()).toBe(0);
    expect(canUseFreeCheck()).toBe(true);
  });

  it("keys the daily limit by the local calendar date, not UTC", () => {
    // 00:30 on Jul 18 in the Philippines (UTC+8) is still Jul 17 in UTC —
    // the limit must follow the user's local day, or it would reset at 8 AM.
    const instant = new Date("2026-07-18T00:30:00+08:00");
    vi.setSystemTime(instant);

    incrementFreeCheck();

    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const data = JSON.parse(raw);
    expect(data.date).toBe(localKey(new Date(instant)));
  });
});
