# RAD-059 — حزمة SQL للهاتف

مولّدة من مصادر Git محليًا؛ لا إذن تشغيل حي. اقرأ [دليل الهاتف](RAD-059_PHONE_RUNBOOK.md). اجمع **كل أجزاء الإجراء المختار** في محرر واحد قبل Run مرة واحدة؛ لا تنفيذ جزء أو COMMIT مبكرًا. أقل من15000حرف لكل جزء بعد الغلاف. لا تضف سطرًا داخل base64. لا function DDL أو ترحيل أو بيانات أشخاص.

الإيقاف ست مراحل، lock2s/statement5s لكل مرحلة. PARTIAL/FAILED يعني الإبقاء على الإغلاق ومراجعة errors؛ صف STOPPED قبل COMMIT لا يغني عن استعلام التحقق المستقل بعدها. انقطاع الشبكة/خطأ COMMIT لا يثبت نجاحًا: افتح استعلامًا جديدًا وتحقق.

## 1 الإيقاف — معاملة واحدة

المصدر: supabase/manual/assess-emergency-stop.sql؛ SHA-256: f88b025e823635c39f6a298c14404c330ea285320ff00198f44f103ac4f2c50a.

الجزء1 — 8812 حرفًا.

```sql
-- Owner SQL Editor only, reviewed emergency window. Assemble ALL parts; run once.
-- No schema/function/score/result/answer/receipt/ACL/password/expiry changes.
-- Each phase has its own 5s statement budget; caught errors survive in the report.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='5s';
set local timezone='UTC';
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

المصدر: supabase/checks/assess-emergency-stopped.sql؛ SHA-256: 1015537a77470b9d98f17a4e6dfc2697466cf90516310bc20130850212d49665.

الجزء1 — 1389 حرفًا.

```sql
-- Fresh independent snapshot after COMMIT; counts only, never provider/cache proof.
begin read only;
set local search_path='';
set local row_security=off;
set local lock_timeout='2s';
set local statement_timeout='5s';
set local timezone='UTC';
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

المصدر: supabase/checks/assess-operations-monitor.sql؛ SHA-256: d31d789937943e85af7bb846bbcebe0b66f7ff1929ac9a90cde85466a41be535.

الجزء1 — 2205 حرفًا.

```sql
-- Owner postgres only. Bounded aggregate evidence, not a worker grant or collector.
-- Errors/timeouts mean UNKNOWN; do not replace failures/nulls with zeros.
begin isolation level repeatable read read only;
set local search_path='';
set local row_security=off;
set local lock_timeout='2s';
set local statement_timeout='5s';
set local timezone='UTC';
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

## 4.1 الجاهزية الحالية — supabase/checks/training-ready.sql

المصدر: supabase/checks/training-ready.sql؛ SHA-256: 8947266bcc3900260105b67a7b05e1cf3e5a4b7a4218fcdf4fb83f2f468dd234.

الجزء1 — 3138 حرفًا.

```sql
-- Read-only deployment preflight. Run on the SAME Supabase project as the build.
-- This checks catalogue/ACL compatibility, not live Auth, PostgREST cache, RLS behaviour or phone QA.
begin read only;
do $$
declare
  rpc regprocedure := to_regprocedure('public.training_page_v1(text,text,uuid,text,text,text,integer,jsonb,timestamp with time zone,integer)');
  guard regprocedure := to_regprocedure('public.can_read_training(text,uuid)');
