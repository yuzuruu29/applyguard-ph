# Trial & Usage Ledger System

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [src/App.jsx](file://src/App.jsx)
- [src/main.jsx](file://src/main.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/auth.jsx](file://src/auth.jsx)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the Trial & Usage Ledger System that underpins trial management, usage accounting, and entitlement enforcement across the application. It explains how trials are granted and tracked, how usage is recorded and reconciled, and how billing integrations (PayMongo and PayPal) update entitlements and ledger state. The system spans client-side logic, serverless functions, and database migrations to provide a consistent, auditable record of user entitlements and usage.

## Project Structure
The project is a modern web app with:
- Client-side React UI and state management
- Serverless functions for billing and entitlement operations
- Supabase database schema and migrations
- Billing integrations via PayMongo and PayPal webhooks

```mermaid
graph TB
subgraph "Client"
A["App Entry<br/>src/main.jsx"]
B["App Shell<br/>src/App.jsx"]
C["Global Store<br/>src/store.jsx"]
D["Auth Module<br/>src/auth.jsx"]
E["Billing Utilities<br/>src/lib/billing.js"]
F["Entitlement Logic<br/>src/lib/entitlement.js"]
G["Supabase Client<br/>src/lib/supabase.js"]
H["Account Page<br/>src/components/AccountPage.jsx"]
I["Settings Page<br/>src/components/Settings.jsx"]
end
subgraph "Serverless Functions"
J["Create Checkout<br/>supabase/functions/create-checkout/index.ts"]
K["PayMongo Webhook<br/>supabase/functions/paymongo-webhook/index.ts"]
L["PayPal Webhook<br/>supabase/functions/paypal-webhook/index.ts"]
M["Shared Entitlement<br/>supabase/functions/_shared/entitlement.ts"]
end
subgraph "Database"
N["Schema v1<br/>supabase/migrations/001_schema.sql"]
O["PayPal Fulfillment<br/>supabase/migrations/002_paypal_fulfillment.sql"]
end
A --> B --> C
B --> D
B --> H
B --> I
C --> E
C --> F
C --> G
E --> J
J --> K
J --> L
K --> M
L --> M
M --> N
M --> O
```

**Diagram sources**
- [src/main.jsx](file://src/main.jsx)
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/auth.jsx](file://src/auth.jsx)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

**Section sources**
- [README.md](file://README.md)
- [package.json](file://package.json)

## Core Components
- App entry and shell: Initializes the application, mounts the root component, and wires up global providers and routing.
- Global store: Centralizes state for entitlements, trial status, and usage counters; exposes actions to update and persist state.
- Auth module: Manages authentication lifecycle and integrates with Supabase auth to scope entitlements per user.
- Billing utilities: Provides helpers to create checkouts and handle billing flows from the client.
- Entitlement logic: Encapsulates rules for trial eligibility, usage limits, and feature gating based on current entitlements.
- Supabase client: Configures the database client used by both client and serverless functions for reading/writing ledger data.
- Account and Settings pages: User-facing surfaces to view trial status, usage, and manage subscription settings.

Key responsibilities:
- Maintain a single source of truth for trial and usage state
- Enforce feature access based on entitlements
- Record usage events and reconcile them with billing outcomes
- Provide UI for users to inspect and control their trial and subscription

**Section sources**
- [src/main.jsx](file://src/main.jsx)
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/auth.jsx](file://src/auth.jsx)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)

## Architecture Overview
The Trial & Usage Ledger System follows a client-server architecture with event-driven updates from payment providers:
- The client initializes auth and loads entitlements and usage from the database.
- Users initiate checkout flows through serverless functions.
- Payment providers send webhooks to update entitlements and ledger entries.
- Shared entitlement logic ensures consistency between client and server.

```mermaid
sequenceDiagram
participant U as "User"
participant FE as "Frontend (App)"
participant SC as "Store (State)"
participant BE as "Create Checkout Function"
participant PM as "Payment Provider"
participant WH as "Webhook Handler"
participant DB as "Database"
U->>FE : "Start checkout"
FE->>SC : "Initiate billing flow"
SC->>BE : "Create checkout session"
BE-->>PM : "Redirect to provider"
PM-->>U : "Payment completed"
PM-->>WH : "Send webhook"
WH->>DB : "Update entitlements and ledger"
DB-->>SC : "Sync updated state"
SC-->>FE : "Refresh UI with new entitlements"
```

**Diagram sources**
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/lib/billing.js](file://src/lib/billing.js)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

## Detailed Component Analysis

### Client-Side State and UI
- App shell sets up providers and routes, ensuring entitlement-aware components render correctly.
- Global store holds trial metadata, usage counters, and entitlement flags; it exposes methods to increment usage and refresh entitlements.
- Account and Settings pages read from the store to display trial status, remaining usage, and allow users to manage subscriptions.

```mermaid
classDiagram
class AppShell {
+mountProviders()
+renderRoutes()
}
class Store {
+state
+getEntitlements()
+incrementUsage(feature)
+refreshEntitlements()
}
class AccountPage {
+renderTrialStatus()
+renderUsageSummary()
}
class SettingsPage {
+renderSubscriptionOptions()
+handleCheckoutClick()
}
AppShell --> Store : "reads/writes"
AccountPage --> Store : "reads"
SettingsPage --> Store : "reads/writes"
```

**Diagram sources**
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)

**Section sources**
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)

### Billing Utilities and Checkout Flow
- Billing utilities orchestrate checkout creation and redirect to payment providers.
- Create checkout function prepares sessions and returns URLs for the client to navigate.

```mermaid
sequenceDiagram
participant UI as "Settings Page"
participant Store as "Store"
participant Billing as "Billing Utilities"
participant Checkout as "Create Checkout Function"
participant Provider as "Payment Provider"
UI->>Store : "Request checkout"
Store->>Billing : "initiateCheckout(params)"
Billing->>Checkout : "POST /create-checkout"
Checkout-->>Billing : "{url}"
Billing-->>UI : "Redirect to provider URL"
```

**Diagram sources**
- [src/components/Settings.jsx](file://src/components/Settings.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/lib/billing.js](file://src/lib/billing.js)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)

**Section sources**
- [src/lib/billing.js](file://src/lib/billing.js)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)

### Entitlement Enforcement
- Client-side entitlement logic checks features against current entitlements derived from trial and subscription state.
- Server-side shared entitlement logic validates and computes entitlements consistently for webhooks and backend operations.

```mermaid
flowchart TD
Start(["Feature Access Request"]) --> LoadState["Load Current Entitlements"]
LoadState --> CheckTrial{"Within Trial Period?"}
CheckTrial --> |Yes| AllowTrial["Allow Based on Trial Rules"]
CheckTrial --> |No| CheckSub{"Active Subscription?"}
CheckSub --> |Yes| AllowSub["Allow Based on Plan Limits"]
CheckSub --> |No| Deny["Deny Access"]
AllowTrial --> End(["Decision: Allowed"])
AllowSub --> End
Deny --> End
```

**Diagram sources**
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

### Database Schema and Migrations
- Initial schema defines core tables for users, entitlements, and ledger entries.
- PayPal fulfillment migration adds structures to track PayPal-specific fulfillment records and reconciliation.

```mermaid
erDiagram
USERS {
uuid id PK
string email UK
timestamp created_at
timestamp updated_at
}
ENTITLEMENTS {
uuid id PK
uuid user_id FK
enum type
boolean active
timestamp expires_at
timestamp created_at
timestamp updated_at
}
LEDGER_ENTRIES {
uuid id PK
uuid user_id FK
enum action
int quantity
text reference
timestamp occurred_at
}
PAYPAL_FULFILLMENT {
uuid id PK
uuid user_id FK
string order_id
string capture_id
enum status
timestamp fulfilled_at
}
USERS ||--o{ ENTITLEMENTS : "has many"
USERS ||--o{ LEDGER_ENTRIES : "has many"
USERS ||--o{ PAYPAL_FULFILLMENT : "has many"
```

**Diagram sources**
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

**Section sources**
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

### Webhook Handlers and Reconciliation
- PayMongo webhook handler processes payment confirmations and updates entitlements and ledger entries accordingly.
- PayPal webhook handler performs similar reconciliation for PayPal orders and captures.

```mermaid
sequenceDiagram
participant PM as "PayMongo/PayPal"
participant WH as "Webhook Handler"
participant SE as "Shared Entitlement"
participant DB as "Database"
PM-->>WH : "Event payload"
WH->>SE : "Compute entitlement changes"
SE-->>WH : "Changes to apply"
WH->>DB : "Upsert entitlements and ledger"
DB-->>WH : "Confirmation"
WH-->>PM : "200 OK"
```

**Diagram sources**
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

## Dependency Analysis
The Trial & Usage Ledger System has clear separation of concerns:
- Frontend depends on store, billing utilities, and entitlement logic to enforce access and present state.
- Serverless functions depend on shared entitlement logic and database schema to maintain consistency.
- Webhooks depend on provider payloads and shared entitlement computation to update state reliably.

```mermaid
graph LR
FE["Frontend Modules"] --> Store["Store"]
FE --> Billing["Billing Utilities"]
FE --> Entitlement["Entitlement Logic"]
FE --> Supabase["Supabase Client"]
Billing --> Checkout["Create Checkout Function"]
Checkout --> Providers["Payment Providers"]
Providers --> Webhooks["Webhook Handlers"]
Webhooks --> SharedEnt["Shared Entitlement"]
SharedEnt --> DB["Database Schema"]
```

**Diagram sources**
- [src/store.jsx](file://src/store.jsx)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

**Section sources**
- [src/store.jsx](file://src/store.jsx)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

## Performance Considerations
- Minimize redundant entitlement checks by caching results in the store and invalidating only when necessary.
- Batch usage increments where possible to reduce database writes during high-frequency interactions.
- Ensure webhook handlers are idempotent to avoid duplicate ledger entries on retries.
- Use efficient queries and indexes on frequently accessed fields such as user_id and timestamps.

## Troubleshooting Guide
Common issues and resolutions:
- Entitlement mismatch between client and server: Verify shared entitlement logic and ensure both client and server use the same rules.
- Webhook not updating state: Confirm provider signatures, payload parsing, and idempotency keys; check database constraints and transaction boundaries.
- Checkout failures: Validate environment configuration for payment providers and ensure correct return URLs and secret keys.
- Usage not reflected in UI: Ensure store refresh triggers after successful webhook processing and that UI components subscribe to store updates.

**Section sources**
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [src/store.jsx](file://src/store.jsx)

## Conclusion
The Trial & Usage Ledger System provides a robust foundation for managing trials, tracking usage, and enforcing entitlements across the application. By centralizing entitlement logic, maintaining an auditable ledger, and integrating securely with payment providers, the system ensures consistent behavior and reliable state synchronization between client and server.