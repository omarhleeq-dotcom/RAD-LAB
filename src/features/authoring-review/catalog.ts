/** Node-only catalog projection for the offline harness/tests. No targets or scoring data enter its output. */
import { CASES } from '@/data/cases';
import { caseVersion, settingsSpec, leafValues } from '../assess/server-validation';
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
