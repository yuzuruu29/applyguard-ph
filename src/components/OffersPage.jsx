import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { PLANS, AI_FEATURES } from "../lib/pricing.js";
import { createPayPalOrder, capturePayPalOrder } from "../lib/billing.js";

const TIER_CARDS = [
  { ...PLANS.monthly, featured: false, icon: "🔄" },
  { ...PLANS.yearly, featured: true, icon: "⭐" },
  { ...PLANS.pack, featured: false, icon: "✉️" },
];

export default function OffersPage() {
  const { user, backendEnabled, tier: currentTier } = useAuth();
  const { notify } = useApp();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(null);
  const [packIndustry, setPackIndustry] = useState("tech");

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";

  const handlePayPalApprove = async (data, actions) => {
    try {
      setCheckingOut("paypal");
      await capturePayPalOrder(data.orderID);
      notify("Payment successful! You are now Premium.", "success");
      window.location.reload();
    } catch (err) {
      notify(err?.message || "PayPal capture failed.", "error");
      setCheckingOut(null);
    }
  };

  return (
    <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "PHP" }}>
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
                <div className="mt-4 flex-1 flex flex-col gap-3">
                  <label className="text-sm font-semibold text-ink">Select Industry</label>
                  <select 
                    value={packIndustry} 
                    onChange={(e) => setPackIndustry(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                  >
                    <option value="tech">Tech / Engineering</option>
                    <option value="creative">Creative / Design</option>
                    <option value="admin">Admin / Operations</option>
                    <option value="marketing">Marketing / Sales</option>
                    <option value="finance">Finance / Accounting</option>
                  </select>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2">
                {!user ? (
                  <button type="button"
                    onClick={() => {
                      navigate("/account");
                      notify("Sign in first to get Premium.", "info");
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
                    Already Premium
                  </button>
                ) : backendEnabled && (
                  <div className="w-full">
                    {checkingOut === plan.id && <p className="mb-2 text-center text-sm font-medium text-brand">Processing payment…</p>}
                    <PayPalButtons 
                      style={{ layout: "horizontal", height: 48, color: "gold", shape: "pill" }}
                      createOrder={async () => {
                        setCheckingOut(plan.id);
                        return await createPayPalOrder(plan.id, plan.id === "pack" ? { industry: packIndustry } : null);
                      }}
                      onApprove={handlePayPalApprove}
                      onError={(err) => {
                        notify("PayPal checkout failed or was cancelled.", "error");
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
        </header>

      {/* Premium Sample Section */}
      <section className="elev space-y-8 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div>
          <h2 className="font-display text-2xl text-ink">What exactly do I get?</h2>
          <p className="mt-2 text-ink-soft">
            Premium activates a powerful AI assistant right on your scan results page. It reads the job post for you and gives you four major advantages:
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* AI Message Generator */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xl" aria-hidden="true">✍️</div>
              <h3 className="font-display text-lg text-ink">AI Message Generator</h3>
            </div>
            <p className="text-sm text-ink-soft">
              Skip the blank page anxiety. We analyze the job post and generate a custom, professional message you can send directly to the hiring manager.
            </p>
            <div className="mt-auto rounded-xl border border-line bg-paper p-4 shadow-sm relative">
              <div className="absolute -top-3 right-4 rounded bg-paper px-2 text-xs font-semibold text-brand border border-line">Example</div>
              <p className="text-sm italic text-ink-soft">"Hi team, I noticed your opening for a Frontend Developer. My experience with React aligns perfectly with your requirements..."</p>
              <div className="mt-3 flex gap-2">
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">Professional tone</span>
              </div>
            </div>
          </div>

          {/* AI Deep Scam Analysis */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stop/10 text-xl" aria-hidden="true">🔍</div>
              <h3 className="font-display text-lg text-ink">Deep Scam Analysis</h3>
            </div>
            <p className="text-sm text-ink-soft">
              Go beyond the basic checks. The AI reads between the lines to detect subtle manipulation, pyramid schemes, and hidden fees.
            </p>
            <div className="mt-auto rounded-xl border border-stop/30 bg-stop/5 p-4 relative">
              <div className="absolute -top-3 right-4 rounded bg-paper px-2 text-xs font-semibold text-stop-ink border border-stop/30">Example</div>
              <div className="flex items-start gap-2">
                <span className="text-stop-ink mt-0.5">⚠️</span>
                <p className="text-sm text-ink-soft"><strong>Red flag detected:</strong> The requirement to "pay for your own equipment upfront" is a very common task scam tactic.</p>
              </div>
            </div>
          </div>

          {/* Resume Tailoring */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-go/10 text-xl" aria-hidden="true">📄</div>
              <h3 className="font-display text-lg text-ink">Resume Tailoring</h3>
            </div>
            <p className="text-sm text-ink-soft">
              Beat the applicant tracking systems (ATS). We tell you exactly which skills and keywords from your background to emphasize for this specific role.
            </p>
            <div className="mt-auto rounded-xl border border-go/30 bg-go/5 p-4 relative">
              <div className="absolute -top-3 right-4 rounded bg-paper px-2 text-xs font-semibold text-go-ink border border-go/30">Example</div>
              <p className="text-sm text-ink-soft"><span className="font-semibold text-go-ink">✓ Add this keyword:</span> Ensure you mention <strong>Tailwind CSS</strong> in your recent projects, as it is listed as a core requirement.</p>
            </div>
          </div>

          {/* Interview Prep / Voice Mock Interview */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warn/10 text-xl" aria-hidden="true">🎙️</div>
              <h3 className="font-display text-lg text-ink">Live Voice Mock Interview</h3>
            </div>
            <p className="text-sm text-ink-soft">
              Practice answering questions live with an AI hiring manager. It listens to your voice and responds conversationally.
            </p>
            <div className="mt-auto rounded-xl border border-line bg-card p-4 relative shadow-sm max-h-60 overflow-y-auto space-y-3">
              <div className="absolute -top-3 right-4 rounded bg-paper px-2 text-xs font-semibold text-warn-ink border border-line shadow-sm">Sample Interview</div>
              <div className="flex flex-col items-start mt-2">
                <span className="mb-1 text-[10px] font-bold text-ink-faint uppercase tracking-wider">AI Hiring Manager</span>
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-paper border border-line text-ink">
                  Hello! I see you have a strong background in React. Can you tell me about a time you optimized a slow-loading web application?
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="mb-1 text-[10px] font-bold text-ink-faint uppercase tracking-wider">You (Voice)</span>
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-brand text-paper">
                  Yes, in my last project, we had a large dashboard that took 5 seconds to load. I implemented lazy loading for the charts and paginated the data, which brought the load time down to under a second.
                </div>
              </div>
              <div className="flex flex-col items-start">
                <span className="mb-1 text-[10px] font-bold text-ink-faint uppercase tracking-wider">AI Hiring Manager</span>
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-paper border border-line text-ink">
                  That's a great practical example. How did you handle the state management for that paginated data?
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="mb-1 text-[10px] font-bold text-ink-faint uppercase tracking-wider">You (Voice)</span>
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-brand/50 text-paper italic flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-paper animate-pulse"></span>
                  Listening...
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <p className="text-sm text-ink-soft">
        Looking for the free tool?{" "}
        <Link to="/" className="font-medium text-brand hover:text-brand-deep">Go back and scan a job</Link>.
      </p>
    </div>
    </PayPalScriptProvider>
  );
}