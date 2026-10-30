// Synthetic Unix-socket PostgreSQL only; current schema first, M01 explicitly second.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {openLocalDatabase} from './local-database.mjs';
const migration='supabase/migrations/20261030000100_rad062_full_name.sql';
// Disposable promoted client: only the literal guard is replaced in memory.
const built=await build({entryPoints:['src/features/pilot/full-name.ts'],bundle:true,write:false,format:'esm',plugins:[{name:'promoted-client',setup(b){b.onLoad({filter:/rad062-availability\.ts$/},()=>({contents:'export const RAD062_AVAILABLE=true;',loader:'ts'}));}}]});
const code=built.outputFiles[0].text;
const {validFullName}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const legacy='11111111-1111-4111-8111-111111111111';
test('RAD-062 current schema, explicit M01 upgrade, signup/edit and legacy isolation',async()=>{
 const db=await openLocalDatabase('postgres');
 try {
  console.log('Local PostgreSQL', (await db.query('show server_version'))[0].server_version);
  assert.equal((await db.query("select to_regprocedure('assess.name_entry_v1()') v"))[0].v,null);
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[legacy,'never-derived@example.invalid',{display_name:'Old Name'}]);
  await db.query("update public.profiles set status='approved' where user_id=$1",[legacy]);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${legacy}',false);`);
  assert.equal((await db.query('select public.is_approved() v'))[0].v,true);
  await db.query("update public.profiles set display_name='Two Words' where user_id=$1",[legacy]);
  await db.port('authenticated',legacy).call('assigned_page_v1',{});
  await db.exec('reset role');
  const before=(await db.query("select oid,proowner,proacl,proconfig from pg_proc where oid='assess.session_authorize_v1(uuid)'::regprocedure"))[0];
  const unnamed=crypto.randomUUID();
  await db.query('insert into auth.users(id,email) values($1,$2)',[unnamed,'no-derived-name@example.invalid']);
  await db.query("update public.profiles set status='approved' where user_id=$1",[unnamed]);
  await db.exec(readFileSync(migration,'utf8'));
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${unnamed}',false);`);
  assert.equal((await db.query('select display_name,public.is_approved() approved from public.profiles'))[0].display_name,null);
  assert.equal((await db.query('select public.is_approved() v'))[0].v,true);
  await db.query('select public.touch_last_seen()');
  assert.equal((await db.query('select assess.name_entry_v1() v'))[0].v,false);
  await db.exec('reset role');
  assert.deepEqual((await db.query("select oid,proowner,proacl,proconfig from pg_proc where oid='assess.session_authorize_v1(uuid)'::regprocedure"))[0],before);
  const valid=[' '.repeat(102)+'One Two Three','One Two Three','أحمد محمد علي','李 王 张','𐐀 𐐁 𐐂','A-1 B2 C3','A\u00a0B\u2028C','\ufeffA B C\ufeff','A B '+ '𐐀'.repeat(96)];
  const invalid=['Two Words','',null,'   ','1 2 3','A B '+ '𐐀'.repeat(97),'A\u0085B C','A\u200bB C'];
  for(const name of [...valid,...invalid]){
   const accepted=validFullName(name??'');
   assert.equal((await db.query('select public.rad062_valid_full_name($1) v',[name]))[0].v,accepted,JSON.stringify(name));
   const id=crypto.randomUUID();
   const signup=()=>db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,'fixture@example.invalid',{display_name:name,consent_version:'2026-10-30'}]);
   if(accepted){await signup();assert.equal((await db.query('select consent_version from public.profiles where user_id=$1',[id]))[0].consent_version,'2026-10-30');}
   else{await assert.rejects(signup(),{code:'22023'});assert.equal((await db.query('select count(*)::int n from auth.users where id=$1',[id]))[0].n,0);}
  }
  // The pinned category is identical in SQL and the promoted client on every engine.
  // Exercise range boundaries and adjacent nonletters without millions of DB round trips.
  const ranges=readFileSync(migration,'utf8').match(/where w collate "C" ~ '\[([^]*?)\]'/)[1];
  const clientRanges=readFileSync('src/features/pilot/full-name.ts','utf8').match(/const RAD062_LETTER = \/\[([^]*?)\]\/u;/)[1];
  assert.equal(clientRanges,ranges);
  const boundaryNames=[...ranges].filter(c=>c!=='-').flatMap(c=>[-1,0,1].map(d=>c.codePointAt(0)+d)).filter(cp=>cp>0&&cp<=0x10ffff&&!(cp>=0xd800&&cp<=0xdfff)).map(cp=>'A B '+String.fromCodePoint(cp));
  const rows=await db.query('select n,public.rad062_valid_full_name(n) v from unnest($1::text[]) n',[boundaryNames]);
  for(const row of rows)assert.equal(row.v,validFullName(row.n),JSON.stringify(row.n));
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${legacy}',false);`);
  assert.equal((await db.query('select public.is_approved() v,public.has_consented() consent'))[0].v,true);
  assert.equal((await db.query('select display_name from public.profiles'))[0].display_name,'Two Words');
  await db.query("update public.profiles set consent_version='2026-10-30',consented_at=now(),display_name=display_name where user_id=$1",[legacy]);
  await db.query('select public.touch_last_seen()');
  await db.query(`insert into public.attempts(attempt_no,exam_id,case_id,definition_version,settings,result,locale)
   values(1,'synthetic-exam','synthetic-case','fixture','{}','{}','en')`);
  assert.equal((await db.query("select count(*)::int n from public.attempts where mode='practice'"))[0].n,1);
  await assert.rejects(db.port('authenticated',legacy).call('assigned_version_v1',{p_assignment:crypto.randomUUID()}),{code:'22023'});
  assert.equal((await db.query('select assess.name_entry_v1() v'))[0].v,false);
  await assert.rejects(db.port('authenticated',legacy).call('assigned_page_v1',{}),{code:'22023'});
  await assert.rejects(db.port('authenticated',legacy).call('assigned_practical_page_v1',{}),{code:'22023'});
  for(const name of [...valid,...invalid]){
   const edit=()=>db.query('update public.profiles set display_name=$1 where user_id=$2',[name,legacy]);
   if(validFullName(name??''))await edit();else await assert.rejects(edit(),{code:'22023'});
  }
  await db.query('update public.profiles set display_name=$1 where user_id=$2',['أحمد محمد علي',legacy]);
  assert.equal((await db.query('select assess.name_entry_v1() v'))[0].v,true);
  await db.port('authenticated',legacy).call('assigned_page_v1',{});
  await db.port('authenticated',legacy).call('assigned_practical_page_v1',{});
  await assert.rejects(db.port('authenticated',legacy).call('assigned_version_v1',{p_assignment:crypto.randomUUID()}),{code:'42501'});
  await db.exec('reset role; set role anon');
  await assert.rejects(db.query('select assess.name_entry_v1()'),{code:'42501'});
  console.log('PASS current-only + explicit M01; signup/edit, Unicode, legacy login predicate/other fields, Assess guards, ACL/OID');
 }finally{await db.close();}
});
