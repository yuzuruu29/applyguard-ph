// motion/variants.js — reusable Motion variants built from the shared tokens.
//
// Import these instead of writing inline animate objects, so every reveal,
// stagger, and card entrance across the app shares one physical language.
// All variants animate only `transform` and `opacity` (GPU-friendly).

import { duration, easing, movement } from "./tokens.js";

// Section / block reveal used with whileInView. Fades up a short distance.
export const revealUp = {
  hidden: { opacity: 0, y: movement.revealY },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.reveal, ease: easing.enter },
  },
};

// Larger section reveal (hero sub-blocks, wide bands) — a touch more travel.
export const revealSection = {
  hidden: { opacity: 0, y: movement.sectionRevealY },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.reveal, ease: easing.enter },
  },
};

// Parent that staggers its children. Pair with `revealUp` / `staggerItem`.
export const staggerParent = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: movement.revealY },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.deliberate, ease: easing.enter },
  },
};

// Route transition — short, context-neutral. Matches the plan's spec:
// opacity 0→1, y 8→0, scale 0.99→1.
export const routeTransition = {
  initial: { opacity: 0, y: 8, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.normal, ease: easing.enter },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.995,
    transition: { duration: duration.fast, ease: easing.exit },
  },
};

// Feedback hover/press for interactive cards (the springy exception).
export const feedbackHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: movement.hoverScale,
    y: -4,
    transition: { duration: duration.normal, ease: easing.overshoot },
  },
  press: { scale: movement.pressScale, y: -1 },
};

// Presence for stamped/annotated evidence (used on result page later).
export const stampIn = {
  hidden: { opacity: 0, scale: 0.6, rotate: -12 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: -3,
    transition: { duration: duration.deliberate, ease: easing.overshoot },
  },
};

// Result-page risk cards enter with *different but related* behavior so the
// evidence reads like a field guide, not a uniform list (Phase 5). Durations
// stay close so the page still feels coherent.

// Parent for a group of risk rows — a tighter stagger than the generic one.
export const flagParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

// Severe risk: a firm downward placement, like a stamp landing on the page.
export const flagHard = {
  hidden: { opacity: 0, y: -10, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.deliberate, ease: easing.overshoot },
  },
};

// Caution: a side-note that slides in from the margin.
export const flagSoft = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.deliberate, ease: easing.enter },
  },
};

// Missing detail: a short slide from the left, like a blank being ruled in.
export const missingItem = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: duration.normal, ease: easing.enter },
  },
};
