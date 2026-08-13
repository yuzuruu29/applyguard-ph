// tokens.ts — Design tokens matching ApplyGuard PH's paper-and-ink aesthetic.
// Colors, typography, spacing, and motion constants for the Remotion composition.

export const colors = {
  paper: "#f4efe4",
  card: "#fffdf7",
  panel: "#efe7d6",
  line: "#ddd3bf",
  ink: "#1b1a17",
  inkSoft: "#4a4842",
  inkFaint: "#6f6a60",
  brand: "#0b6e5f",
  brandDeep: "#084d42",
  marker: "#f2c14e",
  go: "#1f7a43",
  warn: "#b4690e",
  stop: "#c0392b",
  white: "#ffffff",
} as const;

export const fonts = {
  display: "Fraunces, Georgia, serif",
  body: "Hanken Grotesk, system-ui, sans-serif",
  mono: "JetBrains Mono, monospace",
} as const;

export const fontSizes = {
  // Desktop
  docTitle: 28,
  docLine: 18,
  docSmall: 14,
  gauge: 28,
  stamp: 22,
  reason: 15,
  chip: 12,
  panelHeader: 18,
  panelLine: 15,
  closing: 42,
  closingSub: 18,
  closingSmall: 15,
  eyebrow: 13,
  wordmark: 24,
  // Mobile overrides applied in composition
} as const;

export const spacing = {
  docPadding: 28,
  docLineGap: 10,
  panelPadding: 20,
  panelGap: 8,
  chipPadding: "4px 10px",
  stampPadding: "6px 16px",
} as const;

export const radii = {
  doc: 12,
  chip: 6,
  gauge: 26,
  panel: 10,
  stamp: 4,
} as const;

// Easing curves for interpolate(). Use as Easing.bezier() args.
export const easing = {
  standard: [0.22, 1, 0.36, 1] as [number, number, number, number],
  enter: [0.16, 1, 0.3, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
  overshoot: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
} as const;
