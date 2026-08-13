import { useState } from "react";
import { Link } from "react-router-dom";
import { m, AnimatePresence } from "motion/react";
import { useApp } from "../store.jsx";
import { JOB_STATUSES } from "../lib/storage.js";
import { VERDICT_TONE, RISK_TONE, STATUS_TONE } from "../lib/tone.js";
import { trackerStats } from "../lib/stats.js";
import { filterJobs } from "../lib/trackerFilter.js";
import { duration, easing } from "../motion/tokens.js";
import Button from "./ui/Button.jsx";
import { SearchIcon, XMarkIcon } from "./ui/icons.jsx";

// Pipeline order for the tracker. Jobs are rendered grouped by this rank so a
// status change physically relocates a card to its new stage; Motion's `layout`
// prop animates that move instead of the card blinking out and back in.
const STATUS_RANK = Object.fromEntries(JOB_STATUSES.map((s, i) => [s, i]));

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function JobCard({ job, onStatus, onFollowUp, onNotes, onDelete, index = 0 }) {
  const verdict = VERDICT_TONE[job.verdict] || VERDICT_TONE.Caution;
  const risk = RISK_TONE[job.riskLevel] || RISK_TONE.Medium;

  // `layout` animates the card gliding to its new position when its status
  // changes the sort order. Entrance/exit fade the card in/out through
  // AnimatePresence. Under reduced motion, MotionConfig collapses the
  // transform/layout parts to their final state (opacity still fades).
  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        layout: { duration: duration.deliberate, ease: easing.enter },
        duration: duration.normal,
        ease: easing.enter,
        delay: Math.min(index * 0.04, 0.28),
      }}
      whileHover={{ y: -4, scale: 1.008 }}
      // glass-subtle, not glass: the list length is unbounded, so blurred
      // cards here would stack backdrop-filter passes without limit.
      className="glass-subtle rounded-3xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/result/${job.id}`}
            className="inline-flex min-h-11 items-center font-display text-lg font-semibold text-ink underline-offset-4 transition-colors hover:text-brand-lift hover:underline"
          >
            {job.title || "Untitled job"}
          </Link>
          <p className="mt-1 text-xs text-ink-faint">Saved {fmtDate(job.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${verdict.chip}`}>
            {verdict.label}
          </span>
          <span className="font-mono text-sm text-ink-soft">{job.score}/100</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${risk.chip}`}>
            {risk.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`status-${job.id}`} className="mb-1.5 block text-xs font-medium text-ink-soft">
            Status
          </label>
          <select
            id={`status-${job.id}`}
            value={job.status}
            onChange={(e) => onStatus(job.id, e.target.value)}
            className="glass-subtle field-input min-h-11 w-full rounded-xl px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_TONE[job.status] || STATUS_TONE.Saved
            }`}
          >
            {job.status}
          </span>
        </div>

        <div>
          <label htmlFor={`follow-${job.id}`} className="mb-1.5 block text-xs font-medium text-ink-soft">
            Follow up by
          </label>
          <input
            id={`follow-${job.id}`}
            type="date"
            value={job.followUpBy || ""}
            onChange={(e) => onFollowUp(job.id, e.target.value)}
            className="glass-subtle field-input min-h-11 w-full rounded-xl px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor={`notes-${job.id}`} className="mb-1.5 block text-xs font-medium text-ink-soft">
          Notes
        </label>
        <textarea
          id={`notes-${job.id}`}
          value={job.notes || ""}
          onChange={(e) => onNotes(job.id, e.target.value)}
          rows={2}
          placeholder="Who you spoke to, what they said, what to check…"
          className="glass-subtle field-input w-full resize-y rounded-xl px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="danger" size="sm" onClick={() => onDelete(job)} className="font-medium">
          Remove
        </Button>
      </div>
    </m.li>
  );
}

export default function Tracker() {
  const { jobs, updateJob, deleteJob, notify } = useApp();
  const stats = trackerStats(jobs);

  // Filters are render-time only — saved data is never touched. The bar only
  // appears once the list is long enough for scanning to become work.
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const filtersActive = query.trim() !== "" || statusFilter !== "All";
  const showFilterBar = jobs.length >= 4;

  // Group by pipeline stage, newest first within each stage. A status change
  // moves a card between groups; Motion's `layout` prop animates the relocation.
  const sortedJobs = [...jobs].sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? JOB_STATUSES.length;
    const rb = STATUS_RANK[b.status] ?? JOB_STATUSES.length;
    if (ra !== rb) return ra - rb;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  const visibleJobs = showFilterBar
    ? filterJobs(sortedJobs, { query, status: statusFilter })
    : sortedJobs;

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("All");
  };

  const handleDelete = (job) => {
    if (window.confirm(`Remove "${job.title || "this job"}" from your tracker?`)) {
      deleteJob(job.id);
      notify("Removed from tracker.", "info");
    }
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Your tracker</h1>
          <p className="mt-1 text-ink-soft">
            {jobs.length === 0
              ? "Jobs you save will show up here."
              : `${jobs.length} saved ${jobs.length === 1 ? "job" : "jobs"}, kept in this browser.`}
          </p>
        </div>
        <Button to="/">Scan a job</Button>
      </div>

      {/* Stats strip — only when there are saved jobs */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass-subtle rounded-2xl p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-ink">{stats.total}</p>
            <p className="mt-0.5 text-xs text-ink-faint">Total saved</p>
          </div>
          <div className="glass-subtle rounded-2xl p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-go-ink">{stats.applied + stats.interview + stats.offer}</p>
            <p className="mt-0.5 text-xs text-ink-faint">In progress</p>
          </div>
          <div className="glass-subtle rounded-2xl p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-stop-ink">{stats.highRiskDodged}</p>
            <p className="mt-0.5 text-xs text-ink-faint">High-risk dodged</p>
          </div>
          <div className="glass-subtle rounded-2xl p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-ink-soft">{stats.avgScore !== null ? stats.avgScore : "—"}</p>
            <p className="mt-0.5 text-xs text-ink-faint">Avg fit score</p>
          </div>
        </div>
      )}

      {/* Filter bar — status pills + free-text search over titles and notes */}
      {showFilterBar && (
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="scrollbar-none flex max-w-full items-center gap-1.5 overflow-x-auto">
            {["All", ...JOB_STATUSES].map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={active}
                  className={`min-h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    active
                      ? "btn-gradient text-paper"
                      : "glass-subtle text-ink-soft hover:border-brand/50 hover:text-ink"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div className="field-frame glass-subtle flex min-w-52 flex-1 items-center rounded-full sm:max-w-64 sm:flex-none">
            <span className="pl-3 text-ink-faint">
              <SearchIcon className="h-3.5 w-3.5" />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles and notes"
              aria-label="Search saved jobs"
              className="field-input w-full rounded-full bg-transparent px-2.5 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="glass rounded-3xl border-dashed p-10 text-center">
          <p className="font-display text-2xl font-semibold text-ink">Nothing saved yet</p>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Run a scan, then hit "Save to tracker" to keep a job here with its verdict, your
            notes, and a follow-up date.
          </p>
          <Button to="/" size="lg" className="mt-6">
            Scan your first job
          </Button>
        </div>
      ) : visibleJobs.length === 0 ? (
        <div className="glass rounded-3xl border-dashed p-10 text-center">
          <p className="font-display text-xl font-semibold text-ink">No jobs match those filters</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
            Try a different status or search term, or clear the filters to see everything.
          </p>
          <Button variant="soft" size="sm" onClick={clearFilters} className="mt-5">
            <XMarkIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {filtersActive && (
            <p className="text-sm text-ink-faint" aria-live="polite">
              Showing {visibleJobs.length} of {jobs.length} saved{" "}
              {jobs.length === 1 ? "job" : "jobs"}.
            </p>
          )}
          <ul className="space-y-5">
            <AnimatePresence initial={false}>
              {visibleJobs.map((job, i) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={i}
                  onStatus={(id, status) => updateJob(id, { status })}
                  onFollowUp={(id, followUpBy) => updateJob(id, { followUpBy })}
                  onNotes={(id, notes) => updateJob(id, { notes })}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </div>
  );
}
