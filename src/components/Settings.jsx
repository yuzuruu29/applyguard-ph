import { useRef, useState } from "react";
import { useApp } from "../store.jsx";
import { backup, SCHEMA_VERSION } from "../lib/storage.js";
import { jobsToCSV } from "../lib/csv.js";

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);
const inputCls =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none";

export default function Settings() {
  const { settings, jobs, updateSettings, restoreState, resetAll, notify } = useApp();
  const fileRef = useRef(null);
  const [restoreError, setRestoreError] = useState("");

  const symbol = settings.currency === "USD" ? "$" : "₱";

  const handleBackup = () => {
    download(
      `applyguard-backup-${today()}.json`,
      backup({ schemaVersion: SCHEMA_VERSION, settings, jobs }),
      "application/json"
    );
    notify("Backup downloaded.", "success");
  };

  const handleExportCSV = () => {
    if (jobs.length === 0) {
      notify("No saved jobs to export yet.", "info");
      return;
    }
    download(`applyguard-jobs-${today()}.csv`, jobsToCSV(jobs), "text/csv;charset=utf-8");
    notify("CSV exported.", "success");
  };

  const handleRestoreFile = (e) => {
    setRestoreError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = restoreState(String(reader.result));
      if (res.ok) {
        notify("Backup restored.", "success");
      } else {
        setRestoreError(res.error || "Restore failed.");
        notify("Restore failed.", "error");
      }
    };
    reader.onerror = () => {
      setRestoreError("Couldn't read that file. Try downloading a fresh backup.");
      notify("Restore failed.", "error");
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-picking the same file
  };

  const handleReset = () => {
    if (
      window.confirm(
        "This clears your settings and every saved job from this browser. Back up first if you want to keep them. Continue?"
      )
    ) {
      resetAll();
      setRestoreError("");
      notify("Everything was reset.", "info");
    }
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl text-ink">Settings</h1>
        <p className="mt-1 text-ink-soft">
          A couple of preferences, plus full control over your data.
        </p>
      </div>

      {/* Preferences */}
      <section className="space-y-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Your preferences</h2>

        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Your name <span className="font-normal text-ink-faint">used in the message prompt</span>
          </label>
          <input
            id="name"
            type="text"
            value={settings.name}
            onChange={(e) => updateSettings({ name: e.target.value })}
            placeholder="e.g. Maria Santos"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="minRate" className="mb-1.5 block text-sm font-medium text-ink">
              Your monthly pay floor
              <span className="ml-1 font-normal text-ink-faint">{symbol} / month</span>
            </label>
            <input
              id="minRate"
              type="number"
              min="0"
              value={settings.minRate || ""}
              onChange={(e) => updateSettings({ minRate: Number(e.target.value) || 0 })}
              placeholder="e.g. 30000"
              className={inputCls}
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Pay below this pulls the fit score down. Leave it at 0 if you'd rather not set one.
            </p>
          </div>

          <div>
            <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-ink">
              Currency
            </label>
            <select
              id="currency"
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className={inputCls}
            >
              <option value="PHP">PHP — Philippine peso (₱)</option>
              <option value="USD">USD — US dollar ($)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data safety */}
      <section className="space-y-5 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div>
          <h2 className="font-display text-xl text-ink">Your data</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Everything lives in this browser. Back it up so you don't lose it if you clear your
            history or switch devices.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleBackup}
            className="rounded-2xl border border-line bg-paper px-5 py-4 text-left transition-colors hover:border-brand"
          >
            <span className="block font-semibold text-ink">Back up (JSON)</span>
            <span className="text-sm text-ink-soft">Download a full copy of your data.</span>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border border-line bg-paper px-5 py-4 text-left transition-colors hover:border-brand"
          >
            <span className="block font-semibold text-ink">Restore from backup</span>
            <span className="text-sm text-ink-soft">Load a JSON file you saved before.</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="rounded-2xl border border-line bg-paper px-5 py-4 text-left transition-colors hover:border-brand"
          >
            <span className="block font-semibold text-ink">Export jobs (CSV)</span>
            <span className="text-sm text-ink-soft">Open your saved jobs in a spreadsheet.</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="rounded-2xl border border-stop/40 bg-stop-soft px-5 py-4 text-left transition-colors hover:border-stop"
          >
            <span className="block font-semibold text-stop-ink">Reset everything</span>
            <span className="text-sm text-ink-soft">Wipe settings and all saved jobs.</span>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleRestoreFile}
          className="hidden"
        />

        {restoreError && (
          <div className="rounded-2xl border border-stop/40 bg-stop-soft p-4">
            <p className="font-semibold text-stop-ink">That restore didn't work</p>
            <p className="mt-0.5 text-sm text-ink-soft">{restoreError}</p>
            <p className="mt-2 text-sm text-ink-soft">
              Your current data is untouched. Pick a valid ApplyGuard backup file and try again.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
