import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";
import { getCase } from "@/data/cases";
import { evaluate } from "@/features/evaluation/engine";
import { evaluationComparison } from "@/features/evaluation/version";
import { buildAttemptRow, definitionVersion, compactResult } from "@/features/pilot/attempt-record";
import { parseTrainingPage, comparableAttempts, type TrainingAttempt } from "@/features/pilot/training";

it("inspects catalogue and bounded aggregate reset scope locally without changing any stored row", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    const dir = join(process.cwd(), "supabase/migrations");
    const readiness = readFileSync("supabase/checks/comparison-ready.sql", "utf8");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      if (file === "20261020000500_practice_comparison.sql") {
        await expect(db.exec(readiness)).rejects.toMatchObject({code:"55000"});
        await db.exec("rollback");
      }
      await db.exec(readFileSync(join(dir, file), "utf8"));
    }
    await db.exec(readFileSync("supabase/checks/training-ready.sql", "utf8"));
    await db.exec(readiness);
    await db.exec(`insert into auth.users values('00000000-0000-0000-0000-000000000001','synthetic@example.test',now(),'{}');
      insert into attempts(id,user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale)
      values('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',1,'synthetic','default','original','{}','{}','ar');
      insert into feedback(user_id,exam_id,attempt_id,text) values('00000000-0000-0000-0000-000000000001','synthetic','10000000-0000-0000-0000-000000000001','synthetic private note');
      insert into events(user_id,type,payload) values('00000000-0000-0000-0000-000000000001','attempt_submitted','{"attempt_id":"10000000-0000-0000-0000-000000000001"}');`);
    const snapshot = async () => (await db.query(`select row from (select to_jsonb(a) row from attempts a union all select to_jsonb(f) from feedback f
      union all select to_jsonb(e) from events e union all select to_jsonb(p) from profiles p) q order by row::text`)).rows;
    const before = await snapshot();
    expect((await db.query("select comparison_version from attempts")).rows).toEqual([{comparison_version:null}]);
    const script = readFileSync(join(process.cwd(), "supabase/checks/practice-reset-inspect.sql"), "utf8");
    for (const [scope, expected] of [["unset",0],["all-practice",1],["selected",0]] as const) {
      const output = await db.exec(script.replaceAll("'unset'::text", `'${scope}'::text`));
      const counts = output.flatMap((r) => r.rows).find((r) => Object.hasOwn(r as object, "cascading_feedback"));
      expect(counts).toMatchObject({ scope, attempts: expected, cascading_feedback: expected, linked_events_retained_by_default: expected, event_owner_mismatches: 0 });
      expect(await snapshot()).toEqual(before);
      expect(JSON.stringify(output)).not.toContain("synthetic private note");
      expect(JSON.stringify(output)).not.toContain("synthetic@example.test");
    }
    // Real evaluator/writer -> authenticated insert -> enriched SQL -> parser/selector.
    const original = structuredClone(getCase("chest-pa-erect")!);
    const copy = structuredClone(original);
    copy.title = { en: "Synthetic title", ar: "عنوان اصطناعي" };
    copy.rules[0]!.feedback.pass = { en: "Synthetic feedback", ar: "رسالة اصطناعية" };
    const changed = structuredClone(copy); changed.scoring.passThreshold += 1;
    await db.exec("update profiles set status='approved',consent_version='2026-10-18',consented_at=now()");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", ["00000000-0000-0000-0000-000000000001"]);
    await db.exec("set role authenticated");
    const rows: ReturnType<typeof buildAttemptRow>[] = [];
    for (const [i,c] of [original,copy,changed].entries()) {
      const result = evaluate(c,c.initialSettings);
      await evaluationComparison(result);
      const row = buildAttemptRow({ id: `20000000-0000-0000-0000-00000000000${i}`,radCase:c,version:await definitionVersion(c),
        attemptNo:i+1,settings:c.initialSettings,result,locale:"ar",device:{w:390,h:844,touch:true},startedAt:new Date(0),finishedAt:new Date(1000+i) });
      expect(row.result).toEqual(compactResult(result));
      rows.push(row);
      await db.query(`insert into attempts(id,attempt_no,exam_id,case_id,definition_version,comparison_version,settings,result,locale,finished_at,engine_version,producer_version)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [row.id,row.attempt_no,row.exam_id,row.case_id,row.definition_version,row.comparison_version,JSON.stringify(row.settings),JSON.stringify(row.result),row.locale,row.finished_at,row.engine_version,row.producer_version]);
    }
    expect(rows[0]!.definition_version).not.toBe(rows[1]!.definition_version);
    expect(rows[0]!.comparison_version).toBe(rows[1]!.comparison_version);
    expect(rows[0]!.comparison_version).not.toBe(rows[2]!.comparison_version);
    expect(rows[0]!.result).toEqual(rows[1]!.result);
    const rpc = async (who: string | null = null) => (await db.query<{ page: unknown }>(
      "select training_page_v1_with_comparison('history','own',$1,$2) page",[who,rows[0]!.exam_id])).rows[0]!.page;
    const history = parseTrainingPage(await rpc(),"history").rows as TrainingAttempt[];
    expect(history).toHaveLength(3);
    expect(comparableAttempts(history)).toHaveLength(1); // New rules stay separate.
    const copies = history.filter((r) => r.id !== rows[2]!.id);
    expect(comparableAttempts(copies)).toHaveLength(2);
    expect(comparableAttempts(copies).map((r) => r.result.total)).toEqual(rows.slice(0,2).map((r) => r.result.total));
    expect(comparableAttempts([copies[0]!,{...copies[1]!,comparison:null}])).toHaveLength(1);
    const future = {...copies[0]!,comparison:`radlab-comparison/2:${"a".repeat(64)}`};
    expect(parseTrainingPage({version:1,boundary:history[0]!.time,summary:null,rows:[future],next:null},"history").rows).toEqual([future]);
    expect(comparableAttempts([future])).toEqual([]);
    await expect(rpc("00000000-0000-0000-0000-000000000002")).rejects.toMatchObject({code:"42501"});
    await expect(db.query("update attempts set comparison_version=null")).rejects.toMatchObject({code:"42501"});
    await expect(db.query("delete from attempts")).rejects.toMatchObject({code:"42501"});
    await db.exec("reset role");
    await expect(db.query("update attempts set comparison_version='unversioned'")).rejects.toMatchObject({code:"23514"});
    await db.exec("set role anon");
    await expect(rpc()).rejects.toMatchObject({code:"42501"});
  } finally { await db.close(); }
},30000);
