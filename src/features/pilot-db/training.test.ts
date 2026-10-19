import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("enforces training scopes, profile writes, aggregate filters and bounded keyset pages in PostgreSQL", async () => {
  const db = new PGlite();
  const a = "00000000-0000-0000-0000-000000000001", b = "00000000-0000-0000-0000-000000000002", owner = "00000000-0000-0000-0000-000000000003";
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    const dir = join(process.cwd(), "supabase/migrations");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(join(dir, file), "utf8"));
    await db.query("insert into auth.users values($1,'a@example.test',now(),$2)", [a, JSON.stringify({ display_name: "  أحمد  ", consent_version: "2026-10-18" })]);
    for (const uid of [b, owner]) await db.query("insert into auth.users values($1,'other@example.test',now(),'{}')", [uid]);
    expect((await db.query("select display_name,consent_version from profiles where user_id=$1", [a])).rows).toEqual([{ display_name: "أحمد", consent_version: "2026-10-18" }]);
    await db.exec(`update profiles set status='approved'; update profiles set role='owner' where user_id='${owner}';
      insert into attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
      select lpad(to_hex(i),32,'0')::uuid,'${a}',1,'chest-pa-erect','default','v1','{}','{"total":80,"passed":true,"critical":[],"categories":[]}','ar','2026-01-01T00:00:00.123456Z' from generate_series(1,45) i;
      insert into attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
      values('${b}',1,'other','default','v1','{}','{}','en',now()),('${owner}',1,'owner-own','default','v1','{}','{}','en',now());`);
    const login = async (uid: string | null) => { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid ?? ""]); await db.exec(`set role ${uid ? "authenticated" : "anon"}`); };
    type Page = { boundary: string; rows: Record<string, unknown>[]; next: Record<string, string> | null; summary: { attempts: number; exams: number; trainees: number | null } };
    const read = async (view: string, scope = "own", user: string | null = null, cursor: Record<string, string> | null = null, boundary: string | null = null, days: number | null = null, search = "", status = "", exam = "chest-pa-erect", limit = 20) => (await db.query<{ page: Page }>("select training_page_v1($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) page", [view, scope, user, exam, search, status, days, cursor ? JSON.stringify(cursor) : null, boundary, limit])).rows[0]!.page;
    await login(null); await expect(read("summary")).rejects.toMatchObject({ code: "42501" });
    await login(a);
    expect((await read("summary")).summary).toMatchObject({ attempts: 45, exams: 1, trainees: null });
    await expect(read("summary", "own", b)).rejects.toMatchObject({ code: "42501" });
    await expect(read("people", "all")).rejects.toMatchObject({ code: "42501" });
    await expect(read("summary", "all", a)).rejects.toMatchObject({ code: "42501" });
    expect((await read("summary", "own", null, null, null, 7)).summary.attempts).toBe(0);
    await db.query("update profiles set display_name=$1 where user_id=$2", ["New Name", a]);
    expect((await db.query("select display_name from profiles where user_id=$1", [a])).rows).toEqual([{ display_name: "New Name" }]);
    await db.query("update profiles set display_name='forged' where user_id=$1", [b]);
    await expect(db.query("update profiles set role='owner' where user_id=$1", [a])).rejects.toMatchObject({ code: "42501" });
    await expect(db.query("update profiles set display_name='' where user_id=$1", [a])).rejects.toMatchObject({ code: "23514" });
    await expect(db.query("update profiles set display_name=$1 where user_id=$2", ["x".repeat(101), a])).rejects.toMatchObject({ code: "23514" });
    const seen: string[] = []; let cursor: Record<string, string> | null = null; let boundary: string | null = null;
    do {
      const p: Page = await read("history", "own", null, cursor, boundary, null, "", "", "chest-pa-erect", 10000);
      expect(p.rows.length).toBeLessThanOrEqual(20); seen.push(...p.rows.map((r) => String(r.id))); cursor = p.next; boundary = p.boundary;
    } while (cursor);
    expect(seen).toHaveLength(45); expect(new Set(seen).size).toBe(45); expect(seen).toEqual([...seen].sort());
    expect((await read("exams")).rows).toMatchObject([{ exam: "chest-pa-erect", attempts: 45 }]);
    await expect(read("history", "own", null, {})).rejects.toMatchObject({ code: "22023" });
    await expect(read("summary", "own", null, null, null, 999)).rejects.toMatchObject({ code: "22023" });
    await login(owner);
    expect((await read("summary", "own")).summary.attempts).toBe(1);
    expect((await read("summary", "all")).summary).toMatchObject({ attempts: 47, exams: 3, trainees: 3 });
    expect((await read("summary", "all", a)).summary.attempts).toBe(45);
    const people = await read("people", "all"); expect(people.rows).toHaveLength(3);
    expect(people.rows.find((r) => r.id === b)?.name).toBe(null);
    expect((await read("people", "all", null, null, null, null, "new name")).rows.map((r) => r.id)).toEqual([a]);
    expect((await read("people", "all", null, null, null, null, "other@")).rows).toHaveLength(2);
    expect((await read("people", "all", null, null, null, null, "%")).rows).toHaveLength(0);
    expect((await read("people", "all", null, null, null, null, "", "pending")).rows).toHaveLength(0);
    for (const uid of [a, owner]) {
      await db.exec("reset role"); await db.query("update profiles set status='suspended' where user_id=$1", [uid]); await login(uid);
      await expect(read("summary")).rejects.toMatchObject({ code: "42501" });
      await expect(read("summary", "all")).rejects.toMatchObject({ code: "42501" });
    }
    // Page people/exams by stable keys, including duplicate display names and old/no-training accounts.
    await db.exec("reset role; update profiles set status='approved'");
    await db.exec(`insert into auth.users(id,email,raw_user_meta_data) select ('20000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'duplicate@example.test','{"display_name":"Same Name"}' from generate_series(1,43) i;
      insert into attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale)
      select '${a}',1,'exam-'||lpad(i::text,2,'0'),'default','v1','{}','{}','en' from generate_series(1,43) i;`);
    await login(owner);
    for (const view of ["people", "exams"]) {
      const ids: string[] = []; cursor = null; boundary = null;
      do {
        const p: Page = await read(view, "all", view === "exams" ? a : null, cursor, boundary);
        expect(p.rows.length).toBeLessThanOrEqual(20); ids.push(...p.rows.map((r) => String(r[view === "people" ? "id" : "exam"]))); cursor = p.next; boundary = p.boundary;
      } while (cursor);
      expect(ids.length).toBe(view === "people" ? 46 : 44); expect(new Set(ids).size).toBe(ids.length);
    }
  } finally { await db.close(); }
}, 30000);

