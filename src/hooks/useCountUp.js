import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Counts from 0 to `target` over `duration` ms using requestAnimationFrame.
 * Under prefers-reduced-motion the final value is shown immediately.
 * The starting value is rendered from the first frame so the number is
 * never hidden behind the animation.
 */
export function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(prefersReducedMotion() ? target : 0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setCount(target);
      return;
    }

    startRef.current = null;
    const animate = (timestamp) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}
