// samples.js — two built-in example job posts so a first-time visitor can see a
// verdict in seconds, before they trust the tool with a real post.
// Pure data. No React, no DOM, no storage.

/**
 * SKETCHY — a clearly scammy post that will trigger multiple hard flags.
 * Guaranteed "Skip" verdict. Contains: NO EXPERIENCE NEEDED, exaggerated pay,
 * Telegram contact, ID + selfie request, and upfront starter-kit payment.
 */
const SKETCHY = {
  key: "sketchy",
  label: "A sketchy-looking post",
  description: "Packed with red flags — NO EXPERIENCE NEEDED, Telegram contact, ID selfie, starter-kit fee.",
  rawText: `EARN UP TO ₱85,000/MONTH!!! WORK FROM HOME — NO EXPERIENCE NEEDED!!!

We are hiring URGENTLY! Only 3 slots left for this ONLINE DATA ENCODER position! Earn up to ₱85,000/month — guaranteed income paid weekly. No interview needed — get hired today!

What you need to do:
- Type data into our system (super easy, anyone can do it!)
- Work from your phone or laptop, WiFi only

To get started:
1. Send your valid ID and a selfie to telegram @quickcash_ph
2. Pay ₱2,500 for the starter kit (training materials + software access)

Message us on Telegram now — limited slots. Apply now before slots run out!!!`,
  intake: {
    role: "",
    skills: "",
    experience: "",
    rate: "",
    rateType: "Not stated",
    hours: "Not stated",
  },
};

/**
 * CLEAN — a legitimate, well-structured job post from a real company.
 * Guaranteed "Apply" verdict when combined with matching skills and rate floor.
 * Contains: named company, specific role, clear pay range, benefits, professional contact.
 */
const CLEAN = {
  key: "clean",
  label: "A solid-looking post",
  description: "Clean listing from a real company — clear pay, benefits, and professional contact.",
  rawText: `Customer Support Specialist (Remote) — Peak Support

Peak Support is a growing BPO based in Manila, looking for a full-time Customer Support Specialist to join our remote team.

Responsibilities:
- Answer customer questions via email and chat using Zendesk
- Handle refunds, replacements, and order tracking
- Write and improve help-center articles alongside the team

Requirements:
- At least 1 year of customer support experience
- Strong written English and comfort with Zendesk or similar tools
- A quiet workspace and reliable internet connection

Schedule: Monday–Friday, 40 hours per week, day shift Philippine time.

Pay: ₱35,000 – ₱42,000 per month, paid twice monthly via bank transfer.

Benefits: HMO after 3 months, 15 VL / 10 SL per year, performance bonuses.

To apply, send your CV to careers@peaksupport.ph with a short note about a tricky customer issue you resolved.`,
  intake: {
    role: "",
    skills: "",
    experience: "Intermediate",
    rate: 42000,
    rateType: "Monthly",
    hours: "40+ hrs/week",
  },
};

/** Ordered array of sample posts shown as one-click chips in the UI. */
export const SAMPLES = [SKETCHY, CLEAN];

/** Lookup keys for each sample so callers don't hard-code strings. */
export const SAMPLE_IDS = {
  SKETCHY: "sketchy",
  CLEAN: "clean",
};

/**
 * Return the sample with the given key, or undefined when not found.
 * @param {string} key
 * @returns {object|undefined}
 */
export function sampleByKey(key) {
  return SAMPLES.find((s) => s.key === key);
}
