// mobile.js — Capacitor bootstrap for iOS/Android.
// Only runs inside a Capacitor container (not in a regular browser).
// Imported before the React app so native APIs are ready.

import { readTheme } from "./lib/theme.js";

// Must track --color-paper in index.css for each theme, so the native status
// bar blends into the web view instead of framing it.
var STATUS_BAR_BG = {
  dark: "#0b0d10",
  light: "#f4efe4",
};

async function initCapacitor() {
  // Detect Capacitor native runtime
  var isCapacitor = typeof window !== "undefined" &&
    window.Capacitor && window.Capacitor.isNative;

  if (!isCapacitor) return;

  try {
    var theme = readTheme();
    var statusBar = await import("@capacitor/status-bar");
    // Style.Dark means light content — correct for the dark palette.
    await statusBar.StatusBar.setStyle({
      style: theme === "light" ? statusBar.Style.Light : statusBar.Style.Dark,
    });
    await statusBar.StatusBar.setBackgroundColor({ color: STATUS_BAR_BG[theme] });

    var splashScreen = await import("@capacitor/splash-screen");
    await splashScreen.SplashScreen.hide();
  } catch (_e) {
    // Plugins unavailable — app still works without them
  }
}

initCapacitor();
