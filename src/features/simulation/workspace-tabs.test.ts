import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { assessReadiness } from "@/features/technique/readiness";
import { nextTab, tabsNeedingAttention } from "./workspace-tabs";

const pa = CASES.find((c) => c.id.startsWith("chest-pa-erect"))!;

describe("phone workspace tabs (UI-3)", () => {
  it("puts the dot on the tab that holds each unready control", () => {
    const r = assessReadiness(pa, { ...pa.initialSettings, sideMarker: null, breathing: "no-instruction", motionInstruction: "none" });
    expect(r.items.map((i) => i.id)).toEqual(expect.arrayContaining(["marker-missing", "breathing-not-instructed"]));
    const tabs = tabsNeedingAttention(r);
    expect(tabs.has("positioning")).toBe(true);
    expect(tabs.has("patient")).toBe(true);
    expect(tabs.has("centring")).toBe(false);
  });

  it("maps technique and AEC items to Technique, and the finished exposure to no tab", () => {
    expect([...tabsNeedingAttention({ level: "blocked", canExpose: false, items: [{ id: "aec-no-chamber", category: "aec", level: "blocked" }] })]).toEqual(["technique"]);
    expect([...tabsNeedingAttention({ level: "blocked", canExpose: false, items: [{ id: "technique-invalid", category: "technique", level: "blocked" }] })]).toEqual(["technique"]);
    expect(tabsNeedingAttention({ level: "blocked", canExpose: false, items: [{ id: "exposure-done", category: "system", level: "blocked" }] }).size).toBe(0);
  });

  it("follows the visual order with the arrow keys, mirrored in RTL", () => {
    expect(nextTab("positioning", "ArrowRight", false)).toBe("centring");
    expect(nextTab("positioning", "ArrowLeft", false)).toBe("technique");
    expect(nextTab("positioning", "ArrowLeft", true)).toBe("centring");
    expect(nextTab("technique", "Home", true)).toBe("positioning");
    expect(nextTab("centring", "End", false)).toBe("technique");
    expect(nextTab("centring", "Enter", false)).toBeNull();
  });
});
