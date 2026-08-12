// howto/chrome.tsx — the reusable furniture of the instructional film.
//
// Everything here is presentational and frame-driven: the stage backdrop, the
// glass panel, the persistent header/caption/progress rail, and the small
// primitives (chips, bars, rings, cursor) the chapters compose. Keeping them in
// one module means a chapter file reads as a storyboard rather than as layout.

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { c, ease, font, glass, radius, textGradient, toneColors } from "./theme";
import { CHAPTERS, STEP_COUNT, type Chapter } from "./script";

// ── timing helpers ──────────────────────────────────────────────────────────

/** 0→1 ramp with the shared "enter" curve. */
export function ramp(frame: number, start: number, length = 12) {
  return interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.enter),
  });
}

/** Fade in, hold, fade out across a chapter's local frame range. */
export function holdFade(frame: number, duration: number, inLen = 10, outLen = 10) {
  return interpolate(
    frame,
    [0, inLen, duration - outLen, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

/** Rise-and-fade entrance, returns both opacity and translateY. */
export function riseIn(frame: number, start: number, distance = 14, length = 14) {
  const p = ramp(frame, start, length);
  return { opacity: p, transform: `translateY(${(1 - p) * distance}px)` };
}

// ── backdrop ────────────────────────────────────────────────────────────────

/**
 * Aurora backdrop — the same composition as the app's <Aurora /> layer.
 *
 * Deliberately static and filter-free. The obvious implementation (drifting
 * blobs behind `filter: blur(110px)`) costs about a second per frame to
 * rasterise, because moving the element invalidates the blur cache every
 * single frame; across a 2,040-frame film that alone is most of an hour.
 * A multi-stop radial gradient is already soft, so it buys the same look for
 * effectively nothing, and at this scale a slow drift is imperceptible anyway.
 */
export function Stage({ children }: { children: React.ReactNode }) {
  const blob = (
    left: string,
    top: string,
    size: number,
    rgb: string,
    peak: number
  ) => ({
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
      <AbsoluteFill style={{ opacity: 0.62 }}>
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
    </AbsoluteFill>
  );
}

// ── glass surfaces ──────────────────────────────────────────────────────────

type PanelProps = {
  children: React.ReactNode;
  weight?: keyof typeof glass;
  style?: React.CSSProperties;
};

// No backdrop-filter here on purpose. What sits behind these panels is a
// smooth gradient, so blurring it is visually indistinguishable from a flat
// translucent fill — and it would cost a full-panel re-blur every frame.
export function Panel({ children, weight = "panel", style }: PanelProps) {
  return (
    <div
      style={{
        borderRadius: radius.lg,
        ...glass[weight],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A browser-ish window frame, so mock UI reads as "the product". */
export function Window({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Panel weight="strong" style={{ overflow: "hidden", ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 18px",
          borderBottom: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        <span style={{ display: "flex", gap: 6 }}>
          {[c.stop, c.warn, c.go].map((dot) => (
            <span
              key={dot}
              style={{ width: 9, height: 9, borderRadius: 999, background: dot, opacity: 0.65 }}
            />
          ))}
        </span>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 13,
            color: c.inkFaint,
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </Panel>
  );
}

// ── small primitives ────────────────────────────────────────────────────────

export function Chip({
  label,
  tone,
  style,
}: {
  label: string;
  tone: "go" | "warn" | "stop" | "brand" | "neutral";
  style?: React.CSSProperties;
}) {
  const t = toneColors(tone);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 11px",
        borderRadius: radius.pill,
        background: t.bg,
        border: `1px solid ${t.border}`,
        color: t.fg,
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dot }} />
      {label}
    </span>
  );
}

/** Horizontal meter that fills as `progress` goes 0→1. */
export function Bar({
  label,
  value,
  max,
  progress,
}: {
  label: string;
  value: number;
  max: number;
  progress: number;
}) {
  const pct = (value / max) * 100 * progress;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 16, color: c.inkSoft }}>{label}</span>
        <span style={{ fontFamily: font.mono, fontSize: 14, color: c.inkFaint }}>
          {Math.round(value * progress)}/{max}
        </span>
      </div>
      <div
        style={{
          height: 9,
          borderRadius: 999,
          background: "rgba(255,255,255,0.07)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${c.brandDeep}, ${c.brandLift})`,
          }}
        />
      </div>
    </div>
  );
}

/** Circular score gauge with a blurred twin underneath for the glow. */
export function Ring({
  score,
  progress,
  tone,
  size = 190,
  caption = "/ 100 FIT",
}: {
  score: number;
  progress: number;
  tone: "go" | "warn" | "stop" | "brand";
  size?: number;
  caption?: string;
}) {
  const stroke = 12;
  const r = size / 2 - stroke;
  const circ = 2 * Math.PI * r;
  const shown = Math.round(score * progress);
  const offset = circ * (1 - (score / 100) * progress);
  const color = toneColors(tone).dot;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          opacity={0.45}
          style={{ filter: "blur(9px)" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: font.mono,
            fontSize: size * 0.27,
            fontWeight: 700,
            color: c.ink,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {shown}
        </span>
        <span style={{ fontFamily: font.mono, fontSize: size * 0.075, color: c.inkFaint }}>
          {caption}
        </span>
      </div>
    </div>
  );
}

/** The verdict stamp — the one serif artifact carried over from the brand. */
export function Stamp({ text, tone, scale = 1 }: { text: string; tone: "go" | "warn" | "stop"; scale?: number }) {
  const t = toneColors(tone);
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: "Fraunces, Georgia, serif",
        fontWeight: 700,
        fontSize: 46 * scale,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: t.fg,
        border: `4px double ${t.fg}`,
        borderRadius: 12,
        padding: `${10 * scale}px ${26 * scale}px`,
        transform: "rotate(-3deg)",
        textShadow: `0 0 26px ${t.dot}55`,
      }}
    >
      {text}
    </span>
  );
}

/** Evidence row used for flags, guidance, and privacy points. */
export function Row({
  tone,
  title,
  body,
  style,
}: {
  tone: "go" | "warn" | "stop" | "brand" | "neutral";
  title: string;
  body?: string;
  style?: React.CSSProperties;
}) {
  const t = toneColors(tone);
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "13px 16px",
        borderRadius: radius.md,
        background: t.bg,
        border: `1px solid ${t.border}`,
        ...style,
      }}
    >
      <span
        style={{
          marginTop: 7,
          width: 8,
          height: 8,
          borderRadius: 999,
          background: t.dot,
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ color: t.fg, fontWeight: 600, fontSize: 17 }}>{title}</div>
        {body && (
          <div style={{ color: c.inkSoft, fontSize: 15, marginTop: 3, lineHeight: 1.45 }}>
            {body}
          </div>
        )}
      </div>
    </div>
  );
}

