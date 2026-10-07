import type { CheckRule, CriticalFindingRule, PositioningSpec } from "@/domain/case";
import type { AnyExamDefinition } from "@/domain/exam";
import type { LocalizedText } from "@/domain/localized";
import type { Evidence } from "@/domain/technique";
import { wristLateralTechnique, wristPaTechnique } from "./wrist-technique";

/**
 * The two WRIST exams, `wrist-pa` and `wrist-lateral` (S14.1c; reference `docs/RAD-LAB_Medical_Reference_Wrist.md`, decisions
 * S14.1-1…6, S14.1b-1, S14.1c-1…8). One builder, two instances: the rules, texts and numbers that differ by projection are in
 * `PER`; everything else is shared so the two exams cannot drift apart. Each exam still has its own file, case, tests and commit.
 *
 * Governing authority: BONTRAGER-9 p.156 (PA wrist) and p.158 (lateral wrist), cited by printed page (S10b-25). Every clinical value
 * is PROVISIONAL until the educator / medical-physicist review (O5). Labels used below: BONTRAGER = taken from the textbook page;
 * ENGINE TEACHING CHOICE (S12-1) = the simulator's own number, named as such in the learner-visible feedback text and in
 * `REVIEW_PACKAGE.md`: the kV partial bands, the SID band above the 102 cm minimum, the rotation tolerances (±2° / ±5°), the centring
 * tolerances, the 3.5 cm excess-collimation margin, the 28 / 22 / 17 / 22 / 11 category weights and the manual reference point.
 * Manual technique only (no AEC, no grid control, no tube-angle control: the central ray is perpendicular), no chin / shoulder /
 * breathing. The shoulder-elbow-wrist plane, the hand arch and shielding are NOT scored in v1 (O24 / O30).
 * Arabic text is DRAFT pending owner / educator review (use «الكاشف»; the terms proposed in reference §7).
 * TODO(medical-review): validate with a radiography educator before release.
 */
export type WristKind = "pa" | "lateral";

const MAS_STATIONS = [0.5, 0.63, 0.8, 1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25];

const T = (en: string, ar: string): LocalizedText => ({ en, ar });
const ev = (status: Evidence["status"], reference: string, note: string): Evidence => ({ status, reference, note });

