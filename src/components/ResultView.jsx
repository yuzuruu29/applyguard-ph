import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useApp } from "../store.jsx";
import { VERDICT_TONE, RISK_TONE } from "../lib/tone.js";

function ScoreRing({ score, toneClass }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const target = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  // Start empty, then fill on mount. The number itself is rendered correctly
  // from the first frame, so the value is never hidden behind the animation.
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(id);
  }, [target, c]);

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-line)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          className={`ring-fill ${toneClass}`}
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-semibold text-ink">{score}</span>
        <span className="font-mono text-[0.65rem] tracking-wider text-ink-faint">/ 100 FIT</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="rounded-xl border border-line bg-panel/30 p-3">
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono text-xs font-semibold text-brand">
          {value} <span className="font-normal text-ink-faint">/ {max}</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-panel">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FlagRow({ flag, tone, index = 0 }) {
  const styles =
    tone === "hard"
      ? "border-stop/30 bg-stop-soft"
      : "border-warn/30 bg-warn-soft";
  const dot = tone === "hard" ? "bg-stop" : "bg-warn";
  const labelColor = tone === "hard" ? "text-stop-ink" : "text-warn-ink";
  return (
    <li
      className={`rise rounded-2xl border ${styles} p-4`}
      style={{ animationDelay: `${0.06 * index}s` }}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <div>
          <p className={`font-semibold ${labelColor}`}>{flag.label}</p>
          <p className="mt-0.5 text-sm text-ink-soft">{flag.why}</p>
        </div>
      </div>
    </li>
  );
}

function NoResult() {
  return (
    <div className="rounded-3xl border border-line bg-card p-10 text-center">
      <p className="font-display text-2xl text-ink">No result to show yet</p>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        Scans aren't kept after you leave the page unless you save them. Run a fresh check to
        see a verdict here.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper hover:bg-brand-deep"
      >
        Scan a job post
      </Link>
    </div>
  );
}

