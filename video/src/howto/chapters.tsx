// howto/chapters.tsx — one component per instructional beat.
//
// Each chapter receives frames local to itself (Remotion <Sequence> rebases
// useCurrentFrame), so timings here read as "n frames into this step" and stay
// correct if an earlier chapter is re-timed.

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  Bar,
  Chip,
  Cursor,
  Panel,
  Ring,
  Row,
  Stamp,
  Window,
  ramp,
  riseIn,
} from "./chrome";
import { brandGradient, c, ease, font, glass, radius, toneColors } from "./theme";
import {
  BREAKDOWN,
  CHIPS,
  CLOSING,
  FLAGS,
  INTAKE,
  LINK_CHECK,
  MISSING,
  POST,
  PRIVACY_POINTS,
  PROMPT_LINES,
  SCORE,
  TRACKER_STAGES,
} from "./script";

type ChapterProps = { isMobile: boolean };

/** Shared centred stage box the chapter content sits in. */
function Center({
  children,
  isMobile,
  top = "44%",
}: {
  children: React.ReactNode;
  isMobile: boolean;
  top?: string;
}) {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top,
          transform: "translate(-50%, -50%)",
          width: isMobile ? "84%" : "72%",
          maxWidth: isMobile ? 880 : 1080,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}

// ── 0. intro ────────────────────────────────────────────────────────────────

export function Intro({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 22], [0.86, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.overshoot),
  });

  const badges = ["Paste a post", "Get a verdict", "Apply safely"];

  return (
    <Center isMobile={isMobile} top="42%">
      <div style={{ textAlign: "center", ...riseIn(frame, 0, 18) }}>
        <div style={{ transform: `scale(${pop})`, display: "inline-block" }}>
          <Chip label="Free · No sign-up · Runs in your browser" tone="brand" />
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: isMobile ? 62 : 78,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            color: c.ink,
          }}
        >
          Is this remote job
          <br />
          <span
            style={{
              backgroundImage: `linear-gradient(100deg, ${c.brandLift}, ${c.marker})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            worth applying to?
          </span>
        </div>
        <div
          style={{
            marginTop: 30,
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {badges.map((b, i) => (
            <div key={b} style={riseIn(frame, 22 + i * 7, 12)}>
              <Chip label={b} tone="neutral" />
            </div>
          ))}
        </div>
      </div>
    </Center>
  );
}

// ── 1. paste ────────────────────────────────────────────────────────────────

export function Paste({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();
  // Lines "type in" one after another, then the scan sweep runs down them.
  const sweep = interpolate(frame, [92, 155], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepOn = frame > 90 && frame < 160;

  return (
    <Center isMobile={isMobile} top="42%">
      <Window title="applyguard.ph — paste the job post">
        <div style={{ position: "relative" }}>
          <div
            style={{
              borderRadius: radius.md,
              padding: 18,
              minHeight: 260,
              position: "relative",
              overflow: "hidden",
              ...glass.subtle,
            }}
          >
            {sweepOn && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: `${sweep}%`,
                  height: 34,
                  background: `linear-gradient(180deg, transparent, ${c.brandLift}44 45%, ${c.brandLift}88 50%, ${c.brandLift}44 55%, transparent)`,
                }}
              />
            )}
            <div
              style={{
                fontFamily: font.display,
                fontWeight: 600,
                fontSize: 24,
                color: c.ink,
                ...riseIn(frame, 6, 10),
              }}
            >
              {POST.title}
            </div>
            <div
              style={{
                fontSize: 15,
                color: c.inkFaint,
                marginTop: 4,
                marginBottom: 14,
                ...riseIn(frame, 12, 8),
              }}
            >
              {POST.company}
            </div>

            {POST.lines.map((line, i) => {
              const appear = 20 + i * 9;
              const tone = line.tone === "neutral" ? c.inkSoft : toneColors(line.tone).fg;
              return (
                <div
                  key={line.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    fontSize: 17,
                    color: tone,
                    ...riseIn(frame, appear, 8),
                  }}
                >
                  <span>{line.text}</span>
                </div>
              );
            })}
          </div>

          {/* the ready indicator + keyboard hint under the box */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
              fontSize: 15,
              color: c.inkFaint,
              ...riseIn(frame, 78, 10),
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: c.go }} />
              <span style={{ color: c.goInk, fontWeight: 600 }}>Post added</span>
            </span>
            <span style={{ fontFamily: font.mono, fontSize: 14 }}>
              Ctrl + Enter to check
            </span>
          </div>
        </div>
      </Window>
    </Center>
  );
}

// ── 2. add your details ─────────────────────────────────────────────────────

export function Details({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();

  return (
    <Center isMobile={isMobile} top="42%">
      <Window title="applyguard.ph — fine-tune your check (optional)">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 16,
          }}
        >
          {INTAKE.map((field, i) => {
            const appear = 10 + i * 14;
            const focus = ramp(frame, appear + 6, 10);
            return (
              <div key={field.label} style={riseIn(frame, appear, 12)}>
                <div style={{ fontSize: 14, color: c.inkSoft, marginBottom: 7 }}>
                  {field.label}
                </div>
                <div
                  style={{
                    borderRadius: radius.md,
                    padding: "13px 15px",
                    fontSize: 18,
                    color: c.ink,
                    position: "relative",
                    overflow: "hidden",
                    ...glass.subtle,
                    borderColor: `rgba(23,194,164,${0.12 + focus * 0.5})`,
                  }}
                >
                  {field.value}
                  {/* focus accent grows from the centre, as in the app */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 12,
                      right: 12,
                      height: 2,
                      borderRadius: 2,
                      transform: `scaleX(${focus})`,
                      background: `linear-gradient(90deg, transparent, ${c.brandLift}, transparent)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: "13px 16px",
            borderRadius: radius.md,
            fontSize: 16,
            color: c.brandLift,
            ...glass.subtle,
            ...riseIn(frame, 74, 12),
          }}
        >
          Your pay floor turns the generic score into a personal fit score.
        </div>
      </Window>
    </Center>
  );
}

