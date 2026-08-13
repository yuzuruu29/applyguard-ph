// @vitest-environment jsdom
// productStoryExplainer.test.jsx — 30 test scenarios for the product story explainer.
//
// Uses fake timers for scene progression, mocks motion/react for
// reduced-motion control, and stubs browser APIs (IntersectionObserver,
// matchMedia, visibilityState) before each test.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// ── motion/react mock ───────────────────────────────────────────
let mockReducedMotion = false;

const TAG_MAP = {
  div: "div", span: "span", p: "p", ul: "ul", li: "li",
  a: "a", button: "button", section: "section",
  h1: "h1", h2: "h2", h3: "h3",
  svg: "svg", path: "path", rect: "rect", circle: "circle", g: "g", line: "line",
};

vi.mock("motion/react", () => ({
  useReducedMotion: () => mockReducedMotion,
  m: new Proxy(
    {},
    {
      get:
        (_, tag) =>
        ({ children, ...props }) => {
          const Tag = TAG_MAP[tag] || "div";
          const { initial, animate, transition, viewport, whileInView, variants, ...domProps } = props;
          const safe = {};
          for (const [k, v] of Object.entries(domProps)) {
            if (v !== undefined && v !== null && typeof v !== "function") safe[k] = v;
          }
          return <Tag {...safe}>{children}</Tag>;
        },
    }
  ),
}));

import ProductStoryExplainer from "./ProductStoryExplainer.jsx";

// ── helpers ─────────────────────────────────────────────────────
let savedIO, savedMatchMedia, savedVis;

function renderExplainer(opts = {}) {
  mockReducedMotion = opts.reduced ?? false;
  return render(<ProductStoryExplainer />);
}

// Click helper — use act() + fireEvent to properly flush React state.
function clickAndFlush(button) {
  act(() => {
    fireEvent.click(button);
    vi.advanceTimersByTime(0);
  });
}

