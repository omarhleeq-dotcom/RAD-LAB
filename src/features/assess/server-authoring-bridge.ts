/** Private bridge orchestration. No default port, database selector, browser import or worker loop.
 * The injected PostgreSQL port authorizes its bound user, holds scope/revision locks,
 * creates the candidate through content_submit_v1, and commits install+link together.
 * No port or trusted review package is configured by default.
 */
import type { AssessmentPublication } from './server-contracts';
import type { ContentWorkerPort } from './server-presentation';
import { installMixedContent, validateMixedContent } from './server-presentation';
import { installPracticalContent, validatePracticalContent } from './server-practical';
import type { Draft, DraftReference, PartReference, PracticalReference } from '../authoring-review/contracts';
import { draftIssues, totalPoints } from '../authoring-review/draft';
export type StoredAuthoringRevision = { document: Draft; refs: DraftReference[]; digest: string };
export type IndependentPublication = { sourceDigest: string; publication: AssessmentPublication };
type Catalog = { parts: readonly PartReference[]; practicals: readonly PracticalReference[] };
export interface AuthoringBridgeTransaction {
 readonly snapshot: StoredAuthoringRevision;
 readonly installedVersion?: string;
 /** Trusted review store lookup by server revision and digest, never a browser request body. */
 reviewed(): Promise<IndependentPublication | null>;
 /** Reuses the existing candidate channel under the narrow internal SQL capability. */
 candidate(document: AssessmentPublication): Promise<string>;
 readonly installer: ContentWorkerPort;
 /** Same transaction: assert installed/available, exact owner/track/revision/digest, then bind. */
 bind(version: string): Promise<void>;
}
export interface AuthoringBridgePort {
 /** The transport binds identity. No client actor or digest is accepted. Roll back on every error. */
 transaction<T>(draft: string, revision: number, run: (tx: AuthoringBridgeTransaction) => Promise<T>): Promise<T>;
}
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a, (_k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v) === JSON.stringify(b, (_k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
/** Form fields never manufacture review records. The trusted package covers the SQL digest,
 * and each public/private pin is compared with the actual stored draft before validators run. */
export function verifyReviewedAuthoring(snapshot: StoredAuthoringRevision, reviewed: IndependentPublication | null, catalog: Catalog) {
 const d = snapshot.document;
 if (!reviewed || !/^[a-f0-9]{64}$/.test(snapshot.digest) || reviewed.sourceDigest !== snapshot.digest) throw Error('independent_review_required');
 if (draftIssues(d, catalog.parts, catalog.practicals).length) throw Error('incomplete_authoring');
 const publication = structuredClone(reviewed.publication), a = publication.assessment;
 if (a.ref.id !== d.id || a.ref.version !== String(d.revision) || a.track !== d.track || a.name !== d.name || !same(a.policy, d.policy) || a.items.length !== d.items.length) throw Error('review_revision_mismatch');
 if (a.track === 'mixed' && a.maximum !== totalPoints(d)) throw Error('review_marks_mismatch');
 const expectedRefs = new Map<string, string>();
 d.items.forEach((item, n) => {
  const p = a.items[n]!, key = publication.privateItems.find(k => k.ref.id === item.id && k.ref.version === String(d.revision));
  if (p.ref.id !== item.id || p.ref.version !== String(d.revision) || p.type !== item.type || p.prompt !== item.prompt || !key || key.type !== item.type) throw Error('review_item_mismatch');
  if (item.type !== 'full-practical' && publication.itemMarks.find(m => m.item.id === item.id && m.item.version === String(d.revision))?.maximum !== item.maximum) throw Error('review_marks_mismatch');
  if (item.type === 'single-choice') {
   if (p.type !== 'single-choice' || key.type !== 'single-choice' || !same(p.options, item.options) || key.correctOptionId !== item.correctOptionId) throw Error('review_key_mismatch');
  } else if (item.type === 'full-practical') {
   if (key.type !== 'full-practical' || !same(key.caseRef, item.caseRef) || key.evaluatorVersion !== item.evaluatorVersion) throw Error('review_case_mismatch');
   expectedRefs.set(item.caseRef.id, item.caseRef.version);
  } else {
   const part = catalog.parts.find(p => p.id === item.partId);
   if (!part || key.type !== 'simulator-part' || !same(key.caseRef, part.caseRef) || key.criteria.length !== 1 || key.criteria[0]!.ruleId !== part.ruleId || key.criteria[0]!.part !== part.part || key.criteria[0]!.maximum !== item.maximum || !same(key.mutablePaths, Object.keys(part.view.controls))) throw Error('review_part_mismatch');
   expectedRefs.set(part.id, part.caseRef.version);
  }
 });
 if (snapshot.refs.length !== expectedRefs.size || new Set(snapshot.refs.map(r => r.key)).size !== expectedRefs.size || snapshot.refs.some(r => expectedRefs.get(r.key) !== r.revision)) throw Error('review_reference_mismatch');
 if (a.track === 'full-practical') validatePracticalContent(publication); else validateMixedContent(publication);
 return publication;
}
export function authoringBridge(port: AuthoringBridgePort | undefined, catalog: Catalog) {
 return { async publish(draft: string, revision: number) {
  if (!port) throw Error('authoring_bridge_unconfigured');
  if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(draft) || !Number.isSafeInteger(revision) || revision < 1 || revision > 100) throw Error('invalid_authoring_revision');
  // One attempt only. An uncertain COMMIT must be reconciled by a read-only receipt path.
  return port.transaction(draft, revision, async tx => {
   if (tx.snapshot.document.id !== draft || tx.snapshot.document.revision !== revision) throw Error('authoring_revision_changed');
   const publication = verifyReviewedAuthoring(tx.snapshot, await tx.reviewed(), catalog);
   if (tx.installedVersion) return { version: tx.installedVersion, draft, revision };
   const version = await tx.candidate(publication);
   const stored = await tx.installer.call('content_read_v1', { p_version: version });
   if (!same(stored, publication)) throw Error('candidate_mismatch');
   if (publication.assessment.track === 'full-practical') await installPracticalContent(tx.installer, version);
   else await installMixedContent(tx.installer, version);
   await tx.bind(version); return { version, draft, revision };
  });
 } };
}
