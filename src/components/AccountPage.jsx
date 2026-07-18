import { useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";

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

      {/* Subscription status */}
      <section className="elev space-y-4 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Subscription</h2>
        {tier === "premium" ? (
          <>
            <p className="text-sm text-ink-soft">
              Plan: <span className="font-semibold text-ink">Premium</span>.
              Status: <span className="font-semibold text-ink">{entitlement?.status || "active"}</span>.
              Paid through <span className="font-mono text-ink">{entitlement?.current_period_end || "—"}</span>.
            </p>
            <p className="text-sm text-ink-soft">
              AI uses this month: <span className="font-mono text-ink">{usageCount} / {aiCap}</span>
            </p>
            <div className="pt-4 mt-4 border-t border-line">
              <h3 className="font-display text-lg text-ink mb-2">Voice Mock Interview</h3>
              <p className="text-sm text-ink-soft mb-3">Practice live voice interviews with our AI hiring manager.</p>
              <Link
                to="/mock-interview"
                className="inline-block rounded-full bg-brand px-6 py-2.5 font-semibold text-paper transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep"
              >
                Start Interview
              </Link>
            </div>
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

      {/* Purchased items */}
      {entitlement?.has_message_pack && (
        <section className="elev space-y-4 rounded-3xl border border-line bg-card p-6 sm:p-8">
          <h2 className="font-display text-xl text-ink">Purchased Items</h2>
          <div className="rounded-2xl border border-line bg-paper p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">Message Pack</p>
              <p className="text-sm text-ink-soft">20 message templates</p>
            </div>
            <a
              href="/MessagePack.pdf"
              target="_blank"
              download
              className="rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/20"
            >
              Download PDF
            </a>
          </div>
        </section>
      )}

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