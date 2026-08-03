// ScanViewport.tsx — The scanning overlay with animated scan line.
// Sits on top of the JobDocument during the scan beat.
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { colors, radii, easing } from "../design/tokens";
import { BEAT } from "../story/frames";

type Props = {
  children: React.ReactNode;
};

export default function ScanViewport({ children }: Props) {
  const frame = useCurrentFrame();
  const { from, to } = BEAT.scan;

  // Scan line sweeps top-to-bottom over the beat
  const scanProgress = interpolate(
    frame,
    [from + 10, to - 5],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.standard) },
  );

  // Viewport fades in at beat start, fades out at beat end
  const opacity = interpolate(
    frame,
    [from, from + 8, to - 10, to],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        opacity,
      }}
    >
      {/* Content (listing lines) */}
      <div style={{ position: "relative" }}>
        {children}
      </div>

      {/* Scan line */}
      {frame >= from + 10 && frame <= to - 5 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${scanProgress * 100}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${colors.brand}80, ${colors.brand}, ${colors.brand}80, transparent)`,
            boxShadow: `0 0 12px ${colors.brand}40`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Scan viewport border */}
      <div
        style={{
          position: "absolute",
          inset: -4,
          border: `1.5px solid ${colors.brand}30`,
          borderRadius: radii.chip,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
