/** Additive dormant wire contracts. No v1 reinterpretation or runtime activation. */
import type { AssessmentVersion, SingleChoiceItem, SimulatorPartItem, FullPracticalItem } from './contracts';
import type { Draft, DraftItem } from '../authoring-review/contracts';
export type SourceV2 = { reference: string; licenceEvidence: string };
export type ContentReviewV2 = { sources: readonly SourceV2[]; reviewedBy: string; reviewedAt: string; scope: string };
export type ContentProvenanceV2 =
 | { kind: 'uploader-authored'; reviewStatus: 'no-medical-review'; sources: readonly SourceV2[]; licenceNotes: string; authorDisplayName: string | null; reviewedBy?: never; reviewedAt?: never }
 | { kind: 'simulator-reviewed'; review: ContentReviewV2 };
/** Browser request cannot supply attribution or a review. Simulator review is resolved privately. */
export type AuthoringProvenanceInputV2 = { kind: 'uploader-authored'; reviewStatus: 'no-medical-review'; sources: readonly SourceV2[]; licenceNotes: string } | { kind: 'simulator-reviewed' };
export type RandomPoolV1 = { version: 1; size: number };
type Versioned<T> = T extends unknown ? Omit<T, 'schemaVersion'> & { schemaVersion: 2 } & (T extends SingleChoiceItem ? { shuffleOptions?: boolean } : object) : never;
export type WrittenAnswerItemV2 = { schemaVersion: 2; ref: { id: string; version: string }; prompt: string; contentLanguage: 'en'; type: 'written-answer' };
export type AssessmentVersionV2 = Omit<AssessmentVersion, 'schemaVersion' | 'items' | 'track'> & { schemaVersion: 2; randomPool?: RandomPoolV1 } & (
 | { track: 'mixed'; items: readonly (Versioned<SingleChoiceItem | SimulatorPartItem> | WrittenAnswerItemV2)[] }
 | { track: 'full-practical'; items: readonly Versioned<FullPracticalItem>[] }
);
type DraftItemV2 = (DraftItem extends infer T ? T extends DraftItem ? Omit<T, 'authoring'> & (T extends { type: 'single-choice' } ? { shuffleOptions?: boolean } : object) : never : never) | { id: string; type: 'written-answer'; prompt: string; maximum: string };
export type AuthoringDraftV2 = Omit<Draft, 'schemaVersion' | 'items' | 'track'> & { schemaVersion: 2; randomPool?: RandomPoolV1; track: 'mixed' | 'full-practical'; items: (DraftItemV2 & { provenance: AuthoringProvenanceInputV2 })[] };
