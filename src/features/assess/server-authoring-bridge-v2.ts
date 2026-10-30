/** Private staging bridge. No host, browser wiring, installer or runtime grants. */
import type { AuthoringDraftV2, ContentProvenanceV2 } from './contracts-v2';
import type { AssessmentPublicationV2, PrivateItemVersionV2 } from './server-contracts-v2';
import type { PartReference } from '../authoring-review/contracts';
import { randomPoolMaximum } from './random-pool';
import { validatePublicationV2 } from './server-validation-v2';
export type BridgeSnapshotV2 = {
 snapshot: { document: AuthoringDraftV2; refs: { key: string; revision: string }[]; digest: string };
 items: Record<string, { provenance: ContentProvenanceV2; reviewedKey: PrivateItemVersionV2 | null }>;
};
export interface BridgePortV2 {
 transaction<T>(draft: string, revision: number, run: (snapshot: BridgeSnapshotV2, submit: (publication: AssessmentPublicationV2) => Promise<string>) => Promise<T>): Promise<T>;
}
export function publicationFromDraftV2(stored: BridgeSnapshotV2, parts: readonly PartReference[]): AssessmentPublicationV2 {
 const d = stored.snapshot.document;
 if (d.schemaVersion !== 2 || !/^[a-f0-9]{64}$/.test(stored.snapshot.digest)) throw Error('invalid_v2_snapshot');
 const refs = new Map(stored.snapshot.refs.map(r => [r.key, r.revision]));
 const privateItems: PrivateItemVersionV2[] = [];
 const items = d.items.map(item => {
  const ref = { id: item.id, version: String(d.revision) }, evidence = stored.items[item.id];
  if (!evidence) throw Error('provenance_required');
  const base = { schemaVersion: 2 as const, ref, prompt: item.prompt, contentLanguage: 'en' as const };
  if (item.type === 'single-choice' || item.type === 'written-answer') {
   privateItems.push({ schemaVersion: 2, ref, type: item.type, provenance: evidence.provenance, ...(item.type === 'single-choice' ? { correctOptionId: item.correctOptionId } : {}) } as PrivateItemVersionV2);
   return item.type === 'single-choice' ? { ...base, type: item.type, options: item.options, ...(item.shuffleOptions === undefined ? {} : { shuffleOptions: item.shuffleOptions }) } : { ...base, type: item.type };
  }
  const key = evidence.reviewedKey;
  if (!key || key.type !== item.type || key.ref.id !== ref.id || key.ref.version !== ref.version || JSON.stringify(key.provenance) !== JSON.stringify(evidence.provenance)) throw Error('real_review_required');
  privateItems.push(key);
  if (item.type === 'full-practical' && key.type === 'full-practical') {
   if (key.caseRef.id !== item.caseRef.id || key.caseRef.version !== item.caseRef.version || key.evaluatorVersion !== item.evaluatorVersion || refs.get(item.caseRef.id) !== item.caseRef.version) throw Error('review_case_mismatch');
   return { ...base, type: item.type, caseRef: item.caseRef };
  }
  if (item.type !== 'simulator-part' || key.type !== 'simulator-part') throw Error('review_type_mismatch');
  const part = parts.find(p => p.id === item.partId);
  if (!part || refs.get(part.id) !== part.caseRef.version || key.caseRef.id !== part.caseRef.id || key.caseRef.version !== part.caseRef.version || key.criteria.length !== 1 || key.criteria[0]!.ruleId !== part.ruleId || key.criteria[0]!.part !== part.part || key.criteria[0]!.maximum !== item.maximum || JSON.stringify(key.mutablePaths) !== JSON.stringify(Object.keys(part.view.controls))) throw Error('review_part_mismatch');
  return { ...base, type: item.type, presentation: { controls: Object.keys(part.view.controls), sceneElements: [] } };
 });
 const marks = d.items.map(i => ({ item: { id: i.id, version: String(d.revision) }, maximum: i.type === 'full-practical' ? '1' : i.maximum }));
 const maximum = randomPoolMaximum(d.items.map((i, n) => ({ ...i, maximum: marks[n]!.maximum })), d.randomPool);
 const publication = { schemaVersion: 2, assessment: { schemaVersion: 2, ref: { id: d.id, version: String(d.revision) }, name: d.name, policy: d.policy, track: d.track, maximum, items, ...(d.randomPool === undefined ? {} : { randomPool: d.randomPool }) }, itemMarks: marks, privateItems } as AssessmentPublicationV2;
 return validatePublicationV2(publication).publication;
}
export function authoringBridgeV2(port: BridgePortV2 | undefined, parts: readonly PartReference[]) {
 return { async stage(draft: string, revision: number) {
  if (!port) throw Error('authoring_bridge_unconfigured');
  if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(draft) || !Number.isSafeInteger(revision) || revision < 1 || revision > 100) throw Error('invalid_authoring_revision');
  return port.transaction(draft, revision, async (stored, submit) => {
   if (stored.snapshot.document.id !== draft || stored.snapshot.document.revision !== revision) throw Error('authoring_revision_changed');
   return { candidate: await submit(publicationFromDraftV2(stored, parts)), draft, revision };
  });
 } };
}
