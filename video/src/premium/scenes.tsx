// premium/scenes.tsx â€” one component per beat of the Premium showcase.
//
// The film mimics the real product surfaces: the AiAssistant tab bar and
// "drafting" rhythm, the deep-scan findings, the resume before/after, and the
// MockInterviewPage webcam stage with its status pill, mic button, and
// transcript bubbles. Scenes adapt between the 1600Ã—900 and 1080Ã—1350 cuts
// via the `mobile` prop.

import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Chip, Panel, Row, Stage, Window } from "../howto/chrome";
import { brandGradient, c, ease, font, glass, radius, toneColors } from "../howto/theme";
import { SceneShell, ShieldMark, TypeOn, Words, Wordmark, ramp, riseIn } from "../ad/chrome";
import {
  CTA,
  DEEPSCAN,
  FEATURE_TABS,
  INTERVIEW,
  INTRO,
  JOB,
  MESSAGE,
  PLANS,
  RESUME,
  SETUP,
  scene,
} from "./script";

export type SceneProps = { mobile: boolean };

/** Stage + constant soft vignette; the aurora needs no story arc here. */
export function PremiumStage({ children }: { children: React.ReactNode }) {
  return (
    <Stage>
      {children}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.42) 100%)",
        }}
      />
    </Stage>
  );
}

/** Corner lock-up: wordmark plus a Premium pill, on every frame. */
export function PremiumFurniture({ mobile }: SceneProps) {
  const pad = mobile ? 42 : 52;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: pad * 0.68,
          left: pad,
          display: "flex",
          alignItems: "center",
          gap: 13,
        }}
      >
        <Wordmark size={mobile ? 32 : 30} />
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#04211c",
            background: brandGradient,
            borderRadius: 999,
            padding: "4px 12px",
          }}
        >
          Premium
        </span>
      </div>
    </AbsoluteFill>
  );
}

function Center({
  children,
  mobile,
  top = "50%",
  width,
}: {
  children: React.ReactNode;
  mobile: boolean;
  top?: string;
  width?: number | string;
}) {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top,
          transform: "translate(-50%, -50%)",
          width: width ?? (mobile ? "86%" : "68%"),
          maxWidth: mobile ? 940 : 1180,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}

/** Section header shared by the feature scenes. */
function Header({
  eyebrow,
  headline,
  frame,
  mobile,
  gradientFrom = 18,
}: {
  eyebrow: string;
  headline: string;
  frame: number;
  mobile: boolean;
  gradientFrom?: number;
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: mobile ? 30 : 26 }}>
      <div style={{ fontSize: mobile ? 18 : 16, ...riseIn(frame, 2, 8) }}>
        <TypeOn text={eyebrow} from={2} cps={1.7} />
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: font.display,
          fontWeight: 700,
          fontSize: mobile ? 46 : 48,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: c.ink,
        }}
      >
        <Words text={headline} from={gradientFrom} step={2.6} />
      </div>
    </div>
  );
}

/** The app's calm three-bar "drafting" rhythm, frame-driven. */
function ThinkingRhythm({ frame }: { frame: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 4, height: 18 }}>
      {[0, 1, 2].map((i) => {
        const s = 0.35 + 0.65 * Math.abs(Math.sin((frame - i * 5) / 8));
        return (
          <span
            key={i}
            style={{
              width: 4,
              height: 18,
              borderRadius: 999,
              background: c.brandLift,
              transform: `scaleY(${s})`,
              transformOrigin: "bottom",
            }}
          />
        );
      })}
    </span>
  );
}

