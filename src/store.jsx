// store.jsx — app-wide state: settings, saved jobs, the in-memory last scan,
// and toasts. Persists to localStorage with debounced writes (see lib/storage).
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import * as storage from "./lib/storage.js";

const AppContext = createContext(null);

let idCounter = 0;
function newId() {
  // Stable, sortable-ish, collision-resistant enough for a local-only tool.
  idCounter += 1;
  return `job_${Date.now().toString(36)}_${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function AppProvider({ children }) {
  // Read localStorage exactly once, not on every render.
  const bootRef = useRef(null);
  if (bootRef.current === null) bootRef.current = storage.load();
  const initial = bootRef.current;

  const [settings, setSettings] = useState(initial.settings);
  const [jobs, setJobs] = useState(initial.jobs);
  const [result, setResult] = useState(null); // in-memory last scan
  const [toasts, setToasts] = useState([]);

  // Persist (debounced) whenever settings or jobs change.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    storage.save({ schemaVersion: storage.SCHEMA_VERSION, settings, jobs });
  }, [settings, jobs]);

  // Don't lose a pending debounced write if the tab closes.
  useEffect(() => {
    const flushNow = () => storage.flush();
    window.addEventListener("beforeunload", flushNow);
    document.addEventListener("visibilitychange", flushNow);
    return () => {
      window.removeEventListener("beforeunload", flushNow);
      document.removeEventListener("visibilitychange", flushNow);
      storage.flush();
    };
  }, []);

  // ── toasts ──────────────────────────────────────────────────────────
  const notify = useCallback((message, tone = "info") => {
    const id = newId();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // ── settings ────────────────────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  // ── jobs ────────────────────────────────────────────────────────────
  const getJob = useCallback((id) => jobs.find((j) => j.id === id) || null, [jobs]);

  const saveJob = useCallback((jobData) => {
    const now = new Date().toISOString();
    const id = newId();
    const job = {
      id,
      status: "Saved",
      followUpBy: "",
      notes: "",
      createdAt: now,
      updatedAt: now,
      ...jobData,
    };
    setJobs((list) => [job, ...list]);
    return id;
  }, []);

  const updateJob = useCallback((id, patch) => {
    setJobs((list) =>
      list.map((j) => (j.id === id ? { ...j, ...patch, updatedAt: new Date().toISOString() } : j))
    );
  }, []);

  const deleteJob = useCallback((id) => {
    setJobs((list) => list.filter((j) => j.id !== id));
  }, []);

  // ── data safety ────────────────────────────────────────────────────
  const restoreState = useCallback((jsonString) => {
    const res = storage.restore(jsonString);
    if (res.ok) {
      setSettings(res.state.settings);
      setJobs(res.state.jobs);
    }
    return res;
  }, []);

  const resetAll = useCallback(() => {
    const fresh = storage.reset();
    setSettings(fresh.settings);
    setJobs(fresh.jobs);
    setResult(null);
  }, []);

  const value = {
    settings,
    jobs,
    result,
    setResult,
    toasts,
    notify,
    dismissToast,
    updateSettings,
    getJob,
    saveJob,
    updateJob,
    deleteJob,
    restoreState,
    resetAll,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
