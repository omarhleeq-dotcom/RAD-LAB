--
-- PostgreSQL database dump
--

\restrict 8omV3jvkZvTdshlRRahQgVeB1YSs0fVyFiejj8Es5arqjx5DVSBqfKR3GAqVtUJ

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11 (Ubuntu 17.11-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: assess; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA assess;


ALTER SCHEMA assess OWNER TO postgres;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone',
    'recovery_code'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_realtime_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_realtime_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_realtime_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_realtime_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_realtime_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: account_management_v1(text, uuid, text, uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.account_management_v1(p_action text, p_user uuid DEFAULT NULL::uuid, p_digest text DEFAULT NULL::text, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rows jsonb;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if p_action='list' then
  perform assess.owner_scope_enter_v1(false);
  if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.user_id),'[]') into rows from (
   select q.user_id,q.requested_at,q.requested_at+interval '30 days' transfer_before,q.requested_at+interval '37 days' erase_by,
    t.transferred_at,assess.d3_needs_transfer_v1(q.user_id) requires_transfer,
    (t.user_id is null and assess.d3_needs_transfer_v1(q.user_id) and q.requested_at+interval '25 days'<=clock_timestamp()) transfer_alert,
    q.requested_at+interval '30 days'<=clock_timestamp() finalise_due,
    q.requested_at+interval '37 days'<=clock_timestamp() overdue
   from public.c2_account_deletions q left join assess.erasure_transfers t on t.user_id=q.user_id and t.requested_at=q.requested_at
   where p_after is null or q.user_id>p_after order by q.user_id limit p_limit) x;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'user_id' else null end);
 end if;
 if p_user is null or p_user=auth.uid() then raise exception 'owner target required' using errcode='42501'; end if;
 if p_action='preview' then
  perform assess.owner_scope_enter_v1(false);
  if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
  return assess.d3_inventory_v1(p_user);
 end if;
 if p_action='transfer' then return assess.transfer_management_d3_v1(p_user,p_digest); end if;
 raise exception 'invalid action' using errcode='22023';
end $$;


