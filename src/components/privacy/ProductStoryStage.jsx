// ProductStoryStage.jsx — The animated stage showing the ApplyGuard product journey.
//
// Driven by the `scene` prop from the parent state machine. Each scene
// renders a different phase of the user story: suspicious listing → scan
// → results → guidance → premium → tracker → takeaway.
//
// Uses HTML for cards, labels, and text; SVG only for the score gauge
// and decorative elements. All animations use motion/react transforms
// and opacity — no canvas, no WebGL, no heavy filters.
import { m } from "motion/react";
import { duration, easing } from "../../motion/tokens.js";
import {
  LISTING, RISK_RESULTS, FOLLOW_UPS, TRACKER_STAGES,
} from "./productStoryScenes.js";

/* ── tone styles (match the existing design system) ─────────────── */
const toneStyles = {
  stop: { text: "text-stop-ink", mark: "bg-stop", chip: "bg-stop-soft text-stop-ink" },
  warn: { text: "text-warn-ink", mark: "bg-warn", chip: "bg-warn-soft text-warn-ink" },
  neutral: { text: "text-ink-soft", mark: "", chip: "" },
};

/* ── motion helpers ──────────────────────────────────────────────── */
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: duration.normal, ease: easing.enter, delay },
});

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.reveal, ease: easing.enter, delay },
});

/* ── sub-components ──────────────────────────────────────────────── */

/** The suspicious job listing document. */
function JobListing({ scene, reduced }) {
  const showDoc = scene === "listing" || scene === "scanning" || scene === "results" || scene === "guidance";
  const scanning = scene === "scanning";
  const showFlags = scene === "scanning" || scene === "results" || scene === "guidance";

  if (!showDoc) return null;

  return (
    <div className="glass-subtle relative overflow-hidden rounded-lg p-3">
      {/* scan line */}
      {scanning && !reduced && (
        <m.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 z-10 h-5 rounded-full"
          style={{
            // Tokenised, not hardcoded: this was the old light-mode teal, which
            // all but vanished once the surface behind it went dark.
            background:
              "linear-gradient(180deg, transparent, color-mix(in oklab, var(--color-brand-lift) 22%, transparent) 45%, color-mix(in oklab, var(--color-brand-lift) 62%, transparent) 50%, color-mix(in oklab, var(--color-brand-lift) 22%, transparent) 55%, transparent)",
          }}
          initial={{ opacity: 0, top: "4%" }}
          animate={{ opacity: 1, top: ["4%", "88%"] }}
          transition={{ duration: 1.5, ease: easing.standard }}
        />
      )}

      <ul className="space-y-1.5 text-[0.72rem] leading-snug">
        {LISTING.map((row, i) => {
          const s = toneStyles[row.tone];
          const flagged = row.tone !== "neutral";
          return (
            <m.li
              key={row.id}
              initial={reduced ? false : { opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: duration.normal, ease: easing.enter, delay: reduced ? 0 : 0.04 * i }}
              className="flex items-start justify-between gap-2"
            >
              <span className="relative min-w-0">
                <span className={flagged && showFlags ? s.text : "text-ink-soft"}>
                  {row.text}
                </span>
                {/* marker underline */}
                {flagged && showFlags && !reduced && (
                  <m.span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 left-0 h-[2.5px] rounded-full ${s.mark}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{ originX: 0, width: "100%" }}
                    transition={{ duration: duration.normal, ease: easing.enter, delay: 0.1 * i }}
                  />
                )}
              </span>
              {flagged && showFlags && (
                <m.span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[0.5rem] font-semibold ${s.chip}`}
                  initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: duration.fast, ease: easing.overshoot, delay: 0.1 * i + 0.05 }}
                >
                  {row.note}
                </m.span>
              )}
            </m.li>
          );
        })}
      </ul>
    </div>
  );
}

/** Risk score gauge with verdict stamp. */
function ScoreGauge({ scene, reduced }) {
  const show = scene === "results" || scene === "guidance";
  if (!show) return null;

  const score = 22;
  const radius = 26;
  const circ = 2 * Math.PI * radius;
  const dashoffset = circ * (1 - score / 100);

  return (
    <m.div className="flex items-center gap-3" {...slideUp(0.1)}>
      <div className="relative h-16 w-16 shrink-0">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--color-line)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none" stroke="var(--color-stop)" strokeWidth="5"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashoffset}
            className="ring-fill"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-stop-ink">
          {score}
        </span>
      </div>
      <div>
        <m.span
          className="stamp inline-block px-2.5 py-0.5 text-sm font-bold text-stop-ink"
          initial={reduced ? false : { opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ duration: duration.deliberate, ease: easing.overshoot }}
        >
          SKIP
        </m.span>
        <p className="mt-1 text-[0.65rem] leading-tight text-ink-faint">
          3 red flags · 1 missing detail
        </p>
      </div>
    </m.div>
  );
}

/** Risk result list. */
function RiskList({ scene, reduced }) {
  const show = scene === "results" || scene === "guidance";
  if (!show) return null;

  return (
    <m.div className="mt-3 space-y-1" {...fadeIn(0.2)}>
      {RISK_RESULTS.map((item, i) => (
        <m.div
          key={i}
          initial={reduced ? false : { opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: duration.normal, ease: easing.enter, delay: reduced ? 0 : 0.08 * i }}
          className="flex items-center gap-2 text-[0.68rem]"
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.tone === "stop" ? "bg-stop" : "bg-warn"}`} />
          <span className={item.tone === "stop" ? "text-stop-ink" : "text-warn-ink"}>{item.label}</span>
        </m.div>
      ))}
    </m.div>
  );
}

/** Follow-up questions. */
function GuidancePanel({ scene, reduced }) {
  const show = scene === "guidance";
  if (!show) return null;

  return (
    <m.div className="mt-3 rounded-lg border border-brand/20 bg-brand/5 p-3" {...fadeIn(0.1)}>
      <p className="mb-1.5 text-[0.65rem] font-semibold text-brand">What to do next</p>
      <ul className="space-y-1">
        {FOLLOW_UPS.map((q, i) => (
          <m.li
            key={i}
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.normal, ease: easing.enter, delay: reduced ? 0 : 0.08 * i }}
            className="flex items-start gap-1.5 text-[0.62rem] leading-snug text-ink-soft"
          >
            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
            {q}
          </m.li>
        ))}
      </ul>
    </m.div>
  );
}

