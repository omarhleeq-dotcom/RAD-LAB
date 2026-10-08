import type { AnyExamTechniqueProfile } from "@/domain/exam";
import type { Evidence } from "@/domain/technique";
import type { LowerLimbKind } from "./lower-limb-geometry";
import { chestPaTechnique } from "./chest-pa-technique";

/**
 * Technique / exposure PROTOCOL PROFILE of the four knee / foot exams (S14.4): MANUAL technique only (no `aec`: Bontrager, as supplied, gives no AEC
 * rule for the lower limb). Same structure as the elbow profile (`elbow-technique.ts`): built from the generic digital system of the Chest PA
 * profile (same Deviation-Index model and bands) with only what differs for a limb overridden. Nothing here is a medical constant.
 *
 * What is Bontrager (BONTRAGER-9 p.224-225 lower-limb common, p.232 / 233 foot, p.246 / 249 knee; digital radiography): the kV full-credit band,
 * 65 ± 5 kV (60-70) for the two foot exams and 75 ± 5 kV (70-80) for the two knee exams; non-grid distal to the knee, a grid for a part > 10 cm (no
 * grid control in v1, O64). What is an ENGINE TEACHING CHOICE (S14.4-3, REVIEW_PACKAGE): the partial bands (55-75 foot, 65-85 knee) and the whole
 * manual reference point (kV, mAs, SID): a model anchor so detector exposure can be computed relative to a target. It makes NO clinical claim, no
 * numeric mAs target is prescribed (S10b-9) and no EI / EIT / DI limit is universal. No supporting source was read for limb technique (O26).
 * TODO(medical-review): educator / physicist review (O5).
 */
const { aec: _aec, ...base } = chestPaTechnique;
void _aec;

/** The assumptions of the chest profile that do not mention the chest, kept verbatim. */
const KEEP = ["di-equation", "brightness", "mas-physics", "kvp-physics", "kvp-exponent", "inverse-square", "di-bands", "eit", "patient-habitus"];

const CFG: Record<LowerLimbKind, { page: string; part: { en: string; ar: string }; kv: [number, number]; partial: [number, number]; centre: number; grid: string }> = {
  "foot-ap": { page: "p.232", part: { en: "AP (DP) foot", ar: "القدم AP (ظهري أخمصي)" }, kv: [60, 70], partial: [55, 75], centre: 65, grid: "non-grid" },
  "foot-oblique": { page: "p.233", part: { en: "AP medial oblique foot", ar: "القدم AP المائل الإنسي" }, kv: [60, 70], partial: [55, 75], centre: 65, grid: "non-grid" },
  // Ankle (S14.5): digital 70 ± 5 kV (analog 60 ± 5), non-grid; the 60–80 kV partial band is an ENGINE TEACHING CHOICE.
  "ankle-ap": { page: "p.239", part: { en: "AP ankle", ar: "الكاحل AP" }, kv: [65, 75], partial: [60, 80], centre: 70, grid: "non-grid" },
  "ankle-lateral": { page: "p.242", part: { en: "lateral ankle", ar: "الكاحل الجانبي" }, kv: [65, 75], partial: [60, 80], centre: 70, grid: "non-grid" },
  "knee-ap": { page: "p.246", part: { en: "AP knee", ar: "الركبة AP" }, kv: [70, 80], partial: [65, 85], centre: 75, grid: "non-grid (average knee; a grid is used above 10 cm)" },
  "knee-lateral": { page: "p.249", part: { en: "lateral knee", ar: "الركبة الجانبية" }, kv: [70, 80], partial: [65, 85], centre: 75, grid: "non-grid (average knee; a grid is used above 10 cm)" },
};

