import { useApp } from "../store.jsx";

const TONE = {
  info: "bg-ink text-paper",
  success: "bg-go text-paper",
  error: "bg-stop text-paper",
};

// Bottom-center stack of transient messages. Polite live region so screen
// readers announce saves, copies, and exports without stealing focus.
export default function Toast() {
  const { toasts, dismissToast } = useApp();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`rise pointer-events-auto flex max-w-sm items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg shadow-ink/15 ${
            TONE[t.tone] || TONE.info
          }`}
        >
          <span aria-hidden="true">
            {t.tone === "success" ? "✓" : t.tone === "error" ? "!" : "•"}
          </span>
          {t.message}
        </button>
      ))}
    </div>
  );
}
