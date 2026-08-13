// ui/ThemeToggle.jsx — the colour-scheme switch.
//
// Two presentations of the same control: a compact icon button for the header
// and a labelled segmented control for Settings. Both drive the shared
// useTheme store, so flipping one updates the other instantly.
import { m } from "motion/react";
import { useTheme } from "../../hooks/useTheme.js";
import { useReducedMotion } from "../../motion/useMotionConfig.js";
import { MoonIcon, SunIcon } from "./icons.jsx";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const reduced = useReducedMotion();
  const Glyph = isDark ? SunIcon : MoonIcon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`glass-subtle group relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:text-ink ${className}`}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <m.span
        key={isDark ? "sun" : "moon"}
        initial={reduced ? false : { opacity: 0, rotate: -70, scale: 0.6 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex"
      >
        <Glyph className="h-[1.15rem] w-[1.15rem]" />
      </m.span>
    </button>
  );
}

const OPTIONS = [
  { value: "dark", label: "Dark", Glyph: MoonIcon },
  { value: "light", label: "Light", Glyph: SunIcon },
];

export function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  const reduced = useReducedMotion();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="inline-flex gap-1 rounded-full border border-line bg-paper/60 p-1"
    >
      {OPTIONS.map(({ value, label, Glyph }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className="relative inline-flex min-h-9 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          >
            {active && (
              <m.span
                layoutId="theme-choice-active"
                className="btn-gradient absolute inset-0 rounded-full"
                transition={
                  reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                }
              />
            )}
            <span
              className={`relative z-10 inline-flex items-center gap-2 ${
                active ? "text-paper" : "text-ink-soft"
              }`}
            >
              <Glyph className="h-4 w-4" />
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
