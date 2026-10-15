// Pure rules for the feedback note (RAD-043b). The database enforces the same limit (migration 20261019000100_feedback.sql).
export const FEEDBACK_MAX = 1000;

/** The text to send, or null when there is nothing to send (blank) or it is too long. Counts characters like Postgres, not UTF-16 units. */
export function cleanNote(raw: string): string | null {
  const text = raw.trim();
  const length = [...text].length;
  return length >= 1 && length <= FEEDBACK_MAX ? text : null;
}

export const noteLength = (raw: string): number => [...raw].length;
