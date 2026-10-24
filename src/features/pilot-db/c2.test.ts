// Real migration chain; only provider Auth is shimmed. Fixtures only.
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { C2_CHECK, C2_CONSTRAINTS, C2_FUNCTIONS, C2_INDEXES, C2_MIGRATION, C2_TABLE_COLUMNS } from "../pilot/c2-contract";
let db: PGlite;
const uid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
type Obj = Record<string, unknown>;
async function as<T>(n: number | null, work: () => Promise<T>): Promise<T> {
 await db.exec(`reset role;set role ${n === null ? "anon" : "authenticated"}`);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)", [n === null ? "" : uid(n)]);
 try { return await work(); } finally { await db.exec("reset role"); }
}
async function rpc(name: string, values: unknown[] = []): Promise<Obj> {
 const r = await db.query<{v: Obj}>(`select public.${name}(${values.map((_, i) => `$${i+1}`).join(",")}) v`, values);
 return r.rows[0]!.v;
}
const deletion = (action: string, n: number | null = null, after: string | null = null, limit = 20) => as(1, () => rpc("owner_account_deletion_v1", [action, n === null ? null : uid(n), after, limit]));
const ownerSurvey = (action: string, data: Obj = {}, after: string | null = null, limit = 20) => as(1, () => rpc("owner_surveys_v1", [action, JSON.stringify(data), after, limit]));
async function survey(n: number, answers: Obj | null = null) {
 const id = answers === null ? null : (await db.query<{id: string}>("select id from c2_survey_responses where user_id=$1 and state='pending'", [uid(n)])).rows[0]?.id;
 return as(n, () => rpc("participant_survey_v1", [answers === null ? null : JSON.stringify({id, answers})]));
}
async function open(type = "General") {
 const v = (await db.query<{id: string}>("select id from c2_survey_versions where survey_type=$1 and version=1", [type])).rows[0]!.id;
 return (await ownerSurvey("open_round", {version_id: v})).id as string;
}
async function attempts(n: number, count: number) {
 await db.query(`insert into attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale)
 select $1,i,'fixture','default','fixture','{}','{}','en' from generate_series(1,$2::int) i`, [uid(n), count]);
}
const general = {rating: 4, liked: "Synthetic liked", improve: "Synthetic improvement"};
beforeAll(async () => {
 db = new PGlite();
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb,banned_until timestamptz);
 create table auth.sessions(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete cascade);
 create table auth.refresh_tokens(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete cascade);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for (const file of readdirSync("supabase/migrations").filter(f => f.endsWith(".sql")).sort()) await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
}, 30000);
beforeEach(async () => {
 await db.exec("reset role;truncate auth.users cascade;delete from c2_survey_rounds;update c2_survey_settings set gap_days=7;");
 for (let n = 1; n <= 5; n++) await db.query(`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),'{"consent_version":"2026-10-17","display_name":"Synthetic fixture"}')`, [uid(n), `fixture${n}@example.test`]);
 await db.exec("update profiles set status='approved',created_at=(select activated_at-interval '1 day' from c2_survey_settings)");
 await db.query("update profiles set role='owner' where user_id=any($1::uuid[])", [[uid(1), uid(2)]]);
 await db.query("update profiles set created_at=(select activated_at from c2_survey_settings) where user_id=$1", [uid(4)]);
});
afterAll(async () => { await db?.close(); });

