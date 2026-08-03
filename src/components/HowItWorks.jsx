// HowItWorks.jsx — Phase 7: the three steps as one connected field-guide story.
//
// A hand-drawn marker path draws left-to-right across the numbered nodes as the
// section scrolls into view; the numbered ink circles pop in on the path, and
// the cards rise just after. Desktop shows the horizontal path; on mobile the
// cards simply stack (path hidden) to stay robust across widths.
import { m } from "motion/react";
import { duration, easing } from "../motion/tokens.js";

const STEPS = [
  { step: "1", title: "Paste the job post", desc: "Copy the full listing — title, description, pay, contact info." },
  { step: "2", title: "Add your details", desc: "Optionally tell us your role, skills, and expected pay for a personal fit score." },
  { step: "3", title: "Get your verdict", desc: "See Apply, Caution, or Skip — plus red flags, missing info, and questions to ask." },
];

// once:true so the story plays a single time, not on every scroll pass.
const viewport = { once: true, amount: 0.4 };

export default function HowItWorks() {
  return (
    <section className="scroll-reveal">
      <p className="mb-6 text-sm font-semibold text-ink">How it works</p>

      <div className="relative">
        {/* the drawn path — sits behind the numbered nodes on sm+ */}
        <svg
          className="pointer-events-none absolute inset-x-[12%] top-4 hidden h-6 sm:block"
          style={{ width: "76%" }}
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <m.path
            d="M 10 22 C 200 4, 320 34, 500 20 S 800 6, 990 20"
            stroke="var(--color-marker)"
            strokeWidth="3.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.9 }}
            whileInView={{ pathLength: 1 }}
            viewport={viewport}
            transition={{ duration: 1.1, ease: easing.standard }}
          />
        </svg>

        <m.div
          className="grid gap-6 sm:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          variants={{ show: { transition: { staggerChildren: 0.18, delayChildren: 0.35 } } }}
        >
          {STEPS.map((item) => (
            <m.div
              key={item.step}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: duration.reveal, ease: easing.enter } },
              }}
            >
              {/* numbered ink circle sits on the path */}
              <div className="mb-4 flex justify-center sm:justify-start">
                <m.span
                  className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand font-mono text-sm font-bold text-paper shadow-md shadow-brand/30 ring-4 ring-paper"
                  variants={{
                    hidden: { scale: 0.4, opacity: 0 },
                    show: { scale: 1, opacity: 1, transition: { duration: duration.normal, ease: easing.overshoot } },
                  }}
                >
                  {item.step}
                </m.span>
              </div>

              <div className="spring-hover elev rounded-2xl border border-line bg-card p-5">
                <h3 className="font-display text-lg text-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{item.desc}</p>
              </div>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
