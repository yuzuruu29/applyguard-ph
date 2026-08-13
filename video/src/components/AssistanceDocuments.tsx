// AssistanceDocuments.tsx — Resume, outreach, and interview prep documents for beat 6.
// Uses match-cut transitions: same card shape, content cross-fades.
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { colors, radii, spacing, easing } from "../design/tokens";
import { styles } from "../design/typography";
import { RESUME_CONTENT, OUTREACH_CONTENT, INTERVIEW_CONTENT } from "../story/content";
import { BEAT } from "../story/frames";

// Each sub-beat within the assistance beat
const PHASES = [
  { start: 0, end: 40, label: "resume" },
  { start: 40, end: 80, label: "outreach" },
  { start: 80, end: 120, label: "interview" },
] as const;

function ResumeView({ opacity }: { opacity: number }) {
  return (
    <div style={{ opacity }}>
      <div
        style={{
          fontFamily: styles.panelHeader.fontFamily,
          fontSize: styles.panelHeader.fontSize - 2,
          fontWeight: styles.panelHeader.fontWeight,
          color: colors.brand,
          marginBottom: 10,
          borderBottom: `1px solid ${colors.line}`,
          paddingBottom: 6,
        }}
      >
        {RESUME_CONTENT.header}
      </div>
      {RESUME_CONTENT.lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: styles.panelLine.fontFamily,
            fontSize: styles.panelLine.fontSize,
            color: colors.inkSoft,
            lineHeight: 1.6,
            paddingLeft: 12,
            borderLeft: `2px solid ${colors.brand}30`,
            marginBottom: 6,
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}

function OutreachView({ opacity }: { opacity: number }) {
  return (
    <div style={{ opacity }}>
      <div
        style={{
          fontFamily: styles.panelHeader.fontFamily,
          fontSize: styles.panelHeader.fontSize - 2,
          fontWeight: styles.panelHeader.fontWeight,
          color: colors.ink,
          marginBottom: 10,
          borderBottom: `1px solid ${colors.line}`,
          paddingBottom: 6,
        }}
      >
        {OUTREACH_CONTENT.subject}
      </div>
      {OUTREACH_CONTENT.body.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: styles.panelLine.fontFamily,
            fontSize: styles.panelLine.fontSize - 1,
            color: line === "" ? "transparent" : colors.inkSoft,
            lineHeight: 1.5,
            whiteSpace: "pre",
          }}
        >
          {line || "\u00A0"}
        </div>
      ))}
    </div>
  );
}

function InterviewView({ opacity }: { opacity: number }) {
  return (
    <div style={{ opacity }}>
      <div
        style={{
          fontFamily: styles.panelHeader.fontFamily,
          fontSize: styles.panelHeader.fontSize - 2,
          fontWeight: styles.panelHeader.fontWeight,
          color: colors.ink,
          marginBottom: 10,
          borderBottom: `1px solid ${colors.line}`,
          paddingBottom: 6,
        }}
      >
        {INTERVIEW_CONTENT.header}
      </div>
      {INTERVIEW_CONTENT.lines.map((line, i) => {
        const lineFrame = i * 4;
        return (
          <div
            key={i}
            style={{
              fontFamily: styles.panelLine.fontFamily,
              fontSize: styles.panelLine.fontSize,
              color: colors.inkSoft,
              lineHeight: 1.6,
              paddingLeft: 12,
              borderLeft: `2px solid ${colors.warn}30`,
              marginBottom: 6,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
}

export default function AssistanceDocuments() {
  const frame = useCurrentFrame();
  const { from } = BEAT.assistance;
  const localFrame = frame - from;

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
        padding: spacing.panelPadding + 4,
        width: 440,
        minHeight: 260,
        boxShadow: `0 4px 20px ${colors.ink}10`,
      }}
    >
      {/* Resume phase */}
      {localFrame < PHASES[0].end + 5 && (
        <ResumeView
          opacity={interpolate(
            localFrame,
            [0, 8, PHASES[0].end - 5, PHASES[0].end],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}
        />
      )}

      {/* Outreach phase */}
      {localFrame >= PHASES[1].start - 5 && localFrame < PHASES[1].end + 5 && (
        <OutreachView
          opacity={interpolate(
            localFrame,
            [PHASES[1].start, PHASES[1].start + 8, PHASES[1].end - 5, PHASES[1].end],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}
        />
      )}

      {/* Interview phase */}
      {localFrame >= PHASES[2].start - 5 && (
        <InterviewView
          opacity={interpolate(
            localFrame,
            [PHASES[2].start, PHASES[2].start + 8, PHASES[2].end - 5, PHASES[2].end],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}
        />
      )}
    </div>
  );
}
