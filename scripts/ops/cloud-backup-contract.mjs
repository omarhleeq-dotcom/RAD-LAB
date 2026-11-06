// Read-only catalogue contract. Names/hashes only leave the owner inventory; no
// row contents, function bodies, role settings, passwords or decrypted Vault data.
import { createHash } from 'node:crypto';
import { quoteIdent } from './laptop-backup-lib.mjs';
export const ROLE='assess_backup';
export const POLICY='assess_backup_read_v1';
export const MAX_OBJECTS=2000;
export const inventorySql=`with rel as (
 select n.nspname s,c.relname t,c.relkind k,c.relrowsecurity r,c.relforcerowsecurity forced,
 pg_get_userbyid(c.relowner) owner,
 md5(jsonb_build_object('columns',(select jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid)) order by a.attnum) from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
 'constraints',(select jsonb_agg(pg_get_constraintdef(x.oid) order by x.conname) from pg_constraint x where x.conrelid=c.oid and x.contype<>'n'),
 'indexes',(select jsonb_agg(pg_get_indexdef(x.indexrelid) order by x.indexrelid::regclass::text collate "C") from pg_index x where x.indrelid=c.oid),
 'triggers',(select jsonb_agg(jsonb_build_array(pg_get_triggerdef(x.oid),x.tgenabled) order by x.tgname) from pg_trigger x where x.tgrelid=c.oid and not x.tgisinternal),
 'view',case when c.relkind in ('v','m') then pg_get_viewdef(c.oid) end,
 'acl',(select jsonb_agg(jsonb_build_array(case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantee::regrole::text collate "C",a.privilege_type) from aclexplode(coalesce(c.relacl,acldefault(case when c.relkind='S' then 's'::"char" else 'r'::"char" end,c.relowner))) a where not (pg_get_userbyid(a.grantee)='assess_backup' and a.privilege_type='SELECT' and not a.is_grantable)),
 'policies',(select jsonb_agg(jsonb_build_array(p.polname,p.polcmd,p.polpermissive,(select jsonb_agg(case when x=0 then 'PUBLIC' else pg_get_userbyid(x) end order by x) from unnest(p.polroles)x),pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid)) order by p.polname) from pg_policy p where p.polrelid=c.oid and not (p.polname='assess_backup_read_v1' and p.polcmd='r' and p.polpermissive and p.polroles=array[(select oid from pg_roles where rolname='assess_backup')] and pg_get_expr(p.polqual,p.polrelid)='true' and p.polwithcheck is null)),
 'sequence',(select jsonb_build_array(seqtypid::regtype::text,seqstart::text,seqincrement::text,seqmax::text,seqmin::text,seqcache::text,seqcycle) from pg_sequence where seqrelid=c.oid))::text) definition
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_toast' and n.nspname !~ '^pg_temp' and c.relkind in ('r','p','S','v','m','f')
), lob as (select l.oid::text id,pg_get_userbyid(l.lomowner) owner,md5(coalesce((select jsonb_agg(jsonb_build_array(case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantee::regrole::text collate "C",a.privilege_type) from aclexplode(coalesce(l.lomacl,acldefault('L',l.lomowner))) a where not(pg_get_userbyid(a.grantee)='assess_backup' and a.privilege_type='SELECT' and not a.is_grantable))::text,'[]')) definition from pg_largeobject_metadata l),
 functions as (select p.oid::regprocedure::text name,md5(pg_get_functiondef(p.oid)) definition,
 pg_get_userbyid(p.proowner) owner,(select jsonb_agg(jsonb_build_array(pg_get_userbyid(a.grantor),case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantor::regrole::text collate "C",a.grantee::regrole::text collate "C",a.privilege_type) from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a) acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_(toast|temp)' and p.prokind in ('f','p','w')),
 bounded as (select (select count(*) from rel)<=2000 and (select count(*) from lob)<=4096 and (select count(*) from pg_roles)<=256 and (select count(*) from functions)<=5000 ok)
 select jsonb_build_object('contract','rad105-backup-inventory/2','bounded',bounded.ok,
 'serverVersion',current_setting('server_version_num')::int,
 'relations',case when bounded.ok then (select coalesce(jsonb_agg(to_jsonb(qrel) order by s collate "C",t collate "C"),'[]'::jsonb) from rel qrel) end,
 'largeObjects',case when bounded.ok then (select coalesce(jsonb_agg(to_jsonb(l) order by id::bigint),'[]'::jsonb) from lob l) end,
 'schemas',case when bounded.ok then (select jsonb_agg(jsonb_build_array(nspname,pg_get_userbyid(nspowner),(select jsonb_agg(jsonb_build_array(pg_get_userbyid(a.grantor),case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantor::regrole::text collate "C",a.grantee::regrole::text collate "C",a.privilege_type) from aclexplode(coalesce(nspacl,acldefault('n',nspowner))) a where not(pg_get_userbyid(a.grantee)='assess_backup' and a.privilege_type='USAGE' and not a.is_grantable))) order by nspname collate "C") from pg_namespace where nspname not in ('pg_catalog','information_schema') and nspname !~ '^pg_(toast|temp)') end,
 'functionsHash',case when bounded.ok then (select md5(coalesce(jsonb_agg(to_jsonb(f) order by name collate "C")::text,'[]')) from functions f) end,
 'extensions',case when bounded.ok then (select coalesce(jsonb_agg(jsonb_build_array(extname,extversion,(select jsonb_agg(x::regclass::text order by ord) from unnest(extconfig) with ordinality u(x,ord)),md5(coalesce(extcondition::text,'[]')),exists(select 1 from unnest(extcondition) x where x<>'')) order by extname),'[]'::jsonb) from pg_extension) end,
 'database',(select jsonb_build_object('owner',pg_get_userbyid(datdba),'acl',(select jsonb_agg(jsonb_build_array(pg_get_userbyid(a.grantor),case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantor::regrole::text collate "C",a.grantee::regrole::text collate "C",a.privilege_type) from aclexplode(coalesce(datacl,acldefault('d',datdba))) a where not(pg_get_userbyid(a.grantee)='assess_backup' and a.privilege_type='CONNECT' and not a.is_grantable)), 'settingsHash',(select md5(coalesce(jsonb_agg(jsonb_build_array(r.rolname,s.setconfig) order by r.rolname)::text,'[]')) from pg_db_role_setting s left join pg_roles r on r.oid=s.setrole where s.setdatabase=d.oid), 'encoding',pg_encoding_to_char(encoding),'provider',datlocprovider,'locale',coalesce(to_jsonb(d)->>'datlocale',to_jsonb(d)->>'daticulocale'),'collate',datcollate,'ctype',datctype) from pg_database d where datname=current_database())) document from bounded`;
