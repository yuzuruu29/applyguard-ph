import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { FEATURES } from "../_shared/prompts.ts";
import { ApiError, errorResponse, jsonResponse, optionsResponse, requestId } from "../_shared/http.ts";
import { calculateHaikuCostUsd } from "../_shared/budget.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
// Hard-lock proxy to pinned Haiku 4.5 model to guarantee cost calculations remain accurate
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

// Server-enforced input character limits per feature
const INPUT_LIMITS: Record<string, number> = {
  message: 10_000,
  deepscan: 15_000,
  resume: 30_000,
  interview: 15_000,
  interview_voice: 12_000,
  backgroundcheck: 5_700,
};

// Server-enforced output max_tokens per feature
const OUTPUT_MAX_TOKENS: Record<string, number> = {
  message: 600,
  deepscan: 1_200,
  resume: 1_600,
  interview: 1_000,
  interview_voice: 300,
  backgroundcheck: 1_000,
};

const MAX_VOICE_MESSAGES = 12;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type ConversationMessage = { role: "user" | "assistant"; content: string };
type AiBody = {
  feature?: string;
  rawText?: string;
  intake?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  messages?: ConversationMessage[];
};

function validateVoiceMessages(messages: unknown): messages is ConversationMessage[] {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_VOICE_MESSAGES) {
    return false;
  }
  let totalChars = 0;
  for (const message of messages) {
    if (!message || (message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") {
      return false;
    }
    const len = message.content.trim().length;
    if (len === 0 || len > 2_000) return false;
    totalChars += len;
  }
  return totalChars <= 12_000;
}

function validateNestedObjects(body: AiBody) {
  if (body.intake && typeof body.intake === "object") {
    if (JSON.stringify(body.intake).length > 2_000) {
      throw new ApiError(413, "INTAKE_TOO_LARGE", "The applicant profile context is too large.");
    }
  }
  if (body.settings && typeof body.settings === "object") {
    if (JSON.stringify(body.settings).length > 1_000) {
      throw new ApiError(413, "SETTINGS_TOO_LARGE", "The applicant settings context is too large.");
    }
  }
  if (body.extra && typeof body.extra === "object") {
    if (JSON.stringify(body.extra).length > 15_000) {
      throw new ApiError(413, "EXTRA_TOO_LARGE", "The extra payload context is too large.");
    }
  }
}

