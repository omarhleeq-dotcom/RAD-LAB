"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EXAMS, getExam } from "@/data/exams";
import { localize } from "@/lib/localized";
import { CsvBar } from "./OwnerActivity";
import { EMPTY_FILTERS, localDateBound, parseAttempts, parseNotes, type Cursor, type OwnerFilters } from "./owner-data";
import { OwnerDirectory, ownerButton as btn } from "./OwnerDirectory";
import { useOwnerData } from "./useOwnerData";
import { getPilotClient } from "./client";
import { examSummaryPage, FIRST, type DirectoryPerson, type ExamSummary, type Position } from "./owner-dashboard-data";
function Summaries({filters}:{filters:OwnerFilters}) {
 const t=useTranslations("owner.dashboard"),locale=useLocale();
 const [position,setPosition]=useState<Position>(FIRST),[result,setResult]=useState<{key:string;rows?:ExamSummary[];next?:Position|null;missing?:boolean;error?:boolean}>({key:""});
 const key=JSON.stringify([filters,position]);
 useEffect(()=>{let ignore=false;void(async()=>{try{const c=await getPilotClient();if(!c)throw new Error();const p=await examSummaryPage(c,filters,position);if(!ignore)setResult(p?{key,...p}:{key,missing:true});}catch{if(!ignore)setResult({key,error:true});}})();return()=>{ignore=true;};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[key]);
 const r=result.key===key?result:null;
 const exam=(id:string)=>{const e=getExam(id);return e?localize(e.title,locale):t("archivedExam");};
 return <section className="space-y-2"><h3 className="text-lg font-semibold">{t("byExam")}</h3><p className="text-sm text-muted">{t("savedOnly")}</p>
  {!r&&<p role="status">{t("loading")}</p>}{r?.missing&&<p role="status">{t("needsMigration")}</p>}{r?.error&&<p role="alert">{t("error")}</p>}
  {r?.rows?.length===0&&<p>{t("empty")}</p>}
  <ul className="divide-y divide-line">{r?.rows?.map(e=><li key={e.exam} className="py-3"><h4 className="font-semibold">{exam(e.exam)}</h4><p>{t("examCounts",{attempts:e.attempts,rate:e.known?Math.round(e.passed/e.known*100):0,known:e.known})}</p><p className="text-sm text-muted">{t("wrong")}: {e.wrong.length?e.wrong.map(w=>`${getExam(e.exam)?.rules.find(rule=>rule.id===w.id)?.label ? localize(getExam(e.exam)!.rules.find(rule=>rule.id===w.id)!.label,locale) : w.id} (${w.count})`).join(" · "):t("noWrong")}</p></li>)}</ul>
  {r?.rows&&<div className="flex gap-2"><button className={btn} onClick={()=>setPosition(FIRST)}>{t("first")}</button><button className={btn} disabled={!r.next} onClick={()=>setPosition(r.next!)}>{t("next")}</button></div>}
 </section>;
}
function SavedRows({filters}:{filters:OwnerFilters}) {
 const t=useTranslations("owner.dashboard"),ot=useTranslations("owner"),locale=useLocale();
 const [stream,setStream]=useState<"attempts"|"notes">("notes"),[cursor,setCursor]=useState<Cursor|null>(null),[boundary,setBoundary]=useState<string|null>(null);
 const attempts=useOwnerData(true,0,"attempts",filters,stream==="attempts"?cursor:null,stream==="attempts"?boundary:null);
 const notes=useOwnerData(true,0,"notes",filters,stream==="notes"?cursor:null,stream==="notes"?boundary:null);
 const current=stream==="notes"?notes:attempts,page=current.kind==="ready"?current.page:null;
 const pa=parseAttempts(stream==="attempts"?page?.rows:[]),pn=parseNotes(stream==="notes"?page?.rows:[]);
 const exam=(id:string)=>{const e=getExam(id);return e?localize(e.title,locale):t("archivedExam");};
 const date=(iso:string)=>new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short"}).format(new Date(iso));
 return <section className="space-y-3">
  <p data-testid="matching-counts" role="status">{attempts.kind==="ready"&&notes.kind==="ready"?t("matching",{attempts:attempts.page.total,notes:notes.page.total}):t("loading")}</p>
  {(attempts.kind==="error"||notes.kind==="error")&&<p role="alert">{t("error")}</p>}
  {attempts.kind==="ready"&&notes.kind==="ready"&&<CsvBar filters={filters}/>}
  <div className="flex gap-2">{(["notes","attempts"] as const).map(s=><button key={s} className={btn} aria-pressed={stream===s} onClick={()=>{setStream(s);setCursor(null);setBoundary(null);}}>{t(s)}</button>)}</div>
  {current.kind==="loading"&&<p role="status">{t("loading")}</p>}
  {page?.rows.length===0&&<p>{t("empty")}</p>}
  {pa.skipped+pn.skipped>0&&<p role="alert">{ot("activity.skipped",{count:pa.skipped+pn.skipped})}</p>}
  <ul className="divide-y divide-line" data-testid="saved-owner-rows">
   {pn.items.map(n=><li key={n.id} className="py-3"><p className="text-sm text-muted">{exam(n.examId)} · <time dateTime={n.at}>{date(n.at)}</time> · <bdi>{String(page?.rows.find(r=>String(r.id)===n.id)?.participant_code??"")}</bdi></p><p className="mt-1 whitespace-pre-wrap break-words" dir="auto">{n.text}</p></li>)}
   {pa.items.map(a=><li key={a.id} className="py-3"><p>{exam(a.examId)} · {date(a.finishedAt)} · <bdi>{String(page?.rows.find(r=>r.id===a.id)?.participant_code??"")}</bdi></p><p>{ot(a.passed?"activity.passed":"activity.notPassed")} · {a.total}</p></li>)}
  </ul>
  <div className="flex gap-2"><button className={btn} onClick={()=>{setCursor(null);setBoundary(null);}}>{t("first")}</button><button className={btn} disabled={!page?.next} onClick={()=>{setCursor(page!.next);setBoundary(page!.boundary);}}>{t("next")}</button></div>
 </section>;
}
const subscribeZone = () => () => {};
export function OwnerTraining() {
 const t=useTranslations("owner.dashboard"),locale=useLocale();
 const [person,setPerson]=useState<DirectoryPerson|null>(null),[exam,setExam]=useState(""),[from,setFrom]=useState(""),[to,setTo]=useState("");
 const zone=useSyncExternalStore(subscribeZone,()=>Intl.DateTimeFormat().resolvedOptions().timeZone,()=>"");
 const invalid=!!from&&!!to&&from>to;
 const filters={...EMPTY_FILTERS,participant:person?.userId??"",participantCode:person?.code??"",exam,from:localDateBound(from),to:localDateBound(to,true)};
 return <div className="space-y-5" data-testid="owner-training"><h2 className="text-xl font-semibold">{t("training")}</h2><p>{t("sameFilters")}</p>
  <details className="rounded border border-line p-2"><summary className="min-h-11 cursor-pointer">{t("participant")}: {person?.name||person?.email||t("all")}</summary>
   {person&&<button className={btn} onClick={()=>setPerson(null)}>{t("clear")}</button>}<OwnerDirectory picker selected={person?[person.userId]:[]} onSelect={p=>setPerson(person?.userId===p.userId?null:p)}/>
  </details>
  <div className="flex flex-wrap gap-3"><label className="min-w-0 text-sm">{t("exam")}<select data-testid="filter-exam" className="block max-w-full rounded border border-line bg-panel p-2" value={exam} onChange={e=>setExam(e.target.value)}><option value="">{t("all")}</option>{EXAMS.map(e=><option key={e.id} value={e.id}>{localize(e.title,locale)}</option>)}</select></label>
   {(["from","to"] as const).map(k=><label key={k} className="text-sm">{t(k)}<input data-testid={`filter-${k}`} type="date" className="block rounded border border-line bg-panel p-2" value={k==="from"?from:to} onChange={e=>(k==="from"?setFrom:setTo)(e.target.value)}/></label>)}
  </div><p className="text-sm text-muted">{t("zone",{zone})}</p>
  {invalid?<p role="alert">{t("dateError")}</p>:<div key={JSON.stringify(filters)} className="space-y-5"><Summaries filters={filters}/><SavedRows filters={filters}/></div>}
 </div>;
}
