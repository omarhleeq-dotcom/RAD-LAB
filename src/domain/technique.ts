/**
 * Technique / exposure vocabulary (Session 3). Pure types, no logic.
 *
 * Source of truth for every medical statement made with these types:
 * docs/RAD-LAB_Medical_Reference_Chest_PA_Technique.md ("the technique reference").
 * Nothing here is a clinical prescription: the model is an EDUCATIONAL, vendor-neutral simplification.
 */
import type { LocalizedText } from "./localized";
import type { ProjectionId } from "./simulation";

/**
 * Evidence classes from the technique reference §2. Every medically meaningful rule/value carries one.
 * The last three must never be presented to a learner as validated clinical truth.
 */
export const EVIDENCE_CLASSES = [
  "validated",
  "common-reference",
  "vendor-protocol-dependent",
  "educational-simplification",
  "provisional",
] as const;
export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];

/** Traceability for a medically meaningful rule or value. */
export interface Evidence {
  status: EvidenceClass;
  /** Section of the technique / positioning reference (or "none" when provisional). */
  reference: string;
  /** What exactly is validated vs simplified/provisional. */
  note?: string;
}

export type ExposureMode = "manual" | "aec";

/**
 * Vendor-neutral AEC sensing fields. Three fields (two lateral, one central) is an EDUCATIONAL layout:
 * real chamber number, shape, position and selection logic are vendor / local-protocol dependent.
 * Left/right follow the detector view (same convention as the positioning workspace); never mirrored by RTL.
 */
export const AEC_CHAMBER_IDS = ["left", "center", "right"] as const;
export type AecChamberId = (typeof AEC_CHAMBER_IDS)[number];

/** What a chamber "sees" in this case's patient layout (educational; see TechniqueProfile.aec). */
export type AecAnatomy = "lung" | "mediastinum" | "outside-patient";

/** A rectangle in detector-normalized coordinates (same convention as `NormPoint` in simulation.ts). */
export interface NormRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface AecChamberSpec {
  id: AecChamberId;
  label: LocalizedText;
  region: NormRect;
  /** Which anatomy the chamber lies under in this case's fixed patient layout. */
  anatomy: AecAnatomy;
}

/** One line of the "model assumptions & evidence" list shown to the learner. */
export interface ProfileAssumption {
  id: string;
  label: LocalizedText;
  /** Human-readable value/description, kept in data so numbers are never hard-coded in UI. */
  value: LocalizedText;
  evidence: Evidence;
}

/**
 * Protocol profile consumed by the technique model. It separates the four things the brief says must
 * not be conflated:
 *  A. technically selectable range  → `RadCase.controls.kvp / mas` (what the console hardware allows)
 *  B. educational protocol target   → `manual.reference`, `kvp.targetBand`, `aec.*`
 *  C. scoring tolerance             → `deviation`, `kvp.referenceRange` (as the partial-credit band)
 *  D. evidence classification       → `evidence` on every group + `assumptions`
 *
 * Future cases supply a different profile (other patient attenuation, detector/grid, AEC layout);
 * the model never reads literals, so no engine change is needed.
 */
export interface TechniqueProfile {
  id: string;
  label: LocalizedText;
  /** Profile-level evidence: a whole profile is a protocol, never a medical constant. */
  evidence: Evidence;

  /** Simulated patient. 1 = reference adult. >1 absorbs more (less receptor exposure at equal technique). */
  patient: {
    attenuation: number;
    /**
     * Optional per-projection attenuation of THIS patient (S11): a lateral path is longer than a frontal one. Missing
     * projection = `attenuation`. Chest PA declares none, so nothing changes. Magnitudes are sourced per exam (S12 / S13).
     */
    attenuationByProjection?: Partial<Record<ProjectionId, number>>;
    label: LocalizedText;
    evidence: Evidence;
  };
  /** Detector / grid assumptions (vendor / local-protocol dependent). */
  system: { label: LocalizedText; relativeResponse: number; grid: "assumed" | "none"; evidence: Evidence };

  /** Manual-technique reference point: the technique that lands exactly on the target exposure (DI = 0). */
  manual: {
    reference: { kvp: number; mas: number; sidCm: number };
    /** Receptor exposure ∝ kVp^n at fixed mAs. Educational monotonic simplification, magnitude not validated. */
    kvpExponent: number;
    evidence: Evidence;
  };