// â”€â”€ 0. intro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Intro({ mobile }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("intro");
  const pop = interpolate(frame, [2, 18], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.overshoot),
  });

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center mobile={mobile} top="47%" width={mobile ? "88%" : "76%"}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              opacity: ramp(frame, 2, 8),
              transform: `scale(${pop})`,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontFamily: font.mono,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#04211c",
                background: brandGradient,
                borderRadius: 999,
                padding: "9px 22px",
              }}
            >
              {INTRO.badge}
            </span>
          </div>

          <div
            style={{
              marginTop: 26,
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: mobile ? 58 : 64,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: c.ink,
            }}
          >
            <Words text={INTRO.headlineA} from={14} step={3} />
            <br />
            <Words text={INTRO.headlineB} from={30} step={3} gradient />
          </div>

          <div
            style={{
              marginTop: 22,
              fontSize: mobile ? 24 : 22,
              color: c.inkSoft,
              ...riseIn(frame, 58, 12),
            }}
          >
            {INTRO.sub}
          </div>

          <div
            style={{
              marginTop: 30,
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {FEATURE_TABS.map((tab, i) => (
              <div key={tab} style={riseIn(frame, 76 + i * 6, 10)}>
                <Chip label={tab} tone={i === 4 ? "brand" : "neutral"} />
              </div>
            ))}
            <div style={riseIn(frame, 112, 10)}>
              <Chip label={INTRO.usage} tone="warn" />
            </div>
          </div>
        </div>
      </Center>
    </SceneShell>
  );
}

