# Integration Patterns

<cite>
**Referenced Files in This Document**
- [ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [http.ts](file://supabase/functions/_shared/http.ts)
- [paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [billing.js](file://src/lib/billing.js)
- [ai.js](file://src/lib/ai.js)
- [03-subscriptions-paymongo.md](file://docs/superpowers/plans/monetization/03-subscriptions-paymongo.md)
- [04-ai-features.md](file://docs/superpowers/plans/monetization/04-ai-features.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Security Considerations](#security-considerations)
9. [Monitoring and Observability](#monitoring-and-observability)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Conclusion](#conclusion)

## Introduction
This document describes the external integration patterns for AI services, payment processing (PayMongo and PayPal), and webhook handling. It focuses on API client patterns, retry strategies, error handling, subscription billing lifecycle, order fulfillment, authentication flows, data transformation, security considerations, rate limiting, and monitoring strategies for third-party dependencies.

## Project Structure
The integration surface is split between:
- Serverless functions (Supabase Functions) that act as secure proxies to third-party APIs and handle webhooks
- Shared libraries for HTTP transport and domain-specific clients (e.g., PayPal)
- Frontend libraries that orchestrate user flows and call serverless endpoints

```mermaid
graph TB
subgraph "Frontend"
FE_Billing["billing.js"]
FE_AI["ai.js"]
end
subgraph "Supabase Functions"
FC_CreateCheckout["create-checkout/index.ts"]
FC_PaymongoWebhook["paymongo-webhook/index.ts"]
FC_CancelSub["cancel-subscription/index.ts"]
FC_AIProxy["ai-proxy/index.ts"]
FC_PP_CreateOrder["create-paypal-order/index.ts"]
FC_PP_CaptureOrder["capture-paypal-order/index.ts"]
FC_PP_Webhook["paypal-webhook/index.ts"]
SH_HTTP["_shared/http.ts"]
SH_PP["_shared/paypal.ts"]
SH_PP_RT["_shared/paypal-runtime.ts"]
SH_Entitlement["_shared/entitlement.ts"]
end
subgraph "External Services"
PayMongo["PayMongo API"]
PayPal["PayPal API"]
AIProvider["AI Provider API"]
end
FE_Billing --> FC_CreateCheckout
FC_CreateCheckout --> PayMongo
PayMongo -- "webhook" --> FC_PaymongoWebhook
FE_Billing --> FC_PP_CreateOrder
FC_PP_CreateOrder --> PayPal
PayPal -- "webhook" --> FC_PP_Webhook
FE_Billing --> FC_PP_CaptureOrder
FC_PP_CaptureOrder --> PayPal
FE_AI --> FC_AIProxy
FC_AIProxy --> AIProvider
FC_CreateCheckout --> SH_HTTP
FC_PaymongoWebhook --> SH_HTTP
FC_PP_CreateOrder --> SH_PP
FC_PP_CaptureOrder --> SH_PP
FC_PP_Webhook --> SH_PP
FC_PP_CreateOrder --> SH_PP_RT
FC_PP_CaptureOrder --> SH_PP_RT
FC_PaymongoWebhook --> SH_Entitlement
FC_PP_Webhook --> SH_Entitlement
```

**Diagram sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)
- [http.ts](file://supabase/functions/_shared/http.ts)
- [paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [billing.js](file://src/lib/billing.js)
- [ai.js](file://src/lib/ai.js)

**Section sources**
- [03-subscriptions-paymongo.md](file://docs/superpowers/plans/monetization/03-subscriptions-paymongo.md)
- [04-ai-features.md](file://docs/superpowers/plans/monetization/04-ai-features.md)

## Core Components
- HTTP transport layer: Centralized request/response handling, headers, timeouts, retries, and error normalization used by all integrations.
- PayPal client: Encapsulates PayPal SDK/runtime configuration, order creation, capture, and webhook signature verification.
- Entitlements: Applies feature access based on subscription status and plan attributes.
- Billing orchestration: Frontend library coordinates checkout and order flows with serverless endpoints.
- AI proxy: Securely forwards prompts to the AI provider with credentials and response mapping.

Key responsibilities:
- Authentication and signing for outbound calls
- Idempotency and deduplication for webhooks
- Robust error handling and retry policies
- Data transformation between internal models and provider payloads

**Section sources**
- [http.ts](file://supabase/functions/_shared/http.ts)
- [paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [billing.js](file://src/lib/billing.js)
- [ai.js](file://src/lib/ai.js)

## Architecture Overview
The system uses a thin frontend that delegates sensitive operations to serverless functions. These functions authenticate to third-party providers, transform payloads, persist state, and emit events or update entitlements. Webhooks are handled idempotently to ensure consistent state.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Billing as "billing.js"
participant Checkout as "create-checkout/index.ts"
participant PayMongo as "PayMongo API"
participant Webhook as "paymongo-webhook/index.ts"
participant Entitle as "entitlement.ts"
Client->>Billing : "Initiate checkout"
Billing->>Checkout : "POST /create-checkout"
Checkout->>PayMongo : "Create payment link/session"
PayMongo-->>Checkout : "Payment URL + metadata"
Checkout-->>Billing : "Redirect URL"
Note over Client,Billing : "User completes payment externally"
PayMongo-->>Webhook : "Event payload"
Webhook->>Entitle : "Update entitlements"
Entitle-->>Webhook : "Result"
Webhook-->>PayMongo : "200 OK"
```

**Diagram sources**
- [billing.js](file://src/lib/billing.js)
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

## Detailed Component Analysis

### AI Service Integration
The AI integration follows a proxy pattern to keep secrets off the client and normalize responses. The frontend sends requests to a dedicated function which authenticates to the AI provider and returns structured results.

```mermaid
sequenceDiagram
participant UI as "UI"
participant AILib as "ai.js"
participant Proxy as "ai-proxy/index.ts"
participant Provider as "AI Provider API"
UI->>AILib : "Generate response"
AILib->>Proxy : "POST /ai-proxy {prompt, options}"
Proxy->>Provider : "Authenticated request"
Provider-->>Proxy : "Streamed or final response"
Proxy-->>AILib : "Normalized result"
AILib-->>UI : "Render output"
```

**Diagram sources**
- [ai.js](file://src/lib/ai.js)
- [ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)

**Section sources**
- [ai.js](file://src/lib/ai.js)
- [ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)
- [04-ai-features.md](file://docs/superpowers/plans/monetization/04-ai-features.md)

### PayMongo Subscription Billing
The PayMongo flow creates a checkout session, redirects the user, and updates entitlements upon successful payment via webhook. Cancellation is supported through a dedicated endpoint.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Billing as "billing.js"
participant Create as "create-checkout/index.ts"
participant PM as "PayMongo API"
participant WH as "paymongo-webhook/index.ts"
participant Ent as "entitlement.ts"
Client->>Billing : "Start subscription"
Billing->>Create : "POST /create-checkout"
Create->>PM : "Create checkout"
PM-->>Create : "Checkout URL"
Create-->>Billing : "URL"
Billing-->>Client : "Redirect"
PM-->>WH : "Payment succeeded event"
WH->>Ent : "Grant entitlements"
Ent-->>WH : "Updated state"
WH-->>PM : "Acknowledge"
```

Cancellation flow:

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Cancel as "cancel-subscription/index.ts"
participant PM as "PayMongo API"
Client->>Cancel : "Cancel subscription"
Cancel->>PM : "Cancel subscription"
PM-->>Cancel : "Cancellation confirmed"
Cancel-->>Client : "Status updated"
```

**Diagram sources**
- [billing.js](file://src/lib/billing.js)
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [billing.js](file://src/lib/billing.js)
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [03-subscriptions-paymongo.md](file://docs/superpowers/plans/monetization/03-subscriptions-paymongo.md)

### PayPal Order Lifecycle and Fulfillment
PayPal integration includes order creation, capture, and webhook-driven fulfillment. The shared PayPal client abstracts runtime configuration and API calls.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant Billing as "billing.js"
participant PPCreate as "create-paypal-order/index.ts"
participant PPCap as "capture-paypal-order/index.ts"
participant PPWebhook as "paypal-webhook/index.ts"
participant PPAPI as "PayPal API"
participant Ent as "entitlement.ts"
Client->>Billing : "Start PayPal checkout"
Billing->>PPCreate : "POST /create-paypal-order"
PPCreate->>PPAPI : "Create order"
PPAPI-->>PPCreate : "Order ID + approval URL"
PPCreate-->>Billing : "Approval URL"
Billing-->>Client : "Redirect to approve"
Client->>PPCap : "POST /capture-paypal-order"
PPCap->>PPAPI : "Capture order"
PPAPI-->>PPCap : "Captured"
PPAPI-->>PPWebhook : "Payment completed event"
PPWebhook->>Ent : "Grant entitlements"
Ent-->>PPWebhook : "Updated state"
PPWebhook-->>PPAPI : "Acknowledge"
```

**Diagram sources**
- [billing.js](file://src/lib/billing.js)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [billing.js](file://src/lib/billing.js)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

### API Client Patterns and Retry Strategies
A centralized HTTP client standardizes:
- Request construction and header management
- Timeout and cancellation semantics
- Retry policy with exponential backoff and jitter
- Error classification and normalized responses
- Idempotency keys where applicable

```mermaid
flowchart TD
Start(["HTTP Call Entry"]) --> Build["Build request<br/>headers, body, idempotency key"]
Build --> Attempt{"Attempt < max?"}
Attempt --> |No| Fail["Return normalized error"]
Attempt --> |Yes| Send["Send request"]
Send --> Resp{"Response status"}
Resp --> |Success| Return["Normalize and return"]
Resp --> |Retryable| Backoff["Compute backoff + jitter"]
Backoff --> Wait["Wait"]
Wait --> Attempt
Resp --> |Non-retryable| Fail
```

**Diagram sources**
- [http.ts](file://supabase/functions/_shared/http.ts)

**Section sources**
- [http.ts](file://supabase/functions/_shared/http.ts)

### Webhook Handling Mechanisms
Webhooks must be verified, parsed, deduplicated, and processed idempotently. Both PayMongo and PayPal handlers follow similar patterns:
- Validate signatures or use platform verification
- Parse event payload and extract entity IDs
- Check local state to avoid duplicate processing
- Apply business changes (e.g., grant entitlements)
- Acknowledge receipt

```mermaid
flowchart TD
WStart(["Webhook Received"]) --> Verify["Verify signature/auth"]
Verify --> Valid{"Valid?"}
Valid --> |No| Reject["Reject and log"]
Valid --> |Yes| Dedup["Check idempotency store"]
Dedup --> Seen{"Already processed?"}
Seen --> |Yes| Ack["Acknowledge and exit"]
Seen --> |No| Transform["Transform to internal model"]
Transform --> Apply["Apply changes (e.g., entitlements)"]
Apply --> Persist["Persist outcome"]
Persist --> Ack["Acknowledge"]
```

**Diagram sources**
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

## Dependency Analysis
The following diagram shows how components depend on each other and external services.

```mermaid
graph LR
FE_Billing["billing.js"] --> FC_Checkout["create-checkout/index.ts"]
FE_Billing --> FC_PP_Create["create-paypal-order/index.ts"]
FE_Billing --> FC_PP_Capture["capture-paypal-order/index.ts"]
FE_AI["ai.js"] --> FC_AIProxy["ai-proxy/index.ts"]
FC_Checkout --> SH_HTTP["_shared/http.ts"]
FC_Checkout --> PayMongo["PayMongo API"]
FC_PP_Create --> SH_PP["_shared/paypal.ts"]
FC_PP_Create --> SH_PP_RT["_shared/paypal-runtime.ts"]
FC_PP_Create --> PayPal["PayPal API"]
FC_PP_Capture --> SH_PP
FC_PP_Capture --> PayPal
FC_PP_Webhook["paypal-webhook/index.ts"] --> SH_PP
FC_PP_Webhook --> Entitlement["_shared/entitlement.ts"]
FC_PM_Webhook["paymongo-webhook/index.ts"] --> SH_HTTP
FC_PM_Webhook --> Entitlement
FC_Cancel["cancel-subscription/index.ts"] --> SH_HTTP
FC_Cancel --> PayMongo
FC_AIProxy --> AIProv["AI Provider API"]
```

**Diagram sources**
- [billing.js](file://src/lib/billing.js)
- [ai.js](file://src/lib/ai.js)
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)
- [http.ts](file://supabase/functions/_shared/http.ts)
- [paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [billing.js](file://src/lib/billing.js)
- [ai.js](file://src/lib/ai.js)
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [ai-proxy/index.ts](file://supabase/functions/ai-proxy/index.ts)
- [http.ts](file://supabase/functions/_shared/http.ts)
- [paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

## Performance Considerations
- Use connection pooling and reuse clients where possible to reduce handshake overhead.
- Prefer streaming responses for long-running AI calls to improve perceived latency.
- Implement circuit breakers around third-party calls to fail fast during outages.
- Cache static configuration (e.g., PayPal client settings) at function startup.
- Batch or coalesce idempotent writes when processing high-volume webhooks.

[No sources needed since this section provides general guidance]

## Security Considerations
- Store secrets in environment variables; never hardcode credentials.
- Verify webhook signatures using provider-provided algorithms and secret values.
- Enforce least privilege for service accounts and API keys.
- Validate and sanitize all inbound payloads before processing.
- Use HTTPS-only communication and enforce TLS versions.
- Implement idempotency keys for create and capture operations to prevent double-charging.
- Restrict IP ranges or origins if supported by providers.

[No sources needed since this section provides general guidance]

## Monitoring and Observability
- Log structured events for each integration step (request, response, errors).
- Track success/failure rates, latency percentiles, and retry counts per provider.
- Emit metrics for webhook processing time and deduplication hits.
- Alert on sustained error spikes, signature verification failures, and timeout increases.
- Correlate logs across frontend, serverless functions, and provider dashboards.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Webhook not received: Ensure public URLs are configured and DNS resolves correctly; verify provider’s delivery logs.
- Signature verification failed: Confirm secret values and algorithm match provider documentation; check timezone and clock skew.
- Duplicate processing: Verify idempotency checks and unique constraints in storage.
- Payment captured but entitlement not granted: Inspect post-capture steps and transaction boundaries; add compensating actions.
- Rate limited by provider: Reduce concurrency, implement backoff, and queue retries.

**Section sources**
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [http.ts](file://supabase/functions/_shared/http.ts)

## Conclusion
The integration architecture centralizes sensitive operations in serverless functions, standardizes HTTP behavior, and enforces robust error handling and idempotency. PayMongo and PayPal flows are clearly separated into creation, capture, and webhook stages, while the AI proxy secures provider interactions. With proper security, observability, and resilience measures, the system can reliably manage subscriptions and fulfill orders across multiple providers.