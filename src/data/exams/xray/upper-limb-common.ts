import type { CheckRule, CriticalFindingRule, PositioningSpec } from "@/domain/case";
import type { AnyExamDefinition } from "@/domain/exam";
import type { LocalizedText } from "@/domain/localized";
import type { Evidence } from "@/domain/technique";
import { patientMotionFinding, wrongProjectionFinding } from "./critical-common";
import { ELBOW_DETECTOR, elbowRegion } from "./elbow-geometry";
import { HAND_DETECTOR, handRegion } from "./hand-geometry";
import { upperLimbTechnique } from "./upper-limb-technique";

/**
 * The six UPPER-LIMB exams in one builder (CLN-016 / CLN-017, RAD-068; the rotation models, CLN-025, are not part of it): wrist PA / lateral (S14.1c; reference
 * `docs/RAD-LAB_Medical_Reference_Wrist.md`, decisions S14.1-1…6, S14.1b-1, S14.1c-1…8), hand PA / lateral in EXTENSION (S14.2b; reference
 * `docs/RAD-LAB_Medical_Reference_Hand.md`, decisions S14.2-1…11) and elbow AP fully extended, supinated / lateral flexed 90°, thumb side up
 * (S14.3; reference `docs/RAD-LAB_Medical_Reference_Elbow.md`, decisions S14.3-1…). What differs by projection is in `PER`, what differs by
 * body part is in `FAMILY`; every other rule, number and sentence is written ONCE below, so a correction to a shared text (G8, the Arabic
 * terms, the SID or margin rules) is made in one place. Each exam still has its own file, case and tests.
 *
 * Governing authority: BONTRAGER-9 p.156 / p.158 (wrist), p.150 / p.153 (hand) and p.166 / p.172 (elbow), cited by printed page (S10b-25).
 * Every clinical value is PROVISIONAL until the educator / medical-physicist review (O5). Labels used below: BONTRAGER = taken from the
 * textbook page; ENGINE TEACHING CHOICE (S12-1) = the simulator's own number, named as such in the learner-visible feedback text and in
 * `REVIEW_PACKAGE.md`: the kV partial bands, the owner-approved SID band (100–110 cm; RAD-081), the rotation tolerances (±2° / ±5°), the centring
 * tolerances, the excess-collimation margins (wrist 3.5 cm; hand PA 3.5 cm, lateral 6.5 cm: O40; elbow AP 3 cm, lateral 4.5 cm), the forearm
 * coverage of the hand and the extent of the elbow region, the 28 / 22 / 17 / 22 / 11 category weights and the manual reference point.
 * Manual technique only (no AEC, no grid control, no tube-angle control: the central ray is perpendicular), no chin / shoulder / breathing.
 * NOT scored in v1: the shoulder-elbow-wrist plane, the hand arch (O24 / O30); shielding, compensation filter, foam support, finger spread /
 * posture and the thumb obliquity of the hand (S14.2-4, O30); anode-heel placement, fat-pad visibility, arm / shoulder position and the
 * flexion angle of the elbow (S14.3-5). The hand and elbow use no exposure-appearance wording (the trabecular / soft-tissue-margin text of
 * the wrist): the references have no source for it (O35).
 * Arabic text is DRAFT pending owner / educator review (use «الكاشف»; male forms for the male patient; the terms proposed in the references).
 * TODO(medical-review): validate with a radiography educator before release.
 */
export type UpperLimbKind = "wrist-pa" | "wrist-lateral" | "hand-pa" | "hand-lateral" | "elbow-ap" | "elbow-lateral";
export type UpperLimbFamily = "wrist" | "hand" | "elbow";

const familyOf = (k: UpperLimbKind): UpperLimbFamily => k.split("-")[0] as UpperLimbFamily;

const MAS_STATIONS = [0.5, 0.63, 0.8, 1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25];

const T = (en: string, ar: string): LocalizedText => ({ en, ar });
const ev = (status: Evidence["status"], reference: string, note: string): Evidence => ({ status, reference, note });

type CentringTexts = { label: LocalizedText; pass: LocalizedText; fail: LocalizedText; low: LocalizedText; high: LocalizedText };

/** Centring along the long axis (wrist, hand): the same sentences with the family's axis and part words. */
const longAxisCentring = (axisEn: string, axisAr: string, partEn: string, offCentreAr: string): CentringTexts => ({
  label: T(`Central ray — long axis of the ${axisEn}`, `الشعاع المركزي — المحور الطولي ${axisAr}`),
  pass: T(`The central ray is aligned with the long axis of the ${axisEn}, centred on the detector's long axis (Bontrager).`, `الشعاع المركزي محاذٍ للمحور الطولي ${axisAr} ومتمركز على المحور الطولي للكاشف (Bontrager).`),
  fail: T(`The central ray is off the long axis of the ${axisEn}. Re-centre it.`, `الشعاع المركزي بعيد عن المحور الطولي ${axisAr}. أعد توسيطه.`),
  low: T(
    `The central ray is shifted to the left of the long axis (left side of the detector view). The ${partEn} sits off-centre and an edge of the ${partEn} may be clipped. Move the target right, toward the long axis.`,
    `الشعاع المركزي مزاح إلى يسار المحور الطولي (يسار عرض الكاشف). ${offCentreAr} حرّك الهدف يمينًا نحو المحور الطولي.`,
  ),
  high: T(
    `The central ray is shifted to the right of the long axis (right side of the detector view). The ${partEn} sits off-centre and an edge of the ${partEn} may be clipped. Move the target left, toward the long axis.`,
    `الشعاع المركزي مزاح إلى يمين المحور الطولي (يمين عرض الكاشف). ${offCentreAr} حرّك الهدف يسارًا نحو المحور الطولي.`,
  ),
});

const WRIST_X = longAxisCentring("forearm and hand", "للساعد واليد", "wrist", "يقع الرسغ بعيدًا عن المركز وقد تُقطع إحدى حافتيه.");
const HAND_X = longAxisCentring("hand and forearm", "لليد والساعد", "hand", "تقع اليد بعيدًا عن المركز وقد تُقطع إحدى حافتيها.");

/** Vertical centring away from the target (wrist, hand: the same for both projections). */
const WRIST_Y = {
  low: T(
    "The central ray is too far toward the fingers (top of the detector view). The distal radius and ulna may be clipped. Move the target down, toward the midcarpal area.",
    "الشعاع المركزي أقرب إلى الأصابع من اللازم (أعلى عرض الكاشف). قد تُقطع النهايتان البعيدتان للكعبرة والزند. حرّك الهدف للأسفل نحو وسط الرسغ.",
  ),
  high: T(
    "The central ray is too far toward the forearm (bottom of the detector view). The metacarpals may be clipped. Move the target up, toward the midcarpal area.",
    "الشعاع المركزي أقرب إلى الساعد من اللازم (أسفل عرض الكاشف). قد تُقطع عظام مشط اليد. حرّك الهدف للأعلى نحو وسط الرسغ.",
  ),
};
const HAND_Y = {
  low: T(
    "The central ray is too far toward the fingers (top of the detector view). The wrist and distal forearm may be clipped. Move the target down, toward the MCP joints.",
    "الشعاع المركزي أقرب إلى الأصابع من اللازم (أعلى عرض الكاشف). قد يُقطع الرسغ والجزء البعيد من الساعد. حرّك الهدف للأسفل نحو المفاصل المشطية السلامية (MCP).",
  ),
  high: T(
    "The central ray is too far toward the forearm (bottom of the detector view). The fingertips may be clipped. Move the target up, toward the MCP joints.",
    "الشعاع المركزي أقرب إلى الساعد من اللازم (أسفل عرض الكاشف). قد تُقطع أطراف الأصابع. حرّك الهدف للأعلى نحو المفاصل السلامية المشطية.",
  ),
};

