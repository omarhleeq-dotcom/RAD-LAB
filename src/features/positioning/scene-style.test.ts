import { describe, expect, it } from "vitest";
import { ANATOMY_FILLS, BODY, CHEST_FILLS, SCENE } from "./scene-style";

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

// RAD-072 1b chest tonal layers (ENGINE_GUIDE "Chest drawing style"). The scene panel is the fixed dark console in BOTH UI themes
// (the tokens are constants, never theme variables), so each pair below holds in the dark and in the light theme alike.
const blend = (a: string, b: string, t: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * t + parseInt(b.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, "0")).join("");
const pill = (fill: string) => blend(SCENE.underStroke, fill, 0.82);

describe("chest tonal layers (RAD-072 1b)", () => {
  it("are constant hex tokens (theme-independent)", () => {
    for (const k of [...CHEST_FILLS, "outline", "boneLine", "detectorFill", "underStroke"] as const) expect(SCENE[k]).toMatch(/^#[0-9a-f]{6}$/);
  });
  it("keeps adjacent filled regions >= 3:1: background / soft tissue / lung air / heart / bone", () => {
    const pairs = [["detectorFill", "soft"], ["soft", "air"], ["air", "heart"], ["soft", "boneFill"], ["air", "boneFill"]] as const;
    for (const [a, b] of pairs) expect(contrast(SCENE[a], SCENE[b]), `${a} / ${b}`).toBeGreaterThanOrEqual(3);
  });
  it("separates the heart from the soft tissue by its outline (one luminance axis cannot also put bones over both at 3:1)", () => {
    for (const fill of ["heart", "soft"] as const) expect(contrast(SCENE.outline, SCENE[fill]), `outline on ${fill}`).toBeGreaterThanOrEqual(3);
    expect(SCENE.heart).not.toBe(SCENE.soft);
  });
  it("keeps meaningful strokes >= 3:1 against every chest fill and the detector background they cross", () => {
    for (const stroke of ["outline", "boneLine"] as const)
      for (const fill of [...CHEST_FILLS.filter((f) => f !== "boneFill"), "detectorFill"] as const) expect(contrast(SCENE[stroke], SCENE[fill]), `${stroke} on ${fill}`).toBeGreaterThanOrEqual(3);
  });
  it("keeps every accent (guide, target, beam) >= 3:1 against a chest fill directly or through its dark under-stroke", () => {
    for (const accent of ["beam", "good", "guide"] as const) {
      expect(contrast(SCENE[accent], SCENE.underStroke)).toBeGreaterThanOrEqual(7);
      for (const fill of CHEST_FILLS) expect(Math.max(contrast(SCENE[accent], SCENE[fill]), contrast(SCENE.underStroke, SCENE[fill])), `${accent} on ${fill}`).toBeGreaterThanOrEqual(3);
    }
  });
  it("keeps label text >= 4.5:1 against its pill composited over every chest fill", () => {
    for (const text of ["label", "guide", "good", "beam"] as const)
      for (const fill of [...CHEST_FILLS, "detectorFill"] as const) expect(contrast(SCENE[text], pill(SCENE[fill])), `${text} on pill over ${fill}`).toBeGreaterThanOrEqual(4.5);
  });
  it("draws the lungs darker than the soft tissue and the bones lighter (X-ray reading order)", () => {
    expect(lum(SCENE.air)).toBeLessThan(lum(SCENE.soft));
    expect(lum(SCENE.boneFill)).toBeGreaterThan(lum(SCENE.soft));
    expect(lum(SCENE.boneLine)).toBeGreaterThan(lum(SCENE.outline));
  });
  it("uses one proportion set in which the shoulders are wider than the thorax and the thorax wider than deep", () => {
    expect(BODY.shoulderW).toBeGreaterThan(BODY.thorax.w);
    expect(BODY.thorax.w).toBeGreaterThan(BODY.thorax.d);
    expect(BODY.head.h).toBeGreaterThan(BODY.head.d);
  });
});
