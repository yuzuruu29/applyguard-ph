// JobDocument.tsx — The paper document protagonist.
// A styled card that follows the camera through the entire film.
// Content changes via children; entrance/exit via opacity + translateY.
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { colors, radii, spacing, easing } from "../design/tokens";
import { styles } from "../design/typography";
import { BEAT } from "../story/frames";

type Props = {
  children: React.ReactNode;
  /** Entrance frame (default: beat start). */
  enterFrame?: number;
  /** Exit frame (default: beat end). */
  exitFrame?: number;
  /** Extra width for wide documents. */
  wide?: boolean;
};

export default function JobDocument({
  children,
  enterFrame = BEAT.opportunity.from,
  exitFrame,
  wide = false,
}: Props) {
  const frame = useCurrentFrame();
  const exit = exitFrame ?? Infinity;

  const opacity = interpolate(
    frame,
    [
      enterFrame,
      enterFrame + 12,
      exit - 15,
      exit,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.standard) },
  );

  const translateY = interpolate(
    frame,
    [enterFrame, enterFrame + 12],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translateY(${translateY}px)`,
        width: wide ? 720 : 520,
        opacity,
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radii.doc,
        padding: spacing.docPadding,
        boxShadow: `0 4px 24px ${colors.ink}10`,
        fontFamily: styles.docLine.fontFamily,
      }}
    >
      {children}
    </div>
  );
}