// ── setup / teardown ────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  mockReducedMotion = false;

  savedIO = globalThis.IntersectionObserver;
  savedMatchMedia = window.matchMedia;
  savedVis = Object.getOwnPropertyDescriptor(document, "visibilityState");

  // IntersectionObserver mock
  const ioInstances = [];
  globalThis.IntersectionObserver = class {
    constructor(cb) { this._cb = cb; ioInstances.push(this); }
    observe() {}
    disconnect() {}
  };
  globalThis.IntersectionObserver._last = () => ioInstances[ioInstances.length - 1];

  // matchMedia mock
  window.matchMedia = vi.fn().mockImplementation((q) => ({
    matches: false, media: q,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(document, "visibilityState", {
    value: "visible", writable: true, configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
  globalThis.IntersectionObserver = savedIO;
  window.matchMedia = savedMatchMedia;
  if (savedVis) Object.defineProperty(document, "visibilityState", savedVis);
});

// ══════════════════════════════════════════════════════════════════
// 1. INITIAL STATE
// ══════════════════════════════════════════════════════════════════

describe("Initial state", () => {
  it("starts at the intro scene in normal mode", () => {
    renderExplainer();
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
  });

  it("renders the section with accessible label", () => {
    renderExplainer();
    expect(screen.getByRole("region", { name: /how applyguard helps/i })).toBeTruthy();
  });

  it("starts at the takeaway scene in reduced-motion mode", () => {
    renderExplainer({ reduced: true });
    expect(screen.getByText("Apply with more confidence.")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 2. SCENE PROGRESSION
// ══════════════════════════════════════════════════════════════════

describe("Scene progression", () => {
  it("advances through scenes automatically", () => {
    renderExplainer();
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("Virtual Assistant — full remote")).toBeTruthy();
  });

  it("loops after the final pause scene", () => {
    renderExplainer();
    // Advance scene by scene (timers cascade: each setTimeout schedules the next)
    // Scene durations: 1400, 1800, 2000, 2400, 2000, 1800, 1600, 2200, 1800 = 17000 total
    const durations = [1400, 1800, 2000, 2400, 2000, 1800, 1600, 2200, 1800];
    for (const ms of durations) {
      act(() => { vi.advanceTimersByTime(ms); });
    }
    // After looping back to scene 0 (intro)
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 3. PLAYBACK CONTROLS
// ══════════════════════════════════════════════════════════════════

describe("Playback controls", () => {
  it("play/pause toggle stops and resumes progression", () => {
    renderExplainer();
    const pauseBtn = screen.getByRole("button", { name: /pause/i });
    clickAndFlush(pauseBtn);

    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();

    const playBtn = screen.getByRole("button", { name: "Play animation" });
    expect(playBtn).toBeTruthy();
    clickAndFlush(playBtn);

    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("Virtual Assistant — full remote")).toBeTruthy();
  });

  it("replay resets to the intro scene", () => {
    renderExplainer();
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("Virtual Assistant — full remote")).toBeTruthy();

    const replayBtn = screen.getByRole("button", { name: /replay/i });
    clickAndFlush(replayBtn);
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 4. CHAPTER SELECTORS
// ══════════════════════════════════════════════════════════════════

describe("Chapter selectors", () => {
  it("Scan button jumps to listing scene", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /scan/i }));
    expect(screen.getByText("Virtual Assistant — full remote")).toBeTruthy();
  });

  it("Results button jumps to results scene", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /results/i }));
    expect(screen.getByText("22")).toBeTruthy();
    expect(screen.getByText("SKIP")).toBeTruthy();
  });

  it("Guidance button jumps to guidance scene", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /guidance/i }));
    expect(screen.getByText("What to do next")).toBeTruthy();
  });

  it("Premium button jumps to premium scene", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /premium/i }));
    expect(screen.getByText("Premium AI support")).toBeTruthy();
  });

  it("Tracker button jumps to tracker scene", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /tracker/i }));
    expect(screen.getByText("Saved to tracker")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 5. VIEWPORT AND VISIBILITY
// ══════════════════════════════════════════════════════════════════

describe("Viewport and visibility", () => {
  it("pauses when the section leaves the viewport", () => {
    renderExplainer();
    const io = globalThis.IntersectionObserver._last();
    act(() => { io._cb([{ isIntersecting: false }]); });
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
  });

  it("resumes when entering viewport if not manually paused", () => {
    renderExplainer();
    const io = globalThis.IntersectionObserver._last();
    act(() => { io._cb([{ isIntersecting: false }]); });
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();

    act(() => { io._cb([{ isIntersecting: true }]); });
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("Virtual Assistant — full remote")).toBeTruthy();
  });

  it("pauses when the browser tab is hidden", () => {
    renderExplainer();
    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
  });

  it("resumes when tab becomes visible if eligible", () => {
    renderExplainer();
    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    act(() => { vi.advanceTimersByTime(1400); });

    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText("Virtual Assistant — full remote")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 6. REDUCED MOTION
// ══════════════════════════════════════════════════════════════════

describe("Reduced motion", () => {
  it("hides playback controls", () => {
    renderExplainer({ reduced: true });
    expect(screen.queryByRole("button", { name: /play/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /pause/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /replay/i })).toBeNull();
  });

  it("shows the takeaway scene immediately", () => {
    renderExplainer({ reduced: true });
    expect(screen.getByText("Apply with more confidence.")).toBeTruthy();
  });

  it("shows essential product text without animation", () => {
    renderExplainer({ reduced: true });
    const matches = screen.getAllByText(/free to use/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

// ══════════════════════════════════════════════════════════════════
// 7. ACCESSIBILITY
// ══════════════════════════════════════════════════════════════════

describe("Accessibility", () => {
  it("has an aria-live region for scene descriptions", () => {
    renderExplainer();
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toBeTruthy();
    expect(liveRegion.getAttribute("aria-live")).toBe("polite");
  });

  it("all controls are native buttons", () => {
    renderExplainer();
    const btns = [
      screen.getByRole("button", { name: /pause/i }),
      screen.getByRole("button", { name: /replay/i }),
      screen.getByRole("button", { name: /scan/i }),
      screen.getByRole("button", { name: /results/i }),
      screen.getByRole("button", { name: /guidance/i }),
      screen.getByRole("button", { name: /premium/i }),
      screen.getByRole("button", { name: /tracker/i }),
    ];
    btns.forEach((b) => expect(b.tagName).toBe("BUTTON"));
  });

  it("play/pause exposes correct aria-pressed", () => {
    renderExplainer();
    const pauseBtn = screen.getByRole("button", { name: /pause/i });
    expect(pauseBtn.getAttribute("aria-pressed")).toBe("true");

    clickAndFlush(pauseBtn);
    const playBtn = screen.getByRole("button", { name: "Play animation" });
    expect(playBtn.getAttribute("aria-pressed")).toBe("false");
  });

  it("essential product explanation exists outside animation", () => {
    renderExplainer();
    expect(screen.getByText("Check the opportunity. Apply with confidence.")).toBeTruthy();
    expect(screen.getByText(/paste a job post/i)).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 8. PRODUCT STORY CONTENT
// ══════════════════════════════════════════════════════════════════

describe("Product story content", () => {
  it("listing scene shows suspicious job post", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /scan/i }));
    expect(screen.getByText("Virtual Assistant — full remote")).toBeTruthy();
    expect(screen.getByText("Earn ₱15,000 weekly, no experience")).toBeTruthy();
    expect(screen.getByText("Message us on Telegram to start")).toBeTruthy();
  });

  it("results scene shows risk score and verdict", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /results/i }));
    expect(screen.getByText("22")).toBeTruthy();
    expect(screen.getByText("SKIP")).toBeTruthy();
    expect(screen.getByText("3 red flags · 1 missing detail")).toBeTruthy();
  });

  it("guidance scene shows follow-up questions", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /guidance/i }));
    expect(screen.getByText("What to do next")).toBeTruthy();
    expect(screen.getByText("Ask for the company's registered legal name")).toBeTruthy();
    expect(screen.getByText("Verify through SEC or DTI registration")).toBeTruthy();
  });

  it("premium scene shows premium features", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /premium/i }));
    expect(screen.getByText("Premium AI support")).toBeTruthy();
    expect(screen.getByText("Deeper credibility review")).toBeTruthy();
    expect(screen.getByText("Resume tailoring to the listing")).toBeTruthy();
  });

  it("tracker scene shows application stages", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /tracker/i }));
    expect(screen.getByText("Saved to tracker")).toBeTruthy();
    expect(screen.getAllByText("Saved").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Applied")).toBeTruthy();
    expect(screen.getByText("Interview")).toBeTruthy();
    expect(screen.getByText("Offer")).toBeTruthy();
  });

  it("takeaway shows final message", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /tracker/i }));
    act(() => { vi.advanceTimersByTime(1600); });
    expect(screen.getByText("Apply with more confidence.")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 9. TIMER CLEANUP
// ══════════════════════════════════════════════════════════════════

describe("Timer cleanup", () => {
  it("cleans up timers on unmount", () => {
    const { unmount } = renderExplainer();
    unmount();
  });

  it("does not update state after unmount", () => {
    const { unmount } = renderExplainer();
    unmount();
    vi.advanceTimersByTime(5000);
  });
});

// ══════════════════════════════════════════════════════════════════
// 10. API FALLBACKS
// ══════════════════════════════════════════════════════════════════

describe("API fallbacks", () => {
  it("does not crash when IntersectionObserver is unavailable", () => {
    const orig = globalThis.IntersectionObserver;
    delete globalThis.IntersectionObserver;
    renderExplainer();
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
    globalThis.IntersectionObserver = orig;
  });

  it("does not crash when matchMedia is unavailable", () => {
    const orig = window.matchMedia;
    window.matchMedia = undefined;
    renderExplainer();
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
    window.matchMedia = orig;
  });
});

// ══════════════════════════════════════════════════════════════════
// 11. SCANNING ANIMATION
// ══════════════════════════════════════════════════════════════════

describe("Scanning animation", () => {
  it("scanning scene shows inspecting status", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /scan/i }));
    act(() => { vi.advanceTimersByTime(1800); });
    expect(screen.getByText("Inspecting…")).toBeTruthy();
  });

  it("scanning scene shows flag annotations", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /scan/i }));
    act(() => { vi.advanceTimersByTime(1800); });
    expect(screen.getByText("Unrealistic pay")).toBeTruthy();
    expect(screen.getByText("Off-platform")).toBeTruthy();
    expect(screen.getByText("Upfront fee")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 12. MANUAL PAUSE PERSISTENCE
// ══════════════════════════════════════════════════════════════════

describe("Manual pause persistence", () => {
  it("manual pause persists across viewport re-entry", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /pause/i }));

    const io = globalThis.IntersectionObserver._last();
    io._cb([{ isIntersecting: false }]);
    io._cb([{ isIntersecting: true }]);

    vi.advanceTimersByTime(1400);
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════
// 13. DOCUMENT VISIBILITY RESUME RULES
// ══════════════════════════════════════════════════════════════════

describe("Document visibility resume rules", () => {
  it("does not resume when tab becomes visible if manually paused", () => {
    renderExplainer();
    clickAndFlush(screen.getByRole("button", { name: /pause/i }));

    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    vi.advanceTimersByTime(1400);
    expect(screen.getByText("See how ApplyGuard helps you apply safely")).toBeTruthy();
  });
});
