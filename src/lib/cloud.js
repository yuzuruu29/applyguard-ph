// cloud.js — Supabase I/O for reading/writing user state to the cloud.
// Pure async functions. No React, no state. Degrades gracefully when the
// backend is not configured (never throws; returns empty data).

import { supabase } from "./supabase.js";
import { jobToRow, rowToJob } from "./sync.js";

/** Pull the user's cloud state. Returns { settings, jobs } (both never null). */
export async function pullState(userId) {
  if (!supabase) return { settings: { name: "", minRate: 0, currency: "PHP" }, jobs: [] };

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("settings").eq("id", userId).maybeSingle(),
    supabase.from("jobs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const settings = profile?.settings && typeof profile.settings === "object"
    ? profile.settings
    : { name: "", minRate: 0, currency: "PHP" };

  const jobs = Array.isArray(rows) ? rows.map(rowToJob) : [];

  return { settings, jobs };
}

/** Push the user's settings + jobs to the cloud. Uses upsert for idempotent sync. */
export async function pushState(userId, { settings, jobs }) {
  if (!supabase) return;

  // Save settings on the profile row.
  await supabase
    .from("profiles")
    .update({ settings, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (!Array.isArray(jobs) || jobs.length === 0) return;

  const rows = jobs.map((j) => jobToRow(userId, j));

  // Upsert in chunks of 50 to stay under payload limits.
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    await supabase.from("jobs").upsert(batch, {
      onConflict: "id, user_id",
      ignoreDuplicates: false,
    });
  }
}
