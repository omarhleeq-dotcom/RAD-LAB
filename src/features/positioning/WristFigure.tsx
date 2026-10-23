import { useTranslations } from "next-intl";
import { SceneLabel } from "./SceneParts";
import { LABEL_SIZE, SCENE } from "./scene-style";
import { OutlineLayers, r } from "./outline-layers";
import { WRIST_IMAGE, wristOutlineDrawing } from "./wrist-outline-drawing";
import type { FigureProps } from "./detector-figures";

/**
 * Schematic of the WRIST in detector space (scenes "wrist-pa" and "wrist-lateral"). Since RAD-072 2b it is drawn from the outlines TRACED
 * from the project's own baselines (`wrist-outlines.json`, A-011 / A-013; illustrative, drawing-only, not a measurement), moved by the 2.5D
 * wrist model (`features/wrist-model`, S-VIS-1b; also the source of the result image's displacements) through `wristOutlineDrawing`, so the
 * drawing turns in the SAME direction as the result image: PA, the proximal metacarpal bases unequally spaced and the ulna and radius
 * moving as two layers; lateral, the structures that must be superimposed drawn as two copies (far side 40 % / near side 60 %).
 * Limb drawing style (`LIMB`, as the hand): soft tissue → joint spaces → translucent bone fills → every bone's edge last, so overlapping
 * bones stay visible at every allowed rotation. Left wrist, fingers toward the top of the detector, thumb on the viewer's right in the PA
 * (a right-wrist case would pass `mirror: true`; both wrist exams are fixed-side L). Anatomy is an image convention and is never mirrored by
 * RTL. The drawing follows the projection setting; positions are the baseline image at its scale in the exam's required-anatomy region.
 */
export function WristDrawing({ radCase, settings, showGuides, W, H }: FigureProps) {
  const ts = useTranslations("sceneWrist");
  const kind = settings.projection === "wrist-lateral" ? "lateral" : "pa";
  const im = WRIST_IMAGE[kind];
  const a = radCase.requiredAnatomy;
  const U = 10; // SVG units per detector cm (`detector-figures.tsx` U)
  const k = im.cmPerPx * U; // SVG units per image pixel
  const toSvg = ([px, py]: [number, number]) => `${r(a.xCm * U + px * k)},${r(a.yCm * U + py * k)}`;
  const X = (u: number) => (a.xCm + u * a.widthCm) * U;
  return (
    <>
      {/* the baseline runs past the detector (the forearm, the soft tissue): clip the drawing to it */}
      <defs>
        <clipPath id="wrist-detector-clip">
          <rect x={0} y={0} width={W} height={H} />
        </clipPath>
      </defs>
      <g clipPath="url(#wrist-detector-clip)">
        <OutlineLayers d={wristOutlineDrawing(kind, settings.rotationDeg)} toSvg={toSvg} />
      </g>
      {kind === "pa" && showGuides && (
        <g aria-hidden style={{ pointerEvents: "none" }}>
          <SceneLabel x={X(0.06)} y={H - 92} size={LABEL_SIZE.detector - 5} fill={SCENE.guide}>{ts("ulna")}</SceneLabel>
          <SceneLabel x={X(0.95)} y={H - 64} size={LABEL_SIZE.detector - 5} anchor="end" fill={SCENE.guide}>{ts("radius")}</SceneLabel>
        </g>
      )}
    </>
  );
}
