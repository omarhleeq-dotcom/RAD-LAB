"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { ChinPositionId, ShoulderPositionId } from "@/domain/simulation";
import { HEAD_SIDE_CM, limbPath } from "./LateralFigure";
import { SceneArrow, SceneLabel } from "./SceneParts";
import { BODY, LABEL_SIZE, SCENE, STROKE } from "./scene-style";

interface Props {
  chin: ChinPositionId;
  shoulders: ShoulderPositionId;
  onChin: (v: ChinPositionId) => void;
  onShoulders: (v: ShoulderPositionId) => void;
  disabled: boolean;
  showGuides: boolean;
}

/** A scene's patient-cues panel (S14-0): the registry (`scene-layouts.tsx`) names the component, no flags. */
export type CuesProps = Props;

/** Drawing scale of the cue diagram (px per drawing cm): the whole standing patient fits the panel. */
const CK = 1.25;

/**
 * Side-view diagram of the erect patient facing the detector (Chest PA); shows the current chin / shoulder choice in the
 * shared scene style (S13b-1; RAD-072 1b: the shared `BODY` proportions and chest tonal layers): head in profile with the chin
 * cue, trunk, the near arm hanging, the anterior direction toward the detector. The patient faces the detector on the viewer's right.
 */
function SideDiagram({ chin, shoulders }: Pick<Props, "chin" | "shoulders">) {
  const t = useTranslations("positioning");
  const ts = useTranslations("scene");
  const rolled = shoulders === "rolled-forward";
  // RAD-072 1b: the standing patient from the shared BODY proportions (drawing cm × CK), facing the detector on the right.
  const floor = 282;
  const front = 162, back = front - BODY.thorax.d * CK, belly = BODY.trunk.abdomenD * CK;
  const shoulderY = floor - 144 * CK, hipY = floor - 91 * CK, neckTop = { x: front - 16, y: shoulderY - BODY.neck.h * CK };
  const shoulderX = rolled ? front - 8 : front - 20;
  const tilt = chin === "tucked" ? 20 : chin === "elevated" ? -9 : 0;
  const trunk =
    `M ${neckTop.x - 6} ${neckTop.y} L ${front - 6} ${shoulderY - 4} C ${front + 2} ${shoulderY + 8} ${front + 2} ${shoulderY + 26} ${front} ${shoulderY + 34} ` +
    `C ${front - 2} ${hipY - 30} ${back + belly + 2} ${hipY - 10} ${back + belly} ${hipY + 4} L ${back - 2} ${hipY + 4} C ${back - 6} ${hipY - 20} ${back - 2} ${shoulderY + 40} ${back} ${shoulderY + 20} ` +
    `C ${back + 2} ${shoulderY + 4} ${neckTop.x - 10} ${shoulderY - 2} ${neckTop.x - 12} ${neckTop.y} Z`;
  const legX = (back + back + belly) / 2;
  const leg = limbPath([
    { x: legX, y: hipY, w: BODY.thigh.w * CK },
    { x: legX + 2, y: hipY + BODY.thigh.l * CK, w: BODY.shank.w * CK * 1.1 },
    { x: legX, y: floor - 4, w: BODY.shank.w * CK * 0.7 },
  ]);
  const foot = `M ${legX - 5} ${floor - 9} L ${legX + 5} ${floor - 9} L ${legX - 5 + BODY.foot.l * CK} ${floor - 3} L ${legX - 5 + BODY.foot.l * CK} ${floor} L ${legX - 7} ${floor} Z`;
  const arm = limbPath([
    { x: shoulderX, y: shoulderY + 6, w: BODY.upperArm.w * CK },
    { x: shoulderX - 3, y: shoulderY + 6 + BODY.upperArm.l * CK, w: BODY.forearm.w * CK },
    { x: shoulderX + 2, y: shoulderY + 6 + (BODY.upperArm.l + BODY.forearm.l) * CK, w: BODY.forearm.w * CK * 0.8 },
  ]);
  return (
    <svg viewBox="0 0 260 300" role="img" aria-label={t("cueSideAlt")} className="h-auto w-full max-w-[16rem]" style={{ direction: "ltr" }}>
      {/* floor + detector (patient faces right, toward the detector) */}
      <line x1={20} y1={282} x2={240} y2={282} stroke={SCENE.bed} strokeWidth={STROKE.medium} />
      <rect x={214} y={44} width={10} height={218} rx={3} fill={SCENE.detector} />
      <SceneLabel x={219} y={34} size={LABEL_SIZE.view - 1} anchor="middle">{ts("detector")}</SceneLabel>
      {/* head (profile, tilted by the chin cue), neck, trunk and legs: outline pass, then fill pass (one silhouette) */}
      {[true, false].map((outlinePass) => (
        <g key={String(outlinePass)} fill={outlinePass ? SCENE.outline : SCENE.soft} stroke={outlinePass ? SCENE.outline : "none"} strokeWidth={STROKE.thin * 2} strokeLinejoin="round">
          <path d={leg} />
          <path d={foot} />
          <path d={trunk} />
          <g transform={`translate(${neckTop.x} ${neckTop.y}) rotate(${tilt} 0 ${3 * CK}) scale(${-CK} ${CK})`}>
            <path d={HEAD_SIDE_CM} strokeWidth={(STROKE.thin * 2) / CK} />
          </g>
        </g>
      ))}
      {/* near arm hanging; the shoulder moves toward the detector when rolled forward, the scapula stays behind */}
      <path d={arm} fill={SCENE.soft} stroke={SCENE.outline} strokeWidth={STROKE.thin} strokeLinejoin="round" />
      <path d={`M ${back + (rolled ? -2 : 4)} ${shoulderY + 2} q -9 22 0 44`} fill="none" stroke={SCENE.boneLine} strokeWidth={STROKE.medium} strokeLinecap="round" />
      <SceneLabel x={96} y={176} size={LABEL_SIZE.view - 1} anchor="end">{t("scapula")}</SceneLabel>
      {/* anterior chest toward the detector */}
      <SceneArrow x1={170} y1={150} x2={206} y2={150} color={SCENE.beam} />
      <SceneLabel x={188} y={140} size={LABEL_SIZE.view - 1} anchor="middle">{ts("anterior")}</SceneLabel>
      <SceneLabel x={100} y={206} size={LABEL_SIZE.view - 1} anchor="end">{ts("posterior")}</SceneLabel>
      {/* erect arrow (head up) */}
      <SceneArrow x1={52} y1={262} x2={52} y2={52} color={SCENE.good} width={2} dashed />
      <SceneLabel x={46} y={128} size={LABEL_SIZE.view - 1} anchor="end" fill={SCENE.good}>{t("cueErect")}</SceneLabel>
      <SceneLabel x={52} y={40} size={LABEL_SIZE.view - 1} anchor="middle">{ts("head")}</SceneLabel>
      <SceneLabel x={52} y={288} size={LABEL_SIZE.view - 1} anchor="middle">{ts("feet")}</SceneLabel>
    </svg>
  );
}

