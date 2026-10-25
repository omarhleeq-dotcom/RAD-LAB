import { createSyntheticReview } from '../supervisor-review/synthetic';
import { ReviewError } from '../supervisor-review/contracts';
import type { AuthoringAdapter, AssignmentReview, Draft, Member, Page, PartReference, PracticalReference, ReviewFixture, Scenario, Scope } from './contracts';
import { DRAFT_BYTES, draftIssues, separated } from './draft';
const key = (s: Scope) => JSON.stringify([s.actorId, s.groupId]);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Memory only; no storage, fetch, RPC, Supabase, worker or publication conversion. */
export function createAuthoringFixture(parts: readonly PartReference[], options: { delay?: number; now?: () => number; practicals?: readonly PracticalReference[] } = {}): ReviewFixture {
 const membership = createSyntheticReview(options), now = options.now ?? Date.now;
 const drafts = new Map<string, Draft>();
 const plans = new Map<string, { scope: Scope; draft: Draft; groupRevision: number; targets: Member[]; expiresAt: number }>();
 let scenario: Scenario = 'normal';
 const mutation = () => { if (scenario === 'conflict') throw new ReviewError('conflict'); };
 async function context(scope: Scope, signal: AbortSignal) {
  const s = await membership.adapter.read(scope, signal);
  if (!s.appointed || !s.group) throw new ReviewError('denied');
  if (s.group.endsAt <= s.now) throw new ReviewError('expired');
  return { group: s.group, now: s.now, draft: structuredClone(drafts.get(key(scope))) };
 }
 async function targetSnapshot(scope: Scope, signal: AbortSignal) {
  // Adapter-side fixture snapshot, never an all-students DTO. Live implementation requires atomic server paging/snapshot.
  const rows: Member[] = []; let cursor: string | undefined;
  do {
   const s = await membership.adapter.read({ ...scope, membersCursor: cursor }, signal);
   if (!s.appointed || !s.group) throw new ReviewError('denied');
   if (s.group.endsAt <= s.now) throw new ReviewError('expired');
   rows.push(...s.members.rows); cursor = s.members.next ?? undefined;
   if (rows.length > 1000) throw new ReviewError('invalid');
  } while (cursor);
  return rows;
 }
 function saved(scope: Scope, draft: Draft) {
  const value = drafts.get(key(scope));
  if (!value || !same(value, draft)) throw new ReviewError('conflict');
  return value;
 }
 function plan(scope: Scope, token: string) {
  const p = plans.get(token);
  if (!p || !same(p.scope, scope)) throw new ReviewError('denied');
  if (p.expiresAt <= now()) throw new ReviewError('expired');
  saved(scope, p.draft); return p;
 }
 const page = (rows: Member[], cursor?: string): Page<Member> => {
  const offset = cursor === undefined ? 0 : Number(cursor);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset % 20 || offset > rows.length) throw new ReviewError('invalid');
  return { rows: structuredClone(rows.slice(offset, offset + 20)), next: offset + 20 < rows.length ? String(offset + 20) : null };
 };
 const adapter: AuthoringAdapter = {
  accounts: membership.adapter.accounts.filter(p => p.role === 'supervisor'), parts: structuredClone(parts), practicals: structuredClone(options.practicals ?? []),
  async groups(actorId, cursor, signal) { const s = await membership.adapter.read({ actorId, groupsCursor: cursor }, signal); if (!s.appointed) throw new ReviewError('denied'); return s.groups; },
  context,
  async save(scope, draft, signal) {
   await context(scope, signal);
   mutation();
   const old = drafts.get(key(scope));
   if (old && (old.id !== draft.id || old.revision !== draft.revision || (old.track ?? 'mixed') !== (draft.track ?? 'mixed')) || !old && draft.revision !== 0) throw new ReviewError('conflict');
   // Incomplete drafts can be saved locally; downstream preview/assignment require the full validation.
   if (draft.items.some(i => i.type === 'full-practical' && (i.maximum !== undefined || !options.practicals?.some(p => p.caseRef.id === i.caseRef.id && p.caseRef.version === i.caseRef.version && p.evaluatorVersion === i.evaluatorVersion)))) throw new ReviewError('invalid');
   if (!separated(draft) || draft.schemaVersion !== 1 || draft.items.length > 200 || new TextEncoder().encode(JSON.stringify(draft)).length > DRAFT_BYTES) throw new ReviewError('invalid');
   signal.throwIfAborted();
   const result = structuredClone({ ...draft, revision: draft.revision + 1 }); drafts.set(key(scope), result);
   for (const [token, p] of plans) if (same(p.scope, scope)) plans.delete(token);
   return structuredClone(result);
  },
  async prepare(scope, draft, signal) {
   const { group } = await context(scope, signal); saved(scope, draft);
   if (draftIssues(draft, parts, options.practicals).length) throw new ReviewError('invalid');
   mutation();
   const targets = await targetSnapshot(scope, signal);
   if (!targets.length) throw new ReviewError('invalid');
   signal.throwIfAborted();
   const token = crypto.randomUUID(), expiresAt = Math.min(now() + 300000, group.endsAt);
   plans.set(token, { scope: { ...scope }, draft: structuredClone(draft), groupRevision: group.revision, targets, expiresAt });
   return { token, draftName: draft.name, draftRevision: draft.revision, groupName: group.name, groupRevision: group.revision, targetCount: targets.length, expiresAt, targets: page(targets) } satisfies AssignmentReview;
  },
  async targets(scope, token, cursor, signal) {
   await context(scope, signal); const p = plan(scope, token); return page(p.targets, cursor);
  },
  async confirm(scope, token, signal) {
   const { group } = await context(scope, signal), p = plan(scope, token);
   mutation();
   const current = await targetSnapshot(scope, signal);
   if (group.revision !== p.groupRevision || !same(current, p.targets)) throw new ReviewError('conflict');
   signal.throwIfAborted();
   // Receipt only. No attempt, publication, installation, target delivery or live assignment is created.
   plans.delete(token);
  },
 };
 return { adapter, membership: membership.adapter, scenario(value) { scenario = value; membership.scenario(value); }, expire: membership.expire, revoke: membership.revoke };
}
