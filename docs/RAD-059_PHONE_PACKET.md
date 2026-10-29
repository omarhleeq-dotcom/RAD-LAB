# RAD-059 — حزمة SQL للهاتف

مولّدة من مصادر Git محليًا؛ لا إذن تشغيل حي. اقرأ [دليل الهاتف](RAD-059_PHONE_RUNBOOK.md). اجمع **كل أجزاء الإجراء المختار** في محرر واحد قبل Run مرة واحدة؛ لا تنفيذ جزء أو COMMIT مبكرًا. أقل من15000حرف لكل جزء بعد الغلاف. لا تضف سطرًا داخل base64. لا function DDL أو ترحيل أو بيانات أشخاص.

الإيقاف ست مراحل، lock2s/statement5s لكل مرحلة. PARTIAL/FAILED يعني الإبقاء على الإغلاق ومراجعة errors؛ صف STOPPED قبل COMMIT لا يغني عن استعلام التحقق المستقل بعدها. انقطاع الشبكة/خطأ COMMIT لا يثبت نجاحًا: افتح استعلامًا جديدًا وتحقق.

## 1 الإيقاف — معاملة واحدة

المصدر: supabase/manual/assess-emergency-stop.sql؛ SHA-256: fd5708cd570d80a83fa6439b11a634d6aa059422a943a19b18603a90ed254c03.

الجزء1 — 8786 حرفًا.

