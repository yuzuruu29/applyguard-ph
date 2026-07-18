import { describe, it, expect } from "vitest";
import { SAMPLES, SAMPLE_IDS, sampleByKey } from "./samples.js";
import { scanFlags } from "./redflags.js";

// ── Structural tests ──────────────────────────────────────────────────────

describe("SAMPLES array", () => {
  it("contains exactly 2 entries", () => {
    expect(SAMPLES).toHaveLength(2);
  });

  it("has one sketchy and one clean sample", () => {
    const keys = SAMPLES.map((s) => s.key);
    expect(keys).toContain("sketchy");
    expect(keys).toContain("clean");
  });

  it("every sample has all required top-level fields", () => {
    for (const s of SAMPLES) {
      expect(s).toHaveProperty("key");
      expect(typeof s.key).toBe("string");
      expect(s).toHaveProperty("label");
      expect(typeof s.label).toBe("string");
      expect(s).toHaveProperty("description");
      expect(typeof s.description).toBe("string");
      expect(s).toHaveProperty("rawText");
      expect(typeof s.rawText).toBe("string");
      expect(s.rawText.length).toBeGreaterThan(0);
    }
  });

  it("every sample has a complete intake shape", () => {
    for (const s of SAMPLES) {
      expect(s).toHaveProperty("intake");
      const i = s.intake;
      expect(i).toHaveProperty("role");
      expect(i).toHaveProperty("skills");
      expect(i).toHaveProperty("experience");
      expect(i).toHaveProperty("rate");
      expect(i).toHaveProperty("rateType");
      expect(i).toHaveProperty("hours");
    }
  });

  it("both samples leave role and skills blank for the chip+copy workflow", () => {
    for (const s of SAMPLES) {
      expect(s.intake.role).toBe("");
      expect(s.intake.skills).toBe("");
    }
  });
});

// ── SAMPLE_IDS ────────────────────────────────────────────────────────────

describe("SAMPLE_IDS", () => {
  it("maps SKETCHY to 'sketchy'", () => {
    expect(SAMPLE_IDS.SKETCHY).toBe("sketchy");
  });

  it("maps CLEAN to 'clean'", () => {
    expect(SAMPLE_IDS.CLEAN).toBe("clean");
  });
});

// ── sampleByKey ───────────────────────────────────────────────────────────

describe("sampleByKey", () => {
  it("returns the sketchy sample for 'sketchy'", () => {
    const s = sampleByKey("sketchy");
    expect(s).toBeDefined();
    expect(s.key).toBe("sketchy");
  });

  it("returns the clean sample for 'clean'", () => {
    const s = sampleByKey("clean");
    expect(s).toBeDefined();
    expect(s.key).toBe("clean");
  });

  it("returns undefined for an unknown key", () => {
    expect(sampleByKey("nope")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(sampleByKey("")).toBeUndefined();
  });
});

// ── SKETCHY post: red-flag content ────────────────────────────────────────

describe("SKETCHY sample — scam signals", () => {
  const sketchy = sampleByKey("sketchy");

  it("contains NO EXPERIENCE NEEDED in all-caps", () => {
    expect(sketchy.rawText).toMatch(/NO EXPERIENCE NEEDED/);
  });

  it("mentions earning up to ₱85,000/month", () => {
    expect(sketchy.rawText).toMatch(/₱85,000/);
  });

  it("asks for an ID and a selfie via Telegram", () => {
    expect(sketchy.rawText).toMatch(/send.*(ID|valid ID).*(selfie|telegram)/i);
    expect(sketchy.rawText).toMatch(/telegram\s*@/i);
  });

  it("asks to pay ₱2,500 for a starter kit", () => {
    expect(sketchy.rawText).toMatch(/₱2,500.*starter kit/i);
  });

  it("triggers at least two hard flags when scanned", () => {
    const flags = scanFlags(sketchy.rawText, sketchy.intake);
    expect(flags.hard.length).toBeGreaterThanOrEqual(2);
  });

  it("triggers the upfront-fee or pay-to-start hard flag", () => {
    const flags = scanFlags(sketchy.rawText, sketchy.intake);
    const ids = flags.hard.map((f) => f.id);
    expect(ids.some((id) => id === "upfront-fee" || id === "pay-to-start")).toBe(true);
  });
});

// ── CLEAN post: legitimate job markers ────────────────────────────────────

describe("CLEAN sample — legitimate markers", () => {
  const clean = sampleByKey("clean");

  it("names the company Peak Support", () => {
    expect(clean.rawText).toMatch(/Peak Support/);
  });

  it("lists the job title Customer Support Specialist", () => {
    expect(clean.rawText).toMatch(/Customer Support Specialist/);
  });

  it("states a pay range of ₱35,000 – ₱42,000/month", () => {
    expect(clean.rawText).toMatch(/₱35,000/);
    expect(clean.rawText).toMatch(/₱42,000/);
    expect(clean.rawText).toMatch(/month/);
  });

  it("mentions Monday–Friday hours", () => {
    expect(clean.rawText).toMatch(/Monday.*Friday/i);
  });

  it("mentions benefits (HMO, VL/SL)", () => {
    expect(clean.rawText).toMatch(/HMO/i);
    expect(clean.rawText).toMatch(/VL|SL/);
  });

  it("provides a professional email contact", () => {
    expect(clean.rawText).toMatch(/careers@peaksupport\.ph/);
  });

  it("does NOT trigger any hard flags", () => {
    const flags = scanFlags(clean.rawText, clean.intake);
    expect(flags.hard).toHaveLength(0);
  });
});
