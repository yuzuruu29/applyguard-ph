// CompanyReview.tsx — Company and contact review panels for beat 4.
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { colors, radii, spacing, easing } from "../design/tokens";
import { styles } from "../design/typography";
import { COMPANY_REVIEW } from "../story/content";
import { BEAT } from "../story/frames";
import { BuildingSearchIcon, LinkIcon } from "../icons";

type PanelProps = {
  title: string;
  findings: string[];
  action: string;
  icon: React.ReactNode;
  opacity: number;
  translateX: number;
};

function Panel({ title, findings, action, icon, opacity, translateX }: PanelProps) {
  return (
    <div
      style={{
        background: colors.card,
        border: `1px solid ${colors.line}`,
        borderRadius: radii.panel,
        padding: spacing.panelPadding,
        width: 300,
        opacity,
        transform: `translateX(${translateX}px)`,
        boxShadow: `0 2px 12px ${colors.ink}08`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {icon}
        <span
          style={{
            fontFamily: styles.panelHeader.fontFamily,
            fontSize: styles.panelHeader.fontSize,
            fontWeight: styles.panelHeader.fontWeight,
            color: colors.ink,
          }}
        >
          {title}
        </span>
      </div>
      {findings.map((f, i) => (
        <div
          key={i}
          style={{
            fontFamily: styles.panelLine.fontFamily,
            fontSize: styles.panelLine.fontSize,
            color: styles.panelLine.color,
            lineHeight: styles.panelLine.lineHeight,
            marginBottom: 4,
            paddingLeft: 8,
            borderLeft: `2px solid ${colors.warn}40`,
          }}
        >
          {f}
        </div>
      ))}
      <div
        style={{
          marginTop: 10,
          fontFamily: styles.panelLine.fontFamily,
          fontSize: styles.panelLine.fontSize - 1,
          color: colors.brand,
          fontWeight: 600,
        }}
      >
        → {action}
      </div>
    </div>
  );
}

export default function CompanyReview() {
  const frame = useCurrentFrame();
  const { from } = BEAT.companyReview;

  const leftOpacity = interpolate(
    frame,
    [from, from + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  const rightOpacity = interpolate(
    frame,
    [from + 8, from + 18],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  const leftX = interpolate(
    frame,
    [from, from + 10],
    [-20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  const rightX = interpolate(
    frame,
    [from + 8, from + 18],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(...easing.enter) },
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <Panel
        title={COMPANY_REVIEW.company.name}
        findings={COMPANY_REVIEW.company.findings}
        action={COMPANY_REVIEW.company.action}
        icon={<BuildingSearchIcon size={20} />}
        opacity={leftOpacity}
        translateX={leftX}
      />
      <Panel
        title={COMPANY_REVIEW.contact.name}
        findings={COMPANY_REVIEW.contact.findings}
        action={COMPANY_REVIEW.contact.action}
        icon={<LinkIcon size={20} />}
        opacity={rightOpacity}
        translateX={rightX}
      />
    </div>
  );
}
