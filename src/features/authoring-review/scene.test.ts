// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { localPracticalCatalog } from './catalog';
import { newDraft, newPractical, studentPreview } from './draft';
import { StudentPreview } from './StudentPreview';
import { copy } from './copy';
import * as drawing from '../positioning/drawing-data';
import { handImage } from '@/data/exams/xray/hand-geometry';
import { elbowImage } from '@/data/exams/xray/elbow-geometry';
import { lowerLimbImage } from '@/data/exams/xray/lower-limb-geometry';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it('keeps the browser dependency guard intact with the existing scene and no service/evaluator/asset registries', async () => {
 const inputs: string[] = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `import {build} from 'esbuild'; const b=await build({entryPoints:['src/features/authoring-review/StudentPreview.tsx'],bundle:true,write:false,platform:'browser',metafile:true}); console.log(JSON.stringify(Object.keys(b.metafile.inputs)));`], { encoding: 'utf8' }));
 expect(inputs.some(p => p.endsWith('/PracticalScene.tsx'))).toBe(true);
 expect(inputs.filter(p => /supabase|features\/pilot|\/server-|\/catalog\.ts|data\/cases|data\/exams|\/evaluation\//.test(p))).toEqual([]);
});
it('exports only drawing frames and displacement data, keeping exam target pixels outside the public shapes', () => {
 for (const k of ['pa', 'lateral'] as const) {
  const { targetPx: handTarget, ...hand } = handImage(k);
  expect(handTarget).toBeTruthy(); expect(drawing.handDrawingImage(k)).toEqual(hand);
 }
 for (const k of ['ap', 'lateral'] as const) {
  const { targetPx, ...frame } = elbowImage(k);
  expect(targetPx).toBeTruthy(); expect(drawing.elbowDrawingImage(k)).toEqual(frame);
 }
 for (const k of Object.keys(drawing.LOWER_LIMB_DRAWING) as (keyof typeof drawing.LOWER_LIMB_DRAWING)[]) {
  const { targetPx, ...frame } = lowerLimbImage(k);
  expect(targetPx).toBeTruthy(); expect(drawing.lowerLimbDrawingImage(k)).toEqual(frame);
 }
 expect(JSON.stringify(drawing)).not.toMatch(/targetPx|rubric|rules|critical|correctOption|reviewedBy|credit|licence|source|evidence|registryIds|src|tolerance|passThreshold/);
});
it('synchronizes existing scene keyboard edits with controls per item and clears them on preview unmount', async () => {
 const network = vi.spyOn(globalThis, 'fetch').mockImplementation(() => { throw Error('No network'); });
 const p = localPracticalCatalog()[0]!, item = newPractical(p);
 item.prompt = 'Synthetic scene interaction'; item.authoring = { author: 'PRIVATE', reference: 'PRIVATE', licenceNotes: 'PRIVATE', notes: 'PRIVATE' };
 const d = { ...newDraft('full-practical'), name: 'Synthetic scene', items: [item, { ...structuredClone(item), id: crypto.randomUUID() }] };
 const data = studentPreview(d, [], [p]), host = document.createElement('div'); document.body.append(host); const root = createRoot(host);
 const render = () => root.render(createElement(StudentPreview, { data, t: copy.en, locale: 'en', close: () => {} }));
 try {
  await act(async () => render());
  const x = () => host.querySelector('[id="practical-control-centralRay.x"]') as HTMLInputElement;
  const initial = Number(x().value);
  const beam = () => [...host.querySelectorAll('svg [role=button]')].at(-1)!;
  await act(async () => beam().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  expect(Number(x().value)).toBeCloseTo(initial + 0.02, 4);
  const nav = host.querySelectorAll('nav button');
  await act(async () => (nav[1] as HTMLButtonElement).click()); expect(Number(x().value)).toBe(initial);
  await act(async () => (nav[0] as HTMLButtonElement).click()); expect(Number(x().value)).toBeCloseTo(initial + 0.02, 4);
  const ids = [...host.querySelectorAll('[id]')].map(n => n.id); expect(new Set(ids).size).toBe(ids.length);
  expect(host.textContent).not.toContain('PRIVATE'); expect(network).not.toHaveBeenCalled();
  await act(async () => root.render(null)); await act(async () => render()); expect(Number(x().value)).toBe(initial);
 } finally { await act(async () => root.unmount()); host.remove(); network.mockRestore(); }
});
