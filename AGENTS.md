# ApplyGuard PH — Agent Guide

A free, no-login tool for Filipino remote job seekers. Pastes a job post, scores fit, flags
risks, and suggests next steps. Core logic is pure functions; local state is localStorage;
optional accounts add cloud sync and Premium AI.

## Quick Start

```bash
nvm use          # or ensure Node 20 (see .nvmrc)
npm install
npm run dev      # → http://localhost:5173
npm test         # unit tests (Vitest)
```

## Directory Map

| Path | What it owns | When to touch |
|------|-------------|---------------|
| `src/lib/` | Pure-logic modules: scoring, redflags, missing info, followups, stats, share, CSV, samples, storage, sync, AI integration, billing entitelement | Core logic changes; always run `npm test` after edits |
| `src/components/` | React components: ScanForm, ResultView, Tracker, Settings, Account, AiAssistant, MockInterview, Offers, Layout, Toast | UI/UX changes; verify manually in browser |
| `src/hooks/` | Custom hooks (useCountUp) | Animation / behavior hooks |
| `src/App.jsx` | Root app with router setup | Route additions / layout changes |
| `src/store.jsx` | Global app state (Context + localStorage persist + cloud sync) | State model / sync changes |
| `src/auth.jsx` | Supabase magic-link auth | Authentication flow changes |
| `src/lib/entitlement.js` | Premium tier check (used by UI and edge function) | Payment / billing logic |
| `supabase/functions/` | Deno edge functions: ai-proxy, PayPal order, PayPal capture, webhooks, checkout, cancel-subscription, message-pack download | Changes need `supabase functions deploy` |
| `supabase/migrations/` | Database schema (SQL) | Schema / RLS changes; run locally before deploy |
| `supabase/functions/_shared/` | Shared types: paypal validation, entitlement, HTTP helpers, prompts | Shared edge-function logic |
| `docs/superpowers/plans/` | Architecture plans and monetization specs | Reference before major changes |
| `.github/workflows/` | CI — currently deploys Supabase edge functions on main push | Workflow changes |

## High-Risk Areas

**DO NOT proceed without review when touching these:**

| Area | Risk | What to do |
|------|------|------------|
| **Payments (PayPal)** | Live payment capture, webhook fulfillment, account upgrade | Read `docs/superpowers/plans/monetization/`. Verify server-side validation logic in `supabase/functions/_shared/paypal.ts`. Never bypass webhook signature verification. |
| **User data (Supabase)** | Row-level security, data export/wipe, cloud sync | Review RLS policies in `supabase/migrations/`. Test with `supabase db push` on a staging project first. |
| **Auth (magic link)** | Session handling, auth state | Verify `src/auth.jsx` flows. Auth changes affect the entire account experience. |
| **AI proxy (Anthropic)** | API key exposure, token metering, monthly cap | Keys live as Supabase secrets only. Verify entitlement check in the edge function (`supabase/functions/_shared/entitlement.ts`). |
| **Storage schema** | localStorage format changes break existing user data | Bump `schemaVersion` in `src/lib/storage.js`. Write a migration path. |

## Validation Routes

| Scope | Command | When to run |
|-------|---------|-------------|
| All changes | `npm test` | After every code change |
| Core logic (src/lib/) | `npm test` and review specific test file | Pure functions are fully unit-tested |
| Supabase functions | `supabase functions serve` (local) then `supabase functions deploy` | Before deploying edge functions |
| Database schema | `supabase db push` (local) then run tests | After migration changes |
| Full build | `npm run build` then `npm run preview` | Before Netlify/Vercel deploy |
| Capacitor (mobile) | `npx cap sync && npx cap open ios/android` | After mobile-relevant changes |

## Deployment

- **Netlify:** Push to `main`. Netlify auto-deploys from `dist/` via `netlify.toml`.
- **Vercel:** `npm run deploy:vercel`.
- **Supabase functions:** CI in `.github/workflows/supabase.yml` deploys on push to `main` when `supabase/functions/**` changes.

## What NOT To Do

- ❌ Never commit `.env.local` or real secrets.
- ❌ Never bypass PayPal webhook signature verification.
- ❌ Never edit generated `dist/` files — rebuild from source.
- ❌ Never store user job post text server-side (privacy by design — client-only for free tier).
