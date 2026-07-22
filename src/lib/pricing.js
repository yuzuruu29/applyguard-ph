// pricing.js — the single source of truth for tiers shown in the UI and
// requested from create-checkout. Amounts in centavos (₱299 = 29900).
export const PLANS = {
  monthly: {
    id: "monthly",
    name: "Premium Monthly",
    priceDisplay: "₱299",
    periodDisplay: "per month",
    amount: 29900,
    kind: "manual_renewal",
    interval: "month",
    blurb: "All four AI features, 60 AI uses a month. One-time payment via PayPal.",
  },
  yearly: {
    id: "yearly",
    name: "Premium Yearly",
    priceDisplay: "₱2,990",
    periodDisplay: "per year",
    amount: 299000,
    kind: "manual_renewal",
    interval: "year",
    blurb: "Two months free. One-time payment via PayPal.",
  },
  pack: {
    id: "pack",
    name: "Message Pack",
    priceDisplay: "₱149",
    periodDisplay: "one time",
    amount: 14900,
    kind: "one_time",
    blurb: "20 adaptable templates for applications, follow-ups, and rate talk. Instant protected PDF download.",
  },
};

export const AI_FEATURES = [
  { id: "message", name: "AI message generator" },
  { id: "deepscan", name: "AI deep scam analysis" },
  { id: "backgroundcheck", name: "AI background check" },
  { id: "resume", name: "Resume tailoring" },
  { id: "interview", name: "Interview prep" },
];
