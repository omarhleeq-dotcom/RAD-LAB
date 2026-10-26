import { spawnSync } from "node:child_process";
import { expect,it,vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { directoryPage,examSummaryPage,FIRST } from "./owner-dashboard-data";
import { EMPTY_FILTERS } from "./owner-data";
it("uses the C2 directory for normal lists without guessing email confirmation or reading legacy lists",async()=>{
 const rpc=vi.fn().mockResolvedValue({data:{version:1,boundary:"2026-10-24T00:00:00Z",rows:[{user_id:"fixture",participant_code:"P-fixture",role:"participant",status:"pending",email:"fixture@example.test",name:null,created_at:"2026-10-20T00:00:00Z",last_seen_at:null}],counts:{pending:1,approved:0,suspended:0},next:{id:"fixture",rank:0}},error:null});
 const page=await directoryPage({rpc} as unknown as SupabaseClient,"fixture","pending",FIRST);
 expect(rpc).toHaveBeenCalledExactlyOnceWith("owner_account_directory_v1",{p_search:"fixture",p_status:"pending",p_cursor:null,p_boundary:null,p_limit:20});
 expect(page.rows[0]!.emailConfirmed).toBeNull();expect(page.legacy).toBe(false);
 expect(page.next).toEqual({cursor:{id:"fixture",rank:"0"},boundary:"2026-10-24T00:00:00Z"});
});
it("fails closed when C2 is absent, denied or malformed, without exposing an old directory",async()=>{
 for(const response of [{error:{code:"PGRST202"}},{error:{code:"42501"}},{data:{version:1,rows:[]},error:null}]) {
  const rpc=vi.fn().mockResolvedValue(response);
  await expect(directoryPage({rpc} as unknown as SupabaseClient,"","",FIRST)).rejects.toThrow();
  expect(rpc).toHaveBeenCalledTimes(1);
 }
});
it("wires only the C1 summary at the existing summary boundary and preserves missing-function state",async()=>{
 const rpc=vi.fn().mockResolvedValueOnce({data:{version:1,rows:[{exam:"fixture",attempts:2,known:2,passed:1,wrong:[]}],boundary:"2026-10-24T00:00:00Z",next:null},error:null}).mockResolvedValueOnce({error:{code:"PGRST202"}});
 const client={rpc} as unknown as SupabaseClient;
 expect((await examSummaryPage(client,EMPTY_FILTERS,FIRST))?.rows[0]!.attempts).toBe(2);
 expect(rpc.mock.calls[0]![0]).toBe("owner_dashboard_v1");expect(rpc.mock.calls[0]![1].p_view).toBe("summary");
 expect(await examSummaryPage(client,EMPTY_FILTERS,FIRST)).toBeNull();
});

it("accepts exactly the conditional reviewed trial catalogue and still rejects extra objects and grants",()=>{
 const result=spawnSync(process.execPath,["--input-type=module","-e",`
 import assert from 'node:assert/strict';
 import {readFileSync} from 'node:fs';
 import {openLocalDatabase} from './scripts/assess/local-database.mjs';
 const db=await openLocalDatabase('pglite',{through:'pre-rad085'});
 try {
  const sql=readFileSync('supabase/checks/assess-staging-ready.sql','utf8');
  const body=sql.slice(sql.indexOf('with expected_tables'),sql.lastIndexOf('rollback;'));
  const check=async()=>{await db.exec('begin read only');try{return (await db.query(body))[0];}finally{await db.exec('rollback');}};
  assert.equal((await check()).catalogue_ready,true);
  await db.exec(readFileSync('scripts/assess/sql/trial-isolation.sql','utf8'));
  const installed=await check();assert.equal(installed.catalogue_ready,true);assert.equal(installed.runtime_or_launch_verified,false);
  await db.exec('grant execute on function assess.trial_claim_v1(uuid) to authenticated');
  assert.equal((await check()).execute_matrix,false);
  await db.exec('revoke execute on function assess.trial_claim_v1(uuid) from authenticated');
  await db.exec('create table assess.unreviewed_fixture(id integer)');
  assert.equal((await check()).no_unreviewed_relations,false);
  await db.exec('drop table assess.unreviewed_fixture;create function assess.unreviewed_fixture() returns integer language sql as $$select 1$$');
  assert.equal((await check()).no_unreviewed_functions,false);
 }finally{await db.close();}
 `],{encoding:"utf8",timeout:60000});
 expect(result.status,result.stdout+result.stderr).toBe(0);
},65000);
