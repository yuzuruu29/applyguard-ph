// HowItWorksVideo.jsx — player for the Remotion instructional walkthrough.
//
// The film is a silent, 68-second, twelve-chapter tutorial rendered by
// video/src/compositions/HowItWorks.tsx. Two deliberate choices:
//
//   1. Click-to-play, not autoplay-in-view. The asset is ~4 MB; auto-fetching
//      it for anyone who merely scrolls past would cost more bandwidth than
//      the entire rest of the page. `preload="metadata"` means the bytes only
//      move once someone opts in.
//   2. The chapter list is visible, not sr-only. The film has no narration, so
//      it needs a text alternative anyway — and a numbered outline is more
//      useful to a sighted skimmer than to anyone else.
//
// The IntersectionObserver only pauses playback that is already running, so a
// video never keeps going off-screen.

import { useEffect, useRef, useState } from "react";

// Mirrors the chapter titles in video/src/howto/script.ts, which is the source
// of truth for the film itself. Kept as plain data here so the web build never
// has to reach into the Remotion project.
const CHAPTERS = [
  "Paste the job post",
  "Add your details",
  "Read the verdict",
  "See why the score landed there",
  "Review the scam signals",
  "Ask what the post left out",
  "Copy the prompt, not the message",
  "Background-check the link",
  "Track every application",
  "Your data stays yours",
];

const SUMMARY =
  "A silent walkthrough of the whole tool. A suspicious Marketing Coordinator listing is pasted in, " +
  "and ApplyGuard flags off-platform contact and an upfront onboarding fee. The verdict comes back Skip " +
  "with a high risk score, and a fit score of 15 out of 100 — one hard flag caps the score regardless of " +
  "the rest. The film then walks through the four-part score breakdown, the hard and soft scam signals, " +
  "the questions the post left unanswered, copying the generated prompt into your own AI, background-checking " +
  "the company link (a high-risk .tk domain scoring 24 out of 100), verifying the business through SEC or DTI, " +
  "tracking the application from Saved to Offer, and where your data lives: in your browser, exportable and " +
  "erasable at any time.";

const SOURCES = {
  desktop: { src: "/video/how-it-works-desktop.mp4", poster: "/video/how-it-works-poster-desktop.jpeg" },
  mobile: { src: "/video/how-it-works-mobile.mp4", poster: "/video/how-it-works-poster-mobile.jpeg" },
};

export default function HowItWorksVideo() {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [started, setStarted] = useState(false);

  const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 768;
  const { src, poster } = isMobileViewport ? SOURCES.mobile : SOURCES.desktop;

  // Pause when scrolled away; never resume on its own, since playback is
  // something the viewer explicitly started.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) videoRef.current?.pause();
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Play from an effect rather than the click handler: the <video> does not
  // exist until the state change commits, so the ref is still null inside the
  // handler itself.
  useEffect(() => {
    if (!started) return;
    const p = videoRef.current?.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, [started]);

  return (
    <section
      ref={sectionRef}
      aria-label="How ApplyGuard helps you apply safely"
      className="glass-subtle mx-auto max-w-3xl overflow-hidden rounded-2xl"
    >
      <div className="relative">
        {started ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            muted
            loop
            controls
            playsInline
            preload="metadata"
            className="w-full"
          />
        ) : (
          <>
            <img
              src={poster}
              alt="ApplyGuard scans a suspicious job listing, shows a Skip verdict with a fit score of 15 out of 100, and walks through the checks behind it."
              className="w-full"
              loading="lazy"
              width={1600}
              height={900}
            />
            <button
              type="button"
              onClick={() => setStarted(true)}
              aria-label="Play the how-it-works walkthrough"
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/40 transition-colors duration-300 hover:bg-paper/20 focus-visible:outline-none"
            >
              <span className="btn-gradient flex h-16 w-16 items-center justify-center rounded-full text-paper shadow-lg transition-transform duration-300 group-hover:scale-110">
                <svg className="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
                </svg>
              </span>
              <span className="rounded-full bg-paper/70 px-3 py-1 text-xs font-medium text-ink">
                Watch the 68-second walkthrough
              </span>
            </button>
          </>
        )}
      </div>

      {/* Text alternative for a silent film — and a skimmable outline. */}
      <div className="border-t border-line/60 p-5 sm:p-6">
        <p className="eyebrow mb-3">What the walkthrough covers</p>
        <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {CHAPTERS.map((title, i) => (
            <li key={title} className="flex items-baseline gap-2.5 text-sm text-ink-soft">
              <span className="font-mono text-xs text-brand-lift">
                {String(i + 1).padStart(2, "0")}
              </span>
              {title}
            </li>
          ))}
        </ol>
        <p className="sr-only">
          How ApplyGuard helps you apply safely. {SUMMARY}
        </p>
      </div>
    </section>
  );
}
