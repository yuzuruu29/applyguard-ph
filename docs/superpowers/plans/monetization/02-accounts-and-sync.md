# Phase 2 — Accounts & Cloud Sync

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax. Requires Phase 1 complete.

**Goal:** Optional magic-link accounts whose only free benefit is cloud sync of the tracker + settings across devices. Logged-out behavior is byte-for-byte identical to today.

**Architecture:** `AuthProvider` exposes the session. `store.jsx` gains a sync engine: on login it pulls cloud state and merges (pure `sync.js`, TDD); afterwards every change debounce-pushes. localStorage remains the offline source of truth — sync is a mirror, never a blocker. Sync failures degrade to toasts, never to data loss.

**Tech Stack:** supabase-js auth, Vitest.

---

### Task 1: Sync merge logic (TDD)

**Files:**
- Create: `src/lib/sync.js`
- Test: `src/lib/sync.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/sync.test.js`:

```js
import { describe, it, expect } from "vitest";
import { mergeJobs, mergeSettings, jobToRow, rowToJob } from "./sync.js";

const job = (id, over) => ({
  id,
  title: `Job ${id}`,
  updatedAt: "2026-07-01T00:00:00.000Z",
  createdAt: "2026-07-01T00:00:00.000Z",
  ...over,
});

describe("mergeJobs", () => {
  it("unions local and remote by id", () => {
    const merged = mergeJobs([job("a")], [job("b")]);
    expect(merged.map((j) => j.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps the newer copy when both sides have the same job", () => {
    const local = [job("a", { notes: "new", updatedAt: "2026-07-10T00:00:00.000Z" })];
    const remote = [job("a", { notes: "old", updatedAt: "2026-07-05T00:00:00.000Z" })];
    expect(mergeJobs(local, remote)[0].notes).toBe("new");
    expect(mergeJobs(remote, local)[0].notes).toBe("new");
  });

  it("sorts newest createdAt first (tracker order)", () => {
    const merged = mergeJobs(
      [job("old", { createdAt: "2026-01-01T00:00:00.000Z" })],
      [job("new", { createdAt: "2026-07-01T00:00:00.000Z" })]
    );
    expect(merged.map((j) => j.id)).toEqual(["new", "old"]);
  });

  it("never throws on garbage input", () => {
    expect(mergeJobs(null, undefined)).toEqual([]);
    expect(mergeJobs([null, { noId: true }], [])).toEqual([]);
  });
});

describe("mergeSettings", () => {
  it("prefers remote when remote has real values", () => {
    expect(mergeSettings({ name: "", minRate: 0, currency: "PHP" }, { name: "Maria", minRate: 30000, currency: "PHP" }).name).toBe("Maria");
  });

  it("keeps local when remote is still defaults", () => {
    expect(mergeSettings({ name: "Maria", minRate: 30000, currency: "PHP" }, { name: "", minRate: 0, currency: "PHP" }).name).toBe("Maria");
  });

  it("keeps local when remote is null", () => {
    expect(mergeSettings({ name: "Maria", minRate: 1, currency: "USD" }, null).name).toBe("Maria");
  });
});

describe("jobToRow / rowToJob", () => {
  it("round-trips a job through its cloud row shape", () => {
    const j = job("a", { score: 88 });
    const row = jobToRow("user-1", j);
    expect(row).toMatchObject({ id: "a", user_id: "user-1", updated_at: j.updatedAt });
    expect(rowToJob(row)).toEqual(j);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/sync.test.js`
Expected: FAIL — `Cannot find module './sync.js'`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/lib/sync.test.js
git commit -m "test: cloud sync merge logic"
```

- [ ] **Step 4: Write the implementation**

`src/lib/sync.js`:

```js
// sync.js — pure merge logic between localStorage state and cloud rows.
// Rules: jobs union by id, newer updatedAt wins, list stays newest-first.
// Settings: remote wins once it holds real values; otherwise local (which
// then pushes up). No React, no DOM, no storage.

