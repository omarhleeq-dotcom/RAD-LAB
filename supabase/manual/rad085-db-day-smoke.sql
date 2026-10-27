-- RAD-085 DB day (B4) - SQL half of the smoke checks. READ ONLY: one SELECT. Run it AFTER the owner saved one
-- practice attempt from the site. The practice trigger is live, so that new attempt must carry a server receipt.
-- Every *_ok column must be true. Any false or an error: run the rollback now.
with newest as (select a.id, a.user_id, a.started_at from public.attempts a order by greatest(a.started_at, a.finished_at) desc nulls last limit 1)
select
 (select id from newest) as newest_attempt_id,
 (select started_at from newest) as newest_attempt_started_at,
 (select count(*) from public.attempts) as attempts_total_expect_before_plus_1,
 (select count(*) from assess.practice_recordings r join newest n on n.id = r.attempt_id) = 1 as newest_has_receipt_ok,
 (select count(*) = 1 and bool_and(not enabled) from assess.launch_gate) as launch_gate_closed_ok,
 (select count(*) = 1 from assess.scope_lock) as scope_lock_ok,
 (select count(*) = 1 and bool_and(required_version = 'supervisor-sharing-2026-10-27-v2'
     and text_digest = 'cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb') from assess.sharing_policy) as sharing_policy_ok,
 (select count(*) = 0 from assess.sharing_consents) as no_acceptance_created_ok,
 (select count(*) = 0 from assess.supervisor_appointments) as no_appointment_ok;
