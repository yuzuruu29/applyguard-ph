import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="eyebrow">Trust & Transparency</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Privacy Policy</h1>
        <p className="mt-1 text-sm text-ink-faint">Last updated: July 23, 2026</p>
      </header>

      <div className="elev rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-4 text-ink-soft text-sm leading-relaxed">
        <h2 className="font-display text-xl text-ink">Client-First Privacy Design</h2>
        <p>
          ApplyGuard PH is designed privacy-first for Filipino remote job seekers. By default, job post scans and risk evaluations run locally in your browser. We do not store or transmit your raw job application text unless you explicitly invoke opt-in AI features.
        </p>

        <h2 className="font-display text-xl text-ink mt-4">Data Collection & Storage</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Free Scans:</strong> Processed entirely in your browser using local regex and static risk scoring. Nothing is sent to our servers.</li>
          <li><strong>Account & Cloud Sync:</strong> If you sign in via Magic Link, your email and saved application tracker jobs are synced to your private Supabase database rows.</li>
          <li><strong>Pro AI Features:</strong> When using AI features, job post snippets are sent via encrypted HTTPS to our Anthropic proxy solely for real-time inference and are never stored server-side.</li>
        </ul>

        <h2 className="font-display text-xl text-ink mt-4">Data Deletion</h2>
        <p>
          You can request complete deletion of your account and cloud data at any time by contacting <strong>support@applyguard.ph</strong>. You can also clear local browser storage instantly from the Settings page.
        </p>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="eyebrow">Legal Terms</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Terms of Service</h1>
        <p className="mt-1 text-sm text-ink-faint">Last updated: July 23, 2026</p>
      </header>

      <div className="elev rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-4 text-ink-soft text-sm leading-relaxed">
        <h2 className="font-display text-xl text-ink">Service Usage & Disclaimer</h2>
        <p>
          ApplyGuard PH provides job verification tools, scam signal detectors, and AI application assistance. ApplyGuard PH does not guarantee that a job offer or company is 100% legitimate and should not be treated as official legal advice.
        </p>

        <h2 className="font-display text-xl text-ink mt-4">Acceptable Use</h2>
        <p>
          Users agree not to attempt to reverse-engineer API proxies, bypass server-enforced quotas, or use automated bots to abuse AI features.
        </p>
      </div>
    </div>
  );
}

export function RefundPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="eyebrow">Customer Protection</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Refund Policy</h1>
        <p className="mt-1 text-sm text-ink-faint">Last updated: July 23, 2026</p>
      </header>

      <div className="elev rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-4 text-ink-soft text-sm leading-relaxed">
        <h2 className="font-display text-xl text-ink">100% Money-Back Guarantee</h2>
        <p>
          We want you to be completely satisfied. If you purchase 30-Day Pro (₱299), Annual Pro (₱2,990), or the Message Pack (₱149) and encounter technical issues or find that the product does not meet your expectations, you may request a full refund within 7 days of purchase.
        </p>

        <h2 className="font-display text-xl text-ink mt-4">How to Request a Refund</h2>
        <p>
          Email <strong>support@applyguard.ph</strong> with your PayPal transaction reference ID and email address. Refunds are processed through PayPal within 2 business days.
        </p>
      </div>
    </div>
  );
}

export function DisclaimerPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="eyebrow">AI & Risk Notice</p>
        <h1 className="mt-2 font-display text-3xl text-ink">AI Limitations & Scam Disclaimer</h1>
        <p className="mt-1 text-sm text-ink-faint">Last updated: July 23, 2026</p>
      </header>

      <div className="elev rounded-3xl border border-line bg-card p-6 sm:p-8 space-y-4 text-ink-soft text-sm leading-relaxed">
        <h2 className="font-display text-xl text-ink">Risk Signals, Not Proof</h2>
        <p>
          ApplyGuard PH provides automated risk signals based on red-flag keywords, structural patterns, and AI analysis powered by Anthropic Haiku 4.5.
        </p>
        <div className="rounded-2xl bg-warn-soft border border-warn/30 p-4 text-warn-ink font-medium">
          ⚠️ Important Notice: ApplyGuard PH cannot definitively prove that a company or listing is 100% legitimate or guaranteed scam-free. Always conduct independent verification before sending sensitive personal data or government documents.
        </div>
      </div>
    </div>
  );
}
