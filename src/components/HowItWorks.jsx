// HowItWorks.jsx — Phase 7: the three steps as one connected field-guide story.
//
// A hand-drawn marker path draws left-to-right across the numbered nodes as the
// section scrolls into view; the numbered ink circles pop in on the path, and
// the cards rise just after. Desktop shows the horizontal path; on mobile the
// cards simply stack (path hidden) to stay robust across widths.
import { m } from "motion/react";
import { duration, easing } from "../motion/tokens.js";
import { glassIn } from "../motion/variants.js";
import { useSpotlight } from "../hooks/useSpotlight.js";

const STEPS = [
  { step: "1", title: "Paste the job post", desc: "Copy the full listing — title, description, pay, contact info." },
  { step: "2", title: "Add your details", desc: "Optionally tell us your role, skills, and expected pay for a personal fit score." },
  { step: "3", title: "Get your verdict", desc: "See Apply, Caution, or Skip — plus red flags, missing info, and questions to ask." },
];

// once:true so the story plays a single time, not on every scroll pass.
const viewport = { once: true, amount: 0.4 };

export default function HowItWorks() {
  const spotlight = useSpotlight();
  return (
    <section className="scroll-reveal">
      <p className="eyebrow mb-6">How it works</p>

      <div className="relative">
        {/* The drawn path connecting the numbered nodes on sm+.
            Geometry, not guesswork: the nodes are 40px circles at the start of
            each column of a 3-column grid with a 24px gap, so their centres sit
            at 20px and at (2W + 2·gap)/3 + 20px. The span between them is
            therefore 66.667% + 16px, and 20px down from the top of the row.
            The previous inset-x-[12%] / width:76% guess drifted off both ends. */}
        <svg
          className="pointer-events-none absolute hidden h-6 sm:block"
          style={{
            left: 20,
            width: "calc(66.6667% + 16px)",
            top: 20,
            transform: "translateY(-50%)",
          }}
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
            <m.div key={item.step} variants={glassIn}>
              {/* numbered ink circle sits on the path */}
              <div className="mb-4 flex justify-center sm:justify-start">
                <m.span
                  className="btn-gradient relative z-10 flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm font-bold text-paper ring-4 ring-paper"
                  variants={{
                    hidden: { scale: 0.4, opacity: 0 },
                    show: { scale: 1, opacity: 1, transition: { duration: duration.normal, ease: easing.overshoot } },
                  }}
                >
                  {item.step}
                </m.span>
              </div>

              <div
                {...spotlight}
                className="glass spotlight spring-hover h-full rounded-2xl p-5"
              >
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