export const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function validateInventory(v){
 const keys=['contract','bounded','serverVersion','relations','largeObjects','functionsHash','extensions','database','schemas'];
 if(!v||Object.keys(v).sort().join()!==keys.sort().join())throw Error('inventory_keys');
 if(!v||v.contract!=='rad105-backup-inventory/2'||v.bounded!==true||!Number.isInteger(v.serverVersion)||
 !Array.isArray(v.relations)||!v.relations.length||v.relations.length>MAX_OBJECTS||!Array.isArray(v.largeObjects)||v.largeObjects.length>4096||!Array.isArray(v.extensions)||!Array.isArray(v.schemas)||!v.database||!/^[a-f0-9]{32}$/.test(v.functionsHash))throw Error('inventory');
 const name=x=>typeof x==='string'&&/^[A-Za-z_][A-Za-z0-9_$]{0,62}$/.test(x);
 const acl=(a,privileges)=>a===null||(Array.isArray(a)&&a.length<=1024&&a.every(x=>Array.isArray(x)&&x.length===4&&name(x[0])&&name(x[1])&&privileges.includes(x[2])&&typeof x[3]==='boolean'));
 if(v.schemas.length>256||v.schemas.some(x=>!Array.isArray(x)||x.length!==3||!name(x[0])||!name(x[1])||!acl(x[2],['USAGE','CREATE'])))throw Error('inventory_schemas');
 const d=v.database;
 if(Object.keys(d).sort().join()!==['acl','collate','ctype','encoding','locale','owner','provider','settingsHash'].sort().join()||!name(d.owner)||!acl(d.acl,['CONNECT','CREATE','TEMPORARY'])||!/^[a-f0-9]{32}$/.test(d.settingsHash)||!['c','i','b'].includes(d.provider)||!['encoding','collate','ctype'].every(k=>typeof d[k]==='string'&&d[k].length<=128&&!/[\x00-\x1f]/.test(d[k]))||(d.locale!==null&&(typeof d.locale!=='string'||d.locale.length>128||/[\x00-\x1f]/.test(d.locale))))throw Error('inventory_database');
 const names=new Set();for(const r of v.relations){
  if(!r||Object.keys(r).sort().join()!==['s','t','k','r','forced','owner','definition'].sort().join()||!['r','p','S','v','m','f'].includes(r.k)||!['s','t','owner'].every(k=>typeof r[k]==='string'&&/^[A-Za-z_][A-Za-z0-9_$]{0,62}$/.test(r[k]))||typeof r.r!=='boolean'||typeof r.forced!=='boolean'||!/^[a-f0-9]{32}$/.test(r.definition)||names.has(r.s+'.'+r.t))throw Error('inventory');names.add(r.s+'.'+r.t);
 }
 for(const l of v.largeObjects)if(Object.keys(l).sort().join()!==['id','owner','definition'].sort().join()||!/^[1-9][0-9]{0,9}$/.test(l.id)||typeof l.owner!=='string'||!/^[a-f0-9]{32}$/.test(l.definition))throw Error('inventory');
 if(v.extensions.length>256||v.extensions.some(e=>!Array.isArray(e)||e.length!==5||!/^[a-z][a-z0-9_-]{0,62}$/.test(e[0])||!/^[0-9A-Za-z_.-]{1,32}$/.test(e[1])||(e[2]!==null&&(!Array.isArray(e[2])||e[2].length>MAX_OBJECTS||e[2].some(n=>typeof n!=='string'||n.length>128)))||!/^[a-f0-9]{32}$/.test(e[3])||e[4]!==false))throw Error('required_extension_filter');
 if(v.relations.some(r=>['m','f'].includes(r.k)))throw Error('unsupported_required_relation');
 return v;
}
export async function readInventory(db){await db.query("set search_path='';set TimeZone='UTC'");return validateInventory((await db.query(inventorySql)).rows[0].document);}
export const dataRelations=v=>v.relations.filter(r=>['r','p','S'].includes(r.k));
export const qualified=r=>quoteIdent(r.s)+'.'+quoteIdent(r.t);
export const literal=s=>"'"+String(s).replaceAll("'","''")+"'";
// Includes schema tuple identities: ALTER followed by reset is still drift. DML rows are
// deliberately absent. Physical catalogue maintenance may conservatively STOP.
export const fenceSql=`select md5(jsonb_build_object(
 'class',(select jsonb_agg(jsonb_build_array(c.oid,c.xmin::text) order by c.oid) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_(toast|temp)'),
 'types',(select jsonb_agg(jsonb_build_array(t.oid,t.xmin::text) order by t.oid) from pg_type t join pg_namespace n on n.oid=t.typnamespace where n.nspname not in ('pg_catalog','information_schema')),
 'enums',(select jsonb_agg(jsonb_build_array(oid,xmin::text) order by oid) from pg_enum),
 'default_acl',(select jsonb_agg(jsonb_build_array(oid,xmin::text) order by oid) from pg_default_acl),
 'event_triggers',(select jsonb_agg(jsonb_build_array(oid,xmin::text) order by oid) from pg_event_trigger),
 'proc',(select jsonb_agg(jsonb_build_array(p.oid,p.xmin::text) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname not in ('pg_catalog','information_schema')),
 'policy',(select jsonb_agg(jsonb_build_array(oid,xmin::text) order by oid) from pg_policy),
 'sequence',(select jsonb_agg(jsonb_build_array(seqrelid,xmin::text) order by seqrelid) from pg_sequence),
 'roles',(select jsonb_agg(to_jsonb(r)-'rolpassword' order by rolname) from pg_roles r),
 'role_xmin',(select jsonb_agg(jsonb_build_array(oid,xmin::text) order by oid) from pg_auth_members),
 'role_settings',(select jsonb_agg(to_jsonb(s) order by setdatabase,setrole) from pg_db_role_setting s),
 'namespaces',(select jsonb_agg(jsonb_build_array(oid,xmin::text) order by oid) from pg_namespace where nspname !~ '^pg_(temp|toast)'),
 'extensions',(select jsonb_agg(to_jsonb(e) order by extname) from pg_extension e),
 'database',(select jsonb_build_array(oid,xmin::text,datdba,datacl,datconnlimit,datallowconn) from pg_database where datname=current_database())
 )::text) fingerprint`;
