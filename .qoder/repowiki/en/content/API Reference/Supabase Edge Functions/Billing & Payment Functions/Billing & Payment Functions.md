# Billing & Payment Functions

<cite>
**Referenced Files in This Document**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [shared/http.ts](file://supabase/functions/_shared/http.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)
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
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive API documentation for billing and payment-related Edge Functions, including checkout creation endpoints for PayMongo and PayPal, webhook handlers for payment processing, order capture functions, and subscription cancellation services. It specifies HTTP methods, URL patterns, request/response schemas, webhook payload formats, signature verification, idempotency considerations, error handling strategies, security best practices, and client implementation examples. It also covers webhook retry mechanisms, failure handling, and monitoring approaches.

## Project Structure
The billing and payment system is implemented as Supabase Edge Functions with shared utilities and database migrations:

- Checkout creation: create-checkout (PayMongo), create-paypal-order (PayPal)
- Webhooks: paymongo-webhook, paypal-webhook
- Order capture: capture-paypal-order
- Subscription management: cancel-subscription
- Shared utilities: http, paypal runtime and helpers, entitlements
- Database schema: 001_schema.sql, 002_paypal_fulfillment.sql

```mermaid
graph TB
subgraph "Edge Functions"
CC["create-checkout/index.ts"]
PMW["paymongo-webhook/index.ts"]
CPO["create-paypal-order/index.ts"]
CPOC["capture-paypal-order/index.ts"]
PW["paypal-webhook/index.ts"]
CS["cancel-subscription/index.ts"]
end
subgraph "Shared Utilities"
SH_HTTP["_shared/http.ts"]
SH_PR["_shared/paypal-runtime.ts"]
SH_PP["_shared/paypal.ts"]
SH_ENT["_shared/entitlement.ts"]
end
subgraph "Database"
DB1["migrations/001_schema.sql"]
DB2["migrations/002_paypal_fulfillment.sql"]
end
CC --> SH_HTTP
CC --> SH_ENT
PMW --> SH_ENT
CPO --> SH_PR
CPO --> SH_PP
CPOC --> SH_ENT
PW --> SH_ENT
CS --> SH_ENT
CC --> DB1
PMW --> DB1
CPO --> DB1
CPOC --> DB2
PW --> DB2
CS --> DB1
```

**Diagram sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [shared/http.ts](file://supabase/functions/_shared/http.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

**Section sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [shared/http.ts](file://supabase/functions/_shared/http.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)
- [migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

## Core Components
- Create Checkout (PayMongo): Creates a PayMongo checkout session and returns a redirect URL to complete payment.
- PayMongo Webhook: Receives PayMongo events, verifies signatures, updates order status, and fulfills entitlements.
- Create PayPal Order: Creates a PayPal order via the PayPal runtime and returns order details for client approval.
- Capture PayPal Order: Captures an approved PayPal order and fulfills entitlements upon success.
- PayPal Webhook: Processes PayPal events, verifies signatures, updates order state, and manages subscriptions.
- Cancel Subscription: Cancels an active subscription and revokes entitlements accordingly.

Key responsibilities:
- Securely interact with external payment providers using environment variables.
- Enforce idempotency on webhooks and captures.
- Update database records for orders and subscriptions.
- Grant or revoke user entitlements based on payment outcomes.

**Section sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)

## Architecture Overview
The payment architecture integrates client flows with provider-specific Edge Functions and shared entitlement logic.

```mermaid
sequenceDiagram
participant Client as "Client App"
participant CC as "create-checkout (PayMongo)"
participant PM as "PayMongo API"
participant PMW as "paymongo-webhook"
participant Ent as "Entitlements"
participant DB as "Database"
Client->>CC : POST /functions/v1/create-checkout {planId, userId}
CC->>PM : Create checkout session
PM-->>CC : {checkout_url}
CC-->>Client : {checkout_url}
Note over Client,PM : User completes payment on PayMongo
PM->>PMW : POST /functions/v1/paymongo-webhook {event, metadata}
PMW->>DB : Upsert order/payment record
PMW->>Ent : Grant entitlements
Ent-->>PMW : Success/Failure
PMW-->>PM : 200 OK
```

**Diagram sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [migrations/001_schema.sql](file://supabase/migrations/001_schema.sql)

```mermaid
sequenceDiagram
participant Client as "Client App"
participant CPO as "create-paypal-order"
participant PR as "PayPal Runtime"
participant PP as "PayPal API"
participant CPOC as "capture-paypal-order"
participant PW as "paypal-webhook"
participant Ent as "Entitlements"
participant DB as "Database"
Client->>CPO : POST /functions/v1/create-paypal-order {planId, userId}
CPO->>PR : Build order request
PR->>PP : CreateOrder
PP-->>PR : {order_id, status}
PR-->>CPO : {order_id, approve_url}
CPO-->>Client : {order_id, approve_url}
Client->>CPOC : POST /functions/v1/capture-paypal-order {order_id}
CPOC->>PR : CaptureOrder
PR->>PP : Capture order
PP-->>PR : {status, transaction_id}
CPOC->>DB : Record capture result
CPOC->>Ent : Grant entitlements
Ent-->>CPOC : Success/Failure
CPOC-->>Client : {success}
PP->>PW : POST /functions/v1/paypal-webhook {event, resource}
PW->>DB : Update order/subscription state
PW->>Ent : Fulfill or revoke entitlements
PW-->>PP : 200 OK
```

**Diagram sources**
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)
- [migrations/002_paypal_fulfillment.sql](file://supabase/migrations/002_paypal_fulfillment.sql)

## Detailed Component Analysis

### Create Checkout (PayMongo)
- Purpose: Create a PayMongo checkout session and return a URL for the client to redirect users to complete payment.
- HTTP Method: POST
- URL Pattern: /functions/v1/create-checkout
- Request Body:
  - planId: string — identifier for the product/plan
  - userId: string — authenticated user identifier
  - currency?: string — ISO currency code (optional)
  - amount?: number — total amount in minor units (optional)
  - metadata?: object — arbitrary key-value pairs forwarded to provider
- Response Body:
  - checkout_url: string — PayMongo hosted checkout page
  - id: string — internal checkout reference
  - status: string — initial status (e.g., pending)
- Error Responses:
  - 400 Bad Request: Missing required fields
  - 500 Internal Server Error: Provider or network errors
- Idempotency: Not applicable at creation; rely on webhook idempotency for fulfillment.
- Security:
  - Validate authentication context for userId
  - Use environment variables for provider credentials
  - Sanitize and validate inputs

```mermaid
flowchart TD
Start(["POST /create-checkout"]) --> Validate["Validate request body and auth"]
Validate --> CallProvider["Create PayMongo checkout session"]
CallProvider --> ProviderOK{"Provider response OK?"}
ProviderOK --> |Yes| ReturnURL["Return checkout_url and id"]
ProviderOK --> |No| HandleError["Return error with message"]
ReturnURL --> End(["Done"])
HandleError --> End
```

**Diagram sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [shared/http.ts](file://supabase/functions/_shared/http.ts)

**Section sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [shared/http.ts](file://supabase/functions/_shared/http.ts)

### PayMongo Webhook
- Purpose: Receive PayMongo events, verify signatures, update order/payment records, and fulfill entitlements.
- HTTP Method: POST
- URL Pattern: /functions/v1/paymongo-webhook
- Headers:
  - X-PayMongo-Signature: string — signature header for verification
- Request Body:
  - event: object — PayMongo event payload
  - data: object — event data (payment, checkout, etc.)
  - metadata: object — original metadata from checkout creation
- Signature Verification:
  - Verify HMAC signature using shared secret from environment
  - Reject requests with invalid or missing signatures
- Processing Logic:
  - Identify event type (e.g., payment.paid, checkout.completed)
  - Lookup order by metadata.orderId
  - Update order status and payment details
  - Grant entitlements if payment succeeded
- Idempotency:
  - Deduplicate events by event.id
  - Skip processing if already fulfilled
- Response:
  - 200 OK on successful processing
  - 400/401/403 for invalid signatures
  - 500 for internal errors
- Error Handling:
  - Log failures and continue processing other events
  - Retry strategy managed by provider; function should be idempotent

```mermaid
flowchart TD
Start(["POST /paymongo-webhook"]) --> VerifySig["Verify X-PayMongo-Signature"]
VerifySig --> SigOK{"Signature valid?"}
SigOK --> |No| Reject["Return 401 Unauthorized"]
SigOK --> |Yes| ParseEvent["Parse event and metadata"]
ParseEvent --> Dedup["Check idempotency by event.id"]
Dedup --> AlreadyProcessed{"Already processed?"}
AlreadyProcessed --> |Yes| Ack["Return 200 OK"]
AlreadyProcessed --> |No| UpdateOrder["Update order/payment records"]
UpdateOrder --> Fulfill["Grant entitlements"]
Fulfill --> Done["Return 200 OK"]
Reject --> End(["End"])
Ack --> End
Done --> End
```

**Diagram sources**
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

### Create PayPal Order
- Purpose: Create a PayPal order and return approval details for the client to finalize.
- HTTP Method: POST
- URL Pattern: /functions/v1/create-paypal-order
- Request Body:
  - planId: string — product/plan identifier
  - userId: string — authenticated user identifier
  - currency?: string — ISO currency code
  - amount?: number — total amount in minor units
  - metadata?: object — additional context
- Response Body:
  - order_id: string — PayPal order identifier
  - approve_url: string — client-side approval URL
  - status: string — initial order status
- Error Responses:
  - 400 Bad Request: Invalid input
  - 500 Internal Server Error: PayPal API or runtime errors
- Security:
  - Validate authentication context
  - Use PayPal runtime to manage tokens securely

```mermaid
sequenceDiagram
participant Client as "Client App"
participant CPO as "create-paypal-order"
participant PR as "PayPal Runtime"
participant PP as "PayPal API"
Client->>CPO : POST /create-paypal-order {planId, userId, ...}
CPO->>PR : Build order request
PR->>PP : CreateOrder
PP-->>PR : {order_id, status}
PR-->>CPO : {order_id, approve_url}
CPO-->>Client : {order_id, approve_url}
```

**Diagram sources**
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/paypal.ts](file://supabase/functions/_shared/paypal.ts)

**Section sources**
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/paypal.ts](file://supabase/functions/_shared/paypal.ts)

### Capture PayPal Order
- Purpose: Capture an approved PayPal order and fulfill entitlements upon success.
- HTTP Method: POST
- URL Pattern: /functions/v1/capture-paypal-order
- Request Body:
  - order_id: string — PayPal order identifier
  - userId: string — authenticated user identifier
- Response Body:
  - success: boolean — capture outcome
  - transaction_id?: string — PayPal transaction identifier
  - status: string — updated order status
- Error Responses:
  - 400 Bad Request: Missing order_id
  - 404 Not Found: Order not found
  - 500 Internal Server Error: Capture or fulfillment errors
- Idempotency:
  - Check existing capture status before processing
  - Avoid duplicate captures
- Security:
  - Validate ownership of order_id against userId
  - Ensure only approved orders are captured

```mermaid
flowchart TD
Start(["POST /capture-paypal-order"]) --> Validate["Validate order_id and userId"]
Validate --> CheckStatus["Check order status and approvals"]
CheckStatus --> Approved{"Order approved?"}
Approved --> |No| ReturnError["Return error"]
Approved --> |Yes| Capture["Capture order via PayPal Runtime"]
Capture --> CaptureOK{"Capture success?"}
CaptureOK --> |Yes| Fulfill["Grant entitlements"]
Fulfill --> ReturnSuccess["Return success and transaction_id"]
CaptureOK --> |No| ReturnError
ReturnError --> End(["End"])
ReturnSuccess --> End
```

**Diagram sources**
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

### PayPal Webhook
- Purpose: Process PayPal events, verify signatures, update order/subscription state, and manage entitlements.
- HTTP Method: POST
- URL Pattern: /functions/v1/paypal-webhook
- Headers:
  - PayPal-Auth-Algorithm: string — algorithm used for signature
  - PayPal-Transmission-ID: string — unique transmission ID
  - PayPal-Transmission-Time: string — timestamp
  - PayPal-Cert-URL: string — certificate URL
  - PayPal-Signature: string — signature value
- Request Body:
  - event_type: string — PayPal event type
  - resource: object — event resource (order, subscription, etc.)
  - metadata?: object — custom metadata
- Signature Verification:
  - Verify signature using provided certificate and algorithm
  - Validate transmission metadata
- Processing Logic:
  - Map event types to actions (e.g., ORDER.APPROVED, BILLING.SUBSCRIPTION.CANCELLED)
  - Update order/subscription records
  - Grant or revoke entitlements based on event
- Idempotency:
  - Deduplicate by transmission.id
  - Skip if already processed
- Response:
  - 200 OK on successful processing
  - 400/401/403 for invalid signatures or malformed payloads
  - 500 for internal errors

```mermaid
flowchart TD
Start(["POST /paypal-webhook"]) --> VerifySig["Verify PayPal signature and headers"]
VerifySig --> SigOK{"Signature valid?"}
SigOK --> |No| Reject["Return 401 Unauthorized"]
SigOK --> |Yes| Dedup["Deduplicate by transmission.id"]
Dedup --> Already{"Already processed?"}
Already --> |Yes| Ack["Return 200 OK"]
Already --> |No| Dispatch["Dispatch by event_type"]
Dispatch --> UpdateState["Update order/subscription state"]
UpdateState --> ManageEnt["Grant/revoke entitlements"]
ManageEnt --> Done["Return 200 OK"]
Reject --> End(["End"])
Ack --> End
Done --> End
```

**Diagram sources**
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

### Cancel Subscription
- Purpose: Cancel an active subscription and revoke associated entitlements.
- HTTP Method: POST
- URL Pattern: /functions/v1/cancel-subscription
- Request Body:
  - subscriptionId: string — provider subscription identifier
  - userId: string — authenticated user identifier
  - reason?: string — optional cancellation reason
- Response Body:
  - success: boolean — cancellation outcome
  - status: string — updated subscription status
- Error Responses:
  - 400 Bad Request: Missing subscriptionId or userId
  - 404 Not Found: Subscription not found
  - 500 Internal Server Error: Provider or internal errors
- Security:
  - Validate ownership of subscriptionId against userId
  - Ensure only active subscriptions can be cancelled
- Post-Cancellation:
  - Revoke entitlements immediately or at period end depending on policy
  - Update database records

```mermaid
flowchart TD
Start(["POST /cancel-subscription"]) --> Validate["Validate subscriptionId and userId"]
Validate --> FetchSub["Fetch subscription details"]
FetchSub --> Active{"Subscription active?"}
Active --> |No| ReturnError["Return error"]
Active --> |Yes| CancelProv["Cancel subscription with provider"]
CancelProv --> CancelOK{"Cancellation success?"}
CancelOK --> |Yes| RevokeEnt["Revoke entitlements"]
RevokeEnt --> ReturnSuccess["Return success and status"]
CancelOK --> |No| ReturnError
ReturnError --> End(["End"])
ReturnSuccess --> End
```

**Diagram sources**
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

## Dependency Analysis
The following diagram shows dependencies between Edge Functions and shared modules:

```mermaid
graph LR
CC["create-checkout/index.ts"] --> SH_HTTP["_shared/http.ts"]
CC --> SH_ENT["_shared/entitlement.ts"]
PMW["paymongo-webhook/index.ts"] --> SH_ENT
CPO["create-paypal-order/index.ts"] --> SH_PR["_shared/paypal-runtime.ts"]
CPO --> SH_PP["_shared/paypal.ts"]
CPOC["capture-paypal-order/index.ts"] --> SH_ENT
PW["paypal-webhook/index.ts"] --> SH_ENT
CS["cancel-subscription/index.ts"] --> SH_ENT
```

**Diagram sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [shared/http.ts](file://supabase/functions/_shared/http.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

**Section sources**
- [create-checkout/index.ts](file://supabase/functions/create-checkout/index.ts)
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [create-paypal-order/index.ts](file://supabase/functions/create-paypal-order/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)
- [shared/http.ts](file://supabase/functions/_shared/http.ts)
- [shared/paypal-runtime.ts](file://supabase/functions/_shared/paypal-runtime.ts)
- [shared/paypal.ts](file://supabase/functions/_shared/paypal.ts)
- [shared/entitlement.ts](file://supabase/functions/_shared/entitlement.ts)

## Performance Considerations
- Minimize external API calls by caching provider responses where safe.
- Use connection pooling and timeouts when calling external APIs.
- Keep webhook handlers fast and idempotent; offload heavy work to background jobs if needed.
- Batch entitlement updates when possible to reduce database writes.
- Monitor latency and error rates for each provider integration.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Invalid webhook signatures:
  - Ensure correct secrets and algorithms are configured
  - Verify headers and payload integrity
- Duplicate processing:
  - Confirm idempotency keys are used and checked
- Failed entitlement grants:
  - Check provider responses and database constraints
  - Implement retries with exponential backoff for transient errors
- Network timeouts:
  - Increase timeouts and implement circuit breakers
- Logging and monitoring:
  - Add structured logs for all critical steps
  - Track metrics for success/failure rates and latencies

**Section sources**
- [paymongo-webhook/index.ts](file://supabase/functions/paymongo-webhook/index.ts)
- [paypal-webhook/index.ts](file://supabase/functions/paypal-webhook/index.ts)
- [capture-paypal-order/index.ts](file://supabase/functions/capture-paypal-order/index.ts)
- [cancel-subscription/index.ts](file://supabase/functions/cancel-subscription/index.ts)

## Conclusion
The billing and payment system provides robust, secure, and idempotent workflows for both one-time payments and subscriptions across PayMongo and PayPal. By leveraging shared utilities for HTTP and provider interactions, and centralized entitlement management, the system ensures consistent fulfillment and reliable error handling. Proper signature verification, idempotency checks, and monitoring are essential to maintain reliability and security.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Client Implementation Examples
- PayMongo One-Time Payment Flow:
  - Initiate checkout via create-checkout endpoint
  - Redirect user to returned checkout_url
  - Wait for webhook confirmation before granting access
- PayPal One-Time Payment Flow:
  - Create order via create-paypal-order
  - Approve order on client side using approve_url
  - Capture order via capture-paypal-order
  - Fulfill entitlements upon success
- PayPal Subscription Management:
  - Create subscription through provider flow
  - Listen to paypal-webhook events for lifecycle changes
  - Cancel subscription via cancel-subscription endpoint

[No sources needed since this section provides conceptual guidance]

### Webhook Retry Mechanisms and Failure Handling
- Providers may retry failed deliveries; ensure functions are idempotent
- Implement deduplication using event IDs or transmission IDs
- Log all webhook attempts and outcomes for observability
- Use dead-letter queues for failed events requiring manual intervention

[No sources needed since this section provides conceptual guidance]

### Monitoring Approaches
- Track success/failure rates per endpoint
- Measure latency percentiles for provider calls
- Alert on signature verification failures and idempotency collisions
- Correlate logs with database state changes for audits

[No sources needed since this section provides conceptual guidance]