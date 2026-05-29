import { Routes, Route, Link } from "react-router-dom";
import { AppProvider } from "./store.jsx";
import Layout from "./components/Layout.jsx";
import ScanForm from "./components/ScanForm.jsx";
import ResultView from "./components/ResultView.jsx";
import Tracker from "./components/Tracker.jsx";
import Settings from "./components/Settings.jsx";
import OffersPage from "./components/OffersPage.jsx";

function NotFound() {
  return (
    <div className="rounded-3xl border border-line bg-card p-10 text-center">
      <p className="font-display text-2xl text-ink">That page wandered off</p>
      <p className="mt-2 text-ink-soft">The link doesn't match anything here.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-paper hover:bg-brand-deep"
      >
        Back to the scanner
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<ScanForm />} />
          <Route path="/result/:id" element={<ResultView />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
