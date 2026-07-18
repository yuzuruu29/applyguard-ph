// entitlement.ts — Deno mirror of src/lib/entitlement.js.
// The Vitest suite in Phase 1 is the spec; keep both in sync.
// Used by the ai-proxy edge function.

export const AI_MONTHLY_CAP = 60;

export function effectiveTier(row: any, now = new Date()): "free" | "premium" {
  if (!row || typeof row !== "object") return "free";
  if (row.tier !== "premium") return "free";
  const end = typeof row.current_period_end === "string" ? row.current_period_end : "";
  if (!end) return "free";
  return end >= now.toISOString().slice(0, 10) ? "premium" : "free";
}
