// sync.js — pure merge logic for localStorage ↔ cloud.
// No React, no DOM, no network. Tested in sync.test.js.

/**
 * Merge two job arrays by id, keeping whichever copy is newer.
 * Returns a sorted array (newest createdAt first). Never throws.
 */
export function mergeJobs(local = [], remote = []) {
  const a = Array.isArray(local) ? local : [];
  const b = Array.isArray(remote) ? remote : [];
  const map = new Map();

  for (const j of [...a, ...b]) {
    if (!j || typeof j !== "object" || !j.id) continue;
    const existing = map.get(j.id);
    if (!existing) {
      map.set(j.id, j);
      continue;
    }
    // Keep whichever was updated more recently.
    const aTime = existing.updatedAt || "";
    const bTime = j.updatedAt || "";
    if (bTime > aTime) map.set(j.id, j);
  }

  return [...map.values()].sort((x, y) => {
    const aTime = x.createdAt || "";
    const bTime = y.createdAt || "";
    return bTime.localeCompare(aTime);
  });
}

/**
 * Merge local + remote settings. Prefer remote fields that have
 * real (non-default) values, but don't wipe local data when remote
 * is null or still defaults.
 */
export function mergeSettings(local, remote) {
  const base = local && typeof local === "object" ? { ...local } : { name: "", minRate: 0, currency: "PHP" };
  if (!remote || typeof remote !== "object") return base;
  return {
    name: remote.name || base.name || "",
    minRate: remote.minRate || base.minRate || 0,
    currency: remote.currency || base.currency || "PHP",
  };
}

/**
 * Serialize a localStorage job into a cloud jobs row shape.
 * Only sets fields that have meaningful values.
 */
export function jobToRow(userId, job) {
  const row = {
    id: job.id,
    user_id: userId,
    title: job.title || "",
    raw_text: job.rawText ?? null,
    intake: job.intake ?? null,
    score: typeof job.score === "number" ? job.score : null,
    breakdown: job.breakdown ?? null,
    verdict: job.verdict ?? null,
    risk_level: job.riskLevel ?? null,
    missing_info: job.missingInfo ?? null,
    flags: job.flags ?? null,
    status: job.status || "Saved",
    follow_up_by: job.followUpBy || "",
    notes: job.notes || "",
    created_at: job.createdAt || new Date().toISOString(),
    updated_at: job.updatedAt || new Date().toISOString(),
  };
  return row;
}

/**
 * Deserialize a cloud jobs row back to a localStorage job shape.
 * Only includes non-null fields to preserve the local job shape through round-trips.
 */
export function rowToJob(row) {
  const job = {};
  job.id = row.id;
  job.title = row.title || "";
  if (row.raw_text != null) job.rawText = row.raw_text;
  if (row.intake != null) job.intake = row.intake;
  if (row.score != null) job.score = row.score;
  if (row.breakdown != null) job.breakdown = row.breakdown;
  if (row.verdict != null) job.verdict = row.verdict;
  if (row.risk_level != null) job.riskLevel = row.risk_level;
  if (row.missing_info != null) job.missingInfo = row.missing_info;
  if (row.flags != null) job.flags = row.flags;
  job.status = row.status || "Saved";
  job.followUpBy = row.follow_up_by || "";
  job.notes = row.notes || "";
  job.createdAt = row.created_at || new Date().toISOString();
  job.updatedAt = row.updated_at || new Date().toISOString();
  return job;
}
