import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ChinPositionId } from "@/domain/simulation";
import { SceneLabel } from "./SceneParts";
import { BODY, LABEL_SIZE, SCENE, STROKE } from "./scene-style";
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
/** Drawing units per drawing cm (the detector view's `U`). */
const K = 10;

type P = { x: number; y: number };

/**
 * Head in profile facing −x, in drawing cm (RAD-072 1b, `BODY.head`): chin to vertex 23, nose to occiput ≈ 20. Origin = top of the
 * neck (between the under-jaw and the nape); +y runs down the neck. Drawing proportions only. Shared by the lateral detector view
 * and the AP side view.
 */
export const HEAD_SIDE_CM =
  "M -4 3 L -8 2.6 C -9.6 2.2 -9.8 0.8 -9.6 -0.4 L -10 -2.6 L -10.6 -3.4 L -10.2 -4.6 L -10.8 -5.6 L -10.8 -6.8 L -12.6 -9 L -10.6 -10.4 " +
  "C -10.4 -12 -10 -13 -10.2 -14.6 C -10.4 -18.6 -6.4 -21 -1 -21 C 5 -21 8.6 -17.4 8.6 -12 C 8.6 -7 7.6 -3.6 6 -1.6 L 6 3 Z";

/** A tapered limb through its joints (drawing units), as ONE closed outline (no joint circles poking out); the last end is flat. */
export function limbPath(pts: (P & { w: number })[]): string {
  const side = (s: 1 | -1) =>
    pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)]!, b = pts[Math.min(pts.length - 1, i + 1)]!;
      const t = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
      return { x: p.x + (s * Math.cos(t) * p.w) / 2, y: p.y + (s * Math.sin(t) * p.w) / 2 };
    });
  const l = side(1), r = side(-1).reverse();
  const f = (q: P) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  const s0 = pts[0]!;
  // Rounded start (shoulder / hip), straight segments, flat far end.
  return `M ${f(r[r.length - 1]!)} A ${s0.w / 2} ${s0.w / 2} 0 0 1 ${f(l[0]!)} ` + l.slice(1).map((q) => `L ${f(q)}`).join(" ") + " " + r.map((q) => `L ${f(q)}`).join(" ") + " Z";
}

/** 45° hatch lines inside an axis-aligned ellipse (fault overlays: outline + hatch, never a solid dark fill). */
export function hatchEllipse(cx: number, cy: number, rx: number, ry: number, gap: number): string {
  const out: string[] = [];
  // Lines y − cy = (x − cx) + d. Substituting gives (u/rx)² + ((u+d)/ry)² = 1 in u = x − cx.
  const A = 1 / (rx * rx) + 1 / (ry * ry);
  const reach = Math.hypot(rx, ry);
  for (let d = -reach + gap / 2; d < reach; d += gap) {
    const B = (2 * d) / (ry * ry), C = (d * d) / (ry * ry) - 1;
    const disc = B * B - 4 * A * C;
    if (disc <= 0) continue;
    const u1 = (-B - Math.sqrt(disc)) / (2 * A), u2 = (-B + Math.sqrt(disc)) / (2 * A);
    out.push(`M ${(cx + u1).toFixed(1)} ${(cy + u1 + d).toFixed(1)} L ${(cx + u2).toFixed(1)} ${(cy + u2 + d).toFixed(1)}`);
  }
  return out.join(" ");
}

/**
 * A chest guide / fault outline (RAD-072 1b): the accent on a LIGHT dark under-stroke (+3, 60 %), so the outline reads on any chest
 * fill without out-weighing the anatomy (the shared `UnderStroked` adds 6 at 85 % for the interactive accents).
 */
export function GuideStroke({ stroke, width, dash, children }: { stroke: string; width: number; dash?: string; children: (p: { stroke: string; strokeWidth: number; strokeDasharray?: string; opacity?: number }) => ReactNode }) {
  return (
    <>
      {children({ stroke: SCENE.underStroke, strokeWidth: width + 3, opacity: 0.6 })}
      {children({ stroke, strokeWidth: width, strokeDasharray: dash })}
    </>
  );
}

/**
 * Hand-drawn schematic of an erect LEFT LATERAL chest in detector space (S12 scene "chest-lateral"; redrawn in S13b, RAD-072 1 and
 * 1b). The patient is in profile facing the viewer's LEFT. RAD-072 1b: every part from the shared `BODY` proportions and drawn in the
 * chest tonal layers — soft tissue (neck, shoulder, chest wall, abdomen with no posterior hump) → lung field in the air tone (narrow
 * apex, base on the diaphragm, deepest posterior recess) → heart (filled, anterior-inferior on the diaphragm behind the sternum) →
 * bones (sternum on the anterior wall, vertebral bodies joined into a column with disc spaces, ONE posterior-rib contour at 0°) →
 * fault overlays (outline / hatch) → labels. Drawn: what is scored (arms, chin, rotation as posterior-rib separation). Never mirrored
 * by RTL; drawing proportions only, never a measurement.
 */
