// ui/Button.jsx — the one button vocabulary for ApplyGuard PH.
//
// Every pill-shaped action in the app previously repeated the same Tailwind
// string with small drifts (padding, hover lift, disabled treatment). This
// component locks the shape system (interactive = full pill), the motion
// (lift on hover, press on active — CSS only, so it stays interruptible),
// and the states (loading, disabled) in one place.
//
// Variants:
//   primary  — solid brand CTA (one per view, ideally)
//   outline  — brand-outlined secondary that fills on hover
//   soft     — quiet panel chip that inks on hover (copy buttons, meta actions)
//   ink      — solid ink pill for high-contrast utility actions (Copy prompt)
//   success  — transient confirmed state (Copied); static on purpose
//   ghost    — bare text action
//   danger   — destructive text action (fills stop-soft on hover)
//
// Swap variants for state changes (e.g. soft -> success when copied) instead
// of overriding bg-* through className: Tailwind resolves same-property
// utilities by stylesheet order, not class order, so overrides are fragile.
//
// Renders a <Link> when `to` is given, an <a> when `href` is given, otherwise
// a <button>. Keyboard focus styling comes from the global :focus-visible ring.
import { Link } from "react-router-dom";
import { SpinnerIcon } from "./icons.jsx";

const cx = (...parts) => parts.filter(Boolean).join(" ");

const BASE =
  "inline-flex select-none items-center justify-center rounded-full font-semibold transition-all duration-200";

// `primary` and `ink` carry the gloss sweep; the quieter variants stay matte so
// a screen full of secondary actions doesn't shimmer at the user.
const VARIANTS = {
  primary:
    "btn-gradient gloss text-paper hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
  outline:
    "glass-subtle text-ink hover:-translate-y-0.5 hover:border-brand hover:text-brand-lift active:translate-y-0 active:scale-[0.98]",
  soft:
    "glass-subtle text-ink-soft hover:-translate-y-0.5 hover:text-ink active:translate-y-0 active:scale-[0.99]",
  ink:
    "gloss border border-ink/15 bg-ink text-paper hover:-translate-y-0.5 hover:bg-ink-soft active:translate-y-0 active:scale-[0.99]",
  success: "border border-go/40 bg-go-soft text-go-ink",
  ghost: "text-ink-soft hover:bg-panel/70 hover:text-ink",
  danger: "text-stop-ink hover:bg-stop-soft",
};

const SIZES = {
  sm: "min-h-9 gap-1.5 px-4 py-1.5 text-xs",
  md: "min-h-11 gap-2 px-5 py-2.5 text-sm",
  lg: "min-h-12 gap-2 px-6 py-3 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  to,
  href,
  type = "button",
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  const classes = cx(
    BASE,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    (disabled || loading) && "pointer-events-none opacity-55",
    className
  );

  const content = (
    <>
      {loading && <SpinnerIcon className="h-4 w-4 shrink-0 animate-spin" />}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled || undefined} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} aria-disabled={disabled || undefined} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
}
