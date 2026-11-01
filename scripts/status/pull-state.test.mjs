import test from "node:test";
import assert from "node:assert/strict";
import { linkedPulls, readPullStates } from "./pull-state.mjs";
const task = { description: "Merged #50; #50", source_ref: "https://github.com/example/repo/pull/60; #70" };
const response = (number, checks, state = "MERGED") => JSON.stringify({ number, state, mergedAt: "2026-11-01T00:00:00Z", headRefOid: "a".repeat(40), statusCheckRollup: checks });
const success = { __typename: "CheckRun", status: "COMPLETED", conclusion: "SUCCESS" };
test("linked PRs deduplicate and use read-only gh view with head checks", () => {
  assert.equal(linkedPulls(task).length, 3);
  const calls = [], cache = new Map(), run = (command, args) => { calls.push([command, args]); return response(Number(args[2]), [success]); };
  const original = structuredClone(task);
  assert.ok(readPullStates(task, { run, cache }).every((pull) => pull.state === "merged" && pull.head_ci === "success"));
  readPullStates(task, { run, cache }); assert.equal(calls.length, 3);
  assert.ok(calls.every(([command, args]) => command === "gh" && args[0] === "pr" && args[1] === "view"));
  assert.deepEqual(task, original);
});
test("missing gh/access/bad data and skipped or absent checks never report green", () => {
  assert.ok(readPullStates(task, { run: () => { throw Error("credential must not be printed"); } }).every((p) => p.state === "unverified"));
  assert.equal(readPullStates({ source_ref: "none" })[0].head_ci, "unverified");
  for (const checks of [[], [{ ...success, conclusion: "SKIPPED" }], [{ ...success, conclusion: "NEUTRAL" }]]) assert.equal(readPullStates({ source_ref: "#50" }, { run: () => response(50, checks) })[0].head_ci, "unverified");
  assert.equal(readPullStates(task, { run: () => "bad JSON" })[0].state, "unverified");
});
test("pending, failure and legacy status contexts reflect the exact head result", () => {
  const state = (checks) => readPullStates({ source_ref: "#50" }, { run: () => response(50, checks, "OPEN") })[0];
  assert.equal(state([{ ...success, status: "IN_PROGRESS", conclusion: null }]).head_ci, "pending");
  assert.equal(state([success, { ...success, conclusion: "FAILURE" }]).head_ci, "failure");
  assert.equal(state([{ __typename: "StatusContext", state: "SUCCESS" }]).head_ci, "success");
  assert.equal(state([success]).state, "open");
});

test("pending CLI exits0 on unavailable gh and writes no source files", async () => {
  const { mkdtempSync, writeFileSync, readFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os"); const { join } = await import("node:path");
  const { runSummary } = await import("./summary.mjs");
  const root = mkdtempSync(join(tmpdir(), "rad090-pending-")), file = join(root, "status.md");
  const data = { project: "RAD-LAB", format_version: "1.2", revision: 1, updated_at: "2026-11-01T00:00:00Z", timezone: "UTC", next_id: "RAD-002", tasks: [{ id: "RAD-001", title: "Review", status: "review", waiting_on: "owner", priority: "low", description: "Check #50", source_ref: "DECISIONS.md", done_when: "Merged and green" }] };
  const markdown = '<!-- STATUS-DATA:BEGIN -->\n```json\n' + JSON.stringify(data) + '\n```\n<!-- STATUS-DATA:END -->';
  writeFileSync(file, markdown); const output = [], log = console.log;
  try {
    console.log = (text) => output.push(text);
    assert.equal(runSummary(["--pending", "--json"], file, { run: () => { throw Error("unavailable"); } }), 0);
    const result = JSON.parse(output[0]);
    assert.equal(result.tasks[0].done_when, data.tasks[0].done_when);
    assert.equal(result.tasks[0].linked_prs[0].head_ci, "unverified");
    assert.equal(readFileSync(file, "utf8"), markdown);
  } finally { console.log = log; rmSync(root, { recursive: true, force: true }); }
});
