// ad/script.ts — the marketing ad's single source of truth.
//
// Same discipline as howto/script.ts: scene order, on-screen copy, and timing
// live here, and frame ranges are derived from per-scene durations so a
// re-timed scene can never leave a stale boundary behind.
//
// The ad is a story, not a walkthrough. Act one follows Maya, a Quezon City
// VA on her 37th application of the month, as a too-good-to-be-true post
// nearly lands her in an advance-fee scam. Act two shows the quiet, legit
// post ApplyGuard helps her say yes to, and widens out to VAs in Bogotá and
// Nairobi. Act three is trust + CTA.

export const FPS = 30;

export type SceneId =
  | "hook"
  | "bait"
  | "scan"
  | "verdict"
  | "groupchat"
  | "real"
  | "world"
  | "trust"
  | "cta";

type SceneSpec = {
  id: SceneId;
  /** Seconds this scene holds the screen. */
  seconds: number;
};

const SPECS: SceneSpec[] = [
  { id: "hook", seconds: 6.5 },
  { id: "bait", seconds: 8 },
  { id: "scan", seconds: 7 },
  { id: "verdict", seconds: 6.5 },
  { id: "groupchat", seconds: 6.5 },
  { id: "real", seconds: 9.5 },
  { id: "world", seconds: 7.5 },
  { id: "trust", seconds: 6 },
  { id: "cta", seconds: 7 },
];

export type Scene = SceneSpec & {
  index: number;
  from: number;
  to: number;
  durationInFrames: number;
};

export const SCENES: Scene[] = (() => {
  let cursor = 0;
  return SPECS.map((spec, index) => {
    const durationInFrames = Math.round(spec.seconds * FPS);
    const scene: Scene = {
      ...spec,
      index,
      from: cursor,
      to: cursor + durationInFrames,
      durationInFrames,
    };
    cursor += durationInFrames;
    return scene;
  });
})();

export const DURATION = SCENES[SCENES.length - 1].to;

export function scene(id: SceneId): Scene {
  const found = SCENES.find((s) => s.id === id);
  if (!found) throw new Error(`unknown scene: ${id}`);
  return found;
}

// ── act one: the bait ────────────────────────────────────────────────────────

export const HOOK = {
  eyebrow: "11:47 PM · Quezon City",
  headline: "Maya is on her 37th application this month.",
  sub: "Night shift, day shift, weekends. The feed never runs out of promises.",
  /** Fragments that drift behind the headline like a doomscrolled feed. */
  fragments: [
    "URGENT HIRING!!!",
    "NO EXPERIENCE NEEDED",
    "$700 / WEEK",
    "DIRECT CLIENT — START TODAY",
    "LIMITED SLOTS ONLY",
    "EARN FROM HOME",
    "APPLY NOW!!!",
    "GET PAID DAILY",
  ],
};

/** The scam post, written the way they actually read in FB groups. */
export const BAIT_POST = {
  title: "Chat Support Agent — Work From Home",
  source: "Posted in “VA Jobs Philippines · Direct Clients” · 12 min ago",
  lines: [
    { id: "pay", text: "$700 per week — no experience needed", tone: "temptation" as const },
    { id: "hours", text: "3–4 hours a day only, phone lang ok na!", tone: "temptation" as const },
    { id: "contact", text: "Message our HR on Telegram to start today", tone: "plain" as const },
    { id: "fee", text: "₱1,500 equipment processing fee (refundable!)", tone: "plain" as const },
    { id: "slots", text: "Only 5 slots left — first come, first served", tone: "plain" as const },
  ],
  captionA: "After 37 rejections, this reads like a rescue.",
  captionB: "It was written to.",
};

// ── the scan ─────────────────────────────────────────────────────────────────

export const SCAN = {
  eyebrow: "Before you reply. Before you send anything.",
  headline: "Paste it into ApplyGuard.",
  windowTitle: "applyguard.ph — free scan",
  /** Chips pinned to bait-post lines as the sweep passes them. */
  chips: {
    pay: { label: "Far above market", tone: "warn" as const },
    contact: { label: "Off-platform contact", tone: "stop" as const },
    fee: { label: "Upfront fee", tone: "stop" as const },
    slots: { label: "Urgency pressure", tone: "warn" as const },
  },
};

