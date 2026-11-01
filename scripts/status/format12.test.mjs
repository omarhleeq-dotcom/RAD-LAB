import test from "node:test";
import assert from "node:assert/strict";
import { validateStatus, compareStatus } from "./check-status.mjs";
import { selectTasks } from "./summary.mjs";
const task = { id: "RAD-001", title: "Review", status: "review", priority: "low", description: "Check", source_ref: "DECISIONS.md", waiting_on: "owner", done_when: "Merged and green" };
const data = { project: "RAD-LAB", format_version: "1.2", revision: 1, updated_at: "2026-11-01T00:00:00Z", timezone: "UTC", next_id: "RAD-002", tasks: [task] };
const md = (d) => '<!-- STATUS-DATA:BEGIN -->\n```json\n' + JSON.stringify(d) + '\n```\n<!-- STATUS-DATA:END -->';
test("format1.2 requires a bounded explicit closure on review/owner and preserves older formats", () => {
  assert.deepEqual(validateStatus(md(data)), []);
  assert.match(validateStatus(md({ ...data, tasks: [{ ...task, done_when: "x".repeat(201) }] })).join(), /done_when/);
  const { done_when, ...missing } = task;
  assert.ok(done_when);
  assert.match(validateStatus(md({ ...data, tasks: [missing] })).join(), /needs done_when/);
  assert.deepEqual(validateStatus(md({ ...data, format_version: "1.1", tasks: [missing] })), []);
});
test("every new task requires done_when even if it is not review/owner", () => {
  const next = { ...data, revision: 2, updated_at: "2026-11-01T00:01:00Z", next_id: "RAD-003", tasks: [task, { ...task, id: "RAD-002", status: "planned", waiting_on: "code" }] };
  delete next.tasks[1].done_when;
  assert.match(compareStatus(md(data), md(next)).join(), /new task needs done_when/);
  next.tasks[1].done_when = "Owner accepts";
  assert.deepEqual(compareStatus(md(data), md(next)), []);
});
test("pending selects only review/owner and retains exact closure text", () => {
  const tasks = selectTasks({ tasks: [task, { ...task, id: "RAD-002", waiting_on: "reviewer" }, { ...task, id: "RAD-003", status: "planned" }] }, { pending: true });
  assert.deepEqual(tasks, [task]);
});
