// ad/scenes.tsx — one component per beat of the marketing ad.
//
// Every scene renders inside its own <Sequence>, so frame numbers here are
// local ("n frames into this scene"). Layout adapts between the 16:9 and 9:16
// cuts via the `vertical` prop rather than separate scene trees, so copy and
// timing can never drift between the two.

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from "remotion";
import { Chip, Panel, Ring, Row, Stamp, Window } from "../howto/chrome";
import { brandGradient, c, ease, font, glass, radius, toneColors } from "../howto/theme";
import {
  AdStage,
  SceneShell,
  ShieldMark,
  TypeOn,
  Words,
  Wordmark,
  ramp,
  riseIn,
} from "./chrome";
import {
  BAIT_POST,
  CTA,
  GOOD_POST,
  GROUP_CHAT,
  HOOK,
  SCAN,
  TRUST,
  VERDICT_BAD,
  WORLD,
  scene,
} from "./script";

export type SceneProps = { vertical: boolean };

/** Shared centred column the scene content sits in. */
function Center({
  children,
  vertical,
  top = "50%",
  width,
}: {
  children: React.ReactNode;
  vertical: boolean;
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
          width: width ?? (vertical ? "86%" : "66%"),
          maxWidth: vertical ? 920 : 1220,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
}

// ── 1. hook — 11:47 PM, Quezon City ─────────────────────────────────────────

/** Deterministic layout for the doomscrolled feed fragments. */
const FRAGMENTS = [
  { x: "6%", y: "78%", size: 30, o: 0.3, drift: 0.36, w: 700 },
  { x: "64%", y: "88%", size: 44, o: 0.22, drift: 0.5, w: 800 },
  { x: "74%", y: "30%", size: 26, o: 0.26, drift: 0.3, w: 700 },
  { x: "10%", y: "16%", size: 36, o: 0.18, drift: 0.44, w: 800 },
  { x: "48%", y: "8%", size: 24, o: 0.24, drift: 0.26, w: 700 },
  { x: "82%", y: "62%", size: 32, o: 0.28, drift: 0.4, w: 800 },
  { x: "26%", y: "94%", size: 38, o: 0.2, drift: 0.54, w: 700 },
  { x: "40%", y: "40%", size: 22, o: 0.15, drift: 0.22, w: 700 },
];

export function Hook({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("hook");

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      {/* the feed that never runs out of promises */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {HOOK.fragments.map((text, i) => {
          const f = FRAGMENTS[i % FRAGMENTS.length];
          const appear = ramp(frame, 4 + i * 3, 18);
          return (
            <div
              key={text}
              style={{
                position: "absolute",
                left: f.x,
                top: f.y,
                opacity: f.o * appear,
                transform: `translateY(${-frame * f.drift}px) rotate(${i % 2 === 0 ? -2 : 1.5}deg)`,
                fontFamily: font.display,
                fontWeight: f.w as React.CSSProperties["fontWeight"],
                fontSize: f.size * (vertical ? 0.92 : 1),
                letterSpacing: "0.02em",
                color: c.inkFaint,
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </div>
          );
        })}
      </AbsoluteFill>

      <Center vertical={vertical} top="50%" width={vertical ? "88%" : "72%"}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: vertical ? 22 : 20, ...riseIn(frame, 6, 8) }}>
            <TypeOn text={HOOK.eyebrow} from={8} cps={1.15} />
          </div>
          <div
            style={{
              marginTop: 30,
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: vertical ? 72 : 76,
              lineHeight: 1.06,
              letterSpacing: "-0.03em",
              color: c.ink,
            }}
          >
            <Words text={HOOK.headline} from={46} step={3.4} />
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: vertical ? 27 : 25,
              lineHeight: 1.5,
              color: c.inkSoft,
              ...riseIn(frame, 118, 12),
            }}
          >
            {HOOK.sub}
          </div>
        </div>
      </Center>
    </SceneShell>
  );
}

// ── 2. bait — the post that reads like a rescue ─────────────────────────────

