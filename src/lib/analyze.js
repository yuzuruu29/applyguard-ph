// analyze.js — composes the pure modules into one result object.
// Kept side-effect free so the UI just renders what it returns.
import { scanFlags, riskLevel } from "./redflags.js";
import { detectMissingInfo } from "./missing.js";
import { computeScore, deriveVerdict } from "./scoring.js";
import { suggestNextAction } from "./nextaction.js";
import { buildApplicationPrompt, buildClarificationPrompt } from "./prompt.js";

/**
 * Run a full scan of a pasted post + intake against the user's settings.
 * @param {object} args - { rawText, intake, settings }
 * @returns {object} a result view-model (no id / status / timestamps yet)
 */
export function analyzeJob({ rawText = "", intake = {}, settings = {} } = {}) {
  const flags = scanFlags(rawText, intake);
  const risk = riskLevel(flags);
  const missingInfo = detectMissingInfo(rawText, intake);
  const { score, breakdown } = computeScore({ rawText, intake, flags, settings });
  const verdict = deriveVerdict(score, risk, missingInfo);
  const nextAction = suggestNextAction(verdict, missingInfo);

  const usesClarification = missingInfo.length > 0;
  const prompt = usesClarification
    ? buildClarificationPrompt({ rawText, missingInfo })
    : buildApplicationPrompt({ rawText, intake }, settings);

  return {
    rawText,
    intake,
    flags,
    riskLevel: risk,
    missingInfo,
    score,
    breakdown,
    verdict,
    nextAction,
    usesClarification,
    prompt,
  };
}

/** Derive a readable title from intake/post for the tracker + CSV. */
export function deriveTitle(rawText = "", intake = {}) {
  if (intake.role && intake.role.trim()) return intake.role.trim();
  const firstLine = String(rawText).split("\n").map((l) => l.trim()).find(Boolean);
  if (firstLine) return firstLine.slice(0, 70);
  return "Untitled job";
}