  kvp: {
    /** Common reference range (IAEA example 100–150 kV). Inside it = at least partial credit. */
    referenceRange: [number, number];
    /** Narrower demo-protocol target (full credit). PROVISIONAL / local-protocol dependent. */
    targetBand: [number, number];
    evidence: { referenceRange: Evidence; targetBand: Evidence };
  };

  /** Deviation-Index scoring tolerances (dB-like). Never universal; educational/provisional. */
  deviation: { ideal: [number, number]; acceptable: [number, number]; evidence: Evidence };

  /**
   * AEC layout and factors. Optional (S14.1b): absent = the exam is manual-technique only (the console offers no AEC mode,
   * there is no chamber rule). Chest exams declare it, unchanged; a limb exam's absent AEC makes no clinical claim.
   */
  aec?: {
    chambers: AecChamberSpec[];
    /** A chamber counts as irradiated only if at least this fraction of its area is inside the light field. */
    minChamberCoverage: number;
    /**
     * Receptor exposure in the lung fields relative to target when the AEC terminates on a chamber lying
     * under this anatomy (lung = 1 by definition of the protocol target).
     */
    anatomyRelativeExposure: Record<AecAnatomy, number>;
    /** Relative exposure reached when no irradiated chamber exists and the AEC runs to its backup limit. */
    backupRelativeExposure: number;
    evidence: Evidence;
  };

  assumptions: ProfileAssumption[];
}

// ─────────────────────────── model output ───────────────────────────

/** Where receptor exposure sits relative to the target. Bands are provisional (TechniqueProfile.deviation). */
export type ExposureTendency = "insufficient" | "below-target" | "target-range" | "above-target" | "excessive";
export type NoiseLevel = "reduced" | "target" | "increased" | "marked";
export type PenetrationTendency = "low" | "within-reference-range" | "high";
export type DoseAwareness = "optimized" | "below-target" | "above-target" | "dose-creep-risk";

export interface AecChamberOutcome {
  id: AecChamberId;
  selected: boolean;
  /** Fraction (0–1) of the chamber area inside the collimated field. */
  fieldCoverage: number;
  /** Selected and sufficiently irradiated: contributes to the termination signal. */
  active: boolean;
  anatomy: AecAnatomy;
}

export interface AecOutcome {
  chambers: AecChamberOutcome[];
  /** False when no active chamber exists: the educational AEC runs to its backup limit. */
  terminatedOnChambers: boolean;
  /** Termination-weighted relative exposure of the lung fields (before backup handling). */
  chamberRelativeExposure: number | null;
}

/**
 * Deterministic EDUCATIONAL detector-exposure result. It is NOT a prediction of a real detector's EI
 * and NOT a patient-dose estimate. There is intentionally no brightness field: on DR the displayed
 * brightness is set by image processing and is not an exposure meter (technique reference §5).
 */
export interface DetectorExposureResult {
  mode: ExposureMode;
  /** EI / EIT: receptor exposure relative to the protocol target (1 = on target). */
  exposureRatio: number;
  /** DI = 10·log10(EI/EIT), computed from `exposureRatio`. */
  deviationIndex: number;
  tendency: ExposureTendency;
  quantumNoise: { /** 1/√exposureRatio — relative image noise from photon statistics. */ relative: number; level: NoiseLevel };
  penetration: PenetrationTendency;
  doseAwareness: DoseAwareness;
  /** Manual: the selected mAs. AEC: the mAs the educational AEC model terminated at. */
  deliveredMas: number;
  /** Manual mAs that would hit the target at the current kVp / SID / patient (informational). */
  targetMas: number;
  sid: {
    sidCm: number;
    referenceCm: number;
    /** (referenceCm / sidCm)² — validated physics; how it enters the result is an educational model. */
    inverseSquareFactor: number;
    /** True in AEC mode: the educational AEC re-terminates at the target for any SID. */
    compensatedByAec: boolean;
  };
  aec: AecOutcome | null;
  /** Echo of the profile used, so a result can always be traced to its assumptions. */
  profileId: string;
}