export function Bait({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("bait");

  // The tempting lines flush gold once the whole post is on screen.
  const temptation = ramp(frame, 108, 22);

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center vertical={vertical} top={vertical ? "48%" : "50%"} width={vertical ? "88%" : 880}>
        <div style={riseIn(frame, 4, 20)}>
          <Panel weight="strong" style={{ padding: vertical ? "30px 32px" : "32px 38px" }}>
            <div
              style={{
                fontFamily: font.display,
                fontWeight: 700,
                fontSize: vertical ? 36 : 34,
                color: c.ink,
                letterSpacing: "-0.01em",
                ...riseIn(frame, 8, 10),
              }}
            >
              {BAIT_POST.title}
            </div>
            <div
              style={{
                fontFamily: font.mono,
                fontSize: vertical ? 16 : 15,
                color: c.inkFaint,
                marginTop: 8,
                marginBottom: 20,
                ...riseIn(frame, 14, 8),
              }}
            >
              {BAIT_POST.source}
            </div>

            {BAIT_POST.lines.map((line, i) => {
              const tempting = line.tone === "temptation";
              const color = tempting
                ? interpolateColors(temptation, [0, 1], [c.ink, c.marker])
                : c.ink;
              return (
                <div
                  key={line.id}
                  style={{
                    padding: "9px 0",
                    borderBottom:
                      i < BAIT_POST.lines.length - 1
                        ? "1px solid rgba(255,255,255,0.07)"
                        : "none",
                    fontSize: vertical ? 25 : 24,
                    fontWeight: tempting ? 700 : 500,
                    color,
                    textShadow: tempting
                      ? `0 0 ${22 * temptation}px rgba(240,192,90,${0.5 * temptation})`
                      : "none",
                    ...riseIn(frame, 24 + i * 11, 12),
                  }}
                >
                  {line.text}
                </div>
              );
            })}
          </Panel>
        </div>

        <div style={{ textAlign: "center", marginTop: vertical ? 42 : 34 }}>
          <div
            style={{
              fontSize: vertical ? 30 : 28,
              color: c.inkSoft,
              ...riseIn(frame, 150, 14),
            }}
          >
            {BAIT_POST.captionA}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: vertical ? 40 : 38,
              letterSpacing: "-0.01em",
              color: c.stopInk,
              textShadow: `0 0 30px ${c.stop}44`,
              ...riseIn(frame, 196, 14),
            }}
          >
            {BAIT_POST.captionB}
          </div>
        </div>
      </Center>
    </SceneShell>
  );
}

// ── 3. scan — paste it into ApplyGuard ──────────────────────────────────────

export function Scan({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("scan");

  // The pasted post drops in, then the sweep reads it top to bottom.
  const paste = ramp(frame, 52, 16);
  const sweep = interpolate(frame, [92, 148], [-4, 104], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepOn = frame > 90 && frame < 154;

  const flagged = BAIT_POST.lines.filter((l) => SCAN.chips[l.id as keyof typeof SCAN.chips]);

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center vertical={vertical} top={vertical ? "48%" : "51%"} width={vertical ? "88%" : 900}>
        <div style={{ textAlign: "center", marginBottom: vertical ? 34 : 28 }}>
          <div style={{ fontSize: vertical ? 19 : 17, ...riseIn(frame, 4, 8) }}>
            <TypeOn text={SCAN.eyebrow} from={4} cps={1.6} />
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: vertical ? 56 : 54,
              letterSpacing: "-0.02em",
              color: c.ink,
            }}
          >
            <Words text="Paste it into" from={22} step={3} />{" "}
            <Words text="ApplyGuard." from={31} step={3} gradient />
          </div>
        </div>

        <div
          style={{
            opacity: paste,
            transform: `translateY(${(1 - paste) * -26}px) scale(${0.97 + paste * 0.03})`,
          }}
        >
          <Window title={SCAN.windowTitle}>
            <div style={{ position: "relative" }}>
              {sweepOn && (
                <div
                  style={{
                    position: "absolute",
                    left: -8,
                    right: -8,
                    top: `${sweep}%`,
                    height: 36,
                    zIndex: 2,
                    background: `linear-gradient(180deg, transparent, ${c.brandLift}44 45%, ${c.brandLift}88 50%, ${c.brandLift}44 55%, transparent)`,
                  }}
                />
              )}
              <div
                style={{
                  fontFamily: font.display,
                  fontWeight: 600,
                  fontSize: vertical ? 27 : 25,
                  color: c.ink,
                  marginBottom: 14,
                }}
              >
                {BAIT_POST.title}
              </div>
              {flagged.map((line, i) => {
                const chip = SCAN.chips[line.id as keyof typeof SCAN.chips];
                // Each chip pins as the sweep passes its row.
                const chipIn = ramp(frame, 100 + i * 13, 10);
                return (
                  <div
                    key={line.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 14,
                      padding: "10px 0",
                      borderBottom:
                        i < flagged.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: vertical ? 21 : 20,
                        color: c.inkSoft,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {line.text}
                    </span>
                    <span
                      style={{
                        opacity: chipIn,
                        transform: `scale(${0.7 + chipIn * 0.3})`,
                        flexShrink: 0,
                      }}
                    >
                      <Chip label={chip.label} tone={chip.tone} />
                    </span>
                  </div>
                );
              })}
            </div>
          </Window>
        </div>
      </Center>
    </SceneShell>
  );
}

