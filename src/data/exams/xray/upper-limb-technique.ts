import type { AnyExamTechniqueProfile } from "@/domain/exam";
import type { Evidence } from "@/domain/technique";
import { chestPaTechnique } from "./chest-pa-technique";
import type { UpperLimbFamily, UpperLimbKind } from "./upper-limb-common";

/**
 * Technique / exposure PROTOCOL PROFILES of the six upper-limb exams: wrist PA / lateral (S14.1c), hand PA / lateral in extension (S14.2b)
 * and elbow AP extended / lateral flexed 90° (S14.3). One builder (CLN-016 / CLN-017, RAD-068): what differs by exam is in `PER` and
 * `FAMILY`; every sentence is written once. MANUAL technique only (no `aec`: Bontrager, as supplied, gives no AEC rule for these exams;
 * S14.1b made `aec` optional). Built from the generic digital system of the Chest PA profile (same Deviation-Index model and bands) with only
 * what differs for the limb overridden. Nothing here is a medical constant.
 *
 * What is Bontrager (BONTRAGER-9, digital radiography, non-grid): the kV full-credit band, 60 ± 5 kV (55–65) for the wrist / hand PA and
 * 65 ± 5 kV (60–70) for the lateral (p.156 / 158 wrist, p.150 / 153 hand), 70 ± 5 kV (65–75) for both elbow projections (p.166 / 172; analog
 * 65–75 kV AP, 60–70 kV lateral, not used). What is an ENGINE TEACHING CHOICE (S14.1c-6, S14.2-10, S14.3-9, REVIEW_PACKAGE): the partial bands
 * (50–70 kV PA, which covers Bontrager's analog 60–70 for the wrist; 55–75 kV lateral; 60–80 kV elbow) and the whole manual reference point
 * (kV, mAs, SID): a model anchor so detector exposure can be computed relative to a target. It makes NO clinical claim, no numeric mAs target
 * is prescribed (S10b-9) and no EI / EIT / DI limit is universal. No supporting source was read for limb technique (O26).
 * TODO(medical-review): educator / medical-physicist review (O5).
 */
const { aec: _aec, ...base } = chestPaTechnique;
void _aec;

/** The assumptions of the chest profile that do not mention the chest, kept verbatim. */
const KEEP = ["di-equation", "brightness", "mas-physics", "kvp-physics", "kvp-exponent", "inverse-square", "di-bands", "eit", "patient-habitus"];

/** Per-exam facts: the projection code in the profile id, the page, the kV bands and the projection words. */
const PER: Record<UpperLimbKind, { code: string; page: string; kv: [number, number]; partial: [number, number]; centre: number; noteName: string; labelName: string; labelNameAr: string; bandNameAr: string }> = {
  "wrist-pa": { code: "pa", page: "p.156", kv: [55, 65], partial: [50, 70], centre: 60, noteName: "PA", labelName: "PA", labelNameAr: "PA", bandNameAr: "PA" },
  "wrist-lateral": { code: "lateral", page: "p.158", kv: [60, 70], partial: [55, 75], centre: 65, noteName: "lateral", labelName: "lateral", labelNameAr: "جانبي", bandNameAr: "الجانبي" },
  "hand-pa": { code: "pa", page: "p.150", kv: [55, 65], partial: [50, 70], centre: 60, noteName: "PA", labelName: "PA", labelNameAr: "PA", bandNameAr: "PA" },
  "hand-lateral": { code: "lateral", page: "p.153", kv: [60, 70], partial: [55, 75], centre: 65, noteName: "lateral (extension)", labelName: "lateral", labelNameAr: "جانبي", bandNameAr: "الجانبي" },
  "elbow-ap": { code: "ap", page: "p.166", kv: [65, 75], partial: [60, 80], centre: 70, noteName: "AP (extended)", labelName: "AP", labelNameAr: "AP", bandNameAr: "AP" },
  "elbow-lateral": { code: "lateral", page: "p.172", kv: [65, 75], partial: [60, 80], centre: 70, noteName: "lateral (flexed 90°)", labelName: "lateral", labelNameAr: "جانبي", bandNameAr: "الجانبي" },
};

/** Per-family words and decision references. */
const FAMILY: Record<UpperLimbFamily, { en: string; En: string; ar: string; forAr: string; pages: string; pagesAr: string; pagesList: string; bandRef: string; teachingRef: string; protocolRef: string; noAecRef: string }> = {
  wrist: { en: "wrist", En: "Wrist", ar: "رسغ", forAr: "للرسغ", pages: "p.156 / 158", pagesAr: "ص.156 / 158", pagesList: "p.156, 158", bandRef: "S14.1-4", teachingRef: "S14.1c-6", protocolRef: "S14.1-4", noAecRef: "S14.1c-6" },
  hand: { en: "hand", En: "Hand", ar: "يد", forAr: "لليد", pages: "p.150 / 153", pagesAr: "ص.150 / 153", pagesList: "p.150, 153", bandRef: "S14.2a", teachingRef: "S14.2-10", protocolRef: "S14.2-4", noAecRef: "S14.2-4" },
  elbow: { en: "elbow", En: "Elbow", ar: "مرفق", forAr: "للمرفق", pages: "p.166 / 172", pagesAr: "ص.166 / 172", pagesList: "p.166, 172", bandRef: "S14.2b phase 2", teachingRef: "S14.3-9", protocolRef: "S14.3-5", noAecRef: "S14.2-4" },
};

