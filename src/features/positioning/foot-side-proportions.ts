/**
 * Proportions of the FOOT side view read from the traced outlines (RAD-072 2b; `foot-outlines.json`; drawing only, not a measurement, no scoring or
 * geometry change). The side view is a schematic of the set-up; only two sizes are taken from the traced foot, the ones its baselines show:
 *  - the reach of the toes beyond the centring target (the base of the 3rd metatarsal): from the target row to the tip of the most distal traced
 *    phalanx, at the baseline's scale;
 *  - the forefoot width at the metatarsal heads (the soft-tissue span across a row), the width of the end-view cross-section.
 * The heel and the ankle are NOT in the baselines (the image stops at the hindfoot), so the schematic's heel part keeps its fixed shape.
 */
import outlines from "./foot-outlines.json";
import { lowerLimbImage } from "@/data/exams/xray/lower-limb-geometry";
import { LOWER_LIMB_SIDE } from "./lower-limb-visual";
import { softSpanPx, type Pt } from "./outline-geometry";

type Kind = "foot-ap" | "foot-oblique";
const VIEW = { "foot-ap": "ap", "foot-oblique": "oblique" } as const;
/** Row (image px) and column across which the forefoot width is read: the metatarsal shafts, mid-foot of each image. */
const WIDTH_ROW = { "foot-ap": { y: 1000, x: 520 }, "foot-oblique": { y: 1000, x: 560 } } as const;

export interface FootSideProportions {
  /** Target → tip of the toes, side-view units. */
  toeReach: number;
  /** Forefoot width, side-view units. */
  forefootWidth: number;
}

export function footSideProportions(kind: Kind): FootSideProportions {
  const view = outlines.views[VIEW[kind]];
  const im = lowerLimbImage(kind);
  const tipY = Math.min(...view.structures.filter((s) => s.group === "phalanges").flatMap((s) => (s.points as Pt[]).map((p) => p[1])));
  const runs = view.structures.filter((s) => s.group === "soft").map((s) => s.points as Pt[]);
  const w = WIDTH_ROW[kind];
  const unit = im.cmPerPx * LOWER_LIMB_SIDE.pxPerCm;
  return { toeReach: Math.round((im.targetPx.y - tipY) * unit), forefootWidth: Math.round(softSpanPx(runs, w.y, w.x) * unit) };
}
