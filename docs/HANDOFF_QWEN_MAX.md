# ApplyGuard PH — Code & Architecture Review Handoff for Qwen 3.8 Max

**Date:** July 20, 2026  
**Target Reviewer Model:** Qwen 3.8 Max  
**Project:** ApplyGuard PH (`yuzuruu29/applyguard-ph`)  
**Production URL:** [applyguard-ph.vercel.app](https://applyguard-ph.vercel.app)  

---

## 1. Executive Summary & Product Mission

**ApplyGuard PH** is a privacy-first web application designed specifically for Filipino remote job seekers to analyze job postings for scam risks, red flags, compensation clarity, and missing details *before* applying.

### Core Architecture Philosophy
1. **Sacred Free Tier**:
   - The core job scanner, verdict engine, risk detector, missing-info checker, and application tracker operate **100% client-side in the browser** using `localStorage` (`applyguard.v1`).
   - Requires **no account, no backend, and no paid API calls**.
   - Your data never leaves your device during standard scanning.
2. **Opt-in Premium & Entitlements**:
   - Users can optionally log in via Supabase Magic Links for cloud sync.
   - Live revenue architecture is built on **PayPal Checkout** for one-time purchases (30-day Premium at ₱299, 365-day Premium at ₱2,990, and Message Pack at ₱149).
   - Paid AI features (AI message generator, deep scan, resume tailoring, interview prep) run via a server-side Anthropic proxy (`claude-haiku-4-5-20251001`) with user quota reservation.
   - Paid PDF asset ("Message Pack") is protected behind authenticated Supabase storage entitlement checks.

---

## 2. Technical Stack

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend Framework** | React 19 + Vite 8 | Functional components, custom hooks, React Router 7 for SPA routing |
| **Styling & UI** | Tailwind CSS v4 | Utility-first, mobile-first responsive design, warm paper/ink design system |
| **Unit Testing** | Vitest 4 | 113 pure-function tests covering scoring, red flags, stats, PayPal helpers, follow-ups |
| **Database & Auth** | Supabase | Magic-link Auth, PostgreSQL + RLS (`public.jobs`, `public.entitlements`, `public.payments`) |
| **Backend Functions** | Supabase Edge Functions | Deno TypeScript edge runtime (`create-paypal-order`, `capture-paypal-order`, `paypal-webhook`, `download-message-pack`, `ai-proxy`) |
| **Payments** | PayPal Checkout (v2 API) | Server-authoritative order creation, verified capture validation, atomic Postgres fulfillment RPC (`fulfill_paypal_capture`), signed webhook reconciliation |
| **AI Integration** | Anthropic Proxy | `claude-haiku-4-5-20251001` with server-side quota tracking (60 calls/user/month) |
| **Hosting & CI/CD** | Vercel / Netlify SPA | Client-side routing with `_redirects` / `vercel.json` |

---

## 3. Directory & File Map

```
c:\ApplyGuard PH\
├── public/
│   └── assets/                     # Static assets & PDF templates
├── src/
│   ├── components/                 # React UI components
│   │   ├── ScanForm.jsx            # Job post intake form
│   │   ├── ResultView.jsx          # Staged verdict reveal, fit score, red flag breakdown
│   │   ├── TrackerPage.jsx         # Application status tracker & follow-up reminders
│   │   ├── OffersPage.jsx          # Paid tier pricing grid & PayPal integration
│   │   ├── AccountPage.jsx         # User profile, entitlement status, cloud sync
│   │   ├── AiAssistant.jsx         # Tabbed 4-in-1 AI tool dialog
│   │   └── MessagePackModal.jsx    # Download modal for paid PDF pack
│   ├── hooks/
│   │   ├── useCountUp.js           # Score counter animation (reduced-motion safe)
│   │   └── useEntitlement.js       # React hook fetching live Supabase entitlements
│   └── lib/                        # Decoupled domain logic (100% Vitest covered)
│       ├── pricing.js              # Authoritative plan metadata (monthly, yearly, pack)
│       ├── billing.js              # PayPal SDK loader & API wrappers
│       ├── scoring.js              # 100-pt fit score & verdict derivation
│       ├── redflags.js             # Hard/soft flag detector & risk calculation
│       ├── missing.js              # Missing information detector
│       ├── followups.js            # Due follow-up date logic
│       ├── stats.js                # Aggregated tracker statistics
│       ├── share.js                # Privacy-safe verdict summary builder
│       └── sync.js                 # LocalStorage <-> Supabase cloud sync
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── paypal.ts           # PayPal API client & webhook signature verifier
│   │   │   ├── paypal-runtime.ts   # Fail-closed production runtime environment guard
│   │   │   └── http.ts             # Standard CORS & JSON response helpers
│   │   ├── create-paypal-order/    # Server-side PayPal order initializer
│   │   ├── capture-paypal-order/   # Verification & capture endpoint
│   │   ├── paypal-webhook/        # Webhook listener for PAYMENT.CAPTURE.COMPLETED
│   │   ├── download-message-pack/  # Authenticated PDF downloader
│   │   └── ai-proxy/               # Anthropic Claude API proxy with quota enforcement
│   └── migrations/
│       ├── 001_initial_schema.sql  # Core tables (jobs, entitlements, payments) & RLS policies
│       └── 002_paypal_fulfillment.sql # Atomic RPC `fulfill_paypal_capture`
└── docs/                           # Architecture, monetization & handoff documentation
```

---

## 4. Payment & Revenue Integrity Architecture

PayPal integration is engineered with strict server-authoritative revenue controls:

```
[ Browser Client ]
       │
       ├─► 1. POST /functions/v1/create-paypal-order (auth header + plan_id)
       │      └─► Edge function looks up price in server registry (e.g. ₱299 = 29900 centavos)
       │      └─► Creates order on PayPal API with custom_id = user_id:plan_id
       │
       ├─► 2. Renders PayPal Smart Buttons (paypal_order_id)
       │
       ├─► 3. User approves payment in PayPal popup
       │
       ├─► 4. POST /functions/v1/capture-paypal-order (auth header + order_id)
       │      └─► Edge function captures payment with PayPal API
       │      └─► Validates: status == 'COMPLETED', currency == 'PHP', amount == expected_amount
       │      └─► Invokes `fulfill_paypal_capture` RPC on Postgres with service_role key
       │
       └─► 5. Webhook Backup (`paypal-webhook`):
              └─► Verifies `PAYMENT.CAPTURE.COMPLETED` signature against PayPal certificates
              └─► Idempotently calls `fulfill_paypal_capture` in case browser disconnected
```

### Key Security & Database Controls (`002_paypal_fulfillment.sql`)
- **Atomic Fulfillment**: `fulfill_paypal_capture` executes with `security definer` under search path isolation.
- **Role Isolation**: Explicitly `REVOKE ALL` on `fulfill_paypal_capture` from `public`, `anon`, and `authenticated`. `GRANT EXECUTE` **only** to `service_role`.
- **Idempotency**: Insert into `payments` table on `capture_id` conflict is a no-op; double execution returns the existing entitlement without double-incrementing duration.
- **Manual Renewal Calculation**: 30-day or 365-day extensions compute `greatest(coalesce(current_period_end, current_date), current_date) + v_days`, ensuring active extensions stack cleanly onto remaining days rather than penalizing early renewals.

---

## 5. Current Verification & Build State

- **Unit Test Suite**: `113 / 113` Vitest tests passing across 11 test files (executes in < 1 second).
- **Vite Build**: Passes clean without warnings (`dist/` asset bundle generated in ~470ms).
- **Encoding Hygiene**: UTF-8 clean. Prior Windows-1252 double-encoding issue on `ResultView.jsx` fully remediated and verified.

---

## 6. High-Priority Review Agenda for Qwen 3.8 Max

We request Qwen 3.8 Max to perform a deep technical review across the following five domains:

### Priority 1: Security & Auth Boundaries Audit
- [ ] **Supabase RLS Rules**: Verify `001_initial_schema.sql` and `002_paypal_fulfillment.sql` to ensure `anon` and `authenticated` users can never read/modify other users' jobs, payments, or entitlements.
- [ ] **PayPal Webhook Signature**: Audit `supabase/functions/_shared/paypal.ts` for cryptographic verification of PayPal webhook headers (`PAYPAL-AUTH-ALGO`, `PAYPAL-CERT-URL`, `PAYPAL-TRANSMISSION-ID`, `PAYPAL-TRANSMISSION-SIG`, `PAYPAL-TRANSMISSION-TIME`).
- [ ] **CORS & Edge Security**: Inspect `http.ts` and `ai-proxy` to confirm credentials and Anthropic API keys are strictly unexposed to browser runtimes.

### Priority 2: Payment Race Conditions & Idempotency Audit
- [ ] **Webhook vs. Client Capture Race**: Check if simultaneous execution of client `capture-paypal-order` and asynchronous `paypal-webhook` can cause locking issues or duplicate state transitions.
- [ ] **Partial Failure Recovery**: Ensure that if PayPal capture succeeds on PayPal's end but Supabase database fails, there is a clear reconciliation path.

### Priority 3: Frontend Code Quality & React 19 / Tailwind v4 Patterns
- [ ] **State Management & Custom Hooks**: Audit `src/hooks/useEntitlement.js`, `src/hooks/useCountUp.js`, and `src/components/*` for stale closures, unhandled promise rejections, or unnecessary re-renders.
- [ ] **Accessibility & Responsiveness**: Review ARIA attributes, keyboard navigation, and mobile responsiveness in `ScanForm.jsx`, `ResultView.jsx`, and `OffersPage.jsx`.

### Priority 4: Data Privacy & Local Storage Integrity
- [ ] **Client Data Isolation**: Confirm `src/lib/storage.js` and `src/lib/share.js` guarantee job posting text and personal data are never posted externally without explicit user consent.
- [ ] **Schema Migration Path**: Review `schemaVersion: 1` handling in `storage.js` for seamless future upgrades.

### Priority 5: Credential Remediation & Operational Hygiene
- [ ] **Git History Sanitization**: Historical `.env.vercel*` export files were deleted from working tree, but historic Git commits require secret rotation and BFG/git-filter-repo cleanup.

---

## 7. Instructions for Qwen 3.8 Max Review Execution

When Qwen 3.8 Max begins its review, it should focus on:
1. **Verifying Code correctness** against the 113 unit tests and SQL schema definitions.
2. **Identifying potential vulnerabilities** in payment validation, edge function CORS, and Supabase RLS.
3. **Providing concrete code diffs or structural suggestions** for any identified improvements.
