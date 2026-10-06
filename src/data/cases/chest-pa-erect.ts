import type { RadCase } from "@/domain/case";
import { chestPaCooperativeAdult } from "./chest-pa-patient";
import { chestPaRadiograph } from "./chest-pa-radiograph";
import { chestPaTechnique } from "./chest-pa-technique";

/**
 * Adult Chest X-ray — PA Erect.
 *
 * PROVISIONAL / DEMO DATA: every numeric range below (kVp, mAs, SID, centering,
 * collimation, rotation tolerance) is a placeholder chosen to exercise the engine.
 * None of it has been validated against an authoritative source and it must not
 * be presented as clinical guidance. TODO(medical-review): validate with a
 * radiography educator before release.
 *
 * Session 2: every rule carries `evidence` tracing it to
 * docs/RAD-LAB_Medical_Reference_Chest_PA.md (validated / educational-simplification / provisional).
 * Tolerances and region sizes remain provisional even where the underlying target is validated.
 */
/** Console mAs stations (≈ +25 % per step). Selectable range only: says nothing about a correct value. */
const MAS_STATIONS = [0.5, 0.63, 0.8, 1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 32, 40];

export const chestPaErect: RadCase = {
  id: "chest-pa-erect",
  modality: "general-radiography",
  bodyPart: "chest",
  provisional: true,
  title: { en: "Adult Chest X-ray — PA Erect", ar: "أشعة الصدر للبالغ — PA وقوفًا" },
  patient: {
    age: 45,
    sex: "male",
    description: {
      en: "45-year-old male, ambulant, able to stand and follow breathing instructions.",
      ar: "ذكر عمره ٤٥ عامًا، قادر على المشي والوقوف واتباع تعليمات التنفس.",
    },
  },
  clinicalScenario: {
    en: "Persistent cough for three weeks. Referred by the outpatient clinic.",
    ar: "سعال مستمر منذ ثلاثة أسابيع. محوَّل من العيادة الخارجية.",
  },
  requestedExamination: {
    en: "Chest X-ray, PA erect.",
    ar: "أشعة صدر، وضعية PA وقوفًا.",
  },
  patientCondition: {
    en: "Stable. No mobility limitations. The patient has arrived slightly turned to one side.",
    ar: "حالته مستقرة ولا توجد قيود على الحركة. وصل المريض وهو مائل قليلًا إلى أحد الجانبين.",
  },
  requiredProjection: "pa-erect",
  detector: { widthCm: 35, heightCm: 43 },
  // Required anatomy region on the detector (cm from its top-left corner). Demo values.
  requiredAnatomy: { xCm: 4, yCm: 3, widthCm: 27, heightCm: 31 },
  controls: {
    rotationDeg: { min: -20, max: 20, step: 1 },
    sidCm: { min: 100, max: 200, step: 5 },
    kvp: { min: 50, max: 150, step: 1 },
    // mAs steps through a preferred-number (R10-style) series, like a console; the range is hardware, not a target.
    mas: { min: 0.5, max: 40, step: 0.5, stations: MAS_STATIONS },
  },
  positioning: {
    // Educational target region. Midline + mid-thoracic/T7 teaching landmark (reference §2 Centering, §3C).
    // y = centre of requiredAnatomy (18.5 cm of 43 cm → -0.14). NOT a clinical measurement.
    // TODO(medical-review): tolerances are provisional.
    centering: {
      target: { x: 0, y: -0.14 },
      idealTolerance: { x: 0.08, y: 0.1 }, // ≈ ±1.4 cm / ±2.2 cm on this detector
      acceptableTolerance: { x: 0.17, y: 0.25 }, // ≈ ±3 cm / ±5.4 cm
    },
    minCollimation: 0.3,
    // Session 4 fix: a 2.2 cm marker placed in the lateral margin (x ≈ 1.7–3.9 cm, y ≈ 10.9–13.1 cm) lies INSIDE a typical
    // correct field (≥ ≈ 33 cm wide, central ray within ≈ ±0.7 cm of the midline) and outside the required-anatomy
    // region (x ≥ 4 cm), so a learner who never moves it still records a complete L / R. A narrower or clearly
    // off-centre field genuinely clips it (behaviour kept).
    markerSizeCm: 2.2,
    defaultMarkerPosition: { x: -0.84, y: -0.44 },
  },
  technique: chestPaTechnique,
  radiograph: chestPaRadiograph,
  patientCooperation: chestPaCooperativeAdult,
  availableProjections: ["pa-erect", "ap-erect", "lateral-left"],
  availableBreathing: [
    "deep-inspiration-hold",
    "expiration-hold",
    "normal-breathing",
    "no-instruction",
  ],
  availableMotionInstructions: ["none", "remain-still", "relax-and-move"],
  initialSettings: {
    projection: "ap-erect",
    rotationDeg: 8,
    centralRay: { x: 0.23, y: 0.3 },
    collimation: { width: 1, height: 1 },
    chinPosition: "tucked",
    shoulderPosition: "relaxed",
    sideMarker: null,
    markerPosition: { x: -0.84, y: -0.44 },
    sidCm: 120,
    kvp: 70,
    mas: 12,
    exposureMode: "manual",
    aecChambers: [],
    breathing: "no-instruction",
    motionInstruction: "none",
  },
  scoring: {
    categoryWeights: {
      positioning: 25,
      rotation: 20,
      centering: 15,
      exposure: 20,
      sid: 10,
      breathing: 10,
    },
    passThreshold: 70,
  },
  rules: [
    {
      id: "projection",
      kind: "equals",
      category: "positioning",
      weight: 2,
      setting: "projection",
      expected: "pa-erect",
      variantOnFail: "wrong-projection",
      label: { en: "Projection / patient position", ar: "الإسقاط ووضعية المريض" },
      feedback: {
        pass: {
          en: "Correct projection: PA erect, as requested.",
          ar: "الإسقاط صحيح: PA وقوفًا كما هو مطلوب.",
        },
        fail: {
          en: "The projection does not match the request (PA erect). The projection changes which structures are magnified and how the heart and scapulae are shown. Re-position the patient as requested.",
          ar: "الإسقاط لا يطابق الطلب (PA وقوفًا). يؤثر الإسقاط في الهياكل المكبَّرة وفي ظهور القلب واللوحين. أعد وضع المريض حسب الطلب.",
        },
      },
      evidence: {
        status: "validated",
        reference: "§2 Patient orientation; §3A",
      },
    },
    {
      id: "collimation-clipping",
      kind: "coverage",
      check: "clipping",
      category: "positioning",
      weight: 2,
      maxMarginCm: 5,
      variantOnClipped: "clipped",
      label: { en: "Collimation — anatomy coverage", ar: "التحديد — تغطية التشريح" },
      clippedSides: {
        top: {
          en: "The top of the field cuts off the lung apices.",
          ar: "الحافة العلوية للمجال تقطع قمم الرئتين.",
        },
        bottom: {
          en: "The bottom of the field cuts off the costophrenic angles and the lower lungs.",
          ar: "الحافة السفلية للمجال تقطع الزوايا الضلعية الحجابية وأسفل الرئتين.",
        },
        left: {
          en: "The left side of the field (in the detector view) cuts off the lateral edge of the lung.",
          ar: "الجانب الأيسر للمجال (في عرض الكاسيت) يقطع الحافة الجانبية للرئة.",
        },
        right: {
          en: "The right side of the field (in the detector view) cuts off the lateral edge of the lung.",
          ar: "الجانب الأيمن للمجال (في عرض الكاسيت) يقطع الحافة الجانبية للرئة.",
        },
      },
      feedback: {
        pass: {
          en: "The field covers the lung apices, both lungs and the costophrenic angles.",
          ar: "المجال يغطي قمم الرئتين والرئتين معًا والزوايا الضلعية الحجابية.",
        },
        fail: {
          en: "Anatomy outside the field is missing from the image. Open the field or re-centre the central ray.",
          ar: "التشريح الواقع خارج المجال يغيب عن الصورة. وسّع المجال أو أعد توسيط الشعاع المركزي.",
        },
      },
      evidence: {
        status: "educational-simplification",
        reference: "§2 Coverage / collimation outcome; §3D",
        note: "Required anatomy (apices, both lungs, costophrenic angles) is validated; the demo region size in cm is provisional.",
      },
    },
    {
      id: "collimation-excess",
      kind: "coverage",
      check: "excess",
      category: "positioning",
      weight: 1,
      maxMarginCm: 5,
      label: { en: "Collimation — field size", ar: "التحديد — حجم المجال" },
      feedback: {
        pass: {
          en: "The field is not larger than necessary for the required anatomy.",
          ar: "المجال ليس أكبر من اللازم للتشريح المطلوب.",
        },
        fail: {
          en: "The field is opened wider than necessary.",
          ar: "المجال مفتوح أكثر من اللازم.",
        },
        high: {
          en: "The field is opened wider than necessary. Extra field size exposes tissue outside the area of interest and adds scatter and patient dose. Close the shutters closer to the anatomy, without cutting it off.",
          ar: "المجال مفتوح أكثر من اللازم. المجال الزائد يعرّض أنسجة خارج المنطقة المطلوبة ويزيد التشتت وجرعة المريض. قرّب حواف المجال من التشريح دون أن تقطعه.",
        },
      },
      evidence: {
        status: "educational-simplification",
        reference: "§2 Coverage (avoid unnecessarily large field); §3D",
        note: "Principle validated; the 5 cm margin limit is provisional/configurable.",
      },
    },
    {
      id: "chin",
      kind: "equals",
      category: "positioning",
      weight: 1,
      setting: "chinPosition",
      expected: "elevated",
      variantOnFail: "chin-overlap",
      label: { en: "Chin position", ar: "وضعية الذقن" },
      feedback: {
        pass: {
          en: "Chin elevated and clear of the lung apices.",
          ar: "الذقن مرفوعة وبعيدة عن قمم الرئتين.",
        },
        fail: {
          en: "The chin is tucked down and will project over the lung apices, hiding the upper chest. Ask the patient to lift and extend the chin slightly.",
          ar: "الذقن منخفضة وستظهر فوق قمم الرئتين فتحجب أعلى الصدر. اطلب من المريض رفع الذقن وبسطها قليلًا.",
        },
      },
      evidence: { status: "validated", reference: "§2 Head and shoulders; §3E; §5 item 8" },
    },
    {
      id: "shoulders",
      kind: "equals",
      category: "positioning",
      weight: 1,
      setting: "shoulderPosition",
      expected: "rolled-forward",
      variantOnFail: "scapulae-overlap",
      label: { en: "Shoulder position", ar: "وضعية الكتفين" },
      feedback: {
        pass: {
          en: "Shoulders rolled forward: the scapulae are moved out of the lung fields.",
          ar: "الكتفان مدوَّران للأمام: اللوحان بعيدان عن الحقلين الرئويين.",
        },
        fail: {
          en: "The shoulders are not rolled forward, so the scapulae stay over the lung fields and hide lung tissue. Roll the shoulders forward so the scapulae move laterally.",
          ar: "الكتفان غير مدوَّرين للأمام فيبقى اللوحان فوق الحقلين الرئويين ويحجبان نسيج الرئة. دوِّر الكتفين للأمام ليتحرك اللوحان جانبيًا.",
        },
      },
      evidence: { status: "validated", reference: "§2 Head and shoulders; §3E; §5 item 9" },
    },
    {
      id: "side-marker",
      kind: "marker",
      category: "positioning",
      weight: 0,
      label: { en: "Side marker (not scored)", ar: "علامة الجانب (غير محسوبة)" },
      feedback: {
        pass: {
          en: "Side marker placed inside the image, clear of the lung fields.",
          ar: "علامة الجانب موضوعة داخل الصورة وبعيدًا عن الحقلين الرئويين.",
        },
        fail: {
          en: "No side marker placed. Choose L or R and place it inside the image margin.",
          ar: "لم توضع علامة جانب. اختر L أو R وضعها داخل هامش الصورة.",
        },
        overlap: {
          en: "The marker covers the lung fields. Move it into the margin, away from the anatomy of interest.",
          ar: "العلامة تغطي الحقلين الرئويين. انقلها إلى الهامش بعيدًا عن التشريح المطلوب.",
        },
        outsideField: {
          en: "The marker is outside the collimated field, so it would not be recorded on the image. Move it inside the field.",
          ar: "العلامة خارج المجال المحدَّد فلن تُسجَّل على الصورة. انقلها إلى داخل المجال.",
        },
      },
      evidence: {
        status: "educational-simplification",
        reference: "§3F",
        note: "Placement interaction only; deliberately unscored. TODO(medical-review): validated rule for marker side vs patient side.",
      },
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
      label: { en: "Patient rotation", ar: "دوران المريض" },
      feedback: {
        pass: {
          en: "The patient is square to the detector — no meaningful rotation.",
          ar: "المريض متعامد مع الكاسيت — لا يوجد دوران ملحوظ.",
        },
        fail: {
          en: "The patient is rotated. Rotation distorts the heart and mediastinum and makes one lung appear different from the other, which can mimic disease. Check that the shoulders and the anterior superior iliac spines are equidistant from the detector, then correct.",
          ar: "المريض مائل (دوران). يشوّه الدوران ظلّ القلب والمنصف ويجعل إحدى الرئتين تبدو مختلفة عن الأخرى وقد يحاكي مرضًا. تأكد أن الكتفين متساويا البعد عن الكاسيت ثم صحّح الوضعية.",
        },
      },
      evidence: {
        status: "educational-simplification",
        reference: "§2 Rotation; §3B; §6 Rotation",
        note: "Neutral target is validated; the +/-2 and +/-5 degree bands are provisional and the sign of rotation is not interpreted.",
      },
    },
    {
      id: "centering-lateral",
      kind: "centering",
      axis: "x",
      category: "centering",
      label: { en: "Central ray — midline", ar: "الشعاع المركزي — الخط المنتصف" },
      feedback: {
        pass: {
          en: "The central ray is aligned with the receptor midline.",
          ar: "الشعاع المركزي محاذٍ للخط المنتصف للكاسيت.",
        },
        fail: {
          en: "The central ray is off the receptor midline. Re-centre it to the midsagittal plane.",
          ar: "الشعاع المركزي بعيد عن الخط المنتصف للكاسيت. أعد توسيطه على المستوى السهمي المنتصف.",
        },
        low: {
          en: "The central ray is shifted to the left of the midline (left side of the detector view). The chest sits off-centre and the lung edge on that side may be clipped. Move the target right, toward the midline.",
          ar: "الشعاع المركزي مزاح إلى يسار الخط المنتصف (يسار عرض الكاسيت). يقع الصدر بعيدًا عن المركز وقد تُقطع حافة الرئة في ذلك الجانب. حرّك الهدف يمينًا نحو الخط المنتصف.",
        },
        high: {
          en: "The central ray is shifted to the right of the midline (right side of the detector view). The chest sits off-centre and the lung edge on that side may be clipped. Move the target left, toward the midline.",
          ar: "الشعاع المركزي مزاح إلى يمين الخط المنتصف (يمين عرض الكاسيت). يقع الصدر بعيدًا عن المركز وقد تُقطع حافة الرئة في ذلك الجانب. حرّك الهدف يسارًا نحو الخط المنتصف.",
        },
      },
      evidence: {
        status: "educational-simplification",
        reference: "§2 Centering; §3C",
        note: "Midline alignment is validated; tolerance values are provisional.",
      },
    },
    {
      id: "centering-vertical",
      kind: "centering",
      axis: "y",
      category: "centering",
      label: { en: "Central ray — level (mid-thoracic)", ar: "الشعاع المركزي — المستوى (منتصف الصدر)" },
      feedback: {
        pass: {
          en: "The central ray is at the mid-thoracic region (educational target).",
          ar: "الشعاع المركزي عند منطقة منتصف الصدر (هدف تعليمي).",
        },
        fail: {
          en: "The central ray is not at the mid-thoracic level.",
          ar: "الشعاع المركزي ليس عند مستوى منتصف الصدر.",
        },
        low: {
          en: "The central ray is too high — aimed above the mid-thoracic region. The field moves up with it, so the lower lungs and costophrenic angles may be cut off. Lower the target toward the middle of the chest.",
          ar: "الشعاع المركزي مرتفع جدًا — موجَّه فوق منتصف الصدر. يتحرك المجال معه للأعلى فقد تُقطع أسفل الرئتين والزوايا الضلعية الحجابية. اخفض الهدف نحو منتصف الصدر.",
        },
        high: {
          en: "The central ray is too low — aimed below the mid-thoracic region. The field moves down with it, so the lung apices may be cut off. Raise the target toward the middle of the chest.",
          ar: "الشعاع المركزي منخفض جدًا — موجَّه تحت منتصف الصدر. يتحرك المجال معه للأسفل فقد تُقطع قمم الرئتين. ارفع الهدف نحو منتصف الصدر.",
        },
      },
      evidence: {
        status: "educational-simplification",
        reference: "§2 Centering (T7 teaching landmark); §3C; §5 item 5",
        note: "Target modelled as the centre of the required-anatomy region, not a measured T7 position; tolerances provisional.",
      },
    },
    // ── Exposure / technique (Session 3). Four independent subchecks driven by the technique model and the
    //    case's TechniqueProfile; none of them rewards "more exposure" or reads displayed brightness. ──
    {
      id: "kvp",
      kind: "technique",
      check: "kvp-band",
      category: "exposure",
      weight: 1,
      variantOnLow: "low-penetration",
      label: { en: "kVp (beam energy / penetration)", ar: "kVp (طاقة الحزمة / الاختراق)" },
      feedback: {
        pass: {
          en: "kVp is inside this demo protocol's target band. Adult PA chest is taught as a relatively high-kVp examination: a higher tube potential gives a more penetrating beam, which helps show the mediastinum and the lung fields together. The exact band is a provisional demo target, not a universal value.",
          ar: "قيمة kVp ضمن النطاق المستهدف في هذا البروتوكول التجريبي. يُدرَّس تصوير صدر البالغ PA كفحص بجهد أنبوبي عالٍ نسبيًا: الجهد الأعلى يعطي حزمة أكثر اختراقًا تساعد على إظهار المنصف والحقلين الرئويين معًا. النطاق الدقيق هدف تجريبي مؤقت وليس قيمة عالمية.",
        },
        low: {
          en: "kVp is below this demo protocol's target band. A lower tube potential gives a less penetrating beam that is absorbed more by dense structures, so the retrocardiac lung and the spine behind the heart are harder to demonstrate. Extra mAs adds photons but not penetrating energy. (About 100–150 kV is a common reference range for chest, not a universal rule.)",
          ar: "قيمة kVp أقل من النطاق المستهدف في هذا البروتوكول التجريبي. الجهد الأنبوبي المنخفض يعطي حزمة أقل اختراقًا تمتصها البنى الكثيفة أكثر، فيصعب إظهار الرئة خلف القلب والعمود الفقري خلفه. زيادة mAs تضيف فوتونات لكنها لا تضيف طاقة اختراق. (نحو 100–150 kV نطاق مرجعي شائع للصدر وليس قاعدة عالمية.)",
        },
        high: {
          en: "kVp is above this demo protocol's target band. A higher-energy beam penetrates more, lowers subject contrast and produces more scatter. Whether that is acceptable depends on the detector, image processing and local protocol, so the band is a provisional demo target rather than a universal limit.",
          ar: "قيمة kVp أعلى من النطاق المستهدف في هذا البروتوكول التجريبي. الحزمة الأعلى طاقة تخترق أكثر وتقلل تباين الجسم وتزيد التشتت. مدى قبول ذلك يعتمد على الكاشف ومعالجة الصورة والبروتوكول المحلي، لذا فالنطاق هدف تجريبي مؤقت وليس حدًا عالميًا.",
        },
        fail: {
          en: "kVp is outside the demo protocol's range.",
          ar: "قيمة kVp خارج نطاق البروتوكول التجريبي.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "Technique ref §3.2, §8, §15.1",
        note: "100–150 kV is a COMMON REFERENCE range (IAEA example) and earns partial credit; the narrower full-credit band is PROVISIONAL / LOCAL-PROTOCOL DEPENDENT. kVp physics (spectrum, penetration, output) is VALIDATED but is never mapped to displayed darkness.",
      },
    },
    {
      id: "exposure-adequacy",
      kind: "technique",
      check: "exposure-adequacy",
      category: "exposure",
      weight: 2,
      variantOnLow: "low-exposure",
      label: { en: "Detector exposure — adequate signal", ar: "تعريض الكاشف — إشارة كافية" },
      feedback: {
        pass: {
          en: "Detector exposure is close to this protocol's target (DI near 0) or above it, so there is enough signal and quantum noise is not limiting the image.",
          ar: "تعريض الكاشف قريب من هدف هذا البروتوكول (DI قريب من 0) أو أعلى منه، فالإشارة كافية والضجيج الكمّي لا يحدّ من جودة الصورة.",
        },
        high: {
          en: "The signal is adequate, but exposure above the target is not “better”: it adds radiation without a matching diagnostic benefit. See the dose-optimization check.",
          ar: "الإشارة كافية، لكن التعريض فوق الهدف ليس «أفضل»: فهو يضيف إشعاعًا دون فائدة تشخيصية مقابلة. راجع فحص تحسين الجرعة.",
        },
        low: {
          en: "Detector exposure is below the target (negative DI). Fewer photons reach the detector, so quantum noise rises and fine detail is harder to see. Digital processing can still make the image look acceptable, so judge exposure by the detector exposure / DI, not by displayed brightness. Bring the exposure back toward the target (mAs, SID or AEC set-up).",
          ar: "تعريض الكاشف أقل من الهدف (DI سالب). يصل عدد أقل من الفوتونات إلى الكاشف فيزداد الضجيج الكمّي وتصعب رؤية التفاصيل الدقيقة. يمكن لمعالجة الصورة الرقمية أن تُظهرها مقبولة رغم ذلك، لذا احكم على التعريض من تعريض الكاشف/DI وليس من سطوع الصورة المعروضة. أعد التعريض نحو الهدف (mAs أو SID أو إعداد AEC).",
        },
        fail: {
          en: "Detector exposure is well below the target: the image would be noisy.",
          ar: "تعريض الكاشف أقل بكثير من الهدف: ستكون الصورة مليئة بالضجيج.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "Technique ref §5, §6, §8, §15.2–15.5",
        note: "VALIDATED: DI equation and the digital-exposure concepts (noise, DI sign). PROVISIONAL: the ±1 / ±3 DI scoring bands and the demo target the exposure is measured against; no universal EIT or DI pass/fail limit is claimed.",
      },
    },
    {
      id: "dose-optimization",
      kind: "technique",
      check: "dose-optimization",
      category: "exposure",
      weight: 2,
      variantOnHigh: "excess-exposure",
      label: { en: "Dose awareness — avoid unnecessary exposure", ar: "الوعي بالجرعة — تجنّب التعريض غير الضروري" },
      feedback: {
        pass: {
          en: "Detector exposure is not above this protocol's target, so no unnecessary exposure was added.",
          ar: "تعريض الكاشف ليس أعلى من هدف هذا البروتوكول، فلم يُضَف تعريض غير ضروري.",
        },
        high: {
          en: "Detector exposure is above the target (positive DI). A digital system can still show an acceptable-looking image after processing, so excess exposure is easy to miss — this is how “dose creep” happens. More exposure than needed adds radiation without a matching diagnostic benefit (optimization). Reduce mAs, or check the SID and the AEC chamber selection.",
          ar: "تعريض الكاشف أعلى من الهدف (DI موجب). يمكن للنظام الرقمي أن يعرض صورة تبدو مقبولة بعد المعالجة، لذا يسهل إغفال التعريض الزائد — وهكذا يحدث «زحف الجرعة». التعريض الأكبر من اللازم يضيف إشعاعًا دون فائدة تشخيصية مقابلة (مبدأ التحسين). قلّل mAs أو راجع SID واختيار حجرة AEC.",
        },
        fail: {
          en: "Detector exposure is far above the target: a clear dose-creep risk.",
          ar: "تعريض الكاشف أعلى بكثير من الهدف: خطر واضح لزحف الجرعة.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "Technique ref §7, §8, §15.2–15.5",
        note: "VALIDATED: digital dynamic range can hide excess exposure (dose creep) and optimization is the goal. PROVISIONAL: the DI scoring bands. No patient dose is calculated.",
      },
    },
    {
      id: "aec-chambers",
      kind: "technique",
      check: "aec-chambers",
      category: "exposure",
      // Explains the AEC consequence; the consequence itself is scored once, by the two exposure checks above.
      weight: 0,
      label: { en: "AEC chamber selection (explains the AEC result)", ar: "اختيار حجرة AEC (يفسّر نتيجة AEC)" },
      feedback: {
        pass: {
          en: "The selected chamber(s) lie under the lung fields and inside the light field, so in this educational model the AEC terminates at the target. This chamber layout is a vendor-neutral teaching diagram; real systems differ.",
          ar: "الحجرة/الحجرات المختارة تقع تحت الحقلين الرئويين وداخل المجال الضوئي، لذا ينهي AEC التعريض عند الهدف في هذا النموذج التعليمي. تخطيط الحجرات مخطط تعليمي محايد؛ الأنظمة الحقيقية تختلف.",
        },
        high: {
          en: "The selected chamber(s) include dense central anatomy (mediastinum / spine). They sense less signal, so the AEC keeps exposing for longer and the lung fields receive more than the target. In this demo protocol the lung-field chambers are used for chest; real conventions are vendor / local-protocol dependent.",
          ar: "الحجرات المختارة تشمل تشريحًا مركزيًا كثيفًا (المنصف / العمود الفقري). تستشعر إشارة أقل فيواصل AEC التعريض مدة أطول فيتلقى الحقلان الرئويان أكثر من الهدف. في هذا البروتوكول التجريبي تُستخدم حجرات الحقلين الرئويين للصدر؛ والأعراف الحقيقية تعتمد على الجهاز والبروتوكول المحلي.",
        },
        low: {
          en: "The selected chamber(s) see less attenuating regions, so the AEC ends the exposure early and the lung fields receive less than the target.",
          ar: "الحجرات المختارة ترى مناطق أقل توهينًا فينهي AEC التعريض مبكرًا فيتلقى الحقلان الرئويان أقل من الهدف.",
        },
        fail: {
          en: "No selected chamber is sufficiently inside the light field, so the AEC has nothing to sense and runs to its backup limit — a large over-exposure in this model. Selected chambers must lie inside the collimated field and under the anatomy of interest.",
          ar: "لا توجد حجرة مختارة داخل المجال الضوئي بما يكفي، فلا يجد AEC ما يستشعره ويعمل حتى حدّه الاحتياطي — تعريض زائد كبير في هذا النموذج. يجب أن تقع الحجرات المختارة داخل المجال المحدَّد وتحت التشريح المطلوب.",
        },
      },
      evidence: {
        status: "vendor-protocol-dependent",
        reference: "Technique ref §4",
        note: "VALIDATED: the purpose of AEC. VENDOR / LOCAL-PROTOCOL DEPENDENT: chamber geometry, number, selection and termination. The lung-field preference is an educational, protocol-specific choice of this demo case.",
      },
    },
    {
      id: "sid",
      kind: "range",
      category: "sid",
      setting: "sidCm",
      ideal: [180, 185],
      acceptable: [150, 200],
      unit: "cm",
      variantOnLow: "magnified-geometry",
      label: { en: "Source-to-image distance (SID)", ar: "المسافة بين المصدر والكاسيت (SID)" },
      feedback: {
        pass: {
          en: "SID is within the demo target band.",
          ar: "قيمة SID ضمن النطاق التجريبي المستهدف.",
        },
        low: {
          en: "SID is shorter than the demo target. A shorter SID increases magnification (notably of the heart) and geometric unsharpness, and raises the exposure at the detector (inverse-square) so manual technique would need to be reduced.",
          ar: "قيمة SID أقصر من النطاق التجريبي. تزيد المسافة الأقصر من التكبير (خصوصًا القلب) وعدم الحدّة الهندسي، وترفع التعريض عند الكاشف (قانون التربيع العكسي) فيلزم خفض العوامل في الوضع اليدوي.",
        },
        high: {
          en: "SID is longer than the demo target; exposure at the detector drops (inverse-square), so in manual mode the technique would need adjusting. An AEC compensates for this in the educational model.",
          ar: "قيمة SID أطول من النطاق التجريبي؛ ينخفض التعريض عند الكاسيت (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. يعوّض AEC ذلك في النموذج التعليمي.",
        },
        fail: { en: "SID is outside the target band.", ar: "قيمة SID خارج النطاق المستهدف." },
      },
      evidence: {
        status: "common-reference",
        reference: "Positioning ref §2 SID; Technique ref §3.1, §9",
        note: "180 cm is a COMMON REFERENCE / strong educational target (IAEA example; 140–200 cm in the cited criteria), not the only valid SID. The ±5 cm full-credit and 150–200 cm acceptable bands are PROVISIONAL. SID also feeds the exposure model (inverse square, VALIDATED physics; its mapping is an EDUCATIONAL MODEL).",
      },
    },
    {
      id: "breathing",
      kind: "equals",
      category: "breathing",
      setting: "breathing",
      expected: "deep-inspiration-hold",
      variantOnFail: "poor-inspiration",
      label: { en: "Breathing instruction", ar: "تعليمات التنفس" },
      feedback: {
        pass: {
          en: "Correct: full inspiration and hold, so the lungs are well expanded.",
          ar: "صحيح: شهيق عميق مع حبس النفس فتكون الرئتان ممتلئتين جيدًا.",
        },
        fail: {
          en: "The lungs will not be fully inflated. A poor inspiration crowds the lung markings, raises the diaphragm and enlarges the apparent heart size. Instruct the patient to take a deep breath in and hold it.",
          ar: "لن تكون الرئتان ممتلئتين بالكامل. يؤدي ضعف الشهيق إلى ازدحام العلامات الرئوية وارتفاع الحجاب الحاجز وتضخم ظاهري لحجم القلب. اطلب من المريض شهيقًا عميقًا مع حبس النفس.",
        },
      },
      evidence: {
        status: "validated",
        reference: "§2 Respiration; §5 item 10",
      },
    },
    {
      // Session 4. Unscored on purpose: the Image-quality reference supports "motion → loss of sharpness"
      // (validated) but defines no scoring rule for the instruction itself, and re-weighting the Breathing
      // category (10 %) would be an unsupported change. The consequence is shown in the result image instead.
      id: "motion-instruction",
      kind: "equals",
      category: "breathing",
      weight: 0,
      setting: "motionInstruction",
      expected: "remain-still",
      variantOnFail: "motion",
      label: { en: "Instruction to stay still (not scored)", ar: "تعليمات الثبات (غير محسوبة)" },
      feedback: {
        pass: {
          en: "You asked the patient to stay still. In this simulation a cooperative patient then holds still, so the image is not blurred by movement.",
          ar: "طلبتَ من المريض أن يبقى ثابتًا. في هذه المحاكاة يلتزم المريض المتعاون بالثبات فلا تتشوه الصورة بالحركة.",
        },
        fail: {
          en: "The patient was not clearly asked to stay still, so in this simulation the patient moves during the exposure. Movement causes a loss of sharpness (blur) that can hide fine detail. Ask the patient to stay still, together with the breathing instruction.",
          ar: "لم يُطلب من المريض بوضوح أن يبقى ثابتًا، فيتحرك المريض أثناء التعريض في هذه المحاكاة. تسبب الحركة فقدانًا في الحدّة (ضبابية) قد يخفي التفاصيل الدقيقة. اطلب من المريض الثبات مع تعليمات التنفس.",
        },
      },
      evidence: {
        status: "educational-simplification",
        reference: "Image-quality ref (Motion)",
        note: "VALIDATED: patient/respiratory motion reduces sharpness. EDUCATIONAL ASSUMPTION: that this instruction decides whether this simulated patient moves. Deliberately unscored; no instruction-quality rule exists in the references.",
      },
    },
  ],
  possibleErrors: [
    {
      id: "rotated",
      variant: "rotated",
      description: { en: "Patient rotation", ar: "دوران المريض" },
    },
    {
      id: "clipped",
      variant: "clipped",
      description: {
        en: "Anatomy clipped by centering or collimation",
        ar: "قطع التشريح بسبب التوسيط أو التحديد",
      },
    },
    {
      id: "poor-inspiration",
      variant: "poor-inspiration",
      description: { en: "Poor inspiration", ar: "شهيق غير كافٍ" },
    },
    {
      id: "motion",
      variant: "motion",
      description: { en: "Patient motion (loss of sharpness)", ar: "حركة المريض (فقدان الحدّة)" },
    },
    {
      id: "low-exposure",
      variant: "low-exposure",
      description: {
        en: "Low detector exposure (increased quantum noise)",
        ar: "تعريض كاشف منخفض (ضجيج كمّي متزايد)",
      },
    },
    {
      id: "excess-exposure",
      variant: "excess-exposure",
      description: {
        en: "Excess detector exposure (dose-creep risk; may look acceptable after processing)",
        ar: "تعريض كاشف زائد (خطر زحف الجرعة؛ قد تبدو الصورة مقبولة بعد المعالجة)",
      },
    },
    {
      id: "low-penetration",
      variant: "low-penetration",
      description: { en: "Insufficient beam penetration (kVp too low)", ar: "اختراق غير كافٍ للحزمة (kVp منخفض)" },
    },
  ],
  imageCriteria: [
    {
      id: "symmetry",
      description: { en: "No rotation (symmetrical appearance)", ar: "لا يوجد دوران (مظهر متناظر)" },
    },
    {
      id: "inspiration",
      description: { en: "Adequate inspiration", ar: "شهيق كافٍ" },
    },
    {
      id: "coverage",
      description: {
        en: "Both lungs fully included, apices to costophrenic angles",
        ar: "الرئتان كاملتان من القمم إلى الزوايا الضلعية الحجابية",
      },
    },
    {
      id: "sharpness",
      description: { en: "No loss of sharpness from patient movement", ar: "لا يوجد فقدان في الحدّة بسبب حركة المريض" },
    },
    {
      id: "exposure",
      description: {
        en: "Detector exposure near target with adequate penetration (judged by DI, not by displayed brightness)",
        ar: "تعريض كاشف قريب من الهدف مع اختراق كافٍ (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)",
      },
    },
  ],
};
