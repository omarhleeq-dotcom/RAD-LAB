import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

const migration = "20261020000600_assess_assignments.sql";
const dir = join(process.cwd(), "supabase/migrations");
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;

it("isolates Assess groups/targets, freezes publication expansion and preserves every public object", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
    for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql") && f<migration).sort()) await db.exec(readFileSync(join(dir, f), "utf8"));
    for (let i=1; i<=6; i++) await db.query("insert into auth.users values($1,$2,now(),$3)", [id(i), `person${i}@example.test`, JSON.stringify({ display_name: "Same Name" })]);
    await db.exec(`update profiles set status='approved';update profiles set role='owner' where user_id in ('${id(1)}','${id(2)}');
      update profiles set status='pending' where user_id='${id(5)}';update profiles set status='suspended' where user_id='${id(6)}';
      insert into attempts(user_id,attempt_no,exam_id,case_id,definition_version,settings,result,locale)
      values('${id(3)}',1,'frozen','default','unchanged','{"kvp":90}','{"total":70}','en');`);
    const publicState = async () => ({
      data: (await db.query("select to_jsonb(p) row from profiles p union all select to_jsonb(a) from attempts a")).rows,
      functions: (await db.query("select oid::regprocedure::text id,pg_get_functiondef(oid) def,proacl::text acl from pg_proc where pronamespace='public'::regnamespace order by 1")).rows,
      policies: (await db.query("select * from pg_policies where schemaname='public' order by tablename,policyname")).rows,
      grants: (await db.query("select * from information_schema.column_privileges where table_schema='public' order by table_name,column_name,grantee,privilege_type")).rows,
      columns: (await db.query("select table_name,column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position")).rows,
    });
    const before = await publicState();
    await db.transaction(async (tx) => { await tx.exec(readFileSync(join(dir,migration),"utf8")); });
    expect(await publicState()).toEqual(before);
    const as = async <T,>(who: number | null, work: () => Promise<T>) => {
      await db.exec(`set role ${who===null ? "anon" : "authenticated"}`);
      await db.query("select set_config('request.jwt.claim.sub',$1,false)",[who===null ? "" : id(who)]);
      try { return await work(); } finally { await db.exec("reset role"); }
    };
    const call = async <T,>(fn: string, args: unknown[] = []) => (await db.query<{ v: T }>(`select assess.${fn}(${args.map((_,i)=>`$${i+1}`).join(",")}) v`,args)).rows[0]!.v;
    const createGroup = (name: string) => call<string>("group_write_v1",[null,name,false]);
    const page = (kind: string, context: string | null=null, after: string | null=null, limit=20, search="") => call<{rows: Record<string,unknown>[]; next: string|null}>("owner_page_v1",[kind,context,search,after,limit]);
    const denied = {code:"42501"};
    for (const who of [null,3,4,5,6]) {
      await expect(as(who,()=>createGroup("forbidden"))).rejects.toMatchObject(denied);
      await expect(as(who,()=>page("people"))).rejects.toMatchObject(denied);
      await expect(as(who,()=>call("members_write_v1",[id(99),[id(3)],true]))).rejects.toMatchObject(denied);
      await expect(as(who,()=>call("assign_v1",[id(99),[id(3)],[]]))).rejects.toMatchObject(denied);
      await expect(as(who,()=>call("targets_write_v1",[id(99),1,[id(3)],false]))).rejects.toMatchObject(denied);
    }
    const g1=await as(1,()=>createGroup("Group A")), g2=await as(1,()=>createGroup("Group B")), foreign=await as(2,()=>createGroup("Owner 2"));
    await expect(as(1,()=>call("members_write_v1",[foreign,[id(3)],true]))).rejects.toMatchObject(denied);
    await expect(as(2,()=>page("members",g1))).rejects.toMatchObject(denied);
    await expect(as(2,()=>call("group_write_v1",[g1,"forged",false]))).rejects.toMatchObject(denied);
    await as(1,()=>call("members_write_v1",[g1,[id(3),id(3),id(5)],true]));
    await as(1,()=>call("members_write_v1",[g2,[id(3),id(4)],true]));
    expect((await as(1,()=>page("members",g1))).rows.map(r=>r.id)).toEqual([id(3),id(5)]);
    await expect(as(1,()=>call("members_write_v1",[g1,[id(4),id(99)],true]))).rejects.toMatchObject({code:"22023"});
    expect((await as(1,()=>page("members",g1))).rows.map(r=>r.id)).toEqual([id(3),id(5)]);
    for (const [v,owner,track,available] of [[10,1,"mixed",true],[11,1,"full-practical",true],[12,1,"future-type",true],[13,2,"mixed",true],[14,1,"mixed",false]] as const)
      await db.query("insert into assess.versions(id,owner_id,assessment_id,version,name,track,available) values($1,$2,$1,'v1','Synthetic metadata only',$3,$4)",[id(v),id(owner),track,available]);
    expect((await as(1,()=>page("versions"))).rows.map(r=>r.id)).toEqual([id(10),id(11)]);
    for (const v of [12,13,14]) await expect(as(1,()=>call("assign_v1",[id(v),[id(3)],[]]))).rejects.toMatchObject(denied);
    await expect(as(1,()=>call("assign_v1",[id(10),[id(3)],[foreign]]))).rejects.toMatchObject(denied);
    const a=await as(1,()=>call<string>("assign_v1",[id(10),[id(3),id(3)],[g1,g2,g1]]));
    await expect(as(null,()=>call("assigned_version_v1",[a]))).rejects.toMatchObject(denied);
    expect((await as(1,()=>page("targets",a))).rows.map(r=>r.id)).toEqual([id(3),id(4),id(5)]);
    await expect(as(1,()=>call("assign_v1",[id(10),[id(3)],[]]))).rejects.toMatchObject({code:"23505"});
    const direct=await as(1,()=>call<string>("assign_v1",[id(11),[id(4)],[]]));
    await expect(as(3,()=>call("assigned_version_v1",[direct]))).rejects.toMatchObject(denied);
    expect(await as(4,()=>call("assigned_version_v1",[direct]))).toMatchObject({assignmentId:direct,track:"full-practical"});
    await as(1,()=>call("members_write_v1",[g1,[id(3)],false]));
    await as(1,()=>call("group_write_v1",[g2,null,true]));
    expect((await as(1,()=>page("targets",a))).rows.map(r=>r.id)).toEqual([id(3),id(4),id(5)]);
    expect(await as(3,()=>call("assigned_version_v1",[a]))).toMatchObject({assignmentId:a,assignmentRevision:1});
    await expect(as(5,()=>call("assigned_version_v1",[a]))).rejects.toMatchObject(denied);
    await db.query("update profiles set status='approved' where user_id=$1",[id(5)]);
    expect(await as(5,()=>call("assigned_version_v1",[a]))).toMatchObject({assignmentId:a});
    await db.query("update profiles set status='suspended' where user_id=$1",[id(3)]);
    await expect(as(3,()=>call("assigned_version_v1",[a]))).rejects.toMatchObject(denied);
    await db.query("update profiles set status='approved' where user_id=$1",[id(3)]);
    expect(await as(1,()=>call("targets_write_v1",[a,1,[id(3)],false]))).toBe(2);
    await expect(as(3,()=>call("assigned_version_v1",[a]))).rejects.toMatchObject(denied);
    await expect(as(1,()=>call("targets_write_v1",[a,1,[id(3)],true]))).rejects.toMatchObject({code:"40001"});
    expect(await as(1,()=>call("targets_write_v1",[a,2,[id(3),id(3)],true]))).toBe(3);
    await expect(as(2,()=>call("targets_write_v1",[a,3,[id(3)],false]))).rejects.toMatchObject(denied);
    // Server keyset pages are bounded even when a caller requests 10,000; duplicate names do not drop users.
    await db.exec(`insert into auth.users(id,email,raw_user_meta_data) select ('20000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'same@example.test','{"display_name":"Same Name"}' from generate_series(1,105) i;`);
    const seen:string[]=[];let cursor:string|null=null;
    do { const p=await as(1,()=>page("people",null,cursor,10000));expect(p.rows.length).toBeLessThanOrEqual(100);seen.push(...p.rows.map(r=>String(r.id)));cursor=p.next;} while(cursor);
    expect(seen).toHaveLength(109);expect(new Set(seen).size).toBe(109);
    expect((await as(1,()=>page("people",null,null,20,"%"))).rows).toEqual([]);
    expect((await as(1,()=>page("groups"))).rows.map(r=>r.id)).toEqual([g1]);
    expect((await as(2,()=>page("groups"))).rows.map(r=>r.id)).toEqual([foreign]);
    for (const who of [null,1,2,3,4,5,6]) for (const table of ["groups","memberships","versions","assignments","targets"]) {
      await expect(as(who,()=>db.query(`select * from assess.${table}`))).rejects.toMatchObject(denied);
      await expect(as(who,()=>db.query(`delete from assess.${table}`))).rejects.toMatchObject(denied);
    }
    expect((await db.query<{ relrowsecurity:boolean }>("select relrowsecurity from pg_class where relnamespace='assess'::regnamespace and relkind='r'")).rows.every(r=>r.relrowsecurity)).toBe(true);
    const fns=(await db.query<{prosecdef:boolean;proconfig:string[]}>("select prosecdef,proconfig from pg_proc where pronamespace='assess'::regnamespace")).rows;
    expect(fns).toHaveLength(6);expect(fns.every(f=>f.prosecdef&&f.proconfig.includes('search_path=""'))).toBe(true);
    await db.query("update profiles set status='suspended' where user_id=$1",[id(1)]);
    await expect(as(1,()=>page("groups"))).rejects.toMatchObject(denied);
    await expect(as(1,()=>createGroup("forbidden"))).rejects.toMatchObject(denied);
  } finally { await db.close(); }
},30000);
