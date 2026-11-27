/** DEFERRED by owner amendment: synthetic regression only, never active Assess/P7. */
import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import type {QueryResult} from 'pg';
import {productionPromotion} from '../../src/features/assess/selfservice-promotion.test';
import {modes} from '../../src/features/assess/rad062-m09-fixture';
import {selfServiceS3Fixture,id,type Session} from '../../src/features/assess/selfservice-fixture';
const flatten=(r:unknown)=>(r as QueryResult[]).flatMap(x=>x.rows);
describe.each(modes)('DEFERRED cloud backup production promotion %s',mode=>{
 it('retains approved full backup ACL/policy oracles and mutation refusals',()=>productionPromotion(mode,async({db,snapshot,afterS4})=>{
   // Successor calibration runs only AFTER every protected earlier oracle/mutation.
   // The approved W1 TEMP redistribution precedes backup creation, as in production.
   await db.admin.query(readFileSync('supabase/manual/assess-grading-worker-provision.sql','utf8'));
   await db.admin.query(readFileSync('supabase/manual/assess-grading-worker-public-temp.sql','utf8'));
   const {readInventory,grantPacket}=await import('../ops/'+'cloud-backup-contract.mjs') as {readInventory:(db:unknown)=>Promise<unknown>;grantPacket:(v:unknown)=>string};
   const backupPacket=grantPacket(await readInventory(db.admin));
   const applyBackup="set radlab.backup_apply='reviewed-select-only';"+backupPacket;
   if(mode==='embedded'){
    const bootstrap=await db.connect('backup-fixture-bootstrap','rad085_fixture_bootstrap');
    try{await bootstrap.query(applyBackup);}finally{await bootstrap.end();}
   }else{
    const name=execFileSync('docker',['ps','--filter',`name=rad062-m09-${process.pid}-`,'--format','{{.Names}}'],{encoding:'utf8'}).trim();
    expect(name).toMatch(new RegExp(`^rad062-m09-${process.pid}-[0-9]+$`));
    execFileSync('docker',['exec','-i',name,'psql','-X','-v','ON_ERROR_STOP=1','-U','supabase_admin','-d','rad_restore','-f','-'],{input:applyBackup,stdio:'pipe',timeout:120000});
   }
   await db.admin.query('set search_path=public');
   const backed=await snapshot();
   expect(afterS4.filter(b=>b.kind==='function'&&JSON.stringify(b.doc)!==JSON.stringify(backed.find(a=>a.kind===b.kind&&a.name===b.name)?.doc))).toEqual([]);
   // Only the approved relation ACL/policy fields may change; bodies/columns/FKs stay exact.
   for(const old of afterS4.filter(b=>b.kind==='relation')){
    const current=backed.find(a=>a.kind===old.kind&&a.name===old.name)!;
    const strip=(doc:Record<string,unknown>)=>Object.fromEntries(Object.entries(doc).filter(([k])=>!['acl','policies'].includes(k)));
    expect(strip(current.doc)).toEqual(strip(old.doc));
   }
   const backupReady=readFileSync('supabase/checks/selfservice-s4-backup-rad085-review-ready.sql','utf8');
   const backupRows=flatten(await db.admin.query(backupReady));
   console.info('S4 backup independent production fingerprints',mode,JSON.stringify(backupRows.filter(r=>r.actual)));
   expect(backupRows.filter(r=>r.ok!==true)).toEqual([]);
   for(const change of ['grant update on assess.sessions to assess_backup','alter policy assess_backup_read_v1 on assess.sessions using(false)','drop policy assess_backup_read_v1 on assess.sessions'])
    expect(flatten(await db.admin.query(backupReady.replace('begin read only;','begin;'+change+';'))).filter(r=>r.ok!==true).map(r=>r.check_name)).toEqual(['relations']);

 }),300000);
});
it('DEFERRED SELECT alone cannot back up RLS rows',async()=>{
 const db=await selfServiceS3Fixture();try{
  const s=await db.rpc<Session>(3,'start_v2',[id(51),id(700)]);
  await db.rpc(3,'command_v2',[s.attemptId,id(701),s.ack.revision,{type:'submit'}]);
  // Synthetic role only. No change to original RLS policies or provider grants.
  await db.admin.query('create role assess_backup nologin noinherit nosuperuser nobypassrls;grant usage on schema assess to assess_backup;grant select on assess.sessions to assess_backup');
  await db.admin.query('begin;set local role assess_backup');
  expect((await db.admin.query('select count(*)::int n from assess.sessions')).rows[0].n).toBe(0);
  await db.admin.query('set local row_security=off');
  await expect(db.admin.query('select * from assess.sessions')).rejects.toMatchObject({code:'42501'});
  await db.admin.query('rollback');
 }finally{await db.close();}
},300000);
