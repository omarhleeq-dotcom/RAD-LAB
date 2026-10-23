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
  const shoulder = { x: x + w * 0.19, y: y + h * 0.06 };
  const trunk =
    `M ${mid - 30} 14 C ${mid - 52} 34 ${x - 14} 52 ${x - 14} 120 C ${x - 14} 220 ${x - 10} 330 ${x - 8} ${H} L ${right + 12} ${H} ` +
    `C ${right + 20} 330 ${right + 30} 220 ${right + 28} 130 C ${right + 26} 80 ${right + 6} 44 ${right - 48} 28 C ${right - 70} 22 ${mid + 10} 20 ${mid + 6} 8 Z`;
  // Normalised to the EXISTING fitted landmark box. These are drawing proportions, never scored landmarks.
  const pt = (u: number, v: number) => `${x + u * w} ${y + v * h}`;
  const base = `M ${pt(0.04, 0.79)} C ${pt(0.25, 0.74)} ${pt(0.47, 0.83)} ${pt(0.64, 0.89)} Q ${pt(0.8, 0.96)} ${pt(0.92, 1)}`;
  const lung = `M ${pt(0.43, 0)} C ${pt(0.26, 0)} ${pt(0.16, 0.08)} ${pt(0.13, 0.22)} C ${pt(0.03, 0.42)} ${pt(0, 0.62)} ${pt(0.04, 0.79)} C ${pt(0.25, 0.74)} ${pt(0.47, 0.83)} ${pt(0.64, 0.89)} Q ${pt(0.8, 0.96)} ${pt(0.92, 1)} C ${pt(1, 0.75)} ${pt(0.98, 0.42)} ${pt(0.84, 0.18)} C ${pt(0.72, 0.04)} ${pt(0.56, 0)} ${pt(0.43, 0)} Z`;
  return (
    <g>
      {/* far arm (behind the head), when raised */}
      {armsRaised && (
        <Limb
          fill={SCENE.limbFar}
          pts={[
            { x: shoulder.x + 10, y: shoulder.y, w: 24 },
            { x: x + 18, y: -68, w: 20 },
            { x: mid + 30, y: -74, w: 17 },
            { x: mid + 36, y: -72, w: 20 },
          ]}
        />
      )}
      {/* neck, head in profile with the chin cue (face to the viewer's left), trunk */}
      <path d={`M ${mid - 42} -14 Q ${mid - 45} 8 ${mid - 55} 24 L ${mid + 6} 28 Q ${mid - 12} 2 ${mid - 10} -12 Z`} fill={SCENE.head} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      <HeadProfile cx={mid - 28} cy={-38} s={0.64} facing={-1} chin={chin} />
      <path d={trunk} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      {/* lung field (both lungs superimposed): apices clear of the shoulder girdle */}
      <path data-anatomy="lateral-lung" d={lung} fill={SCENE.lung} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      {/* Anterior/inferior cardiac silhouette rests on the same basal curve as the lung. */}
      <path data-anatomy="heart" d={`M ${pt(0.13, 0.46)} C ${pt(0.29, 0.39)} ${pt(0.43, 0.53)} ${pt(0.5, 0.72)} Q ${pt(0.53, 0.8)} ${pt(0.49, 0.84)} C ${pt(0.3, 0.77)} ${pt(0.17, 0.76)} ${pt(0.04, 0.79)} Q ${pt(0.03, 0.59)} ${pt(0.13, 0.46)} Z`} fill={SCENE.trunk} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
      {/* The diaphragm bounds the lung: the posterior recess is deepest; the second dome is inferior to the fill. */}
      <path data-anatomy="diaphragm" d={base} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} />
      <path d={`M ${pt(0.06, 0.82)} C ${pt(0.27, 0.77)} ${pt(0.5, 0.86)} ${pt(0.66, 0.92)} Q ${pt(0.8, 0.98)} ${pt(0.9, 1)}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.thin} opacity={0.55} />
      {/* sternum / anterior chest wall (front) and thoracic spine with a gentle kyphosis (back) */}
      <path d={`M ${x + 6} ${y + 6} Q ${x - 2} ${y + h * 0.4} ${x + 6} ${y + h * 0.8}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.heavy} strokeLinecap="round" opacity={0.75} />
      {/* Discrete vertebral bodies trace a mild posterior kyphosis instead of one featureless rod. */}
      {Array.from({ length: 10 }, (_, i) => {
        const v = 0.05 + i * 0.087;
        const vx = right - w * 0.075 + Math.sin((i / 9) * Math.PI) * w * 0.035;
        return <rect key={i} x={vx - 9} y={y + h * v} width={18} height={h * 0.065} rx={3} fill={SCENE.limbFar} stroke={SCENE.bone} strokeWidth={STROKE.thin} transform={`rotate(${(i - 4.5) * 1.5} ${vx} ${y + h * v})`} />;
      })}
      {/* posterior ribs of the two sides: one arc, and a second one displaced by the rotation */}
      <path d={`M ${right - 8} ${y + h * 0.08} Q ${right + 10} ${y + h * 0.5} ${right - 8} ${y + h * 0.88}`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} opacity={0.9} />
      {Math.abs(sep) > 0.5 && (
        <>
          <path d={`M ${right - 8 + sep} ${y + h * 0.08} Q ${right + 10 + sep} ${y + h * 0.5} ${right - 8 + sep} ${y + h * 0.88}`} fill="none" stroke={SCENE.underStroke} strokeWidth={STROKE.medium + 4} opacity={0.85} />
          <path d={`M ${right - 8 + sep} ${y + h * 0.08} Q ${right + 10 + sep} ${y + h * 0.5} ${right - 8 + sep} ${y + h * 0.88}`} fill="none" stroke={SCENE.beam} strokeWidth={STROKE.medium} strokeDasharray="6 5" />
        </>
      )}
      <SceneLabel x={x + w * 0.25} y={y + h * 0.67} size={LABEL_SIZE.detector - 4} anchor="middle">
        {t("heart")}
      </SceneLabel>
      {/* chin tucked: the jaw is drawn over the apices */}
      {chinOverlapsApices(chin) && <ellipse cx={mid - 36} cy={y + 8} rx={40} ry={17} fill={SCENE.head} opacity={0.8} stroke={SCENE.edge} strokeWidth={STROKE.thin} strokeDasharray="5 4" />}
      {/* shoulder girdle and arms */}
      {armsRaised ? (
        <Limb
          pts={[
            { x: shoulder.x, y: shoulder.y, w: 28 },
            { x: x + 8, y: -68, w: 22 },
            { x: mid + 18, y: -76, w: 18 },
            { x: mid + 26, y: -74, w: 22 },
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
              { x: x + w * 0.3, y: y + h * 0.34, w: 38 },
              { x: x + w * 0.05, y: y + h * 0.43, w: 24 },
              { x: x - 8, y: y + h * 0.39, w: 26 },
            ]}
          />
          {showGuides && (
            <SceneLabel x={right - 24} y={y + h * 0.24} size={LABEL_SIZE.detector - 4} anchor="end" fill={SCENE.guide}>
              {t("armsOverLungs")}
            </SceneLabel>
          )}
        </>
      )}
    </g>
  );
}
