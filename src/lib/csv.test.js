import { describe, it, expect } from "vitest";
import { jobsToCSV } from "./csv.js";

describe("jobsToCSV", () => {
  it("neutralizes spreadsheet formulas from saved job text", () => {
    const csv = jobsToCSV([
      {
        title: "=HYPERLINK(\"https://example.com\",\"Apply\")",
        notes: "+cmd|' /C calc'!A0",
        flags: { hard: [], soft: [] },
        intake: {},
      },
    ]);

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+cmd");
  });
});
