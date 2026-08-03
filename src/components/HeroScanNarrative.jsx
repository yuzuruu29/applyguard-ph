// HeroScanNarrative.jsx — the signature hero animation.
//
// Instead of a passive "Apply 82" card that bobs, this tells ApplyGuard's story:
// a mock job listing appears, a scanner sweeps down it, suspicious phrases get
// marked, the score gauge advances, and a verdict is stamped. It loops on a long
// pause so it reads as a demonstration, not a banner ad.
//
// Motion discipline:
//   • Only transform/opacity animate.
//   • Desktop-only damped tilt follows the pointer; off on touch.
//   • Reduced-motion renders the final stamped state instantly, no loop, no tilt.
import { useEffect, useRef, useState } from "react";
import { m, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReducedMotion, useFinePointer } from "../motion/useMotionConfig.js";
import { duration, easing, spring } from "../motion/tokens.js";

// Phases of the scan story.
const PHASE = { READY: 0, LISTING: 1, SCAN: 2, FLAGS: 3, VERDICT: 4 };

// The mock listing the scanner examines. Tones drive the annotation color:
// stop = red flag, warn = missing/caution, neutral = plain line.
const LISTING = [
  { id: "title", text: "Virtual Assistant — full remote", tone: "neutral" },
  { id: "pay", text: "Earn ₱15,000 weekly, no experience", tone: "stop", note: "Unrealistic pay" },
  { id: "contact", text: "Message us on Telegram to start", tone: "stop", note: "Off-platform" },
  { id: "fee", text: "₱500 activation fee required", tone: "stop", note: "Upfront fee" },
  { id: "addr", text: "Company address: not provided", tone: "warn", note: "Missing" },
];

const FINAL_SCORE = 22; // low = risky; this listing is a trap
const RADIUS = 26;
const CIRC = 2 * Math.PI * RADIUS;

const toneStyles = {
  stop: { line: "text-stop-ink", mark: "bg-stop", chip: "bg-stop-soft text-stop-ink" },
  warn: { line: "text-warn-ink", mark: "bg-warn", chip: "bg-warn-soft text-warn-ink" },
  neutral: { line: "text-ink-soft", mark: "", chip: "" },
};