// ── 3. verdict ──────────────────────────────────────────────────────────────

export function Verdict({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();
  const ringProgress = interpolate(frame, [18, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.standard),
  });
  const stampScale = interpolate(frame, [8, 26], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.overshoot),
  });

  return (
    <Center isMobile={isMobile} top="43%">
      <Panel weight="strong" style={{ padding: isMobile ? 32 : 42 }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ opacity: ramp(frame, 6, 12), transform: `scale(${stampScale})` }}>
              <Stamp text={SCORE.verdict} tone="stop" scale={isMobile ? 0.9 : 1} />
            </div>
            <div style={riseIn(frame, 26, 12)}>
              <div style={{ fontSize: 21, color: c.inkSoft, maxWidth: 280, lineHeight: 1.35 }}>
                {SCORE.verdictSub}
              </div>
              <div style={{ marginTop: 12 }}>
                <Chip label={SCORE.risk} tone="stop" />
              </div>
            </div>
          </div>
          <Ring score={SCORE.final} progress={ringProgress} tone="stop" size={isMobile ? 170 : 190} />
        </div>
      </Panel>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 18,
          justifyContent: "center",
          flexWrap: "wrap",
          ...riseIn(frame, 52, 12),
        }}
      >
        <Chip label="Apply — go for it" tone="go" />
        <Chip label="Caution — check first" tone="warn" />
        <Chip label="Skip — not worth it" tone="stop" />
      </div>
    </Center>
  );
}

// ── 4. score breakdown ──────────────────────────────────────────────────────

export function Score({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();

  return (
    <Center isMobile={isMobile} top="42%">
      <Panel style={{ padding: isMobile ? 30 : 38 }}>
        {BREAKDOWN.map((row, i) => {
          const start = 8 + i * 11;
          const progress = interpolate(frame, [start, start + 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...ease.standard),
          });
          return <Bar key={row.label} {...row} progress={progress} />;
        })}

        <div
          style={{
            marginTop: 10,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.09)",
            fontSize: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: c.warnInk,
              marginBottom: 7,
              ...riseIn(frame, 70, 8),
            }}
          >
            <span>Soft flags</span>
            <span style={{ fontFamily: font.mono }}>−{SCORE.softPenalty}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: c.stopInk,
              fontWeight: 600,
              marginBottom: 10,
              ...riseIn(frame, 82, 8),
            }}
          >
            <span>Hard flag — fit capped</span>
            <span style={{ fontFamily: font.mono }}>max {SCORE.final}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: c.ink,
              fontWeight: 700,
              fontSize: 19,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.09)",
              ...riseIn(frame, 96, 8),
            }}
          >
            <span>Final fit score</span>
            <span style={{ fontFamily: font.mono }}>{SCORE.final}</span>
          </div>
        </div>
      </Panel>
    </Center>
  );
}

// ── 5. scam signals ─────────────────────────────────────────────────────────

export function Flags({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();

  return (
    <Center isMobile={isMobile} top="42%">
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 13,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: c.stopInk,
          marginBottom: 10,
          ...riseIn(frame, 4, 8),
        }}
      >
        Hard stops
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FLAGS.hard.map((f, i) => (
          <div key={f.label} style={riseIn(frame, 10 + i * 14, 14)}>
            <Row tone="stop" title={f.label} body={f.why} />
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: font.mono,
          fontSize: 13,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: c.warnInk,
          margin: "22px 0 10px",
          ...riseIn(frame, 46, 8),
        }}
      >
        Worth a closer look
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FLAGS.soft.map((f, i) => (
          <div key={f.label} style={riseIn(frame, 52 + i * 14, 14)}>
            <Row tone="warn" title={f.label} body={f.why} />
          </div>
        ))}
      </div>
    </Center>
  );
}

