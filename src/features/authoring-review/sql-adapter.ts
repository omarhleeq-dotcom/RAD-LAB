import type { AuthoringAdapter, Draft, DraftReference, DraftSummary, Group, Page, PartReference, Person, PracticalReference, Scope, SqlDraft } from './contracts';
import { separated } from './draft';
import { ReviewError } from '../supervisor-review/contracts';
import type { ScopeTransport } from '../supervisor-review/sql-adapter';
import { assignmentActions } from './sql-assignments';
import { draftToV2 } from '../assess/import-validator';
import { validateProvenanceV2 } from '../assess/provenance-v2';

const invalid = (): never => { throw new ReviewError('invalid'); };
const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : invalid();
const text = (v: unknown): string => typeof v === 'string' ? v : invalid();
const id = (v: unknown) => /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(text(v)) ? text(v) : invalid();
const revision = (v: unknown): number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 && v <= 100 ? v : invalid();
const time = (v: unknown) => { const n = Date.parse(text(v)); return Number.isFinite(n) ? n : invalid(); };
const track = (v: unknown): NonNullable<Draft['track']> => v === 'mixed' || v === 'full-practical' ? v : invalid();
function page<T>(value: unknown, row: (v: Record<string, unknown>) => T): Page<T> {
 const p = record(value);
 if (!Array.isArray(p.rows) || p.rows.length > 20) return invalid();
 return { rows: p.rows.map(v => row(record(v))), next: p.next === null ? null : id(p.next) };
}
/** Registry revisions are supplied by the host's pinned test catalogue, never inferred
 * from source/licence notes. SQL reauthorizes every reference independently. */
export function draftToSql(d: Draft, references: readonly DraftReference[]): SqlDraft {
 if (!separated(d)) return invalid();
 const keys = new Set(d.items.flatMap(i => i.type === 'simulator-part' ? [i.partId] : i.type === 'full-practical' ? [i.caseRef.id] : []));
 const refs = [...keys].map(key => {
  const ref = references.find(r => r.key === key);
  if (!ref) throw new ReviewError('expired');
  return { key: ref.key, revision: ref.revision };
 });
 return { document: { ...structuredClone(d), track: d.track ?? 'mixed' }, refs };
}
function receipt(value: unknown): Draft {
 const r = record(value), d = record(r.document);
 if (id(r.id) !== id(d.id) || revision(r.revision) !== revision(d.revision) || d.schemaVersion !== 1 || !Array.isArray(d.items) || !Array.isArray(r.refs)) return invalid();
 track(d.track); text(d.name); record(d.policy);
 const draft = d as unknown as Draft;
 if (!separated(draft)) return invalid();
 return structuredClone(draft);
}

function receiptV2(value: unknown): Draft {
 const r = record(value), d = record(r.document);
 if (d.schemaVersion !== 2 || d.track !== 'mixed' || id(r.id) !== id(d.id) || revision(r.revision) !== revision(d.revision) || !Array.isArray(d.items) || !Array.isArray(r.refs) || r.refs.length) return invalid();
 const items = d.items.map(raw => {
  const i = record(raw), provenance = validateProvenanceV2(i.provenance, 'single-choice', true);
  if (i.type !== 'single-choice' || provenance.kind !== 'uploader-authored' || provenance.sources.length !== 1 || !Array.isArray(i.options) || (i.shuffleOptions !== undefined && typeof i.shuffleOptions !== 'boolean')) return invalid();
  return { id: text(i.id), type: 'single-choice' as const, prompt: text(i.prompt), maximum: text(i.maximum), options: i.options.map(raw => { const o = record(raw); return { id: text(o.id), text: text(o.text) }; }), correctOptionId: text(i.correctOptionId), shuffleOptions: (i.shuffleOptions as boolean | undefined) ?? true, authoring: { author: '', reference: provenance.sources[0]!.reference, licenceNotes: provenance.licenceNotes, notes: '' } };
 });
 const policy = record(d.policy);
 if (!(policy.durationSeconds === null || typeof policy.durationSeconds === 'number') || typeof policy.maxAttempts !== 'number' || !['hidden', 'after-submission'].includes(String(policy.gradeVisibility))) return invalid();
 const draft: Draft = { schemaVersion: 1, track: 'mixed', id: id(d.id), revision: revision(d.revision), name: text(d.name), policy: { durationSeconds: policy.durationSeconds, maxAttempts: policy.maxAttempts, gradeVisibility: policy.gradeVisibility as 'hidden' | 'after-submission' }, items, ...(d.randomPool === undefined ? {} : { randomPool: d.randomPool as Draft['randomPool'] }) };
 draftToV2(draft);
 return draft;
}
/** Opt-in v2 authoring; legacy v1 callers and assignment capability remain unchanged. */
export function createSqlAuthoringV2(self: Person, transport: ScopeTransport): AuthoringAdapter {
 return createSqlAuthoring(self, transport, { parts: [], practicals: [], references: [] }, false, true);
}

