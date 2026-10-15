// Organisation check for docs/project-status.md (format: docs/status-format.md).
// It checks the STRUCTURE of the status data (valid JSON, unique ids, allowed values, evidence /
// reason fields present). It does NOT prove that a task is really done.
// Usage: node scripts/status/check-status.mjs [path] [--base <git-ref> [--head <rev>] | --previous <file>] [--require-previous]
//   (default path docs/project-status.md). With --base / --previous it also checks the TRANSITION from the
//   previous status (ids never deleted or reused, next_id / revision never go back, data change bumps revision
//   and time). The transition check protects id continuity only; it cannot prove a task description or its
//   completion evidence is correct.
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const STATUSES = ["planned", "in_progress", "review", "blocked", "deferred", "done"];
export const PRIORITIES = ["high", "medium", "low"];
const REQUIRED_TASK_FIELDS = ["id", "title", "status", "priority", "description", "source_ref"];
const OPTIONAL_TASK_FIELDS = ["completion_evidence", "blocker", "defer_reason", "conflict"];
// Format 1.1 (S-STD-4, docs/status-format.md §3.1): who the task waits for, and size caps so the live file stays short. Format 1.0 files are
// still accepted unchanged (no waiting_on, no caps); the new rules apply only when format_version is "1.1".
export const FORMAT_VERSIONS = ["1.0", "1.1"];
export const WAITING_ON = ["owner", "reviewer", "code", "external"];
export const NEEDS_WAITING_ON = ["planned", "in_progress", "review", "blocked"];
export const DESCRIPTION_MAX = 350;
export const EVIDENCE_MAX = 400;
export const HANDOFF_MAX_LINES = 80;
const META_FIELDS = ["project", "format_version", "revision", "updated_at", "timezone", "next_id", "tasks"];
const BEGIN = "<!-- STATUS-DATA:BEGIN -->";
const END = "<!-- STATUS-DATA:END -->";
const ID_RE = /^RAD-(\d{3,})$/;
// ISO 8601 date-time with an explicit offset (Z or +hh:mm).
const TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const isText = (v) => typeof v === "string" && v.trim().length > 0;
const charLength = (v) => [...v].length; // code points, so Arabic text and emoji count as written

const countOf = (text, needle) => text.split(needle).length - 1;

/**
 * Extracts the single JSON block between the STATUS-DATA markers. Exactly one BEGIN and one END marker (in that
 * order) and, between them, exactly one ```json fenced block; only blank lines may surround it. Summary and history
 * outside the markers are not looked at.
 */
export function extractStatusJson(markdown) {
  const begins = countOf(markdown, BEGIN);
  const ends = countOf(markdown, END);
  if (begins === 0 || ends === 0) return { error: `missing ${BEGIN} ... ${END} markers` };
  if (begins > 1) return { error: `more than one ${BEGIN} marker (${begins})` };
  if (ends > 1) return { error: `more than one ${END} marker (${ends})` };
  const start = markdown.indexOf(BEGIN);
  const end = markdown.indexOf(END);
  if (end < start) return { error: `${END} comes before ${BEGIN}` };
  const lines = markdown.slice(start + BEGIN.length, end).split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (i === lines.length) return { error: "no ```json fenced block between the STATUS-DATA markers" };
  if (lines[i].trim() !== "```json") return { error: "unexpected content before the ```json block inside the STATUS-DATA markers" };
  const body = [];
  i++;
  while (i < lines.length && lines[i].trim() !== "```") body.push(lines[i++]);
  if (i === lines.length) return { error: "the ```json block between the STATUS-DATA markers is not closed" };
  for (i++; i < lines.length; i++) {
    if (lines[i].trim() !== "") {
      return { error: "extra content after the JSON block inside the STATUS-DATA markers (a second block or text)" };
    }
  }
  return { json: body.join("\n") };
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
  if (isText(data.format_version) && !FORMAT_VERSIONS.includes(data.format_version)) {
    errors.push(`"format_version" "${data.format_version}" not in ${FORMAT_VERSIONS.join(", ")}`);
  }
  const v11 = data.format_version === "1.1";
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
    const allowed = [...REQUIRED_TASK_FIELDS, ...OPTIONAL_TASK_FIELDS, ...(v11 ? ["waiting_on"] : [])];
    for (const key of Object.keys(task)) {
      if (!allowed.includes(key)) errors.push(`${where}: unknown field "${key}"`);
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
    if (v11) {
      if (NEEDS_WAITING_ON.includes(task.status) && !WAITING_ON.includes(task.waiting_on)) {
        errors.push(`${where}: ${task.status} needs waiting_on (${WAITING_ON.join(" | ")})`);
      }
      if ("waiting_on" in task && task.status === "done") errors.push(`${where}: a done task does not wait for anyone (remove waiting_on)`);
      if ("waiting_on" in task && !WAITING_ON.includes(task.waiting_on) && !NEEDS_WAITING_ON.includes(task.status)) {
        errors.push(`${where}: waiting_on "${task.waiting_on}" not in ${WAITING_ON.join(", ")}`);
      }
      if (isText(task.description) && charLength(task.description) > DESCRIPTION_MAX) {
        errors.push(`${where}: description is ${charLength(task.description)} characters (max ${DESCRIPTION_MAX}); keep the remaining work here and the story in the session record`);
      }
      if (isText(task.completion_evidence) && charLength(task.completion_evidence) > EVIDENCE_MAX) {
        errors.push(`${where}: completion_evidence is ${charLength(task.completion_evidence)} characters (max ${EVIDENCE_MAX}); link the evidence instead of retelling it`);
      }
    }
  });
  // Ids are never reused: every issued id is below next_id, so a new task always takes next_id.
  if (nextMatch && maxNumber >= Number(nextMatch[1])) errors.push(`next_id (${data.next_id}) must be greater than every task id`);
  return errors;
}