export async function fence(db){return(await db.query(fenceSql)).rows[0].fingerprint;}
export async function assertReader(db,inventory){
 const role=(await db.query(`select current_user u,session_user s,rolcanlogin,rolvaliduntil>clock_timestamp() valid,rolsuper,rolinherit,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls,
 exists(select 1 from pg_auth_members where member=r.oid or roleid=r.oid) member from pg_roles r where rolname=current_user`)).rows[0];
 if(!role||role.u!==ROLE||role.s!==ROLE||!role.rolcanlogin||!role.valid||Object.entries(role).some(([k,v])=>!['u','s','rolcanlogin','valid'].includes(k)&&v!==false))throw Error('privileges');
 const bad=(await db.query(readerSafetySql)).rows[0].bad;if(bad)throw Error('privileges');
 for(const r of dataRelations(inventory)){
  const name=qualified(r);const access=(await db.query('select has_table_privilege(current_user,$1,\'SELECT\') ok',[name])).rows[0].ok;if(!access)throw Error('coverage');
  if(r.r){const p=(await db.query(`select count(*) filter(where polname=$2 and polcmd='r' and polpermissive and polroles=array[current_user::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null)=1
   and count(*) filter(where not polpermissive and polcmd in ('r','*') and polroles&&array[0::oid,current_user::regrole::oid])=0 ok from pg_policy where polrelid=$1::regclass`,[name,POLICY])).rows[0].ok;if(!p)throw Error('full_rows');}
 }
 for(const l of inventory.largeObjects)if(!(await db.query("select exists(select 1 from pg_largeobject_metadata l cross join lateral aclexplode(coalesce(l.lomacl,acldefault('L',l.lomowner))) a where l.oid=$1::oid and a.grantee in (0,current_user::regrole::oid) and a.privilege_type='SELECT') ok",[l.id])).rows[0].ok)throw Error('large_objects');
}
export const readerSafetySql=`select
 has_database_privilege('assess_backup',current_database(),'CREATE,TEMP') or exists(select 1 from pg_namespace where nspname not like 'pg_%' and nspname<>'information_schema' and has_schema_privilege('assess_backup',oid,'CREATE')) or
 exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_toast' and c.relkind in ('r','p','v','m','f') and (has_table_privilege('assess_backup',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or has_any_column_privilege('assess_backup',c.oid,'INSERT,UPDATE,REFERENCES'))) or
 exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where case when c.relkind='S' and n.nspname not like 'pg_%' then has_sequence_privilege('assess_backup',c.oid,'USAGE,UPDATE') else false end) or
 exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where has_schema_privilege('assess_backup',n.oid,'USAGE') and has_function_privilege('assess_backup',p.oid,'EXECUTE') and
 (n.nspname in ('assess','emergency','vault','pgsodium') or (n.nspname not in ('pg_catalog','information_schema') and n.nspname !~ '^pg_(temp|toast)' and p.prosecdef and p.prorettype not in ('trigger'::regtype,'event_trigger'::regtype)))) or
 exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='vault' and c.relname='decrypted_secrets' and has_schema_privilege('assess_backup',n.oid,'USAGE') and has_table_privilege('assess_backup',c.oid,'SELECT')) or
 exists(select 1 from pg_largeobject_metadata l cross join lateral aclexplode(coalesce(l.lomacl,acldefault('L',l.lomowner))) a where a.grantee in (0,'assess_backup'::regrole::oid) and (a.privilege_type='UPDATE' or (a.grantee='assess_backup'::regrole and a.is_grantable))) or
 exists(select 1 from pg_default_acl d cross join lateral aclexplode(d.defaclacl) a where a.grantee='assess_backup'::regrole) or
 exists(select 1 from pg_namespace n cross join lateral aclexplode(n.nspacl) a where a.grantee='assess_backup'::regrole and a.is_grantable) or
 exists(select 1 from pg_database d cross join lateral aclexplode(d.datacl) a where a.grantee='assess_backup'::regrole and a.is_grantable) or
 exists(select 1 from pg_proc p cross join lateral aclexplode(p.proacl) a where a.grantee='assess_backup'::regrole) or
 exists(select 1 from pg_attribute x cross join lateral aclexplode(x.attacl) a where a.grantee='assess_backup'::regrole) or
 exists(select 1 from pg_class c cross join lateral aclexplode(c.relacl) a where a.grantee='assess_backup'::regrole and a.is_grantable) or exists(select 1 from pg_class where relowner='assess_backup'::regrole) or exists(select 1 from pg_proc where proowner='assess_backup'::regrole) or exists(select 1 from pg_namespace where nspowner='assess_backup'::regrole) or exists(select 1 from pg_database where datdba='assess_backup'::regrole) bad`;
