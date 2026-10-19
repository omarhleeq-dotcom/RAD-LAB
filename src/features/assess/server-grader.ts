/** Server-only grader; never accepts a case, key, criterion or score from a student request. */
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { evaluate } from "@/features/evaluation/engine";
import { collimatedField,markerRect,rectInside,rectsOverlap,regionToRect } from "@/features/simulation/geometry";
import { isMarkerWrongSide } from "@/features/simulation/marker-rule";
import type { AssessmentPublication } from "./server-contracts";
import type { ItemAnswer } from "./contracts";
import { decimalPoints,earnedPoints,scalePoints,type Fraction } from "./policies";
import { reconstruct,resolveCase,settingsSpec,validatePublication } from "./server-validation";

const zero=():Fraction=>({numerator:0n,denominator:1n});
function fraction(n:bigint,d:bigint):Fraction {
  const gcd=(a:bigint,b:bigint):bigint=>b===0n?a:gcd(b,a%b);const g=gcd(n,d);
  return {numerator:n/g,denominator:d/g};
}
const add=(a:Fraction,b:Fraction)=>fraction(a.numerator*b.denominator+b.numerator*a.denominator,a.denominator*b.denominator);
const multiply=(a:Fraction,b:Fraction)=>fraction(a.numerator*b.numerator,a.denominator*b.denominator);
const divide=(a:Fraction,b:Fraction)=>{if(!b.numerator)throw new Error("Zero denominator");return fraction(a.numerator*b.denominator,a.denominator*b.numerator);};
const credit=(n:number):Fraction=>{if(![0,0.5,1].includes(n))throw new Error("Unsupported credit");return {numerator:BigInt(n*2),denominator:2n};};

/** Split existing marker predicates, never its combined partial credit. Presence is required for either part. */
export function markerPartCredit(c:RadCase,s:SimulationSettings,part:string):Fraction {
  if(!s.sideMarker)return zero();
  if(part==="marker-side") return credit(isMarkerWrongSide(c.positioning,{side:s.sideMarker,position:s.markerPosition},s.choices)?0:1);
  if(part!=="marker-placement")throw new Error("Unknown marker part");
  const rect=markerRect(s.markerPosition,c.positioning.markerSizeCm,c.detector);
  const inside=rectInside(rect,{x1:0,y1:0,x2:c.detector.widthCm,y2:c.detector.heightCm})&&rectInside(rect,collimatedField(s,c.detector));
  return credit(inside&&!(c.positioning.markerKeepOut??[c.requiredAnatomy]).some(zone=>rectsOverlap(rect,regionToRect(zone)))?1:0);
}

/** Full rubric: preserve category/check weights and exclusions; critical gates still use unchanged engine semantics.
 * The gate does not alter the numeric mark in Practice and must not be converted into a numeric penalty here.
 */
export function fullPractical(c:RadCase,s:SimulationSettings):{credit:Fraction;passed:boolean;critical:boolean} {
  const evaluation=evaluate(c,s);let earned=zero(),available=zero();
  for(const [category,weight] of Object.entries(c.scoring.categoryWeights)) {
    const checks=evaluation.checks.filter(check=>check.category===category);if(!checks.length)continue;
    const max=checks.reduce((sum,check)=>add(sum,decimalPoints(String(check.weight))),zero());
    const points=checks.reduce((sum,check)=>add(sum,multiply(decimalPoints(String(check.weight)),credit(check.credit))),zero());
    const w=decimalPoints(String(weight));available=add(available,w);
    if(max.numerator)earned=add(earned,multiply(w,divide(points,max)));
  }
  return {credit:available.numerator?divide(earned,available):zero(),passed:evaluation.score.passed,critical:evaluation.criticalFindings.length>0};
}

export function gradePublication(input:AssessmentPublication,answers:Record<string,ItemAnswer>,locked:readonly string[]):{numerator:string;denominator:string} {
  const {publication,specs}=validatePublication(input);
  if(Object.keys(answers).some(id=>!publication.assessment.items.some(i=>i.ref.id===id)) || locked.some(id=>!publication.assessment.items.some(i=>i.ref.id===id&&i.type!=="single-choice"))) throw new Error("Unknown saved item");
  let earned=zero(),available=zero();
  for(const item of publication.assessment.items) {
    const key=publication.privateItems.find(p=>p.ref.id===item.ref.id)!;
    const maximum=publication.itemMarks.find(m=>m.item.id===item.ref.id)!.maximum;
    available=add(available,decimalPoints(maximum));
    const answer=answers[item.ref.id];
    if(!answer)continue; // Missing is exactly zero, never guessed from initialSettings.
    if(answer.type!==item.type)throw new Error("Saved answer type mismatch");
    if(item.type==="single-choice"&&answer.type==="single-choice"&&key.type==="single-choice") {
      if(answer.optionId!==null&&!item.options.some(o=>o.id===answer.optionId))throw new Error("Saved option mismatch");
      if(answer.optionId===key.correctOptionId)earned=add(earned,decimalPoints(maximum));
    } else if(answer.type!=="single-choice"&&key.type!=="single-choice") {
      const c=resolveCase(key.caseRef,key.evaluatorVersion);
      const s=reconstruct(key.type==="simulator-part"?key.fixedSettings:c.initialSettings,specs[item.ref.id]??settingsSpec(c),answer.values);
      if(!locked.includes(item.ref.id))continue; // Saved but never exposed simulation has no assessment credit.
      if(key.type==="full-practical")earned=add(earned,multiply(decimalPoints(maximum),fullPractical(c,s).credit));
      else {
        const checks=evaluate(c,s).checks;
        earned=add(earned,earnedPoints(key.criteria.map(cr=>{
          const rule=c.rules.find(r=>r.id===cr.ruleId)!;
          const check=checks.find(r=>r.ruleId===cr.ruleId);
          if(rule.kind!=="marker"&&!check)throw new Error("Criterion inapplicable");
          return {maximum:cr.maximum,credit:rule.kind==="marker"?markerPartCredit(c,s,cr.part):credit(check!.credit)};
        })));
      }
    }
  }
  const result=fraction(earned.numerator*available.denominator,earned.denominator*available.numerator);
  const scaled=scalePoints(result,"1",publication.assessment.maximum);
  const reduced=fraction(scaled.numerator,scaled.denominator);
  return {numerator:String(reduced.numerator),denominator:String(reduced.denominator)};
}
