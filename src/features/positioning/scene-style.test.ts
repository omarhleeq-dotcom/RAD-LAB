import { describe, expect, it } from "vitest";
import { ANATOMY_FILLS, SCENE } from "./scene-style";

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

describe("scene colour code (S13b-2)", () => {
  it("keeps every accent at >= 3:1 against every anatomy / drawing fill it can cross", () => {
    for (const accent of ["beam", "good", "guide"] as const)
      for (const fill of ANATOMY_FILLS) expect(contrast(SCENE[accent], SCENE[fill]), `${accent} on ${fill}`).toBeGreaterThanOrEqual(3);
  });
  it("keeps every accent at >= 7:1 against its dark under-stroke, and the label text on the label pill", () => {
    for (const accent of ["beam", "good", "guide", "label"] as const) expect(contrast(SCENE[accent], SCENE.underStroke)).toBeGreaterThanOrEqual(7);
  });
  it("keeps the anatomy outline visible on the anatomy fills (>= 3:1) and the fills dark (no large light fill)", () => {
    for (const fill of ["trunk", "head", "limb", "limbFar", "lung"] as const) {
      expect(contrast(SCENE.edge, SCENE[fill])).toBeGreaterThanOrEqual(3);
      expect(lum(SCENE[fill])).toBeLessThan(0.12);
    }
  });
  it("keeps the label text legible when its pill is composited over the lightest fill", () => {
    const over = "#46607a";
    const blend = (a: string, b: string, t: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, "0")).join("");
    expect(contrast(SCENE.label, blend(SCENE.underStroke, over, 0.82))).toBeGreaterThanOrEqual(7);
  });
});
