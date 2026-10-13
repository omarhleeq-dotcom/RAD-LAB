// Organisation check for docs/project-status.md (format: docs/status-format.md).
// It checks the STRUCTURE of the status data (valid JSON, unique ids, allowed values, evidence /
// reason fields present). It does NOT prove that a task is really done.
// Usage: node scripts/status/check-status.mjs [path]   (default docs/project-status.md)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const STATUSES = ["planned", "in_progress", "review", "blocked", "deferred", "done"];
export const PRIORITIES = ["high", "medium", "low"];
const REQUIRED_TASK_FIELDS = ["id", "title", "status", "priority", "description", "source_ref"];
const OPTIONAL_TASK_FIELDS = ["completion_evidence", "blocker", "defer_reason", "conflict"];
const META_FIELDS = ["project", "format_version", "revision", "updated_at", "timezone", "next_id", "tasks"];
const BEGIN = "<!-- STATUS-DATA:BEGIN -->";
const END = "<!-- STATUS-DATA:END -->";
const ID_RE = /^RAD-(\d{3,})$/;
// ISO 8601 date-time with an explicit offset (Z or +hh:mm).
const TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const isText = (v) => typeof v === "string" && v.trim().length > 0;

/** Extracts the single JSON block between the STATUS-DATA markers. */
export function extractStatusJson(markdown) {
  const start = markdown.indexOf(BEGIN);
  const end = markdown.indexOf(END);
  if (start < 0 || end < 0 || end < start) return { error: `missing ${BEGIN} ... ${END} markers` };
  if (markdown.indexOf(BEGIN, start + 1) >= 0) return { error: "more than one STATUS-DATA block" };
  const fenced = markdown.slice(start + BEGIN.length, end).match(/```json\s*([\s\S]*?)```/);
  if (!fenced) return { error: "no ```json fenced block between the STATUS-DATA markers" };
  return { json: fenced[1] };
}

/** Returns a list of error strings (empty = organised correctly). */
export function validateStatus(markdown) {
  const errors = [];
  const extracted = extractStatusJson(markdown);
  if (extracted.error) return [extracted.error];
  let data;
  try {
    data = JSON.parse(extracted.json);
  } catch (e) {
    return [`invalid JSON: ${e.message}`];
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) return ["data is not an object"];

  for (const key of Object.keys(data)) if (!META_FIELDS.includes(key)) errors.push(`unknown top-level field "${key}"`);
  for (const key of ["project", "format_version", "timezone"]) {
    if (!isText(data[key])) errors.push(`"${key}" must be a non-empty string`);
  }
  if (!Number.isInteger(data.revision) || data.revision < 1) errors.push('"revision" must be an integer >= 1');
  if (!isText(data.updated_at) || !TIME_RE.test(data.updated_at) || Number.isNaN(Date.parse(data.updated_at))) {
    errors.push('"updated_at" must be an ISO 8601 date-time with an offset (e.g. 2026-10-13T02:40:00Z)');
  }
  const nextMatch = isText(data.next_id) ? ID_RE.exec(data.next_id) : null;
  if (!nextMatch) errors.push('"next_id" must look like RAD-001');
  if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
    errors.push('"tasks" must be a non-empty array');
    return errors;
  }

  const seen = new Set();
  let maxNumber = 0;
  data.tasks.forEach((task, index) => {
    const where = isText(task?.id) ? task.id : `tasks[${index}]`;
    if (task === null || typeof task !== "object" || Array.isArray(task)) {
      errors.push(`${where}: not an object`);
      return;
    }
    for (const key of Object.keys(task)) {
      if (![...REQUIRED_TASK_FIELDS, ...OPTIONAL_TASK_FIELDS].includes(key)) errors.push(`${where}: unknown field "${key}"`);
    }
    for (const key of REQUIRED_TASK_FIELDS) if (!isText(task[key])) errors.push(`${where}: "${key}" is required (non-empty string)`);
    for (const key of OPTIONAL_TASK_FIELDS) {
      if (key in task && !isText(task[key])) errors.push(`${where}: "${key}" must be a non-empty string when present`);
    }
    const idMatch = isText(task.id) ? ID_RE.exec(task.id) : null;
    if (!idMatch) errors.push(`${where}: id must look like RAD-001`);
    else {
      if (seen.has(task.id)) errors.push(`${where}: duplicate id`);
      seen.add(task.id);
      maxNumber = Math.max(maxNumber, Number(idMatch[1]));
    }
    if (!STATUSES.includes(task.status)) errors.push(`${where}: status "${task.status}" not in ${STATUSES.join(", ")}`);
    if (!PRIORITIES.includes(task.priority)) errors.push(`${where}: priority "${task.priority}" not in ${PRIORITIES.join(", ")}`);
    if (task.status === "done" && !isText(task.completion_evidence)) errors.push(`${where}: done needs completion_evidence`);
    if (task.status === "deferred" && !isText(task.defer_reason)) errors.push(`${where}: deferred needs defer_reason`);
    if (task.status === "blocked" && !isText(task.blocker)) errors.push(`${where}: blocked needs blocker`);
    if (task.status !== "done" && isText(task.completion_evidence)) {
      errors.push(`${where}: completion_evidence only belongs to done tasks`);
    }
  });
  // Ids are never reused: every issued id is below next_id, so a new task always takes next_id.
  if (nextMatch && maxNumber >= Number(nextMatch[1])) errors.push(`next_id (${data.next_id}) must be greater than every task id`);
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? "docs/project-status.md";
  const errors = validateStatus(readFileSync(file, "utf8"));
  if (errors.length > 0) {
    console.error(`${file}: ${errors.length} problem(s)`);
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  console.log(`${file}: structure OK (this does not prove any task is really done)`);
}