describe("C2 deletion, owner-only with existing cascades", () => {
 it("refuses anon, nonowner, suspended owner, self, last owner and malformed calls", async () => {
  for (const n of [null, 3]) {
   for (const [name,args] of [["owner_account_deletion_v1", ["deactivate", uid(4)]], ["owner_account_directory_v1", []], ["owner_surveys_v1", ["answers"]]] as const)
    await expect(as(n, () => rpc(name, [...args]))).rejects.toMatchObject({code: "42501"});
  }
  await expect(deletion("deactivate", 1)).rejects.toThrow(/yourself/);
  await db.query("update profiles set status='suspended' where user_id=$1", [uid(2)]);
  await expect(as(2, () => rpc("owner_account_deletion_v1", ["deactivate", uid(3)]))).rejects.toMatchObject({code: "42501"});
  await expect(deletion("deactivate", 1)).rejects.toThrow(/last owner/);
  await expect(deletion("unknown", 3)).rejects.toMatchObject({code: "22023"});
  await expect(deletion("deactivate", 99)).rejects.toThrow(/not found/);
 });
 it("restores another owner even while only the caller remains active, and can finalise that expired secondary owner", async () => {
  await deletion("deactivate", 2);
  expect(await deletion("restore", 2)).toEqual({processed: 1});
  await deletion("deactivate", 2);
  await db.query("update c2_account_deletions set requested_at=now()-interval '31 days' where user_id=$1", [uid(2)]);
  expect(await deletion("finalise")).toEqual({processed: 1});
  expect((await db.query("select 1 from auth.users where id=$1", [uid(1)])).rows).toHaveLength(1);
 });
 it("deactivates, revokes sessions, hides from C2 directory, lists days and restores the original state and ban", async () => {
  const ban = "2026-01-01T00:00:00.000Z";
  await db.query("update auth.users set banned_until=$2 where id=$1", [uid(3), ban]);
  await db.query("insert into auth.sessions(user_id) values($1);", [uid(3)]);
  await db.query("insert into auth.refresh_tokens(user_id) values($1)", [uid(3)]);
  await attempts(3, 1);
  expect(await deletion("deactivate", 3)).toMatchObject({processed: 1});
  expect((await db.query("select status from profiles where user_id=$1", [uid(3)])).rows).toEqual([{status: "suspended"}]);
  expect((await db.query<{b: boolean}>("select banned_until>now()+interval '30 days' b from auth.users where id=$1", [uid(3)])).rows[0]!.b).toBe(true);
  for (const table of ["sessions", "refresh_tokens"]) expect((await db.query(`select * from auth.${table} where user_id=$1`, [uid(3)])).rows).toEqual([]);
  await expect(survey(3)).rejects.toMatchObject({code: "42501"});
  await expect(as(3, () => db.query("insert into events(user_id,type) values($1,'heartbeat')", [uid(3)]))).rejects.toMatchObject({code: "42501"});
  const directory = await as(1, () => rpc("owner_account_directory_v1"));
  expect((directory.rows as Obj[]).some(r => r.user_id === uid(3))).toBe(false);
  expect(directory.counts).toMatchObject({approved: 4, suspended: 0});
  expect((await deletion("list")).rows).toMatchObject([{user_id: uid(3), status: "pending deletion", days_left: 30}]);
  await expect(deletion("deactivate", 3)).rejects.toThrow(/already pending/);
  expect(await deletion("finalise")).toMatchObject({processed: 0});
  expect(await deletion("restore", 3)).toMatchObject({processed: 1});
  expect((await db.query<{b: Date}>("select banned_until b from auth.users where id=$1", [uid(3)])).rows[0]!.b.toISOString()).toBe(ban);
  expect((await db.query("select status from profiles where user_id=$1", [uid(3)])).rows[0]).toEqual({status: "approved"});
  expect((await deletion("list")).rows).toEqual([]);
  expect((await db.query("select 1 from attempts where user_id=$1", [uid(3)])).rows).toHaveLength(1);
 });
 it("finalises after 30 days with no auth/profile/attempt/note/event/survey/queue remnants and preserves the other participant", async () => {
  await open(); await survey(3); await survey(3, general); await survey(5);
  await attempts(3, 2); await attempts(5, 1);
  await db.query("insert into feedback(user_id,exam_id,attempt_id,text) select $1,'fixture',id,'Synthetic note' from attempts where user_id=$1 limit 1", [uid(3)]);
  await db.query("insert into events(user_id,type) values($1,'heartbeat'),($2,'heartbeat')", [uid(3), uid(5)]);
  await deletion("deactivate", 3);
  await db.query("update c2_account_deletions set requested_at=now()-interval '30 days' where user_id=$1", [uid(3)]);
  await expect(deletion("restore", 3)).rejects.toThrow(/expired/);
  expect(await deletion("finalise")).toMatchObject({processed: 1});
  expect((await db.query("select * from auth.users where id=$1", [uid(3)])).rows).toEqual([]);
  for (const table of ["profiles", "attempts", "feedback", "events", "c2_survey_responses", "c2_account_deletions"]) {
   expect((await db.query(`select 1 from public.${table} where user_id=$1`, [uid(3)])).rows, table).toEqual([]);
  }
  expect((await db.query("select 1 from attempts where user_id=$1", [uid(5)])).rows).toHaveLength(1);
  expect((await db.query("select 1 from c2_survey_responses where user_id=$1", [uid(5)])).rows).toHaveLength(1);
  expect(await deletion("finalise")).toEqual({processed: 0});
 });
 it("rolls back a failed cascade atomically and leaves expired requests for a later owner call", async () => {
  await attempts(3, 1); await deletion("deactivate", 3);
  await db.query("update c2_account_deletions set requested_at=now()-interval '31 days' where user_id=$1", [uid(3)]);
  await db.exec(`create function auth.c2_fixture_failure() returns trigger language plpgsql as $$begin raise exception 'fixture cascade failure';end$$;
   create trigger c2_fixture_failure before delete on public.attempts for each row execute function auth.c2_fixture_failure();`);
  try {
   await expect(deletion("finalise")).rejects.toThrow(/fixture cascade failure/);
   for (const table of ["profiles", "attempts", "c2_account_deletions"]) expect((await db.query(`select 1 from public.${table} where user_id=$1`, [uid(3)])).rows).toHaveLength(1);
   expect((await db.query("select 1 from auth.users where id=$1", [uid(3)])).rows).toHaveLength(1);
  } finally { await db.exec("drop trigger c2_fixture_failure on public.attempts;drop function auth.c2_fixture_failure()"); }
  expect(await deletion("finalise")).toEqual({processed: 1});
 });
 it("bounds directory and deletion-list pages with stable cursors and preserves suspended restores", async () => {
  for (const n of [3, 4, 5]) await deletion("deactivate", n);
  const first = await deletion("list", null, null, 2);
  expect(first.rows).toHaveLength(2); expect(first.next).toBe(uid(4));
  const last = await deletion("list", null, first.next as string, 2);
  expect(last.rows).toMatchObject([{user_id: uid(5)}]); expect(last.next).toBeNull();
  await db.query("update c2_account_deletions set restore_status='suspended' where user_id=$1", [uid(3)]);
  await deletion("restore", 3);
  expect((await db.query("select status from profiles where user_id=$1", [uid(3)])).rows[0]).toEqual({status: "suspended"});
  const page = await as(1, () => rpc("owner_account_directory_v1", ["", "", null, null, 1]));
  expect(page.rows).toHaveLength(1); expect(page.next).not.toBeNull();
  const next = await as(1, () => rpc("owner_account_directory_v1", ["", "", JSON.stringify(page.next), page.boundary, 1]));
  expect(next.rows).toHaveLength(1); expect(next.rows).not.toEqual(page.rows);
 });
});

