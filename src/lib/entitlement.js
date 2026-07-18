// entitlement.js — the ONE place that answers "is this user premium right
// now?" Used by the SPA (display) and mirrored by the webhook (Phase 3).
// A date-only current_period_end is compared as yyyy-mm-dd, which sorts
// correctly as a string. No React, no DOM, no storage.

export const AI_MONTHLY_CAP = 60;

const toISODate = (d) => d.toISOString().slice(0, 10);

export function effectiveTier(row, now = new Date()) {
  if (!row || typeof row !== "object") return "free";
  if (row.tier !== "premium") return "free";
  const end = typeof row.current_period_end === "string" ? row.current_period_end : "";
  if (!end) return "free";
  // Status (active / past_due / cancelled) only narrates WHY. The paid-through
  // date is the actual gate: premium holds until the date itself has passed,
  // which covers both the past_due grace window and cancel-at-period-end.
  return end >= toISODate(now) ? "premium" : "free";
}

export function monthlyUsage(rows, now = new Date()) {
  if (!Array.isArray(rows)) return 0;
  const monthPrefix = now.toISOString().slice(0, 7); // "2026-07"
  return rows.filter(
    (r) => r && typeof r.created_at === "string" && r.created_at.startsWith(monthPrefix)
  ).length;
}
