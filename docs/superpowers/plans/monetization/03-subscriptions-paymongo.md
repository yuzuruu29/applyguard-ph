# Phase 3 — Subscriptions (PayMongo)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax. Requires Phases 1–2. **Verified against PayMongo docs on 2026-07-18** (subscriptions guide, events reference, checkout OpenAPI, webhook key concepts).

**Goal:** Real paid tiers. Card/Maya auto-renew via PayMongo Subscriptions API; GCash users buy 30-day manual renewals via Checkout Sessions; the Message Pack becomes a real one-time purchase.

**Architecture:** Three edge functions. `create-checkout` (JWT-protected) builds the right PayMongo flow per plan. `paymongo-webhook` (signature-verified, service-role) is the ONLY writer of entitlements — the browser can never self-upgrade. `cancel-subscription` (JWT) cancels at PayMongo; the user keeps Premium through the paid period (the date gate in `effectiveTier` handles the rest).

**Tech Stack:** Supabase Edge Functions (Deno), PayMongo API, supabase-js.

---

### Task 1: Pricing constants + one-time PayMongo plan setup

**Files:**
- Create: `src/lib/pricing.js`

- [ ] **Step 1: Write the pricing module**

`src/lib/pricing.js`:

```js
// pricing.js — the single source of truth for tiers shown in the UI and
// requested from create-checkout. Amounts in centavos (₱299 = 29900).
export const PLANS = {
  monthly: {
    id: "monthly",
    name: "Premium Monthly",
    priceDisplay: "₱299",
    periodDisplay: "per month",
    amount: 29900,
    kind: "subscription",
    interval: "month",
    blurb: "All four AI features, 60 AI uses a month. Auto-renews by card or Maya.",
  },
  yearly: {
    id: "yearly",
    name: "Premium Yearly",
    priceDisplay: "₱2,990",
    periodDisplay: "per year",
    amount: 299000,
    kind: "subscription",
    interval: "year",
    blurb: "Two months free. Auto-renews by card or Maya.",
  },
  gcash_30d: {
    id: "gcash_30d",
    name: "Premium — 30 days (GCash)",
    priceDisplay: "₱299",
    periodDisplay: "for 30 days",
    amount: 29900,
    kind: "manual_renewal",
    blurb: "Same Premium, paid with GCash. Does not auto-renew — come back and renew each month.",
  },
  pack: {
    id: "pack",
    name: "Message Pack",
    priceDisplay: "₱149",
    periodDisplay: "one time",
    amount: 14900,
    kind: "one_time",
    blurb: "20 message templates: cold applications, follow-ups, rate talk. Delivered to your email.",
  },
};

export const AI_FEATURES = [
  { id: "message", name: "AI message generator" },
  { id: "deepscan", name: "AI deep scam analysis" },
  { id: "resume", name: "Resume tailoring" },
  { id: "interview", name: "Interview prep" },
];
```

- [ ] **Step 2: Create the two PayMongo Plans (one-time, test mode)**

```bash
curl https://api.paymongo.com/v1/plans -u sk_test_YOUR_KEY: -H "Content-Type: application/json" -d "{\"data\":{\"attributes\":{\"name\":\"ApplyGuard Premium Monthly\",\"amount\":29900,\"currency\":\"PHP\",\"interval\":\"month\",\"interval_count\":1}}}"
curl https://api.paymongo.com/v1/plans -u sk_test_YOUR_KEY: -H "Content-Type: application/json" -d "{\"data\":{\"attributes\":{\"name\":\"ApplyGuard Premium Yearly\",\"amount\":299000,\"currency\":\"PHP\",\"interval\":\"year\",\"interval_count\":1}}}"
```

Save the returned `plan_...` ids as edge secrets (Task 2, Step 2).

- [ ] **Step 3: Commit**

```bash
git add src/lib/pricing.js
git commit -m "feat: pricing plan constants"
```

---

### Task 2: Edge function scaffolding + secrets

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/paymongo.ts`
- Create: `supabase/functions/_shared/admin.ts`

- [ ] **Step 1: Write the shared helpers**

`supabase/functions/_shared/cors.ts`:

```ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

