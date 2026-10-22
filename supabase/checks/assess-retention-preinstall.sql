-- READ ONLY, diagnostic only. Select the intended original project vlacestfruxooznrcjqc manually.
-- Never apply the raw retention migration from a passing row. Stop for owner review first.
-- Reuses the reviewed F post-install catalogue/shape/trigger and finite LF/CRLF source baselines.
-- No normalization, learner rows, source bodies, secrets, writes, migration replay or gate changes.
-- Errors/missing prerequisites/drift/partial or existing policy installation are STOP.
-- SQL cannot verify project identity, a pre-change backup, restore, provider retention or authorization.
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
from catalogue cross join bodies cross join shape cross join gate cross join triggers cross join columns_acl cross join retention;
rollback;