```sql
-- Owner SQL Editor only, reviewed emergency window. Assemble ALL parts; run once.
-- No schema/function/score/result/answer/receipt/ACL/password/expiry changes.
-- Each phase has its own 5s statement budget; caught errors survive in the report.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='5s';
create temporary table rad059_stop_report (
 gate_ok boolean not null default false,
 login_a_ok boolean not null default false,
 login_b_ok boolean not null default false,
 termination_ok boolean not null default false,
 freeze_ok boolean not null default false,
 errors text[] not null default '{}',
 verification jsonb
) on commit drop;
insert into pg_temp.rad059_stop_report default values;
-- Exclusive gate lock drains start_v1 transactions that already read the gate.
-- New starts wait until COMMIT, then observe false. No closed-gate prerequisite.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJGdhdGUkCmJlZ2luCiBsb2NrIHRhYmxlIGFzc2Vzcy5sYXVuY2hfZ2F0ZSBpbiBhY2Nlc3MgZXhjbHVzaXZlIG1vZGU7CiBpbnNlcnQgaW50byBhc3Nlc3MubGF1bmNoX2dhdGUoc2luZ2xldG9uLGVuYWJsZWQpIHZhbHVlcyh0cnVlLGZhbHNlKSBvbiBjb25mbGljdChzaW5nbGV0b24pIGRvIG5vdGhpbmc7CiB1cGRhdGUgYXNzZXNzLmxhdW5jaF9nYXRlIHNldCBlbmFibGVkPWZhbHNlIHdoZXJlIGVuYWJsZWQ7CiB1cGRhdGUgcGdfdGVtcC5yYWQwNTlfc3RvcF9yZXBvcnQgc2V0IGdhdGVfb2s9dHJ1ZTsKZXhjZXB0aW9uIHdoZW4gcXVlcnlfY2FuY2VsZWQgdGhlbgogdXBkYXRlIHBnX3RlbXAucmFkMDU5X3N0b3BfcmVwb3J0IHNldCBlcnJvcnM9YXJyYXlfYXBwZW5kKGVycm9ycywnZ2F0ZTo1NzAxNCcpOwp3aGVuIG90aGVycyB0aGVuCiB1cGRhdGUgcGdfdGVtcC5yYWQwNTlfc3RvcF9yZXBvcnQgc2V0IGVycm9ycz1hcnJheV9hcHBlbmQoZXJyb3JzLCdnYXRlOid8fHNxbHN0YXRlKTsKZW5kICRnYXRlJDs=','base64'),'UTF8'); END $phone$;
-- Missing rotation slot is harmless; do not provision a role in an emergency.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJGxvZ2luX2EkCmJlZ2luCiBpZiBleGlzdHMoc2VsZWN0IDEgZnJvbSBwZ19jYXRhbG9nLnBnX3JvbGVzIHdoZXJlIHJvbG5hbWU9J2Fzc2Vzc19qb2JfYScgYW5kIHJvbGNhbmxvZ2luKSB0aGVuCiAgYWx0ZXIgcm9sZSBhc3Nlc3Nfam9iX2Egbm9sb2dpbjsKIGVuZCBpZjsKIHVwZGF0ZSBwZ190ZW1wLnJhZDA1OV9zdG9wX3JlcG9ydCBzZXQgbG9naW5fYV9vaz10cnVlOwpleGNlcHRpb24gd2hlbiBxdWVyeV9jYW5jZWxlZCB0aGVuCiB1cGRhdGUgcGdfdGVtcC5yYWQwNTlfc3RvcF9yZXBvcnQgc2V0IGVycm9ycz1hcnJheV9hcHBlbmQoZXJyb3JzLCdsb2dpbl9hOjU3MDE0Jyk7CndoZW4gb3RoZXJzIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA1OV9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ2xvZ2luX2E6J3x8c3Fsc3RhdGUpOwplbmQgJGxvZ2luX2EkOw==','base64'),'UTF8'); END $phone$;
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJGxvZ2luX2IkCmJlZ2luCiBpZiBleGlzdHMoc2VsZWN0IDEgZnJvbSBwZ19jYXRhbG9nLnBnX3JvbGVzIHdoZXJlIHJvbG5hbWU9J2Fzc2Vzc19qb2JfYicgYW5kIHJvbGNhbmxvZ2luKSB0aGVuCiAgYWx0ZXIgcm9sZSBhc3Nlc3Nfam9iX2Igbm9sb2dpbjsKIGVuZCBpZjsKIHVwZGF0ZSBwZ190ZW1wLnJhZDA1OV9zdG9wX3JlcG9ydCBzZXQgbG9naW5fYl9vaz10cnVlOwpleGNlcHRpb24gd2hlbiBxdWVyeV9jYW5jZWxlZCB0aGVuCiB1cGRhdGUgcGdfdGVtcC5yYWQwNTlfc3RvcF9yZXBvcnQgc2V0IGVycm9ycz1hcnJheV9hcHBlbmQoZXJyb3JzLCdsb2dpbl9iOjU3MDE0Jyk7CndoZW4gb3RoZXJzIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA1OV9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ2xvZ2luX2I6J3x8c3Fsc3RhdGUpOwplbmQgJGxvZ2luX2IkOw==','base64'),'UTF8'); END $phone$;
-- usename is session_user even after SET ROLE. Across databases, no PID/query output.
-- Whole loop bounded by statement_timeout, not a count cap. Kill precedes session locks.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJHRlcm1pbmF0ZSQKZGVjbGFyZSBiIHJlY29yZDsgYWNrbm93bGVkZ2VkIGJvb2xlYW46PXRydWU7CmJlZ2luCiBmb3IgYiBpbiBzZWxlY3QgcGlkIGZyb20gcGdfY2F0YWxvZy5wZ19zdGF0X2FjdGl2aXR5CiAgd2hlcmUgdXNlbmFtZSBpbiAoJ2Fzc2Vzc19qb2JfYScsJ2Fzc2Vzc19qb2JfYicpIGFuZCBwaWQ8PnBnX2NhdGFsb2cucGdfYmFja2VuZF9waWQoKQogbG9vcAogIGlmIG5vdCBwZ19jYXRhbG9nLnBnX3Rlcm1pbmF0ZV9iYWNrZW5kKGIucGlkLDEwMDApIHRoZW4gYWNrbm93bGVkZ2VkOj1mYWxzZTsgZW5kIGlmOwogZW5kIGxvb3A7CiB1cGRhdGUgcGdfdGVtcC5yYWQwNTlfc3RvcF9yZXBvcnQgc2V0IHRlcm1pbmF0aW9uX29rPWFja25vd2xlZGdlZCwKICBlcnJvcnM9Y2FzZSB3aGVuIGFja25vd2xlZGdlZCB0aGVuIGVycm9ycyBlbHNlIGFycmF5X2FwcGVuZChlcnJvcnMsJ3Rlcm1pbmF0aW9uOm5vdF9hY2tub3dsZWRnZWQnKSBlbmQ7CmV4Y2VwdGlvbiB3aGVuIHF1ZXJ5X2NhbmNlbGVkIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA1OV9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ3Rlcm1pbmF0aW9uOjU3MDE0Jyk7CndoZW4gb3RoZXJzIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA1OV9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ3Rlcm1pbmF0aW9uOid8fHNxbHN0YXRlKTsKZW5kICR0ZXJtaW5hdGUkOw==','base64'),'UTF8'); END $phone$;
-- Keep the original submitted_at whenever present; active freezes no later than deadline.
-- At retry_at=original submission+7d, claim_v1's strict <7d condition is already false.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJGZyZWV6ZSQKYmVnaW4KIC0tIERyYWluIGV4aXN0aW5nIGNvbW1hbmRzL2ZpbmlzaCBiZWZvcmUgdGFraW5nIHRoZSB1cGRhdGUgc25hcHNob3QuIE5ldyByZWFkZXJzCiAtLSBjYW5ub3QgYWNxdWlyZSBhIHNlc3Npb24gcm93IGxvY2sgYW5kIHRoZW4gd2FpdCBvbiB0aGlzIHBoYXNlJ3MgdGFibGUgbG9jay4KIGxvY2sgdGFibGUgYXNzZXNzLnNlc3Npb25zIGluIGFjY2VzcyBleGNsdXNpdmUgbW9kZTsKIHdpdGggdHMgYXMgbWF0ZXJpYWxpemVkKHNlbGVjdCBjbG9ja190aW1lc3RhbXAoKSBhdCksIGhlbGQgYXMgbWF0ZXJpYWxpemVkKAogIHNlbGVjdCBzLmlkLGNvYWxlc2NlKHMuc3VibWl0dGVkX2F0LGxlYXN0KHMuZGVhZGxpbmUsdHMuYXQpKSBzdWJtaXR0ZWRfYXQsdHMuYXQKICBmcm9tIGFzc2Vzcy5zZXNzaW9ucyBzIGNyb3NzIGpvaW4gdHMgd2hlcmUgcy5zdGF0ZSBpbiAoJ2FjdGl2ZScsJ2dyYWRpbmcnLCdncmFkaW5nLWZhaWxlZCcpCiApCiB1cGRhdGUgYXNzZXNzLnNlc3Npb25zIHMgc2V0IHN0YXRlPSdncmFkaW5nLWZhaWxlZCcsc3VibWl0dGVkX2F0PWguc3VibWl0dGVkX2F0LAogIGxlYXNlPW51bGwsbGVhc2VfdW50aWw9bnVsbCxyZXRyeV9hdD1oLnN1Ym1pdHRlZF9hdCtpbnRlcnZhbCAnNyBkYXlzJywKICBmYWlsZWRfYXQ9Y29hbGVzY2Uocy5mYWlsZWRfYXQsaC5hdCkscmV2aXNpb249cy5yZXZpc2lvbisxCiBmcm9tIGhlbGQgaCB3aGVyZSBzLmlkPWguaWQgYW5kICgKICBzLnN0YXRlPD4nZ3JhZGluZy1mYWlsZWQnIG9yIHMuc3VibWl0dGVkX2F0IGlzIGRpc3RpbmN0IGZyb20gaC5zdWJtaXR0ZWRfYXQKICBvciBzLmxlYXNlIGlzIG5vdCBudWxsIG9yIHMubGVhc2VfdW50aWwgaXMgbm90IG51bGwgb3Igcy5mYWlsZWRfYXQgaXMgbnVsbAogIG9yIHMucmV0cnlfYXQgaXMgZGlzdGluY3QgZnJvbSBoLnN1Ym1pdHRlZF9hdCtpbnRlcnZhbCAnNyBkYXlzJyk7CiB1cGRhdGUgcGdfdGVtcC5yYWQwNTlfc3RvcF9yZXBvcnQgc2V0IGZyZWV6ZV9vaz10cnVlOwpleGNlcHRpb24gd2hlbiBxdWVyeV9jYW5jZWxlZCB0aGVuCiB1cGRhdGUgcGdfdGVtcC5yYWQwNTlfc3RvcF9yZXBvcnQgc2V0IGVycm9ycz1hcnJheV9hcHBlbmQoZXJyb3JzLCdmcmVlemU6NTcwMTQnKTsKd2hlbiBvdGhlcnMgdGhlbgogdXBkYXRlIHBnX3RlbXAucmFkMDU5X3N0b3BfcmVwb3J0IHNldCBlcnJvcnM9YXJyYXlfYXBwZW5kKGVycm9ycywnZnJlZXplOid8fHNxbHN0YXRlKTsKZW5kICRmcmVlemUkOw==','base64'),'UTF8'); END $phone$;
-- Verification is itself bounded/caught. Final SELECT reads only the private one-row report.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJHZlcmlmeSQKZGVjbGFyZSBmYWN0cyBqc29uYjsKYmVnaW4KIHBlcmZvcm0gcGdfY2F0YWxvZy5wZ19zdGF0X2NsZWFyX3NuYXBzaG90KCk7CiBzZWxlY3QganNvbmJfYnVpbGRfb2JqZWN0KAogICdnYXRlQ2xvc2VkJywoc2VsZWN0IGNvdW50KCopPTEgYW5kIGNvYWxlc2NlKGJvb2xfYW5kKG5vdCBlbmFibGVkKSxmYWxzZSkgZnJvbSBhc3Nlc3MubGF1bmNoX2dhdGUpLAogICdsb2dpbkRpc2FibGVkJyxub3QgZXhpc3RzKHNlbGVjdCAxIGZyb20gcGdfY2F0YWxvZy5wZ19yb2xlcyB3aGVyZSByb2xuYW1lIGluICgnYXNzZXNzX2pvYl9hJywnYXNzZXNzX2pvYl9iJykgYW5kIHJvbGNhbmxvZ2luKSwKICAnbWlzc2luZ1JvbGVzJywyLShzZWxlY3QgY291bnQoKikgZnJvbSBwZ19jYXRhbG9nLnBnX3JvbGVzIHdoZXJlIHJvbG5hbWUgaW4gKCdhc3Nlc3Nfam9iX2EnLCdhc3Nlc3Nfam9iX2InKSksCiAgJ2JhY2tlbmRTZXNzaW9ucycsKHNlbGVjdCBjb3VudCgqKSBmcm9tIHBnX2NhdGFsb2cucGdfc3RhdF9hY3Rpdml0eSB3aGVyZSB1c2VuYW1lIGluICgnYXNzZXNzX2pvYl9hJywnYXNzZXNzX2pvYl9iJykpLAogICd1bmhlbGRTZXNzaW9ucycsKHNlbGVjdCBjb3VudCgqKSBmcm9tIGFzc2Vzcy5zZXNzaW9ucyB3aGVyZSBzdGF0ZSBpbiAoJ2FjdGl2ZScsJ2dyYWRpbmcnKSBvcgogICAoc3RhdGU9J2dyYWRpbmctZmFpbGVkJyBhbmQgKHN1Ym1pdHRlZF9hdCBpcyBudWxsIG9yIGxlYXNlIGlzIG5vdCBudWxsIG9yIGxlYXNlX3VudGlsIGlzIG5vdCBudWxsCiAgICBvciBmYWlsZWRfYXQgaXMgbnVsbCBvciByZXRyeV9hdCBpcyBkaXN0aW5jdCBmcm9tIHN1Ym1pdHRlZF9hdCtpbnRlcnZhbCAnNyBkYXlzJykpKQogKSBpbnRvIGZhY3RzOwogdXBkYXRlIHBnX3RlbXAucmFkMDU5X3N0b3BfcmVwb3J0IHNldCB2ZXJpZmljYXRpb249ZmFjdHM7CmV4Y2VwdGlvbiB3aGVuIHF1ZXJ5X2NhbmNlbGVkIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA1OV9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ3ZlcmlmaWNhdGlvbjo1NzAxNCcpOwp3aGVuIG90aGVycyB0aGVuCiB1cGRhdGUgcGdfdGVtcC5yYWQwNTlfc3RvcF9yZXBvcnQgc2V0IGVycm9ycz1hcnJheV9hcHBlbmQoZXJyb3JzLCd2ZXJpZmljYXRpb246J3x8c3Fsc3RhdGUpOwplbmQgJHZlcmlmeSQ7','base64'),'UTF8'); END $phone$;
select 'assess-emergency-stop/1' as contract,
 case when gate_ok and login_a_ok and login_b_ok and termination_ok and freeze_ok
  and cardinality(errors)=0 and coalesce((verification->>'gateClosed')::boolean,false)
  and coalesce((verification->>'loginDisabled')::boolean,false)
  and (verification->>'backendSessions')::bigint=0 and (verification->>'unheldSessions')::bigint=0 then 'STOPPED'
 when gate_ok or login_a_ok or login_b_ok or termination_ok or freeze_ok then 'PARTIAL' else 'FAILED' end as status,
 gate_ok,login_a_ok,login_b_ok,termination_ok,freeze_ok,errors,verification,
 false as pooler_cache_verified,false as cloud_stop_verified,false as runtime_or_launch_verified
from pg_temp.rad059_stop_report;
commit;

```

