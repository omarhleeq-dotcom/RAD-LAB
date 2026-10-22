import {createClient} from "@supabase/supabase-js";
import { afterEach,expect,it,vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement,type ComponentType,type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import en from "../../../messages/en.json";
import { MixedRunner } from "./runner-state";
import { RunnerError,parseSession,runnerPort,type MixedSession,type RunnerPort } from "./runner-data";
import { PartControls } from "./PartControls";
import { validateMixedContent } from "./server-presentation";
import { mixedFixture,fixtureId as id } from "../../../scripts/assess/d-fixture";
import type { AttemptCommand,SimulatorPartItem } from "./contracts";
// PartControls reads its platform labels from messages (CLN-037); render it as the app does, in English.
const english=(node:ReactNode)=>createElement(NextIntlClientProvider as ComponentType<Record<string,unknown>>,{locale:"en",messages:en,timeZone:"UTC"},node);
const sessions:MixedRunner[]=[];
afterEach(()=>{sessions.forEach(c=>c.dispose());sessions.length=0;vi.useRealTimers();});
function fixture(){
 const pub=mixedFixture();const {specs}=validateMixedContent(pub);
 return parseSession({attemptId:id(99),ack:{operationId:null,revision:0,serverTime:"2026-10-20T00:00:00.000Z",deadline:"2026-10-20T01:00:00.000Z",state:"active",lockedItemIds:[]},assessment:pub.assessment,answers:{},views:{distance:{controls:specs.distance,initial:{sidCm:120},sceneValues:{}},marker:{controls:specs.marker,initial:{kvp:100,sideMarker:null,"markerPosition.x":0,"markerPosition.y":0},sceneValues:{sideMarker:null,"markerPosition.x":0,"markerPosition.y":0}}}});
}
async function setup(){
 let server=fixture();const calls:AttemptCommand[]=[],receipts=new Map<string,string>();let lost=false,conflict=false,unavailable=false;
 const port:RunnerPort={start:async()=>id(99),read:async()=>{if(unavailable)throw new RunnerError("network");return structuredClone(server);},command:async c=>{
  calls.push(structuredClone(c));if(unavailable)throw new RunnerError("network");
  if(conflict){conflict=false;server.ack.revision++;server.answers!.letter={type:"single-choice",optionId:"b"};throw new RunnerError("conflict");}
  const body=JSON.stringify(c),prior=receipts.get(c.operationId);if(prior){expect(prior).toBe(body);return;}
  if(c.expectedRevision!==server.ack.revision)throw new RunnerError("conflict");
  server.ack.revision++;receipts.set(c.operationId,body);
  if(c.action.type==="submit")server={attemptId:server.attemptId,ack:{...server.ack,state:"grading"}};
  else {server.answers![c.action.item.id]=c.action.answer;if(c.action.type==="expose")server.ack.lockedItemIds=[...server.ack.lockedItemIds,c.action.item.id];}
  if(lost){lost=false;throw new RunnerError("network");}
 }};
 const c=new MixedRunner(port,()=>{});sessions.push(c);await c.open(id(99));
 return {c,calls,server:()=>server,lose:()=>{lost=true;},conflict:()=>{conflict=true;},disconnect:(v:boolean)=>{unavailable=v;},expire:()=>{server={attemptId:server.attemptId,ack:{...server.ack,state:"grading"}};}};
}
it("autosaves only after a server acknowledgement; navigation flushes then permits editing MCQ",async()=>{
 vi.useFakeTimers();const {c,calls}=await setup();c.edit("letter",{type:"single-choice",optionId:"a"});expect(c.dirty).toBe(true);expect(c.session!.answers!.letter).toBeUndefined();
 await vi.advanceTimersByTimeAsync(601);expect(calls).toHaveLength(1);expect(c.dirty).toBe(false);
 await c.navigate(1);expect(c.index).toBe(1);await c.navigate(0);c.edit("letter",{type:"single-choice",optionId:"b"});await c.flush();expect(c.session!.answers!.letter).toEqual({type:"single-choice",optionId:"b"});
});
it("retries exactly the same lost-ack exposure and retains its lock after a new controller resumes",async()=>{
 const {c,calls,lose,server}=await setup();await c.navigate(1);lose();await c.expose();expect(c.pending).not.toBeNull();expect(c.issue).toBe("network");expect(server().ack.lockedItemIds).toEqual(["distance"]);
 const first=structuredClone(calls[0]);c.edit("distance",{type:"simulator-part",values:{sidCm:170}});expect(calls).toHaveLength(1);
 await c.recover();expect(calls[1]).toEqual(first);expect(c.pending).toBeNull();expect(c.session!.ack.lockedItemIds).toEqual(["distance"]);
 const old=c.drafts.distance;c.edit("distance",{type:"simulator-part",values:{sidCm:170}});expect(c.drafts.distance).toEqual(old);
});
it("stops stale writes on revision conflict and explicitly replaces local edits from the server",async()=>{
 const {c,calls,conflict}=await setup();conflict();c.edit("letter",{type:"single-choice",optionId:"a"});await c.flush();expect(c.issue).toBe("conflict");
 await c.navigate(1);expect(c.index).toBe(0);await c.recover();expect(calls).toHaveLength(1);expect(c.drafts.letter).toEqual({type:"single-choice",optionId:"b"});expect(c.issue).toBeNull();
});
it("offline exposure gives no success and reconciliation after deadline discards details without resending",async()=>{
 const {c,calls,disconnect,expire}=await setup();await c.navigate(1);disconnect(true);await c.expose();expect(c.session!.ack.lockedItemIds).toEqual([]);expect(c.pending).not.toBeNull();
 expire();disconnect(false);await c.recover();expect(calls).toHaveLength(1);expect(c.session!.ack.state).toBe("grading");expect(c.drafts).toEqual({});expect(c.session!.assessment).toBeUndefined();
});
it("counts unexposed parts as unresolved, saves edits before submit and drops detailed state",async()=>{
 const {c,calls}=await setup();expect(c.unresolved).toBe(3);c.edit("letter",{type:"single-choice",optionId:"a"});expect(c.unresolved).toBe(2);
 await c.submit();expect(calls.map(c=>c.action.type)).toEqual(["save","submit"]);expect(c.session!.ack.state).toBe("grading");expect(c.drafts).toEqual({});
 const n=calls.length;c.edit("letter",{type:"single-choice",optionId:"b"});await c.flush();expect(calls).toHaveLength(n);
});
it("whitelists the public DTO and fails closed on unsupported types, controls and invalid answer values",()=>{
 const s=fixture();expect(JSON.stringify(parseSession({...s,correctOptionId:"secret",criteria:"secret"}))).not.toContain("secret");
 for(const mutate of [(s:MixedSession)=>{s.assessment!.track="full-practical" as "mixed";},(s:MixedSession)=>{s.views!.distance!.controls={evil:{kind:"number",min:0,max:1}};},(s:MixedSession)=>{s.answers!.distance={type:"simulator-part",values:{sidCm:9999}};}]){const s=fixture();mutate(s);expect(()=>parseSession(s)).toThrow();}
});
it("renders only SID for a SID item and only explicitly selected scene inputs, with no grading hints in markup/ARIA",()=>{
 const s=fixture(),item=s.assessment!.items[1] as SimulatorPartItem;
 const markup=renderToStaticMarkup(english(createElement(PartControls,{item,view:s.views!.distance!,values:{sidCm:130},disabled:false,onChange:()=>{}})));
 expect(markup).toContain("SID (cm)");expect(markup).not.toMatch(/kVp|Marker|svg|correct|target|rubric|criteria|readiness|title=/i);
 const marker=s.assessment!.items[2] as SimulatorPartItem;
 const scene=renderToStaticMarkup(english(createElement(PartControls,{item:marker,view:s.views!.marker!,values:{kvp:100,sideMarker:"R","markerPosition.x":0.4,"markerPosition.y":0.3},disabled:true,onChange:()=>{}})));
 expect(scene).toContain("Marker letter");expect(scene).not.toMatch(/SID \(cm\)|correct|rubric|target|criteria/i);
});
it("D authoring rejects unmatched mutable controls, unknown scene elements and full-practical candidates",()=>{
 for(const mutate of [(p:ReturnType<typeof mixedFixture>)=>{(p.assessment.items[1] as SimulatorPartItem).presentation.controls=["kvp"];},(p:ReturnType<typeof mixedFixture>)=>{(p.assessment.items[1] as SimulatorPartItem).presentation.sceneElements=["solution"];},(p:ReturnType<typeof mixedFixture>)=>{p.assessment.track="full-practical" as "mixed";}]){const p=mixedFixture();mutate(p);expect(()=>validateMixedContent(p)).toThrow();}
});

it("a stalled SDK request times out without changing the command's operation identity",async()=>{
 vi.useFakeTimers();let observed:AbortSignal|null=null;
 const client=createClient("https://synthetic.supabase.co","sb_publishable_synthetic_local_test",{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(_input,init)=>new Promise((_resolve,reject)=>{observed=init!.signal as AbortSignal;observed.addEventListener("abort",()=>reject(new Error("Synthetic timeout")),{once:true});})}});
 const command:AttemptCommand={schemaVersion:1,attemptId:id(99),operationId:id(101),expectedRevision:0,action:{type:"submit"}};
 const before=JSON.stringify(command),pending=expect(runnerPort(client).command(command)).rejects.toBeInstanceOf(RunnerError);
 await vi.advanceTimersByTimeAsync(15_001);await pending;expect((observed as AbortSignal|null)?.aborted).toBe(true);expect(JSON.stringify(command)).toBe(before);
});