export function grantPacket(inventory){
 validateInventory(inventory);const expected=literal(JSON.stringify(inventory));
 const schemas=[...new Set(dataRelations(inventory).map(r=>r.s))];
 const grants=dataRelations(inventory).map(r=>`grant select on ${r.k==='S'?'sequence':'table'} ${qualified(r)} to assess_backup;`);
 for(const r of dataRelations(inventory).filter(r=>r.r))grants.push(`do $policy$ begin
 if exists(select 1 from pg_policy where polrelid=${literal(qualified(r))}::regclass and polname='${POLICY}') then
  if not exists(select 1 from pg_policy where polrelid=${literal(qualified(r))}::regclass and polname='${POLICY}' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy ${POLICY} on ${qualified(r)} for select to assess_backup using(true);end if;end $policy$;`);
 for(const l of inventory.largeObjects)grants.push(`grant select on large object ${l.id} to assess_backup;`);
 return `-- Generated from the reviewed bounded inventory. No credential/LOGIN/provider action.\n-- Default DRY RUN; later owner window only: set radlab.backup_apply='reviewed-select-only'.\nbegin;set local search_path='';set local lock_timeout='2s';set local statement_timeout='30s';\nselect pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('radlab-assess-backup/2',0));\ndo $guard$ declare observed jsonb;begin\n select document into observed from (${inventorySql}) q;\n if observed is distinct from ${expected}::jsonb then raise exception 'backup inventory drift; no grant';end if;\n if current_setting('radlab.backup_apply',true) is distinct from 'reviewed-select-only' then raise notice 'DRY RUN: pinned inventory matched; no grants or policies';return;end if;\n if not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) then raise exception 'backup setup requires CLOSED';end if;\n if exists(select 1 from pg_stat_activity where usename='assess_backup') then raise exception 'backup connections present';end if;\n if not exists(select 1 from pg_roles where rolname='assess_backup') then create role assess_backup nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls valid until '-infinity';end if;\n if exists(select 1 from pg_roles where rolname='assess_backup' and (rolcanlogin or rolinherit or rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls)) or exists(select 1 from pg_auth_members where member='assess_backup'::regrole or roleid='assess_backup'::regrole) then raise exception 'backup role attributes/membership drift';end if;\n if exists(select 1 from pg_policy where not polpermissive and polcmd in ('r','*') and polroles&&array[0::oid,'assess_backup'::regrole::oid]) then raise exception 'restrictive backup read policy';end if;\n end $guard$;\ndo $apply$ begin if current_setting('radlab.backup_apply',true) is distinct from 'reviewed-select-only' then return;end if;\n${schemas.map(s=>'grant usage on schema '+quoteIdent(s)+' to assess_backup;').join('\n')}\ngrant connect on database ${quoteIdent('postgres')} to assess_backup;\n${grants.join('\n')}\nif (${readerSafetySql}) then raise exception 'backup privileges unsafe; transaction rolled back';end if;\nend $apply$;\ncommit;\n`;
}
// Compare role metadata by names, never OIDs/passwords. This is captured inside
// the exported-snapshot transaction and checked against the ACTUAL native SQL.
export const rolesSql=`select jsonb_build_object(
 'bootstrap',(select rolname from pg_roles where oid=10),
 'roles',(select jsonb_agg(to_jsonb(r)-array['oid','rolpassword'] order by rolname collate "C") from pg_roles r where rolname<>$1),
 'members',(select coalesce(jsonb_agg(jsonb_build_array(g.rolname,u.rolname,a.rolname,m.admin_option,m.inherit_option,m.set_option) order by g.rolname collate "C",u.rolname collate "C",a.rolname collate "C"),'[]'::jsonb) from pg_auth_members m join pg_roles g on g.oid=m.roleid join pg_roles u on u.oid=m.member join pg_roles a on a.oid=m.grantor where u.rolname<>$1 and g.rolname<>$1 and a.rolname<>$1),
 'comments',(select coalesce(jsonb_agg(jsonb_build_array(r.rolname,shobj_description(r.oid,'pg_authid')) order by r.rolname collate "C") filter(where shobj_description(r.oid,'pg_authid') is not null),'[]'::jsonb) from pg_roles r where rolname<>$1),
 'parameters',(select coalesce(jsonb_agg(jsonb_build_array(parname,(select jsonb_agg(jsonb_build_array(pg_get_userbyid(a.grantor),case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantor::regrole::text collate "C",a.grantee::regrole::text collate "C",a.privilege_type) from aclexplode(paracl) a)) order by parname collate "C"),'[]'::jsonb) from pg_parameter_acl)) value`;
