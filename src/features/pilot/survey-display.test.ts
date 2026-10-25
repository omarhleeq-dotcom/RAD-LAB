// @vitest-environment jsdom
import {act} from 'react';
import {jsx} from 'react/jsx-runtime';
import {createRoot,type Root} from 'react-dom/client';
import {NextIntlClientProvider} from 'next-intl';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import {ParticipantSurvey} from './ParticipantSurvey';
import type {C2Adapter,Definition,Pending,Submission} from './c2-ui';

const sql=readFileSync('supabase/migrations/20261024000200_owner_deletion_surveys.sql','utf8');
const definitions:Record<string,Definition>={
 SUS:JSON.parse(sql.match(/\('SUS',1,'(.*?)'\),/s)![1]!),
 General:JSON.parse(sql.match(/\('General',1,'(.*?)'\);/s)![1]!)
};
let root:Root|undefined;
let container:HTMLDivElement;
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
afterEach(async()=>{if(root)await act(()=>root!.unmount());root=undefined;container?.remove();});
async function mount(locale:'en'|'ar',type='SUS',version=1,catalog=en as typeof en|typeof ar,definition=definitions[type]!) {
 container=document.createElement('div');document.body.append(container);root=createRoot(container);
 const pending:Pending={id:'response',round_id:'round',survey_type:type,version,definition};
 const submit=vi.fn<(value:Submission)=>Promise<{kind:'ready';data:true}>>(async()=>({kind:'ready',data:true}));
 const adapter={pending:async()=>({kind:'ready',data:pending}),submit} as unknown as C2Adapter;
 await act(async()=>root!.render(jsx(NextIntlClientProvider,{locale,messages:catalog,timeZone:'UTC',children:jsx(ParticipantSurvey,{adapter,participantId:'synthetic'})})));
 return {submit,pending};
}
const labels=()=>Array.from(container.querySelectorAll('legend,div > label.block')).map(el=>el.textContent);
describe('versioned participant display only',()=>{
 for(const type of ['SUS','General']) {
  it(`${type}: EN uses the stored labels byte for byte`,async()=>{
   await mount('en',type);
   expect(labels()).toEqual(definitions[type]!.questions.map(q=>q.label+(q.optional?' (optional)':'')));
  });
  it(`${type}: AR renders every translated item without mutating definitions`,async()=>{
   const before=JSON.stringify(definitions[type]);const {pending}=await mount('ar',type,1,ar);
   const expected=ar.c2.surveyDisplay[type as 'SUS'|'General'].v1 as Record<string,string>;
   expect(labels()).toEqual(pending.definition.questions.map(q=>expected[q.id]+(q.optional?' (اختياري)':'')));
   expect(container.textContent).toContain(ar.c2.instructions);
   expect(container.querySelector('fieldset')?.dir).toBe('rtl');
   expect(container.querySelector('legend')?.lang).toBe('ar');
   expect(JSON.stringify(pending.definition)).toBe(before);
  });
  it(`${type}: unknown version falls back to English`,async()=>{
   await mount('ar',type,2,ar);
   expect(labels()).toEqual(definitions[type]!.questions.map(q=>q.label+(q.optional?' (اختياري)':'')));
   expect(container.querySelector('legend')?.dir).toBe('ltr');
  });
 }
 it('missing translation key falls back to the stored label without an intl error',async()=>{
  const catalog=structuredClone(ar);delete (catalog.c2.surveyDisplay.SUS.v1 as Partial<typeof ar.c2.surveyDisplay.SUS.v1>).q1;
  await mount('ar','SUS',1,catalog);
  expect(labels()[0]).toBe(definitions.SUS!.questions[0]!.label);
  expect(labels()[1]).toBe(ar.c2.surveyDisplay.SUS.v1.q2);
  expect(container.querySelector('legend')?.lang).toBe('en');
 });
 it('unknown type and question ids use stored English labels',async()=>{
  await mount('ar','Future',1,ar,{locale:'en',scoring:'none',questions:[{id:'future_question',kind:'rating',optional:false,label:'Stored future label'}]});
  expect(labels()).toEqual(['Stored future label']);
 });
 for(const type of ['SUS','General'])it(`${type}: EN and AR submissions have identical bytes and numeric ids/values`,async()=>{
  const payloads:string[]=[];
  for(const locale of ['en','ar'] as const){
   const {submit}=await mount(locale,type,1,locale==='en'?en:ar);
   for(const [i,group] of Array.from(container.querySelectorAll('fieldset')).entries()){
    const input=group.querySelectorAll<HTMLInputElement>('input')[i%5]!;await act(()=>input.click());
   }
   // General text remains exactly what the participant entered; no display text enters answers.
   for(const textarea of container.querySelectorAll('textarea')){
    await act(()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(textarea,'Synthetic text نص');textarea.dispatchEvent(new Event('input',{bubbles:true}));});
   }
   await act(()=>container.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
   expect(submit).toHaveBeenCalledOnce();payloads.push(JSON.stringify(submit.mock.calls[0]![0]));
   await act(()=>root!.unmount());root=undefined;container.remove();
  }
  expect(payloads[0]).toBe(payloads[1]);
  const answers=JSON.parse(payloads[0]!).answers;
  expect(Object.keys(answers)).toEqual(definitions[type]!.questions.map(q=>q.id));
  expect(answers[type==='SUS'?'q1':'rating']).toBe(1);
 });
});
