import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { HAND_CM_PER_PX, handImage } from "@/data/exams/xray/hand-geometry";
import { SceneLabel } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";
import { handLateralOffsetCm, handPaBumpCm } from "./hand-visual";
import type { FigureProps } from "./detector-figures";

/**
 * Hand-drawn schematic of the HAND in detector space (S14.2b; scenes "hand-pa" and "hand-lateral", own work, S13b visual language:
 * dark muted anatomy, thin bone outlines, no accent hue). It draws what is scored and visible: the rotation of the hand (PA: the
 * metacarpal shafts and phalanges unequally spaced; lateral, extension: the structures that must be superimposed drawn apart) with
 * the SAME sign as the result image (positive = toward the viewer's right), and nothing the result reveals. The drawing follows the
 * learner's projection setting. LEFT hand, fingers toward the top of the detector; thumb on the viewer's right in the PA and on the
 * viewer's left in the lateral baseline. Anatomy is an image convention and is never mirrored by RTL.
 *
 * Positions are given in the PIXELS of the baseline image (read by eye, the same ones as in `hand-*-radiograph.ts`) and mapped
 * through the exam's required-anatomy region, so the figure sits where the baseline image will be drawn. Shapes are schematic,
 * never measured.
 */
export function HandDrawing({ radCase, settings, showGuides, W, H }: FigureProps) {
  const lateral = settings.projection === "hand-lateral";
  const im = handImage(lateral ? "lateral" : "pa");
  const a = radCase.requiredAnatomy;
  const U = W / radCase.detector.widthCm;
  const k = HAND_CM_PER_PX * U; // SVG units per image pixel
  const x0 = im.box.u1 * im.widthPx;
  const y0 = im.box.v1 * im.heightPx;
  const X = (px: number) => a.xCm * U + (px - x0) * k;
  const Y = (py: number) => a.yCm * U + (py - y0) * k;
  const g: G = { X, Y, k, H, W, U, wPx: im.widthPx, hPx: im.heightPx };
  return lateral ? <LateralDrawing g={g} rotationDeg={settings.rotationDeg} showGuides={showGuides} /> : <PaDrawing g={g} rotationDeg={settings.rotationDeg} />;
}

interface G {
  X: (px: number) => number;
  Y: (py: number) => number;
  /** SVG units per image pixel. */
  k: number;
  W: number;
  H: number;
  U: number;
  wPx: number;
  hPx: number;
}

const boneStyle = { fill: SCENE.trunk, stroke: SCENE.bone, strokeWidth: STROKE.thin, strokeOpacity: 0.85, strokeLinejoin: "round" } as const;
const softStyle = { fill: SCENE.limbFar, stroke: SCENE.edge, strokeWidth: STROKE.thin, strokeLinejoin: "round" } as const;

/** An outlined capsule (bone or soft-tissue digit) from (x1, y1) to (x2, y2), width w, all in image pixels. */
function Capsule({ g, x1, y1, x2, y2, w, soft, dx = 0, opacity = 1 }: { g: G; x1: number; y1: number; x2: number; y2: number; w: number; soft?: boolean; dx?: number; opacity?: number }) {
  const s = soft ? softStyle : boneStyle;
  const common = { x1: g.X(x1 + dx), y1: g.Y(y1), x2: g.X(x2 + dx), y2: g.Y(y2), strokeLinecap: "round" as const, opacity };
  return (
    <>
      <line {...common} stroke={s.stroke} strokeOpacity={soft ? 1 : 0.85} strokeWidth={w * g.k + 2 * s.strokeWidth} />
      <line {...common} stroke={s.fill} strokeWidth={w * g.k} />
    </>
  );
}

/** Smooth weight of a vertical band (fractions of the image height), as the pixel step's band weight (soft edges). */
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const bandW = (v1: number, v2: number, v: number) => smooth(v1 - 0.03, v1 + 0.03, v) * (1 - smooth(v2 - 0.03, v2 + 0.03, v));

// ───────────────────────── PA ─────────────────────────

/** Digits of the left hand in the PA baseline: metacarpophalangeal joint → fingertip, in image pixels (read by eye). */
const PA_DIGITS = [
  { mcp: [285, 990], tip: [105, 390], mc: [330, 1500] }, // little finger (5)
  { mcp: [440, 925], tip: [375, 125], mc: [500, 1490] }, // ring (4)
  { mcp: [632, 895], tip: [655, 30], mc: [580, 1480] }, // middle (3)
  { mcp: [850, 930], tip: [990, 195], mc: [690, 1470] }, // index (2)
] as const;

