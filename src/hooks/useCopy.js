// useCopy.js — clipboard copy with a transient "copied" flag.
//
// Wraps lib/clipboard's copyToClipboard (which already handles the
// execCommand fallback) and manages the 1.9s confirmation window that every
// copy button in the app previously re-implemented by hand. The timer is
// cleared on unmount so a copy right before navigation never sets state on a
// dead component. Errors propagate to the caller for its own messaging.
import { useCallback, useEffect, useRef, useState } from "react";
import { copyToClipboard } from "../lib/clipboard.js";

export function useCopy(resetMs = 1900) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const copy = useCallback(
    async (text) => {
      await copyToClipboard(text);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs]
  );

  return { copied, copy };
}