// ── 4. verdict — SKIP, and the fee stays home ───────────────────────────────

export function VerdictBad({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("verdict");

  const slam = interpolate(frame, [8, 22], [1.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.overshoot),
  });
  const slamO = ramp(frame, 8, 7);
  const ringP = ramp(frame, 26, 46);

  const verdictBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 26,
      }}
    >
      <div style={{ opacity: slamO, transform: `scale(${slam})` }}>
        <Stamp text={VERDICT_BAD.stamp} tone="stop" scale={vertical ? 1.25 : 1.35} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <Ring score={VERDICT_BAD.score} progress={ringP} tone="stop" size={vertical ? 170 : 172} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          <div style={riseIn(frame, 34, 10)}>
            <Chip label={VERDICT_BAD.risk} tone="stop" />
          </div>
          <div
            style={{
              fontSize: vertical ? 18 : 17,
              color: c.inkFaint,
              maxWidth: 300,
              lineHeight: 1.45,
              ...riseIn(frame, 44, 10),
            }}
          >
            {VERDICT_BAD.scoreNote}
          </div>
        </div>
      </div>
    </div>
  );

  const reasons = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {VERDICT_BAD.reasons.map((r, i) => (
        <div key={r.title} style={riseIn(frame, 58 + i * 16, 14)}>
          <Row tone="stop" title={r.title} body={r.body} />
        </div>
      ))}
    </div>
  );

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center vertical={vertical} top={vertical ? "47%" : "52%"} width={vertical ? "88%" : 1150}>
        {vertical ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {verdictBlock}
            {reasons}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 64 }}>
            <div style={{ flexShrink: 0 }}>{verdictBlock}</div>
            <div style={{ flex: 1 }}>{reasons}</div>
          </div>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: vertical ? 46 : 44,
            fontSize: vertical ? 30 : 29,
            fontWeight: 700,
            color: c.ink,
            ...riseIn(frame, 122, 14),
          }}
        >
          ₱1,500 stays in Maya's pocket.{" "}
          <span style={{ color: c.marker }}>Buti na lang.</span>
        </div>
      </Center>
    </SceneShell>
  );
}

// ── 5. group chat — warn the barkada ────────────────────────────────────────

function Avatar({ letter, bg }: { letter: string; bg: string }) {
  return (
    <span
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        background: bg,
        color: c.paper,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.mono,
        fontSize: 15,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {letter}
    </span>
  );
}

function TypingDots({ frame }: { frame: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: c.inkFaint,
            opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame - i * 5) / 9)),
          }}
        />
      ))}
    </span>
  );
}