function PaDrawing({ g, rotationDeg }: { g: G; rotationDeg: number }) {
  const bumpPx = handPaBumpCm(rotationDeg) / HAND_CM_PER_PX;
  // The same bump as the pixel step (`pipeline.ts` handPaSpacingShiftU): sin over each band's horizontal extent, soft-edged bands.
  const dxAt = (px: number, py: number) => {
    const u = px / g.wPx;
    const v = py / g.hPx;
    const bands = [{ v1: 0.01, v2: 0.42, u1: 0.03, u2: 0.75 }, { v1: 0.44, v2: 0.71, u1: 0.08, u2: 0.72 }];
    let s = 0;
    for (const b of bands) s = Math.max(s, bandW(b.v1, b.v2, v) * Math.sin(Math.PI * Math.min(1, Math.max(0, (u - b.u1) / (b.u2 - b.u1)))));
    return bumpPx * s;
  };
  const along = (d: (typeof PA_DIGITS)[number], t: number): [number, number] => [d.mcp[0] + (d.tip[0] - d.mcp[0]) * t, d.mcp[1] + (d.tip[1] - d.mcp[1]) * t];
  const digit = (d: (typeof PA_DIGITS)[number], i: number): ReactNode => {
    // proximal, middle, distal phalanx along the digit axis (fractions of the MCP → tip distance)
    const segs: [number, number][] = [[0.03, 0.4], [0.46, 0.72], [0.78, 1]];
    const bones = segs.map(([t0, t1], j) => {
      const [ax, ay] = along(d, t0), [bx, by] = along(d, t1);
      const dx = dxAt((ax + bx) / 2, (ay + by) / 2);
      return <Capsule key={`${i}-${j}`} g={g} x1={ax} y1={ay} x2={bx} y2={by} w={j === 0 ? 74 : j === 1 ? 62 : 54} dx={dx} />;
    });
    const mcDx = dxAt((d.mcp[0] + d.mc[0]) / 2, (d.mcp[1] + d.mc[1]) / 2);
    return (
      <g key={i}>
        {bones}
        <Capsule g={g} x1={d.mcp[0] + 4} y1={d.mcp[1] + 30} x2={d.mc[0]} y2={d.mc[1]} w={78} dx={mcDx} />
      </g>
    );
  };
  const softDigit = (d: (typeof PA_DIGITS)[number], i: number) => {
    const [ax, ay] = along(d, 0.0), [bx, by] = along(d, 1.0);
    const dx = dxAt((ax + bx) / 2, (ay + by) / 2);
    return <Capsule key={`s${i}`} g={g} x1={ax} y1={ay} x2={bx} y2={by} w={150} soft dx={dx} />;
  };
  const { X, Y } = g;
  return (
    <>
      {/* soft tissue: forearm, palm and the four fingers (thumb on the viewer's right); the forearm runs off the bottom edge */}
      <path
        d={`M ${X(210)} ${Y(2082)} L ${X(190)} ${Y(1820)} C ${X(110)} ${Y(1650)} ${X(100)} ${Y(1450)} ${X(150)} ${Y(1120)} L ${X(1000)} ${Y(1000)} L ${X(1010)} ${Y(1250)} L ${X(900)} ${Y(1650)} L ${X(800)} ${Y(1800)} L ${X(790)} ${Y(2082)} Z`}
        {...softStyle}
      />
      {PA_DIGITS.map(softDigit)}
      {/* thumb (on the viewer's right): soft tissue, metacarpal, proximal and distal phalanx */}
      <Capsule g={g} x1={770} y1={1580} x2={1370} y2={900} w={170} soft />
      <Capsule g={g} x1={780} y1={1570} x2={1080} y2={1340} w={80} />
      <Capsule g={g} x1={1110} y1={1320} x2={1240} y2={1190} w={66} />
      <Capsule g={g} x1={1260} y1={1170} x2={1360} y2={930} w={56} />
      {PA_DIGITS.map(digit)}
      {/* carpals: two rows */}
      {[[400, 1570, 100], [570, 1590, 100], [740, 1570, 105], [900, 1650, 95], [330, 1720, 95], [520, 1740, 105], [700, 1720, 100]].map(([cx, cy, r]) => (
        <ellipse key={`${cx}-${cy}`} cx={X(cx!)} cy={Y(cy!)} rx={r! * g.k} ry={r! * 0.85 * g.k} {...boneStyle} />
      ))}
      {/* distal radius (right in the PA) and ulna (left) */}
      <path d={`M ${X(440)} ${Y(1830)} L ${X(790)} ${Y(1800)} L ${X(740)} ${Y(1960)} L ${X(720)} ${Y(2082)} L ${X(450)} ${Y(2082)} L ${X(450)} ${Y(1960)} Z`} {...boneStyle} />
      <path d={`M ${X(250)} ${Y(1800)} L ${X(420)} ${Y(1830)} L ${X(410)} ${Y(1960)} L ${X(410)} ${Y(2082)} L ${X(260)} ${Y(2082)} L ${X(270)} ${Y(1960)} Z`} {...boneStyle} />
    </>
  );
}

