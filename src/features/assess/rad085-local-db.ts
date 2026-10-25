/** Test-only isolated PostgreSQL. No TCP, provider URL, inherited PG config or real data. */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { Client as PgClient } from 'pg';
import { RAD085_MIGRATIONS } from './server-rad085-contracts';

export const fixtureId = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
export async function openRad085Database(beforeUpgrade?: (admin: PgClient) => Promise<void>) {
  // Only a local package selector; never a database connection selector.
  const require = createRequire('/tmp/radlab-ops-postgres/package.json');
  const { Client } = require('pg') as typeof import('pg');
  const binaries = await import(require.resolve('@embedded-postgres/linux-x64')) as { initdb: string; pg_ctl: string };
  const childEnv = { ...process.env, LD_LIBRARY_PATH: join(dirname(binaries.initdb), '../lib') };
  const dir = mkdtempSync(join(tmpdir(), 'rad085-sql-'));
  const clients = new Set<PgClient>();
  const ctl = (args: string[]) => execFileSync(binaries.pg_ctl, ['-D', join(dir, 'data'), ...args], { stdio: 'pipe', timeout: 15000, env: childEnv });
  let started = false;
  async function connect(label = 'rad085-local') {
    const c = new Client({ host: dir, port: 55432, user: 'postgres', database: 'postgres', password: '', ssl: false,
      application_name: label, connectionTimeoutMillis: 10000, query_timeout: 10000 });
    clients.add(c); await c.connect(); return c;
  }
  async function close() {
    const results = await Promise.allSettled([...clients].map(c => c.end()));
    if (started && existsSync(join(dir, 'data', 'postmaster.pid'))) { ctl(['-m', 'fast', '-w', 'stop']); started = false; }
    rmSync(dir, { recursive: true, force: true });
    if (results.some(r => r.status === 'rejected')) throw Error('rad085_local_cleanup_failed');
  }
  try {
    execFileSync(binaries.initdb, ['-D', join(dir, 'data'), '-A', 'trust', '-U', 'postgres', '--no-locale', '--encoding=UTF8'], { stdio: 'pipe', timeout: 15000, env: childEnv });
    started = true;
    ctl(['-l', join(dir, 'postgres.log'), '-o', `-F -c listen_addresses='' -k ${dir} -p 55432 -c log_min_messages=panic -c log_min_error_statement=panic -c log_statement=none -c log_parameter_max_length=0 -c log_parameter_max_length_on_error=0`, '-w', '-t', '10', 'start']);
    const admin = await connect('rad085-admin');
    await admin.query(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    const names = readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort();
    for (const file of names.filter(f => !(RAD085_MIGRATIONS as readonly string[]).includes(f))) await admin.query(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    if (beforeUpgrade) await beforeUpgrade(admin);
    for (const file of RAD085_MIGRATIONS) await admin.query(readFileSync(`supabase/migrations/${file}`, 'utf8'));
    async function transaction<T>(who: number | 'anon' | 'worker', work: (c: PgClient) => Promise<T>, label = 'rad085-rpc') {
      const c = await connect(label);
      try {
        await c.query('begin');
        await c.query(`set local role ${who === 'anon' ? 'anon' : who === 'worker' ? 'assess_worker' : 'authenticated'}`);
        await c.query("select set_config('request.jwt.claim.sub',$1,true)", [typeof who === 'number' ? fixtureId(who) : '']);
        const value = await work(c); await c.query('commit'); return value;
      } catch (error) { await c.query('rollback'); throw error; }
      finally { await c.end(); clients.delete(c); }
    }
    async function rpc<T = unknown>(who: number | 'anon' | 'worker', name: string, args: unknown[] = [], label?: string): Promise<T> {
      if (!/^[a-z][a-z0-9_]*$/.test(name)) throw Error('invalid_test_rpc');
      return transaction(who, async c => (await c.query<{ v: T }>(`select assess.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) v`, args)).rows[0]!.v, label);
    }
    return { admin, connect, transaction, rpc, close };
  } catch (error) { await close(); throw error; }
}
