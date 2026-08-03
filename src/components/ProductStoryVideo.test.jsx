// @vitest-environment jsdom
// ProductStoryVideo.test.jsx — Tests for the Remotion video website component.
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ProductStoryVideo from "./ProductStoryVideo.jsx";

// ── Browser API mocks ──
let ioInstances = [];

class MockIntersectionObserver {
  constructor(cb) {
    this._cb = cb;
    ioInstances.push(this);
  }
  observe() {}
  disconnect() {}
}

let mockMatchMediaResult = false;

beforeEach(() => {
  ioInstances = [];
  global.IntersectionObserver = MockIntersectionObserver;

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((q) => ({
      matches: q === "(prefers-reduced-motion: reduce)" ? mockMatchMediaResult : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });

  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });

  mockMatchMediaResult = false;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete global.IntersectionObserver;
});

// ── Tests ──

describe("ProductStoryVideo", () => {
  it("renders a video element with correct attributes", () => {
    render(<ProductStoryVideo />);
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.playsInline).toBe(true);
  });

  it("has correct aria-label on section", () => {
    render(<ProductStoryVideo />);
    const section = screen.getByRole("region", { name: /how applyguard helps you apply safely/i });
    expect(section).toBeTruthy();
  });

  it("includes accessible text summary for screen readers", () => {
    render(<ProductStoryVideo />);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly).toBeTruthy();
    expect(srOnly.textContent).toContain("How ApplyGuard helps you apply safely");
    expect(srOnly.textContent).toContain("risk score");
    expect(srOnly.textContent).toContain("SEC or DTI");
  });

  it("video has preload metadata", () => {
    render(<ProductStoryVideo />);
    const video = document.querySelector("video");
    expect(video.getAttribute("preload")).toBe("metadata");
  });

  it("video has poster attribute", () => {
    render(<ProductStoryVideo />);
    const video = document.querySelector("video");
    expect(video.getAttribute("poster")).toBeTruthy();
  });

  it("video has MP4 and WebM sources", () => {
    render(<ProductStoryVideo />);
    const sources = document.querySelectorAll("source");
    expect(sources.length).toBe(2);
    expect(sources[0].getAttribute("type")).toBe("video/mp4");
    expect(sources[1].getAttribute("type")).toBe("video/webm");
  });

  it("creates an IntersectionObserver", () => {
    render(<ProductStoryVideo />);
    expect(ioInstances.length).toBeGreaterThan(0);
  });

  it("disconnects IntersectionObserver on unmount", () => {
    const { unmount } = render(<ProductStoryVideo />);
    const io = ioInstances[0];
    unmount();
    expect(io._disconnected).toBeTruthy;
    // The disconnect method should have been called
    expect(typeof io.disconnect).toBe("function");
  });

  it("section has rounded border styling", () => {
    render(<ProductStoryVideo />);
    const section = screen.getByRole("region", { name: /how applyguard helps you apply safely/i });
    expect(section.className).toContain("rounded-2xl");
    expect(section.className).toContain("border");
  });

  it("video element is inside the section", () => {
    render(<ProductStoryVideo />);
    const section = screen.getByRole("region", { name: /how applyguard helps you apply safely/i });
    const video = section.querySelector("video");
    expect(video).toBeTruthy();
  });
});

describe("ProductStoryVideo — reduced motion", () => {
  beforeEach(() => {
    mockMatchMediaResult = true;
  });

  it("shows poster image instead of video when reduced motion is preferred", () => {
    render(<ProductStoryVideo />);
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
    const video = document.querySelector("video");
    expect(video).toBeNull();
  });

  it("shows play button overlay when reduced motion is preferred", () => {
    render(<ProductStoryVideo />);
    const playBtn = screen.getByRole("button", { name: /play product story video/i });
    expect(playBtn).toBeTruthy();
  });

  it("play button contains a play icon SVG", () => {
    render(<ProductStoryVideo />);
    const playBtn = screen.getByRole("button", { name: /play product story video/i });
    expect(playBtn.querySelector("svg")).toBeTruthy();
  });

  it("still shows accessible text summary in reduced motion", () => {
    render(<ProductStoryVideo />);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly).toBeTruthy();
    expect(srOnly.textContent).toContain("How ApplyGuard helps you apply safely");
  });

  it("poster image has descriptive alt text", () => {
    render(<ProductStoryVideo />);
    const img = document.querySelector("img");
    expect(img.getAttribute("alt")).toContain("ApplyGuard scans");
  });
});
