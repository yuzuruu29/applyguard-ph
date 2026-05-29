import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store.jsx";
import { analyzeJob, deriveTitle } from "../lib/analyze.js";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const EXPERIENCE = ["", "Entry-level", "Intermediate", "Senior"];
const RATE_TYPES = ["Not stated", "Hourly", "Weekly", "Monthly", "Yearly", "Per project"];
const HOURS = ["Not stated", "Under 20", "20–40", "40+"];

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
  const { settings, setResult } = useApp();

  const [rawText, setRawText] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [rate, setRate] = useState("");
  const [rateType, setRateType] = useState("Not stated");
  const [hours, setHours] = useState("Not stated");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const timerRef = useRef(null);

  // Don't leave a pending navigation timer if the user leaves mid-check.
  useEffect(() => () => clearTimeout(timerRef.current), []);

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

  return (
    <div className="space-y-10">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="elev relative overflow-hidden rounded-3xl border border-line bg-card px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-marker/10" />
        {/* faint registration ticks — the "inspection desk" detail */}
        <div className="pointer-events-none absolute left-5 top-5 h-4 w-4 border-l-2 border-t-2 border-line" aria-hidden="true" />
        <div className="pointer-events-none absolute right-5 top-5 h-4 w-4 border-r-2 border-t-2 border-line" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="eyebrow rise">Free job-post check</p>
          <h1 className="rise d1 mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Is this remote job{" "}
            <span className="marker-underline">worth applying to</span>, or a trap?
          </h1>
          <p className="rise d2 mt-5 text-lg leading-relaxed text-ink-soft">
            Paste the post, add a few quick details, and get a straight answer: apply, slow
            down, or skip. You also see the scam signals and the questions you should ask.
          </p>

          <p className="rise d3 mt-6 font-medium text-ink">
            No sign-up. No subscription. Built for Filipino remote job seekers.
          </p>

          <div className="rise d4 mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={scrollToForm}
              className="rounded-full bg-brand px-6 py-3 text-base font-semibold text-paper shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-md active:translate-y-0 active:scale-[0.99] focus-visible:outline-none"
            >
              Scan a job post — free
            </button>
            <span className="text-sm text-ink-faint">Takes about a minute.</span>
          </div>

          <ul className="rise d5 mt-8 flex flex-wrap gap-2 text-xs font-medium">
            <li className="rounded-full bg-go-soft px-3 py-1 text-go-ink">Apply — go for it</li>
            <li className="rounded-full bg-warn-soft px-3 py-1 text-warn-ink">Caution — check first</li>
            <li className="rounded-full bg-stop-soft px-3 py-1 text-stop-ink">Skip — not worth it</li>
          </ul>
        </div>
      </section>

      {/* ── Scan form ──────────────────────────────────────────── */}
      <section id="scan" className="scroll-mt-24">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Scan a post</h2>
          <p className="eyebrow">Step 1 of 1</p>
        </div>

        <div className="elev space-y-6 rounded-3xl border border-line bg-card p-5 sm:p-7">
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

          <button
            type="button"
            onClick={handleScan}
            disabled={checking}
            aria-busy={checking}
            className={`relative w-full overflow-hidden rounded-2xl px-6 py-4 text-lg font-semibold text-paper shadow-sm transition-all duration-200 focus-visible:outline-none ${
              checking
                ? "scan-sweep cursor-progress bg-brand-deep"
                : "bg-brand hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-md active:translate-y-0 active:scale-[0.99]"
            }`}
          >
            {checking ? (
              <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
                <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-paper" aria-hidden="true" />
                Checking this post…
              </span>
            ) : (
              "Check this job"
            )}
          </button>
          <p className="text-center text-xs text-ink-faint" aria-live="polite">
            {checking
              ? "Checking this post for scam signals and fit."
              : "Nothing is uploaded. The check runs in your browser."}
          </p>
        </div>
      </section>
    </div>
  );
}
