import type { ChinPositionId } from "@/domain/simulation";
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
 * Hand-drawn schematic of the FRONTAL chest in detector space (Chest PA S4, Chest AP S13; redrawn in S13b-1: the shapes and
 * their geometry are those of the earlier drawing, plus the shoulder caps and the arms hanging at the sides). Anatomy is drawn
 * in detector space and never mirrored by RTL.
 */
export function FrontalFigure({ W, H, thoraxScale, rv, lungY, lungH, lungW, scapula, chin }: Props) {
  const mid = W / 2;
  return (
    <>
      <g transform={`translate(${mid} 0) scale(${thoraxScale} 1) translate(${-mid} 0)`}>
        {/* arms hanging at the sides, from the shoulder caps (they run off the detector: only the shoulder / upper arm is in the margin) */}
        <g stroke={SCENE.limbFar} strokeWidth={30} strokeLinecap="round" fill="none">
          <path d={`M 22 46 L -10 190 L -14 330`} />
          <path d={`M ${W - 22} 46 L ${W + 10} 190 L ${W + 14} 330`} />
        </g>
        {/* head (oval with a jaw line) and neck */}
        <rect x={mid - 14} y={-6} width={28} height={34} fill={SCENE.head} />
        <ellipse cx={mid} cy={-35} rx={30} ry={36} fill={SCENE.head} />
        <path d={`M ${mid - 22} -20 Q ${mid} 12 ${mid + 22} -20`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.thin} opacity={0.7} />
        {/* trunk: sloping shoulders, then the chest */}
        <path d={`M 20 28 Q ${mid} -8 ${W - 20} 28 L ${W - 32} ${H} L 32 ${H} Z`} fill={SCENE.trunk} />
        <circle cx={22} cy={46} r={26} fill={SCENE.limb} />
        <circle cx={W - 22} cy={46} r={26} fill={SCENE.limb} />
        <rect x={mid - 8 - lungW * rv.viewerLeftLungScale} y={lungY} width={lungW * rv.viewerLeftLungScale} height={lungH} rx={50} fill={SCENE.lung} />
        <rect x={mid + 8} y={lungY} width={lungW * rv.viewerRightLungScale} height={lungH} rx={50} fill={SCENE.lung} />
        {/* clavicles with medial (sternal) ends */}
        <g stroke={SCENE.bone} strokeWidth={STROKE.heavy} strokeLinecap="round" opacity={0.85}>
          <line x1={mid - 12} y1={lungY + 6} x2={mid - lungW - 20} y2={lungY - 4} />
          <line x1={mid + 12} y1={lungY + 6} x2={mid + lungW + 20} y2={lungY - 4} />
        </g>
        <circle cx={mid - 12} cy={lungY + 6} r={7} fill={SCENE.bone} />
        <circle cx={mid + 12} cy={lungY + 6} r={7} fill={SCENE.bone} />
        {/* scapulae: over the lung fields when shoulders are relaxed, laterally clear when rolled forward */}
        <g fill={SCENE.limb} opacity={0.6} stroke={SCENE.bone} strokeWidth={STROKE.thin}>
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
