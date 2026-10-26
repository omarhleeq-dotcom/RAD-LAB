/** Opt-in local binding of the existing SQL assignment RPCs. No publication capability. */
import type { AuthoringAdapter, Scope, AssignmentReview, IssuedAssignment, Page, Member } from './contracts';
import { ReviewError } from '../supervisor-review/contracts';
type Call = (name: string, args: unknown[], signal: AbortSignal) => Promise<unknown>;
type Guard = <T>(scope: Scope, signal: AbortSignal, run: () => Promise<T>) => Promise<T>;
const invalid = (): never => { throw new ReviewError('invalid'); };
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : invalid();
const text = (v: unknown) => typeof v === 'string' ? v : invalid();
const id = (v: unknown) => /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(text(v)) ? text(v) : invalid();
const integer = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : invalid();
const date = (v: unknown) => Number.isFinite(Date.parse(text(v))) ? Date.parse(text(v)) : invalid();
function page<T>(v: unknown, row: (r: Record<string, unknown>) => T): Page<T> {
 const p = object(v); if (!Array.isArray(p.rows) || p.rows.length > 20) return invalid();
 return { rows: p.rows.map(r => row(object(r))), next: p.next === null ? null : id(p.next) };
}
export function assignmentActions(call: Call, guarded: Guard, context: AuthoringAdapter['context']) {
 const pending = new Map<string, string>(), reviews = new Map<string, Scope>();
 const key = (s: Scope, draft: string, revision: number) => `${s.actorId}:${s.groupId}:${draft}:${revision}`;
 const owns = (s: Scope, token: string) => { const old = reviews.get(id(token)); if (old?.actorId !== s.actorId || old.groupId !== s.groupId) throw new ReviewError('denied'); };
 const targetPage = (token: string, cursor: string | undefined, signal: AbortSignal) => call('assignment_targets_v1', [id(token), cursor ? id(cursor) : null, 20], signal).then(v => page<Pick<Member, 'id' | 'name'>>(v, r => ({ id: id(r.id), name: text(r.display_name) })));
 const adapter: Pick<AuthoringAdapter, 'assignmentsEnabled' | 'prepare' | 'targets' | 'confirm' | 'assignments' | 'close'> = {
  assignmentsEnabled: true,
  async prepare(scope, draft, signal) {
   return guarded(scope, signal, async () => {
    const started = performance.now(), k = key(scope, id(draft.id), integer(draft.revision));
    if (!pending.has(k)) { if (pending.size >= 5) throw new ReviewError('invalid'); pending.set(k, crypto.randomUUID()); }
    let raw: Record<string, unknown>;
    try { raw = object(await call('assignment_prepare_v1', [scope.groupId, draft.id, draft.revision, pending.get(k)], signal)); }
    catch (e) { if (e instanceof ReviewError && e.reason !== 'offline') pending.delete(k); throw e; }
    if (id(raw.draftId) !== draft.id || integer(raw.draftRevision) !== draft.revision || id(raw.groupId) !== scope.groupId || integer(raw.targetCount) < 1 || integer(raw.targetCount) > 1000) return invalid();
    const token = id(raw.token), expiresAt = date(raw.expiresAt), serverNow = date(raw.serverNow);
    // Read private name from SQL, never trust the browser's draft metadata.
    const stored = object(await call('draft_page_v1', [scope.groupId, draft.id], signal));
    if (integer(stored.revision) !== draft.revision) throw new ReviewError('conflict');
    const ctx = await context(scope, signal), targets = await targetPage(token, undefined, signal);
    const remainingMs = expiresAt - serverNow - (performance.now() - started);
    if (remainingMs <= 0) throw new ReviewError('expired');
    if (reviews.size >= 20) reviews.delete(reviews.keys().next().value!);
    reviews.set(token, { ...scope }); pending.delete(k);
    return { token, draftName: text(object(stored.document).name), draftRevision: draft.revision, groupName: ctx.group.name, groupRevision: integer(raw.groupRevision), targetCount: integer(raw.targetCount), expiresAt, targets, remainingMs, receivedAt: performance.now() } satisfies AssignmentReview;
   });
  },
  async targets(scope, token, cursor, signal) { owns(scope, token); return guarded(scope, signal, () => targetPage(token, cursor, signal)); },
  async confirm(scope, token, signal) { owns(scope, token); await guarded(scope, signal, async () => { id(await call('assignment_confirm_v1', [token], signal)); }); },
  async assignments(scope, cursor, signal) {
   return guarded(scope, signal, async () => page<IssuedAssignment>(await call('assignment_page_v2', [scope.groupId, cursor ? id(cursor) : null, 20], signal), r => ({ id: id(r.id), name: text(r.name), revision: integer(r.revision), closedAt: r.closed_at === null ? null : (date(r.closed_at), text(r.closed_at)) })));
  },
  async close(scope, a, signal) { await guarded(scope, signal, async () => { await call('assignment_close_v2', [id(a.id), integer(a.revision)], signal); }); },
 };
 return { adapter, clear() { pending.clear(); reviews.clear(); } };
}
