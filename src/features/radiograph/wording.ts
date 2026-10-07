import { PROJECTIONS } from "@/data/projections";
import type { ProjectionId } from "@/domain/simulation";

/**
 * Message namespace of the projection-specific result wording (`radiograph.<ns>.*`): the lateral baseline (S12) and the AP
 * baseline (S13) override the PA wording where a message exists, else the common one is used. Absent = the PA baseline.
 * Open (S14-0): the namespace of a projection is declared in the projection registry (`src/data/projections.ts`).
 */
export type WordingNs = string;

export const wordingNsOf = (projection: ProjectionId | undefined): WordingNs | undefined =>
  projection === undefined ? undefined : Object.hasOwn(PROJECTIONS, projection) ? PROJECTIONS[projection]!.wordingNs : undefined;
