import type { AnyExamTechniqueProfile } from "@/domain/exam";
import { chestPaTechnique } from "./chest-pa-technique";
const { aec: omitted, ...base } = chestPaTechnique;
void omitted;
const KEEP = ["di-equation", "brightness", "mas-physics", "kvp-physics", "kvp-exponent", "inverse-square", "di-bands", "eit", "patient-habitus"];
/** Same manual educational model used by earlier limbs; no clinical mAs recommendation. */
export const pelvisTechnique: AnyExamTechniqueProfile = {
  ...base,
  id: "demo-pelvis-ap-manual",
  label: { en: "Demo pelvis AP protocol — manual DR with grid (provisional)", ar: "بروتوكول حوض AP تجريبي — DR يدوي مع شبكة (مؤقت)" },
  evidence: { status: "provisional", reference: "BONTRAGER-9 p.279; docs/DECISIONS.md S-PELVIS-1-3", note: "The kV band and SID minimum are source-backed. All model anchors and partial bands are engine teaching choices, not a clinical protocol." },
  system: { ...base.system, label: { en: "Generic digital detector with grid", ar: "كاشف رقمي عام مع شبكة" }, evidence: { status: "vendor-protocol-dependent", reference: "BONTRAGER-9 p.279 (grid); docs/DECISIONS.md S-PELVIS-1-3", note: "Grid specified by the book; detector response 1 is an assumed educational anchor, not a calibrated device." } },
  manual: { reference: { kvp: 85, mas: 2.5, sidCm: 102 }, kvpExponent: 3, evidence: { status: "educational-simplification", reference: "docs/DECISIONS.md S-PELVIS-1-3", note: "85 kV, 2.5 mAs at 102 cm is a model anchor, NOT a recommended clinical exposure. No universal EI/EIT/DI threshold is claimed." } },
  kvp: { referenceRange: [75, 95], targetBand: [80, 90], evidence: {
    referenceRange: { status: "educational-simplification", reference: "docs/DECISIONS.md S-PELVIS-1-3", note: "75–95 kV partial-credit band is an engine teaching choice." },
    targetBand: { status: "common-reference", reference: "BONTRAGER-9 p.279", note: "Digital 85 ± 5 kV, pending educator review O5." },
  } },
  assumptions: [
    ...base.assumptions.filter(a => KEEP.includes(a.id)),
    { id: "pelvis-reference", label: { en: "Pelvis teaching model", ar: "نموذج الحوض التعليمي" }, value: { en: "Bontrager p.279: 80–90 kV, SID at least 102 cm, grid. Manual-only mode, partial bands, 85 kV / 2.5 mAs / 102 cm model anchor, attenuation and tolerances are engine teaching choices, not a clinical technique chart.", ar: "Bontrager ص.279: ‏80–90 kV وSID لا يقل عن 102 سم، مع شبكة. الوضع اليدوي والنطاقات الجزئية ونقطة النموذج 85 kV و2.5 mAs عند 102 سم والتوهين والتسامحات اختيارات تعليمية في المحاكي وليست جدول تعريض سريريًا." }, evidence: { status: "educational-simplification", reference: "docs/DECISIONS.md S-PELVIS-1-3; BONTRAGER-9 p.279" } },
  ],
};
