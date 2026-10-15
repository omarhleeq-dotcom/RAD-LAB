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
  "pelvis-ap": { wordingNs: "pelvis-ap" },
  "pa-erect": {},
  "ap-erect": { wordingNs: "ap" },
  "lateral-left": { wordingNs: "lateral" },
  // Wrist (S14.1c): the wording namespace is the projection id itself (`radiograph.wrist-pa.*` / `radiograph.wrist-lateral.*`).
  "wrist-pa": { wordingNs: "wrist-pa" },
  "wrist-lateral": { wordingNs: "wrist-lateral" },
  // Hand (S14.2b): same pattern (`radiograph.hand-pa.*` / `radiograph.hand-lateral.*`); the lateral is the extension variant (S14.2-6).
  "hand-pa": { wordingNs: "hand-pa" },
  "hand-lateral": { wordingNs: "hand-lateral" },
  // Elbow (S14.3): same pattern (`radiograph.elbow-ap.*` / `radiograph.elbow-lateral.*`); the AP is fully extended, the lateral flexed 90° (S14.3-5).
  "elbow-ap": { wordingNs: "elbow-ap" },
  "elbow-lateral": { wordingNs: "elbow-lateral" },
  // Foot (S14.4, right side): the wording namespace is the projection id itself (`radiograph.foot-ap.*` / `radiograph.foot-oblique.*`).
  "foot-ap": { wordingNs: "foot-ap" },
  "foot-oblique": { wordingNs: "foot-oblique" },
  // Knee (S14.4, right side): the wording namespace is the projection id itself (`radiograph.knee-ap.*` / `radiograph.knee-lateral.*`).
  "knee-ap": { wordingNs: "knee-ap" },
  "knee-lateral": { wordingNs: "knee-lateral" },
  // Ankle (S14.5, left side inferred): the wording namespace is the projection id itself (`radiograph.ankle-ap.*` / `radiograph.ankle-lateral.*`).
  "ankle-ap": { wordingNs: "ankle-ap" },
  "ankle-lateral": { wordingNs: "ankle-lateral" },
};

export const isRegisteredProjection = (id: string): boolean => Object.hasOwn(PROJECTIONS, id);
