# Hook-Driven Frontend Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn ApplyGuard PH from a useful one-off tool into a product users return to and share, by redesigning the frontend around the Hook Model (trigger → action → variable reward → investment) without adding a backend, accounts, or schema changes.

**Architecture:** All new logic lands in small, pure, Vitest-covered modules under `src/lib/` (following the repo's established pattern: pure functions, no UI coupling). UI changes are thin presentation layers over those modules. Persistence stays on schema v1 (`applyguard.v1`); every stat and nudge is derived from the existing `jobs` array at render time, so no migration is needed.

**Tech Stack:** React 19 + Vite, Tailwind CSS v4, React Router 7, Vitest. No new runtime dependencies.

---

## Why these changes (the hook audit)

The current frontend is well-crafted (distinct paper/ink "field guide" identity, verdict stamp, score ring, reduced-motion support) but it does not hook:

| Hook phase | Gap today | Plan answer |
|---|---|---|
| **Trigger** | Nothing brings a user back; the site shared in a Facebook group renders as a bare link | Follow-up nudges (Tasks 5–6), Open Graph/Twitter meta + social card + PWA manifest (Task 9) |
| **Action** | First scan demands pasting a real post + filling 7 fields before any value is seen | One-click sample posts → verdict in seconds (Tasks 1–2); optional fields collapse behind a disclosure (Task 2) |
| **Variable reward** | The verdict appears all at once; the best moment of the app is underplayed | Staged "inspection ceremony": rotating check lines, score counts up, stamp slams last (Tasks 3–4) |
| **Investment** | Saved jobs sit in the tracker; nothing surfaces progress | Tracker stats strip ("2 high-risk dodged") (Task 7); follow-up nudges reward coming back (Tasks 5–6) |
| **Share loop** | A great verdict can't be shown to anyone | "Copy verdict summary" — privacy-safe text for group chats (Task 8) |

## Design guardrails (apply to every task)

- **Extend, don't redesign.** The existing token system (`paper/card/panel/line`, `ink*`, `brand`, `marker`, `go/warn/stop`) and fonts (Fraunces / Hanken Grotesk / JetBrains Mono) are the identity. No new colors or fonts.
- The `go/warn/stop` trio stays semantic-only (risk/verdict). Never use it decoratively.
- All animation is decorative: content is correct in the DOM from first paint, and the existing `prefers-reduced-motion` block must neutralize anything new. The count-up hook renders the final number immediately under reduced motion.
- Touch targets stay ≥ 44px (`min-h-11`), visible focus rings preserved, live regions for dynamic feedback.
- **Privacy is the brand:** the share summary must never include the pasted post text.

## Testing notes

The repo has no component-test infra (no React Testing Library) and tests only `src/lib/` pure functions. This plan keeps that convention: every piece of new logic is a pure lib function with real tests; UI tasks are verified with `npm run build` + a manual checklist. Adding a component-test stack is explicitly out of scope (YAGNI).

## File structure

**New files**
- `src/lib/samples.js` — two built-in example posts + intake presets (the "instant aha")
- `src/lib/samples.test.js`
- `src/lib/followups.js` — `followUpState`, `dueFollowUps`, `todayLocalISO`
- `src/lib/followups.test.js`
- `src/lib/stats.js` — `trackerStats`
- `src/lib/stats.test.js`
- `src/lib/clipboard.js` — `copyTextToClipboard` (extracted from ResultView; DRY)
- `src/lib/share.js` — `buildShareSummary`
- `src/lib/share.test.js`
- `src/hooks/useCountUp.js` — reduced-motion-aware count-up
- `public/manifest.webmanifest`
- `public/og-cover.svg` (source for the social card; PNG export step included)

**Modified files**
- `src/components/ScanForm.jsx` — sample chips, collapsible fine-tune fields, follow-up nudge card, rotating check lines
- `src/components/ResultView.jsx` — count-up score, share button, clipboard refactor
- `src/components/Layout.jsx` — Tracker nav badge for due follow-ups
- `src/components/Tracker.jsx` — stats strip
- `src/index.css` — stamp lands last (delay change only)
- `index.html` — OG/Twitter meta, manifest link
- `README.md` — document the new libs and features

---

## Phase 1 — Instant aha (try before effort)

### Task 1: Sample posts with guaranteed verdicts

Two realistic posts: a clean one that scans **Apply / Low / 0 flags / 0 missing**, and a sketchy one that scans **Skip / High / 3 hard flags / 2 missing**. The tests pin those outcomes so the demo can never silently break when the scoring rules are tuned later.

**Files:**
- Create: `src/lib/samples.js`
- Test: `src/lib/samples.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/samples.test.js`:

```js
import { describe, it, expect } from "vitest";
import { analyzeJob } from "./analyze.js";
import { SAMPLES, SAMPLE_KEYS } from "./samples.js";

describe("SAMPLES data", () => {
  it("ships a clean and a sketchy example", () => {
    expect(SAMPLE_KEYS).toEqual(["clean", "sketchy"]);
  });

  it("every sample has post text and a full intake", () => {
    for (const key of SAMPLE_KEYS) {
      const s = SAMPLES[key];
      expect(s.rawText.trim().length).toBeGreaterThan(100);
      expect(s.chip.trim().length).toBeGreaterThan(0);
      expect(s.intake).toMatchObject({
        role: expect.any(String),
        skills: expect.any(String),
        experience: expect.any(String),
        rateType: expect.any(String),
        hours: expect.any(String),
      });
    }
  });
});

describe("clean sample scan", () => {
  const result = analyzeJob({
    rawText: SAMPLES.clean.rawText,
    intake: { ...SAMPLES.clean.intake, rate: 45000 },
    settings: { name: "", minRate: 0, currency: "PHP" },
  });

  it("gets an Apply verdict", () => {
    expect(result.verdict).toBe("Apply");
  });

  it("has low risk and no flags", () => {
    expect(result.riskLevel).toBe("Low");
    expect(result.flags.hard).toHaveLength(0);
    expect(result.flags.soft).toHaveLength(0);
  });

  it("has no missing info and a strong score", () => {
    expect(result.missingInfo).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });
});

describe("sketchy sample scan", () => {
  const result = analyzeJob({
    rawText: SAMPLES.sketchy.rawText,
    intake: { ...SAMPLES.sketchy.intake, rate: 0 },
    settings: { name: "", minRate: 0, currency: "PHP" },
  });

  it("gets a Skip verdict with high risk", () => {
    expect(result.verdict).toBe("Skip");
    expect(result.riskLevel).toBe("High");
  });

  it("fires at least one hard flag", () => {
    expect(result.flags.hard.length).toBeGreaterThanOrEqual(1);
  });

  it("caps the fit score at 15", () => {
    expect(result.score).toBeLessThanOrEqual(15);
  });

  it("points out the hours and the day-to-day are missing", () => {
    expect(result.missingInfo).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/samples.test.js`
Expected: FAIL — `Cannot find module './samples.js'` (compile-time RED: the module doesn't exist yet).

- [ ] **Step 3: Commit the failing test**

```bash
git add src/lib/samples.test.js
git commit -m "test: add sample posts with pinned scan outcomes"
```

- [ ] **Step 4: Write the implementation**

Create `src/lib/samples.js`:

```js
// samples.js — two built-in example posts so a first-time visitor can see a
// verdict in seconds, before they trust the tool with a real post.
// Pure data. No React, no DOM, no storage.

export const SAMPLES = {
  clean: {
    key: "clean",
    chip: "A solid-looking post",
    rawText: `Customer Support Specialist (Remote) — Brightwave Solutions

Brightwave Solutions is a US-based e-commerce company looking for a full-time Customer Support Specialist to join our remote support team.

Responsibilities:
- Answer customer questions over email and chat using Zendesk
- Handle refunds, replacements, and order tracking
- Write and improve help-center articles with the team

Requirements:
- At least 1 year of customer support experience
- Strong written English and hands-on Zendesk or similar tools
- A quiet workspace and stable internet connection

Schedule: Full-time, 40 hours per week, flexible day shift on Philippine time.

Pay: ₱45,000 per month, paid twice a month via bank transfer or Wise.

To apply, email careers@brightwave-solutions.com with your resume and a short note about a tricky customer issue you resolved.`,
    intake: {
      role: "Customer Support Specialist",
      skills: "customer support, email, Zendesk",
      experience: "Intermediate",
      rate: "45000",
      rateType: "Monthly",
      hours: "40+",
    },
  },
  sketchy: {
    key: "sketchy",
    chip: "A sketchy-looking post",
    rawText: `EARN ₱8,000 PER DAY!!! WORK FROM HOME, NO EXPERIENCE NEEDED!!!

We are hiring immediately! Only 5 slots left for this ONLINE DATA ENCODER position! Earn ₱8,000 per day — guaranteed income paid weekly!

No interview needed, get hired today! Message us on Telegram at t.me/quickcashph or WhatsApp 0917-XXX-XXXX. Email your full name and a photo of your valid ID to quickcash.hiring@gmail.com to get started.

To activate your account, pay a one-time registration fee of ₱500 via GCash. This covers your training fee and starter kit. Apply now before slots run out!`,
    intake: {
      role: "Data encoder",
      skills: "typing, data entry",
      experience: "Entry-level",
      rate: "",
      rateType: "Not stated",
      hours: "Not stated",
    },
  },
};

export const SAMPLE_KEYS = Object.keys(SAMPLES);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/samples.test.js`
Expected: PASS — 8 tests. (The sample texts were written against `redflags.js`, `missing.js`, and `scoring.js`; if a future rule change breaks one, the failure message tells you exactly which outcome drifted.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/samples.js
git commit -m "feat: add clean and sketchy sample posts"
```

---

### Task 2: Sample chips + collapsible fine-tune fields in ScanForm

Surface the samples as one-click chips above the paste box, and move the four least-essential intake fields (experience, hours, rate, rate basis) behind a disclosure so the first-run form is: paste → Check. Role and skills stay visible because they drive the fit score.

**Files:**
- Modify: `src/components/ScanForm.jsx`

- [ ] **Step 1: Wire the samples into state**

In `ScanForm.jsx`, add the import after line 4:

```js
import { SAMPLES, SAMPLE_KEYS } from "../lib/samples.js";
```

Change the store hook (line 44) from:

```js
const { settings, setResult } = useApp();
```

to:

```js
const { settings, setResult, notify } = useApp();
```

Add state next to the other `useState` calls (after line 54):

```js
const [showFineTune, setShowFineTune] = useState(false);
```

Add the sample applier after `scrollToForm` (after line 93):

```js
// One click fills the whole form from a built-in sample. Fine-tune fields
// open so the user can see (and edit) what was pre-filled for them.
const applySample = (key) => {
  const s = SAMPLES[key];
  if (!s) return;
  setRawText(s.rawText);
  setRole(s.intake.role);
  setSkills(s.intake.skills);
  setExperience(s.intake.experience);
  setRate(s.intake.rate);
  setRateType(s.intake.rateType);
  setHours(s.intake.hours);
  setError("");
  setShowFineTune(true);
  notify("Sample post loaded — hit Check this job.", "info");
};
```

- [ ] **Step 2: Render the sample chips above the paste box**

Inside the `Field` for `rawText`, immediately before the `<div className={\`paste-frame ...\`}>`, insert:

```jsx
<div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
  <span className="text-ink-faint">No post handy?</span>
  {SAMPLE_KEYS.map((key) => (
    <button
      key={key}
      type="button"
      onClick={() => applySample(key)}
      className="rounded-full border border-brand/40 bg-card px-3 py-1.5 font-medium text-brand transition-colors hover:bg-brand hover:text-paper focus-visible:outline-none"
    >
      {SAMPLES[key].chip}
    </button>
  ))}
</div>
```

- [ ] **Step 3: Collapse the fine-tune fields behind a disclosure**

In the existing `<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">`, keep ONLY the `role` and `skills` `Field` blocks. Move the `experience`, `hours`, `rate`, and `rateType` `Field` blocks into a new block placed immediately after that grid:

```jsx
<div>
  <button
    type="button"
    onClick={() => setShowFineTune((v) => !v)}
    aria-expanded={showFineTune}
    aria-controls="fine-tune-fields"
    className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-semibold text-brand hover:text-brand-deep focus-visible:outline-none"
  >
    <span
      aria-hidden="true"
      className={`inline-block transition-transform duration-200 ${showFineTune ? "rotate-90" : ""}`}
    >
      ▸
    </span>
    Fine-tune the score
    <span className="font-normal text-ink-faint">optional — experience, hours, pay</span>
  </button>
  {showFineTune && (
    <div id="fine-tune-fields" className="settle mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
      {/* the moved experience, hours, rate, and rateType Field blocks go here, unchanged */}
    </div>
  )}
</div>
```

- [ ] **Step 4: Verify build + manual check**

Run: `npm run build`
Expected: build succeeds with no errors.

Manual check (`npm run dev`):
1. Home page shows "No post handy?" with two chips above the paste box.
2. Clicking "A sketchy-looking post" fills everything, opens the fine-tune section, shows a toast.
3. Clicking "Check this job" lands on a Skip / High-risk result.
4. With JS reduced-motion emulation on (DevTools → Rendering), the sample flow still works.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScanForm.jsx
git commit -m "feat: one-click sample posts and collapsible fine-tune fields"
```

---

## Phase 2 — The reveal (variable reward)

### Task 3: `useCountUp` hook + score count-up

The fit number counts up from 0 while the ring fills, so the reward builds instead of appearing flat. Under `prefers-reduced-motion` the final number renders immediately.

**Files:**
- Create: `src/hooks/useCountUp.js`
- Modify: `src/components/ResultView.jsx`

- [ ] **Step 1: Write the hook**

Create `src/hooks/useCountUp.js`:

```js
// useCountUp — animates a number from 0 to `target` with an ease-out curve.
// Decorative only: callers render real content regardless, and users who
// prefer reduced motion get the final value on the first frame.
import { useEffect, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useCountUp(target, duration = 950) {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(() => (prefersReducedMotion() ? safeTarget : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(safeTarget);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(safeTarget * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [safeTarget, duration]);

  return value;
}
```

- [ ] **Step 2: Use it in ScoreRing**

In `ResultView.jsx`, add the import after line 4:

```js
import { useCountUp } from "../hooks/useCountUp.js";
```

Inside `ScoreRing`, after the existing `useEffect` block (after line 16), add:

```js
const shown = useCountUp(score);
```

Replace line 36 (`<span className="font-mono text-3xl font-semibold text-ink">{score}</span>`) with:

```jsx
<span className="font-mono text-3xl font-semibold text-ink">{shown}</span>
```

- [ ] **Step 3: Verify build + manual check**

Run: `npm run build`
Expected: build succeeds.

Manual check: scan a sample → the number climbs from 0 to the score in sync with the ring. With reduced-motion emulation, the final score shows instantly.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCountUp.js src/components/ResultView.jsx
git commit -m "feat: count-up fit score synced with the ring"
```

---

### Task 4: Staged inspection ceremony

Sequence the reward: rotating status lines during the check beat (anticipation), then on the result page the ring fills and counts (Task 3) while the verdict stamp slams down LAST. One-line CSS change for the stamp delay.

**Files:**
- Modify: `src/components/ScanForm.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Rotating check lines in ScanForm**

In `ScanForm.jsx`, after the existing `timerRef` line (line 55), add:

```js
// Rotating status lines during the inspection beat. Purely presentational;
// the aria-live caption below the button stays static for screen readers.
const CHECK_LINES = ["Reading the post…", "Scanning for scam signals…", "Scoring the fit…"];
const [checkLine, setCheckLine] = useState(0);

useEffect(() => {
  if (!checking) return undefined;
  setCheckLine(0);
  const id = setInterval(() => setCheckLine((i) => (i + 1) % CHECK_LINES.length), 400);
  return () => clearInterval(id);
}, [checking]);
```

In `handleScan`, change the beat from 750ms to 1150ms (line 87):

```js
timerRef.current = setTimeout(run, 1150);
```

In the scan button, replace the checking label `{checking ? ( ... "Checking this post…" ... ) : (...)}` inner text so it reads:

```jsx
{checking ? (
  <span className="relative z-10 inline-flex items-center justify-center gap-2.5">
    <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-paper" aria-hidden="true" />
    {CHECK_LINES[checkLine]}
  </span>
) : (
  "Check this job"
)}
```

- [ ] **Step 2: Stamp lands last**

In `src/index.css`, find `.stamp-in` (line 127–130) and change the delay:

```css
.stamp-in {
  animation: ag-stamp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: 0.9s; /* slams down after the score ring fills — the payoff frame */
}
```

(The reduced-motion block already zeroes this delay, so nothing changes for those users.)

- [ ] **Step 3: Verify build + manual check**

Run: `npm run build`
Expected: build succeeds.

Manual check: scan the clean sample → button cycles the three status lines → result page: ring fills + number climbs → stamp slams in last. Screenshot-worthy order confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/components/ScanForm.jsx src/index.css
git commit -m "feat: staged inspection ceremony for the verdict reveal"
```

---

## Phase 3 — Return triggers & investment

### Task 5: Follow-up due-date logic

Pure helpers that decide which saved jobs need a nudge. Compared as ISO date strings (they sort correctly). Closed jobs never nudge.

**Files:**
- Create: `src/lib/followups.js`
- Test: `src/lib/followups.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/lib/followups.test.js`:

```js
import { describe, it, expect } from "vitest";
import { followUpState, dueFollowUps, todayLocalISO } from "./followups.js";

const TODAY = "2026-07-18";
const job = (over) => ({ id: "j1", status: "Applied", followUpBy: "", ...over });

describe("followUpState", () => {
  it('returns "none" without a date', () => {
    expect(followUpState(job({ followUpBy: "" }), TODAY)).toBe("none");
  });

  it('returns "none" for closed jobs even when overdue', () => {
    expect(followUpState(job({ status: "Closed", followUpBy: "2026-07-01" }), TODAY)).toBe("none");
  });

  it('returns "overdue" for past dates', () => {
    expect(followUpState(job({ followUpBy: "2026-07-17" }), TODAY)).toBe("overdue");
  });

  it('returns "today" for the exact date', () => {
    expect(followUpState(job({ followUpBy: TODAY }), TODAY)).toBe("today");
  });

  it('returns "upcoming" for future dates', () => {
    expect(followUpState(job({ followUpBy: "2026-07-19" }), TODAY)).toBe("upcoming");
  });

  it("never throws on a malformed job", () => {
    expect(followUpState(null, TODAY)).toBe("none");
    expect(followUpState({ followUpBy: 42 }, TODAY)).toBe("none");
  });
});

describe("dueFollowUps", () => {
  it("keeps only overdue and today", () => {
    const jobs = [
      job({ id: "a", followUpBy: "2026-07-01" }),
      job({ id: "b", followUpBy: TODAY }),
      job({ id: "c", followUpBy: "2026-08-01" }),
      job({ id: "d", followUpBy: "" }),
      job({ id: "e", status: "Closed", followUpBy: "2026-07-01" }),
    ];
    expect(dueFollowUps(jobs, TODAY).map((j) => j.id)).toEqual(["a", "b"]);
  });

  it("returns an empty list for non-arrays", () => {
    expect(dueFollowUps(null, TODAY)).toEqual([]);
  });
});

describe("todayLocalISO", () => {
  it("matches yyyy-mm-dd", () => {
    expect(todayLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/followups.test.js`
Expected: FAIL — `Cannot find module './followups.js'`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/lib/followups.test.js
git commit -m "test: add follow-up due-date logic"
```

- [ ] **Step 4: Write the implementation**

Create `src/lib/followups.js`:

```js
// followups.js — which saved jobs need a follow-up nudge. followUpBy values
// come from <input type="date">, so they are yyyy-mm-dd strings that sort
// correctly as plain strings. No React, no DOM, no storage.

export function followUpState(job, todayISO) {
  if (!job || typeof job !== "object") return "none";
  if (job.status === "Closed") return "none";
  const due = typeof job.followUpBy === "string" ? job.followUpBy : "";
  if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return "none";
  if (due < todayISO) return "overdue";
  if (due === todayISO) return "today";
  return "upcoming";
}

export function dueFollowUps(jobs, todayISO) {
  return (Array.isArray(jobs) ? jobs : []).filter((j) => {
    const state = followUpState(j, todayISO);
    return state === "overdue" || state === "today";
  });
}

export function todayLocalISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/followups.test.js`
Expected: PASS — 9 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/followups.js
git commit -m "feat: follow-up due-date helpers"
```

---

### Task 6: Follow-up nudge card (home) + Tracker nav badge

Surface due follow-ups at the two places a returning user looks first: the home page and the nav. This is the app's only "come back" trigger that doesn't need a server.

**Files:**
- Modify: `src/components/ScanForm.jsx`
- Modify: `src/components/Layout.jsx`

- [ ] **Step 1: Nudge card on the home page**

In `ScanForm.jsx`, add imports:

```js
import { Link } from "react-router-dom";
import { dueFollowUps, todayLocalISO } from "../lib/followups.js";
```

(Note: `useNavigate` is already imported from `react-router-dom` on line 2 — merge `Link` into that same import instead of adding a second line.)

Extend the store hook to include `jobs`:

```js
const { settings, setResult, jobs, notify } = useApp();
```

After the state declarations, compute due jobs (filter returns a fresh array, so sorting it mutates only that copy):

```js
// Oldest-due first, so the nudge names the most overdue job.
const dueJobs = dueFollowUps(jobs, todayLocalISO()).sort((a, b) =>
  a.followUpBy < b.followUpBy ? -1 : 1
);
```

Render the card between the hero `</section>` and the scan `<section id="scan">`:

```jsx
{dueJobs.length > 0 && (
  <Link
    to="/tracker"
    className="rise elev elev-hover flex items-center justify-between gap-3 rounded-2xl border border-warn/40 bg-warn-soft px-5 py-4"
  >
    <p className="text-sm text-warn-ink">
      <span className="font-semibold">
        {dueJobs.length} saved {dueJobs.length === 1 ? "job needs" : "jobs need"} a follow-up.
      </span>{" "}
      Oldest: {dueJobs[0].title || "Untitled job"}.
    </p>
    <span className="shrink-0 font-semibold text-warn-ink">Open tracker →</span>
  </Link>
)}
```

- [ ] **Step 2: Nav badge in Layout**

In `Layout.jsx`, add imports after line 3:

```js
import { useApp } from "../store.jsx";
import { dueFollowUps, todayLocalISO } from "../lib/followups.js";
```

Inside `Layout()`, after `const location = useLocation();`, add:

```js
const { jobs } = useApp();
const dueCount = dueFollowUps(jobs, todayLocalISO()).length;
```

Replace `{item.label}` inside the `NavLink` with:

```jsx
{item.label}
{item.to === "/tracker" && dueCount > 0 && (
  <span
    className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-stop px-1.5 text-[0.65rem] font-bold text-paper"
    role="status"
    aria-label={`${dueCount} follow-up${dueCount === 1 ? "" : "s"} due`}
    title={`${dueCount} follow-up${dueCount === 1 ? "" : "s"} due`}
  >
    {dueCount}
  </span>
)}
```

- [ ] **Step 3: Verify build + manual check**

Run: `npm run build`
Expected: build succeeds.

Manual check: save a job, set its follow-up date to yesterday → home shows the nudge card naming that job; the Tracker nav item shows a "1" badge; set status to Closed → both disappear.

- [ ] **Step 4: Commit**

```bash
git add src/components/ScanForm.jsx src/components/Layout.jsx
git commit -m "feat: follow-up nudge card and tracker nav badge"
```

---

### Task 7: Tracker stats strip

Numbers that turn the tracker into a progress story ("2 high-risk dodged") — investment the user built up, shown back to them.

**Files:**
- Create: `src/lib/stats.js`
- Test: `src/lib/stats.test.js`
- Modify: `src/components/Tracker.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/stats.test.js`:

```js
import { describe, it, expect } from "vitest";
import { trackerStats } from "./stats.js";

const job = (over) => ({ id: "j", riskLevel: "Low", status: "Saved", ...over });

describe("trackerStats", () => {
  it("returns zeros for an empty tracker", () => {
    expect(trackerStats([])).toEqual({
      total: 0,
      highRisk: 0,
      applied: 0,
      interviews: 0,
      offers: 0,
    });
  });

  it("returns zeros for non-arrays", () => {
    expect(trackerStats(null).total).toBe(0);
  });

  it("counts each category", () => {
    const jobs = [
      job({ id: "a", riskLevel: "High" }),
      job({ id: "b", riskLevel: "High", status: "Closed" }),
      job({ id: "c", status: "Applied" }),
      job({ id: "d", status: "Interview" }),
      job({ id: "e", status: "Offer" }),
      job({ id: "f" }),
    ];
    expect(trackerStats(jobs)).toEqual({
      total: 6,
      highRisk: 2,
      applied: 1,
      interviews: 1,
      offers: 1,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/stats.test.js`
Expected: FAIL — `Cannot find module './stats.js'`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/lib/stats.test.js
git commit -m "test: add tracker stats"
```

- [ ] **Step 4: Write the implementation**

Create `src/lib/stats.js`:

```js
// stats.js — small numbers that make the tracker feel like progress.
// Derived from the saved jobs at render time; nothing extra is stored.

export function trackerStats(jobs) {
  const list = Array.isArray(jobs) ? jobs : [];
  const count = (fn) => list.filter((j) => j && typeof j === "object" && fn(j)).length;
  return {
    total: list.filter((j) => j && typeof j === "object").length,
    highRisk: count((j) => j.riskLevel === "High"),
    applied: count((j) => j.status === "Applied"),
    interviews: count((j) => j.status === "Interview"),
    offers: count((j) => j.status === "Offer"),
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/stats.test.js`
Expected: PASS — 3 tests.

- [ ] **Step 6: Render the strip in Tracker**

In `Tracker.jsx`, add the import after line 4:

```js
import { trackerStats } from "../lib/stats.js";
```

Inside `Tracker()`, after the `const { jobs, updateJob, deleteJob, notify } = useApp();` line, add:

```js
const stats = trackerStats(jobs);
```

Immediately after the header `<div>` that ends with the "Scan a job" Link (after line 137), insert:

```jsx
{stats.total > 0 && (
  <ul className="flex flex-wrap gap-2 text-xs font-medium">
    <li className="rounded-full bg-panel px-3 py-1 text-ink-soft">
      {stats.total} saved
    </li>
    {stats.highRisk > 0 && (
      <li className="rounded-full bg-stop-soft px-3 py-1 text-stop-ink">
        {stats.highRisk} high-risk dodged
      </li>
    )}
    {stats.applied > 0 && (
      <li className="rounded-full bg-go-soft px-3 py-1 text-go-ink">
        {stats.applied} applied
      </li>
    )}
    {stats.interviews > 0 && (
      <li className="rounded-full bg-warn-soft px-3 py-1 text-warn-ink">
        {stats.interviews} {stats.interviews === 1 ? "interview" : "interviews"}
      </li>
    )}
    {stats.offers > 0 && (
      <li className="rounded-full bg-go-soft px-3 py-1 text-go-ink">
        {stats.offers} {stats.offers === 1 ? "offer" : "offers"}
      </li>
    )}
  </ul>
)}
```

- [ ] **Step 7: Verify build + commit**

Run: `npm run build`
Expected: build succeeds.

```bash
git add src/lib/stats.js src/components/Tracker.jsx
git commit -m "feat: tracker progress stats strip"
```

---

## Phase 4 — Sharing & distribution

### Task 8: "Copy verdict summary" (privacy-safe share loop)

Filipino remote-work communities live in Facebook/Discord groups. A one-tap text summary lets users warn each other ("this post got SKIP, watch out") — word of mouth that sends new users to the tool. The summary deliberately excludes the pasted post.

**Files:**
- Create: `src/lib/clipboard.js`
- Create: `src/lib/share.js`
- Test: `src/lib/share.test.js`
- Modify: `src/components/ResultView.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/lib/share.test.js`:

```js
import { describe, it, expect } from "vitest";
import { buildShareSummary } from "./share.js";

const base = {
  title: "Customer Support Specialist",
  verdict: "Skip",
  score: 12,
  riskLevel: "High",
  rawText: "SECRET-POST-TEXT-12345 should never leak",
  flags: {
    hard: [
      { id: "h1", label: "Asks you to pay a fee" },
      { id: "h2", label: "Promises guaranteed income" },
    ],
    soft: [
      { id: "s1", label: "Pushes you to WhatsApp / Telegram" },
      { id: "s2", label: "Uses a personal email, not a company one" },
    ],
  },
  missingInfo: ["hours?", "duties?"],
};

describe("buildShareSummary", () => {
  const out = buildShareSummary(base, "https://example.com");

  it("includes verdict, score, risk, and title", () => {
    expect(out).toContain("SKIP");
    expect(out).toContain("12/100");
    expect(out).toContain("high risk");
    expect(out).toContain("Customer Support Specialist");
  });

  it("caps the watch-out list at 3 flags", () => {
    expect(out).toContain("Asks you to pay a fee");
    expect(out).not.toContain("personal email");
  });

  it("mentions open questions", () => {
    expect(out).toContain("2 key questions");
  });

  it("never leaks the pasted post", () => {
    expect(out).not.toContain("SECRET-POST-TEXT-12345");
  });

  it("appends the origin link when given", () => {
    expect(out).toContain("https://example.com");
  });

  it("omits the origin line when not given", () => {
    expect(buildShareSummary(base)).not.toContain("Check a post yourself");
  });

  it("survives an empty result object", () => {
    expect(() => buildShareSummary({})).not.toThrow();
  });

  it('uses singular "question" for one open point', () => {
    expect(buildShareSummary({ ...base, missingInfo: ["hours?"] })).toContain("1 key question");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/share.test.js`
Expected: FAIL — `Cannot find module './share.js'`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/lib/share.test.js
git commit -m "test: add privacy-safe verdict share summary"
```

- [ ] **Step 4: Write the implementations**

Create `src/lib/clipboard.js`:

```js
// clipboard.js — copy text with a legacy fallback. Returns true on success.
// (DOM-coupled by nature; covered by manual verification, not unit tests.)
export async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}
```

Create `src/lib/share.js`:

```js
// share.js — a plain-text verdict summary for pasting into group chats and
// posts. NEVER includes the raw job post: that's the user's data, and the
// summary is meant to be broadcast.

const VERDICT_WORD = { Apply: "APPLY", Caution: "CAUTION", Skip: "SKIP" };

export function buildShareSummary(job, origin = "") {
  const safe = job && typeof job === "object" ? job : {};
  const verdict = VERDICT_WORD[safe.verdict] || "CAUTION";
  const score = Number.isFinite(safe.score) ? safe.score : 0;
  const risk = typeof safe.riskLevel === "string" ? safe.riskLevel.toLowerCase() : "unknown";
  const title = (typeof safe.title === "string" && safe.title.trim()) || "a remote job post";

  const hard = Array.isArray(safe.flags?.hard) ? safe.flags.hard : [];
  const soft = Array.isArray(safe.flags?.soft) ? safe.flags.soft : [];
  const flags = [...hard, ...soft].slice(0, 3).map((f) => f.label).filter(Boolean);
  const missing = Array.isArray(safe.missingInfo) ? safe.missingInfo.length : 0;

  const lines = [
    `I checked "${title}" with ApplyGuard PH (free, no sign-up):`,
    `Verdict: ${verdict} — fit ${score}/100, ${risk} risk.`,
  ];
  if (flags.length) lines.push(`Watch out: ${flags.join("; ")}.`);
  if (missing) {
    lines.push(`The post also leaves ${missing} key ${missing === 1 ? "question" : "questions"} open.`);
  }
  lines.push("Always verify the employer yourself before sharing personal details or paying anything.");
  if (origin) lines.push(`Check a post yourself: ${origin}`);
  return lines.join("\n");
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/share.test.js`
Expected: PASS — 8 tests.

- [ ] **Step 6: Wire the button + refactor copyPrompt**

In `ResultView.jsx`, add imports after line 4:

```js
import { copyTextToClipboard } from "../lib/clipboard.js";
import { buildShareSummary } from "../lib/share.js";
```

Replace the entire `copyPrompt` function (lines 144–161) with:

```js
const copyPrompt = async () => {
  const ok = await copyTextToClipboard(data.prompt);
  if (ok) {
    markCopied();
  } else {
    notify("Couldn't copy automatically. Select the text and copy it.", "error");
  }
};

const [shared, setShared] = useState(false);
const handleShare = async () => {
  const ok = await copyTextToClipboard(buildShareSummary(data, window.location.origin));
  if (!ok) {
    notify("Couldn't copy automatically. Try again.", "error");
    return;
  }
  notify("Verdict summary copied. Paste it anywhere.", "success");
  setShared(true);
  setTimeout(() => setShared(false), 1900);
};
```

(Move the `const [shared, setShared] = useState(false);` line up next to the existing `const [copied, setCopied] = useState(false);` so hooks stay at the top of the component.)

Add the share button to the top row, immediately after the "← Scan another" Link:

```jsx
<button
  type="button"
  onClick={handleShare}
  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand focus-visible:outline-none"
  aria-live="polite"
>
  <span aria-hidden="true">{shared ? "✓" : "⧉"}</span>
  {shared ? "Copied" : "Copy verdict summary"}
</button>
```

Wrap that top row's children in a flex container if needed: change the row `<div className="flex items-center justify-between gap-3">` to `<div className="flex flex-wrap items-center justify-between gap-3">` so it doesn't crowd small screens.

- [ ] **Step 7: Verify build + manual check**

Run: `npm run build`
Expected: build succeeds.

Manual check: scan the sketchy sample → "Copy verdict summary" → clipboard contains the verdict, 3 watch-outs, open-questions line, and the site origin — and NOT the post text. "Copy prompt" still works.

- [ ] **Step 8: Commit**

```bash
git add src/lib/clipboard.js src/lib/share.js src/components/ResultView.jsx
git commit -m "feat: copy verdict summary for sharing"
```

---

### Task 9: Social meta + PWA manifest + share card

When the site link is dropped into a Facebook group (this audience's main channel), the link preview IS the landing page. Also make the site installable so it earns a home-screen slot.

**Files:**
- Modify: `index.html`
- Create: `public/manifest.webmanifest`
- Create: `public/og-cover.svg` (design source; exported to `public/og-cover.png`)

- [ ] **Step 1: Create the social card source**

Create `public/og-cover.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f4efe4"/>
  <rect x="40" y="40" width="1120" height="550" rx="28" fill="#fffdf7" stroke="#ddd3bf" stroke-width="2"/>
  <g transform="translate(90,86) scale(1.35)">
    <path d="M32 6 L54 14 V32 C54 46 44 55 32 59 C20 55 10 46 10 32 V14 Z" fill="#0b6e5f"/>
    <path d="M22 33 L29.5 40.5 L43 25" fill="none" stroke="#f4efe4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="195" y="142" font-family="Fraunces, Georgia, serif" font-size="42" font-weight="600" fill="#1b1a17">ApplyGuard PH</text>
  <text x="90" y="290" font-family="Fraunces, Georgia, serif" font-size="68" font-weight="600" fill="#1b1a17">Is this remote job worth</text>
  <text x="90" y="372" font-family="Fraunces, Georgia, serif" font-size="68" font-weight="600" fill="#1b1a17">applying to, or a trap?</text>
  <g font-family="Hanken Grotesk, system-ui, sans-serif" font-size="23" font-weight="600">
    <rect x="90" y="428" width="222" height="52" rx="26" fill="#e3f1e6"/>
    <text x="201" y="462" text-anchor="middle" fill="#155d33">Apply — go for it</text>
    <rect x="332" y="428" width="252" height="52" rx="26" fill="#fae9c9"/>
    <text x="458" y="462" text-anchor="middle" fill="#8a4d05">Caution — check first</text>
    <rect x="604" y="428" width="240" height="52" rx="26" fill="#f8e0db"/>
    <text x="724" y="462" text-anchor="middle" fill="#8a261b">Skip — not worth it</text>
  </g>
  <text x="90" y="545" font-family="Hanken Grotesk, system-ui, sans-serif" font-size="26" fill="#4a4842">Free job-post checker for Filipino remote workers. No sign-up — runs in your browser.</text>
</svg>
```

- [ ] **Step 2: Export the PNG**

Facebook/Twitter do not render SVG share images. Convert once:

1. Open `public/og-cover.svg` in a browser.
2. Screenshot/export at exactly 1200×630 (any SVG→PNG tool works).
3. Save as `public/og-cover.png`.

Verify: `Test-Path public/og-cover.png` is `True`.

- [ ] **Step 3: Create the manifest**

Create `public/manifest.webmanifest`:

```json
{
  "name": "ApplyGuard PH — Check a remote job before you apply",
  "short_name": "ApplyGuard",
  "description": "Free, no-login job-post checker for Filipino remote job seekers.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#f4efe4",
  "theme_color": "#0b6e5f",
  "icons": [
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

- [ ] **Step 4: Add the meta tags**

In `index.html`, after the existing `<meta name="theme-color" content="#0b6e5f" />` (line 10), insert:

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="ApplyGuard PH — Check a remote job before you apply" />
<meta
  property="og:description"
  content="Free, no-login checker that flags scam signals and scores fit before you apply. Built for Filipino remote job seekers."
/>
<meta property="og:image" content="/og-cover.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="ApplyGuard PH — Check a remote job before you apply" />
<meta
  name="twitter:description"
  content="Free, no-login checker that flags scam signals and scores fit before you apply. Built for Filipino remote job seekers."
/>
<meta name="twitter:image" content="/og-cover.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

**Post-deploy follow-up (not part of this task):** once the production domain is known, switch `og:image`/`twitter:image` to absolute URLs and add `og:url` — crawlers resolve relative paths inconsistently.

- [ ] **Step 5: Verify build + manual check**

Run: `npm run build`
Expected: build succeeds; `dist/manifest.webmanifest` and `dist/og-cover.png` exist.

Manual check: `npm run preview`, view-source the page → meta tags present; DevTools → Application → Manifest loads without errors.

- [ ] **Step 6: Commit**

```bash
git add index.html public/manifest.webmanifest public/og-cover.svg public/og-cover.png
git commit -m "feat: social share meta, og card, and PWA manifest"
```

---

## Phase 5 — Docs & verification

### Task 10: README + full verification loop

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README**

In the "How it works" bullet list of `README.md`, add after the `src/lib/storage.js` bullet:

```markdown
- `src/lib/samples.js` — built-in clean/sketchy example posts for one-click demos.
- `src/lib/followups.js` — follow-up due-date helpers powering the home nudge + nav badge.
- `src/lib/stats.js` — tracker progress numbers, derived from saved jobs at render time.
- `src/lib/share.js` — privacy-safe verdict summaries (never includes the pasted post).
- `src/lib/clipboard.js` — clipboard copy with a legacy fallback.
```

And append to the intro paragraph's feature list (line 5-6), after "a copy-paste prompt for your own ChatGPT / Claude / Gemini":

```markdown
Plus: one-click sample posts, follow-up reminders, and a shareable verdict summary.
```

- [ ] **Step 2: Full verification**

Run, in order:

```bash
npm test
npm run build
```

Expected: all existing + new tests pass (scoring, redflags, missing, csv, samples, followups, stats, share); build succeeds with no errors or new warnings.

Final manual pass (`npm run dev`), confirming the whole hook loop:
1. First visit → click "A sketchy-looking post" → Check → staged reveal → Skip verdict with stamp landing last.
2. Save to tracker → set follow-up to yesterday → home shows nudge card, nav shows badge.
3. Tracker shows stats strip.
4. Result page → "Copy verdict summary" → no post text in clipboard.
5. DevTools reduced-motion emulation → everything still works, all content immediately visible.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document hook-driven frontend additions"
```

---

## Out of scope (deliberate)

- **Service worker / offline caching** — the manifest earns installability; a SW can follow once asset-hashing strategy is decided.
- **Schema v2 (scan counters, streaks)** — current stats derive from saved jobs only. If unsaved-scan stats are wanted later, migrate via the existing `migrate()` seam in `storage.js`.
- **Component-test stack (React Testing Library)** — repo convention is pure-lib tests; revisit separately.
- **Absolute OG URLs / `og:url`** — blocked on knowing the production domain (see Task 9 follow-up).
- **Offers checkout** — monetization links stay inert until real store pages exist (per README policy).

## Self-review

- **Spec coverage:** Trigger (Tasks 5–6, 9), Action (1–2), Variable reward (3–4), Investment (7, plus 5–6), Share loop (8, 9). Every hook phase has a shipping task.
- **Placeholder scan:** none — every code step contains complete code; the only manual artifact (og-cover.png export) has exact steps and a verification command.
- **Type consistency:** `SAMPLES`/`SAMPLE_KEYS` (Task 1↔2), `useCountUp` (3), `dueFollowUps`/`todayLocalISO` (5↔6), `trackerStats` (7), `copyTextToClipboard`/`buildShareSummary` (8) — names match across tasks. Sample `intake.rate` is a string in `samples.js` because ScanForm state stores rate as a string; tests convert to a number, matching `handleScan`'s `Number(rate) || 0`.