begin
  if not exists(select 1 from pg_attribute where attrelid=to_regclass('public.profiles')
    and attname='display_name' and atttypid='text'::regtype and not attisdropped) then
    raise exception 'TRAINING_SCHEMA_NOT_READY: profiles.display_name is missing or incompatible' using errcode='55000';
  end if;
  if rpc is null or guard is null then
    raise exception 'TRAINING_SCHEMA_NOT_READY: training functions are missing' using errcode='55000';
  end if;
  if not exists(select 1 from pg_index where indexrelid=to_regclass('public.attempts_training_user_exam_idx') and indisvalid and indisready) then
    raise exception 'TRAINING_SCHEMA_NOT_READY: training index is missing or invalid' using errcode='55000';
  end if;
  if not has_column_privilege('authenticated','public.profiles','display_name','SELECT')
    or not has_column_privilege('authenticated','public.profiles','display_name','UPDATE')
    or has_column_privilege('anon','public.profiles','display_name','SELECT')
    or has_column_privilege('anon','public.profiles','display_name','UPDATE')
    or has_column_privilege('authenticated','public.profiles','role','UPDATE')
    or has_column_privilege('authenticated','public.profiles','status','UPDATE')
    or has_table_privilege('authenticated','public.attempts','UPDATE')
    or has_table_privilege('authenticated','public.attempts','DELETE') then
    raise exception 'TRAINING_SCHEMA_NOT_READY: unexpected profile or attempt grants' using errcode='55000';
  end if;
  if not has_function_privilege('authenticated',rpc,'EXECUTE') or has_function_privilege('anon',rpc,'EXECUTE')
    or has_function_privilege('authenticated',guard,'EXECUTE') or has_function_privilege('anon',guard,'EXECUTE') then
    raise exception 'TRAINING_SCHEMA_NOT_READY: unexpected function grants' using errcode='55000';
  end if;
  if exists(select 1 from pg_proc where oid in (rpc,guard) and (not prosecdef or not coalesce(proconfig @> array['search_path=""'],false)))
    or exists(select 1 from pg_class where oid in ('public.profiles'::regclass,'public.attempts'::regclass) and not relrowsecurity) then
    raise exception 'TRAINING_SCHEMA_NOT_READY: function or RLS protection is missing' using errcode='55000';
  end if;
  if not exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal
    and tgenabled<>'D' and tgfoid=to_regprocedure('public.handle_new_user()'))
    or position('display_name' in pg_get_functiondef('public.handle_new_user()'::regprocedure))=0 then
    raise exception 'TRAINING_SCHEMA_NOT_READY: signup trigger does not save the name' using errcode='55000';
  end if;
end $$;
select 'TRAINING_SCHEMA_CATALOGUE_READY' as result;
rollback;

```

## 4.2 الجاهزية الحالية — supabase/checks/comparison-ready.sql

المصدر: supabase/checks/comparison-ready.sql؛ SHA-256: 6544fc38112cfe423273b4ff1140f55a4da7e1a6278afc697ec4645bde14f4c0.

الجزء1 — 1231 حرفًا.

```sql
-- Additive readiness for Practice comparison. Run AFTER training-ready.sql.
-- Read-only catalogue/ACL check, not a live service attestation.
begin read only;
do $$
declare comparison_rpc regprocedure := to_regprocedure('public.training_page_v1_with_comparison(text,text,uuid,text,text,text,integer,jsonb,timestamp with time zone,integer)');
begin
  if comparison_rpc is null or not exists(select 1 from pg_attribute
    where attrelid=to_regclass('public.attempts') and attname='comparison_version'
    and atttypid='text'::regtype and not attnotnull and not attisdropped)
    or not exists(select 1 from pg_constraint where conrelid=to_regclass('public.attempts')
      and conname='attempts_comparison_version_check' and convalidated)
    or not has_function_privilege('authenticated',comparison_rpc,'EXECUTE')
    or has_function_privilege('anon',comparison_rpc,'EXECUTE')
    or exists(select 1 from pg_proc where oid=comparison_rpc
      and (not prosecdef or not coalesce(proconfig @> array['search_path=""'],false))) then
    raise exception 'TRAINING_SCHEMA_NOT_READY: comparison contract is missing or incompatible' using errcode='55000';
  end if;
end $$;
select 'PRACTICE_COMPARISON_CATALOGUE_READY' result;
rollback;

```

## 4.3 الجاهزية الحالية — supabase/checks/assess-mixed-ready.sql

المصدر: supabase/checks/assess-mixed-ready.sql؛ SHA-256: 457febd6997ef390cee830902bb8caf84bf01aeb153d4a30bd0a69ed7e1ec1ee.

الجزء1 — 1193 حرفًا.

```sql
-- Read-only readiness catalogue. Execute only on an independently authorized test environment.
-- Does not open launch_gate, run a candidate/attempt or prove runtime/worker readiness.
begin read only;
select
  to_regclass('assess.content_submissions') is not null as content_table_present,
  (select relrowsecurity from pg_class where oid=to_regclass('assess.content_submissions')) as content_rls,
  not has_table_privilege('authenticated','assess.content_submissions','select,insert,update,delete') as no_direct_content,
  has_function_privilege('authenticated','assess.read_mixed_session_v1(uuid)','execute') as participant_read_rpc,
  has_function_privilege('authenticated','assess.content_submit_v1(jsonb)','execute') as owner_checked_submission_rpc,
  not has_function_privilege('authenticated','assess.content_read_v1(uuid)','execute') as private_document_denied,
  not has_function_privilege('authenticated','assess.content_install_v1(uuid,jsonb)','execute') as private_install_denied,
  not has_function_privilege('anon','assess.read_mixed_session_v1(uuid)','execute') as anonymous_denied,
  not exists(select 1 from assess.launch_gate where enabled) as launch_gate_closed;
