import { expect, it } from "vitest";
import { pelvisAnchors, pelvisShift } from "./pelvis-model";
import { limbRotationPlan } from "@/features/radiograph/limb-effects";
import { limbRotationValue } from "@/features/radiograph/pipeline";
it("preserves the baseline at zero and never folds over its supported range", () => {
  expect(pelvisAnchors(0).every(a=>a.du===0)).toBe(true);
  for(let d=-15;d<=15;d+=0.25){
    const a=pelvisAnchors(d);
    for(let i=1;i<a.length;i++)expect(a[i]!.u+a[i]!.du).toBeGreaterThan(a[i-1]!.u+a[i-1]!.du);
  }
});
it("has the same signed, bounded displacement for drawing and actual pixel sampling", () => {
  const lm={kind:"limb-warp",model:"pelvis-ap",bands:[{v1:0,v2:1}]} as const;
  const mutable={...lm,bands:[...lm.bands]};
  const p=limbRotationPlan(10,true,mutable)!;
  expect(p.hand!.anchors![0]).toEqual(pelvisAnchors(10));
  expect(limbRotationPlan(10,false,mutable)).toBeNull();
  expect(pelvisShift(0.35,10)).toBeGreaterThan(0);
  expect(pelvisShift(0.46,10)).toBeLessThan(0);
  expect(pelvisShift(0.35,-10)).toBeCloseTo(-pelvisShift(0.35,10));
  const ramp=(u:number)=>u*255;
  expect(limbRotationValue(p,mutable,ramp,0.35,0.5)).not.toBeCloseTo(ramp(0.35),4);
});
