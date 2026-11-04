// RAD-104 option C packet (DECISIONS#brevo-signup-notify-owner-2026-11-04) on disposable PGlite, DB lane.
// Runs the REAL owner packet, check and rollback. Supabase pieces are imitated: roles, auth.users, and
// stubs for pg_cron (cron.job/schedule), pg_net (net.http_post records the call; nothing leaves the process)
// and Vault (vault.decrypted_secrets). A pass proves the SQL logic only, not the live project or Brevo.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const PILOT = read("supabase/migrations/20261015000100_pilot_accounts.sql");
const INSTALL = read("supabase/manual/signup-notify-install.sql");
const ROLLBACK = read("supabase/manual/signup-notify-rollback.sql");
const CHECK = read("supabase/checks/signup-notify-ready.sql");

const BASE = `
 create role anon nologin; create role authenticated nologin; create role service_role nologin;
 create schema auth;
 create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
 grant usage on schema auth to anon, authenticated;`;
const CRON = `
 create schema cron;
 create table cron.job (jobid bigserial primary key, jobname text unique, schedule text, command text, active boolean default true);
 create function cron.schedule(job_name text, schedule text, command text) returns bigint language sql
  as $$ insert into cron.job(jobname,schedule,command) values(job_name,schedule,command) returning jobid $$;
 create function cron.unschedule(job_name text) returns boolean language plpgsql as $$
 begin delete from cron.job where jobname=job_name; if not found then raise exception 'could not find valid entry for job'; end if; return true; end $$;`;
const NET = `
 create schema net;
 create table net.calls (id bigserial primary key, url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds int);
 create table net._http_response (id bigint primary key, status_code int, timed_out boolean, content text);
 create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}',
  timeout_milliseconds int default 5000) returns bigint language sql
  as $$ insert into net.calls(url,body,params,headers,timeout_milliseconds) values(url,body,params,headers,timeout_milliseconds) returning id $$;`;
const VAULT = `
 create schema vault;
 create table vault.secrets (name text primary key, decrypted_secret text);
 create view vault.decrypted_secrets as select name, decrypted_secret from vault.secrets;`;
const SECRETS = `insert into vault.secrets values ('radlab_signup_notify_brevo_key','synthetic-key-not-real'),
 ('radlab_signup_notify_sender','sender@example.invalid'),('radlab_signup_notify_recipient','owner@example.invalid')
 on conflict (name) do update set decrypted_secret = excluded.decrypted_secret;`;

async function fresh(opts: { cron?: boolean; net?: boolean; vault?: boolean } = {}): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(BASE + (opts.cron === false ? "" : CRON) + (opts.net === false ? "" : NET) + (opts.vault === false ? "" : VAULT + SECRETS));
  await db.exec(PILOT);
  return db;
}
const install = async (db: PGlite) => { await db.exec(INSTALL); };
const one = async <T>(db: PGlite, sql: string) => (await db.query<T>(sql)).rows[0]!;
const calls = async (db: PGlite) => (await db.query<{ body: Record<string, unknown>; headers: Record<string, string>; url: string }>("select url, body, headers from net.calls order by id")).rows;
const signUp = async (db: PGlite, n: number) => {
  for (let i = 0; i < n; i++)
    await db.query("insert into auth.users(email, raw_user_meta_data) values($1, $2)", [`student${i}.${Date.now()}@example.test`, { display_name: `Synthetic Name ${i}` }]);
};
const digest = async (db: PGlite) => (await one<{ r: string }>(db, "select signup_notify.send_digest() r")).r;
const switchOn = (db: PGlite) => db.exec("update signup_notify.settings set enabled = true where singleton");
const unsent = async (db: PGlite) => Number((await one<{ n: number }>(db, "select count(*)::int n from signup_notify.queue where sent_at is null")).n);

