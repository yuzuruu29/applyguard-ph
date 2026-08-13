import { useEffect, useLayoutEffect, useState } from "react";
import { NavLink, Link, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import Toast from "./Toast.jsx";
import Aurora from "./ui/Aurora.jsx";
import ThemeToggle from "./ui/ThemeToggle.jsx";
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

const FOOTER_LINKS = [
  {
    heading: "Tool",
    links: [
      { to: "/", label: "Scan a job" },
      { to: "/background-check", label: "Background check" },
      { to: "/tracker", label: "Job tracker" },
      { to: "/offers", label: "Offers" },
      { to: "/mock-interview", label: "Mock interview" },
    ],
  },
  {
    heading: "Account",
    links: [
      { to: "/account", label: "My account" },
      { to: "/settings", label: "Settings" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      { to: "/refunds", label: "Refunds" },
      { to: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

// Marketing surfaces carry the full aurora; working surfaces keep it quiet so
// scores and evidence stay the brightest thing on screen.
function auroraIntensity(pathname) {
  if (pathname === "/" || pathname === "/offers") return "full";
  if (pathname.startsWith("/result")) return "calm";
  return "quiet";
}

function ShieldMark({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ag-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-lift)" />
          <stop offset="100%" stopColor="var(--color-brand-deep)" />
        </linearGradient>
      </defs>
      <path
        d="M32 6 L54 14 V32 C54 46 44 55 32 59 C20 55 10 46 10 32 V14 Z"
        fill="url(#ag-shield)"
      />
      <path
        d="M22 33 L29.5 40.5 L43 25"
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Wordmark({ size = "text-xl", badge = "text-xs" }) {
  return (
    <span className={`font-display ${size} font-semibold leading-none text-ink`}>
      ApplyGuard
      <span
        className={`btn-gradient ml-1 rounded-md px-1.5 py-0.5 align-middle font-sans ${badge} font-bold tracking-wide text-paper`}
      >
        PH
      </span>
    </span>
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
  const { pathname } = useLocation();
  const { overdue, today } = dueFollowUps(jobs);
  const followUpCount = overdue.length + today.length;
  const scrolled = useScrolled();
  const reduced = useReducedMotion();

  return (
    <>
      <Aurora intensity={auroraIntensity(pathname)} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <RouteScrollReset />
        {/* First tab stop: invisible above the viewport until keyboard focus
            slides it in. Avoids sr-only + fixed position-utility conflicts. */}
        <a
          href="#main"
          className="btn-gradient fixed left-4 top-4 z-50 -translate-y-24 rounded-full px-4 py-2 text-sm font-semibold text-paper opacity-0 transition-all duration-200 focus:translate-y-0 focus:opacity-100"
        >
          Skip to content
        </a>

        <header
          className={`sticky top-0 z-40 border-b transition-[padding,background-color,box-shadow,border-color] duration-300 ${
            scrolled
              ? "border-line/70 bg-paper/70 shadow-lg shadow-black/20 backdrop-blur-xl"
              : "border-transparent bg-paper/30 backdrop-blur-md"
          }`}
        >
          <div
            className={`mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 transition-[padding] duration-300 ${
              scrolled ? "py-2" : "py-3"
            }`}
          >
            <Link
              to="/"
              className="group flex min-h-11 shrink-0 items-center gap-2"
              aria-label="ApplyGuard PH home"
            >
              <span className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                <ShieldMark />
              </span>
              <span className="hidden sm:inline">
                <Wordmark />
              </span>
            </Link>

            <div className="flex min-w-0 items-center gap-2">
              {/* One row always: on narrow screens the nav scrolls sideways
                  instead of wrapping into a cramped second line of tiny hit
                  targets. */}
              <nav
                aria-label="Primary"
                className="scrollbar-none glass-subtle flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-full p-1 sm:overflow-visible"
              >
                {NAV.map((item) => {
                  const badge =
                    item.label === "Tracker" && followUpCount > 0 ? followUpCount : 0;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className="group relative inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4"
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <m.span
                              layoutId="nav-active"
                              className="btn-gradient absolute inset-0 rounded-full"
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
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 outline-none sm:py-12"
        >
          {/* Motion-driven route transition: each page enters/exits with a short,
              context-neutral fade+lift. Reduced-motion collapses it to opacity. */}
          <AnimatedOutlet />
        </main>

        <footer className="relative mt-16 overflow-hidden border-t border-line/60">
          {/* oversized wordmark bleeding off the bottom edge */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-6 select-none text-center font-display text-[22vw] font-bold leading-none tracking-tighter text-ink/[0.035] sm:-bottom-10 sm:text-[16rem]"
          >
            ApplyGuard
          </span>

          <div className="relative mx-auto max-w-6xl px-4 py-14">
            <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldMark className="h-8 w-8" />
                  <Wordmark size="text-lg" badge="text-[0.65rem]" />
                </div>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
                  A free second opinion on remote job posts. Check for scam signals, pay fit, and
                  missing details before you invest your time.
                </p>
                <p className="mt-3 max-w-md text-xs leading-relaxed text-ink-faint">
                  Not affiliated with any job board or employer. Always verify a company yourself
                  before handing over personal details or money.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
                {FOOTER_LINKS.map((group) => (
                  <div key={group.heading}>
                    <p className="eyebrow mb-3">{group.heading}</p>
                    <ul className="space-y-2 text-ink-soft">
                      {group.links.map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            className="transition-colors duration-200 hover:text-brand-lift"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <hr className="hairline mt-12" />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-faint">
              <p>Built for Filipino remote job seekers. The scanner runs in your browser.</p>
              <p>© {new Date().getFullYear()} ApplyGuard PH</p>
            </div>
          </div>
        </footer>

        <Toast />
      </div>
    </>
  );
}
