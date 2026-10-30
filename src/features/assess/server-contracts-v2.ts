/** Private v2 contracts. Attribution is hydrated from erasable relational rows. */
import type { AssessmentPublication, PrivateItemVersion } from './server-contracts';
import type { AssessmentVersionV2, ContentProvenanceV2 } from './contracts-v2';
type KeyV2<T> = T extends unknown ? Omit<T, 'schemaVersion' | 'review'> & { schemaVersion: 2; provenance: ContentProvenanceV2 } : never;
export type PrivateItemVersionV2 = KeyV2<PrivateItemVersion> | { schemaVersion: 2; ref: { id: string; version: string }; type: 'written-answer'; provenance: ContentProvenanceV2 };
export type AssessmentPublicationV2 = Omit<AssessmentPublication, 'schemaVersion' | 'assessment' | 'privateItems'> & { schemaVersion: 2; assessment: AssessmentVersionV2; privateItems: readonly PrivateItemVersionV2[] };