serve(async (req) => {
  const httpTraceId = requestId(req);
  if (req.method === "OPTIONS") return optionsResponse(req);
  if (req.method !== "POST") return errorResponse(req, new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed."), httpTraceId, "ai-proxy");

  // Generate ledger request ID 100% server-side to prevent client ID manipulation
  const ledgerRequestId = crypto.randomUUID();

  try {
    // 0. Phase 5 IP Rate Limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "127.0.0.1";
    const { data: ipAllowed, error: ipError } = await supabase.rpc("check_and_increment_ip_limit", {
      p_ip: clientIp,
      p_max_requests: 30,
      p_window_seconds: 60,
    });
    if (ipError || ipAllowed === false) {
      throw new ApiError(429, "IP_RATE_LIMIT_EXCEEDED", "Too many requests from this network. Please wait a moment and try again.");
    }

    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new ApiError(401, "AUTH_REQUIRED", "Sign in to use Premium AI features.");

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
    if (authError || !user) throw new ApiError(401, "AUTH_INVALID", "Your session expired. Sign in and try again.");

    // Verified Email check
    const isEmailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
    if (!isEmailVerified) {
      throw new ApiError(403, "EMAIL_UNVERIFIED", "Please verify your email address before using trial AI features.");
    }

    // Parse body
    let body: AiBody;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "INVALID_JSON", "The AI request was invalid.");
    }

    // Validate nested objects (intake, settings, extra)
    validateNestedObjects(body);

    // 2. Validate feature and strict input character bounds across all fields
    const feature = body.feature || "";
    if (!Object.hasOwn(FEATURES, feature)) throw new ApiError(400, "UNKNOWN_FEATURE", "Choose a valid AI feature.");

    const isVoiceInterview = feature === "interview_voice";
    const isBackgroundCheck = feature === "backgroundcheck";
    const maxInputLen = INPUT_LIMITS[feature] || 15_000;

    if (isVoiceInterview) {
      if (!validateVoiceMessages(body.messages)) {
        throw new ApiError(400, "INVALID_CONVERSATION", "The voice interview conversation exceeded 12 messages or 12,000 total characters.");
      }
    } else if (isBackgroundCheck) {
      const url = (body.extra?.url as string) || "";
      const companyName = (body.extra?.companyName as string) || "";
      const context = (body.extra?.context as string) || "";
      if (!url.trim()) throw new ApiError(400, "URL_REQUIRED", "Paste a URL to run a background check.");
      if (url.length > 500) throw new ApiError(413, "URL_TOO_LONG", "The URL is too long (max 500 chars).");
      if (companyName.length > 200) throw new ApiError(413, "NAME_TOO_LONG", "The company name is too long (max 200 chars).");
      if (context.length > 5_000) throw new ApiError(413, "CONTEXT_TOO_LONG", "The additional context is too long (max 5,000 chars).");
    } else {
      const rawText = (body.rawText || "").trim();
      const resumeText = ((body.extra?.resumeText as string) || "").trim();
      const totalLen = rawText.length + resumeText.length;
      if (!rawText && feature !== "resume") throw new ApiError(400, "POST_REQUIRED", "Paste a job post before using this feature.");
      if (rawText.length > 15_000 || resumeText.length > 15_000 || totalLen > maxInputLen) {
        throw new ApiError(413, "INPUT_TOO_LONG", `Input length (${totalLen} chars) exceeds maximum allowed (${maxInputLen} chars).`);
      }
    }

    // 3. Call reserve_ai_feature_usage RPC with server-generated ledgerRequestId
    const { data: reservation, error: rpcError } = await supabase.rpc("reserve_ai_feature_usage", {
      p_user_id: user.id,
      p_feature: feature,
      p_request_id: ledgerRequestId,
    });

    if (rpcError) {
      const msg = rpcError.message || "";
      if (msg.includes("trial_expired") || msg.includes("trial_exhausted") || msg.includes("trial_ineligible")) {
        throw new ApiError(402, "TRIAL_EXPIRED", "Your 7-day Pro Preview has ended. Upgrade to Pro for continued access.");
      }
      if (msg.includes("feature_quota_reached")) {
        throw new ApiError(429, "FEATURE_QUOTA_REACHED", "You have used all trial allowances for this feature.");
      }
      if (msg.includes("monthly_cap_reached")) {
        throw new ApiError(429, "MONTHLY_CAP_REACHED", "You have used all AI requests for this month.");
      }
      if (msg.includes("daily_budget_reached")) {
        throw new ApiError(503, "CIRCUIT_BREAKER_ACTIVE", "Daily AI capacity limit reached. Please try again tomorrow.");
      }
      throw new ApiError(500, "RESERVATION_FAILED", "AI entitlement could not be reserved. Try again.", { retryable: true, internal: msg });
    }

    const resRecord = Array.isArray(reservation) ? reservation[0] : reservation;
    const entitlementType = resRecord?.entitlement_type || "trial";

    // 4. Call Anthropic Messages API with Haiku 4.5
    const config = FEATURES[feature as keyof typeof FEATURES];
    const maxTokens = OUTPUT_MAX_TOKENS[feature] || config.maxTokens || 1000;

    const anthropicMessages = isVoiceInterview
      ? body.messages
      : [{
          role: "user",
          content: config.build({ rawText: body.rawText || "", intake: body.intake, settings: body.settings, extra: body.extra }),
        }];

    const systemPromptBlocks = [
      {
        type: "text",
        text: config.system,
      }
    ];

    let providerSucceeded = false;
    let finalSettled = false;
    let tokensIn = 0, tokensOut = 0, cacheReadTokens = 0, cacheCreateTokens = 0, costUsd = 0;
    let content = "";

    try {
      const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: AbortSignal.timeout(45_000),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          system: systemPromptBlocks,
          messages: anthropicMessages,
        }),
      });

      const aiBody = await aiResponse.json().catch(() => ({}));
      if (!aiResponse.ok) {
        throw new ApiError(502, "AI_PROVIDER_ERROR", "The AI provider could not complete this request. Please try again.", {
          retryable: aiResponse.status >= 429,
          internal: `status=${aiResponse.status}; type=${aiBody.error?.type || "unknown"}`,
        });
      }

      content = aiBody.content?.[0]?.text;
      if (typeof content !== "string" || !content) {
        throw new ApiError(502, "AI_EMPTY_RESPONSE", "The AI provider returned an empty response. Please try again.", { retryable: true });
      }

      // Provider call succeeded! Record token usage & cost
      providerSucceeded = true;
      const usage = aiBody.usage || {};
      tokensIn = usage.input_tokens || 0;
      tokensOut = usage.output_tokens || 0;
      cacheReadTokens = usage.cache_read_input_tokens || 0;
      cacheCreateTokens = usage.cache_creation_input_tokens || 0;
      costUsd = calculateHaikuCostUsd(usage);

      // Step 1: Transition to provider_completed
      const { data: recordSuccess, error: recordErr } = await supabase.rpc("settle_ai_feature_usage", {
        p_request_id: ledgerRequestId,
        p_status: "provider_completed",
        p_input_tokens: tokensIn,
        p_output_tokens: tokensOut,
        p_cache_read_tokens: cacheReadTokens,
        p_cache_create_tokens: cacheCreateTokens,
        p_cost_usd: costUsd,
      });

      if (recordErr || recordSuccess === false) {
        console.error(JSON.stringify({ requestId: ledgerRequestId, operation: "record-provider-completed", error: recordErr?.message || "RPC returned false" }));
      }

      // Step 2: Attempt final accounting settlement
      const { data: settleSuccess, error: settleError } = await supabase.rpc("settle_ai_feature_usage", {
        p_request_id: ledgerRequestId,
        p_status: "completed",
        p_input_tokens: tokensIn,
        p_output_tokens: tokensOut,
        p_cache_read_tokens: cacheReadTokens,
        p_cache_create_tokens: cacheCreateTokens,
        p_cost_usd: costUsd,
      });

      if (settleError || settleSuccess === false) {
        console.error(JSON.stringify({ requestId: ledgerRequestId, operation: "settle-completed", error: settleError?.message || "settlement returned false" }));
        
        // Mark settlement_pending so provider cost is preserved and NOT erased
        const { error: pendErr } = await supabase.rpc("settle_ai_feature_usage", {
          p_request_id: ledgerRequestId,
          p_status: "settlement_pending",
          p_cost_usd: costUsd,
        });

        if (pendErr) {
          console.error(JSON.stringify({ requestId: ledgerRequestId, operation: "settle-pending-fallback-failed", error: pendErr.message }));
        }

        throw new ApiError(500, "SETTLEMENT_FAILED", "Failed to finalize usage settlement.");
      }

      finalSettled = true;
    } finally {
      // ONLY release reservation if provider call failed BEFORE receiving a valid response.
      // NEVER touch or release a request where providerSucceeded === true!
      if (!providerSucceeded && !finalSettled) {
        const { data: failedSuccess, error: failedSettleErr } = await supabase.rpc("settle_ai_feature_usage", {
          p_request_id: ledgerRequestId,
          p_status: "failed",
        });
        if (failedSettleErr || failedSuccess === false) {
          console.error(JSON.stringify({ requestId: ledgerRequestId, operation: "settle-failed-cleanup", error: failedSettleErr?.message || "failed settlement returned false" }));
        }
      }
    }

    return jsonResponse(req, {
      text: content,
      tokensIn,
      tokensOut,
      cacheReadTokens,
      costUsd,
      entitlementType,
      requestId: ledgerRequestId,
    });
  } catch (error) {
    return errorResponse(req, error, httpTraceId, "ai-proxy");
  }
});