// ── 6. missing info ─────────────────────────────────────────────────────────

export function Missing({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();

  return (
    <Center isMobile={isMobile} top="42%">
      <Panel style={{ padding: isMobile ? 30 : 38 }}>
        <div
          style={{
            fontFamily: font.display,
            fontWeight: 600,
            fontSize: 26,
            color: c.ink,
            marginBottom: 6,
            ...riseIn(frame, 2, 10),
          }}
        >
          Before you commit
        </div>
        <div style={{ fontSize: 16, color: c.inkSoft, marginBottom: 20, ...riseIn(frame, 8, 10) }}>
          The post leaves these open. Get them answered first.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {MISSING.map((q, i) => (
            <div
              key={q}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                fontSize: 18,
                color: c.ink,
                ...riseIn(frame, 16 + i * 13, 12),
              }}
            >
              <span
                style={{
                  marginTop: 8,
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: c.warn,
                  flexShrink: 0,
                }}
              />
              {q}
            </div>
          ))}
        </div>
      </Panel>
    </Center>
  );
}

// ── 7. copy the prompt ──────────────────────────────────────────────────────

export function Prompt({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();
  // The button flips to "Copied" partway through, with the cursor landing on it.
  const copied = frame > 96;
  // Panel-relative coordinates: the cursor drifts in from the prompt text and
  // settles on the copy button just before it flips to "Copied".
  const cursorX = interpolate(frame, [58, 92], [520, 92], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.standard),
  });
  const cursorY = interpolate(frame, [58, 92], [120, 250], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.standard),
  });

  return (
    <Center isMobile={isMobile} top="42%">
      <Panel style={{ padding: isMobile ? 30 : 36, position: "relative" }}>
        <div
          style={{
            borderRadius: radius.md,
            padding: 18,
            fontFamily: font.mono,
            fontSize: 15,
            lineHeight: 1.75,
            color: c.inkSoft,
            ...glass.subtle,
          }}
        >
          {PROMPT_LINES.map((line, i) => (
            <div key={i} style={riseIn(frame, 8 + i * 9, 8)}>
              {line || "\u00a0"}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, ...riseIn(frame, 56, 10) }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "12px 22px",
              borderRadius: radius.pill,
              fontWeight: 600,
              fontSize: 17,
              color: copied ? c.goInk : c.paper,
              background: copied ? c.goSoft : undefined,
              backgroundImage: copied ? undefined : brandGradient,
              border: copied ? `1px solid ${toneColors("go").border}` : "1px solid transparent",
            }}
          >
            {copied ? "Copied" : "Copy prompt"}
          </span>
          <span style={{ marginLeft: 16, fontSize: 15, color: c.inkFaint }}>
            Paste it into ChatGPT, Claude, or Gemini.
          </span>
        </div>

        <Cursor x={cursorX} y={cursorY} opacity={frame > 50 && frame < 112 ? 1 : 0} />
      </Panel>
    </Center>
  );
}

// ── 8. background-check the link ────────────────────────────────────────────

export function LinkCheck({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();
  const gauge = interpolate(frame, [40, 92], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.standard),
  });

  const seg = (text: string, dim: boolean, key: string, delay: number) => (
    <span
      key={key}
      style={{
        fontFamily: font.mono,
        fontSize: 19,
        color: dim ? c.inkFaint : c.brandLift,
        fontWeight: dim ? 400 : 700,
        background: dim ? "transparent" : "rgba(23,194,164,0.12)",
        border: dim ? "none" : "1px solid rgba(23,194,164,0.3)",
        borderRadius: 6,
        padding: dim ? 0 : "1px 6px",
        ...riseIn(frame, delay, 8),
      }}
    >
      {text}
    </span>
  );

  return (
    <Center isMobile={isMobile} top="42%">
      <Window title="applyguard.ph/background-check">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          {seg(LINK_CHECK.protocol, true, "p", 4)}
          {seg(LINK_CHECK.sub, true, "s", 8)}
          {seg(LINK_CHECK.domain, false, "d", 14)}
          {seg(LINK_CHECK.path, true, "pa", 20)}
          {seg(LINK_CHECK.query, true, "q", 24)}
        </div>
        <div style={{ fontSize: 15, color: c.inkSoft, marginBottom: 20, ...riseIn(frame, 30, 10) }}>
          The highlighted domain is who you would actually be dealing with.
        </div>

        <div
          style={{
            display: "flex",
            gap: 26,
            alignItems: "center",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <Ring
            score={LINK_CHECK.score}
            progress={gauge}
            tone="stop"
            size={isMobile ? 140 : 150}
            caption="/ 100"
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ ...riseIn(frame, 44, 10) }}>
              <Chip label={LINK_CHECK.verdict} tone="stop" />
            </div>
            {LINK_CHECK.signals.map((s, i) => (
              <div key={s.text} style={riseIn(frame, 56 + i * 12, 10)}>
                <Row tone={s.tone} title={s.text} />
              </div>
            ))}
          </div>
        </div>
      </Window>
    </Center>
  );
}

