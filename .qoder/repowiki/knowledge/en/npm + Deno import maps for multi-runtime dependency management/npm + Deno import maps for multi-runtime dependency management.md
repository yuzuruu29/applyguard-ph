---
kind: dependency_management
name: npm + Deno import maps for multi-runtime dependency management
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - supabase/functions/capture-paypal-order/deno.json
    - supabase/functions/create-paypal-order/deno.json
    - supabase/functions/capture-paypal-order/.npmrc
    - supabase/functions/create-paypal-order/.npmrc
---

This repository manages dependencies across two runtimes with separate manifests and lockfiles:

1. **Frontend (Node/npm)** — The root `package.json` declares all runtime and dev dependencies for the React/Vite PWA, Capacitor mobile wrappers, Supabase client, PayPal integration, Tailwind, Vitest, and deployment tooling. A committed `package-lock.json` (lockfileVersion 3) pins every transitive resolution so CI and local installs are deterministic. No `node_modules/` is checked in; packages are installed on demand via npm.

2. **Supabase Edge Functions (Deno)** — Each Deno function that needs external modules carries its own `deno.json` with an `imports` map pointing at JSR (`jsr:@supabase/functions-js@^2`) and npm (`npm:@supabase/server@^1`) registries. Two functions also include a `.npmrc` placeholder documenting how to wire private registries into edge-function builds. There is no global Deno lockfile committed; each function resolves independently at deploy time.

**Key files**
- `package.json`, `package-lock.json` — npm manifest and lockfile for the frontend build.
- `supabase/functions/capture-paypal-order/deno.json`, `supabase/functions/create-paypal-order/deno.json` — per-function Deno import maps.
- `supabase/functions/capture-paypal-order/.npmrc`, `supabase/functions/create-paypal-order/.npmrc` — private registry hooks for Deno edge functions.
- `capacitor.config.ts` — Capacitor plugin configuration (not a dependency manifest).

**Conventions observed**
- Frontend deps use caret ranges (`^x.y.z`) to allow compatible updates while the lockfile freezes exact versions.
- Deno imports pin major versions (`@^2`, `@^1`) via import maps rather than inline version specifiers.
- Private npm registries are supported through per-function `.npmrc` files when needed by edge functions.
- No vendoring strategy exists for either npm or Deno; both rely on remote registries at install/deploy time.