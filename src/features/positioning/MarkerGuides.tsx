"use client";
import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { markerRect, regionToRect } from "@/features/simulation/geometry";
import { SCENE } from "./scene-style";
import { UnderStroked } from "./SceneParts";

/** Drawing only. Both outlines read exactly the rectangles used by marker evaluation; no fill covers the anatomy. */
export function MarkerGuideOverlays({ radCase: c, settings: s }: { radCase: RadCase; settings: SimulationSettings }) {
  const t = useTranslations("positioning"), U = 10;
  const zones = (c.positioning.markerKeepOut ?? [c.requiredAnatomy]).map(regionToRect);
  const square = s.sideMarker ? markerRect(s.markerPosition, c.positioning.markerSizeCm, c.detector) : null;
  return <g style={{ pointerEvents: "none" }}>
    <g role="img" aria-label={t("markerExclusionGuide")}>
      <title>{t("markerExclusionGuide")}</title>
      {zones.map((r, i) => <UnderStroked key={i} stroke={SCENE.guide} width={1.3} dash="8 5">
        {p => <rect x={r.x1 * U} y={r.y1 * U} width={(r.x2 - r.x1) * U} height={(r.y2 - r.y1) * U} {...p} fill="none" />}
      </UnderStroked>)}
    </g>
    {square && <g role="img" aria-label={t("markerSquareGuide", { size: c.positioning.markerSizeCm })}>
      <title>{t("markerSquareGuide", { size: c.positioning.markerSizeCm })}</title>
      <UnderStroked stroke={SCENE.guide} width={1.3} dash="2 2">
        {p => <rect x={square.x1 * U} y={square.y1 * U} width={c.positioning.markerSizeCm * U} height={c.positioning.markerSizeCm * U} {...p} fill="none" />}
      </UnderStroked>
    </g>}
  </g>;
}

/** Visible labels outside the drawing, matched by dash pattern; no new label competes with anatomy or touch targets. */
export function MarkerGuideLegend({ size }: { size: number }) {
  const t = useTranslations("positioning");
  return <ul className="mt-1 space-y-1 text-xs text-console-text">
    <li className="flex items-center gap-2"><span aria-hidden className="inline-block w-5 shrink-0 border-t-2 border-dashed" style={{ borderColor: SCENE.guide }} />{t("markerExclusionGuide")}</li>
    <li className="flex items-center gap-2"><span aria-hidden className="inline-block size-3 shrink-0 border-2 border-dotted" style={{ borderColor: SCENE.guide }} />{t("markerSquareGuide", { size })}</li>
  </ul>;
}
