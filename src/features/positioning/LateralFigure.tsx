import type { ChinPositionId } from "@/domain/simulation";
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
}

/** Posterior-rib offset (drawing units) per degree of the internal rotation value; drawing only, never a measurement. */
const SEPARATION_PER_DEG = 3.2;

/**
 * Hand-drawn schematic of an erect LATERAL chest in detector space (S12 scene "chest-lateral"). Display convention of
 * this simulator: the anterior chest is on the viewer's left, the spine on the right; never mirrored by RTL. It shows the
 * learner-controlled cues (rotation as doubled posterior ribs, arms, chin) and nothing the result will reveal.
 */
export function LateralFigure({ W, H, region, rotationDeg, chin, armsRaised }: Props) {
  const mid = W / 2;
  const { x, y, w, h } = region;
  const right = x + w;
  const sep = rotationDeg * SEPARATION_PER_DEG;
  return (
    <g>
      {/* head (facing the viewer's left) and neck */}
      <circle cx={mid - 10} cy={-35} r={34} fill="#7b93a5" />
      <path d={`M ${mid - 44} -30 L ${mid - 64} -22 L ${mid - 44} -12 Z`} fill="#d8e4ec" opacity={0.9} />
      <rect x={mid - 22} y={-6} width={28} height={30} fill="#7b93a5" />
      {/* arms: raised above the head, or lowered over the upper lung fields */}
      {armsRaised ? (
        <g stroke="#9db6c6" strokeWidth={22} strokeLinecap="round" opacity={0.8}>
          <line x1={mid - 6} y1={40} x2={mid - 14} y2={-84} />
        </g>
      ) : (
        <rect x={mid - 64} y={y + 10} width={96} height={h * 0.34} rx={30} fill="#9db6c6" opacity={0.55} stroke="#d8e4ec" strokeWidth={1.5} />
      )}
      {/* torso and the two lungs superimposed */}
      <rect x={x - 22} y={22} width={w + 44} height={h + 70} rx={56} fill="#5d778a" />
      <rect x={x + 12} y={y} width={w - 36} height={h} rx={60} fill="#33516a" />
      {/* heart shadow (anterior, low) and diaphragm */}
      <ellipse cx={x + w * 0.3} cy={y + h * 0.72} rx={w * 0.2} ry={h * 0.17} fill="#5d778a" opacity={0.75} />
      <path d={`M ${x + 12} ${y + h * 0.86} Q ${mid} ${y + h * 0.74} ${right - 24} ${y + h * 0.9}`} fill="none" stroke="#b9cad6" strokeWidth={4} opacity={0.7} />
      {/* sternum (front) and spine (back) */}
      <line x1={x + 4} y1={y + 8} x2={x + 4} y2={y + h * 0.8} stroke="#d8e4ec" strokeWidth={5} opacity={0.7} strokeLinecap="round" />
      <rect x={right - 38} y={y + 4} width={22} height={h * 0.9} rx={8} fill="#b9cad6" opacity={0.45} />
      {/* posterior ribs of the two sides: one arc, and a second one displaced by the rotation */}
      <path d={`M ${right - 12} ${y + h * 0.08} Q ${right + 6} ${y + h * 0.5} ${right - 12} ${y + h * 0.88}`} fill="none" stroke="#d8e4ec" strokeWidth={4} opacity={0.85} />
      {Math.abs(sep) > 0.5 && (
        <path d={`M ${right - 12 + sep} ${y + h * 0.08} Q ${right + 6 + sep} ${y + h * 0.5} ${right - 12 + sep} ${y + h * 0.88}`} fill="none" stroke="#f2b134" strokeWidth={4} opacity={0.85} strokeDasharray="6 5" />
      )}
      {/* chin tucked: jaw over the apices */}
      {chinOverlapsApices(chin) && <ellipse cx={mid - 30} cy={y + 14} rx={56} ry={30} fill="#7b93a5" opacity={0.85} stroke="#d8e4ec" strokeWidth={1.5} strokeDasharray="5 4" />}
      <line x1={0} y1={H} x2={W} y2={H} stroke="none" />
    </g>
  );
}
