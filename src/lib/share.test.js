import { describe, it, expect, vi, afterEach } from "vitest";
import { shareSummary } from "./share.js";
import { copyToClipboard } from "./clipboard.js";

// ── helpers ────────────────────────────────────────────────────────────────

/** Build a minimal scan-result object, merging overrides. */
const result = (overrides = {}) => ({
  verdict: "Caution",
  score: 68,
  riskLevel: "Medium",
  flags: {
    hard: [
      { id: "upfront-fee", label: "Asks you to pay a fee", why: "..." },
    ],
    soft: [
      { id: "urgency", label: "Pushes urgency or limited slots", why: "..." },
    ],
  },
  missingInfo: ["How much does this pay?", "What are the working hours?"],
  rawText: "⚠️ SECRET RAW TEXT — should never leak into summary",
  prompt: "⚠️ SECRET PROMPT — should never leak into summary",
  ...overrides,
});

// ── shareSummary ───────────────────────────────────────────────────────────

describe("shareSummary", () => {
  it("builds a summary with mixed hard and soft flags", () => {
    const summary = shareSummary(result());

    expect(summary).toContain("📋 ApplyGuard PH verdict: Caution — 68/100 fit");
    expect(summary).toContain("Risk level: Medium");
    expect(summary).toContain("Watch out for:");
    expect(summary).toContain("- Asks you to pay a fee");
    expect(summary).toContain("- Pushes urgency or limited slots");
    expect(summary).toContain("Open questions: 2");
    expect(summary).toContain("---");
    expect(summary).toContain("Checked at applyguard.ph");
  });

  it("builds a summary with only soft flags", () => {
    const summary = shareSummary(
      result({
        flags: {
          hard: [],
          soft: [
            { id: "urgency", label: "Pushes urgency or limited slots", why: "..." },
            { id: "vague-pay", label: 'Pay is vague ("competitive")', why: "..." },
          ],
        },
      })
    );

    expect(summary).toContain("Watch out for:");
    expect(summary).toContain("- Pushes urgency or limited slots");
    expect(summary).toContain('- Pay is vague ("competitive")');
    expect(summary).not.toContain("Asks you to pay a fee");
  });


  it('shows "No major flags found." when there are zero flags', () => {
    const summary = shareSummary(
      result({
        verdict: "Apply",
        score: 92,
        riskLevel: "Low",
        flags: { hard: [], soft: [] },
        missingInfo: [],
      })
    );

    expect(summary).toContain("📋 ApplyGuard PH verdict: Apply — 92/100 fit");
    expect(summary).toContain("Risk level: Low");
    expect(summary).toContain("No major flags found.");
    expect(summary).not.toContain("Watch out for:");
    expect(summary).toContain("Open questions: 0");
  });

  it("truncates flags at 3 and appends a count when there are >3", () => {
    const summary = shareSummary(
      result({
        flags: {
          hard: [
            { id: "h1", label: "Hard flag A", why: "" },
            { id: "h2", label: "Hard flag B", why: "" },
          ],
          soft: [
            { id: "s1", label: "Soft flag C", why: "" },
            { id: "s2", label: "Soft flag D", why: "" },
          ],
        },
      })
    );

    // 4 total flags → first 3 shown, 4th omitted, "…and 1 more flag"
    expect(summary).toContain("- Hard flag A");
    expect(summary).toContain("- Hard flag B");
    expect(summary).toContain("- Soft flag C");
    expect(summary).not.toContain("Soft flag D");
    expect(summary).toContain("...and 1 more flag");
  });

  it("never includes rawText in the summary", () => {
    const summary = shareSummary(
      result({ rawText: "SUPER SECRET job post body that must not leak" })
    );

    expect(summary).not.toContain("SUPER SECRET");
    expect(summary).not.toContain("SECRET RAW TEXT");
  });

  it("never includes prompt in the summary", () => {
    const summary = shareSummary(
      result({ prompt: "SUPER SECRET AI prompt that must not leak" })
    );

    expect(summary).not.toContain("SUPER SECRET");
    expect(summary).not.toContain("SECRET PROMPT");
  });

  it("never includes rawText or prompt even when data is fully populated", () => {
    const summary = shareSummary(result());

    expect(summary).not.toContain("rawText");
    expect(summary).not.toContain("prompt");
    expect(summary).not.toContain("SECRET");
    expect(summary).not.toContain("⚠️");
  });

  it("handles null / undefined input gracefully", () => {
    const summary = shareSummary(null);
    expect(summary).toContain("📋 ApplyGuard PH verdict: ? — 0/100 fit");
    expect(summary).toContain("Risk level: ?");
    expect(summary).toContain("No major flags found.");
    expect(summary).toContain("Open questions: 0");
  });

  it("handles empty object", () => {
    const summary = shareSummary({});
    expect(summary).toContain("📋 ApplyGuard PH verdict: ? — 0/100 fit");
  });
});


// ── copyToClipboard ────────────────────────────────────────────────────────

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to execCommand when the Clipboard API is unavailable", async () => {
    // Remove navigator.clipboard so the Clipboard API path is skipped.
    vi.stubGlobal("navigator", {});

    // Build a minimal document mock for the execCommand fallback.
    const select = vi.fn();
    const removeChild = vi.fn();
    const textarea = {
      value: "",
      select,
      remove: vi.fn(),
      style: {},
    };

    const execCommand = vi.fn().mockReturnValue(true);
    const appendChild = vi.fn();

    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue(textarea),
      body: { appendChild, removeChild },
      execCommand,
    });

    await copyToClipboard("hello world");

    // The textarea should be populated with the correct text.
    expect(textarea.value).toBe("hello world");
    // select() must be called so execCommand("copy") copies the right node.
    expect(select).toHaveBeenCalledOnce();
    // execCommand("copy") is the actual fallback copy call.
    expect(execCommand).toHaveBeenCalledWith("copy");
    // Cleanup must happen in the finally block.
    expect(removeChild).toHaveBeenCalledWith(textarea);
  });
});

