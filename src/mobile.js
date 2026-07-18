// mobile.js — Capacitor bootstrap for iOS/Android.
// Only runs inside a Capacitor container (not in a regular browser).
// Imported before the React app so native APIs are ready.

async function initCapacitor() {
  // Detect Capacitor native runtime
  var isCapacitor = typeof window !== "undefined" &&
    window.Capacitor && window.Capacitor.isNative;

  if (!isCapacitor) return;

  try {
    var statusBar = await import("@capacitor/status-bar");
    await statusBar.StatusBar.setStyle({ style: statusBar.Style.Dark });
    await statusBar.StatusBar.setBackgroundColor({ color: "#0b6e5f" });

    var splashScreen = await import("@capacitor/splash-screen");
    await splashScreen.SplashScreen.hide();
  } catch (_e) {
    // Plugins unavailable — app still works without them
  }
}

initCapacitor();
