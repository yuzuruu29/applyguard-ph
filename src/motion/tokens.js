// motion/tokens.js — shared motion vocabulary for ApplyGuard PH.
//
// One source of truth for durations and easings so components never invent
// arbitrary timings. Values follow the enhancement plan's timing system:
// short, calm, field-guide motion — nothing bouncy or advertisement-like.
//
// Durations are in SECONDS (Motion's unit). The `ambient` value is for
// continuous decorative loops (orb drift, gradient rotation).

export const duration = {
  instant: 0.12,
  fast: 0.18,
  normal: 0.28,
  deliberate: 0.46,
  reveal: 0.62,
  ambient: 16,
};

// Cubic-bezier control points. `overshoot` is the only springy curve and is
// reserved for feedback (hover lift, stamp landing) — never for text reveals.
export const easing = {
  standard: [0.22, 1, 0.36, 1],
  enter: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
  overshoot: [0.34, 1.56, 0.64, 1],
};

// Movement limits (px / scale) the plan calls out, exported so components
// stay within the same physical language instead of guessing offsets.
export const movement = {
  revealY: 12, // normal reveal translation
  sectionRevealY: 24, // large section reveal (max)
  hoverScale: 1.015, // 1.01–1.025 range
  pressScale: 0.98,
  cardTilt: 1.2, // degrees, max ~1.5
  parallax: 16, // background parallax, max 12–20
  magnetic: 4, // desktop CTA magnetic offset, 3–5px
};

// Spring preset for damped, physical returns (verdict card tilt, layout moves).
export const spring = {
  gentle: { type: "spring", stiffness: 180, damping: 22, mass: 0.9 },
  snappy: { type: "spring", stiffness: 320, damping: 30 },
};

// Ambient layer (the aurora backdrop and the trust marquee). The loop
// durations themselves live in index.css because those are pure CSS
// animations — duplicating them here would only let the two drift apart.
// These are the values JavaScript actually reads.
const PARALLAX_SHIFT = -110; // px the aurora layer travels across that range

export const ambientScroll = {
  parallaxRange: 1200, // px of page scroll mapped to the full aurora shift
  parallaxShift: PARALLAX_SHIFT,
  // How much taller than the viewport the aurora layer is drawn. The layer is
  // clipped to its own box, so if it can travel further than it overhangs, the
  // shift drags its bottom edge into view as a hard seam across the glow.
  // Must stay strictly greater than the shift — motion.test.js enforces it.
  parallaxSlack: Math.abs(PARALLAX_SHIFT) + 40,
};