describe("C2 versioned survey rounds", () => {
 it("offers immediately to existing users and exactly after the fifth saved practice attempt to new users", async () => {
  await open(); expect((await survey(3)).pending).toBeTruthy();
  expect((await survey(4)).pending).toBeNull();
  await attempts(4, 4); expect((await survey(4)).pending).toBeNull();
  await attempts(4, 1); expect((await survey(4)).pending).toMatchObject({survey_type: "General", version: 1});
 });
 it("keeps one pending survey across open rounds and atomically forbids a second pending row", async () => {
  await open("SUS"); const round2 = await open();
  const first = await survey(3); expect(await survey(3)).toEqual(first);
  await expect(db.query("insert into c2_survey_responses(user_id,round_id) values($1,$2)", [uid(3), round2])).rejects.toMatchObject({code: "23505"});
  expect((await db.query("select * from c2_survey_responses where user_id=$1", [uid(3)])).rows).toHaveLength(1);
 });
 it("enforces the seven-day gap from answer as well as offer, and the owner-configured longer gap", async () => {
  await open(); await survey(3); await survey(3, general); await open("SUS");
  expect((await survey(3)).pending).toBeNull();
  await db.query("update c2_survey_responses set offered_at=now()-interval '8 days' where user_id=$1", [uid(3)]);
  expect((await survey(3)).pending).toBeNull();
  await db.query("update c2_survey_responses set answered_at=now()-interval '7 days' where user_id=$1", [uid(3)]);
  await expect(ownerSurvey("set_gap", {days: 6})).rejects.toMatchObject({code: "23514"});
  await ownerSurvey("set_gap", {days: 14}); expect((await survey(3)).pending).toBeNull();
  await ownerSurvey("set_gap", {days: 7}); expect((await survey(3)).pending).toMatchObject({survey_type: "SUS"});
 });
 it("closes rounds, cancels outstanding cards and refuses answers after closure", async () => {
  const round = await open(); await survey(3);
  await ownerSurvey("close_round", {id: round});
  await expect(survey(3, general)).rejects.toThrow(/pending survey required/);
  expect((await survey(3)).pending).toBeNull();
  expect((await db.query("select state from c2_survey_responses where user_id=$1", [uid(3)])).rows).toEqual([{state: "cancelled"}]);
  expect((await ownerSurvey("rounds")).rows).toMatchObject([{id: round, pending: 0, answered: 0}]);
  await expect(ownerSurvey("close_round", {id: round})).rejects.toThrow(/open round/);
 });
 it("validates answers, keeps answers owner-only and projects CSV-ready participant codes without account identity", async () => {
  const round = await open(); await survey(3);
  for (const bad of [{...general, rating: 6}, {...general, rating: 1.5}, {...general, rating: null}, {...general, liked: ""}, {...general, improve: "x".repeat(1001)}, {...general, extra: true}])
   await expect(survey(3, bad)).rejects.toMatchObject({code: "22023"});
  expect(await survey(3, general)).toEqual({answered: true});
  await expect(survey(3, general)).rejects.toThrow(/pending survey required/);
  for (const n of [null, 3, 5]) {
   await expect(as(n, () => rpc("owner_surveys_v1", ["answers"]))).rejects.toMatchObject({code: "42501"});
   await expect(as(n, () => db.query("select * from c2_survey_responses"))).rejects.toMatchObject({code: "42501"});
  }
  const result = await ownerSurvey("answers", {round_id: round});
  expect(result.rows).toMatchObject([{survey_type: "General", answers: general, score: null}]);
  const row = (result.rows as Obj[])[0]!;
  expect(Object.keys(row).sort()).toEqual(["id", "participant_code", "round_id", "survey_type", "version", "answered_at", "answers", "score"].sort());
  expect(JSON.stringify(result)).not.toContain(uid(3)); expect(JSON.stringify(result)).not.toContain("@example.test"); expect(JSON.stringify(result)).not.toContain("Synthetic fixture");
  expect(row.participant_code).toBe((await db.query<{participant_code: string}>("select participant_code from profiles where user_id=$1", [uid(3)])).rows[0]!.participant_code);
 });
 it("uses the ten standard English SUS items, attribution and standard scores 0, 50 and 100", async () => {
  await open("SUS");
  for (const [n, wanted] of [[3, 0], [4, 50], [5, 100]]) {
   await db.query("update profiles set created_at=(select activated_at-interval '1 day' from c2_survey_settings) where user_id=$1", [uid(n!)]);
   const pending = (await survey(n!)).pending as Obj;
   const def = pending.definition as Obj;
   expect(def.locale).toBe("en"); expect(def).not.toHaveProperty("ar"); expect(def.citation).toContain("Brooke");
   expect(def.questions).toHaveLength(10);
   const answers = Object.fromEntries(Array.from({length: 10}, (_, i) => [`q${i+1}`, wanted === 50 ? 3 : i%2 === 0 ? (wanted === 100 ? 5 : 1) : (wanted === 100 ? 1 : 5)]));
   await survey(n!, answers);
   expect((await db.query<{score: string}>("select score::text score from c2_survey_responses where user_id=$1", [uid(n!)])).rows[0]!.score).toBe(String(wanted)+".0");
  }
 });
 it("binds a submission to its offered response and rejects stale/cross-user response ids", async () => {
  await open(); const pending = (await survey(3)).pending as Obj; const other = (await survey(5)).pending as Obj;
  for (const id of [other.id, uid(99)]) await expect(as(3, () => rpc("participant_survey_v1", [JSON.stringify({id, answers: general})]))).rejects.toThrow(/mismatch/);
  expect(await as(3, () => rpc("participant_survey_v1", [JSON.stringify({id: pending.id, answers: general})]))).toEqual({answered: true});
 });
 it("adds future types as immutable versioned data and rejects malformed questions and unverified SUS wording", async () => {
  const def = {locale: "en", scoring: "none", questions: [{id: "comment", kind: "text", optional: false, label: "Synthetic future question"}]};
  const created = await ownerSurvey("create_version", {survey_type: "Future", version: 1, definition: def});
  await expect(ownerSurvey("create_version", {survey_type: "Future", version: 1, definition: def})).rejects.toMatchObject({code: "23505"});
  for (const bad of [{...def, questions: []}, {...def, questions: Array(11).fill(def.questions[0])}, {...def, questions: [def.questions[0], def.questions[0]]}, {...def, questions: [{...def.questions[0], kind: "unknown"}]}])
   await expect(ownerSurvey("create_version", {survey_type: "Future", version: 2, definition: bad})).rejects.toMatchObject({code: "22023"});
  await expect(ownerSurvey("create_version", {survey_type: "SUS", version: 2, definition: {...def, locale: "ar"}})).rejects.toMatchObject({code: "22023"});
  await ownerSurvey("open_round", {version_id: created.id});
  expect((await survey(3)).pending).toMatchObject({survey_type: "Future", definition: def});
  expect(await survey(3, {comment: "Synthetic answer"})).toEqual({answered: true});
  await expect(as(3, () => db.query("update c2_survey_versions set definition='{}'"))).rejects.toMatchObject({code: "42501"});
 });
});

