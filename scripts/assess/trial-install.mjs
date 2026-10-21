// Offline generator only. Each reference DB is disposable; no remote connection selector.
import { readFileSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { openLocalDatabase } from './local-database.mjs';
export const catalogSql=readFileSync(new URL('./trial-catalog.sql',import.meta.url),'utf8').trim().replace(/;$/,'');
const source=readFileSync(new URL('./sql/trial-isolation.sql',import.meta.url),'utf8');
const tables=['account_stops','assignments','consents','content_submissions','groups','launch_gate','memberships','publications','receipts','reservations','results','session_details','sessions','targets','versions'];
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const sha=s=>createHash('sha256').update(s).digest('hex');
// Finite reviewed projection: PG17 records NOT NULL in attnotnull, PG18 also
// exposes contype=n. Columns (including attnotnull) remain compared exactly.
export const reviewedCatalogSql=catalogSql.replace('where k.conrelid=c.oid)',"where k.conrelid=c.oid and k.contype<>'n')");
const historicalPublic=['can_read_training','handle_new_user','owner_page_v1','set_participant_status','training_page_v1_with_comparison','training_page_v1','owner_list_participants'];
// Source-derived formatting alternative, never a normalization of provider input.
export function reviewedOwnerListBody(body){
 const first='p.status, u.email',second='p.last_seen_at, (select';
 if(!body.includes(first)||!body.includes(second)||body.includes('\r'))throw new Error('owner-list source changed; review required');
 return body.replace(first,'p.status,\n           u.email').replace(second,'p.last_seen_at,\n           (select').replaceAll('\n','\r\n');
}
async function reference(lineEndings,{reviewed=false,historical=false,trialLineEndings='lf'}={}) {
 const db=await openLocalDatabase('pglite',{lineEndings});
 try {
  await db.exec("set search_path=''");
  if(historical){
   const routines=await db.query("select proname,prosrc,pg_get_functiondef(oid) def from pg_proc where pronamespace='public'::regnamespace and proname=any($1::text[])",[historicalPublic]);
   if(routines.length!==historicalPublic.length)throw new Error('historical public source set changed');
   for(const r of routines){
    const body=r.proname==='owner_list_participants'?reviewedOwnerListBody(r.prosrc):r.prosrc.replaceAll('\n','\r\n');
    await db.exec(r.def.replace(r.prosrc,()=>body));
   }
  }
  const projection=reviewed?reviewedCatalogSql:catalogSql;
  const before=(await db.query(projection))[0].catalog;
  await db.exec(trialLineEndings==='crlf'?source.replaceAll('\n','\r\n'):source);
  const after=(await db.query(projection))[0].catalog;
  return {before,after};
 } finally {await db.close();}
}
// Compare the entire Assess catalog. Public extension functions may be additional;
// every application public function from the reference must still match exactly.
function assertion(expected,phase,projection=catalogSql) {
 return `do $verify$ declare observed jsonb; expected jsonb; begin
 expected := ${quote(JSON.stringify(expected))}::jsonb;
 select catalog into observed from (${projection}) q;
 observed := jsonb_set(observed,'{functions}',(select coalesce(jsonb_agg(f order by f->>'id'),'[]'::jsonb) from jsonb_array_elements(observed->'functions') f where f->>'id' like 'assess.%' or exists(select 1 from jsonb_array_elements(expected->0->'functions') e where e->>'id'=f->>'id')));
 -- Each routine must equal an exact checked-in LF/CRLF reference, independently.
 -- This permits historically mixed migration line endings without normalizing bytes.
 if (observed-'functions') is distinct from ((expected->0)-'functions')
  or (select count(*) from jsonb_array_elements(observed->'functions'))<>(select count(*) from jsonb_array_elements(expected->0->'functions'))
  or exists(select 1 from jsonb_array_elements(observed->'functions') f where not exists(
    select 1 from jsonb_array_elements(expected) variant cross join lateral jsonb_array_elements(variant->'functions') e where e=f)) then
   raise exception 'trial ${phase} catalog mismatch' using errcode='55000'; end if;
 end $verify$;`;
}
const closed=`do $closed$ begin
 if current_user<>'postgres' or session_user<>'postgres'
  or current_setting('transaction_isolation')<>'read committed'
  or current_setting('default_transaction_isolation')<>'read committed'
  or current_setting('session_replication_role')<>'origin' then
   raise exception 'trial administrator or isolation unavailable' using errcode='55000'; end if;
 if (select count(*) from assess.launch_gate)<>1 or exists(select 1 from assess.launch_gate where enabled) then
   raise exception 'trial gate must be closed' using errcode='55000'; end if;
 if not exists(select 1 from pg_catalog.pg_roles r where r.rolname='assess_worker' and not r.rolcanlogin and not r.rolinherit and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole and not r.rolreplication and not exists(select 1 from pg_catalog.pg_auth_members m where m.member=r.oid)) then raise exception 'trial worker capability mismatch' using errcode='55000'; end if;
 if not exists(select 1 from pg_catalog.pg_roles r where r.rolname='assess_job_a' and not r.rolcanlogin and not r.rolinherit
   and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb and not r.rolcreaterole and not r.rolreplication
   and r.rolvaliduntil<clock_timestamp()
   and (select count(*) from pg_catalog.pg_auth_members m where m.member=r.oid)=1
   and exists(select 1 from pg_catalog.pg_auth_members m join pg_catalog.pg_roles g on g.oid=m.roleid where m.member=r.oid and g.rolname='assess_worker' and not m.admin_option))
 or exists(select 1 from pg_catalog.pg_stat_activity where usename='assess_job_a') then
   raise exception 'trial worker must remain closed' using errcode='55000'; end if;
 end $closed$;`;
const begin=`begin isolation level read committed;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='15s';
set local row_security=off;`;
const lock=`lock table ${tables.map(t=>'assess.'+t).join(',')} in access exclusive mode nowait;`;
const noScope=`do $scope$ begin if exists(select 1 from assess.trial_scope) then raise exception 'trial must remain dormant' using errcode='55000'; end if; end $scope$;`;
export async function buildTrialInstallPackage({profile='original'}={}) {
 if(!['original','reviewed-pg17-v1'].includes(profile))throw new Error('Unknown trial catalog profile');
 const reviewed=profile==='reviewed-pg17-v1';
 const lf=await reference('lf'),crlf=await reference('crlf');
 // Exact alternatives from existing LF and historical CRLF migration sources only.
 // No whitespace/body normalization, observed-provider hash adoption or repair.
 let before=[lf.before,crlf.before],after=[lf.after,crlf.after];
 if(reviewed){
  const variants=[];
  for(const lineEndings of ['lf','crlf'])for(const historical of [false,true])for(const trialLineEndings of ['lf','crlf']){
   variants.push(await reference(lineEndings,{reviewed:true,historical,trialLineEndings}));
  }
  const unique=values=>[...new Map(values.map(v=>[JSON.stringify(v),v])).values()];
  before=unique(variants.map(v=>v.before));after=unique(variants.map(v=>v.after));
 }
 const projection=reviewed?reviewedCatalogSql:catalogSql;
 const checkBefore=assertion(before,'preinstall',projection),checkAfter=assertion(after,'postinstall',projection);
 const payload=source.replace(/^begin;$/m,'').replace(/^commit;$/m,'');
 const result=`select jsonb_build_object('contract','${reviewed?'assess-trial-install/2':'assess-trial-install/1'}','outcome','PASS','dormant',true,'runtimeOrLaunchVerified',false) as result;`;
 return {
  'preinstall.sql':`${begin}\nset transaction read only;\n${closed}\n${checkBefore}\n${result}\nrollback;\n`,
  'install.sql':`${begin}\n${lock}\n${closed}\n${checkBefore}\n${payload}\n${checkAfter}\n${closed}\n${noScope}\ncommit;\n${begin}\n${lock}\n${closed}\n${checkAfter}\n${noScope}\n${result}\nrollback;\n`,
  'postinstall.sql':`${begin}\n${lock}\n${closed}\n${checkAfter}\n${noScope}\n${result}\nrollback;\n`,
  'reference.json':JSON.stringify({contract:reviewed?'assess-trial-install-reference/2':'assess-trial-install-reference/1',...(reviewed?{profile}:{}),sourceSha256:sha(source),catalogSha256:sha(projection),before,after},null,2)+'\n',
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2);
 if(args.length&&!(args.length===1&&args[0]==='--reviewed-pg17-v1'))throw new Error('Only --reviewed-pg17-v1 accepted');
 const files=await buildTrialInstallPackage(args.length?{profile:'reviewed-pg17-v1'}:{}),output=await mkdtemp(join(tmpdir(),'radlab-trial-install-'));
 for(const [name,body] of Object.entries(files))await writeFile(join(output,name),body,{mode:0o600});
 await writeFile(join(output,'SHA256SUMS'),Object.entries(files).map(([n,b])=>`${sha(b)}  ${n}`).join('\n')+'\n');
 console.log(JSON.stringify({contract:'assess-trial-install-build/1',output,runtimeOrLaunchVerified:false}));
}
