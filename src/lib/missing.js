// missing.js — pure detection of essential info a job post leaves out.
// No React, no DOM, no storage.
//
// detectMissingInfo(rawText, intake) -> string[]
//
// Each string is a plain-language question the seeker should get answered
// before committing. We check the pasted post AND the quick intake, so a
// detail the user already supplied isn't flagged as missing.

/**
 * @param {string} rawText
 * @param {object} [intake] - { role, skills, experience, rate, rateType, hours }
 * @returns {string[]}
 */
export function detectMissingInfo(rawText, intake = {}) {
  const raw = typeof rawText === "string" ? rawText : "";
  const t = raw.toLowerCase();
  const out = [];

  // 1. Pay / rate ----------------------------------------------------------
  const rateGiven =
    intake.rate != null &&
    Number(intake.rate) > 0 &&
    intake.rateType &&
    intake.rateType !== "Not stated";
  const textHasPay =
    /(salary|\brate\b|\bpay\b|stipend|compensation|\$|₱|\bphp\b|\busd\b|per\s+hour|per\s+month|per\s+week|hourly|monthly)/.test(
      t
    ) && /\d/.test(t);
  if (!rateGiven && !textHasPay) {
    out.push("How much does this pay? No rate or salary is stated.");
  }

  // 2. Hours / time commitment --------------------------------------------
  const hoursGiven =
    intake.hours && intake.hours !== "Not stated" && intake.hours !== "";
  const textHasHours =
    /(hours|hrs|hr\/wk|per week|\/wk|full[- ]?time|part[- ]?time|schedule|shift|graveyard|day shift|night shift)/.test(
      t
    );
  if (!hoursGiven && !textHasHours) {
    out.push("How many hours per week? The time commitment isn't clear.");
  }

  // 3. Who the employer is -------------------------------------------------
  const textHasCompany =
    /(company|agency|startup|our team|we are|we're|about us|our (company|client|business|brand)|\bclient\b|\bemployer\b)/.test(
      t
    );
  if (!textHasCompany) {
    out.push("Who is the employer? The post doesn't name a company or client.");
  }

  // 4. How and when you get paid ------------------------------------------
  const textHasPayout =
    /(paypal|payoneer|\bwise\b|gcash|maya|paymaya|bank transfer|direct deposit|upwork|onlinejobs|deel|weekly|bi[- ]?weekly|fortnightly|monthly|every (friday|month|week|15th|30th)|payout|payday)/.test(
      t
    );
  if (!textHasPayout) {
    out.push("How and when do they pay? No payout method or schedule is given.");
  }

  // 5. What you'd actually do ---------------------------------------------
  const textHasDuties =
    /(responsib|duties|\btasks?\b|you will|you'll|day[- ]to[- ]day|\brole\b|manage|handle|create|write|design|develop|build|support|assist|moderate|edit)/.test(
      t
    );
  if (!textHasDuties) {
    out.push("What would you actually do? The day-to-day tasks aren't spelled out.");
  }

  return out;
}
