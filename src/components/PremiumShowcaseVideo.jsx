// PremiumShowcaseVideo.jsx — player for the Remotion Premium showcase.
//
// The film is a silent, 58-second tour of the five Premium AI features with
// the voice mock interview as the hero beat, rendered by
// video/src/compositions/PremiumShowcase.tsx. Same contract as
// HowItWorksVideo: click-to-play so the ~4 MB asset never downloads for
// someone merely scrolling the pricing page, a visible feature list as the
// text alternative, and an IntersectionObserver that only ever pauses.

import { useEffect, useRef, useState } from "react";

// Mirrors video/src/premium/script.ts, which is the source of truth for the
// film itself. Kept as plain data here so the web build never has to reach
// into the Remotion project.
const CHAPTERS = [
  "AI message generator — the first reply, written with you",
  "Deep scam analysis + background check — verify who's hiring",
  "Resume tailoring — your resume, in the post's own words",
  "Voice mock interview — practice live with an AI hiring manager",
  "Honest pricing — one-time payments, 7-day free preview",
];

const SUMMARY =
  "A silent tour of ApplyGuard Premium, following one real application. The AI message generator drafts " +
  "a first reply that references the job post's own tools and hours. Deep scam analysis verifies the " +
  "employer — an active business registration and market-rate pay, with one caution to ask about. Resume " +
  "tailoring rewrites a generic bullet into the post's own words. Then the voice mock interview: an AI " +
  "hiring manager asks questions out loud, listens to the spoken answer, and pushes back with coaching. " +
  "Premium is ₱299 for 30 days or ₱2,990 for a year — one-time payments that never auto-renew, with a " +
  "7-day free preview and 60 AI uses a month. Posts are processed in memory and never stored.";

const SOURCES = {
  desktop: {
    src: "/video/premium-showcase-desktop.mp4",
    poster: "/video/premium-showcase-poster-desktop.jpeg",
    width: 1600,
    height: 900,
  },
  mobile: {
    src: "/video/premium-showcase-mobile.mp4",
    poster: "/video/premium-showcase-poster-mobile.jpeg",
    width: 1080,
    height: 1350,
  },
};

export default function PremiumShowcaseVideo() {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [started, setStarted] = useState(false);

  const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 768;
  const { src, poster, width, height } = isMobileViewport ? SOURCES.mobile : SOURCES.desktop;

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
      aria-label="See what Premium adds"
      className="glass-subtle overflow-hidden rounded-2xl"
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
              alt="ApplyGuard Premium drafts an application message, verifies the employer, tailors a resume bullet, and runs a voice mock interview with an AI hiring manager."
              className="w-full"
              loading="lazy"
              width={width}
              height={height}
            />
            <button
              type="button"
              onClick={() => setStarted(true)}
              aria-label="Play the Premium showcase"
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/40 transition-colors duration-300 hover:bg-paper/20 focus-visible:outline-none"
            >
              <span className="btn-gradient flex h-16 w-16 items-center justify-center rounded-full text-paper shadow-lg transition-transform duration-300 group-hover:scale-110">
                <svg className="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
                </svg>
              </span>
              <span className="rounded-full bg-paper/70 px-3 py-1 text-xs font-medium text-ink">
                Watch the 58-second showcase
              </span>
            </button>
          </>
        )}
      </div>

      {/* Text alternative for a silent film — and a skimmable outline. */}
      <div className="border-t border-line/60 p-5 sm:p-6">
        <p className="eyebrow mb-3">What the showcase covers</p>
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
        <p className="sr-only">See what Premium adds. {SUMMARY}</p>
      </div>
    </section>
  );
}