const numberOf = (id) => Number(ID_RE.exec(id)[1]);
const canonical = (value) =>
  JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]]))
      : v,
  );

/** Reads the minimum a transition check needs; returns { data } or { error }. Does not run the full structure check. */
function readForTransition(markdown, label) {
  const extracted = extractStatusJson(markdown);
  if (extracted.error) return { error: `${label} status: ${extracted.error}` };
  let data;
  try {
    data = JSON.parse(extracted.json);
  } catch (e) {
    return { error: `${label} status: invalid JSON: ${e.message}` };
  }
  const ok =
    data &&
    typeof data === "object" &&
    Number.isInteger(data.revision) &&
    isText(data.next_id) &&
    ID_RE.test(data.next_id) &&
    isText(data.updated_at) &&
    !Number.isNaN(Date.parse(data.updated_at)) &&
    Array.isArray(data.tasks) &&
    data.tasks.every((t) => t && isText(t.id) && ID_RE.test(t.id));
  return ok ? { data } : { error: `${label} status: revision, next_id, updated_at or task ids are unreadable` };
}

/**
 * Compares the previous status with the new one and returns a list of error strings (empty = a valid transition).
 * Checks id continuity and revision bookkeeping only; titles may change freely (a title change is not id reuse).
 */
export function compareStatus(previousMarkdown, nextMarkdown) {
  const prev = readForTransition(previousMarkdown, "previous");
  const next = readForTransition(nextMarkdown, "new");
  const errors = [prev.error, next.error].filter(Boolean);
  if (errors.length > 0) return errors;
  const p = prev.data;
  const n = next.data;

  const prevById = new Map(p.tasks.map((t) => [t.id, t]));
  const nextById = new Map(n.tasks.map((t) => [t.id, t]));
  for (const id of prevById.keys()) if (!nextById.has(id)) errors.push(`${id}: task deleted (ids are never removed; change its status instead)`);

  if (numberOf(n.next_id) < numberOf(p.next_id)) errors.push(`next_id went back (${p.next_id} -> ${n.next_id})`);
  if (n.revision < p.revision) errors.push(`revision went back (${p.revision} -> ${n.revision})`);
  const prevTime = Date.parse(p.updated_at);
  const nextTime = Date.parse(n.updated_at);
  if (nextTime < prevTime) errors.push(`updated_at went back (${p.updated_at} -> ${n.updated_at})`);

  for (const id of nextById.keys()) {
    if (!prevById.has(id) && numberOf(id) < numberOf(p.next_id)) {
      errors.push(`${id}: new task uses a number below the previous next_id (${p.next_id}); a new task must take next_id or later`);
    }
  }

  const changed =
    n.next_id !== p.next_id ||
    prevById.size !== nextById.size ||
    [...nextById].some(([id, task]) => !prevById.has(id) || canonical(task) !== canonical(prevById.get(id)));
  if (changed) {
    if (!(n.revision > p.revision)) errors.push(`tasks or next_id changed but revision was not increased (${p.revision} -> ${n.revision})`);
    if (!(nextTime > prevTime)) errors.push(`tasks or next_id changed but updated_at was not updated (${p.updated_at} -> ${n.updated_at})`);
  }
  return errors;
}

/**
 * Reads the status file as it was at the fork point of <head> (default HEAD) from <ref> (git merge-base). Returns
 * { markdown } | { absent: true } (the file does not exist there: initial setup) | { error } (never silent).
 */
