import type { SupabaseClient } from '@supabase/supabase-js';
import { PILOT } from '@/features/pilot/config';
import { isObject, isUuid } from '../data-guards';
import { parseHistoryPage } from '../history-data';
import { SelfServiceError, type SelfServicePort, type Transport, type Page, type Metadata, type Eligibility, type Permission, type Status, type Recommendation } from './contracts';
const invalid = (): never => { throw new SelfServiceError('invalid'); };
const record = (v: unknown) => isObject(v) ? v : invalid();
const uuid = (v: unknown): string => isUuid(v) ? v : invalid();
const integer = (v: unknown, min = 0, max = 1_000_000): number => Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max ? Number(v) : invalid();
const time = (v: unknown): string => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? v : invalid();
const optionalTime = (v: unknown) => v === null ? null : time(v);
const boolean = (v: unknown): boolean => typeof v === 'boolean' ? v : invalid();
const label = (v: unknown): string => typeof v === 'string' && v.length > 0 && v.length <= 200 ? v : invalid();
export const SELF_SERVICE_RPCS = ['quiz_capability_v1','quiz_permissions_v1','quiz_permission_v1','quiz_publish_v1','assignment_schedule_v2','pool_recommendation_v1','extra_time_v1','new_attempt_v1','quiz_close_v1','assignment_close_v2','assignment_status_v1','attempt_eligibility_page_v1','student_exams_page_v1','history_page_v2','selfservice_metadata_page_v1','owner_resume_v1','witness_accept_v1'] as const;
/** Read schema metadata first. An absent/hidden/unreadable OpenAPI document fails closed without probing missing RPCs. */
export function hasSelfServiceSchema(raw: unknown): boolean {
 return isObject(raw) && isObject(raw.paths) && [...SELF_SERVICE_RPCS,'start_v2','command_v2','read_mixed_session_v2','read_practical_session_v2'].every(name => Object.hasOwn(raw.paths as object, '/rpc/' + name));
}
export async function bindSelfService(client: SupabaseClient, signal: AbortSignal): Promise<SelfServicePort | null> {
 if (!PILOT) return null;
 const { data } = await client.auth.getSession();
 if (!data.session) return null;
 const response = await fetch(PILOT.url + '/rest/v1/', { signal, cache: 'no-store', headers: { apikey: PILOT.key, Authorization: 'Bearer ' + data.session.access_token, 'Accept-Profile': 'assess', Accept: 'application/openapi+json' } });
 if (!response.ok || !hasSelfServiceSchema(await response.json())) return null;
 return createSelfServicePort(async (name,args) => {
  const { data,error } = await client.schema('assess').rpc(name,args).retry(false).abortSignal(signal);
  if (error) throw error; return data;
 });
}
function page<T>(raw: unknown, parse: (v: Record<string,unknown>) => T, key = 'id'): Page<T> {
 const value = record(raw);
 if (value.version !== 1 || !Array.isArray(value.rows) || value.rows.length > 50) return invalid();
 let last = '';
 const rows = value.rows.map(v => {const r=record(v), id=uuid(r[key]); if(id<=last)return invalid(); last=id; return parse(r);});
 if (value.next !== null && (uuid(value.next) !== last || rows.length !== 50)) return invalid();
 return { rows,next:value.next as string|null,serverTime:time(value.serverTime) };
}
const reasons = ['eligible','assignment-unavailable','unknown-history','not-active-at-stop','not-held','expired','already-granted','grant-limit'];
export function createSelfServicePort(transport: Transport): SelfServicePort {
 async function call(name: string,args: Record<string,unknown> = {}): Promise<unknown> {
  if (!SELF_SERVICE_RPCS.includes(name as typeof SELF_SERVICE_RPCS[number])) return invalid();
  try { return await transport(name,args); }
  catch (e) {
   const code=isObject(e)&&typeof e.code==='string'?e.code:'';
   throw new SelfServiceError(({ '42501':'denied','40001':'conflict','23505':'conflict','22023':'invalid','55000':'window','54000':'limit','PGRST202':'unavailable','42883':'unavailable' } as const)[code as '42501'] ?? 'unknown');
  }
 }
 const afterArgs=(after:string|null=null)=>({p_after:after===null?null:uuid(after),p_limit:50});
 const voidCall=async(name:string,args:Record<string,unknown>)=>{if(await call(name,args)!==null)throw new SelfServiceError('unknown');};
 return {
  capability:async()=>boolean(await call('quiz_capability_v1')),
  async permissions(after=null) {
   const raw=await call('quiz_permissions_v1',afterArgs(after));
   if(!Array.isArray(raw)||raw.length>50)return invalid();
   let previous=after??'';
   const rows=raw.map(v=>{const r=record(v),id=uuid(r.user_id);if(id<=previous)return invalid();previous=id;return {user_id:id,all_students:boolean(r.all_students),all_students_key:uuid(r.all_students_key)} satisfies Permission;});
   return {rows,next:rows.length===50?previous:null};
  },
  permission:(id,enabled)=>voidCall('quiz_permission_v1',{p_supervisor:uuid(id),p_enabled:boolean(enabled)}),
  async metadata(kind,after=null) {
   if(!['versions','assignments'].includes(kind))return invalid();
   return page(await call('selfservice_metadata_page_v1',{p_kind:kind,...afterArgs(after)}),r=>{
    if(!['mixed','full-practical'].includes(String(r.track)))return invalid();
    const base:Metadata={id:uuid(r.id),name:label(r.name),track:r.track as Metadata['track'],durationSeconds:integer(r.durationSeconds,1,604800)};
    if(kind==='assignments') {
     if(!['groups','all-students'].includes(String(r.audience)))return invalid();
     return {...base,versionId:uuid(r.versionId),revision:integer(r.revision,1),audience:r.audience==='groups'?'group':'all-students',opensAt:optionalTime(r.opensAt),closesAt:optionalTime(r.closesAt),closedAt:optionalTime(r.closedAt)};
    }return base;
   });
  },
  async recommendation(id) {
   const r=record(await call('pool_recommendation_v1',{p_version:uuid(id)}));
   if(r.version!==1||r.defaultWindowSeconds!==7200||r.maxWindowSeconds!==604800)return invalid();
   const selected=integer(r.selected,0,200),available=integer(r.available,0,200);if(selected>available)return invalid();
   return {version:1,selected,available,recommended:boolean(r.recommended),defaultWindowSeconds:7200,maxWindowSeconds:604800} satisfies Recommendation;
  },
  publish:async(id,operation,opens,closes)=>uuid(await call('quiz_publish_v1',{p_version:uuid(id),p_operation:uuid(operation),p_opens:time(opens),p_closes:time(closes)})),
  schedule:async(id,revision,opens,closes)=>integer(await call('assignment_schedule_v2',{p_assignment:uuid(id),p_revision:integer(revision,1),p_opens:time(opens),p_closes:time(closes)}),1),
  close:(id,revision,quiz)=>voidCall(quiz?'quiz_close_v1':'assignment_close_v2',{p_assignment:uuid(id),p_revision:integer(revision,1)}),
  async status(id,after=null) {
   const r=record(await call('assignment_status_v1',{p_assignment:uuid(id),...afterArgs(after)})),c=record(r.counts);
   if(!Array.isArray(r.rows)||r.rows.length>50)return invalid();
   return {counts:Object.fromEntries(['notStarted','inProgress','submitted','graded','missed'].map(k=>[k,integer(c[k])])) as Status['counts'],
    rows:r.rows.map(v=>{const row=record(v);if(!['not-started','in-progress','submitted','graded','missed'].includes(String(row.state)))return invalid();return {userId:uuid(row.userId),state:String(row.state)};}),
    now:time(r.now),opensAt:optionalTime(r.opensAt),closesAt:optionalTime(r.closesAt),closed:boolean(r.closed)};
  },
  eligibility:async(id,after=null)=>page(await call('attempt_eligibility_page_v1',{p_assignment:uuid(id),...afterArgs(after)}),r=>{
   if(!reasons.includes(String(r.reason))||r.eligible!==(r.reason==='eligible'))return invalid();
   return {studentId:uuid(r.studentId),sessionId:uuid(r.sessionId),eligible:boolean(r.eligible),reason:String(r.reason),serverTime:time(r.serverTime)} satisfies Eligibility;
  },'sessionId'),
  extra:(id,student,seconds)=>voidCall('extra_time_v1',{p_assignment:uuid(id),p_student:uuid(student),p_seconds:integer(seconds,0,86400)}),
  grant:(id,session)=>voidCall('new_attempt_v1',{p_assignment:uuid(id),p_session:uuid(session)}),
  async students(after=null) {
   const raw=await call('student_exams_page_v1',afterArgs(after));
   const now=time(record(raw).serverTime);
   return page(raw,r=>{
    if(!['mixed','full-practical'].includes(String(r.track))||!['groups','all-students'].includes(String(r.audience)))return invalid();
    const window=r.opensAt===null||r.closesAt===null?null:{opensAt:time(r.opensAt),closesAt:time(r.closesAt),closed:boolean(r.closed),now};
    const replacement=boolean(r.replacementGranted);
    const session=r.sessionId===null||replacement?null:(()=>{if(!['active','grading','graded','grading-failed','awaiting-manual','void'].includes(String(r.state)))return invalid();return {state:r.state as 'active',deadline:optionalTime(r.deadline),resultReady:boolean(r.resultReady),held:boolean(r.held),expiresAt:optionalTime(r.expiresAt),grading:boolean(r.grading)};})();
    return {id:uuid(r.id),name:label(r.name),track:r.track as Metadata['track'],audience:r.audience==='groups'?'group' as const:'all-students' as const,sessionId:r.sessionId===null||replacement?null:uuid(r.sessionId),window,session};
   });
  },
  history:async(after=null)=>parseHistoryPage(await call('history_page_v2',afterArgs(after))),
  async resume(confirm) {
   if(confirm!=='RESUME ASSESS')return invalid();
   const r=record(await call('owner_resume_v1',{p_confirm:confirm}));
   return {released:integer(r.released),stillHeld:integer(r.stillHeld),heldActive:integer(r.heldActive),gateOpen:boolean(r.gateOpen),loginEnabled:boolean(r.loginEnabled)};
  },
  async accept(confirm) {
   if(confirm!=='ACCEPT RESTORED DATABASE')return invalid();
   const r=record(await call('witness_accept_v1',{p_confirm:confirm}));return {epoch:uuid(r.epoch),acceptedAt:time(r.acceptedAt)};
  },
 };
}
