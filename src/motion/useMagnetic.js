// useMagnetic — the primary CTA leans a few pixels toward the cursor.
//
// Spread the result onto a motion element. Movement is capped by
// `movement.magnetic` so the control never drifts far enough to feel slippery
// or to move out from under a click. Returns an empty object on touch devices
// and under reduced motion, so the element renders completely static.
import { useCallback } from "react";
import { useMotionValue, useSpring } from "motion/react";
import { movement, spring } from "./tokens.js";
import { useFinePointer, useReducedMotion } from "./useMotionConfig.js";

export function useMagnetic(strength = movement.magnetic) {
  const finePointer = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = finePointer && !reduced;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, spring.snappy);
  const springY = useSpring(y, spring.snappy);

  const onPointerMove = useCallback(
    (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      x.set(((event.clientX - rect.left) / rect.width - 0.5) * strength * 2);
      y.set(((event.clientY - rect.top) / rect.height - 0.5) * strength * 2);
    },
    [strength, x, y]
  );

  const onPointerLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  if (!enabled) return {};
  return { style: { x: springX, y: springY }, onPointerMove, onPointerLeave };
}
