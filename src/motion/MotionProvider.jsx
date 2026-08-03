// motion/MotionProvider.jsx — wraps the app in Motion's LazyMotion so features
// load as one async chunk rather than being bundled into every entry. We use
// `domMax` (not `domAnimation`) because the app relies on layout animations —
// the traveling nav indicator (layoutId) and the tracker's reordering cards.
// Components MUST use `m.*` (from motion/react) rather than `motion.*`; `strict`
// enforces it so the full `motion` bundle never sneaks back in.
import { LazyMotion, domMax, MotionConfig } from "motion/react";

export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domMax} strict>
      {/* reducedMotion="user" makes Motion honour the OS setting globally:
          transform/layout animations collapse to their final state while
          opacity still fades. Components need not gate every animation. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
