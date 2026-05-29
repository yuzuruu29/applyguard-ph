/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// ApplyGuard PH — Vite + React + Tailwind v4 + Vitest.
// No backend, no env-specific config. Builds to a static bundle in /dist.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // The unit-tested modules (scoring, redflags, missing) are pure logic,
    // so a plain node environment is all we need.
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
});
