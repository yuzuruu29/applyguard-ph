import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./store.jsx";
import { AuthProvider } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import ScanForm from "./components/ScanForm.jsx";
import ResultView from "./components/ResultView.jsx";
import Tracker from "./components/Tracker.jsx";
import Settings from "./components/Settings.jsx";
import Button from "./components/ui/Button.jsx";

// Heavy or rarely-first-visit routes load as their own chunks so the core
// scan → result path ships less JS. Offers alone pulls the PayPal SDK;
// Account and Mock Interview pull the Supabase-backed account surface.
const OffersPage = lazy(() => import("./components/OffersPage.jsx"));
const AccountPage = lazy(() => import("./components/AccountPage.jsx"));
const MockInterviewPage = lazy(() => import("./components/MockInterviewPage.jsx"));
const BackgroundCheckPage = lazy(() => import("./components/BackgroundCheckPage.jsx"));
const PrivacyPage = lazy(() =>
  import("./components/TrustSurfaces.jsx").then((mod) => ({ default: mod.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import("./components/TrustSurfaces.jsx").then((mod) => ({ default: mod.TermsPage }))
);
const RefundPage = lazy(() =>
  import("./components/TrustSurfaces.jsx").then((mod) => ({ default: mod.RefundPage }))
);
const DisclaimerPage = lazy(() =>
  import("./components/TrustSurfaces.jsx").then((mod) => ({ default: mod.DisclaimerPage }))
);

// Skeleton shown while a lazy route chunk loads — mirrors the standard page
// header shape so the swap doesn't jump the layout.
function RouteFallback() {
  return (
    <div className="space-y-7" aria-busy="true" aria-label="Loading page">
      <div className="space-y-3">
        <div className="shimmer h-8 w-56 rounded-xl bg-panel/80" />
        <div className="shimmer h-4 w-80 max-w-full rounded-full bg-panel/60" />
      </div>
      <div className="shimmer glass h-64 rounded-3xl" />
    </div>
  );
}

const lazily = (el) => <Suspense fallback={<RouteFallback />}>{el}</Suspense>;

function NotFound() {
  return (
    <div className="glass-strong gradient-border relative overflow-hidden rounded-3xl p-10 text-center sm:p-16">
      <p className="eyebrow">Error 404</p>
      <p className="mt-3 font-display text-3xl font-semibold text-gradient sm:text-4xl">
        That page wandered off
      </p>
      <p className="mt-3 text-ink-soft">The link doesn't match anything here.</p>
      <Button to="/" size="lg" className="mt-7">
        Back to the scanner
      </Button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<ScanForm />} />
            <Route path="/result/:id" element={<ResultView />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/offers" element={lazily(<OffersPage />)} />
            <Route path="/account" element={lazily(<AccountPage />)} />
            <Route path="/mock-interview" element={lazily(<MockInterviewPage />)} />
            <Route path="/background-check" element={lazily(<BackgroundCheckPage />)} />
            <Route path="/privacy" element={lazily(<PrivacyPage />)} />
            <Route path="/terms" element={lazily(<TermsPage />)} />
            <Route path="/refunds" element={lazily(<RefundPage />)} />
            <Route path="/disclaimer" element={lazily(<DisclaimerPage />)} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
}
