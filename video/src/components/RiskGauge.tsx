// RiskGauge.tsx — Circular risk score gauge with animated fill.
// Spring animation for the needle overshoot, then settles.
import { interpolate, useCurrentFrame, spring, useVideoConfig, Easing } from "remotion";
import { colors, radii, easing } from "../design/tokens";
import { styles } from "../design/typography";
import { BEAT } from "../story/frames";

type Props = {
  score: number; // 0-100
  label: string;
};

export default function RiskGauge({ score, label }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { from } = BEAT.verdict;

  const progress = spring({
    frame: frame - from,
    fps,
    config: { damping: 14, stiffness: 120, mass: 1 },
  });

  const displayScore = Math.round(interpolate(progress, [0, 1], [0, score]));

  const opacity = interpolate(
    frame,
    [from, from + 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const circumference = 2 * Math.PI * 38;
  const fill = interpolate(progress, [0, 1], [0, (score / 100) * circumference]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity,
      }}
    >
      <div style={{ position: "relative", width: 96, height: 96 }}>
        {/* Background circle */}
        <svg
          width={96}
          height={96}
          viewBox="0 0 96 96"
          style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
        >
          <circle
            cx={48}
            cy={48}
            r={38}
            fill="none"
            stroke={colors.line}
            strokeWidth={6}
          />
          <circle
            cx={48}
            cy={48}
            r={38}
            fill="none"
            stroke={score >= 70 ? colors.stop : score >= 40 ? colors.warn : colors.go}
            strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - fill}
            strokeLinecap="round"
          />
        </svg>
        {/* Score number */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: styles.gaugeNumber.fontFamily,
            fontSize: styles.gaugeNumber.fontSize,
            fontWeight: styles.gaugeNumber.fontWeight,
            color: styles.gaugeNumber.color,
          }}
        >
          {displayScore}
        </div>
      </div>
      <span
        style={{
          fontFamily: styles.reason.fontFamily,
          fontSize: styles.reason.fontSize,
          color: colors.inkFaint,
          textAlign: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
}
