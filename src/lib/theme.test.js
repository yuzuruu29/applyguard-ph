// @vitest-environment jsdom
// This module is the one thing in lib/ that touches localStorage and the
// document element, so it needs a DOM rather than the suite's node default.
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DEFAULT_THEME,
  THEME_KEY,
  applyTheme,
  normalizeTheme,
  oppositeTheme,
  readTheme,
  writeTheme,
} from "./theme.js";

describe("normalizeTheme", () => {
  it("keeps light", () => {
    expect(normalizeTheme("light")).toBe("light");
  });

  it("falls back to dark for anything else", () => {
    for (const value of ["dark", "DARK", "", null, undefined, 0, "sepia", {}]) {
      expect(normalizeTheme(value)).toBe("dark");
    }
  });

  it("defaults to dark", () => {
    expect(DEFAULT_THEME).toBe("dark");
  });
});

describe("oppositeTheme", () => {
  it("flips both ways", () => {
    expect(oppositeTheme("dark")).toBe("light");
    expect(oppositeTheme("light")).toBe("dark");
  });

  it("treats garbage as dark, so it flips to light", () => {
    expect(oppositeTheme("nonsense")).toBe("light");
  });
});

describe("readTheme / writeTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads dark when nothing is stored", () => {
    expect(readTheme()).toBe("dark");
  });

  it("round-trips a stored preference", () => {
    expect(writeTheme("light")).toBe(true);
    expect(window.localStorage.getItem(THEME_KEY)).toBe("light");
    expect(readTheme()).toBe("light");
  });

  it("normalizes on the way in", () => {
    writeTheme("sepia");
    expect(window.localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("survives a throwing localStorage", () => {
    const spy = vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readTheme()).toBe("dark");
    spy.mockRestore();
  });
});

describe("applyTheme", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("writes the attribute for light", () => {
    expect(applyTheme("light")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("writes dark explicitly, so a stale light attribute cannot linger", () => {
    applyTheme("light");
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
