// ai.js — browser-side AI client. Calls the ai-proxy edge function with
// the user's JWT. The edge function handles entitlement, quota, and the
// Anthropic call. Returns generated text.

import { supabase } from "./supabase.js";

/**
 * Call a premium AI feature. Returns the generated text.
 * @param {string} feature - One of "message", "deepscan", "resume", "interview"
 * @param {object} payload - { rawText, intake, settings, extra }
 */
export async function callAi(feature, payload = {}) {
  if (!supabase) throw new Error("Backend not configured");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in first");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ feature, ...payload }),
  });

  const body = await res.json();

  if (res.status === 402) throw new Error("Premium required for AI features. Upgrade on the Offers page.");
  if (res.status === 429) throw new Error("Monthly AI quota reached (60 uses). Resets next month.");
  if (!res.ok) throw new Error(body?.error || "AI request failed");

  return body;
}
