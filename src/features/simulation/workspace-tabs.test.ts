import { describe, expect, it } from "vitest";
import { CASES } from "@/data/cases";
import { assessReadiness } from "@/features/technique/readiness";
import { WORKSPACE_TABS, followingTab, nextTab, stepState, tabsNeedingAttention } from "./workspace-tabs";

const pa = CASES.find((c) => c.id.startsWith("chest-pa-erect"))!;

describe("phone workspace tabs (UI-3)", () => {
  it("puts the dot on the tab that holds each unready control", () => {
    const r = assessReadiness(pa, { ...pa.initialSettings, sideMarker: null, breathing: "no-instruction", motionInstruction: "none" });
    expect(r.items.map((i) => i.id)).toEqual(expect.arrayContaining(["marker-missing", "breathing-not-instructed"]));
    const tabs = tabsNeedingAttention(r);
    // The side marker sits in step 2 "Detector" (RAD-101 D3), so its note is there.
    expect(tabs.has("centring")).toBe(true);
    expect(tabs.has("patient")).toBe(true);
    expect(tabs.has("positioning")).toBe(false);
  });

  it("maps technique and AEC items to Technique, and the finished exposure to no tab", () => {
    expect([...tabsNeedingAttention({ level: "blocked", canExpose: false, items: [{ id: "aec-no-chamber", category: "aec", level: "blocked" }] })]).toEqual(["technique"]);
    expect([...tabsNeedingAttention({ level: "blocked", canExpose: false, items: [{ id: "technique-invalid", category: "technique", level: "blocked" }] })]).toEqual(["technique"]);
    expect(tabsNeedingAttention({ level: "blocked", canExpose: false, items: [{ id: "exposure-done", category: "system", level: "blocked" }] }).size).toBe(0);
  });

  it("follows the visual order with the arrow keys, mirrored in RTL", () => {
    expect(nextTab("positioning", "ArrowRight", false)).toBe("centring");
    expect(nextTab("positioning", "ArrowLeft", false)).toBe("patient");
    expect(nextTab("positioning", "ArrowLeft", true)).toBe("centring");
    expect(nextTab("technique", "Home", true)).toBe("positioning");
    expect(nextTab("centring", "End", false)).toBe("patient");
    expect(nextTab("centring", "Enter", false)).toBeNull();
  });

  it("orders the steps Position, Detector, Technique, Patient instructions (RAD-101 D3) and stops Next on the last", () => {
    expect([...WORKSPACE_TABS]).toEqual(["positioning", "centring", "technique", "patient"]);
    expect(followingTab("centring")).toBe("technique");
    expect(followingTab("technique")).toBe("patient");
    expect(followingTab("patient")).toBeNull();
  });

  it("shows note over done, done once opened, else not started", () => {
    const attention = new Set(["positioning"] as const), visited = new Set(["positioning", "centring"] as const);
    expect(stepState("positioning", attention, visited)).toBe("note");
    expect(stepState("centring", attention, visited)).toBe("done");
    expect(stepState("technique", attention, visited)).toBe("todo");
  });
});
