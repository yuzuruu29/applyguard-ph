import { useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { cancelSubscription } from "../lib/billing.js";

export default function AccountPage() {
  const { user, loading, backendEnabled, signInWithEmail, signOut, entitlement, tier, usageCount, aiCap, refreshEntitlement } = useAuth();
  const { jobs, notify } = useApp();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter your email address.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    setSending(true);
    try {
      await signInWithEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.message || "Couldn't send the link. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Silently fail — the user is still signed out locally.
    }
  };

  const [cancelling, setCancelling] = useState(false);
  const handleCancel = async () => {
    if (!window.confirm("Cancel auto-renew? You keep Premium until the paid period ends.")) return;
    setCancelling(true);
    try {
      await cancelSubscription();
      notify("Auto-renew cancelled. Premium stays until your paid-through date.", "success");
      setTimeout(refreshEntitlement, 3000);
    } catch (err) {
      notify(err?.message || "Couldn't cancel. Try again.", "error");
    } finally {
      setCancelling(false);
    }
  };

  // Show a success banner when returning from PayMongo checkout
  const paid = new URLSearchParams(location.search).get("paid");
  if (paid === "1" && tier === "free") {
    setTimeout(refreshEntitlement, 3000);
  }

  // ── Loading state ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-7">
        <div>
          <h1 className="font-display text-3xl text-ink">Account</h1>
          <p className="mt-1 text-ink-soft">Checking your session…</p>
        </div>
      </div>
    );
  }

  // ── Backend not configured ─────────────────────────────────────────
  if (!backendEnabled) {
    return (
      <div className="space-y-7">
        <div>
          <h1 className="font-display text-3xl text-ink">Account</h1>
          <p className="mt-1 text-ink-soft">
            Cloud sync and Premium aren't set up yet. The scanner works fully offline.
          </p>
        </div>
      </div>
    );
  }

  // ── Not signed in ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="space-y-7">
        <div>
          <h1 className="font-display text-3xl text-ink">Account</h1>
          <p className="mt-1 text-ink-soft">
            Sign in to sync your tracker across devices and unlock Premium AI features.
          </p>
        </div>

        <section className="elev rounded-3xl border border-line bg-card p-6 sm:p-8">
          <h2 className="font-display text-xl text-ink">Sign in or create an account</h2>
          <p className="mt-1 text-sm text-ink-soft">
            We'll email you a one-tap link. No password needed.
          </p>

          {sent ? (
            <div className="mt-4 rounded-2xl bg-brand/10 border border-brand/30 p-4">
              <p className="font-semibold text-brand-deep">Check your inbox</p>
              <p className="mt-1 text-sm text-ink-soft">
                We sent a magic link to <strong>{email}</strong>. Tap the button in that email
                to sign in. If you don't see it, check your spam folder.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendLink} className="mt-4 space-y-3">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                  Email address
                </label>
                <input
                  ref={inputRef}
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-stop-ink">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep disabled:opacity-60"
              >
                {sending ? "Sending link…" : "Send magic link"}
              </button>
            </form>
          )}

          <p className="mt-4 text-xs text-ink-faint">
            Nothing is stored until you sign in. Your scans still run in your browser only.
          </p>
        </section>
      </div>
    );
  }


  // ── Signed in ───────────────────────────────────────────────────────
  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl text-ink">Account</h1>
        <p className="mt-1 text-ink-soft">
          Signed in as <span className="font-medium text-ink">{user.email}</span>
        </p>
      </div>

      {/* Payment success banner */}
      {paid === "1" && (
        <div className="rounded-2xl border border-go/40 bg-go-soft p-4">
          <p className="font-semibold text-go-ink">Payment received</p>
          <p className="mt-1 text-sm text-ink-soft">
            Premium activates when PayMongo confirms, usually within seconds.
          </p>
        </div>
      )}

      {/* Subscription status */}
      <section className="elev space-y-4 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Subscription</h2>
        {tier === "premium" ? (
          <>
            <p className="text-sm text-ink-soft">
              Plan: <span className="font-semibold text-ink">Premium</span>.
              Status: <span className="font-semibold text-ink">{entitlement?.status || "active"}</span>.
              Paid through <span className="font-mono text-ink">{entitlement?.current_period_end || "—"}</span>.
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
            <p className="text-sm text-ink-soft">You're on the free tier. Premium adds four AI features.</p>
            <Link
              to="/offers"
              className="inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep"
            >
              See Premium
            </Link>
          </>
        )}
      </section>

      {/* Sync status */}
      <section className="elev space-y-4 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Cloud sync</h2>
        <p className="text-sm text-ink-soft">
          Your tracker has {jobs.length} job{jobs.length !== 1 ? "s" : ""}. Settings and jobs sync
          automatically across your signed-in devices. The scanner itself still runs in your browser.
        </p>
      </section>

      {/* Sign out */}
      <section className="elev rounded-3xl border border-line bg-card p-6 sm:p-8">
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-stop/40 bg-stop-soft px-5 py-2.5 text-sm font-semibold text-stop-ink transition-colors hover:border-stop"
        >
          Sign out
        </button>
        <p className="mt-2 text-xs text-ink-faint">
          Signing out keeps your data in this browser. Cloud sync pauses until you sign in again.
        </p>
      </section>

      {/* Privacy note */}
      <p className="text-xs text-ink-faint">
        Your settings and saved jobs are stored in private cloud rows that only you can access. The
        scanner itself runs in your browser. Premium AI features send the job post text to our AI
        provider for processing; it's processed in memory and never stored.
      </p>
    </div>
  );
}