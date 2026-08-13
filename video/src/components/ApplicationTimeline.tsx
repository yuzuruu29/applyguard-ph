// ApplicationTimeline.tsx — Animated tracker with timeline progression for beat 7.
import { interpolate, useCurrentFrame, spring, useVideoConfig, Easing } from "remotion";
import { colors, radii, spacing, easing } from "../design/tokens";
import { styles } from "../design/typography";
import { TRACKER_STAGES } from "../story/content";
import { BEAT } from "../story/frames";
import { BookmarkIcon, PaperPlaneIcon, CalendarIcon, TrophyIcon } from "../icons";

const iconMap = {
  bookmark: BookmarkIcon,
  paperPlane: PaperPlaneIcon,
  calendar: CalendarIcon,
  trophy: TrophyIcon,
};

export default function ApplicationTimeline() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { from } = BEAT.tracker;
  const localFrame = frame - from;

  // Each stage activates at a staggered interval
  const stageInterval = 18;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: styles.panelHeader.fontFamily,
          fontSize: styles.panelHeader.fontSize,
          fontWeight: styles.panelHeader.fontWeight,
          color: colors.brand,
          marginBottom: 20,
          opacity: interpolate(localFrame, [0, 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Application Tracker
      </div>

      {/* Timeline */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {TRACKER_STAGES.map((stage, i) => {
          const stageFrame = from + 10 + i * stageInterval;
          const isActive = frame >= stageFrame;

          const nodeProgress = spring({
            frame: frame - stageFrame,
            fps,
            config: { damping: 10, stiffness: 200, mass: 0.7 },
          });

          const nodeScale = interpolate(nodeProgress, [0, 1], [0.3, 1]);
          const nodeOpacity = interpolate(nodeProgress, [0, 0.5], [0, 1], {
            extrapolateRight: "clamp",
          });

          const Icon = iconMap[stage.icon];
          const isLast = i === TRACKER_STAGES.length - 1;

          return (
            <div key={stage.key} style={{ display: "flex", alignItems: "flex-start" }}>
              {/* Node */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 80,
                  opacity: nodeOpacity,
                  transform: `scale(${nodeScale})`,
                }}
              >
                {/* Circle */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: isActive ? colors.brand : colors.panel,
                    border: `2px solid ${isActive ? colors.brand : colors.line}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    size={18}
                    color={isActive ? colors.white : colors.inkFaint}
                  />
                </div>
                {/* Label */}
                <span
                  style={{
                    marginTop: 6,
                    fontFamily: styles.chip.fontFamily,
                    fontSize: styles.chip.fontSize,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? colors.brand : colors.inkFaint,
                    textAlign: "center",
                  }}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    width: 40,
                    height: 2,
                    background: frame >= stageFrame + stageInterval
                      ? colors.brand
                      : colors.line,
                    marginTop: 19,
                    transition: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
