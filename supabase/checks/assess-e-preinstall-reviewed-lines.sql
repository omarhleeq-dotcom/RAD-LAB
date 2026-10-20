-- Reviewed finite LF/CRLF source hashes; NO runtime normalization, trimming or arbitrary re-pinning.
-- Original LF-only artifacts remain unchanged. See ASSESS_E_REPORT_2026-10-20: reviewed line endings.
-- READ ONLY. Original project vlacestfruxooznrcjqc: verify the SQL Editor project selector manually.
-- C/D catalogue + source-body fingerprints + CLOSED gate + E absent. No learner data or writes.
-- Does not verify a backup/restore, database identity, capacity, provider runtime or installation success.
-- Requires the existing C/D foundation; a missing relation/error is STOP, never permission to replay C/D.
begin read only;
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
  ('assess.content_submissions')
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
  ('assess.install_publication_v1(uuid,jsonb,jsonb)','worker'),
  ('assess.maintain_v1(integer)','worker'),
  ('assess.claim_v1()','worker'),
  ('assess.finish_v1(uuid,uuid,text,text)','worker'),
  ('assess.fail_v1(uuid,uuid)','worker'),
  ('assess.recover_v1(uuid)','worker'),
  ('assess.health_v1()','worker'),
  ('assess.content_read_v1(uuid)','worker'),
  ('assess.content_install_v1(uuid,jsonb)','worker'),
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
from checks), bodies as (with expected_bodies(name,digest,crlf_digest) as (values
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
 ('content_submit_v1','e37ac82c55ff3d237fa46781612eb4bdd0801d2e1e46e5fe7c2512e642b0d920','76421863566c78ca0e7c04b6ff27df9afe97c5949b9bb676cebaf8a03f509f81'),
 ('content_page_v1','d0d1a4f6eea23527c84aa1da5c43bad1721120b048aa7090895bfdef6506b014','12d0902398f6784c1e9df48b4831650a49359e05f582ece16d223aabf556da03'),
 ('content_read_v1','7694935ebab7924049d1adb84d443b300224b8db322f0415cbe5cf2cb3524a26','39229a319515337fad0078cb332cd8dc657a95c3b68b880a1453b82b0cd56be8'),
 ('content_install_v1','1454d2b2d3d6ed8357fda011ad27685191924eeaea1067dbf01d7643db4f53cb','9b6fcc3ff252502f10406b948b17917e906c7fe4316eb760be0a162ca2338fe5'),
 ('assigned_page_v1','29b69f7e8f96f540d22cb4ab2584f9912a3277fc7dc7d5dea841993c115d0f05','9d2909556f0e627a8038e768cb27677ff38c07b105cee2e302fc3c62d36e8e84'),
 ('read_mixed_session_v1','0841acf0ad8679e7bdc2cb8020101de27b4b603da256016844e149c7ad35c246','b8c8a3b81118eccd893a164eea7870380be683a7122139ef65acfca88aef364e')
) select not exists(select 1 from expected_bodies e left join pg_proc p on p.pronamespace=to_regnamespace('assess') and p.proname=e.name where coalesce(encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') in (e.digest,e.crlf_digest),false)=false) as source_bodies_match), gate as (
 select count(*)=1 and coalesce(bool_and(not enabled),false) as launch_gate_closed from assess.launch_gate
)
select 'assess-e-preinstall-reviewed-lines/1' as preinstall_contract,catalogue.read_only,catalogue.catalogue_ready as cd_catalogue_ready,
 bodies.source_bodies_match as cd_source_bodies_match,gate.launch_gate_closed,
 to_regclass('assess.practical_presentations') is null as e_absent,
 catalogue.catalogue_ready and bodies.source_bodies_match and gate.launch_gate_closed
 and to_regclass('assess.practical_presentations') is null as ready_for_e_install,
 false as recovery_verified,false as runtime_or_launch_verified
from catalogue cross join bodies cross join gate;
rollback;
