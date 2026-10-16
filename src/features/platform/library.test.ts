import { describe, expect, it } from "vitest";
import { EXAMS } from "@/data/exams";
import { BODY_PARTS } from "@/data/modalities";
import { filterLibrary, graphicOf, LIBRARY_REGIONS, librarySections, normalizeSearch, uniformlyProvisional, type LibraryItem } from "./library";
const item = (id: string, bodyPart: string, en: string, ar: string): LibraryItem => ({ id, bodyPart, title: { en, ar }, href: `/${id}`, projection: "pa", caseCount: 2, provisional: true });
const items = [item("chest", "chest", "Chest PA — erect", "أشعة الصدر — وقوفًا"), item("wrist", "wrist", "Wrist lateral", "الرسغ — جانبي"), item("ankle", "ankle", "Ankle AP", "الكاحل")];
describe("display library", () => {
  it("keeps each item once in broad anatomical groups, without changing its data", () => {
    const before = JSON.stringify(items);
    const groups = librarySections(items);
    expect(groups.map((g) => g.region.id)).toEqual(["body", "upper-limb", "lower-limb"]);
    expect(groups.flatMap((g) => g.items)).toEqual(items);
    expect(JSON.stringify(items)).toBe(before);
  });
  it("searches both languages, projections and regions regardless of displayed locale", () => {
    const groups = librarySections(items);
    expect(filterLibrary(groups, "CHEST PA", "").flatMap((g) => g.items).map((x) => x.id)).toEqual(["chest"]);
    expect(filterLibrary(groups, "أَشْعَة الصَّـدر", "").flatMap((g) => g.items).map((x) => x.id)).toEqual(["chest"]);
    expect(filterLibrary(groups, "upper extremity", "").flatMap((g) => g.items).map((x) => x.id)).toEqual(["wrist"]);
    expect(normalizeSearch("  إِبْـرَة  ")).toBe("ابرة");
  });
  it("combines query and region, returns no empty groups, and clears without losing items", () => {
    const groups = librarySections(items);
    expect(filterLibrary(groups, "ankle", "upper-limb")).toEqual([]);
    expect(filterLibrary(groups, "", "upper-limb").flatMap((g) => g.items).map((x) => x.id)).toEqual(["wrist"]);
    expect(filterLibrary(groups, "", "")).toEqual(groups);
  });
  it("accepts a new registered region without changing JSX, and rejects silently losing data", () => {
    const next = item("new", "synthetic", "New exam", "فحص جديد");
    const groups = librarySections([...items, next], [...BODY_PARTS, { id: "synthetic", name: { en: "New region", ar: "منطقة جديدة" } }]);
    expect(groups.at(-1)?.items).toEqual([next]);
    expect(groups.at(-1)?.region.name.ar).toBe("منطقة جديدة");
    expect(graphicOf(next)).toBe("generic");
    expect(() => librarySections([next])).toThrow("Unregistered body part");
    expect(() => librarySections(items, BODY_PARTS, [{ id: "a", name: items[0]!.title, bodyParts: ["chest", "chest"] }])).toThrow("Duplicate");
  });
  it("groups chest and pelvis in Body, reserves abdomen, and keeps future categories inert", () => {
    const groups = librarySections([...items, item("pelvis", "pelvis", "Pelvis AP", "الحوض")]);
    expect(groups.find((g) => g.region.id === "body")?.items.map((entry) => entry.id)).toEqual(["chest", "pelvis"]);
    expect(LIBRARY_REGIONS.find((g) => g.id === "body")?.bodyParts).toContain("abdomen");
    expect(LIBRARY_REGIONS.filter((g) => g.status === "planned").map((g) => g.id)).toEqual(["head", "spine"]);
    expect(groups.some((g) => g.region.status === "planned")).toBe(false);
    expect(() => librarySections([item("future", "skull", "Head", "الرأس")])).toThrow("Planned category contains an exam");
  });
  it("gives every current exam a distinct body-part/projection graphic", () => {
    const graphics = EXAMS.map((exam) => graphicOf({ bodyPart: exam.bodyPart, projection: exam.requiredProjection }));
    expect(graphics).not.toContain("generic");
    expect(new Set(graphics).size).toBe(EXAMS.length);
    expect(graphicOf({ bodyPart: "wrist", projection: "wrist-lateral" })).not.toBe(graphicOf({ bodyPart: "hand", projection: "hand-lateral" }));
  });
  it("does not conceal provisional items in a mixed or filtered list", () => {
    expect(uniformlyProvisional([])).toBe(false);
    expect(uniformlyProvisional(items)).toBe(true);
    expect(uniformlyProvisional([...items, { ...items[0]!, provisional: false }])).toBe(false);
    expect(graphicOf({ bodyPart: "chest", projection: "lateral-left" })).toBe("chest-lateral");
  });
});
