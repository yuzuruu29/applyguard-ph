// pricing.js — the single source of truth for tiers shown in the UI and
// requested from create-checkout. Amounts in centavos (₱299 = 29900).
export const PLANS = {
  monthly: {
    id: "monthly",
    name: "Premium Monthly",
    priceDisplay: "₱299",
    periodDisplay: "per month",
    amount: 29900,
    kind: "subscription",
    interval: "month",
    blurb: "All four AI features, 60 AI uses a month. Auto-renews by card or Maya.",
  },
  yearly: {
    id: "yearly",
    name: "Premium Yearly",
    priceDisplay: "₱2,990",
    periodDisplay: "per year",
    amount: 299000,
    kind: "subscription",
    interval: "year",
    blurb: "Two months free. Auto-renews by card or Maya.",
  },
  gcash_30d: {
    id: "gcash_30d",
    name: "Premium — 30 days (GCash)",
    priceDisplay: "₱299",
    periodDisplay: "for 30 days",
    amount: 29900,
    kind: "manual_renewal",
    blurb: "Same Premium, paid with GCash. Does not auto-renew — come back and renew each month.",
  },
  pack: {
    id: "pack",
    name: "Message Pack",
    priceDisplay: "₱149",
    periodDisplay: "one time",
    amount: 14900,
    kind: "one_time",
    blurb: "20 message templates: cold applications, follow-ups, rate talk. Delivered to your email.",
  },
};

export const AI_FEATURES = [
  { id: "message", name: "AI message generator" },
  { id: "deepscan", name: "AI deep scam analysis" },
  { id: "resume", name: "Resume tailoring" },
  { id: "interview", name: "Interview prep" },
];
