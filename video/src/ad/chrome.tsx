// ad/chrome.tsx — furniture specific to the marketing ad.
//
// The ad borrows the instructional film's primitives (Panel, Chip, Ring,
// Stamp, Row, Window) straight from howto/chrome so the two films stay one
// family. What lives here is the ad-only kit: a stage whose aurora blooms the
// moment the product enters the story, scene shells that give every scene a
// gentle push-in, kinetic type, and the small persistent wordmark.

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { c, ease, font } from "../howto/theme";
import { scene } from "./script";

// ── timing helper (local copy so scenes can import everything from ad/) ─────

export function ramp(frame: number, start: number, length = 12) {
  return interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.enter),
  });
}

export function riseIn(frame: number, start: number, distance = 14, length = 14) {
  const p = ramp(frame, start, length);
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
}

// ── the stage ────────────────────────────────────────────────────────────────

/**
 * AdStage — the aurora backdrop with a story arc.
 *
 * Act one (the doomscroll and the bait) plays in near-darkness: blobs at low
 * opacity, heavier vignette. When the scan scene arrives — the moment
 * ApplyGuard enters the story — the aurora blooms up to the brightness the
 * rest of the film keeps. Same filter-free radial-gradient recipe as the
 * instructional film: soft for free, no per-frame blur cost.
 */
export function AdStage({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const bloomAt = scene("scan").from;

  const glow = interpolate(frame, [bloomAt - 18, bloomAt + 30], [0.24, 0.62], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.standard),
  });
  const vignette = interpolate(frame, [bloomAt - 18, bloomAt + 30], [0.62, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const blob = (left: string, top: string, size: number, rgb: string, peak: number) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    left,
    top,
    borderRadius: "50%",
    background: `radial-gradient(circle, rgba(${rgb},${peak}) 0%, rgba(${rgb},${peak * 0.55}) 30%, rgba(${rgb},${peak * 0.18}) 54%, rgba(${rgb},0) 72%)`,
  });

  return (
    <AbsoluteFill style={{ background: c.paper, fontFamily: font.body }}>
      <AbsoluteFill style={{ opacity: glow }}>
        <div style={blob("-14%", "-20%", 980, "23,194,164", 0.5)} />
        <div style={blob("56%", "-14%", 820, "76,230,195", 0.3)} />
        <div style={blob("12%", "58%", 760, "240,192,90", 0.2)} />
      </AbsoluteFill>
      {/* faint grain so large flat areas keep some texture */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.022) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      {children}
      {/* cinematic vignette, heavier while the story is still in the dark */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: `radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
}

// ── scene shell ──────────────────────────────────────────────────────────────

/**
 * Every scene fades in fast, breathes with a slow push-in, and gets out of the
 * way quickly. The constant micro-zoom is what makes static layouts read as
 * "filmed" rather than "slides".
 */
export function SceneShell({
  durationInFrames,
  children,
  push = 1.022,
}: {
  durationInFrames: number;
  children: React.ReactNode;
  push?: number;
}) {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 7, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const zoom = interpolate(frame, [0, durationInFrames], [1, push]);
  return (
    <AbsoluteFill style={{ opacity, transform: `scale(${zoom})` }}>{children}</AbsoluteFill>
  );
}

// ── kinetic type ─────────────────────────────────────────────────────────────

/** Headline whose words rise in one after another. */
export function Words({
  text,
  from = 0,
  step = 3,
  length = 12,
  gradient = false,
  style,
}: {
  text: string;
  from?: number;
  step?: number;
  length?: number;
  gradient?: boolean;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  const gradientStyle: React.CSSProperties = gradient
    ? {
        backgroundImage: `linear-gradient(100deg, ${c.brandLift}, ${c.marker})`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : {};
  return (
    <span style={style}>
      {words.map((word, i) => {
        const p = ramp(frame, from + i * step, length);
        return (
          <span
            key={`${word}-${i}`}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: p,
              transform: `translateY(${(1 - p) * 16}px)`,
              ...gradientStyle,
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
}

/** Monospace eyebrow that types on with a caret. */
export function TypeOn({
  text,
  from = 0,
  cps = 1.4,
  style,
}: {
  text: string;
  from?: number;
  /** Characters revealed per frame. */
  cps?: number;
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const shown = Math.max(0, Math.min(text.length, Math.floor((frame - from) * cps)));
  const done = shown >= text.length;
  const caretOn = done ? frame % 32 < 18 : true;
  return (
    <span
      style={{
        fontFamily: font.mono,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: c.brandLift,
        ...style,
      }}
    >
      {text.slice(0, shown)}
      <span style={{ opacity: caretOn ? 0.9 : 0 }}>▎</span>
    </span>
  );
}

// ── persistent furniture ─────────────────────────────────────────────────────

function ShieldMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <defs>
        <linearGradient id="ad-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c.brandLift} />
          <stop offset="100%" stopColor={c.brandDeep} />
        </linearGradient>
      </defs>
      <path d="M32 6 L54 14 V32 C54 46 44 55 32 59 C20 55 10 46 10 32 V14 Z" fill="url(#ad-shield)" />
      <path
        d="M22 33 L29.5 40.5 L43 25"
        fill="none"
        stroke={c.paper}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <ShieldMark size={size} />
      <span
        style={{
          fontFamily: font.display,
          fontSize: size * 0.73,
          fontWeight: 700,
          color: c.ink,
          letterSpacing: "-0.01em",
        }}
      >
        ApplyGuard
      </span>
    </div>
  );
}

export { ShieldMark };

/**
 * Corner wordmark that appears once ApplyGuard enters the story (the scan
 * scene) and stays for the rest of the film.
 */
export function AdFurniture({ vertical }: { vertical: boolean }) {
  const frame = useCurrentFrame();
  const showAt = scene("scan").from + 10;
  const p = ramp(frame, showAt, 16);
  const pad = vertical ? 44 : 52;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: pad * 0.72,
          left: pad,
          opacity: p * 0.94,
          transform: `translateY(${(1 - p) * -8}px)`,
        }}
      >
        <Wordmark size={vertical ? 34 : 30} />
      </div>
    </AbsoluteFill>
  );
}
