// billing.js — browser-side billing helpers. Calls Supabase edge functions
// with the user's JWT. The functions handle PayMongo communication; this
// module just forwards the requests.

import { supabase } from "./supabase.js";

/** Start a checkout for a given plan. Returns the PayMongo checkout URL. */
export async function startCheckout(planId) {
  if (!supabase) throw new Error("Backend not configured");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in first");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ plan: planId }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Checkout failed");
  return body.checkout_url;
}

/** Cancel a subscription at PayMongo. */
export async function cancelSubscription() {
  if (!supabase) throw new Error("Backend not configured");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in first");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Cancel failed");
  return body;
}
