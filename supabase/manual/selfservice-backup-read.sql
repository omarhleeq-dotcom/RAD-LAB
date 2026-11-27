-- Generated from the reviewed bounded inventory. No credential/LOGIN/provider action.
-- Default DRY RUN; later owner window only: set radlab.backup_apply='reviewed-select-only'.
begin;set local search_path='';set local lock_timeout='2s';set local statement_timeout='30s';
select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('radlab-assess-backup/2',0));
do $guard$ declare observed jsonb;begin
 select document into observed from (with rel as (
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
 'roleNames',(select jsonb_agg(rolname order by rolname collate "C") from pg_roles where rolname<>'assess_backup'),
 'constructors',(select coalesce(jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'definition',md5(pg_get_functiondef(p.oid)),'aclReviewed',
 ((select count(*)=2 and bool_and(a.grantor=p.proowner and a.grantee in (0,p.proowner) and a.privilege_type='EXECUTE' and not a.is_grantable) from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a) or
  (select count(*)=(select count(*) from pg_roles where rolname<>'assess_backup') and bool_and(a.grantor=p.proowner and a.grantee<>0 and pg_get_userbyid(a.grantee)<>'assess_backup' and a.privilege_type='EXECUTE' and not a.is_grantable) from aclexplode(p.proacl) a))) order by p.oid::regprocedure::text),'[]'::jsonb) value from pg_proc p where p.oid in ('pg_catalog.lo_create(oid)'::regprocedure,'pg_catalog.lo_creat(integer)'::regprocedure,'pg_catalog.lo_from_bytea(oid,bytea)'::regprocedure)),
 'relations',case when bounded.ok then (select coalesce(jsonb_agg(to_jsonb(qrel) order by s collate "C",t collate "C"),'[]'::jsonb) from rel qrel) end,
 'largeObjects',case when bounded.ok then (select coalesce(jsonb_agg(to_jsonb(l) order by id::bigint),'[]'::jsonb) from lob l) end,
 'schemas',case when bounded.ok then (select jsonb_agg(jsonb_build_array(nspname,pg_get_userbyid(nspowner),(select jsonb_agg(jsonb_build_array(pg_get_userbyid(a.grantor),case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantor::regrole::text collate "C",a.grantee::regrole::text collate "C",a.privilege_type) from aclexplode(coalesce(nspacl,acldefault('n',nspowner))) a where not(pg_get_userbyid(a.grantee)='assess_backup' and a.privilege_type='USAGE' and not a.is_grantable))) order by nspname collate "C") from pg_namespace where nspname not in ('pg_catalog','information_schema') and nspname !~ '^pg_(toast|temp)') end,
 'functionsHash',case when bounded.ok then (select md5(coalesce(jsonb_agg(to_jsonb(f) order by name collate "C")::text,'[]')) from functions f) end,
 'extensions',case when bounded.ok then (select coalesce(jsonb_agg(jsonb_build_array(extname,extversion,(select jsonb_agg(x::regclass::text order by ord) from unnest(extconfig) with ordinality u(x,ord)),md5(coalesce(extcondition::text,'[]')),exists(select 1 from unnest(extcondition) x where x<>'')) order by extname),'[]'::jsonb) from pg_extension) end,
 'database',(select jsonb_build_object('owner',pg_get_userbyid(datdba),'acl',(select jsonb_agg(jsonb_build_array(pg_get_userbyid(a.grantor),case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) order by a.grantor::regrole::text collate "C",a.grantee::regrole::text collate "C",a.privilege_type) from aclexplode(coalesce(datacl,acldefault('d',datdba))) a where not(pg_get_userbyid(a.grantee)='assess_backup' and a.privilege_type='CONNECT' and not a.is_grantable)), 'settingsHash',(select md5(coalesce(jsonb_agg(jsonb_build_array(r.rolname,s.setconfig) order by r.rolname)::text,'[]')) from pg_db_role_setting s left join pg_roles r on r.oid=s.setrole where s.setdatabase=d.oid), 'encoding',pg_encoding_to_char(encoding),'provider',datlocprovider,'locale',coalesce(to_jsonb(d)->>'datlocale',to_jsonb(d)->>'daticulocale'),'collate',datcollate,'ctype',datctype) from pg_database d where datname=current_database())) document from bounded) q;
 if observed is distinct from '{"bounded":true,"constructors":[{"aclReviewed":true,"definition":"77d509dd2f3c00e8440c059440141c6b","owner":"supabase_admin","signature":"lo_creat(integer)"},{"aclReviewed":true,"definition":"21f4575873ae3486e2d2ad20c60bc8e3","owner":"supabase_admin","signature":"lo_create(oid)"},{"aclReviewed":true,"definition":"b8a3c774f9d3935b8ff13c078a01c78c","owner":"supabase_admin","signature":"lo_from_bytea(oid,bytea)"}],"contract":"rad105-backup-inventory/2","database":{"acl":[["postgres","PUBLIC","CONNECT",false],["postgres","anon","TEMPORARY",false],["postgres","assess_authoring_bridge","TEMPORARY",false],["postgres","assess_job_a","TEMPORARY",false],["postgres","assess_job_b","CONNECT",false],["postgres","assess_worker","TEMPORARY",false],["postgres","authenticated","TEMPORARY",false],["postgres","authenticator","TEMPORARY",false],["postgres","dashboard_user","TEMPORARY",false],["postgres","pgbouncer","TEMPORARY",false],["postgres","postgres","CONNECT",false],["postgres","postgres","CREATE",false],["postgres","postgres","TEMPORARY",false],["postgres","service_role","TEMPORARY",false],["postgres","supabase_admin","TEMPORARY",false],["postgres","supabase_auth_admin","TEMPORARY",false],["postgres","supabase_etl_admin","TEMPORARY",false],["postgres","supabase_privileged_role","TEMPORARY",false],["postgres","supabase_read_only_user","TEMPORARY",false],["postgres","supabase_realtime_admin","TEMPORARY",false],["postgres","supabase_replication_admin","TEMPORARY",false],["postgres","supabase_storage_admin","TEMPORARY",false]],"collate":"en_US.UTF-8","ctype":"en_US.UTF-8","encoding":"UTF8","locale":"en-US","owner":"postgres","provider":"i","settingsHash":"d751713988987e9331980363e24189ce"},"extensions":[["pg_stat_statements","1.11",null,"d751713988987e9331980363e24189ce",false],["pgcrypto","1.3",null,"d751713988987e9331980363e24189ce",false],["plpgsql","1.0",null,"d751713988987e9331980363e24189ce",false],["supabase_vault","0.3.1",["vault.secrets"],"d5ca2aa4bfc63f2ca7a6ddf5bea1effb",false],["uuid-ossp","1.1",null,"d751713988987e9331980363e24189ce",false]],"functionsHash":"ecc4a415f433279d1f028a5884f87e69","largeObjects":[],"relations":[{"definition":"ce6183e98f0a823fd50554ea70dbf107","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"account_stops"},{"definition":"aaa511af8de169222eabe3d3da426d1b","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"all_students_assignments"},{"definition":"76738f30660060b13f4bce3106e6c5c9","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assessment_notices"},{"definition":"ee193f05df3ccc3d6194a387a35571d5","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assessment_notify_settings"},{"definition":"30616f2e55537ad9ab2fd2fafd31874c","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assignment_accommodations"},{"definition":"7af5d0e75520bc5c5ebdb2a5364c681f","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assignment_managers"},{"definition":"b97758a307d4f21cc256f0632f0ea25b","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assignment_review_targets"},{"definition":"ec40ae6ce04e4cbe05f0bed649b2a68a","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assignment_reviews"},{"definition":"8a5eede2ee3e6ca8ce6a13254806c778","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assignment_scopes"},{"definition":"4d14de61060e1f082bca8896a3292498","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assignment_windows"},{"definition":"7d9264f77e56dc547695cd18e9da5800","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"assignments"},{"definition":"5a152048ef8820b9225b1551f3ae0eb1","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"authoring_drafts"},{"definition":"e90a63b63d617304b254dc73e5a1b33b","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"authoring_holds_v1"},{"definition":"26f57b00132ea1b728a2d6ac58dc198d","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"authoring_provenance_v2"},{"definition":"d44f4a83dd07299d69d44119f6346b0b","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"authoring_publication_links"},{"definition":"1a0c798439acef689828da7e6df58750","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"authoring_references"},{"definition":"57e9969c04aeef5cbaeed54601997bf9","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"authoring_reviewed_packages"},{"definition":"1665cac4db26b894403560c2254db996","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"authoring_revisions"},{"definition":"e0be0a6ee188ade37fb34a8af8d7e860","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"capacity_reservations_v1"},{"definition":"b8b599e579f0da7e22503fafa107dc00","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"consents"},{"definition":"1825fb133233c32264290b6a84989d75","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"content_candidates_v2"},{"definition":"a5cb86edea88835e38de9cc649bff49e","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"content_submissions"},{"definition":"14e191339ae8c2ef65c5fa288080b319","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"erasure_fk_contract"},{"definition":"ca52e4843fa9c48c110201eaaa9d6c98","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"erasure_rights"},{"definition":"901504843fc2bcc46f525573b18c704c","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"erasure_transfers"},{"definition":"1102606d62dfdc26007c98f96be53011","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"group_join_codes"},{"definition":"07489f2881090ee0d5c708d60f0722d5","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"group_join_requests"},{"definition":"6bbf859a19e48bce7f9b4bef18086097","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"group_managers"},{"definition":"5afd99125e1d5f9d98a4577390f0250c","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"groups"},{"definition":"8a2d875f23752a2e122080ce25f33351","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"join_request_throttles"},{"definition":"71372e190dbf5723f0ec471e1914cc8e","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"launch_gate"},{"definition":"0f87b5cd03ab743c5e5adf3e323c4c46","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"manual_events_v1"},{"definition":"1412254bf77bd919214efd6585d61e6f","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"manual_final_receipts_v1"},{"definition":"2b53009ca3d86f2f783bcf278334e5cf","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"manual_item_scores_v1"},{"definition":"93db93540eb18ec80c6916b17c61e8f8","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"manual_work_v1"},{"definition":"17832a84f2914913e7c079bc3dbad2c7","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"membership_periods"},{"definition":"15f8fcf021f915f53c9af95260a1fea9","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"memberships"},{"definition":"e1ad09cdf48a3d72ecc509a6dff944ba","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"pilot_write_limits"},{"definition":"8829038c49274076e861d3f46e0eb712","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"pilot_write_usage"},{"definition":"4951080975188c0a198609e112c08122","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"pool_fences_v2"},{"definition":"1c9da513e92b3af1380b5f08e66712f7","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"pool_selections_v2"},{"definition":"a8fffa0545beff143fc0c0ac4cc4963a","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"practical_presentations"},{"definition":"417b68926f673c59d14747dd84bbefb1","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"practice_recordings"},{"definition":"c110d39d631b11990279177e01b14470","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"publications"},{"definition":"f08e7c42d9a6d3251b76db968805c4f8","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"receipts"},{"definition":"ba7f393d99c498eaf2440e69bf17603b","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"reservations"},{"definition":"d0615b7c1b2f4862e709af7f9d2268f6","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"restore_epoch"},{"definition":"3be53049a860bfc4126fb7bca6d3c457","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"results"},{"definition":"9dff4183a577d2dfaf609b02fd7e9d80","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"scope_lock"},{"definition":"db4e9624bdfd44ee5dc01c6846c533e7","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"session_details"},{"definition":"cc3dc01b2254653e25827faa8217e08c","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"sessions"},{"definition":"9a58ff9f558dec392a621c1a32cd3fe3","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"sharing_consents"},{"definition":"4c8b0d34b7009d62131c43987eee1419","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"sharing_policy"},{"definition":"e252c8e98b54f8248e18ec51a11c3811","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"stop_active_attempts"},{"definition":"915d25dd63319722318a7be5086db721","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"supervisor_appointments"},{"definition":"36de5a1905bf300d412b74e91604f912","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"targets"},{"definition":"5632e7472dfcb7b99a667c47840b7f45","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"version_managers"},{"definition":"ad7fa77134acaf246a0cce7f7102ecdc","forced":false,"k":"r","owner":"postgres","r":true,"s":"assess","t":"versions"},{"definition":"86d6d74ed881976eb5e4c447f5c86abf","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"audit_log_entries"},{"definition":"3148826626d785f139be00581a91b8fe","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"custom_oauth_providers"},{"definition":"0912ce9a6535a5f77fa354ee27f49c7b","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"flow_state"},{"definition":"d744e5e65f5a49a8c3ae86926da777da","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"identities"},{"definition":"25018aef545f804392f440a4b798e36b","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"instances"},{"definition":"a73139ccc3e3243381e43b013db0491e","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"mfa_amr_claims"},{"definition":"4cf35f6d51e3d939217228117e93c070","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"mfa_challenges"},{"definition":"f83f86107270153e45765a21cb4bc10b","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"mfa_factors"},{"definition":"d3c88054433a68ad3df14dcf08971519","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"mfa_recovery_code_sets"},{"definition":"d0b8b351d20444d048a1d03971cd45ed","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"mfa_recovery_codes"},{"definition":"78b79d87ceb4f7e12afafea67d388dc3","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"oauth_authorizations"},{"definition":"8744fb3f461dfb4ecc791ac7a8ed460d","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"oauth_client_states"},{"definition":"d9b01eb7f6133af00c2ca33173d786e5","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"oauth_clients"},{"definition":"3e28f6eadd293aad8058ef5f438bacf0","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"oauth_consents"},{"definition":"756fa658ab2957a38f7735ee372ed154","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"one_time_tokens"},{"definition":"a4b7ae1c8ee3b65ab458305dc84a4598","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"refresh_tokens"},{"definition":"4fcac3e8cc747970863e440125baf944","forced":false,"k":"S","owner":"supabase_auth_admin","r":false,"s":"auth","t":"refresh_tokens_id_seq"},{"definition":"ad3bb589316cf22cca75226e5706fd40","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"saml_providers"},{"definition":"8147bac1d1cb1bffe9397902fd1db500","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"saml_relay_states"},{"definition":"68e225d5550e1ac3cb942cc1665db1a0","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"schema_migrations"},{"definition":"91142a1322bac79f439ce5319d142b2a","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"scim_tokens"},{"definition":"bba956c7b17b0c5a8353827e2aac2d47","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"scim_users"},{"definition":"55ec142f31a71cb511d9610e186a6230","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"sessions"},{"definition":"2536c5f8058b05ca5c454a6861300524","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"sso_domains"},{"definition":"0a1c5de99ef3a9f8fa05579df2d3a6f4","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"sso_providers"},{"definition":"2f4539d8ad83fd9c290802ea2223146f","forced":false,"k":"r","owner":"supabase_auth_admin","r":true,"s":"auth","t":"users"},{"definition":"466eda851c6c39583c00c9e039d58490","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"webauthn_challenges"},{"definition":"547d7e3ca6e7f89501793310b34889e8","forced":false,"k":"r","owner":"supabase_auth_admin","r":false,"s":"auth","t":"webauthn_credentials"},{"definition":"b1b90e837267fc10e954f61976f51f89","forced":false,"k":"r","owner":"postgres","r":true,"s":"emergency","t":"appointment"},{"definition":"fb04ccba0a4048364cfabb9c14c9026f","forced":false,"k":"r","owner":"postgres","r":true,"s":"emergency","t":"audit"},{"definition":"f93f7a88bbc1e70e1c823e05cbb81ae9","forced":false,"k":"S","owner":"postgres","r":false,"s":"emergency","t":"audit_id_seq"},{"definition":"c85daa18682a3e39f100f687915d1c38","forced":false,"k":"r","owner":"postgres","r":true,"s":"emergency","t":"operations"},{"definition":"775454c68ff5e68382983de65cceef7a","forced":false,"k":"r","owner":"postgres","r":true,"s":"emergency","t":"phases"},{"definition":"780eca08a1c548c63049806fddae0ecb","forced":false,"k":"v","owner":"supabase_admin","r":false,"s":"extensions","t":"pg_stat_statements"},{"definition":"1a7b07bfbd0be1f56701d5418183cee8","forced":false,"k":"v","owner":"supabase_admin","r":false,"s":"extensions","t":"pg_stat_statements_info"},{"definition":"5f9030a0c0481ce93647feb39020ecc9","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"attempts"},{"definition":"897c3cc61723f67afa3cf9f97448376a","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"c2_account_deletions"},{"definition":"f8a9728d4fe43d8db0f2cf5c6dc7b4d0","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"c2_survey_responses"},{"definition":"5fa74b7428ba38c78c26115591c5cb2e","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"c2_survey_rounds"},{"definition":"f0a31c116227a49401affd401fba11c3","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"c2_survey_settings"},{"definition":"6df0b81d00390abd5538fd4a1ff68b39","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"c2_survey_versions"},{"definition":"9d9ebcbd494af2a93785b9fea405ddf4","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"events"},{"definition":"ceb42003b094a9f9cbfe012abdedc83f","forced":false,"k":"S","owner":"postgres","r":false,"s":"public","t":"events_id_seq"},{"definition":"c443da1a59eac771aae58c23c8c45270","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"feedback"},{"definition":"ceb42003b094a9f9cbfe012abdedc83f","forced":false,"k":"S","owner":"postgres","r":false,"s":"public","t":"feedback_id_seq"},{"definition":"061577bdf1c497ee4095e53b9df00eb7","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"pilot_locales"},{"definition":"df031c147541460984b9f0189324b39d","forced":false,"k":"r","owner":"postgres","r":true,"s":"public","t":"profiles"},{"definition":"38446e987622bc5ce14466b3d55e3f37","forced":false,"k":"p","owner":"supabase_realtime_admin","r":true,"s":"realtime","t":"messages"},{"definition":"bdb82a76d9a0dba0d36c017bee659992","forced":false,"k":"r","owner":"supabase_admin","r":false,"s":"realtime","t":"schema_migrations"},{"definition":"f249fae25f8f03ad8ccf8bd08189978e","forced":false,"k":"r","owner":"supabase_realtime_admin","r":false,"s":"realtime","t":"subscription"},{"definition":"72917d6e20b6bef0a0a3f9af60efbdf7","forced":false,"k":"S","owner":"supabase_realtime_admin","r":false,"s":"realtime","t":"subscription_id_seq"},{"definition":"8677267f52ef447b4e1383975b55fc24","forced":false,"k":"r","owner":"supabase_storage_admin","r":true,"s":"storage","t":"buckets"},{"definition":"38af6a5fd28fbdf9a73634da2b1d3e9e","forced":false,"k":"r","owner":"supabase_storage_admin","r":true,"s":"storage","t":"buckets_analytics"},{"definition":"91be7300205b4e3e01ffc60259e7db4e","forced":false,"k":"r","owner":"supabase_storage_admin","r":true,"s":"storage","t":"buckets_vectors"},{"definition":"76423f3646250cc57303067cc3b70b24","forced":false,"k":"r","owner":"supabase_storage_admin","r":true,"s":"storage","t":"migrations"},{"definition":"d0ca178fb548f100d507a0ced387cad2","forced":false,"k":"r","owner":"supabase_storage_admin","r":true,"s":"storage","t":"objects"},{"definition":"0748d0d31a5e05db69299642c30737e4","forced":false,"k":"r","owner":"supabase_storage_admin","r":true,"s":"storage","t":"s3_multipart_uploads"},{"definition":"d3e06a09bb519578066f917f8366505b","forced":false,"k":"r","owner":"supabase_storage_admin","r":true,"s":"storage","t":"s3_multipart_uploads_parts"},{"definition":"ee5d60970c64cf6110fc97d2097d9bba","forced":false,"k":"r","owner":"supabase_storage_admin","r":true,"s":"storage","t":"vector_indexes"},{"definition":"3d6426e99d157b0fc49fd50bb64d2d97","forced":false,"k":"v","owner":"supabase_admin","r":false,"s":"vault","t":"decrypted_secrets"},{"definition":"9119ad56fe0e345908c210c7f8d131b9","forced":false,"k":"r","owner":"supabase_admin","r":false,"s":"vault","t":"secrets"}],"roleNames":["anon","assess_authoring_bridge","assess_grading_worker","assess_job_a","assess_job_b","assess_worker","authenticated","authenticator","dashboard_user","pg_checkpoint","pg_create_subscription","pg_database_owner","pg_execute_server_program","pg_maintain","pg_monitor","pg_read_all_data","pg_read_all_settings","pg_read_all_stats","pg_read_server_files","pg_signal_backend","pg_stat_scan_tables","pg_use_reserved_connections","pg_write_all_data","pg_write_server_files","pgbouncer","postgres","service_role","supabase_admin","supabase_auth_admin","supabase_etl_admin","supabase_privileged_role","supabase_read_only_user","supabase_realtime_admin","supabase_replication_admin","supabase_storage_admin"],"schemas":[["assess","postgres",[["postgres","assess_authoring_bridge","USAGE",false],["postgres","assess_grading_worker","USAGE",false],["postgres","assess_worker","USAGE",false],["postgres","authenticated","USAGE",false],["postgres","postgres","CREATE",false],["postgres","postgres","USAGE",false]]],["auth","supabase_admin",[["supabase_admin","anon","USAGE",false],["supabase_admin","authenticated","USAGE",false],["supabase_admin","dashboard_user","CREATE",false],["supabase_admin","dashboard_user","USAGE",false],["supabase_admin","postgres","USAGE",false],["supabase_admin","service_role","USAGE",false],["supabase_admin","supabase_admin","CREATE",false],["supabase_admin","supabase_admin","USAGE",false],["supabase_admin","supabase_auth_admin","CREATE",false],["supabase_admin","supabase_auth_admin","USAGE",false]]],["emergency","postgres",[["postgres","postgres","CREATE",false],["postgres","postgres","USAGE",false]]],["extensions","postgres",[["postgres","anon","USAGE",false],["postgres","authenticated","USAGE",false],["postgres","dashboard_user","CREATE",false],["postgres","dashboard_user","USAGE",false],["postgres","postgres","CREATE",false],["postgres","postgres","USAGE",false],["postgres","service_role","USAGE",false]]],["graphql","supabase_admin",[["supabase_admin","supabase_admin","CREATE",false],["supabase_admin","supabase_admin","USAGE",false]]],["graphql_public","supabase_admin",[["supabase_admin","supabase_admin","CREATE",false],["supabase_admin","supabase_admin","USAGE",false]]],["pgbouncer","pgbouncer",[["pgbouncer","pgbouncer","CREATE",false],["pgbouncer","pgbouncer","USAGE",false]]],["public","pg_database_owner",[["pg_database_owner","PUBLIC","USAGE",false],["pg_database_owner","anon","USAGE",false],["pg_database_owner","authenticated","USAGE",false],["pg_database_owner","pg_database_owner","CREATE",false],["pg_database_owner","pg_database_owner","USAGE",false],["pg_database_owner","postgres","USAGE",false],["pg_database_owner","service_role","USAGE",false]]],["realtime","supabase_admin",[["supabase_admin","anon","USAGE",false],["supabase_admin","authenticated","USAGE",false],["supabase_admin","postgres","USAGE",true],["supabase_admin","service_role","USAGE",false],["supabase_admin","supabase_admin","CREATE",false],["supabase_admin","supabase_admin","USAGE",false],["supabase_admin","supabase_realtime_admin","CREATE",false],["supabase_admin","supabase_realtime_admin","USAGE",false]]],["storage","supabase_admin",[["supabase_admin","anon","USAGE",false],["supabase_admin","authenticated","USAGE",false],["supabase_admin","dashboard_user","CREATE",false],["supabase_admin","dashboard_user","USAGE",false],["supabase_admin","postgres","USAGE",true],["supabase_admin","service_role","USAGE",false],["supabase_admin","supabase_admin","CREATE",false],["supabase_admin","supabase_admin","USAGE",false],["supabase_admin","supabase_storage_admin","CREATE",true],["supabase_admin","supabase_storage_admin","USAGE",true]]],["vault","supabase_admin",[["supabase_admin","postgres","USAGE",true],["supabase_admin","service_role","USAGE",false],["supabase_admin","supabase_admin","CREATE",false],["supabase_admin","supabase_admin","USAGE",false]]]],"serverVersion":170011}'::jsonb then raise exception 'backup inventory drift; no grant';end if;
 if current_setting('radlab.backup_apply',true) is distinct from 'reviewed-select-only' then raise notice 'DRY RUN: pinned inventory matched; no grants or policies';return;end if;
 if not (select count(*)=1 and bool_and(not enabled) from assess.launch_gate) then raise exception 'backup setup requires CLOSED';end if;
 if exists(select 1 from pg_stat_activity where usename='assess_backup') then raise exception 'backup connections present';end if;
 if not exists(select 1 from pg_roles where rolname='assess_backup') then create role assess_backup nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls valid until '-infinity';end if;
 if exists(select 1 from pg_roles where rolname='assess_backup' and (rolcanlogin or rolinherit or rolsuper or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls)) or exists(select 1 from pg_auth_members where member='assess_backup'::regrole or roleid='assess_backup'::regrole) then raise exception 'backup role attributes/membership drift';end if;
 if exists(select 1 from pg_policy where not polpermissive and polcmd in ('r','*') and polroles&&array[0::oid,'assess_backup'::regrole::oid]) then raise exception 'restrictive backup read policy';end if;
 end $guard$;
