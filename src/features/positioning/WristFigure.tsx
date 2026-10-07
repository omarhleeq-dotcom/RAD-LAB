import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SceneLabel } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { bumpedU, wristLateralVisual, wristPaVisual } from "./wrist-visual";
import type { FigureProps } from "./detector-figures";

/**
 * Hand-drawn schematic of the WRIST in detector space (S14.1c; scenes "wrist-pa" and "wrist-lateral", own work, S13b visual
 * language: dark muted anatomy, thin bone outlines, no accent hue). It draws what is scored and visible: the rotation of the wrist
 * (PA: the proximal metacarpal shafts unequally spaced and the distal ulna moving over the radius; lateral: the structures that
 * must be superimposed drawn apart) with the SAME sign as the result image (positive = toward the viewer's right), and nothing
 * the result reveals. The drawing follows the learner's projection setting. Left wrist, fingers toward the top of the detector,
 * thumb on the viewer's right in the PA. Anatomy is an image convention and is never mirrored by RTL. Positions are fractions of the
 * exam's required-anatomy region, so the figure sits where the baseline image will be drawn. Shapes are schematic, never measured.
 */
export function WristDrawing({ radCase, settings, showGuides, W, H }: FigureProps) {
  const a = radCase.requiredAnatomy;
  const U = W / radCase.detector.widthCm;
  const X = (u: number) => (a.xCm + u * a.widthCm) * U;
  const Y = (v: number) => (a.yCm + v * a.heightCm) * U;
  return settings.projection === "wrist-lateral" ? (
    <LateralDrawing X={X} Y={Y} H={H} a={a.widthCm} U={U} rotationDeg={settings.rotationDeg} />
  ) : (
    <PaDrawing X={X} Y={Y} H={H} a={a.widthCm} U={U} rotationDeg={settings.rotationDeg} showGuides={showGuides} />
  );
}

interface DrawProps {
  X: (u: number) => number;
  Y: (v: number) => number;
  H: number;
  /** Region width, cm. */
  a: number;
  U: number;
  rotationDeg: number;
}

const bone = { fill: SCENE.trunk, stroke: SCENE.bone, strokeWidth: STROKE.thin, strokeOpacity: 0.85, strokeLinejoin: "round" } as const;
const soft = { fill: SCENE.limbFar, stroke: SCENE.edge, strokeWidth: STROKE.thin, strokeLinejoin: "round" } as const;

function PaDrawing({ X, Y, H, a, U, rotationDeg, showGuides }: DrawProps & { showGuides: boolean }) {
  const ts = useTranslations("sceneWrist");
  const vis = wristPaVisual(rotationDeg);
  const metaU = [0.23, 0.41, 0.57, 0.74, 0.93];
  const metaW = [0.1, 0.09, 0.09, 0.1, 0.11];
  const ulnaDx = vis.ulnaShiftCm * U;
  const row = (vTop: number, vBot: number, us: number[], w: number): ReactNode[] =>
    us.map((u) => <rect key={`${vTop}-${u}`} x={X(u - w / 2)} y={Y(vTop)} width={X(u + w / 2) - X(u - w / 2)} height={Y(vBot) - Y(vTop)} rx={9} {...bone} />);
  return (
    <>
      {/* soft tissue: forearm, wrist, palm and thumb (thumb on the viewer's right); the hand runs off the top edge, the forearm off the bottom edge */}
      <path d={`M ${X(0.16)} ${H} L ${X(0.15)} ${Y(0.62)} C ${X(0.14)} ${Y(0.5)} ${X(0.1)} ${Y(0.34)} ${X(0.09)} ${Y(0.1)} L ${X(0.09)} 0 L ${X(1.02)} 0 L ${X(1.04)} ${Y(0.06)} C ${X(1.12)} ${Y(0.12)} ${X(1.12)} ${Y(0.26)} ${X(0.98)} ${Y(0.38)} L ${X(0.95)} ${Y(0.6)} L ${X(0.93)} ${H} Z`} {...soft} />
      {/* finger gaps beyond the field of interest (thin, low contrast) */}
      <g stroke={SCENE.edge} strokeWidth={STROKE.thin} opacity={0.35}>
        {[0.32, 0.49, 0.66].map((u) => (
          <line key={u} x1={X(u)} y1={0} x2={X(bumpedU(u, vis.bumpCm, a))} y2={Y(-0.15)} />
        ))}
      </g>
      {/* metacarpals: unequal spacing grows with the value (same bump as the result image) */}
      {metaU.map((u, i) => {
        const cx = X(bumpedU(u, vis.bumpCm, a));
        const w = (X(u + metaW[i]! / 2) - X(u - metaW[i]! / 2)) as number;
        return <rect key={u} x={cx - w / 2} y={Y(i === 4 ? 0.02 : -0.2)} width={w} height={Y(0.23) - Y(i === 4 ? 0.02 : -0.2)} rx={7} {...bone} />;
      })}
      {/* carpals: two rows */}
      {row(0.25, 0.38, [0.27, 0.43, 0.58, 0.74], 0.14)}
      {row(0.4, 0.53, [0.26, 0.4, 0.55, 0.71], 0.13)}
      {/* radius (right in the PA) and ulna (left): the ulna moves toward the radius with the rotation value */}
      <path d={`M ${X(0.5)} ${Y(0.55)} L ${X(0.86)} ${Y(0.5)} L ${X(0.84)} ${Y(0.64)} L ${X(0.8)} ${H} L ${X(0.53)} ${H} L ${X(0.51)} ${Y(0.64)} Z`} {...bone} />
      <g transform={`translate(${ulnaDx} 0)`}>
        <path d={`M ${X(0.17)} ${Y(0.54)} C ${X(0.17)} ${Y(0.5)} ${X(0.2)} ${Y(0.49)} ${X(0.23)} ${Y(0.52)} L ${X(0.44)} ${Y(0.55)} L ${X(0.4)} ${Y(0.7)} L ${X(0.39)} ${H} L ${X(0.2)} ${H} L ${X(0.2)} ${Y(0.7)} Z`} {...bone} fillOpacity={0.88} />
      </g>
      {showGuides && (
        <g aria-hidden style={{ pointerEvents: "none" }}>
          <SceneLabel x={X(0.2)} y={H - 110} size={LABEL_SIZE.detector - 5} fill={SCENE.guide}>{ts("ulna")}</SceneLabel>
          <SceneLabel x={X(0.95)} y={H - 76} size={LABEL_SIZE.detector - 5} anchor="end" fill={SCENE.guide}>{ts("radius")}</SceneLabel>
        </g>
      )}
    </>
  );
}

