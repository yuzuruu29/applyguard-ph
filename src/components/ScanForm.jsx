import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { m } from "motion/react";
import { useApp } from "../store.jsx";
import { duration, easing } from "../motion/tokens.js";
import { useReducedMotion } from "../motion/useMotionConfig.js";
import { analyzeJob, deriveTitle } from "../lib/analyze.js";
import { SAMPLES } from "../lib/samples.js";
import { dueFollowUps, todayLocalISO } from "../lib/followups.js";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import { useMagnetic } from "../motion/useMagnetic.js";
import { Field, FieldFrame, fieldInputCls } from "./ui/Field.jsx";
import {
  ArrowRightIcon,
  BoltIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from "./ui/icons.jsx";
import HeroScanNarrative from "./HeroScanNarrative.jsx";
import HowItWorks from "./HowItWorks.jsx";
import TrustMarquee from "./TrustMarquee.jsx";
import HowItWorksVideo from "./HowItWorksVideo.jsx";

const EXPERIENCE = ["", "Entry-level", "Intermediate", "Senior"];
const RATE_TYPES = ["Not stated", "Hourly", "Weekly", "Monthly", "Yearly", "Per project"];
const HOURS = ["Not stated", "Under 20", "20–40", "40+"];

const TRUST_POINTS = [
  { label: "Runs in your browser", Glyph: ShieldCheckIcon },
  { label: "Instant results", Glyph: BoltIcon },
  { label: "Built for PH remote workers", Glyph: SparklesIcon },
];

const CHECK_LINES = [
  "Scanning for scam signals…",
  "Checking role and pay fit…",
  "Looking for missing details…",
  "Calculating your score…",
];

export default function ScanForm() {
  const navigate = useNavigate();
  const { settings, setResult, jobs } = useApp();
  const reduced = useReducedMotion();

  const [rawText, setRawText] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [rate, setRate] = useState("");
  const [rateType, setRateType] = useState("Not stated");
  const [hours, setHours] = useState("Not stated");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkLine, setCheckLine] = useState(0);
  const timerRef = useRef(null);

  // Don't leave a pending navigation timer if the user leaves mid-check.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Cycle through inspection check lines while checking
  useEffect(() => {
    if (!checking) return;
    setCheckLine(0);
    const interval = setInterval(() => {
      setCheckLine((prev) => {
        if (prev >= CHECK_LINES.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [checking]);

  const handleScan = () => {
    if (checking) return;
    if (!rawText.trim()) {
      setError("Paste the job post first — there's nothing to check yet.");
      return;
    }
    setError("");
    const intake = {
      role: role.trim(),
      skills: skills.trim(),
      experience,
      rate: rate === "" ? 0 : Number(rate),
      rateType,
      hours,
    };
    const run = () => {
      const result = analyzeJob({ rawText, intake, settings });
      setResult({ ...result, title: deriveTitle(rawText, intake) });
      navigate("/result/preview");
    };
    // A short, calm "inspecting" beat before the verdict. Skipped entirely
    // when the user prefers reduced motion, so it never blocks them.
    if (reduced) {
      run();
      return;
    }
    setChecking(true);
    timerRef.current = setTimeout(run, 750);
  };

  const clearText = () => {
    setRawText("");
    setError("");
    document.getElementById("rawText")?.focus();
  };

  const scrollToForm = () => {
    document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("rawText")?.focus({ preventScroll: true });
  };

  const trimmed = rawText.trim();
  const hasText = trimmed.length > 0;
  const charCount = rawText.length;
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  const { overdue, today } = dueFollowUps(jobs);
  const revealRef = useScrollReveal();
  const magnetic = useMagnetic();

  return (
    <div className="space-y-12" ref={revealRef}>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="glass-strong gradient-border relative overflow-hidden rounded-[1.75rem] px-6 py-12 sm:px-12 sm:py-16">
        {/* faint registration ticks — the "inspection desk" detail */}
        <div className="pointer-events-none absolute left-5 top-5 h-4 w-4 border-l-2 border-t-2 border-brand/30" aria-hidden="true" />
        <div className="pointer-events-none absolute right-5 top-5 h-4 w-4 border-r-2 border-t-2 border-brand/30" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-5 left-5 h-4 w-4 border-b-2 border-l-2 border-brand/30" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-5 right-5 h-4 w-4 border-b-2 border-r-2 border-brand/30" aria-hidden="true" />

        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          {/* left: copy */}
          <div className="max-w-2xl">
            <p className="eyebrow rise inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1.5 text-brand-lift">
              <span className="dot-ready h-1.5 w-1.5 rounded-full bg-brand-lift" aria-hidden="true" />
              Free job-post check · No sign-up
            </p>
            <h1 className="rise d1 mt-5 font-display text-4xl font-semibold leading-[1.03] tracking-tight sm:text-5xl lg:text-[3.6rem]">
              <span className="text-ink">Is this remote job </span>
              <span className="text-gradient">worth applying to</span>
              <span className="text-ink">, or a trap?</span>
            </h1>
            <p className="rise d2 mt-5 text-lg leading-relaxed text-ink-soft">
              Paste the post, see scam signals and missing details before you apply.
            </p>

            <div className="rise d3 mt-8 flex flex-wrap items-center gap-3">
              <m.button
                type="button"
                onClick={scrollToForm}
                {...magnetic}
                className="btn-gradient gloss glow-pulse group inline-flex min-h-12 items-center rounded-full px-7 py-3.5 text-base font-semibold text-paper transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none"
              >
                Scan a job post — free
                <span
                  className="ml-2 inline-block transition-transform duration-300 group-hover:translate-y-1"
                  aria-hidden="true"
                >
                  ↓
                </span>
              </m.button>
              <span className="text-sm text-ink-faint">Takes about a minute.</span>
            </div>

            <div className="rise d4 mt-4">
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-lift transition-colors hover:text-brand"
              >
                Watch how it works
                <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>

            {/* trust badges */}
            <div className="rise d4 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              {TRUST_POINTS.map(({ label, Glyph }) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <Glyph className="h-4 w-4 text-brand-lift" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* right: live scan narrative — the product telling its own story */}
          <div className="rise d3">
            <HeroScanNarrative />
          </div>
        </div>

        {/* verdict legend */}
        <div className="rise d5 mt-10 flex flex-wrap gap-2.5 border-t border-line/70 pt-6 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-go/30 bg-go-soft px-3.5 py-1.5 text-go-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-go" aria-hidden="true" /> Apply — go for it
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn-soft px-3.5 py-1.5 text-warn-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden="true" /> Caution — check first
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-stop/30 bg-stop-soft px-3.5 py-1.5 text-stop-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-stop" aria-hidden="true" /> Skip — not worth it
          </span>
        </div>
      </section>

      {/* ── Trust ribbon ───────────────────────────────────────── */}
      <TrustMarquee />

      {/* ── How it works — one connected field-guide story (Phase 7) ─ */}
      <HowItWorks />

      {/* Sample posts — instant aha */}
      <section className="scroll-reveal space-y-3">
        <p className="text-sm font-medium text-ink-soft">Try a sample post — see a verdict in seconds:</p>
        <div className="scroll-reveal-stagger flex flex-wrap gap-2.5">
          {SAMPLES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setRawText(s.rawText);
                setRole(s.intake.role);
                setSkills(s.intake.skills);
                setExperience(s.intake.experience);
                setRate(s.intake.rate ? String(s.intake.rate) : "");
                setRateType(s.intake.rateType);
                setHours(s.intake.hours);
                setError("");
                document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="glass-subtle spring-hover inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ink transition-all duration-300 hover:border-brand hover:text-brand-lift focus-visible:outline-none"
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

       {/* ── Product story — Remotion-rendered video of what ApplyGuard does ─ */}
      <section id="how-it-works" className="scroll-reveal scroll-mt-24">
        <h2 className="font-display text-2xl text-ink">See how ApplyGuard works</h2>
        <p className="mb-6 mt-1 text-ink-soft">
          A silent, step-by-step walkthrough of the whole tool — from pasting a post to tracking
          the application.
        </p>
        <HowItWorksVideo />
      </section>

       {/* ── Scan form ──────────────────────────────────────────── */}
       <section id="scan" className="scroll-reveal scroll-mt-24">
        <h2 className="font-display text-2xl text-ink">Scan a post</h2>

        {/* Scan completion (Phase 4): as the check runs, the document card
            narrows and lifts toward the top — the sheet being drawn into the
            scanner — before the verdict expands from the same paper surface on
            the result view. Reduced-motion users skip `checking` entirely, so
            this handoff never plays for them. */}
        <m.div
          className="glass mt-4 origin-top space-y-6 rounded-3xl p-5 sm:p-7"
          animate={checking ? { scale: 0.985, y: -8 } : { scale: 1, y: 0 }}
          transition={{ duration: duration.deliberate, ease: easing.enter }}
        >
          <Field id="rawText" label="Paste the job post" hint="the whole thing — title, description, contact">
            <div
              className={`paste-frame glass-subtle flex flex-col rounded-2xl ${
                error ? "paste-shake border-stop" : ""
              }`}
            >
              <span className="paste-accent" aria-hidden="true" />
              <span className="paste-corner tl" aria-hidden="true" />
              <span className="paste-corner tr" aria-hidden="true" />
              <span className="paste-corner bl" aria-hidden="true" />
              <span className="paste-corner br" aria-hidden="true" />
              <textarea
                id="rawText"
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  // Power path: Ctrl+Enter (Cmd+Enter on Mac) runs the check
                  // without leaving the textarea.
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleScan();
                  }
                }}
                rows={8}
                placeholder="Paste everything the employer wrote here…"
                className="paste-area min-h-44 w-full resize-y rounded-2xl bg-transparent px-4 py-3.5 leading-relaxed text-ink placeholder:text-ink-faint"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "rawText-error" : "rawText-meta"}
              />
            </div>

            <div
              id="rawText-meta"
              className="mt-2 flex items-center justify-between gap-3 px-1 text-xs"
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${hasText ? "bg-go" : "dot-ready bg-brand"}`}
                  aria-hidden="true"
                />
                <span className={`font-medium ${hasText ? "text-go-ink" : "text-ink-faint"}`}>
                  {hasText ? "Post added" : "Ready to scan"}
                </span>
                {hasText && (
                  <span className="hidden text-ink-faint sm:inline">
                    · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to check
                  </span>
                )}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-mono text-ink-faint" aria-hidden="true">
                  {charCount.toLocaleString()} chars · {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
                {hasText && (
                  <button
                    type="button"
                    onClick={clearText}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 py-1 font-medium text-ink-faint transition-colors hover:bg-panel hover:text-ink"
                  >
                    <XMarkIcon className="h-3 w-3" strokeWidth={2.5} />
                    Clear
                  </button>
                )}
              </span>
            </div>

            {error && (
              <p id="rawText-error" className="mt-2 text-sm font-medium text-stop-ink">
                {error}
              </p>
            )}
          </Field>

          <details className="group">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink list-none">
              <ChevronRightIcon
                className="h-3.5 w-3.5 text-brand transition-transform duration-200 group-open:rotate-90"
                strokeWidth={2.5}
              />
              Fine-tune your check (optional)
            </summary>
            <div className="mt-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="role" label="Role you're after" hint="optional">
              <FieldFrame>
                <input
                  id="role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Virtual Assistant"
                  className={fieldInputCls}
                />
              </FieldFrame>
            </Field>

            <Field id="skills" label="Your top skills" hint="comma-separated">
              <FieldFrame>
                <input
                  id="skills"
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. customer support, email, Zendesk"
                  className={fieldInputCls}
                />
              </FieldFrame>
            </Field>

            <Field id="experience" label="Your experience level">
              <FieldFrame>
                <select
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className={fieldInputCls}
                >
                  <option value="">Choose one</option>
                  {EXPERIENCE.filter(Boolean).map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </FieldFrame>
            </Field>

            <Field id="hours" label="Hours per week">
              <FieldFrame>
                <select
                  id="hours"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className={fieldInputCls}
                >
                  {HOURS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </FieldFrame>
            </Field>

            <Field id="rate" label="Offered pay" hint="the number, if stated">
              <FieldFrame>
                <input
                  id="rate"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 45000"
                  className={fieldInputCls}
                />
              </FieldFrame>
            </Field>

            <Field id="rateType" label="Pay basis">
              <FieldFrame>
                <select
                  id="rateType"
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value)}
                  className={fieldInputCls}
                >
                  {RATE_TYPES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </FieldFrame>
            </Field>
          </div>
          </div>
          </details>

          <button
            type="button"
            onClick={handleScan}
            disabled={checking}
            aria-busy={checking}
            className={`relative w-full overflow-hidden rounded-2xl px-6 py-4 text-lg font-semibold text-paper transition-all duration-300 focus-visible:outline-none ${
              checking
                ? "scan-sweep cursor-progress bg-brand-deep shadow-inner"
                : "btn-gradient gloss hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            }`}
          >
            {checking ? (
              <span className="relative z-10 flex flex-col items-center gap-1.5">
                <span className="flex items-center gap-2 text-sm">
                  <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-paper" aria-hidden="true" />
                  {CHECK_LINES[checkLine]}
                </span>
                <span className="text-xs font-normal text-paper/70">
                  {checkLine + 1} of {CHECK_LINES.length}
                </span>
              </span>
            ) : (
              "Check this job"
            )}
          </button>
<p className="text-center text-xs text-ink-faint" aria-live="polite">
            {checking
              ? "Inspecting — checks run in your browser only."
              : "Nothing is uploaded. The check runs in your browser."}
          </p>
        </m.div>
      </section>

       {/* Follow-up nudge — only when there are overdue follow-ups */}
      {jobs.length > 0 && (() => {
        const due = overdue.length > 0 || today.length > 0;
        if (!due) return null;
        return (
          <section className="glass rounded-3xl border-warn/40 bg-warn-soft/60 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-warn-ink">
                  {overdue.length > 0
                    ? `${overdue.length} follow-up${overdue.length > 1 ? "s" : ""} overdue`
                    : `${today.length} due today`}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {overdue.length > 0
                    ? "Check on these jobs in your tracker before they go cold."
                    : "Don't let today's follow-ups slip."}
                </p>
              </div>
              <Link
                to="/tracker"
                className="inline-flex min-h-11 items-center rounded-full bg-warn px-4 py-2 text-sm font-semibold text-paper hover:bg-warn-ink transition-colors"
              >
                Open tracker
              </Link>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
