import type { CheckRule, CriticalFindingRule, PositioningSpec } from "@/domain/case";
import type { AnyExamDefinition } from "@/domain/exam";
import type { LocalizedText } from "@/domain/localized";
import type { Evidence } from "@/domain/technique";
import { ELBOW_DETECTOR, elbowRegion, type ElbowKind } from "./elbow-geometry";
import { elbowApTechnique, elbowLateralTechnique } from "./elbow-technique";

/**
 * The two ELBOW exams, `elbow-ap` (fully extended, supinated) and `elbow-lateral` (flexed 90°, thumb side up) (S14.3; reference
 * `docs/RAD-LAB_Medical_Reference_Elbow.md`, decisions S14.3-1…). Same pattern as the wrist and hand builders (`wrist-common.ts`,
 * `hand-common.ts`): one builder, two instances; the rules, texts and numbers that differ by projection are in `PER`; everything else is
 * shared so the two exams cannot drift apart. Each exam still has its own file, case, tests and commit.
 *
 * Governing authority: BONTRAGER-9 p.166 (AP elbow, fully extended) and p.172 (lateromedial elbow, 90° flexion), cited by printed page
 * (S10b-25). Every clinical value is PROVISIONAL until the educator / medical-physicist review (O5). Labels used below: BONTRAGER = taken
 * from the textbook page; ENGINE TEACHING CHOICE (S12-1) = the simulator's own number, named as such in the learner-visible feedback text and
 * in `REVIEW_PACKAGE.md`: the kV partial bands, the SID band above the 102 cm minimum, the rotation tolerances (±2° / ±5°), the centring
 * tolerances, the excess-collimation margins (AP 3 cm, lateral 4.5 cm), the extent of the required region, the 28 / 22 / 17 / 22 / 11 category
 * weights and the manual reference point. Manual technique only (no AEC, no grid control, no tube-angle control: the central ray is
 * perpendicular), no chin / shoulder / breathing. Shielding, anode-heel placement, fat-pad visibility, arm / shoulder position and the flexion
 * angle are NOT scored in v1 (S14.3-5). No exposure-appearance wording (trabecular / soft-tissue-margin text of the wrist) is used: the
 * reference has no elbow source for it (O35).
 * Arabic text is DRAFT pending owner / educator review (use «الكاشف»; male forms for the male patient).
 * TODO(medical-review): validate with a radiography educator before release.
 */
export type { ElbowKind };

const MAS_STATIONS = [0.5, 0.63, 0.8, 1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25];

const T = (en: string, ar: string): LocalizedText => ({ en, ar });
const ev = (status: Evidence["status"], reference: string, note: string): Evidence => ({ status, reference, note });

