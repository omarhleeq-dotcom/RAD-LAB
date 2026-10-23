import type { ChinPositionId } from "@/domain/simulation";
import { GuideStroke, hatchEllipse, limbPath } from "./LateralFigure";
import { BODY, SCENE, STROKE } from "./scene-style";
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
  /** Practice guides: the fault overlays (scapulae over the lungs, chin over the apices) get the guide outline. */
  showGuides?: boolean;
}

/** Drawing units per drawing cm (the detector view's `U`). */
const K = 10;

/**
 * Project-authored frontal chest shared by PA and AP. The lung bounds come from the existing fitted anatomy box,
 * with apices above the clavicles, pointed costophrenic angles and a patient-left cardiac notch (viewer right).
 * RAD-072 1b: head, neck, shoulders, arms and trunk from the shared `BODY` proportions, in the chest tonal layers (soft tissue →
 * lungs in the air tone → heart → bones → fault overlays as hatched outlines). The trunk and the arms end at the detector's lower
 * edge (the edge of the image), the head runs off the top of the view. Drawing proportions only: no clinical measurement, score or
 * result-image effect. Never mirrored by RTL.
 */
export function FrontalFigure({ W, H, thoraxScale, rv, lungY, lungH, lungW, scapula, chin, showGuides = false }: Props) {
  const mid = W / 2;
  const p = (side: number, u: number, v: number) => `${mid + side * (8 + u * lungW)} ${lungY + v * lungH}`;
  const lung = (side: number) => `M ${p(side, 0.34, 0)} C ${p(side, 0.67, 0)} ${p(side, 0.92, 0.15)} ${p(side, 0.98, 0.38)} Q ${p(side, 1, 0.68)} ${p(side, 1, 1)} ` +
    (side < 0
      ? `Q ${p(side, 0.56, 0.67)} ${p(side, 0.03, 0.86)} C ${p(side, 0.08, 0.63)} ${p(side, 0.02, 0.32)} ${p(side, 0.12, 0.1)} `
      : `Q ${p(side, 0.72, 0.83)} ${p(side, 0.46, 0.9)} C ${p(side, 0.63, 0.74)} ${p(side, 0.4, 0.56)} ${p(side, 0.03, 0.51)} C ${p(side, 0.02, 0.33)} ${p(side, 0.04, 0.18)} ${p(side, 0.12, 0.1)} `) +
    `Q ${p(side, 0.17, 0)} ${p(side, 0.34, 0)} Z`;
  // BODY proportions in detector units.
  const shoulderY = lungY + lungH * 0.07;
  const acromion = (BODY.shoulderW / 2) * K;
  const chest = (BODY.thorax.w / 2) * K;
  const waist = (BODY.trunk.waistW / 2) * K;
  const neck = (BODY.neck.w / 2) * K;
  const chinY = lungY - BODY.neck.h * K * 0.6;
  const headW = (BODY.head.w / 2) * K;
  const headH = BODY.head.h * K;
  const baseY = lungY + lungH;
  // The trunk outline: up the patient's right side (viewer's left), across the neck, down the other side, along the detector edge.
  const half = (s: number) => [
    [mid + s * (waist + 4), H],
    [mid + s * waist, baseY + 50],
    [mid + s * (chest - 6), baseY, mid + s * chest, lungY + lungH * 0.55, mid + s * (chest + 6), shoulderY + 90],
    [mid + s * acromion, shoulderY + 26],
    [mid + s * (acromion + 2), shoulderY, mid + s * (acromion - 20), shoulderY - 6],
    [mid + s * (neck + 40), shoulderY - 22, mid + s * neck, shoulderY - 30, mid + s * neck, chinY + 6],
  ];
  const seg = (a: number[]) => (a.length === 2 ? `L ${a[0]} ${a[1]}` : a.length === 4 ? `Q ${a[0]} ${a[1]} ${a[2]} ${a[3]}` : `C ${a.join(" ")}`);
  const left = half(-1), right = half(1);
  // Reverse a side: walk its segments backwards, re-ordering the control points so the curve is the same.
  const rev = (h: number[][]) => {
    const pts: string[] = [];
    for (let i = h.length - 1; i > 0; i--) {
      const a = h[i]!, prevEnd = h[i - 1]!.slice(-2);
      if (a.length === 2) pts.push(`L ${prevEnd.join(" ")}`);
      else if (a.length === 4) pts.push(`Q ${a[0]} ${a[1]} ${prevEnd.join(" ")}`);
      else pts.push(`C ${a[2]} ${a[3]} ${a[0]} ${a[1]} ${prevEnd.join(" ")}`);
    }
    return pts.join(" ");
  };
  const trunkPath = `M ${left[0]!.join(" ")} ${left.slice(1).map(seg).join(" ")} L ${mid - neck} ${chinY - 20} L ${mid + neck} ${chinY - 20} L ${mid + neck} ${chinY + 6} ${rev(right)} Z`;
  // Arms hang at the sides from the shoulders (BODY.upperArm / forearm), ending at the detector's lower edge.
  const arm = (s: number) => {
    const sh = { x: mid + s * (acromion - 22), y: shoulderY + 30 };
    const elbow = { x: mid + s * (acromion + 6), y: sh.y + BODY.upperArm.l * K };
    const dy = H - elbow.y, len = BODY.forearm.l * K;
    const end = { x: elbow.x + s * 8 * Math.min(1, dy / len), y: Math.min(H, elbow.y + len) };
    return limbPath([{ ...sh, w: BODY.upperArm.w * K }, { ...elbow, w: BODY.forearm.w * K * 1.05 }, { ...end, w: BODY.forearm.w * K * 0.9 }]);
  };
  const scapulae = [
    { cx: mid - lungW + 14 - scapula, cy: lungY + 110, rx: 26, ry: 72 },
    { cx: mid + lungW - 14 + scapula, cy: lungY + 110, rx: 26, ry: 72 },
  ];
  const overLungs = scapula === 0;
  const chinOverlay = { cx: mid, cy: lungY + 14, rx: 62, ry: 34 };
  const outlined = { stroke: SCENE.outline, strokeWidth: STROKE.thin, strokeLinejoin: "round" as const };
  return (
    <>
      <g transform={`translate(${mid} 0) scale(${thoraxScale} 1) translate(${-mid} 0)`}>
        {/* soft tissue: arms at the sides, head (seen from behind / in front: no face detail) and neck, trunk with shoulders and waist */}
        {[-1, 1].map((s) => <path key={s} data-anatomy="arm" d={arm(s)} fill={SCENE.soft} {...outlined} />)}
        {/* outline pass, then fill pass: the head, neck and trunk in ONE silhouette */}
        {[true, false].map((outlinePass) => (
          <g key={String(outlinePass)} fill={outlinePass ? SCENE.outline : SCENE.soft} stroke={outlinePass ? SCENE.outline : "none"} strokeWidth={STROKE.thin * 2} strokeLinejoin="round">
            <ellipse data-anatomy={outlinePass ? undefined : "head"} cx={mid} cy={chinY + 12 - headH / 2} rx={headW} ry={headH / 2} />
            <path data-anatomy={outlinePass ? undefined : "trunk"} d={trunkPath} />
          </g>
        ))}
        <path d={`M ${mid - headW * 0.72} ${chinY - 40} Q ${mid} ${chinY + 22} ${mid + headW * 0.72} ${chinY - 40}`} fill="none" stroke={SCENE.outline} strokeWidth={STROKE.thin} opacity={0.6} />
        {/* lungs in the air tone; each hemithorax keeps the existing rotation-size effect; both bases stop at their diaphragm dome */}
        {([-1, 1] as const).map((side) => (
          <g key={side} transform={`translate(${mid} 0) scale(${side < 0 ? rv.viewerLeftLungScale : rv.viewerRightLungScale} 1) translate(${-mid} 0)`}>
            <path data-anatomy={side < 0 ? "right-lung" : "left-lung"} d={lung(side)} fill={SCENE.air} stroke={SCENE.outline} strokeWidth={STROKE.medium - 1} />
            <path data-anatomy="diaphragm" d={side < 0 ? `M ${p(side, 1, 1)} Q ${p(side, 0.56, 0.67)} ${p(side, 0.03, 0.86)}` : `M ${p(side, 1, 1)} Q ${p(side, 0.72, 0.83)} ${p(side, 0.46, 0.9)}`} fill="none" stroke={SCENE.boneLine} strokeWidth={STROKE.medium} />
          </g>
        ))}
        {/* heart (filled): cardiac bulk to the patient's LEFT (viewer's right); trachea as a central air column */}
        <path data-anatomy="heart" d={`M ${mid - 9} ${lungY + lungH * 0.45} C ${mid + lungW * 0.24} ${lungY + lungH * 0.43} ${mid + lungW * 0.65} ${lungY + lungH * 0.68} ${mid + lungW * 0.56} ${lungY + lungH * 0.84} Q ${mid + lungW * 0.4} ${lungY + lungH * 0.93} ${mid - lungW * 0.28} ${lungY + lungH * 0.85} Q ${mid - lungW * 0.4} ${lungY + lungH * 0.64} ${mid - 9} ${lungY + lungH * 0.45} Z`} fill={SCENE.heart} stroke={SCENE.outline} strokeWidth={STROKE.thin + 0.5} />
        <path data-anatomy="trachea" d={`M ${mid - 7} ${chinY + 20} L ${mid - 7} ${lungY + lungH * 0.26} L ${mid + 7} ${lungY + lungH * 0.26} L ${mid + 7} ${chinY + 20} Z`} fill={SCENE.air} stroke={SCENE.outline} strokeWidth={STROKE.thin} />
        {/* bones: clavicles from the sternal ends to the acromion */}
        <g stroke={SCENE.boneLine} strokeWidth={STROKE.heavy} strokeLinecap="round">
          <path d={`M ${mid - 14} ${lungY + lungH * 0.18} Q ${mid - acromion * 0.5} ${lungY + lungH * 0.2} ${mid - acromion + 26} ${shoulderY + 8}`} fill="none" />
          <path d={`M ${mid + 14} ${lungY + lungH * 0.18} Q ${mid + acromion * 0.5} ${lungY + lungH * 0.2} ${mid + acromion - 26} ${shoulderY + 8}`} fill="none" />
        </g>
        <circle cx={mid - 14} cy={lungY + lungH * 0.18} r={7} fill={SCENE.boneFill} />
        <circle cx={mid + 14} cy={lungY + lungH * 0.18} r={7} fill={SCENE.boneFill} />
        {/* scapulae: translucent bone outlines; over the lung fields when the shoulders are relaxed (fault: hatched), laterally clear when rolled forward */}
        {scapulae.map((e, i) => (
          <g key={i} data-anatomy="scapula">
            <ellipse {...e} fill={SCENE.boneFill} opacity={0.22} />
            {overLungs && <path d={hatchEllipse(e.cx, e.cy, e.rx, e.ry, 11)} fill="none" stroke={SCENE.boneLine} strokeWidth={1} opacity={0.55} />}
            <GuideStroke stroke={showGuides && overLungs ? SCENE.guide : SCENE.boneLine} width={STROKE.guide} dash={overLungs ? "5 4" : undefined}>
              {(q) => <ellipse {...e} {...q} fill="none" />}
            </GuideStroke>
          </g>
        ))}
        {/* chin tucked: the jaw over the apices, a translucent hatched outline (never a solid fill) */}
        {chinOverlapsApices(chin) && (
          <g data-anatomy="chin-over-apices">
            <ellipse {...chinOverlay} fill={SCENE.soft} opacity={0.35} />
            <path d={hatchEllipse(chinOverlay.cx, chinOverlay.cy, chinOverlay.rx, chinOverlay.ry, 9)} fill="none" stroke={SCENE.outline} strokeWidth={1.2} opacity={0.8} />
            <GuideStroke stroke={showGuides ? SCENE.guide : SCENE.outline} width={STROKE.guide} dash="5 4">
              {(q) => <ellipse {...chinOverlay} {...q} fill="none" />}
            </GuideStroke>
          </g>
        )}
      </g>
      {/* spinous-process line: shifts relative to the clavicular ends as the thorax rotates */}
      <line x1={mid + rv.spineShift} y1={20} x2={mid + rv.spineShift} y2={H - 100} stroke={SCENE.boneLine} strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />
    </>
  );
}
