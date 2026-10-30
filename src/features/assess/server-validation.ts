/** Trusted Node-side publication boundary. Never imported from the browser. */
import { createHash } from "node:crypto";
import { CASES } from "@/data/cases";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { PRACTICE_EVALUATION_VERSION } from "@/features/evaluation/version";
import type { AssessmentPublication } from "./server-contracts";
import { validateProvenanceV2 } from "./provenance-v2";
import type { AssessmentPublicationV2 } from "./server-contracts-v2";
import { assertAttemptPolicy, assertAssessmentVersion, decimalPoints, earnedPoints } from "./policies";
import { ruleParts } from "./rule-parts";

export type AnswerSpec = Record<string, {kind:"number";min:number;max:number} | {kind:"enum";values:unknown[]}>;
export const ASSESS_EVALUATOR = "assess-grader/1";
export function caseVersion(c: RadCase): string {
  // Pin ALL case data + unchanged evaluation identity. New runtime semantics require ASSESS_EVALUATOR bump.
  return createHash("sha256").update(JSON.stringify([ASSESS_EVALUATOR,PRACTICE_EVALUATION_VERSION,c])).digest("hex");
}
export function resolveCase(ref: {id:string;version:string}, evaluator: string): RadCase {
  const c=CASES.find(c=>c.id===ref.id);
  if(!c || ref.version!==caseVersion(c) || evaluator!==ASSESS_EVALUATOR) throw new Error("Unsupported pinned evaluator/case");
  return c;
}
function object(v: unknown): asserts v is Record<string,unknown> {
  if(!v || typeof v!=="object" || Array.isArray(v)) throw new Error("Expected object");
}
function keys(v: unknown, allowed: string[]): asserts v is Record<string,unknown> {
  object(v); if(Object.keys(v).some(k=>!allowed.includes(k))) throw new Error("Unknown field");
}
function text(v:unknown,max=100): asserts v is string {
  if(typeof v!=="string" || !v.trim() || v.length>max) throw new Error("Invalid text");
}
function ref(v:unknown) {
  keys(v,["id","version"]);text(v.id);text(v.version);
  if(!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(v.id)||["constructor","prototype"].includes(v.id))throw new Error("Invalid reference identity");
}
function array(v:unknown,max=200): asserts v is unknown[] {
  if(!Array.isArray(v) || v.length>max) throw new Error("Invalid list");
}
function canonical(v:unknown):string {
  return JSON.stringify(v,(_k,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
}
function safeTree(v:unknown): void {
  if(v && typeof v==="object") for(const [k,value] of Object.entries(v)) {
    if(["__proto__","prototype","constructor"].includes(k)) throw new Error("Unsafe path");
    safeTree(value);
  }
}
function positive(v:unknown): asserts v is string {
  text(v);if(decimalPoints(v).numerator<=0n) throw new Error("Non-positive marks");
}
function equalPoints(a:{numerator:bigint;denominator:bigint},b:{numerator:bigint;denominator:bigint}) {
  return a.numerator*b.denominator===b.numerator*a.denominator;
}
export function settingsSpec(c:RadCase): AnswerSpec {
  const spec:AnswerSpec={};
  for(const [key,bounds] of Object.entries(c.controls)) if(bounds) spec[key]={kind:"number",min:bounds.min,max:bounds.max};
  for(const path of ["centralRay.x","centralRay.y","markerPosition.x","markerPosition.y"]) spec[path]={kind:"number",min:-1,max:1};
  for(const path of ["collimation.width","collimation.height"]) spec[path]={kind:"number",min:c.positioning.minCollimation,max:1};
  const enums:Record<string,unknown[]>={projection:c.availableProjections,sideMarker:[null,"L","R"],
    exposureMode:c.technique.aec ? ["manual","aec"] : ["manual"],
    aecChambers:[[],["left"],["center"],["right"],["left","center"],["left","right"],["center","right"],["left","center","right"]],
    motionInstruction:c.availableMotionInstructions};
  if(c.availableBreathing) enums.breathing=c.availableBreathing;
  if(c.initialSettings.chinPosition!==undefined) enums.chinPosition=["tucked","elevated"];
  if(c.initialSettings.shoulderPosition!==undefined) enums.shoulderPosition=["relaxed","rolled-forward"];
  for(const choice of c.choiceControls??[]) enums[`choices.${choice.id}`]=choice.options.map(o=>o.id);
  for(const [key,values] of Object.entries(enums)) spec[key]={kind:"enum",values};
  return spec;
}
export function validateValues(spec:AnswerSpec,values:unknown): asserts values is Record<string,unknown> {
  object(values);
  if(Object.keys(values).length!==Object.keys(spec).length) throw new Error("Incomplete settings");
  for(const [path,value] of Object.entries(values)) {
    const s=spec[path];
    if(!s || (s.kind==="number" ? typeof value!=="number" || !Number.isFinite(value) || value<s.min || value>s.max
      : !s.values.some(v=>JSON.stringify(v)===JSON.stringify(value)))) throw new Error("Invalid mutable value");
  }
}
export function leafValues(settings:SimulationSettings,spec:AnswerSpec):Record<string,unknown> {
  return Object.fromEntries(Object.keys(spec).map(path=>[path,path.split(".").reduce<unknown>((v,k)=>{
    object(v);return v[k];
  },settings)]));
}
export function reconstruct(base:SimulationSettings,spec:AnswerSpec,values:unknown):SimulationSettings {
  validateValues(spec,values);
  const out=structuredClone(base);
  for(const [path,value] of Object.entries(values)) {
    const parts=path.split(".");let target=out as unknown as Record<string,unknown>;
    for(const k of parts.slice(0,-1)) {object(target[k]);target=target[k];}
    target[parts.at(-1)!]=structuredClone(value);
  }
  // In particular: sideMarker changes never reposition markerPosition.
  return out;
}

export function validatePublication(input:unknown): {publication:AssessmentPublication;specs:Record<string,AnswerSpec>} {
  return validatePublicationContract(input, 1) as {publication:AssessmentPublication;specs:Record<string,AnswerSpec>};
}
export function validatePublicationV2(input:unknown): {publication:AssessmentPublicationV2;specs:Record<string,AnswerSpec>} {
  return validatePublicationContract(input, 2) as unknown as {publication:AssessmentPublicationV2;specs:Record<string,AnswerSpec>};
}
function validatePublicationContract(input:unknown, schema:1|2) {
  // Bound before deep traversal. Only JSON from the trusted authoring boundary is accepted.
  const raw=JSON.stringify(input);
  if(!raw || Buffer.byteLength(raw)>2_000_000) throw new Error("Publication too large");
  const value:unknown=JSON.parse(raw);safeTree(value);
  keys(value,["schemaVersion","assessment","itemMarks","privateItems"]);
  if(value.schemaVersion!==schema) throw new Error("Unsupported publication");
  const a=value.assessment;keys(a,["schemaVersion","ref","name","policy","maximum","track","items"]);
  ref(a.ref);text(a.name,200);positive(a.maximum);
  keys(a.policy,["durationSeconds","maxAttempts","gradeVisibility"]);
  if(a.policy.durationSeconds!==null && (typeof a.policy.durationSeconds!=="number" || a.policy.durationSeconds>604800)) throw new Error("Duration exceeds operational ceiling");
  if(typeof a.policy.maxAttempts!=="number" || a.policy.maxAttempts>1000) throw new Error("Attempt ceiling");
  array(a.items);array(value.itemMarks);array(value.privateItems);
  for(const item of a.items) {
    keys(item,["schemaVersion","ref","prompt","contentLanguage","type","options","presentation","caseRef"]);
    ref(item.ref);text(item.prompt,10000);
    if(schema===2 && item.type==="written-answer") {
      if(item.options!==undefined || item.presentation!==undefined || item.caseRef!==undefined) throw Error("Wrong written fields");
    } else if(item.type==="single-choice") {
      if(item.presentation!==undefined || item.caseRef!==undefined) throw new Error("Wrong item fields");
      array(item.options,50);for(const o of item.options) { keys(o,["id","text"]);text(o.id);text(o.text,5000); }
    } else if(item.type==="simulator-part") {
      if(item.options!==undefined || item.caseRef!==undefined) throw new Error("Wrong item fields");
      keys(item.presentation,["controls","sceneElements"]);
      for(const list of [item.presentation.controls,item.presentation.sceneElements]) {array(list,100);for(const v of list)text(v);}
    } else if(item.type==="full-practical") {
      if(item.options!==undefined || item.presentation!==undefined) throw new Error("Wrong item fields");ref(item.caseRef);
    } else throw new Error("Unsupported item");
  }
  for(const mark of value.itemMarks) {keys(mark,["item","maximum"]);ref(mark.item);positive(mark.maximum);}
  for(const p of value.privateItems) {
    keys(p,["schemaVersion","ref",schema===1?"review":"provenance","type","correctOptionId","caseRef","evaluatorVersion","fixedSettings","mutablePaths","criteria"]);
    if(p.schemaVersion!==schema) throw new Error("Unsupported key");ref(p.ref);
    if(schema===2) validateProvenanceV2(p.provenance,p.type as string);
    if(schema===1 || (p.provenance as {kind:string}).kind==='simulator-reviewed') {
    const review=schema===1?p.review:(p.provenance as {review:unknown}).review;
    keys(review,["sources","reviewedBy","reviewedAt","scope"]);text(review.reviewedBy);text(review.scope,2000);text(review.reviewedAt);
    if(new Date(review.reviewedAt).toISOString()!==review.reviewedAt) throw new Error("Review date");
    array(review.sources,50);if(!review.sources.length) throw new Error("Sources required");
    for(const source of review.sources) {keys(source,["reference","licenceEvidence"]);text(source.reference,2000);text(source.licenceEvidence,2000);}
    }
    if(schema===2 && p.type==="written-answer") {
      if([p.correctOptionId,p.caseRef,p.evaluatorVersion,p.fixedSettings,p.mutablePaths,p.criteria].some(v=>v!==undefined)) throw Error("Wrong written key fields");
    } else if(p.type==="single-choice") {
      text(p.correctOptionId);if([p.caseRef,p.evaluatorVersion,p.fixedSettings,p.mutablePaths,p.criteria].some(v=>v!==undefined)) throw new Error("Wrong key fields");
    } else {
      if(p.correctOptionId!==undefined) throw new Error("Wrong key fields");
      ref(p.caseRef);text(p.evaluatorVersion);
      if(p.type==="simulator-part") {
        object(p.fixedSettings);array(p.mutablePaths,100);for(const path of p.mutablePaths)text(path);
        array(p.criteria);if(!p.criteria.length) throw new Error("Missing criteria");
        for(const criterion of p.criteria) {keys(criterion,["ruleId","part","maximum"]);text(criterion.ruleId);text(criterion.part);positive(criterion.maximum);}
      } else if(p.type!=="full-practical" || [p.fixedSettings,p.mutablePaths,p.criteria].some(v=>v!==undefined)) throw new Error("Unsupported key");
    }
  }
  const publication=value as unknown as AssessmentPublication;
  if(schema===1) assertAssessmentVersion(publication.assessment);
  else {
    const decodedItems=a.items as {schemaVersion:number;type:string;contentLanguage:string;ref:{id:string}}[];
    if(a.schemaVersion!==2 || !a.items.length || a.items.length>200 || !['mixed','full-practical'].includes(a.track as string) || new Set(decodedItems.map(i=>i.ref.id)).size!==a.items.length) throw Error('Invalid v2 assessment');
    assertAttemptPolicy(publication.assessment.policy);
    const automatic=decodedItems.filter(i=>i.type!=='written-answer');
    if(decodedItems.some(i=>i.schemaVersion!==2 || i.contentLanguage!=='en' || (i.type==='written-answer' && a.track!=='mixed')) || decodedItems.filter(i=>i.type==='written-answer').length>10) throw Error('Invalid v2 items');
    if(automatic.length) assertAssessmentVersion({...publication.assessment,schemaVersion:1,items:automatic.map(i=>({...i,schemaVersion:1}))} as unknown as AssessmentPublication['assessment']);
  }
  if(publication.itemMarks.length!==a.items.length || publication.privateItems.length!==a.items.length) throw new Error("Incomplete publication");
  const specs:Record<string,AnswerSpec>=Object.create(null);
  for(const item of publication.assessment.items) {
    const same=(r:{id:string;version:string})=>r.id===item.ref.id&&r.version===item.ref.version;
    const marks=publication.itemMarks.filter(m=>same(m.item)), privateItems=publication.privateItems.filter(p=>same(p.ref));
    if(marks.length!==1 || privateItems.length!==1) throw new Error("Ambiguous pinned item");
    const p=privateItems[0]!;if(p.type!==item.type) throw new Error("Key type mismatch");
    if(p.type==="single-choice" && item.type==="single-choice") {
      if(!item.options.some(o=>o.id===p.correctOptionId)) throw new Error("Invalid answer key");specs[item.ref.id]={};
    } else if((p.type as string)!=="written-answer" && p.type!=="single-choice") {
      const c=resolveCase(p.caseRef,p.evaluatorVersion), all=settingsSpec(c);
      if(p.type==="full-practical") {
        if(item.type!=="full-practical" || !sameCase(item.caseRef,p.caseRef)) throw new Error("Case mismatch");specs[item.ref.id]=all;
      } else {
        if(!p.mutablePaths.length || new Set(p.mutablePaths).size!==p.mutablePaths.length || p.mutablePaths.some(path=>!all[path])) throw new Error("Invalid mutable paths");
        // Entire reviewed background must be structurally valid and within selectable bounds.
        validateValues(all,leafValues(p.fixedSettings,all));
        // Reject undeclared roots/nested leaves: no hidden model override in background.
        if(canonical(p.fixedSettings)!==canonical(reconstruct(c.initialSettings,all,leafValues(p.fixedSettings,all)))) throw new Error("Unexpected background fields");
        specs[item.ref.id]=Object.fromEntries(p.mutablePaths.map(path=>[path,all[path]!]));
        if(new Set(p.criteria.map(cr=>`${cr.ruleId}/${cr.part}`)).size!==p.criteria.length) throw new Error("Duplicate criteria");
        for(const cr of p.criteria) {
          const rule=c.rules.find(r=>r.id===cr.ruleId);
          if(!rule || !ruleParts(rule).some(part=>part.part===cr.part)) throw new Error("Unknown part");
          // aec-chambers disappears in manual mode; unsupported variable applicability fails closed.
          if(rule.kind==="technique" && rule.check==="aec-chambers") throw new Error("Conditional criterion needs reviewed adapter");
        }
        const sum=earnedPoints(p.criteria.map(cr=>({maximum:cr.maximum,credit:{numerator:1n,denominator:1n}})));
        if(!equalPoints(sum,decimalPoints(marks[0]!.maximum))) throw new Error("Part marks mismatch");
      }
    }
  }
  // Item points are a raw scale; the final configured maximum may differ and is converted once.
  return {publication,specs};
}
function sameCase(a:{id:string;version:string},b:{id:string;version:string}) {return a.id===b.id&&a.version===b.version;}
