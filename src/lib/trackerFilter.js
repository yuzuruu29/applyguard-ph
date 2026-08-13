// trackerFilter.js — pure filtering for the tracker list.
// No React, no DOM, no storage. The tracker UI derives its visible list from
// this at render time, so saved data is never mutated by filtering.

/**
 * Filter saved jobs by pipeline status and a free-text query.
 * The query matches against title and notes, case-insensitively.
 *
 * @param {Array<object>} jobs — saved job records
 * @param {object} [opts]
 * @param {string} [opts.query]  — free text; empty/whitespace matches all
 * @param {string} [opts.status] — a JOB_STATUSES value, or "All"
 * @returns {Array<object>} the jobs that match, in their given order
 */
export function filterJobs(jobs, { query = "", status = "All" } = {}) {
  const list = Array.isArray(jobs) ? jobs : [];
  const q = (query || "").trim().toLowerCase();

  return list.filter((job) => {
    if (status && status !== "All" && job.status !== status) return false;
    if (!q) return true;
    const haystack = `${job.title || ""}\n${job.notes || ""}`.toLowerCase();
    return haystack.includes(q);
  });
}
