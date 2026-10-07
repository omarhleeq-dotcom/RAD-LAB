"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
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
import { FrontalFigure } from "./FrontalFigure";
import { LateralFigure } from "./LateralFigure";
import { SceneArrow, SceneLabel, UnderStroked } from "./SceneParts";
import { LABEL_SIZE, SCENE, UNDER } from "./scene-style";
import { rotationVisual, scapulaOffset } from "./visual-model";

/** Drawing scale: SVG units per detector cm. Only the drawing depends on it; state is normalized. */
const U = 10;
const KEY_STEP = 0.02;
const KEY_STEP_LARGE = 0.1;
const HANDLE = 14; // visible handle size
const HIT = 44; // touch-friendly hit target

type DragTarget = { kind: "ray" } | { kind: "marker" } | { kind: "edge"; edge: FieldEdge };

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  onChange: <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => void;
  disabled: boolean;
  showGuides: boolean;
  /** Which hand-drawn patient figure to draw (S12). Default: the Chest PA frontal figure. */
  figure?: "chest-pa" | "chest-lateral";
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
export function DetectorWorkspace({ radCase, settings, onChange, disabled, showGuides, figure = "chest-pa" }: Props) {
  const t = useTranslations("positioning");
  const tl = useTranslations("positioningLateral");
  const ts = useTranslations("scene");
  const lateralFigure = figure === "chest-lateral";
  const [drag, setDrag] = useState<{ target: DragTarget; grab: NormPoint } | null>(null);

  const { detector, requiredAnatomy: a, positioning } = radCase;
  const W = detector.widthCm * U;
  const H = detector.heightCm * U;
  const frame: DetectorFrame = { x: 0, y: 0, width: W, height: H };
  const viewBox: Box = { x: -30, y: -90, width: W + 60, height: H + 120 };
  const lateral = settings.projection === "lateral-left";

  const rv = rotationVisual(settings.rotationDeg);
  const thoraxScale = lateral ? 0.45 : rv.thoraxScale;
  const field = collimatedField(settings, detector);
  const fx = field.x1 * U, fy = field.y1 * U, fw = (field.x2 - field.x1) * U, fh = (field.y2 - field.y1) * U;
  const ray = normToView(settings.centralRay, frame);
  const lungY = a.yCm * U, lungH = a.heightCm * U, lungW = (a.widthCm * U) / 2 - 8;
  const mid = W / 2;
  const status = centeringStatus(settings.centralRay, positioning.centering);
  const rayOk = status.x.state === "ideal" && status.y.state === "ideal";
  const rayColor = !showGuides ? SCENE.beam : rayOk ? SCENE.good : SCENE.beam;
  const tgt = positioning.centering;
  const tgtView = normToView(tgt.target, frame);
  const sc = scapulaOffset(settings.shoulderPosition);

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
      const p = toNorm(e);
      const origin = target.kind === "ray" ? settings.centralRay : target.kind === "marker" ? settings.markerPosition : p;
      setDrag({ target, grab: { x: origin.x - p.x, y: origin.y - p.y } });
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
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    },
    onPointerCancel: () => {
      setDrag(null);
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
  const mSize = positioning.markerSizeCm * U;

  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      role="group"
      aria-label={lateralFigure ? tl("alt") : t("alt")}
      className="h-auto w-full select-none"
      style={{ direction: "ltr", touchAction: disabled ? "auto" : "none" }}
    >
      <rect x={-6} y={-6} width={W + 12} height={H + 12} rx={6} fill={SCENE.bezel} />
      <rect x={0} y={0} width={W} height={H} fill={SCENE.detectorFill} stroke={SCENE.detectorEdge} strokeWidth={2} />

      {/* Patient. Anatomy is drawn in detector space; it is never mirrored by RTL. The drawing has a text alternative (scene.alt*). */}
      <g role="img" aria-label={lateralFigure ? ts("altLateral", { arms: ts(settings.choices?.arms === "raised" ? "armsRaised" : "armsLowered"), chin: ts(settings.chinPosition === "tucked" ? "chinTucked" : "chinLifted") }) : ts("altFrontal", { chin: ts(settings.chinPosition === "tucked" ? "chinTucked" : "chinLifted"), shoulders: ts(settings.shoulderPosition === "rolled-forward" ? "shouldersRolled" : "shouldersRelaxed") })}>
        {lateralFigure ? (
          <LateralFigure
            W={W}
            H={H}
            region={{ x: a.xCm * U, y: lungY, w: a.widthCm * U, h: lungH }}
            rotationDeg={settings.rotationDeg}
            chin={settings.chinPosition}
            armsRaised={settings.choices?.arms === "raised"}
            showGuides={showGuides}
          />
        ) : (
          <FrontalFigure W={W} H={H} thoraxScale={thoraxScale} rv={rv} lungY={lungY} lungH={lungH} lungW={lungW} scapula={sc} chin={settings.chinPosition} />
        )}
      </g>

      {showGuides && (
        <g aria-hidden style={{ pointerEvents: "none" }}>
          <UnderStroked stroke={SCENE.guide} width={2} dash="3 7">
            {(p) => <line x1={mid} y1={0} x2={mid} y2={H} {...p} />}
          </UnderStroked>
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
          <SceneLabel x={mid + 8} y={H - 14} size={LABEL_SIZE.detector - 4} fill={SCENE.guide}>{lateralFigure ? tl("midline") : t("midline")}</SceneLabel>
          <SceneLabel x={W - 8} y={tgtView.y - (tgt.acceptableTolerance.y * H) / 2 + 16} size={LABEL_SIZE.detector - 4} anchor="end" fill={SCENE.good}>{t("targetZone")}</SceneLabel>
        </g>
      )}

      {marker && (
        <g {...dragProps({ kind: "marker" })} {...keyProps(settings.markerPosition, "markerPosition")} tabIndex={disabled ? -1 : 0} role="button" aria-label={t("markerHandle", { side: marker })} style={{ cursor: disabled ? "default" : "grab" }}>
          <rect x={mv.x - HIT / 2} y={mv.y - HIT / 2} width={HIT} height={HIT} fill="transparent" />
          <rect x={mv.x - mSize / 2} y={mv.y - mSize / 2} width={mSize} height={mSize} rx={4} fill="#e8edf1" stroke="#0b141b" strokeWidth={1.5} />
          <text x={mv.x} y={mv.y + 10} textAnchor="middle" fontSize={28} fontWeight={800} fill={SCENE.bg}>
            {marker}
          </text>
        </g>
      )}

      {/* outside the collimated field the detector receives no beam */}
      <path fillRule="evenodd" fill="#000" opacity={0.5} d={`M0 0H${W}V${H}H0Z M${fx} ${fy}h${fw}v${fh}h${-fw}Z`} style={{ pointerEvents: "none" }} />
      <g style={{ pointerEvents: "none" }}>
        <UnderStroked stroke={SCENE.beam} width={3} dash="14 8">
          {(p) => <rect x={fx} y={fy} width={fw} height={fh} {...p} fill="none" />}
        </UnderStroked>
      </g>

      {/* orientation labels (image convention, never mirrored by RTL): Head at the top, Feet at the bottom edge; anterior / posterior (lateral) or the patient's sides (frontal, practice guides) */}
      <g aria-hidden style={{ pointerEvents: "none" }}>
        <SceneArrow x1={-20} y1={-48} x2={-20} y2={-80} />
        <SceneLabel x={-6} y={-58} size={LABEL_SIZE.detector}>{ts("head")}</SceneLabel>
        <SceneArrow x1={32} y1={H + 4} x2={32} y2={H + 30} />
        <SceneLabel x={44} y={H + 24} size={LABEL_SIZE.detector}>{ts("feet")}</SceneLabel>
        {lateralFigure ? (
          <>
            <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("anterior")}</SceneLabel>
            <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("posterior")}</SceneLabel>
          </>
        ) : (
          showGuides && (
            <>
              <SceneLabel x={-24} y={-22} size={LABEL_SIZE.detector}>{ts("patientRight")}</SceneLabel>
              <SceneLabel x={W + 24} y={-22} size={LABEL_SIZE.detector} anchor="end">{ts("patientLeft")}</SceneLabel>
            </>
          )
        )}
      </g>

      {edges.map(({ edge, x, y }) => (
        <g key={edge} aria-hidden {...dragProps({ kind: "edge", edge })} style={{ cursor: disabled ? "default" : EDGE_CURSOR[edge] }}>
          <rect x={x - HIT / 2} y={y - HIT / 2} width={HIT} height={HIT} fill="transparent" />
          <rect x={x - HANDLE / 2} y={y - HANDLE / 2} width={HANDLE} height={HANDLE} rx={3} fill={SCENE.beam} stroke={SCENE.underStroke} strokeWidth={2} />
        </g>
      ))}

      <g {...dragProps({ kind: "ray" })} {...keyProps(settings.centralRay, "centralRay")} tabIndex={disabled ? -1 : 0} role="button" aria-label={t("rayHandle")} aria-describedby="ray-status" style={{ cursor: disabled ? "default" : "grab" }}>
        <circle cx={ray.x} cy={ray.y} r={HIT / 2 + 6} fill="transparent" />
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

      <SceneLabel x={mid} y={H + 24} size={LABEL_SIZE.detector + 2} anchor="middle">{ts("detector")}</SceneLabel>
    </svg>
  );
}
