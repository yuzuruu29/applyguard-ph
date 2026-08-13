---
kind: error_handling
name: Supabase Edge Function Error Model with ApiError and Centralized errorResponse
category: error_handling
scope:
    - '**'
source_files:
    - supabase/functions/_shared/http.ts
    - supabase/functions/_shared/paypal-runtime.ts
    - supabase/functions/ai-proxy/index.ts
    - supabase/functions/paypal-webhook/index.ts
    - supabase/functions/paymongo-webhook/index.ts
    - supabase/functions/cancel-subscription/index.ts
---

This repository uses a two-tier error-handling strategy: the React/Vite frontend relies on standard JavaScript `try`/`catch` around async calls (no custom error types), while all Supabase Deno edge functions follow a uniform, centralized model built around a shared `ApiError` class and an `errorResponse` helper.

**Core system — `ApiError` + `errorResponse` (`supabase/functions/_shared/http.ts`)**
- `ApiError extends Error` carries four fields: `status` (HTTP code), `code` (machine-readable string like `PAYPAL_AUTH_FAILED`, `QUOTA_REACHED`, `PREMIUM_REQUIRED`), `retryable` (boolean hint for client-side retry), and `internal` (opaque diagnostic payload).
- Every edge function wraps its handler in a single `try`/`catch` that delegates to `errorResponse(req, error, id, operation)`. If the caught value is not already an `ApiError`, it is wrapped as `500 / INTERNAL_ERROR` with `retryable: true` and the original error attached as `internal`.
- `errorResponse` logs a structured JSON object containing `requestId`, `operation`, `code`, `status`, and `internal`, then returns a `jsonResponse` whose body is `{ error: { code, message, retryable }, requestId }` at the appropriate status.
- `requestId` pulls `sb-request-id` from the request header or falls back to `crypto.randomUUID()`, so every log line and response is traceable across retries.
- `corsHeaders`, `optionsResponse`, and `jsonResponse` are also exported from this file, giving every function a consistent HTTP envelope.

**Business-layer helpers (`supabase/functions/_shared/paypal-runtime.ts`)**
- Domain-specific guards throw typed `ApiError`s rather than raw errors: `requireLivePayPal()` throws `PAYPAL_NOT_LIVE` / `PAYPAL_NOT_CONFIGURED`; `generatePayPalAccessToken` throws `PAYPAL_AUTH_FAILED`; `loadStoredOrder` throws `ORDER_LOOKUP_FAILED` / `ORDER_NOT_FOUND`; `expectedFromStoredOrder` throws `STORED_ORDER_INVALID`; `fulfillOrder` throws `FULFILLMENT_FAILED`. Each call site sets `retryable` based on whether the failure is transient (network/provider) vs. permanent (invalid input).

**Edge-function usage patterns**
- `ai-proxy/index.ts`: validates auth via Supabase JWT, enforces feature flags and per-feature input schemas, checks entitlements and monthly quota, reserves a usage row before calling Anthropic, and releases it in the catch block if anything fails. All failures go through `ApiError` codes such as `AUTH_REQUIRED`, `AUTH_INVALID`, `INVALID_JSON`, `UNKNOWN_FEATURE`, `PREMIUM_REQUIRED`, `QUOTA_REACHED`, `AI_PROVIDER_ERROR`, `AI_EMPTY_RESPONSE`.
- `paypal-webhook/index.ts`: verifies PayPal webhook headers/signature, reconciles orders, and reuses `paypal-runtime` helpers; non-verified events return a neutral `{ received: true, ignored: true }` instead of throwing.
- `paymongo-webhook/index.ts` and `cancel-subscription/index.ts` predate the shared module and still build responses inline; they do not use `ApiError`/`errorResponse` yet.

**Frontend side**
- The React/Vite app does not define a custom error type. Errors bubble up as thrown values from fetch/SUPABASE calls and are surfaced via the existing `Toast.jsx` component. There is no global error boundary or middleware layer in the browser bundle.

**Conventions developers should follow**
1. Never throw plain `Error` objects from edge functions — always wrap business/user-facing failures in `new ApiError(status, CODE, message, { retryable?, internal? })`.
2. Set `retryable: true` only for transient failures (upstream provider down, network timeout); leave it `false` for invalid input, missing entitlements, or data conflicts.
3. Put opaque diagnostics in `internal` (never expose them to clients); the public response body must only contain `code`, `message`, and `retryable`.
4. Always pass a stable `id = requestId(req)` and a human-friendly `operation` name into `errorResponse` so logs can be correlated.
5. For webhooks, validate signatures/headers first and return early with a neutral success when ignoring unknown event types; only throw when the payload is malformed or verification fails.
6. When reserving resources (e.g., AI usage rows), ensure cleanup happens in the `catch` block before calling `errorResponse`.
7. Frontend callers should inspect `response.error.code` and `response.error.retryable` to decide whether to show a user message or auto-retry.