-- READ ONLY. Original project: vlacestfruxooznrcjqc; verify the SQL Editor project selector manually.
-- Metadata precheck only, not backup/restore evidence, full definition comparison or installation approval.
-- Does not read learner rows, modify Practice, apply C/D or open launch_gate.
begin read only;
with b_tables(name) as (values ('assess.groups'),('assess.memberships'),('assess.versions'),('assess.assignments'),('assess.targets')),
b_functions(signature) as (values
 ('assess.group_write_v1(uuid,text,boolean)'),('assess.members_write_v1(uuid,uuid[],boolean)'),
 ('assess.assign_v1(uuid,uuid[],uuid[])'),('assess.targets_write_v1(uuid,integer,uuid[],boolean)'),
 ('assess.owner_page_v1(text,uuid,text,uuid,integer)'),('assess.assigned_version_v1(uuid)')),
cd_tables(name) as (values ('assess.launch_gate'),('assess.publications'),('assess.reservations'),('assess.sessions'),('assess.session_details'),('assess.receipts'),('assess.results'),('assess.content_submissions')),
facts as (select
 current_setting('transaction_read_only')='on' as read_only,
 to_regclass('public.profiles') is not null and to_regclass('public.attempts') is not null
  and to_regclass('public.events') is not null and to_regclass('public.feedback') is not null as pilot_present,
 (select bool_and(to_regclass(name) is not null) from b_tables) as assess_b_tables_present,
 (select bool_and(coalesce((select c.relrowsecurity from pg_class c where c.oid=to_regclass(t.name)),false)) from b_tables t) as assess_b_rls,
 (select bool_and(to_regprocedure(signature) is not null) from b_functions) as assess_b_functions_present,
 (select count(*)::int from cd_tables where to_regclass(name) is not null) as cd_tables_present,
 (select count(*)::int from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='assess') as assess_functions_total,
 (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p','v','m','f')) as assess_relations_total,
 not exists(select 1 from pg_roles where rolname='assess_worker') as worker_role_absent
)
select facts.*,
 pilot_present and assess_b_tables_present and assess_b_rls and assess_b_functions_present
 and cd_tables_present=0 and assess_functions_total=6 and assess_relations_total=5 and worker_role_absent as ready_for_cd_review
from facts;
rollback;