`supabase/functions/_shared/paymongo.ts`:

```ts
const BASE = "https://api.paymongo.com/v1";

export async function paymongo(path: string, options: { method?: string; body?: unknown } = {}) {
  const key = Deno.env.get("PAYMONGO_SECRET_KEY");
  if (!key) throw new Error("PAYMONGO_SECRET_KEY not set");
  const res = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${key}:`)}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail || `PayMongo ${res.status}`;
    throw new Error(detail);
  }
  return data;
}
```

`supabase/functions/_shared/admin.ts`:

```ts
import { createClient } from "jsr:@supabase/supabase-js@2";

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

// Verify the caller's JWT (from the Authorization header) and return the user.
export async function requireUser(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
```

- [ ] **Step 2: Set the edge secrets**

```bash
npx supabase secrets set PAYMONGO_SECRET_KEY=sk_test_YOUR_KEY
npx supabase secrets set PAYMONGO_PLAN_MONTHLY_ID=plan_xxx
npx supabase secrets set PAYMONGO_PLAN_YEARLY_ID=plan_yyy
npx supabase secrets set APP_ORIGIN=https://YOUR-SITE-URL
```

(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` are provided automatically by the functions runtime.)

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/_shared
git commit -m "feat: edge function shared helpers"
```

---

### Task 3: `create-checkout` edge function

Handles all four plans. Subscriptions (card/Maya): get-or-create customer → create subscription → fetch its first invoice → pay it → return the hosted payment URL. GCash/pack: one-time Checkout Session → return `checkout_url`.

**Files:**
- Create: `supabase/functions/create-checkout/index.ts`

- [ ] **Step 1: Write the function**

`supabase/functions/create-checkout/index.ts`:

```ts
import { corsHeaders, json } from "../_shared/cors.ts";
import { paymongo } from "../_shared/paymongo.ts";
import { adminClient, requireUser } from "../_shared/admin.ts";

const PLANS: Record<string, { amount: number; name: string; kind: string }> = {
  monthly: { amount: 29900, name: "Premium Monthly", kind: "subscription" },
  yearly: { amount: 299000, name: "Premium Yearly", kind: "subscription" },
  gcash_30d: { amount: 29900, name: "Premium — 30 days (GCash)", kind: "manual_renewal" },
  pack: { amount: 14900, name: "Message Pack", kind: "one_time" },
};

async function getOrCreateCustomer(supabase, user) {
  const { data: row } = await supabase
    .from("entitlements")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (row?.provider_customer_id) return row.provider_customer_id;

  const res = await paymongo("/customers", {
    method: "POST",
    body: {
      data: {
        attributes: {
          first_name: user.user_metadata?.full_name?.split(" ")?.[0] || "ApplyGuard",
          last_name: user.user_metadata?.full_name?.split(" ")?.slice(1).join(" ") || "User",
          email: user.email,
        },
      },
    },
  });
  const customerId = res.data.id;
  await supabase
    .from("entitlements")
    .update({ provider: "paymongo", provider_customer_id: customerId })
    .eq("user_id", user.id);
  return customerId;
}

async function startSubscription(supabase, user, planId: string) {
  const customerId = await getOrCreateCustomer(supabase, user);
  const pmPlanId = Deno.env.get(planId === "yearly" ? "PAYMONGO_PLAN_YEARLY_ID" : "PAYMONGO_PLAN_MONTHLY_ID");

  const sub = await paymongo("/subscriptions", {
    method: "POST",
    body: { data: { attributes: { plan_id: pmPlanId, customer_id: customerId } } },
  });
  const subId = sub.data.id;

  await supabase
    .from("entitlements")
    .update({ provider: "paymongo", provider_subscription_id: subId, provider_customer_id: customerId })
    .eq("user_id", user.id);

  // Find the first invoice, then ask PayMongo to collect it. The response
  // contains the hosted URL where the customer pays (and vaults their card).
  // Field names here are the one PayMongo shape to VERIFY against test keys
  // (00-architecture.md §9.4): adjust INVOICE_URL_FIELD if the payload differs.
  const invoices = await paymongo(`/invoices?subscription_id=${subId}`);
  const firstInvoice = invoices?.data?.[0];
  if (!firstInvoice) throw new Error("No first invoice on the new subscription");
  const payment = await paymongo(`/invoices/${firstInvoice.id}/pay`, { method: "POST" });
  const attrs = payment?.data?.attributes || {};
  const url = attrs.checkout_url || attrs.payment_url || attrs.access_url;
  if (!url) throw new Error("PayMongo returned no payment URL for the first invoice");
  return url;
}

