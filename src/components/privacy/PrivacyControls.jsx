// PrivacyControls.jsx — Play/pause, replay, and chapter selectors.
//
// All controls are native <button> elements for keyboard accessibility.
// aria-pressed exposes play/pause state. Chapter buttons show which
// segment is active. Hidden entirely under reduced motion.
import { CHAPTER_STARTS } from "./productStoryScenes.js";

const chapters = [
  { key: "scan", label: "Scan", startScene: CHAPTER_STARTS.scan },
  { key: "results", label: "Results", startScene: CHAPTER_STARTS.results },
  { key: "guidance", label: "Guidance", startScene: CHAPTER_STARTS.guidance },
  { key: "premium", label: "Premium", startScene: CHAPTER_STARTS.premium },
  { key: "tracker", label: "Tracker", startScene: CHAPTER_STARTS.tracker },
];

export default function PrivacyControls({
  playing,
  onTogglePlay,
  onReplay,
  onJump,
  activeChapter,
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-pressed={playing}
        aria-label={playing ? "Pause animation" : "Play animation"}
        className="glass-subtle inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-ink transition-colors hover:border-brand/40 hover:text-brand-lift focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
      >
        {playing ? (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
          </svg>
        )}
        {playing ? "Pause" : "Play"}
      </button>

      <button
        type="button"
        onClick={onReplay}
        aria-label="Replay animation"
        className="glass-subtle inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-ink transition-colors hover:border-brand/40 hover:text-brand-lift focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 119 9" />
          <polyline points="3 21 3 12 12 12" />
        </svg>
        Replay
      </button>

      <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />

      {chapters.map((ch) => (
        <button
          key={ch.key}
          type="button"
          onClick={() => onJump(ch.startScene)}
          aria-current={activeChapter === ch.key ? "true" : undefined}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
            activeChapter === ch.key
              ? ch.key === "premium"
                ? "border-warn/50 bg-warn-soft text-warn-ink"
                : ch.key === "tracker"
                  ? "border-brand/50 bg-brand/10 text-brand"
                  : "border-brand/50 bg-go-soft text-brand"
              : "glass-subtle text-ink-soft hover:border-brand/40 hover:text-ink"
          }`}
        >
          {ch.label}
        </button>
      ))}
    </div>
  );
}
