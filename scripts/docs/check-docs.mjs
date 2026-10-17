// Shared local/CI structural check. No network, Markdown renderer or clinical verification.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractStatusJson, validateStatus } from "../status/check-status.mjs";

const DEFAULT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const COMPATIBILITY = ["session-3-technique.md", "session-5-qa.md", "session-7-demographics-impact.md", "session-13b-scene-design.md"];
const external = (value) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
const idPattern = /\b(?:D\d+|O\d+|S(?:\d|-[A-Z])[A-Za-z\d_.-]*)\b/g;
const decode = (value) => { try { return decodeURIComponent(value); } catch { return null; } };
const entities = (value) => value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
export function headingSlug(value) {
  return entities(value.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]*>/g, "").replace(/[`*~]/g, ""))
    .toLowerCase().replace(/[^\p{L}\p{M}\p{N}_\- ]/gu, "").replace(/ /g, "-");
}
function withoutCodeSpans(line) {
  return line.replace(/(`+)([\s\S]*?)\1(?!`)/g, (match) => " ".repeat(match.length));
}
function cellsOf(line) {
  const cells = line.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "").split(/(?<!\\)\|/);
  return cells.map((cell) => cell.trim());
}
const separator = (line) => line.includes("|") && cellsOf(line).every((cell) => /^:?-{3,}:?$/.test(cell));

// Parse inline destinations with balanced parentheses, angle destinations and optional titles.
function inlineLinks(line) {
  const links = [];
  const start = /\]\(/g;
  while (start.exec(line)) {
    let i = start.lastIndex;
    while (/\s/.test(line[i] ?? "") && i < line.length) i++;
    const angle = line[i] === "<";
    if (angle) i++;
    const begin = i;
    let depth = 0;
    for (; i < line.length; i++) {
      if (line[i] === "\\") { i++; continue; }
      if (angle && line[i] === ">") break;
      if (!angle) {
        if (line[i] === "(") depth++;
        if (line[i] === ")") { if (!depth) break; depth--; }
        if (/\s/.test(line[i]) && !depth) break;
      }
    }
    const target = line.slice(begin, i).replace(/\\([() ])/g, "$1");
    if (target) links.push(target);
    // Always advance, including a malformed/incomplete destination.
    start.lastIndex = Math.max(start.lastIndex, i + 1);
  }
  return links;
}
export function parseMarkdown(text, name = "document.md") {
  const errors = [], visible = [], anchors = new Set(), counts = new Map(), links = [], definitions = new Map();
  let fence = null, comment = false;
  for (const [offset, original] of text.split(/\r?\n/).entries()) {
    const lineNo = offset + 1;
    const marker = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(original);
    if (marker && !comment) {
      if (!fence) fence = { marker: marker[1], line: lineNo };
      else if (marker[1][0] === fence.marker[0] && marker[1].length >= fence.marker.length && !marker[2].trim()) fence = null;
      continue;
    }
    if (fence) continue;
    let line = original;
    if (comment) { const end = line.indexOf("-->"); if (end < 0) continue; line = line.slice(end + 3); comment = false; }
    line = line.replace(/<!--[\s\S]*?-->/g, "");
    const beginComment = line.indexOf("<!--");
    if (beginComment >= 0) { line = line.slice(0, beginComment); comment = true; }
    visible.push({ line, lineNo });
    for (const match of line.matchAll(/<(?:a|h[1-6])\b[^>]*\b(?:id|name)=["']([^"']+)["']/gi)) {
      if (anchors.has(match[1])) errors.push(`${name}:${lineNo}: duplicate explicit anchor ${match[1]}`);
      anchors.add(match[1]);
    }
    const heading = /^ {0,3}#{1,6}\s+(.+?)\s*#*$/.exec(line);
    if (heading) {
      const slug = headingSlug(heading[1]);
      let number = counts.get(slug) ?? 0;
      while (anchors.has(number ? `${slug}-${number}` : slug)) number++;
      counts.set(slug, number + 1); anchors.add(number ? `${slug}-${number}` : slug);
    }
    const definition = /^\s{0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/.exec(line);
    if (definition) definitions.set(definition[1].toLowerCase().trim(), definition[2] ?? definition[3]);
  }
  if (fence) errors.push(`${name}:${fence.line}: unclosed code fence`);
  if (comment) errors.push(`${name}: unclosed HTML comment`);
  let table = null;
  for (let i = 0; i < visible.length; i++) {
    const { line, lineNo } = visible[i];
    const next = visible[i + 1];
    if (next && next.lineNo === lineNo + 1 && separator(next.line)) {
      const count = cellsOf(line).length;
      if (cellsOf(next.line).length !== count) errors.push(`${name}:${next.lineNo}: table separator differs from header`);
      table = count; i++;
    } else if (line.trim().startsWith("|")) {
      if (!table || visible[i - 1]?.lineNo !== lineNo - 1) errors.push(`${name}:${lineNo}: table row without header/separator`);
      else if (cellsOf(line).length !== table) errors.push(`${name}:${lineNo}: table has ${cellsOf(line).length} columns; expected ${table}`);
    } else table = null;
    const prose = withoutCodeSpans(line);
    for (const target of inlineLinks(prose)) links.push({ target, lineNo });
    for (const match of prose.matchAll(/<(?:a|img)\b[^>]*?\b(?:href|src)=["']([^"']+)["']/gi)) links.push({ target: entities(match[1]), lineNo });
    for (const match of prose.matchAll(/!?\[([^\]]+)\]\[([^\]]*)\]/g)) {
      const id = (match[2] || match[1]).trim().toLowerCase();
      if (!definitions.has(id)) errors.push(`${name}:${lineNo}: undefined reference [${id}]`);
      else links.push({ target: definitions.get(id), lineNo });
    }
    if (!/^\s*\[[^\]]+\]:/.test(line)) {
      for (const match of prose.matchAll(/(?<!!)\[([^\]]+)\](?![[(])/g)) {
        const id = match[1].trim().toLowerCase();
        if (definitions.has(id)) links.push({ target: definitions.get(id), lineNo });
      }
    }
  }
  // Definitions can have no usage yet; their destinations must still be valid.
  for (const target of definitions.values()) links.push({ target, lineNo: 1 });
  return { anchors, links, visible, errors };
}
export function decisionIds(markdown) {
  const ids = new Set();
  // Some original O-items were declared in prose rather than table rows (O95/O96).
  for (const match of markdown.matchAll(/\*\*((?:D|O)\d+|S(?:\d|-[A-Z])[A-Za-z\d_.-]*)\*\*/g)) ids.add(match[1]);
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.startsWith("|")) continue;
    const first = cellsOf(line)[0].replace(/<[^>]*>/g, "");
    for (const match of first.matchAll(idPattern)) ids.add(match[0].replace(/[.-]+$/, ""));
  }
  for (const match of markdown.matchAll(/^###\s+(S-[A-Z][A-Za-z\d_.-]*)\s/gm)) ids.add(match[1]);
  return ids;
}
// Heuristics are advisory: references to separate open work can be legitimate.
export function consistencyWarnings(tasks) {
  return tasks.filter((task) => task.status === "done" && /المتبقي|يبقى مفتوح|(?:ما زال|لا يزال).{0,40}(?:مفتوح|ينتظر)|\b(?:still pending|awaiting|remaining:)\b/iu.test(task.description ?? ""))
    .map((task) => `${task.id}: done description may still describe pending work; review description/evidence together (no automatic state change)`);
}
export function handoffErrors(text) {
  const errors = [];
  if (/`[a-f\d]{7,40}`|\brevision\s*\d+|main عند|فرع العمل\s|(?:Draft PR|PR #\d+).{0,45}(?:ينتظر الدمج|دمجه يدوي)|بانتظار الدمج|pending merge/iu.test(text)) errors.push("docs/HANDOFF.md: do not duplicate branch/SHA/status revision or pending-merge instructions; use docs:context and status:summary");
  return errors;
}
export function checkDocs({ root, files, enforceContracts = true, previousDecisionIds = new Set() }) {
  const errors = [], warnings = [], documents = new Map();
  let localLinks = 0, sourceRefs = 0;
  for (const name of files) {
    const filename = path.resolve(root, name);
    if (!existsSync(filename)) continue; // git can list a staged deletion in a working checkout
    const text = readFileSync(filename, "utf8"), parsed = parseMarkdown(text, name);
    documents.set(filename, { name, text, ...parsed }); errors.push(...parsed.errors);
  }
  function checkTarget(name, lineNo, target) {
    if (external(target)) return;
    localLinks++;
    const hash = target.indexOf("#"), fragment = hash < 0 ? "" : decode(target.slice(hash + 1));
    const pathname = decode((hash < 0 ? target : target.slice(0, hash)).split("?")[0]);
    if (pathname === null || fragment === null) { errors.push(`${name}:${lineNo}: invalid URL escape ${target}`); return; }
    let resolved = pathname ? path.resolve(pathname.startsWith("/") ? root : path.dirname(path.resolve(root, name)), pathname.replace(/^\//, "")) : path.resolve(root, name);
    if (path.relative(root, resolved) === ".." || path.relative(root, resolved).startsWith(`..${path.sep}`)) { errors.push(`${name}:${lineNo}: path escapes repository ${target}`); return; }
    if (!existsSync(resolved)) { errors.push(`${name}:${lineNo}: missing local target ${target}`); return; }
    if (fragment && statSync(resolved).isDirectory() && existsSync(path.join(resolved, "README.md"))) resolved = path.join(resolved, "README.md");
    if (fragment && /\.md$/i.test(resolved) && !documents.get(resolved)?.anchors.has(fragment)) errors.push(`${name}:${lineNo}: missing anchor ${target}`);
  }
  for (const doc of documents.values()) for (const link of doc.links) checkTarget(doc.name, link.lineNo, link.target);
  const allIds = new Set();
  for (const doc of documents.values()) if (doc.name === "docs/DECISIONS.md" || doc.name.startsWith("docs/archive/decisions/")) for (const id of decisionIds(doc.text)) allIds.add(id);
  for (const id of previousDecisionIds) if (!allIds.has(id)) errors.push(`decision identifier lost: ${id}`);
  const current = documents.get(path.resolve(root, "docs/DECISIONS.md"));
  if (current) {
    const counts = new Map();
    for (const { line } of current.visible) {
      if (!line.startsWith("|")) continue;
      const first = cellsOf(line)[0].replace(/<[^>]*>/g, "").trim();
      if (!/^`(?:D\d+|O\d+|S(?:\d|-[A-Z])[A-Za-z\d_.-]*)`$/.test(first)) continue;
      for (const id of decisionIds(line)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const [id, count] of counts) if (count > 1) errors.push(`docs/DECISIONS.md: duplicate current declaration ${id}`);
  }
  const state = documents.get(path.resolve(root, "docs/project-status.md"));
  if (state) {
    errors.push(...validateStatus(state.text).map((error) => `docs/project-status.md: ${error}`));
    const extracted = extractStatusJson(state.text);
    if (!extracted.error) {
      try {
        const tasks = JSON.parse(extracted.json).tasks ?? [];
        warnings.push(...consistencyWarnings(tasks));
        for (const task of tasks) {
          for (const match of task.source_ref.matchAll(/docs\/[A-Za-z\d_./-]+(?:#[^\s؛،]+)?|(?<![A-Za-z\d_./-])[A-Za-z\d_-]+\.md(?:#[^\s؛،]+)?/g)) {
            const target = match[0].replace(/\.$/, ""), local = target.split("#")[0];
            const filename = local.includes("/") || existsSync(path.join(root, local)) ? local : `docs/${local}`;
            checkTarget("docs/project-status.md", 1, "/" + filename + (target.includes("#") ? target.slice(target.indexOf("#")) : "")); sourceRefs++;
          }
          for (const match of task.source_ref.matchAll(idPattern)) {
            const id = match[0].replace(/[.-]+$/, "");
            if (!allIds.has(id) && !(/^S/.test(id) && [...allIds].some((known) => known.startsWith(`${id}-`)))) errors.push(`${task.id}: unknown source_ref decision ${id}`);
          }
        }
      } catch (error) { errors.push(`docs/project-status.md: cannot inspect source_ref: ${error.message}`); }
    }
  }
  if (enforceContracts) {
    for (const name of COMPATIBILITY) {
      const doc = documents.get(path.resolve(root, "docs", name));
      if (!doc || !doc.links.some(({ target }) => target === `archive/sessions/${name}`)) errors.push(`docs/${name}: missing archive compatibility pointer`);
    }
    for (const name of ["AGENTS.md", "CLAUDE.md", "docs/README.md", "docs/HANDOFF.md", "docs/project-status.md", "docs/DECISIONS.md"]) if (!documents.has(path.resolve(root, name))) errors.push(`missing workflow entry ${name}`);
    const claude = documents.get(path.resolve(root, "CLAUDE.md"));
    if (claude && (!claude.links.some(({ target }) => target === "AGENTS.md") || claude.text.split(/\r?\n/).length > 16)) errors.push("CLAUDE.md: keep a short pointer to AGENTS.md (max16 lines); no copied workflow/dev block");
    const handoff = documents.get(path.resolve(root, "docs/HANDOFF.md"));
    if (handoff) errors.push(...handoffErrors(handoff.text));
    if (handoff && handoff.text.trimEnd().split(/\r?\n/).length > 80) errors.push("docs/HANDOFF.md: exceeds80 lines");
  }
  return { errors, warnings, markdownFiles: documents.size, localLinks, sourceRefs, decisionIds: allIds.size };
}
function git(root, args) { return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 12 * 1024 * 1024 }); }
export function runCli(args = process.argv.slice(2), root = DEFAULT_ROOT) {
  let base, head = "HEAD";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base" && args[i + 1]) base = args[++i];
    else if (args[i] === "--head" && args[i + 1]) head = args[++i];
    else if (args[i] === "--help") { console.log("docs:check [--base <git-ref> [--head <PR-head>]] — local Markdown/contracts; --base also protects decision ID continuity"); return 0; }
    else throw new Error(`unknown/incomplete option ${args[i]}`);
  }
  if (head !== "HEAD" && !base) throw new Error("--head requires --base");
  const files = [...new Set(git(root, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]).split("\0").filter((name) => /\.md$/i.test(name)))];
  const previousDecisionIds = new Set();
  if (base) {
    const fork = git(root, ["merge-base", base, head]).trim();
    const prior = git(root, ["ls-tree", "-r", "--name-only", fork, "--", "docs/DECISIONS.md", "docs/archive/decisions/"]).trim().split("\n").filter((name) => name.endsWith(".md"));
    if (!prior.includes("docs/DECISIONS.md")) throw new Error("comparison base has no docs/DECISIONS.md");
    for (const name of prior) for (const id of decisionIds(git(root, ["show", `${fork}:${name}`]))) previousDecisionIds.add(id);
  }
  const result = checkDocs({ root, files, previousDecisionIds });
  for (const error of result.errors) console.error(error);
  for (const warning of result.warnings) console.warn(`docs:check WARNING: ${warning}`);
  console.log(`docs:check: ${result.markdownFiles} Markdown, ${result.localLinks} local references (${result.sourceRefs} source_ref paths), ${result.decisionIds} decision IDs; ${result.errors.length} errors, ${result.warnings.length} review warnings; ${base ? "decision continuity checked" : "no history comparison (use --base)"}`);
  return result.errors.length ? 1 : 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = runCli(); } catch (error) { console.error(`docs:check: ${error.message}`); process.exitCode = 1; }
}