function Choice<T extends string>({
  legend,
  options,
  value,
  onSelect,
  disabled,
  label,
}: {
  legend: string;
  options: readonly T[];
  value: T;
  onSelect: (v: T) => void;
  disabled: boolean;
  label: (v: T) => string;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-1">
      <legend className="text-sm font-medium text-console-text">{legend}</legend>
      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {options.map((o) => (
          <label
            key={o}
            className={clsx(
              "flex cursor-pointer items-center gap-2 rounded border px-2 py-1.5 text-sm has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-signal",
              o === value ? "border-signal bg-signal/10 text-white" : "border-console-line text-console-text hover:bg-console-raise",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input type="radio" className="accent-signal" name={legend} checked={o === value} onChange={() => onSelect(o)} />
            {label(o)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Chest AP supine cues (S13): guide list + the shoulder choice (the chin is not scored for the AP), no erect side diagram. */
export function ApPatientCues({ shoulders, onShoulders, disabled, showGuides }: Props) {
  const t = useTranslations("positioning");
  const ta = useTranslations("positioningAp");
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">{t("cuesTitle")}</h3>
      {showGuides && (
        <div className="rounded border border-console-line p-2 text-xs text-console-text">
          <p className="mb-1 font-medium text-white">{ta("cuesLegendHelp")}</p>
          <ul className="list-disc space-y-0.5 ps-5">
            <li>{ta("cuePosition")}</li>
            <li>{ta("cueShoulders")}</li>
            <li>{ta("cueAngle")}</li>
            <li>{ta("cueCentre")}</li>
          </ul>
        </div>
      )}
      <Choice legend={t("shoulderLegend")} options={["relaxed", "rolled-forward"] as const} value={shoulders} onSelect={onShoulders} disabled={disabled} label={(v) => t(`shoulderOptions.${v}`)} />
    </div>
  );
}

/** Chest Lateral cues (S12): chin only (arms are an exam control), no PA side diagram, lateral practice guide. */
export function LateralPatientCues({ chin, onChin, disabled, showGuides }: Props) {
  const t = useTranslations("positioning");
  const tl = useTranslations("positioningLateral");
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">{t("cuesTitle")}</h3>
      {showGuides && (
        <div className="rounded border border-console-line p-2 text-xs text-console-text">
          <p className="mb-1 font-medium text-white">{tl("cuesLegendHelp")}</p>
          <ul className="list-disc space-y-0.5 ps-5">
            <li>{tl("cueErect")}</li>
            <li>{tl("cueSide")}</li>
            <li>{tl("cueArms")}</li>
            <li>{tl("cueChin")}</li>
            <li>{tl("cueStraight")}</li>
          </ul>
        </div>
      )}
      <Choice legend={t("chinLegend")} options={["tucked", "elevated"] as const} value={chin} onSelect={onChin} disabled={disabled} label={(v) => t(`chinOptions.${v}`)} />
    </div>
  );
}

/** Chest PA cues: the erect side diagram, the practice guide, the chin and shoulder choices. */
export function PatientCues({ chin, shoulders, onChin, onShoulders, disabled, showGuides }: Props) {
  const t = useTranslations("positioning");
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">{t("cuesTitle")}</h3>
      <div className="flex justify-center">
        <SideDiagram chin={chin} shoulders={shoulders} />
      </div>
      {showGuides && (
        <div className="rounded border border-console-line p-2 text-xs text-console-text">
          <p className="mb-1 font-medium text-white">{t("cuesLegendHelp")}</p>
          <ul className="list-disc space-y-0.5 ps-5">
            <li>{t("cueErect")}</li>
            <li>{t("cueAnterior")}</li>
            <li>{t("cueChin")}</li>
            <li>{t("cueShoulders")}</li>
          </ul>
        </div>
      )}
      <Choice legend={t("chinLegend")} options={["tucked", "elevated"] as const} value={chin} onSelect={onChin} disabled={disabled} label={(v) => t(`chinOptions.${v}`)} />
      <Choice legend={t("shoulderLegend")} options={["relaxed", "rolled-forward"] as const} value={shoulders} onSelect={onShoulders} disabled={disabled} label={(v) => t(`shoulderOptions.${v}`)} />
    </div>
  );
}
