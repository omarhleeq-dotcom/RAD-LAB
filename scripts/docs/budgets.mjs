import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const ROOT = fileURLToPath(new URL("../../", import.meta.url));
export function loadBudgets(root = ROOT) {
  const caps = JSON.parse(readFileSync(path.join(root, "docs/budgets.json"), "utf8"));
  for (const [group, keys] of Object.entries({ handoff: ["lines", "line_chars"], agents: ["lines"], task_description: ["done", "open"], dated_report: ["lines"], decision_section: ["lines"], task_prompt: ["lines"], done_when: ["chars"], completion_evidence: ["chars"] })) {
    for (const key of keys) if (!Number.isSafeInteger(caps[group]?.[key]) || caps[group][key] < 1) throw new Error(`invalid budget ${group}.${key}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(caps.dated_report.from)) throw new Error("invalid report budget date");
  return caps;
}
export const BUDGETS = loadBudgets();
export const lines = (text) => text.trimEnd().split(/\r?\n/).length;
export function decisionSections(text) {
  const starts = [...text.matchAll(/^#{2,3} .+$/gm)];
  return starts.map((match, i) => ({ name: match[0], text: text.slice(match.index, starts[i + 1]?.index ?? text.length).trimEnd() }));
}
export function checkBudgets(documents, { caps = BUDGETS, previousDecisions = "", newFiles = new Set() } = {}) {
  const errors = [], warnings = [];
  const measure = (label, value, cap) => {
    if (value > cap) errors.push(`${label}: ${value} exceeds budget ${cap}`);
    else if (value >= cap * 0.8) warnings.push(`${label}: ${value}/${cap} (>=80% budget)`);
  };
  for (const [name, text] of documents) {
    if (name === "docs/HANDOFF.md") {
      measure(`${name} lines`, lines(text), caps.handoff.lines);
      measure(`${name} longest line`, Math.max(...text.split(/\r?\n/).map((line) => [...line].length)), caps.handoff.line_chars);
    }
    if (name === "AGENTS.md") measure(`${name} lines`, lines(text), caps.agents.lines);
    if (name === "docs/templates/TASK_PROMPT.md") measure(`${name} lines`, lines(text), caps.task_prompt.lines);
    const date = /\d{4}-\d{2}-\d{2}/.exec(path.basename(name))?.[0];
    if (name.endsWith(".md") && date && (date >= caps.dated_report.from || newFiles.has(name))) measure(`${name} report lines`, lines(text), caps.dated_report.lines);
    if (name === "docs/DECISIONS.md" && previousDecisions) {
      const existing = new Set(decisionSections(previousDecisions).map((section) => section.name));
      for (const section of decisionSections(text)) if (!existing.has(section.name) && section.name !== "## Current rules") measure(`${name} ${section.name}`, lines(section.text), caps.decision_section.lines);
    }
    if (name === "docs/project-status.md") {
      const block = /```json\n([\s\S]*?)\n```/.exec(text);
      if (!block) continue;
      try { for (const task of JSON.parse(block[1]).tasks) measure(`${task.id} description`, [...task.description].length, task.status === "done" ? caps.task_description.done : caps.task_description.open); }
      catch { errors.push("cannot measure status descriptions"); }
    }
  }
  return { errors, warnings };
}
