// useSpotlight — feeds the cursor position to the `.spotlight` CSS recipe.
//
// Spread the returned props onto any element carrying the `spotlight` class.
// Without JS the highlight still renders, just centred, so this is pure
// enhancement. Coarse pointers skip the listener entirely: there is no cursor
// to track and the hover state on touch would leave a stuck highlight.
import { useCallback } from "react";
import { useFinePointer } from "../motion/useMotionConfig.js";

export function useSpotlight() {
  const fine = useFinePointer();

  const onPointerMove = useCallback((event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }, []);

  return fine ? { onPointerMove } : {};
}
