// backgroundcheck.js — client-side heuristic URL/company credibility check.
// Runs entirely in the browser (free tier). No network calls, no AI.
// The AI-powered deep check is handled server-side via the "backgroundcheck"
// feature in ai-proxy (premium tier).

import { todayLocalISO } from "./followups.js";

const DAILY_FREE_LIMIT = 3;
export const STORAGE_KEY = "ag_bgcheck_usage";

// ── Risky TLDs commonly associated with scam job posts ──────────────
const RISKY_TLDS = new Set([
  ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".club",
  ".work", ".click", ".link", ".buzz", ".icu", ".cam", ".fun",
  ".rest", ".monster", ".quest", ".sbs", ".cfd", ".lol",
]);

// ── Patterns that often appear in scam URLs ─────────────────────────
const SCAM_URL_PATTERNS = [
  { re: /(?:free|earn|income|cash|money|pay|dollar|peso)[-_]?(?:now|fast|easy|daily|online)/i, label: "Get-rich-quick language in URL" },
  { re: /(?:work[-_]?from[-_]?home|wfh)[-_]?(?:now|today|hire|urgent)/i, label: "Urgent WFH bait in URL" },
  { re: /(?:telegram|t\.me|whatsapp|wa\.me|viber|messenger)/i, label: "Messaging-app link (common in PH job scams)" },
  { re: /(?:bit\.ly|tinyurl|shorturl|cutt\.ly|rebrand\.ly|is\.gd|ow\.ly)/i, label: "URL shortener — hides real destination" },
  { re: /(?:google\.com\/forms|forms\.gle|docs\.google\.com\/forms)/i, label: "Google Form as application (no company site)" },
  { re: /(?:login|signin|verify|account|password|bank|otp)/i, label: "Phishing-related keywords in URL" },
  { re: /(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/, label: "Raw IP address instead of domain" },
  { re: /(?:xn--)/i, label: "Punycode domain — may impersonate a real brand" },
  { re: /[-_.]{3,}/, label: "Excessive separators — often auto-generated domains" },
  { re: /[a-z]{25,}/i, label: "Very long unbroken string — likely generated domain" },
];

// ── Known legitimate job platforms (lower suspicion) ────────────────
const KNOWN_PLATFORMS = [
  "linkedin.com", "onlinejobs.ph", "upwork.com", "fiverr.com",
  "freelancer.com", "indeed.com", "glassdoor.com", "jobstreet.com",
  "kalibrr.com", "workana.com", "toptal.com", "remote.co",
  "weworkremotely.com", "flexjobs.com", "angel.co", "wellfound.com",
  "virtualstaff.ph", "remotefilipino.com", "bestjobs.ph",
  "facebook.com", "fb.com",
];

// ── Scam-adjacent keywords in the URL path or subdomain ─────────────
const SCAM_KEYWORDS = [
  "data-entry-typing", "copy-paste", "no-experience-needed",
  "earn-500-daily", "part-time-typing", "easy-money",
  "no-interview", "instant-hire", "same-day-payout",
  "no-training", "unlimited-slots", "limited-slots-only",
];

/**
 * Parse a user-pasted string into a URL object.
 * Accepts with or without protocol.
 */
export function parseUrl(input) {
  let raw = (input || "").trim();
  if (!raw) return null;
  // Add protocol if missing
  if (!/^https?:\/\//i.test(raw)) {
    raw = "https://" + raw;
  }
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * Run the heuristic background check on a URL string.
 * Returns { score, verdict, signals[], positives[], meta }
 */
export function analyzeUrl(input) {
  const url = parseUrl(input);
  if (!url) {
    return {
      score: 0,
      verdict: "invalid",
      signals: [{ severity: "hard", text: "Could not parse this as a valid URL. Check the link and try again." }],
      positives: [],
      meta: { input, domain: "", tld: "" },
    };
  }

  const domain = url.hostname.toLowerCase();
  const fullHref = url.href.toLowerCase();
  const pathAndQuery = (url.pathname + url.search).toLowerCase();

  const signals = []; // bad signs
  const positives = []; // good signs

  // ── Check HTTPS ───────────────────────────────────────────────────
  if (url.protocol === "http:") {
    signals.push({ severity: "soft", text: "No HTTPS — data sent to this site is not encrypted." });
  } else {
    positives.push("Uses HTTPS (encrypted connection)");
  }

  // ── Check risky TLD ───────────────────────────────────────────────
  const tld = "." + domain.split(".").pop();
  if (RISKY_TLDS.has(tld)) {
    signals.push({ severity: "hard", text: `High-risk TLD (${tld}) — these are frequently used in scam sites.` });
  }

  // ── Check known platforms ─────────────────────────────────────────
  const isKnown = KNOWN_PLATFORMS.some((p) => domain === p || domain.endsWith("." + p));
  if (isKnown) {
    positives.push("Recognized job platform or professional network");
  }

  // ── Check URL shorteners & scam patterns ──────────────────────────
  for (const { re, label } of SCAM_URL_PATTERNS) {
    if (re.test(fullHref)) {
      const severity = label.includes("Phishing") || label.includes("IP address") ? "hard" : "soft";
      signals.push({ severity, text: label });
    }
  }

  // ── Check scam keywords in path ───────────────────────────────────
  for (const kw of SCAM_KEYWORDS) {
    if (pathAndQuery.includes(kw)) {
      signals.push({ severity: "soft", text: `Scam-associated phrase in URL: "${kw}"` });
    }
  }

  // ── Subdomain depth (phishing often uses deep subdomains) ─────────
  const parts = domain.split(".");
  if (parts.length > 4) {
    signals.push({ severity: "soft", text: `Deep subdomain chain (${parts.length} levels) — common in phishing.` });
  }

  // ── Domain length heuristic ───────────────────────────────────────
  const baseName = parts.length >= 2 ? parts[parts.length - 2] : domain;
  if (baseName.length > 20) {
    signals.push({ severity: "soft", text: "Unusually long domain name — may be auto-generated." });
  }

  // ── Port number (non-standard) ────────────────────────────────────
  if (url.port && !["80", "443", ""].includes(url.port)) {
    signals.push({ severity: "soft", text: `Non-standard port (${url.port}) — atypical for legitimate businesses.` });
  }

  // ── Calculate score (0-100, higher = more credible) ───────────────
  let score = 70; // neutral baseline
  if (url.protocol === "https:") score += 10;
  if (isKnown) score += 20;
  for (const s of signals) {
    score -= s.severity === "hard" ? 25 : 10;
  }
  score = Math.max(0, Math.min(100, score));

  // ── Verdict ───────────────────────────────────────────────────────
  let verdict;
  if (score >= 70) verdict = "credible";
  else if (score >= 40) verdict = "caution";
  else verdict = "suspicious";

  return {
    score,
    verdict,
    signals,
    positives,
    meta: {
      input: url.href,
      domain,
      tld,
      isKnownPlatform: isKnown,
      protocol: url.protocol,
      subdomainDepth: parts.length,
    },
  };
}

// ── Daily free-tier limit (localStorage) ────────────────────────────
// The "day" is the user's local calendar day (e.g. midnight in the
// Philippines), matching todayLocalISO() used by follow-ups and stats —
// NOT UTC, which would reset the limit at 8 AM PH time.

function todayKey() {
  return todayLocalISO();
}

export function getFreeChecksUsed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (data.date !== todayKey()) return 0;
    return data.count || 0;
  } catch {
    return 0;
  }
}

