// entitlement.js — the ONE place that answers "is this user premium right
// now?" Used by the SPA (display) and mirrored by the webhook.
// A date-only current_period_end is compared as yyyy-mm-dd.

export const AI_MONTHLY_CAP = 60;

export const TRIAL_ALLOWANCES = {
  message: 5,
  deepscan: 3,
  resume: 2,
  interview: 1,
  interview_voice: 1,
  backgroundcheck: 2,
};

const toISODate = (d) => d.toISOString().slice(0, 10);

export function effectiveTier(row, now = new Date()) {
  if (!row || typeof row !== "object") return "free";
  if (row.tier !== "premium") return "free";
  const end = typeof row.current_period_end === "string" ? row.current_period_end : "";
  if (!end) return "free";
  return end >= toISODate(now) ? "premium" : "free";
}

export function trialState(row, now = new Date()) {
  if (!row || typeof row !== "object") {
    return { status: "eligible", isTrialActive: false, isExpired: false, isExhausted: false, isConverted: false, daysRemaining: 7 };
  }
  const status = row.trial_status || "eligible";
  const expiresAt = row.trial_expires_at ? new Date(row.trial_expires_at) : null;
  const isExpired = status === "expired" || (status === "active" && expiresAt && now > expiresAt);
  const isTrialActive = status === "active" && !isExpired;
  const isExhausted = status === "exhausted";
  const isConverted = status === "converted";

  let daysRemaining = 0;
  if (isTrialActive && expiresAt) {
    const diffMs = expiresAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } else if (status === "eligible") {
    daysRemaining = 7;
  }

  return {
    status: isExpired ? "expired" : status,
    isTrialActive,
    isExpired,
    isExhausted,
    isConverted,
    expiresAt,
    daysRemaining,
  };
}

export function monthlyUsage(rows, now = new Date()) {
  if (!Array.isArray(rows)) return 0;
  const monthPrefix = now.toISOString().slice(0, 7);
  return rows.filter(
    (r) => r && typeof r.created_at === "string" && r.created_at.startsWith(monthPrefix)
  ).length;
}
