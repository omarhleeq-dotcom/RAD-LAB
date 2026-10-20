-- Supplemental reviewed B/C/D/E catalogue only. No network/auth configuration or runtime proof.
-- Target-specific authorization is required on any provider. E additions do not re-verify the prior C/D service proof.
-- Only catalogues are read. No profiles, candidate documents, answers, grades or gate values are returned.
-- Follow a passing catalogue with assess-mixed-ready.sql for the CLOSED gate value.
begin read only;
with expected_tables(name) as (values
  ('assess.groups'),
  ('assess.memberships'),
  ('assess.versions'),
  ('assess.assignments'),
  ('assess.targets'),
  ('assess.launch_gate'),
  ('assess.publications'),
  ('assess.reservations'),
  ('assess.sessions'),
  ('assess.session_details'),
  ('assess.receipts'),
  ('assess.results'),
  ('assess.content_submissions'),
  ('assess.practical_presentations')
), tables as (
  select e.name,c.oid,c.relrowsecurity from expected_tables e left join pg_class c on c.oid=to_regclass(e.name)
), expected_functions(signature,audience) as (values
  ('assess.group_write_v1(uuid,text,boolean)','user'),
  ('assess.members_write_v1(uuid,uuid[],boolean)','user'),
  ('assess.assign_v1(uuid,uuid[],uuid[])','user'),
  ('assess.targets_write_v1(uuid,integer,uuid[],boolean)','user'),
  ('assess.owner_page_v1(text,uuid,text,uuid,integer)','user'),
  ('assess.assigned_version_v1(uuid)','user'),
  ('assess.start_v1(uuid,uuid)','user'),
  ('assess.read_session_v1(uuid)','user'),
  ('assess.command_v1(uuid,uuid,integer,jsonb)','user'),
  ('assess.result_v1(uuid)','user'),
  ('assess.content_submit_v1(jsonb)','user'),
  ('assess.content_page_v1(uuid,integer)','user'),
  ('assess.assigned_page_v1(uuid,integer)','user'),
  ('assess.read_mixed_session_v1(uuid)','user'),
  ('assess.assigned_practical_page_v1(uuid,integer)','user'),
  ('assess.read_practical_session_v1(uuid)','user'),
  ('assess.install_publication_v1(uuid,jsonb,jsonb)','worker'),
  ('assess.maintain_v1(integer)','worker'),
  ('assess.claim_v1()','worker'),
  ('assess.finish_v1(uuid,uuid,text,text)','worker'),
  ('assess.fail_v1(uuid,uuid)','worker'),
  ('assess.recover_v1(uuid)','worker'),
  ('assess.health_v1()','worker'),
  ('assess.content_read_v1(uuid)','worker'),
  ('assess.content_install_v1(uuid,jsonb)','worker'),
  ('assess.content_install_practical_v1(uuid,jsonb,jsonb)','worker'),
  ('assess.session_authorize_v1(uuid)','internal'),
  ('assess.session_ack_v1(uuid,uuid)','internal'),
  ('assess.validate_answer_v1(jsonb,jsonb,jsonb)','internal')
), functions as (
  select e.*,p.oid,p.prosecdef,p.proconfig,p.proacl,p.proowner
  from expected_functions e left join pg_proc p on p.oid=to_regprocedure(e.signature)
), expected_roles(name) as (values ('anon'),('authenticated'),('assess_worker')),
roles as (select e.name,r.oid,r.rolsuper,r.rolbypassrls,r.rolcanlogin,r.rolinherit from expected_roles e left join pg_roles r on r.rolname=e.name),
checks as (
  select
    current_setting('transaction_read_only')='on' as read_only,
    (select bool_and(oid is not null) from tables) as tables_present,
    (select bool_and(coalesce(relrowsecurity,false)) from tables) as rls_enabled,
    (select bool_and(oid is not null) from roles) as roles_present,
    (select bool_and(oid is not null) from functions) as functions_present,
    coalesce((select bool_and(case when r.oid is not null then has_schema_privilege(r.oid,n.oid,'USAGE')=(r.name<>'anon') and not has_schema_privilege(r.oid,n.oid,'CREATE') else false end) from pg_namespace n cross join roles r where n.nspname='assess'),false) as schema_privileges,
    (select bool_and(coalesce(prosecdef,false) and coalesce(proconfig @> array['search_path=""'],false)) from functions) as definer_and_empty_search_path,
    (select bool_and(case when t.oid is not null and r.oid is not null then not has_table_privilege(r.oid,t.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') else false end) from tables t cross join roles r) as no_direct_table_privileges,
    (select bool_and(case when f.oid is not null and r.oid is not null then has_function_privilege(r.oid,f.oid,'EXECUTE') = ((r.name='authenticated' and f.audience='user') or (r.name='assess_worker' and f.audience='worker')) else false end) from functions f cross join roles r) as execute_matrix,
    not exists(select 1 from functions f cross join lateral aclexplode(coalesce(f.proacl,acldefault('f',f.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE') as no_public_execute,
    (select bool_and(not rolsuper and not rolbypassrls) from roles) as roles_not_privileged,
    coalesce((select not rolcanlogin and not rolinherit from roles where name='assess_worker'),false) as worker_nonlogin_noinherit,
    case when (select count(oid)=3 from roles) then not pg_has_role('anon','assess_worker','MEMBER') and not pg_has_role('authenticated','assess_worker','MEMBER') else false end as users_not_worker_members,
    not exists(select 1 from pg_policy where polrelid in (select oid from tables)) as no_direct_table_policies,
    not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p','v','m','f') and c.oid not in (select oid from tables where oid is not null)) as no_unreviewed_relations,
    not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='assess' and p.oid not in (select oid from functions where oid is not null)) as no_unreviewed_functions
)
select 'assess-staging-catalogue/1' as contract,checks.*,
  read_only and tables_present and rls_enabled and roles_present and functions_present and schema_privileges and definer_and_empty_search_path
  and no_direct_table_privileges and execute_matrix and no_public_execute and roles_not_privileged
  and worker_nonlogin_noinherit and users_not_worker_members and no_direct_table_policies
  and no_unreviewed_relations and no_unreviewed_functions as catalogue_ready,
  false as runtime_or_launch_verified
from checks;
rollback;
