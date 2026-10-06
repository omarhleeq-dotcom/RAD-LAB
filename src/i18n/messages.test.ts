import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { EVIDENCE_CLASSES } from "@/domain/technique";
import { EFFECT_CONCEPTS } from "@/features/radiograph/plan";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";

type Tree = { [k: string]: string | Tree };
const leaves = (t: Tree, prefix = ""): string[] =>
  Object.entries(t).flatMap(([k, v]) => (typeof v === "string" ? [`${prefix}${k}`] : leaves(v, `${prefix}${k}.`)));
const get = (t: Tree, path: string) => path.split(".").reduce<string | Tree | undefined>((n, k) => (typeof n === "object" ? n[k] : undefined), t);

describe("EN / AR message catalogues", () => {
  it("have exactly the same keys", () => {
    expect(leaves(ar as Tree).sort()).toEqual(leaves(en as Tree).sort());
  });

  it("have no empty strings", () => {
    for (const cat of [en, ar] as Tree[]) for (const k of leaves(cat)) expect((get(cat, k) as string).trim().length, k).toBeGreaterThan(0);
  });

  it("Arabic technique text is actually Arabic (not copied English)", () => {
    for (const k of leaves(ar as Tree).filter((x) => x.startsWith("technique.why.") || x.startsWith("console.readiness.items."))) {
      expect(get(ar as Tree, k), k).toMatch(/[؀-ۿ]/);
    }
  });

  it("translate every evidence class", () => {
    for (const c of EVIDENCE_CLASSES) {
      expect(get(en as Tree, `evidence.${c}`), c).toBeTruthy();
      expect(get(ar as Tree, `evidence.${c}`), c).toBeTruthy();
    }
  });

  it("keep placeholders identical across languages", () => {
    const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    for (const k of leaves(en as Tree)) expect(ph(get(ar as Tree, k) as string), k).toBe(ph(get(en as Tree, k) as string));
  });

  it("do not teach brightness as an exposure meter", () => {
    const text = JSON.stringify(en).toLowerCase();
    expect(text).not.toMatch(/dark image|too dark|too light|underexposed image looks|overexposed image looks/);
    expect(get(en as Tree, "technique.brightness") as string).toMatch(/not by how light or dark/);
  });
});

describe("Session 4 text (patient instructions + radiograph effects)", () => {
  const arabic = /[؀-ۿ]/;
  const c = CASES[0]!;

  it("every radiograph effect has a title and description in EN and AR", () => {
    for (const id of Object.keys(EFFECT_CONCEPTS)) for (const part of ["title", "desc"]) {
      expect(get(en as Tree, `radiograph.effects.${id}.${part}`), id).toBeTruthy();
      expect(get(ar as Tree, `radiograph.effects.${id}.${part}`), id).toMatch(arabic);
    }
  });

  it("every instruction the case offers is translated in EN and AR", () => {
    for (const b of c.availableBreathing) {
      expect(get(en as Tree, `patient.breathingOptions.${b}`), b).toBeTruthy();
      expect(get(ar as Tree, `patient.breathingOptions.${b}`), b).toMatch(arabic);
    }
    for (const m of c.availableMotionInstructions) {
      expect(get(en as Tree, `patient.motionOptions.${m}`), m).toBeTruthy();
      expect(get(ar as Tree, `patient.motionOptions.${m}`), m).toMatch(arabic);
    }
  });

  it("the Arabic UI text is Arabic, not copied English", () => {
    for (const k of leaves(ar as Tree).filter((x) => x.startsWith("patient.") || x.startsWith("radiograph."))) {
      expect(get(ar as Tree, k), k).toMatch(arabic);
    }
    expect(get(ar as Tree, "console.readiness.items.motion-not-instructed")).toMatch(arabic);
    expect(get(ar as Tree, "result.variants.motion")).toMatch(arabic);
  });

  it("explains the grey hatch (no reference data) and separates concept from rendered magnitude (EN + AR)", () => {
    for (const lang of [en, ar] as Tree[]) {
      for (const k of ["radiograph.margins", "radiograph.concept", "radiograph.magnitude", "radiograph.magnitudeApprox", "radiograph.magnitudeNone", "radiograph.effectsIntro"]) {
        expect(get(lang, k), k).toBeTruthy();
      }
    }
    expect(get(en as Tree, "radiograph.margins") as string).toMatch(/hatched/);
    expect(get(en as Tree, "radiograph.margins") as string).toMatch(/not exposure, collimation or anatomy/);
    expect(get(ar as Tree, "radiograph.margins") as string).toMatch(arabic);
    expect(get(en as Tree, "radiograph.magnitudeApprox") as string).toBe("Educational visual approximation");
    expect(get(en as Tree, "radiograph.effectsIntro") as string).toMatch(/never a validated appearance/);
  });

  it("keeps the educational disclaimers: not the case patient, not diagnostic, effects are approximations (EN + AR)", () => {
    const note = get(en as Tree, "radiograph.educationalNote") as string;
    expect(note).toMatch(/not an image of the case patient/);
    expect(note).toMatch(/not a diagnostic/);
    expect(note).toMatch(/educational approximations/);
    expect(get(ar as Tree, "radiograph.educationalNote") as string).toMatch(/ليس|وليس/);
    expect(get(en as Tree, "patient.note") as string).toMatch(/does not measure real breathing or movement/);
    expect(get(ar as Tree, "patient.note") as string).toMatch(arabic);
  });

  it("does not teach exposure as brightness, and says excess exposure is not darker", () => {
    expect(get(en as Tree, "radiograph.effects.low-exposure.desc") as string).toMatch(/does not make the image lighter/);
    expect(get(en as Tree, "radiograph.effects.excess-exposure.desc") as string).toMatch(/not darker/);
    expect(JSON.stringify(en)).not.toMatch(/overexposed image looks|underexposed image looks/i);
  });

  it("does not present a measured quantity: no rib count, degree-per-pixel or millimetre claims", () => {
    const text = JSON.stringify([get(en as Tree, "radiograph"), get(en as Tree, "patient")]);
    expect(text).not.toMatch(/\d+\s*(mm|px|pixels|ribs)\b/i);
    expect(get(en as Tree, "radiograph.effects.inspiration.desc") as string).toMatch(/no rib-count rule/);
  });

  it("keeps the instruction wording neutral: it never labels an option as correct before exposure", () => {
    for (const k of leaves(en as Tree).filter((x) => x.startsWith("patient.breathingOptions.") || x.startsWith("patient.motionOptions."))) {
      expect(get(en as Tree, k) as string, k).not.toMatch(/\b(correct|incorrect|wrong|right answer|recommended)\b/i);
    }
  });
});

describe("case data is fully bilingual", () => {
  const texts = (v: unknown): { en?: unknown; ar?: unknown }[] => {
    if (Array.isArray(v)) return v.flatMap(texts);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if ("en" in o && "ar" in o) return [o];
      return Object.values(o).flatMap(texts);
    }
    return [];
  };
  it.each(CASES.map((c) => [c.id, c] as const))("%s: every LocalizedText has non-empty EN and AR", (_id, c) => {
    for (const lt of texts(c)) {
      expect(String(lt.en).length).toBeGreaterThan(0);
      expect(String(lt.ar).length).toBeGreaterThan(0);
    }
  });

  it("technique rule feedback in Arabic contains Arabic script", () => {
    for (const r of CASES[0]!.rules.filter((r) => r.kind === "technique")) {
      for (const f of Object.values(r.feedback)) expect(f.ar).toMatch(/[؀-ۿ]/);
    }
  });
});
