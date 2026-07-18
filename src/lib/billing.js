// billing.js — browser-side billing helpers. Calls Supabase edge functions
// with the user's JWT. The functions handle PayMongo communication; this
// module just forwards the requests.

import { supabase } from "./supabase.js";

/** Create a PayPal order. Returns the order ID. */
export async function createPayPalOrder(planId, metadata = null) {
  if (!supabase) throw new Error("Backend not configured");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in first");

  const bodyData = { plan: planId };
  if (metadata) bodyData.metadata = metadata;

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paypal-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(bodyData),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "PayPal order creation failed");
  return body.id;
}

/** Capture a PayPal order. Returns success. */
export async function capturePayPalOrder(orderID) {
  if (!supabase) throw new Error("Backend not configured");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in first");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/capture-paypal-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ orderID }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "PayPal capture failed");
  return body.success;
}
