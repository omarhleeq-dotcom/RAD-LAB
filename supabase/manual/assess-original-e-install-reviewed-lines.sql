-- Reviewed finite LF/CRLF source hashes; NO runtime normalization, trimming or arbitrary re-pinning.
-- Original LF-only artifacts remain unchanged. See ASSESS_E_REPORT_2026-10-20: reviewed line endings.
-- MANUAL E-ONLY INSTALL. Original project vlacestfruxooznrcjqc: verify the SQL Editor selector manually.
-- Owner explicitly instructed proceeding on the original without a current backup on 2026-10-20.
-- This is a one-operation exception, not verified recovery or a general backup-policy change.
-- Run the WHOLE file ONCE as the sole operator. No B/C/D replay, seeds, worker/runtime, gate or attestation change.
-- Any error before COMMIT aborts the transaction. Post-COMMIT recovery is not provided by this file.
-- SQL cannot verify the Supabase project URL. Administrative credentials stay with the owner.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtextextended('radlab-assess-e-install/1',0));
do $precondition$
declare allowed boolean;
begin
 perform 1 from assess.launch_gate where singleton for update;
 select ready_for_e_install into allowed from (
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
  tables_present and rls_enabled and roles_present and functions_present and schema_privileges and definer_and_empty_search_path
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
from catalogue cross join bodies cross join gate
 ) q;
 if not coalesce(allowed,false) then raise exception 'E precondition failed. Stop; do not drop objects or replay B/C/D';end if;
end $precondition$;

-- SOURCE E BEGIN SHA256 2c78c5aee4ed13facba05b90a1ee9fbe5d79f890def4030b5b2580ed8554f476
-- E only: reviewed full-practical presentation. No public/Practice changes, seeds, gate or runtime deployment.
create table assess.practical_presentations (
  version_id uuid primary key references assess.versions(id) on delete cascade,
  views jsonb not null check(jsonb_typeof(views)='object' and pg_column_size(views)<=2000000)
);
alter table assess.practical_presentations enable row level security;
revoke all on assess.practical_presentations from public,anon,authenticated,assess_worker;

