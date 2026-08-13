// palette.test.js — contrast guard for the design tokens.
//
// The palette lives in CSS, not JS, so this test reads src/index.css and
// re-derives the two theme ramps from it. That is unusual for a unit test, but
// the alternative is a colour system nothing can verify: the dark-first
// redesign shipped two AA failures that only surfaced when the ratios were
// computed by hand, and both were in pairs no component test would ever touch.
//
// Thresholds follow WCAG 2.1 AA: 4.5:1 for body text, 3:1 for graphical
// elements such as gauge strokes.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.resolve(process.cwd(), "src/index.css"), "utf8");

function block(startMarker) {
  const start = css.indexOf(startMarker);
  if (start === -1) throw new Error(`missing CSS block: ${startMarker}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(`unterminated CSS block: ${startMarker}`);
}

function colorTokens(source) {
  const out = {};
  for (const m of source.matchAll(/(--color-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}

const dark = colorTokens(block("@theme {"));
const light = { ...dark, ...colorTokens(block('\n[data-theme="light"] {')) };

// Glass fill alpha per theme, read straight from the tokens so the composite
// below can never drift from what actually renders.
function glassAlpha(source) {
  const m = source.match(/--glass-fill:\s*rgb\(255 255 255 \/ ([\d.]+)\)/);
  if (!m) throw new Error("could not read --glass-fill");
  return Number(m[1]);
}
const alpha = {
  dark: glassAlpha(block(":root {")),
  light: glassAlpha(block('\n[data-theme="light"] {')),
};

const channels = (hex) =>
  [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);

function luminance(hex) {
  const [r, g, b] = channels(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// White glass fill composited over the page colour — what text actually sits on.
function glassSurface(theme, tokens) {
  const base = channels(tokens["--color-paper"]);
  const mixed = base.map((c) => 1 * alpha[theme] + c * (1 - alpha[theme]));
  return "#" + mixed.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
}

// [label, foreground token, background token]
const TEXT_PAIRS = [
  ["body text on page", "--color-ink", "--color-paper"],
  ["secondary text on page", "--color-ink-soft", "--color-paper"],
  ["faint text on page", "--color-ink-faint", "--color-paper"],
  ["accent link on page", "--color-brand-lift", "--color-paper"],
  ["cream label on brand fill", "--color-paper", "--color-brand"],
  ["apply chip", "--color-go-ink", "--color-go-soft"],
  ["caution chip", "--color-warn-ink", "--color-warn-soft"],
  ["skip chip", "--color-stop-ink", "--color-stop-soft"],
];

// Text colours that also appear on top of a glass card rather than bare page.
const ON_GLASS = [
  ["body text on glass", "--color-ink"],
  ["secondary text on glass", "--color-ink-soft"],
  ["faint text on glass", "--color-ink-faint"],
  ["accent link on glass", "--color-brand-lift"],
];

// Gauge strokes and dots: graphical, so the AA bar is 3:1.
const GRAPHICS = [
  ["apply ring", "--color-go"],
  ["caution ring", "--color-warn"],
  ["skip ring", "--color-stop"],
  ["brand ring", "--color-brand"],
];

describe.each([
  ["dark", dark],
  ["light", light],
])("%s theme contrast", (theme, tokens) => {
  it("resolves a distinct palette", () => {
    expect(tokens["--color-paper"]).toBeTruthy();
    expect(tokens["--color-ink"]).toBeTruthy();
    if (theme === "light") expect(tokens["--color-paper"]).not.toBe(dark["--color-paper"]);
  });

  it.each(TEXT_PAIRS)("%s clears AA on the page", (label, fg, bg) => {
    expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(ON_GLASS)("%s clears AA on a glass card", (label, fg) => {
    expect(contrast(tokens[fg], glassSurface(theme, tokens))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(GRAPHICS)("%s clears the 3:1 bar for graphics", (label, token) => {
    expect(contrast(tokens[token], tokens["--color-paper"])).toBeGreaterThanOrEqual(3);
  });
});
