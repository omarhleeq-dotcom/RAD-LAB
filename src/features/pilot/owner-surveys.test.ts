// @vitest-environment jsdom
// RAD-099: synthetic fixtures only (no real participants, codes, names, emails or ids).
import {act} from 'react';
import {jsx} from 'react/jsx-runtime';
import {createRoot,type Root} from 'react-dom/client';
import {NextIntlClientProvider} from 'next-intl';
import {afterEach,describe,expect,it,vi} from 'vitest';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import {findParticipant,floorGap,gapValue,GAP_MIN,LOOKUP_PAGES,OwnerSurveys,scanOpenRounds} from './OwnerSurveys';
import type {Answer,C2Adapter,Definition,Round,SurveyVersion} from './c2-ui';

const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const sus:Definition={locale:'en',scoring:'sus',citation:'synthetic',questions:Array.from({length:10},(_,i)=>({id:`q${i+1}`,kind:'rating' as const,label:`S${i+1}`,optional:false}))};
const general:Definition={locale:'en',scoring:'none',questions:[{id:'rating',kind:'rating',label:'Overall',optional:false}]};
const versions:SurveyVersion[]=[{id:id(1),survey_type:'SUS',version:1,definition:sus},{id:id(2),survey_type:'General',version:1,definition:general}];
const round=(n:number,type:string,open:boolean):Round=>({id:id(100+n),survey_type:type,version:1,opened_at:'2026-11-01T10:00:00Z',closed_at:open?'infinity':'2026-11-02T10:00:00Z',answered:2,pending:1});
const answer:Answer={id:id(200),participant_code:'SYN-0001',round_id:id(101),survey_type:'SUS',version:1,answered_at:'2026-11-01T11:00:00Z',answers:{q1:4},score:75};
let root:Root|undefined,container:HTMLDivElement;
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
afterEach(async()=>{if(root)await act(()=>root!.unmount());root=undefined;container?.remove();});
function adapterWith(rounds:(after:string|null)=>{rows:Round[];next:string|null}) {
 return {
  versions:vi.fn(async()=>({kind:'ready',data:{rows:versions,next:null}})),
  rounds:vi.fn(async(after:string|null)=>({kind:'ready',data:rounds(after)})),
  answers:vi.fn(async()=>({kind:'ready',data:{rows:[answer],next:null}})),
  open:vi.fn(async()=>({kind:'ready',data:true})),close:vi.fn(async()=>({kind:'ready',data:true})),setGap:vi.fn(async()=>({kind:'ready',data:true})),
 };
}
async function mount(adapter:ReturnType<typeof adapterWith>,locale:'en'|'ar'='en',onLookup?:(code:string)=>void) {
 container=document.createElement('div');document.body.append(container);root=createRoot(container);
 await act(async()=>root!.render(jsx(NextIntlClientProvider,{locale,messages:locale==='en'?en:ar,timeZone:'UTC',children:jsx(OwnerSurveys,{adapter:adapter as unknown as C2Adapter,ownerId:'synthetic-owner',onLookup})})));
 await act(async()=>{await new Promise(r=>setTimeout(r,0));});
}
const button=(text:string)=>Array.from(container.querySelectorAll('button')).find(b=>b.textContent===text)!;
const click=async(el:Element)=>act(async()=>{(el as HTMLElement).click();await new Promise(r=>setTimeout(r,0));});
const u=en.c2.surveysUx;

describe('RAD-099 launch flow',()=>{
 it('disables a survey that already has an OPEN round, with the reason, and launches another only after the summary',async()=>{
  const a=adapterWith(()=>({rows:[round(1,'SUS',true),round(2,'General',false)],next:null}));
  await mount(a);
  await click(button(u.launch));
  const radios=Array.from(container.querySelectorAll<HTMLInputElement>('input[type=radio]'));
  expect(radios.map(r=>r.disabled)).toEqual([true,false]);
  expect(container.textContent).toContain(u.alreadyOpen);
  expect(button(u.continue).disabled).toBe(true);
  await click(radios[1]!);
  await click(button(u.continue));
  expect(container.textContent).toContain(u.whoTitle);
  expect(container.textContent).toContain(u.interval.replace('{min}',String(GAP_MIN)));
  expect(container.textContent).toContain(u.gapUnknown);
  expect(a.open).not.toHaveBeenCalled();
  await click(button(u.confirmLaunch));
  expect(a.open).toHaveBeenCalledWith(id(2));
 });
 it('checks every rounds page within the cap and turns launching off when the cap is exceeded',async()=>{
  const pages=(after:string|null)=>({rows:[round(Number(after??0),'General',false)],next:String(Number(after??0)+1)});
  const read=vi.fn(async(after:string|null)=>({kind:'ready' as const,data:pages(after)}));
  const scan=await scanOpenRounds(read,5);
  expect(read).toHaveBeenCalledTimes(5);
  expect(scan).toEqual({kind:'ready',data:{open:new Set(),complete:false}});
  const a=adapterWith(pages);
  await mount(a);
  await click(button(u.launch));
  expect(Array.from(container.querySelectorAll<HTMLInputElement>('input[type=radio]')).every(r=>r.disabled)).toBe(true);
  expect(container.textContent).toContain(u.scanCapped.replace('{count}','100'));
 });
});