// Mobile-friendly static version (no tilt/pointer animation)
function HeroMobile() {
  const dashoffset = CIRC * (1 - FINAL_SCORE / 100);
  return (
    <div className="lg:hidden">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-ink-faint uppercase">Example result</span>
        <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-ink-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Done
        </span>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-line bg-paper/60 p-3">
        <ul className="space-y-2 text-[0.78rem] leading-snug">
          {LISTING.map((row) => {
            const s = toneStyles[row.tone];
            const flagged = row.tone !== "neutral";
            return (
              <li key={row.id} className="flex items-start justify-between gap-2">
                <span>
                  <span className={flagged ? s.line : "text-ink-soft"}>{row.text}</span>
                </span>
                {flagged && (
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[0.55rem] font-semibold ${s.chip}`}>
                    {row.note}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="var(--color-line)" strokeWidth="5" />
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke="var(--color-stop)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashoffset}
              className="ring-fill"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-stop-ink">
            22
          </span>
        </div>
        <span className="stamp inline-block px-2.5 py-0.5 text-sm font-bold text-stop-ink">
          SKIP
        </span>
      </div>
    </div>
  );
}

export default function HeroScanNarrative() {
  const reduced = useReducedMotion();
  const finePointer = useFinePointer();
  const [phase, setPhase] = useState(reduced ? PHASE.VERDICT : PHASE.READY);
  const timers = useRef([]);

  // Pointer tilt (desktop, motion-on only). Springs give the damped return.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), spring.gentle);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), spring.gentle);
  const tiltEnabled = finePointer && !reduced;

  const handlePointerMove = (e) => {
    if (!tiltEnabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handlePointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  // The autonomous, looping timeline. Disabled entirely under reduced-motion.
  useEffect(() => {
    if (reduced) return undefined;
    const schedule = (fn, ms) => {
      timers.current.push(setTimeout(fn, ms));
    };
    const run = () => {
      setPhase(PHASE.READY);
      schedule(() => setPhase(PHASE.LISTING), 400);
      schedule(() => setPhase(PHASE.SCAN), 1200);
      schedule(() => setPhase(PHASE.FLAGS), 3000);
      schedule(() => setPhase(PHASE.VERDICT), 3900);
      schedule(run, 8200); // long pause, then loop
    };
    run();
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [reduced]);

  const scanning = phase === PHASE.SCAN;
  const showFlags = phase >= PHASE.FLAGS;
  const showVerdict = phase >= PHASE.VERDICT;
  const listingVisible = phase >= PHASE.LISTING;

  const dashoffset = showVerdict ? CIRC * (1 - FINAL_SCORE / 100) : CIRC;

  return (
    <>
      <HeroMobile />
      <div className="hidden lg:block" style={{ perspective: 1000 }}>
        <m.div
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={tiltEnabled ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
          className="relative w-72 rounded-2xl border border-line bg-card p-5 shadow-xl shadow-ink/10"
        >
          {/* header: what the tool is doing */}
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-xs font-semibold tracking-wider text-ink-faint uppercase">Live scan</span>
            <span className="flex items-center gap-1.5 text-[0.65rem] font-medium text-ink-faint">
              <span className={`h-1.5 w-1.5 rounded-full ${scanning ? "bg-brand pulse-dot" : "bg-line"}`} />
              {scanning ? "Inspecting…" : showVerdict ? "Done" : "Ready"}
            </span>
          </div>

          {/* the document being scanned */}
          <div className="relative overflow-hidden rounded-lg border border-line bg-paper/60 p-3">
            {/* scan line sweeps top → bottom during SCAN */}
            {!reduced && (
              <m.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 z-10 h-6 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgb(11 110 95 / 0.18) 45%, rgb(11 110 95 / 0.45) 50%, rgb(11 110 95 / 0.18) 55%, transparent)",
                  top: 0,
                }}
                initial={{ opacity: 0, top: "4%" }}
                animate={
                  scanning
                    ? { opacity: 1, top: ["4%", "88%"] }
                    : { opacity: 0, top: showVerdict ? "88%" : "4%" }
                }
                transition={{ duration: 1.7, ease: easing.standard }}
              />
            )}

            <ul className="space-y-2 text-[0.78rem] leading-snug">
              {LISTING.map((row, i) => {
                const s = toneStyles[row.tone];
                const flagged = row.tone !== "neutral";
                return (
                  <m.li
                    key={row.id}
                    initial={reduced ? false : { opacity: 0, x: -6 }}
                    animate={listingVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
                    transition={{ duration: duration.normal, ease: easing.enter, delay: reduced ? 0 : 0.05 * i }}
                    className="flex items-start justify-between gap-2"
                  >
                    <span className="relative">
                      <span className={flagged && showFlags ? s.line : "text-ink-soft"}>{row.text}</span>
                      {/* marker underline drawn under flagged phrases */}
                      {flagged && (
                        <m.span
                          aria-hidden="true"
                          className={`absolute -bottom-0.5 left-0 h-[3px] rounded-full ${s.mark}`}
                          initial={reduced ? false : { scaleX: 0 }}
                          animate={showFlags ? { scaleX: 1 } : { scaleX: 0 }}
                          style={{ originX: 0, width: "100%" }}
                          transition={{ duration: duration.normal, ease: easing.enter, delay: reduced ? 0 : 0.12 * i }}
                        />
                      )}
                    </span>
                    {/* side annotation chip */}
                    {flagged && (
                      <m.span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[0.55rem] font-semibold ${s.chip}`}
                        initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                        animate={showFlags ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
                        transition={{ duration: duration.fast, ease: easing.overshoot, delay: reduced ? 0 : 0.12 * i + 0.05 }}
                      >
                        {row.note}
                      </m.span>
                    )}
                  </m.li>
                );
              })}
            </ul>
          </div>

          {/* verdict: gauge + stamp */}
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="var(--color-line)" strokeWidth="5" />
                <circle
                  cx="32"
                  cy="32"
                  r={RADIUS}
                  fill="none"
                  stroke="var(--color-stop)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashoffset}
                  className="ring-fill"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-stop-ink">
                {showVerdict ? FINAL_SCORE : "—"}
              </span>
            </div>
            <div className="min-w-0">
              <m.span
                className="stamp inline-block px-2.5 py-0.5 text-sm font-bold text-stop-ink"
                initial={reduced ? false : { opacity: 0, scale: 0.6, rotate: -12 }}
                animate={showVerdict ? { opacity: 1, scale: 1, rotate: -3 } : { opacity: 0, scale: 0.6, rotate: -12 }}
                transition={{ duration: duration.deliberate, ease: easing.overshoot }}
              >
                SKIP
              </m.span>
              <p className="mt-1 text-[0.65rem] leading-tight text-ink-faint">
                3 red flags · 1 missing detail
              </p>
            </div>
          </div>

          <p className="mt-3 text-center text-[0.6rem] text-ink-faint">The scanner flags red flags like unrealistic pay and off-platform contact, then stamps a risk verdict.</p>
          <p className="mt-3 text-center text-[0.6rem] text-ink-faint">Live example — watches for traps</p>
        </m.div>
      </div>
    </>
  );
}