/** The technique profile of one upper-limb exam. */
export const upperLimbTechnique = (k: UpperLimbKind): AnyExamTechniqueProfile => {
  const p = PER[k];
  const f = FAMILY[k.split("-")[0] as UpperLimbFamily];
  const { kv, partial, centre, page } = p;
  const bandEvidence: Evidence = {
    status: "common-reference",
    reference: `BONTRAGER-9 ${page} (digital ${centre} ± 5 kV)`,
    note: `${kv[0]}–${kv[1]} kV is the digital band of the governing textbook for the ${p.noteName} ${f.en} (${f.bandRef}). Still pending educator / physicist review (O5).`,
  };
  return {
    ...base,
    id: `demo-adult-${f.en}-${p.code}-reference-dr`,
    label: {
      en: `Teaching protocol — adult ${f.en} ${p.labelName}, generic DR system, manual technique`,
      ar: `بروتوكول تعليمي — ${f.ar} بالغ ${p.labelNameAr}، نظام DR عام، تقنية يدوية`,
    },
    evidence: {
      status: "provisional",
      reference: `BONTRAGER-9 ${page}; ${f.protocolRef}, ${f.teachingRef}, S10b-9`,
      note: "A demo protocol, not a clinical technique chart. The kV band is Bontrager; the partial bands and the manual reference point are engine teaching choices. No numeric mAs target is claimed (S10b-9).",
    },
    system: {
      label: { en: `Generic digital detector, non-grid (Bontrager ${f.pages})`, ar: `كاشف رقمي عام، بدون شبكة (Bontrager ${f.pagesAr})` },
      relativeResponse: 1,
      grid: "none",
      evidence: {
        status: "vendor-protocol-dependent",
        reference: `BONTRAGER-9 ${f.pagesList} (non-grid); Technique ref §3.3, §12`,
        note: "Detector, generator and processing change the technique needed; no universal mAs is derived from any assumption.",
      },
    },
    manual: {
      // A MODEL ANCHOR (DI = 0), never shown as "the correct technique": 2.5 mAs at the SID minimum. ENGINE TEACHING CONSTANT, no clinical claim.
      reference: { kvp: centre, mas: 2.5, sidCm: 102 },
      kvpExponent: 3,
      evidence: {
        status: "provisional",
        reference: `${f.teachingRef}; S10b-9; O26`,
        note: `Reference point (${centre} kV, 2.5 mAs, 102 cm → DI 0) is an ENGINE TEACHING CONSTANT with no clinical claim: Bontrager (as supplied) gives no mAs for the ${f.en} and no supporting source was read (O26). The kV exponent is a teaching simplification.`,
      },
    },
    kvp: {
      referenceRange: partial,
      targetBand: kv,
      evidence: {
        referenceRange: {
          status: "provisional",
          reference: f.teachingRef,
          note: `${partial[0]}–${partial[1]} kV: ENGINE TEACHING range for partial credit (the bands outside ${kv[0]}–${kv[1]} kV are NOT Bontrager).`,
        },
        targetBand: bandEvidence,
      },
    },
    assumptions: [
      ...base.assumptions.filter((a) => KEEP.includes(a.id)),
      {
        id: `kvp-band-${f.en}`,
        label: { en: `${f.En} ${p.labelName} kVp band ${kv[0]}–${kv[1]} (digital)`, ar: `نطاق kVp ${f.forAr} ${p.bandNameAr} ‎${kv[0]}–${kv[1]}‎ (رقمي)` },
        value: {
          en: `Full credit inside ${kv[0]}–${kv[1]} kV (Bontrager, digital, ${page}); partial credit within ${partial[0]}–${partial[1]} kV.`,
          ar: `درجة كاملة ضمن ‎${kv[0]}–${kv[1]}‎ kV (Bontrager، رقمي، ${page.replace("p.", "ص.")})؛ والدرجة الجزئية ضمن ‎${partial[0]}–${partial[1]}‎ kV.`,
        },
        evidence: bandEvidence,
      },
      {
        id: `reference-point-${f.en}`,
        label: { en: `Manual reference point (${centre} kVp, 2.5 mAs at 102 cm → DI 0)`, ar: `نقطة المرجع اليدوية (‎${centre}‎ kVp و2.5 mAs عند 102 سم → DI 0)` },
        value: {
          en: "A model anchor so exposure can be computed relative to a target; not a recommended technique and not a clinical value.",
          ar: "نقطة ارتكاز للنموذج لحساب التعريض نسبةً إلى هدف؛ وليست تقنية موصى بها ولا قيمة سريرية.",
        },
        evidence: { status: "provisional", reference: `${f.teachingRef}; S10b-9; O26` },
      },
      {
        id: `no-aec-${f.en}`,
        label: { en: "Manual technique only (no AEC)", ar: "تقنية يدوية فقط (بدون AEC)" },
        value: {
          en: `Bontrager (as supplied) gives no AEC rule for the ${f.en}, so this exam offers manual mAs only.`,
          ar: `لا يذكر Bontrager (بحسب ما وُصل) قاعدة AEC ${f.forAr}، لذا يقدّم هذا الفحص mAs يدويًا فقط.`,
        },
        evidence: { status: "educational-simplification", reference: `${f.noAecRef}; O26` },
      },
    ],
  };
};
