import { useTranslations } from "next-intl";
import type { ChinPositionId } from "@/domain/simulation";
import { HeadProfile, SceneLabel } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { chinOverlapsApices } from "./visual-model";

interface Props {
  /** Detector size in drawing units. */
  W: number;
  H: number;
  /** Required-anatomy region in drawing units (the lungs are drawn inside it). */
  region: { x: number; y: number; w: number; h: number };
  rotationDeg: number;
  chin: ChinPositionId;
  armsRaised: boolean;
  showGuides: boolean;
}

/** Posterior-rib offset (drawing units) per degree of the internal rotation value; drawing only, never a measurement. */
const SEPARATION_PER_DEG = 3.2;

/**
 * Hand-drawn schematic of an erect LATERAL chest in detector space (S12 scene "chest-lateral", redrawn in S13b-1). The
 * patient is drawn in profile facing the viewer's LEFT (anterior left, spine right; never mirrored by RTL), from the head
 * above the detector to the trunk running off its lower edge. Everything scored is drawn: arms (raised above the head, or
 * lowered over the lung fields), the chin (the head tilts; the jaw overlaps the apices when tucked) and the posterior ribs
 * (rotation). Nothing the result will reveal is shown.
 */
export function LateralFigure({ W, H, region, rotationDeg, chin, armsRaised, showGuides }: Props) {
  const t = useTranslations("scene");
  const mid = W / 2;
  const { x, y, w, h } = region;
  const right = x + w;
  const sep = rotationDeg * SEPARATION_PER_DEG;
  const shoulder = { x: mid + 10, y: 58 };
  const trunk =
    `M ${mid - 34} 20 C ${mid - 70} 34 ${x - 30} 56 ${x - 30} 130 L ${x - 24} ${H} L ${right + 24} ${H} ` +
    `C ${right + 34} 300 ${right + 32} 120 ${right + 4} 54 C ${right - 20} 30 ${mid + 20} 24 ${mid + 8} 16 Z`;
  return (
    <g>
      {/* far arm (behind the head), when raised */}
      {armsRaised && (
        <path d={`M ${shoulder.x + 14} ${shoulder.y} L ${mid + 46} -30 L ${mid - 4} -70`} fill="none" stroke={SCENE.limbFar} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {/* neck, head in profile (face to the viewer's left) with the chin cue, trunk */}
      <rect x={mid - 26} y={0} width={30} height={34} fill={SCENE.head} />
      <HeadProfile cx={mid - 18} cy={-30} s={1.35} facing={-1} chin={chin} />
      <path d={trunk} fill={SCENE.trunk} />
      {/* lung field (both lungs superimposed), heart (anterior, low), diaphragm */}
      <rect x={x + 12} y={y} width={w - 36} height={h} rx={60} fill={SCENE.lung} />
      <ellipse cx={x + w * 0.3} cy={y + h * 0.72} rx={w * 0.17} ry={h * 0.2} transform={`rotate(-18 ${x + w * 0.3} ${y + h * 0.72})`} fill={SCENE.trunk} opacity={0.85} />
      <path d={`M ${x + 12} ${y + h * 0.86} Q ${mid} ${y + h * 0.74} ${right - 24} ${y + h * 0.9}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.heavy - 1} opacity={0.7} />
      {/* sternum (front) and spine (back) */}
      <line x1={x + 4} y1={y + 8} x2={x + 4} y2={y + h * 0.8} stroke={SCENE.bone} strokeWidth={STROKE.heavy} opacity={0.7} strokeLinecap="round" />
      <rect x={right - 38} y={y + 4} width={22} height={h * 0.9} rx={8} fill={SCENE.bone} opacity={0.4} />
      {/* posterior ribs of the two sides: one arc, and a second one displaced by the rotation */}
      <path d={`M ${right - 12} ${y + h * 0.08} Q ${right + 6} ${y + h * 0.5} ${right - 12} ${y + h * 0.88}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.heavy - 1} opacity={0.85} />
      {Math.abs(sep) > 0.5 && (
        <path d={`M ${right - 12 + sep} ${y + h * 0.08} Q ${right + 6 + sep} ${y + h * 0.5} ${right - 12 + sep} ${y + h * 0.88}`} fill="none" stroke={SCENE.beam} strokeWidth={STROKE.heavy - 1} opacity={0.85} strokeDasharray="6 5" />
      )}
      <SceneLabel x={x + w * 0.3} y={y + h * 0.72 + 6} size={LABEL_SIZE.detector - 4} anchor="middle">
        {t("heart")}
      </SceneLabel>
      {/* chin tucked: the jaw is drawn over the apices */}
      {chinOverlapsApices(chin) && <ellipse cx={mid - 30} cy={y + 14} rx={56} ry={30} fill={SCENE.head} opacity={0.85} stroke={SCENE.bone} strokeWidth={STROKE.thin} strokeDasharray="5 4" />}
      {/* arms */}
      {armsRaised ? (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx={shoulder.x} cy={shoulder.y} r={26} fill={SCENE.limb} stroke="none" />
          <path d={`M ${shoulder.x} ${shoulder.y} L ${mid + 34} -30 L ${mid - 12} -70`} stroke={SCENE.limb} strokeWidth={22} />
          <circle cx={mid - 14} cy={-70} r={13} fill={SCENE.limb} stroke="none" />
        </g>
      ) : (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx={shoulder.x} cy={shoulder.y} r={26} fill={SCENE.limb} stroke="none" />
          <path d={`M ${shoulder.x} ${shoulder.y} L ${mid + 22} ${y + h * 0.5} L ${mid - 56} ${y + h * 0.58}`} stroke={SCENE.limb} strokeWidth={26} opacity={0.75} />
          <circle cx={mid - 58} cy={y + h * 0.58} r={14} fill={SCENE.limb} stroke="none" opacity={0.75} />
          {showGuides && (
            <>
              <path d={`M ${shoulder.x} ${shoulder.y} L ${mid + 22} ${y + h * 0.5} L ${mid - 56} ${y + h * 0.58}`} stroke={SCENE.beam} strokeWidth={STROKE.medium} strokeDasharray="8 6" />
              <SceneLabel x={mid + 40} y={y + h * 0.5 - 20} size={LABEL_SIZE.detector - 4} fill={SCENE.beam}>
                {t("armsOverLungs")}
              </SceneLabel>
            </>
          )}
        </g>
      )}
    </g>
  );
}
