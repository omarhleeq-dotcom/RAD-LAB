import type { LocalizedText } from "@/domain/localized";

/**
 * Per-exam facts of the two ANKLE exams (S14.5, `ankle-ap` BONTRAGER-9 p.239 and `ankle-lateral` p.242), in the shape of the knee / foot entries of `PER`
 * in `lower-limb-common.ts` (same keys, spread into `PER`). LEFT ankle (the side is INFERRED from the fibula position on the AP baseline, O76).
 * Labels: BONTRAGER = taken from the textbook page (class A); ENGINE TEACHING CHOICE (class B) = the simulator's own number, named as such in the
 * learner-visible text and in `REVIEW_PACKAGE.md`: the 60–80 kV partial band, the ±2° / ±5° rotation and tube-angle bands, the excess-collimation margins,
 * the extent of the required region and the centring tolerances. Arabic text is DRAFT pending owner / educator review (use «الكاشف»).
 * TODO(medical-review): validate with a radiography educator before release.
 */
const T = (en: string, ar: string): LocalizedText => ({ en, ar });

export const ANKLE_PER = {
  "ankle-ap": {
    id: "ankle-ap",
    page: "p.239",
    part: T("ankle", "الكاحل"),
    title: T("Adult Ankle X-ray — AP", "أشعة الكاحل للبالغ — AP"),
    name: T("AP", "AP"),
    // BONTRAGER p.239: digital 70 ± 5 kV (analog 60 ± 5). The partial band is an ENGINE TEACHING CHOICE.
    kv: { full: [65, 75], partial: [60, 80] },
    // Excess-collimation margin per side (ENGINE TEACHING CHOICE): the field is centred on the central ray and the required region ends at the bottom of the baseline.
    excessCm: 5,
    centreLabel: T("Central ray — ankle joint (midway between the malleoli)", "الشعاع المركزي — مفصل الكاحل (في منتصف المسافة بين الكعبين)"),
    centreEn: "the ankle joint, midway between the malleoli",
    centreAr: "مفصل الكاحل، في منتصف المسافة بين الكعبين",
    centrePage: "ankle joint, midway between the malleoli",
    projectionPass: T("Correct projection: AP ankle (leg extended, not rotated), as requested.", "الإسقاط صحيح: الكاحل بإسقاط AP (الساق ممدودة وغير مدارة) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (AP ankle, leg extended). Re-position the leg as requested.",
      "الإسقاط لا يطابق الطلب (الكاحل بإسقاط AP، الساق ممدودة). أعد وضع الساق حسب الطلب.",
    ),
    rotationLabel: T("Ankle rotation (turn of the leg)", "دوران الكاحل (دوران الساق)"),
    rotationPass: T(
      "The leg is not rotated: the medial part of the ankle mortise is open, the lateral part is closed and the distal fibula is partly overlapped by the tibia and the talus (Bontrager p.239).",
      "الساق غير مدارة: الجزء الإنسي من تجويف مفصل الكاحل مفتوح والجزء الوحشي مغلق والشظية السفلية متراكبة جزئيًّا بالظنبوب وعظم الكاحل (Bontrager ص.239).",
    ),
    rotationFail: T(
      "The leg is rotated: the medial and lateral parts of the ankle mortise no longer look as they do in a true AP (medial open, lateral closed) and the overlap of the distal fibula changes (Bontrager p.239). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). Value 0 = the leg not rotated, the line between the malleoli about 15° from parallel to the detector (the lateral malleolus lies further back). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "الساق مدارة: لم يعد الجزءان الإنسي والوحشي من تجويف مفصل الكاحل كما في إسقاط AP الصحيح (الإنسي مفتوح والوحشي مغلق) وتغيّر تراكب الشظية السفلية (Bontrager ص.239). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). القيمة 0 = الساق غير مدارة والخط بين الكعبين يميل نحو 15° عن الموازاة للكاشف (الكعب الوحشي أكثر خلفية). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the distal tibia and fibula.", "الحافة العلوية للمجال تقطع الظنبوب والشظية السفليين."),
      bottom: T("The bottom of the field cuts off the talus and the upper part of the heel.", "الحافة السفلية للمجال تقطع عظم الكاحل والجزء العلوي من العقب."),
      left: T("The left side of the field (in the detector view) cuts off the medial side of the ankle (the medial malleolus).", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الجهة الإنسية للكاحل (الكعب الإنسي)."),
      right: T("The right side of the field (in the detector view) cuts off the lateral side of the ankle (the lateral malleolus and the fibula).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع الجهة الوحشية للكاحل (الكعب الوحشي والشظية)."),
    },
    centreXLabel: T("Central ray — across the ankle", "الشعاع المركزي — عرض الكاحل"),
    centreXPass: T("The central ray is midway between the malleoli, across the ankle (Bontrager p.239).", "الشعاع المركزي في منتصف المسافة بين الكعبين عبر الكاحل (Bontrager ص.239)."),
    centreXFail: T("The central ray is off the middle of the ankle from side to side. Re-centre it.", "الشعاع المركزي بعيد عن منتصف الكاحل من الجانب إلى الجانب. أعد توسيطه."),
    centreXLow: T(
      "The central ray is shifted to the left of the ankle (the medial side in this view). The medial malleolus may be clipped. Move the target right, toward the point midway between the malleoli.",
      "الشعاع المركزي مزاح إلى يسار الكاحل (الجهة الإنسية في هذا العرض). قد يُقطع الكعب الإنسي. حرّك الهدف يمينًا نحو النقطة الواقعة في منتصف المسافة بين الكعبين.",
    ),
    centreXHigh: T(
      "The central ray is shifted to the right of the ankle (the lateral side in this view). The lateral malleolus may be clipped. Move the target left, toward the point midway between the malleoli.",
      "الشعاع المركزي مزاح إلى يمين الكاحل (الجهة الوحشية في هذا العرض). قد يُقطع الكعب الوحشي. حرّك الهدف يسارًا نحو النقطة الواقعة في منتصف المسافة بين الكعبين.",
    ),
    centreYLow: T(
      "The central ray is too far up the leg (top of the detector view). The talus and the upper part of the heel may be clipped. Move the target down, toward the ankle joint.",
      "الشعاع المركزي أعلى الساق أكثر من اللازم (أعلى عرض الكاشف). قد يُقطع عظم الكاحل والجزء العلوي من العقب. حرّك الهدف للأسفل نحو مفصل الكاحل.",
    ),
    centreYHigh: T(
      "The central ray is too far down the leg (bottom of the detector view). The distal tibia and fibula may be clipped. Move the target up, toward the ankle joint.",
      "الشعاع المركزي أسفل الساق أكثر من اللازم (أسفل عرض الكاشف). قد يُقطع الظنبوب والشظية السفليان. حرّك الهدف للأعلى نحو مفصل الكاحل.",
    ),
    coverageEn: "the distal tibia and fibula, both malleoli and the talus",
    coverageAr: "الظنبوب والشظية السفليين والكعبين وعظم الكاحل",
    angle: {
      label: T("Tube angle (perpendicular)", "ميل الأنبوب (عمودي)"),
      ideal: [-2, 2] as [number, number],
      acceptable: [-5, 5] as [number, number],
      pass: T("The central ray is perpendicular to the detector, as for the AP ankle (Bontrager p.239).", "الشعاع المركزي عمودي على الكاشف كما في الكاحل بإسقاط AP (Bontrager ص.239)."),
      fail: T(
        "The tube angle is far from perpendicular. For the AP ankle the central ray is perpendicular to the detector, midway between the malleoli (Bontrager p.239).",
        "ميل الأنبوب بعيد عن العمودي. في الكاحل بإسقاط AP يكون الشعاع المركزي عموديًا على الكاشف في منتصف المسافة بين الكعبين (Bontrager ص.239).",
      ),
      low: T(
        "The tube is angled cephalad (toward the knee). The AP ankle needs a perpendicular beam (Bontrager p.239).",
        "الأنبوب مائل نحو الرأس (باتجاه الركبة). يحتاج الكاحل بإسقاط AP شعاعًا عموديًا (Bontrager ص.239).",
      ),
      high: T(
        "The tube is angled caudad (toward the toes). The AP ankle needs a perpendicular beam (Bontrager p.239).",
        "الأنبوب مائل نحو القدمين (باتجاه الأصابع). يحتاج الكاحل بإسقاط AP شعاعًا عموديًا (Bontrager ص.239).",
      ),
      evidenceNote: "CR perpendicular to the detector is Bontrager. The ±2° full-credit and ±5° partial-credit bands are an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.",
    },
    imageCriteria: [
      { id: "rotation", description: T("True AP: medial mortise open, lateral mortise closed; some overlap of the distal fibula by the tibia and the talus", "إسقاط AP صحيح: الجزء الإنسي من التجويف مفتوح والوحشي مغلق؛ وبعض التراكب للشظية السفلية بالظنبوب وعظم الكاحل") },
      { id: "coverage", description: T("Distal tibia and fibula, both malleoli and the talus included (this reference picture ends at the talus and the upper heel: the proximal half of the metatarsals is not shown); soft tissue visible", "الظنبوب والشظية السفليان والكعبان وعظم الكاحل ضمن الصورة (تنتهي هذه الصورة المرجعية عند عظم الكاحل وأعلى العقب: النصف القريب من عظام المشط غير ظاهر)؛ والأنسجة الرخوة ظاهرة") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
    marker: { x: 0.52, y: 0 },
    markerSideText: "the lateral margin of the field, clear of the ankle",
    rotationControl: { min: -15, max: 15, step: 1 },
    rotationUnit: "°",
  },
  "ankle-lateral": {
    id: "ankle-lateral",
    page: "p.242",
    part: T("ankle", "الكاحل"),
    title: T("Adult Ankle X-ray — Lateral", "أشعة الكاحل للبالغ — جانبي"),
    name: T("lateral", "الجانبي"),
    // BONTRAGER p.242: digital 70 ± 5 kV. The partial band is an ENGINE TEACHING CHOICE.
    kv: { full: [65, 75], partial: [60, 80] },
    excessCm: 4.5,
    centreLabel: T("Central ray — ankle joint (at the medial malleolus)", "الشعاع المركزي — مفصل الكاحل (عند الكعب الإنسي)"),
    centreEn: "the ankle joint, at the medial malleolus",
    centreAr: "مفصل الكاحل، عند الكعب الإنسي",
    centrePage: "ankle joint, at the medial malleolus",
    projectionPass: T("Correct projection: lateral ankle (lateral recumbent, foot dorsiflexed), as requested.", "الإسقاط صحيح: الكاحل بالإسقاط الجانبي (استلقاء جانبي والقدم مثنية ظهريًّا) كما هو مطلوب."),
    projectionFail: T(
      "The projection does not match the request (lateral ankle, foot dorsiflexed). Re-position the leg as requested.",
      "الإسقاط لا يطابق الطلب (الكاحل بالإسقاط الجانبي، القدم مثنية ظهريًّا). أعد وضع الساق حسب الطلب.",
    ),
    rotationLabel: T("Ankle rotation (turn of the leg)", "دوران الكاحل (دوران الساق)"),
    rotationPass: T(
      "The ankle is a true lateral: the distal fibula lies over the posterior half of the tibia, the lateral malleolus is seen through the distal tibia and the talus, and the tibiotalar joint is open with a uniform space (Bontrager p.242).",
      "الكاحل بإسقاط جانبي صحيح: الشظية السفلية فوق النصف الخلفي للظنبوب والكعب الوحشي ظاهر عبر الظنبوب السفلي وعظم الكاحل ومفصل الظنبوب والكاحل مفتوح بحيز منتظم (Bontrager ص.242).",
    ),
    rotationFail: T(
      "The ankle is rotated: the distal fibula no longer lies over the posterior half of the tibia and the tibiotalar joint space is no longer uniform (Bontrager p.242). Only the amount of rotation is scored, not its direction (Bontrager gives no tolerance). The ±2° full-credit and ±5° partial-credit bands are an engine teaching choice.",
      "الكاحل مائل (دوران): لم تعد الشظية السفلية فوق النصف الخلفي للظنبوب ولم يعد حيز مفصل الظنبوب والكاحل منتظمًا (Bontrager ص.242). يُحتسب مقدار الدوران فقط دون اتجاهه (لا يذكر Bontrager حدًّا). نطاقا ±2° (درجة كاملة) و±5° (درجة جزئية) اختيار تعليمي في المحاكي.",
    ),
    clippedSides: {
      top: T("The top of the field cuts off the distal tibia and fibula.", "الحافة العلوية للمجال تقطع الظنبوب والشظية السفليين."),
      bottom: T("The bottom of the field cuts off the soft tissue below the heel.", "الحافة السفلية للمجال تقطع الأنسجة الرخوة أسفل العقب."),
      left: T("The left side of the field (in the detector view) cuts off the front of the foot (the navicular and the cuboid).", "الجانب الأيسر للمجال (في عرض الكاشف) يقطع مقدمة القدم (الزورقي والنردي)."),
      right: T("The right side of the field (in the detector view) cuts off the back of the ankle (the heel and the soft tissue behind it).", "الجانب الأيمن للمجال (في عرض الكاشف) يقطع خلف الكاحل (العقب والأنسجة الرخوة خلفه)."),
    },
    centreXLabel: T("Central ray — front to back across the ankle", "الشعاع المركزي — من الأمام إلى الخلف عبر الكاحل"),
    centreXPass: T("The central ray is at the ankle joint from front to back in the detector view (Bontrager p.242).", "الشعاع المركزي عند مفصل الكاحل من الأمام إلى الخلف في عرض الكاشف (Bontrager ص.242)."),
    centreXFail: T("The central ray is off the ankle joint from front to back. Re-centre it.", "الشعاع المركزي بعيد عن مفصل الكاحل من الأمام إلى الخلف. أعد توسيطه."),
    centreXLow: T(
      "The central ray is shifted to the left of the joint (toward the front of the foot). The heel may be clipped. Move the target right, toward the ankle joint.",
      "الشعاع المركزي مزاح إلى يسار المفصل (نحو مقدمة القدم). قد يُقطع العقب. حرّك الهدف يمينًا نحو مفصل الكاحل.",
    ),
    centreXHigh: T(
      "The central ray is shifted to the right of the joint (toward the heel). The front of the foot may be clipped. Move the target left, toward the ankle joint.",
      "الشعاع المركزي مزاح إلى يمين المفصل (نحو العقب). قد تُقطع مقدمة القدم. حرّك الهدف يسارًا نحو مفصل الكاحل.",
    ),
    centreYLow: T(
      "The central ray is too far up the leg (top of the detector view). The heel and the soft tissue below it may be clipped. Move the target down, toward the ankle joint.",
      "الشعاع المركزي أعلى الساق أكثر من اللازم (أعلى عرض الكاشف). قد يُقطع العقب والأنسجة الرخوة أسفله. حرّك الهدف للأسفل نحو مفصل الكاحل.",
    ),
    centreYHigh: T(
      "The central ray is too far down the leg (bottom of the detector view). The distal tibia and fibula may be clipped. Move the target up, toward the ankle joint.",
      "الشعاع المركزي أسفل الساق أكثر من اللازم (أسفل عرض الكاشف). قد يُقطع الظنبوب والشظية السفليان. حرّك الهدف للأعلى نحو مفصل الكاحل.",
    ),
    coverageEn: "the distal tibia and fibula, the talus and the calcaneus",
    coverageAr: "الظنبوب والشظية السفليين وعظم الكاحل وعظم العقب",
    angle: {
      label: T("Tube angle (perpendicular)", "ميل الأنبوب (عمودي)"),
      ideal: [-2, 2] as [number, number],
      acceptable: [-5, 5] as [number, number],
      pass: T("The central ray is perpendicular to the detector, as for the lateral ankle (Bontrager p.242).", "الشعاع المركزي عمودي على الكاشف كما في الكاحل بالإسقاط الجانبي (Bontrager ص.242)."),
      fail: T(
        "The tube angle is far from perpendicular. For the lateral ankle the central ray is perpendicular to the detector, at the medial malleolus (Bontrager p.242).",
        "ميل الأنبوب بعيد عن العمودي. في الكاحل بالإسقاط الجانبي يكون الشعاع المركزي عموديًا على الكاشف عند الكعب الإنسي (Bontrager ص.242).",
      ),
      low: T(
        "The tube is angled cephalad (toward the knee). The lateral ankle needs a perpendicular beam (Bontrager p.242).",
        "الأنبوب مائل نحو الرأس (باتجاه الركبة). يحتاج الكاحل بالإسقاط الجانبي شعاعًا عموديًا (Bontrager ص.242).",
      ),
      high: T(
        "The tube is angled caudad (toward the toes). The lateral ankle needs a perpendicular beam (Bontrager p.242).",
        "الأنبوب مائل نحو القدمين (باتجاه الأصابع). يحتاج الكاحل بالإسقاط الجانبي شعاعًا عموديًا (Bontrager ص.242).",
      ),
      evidenceNote: "CR perpendicular to the detector is Bontrager. The ±2° full-credit and ±5° partial-credit bands are an ENGINE TEACHING CHOICE. Feedback only: the tube angle is NOT drawn on the result image.",
    },
    imageCriteria: [
      { id: "rotation", description: T("True lateral: distal fibula over the posterior half of the tibia; tibiotalar joint open with a uniform space; lateral malleolus seen through the distal tibia and talus", "إسقاط جانبي صحيح: الشظية السفلية فوق النصف الخلفي للظنبوب؛ ومفصل الظنبوب والكاحل مفتوح بحيز منتظم؛ والكعب الوحشي ظاهر عبر الظنبوب السفلي وعظم الكاحل") },
      { id: "coverage", description: T("Distal tibia and fibula, talus and calcaneus included (this reference picture shows the navicular and cuboid only partly and does not show the 5th metatarsal tuberosity); soft tissue visible", "الظنبوب والشظية السفليان وعظم الكاحل وعظم العقب ضمن الصورة (تُظهر هذه الصورة المرجعية الزورقي والنردي جزئيًّا فقط ولا تُظهر حدبة المشط الخامس)؛ والأنسجة الرخوة ظاهرة") },
      { id: "sharpness", description: T("No loss of sharpness from patient movement", "لا يوجد فقدان في الحدّة بسبب حركة المريض") },
      { id: "exposure", description: T("Detector exposure near target (judged by DI, not by displayed brightness)", "تعريض كاشف قريب من الهدف (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)") },
    ],
    marker: { x: 0.66, y: 0 },
    markerSideText: "the margin of the field, clear of the ankle",
    rotationControl: { min: -15, max: 15, step: 1 },
    rotationUnit: "°",
  },
} as const;
