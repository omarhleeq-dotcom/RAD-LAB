// Real full SQL chain + upgrade, only Supabase auth/roles are shims. Synthetic records only.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = join(process.cwd(), "supabase/migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const migration = "20261020000300_pilot_record_contracts.sql";
const sql = (f: string) => readFileSync(join(dir, f), "utf8");
const names = ["a", "b", "pending", "suspended", "noConsent", "owner", "ownerPending", "ownerSuspended"] as const;
type Name = typeof names[number];
const id = (n: Name) => `00000000-0000-0000-0000-${String(names.indexOf(n) + 1).padStart(12, "0")}`;
const aid = "10000000-0000-0000-0000-000000000001";
const shim = `create role anon nologin;create role authenticated nologin;create schema auth;
create table auth.users(id uuid primary key default gen_random_uuid(),email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`;
const metadata: Record<string, string[]> = {
  attempts: ["settings_format_version", "result_format_version", "mode", "record_kind", "producer_version", "engine_version"],
  events: ["payload_format_version", "mode", "record_kind", "producer_version", "engine_version"],
  feedback: ["note_format_version", "mode", "record_kind", "producer_version", "engine_version"],
};
let db: PGlite;
type Fn = { name: string; identity: string; definition: string; acl: string | null; security: boolean; config: string[] | null };
let originalFunctions: Fn[];
let originalColumns: string[];
let originalData: Record<string, unknown>[];
const functions = () => db.query<Fn>(`select proname name,oid::regprocedure::text identity,pg_get_functiondef(oid) definition,
 proacl::text acl,prosecdef security,proconfig config from pg_proc where pronamespace='public'::regnamespace order by oid::regprocedure::text`);
async function as<T>(name: Name | null, work: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${name === null ? "anon" : "authenticated"}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [name === null ? "" : id(name)]);
  try { return await work(); } finally { await db.exec("reset role;select set_config('request.jwt.claim.sub','',false)"); }
}
const insert = (locale = "en", attrs: Record<string, unknown> = {}) => {
  const row = { user_id: id("a"), attempt_no: 2, exam_id: "x", case_id: "default", definition_version: "frozen", settings: {}, result: { total: 82, passed: true }, locale, finished_at: "2026-01-01T00:00:00Z", ...attrs };
  return db.query(`insert into public.attempts(${Object.keys(row).join(",")})values(${Object.keys(row).map((_, i) => `$${i + 1}`).join(",")}) returning *`, Object.values(row));
};
type Page = { version: number; record_contract_version?: number; total: number; rows: Record<string, unknown>[]; next: { time: string; id: string } | null; boundary: string };
async function page(stream: "participants" | "attempts" | "notes", args: Record<string, unknown> = {}) {
  const values = { p_stream: stream, p_participant: stream === "participants" ? null : id("a"), ...args };
  const result = await db.query<{ v: Page }>(`select public.owner_page_v1(${Object.keys(values).map((k, i) => `${k}=>$${i + 1}`).join(",")}) v`, Object.values(values));
  return result.rows[0]!.v;
}
beforeAll(async () => {
  db = new PGlite(); await db.exec(shim);
  expect(files).toContain(migration);
  for (const f of files.filter((f) => f < migration)) await db.exec(sql(f));
  for (const name of names) {
    await db.query(`insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)`, [id(name), `${name}@example.test`, name === "noConsent" ? {} : { consent_version: "2026-10-17" }]);
    await db.query(`update public.profiles set role=$2,status=$3 where user_id=$1`, [id(name), name.startsWith("owner") ? "owner" : "participant", name === "pending" || name === "ownerPending" ? "pending" : name === "suspended" || name === "ownerSuspended" ? "suspended" : "approved"]);
  }
  await insert("ar", { id: aid, attempt_no: 1, settings: { kvp: 110 }, finished_at: "2026-01-02T00:00:00Z" });
  await db.query(`insert into public.events(user_id,type,payload)values($1,'heartbeat','{"kept":"v1"}')`, [id("a")]);
  await db.query(`insert into public.feedback(user_id,exam_id,attempt_id,text,at) values($1,'x',$2,'ملاحظة تاريخية','2026-01-03')`, [id("a"), aid]);
  originalFunctions = (await functions()).rows;
  originalColumns = (await db.query<{ key: string }>(`select table_name||'.'||column_name key from information_schema.columns where table_schema='public' order by 1`)).rows.map((r) => r.key);
  originalData = (await db.query(`select id,definition_version,settings,result,locale,started_at,finished_at from public.attempts`)).rows as Record<string, unknown>[];
  for (const f of files.filter((f) => f >= migration)) await db.transaction(async (tx) => { await tx.exec(sql(f)); });
}, 30000);
afterAll(async () => { await db.close(); });

