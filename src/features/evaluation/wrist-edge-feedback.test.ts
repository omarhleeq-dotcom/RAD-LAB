import { expect, it } from "vitest";
import { wristPa } from "@/data/cases/wrist-pa";
import { evaluate } from "./engine";
import { comparisonVersion } from "./comparison-version";
import { PRACTICE_EVALUATION_VERSION } from "./version";
it("optional edge wording preserves all numeric outcomes and comparison identity", async () => {
 const plain={...wristPa,rules:wristPa.rules.map(r=>r.kind==="coverage"?({...r,excessSides:undefined}):r)};
 expect(await comparisonVersion(wristPa,PRACTICE_EVALUATION_VERSION)).toBe(await comparisonVersion(plain,PRACTICE_EVALUATION_VERSION));
 for(const [w,h,edges] of [[1,10/24,["left","right"]],[6/18,1,["top","bottom"]]] as const){
 const s={...wristPa.initialSettings,projection:wristPa.requiredProjection,centralRay:{x:0,y:11/12-1},collimation:{width:w,height:h}};
 const a=evaluate(wristPa,s), b=evaluate(plain,s);expect(a.score).toEqual(b.score);expect(a.variants).toEqual(b.variants);
 const fb=a.checks.find(k=>k.ruleId==="collimation-excess")!.feedback;
 for(const edge of edges)expect(fb.en).toContain(`${edge} edge`);
 expect(a.checks.find(k=>k.ruleId==="collimation-clipping")!.feedback.en).not.toContain("Open the field");
 }
});
