// howto/script.ts — the instructional script.
//
// One source of truth for chapter order, on-screen copy, and timing. Frame
// ranges are derived from the per-chapter durations rather than hand-written,
// so inserting or re-timing a chapter can never leave a stale boundary behind.
// The narration strings double as the video's accessible transcript, which the
// web player renders as a visible chapter list.

export const FPS = 30;

export type ChapterId =
  | "intro"
  | "paste"
  | "details"
  | "verdict"
  | "score"
  | "flags"
  | "missing"
  | "prompt"
  | "link"
  | "tracker"
  | "privacy"
  | "closing";

type ChapterSpec = {
  id: ChapterId;
  /** Step number shown in the badge. Null for intro/closing. */
  step: number | null;
  /** Short chapter title. */
  title: string;
  /** One-line caption under the stage. */
  caption: string;
  /** Seconds this chapter is on screen. */
  seconds: number;
};

const SPECS: ChapterSpec[] = [
  {
    id: "intro",
    step: null,
    title: "How ApplyGuard works",
    caption: "A free second opinion on any remote job post — running entirely in your browser.",
    seconds: 4.5,
  },
  {
    id: "paste",
    step: 1,
    title: "Paste the job post",
    caption: "Copy the whole listing — title, description, pay, and contact details.",
    seconds: 6,
  },
  {
    id: "details",
    step: 2,
    title: "Add your details",
    caption: "Optional: your role, skills, and pay floor turn the score into a personal fit score.",
    seconds: 5.5,
  },
  {
    id: "verdict",
    step: 3,
    title: "Read the verdict",
    caption: "Apply, Caution, or Skip — with a fit score out of 100 and a risk level.",
    seconds: 6,
  },
  {
    id: "score",
    step: 4,
    title: "See why the score landed there",
    caption: "Four parts add up to 100. Soft flags subtract; one hard flag caps the score at 15.",
    seconds: 6.5,
  },
  {
    id: "flags",
    step: 5,
    title: "Review the scam signals",
    caption: "Hard stops are deal-breakers. Softer flags are worth a closer look before you commit.",
    seconds: 6,
  },
  {
    id: "missing",
    step: 6,
    title: "Ask what the post left out",
    caption: "Missing pay, hours, or company details become questions to ask before you apply.",
    seconds: 5.5,
  },
  {
    id: "prompt",
    step: 7,
    title: "Copy the prompt, not the message",
    caption: "ApplyGuard writes the prompt. You run it in your own AI account, so it stays free.",
    seconds: 5.5,
  },
  {
    id: "link",
    step: 8,
    title: "Background-check the link",
    caption: "Paste a company URL for a credibility score and a breakdown of the real domain.",
    seconds: 6,
  },
  {
    id: "tracker",
    step: 9,
    title: "Track every application",
    caption: "Save a job, set a follow-up date, and move it from Saved through to Offer.",
    seconds: 6,
  },
  {
    id: "privacy",
    step: 10,
    title: "Your data stays yours",
    caption: "Nothing is uploaded. Everything lives in this browser, and you can export or wipe it.",
    seconds: 5.5,
  },
  {
    id: "closing",
    step: null,
    title: "Check the post before you invest your time",
    caption: "Free, no sign-up, built for Filipino remote job seekers.",
    seconds: 5,
  },
];

export type Chapter = ChapterSpec & {
  from: number;
  to: number;
  durationInFrames: number;
  index: number;
};

/** Chapters with derived frame ranges. */
export const CHAPTERS: Chapter[] = (() => {
  let cursor = 0;
  return SPECS.map((spec, index) => {
    const durationInFrames = Math.round(spec.seconds * FPS);
    const chapter: Chapter = {
      ...spec,
      index,
      from: cursor,
      to: cursor + durationInFrames,
      durationInFrames,
    };
    cursor += durationInFrames;
    return chapter;
  });
})();

export const DURATION = CHAPTERS[CHAPTERS.length - 1].to;

export function chapter(id: ChapterId): Chapter {
  const found = CHAPTERS.find((ch) => ch.id === id);
  if (!found) throw new Error(`unknown chapter: ${id}`);
  return found;
}

