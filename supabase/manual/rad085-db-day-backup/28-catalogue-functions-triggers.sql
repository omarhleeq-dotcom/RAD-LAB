-- RAD-085 DB day (B2) - function bodies, ACLs and triggers (public + assess)
-- READ ONLY: one SELECT, no change. Contains PERSONAL DATA once downloaded: keep the CSV on an encrypted
-- disk only, never upload/share it, and delete it when DB day is verified (see docs/RAD-085_DB_DAY_P1.md).
-- Save as catalogue.csv. Insurance for the rollback: the exact LIVE pre-DB-day definitions.
select 'function' as kind, p.oid::regprocedure::text as name, pg_get_functiondef(p.oid) as definition, coalesce(p.proacl::text, '') as acl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'assess') and p.prokind in ('f', 'p')
union all
select 'trigger', t.tgrelid::regclass::text || '.' || t.tgname, pg_get_triggerdef(t.oid), ''
from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal and n.nspname in ('public', 'assess', 'auth')
order by 1, 2;
