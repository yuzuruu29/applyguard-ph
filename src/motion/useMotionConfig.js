// motion/useMotionConfig.js — small environment hooks the motion system leans on.
//
// `useReducedMotion` is re-exported from Motion (reactive to OS changes).
// `useFinePointer` tells desktop-only effects (tilt, magnetic CTA) to stay off
// on touch devices, per the plan's performance rules.
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export { useReducedMotion };

export function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return fine;
}

// True only when we should run rich/ambient motion: fine pointer OR at least
// not reduced-motion. Kept separate so callers can compose as they need.
export function useAllowMotion() {
  const reduced = useReducedMotion();
  return !reduced;
}
