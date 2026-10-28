// Owner decision A: synthetic provider internals; disposable Unix-socket PostgreSQL only.
import { readFileSync } from 'node:fs';
import type { Client } from 'pg';
import { expect, it } from 'vitest';
import { openRad085Database, fixtureId as id } from './rad085-local-db';
import { RAD085_MIGRATIONS } from './server-rad085-contracts';
const read = (p: string) => readFileSync(p, 'utf8');
const m4 = () => read(`supabase/migrations/${RAD085_MIGRATIONS[3]}`);
const authTables = ['identities', 'mfa_factors', 'mfa_recovery_code_sets', 'oauth_authorizations', 'oauth_consents', 'one_time_tokens', 'scim_users', 'webauthn_challenges', 'webauthn_credentials', 'sessions'];
async function auth(c: Client) {
 for (const t of authTables) await c.query(`create table auth.${t}(id integer primary key,user_id uuid constraint ${t}_user_id_fkey references auth.users(id) on delete ${t === 'scim_users' ? 'set null' : 'cascade'})`);
 await c.query('create table auth.refresh_tokens(user_id text)');
}
it('A: installs with all live Auth edges before M4 and ignores future Auth evolution at runtime', async () => {
 const db = await openRad085Database(auth);
 try {
  const inv = (await db.admin.query('select assess.d3_fk_inventory_v1() v')).rows[0].v;
  expect(inv.every((e: string[]) => e[0] !== 'auth')).toBe(true);
  expect(inv.some((e: string[]) => e[0] === 'public' && e[1] === 'profiles' && e[3]?.includes('auth.users'))).toBe(true);
  expect((await db.admin.query('select inventory=$1::jsonb ok from assess.erasure_fk_contract', [JSON.stringify(inv)])).rows[0].ok).toBe(true);
  await db.admin.query('create table auth.future_provider_table(user_id uuid references auth.users(id) on delete cascade)');
  expect((await db.admin.query('select assess.d3_fk_inventory_v1() v')).rows[0].v).toEqual(inv);
  await expect(db.admin.query('select assess.d3_inventory_v1($1)', [id(2)])).resolves.toBeDefined();
 } finally { await db.close(); }
}, 30000);
for (const [schema, target] of [['public', 'auth.users(id)'], ['assess', 'auth.users(id)'], ['public', 'public.profiles(user_id)'], ['assess', 'public.profiles(user_id)'], ['storage', 'public.profiles(user_id)'], ['future_schema', 'public.profiles(user_id)'], ['storage', 'auth.users(id)']] as const) {
 const extra = `create schema if not exists ${schema}; create table ${schema}.synthetic_unknown(user_id uuid references ${target})`;
 it(`A: rejects ${schema} -> ${target} at install and runtime`, async () => {
  const before = await openRad085Database(undefined, RAD085_MIGRATIONS.slice(0, 3));
  try {
   await before.admin.query(extra);
   await expect(before.admin.query(m4())).rejects.toMatchObject({ code: '55000', message: 'unreviewed D3 FK inventory' });
   await before.admin.query('rollback');
   expect((await before.admin.query("select to_regprocedure('assess.d3_fk_inventory_v1()') v")).rows[0].v).toBeNull();
  } finally { await before.close(); }
  const after = await openRad085Database();
  try {
   await after.admin.query(extra);
   await expect(after.admin.query('select assess.d3_inventory_v1($1)', [id(2)])).rejects.toMatchObject({ code: '55000', message: 'D3 FK inventory changed' });
  } finally { await after.close(); }
 }, 30000);
}
it('A: full DB-day path removes trial, installs M1–M4, is 13/13 before/after initializer, and C2 finalise applies provider CASCADE/SET NULL', async () => {
 const db = await openRad085Database(async c => {
  await auth(c);
  await c.query('alter table auth.users add column banned_until timestamptz');
  for (let n = 1; n <= 3; n++) await c.query("insert into auth.users values($1,$2,now(),'{\"display_name\":\"SYNTHETIC\",\"consent_version\":\"2026-10-24\"}')", [id(n), `auth-${n}@example.test`]);
  await c.query("update public.profiles set status='approved',role=case when user_id=$1 then 'owner' else 'participant' end", [id(1)]);
  await c.query(read('scripts/assess/sql/trial-isolation.sql'));
  await c.query("insert into assess.trial_scope(id,owner_id,student_id,outsider_id,assessment_id,version_labels,active) values($1,$2,$3,$4,$5,array['visible','hidden'],true)", [id(80), id(1), id(2), id(3), id(10)]);
  await c.query(read('supabase/manual/rad085-db-day-trial-remove.sql'));
  expect((await c.query("select to_regclass('assess.trial_scope') v")).rows[0].v).toBeNull();
 });
 try {
  const ready = async (phase: string) => {
   await db.admin.query(phase);
   const results = await db.admin.query(read('supabase/checks/rad085-d3-ready.sql'));
   const rows = (results as unknown as { rows: { kind: string; ready: boolean }[] }[]).find(r => r.rows.length)!.rows;
   expect(rows).toHaveLength(13); expect(rows.filter(r => !r.ready)).toEqual([]);
  };
  await ready("set rad085.sharing_phase='pre-initializer'");
  await db.admin.query(read('supabase/manual/rad085-sharing-policy-live-p1.sql'));
  await ready('reset rad085.sharing_phase');
  for (const t of authTables) await db.admin.query(`insert into auth.${t} values(1,$1),(2,$2)`, [id(2), id(3)]);
  await db.transaction(1, c => c.query("select public.owner_account_deletion_v1('deactivate',$1)", [id(2)]));
  await db.admin.query("update public.c2_account_deletions set requested_at=clock_timestamp()-interval '31 days' where user_id=$1", [id(2)]);
  const result = await db.transaction(1, async c => (await c.query("select public.owner_account_deletion_v1('finalise',$1) v", [id(2)])).rows[0].v);
  expect(result.processed).toBe(1);
  expect((await db.admin.query('select * from auth.users where id=$1', [id(2)])).rowCount).toBe(0);
  for (const t of authTables) {
   const rows = (await db.admin.query(`select * from auth.${t} order by id`)).rows;
   expect(rows).toEqual(t === 'scim_users' ? [{ id: 1, user_id: null }, { id: 2, user_id: id(3) }] : [{ id: 2, user_id: id(3) }]);
  }
 } finally { await db.close(); }
}, 30000);
