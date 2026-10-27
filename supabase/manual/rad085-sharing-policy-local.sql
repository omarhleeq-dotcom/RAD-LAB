-- PROPOSAL ONLY: RAD085-SQL-SHARING-POLICY-LOCAL-V2-20261027.
-- New local-only file after the three RAD-085 migrations. No live application.
begin;
select 1 from assess.scope_lock where singleton for update;
lock table assess.sharing_policy in share row exclusive mode;
do $$
begin
 if (select count(*) from assess.scope_lock)<>1 or
  (select count(*) from assess.sharing_policy)<>1 or exists(
  select 1 from assess.sharing_policy where
   (required_version is not null or text_digest is not null) and
   (required_version is distinct from 'supervisor-sharing-2026-10-27-v2' or text_digest is distinct from 'cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb')) then
  raise exception 'sharing policy drift' using errcode='55000';
 end if;
end $$;
update assess.sharing_policy set required_version='supervisor-sharing-2026-10-27-v2',
 text_digest='cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb';
commit;
