import { expect, it } from 'vitest';
import { authoringBridge, verifyReviewedAuthoring, type StoredAuthoringRevision, type AuthoringBridgePort } from './server-authoring-bridge';
import { localPracticalCatalog } from '../authoring-review/catalog';
import { newDraft, newMCQ } from '../authoring-review/draft';
import type { AssessmentPublication } from './server-contracts';
export function syntheticReviewedDraft() {
 const d = newDraft(); d.revision = 1; d.name = 'SYNTHETIC engineering letters';
 const q = newMCQ(); q.prompt = 'SYNTHETIC ALPHA'; q.correctOptionId = q.options[0]!.id;
 q.authoring = { author: 'Synthetic fixture', reference: 'Own synthetic letters', licenceNotes: 'Own engineering fixture only', notes: 'No medical content' }; d.items = [q];
 const publication: AssessmentPublication = { schemaVersion: 1, assessment: { schemaVersion: 1, ref: { id: d.id, version: '1' }, name: d.name, track: 'mixed', maximum: '1', policy: d.policy, items: [{ schemaVersion: 1, ref: { id: q.id, version: '1' }, type: 'single-choice', contentLanguage: 'en', prompt: q.prompt, options: q.options }] }, itemMarks: [{ item: { id: q.id, version: '1' }, maximum: '1' }], privateItems: [{ schemaVersion: 1, ref: { id: q.id, version: '1' }, type: 'single-choice', correctOptionId: q.correctOptionId, review: { sources: [{ reference: 'Own synthetic alphabet fixture', licenceEvidence: 'Own non-medical test text only' }], reviewedBy: 'SYNTHETIC independent engineering review fixture', reviewedAt: '2026-10-26T00:00:00.000Z', scope: 'Engineering test of synthetic letters only; no medical approval' } }] };
 const snapshot: StoredAuthoringRevision = { document: d, refs: [], digest: 'a'.repeat(64) };
 return { snapshot, reviewed: { sourceDigest: snapshot.digest, publication } };
}
it('complete fields do not substitute for independently supplied review of the SQL digest', () => {
 const f = syntheticReviewedDraft();
 expect(() => verifyReviewedAuthoring(f.snapshot, null, { parts: [], practicals: [] })).toThrow('independent_review_required');
 expect(verifyReviewedAuthoring(f.snapshot, f.reviewed, { parts: [], practicals: [] })).toEqual(f.reviewed.publication);
 for (const mutate of [
  () => { f.reviewed.sourceDigest = 'b'.repeat(64); },
  () => { f.snapshot.document.revision++; },
  () => { f.snapshot.document.name += 'edited'; },
  () => { f.snapshot.refs = [{ key: 'unknown', revision: 'unreviewed' }]; },
  () => { f.reviewed.publication.privateItems[0]!.review.reviewedBy = ''; },
 ]) {
  const before = structuredClone(f); mutate(); expect(() => verifyReviewedAuthoring(f.snapshot, f.reviewed, { parts: [], practicals: [] })).toThrow(); Object.assign(f, before);
 }
});
it('unconfigured candidate authority fails closed; no worker loop or automatic retry after lost ACK', async () => {
 const f = syntheticReviewedDraft(), calls: string[] = [];
 await expect(authoringBridge(undefined, { parts: [], practicals: [] }).publish(f.snapshot.document.id, 1)).rejects.toThrow('unconfigured');
 const port: AuthoringBridgePort = { async transaction(_id, _revision, run) {
  calls.push('transaction');
  return run({ snapshot: f.snapshot, async reviewed() { return f.reviewed; }, async candidate() { calls.push('candidate'); throw Error('supervisor_candidate_authority_unconfigured'); }, installer: { async call<T>() { calls.push('install'); return null as T; } }, async bind() { calls.push('bind'); } });
 } };
 await expect(authoringBridge(port, { parts: [], practicals: [] }).publish(f.snapshot.document.id, 1)).rejects.toThrow('authority_unconfigured');
 expect(calls).toEqual(['transaction', 'candidate']);
});

it('practical engineering review pins the current case and evaluator and rejects stale references', () => {
 const f = syntheticReviewedDraft(), catalog = localPracticalCatalog(), c = catalog[0]!;
 const d = f.snapshot.document, old = d.items[0]!, ref = { id: old.id, version: '1' };
 d.track = 'full-practical'; d.items = [{ id: old.id, type: 'full-practical', prompt: old.prompt, caseRef: c.caseRef, evaluatorVersion: c.evaluatorVersion, authoring: old.authoring }];
 f.snapshot.refs = [{ key: c.caseRef.id, revision: c.caseRef.version }];
 const pub = f.reviewed.publication, review = pub.privateItems[0]!.review;
 pub.assessment.track = 'full-practical'; pub.assessment.items = [{ schemaVersion: 1, ref, type: 'full-practical', contentLanguage: 'en', prompt: old.prompt, caseRef: c.caseRef }];
 pub.privateItems = [{ schemaVersion: 1, ref, type: 'full-practical', caseRef: c.caseRef, evaluatorVersion: c.evaluatorVersion, review }];
 expect(verifyReviewedAuthoring(f.snapshot, f.reviewed, { parts: [], practicals: catalog })).toEqual(pub);
 const key = pub.privateItems[0]!; if (key.type !== 'full-practical') throw Error(); key.evaluatorVersion = 'stale';
 expect(() => verifyReviewedAuthoring(f.snapshot, f.reviewed, { parts: [], practicals: catalog })).toThrow();
 key.evaluatorVersion = c.evaluatorVersion; f.snapshot.refs[0]!.revision = 'stale';
 expect(() => verifyReviewedAuthoring(f.snapshot, f.reviewed, { parts: [], practicals: catalog })).toThrow('reference_mismatch');
});
