// useScrollReveal.js — IntersectionObserver hook that adds `.revealed`
// to elements with `.scroll-reveal` or `.scroll-reveal-stagger` once they
// enter the viewport. Runs once per element (no re-hide on scroll-up).
import { useEffect, useRef } from "react";

export function useScrollReveal(deps = []) {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current || document;
    const els = root.querySelectorAll(".scroll-reveal, .scroll-reveal-stagger");
    if (!els.length) return undefined;

    // Respect reduced-motion: reveal everything immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("revealed"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return containerRef;
}
