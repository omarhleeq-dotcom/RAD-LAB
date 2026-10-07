import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { publicReference, publicText, stripInternalCodes } from "./public-text";

const INTERNAL = /\bS-?[A-Z]*-?\d+[a-z]?(?:\.\d+[a-z]?)?(?:-\d+)?|\bO\d{1,2}\b|§/;

describe("publicReference", () => {
  it("keeps textbook citations and drops internal pointers", () => {
    expect(publicReference("BONTRAGER-9 p.150, 153 (non-grid); Technique ref §3.3, §12")).toBe("BONTRAGER-9 p.150, 153 (non-grid)");
    expect(publicReference("BONTRAGER-9 p.150; S14.2-4, S14.2-10, S10b-9")).toBe("BONTRAGER-9 p.150");
    expect(publicReference("S10b-9; WHO-TECH p.6-7; EC16260 p.21")).toBe("WHO-TECH p.6-7; EC16260 p.21");
    expect(publicReference("BONTRAGER-9 p.32-33, 36, p.156; S14.1b-1 (O21 option A), S14.1c-4")).toBe("BONTRAGER-9 p.32-33, 36, p.156");
  });
  it("keeps plain text that is neither a code nor a pointer into the repo docs", () => {
    expect(publicReference("BONTRAGER-9 p.94; the exam request")).toBe("BONTRAGER-9 p.94; the exam request");
    expect(publicReference("Side marker and annotations — S10b-8; S11b-1")).toBe("Side marker and annotations");
  });
  it("returns null when nothing citable is left (the line is not drawn)", () => {
    for (const r of ["S14.2-10; S10b-9; O26", "Technique ref §6.1, §6.3", "§2 Patient orientation; §3A", "Positioning ref §Image rejection", "S12-4; docs/ASSET_PROVENANCE_AND_LICENSES.md (A-006, A-007)"])
      expect(publicReference(r)).toBeNull();
  });
});

describe("publicText", () => {
  it("removes codes and tidies the punctuation", () => {
    expect(publicText("Reference point is a teaching constant (O26). Next")).toBe("Reference point is a teaching constant. Next");
    expect(publicText("Direction feedback (S10b-3, S11c-2) follows the book")).toBe("Direction feedback follows the book");
    expect(publicText("S11b (S10b-26): the reference is ≥ 183 cm")).toBe("the reference is ≥ 183 cm");
    expect(publicText("removed by a fill and a crop, S14.3-7).")).toBe("removed by a fill and a crop).");
    expect(publicText("(a fill and a crop, S14.3-7)")).toBe("(a fill and a crop)");
    expect(publicText("pending review (O5). Done")).toBe("pending review. Done");
    expect(publicText("Pending educator confirmation (O7 closed by S10b-4).")).toBe("Pending educator confirmation.");
    expect(publicText("must carry a side marker (S10b-8: presence required for PA).")).toBe("must carry a side marker (presence required for PA).");
    expect(publicText("Semi-erect as its own variant is O9. Not drawn.")).toBe("Semi-erect as its own variant. Not drawn.");
    expect(publicText("Bontrager p.150 and 110–125 kV")).toBe("Bontrager p.150 and 110–125 kV");
  });
  it("leaves text without codes unchanged", () => {
    const s = "Midline alignment; the sternal ends are symmetric (p.96).";
    expect(stripInternalCodes(s)).toBe(s);
  });
});

describe("every student-visible evidence string of every case", () => {
  const strings: string[] = [];
  const evs = (e?: { reference?: string; note?: string }) => { if (e?.reference) strings.push(publicReference(e.reference) ?? ""); if (e?.note) strings.push(publicText(e.note)); };
  for (const c of CASES) {
    for (const r of c.rules ?? []) evs((r as { evidence?: { reference: string; note?: string } }).evidence);
    for (const f of c.scoring.criticalFindings ?? []) { evs(f.concept); evs(f.evidence); }
    for (const a of c.technique.assumptions ?? []) evs(a.evidence);
    strings.push(publicText(c.radiograph.credit.en), publicText(c.radiograph.credit.ar));
  }
  it("contains no internal code", () => {
    expect(strings.length).toBeGreaterThan(50);
    expect(strings.filter((s) => INTERNAL.test(s))).toEqual([]);
  });
});
