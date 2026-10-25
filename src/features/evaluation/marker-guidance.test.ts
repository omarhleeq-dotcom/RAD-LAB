import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import { wristPa } from "@/data/cases/wrist-pa";
import { evaluate } from "./engine";
import { comparisonVersion } from "./comparison-version";
import { PRACTICE_EVALUATION_VERSION } from "./version";
import { markerRoomSide } from "./marker-room";
import { DetectorWorkspace } from "@/features/positioning/DetectorWorkspace";
import { WRIST_PA_FIGURE } from "@/features/positioning/detector-figures";

const settings = { ...wristPa.initialSettings, projection: "wrist-pa", centralRay: { x: 0, y: -1 / 6 }, collimation: { width: 14 / 18, height: 16 / 24 }, sideMarker: "L" as const, markerPosition: { x: -.42, y: -.16 } };
describe("whole marker guidance, no scoring changes", () => {
  it("names a side with actual space and does not name one in a tight field", () => {
    expect(markerRoomSide(wristPa, settings)).toBe("left");
    expect(markerRoomSide(wristPa, { ...settings, centralRay: { x: 0, y: -.075 }, collimation: { width: 8.6 / 18, height: 12.2 / 24 } })).toBeNull();
    expect(markerRoomSide(wristPa, { ...settings, sideMarker: null })).toBeNull();
  });
  it("only adds presentation to an overlap and retains comparison identity", async () => {
    const plain = { ...wristPa, rules: wristPa.rules.map(r => r.kind === "marker" ? { ...r, feedback: { ...r.feedback, overlapLeft: undefined, overlapRight: undefined, overlapTop: undefined, overlapBottom: undefined } } : r) };
    const a = evaluate(wristPa, settings), b = evaluate(plain, settings);
    expect(a.score).toEqual(b.score); expect(a.variants).toEqual(b.variants); expect(a.resultState).toEqual(b.resultState);
    expect(a.checks.find(c => c.ruleId === "side-marker")?.feedback.en).toContain("WHOLE marker square");
    expect(a.checks.find(c => c.ruleId === "side-marker")?.feedback.en).toContain("left edge");
    expect(await comparisonVersion(wristPa, PRACTICE_EVALUATION_VERSION)).toBe(await comparisonVersion(plain, PRACTICE_EVALUATION_VERSION));
  });
  it.each(["en", "ar"] as const)("uses measured geometry only with guides on (%s)", locale => {
    const render = (showGuides: boolean) => renderToStaticMarkup(h(NextIntlClientProvider, { locale, messages: locale === "en" ? en : ar, timeZone: "UTC", children: h(DetectorWorkspace, { radCase: wristPa, settings, showGuides, disabled: false, onChange() {}, figure: WRIST_PA_FIGURE }) }));
    const on = render(true), off = render(false);
    const label = (locale === "en" ? en : ar).positioning.markerExclusionGuide;
    expect(on).toContain(label); expect(on).toContain('width="18" height="18"');
    expect(off).not.toContain(label); expect(off).not.toContain("Measured marker square");
  });
});
