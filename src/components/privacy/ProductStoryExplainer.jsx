// ProductStoryExplainer.jsx — Orchestrator for the product story explainer.
//
// Tells the ApplyGuard PH story: suspicious listing → scan → results →
// guidance → premium → tracker → confidence. Manages the scene state
// machine, playback/pause logic, viewport and document-visibility
// detection, hover-pause for fine-pointer devices, and reduced-motion
// fallback. Follows the HeroScanNarrative pattern.
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../motion/useMotionConfig.js";
import { SCENES, SCENE_IDS } from "./productStoryScenes.js";
import ProductStoryStage from "./ProductStoryStage.jsx";
import PrivacyControls from "./PrivacyControls.jsx";

// Derive the active chapter from a scene index.
function chapterFor(index) {
  const id = SCENES[index]?.id;
  if (id === "listing" || id === "scanning") return "scan";
  if (id === "results") return "results";
  if (id === "guidance") return "guidance";
  if (id === "premium") return "premium";
  if (id === "tracker") return "tracker";
  return "general";
}

// Chapter descriptions for the aria-live region.
const CHAPTER_ANNOUNCEMENTS = {
  scan: "Scanning the job listing for suspicious signals and red flags.",
  results: "Risk score and verdict with specific reasons identified.",
  guidance: "Follow-up questions and verification steps to take next.",
  premium: "Premium AI offers deeper review, resume help, and interview prep.",
  tracker: "Save and track your applications from first look to offer.",
  general: "ApplyGuard helps you check opportunities and apply with confidence.",
};

export default function ProductStoryExplainer() {
  const reduced = useReducedMotion();

  // ── scene state ────────────────────────────────────────────────
  const [sceneIndex, setSceneIndex] = useState(reduced ? 7 : 0); // 7 = takeaway
  const sceneTimer = useRef(null);

  // ── playback control ───────────────────────────────────────────
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document !== "undefined" ? document.visibilityState !== "hidden" : true
  );
  const [isHovered, setIsHovered] = useState(false);
  const [finePointer, setFinePointer] = useState(false);

  const playing =
    !reduced &&
    !manuallyPaused &&
    isInViewport &&
    isDocumentVisible &&
    !isHovered;

  const activeChapter = chapterFor(sceneIndex);
  const currentScene = SCENES[sceneIndex];

  // ── scene timer ────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) {
      if (sceneTimer.current) {
        clearTimeout(sceneTimer.current);
        sceneTimer.current = null;
      }
      return undefined;
    }

    sceneTimer.current = setTimeout(() => {
      setSceneIndex((prev) => (prev + 1) % SCENES.length);
    }, currentScene.duration);

    return () => {
      if (sceneTimer.current) {
        clearTimeout(sceneTimer.current);
        sceneTimer.current = null;
      }
    };
  }, [sceneIndex, playing, currentScene.duration]);

  // ── viewport detection (IntersectionObserver) ──────────────────
  const sectionRef = useRef(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setIsInViewport(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── document visibility ────────────────────────────────────────
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const handleVisibility = () => {
      setIsDocumentVisible(document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── fine-pointer detection (hover-pause only on desktop) ───────
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // ── hover handlers (desktop only) ──────────────────────────────
  const onPointerEnter = useCallback(() => {
    if (finePointer) setIsHovered(true);
  }, [finePointer]);
  const onPointerLeave = useCallback(() => setIsHovered(false), []);

  // ── control handlers ───────────────────────────────────────────
  const togglePlay = useCallback(() => {
    setManuallyPaused((prev) => !prev);
  }, []);

  const replay = useCallback(() => {
    setManuallyPaused(false);
    setSceneIndex(0);
  }, []);

  const jumpTo = useCallback((sceneId) => {
    const idx = SCENE_IDS.indexOf(sceneId);
    if (idx !== -1) {
      setManuallyPaused(false);
      setSceneIndex(idx);
    }
  }, []);

  // ── cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (sceneTimer.current) clearTimeout(sceneTimer.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="scroll-reveal rounded-3xl border border-line bg-panel/50 p-6 sm:p-8"
      aria-label="How ApplyGuard helps you apply safely"
    >
      {/* ── heading ─────────────────────────────────── */}
      <p className="eyebrow">What ApplyGuard does</p>
      <h2 className="mt-2 font-display text-2xl text-ink">Check the opportunity. Apply with confidence.</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Paste a job post, spot the risks, get guidance on what to verify,
        and track every opportunity from first look to offer.
      </p>

      {/* ── animation stage ─────────────────────────── */}
      <div
        className="mt-6"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <ProductStoryStage scene={currentScene.id} reduced={reduced} />
      </div>

      {/* ── accessible scene description ─────────────── */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {CHAPTER_ANNOUNCEMENTS[activeChapter]}
      </div>

      {/* ── essential copy (always visible, outside animation) ── */}
      <div className="mt-4 text-center text-[0.7rem] text-ink-faint">
        {activeChapter === "scan" && "Suspicious job posts are scanned for red flags — right in your browser."}
        {activeChapter === "results" && "See the risk score, verdict, and specific reasons behind it."}
        {activeChapter === "guidance" && "Get follow-up questions and verification steps to take next."}
        {activeChapter === "premium" && "Premium AI goes deeper — resume tailoring, outreach help, interview prep."}
        {activeChapter === "tracker" && "Save opportunities and track them from save to offer."}
        {activeChapter === "general" && "Free to use. No account needed for the basic scan."}
      </div>

      {/* ── controls ─────────────────────────────────── */}
      {!reduced && (
        <PrivacyControls
          playing={playing}
          onTogglePlay={togglePlay}
          onReplay={replay}
          onJump={jumpTo}
          activeChapter={activeChapter}
        />
      )}
    </section>
  );
}
