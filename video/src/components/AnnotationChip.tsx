// AnnotationChip.tsx — Small colored pill that marks a line during scanning.
import { interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { colors, radii, spacing } from "../design/tokens";
import { styles } from "../design/typography";

type Tone = "brand" | "stop" | "warn";

type Props = {
  label: string;
  tone: Tone;
  /** Frame at which this chip pops in. */
  appearFrame: number;
  /** Position relative to parent. */
  position?: "right" | "inline";
};

const toneColors: Record<Tone, { bg: string; text: string; border: string }> = {
  brand: { bg: `${colors.brand}15`, text: colors.brand, border: `${colors.brand}40` },
  stop: { bg: `${colors.stop}15`, text: colors.stop, border: `${colors.stop}40` },
  warn: { bg: `${colors.warn}15`, text: colors.warn, border: `${colors.warn}40` },
};

export default function AnnotationChip({
  label,
  tone,
  appearFrame,
  position = "right",
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - appearFrame,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.8 },
  });

  const scale = interpolate(progress, [0, 1], [0.6, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  if (frame < appearFrame) return null;

  const { bg, text, border } = toneColors[tone];

  return (
    <span
      style={{
        display: "inline-block",
        padding: spacing.chipPadding,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: radii.chip,
        fontFamily: styles.chip.fontFamily,
        fontSize: styles.chip.fontSize,
        fontWeight: styles.chip.fontWeight,
        color: text,
        lineHeight: styles.chip.lineHeight,
        transform: `scale(${scale})`,
        opacity,
        whiteSpace: "nowrap",
        ...(position === "right" ? { marginLeft: "auto" } : {}),
      }}
    >
      {label}
    </span>
  );
}
