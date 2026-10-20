import {afterEach,expect,it,vi} from "vitest";
import {practicalSnapshot,fixtureId as id} from "../../../scripts/assess/e-fixture";
import {PracticalRunner} from "./practical-state";
import {parsePracticalSession,type PracticalSession} from "./practical-data";
import {RunnerError} from "./runner-data";
import type {AttemptCommand,ItemAnswer} from "./contracts";
const runners:PracticalRunner[]=[];
afterEach(()=>{runners.forEach(c=>c.dispose());runners.length=0;vi.useRealTimers();});
async function setup(){
 let state=parsePracticalSession(practicalSnapshot()),lost=false,offline=false,conflict=false;const calls:AttemptCommand[]=[],receipts=new Map<string,string>();
 const port={read:async()=>{if(offline)throw new RunnerError("network");return structuredClone(state);},command:async(c:AttemptCommand)=>{
  calls.push(structuredClone(c));if(offline)throw new RunnerError("network");
  if(conflict){conflict=false;state.ack.revision++;throw new RunnerError("conflict");}
  const prior=receipts.get(c.operationId);if(prior){expect(JSON.stringify(c)).toBe(prior);return;}
  if(c.expectedRevision!==state.ack.revision)throw new RunnerError("conflict");
  state.ack.revision++;receipts.set(c.operationId,JSON.stringify(c));
  if(c.action.type==="submit")state={attemptId:state.attemptId,ack:{...state.ack,state:"grading"}};
  else{if(state.ack.lockedItemIds.includes(c.action.item.id))throw new RunnerError("invalid");state.answers![c.action.item.id]=structuredClone(c.action.answer);if(c.action.type==="expose")state.ack.lockedItemIds=[...state.ack.lockedItemIds,c.action.item.id];}
  if(lost){lost=false;throw new RunnerError("network");}
 }};
 const make=async()=>{const c=new PracticalRunner(port,()=>{});runners.push(c);await c.open(id(99));return c;};
 return {c:await make(),make,calls,state:()=>state,lose:()=>{lost=true;},offline:(v:boolean)=>{offline=v;},conflict:()=>{conflict=true;},expire:()=>{state={attemptId:state.attemptId,ack:{...state.ack,state:"grading"}} as PracticalSession;}};
}
const answer=(c:PracticalRunner,n=0):ItemAnswer=>({type:"full-practical",values:{...c.session!.views![`full-${n}`]!.initial,kvp:90}});
it("retains every draft through serialized acknowledgements and saves before navigation/submit",async()=>{
 const {c,calls}=await setup();c.edit("full-0",answer(c));c.edit("full-1",answer(c,1));await c.flush();expect(calls.map(x=>x.action.type)).toEqual(["save","save"]);expect(c.session!.answers!["full-1"]).toEqual(answer(c,1));expect(c.dirty).toBe(false);
 await c.navigate(1);await c.expose();expect(c.unresolved).toBe(1);await c.navigate(0);await c.submit();expect(c.session!.assessment).toBeUndefined();expect(c.drafts).toEqual({});
});
it("replays the identical uncertain exposure and restores its lock across controllers",async()=>{
 const {c,make,calls,lose}=await setup();lose();await c.expose();const first=structuredClone(calls[0]);expect(c.pending).not.toBeNull();c.edit("full-0",answer(c));await c.recover();expect(calls[1]).toEqual(first);expect(c.pending).toBeNull();
 const resumed=await make();expect(resumed.session!.ack.lockedItemIds).toEqual(["full-0"]);const before=structuredClone(resumed.drafts);resumed.edit("full-0",answer(resumed));await resumed.expose();expect(resumed.drafts).toEqual(before);expect(calls).toHaveLength(2);
});
it("halts stale windows at conflicts and never rewrites their drafts during reconciliation",async()=>{
 const {c,make,calls}=await setup(),other=await make();await c.expose();other.edit("full-0",answer(other));await other.flush();expect(other.issue).toBe("conflict");await other.navigate(1);expect(other.index).toBe(0);await other.recover();expect(other.session!.ack.lockedItemIds).toEqual(["full-0"]);expect(calls).toHaveLength(2);
});
it("does not overlap autosave/exposure and treats unacknowledged offline data as unconfirmed at expiry",async()=>{
 vi.useFakeTimers();const {c,calls,offline,expire}=await setup();c.edit("full-0",answer(c));offline(true);await vi.advanceTimersByTimeAsync(601);expect(c.issue).toBe("network");expect(c.unresolved).toBe(2);await c.expose();expect(calls).toHaveLength(1);
 expire();offline(false);await c.recover();expect(calls).toHaveLength(1);expect(c.session!.ack.state).toBe("grading");expect(c.drafts).toEqual({});
});
it("reconciles a lost submit acknowledgement without repeating the effect or retaining details",async()=>{
 const {c,lose,calls}=await setup();lose();await c.submit();expect(c.pending?.action.type).toBe("submit");await c.recover();expect(calls).toHaveLength(1);expect(c.session!.ack.state).toBe("grading");expect(c.drafts).toEqual({});
});
