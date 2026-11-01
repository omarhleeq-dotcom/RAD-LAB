import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { planSync, runSync, syncRevision, pendingPointer, PENDING_POINTER } from "./sync.mjs";
import { relocateLinks, targetSpans } from "./link-targets.mjs";
import { runCli } from "./check-docs.mjs";
import { BUDGETS } from "./budgets.mjs";
const task = { id: "RAD-001", title: "Completed tooling", status: "review", priority: "low", description: "Await acceptance", source_ref: "docs/a.md", waiting_on: "owner", done_when: "Merged and green" };
const data = { project: "RAD-LAB", format_version: "1.2", revision: 1, updated_at: "2026-11-01T00:00:00Z", timezone: "UTC", next_id: "RAD-002", tasks: [task] };
const markdown = (d) => '<!-- STATUS-DATA:BEGIN -->\n```json\n' + JSON.stringify(d, null, 2) + '\n```\n<!-- STATUS-DATA:END -->\n';
function fixture(run) {
  const root = mkdtempSync(path.join(tmpdir(), "rad090-sync-"));
  const write = (name, value) => { mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); writeFileSync(path.join(root, name), value); };
  const read = (name) => readFileSync(path.join(root, name), "utf8");
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
  try {
    git("init", "--initial-branch=main"); git("config", "user.name", "Test Author"); git("config", "user.email", "test@example.invalid");
    write("docs/project-status.md", markdown(structuredClone(data)));
    write("docs/archive/status-archive.md", "# Archive\n");
    write("docs/archive/reports/2026-11/old_2026-11-01.md", "# Old report\n");
    write("docs/HANDOFF.md", "# Handoff\n\n## Pending closures\n\n" + PENDING_POINTER + "\n\n");
    write("docs/a.md", '[image](picture.png#pixel "title") [self](a.md#ok)\n\n# Ok\n');
    write("docs/picture.png", "image bytes"); write("docs/other.md", "[doc](a.md#ok)\n");
    write("docs/DECISIONS.md", "# Rules\n"); write("docs/budgets.json", JSON.stringify(BUDGETS));
    write("src/immutable.md", "[not documentation](../docs/a.md)");
    git("add", "."); git("commit", "-m", "Fixture baseline");
    runSync(["--base", "main"], { root });
    git("add", "."); git("commit", "-m", "Generated baseline");
    return run({ root, git, write, read });
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test("link destinations preserve labels, balanced/angle URLs, fragments, HTML, references, code and comments", () => {
  const original = '[label](a(b).md#id "title") ![image](<image (1).png>)\n[a.md]: a(b).md#id\n<img src="image (1).png">\n`[code](a(b).md)`\n```md\n[code](a(b).md)\n```\n<!-- [comment](a(b).md) -->\n';
  const moves = new Map([["docs/a(b).md", "docs/archive/a(b).md"]]);
  const result = relocateLinks(original, "docs/x.md", moves);
  assert.ok(result.includes('[label](archive/a(b).md#id "title")'));
  assert.ok(result.includes('[a.md]: archive/a(b).md#id'));
  const strip = (text) => { for (const [a, b] of targetSpans(text).reverse()) text = text.slice(0, a) + text.slice(b); return text; };
  assert.equal(strip(result), strip(original));
  assert.equal(relocateLinks(result, "docs/x.md", moves), result);
  const moved = relocateLinks(original, "docs/archive/x.md", moves, { old: "docs/x.md", previous: original });
  assert.ok(moved.includes('<../image%20(1).png>'));
  assert.equal(relocateLinks(moved, "docs/archive/x.md", moves, { old: "docs/x.md", previous: original }), moved);
});
test("revision changes exactly once for stale task metadata, preserves existing higher revisions and needs a real base", () => {
  const previous = structuredClone(data), next = structuredClone(data); next.tasks[0].description = "Different";
  syncRevision(next, previous, () => new Date("2026-11-02T00:00:00Z")); assert.equal(next.revision, 2);
  const first = structuredClone(next); syncRevision(next, previous); assert.deepEqual(next, first);
  const unchanged = structuredClone(data); syncRevision(unchanged, data); assert.deepEqual(unchanged, data);
  fixture(({ root }) => assert.throws(() => planSync({ root, base: "missing" })));
});
test("git mv repairs inbound and moved-file links/source_ref; repeated sync is empty and product docs untouched", () => fixture(({ root, git, read }) => {
  git("mv", "docs/a.md", "docs/archive/reports/2026-11/a.md");
  const before = read("src/immutable.md");
  const plan = planSync({ root, base: "main" });
  assert.match(plan.get("docs/other.md"), /reports\/2026-11\/a.md#ok/);
  assert.match(plan.get("docs/archive/reports/2026-11/a.md"), /\.\.\/\.\.\/\.\.\/picture.png#pixel/);
  runSync(["--base", "main"], { root });
  assert.match(read("docs/project-status.md"), /"source_ref": "docs\/archive\/reports\/2026-11\/a.md"/);
  assert.equal(read("src/immutable.md"), before);
  assert.equal(planSync({ root, base: "main" }).size, 0);
}));
test("M2 archives verbatim and updates only permitted task fields, then remains idempotent", () => fixture(({ root, write, read }) => {
  const next = structuredClone(data), t = next.tasks[0]; t.status = "done"; delete t.waiting_on;
  t.description = "Full original " + "ع".repeat(200); t.completion_evidence = "#50 merged; evidence is immutable";
  write("docs/project-status.md", markdown(next));
  const evidence = t.completion_evidence, original = t.description;
  runSync(["--base", "main"], { root });
  const updated = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(read("docs/project-status.md"))[1]);
  assert.equal(updated.tasks[0].completion_evidence, evidence);
  assert.equal(updated.tasks[0].status, "done"); assert.equal(updated.tasks[0].id, t.id);
  assert.ok(read("docs/archive/status-archive.md").includes(original));
  assert.equal(planSync({ root, base: "main" }).size, 0);
}));
test("check mode writes nothing; docs:check gives the exact sync remedy; index and pointer drift repaired", () => fixture(({ root, write, read }) => {
  write("docs/archive/reports/README.md", "stale index");
  write("docs/HANDOFF.md", "# Handoff\n\n## Pending closures\n\n");
  const before = read("docs/archive/reports/README.md"), logs = [], error = console.error, log = console.log, warn = console.warn;
  try {
    console.error = console.log = console.warn = (value) => logs.push(value);
    assert.equal(runSync(["--base", "main", "--check"], { root }), 1);
    assert.equal(read("docs/archive/reports/README.md"), before);
    assert.equal(runCli(["--base", "main"], root), 1);
    assert.ok(logs.some((line) => line.includes("run npm run docs:sync")));
    runSync(["--base", "main"], { root });
    assert.equal(planSync({ root, base: "main" }).size, 0);
    assert.match(read("docs/HANDOFF.md"), /status:summary -- --pending/);
  } finally { console.error = error; console.log = log; console.warn = warn; }
}));
test("sync refuses to remove unexpected HANDOFF prose or traverse symlinked documentation", () => {
  assert.throws(() => pendingPointer("## Pending closures\n\nOwner narrative\n"), /contains prose/);
  fixture(({ root }) => {
    symlinkSync("a.md", path.join(root, "docs/symlink.md"));
    assert.throws(() => planSync({ root, base: "main" }), /symlink/);
  });
});

test("cap changes need a new owner decision; new sections are capped even without an explicit --base", () => fixture(({ root, write, read }) => {
  const caps = structuredClone(BUDGETS); caps.agents.lines++;
  write("docs/budgets.json", JSON.stringify(caps));
  const output = [], error = console.error, log = console.log, warn = console.warn;
  try {
    console.error = console.log = console.warn = (line) => output.push(line);
    runCli(["--base", "main"], root);
    assert.ok(output.some((line) => line.includes("budget changes require a new owner decision")));
    output.length = 0;
    write("docs/DECISIONS.md", read("docs/DECISIONS.md") + "\n## Owner cap decision\nOwner approved a budget change.\n");
    runCli(["--base", "main"], root);
    assert.ok(!output.some((line) => line.includes("budget changes require")));
    output.length = 0;
    write("docs/DECISIONS.md", "# Rules\n\n## New long decision\n" + "line\n".repeat(BUDGETS.decision_section.lines + 1));
    const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" });
    git("update-ref", "refs/remotes/origin/main", "main");
    runCli([], root);
    assert.ok(output.some((line) => line.includes("New long decision") && line.includes("exceeds budget")));
  } finally { console.error = error; console.log = log; console.warn = warn; }
}));
