// scoring.js — pure fit scoring + verdict derivation. Section 8 of the spec.
// No React, no DOM, no storage.
//
// computeScore(job) -> { score, breakdown }
// deriveVerdict(score, riskLevel, missingInfo) -> "Apply" | "Caution" | "Skip"
//
// Fit is built from four components that sum to 100:
//   Skill match ........ 35
//   Pay vs your floor .. 25
//   Post clarity ....... 20
//   Role & commitment .. 20
// Then: each SOFT flag subtracts 8 (floor 0); ANY hard flag caps fit at 15.

const MAX = {
  skillMatch: 35,
  rateFit: 25,
  clarity: 20,
  commitmentFit: 20,
};

const SOFT_PENALTY = 8;
const HARD_CAP = 15;

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function tokenizeSkills(skills) {
  if (!skills) return [];
  return String(skills)
    .split(/[,;\n/]| and /i)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length >= 2);
}

// Normalise an offered rate to a rough monthly figure so we can compare it
// against the user's monthly floor. Returns null when it can't be compared.
function monthlyEquivalent(amount, rateType) {
  const n = Number(amount);
  if (!n || n <= 0) return null;
  switch (rateType) {
    case "Hourly":
      return n * 160; // ~40 hrs/wk
    case "Weekly":
      return n * 4;
    case "Monthly":
      return n;
    case "Yearly":
      return n / 12;
    default:
      return null; // "Per project" / "Not stated" — not comparable
  }
}

function scoreSkillMatch(intake, text) {
  const tokens = tokenizeSkills(intake.skills);
  if (tokens.length === 0) {
    // Nothing to match on — stay neutral rather than punishing the post.
    return Math.round(MAX.skillMatch * 0.5);
  }
  const matched = tokens.filter((tok) => text.includes(tok)).length;
  const ratio = matched / tokens.length;
  return Math.round(MAX.skillMatch * ratio);
}

function scoreRateFit(intake, settings) {
  const min = Number(settings?.minRate) || 0;
  const offered = monthlyEquivalent(intake.rate, intake.rateType);
  if (min <= 0) return Math.round(MAX.rateFit * 0.72); // user set no floor
  if (offered == null) return Math.round(MAX.rateFit * 0.4); // pay unclear
  if (offered >= min) return MAX.rateFit;
  const ratio = offered / min;
  if (ratio >= 0.85) return 20;
  if (ratio >= 0.7) return 14;
  if (ratio >= 0.5) return 8;
  return 3;
}

function scoreClarity(text) {
  let s = 0;
  if (text.length >= 280) s += 6;
  else if (text.length >= 120) s += 3;
  if (/(responsib|duties|tasks|you will|you'll|day[- ]to[- ]day|role)/.test(text)) s += 4;
  if (/(requirements|qualifications|skills|experience|must have|looking for)/.test(text)) s += 4;
  if (/(hours|schedule|shift|full[- ]?time|part[- ]?time|per week)/.test(text)) s += 3;
  if (/(salary|\brate\b|\bpay\b|compensation|\$|₱|php|usd)/.test(text)) s += 3;
  return clamp(s, 0, MAX.clarity);
}

function scoreCommitmentFit(intake, text) {
  let s = 0;
  s += intake.hours && intake.hours !== "Not stated" ? 10 : 4;
  s += intake.experience ? 6 : 3;
  s += /(remote|work from home|wfh|anywhere|home[- ]based)/.test(text) ? 4 : 2;
  return clamp(s, 0, MAX.commitmentFit);
}

/**
 * Compute the fit score and a transparent breakdown.
 * @param {object} job - { intake, rawText, flags, settings }
 * @returns {{score:number, breakdown:object}}
 */
export function computeScore(job = {}) {
  const intake = job.intake || {};
  const text = (typeof job.rawText === "string" ? job.rawText : "").toLowerCase();
  const flags = job.flags || { hard: [], soft: [] };
  const settings = job.settings || {};

  const skillMatch = scoreSkillMatch(intake, text);
  const rateFit = scoreRateFit(intake, settings);
  const clarity = scoreClarity(text);
  const commitmentFit = scoreCommitmentFit(intake, text);

  const base = skillMatch + rateFit + clarity + commitmentFit;

  const softCount = flags?.soft?.length || 0;
  const softPenalty = softCount * SOFT_PENALTY;
  let total = Math.max(0, base - softPenalty);

  const hardCapApplied = (flags?.hard?.length || 0) > 0;
  if (hardCapApplied) total = Math.min(total, HARD_CAP);

  total = clamp(Math.round(total), 0, 100);

  const breakdown = {
    components: [
      { key: "skillMatch", label: "Skill match", value: skillMatch, max: MAX.skillMatch },
      { key: "rateFit", label: "Pay vs your floor", value: rateFit, max: MAX.rateFit },
      { key: "clarity", label: "Post clarity", value: clarity, max: MAX.clarity },
      { key: "commitmentFit", label: "Role & commitment", value: commitmentFit, max: MAX.commitmentFit },
    ],
    base,
    softCount,
    softPenalty,
    hardCapApplied,
    total,
  };

  return { score: total, breakdown };
}

/**
 * Derive the headline verdict.
 *  - High risk -> Skip (safety beats fit)
 *  - Medium risk OR missing info -> Caution
 *  - Otherwise score decides: 70+ Apply, 45–69 Caution, below 45 Skip
 * @param {number} score
 * @param {"Low"|"Medium"|"High"} risk
 * @param {string[]} missingInfo
 * @returns {"Apply"|"Caution"|"Skip"}
 */
export function deriveVerdict(score, risk, missingInfo = []) {
  if (risk === "High") return "Skip";
  if (risk === "Medium") return "Caution";
  if (Array.isArray(missingInfo) && missingInfo.length > 0) return "Caution";
  if (score >= 70) return "Apply";
  if (score >= 45) return "Caution";
  return "Skip";
}
