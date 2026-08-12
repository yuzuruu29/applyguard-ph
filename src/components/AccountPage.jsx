import { useState, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useApp } from "../store.jsx";
import { downloadMessagePack } from "../lib/billing.js";
import { trialState } from "../lib/entitlement.js";
import Button from "./ui/Button.jsx";

export default function AccountPage() {
  const { user, loading, backendEnabled, signInWithEmail, signOut, entitlement, tier, usageCount, aiCap, refreshEntitlement } = useAuth();
  const { jobs, notify } = useApp();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [downloadingPack, setDownloadingPack] = useState(false);
  const inputRef = useRef(null);

  const tState = trialState(entitlement);

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

  const handleDownloadPack = async () => {
    setDownloadingPack(true);
    try {
      await downloadMessagePack();
      notify("Message Pack download started.", "success");
    } catch (err) {
      notify(err?.message || "Couldn't download the Message Pack. Try again.", "error");
    } finally {
      setDownloadingPack(false);
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
            Sign in to sync your tracker across devices and unlock Pro AI features.
          </p>
        </div>

        <section className="glass rounded-3xl p-6 sm:p-8">
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
              <Button type="submit" size="lg" loading={sending}>
                {sending ? "Sending link…" : "Send magic link"}
              </Button>
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

      {/* Pro access & Trial status */}
      <section className="glass space-y-4 rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Subscription & Pro Access</h2>
        
        {tier === "premium" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-go-soft px-3 py-1 text-xs font-semibold text-go-ink">Pro Active</span>
              {entitlement?.trial_status === "converted" && (
                <span className="text-xs text-ink-faint">(Converted from Trial)</span>
              )}
            </div>
            <p className="text-sm text-ink-soft">
              Paid through <span className="font-mono text-ink font-semibold">{entitlement?.current_period_end || "—"}</span>.
            </p>
            <p className="text-sm text-ink-soft">
              AI calls this month: <span className="font-mono text-ink font-semibold">{usageCount} / {aiCap}</span>
            </p>
          </div>
        ) : tState.isTrialActive ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">Pro Preview Active</span>
                <p className="mt-2 text-sm font-medium text-ink">
                  Expires {tState.expiresAt ? tState.expiresAt.toLocaleDateString() : "in 7 days"} ({tState.daysRemaining} day{tState.daysRemaining !== 1 ? "s" : ""} remaining)
                </p>
              </div>
              <Button to="/offers">Upgrade to Pro (₱299)</Button>
            </div>

            <div className="glass-subtle rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Remaining Trial Allowances</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-ink-soft">Deep Scans</span>
                  <span className="font-mono font-medium text-ink">3 max</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-ink-soft">Resume Tailoring</span>
                  <span className="font-mono font-medium text-ink">2 max</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-ink-soft">Outreach Messages</span>
                  <span className="font-mono font-medium text-ink">5 max</span>
                </div>
                <div className="flex justify-between border-b border-line pb-1.5">
                  <span className="text-ink-soft">Mock Interviews</span>
                  <span className="font-mono font-medium text-ink">1 max</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-ink-faint">
              No automatic charge when trial ends. Card details are never requested during trial.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              {tState.isExpired
                ? "Your 7-day Pro Preview has expired. Upgrade to 30-Day Pro to keep using AI features."
                : "You are currently on the free tier. Try Pro free for 7 days or upgrade."}
            </p>
            <Button to="/offers" size="lg">
              {tState.isExpired ? "Upgrade to Pro (₱299)" : "View Pro Plans"}
            </Button>
          </div>
        )}
      </section>

      {/* Purchased items / Message Pack */}
      {entitlement?.has_message_pack && (
        <section className="glass space-y-4 rounded-3xl p-6 sm:p-8">
          <h2 className="font-display text-xl text-ink">Purchased Items</h2>
          <div className="glass-subtle rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-ink">Message Pack</p>
              <p className="text-sm text-ink-soft">20 application & follow-up templates</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPack}
              loading={downloadingPack}
              className="border-brand/40"
            >
              {downloadingPack ? "Preparing…" : "Download PDF"}
            </Button>
          </div>
        </section>
      )}

      {/* Cloud sync */}
      <section className="glass space-y-4 rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink">Cloud sync</h2>
        <p className="text-sm text-ink-soft">
          Your tracker has {jobs.length} job{jobs.length !== 1 ? "s" : ""}. Settings and jobs sync
          automatically across your signed-in devices.
        </p>
      </section>

      {/* Sign out */}
      <section className="glass rounded-3xl p-6 sm:p-8">
        <Button
          variant="danger"
          onClick={handleSignOut}
          className="border border-stop/40 bg-stop-soft hover:border-stop"
        >
          Sign out
        </Button>
      </section>

      {/* Privacy & Legal links */}
      <div className="flex flex-wrap gap-4 text-xs text-ink-faint pt-2">
        <Link to="/privacy" className="hover:text-brand underline">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-brand underline">Terms of Service</Link>
        <Link to="/refunds" className="hover:text-brand underline">Refund Policy</Link>
        <Link to="/disclaimer" className="hover:text-brand underline">AI Disclaimer</Link>
      </div>
    </div>
  );
}