rollback;

```

## 4.4 الجاهزية الحالية — supabase/checks/assess-practical-ready.sql

المصدر: supabase/checks/assess-practical-ready.sql؛ SHA-256: e59c926f4f860ea396f1b5cd9be994c51609ed80fd2252bbce9446ebb2909a58.

الجزء1 — 1415 حرفًا.

```sql
-- Read-only E catalogue. Run on a provider only under a separate, target-specific authorization.
begin read only;
select
 current_setting('transaction_read_only')='on' as read_only,
 exists(select 1 from pg_class where oid=to_regclass('assess.practical_presentations') and relrowsecurity) as presentation_rls,
 not exists(select 1 from information_schema.table_privileges where table_schema='assess' and table_name='practical_presentations' and grantee in ('PUBLIC','anon','authenticated','assess_worker')) as no_direct_grants,
 coalesce(has_function_privilege('authenticated',to_regprocedure('assess.assigned_practical_page_v1(uuid,integer)'),'execute'),false)
 and coalesce(has_function_privilege('authenticated',to_regprocedure('assess.read_practical_session_v1(uuid)'),'execute'),false) as participant_read_grants,
 coalesce(has_function_privilege('assess_worker',to_regprocedure('assess.content_install_practical_v1(uuid,jsonb,jsonb)'),'execute'),false)
 and not coalesce(has_function_privilege('authenticated',to_regprocedure('assess.content_install_practical_v1(uuid,jsonb,jsonb)'),'execute'),true)
 and not coalesce(has_function_privilege('anon',to_regprocedure('assess.content_install_practical_v1(uuid,jsonb,jsonb)'),'execute'),true) as private_installer,
 not coalesce((select enabled from assess.launch_gate where singleton),true) as launch_gate_closed,
 false as runtime_or_launch_verified;
rollback;

