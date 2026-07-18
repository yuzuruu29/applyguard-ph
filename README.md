# ApplyGuard PH

A free, no-login tool that helps Filipino remote job seekers check a job post **before**
they apply. Paste a post, add a few quick details, and get a verdict (Apply / Caution / Skip),
a fit score out of 100, a scam-risk level, the info the post is missing, a suggested next step,
and a copy-paste prompt for your own ChatGPT / Claude / Gemini.

No sign-up. No subscription. Everything runs in your browser and your data stays on your device.

**New:** Try a one-click sample post to see a verdict in seconds. The tracker now shows stats
(total saved, in-progress, high-risk dodged, average fit) and follow-up reminders so you
never let a lead go cold. Share verdict summaries directly from the result page.

## Stack

- **React 19 + Vite** (functional components and hooks)
- **Tailwind CSS v4** (utility-first, mobile-first)
- **React Router 7** (client-side routing)
- **Vitest** for unit tests
- **Supabase** (optional accounts: magic-link auth, Postgres + RLS cloud sync, Deno edge functions)
- **PayMongo** (Premium subscriptions: card/Maya recurring; GCash 30-day manual renewal)
- **Anthropic** (Premium AI features, called from a server-side proxy — keys never ship to the browser)
- The free scanner still needs **no backend, no account, no paid APIs**. Persistence is localStorage.

## Run it locally

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
```

Other scripts:

```bash
npm run build    # production build to /dist
npm run preview  # serve the built /dist locally
npm test         # run the unit tests once (Vitest)
npm run test:watch
```

## Deploy to Netlify (static site)

A `netlify.toml` and `public/_redirects` are included, so the SPA routes
(`/result/:id`, `/tracker`, `/settings`, `/offers`) work on refresh and direct load.

**Option A — Git (recommended)**
1. Push this repo to GitHub/GitLab.
2. In Netlify, \"Add new site\" → \"Import an existing project\" → pick the repo.
3. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`.
4. Deploy.

**Option B — Drag and drop**
1. Run `npm run build`.
2. Drag the generated `dist/` folder onto the Netlify \"Deploys\" drop zone.

## How it works

The scoring, risk, missing-info, and red-flag logic are **pure functions** with no UI coupling,
which makes them easy to test:

- `src/lib/scoring.js` — `computeScore(job)` and `deriveVerdict(score, riskLevel, missingInfo)`.
  Fit is four components that sum to 100 (skill match 35, pay vs your floor 25, post clarity 20,
  role & commitment 20). Each soft flag subtracts 8 (floor 0); any hard flag caps fit at 15.
- `src/lib/redflags.js` — `scanFlags(rawText, intake)` (hard vs soft) and `riskLevel(flags)`.
  High = any hard flag or 3+ soft; Medium = 1–2 soft; Low = none. A clean result never says
  \"safe\" or \"verified\" — it says \"no major flags found, still verify.\"
- `src/lib/missing.js` — `detectMissingInfo(rawText, intake)`.
- `src/lib/nextaction.js`, `src/lib/prompt.js`, `src/lib/csv.js`, `src/lib/analyze.js`.
- `src/lib/storage.js` — single namespaced key `applyguard.v1`, `schemaVersion: 1`,
  debounced writes, and `backup` / `restore` / `reset`.

### New modules (Hook Model)

- `src/lib/samples.js` — two built-in sample posts (clean + sketchy) so new users see a verdict
  in seconds without pasting anything.
- `src/lib/followups.js` — `followUpState` and `dueFollowUps` for follow-up date tracking.
- `src/lib/stats.js` — `trackerStats` derives total, in-progress, high-risk dodged, and average
  fit score from the saved jobs array.
- `src/lib/share.js` — `shareSummary` builds a privacy-safe text summary of a verdict for
  sharing in group chats (never includes the pasted post text).
- `src/lib/clipboard.js` — `copyToClipboard` with clipboard API + fallback.
- `src/hooks/useCountUp.js` — animated score counter that respects `prefers-reduced-motion`.

### Data model (localStorage `applyguard.v1`)

```jsonc
{
  \"schemaVersion\": 1,
  \"settings\": { \"name\": \"\", \"minRate\": 0, \"currency\": \"PHP\" },
  \"jobs\": [
    {
      \"id\": \"job_…\",
      \"title\": \"Customer Support Specialist\",
      \"rawText\": \"…the pasted post…\",
      \"intake\": { \"role\": \"\", \"skills\": \"\", \"experience\": \"\", \"rate\": 0, \"rateType\": \"Monthly\", \"hours\": \"40+\" },
      \"score\": 93,
      \"breakdown\": { \"components\": [], \"base\": 0, \"softCount\": 0, \"softPenalty\": 0, \"hardCapApplied\": false, \"total\": 93 },
      \"verdict\": \"Apply\",
      \"riskLevel\": \"Low\",
      \"missingInfo\": [],
      \"flags\": { \"hard\": [], \"soft\": [] },
      \"status\": \"Saved\",
      \"followUpBy\": \"\",
      \"notes\": \"\",
      \"createdAt\": \"…ISO…\",
      \"updatedAt\": \"…ISO…\"
    }
  ]
}
```

## Monetization

The scanner is free and never gated. **Premium** (₱299/mo or ₱2,990/yr, card/Maya auto-renew;
₱299 per 30 days via GCash manual renewal) adds four AI features on the result page:
application message generator, deep scam analysis, resume tailoring, and interview prep —
60 AI uses per month. The Message Pack (₱149 one-time) is also available. Entitlements are
written ONLY by the signature-verified PayMongo webhook; the browser can never self-upgrade.

## Privacy

- **No account:** scans run entirely in your browser. Nothing is uploaded.
- **With an account:** your settings and saved jobs sync to private cloud rows protected by
  row-level security. Still your data; export or wipe it any time from Settings.
- **Premium AI features:** the job post text is sent to Anthropic to generate the result.
  It is processed in memory and never stored on our servers. Only token counts are metered.

## Backend setup (optional — accounts & Premium)

The app runs fully local-only without this. To enable accounts/subscriptions/AI:

1. Create `.env.local` from `.env.example` with your Supabase URL + anon key.
2. `npx supabase link --project-ref <ref>` then `npx supabase db push`.
3. `npx supabase functions deploy` and set secrets (`PAYMONGO_SECRET_KEY`,
   `PAYMONGO_WEBHOOK_SECRET`, `PAYMONGO_PLAN_MONTHLY_ID`, `PAYMONGO_PLAN_YEARLY_ID`,
   `ANTHROPIC_API_KEY`, `APP_ORIGIN`).
4. Register the PayMongo webhook to `<supabase-url>/functions/v1/paymongo-webhook`.
5. Set the same `VITE_*` vars in Netlify → Site settings → Environment.

Full step-by-step: `docs/superpowers/plans/monetization/`.


