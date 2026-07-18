// prompts.ts — prompt builders for the four premium AI features.
// The job post is always fenced so the model treats it as data, never
// as instructions (prompt-injection guard).

type Feature = "message" | "deepscan" | "resume" | "interview";

interface PromptInput {
  rawText: string;
  intake?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

function fence(text: string) {
  return `"""\n${(text || "").trim()}\n"""`;
}

function aboutMe(input: PromptInput) {
  const i = input.intake || {};
  const s = input.settings || {};
  return [
    "About the applicant:",
    `- Name: ${(s.name as string) || "(the applicant will fill this in)"}`,
    `- Target role: ${(i.role as string) || "(see the post)"}`,
    `- Skills: ${(i.skills as string) || "(not listed)"}`,
    `- Experience level: ${(i.experience as string) || "(not stated)"}`,
  ].join("\n");
}

export const FEATURES: Record<Feature, { system: string; maxTokens: number; build: (input: PromptInput) => string }> = {
  message: {
    maxTokens: 700,
    system:
      "You write short, human, specific job application messages for Filipino remote workers. " +
      "120-160 words, first person, no buzzwords, no \"I am excited to apply\". Never invent skills or experience.",
    build: (input) => [
      "Write an application message for the remote job post below.",
      "",
      aboutMe(input),
      "",
      "The job post:",
      fence(input.rawText),
      "",
      "Requirements:",
      "1. Open with one specific reason this role fits them (no \"Dear Hiring Manager\").",
      "2. Name two concrete things they can do for the employer, tied to what the post asks for.",
      "3. End with a short, friendly closing that leaves the door open for a reply.",
      "4. Keep it 120-160 words total.",
    ].join("\n"),
  },

  deepscan: {
    maxTokens: 900,
    system:
      "You are a scam analyst examining remote job posts for Filipino job seekers. " +
      "Be specific: cite exact lines from the post. Never call a post \"safe\" — say \"no major flags found, still verify directly\" when clean.",
    build: (input) => [
      "Analyze this job post for scam signals and red flags. Structure your answer in four sections:",
      "",
      "## Scam signals found",
      "List specific red flags with quotes from the post. If none found, say \"No major signals detected.\"",
      "",
      "## What's suspicious but not conclusive",
      "Patterns that are common in scams but could be legitimate — note them, don't accuse.",
      "",
      "## Verification steps",
      "Concrete steps the applicant should take before applying: check the company domain, search for reviews, verify payment terms, etc.",
      "",
      "## Bottom line",
      "One-sentence summary. Never say the post is \"safe\" — say \"no major flags found, verify the company directly before sending anything.\"",
      "",
      "The job post:",
      fence(input.rawText),
    ].join("\n"),
  },

  resume: {
    maxTokens: 800,
    system:
      "You help Filipino remote workers tailor their resume bullet points to match a specific job post. " +
      "Use the applicant's real experience. Never invent skills or roles. Be concrete, not generic.",
    build: (input) => {
      const extra = input.extra || {};
      const resumeText = (extra.resumeText as string) || "";
      return [
        "Given the applicant's resume and a job post, suggest 3-5 tailored bullet points.",
        "",
        aboutMe(input),
        "",
        "The applicant's resume:",
        fence(resumeText),
        "",
        "The job post:",
        fence(input.rawText),
        "",
        "Requirements:",
        "1. Rewrite or suggest bullet points that use language from the post.",
        "2. Be specific — reference real tools, metrics, or achievements from their resume.",
        "3. Never invent experience they don't have.",
        "4. Format as markdown bullet points with brief explanations.",
      ].join("\n");
    },
  },

  interview: {
    maxTokens: 800,
    system:
      "You prepare Filipino remote workers for job interviews. Generate questions the employer is likely to ask " +
      "based on the job post. Include suggested answer approaches — honest, confident, no scripted filler.",
    build: (input) => [
      "Generate 5 interview questions this employer is likely to ask, based on the job post. For each question, include:",
      "",
      "1. The question",
      "2. A suggested answer approach (not a full script — bullet points of what to cover)",
      "",
      aboutMe(input),
      "",
      "The job post:",
      fence(input.rawText),
      "",
      "Format as markdown. Keep answer suggestions practical and honest — no \"I'm passionate about\" filler.",
    ].join("\n"),
  },
};
