---
kind: frontend_style
name: Tailwind v4 Utility-First Styling with Paper-Ink Design Tokens
category: frontend_style
scope:
    - '**'
source_files:
    - src/index.css
    - vite.config.js
    - package.json
    - src/components/ScanForm.jsx
---

ApplyGuard PH uses a Tailwind CSS v4 utility-first styling system layered over a small set of hand-crafted CSS classes that define the app's visual identity. The approach is intentionally minimal: no component library, no CSS-in-JS, and no SCSS — just Tailwind utilities plus a single stylesheet that centralizes design tokens, base styles, reusable micro-components, and motion.

System & tooling
- Tailwind CSS v4 via @tailwindcss/vite plugin in vite.config.js.
- Styles are imported once from src/index.css, which uses the new @import "tailwindcss" directive and the @theme block to register custom properties as Tailwind v4 design tokens.
- No additional CSS preprocessors, PostCSS plugins, or style loaders beyond Vite + Tailwind.

Design tokens (in src/index.css)
- Fonts: display (Fraunces), sans (Hanken Grotesk), mono (JetBrains Mono) exposed as --font-display, --font-sans, --font-mono.
- Surfaces: paper, card, panel, line.
- Ink scale: ink, ink-soft, ink-faint.
- Brand accent: brand, brand-deep, marker.
- Verdict trio (kept separate from branding): go/go-soft/go-ink, warn/warn-soft/warn-ink, stop/stop-soft/stop-ink.
- These tokens are consumed throughout components via Tailwind color aliases like bg-brand, text-ink, border-line, bg-go-soft, etc.

Base styles & global conventions
- Body background uses the paper token with a faint dot-grid pattern so large areas read as textured rather than flat.
- A consistent focus-visible ring uses the brand color; selection color is also on-brand.
- Scrollbar styling is customized to match the palette.
- A prefers-reduced-motion media query neutralizes all animations and transitions for accessibility.

Reusable micro-classes (not Tailwind utilities)
The stylesheet defines a small vocabulary of compound classes that encapsulate multi-property UI patterns:
- .eyebrow — uppercase mono eyebrow labels.
- .stamp / .stamp-in — inspection-stamp aesthetic with rotation and slam animation.
- .marker-underline — highlighter-style underline under hero text.
- .elev / .elev-hover — subtle top-highlight + wide shadow elevation with hover lift.
- .paste-frame / .paste-area / .paste-accent / .paste-corner — the job-post slip input frame with corner reticles, growing accent bar, and focus-within lift/glow.
- .field-frame / .field-input / .field-accent — lighter sibling for single-line inputs/selects.
- Motion helpers: .rise, .settle, .toast-in, .scan-sweep, .pulse-dot, .page-enter, .ring-fill, and stagger delays .d1–.d6.

Component-level styling conventions
- Components compose Tailwind utility classes directly in JSX (e.g., ScanForm.jsx uses space-y-12, rounded-3xl, border border-line, bg-card, text-ink, hover:-translate-y-0.5, etc.).
- Local class constants are used for repeated patterns inside components (e.g., labelCls, fieldInputCls).
- Semantic state is expressed through conditional class concatenation (e.g., adding paste-shake border-stop when there's an error).
- Decorative SVG icons are inlined and colored via Tailwind text utilities (text-brand, text-go, text-warn, text-stop).

Responsive strategy
- Responsive breakpoints are applied via Tailwind's sm: / lg: prefixes (e.g., sm:px-12 sm:py-16, lg:grid-cols-[1fr_auto]).
- No separate mobile stylesheet; the same layout adapts across viewports using utility variants.

What developers should follow
- Use Tailwind utility classes for layout, spacing, typography, color, and responsive behavior.
- Pull colors, fonts, and semantic hues exclusively from the @theme tokens in index.css (e.g., text-ink, bg-brand, border-line, bg-go-soft).
- Reuse the provided micro-classes (.paste-frame, .field-frame, .elev, .stamp, .eyebrow, .rise, etc.) instead of re-implementing these effects inline.
- Keep decorative animations non-essential; rely on the existing prefers-reduced-motion handling rather than duplicating it per component.
- Avoid introducing new CSS files — extend src/index.css if a new shared class is needed.