/** Total number of numbered steps, for the "Step n of N" badge. */
export const STEP_COUNT = SPECS.filter((s) => s.step !== null).length;

// ── the worked example the film walks through ───────────────────────────────

export const POST = {
  title: "Marketing Coordinator — Remote",
  company: "NovaBridge Solutions",
  lines: [
    { id: "pay", text: "₱25,000–₱35,000 monthly", tone: "neutral" as const },
    { id: "hours", text: "Flexible schedule, work from home", tone: "neutral" as const },
    { id: "contact", text: "Message us on Telegram for quick apply", tone: "stop" as const },
    { id: "fee", text: "₱1,500 onboarding fee, refunded after 3 months", tone: "stop" as const },
    { id: "address", text: "Company address not included", tone: "warn" as const },
    { id: "website", text: "Official company website not provided", tone: "warn" as const },
  ],
};

/** Chips the scanner pins to individual lines during the scan chapter. */
export const CHIPS: Record<string, { label: string; tone: "stop" | "warn" | "brand" }> = {
  pay: { label: "Clear pay range", tone: "brand" },
  contact: { label: "Off-platform", tone: "stop" },
  fee: { label: "Upfront fee", tone: "stop" },
  address: { label: "Missing", tone: "warn" },
  website: { label: "Missing", tone: "warn" },
};

/** The intake fields filled during the "add your details" chapter. */
export const INTAKE = [
  { label: "Role you're after", value: "Marketing Coordinator" },
  { label: "Your top skills", value: "campaigns, email, analytics" },
  { label: "Experience level", value: "Intermediate" },
  { label: "Your monthly pay floor", value: "₱30,000" },
];

/** Score breakdown, matching the four components the scorer actually uses. */
export const BREAKDOWN = [
  { label: "Skill match", value: 22, max: 35 },
  { label: "Pay vs your floor", value: 18, max: 25 },
  { label: "Post clarity", value: 9, max: 20 },
  { label: "Role & commitment", value: 12, max: 20 },
];

export const SCORE = {
  raw: 61,
  softPenalty: 16,
  hardCapped: true,
  final: 15,
  verdict: "Skip",
  verdictSub: "The risk isn't worth it. Move on.",
  risk: "High risk",
};

export const FLAGS = {
  hard: [
    {
      label: "Wants money before you start",
      why: "Paying a fee to get hired is how advance-fee scams work.",
    },
    {
      label: "Moves you off-platform immediately",
      why: "Telegram-only contact leaves no record and no recourse.",
    },
  ],
  soft: [
    {
      label: "No verifiable company details",
      why: "No address or website means you cannot confirm who is hiring.",
    },
  ],
};

export const MISSING = [
  "What is the registered business name?",
  "Is the onboarding fee refundable in writing?",
  "Which official channel handles applications?",
  "How many hours per week are expected?",
];

export const PROMPT_LINES = [
  "You are helping me evaluate a remote job post.",
  "Ask the employer these questions before I apply:",
  "1. Registered business name and SEC/DTI number",
  "2. Written terms for the ₱1,500 onboarding fee",
  "3. An official company email or website",
];

export const LINK_CHECK = {
  url: "https://novabridge-hiring.tk/apply?ref=tg",
  protocol: "https://",
  sub: "novabridge-hiring.",
  domain: "tk",
  path: "/apply",
  query: "?ref=tg",
  score: 24,
  verdict: "Looks suspicious",
  signals: [
    { text: "High-risk top-level domain (.tk)", tone: "stop" as const },
    { text: "Domain does not match the company name", tone: "stop" as const },
    { text: "No official company website found", tone: "warn" as const },
  ],
};

export const TRACKER_STAGES = ["Saved", "Applied", "Interview", "Offer", "Closed"];

export const PRIVACY_POINTS = [
  "The scan runs in your browser — the post is never uploaded",
  "Saved jobs live in this browser's storage only",
  "Export a JSON backup or a CSV any time",
  "One button wipes everything",
];

export const CLOSING = {
  headline: "Check the post before you invest your time.",
  sub: "Free, no sign-up. Built for Filipino remote job seekers.",
  cta: "applyguard.ph",
};
