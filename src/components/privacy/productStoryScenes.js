// productStoryScenes.js — Scene definitions for the product story explainer.
//
// Tells the ApplyGuard PH story: suspicious listing → scan → results →
// guidance → tracker → confidence. Each scene has a duration, chapter
// grouping, and accessible description for aria-live narration.

export const SCENES = [
  { id: "intro", duration: 1400, chapter: null, description: "See how ApplyGuard helps you apply safely." },
  { id: "listing", duration: 1800, chapter: "scan", description: "A suspicious job post appears with red flags." },
  { id: "scanning", duration: 2000, chapter: "scan", description: "ApplyGuard scans the listing and highlights risks." },
  { id: "results", duration: 2400, chapter: "results", description: "A risk score, verdict, and reasons appear." },
  { id: "guidance", duration: 2000, chapter: "guidance", description: "Follow-up questions and verification steps suggested." },
  { id: "premium", duration: 1800, chapter: "premium", description: "Premium AI offers deeper credibility review and career support." },
  { id: "tracker", duration: 1600, chapter: "tracker", description: "The opportunity is saved into your application tracker." },
  { id: "takeaway", duration: 2200, chapter: null, description: "Apply with more confidence." },
  { id: "pause", duration: 1800, chapter: null, description: "Apply with more confidence." },
];

export const SCENE_IDS = SCENES.map((s) => s.id);

export const CHAPTER_STARTS = {
  scan: "listing",
  results: "results",
  guidance: "guidance",
  premium: "premium",
  tracker: "tracker",
};

// The suspicious job listing used throughout the animation.
export const LISTING = [
  { id: "title", text: "Virtual Assistant — full remote", tone: "neutral" },
  { id: "pay", text: "Earn ₱15,000 weekly, no experience", tone: "stop", note: "Unrealistic pay" },
  { id: "contact", text: "Message us on Telegram to start", tone: "stop", note: "Off-platform" },
  { id: "fee", text: "₱500 activation fee required", tone: "stop", note: "Upfront fee" },
  { id: "addr", text: "Company address: not provided", tone: "warn", note: "Missing" },
];

// Risk results shown after scanning.
export const RISK_RESULTS = [
  { label: "Unrealistic pay claim", tone: "stop" },
  { label: "Off-platform contact only", tone: "stop" },
  { label: "Upfront fee requested", tone: "stop" },
  { label: "Missing company details", tone: "warn" },
];

// Follow-up questions suggested by the tool.
export const FOLLOW_UPS = [
  "Ask for the company's registered legal name",
  "Verify through SEC or DTI registration",
  "Request written compensation terms",
  "Confirm no application fees are required",
];

// Application tracker stages.
export const TRACKER_STAGES = [
  { label: "Saved", done: true },
  { label: "Applied", done: false },
  { label: "Interview", done: false },
  { label: "Offer", done: false },
];
