import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkDocs, parseMarkdown, decisionIds, headingSlug, runCli, consistencyWarnings, handoffErrors } from "./check-docs.mjs";
function fixture(files, run) {
  const root = mkdtempSync(path.join(tmpdir(), "radlab-docs-"));
  try {
    for (const [name, text] of Object.entries(files)) { mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); writeFileSync(path.join(root, name), text); }
    return run({ root, files: Object.keys(files).filter((name) => name.endsWith(".md")), enforceContracts: false });
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test("Arabic headings, duplicate slugs and explicit anchors resolve", () => {
  fixture({ "README.md": "[AR](docs/a.md#مراجعة-الحالة) [second](docs/a.md#intro-1) [id](docs/a.md#stable)", "docs/a.md": '# مراجعة الحالة\n## Intro\n## Intro\n<a id="stable"></a>' }, (args) => assert.deepEqual(checkDocs(args).errors, []));
  assert.equal(headingSlug("**Image** / `Rule`"), "image--rule");
});
test("reports broken paths AND anchors and URL escapes", () => {
  fixture({ "README.md": "[bad](gone.md) [anchor](a.md#gone) [escape](%XX.md)", "a.md": "# Present" }, (args) => {
    const errors = checkDocs(args).errors.join("\n"); assert.match(errors, /missing local target/); assert.match(errors, /missing anchor/); assert.match(errors, /invalid URL escape/);
  });
});
test("image, HTML and reference-style destinations checked; external URLs ignored", () => {
  fixture({ "README.md": '![img](images/a.png)\n<a href="a.md#ok">ok</a>\n[x][doc]\n[doc]: a.md#ok\n[https](https://example.invalid)\n', "a.md": '# Ok', "images/a.png": "fixture" }, (args) => assert.deepEqual(checkDocs(args).errors, []));
  assert.match(parseMarkdown("[x][unknown]").errors.join(), /undefined reference/);
});
test("balanced/angle destinations with titles and root-relative paths", () => {
  fixture({ "README.md": '[x](docs/a(b).md "Title") [space](<docs/a b.md>) [root](/docs/a(b).md)', "docs/a(b).md": "# A", "docs/a b.md": "# B" }, (args) => assert.deepEqual(checkDocs(args).errors, []));
});
test("code fences, inline code and comments are not links; unclosed blocks fail", () => {
  const parsed = parseMarkdown('```md\n[bad](gone.md)\n```\n`[bad](gone.md)`\n<!-- [bad](gone.md) -->');
  assert.deepEqual(parsed.links, []); assert.deepEqual(parsed.errors, []);
  assert.match(parseMarkdown("~~~~md\n```\n").errors.join(), /unclosed code fence/);
  assert.match(parseMarkdown("<!-- still open").errors.join(), /unclosed HTML comment/);
});
test("table shape, escaped pipes, orphan blocks and header mismatch", () => {
  assert.deepEqual(parseMarkdown('| A | B |\n|---|---|\n| `x\\|y` | z |').errors, []);
  assert.match(parseMarkdown('|A|B|\n|---|---|\n|only|').errors.join(), /expected 2/);
  assert.match(parseMarkdown('|orphan|row|').errors.join(), /without header/);
  assert.match(parseMarkdown('|A|B|\n|---|---|---|').errors.join(), /separator differs/);
});
test("fenced gaps cannot silently continue an earlier table", () => {
  assert.match(parseMarkdown('|A|B|\n|---|---|\n```\ncode\n```\n|a|b|').errors.join(), /without header/);
});
test("preserves IDs across current and historical ledgers; removal fails", () => {
  const previousDecisionIds = new Set(["D1", "S10b-25", "O92"]);
  fixture({ "docs/DECISIONS.md": '| ID | Rule |\n|---|---|\n| `D1` | now |', "docs/archive/decisions/old.md": '| ID | Rule |\n|---|---|\n| **S10b-25** | old |\n| **O92** | snapshot |\n| **O92** | later snapshot |' }, (args) => {
    assert.deepEqual(checkDocs({ ...args, previousDecisionIds }).errors, []);
    assert.match(checkDocs({ ...args, previousDecisionIds: new Set(["O999"]) }).errors.join(), /identifier lost: O999/);
  });
  assert.deepEqual([...decisionIds("text O777\n| **D1** | data |")], ["D1"]);
});
test("duplicate live declarations fail; historical duplicate questions are allowed", () => {
  fixture({ "docs/DECISIONS.md": '| ID | Rule |\n|---|---|\n| `O92` | first |\n| `O92` | second |' }, (args) => assert.match(checkDocs(args).errors.join(), /duplicate current declaration O92/));
});
test("missing compatibility pointers and workflow entry points fail", () => {
  fixture({ "README.md": "# Empty" }, (args) => {
    const errors = checkDocs({ ...args, enforceContracts: true }).errors.join(); assert.match(errors, /compatibility pointer/); assert.match(errors, /missing workflow entry/);
  });
});
test("repository path escape is rejected and CLI rejects incomplete flags", () => {
  fixture({ "README.md": "[escape](../../outside.md)" }, (args) => assert.match(checkDocs(args).errors.join(), /escapes repository/));
  assert.throws(() => runCli(["--base"]), /incomplete/);
});
function statusDoc(source_ref) {
  return '<!-- STATUS-DATA:BEGIN -->\n```json\n' + JSON.stringify({ project: "RAD-LAB", format_version: "1.1", revision: 1, updated_at: "2026-10-16T00:00:00Z", timezone: "UTC", next_id: "RAD-002", tasks: [{ id: "RAD-001", title: "Review", status: "review", priority: "low", description: "Needs evidence", source_ref, waiting_on: "owner" }] }) + '\n```\n<!-- STATUS-DATA:END -->';
}
test("source_ref resolves repository paths, bare doc names and root instructions", () => {
  fixture({ "docs/project-status.md": statusDoc("AGENTS.md؛ docs/a.md#ok؛ a.md؛ DECISIONS.md S14.1c؛ O95"), "AGENTS.md": "# Rules", "docs/a.md": "# Ok", "docs/DECISIONS.md": "| ID | Rule |\n|---|---|\n| **S14.1c-1** | rule |\n\nOpen: **O95** — declared in prose." }, (args) => assert.deepEqual(checkDocs(args).errors, []));
});
test("missing source path and unknown decision in source_ref fail independently", () => {
  fixture({ "docs/project-status.md": statusDoc("docs/missing.md؛ DECISIONS.md O999"), "docs/DECISIONS.md": "# Decisions" }, (args) => {
    const errors = checkDocs(args).errors.join(); assert.match(errors, /missing local target \/docs\/missing.md/); assert.match(errors, /unknown source_ref decision O999/);
  });
});
test("oversized copied CLAUDE instructions and invalid state do not pass", () => {
  fixture({ "CLAUDE.md": "[workflow](AGENTS.md)\n" + "copy\n".repeat(20), "AGENTS.md": "# Guide", "docs/project-status.md": "bad" }, (args) => {
    const errors = checkDocs({ ...args, enforceContracts: true }).errors.join(); assert.match(errors, /short pointer/); assert.match(errors, /STATUS-DATA/);
  });
});

test("closed-task contradictions warn without silently changing or rejecting task state", () => {
  const tasks = [
    { id: "RAD-052", status: "done", description: "المتبقي: تحقق المالك على الهاتف" },
    { id: "RAD-054", status: "done", description: "فحص الهاتف يبقى مفتوحًا" },
    { id: "RAD-003", status: "done", description: "Still pending phone review" },
    { id: "RAD-004", status: "review", description: "المتبقي: المراجعة" },
    { id: "RAD-005", status: "done", description: "اكتملت مراجعة الهاتف؛ نطاق آخر في RAD-057" },
  ];
  const original = JSON.stringify(tasks);
  assert.deepEqual(consistencyWarnings(tasks).map((w) => w.split(":")[0]), ["RAD-052", "RAD-054", "RAD-003"]);
  assert.equal(JSON.stringify(tasks), original);
  fixture({ "docs/project-status.md": statusDoc("docs/a.md").replace('"status":"review"', '"status":"done"').replace('"waiting_on":"owner"', '"completion_evidence":"owner confirmed"').replace('Needs evidence', 'المتبقي فحص الهاتف'), "docs/a.md": "# A" }, (args) => {
    const result = checkDocs(args); assert.deepEqual(result.errors, []); assert.equal(result.warnings.length, 1);
  });
});
test("handoff rejects copied volatile facts but permits evidence links and continuation", () => {
  for (const text of ["main عند `4db9b3f`", "فرع العمل topic", "الحالة revision 86", "Draft PR واحد، دمجه يدوي عند المالك"]) assert.equal(handoffErrors(text).length, 1);
  assert.deepEqual(handoffErrors("ابدأ بـ docs:context؛ [التقرير](report.md). المتابعة: مراجعة المهمة المطلوبة."), []);
});
