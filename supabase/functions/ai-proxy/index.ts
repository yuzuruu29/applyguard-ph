// ai-proxy — Supabase Edge Function (Deno)
// Verifies JWT, checks premium entitlement + monthly quota, builds the prompt,
// calls Anthropic, logs token usage, returns the generated text. The post text
// is processed in memory and never stored.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { effectiveTier, AI_MONTHLY_CAP } from "../_shared/entitlement.ts";
import { FEATURES } from "../_shared/prompts.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401 });
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });

  // Parse body
  let body: { feature?: string; rawText?: string; intake?: Record<string, unknown>; settings?: Record<string, unknown>; extra?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const feature = body.feature as string;
  if (!feature || !FEATURES[feature as keyof typeof FEATURES]) {
    return new Response(JSON.stringify({ error: `Unknown feature: ${feature}` }), { status: 400 });
  }

  const isVoiceInterview = feature === "interview_voice";

  // For regular features, require rawText (the job post). For voice interview, we expect an array of messages.
  if (!isVoiceInterview && (!body.rawText || !body.rawText.trim())) {
    return new Response(JSON.stringify({ error: "No job post text provided" }), { status: 400 });
  }
  if (isVoiceInterview && (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0)) {
    return new Response(JSON.stringify({ error: "No conversation messages provided" }), { status: 400 });
  }

  // ── Entitlement check ─────────────────────────────────────────────
  const { data: ent } = await supabase
    .from("entitlements")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (effectiveTier(ent) !== "premium") {
    return new Response(JSON.stringify({ error: "Premium required for AI features" }), { status: 402 });
  }

  // ── Quota check ───────────────────────────────────────────────────
  const now = new Date();
  const monthPrefix = now.toISOString().slice(0, 7);
  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", `${monthPrefix}-01`)
    .lt("created_at", `${monthPrefix}-31`);

  if ((count || 0) >= AI_MONTHLY_CAP) {
    return new Response(JSON.stringify({ error: "Monthly AI quota reached (60 uses). Resets next month." }), { status: 429 });
  }

  // ── Build prompt + call Anthropic ─────────────────────────────────
  const config = FEATURES[feature as keyof typeof FEATURES];
  const anthropicMessages = isVoiceInterview 
    ? body.messages 
    : [{ 
        role: "user", 
        content: config.build({
          rawText: body.rawText,
          intake: body.intake,
          settings: body.settings,
          extra: body.extra,
        }) 
      }];

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: config.maxTokens,
        system: config.system,
        messages: anthropicMessages,
      }),
    });

    const aiBody = await aiRes.json();

    if (!aiRes.ok) {
      console.error("Anthropic error:", JSON.stringify(aiBody));
      return new Response(JSON.stringify({ error: "AI provider error. Try again." }), { status: 502 });
    }

    const content = aiBody.content?.[0]?.text || "";
    const tokensIn = aiBody.usage?.input_tokens || 0;
    const tokensOut = aiBody.usage?.output_tokens || 0;

    // ── Log usage ───────────────────────────────────────────────────
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      feature,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
    });

    return new Response(JSON.stringify({ text: content, tokensIn, tokensOut }), { status: 200 });
  } catch (err) {
    console.error("AI proxy error:", err);
    return new Response(JSON.stringify({ error: "AI request failed. Try again." }), { status: 502 });
  }
});
