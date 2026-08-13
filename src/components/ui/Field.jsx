// ui/Field.jsx — shared form-field vocabulary (label + focus frame).
//
// Extracted from ScanForm so the scan intake and the background-check form
// stop maintaining parallel copies of the same markup. The frame (not the
// control) carries hover/focus treatment via the .field-frame CSS in
// index.css, including the growing underline accent.

export const fieldInputCls =
  "field-input w-full rounded-xl bg-transparent px-3.5 py-2.5 text-ink placeholder:text-ink-faint focus:outline-none";

export function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {hint && <span className="ml-1.5 font-normal text-ink-faint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// Lift/glow frame with a growing underline accent on focus. Wraps a single
// input or select (plus optional leading adornments like an icon).
export function FieldFrame({ children, className = "" }) {
  return (
    <div className={`field-frame glass-subtle flex rounded-xl ${className}`}>
      <span className="field-accent" aria-hidden="true" />
      {children}
    </div>
  );
}
