# RAD-062 P5 — طوارئ RAD-059 v2 للهاتف

هذه حزمة إضافية خاملة؛ **لا تستخدم قبل اكتمال يوم القاعدة وترقية P10**. المخطط الحالي يستعمل [حزمة v1](RAD-059_PHONE_PACKET.md) دون تغيير. لا إذن SQL حي هنا. بعد الترقية: افتح Supabase SQL Editor من الهاتف، اجمع كل أجزاء الإجراء المختار بالترتيب في استعلام واحد ثم Run مرة واحدة؛ لا تشغّل جزءًا منفردًا ولا COMMIT مبكرًا. كل جزء أقل من15000حرف بعد wrapper وعلى حدود الأسطر؛ لا تكسر base64. لا حاجة للابتوب أو CLI أو تثبيت دالة وقت الطوارئ؛ freeze_v2 مثبتة ضمن M05 في يوم القاعدة.

الإيقاف ست مراحل مستقلة بمهلة lock2s/statement5s لكل مرحلة، وSELECT نتيجة واحدة. يجمد active/grading/grading-failed/awaiting-manual مع حفظ وقت التسليم وdeadline وstartedAt؛ retryAt=التسليم+7أيام بلا تمديد. لا تعديل للأجوبة أو الدرجات المؤقتة أو النتائج النهائية. PARTIAL/FAILED يعني مراجعة errors والإبقاء على الإغلاق؛ أعد الإيقاف بعد إزالة سبب التعذر ثم التحقق. التكرار لا يرفع revision ولا يغير وقت hold مجددًا.

بعد COMMIT افتح استعلامًا جديدًا ونفّذ التحقق المستقل (SELECT واحدة للقراءة فقط). انقطاع ACK أو الشبكة لا يثبت نجاحًا؛ تحقق مستقلاً. STOPPED ليس إثبات إيقاف السحابة أو cache أو السر أو قبول التشغيل: أبق السر DISABLED وأوقف العامل وفق [دليل RAD-059](RAD-059_PHONE_RUNBOOK.md)، ولا تعِد فتح gate أو الاستئناف أو الاسترداد من هذه الحزمة. فشل dry-run الهاتف حاجب لترقية الكتابي.

## 1 الإيقاف — معاملة واحدة

المصدر: supabase/manual/assess-emergency-stop-v2.sql؛ SHA-256: 8d5f24a65395a55276b5a87c8a737be753408aafad971bea612aea1387f5327e.

الجزء1 — 7729 حرفًا.

