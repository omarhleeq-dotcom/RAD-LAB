-- MANUAL RETENTION-ONLY INSTALL. Original project vlacestfruxooznrcjqc: verify SQL Editor selector.
-- Owner explicitly chose original DB WITHOUT a current backup on 2026-10-20;
-- requested one whole-system backup AFTER the work. No backup/restore/provider proof is implied.
-- Run WHOLE file ONCE as sole operator. Do not select fragments or replay B/C/D/E/F.
-- No learner seeds, consent backfill, job execution, runtime/worker/schedule or gate/attestation changes.
-- Any error before COMMIT aborts this transaction. This is not recovery after COMMIT.
-- Retain the final boolean row only; on error STOP and report code/message without private data.
begin;
set local search_path='';
set local lock_timeout='5s';
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtextextended('radlab-assess-retention-install/1',0));
-- Prevent concurrent privileged schema/data writers to affected tables during baseline/upgrade.
-- Lock timeout is a stop, never a reason to raise the timeout or bypass the guard.
lock table assess.assignments,assess.consents,assess.sessions,assess.launch_gate in access exclusive mode;
-- In write guards only, transaction_read_only is reported but excluded from catalogue_ready.
-- All schema/source/ACL/gate/absence conditions are identical to the read-only baseline.
do $precondition$
declare allowed boolean;
begin
 select baseline_matches into allowed from (
with catalogue as (with expected_tables(name) as (values
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
  union all select 'assess.consents' where to_regclass('assess.consents') is not null
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
  union all select signature,audience from (values
    ('assess.consent_v1(text)','user'),
    ('assess.history_page_v1(uuid,integer)','user'),
    ('assess.require_consent_v1()','internal')
  ) f(signature,audience) where to_regclass('assess.consents') is not null
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
  tables_present and rls_enabled and roles_present and functions_present and schema_privileges and definer_and_empty_search_path
  and no_direct_table_privileges and execute_matrix and no_public_execute and roles_not_privileged
  and worker_nonlogin_noinherit and users_not_worker_members and no_direct_table_policies
  and no_unreviewed_relations and no_unreviewed_functions as catalogue_ready,
  false as runtime_or_launch_verified
from checks),bodies as (with expected_bodies(name,digest,crlf_digest) as (values
 ('group_write_v1','1cf0ef392a79a99f728da8903814ddcfc9c0910e89dc51d9dc1e5f6ad4553ae8','43f2ae773ec8efaf2d6f3e2e93203f8d7d870b54583a860e99835496d40f0c21'),
 ('members_write_v1','1789ac46865b450360fb8d1644e5596691fa3bc85c04f59fa61b1e5b3ca41060','55d88b4b7817c4356408d2a55e9e805179fba211468dbfd216a3bfbe2cb29591'),
 ('assign_v1','c3886247c8b61f601f7ae869d07465cfae800fb7821736a86e1e1235f50ee1e4','74c481837cdb6ae6e7d67f7f6ec1eb879ea1d8f118cc12be0ecb9056613a7617'),
 ('targets_write_v1','f2b7aa109447ffc5237bcd2312d4566b7a7f71b3cb6c072be1b4c3ab03178f53','d20262e01a6f81744d45e133221b40a10f653d46e4a60b307c7701ece55837c4'),
 ('owner_page_v1','fe4eee7cc88111fe1a68b63a36a0b74e618f34d64d5857ff1a5bc0cde29d3e7f','5203ed66c2cc90b1d48d5a1cda2cb4f2ead2c286818c7a9637d6996700752ff9'),
 ('assigned_version_v1','a659c221ff9184f0c1defae7bc4157f4bc205e3a501d2e6ade4dfbe18df1c3bb','ded902985e103acfe3f2c3aa875052adddd552c9582483b76f401f650d4b8253'),
 ('install_publication_v1','6c198420efc157a0f0b2605d9618e7b2941aaadae707c74968df16395e3521e9','c4f318ecef61705f16155a976820b3fbc7db9325fd67a009c872abfcf3dd5443'),
 ('session_authorize_v1','f4475e949d292ae610595d820d46f457c549987780cfe2025ab31abd2a014db6','17c353a1b053bb2f2b7f7cef831bd27ff3d1a69eb7e0f8bbde1337e1c7d3941f'),
 ('session_ack_v1','24a26227091099c3fb8c0fbdfd478bb0ca4c18cd0d21375eb1a21d8897c66187','1f5ad7536ffb06ccb62aff9b136e37d1c2f70a1a5f07f3420eaf1dcf2b099bd8'),
 ('start_v1','8ae44106cba45c9f380988004c7041277c92fca9962376e64263f9280107e324','329f6ed9e8a3ab8810e3ef8522a79c695eb3b5a3124b5fd18d2caa4da6567ba2'),
 ('read_session_v1','cfaa04b87af01609fd4cbe83ef1cabcd34aab39c6f409894035c0303bd902546','19094a897ec987874dc81875ddbdd053e66e98d3e1dfdbcd6effb1e49dcfd612'),
 ('validate_answer_v1','443ef959d33e6eb3da6498aff60cc0cf385cc172d811b6f2bc03ae6c4fd9019d','7ac0f1c2053ba7df97d296f2cd6ad24876c774a7a3a08fd6e3742d98578c5a7b'),
 ('command_v1','b8d969b9e7dda62fae77150f445e77756e6332cf1c1df382605a127377d6fdf6','34fcc73719583e90c494389c73115e11cc9247e44f591083bcc9eeadf16facb6'),
 ('result_v1','0826d17d24bf374dfc1cc3b2ba9f7d05a5b671a70f61638792750fbb4ed5d803','b6aaeeca530b8c930949fb13282c6ceaa8174b74f1517ad782be469c76af0583'),
 ('maintain_v1','94e65490a4e91fd1241823f83ff4a16e0f6b0e01170c8117af88e6f2e0e8c1c0','17f5edde05ae639d94e8ba563875ebeddafc046dd59821a7ad30e47da65c73d6'),
 ('claim_v1','649a0e9a990c85b4d7e8dff0cfe57bc4e5a0b4292f1f8539f05a4bf5a1fa73a3','dd15b25b24edf2241c482963e85bf69e7195447d5f2fc72b5bd0107ce816547e'),
 ('finish_v1','cf69d6824d61dec9ad4b1d0e9187a113a248188f4dcf32ec1e260c950e989c8b','61d7f09dd4afd302a1dac2bbed996629e64cd9b5197d3f676e12014b263bfa2d'),
 ('fail_v1','812fd82f88340a71d13f1742dc9b17c2bdc2cafff239c547de4c9efd924da585','4c22c8b7aee828faac9bbc3db7ec5c20cc60044cb790fd1cd6c80c9f7c46ed83'),
 ('recover_v1','a1b8827868f3bedddfc924ed55102d3fd07bf186fc981b267b129863ff4d01f0','6de033d89a8a055ac099af385cd4c9183dd894e6ab656b335784a48531b4ee95'),
 ('health_v1','e8625fca0d23bc66fcd9ee43a94ea40daaadff3d4d718ee3c564f38ab57590f1','9ecb1bca9212a18bb331352312716a7c7e2048ce94c5ad63adc4ee73f8dd655b'),
 ('content_submit_v1','0bddc286f600170ef321cb722ed3f06d635046d24b9e4134ffb648f3aa9352de','5e044260494de586c21996f8c322b20646c2d90eca426c0ac7b388b917fe7e67'),
 ('content_page_v1','d0d1a4f6eea23527c84aa1da5c43bad1721120b048aa7090895bfdef6506b014','12d0902398f6784c1e9df48b4831650a49359e05f582ece16d223aabf556da03'),
 ('content_read_v1','7694935ebab7924049d1adb84d443b300224b8db322f0415cbe5cf2cb3524a26','39229a319515337fad0078cb332cd8dc657a95c3b68b880a1453b82b0cd56be8'),
 ('content_install_v1','1454d2b2d3d6ed8357fda011ad27685191924eeaea1067dbf01d7643db4f53cb','9b6fcc3ff252502f10406b948b17917e906c7fe4316eb760be0a162ca2338fe5'),
 ('assigned_page_v1','29b69f7e8f96f540d22cb4ab2584f9912a3277fc7dc7d5dea841993c115d0f05','9d2909556f0e627a8038e768cb27677ff38c07b105cee2e302fc3c62d36e8e84'),
 ('read_mixed_session_v1','0841acf0ad8679e7bdc2cb8020101de27b4b603da256016844e149c7ad35c246','b8c8a3b81118eccd893a164eea7870380be683a7122139ef65acfca88aef364e'),
 ('content_install_practical_v1','2957e1de08e7e036e1ccab1d0c101158902d44088a7481925615de3bbf036c66','89883ea033bd04a88978b6df7f7343bfb9f9b43a27e1c36e01b832c5a8199b04'),
 ('assigned_practical_page_v1','d3fc72d1a450c1611fe0928dc72d83c3efbc75ab94e1ecd2414c9c2c6d6051f6','04a9210b6b1b7166212a4e6746ce8ac8dbca6e7b4994b76d8db560516a77f424'),
 ('read_practical_session_v1','02a5d026d71bb186f269c76fff55d8b7cf21ed504e152580d999d50cfe5ade6b','03ccfc076b927fa2848148822ecd4a6133c24ce7193f0dac43a9da0e931a2b5a'),
 ('consent_v1','a9bca69b341b1770a8f49252260c7c22892ee7ea03353976b7dbf845800491a6','6eeed75d891b6130f6ff81e5189805e9d35201c0c8ef1e408e611615138da9ae'),
 ('require_consent_v1','482b0edd589c4092d2b0a26e053e296372cedfc47f29366e7910079414cd5745','587f766d841e719888bbf2d53e7eab9c1a34f602bc452d7d6e2deb658805a3ba'),
 ('history_page_v1','0bd639f7c93130a5ed1702f3e24f926fe02e4dba6bde476a4691eea78599e24a','0be6904667e36da520b28920d746227eaf92a6168e60b69a0b25db4cca9ba555')
) select not exists(select 1 from expected_bodies e left join pg_proc p on p.pronamespace=to_regnamespace('assess') and p.proname=e.name where coalesce(encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') in (e.digest,e.crlf_digest),false)=false) as source_bodies_match),shape as (select (select coalesce(jsonb_object_agg(n.nspname||'.'||c.relname,jsonb_build_object(
 'columns',(select coalesce(jsonb_agg(jsonb_build_array(a.attname,tn.nspname,t.typname,a.atttypmod,a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid)) order by a.attnum),'[]'::jsonb) from pg_attribute a join pg_type t on t.oid=a.atttypid join pg_namespace tn on tn.oid=t.typnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
 'constraints',(select coalesce(jsonb_agg(jsonb_build_array(k.conname,k.contype,k.condeferrable,k.condeferred,k.convalidated,pg_get_constraintdef(k.oid,true)) order by k.conname),'[]'::jsonb) from pg_constraint k where k.conrelid=c.oid and k.contype<>'n'),
 'indexes',(select coalesce(jsonb_agg(jsonb_build_array(ic.relname,pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by ic.relname),'[]'::jsonb) from pg_index i join pg_class ic on ic.oid=i.indexrelid where i.indrelid=c.oid)
)),'{}'::jsonb) as doc from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p'))='{"assess.groups":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["created_at","pg_catalog","timestamptz",-1,true,"","","now()"]],"indexes":[["assess_groups_owner_id","CREATE INDEX assess_groups_owner_id ON assess.groups USING btree (owner_id, id)",true,true],["groups_pkey","CREATE UNIQUE INDEX groups_pkey ON assess.groups USING btree (id)",true,true]],"constraints":[["groups_name_check","c",false,false,true,"CHECK (length(btrim(name)) >= 1 AND length(btrim(name)) <= 100)"],["groups_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["groups_pkey","p",false,false,true,"PRIMARY KEY (id)"]]},"assess.results":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["earned_n","pg_catalog","numeric",-1,true,"","",null],["earned_d","pg_catalog","numeric",-1,true,"","",null],["maximum","pg_catalog","numeric",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["track","pg_catalog","text",-1,true,"","",null],["visibility","pg_catalog","text",-1,true,"","",null]],"indexes":[["results_pkey","CREATE UNIQUE INDEX results_pkey ON assess.results USING btree (session_id)",true,true]],"constraints":[["results_earned_d_check","c",false,false,true,"CHECK (earned_d > 0::numeric)"],["results_earned_n_check","c",false,false,true,"CHECK (earned_n >= 0::numeric)"],["results_maximum_check","c",false,false,true,"CHECK (maximum > 0::numeric)"],["results_pkey","p",false,false,true,"PRIMARY KEY (session_id)"],["results_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"],["results_visibility_check","c",false,false,true,"CHECK (visibility = ANY (ARRAY[''hidden''::text, ''after-submission''::text]))"]]},"assess.targets":{"columns":[["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null]],"indexes":[["assess_targets_user_assignment","CREATE INDEX assess_targets_user_assignment ON assess.targets USING btree (user_id, assignment_id)",true,true],["targets_pkey","CREATE UNIQUE INDEX targets_pkey ON assess.targets USING btree (assignment_id, user_id)",true,true]],"constraints":[["targets_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["targets_pkey","p",false,false,true,"PRIMARY KEY (assignment_id, user_id)"],["targets_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.consents":{"columns":[["user_id","pg_catalog","uuid",-1,true,"","",null],["version","pg_catalog","text",-1,true,"","",null],["accepted_at","pg_catalog","timestamptz",-1,true,"","","clock_timestamp()"]],"indexes":[["consents_pkey","CREATE UNIQUE INDEX consents_pkey ON assess.consents USING btree (user_id)",true,true]],"constraints":[["consents_pkey","p",false,false,true,"PRIMARY KEY (user_id)"],["consents_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["consents_version_check","c",false,false,true,"CHECK (version = ''assess-pilot-2026-10-20-v1''::text)"]]},"assess.receipts":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["operation_id","pg_catalog","uuid",-1,true,"","",null],["digest","pg_catalog","text",-1,true,"","",null],["ack","pg_catalog","jsonb",-1,true,"","",null]],"indexes":[["receipts_pkey","CREATE UNIQUE INDEX receipts_pkey ON assess.receipts USING btree (session_id, operation_id)",true,true]],"constraints":[["receipts_pkey","p",false,false,true,"PRIMARY KEY (session_id, operation_id)"],["receipts_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"]]},"assess.sessions":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null],["ordinal","pg_catalog","int4",-1,true,"","",null],["state","pg_catalog","text",-1,true,"","","''active''::text"],["revision","pg_catalog","int4",-1,true,"","","0"],["started_at","pg_catalog","timestamptz",-1,true,"","",null],["deadline","pg_catalog","timestamptz",-1,false,"","",null],["submitted_at","pg_catalog","timestamptz",-1,false,"","",null],["submission_op","pg_catalog","uuid",-1,false,"","",null],["submission_revision","pg_catalog","int4",-1,false,"","",null],["lease","pg_catalog","uuid",-1,false,"","",null],["lease_until","pg_catalog","timestamptz",-1,false,"","",null],["retry_at","pg_catalog","timestamptz",-1,false,"","",null],["failed_at","pg_catalog","timestamptz",-1,false,"","",null],["expires_at","pg_catalog","timestamptz",-1,false,"","",null]],"indexes":[["assess_one_active","CREATE UNIQUE INDEX assess_one_active ON assess.sessions USING btree (assignment_id, user_id) WHERE (state = ''active''::text)",true,true],["assess_sessions_due","CREATE INDEX assess_sessions_due ON assess.sessions USING btree (state, deadline, id)",true,true],["assess_sessions_expiry","CREATE INDEX assess_sessions_expiry ON assess.sessions USING btree (expires_at, id)",true,true],["assess_sessions_history","CREATE INDEX assess_sessions_history ON assess.sessions USING btree (user_id, id) WHERE (state = ''graded''::text)",true,true],["assess_sessions_retry","CREATE INDEX assess_sessions_retry ON assess.sessions USING btree (state, retry_at, lease_until, id)",true,true],["sessions_assignment_id_user_id_ordinal_key","CREATE UNIQUE INDEX sessions_assignment_id_user_id_ordinal_key ON assess.sessions USING btree (assignment_id, user_id, ordinal)",true,true],["sessions_pkey","CREATE UNIQUE INDEX sessions_pkey ON assess.sessions USING btree (id)",true,true]],"constraints":[["sessions_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["sessions_assignment_id_user_id_ordinal_key","u",false,false,true,"UNIQUE (assignment_id, user_id, ordinal)"],["sessions_pkey","p",false,false,true,"PRIMARY KEY (id)"],["sessions_state_check","c",false,false,true,"CHECK (state = ANY (ARRAY[''active''::text, ''grading''::text, ''grading-failed''::text, ''graded''::text, ''void''::text]))"],["sessions_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.versions":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["assessment_id","pg_catalog","uuid",-1,true,"","",null],["version","pg_catalog","text",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["track","pg_catalog","text",-1,true,"","",null],["schema_version","pg_catalog","int4",-1,true,"","","1"],["available","pg_catalog","bool",-1,true,"","","false"]],"indexes":[["assess_versions_owner_id","CREATE INDEX assess_versions_owner_id ON assess.versions USING btree (owner_id, id)",true,true],["versions_assessment_id_version_key","CREATE UNIQUE INDEX versions_assessment_id_version_key ON assess.versions USING btree (assessment_id, version)",true,true],["versions_pkey","CREATE UNIQUE INDEX versions_pkey ON assess.versions USING btree (id)",true,true]],"constraints":[["versions_assessment_id_version_key","u",false,false,true,"UNIQUE (assessment_id, version)"],["versions_name_check","c",false,false,true,"CHECK (length(btrim(name)) >= 1 AND length(btrim(name)) <= 200)"],["versions_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["versions_pkey","p",false,false,true,"PRIMARY KEY (id)"],["versions_schema_version_check","c",false,false,true,"CHECK (schema_version > 0)"],["versions_track_check","c",false,false,true,"CHECK (length(track) >= 1 AND length(track) <= 100)"],["versions_version_check","c",false,false,true,"CHECK (length(version) >= 1 AND length(version) <= 100)"]]},"assess.assignments":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["version_id","pg_catalog","uuid",-1,true,"","",null],["revision","pg_catalog","int4",-1,true,"","","1"],["source_group_ids","pg_catalog","_uuid",-1,true,"","","''{}''::uuid[]"],["published_at","pg_catalog","timestamptz",-1,true,"","","now()"]],"indexes":[["assess_assignments_owner_id","CREATE INDEX assess_assignments_owner_id ON assess.assignments USING btree (owner_id, id)",true,true],["assignments_owner_id_version_id_key","CREATE UNIQUE INDEX assignments_owner_id_version_id_key ON assess.assignments USING btree (owner_id, version_id)",true,true],["assignments_pkey","CREATE UNIQUE INDEX assignments_pkey ON assess.assignments USING btree (id)",true,true]],"constraints":[["assignments_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["assignments_owner_id_version_id_key","u",false,false,true,"UNIQUE (owner_id, version_id)"],["assignments_pkey","p",false,false,true,"PRIMARY KEY (id)"],["assignments_revision_check","c",false,false,true,"CHECK (revision > 0)"],["assignments_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id)"]]},"assess.launch_gate":{"columns":[["singleton","pg_catalog","bool",-1,true,"","","true"],["enabled","pg_catalog","bool",-1,true,"","","false"]],"indexes":[["launch_gate_pkey","CREATE UNIQUE INDEX launch_gate_pkey ON assess.launch_gate USING btree (singleton)",true,true]],"constraints":[["launch_gate_pkey","p",false,false,true,"PRIMARY KEY (singleton)"],["launch_gate_singleton_check","c",false,false,true,"CHECK (singleton)"]]},"assess.memberships":{"columns":[["group_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null]],"indexes":[["assess_memberships_user","CREATE INDEX assess_memberships_user ON assess.memberships USING btree (user_id, group_id)",true,true],["memberships_pkey","CREATE UNIQUE INDEX memberships_pkey ON assess.memberships USING btree (group_id, user_id)",true,true]],"constraints":[["memberships_group_id_fkey","f",false,false,true,"FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE"],["memberships_pkey","p",false,false,true,"PRIMARY KEY (group_id, user_id)"],["memberships_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.publications":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["document","pg_catalog","jsonb",-1,true,"","",null],["specs","pg_catalog","jsonb",-1,true,"","",null],["created_at","pg_catalog","timestamptz",-1,true,"","","clock_timestamp()"]],"indexes":[["publications_pkey","CREATE UNIQUE INDEX publications_pkey ON assess.publications USING btree (version_id)",true,true]],"constraints":[["publications_document_check","c",false,false,true,"CHECK (pg_column_size(document) <= 2000000)"],["publications_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["publications_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id)"]]},"assess.reservations":{"columns":[["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null],["used","pg_catalog","int4",-1,true,"","","0"],["starts","pg_catalog","jsonb",-1,true,"","","''{}''::jsonb"]],"indexes":[["reservations_pkey","CREATE UNIQUE INDEX reservations_pkey ON assess.reservations USING btree (assignment_id, user_id)",true,true]],"constraints":[["reservations_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["reservations_pkey","p",false,false,true,"PRIMARY KEY (assignment_id, user_id)"],["reservations_used_check","c",false,false,true,"CHECK (used >= 0)"],["reservations_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.session_details":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["publication","pg_catalog","jsonb",-1,true,"","",null],["specs","pg_catalog","jsonb",-1,true,"","",null],["answers","pg_catalog","jsonb",-1,true,"","","''{}''::jsonb"],["locked","pg_catalog","jsonb",-1,true,"","","''[]''::jsonb"]],"indexes":[["session_details_pkey","CREATE UNIQUE INDEX session_details_pkey ON assess.session_details USING btree (session_id)",true,true]],"constraints":[["session_details_pkey","p",false,false,true,"PRIMARY KEY (session_id)"],["session_details_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"]]},"assess.content_submissions":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["document","pg_catalog","jsonb",-1,false,"","",null],["state","pg_catalog","text",-1,true,"","","''pending''::text"]],"indexes":[["content_submissions_pkey","CREATE UNIQUE INDEX content_submissions_pkey ON assess.content_submissions USING btree (version_id)",true,true]],"constraints":[["content_submissions_check","c",false,false,true,"CHECK ((state = ''pending''::text) = (document IS NOT NULL))"],["content_submissions_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["content_submissions_state_check","c",false,false,true,"CHECK (state = ANY (ARRAY[''pending''::text, ''installed''::text]))"],["content_submissions_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE"]]},"assess.practical_presentations":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["views","pg_catalog","jsonb",-1,true,"","",null]],"indexes":[["practical_presentations_pkey","CREATE UNIQUE INDEX practical_presentations_pkey ON assess.practical_presentations USING btree (version_id)",true,true]],"constraints":[["practical_presentations_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["practical_presentations_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE"],["practical_presentations_views_check","c",false,false,true,"CHECK (jsonb_typeof(views) = ''object''::text AND pg_column_size(views) <= 2000000)"]]}}'::jsonb as schema_shape_matches),gate as (
 select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate
),columns_acl as (
 select not exists(select 1 from pg_class c cross join (values ('anon'),('authenticated'),('assess_worker')) r(name)
 where c.relnamespace=to_regnamespace('assess') and c.relkind in ('r','p')
 and has_any_column_privilege(r.name,c.oid,'SELECT,INSERT,UPDATE,REFERENCES')) as no_direct_column_grants
),triggers as (
 select count(*)=1 and bool_and(t.tgrelid='assess.sessions'::regclass and t.tgname='assess_session_consent' and t.tgenabled='O' and t.tgtype=7 and t.tgfoid=to_regprocedure('assess.require_consent_v1()') and t.tgconstraint=0 and t.tgqual is null and t.tgnargs=0) as trigger_contract_matches
 from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relnamespace=to_regnamespace('assess') and not t.tgisinternal
) ,retention as (
 select not exists(select 1 from pg_class c where c.relnamespace=to_regnamespace('assess')
   and c.relname in ('account_stops','assess_one_open_assignment','assess_closed_assignments','assess_sessions_user','assess_sessions_assignment'))
 and not exists(select 1 from pg_proc p where p.pronamespace=to_regnamespace('assess')
   and p.proname in ('assignment_terminal_v1','close_assignment_v1','disable_account_v1','consent_v2'))
 and not exists(select 1 from pg_attribute a where a.attrelid=to_regclass('assess.assignments') and a.attname='closed_at' and not a.attisdropped)
 and not exists(select 1 from pg_trigger t where t.tgrelid=to_regclass('assess.assignments') and t.tgname='assess_assignment_terminal' and not t.tgisinternal)
 as retention_absent
)
select 'assess-retention-preinstall/1' as contract,
 catalogue.read_only,catalogue.catalogue_ready as bcdef_catalogue_ready,bodies.source_bodies_match as bcdef_source_bodies_match,
 shape.schema_shape_matches,columns_acl.no_direct_column_grants,triggers.trigger_contract_matches,gate.launch_gate_closed,
 retention.retention_absent,
 catalogue.catalogue_ready and bodies.source_bodies_match and shape.schema_shape_matches and columns_acl.no_direct_column_grants
  and triggers.trigger_contract_matches and gate.launch_gate_closed and retention.retention_absent as baseline_matches,
 -- These independent facts cannot be verified by a catalogue query. No write authorization is issued.
 false as backup_verified,false as recovery_verified,false as provider_backups_verified,
 false as apply_authorized,true as manual_review_required,false as runtime_or_launch_verified
from catalogue cross join bodies cross join shape cross join gate cross join triggers cross join columns_acl cross join retention
 ) q;
 if not coalesce(allowed,false) then raise exception 'Retention precondition failed. Stop; do not drop objects or replay B/C/D/E/F';end if;
