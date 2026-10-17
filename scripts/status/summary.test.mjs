import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { selectTasks, runSummary } from "./summary.mjs";
const data = { project: "RAD-LAB", format_version: "1.1", revision: 1, updated_at: "2026-10-16T00:00:00Z", timezone: "UTC", next_id: "RAD-003", tasks: [
  { id: "RAD-001", title: "Finished", status: "done", priority: "low", description: "archive", source_ref: "DECISIONS.md O102", completion_evidence: "merged" },
  { id: "RAD-002", title: "مراجعة", status: "review", priority: "low", description: "مصادر", source_ref: "DECISIONS.md O105", waiting_on: "owner" },
] };
test("default hides done, explicit ID can retrieve it; filters compose", () => {
  assert.deepEqual(selectTasks(data).map((task) => task.id), ["RAD-002"]);
  assert.deepEqual(selectTasks(data, { ids: ["RAD-001"] }).map((task) => task.id), ["RAD-001"]);
  assert.equal(selectTasks(data, { statuses: ["review"], query: "O105" }).length, 1);
  assert.equal(selectTasks(data, { all: true, query: "O102" }).length, 1);
  assert.equal(selectTasks(data, { all: true }).length, 2);
});
test("CLI JSON is derived from source and never rewrites it", () => {
  const root = mkdtempSync(path.join(tmpdir(), "radlab-summary-")), filename = path.join(root, "status.md");
  const markdown = `<!-- STATUS-DATA:BEGIN -->\n\`\`\`json\n${JSON.stringify(data)}\n\`\`\`\n<!-- STATUS-DATA:END -->`;
  writeFileSync(filename, markdown); const originalLog = console.log, output = [];
  try {
    console.log = (value) => output.push(value); assert.equal(runSummary(["--id", "RAD-001", "--json"], filename), 0);
    assert.equal(JSON.parse(output[0]).tasks[0].completion_evidence, "merged"); assert.equal(readFileSync(filename, "utf8"), markdown);
    assert.throws(() => runSummary(["--id", "RAD-999"], filename), /unknown task/);
    assert.throws(() => runSummary(["--status", "made-up"], filename), /unknown status/);
    writeFileSync(filename, "bad"); assert.throws(() => runSummary([], filename), /STATUS-DATA/);
  } finally { console.log = originalLog; rmSync(root, { recursive: true, force: true }); }
});
