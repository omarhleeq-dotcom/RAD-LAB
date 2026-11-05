export type GateEntry = {
 sha256: string;
 kind: 'expected-state' | 'stop-closed' | 'inventory-only';
 replacements: {from: string; count: number}[];
};
export const ledger: {
 version: 1;
 setting: 'radlab.expected_gate';
 values: ['open', 'closed'];
 files: Record<string, GateEntry>;
};
export const gatePredicate: string;
export const fingerprints: {functions: string; relations: string};
export function successor(file: string): string;
