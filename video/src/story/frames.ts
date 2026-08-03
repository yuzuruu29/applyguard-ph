// frames.ts — Central frame map for the ApplyGuard product story.
// All scene boundaries live here. Components reference these ranges.

export const FPS = 30;
export const DURATION = 630; // 21 seconds

export const BEAT = {
  /** Opportunity appears */
  opportunity: { from: 0, to: 60 },
  /** Listing is scanned and annotated */
  scan: { from: 60, to: 150 },
  /** Risk score, verdict, and evidence */
  verdict: { from: 150, to: 240 },
  /** Company and contact review */
  companyReview: { from: 240, to: 300 },
  /** Verification guidance */
  guidance: { from: 300, to: 360 },
  /** Resume, outreach, and interview assistance */
  assistance: { from: 360, to: 480 },
  /** Application tracker progression */
  tracker: { from: 480, to: 570 },
  /** Closing message and CTA */
  closing: { from: 570, to: 630 },
} as const;

/** Total number of beats. */
export const BEAT_COUNT = Object.keys(BEAT).length;

/** Duration of a beat in frames. */
export function beatDuration(beat: keyof typeof BEAT): number {
  return BEAT[beat].to - BEAT[beat].from;
}

/** Check if a frame falls within a beat. */
export function isDuringBeat(frame: number, beat: keyof typeof BEAT): boolean {
  return frame >= BEAT[beat].from && frame < BEAT[beat].to;
}

/** Clamp frame to the valid range. */
export function clampFrame(frame: number): number {
  return Math.max(0, Math.min(DURATION - 1, frame));
}
