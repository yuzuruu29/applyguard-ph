// trackerFilter.test.js — tracker list filtering semantics.
import { describe, it, expect } from "vitest";
import { filterJobs } from "./trackerFilter.js";

const JOBS = [
  { id: "a", title: "Virtual Assistant — Cebu team", notes: "Spoke to Ana, waiting on rate", status: "Saved" },
  { id: "b", title: "Customer Support (Zendesk)", notes: "", status: "Applied" },
  { id: "c", title: "Data Entry", notes: "Telegram contact, felt off", status: "Closed" },
  { id: "d", title: "Frontend Developer", notes: "Second interview Friday", status: "Interview" },
];

describe("filterJobs", () => {
  it("returns everything with no filters", () => {
    expect(filterJobs(JOBS)).toHaveLength(4);
    expect(filterJobs(JOBS, {})).toHaveLength(4);
  });

  it('treats "All" and empty query as no-ops', () => {
    expect(filterJobs(JOBS, { query: "   ", status: "All" })).toHaveLength(4);
  });

  it("filters by pipeline status", () => {
    const out = filterJobs(JOBS, { status: "Applied" });
    expect(out.map((j) => j.id)).toEqual(["b"]);
  });

  it("matches the query against titles, case-insensitively", () => {
    const out = filterJobs(JOBS, { query: "zendesk" });
    expect(out.map((j) => j.id)).toEqual(["b"]);
  });

  it("matches the query against notes", () => {
    const out = filterJobs(JOBS, { query: "telegram" });
    expect(out.map((j) => j.id)).toEqual(["c"]);
  });

  it("combines status and query", () => {
    expect(filterJobs(JOBS, { query: "interview", status: "Interview" }).map((j) => j.id)).toEqual(["d"]);
    expect(filterJobs(JOBS, { query: "interview", status: "Saved" })).toHaveLength(0);
  });

  it("preserves the incoming order", () => {
    const out = filterJobs(JOBS, { query: "e" });
    const ids = out.map((j) => j.id);
    expect(ids).toEqual([...ids].sort((x, y) => JOBS.findIndex((j) => j.id === x) - JOBS.findIndex((j) => j.id === y)));
  });

  it("tolerates missing fields and non-array input", () => {
    expect(filterJobs(null)).toEqual([]);
    expect(filterJobs([{ id: "x", status: "Saved" }], { query: "anything" })).toEqual([]);
  });
});
