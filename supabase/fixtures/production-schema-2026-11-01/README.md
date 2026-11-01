# Production schema snapshot — 2026-11-01 (no data)

Owner decision 2026-11-01: test database changes against the real production
catalogue instead of a reconstructed fixture. This folder is test input only.
Nothing here is applied to any database by a workflow.

| File | Source | SHA-256 |
|---|---|---|
| `schema.sql` | `pg_restore --schema-only` of the owner's latest RAD-086 laptop backup (PostgreSQL 17.11), run offline in the pinned `supabase/postgres:17.11.0.016` image | `4fc018a257d80b18916bae6ade40c625449a11cbf5fe52e2f47110db6f1e58b1` |
| `roles.sql` | `roles.sql` from the same backup (`pg_dumpall --roles-only --no-role-passwords`) | `3afbece3bafc53406f259e9da16b8a11ba9160567c587a2ce5f326ce2da666c9` |

## Privacy checks before commit

The owner on the laptop, and the reviewer independently on the uploaded files, found:
zero UUIDs other than the nil UUID, zero e-mail addresses, zero `COPY`/`INSERT` data
rows, zero password verifiers, and no keys or tokens. The snapshot contains
definitions only: no participant data, names, e-mails or identifiers.

## Byte fidelity

The bytes are exactly as dumped, including the CRLF line endings that SQL Editor
installs left in 44 live function bodies. `.gitattributes` marks the folder `-text` (and relaxes whitespace checks for these dumped bytes only) so
no checkout or commit converts line endings. Do not edit, reformat or regenerate these
files. A newer snapshot goes in a new dated folder.

## Known facts this snapshot shows

- No `supabase_migrations` schema (no Supabase CLI migration ledger).
- 44 functions have CRLF bodies, including every v1 function that RAD-062 M06 patches.
- Only `assess_job_a` exists; `assess_job_b` is absent.
- `postgres` is NOSUPERUSER with CREATEROLE/CREATEDB/BYPASSRLS.
- The database owner is not in a schema-only dump; the P9 runbook §1 owner read covers it.
