// prompt.js — builds COPY-TO-CLIPBOARD prompts for the user's own AI
// (ChatGPT / Claude / Gemini). This file makes NO API calls and spends no
// paid tokens of any kind. It only assembles text the user pastes elsewhere.

function fence(text) {
  // Wrap the pasted post so the AI treats it as reference, not instructions.
  return `"""\n${(text || "").trim()}\n"""`;
}

function line(label, value, fallback) {
  return `- ${label}: ${value && String(value).trim() ? value : fallback}`;
}

/**
 * A prompt the seeker pastes into their AI to draft a real application
 * message. Used when the post has no missing info.
 * @param {object} job - { intake, rawText }
 * @param {object} [settings] - { name, ... }
 * @returns {string}
 */
export function buildApplicationPrompt(job = {}, settings = {}) {
  const intake = job.intake || {};
  const name = settings.name && settings.name.trim() ? settings.name.trim() : "(add your name)";

  return [
    "Help me write a short application message for the remote job below.",
    "Keep it human and specific. 120–160 words. First person. No buzzwords,",
    'no "I am excited to apply", no generic filler.',
    "",
    "About me:",
    line("Name", name, "(add your name)"),
    line("Role I'm applying for", intake.role, "(see the post)"),
    line("My relevant skills", intake.skills, "(add a few)"),
    line("My experience level", intake.experience, "(add yours)"),
    "",
    "The job post:",
    fence(job.rawText),
    "",
    "Write a message to the employer that:",
    "1. Opens with one specific reason this role fits me (no \"Dear Hiring Manager\").",
    "2. Names two concrete things I can do for them, tied to what the post asks for.",
    "3. Ends with a short, low-pressure line about talking further.",
    "",
    "Only use the skills and experience I listed. Don't invent anything I didn't say.",
  ].join("\n");
}

/**
 * A prompt the seeker pastes into their AI to draft polite questions that
 * fill the gaps. Used when the post is missing key info.
 * @param {object} job - { rawText, missingInfo }
 * @returns {string}
 */
export function buildClarificationPrompt(job = {}) {
  const missing = Array.isArray(job.missingInfo) ? job.missingInfo : [];
  const questions = missing.length
    ? missing.map((m) => `- ${m}`).join("\n")
    : "- (List the details the post left out.)";

  return [
    "Help me reply to the remote job post below. Some details are missing, so",
    "I want to ask about them before I apply.",
    "",
    "Write a short, friendly message (under 120 words) that asks for the missing",
    "info without sounding suspicious or demanding. One short paragraph, then the",
    "questions as a tight list. Don't apply yet — just ask.",
    "",
    "The job post:",
    fence(job.rawText),
    "",
    "Ask about these open points:",
    questions,
    "",
    "Keep it polite and professional, the way a serious candidate would write.",
  ].join("\n");
}
