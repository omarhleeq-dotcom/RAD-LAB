import type { RadCase } from "@/domain/case";
import { chestPaErect } from "./chest-pa-erect";

/** Registry of available cases. Add new case objects here; no UI changes needed. */
export const CASES: readonly RadCase[] = [chestPaErect];

export function getCase(id: string): RadCase | undefined {
  return CASES.find((c) => c.id === id);
}
