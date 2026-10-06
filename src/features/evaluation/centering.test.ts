import { describe, expect, it } from "vitest";
import { chestPaErect } from "@/data/cases/chest-pa-erect";
import { centeringOnAxis, centeringStatus } from "./centering";

const spec = chestPaErect.positioning.centering;

describe("centeringOnAxis", () => {
  it("detects correct centering at the target and on the tolerance boundary", () => {
    expect(centeringOnAxis(spec.target, spec, "x").state).toBe("ideal");
    expect(centeringOnAxis({ x: 0.08, y: -0.15 }, spec, "x").state).toBe("ideal");
    expect(centeringOnAxis({ x: 0, y: -0.15 + 0.1 }, spec, "y").state).toBe("ideal");
  });

  it("detects off-centre positions with direction", () => {
    const left = centeringOnAxis({ x: -0.5, y: -0.15 }, spec, "x");
    expect(left).toMatchObject({ state: "off", direction: "low" });
    expect(left.offset).toBeCloseTo(-0.5);
    expect(centeringOnAxis({ x: 0, y: 0.6 }, spec, "y")).toMatchObject({ state: "off", direction: "high" });
  });

  it("uses an acceptable band between ideal and off", () => {
    expect(centeringOnAxis({ x: 0.12, y: 0 }, spec, "x").state).toBe("acceptable");
    expect(centeringOnAxis({ x: 0.18, y: 0 }, spec, "x").state).toBe("off");
  });

  it("evaluates axes independently", () => {
    const s = centeringStatus({ x: 0.5, y: -0.15 }, spec);
    expect(s.x.state).toBe("off");
    expect(s.y.state).toBe("ideal");
  });

  it("honours configurable tolerance", () => {
    const strict = { ...spec, idealTolerance: { x: 0.01, y: 0.01 } };
    expect(centeringOnAxis({ x: 0.05, y: 0 }, strict, "x").state).toBe("acceptable");
  });
});
