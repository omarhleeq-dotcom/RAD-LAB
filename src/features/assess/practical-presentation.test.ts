import {createElement,type ComponentType,type ReactNode} from "react";
import {NextIntlClientProvider} from "next-intl";
import en from "../../../messages/en.json";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it} from "vitest";
import {CASES} from "@/data/cases";
import {practicalFixture,practicalSnapshot} from "../../../scripts/assess/e-fixture";
import {validatePracticalContent} from "./server-practical";
import {validateMixedContent} from "./server-presentation";
import {parsePracticalSession} from "./practical-data";
import {parseSession} from "./runner-data";
import {PracticalScene} from "./PracticalScene";
import {PracticalControls} from "./PracticalControls";
// PracticalScene and PracticalControls read their platform labels from messages (CLN-037); render it as the app does, in English.
const english=(node:ReactNode)=>createElement(NextIntlClientProvider as ComponentType<Record<string,unknown>>,{locale:"en",messages:en,timeZone:"UTC"},node);
it.each(CASES.map(c=>[c.id,c] as const))("renders all supported controls and existing anatomy without hints or private metadata: %s",(_id,c)=>{
 const {views,specs}=validatePracticalContent(practicalFixture("1",[c]));
 const view=views["full-0"]!,values=view.initial;
 expect(Object.keys(view.controls)).toEqual(Object.keys(specs["full-0"]!));
 const controls=renderToStaticMarkup(english(createElement(PracticalControls,{view,values,disabled:false,onChange:()=>{}})));
 const scene=renderToStaticMarkup(english(createElement(PracticalScene,{view,values,disabled:false,onChange:()=>{}})));
 expect(controls).toContain('practical-control-kvp');expect(controls).toContain('practical-control-sidCm');
 expect(controls.includes('practical-control-breathing')).toBe(!!c.availableBreathing);
 expect(controls.includes('practical-control-tubeAngulationDeg')).toBe(!!c.controls.tubeAngulationDeg);
 expect(controls.includes('practical-control-aecChambers')).toBe(!!c.technique.aec);
 for(const choice of c.choiceControls??[])expect(controls).toContain(`practical-control-choices.${choice.id}`);
 expect(scene).toContain('Move beam');expect(scene).toContain('<path');
 expect(scene+controls).not.toMatch(/readiness|sidTarget|correct|acceptable|rubric|critical|criteria|target.?zone|retry|reset|ideal|aria-hidden[^>]*>[^<]*solution/i);
 expect(JSON.stringify(view)).not.toMatch(/rules|scoring|criteria|evaluatorVersion|defaultMarker|fixedSettings|passThreshold|tolerance|correctOption/);
 const dto=parsePracticalSession({...practicalSnapshot(),assessment:practicalFixture("1",[c]).assessment,views});
 expect(dto.assessment!.track).toBe("full-practical");expect(dto.views!["full-0"]).toEqual(view);
 expect(()=>parseSession(dto)).toThrow();expect(()=>validateMixedContent(practicalFixture("1",[c]))).toThrow();
});
it("whitelists E responses, drops terminal details and rejects malformed/foreign settings",()=>{
 const s=practicalSnapshot();expect(JSON.stringify(parsePracticalSession({...s,correctOptionId:"private",results:"private"}))).not.toContain("private");
 expect(parsePracticalSession({...s,ack:{...s.ack,state:"grading"}})).toEqual({attemptId:s.attemptId,ack:{...s.ack,state:"grading"}});
 for(const change of [
  (x:ReturnType<typeof practicalSnapshot>)=>{x.views["full-0"]!.scene.id="unknown" as never;},
  (x:ReturnType<typeof practicalSnapshot>)=>{x.views["full-0"]!.scene.detector.widthCm=Infinity;},
  (x:ReturnType<typeof practicalSnapshot>)=>{x.views["full-0"]!.controls.secret={kind:"number",min:0,max:1};},
  (x:ReturnType<typeof practicalSnapshot>)=>{x.answers={"full-0":{type:"full-practical",values:{kvp:999}}} as never;},
  (x:ReturnType<typeof practicalSnapshot>)=>{x.ack.lockedItemIds=["full-0"];},
 ]){const x=practicalSnapshot();change(x);expect(()=>parsePracticalSession(x)).toThrow();}
});
