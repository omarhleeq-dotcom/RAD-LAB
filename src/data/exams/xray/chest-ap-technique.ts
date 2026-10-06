import type { ExamTechniqueProfile } from "@/domain/exam";
import { chestPaTechnique } from "./chest-pa-technique";

/**
 * Technique / exposure PROTOCOL PROFILE of the Chest AP supine exam (S13). Built from the Chest PA profile (same generic
 * digital system, reference point, DI bands, kVp bands and AEC layout) with only the identity and wording overridden.
 * Nothing here is a medical constant; every group keeps its own evidence class. S10b-9: no numeric mAs target is claimed.
 *
 * kVp wording (S12-1): the optimal band 110–125 kVp is BONTRAGER-9 p.96 (also p.81, 92, 94); the partial-credit bands
 * 100–109 and 126–150 kVp are an ENGINE TEACHING CHOICE (owner-approved), NOT Bontrager. Grid: strongly recommended
 * (BONTRAGER-9 p.96), assumed present like the PA profile. AEC: Bontrager is silent; S10b-2 says a portable AP is a MANUAL
 * exposure recorded per image — the generic console still offers AEC (the exposure mode is not scored), see S13 notes.
 * TODO(medical-review): educator / medical-physicist review (O5).
 */
export const chestApTechnique: ExamTechniqueProfile = {
  ...chestPaTechnique,
  id: "demo-adult-ap-supine-reference-dr",
  label: {
    en: "Demo protocol — average adult AP supine, generic DR system (provisional)",
    ar: "بروتوكول تجريبي — بالغ متوسط AP مستلقيًا، نظام DR عام (مؤقت)",
  },
  evidence: {
    status: "provisional",
    reference: "S10b-1, S10b-2, S10b-9; BONTRAGER-9 p.96",
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
        reference: "BONTRAGER-9 p.81, 92, 94, 96",
        note: "110–125 kV is the optimal chest band in the governing textbook (S10b-25), also for the AP supine / semi-erect chest (p.96). Still pending educator / physicist review (O5).",
      },
    },
  },
  // Same lung-field chamber layout as the PA; only the Arabic terminology differs ("الكاشف", S13 terminology rule).
  aec: {
    ...chestPaTechnique.aec,
    chambers: chestPaTechnique.aec.chambers.map((c) => ({ ...c, label: { ...c.label, ar: c.label.ar.replace("الكاسيت", "الكاشف") } })),
  },
};
