-- RAD-085 DB day - progress after each migration. READ ONLY: one SELECT. Shows which sources are committed.
-- After migration N, columns m1..mN must be true and the later ones false. After the initializer, sharing_policy_set is true.
select
 (to_regclass('assess.trial_scope') is null
  and not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='assess' and left(p.proname,6)='trial_')
  and not exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='assess' and not t.tgisinternal and left(t.tgname,13)='assess_trial_')) as trial_objects_absent_ok,
 to_regclass('assess.scope_lock') is not null as m1_scope,
 to_regclass('assess.authoring_drafts') is not null as m2_drafts,
 to_regclass('assess.assignment_reviews') is not null as m3_review,
 to_regclass('assess.erasure_fk_contract') is not null as m4_d3,
 (select count(*) from pg_trigger where not tgisinternal and tgname in ('assess_practice_recorded', 'assess_managed_group', 'assess_membership_period')) as new_triggers_expected_3_after_m1,
 case when to_regclass('assess.sharing_policy') is null then null
  else (select required_version is not null and text_digest is not null from assess.sharing_policy limit 1) end as sharing_policy_set,
 (select count(*) = 1 and bool_and(not enabled) from assess.launch_gate) as launch_gate_closed;
