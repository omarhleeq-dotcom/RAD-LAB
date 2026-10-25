// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { localPartCatalog } from './catalog';
import { createAuthoringFixture } from './synthetic';
import { draftIssues, newDraft, newMCQ, newPart, studentPreview, totalPoints } from './draft';
import { AuthoringSession, LocalAuthoringReview } from './Session';
import { StudentPreview } from './StudentPreview';
import { copy } from './copy';
import type { Draft } from './contracts';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const signal = () => new AbortController().signal;
const parts = localPartCatalog();
function complete(): Draft {
 const d = newDraft(), item = newMCQ();
 if (item.type !== 'single-choice') throw Error();
 item.prompt = 'Which token matches ALPHA?'; item.options[0]!.text = 'ALPHA'; item.options[1]!.text = 'BETA'; item.correctOptionId = item.options[0]!.id;
 item.authoring = { author: 'PRIVATE AUTHOR', reference: 'PRIVATE SOURCE', licenceNotes: 'UNVERIFIED LICENCE', notes: 'PRIVATE NOTES' };
 return { ...d, name: 'Synthetic tokens', items: [item] };
}
async function fixture() {
 let now = Date.now();
 const f = createAuthoringFixture(parts, { delay: 0, now: () => now });
 const a = f.adapter.accounts[0]!, b = f.adapter.accounts[1]!;
 const group = (await f.adapter.groups(a.id, undefined, signal())).rows[0]!;
 return { ...f, scope: { actorId: a.id, groupId: group.id }, other: b, group, advance(ms: number) { now += ms; } };
}
let roots: Root[] = [];
afterEach(async () => { await act(async () => { roots.forEach(r => r.unmount()); }); roots = []; document.body.innerHTML = ''; vi.unstubAllGlobals(); });
async function mount(node: Parameters<Root['render']>[0]) { const host = document.createElement('div'); document.body.append(host); const root = createRoot(host); roots.push(root); await act(async () => root.render(node)); return { host, root }; }
async function settle(ms = 30) { await act(async () => { await new Promise(r => setTimeout(r, ms)); }); }
async function click(host: HTMLElement, label: string) { const b = [...host.querySelectorAll('button')].find(b => b.textContent === label); expect(b, label).toBeTruthy(); await act(async () => b!.click()); }
async function select(node: HTMLSelectElement, value: string) { await act(async () => { node.value = value; node.dispatchEvent(new Event('change', { bubbles: true })); }); }
it('validates existing policy, single key, decimal precision and required provenance without fabricating independent review', () => {
 const d = complete(); expect(draftIssues(d, parts)).toEqual([]);
 d.policy.durationSeconds = 0; d.policy.maxAttempts = 1001; expect(draftIssues(d, parts)).toContainEqual({ path: 'policy', code: 'policy' });
 d.policy.durationSeconds = null; d.policy.maxAttempts = 1;
 const i = d.items[0]!; i.maximum = '1.0000001'; i.authoring.reference = '';
 if (i.type !== 'single-choice') throw Error(); i.correctOptionId = 'missing';
 expect(draftIssues(d, parts).map(v => v.code)).toEqual(expect.arrayContaining(['points', 'required', 'key']));
 i.maximum = '1'; i.options[1]!.text = ''; expect(draftIssues(d, parts).some(i => i.code === 'options')).toBe(true);
});
it('uses existing exact point arithmetic, existing catalog references, and rejects unsupported parts', () => {
 const d = complete(), p = newPart(parts[0]!.id); p.prompt = 'Adjust the displayed control.'; p.authoring = { ...d.items[0]!.authoring };
 d.items[0]!.maximum = '0.100001'; p.maximum = '0.2'; d.items.push(p);
 expect(totalPoints(d)).toBe('0.300001'); expect(draftIssues(d, parts)).toEqual([]);
 expect(parts[0]!.caseRef.version).toMatch(/^[a-f0-9]{64}$/); expect(parts[0]!.view.sceneValues).toEqual({});
 p.partId = 'unsupported'; expect(draftIssues(d, parts).some(i => i.code === 'part')).toBe(true);
});
it('projects a strict student whitelist and renders no author fields, keys or grading data', async () => {
 const d = complete(), data = studentPreview(d, parts), json = JSON.stringify(data);
 for (const value of ['correctOptionId', 'authoring', 'PRIVATE', 'LICENCE', 'reviewedBy', 'criteria', 'maximum']) expect(json).not.toContain(value);
 expect(data.items[0]!.ref.id).toBe(d.items[0]!.id);
 const { host } = await mount(createElement(StudentPreview, { data, t: copy.en, locale: 'en', close() {} }));
 expect(host.querySelectorAll('input[type=radio]:checked')).toHaveLength(0);
 expect(host.textContent).not.toContain('PRIVATE');
 await act(async () => (host.querySelector('input') as HTMLInputElement).click()); expect(host.querySelectorAll(':checked')).toHaveLength(1);
});
it('saves incomplete drafts locally with optimistic revisions; stale saves cannot overwrite', async () => {
 const f = await fixture(), d = newDraft(), saved = await f.adapter.save(f.scope, d, signal());
 expect(saved.revision).toBe(1); expect(d.revision).toBe(0);
 await expect(f.adapter.prepare(f.scope, saved, signal())).rejects.toMatchObject({ reason: 'invalid' });
 await expect(f.adapter.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'conflict' });
 saved.name = 'Changed'; expect((await f.adapter.context(f.scope, signal())).draft!.name).toBe('');
});
it('assignment reviews only selected supervisor group with bounded target pages and a consumed token; zero network', async () => {
 const network = vi.fn(() => { throw Error('No network'); }); vi.stubGlobal('fetch', network);
 const f = await fixture(), d = await f.adapter.save(f.scope, complete(), signal());
 const plan = await f.adapter.prepare(f.scope, d, signal()); expect(plan.targetCount).toBe(24); expect(plan.targets.rows).toHaveLength(20);
 expect((await f.adapter.targets(f.scope, plan.token, plan.targets.next!, signal())).rows).toHaveLength(4);
 await expect(f.adapter.targets({ ...f.scope, actorId: f.other.id }, plan.token, undefined, signal())).rejects.toMatchObject({ reason: 'denied' });
 await f.adapter.confirm(f.scope, plan.token, signal()); await expect(f.adapter.confirm(f.scope, plan.token, signal())).rejects.toMatchObject({ reason: 'denied' }); expect(network).not.toHaveBeenCalled();
});
it('cancellation prevents local save; save invalidates review, and target membership changes conflict before confirm', async () => {
 const f = await fixture(), controller = new AbortController(); controller.abort();
 await expect(f.adapter.save(f.scope, complete(), controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
 expect((await f.adapter.context(f.scope, signal())).draft).toBeUndefined();
 const d = await f.adapter.save(f.scope, complete(), signal()), plan = await f.adapter.prepare(f.scope, d, signal());
 await f.membership.execute(plan.targets.rows[0]!.id, { kind: 'leave', groupId: f.scope.groupId }, signal());
 await expect(f.adapter.confirm(f.scope, plan.token, signal())).rejects.toMatchObject({ reason: 'conflict' });
 await f.adapter.save(f.scope, { ...d, name: 'New revision' }, signal());
 await expect(f.adapter.targets(f.scope, plan.token, undefined, signal())).rejects.toMatchObject({ reason: 'denied' });
});
it('expiry, revoked appointment, empty groups and synthetic conflicts fail closed', async () => {
 const f = await fixture(), d = await f.adapter.save(f.scope, complete(), signal()), plan = await f.adapter.prepare(f.scope, d, signal());
 f.advance(300001); await expect(f.adapter.confirm(f.scope, plan.token, signal())).rejects.toMatchObject({ reason: 'expired' });
 f.scenario('conflict'); await expect(f.adapter.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'conflict' });
 f.scenario('normal'); f.revoke(f.scope.actorId); await expect(f.adapter.context(f.scope, signal())).rejects.toMatchObject({ reason: 'denied' });
 const g = await fixture(); g.expire(); await expect(g.adapter.context(g.scope, signal())).rejects.toMatchObject({ reason: 'expired' });
 const e = await fixture(); await e.membership.execute(e.scope.actorId, { kind: 'create', name: 'Empty', endsAt: Date.now() + 8e6 }, signal());
 const empty = (await e.adapter.groups(e.scope.actorId, undefined, signal())).rows.find(g => g.name === 'Empty')!;
 const emptyScope = { ...e.scope, groupId: empty.id }, saved = await e.adapter.save(emptyScope, complete(), signal());
 await expect(e.adapter.prepare(emptyScope, saved, signal())).rejects.toMatchObject({ reason: 'invalid' });
});
it('real UI handles add, reorder, delete, validation, confirmed discard and separate preview', async () => {
 const f = await fixture(), d = await f.adapter.save(f.scope, complete(), signal());
 const { host } = await mount(createElement(AuthoringSession, { adapter: f.adapter, scope: f.scope, locale: 'en' })); await settle();
 await click(host, copy.en.addPart); expect(host.querySelectorAll('textarea')).toHaveLength(10);
 await click(host, copy.en.up); // First button is disabled: no accidental move across boundary.
 const ups = [...host.querySelectorAll('button')].filter(b => b.textContent === copy.en.up);
 await act(async () => ups[1]!.click()); expect(host.querySelector('legend')!.textContent).toContain('simulator-part');
 await click(host, copy.en.remove); expect(host.querySelectorAll('textarea')).toHaveLength(5);
 await click(host, copy.en.discard); await click(host, copy.en.keep); expect(host.textContent).toContain(copy.en.draft);
 await click(host, copy.en.discard); await click(host, copy.en.confirmDiscard);
 await click(host, copy.en.preview); expect(host.textContent).toContain(copy.en.previewTitle); expect(host.textContent).not.toContain('PRIVATE AUTHOR'); expect(host.querySelectorAll(':checked')).toHaveLength(0);
 await click(host, copy.en.closePreview); expect(host.textContent).toContain(copy.en.draft); expect((await f.adapter.context(f.scope, signal())).draft).toEqual(d);
 await click(host, copy.en.addMCQ); await click(host, copy.en.preview); expect(host.querySelector('[role=alert]')!.textContent).toContain(copy.en.invalidTitle);
});
it('account and group switching synchronously clear preview, draft and assignment scope; ignore noncooperative late reads', async () => {
 const f = await fixture(); await f.adapter.save(f.scope, complete(), signal());
 const { host, root } = await mount(createElement(AuthoringSession, { adapter: f.adapter, scope: f.scope, locale: 'en' })); await settle();
 await click(host, copy.en.prepare); await settle(); expect(host.textContent).toContain(copy.en.targets);
 let resolve!: (value: Awaited<ReturnType<typeof f.adapter.context>>) => void;
 const pending = new Promise<Awaited<ReturnType<typeof f.adapter.context>>>(r => { resolve = r; });
 const old = await f.adapter.context(f.scope, signal());
 const adapter = { ...f.adapter, context: () => pending };
 await act(async () => root.render(createElement(AuthoringSession, { adapter, scope: { actorId: f.other.id, groupId: 'other-scope' }, locale: 'en' })));
 expect(host.textContent).not.toContain('Synthetic tokens'); expect(host.textContent).not.toContain(copy.en.targets);
 await act(async () => root.render(createElement(AuthoringSession, { adapter: f.adapter, scope: { ...f.scope, groupId: 'unavailable' }, locale: 'en' }))); await settle();
 await act(async () => resolve(old)); expect(host.textContent).not.toContain('Synthetic tokens'); expect(host.textContent).toContain(copy.en.denied);
});
it('UI cancels noncooperative pending save without restoring old draft or preview', async () => {
 const f = await fixture(); const d = await f.adapter.save(f.scope, complete(), signal());
 let resolve!: (d: Draft) => void; const pending = new Promise<Draft>(r => { resolve = r; });
 const { host } = await mount(createElement(AuthoringSession, { adapter: { ...f.adapter, save: () => pending }, scope: f.scope, locale: 'en' })); await settle();
 await click(host, copy.en.save); await click(host, copy.en.cancel); await act(async () => resolve(d));
 expect(host.textContent).toContain(copy.en.cancelled); expect(host.textContent).not.toContain('Synthetic tokens');
});
it('UI automatically erases preview at visibility deadline', async () => {
 const f = await fixture(); await f.adapter.save(f.scope, complete(), signal());
 const adapter = { ...f.adapter, context: async (...args: Parameters<typeof f.adapter.context>) => { const c = await f.adapter.context(...args); return { ...c, group: { ...c.group, endsAt: c.now + 170 } }; } };
 const { host } = await mount(createElement(AuthoringSession, { adapter, scope: f.scope, locale: 'en' })); await settle(); await click(host, copy.en.preview); await settle(200);
 expect(host.textContent).toContain(copy.en.expired); expect(host.textContent).not.toContain('Synthetic tokens'); expect(host.querySelectorAll('input')).toHaveLength(0);
});
it('harness account switch and scenario changes erase existing author UI', async () => {
 const f = await fixture(); await f.adapter.save(f.scope, complete(), signal());
 const { host } = await mount(createElement(LocalAuthoringReview, { fixture: f })); await settle();
 await click(host, f.group.name); await settle(); await click(host, copy.en.preview);
 await select(host.querySelector('select')!, f.other.id); expect(host.textContent).not.toContain(copy.en.previewTitle); expect(host.textContent).not.toContain('Synthetic tokens');
 await settle(); await select(host.querySelectorAll('select')[1]!, 'offline'); await settle(); expect(host.textContent).toContain(copy.en.error);
});

it('group paging keeps the current first page available and bounds subsequent pages', async () => {
 const f = await fixture();
 for (let n = 1; n <= 22; n++) await f.membership.execute(f.scope.actorId, { kind: 'create', name: `Page group ${n}`, endsAt: Date.now() + 60 * 86400000 }, signal());
 const { host } = await mount(createElement(LocalAuthoringReview, { fixture: f })); await settle();
 const first = () => [...host.querySelectorAll('button')].find(b => b.textContent === copy.en.first)!;
 expect(first().disabled).toBe(true); await click(host, copy.en.first); expect(host.textContent).toContain(f.group.name);
 expect([...host.querySelectorAll('button')].filter(b => b.textContent?.startsWith('Page group'))).toHaveLength(19);
 await click(host, copy.en.next); await settle(); expect(first().disabled).toBe(false);
 expect([...host.querySelectorAll('button')].filter(b => b.textContent?.startsWith('Page group'))).toHaveLength(3);
 await click(host, copy.en.first); await settle(); expect(host.textContent).toContain(f.group.name); expect(first().disabled).toBe(true);
});

it('preview shows one item at a time, preserving temporary answers without duplicate shared control IDs', async () => {
 const d = complete();
 for (let n = 0; n < 2; n++) { const part = newPart(parts[0]!.id); part.prompt = 'Engineering control only.'; part.authoring = { ...d.items[0]!.authoring }; d.items.push(part); }
 const { host } = await mount(createElement(StudentPreview, { data: studentPreview(d, parts), t: copy.en, locale: 'en', close() {} }));
 await act(async () => (host.querySelector('input[type=radio]') as HTMLInputElement).click());
 await click(host, copy.en.item + ' 2'); expect(host.querySelectorAll('input[type=range]')).toHaveLength(1); expect(host.querySelectorAll('input[type=radio]')).toHaveLength(0);
 await click(host, copy.en.item + ' 3'); expect(host.querySelectorAll('input[type=range]')).toHaveLength(1);
 const ids = [...host.querySelectorAll('[id]')].map(n => n.id); expect(new Set(ids).size).toBe(ids.length);
 await click(host, copy.en.item + ' 1'); expect(host.querySelectorAll(':checked')).toHaveLength(1); expect(host.textContent).not.toContain('PRIVATE');
});