do $apply$ begin if current_setting('radlab.backup_apply',true) is distinct from 'reviewed-select-only' then return;end if;
do $authority$ begin if exists(select 1 from pg_proc p where p.oid in ('pg_catalog.lo_create(oid)'::regprocedure,'pg_catalog.lo_creat(integer)'::regprocedure,'pg_catalog.lo_from_bytea(oid,bytea)'::regprocedure) and not pg_has_role(current_user,p.proowner,'USAGE')) then raise exception 'constructor ownership unavailable';end if;end $authority$;
grant execute on function pg_catalog.lo_create(oid) to "anon","assess_authoring_bridge","assess_grading_worker","assess_job_a","assess_job_b","assess_worker","authenticated","authenticator","dashboard_user","pg_checkpoint","pg_create_subscription","pg_database_owner","pg_execute_server_program","pg_maintain","pg_monitor","pg_read_all_data","pg_read_all_settings","pg_read_all_stats","pg_read_server_files","pg_signal_backend","pg_stat_scan_tables","pg_use_reserved_connections","pg_write_all_data","pg_write_server_files","pgbouncer","postgres","service_role","supabase_admin","supabase_auth_admin","supabase_etl_admin","supabase_privileged_role","supabase_read_only_user","supabase_realtime_admin","supabase_replication_admin","supabase_storage_admin";
revoke execute on function pg_catalog.lo_create(oid) from public;
grant execute on function pg_catalog.lo_creat(integer) to "anon","assess_authoring_bridge","assess_grading_worker","assess_job_a","assess_job_b","assess_worker","authenticated","authenticator","dashboard_user","pg_checkpoint","pg_create_subscription","pg_database_owner","pg_execute_server_program","pg_maintain","pg_monitor","pg_read_all_data","pg_read_all_settings","pg_read_all_stats","pg_read_server_files","pg_signal_backend","pg_stat_scan_tables","pg_use_reserved_connections","pg_write_all_data","pg_write_server_files","pgbouncer","postgres","service_role","supabase_admin","supabase_auth_admin","supabase_etl_admin","supabase_privileged_role","supabase_read_only_user","supabase_realtime_admin","supabase_replication_admin","supabase_storage_admin";
revoke execute on function pg_catalog.lo_creat(integer) from public;
grant execute on function pg_catalog.lo_from_bytea(oid,bytea) to "anon","assess_authoring_bridge","assess_grading_worker","assess_job_a","assess_job_b","assess_worker","authenticated","authenticator","dashboard_user","pg_checkpoint","pg_create_subscription","pg_database_owner","pg_execute_server_program","pg_maintain","pg_monitor","pg_read_all_data","pg_read_all_settings","pg_read_all_stats","pg_read_server_files","pg_signal_backend","pg_stat_scan_tables","pg_use_reserved_connections","pg_write_all_data","pg_write_server_files","pgbouncer","postgres","service_role","supabase_admin","supabase_auth_admin","supabase_etl_admin","supabase_privileged_role","supabase_read_only_user","supabase_realtime_admin","supabase_replication_admin","supabase_storage_admin";
revoke execute on function pg_catalog.lo_from_bytea(oid,bytea) from public;
grant usage on schema "assess" to assess_backup;
grant usage on schema "auth" to assess_backup;
grant usage on schema "emergency" to assess_backup;
grant usage on schema "public" to assess_backup;
grant usage on schema "realtime" to assess_backup;
grant usage on schema "storage" to assess_backup;
grant usage on schema "vault" to assess_backup;
grant connect on database "postgres" to assess_backup;
grant select on table "assess"."account_stops" to assess_backup;
grant select on table "assess"."all_students_assignments" to assess_backup;
grant select on table "assess"."assessment_notices" to assess_backup;
grant select on table "assess"."assessment_notify_settings" to assess_backup;
grant select on table "assess"."assignment_accommodations" to assess_backup;
grant select on table "assess"."assignment_managers" to assess_backup;
grant select on table "assess"."assignment_review_targets" to assess_backup;
grant select on table "assess"."assignment_reviews" to assess_backup;
grant select on table "assess"."assignment_scopes" to assess_backup;
grant select on table "assess"."assignment_windows" to assess_backup;
grant select on table "assess"."assignments" to assess_backup;
grant select on table "assess"."authoring_drafts" to assess_backup;
grant select on table "assess"."authoring_holds_v1" to assess_backup;
grant select on table "assess"."authoring_provenance_v2" to assess_backup;
grant select on table "assess"."authoring_publication_links" to assess_backup;
grant select on table "assess"."authoring_references" to assess_backup;
grant select on table "assess"."authoring_reviewed_packages" to assess_backup;
grant select on table "assess"."authoring_revisions" to assess_backup;
grant select on table "assess"."capacity_reservations_v1" to assess_backup;
grant select on table "assess"."consents" to assess_backup;
grant select on table "assess"."content_candidates_v2" to assess_backup;
grant select on table "assess"."content_submissions" to assess_backup;
grant select on table "assess"."erasure_fk_contract" to assess_backup;
grant select on table "assess"."erasure_rights" to assess_backup;
grant select on table "assess"."erasure_transfers" to assess_backup;
grant select on table "assess"."group_join_codes" to assess_backup;
grant select on table "assess"."group_join_requests" to assess_backup;
grant select on table "assess"."group_managers" to assess_backup;
grant select on table "assess"."groups" to assess_backup;
grant select on table "assess"."join_request_throttles" to assess_backup;
grant select on table "assess"."launch_gate" to assess_backup;
grant select on table "assess"."manual_events_v1" to assess_backup;
grant select on table "assess"."manual_final_receipts_v1" to assess_backup;
grant select on table "assess"."manual_item_scores_v1" to assess_backup;
grant select on table "assess"."manual_work_v1" to assess_backup;
grant select on table "assess"."membership_periods" to assess_backup;
grant select on table "assess"."memberships" to assess_backup;
grant select on table "assess"."pilot_write_limits" to assess_backup;
grant select on table "assess"."pilot_write_usage" to assess_backup;
grant select on table "assess"."pool_fences_v2" to assess_backup;
grant select on table "assess"."pool_selections_v2" to assess_backup;
grant select on table "assess"."practical_presentations" to assess_backup;
grant select on table "assess"."practice_recordings" to assess_backup;
grant select on table "assess"."publications" to assess_backup;
grant select on table "assess"."receipts" to assess_backup;
grant select on table "assess"."reservations" to assess_backup;
grant select on table "assess"."restore_epoch" to assess_backup;
grant select on table "assess"."results" to assess_backup;
grant select on table "assess"."scope_lock" to assess_backup;
grant select on table "assess"."session_details" to assess_backup;
grant select on table "assess"."sessions" to assess_backup;
grant select on table "assess"."sharing_consents" to assess_backup;
grant select on table "assess"."sharing_policy" to assess_backup;
grant select on table "assess"."stop_active_attempts" to assess_backup;
grant select on table "assess"."supervisor_appointments" to assess_backup;
grant select on table "assess"."targets" to assess_backup;
grant select on table "assess"."version_managers" to assess_backup;
grant select on table "assess"."versions" to assess_backup;
grant select on table "auth"."audit_log_entries" to assess_backup;
grant select on table "auth"."custom_oauth_providers" to assess_backup;
grant select on table "auth"."flow_state" to assess_backup;
grant select on table "auth"."identities" to assess_backup;
grant select on table "auth"."instances" to assess_backup;
grant select on table "auth"."mfa_amr_claims" to assess_backup;
grant select on table "auth"."mfa_challenges" to assess_backup;
grant select on table "auth"."mfa_factors" to assess_backup;
grant select on table "auth"."mfa_recovery_code_sets" to assess_backup;
grant select on table "auth"."mfa_recovery_codes" to assess_backup;
grant select on table "auth"."oauth_authorizations" to assess_backup;
grant select on table "auth"."oauth_client_states" to assess_backup;
grant select on table "auth"."oauth_clients" to assess_backup;
grant select on table "auth"."oauth_consents" to assess_backup;
grant select on table "auth"."one_time_tokens" to assess_backup;
grant select on table "auth"."refresh_tokens" to assess_backup;
grant select on sequence "auth"."refresh_tokens_id_seq" to assess_backup;
grant select on table "auth"."saml_providers" to assess_backup;
grant select on table "auth"."saml_relay_states" to assess_backup;
grant select on table "auth"."schema_migrations" to assess_backup;
grant select on table "auth"."scim_tokens" to assess_backup;
grant select on table "auth"."scim_users" to assess_backup;
grant select on table "auth"."sessions" to assess_backup;
grant select on table "auth"."sso_domains" to assess_backup;
grant select on table "auth"."sso_providers" to assess_backup;
grant select on table "auth"."users" to assess_backup;
grant select on table "auth"."webauthn_challenges" to assess_backup;
grant select on table "auth"."webauthn_credentials" to assess_backup;
grant select on table "emergency"."appointment" to assess_backup;
grant select on table "emergency"."audit" to assess_backup;
grant select on sequence "emergency"."audit_id_seq" to assess_backup;
grant select on table "emergency"."operations" to assess_backup;
grant select on table "emergency"."phases" to assess_backup;
grant select on table "public"."attempts" to assess_backup;
grant select on table "public"."c2_account_deletions" to assess_backup;
grant select on table "public"."c2_survey_responses" to assess_backup;
grant select on table "public"."c2_survey_rounds" to assess_backup;
grant select on table "public"."c2_survey_settings" to assess_backup;
grant select on table "public"."c2_survey_versions" to assess_backup;
grant select on table "public"."events" to assess_backup;
grant select on sequence "public"."events_id_seq" to assess_backup;
grant select on table "public"."feedback" to assess_backup;
grant select on sequence "public"."feedback_id_seq" to assess_backup;
grant select on table "public"."pilot_locales" to assess_backup;
grant select on table "public"."profiles" to assess_backup;
grant select on table "realtime"."messages" to assess_backup;
grant select on table "realtime"."schema_migrations" to assess_backup;
grant select on table "realtime"."subscription" to assess_backup;
grant select on sequence "realtime"."subscription_id_seq" to assess_backup;
grant select on table "storage"."buckets" to assess_backup;
grant select on table "storage"."buckets_analytics" to assess_backup;
grant select on table "storage"."buckets_vectors" to assess_backup;
grant select on table "storage"."migrations" to assess_backup;
grant select on table "storage"."objects" to assess_backup;
grant select on table "storage"."s3_multipart_uploads" to assess_backup;
grant select on table "storage"."s3_multipart_uploads_parts" to assess_backup;
grant select on table "storage"."vector_indexes" to assess_backup;
grant select on table "vault"."secrets" to assess_backup;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."account_stops"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."account_stops"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."account_stops" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."all_students_assignments"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."all_students_assignments"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."all_students_assignments" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assessment_notices"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assessment_notices"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assessment_notices" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assessment_notify_settings"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assessment_notify_settings"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assessment_notify_settings" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assignment_accommodations"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assignment_accommodations"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assignment_accommodations" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assignment_managers"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assignment_managers"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assignment_managers" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assignment_review_targets"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assignment_review_targets"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assignment_review_targets" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assignment_reviews"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assignment_reviews"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assignment_reviews" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assignment_scopes"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assignment_scopes"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assignment_scopes" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assignment_windows"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assignment_windows"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assignment_windows" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."assignments"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."assignments"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."assignments" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."authoring_drafts"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."authoring_drafts"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."authoring_drafts" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."authoring_holds_v1"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."authoring_holds_v1"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."authoring_holds_v1" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."authoring_provenance_v2"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."authoring_provenance_v2"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."authoring_provenance_v2" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."authoring_publication_links"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."authoring_publication_links"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."authoring_publication_links" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."authoring_references"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."authoring_references"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."authoring_references" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."authoring_reviewed_packages"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."authoring_reviewed_packages"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."authoring_reviewed_packages" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."authoring_revisions"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."authoring_revisions"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."authoring_revisions" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."capacity_reservations_v1"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."capacity_reservations_v1"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."capacity_reservations_v1" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."consents"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."consents"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."consents" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."content_candidates_v2"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."content_candidates_v2"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."content_candidates_v2" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."content_submissions"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."content_submissions"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."content_submissions" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."erasure_fk_contract"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."erasure_fk_contract"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."erasure_fk_contract" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."erasure_rights"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."erasure_rights"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."erasure_rights" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."erasure_transfers"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."erasure_transfers"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."erasure_transfers" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."group_join_codes"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."group_join_codes"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."group_join_codes" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."group_join_requests"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."group_join_requests"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."group_join_requests" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."group_managers"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."group_managers"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."group_managers" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."groups"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."groups"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."groups" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."join_request_throttles"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."join_request_throttles"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."join_request_throttles" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."launch_gate"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."launch_gate"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."launch_gate" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."manual_events_v1"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."manual_events_v1"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."manual_events_v1" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."manual_final_receipts_v1"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."manual_final_receipts_v1"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."manual_final_receipts_v1" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."manual_item_scores_v1"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."manual_item_scores_v1"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."manual_item_scores_v1" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."manual_work_v1"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."manual_work_v1"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."manual_work_v1" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."membership_periods"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."membership_periods"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."membership_periods" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."memberships"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."memberships"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."memberships" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."pilot_write_limits"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."pilot_write_limits"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."pilot_write_limits" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."pilot_write_usage"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."pilot_write_usage"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."pilot_write_usage" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."pool_fences_v2"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."pool_fences_v2"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."pool_fences_v2" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."pool_selections_v2"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."pool_selections_v2"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."pool_selections_v2" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."practical_presentations"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."practical_presentations"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."practical_presentations" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."practice_recordings"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."practice_recordings"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."practice_recordings" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."publications"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."publications"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."publications" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."receipts"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."receipts"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."receipts" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."reservations"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."reservations"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."reservations" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."restore_epoch"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."restore_epoch"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."restore_epoch" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."results"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."results"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."results" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."scope_lock"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."scope_lock"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."scope_lock" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."session_details"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."session_details"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."session_details" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."sessions"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."sessions"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."sessions" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."sharing_consents"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."sharing_consents"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."sharing_consents" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."sharing_policy"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."sharing_policy"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."sharing_policy" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."stop_active_attempts"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."stop_active_attempts"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."stop_active_attempts" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."supervisor_appointments"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."supervisor_appointments"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."supervisor_appointments" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."targets"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."targets"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."targets" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."version_managers"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."version_managers"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."version_managers" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"assess"."versions"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"assess"."versions"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "assess"."versions" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."audit_log_entries"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."audit_log_entries"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."audit_log_entries" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."flow_state"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."flow_state"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."flow_state" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."identities"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."identities"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."identities" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."instances"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."instances"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."instances" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."mfa_amr_claims"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."mfa_amr_claims"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."mfa_amr_claims" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."mfa_challenges"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."mfa_challenges"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."mfa_challenges" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."mfa_factors"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."mfa_factors"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."mfa_factors" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."one_time_tokens"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."one_time_tokens"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."one_time_tokens" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."refresh_tokens"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."refresh_tokens"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."refresh_tokens" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."saml_providers"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."saml_providers"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."saml_providers" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."saml_relay_states"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."saml_relay_states"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."saml_relay_states" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."schema_migrations"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."schema_migrations"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."schema_migrations" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."sessions"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."sessions"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."sessions" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."sso_domains"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."sso_domains"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."sso_domains" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."sso_providers"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."sso_providers"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."sso_providers" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"auth"."users"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"auth"."users"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "auth"."users" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"emergency"."appointment"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"emergency"."appointment"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "emergency"."appointment" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"emergency"."audit"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"emergency"."audit"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "emergency"."audit" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"emergency"."operations"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"emergency"."operations"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "emergency"."operations" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"emergency"."phases"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"emergency"."phases"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "emergency"."phases" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."attempts"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."attempts"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."attempts" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."c2_account_deletions"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."c2_account_deletions"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."c2_account_deletions" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."c2_survey_responses"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."c2_survey_responses"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."c2_survey_responses" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."c2_survey_rounds"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."c2_survey_rounds"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."c2_survey_rounds" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."c2_survey_settings"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."c2_survey_settings"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."c2_survey_settings" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."c2_survey_versions"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."c2_survey_versions"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."c2_survey_versions" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."events"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."events"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."events" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."feedback"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."feedback"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."feedback" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."pilot_locales"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."pilot_locales"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."pilot_locales" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"public"."profiles"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"public"."profiles"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "public"."profiles" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"realtime"."messages"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"realtime"."messages"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "realtime"."messages" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"storage"."buckets"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"storage"."buckets"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "storage"."buckets" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"storage"."buckets_analytics"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"storage"."buckets_analytics"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "storage"."buckets_analytics" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"storage"."buckets_vectors"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"storage"."buckets_vectors"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "storage"."buckets_vectors" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"storage"."migrations"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"storage"."migrations"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "storage"."migrations" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"storage"."objects"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"storage"."objects"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "storage"."objects" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"storage"."s3_multipart_uploads"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"storage"."s3_multipart_uploads"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "storage"."s3_multipart_uploads" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"storage"."s3_multipart_uploads_parts"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"storage"."s3_multipart_uploads_parts"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "storage"."s3_multipart_uploads_parts" for select to assess_backup using(true);end if;end $policy$;
do $policy$ begin
 if exists(select 1 from pg_policy where polrelid='"storage"."vector_indexes"'::regclass and polname='assess_backup_read_v1') then
  if not exists(select 1 from pg_policy where polrelid='"storage"."vector_indexes"'::regclass and polname='assess_backup_read_v1' and polcmd='r' and polpermissive and polroles=array['assess_backup'::regrole::oid] and pg_get_expr(polqual,polrelid)='true' and polwithcheck is null) then raise exception 'backup policy drift';end if;
 else create policy assess_backup_read_v1 on "storage"."vector_indexes" for select to assess_backup using(true);end if;end $policy$;
if (select
 exists(select 1 from unnest(array['pg_catalog.lo_create(oid)','pg_catalog.lo_creat(integer)','pg_catalog.lo_from_bytea(oid,bytea)']) f where has_function_privilege('assess_backup',f,'EXECUTE')) or
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
 exists(select 1 from pg_class c cross join lateral aclexplode(c.relacl) a where a.grantee='assess_backup'::regrole and a.is_grantable) or exists(select 1 from pg_class where relowner='assess_backup'::regrole) or exists(select 1 from pg_proc where proowner='assess_backup'::regrole) or exists(select 1 from pg_namespace where nspowner='assess_backup'::regrole) or exists(select 1 from pg_database where datdba='assess_backup'::regrole) bad) then raise exception 'backup privileges unsafe; transaction rolled back';end if;
end $apply$;
commit;
