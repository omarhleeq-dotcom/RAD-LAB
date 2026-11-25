'use client';
import {useEffect,useRef,useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {c2Button as btn,c2Field,safely,saveSurveyCsv,surveyCsv,type C2Adapter,type SurveyVersion,type Round,type Answer,type Outcome,type Page} from './c2-ui';
/** Server rule (c2_survey_settings.gap_days check): 7..3650 days. The UI never offers less. */
export const GAP_MIN=7,GAP_MAX=3650;
/** Bounded scans (S-STD-3): open-round guard reads ≤5 pages of 20 rounds; code lookup reads ≤10 directory pages of 20 accounts. */
export const ROUND_SCAN_PAGES=5,LOOKUP_PAGES=10;
const KNOWN=['SUS','General'] as const;
export const roundKey=(type:string,version:number)=>`${type}\u0000${version}`;
/** A whole number inside the server range, otherwise null (save stays disabled). */
export function gapValue(text:string):number|null {const n=Number(text);return text.trim()!==''&&Number.isInteger(n)&&n>=GAP_MIN&&n<=GAP_MAX?n:null;}
/** On leaving the field the draft is pulled back inside the server range; it can never sit below the floor. */
export function floorGap(text:string):string {const n=Math.trunc(Number(text));return String(!Number.isFinite(n)||n<GAP_MIN?GAP_MIN:n>GAP_MAX?GAP_MAX:n);}
/** Which survey versions already have an OPEN round, using the existing paged read only. */
export async function scanOpenRounds(read:(after:string|null)=>Promise<Outcome<Page<Round>>>,maxPages=ROUND_SCAN_PAGES):Promise<Outcome<{open:Set<string>;complete:boolean}>> {
 const open=new Set<string>();let after:string|null=null;
 for(let i=0;i<maxPages;i++){
  const r=await safely(()=>read(after));if(r.kind!=='ready')return r;
  for(const row of r.data.rows)if(row.closed_at==='infinity')open.add(roundKey(row.survey_type,row.version));
  if(!r.data.next)return {kind:'ready',data:{open,complete:true}};
  after=r.data.next;
 }
 return {kind:'ready',data:{open,complete:false}};
}
export type Lookup<T>={kind:'found';person:T}|{kind:'missing'}|{kind:'capped'}|{kind:'error'};
/** Pages the existing directory until the first exact code match; never more than `maxPages`. */
export async function findParticipant<T extends {code:string},P>(code:string,read:(position:P)=>Promise<{rows:T[];next:P|null}>,first:P,maxPages=LOOKUP_PAGES):Promise<Lookup<T>> {
 let position:P=first;
 for(let i=0;i<maxPages;i++){
  let page:{rows:T[];next:P|null};
  try{page=await read(position);}catch{return {kind:'error'};}
  const person=page.rows.find(p=>p.code===code);
  if(person)return {kind:'found',person};
  if(!page.next)return {kind:'missing'};
  position=page.next;
 }
 return {kind:'capped'};
}
type Flow={step:'choose'|'summary';scan:Outcome<{open:Set<string>;complete:boolean}>|null;choice:string};
/** Versioned definitions and server projections; pages replace previous rows. Participant codes only. */
export function OwnerSurveys({adapter,ownerId,onLookup}:{adapter:C2Adapter;ownerId:string|null;onLookup?:(code:string)=>void}) {
 const t=useTranslations('c2'),u=useTranslations('c2.surveysUx'),locale=useLocale();
 const [va,setVa]=useState<string|null>(null),[ra,setRa]=useState<string|null>(null),[aa,setAa]=useState<string|null>(null);
 const [round,setRound]=useState(''),[revision,setRevision]=useState(0),[gap,setGap]=useState(String(GAP_MIN)),[savedGap,setSavedGap]=useState<number|null>(null);
 const [data,setData]=useState<{key:string;versions:Outcome<Page<SurveyVersion>>;rounds:Outcome<Page<Round>>;answers:Outcome<Page<Answer>>}|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[flow,setFlow]=useState<Flow|null>(null),[closing,setClosing]=useState('');
 const [exportState,setExportState]=useState<{round:string;after:string|null;part:number;done:boolean}|null>(null);
 const flowHeading=useRef<HTMLHeadingElement>(null);
 const key=JSON.stringify([va,ra,aa,round,revision,ownerId]);
 useEffect(()=>{if(!ownerId)return;let active=true;
  void Promise.all([safely(()=>adapter.versions(va)),safely(()=>adapter.rounds(ra)),round?safely(()=>adapter.answers(round,aa)):Promise.resolve({kind:'ready' as const,data:{rows:[],next:null}})]).then(([versions,rounds,answers])=>{if(active)setData({key,versions,rounds,answers});});
  return()=>{active=false;};
 },[adapter,ownerId,va,ra,aa,round,revision,key]);
 useEffect(()=>{if(flow)flowHeading.current?.focus();},[flow?.step]); // eslint-disable-line react-hooks/exhaustive-deps
 if(!ownerId)return <p role="alert">{t('ownerOnly')}</p>;
 const view=data?.key===key?data:null;
 const failed=view&&[view.versions,view.rounds,view.answers].find(r=>r.kind!=='ready');
 const versions=view?.versions.kind==='ready'?view.versions.data:null,rounds=view?.rounds.kind==='ready'?view.rounds.data:null,answers=view?.answers.kind==='ready'?view.answers.data:null;
 const known=(type:string):type is typeof KNOWN[number]=>(KNOWN as readonly string[]).includes(type);
 const name=(type:string)=>known(type)?u(`names.${type}`):type;
 const describe=(v:SurveyVersion)=>known(v.survey_type)?u(`descriptions.${v.survey_type}`):u('customDescription',{count:v.definition.questions.length});
 const when=(s:string)=>{const d=new Date(s);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(d):s;};
 const selectedRound=rounds?.rows.find(r=>r.id===round);
 async function change(read:()=>Promise<Outcome<true>>,done?:()=>void) {
  if(busy)return;setBusy(true);setNotice('');const r=await safely(read);
  setNotice(r.kind==='ready'?'changed':r.kind==='unavailable'?'unavailable':'error');
  if(r.kind==='ready'){setRevision(v=>v+1);done?.();}setBusy(false);
 }
 async function startFlow() {
  setFlow({step:'choose',scan:null,choice:''});setNotice('');
  const scan=await scanOpenRounds(after=>adapter.rounds(after));
  setFlow(f=>f&&{...f,scan});
 }
 async function exportPart(restart=false) {
  if(busy||!round)return;setBusy(true);setNotice('');
  const continuation=!restart&&exportState?.round===round&&!exportState.done?exportState:null;
  const r=await safely(()=>adapter.answers(round,continuation?.after??null,100));
  if(r.kind==='ready'){
   try {const part=continuation?.part??1;saveSurveyCsv(`radlab-survey-${round}-part-${part}.csv`,surveyCsv(r.data.rows));setExportState({round,after:r.data.next,part:part+1,done:!r.data.next});setNotice('downloaded');}
   catch{setNotice('error');}
  }else setNotice(r.kind==='unavailable'?'unavailable':'error');
  setBusy(false);
 }
 const scan=flow?.scan?.kind==='ready'?flow.scan.data:null;
 const blocked=(v:SurveyVersion)=>!scan||!scan.complete||scan.open.has(roundKey(v.survey_type,v.version));
 const chosen=versions?.rows.find(v=>v.id===flow?.choice&&!blocked(v));
 const savedGapValue=gapValue(gap);
 return <section aria-labelledby="c2-surveys-title" className="min-w-0 space-y-4 rounded-lg border border-line bg-panel p-4" data-testid="c2-surveys">
  <h2 id="c2-surveys-title" className="text-xl font-semibold">{t('surveysTitle')}</h2>
  {(!view||failed)&&<p role={failed?.kind==='error'?'alert':'status'}>{t(!view?'loading':failed?.kind==='unavailable'?'unavailable':'error')}</p>}
  {notice&&<p role={notice==='error'?'alert':'status'}>{notice==='changed'?u('changed'):t(notice)}</p>}
  {view&&!failed&&versions&&rounds&&answers&&<>
   {!flow&&<button type="button" className={`${btn} bg-paper`} disabled={busy} onClick={()=>void startFlow()} data-testid="survey-launch">{u('launch')}</button>}
   {flow&&<section aria-labelledby="survey-flow-title" className="min-w-0 space-y-3 rounded-lg border border-line p-3" data-testid="survey-flow">
    <h3 id="survey-flow-title" ref={flowHeading} tabIndex={-1} className="text-lg font-semibold">{u('launchTitle')}</h3>
    <p className="text-sm text-muted">{u(flow.step==='choose'?'step1':'step2')}</p>
    {flow.step==='choose'&&<>
     {!flow.scan&&<p role="status">{u('checking')}</p>}
     {flow.scan&&flow.scan.kind!=='ready'&&<p role="alert">{t(flow.scan.kind==='unavailable'?'unavailable':'error')}</p>}
     {scan&&!scan.complete&&<p role="alert">{u('scanCapped',{count:ROUND_SCAN_PAGES*20})}</p>}
     {scan&&<fieldset className="min-w-0 space-y-2"><legend className="font-medium">{u('chooseLegend')}</legend>
      {versions.rows.map(v=>{const off=blocked(v),reason=`survey-reason-${v.id}`;return <label key={v.id} className={`flex min-h-11 items-start gap-3 rounded-md border border-line p-2 ${off?'opacity-70':''}`}>
       <input type="radio" name="survey-choice" className="mt-1 size-5 shrink-0" value={v.id} checked={flow.choice===v.id} disabled={off||busy} aria-describedby={reason} onChange={()=>setFlow({...flow,choice:v.id})}/>
       <span className="min-w-0"><strong className="block break-words">{u('nameVersion',{name:name(v.survey_type),version:v.version})}</strong><span id={reason} className="block text-sm">{describe(v)}{off&&scan.complete&&<strong className="block">{u('alreadyOpen')}</strong>}</span></span>
      </label>;})}
      {versions.rows.length===0&&<p>{t('empty')}</p>}
     </fieldset>}
     {(va||versions.next)&&<div className="flex flex-wrap gap-2"><button type="button" className={btn} disabled={busy||!va} onClick={()=>{setVa(null);setFlow({...flow,choice:''});}}>{t('first')}</button><button type="button" className={btn} disabled={busy||!versions.next} onClick={()=>{setVa(versions.next);setFlow({...flow,choice:''});}}>{t('nextVersions')}</button></div>}
     <div className="flex flex-wrap gap-2"><button type="button" className={btn} disabled={busy||!chosen} onClick={()=>setFlow({...flow,step:'summary'})}>{u('continue')}</button><button type="button" className={btn} onClick={()=>setFlow(null)}>{t('cancel')}</button></div>
    </>}
    {flow.step==='summary'&&chosen&&<>
     <p className="font-medium">{u('nameVersion',{name:name(chosen.survey_type),version:chosen.version})}</p>
     <h4 className="font-semibold">{u('whoTitle')}</h4>
     <ul className="list-disc space-y-1 ps-5 text-sm">{(['who1','who2','who3','who4'] as const).map(k=><li key={k}>{u(k)}</li>)}</ul>
     <h4 className="font-semibold">{u('intervalTitle')}</h4>
     <p className="text-sm">{u('interval',{min:GAP_MIN})}</p>
     <p className="text-sm">{savedGap===null?u('gapUnknown'):u('gapSaved',{days:savedGap})}</p>
     <div className="flex flex-wrap gap-2"><button type="button" className={`${btn} bg-paper`} disabled={busy} data-testid="survey-launch-confirm" onClick={()=>void change(()=>adapter.open(chosen.id),()=>setFlow(null))}>{u('confirmLaunch')}</button><button type="button" className={btn} disabled={busy} onClick={()=>setFlow({...flow,step:'choose'})}>{u('back')}</button><button type="button" className={btn} disabled={busy} onClick={()=>setFlow(null)}>{t('cancel')}</button></div>
    </>}
    {flow.step==='summary'&&!chosen&&<button type="button" className={btn} onClick={()=>setFlow({...flow,step:'choose',choice:''})}>{u('back')}</button>}
   </section>}
   <form className="flex flex-wrap items-end gap-2" onSubmit={e=>{e.preventDefault();const days=gapValue(gap);if(days!==null)void change(()=>adapter.setGap(days),()=>setSavedGap(days));}}>
    <label className="min-w-0">{t('gap')}<input type="number" inputMode="numeric" min={GAP_MIN} max={GAP_MAX} step={1} required aria-describedby="survey-gap-help" className={c2Field} value={gap} onChange={e=>setGap(e.target.value)} onBlur={()=>setGap(floorGap(gap))}/></label>
    <button className={btn} disabled={busy||savedGapValue===null}>{t('saveGap')}</button>
   </form>
   <div id="survey-gap-help" className="space-y-1 text-sm text-muted"><p>{u('gapFloor',{min:GAP_MIN,max:GAP_MAX})}</p><p>{savedGap===null?u('gapUnknown'):u('gapSaved',{days:savedGap})}</p></div>
   <h3 className="text-lg font-semibold">{u('roundsTitle')}</h3>
   <ul className="grid gap-3 sm:grid-cols-2" data-testid="survey-rounds">{rounds.rows.map(r=>{const open=r.closed_at==='infinity';return <li key={r.id} className="min-w-0 space-y-2 rounded-lg border border-line p-3" data-testid="survey-round">
    <div className="flex flex-wrap items-start justify-between gap-2"><p className="min-w-0 font-semibold break-words">{u('nameVersion',{name:name(r.survey_type),version:r.version})}</p><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${open?'border-brand':'border-line text-muted'}`}>{t(open?'open':'closed')}</span></div>
    <p className="text-sm">{u('opened',{date:when(r.opened_at)})}</p>
    {!open&&<p className="text-sm">{u('closedAt',{date:when(r.closed_at)})}</p>}
    <p className="text-sm">{t('roundCounts',{answered:r.answered,pending:r.pending})}</p>
    {closing===r.id?<div className="space-y-2" role="group" aria-label={t('closeRound')}><p role="alert" className="text-sm">{u('closeConfirm',{pending:r.pending})}</p><div className="flex flex-wrap gap-2"><button type="button" className={btn} disabled={busy} onClick={()=>void change(()=>adapter.close(r.id),()=>setClosing(''))}>{u('closeYes')}</button><button type="button" className={btn} disabled={busy} onClick={()=>setClosing('')}>{t('cancel')}</button></div></div>
    :<div className="flex flex-wrap gap-2"><button type="button" className={btn} disabled={busy} aria-pressed={round===r.id} onClick={()=>{setRound(r.id);setAa(null);setExportState(null);setNotice('');}}>{t('viewAnswers')}</button>{open&&<button type="button" className={btn} disabled={busy} onClick={()=>setClosing(r.id)}>{t('closeRound')}</button>}</div>}
   </li>;})}</ul>
   {rounds.rows.length===0&&<p>{t('empty')}</p>}
   {(ra||rounds.next)&&<div className="flex gap-2"><button type="button" className={btn} disabled={busy||!ra} onClick={()=>setRa(null)}>{t('first')}</button><button type="button" className={btn} disabled={busy||!rounds.next} onClick={()=>setRa(rounds.next)}>{t('nextRounds')}</button></div>}
   {round&&<section aria-labelledby="c2-answers-title" className="space-y-3" data-testid="c2-answers"><h3 id="c2-answers-title" className="text-lg font-semibold">{t('answersTitle')}</h3>
    {selectedRound&&<p className="text-sm">{u('nameVersion',{name:name(selectedRound.survey_type),version:selectedRound.version})} · {u('opened',{date:when(selectedRound.opened_at)})}</p>}
    <p className="text-sm text-muted">{u('whoHelp')}</p>
    <ul className="divide-y divide-line">{answers.rows.map(a=><li key={a.id} className="space-y-2 py-3" data-testid="survey-answer">
     <div className="flex flex-wrap items-center gap-2"><span className="text-sm">{u('code')}: <bdi className="break-all font-mono" dir="ltr">{a.participant_code}</bdi></span>{onLookup&&<button type="button" className={btn} data-testid="survey-who" aria-label={u('whoLabel',{code:a.participant_code})} onClick={()=>onLookup(a.participant_code)}>{u('who')}</button>}</div>
     <p>{t('answerDate',{date:when(a.answered_at)})}</p>{a.score!==null&&<p>{t('susScore',{score:a.score})}</p>}<dl>{Object.entries(a.answers).map(([id,value])=><div key={id} className="min-w-0"><dt className="font-semibold">{id}</dt><dd className="whitespace-pre-wrap break-words" dir="auto">{value}</dd></div>)}</dl></li>)}</ul>
    {answers.rows.length===0&&<p>{t('empty')}</p>}
    <div className="flex flex-wrap gap-2"><button type="button" className={btn} disabled={busy} onClick={()=>setAa(null)}>{t('first')}</button><button type="button" className={btn} disabled={busy||!answers.next} onClick={()=>setAa(answers.next)}>{t('nextAnswers')}</button><button type="button" className={btn} disabled={busy} onClick={()=>void exportPart(true)}>{t('export')}</button>{exportState?.round===round&&!exportState.done&&<button type="button" className={btn} disabled={busy} onClick={()=>void exportPart()}>{t('exportNext',{part:exportState.part})}</button>}</div>
    <p className="text-sm text-muted">{t('exportHelp')}</p>
   </section>}
  </>}
 </section>;
}
