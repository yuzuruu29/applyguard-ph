// TrustMarquee.jsx — a slow horizontal ribbon of what the free tool guarantees.
//
// The track holds the same list twice and animates to -50%, so the loop is
// seamless with no JS measuring. The duplicate is aria-hidden: screen readers
// read the claims once. Hovering pauses it (CSS), and reduced-motion freezes
// it into a static, mask-faded strip.
import { BoltIcon, ShieldCheckIcon, SparklesIcon } from "./ui/icons.jsx";

const CLAIMS = [
  { label: "Runs entirely in your browser", Glyph: ShieldCheckIcon },
  { label: "No sign-up, no paywall", Glyph: SparklesIcon },
  { label: "Scam-signal detection", Glyph: BoltIcon },
  { label: "Pay-fit scoring", Glyph: SparklesIcon },
  { label: "Missing-detail checks", Glyph: ShieldCheckIcon },
  { label: "Questions to ask before you apply", Glyph: BoltIcon },
  { label: "Nothing is uploaded", Glyph: ShieldCheckIcon },
];

function Run({ hidden = false }) {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {CLAIMS.map(({ label, Glyph }) => (
        <li key={label} className="flex items-center gap-2.5 whitespace-nowrap px-6 py-3">
          <Glyph className="h-4 w-4 shrink-0 text-brand-lift" />
          <span className="text-sm font-medium text-ink-soft">{label}</span>
          <span className="ml-6 h-1 w-1 rounded-full bg-line" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

export default function TrustMarquee() {
  return (
    <div className="glass-subtle marquee-mask scroll-reveal overflow-hidden rounded-full">
      <div className="marquee-track">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
