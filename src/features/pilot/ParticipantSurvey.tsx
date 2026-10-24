'use client';
import {useEffect,useState} from 'react';
import {useLocale,useTranslations} from 'next-intl';
import {c2Button as btn,c2Field,safely,type C2Adapter,type Outcome,type Pending,type Sent} from './c2-ui';
function usePending(adapter:C2Adapter,participantId:string|null) {
 const [state,setState]=useState<{user:string;value:Outcome<Pending|null>}|null>(null);
 useEffect(()=>{if(!participantId)return;let active=true;void safely(()=>adapter.pending()).then(value=>{if(active)setState({user:participantId,value});});return()=>{active=false;};},[adapter,participantId]);
 return state?.user===participantId?state.value:null;
}
/** Persistent, non-blocking card. No local attempt counts, timers, dismissal or Practice gate. */
export function SurveyReminder({adapter,participantId,href}:{adapter:C2Adapter;participantId:string|null;href:string}) {
 const t=useTranslations('c2'),state=usePending(adapter,participantId);
 if(!participantId||!state||state.kind==='ready'&&!state.data)return null;
 return <aside aria-label={t('feedback')} className="space-y-3 rounded-lg border border-line bg-panel p-4" data-testid="c2-reminder">
  <h2 className="text-lg font-semibold">{t('feedback')}</h2>
  {state.kind==='ready'?<><p>{t('reminder')}</p><a className={`${btn} inline-block`} href={href}>{t('feedback')}</a></>:<p role={state.kind==='error'?'alert':'status'}>{t(state.kind==='unavailable'?'unavailable':'error')}</p>}
 </aside>;
}
export function ParticipantSurvey({adapter,participantId}:{adapter:C2Adapter;participantId:string|null}) {
 const t=useTranslations('c2'),state=usePending(adapter,participantId);
 if(!participantId)return <p>{t('signIn')}</p>;
 return <section className="min-w-0 space-y-4 rounded-lg border border-line bg-panel p-4" aria-labelledby="c2-feedback-title" data-testid="c2-survey">
  <h2 id="c2-feedback-title" className="text-xl font-semibold">{t('feedback')}</h2>
  {!state?<p role="status">{t('loading')}</p>:state.kind!=='ready'?<p role={state.kind==='error'?'alert':'status'}>{t(state.kind==='unavailable'?'unavailable':'error')}</p>:!state.data?<p role="status">{t('noPending')}</p>:<SurveyForm key={`${participantId}:${state.data.id}`} adapter={adapter} pending={state.data}/>}
 </section>;
}
function SurveyForm({adapter,pending}:{adapter:C2Adapter;pending:Pending}) {
 const t=useTranslations('c2'),locale=useLocale();
 const [answers,setAnswers]=useState<Record<string,string|number>>({}),[busy,setBusy]=useState(false),[sent,setSent]=useState<Sent|null>(null);
 const terminal=sent&&['ready','already','closed','stale'].includes(sent.kind);
 async function submit() {
  if(busy||terminal)return;setBusy(true);setSent(null);
  try {setSent(await adapter.submit({id:pending.id,answers:{...answers}}));}catch{setSent({kind:'error'});}finally{setBusy(false);}
 }
 if(terminal)return <p role="status" data-testid="c2-survey-result">{t(sent.kind==='ready'?'sent':sent.kind==='already'?'already':sent.kind==='closed'?'roundClosed':'stale')}</p>;
 const english=pending.definition.locale==='en';
 return <form className="space-y-5" onSubmit={e=>{e.preventDefault();void submit();}}>
  <p className="font-medium">{t('typeVersion',{type:pending.survey_type,version:pending.version})}</p>
  <p>{t('instructions')}</p><p className="text-sm text-muted">{t('privacy')}</p>
  {pending.definition.scoring==='sus'&&<p>{t('susEnglish')}</p>}
  {pending.definition.questions.map(q=>{
   const general=pending.survey_type==='General'&&pending.version===1&&['rating','liked','improve','bug'].includes(q.id);
   const label=general?t(`general.${q.id}`):q.label;
   return <div key={q.id} lang={general?locale:pending.definition.locale} dir={general?(locale==='ar'?'rtl':'ltr'):english?'ltr':'auto'}>
    <label className="block" htmlFor={`c2-q-${q.id}`}>{label}{q.optional?` (${t('optional')})`:''}</label>
    {q.kind==='rating'?<select id={`c2-q-${q.id}`} required={!q.optional} className={c2Field} value={answers[q.id]??''} disabled={busy} onChange={e=>setAnswers(a=>{const next={...a};if(e.target.value)next[q.id]=Number(e.target.value);else delete next[q.id];return next;})}><option value="">{t('choose')}</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{t(pending.definition.scoring==='sus'?`scale.${n}`:`rating.${n}`)}</option>)}</select>:<textarea id={`c2-q-${q.id}`} required={!q.optional} maxLength={1000} rows={3} dir="auto" className={c2Field} value={answers[q.id]??''} disabled={busy} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>}
   </div>;
  })}
  {pending.definition.citation&&<p lang="en" dir="ltr" className="break-words text-sm text-muted">{pending.definition.citation}</p>}
  {sent&&<p role={sent.kind==='error'?'alert':'status'}>{t(sent.kind==='unavailable'?'unavailable':'error')}</p>}
  <button className={btn} disabled={busy}>{t(busy?'sending':'submit')}</button>
 </form>;
}
