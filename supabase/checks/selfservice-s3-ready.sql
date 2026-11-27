-- S3 read RPC ACL and private evidence; no writes or configuration changes.
begin read only;
set local search_path='';
select 's3_read_exists' check_name,to_regprocedure('assess.attempt_eligibility_page_v1(uuid,uuid,integer)') is not null ok
union all select 's3_read_authenticated',has_function_privilege('authenticated','assess.attempt_eligibility_page_v1(uuid,uuid,integer)','EXECUTE')
union all select 's3_read_private',not exists(select 1 from pg_roles where rolname in ('anon','service_role','assess_worker','assess_authoring_bridge') and has_function_privilege(oid,'assess.attempt_eligibility_page_v1(uuid,uuid,integer)','EXECUTE'))
union all select 's3_evidence_private',not exists(select 1 from pg_roles where rolname in ('anon','authenticated','service_role','assess_worker','assess_authoring_bridge') and has_table_privilege(oid,'assess.stop_active_attempts','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'))
union all select 's3_additional_reads',not exists(select 1 from (values('assess.student_exams_page_v1(uuid,integer)'),('assess.history_page_v2(uuid,integer)'),('assess.selfservice_metadata_page_v1(text,uuid,integer)')) f(signature) where to_regprocedure(signature) is null or not has_function_privilege('authenticated',signature,'EXECUTE'))
union all select 's3_additional_private',not exists(select 1 from pg_roles r cross join (values('assess.student_exams_page_v1(uuid,integer)'),('assess.history_page_v2(uuid,integer)'),('assess.selfservice_metadata_page_v1(text,uuid,integer)')) f(signature) where r.rolname in ('anon','service_role','assess_worker','assess_authoring_bridge') and has_function_privilege(r.oid,signature,'EXECUTE'));
rollback;