// â”€â”€ 1. AI message generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Message({ mobile }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("message");

  const thinkingOn = frame >= 40 && frame < 92;
  const copied = ramp(frame, 196, 10);

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center mobile={mobile} top={mobile ? "49%" : "52%"} width={mobile ? "88%" : 960}>
        <Header eyebrow={MESSAGE.eyebrow} headline={MESSAGE.headline} frame={frame} mobile={mobile} />

        <div style={riseIn(frame, 16, 14)}>
          <Panel weight="strong" style={{ padding: mobile ? "22px 24px" : "24px 28px" }}>
            {/* context line: which job this message is for */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: mobile ? 14 : 13,
                  color: c.inkFaint,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {JOB.title}
              </span>
              <Chip label={JOB.score} tone="go" />
            </div>

            {/* the AiAssistant tab bar */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: 6,
                borderRadius: radius.md,
                ...glass.subtle,
                marginBottom: 16,
              }}
            >
              {FEATURE_TABS.slice(0, mobile ? 3 : 5).map((tab, i) => {
                const active = i === 0;
                return (
                  <span
                    key={tab}
                    style={{
                      fontSize: mobile ? 15 : 14,
                      fontWeight: 600,
                      padding: "7px 15px",
                      borderRadius: 999,
                      color: active ? "#04211c" : c.inkSoft,
                      background: active ? brandGradient : "transparent",
                    }}
                  >
                    {tab}
                  </span>
                );
              })}
            </div>

            {/* drafting rhythm, then the correspondence settles in */}
            {thinkingOn && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: radius.md,
                  ...glass.subtle,
                }}
              >
                <ThinkingRhythm frame={frame} />
                <span style={{ fontSize: mobile ? 17 : 16, color: c.inkSoft }}>
                  {MESSAGE.generating}
                </span>
              </div>
            )}

            {!thinkingOn && frame >= 92 && (
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: radius.md,
                  ...glass.subtle,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 12,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: c.inkFaint,
                    }}
                  >
                    {MESSAGE.tab}
                  </span>
                  <span style={{ opacity: copied, transform: `scale(${0.8 + copied * 0.2})` }}>
                    <Chip label={MESSAGE.copyLabel} tone="brand" />
                  </span>
                </div>
                {MESSAGE.lines.map((line, i) => (
                  <p
                    key={i}
                    style={{
                      margin: 0,
                      marginBottom: i < MESSAGE.lines.length - 1 ? 10 : 0,
                      fontSize: mobile ? 19 : 18,
                      lineHeight: 1.5,
                      color: c.ink,
                      ...riseIn(frame, 96 + i * 22, 16),
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: mobile ? 26 : 22,
            fontSize: mobile ? 22 : 20,
            color: c.inkSoft,
            ...riseIn(frame, 212, 12),
          }}
        >
          {MESSAGE.caption}
        </div>
      </Center>
    </SceneShell>
  );
}

// â”€â”€ 2. deep scam analysis + background check â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function DeepScan({ mobile }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("deepscan");

  const sweep = interpolate(frame, [30, 78], [-4, 104], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepOn = frame > 28 && frame < 84;

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center mobile={mobile} top={mobile ? "49%" : "52%"} width={mobile ? "88%" : 920}>
        <Header eyebrow={DEEPSCAN.eyebrow} headline={DEEPSCAN.headline} frame={frame} mobile={mobile} />

        <div style={riseIn(frame, 16, 14)}>
          <Window title={DEEPSCAN.windowTitle}>
            <div style={{ position: "relative" }}>
              {sweepOn && (
                <div
                  style={{
                    position: "absolute",
                    left: -10,
                    right: -10,
                    top: `${sweep}%`,
                    height: 34,
                    zIndex: 2,
                    background: `linear-gradient(180deg, transparent, ${c.brandLift}44 45%, ${c.brandLift}88 50%, ${c.brandLift}44 55%, transparent)`,
                  }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {DEEPSCAN.findings.map((finding, i) => (
                  <div key={finding.title} style={riseIn(frame, 44 + i * 18, 14)}>
                    <Row tone={finding.tone} title={finding.title} body={finding.body} />
                  </div>
                ))}
              </div>
            </div>
          </Window>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: mobile ? 26 : 22,
            fontSize: mobile ? 22 : 20,
            fontWeight: 700,
            color: c.brandLift,
            ...riseIn(frame, 132, 12),
          }}
        >
          {DEEPSCAN.verdict}
        </div>
      </Center>
    </SceneShell>
  );
}

// â”€â”€ 3. resume tailoring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Resume({ mobile }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("resume");

  const arrowIn = ramp(frame, 66, 12);

  const card = (
    label: string,
    text: string,
    kind: "before" | "after",
    start: number
  ) => (
    <div style={{ flex: 1, ...riseIn(frame, start, 14) }}>
      <Panel
        weight={kind === "after" ? "strong" : "panel"}
        style={{
          padding: "20px 22px",
          height: "100%",
          border:
            kind === "after"
              ? `1px solid rgba(23,194,164,0.4)`
              : undefined,
          boxShadow:
            kind === "after"
              ? `inset 0 1px 0 0 rgba(255,255,255,0.16), 0 0 44px rgba(23,194,164,0.14), 0 38px 80px -30px rgba(0,0,0,0.9)`
              : undefined,
        }}
      >
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: kind === "after" ? c.brandLift : c.inkFaint,
            marginBottom: 10,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: mobile ? 20 : 19,
            lineHeight: 1.5,
            color: kind === "after" ? c.ink : c.inkSoft,
          }}
        >
          {text}
        </div>
      </Panel>
    </div>
  );

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center mobile={mobile} top={mobile ? "49%" : "52%"} width={mobile ? "88%" : 1080}>
        <Header eyebrow={RESUME.eyebrow} headline={RESUME.headline} frame={frame} mobile={mobile} />

        <div
          style={{
            display: "flex",
            flexDirection: mobile ? "column" : "row",
            alignItems: "stretch",
            gap: mobile ? 14 : 18,
          }}
        >
          {card(RESUME.beforeLabel, RESUME.before, "before", 26)}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: arrowIn,
              transform: mobile ? "rotate(90deg)" : "none",
            }}
          >
            <svg width={34} height={34} viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12h14m0 0-5.5-5.5M18 12l-5.5 5.5"
                stroke={c.brandLift}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {card(RESUME.afterLabel, RESUME.after, "after", 54)}
        </div>

        <div
          style={{
            marginTop: mobile ? 24 : 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {RESUME.keywords.map((keyword, i) => (
            <div key={keyword} style={riseIn(frame, 118 + i * 9, 10)}>
              <Chip label={keyword} tone="brand" />
            </div>
          ))}
          <span
            style={{
              fontSize: mobile ? 20 : 18,
              color: c.inkSoft,
              marginLeft: 8,
              ...riseIn(frame, 150, 12),
            }}
          >
            {RESUME.caption}
          </span>
        </div>
      </Center>
    </SceneShell>
  );
}

