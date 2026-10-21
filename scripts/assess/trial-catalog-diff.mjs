// Offline generator for a read-only diagnostic. Never adopts provider hashes or applies SQL.
import { mkdtemp,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { openLocalDatabase } from './local-database.mjs';
import { buildTrialInstallPackage,catalogSql } from './trial-install.mjs';
const quote=s=>"'"+s.replaceAll("'","''")+"'";
export async function buildCatalogDiffSql(){
 const files=await buildTrialInstallPackage();
 const reference=JSON.parse(files['reference.json']);
 return `-- Diagnostic only: postgres in SQL Editor, whole file, no installation or repair.
-- End the failed read-only preinstall transaction before starting this diagnostic.
rollback;
begin isolation level repeatable read read only;
set local search_path='';
set local row_security=off;
set local statement_timeout='15s';
set local lock_timeout='2s';
do $reader$ begin
 if current_user<>'postgres' or session_user<>'postgres' then
  raise exception 'trial diagnostic reader required' using errcode='42501'; end if;
end $reader$;
with reference as materialized(select ${quote(JSON.stringify(reference.before))}::jsonb variants),
observed as materialized(${catalogSql}),
refs as materialized(
 select distinct 'function'::text kind,f->>'id' id,f doc from reference r,
 lateral jsonb_array_elements(r.variants) v,lateral jsonb_array_elements(v->'functions') f
 union all
 select 'table',t->>'id',t from reference r,lateral jsonb_array_elements(r.variants->0->'tables') t
 union all
 select 'schema','assess',jsonb_build_object('id','assess','acl',r.variants->0->'schemaAcl') from reference r
),
seen as materialized(
 select 'function'::text kind,f->>'id' id,f doc from observed o,lateral jsonb_array_elements(o.catalog->'functions') f
 where f->>'id' like 'assess.%' or exists(select 1 from refs r where r.kind='function' and r.id=f->>'id')
 union all
 select 'table',t->>'id',t from observed o,lateral jsonb_array_elements(o.catalog->'tables') t
 union all
 select 'schema','assess',jsonb_build_object('id','assess','acl',o.catalog->'schemaAcl') from observed o
),
base as materialized(select distinct on(kind,id) kind,id,doc from refs order by kind,id,doc::text),
objects as materialized(
 select coalesce(b.kind,s.kind) kind,coalesce(b.id,s.id) id,b.doc expected,s.doc actual
 from base b full join seen s on b.kind=s.kind and b.id=s.id
),
field_differences as materialized(
 select o.kind,o.id,k.field,
 jsonb_build_object('kind',o.kind,'object',o.id,'field',k.field,
  'expectedPresent',o.expected?k.field,'observedPresent',o.actual?k.field,
  'expected',(select jsonb_agg(distinct case when k.field in ('config','policies','constraints','triggers') then jsonb_build_object('md5',md5((r.doc->k.field)::text),'triggerOrder',case when k.field='triggers' then (select jsonb_agg(t->0) from jsonb_array_elements(r.doc->k.field) t) else null end) else r.doc->k.field end) from refs r where r.kind=o.kind and r.id=o.id),
  'observed',case when k.field in ('config','policies','constraints','triggers') then jsonb_build_object('md5',md5((o.actual->k.field)::text),'triggerOrder',case when k.field='triggers' then (select jsonb_agg(t->0) from jsonb_array_elements(o.actual->k.field) t) else null end) else o.actual->k.field end) detail
 from objects o cross join lateral jsonb_object_keys(coalesce(o.expected,'{}'::jsonb)||coalesce(o.actual,'{}'::jsonb)) k(field)
 where o.expected is not null and o.actual is not null and not exists(
  select 1 from refs r where r.kind=o.kind and r.id=o.id
   and (r.doc?k.field)=(o.actual?k.field) and (r.doc->k.field) is not distinct from (o.actual->k.field))
),
differences as materialized(
 select kind,id,field,detail from field_differences
 union all
 select kind,id,'presence',jsonb_build_object('kind',kind,'object',id,'field','presence','expected',expected is not null,'observed',actual is not null)
 from objects where expected is null or actual is null
 union all
 -- Whole-object correlation is required by the installer; individually matching
 -- LF body and CRLF definition hashes must not disguise an unreviewed combination.
 select o.kind,o.id,'reference_variant',jsonb_build_object('kind',o.kind,'object',o.id,'field','reference_variant',
  'expected',(select jsonb_agg(distinct md5(r.doc::text)) from refs r where r.kind=o.kind and r.id=o.id),
  'observed',md5(o.actual::text))
 from objects o where o.expected is not null and o.actual is not null
 and not exists(select 1 from refs r where r.kind=o.kind and r.id=o.id and r.doc=o.actual)
 and not exists(select 1 from field_differences d where d.kind=o.kind and d.id=o.id)
),
bounded as materialized(select detail from differences order by kind,id,field limit 100)
select jsonb_build_object('contract','assess-trial-catalog-diff/1',
 'referenceMatched',not exists(select 1 from differences),
 'totalDifferences',(select count(*) from differences),
 'truncated',(select count(*)>100 from differences),
 'differences',coalesce((select jsonb_agg(detail) from bounded),'[]'::jsonb),
 'runtimeOrLaunchVerified',false) as diagnostic;
rollback;
`;
}
/** Focused diagnostic only. Expected body comes from repository migrations locally;
 * provider body/config/literals never leave SQL as text and are never executed.
 */
export async function buildOwnerListDetailSql(){
 const db=await openLocalDatabase('pglite');let expected;
 try{
  expected=(await db.query("select prosrc from pg_proc where oid='public.owner_list_participants()'::regprocedure"))[0].prosrc;
 }finally{await db.close();}
 return `-- One public function only, read-only metadata; no function execution/repair.
rollback;
begin isolation level repeatable read read only;
set local search_path='';
set local row_security=off;
set local statement_timeout='15s';
set local lock_timeout='2s';
do $reader$ begin
 if current_user<>'postgres' or session_user<>'postgres' then raise exception 'detail reader required' using errcode='42501'; end if;
 if to_regprocedure('public.owner_list_participants()') is null then raise exception 'detail function missing' using errcode='55000'; end if;
 if (select octet_length(prosrc)>32768 from pg_proc where oid='public.owner_list_participants()'::regprocedure) then raise exception 'detail source ceiling exceeded' using errcode='54000'; end if;
end $reader$;
with expected as materialized(select ${quote(expected)}::text src),
observed as materialized(select prosrc src,md5(pg_get_functiondef(oid)) definition_hash from pg_proc where oid='public.owner_list_participants()'::regprocedure),
expected_lines as materialized(select ordinal i,line from expected e,lateral unnest(string_to_array(e.src,chr(10))) with ordinality l(line,ordinal)),
observed_lines as materialized(select ordinal i,line from observed o,lateral unnest(string_to_array(replace(o.src,chr(13)||chr(10),chr(10)),chr(10))) with ordinality l(line,ordinal)),
differences as materialized(
 select coalesce(e.i,o.i) i,jsonb_build_object('line',coalesce(e.i,o.i),
 'expectedPresent',e.i is not null,'observedPresent',o.i is not null,
 'expectedHash',md5(e.line),'observedHash',md5(o.line),
 'expectedCharacters',length(e.line),'observedCharacters',length(o.line),
 'sameAfterTrimming',btrim(e.line,chr(32)||chr(9)||chr(13))=btrim(o.line,chr(32)||chr(9)||chr(13)),
 'observedWhitespaceOnly',btrim(o.line,chr(32)||chr(9)||chr(13))='',
 'matchingExpectedLines',(select coalesce(jsonb_agg(x.i order by x.i),'[]'::jsonb) from expected_lines x
  where btrim(x.line,chr(32)||chr(9)||chr(13))=btrim(o.line,chr(32)||chr(9)||chr(13)))) detail
 from expected_lines e full join observed_lines o using(i) where e.line is distinct from o.line
), bounded as materialized(select detail from differences order by i limit 64)
select jsonb_build_object('contract','assess-owner-list-source-detail/1','diagnosticOnly',true,
 'serverVersion',current_setting('server_version'),
 'expected',jsonb_build_object('lfBodyHash',md5(e.src),'crlfBodyHash',md5(replace(e.src,chr(10),chr(13)||chr(10))),
  'characters',length(e.src),'utf8Bytes',octet_length(e.src),'lines',(select count(*) from expected_lines)),
 'observed',jsonb_build_object('bodyHash',md5(o.src),'definitionHash',o.definition_hash,
  'characters',length(o.src),'utf8Bytes',octet_length(o.src),'lines',(select count(*) from observed_lines),
  'lfCount',length(o.src)-length(replace(o.src,chr(10),'')),
  'crlfCount',(length(o.src)-length(replace(o.src,chr(13)||chr(10),'')))/2,
  'loneCrCount',length(replace(o.src,chr(13)||chr(10),''))-length(replace(replace(o.src,chr(13)||chr(10),''),chr(13),''))),
 'matchesLfSource',o.src=e.src,
 'matchesCrlfSource',o.src=replace(e.src,chr(10),chr(13)||chr(10)),
 'matchesAfterCrlfToLf',replace(o.src,chr(13)||chr(10),chr(10))=e.src,
 'matchesNonblankTrimmedLines',
  (select jsonb_agg(btrim(line,chr(32)||chr(9)||chr(13)) order by i) from expected_lines where btrim(line,chr(32)||chr(9)||chr(13))<>'')=
  (select jsonb_agg(btrim(line,chr(32)||chr(9)||chr(13)) order by i) from observed_lines where btrim(line,chr(32)||chr(9)||chr(13))<>''),
 'totalLineDifferences',(select count(*) from differences),'truncated',(select count(*)>64 from differences),
 'lineDifferences',coalesce((select jsonb_agg(detail) from bounded),'[]'::jsonb),
 'runtimeOrLaunchVerified',false) as diagnostic
from expected e cross join observed o;
rollback;
`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2),detail=args.length===1&&args[0]==='--owner-list-detail';
 if(args.length&&!detail)throw new Error('Only --owner-list-detail accepted');
 const sql=await(detail?buildOwnerListDetailSql():buildCatalogDiffSql()),output=await mkdtemp(join(tmpdir(),'radlab-trial-catalog-diff-'));
 const sha=createHash('sha256').update(sql).digest('hex'),name=detail?'owner-list-detail.sql':'catalog-diff.sql';
 await writeFile(join(output,name),sql,{mode:0o600});
 await writeFile(join(output,'SHA256SUMS'),`${sha}  ${name}\n`,{mode:0o600});
 console.log(JSON.stringify({contract:detail?'assess-owner-list-detail-build/1':'assess-trial-catalog-diff-build/1',output,sha256:sha,runtimeOrLaunchVerified:false}));
}