export function mergeJobs(localJobs, remoteJobs) {
  const byId = new Map();
  const all = [
    ...(Array.isArray(remoteJobs) ? remoteJobs : []),
    ...(Array.isArray(localJobs) ? localJobs : []),
  ];
  for (const j of all) {
    if (!j || typeof j !== "object" || !j.id) continue;
    const existing = byId.get(j.id);
    if (!existing) {
      byId.set(j.id, j);
      continue;
    }
    const existingTime = Date.parse(existing.updatedAt || "") || 0;
    const candidateTime = Date.parse(j.updatedAt || "") || 0;
    byId.set(j.id, candidateTime >= existingTime ? j : existing);
  }
  return [...byId.values()].sort(
    (a, b) => (Date.parse(b.createdAt || "") || 0) - (Date.parse(a.createdAt || "") || 0)
  );
}

const isDefaultSettings = (s) =>
  !s || (s.name === "" && (Number(s.minRate) || 0) === 0 && (s.currency || "PHP") === "PHP");

export function mergeSettings(localSettings, remoteSettings) {
  if (remoteSettings && !isDefaultSettings(remoteSettings)) {
    return {
      name: typeof remoteSettings.name === "string" ? remoteSettings.name : "",
      minRate: Number(remoteSettings.minRate) || 0,
      currency: remoteSettings.currency === "USD" ? "USD" : "PHP",
    };
  }
  return { ...(localSettings || { name: "", minRate: 0, currency: "PHP" }) };
}

export function jobToRow(userId, job) {
  return {
    id: job.id,
    user_id: userId,
    payload: job,
    created_at: job.createdAt || new Date().toISOString(),
    updated_at: job.updatedAt || new Date().toISOString(),
  };
}