// â”€â”€ 4. interview setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Setup({ mobile }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("setup");
  const buttonIn = ramp(frame, 96, 12);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 10);

  const field = (label: string, value: string, start: number, typed = false) => (
    <div style={riseIn(frame, start, 12)}>
      <div style={{ fontSize: mobile ? 16 : 15, fontWeight: 600, color: c.ink, marginBottom: 7 }}>
        {label}
      </div>
      <div
        style={{
          padding: "13px 16px",
          borderRadius: radius.md,
          ...glass.subtle,
          fontSize: mobile ? 19 : 18,
          color: c.inkSoft,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {typed ? (
          <TypeOn
            text={value}
            from={start + 8}
            cps={0.9}
            style={{
              fontFamily: font.body,
              letterSpacing: "normal",
              textTransform: "none",
              color: c.ink,
            }}
          />
        ) : (
          value
        )}
      </div>
    </div>
  );

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center mobile={mobile} top={mobile ? "49%" : "52%"} width={mobile ? "86%" : 780}>
        <div style={{ textAlign: "center", marginBottom: mobile ? 28 : 24 }}>
          <div style={{ fontSize: mobile ? 18 : 16, ...riseIn(frame, 2, 8) }}>
            <TypeOn text={SETUP.eyebrow} from={2} cps={1.7} />
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: mobile ? 52 : 54,
              letterSpacing: "-0.02em",
              color: c.ink,
            }}
          >
            <Words text={SETUP.headline} from={20} step={3} gradient />
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: mobile ? 22 : 20,
              color: c.inkSoft,
              ...riseIn(frame, 34, 12),
            }}
          >
            {SETUP.sub}
          </div>
        </div>

        <div style={riseIn(frame, 30, 14)}>
          <Panel weight="strong" style={{ padding: mobile ? "24px 26px" : "26px 30px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {field(SETUP.roleLabel, SETUP.roleValue, 44, true)}
              {field(SETUP.descLabel, SETUP.descValue, 70)}
              <div
                style={{
                  marginTop: 4,
                  opacity: buttonIn,
                  transform: `translateY(${(1 - buttonIn) * 12}px)`,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontFamily: font.body,
                    fontWeight: 700,
                    fontSize: mobile ? 19 : 18,
                    color: "#04211c",
                    background: brandGradient,
                    borderRadius: 999,
                    padding: "15px 20px",
                    boxShadow: `0 0 ${20 + pulse * 18}px rgba(23,194,164,${0.2 + pulse * 0.14})`,
                  }}
                >
                  {SETUP.button}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </Center>
    </SceneShell>
  );
}

// â”€â”€ 5. the live interview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StatusPill({ thinking, frame }: { thinking: boolean; frame: number }) {
  const dotOpacity = thinking ? 0.45 + 0.55 * Math.abs(Math.sin(frame / 7)) : 1;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 15px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.62)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: thinking ? c.brand : c.go,
          opacity: dotOpacity,
        }}
      />
      <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>
        {thinking ? INTERVIEW.statusThinking : INTERVIEW.statusActive}
      </span>
    </span>
  );
}

