import { describe, expect, it } from "vitest";
import { EXAMS } from "@/data/exams";
import { BODY_PARTS, BODY_PART_IDS, type BodyPartEntry } from "@/data/modalities";
import { groupExamsByBodyPart } from "./catalogue";

describe("catalogue by anatomical region", () => {
  it("has unique bilingual labels for every registered and used body part", () => {
    expect(new Set(BODY_PART_IDS).size).toBe(BODY_PART_IDS.length);
    for (const part of BODY_PARTS) {
      expect(part.name.en.trim()).not.toBe("");
      expect(part.name.ar).toMatch(/[؀-ۿ]/);
    }
    for (const exam of EXAMS) expect(BODY_PART_IDS).toContain(exam.bodyPart);
  });

  it("shows every exam exactly once in its own region, preserving exam order", () => {
    const groups = groupExamsByBodyPart(EXAMS);
    expect(groups.flatMap((group) => group.exams).map((exam) => exam.id).sort()).toEqual(EXAMS.map((exam) => exam.id).sort());
    for (const group of groups) expect(group.exams).toEqual(EXAMS.filter((exam) => exam.bodyPart === group.bodyPart.id));
  });

  it("follows registry order and omits regions with no exams", () => {
    const onlyChest = EXAMS.filter((exam) => exam.bodyPart === "chest");
    expect(groupExamsByBodyPart(onlyChest).map((group) => group.bodyPart.id)).toEqual(["chest"]);
    expect(groupExamsByBodyPart([])).toEqual([]);
    expect(groupExamsByBodyPart(EXAMS).map((group) => group.bodyPart.id)).toEqual(BODY_PARTS.filter((part) => EXAMS.some((exam) => exam.bodyPart === part.id)).map((part) => part.id));
  });

  it("accepts a new region and exam through data, without changing catalogue logic", () => {
    const part: BodyPartEntry = { id: "synthetic-region", name: { en: "Synthetic region", ar: "منطقة اختبار" } };
    const exam = { ...EXAMS[0]!, id: "synthetic-exam", bodyPart: part.id };
    const groups = groupExamsByBodyPart([...EXAMS, exam], [...BODY_PARTS, part]);
    expect(groups.at(-1)).toEqual({ bodyPart: part, exams: [exam] });
    expect(groups.flatMap((group) => group.exams)).toHaveLength(EXAMS.length + 1);
  });

  it("never silently drops an exam with an unregistered region", () => {
    expect(() => groupExamsByBodyPart([{ ...EXAMS[0]!, bodyPart: "unregistered" }])).toThrow("Unregistered body part");
  });

  it("does not mutate input data", () => {
    const exams = Object.freeze([...EXAMS]);
    const parts = Object.freeze([...BODY_PARTS]);
    const before = JSON.stringify({ exams, parts });
    groupExamsByBodyPart(exams, parts);
    expect(JSON.stringify({ exams, parts })).toBe(before);
  });
});
