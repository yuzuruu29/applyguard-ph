// csv.js — turn the saved jobs list into a CSV string for client-side export.
// No React, no DOM. The component wraps this in a Blob download.

const COLUMNS = [
  ["title", "Title"],
  ["verdict", "Verdict"],
  ["score", "Fit score"],
  ["riskLevel", "Risk"],
  ["status", "Status"],
  ["rate", "Rate"],
  ["rateType", "Rate type"],
  ["hours", "Hours"],
  ["followUpBy", "Follow up by"],
  ["missingCount", "Missing-info count"],
  ["hardFlags", "Hard flags"],
  ["softFlags", "Soft flags"],
  ["createdAt", "Saved on"],
  ["notes", "Notes"],
];

function escapeCell(value) {
  const raw = value == null ? "" : String(value);
  const s = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  // Quote when the value contains a comma, quote, or newline (RFC 4180).
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowFor(job) {
  const intake = job.intake || {};
  const flags = job.flags || { hard: [], soft: [] };
  const flat = {
    title: job.title || intake.role || "Untitled job",
    verdict: job.verdict || "",
    score: job.score ?? "",
    riskLevel: job.riskLevel || "",
    status: job.status || "",
    rate: intake.rate ?? "",
    rateType: intake.rateType || "",
    hours: intake.hours || "",
    followUpBy: job.followUpBy || "",
    missingCount: Array.isArray(job.missingInfo) ? job.missingInfo.length : 0,
    hardFlags: (flags.hard || []).map((f) => f.label).join("; "),
    softFlags: (flags.soft || []).map((f) => f.label).join("; "),
    createdAt: job.createdAt || "",
    notes: job.notes || "",
  };
  return COLUMNS.map(([key]) => escapeCell(flat[key])).join(",");
}

/**
 * @param {Array} jobs
 * @returns {string} CSV text (header + one row per job), CRLF line endings.
 */
export function jobsToCSV(jobs = []) {
  const header = COLUMNS.map(([, label]) => escapeCell(label)).join(",");
  const rows = (Array.isArray(jobs) ? jobs : []).map(rowFor);
  return [header, ...rows].join("\r\n");
}
