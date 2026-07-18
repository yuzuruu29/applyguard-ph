import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { callAi } from "../lib/ai.js";
import { AI_FEATURES } from "../lib/pricing.js";

export default function AiAssistant({ rawText, intake, settings }) {
  const { user, tier, usageCount, aiCap, refreshEntitlement } = useAuth();
  const [activeTab, setActiveTab] = useState("message");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!rawText?.trim()) {
      setError("No job post to analyze. Run a scan first.");
      return;
    }
    if (activeTab === "resume" && !resumeText.trim()) {
      setError("Paste your resume text first.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const payload = { rawText, intake, settings };
      if (activeTab === "resume") payload.extra = { resumeText };
      const data = await callAi(activeTab, payload);
      setResult(data.text || "No response generated.");
      refreshEntitlement(); // update usage count
    } catch (err) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const feature = AI_FEATURES.find((f) => f.id === activeTab);
  const tabStyle = (id) =>
    `px-4 py-2.5 text-sm font-medium rounded-full transition-colors ${
      activeTab === id
        ? "bg-brand text-paper"
        : "text-ink-soft hover:text-ink hover:bg-panel"
    }`;

  const remaining = Math.max(0, aiCap - usageCount);

  if (!user) {
    return (
      <section className="elev rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">AI-powered features</h2>
        <p className="mt-2 text-ink-soft">
          Sign in and upgrade to Premium to unlock: application message generator,
          deep scam analysis, resume tailoring, and interview prep — 60 uses a month.
        </p>
        <p className="mt-3 text-xs text-ink-faint">
          This feature sends the job post to our AI provider for processing.
          It is processed in memory and never stored.
        </p>
      </section>
    );
  }

  if (tier !== "premium") {
    return (
      <section className="elev rounded-3xl border border-brand/40 bg-brand/5 p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">AI-powered features</h2>
        <p className="mt-2 text-ink-soft">
          Upgrade to Premium to unlock all four AI features: message generator,
          deep scam analysis, resume tailoring, and interview prep.
        </p>
        <a
          href="/offers"
          className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep"
        >
          Upgrade to Premium — ₱299/mo
        </a>
        <p className="mt-3 text-xs text-ink-faint">
          This feature sends the job post to our AI provider for processing.
          It is processed in memory and never stored.
        </p>
      </section>
    );
  }

  return (
    <section className="elev rounded-3xl border border-line bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-xl text-ink">AI features</h2>
        <span className="rounded-full bg-panel px-3 py-1 text-xs font-medium text-ink-soft">
          {remaining} of {aiCap} uses left this month
        </span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4 p-1 rounded-2xl bg-panel">
        {AI_FEATURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setActiveTab(f.id);
              setResult(null);
              setError("");
            }}
            className={tabStyle(f.id)}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Resume textarea */}
      {activeTab === "resume" && (
        <div className="mb-4">
          <label htmlFor="resume-input" className="mb-1.5 block text-sm font-medium text-ink">
            Paste your resume or work history
          </label>
          <textarea
            id="resume-input"
            rows={6}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here…"
            className="w-full rounded-xl border border-line bg-paper p-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none resize-y"
          />
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || remaining <= 0}
        className="rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? `Generating ${feature?.name}…`
          : remaining <= 0
            ? "0 uses left this month"
            : `Generate ${feature?.name}`}
      </button>

      <p className="mt-2 text-xs text-ink-faint">
        This feature sends the post to our AI provider to generate the result.
        It is processed in memory and never stored.
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-2xl border border-stop/30 bg-stop-soft p-4">
          <p className="text-sm font-semibold text-stop-ink">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 rounded-2xl border border-line bg-paper p-5">
          <div className="prose prose-sm max-w-none text-ink whitespace-pre-wrap font-sans leading-relaxed">
            {result}
          </div>
        </div>
      )}
    </section>
  );
}
