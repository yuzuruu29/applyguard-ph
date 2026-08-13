// ProductStory.tsx — Main composition orchestrating all 8 beats.
// Single continuous film: listing → scan → verdict → company review →
// guidance → assistance → tracker → closing.
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing } from "remotion";
import { BEAT } from "../story/frames";
import { LISTING, ANNOTATIONS, RISK_RESULTS } from "../story/content";
import { colors, fonts, easing } from "../design/tokens";
import { styles } from "../design/typography";

import Background from "../components/Background";
import JobDocument from "../components/JobDocument";
import ScanViewport from "../components/ScanViewport";
import AnnotationChip from "../components/AnnotationChip";
import RiskGauge from "../components/RiskGauge";
import VerdictStamp from "../components/VerdictStamp";
import ReasonLine from "../components/ReasonLine";
import CompanyReview from "../components/CompanyReview";
import GuidancePanel from "../components/GuidancePanel";
import AssistanceDocuments from "../components/AssistanceDocuments";
import ApplicationTimeline from "../components/ApplicationTimeline";
import ClosingFrame from "../components/ClosingFrame";

type Props = {
  isMobile?: boolean;
};

function DocumentListing() {
  const frame = useCurrentFrame();
  const { from } = BEAT.opportunity;

  return (
    <JobDocument enterFrame={from} exitFrame={BEAT.scan.to}>
      {/* Title */}
      <div
        style={{
          fontFamily: styles.docTitle.fontFamily,
          fontSize: styles.docTitle.fontSize,
          fontWeight: styles.docTitle.fontWeight,
          color: styles.docTitle.color,
          lineHeight: styles.docTitle.lineHeight,
          marginBottom: 6,
          opacity: interpolate(frame, [from + 5, from + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {LISTING.title}
      </div>

      {/* Company name */}
      <div
        style={{
          fontFamily: styles.docLine.fontFamily,
          fontSize: styles.docLine.fontSize - 2,
          color: colors.inkFaint,
          marginBottom: 12,
          opacity: interpolate(frame, [from + 10, from + 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {LISTING.company}
      </div>

      {/* Listing lines */}
      <ScanViewport>
        {LISTING.lines.map((line, i) => {
          const lineAppear = from + 8 + i * 4;
          const lineOpacity = interpolate(
            frame,
            [lineAppear, lineAppear + 6],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );

          // Find annotation for this line
          const annotation = ANNOTATIONS.find((a) => a.lineId === line.id);
          const chipFrame = annotation
            ? BEAT.scan.from + 15 + ANNOTATIONS.indexOf(annotation) * 12
            : -1;

          return (
            <div
              key={line.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "5px 0",
                borderBottom: `1px solid ${colors.line}40`,
                opacity: lineOpacity,
              }}
            >
              <span
                style={{
                  fontFamily: styles.docLine.fontFamily,
                  fontSize: styles.docLine.fontSize,
                  color:
                    line.tone === "stop"
                      ? colors.stop
                      : line.tone === "warn"
                        ? colors.warn
                        : styles.docLine.color,
                  lineHeight: styles.docLine.lineHeight,
                  flex: 1,
                }}
              >
                {line.text}
              </span>
              {annotation && (
                <AnnotationChip
                  label={annotation.label}
                  tone={annotation.tone}
                  appearFrame={chipFrame}
                />
              )}
            </div>
          );
        })}
      </ScanViewport>
    </JobDocument>
  );
}

function VerdictBeat() {
  const frame = useCurrentFrame();
  const { from, to } = BEAT.verdict;

  const opacity = interpolate(
    frame,
    [from, from + 8, to - 10, to],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Centered gauge */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <RiskGauge score={72} label="Risk score" />
      </div>

      {/* Stamp */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "62%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <VerdictStamp text="High Risk" tone="stop" />
      </div>

      {/* Reason lines */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "74%",
          transform: "translate(-50%, 0)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {RISK_RESULTS.map((r, i) => (
          <ReasonLine
            key={i}
            text={r.label}
            tone={r.tone}
            appearFrame={from + 35 + i * 10}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}

export default function ProductStory({ isMobile = false }: Props) {
  return (
    <AbsoluteFill
      style={{
        fontFamily: fonts.body,
        background: colors.paper,
      }}
    >
      <Background />

      {/* Beat 1-2: Listing document with scan overlay */}
      <Sequence from={BEAT.opportunity.from} durationInFrames={BEAT.scan.to - BEAT.opportunity.from}>
        <DocumentListing />
      </Sequence>

      {/* Beat 3: Verdict */}
      <Sequence from={BEAT.verdict.from} durationInFrames={BEAT.verdict.to - BEAT.verdict.from}>
        <VerdictBeat />
      </Sequence>

      {/* Beat 4: Company Review */}
      <Sequence from={BEAT.companyReview.from} durationInFrames={BEAT.companyReview.to - BEAT.companyReview.from}>
        <CompanyReview />
      </Sequence>

      {/* Beat 5: Guidance */}
      <Sequence from={BEAT.guidance.from} durationInFrames={BEAT.guidance.to - BEAT.guidance.from}>
        <GuidancePanel />
      </Sequence>

      {/* Beat 6: Assistance documents */}
      <Sequence from={BEAT.assistance.from} durationInFrames={BEAT.assistance.to - BEAT.assistance.from}>
        <AssistanceDocuments />
      </Sequence>

      {/* Beat 7: Tracker */}
      <Sequence from={BEAT.tracker.from} durationInFrames={BEAT.tracker.to - BEAT.tracker.from}>
        <ApplicationTimeline />
      </Sequence>

      {/* Beat 8: Closing */}
      <Sequence from={BEAT.closing.from} durationInFrames={BEAT.closing.to - BEAT.closing.from}>
        <ClosingFrame />
      </Sequence>
    </AbsoluteFill>
  );
}
