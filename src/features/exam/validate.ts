/**
 * Structural validation of exam and case definitions (pure; no medical judgement).
 *
 * It checks what a mistake in DATA would otherwise turn into a runtime or scoring bug: weights that do not sum to
 * 100, a rule pointing at a control or option that does not exist, an initial state outside the console range, a
 * cooperation profile that does not answer one of the instructions the learner can choose, missing EN / AR text.
 * It never decides whether a clinical value is right — that is the evidence classes and the review checklist.
 * Used by the data tests, and by any future authoring / import path before a definition reaches a learner.
 */
import type { CheckRule } from "@/domain/case";
import { RENDERER_IDS, SCENE_IDS, type CaseDefinition, type ExamDefinition } from "@/domain/exam";
import type { LocalizedText } from "@/domain/localized";
import { EVIDENCE_CLASSES, type Evidence } from "@/domain/technique";
import type { NumericSettingKey } from "@/domain/simulation";

const NUMERIC_KEYS: NumericSettingKey[] = ["rotationDeg", "sidCm", "kvp", "mas"];

const filled = (t: LocalizedText | undefined) => !!t && t.en.trim().length > 0 && t.ar.trim().length > 0;
/** Every medical rule / value must name one of the five evidence classes and a reference (or "none"). */
const isEvidence = (e: Evidence | undefined) => !!e && (EVIDENCE_CLASSES as readonly string[]).includes(e.status) && e.reference.length > 0;

function ruleTexts(r: CheckRule): [string, LocalizedText | undefined][] {
  const fb = r.feedback as unknown as Record<string, LocalizedText | undefined>;
  const base: [string, LocalizedText | undefined][] = [[`${r.id}.label`, r.label], [`${r.id}.feedback.pass`, fb.pass], [`${r.id}.feedback.fail`, fb.fail]];
  for (const k of ["low", "high", "overlap", "outsideField", "wrongSide"]) if (k in fb) base.push([`${r.id}.feedback.${k}`, fb[k]]);
  return base;
}

export function validateExam(exam: ExamDefinition): string[] {
  const p: string[] = [];
  const need = (ok: boolean, msg: string) => ok || p.push(msg);

  need(exam.schemaVersion === 1, "schemaVersion must be 1");
  need(exam.id.length > 0 && !exam.id.includes("/"), "id must be non-empty and contain no '/'");
  need(filled(exam.title), "title needs EN and AR");
  need(isEvidence(exam.evidence), "exam-level evidence needs a class and a reference");
  need((SCENE_IDS as readonly string[]).includes(exam.scene.id), `unknown scene "${exam.scene.id}"`);
  need((RENDERER_IDS as readonly string[]).includes(exam.render.renderer), `unknown renderer "${exam.render.renderer}"`);
  need(exam.availableProjections.includes(exam.requiredProjection), "requiredProjection must be one of availableProjections");

  // detector / region / controls
  const { widthCm: W, heightCm: H } = exam.detector;
  const r = exam.requiredAnatomy;
  need(W > 0 && H > 0, "detector size must be positive");
  need(r.xCm >= 0 && r.yCm >= 0 && r.xCm + r.widthCm <= W && r.yCm + r.heightCm <= H, "requiredAnatomy must lie inside the detector");
  for (const k of NUMERIC_KEYS) {
    const c = exam.controls[k];
    need(!!c && c.min < c.max && c.step > 0, `control ${k}: min < max and step > 0`);
    if (c?.stations) {
      need(c.stations.every((s, i) => s >= c.min && s <= c.max && (i === 0 || s > c.stations![i - 1]!)), `control ${k}: stations ascending inside [min, max]`);
    }
  }

  // rules
  const ids = exam.rules.map((x) => x.id);
  need(new Set(ids).size === ids.length, "rule ids must be unique");
  const weights = exam.scoring.categoryWeights;
  for (const rule of exam.rules) {
    need(weights[rule.category] !== undefined && weights[rule.category] > 0, `rule ${rule.id}: category "${rule.category}" has no positive weight`);
    need(isEvidence(rule.evidence), `rule ${rule.id}: evidence needs a class and a reference`);
    for (const [where, t] of ruleTexts(rule)) need(filled(t), `${where}: needs EN and AR text`);
    if (rule.kind === "equals") {
      const options: Record<string, readonly string[] | undefined> = {
        projection: exam.availableProjections,
        breathing: exam.availableBreathing,
        motionInstruction: exam.availableMotionInstructions,
      };
      const list = options[rule.setting];
      if (list) need(list.includes(rule.expected), `rule ${rule.id}: expected "${rule.expected}" is not an available ${rule.setting}`);
    }
    if (rule.kind === "range") {
      need(NUMERIC_KEYS.includes(rule.setting), `rule ${rule.id}: "${rule.setting}" is not a numeric control`);
      need(rule.acceptable[0] <= rule.ideal[0] && rule.ideal[1] <= rule.acceptable[1] && rule.ideal[0] <= rule.ideal[1], `rule ${rule.id}: ideal band must lie inside the acceptable band`);
    }
  }

  // scoring
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  need(sum === 100, `category weights sum to ${sum}, not 100`);
  need(exam.scoring.passThreshold > 0 && exam.scoring.passThreshold <= 100, "passThreshold must be in (0, 100]");
  const cf = exam.scoring.criticalFindings.map((x) => x.id);
  need(new Set(cf).size === cf.length, "critical finding ids must be unique");
  for (const f of exam.scoring.criticalFindings) {
    need(filled(f.label) && filled(f.reason), `critical finding ${f.id}: label and reason need EN and AR`);
    need(isEvidence(f.concept) && isEvidence(f.evidence), `critical finding ${f.id}: concept and evidence need a class and a reference`);
  }

  // positioning conventions
  need(exam.positioning.markerSide.L !== undefined && exam.positioning.markerSide.R !== undefined, "markerSide must define L and R");
  need(exam.positioning.markerSide.L !== exam.positioning.markerSide.R, "markerSide: L and R must be on opposite halves");
  need(exam.positioning.minCollimation > 0 && exam.positioning.minCollimation <= 1, "minCollimation must be in (0, 1]");
  return p;
}