/** Per-projection facts: page, texts and numbers. */
const PER = {
  pa: {
    id: "wrist-pa",
    page: "p.156",
    pageAr: "ص.156",
    projection: "wrist-pa",
    other: "wrist-lateral",
    title: T("Adult Wrist X-ray — PA", "أشعة الرسغ للبالغ — PA"),
    // Detector region the baseline is drawn in (cm): the 690 × 980 px PA image at 0.01245 cm / px (S14.1c-7).
    region: { xCm: 4.7, yCm: 5, widthCm: 8.6, heightCm: 12.2 },
    // Midcarpal area read by eye on the baseline (u 0.53, v 0.40): y = 5 + 0.40 × 12.2 = 9.88 cm → -0.18; x = 4.7 + 0.53 × 8.59 = 9.25 cm → +0.03.
    target: { x: 0.03, y: -0.18 },
    name: T("PA", "PA"),
    requested: T("wrist PA", "الرسغ بإسقاط PA"),
    projectionPass: T("Correct projection: wrist PA (palm down), as requested.", "الإسقاط صحيح: الرسغ بإسقاط PA (راحة اليد للأسفل) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (wrist PA, palm down). Re-position the hand and wrist as requested.",
      "الإسقاط لا يطابق الطلب (الرسغ بإسقاط PA، راحة اليد للأسفل). أعد وضع اليد والرسغ حسب الطلب.",
    ),
    kv: { full: [55, 65], partial: [50, 70] },
    rotationPass: T(
      "The wrist is square to the detector: the spaces between the proximal metacarpals are near-equal, their shafts show equal concavity on both sides, and the distal radius and ulna are separated (Bontrager p.156).",
      "الرسغ متعامد مع الكاشف: المسافات بين قواعد عظام مشط اليد متقاربة، ويظهر تقعر متساوٍ على جانبي أجسامها، والطرفان السفليان للكعبرة والزند منفصلان (Bontrager ص.156).",
    ),
    rotationFail: T(
      "The wrist is rotated. The spaces between the proximal metacarpals are unequal and the ulna moves over the radius, so the distal radius and ulna are no longer separated (Bontrager p.156). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the wrist). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "الرسغ مائل (دوران). أصبحت المسافات بين قواعد عظام مشط اليد غير متساوية وتحرك الزند فوق الكعبرة، فلم يعد الطرفان السفليان للكعبرة والزند منفصلين (Bontrager ص.156). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للرسغ). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the proximal metacarpals.", "الحافة العلوية للمجال تقطع قواعد عظام مشط اليد."),
      bottom: T("The bottom of the field cuts off the distal radius and ulna.", "الحافة السفلية للمجال تقطع الطرف السفلي للكعبرة والزند."),
      left: T("The left side of the field (in the detector view) cuts off the ulnar side of the wrist.", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع جهة الزند من الرسغ."),
      right: T("The right side of the field (in the detector view) cuts off the thumb side of the wrist.", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع جهة الإبهام من الرسغ."),
    },
    kvpLow: T("below", "أقل من"),
    imageCriteria: [
      { id: "rotation", description: T("True PA: equal concavity on both sides of the proximal metacarpal shafts, near-equal distances between the proximal metacarpals, distal radius and ulna separated", "إسقاط PA صحيح: تقعر متساوٍ على جانبي أجسام عظام مشط اليد القريبة، ومسافات متقاربة بين قواعدها، والطرفان السفليان للكعبرة والزند منفصلان") },
      { id: "coverage", description: T("Distal radius and ulna, carpals and the metacarpals included (the baseline image ends at the proximal metacarpals)", "الطرف السفلي للكعبرة والزند وعظام الرسغ وعظام مشط اليد ضمن الصورة (تنتهي الصورة المرجعية عند قواعد عظام مشط اليد)") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target with bony trabecular markings and soft-tissue margins visible (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف مع ظهور العلامات الترابيقية العظمية وحدود الأنسجة الرخوة (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
  },
  lateral: {
    id: "wrist-lateral",
    page: "p.158",
    pageAr: "ص.158",
    projection: "wrist-lateral",
    other: "wrist-pa",
    title: T("Adult Wrist X-ray — Lateral", "أشعة الرسغ للبالغ — جانبي"),
    // The 559 × 1400 px lateral image at 0.0125 cm / px; the region ends at the proximal metacarpal / forearm part of the image (rows 0–1000).
    region: { xCm: 5.5, yCm: 5, widthCm: 7, heightCm: 12.5 },
    // Midcarpal area read by eye (rows ≈ 470 of 1400): y = 5 + 470 × 0.0125 = 10.88 cm → -0.09; x ≈ 9.13 cm → +0.01.
    target: { x: 0.01, y: -0.09 },
    name: T("lateral", "جانبي"),
    requested: T("wrist lateral", "الرسغ بالإسقاط الجانبي"),
    projectionPass: T("Correct projection: wrist lateral (thumb up), as requested.", "الإسقاط صحيح: الرسغ بالإسقاط الجانبي (الإبهام لأعلى) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (wrist lateral, thumb up). Re-position the hand and wrist as requested.",
      "الإسقاط لا يطابق الطلب (الرسغ بالإسقاط الجانبي، الإبهام لأعلى). أعد وضع اليد والرسغ حسب الطلب.",
    ),
    kv: { full: [60, 70], partial: [55, 75] },
    rotationPass: T(
      "The wrist is a true lateral: the ulnar head lies over the distal radius and the proximal 2nd–5th metacarpals are superimposed (Bontrager p.158).",
      "الرسغ في إسقاط جانبي صحيح: رأس الزند فوق الطرف السفلي للكعبرة وقواعد عظام مشط اليد من الثانية إلى الخامسة متراكبة (Bontrager ص.158).",
    ),
    rotationFail: T(
      "The wrist is rotated: the ulnar head is no longer over the distal radius and the proximal metacarpals are no longer superimposed (Bontrager p.158). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the wrist). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "الرسغ مائل (دوران): لم يعد رأس الزند فوق الطرف السفلي للكعبرة ولم تعد قواعد عظام مشط اليد متراكبة (Bontrager ص.158). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للرسغ). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the proximal metacarpals.", "الحافة العلوية للمجال تقطع قواعد عظام مشط اليد."),
      bottom: T("The bottom of the field cuts off the distal radius and ulna.", "الحافة السفلية للمجال تقطع الطرف السفلي للكعبرة والزند."),
      left: T("The left side of the field (in the detector view) cuts off the edge of the wrist.", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع حافة الرسغ."),
      right: T("The right side of the field (in the detector view) cuts off the edge of the wrist.", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع حافة الرسغ."),
    },
    kvpLow: T("below", "أقل من"),
    imageCriteria: [
      { id: "rotation", description: T("True lateral: ulnar head superimposed over the distal radius, proximal 2nd–5th metacarpals superimposed", "إسقاط جانبي صحيح: رأس الزند فوق الطرف السفلي للكعبرة، وقواعد عظام مشط اليد من الثانية إلى الخامسة متراكبة") },
      { id: "coverage", description: T("Distal radius and ulna, carpals and the metacarpals included (the baseline image ends at the proximal metacarpals)", "الطرف السفلي للكعبرة والزند وعظام الرسغ وعظام مشط اليد ضمن الصورة (تنتهي الصورة المرجعية عند قواعد عظام مشط اليد)") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target with bony trabecular markings and soft-tissue margins visible (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف مع ظهور العلامات الترابيقية العظمية وحدود الأنسجة الرخوة (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
  },
} as const;

const positioning = (k: WristKind): PositioningSpec => ({
  centering: {
    target: PER[k].target,
    // ENGINE TEACHING CHOICE: ≈ ±0.7 cm / ±0.9 cm full credit, ≈ ±1.8 cm / ±2.2 cm half credit on the 18 × 24 cm detector.
    idealTolerance: { x: 0.08, y: 0.075 },
    acceptableTolerance: { x: 0.2, y: 0.185 },
  },
  minCollimation: 0.3,
  markerSizeCm: 1.8,
  // Display halves are NOT part of the single-limb rule (O21 option A, S14.1c-4): the letter alone is judged. `markerSide` only places
  // the default marker of each letter at the edge of the field on the side that keeps it clear of the wrist.
  markerSide: { L: "viewer-left", R: "viewer-right" },
  defaultMarkerPosition: { L: { x: -0.62, y: 0 }, R: { x: 0.62, y: 0 } },
  // Left wrist in v1 (S14.1c-1): the letter must be L. A right-wrist case needs the side on the case (O29).
  markerRule: { kind: "fixed-side", side: "L" },
});

const criticalFindings = (k: WristKind): CriticalFindingRule[] => [
  {
    id: "wrong-side-marker",
    label: T("Wrong-side marker", "علامة جانب خاطئة"),
    reason: T(
      "Critical finding — wrong-side marker: the marker letter does not match the patient's side (this is the LEFT wrist). A wrong marker misidentifies the patient's side, so the attempt is below the pass mark whatever the numeric score. In practice such an image would normally be repeated.",
      "ملاحظة حرجة — علامة جانب خاطئة: حرف العلامة لا يطابق جانب المريض (هذا هو الرسغ الأيسر). العلامة الخاطئة تُحدِّد جانب المريض خطأً، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. وفي الممارسة تُعاد الصورة عادةً.",
    ),
    concept: ev("common-reference", `BONTRAGER-9 p.32-33, 36, ${PER[k].page}`, "COMMON QUALITY CRITERION: an anatomic side marker is required on every image and must name the side imaged. For a single limb Bontrager gives no viewer-half convention, so only the letter is judged (O21 option A, S14.1c-4)."),
    evidence: ev("provisional", "S14.1-4, S14.1b-1, S14.1c-4", "PROVISIONAL / educational: the gate is a simulator rule (educator decision pending, O5). The numeric score is unchanged."),
  },
  {
    id: "missing-marker",
    label: T("Missing marker", "علامة جانب غير موضوعة"),
    reason: T(
      "Critical finding — no side marker: the image would not say which wrist it shows. The attempt is below the pass mark whatever the numeric score, because an unmarked image is normally repeated.",
      "ملاحظة حرجة — لا توجد علامة جانب: لن تبيّن الصورة أي رسغ تُظهر. تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية، لأن الصورة بلا علامة تُعاد عادةً.",
    ),
    concept: ev("common-reference", `BONTRAGER-9 p.32-33, 36, ${PER[k].page}`, "COMMON QUALITY CRITERION: the image must carry a side marker."),
    evidence: ev("provisional", "S14.1-4, S14.1b-1", "PROVISIONAL / educational: the gate is a simulator rule with the same severity as the wrong-side marker. The numeric score is unchanged."),
  },
];

const rules = (k: WristKind): CheckRule[] => {
  const p = PER[k];
  const pg = p.page, pgAr = p.pageAr;
  const [kvLo, kvHi] = p.kv.full;
  const [pLo, pHi] = p.kv.partial;
  return [
    {
      id: "projection",
      kind: "equals",
      category: "positioning",
      weight: 2,
      setting: "projection",
      expected: p.projection,
      variantOnFail: "wrong-projection",
      label: T("Projection", "الإسقاط"),
      feedback: { pass: p.projectionPass, fail: p.projectionFail },
      evidence: ev("common-reference", `BONTRAGER-9 ${pg}; the exam request`, "The projection performed must be the projection requested."),
    },
    {
      id: "collimation-clipping",
      kind: "coverage",
      check: "clipping",
      category: "positioning",
      weight: 2,
      maxMarginCm: 5,
      variantOnClipped: "clipped",
      label: T("Collimation — anatomy coverage", "التحديد — تغطية التشريح"),
      clippedSides: p.clippedSides,
      feedback: {
        pass: T("The field covers the distal radius and ulna, the carpals and the metacarpals shown.", "المجال يغطي الطرف السفلي للكعبرة والزند وعظام الرسغ وعظام مشط اليد الظاهرة."),
        fail: T("Anatomy outside the field is missing from the image. Open the field or re-centre the central ray.", "التشريح الواقع خارج المجال يغيب عن الصورة. وسّع المجال أو أعد توسيط الشعاع المركزي."),
      },
      evidence: ev(
        "educational-simplification",
        `BONTRAGER-9 ${pg} (collimate on all four sides to include the distal radius and ulna and the mid-metacarpal area)`,
        "The required anatomy is Bontrager's criterion; the region used is LIMITED BY THE BASELINE IMAGE (it ends at the proximal metacarpals, so the mid-metacarpal area cannot be shown, S14.1c-7, O28) and its size is provisional.",
      ),
    },
    {
      id: "collimation-excess",
      kind: "coverage",
      check: "excess",
      category: "positioning",
      weight: 1,
      maxMarginCm: 3.5,
      label: T("Collimation — field size", "التحديد — حجم المجال"),
      feedback: {
        pass: T("The field is not larger than necessary for the required anatomy.", "المجال ليس أكبر من اللازم للتشريح المطلوب."),
        fail: T("The field is opened wider than necessary.", "المجال مفتوح أكثر من اللازم."),
        high: T(
          "The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the wrist and hand, without cutting off the required anatomy. (The 3.5 cm margin limit is an engine teaching choice; the field must still include the marker.)",
          "المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من الرسغ واليد دون أن تقطع التشريح المطلوب. (حدّ الهامش 3.5 سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)",
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (collimate to the area of interest)`, "Principle from the textbook; the 3.5 cm margin limit is an engine teaching choice (provisional / configurable)."),
    },
    {
      id: "side-marker",
      kind: "marker",
      category: "positioning",
      weight: 1,
      label: T("Side marker (patient's side)", "علامة الجانب (جانب المريض)"),
      feedback: {
        pass: T(
          "Marker placed inside the field, clear of the wrist anatomy, with the letter of the patient's side (left). For a single limb no left or right half of the image is required in this simulator (Bontrager gives none).",
          "العلامة موضوعة داخل المجال بعيدًا عن تشريح الرسغ وبحرف جانب المريض (الأيسر). لا يُشترط في هذا المحاكي نصف أيسر أو أيمن من الصورة لطرف واحد (لا يذكره Bontrager).",
        ),
        fail: T(
          "No side marker placed. Choose the letter of the patient's side (this is the left wrist) and place it inside the field.",
          "لم توضع علامة جانب. اختر حرف جانب المريض (هذا هو الرسغ الأيسر) وضعه داخل المجال.",
        ),
        overlap: T("The marker covers the wrist anatomy. Move it to the edge of the field, away from the required anatomy.", "العلامة تغطي تشريح الرسغ. انقلها إلى حافة المجال بعيدًا عن التشريح المطلوب."),
        wrongSide: T(
          "The marker letter does not match the patient's side: this is the LEFT wrist. A wrong marker misidentifies the patient's side.",
          "حرف العلامة لا يطابق جانب المريض: هذا هو الرسغ الأيسر. العلامة الخاطئة تُحدِّد جانب المريض خطأً.",
        ),
        outsideField: T("The marker is outside the collimated field, so it would not be recorded on the image. Move it inside the field.", "العلامة خارج المجال المحدَّد فلن تُسجَّل على الصورة. انقلها إلى داخل المجال."),
      },
      evidence: ev("provisional", `BONTRAGER-9 p.32-33, 36, ${pg}; S14.1b-1 (O21 option A), S14.1c-4`, "Presence, side and placement (inside the field, not over the anatomy) follow Bontrager's general marker rule; the single-limb display convention is NOT given, so no viewer-half check is made."),
    },
    {
      id: "motion-instruction",
      kind: "equals",
      category: "positioning",
      weight: 0,
      setting: "motionInstruction",
      expected: "remain-still",
      variantOnFail: "motion",
      label: T("Instruction to stay still (not scored)", "تعليمات الثبات (غير محسوبة)"),
      feedback: {
        pass: T(
          "You asked the patient to stay still. In this simulation a cooperative patient then holds still, so the image is not blurred by movement.",
          "طلبتَ من المريض أن يبقى ثابتًا. في هذه المحاكاة يلتزم المريض المتعاون بالثبات فلا تتشوه الصورة بالحركة.",
        ),
        fail: T(
          "The patient was not clearly asked to stay still, so in this simulation the hand moves during the exposure. Movement causes a loss of sharpness (blur) that can hide fine bone detail. Ask the patient to keep the hand still.",
          "لم يُطلب من المريض بوضوح أن يبقى ثابتًا، فتتحرك اليد أثناء التعريض في هذه المحاكاة. تسبب الحركة فقدانًا في الحدّة (ضبابية) قد يخفي التفاصيل العظمية الدقيقة. اطلب من المريض إبقاء اليد ثابتة.",
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (no motion); Image-quality ref (Motion)`, "VALIDATED: motion reduces sharpness. EDUCATIONAL ASSUMPTION: that this instruction decides whether this simulated patient moves. Deliberately unscored (no rubric exists)."),
    },
    {
      id: "rotation",
      kind: "range",
      category: "rotation",
      setting: "rotationDeg",
      ideal: [-2, 2],
      acceptable: [-5, 5],
      unit: "°",
      variantOnLow: "rotated",
      variantOnHigh: "rotated",
      label: T("Wrist rotation", "دوران الرسغ"),
      // MAGNITUDE-ONLY (S14.1c-2): Bontrager gives no direction rule for the wrist, so there is no `low` / `high` text.
      feedback: { pass: p.rotationPass, fail: p.rotationFail },
      evidence: ev(
        "provisional",
        `BONTRAGER-9 ${pg}; S14.1c-2, S14.1c-5`,
        "The criteria are Bontrager's. The ±2° / ±5° bands are an ENGINE TEACHING CHOICE (Bontrager gives no angle). The sign of the value is defined by the RESULT IMAGE (positive = toward the viewer's right); no direction of turn is claimed. The drawn effect is an EDUCATIONAL APPROXIMATION made from one baseline image.",
      ),
    },
    {
      id: "centering-lateral",
      kind: "centering",
      axis: "x",
      category: "centering",
      label: T("Central ray — long axis of the forearm and hand", "الشعاع المركزي — المحور الطولي للساعد واليد"),
      feedback: {
        pass: T("The central ray is aligned with the long axis of the forearm and hand, centred on the detector's long axis (Bontrager).", "الشعاع المركزي محاذٍ للمحور الطولي للساعد واليد ومتمركز على المحور الطولي للكاشف (Bontrager)."),
        fail: T("The central ray is off the long axis of the forearm and hand. Re-centre it.", "الشعاع المركزي بعيد عن المحور الطولي للساعد واليد. أعد توسيطه."),
        low: T(
          "The central ray is shifted to the left of the long axis (left side of the detector view). The wrist sits off-centre and an edge of the wrist may be clipped. Move the target right, toward the long axis.",
          "الشعاع المركزي مزاح إلى يسار المحور الطولي (يسار عرض الكاشف). يقع الرسغ بعيدًا عن المركز وقد تُقطع إحدى حافتيه. حرّك الهدف يمينًا نحو المحور الطولي.",
        ),
        high: T(
          "The central ray is shifted to the right of the long axis (right side of the detector view). The wrist sits off-centre and an edge of the wrist may be clipped. Move the target left, toward the long axis.",
          "الشعاع المركزي مزاح إلى يمين المحور الطولي (يمين عرض الكاشف). يقع الرسغ بعيدًا عن المركز وقد تُقطع إحدى حافتيه. حرّك الهدف يسارًا نحو المحور الطولي.",
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (hand and wrist long axis aligned with and centred on the receptor long axis)`, "Alignment is Bontrager's; the tolerance values are an engine teaching choice (provisional)."),
    },
    {
      id: "centering-vertical",
      kind: "centering",
      axis: "y",
      category: "centering",
      label: T("Central ray — midcarpal area", "الشعاع المركزي — وسط الرسغ"),
      feedback: {
        pass: T("The central ray is at about the midcarpal area, perpendicular to the detector (Bontrager).", "الشعاع المركزي عند وسط الرسغ تقريبًا وعمودي على الكاشف (Bontrager)."),
        fail: T("The central ray is off the midcarpal area. Re-centre it on the middle of the carpals.", "الشعاع المركزي بعيد عن وسط الرسغ. أعد توسيطه على منتصف عظام الرسغ."),
        low: T(
          "The central ray is too far toward the fingers (top of the detector view). The distal radius and ulna may be clipped. Move the target down, toward the midcarpal area.",
          "الشعاع المركزي أقرب إلى الأصابع من اللازم (أعلى عرض الكاشف). قد يُقطع الطرف السفلي للكعبرة والزند. حرّك الهدف للأسفل نحو وسط الرسغ.",
        ),
        high: T(
          "The central ray is too far toward the forearm (bottom of the detector view). The metacarpals may be clipped. Move the target up, toward the midcarpal area.",
          "الشعاع المركزي أقرب إلى الساعد من اللازم (أسفل عرض الكاشف). قد تُقطع عظام مشط اليد. حرّك الهدف للأعلى نحو وسط الرسغ.",
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (central ray perpendicular to the midcarpal area)`, "The midcarpal target is Bontrager's; its position on the detector is read by eye on the baseline and the tolerances are an engine teaching choice (provisional)."),
    },
    {
      id: "kvp",
      kind: "technique",
      check: "kvp-band",
      category: "exposure",
      weight: 1,
      variantOnLow: "low-penetration",
      label: T("kVp (beam energy / penetration)", "kVp (طاقة الحزمة / الاختراق)"),
      feedback: {
        pass: T(
          `kVp is inside Bontrager's digital band for the ${p.name.en} wrist (${kvLo}–${kvHi} kV).`,
          `قيمة kVp ضمن نطاق Bontrager الرقمي للرسغ ${p.name.ar} (‎${kvLo}–${kvHi}‎ kV).`,
        ),
        low: T(
          `kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only ${kvLo}–${kvHi} kV is the textbook digital band; the partial credit between ${pLo} and ${kvLo - 1} kV is an engine teaching choice.)`,
          `قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎${kvLo}–${kvHi}‎ kV فقط؛ أما الدرجة الجزئية بين ‎${pLo}‎ و‎${kvLo - 1}‎ kV فهي اختيار تعليمي في المحاكي.)`,
        ),
        high: T(
          `kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only ${kvLo}–${kvHi} kV is the textbook digital band; the partial credit up to ${pHi} kV is an engine teaching choice.)`,
          `قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎${kvLo}–${kvHi}‎ kV فقط؛ أما الدرجة الجزئية حتى ‎${pHi}‎ kV فهي اختيار تعليمي.)`,
        ),
        fail: T(`kVp is outside this simulator's range for the wrist (${pLo}–${pHi} kV).`, `قيمة kVp خارج نطاق المحاكي للرسغ (‎${pLo}–${pHi}‎ kV).`),
      },
      evidence: ev("provisional", `BONTRAGER-9 ${pg} (digital ${(kvLo + kvHi) / 2} ± 5 kV); S14.1-4, S14.1c-6`, `${kvLo}–${kvHi} kV is Bontrager. The partial bands ${pLo}–${kvLo - 1} and ${kvHi + 1}–${pHi} kV are an ENGINE TEACHING CHOICE, NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.`),
    },
    {
      id: "exposure-adequacy",
      kind: "technique",
      check: "exposure-adequacy",
      category: "exposure",
      weight: 2,
      variantOnLow: "low-exposure",
      label: T("Detector exposure — adequate signal", "تعريض الكاشف — إشارة كافية"),
      feedback: {
        pass: T(
          "Detector exposure is close to this protocol's target (DI near 0) or above it, so there is enough signal and quantum noise is not limiting the image. The target is this simulator's own model anchor, not a prescribed mAs.",
          "تعريض الكاشف قريب من هدف هذا البروتوكول (DI قريب من 0) أو أعلى منه، فالإشارة كافية والضجيج الكمّي لا يحدّ من جودة الصورة. الهدف نقطة ارتكاز خاصة بالمحاكي وليس mAs موصوفًا.",
        ),
        high: T(
          "The signal is adequate, but exposure above the target is not “better”: it adds radiation without a matching diagnostic benefit. See the dose-optimization check.",
          "الإشارة كافية، لكن التعريض فوق الهدف ليس «أفضل»: فهو يضيف إشعاعًا دون فائدة تشخيصية مقابلة. راجع فحص تحسين الجرعة.",
        ),
        low: T(
          "Detector exposure is below the target (negative DI). Fewer photons reach the detector, so quantum noise rises and the bony trabecular markings and soft-tissue margins are harder to see. Digital processing can still make the image look acceptable, so judge exposure by the detector exposure / DI, not by displayed brightness. Bring the exposure back toward the target (mAs or SID).",
          "تعريض الكاشف أقل من الهدف (DI سالب). يصل عدد أقل من الفوتونات إلى الكاشف فيزداد الضجيج الكمّي وتصعب رؤية العلامات الترابيقية العظمية وحدود الأنسجة الرخوة. يمكن لمعالجة الصورة الرقمية أن تُظهرها مقبولة رغم ذلك، لذا احكم على التعريض من تعريض الكاشف/DI وليس من سطوع الصورة المعروضة. أعد التعريض نحو الهدف (mAs أو SID).",
        ),
        fail: T("Detector exposure is well below the target: the image would be noisy.", "تعريض الكاشف أقل بكثير من الهدف: ستكون الصورة مليئة بالضجيج."),
      },
      evidence: ev("provisional", "Technique ref §5, §6, §8; S10b-9; S14.1c-6; O26", "VALIDATED: the DI equation and the digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the manual reference point the exposure is measured against (an engine teaching constant); no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the wrist)."),
    },
    {
      id: "dose-optimization",
      kind: "technique",
      check: "dose-optimization",
      category: "exposure",
      weight: 2,
      variantOnHigh: "excess-exposure",
      label: T("Dose awareness — avoid unnecessary exposure", "الوعي بالجرعة — تجنّب التعريض غير الضروري"),
      feedback: {
        pass: T("Detector exposure is not above this protocol's target, so no unnecessary exposure was added.", "تعريض الكاشف ليس أعلى من هدف هذا البروتوكول، فلم يُضَف تعريض غير ضروري."),
        high: T(
          "Detector exposure is above the target (positive DI). A digital system can still show an acceptable-looking image after processing, so excess exposure is easy to miss — this is how “dose creep” happens. More exposure than needed adds radiation without a matching diagnostic benefit. Reduce mAs, or check the SID.",
          "تعريض الكاشف أعلى من الهدف (DI موجب). يمكن للنظام الرقمي أن يعرض صورة تبدو مقبولة بعد المعالجة، لذا يسهل إغفال التعريض الزائد — وهكذا يحدث «زحف الجرعة». التعريض الأكبر من اللازم يضيف إشعاعًا دون فائدة تشخيصية مقابلة. قلّل mAs أو راجع SID.",
        ),
        fail: T("Detector exposure is far above the target: a clear dose-creep risk.", "تعريض الكاشف أعلى بكثير من الهدف: خطر واضح لزحف الجرعة."),
      },
      evidence: ev("provisional", "Technique ref §7, §8; S14.1c-6", "VALIDATED: digital dynamic range can hide excess exposure (dose creep). PROVISIONAL: the DI bands. No patient dose is calculated."),
    },
    {
      id: "sid",
      kind: "range",
      category: "sid",
      setting: "sidCm",
      // Bontrager: minimum 40 in = 102 cm (p.156 / 158). ENGINE TEACHING CHOICES: the upper full-credit limit (110 cm) and the partial band (95–130 cm).
      ideal: [102, 110],
      acceptable: [95, 130],
      unit: "cm",
      variantOnLow: "magnified-geometry",
      label: T("Source-to-image distance (SID)", "المسافة بين المصدر والكاشف (SID)"),
      feedback: {
        pass: T("SID is at least the 102 cm (40 in) minimum and inside this simulator's teaching band (102–110 cm).", "قيمة SID لا تقل عن الحد الأدنى 102 سم (40 بوصة) وضمن النطاق التعليمي للمحاكي (102–110 سم)."),
        low: T(
          "SID is shorter than the 102 cm (40 in) minimum Bontrager gives for the wrist. A shorter distance increases magnification and unsharpness (not drawn in this version) and raises the exposure at the detector (inverse square).",
          "قيمة SID أقصر من الحد الأدنى 102 سم (40 بوصة) الذي يذكره Bontrager للرسغ. المسافة الأقصر تزيد التكبير وعدم الحدّة (لا يُرسمان في هذه النسخة) وتزيد التعريض عند الكاشف (قانون التربيع العكسي).",
        ),
        high: T(
          "SID is longer than this simulator's teaching band (102–110 cm); exposure at the detector drops (inverse square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum; the upper limit and the partial band are engine teaching choices.)",
          "قيمة SID أطول من النطاق التعليمي في المحاكي (102–110 سم)؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط؛ والحد الأعلى والنطاق الجزئي اختياران تعليميان في المحاكي.)",
        ),
        fail: T("SID is outside this simulator's range for the wrist (below about 95 cm or above 130 cm).", "قيمة SID خارج نطاق المحاكي للرسغ (أقل من نحو 95 سم أو أكثر من 130 سم)."),
      },
      evidence: ev("provisional", `BONTRAGER-9 ${pg} (SID minimum 40 in / 102 cm); S14.1-4, S14.1c-6`, "The 102 cm minimum is Bontrager (inch-to-cm conversion). The 110 cm upper full-credit limit and the 95–130 cm partial band are ENGINE TEACHING CHOICES, NOT Bontrager."),
    },
  ];
};

/** One wrist exam (S14.1c). The two instances are `wrist-pa.ts` and `wrist-lateral.ts`. */
export function makeWristExam(k: WristKind): AnyExamDefinition {
  const p = PER[k];
  return {
    schemaVersion: 1,
    id: p.id,
    modality: "general-radiography",
    bodyPart: "wrist",
    provisional: true,
    evidence: {
      status: "provisional",
      reference: `docs/RAD-LAB_Medical_Reference_Wrist.md; BONTRAGER-9 ${p.page}; docs/DECISIONS.md S14.1-*, S14.1b-*, S14.1c-*`,
      note: "Exam-level classification: provisional until the educator / medical-physicist review is signed off. Every rule, tolerance and feedback sentence carries its own evidence class.",
    },
    defaultCaseId: "adult-demo",
    title: p.title,
    requiredProjection: p.projection,
    // Both projections are selectable so that a wrong projection is possible; no breathing (S14.1b), so no `availableBreathing`.
    availableProjections: ["wrist-pa", "wrist-lateral"],
    availableMotionInstructions: ["none", "remain-still", "relax-and-move"],
    // BONTRAGER-9 p.156 / 158: 18 × 24 cm receptor, portrait, the smallest available.
    detector: { widthCm: 18, heightCm: 24 },
    requiredAnatomy: p.region,
    controls: {
      rotationDeg: { min: -15, max: 15, step: 1 },
      sidCm: { min: 80, max: 200, step: 1 },
      kvp: { min: 40, max: 100, step: 1 },
      // mAs steps through a preferred-number series, like a console; the range is hardware, not a target.
      mas: { min: 0.5, max: 25, step: 0.5, stations: MAS_STATIONS },
      // No tubeAngulationDeg: the central ray is perpendicular (Bontrager p.156 / 158), so the control is not offered.
    },
    technique: k === "pa" ? wristPaTechnique : wristLateralTechnique,
    positioning: positioning(k),
    rules: rules(k),
    scoring: {
      // S14.1b-1 option A (engine teaching choice): the PA weights without breathing, redistributed proportionally.
      categoryWeights: { positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 },
      passThreshold: 70,
      criticalFindings: criticalFindings(k),
    },
    possibleErrors: [
      { id: "rotated", variant: "rotated", description: T("Wrist rotation", "دوران الرسغ") },
      { id: "clipped", variant: "clipped", description: T("Anatomy clipped by centering or collimation", "قطع التشريح بسبب التوسيط أو التحديد") },
      { id: "motion", variant: "motion", description: T("Patient motion (loss of sharpness)", "حركة المريض (فقدان الحدّة)") },
      { id: "low-exposure", variant: "low-exposure", description: T("Low detector exposure (increased quantum noise)", "تعريض كاشف منخفض (ضجيج كمّي متزايد)") },
      { id: "excess-exposure", variant: "excess-exposure", description: T("Excess detector exposure (dose-creep risk; may look acceptable after processing)", "تعريض كاشف زائد (خطر زحف الجرعة؛ قد تبدو الصورة مقبولة بعد المعالجة)") },
      { id: "low-penetration", variant: "low-penetration", description: T("Insufficient beam penetration (kVp too low)", "اختراق غير كافٍ للحزمة (kVp منخفض)") },
    ],
    imageCriteria: [...p.imageCriteria],
    scene: { id: p.id },
    render: { renderer: "radiograph-2d" },
  };
}
