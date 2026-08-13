// icons/index.ts — Reusable SVG line icons for the product story.
// All icons: 24×24 base, 1.5px stroke, rounded caps/joins, forest green default.

import { colors } from "../design/tokens";

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const defaultProps: Required<IconProps> = {
  size: 24,
  color: colors.brand,
  strokeWidth: 1.5,
};

export function ScanIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

export function BuildingSearchIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="16" rx="1" />
      <line x1="6" y1="8" x2="14" y2="8" />
      <line x1="6" y1="12" x2="14" y2="12" />
      <line x1="6" y1="16" x2="10" y2="16" />
      <circle cx="18.5" cy="16.5" r="3.5" />
      <line x1="21" y1="19" x2="23" y2="21" />
    </svg>
  );
}

export function ShieldCheckIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function DocumentIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export function ChatIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  );
}

export function CalendarCheckIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="9 16 11 18 15 14" />
    </svg>
  );
}

export function BookmarkIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
    </svg>
  );
}

export function PaperPlaneIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function CalendarIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function TrophyIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7" />
      <path d="M6 2h12v4a6 6 0 01-12 0V2z" />
      <line x1="12" y1="15" x2="12" y2="18" />
      <line x1="8" y1="22" x2="16" y2="22" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  );
}

export function LinkIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function CheckIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ArrowIcon(p: IconProps = {}) {
  const { size, color, strokeWidth } = { ...defaultProps, ...p };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
