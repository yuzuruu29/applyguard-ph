import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import MotionProvider from "./motion/MotionProvider.jsx";
import "./index.css";

// Register service worker for PWA (offline support + installability)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silently fail — the app still works without a SW
    });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <MotionProvider>
        <App />
      </MotionProvider>
    </BrowserRouter>
  </StrictMode>
);