-- Extend immutable owner submission to the second independent track; D's signature and semantics remain.
create or replace function assess.content_submit_v1(p_document jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare a jsonb; vid uuid; aid uuid;
begin
  perform 1 from public.profiles where user_id=auth.uid() for update;
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_document is null or pg_column_size(p_document)>2000000 or octet_length(p_document::text)>2000000 then
    raise exception 'document limit' using errcode='22023'; end if;
  a:=p_document->'assessment';
  if coalesce(a->>'track','') not in ('mixed','full-practical') or a->>'schemaVersion' is distinct from '1'
    or length(btrim(a->>'name')) not between 1 and 200
    or length(a->'ref'->>'version') not between 1 and 100 then raise exception 'invalid metadata' using errcode='22023'; end if;
  aid:=(a->'ref'->>'id')::uuid;
  -- Serialize all versions of one assessment and prevent another owner's version takeover.
  perform pg_advisory_xact_lock(hashtextextended(aid::text,0));
  if exists(select 1 from assess.versions where assessment_id=aid and owner_id<>auth.uid()) then raise exception 'denied' using errcode='42501'; end if;
  if (select count(*) from assess.content_submissions c join assess.versions v on v.id=c.version_id where v.owner_id=auth.uid() and c.state='pending')>=20 then
    raise exception 'pending limit' using errcode='54000'; end if;
  insert into assess.versions(owner_id,assessment_id,version,name,track)
    values(auth.uid(),aid,a->'ref'->>'version',a->>'name',a->>'track') returning id into vid;
  insert into assess.content_submissions(version_id,document) values(vid,p_document);
  return vid;
end $$;

create function assess.content_install_practical_v1(p_version uuid,p_specs jsonb,p_views jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare doc jsonb;
begin
  select document into strict doc from assess.content_submissions where version_id=p_version and state='pending' for update;
  if doc->'assessment'->>'track' is distinct from 'full-practical' or p_views is null
    or jsonb_typeof(p_views) is distinct from 'object' or pg_column_size(p_views)>2000000
    or (select count(*) from jsonb_object_keys(p_views))<>jsonb_array_length(doc->'assessment'->'items') then
    raise exception 'invalid practical presentation' using errcode='22023'; end if;
  -- Trusted Node validator supplies only render geometry, neutral selectors and initial values.
  perform assess.install_publication_v1(p_version,doc,p_specs);
  insert into assess.practical_presentations(version_id,views) values(p_version,p_views);
  update assess.versions set available=true where id=p_version;
  update assess.content_submissions set state='installed',document=null where version_id=p_version;
end $$;

create function assess.assigned_practical_page_v1(p_after uuid default null,p_limit integer default 20) returns jsonb
language plpgsql security definer set search_path='' as $$
declare rows jsonb;
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select a.id,v.name,v.version from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id join assess.practical_presentations p on p.version_id=v.id
    where t.user_id=auth.uid() and v.available and v.track='full-practical' and v.schema_version=1
      and (p_after is null or a.id>p_after) order by a.id limit p_limit
  ) q;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;

create function assess.read_practical_session_v1(p_session uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb; views jsonb; pinned jsonb;
begin
  result:=assess.read_session_v1(p_session); -- C owns identity/target, row lock, time and terminal-detail deletion.
  if result->'ack'->>'state'<>'active' then return result; end if;
  if result->'assessment'->>'track'<>'full-practical' then raise exception 'practical only' using errcode='55000'; end if;
  pinned:=result->'assessment'->'ref';
  -- Resolve the immutable snapshot's version, never a newest-version or mutable assignment lookup.
  select p.views into strict views from assess.practical_presentations p join assess.versions v on v.id=p.version_id
    where v.assessment_id=(pinned->>'id')::uuid and v.version=pinned->>'version';
  return result || jsonb_build_object('views',views);
end $$;
revoke all on function assess.content_install_practical_v1(uuid,jsonb,jsonb),assess.assigned_practical_page_v1(uuid,integer),assess.read_practical_session_v1(uuid) from public,anon,authenticated,assess_worker;
grant execute on function assess.assigned_practical_page_v1(uuid,integer),assess.read_practical_session_v1(uuid) to authenticated;
grant execute on function assess.content_install_practical_v1(uuid,jsonb,jsonb) to assess_worker;
-- SOURCE E END

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
  tables_present and rls_enabled and roles_present and functions_present and schema_privileges and definer_and_empty_search_path
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
 ('content_submit_v1','0bddc286f600170ef321cb722ed3f06d635046d24b9e4134ffb648f3aa9352de','5e044260494de586c21996f8c322b20646c2d90eca426c0ac7b388b917fe7e67'),
 ('content_page_v1','d0d1a4f6eea23527c84aa1da5c43bad1721120b048aa7090895bfdef6506b014','12d0902398f6784c1e9df48b4831650a49359e05f582ece16d223aabf556da03'),
 ('content_read_v1','7694935ebab7924049d1adb84d443b300224b8db322f0415cbe5cf2cb3524a26','39229a319515337fad0078cb332cd8dc657a95c3b68b880a1453b82b0cd56be8'),
 ('content_install_v1','1454d2b2d3d6ed8357fda011ad27685191924eeaea1067dbf01d7643db4f53cb','9b6fcc3ff252502f10406b948b17917e906c7fe4316eb760be0a162ca2338fe5'),
 ('assigned_page_v1','29b69f7e8f96f540d22cb4ab2584f9912a3277fc7dc7d5dea841993c115d0f05','9d2909556f0e627a8038e768cb27677ff38c07b105cee2e302fc3c62d36e8e84'),
 ('read_mixed_session_v1','0841acf0ad8679e7bdc2cb8020101de27b4b603da256016844e149c7ad35c246','b8c8a3b81118eccd893a164eea7870380be683a7122139ef65acfca88aef364e'),
 ('content_install_practical_v1','2957e1de08e7e036e1ccab1d0c101158902d44088a7481925615de3bbf036c66','89883ea033bd04a88978b6df7f7343bfb9f9b43a27e1c36e01b832c5a8199b04'),
 ('assigned_practical_page_v1','d3fc72d1a450c1611fe0928dc72d83c3efbc75ab94e1ecd2414c9c2c6d6051f6','04a9210b6b1b7166212a4e6746ce8ac8dbca6e7b4994b76d8db560516a77f424'),
 ('read_practical_session_v1','02a5d026d71bb186f269c76fff55d8b7cf21ed504e152580d999d50cfe5ade6b','03ccfc076b927fa2848148822ecd4a6133c24ce7193f0dac43a9da0e931a2b5a')
) select not exists(select 1 from expected_bodies e left join pg_proc p on p.pronamespace=to_regnamespace('assess') and p.proname=e.name where coalesce(encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') in (e.digest,e.crlf_digest),false)=false) as source_bodies_match) select catalogue.catalogue_ready and bodies.source_bodies_match and (select count(*)=1 and coalesce(bool_and(not enabled),false) from assess.launch_gate) as installation_valid from catalogue cross join bodies
 ) q;
 if not coalesce(allowed,false) then raise exception 'E postcondition failed; transaction must roll back';end if;
end $postcondition$;
commit;
