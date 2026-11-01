// Mechanical M2 compaction. Original descriptions are kept verbatim in a fenced record.
import { BUDGETS } from "./budgets.mjs";
export function archiveDone(tasks, archive, { all = false } = {}) {
  const updated = tasks.map((task) => {
    if (task.status !== "done" || (!all && [...task.description].length <= BUDGETS.task_description.done)) return task;
    const id = task.id.toLowerCase();
    const record = `\n## ${task.id}\n\n\`\`\`\`text\n${task.description}\n\`\`\`\`\n`;
    if (!archive.includes(record)) archive += record;
    const title = task.title.replace(/\s*\([^)]*\)/g, "").split(":")[0];
    const description = `أُنجز: ${title}؛ [الدليل](archive/status-archive.md#${id}).`;
    if ([...description].length > BUDGETS.task_description.done) throw new Error(`${task.id}: title too long for mechanical M2 summary; define a concise result`);
    return { ...task, description };
  });
  return { tasks: updated, archive };
}
