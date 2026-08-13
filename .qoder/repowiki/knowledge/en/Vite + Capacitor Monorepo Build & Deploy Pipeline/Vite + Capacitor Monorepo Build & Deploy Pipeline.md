---
kind: build_system
name: Vite + Capacitor Monorepo Build & Deploy Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.js
    - netlify.toml
    - vercel.json
    - capacitor.config.ts
    - .github/workflows/supabase.yml
---

ApplyGuard PH uses a flat, Vite-centric build pipeline that produces a single static SPA bundle (/dist) deployed to both Netlify and Vercel, with Supabase Edge Functions deployed separately via the supabase CLI in GitHub Actions.

Build toolchain:
- Bundler: Vite 8 with @vitejs/plugin-react and Tailwind CSS v4 (@tailwindcss/vite). No backend — output is a static site.
- Testing: Vitest configured in vite.config.js, running against src/**/*.{test,spec}.{js,jsx} and supabase/functions/_shared/**/*.{test,spec}.ts in a plain Node environment.
- Mobile wrapper: Capacitor 8 reads the same /dist output (webDir: dist) for iOS/Android shells.

Scripts (npm):
- dev/build/preview: Standard Vite lifecycle
- test/test:watch: Vitest run/watch
- cap:add/cap:sync/cap:ios/cap:android: Capacitor project scaffolding and native IDE launch
- deploy:vercel/deploy:netlify: One-shot production deploys of the static bundle

Deployment targets:
- Frontend SPA: built by npm run build, published from dist. Both netlify.toml and vercel.json declare this; Netlify also rewrites all routes to index.html for client-side routing.
- Supabase Edge Functions: TypeScript functions under supabase/functions/ are deployed individually via supabase functions deploy <name> in CI. Each function has its own deno.json or .npmrc when it needs Deno/npm deps.

CI (GitHub Actions):
.github/workflows/supabase.yml triggers on pushes touching supabase/functions/**:
1. Checks out code, sets up Node from .nvmrc, caches npm.
2. Runs npm test (Vitest).
3. Installs the latest supabase CLI and deploys three functions: create-checkout, paymongo-webhook, cancel-subscription.
   - paymongo-webhook is deployed with --no-verify-jwt because webhooks bypass auth.
   - Other functions use default JWT verification.

Environment & runtime:
- Node version pinned via .nvmrc; CI and Netlify both target Node 20.
- The PWA service worker lives at public/sw.js; Vercel headers set Service-Worker-Allowed: / and cache-bust it with max-age=0, must-revalidate. Static assets get immutable caching (max-age=31536000).
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) are declared in vercel.json.

Conventions:
- All build/test configuration is centralized in root-level files (package.json, vite.config.js, netlify.toml, vercel.json, capacitor.config.ts); there is no Makefile, Dockerfile, or monorepo workspace manager.
- Frontend and Supabase functions share the same npm ci install so Vitest can import shared logic under supabase/functions/_shared/.
- Mobile builds consume the same dist artifact produced by the frontend build — no separate mobile build step.