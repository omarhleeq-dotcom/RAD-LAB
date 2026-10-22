"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { Limb } from "./SceneParts";
import { ELBOW_SIDE, apSlabX, lateralSlabX } from "./elbow-visual";
import { SCENE, STROKE } from "./scene-style";
import { SeatedLimbSideView } from "./SeatedLimbSideView";

const S = ELBOW_SIDE.surfaceY;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/**
 * Hand-drawn schematic SIDE view of the elbow set-up (S14.3, own work, S13b language), on the shared seated frame (`SeatedLimbSideView`): the arm
 * on the detector. AP: the arm is fully extended along the table (the humerus end of the detector at the patient's side, the forearm to the right,
 * palm up). Lateral: the elbow is flexed 90° in the horizontal plane: the forearm lies on the detector on its ulnar edge (thumb side up) and the
 * upper arm points toward the viewer (drawn end-on, a circle at the elbow).
 */
export function ElbowSideView({ radCase, settings, showGuides }: Props) {
  const ts = useTranslations("scene");
  const te = useTranslations("sceneElbow");
  const lateral = settings.projection === "elbow-lateral";
  const { detector } = radCase;
  const field = collimatedField(settings, detector);
  // The slab axis: AP = the detector's long axis (y), lateral = the detector's width (x, the forearm's axis).
  const lengthCm = lateral ? detector.widthCm : detector.heightCm;
  const toX = (cm: number) => (lateral ? lateralSlabX(cm) : apSlabX(cm, lengthCm));
  const rayCm = lateral ? ((settings.centralRay.x + 1) / 2) * detector.widthCm : ((settings.centralRay.y + 1) / 2) * detector.heightCm;
  const [fa, fb] = lateral ? [toX(field.x1), toX(field.x2)] : [toX(field.y1), toX(field.y2)];
  const slabL = toX(lateral ? detector.widthCm : 0);
  const slabR = toX(lateral ? 0 : lengthCm);
  const slabA = Math.min(slabL, slabR);
  const slabB = Math.max(slabL, slabR);
  // The mid-elbow target of the exam (fixed anatomy; the learner moves the ray).
  const tg = radCase.positioning.centering.target;
  const targetCm = lateral ? ((tg.x + 1) / 2) * detector.widthCm : ((tg.y + 1) / 2) * detector.heightCm;
  const targetX = toX(targetCm);
  const armH = 22;
  const level = S - 12 - armH / 2;
  const forearmH = lateral ? 34 : 15;
  return (
    <SeatedLimbSideView
      settings={settings}
      showGuides={showGuides}
      surfaceY={S}
      sidPxPerCm={ELBOW_SIDE.sidPxPerCm}
      ariaLabel={ts("altElbowSide", { projection: te(lateral ? "lateralName" : "apName"), sid: settings.sidCm })}
      rayX={toX(rayCm)}
      fieldA={Math.min(fa, fb)}
      fieldB={Math.max(fa, fb)}
      slabX={slabA}
      slabWidth={slabB - slabA}
      targetX={targetX}
      limb={
        lateral ? (
          <>
            {/* the upper arm comes toward the viewer from the shoulder (end-on circle at the elbow); the forearm lies on the detector on its ulnar edge, thumb side up */}
            <Limb
              pts={[
                { x: targetX - 4, y: S - 3 - forearmH / 2 + 1, w: forearmH + 4 },
                { x: targetX + 60, y: S - 3 - forearmH / 2 + 1, w: forearmH },
                { x: 420, y: S - 3 - forearmH / 2 + 1, w: forearmH - 6 },
              ]}
            />
            <circle cx={targetX - 4} cy={S - 3 - forearmH / 2 + 1} r={(forearmH + 4) / 2 + 3} fill={SCENE.limb} stroke={SCENE.edge} strokeWidth={STROKE.thin} />
          </>
        ) : (
          <Limb
            pts={[
              { x: 70, y: level, w: 30 },
              { x: 140, y: level + 1, w: 26 },
              { x: slabA + 20, y: level + 2, w: armH },
              { x: targetX, y: S - 3 - forearmH / 2 + 1, w: forearmH + 6 },
              { x: 420, y: S - 3 - forearmH / 2 + 1, w: forearmH - 2 },
            ]}
          />
        )
      }
      targetLabel={te("midElbow")}
      seatedLabel={te("seated")}
      endLabel={{ x: slabB - 4, text: te(lateral ? "upperArmTowardViewer" : "forearm") }}
    />
  );
}
