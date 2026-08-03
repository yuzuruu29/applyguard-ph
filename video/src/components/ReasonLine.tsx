// ReasonLine.tsx — Single reason line with icon and staggered entrance.
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { colors, easing } from "../design/tokens";
import { styles } from "../design/typography";

type Tone = "stop" | "warn" | "brand";

type Props = {
  text: string;
  tone: Tone;
  /** Frame at which this line starts fading in. */
  appearFrame: number;
};

const toneColors: Record<Tone, string> = {
  stop: colors.stop,
  warn: colors.warn,
  brand: colors.brand,
};

export default function ReasonLine({ text, tone, appearFrame }: Props) {
  const frame = useCurrentFrame();

  const opacity = interpolate(
    frame,
    [appearFrame, appearFrame + 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  const translateX = interpolate(
    frame,
    [appearFrame, appearFrame + 8],
    [-8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  if (frame < appearFrame) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      {/* Dot indicator */}
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: toneColors[tone],
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: styles.reason.fontFamily,
          fontSize: styles.reason.fontSize,
          color: styles.reason.color,
          lineHeight: styles.reason.lineHeight,
        }}
      >
        {text}
      </span>
    </div>
  );
}
