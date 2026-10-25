import type { Draft, DraftItem, PartReference, PracticalReference, StudentPreviewData } from './contracts';
import { assertAssessmentVersion, assertAttemptPolicy, decimalPoints, earnedPoints, FOUNDATION_LIMITS } from '../assess/policies';
export type Issue = { path: string; code: 'required' | 'policy' | 'points' | 'options' | 'key' | 'part' | 'limit' };
export const DRAFT_BYTES = 131072;
const notes = () => ({ author: '', reference: '', licenceNotes: '', notes: '' });
export function newDraft(track: NonNullable<Draft['track']> = 'mixed'): Draft {
 return { track, schemaVersion: 1, id: crypto.randomUUID(), revision: 0, name: '', policy: { durationSeconds: 1800, maxAttempts: 1, gradeVisibility: 'hidden' }, items: [] };
}
export function newMCQ(): Extract<DraftItem, { type: 'single-choice' }> {
 return { id: crypto.randomUUID(), type: 'single-choice', prompt: '', maximum: '1', authoring: notes(), options: ['A', 'B'].map(text => ({ id: crypto.randomUUID(), text })), correctOptionId: '' };
}
export function newPart(partId: string): Extract<DraftItem, { type: 'simulator-part' }> {
 return { id: crypto.randomUUID(), type: 'simulator-part', partId, prompt: '', maximum: '1', authoring: notes() };
}
export function newPractical(reference: PracticalReference): Extract<DraftItem, { type: 'full-practical' }> {
 return { id: crypto.randomUUID(), type: 'full-practical', prompt: '', caseRef: { ...reference.caseRef }, evaluatorVersion: reference.evaluatorVersion, authoring: notes() };
}
/** Reject track mixing even on incomplete local saves. Legacy P2 drafts without track are mixed. */
export function separated(d: Draft): boolean {
 return (d.track === undefined || d.track === 'mixed' || d.track === 'full-practical') && d.items.every(i => d.track === 'full-practical' ? i.type === 'full-practical' : i.type === 'single-choice' || i.type === 'simulator-part');
}
/** Exact point sum, not a second grader. Decimal output retains up to all six supported places. */
export function totalPoints(draft: Draft): string {
 if (draft.track === 'full-practical') throw Error('No authored marks for practical drafts');
 if (!draft.items.length) return '0';
 const value = earnedPoints(draft.items.map(i => ({ maximum: i.type === 'full-practical' ? (() => { throw Error('Mixed tracks'); })() : i.maximum, credit: { numerator: 1n, denominator: 1n } })));
 const scaled = value.numerator * 1000000n / value.denominator;
 return `${scaled / 1000000n}.${String(scaled % 1000000n).padStart(6, '0')}`.replace(/\.?0+$/, '') || '0';
}
export function draftIssues(d: Draft, parts: readonly PartReference[], practicals: readonly PracticalReference[] = []): Issue[] {
 const issues: Issue[] = [], add = (path: string, code: Issue['code']) => issues.push({ path, code });
 if (!d.name.trim()) add('name', 'required');
 if (d.name.length > 200 || d.items.length > FOUNDATION_LIMITS.items || new TextEncoder().encode(JSON.stringify(d)).length > DRAFT_BYTES) add('draft', 'limit');
 try { assertAttemptPolicy(d.policy); if ((d.policy.durationSeconds ?? 0) > 604800 || d.policy.maxAttempts > 1000) throw Error(); } catch { add('policy', 'policy'); }
 if (!d.items.length) add('items', 'required');
 if (!separated(d)) add('items', 'part');
 const ids = new Set<string>();
 d.items.forEach((item, n) => {
  const path = `items.${n + 1}`;
  if (item.type === 'full-practical' && item.maximum !== undefined) add(path, 'part');
  if (ids.has(item.id)) add(path, 'limit'); ids.add(item.id);
  if (!item.prompt.trim()) add(`${path}.prompt`, 'required');
  if (item.prompt.length > 10000) add(`${path}.prompt`, 'limit');
  if (item.type !== 'full-practical') { try { if (decimalPoints(item.maximum).numerator <= 0n) throw Error(); } catch { add(`${path}.maximum`, 'points'); } }
  for (const field of ['author', 'reference', 'licenceNotes'] as const) if (!item.authoring[field].trim()) add(`${path}.${field}`, 'required');
  if (Object.values(item.authoring).some(v => v.length > 2000)) add(`${path}.authoring`, 'limit');
  if (item.type === 'single-choice') {
   if (item.options.length < 2 || item.options.length > FOUNDATION_LIMITS.options || new Set(item.options.map(o => o.id)).size !== item.options.length || item.options.some(o => !o.id || !o.text.trim() || o.text.length > 5000)) add(`${path}.options`, 'options');
   if (!item.options.some(o => o.id === item.correctOptionId)) add(`${path}.correctOptionId`, 'key');
  } else if (item.type === 'full-practical') {
   if (!practicals.some(p => p.caseRef.id === item.caseRef.id && p.caseRef.version === item.caseRef.version && p.evaluatorVersion === item.evaluatorVersion)) add(`${path}.caseRef`, 'part');
  } else if (!parts.some(p => p.id === item.partId)) add(`${path}.partId`, 'part');
 });
 if (!issues.length) {
  try { assertAssessmentVersion({ schemaVersion: 1, ref: { id: d.id, version: String(d.revision) }, name: d.name, track: d.track ?? 'mixed', maximum: d.track === 'full-practical' ? '1' : totalPoints(d), policy: d.policy, items: projectPreview(d, parts, practicals).items } as import('../assess/contracts').AssessmentVersion /* shape guard only; no practical marks or publication */); }
  catch { add('draft', 'limit'); }
 }
 return issues;
}
/** Project the existing public view field-by-field, including nested drawing geometry. */
function practicalView(v: PracticalReference['view']): PracticalReference['view'] {
 const paths = Object.keys(v.controls);
 return { schemaVersion: 1, sceneValues: {},
  controls: Object.fromEntries(paths.map(p => { const c = v.controls[p]!; return [p, c.kind === 'number' ? { kind: 'number', min: c.min, max: c.max } : { kind: 'enum', values: structuredClone(c.values) }]; })),
  initial: Object.fromEntries(paths.map(p => [p, structuredClone(v.initial[p])])),
  labels: Object.fromEntries(paths.map(p => [p, v.labels[p]!])),
  increments: Object.fromEntries(paths.filter(p => v.increments[p]).map(p => { const i = v.increments[p]!; return [p, { step: i.step, ...(i.stations ? { stations: [...i.stations] } : {}) }]; })),
  scene: { id: v.scene.id, markerSizeCm: v.scene.markerSizeCm,
   detector: { widthCm: v.scene.detector.widthCm, heightCm: v.scene.detector.heightCm },
   anatomyFrame: { xCm: v.scene.anatomyFrame.xCm, yCm: v.scene.anatomyFrame.yCm, widthCm: v.scene.anatomyFrame.widthCm, heightCm: v.scene.anatomyFrame.heightCm } } };
}
/** Explicit field projection: never spread an author object into the preview. */
function projectPreview(d: Draft, parts: readonly PartReference[], practicals: readonly PracticalReference[] = []): StudentPreviewData {
 return { name: d.name, policy: { durationSeconds: d.policy.durationSeconds, maxAttempts: d.policy.maxAttempts, gradeVisibility: d.policy.gradeVisibility }, items: d.items.map(item => {
  const base = { schemaVersion: 1 as const, ref: { id: item.id, version: String(d.revision) }, contentLanguage: 'en' as const, prompt: item.prompt };
  if (item.type === 'full-practical') {
   const p = practicals.find(p => p.caseRef.id === item.caseRef.id && p.caseRef.version === item.caseRef.version)!;
   return { ...base, type: 'full-practical' as const, caseRef: { id: p.caseRef.id, version: p.caseRef.version }, practicalView: practicalView(p.view) };
  }
  if (item.type === 'single-choice') return { ...base, type: 'single-choice' as const, options: item.options.map(o => ({ id: o.id, text: o.text })) };
  const p = parts.find(p => p.id === item.partId)!;
  return { ...base, type: 'simulator-part' as const, presentation: { controls: Object.keys(p.view.controls), sceneElements: [] }, view: structuredClone(p.view) };
 }) };
}
export function studentPreview(d: Draft, parts: readonly PartReference[], practicals: readonly PracticalReference[] = []): StudentPreviewData {
 if (draftIssues(d, parts, practicals).length) throw new Error('Invalid draft');
 return projectPreview(d, parts, practicals);
}