/** Field edges shared by both projections of a family (the left / right edges are per projection). */
const WRIST_TOP_BOTTOM = {
  top: T("The top of the field cuts off the proximal metacarpals.", "الحافة العلوية للمجال تقطع قواعد عظام مشط اليد."),
  bottom: T("The bottom of the field cuts off the distal radius and ulna.", "الحافة السفلية للمجال تقطع النهايتين البعيدتين للكعبرة والزند."),
};
const HAND_TOP_BOTTOM = {
  top: T("The top of the field cuts off the fingertips.", "الحافة العلوية للمجال تقطع أطراف الأصابع."),
  bottom: T("The bottom of the field cuts off the wrist or the distal forearm (Bontrager asks for about 2.5 cm of distal forearm).", "الحافة السفلية للمجال تقطع الرسغ أو الجزء البعيد من الساعد (يطلب Bontrager نحو 2.5 سم من الجزء البعيد من الساعد)."),
};

/** Image criteria shared by all six exams, and the exposure criterion of the wrist (with its appearance wording) and of the hand / elbow (without, O35). */
const SHARPNESS = { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") };
const EXPOSURE_WRIST = { id: "exposure", description: T("Detector exposure near target with bony trabecular markings and soft-tissue margins visible (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف مع ظهور العلامات الترابيقية العظمية وحدود الأنسجة الرخوة (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") };
const EXPOSURE = { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") };
/** What a correct field covers (the coverage pass text), shared by both projections of the wrist and of the hand. */
const WRIST_COVERED = T("the distal radius and ulna, the carpals and the metacarpals shown", "النهايتان البعيدتان للكعبرة والزند وعظام الرسغ وعظام مشط اليد الظاهرة");
const HAND_COVERED = T("the entire hand and the wrist plus the required distal forearm", "اليد كاملة والرسغ مع الجزء البعيد المطلوب من الساعد");
const WRIST_COVERAGE = { id: "coverage", description: T("Distal radius and ulna, carpals and the metacarpals included (the baseline image ends at the proximal metacarpals)", "النهايتان البعيدتان للكعبرة والزند وعظام الرسغ وعظام مشط اليد ضمن الصورة (تنتهي الصورة المرجعية عند قواعد عظام مشط اليد)") };
const HAND_COVERAGE = { id: "coverage", description: T("Entire hand and wrist plus about 2.5 cm of distal forearm included", "اليد كاملة والرسغ مع نحو 2.5 سم من الجزء البعيد من الساعد ضمن الصورة") };

/** Per-projection facts: page, texts and numbers. */
const PER = {
  "wrist-pa": {
    page: "p.156",
    title: T("Adult Wrist X-ray — PA", "أشعة الرسغ للبالغ — PA"),
    // Detector region the baseline is drawn in (cm): the 690 × 980 px PA image at 0.01245 cm / px (S14.1c-7).
    region: { xCm: 4.7, yCm: 5, widthCm: 8.6, heightCm: 12.2 },
    // Midcarpal area read by eye on the baseline (u 0.53, v 0.40): y = 5 + 0.40 × 12.2 = 9.88 cm → -0.18; x = 4.7 + 0.53 × 8.59 = 9.25 cm → +0.03.
    target: { x: 0.03, y: -0.18 },
    name: T("PA", "PA"),
    centre: { label: T("Central ray — midcarpal area", "الشعاع المركزي — وسط الرسغ"), en: "the midcarpal area", ar: "وسط الرسغ", page: "midcarpal area", failTail: T(" on the middle of the carpals", " على منتصف عظام الرسغ") },
    kv: { full: [55, 65], partial: [50, 70] },
    excessCm: 3.5,
    projectionPass: T("Correct projection: wrist PA (palm down), as requested.", "الإسقاط صحيح: الرسغ بإسقاط PA (راحة اليد للأسفل) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (wrist PA, palm down). Re-position the hand and wrist as requested.",
      "الإسقاط لا يطابق الطلب (الرسغ بإسقاط PA، راحة اليد للأسفل). أعد وضع اليد والرسغ حسب الطلب.",
    ),
    rotationPass: T(
      "The wrist is square to the detector: the spaces between the proximal metacarpals are near-equal, their shafts show equal concavity on both sides, and the distal radius and ulna are separated (Bontrager p.156).",
      "الرسغ متعامد مع الكاشف: المسافات بين قواعد عظام مشط اليد متقاربة، ويظهر تقعر متساوٍ على جانبي أجسامها، والطرفان السفليان للكعبرة والزند منفصلان (Bontrager ص.156).",
    ),
    rotationFail: T(
      "The wrist is rotated. The spaces between the proximal metacarpals are unequal and the ulna moves over the radius, so the distal radius and ulna are no longer separated (Bontrager p.156). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the wrist). Full credit within ±2°, partial credit within ±5°.",
      "الرسغ مائل (دوران). أصبحت المسافات بين قواعد عظام مشط اليد غير متساوية وتحرك الزند فوق الكعبرة، فلم تعد النهايتان البعيدتان للكعبرة والزند منفصلتين (Bontrager ص.156). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للرسغ). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.",
    ),
    clippedSides: {
      ...WRIST_TOP_BOTTOM,
      left: T("The left side of the field (in the detector view) cuts off the ulnar side of the wrist.", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع جهة الزند من الرسغ."),
      right: T("The right side of the field (in the detector view) cuts off the thumb side of the wrist.", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع جهة الإبهام من الرسغ."),
    },
    centreX: WRIST_X,
    centreY: WRIST_Y,
    covered: WRIST_COVERED,
    defaultMarkerPosition: { L: { x: -0.62, y: 0 }, R: { x: 0.62, y: 0 } },
    imageCriteria: [
      { id: "rotation", description: T("True PA: equal concavity on both sides of the proximal metacarpal shafts, near-equal distances between the proximal metacarpals, distal radius and ulna separated", "إسقاط PA صحيح: تقعر متساوٍ على جانبي أجسام عظام مشط اليد القريبة، ومسافات متقاربة بين قواعدها، والطرفان السفليان للكعبرة والزند منفصلان") },
      WRIST_COVERAGE,
      SHARPNESS,
      EXPOSURE_WRIST,
    ],
  },
  "wrist-lateral": {
    page: "p.158",
    title: T("Adult Wrist X-ray — Lateral", "أشعة الرسغ للبالغ — جانبي"),
    // The 559 × 1400 px lateral image at 0.0125 cm / px; the region ends at the proximal metacarpal / forearm part of the image (rows 0–1000).
    region: { xCm: 5.5, yCm: 5, widthCm: 7, heightCm: 12.5 },
    // Midcarpal area read by eye (rows ≈ 470 of 1400): y = 5 + 470 × 0.0125 = 10.88 cm → -0.09; x ≈ 9.13 cm → +0.01.
    target: { x: 0.01, y: -0.09 },
    name: T("lateral", "جانبي"),
    centre: { label: T("Central ray — midcarpal area", "الشعاع المركزي — وسط الرسغ"), en: "the midcarpal area", ar: "وسط الرسغ", page: "midcarpal area", failTail: T(" on the middle of the carpals", " على منتصف عظام الرسغ") },
    kv: { full: [60, 70], partial: [55, 75] },
    excessCm: 3.5,
    projectionPass: T("Correct projection: wrist lateral (thumb up), as requested.", "الإسقاط صحيح: الرسغ بالإسقاط الجانبي (الإبهام لأعلى) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (wrist lateral, thumb up). Re-position the hand and wrist as requested.",
      "الإسقاط لا يطابق الطلب (الرسغ بالإسقاط الجانبي، الإبهام لأعلى). أعد وضع اليد والرسغ حسب الطلب.",
    ),
    rotationPass: T(
      "The wrist is a true lateral: the ulnar head lies over the distal radius and the proximal 2nd–5th metacarpals are superimposed (Bontrager p.158).",
      "الرسغ في إسقاط جانبي صحيح: رأس الزند فوق النهاية البعيدة للكعبرة وقواعد عظام مشط اليد من الثانية إلى الخامسة متراكبة (Bontrager ص.158).",
    ),
    rotationFail: T(
      "The wrist is rotated: the ulnar head is no longer over the distal radius and the proximal metacarpals are no longer superimposed (Bontrager p.158). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the wrist). Full credit within ±2°, partial credit within ±5°.",
      "الرسغ مائل (دوران): لم يعد رأس الزند فوق النهاية البعيدة للكعبرة ولم تعد قواعد عظام مشط اليد متراكبة (Bontrager ص.158). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للرسغ). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.",
    ),
    clippedSides: {
      ...WRIST_TOP_BOTTOM,
      left: T("The left side of the field (in the detector view) cuts off the edge of the wrist.", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع حافة الرسغ."),
      right: T("The right side of the field (in the detector view) cuts off the edge of the wrist.", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع حافة الرسغ."),
    },
    centreX: WRIST_X,
    centreY: WRIST_Y,
    covered: WRIST_COVERED,
    defaultMarkerPosition: { L: { x: -0.62, y: 0 }, R: { x: 0.62, y: 0 } },
    imageCriteria: [
      { id: "rotation", description: T("True lateral: ulnar head superimposed over the distal radius, proximal 2nd–5th metacarpals superimposed", "إسقاط جانبي صحيح: رأس الزند فوق النهاية البعيدة للكعبرة، وقواعد عظام مشط اليد من الثانية إلى الخامسة متراكبة") },
      WRIST_COVERAGE,
      SHARPNESS,
      EXPOSURE_WRIST,
    ],
  },
  "hand-pa": {
    page: "p.150",
    title: T("Adult Hand X-ray — PA", "أشعة اليد للبالغ — PA"),
    region: handRegion("pa"),
    // The baseline is placed so that its MCP target lies at the centre of the detector (hand-geometry.ts): normalised (0, 0).
    target: { x: 0, y: 0 },
    name: T("PA", "PA"),
    centre: { label: T("Central ray — third MCP joint", "الشعاع المركزي — المفصل المشطي السلامي (MCP) الثالث"), en: "the third metacarpophalangeal (MCP) joint", ar: "المفصل المشطي السلامي (MCP) الثالث", page: "third MCP joint", failTail: T("", "") },
    kv: { full: [55, 65], partial: [50, 70] },
    // Excess-collimation margin per side (ENGINE TEACHING CHOICE): the field is centred on the ray, the third MCP lies ≈ 2.7 cm nearer the fingertips than the middle of the region.
    excessCm: 3.5,
    projectionPass: T("Correct projection: hand PA (palm down, fingers slightly spread), as requested.", "الإسقاط صحيح: اليد بإسقاط PA (راحة اليد للأسفل والأصابع متباعدة قليلًا) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (hand PA, palm down). Re-position the hand as requested.",
      "الإسقاط لا يطابق الطلب (اليد بإسقاط PA، راحة اليد للأسفل). أعد وضع اليد حسب الطلب.",
    ),
    rotationPass: T(
      "The hand is square to the detector: the concavities of the metacarpal shafts and phalanges are symmetric and the soft tissue on each side of phalanges 2–5 is equal (Bontrager p.150).",
      "اليد متعامدة مع الكاشف: تقعرات أجسام عظام مشط اليد والسلاميات متماثلة والأنسجة الرخوة على جانبي السلاميات من 2 إلى 5 متساوية (Bontrager ص.150).",
    ),
    rotationFail: T(
      "The hand is rotated. The spaces between the metacarpal shafts and the digits are unequal and the soft tissue on the two sides of the phalanges is no longer equal (Bontrager p.150). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the hand). Full credit within ±2°, partial credit within ±5°.",
      "اليد مائلة (دوران). أصبحت المسافات بين أجسام عظام مشط اليد وبين الأصابع غير متساوية ولم تعد الأنسجة الرخوة على جانبي السلاميات متساوية (Bontrager ص.150). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه لليد). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.",
    ),
    clippedSides: {
      ...HAND_TOP_BOTTOM,
      left: T("The left side of the field (in the detector view) cuts off the little-finger side of the hand.", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع جهة الإصبع الصغير من اليد."),
      right: T("The right side of the field (in the detector view) cuts off the thumb side of the hand.", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع جهة الإبهام من اليد."),
    },
    centreX: HAND_X,
    centreY: HAND_Y,
    covered: HAND_COVERED,
    defaultMarkerPosition: { L: { x: -0.68, y: 0 }, R: { x: 0.8, y: 0 } },
    imageCriteria: [
      { id: "rotation", description: T("True PA: symmetric concavities of the metacarpal shafts and phalanges of digits 2–5, equal soft tissue on each side of the phalanges", "إسقاط PA صحيح: تقعرات متماثلة لأجسام عظام مشط اليد والسلاميات من 2 إلى 5، وأنسجة رخوة متساوية على جانبي السلاميات") },
      HAND_COVERAGE,
      SHARPNESS,
      EXPOSURE,
    ],
  },
  "hand-lateral": {
    page: "p.153",
    title: T("Adult Hand X-ray — Lateral (extension)", "أشعة اليد للبالغ — جانبي (بسط)"),
    region: handRegion("lateral"),
    target: { x: 0, y: 0 },
    name: T("lateral (extension)", "جانبي (بسط)"),
    centre: { label: T("Central ray — centre of the second to fifth MCP joints", "الشعاع المركزي — منتصف المفاصل السلامية المشطية من الثاني إلى الخامس"), en: "the centre of the second to fifth metacarpophalangeal (MCP) joints", ar: "منتصف المفاصل السلامية المشطية من الثاني إلى الخامس", page: "second–fifth MCP joints", failTail: T("", "") },
    kv: { full: [60, 70], partial: [55, 75] },
    // The field is centred on the ray and the MCP joints lie ≈ 5.6 cm nearer the fingertips than the middle of the region, so a correct attempt has a one-sided excess of that size (O40).
    excessCm: 6.5,
    projectionPass: T("Correct projection: hand lateral in extension (thumb side up, fingers and thumb extended), as requested.", "الإسقاط صحيح: اليد بالإسقاط الجانبي مع البسط (جهة الإبهام لأعلى والأصابع والإبهام ممدودة) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (hand lateral, fingers extended, thumb side up). Re-position the hand as requested.",
      "الإسقاط لا يطابق الطلب (اليد بالإسقاط الجانبي، الأصابع ممدودة، جهة الإبهام لأعلى). أعد وضع اليد حسب الطلب.",
    ),
    rotationPass: T(
      "The hand is a true lateral: the metacarpals and phalanges are superimposed and the distal radius and ulna are superimposed (Bontrager p.153).",
      "اليد في إسقاط جانبي صحيح: عظام مشط اليد والسلاميات متراكبة والطرفان السفليان للكعبرة والزند متراكبان (Bontrager ص.153).",
    ),
    rotationFail: T(
      "The hand is rotated: the metacarpals and phalanges are no longer superimposed and the distal radius and ulna are no longer superimposed (Bontrager p.153). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the hand). Full credit within ±2°, partial credit within ±5°.",
      "اليد مائلة (دوران): لم تعد عظام مشط اليد والسلاميات متراكبة ولم تعد النهايتان البعيدتان للكعبرة والزند متراكبتين (Bontrager ص.153). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه لليد). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.",
    ),
    clippedSides: {
      ...HAND_TOP_BOTTOM,
      left: T("The left side of the field (in the detector view) cuts off the edge of the hand.", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع حافة اليد."),
      right: T("The right side of the field (in the detector view) cuts off the edge of the hand.", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع حافة اليد."),
    },
    centreX: HAND_X,
    centreY: HAND_Y,
    covered: HAND_COVERED,
    defaultMarkerPosition: { L: { x: -0.49, y: 0 }, R: { x: 0.49, y: 0 } },
    imageCriteria: [
      { id: "rotation", description: T("True lateral (extension): metacarpals and phalanges superimposed, distal radius and ulna superimposed", "إسقاط جانبي صحيح (بسط): عظام مشط اليد والسلاميات متراكبة، والطرفان السفليان للكعبرة والزند متراكبان") },
      HAND_COVERAGE,
      SHARPNESS,
      EXPOSURE,
    ],
  },
  "elbow-ap": {
    page: "p.166",
    title: T("Adult Elbow X-ray — AP (extended)", "أشعة المرفق للبالغ — AP (ممدود)"),
    region: elbowRegion("ap"),
    // The baseline is placed so that its target lies at the centre of the detector (elbow-geometry.ts): normalised (0, 0).
    target: { x: 0, y: 0 },
    name: T("AP (extended)", "AP (ممدود)"),
    centre: {
      label: T("Central ray — mid-elbow joint (about 2 cm distal to the epicondyles)", "الشعاع المركزي — منتصف مفصل المرفق (نحو 2 سم أسفل اللقيمتين)"),
      en: "the mid-elbow joint, about 2 cm distal to the midpoint of the line between the epicondyles",
      ar: "منتصف مفصل المرفق، نحو 2 سم أسفل منتصف الخط بين اللقيمتين",
      page: "mid-elbow joint, about 2 cm distal to the epicondylar midpoint",
      failTail: T("", ""),
    },
    // BONTRAGER p.166: digital 70 ± 5 kV (analog 65–75). The partial band is an ENGINE TEACHING CHOICE.
    kv: { full: [65, 75], partial: [60, 80] },
    // Excess-collimation margin per side (ENGINE TEACHING CHOICE): the region is close to symmetric about the target; the marker needs ≈ 2 cm beside the region.
    excessCm: 3,
    projectionPass: T("Correct projection: elbow AP (fully extended, hand supinated), as requested.", "الإسقاط صحيح: المرفق بإسقاط AP (ممدود بالكامل وراحة اليد للأعلى) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (elbow AP, fully extended). Re-position the arm as requested.",
      "الإسقاط لا يطابق الطلب (المرفق بإسقاط AP، ممدود بالكامل). أعد وضع الذراع حسب الطلب.",
    ),
    rotationPass: T(
      "The elbow is square to the detector: the epicondyles are in profile and the radial head, neck and tubercle are separated from the ulna or only slightly superimposed by it (Bontrager p.166).",
      "المرفق متعامد مع الكاشف: اللقيمتان في وضع جانبي (بروفايل) ورأس الكعبرة وعنقها وحدبتها منفصلة عن الزند أو متراكبة معه قليلًا فقط (Bontrager ص.166).",
    ),
    rotationFail: T(
      "The elbow is rotated: the epicondyles are no longer in profile and the radial head, neck and tubercle are no longer separated from the ulna (Bontrager p.166). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the elbow). Full credit within ±2°, partial credit within ±5°.",
      "المرفق مائل (دوران): لم تعد اللقيمتان في وضع جانبي (بروفايل) ولم يعد رأس الكعبرة وعنقها وحدبتها منفصلة عن الزند (Bontrager ص.166). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للمرفق). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the distal humerus.", "الحافة العلوية للمجال تقطع العضد السفلي."),
      bottom: T("The bottom of the field cuts off the proximal radius and ulna.", "الحافة السفلية للمجال تقطع الكعبرة والزند العلويين."),
      left: T("The left side of the field (in the detector view) cuts off the medial side of the elbow (the medial epicondyle).", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الجهة الإنسية للمرفق (اللقيمة الإنسية)."),
      right: T("The right side of the field (in the detector view) cuts off the lateral side of the elbow (the lateral epicondyle).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع الجهة الوحشية للمرفق (اللقيمة الوحشية)."),
    },
    centreX: {
      label: T("Central ray — long axis of the arm", "الشعاع المركزي — المحور الطولي للذراع"),
      pass: T("The central ray is aligned with the long axis of the arm and forearm, centred on the detector's long axis (Bontrager).", "الشعاع المركزي محاذٍ للمحور الطولي للذراع والساعد ومتمركز على المحور الطولي للكاشف (Bontrager)."),
      fail: T("The central ray is off the long axis of the arm. Re-centre it.", "الشعاع المركزي بعيد عن المحور الطولي للذراع. أعد توسيطه."),
      low: T(
        "The central ray is shifted to the left of the elbow (the medial side in this view). The elbow sits off-centre and an epicondyle may be clipped. Move the target right, toward the mid-elbow.",
        "الشعاع المركزي مزاح إلى يسار المرفق (الجهة الإنسية في هذا العرض). يقع المرفق بعيدًا عن المركز وقد تُقطع إحدى اللقيمتين. حرّك الهدف يمينًا نحو منتصف المرفق.",
      ),
      high: T(
        "The central ray is shifted to the right of the elbow (the lateral side in this view). The elbow sits off-centre and an epicondyle may be clipped. Move the target left, toward the mid-elbow.",
        "الشعاع المركزي مزاح إلى يمين المرفق (الجهة الوحشية في هذا العرض). يقع المرفق بعيدًا عن المركز وقد تُقطع إحدى اللقيمتين. حرّك الهدف يسارًا نحو منتصف المرفق.",
      ),
    },
    centreY: {
      low: T(
        "The central ray is too far up the arm (top of the detector view). The proximal radius and ulna may be clipped. Move the target down, toward the mid-elbow joint.",
        "الشعاع المركزي أعلى الذراع أكثر من اللازم (أعلى عرض الكاشف). قد تُقطع الكعبرة والزند العلويان. حرّك الهدف للأسفل نحو منتصف مفصل المرفق.",
      ),
      high: T(
        "The central ray is too far down the forearm (bottom of the detector view). The distal humerus may be clipped. Move the target up, toward the mid-elbow joint.",
        "الشعاع المركزي أسفل الساعد أكثر من اللازم (أسفل عرض الكاشف). قد يُقطع العضد السفلي. حرّك الهدف للأعلى نحو منتصف مفصل المرفق.",
      ),
    },
    covered: T("the distal humerus, the elbow joint space and the proximal radius and ulna", "العضد السفلي وحيز مفصل المرفق والكعبرة والزند العلويين"),
    defaultMarkerPosition: { L: { x: -0.46, y: 0 }, R: { x: 0.46, y: 0 } },
    imageCriteria: [
      { id: "rotation", description: T("True AP: epicondyles in profile; radial head, neck and tubercle separated from the ulna or only slightly superimposed", "إسقاط AP صحيح: اللقيمتان في وضع جانبي (بروفايل)؛ رأس الكعبرة وعنقها وحدبتها منفصلة عن الزند أو متراكبة معه قليلًا فقط") },
      { id: "coverage", description: T("Distal humerus, elbow joint space and proximal radius and ulna included", "العضد السفلي وحيز مفصل المرفق والكعبرة والزند العلويين ضمن الصورة") },
      SHARPNESS,
      EXPOSURE,
    ],
  },
  "elbow-lateral": {
    page: "p.172",
    title: T("Adult Elbow X-ray — Lateral (flexed 90°)", "أشعة المرفق للبالغ — جانبي (مثني 90°)"),
    region: elbowRegion("lateral"),
    target: { x: 0, y: 0 },
    name: T("lateral (flexed 90°)", "جانبي (مثني 90°)"),
    centre: { label: T("Central ray — mid-elbow joint", "الشعاع المركزي — منتصف مفصل المرفق"), en: "the mid-elbow joint", ar: "منتصف مفصل المرفق", page: "mid-elbow joint", failTail: T("", "") },
    // BONTRAGER p.172: digital 70 ± 5 kV (analog 60–70). The partial band is an ENGINE TEACHING CHOICE.
    kv: { full: [65, 75], partial: [60, 80] },
    // The field is centred on the ray and the region is one-sided about the joint (forearm to the left, the back of the elbow to the right).
    excessCm: 4.5,
    projectionPass: T("Correct projection: elbow lateral (flexed 90°, thumb side up), as requested.", "الإسقاط صحيح: المرفق بالإسقاط الجانبي (مثني 90° وجهة الإبهام لأعلى) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (elbow lateral, flexed 90°, thumb side up). Re-position the arm as requested.",
      "الإسقاط لا يطابق الطلب (المرفق بالإسقاط الجانبي، مثني 90°، جهة الإبهام لأعلى). أعد وضع الذراع حسب الطلب.",
    ),
    rotationPass: T(
      "The elbow is a true lateral: the condyle outlines and epicondyles are superimposed and about half of the radial head is covered by the coronoid process (Bontrager p.172). (The concentric arcs of the trochlear sulcus, another Bontrager criterion, are not drawn in this simulator.)",
      "المرفق في إسقاط جانبي صحيح: حدود اللقمتين ونتوءاهما متراكبة ونحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي (Bontrager ص.172). (الأقواس المتحدة المركز لأخدود البكرة، وهي معيار آخر لدى Bontrager، لا يرسمها هذا المحاكي.)",
    ),
    rotationFail: T(
      "The elbow is rotated: the condyle outlines and epicondyles are no longer superimposed and the radial head is no longer about half covered by the coronoid process (Bontrager p.172). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the elbow). Full credit within ±2°, partial credit within ±5°.",
      "المرفق مائل (دوران): لم تعد حدود اللقمتين ونتوءاهما متراكبة ولم يعد نحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي (Bontrager ص.172). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للمرفق). درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the distal humerus.", "الحافة العلوية للمجال تقطع العضد السفلي."),
      bottom: T("The bottom of the field cuts off the olecranon (the point of the elbow).", "الحافة السفلية للمجال تقطع الناتئ الزُّجّي للزند (نتوء المرفق)."),
      left: T("The left side of the field (in the detector view) cuts off the proximal forearm.", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الساعد العلوي."),
      right: T("The right side of the field (in the detector view) cuts off the back of the elbow (the olecranon).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع خلف المرفق (الناتئ الزُّجّي للزند)."),
    },
    centreX: {
      label: T("Central ray — mid-elbow joint, side to side in the view", "الشعاع المركزي — منتصف مفصل المرفق، من اليسار إلى اليمين في العرض"),
      pass: T("The central ray is at the mid-elbow joint from side to side in the detector view (Bontrager).", "الشعاع المركزي عند منتصف مفصل المرفق من اليسار إلى اليمين في عرض الكاشف (Bontrager)."),
      fail: T("The central ray is off the mid-elbow joint from side to side. Re-centre it.", "الشعاع المركزي بعيد عن منتصف مفصل المرفق من اليسار إلى اليمين. أعد توسيطه."),
      low: T(
        "The central ray is shifted to the left of the joint (toward the forearm). The olecranon (the point of the elbow) may be clipped. Move the target right, toward the mid-elbow joint.",
        "الشعاع المركزي مزاح إلى يسار المفصل (نحو الساعد). قد يُقطع الناتئ الزُّجّي للزند (نتوء المرفق). حرّك الهدف يمينًا نحو منتصف مفصل المرفق.",
      ),
      high: T(
        "The central ray is shifted to the right of the joint (toward the back of the elbow). The proximal forearm may be clipped. Move the target left, toward the mid-elbow joint.",
        "الشعاع المركزي مزاح إلى يمين المفصل (نحو خلف المرفق). قد يُقطع الساعد العلوي. حرّك الهدف يسارًا نحو منتصف مفصل المرفق.",
      ),
    },
    centreY: {
      low: T(
        "The central ray is too far up the arm (top of the detector view). The olecranon may be clipped. Move the target down, toward the mid-elbow joint.",
        "الشعاع المركزي أعلى الذراع أكثر من اللازم (أعلى عرض الكاشف). قد يُقطع الناتئ الزُّجّي للزند. حرّك الهدف للأسفل نحو منتصف مفصل المرفق.",
      ),
      high: T(
        "The central ray is too far down (bottom of the detector view). The distal humerus may be clipped. Move the target up, toward the mid-elbow joint.",
        "الشعاع المركزي أسفل أكثر من اللازم (أسفل عرض الكاشف). قد يُقطع العضد السفلي. حرّك الهدف للأعلى نحو منتصف مفصل المرفق.",
      ),
    },
    covered: T("the distal humerus and the proximal forearm including the olecranon", "العضد السفلي والساعد العلوي بما فيه الناتئ الزُّجّي للزند"),
    // AP: the L on the viewer's left; lateral: both letters on the right, the only side with room inside a correct field.
    defaultMarkerPosition: { L: { x: 0.35, y: 0 }, R: { x: 0.35, y: 0 } },
    imageCriteria: [
      { id: "rotation", description: T("True lateral (90° flexion): epicondyles / condyle outlines superimposed; about half of the radial head covered by the coronoid process", "إسقاط جانبي صحيح (انثناء 90°): اللقيمتان وحدودهما متراكبة؛ ونحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي") },
      { id: "coverage", description: T("Distal humerus and proximal forearm including the olecranon included", "العضد السفلي والساعد العلوي بما فيه الناتئ الزُّجّي للزند ضمن الصورة") },
      SHARPNESS,
      EXPOSURE,
    ],
  },
} as const;

type Per = (typeof PER)[UpperLimbKind];

/** Per-body-part words, references and numbers; everything that differs between the wrist, the hand and the elbow but not by projection. */
const FAMILY = {
  wrist: {
    bodyPart: "wrist",
    reference: "docs/RAD-LAB_Medical_Reference_Wrist.md",
    decisions: "S14.1-*, S14.1b-*, S14.1c-*",
    projections: ["wrist-pa", "wrist-lateral"],
    // BONTRAGER-9 p.156 / 158: 18 × 24 cm receptor, portrait, the smallest available.
    detector: { widthCm: 18, heightCm: 24 },
    // ENGINE TEACHING CHOICE: ≈ ±0.7 cm / ±0.9 cm full credit, ≈ ±1.8 cm / ±2.2 cm half credit on the 18 × 24 cm detector.
    idealTolerance: { x: 0.08, y: 0.075 },
    acceptableTolerance: { x: 0.2, y: 0.185 },
    part: T("wrist", "الرسغ"),
    // Arabic forms: «أي رسغ», «للرسغ», «هذا هو الرسغ الأيسر».
    which: "رسغ",
    forPart: "للرسغ",
    sideIs: "هذا هو الرسغ الأيسر",
    // The part named in the SID "shorter than the minimum" sentence.
    sidForPart: "للرسغ",
    moving: T("hand", "اليد"),
    excessToward: T("wrist and hand", "الرسغ واليد"),
    // The margin number in the Arabic sentence (the wrist text has no direction marks around it).
    excessAr: (cm: number) => `${cm}`,
    excessNoteTail: "",
    clipRef: () => "collimate on all four sides to include the distal radius and ulna and the mid-metacarpal area",
    clipNote:
      "The required anatomy is Bontrager's criterion; the region used is LIMITED BY THE BASELINE IMAGE (it ends at the proximal metacarpals, so the mid-metacarpal area cannot be shown, S14.1c-7, O28).",
    markerRefTail: "",
    wrongSideRef: "S14.1-4, S14.1b-1, S14.1c-4",
    missingRef: "S14.1-4, S14.1b-1",
    rotationLabel: T("Wrist rotation", "دوران الرسغ"),
    rotationRef: "S14.1c-2, S14.1c-5",
    rotatedError: T("Wrist rotation", "دوران الرسغ"),
    centreXRef: "hand and wrist long axis aligned with and centred on the receptor long axis",
    targetNoun: "The midcarpal target",
    techniqueRef: "S14.1-4, S14.1c-6",
    teachingRef: "S14.1c-6",
    exposureLow: T("the bony trabecular markings and soft-tissue margins are harder to see", "وتصعب رؤية العلامات الترابيقية العظمية وحدود الأنسجة الرخوة"),
    exposureRefTail: "",
    exposureNoteTail: "",
  },
  hand: {
    bodyPart: "hand",
    reference: "docs/RAD-LAB_Medical_Reference_Hand.md",
    decisions: "S14.2-*",
    projections: ["hand-pa", "hand-lateral"],
    // BONTRAGER-9 p.150 / 153: 24 × 30 cm receptor, portrait (the smallest available receptor is used and the beam is collimated).
    detector: { ...HAND_DETECTOR },
    // ENGINE TEACHING CHOICE: ≈ ±0.7 cm / ±0.75 cm full credit, ≈ ±1.8 cm / ±1.8 cm half credit on the 24 × 30 cm detector.
    idealTolerance: { x: 0.06, y: 0.05 },
    acceptableTolerance: { x: 0.15, y: 0.12 },
    part: T("hand", "اليد"),
    which: "يد",
    forPart: "لليد",
    sideIs: "هذه هي اليد اليسرى",
    sidForPart: "لليد",
    moving: T("hand", "اليد"),
    excessToward: T("hand", "اليد"),
    excessAr: (cm: number) => `‎${cm}‎`,
    excessNoteTail: " The field is centred on the central ray, so a one-sided margin is unavoidable (S14.2-10, O40).",
    clipRef: () => "collimate on all four sides to the outer margins of the hand and wrist; entire hand and wrist plus about 2.5 cm of distal forearm",
    clipNote:
      "The required anatomy is Bontrager's criterion. The 2.5 cm of distal forearm is Bontrager's 'about'.",
    markerRefTail: ", S14.2-2",
    wrongSideRef: "S14.2-5, S14.2-8, S14.1c-4",
    missingRef: "S14.2-5",
    rotationLabel: T("Hand rotation (forearm turn)", "دوران اليد (دوران الساعد)"),
    rotationRef: "S14.2-3, S14.2-11",
    rotatedError: T("Hand rotation", "دوران اليد"),
    centreXRef: "hand and forearm long axis aligned with and centred on the receptor long axis",
    targetNoun: "The target joint",
    techniqueRef: "S14.2a, S14.2-10",
    teachingRef: "S14.2-10",
    exposureLow: T("fine detail is harder to see", "وتصعب رؤية التفاصيل الدقيقة"),
    exposureRefTail: ", O35",
    exposureNoteTail: ", and no hand source for the exposure appearance, O35",
  },
  elbow: {
    bodyPart: "elbow",
    reference: "docs/RAD-LAB_Medical_Reference_Elbow.md",
    decisions: "S14.3-*",
    projections: ["elbow-ap", "elbow-lateral"],
    // BONTRAGER-9 p.166 / 172: 24 × 30 cm receptor, portrait (the smallest available receptor is used and the beam is collimated).
    detector: { ...ELBOW_DETECTOR },
    // ENGINE TEACHING CHOICE: ≈ ±0.7 cm / ±0.75 cm full credit, ≈ ±1.8 cm / ±1.8 cm half credit on the 24 × 30 cm detector.
    idealTolerance: { x: 0.06, y: 0.05 },
    acceptableTolerance: { x: 0.15, y: 0.12 },
    part: T("elbow", "المرفق"),
    which: "مرفق",
    forPart: "للمرفق",
    sideIs: "هذا هو المرفق الأيسر",
    sidForPart: "للمرفق",
    moving: T("arm", "الذراع"),
    excessToward: T("elbow", "المرفق"),
    excessAr: (cm: number) => `‎${cm}‎`,
    excessNoteTail: " The field is centred on the central ray, so a one-sided margin can be unavoidable (S14.3-9, O40).",
    clipRef: (p: Per) => `collimate on all four sides to the area of interest; ${p.covered.en}`,
    clipNote:
      "The required anatomy is Bontrager's criterion.",
    markerRefTail: ", S14.3-5",
    wrongSideRef: "S14.3-5, S14.1c-4",
    missingRef: "S14.3-5",
    rotationLabel: T("Elbow rotation (arm turn)", "دوران المرفق (دوران الذراع)"),
    rotationRef: "S14.3-5, S14.3-10",
    rotatedError: T("Elbow rotation", "دوران المرفق"),
    centreXRef: "elbow joint centred on the receptor",
    targetNoun: "The target joint",
    techniqueRef: "S14.2b phase 2, S14.3-9",
    teachingRef: "S14.3-9",
    exposureLow: T("fine detail is harder to see", "وتصعب رؤية التفاصيل الدقيقة"),
    exposureRefTail: ", O35",
    exposureNoteTail: ", and no hand source for the exposure appearance, O35",
  },
} as const;

const positioning = (k: UpperLimbKind): PositioningSpec => {
  const f = FAMILY[familyOf(k)];
  return {
    centering: {
      target: PER[k].target,
      idealTolerance: f.idealTolerance,
      acceptableTolerance: f.acceptableTolerance,
    },
    minCollimation: 0.3,
    markerSizeCm: 1.8,
    // Display halves are NOT part of the single-limb rule (O21 option A, S14.1c-4, S14.2-2, S14.3-5): the letter alone is judged. `markerSide`
    // only places the default marker of each letter at the edge of the field, clear of the anatomy.
    markerSide: { L: "viewer-left", R: "viewer-right" },
    defaultMarkerPosition: PER[k].defaultMarkerPosition,
    // Left limb in v1 (S14.1c-1, S14.2-8, S14.3-5): the letter must be L. A right-limb case needs the side on the case (O29).
    markerRule: { kind: "fixed-side", side: "L" },
  };
};

const criticalFindings = (k: UpperLimbKind): CriticalFindingRule[] => {
  const f = FAMILY[familyOf(k)];
  return [
    wrongProjectionFinding(PER[k].page),
    patientMotionFinding(PER[k].page),
    {
      id: "wrong-side-marker",
      label: T("Wrong-side marker", "علامة جانب خاطئة"),
      reason: T(
        `Critical finding — wrong-side marker: the marker letter does not match the patient's side (this is the LEFT ${f.part.en}). A wrong marker misidentifies the patient's side, so the attempt is below the pass mark whatever the numeric score. This is an educational result, not a clinical decision about the image.`,
        `ملاحظة حرجة — علامة جانب خاطئة: حرف العلامة لا يطابق جانب المريض (${f.sideIs}). العلامة الخاطئة تُحدِّد جانب المريض خطأً، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.`,
      ),
      concept: ev("common-reference", `BONTRAGER-9 p.32-33, 36, ${PER[k].page}`, `COMMON QUALITY CRITERION: an anatomic side marker is required on every image and must name the side imaged. For a single limb Bontrager gives no viewer-half convention, so only the letter is judged (O21 option A, S14.1c-4${f.markerRefTail}).`),
      evidence: ev("provisional", f.wrongSideRef, "The numeric score is unchanged."),
    },
    {
      id: "missing-marker",
      label: T("Missing marker", "علامة جانب غير موضوعة"),
      reason: T(
        `Critical finding — no side marker: the image would not say which ${f.part.en} it shows. The attempt is below the pass mark whatever the numeric score. A missing marker is a critical error to correct in training; this is an educational result, not a clinical decision about the image.`,
        `ملاحظة حرجة — لا توجد علامة جانب: لن تبيّن الصورة أي ${f.which} تُظهر. تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. غياب العلامة خطأ مهم يجب تصحيحه في التدريب، وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.`,
      ),
      concept: ev("common-reference", `BONTRAGER-9 p.32-33, 36, ${PER[k].page}`, "COMMON QUALITY CRITERION: the image must carry a side marker."),
      evidence: ev("provisional", f.missingRef, "Same severity as the wrong-side marker. The numeric score is unchanged."),
    },
  ];
};

const rules = (k: UpperLimbKind): CheckRule[] => {
  const p: Per = PER[k];
  const f = FAMILY[familyOf(k)];
  const pg = p.page;
  const [kvLo, kvHi] = p.kv.full;
  const [pLo, pHi] = p.kv.partial;
  return [
    {
      id: "projection",
      kind: "equals",
      category: "positioning",
      weight: 2,
      setting: "projection",
      expected: k,
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
        pass: T(`The field covers ${p.covered.en}.`, `المجال يغطي ${p.covered.ar}.`),
        fail: familyOf(k) === "wrist" ? T("Adjust only the named clipped edges outward, or re-centre the ray. Keep the required anatomy and marker included; reduce any edges identified as excessive separately.", "حرّك حواف القص المذكورة فقط إلى الخارج، أو أعد توسيط الشعاع. أبقِ التشريح المطلوب والعلامة داخل المجال، وضيّق حواف الزيادة المذكورة بشكل مستقل.") : T("Anatomy outside the field is missing from the image. Open the field or re-centre the central ray.", "التشريح الواقع خارج المجال يغيب عن الصورة. وسّع المجال أو أعد توسيط الشعاع المركزي."),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (${f.clipRef(p)})`, f.clipNote),
    },
    {
      id: "collimation-excess",
      kind: "coverage",
      check: "excess",
      category: "positioning",
      weight: 1,
      maxMarginCm: p.excessCm,
      ...(familyOf(k) === "wrist" ? { excessSides: {
        left: T("Too wide at the left edge: move that edge inward without clipping anatomy or the marker.", "المجال واسع أكثر من اللازم عند الحافة اليسرى: حرّكها للداخل دون قطع التشريح أو العلامة."),
        right: T("Too wide at the right edge: move that edge inward without clipping anatomy or the marker.", "المجال واسع أكثر من اللازم عند الحافة اليمنى: حرّكها للداخل دون قطع التشريح أو العلامة."),
        top: T("Too wide at the top edge: move that edge inward without clipping anatomy or the marker.", "المجال واسع أكثر من اللازم عند الحافة العلوية: حرّكها للداخل دون قطع التشريح أو العلامة."),
        bottom: T("Too wide at the bottom edge: move that edge inward without clipping anatomy or the marker.", "المجال واسع أكثر من اللازم عند الحافة السفلية: حرّكها للداخل دون قطع التشريح أو العلامة."),
      } } : {}),
      beyondNeeded: true, // S2: an opening the geometry forces (field centred on the ray) or the marker needs is not excess.
      label: T("Collimation — field size", "التحديد — حجم المجال"),
      feedback: {
        pass: T("The field is not larger than necessary for the required anatomy.", "المجال ليس أكبر من اللازم للتشريح المطلوب."),
        fail: T("The field is opened wider than necessary.", "المجال مفتوح أكثر من اللازم."),
        high: T(
          `The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the ${f.excessToward.en}, without cutting off the required anatomy. (Margin limit: ${p.excessCm} cm; the field must still include the marker.)`,
          `المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من ${f.excessToward.ar} دون أن تقطع التشريح المطلوب. (حدّ الهامش ${f.excessAr(p.excessCm)} سم؛ ويجب أن يشمل المجال العلامة.)`,
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (collimate to the area of interest)`, `Principle from the textbook. Margin limit: ${p.excessCm} cm.${f.excessNoteTail}`),
    },
    {
      id: "side-marker",
      kind: "marker",
      category: "positioning",
      weight: 1,
      label: T("Side marker (patient's side)", "علامة الجانب (جانب المريض)"),
      feedback: {
        pass: T(
          `Marker placed inside the field, clear of the ${f.part.en} anatomy, with the letter of the patient's side (left). For a single limb no left or right half of the image is required in this simulator (Bontrager gives none).`,
          `العلامة موضوعة داخل المجال بعيدًا عن تشريح ${f.part.ar} وبحرف جانب المريض (الأيسر). لا يُشترط في هذا المحاكي نصف أيسر أو أيمن من الصورة لطرف واحد (لا يذكره Bontrager).`,
        ),
        fail: T(
          `No side marker placed. Choose the letter of the patient's side (this is the left ${f.part.en}) and place it inside the field.`,
          `لم توضع علامة جانب. اختر حرف جانب المريض (${f.sideIs}) وضعه داخل المجال.`,
        ),
        overlap: T(`The marker covers the ${f.part.en} anatomy. Move it to the edge of the field, away from the required anatomy.`, `العلامة تغطي تشريح ${f.part.ar}. انقلها إلى حافة المجال بعيدًا عن التشريح المطلوب.`),
        wrongSide: T(
          `The marker letter does not match the patient's side: this is the LEFT ${f.part.en}. A wrong marker misidentifies the patient's side.`,
          `حرف العلامة لا يطابق جانب المريض: ${f.sideIs}. العلامة الخاطئة تُحدِّد جانب المريض خطأً.`,
        ),
        outsideField: T("The marker is outside the collimated field, so it would not be recorded on the image. Move it inside the field.", "العلامة خارج المجال المحدَّد فلن تُسجَّل على الصورة. انقلها إلى داخل المجال."),
      },
      evidence: ev("provisional", `BONTRAGER-9 p.32-33, 36, ${pg}; S14.1b-1 (O21 option A), S14.1c-4${f.markerRefTail}`, "Presence, side and placement (inside the field, not over the anatomy) follow Bontrager's general marker rule; the single-limb display convention is NOT given, so no viewer-half check is made."),
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
          `The patient was not clearly asked to stay still, so in this simulation the ${f.moving.en} moves during the exposure. Movement causes a loss of sharpness (blur) that can hide fine bone detail. Ask the patient to keep the ${f.moving.en} still.`,
          `لم يُطلب من المريض بوضوح أن يبقى ثابتًا، فتتحرك ${f.moving.ar} أثناء التعريض في هذه المحاكاة. تسبب الحركة فقدانًا في الحدّة (ضبابية) قد يخفي التفاصيل العظمية الدقيقة. اطلب من المريض إبقاء ${f.moving.ar} ثابتة.`,
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (no motion); Image-quality ref (Motion)`, "Motion reduces sharpness. Deliberately unscored (no rubric exists)."),
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
      label: f.rotationLabel,
      // MAGNITUDE-ONLY (S14.1c-2, S14.2-3, S14.3-5): Bontrager gives no direction rule for these limbs, so there is no `low` / `high` text.
      feedback: { pass: p.rotationPass, fail: p.rotationFail },
      evidence: ev(
        "provisional",
        `BONTRAGER-9 ${pg}; ${f.rotationRef}`,
        "The criteria are Bontrager's (Bontrager gives no angle). The sign of the value is defined by the RESULT IMAGE (positive = toward the viewer's right); no direction of turn is claimed.",
      ),
    },
    {
      id: "centering-lateral",
      kind: "centering",
      axis: "x",
      category: "centering",
      label: p.centreX.label,
      feedback: {
        pass: p.centreX.pass,
        fail: p.centreX.fail,
        low: p.centreX.low,
        high: p.centreX.high,
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (${f.centreXRef})`, "Alignment is Bontrager's."),
    },
    {
      id: "centering-vertical",
      kind: "centering",
      axis: "y",
      category: "centering",
      label: p.centre.label,
      feedback: {
        pass: T(`The central ray is at about ${p.centre.en}, perpendicular to the detector (Bontrager).`, `الشعاع المركزي عند ${p.centre.ar} تقريبًا وعمودي على الكاشف (Bontrager).`),
        fail: T(`The central ray is off ${p.centre.en}. Re-centre it${p.centre.failTail.en}.`, `الشعاع المركزي بعيد عن ${p.centre.ar}. أعد توسيطه${p.centre.failTail.ar}.`),
        low: p.centreY.low,
        high: p.centreY.high,
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (central ray perpendicular to the ${p.centre.page})`, `${f.targetNoun} is Bontrager's; its position on the detector is read by eye on the baseline.`),
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
          `kVp is inside Bontrager's digital band for the ${p.name.en} ${f.part.en} (${kvLo}–${kvHi} kV).`,
          `قيمة kVp ضمن نطاق Bontrager الرقمي ${f.forPart} ${p.name.ar} (‎${kvLo}–${kvHi}‎ kV).`,
        ),
        low: T(
          `kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only ${kvLo}–${kvHi} kV is the textbook digital band; ${pLo}–${kvLo - 1} kV earns partial credit.)`,
          `قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎${kvLo}–${kvHi}‎ kV فقط؛ وتُمنح درجة جزئية بين ‎${pLo}‎ و‎${kvLo - 1}‎ kV.)`,
        ),
        high: T(
          `kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only ${kvLo}–${kvHi} kV is the textbook digital band; partial credit applies up to ${pHi} kV.)`,
          `قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎${kvLo}–${kvHi}‎ kV فقط؛ وتُمنح درجة جزئية حتى ‎${pHi}‎ kV.)`,
        ),
        fail: T(`kVp is outside this case's protocol range for the ${f.part.en} (${pLo}–${pHi} kV).`, `قيمة kVp خارج نطاق بروتوكول هذه الحالة ${f.forPart} (‎${pLo}–${pHi}‎ kV).`),
      },
      evidence: ev("provisional", `BONTRAGER-9 ${pg} (digital ${(kvLo + kvHi) / 2} ± 5 kV); ${f.techniqueRef}`, `${kvLo}–${kvHi} kV is Bontrager. kVp physics is never mapped to displayed darkness.`),
    },
    {
      id: "exposure-adequacy",
      kind: "technique",
      check: "exposure-adequacy",
      category: "exposure",
      weight: 2,
      variantOnLow: "low-exposure",
      label: T("Detector exposure — adequate signal", "تعريض الكاشف — إشارة كافية"),
      // The hand and the elbow have no exposure-APPEARANCE wording of their own (O35): only the general digital-exposure principle.
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
          `Detector exposure is below the target (negative DI). Fewer photons reach the detector, so quantum noise rises and ${f.exposureLow.en}. Digital processing can still make the image look acceptable, so judge exposure by the detector exposure / DI, not by displayed brightness. Bring the exposure back toward the target (mAs or SID).`,
          `تعريض الكاشف أقل من الهدف (DI سالب). يصل عدد أقل من الفوتونات إلى الكاشف فيزداد الضجيج الكمّي ${f.exposureLow.ar}. يمكن لمعالجة الصورة الرقمية أن تُظهرها مقبولة رغم ذلك، لذا احكم على التعريض من تعريض الكاشف/DI وليس من سطوع الصورة المعروضة. أعد التعريض نحو الهدف (mAs أو SID).`,
        ),
        fail: T("Detector exposure is well below the target: the image would be noisy.", "تعريض الكاشف أقل بكثير من الهدف: ستكون الصورة مليئة بالضجيج."),
      },
      evidence: ev(
        "provisional",
        `Technique ref §5, §6, §8; S10b-9; ${f.teachingRef}; O26${f.exposureRefTail}`,
        `The DI equation and the digital-exposure concepts; no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the ${f.part.en}${f.exposureNoteTail}).`,
      ),
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
      evidence: ev("provisional", `Technique ref §7, §8; ${f.teachingRef}`, "Digital dynamic range can hide excess exposure (dose creep). No patient dose is calculated."),
    },
    {
      id: "sid",
      kind: "range",
      category: "sid",
      setting: "sidCm",
      // RAD-081 owner decision (2026-10-25), PROVISIONAL: accept 100 cm as the practical rounded counterpart of Bontrager's
      // 40 in (wrist p.156 / 158, hand p.150 / 153, elbow p.166 / 172). Owner supplied Radiopaedia wrist PA/lateral SID 100 cm:
      // https://images.radiopaedia.org/articles/wrist-pa-view-2 ; https://radiopaedia.org/articles/wrist-lateral-view-2
      // These wrist citations are not a new hand/elbow source: the owner extends this grading band to all extremities.
      // The upper full-credit limit (110 cm) and partial band (95–130 cm) remain teaching choices. TODO(medical-review).
      ideal: [100, 110],
      acceptable: [95, 130],
      unit: "cm",
      variantOnLow: "magnified-geometry",
      label: T("Source-to-image distance (SID)", "المسافة بين المصدر والكاشف (SID)"),
      feedback: {
        pass: T("SID is within the full-credit band (100–110 cm).", "قيمة SID ضمن نطاق الدرجة الكاملة (100–110 سم)."),
        low: T(
          `SID for the ${f.part.en} is below the full-credit band (100–110 cm). A shorter distance increases magnification and unsharpness (not drawn in this version) and raises the exposure at the detector (inverse square).`,
          `قيمة SID ${f.sidForPart} أقل من نطاق الدرجة الكاملة (100–110 سم). المسافة الأقصر تزيد التكبير وعدم الحدّة (لا يُرسمان في هذه النسخة) وتزيد التعريض عند الكاشف (قانون التربيع العكسي).`,
        ),
        high: T(
          "SID is longer than this simulator's teaching band (100–110 cm); exposure at the detector drops (inverse square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum.)",
          "قيمة SID أطول من النطاق التعليمي في المحاكي (100–110 سم)؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط.)",
        ),
        fail: T(`SID is outside this case's protocol range for the ${f.part.en} (below about 95 cm or above 130 cm).`, `قيمة SID خارج نطاق بروتوكول هذه الحالة ${f.forPart} (أقل من نحو 95 سم أو أكثر من 130 سم).`),
      },
      evidence: ev("provisional", `BONTRAGER-9 ${pg} (SID 40 in); Radiopaedia wrist PA/lateral (100 cm, owner-supplied); Owner decision 2026-10-25 (100–110 cm); ${f.techniqueRef}`, "The full-credit band is 100–110 cm. The 100 cm threshold is accepted as practical rounding of the 40 in convention; the upper limit and 95–130 cm acceptable band are unchanged."),
    },
  ];
};

/** One upper-limb exam. The six instances are `wrist-pa.ts`, `wrist-lateral.ts`, `hand-pa.ts`, `hand-lateral.ts`, `elbow-ap.ts` and `elbow-lateral.ts`. */
export function makeUpperLimbExam(k: UpperLimbKind): AnyExamDefinition {
  const p = PER[k];
  const f = FAMILY[familyOf(k)];
  return {
    schemaVersion: 1,
    id: k,
    modality: "general-radiography",
    bodyPart: f.bodyPart,
    provisional: true,
    evidence: {
      status: "provisional",
      reference: `${f.reference}; BONTRAGER-9 ${p.page}; docs/DECISIONS.md ${f.decisions}`,
      note: "Exam-level classification: provisional until the educator / medical-physicist review is signed off. Every rule, tolerance and feedback sentence carries its own evidence class.",
    },
    defaultCaseId: "adult-demo",
    title: p.title,
    requiredProjection: k,
    // Both projections are selectable so that a wrong projection is possible; no breathing (S14.1b), so no `availableBreathing`.
    availableProjections: [...f.projections],
    availableMotionInstructions: ["none", "remain-still", "relax-and-move"],
    detector: { ...f.detector },
    requiredAnatomy: { ...p.region },
    controls: {
      rotationDeg: { min: -15, max: 15, step: 1 },
      sidCm: { min: 80, max: 200, step: 1 },
      kvp: { min: 40, max: 100, step: 1 },
      // mAs steps through a preferred-number series, like a console; the range is hardware, not a target.
      mas: { min: 0.5, max: 25, step: 0.5, stations: MAS_STATIONS },
      // No tubeAngulationDeg: the central ray is perpendicular (Bontrager), so the control is not offered.
    },
    technique: upperLimbTechnique(k),
    positioning: positioning(k),
    rules: rules(k),
    scoring: {
      // S14.1b-1 option A (engine teaching choice, kept for the hand S14.2-5 and the elbow S14.3-5): the PA weights without breathing, redistributed proportionally.
      categoryWeights: { positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 },
      passThreshold: 70,
      criticalFindings: criticalFindings(k),
    },
    possibleErrors: [
      { id: "rotated", variant: "rotated", description: f.rotatedError },
      { id: "clipped", variant: "clipped", description: T("Anatomy clipped by centering or collimation", "قطع التشريح بسبب التوسيط أو التحديد") },
      { id: "motion", variant: "motion", description: T("Patient motion (loss of sharpness)", "حركة المريض (فقدان الحدّة)") },
      { id: "low-exposure", variant: "low-exposure", description: T("Low detector exposure (increased quantum noise)", "تعريض كاشف منخفض (ضجيج كمّي متزايد)") },
      { id: "excess-exposure", variant: "excess-exposure", description: T("Excess detector exposure (dose-creep risk; may look acceptable after processing)", "تعريض كاشف زائد (خطر زحف الجرعة؛ قد تبدو الصورة مقبولة بعد المعالجة)") },
      { id: "low-penetration", variant: "low-penetration", description: T("Insufficient beam penetration (kVp too low)", "اختراق غير كافٍ للحزمة (kVp منخفض)") },
    ],
    imageCriteria: [...p.imageCriteria],
    scene: { id: k },
    render: { renderer: "radiograph-2d" },
  };
}
