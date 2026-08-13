// @vitest-environment jsdom
// useScrollReveal.test.jsx — DOM-level coverage for the scroll-reveal hook
// (enhancement plan Phase 16 automated coverage). Renders a real component in
// jsdom and asserts three acceptance gates:
//   • Reduced-motion rendering — content reveals immediately, no observation.
//   • Scroll-reveal fallback / "no hidden content before IntersectionObserver
//     support is available" — when IntersectionObserver is missing, everything
//     is revealed synchronously so nothing is stuck at opacity:0.
//   • Normal path — elements are observed (and revealed on intersection) rather
//     than force-revealed up front.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useScrollReveal } from "./useScrollReveal.js";

function Reveals() {
  const ref = useScrollReveal([]);
  return (
    <div ref={ref}>
      <p className="scroll-reveal" data-testid="a">One</p>
      <p className="scroll-reveal" data-testid="b">Two</p>
      <div className="scroll-reveal-stagger" data-testid="c">
        <span>child</span>
      </div>
    </div>
  );
}

function mockMatchMedia(reduced) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

const realIO = globalThis.IntersectionObserver;

beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  cleanup();
  globalThis.IntersectionObserver = realIO;
  vi.restoreAllMocks();
});

describe("useScrollReveal — reduced motion", () => {
  it("reveals every element immediately when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    const { getByTestId } = render(<Reveals />);
    expect(getByTestId("a").classList.contains("revealed")).toBe(true);
    expect(getByTestId("b").classList.contains("revealed")).toBe(true);
    expect(getByTestId("c").classList.contains("revealed")).toBe(true);
  });
});

describe("useScrollReveal — no IntersectionObserver support", () => {
  it("reveals every element immediately so nothing stays hidden", () => {
    // Simulate a browser without IntersectionObserver.
    // eslint-disable-next-line no-global-assign
    globalThis.IntersectionObserver = undefined;
    const { getByTestId } = render(<Reveals />);
    expect(getByTestId("a").classList.contains("revealed")).toBe(true);
    expect(getByTestId("b").classList.contains("revealed")).toBe(true);
    expect(getByTestId("c").classList.contains("revealed")).toBe(true);
  });
});

describe("useScrollReveal — normal observation path", () => {
  it("observes elements instead of force-revealing them up front", () => {
    const observed = [];
    let capturedCallback = null;
    globalThis.IntersectionObserver = class {
      constructor(cb) {
        capturedCallback = cb;
      }
      observe(el) {
        observed.push(el);
      }
      unobserve() {}
      disconnect() {}
    };

    const { getByTestId } = render(<Reveals />);
    // Nothing revealed yet — they wait for intersection.
    expect(getByTestId("a").classList.contains("revealed")).toBe(false);
    expect(observed.length).toBe(3);

    // Simulate the observer firing for the first element.
    capturedCallback([{ isIntersecting: true, target: getByTestId("a") }]);
    expect(getByTestId("a").classList.contains("revealed")).toBe(true);
    expect(getByTestId("b").classList.contains("revealed")).toBe(false);
  });
});
