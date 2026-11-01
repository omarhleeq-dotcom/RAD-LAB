import test from "node:test";
import assert from "node:assert/strict";
import { BUDGETS, checkBudgets, decisionSections } from "./budgets.mjs";
import { archiveDone } from "./archive-status.mjs";
test("single budget source: exact cap passes, 80% warns and above fails", () => {
  const filename = "AGENTS.md", cap = BUDGETS.agents.lines;
  assert.equal(checkBudgets([[filename, "line\n".repeat(Math.ceil(cap * 0.8) - 1)]]).warnings.length, 0);
  assert.equal(checkBudgets([[filename, "line\n".repeat(cap)]]).warnings.length, 1);
  assert.equal(checkBudgets([[filename, "line\n".repeat(cap + 1)]]).errors.length, 1);
  const text = "ع".repeat(BUDGETS.handoff.line_chars + 1);
  assert.match(checkBudgets([["docs/HANDOFF.md", text]]).errors.join(), /longest line/);
});
test("dated report cutoff and new report exception preserve old reports", () => {
  const text = "line\n".repeat(BUDGETS.dated_report.lines + 1);
  assert.equal(checkBudgets([["docs/old_2026-11-01.md", text]]).errors.length, 0);
  assert.equal(checkBudgets([["docs/new_2026-11-02.md", text]]).errors.length, 1);
  assert.equal(checkBudgets([["docs/new_2026-11-01.md", text]], { newFiles: new Set(["docs/new_2026-11-01.md"]) }).errors.length, 1);
});
test("all newly added DECISIONS sections are capped, including the rules index", () => {
  const previousDecisions = "## Old\n" + "old\n".repeat(30), long = "line\n".repeat(BUDGETS.decision_section.lines + 1);
  const text = previousDecisions + "## Current rules\n" + long + "## New\n" + long;
  assert.equal(checkBudgets([["docs/DECISIONS.md", text]], { previousDecisions }).errors.length, 2);
  assert.equal(decisionSections(text).length, 3);
});
test("M2 keeps original descriptions verbatim, evidence/status/ids unchanged, and is idempotent", () => {
  const original = { id: "RAD-001", title: "تنفيذ الفحص", status: "done", description: "النص الكامل `دليل` " + "ع".repeat(180), completion_evidence: "#50 merged", source_ref: "DECISIONS.md" };
  const open = { ...original, id: "RAD-002", status: "review" };
  const result = archiveDone([original, open], "# Archive\n");
  assert.ok(result.archive.includes(original.description));
  assert.equal(result.tasks[0].completion_evidence, original.completion_evidence);
  assert.equal(result.tasks[0].status, original.status); assert.equal(result.tasks[0].id, original.id);
  assert.ok([...result.tasks[0].description].length <= BUDGETS.task_description.done);
  assert.deepEqual(result.tasks[1], open);
  assert.deepEqual(archiveDone(result.tasks, result.archive), result);
  assert.equal(original.description.length > 160, true);
});

test("a new nested decision section cannot bypass the line cap inside an old section", () => {
  const previousDecisions = "## Old\nOld rule.\n";
  const text = previousDecisions + "#### New subrule\n" + "line\n".repeat(BUDGETS.decision_section.lines);
  assert.equal(checkBudgets([["docs/DECISIONS.md", text]], { previousDecisions }).errors.length, 1);
});
