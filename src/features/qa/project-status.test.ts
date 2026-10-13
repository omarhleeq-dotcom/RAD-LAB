import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateStatus } from "../../../scripts/status/check-status.mjs";

// Organisation check only (docs/status-format.md): it does not prove that a task is really done.
const STATUS_FILE = path.join(process.cwd(), "docs", "project-status.md");

function wrap(json: unknown): string {
  return `<!-- STATUS-DATA:BEGIN -->\n\`\`\`json\n${JSON.stringify(json)}\n\`\`\`\n<!-- STATUS-DATA:END -->`;
}

const task = {
  id: "RAD-001",
  title: "t",
  status: "planned",
  priority: "low",
  description: "d",
  source_ref: "s",
};
const base = {
  project: "RAD-LAB",
  format_version: "1.0",
  revision: 1,
  updated_at: "2026-10-13T02:40:00Z",
  timezone: "UTC",
  next_id: "RAD-002",
  tasks: [task],
};

describe("docs/project-status.md", () => {
  it("is organised correctly", () => {
    expect(validateStatus(readFileSync(STATUS_FILE, "utf8"))).toEqual([]);
  });
});

describe("status validator", () => {
  it("accepts a minimal valid file", () => {
    expect(validateStatus(wrap(base))).toEqual([]);
  });

  it("reports a missing block, invalid JSON and duplicate ids", () => {
    expect(validateStatus("nothing")).toHaveLength(1);
    expect(validateStatus("<!-- STATUS-DATA:BEGIN -->\n```json\n{\n```\n<!-- STATUS-DATA:END -->")[0]).toMatch(/invalid JSON/);
    const dup = validateStatus(wrap({ ...base, next_id: "RAD-003", tasks: [task, { ...task }] }));
    expect(dup.some((e) => e.includes("duplicate id"))).toBe(true);
  });

  it("rejects unknown statuses and priorities", () => {
    const errors = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "finished", priority: "urgent" }] }));
    expect(errors.some((e) => e.includes("status"))).toBe(true);
    expect(errors.some((e) => e.includes("priority"))).toBe(true);
  });

  it("requires evidence for done, a reason for deferred and a blocker for blocked", () => {
    const done = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "done" }] }));
    expect(done.some((e) => e.includes("completion_evidence"))).toBe(true);
    const deferred = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "deferred" }] }));
    expect(deferred.some((e) => e.includes("defer_reason"))).toBe(true);
    const blocked = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "blocked" }] }));
    expect(blocked.some((e) => e.includes("blocker"))).toBe(true);
    const ok = validateStatus(wrap({ ...base, tasks: [{ ...task, status: "done", completion_evidence: "e" }] }));
    expect(ok).toEqual([]);
  });

  it("keeps ids below next_id so an id is never reused", () => {
    expect(validateStatus(wrap({ ...base, next_id: "RAD-001" })).some((e) => e.includes("next_id"))).toBe(true);
  });

  it("rejects a revision below 1 and a time without an offset", () => {
    const errors = validateStatus(wrap({ ...base, revision: 0, updated_at: "2026-10-13T02:40:00" }));
    expect(errors.some((e) => e.includes("revision"))).toBe(true);
    expect(errors.some((e) => e.includes("updated_at"))).toBe(true);
  });
});