export function LateralFigure({ W, H, region, rotationDeg, chin, armsRaised, showGuides }: Props) {
  const t = useTranslations("scene");
  void W;
  const { x, y, w, h } = region;
  const right = x + w;
  const sep = rotationDeg * SEPARATION_PER_DEG;
  // Chest wall around the EXISTING fitted lung box: thorax depth from BODY, the extra soft tissue mostly posterior (back muscles).
  const margin = Math.max(BODY.thorax.d * K - w, 20);
  const ant = x - margin * 0.35;
  const post = right + margin * 0.65;
  const abdomenD = BODY.trunk.abdomenD * K;
  // Top of the neck (origin of the head profile) and the shoulder joint.
  const neckTop = { x: x + w * 0.24, y: y - BODY.neck.h * K * 0.62 };
  const nape = { x: neckTop.x + 6 * K, y: neckTop.y + 0.2 * K };
  // Shoulder joint: over the upper-anterior chest with the arms lowered; it moves back as the arms are raised (the scapula turns).
  const shoulder = armsRaised ? { x: x + w * 0.62, y: y + h * 0.07 } : { x: x + w * 0.42, y: y + h * 0.06 };
  const tilt = chin === "tucked" ? -20 : chin === "elevated" ? 9 : 0;
  // One silhouette: front of the neck → sternal notch → anterior chest wall → abdomen; back: nape → upper back → posterior chest wall.
  const trunk =
    `M ${neckTop.x - 4 * K} ${neckTop.y + 3 * K} C ${neckTop.x - 3.4 * K} ${y - 6} ${ant + 22} ${y + 10} ${ant + 10} ${y + h * 0.1} ` +
    `C ${ant - 4} ${y + h * 0.3} ${ant - 6} ${y + h * 0.62} ${ant + 2} ${y + h * 0.86} C ${ant + 8} ${y + h} ${post - abdomenD + 6} ${H - 30} ${post - abdomenD + 14} ${H} ` +
    `L ${post - 18} ${H} C ${post - 8} ${H - 40} ${post + 2} ${y + h * 0.75} ${post} ${y + h * 0.5} ` +
    `C ${post - 2} ${y + h * 0.2} ${post - 34} ${y - 4} ${nape.x + 40} ${nape.y + 26} C ${nape.x + 16} ${nape.y + 14} ${nape.x} ${nape.y + 6} ${nape.x - 4} ${nape.y - 14} L ${neckTop.x - 3 * K} ${neckTop.y - 6} Z`;
  // Normalised to the EXISTING fitted landmark box. These are drawing proportions, never scored landmarks.
  const pt = (u: number, v: number) => `${x + u * w} ${y + v * h}`;
  const base = `M ${pt(0.04, 0.79)} C ${pt(0.25, 0.74)} ${pt(0.47, 0.83)} ${pt(0.64, 0.89)} Q ${pt(0.8, 0.96)} ${pt(0.92, 1)}`;
  const lung = `M ${pt(0.43, 0)} C ${pt(0.26, 0)} ${pt(0.16, 0.08)} ${pt(0.13, 0.22)} C ${pt(0.03, 0.42)} ${pt(0, 0.62)} ${pt(0.04, 0.79)} C ${pt(0.25, 0.74)} ${pt(0.47, 0.83)} ${pt(0.64, 0.89)} Q ${pt(0.8, 0.96)} ${pt(0.92, 1)} C ${pt(1, 0.75)} ${pt(0.98, 0.42)} ${pt(0.84, 0.18)} C ${pt(0.72, 0.04)} ${pt(0.56, 0)} ${pt(0.43, 0)} Z`;
  const heart = `M ${pt(0.11, 0.42)} C ${pt(0.29, 0.38)} ${pt(0.45, 0.52)} ${pt(0.52, 0.72)} Q ${pt(0.55, 0.81)} ${pt(0.5, 0.84)} C ${pt(0.3, 0.77)} ${pt(0.17, 0.76)} ${pt(0.04, 0.79)} Q ${pt(0.02, 0.56)} ${pt(0.11, 0.42)} Z`;
  // Sternum on the anterior chest wall, from the notch to the xiphoid (manubrium thicker).
  const st = (v: number) => ant + 6 + Math.sin(v * Math.PI) * -5 + v * 3;
  const sternum = `M ${st(0.08) + 2} ${y + h * 0.08} L ${st(0.08) + 18} ${y + h * 0.09} L ${st(0.2) + 15} ${y + h * 0.2} L ${st(0.62) + 11} ${y + h * 0.62} L ${st(0.7) + 6} ${y + h * 0.7} L ${st(0.62) + 1} ${y + h * 0.62} Q ${st(0.3) - 2} ${y + h * 0.3} ${st(0.08) + 2} ${y + h * 0.08} Z`;
  // Vertebral column (T1 → L1) with a gentle kyphosis: bodies about 3.4 cm deep, 2.4 cm tall, 0.5 cm disc spaces.
  const colX = (yy: number) => right - 5.6 * K + Math.sin(Math.min(1, Math.max(0, (yy - y + 20) / (h + 40))) * Math.PI) * 1.2 * K;
  const vertebrae = Array.from({ length: 13 }, (_, i) => {
    const y0 = y - 16 + i * 2.9 * K;
    const cx = colX(y0 + 12);
    const tilt = (Math.atan2(colX(y0 + 24) - colX(y0), 24) * -180) / Math.PI;
    return { y0, cx, tilt };
  }).filter((v) => v.y0 < H - 2);
  const ribs = (dx: number) => `M ${right - 8 + dx} ${y + h * 0.08} Q ${right + 10 + dx} ${y + h * 0.5} ${right - 8 + dx} ${y + h * 0.88}`;
  // Arms (BODY.upperArm / forearm). Lowered: the humerus hangs from the shoulder over the upper-anterior chest, the forearm down along
  // the front of the trunk, all inside the body outline. Raised: up and slightly back from the shoulder, behind the neck and the face.
  const upper = BODY.upperArm.l * K, fore = BODY.forearm.l * K;
  const lowered = [
    { x: shoulder.x, y: shoulder.y, w: BODY.upperArm.w * K },
    { x: shoulder.x - 0.12 * upper, y: shoulder.y + 0.99 * upper, w: BODY.forearm.w * K },
    { x: shoulder.x - 0.12 * upper - 0.05 * fore, y: shoulder.y + 0.99 * upper + fore, w: BODY.forearm.w * K * 0.85 },
  ];
  const raised = (dx: number) => [
    { x: shoulder.x + dx, y: shoulder.y + 10, w: BODY.upperArm.w * K },
    { x: shoulder.x + dx + 0.4 * upper, y: shoulder.y + 10 - 0.92 * upper, w: BODY.forearm.w * K },
    { x: shoulder.x + dx - 0.2 * fore, y: shoulder.y + 10 - 0.92 * upper - 0.9 * fore, w: BODY.forearm.w * K * 0.85 },
  ];
  const soft = { fill: SCENE.soft, stroke: SCENE.outline, strokeWidth: STROKE.thin, strokeLinejoin: "round" as const };
  const chinOverlay = { cx: x + w * 0.4, cy: y + 10, rx: w * 0.2, ry: 24 };
  return (
    <g>
      {/* far arm (behind the neck and the head), when raised */}
      {armsRaised && <path data-anatomy="far-arm" d={limbPath(raised(16))} {...soft} opacity={0.75} />}
      {/* trunk with the neck and the head in profile (face to the viewer's left, tilted by the chin cue about the top of the neck):
          outline pass, then fill pass, so the neck joins the head and the trunk in ONE silhouette */}
      {[true, false].map((outlinePass) => (
        <g key={String(outlinePass)} fill={outlinePass ? SCENE.outline : SCENE.soft} stroke={outlinePass ? SCENE.outline : "none"} strokeLinejoin="round">
          <path data-anatomy={outlinePass ? undefined : "trunk"} d={trunk} strokeWidth={STROKE.thin * 2} />
          <g transform={`translate(${neckTop.x} ${neckTop.y}) rotate(${tilt} 0 ${3 * K}) scale(${K})`}>
            <path data-anatomy={outlinePass ? undefined : "head"} d={HEAD_SIDE_CM} strokeWidth={(STROKE.thin * 2) / K} />
          </g>
        </g>
      ))}
      {/* lung field (both lungs superimposed) in the air tone: narrow apex, base on the diaphragm, deepest posterior recess */}
      <path data-anatomy="lateral-lung" d={lung} fill={SCENE.air} stroke={SCENE.outline} strokeWidth={STROKE.medium - 1} />
      {/* heart: anterior and low, resting on the diaphragm behind the sternum */}
      <path data-anatomy="heart" d={heart} fill={SCENE.heart} stroke={SCENE.outline} strokeWidth={STROKE.thin + 0.5} />
      {/* diaphragm: the base of the lung field; the second (superimposed) dome thin, just below it */}
      <path data-anatomy="diaphragm" d={base} fill="none" stroke={SCENE.boneLine} strokeWidth={STROKE.medium} />
      <path d={`M ${pt(0.06, 0.82)} C ${pt(0.27, 0.77)} ${pt(0.5, 0.86)} ${pt(0.66, 0.92)} Q ${pt(0.8, 0.98)} ${pt(0.9, 1)}`} fill="none" stroke={SCENE.outline} strokeWidth={STROKE.thin} opacity={0.6} />
      {/* bones: the sternum on the anterior chest wall; the vertebral bodies joined into a column with disc spaces */}
      <path data-anatomy="sternum" d={sternum} fill={SCENE.boneFill} stroke={SCENE.boneLine} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      <g data-anatomy="spine">
        <path d={`M ${colX(y - 16) - 17} ${y - 16} ${vertebrae.map((v) => `L ${v.cx - 17} ${v.y0 + 24}`).join(" ")}`} fill="none" stroke={SCENE.boneLine} strokeWidth={STROKE.thin} opacity={0.7} />
        <path d={`M ${colX(y - 16) + 17} ${y - 16} ${vertebrae.map((v) => `L ${v.cx + 17} ${v.y0 + 24}`).join(" ")}`} fill="none" stroke={SCENE.boneLine} strokeWidth={STROKE.thin} opacity={0.7} />
        {vertebrae.map((v, i) => (
          <rect key={i} x={v.cx - 17} y={v.y0} width={34} height={24} rx={4} fill={SCENE.boneFill} stroke={SCENE.boneLine} strokeWidth={1} transform={`rotate(${v.tilt.toFixed(2)} ${v.cx} ${v.y0 + 12})`} />
        ))}
      </g>
      {/* posterior ribs of the two sides: ONE contour when square (0°); the second, displaced by the rotation, only when rotated */}
      <path data-anatomy="posterior-ribs" d={ribs(0)} fill="none" stroke={SCENE.boneLine} strokeWidth={STROKE.medium} />
      {Math.abs(sep) > 0.5 && (
        <g data-anatomy="posterior-ribs-second">
          <path d={ribs(sep)} fill="none" stroke={SCENE.underStroke} strokeWidth={STROKE.medium + 4} opacity={0.85} />
          <path d={ribs(sep)} fill="none" stroke={SCENE.beam} strokeWidth={STROKE.medium} strokeDasharray="6 5" />
        </g>
      )}
      {/* chin tucked: the jaw over the apices, a translucent hatched outline (never a solid fill) */}
      {chinOverlapsApices(chin) && (
        <g data-anatomy="chin-over-apices">
          <ellipse {...chinOverlay} fill={SCENE.soft} opacity={0.35} />
          <path d={hatchEllipse(chinOverlay.cx, chinOverlay.cy, chinOverlay.rx, chinOverlay.ry, 9)} fill="none" stroke={SCENE.outline} strokeWidth={1.2} opacity={0.8} />
          <GuideStroke stroke={showGuides ? SCENE.guide : SCENE.outline} width={STROKE.guide} dash="5 4">
            {(p) => <ellipse {...chinOverlay} {...p} fill="none" />}
          </GuideStroke>
        </g>
      )}
      {/* near arm: raised above the head (behind the neck and face), or lowered over the upper-anterior chest */}
      {armsRaised ? (
        <path data-anatomy="near-arm" d={limbPath(raised(0))} {...soft} />
      ) : (
        <g data-anatomy="near-arm">
          <path d={limbPath(lowered)} fill={SCENE.soft} opacity={0.82} />
          {/* the humerus inside it, so the band reads as an arm hanging over the upper-anterior chest */}
          <path d={limbPath([{ ...lowered[0]!, w: 2.4 * K }, { ...lowered[1]!, w: 1.8 * K }])} fill={SCENE.boneFill} opacity={0.75} />
          <GuideStroke stroke={showGuides ? SCENE.guide : SCENE.outline} width={showGuides ? STROKE.guide + 0.5 : STROKE.thin}>
            {(p) => <path d={limbPath(lowered)} {...p} fill="none" strokeLinejoin="round" />}
          </GuideStroke>
        </g>
      )}
      <SceneLabel x={x + w * 0.29} y={y + h * 0.66} size={LABEL_SIZE.detector + 2} anchor="middle">
        {t("heart")}
      </SceneLabel>
      {!armsRaised && showGuides && (
        <SceneLabel x={x + w * 0.72} y={y + h * 0.22} size={LABEL_SIZE.detector + 2} anchor="middle" fill={SCENE.guide}>
          {t("armsOverLungs")}
        </SceneLabel>
      )}
    </g>
  );
}
