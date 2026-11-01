import { execFileSync } from "node:child_process";
const defaultRun = (command, args) => execFileSync(command, args, { encoding: "utf8", timeout: 20000, maxBuffer: 2 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
export function linkedPulls(task) {
  const text = [task.description, task.source_ref, task.completion_evidence, task.done_when].filter(Boolean).join("\n");
  const links = new Map();
  for (const match of text.matchAll(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/([1-9]\d*)|(?<![\w])#([1-9]\d*)\b/g)) {
    const number = Number(match[2] ?? match[3]), repository = match[1];
    links.set(`${repository ?? "origin"}#${number}`, { number, ...(repository ? { repository } : {}) });
  }
  return [...links.values()];
}
export function readPullStates(task, { run = defaultRun, cache = new Map() } = {}) {
  const pulls = linkedPulls(task);
  if (!pulls.length) return [{ state: "unverified", head_ci: "unverified", reason: "no linked PR" }];
  return pulls.map((pull) => {
    const key = `${pull.repository ?? "origin"}#${pull.number}`;
    if (cache.has(key)) return cache.get(key);
    let result = { ...pull, state: "unverified", head_ci: "unverified" };
    try {
      const args = ["pr", "view", String(pull.number), "--json", "number,state,mergedAt,headRefOid,statusCheckRollup"];
      if (pull.repository) args.push("--repo", pull.repository);
      const response = JSON.parse(run("gh", args));
      if (response.number !== pull.number || !["OPEN", "CLOSED", "MERGED"].includes(response.state) || !/^[a-f\d]{40}$/.test(response.headRefOid ?? "") || !Array.isArray(response.statusCheckRollup)) throw new Error("invalid PR response");
      if (response.state === "MERGED" && !Number.isFinite(Date.parse(response.mergedAt))) throw new Error("invalid merge response");
      const checks = response.statusCheckRollup;
      const outcomes = checks.map((check) => check.__typename === "StatusContext" ? (check.state === "SUCCESS" ? "SUCCESS" : ["ERROR", "FAILURE"].includes(check.state) ? "FAILURE" : "PENDING") : check.status !== "COMPLETED" ? "PENDING" : check.conclusion);
      const head_ci = !outcomes.length ? "unverified" : outcomes.some((value) => ["FAILURE", "CANCELLED", "TIMED_OUT", "ACTION_REQUIRED", "STARTUP_FAILURE"].includes(value)) ? "failure" : outcomes.includes("PENDING") ? "pending" : outcomes.every((value) => value === "SUCCESS") ? "success" : "unverified";
      result = { ...pull, state: response.state.toLowerCase(), head: response.headRefOid, head_ci };
    } catch { /* Provider errors may contain credentials; never echo stderr. */ }
    cache.set(key, result); return result;
  });
}
