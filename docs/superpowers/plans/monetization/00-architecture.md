# Monetization Architecture — Accounts, Subscriptions, AI Features

> **For agentic workers:** This is the architecture foundation for the monetization plan set. Read it before executing any phase plan. Phase plans: `01-backend-foundation.md`, `02-accounts-and-sync.md`, `03-subscriptions-paymongo.md`, `04-ai-features.md`. Execute in order.

**Goal:** Add optional accounts (cloud sync), premium subscriptions (PayMongo), and four server-side AI features (Anthropic) to ApplyGuard PH — without breaking the brand promise that the core scanner stays free, no-login, and fully client-side.

**Locked decisions (user-approved, 2026-07-18):**

| Decision | Choice | Rationale |
|---|---|---|
| Backend | **Supabase** (Auth + Postgres + RLS + Edge Functions) | No server to run; free tier; magic-link auth; Deno edge functions for webhooks/AI proxy; pairs with the existing Netlify static SPA |
| Payments | **PayMongo** | PH-native. Subscriptions API (card + Maya auto-recurring) + Checkout Sessions (GCash one-time/manual renewal) |
| LLM | **Anthropic** | Messages API from the edge proxy; key stays server-side; default model `claude-haiku-4-5` (cost), env-configurable |
| AI features | **All four**: AI message generator, AI deep scan, Resume tailoring, Interview prep | One proxy + one React pattern, configured 4× — not 4 architectures |

---

## 1. The non-negotiable: the free tier stays untouched

The current README promises: *"No sign-up. No subscription. Everything runs in your browser."* Breaking that promise would kill the trust that makes users recommend the tool. So:

- **The scanner, verdict, tracker, and prompt-copy stay 100% client-side and ungated.** A logged-out user loses nothing that exists today.
- **Accounts are opt-in.** Their only free benefit is cloud sync of tracker + settings across devices.
- **Premium gates ONLY the four AI features.** Those are new value, not relocated existing value.
- **AI calls send the job post to the server.** This is a real privacy change: the UI must say so plainly at the point of use ("This feature sends the post to our AI provider to generate the result. Nothing is stored."), the result page keeps the free copy-prompt path as the default, and the README privacy section is rewritten (Phase 4 task).

## 2. System map

```
┌─────────────────────────────┐
│  Netlify (static SPA)       │
│  React + supabase-js        │
│  VITE_SUPABASE_URL/ANON_KEY │
└───────┬───────────┬─────────┘
        │ HTTPS (user JWT)      │ redirects
        ▼                       ▼
┌─────────────────────────────┐     ┌──────────────────────────┐
│  Supabase                   │     │  PayMongo                │
│  • Auth (magic link)        │     │  • Subscriptions (card,  │
│  • Postgres + RLS           │◄────│    Maya recurring)       │
│  • Edge Functions (Deno):   │web- │  • Checkout Sessions     │
│    - paymongo-webhook       │hook │    (GCash one-time)      │
│    - create-checkout        │     └──────────────────────────┘
│    - cancel-subscription    │
│    - ai-proxy               │     ┌──────────────────────────┐
│      (entitlement + quota   │────►│  Anthropic Messages API  │
│       check, then Claude)   │     │  claude-haiku-4-5        │
└─────────────────────────────┘     └──────────────────────────┘
```

**Trust boundary:** the browser is untrusted. Tier/entitlement is ONLY ever written by `paymongo-webhook` (service role). The SPA reads its own entitlement via RLS but cannot write it. AI quota checks happen inside `ai-proxy` on every call. Nothing the client says about its own tier is ever believed.

## 3. Data model (Supabase, schema v2 — cloud only)

`localStorage` stays the offline source of truth (schema v1, unchanged). These tables exist only in Supabase:

