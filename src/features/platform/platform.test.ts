import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CASE_DEFINITIONS } from "@/data/cases";
import { EXAMS } from "@/data/exams";
import { LEGACY_CASE_ROUTES, LEGACY_LOCALES, legacyTarget } from "@/data/legacy-routes";
import { MODALITIES } from "@/data/modalities";
import { getCase } from "@/data/cases";
import { allExamRoutes, examsOf, findCase, findExam, findMode, findModality, resolveRadCase } from "./resolve";
import { practicePath } from "./routes";
import ar from "../../../messages/ar.json";
import en from "../../../messages/en.json";

describe("platform catalogue (ADR-0011)", () => {
  it("every exam is reachable under exactly one available modality", () => {
    for (const e of EXAMS) {
      const owners = MODALITIES.filter((m) => m.status === "available" && examsOf(m).includes(e));
      expect(owners.map((m) => m.id), e.id).toHaveLength(1);
      expect(allExamRoutes()).toContainEqual({ modality: owners[0]!.id, exam: e.id });
    }
  });

  it("planned modalities have no routes, no exams and no description (no medical text)", () => {
    const planned = MODALITIES.filter((m) => m.status === "planned");
    expect(planned.map((m) => m.id)).toEqual(["ct", "mri", "us"]);
    for (const m of planned) {
      expect(findModality(m.id)).toBeUndefined();
      expect(m.examModality).toBeUndefined();
      expect(m.description).toBeUndefined();
    }
  });

  it("modality ids and per-modality exam ids are unique", () => {
    expect(new Set(MODALITIES.map((m) => m.id)).size).toBe(MODALITIES.length);
    expect(new Set(EXAMS.map((e) => e.id)).size).toBe(EXAMS.length);
  });

  it("resolves known routes and rejects unknown modality / exam / mode / case", () => {
    expect(findExam("xray", "chest-pa-erect")?.id).toBe("chest-pa-erect");
    expect(findExam("ct", "chest-pa-erect")).toBeUndefined();
    expect(findExam("xray", "nope")).toBeUndefined();
    expect(findMode("practice")?.id).toBe("practice");
    expect(findMode("assess")).toBeUndefined();
    const exam = findExam("xray", "chest-pa-erect")!;
    expect(resolveRadCase(exam, null)?.id).toBe("chest-pa-erect");
    expect(resolveRadCase(exam, "")?.id).toBe("chest-pa-erect");
    expect(resolveRadCase(exam, "unknown")).toBeUndefined();
    expect(findCase(exam, "adult-demo")?.id).toBe("adult-demo");
  });

  it("every case is reachable from its practice URL; the default case has no ?case", () => {
    for (const def of CASE_DEFINITIONS) {
      const exam = EXAMS.find((e) => e.id === def.examId)!;
      const path = practicePath("xray", exam, def);
      expect(path.includes("?case=")).toBe(def.id !== exam.defaultCaseId);
      const param = new URL(path, "http://x").searchParams.get("case");
      expect(resolveRadCase(exam, param)?.id).toBe(def.id === exam.defaultCaseId ? exam.id : `${exam.id}/${def.id}`);
    }
  });
});

describe("old URLs keep working", () => {
  const redirects = readFileSync("public/_redirects", "utf8");
  it.each(LEGACY_LOCALES.flatMap((l) => LEGACY_CASE_ROUTES.map((r) => [l, r] as const)))("%s %j: registry + _redirects", (locale, r) => {
    expect(getCase(r.caseId), "old public case id still resolves").toBeDefined();
    expect(findExam(r.modality, r.exam), "target exists").toBeDefined();
    const rule = redirects.split("\n").find((l) => l.startsWith(`/${locale}/simulation/${r.caseId} `));
    expect(rule?.split(/\s+/).slice(0, 2), "explicit rule in public/_redirects").toEqual([`/${locale}/simulation/${r.caseId}`, legacyTarget(r, locale)]);
  });
  it("has no catch-all rule", () => {
    expect(redirects.split("\n").filter((l) => l.trim() && !l.startsWith("#") && l.includes("*"))).toEqual([]);
  });
});

describe("shell strings", () => {
  it("modality / mode names exist in both languages", () => {
    for (const m of MODALITIES) {
      expect(m.name.en.length).toBeGreaterThan(0);
      expect(m.name.ar).toMatch(/[؀-ۿ]/);
    }
    expect((ar as { notFound: { title: string } }).notFound.title).toMatch(/[؀-ۿ]/);
    expect((en as { notFound: { title: string } }).notFound.title).toBeTruthy();
  });
});
