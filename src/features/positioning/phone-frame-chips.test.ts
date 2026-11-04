// RAD-101 D2 (amends RAD-077 A1): phone frame labels are small chips, one row above and one below the detector, at physical slots.
import { expect, it } from "vitest";
import { chipScale, frameLabelKey, orientationRows } from "./PhoneFrameLabels";

it("scales the smallest chip font to the minimum and never enlarges a label", () => {
  expect(chipScale(12, [20, 20])).toBeCloseTo(0.6);
  expect(chipScale(12, [20, 22, 17])).toBeCloseTo(12 / 17);
  expect(chipScale(12, [10])).toBe(1);
  expect(chipScale(12, [])).toBe(1);
  expect(chipScale(12, [0, Number.NaN, 20])).toBeCloseTo(0.6);
});

it("keeps the head and both side chips on one row at 390 px, at their physical slots", () => {
  const W = 350; // a chest-sized detector in scene units
  for (const cssWidth of [356, 374]) for (const [startText, endText] of [["Patient's right", "Patient's left"], ["يمين المريض", "يسار المريض"]] as const) {
    // Bounding boxes in label units at font 20: about 10 units per character, generous for Arabic joins.
    const box = (x: number, text: string) => ({ key: frameLabelKey(x, -22, 20, text), x: 0, y: -16, width: text.length * 10 + 20, height: 22 });
    const top = [box(W / 2, "↑ Head"), box(-24, startText), box(W + 24, endText)];
    const scale = chipScale(12, [20, 20]);
    const rows = orientationRows(cssWidth / scale, W, top);
    // One row: the band is one label high plus the insets.
    expect(rows.height).toBeLessThanOrEqual(22 + 2 + 2 * 3);
    // On screen the chip row is at most ~20 px tall and its font is exactly the minimum.
    expect(rows.height * scale).toBeLessThanOrEqual(20);
    expect(20 * scale).toBeGreaterThanOrEqual(12);
    const [head, start, end] = top.map((l) => rows.positions[l.key]!.x);
    expect(start).toBeLessThan(head!);
    expect(head).toBeLessThan(end!);
  }
});
