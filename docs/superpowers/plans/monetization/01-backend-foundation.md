# Phase 1 — Backend Foundation (Supabase schema + entitlement logic)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax. Read `00-architecture.md` first.

**Goal:** Supabase project wired to the SPA, all tables + RLS live, and the pure entitlement-mapping logic (used later by the webhook) tested.

**Architecture:** One migration file creates `profiles`, `jobs`, `entitlements`, `payments`, `ai_usage` with RLS. A trigger provisions rows on first auth signup. The SPA gets an env-driven Supabase client that degrades to `null` when unconfigured — the app must keep working as a purely local tool when the backend isn't set up.

**Tech Stack:** Supabase (hosted), supabase-js v2, Vitest.

---

### Task 1: External prerequisites (human steps)

No code. These unblock everything else — start them FIRST because #3 takes days.

- [ ] **Step 1: Create the Supabase project** at supabase.com (free tier). Note: project URL, `anon` public key, `service_role` secret key (Settings → API).
- [ ] **Step 2: Create the PayMongo account** (paymongo.com), complete business verification, and grab the **test-mode** secret key (`sk_test_...`).
- [ ] **Step 3: Email PayMongo support to enable the Subscriptions capability** on the account (required — subscriptions return errors until enabled; see `00-architecture.md` §4.2).
- [ ] **Step 4: Create an Anthropic API key** at console.anthropic.com.
- [ ] **Step 5: Install the Supabase CLI** for migrations/functions:

```bash
npm install --save-dev supabase
npx supabase --version
```

Expected: version prints. (Docker is OPTIONAL — this plan works hosted-only: `npx supabase link` + `db push`. Do not run `supabase start` unless Docker exists.)

- [ ] **Step 6: Commit the CLI dev dependency**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase CLI as dev dependency"
```

---

### Task 2: Supabase client singleton + env scaffolding

**Files:**
- Create: `src/lib/supabase.js`
- Modify: `.gitignore`
- Modify: `package.json` (dependency)
- Create: `.env.example`

- [ ] **Step 1: Install supabase-js**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: Write the client**

`src/lib/supabase.js`:

```js
// supabase.js — the one browser client. Returns null when the backend isn't
// configured, so the app keeps working as a purely local tool (the free tier
// must never depend on the backend existing).
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true, // magic-link return
        },
      })
    : null;

export const backendEnabled = supabase !== null;
```

- [ ] **Step 3: Create `.env.example`**

```
# Copy to .env.local and fill in from your Supabase project (Settings → API).
# Without these the app runs fully local-only (free tier).
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

- [ ] **Step 4: Ensure `.gitignore` excludes env files**

Verify `.gitignore` contains (add if missing):

```
.env
.env.local
.env.*.local
```

- [ ] **Step 5: Create `.env.local` locally (do NOT commit)** with the real values from Task 1.

- [ ] **Step 6: Verify build + commit**

Run: `npm run build`
Expected: build succeeds; no behavior change yet.

```bash
git add src/lib/supabase.js .env.example .gitignore package.json package-lock.json
git commit -m "feat: supabase client with local-only fallback"
```

---

### Task 3: Database schema migration

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Link the CLI to the hosted project**

```bash
npx supabase link --project-ref YOUR-PROJECT-REF
```

- [ ] **Step 2: Write the migration**

`supabase/migrations/0001_init.sql`:

```sql
-- 0001_init.sql — monetization schema. All user data is protected by RLS;
-- entitlements/payments/ai_usage are writable only via the service role
-- (edge functions), never from the browser.

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  min_rate integer not null default 0,
  currency text not null default 'PHP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── jobs (cloud mirror of the tracker) ──────────────────────────────────
create table if not exists public.jobs (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_user_updated_idx on public.jobs (user_id, updated_at desc);

-- ── entitlements (service-role writes ONLY) ─────────────────────────────
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  status text not null default 'none' check (status in ('none', 'active', 'past_due', 'cancelled')),
  provider text,
  provider_subscription_id text,
  provider_customer_id text,
  current_period_end date,
  updated_at timestamptz not null default now()
);

-- ── payments (audit + idempotency; service-role writes ONLY) ────────────
create table if not exists public.payments (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  provider text not null,
  provider_payment_id text not null unique,
  kind text not null check (kind in ('subscription_cycle', 'manual_renewal', 'one_time')),
  amount integer not null,
  currency text not null default 'PHP',
  status text not null,
  created_at timestamptz not null default now()
);

-- ── ai_usage (quota metering; service-role writes ONLY) ─────────────────
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null check (feature in ('message', 'deepscan', 'resume', 'interview')),
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_month_idx on public.ai_usage (user_id, created_at desc);

-- ── provision rows on first signup ──────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.entitlements (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.entitlements enable row level security;
alter table public.payments enable row level security;
alter table public.ai_usage enable row level security;

-- profiles: owner read/write
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- jobs: owner full access
create policy "jobs_select_own" on public.jobs for select using (auth.uid() = user_id);
create policy "jobs_insert_own" on public.jobs for insert with check (auth.uid() = user_id);
create policy "jobs_update_own" on public.jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "jobs_delete_own" on public.jobs for delete using (auth.uid() = user_id);

-- entitlements: owner READ ONLY (writes are service-role only — no write policies)
create policy "entitlements_select_own" on public.entitlements for select using (auth.uid() = user_id);

-- payments: owner READ ONLY
create policy "payments_select_own" on public.payments for select using (auth.uid() = user_id);

-- ai_usage: owner READ ONLY (for "N of 60 uses left" UI)
create policy "ai_usage_select_own" on public.ai_usage for select using (auth.uid() = user_id);
```

- [ ] **Step 3: Push the migration**

```bash
npx supabase db push
```

Expected: `Applying migration 0001_init.sql...` with no errors.

- [ ] **Step 4: Verify tables + RLS in the Supabase dashboard**

Table editor shows the 5 tables; each shows "RLS enabled". Commit:

```bash
git add supabase/migrations/0001_init.sql supabase/config.toml
git commit -m "feat: monetization schema with RLS"
```

---

### Task 4: Entitlement mapping logic (TDD)

The webhook (Phase 3) and the SPA both need one pure answer: given an entitlement row + today's date, what tier is the user *right now*? Past-due gets a grace window (still premium); period end flips to free.

**Files:**
- Create: `src/lib/entitlement.js`
- Test: `src/lib/entitlement.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/entitlement.test.js`:

```js
import { describe, it, expect } from "vitest";
import { effectiveTier, monthlyUsage, AI_MONTHLY_CAP } from "./entitlement.js";

const NOW = new Date("2026-07-18T12:00:00Z");
const row = (over) => ({
  tier: "free",
  status: "none",
  current_period_end: null,
  ...over,
});

describe("effectiveTier", () => {
  it("is free with no row", () => {
    expect(effectiveTier(null, NOW)).toBe("free");
  });

  it("is free for a default free row", () => {
    expect(effectiveTier(row(), NOW)).toBe("free");
  });

  it("is premium when active and within the paid period", () => {
    expect(
      effectiveTier(row({ tier: "premium", status: "active", current_period_end: "2026-08-01" }), NOW)
    ).toBe("premium");
  });

  it("stays premium while past_due (grace — PayMongo retries 3x)", () => {
    expect(
      effectiveTier(row({ tier: "premium", status: "past_due", current_period_end: "2026-08-01" }), NOW)
    ).toBe("premium");
  });

  it("flips to free once the paid period has passed", () => {
    expect(
      effectiveTier(row({ tier: "premium", status: "active", current_period_end: "2026-07-01" }), NOW)
    ).toBe("free");
  });

  it("treats the period-end date itself as still paid", () => {
    expect(
      effectiveTier(row({ tier: "premium", status: "active", current_period_end: "2026-07-18" }), NOW)
    ).toBe("premium");
  });

  it("stays premium when cancelled but still within the paid period", () => {
    // Cancelling stops FUTURE charges; the user keeps what they already paid for.
    expect(
      effectiveTier(row({ tier: "premium", status: "cancelled", current_period_end: "2026-08-01" }), NOW)
    ).toBe("premium");
  });

  it("is free when cancelled and the paid period has passed", () => {
    expect(
      effectiveTier(row({ tier: "premium", status: "cancelled", current_period_end: "2026-07-01" }), NOW)
    ).toBe("free");
  });

  it("is premium for a manual GCash renewal with no provider status", () => {
    expect(
      effectiveTier(row({ tier: "premium", status: "active", current_period_end: "2026-08-17" }), NOW)
    ).toBe("premium");
  });
});

describe("monthlyUsage", () => {
  const at = (iso) => ({ created_at: iso });

  it("counts only the current calendar month", () => {
    const rows = [at("2026-07-01T00:00:00Z"), at("2026-07-18T01:00:00Z"), at("2026-06-30T23:59:00Z")];
    expect(monthlyUsage(rows, NOW)).toBe(2);
  });

  it("is zero for empty input", () => {
    expect(monthlyUsage([], NOW)).toBe(0);
    expect(monthlyUsage(null, NOW)).toBe(0);
  });

  it("exposes the cap", () => {
    expect(AI_MONTHLY_CAP).toBe(60);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/entitlement.test.js`
Expected: FAIL — `Cannot find module './entitlement.js'`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/lib/entitlement.test.js
git commit -m "test: entitlement tier and usage mapping"
```

- [ ] **Step 4: Write the implementation**

`src/lib/entitlement.js`:

```js
// entitlement.js — the ONE place that answers "is this user premium right
// now?" Used by the SPA (display) and mirrored by the webhook (Phase 3).
// A date-only current_period_end is compared as yyyy-mm-dd, which sorts
// correctly as a string. No React, no DOM, no storage.

export const AI_MONTHLY_CAP = 60;

const toISODate = (d) => d.toISOString().slice(0, 10);

export function effectiveTier(row, now = new Date()) {
  if (!row || typeof row !== "object") return "free";
  if (row.tier !== "premium") return "free";
  const end = typeof row.current_period_end === "string" ? row.current_period_end : "";
  if (!end) return "free";
  // Status (active / past_due / cancelled) only narrates WHY. The paid-through
  // date is the actual gate: premium holds until the date itself has passed,
  // which covers both the past_due grace window and cancel-at-period-end.
  return end >= toISODate(now) ? "premium" : "free";
}

export function monthlyUsage(rows, now = new Date()) {
  if (!Array.isArray(rows)) return 0;
  const monthPrefix = now.toISOString().slice(0, 7); // "2026-07"
  return rows.filter(
    (r) => r && typeof r.created_at === "string" && r.created_at.startsWith(monthPrefix)
  ).length;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/entitlement.test.js`
Expected: PASS — 12 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/entitlement.js
git commit -m "feat: entitlement tier and monthly usage helpers"
```

---

### Task 5: RLS probes + final verification

- [ ] **Step 1: Verify RLS blocks browser writes to entitlements**

In the Supabase dashboard SQL editor, run (simulating the anon role):

```sql
set local role authenticated;
-- should fail with "new row violates row-level security policy":
insert into public.entitlements (user_id, tier) values (auth.uid(), 'premium');
reset role;
```

Expected: ERROR `new row violates row-level security policy` — proving a browser can never self-upgrade.

- [ ] **Step 2: Full test suite + build**

```bash
npm test
npm run build
```

Expected: all tests pass (existing 89 + 12 new); build succeeds.

- [ ] **Step 3: Commit any stragglers**

```bash
git status --short   # should show nothing untracked except .env.local (gitignored)
```

---

**Phase 1 done when:** migration pushed, RLS verified, entitlement tests green, app still builds and works exactly as before for a logged-out user.