/** Premium features brief. */
function PremiumPanel({ scene, reduced }) {
  const show = scene === "premium";
  if (!show) return null;

  const features = [
    { icon: "🔍", text: "Deeper credibility review" },
    { icon: "📄", text: "Resume tailoring to the listing" },
    { icon: "💬", text: "Outreach message help" },
    { icon: "🎯", text: "Mock interview preparation" },
  ];

  return (
    <m.div className="mt-3 rounded-lg border border-warn/30 bg-warn-soft/40 p-3" {...fadeIn(0)}>
      <p className="mb-1.5 text-[0.65rem] font-semibold text-warn-ink">Premium AI support</p>
      <div className="grid grid-cols-2 gap-1.5">
        {features.map((f, i) => (
          <m.div
            key={i}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.normal, ease: easing.enter, delay: reduced ? 0 : 0.08 * i }}
            className="glass-subtle flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[0.6rem] text-ink-soft"
          >
            <span aria-hidden="true">{f.icon}</span>
            <span>{f.text}</span>
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

/** Application tracker stages. */
function TrackerStages({ scene, reduced }) {
  const show = scene === "tracker";
  if (!show) return null;

  return (
    <m.div className="mt-3" {...fadeIn(0)}>
      <p className="mb-2 text-[0.65rem] font-semibold text-brand">Saved to tracker</p>
      <div className="flex items-center gap-1">
        {TRACKER_STAGES.map((stage, i) => (
          <m.div
            key={i}
            initial={reduced ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: duration.normal, ease: easing.overshoot, delay: reduced ? 0 : 0.1 * i }}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.58rem] font-medium ${
              stage.done
                ? "bg-brand text-paper"
                : "glass-subtle text-ink-faint"
            }`}
          >
            {stage.done && (
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
            )}
            {stage.label}
          </m.div>
        ))}
      </div>
    </m.div>
  );
}

/** Final takeaway message. */
function Takeaway({ scene }) {
  const show = scene === "takeaway" || scene === "pause";
  if (!show) return null;

  return (
    <m.div className="mt-4 text-center" {...fadeIn(0.1)}>
      <p className="font-display text-lg text-ink">Apply with more confidence.</p>
      <p className="mt-1 text-[0.7rem] text-ink-soft">
        Check the opportunity. Spot risks. Get guidance. Track your progress.
      </p>
    </m.div>
  );
}

/* ── main stage ──────────────────────────────────────────────────── */

export default function ProductStoryStage({ scene, reduced }) {
  const showListing = scene === "listing" || scene === "scanning" || scene === "results" || scene === "guidance";
  const showGauge = scene === "results" || scene === "guidance";
  const showPremium = scene === "premium";
  const showTracker = scene === "tracker";
  const showTakeaway = scene === "takeaway" || scene === "pause";

  return (
    <div className="relative">
      {/* ── intro ─────────────────────────────────────── */}
      {scene === "intro" && (
        <m.p
          className="mb-4 text-center text-sm text-ink-soft"
          {...fadeIn(0.1)}
        >
          See how ApplyGuard helps you apply safely
        </m.p>
      )}

      {/* ── main card ─────────────────────────────────── */}
      {(showListing || showGauge || showPremium || showTracker) && (
        <m.div
          className="mx-auto max-w-md glass-subtle rounded-2xl p-4"
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.reveal, ease: easing.enter }}
        >
          {/* card header */}
          <div className="mb-3 flex items-center justify-between border-b border-line/70 pb-2">
            <span className="eyebrow">
              {showTracker ? "Tracker" : showGauge ? "Results" : "Scan"}
            </span>
            <span className="flex items-center gap-1.5 text-[0.6rem] font-medium text-ink-faint">
              <span className={`h-1.5 w-1.5 rounded-full ${
                scene === "scanning" ? "bg-brand pulse-dot" : showGauge ? "bg-stop" : "bg-line"
              }`} />
              {scene === "scanning" ? "Inspecting…" : showGauge ? "Done" : showTracker ? "Saved" : "Ready"}
            </span>
          </div>

          {/* content varies by scene */}
          <JobListing scene={scene} reduced={reduced} />
          <ScoreGauge scene={scene} reduced={reduced} />
          <RiskList scene={scene} reduced={reduced} />
          <GuidancePanel scene={scene} reduced={reduced} />
          <PremiumPanel scene={scene} reduced={reduced} />
          <TrackerStages scene={scene} reduced={reduced} />
        </m.div>
      )}

      {/* ── takeaway (outside card) ───────────────────── */}
      <Takeaway scene={scene} />

      {/* ── scene-specific labels ─────────────────────── */}
      {scene === "listing" && (
        <m.p className="mt-3 text-center text-[0.68rem] text-ink-faint" {...fadeIn(0.2)}>
          This listing has several warning signs
        </m.p>
      )}
      {scene === "scanning" && (
        <m.p className="mt-3 text-center text-[0.68rem] text-brand" {...fadeIn(0)}>
          Scanning for scam signals…
        </m.p>
      )}
      {showGauge && !showTracker && (
        <m.p className="mt-3 text-center text-[0.68rem] text-ink-faint" {...fadeIn(0.2)}>
          Risk assessment with reasons and next steps
        </m.p>
      )}
      {scene === "premium" && (
        <m.p className="mt-3 text-center text-[0.68rem] text-warn-ink" {...fadeIn(0)}>
          Premium AI goes deeper — resume, interview, outreach
        </m.p>
      )}
      {showTracker && (
        <m.p className="mt-3 text-center text-[0.68rem] text-ink-faint" {...fadeIn(0.2)}>
          Track every opportunity from save to offer
        </m.p>
      )}
    </div>
  );
}
