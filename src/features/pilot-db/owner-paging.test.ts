import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const owner = "00000000-0000-0000-0000-000000000001";
const user = "00000000-0000-0000-0000-000000000002";
const pending = "00000000-0000-0000-0000-000000000003";
const suspended = "00000000-0000-0000-0000-000000000004";
const suspendedOwner = "00000000-0000-0000-0000-000000000005";
type Page = { version: number; total: number; pending: number; rows: Record<string, unknown>[]; next: { time: string; id: string } | null; boundary: string };
async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
  const dir = join(process.cwd(), "supabase/migrations");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(join(dir, f), "utf8"));
  for (const id of [owner, user, pending, suspended, suspendedOwner]) await db.query(`insert into auth.users values ($1,'synthetic@example.test',now(),'{"consent_version":"2026-10-17"}')`, [id]);
  await db.exec(`update public.profiles set status='approved';
    update public.profiles set role='owner' where user_id in ('${owner}','${suspendedOwner}');
    update public.profiles set status='pending' where user_id='${pending}';
    update public.profiles set status='suspended' where user_id in ('${suspended}','${suspendedOwner}');
    update public.profiles set created_at='2026-01-01';
    insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
      select lpad(to_hex(i),32,'0')::uuid,'${user}',(i-1)%1000+1,'x','default','v','{}','{"total":80,"passed":true}','ar','2026-01-02' from generate_series(1,10005) i;
    insert into public.feedback(user_id,exam_id,attempt_id,text,at) values ('${user}','x',lpad(to_hex(10005),32,'0')::uuid,'=ملاحظة','2026-01-03');`);
  return db;
}
async function login(db: PGlite, id: string, role = "authenticated") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec(`set role ${role}`);
}
async function page(db: PGlite, args: Record<string, unknown> = {}): Promise<Page> {
  const a = { p_stream: "attempts", ...args };
  const keys = Object.keys(a);
  const sql = `select public.owner_page_v1(${keys.map((k, i) => `${k} => $${i + 1}`).join(",")}) v`;
  return (await db.query<{ v: Page }>(sql, Object.values(a))).rows[0]!.v;
}

describe("owner bounded RPC (full discovered chain)", () => {
  it("grants only authenticated execution; denies visitor, every non-owner state and suspended owner, before invalid arguments", async () => {
    const db = await setup();
    try {
      const acl = await db.query<{ prosecdef: boolean; proconfig: string[]; proacl: string }>(`select prosecdef,proconfig,proacl::text from pg_proc where proname='owner_page_v1'`);
      expect(acl.rows[0]!.prosecdef).toBe(true);
      expect(acl.rows[0]!.proconfig).toEqual(['search_path=""']);
      expect(acl.rows[0]!.proacl).toContain("authenticated=X");
      expect(acl.rows[0]!.proacl).not.toMatch(/(?:\{|,)=(?:X)|anon=/);
      await login(db, "", "anon");
      await expect(page(db)).rejects.toThrow(/permission denied/);
      for (const id of ["", user, pending, suspended, suspendedOwner]) {
        await login(db, id);
        for (const stream of ["participants", "attempts", "notes", "bad"]) await expect(page(db, { p_stream: stream, p_export: true, p_limit: -1 })).rejects.toThrow(/owner only/);
      }
      await login(db, owner);
      expect((await page(db, { p_stream: "participants" })).total).toBe(5);
      expect((await page(db, { p_stream: "participants" })).pending).toBe(1);
      for (const args of [{ p_limit: 0 }, { p_limit: -1 }, { p_limit: null }, { p_stream: "bad" }, { p_cursor: {} }, { p_cursor: { time: "oops", id: "x" } }, { p_cursor: { time: "2026-01-02", id: "x" } }, { p_from: "2026-02-01", p_to: "2026-01-01" }]) await expect(page(db, args)).rejects.toThrow();
      expect((await page(db, { p_limit: 10001 })).rows).toHaveLength(1000);
      expect((await page(db)).rows).toHaveLength(100);
    } finally { await db.close(); }
  }, 30000);

  it("pages >10k ties without loss, filters totals, joins note linkage, retains read boundary across inserts/deletes", async () => {
    const db = await setup();
    try {
      await login(db, owner);
      const first = await page(db, { p_limit: 1000, p_boundary: "2026-01-31" });
      expect(first.total).toBe(10005);
      const ids = new Set(first.rows.map((r) => r.id));
      let current = first;
      while (current.next) {
        current = await page(db, { p_limit: 1000, p_cursor: JSON.stringify(current.next), p_boundary: first.boundary });
        for (const row of current.rows) { expect(ids.has(row.id)).toBe(false); ids.add(row.id); }
      }
      expect(ids.size).toBe(10005);
      expect((await page(db, { p_exam: "none" })).total).toBe(0);
      expect((await page(db, { p_participant: pending })).total).toBe(0);
      expect((await page(db, { p_from: "2026-01-03" })).total).toBe(0);
      const notes = await page(db, { p_stream: "notes", p_export: true });
      expect(notes.rows[0]).toMatchObject({ attempt_no: 5, text: "=ملاحظة" });
      expect(notes.rows[0]).not.toHaveProperty("user_id");
      expect(notes.rows[0]).not.toHaveProperty("email");
      expect(notes.rows[0]).not.toHaveProperty("device");
      await db.exec("reset role");
      await db.exec(`insert into public.attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
        values ('${user}',6,'x','d','v','{}','{}','en','2026-02-01'),('${user}',7,'x','d','v','{}','{}','en','2026-01-01');
        delete from public.attempts where id=lpad(to_hex(10005),32,'0')::uuid;`);
      await login(db, owner);
      const after = await page(db, { p_boundary: first.boundary });
      // Backdated insert is in scope, future insert is not; deletion is visible. Boundary != snapshot.
      expect(after.total).toBe(10005);
      const participants = await page(db, { p_stream: "participants", p_limit: 2 });
      expect(participants.rows).toHaveLength(2);
      expect((await page(db, { p_stream: "participants", p_limit: 2, p_boundary: participants.boundary, p_cursor: JSON.stringify(participants.next) })).rows[0]!.user_id).toBe(pending);
      await expect(page(db, { p_stream: "notes", p_cursor: { time: "2026-01-01", id: "-1" } })).rejects.toThrow();
      await db.exec("reset role");
      await db.exec(`insert into public.feedback(id,user_id,exam_id,text,at) overriding system value values
        (1,'${user}','x','tie1','2026-01-03'),(2,'${user}','x','tie2','2026-01-03'),(10,'${user}','x','tie10','2026-01-03'),
        (9007199254740993,'${user}','x','bigint','2026-01-03');`);
      await login(db, owner);
      const notePage = await page(db, { p_stream: "notes", p_limit: 2 });
      expect(notePage.rows.map((r) => r.id)).toEqual(["1", "2"]);
      const nextNotes = await page(db, { p_stream: "notes", p_limit: 2, p_cursor: JSON.stringify(notePage.next), p_boundary: notePage.boundary });
      expect(nextNotes.rows.map((r) => r.id)).toEqual(["10", "9007199254740993"]);
    } finally { await db.close(); }
  }, 30000);
});