function MicButton({ recording, frame }: { recording: boolean; frame: number }) {
  const pulse = recording ? 1 + 0.05 * Math.sin(frame / 5) : 1;
  return (
    <div
      style={{
        width: 62,
        height: 62,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: recording ? c.stop : "#f2f5f8",
        transform: `scale(${pulse})`,
        boxShadow: recording
          ? `0 0 0 ${6 + 4 * Math.abs(Math.sin(frame / 6))}px rgba(255,107,94,0.25)`
          : "0 14px 30px -12px rgba(0,0,0,0.7)",
      }}
    >
      {recording ? (
        <span style={{ width: 20, height: 20, borderRadius: 5, background: "#fff" }} />
      ) : (
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#14181d" strokeWidth={1.9}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

/** A soft head-and-shoulders silhouette standing in for the webcam feed. */
function Silhouette({ frame }: { frame: number }) {
  const breathe = 1 + 0.006 * Math.sin(frame / 22);
  return (
    <svg
      viewBox="0 0 200 120"
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: `translateX(-50%) scale(${breathe})`,
        transformOrigin: "bottom center",
        width: "62%",
      }}
    >
      <ellipse cx="100" cy="132" rx="64" ry="52" fill="#1d242c" />
      <circle cx="100" cy="52" r="26" fill="#212932" />
    </svg>
  );
}

export function Interview({ mobile }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("interview");

  const recording = frame >= 100 && frame < 150;
  const thinking = frame >= 160 && frame < 208;
  const listeningOn = frame >= 106 && frame < 150;

  const bubble = (
    who: "ai" | "you",
    text: string,
    start: number,
    italic = false
  ) => {
    const p = ramp(frame, start, 12);
    if (p <= 0) return null;
    const isAi = who === "ai";
    return (
      <div
        style={{
          alignSelf: isAi ? "flex-start" : "flex-end",
          maxWidth: "88%",
          opacity: p,
          transform: `translateY(${(1 - p) * 12}px)`,
        }}
      >
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 11.5,
            color: isAi ? c.brandLift : c.inkFaint,
            marginBottom: 4,
            textAlign: isAi ? "left" : "right",
          }}
        >
          {isAi ? INTERVIEW.aiLabel : INTERVIEW.youLabel}
        </div>
        <div
          style={{
            padding: "11px 15px",
            borderRadius: isAi
              ? `${radius.md}px ${radius.md}px ${radius.md}px 4px`
              : `${radius.md}px ${radius.md}px 4px ${radius.md}px`,
            background: isAi ? "rgba(255,255,255,0.062)" : "rgba(23,194,164,0.16)",
            border: isAi
              ? "1px solid rgba(255,255,255,0.11)"
              : "1px solid rgba(23,194,164,0.32)",
            fontSize: mobile ? 17.5 : 16.5,
            lineHeight: 1.45,
            color: c.ink,
            fontStyle: italic ? "italic" : "normal",
          }}
        >
          {text}
        </div>
      </div>
    );
  };

  const viewport = (
    <div
      style={{
        position: "relative",
        borderRadius: radius.lg,
        overflow: "hidden",
        aspectRatio: "16 / 9",
        background: "radial-gradient(ellipse at 50% 30%, #10151b 0%, #080b0e 78%)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 38px 80px -30px rgba(0,0,0,0.9)",
        ...riseIn(frame, 8, 16),
      }}
    >
      <Silhouette frame={frame} />
      <div style={{ position: "absolute", top: 14, left: 14, ...riseIn(frame, 18, 10) }}>
        <StatusPill thinking={thinking} frame={frame} />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          opacity: ramp(frame, 26, 10),
          transform: "translateX(-50%)",
        }}
      >
        <MicButton recording={recording} frame={frame} />
      </div>
    </div>
  );

  const transcript = (
    <div style={{ display: "flex", flexDirection: "column", gap: 13, justifyContent: "center" }}>
      {bubble("ai", INTERVIEW.aiQuestion, 44)}
      {listeningOn && bubble("you", INTERVIEW.listening, 106, true)}
      {!listeningOn && frame >= 152 && bubble("you", INTERVIEW.userAnswer, 152)}
      {bubble("ai", INTERVIEW.aiFollowUp, 216)}
    </div>
  );

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center mobile={mobile} top={mobile ? "49%" : "52%"} width={mobile ? "88%" : 1220}>
        {mobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {viewport}
            {transcript}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 34, alignItems: "center" }}>
            {viewport}
            {transcript}
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: mobile ? 26 : 26,
            fontSize: mobile ? 22 : 21,
            color: c.inkSoft,
            ...riseIn(frame, 252, 14),
          }}
        >
          {INTERVIEW.caption}
        </div>
      </Center>
    </SceneShell>
  );
}