describe('RAD-099 interval floor and round cards',()=>{
 it('never accepts or keeps a value below the 7-day server minimum',async()=>{
  expect([gapValue('6'),gapValue('7'),gapValue('7.5'),gapValue(''),gapValue('3651'),gapValue('30')]).toEqual([null,7,null,null,null,30]);
  expect([floorGap('1'),floorGap('-3'),floorGap(''),floorGap('abc'),floorGap('9.9'),floorGap('99999')]).toEqual(['7','7','7','7','9','3650']);
  const a=adapterWith(()=>({rows:[],next:null}));
  await mount(a);
  const input=container.querySelector<HTMLInputElement>('input[type=number]')!;
  expect(input.min).toBe('7');
  const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;
  await act(async()=>{set.call(input,'3');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(button(en.c2.saveGap).disabled).toBe(true);
  await act(async()=>{input.focus();input.blur();});
  expect(input.value).toBe('7');
  await click(button(en.c2.saveGap));
  expect(a.setGap).toHaveBeenCalledWith(7);
  expect(container.textContent).toContain(u.gapSaved.replace('{days}','7'));
 });
 it('shows readable cards without raw ids and closes only after confirmation',async()=>{
  const a=adapterWith(()=>({rows:[round(1,'SUS',true)],next:null}));
  await mount(a);
  const card=container.querySelector('[data-testid=survey-round]')!;
  expect(card.textContent).toContain(`${u.names.SUS} · version 1`);
  expect(card.textContent).toContain('Opened ');
  expect(container.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  await click(button(en.c2.closeRound));
  expect(a.close).not.toHaveBeenCalled();
  expect(container.textContent).toContain(u.closeConfirm.replace('{pending}','1'));
  await click(button(u.closeYes));
  expect(a.close).toHaveBeenCalledWith(id(101));
 });
});

describe('RAD-099 participant lookup',()=>{
 it('answers show the code only and "Who is this?" hands that code to the Students tab',async()=>{
  const onLookup=vi.fn();
  await mount(adapterWith(()=>({rows:[round(1,'SUS',true)],next:null})),'en',onLookup);
  await click(button(en.c2.viewAnswers));
  expect(container.querySelector('[data-testid=c2-answers]')!.textContent).toContain('SYN-0001');
  expect(container.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-|@/);
  await click(container.querySelector('[data-testid=survey-who]')!);
  expect(onLookup).toHaveBeenCalledWith('SYN-0001');
 });
 it('stops at the first exact match, says "missing" at the end and "capped" after 200 accounts',async()=>{
  const people=(n:number)=>Array.from({length:20},(_,i)=>({code:`SYN-${n*20+i}`}));
  const read=vi.fn(async(page:number)=>({rows:people(page),next:page+1}));
  expect(await findParticipant('SYN-45',read,0)).toEqual({kind:'found',person:{code:'SYN-45'}});
  expect(read).toHaveBeenCalledTimes(3);
  read.mockClear();
  expect(await findParticipant('SYN-NONE',read,0)).toEqual({kind:'capped'});
  expect(read).toHaveBeenCalledTimes(LOOKUP_PAGES);
  expect(await findParticipant('SYN-NONE',async()=>({rows:people(0),next:null}),0)).toEqual({kind:'missing'});
  expect(await findParticipant('SYN-1',async()=>{throw new Error('private');},0)).toEqual({kind:'error'});
 });
});

describe('RAD-099 strings',()=>{
 const keys=(v:unknown,prefix=''):string[]=>v&&typeof v==='object'?Object.entries(v).flatMap(([k,x])=>keys(x,`${prefix}${k}.`)):[prefix];
 it('EN and AR define the same new keys',()=>{
  expect(keys(ar.c2.surveysUx)).toEqual(keys(en.c2.surveysUx));
  expect(keys(ar.ownerUx.who)).toEqual(keys(en.ownerUx.who));
 });
 it('AR renders the flow right-to-left text without missing keys',async()=>{
  const errors=vi.spyOn(console,'error').mockImplementation(()=>{});
  await mount(adapterWith(()=>({rows:[round(1,'SUS',true)],next:null})),'ar');
  await click(button(ar.c2.surveysUx.launch));
  expect(container.textContent).toContain(ar.c2.surveysUx.alreadyOpen);
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
 });
});
