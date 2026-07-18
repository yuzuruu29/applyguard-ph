import { describe, it, expect } from "vitest";
import { mergeJobs, mergeSettings, jobToRow, rowToJob } from "./sync.js";

const job = (id, over) => ({
  id,
  title: `Job ${id}`,
  status: "Saved",
  followUpBy: "",
  notes: "",
  updatedAt: "2026-07-01T00:00:00.000Z",
  createdAt: "2026-07-01T00:00:00.000Z",
  ...over,
});

describe("mergeJobs", () => {
  it("unions local and remote by id", () => {
    const merged = mergeJobs([job("a")], [job("b")]);
    expect(merged.map((j) => j.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps the newer copy when both sides have the same job", () => {
    const local = [job("a", { notes: "new", updatedAt: "2026-07-10T00:00:00.000Z" })];
    const remote = [job("a", { notes: "old", updatedAt: "2026-07-05T00:00:00.000Z" })];
    expect(mergeJobs(local, remote)[0].notes).toBe("new");
    expect(mergeJobs(remote, local)[0].notes).toBe("new");
  });

  it("sorts newest createdAt first (tracker order)", () => {
    const merged = mergeJobs(
      [job("old", { createdAt: "2026-01-01T00:00:00.000Z" })],
      [job("new", { createdAt: "2026-07-01T00:00:00.000Z" })]
    );
    expect(merged.map((j) => j.id)).toEqual(["new", "old"]);
  });

  it("never throws on garbage input", () => {
    expect(mergeJobs(null, undefined)).toEqual([]);
    expect(mergeJobs([null, { noId: true }], [])).toEqual([]);
  });
});

describe("mergeSettings", () => {
  it("prefers remote when remote has real values", () => {
    expect(mergeSettings({ name: "", minRate: 0, currency: "PHP" }, { name: "Maria", minRate: 30000, currency: "PHP" }).name).toBe("Maria");
  });

  it("keeps local when remote is still defaults", () => {
    expect(mergeSettings({ name: "Maria", minRate: 30000, currency: "PHP" }, { name: "", minRate: 0, currency: "PHP" }).name).toBe("Maria");
  });

  it("keeps local when remote is null", () => {
    expect(mergeSettings({ name: "Maria", minRate: 1, currency: "USD" }, null).name).toBe("Maria");
  });
});

describe("jobToRow / rowToJob", () => {
  it("round-trips a job through its cloud row shape", () => {
    const j = job("a", { score: 88 });
    const row = jobToRow("user-1", j);
    expect(row).toMatchObject({ id: "a", user_id: "user-1", updated_at: j.updatedAt });
    expect(rowToJob(row)).toEqual(j);
  });
});
