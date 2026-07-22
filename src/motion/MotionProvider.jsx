// motion/MotionProvider.jsx — wraps the app in Motion's LazyMotion so we load
// only the `domAnimation` feature bundle (transforms, opacity, layout, gestures)
// instead of the full feature set. Components MUST use `m.*` (from motion/react)
// rather than `motion.*` to keep this saving — `strict` enforces it in dev.
import { LazyMotion, domAnimation } from "motion/react";

export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
