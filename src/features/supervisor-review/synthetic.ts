import { ReviewError, type Command, type Group, type JoinRequest, type Member, type Page, type Person, type Query, type Result, type ReviewAdapter } from './contracts';
const PAGE = 20;
const empty = <T>(): Page<T> => ({ rows: [], next: null });
function page<T>(rows: T[], cursor?: string): Page<T> {
 const offset = cursor ? Number(cursor) : 0;
 if (!Number.isSafeInteger(offset) || offset < 0) throw new ReviewError('invalid');
 return { rows: rows.slice(offset, offset + PAGE), next: offset + PAGE < rows.length ? String(offset + PAGE) : null };
}
/** Entirely in memory. No storage, network, pilot client, auth or real user data. */
export function createSyntheticReview(options: { delay?: number; now?: () => number } = {}) {
 const clock = options.now ?? Date.now, start = clock(), day = 86400000;
 let serial = 0, timeShift = 0;
 const id = () => `fixture-${++serial}`;
 const accounts: Person[] = [
  { id: id(), name: 'Owner · المالك', role: 'owner' },
  ...['A', 'B'].map(label => ({ id: id(), name: `Supervisor ${label} · مشرف`, role: 'supervisor' as const })),
  ...Array.from({ length: 24 }, (_, n) => ({ id: id(), name: `Student ${n + 1} · طالب`, role: 'student' as const })),
 ];
 const owner = accounts[0]!, first = accounts[1]!, second = accounts[2]!, students = accounts.slice(3);
 const appointments = new Set([first.id, second.id]);
 const groups: Group[] = [first, second].map((p, n) => ({ id: id(), name: `Synthetic group ${n + 1} · مجموعة اصطناعية`, supervisorId: p.id, startsAt: start - day, supervisedFrom: start - day, endsAt: start + day * 7, revision: 1 }));
 const memberships = new Map<string, Member[]>();
 groups.forEach(g => memberships.set(g.id, students.map(p => ({ id: p.id, name: p.name, joinedAt: start - day / 2 }))));
 const requests: JoinRequest[] = [];
 const results: Result[] = groups.flatMap(g => students.flatMap(p => [
  { id: id(), studentId: p.id, kind: 'practice' as const, at: start - 1000, score: '7 / 10', visibleUntil: start + day },
  { id: id(), studentId: p.id, kind: 'exam' as const, at: start - 500, score: '4 / 5', groupId: g.id, supervisorId: g.supervisorId, visibleUntil: start + day },
  { id: id(), studentId: p.id, kind: 'practice' as const, at: start - day * 2, score: 'OLD · hidden', visibleUntil: start + day },
 ]));
 const codes = new Map<string, string>();
 let scenario: 'normal' | 'offline' | 'slow' | 'conflict' = 'normal';
 const now = () => clock() + timeShift;
 async function pause(signal: AbortSignal) {
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
   const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
   const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, scenario === 'slow' ? 1500 : options.delay ?? 40);
   signal.addEventListener('abort', abort, { once: true });
  });
  signal.throwIfAborted();
  if (scenario === 'offline') throw new ReviewError('offline');
 }
 const person = (actor: string) => { const p = accounts.find(p => p.id === actor); if (!p) throw new ReviewError('denied'); return p; };
 function managed(actor: string, groupId: string) {
  const g = groups.find(g => g.id === groupId);
  if (!g || g.supervisorId !== actor || !appointments.has(actor)) throw new ReviewError('denied');
  if (g.endsAt <= now()) throw new ReviewError('expired');
  return g;
 }
 const adapter: ReviewAdapter = {
  accounts,
  async read(q: Query, signal: AbortSignal) {
   await pause(signal); const p = person(q.actorId);
   const visibleGroups = groups.filter(g => p.role === 'student' ? (memberships.get(g.id)?.some(m => m.id === p.id) || requests.some(r => r.groupId === g.id && r.studentId === p.id)) : p.role === 'supervisor' && g.supervisorId === p.id && appointments.has(p.id));
   const group = visibleGroups.find(g => g.id === q.groupId);
   const active = group && group.endsAt > now() && (p.role === 'student' || appointments.has(p.id));
   const members = active && p.role === 'supervisor' ? memberships.get(group.id) ?? [] : [];
   const visibleResults = active && p.role === 'supervisor' ? results.filter(r => {
    const member = members.find(m => m.id === r.studentId);
    return member && r.at >= Math.max(member.joinedAt, group.startsAt, group.supervisedFrom) && r.visibleUntil > now() && (r.kind === 'practice' || (r.groupId === group.id && r.supervisorId === p.id));
   }) : [];
   return structuredClone({ now: now(), appointed: appointments.has(p.id), isMember: !!group && !!memberships.get(group.id)?.some(m => m.id === p.id), people: p.id === owner.id ? page(accounts.filter(a => a.role === 'supervisor').map(a => ({ ...a, appointed: appointments.has(a.id) })), q.peopleCursor) : empty(), groups: page(visibleGroups, q.groupsCursor), group,
    requests: page(requests.filter(r => p.role === 'student' ? r.studentId === p.id : active && r.groupId === group.id && p.role === 'supervisor'), q.requestsCursor),
    members: page(members, q.membersCursor), results: page(visibleResults, q.resultsCursor), visibilityUntil: active ? Math.min(group.endsAt, ...visibleResults.map(r => r.visibleUntil)) : Infinity });
  },
  async execute(actorId: string, command: Command, signal: AbortSignal) {
   await pause(signal); const p = person(actorId), c = command;
   if (scenario === 'conflict') throw new ReviewError('conflict');
   if (c.kind === 'appoint' || c.kind === 'revoke') {
    if (p.id !== owner.id || person(c.personId).role !== 'supervisor') throw new ReviewError('denied');
    if (c.kind === 'appoint') {
     if (!appointments.has(c.personId)) for (const g of groups) if (g.supervisorId === c.personId) { g.supervisedFrom = now(); g.revision++; }
     appointments.add(c.personId);
    } else appointments.delete(c.personId);
   } else if (c.kind === 'create') {
    if (p.role !== 'supervisor' || !appointments.has(p.id)) throw new ReviewError('denied');
    if (!c.name.trim() || c.name.length > 100 || !Number.isFinite(c.endsAt) || c.endsAt <= now()) throw new ReviewError('invalid');
    const g = { id: id(), name: c.name.trim(), supervisorId: p.id, startsAt: now(), supervisedFrom: now(), endsAt: c.endsAt, revision: 1 };
    groups.push(g); memberships.set(g.id, []);
    const code = `DEMO-${id().toUpperCase()}`; codes.set(code, g.id); return { code };
   } else if (c.kind === 'rotate' || c.kind === 'end') {
    const g = managed(p.id, c.groupId);
    if (g.revision !== c.revision) throw new ReviewError('conflict');
    g.revision++;
    for (const [code, groupId] of codes) if (groupId === g.id) codes.delete(code);
    if (c.kind === 'end') g.endsAt = now();
    else { const code = `DEMO-${id().toUpperCase()}`; codes.set(code, g.id); return { code }; }
   } else if (c.kind === 'join') {
    if (p.role !== 'student') throw new ReviewError('denied');
    const groupId = codes.get(c.code.trim().toUpperCase());
    const g = groups.find(g => g.id === groupId);
    if (!g || g.endsAt <= now() || !appointments.has(g.supervisorId)) throw new ReviewError('invalid');
    if (memberships.get(g.id)?.some(m => m.id === p.id)) throw new ReviewError('conflict');
    if (!requests.some(r => r.groupId === g.id && r.studentId === p.id && r.status === 'pending')) requests.push({ id: id(), groupId: g.id, studentId: p.id, status: 'pending', revision: 1 });
   } else if (c.kind === 'leave') {
    if (p.role !== 'student') throw new ReviewError('denied');
    memberships.set(c.groupId, (memberships.get(c.groupId) ?? []).filter(m => m.id !== p.id));
   } else if (c.kind === 'approve' || c.kind === 'reject' || c.kind === 'cancel') {
    const r = requests.find(r => r.id === c.requestId);
    if (!r || r.status !== 'pending' || r.revision !== c.revision) throw new ReviewError('conflict');
    if (c.kind === 'cancel') { if (r.studentId !== p.id) throw new ReviewError('denied'); r.status = 'cancelled'; }
    else { managed(p.id, r.groupId); r.status = c.kind === 'approve' ? 'approved' : 'rejected';
     if (r.status === 'approved') memberships.get(r.groupId)!.push({ id: r.studentId, name: person(r.studentId).name, joinedAt: now() });
    }
    r.revision++;
   }
   return {};
  },
 };
 return { adapter, scenario(value: typeof scenario) { scenario = value; }, expire() { timeShift += day * 8; }, revoke(actorId: string) { appointments.delete(actorId); } };
}
