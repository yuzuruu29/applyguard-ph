// @vitest-environment jsdom
// PremiumShowcaseVideo.test.jsx — the player for the Premium showcase film.
//
// Same behaviour worth protecting as HowItWorksVideo: the ~4 MB video must
// not be fetched until someone asks for it, and it must stop when scrolled
// away. The pricing page gets traffic from people who may never care about
// the film — they should never pay for its bytes.
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PremiumShowcaseVideo from "./PremiumShowcaseVideo.jsx";

let ioInstances = [];

class MockIntersectionObserver {
  constructor(cb) {
    this._cb = cb;
    this.disconnected = false;
    ioInstances.push(this);
  }
  observe() {}
  disconnect() {
    this.disconnected = true;
  }
  emit(isIntersecting) {
    this._cb([{ isIntersecting }]);
  }
}

beforeEach(() => {
  ioInstances = [];
  global.IntersectionObserver = MockIntersectionObserver;
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete global.IntersectionObserver;
});

describe("PremiumShowcaseVideo — before playback", () => {
  it("shows the poster and no video element, so nothing downloads on scroll", () => {
    render(<PremiumShowcaseVideo />);
    expect(document.querySelector("video")).toBeNull();
    expect(document.querySelector("img")).toBeTruthy();
  });

  it("labels the region", () => {
    render(<PremiumShowcaseVideo />);
    expect(screen.getByRole("region", { name: /see what premium adds/i })).toBeTruthy();
  });

  it("gives the poster descriptive alt text", () => {
    render(<PremiumShowcaseVideo />);
    expect(document.querySelector("img").getAttribute("alt")).toContain("voice mock interview");
  });

  it("offers a labelled play control", () => {
    render(<PremiumShowcaseVideo />);
    expect(screen.getByRole("button", { name: /play the premium showcase/i })).toBeTruthy();
  });

  it("lists every feature beat as a text alternative to the silent film", () => {
    render(<PremiumShowcaseVideo />);
    const items = document.querySelectorAll("ol li");
    expect(items.length).toBe(5);
    expect(items[0].textContent).toContain("AI message generator");
    expect(items[3].textContent).toContain("Voice mock interview");
    expect(items[4].textContent).toContain("Honest pricing");
  });

  it("keeps a narrative summary for screen readers", () => {
    render(<PremiumShowcaseVideo />);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly.textContent).toContain("See what Premium adds");
    expect(srOnly.textContent).toContain("never auto-renew");
    expect(srOnly.textContent).toContain("processed in memory");
  });
});

describe("PremiumShowcaseVideo — after pressing play", () => {
  function start() {
    render(<PremiumShowcaseVideo />);
    fireEvent.click(screen.getByRole("button", { name: /play the premium showcase/i }));
  }

  it("mounts the video and starts it", () => {
    start();
    expect(document.querySelector("video")).toBeTruthy();
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it("carries the expected playback attributes", () => {
    start();
    const video = document.querySelector("video");
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.getAttribute("controls")).not.toBeNull();
    expect(video.getAttribute("preload")).toBe("metadata");
    expect(video.getAttribute("poster")).toBeTruthy();
    expect(video.getAttribute("src")).toContain("premium-showcase-desktop.mp4");
  });

  it("serves the portrait cut to narrow viewports", () => {
    window.innerWidth = 500;
    start();
    expect(document.querySelector("video").getAttribute("src")).toContain(
      "premium-showcase-mobile.mp4"
    );
  });
});

describe("PremiumShowcaseVideo — visibility", () => {
  it("observes the section and disconnects on unmount", () => {
    const { unmount } = render(<PremiumShowcaseVideo />);
    expect(ioInstances.length).toBeGreaterThan(0);
    unmount();
    expect(ioInstances[0].disconnected).toBe(true);
  });

  it("pauses playback once the section leaves the viewport", () => {
    render(<PremiumShowcaseVideo />);
    fireEvent.click(screen.getByRole("button", { name: /play the premium showcase/i }));
    ioInstances[0].emit(false);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("does not start playback just because the section scrolled into view", () => {
    render(<PremiumShowcaseVideo />);
    ioInstances[0].emit(true);
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
