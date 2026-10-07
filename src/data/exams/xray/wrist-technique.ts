import type { AnyExamTechniqueProfile } from "@/domain/exam";
import type { Evidence } from "@/domain/technique";
import { chestPaTechnique } from "./chest-pa-technique";

/**
 * Technique / exposure PROTOCOL PROFILE of the two wrist exams (S14.1c): MANUAL technique only (no `aec`: Bontrager, as supplied,
 * gives no AEC rule for the wrist; S14.1b made `aec` optional). Built from the generic digital system of the Chest PA profile
 * (same Deviation-Index model and bands) with only what differs for a wrist overridden. Nothing here is a medical constant.
 *
 * What is Bontrager (BONTRAGER-9 p.156 PA / p.158 lateral, digital radiography, non-grid): the kV full-credit band, 60 ± 5 kV (55–65)
 * for the PA and 65 ± 5 kV (60–70) for the lateral. What is an ENGINE TEACHING CHOICE (S14.1c-6, REVIEW_PACKAGE): the partial bands
 * (50–70 kV PA, which covers Bontrager's analog 60–70; 55–75 kV lateral), and the whole manual reference point (kV, mAs, SID): a model
 * anchor so detector exposure can be computed relative to a target. It makes NO clinical claim, no numeric mAs target is prescribed
 * (S10b-9) and no EI / EIT / DI limit is universal. No supporting source was read for limb technique (O26).
 * TODO(medical-review): educator / medical-physicist review (O5).
 */
const { aec: _aec, ...base } = chestPaTechnique;
void _aec;

/** The assumptions of the chest profile that do not mention the chest, kept verbatim. */
const KEEP = ["di-equation", "brightness", "mas-physics", "kvp-physics", "kvp-exponent", "inverse-square", "di-bands", "eit", "patient-habitus"];

const wristProfile = (kind: "pa" | "lateral"): AnyExamTechniqueProfile => {
  const pa = kind === "pa";
  const kv: [number, number] = pa ? [55, 65] : [60, 70];
  const partial: [number, number] = pa ? [50, 70] : [55, 75];
  const centre = pa ? 60 : 65;
  const page = pa ? "p.156" : "p.158";
  const bandEvidence: Evidence = {
    status: "common-reference",
    reference: `BONTRAGER-9 ${page} (digital ${centre} ± 5 kV)`,
    note: `${kv[0]}–${kv[1]} kV is the digital band of the governing textbook for the ${pa ? "PA" : "lateral"} wrist (S14.1-4). Still pending educator / physicist review (O5).`,
  };
  return {
    ...base,
    id: `demo-adult-wrist-${kind}-reference-dr`,
    label: {
      en: `Demo protocol — adult wrist ${pa ? "PA" : "lateral"}, generic DR system, manual technique (provisional)`,
      ar: `بروتوكول تجريبي — رسغ بالغ ${pa ? "PA" : "جانبي"}، نظام DR عام، تقنية يدوية (مؤقت)`,
    },
    evidence: {
      status: "provisional",
      reference: `BONTRAGER-9 ${page}; S14.1-4, S14.1c-6, S10b-9`,
      note: "A demo protocol, not a clinical technique chart. The kV band is Bontrager; the partial bands and the manual reference point are engine teaching choices. No numeric mAs target is claimed (S10b-9).",
    },
    system: {
      label: { en: "Generic digital detector, non-grid (Bontrager p.156 / 158)", ar: "كاشف رقمي عام، بدون شبكة (Bontrager ص.156 / 158)" },
      relativeResponse: 1,
      grid: "none",
      evidence: {
        status: "vendor-protocol-dependent",
        reference: "BONTRAGER-9 p.156, 158 (non-grid); Technique ref §3.3, §12",
        note: "Detector, generator and processing change the technique needed; no universal mAs is derived from any assumption.",
      },
    },
    manual: {
      // A MODEL ANCHOR (DI = 0), never shown as "the correct technique": 2.5 mAs at the SID minimum. ENGINE TEACHING CONSTANT, no clinical claim.
      reference: { kvp: centre, mas: 2.5, sidCm: 102 },
      kvpExponent: 3,
      evidence: {
        status: "provisional",
        reference: "S14.1c-6; S10b-9; O26",
        note: `Reference point (${centre} kV, 2.5 mAs, 102 cm → DI 0) is an ENGINE TEACHING CONSTANT with no clinical claim: Bontrager (as supplied) gives no mAs for the wrist and no supporting source was read (O26). The kV exponent is a teaching simplification.`,
      },
    },
    kvp: {
      referenceRange: partial,
      targetBand: kv,
      evidence: {
        referenceRange: {
          status: "provisional",
          reference: "S14.1c-6",
          note: `${partial[0]}–${partial[1]} kV: ENGINE TEACHING range for partial credit (the bands outside ${kv[0]}–${kv[1]} kV are NOT Bontrager).`,
        },
        targetBand: bandEvidence,
      },
    },
    assumptions: [
      ...base.assumptions.filter((a) => KEEP.includes(a.id)),
      {
        id: "kvp-band-wrist",
        label: { en: `Wrist ${pa ? "PA" : "lateral"} kVp band ${kv[0]}–${kv[1]} (digital)`, ar: `نطاق kVp للرسغ ${pa ? "PA" : "الجانبي"} ‎${kv[0]}–${kv[1]}‎ (رقمي)` },
        value: {
          en: `Full credit inside ${kv[0]}–${kv[1]} kV (Bontrager, digital, ${page}); partial credit ${partial[0]}–${partial[1]} kV is an engine teaching choice.`,
          ar: `درجة كاملة ضمن ‎${kv[0]}–${kv[1]}‎ kV (Bontrager، رقمي، ${page.replace("p.", "ص.")})؛ والدرجة الجزئية ضمن ‎${partial[0]}–${partial[1]}‎ kV اختيار تعليمي في المحاكي.`,
        },
        evidence: bandEvidence,
      },
      {
        id: "reference-point-wrist",
        label: { en: `Manual reference point (${centre} kVp, 2.5 mAs at 102 cm → DI 0)`, ar: `نقطة المرجع اليدوية (‎${centre}‎ kVp و2.5 mAs عند 102 سم → DI 0)` },
        value: {
          en: "A model anchor so exposure can be computed relative to a target; not a recommended technique and not a clinical value.",
          ar: "نقطة ارتكاز للنموذج لحساب التعريض نسبةً إلى هدف؛ وليست تقنية موصى بها ولا قيمة سريرية.",
        },
        evidence: { status: "provisional", reference: "S14.1c-6; S10b-9; O26" },
      },
      {
        id: "no-aec-wrist",
        label: { en: "Manual technique only (no AEC)", ar: "تقنية يدوية فقط (بدون AEC)" },
        value: {
          en: "Bontrager (as supplied) gives no AEC rule for the wrist, so this exam offers manual mAs only.",
          ar: "لا يذكر Bontrager (بحسب ما وُصل) قاعدة AEC للرسغ، لذا يقدّم هذا الفحص mAs يدويًا فقط.",
        },
        evidence: { status: "educational-simplification", reference: "S14.1c-6; O26" },
      },
    ],
  };
};

export const wristPaTechnique = wristProfile("pa");
export const wristLateralTechnique = wristProfile("lateral");
