import type { ExamDefinition } from "@/domain/exam";
import type { LocalizedText } from "@/domain/localized";

/**
 * Platform catalogue (Session 9, ADR-0011): modality → exam → mode, all from data.
 *
 * Adding an exam = add it to `EXAMS` (src/data/exams); it appears under the modality whose `examModality` matches.
 * Adding a modality = add an entry here. `planned` entries are listed on the home page as "Coming soon" with NO
 * descriptive or medical text, no numbers and no images; they have no routes (404 until they become `available`).
 * Modality slugs are the first URL segment (`/{locale}/{modality}/…`); exam ids are unique within a modality.
 */
export type ModalityStatus = "available" | "planned";

export interface ModalityEntry {
  /** URL slug, e.g. "xray". */
  id: string;
  /** Name only. Arabic names are provisional UI terms (docs/ARABIC_TERMINOLOGY.md). */
  name: LocalizedText;
  status: ModalityStatus;
  /** Which `ExamDefinition.modality` values belong to it (a planned modality has no exams yet). */
  examModality?: ExamDefinition["modality"];
  /** One neutral line, available modalities only. Not medical content. */
  description?: LocalizedText;
}

export const MODALITIES: readonly ModalityEntry[] = [
  {
    id: "xray",
    name: { en: "X-ray", ar: "الأشعة السينية" },
    status: "available",
    examModality: "general-radiography",
    description: { en: "General radiography exams you can practise.", ar: "فحوص التصوير الشعاعي العام التي يمكنك التدرب عليها." },
  },
  { id: "ct", name: { en: "CT", ar: "التصوير المقطعي المحوسب" }, status: "planned" },
  { id: "mri", name: { en: "MRI", ar: "التصوير بالرنين المغناطيسي" }, status: "planned" },
  { id: "us", name: { en: "Ultrasound", ar: "التصوير بالموجات فوق الصوتية" }, status: "planned" },
];

/**
 * Body-part registry (S14.1b). `BodyPartId` is an open string; an exam names one of these (`validateExam` rejects an
 * unregistered id). A new body part is one entry here, added in the session that adds its first exam.
 */
export const BODY_PART_IDS: readonly string[] = ["chest", "wrist", "hand", "elbow", "foot"];
export const isRegisteredBodyPart = (id: string): boolean => BODY_PART_IDS.includes(id);

export type ModeId = "practice";

export interface ModeEntry {
  id: ModeId;
  name: LocalizedText;
  status: "available";
}

/** D1: one mode only (Practice). More modes (ADR-0003) are added here, never by editing page JSX. */
export const MODES: readonly ModeEntry[] = [{ id: "practice", name: { en: "Practice", ar: "التدريب" }, status: "available" }];
