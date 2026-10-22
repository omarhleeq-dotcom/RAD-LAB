"use client";

import { useTranslations } from "next-intl";
import type { RadCase } from "@/domain/case";
import type { SimulationSettings } from "@/domain/simulation";
import { collimatedField } from "@/features/simulation/geometry";
import { Limb } from "./SceneParts";
import { HAND_SIDE, handSlabX } from "./hand-visual";
import { SeatedLimbSideView } from "./SeatedLimbSideView";

const S = HAND_SIDE.surfaceY;

interface Props {
  radCase: RadCase;
  settings: SimulationSettings;
  showGuides: boolean;
}

/**
 * Hand-drawn schematic SIDE view of the hand set-up (S14.2b, own work, S13b language), on the shared seated frame (`SeatedLimbSideView`) and
 * the 30 cm detector: the forearm and hand on the detector (the detector's long axis laid along the table, fingers to the right). In the
 * lateral the hand is drawn standing on its ulnar edge (thumb side up), in the PA flat (palm down).
 */
export function HandSideView({ radCase, settings, showGuides }: Props) {
  const ts = useTranslations("scene");
  const th = useTranslations("sceneHand");
  const lateral = settings.projection === "hand-lateral";
  const { detector } = radCase;
  const field = collimatedField(settings, detector);
  const rayCm = ((settings.centralRay.y + 1) / 2) * detector.heightCm;
  const slabL = handSlabX(detector.heightCm);
  // The MCP target of the exam (fixed anatomy; the learner moves the ray) and the fingertip end of the drawn hand.
  const targetCm = ((radCase.positioning.centering.target.y + 1) / 2) * detector.heightCm;
  const targetX = handSlabX(targetCm);
  const tipX = handSlabX(radCase.requiredAnatomy.yCm);
  const handH = lateral ? 34 : 15;
  const armH = 22;
  const level = S - 12 - armH / 2;
  return (
    <SeatedLimbSideView
      settings={settings}
      showGuides={showGuides}
      surfaceY={S}
      sidPxPerCm={HAND_SIDE.sidPxPerCm}
      ariaLabel={ts("altHandSide", { projection: th(lateral ? "lateralName" : "paName"), sid: settings.sidCm })}
      rayX={handSlabX(rayCm)}
      fieldA={handSlabX(field.y2)} // forearm end of the field (left)
      fieldB={handSlabX(field.y1)} // fingers end of the field (right)
      slabX={slabL}
      slabWidth={handSlabX(0) - slabL}
      targetX={targetX}
      limb={
        <Limb
          pts={[
            { x: 70, y: level, w: 30 },
            { x: 140, y: level + 1, w: 24 },
            { x: slabL + 20, y: level + 2, w: armH },
            { x: targetX + 70, y: S - 3 - handH / 2 + 1, w: handH + 4 },
            { x: tipX, y: S - 3 - handH / 2 + 1, w: handH },
          ]}
        />
      }
      targetLabel={th(lateral ? "mcpLateral" : "mcpPa")}
      seatedLabel={th("seated")}
      endLabel={{ x: tipX - 4, text: th("fingers") }}
    />
  );
}