```

## 4.5 الجاهزية الحالية — supabase/checks/rad085-p1-b-ready.sql

المصدر: supabase/checks/rad085-p1-b-ready.sql؛ SHA-256: 97421cdda722aec5301ba7448e23aff754bbd0d6dff83b8a67020770a5ec6908.

الجزء1 — 7996 حرفًا.

```sql
-- RAD085-P1-B-20261028: only three function bodies change; old M1-M4 readiness remains frozen.
-- RAD-085 P1 B source-derived complete catalogue (including C2 body); READ ONLY.
-- PG18 local source evidence, not provider attestation. Review restored PG major/ACL.
-- RAD085-SEC-FIXES-20261027 SEC-05: also effective (inherited) privileges, role
-- attributes/memberships and the sharing policy state. Default phase: after the O2
-- initializer. Before it, run with PGOPTIONS='-c rad085.sharing_phase=pre-initializer'.
-- B7 / RAD085-CRLF-READINESS-20261028: CR is representation only. LF digests stay unchanged.
begin read only;
set local statement_timeout='5s';
set local lock_timeout='1s';
with objects(kind,key,value) as (
 -- text, not name: a name-typed UNION key truncates to 63 bytes and makes tie order plan-dependent.
 select 'relations',c.relname::text,jsonb_build_object('kind',c.relkind,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'owner',pg_get_userbyid(c.relowner),'acl',c.relacl::text)
 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and c.relkind in ('r','p','v','m','S','f')
 union all select 'columns',c.relname||'.'||a.attname,jsonb_build_object('type',format_type(a.atttypid,a.atttypmod),'required',a.attnotnull,'default',replace(pg_get_expr(d.adbin,d.adrelid),E'\r',''),'acl',a.attacl::text)
 from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
 where n.nspname='assess' and a.attnum>0 and not a.attisdropped and c.relkind in ('r','p')
 union all select 'functions',p.proname||'('||pg_get_function_identity_arguments(p.oid)||')',jsonb_build_object('owner',pg_get_userbyid(p.proowner),'definer',p.prosecdef,'config',p.proconfig,'acl',p.proacl::text,'source',encode(sha256(convert_to(replace(pg_get_functiondef(p.oid),E'\r',''),'UTF8')),'hex'))
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='assess' or (n.nspname='public' and p.proname='owner_account_deletion_v1')) and p.prokind in ('f','p')
 union all select 'constraints',c.relname||'.'||k.conname,jsonb_build_object('valid',k.convalidated,'definition',replace(pg_get_constraintdef(k.oid),E'\r','')) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='assess' and k.contype<>'n'
 union all select 'triggers',c.relname||'.'||t.tgname,jsonb_build_object('enabled',t.tgenabled,'definition',replace(pg_get_triggerdef(t.oid),E'\r','')) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname='assess' or (n.nspname='public' and c.relname='attempts' and t.tgname='assess_practice_recorded'))
 union all select 'indexes',tablename||'.'||indexname,to_jsonb(replace(indexdef,E'\r','')) from pg_indexes where schemaname='assess'
 union all select 'policies',tablename||'.'||policyname,(to_jsonb(p)-'schemaname'-'qual'-'with_check')||jsonb_build_object('qual',replace(p.qual,E'\r',''),'with_check',replace(p.with_check,E'\r','')) from pg_policies p where schemaname='assess'
 union all select 'schema','assess',jsonb_build_object('owner',pg_get_userbyid(n.nspowner),'acl',n.nspacl::text) from pg_namespace n where n.nspname='assess'
), api_roles(name) as (values ('public'),('anon'),('authenticated'),('assess_worker'),('assess_authoring_bridge')
), effective(key) as (
 select r.name||' EXECUTE '||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
 from api_roles r cross join pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='assess' or (n.nspname='public' and p.proname='owner_account_deletion_v1')) and p.prokind in ('f','p') and has_function_privilege(r.name,p.oid,'EXECUTE')
 union all select r.name||' '||x.priv||' '||c.relname from api_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
 cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) x(priv)
 where n.nspname='assess' and c.relkind in ('r','p','v','m','f') and has_table_privilege(r.name,c.oid,x.priv)
 union all select r.name||' column '||x.priv||' '||c.relname from api_roles r cross join pg_class c join pg_namespace n on n.oid=c.relnamespace
 cross join unnest(array['SELECT','INSERT','UPDATE','REFERENCES']) x(priv)
 where n.nspname='assess' and c.relkind in ('r','p','v','m','f') and has_any_column_privilege(r.name,c.oid,x.priv)
 union all select r.name||' schema '||x.priv from api_roles r cross join unnest(array['USAGE','CREATE']) x(priv) where has_schema_privilege(r.name,'assess',x.priv)
), objects_all(kind,key,value) as (
 select * from objects union all select 'effective_privileges',key,'true'::jsonb from effective
), inventory as (select kind,count(*) n,encode(sha256(convert_to(jsonb_agg(jsonb_build_array(key,value) order by key)::text,'UTF8')),'hex') digest from objects_all group by kind), expected(kind,n,digest) as (values
 ('columns',186,'583afac6d0d92423b3abe1025fc663e4ba70782a64f90a8a448e1b4c1a3e0a5e'),
 ('constraints',154,'28bd9fc7dcd1d8cabf96f4240e380c03444d94f6b044b505e78ea383fd3a76a8'),
 ('effective_privileges',56,'f23ba4458a4e45da2183774959efb60f8a7560f460ea7513a60304ac25ae7f2c'),
 ('functions',75,'3a616f311a8e90075177ba9e619943d4d235c363d7f013cd3fc72792e58d4eab'),
 ('indexes',72,'dc8d78fb46dca786d9bf818c310023145fc92c3f7ad45e4fcef480b741e50ef4'),
 ('relations',39,'f9702f100fce917867b680cbbe31e1b6df8d8d91e4f9142b99fe5aa5882001c0'),
 ('schema',1,'1b0781c4ad8e2e9c1a2411746559468e4746ac95a359ac14741bcd98490cf91e'),
 ('triggers',5,'537996ee9103b66dff79625a809f3b0c164f0a77199c8bc017ad625afda47019')
)
select coalesce(e.kind,i.kind) kind,coalesce(i.n=e.n and i.digest=e.digest,false) ready
from expected e full join inventory i using(kind)
union all select 'fk_inventory', (select expected.inventory=assess.d3_fk_inventory_v1() from assess.erasure_fk_contract expected where singleton)
-- No API/assess role may be privileged, log in, or (worker/bridge) inherit.
union all select 'role_attributes', (select count(*)=4 and bool_and(not rolsuper and not rolbypassrls and not rolcreaterole and not rolcreatedb
  and not rolreplication and not rolcanlogin and (rolname in ('anon','authenticated') or not rolinherit))
 from pg_roles where rolname in ('anon','authenticated','assess_worker','assess_authoring_bridge'))
