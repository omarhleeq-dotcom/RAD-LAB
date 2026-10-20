/** Synthetic local-only publication wrapper; existing cases exercise engineering compatibility, not medical approval. */
import {CASES} from "../../src/data/cases";
import {ASSESS_EVALUATOR,caseVersion} from "../../src/features/assess/server-validation";
import type {AssessmentPublication} from "../../src/features/assess/server-contracts";
import {validatePracticalContent} from "../../src/features/assess/server-practical";
export const fixtureId=(n:number)=>`00000000-0000-0000-0000-${String(n).padStart(12,"0")}`;
export function practicalFixture(version="1",cases=CASES.slice(0,2)):AssessmentPublication{
 const items=cases.map((c,n)=>({schemaVersion:1 as const,ref:{id:`full-${n}`,version:"1"},type:"full-practical" as const,contentLanguage:"en" as const,prompt:`Local engineering fixture ${n+1}. Configure all settings.`,caseRef:{id:c.id,version:caseVersion(c)}}));
 return {schemaVersion:1,assessment:{schemaVersion:1,ref:{id:fixtureId(10),version},name:"Synthetic local practical",track:"full-practical",maximum:"73.25",policy:{durationSeconds:3600,maxAttempts:2,gradeVisibility:"hidden"},items},itemMarks:items.map((i,n)=>({item:i.ref,maximum:n===0?"3":"7"})),privateItems:items.map(i=>({schemaVersion:1,type:"full-practical",ref:i.ref,caseRef:i.caseRef,evaluatorVersion:ASSESS_EVALUATOR,review:{sources:[{reference:"Existing case, engineering fixture only",licenceEvidence:"Not licensed for an assessment publication by this fixture"}],reviewedBy:"Synthetic test",reviewedAt:"2026-10-20T00:00:00.000Z",scope:"Local engineering only; not O108 review or clinical approval"}}))};
}
export function practicalSnapshot(){const {publication,views}=validatePracticalContent(practicalFixture());return {attemptId:fixtureId(99),ack:{operationId:"",revision:0,serverTime:new Date().toISOString(),deadline:new Date(Date.now()+3600000).toISOString(),state:"active" as const,lockedItemIds:[] as string[]},assessment:publication.assessment,answers:{},views};}
