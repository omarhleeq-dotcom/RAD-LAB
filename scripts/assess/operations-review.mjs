// Pure offline evidence review. No credentials, network, RPC, mutation or notification sender.
const healthKeys=['activeAttempts','gradingAttempts','failed','alert','overdue','purgeDue','claimableNow','liveLeases','expiredLeases','retryWaiting'];
const count=v=>Number.isSafeInteger(v)&&v>=0&&v<=100;
const keys=(v,k)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===k.length&&k.every(n=>Object.hasOwn(v,n));
const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const bool=v=>typeof v==='boolean';
const sha=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const digest=v=>typeof v==='string'&&/^sha256:[0-9a-f]{64}$/.test(v);
const jobName=v=>typeof v==='string'&&v.length<=400&&/^projects\/[a-z0-9-]+\/locations\/[a-z0-9-]+\/jobs\/[a-z0-9-]+$/.test(v);
const version=v=>typeof v==='string'&&/^[1-9][0-9]{0,8}$/.test(v);
function valid(e){
 if(!keys(e,['contract','phase','observedAt','job','scheduler','versions','database','execution','tick'])||
  e.contract!=='assess-operations-evidence/1'||!['closed','trial'].includes(e.phase)||!timestamp(e.observedAt))return false;
 const {job:j,scheduler:s,versions:v,database:d,execution:x,tick:t}=e;
 if(!keys(j,['name','taskCount','parallelism','maxRetries','guard','kind','scopeBound','activeExecutions'])||
  !jobName(j.name)||![j.taskCount,j.parallelism,j.maxRetries].every(n=>n===null||count(n))||
  !['0','1',null].includes(j.guard)||!['scoped-trial','general',null].includes(j.kind)||
  !(j.scopeBound===null||bool(j.scopeBound))||!(j.activeExecutions===null||count(j.activeExecutions)))return false;
 if(!keys(s,['state','retryCount','targetJob'])||!['ABSENT','PAUSED','ENABLED','UNKNOWN'].includes(s.state)||
  !(s.retryCount===null||count(s.retryCount))||!(s.targetJob===null||jobName(s.targetJob)))return false;
 if(!keys(v,['reviewedSource','uiSource','workerSource','expectedImage','observedImage','expectedSecretVersion','observedSecretVersion','sqlMatched'])||
  !sha(v.reviewedSource)||!digest(v.expectedImage)||!version(v.expectedSecretVersion)||
  ![v.uiSource,v.workerSource].every(n=>n===null||sha(n))||!(v.observedImage===null||digest(v.observedImage))||
  !(v.observedSecretVersion===null||version(v.observedSecretVersion))||!(v.sqlMatched===null||bool(v.sqlMatched)))return false;
 if(d!==null&&(!keys(d,['contract','observedAt','health','controls'])||d.contract!=='assess-operations-health/1'||!timestamp(d.observedAt)||
  !keys(d.health,healthKeys)||!Object.values(d.health).every(count)||
  !keys(d.controls,['gateClosed','loginDisabled','loginExpired','backendSessions'])||
  ![d.controls.gateClosed,d.controls.loginDisabled,d.controls.loginExpired].every(bool)||!count(d.controls.backendSessions)))return false;
 if(x!==null&&(!keys(x,['name','state','startedAt','completedAt'])||typeof x.name!=='string'||!/^projects\/[a-z0-9-]+\/locations\/[a-z0-9-]+\/jobs\/[a-z0-9-]+\/executions\/[a-z0-9-]+$/.test(x.name)||x.name.length>500||!x.name.startsWith(j.name+'/executions/')||
  !['RUNNING','SUCCEEDED','FAILED','CANCELLED','UNKNOWN'].includes(x.state)||!timestamp(x.startedAt)||
  !(x.completedAt===null||timestamp(x.completedAt))||
  (x.state==='RUNNING'?x.completedAt!==null:x.state!=='UNKNOWN'&&x.completedAt===null)||
  (x.completedAt!==null&&Date.parse(x.completedAt)<Date.parse(x.startedAt))))return false;
 if(t!==null&&(!keys(t,['execution','at','report'])||!x||t.execution!==x.name||!timestamp(t.at)||
  !keys(t.report,t.report?.counts===undefined?['contract','outcome','code','runtimeOrLaunchVerified']:['contract','outcome','code','counts','runtimeOrLaunchVerified'])||
  t.report.contract!=='assess-job/1'||t.report.runtimeOrLaunchVerified!==false||
  !['complete','configuration','stopped','unavailable','grading_uncertain','cleanup_failed'].includes(t.report.code)||
  t.report.outcome!==(t.report.code==='complete'?'COMPLETE':'STOP')||
  (t.report.counts!==undefined&&(!t.report.counts||typeof t.report.counts!=='object'||Array.isArray(t.report.counts)||!keys(t.report.counts,['expired','purged','graded','failed','healthFailed','alert','overdue','purgeDue',
    ...['reservationsPurged','consentsPurged'].filter(n=>Object.hasOwn(t.report.counts,n))])||!Object.values(t.report.counts).every(count)))))return false;
 if(t?.report.outcome==='COMPLETE'&&(!t.report.counts||t.report.counts.failed!==0))return false;
 return true;
}
function findings(e,now,policy,previous){
 const out=[];const add=(code,level='BLOCKED')=>out.push({code,level});
 const fresh=t=>Date.parse(t)<=now&&now-Date.parse(t)<=policy.maxAgeSeconds*1000;
 if(!fresh(e.observedAt))add('evidence_stale_or_future');
 const {versions:v,job:j,scheduler:s,database:d,execution:x,tick:t}=e;
 if(v.uiSource===null||v.workerSource===null||v.observedImage===null||v.observedSecretVersion===null||v.sqlMatched===null)add('version_evidence_missing');
 if((v.uiSource!==null&&v.uiSource!==v.reviewedSource)||(v.workerSource!==null&&v.workerSource!==v.reviewedSource)||
  (v.observedImage!==null&&v.observedImage!==v.expectedImage)||(v.observedSecretVersion!==null&&v.observedSecretVersion!==v.expectedSecretVersion)||v.sqlMatched===false)add('version_mismatch');
 if(j.taskCount!==1||j.parallelism!==1||j.maxRetries!==0||j.kind!=='scoped-trial'||j.scopeBound!==true)add('job_configuration_unverified');
 if(j.activeExecutions===null)add('execution_count_unknown');else if(j.activeExecutions>1)add('execution_overlap');
 if(s.state==='UNKNOWN')add('scheduler_unknown');
 if(s.state==='ENABLED')add('scheduler_enabled_without_continuous_acceptance');
 if(s.state==='PAUSED'&&(s.retryCount!==0||s.targetJob!==j.name))add('scheduler_target_or_retries_unverified');
 if(e.phase==='closed'&&(j.guard!=='0'||j.activeExecutions!==0))add('worker_not_closed');
 if(e.phase==='trial'&&j.guard!=='1')add('trial_guard_not_enabled');
 if(!d)add('database_evidence_missing');
 else if(!fresh(d.observedAt)||Date.parse(d.observedAt)>Date.parse(e.observedAt))add('database_evidence_stale_or_future');
 else{
  if(e.phase==='closed'&&(!d.controls.gateClosed||!d.controls.loginDisabled||!d.controls.loginExpired||d.controls.backendSessions!==0))add('database_not_closed');
  if(e.phase==='closed'&&(d.health.activeAttempts||d.health.gradingAttempts||d.health.liveLeases))add('attempt_settlement_pending');
  if(d.health.failed||d.health.alert)add('grading_requires_reconciliation','ATTENTION');
  if(d.health.expiredLeases)add('expired_lease_requires_reconciliation','ATTENTION');
  if(d.health.purgeDue)add('retention_due','ATTENTION');
  if(d.health.claimableNow)add('queue_waiting','ATTENTION');
  if(d.health.overdue){
   const pd=previous?.database;
   const continuous=pd&&Date.parse(pd.observedAt)<Date.parse(d.observedAt)&&Date.parse(d.observedAt)-Date.parse(pd.observedAt)<=policy.maxAgeSeconds*1000;
   add(continuous&&pd.health.overdue?'overdue_persistent':'overdue_first_sample','ATTENTION');
  }
 }
 if(x&&(Date.parse(x.startedAt)>now||(x.completedAt!==null&&Date.parse(x.completedAt)>now)))add('execution_time_in_future');
 if(x&&['FAILED','CANCELLED','UNKNOWN'].includes(x.state))add('execution_requires_reconciliation','ATTENTION');
 if(e.phase==='trial'){
  if(!x||!t)add('trial_execution_or_report_missing');
  else{
   if(!fresh(t.at)||Date.parse(t.at)<Date.parse(x.startedAt)||Date.parse(t.at)>Date.parse(e.observedAt)||
    (x.completedAt!==null&&Date.parse(t.at)>Date.parse(x.completedAt)))add('tick_time_unverified');
   if(t.report.outcome==='STOP'||t.report.counts?.failed)add('tick_requires_reconciliation','ATTENTION');
   if(x.state!=='SUCCEEDED'&&t.report.outcome==='COMPLETE')add('platform_success_not_confirmed');
  }
 }
 return out;
}
/** Facts are supplied by an operator, not independently authenticated by this module.
 * CLEAR means only that this bounded evidence review has no finding; never live acceptance.
 */
