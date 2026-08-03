import { useEffect, useLayoutEffect, useState } from "react";
import { NavLink, Link, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import Toast from "./Toast.jsx";
import { dueFollowUps } from "../lib/followups.js";
import { useApp } from "../store.jsx";
import { useReducedMotion } from "../motion/useMotionConfig.js";
import { routeTransition } from "../motion/variants.js";

const NAV = [
  { to: "/", label: "Scan", end: true },
  { to: "/background-check", label: "Check Link" },
  { to: "/tracker", label: "Tracker" },
  { to: "/settings", label: "Settings" },
  { to: "/offers", label: "Offers" },
  { to: "/account", label: "Account" },
];

function ShieldMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden="true">
      <path
        d="M32 6 L54 14 V32 C54 46 44 55 32 59 C20 55 10 46 10 32 V14 Z"
        className="fill-brand"
      />
      <path
        d="M22 33 L29.5 40.5 L43 25"
        fill="none"
        stroke="#f4efe4"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RouteScrollReset() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

// Tracks whether the page has scrolled past a small threshold, so the header
// can condense into its "scrolled" state (Phase 3). Passive listener.
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

// Animates the routed page in/out. useOutlet snapshots the current page so the
// outgoing route can finish its exit while the incoming one enters.
function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={location.pathname}
        initial={reduced ? false : routeTransition.initial}
        animate={routeTransition.animate}
        exit={reduced ? { opacity: 0 } : routeTransition.exit}
      >
        {outlet}
      </m.div>
    </AnimatePresence>
  );
}

export default function Layout() {
  const { jobs } = useApp();
  const { overdue, today } = dueFollowUps(jobs);
  const followUpCount = overdue.length + today.length;
  const scrolled = useScrolled();
  const reduced = useReducedMotion();
  return (
    <div className="flex min-h-screen flex-col">
      <RouteScrollReset />
      <header
        className={`sticky top-0 z-40 border-b bg-paper/90 backdrop-blur-md transition-[padding,background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? "border-line/80 shadow-md shadow-ink/[0.06] supports-[backdrop-filter]:bg-paper/80"
            : "border-line/50 shadow-none"
        }`}
      >
        <div
          className={`mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 transition-[padding] duration-300 ${
            scrolled ? "py-2" : "py-3"
          }`}
        >
          <Link
            to="/"
            className="group flex min-h-11 items-center gap-2"
            aria-label="ApplyGuard PH home"
          >
            <span className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <ShieldMark />
            </span>
            <span className="font-display text-xl font-semibold leading-none text-ink">
              ApplyGuard
              <span className="ml-1 rounded-md bg-brand px-1.5 py-0.5 align-middle font-sans text-xs font-bold tracking-wide text-paper">
                PH
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-2">
            {NAV.map((item) => {
              const badge = item.label === "Tracker" && followUpCount > 0 ? followUpCount : 0;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="group relative inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-panel/60 sm:px-4"
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <m.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-full bg-ink"
                          transition={
                            reduced
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 380, damping: 32 }
                          }
                        />
                      )}
                      <span
                        className={`relative z-10 ${
                          isActive ? "text-paper" : "text-ink-soft group-hover:text-ink"
                        }`}
                      >
                        {item.label}
                      </span>
                      {badge > 0 && (
                        <span
                          className="relative z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warn px-1 text-[0.65rem] font-bold leading-none text-paper"
                          aria-label={`${badge} follow-up${badge > 1 ? "s" : ""} need attention`}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        {/* Motion-driven route transition: each page enters/exits with a short,
            context-neutral fade+lift. Reduced-motion collapses it to opacity. */}
        <AnimatedOutlet />
      </main>

      <footer className="border-t border-line bg-panel/60">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2">
                <ShieldMark />
                <span className="font-display text-lg font-semibold text-ink">
                  ApplyGuard
                  <span className="ml-1 rounded-md bg-brand px-1.5 py-0.5 align-middle font-sans text-[0.65rem] font-bold tracking-wide text-paper">PH</span>
                </span>
              </div>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                A free second opinion on remote job posts. Check for scam signals, pay fit, and
                missing details before you invest your time.
              </p>
              <p className="mt-3 text-xs text-ink-faint">
                Not affiliated with any job board or employer. Always verify a company yourself
                before handing over personal details or money.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div>
                <p className="mb-2 font-semibold text-ink">Tool</p>
                <ul className="space-y-1.5 text-ink-soft">
                  <li><Link to="/" className="transition-colors hover:text-brand">Scan a job</Link></li>
                  <li><Link to="/background-check" className="transition-colors hover:text-brand">Background check</Link></li>
                  <li><Link to="/tracker" className="transition-colors hover:text-brand">Job tracker</Link></li>
                  <li><Link to="/offers" className="transition-colors hover:text-brand">Offers</Link></li>
                  <li><Link to="/mock-interview" className="transition-colors hover:text-brand">Mock interview</Link></li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold text-ink">Account</p>
                <ul className="space-y-1.5 text-ink-soft">
                  <li><Link to="/account" className="transition-colors hover:text-brand">My account</Link></li>
                  <li><Link to="/settings" className="transition-colors hover:text-brand">Settings</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-xs text-ink-faint">
            <p>Built for Filipino remote job seekers. The scanner runs in your browser.</p>
            <p>© {new Date().getFullYear()} ApplyGuard PH</p>
          </div>
        </div>
      </footer>

      <Toast />
    </div>
  );
}
