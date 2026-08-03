# Architecture Overview

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [vite.config.js](file://vite.config.js)
- [netlify.toml](file://netlify.toml)
- [vercel.json](file://vercel.json)
- [capacitor.config.ts](file://capacitor.config.ts)
- [index.html](file://index.html)
- [src/main.jsx](file://src/main.jsx)
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/auth.jsx](file://src/auth.jsx)
- [src/mobile.js](file://src/mobile.js)
- [src/components/Layout.jsx](file://src/components/Layout.jsx)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/MockInterviewPage.jsx](file://src/components/MockInterviewPage.jsx)
- [src/components/OffersPage.jsx](file://src/components/OffersPage.jsx)
- [src/components/ResultView.jsx](file://src/components/ResultView.jsx)
- [src/components/ScanForm.jsx](file://src/components/ScanForm.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)
- [src/components/Toast.jsx](file://src/components/Toast.jsx)
- [src/components/Tracker.jsx](file://src/components/Tracker.jsx)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [src/lib/storage.js](file://src/lib/storage.js)
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [src/lib/ai.js](file://src/lib/ai.js)
- [public/sw.js](file://public/sw.js)
- [supabase/functions/_shared/http.ts](file://supabase/functions/_shared/http.ts)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/functions/capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [supabase/functions/ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)
</cite>

## Table of Contents
1. Introduction
2. Project Structure
3. Core Components
4. Architecture Overview
5. Detailed Component Analysis
6. Dependency Analysis
7. Performance Considerations
8. Security Architecture
9. Scalability and Deployment Topology
10. Troubleshooting Guide
11. Conclusion

## Introduction
This document provides a comprehensive architectural overview of the ApplyGuard PH system. It explains the high-level design patterns, including component-based architecture, service layer separation, and state management strategy. It also documents technology stack decisions, system boundaries between frontend, backend services, and external integrations, and details data flow from user interactions through local storage to cloud synchronization. Infrastructure diagrams illustrate component relationships, API call patterns, and real-time sync mechanisms. Finally, it addresses scalability considerations, security architecture, and deployment topology across web and mobile platforms.

## Project Structure
The project is a modern web application with optional mobile packaging:
- Frontend built with Vite and React, organized by features (components), shared logic (lib), and app bootstrap (main entry points).
- Backend functions are hosted on Supabase Edge Functions for billing, AI proxying, and webhook handling.
- Data persistence uses Supabase Postgres via migrations; client-side caching and offline support leverage browser storage and a service worker.
- Mobile packaging is configured via Capacitor for cross-platform distribution.

```mermaid
graph TB
subgraph "Web App"
A["index.html"] --> B["Vite Build"]
B --> C["src/main.jsx"]
C --> D["src/App.jsx"]
D --> E["src/store.jsx"]
D --> F["Components<br/>Layout, Pages, UI"]
F --> G["Service Layer<br/>lib/*"]
G --> H["Local Storage"]
G --> I["Supabase Client<br/>src/lib/supabase.js"]
G --> J["Cloud Sync<br/>src/lib/cloud.js, src/lib/sync.js"]
end
subgraph "Mobile Packaging"
K["capacitor.config.ts"] --> L["Capacitor Runtime"]
L --> M["Native APIs"]
end
subgraph "Backend Services"
N["Supabase Edge Functions"]
O["Postgres DB"]
end
I --> N
J --> N
N --> O
```

**Diagram sources**
- [index.html](file://index.html)
- [vite.config.js](file://vite.config.js)
- [src/main.jsx](file://src/main.jsx)
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/components/Layout.jsx](file://src/components/Layout.jsx)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)
- [capacitor.config.ts](file://capacitor.config.ts)
- [supabase/functions/_shared/http.ts](file://supabase/functions/_shared/http.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)

**Section sources**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [vite.config.js](file://vite.config.js)
- [capacitor.config.ts](file://capacitor.config.ts)
- [index.html](file://index.html)

## Core Components
- Application Bootstrap and Routing
  - Entry point initializes the React app and mounts the root component.
  - The root component composes layout and feature pages.
- State Management
  - Centralized store holds application state and exposes actions for components.
  - Store integrates with local storage for persistence and with cloud sync for multi-device consistency.
- Service Layer
  - Encapsulates domain logic and external calls:
    - Supabase client configuration and queries.
    - Cloud sync orchestration and conflict resolution.
    - Billing and entitlements integration with payment providers.
    - AI assistant proxying to external models.
- Feature Components
  - Account, Mock Interview, Offers, Result View, Scan Form, Settings, Toast notifications, Tracker.
- Offline and PWA Support
  - Service worker enables caching and background tasks.

**Section sources**
- [src/main.jsx](file://src/main.jsx)
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/components/Layout.jsx](file://src/components/Layout.jsx)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/MockInterviewPage.jsx](file://src/components/MockInterviewPage.jsx)
- [src/components/OffersPage.jsx](file://src/components/OffersPage.jsx)
- [src/components/ResultView.jsx](file://src/components/ResultView.jsx)
- [src/components/ScanForm.jsx](file://src/components/ScanForm.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)
- [src/components/Toast.jsx](file://src/components/Toast.jsx)
- [src/components/Tracker.jsx](file://src/components/Tracker.jsx)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [src/lib/ai.js](file://src/lib/ai.js)
- [public/sw.js](file://public/sw.js)

## Architecture Overview
The system follows a component-based architecture with clear separation between UI, state, and services. The service layer abstracts all external integrations (Supabase, payment gateways, AI providers). State is managed centrally and persisted locally, with cloud synchronization ensuring consistency across devices.

```mermaid
graph TB
subgraph "Frontend"
UI["React Components"]
Store["Central Store"]
Local["Local Storage / IndexedDB"]
SW["Service Worker"]
end
subgraph "Backend"
SF["Supabase Functions"]
DB["Postgres"]
end
subgraph "External Integrations"
PayMongo["PayMongo Webhooks"]
PayPal["PayPal Webhooks"]
AI["AI Provider API"]
end
UI --> Store
Store --> Local
Store --> SF
SW --> Local
SF --> DB
SF --> PayMongo
SF --> PayPal
SF --> AI
```

**Diagram sources**
- [src/App.jsx](file://src/App.jsx)
- [src/store.jsx](file://src/store.jsx)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)
- [public/sw.js](file://public/sw.js)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/functions/ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)

## Detailed Component Analysis

### Component-Based UI Architecture
- Layout and Pages
  - Layout composes navigation and page shells.
  - Feature pages encapsulate domain-specific UI and behavior.
- Shared UI Utilities
  - Toast notifications provide user feedback.
  - Tracker monitors usage or performance metrics.

```mermaid
classDiagram
class Layout {
+render()
}
class AccountPage {
+render()
}
class MockInterviewPage {
+render()
}
class OffersPage {
+render()
}
class ResultView {
+render()
}
class ScanForm {
+render()
}
class Settings {
+render()
}
class Toast {
+show(message)
}
class Tracker {
+track(event)
}
Layout --> AccountPage : "renders"
Layout --> MockInterviewPage : "renders"
Layout --> OffersPage : "renders"
Layout --> ResultView : "renders"
Layout --> ScanForm : "renders"
Layout --> Settings : "renders"
Layout --> Toast : "uses"
Layout --> Tracker : "uses"
```

**Diagram sources**
- [src/components/Layout.jsx](file://src/components/Layout.jsx)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/MockInterviewPage.jsx](file://src/components/MockInterviewPage.jsx)
- [src/components/OffersPage.jsx](file://src/components/OffersPage.jsx)
- [src/components/ResultView.jsx](file://src/components/ResultView.jsx)
- [src/components/ScanForm.jsx](file://src/components/ScanForm.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)
- [src/components/Toast.jsx](file://src/components/Toast.jsx)
- [src/components/Tracker.jsx](file://src/components/Tracker.jsx)

**Section sources**
- [src/components/Layout.jsx](file://src/components/Layout.jsx)
- [src/components/AccountPage.jsx](file://src/components/AccountPage.jsx)
- [src/components/MockInterviewPage.jsx](file://src/components/MockInterviewPage.jsx)
- [src/components/OffersPage.jsx](file://src/components/OffersPage.jsx)
- [src/components/ResultView.jsx](file://src/components/ResultView.jsx)
- [src/components/ScanForm.jsx](file://src/components/ScanForm.jsx)
- [src/components/Settings.jsx](file://src/components/Settings.jsx)
- [src/components/Toast.jsx](file://src/components/Toast.jsx)
- [src/components/Tracker.jsx](file://src/components/Tracker.jsx)

### Service Layer Separation
- Supabase Integration
  - Configures client and provides typed helpers for database operations.
- Cloud Sync
  - Orchestrates upload/download cycles, handles conflicts, and maintains local-first consistency.
- Billing and Entitlements
  - Creates checkout sessions, captures orders, and verifies entitlements server-side.
- AI Assistant Proxy
  - Proxies requests to AI providers securely, enforcing rate limits and logging.

```mermaid
sequenceDiagram
participant UI as "UI Component"
participant Store as "Store"
participant Service as "Service Layer"
participant Supa as "Supabase Client"
participant Func as "Edge Functions"
participant DB as "Postgres"
UI->>Store : Dispatch action
Store->>Service : Call service method
Service->>Supa : Query/Write data
Supa-->>Service : Result
Service->>Func : Create checkout / capture order
Func-->>Service : Payment result
Service->>DB : Persist changes
Store-->>UI : Update state
```

**Diagram sources**
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)

**Section sources**
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)
- [src/lib/billing.js](file://src/lib/billing.js)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)

### State Management Strategy
- Centralized Store
  - Holds global state and exposes actions for mutation.
  - Persists critical state to local storage for resilience.
- Local-First Design
  - Optimistic updates improve UX; background sync reconciles with cloud.
- Conflict Resolution
  - Timestamps and version vectors ensure consistent merges.

```mermaid
flowchart TD
Start(["User Action"]) --> Dispatch["Dispatch Action"]
Dispatch --> UpdateLocal["Update Local Store"]
UpdateLocal --> Persist["Persist to Local Storage"]
Persist --> ScheduleSync["Schedule Cloud Sync"]
ScheduleSync --> SyncOp["Upload/Download Changes"]
SyncOp --> Merge{"Conflicts?"}
Merge --> |Yes| Resolve["Resolve Conflicts"]
Merge --> |No| Complete["Complete"]
Resolve --> Complete
Complete --> Render["Re-render UI"]
```

**Diagram sources**
- [src/store.jsx](file://src/store.jsx)
- [src/lib/storage.js](file://src/lib/storage.js)
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)

**Section sources**
- [src/store.jsx](file://src/store.jsx)
- [src/lib/storage.js](file://src/lib/storage.js)
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)

### Authentication and Authorization
- Auth Flow
  - Handles sign-in/sign-up and session management.
- Entitlements
  - Server-side verification ensures paid features are accessible only to entitled users.

```mermaid
sequenceDiagram
participant User as "User"
participant Auth as "Auth Module"
participant Supa as "Supabase Auth"
participant Func as "Entitlement Function"
participant Store as "Store"
User->>Auth : Sign In
Auth->>Supa : Authenticate
Supa-->>Auth : Session
Auth->>Func : Verify entitlements
Func-->>Auth : Entitlement status
Auth->>Store : Set auth state
Store-->>User : Authorized UI
```

**Diagram sources**
- [src/auth.jsx](file://src/auth.jsx)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [src/auth.jsx](file://src/auth.jsx)
- [src/lib/entitlement.js](file://src/lib/entitlement.js)
- [supabase/functions/_shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

### Billing and Payments
- Checkout and Capture
  - Creates checkout sessions and captures payments via provider APIs.
- Webhooks
  - Processes events from PayMongo and PayPal to fulfill subscriptions and update entitlements.

```mermaid
sequenceDiagram
participant UI as "Billing UI"
participant Store as "Store"
participant Billing as "Billing Service"
participant Func as "Create Checkout Function"
participant Provider as "Payment Provider"
participant Webhook as "Webhook Handler"
participant DB as "Postgres"
UI->>Store : Initiate purchase
Store->>Billing : createCheckout()
Billing->>Func : Call function
Func->>Provider : Create order/session
Provider-->>Func : Order ID
Func-->>Billing : Redirect URL
Billing-->>UI : Redirect to provider
Provider-->>Webhook : Payment event
Webhook->>DB : Fulfill subscription
Webhook-->>UI : Success notification
```

**Diagram sources**
- [src/lib/billing.js](file://src/lib/billing.js)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

**Section sources**
- [src/lib/billing.js](file://src/lib/billing.js)
- [supabase/functions/create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [supabase/functions/capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

### AI Assistant Integration
- Secure Proxy
  - Frontend calls an internal AI proxy function to avoid exposing secrets.
- Rate Limiting and Logging
  - Enforced at the function level for safety and observability.

```mermaid
sequenceDiagram
participant UI as "AI Assistant UI"
participant Store as "Store"
participant AI as "AI Service"
participant Func as "AI Proxy Function"
participant Provider as "AI Provider API"
UI->>Store : Request AI response
Store->>AI : generateAnswer(prompt)
AI->>Func : POST /ai-proxy
Func->>Provider : Forward request
Provider-->>Func : Response
Func-->>AI : Processed response
AI-->>Store : Return result
Store-->>UI : Display answer
```

**Diagram sources**
- [src/lib/ai.js](file://src/lib/ai.js)
- [supabase/functions/ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)

**Section sources**
- [src/lib/ai.js](file://src/lib/ai.js)
- [supabase/functions/ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)

### Real-Time Synchronization Mechanisms
- Change Detection
  - Local mutations trigger sync jobs.
- Upload/Download
  - Batched operations minimize network overhead.
- Conflict Handling
  - Deterministic merge strategies maintain consistency.

```mermaid
flowchart TD
Mutate["Local Mutation"] --> Queue["Sync Queue"]
Queue --> Batch["Batch Operations"]
Batch --> Upload["Upload Changes"]
Upload --> Download["Download Remote Changes"]
Download --> Merge["Merge & Resolve"]
Merge --> Persist["Persist to Local"]
Persist --> Notify["Notify UI"]
```

**Diagram sources**
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)

**Section sources**
- [src/lib/cloud.js](file://src/lib/cloud.js)
- [src/lib/sync.js](file://src/lib/sync.js)

### Offline and PWA Support
- Service Worker
  - Caches assets and supports background sync.
- Local Persistence
  - Ensures app functionality without connectivity.

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant SW as "Service Worker"
participant Cache as "Cache Storage"
participant Network as "Network"
Browser->>SW : Request resource
SW->>Cache : Check cache
alt Cache Hit
SW-->>Browser : Serve cached
else Cache Miss
SW->>Network : Fetch resource
Network-->>SW : Response
SW->>Cache : Cache response
SW-->>Browser : Serve response
end
```

**Diagram sources**
- [public/sw.js](file://public/sw.js)

**Section sources**
- [public/sw.js](file://public/sw.js)

## Dependency Analysis
- Frontend Dependencies
  - React, Vite, Capacitor for mobile packaging.
- Backend Dependencies
  - Supabase Edge Functions for serverless compute.
  - Postgres for relational data.
- External Integrations
  - PayMongo and PayPal for payments.
  - AI provider APIs proxied via functions.

```mermaid
graph TB
FE["Frontend (React/Vite)"] --> Lib["Service Layer (lib/*)"]
Lib --> Supa["Supabase Client"]
Lib --> Edge["Edge Functions"]
Edge --> DB["Postgres"]
Edge --> PayMongo["PayMongo"]
Edge --> PayPal["PayPal"]
Edge --> AI["AI Provider"]
FE --> SW["Service Worker"]
FE --> Cap["Capacitor (Mobile)"]
```

**Diagram sources**
- [package.json](file://package.json)
- [vite.config.js](file://vite.config.js)
- [capacitor.config.ts](file://capacitor.config.ts)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [supabase/functions/_shared/http.ts](file://supabase/functions/_shared/http.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)

**Section sources**
- [package.json](file://package.json)
- [vite.config.js](file://vite.config.js)
- [capacitor.config.ts](file://capacitor.config.ts)
- [src/lib/supabase.js](file://src/lib/supabase.js)
- [supabase/functions/_shared/http.ts](file://supabase/functions/_shared/http.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)

## Performance Considerations
- Local-First Updates
  - Optimistic UI reduces perceived latency.
- Batched Sync
  - Aggregates changes to reduce network round-trips.
- Caching Strategy
  - Service worker caches static assets and frequently accessed resources.
- Database Indexing
  - Ensure indexes on frequently queried columns to optimize read performance.

[No sources needed since this section provides general guidance]

## Security Architecture
- Secrets Management
  - All sensitive keys are stored in environment variables within Edge Functions.
- Authorization
  - Row-level security policies enforced at the database level.
- Input Validation
  - Validate inputs at both frontend and backend layers.
- Webhook Verification
  - Verify signatures from payment providers before processing events.

```mermaid
flowchart TD
Req["Incoming Request"] --> Validate["Validate & Sanitize"]
Validate --> AuthZ["Check AuthZ Policies"]
AuthZ --> Secret["Access Secrets via Env"]
Secret --> Execute["Execute Business Logic"]
Execute --> Log["Log Audit Events"]
Log --> Resp["Return Response"]
```

**Diagram sources**
- [supabase/functions/_shared/http.ts](file://supabase/functions/_shared/http.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)

**Section sources**
- [supabase/functions/_shared/http.ts](file://supabase/functions/_shared/http.ts)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)

## Scalability and Deployment Topology
- Horizontal Scaling
  - Edge Functions scale automatically with demand.
- CDN and Caching
  - Static assets served via CDN; service worker enhances offline performance.
- Multi-Platform Deployment
  - Web deployment via Netlify/Vercel configurations.
  - Mobile packaging via Capacitor for iOS/Android distribution.

```mermaid
graph TB
subgraph "Distribution"
Web["Web (Netlify/Vercel)"]
Mobile["Mobile (Capacitor)"]
end
subgraph "Compute"
Edge["Supabase Edge Functions"]
end
subgraph "Data"
DB["Postgres"]
end
Web --> Edge
Mobile --> Edge
Edge --> DB
```

**Diagram sources**
- [netlify.toml](file://netlify.toml)
- [vercel.json](file://vercel.json)
- [capacitor.config.ts](file://capacitor.config.ts)
- [supabase/functions/_shared/http.ts](file://supabase/functions/_shared/http.ts)
- [supabase/migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)

**Section sources**
- [netlify.toml](file://netlify.toml)
- [vercel.json](file://vercel.json)
- [capacitor.config.ts](file://capacitor.config.ts)

## Troubleshooting Guide
- Common Issues
  - Sync failures: Inspect queue and retry logic; verify network connectivity.
  - Payment webhook errors: Confirm signature verification and idempotency.
  - AI proxy timeouts: Check provider availability and rate limits.
- Debugging Tools
  - Use browser dev tools for local storage inspection.
  - Review Edge Function logs for server-side issues.

**Section sources**
- [src/lib/sync.js](file://src/lib/sync.js)
- [supabase/functions/paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [supabase/functions/paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [supabase/functions/ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)

## Conclusion
The ApplyGuard PH system employs a robust component-based architecture with a clear service layer separation and a local-first state management strategy. It leverages Supabase for backend services and data persistence, integrates payment providers securely via Edge Functions, and supports offline capabilities through a service worker. The design emphasizes scalability, security, and cross-platform deployment, providing a solid foundation for future enhancements.