# ApplyGuard PH

A free, no-login tool that helps Filipino remote job seekers check a job post **before**
they apply. Paste a post, add a few quick details, and get a verdict (Apply / Caution / Skip),
a fit score out of 100, a scam-risk level, the info the post is missing, a suggested next step,
and a copy-paste prompt for your own ChatGPT / Claude / Gemini.

No sign-up. No subscription. Everything runs in your browser and your data stays on your device.

## Stack

- **React + Vite** (functional components and hooks)
- **Tailwind CSS v4** (utility-first, mobile-first)
- **Vitest** for unit tests
- No backend, no database, no auth, no paid APIs. Persistence is **localStorage** only.

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
2. In Netlify, "Add new site" → "Import an existing project" → pick the repo.
3. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`.
4. Deploy.

**Option B — Drag and drop**
1. Run `npm run build`.
2. Drag the generated `dist/` folder onto the Netlify "Deploys" drop zone.

## How it works

The scoring, risk, missing-info, and red-flag logic are **pure functions** with no UI coupling,
which makes them easy to test:

- `src/lib/scoring.js` — `computeScore(job)` and `deriveVerdict(score, riskLevel, missingInfo)`.
  Fit is four components that sum to 100 (skill match 35, pay vs your floor 25, post clarity 20,
  role & commitment 20). Each soft flag subtracts 8 (floor 0); any hard flag caps fit at 15.
- `src/lib/redflags.js` — `scanFlags(rawText, intake)` (hard vs soft) and `riskLevel(flags)`.
  High = any hard flag or 3+ soft; Medium = 1–2 soft; Low = none. A clean result never says
  "safe" or "verified" — it says "no major flags found, still verify."
- `src/lib/missing.js` — `detectMissingInfo(rawText, intake)`.
- `src/lib/nextaction.js`, `src/lib/prompt.js`, `src/lib/csv.js`, `src/lib/analyze.js`.
- `src/lib/storage.js` — single namespaced key `applyguard.v1`, `schemaVersion: 1`,
  debounced writes, and `backup` / `restore` / `reset`.

### Data model (localStorage `applyguard.v1`)

```jsonc
{
  "schemaVersion": 1,
  "settings": { "name": "", "minRate": 0, "currency": "PHP" },
  "jobs": [
    {
      "id": "job_…",
      "title": "Customer Support Specialist",
      "rawText": "…the pasted post…",
      "intake": { "role": "", "skills": "", "experience": "", "rate": 0, "rateType": "Monthly", "hours": "40+" },
      "score": 93,
      "breakdown": { "components": [], "base": 0, "softCount": 0, "softPenalty": 0, "hardCapApplied": false, "total": 93 },
      "verdict": "Apply",
      "riskLevel": "Low",
      "missingInfo": [],
      "flags": { "hard": [], "soft": [] },
      "status": "Saved",
      "followUpBy": "",
      "notes": "",
      "createdAt": "…ISO…",
      "updatedAt": "…ISO…"
    }
  ]
}
```

## Monetization

The scanner is free and never gated. The only money links are **external, one-time purchases**
on the Offers page (Message Pack / Application Review / Profile Setup) plus a review CTA that
appears **only after a scan result is shown**. There is no subscription, no "Pro" tier, and no
in-app payment. Update the placeholder store URLs in `src/components/OffersPage.jsx` before launch.

## Privacy

Scans run entirely in your browser. Nothing is uploaded. Saved jobs and settings live in this
browser's localStorage; use Settings → Back up to keep a copy.
