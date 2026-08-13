// VerdictStamp.tsx — Stamp that lands on the document with spring overshoot.
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors, radii, spacing } from "../design/tokens";
import { styles } from "../design/typography";
import { BEAT } from "../story/frames";

type Props = {
  text: string;
  tone: "stop" | "warn";
  appearFrame?: number;
};

export default function VerdictStamp({
  text,
  tone,
  appearFrame,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const from = appearFrame ?? BEAT.verdict.from + 30;

  const stampProgress = spring({
    frame: frame - from,
    fps,
    config: { damping: 8, stiffness: 300, mass: 0.6 },
  });

  const scale = interpolate(stampProgress, [0, 1], [2.5, 1]);
  const opacity = interpolate(stampProgress, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });
  const rotation = interpolate(stampProgress, [0, 1], [-8, -4]);

  if (frame < from) return null;

  const stampColor = tone === "stop" ? colors.stop : colors.warn;

  return (
    <div
      style={{
        display: "inline-block",
        padding: spacing.stampPadding,
        border: `2.5px solid ${stampColor}`,
        borderRadius: radii.stamp,
        fontFamily: styles.stamp.fontFamily,
        fontSize: styles.stamp.fontSize,
        fontWeight: styles.stamp.fontWeight,
        letterSpacing: styles.stamp.letterSpacing,
        color: stampColor,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}
