import type { RadCase } from "@/domain/case";

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
    mas: { min: 0.5, max: 40, step: 0.5 },
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
    markerSizeCm: 3,
    defaultMarkerPosition: { x: -0.84, y: 0.68 },
  },
  availableProjections: ["pa-erect", "ap-erect", "lateral-left"],
  availableBreathing: [
    "deep-inspiration-hold",
    "expiration-hold",
    "normal-breathing",
    "no-instruction",
  ],
  initialSettings: {
    projection: "ap-erect",
    rotationDeg: 8,
    centralRay: { x: 0.23, y: 0.3 },
    collimation: { width: 1, height: 1 },
    chinPosition: "tucked",
    shoulderPosition: "relaxed",
    sideMarker: null,
    markerPosition: { x: -0.84, y: 0.68 },
    sidCm: 120,
    kvp: 70,
    mas: 12,
    breathing: "no-instruction",
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
    {
      id: "kvp",
      kind: "range",
      category: "exposure",
      setting: "kvp",
      ideal: [110, 125],
      acceptable: [95, 135],
      unit: "kVp",
      variantOnLow: "underexposed",
      variantOnHigh: "overexposed",
      label: { en: "kVp", ar: "kVp" },
      feedback: {
        pass: {
          en: "kVp is within the demo target band.",
          ar: "قيمة kVp ضمن النطاق التجريبي المستهدف.",
        },
        low: {
          en: "kVp is lower than the demo target. Lower penetration reduces detail in dense regions and raises contrast too much for a chest image.",
          ar: "قيمة kVp أقل من النطاق التجريبي. انخفاض الاختراق يقلل التفاصيل في المناطق الكثيفة ويرفع التباين أكثر من اللازم في صورة الصدر.",
        },
        high: {
          en: "kVp is higher than the demo target, which lowers contrast and increases scatter.",
          ar: "قيمة kVp أعلى من النطاق التجريبي، مما يقلل التباين ويزيد التشتت.",
        },
        fail: { en: "kVp is outside the target band.", ar: "قيمة kVp خارج النطاق المستهدف." },
      },
      evidence: {
        status: "provisional",
        reference: "§4 kVp",
        note: "No universal kVp is validated; demo band only.",
      },
    },
    {
      id: "mas",
      kind: "range",
      category: "exposure",
      setting: "mas",
      ideal: [2, 5],
      acceptable: [1, 8],
      unit: "mAs",
      variantOnLow: "underexposed",
      variantOnHigh: "overexposed",
      label: { en: "mAs", ar: "mAs" },
      feedback: {
        pass: {
          en: "mAs is within the demo target band.",
          ar: "قيمة mAs ضمن النطاق التجريبي المستهدف.",
        },
        low: {
          en: "mAs is too low: too few photons reach the detector, giving a noisy, underexposed image.",
          ar: "قيمة mAs منخفضة: يصل عدد قليل من الفوتونات إلى الكاسيت فتنتج صورة ناقصة التعريض ومليئة بالتشويش.",
        },
        high: {
          en: "mAs is too high: the image is overexposed and the patient receives unnecessary dose.",
          ar: "قيمة mAs مرتفعة: الصورة زائدة التعريض ويتلقى المريض جرعة غير ضرورية.",
        },
        fail: { en: "mAs is outside the target band.", ar: "قيمة mAs خارج النطاق المستهدف." },
      },
      evidence: {
        status: "provisional",
        reference: "§4 mAs",
        note: "No universal mAs is validated; demo band only.",
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
          en: "SID is shorter than the demo target. A shorter SID increases magnification (notably of the heart) and geometric unsharpness.",
          ar: "قيمة SID أقصر من النطاق التجريبي. تزيد المسافة الأقصر من التكبير (خصوصًا القلب) وعدم الحدّة الهندسي.",
        },
        high: {
          en: "SID is longer than the demo target; exposure at the detector drops, so other factors would need adjusting.",
          ar: "قيمة SID أطول من النطاق التجريبي؛ ينخفض التعريض عند الكاسيت وتحتاج بقية العوامل إلى تعديل.",
        },
        fail: { en: "SID is outside the target band.", ar: "قيمة SID خارج النطاق المستهدف." },
      },
      evidence: {
        status: "educational-simplification",
        reference: "§2 SID; §3 / §5 item 6",
        note: "180 cm target is validated; the +/-5 cm ideal and 150-200 cm acceptable bands are provisional.",
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
      id: "underexposed",
      variant: "underexposed",
      description: { en: "Underexposure", ar: "نقص التعريض" },
    },
    {
      id: "overexposed",
      variant: "overexposed",
      description: { en: "Overexposure", ar: "زيادة التعريض" },
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
      id: "exposure",
      description: { en: "Appropriate exposure", ar: "تعريض مناسب" },
    },
  ],
};
