---
kind: logging_system
name: No Centralized Logging System
category: logging_system
scope:
    - '**'
source_files:
    - src/main.jsx
    - src/components/MockInterviewPage.jsx
    - supabase/functions/_shared/http.ts
    - supabase/functions/ai-proxy/index.ts
---

This repository does not implement a centralized logging system. There is no dedicated logger library, log configuration file, or structured logging framework anywhere in the codebase.

**Frontend (src/):** All logging is done via bare `console.error(...)` calls scattered across components and libraries — for example, speech recognition errors in `MockInterviewPage.jsx`, camera access failures, and generic error dumps. No log levels, no structured fields, no transport layer.

**Supabase Edge Functions (supabase/functions/):** The only structured output pattern is `console.error(JSON.stringify({ requestId, operation, code, status, internal }))` inside `_shared/http.ts:errorResponse` and ad-hoc usage-update failure logs in `ai-proxy/index.ts`. These are plain console writes to Deno's stdout; there is no logger initialization, no log rotation, no sink configuration, and no correlation-id propagation beyond the request-scoped `id` variable.

There is no `log/` or `logging/` directory, no package.json dependency on any logging library (winston, pino, bunyan, debug, etc.), and no environment-driven log-level management. Errors bubble up as thrown `ApiError` objects rather than being emitted through a logging API.