export function createSqlAuthoring(self: Person, transport: ScopeTransport, catalog: { parts: readonly PartReference[]; practicals: readonly PracticalReference[]; references: readonly DraftReference[] }, assignmentsEnabled = false, v2 = false): AuthoringAdapter {
 let epoch = 0, release: (() => void) | undefined;
 const listeners = new Set<() => void>(), cursors = new Map<string, string | undefined>();
 const invalidate = () => { epoch++; cursors.clear(); actions?.clear(); for (const fn of listeners) fn(); };
 function actor(actorId: string) { if (actorId !== self.id || (self.role !== 'supervisor' && !(v2 && self.role === 'owner'))) throw new ReviewError('denied'); }
 async function call(name: string, args: unknown[], signal: AbortSignal) {
  signal.throwIfAborted(); const generation = epoch;
  try {
   const value = await transport.rpc(name, args, signal);
   signal.throwIfAborted(); if (generation !== epoch) throw new ReviewError('denied');
   return value;
  } catch (e) {
   signal.throwIfAborted(); if (generation !== epoch) throw new ReviewError('denied');
   if (e instanceof ReviewError) throw e;
   const code = e && typeof e === 'object' && 'code' in e ? String(e.code) : '';
   if (code === '42501') invalidate();
   throw new ReviewError(code === '42501' ? 'denied' : code === '40001' || code === '23505' ? 'conflict' : code === '55000' ? 'expired' : code.startsWith('22') || code === '54000' ? 'invalid' : 'offline');
  }
 }
 async function groupPage(cursor: string | undefined, signal: AbortSignal) {
  const raw = record(await call('scope_page_v1', ['groups', null, cursor ?? null, 20], signal));
  const groups = page(raw, r => ({ id: id(r.id), name: text(r.name), supervisorId: id(r.supervisor_id), startsAt: time(r.starts_at), endsAt: time(r.ends_at), supervisedFrom: time(r.supervised_from), revision: Number(r.revision) } satisfies Group));
  return { groups, now: time(raw.serverNow) };
 }
 async function context(scope: Scope, signal: AbortSignal) {
  actor(scope.actorId); const started = performance.now();
  if (!cursors.has(scope.groupId)) throw new ReviewError('denied');
  const { groups, now } = await groupPage(cursors.get(scope.groupId), signal), group = groups.rows.find(g => g.id === scope.groupId);
  if (!group) { invalidate(); throw new ReviewError('denied'); }
  if (group.endsAt - (performance.now() - started) <= now) throw new ReviewError('expired');
  // Charge the entire round-trip against the server's remaining visibility window.
  return { group: { ...group, endsAt: group.endsAt - (performance.now() - started) }, now };
 }
 async function guarded<T>(scope: Scope, signal: AbortSignal, run: () => Promise<T>) {
  const generation = epoch; const before = await context(scope, signal);
  const result = await run(); const after = await context(scope, signal);
  if (generation !== epoch) throw new ReviewError('denied');
  if (before.group.revision !== after.group.revision) throw new ReviewError('conflict');
  return result;
 }
 const disabled = async (): Promise<never> => { throw new ReviewError('denied'); };
 const actions = assignmentsEnabled ? assignmentActions(call, guarded, context) : undefined;
 return {
  service: 'sql', ...(v2 ? { authoringVersion: 2 as const } : {}), accounts: [self], parts: catalog.parts, practicals: catalog.practicals,
  subscribe(fn) { listeners.add(fn); if (listeners.size === 1) release = transport.subscribe?.(invalidate); return () => { listeners.delete(fn); if (!listeners.size) { release?.(); release = undefined; } }; },
  async groups(actorId, cursor, signal) {
   actor(actorId); const { groups } = await groupPage(cursor, signal);
   cursors.clear(); for (const g of groups.rows) cursors.set(g.id, cursor);
   return groups;
  },
  context,
  async drafts(scope, cursor, signal) {
   return guarded(scope, signal, async () => page(await call(v2 ? 'draft_page_v2' : 'draft_page_v1', [scope.groupId, null, cursor ?? null, 20], signal), r => ({ id: id(r.id), revision: revision(r.revision), name: text(r.name), track: track(r.track) } satisfies DraftSummary)));
  },
  async open(scope, draftId, signal) {
   return guarded(scope, signal, async () => { const d = (v2 ? receiptV2 : receipt)(await call(v2 ? 'draft_page_v2' : 'draft_page_v1', [scope.groupId, id(draftId)], signal)); if (d.id !== draftId) return invalid(); return d; });
  },
  async save(scope, draft, signal) {
   const { document, refs } = v2 ? { document: draftToV2(draft), refs: [] } : draftToSql(draft, catalog.references);
   return guarded(scope, signal, async () => { const d = (v2 ? receiptV2 : receipt)(await call(v2 ? 'draft_save_v2' : 'draft_save_v1', [scope.groupId, id(draft.id), revision(draft.revision), JSON.stringify(document), JSON.stringify(refs)], signal)); if (d.id !== draft.id || d.track !== document.track || d.revision !== draft.revision + 1) return invalid(); return d; });
  },
  prepare: disabled, targets: disabled, confirm: disabled,
  ...(actions ? actions.adapter : {}),
 };
}
