// RAD085-P1-B-20261028: new behaviour; preserve old visibility and SQL bytes.
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { openRad085Database, fixtureId as id } from '../assess/rad085-local-db';
const migration = () => readFileSync('supabase/migrations/20261028000100_p1_short_codes_names.sql', 'utf8');
async function fixture(upgrade = true) {
 const db = await openRad085Database();
 try {
  for (let n=1;n<=26;n++) await db.admin.query('insert into auth.users values($1,$2,now(),$3)', [id(n),`synthetic${n}@example.test`, {display_name:n===26?null:`Synthetic Three Name ${n}`,consent_version:'2026-10-24'}]);
  await db.admin.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end",[id(1)]);
  await db.admin.query(readFileSync('supabase/manual/rad085-sharing-policy-live-p1.sql','utf8'));
  const p=(await db.admin.query('select required_version,text_digest from assess.sharing_policy')).rows[0];
  for(let n=3;n<=26;n++)await db.rpc(n,'sharing_consent_v1',[p.required_version,p.text_digest,true]);
  await db.rpc(1,'appointment_v1',[id(2),true]);
  if(upgrade)await db.admin.query(migration());
  const create=()=>db.rpc<{id:string;code:string;revision:number}>(2,'supervisor_group_v1',['create',null,null,'Named Synthetic Group',new Date(Date.now()+3600000)]);
  const page=(who:number,kind:string,g:string|null=null,after:string|null=null,limit=20)=>db.rpc<{rows:Record<string,unknown>[];next:string|null;total:number}>(who,'scope_page_v1',[kind,g,after,limit]);
  return {...db,create,page};
 }catch(e){await db.close();throw e;}
}
it('8 Crockford symbols normalize case/spaces/hyphens, store only digest, retain throttle, rotation and expiry',async()=>{
 const db=await fixture();try{
  const g=await db.create();expect(g.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
  const stored=(await db.admin.query('select * from assess.group_join_codes')).rows[0];expect(stored.digest).toMatch(/^[a-f0-9]{64}$/);expect(JSON.stringify(stored)).not.toContain(g.code);
  const formatted=' \t'+g.code.slice(0,4).toLowerCase()+'- '+g.code.slice(4).toLowerCase()+'\n';
  expect(await db.rpc(3,'join_request_v1',[formatted])).toMatchObject({outcome:'pending'});
  // Malformed guesses consume the same window; the eleventh cannot enumerate valid codes.
  for(let n=0;n<10;n++)expect(await db.rpc(4,'join_request_v1',[n%2?'IIIIIIII':'0'.repeat(64)])).toEqual({outcome:'unavailable'});
  expect(await db.rpc(4,'join_request_v1',[g.code])).toEqual({outcome:'unavailable'});
  await db.admin.query("update assess.join_request_throttles set window_at=clock_timestamp()-interval '1 hour' where user_id=$1",[id(4)]);
  expect(await db.rpc(4,'join_request_v1',[g.code])).toMatchObject({outcome:'pending'});
  const rotated=await db.rpc<{code:string}>(2,'supervisor_group_v1',['rotate',g.id,g.revision]);expect(rotated.code).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
  expect(await db.rpc(5,'join_request_v1',[g.code])).toEqual({outcome:'unavailable'});
  await db.admin.query('update assess.group_join_codes set expires_at=clock_timestamp()');
  expect(await db.rpc(5,'join_request_v1',[rotated.code])).toEqual({outcome:'unavailable'});
 }finally{await db.close();}
},30000);
it('real digest collisions retry; bounded exhaustion rolls back the group and preserves the old code',async()=>{
 const db=await fixture();try{
  const original=(await db.admin.query("select pg_get_functiondef('assess.supervisor_group_v1(text,uuid,integer,text,timestamptz)'::regprocedure) def")).rows[0].def;
  const g=await db.create();await db.admin.query("update assess.group_join_codes set digest=encode(sha256(convert_to('00000000','UTF8')),'hex')");
  await db.admin.query("create sequence public.synthetic_random_calls; create function public.synthetic_uuid() returns uuid language sql as $$select case when nextval('public.synthetic_random_calls')<=2 then '00000000-0000-4000-8000-000000000000'::uuid else gen_random_uuid() end$$");
  await db.admin.query(original.replace('gen_random_uuid()','public.synthetic_uuid()'));
  const next=await db.create();expect(next.code).not.toBe('00000000');expect(Number((await db.admin.query('select last_value from public.synthetic_random_calls')).rows[0].last_value)).toBe(3);
  await db.admin.query('alter sequence public.synthetic_random_calls restart with 1');
  const rotated=await db.rpc<{code:string}>(2,'supervisor_group_v1',['rotate',g.id,g.revision]);
  expect(rotated.code).not.toBe('00000000');expect(Number((await db.admin.query('select last_value from public.synthetic_random_calls')).rows[0].last_value)).toBe(3);
  await db.admin.query("update assess.group_join_codes set digest=encode(sha256(convert_to('00000000','UTF8')),'hex') where group_id=$1",[g.id]);
  await db.admin.query("create or replace function public.synthetic_uuid() returns uuid language sql as $$select '00000000-0000-4000-8000-000000000000'::uuid$$");
  const before=(await db.admin.query('select * from assess.groups order by id')).rows;
  await expect(db.create()).rejects.toMatchObject({code:'54000'});
  expect((await db.admin.query('select * from assess.groups order by id')).rows).toEqual(before);
  await expect(db.rpc(2,'supervisor_group_v1',['rotate',next.id,next.revision])).rejects.toMatchObject({code:'54000'});
  expect((await db.admin.query('select * from assess.groups order by id')).rows).toEqual(before);
  expect((await db.admin.query('select digest from assess.group_join_codes where group_id=$1',[g.id])).rows[0].digest).toBe((await db.admin.query("select encode(sha256(convert_to('00000000','UTF8')),'hex') d")).rows[0].d);
 }finally{await db.close();}
},30000);
it('projects only display names/group names with identical M4 visibility, keyset pages and totals',async()=>{
 const db=await fixture(false);try{
  const g=await db.create();
  for(let n=3;n<=26;n++){
   const r=await db.rpc<{id:string;revision:number}>(n,'join_request_v1',[g.code]);
   if(n>=5){await db.rpc(2,'join_decide_v1',[r.id,r.revision,'approve']);await db.transaction(n,c=>c.query("insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale) values($1,$2,1,'synthetic','synthetic','v1','{}','{\"total\":37}','en')",[id(100+n),id(n)]));}
  }
  const queries:[number,string,string|null][]=[[2,'requests',g.id],[2,'members',g.id],[2,'practice',g.id],[3,'my-requests',null]];
  const baseline=await Promise.all(queries.map(q=>db.page(...q)));
  await db.admin.query(migration());
  for(let i=0;i<queries.length;i++){
   const p=await db.page(...queries[i]!);expect(p.total).toBe(baseline[i]!.total);expect(p.next).toBe(baseline[i]!.next);
   const withoutNames=(row:Record<string,unknown>)=>Object.fromEntries(Object.entries(row).filter(([key])=>!['display_name','group_name'].includes(key)));
   expect(p.rows.map(withoutNames)).toEqual(baseline[i]!.rows.map(withoutNames));
   expect(JSON.stringify(p)).not.toContain('@example.test');
  }
  expect((await db.page(2,'requests',g.id)).rows.map(r=>r.display_name)).toEqual(expect.arrayContaining(['Synthetic Three Name 3','Synthetic Three Name 4']));
  expect((await db.page(3,'my-requests')).rows[0]!.group_name).toBe('Named Synthetic Group');
  const first=await db.page(2,'practice',g.id);const second=await db.page(2,'practice',g.id,first.next);expect(first.rows).toHaveLength(20);expect(second.rows).toHaveLength(2);expect(second.rows.find(r=>r.user_id===id(26))!.display_name).toBeNull();
  expect((await db.page(2,'members',g.id,id(25))).rows[0]!.display_name).toBeNull();
  await db.rpc(3,'sharing_consent_v1',[null,null,false]);expect((await db.page(2,'requests',g.id)).rows.map(r=>r.user_id)).not.toContain(id(3));
  await db.rpc(5,'sharing_consent_v1',[null,null,false]);expect((await db.page(2,'practice',g.id)).total).toBe(21);
  await expect(db.page(4,'practice',g.id)).rejects.toMatchObject({code:'42501'});
  await db.rpc(1,'appointment_v1',[id(2),false]);await expect(db.page(2,'requests',g.id)).rejects.toMatchObject({code:'42501'});
 }finally{await db.close();}
},30000);
it('signup source already copies display_name; legacy nulls remain null without deriving email',async()=>{
 const db=await fixture();try{
  expect((await db.admin.query('select display_name from public.profiles where user_id=$1',[id(3)])).rows[0].display_name).toBe('Synthetic Three Name 3');
  expect((await db.admin.query('select display_name from public.profiles where user_id=$1',[id(26)])).rows[0].display_name).toBeNull();
  expect(readFileSync('src/features/pilot/useAccount.ts','utf8')).toContain('display_name: displayName.trim()');
  await db.admin.query('update assess.launch_gate set enabled=true');await expect(db.admin.query(migration())).rejects.toMatchObject({code:'55000'});await db.admin.query('rollback');
 }finally{await db.close();}
},30000);