export function readPreviousFromGit(ref, file, cwd = process.cwd(), head = "HEAD") {
  const git = (args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  let base;
  try {
    base = git(["merge-base", ref, head]).trim();
  } catch (e) {
    return { error: `cannot determine the fork point of ${head} from "${ref}" (shallow clone? fetch with full history): ${String(e.stderr || e.message).trim()}` };
  }
  const rel = path.relative(cwd, path.resolve(cwd, file)).split(path.sep).join("/");
  try {
    if (git(["ls-tree", "--name-only", base, "--", rel]).trim() === "") return { absent: true, base };
    return { markdown: git(["show", `${base}:./${rel}`]), base };
  } catch (e) {
    return { error: `cannot read ${rel} at ${base.slice(0, 7)}: ${String(e.stderr || e.message).trim()}` };
  }
}

/** Ids of tasks that carry an unresolved `conflict` note (reported as a notice on every run, never an error). */
export function openConflicts(markdown) {
  const extracted = extractStatusJson(markdown);
  if (extracted.error) return [];
  try {
    const data = JSON.parse(extracted.json);
    return Array.isArray(data.tasks) ? data.tasks.filter((t) => t && isText(t.conflict) && t.status !== "done").map((t) => t.id) : [];
  } catch {
    return [];
  }
}

/** The handoff summary next to the status file must stay a summary: more than HANDOFF_MAX_LINES lines is an error. */
export function handoffProblem(statusFile) {
  const handoff = path.join(path.dirname(path.resolve(statusFile)), "HANDOFF.md");
  if (!existsSync(handoff)) return null;
  const lines = readFileSync(handoff, "utf8").split(/\r?\n/).length;
  return lines > HANDOFF_MAX_LINES ? `HANDOFF.md has ${lines} lines (max ${HANDOFF_MAX_LINES}); keep it a summary and move history to docs/archive/` : null;
}

/** Full check for the CLI / CI: structure, then (when a previous version is given) the transition. */
export function checkStatusFile(file, { base, head, previousFile, requirePrevious = false, cwd = process.cwd() } = {}) {
  const errors = [];
  const notes = [];
  let markdown;
  try {
    markdown = readFileSync(file, "utf8");
  } catch (e) {
    return { errors: [`cannot read ${file}: ${e.message}`], notes };
  }
  errors.push(...validateStatus(markdown));
  const tooLong = handoffProblem(file);
  if (tooLong) errors.push(tooLong);
  const conflicts = openConflicts(markdown);
  if (conflicts.length > 0) notes.push(`open source conflicts to settle: ${conflicts.join(", ")}`);

  let previous;
  if (previousFile) {
    try {
      previous = { markdown: readFileSync(previousFile, "utf8") };
    } catch (e) {
      previous = { error: `cannot read previous file ${previousFile}: ${e.message}` };
    }
  } else if (base) {
    previous = readPreviousFromGit(base, file, cwd, head);
  }

  if (!previous) {
    notes.push("transition check NOT run (no --base / --previous): structure only");
  } else if (previous.error) {
    errors.push(previous.error);
  } else if (previous.absent) {
    if (requirePrevious) errors.push(`no previous status file at the fork point from "${base}" but --require-previous was given`);
    else notes.push(`no previous status file at the fork point (${previous.base.slice(0, 7)}): initial setup, structure only; the transition check starts once the file exists on the target branch`);
  } else {
    errors.push(...compareStatus(previous.markdown, markdown));
    notes.push(base ? `transition checked against the fork point from "${base}"` : `transition checked against ${previousFile}`);
  }
  return { errors, notes };
}

function parseArgs(argv) {
  const opts = { file: "docs/project-status.md" };
  const rest = [...argv];
  while (rest.length > 0) {
    const arg = rest.shift();
    if (arg === "--base") opts.base = rest.shift();
    else if (arg === "--head") opts.head = rest.shift();
    else if (arg === "--previous") opts.previousFile = rest.shift();
    else if (arg === "--require-previous") opts.requirePrevious = true;
    else if (arg.startsWith("--")) throw new Error(`unknown option ${arg}`);
    else opts.file = arg;
  }
  if ((opts.base !== undefined && !opts.base) || (opts.previousFile !== undefined && !opts.previousFile)) throw new Error("--base / --previous need a value");
  if (opts.head !== undefined && (!opts.head || !opts.base)) throw new Error("--head needs a value and --base");
  if (opts.base && opts.previousFile) throw new Error("use either --base or --previous, not both");
  return opts;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  const { errors, notes } = checkStatusFile(opts.file, opts);
  for (const note of notes) console.log(`${opts.file}: ${note}`);
  if (errors.length > 0) {
    console.error(`${opts.file}: ${errors.length} problem(s)`);
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  const scope = opts.base || opts.previousFile ? "organisation and id continuity" : "organisation";
  console.log(`${opts.file}: OK (checks ${scope} only; this does not prove any task is really done)`);
}
