import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { EVIDENCE_CLASSES } from "@/domain/technique";
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
