/** Assess wire shapes v1. No keys, rubrics, fixed settings or evaluation results here. */
export interface VersionRef {
  id: string;
  version: string;
}

export interface AttemptPolicy {
  /** null = untimed; positive whole seconds otherwise. Server time only. */
  durationSeconds: number | null;
  maxAttempts: number;
  gradeVisibility: "after-submission" | "hidden";
}

interface ItemBase {
  schemaVersion: 1;
  ref: VersionRef;
  prompt: string;
  contentLanguage: "en";
}

export interface SingleChoiceItem extends ItemBase {
  type: "single-choice";
  options: readonly { id: string; text: string }[];
}

export interface SimulatorPartItem extends ItemBase {
  type: "simulator-part";
  /** Presentation is an explicit reviewed allowlist, never the full Practice workspace. */
  presentation: {
    controls: readonly string[];
    sceneElements: readonly string[];
  };
}

export interface FullPracticalItem extends ItemBase {
  type: "full-practical";
  caseRef: VersionRef;
}

interface AssessmentBase {
  schemaVersion: 1;
  ref: VersionRef;
  name: string;
  policy: AttemptPolicy;
  /** Decimal points encoded as strings, never binary floats in stored marks. */
  maximum: string;
}

/** Separate tracks: a practical exam cannot silently become a mixed quiz. */
export type AssessmentVersion = AssessmentBase & (
  | { track: "mixed"; items: readonly (SingleChoiceItem | SimulatorPartItem)[] }
  | { track: "full-practical"; items: readonly FullPracticalItem[] }
);

export type ItemAnswer =
  | { type: "single-choice"; optionId: string | null }
  | { type: "simulator-part" | "full-practical"; values: Readonly<Record<string, unknown>> };

/** Authenticated identity comes from the service session, never this body. */
export interface AttemptCommand {
  schemaVersion: 1;
  attemptId: string;
  operationId: string;
  expectedRevision: number;
  action:
    | { type: "save"; item: VersionRef; answer: ItemAnswer }
    | { type: "expose"; item: VersionRef; answer: Extract<ItemAnswer, { values: unknown }> }
    | { type: "submit" };
}

export interface AttemptAcknowledgement {
  operationId: string;
  revision: number;
  serverTime: string;
  deadline: string | null;
  state: "active" | "grading" | "graded" | "grading-failed" | "void";
  lockedItemIds: readonly string[];
}

/** Four display fields only; the hidden branch cannot carry a mark. */
export interface AssessHistoryRow {
  name: string;
  track: AssessmentVersion["track"];
  submittedAt: string;
  grade: { visibility: "hidden" } | { visibility: "shown"; earned: string; maximum: string };
}