export function validateCase(exam: ExamDefinition, def: CaseDefinition): string[] {
  const p: string[] = [];
  const need = (ok: boolean, msg: string) => ok || p.push(msg);
  const s = def.initialSettings;

  need(def.schemaVersion === 1, "schemaVersion must be 1");
  need(def.examId === exam.id, `examId "${def.examId}" is not "${exam.id}"`);
  need(def.id.length > 0 && !def.id.includes("/"), "id must be non-empty and contain no '/'");
  for (const [k, t] of Object.entries({ description: def.patient.description, clinicalScenario: def.clinicalScenario, requestedExamination: def.requestedExamination, patientCondition: def.patientCondition })) {
    need(filled(t), `${k}: needs EN and AR text`);
  }
  need(def.patient.age > 0 && (def.patient.sex === "female" || def.patient.sex === "male"), "patient needs a positive age and a sex");
  need(def.patientTechnique.attenuation > 0, "patientTechnique.attenuation must be positive");
  need(isEvidence(def.patientTechnique.evidence) && isEvidence(def.radiograph.evidence) && isEvidence(def.patientCooperation.evidence), "case-level evidence needs a class and a reference");
  need(def.radiograph.registryIds.length > 0, "baseline radiograph must reference its asset-registry entries");

  // initial state must be reachable with this exam's controls
  need(exam.availableProjections.includes(s.projection), `initial projection "${s.projection}" is not available`);
  need(exam.availableBreathing.includes(s.breathing), `initial breathing "${s.breathing}" is not available`);
  need(exam.availableMotionInstructions.includes(s.motionInstruction), `initial motion instruction "${s.motionInstruction}" is not available`);
  for (const k of NUMERIC_KEYS) {
    const c = exam.controls[k];
    need(s[k] >= c.min && s[k] <= c.max, `initial ${k} (${s[k]}) is outside the control range`);
  }

  // the cooperation profile must answer every instruction the learner can give
  for (const b of exam.availableBreathing) need(def.patientCooperation.inspirationResponse[b] !== undefined, `patientCooperation has no response to breathing "${b}"`);
  for (const m of exam.availableMotionInstructions) need(def.patientCooperation.motionResponse[m] !== undefined, `patientCooperation has no response to motion instruction "${m}"`);
  return p;
}
