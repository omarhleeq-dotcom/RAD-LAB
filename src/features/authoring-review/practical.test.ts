// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { CASES } from '@/data/cases';
import { localPartCatalog, localPracticalCatalog } from './catalog';
import { createAuthoringFixture } from './synthetic';
import { draftIssues, newDraft, newMCQ, newPart, newPractical, studentPreview } from './draft';
import { AuthoringSession, LocalAuthoringReview } from './Session';
import { copy } from './copy';
import type { Draft } from './contracts';
import { caseVersion, settingsSpec, leafValues, validateValues } from '../assess/server-validation';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const parts = localPartCatalog(), practicals = localPracticalCatalog(), t = copy.en;
const signal = () => new AbortController().signal;
function complete(): Draft {
 const item = newPractical(practicals[0]!);
 item.prompt = 'Engineering control preview only.';
 item.authoring = { author: 'PRIVATE AUTHOR', reference: 'PRIVATE SOURCE', licenceNotes: 'PRIVATE unresolved licence', notes: 'PRIVATE NOTES' };
 return { ...newDraft('full-practical'), name: 'Synthetic practical review', items: [item, { ...structuredClone(item), id: crypto.randomUUID() }] };
}
async function fixture() {
 const f = createAuthoringFixture(parts, { delay: 0, practicals });
 const actorId = f.adapter.accounts[0]!.id, group = (await f.adapter.groups(actorId, undefined, signal())).rows[0]!;
 const scope = { actorId, groupId: group.id };
 return { ...f, scope, group };
}
let roots: Root[] = [];
afterEach(async () => { await act(async () => roots.forEach(r => r.unmount())); roots = []; document.body.innerHTML = ''; vi.unstubAllGlobals(); });
async function mount(node: Parameters<Root['render']>[0]) {
 const host = document.createElement('div'); document.body.append(host); const root = createRoot(host); roots.push(root);
 await act(async () => root.render(node)); return { host, root };
}
async function settle() { await act(async () => { await new Promise(r => setTimeout(r, 25)); }); }
async function click(host: HTMLElement, label: string, index = 0) { const b = [...host.querySelectorAll('button')].filter(b => b.textContent === label)[index]; expect(b, label).toBeTruthy(); await act(async () => b!.click()); }
it('derives every existing case reference and complete neutral controls without changing registry or grading inputs', () => {
 expect(practicals.map(p => p.id)).toEqual(CASES.map(c => c.id));
 for (const p of practicals) {
  const c = CASES.find(c => c.id === p.caseRef.id)!;
  expect(p.caseRef.version).toBe(caseVersion(c)); expect(p.view.controls).toEqual(settingsSpec(c));
  expect(p.view.initial).toEqual(leafValues(c.initialSettings, settingsSpec(c))); validateValues(p.view.controls, p.view.initial);
  expect(JSON.stringify(p.view)).not.toMatch(/rules|scoring|criteria|rubric|critical|tolerance|passThreshold|correctOptionId|evaluatorVersion/);
 }
});
it.each(['mcq', 'part', 'reverse'] as const)('rejects %s track mixing before preview, save or assignment', async kind => {
 const f = await fixture(), d = complete();
 if (kind === 'reverse') d.track = 'mixed'; else d.items.push(kind === 'mcq' ? newMCQ() : newPart(parts[0]!.id));
 expect(draftIssues(d, parts, practicals).some(i => i.path === 'items')).toBe(true);
 expect(() => studentPreview(d, parts, practicals)).toThrow();
 await expect(f.adapter.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'invalid' });
});
it('rejects stale case/evaluator versions without introducing a publication', async () => {
 const f = await fixture(), d = complete(); expect(draftIssues(d, parts, practicals)).toEqual([]);
 const item = d.items[0]!; if (item.type !== 'full-practical') throw Error();
 item.caseRef.version = 'stale'; expect(() => studentPreview(d, parts, practicals)).toThrow();
 await expect(f.adapter.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'invalid' });
 item.caseRef.version = practicals[0]!.caseRef.version; item.evaluatorVersion = 'stale';
 expect(draftIssues(d, parts, practicals)).toContainEqual({ path: 'items.1.caseRef', code: 'part' });
});
it('whitelists nested practical views and excludes injected author/target/rubric keys', () => {
 const d = complete(), catalog = structuredClone(practicals), v = catalog[0]!.view;
 Object.assign(d, { reviewedBy: 'PRIVATE' }); Object.assign(d.items[0]!, { rubric: 'PRIVATE', targets: 'PRIVATE', correctOptionId: 'PRIVATE' });
 Object.assign(v, { rubric: 'PRIVATE', targets: 'PRIVATE', reviewedBy: 'PRIVATE' });
 Object.assign(v.scene, { criteria: 'PRIVATE' }); Object.assign(v.scene.detector, { target: 'PRIVATE' });
 Object.assign(v.initial, { rubric: 'PRIVATE' }); Object.assign(v.controls.kvp!, { target: 'PRIVATE' });
 const data = studentPreview(d, parts, catalog), json = JSON.stringify(data);
 expect(Object.keys(data)).toEqual(['name', 'policy', 'items']);
 for (const key of ['PRIVATE', 'authoring', 'rubric', 'targets', 'reviewedBy', 'correctOptionId', 'evaluatorVersion', 'maximum', 'scoring', 'critical', 'tolerance']) expect(json).not.toContain(key);
 expect(data.items.every(i => i.type === 'full-practical')).toBe(true);
});
it('creates a separate practical draft, reorders and deletes existing cases without mark controls', async () => {
 const f = await fixture(), { host } = await mount(createElement(AuthoringSession, { adapter: f.adapter, scope: f.scope, locale: 'en' })); await settle();
 await click(host, t.createPractical); await click(host, t.addPractical); await click(host, t.addPractical);
 expect(host.textContent).not.toContain(t.addMCQ); expect(host.textContent).not.toContain(t.addPart);
 expect([...host.querySelectorAll('label')].some(l => l.textContent === t.points)).toBe(false);
 const selects = [...host.querySelectorAll('select')], catalog = selects.filter(s => s.closest('label')?.textContent?.startsWith(t.practicalCatalog));
 await act(async () => { catalog[1]!.value = practicals[1]!.id; catalog[1]!.dispatchEvent(new Event('change', { bubbles: true })); });
 await click(host, t.up, 1); expect(host.querySelector('fieldset fieldset p[dir=ltr]')!.textContent).toContain(practicals[1]!.caseRef.id);
 await click(host, t.remove); expect(host.querySelectorAll('textarea')).toHaveLength(5);
 await click(host, t.preview); expect(host.textContent).toContain(t.invalidTitle);
});
it('navigates repeated full cases with unique IDs, temporary settings, reset on close and zero network', async () => {
 const network = vi.fn(() => { throw Error('No network'); }); vi.stubGlobal('fetch', network);
 const f = await fixture(); await f.adapter.save(f.scope, complete(), signal());
 const { host } = await mount(createElement(AuthoringSession, { adapter: f.adapter, scope: f.scope, locale: 'en' })); await settle();
 await click(host, t.preview); expect(host.textContent).not.toContain('PRIVATE');
 const input = () => host.querySelector('#practical-control-kvp') as HTMLInputElement;
 const initial = input().value, setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
 await act(async () => { setValue.call(input(), String(Number(initial) + 1)); input().dispatchEvent(new Event('input', { bubbles: true })); });
 expect(input().value).not.toBe(initial);
 await click(host, t.item + ' 2'); expect(input().value).toBe(initial);
 const ids = [...host.querySelectorAll('[id]')].map(n => n.id); expect(new Set(ids).size).toBe(ids.length);
 await click(host, t.item + ' 1'); expect(input().value).not.toBe(initial);
 await click(host, t.closePreview); await click(host, t.preview); expect(input().value).toBe(initial);
 expect(host.querySelectorAll('svg')).toHaveLength(0); expect(host.textContent).toContain(t.sceneBoundary); expect(network).not.toHaveBeenCalled();
});
it('reuses saved revisions and bounded assignment review, invalidates stale tokens, and detects membership changes', async () => {
 const f = await fixture(), d = await f.adapter.save(f.scope, complete(), signal()), plan = await f.adapter.prepare(f.scope, d, signal());
 await expect(f.adapter.save(f.scope, { ...d, track: 'mixed', items: [] }, signal())).rejects.toMatchObject({ reason: 'conflict' });
 expect(plan.draftRevision).toBe(d.revision); expect(plan.groupName).toBe(f.group.name); expect(plan.targetCount).toBe(24); expect(plan.targets.rows).toHaveLength(20);
 expect((await f.adapter.targets(f.scope, plan.token, plan.targets.next!, signal())).rows).toHaveLength(4);
 await f.membership.execute(plan.targets.rows[0]!.id, { kind: 'leave', groupId: f.group.id }, signal());
 await expect(f.adapter.confirm(f.scope, plan.token, signal())).rejects.toMatchObject({ reason: 'conflict' });
 await f.adapter.save(f.scope, { ...d, name: 'Changed revision' }, signal());
 await expect(f.adapter.confirm(f.scope, plan.token, signal())).rejects.toMatchObject({ reason: 'denied' });
 await expect(f.adapter.save(f.scope, d, signal())).rejects.toMatchObject({ reason: 'conflict' });
});
it.each(['conflict', 'offline', 'expired', 'denied'] as const)('clears practical preview and draft on %s', async reason => {
 const f = await fixture(); await f.adapter.save(f.scope, complete(), signal());
 const { host } = await mount(createElement(AuthoringSession, { adapter: f.adapter, scope: f.scope, locale: 'en' })); await settle();
 await click(host, t.preview); await click(host, t.closePreview);
 if (reason === 'expired') f.expire(); else if (reason === 'denied') f.revoke(f.scope.actorId); else f.scenario(reason);
 await click(host, t.save); await settle();
 expect(host.textContent).toContain(t[reason === 'offline' ? 'error' : reason]);
 expect(host.textContent).not.toContain('Synthetic practical review'); expect(host.querySelectorAll('input,textarea,svg')).toHaveLength(0);
});
it('cancels noncooperative late assignment response and clears scope on account/group switch', async () => {
 const f = await fixture(), d = await f.adapter.save(f.scope, complete(), signal()), plan = await f.adapter.prepare(f.scope, d, signal());
 let resolve!: (v: typeof plan) => void; const pending = new Promise<typeof plan>(r => { resolve = r; });
 const { host, root } = await mount(createElement(AuthoringSession, { adapter: { ...f.adapter, prepare: () => pending }, scope: f.scope, locale: 'en' })); await settle();
 await click(host, t.prepare); await click(host, t.cancel); await act(async () => resolve(plan));
 expect(host.textContent).toContain(t.cancelled); expect(host.textContent).not.toContain(t.targets);
 await act(async () => root.render(createElement(LocalAuthoringReview, { fixture: f }))); await settle(); await click(host, f.group.name); await settle(); await click(host, t.preview);
 const account = host.querySelector('select')!;
 await act(async () => { account.value = f.adapter.accounts[1]!.id; account.dispatchEvent(new Event('change', { bubbles: true })); });
 expect(host.querySelectorAll('svg')).toHaveLength(0); expect(host.textContent).not.toContain(d.name);
 await act(async () => root.render(createElement(AuthoringSession, { adapter: f.adapter, scope: { ...f.scope, groupId: 'unavailable' }, locale: 'en' }))); await settle();
 expect(host.textContent).toContain(t.denied); expect(host.textContent).not.toContain(d.name);
});

it('erases full-practical control values automatically when group visibility expires', async () => {
 const f = await fixture(); await f.adapter.save(f.scope, complete(), signal());
 const adapter = { ...f.adapter, context: async (...args: Parameters<typeof f.adapter.context>) => { const c = await f.adapter.context(...args); return { ...c, group: { ...c.group, endsAt: c.now + 300 } }; } };
 const { host } = await mount(createElement(AuthoringSession, { adapter, scope: f.scope, locale: 'en' })); await settle(); await click(host, t.preview);
 await act(async () => { await new Promise(r => setTimeout(r, 320)); });
 expect(host.textContent).toContain(t.expired); expect(host.textContent).not.toContain('Synthetic practical review'); expect(host.querySelectorAll('input,textarea')).toHaveLength(0);
});
