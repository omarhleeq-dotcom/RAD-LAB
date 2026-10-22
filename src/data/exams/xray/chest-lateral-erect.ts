import type { CheckRule, CriticalFindingRule } from "@/domain/case";
import type { ExamDefinition } from "@/domain/exam";
import { chestLateralTechnique } from "./chest-lateral-technique";
import { chestPaErectExam } from "./chest-pa-erect";

/**
 * Exam definition: Chest X-ray — LATERAL erect (general radiography), Session 12.
 *
 * Built only from the Session 11 generic mechanisms: marker rule `detector-side` (S11-1), exam-declared
 * `choiceControls` (side against the detector, arms), per-exam critical findings, the scene registry and optional
 * asset landmark groups. Governing authority: BONTRAGER-9 p.84-85, 94 (S10b-25). Every value below is PROVISIONAL until
 * the educator / medical-physicist review (O5); numbers that are NOT Bontrager are labelled ENGINE TEACHING CHOICES
 * (S12-1, S12-3). Weights reuse the PA weights (S10b-14); no numeric mAs target (S10b-9); AEC = central chamber (S10b-2).
 *
 * Arabic text is DRAFT pending owner / educator review (use "الكاشف"; phone-short wording).
 * Not in v1 (S12-6): CR / receptor lowering for broad shoulders (S10b-24, teaching only), wheelchair / cart variants (p.95).
 * TODO(medical-review): validate with a radiography educator before release.
 */
const pa = (id: string): CheckRule => {
  const rule = chestPaErectExam.rules.find((r) => r.id === id);
  if (!rule) throw new Error(`Chest PA rule "${id}" not found`);
  return rule;
};
const paFinding = (id: string): CriticalFindingRule => {
  const f = chestPaErectExam.scoring.criticalFindings.find((x) => x.id === id);
  if (!f) throw new Error(`Chest PA critical finding "${id}" not found`);
  return f;
};

