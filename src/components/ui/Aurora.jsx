// ui/Aurora.jsx — the ambient light behind the glass.
//
// Three heavily blurred colour fields, fixed to the viewport and drifting on
// long, offset cycles so the background never reads as a flat fill and never
// repeats visibly. Painted once behind everything (z-index below the app), it
// is inert: no pointer events, no layout cost, `contain: strict`.
//
// Cost control:
//   • Only transform animates (the blur is rasterised once).
//   • Scroll parallax runs on the whole layer, not per blob, and only on
//     fine-pointer devices.
//   • Reduced motion keeps the composition but freezes it.
import { m, useScroll, useTransform } from "motion/react";
import { ambientScroll } from "../../motion/tokens.js";
import { useFinePointer, useReducedMotion } from "../../motion/useMotionConfig.js";

// How loud the backdrop is per surface. Marketing pages get the full show;
// working pages stay quiet so evidence and scores keep the attention.
const INTENSITY = {
  full: 1,
  calm: 0.66,
  quiet: 0.42,
};

// Vertical offsets are in vh, not %, on purpose: percentages resolve against
// the aurora layer, which is intentionally taller than the viewport (see
// --aurora-slack), so a % would silently reposition every blob whenever that
// slack changed. vh keeps each field anchored to what the viewer actually sees.
const BLOBS = [
  {
    key: "teal",
    drift: "aurora-drift-a",
    style: {
      top: "-18vh",
      left: "-12%",
      width: "62vw",
      height: "62vw",
      maxWidth: "820px",
      maxHeight: "820px",
      background:
        "radial-gradient(circle, color-mix(in oklab, var(--color-brand) 70%, transparent), transparent 68%)",
    },
  },
  {
    key: "emerald",
    drift: "aurora-drift-b",
    style: {
      top: "-8vh",
      right: "-16%",
      width: "54vw",
      height: "54vw",
      maxWidth: "720px",
      maxHeight: "720px",
      background:
        "radial-gradient(circle, color-mix(in oklab, var(--color-brand-lift) 52%, transparent), transparent 70%)",
    },
  },
  // Deliberately not gold. A warm field at ambient opacity composites to olive
  // against near-black rather than reading as light, and pinned to a fixed
  // layer it sits in one viewport spot while content scrolls past it — which
  // reads as a stain, not atmosphere. Gold stays where it is saturated enough
  // to be legible as an accent: headline gradients, the animated border, and
  // the how-it-works connector.
  {
    key: "deep",
    drift: "aurora-drift-c",
    style: {
      top: "53vh",
      right: "-12%",
      width: "54vw",
      height: "54vw",
      maxWidth: "700px",
      maxHeight: "700px",
      background:
        "radial-gradient(circle, color-mix(in oklab, var(--color-brand-deep) 58%, transparent), transparent 70%)",
    },
  },
];

export default function Aurora({ intensity = "calm" }) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const { scrollY } = useScroll();
  const parallax = useTransform(
    scrollY,
    [0, ambientScroll.parallaxRange],
    [0, ambientScroll.parallaxShift]
  );
  const drifting = !reduced;

  return (
    <m.div
      className="aurora-root"
      aria-hidden="true"
      style={{
        "--aurora-scale": INTENSITY[intensity] ?? INTENSITY.calm,
        // Extra height beyond the viewport, so the parallax shift can never
        // drag the clipped edge of this layer into view.
        "--aurora-slack": `${ambientScroll.parallaxSlack}px`,
        y: fine && !reduced ? parallax : 0,
      }}
    >
      {BLOBS.map((blob) => (
        <span
          key={blob.key}
          className={`aurora-blob ${drifting ? blob.drift : ""}`}
          style={blob.style}
        />
      ))}
      <span className="aurora-veil" />
    </m.div>
  );
}