-- These roles are members of nothing. Worker/bridge members: only the reviewed worker
-- logins (SET only), or a PG16+ creator's ADMIN-only grant without INHERIT/SET.
union all select 'role_memberships', not exists(select 1 from pg_auth_members m join pg_roles r on r.oid=m.member
  where r.rolname in ('anon','authenticated','assess_worker','assess_authoring_bridge'))
 and not exists(select 1 from pg_auth_members m join pg_roles g on g.oid=m.roleid join pg_roles r on r.oid=m.member
  where g.rolname in ('assess_worker','assess_authoring_bridge')
  and not (m.admin_option and not coalesce((to_jsonb(m)->>'inherit_option')::boolean,r.rolinherit) and not coalesce((to_jsonb(m)->>'set_option')::boolean,true))
  and not (g.rolname='assess_worker' and r.rolname in ('assess_job_a','assess_job_b') and not m.admin_option and not coalesce((to_jsonb(m)->>'inherit_option')::boolean,r.rolinherit)))
union all select 'scope_lock', (select count(*)=1 and bool_and(singleton) from assess.scope_lock)
union all select 'sharing_policy:'||phase, case phase
  when 'initialized' then (select count(*)=1 and bool_and(required_version='supervisor-sharing-2026-10-27-v2' and text_digest='cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb') from assess.sharing_policy)
  when 'pre-initializer' then (select count(*)=1 and bool_and(required_version is null and text_digest is null) from assess.sharing_policy)
  else false end
 from (select coalesce(nullif(current_setting('rad085.sharing_phase',true),''),'initialized') phase) setting
order by kind;
rollback;

