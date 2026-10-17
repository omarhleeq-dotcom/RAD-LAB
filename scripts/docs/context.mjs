// Read-only session facts. No fetch, checkout, file writes or automatic network calls.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export function collectContext({ root = ROOT, pr, run = (command, args) => execFileSync(command, args, {
  cwd: root, encoding: "utf8", timeout: 20000, maxBuffer: 1024 * 1024,
  env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" }, stdio: ["ignore", "pipe", "pipe"],
}) } = {}) {
  const git = (...args) => run("git", args).trimEnd();
  const result = { local: { branch: git("branch", "--show-current") || "(detached HEAD)", head: git("rev-parse", "HEAD"), working_tree: git("status", "--short") }, remote: { verified: false, reason: "Not requested; local refs may be stale. Use --pr NUMBER or the connected GitHub read tool." } };
  try { result.local.origin_main = git("rev-parse", "--verify", "refs/remotes/origin/main"); }
  catch { result.local.origin_main = null; }
  if (pr !== undefined) {
    if (!/^[1-9]\d*$/.test(String(pr))) throw new Error("--pr requires a positive integer");
    try {
      const origin = git("remote", "get-url", "origin");
      const match = origin.match(/^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/);
      if (!match) throw new Error("unsupported origin");
      const repo = match[1];
      const pull = JSON.parse(run("gh", ["api", `repos/${repo}/pulls/${pr}`]));
      if (pull.number !== Number(pr) || typeof pull.merged !== "boolean" || typeof pull.draft !== "boolean" || !["open", "closed"].includes(pull.state) || !/^[\w./-]+$/.test(pull.base?.ref ?? "") || !/^[a-f0-9]{40}$/.test(pull.head?.sha ?? "")) throw new Error("invalid PR response");
      if (pull.merged && (!/^[a-f0-9]{40}$/.test(pull.merge_commit_sha ?? "") || !Number.isFinite(Date.parse(pull.merged_at)))) throw new Error("invalid merge evidence");
      const base = JSON.parse(run("gh", ["api", `repos/${repo}/branches/${encodeURIComponent(pull.base.ref)}`]));
      if (!/^[a-f0-9]{40}$/.test(base.commit?.sha ?? "")) throw new Error("invalid branch response");
      result.remote = { verified: true, checked_at: new Date().toISOString(), repository: repo, pr: pull.number, state: pull.state, draft: pull.draft, merged: pull.merged, merged_at: pull.merged_at, merge_commit: pull.merge_commit_sha, pr_head: pull.head.sha, base: pull.base.ref, base_head: base.commit.sha, local_base_matches: pull.base.ref === "main" ? result.local.origin_main === base.commit.sha : null };
    } catch {
      // Do not echo command stderr: credential/provider errors can contain sensitive details.
      result.remote = { verified: false, reason: "GitHub status NOT VERIFIED: gh unavailable, access failed, or response invalid. Use the connected GitHub read tool; do not infer merge/deployment from local refs." };
    }
  }
  return result;
}
export function runContext(args = process.argv.slice(2), options = {}) {
  let pr;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pr" && args[i + 1] && pr === undefined) pr = args[++i];
    else if (args[i] === "--help") { console.log("docs:context [--pr NUMBER] — JSON; local Git read only; optional GitHub GET via existing gh; no fetch, file writes, deployment or phone verification"); return 0; }
    else throw new Error(`unknown/incomplete option ${args[i]}`);
  }
  if (pr !== undefined && !/^[1-9]\d*$/.test(pr)) throw new Error("--pr requires a positive integer");
  const result = collectContext({ ...options, pr });
  console.log(JSON.stringify(result, null, 2));
  return pr !== undefined && !result.remote.verified ? 1 : 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = runContext(); } catch { console.error("docs:context: invalid arguments or local Git unavailable; use --help. No remote facts assumed."); process.exitCode = 1; }
}
