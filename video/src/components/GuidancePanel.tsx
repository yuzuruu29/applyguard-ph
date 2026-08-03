// GuidancePanel.tsx — Verification guidance steps for beat 5.
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { colors, radii, spacing, easing } from "../design/tokens";
import { styles } from "../design/typography";
import { GUIDANCE_STEPS } from "../story/content";
import { BEAT } from "../story/frames";
import { ShieldCheckIcon } from "../icons";

export default function GuidancePanel() {
  const frame = useCurrentFrame();
  const { from } = BEAT.guidance;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radii.panel,
        padding: spacing.panelPadding + 8,
        width: 460,
        boxShadow: `0 4px 20px ${colors.ink}10`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          opacity: interpolate(frame, [from, from + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <ShieldCheckIcon size={22} />
        <span
          style={{
            fontFamily: styles.panelHeader.fontFamily,
            fontSize: styles.panelHeader.fontSize,
            fontWeight: styles.panelHeader.fontWeight,
            color: colors.brand,
          }}
        >
          What to verify
        </span>
      </div>

      {/* Steps */}
      {GUIDANCE_STEPS.map((step, i) => {
        const stepFrame = from + 10 + i * 8;
        const opacity = interpolate(
          frame,
          [stepFrame, stepFrame + 6],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
        );
        const translateX = interpolate(
          frame,
          [stepFrame, stepFrame + 6],
          [-10, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
        );

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 0",
              borderBottom: i < GUIDANCE_STEPS.length - 1 ? `1px solid ${colors.line}60` : "none",
              opacity,
              transform: `translateX(${translateX}px)`,
            }}
          >
            {/* Step number */}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: `${colors.brand}15`,
                border: `1px solid ${colors.brand}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: styles.chip.fontFamily,
                fontSize: 11,
                fontWeight: 700,
                color: colors.brand,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <span
              style={{
                fontFamily: styles.panelLine.fontFamily,
                fontSize: styles.panelLine.fontSize,
                color: colors.inkSoft,
                lineHeight: 1.4,
              }}
            >
              {step}
            </span>
          </div>
        );
      })}

      {/* Privacy note */}
      <div
        style={{
          marginTop: 12,
          fontFamily: styles.panelLine.fontFamily,
          fontSize: 12,
          color: colors.inkFaint,
          textAlign: "center",
          opacity: interpolate(frame, [from + 42, from + 50], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Free scan runs in your browser. Premium requests are server-protected.
      </div>
    </div>
  );
}
