import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../store.jsx";
import { analyzeJob, deriveTitle } from "../lib/analyze.js";
import { SAMPLES } from "../lib/samples.js";
import { dueFollowUps, todayLocalISO } from "../lib/followups.js";
import { useScrollReveal } from "../hooks/useScrollReveal.js";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const EXPERIENCE = ["", "Entry-level", "Intermediate", "Senior"];
const RATE_TYPES = ["Not stated", "Hourly", "Weekly", "Monthly", "Yearly", "Per project"];
const HOURS = ["Not stated", "Under 20", "20–40", "40+"];

const CHECK_LINES = [
  "Scanning for scam signals…",
  "Checking role and pay fit…",
  "Looking for missing details…",
  "Calculating your score…",
];

const labelCls = "mb-1.5 block text-sm font-medium text-ink";
const fieldInputCls =
  "field-input w-full rounded-xl bg-transparent px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none";

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink-faint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// Lighter sibling of the paste slip: a lift/glow frame with a growing
// underline accent on focus. Wraps a single input or select.
function FieldFrame({ children }) {
  return (
    <div className="field-frame flex rounded-xl border border-line bg-card">
      <span className="field-accent" aria-hidden="true" />
      {children}
    </div>
  );
}

export default function ScanForm() {
  const navigate = useNavigate();
  const { settings, setResult, jobs } = useApp();

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
    if (prefersReducedMotion()) {
      run();
      return;
    }
    setChecking(true);
    timerRef.current = setTimeout(run, 750);
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

  return (
    <div className="space-y-12" ref={revealRef}>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="elev gradient-border relative overflow-hidden rounded-3xl border border-line bg-card px-6 py-12 sm:px-12 sm:py-16">
        {/* animated floating orbs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand/[0.07] blur-md float-slow" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-marker/[0.14] blur-md float-slower" />
        <div className="pointer-events-none absolute right-1/4 top-1/2 h-36 w-36 rounded-full bg-brand/[0.05] blur-sm float-gentle" />
        <div className="pointer-events-none absolute left-1/3 -top-8 h-24 w-24 rounded-full bg-marker/[0.08] blur-sm float-gentle" />
        {/* faint registration ticks — the "inspection desk" detail */}
        <div className="pointer-events-none absolute left-5 top-5 h-4 w-4 border-l-2 border-t-2 border-line" aria-hidden="true" />
        <div className="pointer-events-none absolute right-5 top-5 h-4 w-4 border-r-2 border-t-2 border-line" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-5 left-5 h-4 w-4 border-b-2 border-l-2 border-line" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-5 right-5 h-4 w-4 border-b-2 border-r-2 border-line" aria-hidden="true" />

        <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          {/* left: copy */}
          <div className="max-w-2xl">
            <p className="eyebrow rise">Free job-post check · No sign-up</p>
            <h1 className="rise d1 mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              Is this remote job{" "}
              <span className="marker-underline">worth applying to</span>, or a trap?
            </h1>
            <p className="rise d2 mt-5 text-lg leading-relaxed text-ink-soft">
              Paste the post, add a few quick details, and get a straight answer: apply, slow
              down, or skip. You also see the scam signals and the questions you should ask.
            </p>

            <div className="rise d3 mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="shimmer glow-pulse group rounded-full bg-brand px-7 py-3.5 text-base font-semibold text-paper shadow-lg shadow-brand/25 transition-all duration-300 hover:-translate-y-1 hover:bg-brand-deep hover:shadow-xl hover:shadow-brand/30 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none"
              >
                Scan a job post — free
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-y-1 group-hover:scale-110" aria-hidden="true">↓</span>
              </button>
              <span className="text-sm text-ink-faint">Takes about a minute.</span>
            </div>

            {/* trust badges */}
            <div className="rise d4 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Runs in your browser
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Instant results
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                Built for PH remote workers
              </span>
            </div>
          </div>

          {/* right: verdict preview card — gently bobbing */}
          <div className="rise d3 hidden lg:block">
            <div className="bob w-64 rounded-2xl border border-line bg-card p-5 shadow-xl shadow-ink/8">
              <div className="flex items-center gap-3 border-b border-line pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-go-soft">
                  <svg className="h-5 w-5 text-go" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Verdict: Apply</p>
                  <p className="text-xs text-ink-faint">Fit score 82/100</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-2 w-full rounded-full bg-panel"><div className="h-2 w-[82%] rounded-full bg-go" /></div>
                <div className="flex justify-between text-[0.65rem] text-ink-faint">
                  <span>Scam check: Clear</span>
                  <span>Pay: Fair</span>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                <span className="rounded-full bg-go-soft px-2 py-0.5 text-[0.6rem] font-medium text-go-ink">No red flags</span>
                <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[0.6rem] font-medium text-warn-ink">1 question to ask</span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-ink-faint">Example verdict preview</p>
          </div>
        </div>

        {/* verdict legend */}
        <div className="rise d5 mt-10 flex flex-wrap gap-2.5 border-t border-line pt-6 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-go-soft px-3.5 py-1.5 text-go-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-go" aria-hidden="true" /> Apply — go for it
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3.5 py-1.5 text-warn-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden="true" /> Caution — check first
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stop-soft px-3.5 py-1.5 text-stop-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-stop" aria-hidden="true" /> Skip — not worth it
          </span>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="scroll-reveal">
        <p className="eyebrow mb-4">How it works</p>
        <div className="scroll-reveal-stagger grid gap-4 sm:grid-cols-3">
          {[
            { step: "1", title: "Paste the job post", desc: "Copy the full listing — title, description, pay, contact info." },
            { step: "2", title: "Add your details", desc: "Optionally tell us your role, skills, and expected pay for a personal fit score." },
            { step: "3", title: "Get your verdict", desc: "See Apply, Caution, or Skip — plus red flags, missing info, and questions to ask." },
          ].map((item) => (
            <div key={item.step} className="spring-hover elev relative rounded-2xl border border-line bg-card p-5">
              <span className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-paper shadow-md shadow-brand/30">{item.step}</span>
              <h3 className="mt-2 font-display text-lg text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

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
              className="spring-hover inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink shadow-sm transition-all duration-300 hover:border-brand hover:text-brand hover:shadow-lg hover:shadow-brand/10 focus-visible:outline-none"
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Scan form ──────────────────────────────────────────── */}
      <section id="scan" className="scroll-reveal scroll-mt-24">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Scan a post</h2>
          <p className="eyebrow">Step 1 of 1</p>
        </div>

        <div className="elev space-y-6 rounded-3xl border border-line bg-card p-5 shadow-xl shadow-ink/[0.04] sm:p-7">
          <Field id="rawText" label="Paste the job post" hint="the whole thing — title, description, contact">
            <div
              className={`paste-frame flex flex-col rounded-2xl border bg-card ${
                error ? "paste-shake border-stop" : "border-line"
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
              </span>
              <span className="font-mono text-ink-faint" aria-hidden="true">
                {charCount.toLocaleString()} chars · {wordCount} {wordCount === 1 ? "word" : "words"}
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
              <span className="text-brand transition-transform duration-200 group-open:rotate-90" aria-hidden="true">▶</span>
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
                : "shimmer bg-brand shadow-lg shadow-brand/25 hover:-translate-y-1 hover:bg-brand-deep hover:shadow-xl hover:shadow-brand/30 active:translate-y-0 active:scale-[0.98]"
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
        </div>
      </section>

      {/* ── Trust & privacy ─────────────────────────────────────── */}
      <section className="scroll-reveal rounded-3xl border border-line bg-panel/50 p-6 sm:p-8">
        <div className="scroll-reveal-stagger grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              ),
              title: "Private by design",
              desc: "The scan runs entirely in your browser. Nothing is uploaded unless you create an optional account to sync.",
            },
            {
              icon: (
                <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ),
              title: "Under a minute",
              desc: "No lengthy questionnaires. Paste, optionally add context, and get your verdict instantly.",
            },
            {
              icon: (
                <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
              ),
              title: "Free forever",
              desc: "The core scanner is free with no paywall. Premium AI features are optional add-ons.",
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card border border-line shadow-sm">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Follow-up nudge — only when there are overdue follow-ups */}
      {jobs.length > 0 && (() => {
        const due = overdue.length > 0 || today.length > 0;
        if (!due) return null;
        return (
          <section className="rounded-3xl border border-warn/40 bg-warn-soft/60 p-5 sm:p-6">
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