const lowerLimbProfile = (kind: LowerLimbKind): AnyExamTechniqueProfile => {
  const c = CFG[kind];
  const [kvLo, kvHi] = c.kv;
  const [pLo, pHi] = c.partial;
  const bandEvidence: Evidence = {
    status: "common-reference",
    reference: `BONTRAGER-9 ${c.page} (digital ${c.centre} ± 5 kV)`,
    note: `${kvLo}–${kvHi} kV is the digital band of the governing textbook for the ${c.part.en}. Still pending educator / physicist review (O5).`,
  };
  return {
    ...base,
    id: `demo-adult-${kind}-reference-dr`,
    label: {
      en: `Demo protocol — adult ${c.part.en}, generic DR system, manual technique (provisional)`,
      ar: `بروتوكول تجريبي — ${c.part.ar} لدى بالغ، نظام DR عام، تقنية يدوية (مؤقت)`,
    },
    evidence: {
      status: "provisional",
      reference: `BONTRAGER-9 ${c.page}; S14.4-3, S10b-9`,
      note: "A demo protocol, not a clinical technique chart. The kV band is Bontrager; the partial bands and the manual reference point are engine teaching choices. No numeric mAs target is claimed (S10b-9).",
    },
    system: {
      label: { en: `Generic digital detector, ${c.grid.split(" (")[0]} (Bontrager p.224-225)`, ar: "كاشف رقمي عام، بدون شبكة (Bontrager ص.224-225)" },
      relativeResponse: 1,
      grid: "none",
      evidence: {
        status: "vendor-protocol-dependent",
        reference: "BONTRAGER-9 p.224-225 (non-grid distal to the knee; grid above 10 cm); Technique ref §3.3, §12",
        note: "Detector, generator and processing change the technique needed; no universal mAs is derived from any assumption. The grid is not a control in this exam (O64).",
      },
    },
    manual: {
      // A MODEL ANCHOR (DI = 0), never shown as "the correct technique": 2.5 mAs at the SID minimum. ENGINE TEACHING CONSTANT, no clinical claim.
      reference: { kvp: c.centre, mas: 2.5, sidCm: 102 },
      kvpExponent: 3,
      evidence: {
        status: "provisional",
        reference: "S14.4-3; S10b-9; O26",
        note: `Reference point (${c.centre} kV, 2.5 mAs, 102 cm → DI 0) is an ENGINE TEACHING CONSTANT with no clinical claim: Bontrager (as supplied) gives no mAs for the lower limb and no supporting source was read (O26). The kV exponent is a teaching simplification.`,
      },
    },
    kvp: {
      referenceRange: c.partial,
      targetBand: c.kv,
      evidence: {
        referenceRange: {
          status: "provisional",
          reference: "S14.4-3",
          note: `${pLo}–${pHi} kV: ENGINE TEACHING range for partial credit (the bands outside ${kvLo}–${kvHi} kV are NOT Bontrager).`,
        },
        targetBand: bandEvidence,
      },
    },
    assumptions: [
      ...base.assumptions.filter((a) => KEEP.includes(a.id)),
      {
        id: `kvp-band-${kind}`,
        label: { en: `${c.part.en} kVp band ${kvLo}–${kvHi} (digital)`, ar: `نطاق kVp لـ${c.part.ar} ‎${kvLo}–${kvHi}‎ (رقمي)` },
        value: {
          en: `Full credit inside ${kvLo}–${kvHi} kV (Bontrager, digital, ${c.page}); partial credit ${pLo}–${pHi} kV is an engine teaching choice.`,
          ar: `درجة كاملة ضمن ‎${kvLo}–${kvHi}‎ kV (Bontrager، رقمي، ${c.page.replace("p.", "ص.")})؛ والدرجة الجزئية ضمن ‎${pLo}–${pHi}‎ kV اختيار تعليمي في المحاكي.`,
        },
        evidence: bandEvidence,
      },
      {
        id: `reference-point-${kind}`,
        label: { en: `Manual reference point (${c.centre} kVp, 2.5 mAs at 102 cm → DI 0)`, ar: `نقطة المرجع اليدوية (‎${c.centre}‎ kVp و2.5 mAs عند 102 سم → DI 0)` },
        value: {
          en: "A model anchor so exposure can be computed relative to a target; not a recommended technique and not a clinical value.",
          ar: "نقطة ارتكاز للنموذج لحساب التعريض نسبةً إلى هدف؛ وليست تقنية موصى بها ولا قيمة سريرية.",
        },
        evidence: { status: "provisional", reference: "S14.4-3; S10b-9; O26" },
      },
      {
        id: `no-aec-${kind}`,
        label: { en: "Manual technique only (no AEC)", ar: "تقنية يدوية فقط (بدون AEC)" },
        value: {
          en: "Bontrager (as supplied) gives no AEC rule for the lower limb, so this exam offers manual mAs only.",
          ar: "لا يذكر Bontrager (بحسب ما وُصل) قاعدة AEC للطرف السفلي، لذا يقدّم هذا الفحص mAs يدويًا فقط.",
        },
        evidence: { status: "educational-simplification", reference: "S14.4-3; O26" },
      },
    ],
  };
};

export const lowerLimbTechnique: Record<LowerLimbKind, AnyExamTechniqueProfile> = {
  "foot-ap": lowerLimbProfile("foot-ap"),
  "foot-oblique": lowerLimbProfile("foot-oblique"),
  "knee-ap": lowerLimbProfile("knee-ap"),
  "knee-lateral": lowerLimbProfile("knee-lateral"),
  "ankle-ap": lowerLimbProfile("ankle-ap"),
  "ankle-lateral": lowerLimbProfile("ankle-lateral"),
};
