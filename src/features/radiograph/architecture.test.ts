import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
const src = (p: string) => readFileSync(p, "utf8");
/** Source without comments, so the guards inspect code, not prose. */
const code = (p: string) => src(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const prod = (dir: string) => files(path.join(root, dir)).filter((f) => /\.tsx?$/.test(f) && !/\.test\.|test-utils/.test(f));

describe("architecture guards (CLAUDE.md rule 3: scoring never depends on rendering)", () => {
  const logicDirs = ["evaluation", "scoring", "technique", "patient", "simulation", "exam"];
  it("scoring / evaluation / technique / patient logic never imports the renderer or reads pixels", () => {
    for (const f of logicDirs.flatMap(prod).filter((f) => !f.endsWith(".tsx"))) {
      const text = src(f);
      expect(text, f).not.toMatch(/features\/radiograph|from "\.\.\/radiograph|ImageData|getImageData|<canvas|toDataURL/);
    }
  });

  it("the renderer never scores, evaluates or imports the engine", () => {
    for (const f of prod("radiograph")) {
      const text = src(f);
      expect(text, f).not.toMatch(/computeScore|features\/scoring|evaluation\/engine|\bevaluate\(/);
    }
  });

  it("pipeline and plan are pure: no React, DOM, clock or randomness", () => {
    for (const f of ["pipeline.ts", "plan.ts", "tuning.ts"]) {
      const text = src(path.join(root, "radiograph", f));
      expect(text, f).not.toMatch(/from "react"|document\.|window\.|Math\.random|Date\.now|performance\.now|crypto\./);
    }
  });

  it("no module in features/ uses uncontrolled randomness", () => {
    for (const f of prod(".")) expect(src(f), f).not.toMatch(/Math\.random|crypto\.getRandomValues/);
  });

  it("the canvas is LTR and the renderer is locale-agnostic, so RTL never mirrors anatomy or the marker", () => {
    const canvas = src(path.join(root, "radiograph", "RadiographCanvas.tsx"));
    expect(canvas).toMatch(/direction: "ltr"/);
    expect(canvas).toMatch(/ctx\.direction = "ltr"/);
    for (const f of ["RadiographCanvas.tsx", "pipeline.ts", "plan.ts"]) {
      expect(code(path.join(root, "radiograph", f)), f).not.toMatch(/useLocale|rtl|scale\(-1|mirror|flipX/i);
    }
  });

  it("result UI uses logical CSS only (no physical left/right utilities) in the new components", () => {
    for (const f of [path.join(root, "radiograph", "RadiographEffects.tsx"), path.join(root, "patient", "PatientInstructionsPanel.tsx"), path.join(root, "evaluation", "ResultImage.tsx")]) {
      expect(src(f), f).not.toMatch(/className="[^"]*\b(ml|mr|pl|pr|left|right|text-left|text-right|border-l|border-r)-/);
    }
  });
});