end $precondition$;
-- SOURCE RETENTION BEGIN SHA256 6142bbecd7dae9c2ac6d2b5ab7ebcc4b10ac29ef6388aced47c7b7b82bc8b3d6
alter table assess.assignments add column closed_at timestamptz;
alter table assess.assignments drop constraint assignments_owner_id_version_id_key;
create unique index assess_one_open_assignment on assess.assignments(owner_id,version_id) where closed_at is null;
create index assess_closed_assignments on assess.assignments(id) where closed_at is not null;
create index assess_sessions_user on assess.sessions(user_id);
create index assess_sessions_assignment on assess.sessions(assignment_id);

-- Absence means Assess enabled (the existing behaviour). An explicit stop is
-- permanent in this package; reactivation needs a separately reviewed contract.
create table assess.account_stops (
 user_id uuid primary key references public.profiles(user_id) on delete cascade,
 disabled_at timestamptz not null default clock_timestamp()
);
alter table assess.account_stops enable row level security;
revoke all on assess.account_stops from public,anon,authenticated,assess_worker;

create function assess.assignment_terminal_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.closed_at is not null and (tg_op='DELETE' or new.closed_at is distinct from old.closed_at
   or new.id is distinct from old.id or new.owner_id is distinct from old.owner_id or new.version_id is distinct from old.version_id) then
   raise exception 'permanently closed' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger assess_assignment_terminal before update or delete on assess.assignments
 for each row execute function assess.assignment_terminal_v1();

