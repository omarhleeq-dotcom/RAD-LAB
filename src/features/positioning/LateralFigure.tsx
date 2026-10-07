import { useTranslations } from "next-intl";
import type { ChinPositionId } from "@/domain/simulation";
import { HeadProfile, Limb, SceneLabel } from "./SceneParts";
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
 * Hand-drawn schematic of an erect LEFT LATERAL chest in detector space (S12 scene "chest-lateral"; redrawn in S13b-1 / -2).
 * The patient is in profile facing the viewer's LEFT: anterior chest wall (sternum) on the left, thoracic spine with a gentle
 * kyphosis and the posterior ribs on the right, the shoulder girdle at the top, the lung field between them with the apices
 * clear, the heart anterior and low, the two diaphragm domes superimposed, and the trunk running off the detector's lower edge.
 * Never mirrored by RTL. Drawn: what is scored (arms, chin, rotation as posterior-rib separation). Not drawn: anything the
 * result will reveal, and any landmark position that would need an assumption (see REVIEW_PACKAGE, S13b-2). The checklist is
 * in docs/session-13b-scene-design.md.
 */
export function LateralFigure({ W, H, region, rotationDeg, chin, armsRaised, showGuides }: Props) {
  const t = useTranslations("scene");
  const mid = W / 2;
  const { x, y, w, h } = region;
  const right = x + w;
  const sep = rotationDeg * SEPARATION_PER_DEG;
  const shoulder = { x: mid + 10, y: 8 };
  const trunk =
    `M ${mid - 30} 14 C ${mid - 52} 34 ${x - 14} 52 ${x - 14} 120 C ${x - 14} 220 ${x - 10} 330 ${x - 8} ${H} L ${right + 12} ${H} ` +
    `C ${right + 20} 330 ${right + 30} 220 ${right + 28} 130 C ${right + 26} 80 ${right + 6} 44 ${right - 48} 28 C ${right - 70} 22 ${mid + 10} 20 ${mid + 6} 8 Z`;
  const diaphragm = (dx: number, dy: number) => `M ${x + 12 + dx} ${y + h * 0.86 + dy} Q ${mid + dx} ${y + h * 0.74 + dy} ${right - 24 + dx} ${y + h * 0.9 + dy}`;
  return (
    <g>
      {/* far arm (behind the head), when raised */}
      {armsRaised && (
        <Limb
          fill={SCENE.limbFar}
          pts={[
            { x: shoulder.x + 14, y: shoulder.y + 8, w: 24 },
            { x: mid + 62, y: -30, w: 20 },
            { x: mid + 32, y: -70, w: 17 },
            { x: mid + 26, y: -78, w: 20 },
          ]}
        />
      )}
      {/* neck, head in profile with the chin cue (face to the viewer's left), trunk */}
      <rect x={mid - 32} y={-12} width={34} height={44} fill={SCENE.head} />
      <HeadProfile cx={mid - 22} cy={-46} s={0.82} facing={-1} chin={chin} />
      <path d={trunk} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      {/* lung field (both lungs superimposed): apices clear of the shoulder girdle */}
      <rect x={x + 12} y={y} width={w - 36} height={h} rx={60} fill={SCENE.lung} stroke={SCENE.edge} strokeWidth={STROKE.thin} opacity={0.95} />
      {/* heart: anterior (left), low */}
      <ellipse cx={x + w * 0.3} cy={y + h * 0.72} rx={w * 0.17} ry={h * 0.2} transform={`rotate(-18 ${x + w * 0.3} ${y + h * 0.72})`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      {/* the two diaphragm domes, superimposed in a true lateral */}
      <path d={diaphragm(0, 0)} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} opacity={0.8} />
      <path d={diaphragm(8, 9)} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.thin} opacity={0.55} />
      {/* sternum / anterior chest wall (front) and thoracic spine with a gentle kyphosis (back) */}
      <path d={`M ${x + 6} ${y + 6} Q ${x - 2} ${y + h * 0.4} ${x + 6} ${y + h * 0.8}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.heavy} strokeLinecap="round" opacity={0.75} />
      <path d={`M ${right - 34} ${y + 2} C ${right - 14} ${y + h * 0.3} ${right - 14} ${y + h * 0.62} ${right - 32} ${y + h * 0.94}`} fill="none" stroke={SCENE.bone} strokeWidth={22} strokeLinecap="round" opacity={0.3} />
      {/* posterior ribs of the two sides: one arc, and a second one displaced by the rotation */}
      <path d={`M ${right - 8} ${y + h * 0.08} Q ${right + 10} ${y + h * 0.5} ${right - 8} ${y + h * 0.88}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} opacity={0.9} />
      {Math.abs(sep) > 0.5 && (
        <>
          <path d={`M ${right - 8 + sep} ${y + h * 0.08} Q ${right + 10 + sep} ${y + h * 0.5} ${right - 8 + sep} ${y + h * 0.88}`} fill="none" stroke={SCENE.underStroke} strokeWidth={STROKE.medium + 4} opacity={0.85} />
          <path d={`M ${right - 8 + sep} ${y + h * 0.08} Q ${right + 10 + sep} ${y + h * 0.5} ${right - 8 + sep} ${y + h * 0.88}`} fill="none" stroke={SCENE.beam} strokeWidth={STROKE.medium} strokeDasharray="6 5" />
        </>
      )}
      <SceneLabel x={x + w * 0.3} y={y + h * 0.72 + 6} size={LABEL_SIZE.detector - 4} anchor="middle">
        {t("heart")}
      </SceneLabel>
      {/* chin tucked: the jaw is drawn over the apices */}
      {chinOverlapsApices(chin) && <ellipse cx={mid - 36} cy={y + 8} rx={40} ry={17} fill={SCENE.head} opacity={0.8} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeDasharray="5 4" />}
      {/* shoulder girdle and arms */}
      {armsRaised ? (
        <Limb
          pts={[
            { x: shoulder.x, y: shoulder.y, w: 28 },
            { x: mid + 44, y: -34, w: 22 },
            { x: mid + 14, y: -72, w: 18 },
            { x: mid + 8, y: -80, w: 22 },
          ]}
        />
      ) : (
        <>
          <Limb
            opacity={0.88}
            outline={showGuides ? SCENE.guide : SCENE.edge}
            outlineWidth={showGuides ? STROKE.medium + 1 : STROKE.thin * 2}
            pts={[
              { x: shoulder.x, y: shoulder.y, w: 28 },
              { x: mid + 24, y: y + h * 0.46, w: 22 },
              { x: mid + 6, y: y + h * 0.9, w: 17 },
              { x: mid + 2, y: y + h * 1.0, w: 20 },
            ]}
          />
          {showGuides && (
            <SceneLabel x={W - 8} y={H - 44} size={LABEL_SIZE.detector - 4} anchor="end" fill={SCENE.guide}>
              {t("armsOverLungs")}
            </SceneLabel>
          )}
        </>
      )}
    </g>
  );
}
