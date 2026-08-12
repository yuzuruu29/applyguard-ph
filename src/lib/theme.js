// theme.js — colour-scheme preference.
//
// Deliberately kept out of storage.js: the app's saved-jobs payload has a
// schema version and a migration path, and a cosmetic preference has no
// business riding along with user data. This owns its own key, and the boot
// script in index.html reads the same key before first paint so the page
// never flashes the wrong palette.

export const THEME_KEY = "applyguard.theme.v1";
export const THEMES = ["dark", "light"];

export const DEFAULT_THEME = "dark";

/** Coerce anything into a valid theme name. Dark is the product default. */
export function normalizeTheme(value) {
  return value === "light" ? "light" : DEFAULT_THEME;
}

/** The other theme — what a toggle switches to. */
export function oppositeTheme(theme) {
  return normalizeTheme(theme) === "light" ? "dark" : "light";
}

/** Read the stored preference. Never throws (private mode, blocked storage). */
export function readTheme() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return DEFAULT_THEME;
    return normalizeTheme(window.localStorage.getItem(THEME_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

/** Persist the preference. Returns false when storage is unavailable. */
export function writeTheme(theme) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    window.localStorage.setItem(THEME_KEY, normalizeTheme(theme));
    return true;
  } catch {
    return false;
  }
}

/**
 * Reflect the theme on <html>. The stylesheet keys off [data-theme="light"];
 * dark needs no opt-in because it is the default token set.
 */
export function applyTheme(theme) {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const next = normalizeTheme(theme);
  document.documentElement.setAttribute("data-theme", next);
  return next;
}
