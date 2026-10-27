-- LOCAL RESTORE ONLY. Run after the four migrations + initializer on the isolated
-- owner's restored PostgreSQL. Synthetic IDs only; the entire fixture ROLLS BACK.
-- No provider Auth request, mail, real account consent or inherited PG selector.
begin;
set local statement_timeout='15s';
set local lock_timeout='2s';
do $$begin
 if exists(select 1 from auth.users where id::text like 'f0850000-0000-0000-0000-%') then
  raise exception 'synthetic authorization namespace already exists'; end if;
end$$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
 select ('f0850000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'rad085-local-'||n||'@example.test',clock_timestamp(),
 '{"display_name":"SYNTHETIC authorization fixture","consent_version":"2026-10-24"}'::jsonb from generate_series(1,6) n;
update public.profiles set status=case when user_id='f0850000-0000-0000-0000-000000000005' then 'pending'
 when user_id='f0850000-0000-0000-0000-000000000006' then 'suspended' else 'approved' end,
 role=case when user_id='f0850000-0000-0000-0000-000000000001' then 'owner' else 'participant' end
 where user_id::text like 'f0850000-0000-0000-0000-%';
create temp table rad085_authorization_values(key text primary key,value jsonb) on commit drop;
grant select,insert,update on rad085_authorization_values to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000001',true);
select assess.appointment_v1('f0850000-0000-0000-0000-000000000002',true);
select assess.appointment_v1('f0850000-0000-0000-0000-000000000003',true);
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000002',true);
insert into rad085_authorization_values values('a',assess.supervisor_group_v1('create',null,null,'SYNTHETIC restored A',clock_timestamp()+interval '1 hour'));
-- Appointed without a group must still be observable through the existing read.
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000003',true);
do $$begin
 if assess.scope_page_v1('groups')->'appointed'<>'true'::jsonb then raise exception 'zero-group appointment lost'; end if;
end$$;
insert into rad085_authorization_values values('b',assess.supervisor_group_v1('create',null,null,'SYNTHETIC restored B',clock_timestamp()+interval '1 hour'));
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000004',true);
select assess.sharing_consent_v1('supervisor-sharing-2026-10-27-v2','cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb',true);
insert into public.attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
 values('f0850000-0000-0000-0000-000000000004',1,'SYNTHETIC','SYNTHETIC','1','{}','{"total":11}','en','2000-01-01');
insert into rad085_authorization_values values('request',assess.join_request_v1((select value->>'code' from rad085_authorization_values where key='a')));
reset role;
do $$begin
 if exists(select 1 from assess.memberships where user_id='f0850000-0000-0000-0000-000000000004') then raise exception 'pending request became membership'; end if;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000002',true);
select assess.join_decide_v1((select (value->>'id')::uuid from rad085_authorization_values where key='request'),(select (value->>'revision')::integer from rad085_authorization_values where key='request'),'approve');
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000004',true);
insert into public.attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
 values('f0850000-0000-0000-0000-000000000004',2,'SYNTHETIC','SYNTHETIC','1','{}','{"total":37}','en','2000-01-01');
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000002',true);
do $$declare g uuid:=(select (value->>'id')::uuid from rad085_authorization_values where key='a'); p jsonb;begin
 p:=assess.scope_page_v1('practice',g);
 if (p->>'total')::int<>1 or jsonb_array_length(p->'rows')<>1 then raise exception 'server receipt/window/count mismatch'; end if;
 begin perform assess.scope_page_v1('members',(select (value->>'id')::uuid from rad085_authorization_values where key='b')); raise exception 'cross group allowed'; exception when insufficient_privilege then null; end;
 begin perform assess.scope_page_v1('appointments'); raise exception 'supervisor owner read allowed'; exception when insufficient_privilege then null; end;
 begin perform assess.appointment_v1('f0850000-0000-0000-0000-000000000004',true); raise exception 'supervisor appointed account'; exception when insufficient_privilege then null; end;
 begin perform public.owner_account_directory_v1(); raise exception 'supervisor owner directory allowed'; exception when insufficient_privilege then null; end;
 begin perform * from assess.groups; raise exception 'direct groups allowed'; exception when insufficient_privilege then null; end;
 begin perform * from assess.results; raise exception 'direct results allowed'; exception when insufficient_privilege then null; end;
 begin perform * from public.c2_survey_responses; raise exception 'survey answers allowed'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000004',true);
do $$begin
 begin perform assess.sharing_consent_v1('unknown',repeat('a',64),true); raise exception 'unknown policy accepted'; exception when sqlstate '55000' then null; end;
 begin perform assess.sharing_consent_v1('supervisor-sharing-2026-10-26-v1',repeat('a',64),true); raise exception 'old policy accepted'; exception when sqlstate '55000' then null; end;
end$$;
select assess.sharing_consent_v1(null,null,false);
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000002',true);
do $$begin
 if (assess.scope_page_v1('practice',(select (value->>'id')::uuid from rad085_authorization_values where key='a'))->>'total')::int<>0 then raise exception 'withdrawal did not hide'; end if;
end$$;
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000004',true);
select assess.sharing_consent_v1('supervisor-sharing-2026-10-27-v2','cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb',true);
select assess.group_leave_v1((select (value->>'id')::uuid from rad085_authorization_values where key='a'));
update rad085_authorization_values set value=assess.join_request_v1((select value->>'code' from rad085_authorization_values where key='a')) where key='request';
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000002',true);
select assess.join_decide_v1((select (value->>'id')::uuid from rad085_authorization_values where key='request'),(select (value->>'revision')::integer from rad085_authorization_values where key='request'),'approve');
do $$begin
 if (assess.scope_page_v1('practice',(select (value->>'id')::uuid from rad085_authorization_values where key='a'))->>'total')::int<>0 then raise exception 'rejoin restored history'; end if;
end$$;
reset role;
insert into rad085_authorization_values select 'revision',to_jsonb(scope_revision) from assess.groups where id=(select (value->>'id')::uuid from rad085_authorization_values where key='a');
set local role authenticated;
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000002',true);
select assess.supervisor_group_v1('rotate',(select (value->>'id')::uuid from rad085_authorization_values where key='a'),(select value::text::int from rad085_authorization_values where key='revision'));
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000004',true);
do $$begin
 if assess.join_request_v1((select value->>'code' from rad085_authorization_values where key='a'))->>'outcome'<>'unavailable' then raise exception 'old code still valid'; end if;
end$$;
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000005',true);
do $$begin
 begin perform assess.scope_page_v1('groups'); raise exception 'pending account allowed'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000006',true);
do $$begin
 begin perform assess.scope_page_v1('groups'); raise exception 'suspended account allowed'; exception when insufficient_privilege then null; end;
end$$;
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000001',true);
select assess.appointment_v1('f0850000-0000-0000-0000-000000000002',false);
select set_config('request.jwt.claim.sub','f0850000-0000-0000-0000-000000000002',true);
do $$begin
 if assess.scope_page_v1('groups')->'appointed'<>'false'::jsonb then raise exception 'revocation still appointed'; end if;
 begin perform assess.scope_page_v1('members',(select (value->>'id')::uuid from rad085_authorization_values where key='a')); raise exception 'revoked scope allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
do $$begin
 begin perform assess.scope_page_v1('groups'); raise exception 'anon allowed'; exception when insufficient_privilege then null; end;
end$$;
reset role;
select 'rad085-restored-authorization/1' contract,true passed;
rollback;
