import type { TechniqueProfile } from "@/domain/technique";

/**
 * Technique / exposure PROTOCOL PROFILE for the demo adult chest case.
 *
 * Nothing here is a medical constant. It is a configurable, vendor-neutral EDUCATIONAL protocol, and every group
 * carries its own evidence class (docs/RAD-LAB_Medical_Reference_Chest_PA_Technique.md §2, §13, §15). The four
 * concepts the brief keeps apart:
 *   A. selectable range     → RadCase.controls (console hardware limits)
 *   B. protocol target      → `manual.reference`, `kvp.targetBand`, `aec.*`        (PROVISIONAL, local-protocol)
 *   C. scoring tolerance    → `deviation`, `kvp.referenceRange` (partial credit)   (PROVISIONAL)
 *   D. evidence class       → `evidence` fields and `assumptions`
 *
 * TODO(medical-review): every PROVISIONAL / EDUCATIONAL value needs educator / medical-physicist review and a
 * named equipment+protocol profile before it is presented as anything but a demo.
 */
export const chestPaTechnique: TechniqueProfile = {
  id: "demo-adult-reference-dr",
  label: {
    en: "Demo protocol — average adult, generic DR system (provisional)",
    ar: "بروتوكول تجريبي — بالغ متوسط، نظام DR عام (مؤقت)",
  },
  evidence: {
    status: "provisional",
    reference: "Technique ref §3.2, §3.3, §15",
    note: "A demo protocol, not a clinical technique chart.",
  },

  patient: {
    attenuation: 1,
    label: { en: "Average adult (reference attenuation)", ar: "بالغ متوسط (توهين مرجعي)" },
    evidence: {
      status: "educational-simplification",
      reference: "Technique ref §10",
      note: "One reference attenuation for now. The engine already takes attenuation as an input so other body habitus can be added as data later.",
    },
  },
  system: {
    label: { en: "Generic digital detector with grid (assumed)", ar: "كاشف رقمي عام مع شبكة (افتراضي)" },
    relativeResponse: 1,
    grid: "assumed",
    evidence: {
      status: "vendor-protocol-dependent",
      reference: "Technique ref §3.3, §12",
      note: "Detector, grid, generator and processing change the technique needed; no universal mAs is derived from any grid assumption.",
    },
  },

  manual: {
    // The technique that lands exactly on the protocol target (DI = 0) at the reference SID. A demo reference
    // POINT for the model — it is never shown to the learner as "the correct technique".
    reference: { kvp: 120, mas: 3.2, sidCm: 180 },
    // Receptor exposure ∝ kVp^n at fixed mAs. Monotonic educational simplification; the exponent is not validated.
    kvpExponent: 3,
    evidence: {
      status: "provisional",
      reference: "Technique ref §3.2, §3.3, §15.1–15.2",
      note: "No exact adult PA chest kVp or mAs is validated. Reference point and kVp exponent are configurable educational values.",
    },
  },

  kvp: {
    referenceRange: [100, 150],
    targetBand: [110, 125],
    evidence: {
      referenceRange: {
        status: "common-reference",
        reference: "Technique ref §3.2",
        note: "IAEA example range of 100–150 kV for chest radiography; not a universal prescription.",
      },
      targetBand: {
        status: "provisional",
        reference: "Technique ref §3.2, §15.3",
        note: "Narrower recommended target for this simulated average adult: PROVISIONAL / LOCAL-PROTOCOL DEPENDENT.",
      },
    },
  },

  deviation: {
    ideal: [-1, 1],
    acceptable: [-3, 3],
    evidence: {
      status: "provisional",
      reference: "Technique ref §6.4, §15.5",
      note: "Scoring bands around DI = 0 for this demo only. A universal DI pass/fail band is NOT validated (AAPM TG-232: site-derived).",
    },
  },

  aec: {
    // Vendor-neutral, three-field educational layout in detector-normalized coordinates (view from the tube; left/right
    // follow the detector view). Real chamber number, shape and position vary by system.
    chambers: [
      { id: "left", label: { en: "Left field (detector view)", ar: "الحقل الأيسر (عرض الكاسيت)" }, region: { x1: -0.62, y1: -0.5, x2: -0.2, y2: -0.05 }, anatomy: "lung" },
      { id: "center", label: { en: "Central field", ar: "الحقل المركزي" }, region: { x1: -0.11, y1: -0.5, x2: 0.11, y2: 0 }, anatomy: "mediastinum" },
      { id: "right", label: { en: "Right field (detector view)", ar: "الحقل الأيمن (عرض الكاسيت)" }, region: { x1: 0.2, y1: -0.5, x2: 0.62, y2: -0.05 }, anatomy: "lung" },
    ],
    minChamberCoverage: 0.5,
    // Lung fields end at the target by definition of the protocol; denser central anatomy makes the AEC run longer.
    anatomyRelativeExposure: { lung: 1, mediastinum: 1.8, "outside-patient": 0.4 },
    backupRelativeExposure: 4,
    evidence: {
      status: "vendor-protocol-dependent",
      reference: "Technique ref §4, §15.6–15.7",
      note: "AEC purpose is VALIDATED; chamber geometry, selection, combination rule, anatomy factors and backup behaviour are VENDOR / LOCAL-PROTOCOL DEPENDENT and modelled qualitatively.",
    },
  },

  assumptions: [
    {
      id: "di-equation",
      label: { en: "DI = 10 × log10(EI / EIT)", ar: "DI = 10 × log10(EI / EIT)" },
      value: {
        en: "DI = 0 when EI equals the target; +3 ≈ twice, −3 ≈ half the target exposure. EI is not patient dose.",
        ar: "DI = 0 عندما يساوي EI الهدف؛ +3 ≈ ضعف و−3 ≈ نصف التعريض المستهدف. EI ليس جرعة المريض.",
      },
      evidence: { status: "validated", reference: "Technique ref §6.1, §6.3" },
    },
    {
      id: "brightness",
      label: { en: "Displayed brightness is not an exposure meter", ar: "سطوع الصورة المعروضة ليس مقياسًا للتعريض" },
      value: {
        en: "DR processing normalises brightness and contrast; exposure is judged by detector exposure / DI, noise and dose awareness.",
        ar: "معالجة DR تُطبّع السطوع والتباين؛ يُحكم على التعريض من تعريض الكاشف/DI والضجيج والوعي بالجرعة.",
      },
      evidence: { status: "validated", reference: "Technique ref §5" },
    },
    {
      id: "mas-physics",
      label: { en: "mAs controls X-ray quantity; quantum noise ∝ 1/√exposure", ar: "mAs تتحكم في كمية الأشعة؛ الضجيج الكمّي ∝ 1/√التعريض" },
      value: {
        en: "More mAs → more photons (other factors equal). No universal Chest PA mAs is claimed.",
        ar: "mAs أكبر → فوتونات أكثر (مع ثبات العوامل الأخرى). لا يُدّعى وجود mAs عالمي لصدر PA.",
      },
      evidence: { status: "validated", reference: "Technique ref §8" },
    },
    {
      id: "kvp-physics",
      label: { en: "kVp affects spectrum, penetration and output", ar: "kVp تؤثر في الطيف والاختراق والخرج" },
      value: {
        en: "The simulator never maps higher kVp to a darker digital image.",
        ar: "لا يربط المحاكي بين kVp الأعلى وصورة رقمية أغمق.",
      },
      evidence: { status: "validated", reference: "Technique ref §8" },
    },
    {
      id: "kvp-range",
      label: { en: "Chest kVp reference range 100–150", ar: "النطاق المرجعي لـ kVp للصدر 100–150" },
      value: {
        en: "Partial credit inside the range; not a universal prescription.",
        ar: "درجة جزئية داخل النطاق؛ وليس وصفة عالمية.",
      },
      evidence: { status: "common-reference", reference: "Technique ref §3.2" },
    },
    {
      id: "kvp-target",
      label: { en: "Demo kVp target band 110–125", ar: "نطاق kVp المستهدف التجريبي 110–125" },
      value: { en: "Full credit in this demo protocol only.", ar: "درجة كاملة في هذا البروتوكول التجريبي فقط." },
      evidence: { status: "provisional", reference: "Technique ref §3.2, §15.1, §15.3" },
    },
    {
      id: "reference-point",
      label: { en: "Manual reference point (120 kVp, 3.2 mAs at 180 cm → DI 0)", ar: "نقطة المرجع اليدوية (120 kVp و3.2 mAs عند 180 سم → DI 0)" },
      value: {
        en: "A model anchor so exposure can be computed relative to a target; not a recommended technique.",
        ar: "نقطة ارتكاز للنموذج لحساب التعريض نسبةً إلى هدف؛ وليست تقنية موصى بها.",
      },
      evidence: { status: "provisional", reference: "Technique ref §3.3, §14, §15.2" },
    },
    {
      id: "kvp-exponent",
      label: { en: "Receptor exposure ∝ kVp³ at fixed mAs", ar: "تعريض الكاشف ∝ kVp³ عند mAs ثابتة" },
      value: {
        en: "Direction is physical; the magnitude is a configurable teaching simplification.",
        ar: "الاتجاه فيزيائي؛ أما المقدار فتبسيط تعليمي قابل للضبط.",
      },
      evidence: { status: "educational-simplification", reference: "Technique ref §8, §14" },
    },
    {
      id: "inverse-square",
      label: { en: "SID: inverse-square distance–intensity relation", ar: "SID: علاقة المسافة–الشدة بالتربيع العكسي" },
      value: {
        en: "The physics is validated; how it becomes simulated detector exposure is an educational model that ignores the rest of the imaging chain.",
        ar: "الفيزياء مثبتة؛ أما تحويلها إلى تعريض كاشف محاكى فنموذج تعليمي يتجاهل بقية سلسلة التصوير.",
      },
      evidence: { status: "validated", reference: "Technique ref §9", note: "Physics VALIDATED; mapping = EDUCATIONAL MODEL; score tolerance around 180 cm = PROVISIONAL." },
    },
    {
      id: "di-bands",
      label: { en: "DI scoring bands ±1 (full) and ±3 (partial)", ar: "نطاقات تقييم DI: ±1 (كاملة) و±3 (جزئية)" },
      value: {
        en: "Demo scoring tolerances only; there is no universal DI pass/fail limit.",
        ar: "حدود تقييم تجريبية فقط؛ لا يوجد حدّ نجاح/رسوب عالمي لـ DI.",
      },
      evidence: { status: "provisional", reference: "Technique ref §6.4, §15.5" },
    },
    {
      id: "eit",
      label: { en: "No numeric EI / EIT is invented", ar: "لا يُخترع أي EI / EIT رقمي" },
      value: {
        en: "Exposure is target-relative (EI/EIT). A numeric EIT is body-part, view, site and vendor specific.",
        ar: "التعريض نسبي إلى الهدف (EI/EIT). قيمة EIT الرقمية تخص العضو والإسقاط والموقع والمصنّع.",
      },
      evidence: { status: "validated", reference: "Technique ref §6.2" },
    },
    {
      id: "aec-purpose",
      label: { en: "AEC purpose: consistent, reproducible receptor exposure", ar: "غرض AEC: تعريض كاشف ثابت وقابل للتكرار" },
      value: {
        en: "It compensates for different kVp and anatomical thickness; in the model it also re-terminates at the target when SID changes.",
        ar: "يعوّض اختلاف kVp وسماكة التشريح؛ وفي النموذج يعيد الإنهاء عند الهدف عند تغيّر SID أيضًا.",
      },
      evidence: { status: "validated", reference: "Technique ref §4" },
    },
    {
      id: "aec-layout",
      label: { en: "Three-field AEC diagram and chamber factors", ar: "مخطط AEC بثلاثة حقول وعوامل الحجرات" },
      value: {
        en: "Vendor-neutral teaching diagram. Chamber number, position, selection, combination and termination vary by system; the lung-field preference is this demo's choice.",
        ar: "مخطط تعليمي محايد. يختلف عدد الحجرات وموضعها واختيارها وطريقة دمجها وإنهائها حسب النظام؛ وتفضيل حقلي الرئتين هو اختيار هذا العرض.",
      },
      evidence: { status: "vendor-protocol-dependent", reference: "Technique ref §4, §15.6–15.7" },
    },
    {
      id: "patient-habitus",
      label: { en: "One reference adult attenuation", ar: "توهين مرجعي واحد لبالغ" },
      value: {
        en: "Patient attenuation is an engine input; technique by body size is not modelled yet.",
        ar: "توهين المريض مُدخل في المحرك؛ ولم تُحاكَ التقنية حسب حجم الجسم بعد.",
      },
      evidence: { status: "educational-simplification", reference: "Technique ref §10, §15.9" },
    },
  ],
};
