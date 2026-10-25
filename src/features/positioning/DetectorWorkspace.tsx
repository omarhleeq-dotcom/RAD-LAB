"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { NormPoint, SimulationSettings } from "@/domain/simulation";
import { centeringStatus } from "@/features/evaluation/centering";
import {
  clientToNorm,
  collimationFromEdgeDrag,
  nudge,
  normToView,
  roundTo,
  type Box,
  type DetectorFrame,
  type FieldEdge,
} from "@/features/simulation/coords";
import { collimatedField } from "@/features/simulation/geometry";
import { CHEST_PA_FIGURE, DETECTOR_FIGURES, U, type DetectorFigure } from "./detector-figures";
import { SceneArrow, SceneLabel, UnderStroked } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE, UNDER } from "./scene-style";
import { MarkerGuideOverlays, MarkerGuideLegend } from "./MarkerGuides";
import { detectorViewBox, phoneFit } from "./fit-view";
import { PhoneFrameLabels } from "./PhoneFrameLabels";
import { markerBox, nearestTouchTarget, touchGeometry, type TouchCandidate } from "./touch-geometry";

const KEY_STEP = 0.02;
const KEY_STEP_LARGE = 0.1;

/** Size of the midline / target-zone labels in the top margin band of the limb scenes (S-VIS-1b-6, O54: was 15; ≈ 11.9 px on a 390 px phone). */
const MARGIN_LABEL_SIZE = 16.5;

type DragTarget = { kind: "ray" } | { kind: "marker" } | { kind: "edge"; edge: FieldEdge };

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  disabled: boolean;
  showGuides: boolean;
  /** Which hand-drawn patient figure to draw: an entry of the figure registry (`detector-figures.tsx`, S14-0). Default: the Chest PA frontal figure. */
  figure?: DetectorFigure;
  /** Phone layout (UI-3): measures the on-screen scale and draws the touch hit areas at >= 44 CSS px and a larger marker letter. Omitted on desktop: the DOM is unchanged. */
  phone?: boolean;
  /** Phone only: show the detector fitted to the anatomy and the field (the viewBox only; stored coordinates are unaffected). Omitted/false = the whole detector. */
  fit?: boolean;
}

const EDGE_CURSOR: Record<FieldEdge, string> = {
  left: "ew-resize",
  right: "ew-resize",
  top: "ns-resize",
  bottom: "ns-resize",
  "top-left": "nwse-resize",
  "bottom-right": "nwse-resize",
  "top-right": "nesw-resize",
  "bottom-left": "nesw-resize",
};

function keyDelta(e: KeyboardEvent): [number, number] | null {
  const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
  switch (e.key) {
    case "ArrowLeft":
      return [-step, 0];
    case "ArrowRight":
      return [step, 0];
    case "ArrowUp":
      return [0, -step];
    case "ArrowDown":
      return [0, step];
    default:
      return null;
  }
}

/**
 * Interactive front view of the detector. All coordinates it reads/writes are normalized; the SVG
 * (viewBox + `direction: ltr`) is only a renderer, so window size and RTL never change anatomy geometry.
 *
 * Touch: Chromium only honours `touch-action` on the root <svg>, not on SVG children, so the workspace
 * suppresses touch panning while editable (and releases it once locked); the surrounding gutter still scrolls.
 */
