"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { ResultDisclosure } from "@/features/evaluation/ResultDisclosure";
import { sidGeometryDiagram, type SidDiagramPanel, type SidExplainerInput } from "@/features/evaluation/sid-geometry";

/**
 * SID "Why?" explainer (owner option C; D-R3): a schematic comparison only. Geometry comes from the pure
 * `sidGeometryDiagram`; this component draws it. No magnification / OID numbers; the patient image is untouched.
 * Like every schematic it stays LTR in Arabic (no mirroring); its labels sit outside the SVG.
 */
export function SidGeometryExplainer({ input }: { input: SidExplainerInput }) {
  const t = useTranslations("result.sidGeometry");
  const d = sidGeometryDiagram(input);
  const figure = (key: "yours" | "reference", p: SidDiagramPanel) => (
    <Panel key={key} panel={p} width={d.width} height={d.height} label={t(key)} desc={t(`desc.${key}.${d.relation}`)} />
  );
  return (
    <div data-testid="sid-geometry-explainer" data-relation={d.relation} className="mt-2">
      <ResultDisclosure title={<strong className="text-ink">{t("title")}</strong>} className="rounded border border-line">
        <p className="text-sm text-ink">{t(`summary.${d.relation}`)}</p>
        <div className="mt-2 grid max-w-md grid-cols-2 gap-2">{figure("yours", d.yours)}{figure("reference", d.reference)}</div>
        <p className="mt-2 text-xs text-muted">{t("legend")}</p>
        <p className="mt-1 text-xs font-semibold text-muted">{t("notToScale")}</p>
      </ResultDisclosure>
    </div>
  );
}

function Panel({ panel: p, width, height, label, desc }: { panel: SidDiagramPanel; width: number; height: number; label: string; desc: string }) {
  const id = useId();
  const line = { strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const };
  return (
    <figure className="min-w-0 rounded border border-line bg-paper/60 p-1">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-t ${id}-d`} style={{ direction: "ltr" }} className="block h-auto w-full text-ink">
        <title id={`${id}-t`}>{label}</title>
        <desc id={`${id}-d`}>{desc}</desc>
        <g className="text-muted" stroke="currentColor" {...line}>
          {p.rays.slice(0, 2).map((r, i) => <line key={i} {...r} />)}
          {p.rays.slice(2).map((r, i) => <line key={i} {...r} strokeDasharray="2 2" opacity={0.7} />)}
        </g>
        <rect x={p.focalSpot.x1} y={p.focalSpot.y - 3} width={p.focalSpot.x2 - p.focalSpot.x1} height={5} className="fill-signal" />
        <rect {...p.object} rx={1} className="fill-brand" />
        <line x1={p.detector.x1} y1={p.detector.y} x2={p.detector.x2} y2={p.detector.y} stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {p.penumbra.map((s, i) => <rect key={i} x={s.x1} y={p.detector.y - 7} width={s.x2 - s.x1} height={6} className="fill-current" opacity={0.35} />)}
        <rect x={p.umbra.x1} y={p.detector.y - 7} width={p.umbra.x2 - p.umbra.x1} height={6} className="fill-current" />
      </svg>
      <figcaption className="mt-1 text-center text-xs font-semibold text-ink">{label}</figcaption>
    </figure>
  );
}
