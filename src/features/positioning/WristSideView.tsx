"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { Limb, SceneLabel, UnderStroked } from "./SceneParts";
import { LABEL_SIZE, SCENE } from "./scene-style";
import { SeatedLimbSideView } from "./SeatedLimbSideView";
import { slabX, WRIST_SIDE } from "./wrist-visual";

const S = WRIST_SIDE.surfaceY;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/**
 * Hand-drawn schematic SIDE view of the wrist set-up (S14.1c, own work, S13b language), on the shared seated frame (`SeatedLimbSideView`):
 * the shoulder, elbow and wrist drawn on one level (context only: not scored in v1), the forearm and hand on the detector (the detector's
 * long axis laid along the table, fingers to the right). In the lateral the hand is drawn standing on its ulnar edge (thumb up), in the PA
 * flat (palm down).
 */
export function WristSideView({ radCase, settings, showGuides }: Props) {
  const ts = useTranslations("scene");
  const tw = useTranslations("sceneWrist");
  const lateral = settings.projection === "wrist-lateral";
  const { detector } = radCase;
  const field = collimatedField(settings, detector);
  const rayCm = ((settings.centralRay.y + 1) / 2) * detector.heightCm;
  const slabL = slabX(detector.heightCm);
  // The wrist as drawn: the midcarpal area of the baseline, where the exam's centring rule aims (fixed anatomy, the learner moves the ray).
  const wristCm = ((radCase.positioning.centering.target.y + 1) / 2) * detector.heightCm;
  const wristX = slabX(wristCm);
  const handH = lateral ? 34 : 15;
  const armH = 22;
  const level = S - 12 - armH / 2;
  return (
    <SeatedLimbSideView
      settings={settings}
      showGuides={showGuides}
      surfaceY={S}
      sidPxPerCm={WRIST_SIDE.sidPxPerCm}
      ariaLabel={ts("altWristSide", { projection: tw(lateral ? "lateralName" : "paName"), sid: settings.sidCm })}
      rayX={slabX(rayCm)}
      fieldA={slabX(field.y2)} // forearm end of the field (left)
      fieldB={slabX(field.y1)} // fingers end of the field (right)
      slabX={slabL}
      slabWidth={slabX(0) - slabL}
      targetX={wristX}
      limb={
        <Limb
          pts={[
            { x: 70, y: level, w: 30 },
            { x: 140, y: level + 1, w: 24 },
            { x: wristX - 22, y: level + 2, w: armH },
            { x: wristX, y: S - 3 - handH / 2 + 1, w: handH + 4 },
            { x: slabX(0) - 36, y: S - 3 - handH / 2 + 1, w: handH },
          ]}
        />
      }
      // The "same level" reference (sky, context only): shoulder, elbow and wrist on one level.
      extraGuides={
        <>
          <UnderStroked stroke={SCENE.guide} width={1.5} dash="3 5">
            {(p) => <line x1={70} y1={level} x2={wristX} y2={level} {...p} />}
          </UnderStroked>
          <SceneLabel x={104} y={level - 30} size={LABEL_SIZE.view - 2} fill={SCENE.guide}>{tw("sameLevel")}</SceneLabel>
        </>
      }
      targetLabel={tw("midcarpal")}
      seatedLabel={tw("seated")}
      endLabel={{ x: slabX(0) - 4, text: tw("fingers") }}
    />
  );
}
