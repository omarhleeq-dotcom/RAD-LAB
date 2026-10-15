/**
 * Structural validation of exam and case definitions (pure; no medical judgement).
 *
 * It checks what a mistake in DATA would otherwise turn into a runtime or scoring bug: weights that do not sum to
 * 100, a rule pointing at a control or option that does not exist, an initial state outside the console range, a
 * cooperation profile that does not answer one of the instructions the learner can choose, missing EN / AR text.
 * It never decides whether a clinical value is right — that is the evidence classes and the review checklist.
 * Used by the data tests, and by any future authoring / import path before a definition reaches a learner.
 */
import { isRegisteredBodyPart } from "@/data/modalities";
import { isRegisteredProjection } from "@/data/projections";
import type { CheckRule } from "@/domain/case";
import { RENDERER_IDS, SCENE_IDS, type AnyExamDefinition, type CaseDefinition } from "@/domain/exam";
import type { LocalizedText } from "@/domain/localized";
import { EVIDENCE_CLASSES, type Evidence } from "@/domain/technique";
import { CATEGORIES, type NumericSettingKey, type RequiredNumericSettingKey } from "@/domain/simulation";
import { CRITICAL_DETECTORS } from "@/features/evaluation/critical";

const NUMERIC_KEYS: RequiredNumericSettingKey[] = ["rotationDeg", "sidCm", "kvp", "mas"];
/** Numeric settings a range rule may target: the four required ones, plus tube angulation when the exam declares it. */
const RULE_NUMERIC_KEYS: NumericSettingKey[] = [...NUMERIC_KEYS, "tubeAngulationDeg"];

const filled = (t: LocalizedText | undefined) => !!t && t.en.trim().length > 0 && t.ar.trim().length > 0;
/** Every medical rule / value must name one of the five evidence classes and a reference (or "none"). */
const isEvidence = (e: Evidence | undefined) => !!e && (EVIDENCE_CLASSES as readonly string[]).includes(e.status) && e.reference.length > 0;

function ruleTexts(r: CheckRule): [string, LocalizedText | undefined][] {
  const fb = r.feedback as unknown as Record<string, LocalizedText | undefined>;
  const base: [string, LocalizedText | undefined][] = [[`${r.id}.label`, r.label], [`${r.id}.feedback.pass`, fb.pass], [`${r.id}.feedback.fail`, fb.fail]];
  for (const k of ["low", "high", "overlap", "outsideField", "wrongSide"]) if (k in fb) base.push([`${r.id}.feedback.${k}`, fb[k]]);
  return base;
}

/**
 * What counts as "registered" (S14.1b). Defaults to the platform registries; a test passes its own to validate a
 * synthetic exam without adding anything to production data.
 */
export interface ExamRegistries {
  projection: (id: string) => boolean;
  scene: (id: string) => boolean;
  bodyPart: (id: string) => boolean;
}
export const PLATFORM_REGISTRIES: ExamRegistries = {
  projection: isRegisteredProjection,
  scene: (id) => (SCENE_IDS as readonly string[]).includes(id),
  bodyPart: isRegisteredBodyPart,
};