create function assess.close_assignment_v1(p_assignment uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 perform 1 from assess.assignments where id=p_assignment and owner_id=auth.uid() for update;
 if not found then raise exception 'assignment denied' using errcode='42501'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=p_assignment and closed_at is null;
end $$;

create function assess.disable_account_v1(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 -- Self disable or current approved owner; never suspend the public profile.
 if not public.is_approved() or (p_user is distinct from auth.uid() and not public.is_owner()) then
   raise exception 'account denied' using errcode='42501'; end if;
 perform 1 from public.profiles where user_id=p_user for update;
 if not found then raise exception 'account denied' using errcode='42501'; end if;
 insert into assess.account_stops(user_id) values(p_user) on conflict do nothing;
end $$;

-- Keep v1 text/acceptance independent; do not re-stamp any existing acceptance.
alter table assess.consents drop constraint consents_version_check;
alter table assess.consents drop constraint consents_pkey;
alter table assess.consents add primary key(user_id,version);
alter table assess.consents add constraint consents_version_check
 check(version in ('assess-pilot-2026-10-20-v1','assess-pilot-2026-10-20-v2'));
create or replace function assess.consent_v1(p_version text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  perform 1 from public.profiles where user_id=auth.uid() for share;
  if p_version is not null then
    if exists(select 1 from assess.account_stops where user_id=auth.uid()) then raise exception 'Assess disabled' using errcode='42501'; end if;
    if p_version<>'assess-pilot-2026-10-20-v1' then raise exception 'unsupported consent' using errcode='22023'; end if;
    insert into assess.consents(user_id,version) values(auth.uid(),p_version) on conflict(user_id,version) do nothing;
  end if;
  return jsonb_build_object('accepted',exists(select 1 from assess.consents where user_id=auth.uid() and version='assess-pilot-2026-10-20-v1'));
end $$;

create function assess.consent_v2(p_version text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where user_id=auth.uid() for share;
 if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
 if p_version is not null then
   if p_version<>'assess-pilot-2026-10-20-v2' then raise exception 'unsupported consent' using errcode='22023'; end if;
   if exists(select 1 from assess.account_stops where user_id=auth.uid()) then raise exception 'Assess disabled' using errcode='42501'; end if;
   insert into assess.consents(user_id,version) values(auth.uid(),p_version) on conflict(user_id,version) do nothing;
 end if;
 return jsonb_build_object('accepted',exists(select 1 from assess.consents where user_id=auth.uid() and version='assess-pilot-2026-10-20-v2'));
end $$;
create or replace function assess.require_consent_v1() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from assess.consents where user_id=new.user_id and version='assess-pilot-2026-10-20-v2') then
   raise exception 'Assess v2 consent required' using errcode='42501'; end if;
 return new;
end $$;
create or replace function assess.start_v1(p_assignment uuid,p_operation uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare doc jsonb; sp jsonb; s assess.sessions; n integer; ts timestamptz; duration integer; prior uuid;
begin
  if not exists(select 1 from assess.launch_gate where enabled) then raise exception 'launch gate closed' using errcode='55000'; end if;
  if p_operation is null then raise exception 'invalid start operation' using errcode='22023'; end if;
  -- Per-user/assignment reservation serialises starts, including starts after finalisation/purge.
  perform assess.session_authorize_v1(p_assignment);
  -- Assignment SHARE and profile SHARE locks already held by session_authorize.
  -- Close/disable take UPDATE on those same rows until COMMIT.
  if exists(select 1 from assess.assignments where id=p_assignment and closed_at is not null)
    or exists(select 1 from assess.account_stops where user_id=auth.uid()) then
    raise exception 'new starts disabled' using errcode='42501'; end if;
  perform 1 from assess.assignments where id=p_assignment for share;
  insert into assess.reservations(assignment_id,user_id) values(p_assignment,auth.uid()) on conflict do nothing;
  select used into n from assess.reservations where assignment_id=p_assignment and user_id=auth.uid() for update;
  perform assess.session_authorize_v1(p_assignment);
  select (starts->>p_operation::text)::uuid into prior from assess.reservations where assignment_id=p_assignment and user_id=auth.uid();
  if prior is not null then
    if not exists(select 1 from assess.sessions where id=prior and (expires_at is null or clock_timestamp()<expires_at)) then
      raise exception 'start no longer available' using errcode='55000'; end if;
    return jsonb_build_object('attemptId',prior);
  end if;
  if (select count(*) from assess.reservations r, jsonb_object_keys(r.starts) k where r.assignment_id=p_assignment and r.user_id=auth.uid())>=20000 then
    raise exception 'start operation limit' using errcode='54000'; end if;
  select * into s from assess.sessions where assignment_id=p_assignment and user_id=auth.uid() and state='active' for update;
  ts:=clock_timestamp();
  if s.id is not null then
    if s.deadline is not null and ts>=s.deadline then
      update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
    end if;
    update assess.reservations set starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
    return jsonb_build_object('attemptId',s.id);
  end if;
  -- A pending/failing grade cannot accidentally reserve another attempt on a lost start response.
  select * into s from assess.sessions where assignment_id=p_assignment and user_id=auth.uid()
    and state in ('grading','grading-failed') order by ordinal desc limit 1;
  if s.id is not null then
    update assess.reservations set starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
    return jsonb_build_object('attemptId',s.id); end if;
  select p.document,p.specs into doc,sp from assess.publications p join assess.assignments a on a.version_id=p.version_id where a.id=p_assignment;
  if doc is null then raise exception 'publication unavailable' using errcode='55000'; end if;
  if n >= (doc->'assessment'->'policy'->>'maxAttempts')::integer then raise exception 'attempt limit' using errcode='54000'; end if;
  duration:=(doc->'assessment'->'policy'->>'durationSeconds')::integer;
  -- S-ASSESS-15: first pilot is timed-only; future untimed retention needs its own policy.
  if duration is null then raise exception 'untimed retention not configured' using errcode='55000'; end if;
  insert into assess.sessions(assignment_id,user_id,ordinal,started_at,deadline)
    values(p_assignment,auth.uid(),n+1,ts,ts+make_interval(secs=>duration)) returning * into s;
  update assess.reservations set used=n+1,starts=jsonb_set(starts,array[p_operation::text],to_jsonb(s.id::text)) where assignment_id=p_assignment and user_id=auth.uid();
  insert into assess.session_details(session_id,publication,specs) values(s.id,doc,sp);
  return jsonb_build_object('attemptId',s.id);
end $$;

create or replace function assess.maintain_v1(p_limit integer default 50) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n integer; gone integer; metadata_gone integer; consent_gone integer; ts timestamptz:=clock_timestamp();
begin
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid batch' using errcode='22023'; end if;
  with due as (select id from assess.sessions where state='active' and deadline<=ts order by deadline,id limit p_limit for update skip locked)
  update assess.sessions s set state='grading',submitted_at=deadline,revision=revision+1 from due where s.id=due.id;
  get diagnostics n=row_count;
  with due as (select id from assess.sessions where state in ('grading','grading-failed') and submitted_at<=ts-interval '7 days'
    order by submitted_at,id limit p_limit for update skip locked)
  update assess.sessions s set state='void',lease=null,lease_until=null,expires_at=ts from due where s.id=due.id;
  -- Crashed leases stop automatic retries after 24h too; explicit recover remains possible until day seven.
  with due as (select id from assess.sessions where state='grading' and submitted_at<=ts-interval '24 hours'
    and (lease_until is null or lease_until<=ts) order by submitted_at,id limit p_limit for update skip locked)
  update assess.sessions s set state='grading-failed',failed_at=coalesce(failed_at,ts),retry_at=submitted_at+interval '7 days',lease=null,lease_until=null from due where s.id=due.id;
  -- Removing session cascades details/receipts/results; reservation counter deliberately survives.
  with due as (select id from assess.sessions where expires_at<=ts order by expires_at,id limit p_limit for update skip locked)
  delete from assess.sessions s using due where s.id=due.id;
  get diagnostics gone=row_count;
  -- SKIP LOCKED avoids inverting C's session/assignment/profile lock order.
  -- Retain the permanent assignment tombstone; no sessions means no results,
  -- details, receipts or remaining recovery window (C cascades them atomically).
  with closed as materialized (
    select a.id from assess.assignments a where a.closed_at is not null
      and not exists(select 1 from assess.sessions s where s.assignment_id=a.id)
      and exists(select 1 from assess.reservations r where r.assignment_id=a.id)
    order by a.id limit p_limit for update skip locked
  ), due as (
    select r.assignment_id,r.user_id from assess.reservations r join closed a on a.id=r.assignment_id
    order by r.assignment_id,r.user_id limit p_limit for update of r skip locked
  ) delete from assess.reservations r using due where r.assignment_id=due.assignment_id and r.user_id=due.user_id;
  get diagnostics metadata_gone=row_count;
  with stopped as materialized (
    select p.user_id from public.profiles p join assess.account_stops a on a.user_id=p.user_id
    where not exists(select 1 from assess.sessions s where s.user_id=p.user_id)
      and exists(select 1 from assess.consents c where c.user_id=p.user_id)
    order by p.user_id limit p_limit for update of p skip locked
  ), due as (
    select c.user_id,c.version from assess.consents c join stopped a on a.user_id=c.user_id
    order by c.user_id,c.version limit p_limit for update of c skip locked
  ) delete from assess.consents c using due where c.user_id=due.user_id and c.version=due.version;
  get diagnostics consent_gone=row_count;
  return jsonb_build_object('expired',n,'purged',gone,'reservationsPurged',metadata_gone,'consentsPurged',consent_gone);
end $$;

revoke all on function assess.assignment_terminal_v1(),assess.close_assignment_v1(uuid),assess.disable_account_v1(uuid),assess.consent_v2(text) from public,anon,authenticated,assess_worker;
grant execute on function assess.close_assignment_v1(uuid),assess.disable_account_v1(uuid),assess.consent_v2(text) to authenticated;
-- SOURCE RETENTION END

do $postcondition$
declare allowed boolean;
begin
 select installation_valid into allowed from (
with catalogue as (with expected_tables(name) as (values
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
  union all select 'assess.consents'
  union all select 'assess.account_stops'
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
  union all select signature,audience from (values
    ('assess.consent_v1(text)','user'),
    ('assess.history_page_v1(uuid,integer)','user'),
    ('assess.require_consent_v1()','internal')
  ) f(signature,audience)
  union all select signature,audience from (values
    ('assess.assignment_terminal_v1()','internal'),
    ('assess.close_assignment_v1(uuid)','user'),
    ('assess.disable_account_v1(uuid)','user'),
    ('assess.consent_v2(text)','user')
  ) r(signature,audience)
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
  tables_present and rls_enabled and roles_present and functions_present and schema_privileges and definer_and_empty_search_path
  and no_direct_table_privileges and execute_matrix and no_public_execute and roles_not_privileged
  and worker_nonlogin_noinherit and users_not_worker_members and no_direct_table_policies
  and no_unreviewed_relations and no_unreviewed_functions as catalogue_ready,
  false as runtime_or_launch_verified
from checks),bodies as (with expected_bodies(name,digest,crlf_digest) as (values
 ('group_write_v1','1cf0ef392a79a99f728da8903814ddcfc9c0910e89dc51d9dc1e5f6ad4553ae8','43f2ae773ec8efaf2d6f3e2e93203f8d7d870b54583a860e99835496d40f0c21'),
 ('members_write_v1','1789ac46865b450360fb8d1644e5596691fa3bc85c04f59fa61b1e5b3ca41060','55d88b4b7817c4356408d2a55e9e805179fba211468dbfd216a3bfbe2cb29591'),
 ('assign_v1','c3886247c8b61f601f7ae869d07465cfae800fb7821736a86e1e1235f50ee1e4','74c481837cdb6ae6e7d67f7f6ec1eb879ea1d8f118cc12be0ecb9056613a7617'),
 ('targets_write_v1','f2b7aa109447ffc5237bcd2312d4566b7a7f71b3cb6c072be1b4c3ab03178f53','d20262e01a6f81744d45e133221b40a10f653d46e4a60b307c7701ece55837c4'),
 ('owner_page_v1','fe4eee7cc88111fe1a68b63a36a0b74e618f34d64d5857ff1a5bc0cde29d3e7f','5203ed66c2cc90b1d48d5a1cda2cb4f2ead2c286818c7a9637d6996700752ff9'),
 ('assigned_version_v1','a659c221ff9184f0c1defae7bc4157f4bc205e3a501d2e6ade4dfbe18df1c3bb','ded902985e103acfe3f2c3aa875052adddd552c9582483b76f401f650d4b8253'),
 ('install_publication_v1','6c198420efc157a0f0b2605d9618e7b2941aaadae707c74968df16395e3521e9','c4f318ecef61705f16155a976820b3fbc7db9325fd67a009c872abfcf3dd5443'),
 ('session_authorize_v1','f4475e949d292ae610595d820d46f457c549987780cfe2025ab31abd2a014db6','17c353a1b053bb2f2b7f7cef831bd27ff3d1a69eb7e0f8bbde1337e1c7d3941f'),
 ('session_ack_v1','24a26227091099c3fb8c0fbdfd478bb0ca4c18cd0d21375eb1a21d8897c66187','1f5ad7536ffb06ccb62aff9b136e37d1c2f70a1a5f07f3420eaf1dcf2b099bd8'),
 ('start_v1','c90cf06f0e71d85909df2cbf6ff78ebf9b11311c4c274474ba8a984254dba3d8','04a50490580df3094b2a07339249ccd872b27b13fbd8f767ba35c18e970fc5be'),
 ('read_session_v1','cfaa04b87af01609fd4cbe83ef1cabcd34aab39c6f409894035c0303bd902546','19094a897ec987874dc81875ddbdd053e66e98d3e1dfdbcd6effb1e49dcfd612'),
 ('validate_answer_v1','443ef959d33e6eb3da6498aff60cc0cf385cc172d811b6f2bc03ae6c4fd9019d','7ac0f1c2053ba7df97d296f2cd6ad24876c774a7a3a08fd6e3742d98578c5a7b'),
 ('command_v1','b8d969b9e7dda62fae77150f445e77756e6332cf1c1df382605a127377d6fdf6','34fcc73719583e90c494389c73115e11cc9247e44f591083bcc9eeadf16facb6'),
 ('result_v1','0826d17d24bf374dfc1cc3b2ba9f7d05a5b671a70f61638792750fbb4ed5d803','b6aaeeca530b8c930949fb13282c6ceaa8174b74f1517ad782be469c76af0583'),
 ('maintain_v1','e8f098adfc59b406ec4546bf73220aca0fa26b3c01e707708edd525f4e3d74ee','209c46e19cd198f8cbad7be113e7dc25b1f0d75e3b7f93e7c8e2d8b960b1f8e9'),
 ('claim_v1','649a0e9a990c85b4d7e8dff0cfe57bc4e5a0b4292f1f8539f05a4bf5a1fa73a3','dd15b25b24edf2241c482963e85bf69e7195447d5f2fc72b5bd0107ce816547e'),
 ('finish_v1','cf69d6824d61dec9ad4b1d0e9187a113a248188f4dcf32ec1e260c950e989c8b','61d7f09dd4afd302a1dac2bbed996629e64cd9b5197d3f676e12014b263bfa2d'),
 ('fail_v1','812fd82f88340a71d13f1742dc9b17c2bdc2cafff239c547de4c9efd924da585','4c22c8b7aee828faac9bbc3db7ec5c20cc60044cb790fd1cd6c80c9f7c46ed83'),
 ('recover_v1','a1b8827868f3bedddfc924ed55102d3fd07bf186fc981b267b129863ff4d01f0','6de033d89a8a055ac099af385cd4c9183dd894e6ab656b335784a48531b4ee95'),
 ('health_v1','e8625fca0d23bc66fcd9ee43a94ea40daaadff3d4d718ee3c564f38ab57590f1','9ecb1bca9212a18bb331352312716a7c7e2048ce94c5ad63adc4ee73f8dd655b'),
 ('content_submit_v1','0bddc286f600170ef321cb722ed3f06d635046d24b9e4134ffb648f3aa9352de','5e044260494de586c21996f8c322b20646c2d90eca426c0ac7b388b917fe7e67'),
 ('content_page_v1','d0d1a4f6eea23527c84aa1da5c43bad1721120b048aa7090895bfdef6506b014','12d0902398f6784c1e9df48b4831650a49359e05f582ece16d223aabf556da03'),
 ('content_read_v1','7694935ebab7924049d1adb84d443b300224b8db322f0415cbe5cf2cb3524a26','39229a319515337fad0078cb332cd8dc657a95c3b68b880a1453b82b0cd56be8'),
 ('content_install_v1','1454d2b2d3d6ed8357fda011ad27685191924eeaea1067dbf01d7643db4f53cb','9b6fcc3ff252502f10406b948b17917e906c7fe4316eb760be0a162ca2338fe5'),
 ('assigned_page_v1','29b69f7e8f96f540d22cb4ab2584f9912a3277fc7dc7d5dea841993c115d0f05','9d2909556f0e627a8038e768cb27677ff38c07b105cee2e302fc3c62d36e8e84'),
 ('read_mixed_session_v1','0841acf0ad8679e7bdc2cb8020101de27b4b603da256016844e149c7ad35c246','b8c8a3b81118eccd893a164eea7870380be683a7122139ef65acfca88aef364e'),
 ('content_install_practical_v1','2957e1de08e7e036e1ccab1d0c101158902d44088a7481925615de3bbf036c66','89883ea033bd04a88978b6df7f7343bfb9f9b43a27e1c36e01b832c5a8199b04'),
 ('assigned_practical_page_v1','d3fc72d1a450c1611fe0928dc72d83c3efbc75ab94e1ecd2414c9c2c6d6051f6','04a9210b6b1b7166212a4e6746ce8ac8dbca6e7b4994b76d8db560516a77f424'),
 ('read_practical_session_v1','02a5d026d71bb186f269c76fff55d8b7cf21ed504e152580d999d50cfe5ade6b','03ccfc076b927fa2848148822ecd4a6133c24ce7193f0dac43a9da0e931a2b5a'),
 ('consent_v1','2e291c206398e04dae60770fe74a5f0fbda3b81b0291ed1174326b40cdf6b6ad','8930e2cff49c856be5d9cfba600c9085db02b9bfadb2c902d1f95ce6e50d9d2b'),
 ('require_consent_v1','305d51b87267bb6ceb2efd24851578e852b6582d981c68b5cc4c5db1432297bd','0756d1f0b85a78506c9590cfd316e3edd74bfc892d651f792a2532b0db33a184'),
 ('history_page_v1','0bd639f7c93130a5ed1702f3e24f926fe02e4dba6bde476a4691eea78599e24a','0be6904667e36da520b28920d746227eaf92a6168e60b69a0b25db4cca9ba555'),
 ('assignment_terminal_v1','31fb00a6e66d2bfc66cf728d409e96fddaaa6d9a99b6dbcb4cee44ed7d78708a','a3017c7bb5be18a975573613c08658ce60afae34ece46016b0cc64465ce25bb8'),
 ('close_assignment_v1','69f3af425117d0cb7957109200612842ade0686d651ce9c075172e6761190b24','1f112fa5892fd7777f1b5dc9b454bd1f4259924eb04deb27ba9c22fb5b563301'),
 ('disable_account_v1','1626079f79e5626f929d1d6487972b567ac141f48cfe28eb9536d7d643245908','a3a72dc96bb25783d7343081ef93c30c0f438777a5b39a95a7eba0c18d4385b8'),
 ('consent_v2','f2de0aa43c3dff6c67479b51e75a1ff6e9c795bf25c3c1d1288ccee938070642','05a2ea9e38cdfac9eafd99d75827138385a22edef5aacc86fdbf80b4819e3a4a')
) select not exists(select 1 from expected_bodies e left join pg_proc p on p.pronamespace=to_regnamespace('assess') and p.proname=e.name where coalesce(encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') in (e.digest,e.crlf_digest),false)=false) as source_bodies_match),shape as (select (select coalesce(jsonb_object_agg(n.nspname||'.'||c.relname,jsonb_build_object(
 'columns',(select coalesce(jsonb_agg(jsonb_build_array(a.attname,tn.nspname,t.typname,a.atttypmod,a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid)) order by a.attnum),'[]'::jsonb) from pg_attribute a join pg_type t on t.oid=a.atttypid join pg_namespace tn on tn.oid=t.typnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
 'constraints',(select coalesce(jsonb_agg(jsonb_build_array(k.conname,k.contype,k.condeferrable,k.condeferred,k.convalidated,pg_get_constraintdef(k.oid,true)) order by k.conname),'[]'::jsonb) from pg_constraint k where k.conrelid=c.oid and k.contype<>'n'),
 'indexes',(select coalesce(jsonb_agg(jsonb_build_array(ic.relname,pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by ic.relname),'[]'::jsonb) from pg_index i join pg_class ic on ic.oid=i.indexrelid where i.indrelid=c.oid)
)),'{}'::jsonb) as doc from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p'))='{"assess.groups":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["created_at","pg_catalog","timestamptz",-1,true,"","","now()"]],"indexes":[["assess_groups_owner_id","CREATE INDEX assess_groups_owner_id ON assess.groups USING btree (owner_id, id)",true,true],["groups_pkey","CREATE UNIQUE INDEX groups_pkey ON assess.groups USING btree (id)",true,true]],"constraints":[["groups_name_check","c",false,false,true,"CHECK (length(btrim(name)) >= 1 AND length(btrim(name)) <= 100)"],["groups_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["groups_pkey","p",false,false,true,"PRIMARY KEY (id)"]]},"assess.results":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["earned_n","pg_catalog","numeric",-1,true,"","",null],["earned_d","pg_catalog","numeric",-1,true,"","",null],["maximum","pg_catalog","numeric",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["track","pg_catalog","text",-1,true,"","",null],["visibility","pg_catalog","text",-1,true,"","",null]],"indexes":[["results_pkey","CREATE UNIQUE INDEX results_pkey ON assess.results USING btree (session_id)",true,true]],"constraints":[["results_earned_d_check","c",false,false,true,"CHECK (earned_d > 0::numeric)"],["results_earned_n_check","c",false,false,true,"CHECK (earned_n >= 0::numeric)"],["results_maximum_check","c",false,false,true,"CHECK (maximum > 0::numeric)"],["results_pkey","p",false,false,true,"PRIMARY KEY (session_id)"],["results_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"],["results_visibility_check","c",false,false,true,"CHECK (visibility = ANY (ARRAY[''hidden''::text, ''after-submission''::text]))"]]},"assess.targets":{"columns":[["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null]],"indexes":[["assess_targets_user_assignment","CREATE INDEX assess_targets_user_assignment ON assess.targets USING btree (user_id, assignment_id)",true,true],["targets_pkey","CREATE UNIQUE INDEX targets_pkey ON assess.targets USING btree (assignment_id, user_id)",true,true]],"constraints":[["targets_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["targets_pkey","p",false,false,true,"PRIMARY KEY (assignment_id, user_id)"],["targets_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.consents":{"columns":[["user_id","pg_catalog","uuid",-1,true,"","",null],["version","pg_catalog","text",-1,true,"","",null],["accepted_at","pg_catalog","timestamptz",-1,true,"","","clock_timestamp()"]],"indexes":[["consents_pkey","CREATE UNIQUE INDEX consents_pkey ON assess.consents USING btree (user_id, version)",true,true]],"constraints":[["consents_pkey","p",false,false,true,"PRIMARY KEY (user_id, version)"],["consents_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["consents_version_check","c",false,false,true,"CHECK (version = ANY (ARRAY[''assess-pilot-2026-10-20-v1''::text, ''assess-pilot-2026-10-20-v2''::text]))"]]},"assess.receipts":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["operation_id","pg_catalog","uuid",-1,true,"","",null],["digest","pg_catalog","text",-1,true,"","",null],["ack","pg_catalog","jsonb",-1,true,"","",null]],"indexes":[["receipts_pkey","CREATE UNIQUE INDEX receipts_pkey ON assess.receipts USING btree (session_id, operation_id)",true,true]],"constraints":[["receipts_pkey","p",false,false,true,"PRIMARY KEY (session_id, operation_id)"],["receipts_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"]]},"assess.sessions":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null],["ordinal","pg_catalog","int4",-1,true,"","",null],["state","pg_catalog","text",-1,true,"","","''active''::text"],["revision","pg_catalog","int4",-1,true,"","","0"],["started_at","pg_catalog","timestamptz",-1,true,"","",null],["deadline","pg_catalog","timestamptz",-1,false,"","",null],["submitted_at","pg_catalog","timestamptz",-1,false,"","",null],["submission_op","pg_catalog","uuid",-1,false,"","",null],["submission_revision","pg_catalog","int4",-1,false,"","",null],["lease","pg_catalog","uuid",-1,false,"","",null],["lease_until","pg_catalog","timestamptz",-1,false,"","",null],["retry_at","pg_catalog","timestamptz",-1,false,"","",null],["failed_at","pg_catalog","timestamptz",-1,false,"","",null],["expires_at","pg_catalog","timestamptz",-1,false,"","",null]],"indexes":[["assess_one_active","CREATE UNIQUE INDEX assess_one_active ON assess.sessions USING btree (assignment_id, user_id) WHERE (state = ''active''::text)",true,true],["assess_sessions_assignment","CREATE INDEX assess_sessions_assignment ON assess.sessions USING btree (assignment_id)",true,true],["assess_sessions_due","CREATE INDEX assess_sessions_due ON assess.sessions USING btree (state, deadline, id)",true,true],["assess_sessions_expiry","CREATE INDEX assess_sessions_expiry ON assess.sessions USING btree (expires_at, id)",true,true],["assess_sessions_history","CREATE INDEX assess_sessions_history ON assess.sessions USING btree (user_id, id) WHERE (state = ''graded''::text)",true,true],["assess_sessions_retry","CREATE INDEX assess_sessions_retry ON assess.sessions USING btree (state, retry_at, lease_until, id)",true,true],["assess_sessions_user","CREATE INDEX assess_sessions_user ON assess.sessions USING btree (user_id)",true,true],["sessions_assignment_id_user_id_ordinal_key","CREATE UNIQUE INDEX sessions_assignment_id_user_id_ordinal_key ON assess.sessions USING btree (assignment_id, user_id, ordinal)",true,true],["sessions_pkey","CREATE UNIQUE INDEX sessions_pkey ON assess.sessions USING btree (id)",true,true]],"constraints":[["sessions_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["sessions_assignment_id_user_id_ordinal_key","u",false,false,true,"UNIQUE (assignment_id, user_id, ordinal)"],["sessions_pkey","p",false,false,true,"PRIMARY KEY (id)"],["sessions_state_check","c",false,false,true,"CHECK (state = ANY (ARRAY[''active''::text, ''grading''::text, ''grading-failed''::text, ''graded''::text, ''void''::text]))"],["sessions_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.versions":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["assessment_id","pg_catalog","uuid",-1,true,"","",null],["version","pg_catalog","text",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["track","pg_catalog","text",-1,true,"","",null],["schema_version","pg_catalog","int4",-1,true,"","","1"],["available","pg_catalog","bool",-1,true,"","","false"]],"indexes":[["assess_versions_owner_id","CREATE INDEX assess_versions_owner_id ON assess.versions USING btree (owner_id, id)",true,true],["versions_assessment_id_version_key","CREATE UNIQUE INDEX versions_assessment_id_version_key ON assess.versions USING btree (assessment_id, version)",true,true],["versions_pkey","CREATE UNIQUE INDEX versions_pkey ON assess.versions USING btree (id)",true,true]],"constraints":[["versions_assessment_id_version_key","u",false,false,true,"UNIQUE (assessment_id, version)"],["versions_name_check","c",false,false,true,"CHECK (length(btrim(name)) >= 1 AND length(btrim(name)) <= 200)"],["versions_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["versions_pkey","p",false,false,true,"PRIMARY KEY (id)"],["versions_schema_version_check","c",false,false,true,"CHECK (schema_version > 0)"],["versions_track_check","c",false,false,true,"CHECK (length(track) >= 1 AND length(track) <= 100)"],["versions_version_check","c",false,false,true,"CHECK (length(version) >= 1 AND length(version) <= 100)"]]},"assess.assignments":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["version_id","pg_catalog","uuid",-1,true,"","",null],["revision","pg_catalog","int4",-1,true,"","","1"],["source_group_ids","pg_catalog","_uuid",-1,true,"","","''{}''::uuid[]"],["published_at","pg_catalog","timestamptz",-1,true,"","","now()"],["closed_at","pg_catalog","timestamptz",-1,false,"","",null]],"indexes":[["assess_assignments_owner_id","CREATE INDEX assess_assignments_owner_id ON assess.assignments USING btree (owner_id, id)",true,true],["assess_closed_assignments","CREATE INDEX assess_closed_assignments ON assess.assignments USING btree (id) WHERE (closed_at IS NOT NULL)",true,true],["assess_one_open_assignment","CREATE UNIQUE INDEX assess_one_open_assignment ON assess.assignments USING btree (owner_id, version_id) WHERE (closed_at IS NULL)",true,true],["assignments_pkey","CREATE UNIQUE INDEX assignments_pkey ON assess.assignments USING btree (id)",true,true]],"constraints":[["assignments_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["assignments_pkey","p",false,false,true,"PRIMARY KEY (id)"],["assignments_revision_check","c",false,false,true,"CHECK (revision > 0)"],["assignments_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id)"]]},"assess.launch_gate":{"columns":[["singleton","pg_catalog","bool",-1,true,"","","true"],["enabled","pg_catalog","bool",-1,true,"","","false"]],"indexes":[["launch_gate_pkey","CREATE UNIQUE INDEX launch_gate_pkey ON assess.launch_gate USING btree (singleton)",true,true]],"constraints":[["launch_gate_pkey","p",false,false,true,"PRIMARY KEY (singleton)"],["launch_gate_singleton_check","c",false,false,true,"CHECK (singleton)"]]},"assess.memberships":{"columns":[["group_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null]],"indexes":[["assess_memberships_user","CREATE INDEX assess_memberships_user ON assess.memberships USING btree (user_id, group_id)",true,true],["memberships_pkey","CREATE UNIQUE INDEX memberships_pkey ON assess.memberships USING btree (group_id, user_id)",true,true]],"constraints":[["memberships_group_id_fkey","f",false,false,true,"FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE"],["memberships_pkey","p",false,false,true,"PRIMARY KEY (group_id, user_id)"],["memberships_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.publications":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["document","pg_catalog","jsonb",-1,true,"","",null],["specs","pg_catalog","jsonb",-1,true,"","",null],["created_at","pg_catalog","timestamptz",-1,true,"","","clock_timestamp()"]],"indexes":[["publications_pkey","CREATE UNIQUE INDEX publications_pkey ON assess.publications USING btree (version_id)",true,true]],"constraints":[["publications_document_check","c",false,false,true,"CHECK (pg_column_size(document) <= 2000000)"],["publications_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["publications_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id)"]]},"assess.reservations":{"columns":[["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null],["used","pg_catalog","int4",-1,true,"","","0"],["starts","pg_catalog","jsonb",-1,true,"","","''{}''::jsonb"]],"indexes":[["reservations_pkey","CREATE UNIQUE INDEX reservations_pkey ON assess.reservations USING btree (assignment_id, user_id)",true,true]],"constraints":[["reservations_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["reservations_pkey","p",false,false,true,"PRIMARY KEY (assignment_id, user_id)"],["reservations_used_check","c",false,false,true,"CHECK (used >= 0)"],["reservations_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.account_stops":{"columns":[["user_id","pg_catalog","uuid",-1,true,"","",null],["disabled_at","pg_catalog","timestamptz",-1,true,"","","clock_timestamp()"]],"indexes":[["account_stops_pkey","CREATE UNIQUE INDEX account_stops_pkey ON assess.account_stops USING btree (user_id)",true,true]],"constraints":[["account_stops_pkey","p",false,false,true,"PRIMARY KEY (user_id)"],["account_stops_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.session_details":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["publication","pg_catalog","jsonb",-1,true,"","",null],["specs","pg_catalog","jsonb",-1,true,"","",null],["answers","pg_catalog","jsonb",-1,true,"","","''{}''::jsonb"],["locked","pg_catalog","jsonb",-1,true,"","","''[]''::jsonb"]],"indexes":[["session_details_pkey","CREATE UNIQUE INDEX session_details_pkey ON assess.session_details USING btree (session_id)",true,true]],"constraints":[["session_details_pkey","p",false,false,true,"PRIMARY KEY (session_id)"],["session_details_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"]]},"assess.content_submissions":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["document","pg_catalog","jsonb",-1,false,"","",null],["state","pg_catalog","text",-1,true,"","","''pending''::text"]],"indexes":[["content_submissions_pkey","CREATE UNIQUE INDEX content_submissions_pkey ON assess.content_submissions USING btree (version_id)",true,true]],"constraints":[["content_submissions_check","c",false,false,true,"CHECK ((state = ''pending''::text) = (document IS NOT NULL))"],["content_submissions_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["content_submissions_state_check","c",false,false,true,"CHECK (state = ANY (ARRAY[''pending''::text, ''installed''::text]))"],["content_submissions_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE"]]},"assess.practical_presentations":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["views","pg_catalog","jsonb",-1,true,"","",null]],"indexes":[["practical_presentations_pkey","CREATE UNIQUE INDEX practical_presentations_pkey ON assess.practical_presentations USING btree (version_id)",true,true]],"constraints":[["practical_presentations_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["practical_presentations_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE"],["practical_presentations_views_check","c",false,false,true,"CHECK (jsonb_typeof(views) = ''object''::text AND pg_column_size(views) <= 2000000)"]]}}'::jsonb as schema_shape_matches),gate as (
 select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate
),columns_acl as (
 select not exists(select 1 from pg_class c cross join (values ('anon'),('authenticated'),('assess_worker')) r(name)
 where c.relnamespace=to_regnamespace('assess') and c.relkind in ('r','p')
 and has_any_column_privilege(r.name,c.oid,'SELECT,INSERT,UPDATE,REFERENCES')) as no_direct_column_grants
),triggers as (
 select count(*)=2 and bool_and(t.tgenabled='O' and t.tgconstraint=0 and t.tgqual is null
  and t.tgnargs=0 and octet_length(t.tgargs)=0 and t.tgattr=''::int2vector
  and not t.tgdeferrable and not t.tginitdeferred and t.tgoldtable is null and t.tgnewtable is null
  and ((t.tgrelid='assess.sessions'::regclass and t.tgname='assess_session_consent' and t.tgtype=7 and t.tgfoid=to_regprocedure('assess.require_consent_v1()'))
   or (t.tgrelid='assess.assignments'::regclass and t.tgname='assess_assignment_terminal' and t.tgtype=27 and t.tgfoid=to_regprocedure('assess.assignment_terminal_v1()')))) as trigger_contract_matches
 from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relnamespace=to_regnamespace('assess') and not t.tgisinternal
)
select 'assess-retention-install/1' as contract,
 catalogue.read_only,catalogue.catalogue_ready as retention_catalogue_ready,bodies.source_bodies_match as retention_source_bodies_match,
 shape.schema_shape_matches,columns_acl.no_direct_column_grants,triggers.trigger_contract_matches,gate.launch_gate_closed,
 catalogue.catalogue_ready and bodies.source_bodies_match and shape.schema_shape_matches and columns_acl.no_direct_column_grants
  and triggers.trigger_contract_matches and gate.launch_gate_closed as installation_valid,
 false as backup_verified,false as recovery_verified,false as provider_backups_verified,false as runtime_or_launch_verified
from catalogue cross join bodies cross join shape cross join gate cross join triggers cross join columns_acl
 ) q;
 if not coalesce(allowed,false) then raise exception 'Retention postcondition failed; transaction must roll back';end if;
