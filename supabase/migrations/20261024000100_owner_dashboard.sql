-- RAD-069 C1. Additive read only; owner_page_v1 remains byte-identical.
create index profiles_owner_status_user_idx on public.profiles(status,user_id);
create function public.owner_dashboard_v1(
 p_view text, p_search text default '', p_status text default '', p_participant uuid default null,
 p_exam text default null, p_from timestamptz default null, p_to timestamptz default null,
 p_cursor jsonb default null, p_boundary timestamptz default null, p_limit integer default 20
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
 b timestamptz := coalesce(p_boundary,statement_timestamp());
 lim integer := least(p_limit,20); page jsonb; counts jsonb; nxt jsonb;
 rank_after integer; id_after uuid; exam_after text;
begin
 if not public.is_owner() then raise exception 'owner only' using errcode='42501'; end if;
 if p_view is null or p_view not in ('participants','summary') or p_search is null or length(p_search)>100
   or p_status is null or p_status not in ('','pending','approved','suspended')
   or p_limit is null or p_limit<1 or not isfinite(b) or b>statement_timestamp()
   or (p_from is not null and not isfinite(p_from)) or (p_to is not null and not isfinite(p_to))
   or p_from>p_to or length(p_exam)>200 then raise exception 'invalid dashboard request' using errcode='22023'; end if;
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
revoke all on function public.owner_dashboard_v1(text,text,text,uuid,text,timestamptz,timestamptz,jsonb,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.owner_dashboard_v1(text,text,text,uuid,text,timestamptz,timestamptz,jsonb,timestamptz,integer) to authenticated;
