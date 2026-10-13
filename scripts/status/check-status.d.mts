export const STATUSES: string[];
export const PRIORITIES: string[];
export function extractStatusJson(markdown: string): { json?: string; error?: string };
export function validateStatus(markdown: string): string[];