/** Per-projection facts: page, texts and numbers. */
const PER = {
  ap: {
    id: "elbow-ap",
    page: "p.166",
    projection: "elbow-ap",
    title: T("Adult Elbow X-ray — AP (extended)", "أشعة المرفق للبالغ — AP (ممدود)"),
    name: T("AP (extended)", "AP (ممدود)"),
    centreLabel: T("Central ray — mid-elbow joint (about 2 cm distal to the epicondyles)", "الشعاع المركزي — منتصف مفصل المرفق (نحو 2 سم أسفل اللقيمتين)"),
    centreEn: "the mid-elbow joint, about 2 cm distal to the midpoint of the line between the epicondyles",
    centreAr: "منتصف مفصل المرفق، نحو 2 سم أسفل منتصف الخط بين اللقيمتين",
    centrePage: "mid-elbow joint, about 2 cm distal to the epicondylar midpoint",
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
      "The elbow is rotated: the epicondyles are no longer in profile and the radial head, neck and tubercle are no longer separated from the ulna (Bontrager p.166). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the elbow). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "المرفق مائل (دوران): لم تعد اللقيمتان في وضع جانبي (بروفايل) ولم يعد رأس الكعبرة وعنقها وحدبتها منفصلة عن الزند (Bontrager ص.166). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للمرفق). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the distal humerus.", "الحافة العلوية للمجال تقطع العضد السفلي."),
      bottom: T("The bottom of the field cuts off the proximal radius and ulna.", "الحافة السفلية للمجال تقطع الكعبرة والزند العلويين."),
      left: T("The left side of the field (in the detector view) cuts off the medial side of the elbow (the medial epicondyle).", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الجهة الإنسية للمرفق (اللقيمة الإنسية)."),
      right: T("The right side of the field (in the detector view) cuts off the lateral side of the elbow (the lateral epicondyle).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع الجهة الوحشية للمرفق (اللقيمة الوحشية)."),
    },
    centreXLabel: T("Central ray — long axis of the arm", "الشعاع المركزي — المحور الطولي للذراع"),
    centreXPass: T("The central ray is aligned with the long axis of the arm and forearm, centred on the detector's long axis (Bontrager).", "الشعاع المركزي محاذٍ للمحور الطولي للذراع والساعد ومتمركز على المحور الطولي للكاشف (Bontrager)."),
    centreXFail: T("The central ray is off the long axis of the arm. Re-centre it.", "الشعاع المركزي بعيد عن المحور الطولي للذراع. أعد توسيطه."),
    centreXLow: T(
      "The central ray is shifted to the left of the elbow (the medial side in this view). The elbow sits off-centre and an epicondyle may be clipped. Move the target right, toward the mid-elbow.",
      "الشعاع المركزي مزاح إلى يسار المرفق (الجهة الإنسية في هذا العرض). يقع المرفق بعيدًا عن المركز وقد تُقطع إحدى اللقيمتين. حرّك الهدف يمينًا نحو منتصف المرفق.",
    ),
    centreXHigh: T(
      "The central ray is shifted to the right of the elbow (the lateral side in this view). The elbow sits off-centre and an epicondyle may be clipped. Move the target left, toward the mid-elbow.",
      "الشعاع المركزي مزاح إلى يمين المرفق (الجهة الوحشية في هذا العرض). يقع المرفق بعيدًا عن المركز وقد تُقطع إحدى اللقيمتين. حرّك الهدف يسارًا نحو منتصف المرفق.",
    ),
    centreYLow: T(
      "The central ray is too far up the arm (top of the detector view). The proximal radius and ulna may be clipped. Move the target down, toward the mid-elbow joint.",
      "الشعاع المركزي أعلى الذراع أكثر من اللازم (أعلى عرض الكاشف). قد تُقطع الكعبرة والزند العلويان. حرّك الهدف للأسفل نحو منتصف مفصل المرفق.",
    ),
    centreYHigh: T(
      "The central ray is too far down the forearm (bottom of the detector view). The distal humerus may be clipped. Move the target up, toward the mid-elbow joint.",
      "الشعاع المركزي أسفل الساعد أكثر من اللازم (أسفل عرض الكاشف). قد يُقطع العضد السفلي. حرّك الهدف للأعلى نحو منتصف مفصل المرفق.",
    ),
    coverageEn: "the distal humerus, the elbow joint space and the proximal radius and ulna",
    coverageAr: "العضد السفلي وحيز مفصل المرفق والكعبرة والزند العلويين",
    imageCriteria: [
      { id: "rotation", description: T("True AP: epicondyles in profile; radial head, neck and tubercle separated from the ulna or only slightly superimposed", "إسقاط AP صحيح: اللقيمتان في وضع جانبي (بروفايل)؛ رأس الكعبرة وعنقها وحدبتها منفصلة عن الزند أو متراكبة معه قليلًا فقط") },
      { id: "coverage", description: T("Distal humerus, elbow joint space and proximal radius and ulna included", "العضد السفلي وحيز مفصل المرفق والكعبرة والزند العلويين ضمن الصورة") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
  },
  lateral: {
    id: "elbow-lateral",
    page: "p.172",
    projection: "elbow-lateral",
    title: T("Adult Elbow X-ray — Lateral (flexed 90°)", "أشعة المرفق للبالغ — جانبي (مثني 90°)"),
    name: T("lateral (flexed 90°)", "جانبي (مثني 90°)"),
    centreLabel: T("Central ray — mid-elbow joint", "الشعاع المركزي — منتصف مفصل المرفق"),
    centreEn: "the mid-elbow joint",
    centreAr: "منتصف مفصل المرفق",
    centrePage: "mid-elbow joint",
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
      "المرفق في إسقاط جانبي صحيح: حدود اللقيمتين ونتوءاهما متراكبة ونحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي (Bontrager ص.172). (الأقواس المتحدة المركز لأخدود البكرة، وهي معيار آخر لدى Bontrager، لا يرسمها هذا المحاكي.)",
    ),
    rotationFail: T(
      "The elbow is rotated: the condyle outlines and epicondyles are no longer superimposed and the radial head is no longer about half covered by the coronoid process (Bontrager p.172). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule for the elbow). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "المرفق مائل (دوران): لم تعد حدود اللقيمتين ونتوءاهما متراكبة ولم يعد نحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي (Bontrager ص.172). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه للمرفق). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the distal humerus.", "الحافة العلوية للمجال تقطع العضد السفلي."),
      bottom: T("The bottom of the field cuts off the olecranon (the point of the elbow).", "الحافة السفلية للمجال تقطع المرفق (الزج) أي رأس الزند."),
      left: T("The left side of the field (in the detector view) cuts off the proximal forearm.", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الساعد العلوي."),
      right: T("The right side of the field (in the detector view) cuts off the back of the elbow (the olecranon).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع خلف المرفق (الزج)."),
    },
    centreXLabel: T("Central ray — mid-elbow joint, side to side in the view", "الشعاع المركزي — منتصف مفصل المرفق، من اليسار إلى اليمين في العرض"),
    centreXPass: T("The central ray is at the mid-elbow joint from side to side in the detector view (Bontrager).", "الشعاع المركزي عند منتصف مفصل المرفق من اليسار إلى اليمين في عرض الكاشف (Bontrager)."),
    centreXFail: T("The central ray is off the mid-elbow joint from side to side. Re-centre it.", "الشعاع المركزي بعيد عن منتصف مفصل المرفق من اليسار إلى اليمين. أعد توسيطه."),
    centreXLow: T(
      "The central ray is shifted to the left of the joint (toward the forearm). The olecranon (the point of the elbow) may be clipped. Move the target right, toward the mid-elbow joint.",
      "الشعاع المركزي مزاح إلى يسار المفصل (نحو الساعد). قد يُقطع الزج (رأس المرفق). حرّك الهدف يمينًا نحو منتصف مفصل المرفق.",
    ),
    centreXHigh: T(
      "The central ray is shifted to the right of the joint (toward the back of the elbow). The proximal forearm may be clipped. Move the target left, toward the mid-elbow joint.",
      "الشعاع المركزي مزاح إلى يمين المفصل (نحو خلف المرفق). قد يُقطع الساعد العلوي. حرّك الهدف يسارًا نحو منتصف مفصل المرفق.",
    ),
    centreYLow: T(
      "The central ray is too far up the arm (top of the detector view). The olecranon may be clipped. Move the target down, toward the mid-elbow joint.",
      "الشعاع المركزي أعلى الذراع أكثر من اللازم (أعلى عرض الكاشف). قد يُقطع الزج. حرّك الهدف للأسفل نحو منتصف مفصل المرفق.",
    ),
    centreYHigh: T(
      "The central ray is too far down (bottom of the detector view). The distal humerus may be clipped. Move the target up, toward the mid-elbow joint.",
      "الشعاع المركزي أسفل أكثر من اللازم (أسفل عرض الكاشف). قد يُقطع العضد السفلي. حرّك الهدف للأعلى نحو منتصف مفصل المرفق.",
    ),
    coverageEn: "the distal humerus and the proximal forearm including the olecranon",
    coverageAr: "العضد السفلي والساعد العلوي بما فيه الزج",
    imageCriteria: [
      { id: "rotation", description: T("True lateral (90° flexion): epicondyles / condyle outlines superimposed; about half of the radial head covered by the coronoid process", "إسقاط جانبي صحيح (انثناء 90°): اللقيمتان وحدودهما متراكبة؛ ونحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي") },
      { id: "coverage", description: T("Distal humerus and proximal forearm including the olecranon included", "العضد السفلي والساعد العلوي بما فيه الزج ضمن الصورة") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
  },
} as const;

const positioning = (k: ElbowKind): PositioningSpec => ({
  centering: {
    // The baseline is placed so that its target lies at the centre of the detector (elbow-geometry.ts): normalised (0, 0).
    target: { x: 0, y: 0 },
    // ENGINE TEACHING CHOICE: ≈ ±0.7 cm / ±0.75 cm full credit, ≈ ±1.8 cm / ±1.8 cm half credit on the 24 × 30 cm detector.
    idealTolerance: { x: 0.06, y: 0.05 },
    acceptableTolerance: { x: 0.15, y: 0.12 },
  },
  minCollimation: 0.3,
  markerSizeCm: 1.8,
  // Display halves are NOT part of the single-limb rule (O21 option A, S14.1c-4, S14.3-5): the letter alone is judged. `markerSide` only
  // places the default marker of each letter at the edge of the field, clear of the elbow (AP: the L on the viewer's left; lateral: both on the
  // right, the only side with room inside a correct field).
  markerSide: { L: "viewer-left", R: "viewer-right" },
  defaultMarkerPosition: k === "ap" ? { L: { x: -0.46, y: 0 }, R: { x: 0.46, y: 0 } } : { L: { x: 0.35, y: 0 }, R: { x: 0.35, y: 0 } },
  // Left elbow in v1 (S14.3-5): the letter must be L. A right-elbow case needs the side on the case (O29).
  markerRule: { kind: "fixed-side", side: "L" },
});

const criticalFindings = (k: ElbowKind): CriticalFindingRule[] => [
  {
    id: "wrong-side-marker",
    label: T("Wrong-side marker", "علامة جانب خاطئة"),
    reason: T(
      "Critical finding — wrong-side marker: the marker letter does not match the patient's side (this is the LEFT elbow). A wrong marker misidentifies the patient's side, so the attempt is below the pass mark whatever the numeric score. In practice such an image would normally be repeated.",
      "ملاحظة حرجة — علامة جانب خاطئة: حرف العلامة لا يطابق جانب المريض (هذا هو المرفق الأيسر). العلامة الخاطئة تُحدِّد جانب المريض خطأً، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. وفي الممارسة تُعاد الصورة عادةً.",
    ),
    concept: ev("common-reference", `BONTRAGER-9 p.32-33, 36, ${PER[k].page}`, "COMMON QUALITY CRITERION: an anatomic side marker is required on every image and must name the side imaged. For a single limb Bontrager gives no viewer-half convention, so only the letter is judged (O21 option A, S14.1c-4, S14.3-5)."),
    evidence: ev("provisional", "S14.3-5, S14.1c-4", "PROVISIONAL / educational: the gate is a simulator rule (educator decision pending, O5). The numeric score is unchanged."),
  },
  {
    id: "missing-marker",
    label: T("Missing marker", "علامة جانب غير موضوعة"),
    reason: T(
      "Critical finding — no side marker: the image would not say which elbow it shows. The attempt is below the pass mark whatever the numeric score, because an unmarked image is normally repeated.",
      "ملاحظة حرجة — لا توجد علامة جانب: لن تبيّن الصورة أي مرفق تُظهر. تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية، لأن الصورة بلا علامة تُعاد عادةً.",
    ),
    concept: ev("common-reference", `BONTRAGER-9 p.32-33, 36, ${PER[k].page}`, "COMMON QUALITY CRITERION: the image must carry a side marker."),
    evidence: ev("provisional", "S14.3-5", "PROVISIONAL / educational: the gate is a simulator rule with the same severity as the wrong-side marker. The numeric score is unchanged."),
  },
];

const rules = (k: ElbowKind): CheckRule[] => {
  const p = PER[k];
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
        pass: T(`The field covers ${p.coverageEn}.`, `المجال يغطي ${p.coverageAr}.`),
        fail: T("Anatomy outside the field is missing from the image. Open the field or re-centre the central ray.", "التشريح الواقع خارج المجال يغيب عن الصورة. وسّع المجال أو أعد توسيط الشعاع المركزي."),
      },
      evidence: ev(
        "educational-simplification",
        `BONTRAGER-9 ${pg} (collimate on all four sides to the area of interest; ${p.coverageEn})`,
        "The required anatomy is Bontrager's criterion. How far it extends along the arm (about 7 cm of humerus and 6–7 cm of forearm around the target), where the region lies on the baseline and the image scale (0.0155 cm / px) are engine estimates read by eye (S14.3-9, O49). Provisional.",
      ),
    },
    {
      id: "collimation-excess",
      kind: "coverage",
      check: "excess",
      category: "positioning",
      weight: 1,
      maxMarginCm: p.excessCm,
      label: T("Collimation — field size", "التحديد — حجم المجال"),
      feedback: {
        pass: T("The field is not larger than necessary for the required anatomy.", "المجال ليس أكبر من اللازم للتشريح المطلوب."),
        fail: T("The field is opened wider than necessary.", "المجال مفتوح أكثر من اللازم."),
        high: T(
          `The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest; a larger field exposes more tissue and adds scatter. Close the field toward the elbow, without cutting off the required anatomy. (The ${p.excessCm} cm margin limit is an engine teaching choice; the field must still include the marker.)`,
          `المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من المرفق دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎${p.excessCm}‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)`,
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (collimate to the area of interest)`, `Principle from the textbook; the ${p.excessCm} cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable (S14.3-9, O40).`),
    },
    {
      id: "side-marker",
      kind: "marker",
      category: "positioning",
      weight: 1,
      label: T("Side marker (patient's side)", "علامة الجانب (جانب المريض)"),
      feedback: {
        pass: T(
          "Marker placed inside the field, clear of the elbow anatomy, with the letter of the patient's side (left). For a single limb no left or right half of the image is required in this simulator (Bontrager gives none).",
          "العلامة موضوعة داخل المجال بعيدًا عن تشريح المرفق وبحرف جانب المريض (الأيسر). لا يُشترط في هذا المحاكي نصف أيسر أو أيمن من الصورة لطرف واحد (لا يذكره Bontrager).",
        ),
        fail: T(
          "No side marker placed. Choose the letter of the patient's side (this is the left elbow) and place it inside the field.",
          "لم توضع علامة جانب. اختر حرف جانب المريض (هذا هو المرفق الأيسر) وضعه داخل المجال.",
        ),
        overlap: T("The marker covers the elbow anatomy. Move it to the edge of the field, away from the required anatomy.", "العلامة تغطي تشريح المرفق. انقلها إلى حافة المجال بعيدًا عن التشريح المطلوب."),
        wrongSide: T(
          "The marker letter does not match the patient's side: this is the LEFT elbow. A wrong marker misidentifies the patient's side.",
          "حرف العلامة لا يطابق جانب المريض: هذا هو المرفق الأيسر. العلامة الخاطئة تُحدِّد جانب المريض خطأً.",
        ),
        outsideField: T("The marker is outside the collimated field, so it would not be recorded on the image. Move it inside the field.", "العلامة خارج المجال المحدَّد فلن تُسجَّل على الصورة. انقلها إلى داخل المجال."),
      },
      evidence: ev("provisional", `BONTRAGER-9 p.32-33, 36, ${pg}; S14.1b-1 (O21 option A), S14.1c-4, S14.3-5`, "Presence, side and placement (inside the field, not over the anatomy) follow Bontrager's general marker rule; the single-limb display convention is NOT given, so no viewer-half check is made."),
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
          "The patient was not clearly asked to stay still, so in this simulation the arm moves during the exposure. Movement causes a loss of sharpness (blur) that can hide fine bone detail. Ask the patient to keep the arm still.",
          "لم يُطلب من المريض بوضوح أن يبقى ثابتًا، فتتحرك الذراع أثناء التعريض في هذه المحاكاة. تسبب الحركة فقدانًا في الحدّة (ضبابية) قد يخفي التفاصيل العظمية الدقيقة. اطلب من المريض إبقاء الذراع ثابتة.",
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
      label: T("Elbow rotation (arm turn)", "دوران المرفق (دوران الذراع)"),
      // MAGNITUDE-ONLY (S14.3-5): Bontrager gives no direction rule for the elbow, so there is no `low` / `high` text.
      feedback: { pass: p.rotationPass, fail: p.rotationFail },
      evidence: ev(
        "provisional",
        `BONTRAGER-9 ${pg}; S14.3-5, S14.3-10`,
        "The criteria are Bontrager's. The ±2° / ±5° bands are an ENGINE TEACHING CHOICE (Bontrager gives no angle). The sign of the value is defined by the RESULT IMAGE (positive = toward the viewer's right); no direction of turn is claimed. The drawn effect is an EDUCATIONAL APPROXIMATION made from one baseline image.",
      ),
    },
    {
      id: "centering-lateral",
      kind: "centering",
      axis: "x",
      category: "centering",
      label: p.centreXLabel,
      feedback: {
        pass: p.centreXPass,
        fail: p.centreXFail,
        low: p.centreXLow,
        high: p.centreXHigh,
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (elbow joint centred on the receptor)`, "Alignment is Bontrager's; the tolerance values are an engine teaching choice (provisional)."),
    },
    {
      id: "centering-vertical",
      kind: "centering",
      axis: "y",
      category: "centering",
      label: p.centreLabel,
      feedback: {
        pass: T(`The central ray is at about ${p.centreEn}, perpendicular to the detector (Bontrager).`, `الشعاع المركزي عند ${p.centreAr} تقريبًا وعمودي على الكاشف (Bontrager).`),
        fail: T(`The central ray is off ${p.centreEn}. Re-centre it.`, `الشعاع المركزي بعيد عن ${p.centreAr}. أعد توسيطه.`),
        low: p.centreYLow,
        high: p.centreYHigh,
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (central ray perpendicular to the ${p.centrePage})`, "The target joint is Bontrager's; its position on the detector is read by eye on the baseline and the tolerances are an engine teaching choice (provisional)."),
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
          `kVp is inside Bontrager's digital band for the ${p.name.en} elbow (${kvLo}–${kvHi} kV).`,
          `قيمة kVp ضمن نطاق Bontrager الرقمي للمرفق ${p.name.ar} (‎${kvLo}–${kvHi}‎ kV).`,
        ),
        low: T(
          `kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only ${kvLo}–${kvHi} kV is the textbook digital band; the partial credit between ${pLo} and ${kvLo - 1} kV is an engine teaching choice.)`,
          `قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎${kvLo}–${kvHi}‎ kV فقط؛ أما الدرجة الجزئية بين ‎${pLo}‎ و‎${kvLo - 1}‎ kV فهي اختيار تعليمي في المحاكي.)`,
        ),
        high: T(
          `kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only ${kvLo}–${kvHi} kV is the textbook digital band; the partial credit up to ${pHi} kV is an engine teaching choice.)`,
          `قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎${kvLo}–${kvHi}‎ kV فقط؛ أما الدرجة الجزئية حتى ‎${pHi}‎ kV فهي اختيار تعليمي.)`,
        ),
        fail: T(`kVp is outside this simulator's range for the elbow (${pLo}–${pHi} kV).`, `قيمة kVp خارج نطاق المحاكي للمرفق (‎${pLo}–${pHi}‎ kV).`),
      },
      evidence: ev("provisional", `BONTRAGER-9 ${pg} (digital ${(kvLo + kvHi) / 2} ± 5 kV); S14.2b phase 2, S14.3-9`, `${kvLo}–${kvHi} kV is Bontrager. The partial bands ${pLo}–${kvLo - 1} and ${kvHi + 1}–${pHi} kV are an ENGINE TEACHING CHOICE, NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.`),
    },
    {
      id: "exposure-adequacy",
      kind: "technique",
      check: "exposure-adequacy",
      category: "exposure",
      weight: 2,
      variantOnLow: "low-exposure",
      label: T("Detector exposure — adequate signal", "تعريض الكاشف — إشارة كافية"),
      // No exposure-APPEARANCE wording specific to the elbow (O35): only the general digital-exposure principle.
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
          "Detector exposure is below the target (negative DI). Fewer photons reach the detector, so quantum noise rises and fine detail is harder to see. Digital processing can still make the image look acceptable, so judge exposure by the detector exposure / DI, not by displayed brightness. Bring the exposure back toward the target (mAs or SID).",
          "تعريض الكاشف أقل من الهدف (DI سالب). يصل عدد أقل من الفوتونات إلى الكاشف فيزداد الضجيج الكمّي وتصعب رؤية التفاصيل الدقيقة. يمكن لمعالجة الصورة الرقمية أن تُظهرها مقبولة رغم ذلك، لذا احكم على التعريض من تعريض الكاشف/DI وليس من سطوع الصورة المعروضة. أعد التعريض نحو الهدف (mAs أو SID).",
        ),
        fail: T("Detector exposure is well below the target: the image would be noisy.", "تعريض الكاشف أقل بكثير من الهدف: ستكون الصورة مليئة بالضجيج."),
      },
      evidence: ev("provisional", "Technique ref §5, §6, §8; S10b-9; S14.3-9; O26, O35", "VALIDATED: the DI equation and the digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the manual reference point the exposure is measured against (an engine teaching constant); no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the elbow, and no hand source for the exposure appearance, O35)."),
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
      evidence: ev("provisional", "Technique ref §7, §8; S14.3-9", "VALIDATED: digital dynamic range can hide excess exposure (dose creep). PROVISIONAL: the DI bands. No patient dose is calculated."),
    },
    {
      id: "sid",
      kind: "range",
      category: "sid",
      setting: "sidCm",
      // Bontrager: minimum 40 in = 102 cm (p.166 / 172). ENGINE TEACHING CHOICES: the upper full-credit limit (110 cm) and the partial band (95–130 cm).
      ideal: [102, 110],
      acceptable: [95, 130],
      unit: "cm",
      variantOnLow: "magnified-geometry",
      label: T("Source-to-image distance (SID)", "المسافة بين المصدر والكاشف (SID)"),
      feedback: {
        pass: T("SID is at least the 102 cm (40 in) minimum and inside this simulator's teaching band (102–110 cm).", "قيمة SID لا تقل عن الحد الأدنى 102 سم (40 بوصة) وضمن النطاق التعليمي للمحاكي (102–110 سم)."),
        low: T(
          "SID is shorter than the 102 cm (40 in) minimum Bontrager gives for the elbow. A shorter distance increases magnification and unsharpness (not drawn in this version) and raises the exposure at the detector (inverse square).",
          "قيمة SID أقصر من الحد الأدنى 102 سم (40 بوصة) الذي يذكره Bontrager لليد. المسافة الأقصر تزيد التكبير وعدم الحدّة (لا يُرسمان في هذه النسخة) وتزيد التعريض عند الكاشف (قانون التربيع العكسي).",
        ),
        high: T(
          "SID is longer than this simulator's teaching band (102–110 cm); exposure at the detector drops (inverse square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum; the upper limit and the partial band are engine teaching choices.)",
          "قيمة SID أطول من النطاق التعليمي في المحاكي (102–110 سم)؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط؛ والحد الأعلى والنطاق الجزئي اختياران تعليميان في المحاكي.)",
        ),
        fail: T("SID is outside this simulator's range for the elbow (below about 95 cm or above 130 cm).", "قيمة SID خارج نطاق المحاكي للمرفق (أقل من نحو 95 سم أو أكثر من 130 سم)."),
      },
      evidence: ev("provisional", `BONTRAGER-9 ${pg} (SID minimum 40 in / 102 cm); S14.2b phase 2, S14.3-9`, "The 102 cm minimum is Bontrager (inch-to-cm conversion). The 110 cm upper full-credit limit and the 95–130 cm partial band are ENGINE TEACHING CHOICES, NOT Bontrager."),
    },
  ];
};

