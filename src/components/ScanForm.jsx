import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../store.jsx";
import { analyzeJob, deriveTitle } from "../lib/analyze.js";

const EXPERIENCE = ["", "Entry-level", "Intermediate", "Senior"];
const RATE_TYPES = ["Not stated", "Hourly", "Weekly", "Monthly", "Yearly", "Per project"];
const HOURS = ["Not stated", "Under 20", "20–40", "40+"];

const labelCls = "mb-1.5 block text-sm font-medium text-ink";
const inputCls =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus-visible:outline-none";

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

  const handleScan = () => {
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
    const result = analyzeJob({ rawText, intake, settings });
    setResult({ ...result, title: deriveTitle(rawText, intake) });
    navigate("/result/preview");
  };

  const scrollToForm = () => {
    document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("rawText")?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-10">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="rise relative overflow-hidden rounded-3xl border border-line bg-card px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/5" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-marker/10" />
        <div className="relative max-w-2xl">
          <p className="eyebrow">Free job-post check</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
            Is this remote job{" "}
            <span className="marker-underline">worth applying to</span>, or a trap?
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Paste the post, add a few quick details, and get a straight answer: apply, slow
            down, or skip. You also see the scam signals and the questions you should ask.
          </p>

          <p className="mt-6 font-medium text-ink">
            No sign-up. No subscription. Built for Filipino remote job seekers.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={scrollToForm}
              className="rounded-full bg-brand px-6 py-3 text-base font-semibold text-paper shadow-sm transition-colors hover:bg-brand-deep focus-visible:outline-none"
            >
              Scan a job post — free
            </button>
            <span className="text-sm text-ink-faint">Takes about a minute.</span>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2 text-xs font-medium">
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

        <div className="space-y-6 rounded-3xl border border-line bg-card p-5 sm:p-7">
          <Field id="rawText" label="Paste the job post" hint="the whole thing — title, description, contact">
            <textarea
              id="rawText"
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (error) setError("");
              }}
              rows={8}
              placeholder="Paste everything the employer wrote here…"
              className={`${inputCls} min-h-44 resize-y leading-relaxed`}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "rawText-error" : undefined}
            />
            {error && (
              <p id="rawText-error" className="mt-2 text-sm font-medium text-stop-ink">
                {error}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="role" label="Role you're after" hint="optional">
              <input
                id="role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Virtual Assistant"
                className={inputCls}
              />
            </Field>

            <Field id="skills" label="Your top skills" hint="comma-separated">
              <input
                id="skills"
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. customer support, email, Zendesk"
                className={inputCls}
              />
            </Field>

            <Field id="experience" label="Your experience level">
              <select
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className={inputCls}
              >
                <option value="">Choose one</option>
                {EXPERIENCE.filter(Boolean).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="hours" label="Hours per week">
              <select
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={inputCls}
              >
                {HOURS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="rate" label="Offered pay" hint="the number, if stated">
              <input
                id="rate"
                type="number"
                inputMode="numeric"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g. 45000"
                className={inputCls}
              />
            </Field>

            <Field id="rateType" label="Pay basis">
              <select
                id="rateType"
                value={rateType}
                onChange={(e) => setRateType(e.target.value)}
                className={inputCls}
              >
                {RATE_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <button
            type="button"
            onClick={handleScan}
            className="w-full rounded-2xl bg-brand px-6 py-4 text-lg font-semibold text-paper shadow-sm transition-colors hover:bg-brand-deep focus-visible:outline-none"
          >
            Check this job
          </button>
          <p className="text-center text-xs text-ink-faint">
            Nothing is uploaded. The check runs in your browser.
          </p>
        </div>
      </section>
    </div>
  );
}