export function incrementFreeCheck() {
  try {
    const count = getFreeChecksUsed() + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), count }));
    return count;
  } catch {
    return 0;
  }
}

export function canUseFreeCheck() {
  return getFreeChecksUsed() < DAILY_FREE_LIMIT;
}

export { DAILY_FREE_LIMIT };

// ── Shareable plain-text report ─────────────────────────────────────
// One source of truth for verdict wording, shared by the UI and the
// copy-to-clipboard report so they can never drift apart.

export const VERDICT_LABELS = {
  credible: "Looks credible",
  caution: "Proceed with caution",
  suspicious: "Suspicious — investigate first",
  invalid: "Invalid URL",
};

/**
 * Build a plain-text summary of an analyzeUrl() result, suitable for pasting
 * into a chat or group thread. Mirrors lib/share's shareSummary voice.
 * Serious (hard) flags list before caution (soft) flags.
 *
 * @param {object} result — return value of analyzeUrl()
 * @returns {string}
 */
export function formatCheckReport(result = {}) {
  const meta = result.meta || {};
  const label = VERDICT_LABELS[result.verdict] || VERDICT_LABELS.invalid;
  const score = typeof result.score === "number" ? result.score : 0;

  const lines = ["ApplyGuard PH link check"];
  if (meta.input) lines.push(`Link: ${meta.input}`);
  if (meta.domain) lines.push(`Domain: ${meta.domain}`);
  lines.push(`Verdict: ${label} (${score}/100)`);

  const positives = Array.isArray(result.positives) ? result.positives : [];
  if (positives.length > 0) {
    lines.push("", "Good signs:");
    for (const p of positives) lines.push(`- ${p}`);
  }

  const signals = Array.isArray(result.signals) ? result.signals : [];
  if (signals.length > 0) {
    const hard = signals.filter((s) => s.severity === "hard");
    const soft = signals.filter((s) => s.severity !== "hard");
    lines.push("", "Watch out for:");
    for (const s of hard) lines.push(`- (serious) ${s.text}`);
    for (const s of soft) lines.push(`- (check) ${s.text}`);
  } else if (result.verdict !== "invalid") {
    lines.push("", "No URL-level flags found. Still verify the company independently.");
  }

  lines.push("", "Checked at applyguard.ph/background-check");
  return lines.join("\n");
}