export function validateExam(exam: AnyExamDefinition, registered: ExamRegistries = PLATFORM_REGISTRIES): string[] {
  const p: string[] = [];
  const need = (ok: boolean, msg: string) => ok || p.push(msg);

  need(exam.schemaVersion === 1, "schemaVersion must be 1");
  need(exam.id.length > 0 && !exam.id.includes("/"), "id must be non-empty and contain no '/'");
  need(filled(exam.title), "title needs EN and AR");
  need(isEvidence(exam.evidence), "exam-level evidence needs a class and a reference");
  need(registered.scene(exam.scene.id), `unknown scene "${exam.scene.id}" (register it in SCENE_IDS and SCENES)`);
  need(registered.bodyPart(exam.bodyPart), `unknown bodyPart "${exam.bodyPart}" (register it in src/data/modalities.ts)`);
  need((RENDERER_IDS as readonly string[]).includes(exam.render.renderer), `unknown renderer "${exam.render.renderer}"`);
  need(exam.availableProjections.includes(exam.requiredProjection), "requiredProjection must be one of availableProjections");
  // ProjectionId is open (S14-0): every projection an exam names must be registered in `src/data/projections.ts`.
  for (const id of exam.availableProjections) need(registered.projection(id), `unknown projection "${id}" (register it in src/data/projections.ts)`);

  // detector / region / controls
  const { widthCm: W, heightCm: H } = exam.detector;
  const r = exam.requiredAnatomy;
  need(W > 0 && H > 0, "detector size must be positive");
  need(r.xCm >= 0 && r.yCm >= 0 && r.xCm + r.widthCm <= W && r.yCm + r.heightCm <= H, "requiredAnatomy must lie inside the detector");
  for (const z of exam.positioning.markerKeepOut ?? []) need(z.xCm >= 0 && z.yCm >= 0 && z.xCm + z.widthCm <= W && z.yCm + z.heightCm <= H, "markerKeepOut zones must lie inside the detector");
  // The four required controls, then any optional numeric control the exam declares (tube angulation, S11-2).
  for (const k of RULE_NUMERIC_KEYS) {
    const c = exam.controls[k];
    if (!c && k === "tubeAngulationDeg") continue;
    need(!!c && c.min < c.max && c.step > 0, `control ${k}: min < max and step > 0`);
    const st = c?.stations;
    if (c && st) need(st.every((s, i) => s >= c.min && s <= c.max && (i === 0 || s > st[i - 1]!)), `control ${k}: stations ascending inside [min, max]`);
  }

  // extra enum controls (S11): the setting key is `choices.<id>`
  const choices = exam.choiceControls ?? [];
  need(new Set(choices.map((x) => x.id)).size === choices.length, "choice control ids must be unique");
  for (const cc of choices) {
    need(cc.id.length > 0 && !cc.id.includes("."), `choice control "${cc.id}": id must be non-empty and contain no '.'`);
    need(filled(cc.label) && (!cc.hint || filled(cc.hint)), `choice control ${cc.id}: label (and hint) need EN and AR text`);
    need(cc.options.length >= 2 && new Set(cc.options.map((o) => o.id)).size === cc.options.length, `choice control ${cc.id}: needs at least two options with unique ids`);
    for (const o of cc.options) need(filled(o.label), `choice control ${cc.id}.${o.id}: label needs EN and AR text`);
    if (cc.projectionLabels) {
      const { projection, byOption } = cc.projectionLabels;
      need(exam.availableProjections.includes(projection), `choice control ${cc.id}: projectionLabels.projection "${projection}" is not an available projection`);
      for (const o of cc.options) need(filled(byOption[o.id]), `choice control ${cc.id}: projectionLabels needs EN and AR text for option "${o.id}"`);
    }
  }
  const choiceOptions = (id: string) => choices.find((x) => x.id === id)?.options.map((o) => o.id);

  // rules
  const ids = exam.rules.map((x) => x.id);
  need(new Set(ids).size === ids.length, "rule ids must be unique");
  const weights = exam.scoring.categoryWeights;
  for (const rule of exam.rules) {
    need((weights[rule.category] ?? 0) > 0, `rule ${rule.id}: category "${rule.category}" has no positive weight`);
    need(isEvidence(rule.evidence), `rule ${rule.id}: evidence needs a class and a reference`);
    for (const [where, t] of ruleTexts(rule)) need(filled(t), `${where}: needs EN and AR text`);
    if (rule.kind === "equals") {
      const options: Record<string, readonly string[] | undefined> = {
        projection: exam.availableProjections,
        breathing: exam.availableBreathing,
        motionInstruction: exam.availableMotionInstructions,
      };
      if (rule.setting === "breathing") need(!!exam.availableBreathing, `rule ${rule.id}: the exam declares no availableBreathing`);
      if (rule.setting.startsWith("choices.")) {
        const list = choiceOptions(rule.setting.slice("choices.".length));
        need(!!list, `rule ${rule.id}: "${rule.setting}" is not a declared choice control`);
        if (list) need(list.includes(rule.expected), `rule ${rule.id}: expected "${rule.expected}" is not an option of ${rule.setting}`);
      } else {
        const list = options[rule.setting];
        if (list) need(list.includes(rule.expected), `rule ${rule.id}: expected "${rule.expected}" is not an available ${rule.setting}`);
      }
    }
    if (rule.kind === "technique" && rule.check === "aec-chambers") need(!!exam.technique.aec, `rule ${rule.id}: the technique profile declares no aec`);
    if (rule.kind === "range") {
      need(RULE_NUMERIC_KEYS.includes(rule.setting) && !!exam.controls[rule.setting], `rule ${rule.id}: "${rule.setting}" is not a declared numeric control`);
      need(rule.acceptable[0] <= rule.ideal[0] && rule.ideal[1] <= rule.acceptable[1] && rule.ideal[0] <= rule.ideal[1], `rule ${rule.id}: ideal band must lie inside the acceptable band`);
    }
  }

  // scoring
  for (const k of Object.keys(weights)) need((CATEGORIES as readonly string[]).includes(k) || filled(exam.scoring.categoryLabels?.[k]), `category "${k}" outside the core six needs a bilingual label in categoryLabels`);
  // Breathing is optional (S14.1b): without `availableBreathing` there is no breathing category either.
  if (!exam.availableBreathing) need((weights.breathing ?? 0) === 0, 'category "breathing" has weight but the exam declares no availableBreathing');
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  need(sum === 100, `category weights sum to ${sum}, not 100`);
  need(exam.scoring.passThreshold > 0 && exam.scoring.passThreshold <= 100, "passThreshold must be in (0, 100]");
  const cf = exam.scoring.criticalFindings.map((x) => x.id);
  need(new Set(cf).size === cf.length, "critical finding ids must be unique");
  for (const f of exam.scoring.criticalFindings) {
    need(f.id in CRITICAL_DETECTORS, `critical finding ${f.id}: no detector is registered for it`);
    need(filled(f.label) && filled(f.reason), `critical finding ${f.id}: label and reason need EN and AR`);
    need(isEvidence(f.concept) && isEvidence(f.evidence), `critical finding ${f.id}: concept and evidence need a class and a reference`);
  }

  // positioning conventions
  need(exam.positioning.markerSide.L !== undefined && exam.positioning.markerSide.R !== undefined, "markerSide must define L and R");
  need(exam.positioning.markerSide.L !== exam.positioning.markerSide.R, "markerSide: L and R must be on opposite halves");
  const mr = exam.positioning.markerRule;
  if (mr?.kind === "detector-side") {
    const opts = choiceOptions(mr.choiceId);
    need(!!opts, `markerRule: choice control "${mr.choiceId}" is not declared`);
    if (opts) need(opts.includes("L") && opts.includes("R"), `markerRule: choice control "${mr.choiceId}" must offer the options "L" and "R"`);
  }
  if (mr?.kind === "fixed-side") need(mr.side === "L" || mr.side === "R", 'markerRule: fixed-side needs the side "L" or "R"');
  need(exam.positioning.minCollimation > 0 && exam.positioning.minCollimation <= 1, "minCollimation must be in (0, 1]");
  return p;
}

