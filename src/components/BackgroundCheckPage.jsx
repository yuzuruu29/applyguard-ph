import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { callAi } from "../lib/ai.js";
import {
  analyzeUrl,
  parseUrl,
  canUseFreeCheck,
  getFreeChecksUsed,
  incrementFreeCheck,
  DAILY_FREE_LIMIT,
} from "../lib/backgroundcheck.js";

const VERDICT_STYLES = {
  credible: { bg: "bg-go-soft", border: "border-go/30", text: "text-go-ink", label: "Looks credible", dot: "bg-go" },
  caution: { bg: "bg-warn-soft", border: "border-warn/30", text: "text-warn-ink", label: "Proceed with caution", dot: "bg-warn" },
  suspicious: { bg: "bg-stop-soft", border: "border-stop/30", text: "text-stop-ink", label: "Suspicious — investigate first", dot: "bg-stop" },
  invalid: { bg: "bg-panel", border: "border-line", text: "text-ink-soft", label: "Invalid URL", dot: "bg-ink-faint" },
};

function ScoreGauge({ score, verdict }) {
  const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.invalid;
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const strokeColor = verdict === "credible" ? "var(--color-go)" : verdict === "caution" ? "var(--color-warn)" : "var(--color-stop)";

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          className="ring-fill"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold text-ink">{score}</span>
        <span className="text-[0.6rem] font-medium tracking-wide text-ink-faint">/ 100</span>
      </div>
    </div>
  );
}

