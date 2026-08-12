// TrialLedger.jsx — Phase 9: trial allowances as physical punch marks.
//
// Instead of generic progress bars, each trial credit is a small ink mark on a
// field-guide ledger. Available credits are filled ink; spent ones are punched
// (a hollow ring with a cross). Counts come straight from TRIAL_ALLOWANCES and
// any server-provided `used` map — this component never counts on its own, so
// it can't drift from the server-authoritative trial state.
//
// Marks stagger in once on view; under reduced-motion they render filled/spent
// immediately with no animation.
import { m } from "motion/react";
import { TRIAL_ALLOWANCES } from "../lib/entitlement.js";
import { duration, easing } from "../motion/tokens.js";
import { useReducedMotion } from "../motion/useMotionConfig.js";

// Order + labels for the ledger rows. Keys map to TRIAL_ALLOWANCES.
const ROWS = [
  { key: "deepscan", label: "Deep scans" },
  { key: "resume", label: "Resume tailoring" },
  { key: "message", label: "Outreach messages" },
  { key: "interview", label: "Mock interview" },
  { key: "backgroundcheck", label: "Background checks" },
];

const viewport = { once: true, amount: 0.5 };

function Mark({ spent, index, reduced }) {
  const anim = reduced
    ? {}
    : {
        initial: { scale: 0, opacity: 0 },
        whileInView: { scale: 1, opacity: 1 },
        viewport,
        transition: { duration: duration.normal, ease: easing.overshoot, delay: 0.04 * index },
      };
  return (
    <m.span
      className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
        spent ? "border-ink-faint/50 text-ink-faint" : "border-brand bg-brand"
      }`}
      {...anim}
      aria-hidden="true"
    >
      {spent && (
        <svg className="h-2 w-2" viewBox="0 0 8 8" stroke="currentColor" strokeWidth="1.4">
          <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" strokeLinecap="round" />
        </svg>
      )}
    </m.span>
  );
}

export default function TrialLedger({ used = {} }) {
  const reduced = useReducedMotion();

  return (
    <div className="glass-subtle rounded-2xl p-4">
      <p className="eyebrow mb-3">7-day trial allowance</p>
      <dl className="space-y-2.5">
        {ROWS.map((row) => {
          const total = TRIAL_ALLOWANCES[row.key] || 0;
          const spent = Math.max(0, Math.min(total, used[row.key] || 0));
          const remaining = total - spent;
          return (
            <div key={row.key} className="flex items-center justify-between gap-3">
              <dt className="text-sm text-ink-soft">{row.label}</dt>
              <dd className="flex items-center gap-1.5">
                {Array.from({ length: total }).map((_, i) => (
                  <Mark key={i} spent={i >= remaining} index={i} reduced={reduced} />
                ))}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-xs text-ink-faint">
        Each mark is one AI use during your trial. Counts stay server-side.
      </p>
    </div>
  );
}