## 2 التحقق بعد الإيقاف — قراءة فقط

المصدر: supabase/checks/assess-emergency-stopped.sql؛ SHA-256: 20bc065e94cfe070b5a3060fe874ed85f4974fc15c33e158c22ff9ca103b2444.

الجزء1 — 1363 حرفًا.

```sql
-- Fresh independent snapshot after COMMIT; counts only, never provider/cache proof.
begin read only;
set local search_path='';
set local row_security=off;
set local lock_timeout='2s';
set local statement_timeout='5s';
with facts as (
 select (select count(*)=1 and coalesce(bool_and(not enabled),false) from assess.launch_gate) gate_closed,
 not exists(select 1 from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b') and rolcanlogin) login_disabled,
 2-(select count(*) from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b')) missing_roles,
 (select count(*) from pg_catalog.pg_stat_activity where usename in ('assess_job_a','assess_job_b')) backend_sessions,
 (select count(*) from assess.sessions where state in ('active','grading') or
  (state='grading-failed' and (submitted_at is null or lease is not null or lease_until is not null
   or failed_at is null or retry_at is distinct from submitted_at+interval '7 days'))) unheld_sessions
)
select 'assess-emergency-verification/1' as contract,
 case when gate_closed and login_disabled and backend_sessions=0 and unheld_sessions=0 then 'STOPPED' else 'PARTIAL' end as status,
 gate_closed,login_disabled,missing_roles,backend_sessions,unheld_sessions,
 false as pooler_cache_verified,false as cloud_stop_verified,false as runtime_or_launch_verified
from facts;
rollback;

```

