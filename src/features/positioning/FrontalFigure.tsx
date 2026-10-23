import type { ChinPositionId } from "@/domain/simulation";
import { Limb } from "./SceneParts";
import { SCENE, STROKE } from "./scene-style";
import { chinOverlapsApices, type RotationVisual } from "./visual-model";

interface Props {
  W: number;
  H: number;
  thoraxScale: number;
  rv: RotationVisual;
  lungY: number;
  lungH: number;
  lungW: number;
  /** Scapular offset (drawing units) from `scapulaOffset`. */
  scapula: number;
  chin: ChinPositionId;
}

/**
 * Project-authored frontal chest shared by PA and AP. The lung bounds come from the existing fitted anatomy box,
 * with apices above the clavicles, pointed costophrenic angles and a patient-left cardiac notch (viewer right).
 * Drawing proportions only: no clinical measurement, score or result-image effect. Never mirrored by RTL.
 */
export function FrontalFigure({ W, H, thoraxScale, rv, lungY, lungH, lungW, scapula, chin }: Props) {
  const mid = W / 2;
  const p = (side: number, u: number, v: number) => `${mid + side * (8 + u * lungW)} ${lungY + v * lungH}`;
  const lung = (side: number) => `M ${p(side, 0.34, 0)} C ${p(side, 0.67, 0)} ${p(side, 0.92, 0.15)} ${p(side, 0.98, 0.38)} Q ${p(side, 1, 0.68)} ${p(side, 1, 1)} ` +
    (side < 0
      ? `Q ${p(side, 0.56, 0.67)} ${p(side, 0.03, 0.86)} C ${p(side, 0.08, 0.63)} ${p(side, 0.02, 0.32)} ${p(side, 0.12, 0.1)} `
      : `Q ${p(side, 0.72, 0.83)} ${p(side, 0.46, 0.9)} C ${p(side, 0.63, 0.74)} ${p(side, 0.4, 0.56)} ${p(side, 0.03, 0.51)} C ${p(side, 0.02, 0.33)} ${p(side, 0.04, 0.18)} ${p(side, 0.12, 0.1)} `) +
    `Q ${p(side, 0.17, 0)} ${p(side, 0.34, 0)} Z`;
  return (
    <>
      <g transform={`translate(${mid} 0) scale(${thoraxScale} 1) translate(${-mid} 0)`}>
        {/* arms hanging at the sides (outlined and tapered, separate from the trunk); they run off the detector, only the shoulder / upper arm is in the margin */}
        <Limb fill={SCENE.limbFar} pts={[{ x: 22, y: 46, w: 32 }, { x: -8, y: 190, w: 26 }, { x: -12, y: 330, w: 22 }]} />
        <Limb fill={SCENE.limbFar} pts={[{ x: W - 22, y: 46, w: 32 }, { x: W + 8, y: 190, w: 26 }, { x: W + 12, y: 330, w: 22 }]} />
        {/* head (oval with a jaw line) and neck */}
        <rect x={mid - 14} y={-6} width={28} height={34} fill={SCENE.head} />
        <ellipse cx={mid} cy={-35} rx={30} ry={36} fill={SCENE.head} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        <path d={`M ${mid - 22} -20 Q ${mid} 12 ${mid + 22} -20`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.thin} opacity={0.7} />
        {/* trunk: sloping shoulders, then the chest */}
        <path d={`M 20 28 Q ${mid} -8 ${W - 20} 28 L ${W - 32} ${H} L 32 ${H} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
        <circle cx={22} cy={46} r={26} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        <circle cx={W - 22} cy={46} r={26} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        {/* Each hemithorax keeps the existing rotation-size effect. Both bases stop at their diaphragm dome. */}
        {([-1, 1] as const).map((side) => (
          <g key={side} transform={`translate(${mid} 0) scale(${side < 0 ? rv.viewerLeftLungScale : rv.viewerRightLungScale} 1) translate(${-mid} 0)`}>
            <path data-anatomy={side < 0 ? "right-lung" : "left-lung"} d={lung(side)} fill={SCENE.lung} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
            <path data-anatomy="diaphragm" d={side < 0 ? `M ${p(side, 1, 1)} Q ${p(side, 0.56, 0.67)} ${p(side, 0.03, 0.86)}` : `M ${p(side, 1, 1)} Q ${p(side, 0.72, 0.83)} ${p(side, 0.46, 0.9)}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} />
          </g>
        ))}
        {/* Midline mediastinum and trachea; cardiac bulk is to the patient's LEFT (viewer's right). */}
        <path d={`M ${mid - 14} ${lungY + 12} Q ${mid - 26} ${lungY + lungH * 0.34} ${mid - 12} ${lungY + lungH * 0.5} L ${mid + 16} ${lungY + lungH * 0.53} Q ${mid + 28} ${lungY + lungH * 0.3} ${mid + 14} ${lungY + 12} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        <path data-anatomy="heart" d={`M ${mid - 9} ${lungY + lungH * 0.45} C ${mid + lungW * 0.24} ${lungY + lungH * 0.43} ${mid + lungW * 0.65} ${lungY + lungH * 0.68} ${mid + lungW * 0.56} ${lungY + lungH * 0.84} Q ${mid + lungW * 0.4} ${lungY + lungH * 0.93} ${mid - lungW * 0.28} ${lungY + lungH * 0.85} Q ${mid - lungW * 0.4} ${lungY + lungH * 0.64} ${mid - 9} ${lungY + lungH * 0.45} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
        <path d={`M ${mid - 5} ${lungY - 8} L ${mid - 5} ${lungY + lungH * 0.26} M ${mid + 5} ${lungY - 8} L ${mid + 5} ${lungY + lungH * 0.26}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.thin} />
        {/* clavicles with medial (sternal) ends */}
        <g stroke={SCENE.bone} strokeWidth={STROKE.heavy} strokeLinecap="round" opacity={0.85}>
          <line x1={mid - 12} y1={lungY + lungH * 0.18} x2={mid - lungW - 20} y2={lungY + lungH * 0.12} />
          <line x1={mid + 12} y1={lungY + lungH * 0.18} x2={mid + lungW + 20} y2={lungY + lungH * 0.12} />
        </g>
        <circle cx={mid - 12} cy={lungY + lungH * 0.18} r={7} fill={SCENE.bone} />
        <circle cx={mid + 12} cy={lungY + lungH * 0.18} r={7} fill={SCENE.bone} />
        {/* scapulae: over the lung fields when shoulders are relaxed, laterally clear when rolled forward */}
        <g fill={SCENE.limb} opacity={0.85} stroke={SCENE.edge} strokeWidth={STROKE.thin}>
          <ellipse cx={mid - lungW + 14 - scapula} cy={lungY + 110} rx={26} ry={72} />
          <ellipse cx={mid + lungW - 14 + scapula} cy={lungY + 110} rx={26} ry={72} />
        </g>
        {/* chin tucked: the jaw is drawn over the apices */}
        {chinOverlapsApices(chin) && <ellipse cx={mid} cy={lungY + 14} rx={62} ry={34} fill={SCENE.head} opacity={0.85} stroke={SCENE.bone} strokeWidth={STROKE.thin} strokeDasharray="5 4" />}
      </g>
      {/* spinous-process line: shifts relative to the clavicular ends as the thorax rotates */}
      <line x1={mid + rv.spineShift} y1={20} x2={mid + rv.spineShift} y2={H - 100} stroke={SCENE.bone} strokeWidth={2} strokeDasharray="6 6" opacity={0.6} />
    </>
  );
}
