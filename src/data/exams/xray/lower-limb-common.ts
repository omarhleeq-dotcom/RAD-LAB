import type { CheckRule, CriticalFindingRule, PositioningSpec } from "@/domain/case";
import type { AnyExamDefinition } from "@/domain/exam";
import type { LocalizedText } from "@/domain/localized";
import type { Evidence } from "@/domain/technique";
import { patientMotionFinding, wrongProjectionFinding } from "./critical-common";
import { LOWER_LIMB_DETECTOR, lowerLimbRegion, type LowerLimbKind } from "./lower-limb-geometry";
import { lowerLimbTechnique } from "./lower-limb-technique";
import { ANKLE_PER } from "./lower-limb-ankle-texts";

/**
 * The four KNEE / FOOT exams, `knee-ap`, `knee-lateral`, `foot-ap` (DP) and `foot-oblique` (medial oblique), all of the RIGHT side (S14.4; reference
 * `docs/RAD-LAB_Medical_Reference_Knee_Foot.md`, decisions S14.4-1…). Same pattern as the wrist / hand / elbow builders: one builder, four instances; the
 * rules, texts and numbers that differ by projection are in `PER`; everything else is shared so the exams cannot drift apart. Each exam still has
 * its own file, case, tests and commit.
 *
 * Governing authority: BONTRAGER-9 p.224-225 (lower-limb common), p.232 (foot AP / DP), p.233 (foot AP medial oblique), p.246 (knee AP), p.249 (knee
 * lateral), cited by printed page (S10b-25). Every clinical value is PROVISIONAL until the educator / medical-physicist review (O5). Labels used below:
 * BONTRAGER = taken from the textbook page (class A); ENGINE TEACHING CHOICE (S12-1, class B) = the simulator's own number, named as such in the
 * learner-visible feedback text and in `REVIEW_PACKAGE.md`: the kV partial bands, the SID band above the 102 cm minimum, the rotation tolerances
 * (±2° / ±5°; the oblique's 25° / 45° partial band), the tube-angle bands (apart from Bontrager's own 5°–7° of the lateral knee), the centring tolerances,
 * the excess-collimation margins, the extent of the required region and the manual reference point; OWNER CHOICE (class C): the 28 / 22 / 17 / 22 / 11
 * category weights, the two marker critical findings, the average-patient / average-arch cases. Manual technique only (no AEC, no grid control, O64),
 * no chin / shoulder / breathing. Shielding, grid, posture details and the arch height as a patient attribute are NOT scored in v1 (S14.4-3).
 * No exposure-appearance wording is used: the reference has no source for it (O35).
 * Side (S14.4-2): the RIGHT limb. The marker rule `fixed-side` carries the side (`side: "R"`): letter only, no viewer-half check.
 * S14.5 adds the two ANKLE exams (`ankle-ap`, `ankle-lateral`, texts in `lower-limb-ankle-texts.ts`) of the LEFT side (inferred, O76): the side is read from `SIDE_OF` below,
 * the only place that says which side an exam is; the side words of the feedback follow it and read exactly as before for the right-side exams.
 * Arabic text is DRAFT pending owner / educator review (use «الكاشف»; male forms for the male patient).
 * TODO(medical-review): validate with a radiography educator before release.
 */
export type { LowerLimbKind };

const MAS_STATIONS = [0.5, 0.63, 0.8, 1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25];

const T = (en: string, ar: string): LocalizedText => ({ en, ar });
const ev = (status: Evidence["status"], reference: string, note: string): Evidence => ({ status, reference, note });

/** The side of each exam's limb (S14.4-2: knee / foot RIGHT; S14.5-2: ankle LEFT, inferred, O76). The marker rule and the side words of the feedback follow it. */
const SIDE_OF: Record<LowerLimbKind, "L" | "R"> = { "knee-ap": "R", "knee-lateral": "R", "foot-ap": "R", "foot-oblique": "R", "ankle-ap": "L", "ankle-lateral": "L" };
const SIDE_WORDS = { R: { up: "RIGHT", low: "right", ar: "اليمنى" }, L: { up: "LEFT", low: "left", ar: "اليسرى" } } as const;
const sideWords = (k: LowerLimbKind) => SIDE_WORDS[SIDE_OF[k]];