export const VERDICT_BAD = {
  stamp: "Skip",
  risk: "High risk",
  score: 15,
  scoreNote: "Hard flag caps the fit score at 15",
  reasons: [
    {
      title: "Wants money before you start",
      body: "The ₱1,500 “equipment fee” is the product. This is an advance-fee scam.",
    },
    {
      title: "Moves you to Telegram immediately",
      body: "Off-platform means no record, no recourse, no one to report.",
    },
  ],
  payoff: "₱1,500 stays in Maya's pocket. Buti na lang.",
};

export const GROUP_CHAT = {
  headline: "One paste can save the whole group chat.",
  chatName: "VA Barkada",
  members: "Maya, Kris, Dana +5",
  share: {
    verdict: "SKIP · High risk",
    title: "Chat Support Agent — Work From Home",
    note: "₱1,500 “equipment fee” + Telegram-only HR. Advance-fee pattern.",
    via: "Shared via ApplyGuard — no personal info included",
  },
  replies: [
    { author: "Kris", text: "grabe, inapply-an ko sana 'yan kanina" },
    { author: "Dana", text: "salamat sis!! sending this to my cousin" },
  ],
};

// ── act two: the real one ────────────────────────────────────────────────────

export const GOOD_POST = {
  eyebrow: "Three days later — a quieter post.",
  title: "Executive Assistant — AU Real Estate",
  source: "Harbourline Property Group · Remote (PH)",
  lines: [
    { id: "pay", text: "₱45,000/month, paid twice monthly" },
    { id: "hours", text: "Mon–Fri, 7:00 AM – 4:00 PM PH time" },
    { id: "tools", text: "Tools: Trello, Canva, follow-up CRM" },
    { id: "benefits", text: "13th month + HMO after 6 months" },
    { id: "apply", text: "Apply via careers page with a 60-second intro video" },
  ],
  verdict: "Apply",
  risk: "Low risk",
  score: 87,
  nextStep: "Suggested next step: ask how many agents you'd support, before the interview.",
  tracker: ["Saved", "Applied", "Interview"],
  followUp: "Follow-up reminder set · Friday",
  caption: "The good ones are usually the quiet ones. Now she can tell.",
};

// ── the wider world ──────────────────────────────────────────────────────────

export const WORLD = {
  headline: "Built for Filipino VAs.",
  headlineB: "Sharp for VAs everywhere.",
  cards: [
    {
      city: "Manila",
      who: "Maya · Executive Assistant",
      detail: "₱45,000/mo · AU client · tools listed",
      verdict: "Apply" as const,
      score: 87,
      tone: "go" as const,
    },
    {
      city: "Bogotá",
      who: "Sofía · Data Entry, US client",
      detail: "“$40 training deposit via crypto”",
      verdict: "Skip" as const,
      score: 12,
      tone: "stop" as const,
    },
    {
      city: "Nairobi",
      who: "Amara · Customer Success VA",
      detail: "$6/hr · clear hours · named company",
      verdict: "Apply" as const,
      score: 82,
      tone: "go" as const,
    },
  ],
};

// ── act three: trust + cta ───────────────────────────────────────────────────

export const TRUST = {
  headline: "No catch. That's the point.",
  points: [
    {
      title: "Free, forever, no sign-up",
      body: "No card, no account, no trial that flips paid.",
    },
    {
      title: "The post never leaves your browser",
      body: "Scans run on your device. Nothing is uploaded anywhere.",
    },
    {
      title: "A straight answer in seconds",
      body: "Apply, Caution, or Skip — with the receipts to back it up.",
    },
  ],
};

export const CTA = {
  headline: "Scan the post before you say yes.",
  sub: "A free second opinion for every remote job post.",
  url: "applyguard.ph",
  chips: ["Free", "No sign-up", "Private by design"],
};