```sql
profiles      (id uuid PK → auth.users, display_name text, min_rate int,
               currency text, created_at, updated_at)
jobs          (id text PK, user_id uuid FK → profiles, payload jsonb,
               updated_at timestamptz, created_at timestamptz)   -- cloud mirror of tracker
entitlements  (user_id uuid PK → auth.users,
               tier text NOT NULL DEFAULT 'free',                 -- 'free' | 'premium'
               status text NOT NULL DEFAULT 'none',               -- none|active|past_due|cancelled
               provider text,                                     -- 'paymongo'
               provider_subscription_id text,                     -- subs_xxx
               provider_customer_id text,                         -- cus_xxx
               current_period_end date,                           -- paid-up-through date
               updated_at timestamptz)
payments      (id bigint generated always as identity PK,
               user_id uuid, provider text, provider_payment_id text UNIQUE, -- idempotency key
               kind text,                       -- 'subscription_cycle' | 'manual_renewal' | 'one_time'
               amount int, currency text, status text, created_at timestamptz)
ai_usage      (id bigint generated always as identity PK,
               user_id uuid, feature text,      -- 'message' | 'deepscan' | 'resume' | 'interview'
               tokens_in int, tokens_out int, created_at timestamptz)
```

RLS: enabled on every table. Users `SELECT` their own rows everywhere. Users can `INSERT/UPDATE/DELETE` only `profiles` and `jobs` (their own). `entitlements`, `payments`, `ai_usage` are **written exclusively by edge functions using the service-role key** — the anon key gets no write policies at all.

## 4. Core flows

### 4.1 Sign-in (magic link)
`supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: <site>/account } })` → user clicks email link → session in localStorage → on first login, a DB trigger creates the `profiles` + `entitlements` rows; the SPA offers to merge localStorage tracker into the cloud.

### 4.2 Subscribe (card / Maya, auto-recurring)
1. SPA → `create-checkout` edge fn `{ plan: "monthly" | "yearly" }` with user JWT.
2. Edge fn: get-or-create PayMongo Customer → ensure PayMongo Plan exists → create PayMongo Subscription → retrieve its first invoice → **Pay open invoice** → return the payment URL.
3. SPA redirects the user to that URL; user pays (this also vaults the card).
4. PayMongo → `paymongo-webhook`: `subscription.activated` → set entitlement `tier=premium, status=active, current_period_end=next_billing_schedule`.
5. Each cycle: `subscription.invoice.paid` → extend `current_period_end`; `subscription.past_due` → `status=past_due` (grace, still premium); `subscription.unpaid` → `tier=free`.
6. Cancel: SPA → `cancel-subscription` edge fn → `DELETE /v1/subscriptions/{id}` → entitlement stays premium until `current_period_end`, then `subscription.updated`/`unpaid` event flips it to free.

### 4.3 GCash path (manual renewal — GCash cannot auto-recur)
PayMongo subscriptions support **cards and Maya only**. GCash users buy 30 days at a time:
1. SPA → `create-checkout` edge fn `{ plan: "gcash_30d" }` → creates a one-time **Checkout Session** (`payment_method_types: ["gcash"]`, `reference_number` = our `manual_renewal:<user_id>:<timestamp>`, `metadata.user_id`).
2. User pays on the hosted page → webhook `payment.paid` → idempotent insert into `payments` (unique `provider_payment_id`) → set `current_period_end = max(current_period_end, today) + 30 days`, `tier=premium, status=active`.
3. UX labels this honestly: "30 days of Premium — renew manually with GCash."

### 4.4 AI call (all four features share this)
1. SPA → `ai-proxy` edge fn `{ feature, rawText, intake, settings, extra }` with user JWT.
2. Edge fn: verify JWT → load entitlement (`tier=premium` and `current_period_end >= today`) → check monthly usage < cap → build prompt server-side → call Anthropic → insert `ai_usage` row → return `{ text, remaining }`.
3. Errors surface as friendly UI states: `402 not premium`, `429 quota exhausted`, `500 provider error`.
4. **The post text is never stored server-side.** Only token counts land in `ai_usage`. Say this in the UI.

## 5. Quotas & cost math

Premium cap: **60 AI calls / user / month** (shared pool across the 4 features), metered by `ai_usage` rows in the current calendar month.

Claude Haiku at ~$0.25/M input + $1.25/M output tokens; average call ≈ 2,500 in / 700 out ≈ **$0.0015**. 60 calls ≈ **$0.09/user/month** vs ₱299 (~$5.30) price — margin is safe even at 5× the cap. The cap exists to stop scripted abuse, not normal use.

