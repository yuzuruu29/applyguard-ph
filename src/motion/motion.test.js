// motion/motion.test.js — automated coverage for the motion system's invariants
// (enhancement plan Phase 14/15/16). These are pure assertions over the shared
// tokens and variants; they don't render components, so they run in the same
// lightweight vitest environment as the rest of the suite. Their job is to stop
// the motion vocabulary from drifting out of the plan's stated limits and to
// guard the "animate transform/opacity only" performance rule.

import { describe, it, expect } from "vitest";
import { duration, easing, movement } from "./tokens.js";
import {
  revealUp,
  revealSection,
  staggerParent,
  staggerItem,
  routeTransition,
  feedbackHover,
  stampIn,
  flagParent,
  flagHard,
  flagSoft,
  missingItem,
} from "./variants.js";

// Properties Motion can animate cheaply on the compositor. Everything else
// (width/height/filter/boxShadow/backgroundColor/top/left…) forces layout or
// paint and is disallowed by the plan's performance rules.
const GPU_SAFE = new Set([
  "opacity",
  "x",
  "y",
  "z",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "skew",
  "skewX",
  "skewY",
]);

// Collect the animatable property keys from a variant object, ignoring the
// non-animated `transition` config and any variant orchestration-only states.
function animatableKeys(variant) {
  const keys = new Set();
  for (const state of Object.values(variant)) {
    if (!state || typeof state !== "object") continue;
    for (const key of Object.keys(state)) {
      if (key === "transition") continue;
      keys.add(key);
    }
  }
  return [...keys];
}

const ALL_VARIANTS = {
  revealUp,
  revealSection,
  staggerParent,
  staggerItem,
  feedbackHover,
  stampIn,
  flagParent,
  flagHard,
  flagSoft,
  missingItem,
};

describe("motion tokens", () => {
  it("matches the plan's timing system", () => {
    expect(duration).toMatchObject({
      instant: 0.12,
      fast: 0.18,
      normal: 0.28,
      deliberate: 0.46,
      reveal: 0.62,
      ambient: 16,
    });
  });

  it("defines the four named easing curves as 4-point cubic-beziers", () => {
    for (const curve of [easing.standard, easing.enter, easing.exit, easing.overshoot]) {
      expect(Array.isArray(curve)).toBe(true);
      expect(curve).toHaveLength(4);
      for (const n of curve) expect(typeof n).toBe("number");
    }
  });

  it("keeps movement offsets within the plan's stated limits", () => {
    expect(movement.revealY).toBeLessThanOrEqual(16);
    expect(movement.sectionRevealY).toBeLessThanOrEqual(24);
    expect(movement.hoverScale).toBeGreaterThanOrEqual(1.01);
    expect(movement.hoverScale).toBeLessThanOrEqual(1.025);
    expect(movement.pressScale).toBeGreaterThanOrEqual(0.97);
    expect(movement.pressScale).toBeLessThanOrEqual(0.99);
    expect(movement.cardTilt).toBeLessThanOrEqual(1.5);
    expect(movement.parallax).toBeLessThanOrEqual(20);
    expect(movement.magnetic).toBeGreaterThanOrEqual(3);
    expect(movement.magnetic).toBeLessThanOrEqual(5);
  });
});

describe("motion variants — performance rule (transform/opacity only)", () => {
  for (const [name, variant] of Object.entries(ALL_VARIANTS)) {
    it(`${name} animates only GPU-safe properties`, () => {
      for (const key of animatableKeys(variant)) {
        expect(GPU_SAFE.has(key), `${name} animates non-GPU property "${key}"`).toBe(true);
      }
    });
  }
});

describe("route transition (Phase 12 spec)", () => {
  it("enters opacity 0→1, y 8→0, scale 0.99→1", () => {
    expect(routeTransition.initial).toMatchObject({ opacity: 0, y: 8, scale: 0.99 });
    expect(routeTransition.animate).toMatchObject({ opacity: 1, y: 0, scale: 1 });
  });

  it("only moves GPU-safe properties on enter and exit", () => {
    for (const key of animatableKeys(routeTransition)) {
      expect(GPU_SAFE.has(key), `routeTransition animates non-GPU property "${key}"`).toBe(true);
    }
  });

  it("stays within the 220–320ms route-transition window", () => {
    expect(routeTransition.animate.transition.duration).toBeGreaterThanOrEqual(0.22);
    expect(routeTransition.animate.transition.duration).toBeLessThanOrEqual(0.32);
  });
});

describe("result risk-card entrances differ but stay coherent (Phase 5)", () => {
  it("uses distinct entrance directions per severity", () => {
    // Severe stamps down, caution slides from the right margin, missing rules
    // in from the left — three different reads, one shared duration family.
    expect(flagHard.hidden.y).toBeLessThan(0);
    expect(flagSoft.hidden.x).toBeGreaterThan(0);
    expect(missingItem.hidden.x).toBeLessThan(0);
  });
});
