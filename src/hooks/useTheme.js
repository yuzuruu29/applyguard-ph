// useTheme — reads the persisted colour scheme and keeps <html data-theme>,
// localStorage, and every mounted toggle in agreement.
//
// State lives in a module-level store rather than component state so the
// header switch and the Settings control never disagree, and so a change in
// another tab (storage event) lands here too.
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { applyTheme, oppositeTheme, readTheme, THEME_KEY, writeTheme } from "../lib/theme.js";

let current = null;
const listeners = new Set();

function get() {
  if (current === null) current = readTheme();
  return current;
}

function set(next) {
  if (next === current) return;
  current = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, get, () => "dark");

  // The boot script already set the attribute; this re-asserts it after
  // hydration and covers the case where storage was written elsewhere.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === THEME_KEY) set(readTheme());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next) => {
    const applied = applyTheme(next);
    writeTheme(applied);
    set(applied);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(oppositeTheme(get()));
  }, [setTheme]);

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
