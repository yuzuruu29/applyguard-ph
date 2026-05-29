// tone.js — maps verdicts and risk levels to UI styling + labels.
// Full class strings are written out literally so Tailwind keeps them.

export const VERDICT_TONE = {
  Apply: {
    label: "Apply",
    sub: "Worth your time. Send a sharp application.",
    stampText: "text-go-ink",
    stampBorder: "border-go-ink",
    chip: "bg-go-soft text-go-ink",
    ring: "text-go",
    dot: "bg-go",
  },
  Caution: {
    label: "Caution",
    sub: "Could be real, but check it before you commit.",
    stampText: "text-warn-ink",
    stampBorder: "border-warn-ink",
    chip: "bg-warn-soft text-warn-ink",
    ring: "text-warn",
    dot: "bg-warn",
  },
  Skip: {
    label: "Skip",
    sub: "The risk isn't worth it. Move on.",
    stampText: "text-stop-ink",
    stampBorder: "border-stop-ink",
    chip: "bg-stop-soft text-stop-ink",
    ring: "text-stop",
    dot: "bg-stop",
  },
};

export const RISK_TONE = {
  Low: {
    label: "Low risk",
    chip: "bg-go-soft text-go-ink",
    bar: "bg-go",
    width: "33%",
  },
  Medium: {
    label: "Medium risk",
    chip: "bg-warn-soft text-warn-ink",
    bar: "bg-warn",
    width: "66%",
  },
  High: {
    label: "High risk",
    chip: "bg-stop-soft text-stop-ink",
    bar: "bg-stop",
    width: "100%",
  },
};

export const STATUS_TONE = {
  Saved: "bg-panel text-ink-soft",
  Applied: "bg-go-soft text-go-ink",
  Interview: "bg-warn-soft text-warn-ink",
  Offer: "bg-go-soft text-go-ink",
  Closed: "bg-stop-soft text-stop-ink",
};
