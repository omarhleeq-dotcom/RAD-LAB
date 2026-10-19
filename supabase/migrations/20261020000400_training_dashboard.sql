-- RAD-058: additive training reads + editable profile name. Apply before the app; no production execution in this PR.
alter table public.profiles add column display_name text
  check (display_name is null or (display_name = btrim(display_name) and char_length(display_name) between 1 and 100));
grant update(display_name) on public.profiles to authenticated;
-- Existing own-row UPDATE policy remains in force. No role/status/email write grant.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v text := new.raw_user_meta_data->>'consent_version';
  n text := nullif(btrim(new.raw_user_meta_data->>'display_name'),'');
begin
  if v is null or v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then v := null; end if;
  if char_length(n)>100 then n := null; end if;
  insert into public.profiles(user_id,display_name,consent_version,consented_at)
  values(new.id,n,v,case when v is not null then now() end);
  return new;
end $$;

create index attempts_training_user_exam_idx on public.attempts(user_id,exam_id,finished_at desc,id asc)
  where mode='practice' and record_kind='attempt';

-- One authorization seam for the training read action and its scope. No supervisor role or implied inherited privileges.
create function public.can_read_training(p_scope text, p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_approved() and ((p_scope='own' and p_user=auth.uid()) or (p_scope='all' and public.is_owner()))
$$;
revoke all on function public.can_read_training(text,uuid) from public,anon,authenticated;

create function public.training_page_v1(
 p_view text, p_scope text default 'own', p_user uuid default null,
 p_exam text default null, p_search text default '', p_status text default '',
 p_days integer default null, p_cursor jsonb default null, p_boundary timestamptz default null,
 p_limit integer default 20
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
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
revoke all on function public.training_page_v1(text,text,uuid,text,text,text,integer,jsonb,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.training_page_v1(text,text,uuid,text,text,text,integer,jsonb,timestamptz,integer) to authenticated;
