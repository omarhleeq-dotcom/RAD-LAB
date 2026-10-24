import { describe, expect, it } from "vitest";
import presentation from "./catalogue-presentation.json";
import graphics from "./library-graphics.json";
import { ExamGraphic, STROKE_WIDTH } from "./ExamGraphic";
import { build } from "../../../scripts/library-graphics/build-library-graphics.mjs";
import { readFileSync } from "node:fs";

const ART = graphics.graphics as Record<string, { role: string; d: string }[]>;
const used = new Set<string>([
  ...presentation.regions.map((r) => r.graphic),
  ...Object.values(presentation.graphics),
  ...Object.values(presentation.projectionGraphics).flatMap((v) => Object.values(v)),
]);

describe("library graphics (RAD-069 B2b)", () => {
  it("draws every graphic the catalogue presentation names, one per region and per exam projection", () => {
    for (const kind of used) expect(ART[kind], kind).toBeDefined();
    expect(ART.generic).toBeDefined();
    expect(new Set(presentation.regions.map((r) => r.graphic)).size).toBe(presentation.regions.length);
  });
  it("keeps every path inside the shared viewBox (a stroke half-width clear of the edge) with finite numbers and only absolute M/L/Q/C/Z commands", () => {
    const [w, h] = graphics.viewBox as [number, number];
    for (const [kind, parts] of Object.entries(ART)) {
      expect(parts.length, kind).toBeGreaterThan(1);
      for (const { role, d } of parts) {
        expect(["fill", "bone", "line"]).toContain(role);
        expect(d, kind).toMatch(/^[MLQCZ0-9 .\-]+$/);
        const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
        expect(nums.every(Number.isFinite), kind).toBe(true);
        for (let i = 0; i < nums.length; i += 2) {
          expect(nums[i]!, `${kind} x`).toBeGreaterThanOrEqual(2);
          expect(nums[i]!, `${kind} x`).toBeLessThanOrEqual(w - 2);
          expect(nums[i + 1]!, `${kind} y`).toBeGreaterThanOrEqual(2);
          expect(nums[i + 1]!, `${kind} y`).toBeLessThanOrEqual(h - 2);
        }
      }
    }
  });
  it("renders one style: aria-hidden, no text, one stroke width, currentColor strokes, art-soft fills, no mirroring", () => {
    for (const kind of [...used, "generic", "unknown-kind"]) {
      const svg = ExamGraphic({ kind });
      const props = svg.props as { viewBox: string; "aria-hidden": string; className: string; children: { props: Record<string, unknown> } };
      expect(props["aria-hidden"]).toBe("true");
      expect(props.viewBox).toBe("0 0 240 168");
      expect(props.children.props).toMatchObject({ fill: "none", stroke: "currentColor", strokeWidth: STROKE_WIDTH });
      const json = JSON.stringify(svg);
      expect(json).not.toContain('"type":"text"');
      expect(json).not.toMatch(/transform|scale\(/);
      expect(json).not.toMatch(/strokeWidth":(?!3\.5[,}])/);
      expect(json.match(/var\(--art-soft\)/g)?.length ?? 0).toBe(ART[kind in ART ? kind : "generic"]!.filter((p) => p.role === "fill").length);
    }
  });
  it("is byte-identical to what scripts/library-graphics regenerates from the project's own outlines", () => {
    expect(readFileSync("src/features/platform/library-graphics.json", "utf8")).toBe(build());
  });
});
