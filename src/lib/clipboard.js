// clipboard.js — copy text to the system clipboard.
// Tries the modern async Clipboard API first; falls back to
// document.execCommand("copy") for older browsers or when the
// API is blocked (e.g. non-HTTPS contexts).
// No React, no DOM, no storage.

/**
 * Copy the given string to the system clipboard.
 * Throws if neither the Clipboard API nor the execCommand fallback succeeds.
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  // 1. Try the modern async Clipboard API.
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // API exists but the call was denied — fall through to fallback.
    }
  }

  // 2. Fallback: create a temporary, off-screen textarea and use execCommand.
  const textarea = document.createElement("textarea");
  textarea.value = text;
  // Position off-screen so the user never sees a flash.
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const ok = document.execCommand("copy");
    if (!ok) {
      throw new Error("execCommand('copy') returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