/** One elbow exam (S14.3). The two instances are `elbow-ap.ts` and `elbow-lateral.ts`. */
export function makeElbowExam(k: ElbowKind): AnyExamDefinition {
  const p = PER[k];
  return {
    schemaVersion: 1,
    id: p.id,
    modality: "general-radiography",
    bodyPart: "elbow",
    provisional: true,
    evidence: {
      status: "provisional",
      reference: `docs/RAD-LAB_Medical_Reference_Elbow.md; BONTRAGER-9 ${p.page}; docs/DECISIONS.md S14.3-*`,
      note: "Exam-level classification: provisional until the educator / medical-physicist review is signed off. Every rule, tolerance and feedback sentence carries its own evidence class.",
    },
    defaultCaseId: "adult-demo",
    title: p.title,
    requiredProjection: p.projection,
    // Both projections are selectable so that a wrong projection is possible; no breathing, so no `availableBreathing`.
    availableProjections: ["elbow-ap", "elbow-lateral"],
    availableMotionInstructions: ["none", "remain-still", "relax-and-move"],
    // BONTRAGER-9 p.166 / 172: 24 × 30 cm receptor, portrait (the smallest available receptor is used and the beam is collimated).
    detector: { ...ELBOW_DETECTOR },
    requiredAnatomy: elbowRegion(k),
    controls: {
      rotationDeg: { min: -15, max: 15, step: 1 },
      sidCm: { min: 80, max: 200, step: 1 },
      kvp: { min: 40, max: 100, step: 1 },
      // mAs steps through a preferred-number series, like a console; the range is hardware, not a target.
      mas: { min: 0.5, max: 25, step: 0.5, stations: MAS_STATIONS },
      // No tubeAngulationDeg: the central ray is perpendicular (Bontrager p.166 / 172), so the control is not offered.
    },
    technique: k === "ap" ? elbowApTechnique : elbowLateralTechnique,
    positioning: positioning(k),
    rules: rules(k),
    scoring: {
      // S14.3-5: the wrist weights (S14.1b-1 option A, an engine teaching choice): the PA weights without breathing, redistributed proportionally.
      categoryWeights: { positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 },
      passThreshold: 70,
      criticalFindings: criticalFindings(k),
    },
    possibleErrors: [
      { id: "rotated", variant: "rotated", description: T("Elbow rotation", "دوران المرفق") },
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
