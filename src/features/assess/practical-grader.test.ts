import {expect,it} from "vitest";
import {CASES} from "@/data/cases";
import {evaluate} from "@/features/evaluation/engine";
import {practicalFixture} from "../../../scripts/assess/e-fixture";
import {fullPractical,gradePublication} from "./server-grader";
import {caseVersion,leafValues,reconstruct,settingsSpec,validatePublication} from "./server-validation";
import {decimalPoints} from "./policies";
// Independent rational oracle uses each check/category, never Practice's rounded total.
const add=(a:bigint[],b:bigint[])=>[a[0]!*b[1]!+b[0]!*a[1]!,a[1]!*b[1]!];
const mul=(a:bigint[],b:bigint[])=>[a[0]!*b[0]!,a[1]!*b[1]!];
const num=(x:number)=>{const f=decimalPoints(String(x));return [f.numerator,f.denominator];};
it.each(CASES.map(c=>[c.id,c] as const))("preserves exact rubric, exclusions and critical semantics over settings for %s",(_id,c)=>{
 const p=practicalFixture("1",[c]),spec=settingsSpec(c),states=[structuredClone(c.initialSettings)];
 for(const path of Object.keys(c.controls)){for(const bound of ["min","max"] as const){const s=structuredClone(c.initialSettings);Object.assign(s,{[path]:c.controls[path as keyof typeof c.controls]![bound]});states.push(s);}}
 for(const [path,control] of Object.entries(spec))if(control.kind==="enum")for(const value of control.values)states.push(reconstruct(c.initialSettings,spec,{...leafValues(c.initialSettings,spec),[path]:value}));
 for(const s of states){
  const e=evaluate(c,s),actual=fullPractical(c,s);let earned=[0n,1n],available=[0n,1n];
  for(const [category,w] of Object.entries(c.scoring.categoryWeights)){
   const all=e.checks.filter(x=>x.category===category);if(!all.length)continue;
   // A capping check (stay-still, owner 2026-10-22) is not averaged in; its credit is the ceiling of the category ratio.
   const checks=all.filter(x=>!x.capsCategory),caps=all.filter(x=>x.capsCategory);
   const max=checks.reduce((a,x)=>add(a,num(x.weight)),[0n,1n]);
   const points=checks.reduce((a,x)=>add(a,mul(num(x.weight),num(x.credit))),[0n,1n]);
   let ratio=max[0]?mul(points,[max[1]!,max[0]!]):[0n,1n];
   for(const k of caps){const c=num(k.credit);if(c[0]!*ratio[1]!<ratio[0]!*c[1]!)ratio=c;}
   available=add(available,num(w));earned=add(earned,mul(num(w),ratio));
  }
  expect(actual.credit.numerator*earned[1]!*available[0]!).toBe(earned[0]!*available[1]!*actual.credit.denominator);
  expect(actual.passed).toBe(e.score.passed);expect(actual.critical).toBe(e.criticalFindings.length>0);
  const grade=gradePublication(p,{"full-0":{type:"full-practical",values:leafValues(s,spec)}},["full-0"]),maximum=decimalPoints(p.assessment.maximum);
  expect(BigInt(grade.numerator)*actual.credit.denominator*maximum.denominator).toBe(BigInt(grade.denominator)*actual.credit.numerator*maximum.numerator);
 }
 expect(gradePublication(p,{},[])).toEqual({numerator:"0",denominator:"1"});
 expect(gradePublication(p,{"full-0":{type:"full-practical",values:leafValues(c.initialSettings,spec)}},[])).toEqual({numerator:"0",denominator:"1"});
});
it("pins rubric/case/evaluator and refuses revisions or client score/key injection",()=>{
 const p=practicalFixture(),key=p.privateItems[0]!;if(key.type!=="full-practical")throw new Error();
 const c=CASES[0]!;expect(caseVersion({...c,scoring:{...c.scoring,passThreshold:c.scoring.passThreshold+1}})).not.toBe(key.caseRef.version);
 for(const mutate of [(x:typeof p)=>{x.privateItems[0]!.ref={...x.privateItems[0]!.ref,version:"new"};},(x:typeof p)=>{if(x.privateItems[0]!.type!=="single-choice")x.privateItems[0]!.evaluatorVersion="new";},(x:typeof p)=>{if(x.assessment.track==="full-practical")x.assessment.items[0]!.caseRef.version="new";}]){const x=structuredClone(p);mutate(x);expect(()=>validatePublication(x)).toThrow();}
 const values=leafValues(c.initialSettings,settingsSpec(c));expect(()=>gradePublication(p,{"full-0":{type:"full-practical",values:{...values,score:100}}},["full-0"])).toThrow();
});
it("zero-weight PA marker gates do not become a numeric deduction",()=>{
 const c=CASES[0]!,s=structuredClone(c.initialSettings);s.sideMarker=null;const a=fullPractical(c,s);
 s.sideMarker="L";s.markerPosition={x:0.9,y:0.9};const b=fullPractical(c,s);
 expect(a.credit).toEqual(b.credit);expect(a.critical).toBe(true);expect(a.passed).toBe(false);
});
