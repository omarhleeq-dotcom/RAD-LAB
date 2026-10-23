import type { AnyExamTechniqueProfile } from "@/domain/exam";
import { chestPaTechnique } from "./chest-pa-technique";
const { aec: omitted, ...base } = chestPaTechnique;
void omitted;
const KEEP = ["di-equation", "brightness", "mas-physics", "kvp-physics", "kvp-exponent", "inverse-square", "di-bands", "eit", "patient-habitus"];
/** Same manual educational model used by the earlier limbs and the pelvis; no clinical mAs recommendation (S-SHOULDER-3-3). */
export const shoulderTechnique: AnyExamTechniqueProfile = {
  ...base,
  id: "demo-shoulder-grashey-manual",
  label: { en: "Teaching shoulder Grashey protocol — manual DR with grid", ar: "بروتوكول كتف غراشي تعليمي — DR يدوي مع شبكة" },
  evidence: { status: "provisional", reference: "BONTRAGER-9 p.196; docs/DECISIONS.md S-SHOULDER-3-3", note: "The digital kV band and the SID minimum are source-backed. Every model anchor and partial band is an engine teaching choice, not a clinical protocol." },
  system: { ...base.system, label: { en: "Generic digital detector with grid", ar: "كاشف رقمي عام مع شبكة" }, evidence: { status: "vendor-protocol-dependent", reference: "BONTRAGER-9 p.196 (grid); docs/DECISIONS.md S-SHOULDER-3-3", note: "Grid specified by the book; detector response 1 is an assumed educational anchor, not a calibrated device." } },
  manual: { reference: { kvp: 80, mas: 2, sidCm: 102 }, kvpExponent: 3, evidence: { status: "educational-simplification", reference: "docs/DECISIONS.md S-SHOULDER-3-3", note: "80 kV, 2 mAs at 102 cm is a model anchor, NOT a recommended clinical exposure. No universal EI/EIT/DI threshold is claimed (O88)." } },
  kvp: { referenceRange: [70, 90], targetBand: [75, 85], evidence: {
    referenceRange: { status: "educational-simplification", reference: "docs/DECISIONS.md S-SHOULDER-3-3", note: "70–90 kV partial-credit band is an engine teaching choice." },
    targetBand: { status: "common-reference", reference: "BONTRAGER-9 p.196", note: "Digital 80 ± 5 kV (75–85), pending educator review O5." },
  } },
  assumptions: [
    ...base.assumptions.filter(a => KEEP.includes(a.id)),
    { id: "shoulder-reference", label: { en: "Shoulder teaching model", ar: "نموذج الكتف التعليمي" }, value: { en: "Bontrager p.196: digital 80 ± 5 kV, SID at least 102 cm, grid. Manual-only mode, the partial bands, the 80 kV / 2 mAs / 102 cm model anchor, attenuation and tolerances are not a clinical technique chart.", ar: "Bontrager ص.196: ‏رقمي 80 ± 5 kV وSID لا يقل عن 102 سم، مع شبكة. الوضع اليدوي والنطاقات الجزئية ونقطة النموذج 80 kV و2 mAs عند 102 سم والتوهين والتسامحات وليست جدول تعريض سريريًا." }, evidence: { status: "educational-simplification", reference: "docs/DECISIONS.md S-SHOULDER-3-3; BONTRAGER-9 p.196" } },
  ],
};