describe("full chain record contracts and seven-file upgrade", () => {
  it("adds only the declared columns, preserves v1 data and every legacy function except the compatible page projection, with exact ACLs", async () => {
    expect((await db.query(`select id,definition_version,settings,result,locale,started_at,finished_at from public.attempts`)).rows).toEqual(originalData);
    const columns = (await db.query<{ key: string; is_nullable: string }>(`select table_name||'.'||column_name key,is_nullable from information_schema.columns where table_schema='public' order by 1`)).rows;
    expect(columns.filter((r) => !originalColumns.includes(r.key)).map((r) => r.key).sort()).toEqual([...Object.entries(metadata).flatMap(([t, keys]) => keys.map((k) => `${t}.${k}`)), "pilot_locales.tag", "profiles.display_name", "attempts.comparison_version"].sort());
    // MY-ATTEMPTS-3 owner-approved exception: comparison identity stays nullable
    // for historical/old-client rows; all original record metadata stays NOT NULL.
    expect(columns.find((r) => r.key === "profiles.display_name")?.is_nullable).toBe("YES");
    expect(columns.find((r) => r.key === "attempts.comparison_version")?.is_nullable).toBe("YES");
    expect(columns.filter((r) => !originalColumns.includes(r.key) && r.key !== "profiles.display_name" && r.key !== "attempts.comparison_version").every((r) => r.is_nullable === "NO")).toBe(true);
    const current = (await functions()).rows;
    expect(current).toHaveLength(originalFunctions.length + 3);
    expect(current.filter((f) => !originalFunctions.some((old) => old.identity === f.identity)).map((f) => f.name).sort()).toEqual(["can_read_training", "training_page_v1", "training_page_v1_with_comparison"]);
    for (const old of originalFunctions) {
      const next = current.find((r) => r.identity === old.identity)!;
      if (old.name === "owner_page_v1" || old.name === "handle_new_user") {
        expect({ ...next, definition: old.definition }).toEqual(old);
        expect(next.definition).not.toBe(old.definition);
      } else expect(next).toEqual(old);
    }
    const a = (await db.query(`select * from public.attempts where id=$1`, [aid])).rows[0];
    expect(a).toMatchObject({ settings_format_version: 1, result_format_version: 1, mode: "practice", record_kind: "attempt", producer_version: "unknown", engine_version: "unknown", locale: "ar" });
    expect((await db.query(`select * from public.events`)).rows[0]).toMatchObject({ payload_format_version: 1, record_kind: "event", producer_version: "unknown", payload: { kept: "v1" } });
    expect((await db.query(`select * from public.feedback`)).rows[0]).toMatchObject({ note_format_version: 1, record_kind: "feedback", producer_version: "unknown", text: "ملاحظة تاريخية" });
  });

  it("keeps the locale registry private even from an approved owner, preserves inherited metadata grants and does not broaden roles", async () => {
    const owner = (await db.query<{ name: string }>("select current_user name")).rows[0]!.name;
    const registry = (await db.query<{ relrowsecurity: boolean; relacl: string }>(`select relrowsecurity,relacl::text from pg_class where oid='public.pilot_locales'::regclass`)).rows[0]!;
    expect(registry.relrowsecurity).toBe(true);
    expect(registry.relacl).toBe(`{${owner}=arwdDxtm/${owner}}`);
    const grants = (await db.query<{ table_name: string; column_name: string; grantee: string; privilege_type: string }>(`select table_name,column_name,grantee,privilege_type from information_schema.column_privileges where table_schema='public'`)).rows.filter((r) => r.table_name === "pilot_locales" || metadata[r.table_name]?.includes(r.column_name));
    expect(grants.every((g) => g.grantee === owner || (g.grantee === "authenticated" && g.table_name !== "pilot_locales" && ["SELECT", "INSERT"].includes(g.privilege_type)))).toBe(true);
    for (const [table, keys] of Object.entries(metadata)) for (const key of keys) expect(grants.filter((g) => g.table_name === table && g.column_name === key && g.grantee === "authenticated").map((g) => g.privilege_type).sort()).toEqual(["INSERT", "SELECT"]);
    for (const user of [null, ...names]) {
      await expect(as(user, () => db.query("select * from public.pilot_locales"))).rejects.toMatchObject({ code: "42501" });
      await expect(as(user, () => db.query("insert into public.pilot_locales values('fr')"))).rejects.toMatchObject({ code: "42501" });
      if (user !== "owner") for (const stream of ["participants", "attempts", "notes"] as const) await expect(as(user, () => page(stream))).rejects.toMatchObject({ code: "42501" });
    }
    for (const user of [null, "pending", "suspended", "noConsent", "ownerPending", "ownerSuspended"] as const) await expect(as(user, () => insert("en", { user_id: id(user ?? "a") }))).rejects.toMatchObject({ code: "42501" });
    await expect(as("b", () => insert())).rejects.toMatchObject({ code: "42501" });
    await expect(as("a", () => db.query(`update public.attempts set result_format_version=2 where id=$1`, [aid]))).rejects.toMatchObject({ code: "42501" });
    await expect(as("a", () => db.query(`delete from public.attempts where id=$1`, [aid]))).rejects.toMatchObject({ code: "42501" });
    // Descriptive metadata cannot make Assess or an unknown role usable.
    await expect(as("a", () => insert("en", { mode: "assess" }))).rejects.toMatchObject({ code: "23514" });
    await expect(db.query(`update public.profiles set role='instructor' where user_id=$1`, [id("a")])).rejects.toMatchObject({ code: "23514" });
  });

  it("supports an old writer's defaults and a new writer's explicit stamps, bounds contracts and retains append-only checks", async () => {
    const old = (await as("a", () => insert())).rows[0] as Record<string, unknown>;
    const fresh = (await as("a", () => insert("en", { settings_format_version: 1, result_format_version: 1, mode: "practice", record_kind: "attempt", producer_version: "radlab-pilot-writer/1", engine_version: "unknown" }))).rows[0] as Record<string, unknown>;
    expect(old).toMatchObject({ producer_version: "unknown", settings_format_version: 1, result_format_version: 1 });
    expect(fresh).toMatchObject({ producer_version: "radlab-pilot-writer/1", engine_version: "unknown" });
    for (const attrs of [{ settings_format_version: 0 }, { result_format_version: -1 }, { result_format_version: null }, { record_kind: "event" }, { engine_version: "" }, { producer_version: "x".repeat(101) }]) await expect(as("a", () => insert("en", attrs))).rejects.toMatchObject({ code: Object.hasOwn(attrs, "result_format_version") && attrs.result_format_version === null ? "23502" : "23514" });
    await expect(as("a", () => db.query(`insert into public.events(type,payload,payload_format_version)values('heartbeat','{}',0)`))).rejects.toMatchObject({ code: "23514" });
    await expect(as("a", () => db.query(`insert into public.feedback(exam_id,text,note_format_version)values('x','note',0)`))).rejects.toMatchObject({ code: "23514" });
    await expect(as("a", () => insert("en", { settings: [] }))).rejects.toMatchObject({ code: "23514" });
    await db.query("delete from public.attempts where id=any($1::uuid[])", [[old.id, fresh.id]]);
  });

  it("uses an exact configured locale FK without coercion, no schema edit or public configuration grants", async () => {
    await expect(as("a", () => insert("fr"))).rejects.toMatchObject({ code: "23503" });
    for (const tag of ["en_US", "<script>", "EN", "x".repeat(64)]) await expect(db.query(`insert into public.pilot_locales values($1)`, [tag])).rejects.toMatchObject({ code: "23514" });
    await db.exec("insert into public.pilot_locales(tag) values('fr-CA')");
    const stored = (await as("a", () => insert("fr-CA"))).rows[0] as Record<string, unknown>;
    expect(stored.locale).toBe("fr-CA");
    await expect(as("a", () => insert("fr-ca"))).rejects.toMatchObject({ code: "23503" });
    const read = await as("owner", () => page("attempts", { p_export: true }));
    expect(read.record_contract_version).toBe(1);
    expect(read.rows.find((r) => r.id === stored.id)).toMatchObject({ locale: "fr-CA", locale_registered: true, engine_version: "unknown" });
    expect(read.rows.every((r) => !Object.hasOwn(r, "user_id") && !Object.hasOwn(r, "email") && !Object.hasOwn(r, "device"))).toBe(true);
    await db.query("delete from public.attempts where id=$1", [stored.id]);
    await db.exec("delete from public.pilot_locales where tag='fr-CA'");
  });

  it("fails the v1 RPC visibly at an unknown version for old as well as new clients, preserving counts and cursor limits", async () => {
    const future = (await as("a", () => insert("en", { result_format_version: 2 }))).rows[0] as Record<string, unknown>;
    const first = await as("owner", () => page("attempts", { p_limit: 1, p_export: true }));
    expect(first.rows).toHaveLength(1); expect(first.total).toBe(2); expect(first.next).not.toBeNull();
    expect(first.rows[0]).toMatchObject({ result_format_version: 1, id: aid });
    await expect(as("owner", () => page("attempts", { p_cursor: first.next, p_boundary: first.boundary, p_limit: 1, p_export: true }))).rejects.toMatchObject({ code: "22023" });
    await db.query("delete from public.attempts where id=$1", [future.id]);
    const note = (await db.query<{ id: string }>(`insert into public.feedback(user_id,exam_id,text,note_format_version) values($1,'x','future',2) returning id::text`, [id("a")])).rows[0]!;
    await expect(as("owner", () => page("notes", { p_export: true }))).rejects.toMatchObject({ code: "22023" });
    await db.query("delete from public.feedback where id=$1", [note.id]);
    expect((await as("owner", () => page("notes", { p_export: true }))).rows[0]).toMatchObject({ note_format_version: 1, attempt_no: 1, text: "ملاحظة تاريخية" });
  });

  it("keeps auth erasure cascading through the versioned attempt, event and linked note", async () => {
    await db.exec(`insert into auth.users(id,email)values('00000000-0000-0000-0000-000000000099','erasure@example.test')`);
    const user = "00000000-0000-0000-0000-000000000099";
    const a = (await insert("en", { user_id: user })).rows[0] as Record<string, unknown>;
    await db.query(`insert into public.events(user_id,type)values($1,'heartbeat')`, [user]);
    await db.query(`insert into public.feedback(user_id,exam_id,attempt_id,text)values($1,'x',$2,'erase synthetic')`, [user, a.id]);
    await db.query(`delete from auth.users where id=$1`, [user]);
    for (const table of ["profiles", "attempts", "events", "feedback"]) expect((await db.query(`select 1 from public.${table} where user_id=$1`, [user])).rows).toEqual([]);
  });
  it("rolls back an interrupted eighth migration without losing the old locale CHECK, RPC or rows", async () => {
    const scratch = new PGlite();
    try {
      await scratch.exec(shim);
      for (const f of files.filter((f) => f < migration)) await scratch.exec(sql(f));
      const before = (await scratch.query(`select pg_get_functiondef(oid) definition,proacl::text acl from pg_proc where proname='owner_page_v1'`)).rows;
      await expect(scratch.transaction(async (tx) => {
        await tx.exec(sql(migration));
        await tx.exec("select * from public.deliberately_missing_contract_dependency");
      })).rejects.toMatchObject({ code: "42P01" });
      expect((await scratch.query(`select to_regclass('public.pilot_locales') name`)).rows[0]).toEqual({ name: null });
      expect((await scratch.query(`select 1 from information_schema.columns where table_schema='public' and column_name='settings_format_version'`)).rows).toEqual([]);
      expect((await scratch.query(`select conname from pg_constraint where conrelid='public.attempts'::regclass and conname='attempts_locale_check'`)).rows).toHaveLength(1);
      expect((await scratch.query(`select pg_get_functiondef(oid) definition,proacl::text acl from pg_proc where proname='owner_page_v1'`)).rows).toEqual(before);
      await scratch.transaction(async (tx) => { await tx.exec(sql(migration)); });
      expect((await scratch.query(`select tag from public.pilot_locales order by tag`)).rows).toEqual([{ tag: "ar" }, { tag: "en" }]);
    } finally { await scratch.close(); }
  }, 30000);

});