end $postcondition$;
commit;
-- This final row is emitted only after COMMIT; earlier rows are not installation evidence.
begin read only;
set local search_path='';
with catalogue as (with expected_tables(name) as (values
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
  union all select 'assess.consents'
  union all select 'assess.account_stops'
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
  union all select signature,audience from (values
    ('assess.consent_v1(text)','user'),
    ('assess.history_page_v1(uuid,integer)','user'),
    ('assess.require_consent_v1()','internal')
  ) f(signature,audience)
  union all select signature,audience from (values
    ('assess.assignment_terminal_v1()','internal'),
    ('assess.close_assignment_v1(uuid)','user'),
    ('assess.disable_account_v1(uuid)','user'),
    ('assess.consent_v2(text)','user')
  ) r(signature,audience)
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
from checks),bodies as (with expected_bodies(name,digest,crlf_digest) as (values
 ('group_write_v1','1cf0ef392a79a99f728da8903814ddcfc9c0910e89dc51d9dc1e5f6ad4553ae8','43f2ae773ec8efaf2d6f3e2e93203f8d7d870b54583a860e99835496d40f0c21'),
 ('members_write_v1','1789ac46865b450360fb8d1644e5596691fa3bc85c04f59fa61b1e5b3ca41060','55d88b4b7817c4356408d2a55e9e805179fba211468dbfd216a3bfbe2cb29591'),
 ('assign_v1','c3886247c8b61f601f7ae869d07465cfae800fb7821736a86e1e1235f50ee1e4','74c481837cdb6ae6e7d67f7f6ec1eb879ea1d8f118cc12be0ecb9056613a7617'),
 ('targets_write_v1','f2b7aa109447ffc5237bcd2312d4566b7a7f71b3cb6c072be1b4c3ab03178f53','d20262e01a6f81744d45e133221b40a10f653d46e4a60b307c7701ece55837c4'),
 ('owner_page_v1','fe4eee7cc88111fe1a68b63a36a0b74e618f34d64d5857ff1a5bc0cde29d3e7f','5203ed66c2cc90b1d48d5a1cda2cb4f2ead2c286818c7a9637d6996700752ff9'),
 ('assigned_version_v1','a659c221ff9184f0c1defae7bc4157f4bc205e3a501d2e6ade4dfbe18df1c3bb','ded902985e103acfe3f2c3aa875052adddd552c9582483b76f401f650d4b8253'),
 ('install_publication_v1','6c198420efc157a0f0b2605d9618e7b2941aaadae707c74968df16395e3521e9','c4f318ecef61705f16155a976820b3fbc7db9325fd67a009c872abfcf3dd5443'),
 ('session_authorize_v1','f4475e949d292ae610595d820d46f457c549987780cfe2025ab31abd2a014db6','17c353a1b053bb2f2b7f7cef831bd27ff3d1a69eb7e0f8bbde1337e1c7d3941f'),
 ('session_ack_v1','24a26227091099c3fb8c0fbdfd478bb0ca4c18cd0d21375eb1a21d8897c66187','1f5ad7536ffb06ccb62aff9b136e37d1c2f70a1a5f07f3420eaf1dcf2b099bd8'),
 ('start_v1','c90cf06f0e71d85909df2cbf6ff78ebf9b11311c4c274474ba8a984254dba3d8','04a50490580df3094b2a07339249ccd872b27b13fbd8f767ba35c18e970fc5be'),
 ('read_session_v1','cfaa04b87af01609fd4cbe83ef1cabcd34aab39c6f409894035c0303bd902546','19094a897ec987874dc81875ddbdd053e66e98d3e1dfdbcd6effb1e49dcfd612'),
 ('validate_answer_v1','443ef959d33e6eb3da6498aff60cc0cf385cc172d811b6f2bc03ae6c4fd9019d','7ac0f1c2053ba7df97d296f2cd6ad24876c774a7a3a08fd6e3742d98578c5a7b'),
 ('command_v1','b8d969b9e7dda62fae77150f445e77756e6332cf1c1df382605a127377d6fdf6','34fcc73719583e90c494389c73115e11cc9247e44f591083bcc9eeadf16facb6'),
 ('result_v1','0826d17d24bf374dfc1cc3b2ba9f7d05a5b671a70f61638792750fbb4ed5d803','b6aaeeca530b8c930949fb13282c6ceaa8174b74f1517ad782be469c76af0583'),
 ('maintain_v1','e8f098adfc59b406ec4546bf73220aca0fa26b3c01e707708edd525f4e3d74ee','209c46e19cd198f8cbad7be113e7dc25b1f0d75e3b7f93e7c8e2d8b960b1f8e9'),
 ('claim_v1','649a0e9a990c85b4d7e8dff0cfe57bc4e5a0b4292f1f8539f05a4bf5a1fa73a3','dd15b25b24edf2241c482963e85bf69e7195447d5f2fc72b5bd0107ce816547e'),
 ('finish_v1','cf69d6824d61dec9ad4b1d0e9187a113a248188f4dcf32ec1e260c950e989c8b','61d7f09dd4afd302a1dac2bbed996629e64cd9b5197d3f676e12014b263bfa2d'),
 ('fail_v1','812fd82f88340a71d13f1742dc9b17c2bdc2cafff239c547de4c9efd924da585','4c22c8b7aee828faac9bbc3db7ec5c20cc60044cb790fd1cd6c80c9f7c46ed83'),
 ('recover_v1','a1b8827868f3bedddfc924ed55102d3fd07bf186fc981b267b129863ff4d01f0','6de033d89a8a055ac099af385cd4c9183dd894e6ab656b335784a48531b4ee95'),
 ('health_v1','e8625fca0d23bc66fcd9ee43a94ea40daaadff3d4d718ee3c564f38ab57590f1','9ecb1bca9212a18bb331352312716a7c7e2048ce94c5ad63adc4ee73f8dd655b'),
 ('content_submit_v1','0bddc286f600170ef321cb722ed3f06d635046d24b9e4134ffb648f3aa9352de','5e044260494de586c21996f8c322b20646c2d90eca426c0ac7b388b917fe7e67'),
 ('content_page_v1','d0d1a4f6eea23527c84aa1da5c43bad1721120b048aa7090895bfdef6506b014','12d0902398f6784c1e9df48b4831650a49359e05f582ece16d223aabf556da03'),
 ('content_read_v1','7694935ebab7924049d1adb84d443b300224b8db322f0415cbe5cf2cb3524a26','39229a319515337fad0078cb332cd8dc657a95c3b68b880a1453b82b0cd56be8'),
 ('content_install_v1','1454d2b2d3d6ed8357fda011ad27685191924eeaea1067dbf01d7643db4f53cb','9b6fcc3ff252502f10406b948b17917e906c7fe4316eb760be0a162ca2338fe5'),
 ('assigned_page_v1','29b69f7e8f96f540d22cb4ab2584f9912a3277fc7dc7d5dea841993c115d0f05','9d2909556f0e627a8038e768cb27677ff38c07b105cee2e302fc3c62d36e8e84'),
 ('read_mixed_session_v1','0841acf0ad8679e7bdc2cb8020101de27b4b603da256016844e149c7ad35c246','b8c8a3b81118eccd893a164eea7870380be683a7122139ef65acfca88aef364e'),
 ('content_install_practical_v1','2957e1de08e7e036e1ccab1d0c101158902d44088a7481925615de3bbf036c66','89883ea033bd04a88978b6df7f7343bfb9f9b43a27e1c36e01b832c5a8199b04'),
 ('assigned_practical_page_v1','d3fc72d1a450c1611fe0928dc72d83c3efbc75ab94e1ecd2414c9c2c6d6051f6','04a9210b6b1b7166212a4e6746ce8ac8dbca6e7b4994b76d8db560516a77f424'),
 ('read_practical_session_v1','02a5d026d71bb186f269c76fff55d8b7cf21ed504e152580d999d50cfe5ade6b','03ccfc076b927fa2848148822ecd4a6133c24ce7193f0dac43a9da0e931a2b5a'),
 ('consent_v1','2e291c206398e04dae60770fe74a5f0fbda3b81b0291ed1174326b40cdf6b6ad','8930e2cff49c856be5d9cfba600c9085db02b9bfadb2c902d1f95ce6e50d9d2b'),
 ('require_consent_v1','305d51b87267bb6ceb2efd24851578e852b6582d981c68b5cc4c5db1432297bd','0756d1f0b85a78506c9590cfd316e3edd74bfc892d651f792a2532b0db33a184'),
 ('history_page_v1','0bd639f7c93130a5ed1702f3e24f926fe02e4dba6bde476a4691eea78599e24a','0be6904667e36da520b28920d746227eaf92a6168e60b69a0b25db4cca9ba555'),
 ('assignment_terminal_v1','31fb00a6e66d2bfc66cf728d409e96fddaaa6d9a99b6dbcb4cee44ed7d78708a','a3017c7bb5be18a975573613c08658ce60afae34ece46016b0cc64465ce25bb8'),
 ('close_assignment_v1','69f3af425117d0cb7957109200612842ade0686d651ce9c075172e6761190b24','1f112fa5892fd7777f1b5dc9b454bd1f4259924eb04deb27ba9c22fb5b563301'),
 ('disable_account_v1','1626079f79e5626f929d1d6487972b567ac141f48cfe28eb9536d7d643245908','a3a72dc96bb25783d7343081ef93c30c0f438777a5b39a95a7eba0c18d4385b8'),
 ('consent_v2','f2de0aa43c3dff6c67479b51e75a1ff6e9c795bf25c3c1d1288ccee938070642','05a2ea9e38cdfac9eafd99d75827138385a22edef5aacc86fdbf80b4819e3a4a')
) select not exists(select 1 from expected_bodies e left join pg_proc p on p.pronamespace=to_regnamespace('assess') and p.proname=e.name where coalesce(encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') in (e.digest,e.crlf_digest),false)=false) as source_bodies_match),shape as (select (select coalesce(jsonb_object_agg(n.nspname||'.'||c.relname,jsonb_build_object(
 'columns',(select coalesce(jsonb_agg(jsonb_build_array(a.attname,tn.nspname,t.typname,a.atttypmod,a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid)) order by a.attnum),'[]'::jsonb) from pg_attribute a join pg_type t on t.oid=a.atttypid join pg_namespace tn on tn.oid=t.typnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
 'constraints',(select coalesce(jsonb_agg(jsonb_build_array(k.conname,k.contype,k.condeferrable,k.condeferred,k.convalidated,pg_get_constraintdef(k.oid,true)) order by k.conname),'[]'::jsonb) from pg_constraint k where k.conrelid=c.oid and k.contype<>'n'),
 'indexes',(select coalesce(jsonb_agg(jsonb_build_array(ic.relname,pg_get_indexdef(i.indexrelid),i.indisvalid,i.indisready) order by ic.relname),'[]'::jsonb) from pg_index i join pg_class ic on ic.oid=i.indexrelid where i.indrelid=c.oid)
)),'{}'::jsonb) as doc from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p'))='{"assess.groups":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["created_at","pg_catalog","timestamptz",-1,true,"","","now()"]],"indexes":[["assess_groups_owner_id","CREATE INDEX assess_groups_owner_id ON assess.groups USING btree (owner_id, id)",true,true],["groups_pkey","CREATE UNIQUE INDEX groups_pkey ON assess.groups USING btree (id)",true,true]],"constraints":[["groups_name_check","c",false,false,true,"CHECK (length(btrim(name)) >= 1 AND length(btrim(name)) <= 100)"],["groups_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["groups_pkey","p",false,false,true,"PRIMARY KEY (id)"]]},"assess.results":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["earned_n","pg_catalog","numeric",-1,true,"","",null],["earned_d","pg_catalog","numeric",-1,true,"","",null],["maximum","pg_catalog","numeric",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["track","pg_catalog","text",-1,true,"","",null],["visibility","pg_catalog","text",-1,true,"","",null]],"indexes":[["results_pkey","CREATE UNIQUE INDEX results_pkey ON assess.results USING btree (session_id)",true,true]],"constraints":[["results_earned_d_check","c",false,false,true,"CHECK (earned_d > 0::numeric)"],["results_earned_n_check","c",false,false,true,"CHECK (earned_n >= 0::numeric)"],["results_maximum_check","c",false,false,true,"CHECK (maximum > 0::numeric)"],["results_pkey","p",false,false,true,"PRIMARY KEY (session_id)"],["results_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"],["results_visibility_check","c",false,false,true,"CHECK (visibility = ANY (ARRAY[''hidden''::text, ''after-submission''::text]))"]]},"assess.targets":{"columns":[["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null]],"indexes":[["assess_targets_user_assignment","CREATE INDEX assess_targets_user_assignment ON assess.targets USING btree (user_id, assignment_id)",true,true],["targets_pkey","CREATE UNIQUE INDEX targets_pkey ON assess.targets USING btree (assignment_id, user_id)",true,true]],"constraints":[["targets_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["targets_pkey","p",false,false,true,"PRIMARY KEY (assignment_id, user_id)"],["targets_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.consents":{"columns":[["user_id","pg_catalog","uuid",-1,true,"","",null],["version","pg_catalog","text",-1,true,"","",null],["accepted_at","pg_catalog","timestamptz",-1,true,"","","clock_timestamp()"]],"indexes":[["consents_pkey","CREATE UNIQUE INDEX consents_pkey ON assess.consents USING btree (user_id, version)",true,true]],"constraints":[["consents_pkey","p",false,false,true,"PRIMARY KEY (user_id, version)"],["consents_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["consents_version_check","c",false,false,true,"CHECK (version = ANY (ARRAY[''assess-pilot-2026-10-20-v1''::text, ''assess-pilot-2026-10-20-v2''::text]))"]]},"assess.receipts":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["operation_id","pg_catalog","uuid",-1,true,"","",null],["digest","pg_catalog","text",-1,true,"","",null],["ack","pg_catalog","jsonb",-1,true,"","",null]],"indexes":[["receipts_pkey","CREATE UNIQUE INDEX receipts_pkey ON assess.receipts USING btree (session_id, operation_id)",true,true]],"constraints":[["receipts_pkey","p",false,false,true,"PRIMARY KEY (session_id, operation_id)"],["receipts_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"]]},"assess.sessions":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null],["ordinal","pg_catalog","int4",-1,true,"","",null],["state","pg_catalog","text",-1,true,"","","''active''::text"],["revision","pg_catalog","int4",-1,true,"","","0"],["started_at","pg_catalog","timestamptz",-1,true,"","",null],["deadline","pg_catalog","timestamptz",-1,false,"","",null],["submitted_at","pg_catalog","timestamptz",-1,false,"","",null],["submission_op","pg_catalog","uuid",-1,false,"","",null],["submission_revision","pg_catalog","int4",-1,false,"","",null],["lease","pg_catalog","uuid",-1,false,"","",null],["lease_until","pg_catalog","timestamptz",-1,false,"","",null],["retry_at","pg_catalog","timestamptz",-1,false,"","",null],["failed_at","pg_catalog","timestamptz",-1,false,"","",null],["expires_at","pg_catalog","timestamptz",-1,false,"","",null]],"indexes":[["assess_one_active","CREATE UNIQUE INDEX assess_one_active ON assess.sessions USING btree (assignment_id, user_id) WHERE (state = ''active''::text)",true,true],["assess_sessions_assignment","CREATE INDEX assess_sessions_assignment ON assess.sessions USING btree (assignment_id)",true,true],["assess_sessions_due","CREATE INDEX assess_sessions_due ON assess.sessions USING btree (state, deadline, id)",true,true],["assess_sessions_expiry","CREATE INDEX assess_sessions_expiry ON assess.sessions USING btree (expires_at, id)",true,true],["assess_sessions_history","CREATE INDEX assess_sessions_history ON assess.sessions USING btree (user_id, id) WHERE (state = ''graded''::text)",true,true],["assess_sessions_retry","CREATE INDEX assess_sessions_retry ON assess.sessions USING btree (state, retry_at, lease_until, id)",true,true],["assess_sessions_user","CREATE INDEX assess_sessions_user ON assess.sessions USING btree (user_id)",true,true],["sessions_assignment_id_user_id_ordinal_key","CREATE UNIQUE INDEX sessions_assignment_id_user_id_ordinal_key ON assess.sessions USING btree (assignment_id, user_id, ordinal)",true,true],["sessions_pkey","CREATE UNIQUE INDEX sessions_pkey ON assess.sessions USING btree (id)",true,true]],"constraints":[["sessions_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["sessions_assignment_id_user_id_ordinal_key","u",false,false,true,"UNIQUE (assignment_id, user_id, ordinal)"],["sessions_pkey","p",false,false,true,"PRIMARY KEY (id)"],["sessions_state_check","c",false,false,true,"CHECK (state = ANY (ARRAY[''active''::text, ''grading''::text, ''grading-failed''::text, ''graded''::text, ''void''::text]))"],["sessions_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.versions":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["assessment_id","pg_catalog","uuid",-1,true,"","",null],["version","pg_catalog","text",-1,true,"","",null],["name","pg_catalog","text",-1,true,"","",null],["track","pg_catalog","text",-1,true,"","",null],["schema_version","pg_catalog","int4",-1,true,"","","1"],["available","pg_catalog","bool",-1,true,"","","false"]],"indexes":[["assess_versions_owner_id","CREATE INDEX assess_versions_owner_id ON assess.versions USING btree (owner_id, id)",true,true],["versions_assessment_id_version_key","CREATE UNIQUE INDEX versions_assessment_id_version_key ON assess.versions USING btree (assessment_id, version)",true,true],["versions_pkey","CREATE UNIQUE INDEX versions_pkey ON assess.versions USING btree (id)",true,true]],"constraints":[["versions_assessment_id_version_key","u",false,false,true,"UNIQUE (assessment_id, version)"],["versions_name_check","c",false,false,true,"CHECK (length(btrim(name)) >= 1 AND length(btrim(name)) <= 200)"],["versions_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["versions_pkey","p",false,false,true,"PRIMARY KEY (id)"],["versions_schema_version_check","c",false,false,true,"CHECK (schema_version > 0)"],["versions_track_check","c",false,false,true,"CHECK (length(track) >= 1 AND length(track) <= 100)"],["versions_version_check","c",false,false,true,"CHECK (length(version) >= 1 AND length(version) <= 100)"]]},"assess.assignments":{"columns":[["id","pg_catalog","uuid",-1,true,"","","gen_random_uuid()"],["owner_id","pg_catalog","uuid",-1,true,"","",null],["version_id","pg_catalog","uuid",-1,true,"","",null],["revision","pg_catalog","int4",-1,true,"","","1"],["source_group_ids","pg_catalog","_uuid",-1,true,"","","''{}''::uuid[]"],["published_at","pg_catalog","timestamptz",-1,true,"","","now()"],["closed_at","pg_catalog","timestamptz",-1,false,"","",null]],"indexes":[["assess_assignments_owner_id","CREATE INDEX assess_assignments_owner_id ON assess.assignments USING btree (owner_id, id)",true,true],["assess_closed_assignments","CREATE INDEX assess_closed_assignments ON assess.assignments USING btree (id) WHERE (closed_at IS NOT NULL)",true,true],["assess_one_open_assignment","CREATE UNIQUE INDEX assess_one_open_assignment ON assess.assignments USING btree (owner_id, version_id) WHERE (closed_at IS NULL)",true,true],["assignments_pkey","CREATE UNIQUE INDEX assignments_pkey ON assess.assignments USING btree (id)",true,true]],"constraints":[["assignments_owner_id_fkey","f",false,false,true,"FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"],["assignments_pkey","p",false,false,true,"PRIMARY KEY (id)"],["assignments_revision_check","c",false,false,true,"CHECK (revision > 0)"],["assignments_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id)"]]},"assess.launch_gate":{"columns":[["singleton","pg_catalog","bool",-1,true,"","","true"],["enabled","pg_catalog","bool",-1,true,"","","false"]],"indexes":[["launch_gate_pkey","CREATE UNIQUE INDEX launch_gate_pkey ON assess.launch_gate USING btree (singleton)",true,true]],"constraints":[["launch_gate_pkey","p",false,false,true,"PRIMARY KEY (singleton)"],["launch_gate_singleton_check","c",false,false,true,"CHECK (singleton)"]]},"assess.memberships":{"columns":[["group_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null]],"indexes":[["assess_memberships_user","CREATE INDEX assess_memberships_user ON assess.memberships USING btree (user_id, group_id)",true,true],["memberships_pkey","CREATE UNIQUE INDEX memberships_pkey ON assess.memberships USING btree (group_id, user_id)",true,true]],"constraints":[["memberships_group_id_fkey","f",false,false,true,"FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE"],["memberships_pkey","p",false,false,true,"PRIMARY KEY (group_id, user_id)"],["memberships_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.publications":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["document","pg_catalog","jsonb",-1,true,"","",null],["specs","pg_catalog","jsonb",-1,true,"","",null],["created_at","pg_catalog","timestamptz",-1,true,"","","clock_timestamp()"]],"indexes":[["publications_pkey","CREATE UNIQUE INDEX publications_pkey ON assess.publications USING btree (version_id)",true,true]],"constraints":[["publications_document_check","c",false,false,true,"CHECK (pg_column_size(document) <= 2000000)"],["publications_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["publications_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id)"]]},"assess.reservations":{"columns":[["assignment_id","pg_catalog","uuid",-1,true,"","",null],["user_id","pg_catalog","uuid",-1,true,"","",null],["used","pg_catalog","int4",-1,true,"","","0"],["starts","pg_catalog","jsonb",-1,true,"","","''{}''::jsonb"]],"indexes":[["reservations_pkey","CREATE UNIQUE INDEX reservations_pkey ON assess.reservations USING btree (assignment_id, user_id)",true,true]],"constraints":[["reservations_assignment_id_fkey","f",false,false,true,"FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE"],["reservations_pkey","p",false,false,true,"PRIMARY KEY (assignment_id, user_id)"],["reservations_used_check","c",false,false,true,"CHECK (used >= 0)"],["reservations_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.account_stops":{"columns":[["user_id","pg_catalog","uuid",-1,true,"","",null],["disabled_at","pg_catalog","timestamptz",-1,true,"","","clock_timestamp()"]],"indexes":[["account_stops_pkey","CREATE UNIQUE INDEX account_stops_pkey ON assess.account_stops USING btree (user_id)",true,true]],"constraints":[["account_stops_pkey","p",false,false,true,"PRIMARY KEY (user_id)"],["account_stops_user_id_fkey","f",false,false,true,"FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE"]]},"assess.session_details":{"columns":[["session_id","pg_catalog","uuid",-1,true,"","",null],["publication","pg_catalog","jsonb",-1,true,"","",null],["specs","pg_catalog","jsonb",-1,true,"","",null],["answers","pg_catalog","jsonb",-1,true,"","","''{}''::jsonb"],["locked","pg_catalog","jsonb",-1,true,"","","''[]''::jsonb"]],"indexes":[["session_details_pkey","CREATE UNIQUE INDEX session_details_pkey ON assess.session_details USING btree (session_id)",true,true]],"constraints":[["session_details_pkey","p",false,false,true,"PRIMARY KEY (session_id)"],["session_details_session_id_fkey","f",false,false,true,"FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE"]]},"assess.content_submissions":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["document","pg_catalog","jsonb",-1,false,"","",null],["state","pg_catalog","text",-1,true,"","","''pending''::text"]],"indexes":[["content_submissions_pkey","CREATE UNIQUE INDEX content_submissions_pkey ON assess.content_submissions USING btree (version_id)",true,true]],"constraints":[["content_submissions_check","c",false,false,true,"CHECK ((state = ''pending''::text) = (document IS NOT NULL))"],["content_submissions_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["content_submissions_state_check","c",false,false,true,"CHECK (state = ANY (ARRAY[''pending''::text, ''installed''::text]))"],["content_submissions_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE"]]},"assess.practical_presentations":{"columns":[["version_id","pg_catalog","uuid",-1,true,"","",null],["views","pg_catalog","jsonb",-1,true,"","",null]],"indexes":[["practical_presentations_pkey","CREATE UNIQUE INDEX practical_presentations_pkey ON assess.practical_presentations USING btree (version_id)",true,true]],"constraints":[["practical_presentations_pkey","p",false,false,true,"PRIMARY KEY (version_id)"],["practical_presentations_version_id_fkey","f",false,false,true,"FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE"],["practical_presentations_views_check","c",false,false,true,"CHECK (jsonb_typeof(views) = ''object''::text AND pg_column_size(views) <= 2000000)"]]}}'::jsonb as schema_shape_matches),gate as (
 select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate
),columns_acl as (
 select not exists(select 1 from pg_class c cross join (values ('anon'),('authenticated'),('assess_worker')) r(name)
 where c.relnamespace=to_regnamespace('assess') and c.relkind in ('r','p')
 and has_any_column_privilege(r.name,c.oid,'SELECT,INSERT,UPDATE,REFERENCES')) as no_direct_column_grants
),triggers as (
 select count(*)=2 and bool_and(t.tgenabled='O' and t.tgconstraint=0 and t.tgqual is null
  and t.tgnargs=0 and octet_length(t.tgargs)=0 and t.tgattr=''::int2vector
  and not t.tgdeferrable and not t.tginitdeferred and t.tgoldtable is null and t.tgnewtable is null
  and ((t.tgrelid='assess.sessions'::regclass and t.tgname='assess_session_consent' and t.tgtype=7 and t.tgfoid=to_regprocedure('assess.require_consent_v1()'))
   or (t.tgrelid='assess.assignments'::regclass and t.tgname='assess_assignment_terminal' and t.tgtype=27 and t.tgfoid=to_regprocedure('assess.assignment_terminal_v1()')))) as trigger_contract_matches
 from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relnamespace=to_regnamespace('assess') and not t.tgisinternal
)
select 'assess-retention-install/1' as contract,
 catalogue.read_only,catalogue.catalogue_ready as retention_catalogue_ready,bodies.source_bodies_match as retention_source_bodies_match,
 shape.schema_shape_matches,columns_acl.no_direct_column_grants,triggers.trigger_contract_matches,gate.launch_gate_closed,
 catalogue.catalogue_ready and bodies.source_bodies_match and shape.schema_shape_matches and columns_acl.no_direct_column_grants
  and triggers.trigger_contract_matches and gate.launch_gate_closed as installation_valid,
 false as backup_verified,false as recovery_verified,false as provider_backups_verified,false as runtime_or_launch_verified
from catalogue cross join bodies cross join shape cross join gate cross join triggers cross join columns_acl;
rollback;
