/** Synthetic local-only engineering data. Never imported by application code or seeded into a provider. */
import { chestPaErect } from "../../src/data/cases/chest-pa-erect";
import { caseVersion,ASSESS_EVALUATOR } from "../../src/features/assess/server-validation";
import type { AssessmentPublication } from "../../src/features/assess/server-contracts";
export const fixtureId=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
export function mixedFixture(version="1"):AssessmentPublication {
  const review={sources:[{reference:"Synthetic engineering fixture; not clinical",licenceEvidence:"Own fixture; no external question"}],reviewedBy:"Engineering only",reviewedAt:"2026-10-20T00:00:00.000Z",scope:"Local test only. No medical approval. Background, criteria and Marker dependencies unapproved for publication."};
  const sid=chestPaErect.rules.find(r=>r.kind==="range"&&r.setting==="sidCm")!;
  return {schemaVersion:1,assessment:{schemaVersion:1,ref:{id:fixtureId(10),version},name:"Synthetic local mixed test",track:"mixed",maximum:"7.5",policy:{durationSeconds:3600,maxAttempts:2,gradeVisibility:"hidden"},items:[
    {schemaVersion:1,ref:{id:"letter",version},contentLanguage:"en",type:"single-choice",prompt:"Select a synthetic label.",options:[{id:"a",text:"Label A"},{id:"b",text:"Label B"}]},
    {schemaVersion:1,ref:{id:"distance",version},contentLanguage:"en",type:"simulator-part",prompt:"Set the requested synthetic distance.",presentation:{controls:["sidCm"],sceneElements:[]}},
    {schemaVersion:1,ref:{id:"marker",version},contentLanguage:"en",type:"simulator-part",prompt:"Synthetic combined settings.",presentation:{controls:["kvp","sideMarker","markerPosition.x","markerPosition.y"],sceneElements:["detector","marker"]}},
  ]},itemMarks:[{item:{id:"letter",version},maximum:"1"},{item:{id:"distance",version},maximum:"1"},{item:{id:"marker",version},maximum:"3"}],privateItems:[
    {schemaVersion:1,ref:{id:"letter",version},type:"single-choice",correctOptionId:"b",review},
    {schemaVersion:1,ref:{id:"distance",version},type:"simulator-part",caseRef:{id:chestPaErect.id,version:caseVersion(chestPaErect)},evaluatorVersion:ASSESS_EVALUATOR,fixedSettings:structuredClone(chestPaErect.initialSettings),mutablePaths:["sidCm"],criteria:[{ruleId:sid.id,part:"sidCm",maximum:"1"}],review},
    {schemaVersion:1,ref:{id:"marker",version},type:"simulator-part",caseRef:{id:chestPaErect.id,version:caseVersion(chestPaErect)},evaluatorVersion:ASSESS_EVALUATOR,fixedSettings:structuredClone(chestPaErect.initialSettings),mutablePaths:["kvp","sideMarker","markerPosition.x","markerPosition.y"],criteria:[{ruleId:chestPaErect.rules.find(r=>r.kind==="technique"&&r.check==="kvp-band")!.id,part:"kvp",maximum:"1"},{ruleId:chestPaErect.rules.find(r=>r.kind==="marker")!.id,part:"marker-side",maximum:"1"},{ruleId:chestPaErect.rules.find(r=>r.kind==="marker")!.id,part:"marker-placement",maximum:"1"}],review},
  ]};
}