it("upgrades existing profiles without changing saved training, existing policies or legacy RPC definitions", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    const dir = join(process.cwd(), "supabase/migrations"), migration = "20261020000400_training_dashboard.sql";
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql") && f < migration).sort()) await db.exec(readFileSync(join(dir, file), "utf8"));
    await db.exec(`insert into auth.users values('00000000-0000-0000-0000-000000000001','synthetic@example.test',now(),'{"consent_version":"2026-10-18"}');
      insert into attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale)
      values('00000000-0000-0000-0000-000000000001',1,'saved','default','frozen','{"rotation":3}','{"total":12,"passed":false}','ar');`);
    const data = async () => (await db.query("select to_jsonb(p)-'display_name' row from profiles p union all select to_jsonb(a) from attempts a")).rows;
    const policies = async () => (await db.query("select * from pg_policies where schemaname='public' order by tablename,policyname")).rows;
    const functions = async () => (await db.query<{ name: string; def: string; acl: string }>("select proname name,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by proname")).rows;
    const before = { data: await data(), policies: await policies(), functions: await functions() };
    await db.transaction(async (tx) => { await tx.exec(readFileSync(join(dir, migration), "utf8")); });
    expect(await data()).toEqual(before.data); expect(await policies()).toEqual(before.policies);
    const after = await functions();
    for (const f of before.functions) {
      const current = after.find((a) => a.name === f.name);
      if (f.name === "handle_new_user") expect(current?.acl).toBe(f.acl);
      else expect(current).toEqual(f);
    }
    expect(after.filter((f) => !before.functions.some((b) => b.name === f.name)).map((f) => f.name)).toEqual(["can_read_training", "training_page_v1"]);
    const grants = (await db.query<{ grantee: string; privilege_type: string }>("select grantee,privilege_type from information_schema.column_privileges where table_schema='public' and table_name='profiles' and column_name='display_name' and grantee in ('anon','authenticated') order by grantee,privilege_type")).rows;
    expect(grants).toEqual([{ grantee: "authenticated", privilege_type: "SELECT" }, { grantee: "authenticated", privilege_type: "UPDATE" }]);
    await db.exec("set role anon"); await expect(db.query("select public.training_page_v1('summary')")).rejects.toMatchObject({ code: "42501" });
    await db.exec("reset role; set role authenticated"); await expect(db.query("select public.can_read_training('all',null)")).rejects.toMatchObject({ code: "42501" });
  } finally { await db.close(); }
}, 30000);
