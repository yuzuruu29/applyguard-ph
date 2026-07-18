import { useLayoutEffect } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import Toast from "./Toast.jsx";
import { dueFollowUps } from "../lib/followups.js";
import { useApp } from "../store.jsx";

const NAV = [
  { to: "/", label: "Scan", end: true },
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

export default function Layout() {
  const location = useLocation();
  const { jobs } = useApp();
  const { overdue, today } = dueFollowUps(jobs);
  const followUpCount = overdue.length + today.length;
  return (
    <div className="flex min-h-screen flex-col">
      <RouteScrollReset />
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="flex min-h-11 items-center gap-2"
            aria-label="ApplyGuard PH home"
          >
            <ShieldMark />
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
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                      isActive
                        ? "bg-ink text-paper"
                        : "text-ink-soft hover:bg-panel hover:text-ink"
                    }`
                  }
                >
                  {item.label}
                  {badge > 0 && (
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warn px-1 text-[0.65rem] font-bold leading-none text-paper"
                      aria-label={`${badge} follow-up${badge > 1 ? "s" : ""} need attention`}
                    >
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        {/* re-keyed per route so each page fades in; pure opacity so it never
            fights the per-section rise transforms inside a page */}
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-line bg-panel/60">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-ink-soft">
          <p className="font-display text-lg text-ink">Free. No sign-up. No subscription.</p>
          <p className="mt-2 max-w-xl">
            ApplyGuard PH isn't affiliated with any job board or employer. It gives you a
            second opinion. Always verify a company yourself before you hand over personal
            details or money.
          </p>
          <p className="mt-4 text-xs text-ink-faint">
            Built for Filipino remote job seekers. The scanner runs in your browser — with an optional
            account, your saved jobs sync across devices (still your data, in your private rows).
          </p>
        </div>
      </footer>

      <Toast />
    </div>
  );
}
