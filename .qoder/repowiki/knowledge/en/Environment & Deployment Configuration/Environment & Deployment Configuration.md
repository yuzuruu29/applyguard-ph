---
kind: configuration_system
name: Environment & Deployment Configuration
category: configuration_system
scope:
    - '**'
source_files:
    - .env.example
    - src/lib/supabase.js
    - supabase/config.toml
    - netlify.toml
    - vercel.json
    - vite.config.js
---

ApplyGuard PH uses a minimal, layered configuration approach split across three layers: build-time Vite env vars for the frontend, Supabase Edge Function secrets for serverless runtime, and deployment-specific platform configs. There is no centralized application config object — each subsystem reads its own environment variables directly at startup.

Frontend (Vite)
- Variables are declared in .env.example with the VITE_ prefix convention required by Vite's import.meta.env. The example lists VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_PAYPAL_CLIENT_ID.
- The single consumer is src/lib/supabase.js, which reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY via import.meta.env and constructs a Supabase client only when both are present; otherwise it exports null so the app runs fully local-only.
- vite.config.js contains no environment-specific overrides — builds are identical regardless of env.

Supabase Edge Functions
- Secrets are managed through supabase secrets set (documented in .env.example) and are NOT prefixed with VITE_. Examples include PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENVIRONMENT, PAYPAL_WEBHOOK_ID, ANTHROPIC_API_KEY, ANTHROPIC_MODEL, APP_ORIGIN.
- supabase/config.toml declares all edge functions (create-paypal-order, capture-paypal-order, paypal-webhook, ai-proxy, download-message-pack) with their entrypoints and import maps. All functions have verify_jwt = false, relying on webhook signatures or other auth mechanisms instead.
- One function bundles static assets via static_files (the PDF).

Deployment Platforms
- netlify.toml: SPA redirect to index.html, Node 20 runtime, publishes dist/.
- vercel.json: Same SPA rewrites plus security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy), long-lived cache for /assets/*, and strict must-revalidate for sw.js.
- capacitor.config.ts provides Capacitor mobile wrapper settings (separate from web config).

Conventions & Rules
1. Client-facing secrets use the VITE_ prefix and live in .env.local; never commit real values.
2. Server-side secrets for Edge Functions are set via supabase secrets set and must NOT be prefixed with VITE_.
3. The frontend must remain functional without any backend configured — supabase.js explicitly guards against missing env vars by returning a null client.
4. New edge functions must be registered in supabase/config.toml with an entrypoint path and appropriate verify_jwt setting.
5. Platform deployments should keep SPA rewrites consistent between Netlify and Vercel as shown.