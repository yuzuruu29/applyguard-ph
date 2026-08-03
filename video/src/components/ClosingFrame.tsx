// ClosingFrame.tsx — Final closing message and CTA for beat 8.
import { interpolate, useCurrentFrame, spring, useVideoConfig, Easing } from "remotion";
import { colors, easing } from "../design/tokens";
import { styles } from "../design/typography";
import { CLOSING } from "../story/content";
import { BEAT } from "../story/frames";

export default function ClosingFrame() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { from } = BEAT.closing;
  const localFrame = frame - from;

  const headlineOpacity = interpolate(
    localFrame,
    [0, 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  const headlineY = interpolate(
    localFrame,
    [0, 10],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  const subOpacity = interpolate(
    localFrame,
    [8, 18],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const ctaProgress = spring({
    frame: localFrame - 20,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.8 },
  });

  const ctaScale = interpolate(ctaProgress, [0, 1], [0.8, 1]);
  const ctaOpacity = interpolate(ctaProgress, [0, 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Workflow pills
  const workflowOpacity = interpolate(
    localFrame,
    [30, 38],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      {/* Headline */}
      <div
        style={{
          fontFamily: styles.closing.fontFamily,
          fontSize: styles.closing.fontSize,
          fontWeight: styles.closing.fontWeight,
          color: styles.closing.color,
          lineHeight: styles.closing.lineHeight,
          textAlign: "center",
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          maxWidth: 700,
        }}
      >
        {CLOSING.headline}
      </div>

      {/* Sub */}
      <div
        style={{
          fontFamily: styles.closingSub.fontFamily,
          fontSize: styles.closingSub.fontSize,
          color: styles.closingSub.color,
          lineHeight: styles.closingSub.lineHeight,
          textAlign: "center",
          opacity: subOpacity,
          maxWidth: 500,
        }}
      >
        {CLOSING.sub}
      </div>

      {/* CTA button */}
      <div
        style={{
          marginTop: 8,
          padding: "12px 28px",
          background: colors.brand,
          color: colors.white,
          borderRadius: 8,
          fontFamily: styles.panelLine.fontFamily,
          fontSize: 16,
          fontWeight: 600,
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
        }}
      >
        {CLOSING.cta}
      </div>

      {/* Small text */}
      <div
        style={{
          fontFamily: styles.closingSmall.fontFamily,
          fontSize: styles.closingSmall.fontSize,
          color: styles.closingSmall.color,
          textAlign: "center",
          opacity: ctaOpacity,
        }}
      >
        {CLOSING.small}
      </div>

      {/* Workflow pills */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          opacity: workflowOpacity,
        }}
      >
        {CLOSING.workflow.map((step, i) => (
          <div
            key={i}
            style={{
              padding: "4px 12px",
              background: `${colors.brand}10`,
              border: `1px solid ${colors.brand}30`,
              borderRadius: 20,
              fontFamily: styles.chip.fontFamily,
              fontSize: styles.chip.fontSize,
              fontWeight: 600,
              color: colors.brand,
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