describe("RAD-104 sign-up digest packet", { timeout: 30000 }, () => {
  it("installs with the switch OFF; the read-only check passes with private grants", async () => {
    const db = await fresh(); await install(db);
    const res = await db.exec(CHECK);
    const rows = res.find(r => r.fields.some(f => f.name === "check_name"))!.rows as { check_name: string; ok: boolean; detail: string | null }[];
    expect(rows.every(r => r.ok), JSON.stringify(rows)).toBe(true);
    const by = Object.fromEntries(rows.map(r => [r.check_name, r.detail]));
    expect(by).toMatchObject({ switch_state: "OFF", unsent_count: "0", last_outcome: "none", last_http_status: "none" });
    expect(rows.map(r => r.check_name)).toEqual(expect.arrayContaining(["objects_present", "trigger_on_auth_users", "cron_job_every_10_min", "rls_on", "grants_private"]));
    const job = await one<{ schedule: string; command: string }>(db, "select schedule, command from cron.job where jobname='radlab-signup-notify'");
    expect(job).toEqual({ schedule: "*/10 * * * *", command: "select signup_notify.send_digest()" });
    await db.close();
  });

  it("refuses to install without pg_cron, pg_net or Vault and leaves nothing behind", async () => {
    for (const missing of ["cron", "net", "vault"] as const) {
      const db = await fresh({ [missing]: false });
      await expect(install(db)).rejects.toThrow(/STOP/);
      await db.exec("rollback");
      expect((await one<{ s: string | null }>(db, "select to_regnamespace('signup_notify')::text s")).s).toBeNull();
      await db.close();
    }
  });

  it("never blocks a sign-up, even when the queue table is broken or missing", async () => {
    const db = await fresh(); await install(db);
    await db.exec("alter table signup_notify.queue add constraint broken check (id < 0)");
    await signUp(db, 1);
    await db.exec("drop table signup_notify.queue");
    await signUp(db, 1);
    expect((await one<{ n: number }>(db, "select count(*)::int n from public.profiles")).n).toBe(2);
    await db.close();
  });

  it("switch OFF sends nothing and keeps rows unsent", async () => {
    const db = await fresh(); await install(db); await signUp(db, 2);
    expect(await digest(db)).toBe("off");
    expect(await calls(db)).toHaveLength(0);
    expect(await unsent(db)).toBe(2);
    await db.close();
  });

  it("missing or blank Vault secret sends nothing and raises nothing", async () => {
    const db = await fresh(); await install(db); await switchOn(db); await signUp(db, 1);
    for (const name of ["radlab_signup_notify_brevo_key", "radlab_signup_notify_sender", "radlab_signup_notify_recipient"]) {
      await db.query("update vault.secrets set decrypted_secret = '  ' where name = $1", [name]);
      expect(await digest(db)).toBe("no_secret");
      await db.query("delete from vault.secrets where name = $1", [name]);
      expect(await digest(db)).toBe("no_secret");
      await db.exec(SECRETS);
    }
    expect(await calls(db)).toHaveLength(0);
    expect(await unsent(db)).toBe(1);
    expect((await one<{ o: string }>(db, "select last_outcome o from signup_notify.settings")).o).toBe("no_secret");
    await db.close();
  });

  it("sends ONE email per window with only the count and total, then is idempotent", async () => {
    const db = await fresh(); await install(db); await switchOn(db); await signUp(db, 3);
    const users = (await db.query<{ id: string; email: string; code: string }>("select u.id::text id, u.email, p.participant_code code from auth.users u join public.profiles p on p.user_id = u.id")).rows;
    expect(await digest(db)).toBe("sent");
    expect(await digest(db)).toBe("empty");
    const sent = await calls(db);
    expect(sent).toHaveLength(1);
    const [call] = sent;
    expect(call!.url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(Object.keys(call!.body).sort()).toEqual(["htmlContent", "sender", "subject", "textContent", "to"]);
    expect(call!.body).toMatchObject({ subject: "RAD-LAB: new sign-ups", textContent: "3 new sign-up(s) since last notice; total accounts: 3",
      htmlContent: "<p>3 new sign-up(s) since last notice; total accounts: 3</p>",
      to: [{ email: "owner@example.invalid" }], sender: { name: "RAD-LAB", email: "sender@example.invalid" } });
    const text = JSON.stringify(call!.body);
    for (const u of users) for (const v of [u.id, u.email, u.code]) expect(text).not.toContain(v);
    expect(text).not.toMatch(/Synthetic Name|[0-9a-f]{8}-[0-9a-f]{4}-|href|https?:/i);
    expect(await unsent(db)).toBe(0);
    await signUp(db, 1);
    expect(await digest(db)).toBe("sent");
    expect((await calls(db))[1]!.body.textContent).toBe("1 new sign-up(s) since last notice; total accounts: 4");
    const s = await one<{ o: string; r: string }>(db, "select last_outcome o, last_request_id::text r from signup_notify.settings");
    expect(s).toEqual({ o: "sent", r: "2" });
    await db.close();
  });

  it("send_test sends one email regardless of the switch and leaves the queue alone", async () => {
    const db = await fresh(); await install(db); await signUp(db, 1);
    expect((await one<{ r: string }>(db, "select signup_notify.send_test() r")).r).toBe("test_sent");
    expect((await calls(db))[0]!.body.textContent).toBe("Test notice; total accounts: 1");
    expect(await unsent(db)).toBe(1);
    await db.close();
  });

  it("deletes sent rows after 7 days only", async () => {
    const db = await fresh(); await install(db); await switchOn(db); await signUp(db, 2);
    expect(await digest(db)).toBe("sent");
    await db.exec("update signup_notify.queue set sent_at = now() - interval '8 days' where id = (select min(id) from signup_notify.queue)");
    await digest(db);
    expect((await one<{ n: number }>(db, "select count(*)::int n from signup_notify.queue")).n).toBe(1);
    await db.close();
  });

  it("rollback leaves no object, is re-runnable and keeps the pilot sign-up trigger", async () => {
    const db = await fresh(); await install(db); await switchOn(db); await signUp(db, 1); await digest(db);
    const first = await db.exec(ROLLBACK);
    expect(first.at(-1)!.rows).toEqual([{ schema_left: false, trigger_left: false, cron_job_left: false }]);
    await db.exec(ROLLBACK);
    const left = await one<{ n: number }>(db, `select (select count(*) from pg_namespace where nspname='signup_notify')
      + (select count(*) from pg_proc where proname in ('enqueue','post_brevo','send_digest','send_test') and pronamespace <> 'net'::regnamespace)
      + (select count(*) from cron.job) + (select count(*) from pg_trigger where tgname like 'radlab_signup%') n`);
    expect(Number(left.n)).toBe(0);
    expect((await db.query("select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal")).rows).toEqual([{ tgname: "on_auth_user_created" }]);
    await signUp(db, 1);
    expect((await one<{ n: number }>(db, "select count(*)::int n from public.profiles")).n).toBe(2);
    await db.close();
  });

  it("keeps secrets and addresses out of the packet text; the check is read-only", () => {
    for (const sql of [INSTALL, ROLLBACK, CHECK]) {
      expect(sql).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/);
      expect(sql).not.toMatch(/xkeysib|xsmtpsib|raise notice|raise log/i);
    }
    expect(INSTALL).not.toMatch(/public\.profiles\s+for each row|on public\.profiles|PILOT_SCHEMA_VERIFIED|frontend-schema\.json\b(?!\s+are unchanged)/);
    const executable = CHECK.replace(/--[^\n]*|'(?:''|[^'])*'/g, "");
    expect(executable).not.toMatch(/\b(insert|update|delete|create|alter|drop|grant|revoke|truncate|call|do|perform)\b/i);
    expect(CHECK).toContain("begin read only;");
    expect(CHECK.trim().endsWith("rollback;")).toBe(true);
  });
});
