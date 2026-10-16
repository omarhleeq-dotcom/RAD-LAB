import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CASE_DEFINITIONS } from "./cases";
import { getExam } from "./exams";
import { creditFor, IMAGE_CREDITS, SCIENTIFIC_CREDITS, usedImageCredits } from "./credits";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

const registry = readFileSync("docs/ASSET_PROVENANCE_AND_LICENSES.md", "utf8");
const audit = readFileSync("docs/ASSET_LICENCE_AUDIT_2026-10-15.md", "utf8");
const decisions = readFileSync("docs/DECISIONS.md", "utf8");
// Independent evidence expectations, including accepted owner evidence (audit §6), not inferred from CC0.
const expected = [
  ["chest-pa", "A-001", "verified", "2017-06-28", "interpolation"],
  ["chest-lateral", "A-006", "verified", "2017-06-28", "1000 × 1387"],
  ["chest-ap", "A-008", "deferred", "2017 (dataset)", "pixels unchanged"],
  ["wrist-pa", "A-010", "ownerVerified", "2017-10-29", "no additional crop"],
  ["wrist-lateral", "A-012", "ownerVerified", "2017-10-29", "356 rows"],
  ["hand-pa", "A-014", "verified", "2017-10-29", "filled"],
  ["hand-lateral", "A-016", "ownerVerified", "2017-10-29", "artefact remains"],
  ["elbow-ap", "A-018", "ownerVerified", "2017-10-29", "bottom 38 and top 3"],
  ["elbow-lateral", "A-020", "verified", "2017-10-29", "no crop or fill"],
  ["knee-ap", "A-022", "ownerVerified", "2018-01-05", "edge artefacts repaired"],
  ["knee-lateral", "A-024", "verified", "2018-01-05", "minimal osteophyte"],
  ["foot-ap", "A-026", "ownerVerified", "2017-07-28", "2405"],
  ["foot-oblique", "A-028", "ownerVerified", "2017-07-28", "1960"],
  ["ankle-ap", "A-030", "ownerVerified", "2017-10-24", "no pixel repair"],
  ["ankle-lateral", "A-032", "ownerVerified", "2017-10-24", "obliquity remains"],
  ["pelvis-ap", "A-034", "verified", "2018-03-14", "background only"],
  ["shoulder-grashey", "A-037", "verified", "2017-08-27", "recurrent dislocation"],
] as const;

describe("sources and credits evidence", () => {
  it("covers every used asset once, binds the exact registry chain and retains exam associations", () => {
    const used = usedImageCredits(CASE_DEFINITIONS);
    expect(new Set(IMAGE_CREDITS.map((c) => c.assetId)).size).toBe(IMAGE_CREDITS.length);
    expect(used.map((c) => c.credit.assetId).sort()).toEqual(IMAGE_CREDITS.map((c) => c.assetId).sort());
    expect(new Set(IMAGE_CREDITS.map((c) => c.url)).size).toBe(IMAGE_CREDITS.length);
    for (const def of CASE_DEFINITIONS) {
      expect(getExam(def.examId)).toBeDefined();
      const credit = creditFor(def.radiograph)!;
      expect(credit).toBeDefined();
      expect(credit.registryIds).toEqual(def.radiograph.registryIds);
      expect(used.find((c) => c.credit === credit)!.examIds.has(def.examId)).toBe(true);
    }
    const first = CASE_DEFINITIONS[0]!;
    expect(usedImageCredits([...CASE_DEFINITIONS, first])).toHaveLength(used.length);
    expect(creditFor({ id: first.radiograph.id, registryIds: ["wrong"] })).toBeUndefined();
    expect(() => usedImageCredits([{ ...first, radiograph: { ...first.radiograph, id: "unregistered" } }])).toThrow("Missing credit");
  });

  it.each(expected)("matches recorded source evidence for %s", (id, master, evidence, date, modification) => {
    const credit = IMAGE_CREDITS.find((c) => c.assetId === `${id}-baseline`)!;
    expect(credit.registryIds[0]).toBe(master);
    expect(registry).toContain(master);
    expect(credit.evidence).toBe(evidence);
    expect(credit.date.en).toBe(date);
    expect(credit.modifications.en).toContain(modification);
    expect(audit).toContain(master);
    if (id !== "chest-ap") expect(audit).toContain(credit.url.split("/wiki/")[1]);
    expect(credit.author.en).toContain(id === "pelvis-ap" ? "UC San Diego" : id === "chest-ap" ? "NIH Clinical Center" : "Mikael Häggström");
    expect(credit.url).toContain(id === "chest-ap" ? "nihcc.app.box.com" : "commons.wikimedia.org/wiki/File:");
    if (id === "chest-ap") {
      expect(credit.license).toBeNull(); expect(credit.licenseUrl).toBeNull();
      for (const text of Object.values(credit.context!)) for (const name of ["Wang", "Peng", "Le Lu", "Zhiyong Lu", "Bagheri", "Summers", "3462-3471", "2017", "https://nihcc.app.box.com/v/ChestXray-NIHCC"]) expect(text).toContain(name);
    } else {
      expect(credit.licenseUrl).toBe(`https://creativecommons.org/publicdomain/${id === "pelvis-ap" ? "mark" : "zero"}/1.0/`);
    }
    for (const loc of ["en", "ar"] as const) {
      expect(credit.modifications[loc].length).toBeGreaterThan(20);
      expect(credit.title[loc]).not.toMatch(/\b[ASO]-\d|docs\//);
    }
  });

  it("keeps owner verification and deferred terms explicit and matches the latest decisions", () => {
    expect(audit).toContain("O100 closed"); expect(decisions).toContain("DEFERRED by the owner");
    expect(IMAGE_CREDITS.filter((c) => c.evidence === "ownerVerified").map((c) => c.registryIds[0]).sort())
      .toEqual(["A-010", "A-012", "A-016", "A-018", "A-022", "A-026", "A-028", "A-030", "A-032"]);
    expect(en.credits.deferred).toContain("Commercial-use permission is not established");
    expect(en.credits.ownerVerified).toContain("does not establish an independent match");
    expect(Object.keys(en.credits)).toEqual(Object.keys(ar.credits));
    expect(new Set(SCIENTIFIC_CREDITS.map((s) => s.id)).size).toBe(SCIENTIFIC_CREDITS.length);
    expect(SCIENTIFIC_CREDITS.filter((s) => s.role === "governing").map((s) => s.id)).toEqual(["bontrager"]);
    expect(SCIENTIFIC_CREDITS.find((s) => s.id === "clark")!.locators.en).toContain("p. 10 only");
    expect(SCIENTIFIC_CREDITS.find((s) => s.id === "bontrager")!.locators.en).toContain("271–272, 279");
  });
});
