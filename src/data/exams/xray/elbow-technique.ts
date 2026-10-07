import type { AnyExamTechniqueProfile } from "@/domain/exam";
import type { Evidence } from "@/domain/technique";
import { chestPaTechnique } from "./chest-pa-technique";

/**
 * Technique / exposure PROTOCOL PROFILE of the two elbow exams (S14.3): MANUAL technique only (no `aec`: Bontrager, as supplied, gives
 * no AEC rule for the elbow). Same structure as the wrist profile (`wrist-technique.ts`): built from the generic digital system of the
 * Chest PA profile (same Deviation-Index model and bands) with only what differs for an elbow overridden. Nothing here is a medical constant.
 *
 * What is Bontrager (BONTRAGER-9 p.166 AP elbow extended / p.172 lateromedial elbow flexed 90°, digital radiography, non-grid): the kV full-credit band,
 * 70 ± 5 kV (65–75) for both (analog 65–75 kV AP, 60–70 kV lateral, not used). What is an ENGINE TEACHING CHOICE (S14.3-9, REVIEW_PACKAGE): the
 * partial bands (60–80 kV both) and the whole manual reference point (kV, mAs, SID): a model anchor so detector exposure
 * can be computed relative to a target. It makes NO clinical claim, no numeric mAs target is prescribed (S10b-9) and no EI / EIT / DI
 * limit is universal. No supporting source was read for limb technique (O26). TODO(medical-review): educator / physicist review (O5).
 */
const { aec: _aec, ...base } = chestPaTechnique;
void _aec;

/** The assumptions of the chest profile that do not mention the chest, kept verbatim. */
const KEEP = ["di-equation", "brightness", "mas-physics", "kvp-physics", "kvp-exponent", "inverse-square", "di-bands", "eit", "patient-habitus"];

const elbowProfile = (kind: "ap" | "lateral"): AnyExamTechniqueProfile => {
  const ap = kind === "ap";
  const kv: [number, number] = [65, 75];
  const partial: [number, number] = [60, 80];
  const centre = 70;
  const page = ap ? "p.166" : "p.172";
  const bandEvidence: Evidence = {
    status: "common-reference",
    reference: `BONTRAGER-9 ${page} (digital ${centre} ± 5 kV)`,
    note: `${kv[0]}–${kv[1]} kV is the digital band of the governing textbook for the ${ap ? "AP (extended)" : "lateral (flexed 90°)"} elbow (S14.2b phase 2). Still pending educator / physicist review (O5).`,
  };
  return {
    ...base,
    id: `demo-adult-elbow-${kind}-reference-dr`,
    label: {
      en: `Demo protocol — adult elbow ${ap ? "AP" : "lateral"}, generic DR system, manual technique (provisional)`,
      ar: `بروتوكول تجريبي — مرفق بالغ ${ap ? "AP" : "جانبي"}، نظام DR عام، تقنية يدوية (مؤقت)`,
    },
    evidence: {
      status: "provisional",
      reference: `BONTRAGER-9 ${page}; S14.3-5, S14.3-9, S10b-9`,
      note: "A demo protocol, not a clinical technique chart. The kV band is Bontrager; the partial bands and the manual reference point are engine teaching choices. No numeric mAs target is claimed (S10b-9).",
    },
    system: {
      label: { en: "Generic digital detector, non-grid (Bontrager p.166 / 172)", ar: "كاشف رقمي عام، بدون شبكة (Bontrager ص.166 / 172)" },
      relativeResponse: 1,
      grid: "none",
      evidence: {
        status: "vendor-protocol-dependent",
        reference: "BONTRAGER-9 p.166, 172 (non-grid); Technique ref §3.3, §12",
        note: "Detector, generator and processing change the technique needed; no universal mAs is derived from any assumption.",
      },
    },
    manual: {
      // A MODEL ANCHOR (DI = 0), never shown as "the correct technique": 2.5 mAs at the SID minimum. ENGINE TEACHING CONSTANT, no clinical claim.
      reference: { kvp: centre, mas: 2.5, sidCm: 102 },
      kvpExponent: 3,
      evidence: {
        status: "provisional",
        reference: "S14.3-9; S10b-9; O26",
        note: `Reference point (${centre} kV, 2.5 mAs, 102 cm → DI 0) is an ENGINE TEACHING CONSTANT with no clinical claim: Bontrager (as supplied) gives no mAs for the elbow and no supporting source was read (O26). The kV exponent is a teaching simplification.`,
      },
    },
    kvp: {
      referenceRange: partial,
      targetBand: kv,
      evidence: {
        referenceRange: {
          status: "provisional",
          reference: "S14.3-9",
          note: `${partial[0]}–${partial[1]} kV: ENGINE TEACHING range for partial credit (the bands outside ${kv[0]}–${kv[1]} kV are NOT Bontrager).`,
        },
        targetBand: bandEvidence,
      },
    },
    assumptions: [
      ...base.assumptions.filter((a) => KEEP.includes(a.id)),
      {
        id: "kvp-band-elbow",
        label: { en: `Elbow ${ap ? "AP" : "lateral"} kVp band ${kv[0]}–${kv[1]} (digital)`, ar: `نطاق kVp للمرفق ${ap ? "AP" : "الجانبي"} ‎${kv[0]}–${kv[1]}‎ (رقمي)` },
        value: {
          en: `Full credit inside ${kv[0]}–${kv[1]} kV (Bontrager, digital, ${page}); partial credit ${partial[0]}–${partial[1]} kV is an engine teaching choice.`,
          ar: `درجة كاملة ضمن ‎${kv[0]}–${kv[1]}‎ kV (Bontrager، رقمي، ${page.replace("p.", "ص.")})؛ والدرجة الجزئية ضمن ‎${partial[0]}–${partial[1]}‎ kV اختيار تعليمي في المحاكي.`,
        },
        evidence: bandEvidence,
      },
      {
        id: "reference-point-elbow",
        label: { en: `Manual reference point (${centre} kVp, 2.5 mAs at 102 cm → DI 0)`, ar: `نقطة المرجع اليدوية (‎${centre}‎ kVp و2.5 mAs عند 102 سم → DI 0)` },
        value: {
          en: "A model anchor so exposure can be computed relative to a target; not a recommended technique and not a clinical value.",
          ar: "نقطة ارتكاز للنموذج لحساب التعريض نسبةً إلى هدف؛ وليست تقنية موصى بها ولا قيمة سريرية.",
        },
        evidence: { status: "provisional", reference: "S14.3-9; S10b-9; O26" },
      },
      {
        id: "no-aec-elbow",
        label: { en: "Manual technique only (no AEC)", ar: "تقنية يدوية فقط (بدون AEC)" },
        value: {
          en: "Bontrager (as supplied) gives no AEC rule for the elbow, so this exam offers manual mAs only.",
          ar: "لا يذكر Bontrager (بحسب ما وُصل) قاعدة AEC للمرفق، لذا يقدّم هذا الفحص mAs يدويًا فقط.",
        },
        evidence: { status: "educational-simplification", reference: "S14.2-4; O26" },
      },
    ],
  };
};

export const elbowApTechnique = elbowProfile("ap");
export const elbowLateralTechnique = elbowProfile("lateral");