```

## 4.6 الجاهزية الحالية — supabase/checks/assess-history-ready.sql

المصدر: supabase/checks/assess-history-ready.sql؛ SHA-256: 41675ffab6ea413c3c63a90c0a0a7f00107fd7870103917b4ec9f657f402bc75.

الجزء1 — 1358 حرفًا.

```sql
-- Read-only catalogue evidence only. Never proves runtime, scheduler, recovery or launch acceptance.
begin transaction read only;
select
  true as read_only,
  coalesce((select relrowsecurity from pg_class where oid=to_regclass('assess.consents')),false) as consent_rls,
  not has_table_privilege('authenticated','assess.consents','SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('anon','assess.consents','SELECT,INSERT,UPDATE,DELETE')
    and not has_table_privilege('assess_worker','assess.consents','SELECT,INSERT,UPDATE,DELETE') as no_direct_consent_grants,
  has_function_privilege('authenticated','assess.history_page_v1(uuid,integer)','EXECUTE')
    and has_function_privilege('authenticated','assess.consent_v1(text)','EXECUTE')
    and not has_function_privilege('anon','assess.history_page_v1(uuid,integer)','EXECUTE')
    and not has_function_privilege('anon','assess.consent_v1(text)','EXECUTE') as participant_rpc_grants,
  exists(select 1 from pg_trigger where tgrelid='assess.sessions'::regclass and tgname='assess_session_consent' and tgenabled='O') as start_consent_guard,
  not has_function_privilege('authenticated','assess.require_consent_v1()','EXECUTE') as private_trigger,
  exists(select 1 from assess.launch_gate where singleton and not enabled) as launch_gate_closed,
  false as runtime_or_launch_verified;
rollback;

```

## 4.7 الجاهزية الحالية — supabase/checks/assess-retention-ready.sql

المصدر: supabase/checks/assess-retention-ready.sql؛ SHA-256: b40da5c40a92c22558aeb93114e1e2dc8815e521656bf22f896b274224dd8148.

الجزء1 — 910 حرفًا.

```sql
-- Read-only catalogue witness. Not source attestation, runtime, restore or live acceptance.
begin transaction read only;
select 'assess-retention-ready/1' as contract,
 exists(select 1 from information_schema.columns where table_schema='assess' and table_name='assignments' and column_name='closed_at') as terminal_column,
 to_regprocedure('assess.consent_v2(text)') is not null as consent_v2,
 to_regprocedure('assess.close_assignment_v1(uuid)') is not null as close_rpc,
 to_regprocedure('assess.disable_account_v1(uuid)') is not null as disable_rpc,
 not has_table_privilege('authenticated','assess.account_stops','SELECT') as stops_private,
 not has_function_privilege('assess_worker','assess.consent_v2(text)','EXECUTE') as worker_cannot_consent,
 not exists(select 1 from assess.launch_gate where enabled) as launch_gate_closed,
 false as restore_verified,false as runtime_or_launch_verified;
rollback;

```

## 4.8 الجاهزية الحالية — supabase/checks/owner-dashboard-ready.sql

المصدر: supabase/checks/owner-dashboard-ready.sql؛ SHA-256: b40b8ae2bf516ee9fbf7e082011875f589ed919adac2f4552b43e65361e85794.

الجزء1 — 1267 حرفًا.

```sql
-- RAD-069 C1: READ ONLY, no participant rows, no schema changes.
begin read only;
select 'owner-dashboard-ready/1' as contract,
 to_regprocedure('public.owner_dashboard_v1(text,text,text,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,timestamp with time zone,integer)') is not null as rpc_present,
 coalesce((select prosecdef and provolatile='s' and proconfig=array['search_path=""']::text[]
   from pg_proc where oid=to_regprocedure('public.owner_dashboard_v1(text,text,text,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,timestamp with time zone,integer)')),false) as function_contract,
 coalesce(has_function_privilege('authenticated',to_regprocedure('public.owner_dashboard_v1(text,text,text,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,timestamp with time zone,integer)'),'execute'),false) as authenticated_execute,
 not coalesce(has_function_privilege('anon',to_regprocedure('public.owner_dashboard_v1(text,text,text,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,timestamp with time zone,integer)'),'execute'),true) as anon_denied,
 exists(select 1 from pg_index i where i.indexrelid=to_regclass('public.profiles_owner_status_user_idx') and i.indisvalid) as index_ready;
rollback;

```

## 4.9 الجاهزية الحالية — supabase/checks/owner-deletion-surveys-ready.sql

المصدر: supabase/checks/owner-deletion-surveys-ready.sql؛ SHA-256: 162f7532b071c1722803d3e74e8522674c4f043a8277df12779f5b91b47ad40c.

الجزء1 — 2842 حرفًا.

```sql
-- RAD-069 C2. READ ONLY catalogue checks; no participant rows or writes.
begin read only;
with functions(signature) as (values
 ('public.owner_account_deletion_v1(text,uuid,uuid,integer)'),
 ('public.owner_account_directory_v1(text,text,jsonb,timestamp with time zone,integer)'),
 ('public.owner_surveys_v1(text,jsonb,uuid,integer)'),
 ('public.participant_survey_v1(jsonb)')
), tables(name) as (values ('c2_account_deletions'),('c2_survey_settings'),('c2_survey_versions'),('c2_survey_rounds'),('c2_survey_responses')),
indexes(name) as (values ('c2_account_deletions_pkey'),('c2_survey_settings_pkey'),('c2_survey_versions_pkey'),('c2_survey_rounds_pkey'),('c2_survey_responses_pkey'),('c2_survey_versions_type_version_key'),('c2_survey_responses_user_round_key'),('c2_account_deletions_expiry_idx'),('c2_survey_responses_pending_idx'),('c2_survey_responses_user_offered_idx'))
select 'owner-deletion-surveys-ready/1' contract,
 not exists(select 1 from functions where to_regprocedure(signature) is null) as functions_present,
 not exists(select 1 from functions f left join pg_proc p on p.oid=to_regprocedure(f.signature)
  where p.oid is null or not p.prosecdef or p.proconfig is distinct from array['search_path=""']::text[]) as function_contract,
 not exists(select 1 from functions where not coalesce(has_function_privilege('authenticated',to_regprocedure(signature),'execute'),false)
  or coalesce(has_function_privilege('anon',to_regprocedure(signature),'execute'),true)
  or exists(select 1 from pg_proc p cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where p.oid=to_regprocedure(signature) and a.grantee=0 and a.privilege_type='EXECUTE')) as execute_grants,
 not exists(select 1 from tables t left join pg_class c on c.oid=to_regclass('public.'||t.name)
  where c.oid is null or not c.relrowsecurity) as rls_enabled,
 not exists(select 1 from information_schema.table_privileges g join tables t on t.name=g.table_name
  where g.table_schema='public' and g.grantee in ('anon','authenticated','PUBLIC')) as direct_access_denied,
 not exists(select 1 from indexes x left join pg_index i on i.indexrelid=to_regclass('public.'||x.name) where i.indexrelid is null or not i.indisvalid) as indexes_ready,
 (select count(*)=2 and bool_and(confdeltype='c' and confrelid='public.profiles'::regclass)
  from pg_constraint where connamespace='public'::regnamespace and conname in ('c2_account_deletions_user_id_fkey','c2_survey_responses_user_id_fkey')) as participant_cascades,
 exists(select 1 from information_schema.columns where table_schema='auth' and table_name='users' and column_name='banned_until' and data_type='timestamp with time zone') as auth_ban_supported,
 to_regclass('auth.sessions') is not null and to_regclass('auth.refresh_tokens') is not null as session_revocation_supported;
rollback;

```

## 5.a فحص LOGIN — اختر الدور المطابق للسر فقط

المصدر: supabase/checks/assess-worker-login-ready.sql + reviewed target/timeout preamble؛ SHA-256: d06a5df72d2db499c3ba6aa98682b844d43e5a2866b518d1aa23d22612147524.

الجزء1 — 3670 حرفًا.

```sql
-- Read-only catalogue inspection for the explicitly selected dedicated login.
-- Set assess.worker_login_target before running. No credentials, user rows, SQL text or worker RPCs.
begin read only;
set local assess.worker_login_target='assess_job_a';
set local lock_timeout='2s';
set local statement_timeout='5s';
with target as (
 select * from pg_roles where rolname=current_setting('assess.worker_login_target',true)
   and rolname in ('assess_job_a','assess_job_b')
), facts as (
 select r.oid,
  shobj_description(r.oid,'pg_authid')='radlab-assess-login/1 database=' || current_database() as managed_marker,
  not r.rolinherit and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb
    and not r.rolcreaterole and not r.rolreplication and r.rolconnlimit=2 as restricted_attributes,
  not r.rolcanlogin and r.rolvaliduntil<=now() as disabled_expired,
  r.rolcanlogin and r.rolvaliduntil>now() and r.rolvaliduntil<=now()+interval '90 days' as active_time_bounded,
  (select count(*)=1 and bool_and(g.rolname='assess_worker' and not m.admin_option and not m.inherit_option and m.set_option)
    from pg_auth_members m join pg_roles g on g.oid=m.roleid where m.member=r.oid) as only_worker_membership,
  has_database_privilege(r.oid,current_database(),'CONNECT') as can_connect,
  has_database_privilege(r.oid,current_database(),'TEMP') as can_create_temp,
  exists(select 1 from pg_namespace n where n.nspname !~ '^pg_(temp|toast)' and has_schema_privilege(r.oid,n.oid,'CREATE')) as can_create_schema_objects,
  exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='assess' and c.relkind in ('r','p','v','m','f')
    and (has_table_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_any_column_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) as direct_assess_table_access,
  exists(select 1 from pg_shdepend d where d.refclassid='pg_authid'::regclass and d.refobjid=r.oid and d.deptype='o') as owns_objects,
  -- PostgreSQL16+ gives a non-superuser creator ADMIN-only management of its new role.
  -- Accept that only for the current inspecting operator, with no SET/INHERIT path.
  exists(select 1 from pg_auth_members m where m.roleid=r.oid and not (
    m.member=(select oid from pg_roles where rolname=current_user) and m.admin_option
    and not m.inherit_option and not m.set_option)) as has_unexpected_members,
  (select count(*)::integer from pg_stat_activity where usesysid=r.oid) as backend_sessions
 from target r
)
select 'assess-worker-login-catalogue/1' as contract,
 exists(select 1 from target) as target_present,
 coalesce((select managed_marker and restricted_attributes and disabled_expired and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_unexpected_members from facts),false) as staged_catalogue_valid,
 coalesce((select managed_marker and restricted_attributes and active_time_bounded and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_unexpected_members from facts),false) as active_catalogue_valid,
 coalesce((select can_create_temp or can_create_schema_objects from facts),true) as public_surface_review_required,
 coalesce((select direct_assess_table_access from facts),true) as direct_assess_table_access,
 coalesce((select backend_sessions from facts),0) as backend_sessions,
 exists(select 1 from assess.launch_gate) and not exists(select 1 from assess.launch_gate where enabled) as launch_gate_closed,
 false as credential_verified,false as pooler_verified,false as runtime_or_launch_verified;
rollback;

```

## 5.b فحص LOGIN — اختر الدور المطابق للسر فقط

المصدر: supabase/checks/assess-worker-login-ready.sql + reviewed target/timeout preamble؛ SHA-256: 3ab9192e1fef69b67b390d85f7529afd1faff8b133feafe84dff08b73d761753.

الجزء1 — 3670 حرفًا.

```sql
-- Read-only catalogue inspection for the explicitly selected dedicated login.
-- Set assess.worker_login_target before running. No credentials, user rows, SQL text or worker RPCs.
begin read only;
set local assess.worker_login_target='assess_job_b';
set local lock_timeout='2s';
set local statement_timeout='5s';
with target as (
 select * from pg_roles where rolname=current_setting('assess.worker_login_target',true)
   and rolname in ('assess_job_a','assess_job_b')
), facts as (
 select r.oid,
  shobj_description(r.oid,'pg_authid')='radlab-assess-login/1 database=' || current_database() as managed_marker,
  not r.rolinherit and not r.rolsuper and not r.rolbypassrls and not r.rolcreatedb
    and not r.rolcreaterole and not r.rolreplication and r.rolconnlimit=2 as restricted_attributes,
  not r.rolcanlogin and r.rolvaliduntil<=now() as disabled_expired,
  r.rolcanlogin and r.rolvaliduntil>now() and r.rolvaliduntil<=now()+interval '90 days' as active_time_bounded,
  (select count(*)=1 and bool_and(g.rolname='assess_worker' and not m.admin_option and not m.inherit_option and m.set_option)
    from pg_auth_members m join pg_roles g on g.oid=m.roleid where m.member=r.oid) as only_worker_membership,
  has_database_privilege(r.oid,current_database(),'CONNECT') as can_connect,
  has_database_privilege(r.oid,current_database(),'TEMP') as can_create_temp,
  exists(select 1 from pg_namespace n where n.nspname !~ '^pg_(temp|toast)' and has_schema_privilege(r.oid,n.oid,'CREATE')) as can_create_schema_objects,
  exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='assess' and c.relkind in ('r','p','v','m','f')
    and (has_table_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      or has_any_column_privilege(r.oid,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) as direct_assess_table_access,
  exists(select 1 from pg_shdepend d where d.refclassid='pg_authid'::regclass and d.refobjid=r.oid and d.deptype='o') as owns_objects,
  -- PostgreSQL16+ gives a non-superuser creator ADMIN-only management of its new role.
  -- Accept that only for the current inspecting operator, with no SET/INHERIT path.
  exists(select 1 from pg_auth_members m where m.roleid=r.oid and not (
    m.member=(select oid from pg_roles where rolname=current_user) and m.admin_option
    and not m.inherit_option and not m.set_option)) as has_unexpected_members,
  (select count(*)::integer from pg_stat_activity where usesysid=r.oid) as backend_sessions
 from target r
)
select 'assess-worker-login-catalogue/1' as contract,
 exists(select 1 from target) as target_present,
 coalesce((select managed_marker and restricted_attributes and disabled_expired and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_unexpected_members from facts),false) as staged_catalogue_valid,
 coalesce((select managed_marker and restricted_attributes and active_time_bounded and only_worker_membership
   and can_connect and not direct_assess_table_access and not owns_objects and not has_unexpected_members from facts),false) as active_catalogue_valid,
 coalesce((select can_create_temp or can_create_schema_objects from facts),true) as public_surface_review_required,
 coalesce((select direct_assess_table_access from facts),true) as direct_assess_table_access,
 coalesce((select backend_sessions from facts),0) as backend_sessions,
 exists(select 1 from assess.launch_gate) and not exists(select 1 from assess.launch_gate where enabled) as launch_gate_closed,
 false as credential_verified,false as pooler_verified,false as runtime_or_launch_verified;
rollback;

```