/** A soft mouse pointer used to show where a click lands. */
export function Cursor({ x, y, opacity = 1 }: { x: number; y: number; opacity?: number }) {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))",
      }}
    >
      <path d="M5 3l14 8-6.2 1.6L10 19 5 3z" fill={c.ink} stroke={c.paper} strokeWidth={1.2} />
    </svg>
  );
}

// ── persistent film furniture ───────────────────────────────────────────────

/** Wordmark, lock-up top-left on every frame. */
function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={30} height={30} viewBox="0 0 64 64">
        <defs>
          <linearGradient id="hiw-shield" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.brandLift} />
            <stop offset="100%" stopColor={c.brandDeep} />
          </linearGradient>
        </defs>
        <path
          d="M32 6 L54 14 V32 C54 46 44 55 32 59 C20 55 10 46 10 32 V14 Z"
          fill="url(#hiw-shield)"
        />
        <path
          d="M22 33 L29.5 40.5 L43 25"
          fill="none"
          stroke={c.paper}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontFamily: font.display,
          fontSize: 22,
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

/**
 * Header + caption + progress rail. Drawn above every chapter so the viewer
 * always knows which step they are on and how much is left.
 */
export function Furniture({ isMobile }: { isMobile: boolean }) {
  const frame = useCurrentFrame();
  const active: Chapter =
    CHAPTERS.find((ch) => frame >= ch.from && frame < ch.to) ?? CHAPTERS[CHAPTERS.length - 1];
  const local = frame - active.from;
  const pad = isMobile ? 40 : 56;

  // Title swaps per chapter with a short cross-fade.
  const titleIn = interpolate(local, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.enter),
  });
  const titleOut = interpolate(local, [active.durationInFrames - 8, active.durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = titleIn * titleOut;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* top bar */}
      <div
        style={{
          position: "absolute",
          top: pad * 0.62,
          left: pad,
          right: pad,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Wordmark />
        {active.step !== null && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 15px",
              borderRadius: radius.pill,
              ...glass.subtle,
              opacity: titleOpacity,
            }}
          >
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 13,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: c.brandLift,
              }}
            >
              Step {active.step} of {STEP_COUNT}
            </span>
          </div>
        )}
      </div>

      {/* chapter title + caption, bottom-anchored */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          bottom: pad * 0.95,
          opacity: titleOpacity,
          transform: `translateY(${(1 - titleIn) * 10}px)`,
        }}
      >
        <div
          style={{
            fontFamily: font.display,
            fontWeight: 600,
            fontSize: isMobile ? 40 : 40,
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
            backgroundImage: textGradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 8,
          }}
        >
          {active.title}
        </div>
        <div
          style={{
            fontSize: isMobile ? 22 : 20,
            lineHeight: 1.45,
            color: c.inkSoft,
            maxWidth: isMobile ? "100%" : 900,
          }}
        >
          {active.caption}
        </div>
      </div>

      {/* progress rail */}
      <div
        style={{
          position: "absolute",
          left: pad,
          right: pad,
          bottom: pad * 0.4,
          display: "flex",
          gap: 5,
        }}
      >
        {CHAPTERS.map((ch) => {
          const done = frame >= ch.to;
          const current = frame >= ch.from && frame < ch.to;
          const fill = done ? 1 : current ? (frame - ch.from) / ch.durationInFrames : 0;
          return (
            <div
              key={ch.id}
              style={{
                flex: ch.durationInFrames,
                height: 3,
                borderRadius: 999,
                background: "rgba(255,255,255,0.10)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fill * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${c.brand}, ${c.brandLift})`,
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
