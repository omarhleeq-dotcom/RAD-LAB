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
   // Display only: definitions, answer ids/values and submission order stay untouched.
   const key=`surveyDisplay.${pending.survey_type}.v${pending.version}.${q.id}`;
   const translated=locale==='ar'&&english&&t.has(key);
   const label=translated?t(key):q.label;
   const language=translated?'ar':pending.definition.locale;
   const direction=translated?'rtl':english?'ltr':'auto';
   if(q.kind==='rating')return <fieldset key={q.id} disabled={busy} lang={locale} dir={locale==='ar'?'rtl':'ltr'} className="min-w-0 space-y-2">
    <legend className="mb-2 block w-full" lang={language} dir={direction}>{label}{q.optional?` (${t('optional')})`:''}</legend>
    <div className="grid grid-cols-5 gap-2">
     {[1,2,3,4,5].map(n=><label key={n} className="flex min-h-14 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-line p-2 has-checked:border-signal has-checked:bg-paper focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-signal">
      <input type="radio" name={`c2-q-${q.id}`} value={n} required={!q.optional} checked={answers[q.id]===n} aria-label={t(`scale.${n}`)} className="size-5 accent-signal" onChange={()=>setAnswers(a=>({...a,[q.id]:n}))}/>
      <span aria-hidden="true">{n}</span>
     </label>)}
    </div>
    <div className="flex justify-between gap-4 text-sm text-muted" data-testid="c2-scale-endpoints"><span className="max-w-[45%]">{t('scaleStart')}</span><span className="max-w-[45%]">{t('scaleEnd')}</span></div>
   </fieldset>;
   return <div key={q.id} lang={language} dir={direction}>
    <label className="block" htmlFor={`c2-q-${q.id}`}>{label}{q.optional?` (${t('optional')})`:''}</label>
    <textarea id={`c2-q-${q.id}`} required={!q.optional} maxLength={1000} rows={3} dir="auto" className={c2Field} value={answers[q.id]??''} disabled={busy} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))}/>
   </div>;
  })}
  {pending.definition.citation&&<p lang="en" dir="ltr" className="break-words text-sm text-muted">{pending.definition.citation}</p>}
  {sent&&<p role={sent.kind==='error'?'alert':'status'}>{t(sent.kind==='unavailable'?'unavailable':'error')}</p>}
  <button className={btn} disabled={busy}>{t(busy?'sending':'submit')}</button>
 </form>;
}
