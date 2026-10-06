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
import { chinOverlapsApices, rotationVisual, scapulaOffset } from "./visual-model";

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
export function DetectorWorkspace({ radCase, settings, onChange, disabled, showGuides }: Props) {
  const t = useTranslations("positioning");
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
  const rayColor = !showGuides ? "#f2b134" : rayOk ? "#4ade80" : "#f2b134";
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
      aria-label={t("alt")}
      className="h-auto w-full select-none"
      style={{ direction: "ltr", touchAction: disabled ? "auto" : "none" }}
    >
      <rect x={-6} y={-6} width={W + 12} height={H + 12} rx={6} fill="#1a2b38" />
      <rect x={0} y={0} width={W} height={H} fill="#0b141b" />

      {/* Patient (front view). Anatomy is drawn in detector space; it is never mirrored by RTL. */}
      <g transform={`translate(${mid} 0) scale(${thoraxScale} 1) translate(${-mid} 0)`}>
        <circle cx={mid} cy={-35} r={34} fill="#7b93a5" />
        <rect x={mid - 14} y={-6} width={28} height={30} fill="#7b93a5" />
        <path d={`M 20 28 Q ${mid} -8 ${W - 20} 28 L ${W - 36} ${H - 90} Q ${mid} ${H - 70} 36 ${H - 90} Z`} fill="#5d778a" />
        <rect x={mid - 8 - lungW * rv.viewerLeftLungScale} y={lungY} width={lungW * rv.viewerLeftLungScale} height={lungH} rx={50} fill="#33516a" />
        <rect x={mid + 8} y={lungY} width={lungW * rv.viewerRightLungScale} height={lungH} rx={50} fill="#33516a" />
        {/* clavicles with medial (sternal) ends */}
        <g stroke="#b9cad6" strokeWidth={5} strokeLinecap="round" opacity={0.85}>
          <line x1={mid - 12} y1={lungY + 6} x2={mid - lungW - 20} y2={lungY - 4} />
          <line x1={mid + 12} y1={lungY + 6} x2={mid + lungW + 20} y2={lungY - 4} />
        </g>
        <circle cx={mid - 12} cy={lungY + 6} r={7} fill="#d8e4ec" />
        <circle cx={mid + 12} cy={lungY + 6} r={7} fill="#d8e4ec" />
        {/* scapulae: over the lung fields when shoulders are relaxed, laterally clear when rolled forward */}
        <g fill="#9db6c6" opacity={0.6} stroke="#d8e4ec" strokeWidth={1.5}>
          <ellipse cx={mid - lungW + 14 - sc} cy={lungY + 110} rx={26} ry={72} />
          <ellipse cx={mid + lungW - 14 + sc} cy={lungY + 110} rx={26} ry={72} />
        </g>
        {chinOverlapsApices(settings.chinPosition) && (
          <ellipse cx={mid} cy={lungY + 14} rx={62} ry={34} fill="#7b93a5" opacity={0.85} stroke="#d8e4ec" strokeWidth={1.5} strokeDasharray="5 4" />
        )}
      </g>
      {/* spinous-process line: shifts relative to the clavicular ends as the thorax rotates */}
      <line x1={mid + rv.spineShift} y1={20} x2={mid + rv.spineShift} y2={H - 100} stroke="#d8e4ec" strokeWidth={2} strokeDasharray="6 6" opacity={0.6} />

      {showGuides && (
        <g aria-hidden>
          <line x1={mid} y1={0} x2={mid} y2={H} stroke="#7dd3fc" strokeWidth={1.5} strokeDasharray="3 7" opacity={0.7} />
          <rect
            x={tgtView.x - (tgt.acceptableTolerance.x * W) / 2}
            y={tgtView.y - (tgt.acceptableTolerance.y * H) / 2}
            width={tgt.acceptableTolerance.x * W}
            height={tgt.acceptableTolerance.y * H}
            rx={10}
            fill="#4ade80"
            opacity={0.07}
          />
          <rect
            x={tgtView.x - (tgt.idealTolerance.x * W) / 2}
            y={tgtView.y - (tgt.idealTolerance.y * H) / 2}
            width={tgt.idealTolerance.x * W}
            height={tgt.idealTolerance.y * H}
            rx={8}
            fill="#4ade80"
            opacity={0.18}
            stroke="#4ade80"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <text x={mid + 6} y={16} fontSize={14} fill="#7dd3fc" stroke="#0b141b" strokeWidth={3} paintOrder="stroke">
            {t("midline")}
          </text>
          <text x={tgtView.x + (tgt.acceptableTolerance.x * W) / 2 + 4} y={tgtView.y - (tgt.acceptableTolerance.y * H) / 2 + 14} fontSize={13} fill="#4ade80" stroke="#0b141b" strokeWidth={3} paintOrder="stroke">
            {t("targetZone")}
          </text>
        </g>
      )}

      {marker && (
        <g {...dragProps({ kind: "marker" })} {...keyProps(settings.markerPosition, "markerPosition")} tabIndex={disabled ? -1 : 0} role="button" aria-label={t("markerHandle", { side: marker })} style={{ cursor: disabled ? "default" : "grab" }}>
          <rect x={mv.x - HIT / 2} y={mv.y - HIT / 2} width={HIT} height={HIT} fill="transparent" />
          <rect x={mv.x - mSize / 2} y={mv.y - mSize / 2} width={mSize} height={mSize} rx={4} fill="#e8edf1" stroke="#0b141b" strokeWidth={1.5} />
          <text x={mv.x} y={mv.y + 10} textAnchor="middle" fontSize={28} fontWeight={800} fill="#0b141b">
            {marker}
          </text>
        </g>
      )}

      {/* outside the collimated field the detector receives no beam */}
      <path fillRule="evenodd" fill="#000" opacity={0.62} d={`M0 0H${W}V${H}H0Z M${fx} ${fy}h${fw}v${fh}h${-fw}Z`} style={{ pointerEvents: "none" }} />
      <rect x={fx} y={fy} width={fw} height={fh} fill="none" stroke="#f2b134" strokeWidth={3} strokeDasharray="14 8" style={{ pointerEvents: "none" }} />

      {edges.map(({ edge, x, y }) => (
        <g key={edge} aria-hidden {...dragProps({ kind: "edge", edge })} style={{ cursor: disabled ? "default" : EDGE_CURSOR[edge] }}>
          <rect x={x - HIT / 2} y={y - HIT / 2} width={HIT} height={HIT} fill="transparent" />
          <rect x={x - HANDLE / 2} y={y - HANDLE / 2} width={HANDLE} height={HANDLE} rx={3} fill="#f2b134" stroke="#0b141b" strokeWidth={1.5} />
        </g>
      ))}

      <g {...dragProps({ kind: "ray" })} {...keyProps(settings.centralRay, "centralRay")} tabIndex={disabled ? -1 : 0} role="button" aria-label={t("rayHandle")} aria-describedby="ray-status" style={{ cursor: disabled ? "default" : "grab" }}>
        <circle cx={ray.x} cy={ray.y} r={HIT / 2 + 6} fill="transparent" />
        <g stroke={rayColor} strokeWidth={3}>
          <line x1={ray.x - 26} y1={ray.y} x2={ray.x + 26} y2={ray.y} />
          <line x1={ray.x} y1={ray.y - 26} x2={ray.x} y2={ray.y + 26} />
          <circle cx={ray.x} cy={ray.y} r={11} fill="rgba(0,0,0,0.35)" />
        </g>
      </g>

      <text x={mid} y={H + 24} textAnchor="middle" fontSize={22} fill="#d8e4ec">
        {t("detector")}
      </text>
    </svg>
  );
}