export default function ResultView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { result, getJob, saveJob, notify } = useApp();

  const [copied, setCopied] = useState(false);

  const isPreview = id === "preview";
  const data = isPreview ? result : getJob(id);

  if (!data) return <NoResult />;

  const verdict = VERDICT_TONE[data.verdict] || VERDICT_TONE.Caution;
  const risk = RISK_TONE[data.riskLevel] || RISK_TONE.Medium;
  const { hard = [], soft = [] } = data.flags || {};
  const missing = data.missingInfo || [];
  const cleanFlags = hard.length === 0 && soft.length === 0;

  const handleSave = () => {
    const newId = saveJob({
      title: data.title,
      rawText: data.rawText,
      intake: data.intake,
      flags: data.flags,
      riskLevel: data.riskLevel,
      missingInfo: data.missingInfo,
      score: data.score,
      breakdown: data.breakdown,
      verdict: data.verdict,
      nextAction: data.nextAction,
      usesClarification: data.usesClarification,
      prompt: data.prompt,
    });
    notify("Saved to your tracker.", "success");
    navigate(`/result/${newId}`);
  };

  const markCopied = () => {
    notify("Prompt copied. Paste it into your AI.", "success");
    setCopied(true);
    setTimeout(() => setCopied(false), 1900);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(data.prompt);
      markCopied();
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data.prompt;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        markCopied();
      } catch {
        notify("Couldn't copy automatically. Select the text and copy it.", "error");
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="text-sm font-medium text-brand hover:text-brand-deep">
          ← Scan another
        </Link>
        {!isPreview && (
          <span className="rounded-full bg-go-soft px-3 py-1 text-xs font-semibold text-go-ink">
            Saved to tracker
          </span>
        )}
      </div>

      {/* ── Verdict + score ──────────────────────────────────────── */}
      <section className="rise elev rounded-3xl border border-line bg-card p-6 sm:p-8">
        <p className="eyebrow">{data.title}</p>
        <div className="mt-4 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div
              className={`stamp stamp-in ${verdict.stampText} ${verdict.stampBorder} px-5 py-3 text-3xl font-semibold uppercase`}
            >
              {verdict.label}
            </div>
            <div>
              <p className="settle d2 max-w-xs text-ink-soft">{verdict.sub}</p>
              <span
                className={`settle d3 mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${risk.chip}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {risk.label}
              </span>
            </div>
          </div>
          <ScoreRing score={data.score} toneClass={verdict.ring} />
        </div>
      </section>

      {/* ── Score breakdown ──────────────────────────────────────── */}
      <section className="rise d2 elev rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Why this score</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Fit is built from four parts that add up to 100.
        </p>
        <div className="mt-5 space-y-4">
          {data.breakdown.components.map((c) => (
            <BreakdownBar key={c.key} label={c.label} value={c.value} max={c.max} />
          ))}
        </div>
        {(data.breakdown.softPenalty > 0 || data.breakdown.hardCapApplied) && (
          <div className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
            {data.breakdown.softPenalty > 0 && (
              <p className="flex justify-between text-warn-ink">
                <span>{data.breakdown.softCount} soft flag(s)</span>
                <span className="font-mono">−{data.breakdown.softPenalty}</span>
              </p>
            )}
            {data.breakdown.hardCapApplied && (
              <p className="flex justify-between font-medium text-stop-ink">
                <span>Hard flag — fit capped</span>
                <span className="font-mono">max 15</span>
              </p>
            )}
            <p className="flex justify-between border-t border-line pt-2 font-semibold text-ink">
              <span>Final fit score</span>
              <span className="font-mono">{data.score}</span>
            </p>
          </div>
        )}
      </section>

      {/* ── Flags ────────────────────────────────────────────────── */}
      <section className="rise d3 elev rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Scam signals</h2>
        {cleanFlags ? (
          <div className="mt-4 rounded-2xl border border-go/30 bg-go-soft p-5">
            <p className="font-semibold text-go-ink">No major red flags turned up.</p>
            <p className="mt-1 text-sm text-ink-soft">
              That's not the same as "verified". Still confirm who the employer is, and never
              pay anything to get hired.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {hard.length > 0 && (
              <div>
                <p className="eyebrow mb-2 text-stop-ink">Hard stops</p>
                <ul className="space-y-3">
                  {hard.map((f, i) => (
                    <FlagRow key={f.id} flag={f} tone="hard" index={i} />
                  ))}
                </ul>
              </div>
            )}
            {soft.length > 0 && (
              <div>
                <p className="eyebrow mb-2 text-warn-ink">Worth a closer look</p>
                <ul className="space-y-3">
                  {soft.map((f, i) => (
                    <FlagRow key={f.id} flag={f} tone="soft" index={i} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Missing info + next action ───────────────────────────── */}
      <div className="rise d4 grid grid-cols-1 gap-7 lg:grid-cols-2">
        <section className="elev rounded-3xl border border-line bg-card p-6 sm:p-8">
          <h2 className="font-display text-xl text-ink">Before you commit</h2>
          {missing.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-ink-soft">
                The post leaves these open. Get them answered first.
              </p>
              <ul className="mt-4 space-y-3">
                {missing.map((m) => (
                  <li key={m} className="flex items-start gap-3 rounded-xl bg-warn-soft/50 p-3 text-sm text-ink border border-warn/10">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-warn text-[10px] font-bold text-warn-ink" aria-hidden="true">!</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-3 text-ink-soft">
              Nothing important looks missing. The post covers pay, hours, the employer, and
              what you'd do.
            </p>
          )}
        </section>

        <section className="elev flex flex-col rounded-3xl border border-line bg-card p-6 sm:p-8">
          <h2 className="font-display text-xl text-ink">What to do next</h2>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-panel p-5">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${verdict.dot}`} aria-hidden="true" />
            <p className="text-ink">{data.nextAction}</p>
          </div>
        </section>
      </div>

      {/* ── Message generator ────────────────────────────────────── */}
      <section className="rise d5 elev rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">
          {data.usesClarification ? "Ask these questions first" : "Your application message prompt"}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Copy this and paste it into ChatGPT, Claude, or Gemini. ApplyGuard writes the
          prompt, not the message. You run it in your own AI account, so it stays free.
        </p>
        <div className="relative mt-4">
          <textarea
            readOnly
            value={data.prompt}
            rows={10}
            aria-label="Generated prompt to copy"
            className="w-full resize-y rounded-2xl border border-line bg-paper p-4 pb-14 font-mono text-sm leading-relaxed text-ink focus:border-brand focus:outline-none"
          />
          <div className="absolute bottom-3 right-3">
            <button
              type="button"
              onClick={copyPrompt}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-paper shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none ${
                copied ? "bg-go ring-2 ring-go ring-offset-2 ring-offset-card" : "bg-ink hover:bg-ink-soft"
              }`}
              aria-live="polite"
            >
              <span aria-hidden="true" className={copied ? "scale-110 transition-transform" : ""}>
                {copied ? "✓" : "⧉"}
              </span>
              {copied ? "Copied!" : "Copy prompt"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Save ─────────────────────────────────────────────────── */}
      {isPreview && (
        <section className="rise d6 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-card/60 p-6 text-center">
          <p className="text-ink-soft">Want to track this one and follow up later?</p>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full border border-brand bg-card px-6 py-3 font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand hover:text-paper active:translate-y-0 active:scale-[0.99] focus-visible:outline-none"
          >
            Save to tracker
          </button>
        </section>
      )}

      {/* ── POST-RESULT optional extras CTA (only here, only after a result) ── */}
      <section className="rise d6 rounded-3xl border border-brand/40 bg-brand/5 p-6 sm:p-8">
        <p className="eyebrow text-brand-deep">Optional extras</p>
        <h2 className="mt-2 font-display text-2xl text-ink">
          Want more help after the scan?
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Paid add-ons are listed separately, but checkout is not active yet. The scanner stays
          free and usable without buying anything.
        </p>
        <Link
          to="/offers"
          className="mt-5 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep active:translate-y-0 active:scale-[0.99]"
        >
          See optional extras
        </Link>
      </section>
    </div>
  );
}