Suggested pricing (changeable in one constants file):
- **Premium Monthly — ₱299/mo** (card/Maya recurring or GCash 30-day manual)
- **Premium Yearly — ₱2,990/yr** (card/Maya recurring; ~2 months free)
- **Message Pack — ₱149 one-time** (GCash/Card Checkout Session; keeps the existing one-time offer alive)

## 6. What changes in the frontend (map)

| Area | Change | Phase |
|---|---|---|
| `src/lib/supabase.js` | new — client singleton (env-driven; null when unconfigured so the app still runs backend-less) | 1 |
| `src/lib/entitlement.js` | new — pure tier/status mapping (Vitest) | 1 |
| `src/lib/sync.js` | new — pure merge logic localStorage ↔ cloud (Vitest) | 2 |
| `src/auth.jsx` | new — AuthProvider + `useAuth` (session, entitlement, usage) | 2 |
| `src/components/AccountPage.jsx` | new — sign-in/out, sync status, subscription status, privacy notes | 2–3 |
| `src/components/Layout.jsx` | Account nav item + footer copy update | 2 |
| `src/components/OffersPage.jsx` | rewritten — real pricing, checkout buttons, GCash honesty labels | 3 |
| `src/lib/ai.js` + `src/components/AiFeature*.jsx` | new — AI client + premium-gated feature sections on the result page | 4 |
| `supabase/migrations/*.sql` | new — tables + RLS + trigger | 1 |
| `supabase/functions/*/index.ts` | new — 4 edge functions | 3–4 |
| `README.md` | stack + privacy + monetization sections rewritten | 4 |

## 7. Environment & secrets

| Variable | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `.env.local` (gitignored) + Netlify env | anon key is safe for browser (RLS protects data) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `supabase secrets set` (edge fns) | service key NEVER in the SPA |
| `PAYMONGO_SECRET_KEY` | edge fns | test key until go-live |
| `PAYMONGO_WEBHOOK_SECRET` | edge fns | from webhook registration |
| `ANTHROPIC_API_KEY` | edge fns | — |
| `ANTHROPIC_MODEL` | edge fns | default `claude-haiku-4-5` |
| `APP_ORIGIN` | edge fns | e.g. `https://applyguard.ph` for checkout success/cancel URLs |

**Prerequisites captured as Phase-1 setup tasks** (they need human clicks, not code): Supabase project, PayMongo account + test keys, **ask PayMongo support to enable the Subscriptions capability** (required before subscriptions work), Anthropic API key.

## 8. Testing strategy (repo conventions preserved)

- **Vitest** for all new pure logic: `entitlement.js`, `sync.js`, plus any prompt-builder extraction (Phase 4).
- **Edge functions** are thin shells: PayMongo event → entitlement transition lives in pure `src/lib/entitlement.js` (tested in Vitest); the Deno wrapper is verified with `curl` against test-mode events (exact commands in Phase 3).
- **RLS** verified by SQL probes in Phase 1 (attempt disallowed writes as anon — expect rejection).
- **E2E/manual checklists** per phase for auth, checkout (PayMongo test card), and each AI feature.
- No component-test stack (unchanged repo policy).

## 9. Risks & honest caveats

1. **PayMongo subscription capability is gated by PayMongo itself** — email their support early (Phase 1); it's the longest external dependency.
2. **GCash can't auto-renew** — the 30-day manual-renewal model is a UX downgrade vs card. Label it honestly; don't fake "subscribe" language for GCash.
3. **Supabase free tier limits** (500MB DB, 500K edge invocations) are far beyond this app's needs, but jobs sync should prune `payload` (never sync `rawText`? — **decision:** sync it; users expect their tracker intact across devices; it's their data in their row under RLS. Documented in privacy notes.)
4. **First-invoice payment flow** (Phase 3) has one step verified against live test keys during execution: the "pay open invoice" response shape. The plan includes an explicit verify-and-adapt step.
5. **Don't gate anything that exists today.** If a future idea touches the free scanner, stop and re-review against section 1.

## 10. Out of scope

Team/org accounts, invoice history UI (PayMongo dashboard has it), promo codes, usage-based AI top-ups, in-app notifications/email digests, migrating the Offers "Application Review/Profile Setup" services into real products (they stay listed as not-live, or are removed in Phase 3 in favor of the real tiers).
