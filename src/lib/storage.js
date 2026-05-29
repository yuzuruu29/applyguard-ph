// storage.js — the single source of truth for persistence.
// Data safety is a first-class feature here: one namespaced key, an explicit
// schema version, debounced writes, and full backup / restore / reset.
//
// Shape (schemaVersion 1):
// {
//   schemaVersion: 1,
//   settings: { name, minRate, currency },
//   jobs: [ { id, title, rawText, intake, score, breakdown, verdict,
//             riskLevel, missingInfo, flags, status, followUpBy, notes,
//             createdAt, updatedAt } ]
// }

export const STORAGE_KEY = "applyguard.v1";
export const SCHEMA_VERSION = 1;

export const JOB_STATUSES = ["Saved", "Applied", "Interview", "Offer", "Closed"];

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      name: "",
      minRate: 0,
      currency: "PHP",
    },
    jobs: [],
  };
}

function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

// Coerce arbitrary parsed data into a known-good shape so a corrupted or
// hand-edited value can never crash the app.
function normalize(data) {
  const base = defaultState();
  if (!data || typeof data !== "object") return base;

  const settings = data.settings && typeof data.settings === "object" ? data.settings : {};
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  return {
    schemaVersion: SCHEMA_VERSION,
    settings: {
      name: typeof settings.name === "string" ? settings.name : "",
      minRate: Number(settings.minRate) || 0,
      currency: settings.currency === "USD" ? "USD" : "PHP",
    },
    jobs: jobs.filter((j) => j && typeof j === "object"),
  };
}

// Migrate older payloads forward. Only v1 exists today; this is the seam
// for future versions so we never silently drop a user's data.
function migrate(data) {
  if (!data || typeof data !== "object") return defaultState();
  // (no prior versions yet) — fall through to normalize.
  return normalize(data);
}

/**
 * Load and validate the stored state. Always returns a usable object;
 * never throws.
 */
export function load() {
  if (!hasStorage()) return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== SCHEMA_VERSION) return migrate(parsed);
    return normalize(parsed);
  } catch {
    return defaultState();
  }
}

// ── debounced writes ─────────────────────────────────────────────────────
let pending = null;
let pendingState = null;

function writeNow(state) {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounced save. Repeated calls within `delay` collapse into one write,
 * so typing in the tracker notes doesn't hammer localStorage.
 */
export function save(state, delay = 400) {
  pendingState = state;
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    writeNow(pendingState);
    pending = null;
    pendingState = null;
  }, delay);
}

/** Force any pending debounced write to disk immediately. */
export function flush() {
  if (pending) {
    clearTimeout(pending);
    pending = null;
  }
  if (pendingState) {
    writeNow(pendingState);
    pendingState = null;
  }
}

/**
 * Serialize the current state for a JSON backup download.
 * @param {object} [state] - defaults to whatever is on disk
 */
export function backup(state) {
  const data = state || load();
  return JSON.stringify(data, null, 2);
}

/**
 * Restore from a backup JSON string. Validates shape before committing.
 * @returns {{ ok: boolean, state?: object, error?: string }}
 */
export function restore(jsonString) {
  if (typeof jsonString !== "string" || !jsonString.trim()) {
    return { ok: false, error: "That file was empty. Pick a backup file and try again." };
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { ok: false, error: "That doesn't look like an ApplyGuard backup. The file isn't valid JSON." };
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.jobs)) {
    return { ok: false, error: "That file is missing the jobs list, so it isn't an ApplyGuard backup." };
  }
  const state = migrate(parsed);
  const ok = writeNow(state);
  if (!ok) return { ok: false, error: "Couldn't write to this browser's storage. Restore was not applied." };
  return { ok: true, state };
}

/** Wipe everything back to a clean default state. */
export function reset() {
  const state = defaultState();
  flush();
  writeNow(state);
  return state;
}
