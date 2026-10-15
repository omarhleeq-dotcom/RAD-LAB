export const STATUSES: string[];
export const PRIORITIES: string[];
export const FORMAT_VERSIONS: string[];
export const WAITING_ON: string[];
export const NEEDS_WAITING_ON: string[];
export const DESCRIPTION_MAX: number;
export const EVIDENCE_MAX: number;
export const HANDOFF_MAX_LINES: number;
export function openConflicts(markdown: string): string[];
export function handoffProblem(statusFile: string): string | null;
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
