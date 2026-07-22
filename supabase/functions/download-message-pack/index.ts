import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ApiError, corsHeaders, errorResponse, optionsResponse, requestId } from "../_shared/http.ts";
import { effectiveTier } from "../_shared/entitlement.ts";

serve(async (req) => {
  const id = requestId(req);
  if (req.method === "OPTIONS") return optionsResponse(req);

  try {
    if (req.method !== "GET") throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed.");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new ApiError(401, "AUTH_REQUIRED", "Sign in to download your Message Pack.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError(401, "AUTH_INVALID", "Your session expired. Sign in and try again.");

    const { data: entitlement, error: entitlementError } = await supabase
      .from("entitlements")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
      
    if (entitlementError) throw new ApiError(500, "ENTITLEMENT_LOOKUP_FAILED", "Your purchase could not be checked. Please try again.", { retryable: true, internal: entitlementError.message });

    const hasPaidPro = effectiveTier(entitlement) === "premium";
    const hasStandalonePack = Boolean(entitlement?.has_message_pack);

    if (!hasPaidPro && !hasStandalonePack) {
      throw new ApiError(403, "MESSAGE_PACK_REQUIRED", "Pro entitlement or standalone Message Pack purchase is required to download the full PDF.");
    }

    let file: Uint8Array;
    try {
      file = await Deno.readFile(new URL("./ApplyGuard-PH-Message-Pack.pdf", import.meta.url));
    } catch (error) {
      throw new ApiError(500, "MESSAGE_PACK_UNAVAILABLE", "The Message Pack is temporarily unavailable. Please contact support.", { retryable: true, internal: error });
    }

    return new Response(file, {
      status: 200,
      headers: {
        ...corsHeaders(req),
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=ApplyGuard-PH-Message-Pack.pdf",
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(req, error, id, "download-message-pack");
  }
});
