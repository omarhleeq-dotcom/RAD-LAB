/** Approved S4 successor; original v1 host remains unchanged. Import starts nothing. */
import { databaseSizeMonitor } from './database-size';
import { parseJobConfig } from './server-job';
import { createScheduledWorkerBindingV2, type WorkerBinding } from './server-runtime-v2';
import { runAssessJobsV2 } from './server-service-v2';
import type { AssessRpc, JobControls } from './server-service';
import { judgeWitness, parseDbWitness, type WitnessStore } from './witness';
export { gcsWitnessStore } from './witness';
export { createScheduledWorkerBindingV2 } from './server-runtime-v2';
import { workerVersions as legacyVersions } from './server-worker';
export function workerVersions() { return { ...legacyVersions(), worker: WORKER_VERSION }; }
export const WORKER_VERSION = 'rad105-scheduled-worker/2';
type Worker = AssessRpc & { close(): Promise<void> };
type Options = { batch: number; budgetMs: number; witness: { mode: 'shadow' | 'enforcing'; projectRef: string; store: WitnessStore } };
type Health = { v1: Record<string, number>; v2: Record<string, number>; witness: unknown };
const exact = (value: unknown, keys: string[]) => !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join() === keys.sort().join();
function health(raw: Health) {
 if (!exact(raw, ['v1','v2','witness']) || !exact(raw.v1,['failed','alert','overdue','purgeDue']) ||
  !exact(raw.v2,['failed','alert','held','awaitingManual','warningDue','voidDue','overdue','purgeDue']) ||
  !exact(raw.witness,['epoch','seq','now','acceptedAt','credentialValidUntil']) ||
  [...Object.values(raw.v1),...Object.values(raw.v2)].some(n=>!Number.isSafeInteger(n)||n<0)) throw Error('health');
 return raw;
}
export async function executeGradingWorker(load: () => Promise<unknown>, signal: AbortSignal, verify: () => Promise<void>,
 make: (c: WorkerBinding, observeDatabaseSize?: (bytes: unknown) => void) => Worker = createScheduledWorkerBindingV2, observe?: JobControls['observe'], options?: Options) {
 let worker: Worker | undefined, code='configuration', uncertain=false;
 let counts: { graded: number; failed: number } | undefined, finalHealth: Pick<Health,'v1'|'v2'> | undefined;
 let witness: { mode: string; result: string } | undefined;
 const began=performance.now();
 // Only this nonsecret quota setting is read; credentials/destination remain the exact SM payload.
 const size=databaseSizeMonitor(process.env.ASSESS_PLAN_LIMIT_BYTES);
 try {
  if (!options || !Number.isInteger(options.batch) || options.batch<1 || options.batch>20 ||
   !Number.isInteger(options.budgetMs) || options.budgetMs<1 || options.budgetMs>240000 || !['shadow','enforcing'].includes(options.witness.mode)) throw Error();
  const config=parseJobConfig(await load());
  code='quarantined'; await verify();
  if (signal.aborted) throw Error();
  worker=make(config,size.enabled?size.observe:undefined); code='unavailable';
  const w=options.witness;
  // Commit the DB tick, then generation-checked external witness, before maintenance or claim.
  const initial=health(await worker.call<Health>('worker_health_v2',{}));
  const db=parseDbWitness(initial.witness), read=await w.store.read();
  const verdict=judgeWitness(w.projectRef,db,read==='unreadable'?'unreadable':read.value,w.mode);
  const result=!verdict.ok?verdict.code:read==='unreadable'||!await w.store.write(verdict.next,read.generation)?'witness-write-failed':verdict.action;
  witness={mode:w.mode,result};
  if (w.mode==='enforcing'&&!['init','advance','adopt'].includes(result)) {code='restore_suspected';throw Error();}
  await verify(); if(signal.aborted)throw Error();
  await worker.call('maintain_v2',{p_limit:100});
  counts=await runAssessJobsV2(worker,options.batch,signal,{stopBeforeFinalize:true,verify,deadlineMs:began+options.budgetMs,
   observe:event=>{if(event.phase==='uncertain')uncertain=true;observe?.(event);}});
  if(uncertain||counts.failed)code='grading_uncertain';
  else {
   await verify(); if(signal.aborted)throw Error();
   const h=health(await worker.call<Health>('worker_health_v2',{}));finalHealth={v1:h.v1,v2:h.v2};code='complete';
  }
 } catch { if(uncertain)code='grading_uncertain'; }
 finally {if(worker)try{await worker.close();}catch{code='cleanup_failed';}}
 if(signal.aborted&&code!=='cleanup_failed')code='stopped';
 return {contract:WORKER_VERSION,outcome:code==='complete'?'COMPLETE':'STOP',code,...(counts?{counts}:{}),...(finalHealth?{health:finalHealth}:{}),
  ...(witness?{witness}:{}),databaseSize:size.report(),milliseconds:Math.ceil(performance.now()-began),reconciliationRequired:code!=='complete',runtimeOrLaunchVerified:false};
}
