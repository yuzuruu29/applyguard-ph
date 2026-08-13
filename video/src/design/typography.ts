// typography.ts — Shared text style objects for Remotion compositions.
import { colors, fonts, fontSizes } from "./tokens";

export const styles = {
  docTitle: {
    fontFamily: fonts.display,
    fontSize: fontSizes.docTitle,
    fontWeight: 700,
    color: colors.ink,
    lineHeight: 1.2,
  },
  docLine: {
    fontFamily: fonts.body,
    fontSize: fontSizes.docLine,
    color: colors.inkSoft,
    lineHeight: 1.4,
  },
  gaugeNumber: {
    fontFamily: fonts.mono,
    fontSize: fontSizes.gauge,
    fontWeight: 700,
    color: colors.ink,
  },
  stamp: {
    fontFamily: fonts.body,
    fontSize: fontSizes.stamp,
    fontWeight: 700,
    letterSpacing: "0.05em",
  },
  reason: {
    fontFamily: fonts.body,
    fontSize: fontSizes.reason,
    color: colors.inkSoft,
    lineHeight: 1.4,
  },
  chip: {
    fontFamily: fonts.body,
    fontSize: fontSizes.chip,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  panelHeader: {
    fontFamily: fonts.display,
    fontSize: fontSizes.panelHeader,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  panelLine: {
    fontFamily: fonts.body,
    fontSize: fontSizes.panelLine,
    color: colors.inkSoft,
    lineHeight: 1.5,
  },
  closing: {
    fontFamily: fonts.display,
    fontSize: fontSizes.closing,
    fontWeight: 700,
    color: colors.ink,
    lineHeight: 1.2,
  },
  closingSub: {
    fontFamily: fonts.body,
    fontSize: fontSizes.closingSub,
    color: colors.inkSoft,
    lineHeight: 1.5,
  },
  closingSmall: {
    fontFamily: fonts.body,
    fontSize: fontSizes.closingSmall,
    color: colors.inkFaint,
    lineHeight: 1.5,
  },
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: fontSizes.eyebrow,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: colors.inkFaint,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: fontSizes.wordmark,
    fontWeight: 700,
    color: colors.brand,
  },
} as const;