// ── 9. tracker ──────────────────────────────────────────────────────────────

export function Tracker({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();
  // The pipeline line grows, and the active stage advances Saved → Interview.
  const railProgress = interpolate(frame, [16, 96], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.standard),
  });
  const activeIndex = frame < 46 ? 0 : frame < 78 ? 1 : 2;

  return (
    <Center isMobile={isMobile} top="42%">
      <Panel style={{ padding: isMobile ? 30 : 38 }}>
        <div style={{ position: "relative", marginBottom: 28 }}>
          <div
            style={{
              position: "absolute",
              left: 9,
              right: 9,
              top: 9,
              height: 3,
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 9,
              right: 9,
              top: 9,
              height: 3,
              borderRadius: 999,
              transformOrigin: "left",
              transform: `scaleX(${railProgress})`,
              background: `linear-gradient(90deg, ${c.brand}, ${c.brandLift})`,
            }}
          />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
            {TRACKER_STAGES.map((stage, i) => {
              const done = i <= activeIndex;
              const current = i === activeIndex;
              return (
                <div
                  key={stage}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
                >
                  <span
                    style={{
                      width: 21,
                      height: 21,
                      borderRadius: 999,
                      border: `2px solid ${done ? c.brand : "rgba(255,255,255,0.18)"}`,
                      background: done ? c.brand : c.panel,
                      boxShadow: done ? `0 0 14px -2px ${c.brand}` : "none",
                      transform: `scale(${current ? 1.15 : 1})`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: current ? 700 : 400,
                      color: current ? c.ink : c.inkFaint,
                    }}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            borderRadius: radius.md,
            padding: 18,
            ...glass.subtle,
            ...riseIn(frame, 30, 12),
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 20, color: c.ink }}>
              {POST.title}
            </span>
            <span style={{ display: "inline-flex", gap: 9, alignItems: "center" }}>
              <Chip label={SCORE.verdict} tone="stop" />
              <span style={{ fontFamily: font.mono, fontSize: 15, color: c.inkSoft }}>
                {SCORE.final}/100
              </span>
            </span>
          </div>
          <div style={{ marginTop: 12, fontSize: 15, color: c.inkFaint, ...riseIn(frame, 52, 10) }}>
            Follow up by 20 Aug · Notes: asked for SEC registration, no reply yet
          </div>
        </div>
      </Panel>
    </Center>
  );
}

// ── 10. privacy ─────────────────────────────────────────────────────────────

export function Privacy({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();

  return (
    <Center isMobile={isMobile} top="42%">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 14,
        }}
      >
        {PRIVACY_POINTS.map((point, i) => (
          <div key={point} style={riseIn(frame, 6 + i * 12, 14)}>
            <Panel style={{ padding: "20px 22px", height: "100%" }}>
              <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                  <path
                    d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z"
                    stroke={c.brandLift}
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="9 12 11 14 15 10"
                    stroke={c.brandLift}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <span style={{ fontSize: 17, color: c.ink, lineHeight: 1.45 }}>{point}</span>
              </div>
            </Panel>
          </div>
        ))}
      </div>
    </Center>
  );
}

// ── 11. closing ─────────────────────────────────────────────────────────────

export function Closing({ isMobile }: ChapterProps) {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [18, 40], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.overshoot),
  });
  const rise = riseIn(frame, 22, 14);

  return (
    <Center isMobile={isMobile} top="43%">
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: isMobile ? 52 : 62,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            color: c.ink,
            ...riseIn(frame, 0, 20),
          }}
        >
          {CLOSING.headline}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: isMobile ? 22 : 21,
            color: c.inkSoft,
            ...riseIn(frame, 14, 16),
          }}
        >
          {CLOSING.sub}
        </div>
        <div
          style={{
            marginTop: 32,
            opacity: rise.opacity,
            // compose both transforms by hand — spreading riseIn here would
            // silently drop the pop scale
            transform: `${rise.transform} scale(${pop})`,
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "16px 38px",
              borderRadius: radius.pill,
              backgroundImage: brandGradient,
              color: c.paper,
              fontWeight: 700,
              fontSize: 22,
              boxShadow: `0 18px 50px -16px ${c.brand}`,
            }}
          >
            {CLOSING.cta}
          </span>
        </div>
      </div>
    </Center>
  );
}
