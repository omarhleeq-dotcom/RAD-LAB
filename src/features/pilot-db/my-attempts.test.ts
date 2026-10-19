// Existing production migrations, real PostgreSQL roles/RLS; no new policy or provider operation.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("isolates direct participant reads and pages own Practice rows with stable ties, including for the owner", async () => {
  const db = new PGlite();
  const a = "00000000-0000-0000-0000-000000000001", b = "00000000-0000-0000-0000-000000000002", owner = "00000000-0000-0000-0000-000000000003";
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    const dir = join(process.cwd(), "supabase/migrations");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(join(dir, file), "utf8"));
    for (const uid of [a, b, owner]) await db.query("insert into auth.users values($1,'synthetic@example.test',now(),'{}')", [uid]);
    await db.exec(`update public.profiles set status='approved'; update public.profiles set role='owner' where user_id='${owner}';
      insert into public.attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
      select lpad(to_hex(i),32,'0')::uuid,'${a}',i,'saved','default','v','{}','{"total":80,"passed":true}','ar','2026-01-01T00:00:00.123456Z' from generate_series(1,45) i;
      insert into public.attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale,finished_at)
      values ('${b}',1,'other','default','v','{}','{}','en','2026-02-01'),('${owner}',1,'own','default','v','{}','{}','en','2026-02-01');`);
    const login = async (uid: string | null) => {
      await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid ?? ""]);
      await db.exec(`set role ${uid === null ? "anon" : "authenticated"}`);
    };
    await login(null); await expect(db.query("select * from public.attempts limit 21")).rejects.toMatchObject({ code: "42501" });
    await login(a);
    // Deliberately remove the application filter, then forge it: RLS must still isolate A from B.
    expect((await db.query<{ user_id: string }>("select user_id from public.attempts")).rows.every((r) => r.user_id === a)).toBe(true);
    expect((await db.query("select id from public.attempts where user_id=$1", [b])).rows).toEqual([]);
    const select = (uid: string, cursor: string | null) => db.query<{ id: string }>(`select id from public.attempts
      where user_id=$1 and mode='practice' and record_kind='attempt'
      and ($2::uuid is null or finished_at<'2026-01-01T00:00:00.123456Z' or (finished_at='2026-01-01T00:00:00.123456Z' and id>$2::uuid))
      order by finished_at desc,id asc limit 21`, [uid, cursor]);
    const seen: string[] = []; let cursor: string | null = null;
    for (;;) {
      const rows: { id: string }[] = (await select(a, cursor)).rows; expect(rows.length).toBeLessThanOrEqual(21);
      const visible = rows.slice(0, 20); seen.push(...visible.map((r) => r.id));
      if (rows.length < 21) break; cursor = visible.at(-1)!.id;
    }
    expect(new Set(seen).size).toBe(45); expect(seen).toHaveLength(45);
    for (const status of ["pending", "suspended"]) {
      await db.exec("reset role"); await db.query("update public.profiles set status=$2 where user_id=$1", [a, status]); await login(a);
      expect((await db.query("select id from public.attempts where user_id=$1", [b])).rows).toEqual([]);
    }
    await login(owner);
    expect((await select(owner, null)).rows).toHaveLength(1);
    // Existing owner privileges remain; own-only account scope is applied in the server query, not browser filtering.
    expect((await db.query("select id from public.attempts")).rows).toHaveLength(47);
  } finally { await db.close(); }
}, 30000);
