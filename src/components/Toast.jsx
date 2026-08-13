// Toast.jsx — bottom-center stack of transient messages.
//
// Motion: each toast rises in and, on dismiss/expiry, shrinks out while the
// remaining stack glides to fill the gap (AnimatePresence popLayout). Under
// reduced motion MotionConfig collapses transforms so toasts simply fade.
// Polite live region so screen readers announce saves, copies, and exports
// without stealing focus.
import { AnimatePresence, m } from "motion/react";
import { useApp } from "../store.jsx";
import { duration, easing } from "../motion/tokens.js";
import { CheckIcon, AlertTriangleIcon, InfoCircleIcon } from "./ui/icons.jsx";

// Tinted glass rather than solid fills: the toast reads as part of the same
// material as the cards behind it, and the coloured ink keeps the tone legible
// without shouting over the page.
const TONE = {
  info: { cls: "border-line bg-panel/85 text-ink", Icon: InfoCircleIcon },
  success: { cls: "border-go/45 bg-go-soft/90 text-go-ink", Icon: CheckIcon },
  error: { cls: "border-stop/45 bg-stop-soft/90 text-stop-ink", Icon: AlertTriangleIcon },
  warn: { cls: "border-warn/45 bg-warn-soft/90 text-warn-ink", Icon: AlertTriangleIcon },
};

export default function Toast() {
  const { toasts, dismissToast } = useApp();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map((t) => {
          const tone = TONE[t.tone] || TONE.info;
          return (
            <m.button
              key={t.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: duration.normal, ease: easing.enter }}
              onClick={() => dismissToast(t.id)}
              title="Dismiss"
              className={`glass-strong pointer-events-auto flex max-w-sm items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium ${tone.cls}`}
            >
              <tone.Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              {t.message}
            </m.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