export function DetectorWorkspace({ radCase, settings, onChange, disabled, showGuides, figure = CHEST_PA_FIGURE, phone = false, fit = false }: Props) {
  const t = useTranslations("positioning");
  const tAny = useTranslations() as unknown as (key: string) => string;
  const ts = useTranslations("scene");
  const { Drawing } = figure;
  // The side / axis / midline labels follow the SELECTED projection, not the exam (S-VIS-1b-4, O72): a limb figure (they all declare margin guide
  // labels) is looked up by the projection id; the chest figures keep their own labels (byte-identical).
  const labels: DetectorFigure = figure.marginGuideLabels ? (DETECTOR_FIGURES[settings.projection] ?? figure) : figure;
  const { Orientation } = labels;
  const [drag, setDrag] = useState<{ target: DragTarget; grab: NormPoint } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // CSS px per scene unit, measured only in phone mode.
  const [scale, setScale] = useState<number | null>(null);

  const { detector, positioning } = radCase;
  const W = detector.widthCm * U;
  const H = detector.heightCm * U;
  const frame: DetectorFrame = { x: 0, y: 0, width: W, height: H };
  // The whole-detector view: a figure with margin guide labels (S-VIS-1-4) gets two more label rows above the orientation labels, and the bottom
  // axis label sits 5 units lower to clear the bottom collimation handle (S-VIS-1b-3, O53) — see `detectorViewBox`.
  const whole: Box = detectorViewBox(W, H, !!figure.marginGuideLabels);
  // Phone: the fitted view (anatomy + field). It is held still while a drag is in progress, so the picture does not move under the finger.
  const [frozen, setFrozen] = useState<Box | null>(null);
  const viewBox: Box = frozen ?? (phone && fit ? phoneFit(radCase, settings, !!figure.marginGuideLabels).box : whole);

  const field = collimatedField(settings, detector);
  const fx = field.x1 * U, fy = field.y1 * U, fw = (field.x2 - field.x1) * U, fh = (field.y2 - field.y1) * U;
  const ray = normToView(settings.centralRay, frame);
  const mid = W / 2;
  const status = centeringStatus(settings.centralRay, positioning.centering);
  const rayOk = status.x.state === "ideal" && status.y.state === "ideal";
  const rayColor = !showGuides ? SCENE.beam : rayOk ? SCENE.good : SCENE.beam;
  const tgt = positioning.centering;
  const tgtView = normToView(tgt.target, frame);

  useEffect(() => {
    const svg = svgRef.current;
    if (!phone || !svg) return;
    const measure = () => {
      // The drawing is letterboxed (viewBox "meet") when the phone CSS caps the height, so the scale is the smaller of the two ratios.
      const { width, height } = svg.getBoundingClientRect();
      if (width > 0 && height > 0) setScale(Math.min(width / viewBox.width, height / viewBox.height));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    measure();
    return () => observer.disconnect();
  }, [phone, viewBox.width, viewBox.height]);
  // Hit areas, handle size and marker enlargement in scene units (the unchanged defaults without `phone` or before the first measurement).
  const { hit, handle, rayHit, markerScale } = touchGeometry(phone ? scale : null);

  const toNorm = (e: PointerEvent<SVGElement>): NormPoint => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return clientToNorm({ x: e.clientX, y: e.clientY }, r, viewBox, frame);
  };

  const dragProps = (target: DragTarget) => ({
    onPointerDown: (e: PointerEvent<SVGElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      if (phone && fit) setFrozen(viewBox);
      const p = toNorm(e);
      // Phone: the enlarged hit areas overlap at a small on-screen scale (the whole-detector view); the touch goes to the control whose
      // visible centre is nearest, never to the one merely drawn last (RAD-068). Desktop keeps the element that was hit.
      const aimed = phone ? (nearestTouchTarget(normToView(p, frame), touchCandidates()) ?? target) : target;
      const origin = aimed.kind === "ray" ? settings.centralRay : aimed.kind === "marker" ? settings.markerPosition : p;
      setDrag({ target: aimed, grab: { x: origin.x - p.x, y: origin.y - p.y } });
    },
    onPointerMove: (e: PointerEvent<SVGElement>) => {
      const d = drag;
      if (!d || disabled) return;
      const p = toNorm(e);
      if (d.target.kind === "edge") {
        const next = collimationFromEdgeDrag(p, settings.centralRay, d.target.edge, settings.collimation, positioning.minCollimation);
        onChange("collimation", { width: roundTo(next.width), height: roundTo(next.height) });
        return;
      }
      const moved = { x: roundTo(Math.min(1, Math.max(-1, p.x + d.grab.x))), y: roundTo(Math.min(1, Math.max(-1, p.y + d.grab.y))) };
      onChange(d.target.kind === "ray" ? "centralRay" : "markerPosition", moved);
    },
    onPointerUp: (e: PointerEvent<SVGElement>) => {
      setDrag(null);
      setFrozen(null);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    },
    onPointerCancel: () => {
      setDrag(null);
      setFrozen(null);
    },
  });

  const keyProps = (current: NormPoint, key: "centralRay" | "markerPosition") => ({
    onKeyDown: (e: KeyboardEvent) => {
      const d = keyDelta(e);
      if (!d || disabled) return;
      e.preventDefault();
      const n = nudge(current, d[0], d[1]);
      onChange(key, { x: roundTo(n.x), y: roundTo(n.y) });
    },
  });

  const edges: { edge: FieldEdge; x: number; y: number }[] = [
    { edge: "top-left", x: fx, y: fy },
    { edge: "top", x: fx + fw / 2, y: fy },
    { edge: "top-right", x: fx + fw, y: fy },
    { edge: "left", x: fx, y: fy + fh / 2 },
    { edge: "right", x: fx + fw, y: fy + fh / 2 },
    { edge: "bottom-left", x: fx, y: fy + fh },
    { edge: "bottom", x: fx + fw / 2, y: fy + fh },
    { edge: "bottom-right", x: fx + fw, y: fy + fh },
  ];

  const marker = settings.sideMarker;
  const mv = normToView(settings.markerPosition, frame);
  const mBox = markerBox(mv, positioning.markerSizeCm * U, markerScale);
  // Every touchable control with its visible centre and hit area (scene units), for the phone's overlap rule.
  const touchCandidates = (): TouchCandidate<DragTarget>[] => [
    ...edges.map(({ edge, x, y }) => ({ target: { kind: "edge" as const, edge }, x, y, size: hit })),
    ...(marker ? [{ target: { kind: "marker" as const }, x: mv.x, y: mv.y, size: hit }] : []),
    { target: { kind: "ray" }, x: ray.x, y: ray.y, radius: rayHit },
  ];

  // The marker is drawn before the field handles on desktop; on a phone after them, so a handle's (larger) hit area never covers the marker.
  const markerNode = marker && (
        <g {...dragProps({ kind: "marker" })} {...keyProps(settings.markerPosition, "markerPosition")} tabIndex={disabled ? -1 : 0} role="button" aria-label={t("markerHandle", { side: marker })} style={{ cursor: disabled ? "default" : "grab" }}>
          <rect x={mv.x - hit / 2} y={mv.y - hit / 2} width={hit} height={hit} fill="transparent" />
          {figure.crispMarker ? (
            <>
              <rect x={mBox.x} y={mBox.y} width={mBox.size} height={mBox.size} rx={2} fill="#e8edf1" stroke="#0b141b" strokeWidth={1} shapeRendering="crispEdges" />
              <text x={mv.x} y={mv.y + 7 * markerScale} textAnchor="middle" fontSize={20 * markerScale} fontWeight={800} fill={SCENE.bg}>
                {marker}
              </text>
            </>
          ) : (
            <>
              <rect x={mBox.x} y={mBox.y} width={mBox.size} height={mBox.size} rx={4} fill="#e8edf1" stroke="#0b141b" strokeWidth={1.5} />
              <text x={mv.x} y={mv.y + 10 * markerScale} textAnchor="middle" fontSize={28 * markerScale} fontWeight={800} fill={SCENE.bg}>
                {marker}
              </text>
            </>
          )}
        </g>
  );

  const frameRows = phone && fit;
  return (
    <>
    {frameRows && <PhoneFrameLabels>
      <SceneLabel x={-6} y={-58} size={LABEL_SIZE.detector}>{labels.axis ? tAny(labels.axis.top) : ts("head")}</SceneLabel>
    </PhoneFrameLabels>}
    {frameRows && <PhoneFrameLabels detectorWidth={W}>
      <Orientation W={W} showGuides={showGuides} projection={settings.projection} />
    </PhoneFrameLabels>}
    {frameRows && showGuides && <PhoneFrameLabels>
      <>
        <SceneLabel x={W - 4} y={-122} size={figure.marginGuideLabels ? MARGIN_LABEL_SIZE : LABEL_SIZE.detector + 4} anchor="end" fill={SCENE.guide}>{tAny(labels.midlineKey)}</SceneLabel>
        <SceneLabel x={W - 4} y={-92} size={figure.marginGuideLabels ? MARGIN_LABEL_SIZE : LABEL_SIZE.detector + 4} anchor="end" fill={SCENE.good}>{t("targetZone")}</SceneLabel>
      </>
    </PhoneFrameLabels>}
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      role="group"
      aria-label={tAny(figure.altKey)}
      className="h-auto w-full select-none"
      style={{ direction: "ltr", touchAction: disabled ? "auto" : "none" }}
    >
      <rect x={-6} y={-6} width={W + 12} height={H + 12} rx={6} fill={SCENE.bezel} />
      <rect x={0} y={0} width={W} height={H} fill={SCENE.detectorFill} stroke={SCENE.detectorEdge} strokeWidth={2} />

      {/* Patient. Anatomy is drawn in detector space; it is never mirrored by RTL. The drawing has a text alternative (scene.alt*). */}
      <g role="img" aria-label={figure.alt(ts as unknown as (key: string, values?: Record<string, string>) => string, settings)}>
        <Drawing radCase={radCase} settings={settings} showGuides={showGuides} W={W} H={H} />
      </g>

      {showGuides && (
        <g aria-hidden style={{ pointerEvents: "none" }}>
          {figure.marginGuideLabels ? (
            <UnderStroked stroke={SCENE.guide} width={2} dash="3 7">
              {(p) => <line x1={mid} y1={0} x2={mid} y2={H} {...p} />}
            </UnderStroked>
          ) : (
            // Chest (RAD-072 1b): a thinner guide on a lighter under-stroke, so it never out-weighs the anatomy it crosses.
            <>
              <line x1={mid} y1={0} x2={mid} y2={H} stroke={SCENE.underStroke} strokeWidth={STROKE.guide + UNDER} opacity={0.6} strokeLinecap="round" />
              <line x1={mid} y1={0} x2={mid} y2={H} stroke={SCENE.guide} strokeWidth={STROKE.guide} strokeDasharray="3 7" />
            </>
          )}
          <rect
            x={tgtView.x - (tgt.acceptableTolerance.x * W) / 2}
            y={tgtView.y - (tgt.acceptableTolerance.y * H) / 2}
            width={tgt.acceptableTolerance.x * W}
            height={tgt.acceptableTolerance.y * H}
            rx={10}
            fill={SCENE.good}
            opacity={0.1}
          />
          <UnderStroked stroke={SCENE.good} width={2.5} dash="4 4">
            {(p) => (
              <rect
                x={tgtView.x - (tgt.idealTolerance.x * W) / 2}
                y={tgtView.y - (tgt.idealTolerance.y * H) / 2}
                width={tgt.idealTolerance.x * W}
                height={tgt.idealTolerance.y * H}
                rx={8}
                {...p}
                fill={p.fill ?? SCENE.good}
                fillOpacity={p.fill ? undefined : 0.14}
              />
            )}
          </UnderStroked>
          {figure.marginGuideLabels && !frameRows ? (
            <>
              <SceneLabel x={W - 4} y={-122} size={MARGIN_LABEL_SIZE} anchor="end" fill={SCENE.guide}>{tAny(labels.midlineKey)}</SceneLabel>
              <SceneLabel x={W - 4} y={-92} size={MARGIN_LABEL_SIZE} anchor="end" fill={SCENE.good}>{t("targetZone")}</SceneLabel>
            </>
          ) : null}
        </g>
      )}

      {!phone && markerNode}

      {/* outside the collimated field the detector receives no beam */}
      <path fillRule="evenodd" fill="#000" opacity={0.5} d={`M0 0H${W}V${H}H0Z M${fx} ${fy}h${fw}v${fh}h${-fw}Z`} style={{ pointerEvents: "none" }} />
      <g style={{ pointerEvents: "none" }}>
        <UnderStroked stroke={SCENE.beam} width={3} dash="14 8">
          {(p) => <rect x={fx} y={fy} width={fw} height={fh} {...p} fill="none" />}
        </UnderStroked>
      </g>

      {/* Chest guide labels (RAD-072 1b, G4): above the collimation shade (never dimmed by it), larger, centred on what they name and
          inside the detector frame: the target-region label just above its region, the midline label on the line near the bottom. */}
      {showGuides && !figure.marginGuideLabels && !frameRows && (
        <g aria-hidden style={{ pointerEvents: "none" }}>
          <SceneLabel x={tgtView.x} y={Math.max(24, tgtView.y - (tgt.acceptableTolerance.y * H) / 2 - 10)} size={LABEL_SIZE.detector + 4} anchor="middle" fill={SCENE.good}>{t("targetZone")}</SceneLabel>
          <SceneLabel x={mid} y={H - 24} size={LABEL_SIZE.detector + 4} anchor="middle" fill={SCENE.guide}>{tAny(labels.midlineKey)}</SceneLabel>
        </g>
      )}

      {/* orientation labels (image convention, never mirrored by RTL): Head at the top, Feet at the bottom edge; anterior / posterior (lateral) or the patient's sides (frontal, practice guides) */}
      {!frameRows && <g aria-hidden style={{ pointerEvents: "none" }}>
        <SceneArrow x1={-20} y1={-48} x2={-20} y2={-80} />
        <SceneLabel x={-6} y={-58} size={LABEL_SIZE.detector}>{labels.axis ? tAny(labels.axis.top) : ts("head")}</SceneLabel>
        <SceneArrow x1={32} y1={H + 4} x2={32} y2={H + 30} />
        <SceneLabel bounds={phone ? undefined : whole} x={44} y={H + (figure.marginGuideLabels ? 29 : 23)} size={LABEL_SIZE.detector}>{labels.axis ? tAny(labels.axis.bottom) : ts("feet")}</SceneLabel>
        <Orientation W={W} showGuides={showGuides} projection={settings.projection} />
      </g>}

      {edges.map(({ edge, x, y }) => (
        <g key={edge} aria-hidden {...dragProps({ kind: "edge", edge })} style={{ cursor: disabled ? "default" : EDGE_CURSOR[edge] }}>
          <rect x={x - hit / 2} y={y - hit / 2} width={hit} height={hit} fill="transparent" />
          <rect x={x - handle / 2} y={y - handle / 2} width={handle} height={handle} rx={3} fill={SCENE.beam} stroke={SCENE.underStroke} strokeWidth={2} />
        </g>
      ))}

      {phone && markerNode}
      {showGuides && <MarkerGuideOverlays radCase={radCase} settings={settings} />}

      <g {...dragProps({ kind: "ray" })} {...keyProps(settings.centralRay, "centralRay")} tabIndex={disabled ? -1 : 0} role="button" aria-label={t("rayHandle")} aria-describedby="ray-status" style={{ cursor: disabled ? "default" : "grab" }}>
        <circle cx={ray.x} cy={ray.y} r={rayHit} fill="transparent" />
        {/* the crosshair is drawn on a dark under-stroke so it reads on any fill */}
        <g stroke={SCENE.underStroke} strokeWidth={3 + UNDER * 2} strokeLinecap="round" opacity={0.85} fill="none">
          <line x1={ray.x - 26} y1={ray.y} x2={ray.x + 26} y2={ray.y} />
          <line x1={ray.x} y1={ray.y - 26} x2={ray.x} y2={ray.y + 26} />
          <circle cx={ray.x} cy={ray.y} r={11} />
        </g>
        <g stroke={rayColor} strokeWidth={3}>
          <line x1={ray.x - 26} y1={ray.y} x2={ray.x + 26} y2={ray.y} />
          <line x1={ray.x} y1={ray.y - 26} x2={ray.x} y2={ray.y + 26} />
          <circle cx={ray.x} cy={ray.y} r={11} fill="rgba(0,0,0,0.35)" />
        </g>
      </g>

      {!frameRows && <SceneLabel bounds={phone ? undefined : whole} x={figure.axis ? W + 18 : mid} y={H + (figure.marginGuideLabels ? 24 : 23)} size={figure.axis ? LABEL_SIZE.view : LABEL_SIZE.detector + 2} anchor={figure.axis ? "end" : "middle"}>{ts("detector")}</SceneLabel>}
    </svg>
    {frameRows && <PhoneFrameLabels>
      <SceneLabel x={44} y={H + (figure.marginGuideLabels ? 29 : 23)} size={LABEL_SIZE.detector}>{labels.axis ? tAny(labels.axis.bottom) : ts("feet")}</SceneLabel>
      <SceneLabel x={figure.axis ? W + 18 : mid} y={H + (figure.marginGuideLabels ? 24 : 23)} size={figure.axis ? LABEL_SIZE.view : LABEL_SIZE.detector + 2} anchor={figure.axis ? "end" : "middle"}>{ts("detector")}</SceneLabel>
    </PhoneFrameLabels>}
    {showGuides && <MarkerGuideLegend size={positioning.markerSizeCm} />}
    </>
  );
}
