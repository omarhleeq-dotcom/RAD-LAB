import { expect, it } from 'vitest';
import { selfServiceS3Fixture, id } from './selfservice-fixture';
import { createSelfServicePort } from './selfservice/adapter';
import { createSelfServiceRunners } from './selfservice/runner';
import { mixedFixture } from '../../../scripts/assess/d-fixture';
import { practicalFixture, practicalSnapshot } from '../../../scripts/assess/e-fixture';
import { validatePublicationV2, settingsSpec } from './server-validation';
import { gradePublicationV2 } from './server-grader-v2';
import type { AssessmentPublicationV2, GradingClaimV2 } from './server-contracts-v2';
import { CASES } from '@/data/cases';
type Db=Awaited<ReturnType<typeof selfServiceS3Fixture>>;
const transport=(db:Db,user:number)=>async(name:string,args:Record<string,unknown>)=>{const raw=await db.rpc(user,name,Object.values(args));return raw===''?null:raw;}; // PostgreSQL void is serialized as null by PostgREST
async function install(db:Db,track:'questions'|'mixed'|'full-practical') {
 const input=track==='full-practical'?practicalFixture():mixedFixture();
 if(track==='questions'){
  input.assessment.items=input.assessment.items.filter(i=>i.type==='single-choice');
  input.privateItems=input.privateItems.filter(i=>i.type==='single-choice');
  input.itemMarks=input.itemMarks.filter(m=>input.assessment.items.some(i=>i.ref.id===m.item.id));
 }
 input.assessment.maximum=String(input.itemMarks.reduce((sum,m)=>sum+Number(m.maximum),0));
 const pub=validatePublicationV2({...input,schemaVersion:2,assessment:{...input.assessment,schemaVersion:2,ref:{id:id(80),version:'1'},policy:{...input.assessment.policy,gradeVisibility:track==='questions'?'after-submission':'hidden'},items:input.assessment.items.map(i=>({...i,schemaVersion:2}))},privateItems:input.privateItems.map(i=>{
  const {review,...key}=i;
  return {...key,schemaVersion:2,provenance:i.type==='single-choice'?{kind:'uploader-authored',reviewStatus:'no-medical-review',sources:review.sources,licenceNotes:'Engineering fixture only',authorDisplayName:null}:{kind:'simulator-reviewed',review}};
 })}).publication as AssessmentPublicationV2;
 const controls=Object.fromEntries(pub.privateItems.map(item=>{
  if(item.type==='single-choice'||item.type==='written-answer')return [item.ref.id,{}];
  const specs=settingsSpec(CASES.find(c=>c.id===item.caseRef.id)!);
  return [item.ref.id,item.type==='full-practical'?specs:Object.fromEntries(item.mutablePaths.map(path=>[path,specs[path]]))];
 }));
 await db.admin.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,schema_version,available) values($1,$2,$1,'1','SYNTHETIC',$3,2,true)",[id(80),id(2),input.assessment.track]);
 await db.admin.query('insert into assess.publications values($1,$2,$3,clock_timestamp())',[id(80),pub,controls]);
 if(track==='full-practical')await db.admin.query('insert into assess.practical_presentations values($1,$2)',[id(80),practicalSnapshot().views]);
 await db.admin.query("insert into assess.content_submissions(version_id,state) values($1,'installed')",[id(80)]);
 await db.admin.query('insert into assess.authoring_publication_links select $1,draft_id,revision,digest from assess.authoring_revisions order by revision desc limit 1',[id(80)]);
 return pub;
}
it.each(['questions','mixed','full-practical'] as const)('%s: actual UI ports publish/list/start/read/submit/result/history without changing visibility',async track=>{
 const db=await selfServiceS3Fixture();
 try {
  await install(db,track);const owner=createSelfServicePort(transport(db,1)),student=createSelfServicePort(transport(db,3)),supervisor=createSelfServicePort(transport(db,2));
  expect((await owner.metadata('versions')).rows).toEqual([expect.objectContaining({id:id(80)})]);
  expect(await owner.capability()).toBe(true);expect(await supervisor.capability()).toBe(false);
  await expect(supervisor.publish(id(80),id(81),new Date().toISOString(),new Date(Date.now()+7200000).toISOString())).rejects.toMatchObject({kind:'denied'});
  await owner.permission(id(2),true);expect(await supervisor.capability()).toBe(true);
  const aid=await supervisor.publish(id(80),id(81),new Date().toISOString(),new Date(Date.now()+7200000).toISOString());
  expect((await supervisor.metadata('assignments')).rows.find(r=>r.id===aid)).toMatchObject({versionId:id(80),audience:'all-students'});
  expect((await student.students()).rows.find(r=>r.id===aid)).toMatchObject({session:null,sessionId:null,audience:'all-students'});
  const runners=createSelfServiceRunners(transport(db,3)),port=track==='full-practical'?runners.practical:runners.mixed;
  const sid=await port.start(aid,id(82)),session=await port.read(sid);
  const wire=await db.rpc<{assessment:{items:AssessmentPublicationV2['assessment']['items']}}>(3,track==='full-practical'?'read_practical_session_v2':'read_mixed_session_v2',[sid]);
  expect(session.ack.state).toBe('active');expect(session.assessment!.items.map(i=>i.ref.id)).toEqual(wire.assessment.items.map(i=>i.ref.id));
  for(const item of session.assessment!.items)if(item.type==='single-choice'){const observed=wire.assessment.items.find(i=>i.ref.id===item.ref.id);if(observed?.type!=='single-choice')throw Error('question wire mismatch');expect(item.options.map(o=>o.id)).toEqual(observed.options.map(o=>o.id));}
  await port.command({schemaVersion:1,attemptId:sid,operationId:id(83),expectedRevision:session.ack.revision,action:{type:'submit'}});
  const claim=await db.call<GradingClaimV2>('claim_v2'),grade=gradePublicationV2(claim.publication,claim.answers,claim.locked);
  await db.call('finish_v2',[claim.attemptId,claim.token,grade.numerator,grade.denominator]);
  const original=await db.rpc(3,'result_v2',[sid]);expect((await student.history()).rows).toEqual([original]);
  expect((await student.students()).rows.find(r=>r.id===aid)?.session?.resultReady).toBe(true);
  expect((await student.history()).rows[0]!.grade.visibility).toBe(track==='questions'?'shown':'hidden');
  await owner.permission(id(2),false);expect(await supervisor.capability()).toBe(false);
  await expect(supervisor.publish(id(80),id(84),new Date().toISOString(),new Date(Date.now()+7200000).toISOString())).rejects.toMatchObject({kind:'denied'});
  await db.admin.query('update public.profiles set consented_at=null where user_id=$1',[id(3)]);
  await expect(student.history()).rejects.toMatchObject({kind:'denied'});
  await db.admin.query('update public.profiles set consented_at=clock_timestamp() where user_id=$1',[id(3)]);
  await db.admin.query('delete from assess.consents where user_id=$1',[id(3)]);
  await expect(student.students()).rejects.toMatchObject({kind:'denied'});await expect(student.history()).rejects.toMatchObject({kind:'denied'});
 }finally{await db.close();}
},300000);
it('independent read authorization, target revocation, metadata privacy, capped stable paging, stale revision and window failures',async()=>{
 const db=await selfServiceS3Fixture();
 try {
  const teacher=createSelfServicePort(transport(db,2)),student=createSelfServicePort(transport(db,3));
  expect((await teacher.metadata('assignments')).rows[0]).toMatchObject({id:id(51),versionId:id(50)});
  expect(Object.keys((await teacher.metadata('assignments')).rows[0]!).sort()).toEqual(['audience','closedAt','closesAt','durationSeconds','id','name','opensAt','revision','track','versionId'].sort());
  await expect(createSelfServicePort(transport(db,3)).metadata('assignments')).rejects.toMatchObject({kind:'denied'});
  const current=(await teacher.metadata('assignments')).rows[0]!,revision=current.revision!,opens=current.opensAt!;
  await teacher.schedule(id(51),revision,opens,new Date(Date.now()+7200000).toISOString());
  await expect(teacher.schedule(id(51),revision,opens,new Date(Date.now()+7200000).toISOString())).rejects.toMatchObject({kind:'conflict'});
  await expect(teacher.schedule(id(51),revision+1,opens,new Date(Date.now()+8*86400000).toISOString())).rejects.toMatchObject({kind:'invalid'});
  await db.admin.query('delete from assess.targets where assignment_id=$1 and user_id=$2',[id(51),id(3)]);
  expect((await student.students()).rows).toEqual([]);
  for(const name of ['student_exams_page_v1','history_page_v2'])for(const limit of [0,101,null])await expect(db.rpc(3,name,[null,limit])).rejects.toMatchObject({code:'22023'});
  for(const kind of ['versions','assignments','invalid'])for(const limit of [0,101,null])await expect(db.rpc(2,'selfservice_metadata_page_v1',[kind,null,limit])).rejects.toMatchObject({code:'22023'});
  await db.admin.query("insert into assess.assignments(id,owner_id,version_id,audience,closed_at) select ('00000000-0000-0000-0000-'||lpad((1000+n)::text,12,'0'))::uuid,$1,$2,'all-students',clock_timestamp() from generate_series(1,101)n",[id(2),id(50)]);
  await db.admin.query('insert into assess.targets select id,$1 from assess.assignments where id>$2',[id(3),id(1000)]);
  const a=await student.students(),b=await student.students(a.next),c=await student.students(b.next);
  expect([a.rows.length,b.rows.length,c.rows.length]).toEqual([50,50,1]);expect(new Set([...a.rows,...b.rows,...c.rows].map(r=>r.id)).size).toBe(101);
  const ma=await teacher.metadata('assignments'),mb=await teacher.metadata('assignments',ma.next),mc=await teacher.metadata('assignments',mb.next);
  expect(new Set([...ma.rows,...mb.rows,...mc.rows].map(r=>r.id)).size).toBe(102);
  await db.admin.query('update assess.groups set ended_at=clock_timestamp() where id=$1',[db.group]);
  expect((await teacher.metadata('assignments')).rows.some(r=>r.id===id(51))).toBe(false);
  await db.admin.query('update public.profiles set consented_at=null where user_id=$1',[id(2)]);
  await expect(teacher.metadata('assignments')).rejects.toMatchObject({kind:'denied'});
  await expect(teacher.eligibility(id(51))).rejects.toMatchObject({kind:'denied'});
  await db.admin.query('update public.profiles set consented_at=clock_timestamp() where user_id=$1',[id(2)]);
  await db.rpc(1,'appointment_v1',[id(2),false]);await expect(teacher.metadata('assignments')).rejects.toMatchObject({kind:'denied'});
 }finally{await db.close();}
},300000);
it('history has stable capped student-only pages and exactly delegates visible/hidden DTOs to result_v2',async()=>{
 const db=await selfServiceS3Fixture();
 try {
  await db.admin.query(`insert into assess.sessions(id,assignment_id,user_id,ordinal,lifecycle_version,state,started_at,submitted_at,deadline,expires_at)
   select ('00000000-0000-0000-0000-'||lpad((2000+n)::text,12,'0'))::uuid,$1,$2,n,2,'graded',clock_timestamp(),clock_timestamp(),clock_timestamp(),clock_timestamp()+interval '1 day' from generate_series(1,101)n`,[id(51),id(3)]);
  await db.admin.query("insert into assess.results select id,0,1,1,'SYNTHETIC','mixed',case when ordinal%2=0 then 'hidden' else 'after-submission' end from assess.sessions where assignment_id=$1",[id(51)]);
  const first=await db.rpc<{rows:unknown[];next:string}>(3,'history_page_v2',[null,100]);
  const last=await db.rpc<{rows:unknown[];next:null}>(3,'history_page_v2',[first.next,100]);
  expect(first.rows).toHaveLength(100);expect(last.rows).toHaveLength(1);expect(first.next).toBe(id(2100));expect(last.next).toBeNull();
  expect(first.rows[0]).toEqual(await db.rpc(3,'result_v2',[id(2001)]));expect(first.rows[1]).toEqual(await db.rpc(3,'result_v2',[id(2002)]));
  expect(await db.rpc(2,'history_page_v2',[null,100])).toEqual({rows:[],next:null});
  await db.admin.query('delete from assess.targets where assignment_id=$1',[id(51)]);
  expect(await db.rpc(3,'history_page_v2',[null,100])).toEqual({rows:[],next:null});
 }finally{await db.close();}
},300000);
