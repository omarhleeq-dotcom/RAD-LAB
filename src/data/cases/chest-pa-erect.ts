import type { RadCase } from "@/domain/case";

/**
 * Adult Chest X-ray — PA Erect.
 *
 * PROVISIONAL / DEMO DATA: every numeric range below (kVp, mAs, SID, centering,
 * collimation, rotation tolerance) is a placeholder chosen to exercise the engine.
 * None of it has been validated against an authoritative source and it must not
 * be presented as clinical guidance. TODO(medical-review): validate with a
 * radiography educator before release.
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
    centerXCm: { min: -10, max: 10, step: 0.5 },
    centerYCm: { min: 5, max: 38, step: 0.5 },
    collimationWidthCm: { min: 20, max: 35, step: 1 },
    collimationHeightCm: { min: 20, max: 43, step: 1 },
    sidCm: { min: 100, max: 200, step: 5 },
    kvp: { min: 50, max: 150, step: 1 },
    mas: { min: 0.5, max: 40, step: 0.5 },
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
    centerXCm: 4,
    centerYCm: 28,
    collimationWidthCm: 35,
    collimationHeightCm: 43,
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
    },
    {
      id: "collimation",
      kind: "coverage",
      category: "positioning",
      weight: 1,
      maxMarginCm: 5,
      variantOnClipped: "clipped",
      label: { en: "Collimation / anatomy coverage", ar: "التحديد (Collimation) وتغطية التشريح" },
      feedback: {
        pass: {
          en: "The field covers the required anatomy with a reasonable margin.",
          ar: "المجال يغطي التشريح المطلوب بهامش مناسب.",
        },
        fail: {
          en: "The collimated field cuts off part of the required anatomy, so it is missing from the image. Open the field or re-centre the central ray.",
          ar: "المجال المحدَّد يقطع جزءًا من التشريح المطلوب فيغيب عن الصورة. وسّع المجال أو أعد توسيط الشعاع المركزي.",
        },
        high: {
          en: "The field is opened wider than necessary. Extra field size adds scatter and unnecessary dose to the patient. Collimate closer to the anatomy of interest.",
          ar: "المجال مفتوح أكثر من اللازم. المجال الزائد يزيد الإشعاع المتشتت وجرعة المريض دون داعٍ. ضيّق المجال ليقترب من التشريح المطلوب.",
        },
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
    },
    {
      id: "centering-lateral",
      kind: "range",
      category: "centering",
      setting: "centerXCm",
      ideal: [-1.5, 1.5],
      acceptable: [-3, 3],
      unit: "cm",
      variantOnLow: "clipped",
      variantOnHigh: "clipped",
      label: { en: "Central ray — lateral (midline)", ar: "الشعاع المركزي — جانبيًا (الخط المنتصف)" },
      feedback: {
        pass: {
          en: "The central ray is on the midline.",
          ar: "الشعاع المركزي على الخط المنتصف.",
        },
        fail: {
          en: "The central ray is off the midline. This shifts the anatomy sideways on the image and can clip one lung edge. Re-centre to the midsagittal plane.",
          ar: "الشعاع المركزي بعيد عن الخط المنتصف. يؤدي ذلك إلى إزاحة التشريح جانبيًا وقد يقطع حافة إحدى الرئتين. أعد التوسيط على المستوى السهمي المنتصف.",
        },
      },
    },
    {
      id: "centering-vertical",
      kind: "range",
      category: "centering",
      setting: "centerYCm",
      ideal: [18, 22],
      acceptable: [15, 25],
      unit: "cm",
      variantOnLow: "clipped",
      variantOnHigh: "clipped",
      label: { en: "Central ray — vertical level", ar: "الشعاع المركزي — المستوى العمودي" },
      feedback: {
        pass: {
          en: "The central ray is at an appropriate level for the chest (demo value).",
          ar: "الشعاع المركزي عند مستوى مناسب للصدر (قيمة تجريبية).",
        },
        low: {
          en: "The central ray is too low, so the lung apices may be cut off. Raise the centering point.",
          ar: "الشعاع المركزي منخفض جدًا وقد تُقطع قمم الرئتين. ارفع نقطة التوسيط.",
        },
        high: {
          en: "The central ray is too high, so the costophrenic angles may be cut off. Lower the centering point.",
          ar: "الشعاع المركزي مرتفع جدًا وقد تُقطع الزوايا الضلعية الحجابية. اخفض نقطة التوسيط.",
        },
        fail: {
          en: "The central ray is not at the correct level.",
          ar: "الشعاع المركزي ليس عند المستوى الصحيح.",
        },
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
