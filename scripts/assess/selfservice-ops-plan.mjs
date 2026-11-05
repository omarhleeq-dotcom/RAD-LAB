// S4 offline preparation. This CLI never executes a provider command, even with APPLY=1.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function sizeSignal(bytes, limit) {
 if (!Number.isSafeInteger(bytes)||bytes<0||!Number.isSafeInteger(limit)||limit<1) throw Error('size');
 return { databaseBytes:bytes,planLimitBytes:limit,databaseSizeAlert70:BigInt(bytes)*10n>=BigInt(limit)*7n };
}
export function operationsPlan(c) {
 const keys=['project','region','bucket','channels','planLimitBytes','retentionDays'];
 if(!c||Object.keys(c).sort().join()!==keys.sort().join()||!/^([a-z][a-z0-9-]{4,28}[a-z0-9])$/.test(c.project)||
  !/^[a-z]+-[a-z]+[0-9]$/.test(c.region)||!/^([a-z0-9][a-z0-9-]{1,61}[a-z0-9])$/.test(c.bucket)||
  !Array.isArray(c.channels)||c.channels.length!==2||new Set(c.channels).size!==2||
  c.channels.some(x=>typeof x!=='string'||!new RegExp(`^projects/${c.project}/notificationChannels/[0-9]+$`).test(x))||
  !Number.isInteger(c.retentionDays)||c.retentionDays<1||c.retentionDays>90)throw Error('config');
 sizeSignal(0,c.planLimitBytes);
 const policy=(name,filter,text)=>({displayName:name,enabled:false,combiner:'OR',
  conditions:[{displayName:name,conditionMatchedLog:{filter}}],notificationChannels:c.channels,
  alertStrategy:{notificationRateLimit:{period:'3600s'},autoClose:'86400s',notificationPrompts:['OPENED']},
  documentation:{mimeType:'text/markdown',content:text}});
 const scope=`resource.labels.project_id="${c.project}" AND resource.labels.location="${c.region}"`;
 const scheduler=`resource.type="cloud_scheduler_job" AND resource.labels.project_id="${c.project}" AND resource.labels.location="${c.region}" AND resource.labels.job_id="assess-worker-tick" AND jsonPayload."@type"="type.googleapis.com/google.cloud.scheduler.logging.AttemptFinished" AND jsonPayload.status!="OK"`;
 const backupScheduler=scheduler.replace('assess-worker-tick','assess-backup-tick');
 const worker=`resource.type="cloud_run_job" AND ${scope} AND resource.labels.job_name="assess-worker" AND (jsonPayload.outcome="STOP" OR severity>=ERROR)`;
 const backup=`resource.type="cloud_run_job" AND ${scope} AND resource.labels.job_name="assess-backup"`;
 return {contract:'rad105-s4-operations-plan/1',dryRun:true,liveReady:false,
  blockers:['reviewed v2 image/binding evidence','backup exact grants and complete encrypted restore proof','existing channel receipts and rate-limit verification','owner P7 permission'],
  bucket:{name:c.bucket,location:c.region,storageClass:'STANDARD',
   iamConfiguration:{uniformBucketLevelAccess:{enabled:true},publicAccessPrevention:'enforced'},
   versioning:{enabled:false},softDeletePolicy:{retentionDurationSeconds:'0'},
   lifecycle:{rule:[{action:{type:'Delete'},condition:{age:c.retentionDays,matchesPrefix:['daily/']}}]}},
  iam:{backupRuntime:{bucketRole:'roles/storage.objectCreator',bucket:c.bucket,secretRole:'roles/secretmanager.secretAccessor',secret:'assess-backup',
   forbidden:['object get/list/delete','project-level grants','grading secret','encryption private key']},
   scheduler:{targetJob:'assess-backup',role:'roles/run.invoker',resourceLevel:true}},
  backupSchedule:{id:'assess-backup-tick',state:'PAUSED',schedule:'17 2 * * *',timeZone:'Etc/UTC',retryConfig:{retryCount:0,maxRetryDuration:'0s'},
   httpTarget:{uri:`https://run.googleapis.com/v2/projects/${c.project}/locations/${c.region}/jobs/assess-backup:run`,httpMethod:'POST',
    oauthToken:{serviceAccountEmail:`assess-scheduler@${c.project}.iam.gserviceaccount.com`}}},
  backupJob:{defaultDryRun:true,imageDigestRequired:true,taskCount:1,parallelism:1,maxRetries:0,timeoutSeconds:900,memory:'1Gi',scratch:{path:'/work',medium:'MEMORY',uid:999,mode:'0700'}},
  backupContract:{databaseRole:'assess_backup',credentialSource:'Secret Manager numeric version mounted at runtime',publicRecipientOnly:true,
   dump:'pg_dump custom archive, shared snapshot; enable-row-security only after exact full-row SELECT-policy and restrictive-policy checks',
   integrity:'encrypt archive + metadata/counts/digests; publish only after all subprocesses succeed',
   restoration:'isolated pinned PostgreSQL; compare every table, sequence, schema object, RLS/ACL and large object, not only TOC/count totals',
   retentionDays:c.retentionDays,measurementSql:'select pg_database_size(current_database())::text',planLimitBytes:c.planLimitBytes,
   laptopWindowBackupRequired:true},
  alerts:{postStop:policy('Assess scheduled failure',`(${scheduler}) OR (${worker})`,
    'Assess scheduling or grading failed. The stop may be intentional. Check emergency stop, NOLOGIN, disabled secret and execution state; follow RAD-059. Never auto-resume or replay. One notification per hour per existing channel.'),
   backupFailure:policy('Assess backup failure',`(${backup} AND (jsonPayload.outcome="STOP" OR jsonPayload.dryRun=true OR severity>=ERROR)) OR (${backupScheduler})`,
    'Daily encrypted backup failed; keep the reviewed laptop backup. No automatic role/secret/gate changes.'),
   databaseSize:policy('Assess database 70 percent',`${backup} AND jsonPayload.databaseSizeAlert70=true`,
    'Database size reached 70% of the owner-verified plan limit. Compare pg_database_size with Supabase Usage; no automatic deletion or upgrade.')},
  sourceRestriction:{status:'COST_STOP',activationCommands:[],reason:'Review existing dual-stack subnet CIDR scope and Supabase entitlement first; paid static IPv4/NAT or plan changes require owner cost approval. No activation.'}};
}
export function main(args=process.argv.slice(2)) {
 if(args.length!==2||args[0]!=='--config')throw Error('arguments');
 return operationsPlan(JSON.parse(readFileSync(args[1],'utf8')));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 try{process.stdout.write(JSON.stringify(main(),null,2)+'\n');}catch{process.stderr.write('STOP s4_ops_plan\n');process.exitCode=1;}
}
