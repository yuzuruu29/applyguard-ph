// backgroundcheck.report.test.js — plain-text report formatting.
// Kept separate from backgroundcheck.test.js (daily-limit semantics) so each
// file covers one concern. The report never invents data: it renders exactly
// the signals/positives analyzeUrl produced, hard flags before soft.
import { describe, it, expect } from "vitest";
import { analyzeUrl, formatCheckReport, VERDICT_LABELS } from "./backgroundcheck.js";

describe("formatCheckReport", () => {
  it("renders verdict label, score, link, and domain", () => {
    const result = analyzeUrl("https://www.linkedin.com/jobs/view/123");
    const text = formatCheckReport(result);

    expect(text).toContain("ApplyGuard PH link check");
    expect(text).toContain("Link: https://www.linkedin.com/jobs/view/123");
    expect(text).toContain("Domain: www.linkedin.com");
    expect(text).toContain(`Verdict: ${VERDICT_LABELS[result.verdict]} (${result.score}/100)`);
  });

  it("lists positives under Good signs", () => {
    const result = analyzeUrl("https://onlinejobs.ph/job/12345");
    const text = formatCheckReport(result);

    expect(text).toContain("Good signs:");
    expect(text).toContain("- Uses HTTPS (encrypted connection)");
    expect(text).toContain("- Recognized job platform or professional network");
  });

  it("lists serious flags before caution flags", () => {
    const result = formatCheckReport({
      score: 10,
      verdict: "suspicious",
      positives: [],
      signals: [
        { severity: "soft", text: "Soft signal" },
        { severity: "hard", text: "Hard signal" },
      ],
      meta: { input: "http://bad.example", domain: "bad.example" },
    });

    const seriousIdx = result.indexOf("- (serious) Hard signal");
    const checkIdx = result.indexOf("- (check) Soft signal");
    expect(seriousIdx).toBeGreaterThan(-1);
    expect(checkIdx).toBeGreaterThan(-1);
    expect(seriousIdx).toBeLessThan(checkIdx);
  });

  it("notes when a valid URL has no flags", () => {
    const text = formatCheckReport({
      score: 80,
      verdict: "credible",
      positives: ["Uses HTTPS (encrypted connection)"],
      signals: [],
      meta: { input: "https://example.com", domain: "example.com" },
    });

    expect(text).toContain("No URL-level flags found");
  });

  it("stays robust for an invalid parse result", () => {
    const result = analyzeUrl("");
    const text = formatCheckReport(result);

    expect(text).toContain(`Verdict: ${VERDICT_LABELS.invalid} (0/100)`);
    expect(text).not.toContain("No URL-level flags found");
  });

  it("always signs off with the check URL", () => {
    const text = formatCheckReport(analyzeUrl("https://example.com"));
    expect(text.trim().endsWith("Checked at applyguard.ph/background-check")).toBe(true);
  });
});
