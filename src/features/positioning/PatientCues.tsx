"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { ChinPositionId, ShoulderPositionId } from "@/domain/simulation";
import { HeadProfile, SceneArrow, SceneLabel } from "./SceneParts";
import { LABEL_SIZE, SCENE, STROKE } from "./scene-style";

interface Props {
  chin: ChinPositionId;
  shoulders: ShoulderPositionId;
  onChin: (v: ChinPositionId) => void;
  onShoulders: (v: ShoulderPositionId) => void;
  disabled: boolean;
  showGuides: boolean;
  /** Chest Lateral cues (S12): chin only (arms are an exam control), no PA side diagram, lateral practice guide. */
  lateral?: boolean;
  /** Chest AP supine cues (S13): guide list + the shoulder choice (the chin is not scored for the AP), no erect side diagram. */
  ap?: boolean;
}

/**
 * Side-view diagram of the erect patient facing the detector (Chest PA); shows the current chin / shoulder choice in the
 * shared scene style (S13b-1): head in profile with the chin cue, trunk, the near arm hanging, the anterior direction toward
 * the detector. The patient faces the detector on the viewer's right.
 */
function SideDiagram({ chin, shoulders }: Pick<Props, "chin" | "shoulders">) {
  const t = useTranslations("positioning");
  const ts = useTranslations("scene");
  const rolled = shoulders === "rolled-forward";
  const shoulderX = rolled ? 152 : 134;
  return (
    <svg viewBox="0 0 260 300" role="img" aria-label={t("cueSideAlt")} className="h-auto w-full max-w-[16rem]" style={{ direction: "ltr" }}>
      {/* floor + detector (patient faces right, toward the detector) */}
      <line x1={20} y1={282} x2={240} y2={282} stroke={SCENE.bed} strokeWidth={STROKE.medium} />
      <rect x={214} y={44} width={10} height={218} rx={3} fill={SCENE.detector} />
      <SceneLabel x={219} y={34} size={LABEL_SIZE.view - 1} anchor="middle">{ts("detector")}</SceneLabel>
      {/* legs + trunk */}
      <rect x={118} y={200} width={36} height={82} rx={8} fill={SCENE.bed} stroke={SCENE.limbFar} strokeWidth={STROKE.thin} />
      <rect x={108} y={98} width={54} height={112} rx={20} fill={SCENE.trunk} />
      {/* neck + head in profile, chin tucked or lifted */}
      <rect x={126} y={78} width={16} height={26} fill={SCENE.head} />
      <HeadProfile cx={135} cy={56} s={0.55} facing={1} chin={chin} />
      {/* near arm hanging; the shoulder moves toward the detector when rolled forward, the scapula stays behind */}
      <path d={`M ${shoulderX} 112 L ${shoulderX - 4} 168 L ${shoulderX + 6} 214`} fill="none" stroke={SCENE.limb} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={shoulderX} cy={112} r={13} fill={SCENE.limb} stroke={SCENE.bone} strokeWidth={STROKE.thin} />
      <path d={`M ${rolled ? 106 : 112} 104 q -10 24 0 48`} fill="none" stroke={SCENE.bone} strokeWidth={STROKE.medium} strokeLinecap="round" />
      <SceneLabel x={96} y={176} size={LABEL_SIZE.view - 1} anchor="end">{t("scapula")}</SceneLabel>
      {/* anterior chest toward the detector */}
      <SceneArrow x1={170} y1={150} x2={206} y2={150} color={SCENE.beam} />
      <SceneLabel x={188} y={140} size={LABEL_SIZE.view - 1} anchor="middle">{ts("anterior")}</SceneLabel>
      <SceneLabel x={100} y={206} size={LABEL_SIZE.view - 1} anchor="end">{ts("posterior")}</SceneLabel>
      {/* erect arrow (head up) */}
      <SceneArrow x1={52} y1={270} x2={52} y2={52} color={SCENE.good} width={2} dashed />
      <SceneLabel x={46} y={128} size={LABEL_SIZE.view - 1} anchor="end" fill={SCENE.good}>{t("cueErect")}</SceneLabel>
      <SceneLabel x={52} y={40} size={LABEL_SIZE.view - 1} anchor="middle">{ts("head")}</SceneLabel>
      <SceneLabel x={52} y={296} size={LABEL_SIZE.view - 1} anchor="middle">{ts("feet")}</SceneLabel>
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

export function PatientCues({ chin, shoulders, onChin, onShoulders, disabled, showGuides, lateral = false, ap = false }: Props) {
  const t = useTranslations("positioning");
  const tl = useTranslations("positioningLateral");
  const ta = useTranslations("positioningAp");
  if (ap) {
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
  if (lateral) {
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
