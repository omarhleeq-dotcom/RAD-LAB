import { readFileSync } from "node:fs";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

// Regression: the Arabic breathing / keep-still instructions are ICU `select` on `sex`,
// so every call site must pass { sex } (ResultPanel did not; raw keys + console errors in /ar).
const call = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

describe("patient instruction options need { sex }", () => {
  const breathing = ["deep-inspiration-hold", "expiration-hold", "normal-breathing"] as const;
  const motion = ["remain-still", "relax-and-move"] as const;

  it("format in Arabic for both sexes without errors", () => {
    const errors: unknown[] = [];
    const t = createTranslator({ locale: "ar", messages: ar, namespace: "patient", onError: (e) => errors.push(e) });
    for (const sex of ["female", "male"]) {
      for (const k of breathing) expect(t(`breathingOptions.${k}`, { sex }), k).toMatch(/[؀-ۿ]/);
      for (const k of motion) expect(t(`motionOptions.${k}`, { sex }), k).toMatch(/[؀-ۿ]/);
    }
    expect(errors).toEqual([]);
    expect(en).toBeTruthy();
  });

  it("every component call site passes sex", () => {
    for (const f of ["../features/evaluation/ResultPanel.tsx", "../features/patient/PatientInstructionsPanel.tsx"]) {
      const lines = call(f).split("\n").filter((l) => /(breathingOptions|motionOptions)\./.test(l));
      expect(lines.length, f).toBeGreaterThan(0);
      for (const l of lines) expect(l, `${f}: ${l.trim()}`).toMatch(/sex:\s*radCase\.patient\.sex/);
    }
  });
});
