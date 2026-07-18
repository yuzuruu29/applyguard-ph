// share.js — builds a plain-text summary of a scan result suitable for
// pasting into a chat, email, or social post.
// Pure function. No React, no DOM, no storage.
//
// The summary NEVER includes rawText or prompt — only the verdict, score,
// risk level, flags, and missing-info count.

/**
 * Build a human-readable plain-text summary of a scan result.
 *
 * @param {object} data — a result object from analyzeJob() (or equivalent shape)
 * @param {string} [data.verdict]    — "Apply" | "Caution" | "Skip"
 * @param {number} [data.score]      — 0–100 fit score
 * @param {string} [data.riskLevel]  — "Low" | "Medium" | "High"
 * @param {object} [data.flags]      — { hard: Flag[], soft: Flag[] }
 * @param {string[]} [data.missingInfo] — array of missing-info question strings
 * @returns {string}
 */
export function shareSummary(data = {}) {
  const d = data || {};
  const verdict = d.verdict || "?";
  const score = typeof d.score === "number" ? d.score : 0;
  const riskLevel = d.riskLevel || "?";

  const flags = d.flags || {};
  const hard = Array.isArray(flags.hard) ? flags.hard : [];
  const soft = Array.isArray(flags.soft) ? flags.soft : [];
  const missingInfo = Array.isArray(d.missingInfo) ? d.missingInfo : [];

  // Merge hard flags first, then soft, for listing order.
  const allFlags = [...hard, ...soft];

  // ── Flags section ────────────────────────────────────────────────────
  let flagsSection;
  if (allFlags.length === 0) {
    flagsSection = "No major flags found.";
  } else {
    const lines = [];

    // Show at most 3 flags, hard-first then soft.
    const shown = allFlags.slice(0, 3);
    for (const flag of shown) {
      lines.push(`- ${flag.label}`);
    }

    if (allFlags.length > 3) {
      const remaining = allFlags.length - 3;
      lines.push(`...and ${remaining} more flag${remaining !== 1 ? "s" : ""}`);
    }

    flagsSection = `Watch out for:\n${lines.join("\n")}`;
  }

  // ── Assemble ─────────────────────────────────────────────────────────
  return [
    `📋 ApplyGuard PH verdict: ${verdict} — ${score}/100 fit`,
    `Risk level: ${riskLevel}`,
    flagsSection,
    `Open questions: ${missingInfo.length}`,
    `---`,
    `Checked at applyguard.ph`,
  ].join("\n");
}