export function GroupChat({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("groupchat");

  const shareIn = ramp(frame, 34, 16);
  const typingOn = frame >= 78 && frame < 104;
  const reply1 = ramp(frame, 104, 12);
  const reply2 = ramp(frame, 138, 12);

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center vertical={vertical} top={vertical ? "48%" : "50%"} width={vertical ? "86%" : 880}>
        <div
          style={{
            textAlign: "center",
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: vertical ? 46 : 40,
            letterSpacing: "-0.02em",
            color: c.ink,
            marginBottom: vertical ? 36 : 30,
          }}
        >
          <Words text={GROUP_CHAT.headline} from={4} step={2.6} />
        </div>

        <div style={{ maxWidth: vertical ? undefined : 720, margin: "0 auto", ...riseIn(frame, 20, 18) }}>
          <Panel weight="strong" style={{ overflow: "hidden" }}>
            {/* chat header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span style={{ display: "inline-flex" }}>
                <Avatar letter="M" bg={c.brandDeep} />
                <span style={{ marginLeft: -10, display: "inline-flex" }}>
                  <Avatar letter="K" bg="#8a6d2f" />
                </span>
                <span style={{ marginLeft: -10, display: "inline-flex" }}>
                  <Avatar letter="D" bg="#4a5a75" />
                </span>
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 19, color: c.ink }}>
                  {GROUP_CHAT.chatName}
                </div>
                <div style={{ fontSize: 14, color: c.inkFaint }}>{GROUP_CHAT.members}</div>
              </div>
            </div>

            <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Maya shares the verdict card */}
              <div
                style={{
                  alignSelf: "flex-end",
                  width: "78%",
                  opacity: shareIn,
                  transform: `translateY(${(1 - shareIn) * 18}px)`,
                }}
              >
                <div
                  style={{
                    borderRadius: `${radius.md}px ${radius.md}px 4px ${radius.md}px`,
                    background: "rgba(23,194,164,0.13)",
                    border: "1px solid rgba(23,194,164,0.3)",
                    padding: "14px 16px",
                  }}
                >
                  <Chip label={GROUP_CHAT.share.verdict} tone="stop" />
                  <div style={{ marginTop: 10, fontWeight: 700, fontSize: 18, color: c.ink }}>
                    {GROUP_CHAT.share.title}
                  </div>
                  <div style={{ marginTop: 5, fontSize: 15.5, lineHeight: 1.45, color: c.inkSoft }}>
                    {GROUP_CHAT.share.note}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontFamily: font.mono,
                      fontSize: 12,
                      color: c.inkFaint,
                    }}
                  >
                    <ShieldMark size={14} />
                    {GROUP_CHAT.share.via}
                  </div>
                </div>
              </div>

              {/* typing, then the replies */}
              {typingOn && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "12px 16px",
                    borderRadius: `${radius.md}px ${radius.md}px ${radius.md}px 4px`,
                    ...glass.subtle,
                  }}
                >
                  <TypingDots frame={frame} />
                </div>
              )}

              {[GROUP_CHAT.replies[0], GROUP_CHAT.replies[1]].map((reply, i) => {
                const p = i === 0 ? reply1 : reply2;
                if (p <= 0) return null;
                return (
                  <div
                    key={reply.author}
                    style={{
                      alignSelf: "flex-start",
                      maxWidth: "78%",
                      opacity: p,
                      transform: `translateY(${(1 - p) * 14}px)`,
                    }}
                  >
                    <div
                      style={{
                        padding: "11px 16px",
                        borderRadius: `${radius.md}px ${radius.md}px ${radius.md}px 4px`,
                        ...glass.subtle,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: font.mono,
                          fontSize: 12,
                          color: c.brandLift,
                          marginBottom: 3,
                        }}
                      >
                        {reply.author}
                      </div>
                      <div style={{ fontSize: 17, color: c.ink }}>{reply.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </Center>
    </SceneShell>
  );
}

// ── 6. the real one — a quiet post worth saying yes to ──────────────────────

export function RealOne({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("real");

  const sweep = interpolate(frame, [88, 126], [-4, 104], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sweepOn = frame > 86 && frame < 132;
  const slam = interpolate(frame, [138, 152], [1.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.overshoot),
  });
  const slamO = ramp(frame, 138, 7);
  const ringP = ramp(frame, 150, 40);

  const doc = (
    <Panel weight="strong" style={{ padding: vertical ? "26px 28px" : "28px 32px", position: "relative", overflow: "hidden" }}>
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
          fontWeight: 700,
          fontSize: vertical ? 30 : 28,
          color: c.ink,
          ...riseIn(frame, 22, 10),
        }}
      >
        {GOOD_POST.title}
      </div>
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 14,
          color: c.inkFaint,
          marginTop: 6,
          marginBottom: 14,
          ...riseIn(frame, 28, 8),
        }}
      >
        {GOOD_POST.source}
      </div>
      {GOOD_POST.lines.map((line, i) => (
        <div
          key={line.id}
          style={{
            padding: "7px 0",
            borderBottom:
              i < GOOD_POST.lines.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
            fontSize: vertical ? 20 : 19,
            color: c.inkSoft,
            ...riseIn(frame, 36 + i * 9, 10),
          }}
        >
          {line.text}
        </div>
      ))}
    </Panel>
  );

  const verdictCol = (
    <div
      style={{
        display: "flex",
        flexDirection: vertical ? ("row" as const) : ("column" as const),
        alignItems: "center",
        justifyContent: "center",
        gap: vertical ? 34 : 22,
      }}
    >
      <div style={{ opacity: slamO, transform: `scale(${slam})` }}>
        <Stamp text={GOOD_POST.verdict} tone="go" scale={vertical ? 1 : 0.95} />
      </div>
      <Ring score={GOOD_POST.score} progress={ringP} tone="go" size={vertical ? 150 : 156} />
      <div style={riseIn(frame, 168, 10)}>
        <Chip label={GOOD_POST.risk} tone="go" />
      </div>
    </div>
  );

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center vertical={vertical} top={vertical ? "47%" : "50%"} width={vertical ? "88%" : 1220}>
        <div style={{ textAlign: "center", marginBottom: vertical ? 26 : 22, fontSize: vertical ? 19 : 17 }}>
          <TypeOn text={GOOD_POST.eyebrow} from={4} cps={1.5} />
        </div>

        {vertical ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            {doc}
            {verdictCol}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 44, alignItems: "stretch" }}>
            <div style={{ flex: 1.35 }}>{doc}</div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {verdictCol}
            </div>
          </div>
        )}

        {/* next step + tracker beat */}
        <div style={{ marginTop: vertical ? 30 : 26, ...riseIn(frame, 196, 14) }}>
          <Row tone="brand" title={GOOD_POST.nextStep} />
        </div>
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            ...riseIn(frame, 222, 14),
          }}
        >
          {GOOD_POST.tracker.map((stage, i) => (
            <React.Fragment key={stage}>
              {i > 0 && <span style={{ color: c.inkFaint, fontSize: 16 }}>→</span>}
              <Chip label={stage} tone={i === 1 ? "brand" : "neutral"} />
            </React.Fragment>
          ))}
          <span style={{ width: 14 }} />
          <Chip label={GOOD_POST.followUp} tone="warn" />
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: vertical ? 30 : 26,
            fontSize: vertical ? 27 : 25,
            color: c.inkSoft,
            ...riseIn(frame, 248, 14),
          }}
        >
          {GOOD_POST.caption}
        </div>
      </Center>
    </SceneShell>
  );
}