it("matches the exact additive inventory, ACLs, RLS, indexes and read-only readiness without changing existing objects", async () => {
 const tables = Object.keys(C2_TABLE_COLUMNS);
 const actualColumns = (await db.query<{table_name: string; column_name: string; is_nullable: string}>("select table_name,column_name,is_nullable from information_schema.columns where table_schema='public' and table_name=any($1::text[]) order by table_name,ordinal_position", [tables])).rows;
 expect(Object.fromEntries(tables.map(t => [t, actualColumns.filter(c => c.table_name === t).map(c => c.column_name)]))).toEqual(C2_TABLE_COLUMNS);
 expect(actualColumns.every(c => c.is_nullable === "NO")).toBe(true);
 const constraints = (await db.query<{name: string}>("select conrelid::regclass::text||'.'||conname name from pg_constraint where connamespace='public'::regnamespace and conrelid::regclass::text=any($1::text[])", [tables])).rows.map(r => r.name).sort();
 expect(constraints).toEqual([...C2_CONSTRAINTS].sort());
 const indexes = (await db.query<{indexname: string}>("select indexname from pg_indexes where schemaname='public' and tablename=any($1::text[])", [tables])).rows.map(r => r.indexname).sort();
 expect(indexes).toEqual([...C2_INDEXES].sort());
 const fns = (await db.query<{name: string; definer: boolean; config: string[]; acl: string}>("select proname name,prosecdef definer,proconfig config,proacl::text acl from pg_proc where proname=any($1::text[]) order by proname", [[...C2_FUNCTIONS]])).rows;
 expect(fns.map(f => f.name)).toEqual([...C2_FUNCTIONS].sort()); expect(fns.every(f => f.definer && f.config.includes('search_path=""'))).toBe(true);
 for (const t of tables) await expect(as(1, () => db.query(`select * from public.${t}`))).rejects.toMatchObject({code: "42501"});
 const before = (await db.query("select to_jsonb(s) s from c2_survey_settings s")).rows;
 const checked = await db.exec(readFileSync(C2_CHECK, "utf8"));
 const flags = checked.flatMap(r => r.rows ?? []).find(r => r.contract === "owner-deletion-surveys-ready/1")!;
 expect(flags).toBeTruthy(); expect(Object.entries(flags).filter(([k]) => k !== "contract").every(([,v]) => v === true)).toBe(true);
 expect((await db.query("select to_jsonb(s) s from c2_survey_settings s")).rows).toEqual(before);
 // Compare all pre-existing function definitions/ACLs, tables, constraints, indexes,
 // grants and policies before/after ONLY C2, against a fresh synthetic chain.
 const scratch = new PGlite();
 try {
  await scratch.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  for (const f of readdirSync("supabase/migrations").filter(f => f.endsWith(".sql") && f < C2_MIGRATION).sort()) await scratch.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  const state = async () => ({
   functions: (await scratch.query<{oid: number; definition: string; proacl: string | null}>("select p.oid,pg_get_functiondef(p.oid) definition,p.proacl::text from pg_proc p where p.pronamespace in ('public'::regnamespace,'assess'::regnamespace) order by p.oid")).rows,
   tables: (await scratch.query<{oid: number; relname: string; relrowsecurity: boolean; relacl: string | null}>("select oid,relname,relrowsecurity,relacl::text from pg_class where relnamespace in ('public'::regnamespace,'assess'::regnamespace) and relkind in ('r','S','i') order by oid")).rows,
   constraints: (await scratch.query<{oid: number; conrelid: number; conname: string; definition: string}>("select oid,conrelid,conname,pg_get_constraintdef(oid) definition from pg_constraint where connamespace in ('public'::regnamespace,'assess'::regnamespace) order by oid")).rows,
   policies: (await scratch.query("select * from pg_policies order by schemaname,tablename,policyname")).rows,
  });
  const prev = await state();
  await scratch.exec(readFileSync(`supabase/migrations/${C2_MIGRATION}`, "utf8"));
  const next = await state();
  for (const key of ["functions", "tables", "constraints"] as const) expect(next[key].filter(r => prev[key].some(old => old.oid === r.oid))).toEqual(prev[key]);
  expect(next.policies).toEqual(prev.policies);
 } finally { await scratch.close(); }
}, 30000);