## 3 المراقبة أثناء النافذة — قراءة فقط

المصدر: supabase/checks/assess-operations-monitor.sql؛ SHA-256: ccc8b9061a8b040dbb1307d2db38e03e84ed861335fa3ec06c6b7c9188521e64.

الجزء1 — 2179 حرفًا.

```sql
-- Owner postgres only. Bounded aggregate evidence, not a worker grant or collector.
-- Errors/timeouts mean UNKNOWN; do not replace failures/nulls with zeros.
begin isolation level repeatable read read only;
set local search_path='';
set local row_security=off;
set local lock_timeout='2s';
set local statement_timeout='5s';
with ts as materialized(select transaction_timestamp() at),
 sessions as materialized(select state,deadline,submitted_at,expires_at,lease_until from assess.sessions order by id limit 1001),
 signups as materialized(select 1 from auth.users,ts where created_at>=ts.at-interval '15 minutes' limit 1001),
 counts as (select (select count(*) from sessions) s,(select count(*) from signups) a),
 health as (select jsonb_build_object(
  'active',count(*) filter(where state='active'),
  'grading',count(*) filter(where state='grading'),
  'failed',count(*) filter(where state='grading-failed'),
  'alert24h',count(*) filter(where state='grading-failed' and submitted_at<=ts.at-interval '24 hours'),
  'overdue',count(*) filter(where state='active' and deadline<=ts.at),
  'expiredLeases',count(*) filter(where state in ('grading','grading-failed') and lease_until<=ts.at),
  'purgeDue',count(*) filter(where expires_at<=ts.at)) value from sessions cross join ts)
select 'assess-monitor/1' as contract,(select at from ts) observed_at,
 case when counts.s>1000 or counts.a>1000 then 'UNKNOWN_CEILING' else 'OBSERVED' end as status,
 case when counts.s<=1000 then health.value end health,
 case when counts.a<=1000 then counts.a end signups_15m,
 counts.a>1000 as signup_ceiling_exceeded,
 pg_catalog.pg_database_size(current_database()) database_bytes,
 500000000::bigint as database_quota_bytes,
 (select count(*)=1 and coalesce(bool_and(not enabled),false) from assess.launch_gate) gate_closed,
 not exists(select 1 from pg_catalog.pg_roles where rolname in ('assess_job_a','assess_job_b') and rolcanlogin) login_disabled,
 (select count(*) from pg_catalog.pg_stat_activity where usename in ('assess_job_a','assess_job_b')) backend_sessions,
 false as client_receipt_lag_measurable,false as runtime_or_launch_verified
from counts cross join health;
rollback;

```
