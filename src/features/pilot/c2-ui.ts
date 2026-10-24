// UI contracts only. No deferred module, client creation or network access here.
import { toCsv } from './owner-data';
export const c2Button = 'min-h-11 rounded-md border border-line px-3 py-2 text-sm font-medium hover:bg-paper disabled:opacity-60';
export const c2Field = 'mt-1 block w-full rounded-md border border-line bg-panel p-2 text-ink';
export type Outcome<T> = {kind:'ready';data:T}|{kind:'unavailable'}|{kind:'error'};
export type Page<T> = {rows:T[];next:string|null};
export type DirectoryPosition = {cursor:{id:string;rank:number}|null;boundary:string|null};
export const C2_FIRST:DirectoryPosition = {cursor:null,boundary:null};
export type Person = {id:string;code:string;status:'pending'|'approved'|'suspended';role:'owner'|'participant'};
export type Directory = {rows:Person[];next:DirectoryPosition|null;counts:Record<Person['status'],number>};
export type Deletion = {id:string;code:string;days:number;expires:string};
export type Question = {id:string;kind:'rating'|'text';label:string;optional:boolean};
export type Definition = {locale:string;scoring:'sus'|'none';citation?:string;questions:Question[]};
export type SurveyVersion = {id:string;survey_type:string;version:number;definition:Definition};
export type Round = {id:string;survey_type:string;version:number;closed_at:string;answered:number;pending:number};
export type Answer = {id:string;participant_code:string;round_id:string;survey_type:string;version:number;answered_at:string;answers:Record<string,string|number>;score:number|null};
export type Pending = {id:string;round_id:string;survey_type:string;version:number;definition:Definition};
export type Submission = {id:string;answers:Record<string,string|number>};
export type Sent = Outcome<true>|{kind:'already'}|{kind:'closed'}|{kind:'stale'};
export interface C2Adapter {
 directory(search:string,status:string,position:DirectoryPosition):Promise<Outcome<Directory>>;
 deletions(after:string|null):Promise<Outcome<Page<Deletion>>>;
 deletion(action:'deactivate'|'restore'|'finalise',user?:string):Promise<Outcome<number>>;
 versions(after:string|null):Promise<Outcome<Page<SurveyVersion>>>;
 rounds(after:string|null):Promise<Outcome<Page<Round>>>;
 answers(round:string,after:string|null,limit?:number):Promise<Outcome<Page<Answer>>>;
 open(version:string):Promise<Outcome<true>>;
 close(round:string):Promise<Outcome<true>>;
 setGap(days:number):Promise<Outcome<true>>;
 pending():Promise<Outcome<Pending|null>>;
 submit(value:Submission):Promise<Sent>;
}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string'&&v.length>0;
const integer=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const stamp=(v:unknown):v is string=>text(v)&&Number.isFinite(Date.parse(v));
function invalid():never {throw new Error('Invalid C2 projection');}
export function parseDefinition(v:unknown):Definition {
 if(!record(v)||!text(v.locale)||!['sus','none'].includes(String(v.scoring))||!Array.isArray(v.questions)||v.questions.length<1||v.questions.length>10) return invalid();
 const ids=new Set<string>();
 const questions=v.questions.map(q=>{
  if(!record(q)||!text(q.id)||!/^[a-z][a-z0-9_]{0,39}$/.test(q.id)||ids.has(q.id)||!['rating','text'].includes(String(q.kind))||!text(q.label)||q.label.length>1000||typeof q.optional!=='boolean')return invalid();
  ids.add(q.id);return {id:q.id,kind:q.kind as Question['kind'],label:q.label,optional:q.optional};
 });
 if(v.scoring==='sus'&&(v.locale!=='en'||questions.length!==10||questions.some(q=>q.kind!=='rating'||q.optional)||!text(v.citation)))return invalid();
 return {locale:v.locale,scoring:v.scoring as Definition['scoring'],questions,...(text(v.citation)?{citation:v.citation}:{})};
}
export function parsePage<T>(v:unknown,limit:number,row:(v:unknown)=>T):Page<T> {
 if(!record(v)||!Array.isArray(v.rows)||v.rows.length>limit||(v.next!==null&&!text(v.next)))return invalid();
 const rows=v.rows.map(row);
 if(v.next!==null&&rows.length===0)return invalid();
 return {rows,next:v.next as string|null};
}
export function parsePerson(v:unknown):Person {
 if(!record(v)||!text(v.user_id)||!text(v.participant_code)||!['pending','approved','suspended'].includes(String(v.status))||!['owner','participant'].includes(String(v.role)))return invalid();
 return {id:v.user_id,code:v.participant_code,status:v.status as Person['status'],role:v.role as Person['role']};
}
export function parseDirectory(v:unknown):Directory {
 if(!record(v)||v.version!==1||!Array.isArray(v.rows)||v.rows.length>20||!record(v.counts)||!['pending','approved','suspended'].every(s=>integer((v.counts as Record<string,unknown>)[s]))||!stamp(v.boundary))return invalid();
 let next:DirectoryPosition|null=null;
 if(v.next!==null){if(!record(v.next)||!text(v.next.id)||!integer(v.next.rank)||v.next.rank>2)return invalid();next={cursor:{id:v.next.id,rank:v.next.rank},boundary:v.boundary};}
 return {rows:v.rows.map(parsePerson),next,counts:v.counts as Directory['counts']};
}
export function parseDeletion(v:unknown):Deletion {
 if(!record(v)||!text(v.user_id)||!text(v.participant_code)||!integer(v.days_left)||v.days_left>30||!stamp(v.expires_at))return invalid();
 return {id:v.user_id,code:v.participant_code,days:v.days_left,expires:v.expires_at};
}
export function parseVersion(v:unknown):SurveyVersion {
 if(!record(v)||!text(v.id)||!text(v.survey_type)||!integer(v.version)||v.version<1)return invalid();
 return {id:v.id,survey_type:v.survey_type,version:v.version,definition:parseDefinition(v.definition)};
}
export function parseRound(v:unknown):Round {
 if(!record(v)||!text(v.id)||!text(v.survey_type)||!integer(v.version)||v.version<1||(v.closed_at!=='infinity'&&!stamp(v.closed_at))||!integer(v.answered)||!integer(v.pending))return invalid();
 return {id:v.id,survey_type:v.survey_type,version:v.version,closed_at:v.closed_at as string,answered:v.answered,pending:v.pending};
}
export function parseAnswer(v:unknown):Answer {
 if(!record(v)||!text(v.id)||!text(v.participant_code)||!text(v.round_id)||!text(v.survey_type)||!integer(v.version)||!stamp(v.answered_at)||!record(v.answers)||Object.keys(v.answers).length>10||!Object.values(v.answers).every(a=>typeof a==='string'?a.length<=1000:integer(a)&&a>=1&&a<=5)||(v.score!==null&&(typeof v.score!=='number'||!Number.isFinite(v.score)||v.score<0||v.score>100)))return invalid();
 return {id:v.id,participant_code:v.participant_code,round_id:v.round_id,survey_type:v.survey_type,version:v.version,answered_at:v.answered_at,answers:v.answers as Answer['answers'],score:v.score as Answer['score']};
}
export function parsePending(v:unknown):Pending|null {
 if(!record(v))return invalid();
 if(v.pending===null)return null;
 const p=v.pending;
 if(!record(p)||!text(p.id)||!text(p.round_id)||!text(p.survey_type)||!integer(p.version)||p.version<1)return invalid();
 return {id:p.id,round_id:p.round_id,survey_type:p.survey_type,version:p.version,definition:parseDefinition(p.definition)};
}
/** One bounded server projection per file. Flatten answers so formula guard sees every free-text cell. */
export function surveyCsv(rows:Answer[]):string {
 return toCsv(['participant_code','round_id','survey_type','version','answered_at','score','question_id','answer'],rows.flatMap(r=>Object.entries(r.answers).map(([id,value])=>[r.participant_code,r.round_id,r.survey_type,r.version,r.answered_at,r.score,id,value])));
}
export function saveSurveyCsv(name:string,csv:string) {
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
/** Every supplied operation, including injected adapters, fails to a safe UI state. */
export async function safely<T>(read:()=>Promise<Outcome<T>>):Promise<Outcome<T>> {try{return await read();}catch{return {kind:'error'};}}