/** Per-exam facts: page, texts and numbers. */
const PER = {
  "knee-ap": {
    id: "knee-ap",
    page: "p.246",
    part: T("knee", "الركبة"),
    title: T("Adult Knee X-ray — AP", "أشعة الركبة للبالغ — AP"),
    name: T("AP", "AP"),
    // BONTRAGER p.246: digital 75 ± 5 kV (analog 65–75). The partial band is an ENGINE TEACHING CHOICE.
    kv: { full: [70, 80], partial: [65, 85] },
    // Excess-collimation margin per side (ENGINE TEACHING CHOICE): the marker needs ≈ 2 cm beside the region.
    excessCm: 3.5,
    centreLabel: T("Central ray — mid-knee joint (about 1.25 cm below the patella)", "الشعاع المركزي — منتصف مفصل الركبة (نحو 1.25 سم أسفل الرضفة)"),
    centreEn: "the mid-knee joint, about 1.25 cm below the lowest point of the patella",
    centreAr: "منتصف مفصل الركبة، نحو 1.25 سم أسفل أدنى نقطة في الرضفة",
    centrePage: "mid-knee joint",
    projectionPass: T("Correct projection: AP knee (leg extended), as requested.", "الإسقاط صحيح: الركبة بإسقاط AP (الساق ممدودة) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (AP knee, leg extended). Re-position the leg as requested.",
      "الإسقاط لا يطابق الطلب (الركبة بإسقاط AP، الساق ممدودة). أعد وضع الساق حسب الطلب.",
    ),
    rotationLabel: T("Knee rotation (turn of the leg)", "دوران الركبة (دوران الساق)"),
    rotationPass: T(
      "The leg is square to the detector: the femoral condyles and the joint space are symmetric, about the medial half of the fibular head is superimposed by the tibia and the intercondylar eminence is centred in the fossa (Bontrager p.246).",
      "الساق متعامدة مع الكاشف: لقمتا عظم الفخذ وحيز المفصل متناظرتان ونحو النصف الإنسي لرأس الشظية متراكب بالظنبوب والنتوء بين اللقمتين في منتصف الحفرة (Bontrager ص.246).",
    ),
    rotationFail: T(
      "The leg is rotated: the condyles and the joint space are no longer symmetric and the fibular head is covered by the tibia more or less than about half (Bontrager p.246). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule or tolerance). Value 0 = the interepicondylar line parallel to the detector (Bontrager rotates the leg internally 3°–5° to achieve this). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "الساق مائلة (دوران): لم تعد اللقمتان وحيز المفصل متناظرين وأصبح رأس الشظية مغطى بالظنبوب بأكثر أو بأقل من نحو النصف (Bontrager ص.246). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه ولا حدًّا). القيمة 0 = الخط بين اللقمتين موازٍ للكاشف (يدير Bontrager الساق إنسيًّا 3°–5° لتحقيق ذلك). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the distal femur.", "الحافة العلوية للمجال تقطع عظم الفخذ السفلي."),
      bottom: T("The bottom of the field cuts off the proximal tibia and fibula.", "الحافة السفلية للمجال تقطع الظنبوب والشظية العلويين."),
      left: T("The left side of the field (in the detector view) cuts off the lateral side of the knee (the fibular head and the lateral condyle).", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الجهة الوحشية للركبة (رأس الشظية واللقمة الوحشية)."),
      right: T("The right side of the field (in the detector view) cuts off the medial side of the knee (the medial condyle).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع الجهة الإنسية للركبة (اللقمة الإنسية)."),
    },
    centreXLabel: T("Central ray — across the knee", "الشعاع المركزي — عرض الركبة"),
    centreXPass: T("The central ray is centred on the knee from side to side (Bontrager p.246).", "الشعاع المركزي متمركز على الركبة من الجانب إلى الجانب (Bontrager ص.246)."),
    centreXFail: T("The central ray is off the middle of the knee from side to side. Re-centre it.", "الشعاع المركزي بعيد عن منتصف الركبة من الجانب إلى الجانب. أعد توسيطه."),
    centreXLow: T(
      "The central ray is shifted to the left of the knee (the lateral side in this view). The knee sits off-centre and the fibular head or a condyle may be clipped. Move the target right, toward the mid-knee.",
      "الشعاع المركزي مزاح إلى يسار الركبة (الجهة الوحشية في هذا العرض). تقع الركبة بعيدًا عن المركز وقد يُقطع رأس الشظية أو إحدى اللقمتين. حرّك الهدف يمينًا نحو منتصف الركبة.",
    ),
    centreXHigh: T(
      "The central ray is shifted to the right of the knee (the medial side in this view). The knee sits off-centre and a condyle may be clipped. Move the target left, toward the mid-knee.",
      "الشعاع المركزي مزاح إلى يمين الركبة (الجهة الإنسية في هذا العرض). تقع الركبة بعيدًا عن المركز وقد تُقطع إحدى اللقمتين. حرّك الهدف يسارًا نحو منتصف الركبة.",
    ),
    centreYLow: T(
      "The central ray is too far up the leg (top of the detector view). The proximal tibia and fibula may be clipped. Move the target down, toward the knee joint.",
      "الشعاع المركزي أعلى الساق أكثر من اللازم (أعلى عرض الكاشف). قد يُقطع الظنبوب والشظية العلويان. حرّك الهدف للأسفل نحو مفصل الركبة.",
    ),
    centreYHigh: T(
      "The central ray is too far down the leg (bottom of the detector view). The distal femur may be clipped. Move the target up, toward the knee joint.",
      "الشعاع المركزي أسفل الساق أكثر من اللازم (أسفل عرض الكاشف). قد يُقطع عظم الفخذ السفلي. حرّك الهدف للأعلى نحو مفصل الركبة.",
    ),
    coverageEn: "the distal femur, the knee joint and the proximal tibia and fibula",
    coverageAr: "عظم الفخذ السفلي ومفصل الركبة والظنبوب والشظية العلويين",
    angle: {
      label: T("Tube angle (average patient: perpendicular)", "ميل الأنبوب (مريض متوسط: عمودي)"),
      ideal: [-2, 2] as [number, number],
      acceptable: [-5, 5] as [number, number],
      pass: T(
        "The central ray is about perpendicular. That is right for an average patient (ASIS-to-table distance 19–24 cm, as for this patient): the beam runs parallel to the tibial plateau, so the joint space is open (Bontrager p.246).",
        "الشعاع المركزي عمودي تقريبًا. وهذا صحيح لمريض متوسط (المسافة بين الشوكة الحرقفية الأمامية العليا والطاولة 19–24 سم كحال هذا المريض): يسير الشعاع موازيًا للهضبة الظنبوبية فيبقى حيز المفصل مفتوحًا (Bontrager ص.246).",
      ),
      fail: T(
        "The tube angle is far from perpendicular. For an average patient (ASIS-to-table distance 19–24 cm) the central ray is perpendicular to the detector, parallel to the tibial plateau (Bontrager p.246).",
        "ميل الأنبوب بعيد عن العمودي. لمريض متوسط (المسافة بين الشوكة الحرقفية الأمامية العليا والطاولة 19–24 سم) يكون الشعاع المركزي عموديًا على الكاشف وموازيًا للهضبة الظنبوبية (Bontrager ص.246).",
      ),
      low: T(
        "Cephalad angle. Bontrager angles the beam 3°–5° cephalad only for a thick patient (ASIS-to-table distance over 24 cm); this patient is average, so the beam stays perpendicular.",
        "ميل نحو الرأس. يميل Bontrager بالشعاع 3°–5° نحو الرأس لمريض ثخين فقط (المسافة أكثر من 24 سم)؛ وهذا المريض متوسط لذا يبقى الشعاع عموديًا.",
      ),
      high: T(
        "Caudad angle. Bontrager angles the beam 3°–5° caudad only for a thin patient (ASIS-to-table distance under 19 cm); this patient is average, so the beam stays perpendicular.",
        "ميل نحو القدمين. يميل Bontrager بالشعاع 3°–5° نحو القدمين لمريض نحيف فقط (المسافة أقل من 19 سم)؛ وهذا المريض متوسط لذا يبقى الشعاع عموديًا.",
      ),
      evidenceNote: "Perpendicular for an average patient (ASIS-to-table 19–24 cm; 3–5° caudad below 19 cm, cephalad above 24 cm) is Bontrager. The ±2° full-credit and ±5° partial-credit bands are an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.",
    },
    imageCriteria: [
      { id: "rotation", description: T("True AP: symmetric condyles and joint space; about the medial half of the fibular head superimposed by the tibia; intercondylar eminence centred in the fossa", "إسقاط AP صحيح: لقمتان وحيز مفصل متناظرة؛ ونحو النصف الإنسي لرأس الشظية متراكب بالظنبوب؛ والنتوء بين اللقمتين في منتصف الحفرة") },
      { id: "coverage", description: T("Distal femur and proximal tibia and fibula included; joint at the centre of the field", "عظم الفخذ السفلي والظنبوب والشظية العلويان ضمن الصورة؛ والمفصل في وسط المجال") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
    marker: { x: -0.62, y: 0 },
    markerSideText: "the lateral margin of the field, clear of the knee",
    rotationControl: { min: -15, max: 15, step: 1 },
    rotationUnit: "°",
  },
  "knee-lateral": {
    id: "knee-lateral",
    page: "p.249",
    part: T("knee", "الركبة"),
    title: T("Adult Knee X-ray — Lateral", "أشعة الركبة للبالغ — جانبي"),
    name: T("lateral", "الجانبي"),
    // BONTRAGER p.249: digital 75 ± 5 kV. The partial band is an ENGINE TEACHING CHOICE.
    kv: { full: [70, 80], partial: [65, 85] },
    excessCm: 3.5,
    centreLabel: T("Central ray — knee joint (about 2.5 cm below the medial epicondyle)", "الشعاع المركزي — مفصل الركبة (نحو 2.5 سم أسفل اللقيمة الإنسية)"),
    centreEn: "the knee joint, about 2.5 cm below the medial epicondyle",
    centreAr: "مفصل الركبة، نحو 2.5 سم أسفل اللقيمة الإنسية",
    centrePage: "knee joint",
    projectionPass: T("Correct projection: lateral knee (lateral recumbent, knee flexed 20°–30°), as requested.", "الإسقاط صحيح: الركبة بالإسقاط الجانبي (استلقاء جانبي والركبة مثنية 20°–30°) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (lateral knee, flexed 20°–30°). Re-position the leg as requested.",
      "الإسقاط لا يطابق الطلب (الركبة بالإسقاط الجانبي، مثنية 20°–30°). أعد وضع الساق حسب الطلب.",
    ),
    rotationLabel: T("Knee rotation (turn of the leg)", "دوران الركبة (دوران الساق)"),
    rotationPass: T(
      "The knee is a true lateral: the posterior borders of the femoral condyles are superimposed, the patella is in profile and the fibular head is covered by the tibia as in a true lateral (Bontrager p.249).",
      "الركبة بإسقاط جانبي صحيح: الحدود الخلفية للقمتي عظم الفخذ متراكبة والرضفة في وضع جانبي (بروفايل) ورأس الشظية مغطى بالظنبوب كما في الإسقاط الجانبي الصحيح (Bontrager ص.249).",
    ),
    rotationFail: T(
      "The knee is rotated: the posterior borders of the femoral condyles are no longer superimposed and the fibular head is covered by the tibia more or less than in a true lateral (over-rotation = less covered, under-rotation = more; Bontrager p.249). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "الركبة مائلة (دوران): لم تعد الحدود الخلفية للقمتي عظم الفخذ متراكبة وأصبح رأس الشظية مغطى بالظنبوب بأكثر أو بأقل مما في الإسقاط الجانبي الصحيح (الدوران الزائد = تغطية أقل، والناقص = أكثر؛ Bontrager ص.249). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the distal femur.", "الحافة العلوية للمجال تقطع عظم الفخذ السفلي."),
      bottom: T("The bottom of the field cuts off the proximal tibia and fibula.", "الحافة السفلية للمجال تقطع الظنبوب والشظية العلويين."),
      left: T("The left side of the field (in the detector view) cuts off the patella (the front of the knee).", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الرضفة (مقدمة الركبة)."),
      right: T("The right side of the field (in the detector view) cuts off the back of the knee (the posterior condyles and the fibular head).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع خلف الركبة (اللقمتين الخلفيتين ورأس الشظية)."),
    },
    centreXLabel: T("Central ray — front to back across the knee", "الشعاع المركزي — من الأمام إلى الخلف عبر الركبة"),
    centreXPass: T("The central ray is at the knee joint from front to back in the detector view (Bontrager p.249).", "الشعاع المركزي عند مفصل الركبة من الأمام إلى الخلف في عرض الكاشف (Bontrager ص.249)."),
    centreXFail: T("The central ray is off the knee joint from front to back. Re-centre it.", "الشعاع المركزي بعيد عن مفصل الركبة من الأمام إلى الخلف. أعد توسيطه."),
    centreXLow: T(
      "The central ray is shifted to the left of the joint (toward the front of the knee). The back of the knee may be clipped. Move the target right, toward the knee joint.",
      "الشعاع المركزي مزاح إلى يسار المفصل (نحو مقدمة الركبة). قد يُقطع خلف الركبة. حرّك الهدف يمينًا نحو مفصل الركبة.",
    ),
    centreXHigh: T(
      "The central ray is shifted to the right of the joint (toward the back of the knee). The patella may be clipped. Move the target left, toward the knee joint.",
      "الشعاع المركزي مزاح إلى يمين المفصل (نحو خلف الركبة). قد تُقطع الرضفة. حرّك الهدف يسارًا نحو مفصل الركبة.",
    ),
    centreYLow: T(
      "The central ray is too far up the leg (top of the detector view). The proximal tibia and fibula may be clipped. Move the target down, toward the knee joint.",
      "الشعاع المركزي أعلى الساق أكثر من اللازم (أعلى عرض الكاشف). قد يُقطع الظنبوب والشظية العلويان. حرّك الهدف للأسفل نحو مفصل الركبة.",
    ),
    centreYHigh: T(
      "The central ray is too far down the leg (bottom of the detector view). The distal femur may be clipped. Move the target up, toward the knee joint.",
      "الشعاع المركزي أسفل الساق أكثر من اللازم (أسفل عرض الكاشف). قد يُقطع عظم الفخذ السفلي. حرّك الهدف للأعلى نحو مفصل الركبة.",
    ),
    coverageEn: "the patella, the distal femur, the knee joint and the proximal tibia and fibula",
    coverageAr: "الرضفة وعظم الفخذ السفلي ومفصل الركبة والظنبوب والشظية العلويين",
    angle: {
      label: T("Tube angle (cephalad, 5°–7°)", "ميل الأنبوب (نحو الرأس، 5°–7°)"),
      // BONTRAGER p.249: 5°-7° cephalad (negative values of the control). The partial band is an ENGINE TEACHING CHOICE.
      ideal: [-7, -5] as [number, number],
      acceptable: [-10, -3] as [number, number],
      pass: T(
        "5°–7° cephalad (Bontrager p.249): the beam passes through the joint space and the distal borders of the femoral condyles are superimposed.",
        "5°–7° نحو الرأس (Bontrager ص.249): يمر الشعاع عبر حيز المفصل وتتراكب الحدود السفلية للقمتي عظم الفخذ.",
      ),
      fail: T(
        "The tube angle is far from 5°–7° cephalad (Bontrager p.249).",
        "ميل الأنبوب بعيد عن 5°–7° نحو الرأس (Bontrager ص.249).",
      ),
      low: T(
        "More cephalad than 5°–7°. Bontrager gives 7°–10° only for a short patient with a wide pelvis; this patient is average. (The 3°–10° partial-credit band is an engine teaching choice.)",
        "ميل نحو الرأس أكبر من 5°–7°. يذكر Bontrager 7°–10° لمريض قصير ذي حوض عريض فقط؛ وهذا المريض متوسط. (نطاق الدرجة الجزئية 3°–10° اختيار تعليمي في المحاكي.)",
      ),
      high: T(
        "Too little cephalad angle (a perpendicular beam is used only when the lower leg can be raised to the plane of the femur). Angle the tube 5°–7° cephalad. (The 3°–10° partial-credit band is an engine teaching choice.)",
        "ميل نحو الرأس أقل من اللازم (يُستخدم الشعاع العمودي فقط إذا أمكن رفع الساق إلى مستوى عظم الفخذ). أمِل الأنبوب 5°–7° نحو الرأس. (نطاق الدرجة الجزئية 3°–10° اختيار تعليمي في المحاكي.)",
      ),
      evidenceNote: "5°–7° cephalad (7–10° for a short patient with a wide pelvis, about 5° for a tall male with a narrow pelvis, perpendicular if the lower leg can be raised to the femur's plane) is Bontrager. The 3°–10° partial band is an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.",
    },
    imageCriteria: [
      { id: "rotation", description: T("True lateral: posterior borders of the femoral condyles superimposed; patella in profile; fibular head overlap as in a true lateral", "إسقاط جانبي صحيح: الحدود الخلفية للقمتي عظم الفخذ متراكبة؛ والرضفة في وضع جانبي؛ وتراكب رأس الشظية كما في الجانبي الصحيح") },
      { id: "coverage", description: T("Patella, distal femur, joints, proximal tibia and fibula included; knee joint at the centre of the field", "الرضفة وعظم الفخذ السفلي والمفصلان والظنبوب والشظية العلويان ضمن الصورة؛ ومفصل الركبة في وسط المجال") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
    marker: { x: 0.7, y: 0 },
    markerSideText: "the margin of the field, clear of the knee",
    rotationControl: { min: -15, max: 15, step: 1 },
    rotationUnit: "°",
  },
  "foot-ap": {
    id: "foot-ap",
    page: "p.232",
    part: T("foot", "القدم"),
    title: T("Adult Foot X-ray — AP (dorsoplantar)", "أشعة القدم للبالغ — AP (ظهري أخمصي)"),
    name: T("AP (dorsoplantar)", "AP (ظهري أخمصي)"),
    // BONTRAGER p.232: digital 65 ± 5 kV (analog 60 ± 5). The partial band is an ENGINE TEACHING CHOICE.
    kv: { full: [60, 70], partial: [55, 75] },
    // One-sided excess: the field is centred on the base of the 3rd metatarsal, ≈ 5.6 cm nearer the toes than the middle of the required region (O40-like).
    excessCm: 6.5,
    centreLabel: T("Central ray — base of the 3rd metatarsal", "الشعاع المركزي — قاعدة المشط الثالث"),
    centreEn: "the base of the 3rd metatarsal",
    centreAr: "قاعدة المشط الثالث",
    centrePage: "base of the 3rd metatarsal",
    projectionPass: T("Correct projection: AP (dorsoplantar) foot, sole flat on the detector, as requested.", "الإسقاط صحيح: القدم بإسقاط AP (ظهري أخمصي) والأخمص مسطح على الكاشف كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (AP / dorsoplantar foot). Re-position the foot as requested.",
      "الإسقاط لا يطابق الطلب (القدم بإسقاط AP / ظهري أخمصي). أعد وضع القدم حسب الطلب.",
    ),
    rotationLabel: T("Foot rotation (turn about the long axis)", "دوران القدم (حول المحور الطولي)"),
    rotationPass: T(
      "The foot is square to the detector: the spacing of metatarsals 2–5 is nearly equal, the bases of the 1st and 2nd metatarsals are generally separated and the bases of 2–5 overlap (Bontrager p.232).",
      "القدم متعامدة مع الكاشف: المسافات بين مشط القدم 2–5 متقاربة تقريبًا وقاعدتا المشط الأول والثاني منفصلتان عمومًا وقواعد 2–5 متراكبة (Bontrager ص.232).",
    ),
    rotationFail: T(
      "The foot is rotated: the spacing of metatarsals 2–5 is no longer nearly equal (Bontrager p.232). Only the amount of rotation is scored, not its direction (Bontrager gives no direction rule or tolerance). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "القدم مائلة (دوران): لم تعد المسافات بين مشط القدم 2–5 متقاربة تقريبًا (Bontrager ص.232). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager قاعدة اتجاه ولا حدًّا). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the toes.", "الحافة العلوية للمجال تقطع أصابع القدم."),
      bottom: T("The bottom of the field cuts off the navicular and the cuboid.", "الحافة السفلية للمجال تقطع الزورقي والمكعبي."),
      left: T("The left side of the field (in the detector view) cuts off the medial side of the foot (the big toe and the 1st metatarsal).", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الجهة الإنسية للقدم (الإبهام والمشط الأول)."),
      right: T("The right side of the field (in the detector view) cuts off the lateral side of the foot (the little toe and the 5th metatarsal).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع الجهة الوحشية للقدم (الإصبع الصغير والمشط الخامس)."),
    },
    centreXLabel: T("Central ray — across the foot", "الشعاع المركزي — عرض القدم"),
    centreXPass: T("The central ray is aligned with the long axis of the foot, at the base of the 3rd metatarsal across the foot (Bontrager p.232).", "الشعاع المركزي محاذٍ للمحور الطولي للقدم عند قاعدة المشط الثالث عبر القدم (Bontrager ص.232)."),
    centreXFail: T("The central ray is off the base of the 3rd metatarsal across the foot. Re-centre it.", "الشعاع المركزي بعيد عن قاعدة المشط الثالث عبر القدم. أعد توسيطه."),
    centreXLow: T(
      "The central ray is shifted to the left of the foot axis (the big toe side in this view). The lateral side of the foot may be clipped. Move the target right, toward the base of the 3rd metatarsal.",
      "الشعاع المركزي مزاح إلى يسار محور القدم (جهة الإبهام في هذا العرض). قد تُقطع الجهة الوحشية للقدم. حرّك الهدف يمينًا نحو قاعدة المشط الثالث.",
    ),
    centreXHigh: T(
      "The central ray is shifted to the right of the foot axis (the little toe side in this view). The big toe side of the foot may be clipped. Move the target left, toward the base of the 3rd metatarsal.",
      "الشعاع المركزي مزاح إلى يمين محور القدم (جهة الإصبع الصغير في هذا العرض). قد تُقطع جهة الإبهام. حرّك الهدف يسارًا نحو قاعدة المشط الثالث.",
    ),
    centreYLow: T(
      "The central ray is too far toward the toes (top of the detector view). The navicular and cuboid may be clipped. Move the target down, toward the base of the 3rd metatarsal.",
      "الشعاع المركزي قريب من الأصابع أكثر من اللازم (أعلى عرض الكاشف). قد يُقطع الزورقي والمكعبي. حرّك الهدف للأسفل نحو قاعدة المشط الثالث.",
    ),
    centreYHigh: T(
      "The central ray is too far toward the heel (bottom of the detector view). The toes may be clipped. Move the target up, toward the base of the 3rd metatarsal.",
      "الشعاع المركزي قريب من العقب أكثر من اللازم (أسفل عرض الكاشف). قد تُقطع أصابع القدم. حرّك الهدف للأعلى نحو قاعدة المشط الثالث.",
    ),
    coverageEn: "the whole foot: all the phalanges, the metatarsals, the navicular, the cuneiforms and the cuboid",
    coverageAr: "القدم كلها: جميع السلاميات وعظام مشط القدم والزورقي والإسفينيات والنردي",
    angle: {
      label: T("Tube angle (10° toward the heel)", "ميل الأنبوب (10° نحو العقب)"),
      // BONTRAGER p.232: 10° toward the heel = cephalad (negative values of the control); high arch ≈ 15°, low arch ≈ 5°. The bands are ENGINE TEACHING CHOICES.
      ideal: [-12, -8] as [number, number],
      acceptable: [-15, -5] as [number, number],
      pass: T(
        "About 10° toward the heel (cephalad), right for an average arch: the beam is perpendicular to the metatarsals (Bontrager p.232; about 15° for a high arch, about 5° for a low arch).",
        "نحو 10° باتجاه العقب (نحو الرأس)، وهو صحيح لقوس متوسط: الشعاع عمودي على عظام مشط القدم (Bontrager ص.232؛ نحو 15° لقوس عالٍ ونحو 5° لقوس منخفض).",
      ),
      fail: T(
        "The tube angle is far from about 10° toward the heel (cephalad). For an average arch the beam is perpendicular to the metatarsals (Bontrager p.232).",
        "ميل الأنبوب بعيد عن نحو 10° باتجاه العقب (نحو الرأس). لقوس متوسط يكون الشعاع عموديًا على عظام مشط القدم (Bontrager ص.232).",
      ),
      low: T(
        "More than about 10° toward the heel. Bontrager gives about 15° only for a high arch; this foot has an average arch. (The 5°–15° partial-credit band is an engine teaching choice.)",
        "أكثر من نحو 10° باتجاه العقب. يذكر Bontrager نحو 15° لقوس عالٍ فقط؛ وهذه القدم ذات قوس متوسط. (نطاق الدرجة الجزئية 5°–15° اختيار تعليمي في المحاكي.)",
      ),
      high: T(
        "Less than about 10° toward the heel (or angled toward the toes). The beam is not perpendicular to the metatarsals; Bontrager angles it about 10° toward the heel for an average arch. (The 5°–15° partial-credit band is an engine teaching choice.)",
        "أقل من نحو 10° باتجاه العقب (أو مائل نحو الأصابع). الشعاع ليس عموديًا على عظام مشط القدم؛ يميله Bontrager نحو 10° باتجاه العقب لقوس متوسط. (نطاق الدرجة الجزئية 5°–15° اختيار تعليمي في المحاكي.)",
      ),
      evidenceNote: "About 10° toward the heel (about 15° for a high arch, about 5° for a low arch, no angle for a foreign body) is Bontrager; toward the heel = cephalad = negative on the control. The 5°–15° partial band is an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.",
    },
    imageCriteria: [
      { id: "rotation", description: T("True AP: nearly equal spacing of metatarsals 2–5; bases of the 1st and 2nd metatarsals separated, bases 2–5 overlapping", "إسقاط AP صحيح: مسافات متقاربة تقريبًا بين مشط القدم 2–5؛ وقاعدتا المشط الأول والثاني منفصلتان وقواعد 2–5 متراكبة") },
      { id: "coverage", description: T("Whole foot included: all phalanges, metatarsals, navicular, cuneiforms and cuboid; joint between the 1st and 2nd cuneiforms and the sesamoids seen", "القدم كلها ضمن الصورة: جميع السلاميات وعظام مشط القدم والزورقي والإسفينيات والمكعبي؛ ومفصل الإسفينيين الأول والثاني والسمسمانيات ظاهرة") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
    marker: { x: 0.54, y: 0 },
    markerSideText: "the lateral margin of the field, clear of the foot",
    rotationControl: { min: -15, max: 15, step: 1 },
    rotationUnit: "°",
  },
  "foot-oblique": {
    id: "foot-oblique",
    page: "p.233",
    part: T("foot", "القدم"),
    title: T("Adult Foot X-ray — AP medial oblique", "أشعة القدم للبالغ — AP مائل إنسي"),
    name: T("AP medial oblique", "AP المائل الإنسي"),
    // BONTRAGER p.233: same factors as the AP: digital 65 ± 5 kV. The partial band is an ENGINE TEACHING CHOICE.
    kv: { full: [60, 70], partial: [55, 75] },
    excessCm: 7.5,
    centreLabel: T("Central ray — base of the 3rd metatarsal", "الشعاع المركزي — قاعدة المشط الثالث"),
    centreEn: "the base of the 3rd metatarsal",
    centreAr: "قاعدة المشط الثالث",
    centrePage: "base of the 3rd metatarsal",
    projectionPass: T("Correct projection: AP medial oblique foot, as requested.", "الإسقاط صحيح: القدم بإسقاط AP المائل الإنسي كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (AP medial oblique foot). Re-position the foot as requested.",
      "الإسقاط لا يطابق الطلب (القدم بإسقاط AP المائل الإنسي). أعد وضع القدم حسب الطلب.",
    ),
    rotationLabel: T("Foot obliquity (plantar surface to the detector)", "ميل القدم (الأخمص بالنسبة إلى الكاشف)"),
    rotationPass: T(
      "The plantar surface is 30°–40° to the detector (Bontrager p.233; 40° recommended): metatarsals 3–5 are free of superimposition and the 5th metatarsal tuberosity is in profile.",
      "الأخمص بزاوية 30°–40° مع الكاشف (Bontrager ص.233؛ يوصى بـ40°): عظام مشط القدم 3–5 غير متراكبة والحدبة المشطية الخامسة ظاهرة بالجانب (بروفايل).",
    ),
    rotationFail: T(
      "The plantar surface is outside the 30°–40° Bontrager gives (p.233), so metatarsals 3–5 are not free of superimposition as required. The 25°–45° partial-credit band is an engine teaching choice.",
      "الأخمص خارج الزاوية 30°–40° التي يذكرها Bontrager (ص.233) فلا تكون عظام مشط القدم 3–5 غير متراكبة كما هو مطلوب. نطاق الدرجة الجزئية 25°–45° اختيار تعليمي في المحاكي.",
    ),
    rotationLow: T(
      "The foot is turned less than the 30°–40° Bontrager gives (p.233): the plantar surface is too close to the detector. Turn the foot further medially (40° is recommended). The 25°–45° partial-credit band is an engine teaching choice.",
      "القدم مدارة أقل من 30°–40° التي يذكرها Bontrager (ص.233): الأخمص قريب جدًّا من الكاشف. أدِر القدم إنسيًّا أكثر (يوصى بـ40°). نطاق الدرجة الجزئية 25°–45° اختيار تعليمي في المحاكي.",
    ),
    rotationHigh: T(
      "The foot is turned more than the 30°–40° Bontrager gives (p.233). Turn the foot back toward 40°. The 25°–45° partial-credit band is an engine teaching choice.",
      "القدم مدارة أكثر من 30°–40° التي يذكرها Bontrager (ص.233). أعد القدم نحو 40°. نطاق الدرجة الجزئية 25°–45° اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the toes.", "الحافة العلوية للمجال تقطع أصابع القدم."),
      bottom: T("The bottom of the field cuts off the proximal tarsal bones.", "الحافة السفلية للمجال تقطع عظام رسغ القدم القريبة."),
      left: T("The left side of the field (in the detector view) cuts off the medial side of the foot (the big toe and the 1st metatarsal).", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الجهة الإنسية للقدم (الإبهام والمشط الأول)."),
      right: T("The right side of the field (in the detector view) cuts off the lateral side of the foot (the little toe and the 5th metatarsal tuberosity).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع الجهة الوحشية للقدم (الإصبع الصغير وحدبة المشط الخامس)."),
    },
    centreXLabel: T("Central ray — across the foot", "الشعاع المركزي — عرض القدم"),
    centreXPass: T("The central ray is at the base of the 3rd metatarsal across the foot (Bontrager p.233).", "الشعاع المركزي عند قاعدة المشط الثالث عبر القدم (Bontrager ص.233)."),
    centreXFail: T("The central ray is off the base of the 3rd metatarsal across the foot. Re-centre it.", "الشعاع المركزي بعيد عن قاعدة المشط الثالث عبر القدم. أعد توسيطه."),
    centreXLow: T(
      "The central ray is shifted to the left (the big toe side in this view). The lateral side of the foot may be clipped. Move the target right, toward the base of the 3rd metatarsal.",
      "الشعاع المركزي مزاح إلى اليسار (جهة الإبهام في هذا العرض). قد تُقطع الجهة الوحشية للقدم. حرّك الهدف يمينًا نحو قاعدة المشط الثالث.",
    ),
    centreXHigh: T(
      "The central ray is shifted to the right (the little toe side in this view). The big toe side of the foot may be clipped. Move the target left, toward the base of the 3rd metatarsal.",
      "الشعاع المركزي مزاح إلى اليمين (جهة الإصبع الصغير في هذا العرض). قد تُقطع جهة الإبهام. حرّك الهدف يسارًا نحو قاعدة المشط الثالث.",
    ),
    centreYLow: T(
      "The central ray is too far toward the toes (top of the detector view). The proximal tarsal bones may be clipped. Move the target down, toward the base of the 3rd metatarsal.",
      "الشعاع المركزي قريب من الأصابع أكثر من اللازم (أعلى عرض الكاشف). قد تُقطع عظام رسغ القدم القريبة. حرّك الهدف للأسفل نحو قاعدة المشط الثالث.",
    ),
    centreYHigh: T(
      "The central ray is too far toward the heel (bottom of the detector view). The toes may be clipped. Move the target up, toward the base of the 3rd metatarsal.",
      "الشعاع المركزي قريب من العقب أكثر من اللازم (أسفل عرض الكاشف). قد تُقطع أصابع القدم. حرّك الهدف للأعلى نحو قاعدة المشط الثالث.",
    ),
    coverageEn: "the whole foot from the distal phalanges to the proximal tarsal bones",
    coverageAr: "القدم كلها من السلاميات القاصية إلى عظام رسغ القدم القريبة",
    angle: {
      label: T("Tube angle (perpendicular)", "ميل الأنبوب (عمودي)"),
      ideal: [-2, 2] as [number, number],
      acceptable: [-5, 5] as [number, number],
      pass: T("The central ray is perpendicular to the detector, as for the medial oblique foot (Bontrager p.233).", "الشعاع المركزي عمودي على الكاشف كما في القدم المائلة الإنسية (Bontrager ص.233)."),
      fail: T("The tube angle is far from perpendicular. For the medial oblique foot the central ray is perpendicular to the detector (Bontrager p.233).", "ميل الأنبوب بعيد عن العمودي. في القدم المائلة الإنسية يكون الشعاع المركزي عموديًا على الكاشف (Bontrager ص.233)."),
      low: T("The tube is angled cephalad (toward the heel). The medial oblique foot needs a perpendicular beam (Bontrager p.233).", "الأنبوب مائل نحو الرأس (باتجاه العقب). تحتاج القدم المائلة الإنسية شعاعًا عموديًا (Bontrager ص.233)."),
      high: T("The tube is angled caudad (toward the toes). The medial oblique foot needs a perpendicular beam (Bontrager p.233).", "الأنبوب مائل نحو القدمين (باتجاه الأصابع). تحتاج القدم المائلة الإنسية شعاعًا عموديًا (Bontrager ص.233)."),
      evidenceNote: "CR perpendicular to the detector is Bontrager. The ±2° full-credit and ±5° partial-credit bands are an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.",
    },
    imageCriteria: [
      { id: "rotation", description: T("Plantar surface 30°–40° to the detector (40° recommended): metatarsals 3–5 free of superimposition; 5th metatarsal tuberosity in profile", "الأخمص بزاوية 30°–40° مع الكاشف (يوصى بـ40°): عظام مشط القدم 3–5 غير متراكبة؛ وحدبة المشط الخامس بالجانب") },
      { id: "coverage", description: T("Entire foot from the distal phalanges to the posterior calcaneus and proximal talus (this reference picture ends at the proximal tarsal bones); cuboid joint spaces and sinus tarsi open", "القدم كلها من السلاميات القاصية إلى العقب الخلفي والكاحل القريب (تنتهي الصورة المرجعية عند عظام رسغ القدم القريبة)؛ وحيزا مفصل النردي وجيب الرسغ مفتوحة") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
    marker: { x: 0.5, y: 0 },
    markerSideText: "the lateral margin of the field, clear of the foot",
    // The console value is the ABSOLUTE plantar angle (Bontrager p.233: 30°–40°); the picture's own obliquity is unmeasured (O63).
    rotationControl: { min: 0, max: 70, step: 1 },
    rotationUnit: "°",
  },
  ...ANKLE_PER,
} as const;

const positioning = (k: LowerLimbKind): PositioningSpec => ({
  centering: {
    // The baseline is placed so that its target lies at the centre of the detector (lower-limb-geometry.ts): normalised (0, 0).
    target: { x: 0, y: 0 },
    // ENGINE TEACHING CHOICE: ≈ ±0.7 cm / ±0.75 cm full credit, ≈ ±1.8 cm half credit on the 24 × 30 cm detector.
    idealTolerance: { x: 0.06, y: 0.05 },
    acceptableTolerance: { x: 0.15, y: 0.12 },
  },
  minCollimation: 0.3,
  markerSizeCm: 1.8,
  // Display halves are NOT part of the single-limb rule (O21 option A, S14.1c-4): the letter alone is judged. `markerSide` only places the
  // default marker at the edge of the field, clear of the limb (the RIGHT limb: R = the letter of the patient's side).
  markerSide: { L: "viewer-left", R: "viewer-right" },
  defaultMarkerPosition: { L: { ...PER[k].marker }, R: { ...PER[k].marker } },
  // The limb's side (S14.4-2 right for the knee / foot, S14.5-2 left for the ankle): the letter must be the exam's side.
  markerRule: { kind: "fixed-side", side: SIDE_OF[k] },
});

const criticalFindings = (k: LowerLimbKind): CriticalFindingRule[] => [
  wrongProjectionFinding(PER[k].page),
  patientMotionFinding(PER[k].page),
  {
    id: "wrong-side-marker",
    label: T("Wrong-side marker", "علامة جانب خاطئة"),
    reason: T(
      `Critical finding — wrong-side marker: the marker letter does not match the patient's side (this is the ${sideWords(k).up} ${PER[k].part.en}). A wrong marker misidentifies the patient's side, so the attempt is below the pass mark whatever the numeric score. This is an educational result, not a clinical decision about the image.`,
      `ملاحظة حرجة — علامة جانب خاطئة: حرف العلامة لا يطابق جانب المريض (هذه ${PER[k].part.ar} ${sideWords(k).ar}). العلامة الخاطئة تُحدِّد جانب المريض خطأً، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.`,
    ),
    concept: ev("common-reference", `BONTRAGER-9 p.32-33, 36, p.224-225, ${PER[k].page}`, "COMMON QUALITY CRITERION: an anatomic side marker is required on every image and must name the side imaged. For a single limb Bontrager gives no viewer-half convention, so only the letter is judged (O21 option A, S14.1c-4, S14.4-2)."),
    evidence: ev("provisional", "S14.4-3, S14.1c-4", "PROVISIONAL / educational: the gate is a simulator rule (educator decision pending, O5). The numeric score is unchanged."),
  },
  {
    id: "missing-marker",
    label: T("Missing marker", "علامة جانب غير موضوعة"),
    reason: T(
      `Critical finding — no side marker: the image would not say which ${PER[k].part.en} it shows. The attempt is below the pass mark whatever the numeric score. A missing marker is a critical error to correct in training; this is an educational result, not a clinical decision about the image.`,
      `ملاحظة حرجة — لا توجد علامة جانب: لن تبيّن الصورة أي ${PER[k].part.ar} تُظهر. تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. غياب العلامة خطأ مهم يجب تصحيحه في التدريب، وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.`,
    ),
    concept: ev("common-reference", `BONTRAGER-9 p.32-33, 36, p.224-225, ${PER[k].page}`, "COMMON QUALITY CRITERION: the image must carry a side marker."),
    evidence: ev("provisional", "S14.4-3", "PROVISIONAL / educational: the gate is a simulator rule with the same severity as the wrong-side marker. The numeric score is unchanged."),
  },
];

const rules = (k: LowerLimbKind): CheckRule[] => {
  const p = PER[k];
  const pg = p.page;
  const [kvLo, kvHi] = p.kv.full;
  const [pLo, pHi] = p.kv.partial;
  const oblique = k === "foot-oblique";
  const partEn = p.part.en;
  const rotationRule: CheckRule = {
    id: "rotation",
    kind: "range",
    category: "rotation",
    setting: "rotationDeg",
    ideal: oblique ? [30, 40] : [-2, 2],
    acceptable: oblique ? [25, 45] : [-5, 5],
    unit: "°",
    variantOnLow: "rotated",
    variantOnHigh: "rotated",
    label: p.rotationLabel,
    // MAGNITUDE-ONLY for the three turn exams (Bontrager gives no direction rule), so no `low` / `high` text; the oblique's value is the absolute plantar angle, so it has direction text.
    feedback: oblique ? { pass: p.rotationPass, fail: p.rotationFail, low: (p as typeof PER["foot-oblique"]).rotationLow, high: (p as typeof PER["foot-oblique"]).rotationHigh } : { pass: p.rotationPass, fail: p.rotationFail },
    evidence: oblique
      ? ev("provisional", `BONTRAGER-9 ${pg}; S14.4-5`, "The plantar angle 30°–40° (40° recommended) and the criteria are Bontrager's; the 25°–45° partial band is an ENGINE TEACHING CHOICE. The console value is the absolute angle; the picture's own obliquity is unmeasured (O63), so the drawn effect (a displacement of the metatarsal and toe columns by the deviation from 40°) is an EDUCATIONAL APPROXIMATION made from one baseline image.")
      : ev("provisional", `BONTRAGER-9 ${pg}; S14.4-3`, "The criteria are Bontrager's. The ±2° / ±5° bands are an ENGINE TEACHING CHOICE (Bontrager gives no angle). The sign of the value is defined by the RESULT IMAGE (positive = toward the viewer's right); no direction of turn is claimed. The drawn effect is an EDUCATIONAL APPROXIMATION made from one baseline image."),
  };
  return [
    {
      id: "projection",
      kind: "equals",
      category: "positioning",
      weight: 2,
      setting: "projection",
      expected: p.id,
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
        `BONTRAGER-9 ${pg} (collimate to the area of interest; ${p.coverageEn})`,
        "The required anatomy is Bontrager's criterion. How far it extends, where the region lies on the baseline and the image scale are engine estimates read by eye (S14.4-10, O61, O62). Provisional.",
      ),
    },
    {
      id: "collimation-excess",
      kind: "coverage",
      check: "excess",
      category: "positioning",
      weight: 1,
      maxMarginCm: p.excessCm,
      beyondNeeded: true, // S2: an opening the geometry forces (field centred on the ray) or the marker needs is not excess.
      label: T("Collimation — field size", "التحديد — حجم المجال"),
      feedback: {
        pass: T("The field is not larger than necessary for the required anatomy.", "المجال ليس أكبر من اللازم للتشريح المطلوب."),
        fail: T("The field is opened wider than necessary.", "المجال مفتوح أكثر من اللازم."),
        high: T(
          `The field is opened wider than necessary. Bontrager asks for collimation on all four sides to the area of interest (p.224-225); a larger field exposes more tissue and adds scatter. Close the field toward the ${partEn}, without cutting off the required anatomy. (The ${p.excessCm} cm margin limit is an engine teaching choice; the field must still include the marker.)`,
          `المجال مفتوح أكثر من اللازم. يطلب Bontrager التحديد من الجهات الأربع إلى منطقة الاهتمام (ص.224-225)؛ والمجال الأكبر يعرّض أنسجة أكثر ويزيد التشتت. قرّب حواف المجال من ${p.part.ar} دون أن تقطع التشريح المطلوب. (حدّ الهامش ‎${p.excessCm}‎ سم اختيار تعليمي في المحاكي؛ ويجب أن يشمل المجال العلامة.)`,
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 p.224-225, ${pg} (collimate to the area of interest)`, `Principle from the textbook; the ${p.excessCm} cm margin limit is an engine teaching choice (provisional / configurable). The field is centred on the central ray, so a one-sided margin can be unavoidable (O40-like).`),
    },
    {
      id: "side-marker",
      kind: "marker",
      category: "positioning",
      weight: 1,
      label: T("Side marker (patient's side)", "علامة الجانب (جانب المريض)"),
      feedback: {
        pass: T(
          `Marker placed inside the field, clear of the anatomy, with the letter of the patient's side (${sideWords(k).low}). Bontrager asks for it on the lateral margin of the field without covering anatomy (p.224-225); for a single limb no left or right half of the image is checked in this simulator.`,
          `العلامة موضوعة داخل المجال بعيدًا عن التشريح وبحرف جانب المريض (الأيمن). يطلب Bontrager وضعها على الحافة الوحشية للمجال دون تغطية التشريح (ص.224-225)؛ ولا يُفحص في هذا المحاكي نصف أيسر أو أيمن من الصورة لطرف واحد.`,
        ),
        fail: T(
          `No side marker placed. Choose the letter of the patient's side (this is the ${sideWords(k).low} ${partEn}) and place it inside the field.`,
          `لم توضع علامة جانب. اختر حرف جانب المريض (هذه ${p.part.ar} ${sideWords(k).ar}) وضعه داخل المجال.`,
        ),
        overlap: T(`The marker covers the anatomy. Move it to ${p.markerSideText}.`, "العلامة تغطي التشريح. انقلها إلى حافة المجال بعيدًا عن التشريح المطلوب."),
        wrongSide: T(
          `The marker letter does not match the patient's side: this is the ${sideWords(k).up} ${partEn}. A wrong marker misidentifies the patient's side.`,
          `حرف العلامة لا يطابق جانب المريض: هذه ${p.part.ar} ${sideWords(k).ar}. العلامة الخاطئة تُحدِّد جانب المريض خطأً.`,
        ),
        outsideField: T("The marker is outside the collimated field, so it would not be recorded on the image. Move it inside the field.", "العلامة خارج المجال المحدَّد فلن تُسجَّل على الصورة. انقلها إلى داخل المجال."),
      },
      evidence: ev("provisional", `BONTRAGER-9 p.32-33, 36, p.224-225, ${pg}; S14.1b-1 (O21 option A), S14.1c-4, S14.4-2`, "Presence, side and placement (on the lateral margin of the field, not over the anatomy) follow Bontrager's general marker rule; the single-limb display convention is NOT given, so no viewer-half check is made."),
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
          `The patient was not clearly asked to stay still, so in this simulation the ${partEn} moves during the exposure. Movement causes a loss of sharpness (blur) that can hide fine bone detail. Ask the patient to keep the ${partEn} still.`,
          `لم يُطلب من المريض بوضوح أن يبقى ثابتًا، فتتحرك ${p.part.ar} أثناء التعريض في هذه المحاكاة. تسبب الحركة فقدانًا في الحدّة (ضبابية) قد يخفي التفاصيل العظمية الدقيقة. اطلب من المريض إبقاء ${p.part.ar} ثابتة.`,
        ),
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (no motion); Image-quality ref (Motion)`, "VALIDATED: motion reduces sharpness. EDUCATIONAL ASSUMPTION: that this instruction decides whether this simulated patient moves. Deliberately unscored (no rubric exists)."),
    },
    rotationRule,
    {
      id: "centering-lateral",
      kind: "centering",
      axis: "x",
      category: "centering",
      label: p.centreXLabel,
      feedback: { pass: p.centreXPass, fail: p.centreXFail, low: p.centreXLow, high: p.centreXHigh },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (part centred on the detector)`, "Alignment is Bontrager's; the tolerance values are an engine teaching choice (provisional)."),
    },
    {
      id: "centering-vertical",
      kind: "centering",
      axis: "y",
      category: "centering",
      label: p.centreLabel,
      feedback: {
        pass: T(`The central ray is at about ${p.centreEn} (Bontrager ${pg}).`, `الشعاع المركزي عند ${p.centreAr} تقريبًا (Bontrager ${pg.replace("p.", "ص.")}).`),
        fail: T(`The central ray is off ${p.centreEn}. Re-centre it.`, `الشعاع المركزي بعيد عن ${p.centreAr}. أعد توسيطه.`),
        low: p.centreYLow,
        high: p.centreYHigh,
      },
      evidence: ev("educational-simplification", `BONTRAGER-9 ${pg} (central ray at the ${p.centrePage})`, "The target is Bontrager's; its position on the detector is read by eye on the baseline and the tolerances are an engine teaching choice (provisional)."),
    },
    {
      id: "angulation",
      kind: "range",
      category: "centering",
      setting: "tubeAngulationDeg",
      ideal: p.angle.ideal,
      acceptable: p.angle.acceptable,
      unit: "°",
      label: p.angle.label,
      feedback: { pass: p.angle.pass, fail: p.angle.fail, low: p.angle.low, high: p.angle.high },
      evidence: ev("provisional", `BONTRAGER-9 ${pg}; S14.4-3`, p.angle.evidenceNote),
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
          `kVp is inside Bontrager's digital band for the ${p.name.en} ${partEn} (${kvLo}–${kvHi} kV).`,
          `قيمة kVp ضمن نطاق Bontrager الرقمي لـ${p.part.ar} ${p.name.ar} (‎${kvLo}–${kvHi}‎ kV).`,
        ),
        low: T(
          `kVp is below the textbook band. A less penetrating beam is absorbed more by the dense bones, so bone detail is harder to see. Extra mAs adds photons, not penetration. (Only ${kvLo}–${kvHi} kV is the textbook digital band; the partial credit between ${pLo} and ${kvLo - 1} kV is an engine teaching choice.)`,
          `قيمة kVp أقل من نطاق الكتاب. الحزمة الأقل اختراقًا تمتصها العظام الكثيفة أكثر فيصعب رؤية التفاصيل العظمية. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق الرقمي في الكتاب هو ‎${kvLo}–${kvHi}‎ kV فقط؛ أما الدرجة الجزئية بين ‎${pLo}‎ و‎${kvLo - 1}‎ kV فهي اختيار تعليمي في المحاكي.)`,
        ),
        high: T(
          `kVp is above the textbook band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only ${kvLo}–${kvHi} kV is the textbook digital band; the partial credit up to ${pHi} kV is an engine teaching choice.)`,
          `قيمة kVp أعلى من نطاق الكتاب. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق الرقمي في الكتاب هو ‎${kvLo}–${kvHi}‎ kV فقط؛ أما الدرجة الجزئية حتى ‎${pHi}‎ kV فهي اختيار تعليمي.)`,
        ),
        fail: T(`kVp is outside this case's protocol range for the ${partEn} (${pLo}–${pHi} kV).`, `قيمة kVp خارج نطاق بروتوكول هذه الحالة لـ${p.part.ar} (‎${pLo}–${pHi}‎ kV).`),
      },
      evidence: ev("provisional", `BONTRAGER-9 ${pg} (digital ${(kvLo + kvHi) / 2} ± 5 kV); S14.4-3`, `${kvLo}–${kvHi} kV is Bontrager. The partial bands ${pLo}–${kvLo - 1} and ${kvHi + 1}–${pHi} kV are an ENGINE TEACHING CHOICE, NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.`),
    },
    {
      id: "exposure-adequacy",
      kind: "technique",
      check: "exposure-adequacy",
      category: "exposure",
      weight: 2,
      variantOnLow: "low-exposure",
      label: T("Detector exposure — adequate signal", "تعريض الكاشف — إشارة كافية"),
      // No exposure-APPEARANCE wording specific to the lower limb (O35): only the general digital-exposure principle.
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
      evidence: ev("provisional", "Technique ref §5, §6, §8; S10b-9; S14.4-3; O26, O35", "VALIDATED: the DI equation and the digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the manual reference point the exposure is measured against (an engine teaching constant); no numeric mAs target and no universal EIT or DI limit is claimed (Bontrager gives no mAs for the lower limb, and no source for the exposure appearance, O35)."),
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
      evidence: ev("provisional", "Technique ref §7, §8; S14.4-3", "VALIDATED: digital dynamic range can hide excess exposure (dose creep). PROVISIONAL: the DI bands. No patient dose is calculated."),
    },
    {
      id: "sid",
      kind: "range",
      category: "sid",
      setting: "sidCm",
      // Bontrager: minimum 40 in = 102 cm (p.224-225). ENGINE TEACHING CHOICES: the upper full-credit limit (110 cm) and the partial band (95–130 cm).
      ideal: [102, 110],
      acceptable: [95, 130],
      unit: "cm",
      variantOnLow: "magnified-geometry",
      label: T("Source-to-image distance (SID)", "المسافة بين المصدر والكاشف (SID)"),
      feedback: {
        pass: T("SID is at least the 102 cm (40 in) minimum and inside this simulator's teaching band (102–110 cm).", "قيمة SID لا تقل عن الحد الأدنى 102 سم (40 بوصة) وضمن النطاق التعليمي للمحاكي (102–110 سم)."),
        low: T(
          `SID is shorter than the 102 cm (40 in) minimum Bontrager gives for the lower limb (p.224-225). A shorter distance increases magnification and unsharpness (not drawn in this version) and raises the exposure at the detector (inverse square).`,
          `قيمة SID أقصر من الحد الأدنى 102 سم (40 بوصة) الذي يذكره Bontrager للطرف السفلي (ص.224-225). المسافة الأقصر تزيد التكبير وعدم الحدّة (لا يُرسمان في هذه النسخة) وتزيد التعريض عند الكاشف (قانون التربيع العكسي).`,
        ),
        high: T(
          "SID is longer than this simulator's teaching band (102–110 cm); exposure at the detector drops (inverse square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum; the upper limit and the partial band are engine teaching choices.)",
          "قيمة SID أطول من النطاق التعليمي في المحاكي (102–110 سم)؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط؛ والحد الأعلى والنطاق الجزئي اختياران تعليميان في المحاكي.)",
        ),
        fail: T(`SID is outside this case's protocol range for the ${partEn} (below about 95 cm or above 130 cm).`, `قيمة SID خارج نطاق بروتوكول هذه الحالة لـ${p.part.ar} (أقل من نحو 95 سم أو أكثر من 130 سم).`),
      },
      evidence: ev("provisional", `BONTRAGER-9 p.224-225 (SID minimum 40 in / 102 cm); S14.4-3`, "The 102 cm minimum is Bontrager (inch-to-cm conversion). The 110 cm upper full-credit limit and the 95–130 cm partial band are ENGINE TEACHING CHOICES, NOT Bontrager."),
    },
  ];
};

/** One knee / foot exam (S14.4). The four instances are `knee-ap.ts`, `knee-lateral.ts`, `foot-ap.ts` and `foot-oblique.ts`. */
export function makeLowerLimbExam(k: LowerLimbKind): AnyExamDefinition {
  const p = PER[k];
  const knee = k.startsWith("knee");
  const ankle = k.startsWith("ankle");
  const pair = knee ? (["knee-ap", "knee-lateral"] as const) : ankle ? (["ankle-ap", "ankle-lateral"] as const) : (["foot-ap", "foot-oblique"] as const);
  return {
    schemaVersion: 1,
    id: p.id,
    modality: "general-radiography",
    bodyPart: knee ? "knee" : ankle ? "ankle" : "foot",
    provisional: true,
    evidence: {
      status: "provisional",
      reference: `${ankle ? "docs/RAD-LAB_Medical_Reference_Ankle.md" : "docs/RAD-LAB_Medical_Reference_Knee_Foot.md"}; BONTRAGER-9 p.224-225, ${p.page}; docs/DECISIONS.md ${ankle ? "S14.5-*" : "S14.4-*"}`,
      note: "Exam-level classification: provisional until the educator / medical-physicist review is signed off. Every rule, tolerance and feedback sentence carries its own evidence class.",
    },
    defaultCaseId: "adult-demo",
    title: p.title,
    requiredProjection: p.id,
    // Both projections of the pair are selectable so that a wrong projection is possible; no breathing, so no `availableBreathing`.
    availableProjections: [...pair],
    availableMotionInstructions: ["none", "remain-still", "relax-and-move"],
    // BONTRAGER-9 p.232 / 233 / 246: 24 × 30 cm receptor, portrait (knee lateral: 18 × 24 or 24 × 30 cm; the larger size is an owner choice, S14.4-3).
    detector: { ...LOWER_LIMB_DETECTOR },
    requiredAnatomy: lowerLimbRegion(k),
    controls: {
      rotationDeg: { ...p.rotationControl },
      sidCm: { min: 80, max: 200, step: 1 },
      kvp: { min: 40, max: 100, step: 1 },
      // mAs steps through a preferred-number series, like a console; the range is hardware, not a target.
      mas: { min: 0.5, max: 25, step: 0.5, stations: MAS_STATIONS },
      // Tube angulation (S11 mechanism, + = caudad, − = cephalad): foot AP 10° toward the heel, knee lateral 5°–7° cephalad, the others perpendicular.
      tubeAngulationDeg: { min: -15, max: 15, step: 1 },
    },
    technique: lowerLimbTechnique[k],
    positioning: positioning(k),
    rules: rules(k),
    scoring: {
      // S14.4-3: the wrist / hand / elbow weights (S14.1b-1 option A, class C): the PA weights without breathing, redistributed proportionally.
      categoryWeights: { positioning: 28, rotation: 22, centering: 17, exposure: 22, sid: 11 },
      passThreshold: 70,
      criticalFindings: criticalFindings(k),
    },
    possibleErrors: [
      { id: "rotated", variant: "rotated", description: T(`${knee ? "Knee" : ankle ? "Ankle" : "Foot"} rotation`, knee ? "دوران الركبة" : ankle ? "دوران الكاحل" : "دوران القدم") },
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