// â”€â”€ 6. honest pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Plans({ mobile }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("plans");

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center mobile={mobile} top={mobile ? "49%" : "52%"} width={mobile ? "86%" : 900}>
        <Header eyebrow={PLANS.eyebrow} headline={PLANS.headline} frame={frame} mobile={mobile} />

        <div
          style={{
            display: "flex",
            flexDirection: mobile ? "column" : "row",
            gap: mobile ? 14 : 20,
          }}
        >
          {PLANS.cards.map((card, i) => (
            <div key={card.name} style={{ flex: 1, ...riseIn(frame, 34 + i * 14, 14) }}>
              <Panel
                weight="strong"
                style={{
                  padding: "22px 26px",
                  border: card.featured ? "1px solid rgba(23,194,164,0.45)" : undefined,
                  boxShadow: card.featured
                    ? "inset 0 1px 0 0 rgba(255,255,255,0.16), 0 0 44px rgba(23,194,164,0.16), 0 38px 80px -30px rgba(0,0,0,0.9)"
                    : undefined,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: mobile ? 20 : 19, color: c.ink }}>
                    {card.name}
                  </span>
                  {card.featured && <Chip label="Best value" tone="brand" />}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontWeight: 700,
                      fontSize: mobile ? 40 : 38,
                      color: c.ink,
                    }}
                  >
                    {card.price}
                  </span>
                  <span style={{ fontSize: 16, color: c.inkFaint }}>{card.period}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: mobile ? 17 : 16, color: c.inkSoft }}>
                  {card.note}
                </div>
              </Panel>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: mobile ? 24 : 22,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={riseIn(frame, 92, 12)}>
            <Chip label={PLANS.trial} tone="warn" />
          </div>
          <div
            style={{
              fontSize: mobile ? 18 : 16,
              color: c.inkFaint,
              ...riseIn(frame, 112, 12),
            }}
          >
            {PLANS.privacy}
          </div>
        </div>
      </Center>
    </SceneShell>
  );
}

// â”€â”€ 7. cta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Cta({ mobile }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("cta");

  const bloom = interpolate(frame, [4, 22], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.overshoot),
  });
  const bloomO = ramp(frame, 4, 10);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 12);
  const urlIn = ramp(frame, 78, 14);

  return (
    <SceneShell durationInFrames={spec.durationInFrames} push={1.015}>
      <Center mobile={mobile} top="48%" width={mobile ? "88%" : "70%"}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              opacity: bloomO,
              transform: `scale(${bloom})`,
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <ShieldMark size={mobile ? 86 : 82} />
          </div>

          <div
            style={{
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: mobile ? 58 : 62,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: c.ink,
            }}
          >
            <Words text={CTA.headlineA} from={16} step={3} />
            <br />
            <Words text={CTA.headlineB} from={28} step={3} gradient />
          </div>

          <div
            style={{
              marginTop: 32,
              display: "inline-block",
              opacity: urlIn,
              transform: `translateY(${(1 - urlIn) * 16}px)`,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontFamily: font.mono,
                fontWeight: 700,
                fontSize: mobile ? 30 : 30,
                letterSpacing: "0.02em",
                color: "#04211c",
                background: brandGradient,
                borderRadius: 999,
                padding: "17px 46px",
                boxShadow: `0 0 ${32 + pulse * 24}px rgba(23,194,164,${0.26 + pulse * 0.2}), 0 24px 60px -20px rgba(0,0,0,0.8)`,
              }}
            >
              {CTA.url}
            </span>
          </div>

          <div
            style={{
              marginTop: 26,
              display: "flex",
              justifyContent: "center",
              gap: 11,
              flexWrap: "wrap",
              ...riseIn(frame, 104, 12),
            }}
          >
            {CTA.chips.map((chipLabel) => (
              <Chip key={chipLabel} label={chipLabel} tone="neutral" />
            ))}
          </div>
        </div>
      </Center>
    </SceneShell>
  );
}