export function rowToJob(row) {
  return row && row.payload && typeof row.payload === "object" ? row.payload : null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/sync.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sync.js
git commit -m "feat: cloud sync merge logic"
```

---

### Task 2: Cloud I/O layer

Thin side-effectful wrappers around supabase-js (manual-verification only, per repo conventions). Deletes propagate: remote rows missing locally are pruned.

**Files:**
- Create: `src/lib/cloud.js`

- [ ] **Step 1: Write the module**

`src/lib/cloud.js`:

```js
// cloud.js — the only place the SPA talks to Supabase tables. Small arrays,
// simple strategy: upsert everything local, prune remote rows that no longer
// exist locally. All failures throw — callers catch and toast.
import { supabase } from "./supabase.js";
import { jobToRow, rowToJob } from "./sync.js";

export async function pullState(userId) {
  const [{ data: profile, error: pErr }, { data: jobRows, error: jErr }] = await Promise.all([
    supabase.from("profiles").select("display_name, min_rate, currency").eq("id", userId).maybeSingle(),
    supabase.from("jobs").select("id, payload").eq("user_id", userId),
  ]);
  if (pErr) throw pErr;
  if (jErr) throw jErr;
  return {
    settings: profile
      ? { name: profile.display_name || "", minRate: profile.min_rate || 0, currency: profile.currency || "PHP" }
      : null,
    jobs: (jobRows || []).map(rowToJob).filter(Boolean),
  };
}

export async function pushState(userId, { settings, jobs }) {
  // 1. profile
  const { error: pErr } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: settings.name || "",
    min_rate: Number(settings.minRate) || 0,
    currency: settings.currency === "USD" ? "USD" : "PHP",
    updated_at: new Date().toISOString(),
  });
  if (pErr) throw pErr;

  // 2. jobs: upsert local, prune remote-only ids
  const rows = (Array.isArray(jobs) ? jobs : []).map((j) => jobToRow(userId, j));
  if (rows.length > 0) {
    const { error: uErr } = await supabase.from("jobs").upsert(rows);
    if (uErr) throw uErr;
  }
  const { data: remoteIds, error: rErr } = await supabase.from("jobs").select("id").eq("user_id", userId);
  if (rErr) throw rErr;
  const localIds = new Set(rows.map((r) => r.id));
  const stale = (remoteIds || []).map((r) => r.id).filter((id) => !localIds.has(id));
  if (stale.length > 0) {
    const { error: dErr } = await supabase.from("jobs").delete().in("id", stale);
    if (dErr) throw dErr;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cloud.js
git commit -m "feat: supabase cloud io layer"
```

---

### Task 3: AuthProvider

**Files:**
- Create: `src/auth.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the provider**

`src/auth.jsx`:

```jsx
// auth.jsx — optional account session. When the backend isn't configured,
// backendEnabled is false and the app behaves exactly as it did before.
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, backendEnabled } from "./lib/supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(backendEnabled);

  useEffect(() => {
    if (!backendEnabled) return undefined;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    backendEnabled,
    signInWithEmail,
    signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
```

- [ ] **Step 2: Wrap the app and add the route**

In `src/App.jsx`, add imports:

```js
import { AuthProvider } from "./auth.jsx";
import AccountPage from "./components/AccountPage.jsx";
```

Change the tree from `<AppProvider><Routes>…` to:

```jsx
<AuthProvider>
  <AppProvider>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ScanForm />} />
        <Route path="/result/:id" element={<ResultView />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </AppProvider>
</AuthProvider>
```

- [ ] **Step 3: Commit** (build will fail until Task 4 creates AccountPage — run build after Task 4; commit together if preferred)

---

### Task 4: Account page

**Files:**
- Create: `src/components/AccountPage.jsx`

- [ ] **Step 1: Write the page**

`src/components/AccountPage.jsx`:

```jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";

const inputCls =
  "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none";

function SignedOut({ onSignIn }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSignIn(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.message || "Couldn't send the link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="elev rounded-3xl border border-line bg-card p-6 sm:p-8">
      <h2 className="font-display text-xl text-ink">Sign in with a magic link</h2>
      <p className="mt-1 text-sm text-ink-soft">
        No password. We email you a sign-in link. Your scans stay on this device either way —
        an account only adds cloud sync and (later) Premium features.
      </p>
      {sent ? (
        <div className="mt-4 rounded-2xl border border-go/30 bg-go-soft p-5">
          <p className="font-semibold text-go-ink">Check your inbox</p>
          <p className="mt-1 text-sm text-ink-soft">
            We sent a sign-in link to <span className="font-medium text-ink">{email}</span>. Open it
            on this device to finish signing in.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
            Your email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
          {error && <p className="text-sm font-medium text-stop-ink">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep active:translate-y-0 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Email me a sign-in link"}
          </button>
        </form>
      )}
    </section>
  );
}

export default function AccountPage() {
  const { user, loading, backendEnabled, signInWithEmail, signOut } = useAuth();
  const { sync } = useApp();

  if (!backendEnabled) {
    return (
      <div className="rounded-3xl border border-line bg-card p-10 text-center">
        <p className="font-display text-2xl text-ink">Accounts aren't set up on this copy</p>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">
          The scanner works fully without one. Everything stays in this browser.
        </p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper hover:bg-brand-deep">
          Back to the scanner
        </Link>
      </div>
    );
  }

  if (loading) {
    return <p className="text-ink-soft">Loading your account…</p>;
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl text-ink">Your account</h1>
        <p className="mt-1 text-ink-soft">
          Optional. The scanner is free with or without one.
        </p>
      </div>

      {!user ? (
        <SignedOut onSignIn={signInWithEmail} />
      ) : (
        <>
          <section className="elev space-y-4 rounded-3xl border border-line bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-ink">Signed in</h2>
            <p className="text-ink-soft">
              <span className="font-medium text-ink">{user.email}</span>
            </p>
            <p className="text-sm text-ink-soft">
              {sync?.error
                ? sync.error
                : sync?.at
                  ? `Cloud sync is on. Last synced ${new Date(sync.at).toLocaleString("en-PH")}.`
                  : "Cloud sync is starting…"}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand"
              >
                Sign out
              </button>
              <Link
                to="/settings"
                className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand"
              >
                Data & backup settings
              </Link>
            </div>
          </section>

          <section className="elev rounded-3xl border border-line bg-card p-6 sm:p-8">
            <h2 className="font-display text-xl text-ink">Subscription</h2>
            <p className="mt-1 text-sm text-ink-soft">
              You're on the free tier. Premium (AI features) arrives with PayMongo checkout.
            </p>
            <Link
              to="/offers"
              className="mt-4 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep"
            >
              See Premium
            </Link>
          </section>

          <section className="rounded-3xl border border-line bg-panel/50 p-6 sm:p-8">
            <h2 className="font-display text-lg text-ink">What leaves your device</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
              <li>• Without an account: nothing. Scans run in your browser.</li>
              <li>• With an account: your settings and saved jobs sync to your private, row-level-secured cloud rows.</li>
              <li>• AI features (Premium): the post text is sent to our AI provider to generate a result. It is never stored.</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build + commit**

Run: `npm run build`
Expected: build succeeds.

```bash
git add src/auth.jsx src/App.jsx src/components/AccountPage.jsx
git commit -m "feat: magic-link auth and account page"
```

---

### Task 5: Sync engine in the store

**Files:**
- Modify: `src/store.jsx`

- [ ] **Step 1: Add the sync engine**

In `src/store.jsx`, add imports:

```js
import { useAuth } from "./auth.jsx";
import { mergeJobs, mergeSettings } from "./lib/sync.js";
import * as cloud from "./lib/cloud.js";
```

Inside `AppProvider`, after the existing state declarations, add:

```js
const { user } = useAuth();
const [sync, setSync] = useState({ at: "", error: "" });
const syncReady = useRef(false);   // push only after the first pull for this session
const syncTimer = useRef(null);
const jobsRef = useRef(jobs);
const settingsRef = useRef(settings);
jobsRef.current = jobs;
settingsRef.current = settings;

// Pull + merge on login (and clear the flag on logout).
useEffect(() => {
  if (!user) {
    syncReady.current = false;
    setSync({ at: "", error: "" });
    return undefined;
  }
  let cancelled = false;
  (async () => {
    try {
      const remote = await cloud.pullState(user.id);
      if (cancelled) return;
      setJobs(mergeJobs(jobsRef.current, remote.jobs));
      setSettings((s) => mergeSettings(s, remote.settings));
      syncReady.current = true;
      setSync({ at: new Date().toISOString(), error: "" });
    } catch {
      if (!cancelled) setSync({ at: "", error: "Cloud sync failed — your local copy is safe." });
    }
  })();
  return () => {
    cancelled = true;
  };
}, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

// Debounced push on change (only once the first pull finished).
useEffect(() => {
  if (!user || !syncReady.current) return undefined;
  clearTimeout(syncTimer.current);
  syncTimer.current = setTimeout(async () => {
    try {
      await cloud.pushState(user.id, { settings, jobs });
      setSync({ at: new Date().toISOString(), error: "" });
    } catch {
      setSync((s) => ({ ...s, error: "Cloud sync failed — will retry on the next change." }));
    }
  }, 800);
  return () => clearTimeout(syncTimer.current);
}, [settings, jobs, user]);
```

Add `sync` to the context `value` object.

**Important interplay with the existing localStorage effect:** the pull-merge triggers a `setJobs`/`setSettings`, which fires the existing persist effect — that's correct (merged state is written to localStorage too, keeping the local copy the offline truth).

- [ ] **Step 2: Verify build + manual check**

Run: `npm run build`
Expected: build succeeds.

Manual check (needs the Phase 1 `.env.local`):
1. Sign in on device A (magic link), save a job → Account shows "Last synced …".
2. Open an incognito window, sign in as the same user → the saved job appears (pull + merge).
3. Delete it there → it disappears on device A after the next change/pull (sign out/in).
4. With DevTools offline: the app still scans and saves locally; Account shows the sync-failed message, nothing is lost.

- [ ] **Step 3: Commit**

```bash
git add src/store.jsx
git commit -m "feat: cloud sync engine for tracker and settings"
```

---

### Task 6: Nav + footer copy

**Files:**
- Modify: `src/components/Layout.jsx`

- [ ] **Step 1: Add Account to the nav**

In `Layout.jsx`, add to the `NAV` array after Offers:

```js
{ to: "/account", label: "Account" },
```

- [ ] **Step 2: Update the footer privacy line**

Replace the final footer `<p>` ("Built for Filipino remote job seekers. Your scans and saved jobs stay in this browser only.") with:

```jsx
<p className="mt-4 text-xs text-ink-faint">
  Built for Filipino remote job seekers. The scanner runs in your browser — with an optional
  account, your saved jobs sync across devices (still your data, in your private rows).
</p>
```

- [ ] **Step 3: Verify build + commit**

Run: `npm run build`

```bash
git add src/components/Layout.jsx
git commit -m "feat: account nav item and updated privacy copy"
```

---

**Phase 2 done when:** magic-link sign-in works end-to-end, tracker syncs across two sessions, logged-out use is unchanged, and all tests + build pass.
