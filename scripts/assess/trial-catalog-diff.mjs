// Offline generator for a read-only diagnostic. Never adopts provider hashes or applies SQL.
import { mkdtemp,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
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
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==2)throw new Error('No arguments accepted');
 const sql=await buildCatalogDiffSql(),output=await mkdtemp(join(tmpdir(),'radlab-trial-catalog-diff-'));
 const sha=createHash('sha256').update(sql).digest('hex');
 await writeFile(join(output,'catalog-diff.sql'),sql,{mode:0o600});
 await writeFile(join(output,'SHA256SUMS'),`${sha}  catalog-diff.sql\n`,{mode:0o600});
 console.log(JSON.stringify({contract:'assess-trial-catalog-diff-build/1',output,sha256:sha,runtimeOrLaunchVerified:false}));
}
