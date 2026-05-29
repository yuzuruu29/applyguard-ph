// redflags.js — pure scam-signal detection for a remote job post.
// No React, no DOM, no storage. Section 9 of the spec.
//
// scanFlags(rawText, intake) -> { hard: Flag[], soft: Flag[] }
// riskLevel(flags) -> "Low" | "Medium" | "High"
//
// A Flag is { id, label, why }. We never label a post "safe" or "verified";
// the UI's clean state reads "no major flags found, still verify."

/**
 * HARD flags are near-certain scam signals. Any one of them caps fit at 15
 * and forces risk "High" / verdict "Skip".
 */
const HARD_RULES = [
  {
    id: "upfront-fee",
    label: "Asks you to pay a fee",
    why: "Real employers pay you. Training, registration, or placement fees are a classic scam.",
    test: (t) =>
      /\b(training|registration|registr\w*|processing|application|onboarding|placement|membership|activation)\s+fee\b/.test(
        t
      ) ||
      /\bfee\s+(to|before)\s+(start|apply|join|begin)/.test(t) ||
      /\bpay\b[^.]{0,30}\b(fee|deposit)\b/.test(t) ||
      /\bsecurity deposit\b/.test(t),
  },
  {
    id: "pay-to-start",
    label: "Wants money before you start",
    why: "Buying a starter kit or paying for materials to get hired is how advance-fee scams work.",
    test: (t) =>
      /\bstarter kit\b/.test(t) ||
      /\b(buy|purchase|pay for)\b[^.]{0,30}\b(kit|package|materials|equipment|software)\b[^.]{0,30}\b(to|before)\b[^.]{0,15}\b(start|begin|hired)\b/.test(
        t
      ) ||
      /\bpay\b[^.]{0,20}\bbefore you\b[^.]{0,15}\bstart\b/.test(t),
  },
  {
    id: "bank-card-details",
    label: "Asks for bank or card details",
    why: "No legitimate hiring step needs your card number, CVV, OTP, or banking password.",
    test: (t) =>
      /\b(credit card|card)\s+(number|details|info)\b/.test(t) ||
      /\bcvv\b/.test(t) ||
      /\b(one[- ]time pin|one[- ]time password|\botp\b|atm pin)\b/.test(t) ||
      /\b(online banking|e-banking)\s+(password|login|credentials)\b/.test(t) ||
      /\bbank account\s+(password|login|pin)\b/.test(t),
  },
  {
    id: "overpayment-check",
    label: "Overpayment or check-deposit scheme",
    why: "Getting sent a check to deposit and forward money is a textbook money-laundering trap.",
    test: (t) =>
      /\b(deposit|cash)\b[^.]{0,25}\b(check|cheque)\b/.test(t) ||
      /\bwe('| wi)ll send you a (check|cheque)\b/.test(t) ||
      /\boverpay(ment)?\b/.test(t),
  },
  {
    id: "gift-card-crypto",
    label: "Pays or charges in gift cards / crypto",
    why: "Gift-card or crypto payment for ordinary work is almost always a scam.",
    test: (t) =>
      /\bgift card(s)?\b/.test(t) ||
      /\b(google play|steam|itunes)\s+card\b/.test(t) ||
      /\bpay(ment)?\b[^.]{0,20}\b(bitcoin|btc|usdt|crypto)\b/.test(t),
  },
  {
    id: "money-mule",
    label: "Looks like a money-mule or reshipping job",
    why: "Receiving packages or processing payments from home for a stranger is illegal mule work.",
    test: (t) =>
      /\breship(p)?(ing|er)?\b/.test(t) ||
      /\bpackage (forwarding|handling|reshipping)\b/.test(t) ||
      /\bmoney (mule|transfer agent)\b/.test(t) ||
      /\bpayment processing\b[^.]{0,20}\bfrom home\b/.test(t),
  },
  {
    id: "guaranteed-income",
    label: "Promises guaranteed income",
    why: "Guaranteed daily or weekly earnings with no skills required is bait, not a job.",
    test: (t) =>
      /\bguaranteed\b[^.]{0,25}\b(income|earnings|profit|salary|per day|per week|daily|weekly|\$|₱)\b/.test(
        t
      ),
  },
];

/**
 * SOFT flags are worrying but not damning. Each subtracts 8 from fit;
 * three or more push risk to "High".
 */
const SOFT_RULES = [
  {
    id: "off-platform",
    label: "Pushes you to WhatsApp / Telegram",
    why: "Moving straight to a personal chat app skips the platform's paper trail.",
    test: (t) =>
      /\bwhats[\s]?app\b/.test(t) ||
      /\btelegram\b/.test(t) ||
      /\bt\.me\//.test(t) ||
      /\bsignal app\b/.test(t),
  },
  {
    id: "personal-email",
    label: "Uses a personal email, not a company one",
    why: "An official role run from a free Gmail or Yahoo address is worth a second look.",
    test: (t) =>
      /[\w.+-]+@(gmail|yahoo|hotmail|outlook|aol|proton|protonmail|ymail|rocketmail)\.[a-z.]{2,}/.test(
        t
      ),
  },
  {
    id: "urgency",
    label: "Pushes urgency or limited slots",
    why: "Rush tactics are meant to stop you from checking the details.",
    test: (t) =>
      /\b(urgent(ly)?|immediately|asap)\b/.test(t) ||
      /\blimited\s+(slots?|spots?|seats?)\b/.test(t) ||
      /\bfew\s+(slots?|spots?)\s+left\b/.test(t) ||
      /\bapply now before\b/.test(t) ||
      /\bstart (today|tomorrow|asap)\b/.test(t),
  },
  {
    id: "no-screening",
    label: "Offers the job with little or no screening",
    why: "Real roles screen candidates. Instant hiring with no experience needed is a lure.",
    test: (t) =>
      /\bno interview\b/.test(t) ||
      /\bhired on the spot\b/.test(t) ||
      /\b(instant|immediate)\s+hir\w+\b/.test(t) ||
      /\bget hired (today|now|instantly)\b/.test(t) ||
      /\bno experience (needed|required|necessary)\b/.test(t),
  },
  {
    id: "vague-pay",
    label: 'Pay is vague ("competitive", "to be discussed")',
    why: "Posts that won't name a number often hope you won't ask.",
    test: (t) =>
      /\bcompetitive\s+(pay|salary|rate|compensation)\b/.test(t) ||
      /\bpay\b[^.]{0,15}\b(to be|will be)\s+discussed\b/.test(t) ||
      /\bsalary\b[^.]{0,10}\bnegotiable\b/.test(t) ||
      /\bdepends on (performance|experience|results)\b/.test(t),
  },
  {
    id: "id-docs-early",
    label: "Asks for IDs or personal documents early",
    why: "Handing over IDs or a selfie before any real conversation invites identity theft.",
    test: (t) =>
      /\bsend\b[^.]{0,25}\b(valid id|government id|sss|tin|nbi clearance|selfie|photo of your id)\b/.test(
        t
      ),
  },
  {
    id: "mass-blast",
    label: "Reads like a mass blast (ALL CAPS, lots of !!!)",
    why: "Copy-paste hype with shouting and exclamation points rarely comes from a careful employer.",
    test: (t, raw) => {
      const exclaims = (raw.match(/!/g) || []).length;
      const capsWords = (raw.match(/\b[A-Z]{4,}\b/g) || []).length;
      return exclaims >= 4 || capsWords >= 6;
    },
  },
];

/**
 * Scan a raw job post (and optional intake) for scam signals.
 * @param {string} rawText
 * @param {object} [intake]
 * @returns {{hard: Array, soft: Array}}
 */
export function scanFlags(rawText, intake = {}) {
  const raw = typeof rawText === "string" ? rawText : "";
  const t = raw.toLowerCase();

  const hard = [];
  for (const rule of HARD_RULES) {
    if (rule.test(t, raw, intake)) {
      hard.push({ id: rule.id, label: rule.label, why: rule.why });
    }
  }

  const soft = [];
  for (const rule of SOFT_RULES) {
    if (rule.test(t, raw, intake)) {
      soft.push({ id: rule.id, label: rule.label, why: rule.why });
    }
  }

  return { hard, soft };
}

/**
 * Map a set of flags to a risk level.
 * High: any hard flag, or 3+ soft flags.
 * Medium: 1–2 soft flags.
 * Low: none.
 * @param {{hard: Array, soft: Array}} flags
 * @returns {"Low"|"Medium"|"High"}
 */
export function riskLevel(flags) {
  const hard = flags?.hard?.length || 0;
  const soft = flags?.soft?.length || 0;
  if (hard > 0 || soft >= 3) return "High";
  if (soft >= 1) return "Medium";
  return "Low";
}
