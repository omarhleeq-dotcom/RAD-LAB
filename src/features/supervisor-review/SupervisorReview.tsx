import { SharingConsent } from './SharingConsent';
import { useState, type ReactNode } from 'react';
import type { Command, Page, Person, Query, Snapshot } from './contracts';
import type { ReviewCopy } from './copy';
export const control = 'min-h-11 max-w-full rounded-md border border-line bg-panel px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60';
function List<T>({ title, page, children, next, first, t }: { title: string; page: Page<T>; children: (item: T, index: number) => ReactNode; next: () => void; first: () => void; t: ReviewCopy }) {
 return <section className="space-y-3 rounded-xl border border-line bg-panel p-4"><h2 className="text-xl font-semibold">{title}</h2>{page.total !== undefined && <p>{t.total}: {page.total}</p>}{page.rows.length ? <ul className="space-y-3">{page.rows.map((r, i) => <li className="space-y-2 border-b border-line pb-3" key={i}>{children(r, i)}</li>)}</ul> : <p>{t.empty}</p>}<div className="flex flex-wrap gap-2"><button className={control} onClick={first}>{t.first}</button><button className={control} disabled={!page.next} onClick={next}>{t.next}</button></div></section>;
}
export function SupervisorReview({ t, actor, data, act, paging, selectGroup, confirming, confirm, cancel, locale, ownerAppointments }: { ownerAppointments?: (act: (command: Command) => void) => ReactNode; t: ReviewCopy; actor: Person; data: Snapshot; act: (c: Command) => void; paging: (key: keyof Query, value?: string) => void; selectGroup: (id: string) => void; confirming?: Command; confirm: () => void; cancel: () => void; locale: string }) {
 const stamp = (at: number) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(at);
 const list = <T,>(title: string, page: Page<T>, key: keyof Query, render: (item: T, index: number) => ReactNode) => <List title={title} page={page} next={() => paging(key, page.next ?? undefined)} first={() => paging(key)} t={t}>{render}</List>;
 const g = data.group;
 const safeName = (name?: string) => name && name.trim() && !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(name) ? name : undefined;
 const studentName = (id: string, i: number) => safeName(data.members.rows.find(m => m.id === id)?.name) ?? t.studentNumber.replace('{n}', String(i + 1));
 const groupName = (id: string) => data.groups.rows.find(item => item.id === id)?.name ?? t.requestGroup;

 return <div className="space-y-5">
  {confirming && <section role="alert" className="space-y-3 rounded-xl border border-line p-4"><p>{confirming.kind === 'revoke' ? t.confirmRevoke : confirming.kind === 'leave' ? t.confirmLeave : confirming.kind === 'revoke-code' ? t.revokeCode : t.confirmEnd}</p><div className="flex flex-wrap gap-2"><button autoFocus className={control} onClick={confirm}>{confirming.kind === 'revoke' ? t.confirmRevoke : confirming.kind === 'leave' ? t.confirmLeave : confirming.kind === 'revoke-code' ? t.revokeCode : t.confirmEnd}</button><button className={control} onClick={cancel}>{t.cancelAction}</button></div></section>}
  {actor.role === 'owner' && data.service === 'sql' && ownerAppointments?.(act)}
  {actor.role === 'owner' && list(t.owner, data.people, 'peopleCursor', (p, i) => <><p>{safeName(p.name) ?? t.studentNumber.replace('{n}', String(i + 1))}</p><p className="break-all text-sm text-muted"><bdi>{p.id}</bdi></p>{data.service === 'sql' && !p.appointed ? <p>{t.revoked}</p> : <button className={control} onClick={() => act({ kind: p.appointed ? 'revoke' : 'appoint', personId: p.id })}>{p.appointed ? t.revoke : t.appoint}</button>}</>)}
  {actor.role === 'supervisor' && data.appointed === false && <p role="alert">{t.revoked}</p>}
  {actor.role === 'student' && <section className="space-y-3"><h2 className="text-xl font-semibold">{t.stepSharing}</h2><p>{t.withdrawHelp}</p>{data.service === 'sql' && <SharingConsent data={data} locale={locale} act={act}/>}</section>}
  {actor.role === 'student' && data.sharing === false && <p role="alert">{t.sharingClosed}</p>}
  {actor.role === 'student' && <h2 className="text-xl font-semibold">{t.stepCode}</h2>}
  {actor.role === 'student' && data.sharing !== false && <form className="space-y-3 rounded-xl border border-line bg-panel p-4" onSubmit={e => { e.preventDefault(); act({ kind: 'join', code: String(new FormData(e.currentTarget).get('code')) }); }}><label className="block">{t.enter}<input className={`${control} mt-1 block w-full`} name="code" required maxLength={100} autoComplete="off" dir="ltr"/></label><button className={control}>{t.join}</button><p>{t.codeHint}</p></form>}
  {actor.role !== 'owner' && (actor.role !== 'student' || data.groups.rows.length > 0) && list(t.choose, data.groups, 'groupsCursor', item => <article className="space-y-2 rounded-xl border border-line p-3"><h3 className="break-words font-semibold">{item.name}</h3><p className="text-sm">{t.created}: <bdi>{stamp(item.startsAt)}</bdi></p><p className="text-sm">{t.ends}: <bdi>{stamp(item.endsAt)}</bdi></p><p className="break-all text-sm text-muted">{t.groupReference}: <bdi>{item.id}</bdi></p>{g?.id === item.id && <p>{t.requests}: {data.requests.next ? t.pageCount : ''}{data.requests.rows.filter(r => r.status === 'pending').length} · {t.members}: {data.members.total ?? data.members.rows.length}</p>}<button aria-label={item.name} aria-pressed={g?.id === item.id} className={control} onClick={() => selectGroup(item.id)}>{item.name}</button></article>)}
  {actor.role === 'supervisor' && data.appointed !== false && <details className="rounded-xl border border-line p-3"><summary className="min-h-11 cursor-pointer font-semibold">{t.create}</summary><form className="space-y-3 rounded-xl border border-line bg-panel p-4" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); act({ kind: 'create', name: String(form.get('name')), endsAt: Date.parse(String(form.get('ends')) + 'Z') }); }}><h2 className="text-xl font-semibold">{t.create}</h2><label className="block">{t.name}<input className={`${control} mt-1 block w-full`} name="name" required maxLength={100}/></label><label className="block">{t.ends}<input className={`${control} mt-1 block w-full`} type="datetime-local" name="ends" required /></label><button className={control}>{t.create}</button><p className="text-sm text-muted">{t.groupHint}</p></form></details>}
  {g && <header className="space-y-2"><h2 className="break-words text-2xl font-semibold">{g.name}</h2><nav aria-label={t.groupSections} className="flex flex-wrap gap-3">{['requests', 'members', 'results', 'settings'].map(key => <a className="min-h-11 underline" href={`#p1-${key}`} key={key}>{t[key as 'requests' | 'members' | 'results' | 'settings']}</a>)}</nav></header>}
  {actor.role === 'supervisor' && !g && data.appointed !== false && <p role="status">{t.selectGroupHint}</p>}
  {(actor.role === 'student' || (actor.role === 'supervisor' && g)) && <div id="p1-requests">{actor.role === 'student' && <h2 className="text-xl font-semibold">{t.stepStatus}</h2>}{list(t.requests, data.requests, 'requestsCursor', (r, i) => <><p>{actor.role === 'supervisor' && <>{studentName(r.studentId, i)} · </>}{t[r.status]}</p><p className="text-sm text-muted">{t.requestGroup}: {groupName(r.groupId)}</p>{data.service === 'sql' && actor.role === 'student' && r.status === 'approved' && <button className={control} onClick={() => act({ kind: 'leave', groupId: r.groupId })}>{t.leave}</button>}{r.status === 'pending' && <div className="flex flex-wrap gap-2">{actor.role === 'supervisor' ? <><button className={control} onClick={() => act({ kind: 'approve', requestId: r.id, revision: r.revision })}>{t.approve}</button><button className={control} onClick={() => act({ kind: 'reject', requestId: r.id, revision: r.revision })}>{t.reject}</button></> : <button className={control} onClick={() => act({ kind: 'cancel', requestId: r.id, revision: r.revision })}>{t.cancel}</button>}</div>}</>)}</div>}
  {actor.role === 'student' && <p>{t.leaveHelp}</p>}
  {actor.role === 'supervisor' && g && g.endsAt > data.now && <><div id="p1-members">{list(t.members, data.members, 'membersCursor', (m, i) => <><p>{safeName(m.name) ?? t.studentNumber.replace('{n}', String(i + 1))}</p><p className="text-sm text-muted">{t.window}: <bdi>{stamp(m.joinedAt)}</bdi></p></>)}</div><div id="p1-results"><p>{data.service === 'sql' ? t.sqlHint : t.resultHint}</p>{list(t.results, data.results, 'resultsCursor', (r, i) => <><p>{studentName(r.studentId, i)} · {t[r.kind]} · <bdi>{r.score}</bdi></p><p className="text-sm text-muted"><bdi>{stamp(r.at)}</bdi></p></>)}</div></>}
  <div id="p1-settings">{g && <section className="space-y-3 rounded-xl border border-line bg-panel p-4"><h2 className="text-xl font-semibold">{t.settings}</h2><p>{t.discardHelp}</p><p>{t.ends}: <bdi>{stamp(g.endsAt)}</bdi></p>{g.endsAt <= data.now ? <p role="status">{t.ended}</p> : <div className="flex flex-wrap gap-2">{actor.role === 'supervisor' ? <><button className={control} onClick={() => act({ kind: 'rotate', groupId: g.id, revision: g.revision })}>{t.rotate}</button>{data.service === 'sql' && <button className={control} onClick={() => act({ kind: 'revoke-code', groupId: g.id, revision: g.revision })}>{t.revokeCode}</button>}<button className={control} onClick={() => act({ kind: 'end', groupId: g.id, revision: g.revision })}>{t.end}</button></> : data.isMember && <button className={control} onClick={() => act({ kind: 'leave', groupId: g.id })}>{t.leave}</button>}</div>}</section>}</div>
 </div>;
}

/** Memory only: never persist a one-time credential to storage or a URL. */
export function JoinCodePanel({ code, t, done }: { code: string; t: ReviewCopy; done: () => void }) {
 const [message, setMessage] = useState('');
 async function copyCode() {
  try { await navigator.clipboard.writeText(code); setMessage(t.copied); }
  catch { setMessage(t.copyFailed); }
 }
 async function shareCode() {
  if (!navigator.share) return copyCode();
  try { await navigator.share({ title: t.code, text: code }); setMessage(t.shared); }
  catch (error) { if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) await copyCode(); }
 }
 return <section className="space-y-3 rounded-xl border-2 border-brand bg-panel p-4" aria-label={t.code}>
  <h2 className="text-xl font-semibold">{t.code}</h2><p className="break-all font-mono text-xl" dir="ltr">{code}</p><p>{t.shownOnce}</p>
  <div className="flex flex-wrap gap-2"><button className={control} onClick={() => void copyCode()}>{t.copyCode}</button><button className={control} onClick={() => void shareCode()}>{t.shareCode}</button><button className={control} onClick={done}>{t.done}</button></div>
  <p role="status">{message}</p>
 </section>;
}