function HeuristicResult({ result }) {
  const style = VERDICT_STYLES[result.verdict] || VERDICT_STYLES.invalid;

  return (
    <div className={`rise rounded-2xl border ${style.border} ${style.bg} p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center gap-5">
        <ScoreGauge score={result.score} verdict={result.verdict} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
            <h3 className={`font-display text-lg font-semibold ${style.text}`}>{style.label}</h3>
          </div>
          <p className="mt-1 truncate font-mono text-xs text-ink-faint">{result.meta.domain || result.meta.input}</p>
          {result.meta.isKnownPlatform && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-go-soft px-2.5 py-0.5 text-xs font-medium text-go-ink">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Known platform
            </p>
          )}
        </div>
      </div>

      {/* Positive signals */}
      {result.positives.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {result.positives.map((p, i) => (
            <p key={i} className="flex items-start gap-2 text-sm text-go-ink">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-go" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {p}
            </p>
          ))}
        </div>
      )}

      {/* Warning signals */}
      {result.signals.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Flags detected</p>
          {result.signals.map((s, i) => (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm ${
              s.severity === "hard" ? "border-stop/25 bg-stop-soft/70 text-stop-ink" : "border-warn/25 bg-warn-soft/70 text-warn-ink"
            }`}>
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.severity === "hard" ? "bg-stop" : "bg-warn"}`} aria-hidden="true" />
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      )}

      {result.signals.length === 0 && result.verdict !== "invalid" && (
        <p className="mt-4 text-sm text-ink-soft">
          No major URL-level flags found. This doesn't guarantee the company is legitimate — always verify independently.
        </p>
      )}
    </div>
  );
}

export default function BackgroundCheckPage() {
  const { user, tier, usageCount, aiCap, refreshEntitlement } = useAuth();

  const [url, setUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [context, setContext] = useState("");
  const [heuristicResult, setHeuristicResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [checksUsed, setChecksUsed] = useState(getFreeChecksUsed());

  const remaining = DAILY_FREE_LIMIT - checksUsed;
  const aiRemaining = Math.max(0, aiCap - usageCount);

  const handleQuickCheck = () => {
    setError("");
    setAiResult(null);
    const parsed = parseUrl(url);
    if (!parsed) {
      setError("That doesn't look like a valid URL. Include the full link (e.g. https://example.com).");
      return;
    }
    if (!canUseFreeCheck()) {
      setError(`Daily free limit reached (${DAILY_FREE_LIMIT}/day). Sign in with Premium for unlimited AI checks.`);
      return;
    }
    const result = analyzeUrl(url);
    setHeuristicResult(result);
    setChecksUsed(incrementFreeCheck());
  };

  const handleAiCheck = async () => {
    setError("");
    const parsed = parseUrl(url);
    if (!parsed) {
      setError("Paste a valid URL first.");
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const data = await callAi("backgroundcheck", {
        rawText: url,
        extra: { url: parsed.href, companyName: companyName.trim(), context: context.trim() },
      });
      setAiResult(data.text || "No response generated.");
      refreshEntitlement();
    } catch (err) {
      setError(err?.message || "AI check failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="elev relative overflow-hidden rounded-3xl border border-line bg-card px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-brand/[0.05]" />
        <div className="pointer-events-none absolute left-5 top-5 h-4 w-4 border-l-2 border-t-2 border-line" aria-hidden="true" />
        <div className="pointer-events-none absolute right-5 top-5 h-4 w-4 border-r-2 border-t-2 border-line" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <p className="eyebrow rise">Company & link check</p>
          <h1 className="rise d1 mt-3 font-display text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
            Background check a <span className="marker-underline">company or link</span>
          </h1>
          <p className="rise d2 mt-4 text-lg leading-relaxed text-ink-soft">
            Paste a job-posting URL or company website. Get an instant credibility scan for free,
            or unlock the full AI-powered deep check with Premium.
          </p>
          <div className="rise d3 mt-5 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-go-soft px-3 py-1.5 font-medium text-go-ink">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Free: instant URL scan ({DAILY_FREE_LIMIT}/day)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 font-medium text-brand-deep">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Premium: AI deep credibility report
            </span>
          </div>
        </div>
      </section>

      {/* Input form */}
      <section className="elev rounded-3xl border border-line bg-card p-5 sm:p-7">
        <div className="space-y-5">
          {/* URL input */}
          <div>
            <label htmlFor="bg-url" className="mb-1.5 block text-sm font-medium text-ink">
              Company or job-posting URL
            </label>
            <div className="field-frame flex rounded-xl border border-line bg-card">
              <span className="field-accent" aria-hidden="true" />
              <span className="flex items-center pl-3.5 text-ink-faint">
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              </span>
              <input
                id="bg-url"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
                placeholder="https://company-website.com or job-posting link"
                className="field-input w-full rounded-xl bg-transparent px-3 py-3 text-ink placeholder:text-ink-faint focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter") handleQuickCheck(); }}
              />
            </div>
          </div>

          {/* Optional fields for AI check */}
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink list-none">
              <span className="text-brand transition-transform duration-200 group-open:rotate-90" aria-hidden="true">▶</span>
              Add context for the AI deep check (optional)
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="bg-company" className="mb-1.5 block text-sm font-medium text-ink">Company name</label>
                <div className="field-frame flex rounded-xl border border-line bg-card">
                  <span className="field-accent" aria-hidden="true" />
                  <input
                    id="bg-company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Remote Solutions"
                    className="field-input w-full rounded-xl bg-transparent px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bg-context" className="mb-1.5 block text-sm font-medium text-ink">
                  What do they claim? <span className="font-normal text-ink-faint">optional</span>
                </label>
                <div className="field-frame flex rounded-xl border border-line bg-card">
                  <span className="field-accent" aria-hidden="true" />
                  <input
                    id="bg-context"
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. $500/day data entry, no experience"
                    className="field-input w-full rounded-xl bg-transparent px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleQuickCheck}
              disabled={remaining <= 0}
              className="rounded-full bg-brand px-6 py-3 font-semibold text-paper shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none"
            >
              Quick scan — free
            </button>

            {tier === "premium" ? (
              <button
                type="button"
                onClick={handleAiCheck}
                disabled={aiLoading || aiRemaining <= 0}
                className="rounded-full border-2 border-brand px-6 py-3 font-semibold text-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand/5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none"
              >
                {aiLoading ? "Analyzing…" : "AI deep check"}
              </button>
            ) : (
              <Link
                to="/offers"
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 px-5 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand/5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Unlock AI deep check — Premium
              </Link>
            )}
          </div>

          {/* Usage indicator */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-faint">
            <span>
              Free scans: <strong className={remaining <= 0 ? "text-stop-ink" : "text-ink"}>{remaining}</strong> of {DAILY_FREE_LIMIT} left today
            </span>
            {tier === "premium" && (
              <span>
                AI uses: <strong className="text-ink">{aiRemaining}</strong> of {aiCap} this month
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-stop/30 bg-stop-soft p-4">
              <p className="text-sm font-medium text-stop-ink">{error}</p>
            </div>
          )}
        </div>
      </section>

      {/* Heuristic result */}
      {heuristicResult && (
        <section className="space-y-3">
          <p className="eyebrow">Quick scan result</p>
          <HeuristicResult result={heuristicResult} />
        </section>
      )}

      {/* AI result */}
      {aiLoading && (
        <section className="elev rounded-3xl border border-line bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="pulse-dot h-3 w-3 rounded-full bg-brand" aria-hidden="true" />
            <p className="text-sm font-medium text-ink-soft">Running AI credibility analysis…</p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-3/4 animate-pulse rounded-full bg-panel" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-panel" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-panel" />
          </div>
        </section>
      )}

      {aiResult && (
        <section className="space-y-3">
          <p className="eyebrow">AI deep check report</p>
          <div className="elev rise rounded-3xl border border-brand/20 bg-card p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
              <h3 className="font-display text-lg text-ink">AI Credibility Report</h3>
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap font-sans leading-relaxed text-ink">
              {aiResult}
            </div>
          </div>
        </section>
      )}

      {/* Info section */}
      <section className="rounded-3xl border border-line bg-panel/50 p-6 sm:p-8">
        <h2 className="font-display text-lg text-ink">What we check</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">Free quick scan</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
              <li>• URL structure & domain patterns</li>
              <li>• Risky TLD detection (.tk, .xyz, etc.)</li>
              <li>• Known scam URL patterns</li>
              <li>• Phishing keyword detection</li>
              <li>• Known platform recognition</li>
              <li>• HTTPS / security check</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Premium AI deep check</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
              <li>• Full credibility assessment</li>
              <li>• Company legitimacy analysis</li>
              <li>• PH-specific verification steps (SEC, DTI)</li>
              <li>• Positive & negative signal breakdown</li>
              <li>• Actionable next steps</li>
              <li>• Context-aware (your notes + company name)</li>
            </ul>
          </div>
        </div>
        <p className="mt-5 text-xs text-ink-faint">
          The quick scan runs entirely in your browser — nothing is uploaded. The AI deep check sends
          the URL and your optional context to our AI provider for analysis (processed in memory, never stored).
          Neither check guarantees a company is legitimate — always verify independently.
        </p>
      </section>
    </div>
  );
}
