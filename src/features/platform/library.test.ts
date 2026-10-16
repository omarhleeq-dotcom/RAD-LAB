import { describe, expect, it } from "vitest";
import { BODY_PARTS } from "@/data/modalities";
import { filterLibrary, graphicOf, librarySections, normalizeSearch, uniformlyProvisional, type LibraryItem } from "./library";
const item = (id: string, bodyPart: string, en: string, ar: string): LibraryItem => ({ id, bodyPart, title: { en, ar }, href: `/${id}`, projection: "pa", caseCount: 2, provisional: true });
const items = [item("chest", "chest", "Chest PA — erect", "أشعة الصدر — وقوفًا"), item("wrist", "wrist", "Wrist lateral", "الرسغ — جانبي"), item("ankle", "ankle", "Ankle AP", "الكاحل")];
describe("display library", () => {
  it("keeps each item once in broad anatomical groups, without changing its data", () => {
    const before = JSON.stringify(items);
    const groups = librarySections(items);
    expect(groups.map((g) => g.region.id)).toEqual(["chest", "upper-limb", "lower-limb"]);
    expect(groups.flatMap((g) => g.items)).toEqual(items);
    expect(JSON.stringify(items)).toBe(before);
  });
  it("searches both languages, projections and regions regardless of displayed locale", () => {
    const groups = librarySections(items);
    expect(filterLibrary(groups, "CHEST PA", "").flatMap((g) => g.items).map((x) => x.id)).toEqual(["chest"]);
    expect(filterLibrary(groups, "أَشْعَة الصَّـدر", "").flatMap((g) => g.items).map((x) => x.id)).toEqual(["chest"]);
    expect(filterLibrary(groups, "upper limb", "").flatMap((g) => g.items).map((x) => x.id)).toEqual(["wrist"]);
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
  it("does not conceal provisional items in a mixed or filtered list", () => {
    expect(uniformlyProvisional([])).toBe(false);
    expect(uniformlyProvisional(items)).toBe(true);
    expect(uniformlyProvisional([...items, { ...items[0]!, provisional: false }])).toBe(false);
    expect(graphicOf({ bodyPart: "chest", projection: "lateral-left" })).toBe("chest-side");
  });
});
