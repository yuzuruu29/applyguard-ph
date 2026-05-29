import { Link } from "react-router-dom";

// External one-time-purchase links. No in-app payments, no subscriptions.
// TODO(owner): point these at your real store pages (Gumroad / Lemon Squeezy / etc.).
const STORE = "https://applyguardph.gumroad.com/l";

const OFFERS = [
  {
    id: "message-pack",
    name: "Message Pack",
    price: "₱199",
    blurb: "A one-time set of templates you edit and send.",
    points: [
      "20 message templates: cold applications, follow-ups, rate talk",
      "Polite scripts for asking a sketchy poster the right questions",
      "Works with the prompts this scanner gives you",
    ],
    cta: "Get the Message Pack",
    href: `${STORE}/message-pack`,
    featured: false,
  },
  {
    id: "review",
    name: "Application Review",
    price: "₱499",
    blurb: "A human reads your application before you send it.",
    points: [
      "Send your message and resume, get line-by-line notes back",
      "A rewrite you can copy, plus what a hiring manager will think",
      "Turnaround within 48 hours",
    ],
    cta: "Book a review",
    href: `${STORE}/application-review`,
    featured: true,
  },
  {
    id: "setup",
    name: "Profile Setup",
    price: "₱899",
    blurb: "We set up the profile that recruiters actually read.",
    points: [
      "OnlineJobs.ph or Upwork profile, headline, and overview",
      "Built around the roles you want and your real strengths",
      "One session, yours to keep",
    ],
    cta: "Set up my profile",
    href: `${STORE}/profile-setup`,
    featured: false,
  },
];

export default function OffersPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Optional extras</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">
          The scanner is free. These are for when you want a hand.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Buy one once if it helps. There's no subscription and nothing recurring. This is what
          keeps ApplyGuard free for everyone else.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {OFFERS.map((offer) => (
          <div
            key={offer.id}
            className={`flex flex-col rounded-3xl border bg-card p-6 ${
              offer.featured ? "border-brand shadow-sm shadow-brand/10" : "border-line"
            }`}
          >
            {offer.featured && (
              <span className="mb-3 w-fit rounded-full bg-brand px-3 py-1 text-xs font-semibold text-paper">
                Most popular
              </span>
            )}
            <h2 className="font-display text-2xl text-ink">{offer.name}</h2>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-semibold text-ink">{offer.price}</span>
              <span className="text-sm text-ink-faint">one time</span>
            </div>
            <p className="mt-3 text-ink-soft">{offer.blurb}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-ink">
              {offer.points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <a
              href={offer.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-6 rounded-full px-5 py-3 text-center font-semibold transition-colors ${
                offer.featured
                  ? "bg-brand text-paper hover:bg-brand-deep"
                  : "border border-ink/15 bg-paper text-ink hover:border-brand hover:text-brand"
              }`}
            >
              {offer.cta}
            </a>
            <p className="mt-2 text-center text-xs text-ink-faint">Opens an external checkout.</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-ink-soft">
        Looking for the free tool?{" "}
        <Link to="/" className="font-medium text-brand hover:text-brand-deep">
          Go back and scan a job
        </Link>
        .
      </p>
    </div>
  );
}