ALTER FUNCTION assess.account_management_v1(p_action text, p_user uuid, p_digest text, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: appointment_v1(uuid, boolean); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.appointment_v1(p_user uuid, p_appoint boolean) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare r integer;
begin
 perform assess.scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 perform 1 from public.profiles where user_id=p_user for share;
 if p_appoint is null or not exists(select 1 from public.profiles where user_id=p_user)
 or (p_appoint and not exists(select 1 from public.profiles where user_id=p_user and role='participant' and status='approved'))
 then raise exception 'invalid appointment' using errcode='22023'; end if;
 if p_appoint then
  insert into assess.supervisor_appointments(user_id,appointed_by,appointed_at) values(p_user,auth.uid(),clock_timestamp())
  on conflict(user_id) do update set appointed_by=excluded.appointed_by,appointed_at=excluded.appointed_at,
   revoked_at=null,revision=assess.supervisor_appointments.revision+1 where assess.supervisor_appointments.revoked_at is not null;
 else
  update assess.supervisor_appointments set revoked_at=clock_timestamp(),revision=revision+1 where user_id=p_user and revoked_at is null;
  update assess.group_join_codes c set revoked_at=clock_timestamp() from assess.groups g where c.group_id=g.id and g.supervisor_id=p_user;
 end if;
 select revision into r from assess.supervisor_appointments where user_id=p_user;
 return r;
end $$;


ALTER FUNCTION assess.appointment_v1(p_user uuid, p_appoint boolean) OWNER TO postgres;

--
-- Name: assign_v1(uuid, uuid[], uuid[]); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assign_v1(p_version uuid, p_users uuid[] DEFAULT '{}'::uuid[], p_groups uuid[] DEFAULT '{}'::uuid[]) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare aid uuid; sources uuid[]; n integer;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  perform 1 from assess.versions where id=p_version and owner_id=auth.uid() and available
    and schema_version=1 and track in ('mixed','full-practical') for share;
  if not found then raise exception 'version denied' using errcode='42501'; end if;
  if p_users is null or p_groups is null or cardinality(p_users)>100 or cardinality(p_groups)>100
    or cardinality(p_users)+cardinality(p_groups)=0 or array_position(p_users,null) is not null
    or array_position(p_groups,null) is not null then raise exception 'invalid targets' using errcode='22023'; end if;
  -- Group locks match membership edits/deletion; sorted lock order prevents reversed-group deadlocks.
  perform id from assess.groups where id=any(p_groups) and owner_id=auth.uid() order by id for update;
  if exists(select 1 from unnest(p_groups) g where not exists(select 1 from assess.groups where id=g and owner_id=auth.uid())) then
    raise exception 'group denied' using errcode='42501'; end if;
  if exists(select 1 from unnest(p_users) u where not exists(select 1 from public.profiles p where p.user_id=u and p.role='participant')) then
    raise exception 'unknown participant' using errcode='22023'; end if;
  select coalesce(array_agg(distinct g order by g),'{}') into sources from unnest(p_groups) g;
  insert into assess.assignments(owner_id,version_id,source_group_ids) values(auth.uid(),p_version,sources) returning id into aid;
  insert into assess.targets(assignment_id,user_id)
    select aid,u from (select unnest(p_users) u union select m.user_id from assess.memberships m where m.group_id=any(p_groups)) q limit 10001;
  get diagnostics n=row_count;
  if n not between 1 and 10000 then raise exception 'target count outside operational limit' using errcode='22023'; end if;
  return aid;
end $$;


ALTER FUNCTION assess.assign_v1(p_version uuid, p_users uuid[], p_groups uuid[]) OWNER TO postgres;

--
-- Name: assigned_page_v1(uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assigned_page_v1(p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rows jsonb;
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select a.id,v.name,v.version from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id join assess.publications p on p.version_id=v.id
    where t.user_id=auth.uid() and v.available and v.track='mixed' and v.schema_version=1
      and (p_after is null or a.id>p_after) order by a.id limit p_limit
  ) q;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;


ALTER FUNCTION assess.assigned_page_v1(p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: assigned_practical_page_v1(uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assigned_practical_page_v1(p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


ALTER FUNCTION assess.assigned_practical_page_v1(p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: assigned_version_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assigned_version_v1(p_assignment uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare result jsonb;
begin
  if not public.is_approved() then raise exception 'approved account required' using errcode='42501'; end if;
  select jsonb_build_object('schemaVersion',1,'assignmentId',a.id,'assignmentRevision',a.revision,
    'assessmentId',v.assessment_id,'version',v.version,'name',v.name,'track',v.track) into result
  from assess.assignments a join assess.targets t on t.assignment_id=a.id join assess.versions v on v.id=a.version_id
  where a.id=p_assignment and t.user_id=auth.uid() and v.available and v.schema_version=1 and v.track in ('mixed','full-practical');
  if result is null then raise exception 'assignment denied' using errcode='42501'; end if;
  return result;
end $$;


ALTER FUNCTION assess.assigned_version_v1(p_assignment uuid) OWNER TO postgres;

--
-- Name: assignment_close_v2(uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assignment_close_v2(p_assignment uuid, p_revision integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare a assess.assignments; gid uuid;
begin
 perform assess.scope_enter_v1(true);
 select * into a from assess.assignments where id=p_assignment and (owner_id=auth.uid() or (public.is_owner() and exists(select 1 from assess.assignment_managers m where m.assignment_id=p_assignment and m.manager_id=auth.uid()))) for update;
 if a.id is null then raise exception 'assignment denied' using errcode='42501'; end if;
 -- The owner/D3-manager path is separate and unchanged.
 if public.is_owner() then
  if a.closed_at is not null then return; end if;
  if a.revision is distinct from p_revision then raise exception 'assignment changed' using errcode='40001'; end if;
  perform assess.close_assignment_v1(a.id); return;
 end if;
 -- RAD085-SEC-FIXES-20261027 SEC-01: after the locks and before any receipt or change,
 -- the issuing group must belong to the caller, be unended and keep an active appointment.
 select s.group_id into gid from assess.assignment_scopes s where s.assignment_id=a.id and s.supervisor_id=auth.uid();
 if gid is null then raise exception 'assignment denied' using errcode='42501'; end if;
 perform assess.supervised_group_v1(gid);
 if a.closed_at is not null then return; end if;
 if a.revision is distinct from p_revision then raise exception 'assignment changed' using errcode='40001'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=a.id;
 -- The deadline may pass while writing; a failure here rolls the closure back.
 perform assess.supervised_group_v1(gid);
end $$;


ALTER FUNCTION assess.assignment_close_v2(p_assignment uuid, p_revision integer) OWNER TO postgres;

--
-- Name: assignment_confirm_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assignment_confirm_v1(p_review uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare r assess.assignment_reviews; g assess.groups; d assess.authoring_drafts; aid uuid; ts timestamptz;
begin
 perform assess.scope_enter_v1(true);
 select * into r from assess.assignment_reviews where id=p_review and writer_id=auth.uid();
 if r.id is null then raise exception 'review denied' using errcode='42501'; end if;
 -- Authorized replay returns the original receipt after review expiry, never after
 -- group end/expiry, revocation or loss of the group; never recreates targets.
 if r.assignment_id is not null then
  perform assess.supervised_group_v1(r.group_id);
  return r.assignment_id;
 end if;
 g:=assess.supervised_group_v1(r.group_id); ts:=clock_timestamp();
 if r.expires_at<=ts then raise exception 'review expired' using errcode='55000'; end if;
 if r.group_revision<>g.scope_revision or not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revision=r.appointment_revision and revoked_at is null) then
  raise exception 'scope changed' using errcode='40001'; end if;
 select * into d from assess.authoring_drafts where id=r.draft_id and writer_id=auth.uid() and group_id=g.id;
 if d.revision is distinct from r.draft_revision then raise exception 'draft changed' using errcode='40001'; end if;
 perform assess.validate_draft_v1(d.document,d.refs);
 if assess.linked_version_v1(d.id,d.revision)<>r.version_id then raise exception 'version changed' using errcode='40001'; end if;
 perform 1 from assess.versions where id=r.version_id for share;
 perform p.user_id from public.profiles p join assess.memberships m on m.user_id=p.user_id where m.group_id=g.id order by p.user_id for share of p;
 if exists(
  (select user_id,period_id,visible_from from assess.visible_members_v1(g.id)
   except select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id)
  union all
  (select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id
   except select user_id,period_id,visible_from from assess.visible_members_v1(g.id))
 ) then raise exception 'targets changed' using errcode='40001'; end if;
 -- Recheck server time after all possibly blocking locks, not transaction start time.
 if clock_timestamp()>=least(r.expires_at,g.ends_at) then raise exception 'review expired' using errcode='55000'; end if;
 insert into assess.assignments(owner_id,version_id,source_group_ids) values(auth.uid(),r.version_id,array[g.id]) returning id into aid;
 insert into assess.targets select aid,user_id from assess.assignment_review_targets where review_id=r.id;
 insert into assess.assignment_scopes values(aid,g.id,auth.uid(),r.id);
 update assess.assignment_reviews set assignment_id=aid where id=r.id;
 return aid;
end $$;


ALTER FUNCTION assess.assignment_confirm_v1(p_review uuid) OWNER TO postgres;

--
-- Name: assignment_page_v2(uuid, uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assignment_page_v2(p_group uuid DEFAULT NULL::uuid, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rows jsonb;
begin
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if not public.is_owner() then perform assess.supervised_group_v1(p_group); end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select a.id,v.name,v.track,v.version,a.revision,a.closed_at from assess.assignments a join assess.versions v on v.id=a.version_id
  where (a.owner_id=auth.uid() or (public.is_owner() and exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid()))) and (public.is_owner() or exists(select 1 from assess.assignment_scopes s where s.assignment_id=a.id and s.group_id=p_group and s.supervisor_id=auth.uid()))
  and (p_after is null or a.id>p_after) order by a.id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;


ALTER FUNCTION assess.assignment_page_v2(p_group uuid, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: assignment_prepare_v1(uuid, uuid, integer, uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assignment_prepare_v1(p_group uuid, p_draft uuid, p_revision integer, p_operation uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare g assess.groups; d assess.authoring_drafts; r assess.assignment_reviews; v uuid; n integer; ts timestamptz; target_digest text;
begin
 perform assess.scope_enter_v1(true); g:=assess.supervised_group_v1(p_group); ts:=clock_timestamp();
 if p_operation is null then raise exception 'operation required' using errcode='22023'; end if;
 select * into d from assess.authoring_drafts where id=p_draft and writer_id=auth.uid() and group_id=g.id;
 if d.id is null then raise exception 'draft denied' using errcode='42501'; end if;
 if d.revision is distinct from p_revision then raise exception 'draft changed' using errcode='40001'; end if;
 perform assess.validate_draft_v1(d.document,d.refs);
 if jsonb_array_length(d.document->'items')=0 or length(btrim(d.document->>'name'))=0 then
  raise exception 'incomplete draft' using errcode='22023'; end if;
 v:=assess.linked_version_v1(d.id,d.revision);
 select * into r from assess.assignment_reviews where id=p_operation;
 if r.id is not null then
  if r.writer_id<>auth.uid() or r.group_id<>g.id or r.draft_id<>d.id or r.draft_revision<>d.revision or r.version_id<>v then
   raise exception 'operation conflict' using errcode='40001'; end if;
  r:=assess.review_current_v1(r.id);
 else
  delete from assess.assignment_reviews where writer_id=auth.uid() and assignment_id is null and expires_at<=ts;
  if (select count(*) from assess.assignment_reviews where writer_id=auth.uid() and assignment_id is null)>=20 then
   raise exception 'pending review limit' using errcode='54000'; end if;
  -- SHARE profile locks make membership approval/status changes serialize with this snapshot.
  perform p.user_id from public.profiles p join assess.memberships m on m.user_id=p.user_id where m.group_id=g.id order by p.user_id for share of p;
  select count(*) into n from assess.visible_members_v1(g.id);
  if n not between 1 and 1000 then raise exception 'target count outside limit' using errcode='22023'; end if;
  insert into assess.assignment_reviews(id,writer_id,group_id,group_revision,appointment_revision,draft_id,draft_revision,version_id,source_digest,expires_at,created_at)
   select p_operation,auth.uid(),g.id,g.scope_revision,a.revision,d.id,d.revision,v,s.digest,least(ts+interval '5 minutes',g.ends_at),ts
   from assess.supervisor_appointments a,assess.authoring_revisions s where a.user_id=auth.uid() and s.draft_id=d.id and s.revision=d.revision returning * into r;
  insert into assess.assignment_review_targets select r.id,user_id,period_id,visible_from from assess.visible_members_v1(g.id);
 end if;
 select count(*) into n from assess.assignment_review_targets where review_id=r.id;
 select encode(sha256(convert_to(coalesce(jsonb_agg(jsonb_build_array(user_id,period_id,visible_from) order by user_id),'[]')::text,'UTF8')),'hex')
 into target_digest from assess.assignment_review_targets where review_id=r.id;
 return jsonb_build_object('token',r.id,'draftId',r.draft_id,'draftRevision',r.draft_revision,'groupId',r.group_id,'groupRevision',r.group_revision,
  'versionId',r.version_id,'sourceDigest',r.source_digest,'targetDigest',target_digest,'targetCount',n,'expiresAt',r.expires_at,'serverNow',ts);
end $$;


ALTER FUNCTION assess.assignment_prepare_v1(p_group uuid, p_draft uuid, p_revision integer, p_operation uuid) OWNER TO postgres;

--
-- Name: assignment_targets_v1(uuid, uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assignment_targets_v1(p_review uuid, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare r assess.assignment_reviews; rows jsonb;
begin
 perform assess.scope_enter_v1(false);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 r:=assess.review_current_v1(p_review);
 -- Frozen targets may not expose students who have since left/withdrawn consent.
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select t.user_id id,p.display_name from assess.assignment_review_targets t
  join assess.visible_members_v1(r.group_id) m on m.user_id=t.user_id and m.period_id=t.period_id and m.visible_from=t.visible_from
  join public.profiles p on p.user_id=t.user_id
  where t.review_id=r.id and (p_after is null or t.user_id>p_after) order by t.user_id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;


ALTER FUNCTION assess.assignment_targets_v1(p_review uuid, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: assignment_terminal_v1(); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.assignment_terminal_v1() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 if tg_op='UPDATE' and assess.d3_erasing_v1(old.owner_id) and new.owner_id is null
  and to_jsonb(new)-'owner_id'=to_jsonb(old)-'owner_id'
  and exists(select 1 from assess.assignment_managers m where m.assignment_id=old.id and m.manager_id=auth.uid()) then return new; end if;
 if old.closed_at is not null and (tg_op='DELETE' or new.closed_at is distinct from old.closed_at
   or new.id is distinct from old.id or new.owner_id is distinct from old.owner_id or new.version_id is distinct from old.version_id) then
  raise exception 'permanently closed' using errcode='42501'; end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;


ALTER FUNCTION assess.assignment_terminal_v1() OWNER TO postgres;

--
-- Name: authoring_bridge_bind_v1(uuid, uuid, integer, uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.authoring_bridge_bind_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare checked jsonb; d assess.authoring_drafts; r assess.authoring_revisions;
begin
 checked:=assess.authoring_bridge_read_v1(p_group,p_draft,p_revision);
 select * into strict d from assess.authoring_drafts where id=p_draft;
 select * into strict r from assess.authoring_revisions where draft_id=p_draft and revision=p_revision;
 perform 1 from assess.versions where id=p_version for share;
 if not exists(select 1 from assess.versions v join assess.content_submissions c on c.version_id=v.id and c.state='installed'
 join assess.publications p on p.version_id=v.id and p.document=checked->'reviewed'->'publication'
 where v.id=p_version and v.owner_id=auth.uid() and v.assessment_id=d.id and v.version=d.revision::text and v.track=d.track and v.schema_version=1 and v.available
 and (v.track='mixed' or exists(select 1 from assess.practical_presentations pp where pp.version_id=v.id))) then
  raise exception 'exact installed publication required' using errcode='55000'; end if;
 if exists(select 1 from assess.authoring_publication_links where draft_id=p_draft and draft_revision=p_revision and (version_id<>p_version or source_digest<>r.digest)) then
  raise exception 'publication link conflict' using errcode='40001'; end if;
 insert into assess.authoring_publication_links values(p_version,p_draft,p_revision,r.digest) on conflict(draft_id,draft_revision) do nothing;
 perform assess.supervised_group_v1(p_group);
end $$;


ALTER FUNCTION assess.authoring_bridge_bind_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid) OWNER TO postgres;

--
-- Name: authoring_bridge_candidate_v1(uuid, uuid, integer, uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.authoring_bridge_candidate_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare checked jsonb; doc jsonb;
begin
 checked:=assess.authoring_bridge_read_v1(p_group,p_draft,p_revision);
 select c.document into doc from assess.content_submissions c join assess.versions v on v.id=c.version_id
 where c.version_id=p_version and c.state='pending' and v.owner_id=auth.uid() and v.assessment_id=p_draft and v.version=p_revision::text for update of c,v;
 if doc is null or doc is distinct from checked->'reviewed'->'publication' then raise exception 'candidate denied' using errcode='42501'; end if;
 perform assess.supervised_group_v1(p_group);
 return doc;
end $$;


ALTER FUNCTION assess.authoring_bridge_candidate_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid) OWNER TO postgres;

--
-- Name: authoring_bridge_install_v1(uuid, uuid, integer, uuid, jsonb, jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.authoring_bridge_install_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid, p_specs jsonb, p_views jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare doc jsonb;
begin
 doc:=assess.authoring_bridge_candidate_v1(p_group,p_draft,p_revision,p_version);
 if doc->'assessment'->>'track'='full-practical' then
  perform assess.content_install_practical_v1(p_version,p_specs,p_views);
 else
  if p_views is not null then raise exception 'mixed views denied' using errcode='22023'; end if;
  perform assess.content_install_v1(p_version,p_specs);
 end if;
 perform assess.supervised_group_v1(p_group);
end $$;


ALTER FUNCTION assess.authoring_bridge_install_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid, p_specs jsonb, p_views jsonb) OWNER TO postgres;

--
-- Name: authoring_bridge_read_v1(uuid, uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.authoring_bridge_read_v1(p_group uuid, p_draft uuid, p_revision integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare d assess.authoring_drafts; r assess.authoring_revisions; pkg assess.authoring_reviewed_packages; linked uuid;
begin
 perform assess.scope_enter_v1(true); perform assess.supervised_group_v1(p_group);
 select * into d from assess.authoring_drafts where id=p_draft and group_id=p_group and writer_id=auth.uid() for update;
 if d.id is null then raise exception 'draft denied' using errcode='42501'; end if;
 if d.revision is distinct from p_revision then raise exception 'draft changed' using errcode='40001'; end if;
 perform ar.key from assess.authoring_references ar join jsonb_array_elements(d.refs) q on ar.key=q->>'key' order by ar.key for share of ar;
 perform assess.validate_draft_v1(d.document,d.refs);
 select * into strict r from assess.authoring_revisions where draft_id=d.id and revision=d.revision;
 if r.document is distinct from d.document or r.refs is distinct from d.refs then raise exception 'revision changed' using errcode='40001'; end if;
 select * into pkg from assess.authoring_reviewed_packages where draft_id=d.id and draft_revision=d.revision for share;
 if pkg.draft_id is null or pkg.source_digest<>r.digest then raise exception 'independent review required' using errcode='55000'; end if;
 if pkg.document->'assessment'->'ref'->>'id' is distinct from d.id::text
 or pkg.document->'assessment'->'ref'->>'version' is distinct from d.revision::text
 or pkg.document->'assessment'->>'track' is distinct from d.track then raise exception 'review revision changed' using errcode='40001'; end if;
 if exists(select 1 from assess.authoring_publication_links where draft_id=d.id and draft_revision=d.revision) then
  linked:=assess.linked_version_v1(d.id,d.revision);
  if not exists(select 1 from assess.publications where version_id=linked and document=pkg.document) then raise exception 'publication changed' using errcode='40001'; end if;
 end if;
 -- Locks above can wait beyond the group deadline. Recheck before returning private data.
 perform assess.supervised_group_v1(p_group);
 return jsonb_build_object('snapshot',jsonb_build_object('document',r.document,'refs',r.refs,'digest',r.digest),
  'reviewed',jsonb_build_object('sourceDigest',pkg.source_digest,'publication',pkg.document),'installedVersion',linked);
end $$;


ALTER FUNCTION assess.authoring_bridge_read_v1(p_group uuid, p_draft uuid, p_revision integer) OWNER TO postgres;

--
-- Name: claim_v1(); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.claim_v1() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare s assess.sessions; d assess.session_details; ts timestamptz:=clock_timestamp(); token uuid:=gen_random_uuid();
begin
  select * into s from assess.sessions where state in ('grading','grading-failed')
    and submitted_at>ts-interval '7 days' and (retry_at is null or retry_at<=ts) and (lease_until is null or lease_until<=ts)
    order by submitted_at,id limit 1 for update skip locked;
  if s.id is null then return null; end if;
  update assess.sessions set state='grading',lease=token,lease_until=ts+interval '5 minutes' where id=s.id;
  select * into strict d from assess.session_details where session_id=s.id;
  return jsonb_build_object('attemptId',s.id,'token',token,'publication',d.publication,'answers',d.answers,'locked',d.locked);
end $$;


ALTER FUNCTION assess.claim_v1() OWNER TO postgres;

--
-- Name: close_assignment_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.close_assignment_v1(p_assignment uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 perform assess.scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
 perform 1 from assess.assignments a where a.id=p_assignment and (a.owner_id=auth.uid()
  or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=auth.uid())) for update;
 if not found then raise exception 'assignment denied' using errcode='42501'; end if;
 update assess.assignments set closed_at=clock_timestamp(),revision=revision+1 where id=p_assignment and closed_at is null;
end $$;


ALTER FUNCTION assess.close_assignment_v1(p_assignment uuid) OWNER TO postgres;

--
-- Name: command_v1(uuid, uuid, integer, jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.command_v1(p_session uuid, p_operation uuid, p_revision integer, p_action jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare s assess.sessions; d assess.session_details; r assess.receipts; b jsonb; a jsonb; item jsonb; iid text; ts timestamptz;
begin
  select * into s from assess.sessions where id=p_session and user_id=auth.uid() for update;
  if s.id is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v1(s.assignment_id);
  if p_operation is null or p_revision is null or p_revision<0 or p_action is null or octet_length(p_action::text)>65536
    or jsonb_typeof(p_action)<>'object' then raise exception 'invalid command' using errcode='22023'; end if;
  b:=jsonb_build_object('revision',p_revision,'action',p_action);
  select * into r from assess.receipts where session_id=s.id and operation_id=p_operation;
  if r.operation_id is not null then
    if r.digest<>encode(sha256(convert_to(b::text,'UTF8')),'hex') then raise exception 'operation reused' using errcode='22023'; end if;
    return r.ack;
  end if;
  -- Only a structurally identical submit can replay after transient receipts are removed.
  if s.state='graded' and s.submission_op=p_operation and s.submission_revision=p_revision and p_action='{"type":"submit"}'::jsonb
    and clock_timestamp()<s.expires_at then return assess.session_ack_v1(s.id,p_operation); end if;
  ts:=clock_timestamp();
  if s.state<>'active' then raise exception 'attempt frozen' using errcode='55000'; end if;
  if ts>=s.deadline then
    -- Return an authoritative expiry ack; do not raise and roll back the freeze.
    update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
    return assess.session_ack_v1(s.id,p_operation) || '{"accepted":false,"reason":"deadline"}'::jsonb;
  end if;
  if p_revision<>s.revision then raise exception 'revision conflict' using errcode='40001'; end if;
  select * into strict d from assess.session_details where session_id=s.id;
  if p_action->>'type' in ('save','expose') then
    if p_action - array['type','item','answer'] <> '{}' or jsonb_typeof(p_action->'item') is distinct from 'object'
      or (p_action->'item') - array['id','version']<>'{}' then raise exception 'invalid action' using errcode='22023'; end if;
    iid:=p_action->'item'->>'id';
    select i into item from jsonb_array_elements(d.publication->'assessment'->'items') i where i->'ref'=p_action->'item';
    perform assess.validate_answer_v1(item,d.specs->iid,p_action->'answer');
    if d.locked ? iid then raise exception 'item locked' using errcode='55000'; end if;
    if p_action->>'type'='expose' and item->>'type'='single-choice' then raise exception 'invalid exposure' using errcode='22023'; end if;
    update assess.session_details set answers=jsonb_set(answers,array[iid],p_action->'answer'),
      locked=case when p_action->>'type'='expose' then locked||jsonb_build_array(iid) else locked end where session_id=s.id;
  elsif p_action='{"type":"submit"}'::jsonb then
    update assess.sessions set state='grading',submitted_at=ts,submission_op=p_operation,submission_revision=p_revision where id=s.id;
  else raise exception 'invalid action' using errcode='22023'; end if;
  update assess.sessions set revision=revision+1 where id=s.id;
  if p_action->>'type'<>'submit' and (select count(*) from assess.receipts where session_id=s.id)>=20000 then raise exception 'command limit' using errcode='54000'; end if;
  a:=assess.session_ack_v1(s.id,p_operation);
  insert into assess.receipts values(s.id,p_operation,encode(sha256(convert_to(b::text,'UTF8')),'hex'),a);
  return a;
end $$;


ALTER FUNCTION assess.command_v1(p_session uuid, p_operation uuid, p_revision integer, p_action jsonb) OWNER TO postgres;

--
-- Name: consent_v1(text); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.consent_v1(p_version text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


ALTER FUNCTION assess.consent_v1(p_version text) OWNER TO postgres;

--
-- Name: consent_v2(text); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.consent_v2(p_version text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


ALTER FUNCTION assess.consent_v2(p_version text) OWNER TO postgres;

--
-- Name: content_install_practical_v1(uuid, jsonb, jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.content_install_practical_v1(p_version uuid, p_specs jsonb, p_views jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


ALTER FUNCTION assess.content_install_practical_v1(p_version uuid, p_specs jsonb, p_views jsonb) OWNER TO postgres;

--
-- Name: content_install_v1(uuid, jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.content_install_v1(p_version uuid, p_specs jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare doc jsonb;
begin
  select document into strict doc from assess.content_submissions where version_id=p_version and state='pending' for update;
  perform assess.install_publication_v1(p_version,doc,p_specs);
  update assess.versions set available=true where id=p_version;
  update assess.content_submissions set state='installed',document=null where version_id=p_version;
end $$;


ALTER FUNCTION assess.content_install_v1(p_version uuid, p_specs jsonb) OWNER TO postgres;

--
-- Name: content_page_v1(uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.content_page_v1(p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rows jsonb;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select v.id,v.name,v.version,c.state from assess.content_submissions c join assess.versions v on v.id=c.version_id
    where v.owner_id=auth.uid() and (p_after is null or v.id>p_after) order by v.id limit p_limit
  ) q;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;


ALTER FUNCTION assess.content_page_v1(p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: content_read_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.content_read_v1(p_version uuid) RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select document from assess.content_submissions where version_id=p_version and state='pending'
$$;


ALTER FUNCTION assess.content_read_v1(p_version uuid) OWNER TO postgres;

--
-- Name: content_submit_v1(jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.content_submit_v1(p_document jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare a jsonb; vid uuid; aid uuid; gid uuid; checked jsonb;
begin
  if current_setting('role',true)='assess_authoring_bridge' then
    select group_id into gid from assess.authoring_drafts where id=(p_document->'assessment'->'ref'->>'id')::uuid and writer_id=auth.uid();
    if gid is null then raise exception 'draft denied' using errcode='42501'; end if;
    checked:=assess.authoring_bridge_read_v1(gid,(p_document->'assessment'->'ref'->>'id')::uuid,(p_document->'assessment'->'ref'->>'version')::integer);
    if p_document is distinct from checked->'reviewed'->'publication' then raise exception 'review package changed' using errcode='40001'; end if;
  else
    perform 1 from public.profiles where user_id=auth.uid() for update;
    if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  end if;
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
  -- The bridge may have waited on the assessment advisory lock or INSERT constraints.
  if gid is not null then perform assess.supervised_group_v1(gid); end if;
  return vid;
end $$;


ALTER FUNCTION assess.content_submit_v1(p_document jsonb) OWNER TO postgres;

--
-- Name: d3_erasing_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.d3_erasing_v1(p_user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
 select public.is_owner() and exists(select 1 from assess.erasure_transfers t
 where t.user_id=p_user and t.erasing_xid=txid_current() and t.manager_id=auth.uid())
$$;


ALTER FUNCTION assess.d3_erasing_v1(p_user uuid) OWNER TO postgres;

--
-- Name: d3_fk_inventory_v1(); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.d3_fk_inventory_v1() RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
 select coalesce(jsonb_agg(jsonb_build_array(n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid)) order by n.nspname,c.relname,k.conname),'[]')
 from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace
 where n.nspname<>'auth' and k.contype='f' and k.confrelid in ('public.profiles'::regclass,'auth.users'::regclass)
$$;


ALTER FUNCTION assess.d3_fk_inventory_v1() OWNER TO postgres;

--
-- Name: d3_inventory_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.d3_inventory_v1(p_user uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare inventory jsonb; content jsonb; n integer;
begin
 if (select expected.inventory from assess.erasure_fk_contract expected where singleton) is distinct from assess.d3_fk_inventory_v1() then
  raise exception 'D3 FK inventory changed' using errcode='55000'; end if;
 -- Finite pilot ceiling: STOP for explicit paged operational review, never truncate.
 with affected(kind,row) as (
  select 'groups',to_jsonb(g) from assess.groups g where g.owner_id=p_user or g.supervisor_id=p_user or exists(select 1 from assess.group_managers m where m.group_id=g.id and m.manager_id=p_user)
  union all select 'versions',to_jsonb(v) from assess.versions v where v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)
  union all select 'assignments',to_jsonb(a) from assess.assignments a where a.owner_id=p_user or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=p_user)
  union all select 'drafts',to_jsonb(d) from assess.authoring_drafts d where d.writer_id=p_user
  union all select 'reviews',to_jsonb(r) from assess.assignment_reviews r where r.writer_id=p_user
  union all select 'scopes',to_jsonb(s) from assess.assignment_scopes s where s.supervisor_id=p_user
  union all select 'appointments',to_jsonb(a) from assess.supervisor_appointments a where a.appointed_by=p_user or a.user_id=p_user
  union all select 'decisions',to_jsonb(r) from assess.group_join_requests r where r.decided_by=p_user
  union all select 'groupManagers',to_jsonb(m) from assess.group_managers m where m.manager_id=p_user or exists(select 1 from assess.groups g where g.id=m.group_id and (g.owner_id=p_user or g.supervisor_id=p_user))
  union all select 'versionManagers',to_jsonb(m) from assess.version_managers m where m.manager_id=p_user or exists(select 1 from assess.versions v where v.id=m.version_id and v.owner_id=p_user)
  union all select 'assignmentManagers',to_jsonb(m) from assess.assignment_managers m where m.manager_id=p_user or exists(select 1 from assess.assignments a where a.id=m.assignment_id and a.owner_id=p_user)
  union all select 'queue',to_jsonb(q) from public.c2_account_deletions q where q.user_id=p_user
 ), bounded as (select * from affected limit 1001)
 select count(*),coalesce(jsonb_agg(jsonb_build_array(kind,row) order by kind,row::text),'[]') into n,inventory from bounded;
 if n>1000 then raise exception 'D3 inventory exceeds reviewed pilot ceiling' using errcode='54000'; end if;
 -- Include every retained free-text document and its immutable review provenance.
 -- No PII scrub of a pinned publication; clearance proves only the minimum lawful
 -- attribution remains. Unresolved content escalates before the transfer deadline.
 with documents(kind,key,value) as (
  select 'version',v.id::text,to_jsonb(v)-'owner_id'-'available' from assess.versions v
   where (v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)) and exists(select 1 from assess.assignments a where a.version_id=v.id)
  union all select 'publication',p.version_id::text,to_jsonb(p) from assess.publications p join assess.versions v on v.id=p.version_id
   where (v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)) and exists(select 1 from assess.assignments a where a.version_id=v.id)
  union all select 'submission',c.version_id::text,to_jsonb(c) from assess.content_submissions c join assess.versions v on v.id=c.version_id
   where (v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)) and exists(select 1 from assess.assignments a where a.version_id=v.id)
  union all select 'presentation',c.version_id::text,to_jsonb(c) from assess.practical_presentations c join assess.versions v on v.id=c.version_id
   where (v.owner_id=p_user or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)) and exists(select 1 from assess.assignments a where a.version_id=v.id)
  union all select 'revision',r.draft_id::text||':'||r.revision,to_jsonb(r) from assess.authoring_revisions r join assess.authoring_drafts d on d.id=r.draft_id
   where d.writer_id=p_user and (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews ar where ar.draft_id=d.id and ar.assignment_id is not null))
  union all select 'package',r.draft_id::text||':'||r.draft_revision,to_jsonb(r) from assess.authoring_reviewed_packages r join assess.authoring_drafts d on d.id=r.draft_id
   where d.writer_id=p_user and (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews ar where ar.draft_id=d.id and ar.assignment_id is not null))
  union all select 'draft',d.id::text,to_jsonb(d)-'writer_id' from assess.authoring_drafts d where d.writer_id=p_user and
   (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews ar where ar.draft_id=d.id and ar.assignment_id is not null))
  union all select 'group',g.id::text,to_jsonb(g.name) from assess.groups g where ((g.owner_id=p_user or g.supervisor_id=p_user) and assess.d3_shared_group_v1(g.id,p_user)) or exists(select 1 from assess.group_managers m where m.group_id=g.id and m.manager_id=p_user)
 ), bounded as (select * from documents limit 1001)
 select count(*),coalesce(jsonb_agg(jsonb_build_array(kind,key,value) order by kind,key),'[]') into n,content from bounded;
 if n>1000 then raise exception 'D3 content exceeds reviewed pilot ceiling' using errcode='54000'; end if;
 return jsonb_build_object('contract','rad085-management-inventory/1','inventoryDigest',encode(sha256(convert_to(inventory::text,'UTF8')),'hex'),
  'contentDigest',encode(sha256(convert_to(content::text,'UTF8')),'hex'),'contentReviewRequired',n>0,
  'requestedAt',(select requested_at from public.c2_account_deletions where user_id=p_user));
end $$;


ALTER FUNCTION assess.d3_inventory_v1(p_user uuid) OWNER TO postgres;

--
-- Name: d3_needs_transfer_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.d3_needs_transfer_v1(p_user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
 select exists(select 1 from assess.groups g where (g.owner_id=p_user or g.supervisor_id=p_user) and assess.d3_shared_group_v1(g.id,p_user))
  or exists(select 1 from assess.versions v where v.owner_id=p_user and exists(select 1 from assess.assignments a where a.version_id=v.id))
  or exists(select 1 from assess.assignments where owner_id=p_user)
  or exists(select 1 from assess.authoring_drafts d where d.writer_id=p_user and
   (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews r where r.draft_id=d.id and r.assignment_id is not null)))
  or exists(select 1 from assess.assignment_reviews where writer_id=p_user and assignment_id is not null)
  or exists(select 1 from assess.group_managers where manager_id=p_user)
  or exists(select 1 from assess.version_managers where manager_id=p_user)
  or exists(select 1 from assess.assignment_managers where manager_id=p_user)
  or exists(select 1 from assess.erasure_transfers where manager_id=p_user and user_id<>p_user)
$$;


ALTER FUNCTION assess.d3_needs_transfer_v1(p_user uuid) OWNER TO postgres;

--
-- Name: d3_shared_group_v1(uuid, uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.d3_shared_group_v1(p_group uuid, p_user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
 select exists(select 1 from assess.groups g where g.id=p_group and
  (g.owner_id is distinct from p_user
   or exists(select 1 from assess.memberships m where m.group_id=g.id and m.user_id<>p_user)
   or exists(select 1 from assess.membership_periods m where m.group_id=g.id and m.user_id<>p_user)
   or exists(select 1 from assess.group_join_requests r where r.group_id=g.id and r.user_id<>p_user)
   or exists(select 1 from assess.authoring_drafts d where d.group_id=g.id and d.writer_id is distinct from p_user)
   or exists(select 1 from assess.assignments a where g.id=any(a.source_group_ids))
   or exists(select 1 from assess.assignment_scopes a where a.group_id=g.id)))
$$;


ALTER FUNCTION assess.d3_shared_group_v1(p_group uuid, p_user uuid) OWNER TO postgres;

--
-- Name: disable_account_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.disable_account_v1(p_user uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 -- Self disable or current approved owner; never suspend the public profile.
 if not public.is_approved() or (p_user is distinct from auth.uid() and not public.is_owner()) then
   raise exception 'account denied' using errcode='42501'; end if;
 perform 1 from public.profiles where user_id=p_user for update;
 if not found then raise exception 'account denied' using errcode='42501'; end if;
 insert into assess.account_stops(user_id) values(p_user) on conflict do nothing;
end $$;


ALTER FUNCTION assess.disable_account_v1(p_user uuid) OWNER TO postgres;

--
-- Name: draft_page_v1(uuid, uuid, uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.draft_page_v1(p_group uuid, p_id uuid DEFAULT NULL::uuid, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rows jsonb;
begin
 perform assess.scope_enter_v1(false); perform assess.supervised_group_v1(p_group);
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if p_id is not null then
  select jsonb_build_object('id',id,'revision',revision,'document',document,'refs',refs) into rows
   from assess.authoring_drafts where id=p_id and writer_id=auth.uid() and group_id=p_group;
  if rows is null then raise exception 'draft denied' using errcode='42501'; end if;
  return rows;
 end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
  select id,track,revision,document->>'name' name,updated_at from assess.authoring_drafts
  where writer_id=auth.uid() and group_id=p_group and (p_after is null or id>p_after) order by id limit p_limit) q;
 return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;


ALTER FUNCTION assess.draft_page_v1(p_group uuid, p_id uuid, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: draft_save_v1(uuid, uuid, integer, jsonb, jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.draft_save_v1(p_group uuid, p_id uuid, p_revision integer, p_document jsonb, p_refs jsonb DEFAULT '[]'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare d assess.authoring_drafts; rev integer; doc jsonb;
begin
 perform assess.scope_enter_v1(true); perform assess.supervised_group_v1(p_group);
 if p_id is null or p_revision is null or p_revision<0 or p_document->>'id' is distinct from p_id::text
  or p_document->>'revision' is distinct from p_revision::text then raise exception 'invalid draft identity' using errcode='22023'; end if;
 perform assess.validate_draft_v1(p_document,p_refs);
 select * into d from assess.authoring_drafts where id=p_id;
 if d.id is not null and (d.writer_id<>auth.uid() or d.group_id<>p_group) then raise exception 'draft denied' using errcode='42501'; end if;
 if (d.id is null and p_revision<>0) or (d.id is not null and (d.revision<>p_revision or d.track<>p_document->>'track')) then
  raise exception 'draft changed' using errcode='40001'; end if;
 if p_revision>=100 or (d.id is null and (select count(*) from assess.authoring_drafts where writer_id=auth.uid())>=5) then
  raise exception 'draft storage limit' using errcode='54000'; end if;
 rev:=p_revision+1; doc:=jsonb_set(p_document,'{revision}',to_jsonb(rev));
 insert into assess.authoring_drafts values(p_id,auth.uid(),p_group,doc->>'track',rev,doc,p_refs,clock_timestamp())
 on conflict(id) do update set revision=excluded.revision,document=excluded.document,refs=excluded.refs,updated_at=excluded.updated_at;
 insert into assess.authoring_revisions values(p_id,rev,doc,p_refs,encode(sha256(convert_to(doc::text||p_refs::text,'UTF8')),'hex'),clock_timestamp());
 return jsonb_build_object('id',p_id,'revision',rev,'document',doc,'refs',p_refs);
end $$;


ALTER FUNCTION assess.draft_save_v1(p_group uuid, p_id uuid, p_revision integer, p_document jsonb, p_refs jsonb) OWNER TO postgres;

--
-- Name: erase_account_d3_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.erase_account_d3_v1(p_user uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare inv jsonb; q public.c2_account_deletions; needs_transfer boolean;
begin
 if not public.is_owner() or p_user is null or p_user=auth.uid() then raise exception 'owner target required' using errcode='42501'; end if;
 perform assess.owner_scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
 lock table public.profiles in share row exclusive mode;
 perform 1 from public.profiles where user_id=p_user for update;
 if not found then return; end if;
 if exists(select 1 from public.profiles where user_id=p_user and role='owner') and not exists(select 1 from public.profiles p where p.user_id<>p_user and p.role='owner' and p.status='approved' and not exists(select 1 from public.c2_account_deletions pending where pending.user_id=p.user_id)) then
  raise exception 'last owner' using errcode='42501'; end if;
 select * into q from public.c2_account_deletions where user_id=p_user for update;
 -- This primitive also serves the quarantined restore operator with an externally
 -- verified completed journal event. API callers have NO EXECUTE permission.
 perform 1 from assess.versions where owner_id=p_user order by id for update;
 perform 1 from assess.assignments where owner_id=p_user order by id for update;
 inv:=assess.d3_inventory_v1(p_user);
 needs_transfer:=assess.d3_needs_transfer_v1(p_user);
 if needs_transfer and not exists(select 1 from assess.erasure_transfers t where t.user_id=p_user and t.manager_id=auth.uid()
  and (q.user_id is null or t.requested_at=q.requested_at) and t.content_digest=inv->>'contentDigest') then
  raise exception 'management transfer unresolved: escalate to owner' using errcode='55000'; end if;
 if needs_transfer then
  update assess.erasure_transfers set erasing_xid=txid_current() where user_id=p_user;
  -- Minimal null provenance, never recipient identity. Preserve confirmed review/link
  -- UUIDs and all immutable publication/revision bytes, digests and closed_at.
  update assess.groups set owner_id=case when owner_id=p_user then null else owner_id end,supervisor_id=case when supervisor_id=p_user then null else supervisor_id end where (owner_id=p_user or supervisor_id=p_user)
   and exists(select 1 from assess.group_managers m where m.group_id=id and m.manager_id=auth.uid());
  update assess.versions set owner_id=null where owner_id=p_user and exists(select 1 from assess.assignments a where a.version_id=assess.versions.id);
  update assess.assignments set owner_id=null where owner_id=p_user;
  update assess.assignment_reviews set writer_id=null where writer_id=p_user and assignment_id is not null;
  update assess.authoring_drafts d set writer_id=null where writer_id=p_user and
   (exists(select 1 from assess.authoring_publication_links l join assess.assignments a on a.version_id=l.version_id where l.draft_id=d.id)
    or exists(select 1 from assess.assignment_reviews r where r.draft_id=d.id and r.assignment_id is not null));
 end if;
 update assess.assignment_scopes set supervisor_id=null where supervisor_id=p_user;
 update assess.supervisor_appointments set appointed_by=null where appointed_by=p_user;
 update assess.group_join_requests set decided_by=null where decided_by=p_user;
 delete from assess.assignment_reviews where writer_id=p_user and assignment_id is null;
 delete from assess.authoring_publication_links l using assess.authoring_drafts d where l.draft_id=d.id and d.writer_id=p_user;
 delete from assess.authoring_drafts where writer_id=p_user;
 -- Unassigned private versions have no other student's result/target dependency.
 delete from assess.publications p using assess.versions v where p.version_id=v.id and v.owner_id=p_user
  and not exists(select 1 from assess.assignments a where a.version_id=p.version_id) and not exists(select 1 from assess.authoring_publication_links l where l.version_id=p.version_id);
 delete from auth.users where id=p_user;
end $$;


ALTER FUNCTION assess.erase_account_d3_v1(p_user uuid) OWNER TO postgres;

--
-- Name: fail_v1(uuid, uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.fail_v1(p_session uuid, p_token uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  update assess.sessions set state='grading-failed',failed_at=coalesce(failed_at,clock_timestamp()),
    retry_at=case when clock_timestamp()<submitted_at+interval '24 hours' then clock_timestamp()+interval '1 minute' else submitted_at+interval '7 days' end,
    lease=null,lease_until=null
  where id=p_session and state='grading' and lease=p_token and lease_until>clock_timestamp();
  if not found then raise exception 'stale grading claim' using errcode='40001'; end if;
end $$;


ALTER FUNCTION assess.fail_v1(p_session uuid, p_token uuid) OWNER TO postgres;

--
-- Name: finish_v1(uuid, uuid, text, text); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.finish_v1(p_session uuid, p_token uuid, p_n text, p_d text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare s assess.sessions; doc jsonb; maximum numeric;
begin
  select * into s from assess.sessions where id=p_session for update;
  if s.state='graded' and s.lease=p_token then return; end if;
  if s.state is distinct from 'grading' or s.lease is distinct from p_token or s.lease_until<=clock_timestamp()
    or s.submitted_at<=clock_timestamp()-interval '7 days' then raise exception 'stale grading claim' using errcode='40001'; end if;
  select publication into strict doc from assess.session_details where session_id=s.id;
  maximum:=(doc->'assessment'->>'maximum')::numeric;
  if p_n is null or p_d is null or length(p_n)>1000 or length(p_d)>1000 or p_n!~'^[0-9]+$' or p_d!~'^[1-9][0-9]*$'
    or p_d::numeric<=0 or p_n::numeric>maximum*p_d::numeric then raise exception 'invalid grade' using errcode='22023'; end if;
  insert into assess.results values(s.id,p_n::numeric,p_d::numeric,maximum,doc->'assessment'->>'name',doc->'assessment'->>'track',doc->'assessment'->'policy'->>'gradeVisibility');
  -- timestamptz + interval month must use UTC even on providers with a different session timezone.
  update assess.sessions set state='graded',expires_at=((submitted_at at time zone 'UTC')+interval '6 months') at time zone 'UTC',lease_until=null,retry_at=null,failed_at=null where id=s.id;
  delete from assess.receipts where session_id=s.id;
  delete from assess.session_details where session_id=s.id;
end $_$;


ALTER FUNCTION assess.finish_v1(p_session uuid, p_token uuid, p_n text, p_d text) OWNER TO postgres;

--
-- Name: group_leave_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.group_leave_v1(p_group uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 perform assess.scope_enter_v1(true);
 delete from assess.memberships where group_id=p_group and user_id=auth.uid()
  and exists(select 1 from assess.groups where id=p_group and supervisor_id is not null);
end $$;


ALTER FUNCTION assess.group_leave_v1(p_group uuid) OWNER TO postgres;

--
-- Name: group_write_v1(uuid, text, boolean); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.group_write_v1(p_id uuid DEFAULT NULL::uuid, p_name text DEFAULT NULL::text, p_delete boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare gid uuid;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_delete is null or (not p_delete and (p_name is null or length(btrim(p_name)) not between 1 and 100)) then
    raise exception 'invalid group' using errcode='22023'; end if;
  if p_id is null then
    if p_delete then raise exception 'invalid group' using errcode='22023'; end if;
    insert into assess.groups(owner_id,name) values(auth.uid(),btrim(p_name)) returning id into gid;
  else
    select id into gid from assess.groups where id=p_id and owner_id=auth.uid() for update;
    if gid is null then raise exception 'group denied' using errcode='42501'; end if;
    if p_delete then delete from assess.groups where id=gid;
    else update assess.groups set name=btrim(p_name) where id=gid; end if;
  end if;
  return gid;
end $$;


ALTER FUNCTION assess.group_write_v1(p_id uuid, p_name text, p_delete boolean) OWNER TO postgres;

--
-- Name: guard_managed_group_v1(); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.guard_managed_group_v1() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 if tg_op='UPDATE' and (assess.d3_erasing_v1(old.owner_id) or assess.d3_erasing_v1(old.supervisor_id))
  and new.owner_id is not distinct from (case when assess.d3_erasing_v1(old.owner_id) then null else old.owner_id end)
  and new.supervisor_id is not distinct from (case when assess.d3_erasing_v1(old.supervisor_id) then null else old.supervisor_id end)
  and to_jsonb(new)-'owner_id'-'supervisor_id' = to_jsonb(old)-'owner_id'-'supervisor_id'
  and exists(select 1 from assess.group_managers m where m.group_id=old.id and m.manager_id=auth.uid()) then return new; end if;
 if old.supervisor_id is not null then
  if tg_op='DELETE' then
   if exists(select 1 from public.profiles where user_id=old.owner_id) then
    raise exception 'managed group must be ended' using errcode='42501'; end if;
   return old;
  end if;
  if new.owner_id is distinct from old.owner_id or new.supervisor_id is distinct from old.supervisor_id or new.starts_at is distinct from old.starts_at
   or new.name is distinct from old.name or new.ends_at is distinct from old.ends_at then
   raise exception 'managed group provenance immutable' using errcode='42501'; end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;


ALTER FUNCTION assess.guard_managed_group_v1() OWNER TO postgres;

--
-- Name: health_v1(); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.health_v1() RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select jsonb_build_object('failed',count(*) filter(where state='grading-failed'),
    'alert',count(*) filter(where state='grading-failed' and submitted_at<=clock_timestamp()-interval '24 hours'),
    'overdue',count(*) filter(where state='active' and deadline<=clock_timestamp()),
    'purgeDue',count(*) filter(where expires_at<=clock_timestamp())) from assess.sessions
$$;


ALTER FUNCTION assess.health_v1() OWNER TO postgres;

--
-- Name: history_page_v1(uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.history_page_v1(p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rows jsonb; cursor_id uuid; ts timestamptz:=clock_timestamp();
begin
  if not public.is_approved() then raise exception 'approved only' using errcode='42501'; end if;
  if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
  with page as (
    select s.id from assess.sessions s
    join assess.results r on r.session_id=s.id
    join assess.assignments a on a.id=s.assignment_id
    join assess.targets t on t.assignment_id=a.id and t.user_id=s.user_id
    join assess.versions v on v.id=a.version_id
    where s.user_id=auth.uid() and s.state='graded' and s.expires_at>ts and v.available and v.schema_version=1 and v.track in ('mixed','full-practical')
      and (p_after is null or s.id>p_after)
    order by s.id limit p_limit
  ), projected as (select id,assess.result_v1(id) dto from page)
  select coalesce(jsonb_agg(dto order by id),'[]'::jsonb),(array_agg(id order by id desc))[1] into rows,cursor_id from projected;
  return jsonb_build_object('rows',rows,'next',case when jsonb_array_length(rows)=p_limit then cursor_id else null end);
end $$;


ALTER FUNCTION assess.history_page_v1(p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: install_publication_v1(uuid, jsonb, jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.install_publication_v1(p_version uuid, p_document jsonb, p_specs jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare v assess.versions;
begin
  select * into strict v from assess.versions where id=p_version for update;
  if p_document is null or p_specs is null or pg_column_size(p_document)>2000000
    or p_document->'assessment'->>'schemaVersion' is distinct from '1'
    or p_document->'assessment'->'ref'->>'id' is distinct from v.assessment_id::text
    or p_document->'assessment'->'ref'->>'version' is distinct from v.version
    or p_document->'assessment'->>'name' is distinct from v.name
    or p_document->'assessment'->>'track' is distinct from v.track then
    raise exception 'invalid publication' using errcode='22023'; end if;
  insert into assess.publications(version_id,document,specs) values(p_version,p_document,p_specs);
end $$;


ALTER FUNCTION assess.install_publication_v1(p_version uuid, p_document jsonb, p_specs jsonb) OWNER TO postgres;

--
-- Name: join_decide_v1(uuid, integer, text); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.join_decide_v1(p_request uuid, p_revision integer, p_action text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare r assess.group_join_requests;
begin
 perform assess.scope_enter_v1(true);
 select * into r from assess.group_join_requests where id=p_request;
 if r.id is null then raise exception 'request denied' using errcode='42501'; end if;
 if p_action='cancel' then
  if r.user_id<>auth.uid() then raise exception 'request denied' using errcode='42501'; end if;
 else
  perform assess.supervised_group_v1(r.group_id);
  if p_action is null or p_action not in ('approve','reject') then raise exception 'invalid action' using errcode='22023'; end if;
 end if;
 if r.revision is distinct from p_revision or r.state<>'pending' then raise exception 'request changed' using errcode='40001'; end if;
 if p_action='approve' then
  perform 1 from public.profiles where user_id=r.user_id for share;
  if not exists(select 1 from public.profiles where user_id=r.user_id and status='approved' and role='participant')
   or exists(select 1 from assess.account_stops where user_id=r.user_id) or not assess.sharing_allowed_v1(r.user_id) then
   raise exception 'student unavailable' using errcode='42501'; end if;
  if (select count(*) from assess.memberships where group_id=r.group_id)>=1000 then raise exception 'group limit' using errcode='54000'; end if;
  insert into assess.memberships(group_id,user_id) values(r.group_id,r.user_id);
 end if;
 update assess.group_join_requests set state=case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'cancelled' end,
  revision=revision+1,decided_at=clock_timestamp(),decided_by=auth.uid() where id=r.id;
end $$;


ALTER FUNCTION assess.join_decide_v1(p_request uuid, p_revision integer, p_action text) OWNER TO postgres;

--
-- Name: join_request_v1(text); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.join_request_v1(p_code text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare gid uuid; r assess.group_join_requests; used_count integer; ts timestamptz;
begin
 perform assess.scope_enter_v1(true); ts:=clock_timestamp();
 if not exists(select 1 from public.profiles where user_id=auth.uid() and role='participant') or not assess.sharing_allowed_v1(auth.uid()) then
  raise exception 'sharing consent required' using errcode='42501'; end if;
 insert into assess.join_request_throttles values(auth.uid(),ts,0) on conflict do nothing;
 update assess.join_request_throttles set window_at=ts,used=0 where user_id=auth.uid() and window_at<=ts-interval '1 hour';
 select used into used_count from assess.join_request_throttles where user_id=auth.uid();
 if used_count>=10 then return jsonb_build_object('outcome','unavailable'); end if;
 update assess.join_request_throttles set used=used+1 where user_id=auth.uid();
 p_code:=upper(regexp_replace(p_code,'[[:space:]-]','','g'));
 if p_code is null or length(p_code)<>8 or p_code !~ '^[0-9A-HJKMNP-TV-Z]{8}$' then return jsonb_build_object('outcome','unavailable'); end if;
 select g.id into gid from assess.group_join_codes c join assess.groups g on g.id=c.group_id
 join assess.supervisor_appointments a on a.user_id=g.supervisor_id join public.profiles p on p.user_id=a.user_id
 where c.digest=encode(sha256(convert_to(p_code,'UTF8')),'hex') and c.revoked_at is null and c.expires_at>ts
 and g.ended_at is null and g.ends_at>ts and a.revoked_at is null and p.status='approved'
 and not exists(select 1 from assess.account_stops where user_id=a.user_id);
 if gid is null then return jsonb_build_object('outcome','unavailable'); end if;
 if exists(select 1 from assess.memberships where group_id=gid and user_id=auth.uid()) then return jsonb_build_object('outcome','member'); end if;
 insert into assess.group_join_requests(group_id,user_id,state,requested_at) values(gid,auth.uid(),'pending',ts)
 on conflict(group_id,user_id) do update set state='pending',requested_at=ts,revision=assess.group_join_requests.revision+1,decided_at=null,decided_by=null
 where assess.group_join_requests.state<>'pending';
 select * into r from assess.group_join_requests where group_id=gid and user_id=auth.uid();
 return jsonb_build_object('outcome','pending','id',r.id,'revision',r.revision);
end $_$;


ALTER FUNCTION assess.join_request_v1(p_code text) OWNER TO postgres;

--
-- Name: linked_version_v1(uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.linked_version_v1(p_draft uuid, p_revision integer) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare v uuid;
begin
 select l.version_id into v from assess.authoring_publication_links l
 join assess.authoring_revisions r on r.draft_id=l.draft_id and r.revision=l.draft_revision and r.digest=l.source_digest
 join assess.authoring_drafts d on d.id=l.draft_id
 join assess.versions a on a.id=l.version_id and a.owner_id=d.writer_id and a.track=d.track and a.schema_version=1 and a.available
 join assess.content_submissions c on c.version_id=a.id and c.state='installed'
 join assess.publications pub on pub.version_id=a.id
 where l.draft_id=p_draft and l.draft_revision=p_revision
 and (a.track='mixed' or exists(select 1 from assess.practical_presentations p where p.version_id=a.id));
 if v is null then raise exception 'reviewed installed publication required' using errcode='55000'; end if;
 return v;
end $$;


ALTER FUNCTION assess.linked_version_v1(p_draft uuid, p_revision integer) OWNER TO postgres;

--
-- Name: maintain_v1(integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.maintain_v1(p_limit integer DEFAULT 50) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


ALTER FUNCTION assess.maintain_v1(p_limit integer) OWNER TO postgres;

--
-- Name: members_write_v1(uuid, uuid[], boolean); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.members_write_v1(p_group uuid, p_users uuid[], p_add boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare n integer;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  perform 1 from assess.groups where id=p_group and owner_id=auth.uid() for update;
  if not found then raise exception 'group denied' using errcode='42501'; end if;
  if p_add is null or p_users is null or cardinality(p_users) not between 1 and 100
    or array_position(p_users,null) is not null then raise exception 'invalid members' using errcode='22023'; end if;
  if exists(select 1 from unnest(p_users) u where not exists(select 1 from public.profiles p where p.user_id=u and p.role='participant')) then
    raise exception 'unknown participant' using errcode='22023'; end if;
  if p_add then insert into assess.memberships(group_id,user_id) select p_group,u from unnest(p_users) u on conflict do nothing;
  else delete from assess.memberships where group_id=p_group and user_id=any(p_users); end if;
  select count(*) into n from assess.memberships where group_id=p_group;
  if n>10000 then raise exception 'too many members' using errcode='22023'; end if;
end $$;


ALTER FUNCTION assess.members_write_v1(p_group uuid, p_users uuid[], p_add boolean) OWNER TO postgres;

--
-- Name: membership_period_v1(); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.membership_period_v1() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare g assess.groups; ts timestamptz:=clock_timestamp();
begin
 if tg_op='UPDATE' then
  if old.period_id is not null then raise exception 'membership period immutable' using errcode='42501'; end if;
  return new;
 end if;
 select * into g from assess.groups where id=case when tg_op='DELETE' then old.group_id else new.group_id end;
 if g.supervisor_id is null then if tg_op='DELETE' then return old; else return new; end if; end if;
 -- Legacy owner membership writes must not bypass approval/periods on managed groups.
 -- Cascading profile deletion must preserve the existing account-finalisation contract.
 -- A direct membership edit still has an existing profile and remains denied.
 if public.is_owner() and (tg_op<>'DELETE' or exists(select 1 from public.profiles where user_id=old.user_id)) then
  raise exception 'managed membership requires join decision' using errcode='42501'; end if;
 if tg_op='DELETE' then
  update assess.membership_periods set left_at=ts where id=old.period_id and left_at is null;
  update assess.groups set scope_revision=scope_revision+1 where id=old.group_id;
  return old;
 end if;
 if g.supervisor_id is distinct from auth.uid() or not assess.sharing_allowed_v1(new.user_id) then
  raise exception 'managed membership denied' using errcode='42501'; end if;
 insert into assess.membership_periods(group_id,user_id,joined_at) values(new.group_id,new.user_id,ts) returning id into new.period_id;
 update assess.groups set scope_revision=scope_revision+1 where id=new.group_id;
 return new;
end $$;


ALTER FUNCTION assess.membership_period_v1() OWNER TO postgres;

--
-- Name: owner_page_v1(text, uuid, text, uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.owner_page_v1(p_kind text, p_context uuid DEFAULT NULL::uuid, p_search text DEFAULT ''::text, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare page jsonb; lim integer:=least(p_limit,100);
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_kind is null or p_kind not in ('groups','people','members','versions','assignments','targets')
    or p_limit is null or p_limit<1 or p_search is null or length(p_search)>100 then
    raise exception 'invalid page' using errcode='22023'; end if;
  if p_kind='members' and not exists(select 1 from assess.groups where id=p_context and owner_id=auth.uid()) then
    raise exception 'group denied' using errcode='42501'; end if;
  if p_kind='targets' and not exists(select 1 from assess.assignments where id=p_context and owner_id=auth.uid()) then
    raise exception 'assignment denied' using errcode='42501'; end if;
  if p_kind in ('people','members','targets') then
    select coalesce(jsonb_agg(v order by id),'[]') into page from (
      select p.user_id id,jsonb_build_object('id',p.user_id,'name',p.display_name,'email',u.email,'status',p.status) v
      from public.profiles p join auth.users u on u.id=p.user_id
      where p.role='participant' and (p_after is null or p.user_id>p_after)
        and (p_kind='people' or (p_kind='members' and exists(select 1 from assess.memberships m where m.group_id=p_context and m.user_id=p.user_id))
          or (p_kind='targets' and exists(select 1 from assess.targets t where t.assignment_id=p_context and t.user_id=p.user_id)))
        and (p_search='' or strpos(lower(coalesce(p.display_name,'')||' '||coalesce(u.email,'')),lower(p_search))>0)
      order by p.user_id limit lim) q;
  elsif p_kind='groups' then
    select coalesce(jsonb_agg(v order by id),'[]') into page from (select g.id,jsonb_build_object('id',g.id,'name',g.name) v
      from assess.groups g where g.owner_id=auth.uid() and (p_after is null or g.id>p_after) order by g.id limit lim) q;
  elsif p_kind='versions' then
    select coalesce(jsonb_agg(v order by id),'[]') into page from (select a.id,jsonb_build_object('id',a.id,'name',a.name,'track',a.track,'version',a.version) v
      from assess.versions a where a.owner_id=auth.uid() and a.available and a.schema_version=1 and a.track in ('mixed','full-practical')
        and (p_after is null or a.id>p_after) order by a.id limit lim) q;
  else
    select coalesce(jsonb_agg(v order by id),'[]') into page from (select a.id,jsonb_build_object('id',a.id,'name',v.name,'track',v.track,'version',v.version,'revision',a.revision) v
      from assess.assignments a join assess.versions v on v.id=a.version_id
      where a.owner_id=auth.uid() and (p_after is null or a.id>p_after) order by a.id limit lim) q;
  end if;
  return jsonb_build_object('version',1,'rows',page,'next',case when jsonb_array_length(page)=lim then page->(lim-1)->>'id' else null end);
end $$;


ALTER FUNCTION assess.owner_page_v1(p_kind text, p_context uuid, p_search text, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: owner_scope_enter_v1(boolean); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.owner_scope_enter_v1(p_write boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'read committed required' using errcode='55000'; end if;
 if p_write then perform 1 from assess.scope_lock for update; else perform 1 from assess.scope_lock for share; end if;
 perform 1 from public.profiles where user_id=auth.uid() for share;
 if not public.is_owner() then raise exception 'approved owner required' using errcode='42501'; end if;
end $$;


ALTER FUNCTION assess.owner_scope_enter_v1(p_write boolean) OWNER TO postgres;

--
-- Name: read_mixed_session_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.read_mixed_session_v1(p_session uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare result jsonb; d assess.session_details; item jsonb; key jsonb; spec jsonb; views jsonb:='{}'; initial jsonb; scene jsonb; path text; element text; paths text[];
begin
  result:=assess.read_session_v1(p_session); -- locks session and rechecks identity/target/expiry
  if result->'ack'->>'state'<>'active' then return result; end if;
  if result->'assessment'->>'track'<>'mixed' then raise exception 'mixed only' using errcode='55000'; end if;
  select * into strict d from assess.session_details where session_id=p_session;
  for item in select value from jsonb_array_elements(d.publication->'assessment'->'items') loop
    if item->>'type'='simulator-part' then
      select value into strict key from jsonb_array_elements(d.publication->'privateItems') where value->'ref'=item->'ref';
      spec:=d.specs->(item->'ref'->>'id'); initial:='{}';scene:='{}';
      for path in select jsonb_object_keys(spec) loop
        initial:=jsonb_set(initial,array[path],key->'fixedSettings'#>string_to_array(path,'.'));
      end loop;
      for element in select jsonb_array_elements_text(item->'presentation'->'sceneElements') loop
        paths:=case element when 'detector' then array[]::text[] when 'tube' then array['sidCm']
          when 'marker' then array['sideMarker','markerPosition.x','markerPosition.y']
          when 'beam' then array['centralRay.x','centralRay.y','collimation.width','collimation.height'] else null end;
        if paths is null then raise exception 'unsupported scene' using errcode='55000'; end if;
        foreach path in array paths loop
          scene:=jsonb_set(scene,array[path],key->'fixedSettings'#>string_to_array(path,'.'));
        end loop;
      end loop;
      views:=jsonb_set(views,array[item->'ref'->>'id'],jsonb_build_object('controls',spec,'initial',initial,'sceneValues',scene));
    end if;
  end loop;
  return result || jsonb_build_object('views',views);
end $$;


ALTER FUNCTION assess.read_mixed_session_v1(p_session uuid) OWNER TO postgres;

--
-- Name: read_practical_session_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.read_practical_session_v1(p_session uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


ALTER FUNCTION assess.read_practical_session_v1(p_session uuid) OWNER TO postgres;

--
-- Name: read_session_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.read_session_v1(p_session uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare s assess.sessions; d assess.session_details;
begin
  select * into s from assess.sessions where id=p_session and user_id=auth.uid() for update;
  if s.id is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v1(s.assignment_id);
  if s.expires_at is not null and clock_timestamp()>=s.expires_at then raise exception 'expired' using errcode='42501'; end if;
  if s.state='active' and clock_timestamp()>=s.deadline then
    update assess.sessions set state='grading',submitted_at=deadline,revision=revision+1 where id=s.id;
  end if;
  select * into d from assess.session_details where session_id=s.id;
  return jsonb_build_object('attemptId',s.id,'ack',assess.session_ack_v1(s.id,null)) ||
    case when (select state='active' from assess.sessions where id=s.id) then
      jsonb_build_object('assessment',d.publication->'assessment','answers',d.answers) else '{}'::jsonb end;
end $$;


ALTER FUNCTION assess.read_session_v1(p_session uuid) OWNER TO postgres;

--
-- Name: record_practice_v1(); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.record_practice_v1() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 insert into assess.practice_recordings(attempt_id,user_id,recorded_at) values(new.id,new.user_id,clock_timestamp());
 return new;
end $$;


ALTER FUNCTION assess.record_practice_v1() OWNER TO postgres;

--
-- Name: recover_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.recover_v1(p_session uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  update assess.sessions set retry_at=clock_timestamp() where id=p_session and state='grading-failed'
    and submitted_at>clock_timestamp()-interval '7 days';
  if not found then raise exception 'recovery unavailable' using errcode='55000'; end if;
end $$;


ALTER FUNCTION assess.recover_v1(p_session uuid) OWNER TO postgres;

--
-- Name: require_consent_v1(); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.require_consent_v1() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 if not exists(select 1 from assess.consents where user_id=new.user_id and version='assess-pilot-2026-10-20-v2') then
   raise exception 'Assess v2 consent required' using errcode='42501'; end if;
 return new;
end $$;


ALTER FUNCTION assess.require_consent_v1() OWNER TO postgres;

--
-- Name: result_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.result_v1(p_session uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare result jsonb; assignment uuid;
begin
  select assignment_id into assignment from assess.sessions where id=p_session and user_id=auth.uid();
  if assignment is null then raise exception 'access denied' using errcode='42501'; end if;
  perform assess.session_authorize_v1(assignment);
  select jsonb_build_object('name',r.name,'track',r.track,'submittedAt',to_char(s.submitted_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'grade',case when r.visibility='hidden' then '{"visibility":"hidden"}'::jsonb else
      jsonb_build_object('visibility','shown','earned',round(div(2*r.earned_n*100+r.earned_d,2*r.earned_d)/100,2)::text,'maximum',round(r.maximum,2)::text) end)
  into result from assess.results r join assess.sessions s on s.id=r.session_id
  where s.id=p_session and s.user_id=auth.uid() and clock_timestamp()<s.expires_at;
  -- Current account/target permission is checked for results too; no exam body is returned.
  if result is null then raise exception 'result unavailable' using errcode='42501'; end if;
  return result;
end $$;


ALTER FUNCTION assess.result_v1(p_session uuid) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_reviews; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.assignment_reviews (
    id uuid NOT NULL,
    writer_id uuid,
    group_id uuid NOT NULL,
    group_revision integer NOT NULL,
    appointment_revision integer NOT NULL,
    draft_id uuid NOT NULL,
    draft_revision integer NOT NULL,
    version_id uuid NOT NULL,
    source_digest text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    assignment_id uuid
);


ALTER TABLE assess.assignment_reviews OWNER TO postgres;

--
-- Name: review_current_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.review_current_v1(p_review uuid) RETURNS assess.assignment_reviews
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare r assess.assignment_reviews; g assess.groups; d assess.authoring_drafts;
begin
 select * into r from assess.assignment_reviews where id=p_review and writer_id=auth.uid();
 if r.id is null then raise exception 'review denied' using errcode='42501'; end if;
 g:=assess.supervised_group_v1(r.group_id);
 if r.expires_at<=clock_timestamp() then raise exception 'review expired' using errcode='55000'; end if;
 if r.group_revision<>g.scope_revision or not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revision=r.appointment_revision and revoked_at is null) then
  raise exception 'scope changed' using errcode='40001'; end if;
 select * into d from assess.authoring_drafts where id=r.draft_id and writer_id=auth.uid() and group_id=g.id;
 if d.revision is distinct from r.draft_revision then raise exception 'draft changed' using errcode='40001'; end if;
 perform assess.validate_draft_v1(d.document,d.refs);
 if assess.linked_version_v1(d.id,d.revision)<>r.version_id then raise exception 'version changed' using errcode='40001'; end if;
 if exists(
  (select user_id,period_id,visible_from from assess.visible_members_v1(g.id)
   except select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id)
  union all
  (select user_id,period_id,visible_from from assess.assignment_review_targets where review_id=r.id
   except select user_id,period_id,visible_from from assess.visible_members_v1(g.id))
 ) then raise exception 'targets changed' using errcode='40001'; end if;
 return r;
end $$;


ALTER FUNCTION assess.review_current_v1(p_review uuid) OWNER TO postgres;

--
-- Name: scope_enter_v1(boolean); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.scope_enter_v1(p_write boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'read committed required' using errcode='55000'; end if;
 if p_write then perform 1 from assess.scope_lock for update; else perform 1 from assess.scope_lock for share; end if;
 perform 1 from public.profiles where user_id=auth.uid() for share;
 if not public.is_approved() or exists(select 1 from assess.account_stops where user_id=auth.uid()) then
  raise exception 'approved active account required' using errcode='42501'; end if;
end $$;


ALTER FUNCTION assess.scope_enter_v1(p_write boolean) OWNER TO postgres;

--
-- Name: scope_page_v1(text, uuid, uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.scope_page_v1(p_kind text, p_group uuid DEFAULT NULL::uuid, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rows jsonb; total bigint; ts timestamptz; g assess.groups;
begin
 perform assess.scope_enter_v1(false); ts:=clock_timestamp();
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 if p_kind='groups' then
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
   select grp.id,grp.name,grp.supervisor_id,grp.starts_at,grp.ends_at,grp.scope_revision revision,
    greatest(grp.starts_at,a.appointed_at) supervised_from
   from assess.groups grp join assess.supervisor_appointments a on a.user_id=grp.supervisor_id
   where grp.supervisor_id=auth.uid() and a.revoked_at is null and grp.ended_at is null and grp.ends_at>ts
    and (p_after is null or grp.id>p_after) order by grp.id limit p_limit) q;
 elsif p_kind='my-requests' then
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
   select r.id,r.group_id,r.state,r.revision,grp.name group_name
   from assess.group_join_requests r left join assess.groups grp on grp.id=r.group_id where r.user_id=auth.uid()
   and (p_after is null or r.id>p_after) order by r.id limit p_limit) q;
 elsif p_kind='appointments' then
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
   select a.user_id id,p.display_name,a.revoked_at,a.revision from assess.supervisor_appointments a join public.profiles p on p.user_id=a.user_id
   where p_after is null or a.user_id>p_after order by a.user_id limit p_limit) q;
 else
  g:=assess.supervised_group_v1(p_group);
  if p_kind='members' then
   select count(*) into total from assess.visible_members_v1(g.id);
   select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select v.user_id id,p.display_name,v.period_id,v.visible_from from assess.visible_members_v1(g.id) v
    join public.profiles p on p.user_id=v.user_id where p_after is null or v.user_id>p_after order by v.user_id limit p_limit) q;
  elsif p_kind='requests' then
   -- RAD085-SEC-FIXES-20261027 SEC-02: only pending requests of accounts still eligible
   -- to join, filtered before paging. Decided/historical rows never reveal a student
   -- who left, withdrew sharing or is out of scope; owner audit data is not exposed here.
   select coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into rows from (
    select r.id,r.user_id,r.state,r.revision,p.display_name from assess.group_join_requests r join public.profiles p on p.user_id=r.user_id
    where r.group_id=g.id and r.state='pending' and p.status='approved' and p.role='participant'
    and not exists(select 1 from assess.account_stops s where s.user_id=r.user_id) and assess.sharing_allowed_v1(r.user_id)
    and not exists(select 1 from assess.memberships m where m.group_id=g.id and m.user_id=r.user_id)
    and (p_after is null or r.id>p_after) order by r.id limit p_limit) q;
  elsif p_kind='practice' then
   with visible as materialized (
    select r.attempt_id id,r.user_id,r.recorded_at,a.exam_id,a.case_id,p.display_name,
     case when jsonb_typeof(a.result->'total')='number' then a.result->'total' else null end score
    from assess.visible_members_v1(g.id) m join assess.practice_recordings r on r.user_id=m.user_id
    join public.attempts a on a.id=r.attempt_id left join public.profiles p on p.user_id=r.user_id where r.recorded_at>=m.visible_from and r.recorded_at<least(ts,g.ends_at) and a.mode='practice' and a.record_kind='attempt'
   ) select (select count(*) from visible),coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into total,rows
   from (select * from visible where p_after is null or id>p_after order by id limit p_limit) q;
  else raise exception 'invalid page kind' using errcode='22023'; end if;
 end if;
 return jsonb_build_object('appointed',exists(select 1 from assess.supervisor_appointments ap join public.profiles p on p.user_id=ap.user_id where ap.user_id=auth.uid() and ap.revoked_at is null and p.status='approved' and p.role='participant'),'version',1,'rows',rows,'total',total,'serverNow',ts,'visibleUntil',g.ends_at,
  'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;


ALTER FUNCTION assess.scope_page_v1(p_kind text, p_group uuid, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: session_ack_v1(uuid, uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.session_ack_v1(p_session uuid, p_operation uuid) RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select jsonb_build_object('operationId',p_operation,'revision',s.revision,'serverTime',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'deadline',to_char(s.deadline at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'state',s.state,'lockedItemIds',coalesce(d.locked,'[]'::jsonb))
  from assess.sessions s left join assess.session_details d on d.session_id=s.id where s.id=p_session
$$;


ALTER FUNCTION assess.session_ack_v1(p_session uuid, p_operation uuid) OWNER TO postgres;

--
-- Name: session_authorize_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.session_authorize_v1(p_assignment uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  perform 1 from assess.assignments where id=p_assignment for share;
  perform 1 from public.profiles where user_id=auth.uid() for share;
  if not public.is_approved() or not exists(
    select 1 from assess.targets t join assess.assignments a on a.id=t.assignment_id
    join assess.versions v on v.id=a.version_id
    where t.assignment_id=p_assignment and t.user_id=auth.uid() and v.available
      and v.schema_version=1 and v.track in ('mixed','full-practical')) then
    raise exception 'access denied' using errcode='42501'; end if;
end $$;


ALTER FUNCTION assess.session_authorize_v1(p_assignment uuid) OWNER TO postgres;

--
-- Name: sharing_allowed_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.sharing_allowed_v1(p_user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
 select exists(select 1 from assess.sharing_consents c join assess.sharing_policy p
 on c.version=p.required_version and c.text_digest=p.text_digest where c.user_id=p_user)
$$;


ALTER FUNCTION assess.sharing_allowed_v1(p_user uuid) OWNER TO postgres;

--
-- Name: sharing_consent_v1(text, text, boolean); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.sharing_consent_v1(p_version text DEFAULT NULL::text, p_digest text DEFAULT NULL::text, p_accept boolean DEFAULT NULL::boolean) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare p assess.sharing_policy;
begin
 perform assess.scope_enter_v1(p_accept is not null);
 select * into p from assess.sharing_policy;
 if p_accept is true then
  if p.required_version is null or p_version is distinct from p.required_version or p_digest is distinct from p.text_digest then
   raise exception 'sharing policy unavailable or changed' using errcode='55000'; end if;
  insert into assess.sharing_consents values(auth.uid(),p_version,p_digest,clock_timestamp())
  on conflict(user_id) do update set version=excluded.version,text_digest=excluded.text_digest,accepted_at=excluded.accepted_at
   where assess.sharing_consents.version<>excluded.version or assess.sharing_consents.text_digest<>excluded.text_digest;
 elsif p_accept is false then delete from assess.sharing_consents where user_id=auth.uid(); end if;
 return jsonb_build_object('version',p.required_version,'textDigest',p.text_digest,'accepted',assess.sharing_allowed_v1(auth.uid()));
end $$;


ALTER FUNCTION assess.sharing_consent_v1(p_version text, p_digest text, p_accept boolean) OWNER TO postgres;

--
-- Name: start_v1(uuid, uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.start_v1(p_assignment uuid, p_operation uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


ALTER FUNCTION assess.start_v1(p_assignment uuid, p_operation uuid) OWNER TO postgres;

--
-- Name: groups; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    supervisor_id uuid,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    ended_at timestamp with time zone,
    scope_revision integer DEFAULT 1 NOT NULL,
    CONSTRAINT groups_name_check CHECK (((length(btrim(name)) >= 1) AND (length(btrim(name)) <= 100))),
    CONSTRAINT groups_scope_revision_check CHECK ((scope_revision > 0)),
    CONSTRAINT groups_supervisor_window CHECK (((supervisor_id IS NULL) OR ((starts_at IS NOT NULL) AND (ends_at IS NOT NULL) AND (starts_at < ends_at))))
);


ALTER TABLE assess.groups OWNER TO postgres;

--
-- Name: supervised_group_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.supervised_group_v1(p_group uuid) RETURNS assess.groups
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare g assess.groups;
begin
 select * into g from assess.groups where id=p_group and supervisor_id=auth.uid();
 if g.id is null or not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null)
 then raise exception 'group denied' using errcode='42501'; end if;
 if g.ended_at is not null or clock_timestamp()>=g.ends_at then raise exception 'group expired' using errcode='55000'; end if;
 return g;
end $$;


ALTER FUNCTION assess.supervised_group_v1(p_group uuid) OWNER TO postgres;

--
-- Name: supervisor_group_v1(text, uuid, integer, text, timestamp with time zone); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.supervisor_group_v1(p_action text, p_group uuid DEFAULT NULL::uuid, p_revision integer DEFAULT NULL::integer, p_name text DEFAULT NULL::text, p_ends timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare g assess.groups; raw text; bits bigint; i integer; attempt integer; collision text;
begin
 perform assess.scope_enter_v1(true);
 if not exists(select 1 from assess.supervisor_appointments where user_id=auth.uid() and revoked_at is null)
 or not exists(select 1 from public.profiles where user_id=auth.uid() and role='participant') then raise exception 'supervisor only' using errcode='42501'; end if;
 if p_action='create' then
  if p_name is null or length(btrim(p_name)) not between 1 and 100 or p_ends is null or p_ends<=clock_timestamp() then
   raise exception 'invalid group' using errcode='22023'; end if;
  insert into assess.groups(owner_id,name,supervisor_id,starts_at,ends_at)
   values(auth.uid(),btrim(p_name),auth.uid(),clock_timestamp(),p_ends) returning * into g;
 else
  g:=assess.supervised_group_v1(p_group);
  if g.scope_revision is distinct from p_revision then raise exception 'group changed' using errcode='40001'; end if;
  if p_action not in ('rotate','revoke-code','end') or p_action is null then raise exception 'invalid action' using errcode='22023'; end if;
  update assess.groups set scope_revision=scope_revision+1,ended_at=case when p_action='end' then clock_timestamp() else ended_at end where id=g.id returning * into g;
 end if;
 if p_action in ('create','rotate') then
  -- First 40 UUIDv4 bits precede the fixed version/variant bits: uniform 40-bit space.
  -- Retry only the digest constraint; an exhausted retry rolls back the entire RPC.
  for attempt in 1..16 loop
   bits:=('x'||substr(replace(gen_random_uuid()::text,'-',''),1,10))::bit(40)::bigint;
   raw:='';
   for i in reverse 7..0 loop
    raw:=raw||substr('0123456789ABCDEFGHJKMNPQRSTVWXYZ',((bits>>(i*5))&31)::integer+1,1);
   end loop;
   -- Rotating to the same digest must also retry, rather than keep the old code valid.
   if exists(select 1 from assess.group_join_codes where group_id=g.id and digest=encode(sha256(convert_to(raw,'UTF8')),'hex')) then
    if attempt=16 then raise exception 'code allocation exhausted' using errcode='54000'; end if;
    continue;
   end if;
   begin
    insert into assess.group_join_codes values(g.id,encode(sha256(convert_to(raw,'UTF8')),'hex'),g.ends_at,null)
    on conflict(group_id) do update set digest=excluded.digest,expires_at=excluded.expires_at,revoked_at=null;
    exit;
   exception when unique_violation then
    get stacked diagnostics collision=constraint_name;
    if collision<>'group_join_codes_digest_key' then raise; end if;
    if attempt=16 then raise exception 'code allocation exhausted' using errcode='54000'; end if;
   end;
  end loop;
 else update assess.group_join_codes set revoked_at=clock_timestamp() where group_id=g.id; end if;
 if p_action='end' then
  delete from assess.memberships where group_id=g.id;
  update assess.group_join_requests set state='cancelled',revision=revision+1,decided_at=clock_timestamp(),decided_by=auth.uid() where group_id=g.id and state='pending';
  select * into g from assess.groups where id=g.id;
 end if;
 return jsonb_build_object('id',g.id,'revision',g.scope_revision,'code',raw);
end $$;


ALTER FUNCTION assess.supervisor_group_v1(p_action text, p_group uuid, p_revision integer, p_name text, p_ends timestamp with time zone) OWNER TO postgres;

--
-- Name: supervisor_results_v1(uuid, uuid, integer); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.supervisor_results_v1(p_group uuid, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare g assess.groups; ts timestamptz; rows jsonb; total bigint;
begin
 perform assess.scope_enter_v1(false); g:=assess.supervised_group_v1(p_group); ts:=clock_timestamp();
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid page' using errcode='22023'; end if;
 with visible as materialized (
  select s.id,s.user_id,s.submitted_at,r.name,r.track,
   case when r.visibility='hidden' then jsonb_build_object('visibility','hidden')
   else jsonb_build_object('visibility','shown','earnedNumerator',r.earned_n::text,'earnedDenominator',r.earned_d::text,'maximum',r.maximum::text) end grade
  from assess.visible_members_v1(g.id) m join assess.sessions s on s.user_id=m.user_id
  join assess.results r on r.session_id=s.id join assess.assignment_scopes a on a.assignment_id=s.assignment_id and a.group_id=g.id and a.supervisor_id=auth.uid()
  join assess.assignment_review_targets t on t.review_id=a.review_id and t.user_id=m.user_id and t.period_id=m.period_id
  where s.state='graded' and s.started_at>=m.visible_from and s.started_at<g.ends_at and s.expires_at>ts
 ) select (select count(*) from visible),coalesce(jsonb_agg(to_jsonb(q) order by q.id),'[]') into total,rows
 from (select * from visible where p_after is null or id>p_after order by id limit p_limit) q;
 return jsonb_build_object('rows',rows,'total',total,'serverNow',ts,'visibleUntil',g.ends_at,
  'next',case when jsonb_array_length(rows)=p_limit then rows->-1->>'id' else null end);
end $$;


ALTER FUNCTION assess.supervisor_results_v1(p_group uuid, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: targets_write_v1(uuid, integer, uuid[], boolean); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.targets_write_v1(p_assignment uuid, p_revision integer, p_users uuid[], p_add boolean) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare rev integer; n integer;
begin
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  select revision into rev from assess.assignments where id=p_assignment and owner_id=auth.uid() for update;
  if rev is null then raise exception 'assignment denied' using errcode='42501'; end if;
  if p_revision is distinct from rev then raise exception 'assignment changed' using errcode='40001'; end if;
  if p_add is null or p_users is null or cardinality(p_users) not between 1 and 100
    or array_position(p_users,null) is not null then raise exception 'invalid targets' using errcode='22023'; end if;
  if exists(select 1 from unnest(p_users) u where not exists(select 1 from public.profiles p where p.user_id=u and p.role='participant')) then
    raise exception 'unknown participant' using errcode='22023'; end if;
  if p_add then insert into assess.targets(assignment_id,user_id) select p_assignment,u from unnest(p_users) u on conflict do nothing;
  else delete from assess.targets where assignment_id=p_assignment and user_id=any(p_users); end if;
  select count(*) into n from assess.targets where assignment_id=p_assignment;
  if n>10000 then raise exception 'too many targets' using errcode='22023'; end if;
  update assess.assignments set revision=revision+1 where id=p_assignment returning revision into rev;
  return rev;
end $$;


ALTER FUNCTION assess.targets_write_v1(p_assignment uuid, p_revision integer, p_users uuid[], p_add boolean) OWNER TO postgres;

--
-- Name: transfer_management_d3_v1(uuid, text, timestamp with time zone); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.transfer_management_d3_v1(p_user uuid, p_digest text, p_replay_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare q public.c2_account_deletions; inv jsonb; ts timestamptz;
begin
 if not public.is_owner() or p_user is null or p_user=auth.uid() then raise exception 'owner target required' using errcode='42501'; end if;
 perform assess.owner_scope_enter_v1(true);
 if not public.is_owner() then raise exception 'owner only after scope wait' using errcode='42501'; end if;
 lock table public.profiles in share row exclusive mode;
 perform 1 from public.profiles where user_id in (p_user,auth.uid()) order by user_id for update;
 if exists(select 1 from public.c2_account_deletions where user_id=auth.uid()) then raise exception 'active owner required' using errcode='42501'; end if;
 select * into q from public.c2_account_deletions where user_id=p_user for update;
 if q.user_id is null then raise exception 'pending deletion required' using errcode='55000'; end if;
 perform 1 from assess.versions where owner_id=p_user or id in(select version_id from assess.version_managers where manager_id=p_user) order by id for update;
 perform 1 from assess.assignments where owner_id=p_user or id in(select assignment_id from assess.assignment_managers where manager_id=p_user) order by id for update;
 inv:=assess.d3_inventory_v1(p_user); ts:=coalesce(p_replay_at,clock_timestamp());
 if ts<q.requested_at or ts>clock_timestamp() then raise exception 'invalid verified replay time' using errcode='22023'; end if;
 -- An already confirmed transfer is a read receipt, never an uncertain automatic retry.
 if exists(select 1 from assess.erasure_transfers where user_id=p_user and requested_at=q.requested_at and inventory_digest=p_digest and manager_id=auth.uid()) then
  return jsonb_build_object('transferred',true,'replayed',true); end if;
 if q.requested_at+interval '30 days'<=ts then raise exception 'transfer overdue: escalate to owner' using errcode='55000'; end if;
 if p_digest is distinct from inv->>'inventoryDigest' then raise exception 'inventory changed' using errcode='40001'; end if;
 if (inv->>'contentReviewRequired')::boolean and not exists(select 1 from assess.erasure_rights r where r.user_id=p_user and r.content_digest=inv->>'contentDigest' and r.reviewed_by=auth.uid()) then
  raise exception 'retained content rights review required' using errcode='55000'; end if;
 insert into assess.group_managers select id,auth.uid() from assess.groups g where ((g.owner_id=p_user or g.supervisor_id=p_user) and assess.d3_shared_group_v1(g.id,p_user))
  or exists(select 1 from assess.group_managers m where m.group_id=g.id and m.manager_id=p_user)
 on conflict(group_id) do update set manager_id=excluded.manager_id;
 insert into assess.version_managers select id,auth.uid() from assess.versions v where (v.owner_id=p_user and exists(select 1 from assess.assignments a where a.version_id=v.id)) or exists(select 1 from assess.version_managers m where m.version_id=v.id and m.manager_id=p_user)
 on conflict(version_id) do update set manager_id=excluded.manager_id;
 insert into assess.assignment_managers select id,auth.uid() from assess.assignments a where a.owner_id=p_user or exists(select 1 from assess.assignment_managers m where m.assignment_id=a.id and m.manager_id=p_user)
 on conflict(assignment_id) do update set manager_id=excluded.manager_id;
 -- Revoke scope and codes; do NOT modify any student's period, target or result.
 update assess.supervisor_appointments set revoked_at=coalesce(revoked_at,ts),revision=revision+1 where user_id=p_user and revoked_at is null;
 update assess.groups set ended_at=coalesce(ended_at,ts),scope_revision=scope_revision+1 where (owner_id=p_user or supervisor_id=p_user) and ended_at is null;
 update assess.group_join_codes set revoked_at=coalesce(revoked_at,ts) where group_id in(select id from assess.groups where supervisor_id=p_user);
 update assess.erasure_transfers set manager_id=auth.uid() where manager_id=p_user;
 -- Bind clearance to post-transfer content (the archived group name is unchanged).
 inv:=assess.d3_inventory_v1(p_user);
 -- Completion, rather than lock acquisition, must be before the deadline.
 ts:=coalesce(p_replay_at,clock_timestamp());
 if q.requested_at+interval '30 days'<=ts then raise exception 'transfer overdue: escalate to owner' using errcode='55000'; end if;
 insert into assess.erasure_transfers(user_id,requested_at,manager_id,inventory_digest,content_digest,transferred_at)
 values(p_user,q.requested_at,auth.uid(),p_digest,inv->>'contentDigest',ts)
 on conflict(user_id) do update set requested_at=excluded.requested_at,manager_id=excluded.manager_id,inventory_digest=excluded.inventory_digest,content_digest=excluded.content_digest,transferred_at=excluded.transferred_at,erasing_xid=null;
 if p_replay_at is null and q.requested_at+interval '30 days'<=clock_timestamp() then
  raise exception 'transfer overdue: escalate to owner' using errcode='55000'; end if;
 return jsonb_build_object('transferred',true,'replayed',false);
end $$;


ALTER FUNCTION assess.transfer_management_d3_v1(p_user uuid, p_digest text, p_replay_at timestamp with time zone) OWNER TO postgres;

--
-- Name: validate_answer_v1(jsonb, jsonb, jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.validate_answer_v1(p_item jsonb, p_spec jsonb, p_answer jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare kv record; constraint_spec jsonb; candidate_value jsonb;
begin
  if p_item is null or p_spec is null or jsonb_typeof(p_answer) is distinct from 'object'
    or p_answer->>'type' is distinct from p_item->>'type' then raise exception 'invalid answer' using errcode='22023'; end if;
  if p_item->>'type'='single-choice' then
    if p_answer - array['type','optionId'] <> '{}' or not(p_answer ? 'optionId')
      or (p_answer->'optionId'<>'null'::jsonb and not exists(select 1 from jsonb_array_elements(p_item->'options') o where o->'id'=p_answer->'optionId'))
      then raise exception 'invalid choice' using errcode='22023'; end if;
  else
    if p_answer - array['type','values'] <> '{}' or jsonb_typeof(p_answer->'values') is distinct from 'object' then
      raise exception 'invalid simulation' using errcode='22023'; end if;
    for kv in select * from jsonb_each(p_answer->'values') loop
      constraint_spec:=p_spec->kv.key;candidate_value:=kv.value;
      if constraint_spec is null or (constraint_spec->>'kind'='number' and
        (jsonb_typeof(candidate_value)<>'number' or (candidate_value#>>'{}')::numeric<(constraint_spec->>'min')::numeric or (candidate_value#>>'{}')::numeric>(constraint_spec->>'max')::numeric))
        or (constraint_spec->>'kind'='enum' and not exists(select 1 from jsonb_array_elements(constraint_spec->'values') allowed where allowed=candidate_value)) then
        raise exception 'invalid setting' using errcode='22023'; end if;
    end loop;
    -- Complete allowlisted leaf values are required. Background is resolved privately, not supplied by client.
    if (select count(*) from jsonb_object_keys(p_answer->'values'))<>(select count(*) from jsonb_object_keys(p_spec)) then
      raise exception 'incomplete settings' using errcode='22023'; end if;
  end if;
end $$;


ALTER FUNCTION assess.validate_answer_v1(p_item jsonb, p_spec jsonb, p_answer jsonb) OWNER TO postgres;

--
-- Name: validate_draft_v1(jsonb, jsonb); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.validate_draft_v1(p_document jsonb, p_refs jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare item jsonb; ref jsonb; found_ref assess.authoring_references; n integer; k text;
begin
 if p_document is null or jsonb_typeof(p_document)<>'object' or octet_length(p_document::text)>131072
 or p_document->>'schemaVersion' is distinct from '1' or p_document->>'track' not in ('mixed','full-practical')
 or p_document->>'track' is null or jsonb_typeof(p_document->'items') is distinct from 'array'
 or jsonb_array_length(p_document->'items')>200 or jsonb_typeof(p_document->'name') is distinct from 'string'
 or length(p_document->>'name')>200 or jsonb_typeof(p_refs) is distinct from 'array' or jsonb_array_length(p_refs)>200
 or exists(select 1 from jsonb_object_keys(p_document) key where key not in ('schemaVersion','id','track','revision','name','policy','items')) then
  raise exception 'invalid draft' using errcode='22023'; end if;
 if jsonb_typeof(p_document->'policy') is distinct from 'object' then raise exception 'invalid policy' using errcode='22023'; end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(p_document->'items'))<>jsonb_array_length(p_document->'items') then
  raise exception 'duplicate item identity' using errcode='22023'; end if;
 if (select count(distinct value->>'key') from jsonb_array_elements(p_refs))<>jsonb_array_length(p_refs) then
  raise exception 'duplicate reference' using errcode='22023'; end if;
 for ref in select value from jsonb_array_elements(p_refs) loop
  if jsonb_typeof(ref)<>'object' or exists(select 1 from jsonb_object_keys(ref) key where key not in ('key','revision')) then
   raise exception 'invalid reference' using errcode='22023'; end if;
  select * into found_ref from assess.authoring_references where key=ref->>'key' and revision=ref->>'revision' and active;
  if found_ref.key is null then raise exception 'stale reference' using errcode='55000'; end if;
 end loop;
 for item in select value from jsonb_array_elements(p_document->'items') loop
  if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id') not between 1 and 100
   or jsonb_typeof(item->'prompt') is distinct from 'string' or length(item->>'prompt')>10000
   or jsonb_typeof(item->'authoring') is distinct from 'object'
   or exists(select 1 from jsonb_object_keys(item->'authoring') key where key not in ('author','reference','licenceNotes','notes'))
   or exists(select 1 from jsonb_each(item->'authoring') e where jsonb_typeof(e.value)<>'string' or length(e.value#>>'{}')>2000)
  then raise exception 'invalid draft item' using errcode='22023'; end if;
  if p_document->>'track'='full-practical' then
   if item->>'type' is distinct from 'full-practical' or item ? 'maximum'
    or exists(select 1 from jsonb_object_keys(item) key where key not in ('id','type','prompt','caseRef','evaluatorVersion','authoring'))
   then raise exception 'separate practical track required' using errcode='22023'; end if;
   k:=item->'caseRef'->>'id';
   select * into found_ref from assess.authoring_references where key=k and kind='full-practical' and active
    and case_id=k and case_version=item->'caseRef'->>'version' and evaluator_version=item->>'evaluatorVersion';
  elsif item->>'type'='simulator-part' then
   if exists(select 1 from jsonb_object_keys(item) key where key not in ('id','type','prompt','maximum','partId','authoring')) then
    raise exception 'invalid part fields' using errcode='22023'; end if;
   k:=item->>'partId';
   select * into found_ref from assess.authoring_references where key=k and kind='simulator-part' and active;
  elsif item->>'type'='single-choice' then
   k:=null;
   if exists(select 1 from jsonb_object_keys(item) key where key not in ('id','type','prompt','maximum','options','correctOptionId','authoring'))
    or jsonb_typeof(item->'options') is distinct from 'array' or jsonb_array_length(item->'options')>50 then
    raise exception 'invalid choice fields' using errcode='22023'; end if;
  else raise exception 'unsupported item' using errcode='22023'; end if;
  if k is not null then
   if found_ref.key is null or not exists(select 1 from jsonb_array_elements(p_refs) r where r->>'key'=k and r->>'revision'=found_ref.revision) then
    raise exception 'stale reference' using errcode='55000'; end if;
  elsif item->>'type'<>'single-choice' then raise exception 'missing reference' using errcode='22023'; end if;
 end loop;
 -- Extra references cannot silently bind unrelated catalogue entries.
 for ref in select value from jsonb_array_elements(p_refs) loop
  select count(*) into n from jsonb_array_elements(p_document->'items') i
   where (i->>'type'='simulator-part' and i->>'partId'=ref->>'key')
   or (i->>'type'='full-practical' and i->'caseRef'->>'id'=ref->>'key');
  if n=0 then raise exception 'unused reference' using errcode='22023'; end if;
 end loop;
end $$;


ALTER FUNCTION assess.validate_draft_v1(p_document jsonb, p_refs jsonb) OWNER TO postgres;

--
-- Name: visible_members_v1(uuid); Type: FUNCTION; Schema: assess; Owner: postgres
--

CREATE FUNCTION assess.visible_members_v1(p_group uuid) RETURNS TABLE(user_id uuid, period_id uuid, visible_from timestamp with time zone)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
 select m.user_id,m.period_id,greatest(mp.joined_at,g.starts_at,a.appointed_at,c.accepted_at)
 from assess.memberships m join assess.membership_periods mp on mp.id=m.period_id and mp.left_at is null
 join assess.groups g on g.id=m.group_id join assess.supervisor_appointments a on a.user_id=g.supervisor_id
 join public.profiles p on p.user_id=m.user_id join assess.sharing_consents c on c.user_id=m.user_id
 where m.group_id=p_group and g.supervisor_id=auth.uid() and g.ended_at is null and g.ends_at>clock_timestamp()
 and a.revoked_at is null and p.status='approved' and assess.sharing_allowed_v1(m.user_id)
 and not exists(select 1 from assess.account_stops where user_id=m.user_id)
$$;


ALTER FUNCTION assess.visible_members_v1(p_group uuid) OWNER TO postgres;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
    revoke trigger on cron.job_run_details from postgres;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
begin
    if not exists (
        select 1
        from pg_catalog.pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8.0', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
            set search_path to ''
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: supabase_admin
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


ALTER FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) OWNER TO supabase_admin;

--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: can_read_training(text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.can_read_training(p_scope text, p_user uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
  select public.is_approved() and ((p_scope='own' and p_user=auth.uid()) or (p_scope='all' and public.is_owner()))
$$;


ALTER FUNCTION public.can_read_training(p_scope text, p_user uuid) OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare v text := new.raw_user_meta_data->>'consent_version';
  n text := nullif(btrim(new.raw_user_meta_data->>'display_name'),'');
begin
  if v is null or v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then v := null; end if;
  if char_length(n)>100 then n := null; end if;
  insert into public.profiles(user_id,display_name,consent_version,consented_at)
  values(new.id,n,v,case when v is not null then now() end);
  return new;
end $_$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: has_consented(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_consented() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$ select exists (select 1 from public.profiles where user_id = auth.uid() and consent_version is not null and consented_at is not null) $$;


ALTER FUNCTION public.has_consented() OWNER TO postgres;

--
-- Name: is_approved(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_approved() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$ select exists (select 1 from public.profiles where user_id = auth.uid() and status = 'approved') $$;


ALTER FUNCTION public.is_approved() OWNER TO postgres;

--
-- Name: is_owner(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_owner() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$ select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'owner' and status = 'approved') $$;


ALTER FUNCTION public.is_owner() OWNER TO postgres;

--
-- Name: owner_account_deletion_v1(text, uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.owner_account_deletion_v1(p_action text, p_user uuid DEFAULT NULL::uuid, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare p public.profiles%rowtype; d public.c2_account_deletions%rowtype; prior_ban timestamptz;
 ids uuid[]:='{}'; target uuid; rows jsonb; lim integer:=least(p_limit,100);
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_action is null or p_action not in ('deactivate','restore','finalise','list') or p_limit is null or p_limit<1 then
  raise exception 'invalid deletion request' using errcode='22023'; end if;
 if p_action in ('deactivate','restore','finalise') then perform assess.owner_scope_enter_v1(true); end if;
 -- Serialise owner deletion operations and role/status writes while checking last owner.
 lock table public.profiles in share row exclusive mode;
 if not public.is_owner() then raise exception 'owner only after profile wait' using errcode='42501'; end if;
 if p_action='list' then
  select coalesce(jsonb_agg(v order by id),'[]') into rows from (
   select q.user_id id,jsonb_build_object('user_id',q.user_id,'participant_code',profile_info.participant_code,
    'name',profile_info.display_name,'email',u.email,'status','pending deletion','requested_at',q.requested_at,
    'expires_at',q.requested_at+interval '30 days','days_left',greatest(0,ceil(extract(epoch from(q.requested_at+interval '30 days'-clock_timestamp()))/86400))) v
   from public.c2_account_deletions q join public.profiles profile_info using(user_id) join auth.users u on u.id=q.user_id
   where p_after is null or q.user_id>p_after order by q.user_id limit lim+1
  ) x;
  return jsonb_build_object('rows',rows-lim,'next',case when jsonb_array_length(rows)>lim then rows->(lim-1)->'user_id' else null end);
 end if;
 if p_action='finalise' then
  select coalesce(array_agg(user_id order by requested_at,user_id),'{}') into ids from (
   select user_id,requested_at from public.c2_account_deletions where requested_at+interval '30 days'<=clock_timestamp()
   order by requested_at,user_id limit lim
  ) x;
 else
  if p_user is null then raise exception 'participant required' using errcode='22023'; end if;
  ids:=array[p_user];
 end if;
 foreach target in array ids loop
  select * into p from public.profiles where user_id=target for update;
  if not found then raise exception 'participant not found' using errcode='22023'; end if;
  if p_action<>'restore' and p.role='owner' and not exists(select 1 from public.profiles other_owner
    where other_owner.role='owner' and other_owner.status='approved' and other_owner.user_id<>target
    and not exists(select 1 from public.c2_account_deletions q where q.user_id=other_owner.user_id)) then
   raise exception 'last owner' using errcode='42501'; end if;
  if target=auth.uid() then raise exception 'cannot delete yourself' using errcode='42501'; end if;
  select * into d from public.c2_account_deletions where user_id=target for update;
  if p_action='deactivate' then
   if found then raise exception 'already pending deletion' using errcode='22023'; end if;
   select coalesce(banned_until,'-infinity') into prior_ban from auth.users where id=target for update;
   insert into public.c2_account_deletions(user_id,restore_status,previous_banned_until) values(target,p.status,prior_ban);
   update public.profiles set status='suspended' where user_id=target;
   -- Auth ban persists past the grace window until explicit restore/finalise.
   update auth.users set banned_until=clock_timestamp()+interval '100 years' where id=target;
   -- Revoke refreshable sessions; already-issued JWTs expire normally, status blocks new writes.
   if to_regclass('auth.sessions') is not null then execute 'delete from auth.sessions where user_id=$1' using target; end if;
   if to_regclass('auth.refresh_tokens') is not null then execute 'delete from auth.refresh_tokens where user_id::text=$1' using target::text; end if;
  elsif p_action='restore' then
   if d.user_id is null or d.requested_at+interval '30 days'<=clock_timestamp() then raise exception 'restore window expired or absent' using errcode='22023'; end if;
   update auth.users set banned_until=nullif(d.previous_banned_until,'-infinity'::timestamptz) where id=target;
   update public.profiles set status=d.restore_status where user_id=target;
   delete from public.c2_account_deletions where user_id=target;
  else
   -- Normal C2 eligibility above is unchanged. D3 transfers precede the deadline.
   perform assess.erase_account_d3_v1(target);
  end if;
 end loop;
 return jsonb_build_object('processed',cardinality(ids));
end $_$;


ALTER FUNCTION public.owner_account_deletion_v1(p_action text, p_user uuid, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: owner_account_directory_v1(text, text, jsonb, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.owner_account_directory_v1(p_search text DEFAULT ''::text, p_status text DEFAULT ''::text, p_cursor jsonb DEFAULT NULL::jsonb, p_boundary timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare b timestamptz:=coalesce(p_boundary,statement_timestamp()); rows jsonb; counts jsonb; lim integer:=least(p_limit,20); after_id uuid; after_rank integer;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_search is null or length(p_search)>100 or p_status is null or p_status not in ('','pending','approved','suspended')
 or p_limit is null or p_limit<1 or not isfinite(b) or b>statement_timestamp() then raise exception 'invalid directory request' using errcode='22023'; end if;
 if p_cursor is not null then
  after_id:=(p_cursor->>'id')::uuid; after_rank:=(p_cursor->>'rank')::integer;
  if jsonb_typeof(p_cursor)<>'object' or after_id is null or after_rank is null or after_rank not between 0 and 2 then raise exception 'invalid cursor' using errcode='22023'; end if;
 end if;
 select jsonb_build_object('pending',count(*) filter(where p.status='pending'),'approved',count(*) filter(where p.status='approved'),'suspended',count(*) filter(where p.status='suspended')) into counts
 from public.profiles p join auth.users u on u.id=p.user_id where p.created_at<=b
 and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)
 and (p_search='' or strpos(lower(coalesce(p.display_name,'')),lower(p_search))>0 or strpos(lower(coalesce(u.email,'')),lower(p_search))>0);
 select coalesce(jsonb_agg(v order by rank,id),'[]') into rows from (
  select p.user_id id,case p.status when 'pending' then 0 when 'approved' then 1 else 2 end rank,
  jsonb_build_object('user_id',p.user_id,'name',p.display_name,'email',u.email,'participant_code',p.participant_code,'role',p.role,'status',p.status,'created_at',p.created_at,'last_seen_at',p.last_seen_at) v
  from public.profiles p join auth.users u on u.id=p.user_id where p.created_at<=b and (p_status='' or p.status=p_status)
  and not exists(select 1 from public.c2_account_deletions d where d.user_id=p.user_id)
  and (p_search='' or strpos(lower(coalesce(p.display_name,'')),lower(p_search))>0 or strpos(lower(coalesce(u.email,'')),lower(p_search))>0)
  and (after_id is null or (case p.status when 'pending' then 0 when 'approved' then 1 else 2 end,p.user_id)>(after_rank,after_id))
  order by rank,id limit lim+1
 ) x;
 return jsonb_build_object('version',1,'boundary',b,'rows',rows-lim,'counts',counts,'next',case when jsonb_array_length(rows)>lim then jsonb_build_object('id',rows->(lim-1)->'user_id','rank',case rows->(lim-1)->>'status' when 'pending' then 0 when 'approved' then 1 else 2 end) else null end);
end $$;


ALTER FUNCTION public.owner_account_directory_v1(p_search text, p_status text, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) OWNER TO postgres;

--
-- Name: owner_dashboard_v1(text, text, text, uuid, text, timestamp with time zone, timestamp with time zone, jsonb, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.owner_dashboard_v1(p_view text, p_search text DEFAULT ''::text, p_status text DEFAULT ''::text, p_participant uuid DEFAULT NULL::uuid, p_exam text DEFAULT NULL::text, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone, p_cursor jsonb DEFAULT NULL::jsonb, p_boundary timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
 b timestamptz := coalesce(p_boundary,statement_timestamp());
 lim integer := least(p_limit,20); page jsonb; counts jsonb; nxt jsonb;
 rank_after integer; id_after uuid; exam_after text;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_view is null or p_view not in ('participants','summary','attempts') or p_search is null or length(p_search)>100
   or p_status is null or p_status not in ('','pending','approved','suspended')
   or p_limit is null or p_limit<1 or not isfinite(b) or b>statement_timestamp()
   or (p_from is not null and not isfinite(p_from)) or (p_to is not null and not isfinite(p_to))
   or p_from>p_to or length(p_exam)>200 then raise exception 'invalid dashboard request' using errcode='22023'; end if;
 if p_view='attempts' then
   -- Preserve the bounded v1 read/filters and enrich only this page with saved
   -- comparison metadata. Never derive semantic identities in the browser.
   page := public.owner_page_v1('attempts',lim,p_cursor,p_participant,p_from,p_to,p_exam,b,false);
   select coalesce(jsonb_agg(r.value || jsonb_build_object('comparison',a.comparison_version,'comparison_verified',true) order by r.ordinality),'[]'::jsonb)
     into counts from jsonb_array_elements(page->'rows') with ordinality r(value,ordinality)
     join public.attempts a on a.id=(r.value->>'id')::uuid;
   return jsonb_set(page,'{rows}',counts);
 end if;
 if p_cursor is not null then
   if jsonb_typeof(p_cursor)<>'object' then raise exception 'invalid cursor' using errcode='22023'; end if;
   if p_view='participants' then
     id_after := (p_cursor->>'id')::uuid; rank_after := (p_cursor->>'rank')::integer;
     if id_after is null or rank_after is null or rank_after not between 0 and 2 then raise exception 'invalid cursor' using errcode='22023'; end if;
   else
     exam_after := p_cursor->>'exam';
     if exam_after is null or length(exam_after)>200 then raise exception 'invalid cursor' using errcode='22023'; end if;
   end if;
 end if;
 if p_view='participants' then
   select jsonb_build_object('pending',count(*) filter(where p.status='pending'),
     'approved',count(*) filter(where p.status='approved'),'suspended',count(*) filter(where p.status='suspended'))
   into counts from public.profiles p join auth.users u on u.id=p.user_id
   where p.created_at<=b and (p_search='' or strpos(lower(coalesce(p.display_name,'')),lower(p_search))>0 or strpos(lower(coalesce(u.email,'')),lower(p_search))>0);
   select coalesce(jsonb_agg(v order by r,id),'[]'::jsonb) into page from (
     select p.user_id id,case p.status when 'pending' then 0 when 'approved' then 1 else 2 end r,
       jsonb_build_object('user_id',p.user_id,'name',p.display_name,'participant_code',p.participant_code,
         'role',p.role,'status',p.status,'email',u.email,'email_confirmed',u.email_confirmed_at is not null,
         'created_at',p.created_at,'last_seen_at',p.last_seen_at,
         'last_event_at',(select max(e.at) from public.events e where e.user_id=p.user_id and e.at<=b)) v
     from public.profiles p join auth.users u on u.id=p.user_id
     where p.created_at<=b and (p_status='' or p.status=p_status)
       and (p_search='' or strpos(lower(coalesce(p.display_name,'')),lower(p_search))>0 or strpos(lower(coalesce(u.email,'')),lower(p_search))>0)
       and (id_after is null or (case p.status when 'pending' then 0 when 'approved' then 1 else 2 end,p.user_id)>(rank_after,id_after))
     order by r,id limit lim+1
   ) q;
   if jsonb_array_length(page)>lim then
     page := page-lim;
     nxt := jsonb_build_object('id',page->(lim-1)->'user_id','rank',case page->(lim-1)->>'status' when 'pending' then '0' when 'approved' then '1' else '2' end);
   end if;
 else
   -- Summaries use saved outcomes only; no grading or joining notes to attempts.
   with filtered as (
     select a.exam_id,a.result,a.result_format_version from public.attempts a
     where a.finished_at<=b and (p_participant is null or a.user_id=p_participant)
       and (p_exam is null or a.exam_id=p_exam) and (p_from is null or a.finished_at>=p_from) and (p_to is null or a.finished_at<=p_to)
   ), exams as (
     select exam_id,count(*) n,count(*) filter(where result_format_version=1 and result->>'passed'='true') passed,
       count(*) filter(where result_format_version=1 and jsonb_typeof(result->'passed')='boolean') known
     from filtered where exam_after is null or exam_id collate "C">exam_after collate "C" group by exam_id
     order by exam_id collate "C" limit lim+1
   )
   select coalesce(jsonb_agg(jsonb_build_object('exam',e.exam_id,'attempts',e.n,'passed',e.passed,'known',e.known,
     'wrong',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'count',w.n) order by w.n desc,w.id) from (
       select k->>'id' id,count(*) n from filtered f cross join lateral jsonb_array_elements(
         case when f.result_format_version=1 and jsonb_typeof(f.result->'checks')='array' then f.result->'checks' else '[]'::jsonb end) k
       where f.exam_id=e.exam_id and k->>'o' in ('fail','partial') and k->>'id' is not null
       group by k->>'id' order by n desc,id limit 5
     ) w),'[]'::jsonb)) order by e.exam_id collate "C"),'[]'::jsonb) into page from exams e;
   if jsonb_array_length(page)>lim then page := page-lim; nxt := jsonb_build_object('exam',page->(lim-1)->'exam'); end if;
 end if;
 return jsonb_build_object('version',1,'boundary',b,'rows',page,'next',nxt,'counts',counts);
end $$;


ALTER FUNCTION public.owner_dashboard_v1(p_view text, p_search text, p_status text, p_participant uuid, p_exam text, p_from timestamp with time zone, p_to timestamp with time zone, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) OWNER TO postgres;

--
-- Name: owner_list_participants(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.owner_list_participants() RETURNS TABLE(user_id uuid, participant_code text, role text, status text, email text, email_confirmed boolean, created_at timestamp with time zone, last_seen_at timestamp with time zone, last_event_at timestamp with time zone)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if not public.is_owner() then
    raise exception 'owner only' using errcode = '42501';
  end if;
  return query
    select p.user_id, p.participant_code, p.role, p.status,
           u.email::text, (u.email_confirmed_at is not null),
           p.created_at, p.last_seen_at,
           (select max(e.at) from public.events e where e.user_id = p.user_id)
    from public.profiles p
    join auth.users u on u.id = p.user_id
    order by p.created_at desc;
end $$;


ALTER FUNCTION public.owner_list_participants() OWNER TO postgres;

--
-- Name: owner_page_v1(text, integer, jsonb, uuid, timestamp with time zone, timestamp with time zone, text, timestamp with time zone, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.owner_page_v1(p_stream text, p_limit integer DEFAULT 100, p_cursor jsonb DEFAULT NULL::jsonb, p_participant uuid DEFAULT NULL::uuid, p_from timestamp with time zone DEFAULT NULL::timestamp with time zone, p_to timestamp with time zone DEFAULT NULL::timestamp with time zone, p_exam text DEFAULT NULL::text, p_boundary timestamp with time zone DEFAULT NULL::timestamp with time zone, p_export boolean DEFAULT false) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare
  boundary timestamptz := coalesce(p_boundary, statement_timestamp());
  lim integer := least(p_limit,1000);
  source text; stamp text; ident text; projection text; predicate text; base text;
  page jsonb; n bigint; pending bigint := 0; cursor_time timestamptz; cursor_id text;
begin
  -- Guard before parsing parameters or disclosing counts, including suspended owners.
  if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
  if p_stream is null or p_stream not in ('participants','attempts','notes') or p_limit is null or p_limit < 1
    or p_export is null or not isfinite(boundary)
    or (p_from is not null and not isfinite(p_from)) or (p_to is not null and not isfinite(p_to))
    or p_from > p_to or length(p_exam)>200
    or (p_stream='participants' and (p_export or p_exam is not null)) then
    raise exception 'invalid page request' using errcode='22023';
  end if;
  if p_cursor is not null then
    if jsonb_typeof(p_cursor)<>'object' or not (p_cursor ? 'time' and p_cursor ? 'id')
      or jsonb_typeof(p_cursor->'time')<>'string' or jsonb_typeof(p_cursor->'id')<>'string' then
      raise exception 'invalid cursor' using errcode='22023';
    end if;
    cursor_time := (p_cursor->>'time')::timestamptz;
    cursor_id := p_cursor->>'id';
    if not isfinite(cursor_time) or cursor_time > boundary then raise exception 'invalid cursor' using errcode='22023'; end if;
    if p_stream='notes' then
      if cursor_id !~ '^[0-9]+$' or cursor_id::bigint < 1 then raise exception 'invalid cursor' using errcode='22023'; end if;
    else perform cursor_id::uuid; end if;
  end if;
  if p_stream='participants' then
    source := 'public.profiles r join auth.users u on u.id=r.user_id';
    stamp := 'r.created_at'; ident := 'r.user_id';
    projection := 'jsonb_build_object(''user_id'',r.user_id,''participant_code'',r.participant_code,''role'',r.role,''status'',r.status,''email'',u.email,''email_confirmed'',u.email_confirmed_at is not null,''created_at'',r.created_at,''last_seen_at'',r.last_seen_at,''last_event_at'',(select max(e.at) from public.events e where e.user_id=r.user_id))';
  elsif p_stream='attempts' then
    source := 'public.attempts r join public.profiles p on p.user_id=r.user_id';
    stamp := 'r.finished_at'; ident := 'r.id';
    projection := 'jsonb_build_object(''id'',r.id,''user_id'',r.user_id,''attempt_no'',r.attempt_no,''exam_id'',r.exam_id,''case_id'',r.case_id,''definition_version'',r.definition_version,''settings'',r.settings,''result'',r.result,''locale'',r.locale,''started_at'',r.started_at,''finished_at'',r.finished_at,''participant_code'',p.participant_code)';
  else
    source := 'public.feedback r join public.profiles p on p.user_id=r.user_id left join public.attempts a on a.id=r.attempt_id and a.user_id=r.user_id';
    stamp := 'r.at'; ident := 'r.id';
    projection := 'jsonb_build_object(''id'',r.id::text,''user_id'',r.user_id,''exam_id'',r.exam_id,''attempt_id'',r.attempt_id,''attempt_no'',a.attempt_no,''text'',r.text,''at'',r.at,''participant_code'',p.participant_code)';
  end if;
  if p_stream='attempts' then
    -- Validated FK guarantees registration; no client grant on pilot_locales is needed.
    projection := '(' || projection || ') || jsonb_build_object(''settings_format_version'',r.settings_format_version,''result_format_version'',r.result_format_version,''mode'',r.mode,''record_kind'',r.record_kind,''producer_version'',r.producer_version,''engine_version'',r.engine_version,''locale_registered'',true)';
  elsif p_stream='notes' then
    projection := '(' || projection || ') || jsonb_build_object(''note_format_version'',r.note_format_version,''mode'',r.mode,''record_kind'',r.record_kind,''producer_version'',r.producer_version,''engine_version'',r.engine_version)';
  end if;
  if p_export then projection := '(' || projection || ')-''user_id'''; end if;
  -- All SQL fragments come only from the fixed branches above. Values stay bound.
  predicate := format('%s <= $1 and ($2::uuid is null or r.user_id=$2) and ($3::timestamptz is null or %s >= $3) and ($4::timestamptz is null or %s <= $4)',stamp,stamp,stamp);
  if p_stream<>'participants' then predicate := predicate || ' and ($5::text is null or r.exam_id=$5)'; end if;
  base := ' from ' || source || ' where ' || predicate;
  execute 'select count(*)' || base into n using boundary,p_participant,p_from,p_to,p_exam;
  if p_stream='participants' then
    execute 'select count(*)' || base || ' and r.status=''pending''' into pending using boundary,p_participant,p_from,p_to,p_exam;
  end if;
  execute format('select coalesce(jsonb_agg(v order by t desc,i asc),''[]''::jsonb) from
    (select %s v,%s t,%s i %s and ($6::timestamptz is null or %s < $6 or (%s=$6 and %s > $7::%s))
    order by %s desc,%s asc limit $8) q',projection,stamp,ident,base,stamp,stamp,ident,
    case when p_stream='notes' then 'bigint' else 'uuid' end,stamp,ident)
    into page using boundary,p_participant,p_from,p_to,p_exam,cursor_time,cursor_id,lim;
  -- v1 RPC must fail visibly for unknown payloads even for the previous static client,
  -- which cannot inspect new metadata. Never filter them away or silently alter totals.
  if (p_stream='attempts' and exists (select 1 from jsonb_array_elements(page) r
      where (r->>'settings_format_version')::integer<>1 or (r->>'result_format_version')::integer<>1))
    or (p_stream='notes' and exists (select 1 from jsonb_array_elements(page) r
      where (r->>'note_format_version')::integer<>1)) then
    raise exception 'unsupported record format for owner_page_v1' using errcode='22023';
  end if;
  return jsonb_build_object('version' ,1,'boundary',boundary,'total',n,'pending',pending,'rows',page,
    -- Explicit continuation even for a short API page; an exact-full final page may need one empty request.
    'next',case when jsonb_array_length(page)=lim then jsonb_build_object('time',page->(lim-1)->(case p_stream when 'participants' then 'created_at' when 'attempts' then 'finished_at' else 'at' end),
      'id',page->(lim-1)->(case when p_stream='participants' then 'user_id' else 'id' end)) else null end) || case when p_stream='participants' then '{}'::jsonb else jsonb_build_object('record_contract_version',1) end;
end $_$;


ALTER FUNCTION public.owner_page_v1(p_stream text, p_limit integer, p_cursor jsonb, p_participant uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_exam text, p_boundary timestamp with time zone, p_export boolean) OWNER TO postgres;

--
-- Name: owner_surveys_v1(text, jsonb, uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.owner_surveys_v1(p_action text, p_data jsonb DEFAULT '{}'::jsonb, p_after uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
declare rows jsonb; obj uuid; def jsonb; q jsonb; ids text[]:='{}'; typ text; ver integer; lim integer:=least(p_limit,100);
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_action is null or p_action not in ('create_version','open_round','close_round','set_gap','versions','rounds','answers') or p_data is null or jsonb_typeof(p_data)<>'object' or p_limit is null or p_limit<1 then
  raise exception 'invalid survey request' using errcode='22023'; end if;
 if p_action in ('create_version','open_round','close_round','set_gap') then
  perform 1 from public.c2_survey_settings where singleton for update;
 end if;
 if p_action='create_version' then
  def:=p_data->'definition'; typ:=p_data->>'survey_type'; ver:=(p_data->>'version')::integer;
  if def is null or jsonb_typeof(def)<>'object' or not exists(select 1 from public.pilot_locales where tag=def->>'locale') or def->>'scoring' is distinct from 'none'
   or jsonb_typeof(def->'questions') is distinct from 'array' then
   -- SUS remains the attributed original: no altered SUS wording, scoring or unverified translation.
   if typ is distinct from 'SUS' or def is distinct from (select definition from public.c2_survey_versions where survey_type='SUS' and version=1) then
    raise exception 'invalid version definition or unverified SUS' using errcode='22023'; end if;
  end if;
  if typ='SUS' and def is distinct from (select definition from public.c2_survey_versions where survey_type='SUS' and version=1) then raise exception 'standard SUS required' using errcode='22023'; end if;
  if jsonb_array_length(def->'questions') not between 1 and 10 then raise exception 'one to ten questions required' using errcode='22023'; end if;
  for q in select value from jsonb_array_elements(def->'questions') loop
   if jsonb_typeof(q)<>'object' or coalesce(q->>'id','') !~ '^[a-z][a-z0-9_]{0,39}$' or (q->>'id')=any(ids)
    or coalesce(q->>'kind','') not in ('rating','text') or jsonb_typeof(q->'optional') is distinct from 'boolean'
    or jsonb_typeof(q->'label') is distinct from 'string' or length(btrim(q->>'label')) not between 1 and 1000 then raise exception 'invalid question' using errcode='22023'; end if;
   ids:=array_append(ids,q->>'id');
  end loop;
  insert into public.c2_survey_versions(survey_type,version,definition) values(typ,ver,def) returning id into obj;
  return jsonb_build_object('id',obj);
 elsif p_action='open_round' then
  insert into public.c2_survey_rounds(version_id) values((p_data->>'version_id')::uuid) returning id into obj;
  return jsonb_build_object('id',obj);
 elsif p_action='close_round' then
  update public.c2_survey_rounds set closed_at=clock_timestamp() where id=(p_data->>'id')::uuid and closed_at='infinity' returning id into obj;
  if obj is null then raise exception 'open round required' using errcode='22023'; end if;
  update public.c2_survey_responses set state='cancelled' where round_id=obj and state='pending';
  return jsonb_build_object('id',obj);
 elsif p_action='set_gap' then
  update public.c2_survey_settings set gap_days=(p_data->>'days')::integer where singleton;
  return jsonb_build_object('gap_days',(select gap_days from public.c2_survey_settings where singleton));
 elsif p_action='versions' then
  select coalesce(jsonb_agg(to_jsonb(v) order by id),'[]') into rows from (select * from public.c2_survey_versions where p_after is null or id>p_after order by id limit lim+1) v;
 elsif p_action='rounds' then
  select coalesce(jsonb_agg(v order by id),'[]') into rows from (
   select r.id,to_jsonb(r)||jsonb_build_object('survey_type',v.survey_type,'version',v.version,
    'answered',(select count(*) from public.c2_survey_responses s where s.round_id=r.id and s.state='answered'),
    'pending',(select count(*) from public.c2_survey_responses s where s.round_id=r.id and s.state='pending')) v
   from public.c2_survey_rounds r join public.c2_survey_versions v on v.id=r.version_id where p_after is null or r.id>p_after order by r.id limit lim+1
  ) x;
 else
  -- CSV-ready projection: code only, never auth id/name/email. Text still needs CSV formula escaping in Phase 2.
  select coalesce(jsonb_agg(v order by id),'[]') into rows from (
   select s.id,jsonb_build_object('id',s.id,'participant_code',p.participant_code,'round_id',s.round_id,
    'survey_type',v.survey_type,'version',v.version,'answered_at',s.answered_at,'answers',s.answers,'score',nullif(s.score,-1)) v
   from public.c2_survey_responses s join public.profiles p using(user_id) join public.c2_survey_rounds r on r.id=s.round_id
   join public.c2_survey_versions v on v.id=r.version_id
   where s.state='answered' and (p_after is null or s.id>p_after) and (not(p_data?'round_id') or s.round_id=(p_data->>'round_id')::uuid)
   order by s.id limit lim+1
  ) x;
 end if;
 return jsonb_build_object('rows',rows-lim,'next',case when jsonb_array_length(rows)>lim then rows->(lim-1)->'id' else null end);
end $_$;


ALTER FUNCTION public.owner_surveys_v1(p_action text, p_data jsonb, p_after uuid, p_limit integer) OWNER TO postgres;

--
-- Name: participant_survey_v1(jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.participant_survey_v1(p_answers jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare p public.profiles%rowtype; cfg public.c2_survey_settings%rowtype; s public.c2_survey_responses%rowtype;
 r public.c2_survey_rounds%rowtype; v public.c2_survey_versions%rowtype; q jsonb; a jsonb; keys text[]:='{}'; total numeric:=0; pos integer:=0;
begin
 if not public.is_approved() or not public.has_consented() then raise exception 'approved consenting participant only' using errcode='42501'; end if;
 select * into p from public.profiles where user_id=auth.uid() for update;
 if exists(select 1 from public.c2_account_deletions where user_id=p.user_id) then raise exception 'pending deletion' using errcode='42501'; end if;
 select * into cfg from public.c2_survey_settings where singleton for share;
 select * into s from public.c2_survey_responses where user_id=p.user_id and state='pending' for update;
 if s.id is null then
  if p_answers is not null then raise exception 'pending survey required' using errcode='22023'; end if;
  if p.created_at>=cfg.activated_at and (select count(*) from (select 1 from public.attempts where user_id=p.user_id and mode='practice' limit 5) x)<5 then return jsonb_build_object('pending',null); end if;
  if exists(select 1 from public.c2_survey_responses where user_id=p.user_id
   and greatest(offered_at,case when isfinite(answered_at) then answered_at else offered_at end)>clock_timestamp()-make_interval(days=>cfg.gap_days)) then return jsonb_build_object('pending',null); end if;
  select * into r from public.c2_survey_rounds where closed_at='infinity'
   and not exists(select 1 from public.c2_survey_responses s2 where s2.round_id=c2_survey_rounds.id and s2.user_id=p.user_id)
   order by opened_at,id limit 1 for share;
  if r.id is null then return jsonb_build_object('pending',null); end if;
  insert into public.c2_survey_responses(user_id,round_id) values(p.user_id,r.id) returning * into s;
 else
  select * into r from public.c2_survey_rounds where id=s.round_id for share;
  if r.closed_at<>'infinity' then raise exception 'round closed' using errcode='22023'; end if;
 end if;
 select * into v from public.c2_survey_versions where id=r.version_id;
 if p_answers is null then return jsonb_build_object('pending',jsonb_build_object('id',s.id,'round_id',r.id,'survey_type',v.survey_type,'version',v.version,'definition',v.definition)); end if;
 -- Bind submissions to the offered response, so a stale form cannot answer another round.
 if jsonb_typeof(p_answers)<>'object' or p_answers->>'id' is distinct from s.id::text then raise exception 'survey response mismatch' using errcode='22023'; end if;
 p_answers:=p_answers->'answers';
 if p_answers is null or jsonb_typeof(p_answers)<>'object' or octet_length(p_answers::text)>20000 then raise exception 'invalid answers' using errcode='22023'; end if;
 for q in select value from jsonb_array_elements(v.definition->'questions') loop
  pos:=pos+1; keys:=array_append(keys,q->>'id'); a:=p_answers->(q->>'id');
  if a is null and (q->>'optional')::boolean then continue; end if;
  if q->>'kind'='rating' then
   if a is null or jsonb_typeof(a)<>'number' or (a::text)::numeric not between 1 and 5 or (a::text)::numeric<>trunc((a::text)::numeric) then raise exception 'rating must be integer 1-5' using errcode='22023'; end if;
   if v.definition->>'scoring'='sus' then total:=total+case when pos%2=1 then (a::text)::numeric-1 else 5-(a::text)::numeric end; end if;
  else
   if a is null or jsonb_typeof(a)<>'string' or length(a#>>'{}')>1000 or (not(q->>'optional')::boolean and length(btrim(a#>>'{}'))=0) then raise exception 'invalid text answer' using errcode='22023'; end if;
  end if;
 end loop;
 if exists(select 1 from jsonb_object_keys(p_answers) k where not(k=any(keys))) then raise exception 'unknown answer key' using errcode='22023'; end if;
 update public.c2_survey_responses set answers=p_answers,answered_at=clock_timestamp(),state='answered',score=case when v.definition->>'scoring'='sus' then total*2.5 else -1 end where id=s.id;
 return jsonb_build_object('answered',true);
end $$;


ALTER FUNCTION public.participant_survey_v1(p_answers jsonb) OWNER TO postgres;

--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl FROM pg_catalog.pg_class c WHERE c.oid = cmd.objid;
        EXECUTE format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

--
-- Name: set_participant_status(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_participant_status(target uuid, new_status text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if not public.is_owner() then
    raise exception 'owner only' using errcode = '42501';
  end if;
  if new_status not in ('pending', 'approved', 'suspended') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  if target = auth.uid() then
    raise exception 'the owner cannot change their own status' using errcode = '42501';
  end if;
  update public.profiles set status = new_status where user_id = target;
end $$;


ALTER FUNCTION public.set_participant_status(target uuid, new_status text) OWNER TO postgres;

--
-- Name: touch_last_seen(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.touch_last_seen() RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO ''
    AS $$ update public.profiles set last_seen_at = now() where user_id = auth.uid() $$;


ALTER FUNCTION public.touch_last_seen() OWNER TO postgres;

--
-- Name: training_page_v1(text, text, uuid, text, text, text, integer, jsonb, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.training_page_v1(p_view text, p_scope text DEFAULT 'own'::text, p_user uuid DEFAULT NULL::uuid, p_exam text DEFAULT NULL::text, p_search text DEFAULT ''::text, p_status text DEFAULT ''::text, p_days integer DEFAULT NULL::integer, p_cursor jsonb DEFAULT NULL::jsonb, p_boundary timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare
 who uuid := case when p_scope='own' then coalesce(p_user,auth.uid()) else p_user end;
 boundary timestamptz := coalesce(p_boundary,statement_timestamp());
 since timestamptz;
 lim integer := least(p_limit,20);
 page jsonb; nxt jsonb; info jsonb;
 ct timestamptz; ci uuid; ck text;
begin
 if not coalesce(public.can_read_training(p_scope,who),false) then raise exception 'training scope denied' using errcode='42501'; end if;
 if p_view is null or p_view not in ('summary','people','exams','history')
   or p_limit is null or p_limit<1 or not isfinite(boundary) or boundary>statement_timestamp()
   or (p_days is not null and p_days not in (7,30,90))
   or p_search is null or length(p_search)>100 or p_status is null or p_status not in ('','pending','approved','suspended')
   or length(p_exam)>80
   or (p_view='people' and (p_scope<>'all' or who is not null))
   or (p_view in ('exams','history') and who is null)
   or (p_view='history' and (p_exam is null or p_exam='')) then
   raise exception 'invalid training request' using errcode='22023';
 end if;
 since := case when p_days is not null then boundary - make_interval(days=>p_days) end;
 if p_cursor is not null then
   if jsonb_typeof(p_cursor)<>'object' then raise exception 'invalid cursor' using errcode='22023'; end if;
   if p_view='people' then ci := (p_cursor->>'id')::uuid;
   elsif p_view='exams' then ck := p_cursor->>'exam';
   elsif p_view='history' then ci := (p_cursor->>'id')::uuid; ct := (p_cursor->>'time')::timestamptz;
   else raise exception 'invalid cursor' using errcode='22023'; end if;
   if (p_view in ('people','history') and ci is null) or (p_view='exams' and (ck is null or length(ck)>80))
      or (p_view='history' and (ct is null or not isfinite(ct) or ct>boundary)) then raise exception 'invalid cursor' using errcode='22023'; end if;
 end if;
 if p_view='summary' then
   select jsonb_build_object('attempts',count(*),'exams',count(distinct exam_id),'latest',max(finished_at),
     'trainees',case when p_scope='all' and who is null then count(distinct user_id) else null end)
   into info from public.attempts where (who is null or user_id=who) and mode='practice' and record_kind='attempt'
     and finished_at<=boundary and (since is null or finished_at>=since);
   return jsonb_build_object('version',1,'boundary',boundary,'summary',info,'rows','[]'::jsonb,'next',null);
 elsif p_view='people' then
   select coalesce(jsonb_agg(v order by id),'[]'::jsonb) into page from (
     select p.user_id id,jsonb_build_object('id',p.user_id,'name',p.display_name,'email',u.email,'status',p.status,
       'attempts',a.n,'exams',a.exams,'latest',a.latest) v
     from public.profiles p join auth.users u on u.id=p.user_id
     cross join lateral (select count(*) n,count(distinct exam_id) exams,max(finished_at) latest from public.attempts
       where user_id=p.user_id and mode='practice' and record_kind='attempt' and finished_at<=boundary and (since is null or finished_at>=since)) a
     where p.created_at<=boundary and (ci is null or p.user_id>ci) and (p_status='' or p.status=p_status)
       and (p_search='' or strpos(lower(coalesce(p.display_name,'')),lower(p_search))>0 or strpos(lower(coalesce(u.email,'')),lower(p_search))>0)
     order by p.user_id limit lim+1
   ) q;
   if jsonb_array_length(page)>lim then page := page-lim; nxt := jsonb_build_object('id',page->(lim-1)->'id'); end if;
 elsif p_view='exams' then
   select coalesce(jsonb_agg(v order by exam collate "C"),'[]'::jsonb) into page from (
     select exam_id exam,jsonb_build_object('exam',exam_id,'attempts',count(*),'latest',max(finished_at)) v
     from public.attempts where user_id=who and mode='practice' and record_kind='attempt' and finished_at<=boundary
       and (since is null or finished_at>=since) and (ck is null or exam_id collate "C">ck collate "C")
     group by exam_id order by exam_id collate "C" limit lim+1
   ) q;
   if jsonb_array_length(page)>lim then page := page-lim; nxt := jsonb_build_object('exam',page->(lim-1)->'exam'); end if;
 else
   select coalesce(jsonb_agg(v order by finished_at desc,id),'[]'::jsonb) into page from (
     select id,finished_at,jsonb_build_object('id',id,'exam',exam_id,'case',case_id,'definition',definition_version,
       'engine',engine_version,'producer',producer_version,'format',result_format_version,'time',finished_at,'result',result) v
     from public.attempts where user_id=who and exam_id=p_exam and mode='practice' and record_kind='attempt'
       and finished_at<=boundary and (since is null or finished_at>=since)
       and (ct is null or finished_at<ct or (finished_at=ct and id>ci))
     order by finished_at desc,id limit lim+1
   ) q;
   if jsonb_array_length(page)>lim then page := page-lim; nxt := jsonb_build_object('id',page->(lim-1)->'id','time',page->(lim-1)->'time'); end if;
 end if;
 return jsonb_build_object('version',1,'boundary',boundary,'summary',null,'rows',page,'next',nxt);
end $$;


ALTER FUNCTION public.training_page_v1(p_view text, p_scope text, p_user uuid, p_exam text, p_search text, p_status text, p_days integer, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) OWNER TO postgres;

--
-- Name: training_page_v1_with_comparison(text, text, uuid, text, text, text, integer, jsonb, timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.training_page_v1_with_comparison(p_view text, p_scope text DEFAULT 'own'::text, p_user uuid DEFAULT NULL::uuid, p_exam text DEFAULT NULL::text, p_search text DEFAULT ''::text, p_status text DEFAULT ''::text, p_days integer DEFAULT NULL::integer, p_cursor jsonb DEFAULT NULL::jsonb, p_boundary timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 20) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO ''
    AS $$
declare page jsonb; enriched jsonb;
begin
 page := public.training_page_v1(p_view,p_scope,p_user,p_exam,p_search,p_status,p_days,p_cursor,p_boundary,p_limit);
 if p_view='history' then
   select coalesce(jsonb_agg(r.value || jsonb_build_object('comparison',a.comparison_version) order by r.ordinality),'[]'::jsonb)
   into enriched from jsonb_array_elements(page->'rows') with ordinality r(value,ordinality)
   join public.attempts a on a.id=(r.value->>'id')::uuid;
   page := jsonb_set(page,'{rows}',enriched);
 end if;
 return page;
end $$;


ALTER FUNCTION public.training_page_v1_with_comparison(p_view text, p_scope text, p_user uuid, p_exam text, p_search text, p_status text, p_days integer, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- Name: authorize(text, text, text, text, text, text[], text[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) RETURNS record
    LANGUAGE plpgsql
    AS $$
declare
  probe_ids uuid[];
  probe_inserted_at timestamp := now() at time zone 'utc';
  visible_ids uuid[];
  ext text;
  allowed boolean;
begin
  -- The probe inserts are rolled back, but they still give the transaction an xid, so it ends
  -- in a commit. Nothing durable was written, so skip waiting on the WAL flush and sync standbys.
  -- Set outside the block below, whose rollback would undo it.
  perform set_config('synchronous_commit', 'off', true);

  -- The RAISE at the end of this block rolls back everything in it.
  begin
    probe_ids := array(select gen_random_uuid() from unnest(read_extensions));

    insert into realtime.messages (id, topic, extension, inserted_at, updated_at)
    select p.id, topic_name, p.extension, probe_inserted_at, probe_inserted_at
    from unnest(probe_ids, read_extensions) as p(id, extension);

    perform set_config('role', role_name, true),
            set_config('realtime.topic', topic_name, true),
            set_config('request.jwt.claims', claims, true),
            set_config('request.jwt.claim.sub', sub, true),
            set_config('request.jwt.claim.role', role_name, true),
            set_config('request.headers', headers, true);

    -- One lookup for every probe, by the full primary key.
    visible_ids := array(
      select m.id
      from realtime.messages m
      where m.inserted_at = probe_inserted_at
        and m.id = any(probe_ids));

    read_allowed := array(
      select p.id = any(visible_ids)
      from unnest(probe_ids) with ordinality as p(id, n)
      order by p.n);

    write_allowed := '{}';

    foreach ext in array write_extensions loop
      begin
        insert into realtime.messages (topic, extension, inserted_at, updated_at)
        values (topic_name, ext, now() at time zone 'utc', now() at time zone 'utc');

        allowed := true;
      exception when insufficient_privilege then
        allowed := false;
      end;

      write_allowed := write_allowed || allowed;
    end loop;

    raise sqlstate 'RTA01';
  exception when sqlstate 'RTA01' then
    null;
  end;
end;
$$;


ALTER FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) OWNER TO supabase_realtime_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_realtime_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_realtime_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_realtime_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_realtime_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) OWNER TO supabase_realtime_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_realtime_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- Name: list_changes_sync(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures the slot is read exactly once.
  consumed AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         realtime.settled_changes(
           slot_name, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM consumed
    WHERE consumed.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM consumed,
         realtime.apply_rls(
           wal := consumed.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE consumed.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


ALTER FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_realtime_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_realtime_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) OWNER TO supabase_realtime_admin;

--
-- Name: settled_changes(name, integer, text[]); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) RETURNS TABLE(lsn pg_lsn, xid xid, data text)
    LANGUAGE plpgsql
    AS $$
declare
  upto pg_lsn;
  total bigint;
  xids xid[];
  starts bigint[];
  snapshot pg_snapshot;
  running_xids xid[];
  xmax_age int;
  cut bigint;
begin
  -- Each statement in a volatile function takes its own snapshot, which is what lets the
  -- check below see a writer that was still in flight when the peek ran. Under REPEATABLE
  -- READ the snapshot never advances, so a deferred change would never be released.
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'realtime.settled_changes requires READ COMMITTED';
  end if;

  -- The peek and the read below cover the same WAL, so the read cannot reach a commit the
  -- check never saw.
  upto := pg_current_wal_flush_lsn();

  -- One entry per transaction, in commit order: its xid and the position of its first
  -- change. The peek uses the caller's own options, so max_changes counts exactly what the
  -- read counts. A non-transactional logical message is emitted as soon as it is decoded,
  -- tagged with the xid of whatever transaction wrote it, so it does not mark where that
  -- transaction starts.
  select coalesce(sum(g.n), 0),
         array_agg(g.x order by g.first) filter (where g.first is not null),
         array_agg(g.first order by g.first) filter (where g.first is not null)
    into total, xids, starts
    from (
      select p.xid as x, count(*) as n,
             min(p.ord) filter (where not case
               when starts_with(p.data, '{"action":"M"') then (p.data::jsonb->>'transactional')::boolean is false
               else false
             end) as first
      from pg_logical_slot_peek_changes(slot_name, upto, max_changes, variadic opts)
           with ordinality as p(lsn, xid, data, ord)
      group by p.xid
    ) g;

  -- Nothing for the caller, but the slot still has to move past what the peek covered.
  if total = 0 then
    perform pg_replication_slot_advance(slot_name, upto);
    return;
  end if;

  if xids is not null then
    -- Taken after the peek is materialized, so a writer that was still in flight during
    -- decoding is guaranteed to show up here.
    snapshot := pg_current_snapshot();

    -- A commit record reaches the WAL before the writer leaves the proc array, so a change
    -- can be decoded while its row is invisible. apply_rls would resolve a policy against a
    -- row it cannot see and authorize it for nobody, while the read consumed it regardless.
    --
    -- xip lists transactions running when the snapshot was taken. It does not cover a writer
    -- whose xid sits at or beyond xmax, which never appears there, so the horizon is checked
    -- too. age() counts backwards from the current xid and so compares correctly across
    -- wraparound.
    select coalesce(array_agg(running.x::xid), array[]::xid[])
      into running_xids
      from pg_snapshot_xip(snapshot) running(x);
    xmax_age := age(pg_snapshot_xmax(snapshot)::xid);

    select min(u.s) into cut
      from unnest(xids, starts) as u(x, s)
      where u.x = any(running_xids) or age(u.x) <= xmax_age;
  end if;

  -- The read stops right after the commit that brings its count to upto_nchanges, so the
  -- count of changes in front of the first unsettled transaction stops it just before that
  -- transaction.
  if cut is null then
    return query
      select p.* from pg_logical_slot_get_changes(slot_name, upto, max_changes, variadic opts) p;
  elsif cut > 1 then
    return query
      select p.* from pg_logical_slot_get_changes(slot_name, upto, (cut - 1)::int, variadic opts) p;
  end if;
end;
$$;


ALTER FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) OWNER TO supabase_realtime_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    -- Normalize selected_columns order so ARRAY['a','b'] and ARRAY['b','a'] are treated
    -- as the same subscription group in apply_rls. Preserve an empty array as '{}'
    -- ("primary keys only") so it stays distinct from NULL ("all columns"); array_agg
    -- over an empty set would otherwise collapse '{}' back to NULL.
    if new.selected_columns is not null then
        new.selected_columns = coalesce(
            (
                select array_agg(c order by c)
                from unnest(new.selected_columns) c
            ),
            '{}'::text[]
        );
    end if;

    return new;
end;
$$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_realtime_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_realtime_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


ALTER FUNCTION realtime.wal2json_escape_identifier(name text) OWNER TO supabase_realtime_admin;

--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION storage.allow_any_operation(expected_operations text[]) OWNER TO supabase_storage_admin;

--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION storage.allow_only_operation(expected_operation text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_lifecycle_service_role(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_lifecycle_service_role() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
  IF current_user::text IS DISTINCT FROM TG_ARGV[0]
     AND (
       OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
       OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation
     ) THEN
    -- AFTER runs only after caller RLS has accepted the proposed row. The API
    -- recognizes this specific error after rolling back its permission probe;
    -- direct non-service writes still fail and cannot persist the change.
    RAISE EXCEPTION 'bucket control columns may only be changed by the configured storage service role'
      USING ERRCODE = 'PST01',
            SCHEMA = TG_TABLE_SCHEMA,
            TABLE = TG_TABLE_NAME,
            CONSTRAINT = TG_NAME;
  END IF;

  RETURN NULL;
END;
$$;


ALTER FUNCTION storage.enforce_bucket_lifecycle_service_role() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN p_delimiter <> ''
         AND position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(
        p_key,
        length(p_prefix)
            + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1))
            + length(p_delimiter) - 1
    )
    ELSE NULL
END;
$$;


ALTER FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket(noncurrent_versions text DEFAULT 'include'::text, delete_markers text DEFAULT 'include'::text) RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'include');
    delete_markers := COALESCE(delete_markers, 'include');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'include';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'include';
    END IF;

    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        where (noncurrent_versions != 'exclude' OR obj.archived_at IS NULL)
          and (noncurrent_versions != 'only' OR obj.archived_at IS NOT NULL)
          and (delete_markers != 'exclude' OR NOT obj.is_delete_marker)
          and (delete_markers != 'only' OR obj.is_delete_marker)
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket(noncurrent_versions text, delete_markers text) OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text, raw_prefix_param text DEFAULT NULL::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $_$
WITH candidates AS (
    SELECT
        upload.key AS object_key,
        CASE
            WHEN position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0
            THEN left(
                upload.key,
                length(coalesce($7, $2))
                    + position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1))
                    + length($3) - 1
            )
            ELSE upload.key
        END AS result_key,
        upload.id,
        upload.created_at,
        position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0 AS is_common_prefix
    FROM storage.s3_multipart_uploads AS upload
    WHERE upload.bucket_id = $1
      AND upload.key COLLATE "C" LIKE $2 || '%'
), filtered AS (
    SELECT candidate.*
    FROM candidates AS candidate
    WHERE $5 = ''
       OR candidate.result_key COLLATE "C" > $5
       OR (
           candidate.result_key COLLATE "C" = $5
           AND NOT candidate.is_common_prefix
           AND $6 <> ''
           -- A completed or aborted marker repeats the remaining same-key uploads.
           AND COALESCE(
               (candidate.created_at, candidate.id COLLATE "C") > (
                   SELECT marker.created_at, marker.id COLLATE "C"
                   FROM storage.s3_multipart_uploads AS marker
                   WHERE marker.bucket_id = $1
                     AND marker.key COLLATE "C" = $5
                     AND marker.id = $6
               ),
               TRUE
           )
       )
), ranked AS (
    SELECT
        filtered.*,
        row_number() OVER (
            PARTITION BY filtered.result_key COLLATE "C"
            ORDER BY filtered.created_at, filtered.id COLLATE "C"
        ) AS prefix_rank
    FROM filtered
)
SELECT ranked.result_key, ranked.id, ranked.created_at
FROM ranked
WHERE NOT ranked.is_common_prefix OR ranked.prefix_rank = 1
ORDER BY ranked.result_key COLLATE "C", ranked.created_at, ranked.id COLLATE "C"
LIMIT $4;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text, raw_prefix_param text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text, text, text, timestamp with time zone, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, next_token_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, next_token_version text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_start_relative TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;

    -- true when noncurrent_versions can return >1 row per name; keeps them
    -- ordered most-recent-first and lets pagination resume mid-key
    v_multi_row BOOLEAN;
    v_name_order TEXT;
    v_exact_range_predicate TEXT;
    v_strict_range_predicate TEXT;
    v_inclusive_range_predicate TEXT;

    -- Seek state for the current name. archived_at is normalized to JavaScript's
    -- millisecond precision and version breaks ties within the same millisecond.
    -- Current rows use 'infinity'; NULL means no tiebreak has been established.
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_cursor_is_folder BOOLEAN;
    v_count INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_batch_query_strict TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');
    v_name_order := CASE WHEN v_is_asc THEN 'ASC' ELSE 'DESC' END;

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Keep caller-provided cursors inside the requested prefix range.
    IF v_start <> '' AND v_upper_bound IS NOT NULL THEN
        IF v_is_asc THEN
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                v_start := '';
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                RETURN;
            END IF;
        ELSE
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                RETURN;
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                v_start := '';
            END IF;
        END IF;
    END IF;

    v_start_relative := substring(v_start FROM length(v_prefix) + 1);

    -- Direction affects only the indexed name range and its ordering. Cursor
    -- state transitions and within-key version ordering stay shared.
    IF v_is_asc THEN
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" > $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" >= $2';
        IF v_upper_bound IS NOT NULL THEN
            v_exact_range_predicate := 'o.name COLLATE "C" < $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" < $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" < $3';
        END IF;
    ELSE
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" < $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" < $2';
        IF v_prefix <> '' THEN
            v_exact_range_predicate := 'o.name COLLATE "C" >= $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" >= $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" >= $3';
        END IF;
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    -- The multi-row order matches the externally serialized cursor exactly:
    -- archived_at at millisecond precision, then version as the final tiebreak.
    --
    -- When v_multi_row, the seek is a keyset tuple comparison ("name > $2 OR
    -- (name = $2 AND tiebreak)") - Postgres won't split that OR into indexable
    -- form (confirmed even with fully literal values), so as one WHERE clause
    -- it forces a full bucket scan filtered row-by-row. Splitting it into two
    -- independently-indexable branches (exact name match with the tiebreak
    -- filter, vs. strictly-past names) combined with UNION ALL lets each
    -- branch keep name as a real index condition; the outer ORDER BY/LIMIT
    -- re-merges them into the same page the single query used to produce.
    IF v_multi_row THEN
        v_batch_query := format(
            $sql$
            SELECT *
            FROM (
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND o.name COLLATE "C" = $2
                      AND %s
                      AND NOT $7::boolean
                      AND (
                          $5::timestamptz IS NULL
                          OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < $5
                          OR (
                              COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = $5
                              AND COALESCE(o.version, '') > $6
                          )
                      )
                      %s
                    ORDER BY
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
                UNION ALL
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND %s
                      %s
                    ORDER BY
                        o.name COLLATE "C" %s,
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
            ) sub
            ORDER BY
                sub.name COLLATE "C" %s,
                COALESCE(date_trunc('milliseconds', sub.archived_at), 'infinity'::timestamptz) DESC,
                COALESCE(sub.version, '') ASC
            LIMIT $4
            $sql$,
            v_exact_range_predicate,
            v_version_filter,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order,
            v_name_order
        );
    ELSE
        v_batch_query := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_inclusive_range_predicate,
            v_version_filter,
            v_name_order
        );

        -- Strict counterpart of the query above: used once the single-row
        -- ASC batch advance (below) has left v_next_seek pointing at the
        -- last row already emitted, so an inclusive predicate would
        -- re-match it forever. Only single-row mode ever sets strict mode,
        -- so this variant is never needed when v_multi_row.
        v_batch_query_strict := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order
        );
    END IF;

    -- The static peek predicates cannot use the partial delete-marker index
    -- once PL/pgSQL switches to a generic plan because whether
    -- is_delete_marker is required remains parameter-dependent. Reuse the
    -- already-specialized batch query with a one-row limit for this sparse
    -- filter so the plan sees a literal `o.is_delete_marker` predicate.
    IF delete_markers = 'only' THEN
        v_delete_marker_peek_query :=
            'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        IF NOT v_multi_row THEN
            v_delete_marker_peek_query_strict :=
                'SELECT marker_page.name FROM (' || v_batch_query_strict || ') marker_page LIMIT 1';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor performs one specialized initial seek so
            -- partial current-version and delete-marker indexes remain available.
            EXECUTE format(
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY o.name COLLATE "C" DESC LIMIT 1',
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND o.name COLLATE "C" >= $2 AND o.name COLLATE "C" < $3'
                    ELSE ''
                END,
                v_version_filter
            )
            INTO v_next_seek
            USING _bucket_id, v_prefix, v_upper_bound;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Folder continuation tokens retain their trailing delimiter. A
        -- delimiter-less startAfter is always a literal key boundary.
        v_cursor_is_folder := delimiter_param <> ''
            AND v_start_relative <> ''
            AND right(v_start_relative, length(delimiter_param)) = delimiter_param;

        IF v_cursor_is_folder THEN
            v_next_seek := CASE
                WHEN right(v_start, length(delimiter_param)) = delimiter_param
                    THEN v_start
                ELSE v_start || delimiter_param
            END;
            IF v_is_asc THEN
                v_next_seek := left(v_next_seek, -1)
                    || chr(ascii(right(v_next_seek, 1)) + 1);
            END IF;
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- leaf object: when v_multi_row, stay on v_start with the
            -- caller-supplied tiebreak so a page boundary mid-key resumes
            -- that key's remaining rows instead of skipping them. Truncate
            -- to milliseconds like every other v_next_seek_at assignment -
            -- harmless today since object.ts's cursor always round-trips
            -- through JS Date first, but this shouldn't rely on that.
            IF v_multi_row THEN
                v_next_seek := v_start;
                v_next_seek_at := date_trunc('milliseconds', next_token_archived_at);
                v_next_seek_version := coalesce(next_token_version, '');
                v_next_seek_strict := coalesce(next_token, '') = '';
            ELSIF v_is_asc THEN
                v_next_seek := v_start;
                v_next_seek_strict := true;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        -- v_multi_row is branched here (rather than folded into the WHERE
        -- clause as a bound parameter) so each concrete query keeps an
        -- unconditional seek predicate - once PL/pgSQL switches to its
        -- cached generic plan (after 5 calls), a parameter-gated
        -- "(NOT v_multi_row AND name >= $x) OR (v_multi_row AND ...)"
        -- predicate stops the planner from using name as an index
        -- condition at all, degrading every subsequent peek to a full
        -- index scan filtered row-by-row instead of a bounded range scan.
        -- v_multi_row's seek predicate is a keyset tuple comparison
        -- ("name > x OR (name = x AND tiebreak)") - Postgres does not
        -- split this OR into indexable form even with fully literal
        -- values, so it falls back to a full scan filtered row-by-row.
        -- Splitting it into two independently-indexable branches (exact
        -- name match with the tiebreak filter, vs. strictly-past name)
        -- combined with UNION ALL lets each branch keep name as a real
        -- index condition; the outer ORDER BY/LIMIT picks whichever of
        -- the (at most 2) rows sorts first.
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING _bucket_id, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END,
                    1, v_next_seek_at, v_next_seek_version, v_next_seek_strict;
        ELSIF v_multi_row THEN
            IF v_is_asc THEN
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" < v_upper_bound
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek AND o.name COLLATE "C" < v_upper_bound
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" >= v_prefix
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        ELSE
            -- Single-row mode is always noncurrent_versions='exclude'. Keep
            -- this predicate literal so generic plans use the current index.
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.name COLLATE "C" >= v_prefix
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := v_common_prefix;
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            version := NULL;
            archived_at := NULL;
            is_delete_marker := NULL;
            is_versioned := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1)
                    || chr(ascii(right(v_common_prefix, 1)) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row THEN v_batch_query_strict ELSE v_batch_query END
                USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size, v_next_seek_at, v_next_seek_version,
                v_next_seek_strict
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN v_current.name
                        ELSE v_current.name || delimiter_param
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                version := v_current.version;
                archived_at := v_current.archived_at;
                is_delete_marker := v_current.is_delete_marker;
                is_versioned := v_current.is_versioned;
                RETURN NEXT;
                v_count := v_count + 1;

                -- when v_multi_row, stay on this name and record its
                -- archived_at as the new tiebreak so remaining rows for the
                -- same key are picked up before moving to the next name
                IF v_multi_row THEN
                    v_next_seek := v_current.name;
                    v_next_seek_at := COALESCE(date_trunc('milliseconds', v_current.archived_at), 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                    v_next_seek_strict := false;
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor
                    -- would skip a real key like `name || '!'` (or any
                    -- character sorting below the delimiter), which sorts
                    -- between `name` and `name || delimiter`. Track the real
                    -- name and mark the next comparison strict instead.
                    v_next_seek := v_current.name;
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.list_objects_with_delimiter made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text, sort_order text, noncurrent_versions text, delete_markers text, next_token_archived_at timestamp with time zone, next_token_version text) OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: protect_bucket_control_columns(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_bucket_control_columns() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  configuration_changed boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lifecycle_configuration IS NOT NULL
       OR NEW.lifecycle_configuration_generation IS NOT NULL THEN
      IF NOT pg_has_role(current_user, TG_ARGV[0], 'MEMBER') THEN
        RAISE EXCEPTION 'only members of the configured storage service role may insert lifecycle policy state'
          USING ERRCODE = '42501',
                HINT = format(
                  'Insert with both lifecycle columns NULL and configure lifecycle through the Storage API afterward, or insert as a member of %I.',
                  TG_ARGV[0]
                );
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  configuration_changed =
    OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
    OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation;

  IF NOT configuration_changed THEN
    RETURN NEW;
  END IF;

  IF NEW.type IS DISTINCT FROM 'STANDARD' THEN
    RAISE EXCEPTION 'bucket versioning and lifecycle controls require a Standard bucket'
      USING ERRCODE = '0A000';
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     AND NEW.lifecycle_configuration_generation IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     OR NEW.lifecycle_configuration_generation IS NULL
     OR OLD.lifecycle_configuration IS NOT DISTINCT FROM NEW.lifecycle_configuration
     OR OLD.lifecycle_configuration_generation IS NOT DISTINCT FROM NEW.lifecycle_configuration_generation THEN
    RAISE EXCEPTION 'a changed lifecycle policy requires a new non-null generation'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION storage.protect_bucket_control_columns() OWNER TO supabase_storage_admin;

--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION storage.protect_delete() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_prefix_len INT;
    v_prefix_start INT;
    v_combined_levels INT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;
    v_multi_row BOOLEAN;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_count INT := 0;
    v_skipped INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;
    v_previous_skipped INT;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_prefix_len := length(coalesce(prefix, ''));
    v_prefix_start := coalesce(array_length(string_to_array(coalesce(prefix, ''), v_delimiter), 1), 1);
    v_combined_levels := coalesce(array_length(string_to_array(v_prefix, v_delimiter), 1), 1);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT array_to_string(path_tokens[$1:$2], '/') AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $3 || '%%'
                  AND bucket_id = $4
                  AND array_length(objects.path_tokens, 1) <> $2
                  AND ($7 != 'exclude' OR objects.archived_at IS NULL)
                  AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
                  AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
                  AND ($8 != 'only' OR objects.is_delete_marker)
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata,
                   NULL::text AS version,
                   NULL::timestamptz AS archived_at,
                   NULL::boolean AS is_delete_marker,
                   NULL::boolean AS is_versioned FROM folders)
            UNION ALL
            (SELECT array_to_string(path_tokens[$1:$2], '/') AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata,
                   version, archived_at, is_delete_marker, is_versioned
             FROM storage.objects
             WHERE objects.name ILIKE $3 || '%%'
               AND bucket_id = $4
               AND array_length(objects.path_tokens, 1) = $2
               AND ($7 != 'exclude' OR objects.archived_at IS NULL)
               AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
               AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
               AND ($8 != 'only' OR objects.is_delete_marker)
             -- name, then version, as tiebreaks so two versions of the same
             -- key tying on the sort column still sort deterministically
             ORDER BY %I %s, name COLLATE "C" %s, COALESCE(version, '') %s)
            LIMIT $5 OFFSET $6
            $sql$, v_sort_order, v_order_by, v_sort_order, v_sort_order, v_sort_order
        ) USING v_prefix_start, v_combined_levels, v_prefix, bucketname, v_limit, offsets, noncurrent_versions, delete_markers;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build a resume-safe batch query. The exact-name branch returns remaining
    -- versions after the current (archived_at, version) boundary; the strict
    -- name branch returns subsequent keys. UNION ALL keeps both predicates
    -- independently indexable.
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2 AND lower(o.name) COLLATE "C" < $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 AND lower(o.name) COLLATE "C" >= $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    END IF;

    -- Keep the delete-marker predicate literal so the cached generic
    -- plan can use idx_objects_delete_markers during the main-loop peek.
    IF delete_markers = 'only' THEN
        IF v_multi_row THEN
            v_delete_marker_peek_query :=
                'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        ELSIF v_is_asc THEN
            -- Two separate literal query strings, not one gated by a bound
            -- boolean: folding "$n AND op1 OR NOT $n AND op2" into a single
            -- query defeats the generic plan's ability to push either
            -- comparison into the index. Branching in PL/pgSQL control flow
            -- instead keeps each query's index condition intact.
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" >= $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
            -- Strict variant: used once the single-row ASC batch advance
            -- (below) has left v_next_seek pointing at the last row already
            -- emitted, so a plain >= would re-match it forever.
            v_delete_marker_peek_query_strict :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" > $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
        ELSE
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" < $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" >= $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC performs one specialized initial seek so partial current-version
        -- and delete-marker indexes remain available.
        EXECUTE format(
            'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1',
            CASE WHEN v_upper_bound IS NOT NULL
                THEN ' AND lower(o.name) COLLATE "C" >= $2 AND lower(o.name) COLLATE "C" < $3'
                ELSE ''
            END,
            v_version_filter
        )
        INTO v_peek_name
        USING bucketname, v_prefix_lower, v_upper_bound;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch and
    -- the delete-marker-only path
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;
        v_previous_skipped := v_skipped;

        -- STEP 1: PEEK
        v_peek_name := NULL;
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END,
                    1, v_next_seek_at, v_next_seek_version;
        ELSIF v_multi_row AND v_next_seek_at IS NOT NULL THEN
            SELECT o.name INTO v_peek_name
            FROM storage.objects o
            WHERE o.bucket_id = bucketname
              AND lower(o.name) COLLATE "C" = v_next_seek
              AND (COALESCE(o.archived_at, 'infinity'::timestamptz) < v_next_seek_at
                   OR (COALESCE(o.archived_at, 'infinity'::timestamptz) = v_next_seek_at
                       AND COALESCE(o.version, '') > v_next_seek_version))
              AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
              AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
              AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
              AND (delete_markers != 'only' OR o.is_delete_marker)
            ORDER BY COALESCE(o.archived_at, 'infinity'::timestamptz) DESC,
                     COALESCE(o.version, '') ASC
            LIMIT 1;

            -- The current key is exhausted. Clear its version boundary and
            -- make the following ASC name peek strict. Appending '/' is not a
            -- valid lexical successor because keys ending in characters such
            -- as '!' sort between the exhausted name and name || '/'.
            IF v_peek_name IS NULL THEN
                IF v_is_asc THEN
                    v_next_seek_strict := true;
                END IF;
                v_next_seek_at := NULL;
                v_next_seek_version := '';
            END IF;
        END IF;

        -- Single-row mode is always noncurrent_versions='exclude'. Keep the
        -- current-row predicate literal so generic plans use the current index.
        IF delete_markers != 'only' AND v_peek_name IS NULL AND NOT v_multi_row THEN
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL AND v_is_asc THEN
            IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_next_seek_strict THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- If the peek landed on a different key than we were tracking, any
        -- version boundary belongs to the OLD key and must not leak into the
        -- new one - e.g. the deleteMarkers='only' peek doesn't know or care
        -- whether it's continuing the same key or jumping to a new one, so
        -- it never clears these itself.
        IF lower(v_peek_name) IS DISTINCT FROM v_next_seek THEN
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        END IF;

        -- The peek is authoritative for the next key to process. This is
        -- especially important after exhausting a multi-version key: the
        -- version boundary has been cleared, so executing the batch against
        -- a stale v_next_seek would replay every version of that old key.
        v_next_seek := lower(v_peek_name);
        v_next_seek_strict := false;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := substring(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter) from v_prefix_len + 1);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                version := NULL;
                archived_at := NULL;
                is_delete_marker := NULL;
                is_versioned := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size,
                    v_next_seek_at, v_next_seek_version
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too - it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN lower(v_current.name)
                        ELSE lower(v_current.name) || v_delimiter
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := substring(v_current.name from v_prefix_len + 1);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    version := v_current.version;
                    archived_at := v_current.archived_at;
                    is_delete_marker := v_current.is_delete_marker;
                    is_versioned := v_current.is_versioned;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Multi-row mode must remain on this key until all of its
                -- versions have crossed the internal batch boundary.
                IF v_multi_row THEN
                    v_next_seek := lower(v_current.name);
                    v_next_seek_at := COALESCE(v_current.archived_at, 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor would
                    -- skip a real key like `name || '!'` (or any character
                    -- sorting below the delimiter), which sorts between `name`
                    -- and `name || delimiter`. Track the real name and mark the
                    -- next comparison strict instead - same fix as the
                    -- exhausted-key case above.
                    v_next_seek := lower(v_current.name);
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_skipped = v_previous_skipped
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.search made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text, noncurrent_versions text, delete_markers text) OWNER TO supabase_storage_admin;

--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, p_start_after_version text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
    v_prefix_pattern text;
    v_sort_order text;
    v_sort_column text;
    v_version_tiebreak text;
BEGIN
    v_prefix := coalesce(p_prefix, '');
    -- Keep the raw prefix for common-prefix calculations and escape only LIKE metacharacters.
    v_prefix_pattern := replace(v_prefix, chr(92), chr(92) || chr(92));
    v_prefix_pattern := replace(v_prefix_pattern, '%', chr(92) || '%');
    v_prefix_pattern := replace(v_prefix_pattern, '_', chr(92) || '_');

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    -- $9 is only populated in multi-row mode; it's always '' otherwise, so
    -- only use each row's real version as a tiebreak in multi-row mode.
    v_version_tiebreak := CASE WHEN noncurrent_versions IN ('only', 'include') THEN 'COALESCE(version, '''')' ELSE '''''' END;

    -- Defense-in-depth: this function is independently reachable and must
    -- not trust p_sort_order/p_sort_column to already be validated by a
    -- caller. Normalize to the same strict allow-list storage.search_v2
    -- uses before interpolating anything into dynamic SQL below.
    v_sort_order := lower(coalesce(p_sort_order, 'asc'));
    IF v_sort_order NOT IN ('asc', 'desc') THEN
        v_sort_order := 'asc';
    END IF;

    v_sort_column := lower(coalesce(p_sort_column, 'updated_at'));
    IF v_sort_column NOT IN ('updated_at', 'created_at') THEN
        v_sort_column := 'updated_at';
    END IF;

    IF v_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                o.version AS obj_version,
                o.archived_at AS obj_archived_at,
                o.is_delete_marker AS obj_is_delete_marker,
                o.is_versioned AS obj_is_versioned,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $10 || '%%'
              AND ($7 != 'exclude' OR o.archived_at IS NULL)
              AND ($7 != 'only' OR o.archived_at IS NOT NULL)
              AND ($8 != 'exclude' OR NOT o.is_delete_marker)
              AND ($8 != 'only' OR o.is_delete_marker)
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                common_prefix AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                NULL::text AS version,
                NULL::timestamptz AS archived_at,
                NULL::boolean AS is_delete_marker,
                NULL::boolean AS is_versioned,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                obj_version AS version,
                obj_archived_at AS archived_at,
                obj_is_delete_marker AS is_delete_marker,
                obj_is_versioned AS is_versioned,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz),
                    name COLLATE "C",
                    %s
                ) %s ROW(
                    -- truncated the same way as the stored value above
                    date_trunc('milliseconds', COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz)),
                    $5,
                    $9
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata,
            version,
            archived_at,
            is_delete_marker,
            is_versioned
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s,
            COALESCE(version, '') %s
        LIMIT $4
    $sql$,
        v_sort_column,
        v_version_tiebreak,
        v_cursor_op,
        v_sort_column,
        v_sort_order,
        v_sort_order,
        v_sort_order
    );

    -- version is the third tiebreak component for two versions of the same
    -- key tying on both timestamp and name (see filtered CTE / ORDER BY above)
    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after, noncurrent_versions, delete_markers, coalesce(p_start_after_version, ''), v_prefix_pattern;
END;
$_$;


ALTER FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text, noncurrent_versions text, delete_markers text, p_start_after_version text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text, text, text, text, text, text, timestamp with time zone, text, boolean); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, start_after_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, start_after_version text DEFAULT ''::text, start_after_is_continuation boolean DEFAULT false) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata,
            l.version,
            l.archived_at,
            l.is_delete_marker,
            l.is_versioned
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            CASE WHEN start_after_is_continuation THEN '' ELSE start_after END,
            CASE WHEN start_after_is_continuation THEN start_after ELSE '' END,
            v_sort_ord,
            noncurrent_versions,
            delete_markers,
            start_after_archived_at,
            start_after_version
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after,
            noncurrent_versions, delete_markers, start_after_version
        );
    END IF;
END;
$$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text, sort_order text, sort_column text, sort_column_after text, noncurrent_versions text, delete_markers text, start_after_archived_at timestamp with time zone, start_after_version text, start_after_is_continuation boolean) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: account_stops; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.account_stops (
    user_id uuid NOT NULL,
    disabled_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);


ALTER TABLE assess.account_stops OWNER TO postgres;

--
-- Name: assignment_managers; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.assignment_managers (
    assignment_id uuid NOT NULL,
    manager_id uuid NOT NULL
);


ALTER TABLE assess.assignment_managers OWNER TO postgres;

--
-- Name: assignment_review_targets; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.assignment_review_targets (
    review_id uuid NOT NULL,
    user_id uuid NOT NULL,
    period_id uuid NOT NULL,
    visible_from timestamp with time zone NOT NULL
);


ALTER TABLE assess.assignment_review_targets OWNER TO postgres;

--
-- Name: assignment_scopes; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.assignment_scopes (
    assignment_id uuid NOT NULL,
    group_id uuid NOT NULL,
    supervisor_id uuid,
    review_id uuid NOT NULL
);


ALTER TABLE assess.assignment_scopes OWNER TO postgres;

--
-- Name: assignments; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    version_id uuid NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    source_group_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    CONSTRAINT assignments_revision_check CHECK ((revision > 0))
);


ALTER TABLE assess.assignments OWNER TO postgres;

--
-- Name: authoring_drafts; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.authoring_drafts (
    id uuid NOT NULL,
    writer_id uuid,
    group_id uuid NOT NULL,
    track text NOT NULL,
    revision integer NOT NULL,
    document jsonb NOT NULL,
    refs jsonb NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    CONSTRAINT authoring_drafts_document_check CHECK ((octet_length((document)::text) <= 131072)),
    CONSTRAINT authoring_drafts_document_check1 CHECK ((jsonb_array_length((document -> 'items'::text)) <= 200)),
    CONSTRAINT authoring_drafts_revision_check CHECK (((revision >= 1) AND (revision <= 100))),
    CONSTRAINT authoring_drafts_track_check CHECK ((track = ANY (ARRAY['mixed'::text, 'full-practical'::text])))
);


ALTER TABLE assess.authoring_drafts OWNER TO postgres;

--
-- Name: authoring_publication_links; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.authoring_publication_links (
    version_id uuid NOT NULL,
    draft_id uuid NOT NULL,
    draft_revision integer NOT NULL,
    source_digest text NOT NULL
);


ALTER TABLE assess.authoring_publication_links OWNER TO postgres;

--
-- Name: authoring_references; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.authoring_references (
    key text NOT NULL,
    kind text NOT NULL,
    revision text NOT NULL,
    case_id text NOT NULL,
    case_version text NOT NULL,
    evaluator_version text NOT NULL,
    active boolean DEFAULT false NOT NULL,
    CONSTRAINT authoring_references_key_check CHECK (((length(key) >= 1) AND (length(key) <= 200))),
    CONSTRAINT authoring_references_kind_check CHECK ((kind = ANY (ARRAY['simulator-part'::text, 'full-practical'::text]))),
    CONSTRAINT authoring_references_revision_check CHECK (((length(revision) >= 1) AND (length(revision) <= 100)))
);


ALTER TABLE assess.authoring_references OWNER TO postgres;

--
-- Name: authoring_reviewed_packages; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.authoring_reviewed_packages (
    draft_id uuid NOT NULL,
    draft_revision integer NOT NULL,
    source_digest text NOT NULL,
    document jsonb NOT NULL,
    CONSTRAINT authoring_reviewed_packages_document_check CHECK (((jsonb_typeof(document) = 'object'::text) AND (pg_column_size(document) <= 131072) AND (octet_length((document)::text) <= 131072))),
    CONSTRAINT authoring_reviewed_packages_source_digest_check CHECK ((source_digest ~ '^[a-f0-9]{64}$'::text))
);


ALTER TABLE assess.authoring_reviewed_packages OWNER TO postgres;

--
-- Name: authoring_revisions; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.authoring_revisions (
    draft_id uuid NOT NULL,
    revision integer NOT NULL,
    document jsonb NOT NULL,
    refs jsonb NOT NULL,
    digest text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT authoring_revisions_document_check CHECK ((octet_length((document)::text) <= 131072))
);


ALTER TABLE assess.authoring_revisions OWNER TO postgres;

--
-- Name: consents; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.consents (
    user_id uuid NOT NULL,
    version text NOT NULL,
    accepted_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT consents_version_check CHECK ((version = ANY (ARRAY['assess-pilot-2026-10-20-v1'::text, 'assess-pilot-2026-10-20-v2'::text])))
);


ALTER TABLE assess.consents OWNER TO postgres;

--
-- Name: content_submissions; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.content_submissions (
    version_id uuid NOT NULL,
    document jsonb,
    state text DEFAULT 'pending'::text NOT NULL,
    CONSTRAINT content_submissions_check CHECK (((state = 'pending'::text) = (document IS NOT NULL))),
    CONSTRAINT content_submissions_state_check CHECK ((state = ANY (ARRAY['pending'::text, 'installed'::text])))
);


ALTER TABLE assess.content_submissions OWNER TO postgres;

--
-- Name: erasure_fk_contract; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.erasure_fk_contract (
    singleton boolean DEFAULT true NOT NULL,
    inventory jsonb NOT NULL,
    CONSTRAINT erasure_fk_contract_singleton_check CHECK (singleton)
);


ALTER TABLE assess.erasure_fk_contract OWNER TO postgres;

--
-- Name: erasure_rights; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.erasure_rights (
    user_id uuid NOT NULL,
    content_digest text NOT NULL,
    disposition text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT erasure_rights_content_digest_check CHECK ((content_digest ~ '^[a-f0-9]{64}$'::text)),
    CONSTRAINT erasure_rights_disposition_check CHECK ((disposition = ANY (ARRAY['no-personal-data'::text, 'minimum-required-attribution'::text])))
);


ALTER TABLE assess.erasure_rights OWNER TO postgres;

--
-- Name: erasure_transfers; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.erasure_transfers (
    user_id uuid NOT NULL,
    requested_at timestamp with time zone NOT NULL,
    manager_id uuid NOT NULL,
    inventory_digest text NOT NULL,
    content_digest text NOT NULL,
    transferred_at timestamp with time zone NOT NULL,
    erasing_xid bigint,
    CONSTRAINT erasure_transfers_check CHECK ((transferred_at < (requested_at + '30 days'::interval))),
    CONSTRAINT erasure_transfers_content_digest_check CHECK ((content_digest ~ '^[a-f0-9]{64}$'::text)),
    CONSTRAINT erasure_transfers_inventory_digest_check CHECK ((inventory_digest ~ '^[a-f0-9]{64}$'::text))
);


ALTER TABLE assess.erasure_transfers OWNER TO postgres;

--
-- Name: group_join_codes; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.group_join_codes (
    group_id uuid NOT NULL,
    digest text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT group_join_codes_digest_check CHECK ((digest ~ '^[a-f0-9]{64}$'::text))
);


ALTER TABLE assess.group_join_codes OWNER TO postgres;

--
-- Name: group_join_requests; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.group_join_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    state text NOT NULL,
    revision integer DEFAULT 1 NOT NULL,
    requested_at timestamp with time zone NOT NULL,
    decided_at timestamp with time zone,
    decided_by uuid,
    CONSTRAINT group_join_requests_revision_check CHECK ((revision > 0)),
    CONSTRAINT group_join_requests_state_check CHECK ((state = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])))
);


ALTER TABLE assess.group_join_requests OWNER TO postgres;

--
-- Name: group_managers; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.group_managers (
    group_id uuid NOT NULL,
    manager_id uuid NOT NULL
);


ALTER TABLE assess.group_managers OWNER TO postgres;

--
-- Name: join_request_throttles; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.join_request_throttles (
    user_id uuid NOT NULL,
    window_at timestamp with time zone NOT NULL,
    used integer NOT NULL,
    CONSTRAINT join_request_throttles_used_check CHECK (((used >= 0) AND (used <= 10)))
);


ALTER TABLE assess.join_request_throttles OWNER TO postgres;

--
-- Name: launch_gate; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.launch_gate (
    singleton boolean DEFAULT true NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    CONSTRAINT launch_gate_singleton_check CHECK (singleton)
);


ALTER TABLE assess.launch_gate OWNER TO postgres;

--
-- Name: membership_periods; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.membership_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp with time zone NOT NULL,
    left_at timestamp with time zone,
    CONSTRAINT membership_periods_check CHECK (((left_at IS NULL) OR (left_at >= joined_at)))
);


ALTER TABLE assess.membership_periods OWNER TO postgres;

--
-- Name: memberships; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.memberships (
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    period_id uuid
);


ALTER TABLE assess.memberships OWNER TO postgres;

--
-- Name: practical_presentations; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.practical_presentations (
    version_id uuid NOT NULL,
    views jsonb NOT NULL,
    CONSTRAINT practical_presentations_views_check CHECK (((jsonb_typeof(views) = 'object'::text) AND (pg_column_size(views) <= 2000000)))
);


ALTER TABLE assess.practical_presentations OWNER TO postgres;

--
-- Name: practice_recordings; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.practice_recordings (
    attempt_id uuid NOT NULL,
    user_id uuid NOT NULL,
    recorded_at timestamp with time zone NOT NULL
);


ALTER TABLE assess.practice_recordings OWNER TO postgres;

--
-- Name: publications; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.publications (
    version_id uuid NOT NULL,
    document jsonb NOT NULL,
    specs jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    CONSTRAINT publications_document_check CHECK ((pg_column_size(document) <= 2000000))
);


ALTER TABLE assess.publications OWNER TO postgres;

--
-- Name: receipts; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.receipts (
    session_id uuid NOT NULL,
    operation_id uuid NOT NULL,
    digest text NOT NULL,
    ack jsonb NOT NULL
);


ALTER TABLE assess.receipts OWNER TO postgres;

--
-- Name: reservations; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.reservations (
    assignment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    used integer DEFAULT 0 NOT NULL,
    starts jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT reservations_used_check CHECK ((used >= 0))
);


ALTER TABLE assess.reservations OWNER TO postgres;

--
-- Name: results; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.results (
    session_id uuid NOT NULL,
    earned_n numeric NOT NULL,
    earned_d numeric NOT NULL,
    maximum numeric NOT NULL,
    name text NOT NULL,
    track text NOT NULL,
    visibility text NOT NULL,
    CONSTRAINT results_earned_d_check CHECK ((earned_d > (0)::numeric)),
    CONSTRAINT results_earned_n_check CHECK ((earned_n >= (0)::numeric)),
    CONSTRAINT results_maximum_check CHECK ((maximum > (0)::numeric)),
    CONSTRAINT results_visibility_check CHECK ((visibility = ANY (ARRAY['hidden'::text, 'after-submission'::text])))
);


ALTER TABLE assess.results OWNER TO postgres;

--
-- Name: scope_lock; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.scope_lock (
    singleton boolean DEFAULT true NOT NULL,
    CONSTRAINT scope_lock_singleton_check CHECK (singleton)
);


ALTER TABLE assess.scope_lock OWNER TO postgres;

--
-- Name: session_details; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.session_details (
    session_id uuid NOT NULL,
    publication jsonb NOT NULL,
    specs jsonb NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    locked jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE assess.session_details OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    ordinal integer NOT NULL,
    state text DEFAULT 'active'::text NOT NULL,
    revision integer DEFAULT 0 NOT NULL,
    started_at timestamp with time zone NOT NULL,
    deadline timestamp with time zone,
    submitted_at timestamp with time zone,
    submission_op uuid,
    submission_revision integer,
    lease uuid,
    lease_until timestamp with time zone,
    retry_at timestamp with time zone,
    failed_at timestamp with time zone,
    expires_at timestamp with time zone,
    CONSTRAINT sessions_state_check CHECK ((state = ANY (ARRAY['active'::text, 'grading'::text, 'grading-failed'::text, 'graded'::text, 'void'::text])))
);


ALTER TABLE assess.sessions OWNER TO postgres;

--
-- Name: sharing_consents; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.sharing_consents (
    user_id uuid NOT NULL,
    version text NOT NULL,
    text_digest text NOT NULL,
    accepted_at timestamp with time zone NOT NULL
);


ALTER TABLE assess.sharing_consents OWNER TO postgres;

--
-- Name: sharing_policy; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.sharing_policy (
    singleton boolean DEFAULT true NOT NULL,
    required_version text,
    text_digest text,
    CONSTRAINT sharing_policy_check CHECK ((((required_version IS NULL) AND (text_digest IS NULL)) OR ((required_version IS NOT NULL) AND (text_digest IS NOT NULL) AND ((length(required_version) >= 1) AND (length(required_version) <= 100)) AND (text_digest ~ '^[a-f0-9]{64}$'::text)))),
    CONSTRAINT sharing_policy_singleton_check CHECK (singleton)
);


ALTER TABLE assess.sharing_policy OWNER TO postgres;

--
-- Name: supervisor_appointments; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.supervisor_appointments (
    user_id uuid NOT NULL,
    appointed_by uuid,
    appointed_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    revision integer DEFAULT 1 NOT NULL,
    CONSTRAINT supervisor_appointments_revision_check CHECK ((revision > 0))
);


ALTER TABLE assess.supervisor_appointments OWNER TO postgres;

--
-- Name: targets; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.targets (
    assignment_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE assess.targets OWNER TO postgres;

--
-- Name: version_managers; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.version_managers (
    version_id uuid NOT NULL,
    manager_id uuid NOT NULL
);


ALTER TABLE assess.version_managers OWNER TO postgres;

--
-- Name: versions; Type: TABLE; Schema: assess; Owner: postgres
--

CREATE TABLE assess.versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid,
    assessment_id uuid NOT NULL,
    version text NOT NULL,
    name text NOT NULL,
    track text NOT NULL,
    schema_version integer DEFAULT 1 NOT NULL,
    available boolean DEFAULT false NOT NULL,
    CONSTRAINT versions_name_check CHECK (((length(btrim(name)) >= 1) AND (length(btrim(name)) <= 200))),
    CONSTRAINT versions_schema_version_check CHECK ((schema_version > 0)),
    CONSTRAINT versions_track_check CHECK (((length(track) >= 1) AND (length(track) <= 100))),
    CONSTRAINT versions_version_check CHECK (((length(version) >= 1) AND (length(version) <= 100)))
);


ALTER TABLE assess.versions OWNER TO postgres;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


ALTER TABLE auth.custom_oauth_providers OWNER TO supabase_auth_admin;

--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: mfa_recovery_code_sets; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_recovery_code_sets (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    mfa_factor_id uuid NOT NULL,
    failed_verification_count integer DEFAULT 0 NOT NULL,
    verification_locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mfa_recovery_code_sets_failed_verification_count_check CHECK ((failed_verification_count >= 0))
);


ALTER TABLE auth.mfa_recovery_code_sets OWNER TO supabase_auth_admin;

--
-- Name: mfa_recovery_codes; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_recovery_codes (
    id uuid NOT NULL,
    mfa_recovery_code_set_id uuid NOT NULL,
    code_hash text NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE auth.mfa_recovery_codes OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


ALTER TABLE auth.oauth_authorizations OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE auth.oauth_client_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


ALTER TABLE auth.oauth_consents OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: scim_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.scim_tokens (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    token_hash text NOT NULL,
    prefix text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    CONSTRAINT scim_tokens_expires_at_future CHECK (((expires_at IS NULL) OR (expires_at > created_at))),
    CONSTRAINT scim_tokens_revoked_after_created CHECK (((revoked_at IS NULL) OR (revoked_at >= created_at))),
    CONSTRAINT scim_tokens_token_hash_check CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))
);


ALTER TABLE auth.scim_tokens OWNER TO supabase_auth_admin;

--
-- Name: scim_users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.scim_users (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    user_id uuid,
    resource jsonb NOT NULL,
    user_name text GENERATED ALWAYS AS (lower((resource ->> 'userName'::text))) STORED NOT NULL,
    external_id text GENERATED ALWAYS AS ((resource ->> 'externalId'::text)) STORED,
    active boolean GENERATED ALWAYS AS (COALESCE(((resource ->> 'active'::text))::boolean, true)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE auth.scim_users OWNER TO supabase_auth_admin;

--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


ALTER TABLE auth.webauthn_challenges OWNER TO supabase_auth_admin;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE auth.webauthn_credentials OWNER TO supabase_auth_admin;

--
-- Name: attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    attempt_no integer NOT NULL,
    exam_id text NOT NULL,
    case_id text NOT NULL,
    definition_version text NOT NULL,
    settings jsonb NOT NULL,
    result jsonb NOT NULL,
    locale text NOT NULL,
    device jsonb DEFAULT '{}'::jsonb NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone DEFAULT now() NOT NULL,
    settings_format_version integer DEFAULT 1 NOT NULL,
    result_format_version integer DEFAULT 1 NOT NULL,
    mode text DEFAULT 'practice'::text NOT NULL,
    record_kind text DEFAULT 'attempt'::text NOT NULL,
    producer_version text DEFAULT 'unknown'::text NOT NULL,
    engine_version text DEFAULT 'unknown'::text NOT NULL,
    comparison_version text,
    CONSTRAINT attempts_attempt_no_check CHECK (((attempt_no >= 1) AND (attempt_no <= 1000))),
    CONSTRAINT attempts_case_id_check CHECK (((char_length(case_id) >= 1) AND (char_length(case_id) <= 80))),
    CONSTRAINT attempts_comparison_version_check CHECK (((comparison_version IS NULL) OR ((length(comparison_version) <= 100) AND (comparison_version ~ '^radlab-comparison/[1-9][0-9]*:[0-9a-f]{64}$'::text)))),
    CONSTRAINT attempts_definition_version_check CHECK (((char_length(definition_version) >= 1) AND (char_length(definition_version) <= 64))),
    CONSTRAINT attempts_device_check CHECK (((jsonb_typeof(device) = 'object'::text) AND (octet_length((device)::text) <= 512))),
    CONSTRAINT attempts_engine_version_check CHECK (((length(engine_version) >= 1) AND (length(engine_version) <= 100))),
    CONSTRAINT attempts_exam_id_check CHECK (((char_length(exam_id) >= 1) AND (char_length(exam_id) <= 80))),
    CONSTRAINT attempts_mode_check CHECK ((mode = 'practice'::text)),
    CONSTRAINT attempts_producer_version_check CHECK (((length(producer_version) >= 1) AND (length(producer_version) <= 100))),
    CONSTRAINT attempts_record_kind_check CHECK ((record_kind = 'attempt'::text)),
    CONSTRAINT attempts_result_check CHECK (((jsonb_typeof(result) = 'object'::text) AND (octet_length((result)::text) <= 8192))),
    CONSTRAINT attempts_result_format_version_check CHECK ((result_format_version > 0)),
    CONSTRAINT attempts_settings_check CHECK (((jsonb_typeof(settings) = 'object'::text) AND (octet_length((settings)::text) <= 4096))),
    CONSTRAINT attempts_settings_format_version_check CHECK ((settings_format_version > 0))
);


ALTER TABLE public.attempts OWNER TO postgres;

--
-- Name: c2_account_deletions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.c2_account_deletions (
    user_id uuid NOT NULL,
    requested_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    restore_status text NOT NULL,
    previous_banned_until timestamp with time zone NOT NULL,
    CONSTRAINT c2_account_deletions_requested_at_check CHECK (isfinite(requested_at)),
    CONSTRAINT c2_account_deletions_restore_status_check CHECK ((restore_status = ANY (ARRAY['pending'::text, 'approved'::text, 'suspended'::text])))
);


ALTER TABLE public.c2_account_deletions OWNER TO postgres;

--
-- Name: c2_survey_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.c2_survey_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    round_id uuid NOT NULL,
    offered_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    answered_at timestamp with time zone DEFAULT 'infinity'::timestamp with time zone NOT NULL,
    state text DEFAULT 'pending'::text NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    score numeric DEFAULT '-1'::integer NOT NULL,
    CONSTRAINT c2_survey_responses_answers_check CHECK (((jsonb_typeof(answers) = 'object'::text) AND (octet_length((answers)::text) <= 20000))),
    CONSTRAINT c2_survey_responses_dates_check CHECK ((isfinite(offered_at) AND (answered_at >= offered_at))),
    CONSTRAINT c2_survey_responses_score_check CHECK (((score = ('-1'::integer)::numeric) OR ((score >= (0)::numeric) AND (score <= (100)::numeric)))),
    CONSTRAINT c2_survey_responses_state_check CHECK ((state = ANY (ARRAY['pending'::text, 'answered'::text, 'cancelled'::text])))
);


ALTER TABLE public.c2_survey_responses OWNER TO postgres;

--
-- Name: c2_survey_rounds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.c2_survey_rounds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    version_id uuid NOT NULL,
    opened_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    closed_at timestamp with time zone DEFAULT 'infinity'::timestamp with time zone NOT NULL,
    CONSTRAINT c2_survey_rounds_dates_check CHECK ((isfinite(opened_at) AND (closed_at >= opened_at)))
);


ALTER TABLE public.c2_survey_rounds OWNER TO postgres;

--
-- Name: c2_survey_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.c2_survey_settings (
    singleton boolean DEFAULT true NOT NULL,
    activated_at timestamp with time zone DEFAULT clock_timestamp() NOT NULL,
    gap_days integer DEFAULT 7 NOT NULL,
    CONSTRAINT c2_survey_settings_gap_days_check CHECK (((gap_days >= 7) AND (gap_days <= 3650))),
    CONSTRAINT c2_survey_settings_singleton_check CHECK (singleton)
);


ALTER TABLE public.c2_survey_settings OWNER TO postgres;

--
-- Name: c2_survey_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.c2_survey_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    survey_type text NOT NULL,
    version integer NOT NULL,
    definition jsonb NOT NULL,
    CONSTRAINT c2_survey_versions_definition_check CHECK (((jsonb_typeof(definition) = 'object'::text) AND (octet_length((definition)::text) <= 20000))),
    CONSTRAINT c2_survey_versions_survey_type_check CHECK (((length(btrim(survey_type)) >= 1) AND (length(btrim(survey_type)) <= 64))),
    CONSTRAINT c2_survey_versions_version_check CHECK ((version > 0))
);


ALTER TABLE public.c2_survey_versions OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id bigint NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL,
    payload_format_version integer DEFAULT 1 NOT NULL,
    mode text DEFAULT 'practice'::text NOT NULL,
    record_kind text DEFAULT 'event'::text NOT NULL,
    producer_version text DEFAULT 'unknown'::text NOT NULL,
    engine_version text DEFAULT 'unknown'::text NOT NULL,
    CONSTRAINT events_engine_version_check CHECK (((length(engine_version) >= 1) AND (length(engine_version) <= 100))),
    CONSTRAINT events_mode_check CHECK ((mode = 'practice'::text)),
    CONSTRAINT events_payload_check CHECK (((jsonb_typeof(payload) = 'object'::text) AND (octet_length((payload)::text) <= 1024))),
    CONSTRAINT events_payload_format_version_check CHECK ((payload_format_version > 0)),
    CONSTRAINT events_producer_version_check CHECK (((length(producer_version) >= 1) AND (length(producer_version) <= 100))),
    CONSTRAINT events_record_kind_check CHECK ((record_kind = 'event'::text)),
    CONSTRAINT events_type_check CHECK ((type = ANY (ARRAY['signed_in'::text, 'heartbeat'::text, 'logout'::text, 'exam_opened'::text, 'attempt_started'::text, 'attempt_submitted'::text, 'attempt_retry'::text, 'guides_toggled'::text, 'language_changed'::text, 'client_error'::text, 'feedback_sent'::text, 'survey_opened'::text])))
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id bigint NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    exam_id text NOT NULL,
    attempt_id uuid,
    text text NOT NULL,
    at timestamp with time zone DEFAULT now() NOT NULL,
    note_format_version integer DEFAULT 1 NOT NULL,
    mode text DEFAULT 'practice'::text NOT NULL,
    record_kind text DEFAULT 'feedback'::text NOT NULL,
    producer_version text DEFAULT 'unknown'::text NOT NULL,
    engine_version text DEFAULT 'unknown'::text NOT NULL,
    CONSTRAINT feedback_engine_version_check CHECK (((length(engine_version) >= 1) AND (length(engine_version) <= 100))),
    CONSTRAINT feedback_exam_id_check CHECK (((char_length(exam_id) >= 1) AND (char_length(exam_id) <= 80))),
    CONSTRAINT feedback_mode_check CHECK ((mode = 'practice'::text)),
    CONSTRAINT feedback_note_format_version_check CHECK ((note_format_version > 0)),
    CONSTRAINT feedback_producer_version_check CHECK (((length(producer_version) >= 1) AND (length(producer_version) <= 100))),
    CONSTRAINT feedback_record_kind_check CHECK ((record_kind = 'feedback'::text)),
    CONSTRAINT feedback_text_check CHECK (((char_length(btrim(text)) >= 1) AND (char_length(btrim(text)) <= 1000)))
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.feedback ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pilot_locales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pilot_locales (
    tag text NOT NULL,
    CONSTRAINT pilot_locales_tag_check CHECK ((((length(tag) >= 2) AND (length(tag) <= 63)) AND (tag ~ '^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$'::text)))
);


ALTER TABLE public.pilot_locales OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    participant_code text DEFAULT ('P-'::text || replace((gen_random_uuid())::text, '-'::text, ''::text)) NOT NULL,
    role text DEFAULT 'participant'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    consent_version text,
    consented_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone,
    display_name text,
    CONSTRAINT profiles_consent_version_format CHECK (((consent_version IS NULL) OR (consent_version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'::text))),
    CONSTRAINT profiles_display_name_check CHECK (((display_name IS NULL) OR ((display_name = btrim(display_name)) AND ((char_length(display_name) >= 1) AND (char_length(display_name) <= 100))))),
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['participant'::text, 'owner'::text]))),
    CONSTRAINT profiles_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'suspended'::text])))
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: TABLE profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.profiles IS 'One row per account. status gates every write; role is set only by the owner via SQL (service role / SQL editor).';


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone DEFAULT now()
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


ALTER TABLE realtime.subscription OWNER TO supabase_realtime_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
    versioning_status text DEFAULT 'DISABLED'::text NOT NULL,
    lifecycle_configuration jsonb,
    lifecycle_configuration_generation uuid,
    CONSTRAINT buckets_lifecycle_configuration_pair_check CHECK (((lifecycle_configuration IS NULL) = (lifecycle_configuration_generation IS NULL))),
    CONSTRAINT buckets_lifecycle_configuration_shape_check CHECK (((lifecycle_configuration IS NULL) OR ((jsonb_typeof(lifecycle_configuration) = 'object'::text) AND (lifecycle_configuration ? 'rules'::text) AND
CASE
    WHEN (jsonb_typeof((lifecycle_configuration -> 'rules'::text)) = 'array'::text) THEN ((jsonb_array_length((lifecycle_configuration -> 'rules'::text)) >= 1) AND (jsonb_array_length((lifecycle_configuration -> 'rules'::text)) <= 1000))
    ELSE false
END))),
    CONSTRAINT buckets_lifecycle_configuration_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR ((lifecycle_configuration IS NULL) AND (lifecycle_configuration_generation IS NULL)))),
    CONSTRAINT buckets_versioning_dark_check CHECK ((versioning_status = 'DISABLED'::text)),
    CONSTRAINT buckets_versioning_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR (versioning_status = 'DISABLED'::text))),
    CONSTRAINT buckets_versioning_status_check CHECK ((versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text])))
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_vectors OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    archived_at timestamp with time zone,
    is_delete_marker boolean DEFAULT false NOT NULL,
    is_versioned boolean DEFAULT false NOT NULL
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.vector_indexes OWNER TO supabase_storage_admin;

--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: account_stops account_stops_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.account_stops
    ADD CONSTRAINT account_stops_pkey PRIMARY KEY (user_id);


--
-- Name: assignment_managers assignment_managers_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_managers
    ADD CONSTRAINT assignment_managers_pkey PRIMARY KEY (assignment_id);


--
-- Name: assignment_review_targets assignment_review_targets_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_review_targets
    ADD CONSTRAINT assignment_review_targets_pkey PRIMARY KEY (review_id, user_id);


--
-- Name: assignment_reviews assignment_reviews_assignment_id_key; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_reviews
    ADD CONSTRAINT assignment_reviews_assignment_id_key UNIQUE (assignment_id);


--
-- Name: assignment_reviews assignment_reviews_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_reviews
    ADD CONSTRAINT assignment_reviews_pkey PRIMARY KEY (id);


--
-- Name: assignment_scopes assignment_scopes_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_scopes
    ADD CONSTRAINT assignment_scopes_pkey PRIMARY KEY (assignment_id);


--
-- Name: assignment_scopes assignment_scopes_review_id_key; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_scopes
    ADD CONSTRAINT assignment_scopes_review_id_key UNIQUE (review_id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: authoring_drafts authoring_drafts_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_drafts
    ADD CONSTRAINT authoring_drafts_pkey PRIMARY KEY (id);


--
-- Name: authoring_publication_links authoring_publication_links_draft_id_draft_revision_key; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_publication_links
    ADD CONSTRAINT authoring_publication_links_draft_id_draft_revision_key UNIQUE (draft_id, draft_revision);


--
-- Name: authoring_publication_links authoring_publication_links_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_publication_links
    ADD CONSTRAINT authoring_publication_links_pkey PRIMARY KEY (version_id);


--
-- Name: authoring_references authoring_references_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_references
    ADD CONSTRAINT authoring_references_pkey PRIMARY KEY (key);


--
-- Name: authoring_reviewed_packages authoring_reviewed_packages_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_reviewed_packages
    ADD CONSTRAINT authoring_reviewed_packages_pkey PRIMARY KEY (draft_id, draft_revision);


--
-- Name: authoring_revisions authoring_revisions_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_revisions
    ADD CONSTRAINT authoring_revisions_pkey PRIMARY KEY (draft_id, revision);


--
-- Name: consents consents_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.consents
    ADD CONSTRAINT consents_pkey PRIMARY KEY (user_id, version);


--
-- Name: content_submissions content_submissions_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.content_submissions
    ADD CONSTRAINT content_submissions_pkey PRIMARY KEY (version_id);


--
-- Name: erasure_fk_contract erasure_fk_contract_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.erasure_fk_contract
    ADD CONSTRAINT erasure_fk_contract_pkey PRIMARY KEY (singleton);


--
-- Name: erasure_rights erasure_rights_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.erasure_rights
    ADD CONSTRAINT erasure_rights_pkey PRIMARY KEY (user_id);


--
-- Name: erasure_transfers erasure_transfers_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.erasure_transfers
    ADD CONSTRAINT erasure_transfers_pkey PRIMARY KEY (user_id);


--
-- Name: group_join_codes group_join_codes_digest_key; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_join_codes
    ADD CONSTRAINT group_join_codes_digest_key UNIQUE (digest);


--
-- Name: group_join_codes group_join_codes_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_join_codes
    ADD CONSTRAINT group_join_codes_pkey PRIMARY KEY (group_id);


--
-- Name: group_join_requests group_join_requests_group_id_user_id_key; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_join_requests
    ADD CONSTRAINT group_join_requests_group_id_user_id_key UNIQUE (group_id, user_id);


--
-- Name: group_join_requests group_join_requests_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_join_requests
    ADD CONSTRAINT group_join_requests_pkey PRIMARY KEY (id);


--
-- Name: group_managers group_managers_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_managers
    ADD CONSTRAINT group_managers_pkey PRIMARY KEY (group_id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: join_request_throttles join_request_throttles_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.join_request_throttles
    ADD CONSTRAINT join_request_throttles_pkey PRIMARY KEY (user_id);


--
-- Name: launch_gate launch_gate_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.launch_gate
    ADD CONSTRAINT launch_gate_pkey PRIMARY KEY (singleton);


--
-- Name: membership_periods membership_periods_id_group_id_user_id_key; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.membership_periods
    ADD CONSTRAINT membership_periods_id_group_id_user_id_key UNIQUE (id, group_id, user_id);


--
-- Name: membership_periods membership_periods_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.membership_periods
    ADD CONSTRAINT membership_periods_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (group_id, user_id);


--
-- Name: practical_presentations practical_presentations_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.practical_presentations
    ADD CONSTRAINT practical_presentations_pkey PRIMARY KEY (version_id);


--
-- Name: practice_recordings practice_recordings_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.practice_recordings
    ADD CONSTRAINT practice_recordings_pkey PRIMARY KEY (attempt_id);


--
-- Name: publications publications_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.publications
    ADD CONSTRAINT publications_pkey PRIMARY KEY (version_id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (session_id, operation_id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (assignment_id, user_id);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (session_id);


--
-- Name: scope_lock scope_lock_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.scope_lock
    ADD CONSTRAINT scope_lock_pkey PRIMARY KEY (singleton);


--
-- Name: session_details session_details_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.session_details
    ADD CONSTRAINT session_details_pkey PRIMARY KEY (session_id);


--
-- Name: sessions sessions_assignment_id_user_id_ordinal_key; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.sessions
    ADD CONSTRAINT sessions_assignment_id_user_id_ordinal_key UNIQUE (assignment_id, user_id, ordinal);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sharing_consents sharing_consents_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.sharing_consents
    ADD CONSTRAINT sharing_consents_pkey PRIMARY KEY (user_id);


--
-- Name: sharing_policy sharing_policy_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.sharing_policy
    ADD CONSTRAINT sharing_policy_pkey PRIMARY KEY (singleton);


--
-- Name: supervisor_appointments supervisor_appointments_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.supervisor_appointments
    ADD CONSTRAINT supervisor_appointments_pkey PRIMARY KEY (user_id);


--
-- Name: targets targets_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.targets
    ADD CONSTRAINT targets_pkey PRIMARY KEY (assignment_id, user_id);


--
-- Name: version_managers version_managers_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.version_managers
    ADD CONSTRAINT version_managers_pkey PRIMARY KEY (version_id);


--
-- Name: versions versions_assessment_id_version_key; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.versions
    ADD CONSTRAINT versions_assessment_id_version_key UNIQUE (assessment_id, version);


--
-- Name: versions versions_pkey; Type: CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_mfa_factor_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_mfa_factor_id_key UNIQUE (mfa_factor_id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_pkey PRIMARY KEY (id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_user_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_user_id_key UNIQUE (user_id);


--
-- Name: mfa_recovery_codes mfa_recovery_codes_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: scim_tokens scim_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_tokens
    ADD CONSTRAINT scim_tokens_pkey PRIMARY KEY (id);


--
-- Name: scim_users scim_users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: attempts attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_pkey PRIMARY KEY (id);


--
-- Name: c2_account_deletions c2_account_deletions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_account_deletions
    ADD CONSTRAINT c2_account_deletions_pkey PRIMARY KEY (user_id);


--
-- Name: c2_survey_responses c2_survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_responses
    ADD CONSTRAINT c2_survey_responses_pkey PRIMARY KEY (id);


--
-- Name: c2_survey_responses c2_survey_responses_user_round_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_responses
    ADD CONSTRAINT c2_survey_responses_user_round_key UNIQUE (user_id, round_id);


--
-- Name: c2_survey_rounds c2_survey_rounds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_rounds
    ADD CONSTRAINT c2_survey_rounds_pkey PRIMARY KEY (id);


--
-- Name: c2_survey_settings c2_survey_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_settings
    ADD CONSTRAINT c2_survey_settings_pkey PRIMARY KEY (singleton);


--
-- Name: c2_survey_versions c2_survey_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_versions
    ADD CONSTRAINT c2_survey_versions_pkey PRIMARY KEY (id);


--
-- Name: c2_survey_versions c2_survey_versions_type_version_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_versions
    ADD CONSTRAINT c2_survey_versions_type_version_key UNIQUE (survey_type, version);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: pilot_locales pilot_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pilot_locales
    ADD CONSTRAINT pilot_locales_pkey PRIMARY KEY (tag);


--
-- Name: profiles profiles_participant_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_participant_code_key UNIQUE (participant_code);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: assess_assignment_managers_owner; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_assignment_managers_owner ON assess.assignment_managers USING btree (manager_id, assignment_id);


--
-- Name: assess_assignment_reviews_writer; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_assignment_reviews_writer ON assess.assignment_reviews USING btree (writer_id, id);


--
-- Name: assess_assignment_scopes_group; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_assignment_scopes_group ON assess.assignment_scopes USING btree (group_id, assignment_id);


--
-- Name: assess_assignments_owner_id; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_assignments_owner_id ON assess.assignments USING btree (owner_id, id);


--
-- Name: assess_authoring_writer; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_authoring_writer ON assess.authoring_drafts USING btree (writer_id, group_id, id);


--
-- Name: assess_closed_assignments; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_closed_assignments ON assess.assignments USING btree (id) WHERE (closed_at IS NOT NULL);


--
-- Name: assess_group_managers_owner; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_group_managers_owner ON assess.group_managers USING btree (manager_id, group_id);


--
-- Name: assess_groups_owner_id; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_groups_owner_id ON assess.groups USING btree (owner_id, id);


--
-- Name: assess_join_requests_group; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_join_requests_group ON assess.group_join_requests USING btree (group_id, id);


--
-- Name: assess_join_requests_user; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_join_requests_user ON assess.group_join_requests USING btree (user_id, id);


--
-- Name: assess_memberships_user; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_memberships_user ON assess.memberships USING btree (user_id, group_id);


--
-- Name: assess_one_active; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE UNIQUE INDEX assess_one_active ON assess.sessions USING btree (assignment_id, user_id) WHERE (state = 'active'::text);


--
-- Name: assess_one_membership_period; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE UNIQUE INDEX assess_one_membership_period ON assess.membership_periods USING btree (group_id, user_id) WHERE (left_at IS NULL);


--
-- Name: assess_one_open_assignment; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE UNIQUE INDEX assess_one_open_assignment ON assess.assignments USING btree (owner_id, version_id) WHERE (closed_at IS NULL);


--
-- Name: assess_practice_recorded; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_practice_recorded ON assess.practice_recordings USING btree (user_id, recorded_at, attempt_id);


--
-- Name: assess_sessions_assignment; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_sessions_assignment ON assess.sessions USING btree (assignment_id);


--
-- Name: assess_sessions_due; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_sessions_due ON assess.sessions USING btree (state, deadline, id);


--
-- Name: assess_sessions_expiry; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_sessions_expiry ON assess.sessions USING btree (expires_at, id);


--
-- Name: assess_sessions_history; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_sessions_history ON assess.sessions USING btree (user_id, id) WHERE (state = 'graded'::text);


--
-- Name: assess_sessions_retry; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_sessions_retry ON assess.sessions USING btree (state, retry_at, lease_until, id);


--
-- Name: assess_sessions_user; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_sessions_user ON assess.sessions USING btree (user_id);


--
-- Name: assess_supervisor_groups; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_supervisor_groups ON assess.groups USING btree (supervisor_id, id) WHERE (supervisor_id IS NOT NULL);


--
-- Name: assess_targets_user_assignment; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_targets_user_assignment ON assess.targets USING btree (user_id, assignment_id);


--
-- Name: assess_version_managers_owner; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_version_managers_owner ON assess.version_managers USING btree (manager_id, version_id);


--
-- Name: assess_versions_owner_id; Type: INDEX; Schema: assess; Owner: postgres
--

CREATE INDEX assess_versions_owner_id ON assess.versions USING btree (owner_id, id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: mfa_recovery_codes_set_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_recovery_codes_set_id_idx ON auth.mfa_recovery_codes USING btree (mfa_recovery_code_set_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: scim_tokens_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_tokens_expires_at_idx ON auth.scim_tokens USING btree (expires_at);


--
-- Name: scim_tokens_revoked_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_tokens_revoked_at_idx ON auth.scim_tokens USING btree (revoked_at);


--
-- Name: scim_tokens_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_tokens_sso_provider_id_idx ON auth.scim_tokens USING btree (sso_provider_id);


--
-- Name: scim_tokens_token_hash_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX scim_tokens_token_hash_key ON auth.scim_tokens USING btree (token_hash);


--
-- Name: scim_users_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_created_at_idx ON auth.scim_users USING btree (sso_provider_id, created_at, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_deleted_at_idx ON auth.scim_users USING btree (deleted_at);


--
-- Name: scim_users_external_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX scim_users_external_id_key ON auth.scim_users USING btree (sso_provider_id, external_id) WHERE ((external_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: scim_users_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_id_idx ON auth.scim_users USING btree (sso_provider_id, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_sso_provider_id_idx ON auth.scim_users USING btree (sso_provider_id);


--
-- Name: scim_users_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_updated_at_idx ON auth.scim_users USING btree (sso_provider_id, updated_at, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_user_id_idx ON auth.scim_users USING btree (user_id);


--
-- Name: scim_users_user_name_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX scim_users_user_name_idx ON auth.scim_users USING btree (sso_provider_id, user_name COLLATE "C", id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_user_name_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX scim_users_user_name_key ON auth.scim_users USING btree (sso_provider_id, user_name) WHERE (deleted_at IS NULL);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: attempts_exam_finished_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attempts_exam_finished_id_idx ON public.attempts USING btree (exam_id, finished_at DESC, id);


--
-- Name: attempts_finished_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attempts_finished_id_idx ON public.attempts USING btree (finished_at DESC, id);


--
-- Name: attempts_training_user_exam_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attempts_training_user_exam_idx ON public.attempts USING btree (user_id, exam_id, finished_at DESC, id) WHERE ((mode = 'practice'::text) AND (record_kind = 'attempt'::text));


--
-- Name: attempts_user_finished_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attempts_user_finished_id_idx ON public.attempts USING btree (user_id, finished_at DESC, id);


--
-- Name: attempts_user_finished_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX attempts_user_finished_idx ON public.attempts USING btree (user_id, finished_at DESC);


--
-- Name: c2_account_deletions_expiry_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX c2_account_deletions_expiry_idx ON public.c2_account_deletions USING btree (requested_at, user_id);


--
-- Name: c2_survey_responses_pending_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX c2_survey_responses_pending_idx ON public.c2_survey_responses USING btree (user_id) WHERE (state = 'pending'::text);


--
-- Name: c2_survey_responses_user_offered_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX c2_survey_responses_user_offered_idx ON public.c2_survey_responses USING btree (user_id, offered_at DESC);


--
-- Name: events_user_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX events_user_at_idx ON public.events USING btree (user_id, at DESC);


--
-- Name: feedback_at_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX feedback_at_id_idx ON public.feedback USING btree (at DESC, id);


--
-- Name: feedback_attempt_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX feedback_attempt_id_idx ON public.feedback USING btree (attempt_id) WHERE (attempt_id IS NOT NULL);


--
-- Name: feedback_exam_at_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX feedback_exam_at_id_idx ON public.feedback USING btree (exam_id, at DESC, id);


--
-- Name: feedback_user_at_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX feedback_user_at_id_idx ON public.feedback USING btree (user_id, at DESC, id);


--
-- Name: feedback_user_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX feedback_user_at_idx ON public.feedback USING btree (user_id, at DESC);


--
-- Name: profiles_created_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX profiles_created_user_idx ON public.profiles USING btree (created_at DESC, user_id);


--
-- Name: profiles_owner_status_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX profiles_owner_status_user_idx ON public.profiles USING btree (status, user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: idx_objects_current_version; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_objects_current_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (archived_at IS NULL);


--
-- Name: idx_objects_delete_markers; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_delete_markers ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE is_delete_marker;


--
-- Name: idx_objects_null_version; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_objects_null_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (NOT is_versioned);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_name_version_key; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_name_version_key ON storage.objects USING btree (bucket_id, name COLLATE "C", version) NULLS NOT DISTINCT;


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: assignments assess_assignment_terminal; Type: TRIGGER; Schema: assess; Owner: postgres
--

CREATE TRIGGER assess_assignment_terminal BEFORE DELETE OR UPDATE ON assess.assignments FOR EACH ROW EXECUTE FUNCTION assess.assignment_terminal_v1();


--
-- Name: groups assess_managed_group; Type: TRIGGER; Schema: assess; Owner: postgres
--

CREATE TRIGGER assess_managed_group BEFORE DELETE OR UPDATE ON assess.groups FOR EACH ROW EXECUTE FUNCTION assess.guard_managed_group_v1();


--
-- Name: memberships assess_membership_period; Type: TRIGGER; Schema: assess; Owner: postgres
--

CREATE TRIGGER assess_membership_period BEFORE INSERT OR DELETE OR UPDATE ON assess.memberships FOR EACH ROW EXECUTE FUNCTION assess.membership_period_v1();


--
-- Name: sessions assess_session_consent; Type: TRIGGER; Schema: assess; Owner: postgres
--

CREATE TRIGGER assess_session_consent BEFORE INSERT ON assess.sessions FOR EACH ROW EXECUTE FUNCTION assess.require_consent_v1();


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: attempts assess_practice_recorded; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER assess_practice_recorded AFTER INSERT ON public.attempts FOR EACH ROW EXECUTE FUNCTION assess.record_practice_v1();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_bucket_control_insert; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_bucket_control_insert BEFORE INSERT ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns('service_role');


--
-- Name: buckets protect_bucket_control_update; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_bucket_control_update BEFORE UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns();


--
-- Name: buckets protect_bucket_control_update_role; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_bucket_control_update_role AFTER UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_lifecycle_service_role('service_role');


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: account_stops account_stops_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.account_stops
    ADD CONSTRAINT account_stops_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: assignment_managers assignment_managers_assignment_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_managers
    ADD CONSTRAINT assignment_managers_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_managers assignment_managers_manager_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_managers
    ADD CONSTRAINT assignment_managers_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id);


--
-- Name: assignment_review_targets assignment_review_targets_period_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_review_targets
    ADD CONSTRAINT assignment_review_targets_period_id_fkey FOREIGN KEY (period_id) REFERENCES assess.membership_periods(id);


--
-- Name: assignment_review_targets assignment_review_targets_review_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_review_targets
    ADD CONSTRAINT assignment_review_targets_review_id_fkey FOREIGN KEY (review_id) REFERENCES assess.assignment_reviews(id) ON DELETE CASCADE;


--
-- Name: assignment_review_targets assignment_review_targets_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_review_targets
    ADD CONSTRAINT assignment_review_targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: assignment_reviews assignment_reviews_assignment_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_reviews
    ADD CONSTRAINT assignment_reviews_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id);


--
-- Name: assignment_reviews assignment_reviews_draft_id_draft_revision_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_reviews
    ADD CONSTRAINT assignment_reviews_draft_id_draft_revision_fkey FOREIGN KEY (draft_id, draft_revision) REFERENCES assess.authoring_revisions(draft_id, revision);


--
-- Name: assignment_reviews assignment_reviews_group_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_reviews
    ADD CONSTRAINT assignment_reviews_group_id_fkey FOREIGN KEY (group_id) REFERENCES assess.groups(id);


--
-- Name: assignment_reviews assignment_reviews_version_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_reviews
    ADD CONSTRAINT assignment_reviews_version_id_fkey FOREIGN KEY (version_id) REFERENCES assess.versions(id);


--
-- Name: assignment_reviews assignment_reviews_writer_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_reviews
    ADD CONSTRAINT assignment_reviews_writer_id_fkey FOREIGN KEY (writer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: assignment_scopes assignment_scopes_assignment_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_scopes
    ADD CONSTRAINT assignment_scopes_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_scopes assignment_scopes_group_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_scopes
    ADD CONSTRAINT assignment_scopes_group_id_fkey FOREIGN KEY (group_id) REFERENCES assess.groups(id);


--
-- Name: assignment_scopes assignment_scopes_review_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_scopes
    ADD CONSTRAINT assignment_scopes_review_id_fkey FOREIGN KEY (review_id) REFERENCES assess.assignment_reviews(id);


--
-- Name: assignment_scopes assignment_scopes_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignment_scopes
    ADD CONSTRAINT assignment_scopes_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.profiles(user_id);


--
-- Name: assignments assignments_owner_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignments
    ADD CONSTRAINT assignments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: assignments assignments_version_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.assignments
    ADD CONSTRAINT assignments_version_id_fkey FOREIGN KEY (version_id) REFERENCES assess.versions(id);


--
-- Name: authoring_drafts authoring_drafts_group_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_drafts
    ADD CONSTRAINT authoring_drafts_group_id_fkey FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE;


--
-- Name: authoring_drafts authoring_drafts_writer_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_drafts
    ADD CONSTRAINT authoring_drafts_writer_id_fkey FOREIGN KEY (writer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: authoring_publication_links authoring_publication_links_draft_id_draft_revision_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_publication_links
    ADD CONSTRAINT authoring_publication_links_draft_id_draft_revision_fkey FOREIGN KEY (draft_id, draft_revision) REFERENCES assess.authoring_revisions(draft_id, revision);


--
-- Name: authoring_publication_links authoring_publication_links_version_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_publication_links
    ADD CONSTRAINT authoring_publication_links_version_id_fkey FOREIGN KEY (version_id) REFERENCES assess.versions(id);


--
-- Name: authoring_reviewed_packages authoring_reviewed_packages_draft_id_draft_revision_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_reviewed_packages
    ADD CONSTRAINT authoring_reviewed_packages_draft_id_draft_revision_fkey FOREIGN KEY (draft_id, draft_revision) REFERENCES assess.authoring_revisions(draft_id, revision) ON DELETE CASCADE;


--
-- Name: authoring_revisions authoring_revisions_draft_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.authoring_revisions
    ADD CONSTRAINT authoring_revisions_draft_id_fkey FOREIGN KEY (draft_id) REFERENCES assess.authoring_drafts(id) ON DELETE CASCADE;


--
-- Name: consents consents_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.consents
    ADD CONSTRAINT consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: content_submissions content_submissions_version_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.content_submissions
    ADD CONSTRAINT content_submissions_version_id_fkey FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE;


--
-- Name: erasure_rights erasure_rights_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.erasure_rights
    ADD CONSTRAINT erasure_rights_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;


--
-- Name: erasure_rights erasure_rights_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.erasure_rights
    ADD CONSTRAINT erasure_rights_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: erasure_transfers erasure_transfers_manager_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.erasure_transfers
    ADD CONSTRAINT erasure_transfers_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id);


--
-- Name: erasure_transfers erasure_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.erasure_transfers
    ADD CONSTRAINT erasure_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: group_join_codes group_join_codes_group_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_join_codes
    ADD CONSTRAINT group_join_codes_group_id_fkey FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE;


--
-- Name: group_join_requests group_join_requests_decided_by_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_join_requests
    ADD CONSTRAINT group_join_requests_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.profiles(user_id);


--
-- Name: group_join_requests group_join_requests_group_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_join_requests
    ADD CONSTRAINT group_join_requests_group_id_fkey FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE;


--
-- Name: group_join_requests group_join_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_join_requests
    ADD CONSTRAINT group_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: group_managers group_managers_group_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_managers
    ADD CONSTRAINT group_managers_group_id_fkey FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE;


--
-- Name: group_managers group_managers_manager_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.group_managers
    ADD CONSTRAINT group_managers_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id);


--
-- Name: groups groups_owner_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.groups
    ADD CONSTRAINT groups_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: groups groups_supervisor_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.groups
    ADD CONSTRAINT groups_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.profiles(user_id);


--
-- Name: join_request_throttles join_request_throttles_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.join_request_throttles
    ADD CONSTRAINT join_request_throttles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: membership_periods membership_periods_group_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.membership_periods
    ADD CONSTRAINT membership_periods_group_id_fkey FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE;


--
-- Name: membership_periods membership_periods_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.membership_periods
    ADD CONSTRAINT membership_periods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: memberships memberships_current_period; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.memberships
    ADD CONSTRAINT memberships_current_period FOREIGN KEY (period_id, group_id, user_id) REFERENCES assess.membership_periods(id, group_id, user_id);


--
-- Name: memberships memberships_group_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.memberships
    ADD CONSTRAINT memberships_group_id_fkey FOREIGN KEY (group_id) REFERENCES assess.groups(id) ON DELETE CASCADE;


--
-- Name: memberships memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.memberships
    ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: practical_presentations practical_presentations_version_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.practical_presentations
    ADD CONSTRAINT practical_presentations_version_id_fkey FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE;


--
-- Name: practice_recordings practice_recordings_attempt_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.practice_recordings
    ADD CONSTRAINT practice_recordings_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.attempts(id) ON DELETE CASCADE;


--
-- Name: practice_recordings practice_recordings_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.practice_recordings
    ADD CONSTRAINT practice_recordings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: publications publications_version_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.publications
    ADD CONSTRAINT publications_version_id_fkey FOREIGN KEY (version_id) REFERENCES assess.versions(id);


--
-- Name: receipts receipts_session_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.receipts
    ADD CONSTRAINT receipts_session_id_fkey FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE;


--
-- Name: reservations reservations_assignment_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.reservations
    ADD CONSTRAINT reservations_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE;


--
-- Name: reservations reservations_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.reservations
    ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: results results_session_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.results
    ADD CONSTRAINT results_session_id_fkey FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE;


--
-- Name: session_details session_details_session_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.session_details
    ADD CONSTRAINT session_details_session_id_fkey FOREIGN KEY (session_id) REFERENCES assess.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.sessions
    ADD CONSTRAINT sessions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: sharing_consents sharing_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.sharing_consents
    ADD CONSTRAINT sharing_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: supervisor_appointments supervisor_appointments_appointed_by_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.supervisor_appointments
    ADD CONSTRAINT supervisor_appointments_appointed_by_fkey FOREIGN KEY (appointed_by) REFERENCES public.profiles(user_id);


--
-- Name: supervisor_appointments supervisor_appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.supervisor_appointments
    ADD CONSTRAINT supervisor_appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: targets targets_assignment_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.targets
    ADD CONSTRAINT targets_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES assess.assignments(id) ON DELETE CASCADE;


--
-- Name: targets targets_user_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.targets
    ADD CONSTRAINT targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: version_managers version_managers_manager_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.version_managers
    ADD CONSTRAINT version_managers_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id);


--
-- Name: version_managers version_managers_version_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.version_managers
    ADD CONSTRAINT version_managers_version_id_fkey FOREIGN KEY (version_id) REFERENCES assess.versions(id) ON DELETE CASCADE;


--
-- Name: versions versions_owner_id_fkey; Type: FK CONSTRAINT; Schema: assess; Owner: postgres
--

ALTER TABLE ONLY assess.versions
    ADD CONSTRAINT versions_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_mfa_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_mfa_factor_id_fkey FOREIGN KEY (mfa_factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_codes mfa_recovery_codes_mfa_recovery_code_set_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_mfa_recovery_code_set_id_fkey FOREIGN KEY (mfa_recovery_code_set_id) REFERENCES auth.mfa_recovery_code_sets(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_tokens scim_tokens_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_tokens
    ADD CONSTRAINT scim_tokens_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_users scim_users_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_users scim_users_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: attempts attempts_locale_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_locale_fkey FOREIGN KEY (locale) REFERENCES public.pilot_locales(tag);


--
-- Name: attempts attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attempts
    ADD CONSTRAINT attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: c2_account_deletions c2_account_deletions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_account_deletions
    ADD CONSTRAINT c2_account_deletions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: c2_survey_responses c2_survey_responses_round_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_responses
    ADD CONSTRAINT c2_survey_responses_round_id_fkey FOREIGN KEY (round_id) REFERENCES public.c2_survey_rounds(id);


--
-- Name: c2_survey_responses c2_survey_responses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_responses
    ADD CONSTRAINT c2_survey_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: c2_survey_rounds c2_survey_rounds_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.c2_survey_rounds
    ADD CONSTRAINT c2_survey_rounds_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.c2_survey_versions(id);


--
-- Name: events events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: feedback feedback_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.attempts(id) ON DELETE CASCADE;


--
-- Name: feedback feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: account_stops; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.account_stops ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_managers; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.assignment_managers ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_review_targets; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.assignment_review_targets ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_reviews; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.assignment_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_scopes; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.assignment_scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: authoring_drafts; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.authoring_drafts ENABLE ROW LEVEL SECURITY;

--
-- Name: authoring_publication_links; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.authoring_publication_links ENABLE ROW LEVEL SECURITY;

--
-- Name: authoring_references; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.authoring_references ENABLE ROW LEVEL SECURITY;

--
-- Name: authoring_reviewed_packages; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.authoring_reviewed_packages ENABLE ROW LEVEL SECURITY;

--
-- Name: authoring_revisions; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.authoring_revisions ENABLE ROW LEVEL SECURITY;

--
-- Name: consents; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.consents ENABLE ROW LEVEL SECURITY;

--
-- Name: content_submissions; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.content_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: erasure_fk_contract; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.erasure_fk_contract ENABLE ROW LEVEL SECURITY;

--
-- Name: erasure_rights; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.erasure_rights ENABLE ROW LEVEL SECURITY;

--
-- Name: erasure_transfers; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.erasure_transfers ENABLE ROW LEVEL SECURITY;

--
-- Name: group_join_codes; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.group_join_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: group_join_requests; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.group_join_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: group_managers; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.group_managers ENABLE ROW LEVEL SECURITY;

--
-- Name: groups; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.groups ENABLE ROW LEVEL SECURITY;

--
-- Name: join_request_throttles; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.join_request_throttles ENABLE ROW LEVEL SECURITY;

--
-- Name: launch_gate; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.launch_gate ENABLE ROW LEVEL SECURITY;

--
-- Name: membership_periods; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.membership_periods ENABLE ROW LEVEL SECURITY;

--
-- Name: memberships; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.memberships ENABLE ROW LEVEL SECURITY;

--
-- Name: practical_presentations; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.practical_presentations ENABLE ROW LEVEL SECURITY;

--
-- Name: practice_recordings; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.practice_recordings ENABLE ROW LEVEL SECURITY;

--
-- Name: publications; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.publications ENABLE ROW LEVEL SECURITY;

--
-- Name: receipts; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: reservations; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.reservations ENABLE ROW LEVEL SECURITY;

--
-- Name: results; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.results ENABLE ROW LEVEL SECURITY;

--
-- Name: scope_lock; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.scope_lock ENABLE ROW LEVEL SECURITY;

--
-- Name: session_details; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.session_details ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sharing_consents; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.sharing_consents ENABLE ROW LEVEL SECURITY;

--
-- Name: sharing_policy; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.sharing_policy ENABLE ROW LEVEL SECURITY;

--
-- Name: supervisor_appointments; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.supervisor_appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: targets; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.targets ENABLE ROW LEVEL SECURITY;

--
-- Name: version_managers; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.version_managers ENABLE ROW LEVEL SECURITY;

--
-- Name: versions; Type: ROW SECURITY; Schema: assess; Owner: postgres
--

ALTER TABLE assess.versions ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: attempts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: attempts attempts_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY attempts_insert_own ON public.attempts FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT public.is_approved() AS is_approved) AND ( SELECT public.has_consented() AS has_consented)));


--
-- Name: attempts attempts_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY attempts_select_own ON public.attempts FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: attempts attempts_select_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY attempts_select_owner ON public.attempts FOR SELECT TO authenticated USING (( SELECT public.is_owner() AS is_owner));


--
-- Name: c2_account_deletions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.c2_account_deletions ENABLE ROW LEVEL SECURITY;

--
-- Name: c2_survey_responses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.c2_survey_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: c2_survey_rounds; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.c2_survey_rounds ENABLE ROW LEVEL SECURITY;

--
-- Name: c2_survey_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.c2_survey_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: c2_survey_versions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.c2_survey_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: events events_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY events_insert_own ON public.events FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT public.is_approved() AS is_approved)));


--
-- Name: events events_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY events_select_own ON public.events FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: events events_select_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY events_select_owner ON public.events FOR SELECT TO authenticated USING (( SELECT public.is_owner() AS is_owner));


--
-- Name: feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: feedback feedback_insert_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY feedback_insert_own ON public.feedback FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT public.is_approved() AS is_approved) AND ( SELECT public.has_consented() AS has_consented) AND ((attempt_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.attempts a
  WHERE ((a.id = feedback.attempt_id) AND (a.user_id = ( SELECT auth.uid() AS uid))))))));


--
-- Name: feedback feedback_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY feedback_select_own ON public.feedback FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: feedback feedback_select_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY feedback_select_owner ON public.feedback FOR SELECT TO authenticated USING (( SELECT public.is_owner() AS is_owner));


--
-- Name: pilot_locales; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pilot_locales ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: profiles profiles_select_owner; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY profiles_select_owner ON public.profiles FOR SELECT TO authenticated USING (( SELECT public.is_owner() AS is_owner));


--
-- Name: profiles profiles_update_own_consent; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY profiles_update_own_consent ON public.profiles FOR UPDATE TO authenticated USING ((user_id = ( SELECT auth.uid() AS uid))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));


--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: SCHEMA assess; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA assess TO authenticated;
GRANT USAGE ON SCHEMA assess TO assess_worker;
GRANT USAGE ON SCHEMA assess TO assess_authoring_bridge;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;
GRANT USAGE ON SCHEMA realtime TO authenticated;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION account_management_v1(p_action text, p_user uuid, p_digest text, p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.account_management_v1(p_action text, p_user uuid, p_digest text, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.account_management_v1(p_action text, p_user uuid, p_digest text, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION appointment_v1(p_user uuid, p_appoint boolean); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.appointment_v1(p_user uuid, p_appoint boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.appointment_v1(p_user uuid, p_appoint boolean) TO authenticated;


--
-- Name: FUNCTION assign_v1(p_version uuid, p_users uuid[], p_groups uuid[]); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assign_v1(p_version uuid, p_users uuid[], p_groups uuid[]) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assign_v1(p_version uuid, p_users uuid[], p_groups uuid[]) TO authenticated;


--
-- Name: FUNCTION assigned_page_v1(p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assigned_page_v1(p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assigned_page_v1(p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION assigned_practical_page_v1(p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assigned_practical_page_v1(p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assigned_practical_page_v1(p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION assigned_version_v1(p_assignment uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assigned_version_v1(p_assignment uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assigned_version_v1(p_assignment uuid) TO authenticated;


--
-- Name: FUNCTION assignment_close_v2(p_assignment uuid, p_revision integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assignment_close_v2(p_assignment uuid, p_revision integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assignment_close_v2(p_assignment uuid, p_revision integer) TO authenticated;


--
-- Name: FUNCTION assignment_confirm_v1(p_review uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assignment_confirm_v1(p_review uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assignment_confirm_v1(p_review uuid) TO authenticated;


--
-- Name: FUNCTION assignment_page_v2(p_group uuid, p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assignment_page_v2(p_group uuid, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assignment_page_v2(p_group uuid, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION assignment_prepare_v1(p_group uuid, p_draft uuid, p_revision integer, p_operation uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assignment_prepare_v1(p_group uuid, p_draft uuid, p_revision integer, p_operation uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assignment_prepare_v1(p_group uuid, p_draft uuid, p_revision integer, p_operation uuid) TO authenticated;


--
-- Name: FUNCTION assignment_targets_v1(p_review uuid, p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assignment_targets_v1(p_review uuid, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.assignment_targets_v1(p_review uuid, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION assignment_terminal_v1(); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.assignment_terminal_v1() FROM PUBLIC;


--
-- Name: FUNCTION authoring_bridge_bind_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.authoring_bridge_bind_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.authoring_bridge_bind_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid) TO assess_authoring_bridge;


--
-- Name: FUNCTION authoring_bridge_candidate_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.authoring_bridge_candidate_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.authoring_bridge_candidate_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid) TO assess_authoring_bridge;


--
-- Name: FUNCTION authoring_bridge_install_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid, p_specs jsonb, p_views jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.authoring_bridge_install_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid, p_specs jsonb, p_views jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.authoring_bridge_install_v1(p_group uuid, p_draft uuid, p_revision integer, p_version uuid, p_specs jsonb, p_views jsonb) TO assess_authoring_bridge;


--
-- Name: FUNCTION authoring_bridge_read_v1(p_group uuid, p_draft uuid, p_revision integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.authoring_bridge_read_v1(p_group uuid, p_draft uuid, p_revision integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.authoring_bridge_read_v1(p_group uuid, p_draft uuid, p_revision integer) TO assess_authoring_bridge;


--
-- Name: FUNCTION claim_v1(); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.claim_v1() FROM PUBLIC;
GRANT ALL ON FUNCTION assess.claim_v1() TO assess_worker;


--
-- Name: FUNCTION close_assignment_v1(p_assignment uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.close_assignment_v1(p_assignment uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.close_assignment_v1(p_assignment uuid) TO authenticated;


--
-- Name: FUNCTION command_v1(p_session uuid, p_operation uuid, p_revision integer, p_action jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.command_v1(p_session uuid, p_operation uuid, p_revision integer, p_action jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.command_v1(p_session uuid, p_operation uuid, p_revision integer, p_action jsonb) TO authenticated;


--
-- Name: FUNCTION consent_v1(p_version text); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.consent_v1(p_version text) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.consent_v1(p_version text) TO authenticated;


--
-- Name: FUNCTION consent_v2(p_version text); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.consent_v2(p_version text) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.consent_v2(p_version text) TO authenticated;


--
-- Name: FUNCTION content_install_practical_v1(p_version uuid, p_specs jsonb, p_views jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.content_install_practical_v1(p_version uuid, p_specs jsonb, p_views jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.content_install_practical_v1(p_version uuid, p_specs jsonb, p_views jsonb) TO assess_worker;


--
-- Name: FUNCTION content_install_v1(p_version uuid, p_specs jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.content_install_v1(p_version uuid, p_specs jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.content_install_v1(p_version uuid, p_specs jsonb) TO assess_worker;


--
-- Name: FUNCTION content_page_v1(p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.content_page_v1(p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.content_page_v1(p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION content_read_v1(p_version uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.content_read_v1(p_version uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.content_read_v1(p_version uuid) TO assess_worker;


--
-- Name: FUNCTION content_submit_v1(p_document jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.content_submit_v1(p_document jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.content_submit_v1(p_document jsonb) TO authenticated;
GRANT ALL ON FUNCTION assess.content_submit_v1(p_document jsonb) TO assess_authoring_bridge;


--
-- Name: FUNCTION d3_erasing_v1(p_user uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.d3_erasing_v1(p_user uuid) FROM PUBLIC;


--
-- Name: FUNCTION d3_fk_inventory_v1(); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.d3_fk_inventory_v1() FROM PUBLIC;


--
-- Name: FUNCTION d3_inventory_v1(p_user uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.d3_inventory_v1(p_user uuid) FROM PUBLIC;


--
-- Name: FUNCTION d3_needs_transfer_v1(p_user uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.d3_needs_transfer_v1(p_user uuid) FROM PUBLIC;


--
-- Name: FUNCTION d3_shared_group_v1(p_group uuid, p_user uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.d3_shared_group_v1(p_group uuid, p_user uuid) FROM PUBLIC;


--
-- Name: FUNCTION disable_account_v1(p_user uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.disable_account_v1(p_user uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.disable_account_v1(p_user uuid) TO authenticated;


--
-- Name: FUNCTION draft_page_v1(p_group uuid, p_id uuid, p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.draft_page_v1(p_group uuid, p_id uuid, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.draft_page_v1(p_group uuid, p_id uuid, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION draft_save_v1(p_group uuid, p_id uuid, p_revision integer, p_document jsonb, p_refs jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.draft_save_v1(p_group uuid, p_id uuid, p_revision integer, p_document jsonb, p_refs jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.draft_save_v1(p_group uuid, p_id uuid, p_revision integer, p_document jsonb, p_refs jsonb) TO authenticated;


--
-- Name: FUNCTION erase_account_d3_v1(p_user uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.erase_account_d3_v1(p_user uuid) FROM PUBLIC;


--
-- Name: FUNCTION fail_v1(p_session uuid, p_token uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.fail_v1(p_session uuid, p_token uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.fail_v1(p_session uuid, p_token uuid) TO assess_worker;


--
-- Name: FUNCTION finish_v1(p_session uuid, p_token uuid, p_n text, p_d text); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.finish_v1(p_session uuid, p_token uuid, p_n text, p_d text) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.finish_v1(p_session uuid, p_token uuid, p_n text, p_d text) TO assess_worker;


--
-- Name: FUNCTION group_leave_v1(p_group uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.group_leave_v1(p_group uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.group_leave_v1(p_group uuid) TO authenticated;


--
-- Name: FUNCTION group_write_v1(p_id uuid, p_name text, p_delete boolean); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.group_write_v1(p_id uuid, p_name text, p_delete boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.group_write_v1(p_id uuid, p_name text, p_delete boolean) TO authenticated;


--
-- Name: FUNCTION guard_managed_group_v1(); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.guard_managed_group_v1() FROM PUBLIC;


--
-- Name: FUNCTION health_v1(); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.health_v1() FROM PUBLIC;
GRANT ALL ON FUNCTION assess.health_v1() TO assess_worker;


--
-- Name: FUNCTION history_page_v1(p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.history_page_v1(p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.history_page_v1(p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION install_publication_v1(p_version uuid, p_document jsonb, p_specs jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.install_publication_v1(p_version uuid, p_document jsonb, p_specs jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.install_publication_v1(p_version uuid, p_document jsonb, p_specs jsonb) TO assess_worker;


--
-- Name: FUNCTION join_decide_v1(p_request uuid, p_revision integer, p_action text); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.join_decide_v1(p_request uuid, p_revision integer, p_action text) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.join_decide_v1(p_request uuid, p_revision integer, p_action text) TO authenticated;


--
-- Name: FUNCTION join_request_v1(p_code text); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.join_request_v1(p_code text) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.join_request_v1(p_code text) TO authenticated;


--
-- Name: FUNCTION linked_version_v1(p_draft uuid, p_revision integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.linked_version_v1(p_draft uuid, p_revision integer) FROM PUBLIC;


--
-- Name: FUNCTION maintain_v1(p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.maintain_v1(p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.maintain_v1(p_limit integer) TO assess_worker;


--
-- Name: FUNCTION members_write_v1(p_group uuid, p_users uuid[], p_add boolean); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.members_write_v1(p_group uuid, p_users uuid[], p_add boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.members_write_v1(p_group uuid, p_users uuid[], p_add boolean) TO authenticated;


--
-- Name: FUNCTION membership_period_v1(); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.membership_period_v1() FROM PUBLIC;


--
-- Name: FUNCTION owner_page_v1(p_kind text, p_context uuid, p_search text, p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.owner_page_v1(p_kind text, p_context uuid, p_search text, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.owner_page_v1(p_kind text, p_context uuid, p_search text, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION owner_scope_enter_v1(p_write boolean); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.owner_scope_enter_v1(p_write boolean) FROM PUBLIC;


--
-- Name: FUNCTION read_mixed_session_v1(p_session uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.read_mixed_session_v1(p_session uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.read_mixed_session_v1(p_session uuid) TO authenticated;


--
-- Name: FUNCTION read_practical_session_v1(p_session uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.read_practical_session_v1(p_session uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.read_practical_session_v1(p_session uuid) TO authenticated;


--
-- Name: FUNCTION read_session_v1(p_session uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.read_session_v1(p_session uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.read_session_v1(p_session uuid) TO authenticated;


--
-- Name: FUNCTION record_practice_v1(); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.record_practice_v1() FROM PUBLIC;


--
-- Name: FUNCTION recover_v1(p_session uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.recover_v1(p_session uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.recover_v1(p_session uuid) TO assess_worker;


--
-- Name: FUNCTION require_consent_v1(); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.require_consent_v1() FROM PUBLIC;


--
-- Name: FUNCTION result_v1(p_session uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.result_v1(p_session uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.result_v1(p_session uuid) TO authenticated;


--
-- Name: FUNCTION review_current_v1(p_review uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.review_current_v1(p_review uuid) FROM PUBLIC;


--
-- Name: FUNCTION scope_enter_v1(p_write boolean); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.scope_enter_v1(p_write boolean) FROM PUBLIC;


--
-- Name: FUNCTION scope_page_v1(p_kind text, p_group uuid, p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.scope_page_v1(p_kind text, p_group uuid, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.scope_page_v1(p_kind text, p_group uuid, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION session_ack_v1(p_session uuid, p_operation uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.session_ack_v1(p_session uuid, p_operation uuid) FROM PUBLIC;


--
-- Name: FUNCTION session_authorize_v1(p_assignment uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.session_authorize_v1(p_assignment uuid) FROM PUBLIC;


--
-- Name: FUNCTION sharing_allowed_v1(p_user uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.sharing_allowed_v1(p_user uuid) FROM PUBLIC;


--
-- Name: FUNCTION sharing_consent_v1(p_version text, p_digest text, p_accept boolean); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.sharing_consent_v1(p_version text, p_digest text, p_accept boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.sharing_consent_v1(p_version text, p_digest text, p_accept boolean) TO authenticated;


--
-- Name: FUNCTION start_v1(p_assignment uuid, p_operation uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.start_v1(p_assignment uuid, p_operation uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.start_v1(p_assignment uuid, p_operation uuid) TO authenticated;


--
-- Name: FUNCTION supervised_group_v1(p_group uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.supervised_group_v1(p_group uuid) FROM PUBLIC;


--
-- Name: FUNCTION supervisor_group_v1(p_action text, p_group uuid, p_revision integer, p_name text, p_ends timestamp with time zone); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.supervisor_group_v1(p_action text, p_group uuid, p_revision integer, p_name text, p_ends timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.supervisor_group_v1(p_action text, p_group uuid, p_revision integer, p_name text, p_ends timestamp with time zone) TO authenticated;


--
-- Name: FUNCTION supervisor_results_v1(p_group uuid, p_after uuid, p_limit integer); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.supervisor_results_v1(p_group uuid, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.supervisor_results_v1(p_group uuid, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION targets_write_v1(p_assignment uuid, p_revision integer, p_users uuid[], p_add boolean); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.targets_write_v1(p_assignment uuid, p_revision integer, p_users uuid[], p_add boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION assess.targets_write_v1(p_assignment uuid, p_revision integer, p_users uuid[], p_add boolean) TO authenticated;


--
-- Name: FUNCTION transfer_management_d3_v1(p_user uuid, p_digest text, p_replay_at timestamp with time zone); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.transfer_management_d3_v1(p_user uuid, p_digest text, p_replay_at timestamp with time zone) FROM PUBLIC;


--
-- Name: FUNCTION validate_answer_v1(p_item jsonb, p_spec jsonb, p_answer jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.validate_answer_v1(p_item jsonb, p_spec jsonb, p_answer jsonb) FROM PUBLIC;


--
-- Name: FUNCTION validate_draft_v1(p_document jsonb, p_refs jsonb); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.validate_draft_v1(p_document jsonb, p_refs jsonb) FROM PUBLIC;


--
-- Name: FUNCTION visible_members_v1(p_group uuid); Type: ACL; Schema: assess; Owner: postgres
--

REVOKE ALL ON FUNCTION assess.visible_members_v1(p_group uuid) FROM PUBLIC;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION can_read_training(p_scope text, p_user uuid); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.can_read_training(p_scope text, p_user uuid) FROM PUBLIC;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;


--
-- Name: FUNCTION has_consented(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.has_consented() FROM PUBLIC;
GRANT ALL ON FUNCTION public.has_consented() TO authenticated;


--
-- Name: FUNCTION is_approved(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.is_approved() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_approved() TO authenticated;


--
-- Name: FUNCTION is_owner(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.is_owner() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_owner() TO authenticated;


--
-- Name: FUNCTION owner_account_deletion_v1(p_action text, p_user uuid, p_after uuid, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.owner_account_deletion_v1(p_action text, p_user uuid, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.owner_account_deletion_v1(p_action text, p_user uuid, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION owner_account_directory_v1(p_search text, p_status text, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.owner_account_directory_v1(p_search text, p_status text, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.owner_account_directory_v1(p_search text, p_status text, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) TO authenticated;


--
-- Name: FUNCTION owner_dashboard_v1(p_view text, p_search text, p_status text, p_participant uuid, p_exam text, p_from timestamp with time zone, p_to timestamp with time zone, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.owner_dashboard_v1(p_view text, p_search text, p_status text, p_participant uuid, p_exam text, p_from timestamp with time zone, p_to timestamp with time zone, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.owner_dashboard_v1(p_view text, p_search text, p_status text, p_participant uuid, p_exam text, p_from timestamp with time zone, p_to timestamp with time zone, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) TO authenticated;


--
-- Name: FUNCTION owner_list_participants(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.owner_list_participants() FROM PUBLIC;
GRANT ALL ON FUNCTION public.owner_list_participants() TO authenticated;


--
-- Name: FUNCTION owner_page_v1(p_stream text, p_limit integer, p_cursor jsonb, p_participant uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_exam text, p_boundary timestamp with time zone, p_export boolean); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.owner_page_v1(p_stream text, p_limit integer, p_cursor jsonb, p_participant uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_exam text, p_boundary timestamp with time zone, p_export boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.owner_page_v1(p_stream text, p_limit integer, p_cursor jsonb, p_participant uuid, p_from timestamp with time zone, p_to timestamp with time zone, p_exam text, p_boundary timestamp with time zone, p_export boolean) TO authenticated;


--
-- Name: FUNCTION owner_surveys_v1(p_action text, p_data jsonb, p_after uuid, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.owner_surveys_v1(p_action text, p_data jsonb, p_after uuid, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.owner_surveys_v1(p_action text, p_data jsonb, p_after uuid, p_limit integer) TO authenticated;


--
-- Name: FUNCTION participant_survey_v1(p_answers jsonb); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.participant_survey_v1(p_answers jsonb) FROM PUBLIC;
GRANT ALL ON FUNCTION public.participant_survey_v1(p_answers jsonb) TO authenticated;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;


--
-- Name: FUNCTION set_participant_status(target uuid, new_status text); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.set_participant_status(target uuid, new_status text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.set_participant_status(target uuid, new_status text) TO authenticated;


--
-- Name: FUNCTION touch_last_seen(); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.touch_last_seen() FROM PUBLIC;
GRANT ALL ON FUNCTION public.touch_last_seen() TO authenticated;


--
-- Name: FUNCTION training_page_v1(p_view text, p_scope text, p_user uuid, p_exam text, p_search text, p_status text, p_days integer, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.training_page_v1(p_view text, p_scope text, p_user uuid, p_exam text, p_search text, p_status text, p_days integer, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.training_page_v1(p_view text, p_scope text, p_user uuid, p_exam text, p_search text, p_status text, p_days integer, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) TO authenticated;


--
-- Name: FUNCTION training_page_v1_with_comparison(p_view text, p_scope text, p_user uuid, p_exam text, p_search text, p_status text, p_days integer, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION public.training_page_v1_with_comparison(p_view text, p_scope text, p_user uuid, p_exam text, p_search text, p_status text, p_days integer, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.training_page_v1_with_comparison(p_view text, p_scope text, p_user uuid, p_exam text, p_search text, p_status text, p_days integer, p_cursor jsonb, p_boundary timestamp with time zone, p_limit integer) TO authenticated;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;


--
-- Name: FUNCTION authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) TO postgres;
GRANT ALL ON FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) TO dashboard_user;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) TO service_role;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION send_binary(payload bytea, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) TO postgres;
GRANT ALL ON FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION wal2json_escape_identifier(name text); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO postgres;
GRANT ALL ON FUNCTION realtime.wal2json_escape_identifier(name text) TO dashboard_user;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE custom_oauth_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.custom_oauth_providers TO postgres;
GRANT ALL ON TABLE auth.custom_oauth_providers TO dashboard_user;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE mfa_recovery_code_sets; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_recovery_code_sets TO postgres;
GRANT ALL ON TABLE auth.mfa_recovery_code_sets TO dashboard_user;


--
-- Name: TABLE mfa_recovery_codes; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.mfa_recovery_codes TO postgres;
GRANT ALL ON TABLE auth.mfa_recovery_codes TO dashboard_user;


--
-- Name: TABLE oauth_authorizations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_authorizations TO postgres;
GRANT ALL ON TABLE auth.oauth_authorizations TO dashboard_user;


--
-- Name: TABLE oauth_client_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_client_states TO postgres;
GRANT ALL ON TABLE auth.oauth_client_states TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE oauth_consents; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_consents TO postgres;
GRANT ALL ON TABLE auth.oauth_consents TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE scim_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.scim_tokens TO postgres;
GRANT ALL ON TABLE auth.scim_tokens TO dashboard_user;


--
-- Name: TABLE scim_users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.scim_users TO postgres;
GRANT ALL ON TABLE auth.scim_users TO dashboard_user;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE webauthn_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_challenges TO postgres;
GRANT ALL ON TABLE auth.webauthn_challenges TO dashboard_user;


--
-- Name: TABLE webauthn_credentials; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.webauthn_credentials TO postgres;
GRANT ALL ON TABLE auth.webauthn_credentials TO dashboard_user;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements TO dashboard_user;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON TABLE extensions.pg_stat_statements_info FROM postgres;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE extensions.pg_stat_statements_info TO dashboard_user;


--
-- Name: TABLE attempts; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.attempts TO service_role;
GRANT SELECT,INSERT ON TABLE public.attempts TO authenticated;


--
-- Name: TABLE c2_account_deletions; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.c2_account_deletions TO service_role;


--
-- Name: TABLE c2_survey_responses; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.c2_survey_responses TO service_role;


--
-- Name: TABLE c2_survey_rounds; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.c2_survey_rounds TO service_role;


--
-- Name: TABLE c2_survey_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.c2_survey_settings TO service_role;


--
-- Name: TABLE c2_survey_versions; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.c2_survey_versions TO service_role;


--
-- Name: TABLE events; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.events TO service_role;
GRANT SELECT,INSERT ON TABLE public.events TO authenticated;


--
-- Name: SEQUENCE events_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.events_id_seq TO authenticated;


--
-- Name: TABLE feedback; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.feedback TO service_role;
GRANT SELECT,INSERT ON TABLE public.feedback TO authenticated;


--
-- Name: SEQUENCE feedback_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT USAGE ON SEQUENCE public.feedback_id_seq TO authenticated;


--
-- Name: TABLE pilot_locales; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.pilot_locales TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO authenticated;


--
-- Name: COLUMN profiles.consent_version; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(consent_version) ON TABLE public.profiles TO authenticated;


--
-- Name: COLUMN profiles.consented_at; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(consented_at) ON TABLE public.profiles TO authenticated;


--
-- Name: COLUMN profiles.display_name; Type: ACL; Schema: public; Owner: postgres
--

GRANT UPDATE(display_name) ON TABLE public.profiles TO authenticated;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE realtime.messages TO postgres;
GRANT SELECT,INSERT ON TABLE realtime.messages TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.buckets FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.buckets TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets_analytics TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE buckets_vectors; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.buckets_vectors TO service_role;
GRANT SELECT ON TABLE storage.buckets_vectors TO anon;
GRANT SELECT ON TABLE storage.buckets_vectors TO authenticated;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

REVOKE ALL ON TABLE storage.objects FROM supabase_storage_admin;
GRANT ALL ON TABLE storage.objects TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.objects TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE vector_indexes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT SELECT ON TABLE storage.vector_indexes TO service_role;
GRANT SELECT ON TABLE storage.vector_indexes TO anon;
GRANT SELECT ON TABLE storage.vector_indexes TO authenticated;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT SELECT,INSERT ON TABLES TO postgres WITH GRANT OPTION;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: ensure_rls; Type: EVENT TRIGGER; Schema: -; Owner: postgres
--

CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
         WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
   EXECUTE FUNCTION public.rls_auto_enable();


ALTER EVENT TRIGGER ensure_rls OWNER TO postgres;

--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict 8omV3jvkZvTdshlRRahQgVeB1YSs0fVyFiejj8Es5arqjx5DVSBqfKR3GAqVtUJ

