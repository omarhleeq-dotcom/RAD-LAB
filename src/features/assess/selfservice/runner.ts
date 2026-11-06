/** Reuse existing auto-graded runner presentations; v2 selection/order remain server-owned. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseSession, RunnerError, type RunnerPort } from '../runner-data';
import { parsePracticalSession } from '../practical-data';
import { isObject, isUuid } from '../data-guards';
import type { Transport } from './contracts';
export function presentationV1(raw: unknown): unknown {
 if(!isObject(raw)||!isObject(raw.ack))throw new RunnerError('invalid');
 if(raw.ack.state!=='active')return raw;
 const a=raw.assessment;
 if(!isObject(a)||a.schemaVersion!==2||!Array.isArray(a.items)||a.items.some(i=>!isObject(i)||i.schemaVersion!==2||!['single-choice','simulator-part','full-practical'].includes(String(i.type))))throw new RunnerError('unavailable');
 // Only the view's shape tag changes. No item/option reorder, grading or answer conversion.
 return {...raw,assessment:{...a,schemaVersion:1,items:a.items.map(i=>({...i,schemaVersion:1}))}};
}
export function createSelfServiceRunners(call:Transport) {
 const start:RunnerPort['start']=async(assignment,operation)=>{
  if(!isUuid(assignment)||!isUuid(operation))throw new RunnerError('invalid');
  const raw=await call('start_v2',{p_assignment:assignment,p_operation:operation});
  if(!isObject(raw)||!isUuid(raw.attemptId))throw new RunnerError('invalid');return raw.attemptId;
 };
 const command:RunnerPort['command']=async c=>{await call('command_v2',{p_session:c.attemptId,p_operation:c.operationId,p_revision:c.expectedRevision,p_action:c.action});};
 const mixed:RunnerPort={start,command,read:async id=>parseSession(presentationV1(await call('read_mixed_session_v2',{p_session:id})))};
 const practical={start,command,read:async(id:string)=>parsePracticalSession(presentationV1(await call('read_practical_session_v2',{p_session:id})))};
 return {mixed,practical};
}
export function bindSelfServiceRunners(client:SupabaseClient,signal:AbortSignal) {
 return createSelfServiceRunners(async(name,args)=>{
  const {data,error}=await client.schema('assess').rpc(name,args).retry(false).abortSignal(signal);
  if(error)throw new RunnerError(({'42501':'denied','40001':'conflict','54000':'limit','22023':'invalid'} as const)[error.code as '42501']??'unavailable');return data;
 });
}
