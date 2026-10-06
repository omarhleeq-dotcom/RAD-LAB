import type { ProjectionId } from "@/domain/simulation";

/**
 * Message namespace of the projection-specific result wording (`radiograph.<ns>.*`): the lateral baseline (S12) and the AP
 * baseline (S13) override the PA wording where a message exists, else the common one is used. Absent = the PA baseline.
 */
export type WordingNs = "lateral" | "ap";

export const wordingNsOf = (projection: ProjectionId | undefined): WordingNs | undefined =>
  projection === "lateral-left" ? "lateral" : projection === "ap-erect" ? "ap" : undefined;
