import { NavLink, Link, Outlet } from "react-router-dom";
import Toast from "./Toast.jsx";

const NAV = [
  { to: "/", label: "Scan", end: true },
  { to: "/tracker", label: "Tracker" },
  { to: "/settings", label: "Settings" },
  { to: "/offers", label: "Offers" },
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

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" aria-label="ApplyGuard PH home">
            <ShieldMark />
            <span className="font-display text-xl font-semibold leading-none text-ink">
              ApplyGuard
              <span className="ml-1 rounded-md bg-brand px-1.5 py-0.5 align-middle font-sans text-xs font-bold tracking-wide text-paper">
                PH
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 ${
                    isActive
                      ? "bg-ink text-paper"
                      : "text-ink-soft hover:bg-panel hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
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
            Built for Filipino remote job seekers. Your scans and saved jobs stay in this
            browser only.
          </p>
        </div>
      </footer>

      <Toast />
    </div>
  );
}
