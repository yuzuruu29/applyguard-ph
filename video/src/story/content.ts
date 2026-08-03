// content.ts — All text and data used in the product story.
// Single source of truth for listing content, annotations, and labels.

/** The mixed-risk job listing shown throughout the film. */
export const LISTING = {
  title: "Marketing Coordinator — Remote",
  company: "NovaBridge Solutions",
  lines: [
    { id: "title", text: "Marketing Coordinator — Remote", tone: "neutral" as const },
    { id: "company", text: "NovaBridge Solutions", tone: "neutral" as const },
    { id: "salary", text: "₱25,000–₱35,000 monthly", tone: "neutral" as const },
    { id: "perks", text: "Flexible schedule, work from home", tone: "neutral" as const },
    { id: "contact", text: "Message us on Telegram for quick apply", tone: "stop" as const },
    { id: "fee", text: "₱1,500 onboarding fee, refunded after three months", tone: "stop" as const },
    { id: "address", text: "Company address not included", tone: "warn" as const },
    { id: "website", text: "Official company website not provided", tone: "warn" as const },
  ],
} as const;

/** Annotations applied by the scanner. */
export const ANNOTATIONS = [
  { lineId: "salary", label: "Clear salary range", tone: "brand" as const },
  { lineId: "contact", label: "Off-platform contact", tone: "stop" as const },
  { lineId: "fee", label: "Upfront fee", tone: "stop" as const },
  { lineId: "address", label: "Missing company details", tone: "warn" as const },
  { lineId: "website", label: "No company website", tone: "warn" as const },
];

/** Risk results shown in the verdict beat. */
export const RISK_RESULTS = [
  { label: "Off-platform contact only", tone: "stop" as const },
  { label: "Upfront fee requested", tone: "stop" as const },
  { label: "Company address not included", tone: "warn" as const },
  { label: "Official company website not provided", tone: "warn" as const },
];

/** Company review data for beat 4. */
export const COMPANY_REVIEW = {
  company: {
    name: "NovaBridge Solutions",
    findings: [
      "Company registration details not provided",
      "No company address included",
    ],
    action: "Verify the legal business name through SEC or DTI.",
  },
  contact: {
    name: "Telegram-only application route",
    findings: [
      "No official company website provided",
    ],
    action: "Confirm contact details through an independent source.",
  },
};

/** Verification guidance steps for beat 5. */
export const GUIDANCE_STEPS = [
  "Ask for the company's registered legal name",
  "Verify the business through SEC or DTI",
  "Request written terms for the onboarding fee",
  "Confirm the role through an official company channel",
];

/** Resume transformation content for beat 6. */
export const RESUME_CONTENT = {
  header: "Marketing Coordinator Application",
  lines: [
    "Relevant skills highlighted",
    "Experience aligned with the role",
    "Summary tailored to the job requirements",
  ],
};

/** Outreach message content for beat 6. */
export const OUTREACH_CONTENT = {
  subject: "Subject: Marketing Coordinator application",
  body: [
    "Hello,",
    "",
    "I'm interested in the Marketing Coordinator role.",
    "Before proceeding, could you confirm the company's",
    "registered business name, official website, and",
    "whether any payment is required?",
    "",
    "Thank you.",
  ],
};

/** Interview prep content for beat 6. */
export const INTERVIEW_CONTENT = {
  header: "Interview preparation",
  lines: [
    "Ask about the onboarding-fee policy",
    "Confirm official communication channels",
    "Prepare examples of campaign work",
    "Ask how success is measured in the role",
  ],
};

/** Tracker stage labels. */
export const TRACKER_STAGES = [
  { key: "saved", label: "Saved", icon: "bookmark" as const },
  { key: "applied", label: "Applied", icon: "paperPlane" as const },
  { key: "interview", label: "Interview", icon: "calendar" as const },
  { key: "offer", label: "Offer", icon: "trophy" as const },
];

/** Closing text. */
export const CLOSING = {
  headline: "Check the opportunity. Apply with confidence.",
  sub: "Job-safety and career tools built for Filipino job seekers.",
  small: "Free private scan. Deeper guidance available with Pro.",
  cta: "Scan a job post free",
  workflow: ["Check", "Verify", "Improve", "Prepare", "Track"],
};
