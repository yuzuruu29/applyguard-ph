import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { m } from "motion/react";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { PLANS, AI_FEATURES } from "../lib/pricing.js";
import { createPayPalOrder, capturePayPalOrder } from "../lib/billing.js";
import { useReducedMotion } from "../motion/useMotionConfig.js";
import { duration, easing } from "../motion/tokens.js";
import TrialLedger from "./TrialLedger.jsx";

const TIER_CARDS = [
  { ...PLANS.monthly, featured: false, icon: "🔄" },
  { ...PLANS.yearly, featured: true, icon: "⭐" },
  { ...PLANS.pack, featured: false, icon: "✉️" },
];

function OffersContent({ paypalConfigured }) {
  const { user, backendEnabled, tier: currentTier, entitlement, refreshEntitlement } = useAuth();
  const { notify } = useApp();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [checkingOut, setCheckingOut] = useState(null);
  const paymentsEnabled = backendEnabled && paypalConfigured;

  // Per-feature trial usage from the server row, if present. The ledger only
  // *displays* these — it never derives counts locally.
  const trialUsed = (entitlement && entitlement.trial_used) || {};

  const handlePayPalApprove = async (data, actions, planId) => {
    try {
      setCheckingOut(planId);
      const result = await capturePayPalOrder(data.orderID);
      if (result.pending) {
        notify(result.message || "Payment is processing. Access will activate automatically.", "info");
        setCheckingOut(null);
        return;
      }

      await refreshEntitlement();
      notify(
        planId === "pack"
          ? "Payment successful! Your Message Pack is ready in Account."
          : "Payment successful! Pro tier is active now.",
        "success",
      );
      navigate("/account");
    } catch (err) {
      if (err?.code === "INSTRUMENT_DECLINED" && actions?.restart) {
        notify("That funding source was declined. Choose another one in PayPal.", "warn");
        setCheckingOut(null);
        return actions.restart();
      }
      notify(err?.message || "PayPal capture failed.", "error");
      setCheckingOut(null);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Plans & Pricing</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          Free scanner included. Upgrade to Pro for AI superpowers.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          The scanner, scam detection, tracker, and copy-prompts remain free forever. Pro unlocks tailored AI assistance for deep credibility scans, resume matching, outreach, and interview practice.
        </p>

        {/* 7-Day Pro Preview Banner */}
        {(!entitlement || entitlement.trial_status === "eligible") && (
          <div className="mt-6 rounded-3xl border border-brand bg-brand/5 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-md">
              <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-paper">Pro Preview</span>
              <h2 className="mt-2 font-display text-2xl text-ink">Try ApplyGuard Pro free for 7 days</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Limited AI scans, resume tailoring, outreach assistance, and interview practice. No credit card required.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate("/account");
                    notify("Sign in to start your 7-day Pro Preview.", "info");
                  } else {
                    navigate("/scan");
                    notify("Run your first AI request to automatically activate your 7-day Pro Preview.", "info");
                  }
                }}
                className="mt-5 rounded-full bg-brand px-6 py-3 font-semibold text-paper hover:bg-brand-deep transition-all duration-200"
              >
                Start 7-Day Pro Preview
              </button>
            </div>
            <div className="w-full lg:w-80 shrink-0">
              <TrialLedger used={trialUsed} />
            </div>
          </div>
        )}

        {currentTier === "premium" && (
          <p className="mt-3 rounded-2xl bg-go-soft border border-go/30 px-4 py-2 text-sm font-semibold text-go-ink">
            You're currently on Pro. View your paid-through date on your Account page.
          </p>
        )}
        {!paymentsEnabled && (
          <p className="mt-3 rounded-2xl bg-warn-soft border border-warn/30 px-4 py-2 text-sm text-warn-ink">
            Live payments are temporarily unavailable. Checkout buttons are disabled.
          </p>
        )}
      </header>

      {/* Tier Breakdown Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIER_CARDS.map((plan, i) => (
          <div key={plan.id} style={{ animationDelay: `${0.07 * i}s` }}
            className={`rise elev elev-hover relative flex flex-col rounded-3xl bg-card p-6 ${
              plan.featured
                ? "overflow-hidden border-2 border-brand ring-1 ring-brand/20 ring-offset-2 ring-offset-card shadow-sm shadow-brand/10"
                : "border border-line"}`}>
            {/* Pro Pass: one controlled border-light traversal on enter-view — never a constant pulse */}
            {plan.featured && !reduced && (
              <m.span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-brand/15 to-transparent"
                initial={{ x: 0 }}
                whileInView={{ x: "460%" }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: duration.reveal * 1.7, ease: easing.enter, delay: 0.25 }}
              />
            )}
            {/* Pro Pass: small green entitlement seal */}
            {plan.featured && (
              <span
                className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-go/40 bg-go-soft text-go-ink"
                aria-label="Best value plan"
              >
                <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
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
            
            {plan.id !== "pack" ? (
              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
                {AI_FEATURES.map((f) => (
                  <li key={f.id} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                    <span>{f.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
                <li>20 adaptable application and follow-up templates</li>
                <li>Rate negotiation and recruiter reply scripts</li>
                <li>Instant protected PDF download after payment</li>
              </ul>
            )}

            <div className="mt-6 flex flex-col gap-2">
              {!user ? (
                <button type="button"
                  onClick={() => {
                    navigate("/account");
                    notify("Sign in first to upgrade to Pro.", "info");
                  }}
                  className={`w-full rounded-full px-5 py-3 text-center font-semibold transition-all duration-200 ${
                    plan.featured
                      ? "bg-brand text-paper hover:-translate-y-0.5 hover:bg-brand-deep"
                      : "border border-brand bg-card text-brand hover:bg-brand hover:text-paper"}`}>
                  Sign in to buy
                </button>
              ) : currentTier === "premium" && plan.id !== "pack" ? (
                <button type="button" disabled
                  className="w-full rounded-full px-5 py-3 text-center font-semibold bg-panel text-ink-faint border border-line cursor-not-allowed">
                  Already Active
                </button>
              ) : paymentsEnabled && (
                <div className="w-full">
                  {checkingOut === plan.id && <p className="mb-2 text-center text-sm font-medium text-brand">Processing payment…</p>}
                  <PayPalButtons 
                    style={{ layout: "horizontal", height: 48, color: "gold", shape: "pill" }}
                    createOrder={async () => {
                      setCheckingOut(plan.id);
                      return await createPayPalOrder(plan.id);
                    }}
                    onApprove={(data, actions) => handlePayPalApprove(data, actions, plan.id)}
                    onError={() => {
                      notify("PayPal checkout failed. No completed payment was recorded.", "error");
                      setCheckingOut(null);
                    }}
                    onCancel={() => setCheckingOut(null)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-ink-soft">
        Looking for the free tool?{" "}
        <Link to="/" className="font-medium text-brand hover:text-brand-deep">Go back and scan a job</Link>.
      </p>
    </div>
  );
}

export default function OffersPage() {
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  if (!paypalClientId) return <OffersContent paypalConfigured={false} />;

  return (
    <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "PHP", intent: "capture" }}>
      <OffersContent paypalConfigured />
    </PayPalScriptProvider>
  );
}