export function inspectOperations(evidence,{now=Date.now(),policy={maxAgeSeconds:300},previous=null}={}){
 const result=(outcome,items,notificationRecommended)=>({contract:'assess-operations-review/1',outcome,findings:items,notificationRecommended,runtimeOrLaunchVerified:false,liveAcceptanceVerified:false});
 if(!Number.isSafeInteger(now)||!keys(policy,['maxAgeSeconds'])||!Number.isInteger(policy.maxAgeSeconds)||policy.maxAgeSeconds<30||policy.maxAgeSeconds>3600||!valid(evidence)||
  (previous!==null&&(!valid(previous)||Date.parse(previous.observedAt)>=Date.parse(evidence.observedAt)||previous.phase!==evidence.phase)))
  return result('BLOCKED',[{code:'invalid_evidence',level:'BLOCKED'}],true);
 const items=findings(evidence,now,policy,previous);
 const old=previous?findings(previous,now,policy,null):[];
 const outcome=items.some(i=>i.level==='BLOCKED')?'BLOCKED':items.length?'ATTENTION':'CLEAR';
 const category=code=>code.startsWith('overdue_')?'overdue':code;
 const changedHealth=previous?.database&&evidence.database&&healthKeys.some(key=>previous.database.health[key]!==evidence.database.health[key]);
 const changedExecution=previous&&previous.execution?.name!==evidence.execution?.name;
 return result(outcome,items,items.length>0&&(Boolean(changedHealth)||Boolean(changedExecution)||items.some(i=>!old.some(o=>category(o.code)===category(i.code)&&o.level===i.level))));
}
