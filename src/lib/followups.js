// followups.js — which saved jobs need a follow-up nudge. followUpBy values
// come from <input type="date">, so they are yyyy-mm-dd strings that sort
// correctly as plain strings. No React, no DOM, no storage.

/**
 * Returns today's date as a "YYYY-MM-DD" string in the local timezone.
 * Implementation uses Intl via the en-CA locale, which natively produces
 * the ISO-8601 calendar-date format.
 * @returns {string} e.g. "2026-07-18"
 */
export function todayLocalISO() {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * Determine the follow-up state for a single job.
 *
 * @param {object} job - a tracker job with optional `status` and `followUpBy`.
 * @returns {{ state: "overdue"|"today"|"upcoming"|"none", date: string }}
 *   - `state`  — the follow-up category relative to today.
 *   - `date`   — the job's `followUpBy` value (or "" when state is "none").
 *
 * Closed jobs always return { state: "none", date: "" }.
 */
export function followUpState(job) {
  if (!job || typeof job !== "object") return { state: "none", date: "" };
  if (job.status === "Closed") return { state: "none", date: "" };

  const due = typeof job.followUpBy === "string" ? job.followUpBy.trim() : "";
  if (!due) return { state: "none", date: "" };

  const today = todayLocalISO();
  if (due < today) return { state: "overdue", date: due };
  if (due === today) return { state: "today", date: due };
  return { state: "upcoming", date: due };
}

/**
 * Group active (non-Closed) jobs with a followUpBy date into overdue, today,
 * and upcoming buckets. Each bucket is sorted by followUpBy ascending.
 *
 * @param {object[]} jobs - the full jobs array from app state.
 * @returns {{ overdue: object[], today: object[], upcoming: object[] }}
 */
export function dueFollowUps(jobs) {
  const result = { overdue: [], today: [], upcoming: [] };

  const arr = Array.isArray(jobs) ? jobs : [];

  for (const job of arr) {
    if (!job || typeof job !== "object") continue;
    if (job.status === "Closed") continue;
    const due = typeof job.followUpBy === "string" ? job.followUpBy.trim() : "";
    if (!due) continue;

    const { state } = followUpState(job);
    if (state !== "none") {
      result[state].push(job);
    }
  }

  const byDate = (a, b) => (a.followUpBy || "").localeCompare(b.followUpBy || "");
  result.overdue.sort(byDate);
  result.today.sort(byDate);
  result.upcoming.sort(byDate);

  return result;
}
