/** Server-private contracts. No browser module imports this file. Not a deployed schema. */
import type { SimulationSettings } from "@/domain/simulation";
import type { AssessmentVersion, VersionRef } from "./contracts";

export interface ContentReview {
  /** Every source needs a reference and recorded commercial-use evidence. */
  sources: readonly { reference: string; licenceEvidence: string }[];
  reviewedBy: string;
  reviewedAt: string;
  scope: string;
}

export type PrivateItemVersion = { schemaVersion: 1; ref: VersionRef; review: ContentReview } & (
  | { type: "single-choice"; correctOptionId: string }
  | {
    type: "simulator-part";
    caseRef: VersionRef;
    evaluatorVersion: string;
    /** Complete reviewed background, NOT initialSettings assumed correct. */
    fixedSettings: SimulationSettings;
    mutablePaths: readonly string[];
    criteria: readonly { ruleId: string; part: string; maximum: string }[];
  }
  | { type: "full-practical"; caseRef: VersionRef; evaluatorVersion: string }
);

export interface AssessmentPublication {
  schemaVersion: 1;
  assessment: AssessmentVersion;
  /** Ordered item points fixed with the published version. */
  itemMarks: readonly { item: VersionRef; maximum: string }[];
  privateItems: readonly PrivateItemVersion[];
}

export interface AssignmentSnapshot {
  schemaVersion: 1;
  id: string;
  assessment: VersionRef;
  ownerId: string;
  publishedAt: string;
  /** Expanded/deduplicated at publication; later changes are explicit assignment revisions. */
  revision: number;
  targetUserIds: readonly string[];
  sourceGroupIds: readonly string[];
}

export interface AttemptSnapshot {
  schemaVersion: 1;
  id: string;
  userId: string;
  assignmentId: string;
  assignmentRevision: number;
  /** Immutable server-resolved publication, policy, order, keys and marks. */
  publication: AssessmentPublication;
  startedAt: string;
  deadline: string | null;
  revision: number;
}

/** No answers/settings/checks/events. Deleted six calendar months after submittedAt. */
export interface FinalResult {
  schemaVersion: 1;
  userId: string;
  assessment: VersionRef;
  assignmentId: string;
  attemptId: string;
  name: string;
  track: AssessmentVersion["track"];
  submittedAt: string;
  /** Exact final scaled mark survives temporary-detail deletion; no criterion detail. */
  earned: { numerator: string; denominator: string };
  maximum: string;
  gradeVisibility: "after-submission" | "hidden";
  expiresAt: string;
}