```sql
-- Owner SQL Editor only, reviewed emergency window. Assemble ALL parts; run once.
-- V2 ONLY after complete DB day and P10 promotion. Keep v1 for current schema.
-- No function DDL/score/result/answer/receipt/ACL/password/expiry changes.
-- Each phase has its own 5s statement budget; caught errors survive in the report.
begin;
set local search_path='';
set local lock_timeout='2s';
set local statement_timeout='5s';
set local timezone='UTC';
create temporary table rad062_stop_report (
 gate_ok boolean not null default false,
 login_a_ok boolean not null default false,
 login_b_ok boolean not null default false,
 termination_ok boolean not null default false,
 freeze_ok boolean not null default false,
 errors text[] not null default '{}',
 verification jsonb
) on commit drop;
insert into pg_temp.rad062_stop_report default values;
-- Exclusive gate lock drains start_v1 transactions that already read the gate.
-- New starts wait until COMMIT, then observe false. No closed-gate prerequisite.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJGdhdGUkCmJlZ2luCiBsb2NrIHRhYmxlIGFzc2Vzcy5sYXVuY2hfZ2F0ZSBpbiBhY2Nlc3MgZXhjbHVzaXZlIG1vZGU7CiBpbnNlcnQgaW50byBhc3Nlc3MubGF1bmNoX2dhdGUoc2luZ2xldG9uLGVuYWJsZWQpIHZhbHVlcyh0cnVlLGZhbHNlKSBvbiBjb25mbGljdChzaW5nbGV0b24pIGRvIG5vdGhpbmc7CiB1cGRhdGUgYXNzZXNzLmxhdW5jaF9nYXRlIHNldCBlbmFibGVkPWZhbHNlIHdoZXJlIGVuYWJsZWQ7CiB1cGRhdGUgcGdfdGVtcC5yYWQwNjJfc3RvcF9yZXBvcnQgc2V0IGdhdGVfb2s9dHJ1ZTsKZXhjZXB0aW9uIHdoZW4gcXVlcnlfY2FuY2VsZWQgdGhlbgogdXBkYXRlIHBnX3RlbXAucmFkMDYyX3N0b3BfcmVwb3J0IHNldCBlcnJvcnM9YXJyYXlfYXBwZW5kKGVycm9ycywnZ2F0ZTo1NzAxNCcpOwp3aGVuIG90aGVycyB0aGVuCiB1cGRhdGUgcGdfdGVtcC5yYWQwNjJfc3RvcF9yZXBvcnQgc2V0IGVycm9ycz1hcnJheV9hcHBlbmQoZXJyb3JzLCdnYXRlOid8fHNxbHN0YXRlKTsKZW5kICRnYXRlJDs=','base64'),'UTF8'); END $phone$;
-- Missing rotation slot is harmless; do not provision a role in an emergency.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJGxvZ2luX2EkCmJlZ2luCiBpZiBleGlzdHMoc2VsZWN0IDEgZnJvbSBwZ19jYXRhbG9nLnBnX3JvbGVzIHdoZXJlIHJvbG5hbWU9J2Fzc2Vzc19qb2JfYScgYW5kIHJvbGNhbmxvZ2luKSB0aGVuCiAgYWx0ZXIgcm9sZSBhc3Nlc3Nfam9iX2Egbm9sb2dpbjsKIGVuZCBpZjsKIHVwZGF0ZSBwZ190ZW1wLnJhZDA2Ml9zdG9wX3JlcG9ydCBzZXQgbG9naW5fYV9vaz10cnVlOwpleGNlcHRpb24gd2hlbiBxdWVyeV9jYW5jZWxlZCB0aGVuCiB1cGRhdGUgcGdfdGVtcC5yYWQwNjJfc3RvcF9yZXBvcnQgc2V0IGVycm9ycz1hcnJheV9hcHBlbmQoZXJyb3JzLCdsb2dpbl9hOjU3MDE0Jyk7CndoZW4gb3RoZXJzIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA2Ml9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ2xvZ2luX2E6J3x8c3Fsc3RhdGUpOwplbmQgJGxvZ2luX2EkOw==','base64'),'UTF8'); END $phone$;
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJGxvZ2luX2IkCmJlZ2luCiBpZiBleGlzdHMoc2VsZWN0IDEgZnJvbSBwZ19jYXRhbG9nLnBnX3JvbGVzIHdoZXJlIHJvbG5hbWU9J2Fzc2Vzc19qb2JfYicgYW5kIHJvbGNhbmxvZ2luKSB0aGVuCiAgYWx0ZXIgcm9sZSBhc3Nlc3Nfam9iX2Igbm9sb2dpbjsKIGVuZCBpZjsKIHVwZGF0ZSBwZ190ZW1wLnJhZDA2Ml9zdG9wX3JlcG9ydCBzZXQgbG9naW5fYl9vaz10cnVlOwpleGNlcHRpb24gd2hlbiBxdWVyeV9jYW5jZWxlZCB0aGVuCiB1cGRhdGUgcGdfdGVtcC5yYWQwNjJfc3RvcF9yZXBvcnQgc2V0IGVycm9ycz1hcnJheV9hcHBlbmQoZXJyb3JzLCdsb2dpbl9iOjU3MDE0Jyk7CndoZW4gb3RoZXJzIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA2Ml9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ2xvZ2luX2I6J3x8c3Fsc3RhdGUpOwplbmQgJGxvZ2luX2IkOw==','base64'),'UTF8'); END $phone$;
-- usename is session_user even after SET ROLE. Across databases, no PID/query output.
-- Whole loop bounded by statement_timeout, not a count cap. Kill precedes session locks.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJHRlcm1pbmF0ZSQKZGVjbGFyZSBiIHJlY29yZDsgYWNrbm93bGVkZ2VkIGJvb2xlYW46PXRydWU7CmJlZ2luCiBmb3IgYiBpbiBzZWxlY3QgcGlkIGZyb20gcGdfY2F0YWxvZy5wZ19zdGF0X2FjdGl2aXR5CiAgd2hlcmUgdXNlbmFtZSBpbiAoJ2Fzc2Vzc19qb2JfYScsJ2Fzc2Vzc19qb2JfYicpIGFuZCBwaWQ8PnBnX2NhdGFsb2cucGdfYmFja2VuZF9waWQoKQogbG9vcAogIGlmIG5vdCBwZ19jYXRhbG9nLnBnX3Rlcm1pbmF0ZV9iYWNrZW5kKGIucGlkLDEwMDApIHRoZW4gYWNrbm93bGVkZ2VkOj1mYWxzZTsgZW5kIGlmOwogZW5kIGxvb3A7CiB1cGRhdGUgcGdfdGVtcC5yYWQwNjJfc3RvcF9yZXBvcnQgc2V0IHRlcm1pbmF0aW9uX29rPWFja25vd2xlZGdlZCwKICBlcnJvcnM9Y2FzZSB3aGVuIGFja25vd2xlZGdlZCB0aGVuIGVycm9ycyBlbHNlIGFycmF5X2FwcGVuZChlcnJvcnMsJ3Rlcm1pbmF0aW9uOm5vdF9hY2tub3dsZWRnZWQnKSBlbmQ7CmV4Y2VwdGlvbiB3aGVuIHF1ZXJ5X2NhbmNlbGVkIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA2Ml9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ3Rlcm1pbmF0aW9uOjU3MDE0Jyk7CndoZW4gb3RoZXJzIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA2Ml9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ3Rlcm1pbmF0aW9uOid8fHNxbHN0YXRlKTsKZW5kICR0ZXJtaW5hdGUkOw==','base64'),'UTF8'); END $phone$;
-- Keep the original submitted_at whenever present; active freezes no later than deadline.
-- At retry_at=original submission+7d, claim_v1's strict <7d condition is already false.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJGZyZWV6ZSQKYmVnaW4KIHBlcmZvcm0gYXNzZXNzLmZyZWV6ZV92MigpOwogdXBkYXRlIHBnX3RlbXAucmFkMDYyX3N0b3BfcmVwb3J0IHNldCBmcmVlemVfb2s9dHJ1ZTsKZXhjZXB0aW9uIHdoZW4gcXVlcnlfY2FuY2VsZWQgdGhlbgogdXBkYXRlIHBnX3RlbXAucmFkMDYyX3N0b3BfcmVwb3J0IHNldCBlcnJvcnM9YXJyYXlfYXBwZW5kKGVycm9ycywnZnJlZXplOjU3MDE0Jyk7CndoZW4gb3RoZXJzIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA2Ml9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ2ZyZWV6ZTonfHxzcWxzdGF0ZSk7CmVuZCAkZnJlZXplJDs=','base64'),'UTF8'); END $phone$;
-- Verification is itself bounded/caught. Final SELECT reads only the private one-row report.
DO $phone$ BEGIN EXECUTE convert_from(decode('ZG8gJHZlcmlmeSQKZGVjbGFyZSBmYWN0cyBqc29uYjsKYmVnaW4KIHBlcmZvcm0gcGdfY2F0YWxvZy5wZ19zdGF0X2NsZWFyX3NuYXBzaG90KCk7CiBzZWxlY3QganNvbmJfYnVpbGRfb2JqZWN0KAogICdnYXRlQ2xvc2VkJywoc2VsZWN0IGNvdW50KCopPTEgYW5kIGNvYWxlc2NlKGJvb2xfYW5kKG5vdCBlbmFibGVkKSxmYWxzZSkgZnJvbSBhc3Nlc3MubGF1bmNoX2dhdGUpLAogICdsb2dpbkRpc2FibGVkJyxub3QgZXhpc3RzKHNlbGVjdCAxIGZyb20gcGdfY2F0YWxvZy5wZ19yb2xlcyB3aGVyZSByb2xuYW1lIGluICgnYXNzZXNzX2pvYl9hJywnYXNzZXNzX2pvYl9iJykgYW5kIHJvbGNhbmxvZ2luKSwKICAnbWlzc2luZ1JvbGVzJywyLShzZWxlY3QgY291bnQoKikgZnJvbSBwZ19jYXRhbG9nLnBnX3JvbGVzIHdoZXJlIHJvbG5hbWUgaW4gKCdhc3Nlc3Nfam9iX2EnLCdhc3Nlc3Nfam9iX2InKSksCiAgJ2JhY2tlbmRTZXNzaW9ucycsKHNlbGVjdCBjb3VudCgqKSBmcm9tIHBnX2NhdGFsb2cucGdfc3RhdF9hY3Rpdml0eSB3aGVyZSB1c2VuYW1lIGluICgnYXNzZXNzX2pvYl9hJywnYXNzZXNzX2pvYl9iJykpLAogICd1bmhlbGRTZXNzaW9ucycsKHNlbGVjdCBjb3VudCgqKSBmcm9tIGFzc2Vzcy5zZXNzaW9ucyB3aGVyZSBzdGF0ZSBpbiAoJ2FjdGl2ZScsJ2dyYWRpbmcnLCdhd2FpdGluZy1tYW51YWwnKSBvcgogICAoc3RhdGU9J2dyYWRpbmctZmFpbGVkJyBhbmQgKGVtZXJnZW5jeV9oZWxkX2F0IGlzIG51bGwgb3Igc3VibWl0dGVkX2F0IGlzIG51bGwgb3IgbGVhc2UgaXMgbm90IG51bGwgb3IgbGVhc2VfdW50aWwgaXMgbm90IG51bGwKICAgIG9yIGZhaWxlZF9hdCBpcyBudWxsIG9yIHJldHJ5X2F0IGlzIGRpc3RpbmN0IGZyb20gc3VibWl0dGVkX2F0K2ludGVydmFsICc3IGRheXMnKSkpCiApIGludG8gZmFjdHM7CiB1cGRhdGUgcGdfdGVtcC5yYWQwNjJfc3RvcF9yZXBvcnQgc2V0IHZlcmlmaWNhdGlvbj1mYWN0czsKZXhjZXB0aW9uIHdoZW4gcXVlcnlfY2FuY2VsZWQgdGhlbgogdXBkYXRlIHBnX3RlbXAucmFkMDYyX3N0b3BfcmVwb3J0IHNldCBlcnJvcnM9YXJyYXlfYXBwZW5kKGVycm9ycywndmVyaWZpY2F0aW9uOjU3MDE0Jyk7CndoZW4gb3RoZXJzIHRoZW4KIHVwZGF0ZSBwZ190ZW1wLnJhZDA2Ml9zdG9wX3JlcG9ydCBzZXQgZXJyb3JzPWFycmF5X2FwcGVuZChlcnJvcnMsJ3ZlcmlmaWNhdGlvbjonfHxzcWxzdGF0ZSk7CmVuZCAkdmVyaWZ5JDs=','base64'),'UTF8'); END $phone$;
select 'assess-emergency-stop/2' as contract,
 case when gate_ok and login_a_ok and login_b_ok and termination_ok and freeze_ok
  and cardinality(errors)=0 and coalesce((verification->>'gateClosed')::boolean,false)
  and coalesce((verification->>'loginDisabled')::boolean,false)
  and (verification->>'backendSessions')::bigint=0 and (verification->>'unheldSessions')::bigint=0 then 'STOPPED'
 when gate_ok or login_a_ok or login_b_ok or termination_ok or freeze_ok then 'PARTIAL' else 'FAILED' end as status,
 gate_ok,login_a_ok,login_b_ok,termination_ok,freeze_ok,errors,verification,
 false as pooler_cache_verified,false as cloud_stop_verified,false as runtime_or_launch_verified
from pg_temp.rad062_stop_report;
commit;

```

## 2 تحقق مستقل بعد COMMIT — قراءة فقط

المصدر: supabase/checks/assess-emergency-stopped-v2.sql؛ SHA-256: 1410ca5d2737760f76207a54187310fd8b6e9db50e674e9f9f4202a4ce2dceb4.

الجزء1 — 1512 حرفًا.

```sql
-- V2 ONLY after complete DB day and P10 promotion; current schema uses v1.
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
 (select count(*) from assess.sessions where state in ('active','grading','awaiting-manual') or
  (state='grading-failed' and (emergency_held_at is null or submitted_at is null or lease is not null or lease_until is not null
   or failed_at is null or retry_at is distinct from submitted_at+interval '7 days'))) unheld_sessions
)
select 'assess-emergency-verification/2' as contract,
 case when gate_closed and login_disabled and backend_sessions=0 and unheld_sessions=0 then 'STOPPED' else 'PARTIAL' end as status,
 gate_closed,login_disabled,missing_roles,backend_sessions,unheld_sessions,
 false as pooler_cache_verified,false as cloud_stop_verified,false as runtime_or_launch_verified
from facts;
rollback;

```