export function validateCase(exam: AnyExamDefinition, def: CaseDefinition): string[] {
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
  // Breathing is optional (S14.1b): the initial value exists exactly when the exam declares the control.
  need((s.breathing !== undefined) === !!exam.availableBreathing, "initial breathing must be set exactly when the exam declares availableBreathing");
  if (exam.availableBreathing && s.breathing !== undefined) need(exam.availableBreathing.includes(s.breathing), `initial breathing "${s.breathing}" is not available`);
  need(exam.availableMotionInstructions.includes(s.motionInstruction), `initial motion instruction "${s.motionInstruction}" is not available`);
  for (const k of NUMERIC_KEYS) {
    const c = exam.controls[k];
    need(s[k] >= c.min && s[k] <= c.max, `initial ${k} (${s[k]}) is outside the control range`);
  }
  // optional controls (S11): initial state present exactly when the exam declares the control, and valid
  const ang = exam.controls.tubeAngulationDeg;
  need((s.tubeAngulationDeg !== undefined) === !!ang, "initial tubeAngulationDeg must be set exactly when the exam declares the control");
  if (ang && s.tubeAngulationDeg !== undefined) need(s.tubeAngulationDeg >= ang.min && s.tubeAngulationDeg <= ang.max, `initial tubeAngulationDeg (${s.tubeAngulationDeg}) is outside the control range`);
  const declared = exam.choiceControls ?? [];
  for (const cc of declared) need(cc.options.some((o) => o.id === s.choices?.[cc.id]), `initial choice "${cc.id}" must be one of its options`);
  for (const k of Object.keys(s.choices ?? {})) need(declared.some((cc) => cc.id === k), `initial choice "${k}" is not a declared choice control`);
  for (const [proj, a] of Object.entries(def.patientTechnique.attenuationByProjection ?? {})) {
    need(exam.availableProjections.includes(proj as never) && (a ?? 0) > 0, `patientTechnique.attenuationByProjection.${proj}: must be a positive value for an available projection`);
  }

  // the cooperation profile must answer every instruction the learner can give
  for (const b of exam.availableBreathing ?? []) need(def.patientCooperation.inspirationResponse?.[b] !== undefined, `patientCooperation has no response to breathing "${b}"`);
  for (const m of exam.availableMotionInstructions) need(def.patientCooperation.motionResponse[m] !== undefined, `patientCooperation has no response to motion instruction "${m}"`);
  return p;
}
