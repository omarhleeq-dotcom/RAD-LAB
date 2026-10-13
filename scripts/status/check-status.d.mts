export const STATUSES: string[];
export const PRIORITIES: string[];
export function extractStatusJson(markdown: string): { json?: string; error?: string };
export function validateStatus(markdown: string): string[];
export function compareStatus(previousMarkdown: string, nextMarkdown: string): string[];
export function readPreviousFromGit(
  ref: string,
  file: string,
  cwd?: string,
  head?: string,
): { markdown?: string; absent?: boolean; base?: string; error?: string };
export function checkStatusFile(
  file: string,
  options?: { base?: string; head?: string; previousFile?: string; requirePrevious?: boolean; cwd?: string },
): { errors: string[]; notes: string[] };
