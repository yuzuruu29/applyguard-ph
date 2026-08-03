import { Link } from "react-router-dom";
import { m, AnimatePresence } from "motion/react";
import { useApp } from "../store.jsx";
import { JOB_STATUSES } from "../lib/storage.js";
import { VERDICT_TONE, RISK_TONE, STATUS_TONE } from "../lib/tone.js";
import { trackerStats } from "../lib/stats.js";
import { duration, easing } from "../motion/tokens.js";

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
      className="elev rounded-3xl border border-line bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/result/${job.id}`}
            className="inline-flex min-h-11 items-center font-display text-lg text-ink underline-offset-4 hover:underline"
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
            className="min-h-11 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
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
            className="min-h-11 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
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
          className="w-full resize-y rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onDelete(job)}
          className="inline-flex min-h-11 items-center rounded-full px-3 py-2 text-sm font-medium text-stop-ink hover:bg-stop-soft focus-visible:outline-none"
        >
          Remove
        </button>
      </div>
    </m.li>
  );
}

export default function Tracker() {
  const { jobs, updateJob, deleteJob, notify } = useApp();
  const stats = trackerStats(jobs);

  // Group by pipeline stage, newest first within each stage. A status change
  // moves a card between groups; Motion's `layout` prop animates the relocation.
  const sortedJobs = [...jobs].sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? JOB_STATUSES.length;
    const rb = STATUS_RANK[b.status] ?? JOB_STATUSES.length;
    if (ra !== rb) return ra - rb;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

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
        <Link
          to="/"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-paper hover:bg-brand-deep"
        >
          Scan a job
        </Link>
      </div>

      {/* Stats strip — only when there are saved jobs */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-card p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-ink">{stats.total}</p>
            <p className="mt-0.5 text-xs text-ink-faint">Total saved</p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-go-ink">{stats.applied + stats.interview + stats.offer}</p>
            <p className="mt-0.5 text-xs text-ink-faint">In progress</p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-stop-ink">{stats.highRiskDodged}</p>
            <p className="mt-0.5 text-xs text-ink-faint">High-risk dodged</p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-4 text-center">
            <p className="font-mono text-2xl font-semibold text-ink-soft">{stats.avgScore !== null ? stats.avgScore : "—"}</p>
            <p className="mt-0.5 text-xs text-ink-faint">Avg fit score</p>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-card p-10 text-center">
          <p className="font-display text-2xl text-ink">Nothing saved yet</p>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">
            Run a scan, then hit "Save to tracker" to keep a job here with its verdict, your
            notes, and a follow-up date.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper hover:bg-brand-deep"
          >
            Scan your first job
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          <AnimatePresence initial={false}>
            {sortedJobs.map((job, i) => (
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
      )}
    </div>
  );
}
