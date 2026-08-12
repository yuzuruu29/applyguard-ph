// howto/theme.ts — dark "liquid glass" tokens for the instructional film.
//
// These mirror the app's dark palette in src/index.css so the video reads as a
// recording of the product rather than a separate asset. The older
// design/tokens.ts is left alone: it still drives the original cream product
// story, and the two films are deliberately allowed to look different.

export const c = {
  // surfaces
  paper: "#0b0d10",
  card: "#14181d",
  panel: "#1b2027",
  line: "#2a313b",

  // ink
  ink: "#eef2f6",
  inkSoft: "#a7b2c0",
  inkFaint: "#7a8697",

  // brand
  brand: "#17c2a4",
  brandDeep: "#0e9c86",
  brandLift: "#4ce6c3",
  marker: "#f0c05a",

  // verdict trio
  go: "#3ddc97",
  goSoft: "#0f2a20",
  goInk: "#86f0c0",
  warn: "#eab54a",
  warnSoft: "#2a2113",
  warnInk: "#f7cf83",
  stop: "#ff6b5e",
  stopSoft: "#2d1614",
  stopInk: "#ff9d93",
} as const;

/** Glass recipe, expressed as plain style objects Remotion can inline. */
// Fills run slightly heavier than the app's, because the film deliberately
// skips backdrop-filter for render cost (see Panel in chrome.tsx) and the
// extra opacity stands in for the blur's frosting.
export const glass = {
  subtle: {
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.13)",
  },
  panel: {
    background: "rgba(255,255,255,0.062)",
    border: "1px solid rgba(255,255,255,0.11)",
    boxShadow:
      "inset 0 1px 0 0 rgba(255,255,255,0.14), 0 26px 60px -30px rgba(0,0,0,0.85)",
  },
  strong: {
    background: "rgba(255,255,255,0.088)",
    border: "1px solid rgba(255,255,255,0.13)",
    boxShadow:
      "inset 0 1px 0 0 rgba(255,255,255,0.16), 0 38px 80px -30px rgba(0,0,0,0.9)",
  },
} as const;

/** The CTA / accent gradient, same stops as .btn-gradient in the app. */
export const brandGradient = `linear-gradient(135deg, ${c.brandLift} 0%, ${c.brand} 48%, ${c.brandDeep} 100%)`;

/** Headline gradient, same stops as .text-gradient in the app. */
export const textGradient = `linear-gradient(104deg, ${c.ink} 0%, ${c.brandLift} 46%, ${c.marker} 96%)`;

// The fallbacks are load-bearing, not boilerplate: the peso sign (U+20B1)
// appears throughout the worked example, and per-glyph fallback needs a face
// that actually carries it if the webfont subset does not.
export const font = {
  display: '"Space Grotesk", "Segoe UI", system-ui, sans-serif',
  body: '"Hanken Grotesk", "Segoe UI", system-ui, sans-serif',
  mono: '"JetBrains Mono", "Cascadia Mono", Consolas, ui-monospace, monospace',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/** Cubic-bezier control points, matching src/motion/tokens.js. */
export const ease = {
  standard: [0.22, 1, 0.36, 1] as [number, number, number, number],
  enter: [0.16, 1, 0.3, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
  overshoot: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
};

/** Tone lookup used by chips, bars, and evidence rows. */
export function toneColors(tone: "go" | "warn" | "stop" | "brand" | "neutral") {
  switch (tone) {
    case "go":
      return { fg: c.goInk, dot: c.go, bg: c.goSoft, border: "rgba(61,220,151,0.35)" };
    case "warn":
      return { fg: c.warnInk, dot: c.warn, bg: c.warnSoft, border: "rgba(234,181,74,0.35)" };
    case "stop":
      return { fg: c.stopInk, dot: c.stop, bg: c.stopSoft, border: "rgba(255,107,94,0.35)" };
    case "brand":
      return {
        fg: c.brandLift,
        dot: c.brand,
        bg: "rgba(23,194,164,0.10)",
        border: "rgba(23,194,164,0.35)",
      };
    default:
      return { fg: c.inkSoft, dot: c.inkFaint, bg: "rgba(255,255,255,0.04)", border: c.line };
  }
}