async function startOneTime(user, plan) {
  const origin = Deno.env.get("APP_ORIGIN") ?? "";
  const ref = `${plan.kind}:${user.id}:${Date.now()}`;
  const res = await paymongo("/checkout_sessions", {
    method: "POST",
    body: {
      data: {
        attributes: {
          line_items: [{ name: plan.name, amount: plan.amount, currency: "PHP", quantity: 1 }],
          payment_method_types: plan.id === "gcash_30d" ? ["gcash"] : ["gcash", "card", "paymaya"],
          description: `ApplyGuard PH — ${plan.name}`,
          reference_number: ref,
          customer_email: user.email,
          success_url: `${origin}/account?paid=1`,
          cancel_url: `${origin}/offers`,
          metadata: { user_id: user.id, kind: plan.kind, plan_id: plan.id },
        },
      },
    },
  });
  const url = res?.data?.attributes?.checkout_url;
  if (!url) throw new Error("PayMongo returned no checkout URL");
  return url;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireUser(req);
    if (!user?.email) return json({ error: "Sign in first." }, 401);

    const { plan } = await req.json();
    const planDef = PLANS[plan];
    if (!planDef) return json({ error: "Unknown plan." }, 400);

    const supabase = adminClient();
    const url =
      planDef.kind === "subscription"
        ? await startSubscription(supabase, user, plan)
        : await startOneTime(user, { ...planDef, id: plan });

    return json({ url });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
```

- [ ] **Step 2: Deploy**

```bash
npx supabase functions deploy create-checkout
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-checkout
git commit -m "feat: create-checkout edge function"
```

---

### Task 4: `paymongo-webhook` edge function

The only writer of entitlements. Signature-verified; idempotent via the `payments` unique key.

**Files:**
- Create: `supabase/functions/paymongo-webhook/index.ts`

- [ ] **Step 1: Write the function**

`supabase/functions/paymongo-webhook/index.ts`:

```ts
import { paymongo } from "../_shared/paymongo.ts";
import { adminClient } from "../_shared/admin.ts";

const ok = () => new Response(JSON.stringify({ received: true }), { status: 200 });
const PLUS_30_DAYS = 30 * 24 * 60 * 60 * 1000;

async function verifySignature(rawBody: string, header: string | null): Promise<boolean> {
  if (!header) return false;
  const secret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");
  if (!secret) return false;
  // Header format: t=<unix>,te=<test sig>,li=<live sig>
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=")));
  const t = parts.t;
  const sig = parts.li || parts.te;
  if (!t || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // 5-min tolerance
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${rawBody}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === sig;
}

async function recordPayment(supabase, row): Promise<boolean> {
  // true = newly inserted; false = duplicate delivery (idempotent skip)
  const { error } = await supabase.from("payments").insert(row);
  if (error && String(error.code) === "23505") return false; // unique violation
  if (error) throw error;
  return true;
}

async function entitlementBySubscription(supabase, subId: string) {
  const { data } = await supabase
    .from("entitlements")
    .select("user_id")
    .eq("provider_subscription_id", subId)
    .maybeSingle();
  return data?.user_id ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  const valid = await verifySignature(rawBody, req.headers.get("Paymongo-Signature"));
  if (!valid) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(rawBody);
  const type = event?.data?.attributes?.type as string;
  const resource = event?.data?.attributes?.data ?? {};
  const supabase = adminClient();

  try {
    switch (type) {
      case "subscription.activated": {
        const userId = await entitlementBySubscription(supabase, resource.id);
        if (userId) {
          await supabase
            .from("entitlements")
            .update({
              tier: "premium",
              status: "active",
              current_period_end: resource.attributes?.next_billing_schedule ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
        break;
      }

      case "subscription.invoice.paid": {
        const subId = resource.attributes?.resource_id;
        const userId = subId ? await entitlementBySubscription(supabase, subId) : null;
        if (userId) {
          // Pull the authoritative next billing date from PayMongo.
          const sub = await paymongo(`/subscriptions/${subId}`);
          const nextEnd = sub?.data?.attributes?.next_billing_schedule ?? null;
          await supabase
            .from("entitlements")
            .update({ tier: "premium", status: "active", current_period_end: nextEnd, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
          await recordPayment(supabase, {
            user_id: userId,
            provider: "paymongo",
            provider_payment_id: `inv_${resource.id}`,
            kind: "subscription_cycle",
            amount: resource.attributes?.amount ?? 0,
            currency: resource.attributes?.currency ?? "PHP",
            status: "paid",
          });
        }
        break;
      }

      case "subscription.past_due":
      case "subscription.invoice.payment_failed": {
        const subId = type === "subscription.past_due" ? resource.id : resource.attributes?.resource_id;
        const userId = subId ? await entitlementBySubscription(supabase, subId) : null;
        if (userId) {
          await supabase.from("entitlements").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("user_id", userId);
        }
        break;
      }

      case "subscription.unpaid": {
        const userId = await entitlementBySubscription(supabase, resource.id);
        if (userId) {
          // Retries exhausted — downgrade now.
          await supabase
            .from("entitlements")
            .update({ tier: "free", status: "cancelled", updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        }
        break;
      }

      case "subscription.updated": {
        const userId = await entitlementBySubscription(supabase, resource.id);
        const cancelled = resource.attributes?.status === "cancelled" || resource.attributes?.cancelled_at;
        if (userId && cancelled) {
          // Keep the paid-through date — effectiveTier lets them finish it.
          await supabase.from("entitlements").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("user_id", userId);
        }
        break;
      }

      case "payment.paid": {
        // One-time flows (GCash manual renewal, Message Pack).
        const attrs = resource.attributes ?? {};
        const meta = attrs.metadata ?? {};
        const ref: string = meta.pm_reference_number || attrs.external_reference_number || "";
        // Prefer explicit metadata; fall back to parsing our reference_number "kind:userId:ts".
        let kind = meta.kind as string | undefined;
        let userId = meta.user_id as string | undefined;
        if (!kind || !userId) {
          const [k, u] = ref.split(":");
          if (k && u) {
            kind = k;
            userId = u;
          }
        }
        if (!kind || !userId) break;

        const fresh = await recordPayment(supabase, {
          user_id: userId,
          provider: "paymongo",
          provider_payment_id: resource.id,
          kind: kind === "manual_renewal" ? "manual_renewal" : "one_time",
          amount: attrs.amount ?? 0,
          currency: attrs.currency ?? "PHP",
          status: "paid",
        });
        if (!fresh) break; // duplicate webhook delivery

        if (kind === "manual_renewal") {
          const { data: current } = await supabase
            .from("entitlements")
            .select("current_period_end")
            .eq("user_id", userId)
            .maybeSingle();
          const today = new Date().toISOString().slice(0, 10);
          const base =
            current?.current_period_end && current.current_period_end > today
              ? new Date(current.current_period_end)
              : new Date();
          const newEnd = new Date(base.getTime() + PLUS_30_DAYS).toISOString().slice(0, 10);
          await supabase
            .from("entitlements")
            .update({ tier: "premium", status: "active", current_period_end: newEnd, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        }
        // kind === "one_time" (Message Pack): recorded above; fulfillment is
        // manual (templates emailed) — no entitlement change.
        break;
      }

      default:
        // Unhandled event types are ACKed so PayMongo doesn't retry them.
        break;
    }
  } catch (err) {
    console.error("webhook handler error", type, err);
    return new Response("Handler error", { status: 500 }); // lets PayMongo retry
  }

  return ok();
});
```

- [ ] **Step 2: Deploy + register the webhook**

```bash
npx supabase functions deploy paymongo-webhook
```

Register the endpoint (dashboard → Webhooks, or API):

```bash
curl https://api.paymongo.com/v1/webhooks -u sk_test_YOUR_KEY: -H "Content-Type: application/json" -d "{\"data\":{\"attributes\":{\"url\":\"https://YOUR-PROJECT.supabase.co/functions/v1/paymongo-webhook\",\"events\":[\"payment.paid\",\"subscription.activated\",\"subscription.updated\",\"subscription.past_due\",\"subscription.unpaid\",\"subscription.invoice.paid\",\"subscription.invoice.payment_failed\"]}}}"
```

Save the returned webhook secret as `PAYMONGO_WEBHOOK_SECRET`:

```bash
npx supabase secrets set PAYMONGO_WEBHOOK_SECRET=whsk_xxx
```

- [ ] **Step 3: Verify signature handling with curl**

```bash
# Unsigned request must be rejected:
curl -i -X POST https://YOUR-PROJECT.supabase.co/functions/v1/paymongo-webhook -H "Content-Type: application/json" -d "{\"data\":{\"attributes\":{\"type\":\"payment.paid\",\"data\":{}}}}"
```

Expected: `401 Invalid signature`. (Signed end-to-end verification happens with the PayMongo test card in Task 7.)

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/paymongo-webhook
git commit -m "feat: paymongo webhook with signature verification"
```

---

### Task 5: `cancel-subscription` edge function

**Files:**
- Create: `supabase/functions/cancel-subscription/index.ts`

- [ ] **Step 1: Write the function**

`supabase/functions/cancel-subscription/index.ts`:

```ts
import { corsHeaders, json } from "../_shared/cors.ts";
import { paymongo } from "../_shared/paymongo.ts";
import { adminClient, requireUser } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "Sign in first." }, 401);

    const supabase = adminClient();
    const { data: row } = await supabase
      .from("entitlements")
      .select("provider_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (row?.provider_subscription_id) {
      await paymongo(`/subscriptions/${row.provider_subscription_id}`, { method: "DELETE" });
    }
    // Premium continues until current_period_end — the webhook's
    // subscription.updated (cancelled) event records the status, and
    // effectiveTier lets the user finish the time they paid for.
    return json({ ok: true });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
```

- [ ] **Step 2: Deploy + commit**

```bash
npx supabase functions deploy cancel-subscription
git add supabase/functions/cancel-subscription
git commit -m "feat: cancel-subscription edge function"
```

---

### Task 6: Frontend — billing client, entitlement in AuthProvider, Offers page

**Files:**
- Create: `src/lib/billing.js`
- Modify: `src/auth.jsx`
- Modify: `src/components/OffersPage.jsx`

- [ ] **Step 1: Write the billing client**

`src/lib/billing.js`:

```js
// billing.js — starts a PayMongo checkout for a plan. Returns the URL to
// redirect to. Throws with a user-friendly message on failure.
import { supabase } from "./supabase.js";

export async function startCheckout(planId) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Sign in first — then pick a plan.");

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ plan: planId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || "Couldn't start checkout. Try again.");
  return data.url;
}

export async function cancelSubscription() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error("Sign in first.");
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Couldn't cancel. Try again.");
  return true;
}
```

- [ ] **Step 2: Expose entitlement + tier from AuthProvider**

In `src/auth.jsx`, add imports and state:

```js
import { effectiveTier, monthlyUsage, AI_MONTHLY_CAP } from "./lib/entitlement.js";
```

```js
const [entitlement, setEntitlement] = useState(null);
const [usageCount, setUsageCount] = useState(0);

const refreshEntitlement = useCallback(async () => {
  if (!backendEnabled || !session?.user) {
    setEntitlement(null);
    setUsageCount(0);
    return;
  }
  const [{ data: ent }, { data: usage }] = await Promise.all([
    supabase.from("entitlements").select("*").eq("user_id", session.user.id).maybeSingle(),
    supabase.from("ai_usage").select("created_at").eq("user_id", session.user.id),
  ]);
  setEntitlement(ent);
  setUsageCount(monthlyUsage(usage || []));
}, [session?.user?.id]);

useEffect(() => {
  refreshEntitlement();
}, [refreshEntitlement]);

const tier = effectiveTier(entitlement);
```

Add `entitlement`, `tier`, `usageCount`, `aiCap: AI_MONTHLY_CAP`, `refreshEntitlement` to the context value (import `useCallback` from react).

- [ ] **Step 3: Rewrite the Offers page**

Replace `src/components/OffersPage.jsx` entirely:

```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { PLANS, AI_FEATURES } from "../lib/pricing.js";
import { startCheckout } from "../lib/billing.js";

const FEATURED = "yearly";

function PlanCard({ plan, featured }) {
  const { user, backendEnabled } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleBuy = async () => {
    setError("");
    if (!backendEnabled) {
      setError("Checkout isn't configured on this copy yet.");
      return;
    }
    if (!user) {
      navigate("/account");
      return;
    }
    setBusy(true);
    try {
      const url = await startCheckout(plan.id);
      window.location.assign(url);
    } catch (err) {
      setError(err?.message || "Couldn't start checkout. Try again.");
      setBusy(false);
    }
  };

  return (
    <div
      className={`rise elev elev-hover flex flex-col rounded-3xl border bg-card p-6 ${
        featured ? "border-brand shadow-sm shadow-brand/10" : "border-line"
      }`}
    >
      {featured && (
        <span className="mb-3 w-fit rounded-full bg-brand px-3 py-1 text-xs font-semibold text-paper">
          Best value
        </span>
      )}
      <h2 className="font-display text-2xl text-ink">{plan.name}</h2>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className="font-mono text-3xl font-semibold text-ink">{plan.priceDisplay}</span>
        <span className="text-sm text-ink-faint">{plan.periodDisplay}</span>
      </div>
      <p className="mt-3 text-ink-soft">{plan.blurb}</p>
      <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
        {plan.kind !== "one_time"
          ? AI_FEATURES.map((f) => (
              <li key={f.id} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>{f.name}</span>
              </li>
            ))
          : [
              "20 message templates: cold applications, follow-ups, rate talk",
              "Polite scripts for asking a sketchy poster the right questions",
              "Works with the prompts this scanner gives you",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
      </ul>
      <button
        type="button"
        onClick={handleBuy}
        disabled={busy}
        className={`mt-6 rounded-full px-5 py-3 text-center font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 ${
          featured ? "bg-brand text-paper hover:bg-brand-deep" : "border border-ink/15 bg-paper text-ink hover:border-brand"
        }`}
      >
        {busy ? "Opening checkout…" : plan.kind === "one_time" ? `Buy for ${plan.priceDisplay}` : "Go Premium"}
      </button>
      {error && <p className="mt-2 text-center text-xs font-medium text-stop-ink">{error}</p>}
    </div>
  );
}

export default function OffersPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Premium</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          The scanner stays free. Premium adds the AI heavy lifting.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          No feature you use today is ever gated. Premium adds four AI tools on top — written
          applications, deep scam analysis, resume tailoring, and interview prep.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Object.values(PLANS).map((plan) => (
          <PlanCard key={plan.id} plan={plan} featured={plan.id === FEATURED} />
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-panel/50 p-6 text-sm text-ink-soft">
        <p className="font-semibold text-ink">Honest billing notes</p>
        <ul className="mt-2 space-y-1.5">
          <li>• Card and Maya subscriptions auto-renew. Cancel any time from your account page — you keep Premium until the paid period ends.</li>
          <li>• GCash can't auto-renew in the Philippines. The GCash option gives you 30 days of Premium per payment; renew manually.</li>
          <li>• 60 AI uses per month, shared across the four tools. Plenty for real use; it exists to stop scripted abuse.</li>
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-soft">
        <span>Just want the free scanner?</span>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-full border border-brand bg-card px-4 font-semibold text-brand transition-colors hover:bg-brand hover:text-paper"
        >
          Go back and scan a job
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build + commit**

Run: `npm run build`
Expected: build succeeds.

```bash
git add src/lib/billing.js src/auth.jsx src/components/OffersPage.jsx
git commit -m "feat: real pricing page with paymongo checkout"
```

---

### Task 7: Account page subscription management + test-mode E2E

**Files:**
- Modify: `src/components/AccountPage.jsx`

- [ ] **Step 1: Replace the Subscription section**

In `AccountPage.jsx`, replace the `<section>…Subscription…</section>` block with:

```jsx
<section className="elev space-y-4 rounded-3xl border border-line bg-card p-6 sm:p-8">
  <h2 className="font-display text-xl text-ink">Subscription</h2>
  {tier === "premium" ? (
    <>
      <p className="text-sm">
        <span className="rounded-full bg-go-soft px-3 py-1 font-semibold text-go-ink">Premium active</span>
      </p>
      <p className="text-sm text-ink-soft">
        Paid through <span className="font-medium text-ink">{entitlement?.current_period_end || "—"}</span>.
        {entitlement?.status === "cancelled" && " Auto-renew is off — you keep Premium until that date."}
        {entitlement?.status === "past_due" && " Your latest payment failed — update your card; PayMongo retries daily for 3 days."}
      </p>
      <p className="text-sm text-ink-soft">
        AI uses this month: <span className="font-mono text-ink">{usageCount} / {aiCap}</span>
      </p>
      {entitlement?.provider_subscription_id && entitlement?.status !== "cancelled" && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={cancelling}
          className="rounded-full border border-stop/40 bg-stop-soft px-5 py-2.5 text-sm font-semibold text-stop-ink transition-colors hover:border-stop disabled:opacity-60"
        >
          {cancelling ? "Cancelling…" : "Cancel auto-renew"}
        </button>
      )}
    </>
  ) : (
    <>
      <p className="text-sm text-ink-soft">You're on the free tier. Premium adds the four AI features.</p>
      <Link
        to="/offers"
        className="inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep"
      >
        See Premium
      </Link>
    </>
  )}
</section>
```

Add to the top of the component:

```js
const { user, loading, backendEnabled, signInWithEmail, signOut, entitlement, tier, usageCount, aiCap, refreshEntitlement } = useAuth();
const [cancelling, setCancelling] = useState(false);
const handleCancel = async () => {
  if (!window.confirm("Cancel auto-renew? You keep Premium until the paid period ends.")) return;
  setCancelling(true);
  try {
    await cancelSubscription();
    notify("Auto-renew cancelled. Premium stays until your paid-through date.", "success");
    setTimeout(refreshEntitlement, 3000); // webhook flips the status shortly
  } catch (err) {
    notify(err?.message || "Couldn't cancel. Try again.", "error");
  } finally {
    setCancelling(false);
  }
};
```

Add imports: `import { cancelSubscription } from "../lib/billing.js";` and `import { useLocation } from "react-router-dom";`, and use `notify` from `useApp()` (add to the existing destructure).

Also handle the `?paid=1` return: at the top of the component, read `new URLSearchParams(useLocation().search).get("paid")` and, when present, show a one-time success banner ("Payment received — Premium activates when PayMongo confirms, usually seconds.") and call `refreshEntitlement()` in a short `setTimeout`.

- [ ] **Step 2: Test-mode end-to-end (manual, with PayMongo test keys)**

1. Sign in → Offers → Premium Monthly → redirected to PayMongo hosted page.
2. Pay with the PayMongo **test card** `4343 4343 4343 4345`, any future expiry, any CVC.
3. Return to `/account?paid=1` → within ~10s, "Premium active" with a paid-through date.
4. In Supabase: `entitlements` row shows `tier=premium`; `payments` has the invoice row.
5. Cancel auto-renew → status flips to cancelled; Premium remains until the date.
6. GCash 30-day card → hosted page shows GCash only (test-mode approve) → entitlement extends +30 days.

- [ ] **Step 3: Commit**

```bash
git add src/components/AccountPage.jsx
git commit -m "feat: subscription management on account page"
```

---

**Phase 3 done when:** a test payment flips a user to Premium via webhook (never via the browser), cancel keeps access until the paid-through date, GCash manual renewal extends +30 days, and unsigned webhook calls are rejected with 401.