function LateralDrawing({ X, Y, H, a, U, rotationDeg }: DrawProps) {
  const vis = wristLateralVisual(rotationDeg);
  const off = (vis.offsetCm * U) as number;
  void a;
  const bundle = (dx: number, key: string) => <rect key={key} x={X(0.43) + dx} y={Y(-0.2)} width={X(0.75) - X(0.43)} height={Y(0.27) - Y(-0.2)} rx={8} {...bone} fillOpacity={0.9} />;
  const shaft = (dx: number, key: string) => (
    <path key={key} transform={`translate(${dx} 0)`} d={`M ${X(0.38)} ${Y(0.62)} L ${X(0.82)} ${Y(0.6)} L ${X(0.75)} ${Y(0.8)} L ${X(0.7)} ${H} L ${X(0.46)} ${H} L ${X(0.42)} ${Y(0.8)} Z`} {...bone} fillOpacity={0.9} />
  );
  return (
    <>
      <path d={`M ${X(0.25)} ${H} L ${X(0.22)} ${Y(0.82)} C ${X(0.17)} ${Y(0.62)} ${X(0.15)} ${Y(0.42)} ${X(0.13)} ${Y(0.2)} L ${X(0.13)} 0 L ${X(1.02)} 0 L ${X(1.0)} ${Y(0.3)} C ${X(0.98)} ${Y(0.55)} ${X(0.88)} ${Y(0.7)} ${X(0.87)} ${Y(0.85)} L ${X(0.87)} ${H} Z`} {...soft} />
      {/* thumb metacarpal (apart from the others) */}
      <rect x={X(0.2)} y={Y(-0.2)} width={X(0.36) - X(0.2)} height={Y(0.26) - Y(-0.2)} rx={8} {...bone} />
      {/* proximal 2nd-5th metacarpals: one bundle in a true lateral; a second copy appears apart with the value */}
      {bundle(0, "m0")}
      {off !== 0 && bundle(off, "m1")}
      {/* carpals */}
      {[[0.32, 0.5], [0.5, 0.36], [0.66, 0.5], [0.46, 0.56]].map(([u, v]) => (
        <ellipse key={`${u}-${v}`} cx={X(u!)} cy={Y(v!)} rx={(X(0.13) - X(0)) as number} ry={(Y(0.1) - Y(0)) as number} {...bone} />
      ))}
      {/* distal radius and ulna: superimposed in a true lateral (the ulnar head over the radius); the head moves apart with the value */}
      {shaft(0, "r")}
      <circle cx={X(0.6) + off} cy={Y(0.64)} r={((X(0.1) - X(0)) as number)} {...bone} />
    </>
  );
}
