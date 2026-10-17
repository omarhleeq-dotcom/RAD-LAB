import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectContext, runContext } from "./context.mjs";
const sha = "a".repeat(40), head = "b".repeat(40);
function runner({ fail = false, merged = true, origin = "https://github.com/owner/repo.git", base = sha } = {}) {
  const calls = [];
  return { calls, run(command, args) {
    calls.push([command, ...args]);
    if (command === "git") {
      if (args[0] === "branch") return "topic\n";
      if (args[0] === "status") return " M docs/HANDOFF.md\n";
      if (args[0] === "remote") return origin;
      return sha;
    }
    if (fail) throw new Error("SECRET must not be printed");
    return JSON.stringify(args[1].includes("/pulls/") ? { number: 85, merged, state: merged ? "closed" : "open", draft: !merged, head: { sha: head }, base: { ref: "main" }, merged_at: merged ? "2026-10-17T06:10:55Z" : null, merge_commit_sha: merged ? sha : null } : { commit: { sha: base } });
  } };
}
test("default reads local facts only; missing/stale refs are not remote verification", () => {
  const r = runner(); const result = collectContext(r);
  assert.equal(result.remote.verified, false); assert.equal(result.local.branch, "topic");
  assert.ok(r.calls.every(([command]) => command === "git"));
  const missing = collectContext({ run(command, args) { if (args.includes("--verify")) throw new Error(); return args[0] === "branch" ? "" : sha; } });
  assert.equal(missing.local.origin_main, null); assert.equal(missing.local.branch, "(detached HEAD)");
});
test("explicit PR verifies merged and unmerged responses; detects stale local base", () => {
  for (const merged of [true, false]) {
    const r = runner({ merged, base: head }); const result = collectContext({ ...r, pr: 85 });
    assert.equal(result.remote.verified, true); assert.equal(result.remote.merged, merged); assert.equal(result.remote.local_base_matches, false);
    assert.deepEqual(r.calls.filter(([cmd]) => cmd === "gh").map((c) => c[2]), ["repos/owner/repo/pulls/85", "repos/owner/repo/branches/main"]);
  }
  assert.equal(collectContext({ ...runner({ origin: "git@github.com:owner/repo.git" }), pr: 85 }).remote.verified, true);
});
test("failed auth/tool and malformed responses remain unverified without leaking errors", () => {
  const result = collectContext({ ...runner({ fail: true }), pr: 85 });
  assert.equal(result.remote.verified, false); assert.doesNotMatch(JSON.stringify(result), /SECRET/);
  assert.equal(collectContext({ ...runner({ origin: "https://elsewhere.invalid/x/y" }), pr: 85 }).remote.verified, false);
  assert.equal(collectContext({ pr: 85, run(command) { return command === "gh" ? "{}" : "https://github.com/owner/repo.git"; } }).remote.verified, false);
  assert.throws(() => collectContext({ pr: "85;bad" }), /positive integer/);
});
test("CLI rejects incomplete options and fails when requested verification is unavailable", () => {
  assert.throws(() => runContext(["--pr"]), /incomplete/); assert.throws(() => runContext(["--pr", "0"]), /positive integer/);
  const log = console.log; console.log = () => {};
  try { assert.equal(runContext(["--pr", "85"], runner({ fail: true })), 1); } finally { console.log = log; }
});
test("real Git context leaves tracked files, index and refs unchanged", () => {
  const root = mkdtempSync(path.join(tmpdir(), "radlab-context-"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    git("init"); git("config", "user.name", "Test"); git("config", "user.email", "test@example.invalid");
    writeFileSync(path.join(root, "doc.md"), "original"); git("add", "."); git("commit", "-m", "fixture");
    const index = readFileSync(path.join(root, ".git/index")); const refs = git("show-ref");
    const result = collectContext({ root });
    assert.equal(result.remote.verified, false); assert.equal(result.local.working_tree, "");
    assert.equal(readFileSync(path.join(root, "doc.md"), "utf8"), "original");
    assert.deepEqual(readFileSync(path.join(root, ".git/index")), index); assert.equal(git("show-ref"), refs);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
