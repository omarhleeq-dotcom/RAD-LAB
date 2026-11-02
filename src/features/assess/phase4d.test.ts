// @vitest-environment jsdom
import { act, createElement as h, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import { AuthoringFlow } from './AuthoringFlow';
import { OwnerContentPanel } from './OwnerContentPanel';
import { newDraft } from '../authoring-review/draft';
import { copy } from '../authoring-review/copy';
import type { Draft } from '../authoring-review/contracts';
import { clearAuthoringBatchMemory, originalQuestionNotes, readImportNotes, writeImportNotes } from './import-preferences';
import { draftToV2, rowToQuestion } from './import-validator';
import { SupervisorReview } from '../supervisor-review/SupervisorReview';
import type { Snapshot } from '../supervisor-review/contracts';
const mocked = vi.hoisted(() => ({ role: 'participant', saved: [] as unknown[] }));
vi.mock('../pilot/SessionGate',()=>({useOptionalSessionAccount:()=>({state:{kind:'signedIn',displayName:'Synthetic Supervisor Account'}}),useSessionAccount:()=>({state:{kind:'signedIn',userId:'synthetic',displayName:'Synthetic Supervisor Account',profile:{status:'approved',role:mocked.role}}})}));
vi.mock('../pilot/client',()=>({getPilotClient:async()=>({schema:()=>({rpc:async(name:string,args:unknown)=>{if(name==='content_submit_v1'){mocked.saved.push(args);return {data:'00000000-0000-4000-8000-000000000001'};}return {data:{rows:[],next:null}};}})})}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let host: HTMLDivElement, root: Root;
beforeEach(()=>{host=document.createElement('div');document.body.append(host);root=createRoot(host);localStorage.clear();mocked.role='participant';mocked.saved=[];Object.defineProperty(window,'matchMedia',{configurable:true,value:()=>({matches:true,addEventListener(){},removeEventListener(){}})});});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});
const button=(text:string)=>[...host.querySelectorAll('button')].find(b=>b.textContent===text)!;
async function click(text:string){await act(async()=>button(text).click());}
async function fill(element:HTMLTextAreaElement|HTMLInputElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(element instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value')!.set!.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));});}
it('recomputes defaults from the current author, persists only edits and clears on sign-out/account change',()=>{
 const author='Synthetic Supervisor Account', defaults=originalQuestionNotes(author);
 expect(readImportNotes('a',author)).toEqual(defaults);writeImportNotes('a',defaults,author);expect(localStorage.length).toBe(0);
 writeImportNotes('a',{...defaults,reference:'Edited source'},author);
 expect(JSON.parse(localStorage.getItem('radlab:assess-import:v1:a')!)).toEqual({userId:'a',reference:'Edited source'});
 expect(readImportNotes('a','Changed Supervisor Name')).toEqual({reference:'Edited source',licenceNotes:originalQuestionNotes('Changed Supervisor Name').licenceNotes});
 expect(readImportNotes('b',author)).toEqual(defaults);expect(localStorage.getItem('radlab:assess-import:v1:a')).toBeNull();
 writeImportNotes('b',{...defaults,licenceNotes:'CC BY 4.0'},author);clearAuthoringBatchMemory();expect(readImportNotes('b',author)).toEqual(defaults);
 vi.spyOn(Storage.prototype,'getItem').mockImplementation(()=>{throw Error('denied');});expect(readImportNotes('b',author)).toEqual(defaults);
});
it.each(['en','ar'] as const)('takes twenty pasted rows to Save with default provenance and links disabled actions to corrections (%s)',async locale=>{
 const messages=locale==='ar'?ar:en, t=messages.assessImport, saved:Draft[]=[];
 function Harness(){const[d,change]=useState(newDraft());return h(NextIntlClientProvider,{locale,messages,children:h(AuthoringFlow,{draft:d,change,actorId:'a',t:copy[locale],busy:false,dirty:true,saveBlocked:false,parts:[],issues:[],receipt:false,discarding:false,save:()=>saved.push(d),preview(){},prepare(){},confirm(){},cancelReview(){},paging(){},discard(){},keep(){},confirmDiscard(){}})});}
 await act(async()=>root.render(h(Harness)));await click(t.method.paste);
 expect(host.textContent).toContain(t.pasteReason);
 await fill(host.querySelector('textarea.font-mono')!,'Question\tA\tB\tAnswer\n'+Array.from({length:20},(_,n)=>`Synthetic ${n}?\t+1000 HU\t-1000 HU\tA`).join('\n'));
 await click(t.previewPaste);expect(button(t.next).disabled).toBe(false);
 expect([...host.querySelectorAll('summary')].find(s=>s.textContent===t.sourceDetails)?.parentElement?.hasAttribute('open')).toBe(false);
 await click(t.next);expect(button(copy[locale].save).disabled).toBe(true);
 const reason=host.querySelector<HTMLAnchorElement>('a[href="#authoring-name"]')!;expect(reason.textContent).toContain(t.draftErrors.required);await act(async()=>reason.click());expect(document.activeElement?.id).toBe('authoring-name');
 await fill(host.querySelector('#authoring-name')!,'Synthetic assessment');await fill(host.querySelector('#authoring-pool')!,'21');expect(button(copy[locale].save).disabled).toBe(true);expect(host.querySelector('a[href="#authoring-pool"]')?.textContent).toBe(t.draftErrors.pool_size_exceeds_questions);
 await fill(host.querySelector('#authoring-pool')!,'20');await click(copy[locale].save);expect(saved).toHaveLength(1);
 const wire=draftToV2(saved[0]!);expect(wire.items).toHaveLength(20);const defaults=originalQuestionNotes('Synthetic Supervisor Account');expect(wire.items.every(i=>i.provenance.kind==='uploader-authored'&&i.provenance.sources[0]!.reference===defaults.reference&&i.provenance.licenceNotes===defaults.licenceNotes)).toBe(true);expect(localStorage.length).toBe(0);
});
it('explains a missing reference next to Next and opens the row controls to fix it',async()=>{
 const t=en.assessImport;
 function Harness(){const[d,change]=useState(newDraft());return h(NextIntlClientProvider,{locale:'en',messages:en,children:h(AuthoringFlow,{draft:d,change,actorId:'a',t:copy.en,busy:false,dirty:true,parts:[],issues:[],receipt:false,discarding:false,save(){},preview(){},prepare(){},confirm(){},cancelReview(){},paging(){},discard(){},keep(){},confirmDiscard(){}})});}
 writeImportNotes('a',{reference:'',licenceNotes:'Original work'},'Synthetic Supervisor Account');await act(async()=>root.render(h(Harness)));await click(t.method.paste);await fill(host.querySelector('textarea.font-mono')!,'Question\tA\tB\tAnswer\nSynthetic?\tTrue\tFalse\tA');await click(t.previewPaste);expect(button(t.next).disabled).toBe(true);
 const fix=[...host.querySelectorAll('button')].find(b=>b.textContent===t.referenceRows.replace('{n}','1'))!;await act(async()=>fix.click());expect((host.querySelector('[data-edit-row="2"] details') as HTMLDetailsElement).open).toBe(true);
});
it.each(['en','ar'] as const)('keeps owner JSON publishing functional under a closed Advanced section (%s)',async locale=>{
 mocked.role='owner';const messages=locale==='ar'?ar:en;
 await act(async()=>root.render(h(NextIntlClientProvider,{locale,messages,children:h(OwnerContentPanel)})));
 const advanced=[...host.querySelectorAll('summary')].find(s=>s.textContent===messages.assessContent.advanced)!.parentElement as HTMLDetailsElement;expect(advanced.open).toBe(false);expect(host.textContent).toContain(messages.assessImport.ownerOnly);expect(host.querySelector('a[href="#supervisor-appointments"]')).toBeTruthy();expect(host.querySelector('[data-testid="assess-authoring"] textarea')).toBeNull();
 advanced.open=true;await fill(host.querySelector('textarea')!,'{"name":"Synthetic fixed version"}');await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));expect(mocked.saved).toEqual([{p_document:{name:'Synthetic fixed version'}}]);
});
it('uses one group button, hides reference under Details and separates archive from settings without changing commands',async()=>{
 const group={id:'00000000-0000-4000-8000-000000000001',name:'Synthetic group',supervisorId:'a',startsAt:0,supervisedFrom:0,endsAt:9999999999999,revision:1},blank={rows:[],next:null};
 const data:Snapshot={service:'sql',now:1,appointed:true,isMember:false,people:blank,groups:{rows:[group],next:null},group,requests:blank,members:{...blank,total:0},results:blank,visibilityUntil:Infinity};const actCommand=vi.fn(),selectGroup=vi.fn();
 await act(async()=>root.render(h(SupervisorReview,{t:en.supervisor,actor:{id:'a',name:'Synthetic Supervisor Account',role:'supervisor'},data,act:actCommand,paging(){},selectGroup,confirm(){},cancel(){},locale:'en'})));
 const cards=host.querySelectorAll('button[aria-label="Synthetic group"]');expect(cards).toHaveLength(1);await act(async()=>(cards[0] as HTMLButtonElement).click());expect(selectGroup).toHaveBeenCalledWith(group.id);
 const details=[...host.querySelectorAll('details')].find(d=>d.textContent?.includes(group.id))!;expect(details.open).toBe(false);expect(host.textContent).toContain(en.supervisor.noResults);
 const end=button(en.supervisor.end);expect(end.closest('[aria-label="'+en.supervisor.dangerZone+'"]')).toBeTruthy();expect(end.closest('#p1-settings')).toBeNull();await click(en.supervisor.end);expect(actCommand).toHaveBeenCalledWith({kind:'end',groupId:group.id,revision:1});
});
it('retains per-row Reference overrides with original defaults and accepts provenance v2',()=>{
 const batch=originalQuestionNotes('Synthetic Supervisor Account'),item=rowToQuestion({Question:'Synthetic?',A:'Yes',B:'No',Answer:'A',Reference:'Per-row source'},batch);const provenance=draftToV2({...newDraft(),name:'Synthetic',items:[item]}).items[0]!.provenance;expect(provenance.kind).toBe('uploader-authored');if(provenance.kind==='uploader-authored')expect(provenance.sources[0]!.reference).toBe('Per-row source');
});
