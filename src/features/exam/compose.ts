/**
 * `composeCase(exam, case)` → the `RadCase` compatibility view (Session 7 strangler step, ADR-0004).
 *
 * Pure and deterministic. The result carries exactly the fields the former single `RadCase` object had, with the
 * same values, so the engine, renderer, store and UI keep working unchanged; consumers migrate to the two
 * definitions one at a time and this view is deleted last.
 *
 * Public id rule: the exam's DEFAULT case keeps the exam id as its id (`chest-pa-erect`), so existing routes
 * (`/simulation/chest-pa-erect`), shared links and the render noise seed (derived from the id) are unchanged.
 * Any other case of the exam is `<exam id>/<case id>`.
 */
import type { RadCase } from "@/domain/case";
import type { CaseDefinition, ExamDefinition } from "@/domain/exam";

const cache = new WeakMap<CaseDefinition, { exam: ExamDefinition; composed: RadCase }>();

export function publicCaseId(exam: ExamDefinition, def: CaseDefinition): string {
  return def.id === exam.defaultCaseId ? exam.id : `${exam.id}/${def.id}`;
}

export function composeCase(exam: ExamDefinition, def: CaseDefinition): RadCase {
  if (def.examId !== exam.id) throw new Error(`case "${def.id}" belongs to exam "${def.examId}", not "${exam.id}"`);
  const hit = cache.get(def);
  if (hit && hit.exam === exam) return hit.composed;
  const composed: RadCase = {
    id: publicCaseId(exam, def),
    modality: exam.modality,
    bodyPart: exam.bodyPart,
    title: exam.title,
    provisional: exam.provisional || def.provisional,

    // case: the patient scenario
    patient: def.patient,
    clinicalScenario: def.clinicalScenario,
    requestedExamination: def.requestedExamination,
    patientCondition: def.patientCondition,
    patientCooperation: def.patientCooperation,
    radiograph: def.radiograph,
    initialSettings: def.initialSettings,

    // exam: what the exam is
    requiredProjection: exam.requiredProjection,
    detector: exam.detector,
    requiredAnatomy: exam.requiredAnatomy,
    controls: exam.controls,
    // the protocol is the exam's; how strongly this patient attenuates is the case's
    technique: { ...exam.technique, patient: def.patientTechnique },
    positioning: exam.positioning,
    availableProjections: exam.availableProjections,
    availableBreathing: exam.availableBreathing,
    availableMotionInstructions: exam.availableMotionInstructions,
    rules: exam.rules,
    scoring: exam.scoring,
    possibleErrors: exam.possibleErrors,
    imageCriteria: exam.imageCriteria,
  };
  cache.set(def, { exam, composed });
  return composed;
}
