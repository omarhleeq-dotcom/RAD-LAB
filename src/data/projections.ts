/**
 * Projection registry (S14-0). `ProjectionId` is an open string; a projection is known to the platform when it is listed
 * here, and `validateExam` rejects an exam whose projections are not. A new exam registers its projection(s) with one
 * entry instead of editing a shared type.
 *
 * `wordingNs`: the message namespace (`radiograph.<ns>.*`) of the projection-specific result wording, used where a message
 * exists in it, else the common wording applies. Absent = the common (PA baseline) wording.
 */
export interface ProjectionSpec {
  wordingNs?: string;
}

export const PROJECTIONS: Readonly<Record<string, ProjectionSpec>> = {
  "pa-erect": {},
  "ap-erect": { wordingNs: "ap" },
  "lateral-left": { wordingNs: "lateral" },
};

export const isRegisteredProjection = (id: string): boolean => Object.hasOwn(PROJECTIONS, id);