export const chestLateralErectExam: ExamDefinition = {
  schemaVersion: 1,
  id: "chest-lateral-erect",
  modality: "general-radiography",
  bodyPart: "chest",
  provisional: true,
  evidence: {
    status: "provisional",
    reference: "docs/RAD-LAB_Medical_Reference_Chest_Lateral.md; BONTRAGER-9 p.84-85, 94; docs/DECISIONS.md S10b-*, S12-*",
    note: "Exam-level classification: provisional until the educator / medical-physicist review is signed off. Every rule, tolerance and feedback sentence carries its own evidence class.",
  },
  defaultCaseId: "adult-demo",
  title: { en: "Adult Chest X-ray — Lateral Erect", ar: "أشعة الصدر للبالغ — جانبية وقوفًا" },
  requiredProjection: "lateral-left",
  availableProjections: ["pa-erect", "ap-erect", "lateral-left"],
  availableBreathing: chestPaErectExam.availableBreathing,
  availableMotionInstructions: chestPaErectExam.availableMotionInstructions,
  // BONTRAGER-9 p.94: 35 x 43 cm receptor, portrait.
  detector: { widthCm: 35, heightCm: 43 },
  // Provisional demo region (S10b-15 / O2): the same 27 x 31 cm as the PA. Apices to costophrenic angles, sternum to posterior ribs.
  requiredAnatomy: { xCm: 4, yCm: 3, widthCm: 27, heightCm: 31 },
  controls: { ...chestPaErectExam.controls },
  choiceControls: [
    {
      id: "side",
      label: { en: "Side against the detector", ar: "الجانب الملاصق للكاشف" },
      hint: {
        en: "The routine lateral is the left side against the detector.",
        ar: "الصورة الجانبية الروتينية يكون فيها الجانب الأيسر ملاصقًا للكاشف.",
      },
      options: [
        { id: "L", label: { en: "Left side", ar: "الجانب الأيسر" } },
        { id: "R", label: { en: "Right side", ar: "الجانب الأيمن" } },
      ],
    },
    {
      id: "arms",
      label: { en: "Arms", ar: "الذراعان" },
      hint: {
        en: "Keep the arms clear of the lung fields.",
        ar: "أبعد الذراعين عن الحقلين الرئويين.",
      },
      options: [
        { id: "raised", label: { en: "Raised above the head", ar: "مرفوعتان فوق الرأس" } },
        { id: "lowered", label: { en: "Lowered", ar: "منخفضتان" } },
      ],
    },
  ],
  technique: chestLateralTechnique,
  positioning: {
    // CR perpendicular to the mid-thorax at about T7 (BONTRAGER-9 p.94). Same demo region centre as the PA; tolerances PROVISIONAL.
    centering: {
      target: { x: 0, y: -0.14 },
      idealTolerance: { x: 0.08, y: 0.1 },
      acceptableTolerance: { x: 0.17, y: 0.25 },
    },
    minCollimation: 0.3,
    markerSizeCm: 2.2,
    // S10b-21 / S12-7: the letter is the side of the patient closest to the detector (checked against the `side` choice by
    // the detector-side rule). Display orientation: BONTRAGER-9 p.36 says it varies by department, so this simulator fixes ONE
    // educational convention: the anterior chest on the viewer's left, and L on the viewer's-left margin, R on the right.
    markerSide: { L: "viewer-left", R: "viewer-right" },
    defaultMarkerPosition: { L: { x: -0.84, y: -0.44 }, R: { x: 0.84, y: -0.44 } },
    markerRule: { kind: "detector-side", choiceId: "side" },
  },
  scoring: {
    // S10b-14: PA weights reused for v1.
    categoryWeights: { positioning: 25, rotation: 20, centering: 15, exposure: 20, sid: 10, breathing: 10 },
    passThreshold: 70,
    criticalFindings: [
      paFinding("wrong-projection"),
      paFinding("patient-motion"),
      {
        id: "wrong-side-marker",
        label: { en: "Wrong marker (side against the detector)", ar: "علامة خاطئة (الجانب الملاصق للكاشف)" },
        reason: {
          en: "Critical finding — wrong marker: the letter does not name the side of the patient against the detector. A wrong marker misidentifies the patient's side, so the attempt is below the pass mark whatever the numeric score. This is an educational result, not a clinical decision about the image.",
          ar: "ملاحظة حرجة — علامة خاطئة: الحرف لا يطابق جانب المريض الملاصق للكاشف. العلامة الخاطئة تُحدِّد جانب المريض خطأً، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.",
        },
        concept: {
          status: "common-reference",
          reference: "BONTRAGER-9 p.32, 36",
          note: "A lateral is marked R or L by the side of the patient closest to the receptor (p.36). Which display half carries which letter is department dependent; this simulator fixes one teaching convention (S12-7).",
        },
        evidence: {
          status: "provisional",
          reference: "S10b-13, S10b-21, S12-7",
          note: "PROVISIONAL / educational: the gate is a simulator rule with the same severity as the PA wrong-side marker. The numeric score is unchanged.",
        },
      },
      {
        ...paFinding("missing-marker"),
        concept: {
          status: "common-reference",
          reference: "BONTRAGER-9 p.32, 36; ACR-CHEST Sec IV",
          note: "COMMON QUALITY CRITERION: the image must carry a side marker; a lateral's marker names the side closest to the receptor (S10b-21, scored from Session 12).",
        },
      },
      {
        id: "arms-over-lungs",
        label: { en: "Arms not raised", ar: "الذراعان غير مرفوعتين" },
        reason: {
          en: "Critical finding — arms not raised: the soft tissue of the arms is superimposed on the upper lung fields, which hides lung tissue. In this simulator that is a critical error to correct in training, so the attempt is below the pass mark whatever the numeric score.",
          ar: "ملاحظة حرجة — الذراعان غير مرفوعتين: يتراكب نسيج الذراعين الرخو على الحقلين الرئويين العلويين فيحجب نسيج الرئة. وهذا في هذا المحاكي خطأ مهم يجب تصحيحه في التدريب، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية.",
        },
        concept: {
          status: "common-reference",
          reference: "BONTRAGER-9 p.84-85, 94",
          note: "Arms raised above the head (a support is allowed); arms not raised superimpose soft tissue on the upper lung fields and can hide lung tissue.",
        },
        evidence: {
          status: "provisional",
          reference: "S10b-13, S10b-6",
          note: "PROVISIONAL / educational: the gate is a simulator rule; the final list of critical findings is set by an educator. The numeric score is unchanged.",
        },
      },
    ],
  },
  rules: [
    {
      id: "projection",
      kind: "equals",
      category: "positioning",
      weight: 2,
      setting: "projection",
      expected: "lateral-left",
      variantOnFail: "wrong-projection",
      label: { en: "Projection / patient position", ar: "الإسقاط ووضعية المريض" },
      feedback: {
        pass: { en: "Correct projection: erect lateral, as requested.", ar: "الإسقاط صحيح: جانبي وقوفًا كما هو مطلوب." },
        fail: {
          en: "The projection does not match the request (lateral erect). Re-position the patient as requested.",
          ar: "الإسقاط لا يطابق الطلب (جانبي وقوفًا). أعد وضع المريض حسب الطلب.",
        },
      },
      evidence: { status: "common-reference", reference: "BONTRAGER-9 p.94; the exam request" },
    },
    {
      id: "side",
      kind: "equals",
      category: "positioning",
      weight: 1,
      setting: "choices.side",
      expected: "L",
      label: { en: "Side against the detector", ar: "الجانب الملاصق للكاشف" },
      feedback: {
        pass: {
          en: "Left side against the detector: the routine lateral. The right side is used only when the request or a right-sided problem calls for it.",
          ar: "الجانب الأيسر ملاصق للكاشف: الصورة الجانبية الروتينية. لا يُستخدم الأيمن إلا إذا دعا إليه الطلب أو مشكلة في الجانب الأيمن.",
        },
        fail: {
          en: "The right side is against the detector. The routine lateral is the left lateral unless the request or a right-sided problem calls for the right; nothing in this request does.",
          ar: "الجانب الأيمن ملاصق للكاشف. الصورة الجانبية الروتينية هي اليسرى ما لم يدعُ الطلب أو مشكلة في الجانب الأيمن إلى اليمنى؛ ولا شيء في هذا الطلب يدعو إليها.",
        },
      },
      evidence: {
        status: "common-reference",
        reference: "BONTRAGER-9 p.84, 94; S10b-4",
        note: "Left lateral unless the protocol or right-sided pathology calls for the right (Bontrager); both sides are offered, left is correct for this case. Pending educator confirmation (O7 closed by S10b-4).",
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
        top: { en: "The top of the field cuts off the lung apices.", ar: "الحافة العلوية للمجال تقطع قمم الرئتين." },
        bottom: {
          en: "The bottom of the field cuts off the costophrenic angles and the lower lungs.",
          ar: "الحافة السفلية للمجال تقطع الزوايا الضلعية الحجابية وأسفل الرئتين.",
        },
        left: {
          en: "The left side of the field (viewer's left) cuts off the sternum side of the lungs.",
          ar: "الجانب الأيسر للمجال (يسار المشاهد) يقطع جهة القص من الرئتين.",
        },
        right: {
          en: "The right side of the field (viewer's right) cuts off the posterior ribs and the posterior lung edge.",
          ar: "الجانب الأيمن للمجال (يمين المشاهد) يقطع الأضلاع الخلفية والحافة الخلفية للرئة.",
        },
      },
      feedback: {
        pass: {
          en: "The field covers the lungs from the apices to the costophrenic angles and from the sternum to the posterior ribs.",
          ar: "المجال يغطي الرئتين من القمم إلى الزوايا الضلعية الحجابية ومن القص إلى الأضلاع الخلفية.",
        },
        fail: {
          en: "Anatomy outside the field is missing from the image. Open the field or re-centre the central ray.",
          ar: "التشريح الواقع خارج المجال يغيب عن الصورة. وسّع المجال أو أعد توسيط الشعاع المركزي.",
        },
      },
      evidence: {
        status: "educational-simplification",
        reference: "BONTRAGER-9 p.94 (criteria); Lateral ref §3",
        note: "The required anatomy is Bontrager's criterion; the 27 × 31 cm demo region is provisional (S10b-15, O2).",
      },
    },
    { ...pa("collimation-excess"), evidence: { status: "educational-simplification", reference: "BONTRAGER-9 p.94 (collimate to the lung fields)", note: "Principle validated; the 5 cm margin limit is provisional / configurable." } },
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
        pass: { en: "Chin lifted, clear of the lung apices.", ar: "الذقن مرفوعة وبعيدة عن قمم الرئتين." },
        fail: {
          en: "The chin is down, so the soft tissue of the neck and jaw can overlie the lung apices. Ask the patient to lift the chin.",
          ar: "الذقن منخفضة فقد يتراكب نسيج الرقبة والفك على قمم الرئتين. اطلب من المريض رفع الذقن.",
        },
      },
      evidence: { status: "common-reference", reference: "BONTRAGER-9 p.94 (criteria)", note: "Not drawn on the result image in this version (scored only)." },
    },
    {
      id: "arms",
      kind: "equals",
      category: "positioning",
      weight: 1,
      setting: "choices.arms",
      expected: "raised",
      label: { en: "Arm position", ar: "وضعية الذراعين" },
      feedback: {
        pass: { en: "Arms raised above the head, clear of the lung fields (an arm support may be used).", ar: "الذراعان مرفوعتان فوق الرأس وبعيدتان عن الحقلين الرئويين (يمكن استخدام مسند للذراعين)." },
        fail: {
          en: "The arms are not raised, so their soft tissue is superimposed on the upper lung fields. Raise the arms above the head. This setup is not suitable for a lateral; its effect is not drawn in this image.",
          ar: "الذراعان غير مرفوعتين فيتراكب نسيجهما الرخو على الحقلين الرئويين العلويين. ارفع الذراعين فوق الرأس. هذا إعداد غير مناسب للصورة الجانبية؛ وأثره غير ممثَّل في هذه الصورة.",
        },
      },
      evidence: { status: "common-reference", reference: "BONTRAGER-9 p.84-85, 94; S10b-6", note: "Not drawn on the result image in this version (scored only; also a critical finding)." },
    },
    {
      id: "side-marker",
      kind: "marker",
      category: "positioning",
      weight: 1,
      label: { en: "Side marker (side closest to the detector)", ar: "علامة الجانب (الأقرب إلى الكاشف)" },
      feedback: {
        pass: {
          en: "Marker placed inside the image margin, clear of the lungs, and its letter names the side against the detector.",
          ar: "العلامة موضوعة في هامش الصورة بعيدًا عن الرئتين، وحرفها يطابق الجانب الملاصق للكاشف.",
        },
        fail: {
          en: "No side marker placed. Choose L or R: the letter is the side of the patient closest to the detector.",
          ar: "لم توضع علامة جانب. اختر L أو R: الحرف هو جانب المريض الأقرب إلى الكاشف.",
        },
        overlap: {
          en: "The marker covers the lungs. Move it into the margin, away from the anatomy of interest.",
          ar: "العلامة تغطي الرئتين. انقلها إلى الهامش بعيدًا عن التشريح المطلوب.",
        },
        wrongSide: {
          en: "The marker letter is wrong. It must name the side of the patient closest to the detector, as set in \"Side against the detector\".",
          ar: "حرف العلامة خاطئ. يجب أن يكون جانب المريض الأقرب إلى الكاشف، كما هو محدد في «الجانب الملاصق للكاشف».",
        },
        displayHalf: {
          en: "Note, not scored: the letter names the side closest to the detector correctly. This simulator's display convention puts L in the viewer's left margin and R in the right margin, but departments differ, so the half you chose has no deduction.",
          ar: "ملاحظة غير محسوبة: الحرف يطابق الجانب الأقرب إلى الكاشف. يضع عرض المحاكي L في هامش يسار المشاهد وR في هامش يمينه، لكن الأقسام تختلف، فلا يُخصم شيء بسبب النصف الذي اخترته.",
        },
        outsideField: {
          en: "The marker is outside the collimated field, so it would not be recorded on the image. Move it inside the field.",
          ar: "العلامة خارج المجال المحدَّد فلن تُسجَّل على الصورة. انقلها إلى داخل المجال.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.32, 36; S10b-21; S12-7",
        note: "Scored from Session 12 (S10b-21). The letter rule is Bontrager's (side closest to the receptor); the display half per letter is a single educational convention because Bontrager says it varies by department.",
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
      // MAGNITUDE-ONLY (S12-3): no `low` / `high` direction text; Bontrager p.84-85 says the direction is hard to judge on a lateral.
      feedback: {
        pass: {
          en: "True lateral: the posterior ribs and the posterior costophrenic angles of the two sides lie close together (about 1 cm apart is normal because of beam divergence).",
          ar: "وضعية جانبية حقيقية: الأضلاع الخلفية والزاويتان الضلعيتان الحجابيتان الخلفيتان للجانبين متقاربة (فارق نحو 1 سم طبيعي بسبب تباعد الحزمة).",
        },
        fail: {
          en: "The patient is rotated. The posterior ribs and costophrenic angles of the two sides are further apart than the roughly 1 cm that beam divergence normally causes. Rotation is judged by that separation; the direction is hard to tell on a lateral, so none is given. A clearly rotated lateral is a positioning error to correct in training.",
          ar: "المريض مائل (دوران). الأضلاع الخلفية والزاويتان الضلعيتان الحجابيتان للجانبين أبعد من نحو 1 سم الذي يسببه تباعد الحزمة عادةً. يُحكم على الدوران بمقدار هذا التباعد؛ ويصعب تحديد الاتجاه في الصورة الجانبية فلا يُذكر. والصورة الجانبية المائلة بوضوح خطأ في الوضعية يجب تصحيحه في التدريب.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.84-85, 94; S10b-7; S12-3",
        note: "ENGINE TEACHING CHOICE (S12-3): Bontrager gives about 1 cm of normal separation at 183 cm and no angle. The ±2° / ±5° bands come from separation ≈ 2·a·sin(θ) with an assumed thorax half-width a = 14 cm (1 cm → about 2°; 5° → about 2.4 cm). Neither the half-width nor the mapping is a Bontrager value. Magnitude only, no direction.",
      },
    },
    {
      id: "centering-lateral",
      kind: "centering",
      axis: "x",
      category: "centering",
      label: { en: "Central ray — mid-thorax", ar: "الشعاع المركزي — منتصف الصدر" },
      feedback: {
        pass: { en: "The central ray is at the middle of the chest from front to back.", ar: "الشعاع المركزي في منتصف الصدر من الأمام إلى الخلف." },
        fail: { en: "The central ray is off the middle of the chest. Re-centre it at mid-thorax.", ar: "الشعاع المركزي بعيد عن منتصف الصدر. أعد توسيطه عند منتصف الصدر." },
        low: {
          en: "The central ray is shifted toward the viewer's left (the front of the chest). Part of the posterior ribs and lung may be clipped. Move the target right, toward the middle.",
          ar: "الشعاع المركزي مزاح نحو يسار المشاهد (مقدمة الصدر). قد تُقطع أجزاء من الأضلاع الخلفية والرئة. حرّك الهدف يمينًا نحو المنتصف.",
        },
        high: {
          en: "The central ray is shifted toward the viewer's right (the back of the chest). Part of the sternum side of the lungs may be clipped. Move the target left, toward the middle.",
          ar: "الشعاع المركزي مزاح نحو يمين المشاهد (ظهر الصدر). قد تُقطع جهة القص من الرئتين. حرّك الهدف يسارًا نحو المنتصف.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.94; Lateral ref §3",
        note: "CR perpendicular to the mid-thorax; the target is the centre of the demo region and the tolerances are provisional.",
      },
    },
    {
      id: "centering-vertical",
      kind: "centering",
      axis: "y",
      category: "centering",
      label: { en: "Central ray — T7 level", ar: "الشعاع المركزي — مستوى T7" },
      feedback: {
        pass: { en: "The central ray is at about the T7 level (mid-chest).", ar: "الشعاع المركزي عند مستوى T7 تقريبًا (منتصف الصدر)." },
        fail: { en: "The central ray is off the T7 level. Re-centre it at mid-chest.", ar: "الشعاع المركزي بعيد عن مستوى T7. أعد توسيطه عند منتصف الصدر." },
        low: {
          en: "The central ray is too high. The lower lungs and costophrenic angles may be clipped. Move the target down, toward T7.",
          ar: "الشعاع المركزي مرتفع جدًا. قد تُقطع أسفل الرئتين والزوايا الضلعية الحجابية. حرّك الهدف للأسفل نحو T7.",
        },
        high: {
          en: "The central ray is too low. The apices may be clipped. Move the target up, toward T7.",
          ar: "الشعاع المركزي منخفض جدًا. قد تُقطع قمم الرئتين. حرّك الهدف للأعلى نحو T7.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.94 (T7, 7.5–10 cm below the jugular notch); S10b-5",
        note: "T7 is Bontrager's level; the position on the detector is modelled as the centre of the demo region and the tolerances are provisional.",
      },
    },
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
          en: "kVp is inside this case's target band (110–125 kV). A lateral chest is imaged at a relatively high kVp so that the ribs and lung markings show through the heart and the upper lungs.",
          ar: "قيمة kVp ضمن النطاق المستهدف لهذه الحالة (110–125 kV). تُصوَّر الصورة الجانبية للصدر بجهد مرتفع نسبيًا لتظهر الأضلاع والعلامات الرئوية عبر القلب والرئتين العلويتين.",
        },
        low: {
          en: "kVp is below the target band. A less penetrating beam is absorbed more by the heart and the spine, so lung markings behind them are harder to see. Extra mAs adds photons, not penetration. (Only 110–125 kV is the textbook band; the 100–109 and 126–150 kV partial credit is an engine teaching choice.)",
          ar: "قيمة kVp أقل من النطاق المستهدف. الحزمة الأقل اختراقًا تمتصها البنى الكثيفة أكثر (القلب والعمود الفقري) فيصعب رؤية العلامات الرئوية خلفها. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق في الكتاب هو 110–125 kV فقط؛ أما الدرجة الجزئية لـ 100–109 و126–150 kV فهي اختيار تعليمي في المحاكي.)",
        },
        high: {
          en: "kVp is above the target band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 110–125 kV is the textbook band; the 126–150 kV partial credit is an engine teaching choice.)",
          ar: "قيمة kVp أعلى من النطاق المستهدف. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق في الكتاب هو 110–125 kV فقط؛ أما الدرجة الجزئية لـ 126–150 kV فهي اختيار تعليمي.)",
        },
        fail: { en: "kVp is outside this case's protocol range.", ar: "قيمة kVp خارج نطاق بروتوكول هذه الحالة." },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.81, 92, 94; S10b-1; S12-1",
        note: "110–125 kV is Bontrager (p.94). The partial bands 100–109 and 126–150 kV are an ENGINE TEACHING CHOICE (owner-approved), NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.",
      },
    },
    { ...pa("exposure-adequacy"), evidence: { status: "provisional", reference: "Technique ref §5, §6, §8; S10b-9", note: "VALIDATED: DI equation and digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the demo target; no numeric mAs target and no universal EIT or DI limit is claimed. A lateral is expected to need more exposure than the PA (teaching only, S10b-9)." } },
    { ...pa("dose-optimization"), evidence: { status: "provisional", reference: "Technique ref §7, §8; S10b-9", note: "VALIDATED: digital dynamic range can hide excess exposure (dose creep). PROVISIONAL: the DI bands. No patient dose is calculated." } },
    {
      id: "aec-chambers",
      kind: "technique",
      check: "aec-chambers",
      category: "exposure",
      weight: 0,
      label: { en: "AEC chamber selection (explains the AEC result)", ar: "اختيار حجرة AEC (يفسّر نتيجة AEC)" },
      feedback: {
        pass: {
          en: "The central chamber is selected and lies inside the light field, so in this educational model the AEC terminates at the target. This chamber layout is a vendor-neutral teaching diagram; real systems differ.",
          ar: "الحجرة المركزية مختارة وداخل المجال الضوئي، لذا ينهي AEC التعريض عند الهدف في هذا النموذج التعليمي. تخطيط الحجرات مخطط تعليمي محايد؛ والأنظمة الحقيقية تختلف.",
        },
        high: {
          en: "The selected chamber(s) include a field over the dense anterior chest wall or the spine. It senses less signal, so the AEC keeps exposing for longer and the lungs receive more than the target. For the lateral, this case's protocol uses the central chamber.",
          ar: "الحجرات المختارة تشمل حقلًا فوق جدار الصدر الأمامي الكثيف أو العمود الفقري. يستشعر إشارة أقل فيواصل AEC التعريض مدة أطول فتتلقى الرئتان أكثر من الهدف. في الصورة الجانبية يستخدم بروتوكول هذه الحالة الحجرة المركزية.",
        },
        low: {
          en: "The selected chamber(s) see less attenuating regions, so the AEC ends the exposure early and the lungs receive less than the target.",
          ar: "الحجرات المختارة ترى مناطق أقل توهينًا فينهي AEC التعريض مبكرًا فتتلقى الرئتان أقل من الهدف.",
        },
        fail: {
          en: "No selected chamber is sufficiently inside the light field, so the AEC has nothing to sense and runs to its backup limit — a large over-exposure in this model. Selected chambers must lie inside the collimated field.",
          ar: "لا توجد حجرة مختارة داخل المجال الضوئي بما يكفي، فلا يجد AEC ما يستشعره ويعمل حتى حدّه الاحتياطي — تعريض زائد كبير في هذا النموذج. يجب أن تقع الحجرات المختارة داخل المجال المحدَّد.",
        },
      },
      evidence: {
        status: "vendor-protocol-dependent",
        reference: "Technique ref §4; EC16260 p.21; S10b-2",
        note: "VALIDATED: the purpose of AEC. The central-chamber choice follows the EC16260 example (Bontrager is silent on AEC); the layout and factors are VENDOR / LOCAL-PROTOCOL DEPENDENT.",
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
      label: { en: "Source-to-image distance (SID)", ar: "المسافة بين المصدر والكاشف (SID)" },
      feedback: {
        pass: { en: "SID is within the target (at least about 183 cm; 180 cm is its rounding).", ar: "قيمة SID ضمن المستهدف (183 سم على الأقل تقريبًا؛ و180 سم تقريب له)." },
        low: {
          en: "SID is shorter than the minimum of 183 cm (72 in). A shorter SID raises the exposure at the detector (inverse-square), so manual technique would need to be reduced, and it increases magnification.",
          ar: "قيمة SID أقصر من الحد الأدنى 183 سم (72 بوصة). المسافة الأقصر تزيد التعريض عند الكاشف (قانون التربيع العكسي) فيلزم خفض العوامل في الوضع اليدوي، كما تزيد التكبير.",
        },
        high: {
          en: "SID is longer than this simulator's teaching band; exposure at the detector drops (inverse-square), so in manual mode the technique would need adjusting. An AEC compensates in the educational model. (The textbook gives only a minimum; the upper limit is an engine teaching choice.)",
          ar: "قيمة SID أطول من النطاق التعليمي في المحاكي؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. ويعوّض AEC ذلك في النموذج التعليمي. (الكتاب يذكر حدًا أدنى فقط؛ والحد الأعلى اختيار تعليمي في المحاكي.)",
        },
        fail: { en: "SID is outside this case's target band.", ar: "قيمة SID خارج النطاق المستهدف لهذه الحالة." },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.94 (minimum 183 cm); S10b-26; S12-1",
        note: "Bontrager gives a MINIMUM of 72 in (183 cm) only. The 185 cm upper full-credit limit and the 150–200 cm partial band are ENGINE TEACHING CHOICES (owner decision 2026-10-07), NOT Bontrager; 180 cm earns full credit as the rounding of 183.",
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
          en: "Correct: full inspiration and hold. The exposure is made at the end of the second full inspiration, so the lungs are well expanded.",
          ar: "صحيح: شهيق عميق مع حبس النفس. يُجرى التعريض في نهاية الشهيق الكامل الثاني فتكون الرئتان ممتلئتين جيدًا.",
        },
        fail: {
          en: "The lungs will not be fully expanded. Instruct the patient to take a deep breath in and hold it; the exposure is made at the end of the second full inspiration.",
          ar: "لن تكون الرئتان ممتلئتين بالكامل. اطلب من المريض شهيقًا عميقًا مع حبس النفس؛ ويُجرى التعريض في نهاية الشهيق الكامل الثاني.",
        },
      },
      evidence: { status: "common-reference", reference: "BONTRAGER-9 p.94", note: "No rib-count rule is claimed for the lateral (source needed)." },
    },
    pa("motion-instruction"),
  ],
  possibleErrors: chestPaErectExam.possibleErrors,
  imageCriteria: [
    { id: "rotation", description: { en: "No rotation (posterior ribs and costophrenic angles close together)", ar: "لا يوجد دوران (الأضلاع الخلفية والزوايا الضلعية الحجابية متقاربة)" } },
    { id: "coverage", description: { en: "Entire lungs, apices to costophrenic angles, sternum to posterior ribs", ar: "الرئتان كاملتان، من القمم إلى الزوايا الضلعية الحجابية ومن القص إلى الأضلاع الخلفية" } },
    { id: "soft-tissue", description: { en: "Chin and arms raised so soft tissue is clear of the apices", ar: "الذقن والذراعان مرفوعة فلا يتراكب النسيج الرخو على القمم" } },
    { id: "sharpness", description: { en: "No loss of sharpness from patient movement", ar: "لا يوجد فقدان في الحدّة بسبب حركة المريض" } },
    { id: "exposure", description: { en: "Enough exposure and penetration to see ribs and lung markings through the heart and upper lungs (judged by DI, not by displayed brightness)", ar: "تعريض واختراق كافيان لرؤية الأضلاع والعلامات الرئوية عبر القلب والرئتين العلويتين (يُحكم عليه من DI وليس من سطوع الصورة)" } },
  ],
  scene: { id: "chest-lateral" },
  render: { renderer: "radiograph-2d" },
};
