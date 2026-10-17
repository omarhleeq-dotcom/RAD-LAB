// Read-only view of the existing status JSON; never writes a second state file.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractStatusJson, validateStatus, STATUSES } from "./check-status.mjs";
export function selectTasks(data, { ids = [], statuses = [], query = "", all = false } = {}) {
  const needle = query.toLocaleLowerCase();
  return data.tasks.filter((task) => (!ids.length || ids.includes(task.id)) && (!statuses.length || statuses.includes(task.status)) && (all || ids.length || statuses.length || task.status !== "done") && (!needle || JSON.stringify(task).toLocaleLowerCase().includes(needle)));
}
export function runSummary(args = process.argv.slice(2), filename = fileURLToPath(new URL("../../docs/project-status.md", import.meta.url))) {
  const options = { ids: [], statuses: [] }; let json = false, details = false;
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === "--id" && args[i + 1]) options.ids.push(args[++i]);
    else if (flag === "--status" && args[i + 1]) { const value = args[++i]; if (!STATUSES.includes(value)) throw new Error(`unknown status ${value}`); options.statuses.push(value); }
    else if (flag === "--query" && args[i + 1]) options.query = args[++i];
    else if (flag === "--all") options.all = true;
    else if (flag === "--json") json = true;
    else if (flag === "--details") details = true;
    else if (flag === "--help") { console.log("status:summary [--id RAD-NNN] [--status review] [--query text] [--all] [--details] [--json]; default: open tasks, compact output; no writes"); return 0; }
    else throw new Error(`unknown/incomplete option ${flag}`);
  }
  const markdown = readFileSync(filename, "utf8"), errors = validateStatus(markdown);
  if (errors.length) throw new Error(errors.join("; "));
  const data = JSON.parse(extractStatusJson(markdown).json);
  for (const id of options.ids) if (!data.tasks.some((task) => task.id === id)) throw new Error(`unknown task ${id}`);
  const tasks = selectTasks(data, options);
  if (json) console.log(JSON.stringify({ revision: data.revision, updated_at: data.updated_at, tasks }, null, 2));
  else {
    console.log(`Status revision${data.revision} (${data.updated_at}) — ${tasks.length}/${data.tasks.length} tasks; source docs/project-status.md`);
    for (const task of tasks) {
      console.log(`${task.id} [${task.status}${task.waiting_on ? ` / ${task.waiting_on}` : ""}] ${task.title}`);
      if (details || options.ids.length) console.log(`  ${task.description}\n  Source: ${task.source_ref}${task.completion_evidence ? `\n  Evidence: ${task.completion_evidence}` : ""}${task.blocker ? `\n  Blocker: ${task.blocker}` : ""}${task.defer_reason ? `\n  Deferred: ${task.defer_reason}` : ""}${task.conflict ? `\n  Conflict: ${task.conflict}` : ""}`);
    }
    console.log("Structure validated; descriptions/evidence still need review. Use --id/--details for evidence, --all for history.");
  }
  return 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = runSummary(); } catch (error) { console.error(`status:summary: ${error.message}`); process.exitCode = 1; }
}
