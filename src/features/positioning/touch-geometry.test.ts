import { describe, expect, it } from "vitest";
import { HANDLE, HIT, PHONE_HIT_PX, markerBox, touchGeometry } from "./touch-geometry";

describe("phone touch geometry (owner phone check 2)", () => {
  it("is the unchanged default without a measured scale (desktop)", () => {
    expect(touchGeometry(null)).toEqual({ hit: HIT, handle: HANDLE, rayHit: HIT / 2 + 6, markerScale: 1 });
  });

  it("gives every hit area at least 44 CSS px at any phone scale", () => {
    for (const scale of [0.3, 0.45, 0.6, 0.8, 1, 1.5]) {
      const g = touchGeometry(scale);
      expect(g.hit * scale).toBeGreaterThanOrEqual(PHONE_HIT_PX - 1e-9);
      expect(g.rayHit * 2 * scale).toBeGreaterThanOrEqual(PHONE_HIT_PX - 1e-9);
      expect(g.hit).toBeGreaterThanOrEqual(HIT);
    }
  });

  it("draws the marker larger on a small scene but never moves its centre (scored position and display half)", () => {
    const centre = { x: 137.5, y: 211.25 };
    const base = markerBox(centre, 40, touchGeometry(null).markerScale);
    for (const scale of [0.3, 0.45, 0.6, 1]) {
      const g = touchGeometry(scale);
      const box = markerBox(centre, 40, g.markerScale);
      expect(box.x + box.size / 2).toBeCloseTo(centre.x, 9);
      expect(box.y + box.size / 2).toBeCloseTo(centre.y, 9);
      expect(box.x + box.size / 2).toBeCloseTo(base.x + base.size / 2, 9);
    }
    expect(touchGeometry(0.45).markerScale).toBeGreaterThan(1);
    expect(markerBox(centre, 40, touchGeometry(0.45).markerScale).size).toBeGreaterThan(base.size);
  });
});
