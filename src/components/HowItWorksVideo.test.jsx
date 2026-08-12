// @vitest-environment jsdom
// HowItWorksVideo.test.jsx — the player for the Remotion instructional film.
//
// The behaviour worth protecting here is the bandwidth contract: the ~4 MB
// video must not be fetched until someone asks for it, and it must stop when
// scrolled away.
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import HowItWorksVideo from "./HowItWorksVideo.jsx";

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
  /** Drive the callback from a test. */
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
  // jsdom has no media stack; play/pause must be stubbed to be observable.
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete global.IntersectionObserver;
});

describe("HowItWorksVideo — before playback", () => {
  it("shows the poster and no video element, so nothing downloads on scroll", () => {
    render(<HowItWorksVideo />);
    expect(document.querySelector("video")).toBeNull();
    expect(document.querySelector("img")).toBeTruthy();
  });

  it("labels the region", () => {
    render(<HowItWorksVideo />);
    expect(
      screen.getByRole("region", { name: /how applyguard helps you apply safely/i })
    ).toBeTruthy();
  });

  it("gives the poster descriptive alt text", () => {
    render(<HowItWorksVideo />);
    expect(document.querySelector("img").getAttribute("alt")).toContain("ApplyGuard scans");
  });

  it("offers a labelled play control", () => {
    render(<HowItWorksVideo />);
    expect(screen.getByRole("button", { name: /play the how-it-works walkthrough/i })).toBeTruthy();
  });

  it("lists every chapter as a text alternative to the silent film", () => {
    render(<HowItWorksVideo />);
    const items = document.querySelectorAll("ol li");
    expect(items.length).toBe(10);
    expect(items[0].textContent).toContain("Paste the job post");
    expect(items[9].textContent).toContain("Your data stays yours");
  });

  it("keeps a narrative summary for screen readers", () => {
    render(<HowItWorksVideo />);
    const srOnly = document.querySelector(".sr-only");
    expect(srOnly.textContent).toContain("How ApplyGuard helps you apply safely");
    expect(srOnly.textContent).toContain("risk score");
    expect(srOnly.textContent).toContain("SEC or DTI");
  });

  it("is a rounded glass card", () => {
    render(<HowItWorksVideo />);
    const section = screen.getByRole("region", { name: /how applyguard/i });
    expect(section.className).toContain("rounded-2xl");
    expect(section.className).toMatch(/\bglass(-subtle|-strong)?\b/);
  });
});

describe("HowItWorksVideo — after pressing play", () => {
  function start() {
    render(<HowItWorksVideo />);
    fireEvent.click(screen.getByRole("button", { name: /play the how-it-works walkthrough/i }));
  }

  it("mounts the video and starts it", () => {
    start();
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
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
    expect(video.getAttribute("src")).toContain("how-it-works-desktop.mp4");
  });

  it("serves the portrait cut to narrow viewports", () => {
    window.innerWidth = 500;
    start();
    expect(document.querySelector("video").getAttribute("src")).toContain(
      "how-it-works-mobile.mp4"
    );
  });
});

describe("HowItWorksVideo — visibility", () => {
  it("observes the section and disconnects on unmount", () => {
    const { unmount } = render(<HowItWorksVideo />);
    expect(ioInstances.length).toBeGreaterThan(0);
    unmount();
    expect(ioInstances[0].disconnected).toBe(true);
  });

  it("pauses playback once the section leaves the viewport", () => {
    render(<HowItWorksVideo />);
    fireEvent.click(screen.getByRole("button", { name: /play the how-it-works walkthrough/i }));
    ioInstances[0].emit(false);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });

  it("does not start playback just because the section scrolled into view", () => {
    render(<HowItWorksVideo />);
    ioInstances[0].emit(true);
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
