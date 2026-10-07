/**
 * TEST-ONLY synthetic limb-shaped exam + case (S14.1b). NOT registered in `EXAMS` / `CASES`, not routed, never shown to a
 * learner, and carrying no medical content: every number is a placeholder chosen to exercise the engine. Its only job is to
 * prove that an exam with no chin / shoulder cues, no breathing, no AEC and no lung landmarks validates, composes, evaluates
 * and renders through the generalised code (S14.1b; the wrist exams themselves are S14.1c).
 */
import { chestPaTechnique } from "@/data/exams/xray/chest-pa-technique";
import type { CheckRule } from "@/domain/case";
import type { AnyExamDefinition, CaseDefinition } from "@/domain/exam";
import type { LocalizedText } from "@/domain/localized";
import type { ExamRegistries } from "../validate";

const t = (en: string): LocalizedText => ({ en, ar: `اختبار اصطناعي: ${en}` });
const ev = { status: "provisional", reference: "none", note: "Synthetic test fixture; no medical content." } as const;
const fb = (n: string) => ({ pass: t(`${n} ok`), fail: t(`${n} not ok`), low: t(`${n} low`), high: t(`${n} high`) });

/** The protocol of a manual-only exam: the chest PA protocol with the AEC section removed (placeholder numbers). */
const { aec: _aec, ...manualOnly } = chestPaTechnique;
void _aec;

const rules: CheckRule[] = [
  { id: "rotation", kind: "range", category: "rotation", setting: "rotationDeg", ideal: [-2, 2], acceptable: [-5, 5], unit: "°", label: t("Rotation"), feedback: fb("Rotation"), evidence: ev, variantOnLow: "rotated", variantOnHigh: "rotated" },
  { id: "centering-lateral", kind: "centering", axis: "x", category: "centering", label: t("Centring x"), feedback: fb("Centring x"), evidence: ev },
  { id: "centering-vertical", kind: "centering", axis: "y", category: "centering", label: t("Centring y"), feedback: fb("Centring y"), evidence: ev },
  { id: "collimation-clipping", kind: "coverage", check: "clipping", category: "positioning", maxMarginCm: 0, label: t("Field"), feedback: fb("Field"), evidence: ev, variantOnClipped: "clipped" },
  {
    id: "side-marker", kind: "marker", category: "positioning", weight: 0, label: t("Marker"), evidence: ev,
    feedback: { ...fb("Marker"), overlap: t("overlap"), outsideField: t("outside"), wrongSide: t("wrong side") },
  },
  { id: "kvp", kind: "technique", check: "kvp-band", category: "exposure", label: t("kVp"), feedback: fb("kVp"), evidence: ev, variantOnLow: "low-penetration" },
  { id: "exposure-adequacy", kind: "technique", check: "exposure-adequacy", category: "exposure", label: t("Exposure"), feedback: fb("Exposure"), evidence: ev, variantOnLow: "low-exposure" },
  { id: "sid", kind: "range", category: "sid", setting: "sidCm", ideal: [170, 190], acceptable: [150, 200], unit: "cm", label: t("SID"), feedback: fb("SID"), evidence: ev },
  { id: "motion-instruction", kind: "equals", category: "positioning", weight: 0, setting: "motionInstruction", expected: "remain-still", label: t("Keep still"), feedback: fb("Keep still"), evidence: ev, variantOnFail: "motion" },
];

export const syntheticLimbExam: AnyExamDefinition = {
  schemaVersion: 1,
  id: "synthetic-limb-test",
  modality: "general-radiography",
  bodyPart: "synthetic-limb",
  title: t("Synthetic limb exam (test fixture)"),
  provisional: true,
  evidence: ev,
  defaultCaseId: "synthetic",
  requiredProjection: "synthetic-ap",
  availableProjections: ["synthetic-ap"],
  // no availableBreathing, no choiceControls
  availableMotionInstructions: ["none", "remain-still", "relax-and-move"],
  detector: { widthCm: 18, heightCm: 24 },
  requiredAnatomy: { xCm: 4, yCm: 4, widthCm: 10, heightCm: 16 },
  controls: {
    rotationDeg: { min: -20, max: 20, step: 1 },
    sidCm: { min: 100, max: 200, step: 5 },
    kvp: { min: 50, max: 150, step: 1 },
    mas: { min: 0.5, max: 40, step: 0.5 },
  },
  technique: manualOnly,
  positioning: {
    centering: { target: { x: 0, y: 0 }, idealTolerance: { x: 0.1, y: 0.1 }, acceptableTolerance: { x: 0.2, y: 0.2 } },
    minCollimation: 0.3,
    markerSizeCm: 2,
    markerSide: { L: "viewer-right", R: "viewer-left" },
    defaultMarkerPosition: { L: { x: 0.8, y: -0.8 }, R: { x: -0.8, y: -0.8 } },
  },
  rules,
  // No breathing category (a limb has none); weights sum to 100.
  scoring: {
    categoryWeights: { positioning: 30, rotation: 25, centering: 15, exposure: 20, sid: 10 },
    passThreshold: 70,
    criticalFindings: [],
  },
  possibleErrors: [],
  imageCriteria: [],
  scene: { id: "synthetic-scene" },
  render: { renderer: "radiograph-2d" },
};

export const syntheticLimbCase: CaseDefinition = {
  schemaVersion: 1,
  id: "synthetic",
  examId: syntheticLimbExam.id,
  provisional: true,
  patient: { age: 30, sex: "female", description: t("Synthetic patient") },
  clinicalScenario: t("Synthetic scenario"),
  requestedExamination: t("Synthetic request"),
  patientCondition: t("Synthetic condition"),
  patientTechnique: { attenuation: 1, label: t("Synthetic attenuation"), evidence: ev },
  // A baseline with NO lung landmarks, scapulae, jaw or midline: only the box a limb needs.
  radiograph: {
    id: "synthetic-limb-asset",
    src: "/synthetic-limb.png",
    widthPx: 120,
    heightPx: 160,
    projection: "synthetic-ap",
    registryIds: ["synthetic"],
    credit: t("Synthetic"),
    evidence: ev,
    anatomyBox: { u1: 0.1, v1: 0.1, u2: 0.9, v2: 0.9 },
  },
  // No inspirationResponse.
  patientCooperation: {
    id: "synthetic-cooperation",
    label: t("Synthetic cooperation"),
    motionResponse: { none: "motion", "remain-still": "none", "relax-and-move": "motion" },
    evidence: ev,
  },
  // No chinPosition, shoulderPosition or breathing.
  initialSettings: {
    projection: "synthetic-ap",
    rotationDeg: 4,
    centralRay: { x: 0.1, y: 0.1 },
    collimation: { width: 0.9, height: 0.9 },
    sideMarker: null,
    markerPosition: { x: 0.8, y: -0.8 },
    sidCm: 180,
    kvp: 120,
    mas: 3.2,
    exposureMode: "manual",
    aecChambers: [],
    motionInstruction: "remain-still",
  },
};

/** What "registered" means for the fixture: the platform registries plus the fixture's own ids (production data untouched). */
export const syntheticRegistries: ExamRegistries = {
  projection: (id) => id === "synthetic-ap",
  scene: (id) => id === "synthetic-scene",
  bodyPart: (id) => id === "synthetic-limb",
};
