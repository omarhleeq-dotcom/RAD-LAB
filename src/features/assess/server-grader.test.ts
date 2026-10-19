import { describe,expect,it } from "vitest";
import { CASES } from "@/data/cases";
import { chestPaErect as c } from "@/data/cases/chest-pa-erect";
import { evaluate } from "@/features/evaluation/engine";
import { displayPoints } from "./policies";
import { fullPractical,gradePublication,markerPartCredit } from "./server-grader";
import { ASSESS_EVALUATOR,caseVersion,leafValues,reconstruct,settingsSpec,validatePublication } from "./server-validation";
import type { AssessmentPublication } from "./server-contracts";
const review={sources:[{reference:"Synthetic engineering",licenceEvidence:"Test only"}],reviewedBy:"Test only",reviewedAt:"2026-10-19T00:00:00.000Z",scope:"Not clinical review"};
function fixture():AssessmentPublication {return {schemaVersion:1,assessment:{schemaVersion:1,ref:{id:"synthetic",version:"1"},name:"Synthetic letters",track:"mixed",maximum:"10",policy:{durationSeconds:60,maxAttempts:1,gradeVisibility:"hidden"},items:[{schemaVersion:1,ref:{id:"q",version:"1"},type:"single-choice",contentLanguage:"en",prompt:"Synthetic",options:[{id:"a",text:"A"},{id:"b",text:"B"}]}]},itemMarks:[{item:{id:"q",version:"1"},maximum:"3"}],privateItems:[{schemaVersion:1,ref:{id:"q",version:"1"},type:"single-choice",correctOptionId:"a",review:structuredClone(review)}]};}
function simFixture():AssessmentPublication {
  const p=fixture();p.assessment={...p.assessment,track:"mixed",items:[{schemaVersion:1,ref:{id:"q",version:"1"},type:"simulator-part",contentLanguage:"en",prompt:"Engineering fixture",presentation:{controls:["sidCm"],sceneElements:[]}}]};
  p.privateItems=[{schemaVersion:1,ref:{id:"q",version:"1"},type:"simulator-part",review,caseRef:{id:c.id,version:caseVersion(c)},evaluatorVersion:ASSESS_EVALUATOR,fixedSettings:structuredClone(c.initialSettings),mutablePaths:["sidCm"],criteria:[{ruleId:c.rules.find(r=>r.kind==="range"&&r.setting==="sidCm")!.id,part:"sidCm",maximum:"3"}]}];return p;
}
describe("C publication/grading boundary",()=>{
  it("keeps single-choice keys private and grades only the pinned option, missing is zero",()=>{
    const p=fixture();expect(validatePublication(p).publication).toEqual(p);
    expect(gradePublication(p,{},[])).toEqual({numerator:"0",denominator:"1"});
    expect(gradePublication(p,{q:{type:"single-choice",optionId:"a"}},[])).toEqual({numerator:"10",denominator:"1"});
    expect(gradePublication(p,{q:{type:"single-choice",optionId:"b"}},[])).toEqual({numerator:"0",denominator:"1"});
    expect(()=>gradePublication(p,{q:{type:"single-choice",optionId:"forged"}},[])).toThrow();
  });
  it("combines arbitrary configured item marks and converts once without rounding",()=>{
    const p=fixture();if(p.assessment.track!=="mixed")throw new Error();const q=structuredClone(p.assessment.items[0]!);q.ref={id:"second",version:"1"};
    p.assessment={...p.assessment,track:"mixed",items:[p.assessment.items[0] as typeof q,q]};
    p.itemMarks=[...p.itemMarks,{item:q.ref,maximum:"6"}];p.privateItems=[...p.privateItems,{...p.privateItems[0]!,ref:q.ref}];
    expect(gradePublication(p,{q:{type:"single-choice",optionId:"a"}},[])).toEqual({numerator:"10",denominator:"3"});
  });
  it("ignores an unexposed simulator and cannot mutate fixed settings",()=>{
    const p=simFixture(),answers={q:{type:"simulator-part" as const,values:{sidCm:180}}};
    expect(gradePublication(p,answers,[]).numerator).toBe("0");
    expect(gradePublication(p,answers,["q"]).numerator).toBe("10");
    expect(()=>gradePublication(p,{q:{type:"simulator-part",values:{sidCm:180,kvp:125}}},["q"])).toThrow();
    expect(()=>gradePublication(p,{q:{type:"simulator-part",values:{sidCm:Infinity}}},["q"])).toThrow();
    expect(()=>gradePublication(p,{q:{type:"simulator-part",values:{sidCm:"180"}}},["q"])).toThrow();
  });
  it.each([
    ["unsupported schema",(p:AssessmentPublication)=>{p.schemaVersion=2 as 1;}],
    ["missing key",(p:AssessmentPublication)=>{p.privateItems=[];}],
    ["duplicate key",(p:AssessmentPublication)=>{p.privateItems=[...p.privateItems,...p.privateItems];}],
    ["wrong key version",(p:AssessmentPublication)=>{p.privateItems[0]!.ref.version="old";}],
    ["wrong mark version",(p:AssessmentPublication)=>{p.itemMarks[0]!.item.version="old";}],
    ["zero points",(p:AssessmentPublication)=>{p.itemMarks[0]!.maximum="0";}],
    ["oversized time",(p:AssessmentPublication)=>{p.assessment.policy.durationSeconds=604801;}],
    ["invalid visibility",(p:AssessmentPublication)=>{p.assessment.policy.gradeVisibility="other" as "hidden";}],
    ["missing source",(p:AssessmentPublication)=>{p.privateItems[0]!.review.sources=[];}],
    ["missing review",(p:AssessmentPublication)=>{p.privateItems[0]!.review.reviewedBy="";}],
  ])("rejects %s",(_name,mutate)=>{const p=fixture();mutate(p);expect(()=>validatePublication(p)).toThrow();});
  it.each(["old evaluator","unknown path","wrong criterion","marker combined","extra background","extra nested background","wrong case pin","mark mismatch"])("rejects simulator publication: %s",kind=>{
    const p=simFixture(),key=p.privateItems[0]!;if(key.type!=="simulator-part")throw new Error();
    if(kind==="old evaluator")key.evaluatorVersion="old";
    if(kind==="unknown path")key.mutablePaths=["__proto__.bad"];
    if(kind==="wrong criterion")key.criteria=[{ruleId:"unknown",part:"sidCm",maximum:"3"}];
    if(kind==="marker combined")key.criteria=[{ruleId:c.rules.find(r=>r.kind==="marker")!.id,part:"combined",maximum:"3"}];
    if(kind==="extra background")(key.fixedSettings as unknown as Record<string,unknown>).secret=1;
    if(kind==="extra nested background")(key.fixedSettings.centralRay as unknown as Record<string,unknown>).secret=1;
    if(kind==="wrong case pin")key.caseRef.version="old";
    if(kind==="mark mismatch")key.criteria=[{...key.criteria[0]!,maximum:"2"}];
    expect(()=>validatePublication(p)).toThrow();
  });
  it("keeps fixed marker position on a letter-only edit and separates side from placement",()=>{
    const fixed=CASES.find(c=>c.positioning.markerRule?.kind==="fixed-side")!;
    const base=structuredClone(fixed.initialSettings);base.markerPosition={x:0.1,y:0.1};
    const spec={sideMarker:settingsSpec(fixed).sideMarker!};
    const changed=reconstruct(base,spec,{sideMarker:"R"});expect(changed.markerPosition).toEqual(base.markerPosition);
    const rightLetter=fixed.positioning.markerRule!.kind==="fixed-side"?fixed.positioning.markerRule!.side:"L";
    const wrongLetter=rightLetter==="L"?"R":"L";
    expect(markerPartCredit(fixed,{...base,sideMarker:rightLetter},"marker-side").numerator).toBeGreaterThan(0n);
    expect(markerPartCredit(fixed,{...base,sideMarker:wrongLetter},"marker-side").numerator).toBe(0n);
    expect(markerPartCredit(fixed,{...base,sideMarker:null},"marker-placement").numerator).toBe(0n);
    expect(markerPartCredit(fixed,{...base,sideMarker:rightLetter,markerPosition:{x:1,y:1}},"marker-placement").numerator).toBe(0n);
  });
  it("rejects all unsupported shapes/fields and pathological options before persistence",()=>{
    expect(()=>validatePublication({...fixture(),extra:"private"})).toThrow();
    const unsafe=fixture();unsafe.assessment.items[0]!.ref.id="__proto__";expect(()=>validatePublication(unsafe)).toThrow();
    expect(()=>validatePublication({assessment:null})).toThrow();
    const p=fixture();const item=p.assessment.items[0]!;if(item.type!=="single-choice")throw new Error();
    item.options=Array.from({length:51},(_,i)=>({id:String(i),text:"X"}));expect(()=>validatePublication(p)).toThrow();
    expect(()=>validatePublication(JSON.parse('{"__proto__":{"admin":true}}'))).toThrow();
  });
  it.each(CASES.map(c=>[c.id,c] as const))("preserves the full rubric, gates and settings for %s",(_id,c)=>{
    const s=structuredClone(c.initialSettings),engine=evaluate(c,s),graded=fullPractical(c,s);
    const percent={numerator:graded.credit.numerator*100n,denominator:graded.credit.denominator};
    expect(Number(displayPoints(percent,1))).toBeCloseTo(engine.score.total,1);
    expect(graded.passed).toBe(engine.score.passed);expect(graded.critical).toBe(engine.criticalFindings.length>0);
    const all=settingsSpec(c);expect(reconstruct(c.initialSettings,all,leafValues(s,all))).toEqual(s);
    const p=fixture();p.assessment={...p.assessment,track:"full-practical",items:[{schemaVersion:1,ref:{id:"q",version:"1"},type:"full-practical",contentLanguage:"en",prompt:"Existing case engineering",caseRef:{id:c.id,version:caseVersion(c)}}]};
    p.privateItems=[{schemaVersion:1,ref:{id:"q",version:"1"},type:"full-practical",review,caseRef:{id:c.id,version:caseVersion(c)},evaluatorVersion:ASSESS_EVALUATOR}];
    expect(gradePublication(p,{q:{type:"full-practical",values:leafValues(s,all)}},["q"]).denominator).toMatch(/^[1-9]\d*$/);
  });
});
