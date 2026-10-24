'use client';
import {useEffect,useState} from 'react';
import {useTranslations} from 'next-intl';
import {c2Button as btn,c2Field,safely,saveSurveyCsv,surveyCsv,type C2Adapter,type SurveyVersion,type Round,type Answer,type Outcome,type Page} from './c2-ui';
/** Versioned definitions and server projections; pages replace previous rows. */
export function OwnerSurveys({adapter,ownerId}:{adapter:C2Adapter;ownerId:string|null}) {
 const t=useTranslations('c2');
 const [va,setVa]=useState<string|null>(null),[ra,setRa]=useState<string|null>(null),[aa,setAa]=useState<string|null>(null);
 const [round,setRound]=useState(''),[version,setVersion]=useState(''),[revision,setRevision]=useState(0),[gap,setGap]=useState(7);
 const [data,setData]=useState<{key:string;versions:Outcome<Page<SurveyVersion>>;rounds:Outcome<Page<Round>>;answers:Outcome<Page<Answer>>}|null>(null);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [exportState,setExportState]=useState<{round:string;after:string|null;part:number;done:boolean}|null>(null);
 const key=JSON.stringify([va,ra,aa,round,revision,ownerId]);
 useEffect(()=>{if(!ownerId)return;let active=true;
  void Promise.all([safely(()=>adapter.versions(va)),safely(()=>adapter.rounds(ra)),round?safely(()=>adapter.answers(round,aa)):Promise.resolve({kind:'ready' as const,data:{rows:[],next:null}})]).then(([versions,rounds,answers])=>{if(active)setData({key,versions,rounds,answers});});
  return()=>{active=false;};
 },[adapter,ownerId,va,ra,aa,round,revision,key]);
 if(!ownerId)return <p role="alert">{t('ownerOnly')}</p>;
 const view=data?.key===key?data:null;
 const failed=view&&[view.versions,view.rounds,view.answers].find(r=>r.kind!=='ready');
 const versions=view?.versions.kind==='ready'?view.versions.data:null,rounds=view?.rounds.kind==='ready'?view.rounds.data:null,answers=view?.answers.kind==='ready'?view.answers.data:null;
 async function change(read:()=>Promise<Outcome<true>>) {
  if(busy)return;setBusy(true);setNotice('');const r=await safely(read);
  setNotice(r.kind==='ready'?'changed':r.kind==='unavailable'?'unavailable':'error');
  if(r.kind==='ready')setRevision(v=>v+1);setBusy(false);
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
 return <section aria-labelledby="c2-surveys-title" className="min-w-0 space-y-4 rounded-lg border border-line bg-panel p-4" data-testid="c2-surveys">
  <h2 id="c2-surveys-title" className="text-xl font-semibold">{t('surveysTitle')}</h2>
  {(!view||failed)&&<p role={failed?.kind==='error'?'alert':'status'}>{t(!view?'loading':failed?.kind==='unavailable'?'unavailable':'error')}</p>}
  {notice&&<p role={notice==='error'?'alert':'status'}>{t(notice)}</p>}
  {view&&!failed&&versions&&rounds&&answers&&<>
   <div className="flex flex-wrap items-end gap-2"><label className="min-w-0 flex-1">{t('version')}<select className={c2Field} value={version} disabled={busy} onChange={e=>setVersion(e.target.value)}><option value="">{t('choose')}</option>{versions.rows.map(v=><option key={v.id} value={v.id}>{t('typeVersion',{type:v.survey_type,version:v.version})}</option>)}</select></label><button className={btn} disabled={busy||!versions.rows.some(v=>v.id===version)} onClick={()=>void change(()=>adapter.open(version))}>{t('openRound')}</button></div>
   <div className="flex gap-2"><button className={btn} disabled={busy} onClick={()=>{setVa(null);setVersion('');}}>{t('first')}</button><button className={btn} disabled={busy||!versions.next} onClick={()=>{setVa(versions.next);setVersion('');}}>{t('nextVersions')}</button></div>
   <form className="flex flex-wrap items-end gap-2" onSubmit={e=>{e.preventDefault();void change(()=>adapter.setGap(gap));}}><label>{t('gap')}<input type="number" min={7} max={3650} required className={c2Field} value={gap} onChange={e=>setGap(Number(e.target.value))}/></label><button className={btn} disabled={busy||!Number.isInteger(gap)||gap<7||gap>3650}>{t('saveGap')}</button></form>
   <p className="text-sm text-muted">{t('gapHelp')}</p>
   <ul className="divide-y divide-line">{rounds.rows.map(r=><li key={r.id} className="space-y-2 py-3"><p className="font-medium">{t('typeVersion',{type:r.survey_type,version:r.version})} · {t(r.closed_at==='infinity'?'open':'closed')}</p><p className="break-all font-mono text-sm" dir="ltr">{r.id}</p><p>{t('roundCounts',{answered:r.answered,pending:r.pending})}</p><div className="flex flex-wrap gap-2"><button className={btn} disabled={busy} onClick={()=>{setRound(r.id);setAa(null);setExportState(null);setNotice('');}}>{t('viewAnswers')}</button>{r.closed_at==='infinity'&&<button className={btn} disabled={busy} onClick={()=>void change(()=>adapter.close(r.id))}>{t('closeRound')}</button>}</div></li>)}</ul>
   {rounds.rows.length===0&&<p>{t('empty')}</p>}
   <div className="flex gap-2"><button className={btn} disabled={busy} onClick={()=>setRa(null)}>{t('first')}</button><button className={btn} disabled={busy||!rounds.next} onClick={()=>setRa(rounds.next)}>{t('nextRounds')}</button></div>
   {round&&<section aria-labelledby="c2-answers-title" className="space-y-3" data-testid="c2-answers"><h3 id="c2-answers-title" className="text-lg font-semibold">{t('answersTitle')}</h3><p className="break-all font-mono text-sm" dir="ltr">{round}</p>
    <ul className="divide-y divide-line">{answers.rows.map(a=><li key={a.id} className="space-y-2 py-3"><bdi className="break-all font-mono">{a.participant_code}</bdi><p>{t('answerDate',{date:a.answered_at})}</p>{a.score!==null&&<p>{t('susScore',{score:a.score})}</p>}<dl>{Object.entries(a.answers).map(([id,value])=><div key={id} className="min-w-0"><dt className="font-semibold">{id}</dt><dd className="whitespace-pre-wrap break-words" dir="auto">{value}</dd></div>)}</dl></li>)}</ul>
    {answers.rows.length===0&&<p>{t('empty')}</p>}
    <div className="flex flex-wrap gap-2"><button className={btn} disabled={busy} onClick={()=>setAa(null)}>{t('first')}</button><button className={btn} disabled={busy||!answers.next} onClick={()=>setAa(answers.next)}>{t('nextAnswers')}</button><button className={btn} disabled={busy} onClick={()=>void exportPart(true)}>{t('export')}</button>{exportState?.round===round&&!exportState.done&&<button className={btn} disabled={busy} onClick={()=>void exportPart()}>{t('exportNext',{part:exportState.part})}</button>}</div>
    <p className="text-sm text-muted">{t('exportHelp')}</p>
   </section>}
  </>}
 </section>;
}
