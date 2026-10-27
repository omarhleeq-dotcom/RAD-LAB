-- REVIEW PACKET ONLY. Not executed against a provider in this session.
-- PostgreSQL >=16. Metadata only; no participant rows, JWTs, passwords or function bodies.
-- Run from the owner's reviewed administrative channel; retain results securely.
begin isolation level repeatable read read only;
set local statement_timeout='5s';
set local lock_timeout='1s';
select current_setting('server_version_num')::int server_version_num,
 current_user operator_role, current_setting('transaction_read_only') read_only;

-- Bounds include a sentinel row: reaching a cap means STOP, never a partial pass.
select r.rolname,r.rolcanlogin,r.rolinherit,r.rolsuper,r.rolbypassrls,
 r.rolcreaterole,r.rolcreatedb,r.rolreplication,
 r.rolvaliduntil is not null has_expiry
from pg_roles r order by r.rolname limit 257;

-- Complete membership edges, including ADMIN/SET/INHERIT. Reachability must be reviewed
-- transitively; NOLOGIN and NOINHERIT alone do not prevent another role using SET ROLE.
select parent.rolname granted_role,child.rolname member_role,
 m.admin_option,m.set_option,m.inherit_option,grantor.rolname grantor
from pg_auth_members m join pg_roles parent on parent.oid=m.roleid
 join pg_roles child on child.oid=m.member join pg_roles grantor on grantor.oid=m.grantor
order by 1,2,6 limit 513;

select n.nspname,pg_get_userbyid(n.nspowner) owner,n.nspacl::text acl
from pg_namespace n where n.nspname in ('public','assess','auth','supabase_migrations')
order by 1;
select d.datname,d.datacl::text acl from pg_database d
where d.datname=current_database();

select n.nspname,c.relname,pg_get_userbyid(c.relowner) owner,
 c.relrowsecurity,c.relforcerowsecurity,c.relacl::text acl
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','assess') and c.relkind in ('r','p','v','m','S','f')
order by 1,2 limit 257;
select n.nspname,c.relname,a.attname,format_type(a.atttypid,a.atttypmod) type,
 a.attnotnull,a.attacl::text column_acl,pg_get_expr(d.adbin,d.adrelid) default_expression
from pg_attribute a join pg_class c on c.oid=a.attrelid
join pg_namespace n on n.oid=c.relnamespace
left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
where n.nspname in ('public','assess') and c.relkind in ('r','p') and a.attnum>0 and not a.attisdropped
order by 1,2,a.attnum limit 1025;

-- Source hashes require an independently prepared expected catalog for each phase.
-- A hash from a local fixture is NOT a provider attestation. Owner and ACL are separate.
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) arguments,
 pg_get_userbyid(p.proowner) owner,p.prosecdef,p.proconfig,p.proacl::text acl,
 encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') definition_sha256
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','assess') and p.prokind in ('f','p')
order by 1,2,3 limit 513;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','assess') order by 1,2,3 limit 257;
select n.nspname,c.relname,k.conname,k.convalidated,pg_get_constraintdef(k.oid) definition
from pg_constraint k join pg_class c on c.oid=k.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','assess') order by 1,2,3 limit 513;
select n.nspname,c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid) definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal and n.nspname in ('public','assess') order by 1,2,3 limit 129;
select schemaname,tablename,indexname,indexdef from pg_indexes
where schemaname in ('public','assess') order by 1,2,3 limit 513;
select pg_get_userbyid(d.defaclrole) owner,n.nspname,d.defaclobjtype,d.defaclacl::text acl
from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace order by 1,2,3 limit 129;
select extname,extversion from pg_extension order by 1 limit 65;
select to_regclass('supabase_migrations.schema_migrations') is not null migration_history_present,
 to_regclass('assess.scope_lock') is not null migration_1_marker,
 to_regclass('assess.authoring_drafts') is not null migration_2_marker,
 to_regclass('assess.assignment_reviews') is not null migration_3_marker;
rollback;