export async function roleMetadata(db,excluded=''){return(await db.query(rolesSql,[excluded])).rows[0].value;}
// Offline, pre-credential readiness. This never enables LOGIN or fixes a failed row.
export function readyPacket(inventory){
 validateInventory(inventory);
 const required=dataRelations(inventory);
 const checks=required.map(r=>`has_schema_privilege('assess_backup',${literal(r.s)},'USAGE') and has_table_privilege('assess_backup',${literal(qualified(r))},'SELECT')`);
 const policies=required.filter(r=>r.r).map(r=>`(select count(*) filter(where polname='${POLICY}' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null)=1 and count(*) filter(where not polpermissive and polcmd in ('r','*') and polroles&&array[0::oid,'assess_backup'::regrole::oid])=0 from pg_policy where polrelid=${literal(qualified(r))}::regclass)`);
 return `-- Generated pre-credential readiness; ALL rows required true. READ ONLY, no activation.\nbegin read only;set local search_path='';set local lock_timeout='2s';set local statement_timeout='10s';\nwith inventory as (${inventorySql}) select 'backup_inventory' check_name,document=${literal(JSON.stringify(inventory))}::jsonb ok from inventory;\nselect 'backup_nologin_no_membership' check_name,exists(select 1 from pg_roles r where rolname='assess_backup' and not(rolcanlogin or rolinherit or rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls) and not exists(select 1 from pg_auth_members where member=r.oid or roleid=r.oid)) ok;\nselect 'backup_negative_privileges' check_name,not((${readerSafetySql})) ok;\nselect 'backup_full_row_coverage' check_name,${[...checks,...policies].join(' and ')||'false'} ok;\nselect 'backup_public_lob_constructors_denied' check_name,not exists(select 1 from unnest(array['pg_catalog.lo_create(oid)','pg_catalog.lo_creat(integer)','pg_catalog.lo_from_bytea(oid,bytea)']) f where has_function_privilege('assess_backup',f,'EXECUTE')) ok;\nselect 'backup_closed_zero_connections' check_name,(select count(*)=1 and bool_and(not enabled) from assess.launch_gate) and not exists(select 1 from pg_stat_activity where usename='assess_backup') ok;\nrollback;\n`;
}
