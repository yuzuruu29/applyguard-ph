import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { PLANS, AI_FEATURES } from "../lib/pricing.js";
import { startCheckout } from "../lib/billing.js";

const TIER_CARDS = [
  { ...PLANS.monthly, featured: false, icon: "🔄" },
  { ...PLANS.yearly, featured: true, icon: "⭐" },
  { ...PLANS.gcash_30d, featured: false, icon: "📱" },
];

export default function OffersPage() {
  const { user, backendEnabled, tier: currentTier } = useAuth();
  const { notify } = useApp();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(null);

  const handleCheckout = async (planId) => {
    if (!user) {
      navigate("/account");
      notify("Sign in first to get Premium.", "info");
      return;
    }
    setCheckingOut(planId);
    try {
      const url = await startCheckout(planId);
      window.location.href = url;
    } catch (err) {
      notify(err?.message || "Checkout failed. Try again.", "error");
      setCheckingOut(null);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Premium</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          The scanner is free. Premium adds AI.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          The scanner, verdicts, tracker, and copy-prompt stay free forever. Premium unlocks four
          AI features on the result page — 60 uses a month.
        </p>
        {currentTier === "premium" && (
          <p className="mt-3 rounded-2xl bg-go-soft border border-go/30 px-4 py-2 text-sm font-semibold text-go-ink">
            You're already on Premium. Manage your subscription on the Account page.
          </p>
        )}
        {!backendEnabled && (
          <p className="mt-3 rounded-2xl bg-warn-soft border border-warn/30 px-4 py-2 text-sm text-warn-ink">
            Payments aren't configured yet. Checkout buttons are disabled.
          </p>
        )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIER_CARDS.map((plan, i) => (
          <div key={plan.id} style={{ animationDelay: `${0.07 * i}s` }}
            className={`rise elev elev-hover flex flex-col rounded-3xl border bg-card p-6 ${
              plan.featured ? "border-brand shadow-sm shadow-brand/10" : "border-line"}`}>
            {plan.featured && (
              <span className="mb-3 w-fit rounded-full bg-brand px-3 py-1 text-xs font-semibold text-paper">Best value</span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">{plan.icon}</span>
              <h2 className="font-display text-2xl text-ink">{plan.name}</h2>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-semibold text-ink">{plan.priceDisplay}</span>
              <span className="text-sm text-ink-faint">{plan.periodDisplay}</span>
            </div>
            <p className="mt-3 text-ink-soft">{plan.blurb}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
              {AI_FEATURES.map((f) => (
                <li key={f.id} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span>{f.name}</span>
                </li>
              ))}
            </ul>
            {plan.id === "gcash_30d" && (
              <p className="mt-3 rounded-xl bg-warn-soft/50 px-3 py-2 text-xs text-warn-ink">
                GCash does not support auto-renew. Come back each month to renew manually.
              </p>
            )}
            <button type="button"
              disabled={!backendEnabled || currentTier === "premium" || checkingOut !== null}
              onClick={() => handleCheckout(plan.id)}
              className={`mt-6 rounded-full px-5 py-3 text-center font-semibold transition-all duration-200 ${
                plan.featured
                  ? "bg-brand text-paper hover:-translate-y-0.5 hover:bg-brand-deep active:translate-y-0 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  : "border border-brand bg-card text-brand hover:bg-brand hover:text-paper disabled:opacity-60 disabled:cursor-not-allowed"}`}>
              {checkingOut === plan.id ? "Redirecting…" : !user ? "Sign in to subscribe" : currentTier === "premium" ? "Already Premium" : "Subscribe"}
            </button>
            {plan.kind === "manual_renewal" && <p className="mt-2 text-center text-xs text-ink-faint">Paid via PayMongo. GCash — one-time, renews manually.</p>}
            {plan.kind === "subscription" && <p className="mt-2 text-center text-xs text-ink-faint">Paid via PayMongo. Auto-renews until cancelled.</p>}
          </div>
        ))}
      </div>
      </header>

      <section className="elev rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">{PLANS.pack.name}</h2>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-semibold text-ink">{PLANS.pack.priceDisplay}</span>
          <span className="text-sm text-ink-faint">one time</span>
        </div>
        <p className="mt-2 text-ink-soft">{PLANS.pack.blurb}</p>
        <button type="button" disabled={!backendEnabled || checkingOut !== null}
          onClick={() => handleCheckout("pack")}
          className="mt-4 rounded-full border border-brand bg-card px-6 py-3 font-semibold text-brand transition-all duration-200 hover:bg-brand hover:text-paper disabled:opacity-60 disabled:cursor-not-allowed">
          {checkingOut === "pack" ? "Redirecting…" : !user ? "Sign in to buy" : "Buy Message Pack"}
        </button>
      </section>
      <p className="text-sm text-ink-soft">
        Looking for the free tool?{" "}
        <Link to="/" className="font-medium text-brand hover:text-brand-deep">Go back and scan a job</Link>.
      </p>
    </div>
  );
}