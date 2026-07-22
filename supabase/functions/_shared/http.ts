export class ApiError extends Error {
  status: number;
  code: string;
  retryable: boolean;
  internal?: unknown;

  constructor(status: number, code: string, message: string, options: { retryable?: boolean; internal?: unknown } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.internal = options.internal;
  }
}

function allowedOrigins() {
  return (Deno.env.get("APP_ORIGIN") || "https://applyguard-ph.vercel.app")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function corsHeaders(req: Request) {
  const origins = allowedOrigins();
  const requestOrigin = req.headers.get("Origin");
  const allowedOrigin = requestOrigin && origins.includes(requestOrigin) ? requestOrigin : origins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-paypal-setup-token",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function jsonResponse(req: Request, body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export function optionsResponse(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export function requestId(req: Request) {
  return req.headers.get("sb-request-id") || crypto.randomUUID();
}

export function errorResponse(req: Request, error: unknown, id: string, operation: string) {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.", { retryable: true, internal: error });

  console.error(JSON.stringify({
    requestId: id,
    operation,
    code: apiError.code,
    status: apiError.status,
    internal: apiError.internal instanceof Error ? apiError.internal.message : apiError.internal,
  }));

  return jsonResponse(req, {
    error: {
      code: apiError.code,
      message: apiError.message,
      retryable: apiError.retryable,
    },
    requestId: id,
  }, apiError.status);
}
