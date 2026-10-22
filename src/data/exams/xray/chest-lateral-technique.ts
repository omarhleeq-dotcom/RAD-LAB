import type { ExamTechniqueProfile } from "@/domain/exam";
import { chestPaTechnique } from "./chest-pa-technique";

/**
 * Technique / exposure PROTOCOL PROFILE of the Chest Lateral erect exam (S12). Built from the Chest PA profile (same
 * generic digital system, reference point, DI bands and kVp bands) with only what differs for a lateral overridden.
 * Nothing here is a medical constant; every group keeps its own evidence class. S10b-9: no numeric mAs target is claimed.
 *
 * kVp wording (S12-1): the optimal band 110–125 kVp is BONTRAGER-9 p.94 (also p.81, 92); the partial-credit bands
 * 100–109 and 126–150 kVp are an ENGINE TEACHING CHOICE (owner-approved), NOT Bontrager.
 * TODO(medical-review): educator / medical-physicist review (O5).
 */
export const chestLateralTechnique: ExamTechniqueProfile = {
  ...chestPaTechnique,
  id: "demo-adult-lateral-reference-dr",
  label: {
    en: "Teaching protocol — average adult lateral, generic DR system",
    ar: "بروتوكول تعليمي — صورة جانبية لبالغ متوسط، نظام DR عام",
  },
  evidence: {
    status: "provisional",
    reference: "S10b-1, S10b-2, S10b-9; BONTRAGER-9 p.94",
    note: "A demo protocol, not a clinical technique chart. No numeric mAs target is claimed (S10b-9).",
  },
  kvp: {
    ...chestPaTechnique.kvp,
    evidence: {
      referenceRange: {
        status: "provisional",
        reference: "S12-1; S10b-1",
        note: "100–150 kV: engine teaching range for partial credit (the 100–109 and 126–150 kV bands are an engine teaching choice, NOT Bontrager).",
      },
      targetBand: {
        status: "common-reference",
        reference: "BONTRAGER-9 p.81, 92, 94",
        note: "110–125 kV is the optimal chest band in the governing textbook (S10b-25). Still pending educator / physicist review (O5).",
      },
    },
  },
  aec: {
    ...chestPaTechnique.aec,
    // S10b-2: the lateral uses the CENTRAL chamber (EC16260 p.21; Bontrager is silent on AEC). The other two fields lie
    // over the dense anterior chest wall / sternum and the spine and posterior ribs, so in this model they run long.
    chambers: [
      { id: "left", label: { en: "Anterior field (viewer's left)", ar: "الحقل الأمامي (يسار المشاهد)" }, region: { x1: -0.62, y1: -0.5, x2: -0.2, y2: -0.05 }, anatomy: "mediastinum" },
      { id: "center", label: { en: "Central field", ar: "الحقل المركزي" }, region: { x1: -0.11, y1: -0.5, x2: 0.11, y2: 0 }, anatomy: "lung" },
      { id: "right", label: { en: "Posterior field (viewer's right)", ar: "الحقل الخلفي (يمين المشاهد)" }, region: { x1: 0.2, y1: -0.5, x2: 0.62, y2: -0.05 }, anatomy: "mediastinum" },
    ],
    evidence: {
      status: "vendor-protocol-dependent",
      reference: "Technique ref §4; EC16260 p.21; S10b-2",
      note: "VALIDATED: the purpose of AEC. The central-chamber choice follows the EC16260 example (Bontrager is silent); chamber layout, anatomy under each chamber and the factors are VENDOR / LOCAL-PROTOCOL DEPENDENT and an educational diagram.",
    },
  },
};
