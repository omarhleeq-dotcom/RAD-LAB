import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { operationsPlan, sizeSignal } from './selfservice-ops-plan.mjs';
const c={project:'synthetic-project',region:'europe-west3',bucket:'synthetic-backup',channels:['projects/synthetic-project/notificationChannels/1','projects/synthetic-project/notificationChannels/2'],planLimitBytes:500000000,retentionDays:30};
test('offline plan fails closed on secrets, provider/command injection, unexpected channels and invalid retention',()=>{
 for(const bad of [{...c,password:'CANARY'},{...c,project:'x;touch /tmp/canary'},{...c,region:'--quiet'},{...c,bucket:'allUsers'},
  {...c,channels:[]},{...c,channels:[c.channels[0],c.channels[0]]},{...c,channels:[c.channels[0],'projects/other/notificationChannels/1']},
  {...c,retentionDays:0},{...c,retentionDays:91},{...c,planLimitBytes:NaN}])assert.throws(()=>operationsPlan(bad));
 const r=spawnSync(process.execPath,['scripts/assess/selfservice-ops-plan.mjs','--apply'],{env:{...process.env,APPLY:'1'},encoding:'utf8'});
 assert.equal(r.status,1);assert.equal(r.stdout,'');assert.equal(r.stderr,'STOP s4_ops_plan\n');
});
test('private bounded retention, no key/read/delete privilege; schedules and alerts cannot activate',()=>{
 const p=operationsPlan(c);assert.equal(p.dryRun,true);assert.equal(p.liveReady,false);
 assert.equal(p.bucket.iamConfiguration.publicAccessPrevention,'enforced');assert.equal(p.bucket.iamConfiguration.uniformBucketLevelAccess.enabled,true);
 assert.equal(p.bucket.versioning.enabled,false);assert.equal(p.bucket.softDeletePolicy.retentionDurationSeconds,'0');
 assert.deepEqual(p.bucket.lifecycle.rule,[{action:{type:'Delete'},condition:{age:30,matchesPrefix:['daily/']}}]);
 assert.equal(p.iam.backupRuntime.bucketRole,'roles/storage.objectCreator');assert.equal(p.backupContract.publicRecipientOnly,true);
 assert.equal(p.backupSchedule.state,'PAUSED');assert.equal(p.backupSchedule.retryConfig.retryCount,0);
 for(const a of Object.values(p.alerts)){assert.equal(a.enabled,false);assert.equal(a.alertStrategy.notificationRateLimit.period,'3600s');assert.deepEqual(a.alertStrategy.notificationPrompts,['OPENED']);}
 assert.match(p.alerts.postStop.documentation.content,/stop may be intentional/);assert.deepEqual(p.sourceRestriction.activationCommands,[]);
});
test('exact 70% boundary, large sizes, invalid/unknown never healthy',()=>{
 assert.equal(sizeSignal(349999999,500000000).databaseSizeAlert70,false);assert.equal(sizeSignal(350000000,500000000).databaseSizeAlert70,true);
 assert.equal(sizeSignal(7,10).databaseSizeAlert70,true);assert.equal(sizeSignal(6,10).databaseSizeAlert70,false);
 assert.equal(sizeSignal(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER).databaseSizeAlert70,true);
 for(const [b,l]of[[null,10],[NaN,10],[-1,10],[0,0],[0,Infinity],[1.1,10]])assert.throws(()=>sizeSignal(b,l));
});
