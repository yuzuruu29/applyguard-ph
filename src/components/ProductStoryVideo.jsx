// ProductStoryVideo.jsx — Responsive <video> component for the Remotion product story.
//
// Renders the pre-rendered MP4/WebM video with:
// - Reduced-motion fallback (poster image + optional play button)
// - IntersectionObserver pause/resume when off-screen
// - matchMedia for desktop vs mobile asset selection
// - Accessible text summary for screen readers
// - Autoplay with muted loop

import { useEffect, useRef, useState } from "react";

export default function ProductStoryVideo() {
  const videoRef = useRef(null);
  const sectionRef = useRef(null);
  const [isInView, setIsInView] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Evaluate browser APIs at render time (not module level) so mocks work in tests
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const isMobileViewport =
    typeof window !== "undefined" && window.innerWidth < 768;

  // ── IntersectionObserver: pause when off-screen ──
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── Play/pause based on visibility ──
  useEffect(() => {
    const v = videoRef.current;
    if (!v || prefersReducedMotion) return;

    if (isInView) {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      v.pause();
    }
  }, [isInView, prefersReducedMotion]);

  // ── Handle play button for reduced-motion users ──
  const handlePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    setHasPlayed(true);
  };

  // ── Select asset based on viewport ──
  const desktopSrc = "/video/desktop.mp4";
  const mobileSrc = "/video/mobile.mp4";
  const desktopPoster = "/video/poster-desktop.webp";
  const mobilePoster = "/video/poster-mobile.webp";

  const poster = isMobileViewport ? mobilePoster : desktopPoster;
  const mp4Src = isMobileViewport ? mobileSrc : desktopSrc;

  // ── Reduced-motion: show poster with play button ──
  if (prefersReducedMotion && !hasPlayed) {
    return (
      <section
        ref={sectionRef}
        aria-label="How ApplyGuard helps you apply safely"
        className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-card shadow-lg shadow-ink/5"
      >
        <img
          src={poster}
          alt="ApplyGuard scans a suspicious job listing, shows a risk score, and guides you through verification steps."
          className="w-full"
          loading="lazy"
        />
        <button
          type="button"
          onClick={handlePlay}
          aria-label="Play product story video"
          className="absolute inset-0 flex items-center justify-center bg-ink/10 transition-colors hover:bg-ink/20 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
            </svg>
          </span>
        </button>

        {/* Accessible text summary — always present for screen readers */}
        <div className="sr-only">
          <h3>How ApplyGuard helps you apply safely</h3>
          <p>
            A suspicious job listing appears. ApplyGuard scans it and highlights
            risks including off-platform contact and upfront fees. A risk score of
            72 out of 100 is shown with a high-risk verdict. The tool reviews the
            company and contact details, noting missing registration information
            and suggesting verification through SEC or DTI. Guidance steps are
            provided: ask for the registered legal name, verify through SEC or DTI,
            request written terms, and confirm through an official channel. Premium
            features include tailored resume assistance, outreach message drafting,
            and interview preparation. The opportunity is saved to an application
            tracker. Free scan runs in your browser. Premium requests are
            server-protected.
          </p>
        </div>
      </section>
    );
  }

  // ── Normal: video with autoplay ──
  return (
    <section
      ref={sectionRef}
      aria-label="How ApplyGuard helps you apply safely"
      className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-card shadow-lg shadow-ink/5"
    >
      <video
        ref={videoRef}
        src={mp4Src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full"
      >
        <source src={mp4Src} type="video/mp4" />
        <source
          src={isMobileViewport ? "/video/mobile.webm" : "/video/desktop.webm"}
          type="video/webm"
        />
      </video>

      {/* Accessible text summary — always present for screen readers */}
      <div className="sr-only">
        <h3>How ApplyGuard helps you apply safely</h3>
        <p>
          A suspicious job listing appears. ApplyGuard scans it and highlights
          risks including off-platform contact and upfront fees. A risk score of
          72 out of 100 is shown with a high-risk verdict. The tool reviews the
          company and contact details, noting missing registration information
          and suggesting verification through SEC or DTI. Guidance steps are
          provided: ask for the registered legal name, verify through SEC or DTI,
          request written terms, and confirm through an official channel. Premium
          features include tailored resume assistance, outreach message drafting,
          and interview preparation. The opportunity is saved to an application
          tracker. Free scan runs in your browser. Premium requests are
          server-protected.
        </p>
      </div>
    </section>
  );
}
