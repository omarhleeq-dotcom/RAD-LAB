import { publicCaseId } from '../exam/compose';
import { getExam } from '@/data/exams';
import { PRACTICAL_SCENES, practicalLabel, type PracticalView } from '../assess/practical-presentation';
/** Node-only catalog projection for the offline harness/tests. No targets or scoring data enter its output. */
import { CASES, CASE_DEFINITIONS } from '@/data/cases';
import { caseVersion, settingsSpec, leafValues, resolveCase, ASSESS_EVALUATOR, validateValues } from '../assess/server-validation';
import { assertReusablePart, ruleParts } from '../assess/rule-parts';
import { controlLabel } from '../assess/presentation';
import type { PartReference } from './contracts';
export function localPartCatalog(): PartReference[] {
 return CASES.flatMap(c => c.rules.flatMap(rule => ruleParts(rule).flatMap(part => {
  // This review supports existing independent numeric controls only. No inferred background, marker or conditional rubric.
  if (!['range', 'equals'].includes(rule.kind) || part.inputs.length !== 1 || part.adapter !== 'existing-check-credit') return [];
  assertReusablePart(part);
  const path = part.inputs[0]!, spec = settingsSpec(c)[path], label = controlLabel(path);
  if (!spec || spec.kind !== 'number' || !label) return [];
  const controls = { [path]: spec };
  return [{ id: `${c.id}:${rule.id}:${part.part}`, label: `${c.id} · ${label}`, caseRef: { id: c.id, version: caseVersion(c) }, ruleId: rule.id, part: part.part,
   view: { controls, initial: leafValues(c.initialSettings, controls), sceneValues: {} } }];
 })));
}

/** Same public drawing shape as server-practical, without manufacturing ContentReview/publication. */
export function localPracticalCatalog(): import('./contracts').PracticalReference[] {
 return CASE_DEFINITIONS.map(def => {
  const exam = getExam(def.examId)!;
  const id = publicCaseId(exam, def);
  const c = resolveCase({ id, version: caseVersion(CASES.find(c => c.id === id)!) }, ASSESS_EVALUATOR);
  if (!PRACTICAL_SCENES.includes(exam.scene.id as PracticalView['scene']['id'])) throw Error('Unsupported practical scene');
  const controls = settingsSpec(c), initial = leafValues(c.initialSettings, controls);
  if (Object.keys(controls).some(p => !practicalLabel(p))) throw Error('Unsupported practical control');
  validateValues(controls, initial);
  const labels = Object.fromEntries(Object.keys(controls).map(p => [p, practicalLabel(p)!]));
  for (const choice of c.choiceControls ?? []) labels[`choices.${choice.id}`] = choice.label.en;
  const view: PracticalView = { schemaVersion: 1, controls, initial, sceneValues: {}, labels,
   increments: Object.fromEntries(Object.entries(c.controls).map(([p, v]) => [p, { step: v!.step, ...(v!.stations ? { stations: [...v!.stations] } : {}) }])),
   scene: { id: exam.scene.id as PracticalView['scene']['id'], detector: { ...c.detector }, anatomyFrame: { ...c.requiredAnatomy }, markerSizeCm: c.positioning.markerSizeCm } };
  return { id, examId: exam.id, label: `${exam.title.en} · ${def.id}`, caseRef: { id: c.id, version: caseVersion(c) }, evaluatorVersion: ASSESS_EVALUATOR, view };
 });
}
