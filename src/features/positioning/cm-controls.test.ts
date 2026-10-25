import { normalizedSize, normalizedCentreX, normalizedCentreY } from "./cm-controls";
import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { readFileSync } from "node:fs";
import { collimatedField } from "@/features/simulation/geometry";
import { evaluate } from "@/features/evaluation/engine";
import { wristLateral } from "@/data/cases/wrist-lateral";
const sizes = [...new Map(CASES.map(c => [`${c.detector.widthCm}x${c.detector.heightCm}`, c.detector])).values()];
describe("cm controls preserve physical inputs across registered detectors", () => {
  for (const d of sizes) it(`${d.widthCm}x${d.heightCm}: size and centre round trips`, () => {
    for (const size of [14, d.widthCm / 2, d.widthCm]) expect(normalizedSize(size, d.widthCm) * d.widthCm).toBeCloseTo(size, 12);
    for (const size of [14, d.heightCm / 2, d.heightCm]) expect(normalizedSize(size, d.heightCm) * d.heightCm).toBeCloseTo(size, 12);
    for (const cm of [0, 7, 14]) {
      expect((normalizedCentreX(cm, d.widthCm) * d.widthCm) / 2).toBeCloseTo(cm, 12);
      expect(((normalizedCentreY(cm, d.heightCm) + 1) / 2) * d.heightCm).toBeCloseTo(cm, 12);
    }
    const f = collimatedField({centralRay:{x:0,y:0},collimation:{width:normalizedSize(14,d.widthCm),height:normalizedSize(14,d.heightCm)}}, d);
    expect(f.x2-f.x1).toBe(14); expect(f.y2-f.y1).toBe(14);
  });
  it("the four UI handlers do not quantize normalized centimetres", () => {
    const source=readFileSync("src/features/positioning/PositioningView.tsx","utf8");
    for(const key of ["centerX","centerY","collWidth","collHeight"]){const line=source.split("\n").find(l=>l.includes(`t("${key}")`))!;expect(line.split("onChange=")[1]).not.toContain("roundTo");}
  });
  it("14 cm is exactly the lateral excess boundary; increasing it still counts",()=>{
    const c=wristLateral;
    const base={...c.initialSettings,projection:c.requiredProjection,rotationDeg:0,centralRay:{x:0,y:2*11/24-1},sideMarker:"L" as const};
    const run=(w:number)=>evaluate(c,{...base,collimation:{width:w/18,height:10/24}}).checks.find(k=>k.ruleId==="collimation-excess")!.outcome;
    expect(run(14)).toBe("pass");expect(run(14.004)).toBe("partial");
  });
});
