import { knownSharingPolicy } from './sharing-policy';
import { ReviewError, type Command, type Group, type JoinRequest, type Page, type Person, type Query, type ReviewAdapter, type Snapshot } from './contracts';

/** Bound to one authenticated session by the host. Actor IDs are never RPC arguments.
 * The local harness binds this to a synthetic PostgreSQL session, not a provider URL.
 * No retries: an uncertain mutation ACK requires refresh before an explicit retry.
 */
export interface ScopeTransport {
 rpc(name: string, args: unknown[], signal: AbortSignal): Promise<unknown>;
 appointment?(appointed: boolean): void;
 subscribe?(invalidate: () => void): () => void;
}
const blank = <T>(): Page<T> => ({ rows: [], next: null });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function invalid(): never { throw new ReviewError('offline'); }
function object(value: unknown): Record<string, unknown> {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
 return value as Record<string, unknown>;
}
function str(value: unknown): string { return typeof value === 'string' ? value : invalid(); }
function name(value: unknown): string | undefined { return value == null ? undefined : str(value).trim() || undefined; }
function id(value: unknown): string { const v = str(value); return uuid.test(v) ? v : invalid(); }
function num(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : invalid(); }
function integer(value: unknown): number { const n = num(value); return Number.isSafeInteger(n) && n >= 0 ? n : invalid(); }
function time(value: unknown): number { const n = Date.parse(str(value)); return Number.isFinite(n) ? n : invalid(); }
function page<T>(value: unknown, row: (r: Record<string, unknown>) => T): Page<T> {
 const p = object(value);
 if (p.version !== 1 || !Array.isArray(p.rows) || p.rows.length > 20) return invalid();
 return { rows: p.rows.map(r => row(object(r))), next: p.next === null ? null : id(p.next), ...(p.total == null ? {} : { total: integer(p.total) }) };
}
function group(r: Record<string, unknown>): Group {
 return { id: id(r.id), name: str(r.name), supervisorId: id(r.supervisor_id), startsAt: time(r.starts_at), endsAt: time(r.ends_at), supervisedFrom: time(r.supervised_from), revision: integer(r.revision) };
}
function request(r: Record<string, unknown>, self: Person, groupId?: string): JoinRequest {
 const status = str(r.state);
 if (!['pending', 'approved', 'rejected', 'cancelled'].includes(status)) return invalid();
 return { id: id(r.id), groupId: groupId ?? id(r.group_id), studentId: r.user_id === undefined ? self.id : id(r.user_id), studentName: name(r.display_name), groupName: name(r.group_name), status: status as JoinRequest['status'], revision: integer(r.revision) };
}
export function createSqlReview(self: Person, transport: ScopeTransport): ReviewAdapter {
 let epoch = 0;
 let codeGroupId: string | undefined;
 const listeners = new Set<() => void>();
 // Subscription is installed only while a view is mounted; no polling or background connection.
 let release: (() => void) | undefined;
 const invalidate = () => { epoch++; for (const listener of listeners) listener(); };
 async function call(name: string, args: unknown[], signal: AbortSignal) {
  signal.throwIfAborted();
  try { const result = await transport.rpc(name, args, signal); signal.throwIfAborted(); return result; }
  catch (error) {
   signal.throwIfAborted();
   const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
   throw new ReviewError(code === '42501' ? 'denied' : code === '40001' || code === '23505' ? 'conflict' : code === '55000' ? 'expired' : code.startsWith('22') || code === '54000' ? 'invalid' : 'offline');
  }
 }
 const scope = (kind: string, groupId: string | undefined, after: string | undefined, signal: AbortSignal) => call('scope_page_v1', [kind, groupId ?? null, after ?? null, 20], signal);
 function actor(actorId: string) { if (actorId !== self.id) throw new ReviewError('denied'); }
 return {
  accounts: [self],
  async readAppointment(personId, signal) {
   if (self.role !== 'owner') throw new ReviewError('denied');
   // RAD085-OWNER-APPOINT-PICKER-20261028: exact UUID lookup using the existing
   // exclusive UUID cursor and limit 1; never scan/accumulate appointment pages.
   const target = id(personId).toLowerCase(), value = BigInt('0x' + target.replaceAll('-', ''));
   const hex = value === 0n ? null : (value - 1n).toString(16).padStart(32, '0');
   const after = hex === null ? null : `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
   const result = page(await call('scope_page_v1', ['appointments', null, after, 1], signal), r => ({ id: id(r.id).toLowerCase(), appointed: r.revoked_at === null }));
   if (result.rows.length > 1 || (result.rows[0] && result.rows[0].id < target)) return invalid();
   return result.rows[0]?.id === target && result.rows[0].appointed;
  },
  subscribe(listener) {
   listeners.add(listener);
   if (listeners.size === 1) release = transport.subscribe?.(invalidate);
   return () => { listeners.delete(listener); if (!listeners.size) { release?.(); release = undefined; } };
  },
  async read(q: Query, signal): Promise<Snapshot> {
   actor(q.actorId); const started = performance.now(), generation = epoch, receiptGroup = codeGroupId;
   codeGroupId = undefined;
   const data: Snapshot = { service: 'sql', now: 0, appointed: null, isMember: null, people: blank(), groups: blank(), requests: blank(), members: blank(), results: blank(), visibilityUntil: Infinity };
   let boundary = Infinity;
   const observe = (raw: unknown) => {
    const p = object(raw), serverNow = time(p.serverNow);
    data.now = Math.max(data.now, serverNow);
    if (self.role === 'supervisor' && typeof p.appointed === 'boolean') { data.appointed = p.appointed; transport.appointment?.(p.appointed); }
    if (p.visibleUntil !== null) boundary = Math.min(boundary, time(p.visibleUntil) - serverNow);
    return raw;
   };
   if (self.role === 'owner') {
    data.people = page(observe(await scope('appointments', undefined, q.peopleCursor, signal)), r => ({ id: id(r.id), name: name(r.display_name) ?? '', role: 'supervisor', appointed: r.revoked_at === null }));
   } else if (self.role === 'student') {
    const policy = object(await call('sharing_consent_v1', [], signal));
    const known = knownSharingPolicy(policy.version, policy.textDigest);
    data.sharing = known && policy.accepted === true;
    if (typeof policy.version === 'string' && typeof policy.textDigest === 'string') data.sharingPolicy = { version: policy.version, digest: policy.textDigest, known };
    data.requests = page(observe(await scope('my-requests', undefined, q.requestsCursor, signal)), r => request(r, self));
   } else {
    data.groups = page(observe(await scope('groups', undefined, q.groupsCursor, signal)), group);
    data.group = data.groups.rows.find(g => g.id === q.groupId);
    if (q.groupId && !data.group) throw new ReviewError('denied');
    if (data.group) {
     data.appointed = true; boundary = Math.min(boundary, data.group.endsAt - data.now);
     data.requests = page(observe(await scope('requests', q.groupId, q.requestsCursor, signal)), r => request(r, self, q.groupId));
     data.members = page(observe(await scope('members', q.groupId, q.membersCursor, signal)), r => ({ id: id(r.id), name: name(r.display_name) ?? '', joinedAt: time(r.visible_from) }));
     data.results = page(observe(await scope('practice', q.groupId, q.resultsCursor, signal)), r => ({ id: id(r.id), studentId: id(r.user_id), studentName: name(r.display_name), kind: 'practice', at: time(r.recorded_at), score: r.score === null ? '—' : String(num(r.score)), visibleUntil: data.group!.endsAt }));
     // Every read is a separate short RPC transaction. Recheck the group's generation
     // after assembling the pages; never present a mixture across a membership change.
     const final = page(observe(await scope('groups', undefined, q.groupsCursor, signal)), group).rows.find(g => g.id === q.groupId);
     if (!final) throw new ReviewError('denied');
     if (final.revision !== data.group.revision) throw new ReviewError('conflict');
    }
   }
   // A newly created group can lie outside the current UUID page. Validate the
   // receipt's exact group through the existing scoped read, without scanning pages.
   if (self.role === 'supervisor' && receiptGroup) {
    if (data.group?.id !== receiptGroup) observe(await scope('members', receiptGroup, undefined, signal));
    data.codeGroupId = receiptGroup;
   }
   signal.throwIfAborted(); if (generation !== epoch) throw new ReviewError('denied');
   data.visibilityUntil = data.now + boundary - (performance.now() - started);
   if (data.visibilityUntil <= data.now) throw new ReviewError('expired');
   return data;
  },
  async execute(actorId: string, c: Command, signal) {
   actor(actorId); codeGroupId = undefined; invalidate();
   try {
    if (c.kind === 'sharing') {
     if (self.role !== 'student' || (c.accept && !knownSharingPolicy(c.version, c.digest))) throw new ReviewError('denied');
     const r = object(await call('sharing_consent_v1', [c.version, c.digest, c.accept], signal));
     if (c.accept && (!knownSharingPolicy(r.version, r.textDigest) || r.accepted !== true)) throw new ReviewError('expired');
     if (!c.accept && r.accepted !== false) return invalid();
    } else if (c.kind === 'appoint' || c.kind === 'revoke') await call('appointment_v1', [c.personId, c.kind === 'appoint'], signal);
    else if (c.kind === 'create' || c.kind === 'rotate' || c.kind === 'end' || c.kind === 'revoke-code') {
     const r = object(await call('supervisor_group_v1', c.kind === 'create' ? ['create', null, null, c.name, new Date(c.endsAt).toISOString()] : [c.kind, c.groupId, c.revision], signal));
     if (r.code != null) { const code = str(r.code); if (!/^[0-9A-HJKMNP-TV-Z]{8}$/.test(code)) return invalid(); codeGroupId = id(r.id); return { code, groupId: codeGroupId }; }
    } else if (c.kind === 'join') {
     const r = object(await call('join_request_v1', [c.code.trim()], signal));
     if (r.outcome === 'unavailable') throw new ReviewError('invalid');
     if (r.outcome !== 'pending' && r.outcome !== 'member') return invalid();
    } else if (c.kind === 'leave') await call('group_leave_v1', [c.groupId], signal);
    else if (c.kind === 'cancel' || c.kind === 'approve' || c.kind === 'reject') await call('join_decide_v1', [c.requestId, c.revision, c.kind], signal);
    else throw new ReviewError('invalid');
    return {};
   } finally { invalidate(); }
  },
 };
}
