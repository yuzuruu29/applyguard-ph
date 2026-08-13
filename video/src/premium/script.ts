// premium/script.ts — the Premium showcase film's single source of truth.
//
// Same discipline as the other films: scene order, on-screen copy, and timing
// live here; frame ranges are derived so a re-timed scene can never leave a
// stale boundary. The showcase picks up where the marketing ad left off —
// Maya found the legit Harbourline post — and walks the five Premium AI
// features through that same application, with the voice mock interview as
// the hero beat. Every label mirrors the live product (src/lib/pricing.js,
// AiAssistant.jsx, MockInterviewPage.jsx, OffersPage.jsx).

export const FPS = 30;

export type SceneId =
  | "intro"
  | "message"
  | "deepscan"
  | "resume"
  | "setup"
  | "interview"
  | "plans"
  | "cta";

type SceneSpec = {
  id: SceneId;
  seconds: number;
};

const SPECS: SceneSpec[] = [
  { id: "intro", seconds: 5.5 },
  { id: "message", seconds: 8.5 },
  { id: "deepscan", seconds: 7.5 },
  { id: "resume", seconds: 7.5 },
  { id: "setup", seconds: 6 },
  { id: "interview", seconds: 10 },
  { id: "plans", seconds: 7 },
  { id: "cta", seconds: 6 },
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

// ── intro ────────────────────────────────────────────────────────────────────

/** Mirrors AI_FEATURES in src/lib/pricing.js. */
export const FEATURE_TABS = [
  "AI message generator",
  "AI deep scam analysis",
  "AI background check",
  "Resume tailoring",
  "Interview prep",
];

export const INTRO = {
  badge: "ApplyGuard Premium",
  headlineA: "The scanner is free, forever.",
  headlineB: "Premium is for what comes after.",
  sub: "Five AI features for the moment a good post deserves a great application.",
  usage: "60 AI uses a month",
};

// ── the running example, carried over from the marketing ad ─────────────────

export const JOB = {
  title: "Executive Assistant — AU Real Estate",
  company: "Harbourline Property Group · Remote (PH)",
  score: "Apply · 87",
};

// ── 1. AI message generator ─────────────────────────────────────────────────

export const MESSAGE = {
  eyebrow: "Feature 1 of 5",
  headline: "The first reply, written with you.",
  tab: "AI message generator",
  generating: "Drafting your AI message generator…",
  lines: [
    "Hi Harbourline team — I'm applying for the Executive Assistant role.",
    "I've supported an AU property agency before: AEST diary management, listing coordination in Trello, and follow-ups inside a CRM pipeline like yours.",
    "I'm available Mon–Fri 7:00–16:00 PH time. My 60-second intro video is linked below.",
  ],
  caption: "It reads the post and your details — so it sounds like you, not a template.",
  copyLabel: "Copy",
};

// ── 2. deep scam analysis + background check ────────────────────────────────

export const DEEPSCAN = {
  eyebrow: "Features 2 + 3 of 5",
  headline: "Verify who's actually hiring.",
  windowTitle: "AI deep scam analysis — Harbourline Property Group",
  findings: [
    {
      tone: "go" as const,
      title: "Business checks out",
      body: "“Harbourline Property Group” returns an active AU business registration.",
    },
    {
      tone: "go" as const,
      title: "Pay is within market",
      body: "₱45,000/mo sits inside the usual band for AU-hours EA roles.",
    },
    {
      tone: "warn" as const,
      title: "Young LinkedIn page",
      body: "Company page is 4 months old — ask about the client roster before the interview.",
    },
  ],
  verdict: "Deep scan: worth your time — with one question to ask.",
};

// ── 3. resume tailoring ─────────────────────────────────────────────────────

export const RESUME = {
  eyebrow: "Feature 4 of 5",
  headline: "Your resume, in the post's own words.",
  beforeLabel: "Your bullet",
  before: "Handled emails and calendars for my boss.",
  afterLabel: "Tailored for this post",
  after:
    "Managed inbox triage and AEST diary coordination for a director — cut reply backlog from 2 days to 4 hours.",
  keywords: ["Trello", "CRM follow-ups", "AEST hours"],
  caption: "Matched to what Harbourline actually asked for.",
};

// ── 4. voice mock interview (the hero beat) ─────────────────────────────────

export const SETUP = {
  eyebrow: "Feature 5 of 5 — the one people practice with",
  headline: "Voice Mock Interview",
  sub: "Practice answering questions live with our AI hiring manager.",
  roleLabel: "Target Role",
  roleValue: "Executive Assistant",
  descLabel: "Job Description",
  descValue: "Executive Assistant — AU Real Estate. Mon–Fri, 7:00 AM – 4:00 PM PH time…",
  button: "Start Interview (Requires Camera & Mic)",
};

export const INTERVIEW = {
  statusActive: "AI Interviewer (Active)",
  statusThinking: "AI is thinking...",
  aiQuestion:
    "You mentioned juggling three client inboxes. Walk me through your triage on a heavy Monday.",
  listening: "Listening...",
  userAnswer:
    "I batch by urgency — anything with money or a deadline first, then owners, then routine follow-ups…",
  aiFollowUp: "Good structure. Now tighten that answer to thirty seconds.",
  caption: "It asks. You answer out loud. It pushes back — before a real client does.",
  youLabel: "You",
  aiLabel: "AI Interviewer",
};

// ── 5. honest pricing ────────────────────────────────────────────────────────

export const PLANS = {
  eyebrow: "Honest pricing",
  headline: "Pay once. Renew only if it earned it.",
  cards: [
    { name: "Premium Monthly", price: "₱299", period: "per month", note: "One-time payment" },
    { name: "Premium Yearly", price: "₱2,990", period: "per year", note: "Two months free", featured: true },
  ],
  trial: "Try it free for 7 days — no card required",
  privacy: "Posts are processed in memory and never stored.",
};

export const CTA = {
  headlineA: "The scan is free.",
  headlineB: "The follow-through is Premium.",
  url: "applyguard.ph",
  chips: ["7-day free preview", "One-time payment", "60 AI uses a month"],
};