// ───────────────────────── lateral (extension) ─────────────────────────

function LateralDrawing({ g, rotationDeg, showGuides }: { g: G; rotationDeg: number; showGuides: boolean }) {
  const ts = useTranslations("sceneHand");
  const offPx = handLateralOffsetCm(rotationDeg) / HAND_CM_PER_PX;
  const { X, Y } = g;
  // Bundles that must be superimposed in a true lateral: the extended fingers over the metacarpals (one column), and the distal radius over the ulna.
  const column = (dx: number, key: string, opacity: number): ReactNode => (
    <g key={key} opacity={opacity}>
      <Capsule g={g} x1={420} y1={80} x2={455} y2={790} w={92} dx={dx} />
      <Capsule g={g} x1={452} y1={830} x2={478} y2={1480} w={110} dx={dx} />
    </g>
  );
  const forearm = (dx: number, key: string): ReactNode => (
    <path key={key} transform={`translate(${dx * g.k} 0)`} d={`M ${X(370)} ${Y(1830)} L ${X(570)} ${Y(1810)} L ${X(560)} ${Y(1960)} L ${X(580)} ${Y(2123)} L ${X(380)} ${Y(2123)} L ${X(390)} ${Y(1960)} Z`} {...boneStyle} fillOpacity={0.9} />
  );
  return (
    <>
      {/* soft tissue: forearm, palm and the finger column (the thumb is drawn apart, on the viewer's left) */}
      <path d={`M ${X(330)} ${Y(2123)} L ${X(300)} ${Y(1800)} C ${X(260)} ${Y(1500)} ${X(300)} ${Y(1000)} ${X(330)} ${Y(780)} L ${X(300)} ${Y(300)} L ${X(380)} ${Y(30)} L ${X(520)} ${Y(30)} L ${X(580)} ${Y(520)} L ${X(590)} ${Y(1000)} L ${X(600)} ${Y(1700)} L ${X(650)} ${Y(2123)} Z`} {...softStyle} />
      {/* thumb (separated from the finger column): metacarpal, proximal and distal phalanx */}
      <Capsule g={g} x1={150} y1={1590} x2={215} y2={1250} w={150} soft />
      <Capsule g={g} x1={150} y1={1580} x2={205} y2={1260} w={78} />
      <Capsule g={g} x1={110} y1={1180} x2={105} y2={910} w={64} />
      <Capsule g={g} x1={96} y1={830} x2={92} y2={680} w={56} />
      {/* fingers over the metacarpals: one column in a true lateral; a second copy appears apart with the value */}
      {column(0, "c0", 1)}
      {offPx !== 0 && column(offPx, "c1", 0.9)}
      {/* carpals */}
      {[[430, 1560, 95], [350, 1660, 90], [480, 1690, 100], [540, 1590, 80]].map(([cx, cy, r]) => (
        <ellipse key={`${cx}-${cy}`} cx={X(cx!)} cy={Y(cy!)} rx={r! * g.k} ry={r! * 0.85 * g.k} {...boneStyle} />
      ))}
      {/* distal radius and ulna: superimposed in a true lateral; a second copy appears apart with the value */}
      {forearm(0, "f0")}
      {offPx !== 0 && forearm(offPx, "f1")}
      {showGuides && (
        <g aria-hidden style={{ pointerEvents: "none" }}>
          <SceneLabel x={X(150)} y={Y(760)} size={LABEL_SIZE.detector - 4} fill={SCENE.guide}>{ts("thumb")}</SceneLabel>
        </g>
      )}
    </>
  );
}