// ── 7. world — Manila, Bogotá, Nairobi ──────────────────────────────────────

export function World({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("world");

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center vertical={vertical} top={vertical ? "48%" : "52%"} width={vertical ? "86%" : 1250}>
        <div style={{ textAlign: "center", marginBottom: vertical ? 44 : 40 }}>
          <div
            style={{
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: vertical ? 52 : 56,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              color: c.ink,
            }}
          >
            <Words text={WORLD.headline} from={4} step={3} />
            <br />
            <Words text={WORLD.headlineB} from={26} step={3} gradient />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            gap: vertical ? 18 : 24,
          }}
        >
          {WORLD.cards.map((card, i) => {
            const p = ramp(frame, 58 + i * 16, 16);
            const t = toneColors(card.tone);
            return (
              <div
                key={card.city}
                style={{
                  flex: 1,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 22}px)`,
                }}
              >
                <Panel
                  weight="panel"
                  style={{
                    padding: "22px 24px",
                    display: "flex",
                    flexDirection: vertical ? "row" : "column",
                    alignItems: vertical ? "center" : "flex-start",
                    gap: vertical ? 20 : 14,
                    borderTop: vertical ? undefined : `3px solid ${t.dot}`,
                    borderLeft: vertical ? `3px solid ${t.dot}` : undefined,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: font.mono,
                        fontSize: 13,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: c.inkFaint,
                      }}
                    >
                      {card.city}
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 700, fontSize: 19, color: c.ink }}>
                      {card.who}
                    </div>
                    <div style={{ marginTop: 5, fontSize: 16, lineHeight: 1.4, color: c.inkSoft }}>
                      {card.detail}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginTop: vertical ? 0 : 6,
                    }}
                  >
                    <Chip label={card.verdict} tone={card.tone} />
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontWeight: 700,
                        fontSize: 26,
                        color: t.fg,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {Math.round(card.score * ramp(frame, 66 + i * 16, 26))}
                    </span>
                  </div>
                </Panel>
              </div>
            );
          })}
        </div>
      </Center>
    </SceneShell>
  );
}

// ── 8. trust — no catch ─────────────────────────────────────────────────────

export function Trust({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("trust");

  return (
    <SceneShell durationInFrames={spec.durationInFrames}>
      <Center vertical={vertical} top="51%" width={vertical ? "84%" : 820}>
        <div
          style={{
            textAlign: "center",
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: vertical ? 52 : 52,
            letterSpacing: "-0.02em",
            color: c.ink,
            marginBottom: vertical ? 40 : 34,
          }}
        >
          <Words text={TRUST.headline} from={4} step={3} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {TRUST.points.map((point, i) => (
            <div key={point.title} style={riseIn(frame, 34 + i * 17, 15)}>
              <Row tone="brand" title={point.title} body={point.body} />
            </div>
          ))}
        </div>
      </Center>
    </SceneShell>
  );
}

// ── 9. cta ──────────────────────────────────────────────────────────────────

export function Cta({ vertical }: SceneProps) {
  const frame = useCurrentFrame();
  const spec = scene("cta");

  const bloom = interpolate(frame, [4, 22], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...ease.overshoot),
  });
  const bloomO = ramp(frame, 4, 10);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 12);
  const urlIn = ramp(frame, 92, 14);

  return (
    <SceneShell durationInFrames={spec.durationInFrames} push={1.015}>
      <Center vertical={vertical} top={vertical ? "50%" : "48%"} width={vertical ? "88%" : "70%"}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              opacity: bloomO,
              transform: `scale(${bloom})`,
              display: "flex",
              justifyContent: "center",
              marginBottom: 26,
            }}
          >
            <ShieldMark size={vertical ? 96 : 88} />
          </div>

          <div
            style={{
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: vertical ? 64 : 68,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: c.ink,
            }}
          >
            <Words text="Scan the post" from={18} step={3} />
            <br />
            <Words text="before you say yes." from={30} step={3} gradient />
          </div>

          <div
            style={{
              marginTop: 22,
              fontSize: vertical ? 26 : 24,
              color: c.inkSoft,
              ...riseIn(frame, 62, 12),
            }}
          >
            {CTA.sub}
          </div>

          <div
            style={{
              marginTop: 36,
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
                fontSize: vertical ? 34 : 32,
                letterSpacing: "0.02em",
                color: "#04211c",
                background: brandGradient,
                borderRadius: 999,
                padding: vertical ? "20px 52px" : "18px 50px",
                boxShadow: `0 0 ${34 + pulse * 26}px rgba(23,194,164,${0.28 + pulse * 0.2}), 0 24px 60px -20px rgba(0,0,0,0.8)`,
              }}
            >
              {CTA.url}
            </span>
          </div>

          <div
            style={{
              marginTop: 30,
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              ...riseIn(frame, 118, 12),
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

export { AdStage, Wordmark };
