import type { CheckRule, CriticalFindingRule } from "@/domain/case";
import type { ExamDefinition } from "@/domain/exam";
import { chestApTechnique } from "./chest-ap-technique";
import { chestPaErectExam } from "./chest-pa-erect";

/**
 * Exam definition: Chest X-ray — AP SUPINE (special projection, general radiography), Session 13.
 *
 * Built only from the Session 11 / 12 generic mechanisms: exam-declared `choiceControls` (patient position), tube
 * angulation (`controls.tubeAngulationDeg`, + = caudad), the default `anatomical-side` marker rule (same as the PA, S10b-22),
 * per-exam critical findings, the scene registry and optional asset landmark groups. Governing authority: BONTRAGER-9
 * p.96-97 (S10b-25). Every value below is PROVISIONAL until the educator / medical-physicist review (O5); numbers that are NOT
 * Bontrager are labelled ENGINE TEACHING CHOICES (S12-1): the 100–109 / 126–150 kV partial bands, the 185 cm upper SID limit
 * and the 150–200 cm partial band, the rotation bands and the tube-angulation bands. Weights reuse the PA weights (S10b-14);
 * no numeric mAs target (S10b-9). Bontrager criteria for the AP = the PA criteria except: the heart appears larger (shorter
 * SID and more object-to-image distance; teaching only, S10b-11), 8–9 posterior ribs may be seen, and the clavicles lie in the
 * same horizontal plane with the apices clear (correct CR angle).
 *
 * Patient position (supine / semi-erect) is the `state` choice control (S11-5). The baseline image does not claim a position
 * of its own: "supine" is a TEACHING APPROXIMATION of the exam variant (S13). Semi-erect as a separate set-up beyond this
 * choice, wheelchair / ward variants, landscape detector for large patients and the SID / position LABEL on the image are
 * not built (O9, S13 notes). Arabic text is DRAFT pending owner / educator review (use "الكاشف"; phone-short wording).
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

export const chestApSupineExam: ExamDefinition = {
  schemaVersion: 1,
  id: "chest-ap-supine",
  modality: "general-radiography",
  bodyPart: "chest",
  provisional: true,
  evidence: {
    status: "provisional",
    reference: "docs/RAD-LAB_Medical_Reference_Chest_AP.md; BONTRAGER-9 p.96-97; docs/DECISIONS.md S10b-*, S13-*",
    note: "Exam-level classification: provisional until the educator / medical-physicist review is signed off. Every rule, tolerance and feedback sentence carries its own evidence class.",
  },
  defaultCaseId: "adult-demo",
  title: { en: "Adult Chest X-ray — AP Supine", ar: "أشعة الصدر للبالغ — AP مستلقيًا" },
  requiredProjection: "ap-erect",
  availableProjections: ["pa-erect", "ap-erect", "lateral-left"],
  availableBreathing: chestPaErectExam.availableBreathing,
  availableMotionInstructions: chestPaErectExam.availableMotionInstructions,
  // BONTRAGER-9 p.96: 35 x 43 cm receptor, portrait or landscape (landscape is advised for large / broad-chested patients;
  // not modelled here: the demo patient is average and the landscape option would need a detector-orientation control).
  detector: { widthCm: 35, heightCm: 43 },
  // Provisional demo region (S10b-15 / O2): the same 27 x 31 cm as the PA. Apices to costophrenic angles, both lateral lung edges.
  requiredAnatomy: { xCm: 4, yCm: 3, widthCm: 27, heightCm: 31 },
  controls: {
    ...chestPaErectExam.controls,
    // S11-2: tube angulation, + = caudad. Selectable range only (hardware); the target is the rule below.
    tubeAngulationDeg: { min: -15, max: 15, step: 1 },
  },
  choiceControls: [
    {
      id: "state",
      label: { en: "Patient position", ar: "وضعية المريض" },
      hint: {
        en: "The AP chest is a special projection: supine, or semi-erect when the head end can be raised. Set the position the request asks for.",
        ar: "صدر AP إسقاط خاص: مستلقيًا، أو شبه جالس إذا أمكن رفع جهة الرأس. اختر الوضعية التي يطلبها الطلب.",
      },
      options: [
        { id: "supine", label: { en: "Supine", ar: "مستلقيًا" } },
        { id: "semierect", label: { en: "Semi-erect", ar: "شبه جالس" } },
      ],
    },
  ],
  technique: chestApTechnique,
  positioning: {
    // CR at T7, 8-10 cm below the jugular notch (BONTRAGER-9 p.96). Same demo region centre as the PA; tolerances PROVISIONAL.
    centering: {
      target: { x: 0, y: -0.14 },
      idealTolerance: { x: 0.08, y: 0.1 },
      acceptableTolerance: { x: 0.17, y: 0.25 },
    },
    minCollimation: 0.3,
    markerSizeCm: 2.2,
    // S10b-22: the letter is the patient's own anatomical side in the lateral field edge of that side — the SAME rule and the
    // SAME display convention as the PA (patient left = viewer right); the default `anatomical-side` marker rule applies.
    markerSide: { L: "viewer-right", R: "viewer-left" },
    defaultMarkerPosition: { L: { x: 0.84, y: -0.44 }, R: { x: -0.84, y: -0.44 } },
  },
  scoring: {
    // S10b-14: PA weights reused for v1.
    categoryWeights: { positioning: 25, rotation: 20, centering: 15, exposure: 20, sid: 10, breathing: 10 },
    passThreshold: 70,
    // S10b-13 / S13: the PA list (no arms control in this exam, so no arms-over-lungs finding).
    criticalFindings: [
      {
        ...paFinding("wrong-projection"),
        concept: {
          status: "common-reference",
          reference: "BONTRAGER-9 p.96; the exam request",
          note: "COMMON QUALITY CRITERION: the projection performed must be the projection requested (here the AP chest, a special projection for patients who cannot stand).",
        },
      },
      paFinding("patient-motion"),
      {
        id: "wrong-side-marker",
        label: { en: "Wrong-side marker", ar: "علامة جانب خاطئة" },
        reason: {
          en: "Critical finding — wrong-side marker: the marker is on the wrong side for the patient's side (in this simulator's display, as for the PA, L belongs on the viewer's right and R on the viewer's left). A wrong marker misidentifies the patient's side, so the attempt is below the pass mark whatever the numeric score. In practice such an image would normally be repeated.",
          ar: "ملاحظة حرجة — علامة جانب خاطئة: العلامة في الجانب الخطأ بالنسبة لجانب المريض (وفق عرض المحاكي، كما في PA: تُوضع L على يمين المشاهد وR على يساره). العلامة الخاطئة تُحدِّد جانب المريض خطأً، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. وفي الممارسة تُعاد الصورة عادةً.",
        },
        concept: {
          status: "common-reference",
          reference: "BONTRAGER-9 p.32-33, 36, 96",
          note: "COMMON QUALITY CRITERION: the marker letter is the patient's anatomical side, placed in the lateral field edge of that side (S10b-22: the same rule as the PA). Which viewer half carries which letter is this simulator's display convention (the same as the PA).",
        },
        evidence: {
          status: "provisional",
          reference: "S10b-13, S10b-22",
          note: "PROVISIONAL / educational: the gate is a simulator rule with the same severity as the PA wrong-side marker. The numeric score is unchanged.",
        },
      },
      {
        ...paFinding("missing-marker"),
        concept: {
          status: "common-reference",
          reference: "BONTRAGER-9 p.32-33, 36, 96; ACR-PORTABLE; WHO-TECH p.8, 10",
          note: "COMMON QUALITY CRITERION: the image must carry a side marker (S10b-22: scored for the AP from Session 13).",
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
      expected: "ap-erect",
      variantOnFail: "wrong-projection",
      label: { en: "Projection", ar: "الإسقاط" },
      feedback: {
        pass: { en: "Correct projection: AP, as requested.", ar: "الإسقاط صحيح: AP كما هو مطلوب." },
        fail: {
          en: "The projection does not match the request (AP chest). The AP is the special projection for a patient who cannot stand for a PA. Re-position the patient as requested.",
          ar: "الإسقاط لا يطابق الطلب (صدر AP). إسقاط AP إسقاط خاص للمريض غير القادر على الوقوف لإسقاط PA. أعد وضع المريض حسب الطلب.",
        },
      },
      evidence: { status: "common-reference", reference: "BONTRAGER-9 p.96; the exam request" },
    },
    {
      id: "state",
      kind: "equals",
      category: "positioning",
      weight: 1,
      setting: "choices.state",
      expected: "supine",
      label: { en: "Patient position (supine)", ar: "وضعية المريض (مستلقيًا)" },
      feedback: {
        pass: {
          en: "Supine, as requested. Bontrager gives supine or semi-erect (head end raised if possible) for the AP chest; fluid levels would need an erect patient and a horizontal beam.",
          ar: "مستلقيًا كما هو مطلوب. يذكر Bontrager للصدر AP الوضعية المستلقية أو شبه الجالسة (برفع جهة الرأس إن أمكن)؛ أما السوائل فتحتاج مريضًا واقفًا وشعاعًا أفقيًا.",
        },
        fail: {
          en: "The request is for the patient supine. Semi-erect (head end raised) is the other AP set-up Bontrager describes, but it does not match this request.",
          ar: "الطلب لمريض مستلقٍ. الوضعية شبه الجالسة (برفع جهة الرأس) هي الوضعية الأخرى لـ AP عند Bontrager، لكنها لا تطابق هذا الطلب.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.96; S10b-12; S13",
        note: "Supine vs semi-erect is a teaching approximation of the exam variant (the baseline image does not claim a position); this case requests supine. Semi-erect as its own variant is O9. Not drawn on the result image.",
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
          en: "The left side of the field (in the detector view) cuts off the lateral edge of the lung.",
          ar: "الجانب الأيسر للمجال (في عرض الكاشف) يقطع الحافة الجانبية للرئة.",
        },
        right: {
          en: "The right side of the field (in the detector view) cuts off the lateral edge of the lung.",
          ar: "الجانب الأيمن للمجال (في عرض الكاشف) يقطع الحافة الجانبية للرئة.",
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
        reference: "BONTRAGER-9 p.96-97 (criteria: collimate on four sides to the lung fields); AP ref §8",
        note: "The required anatomy is Bontrager's criterion; the 27 × 31 cm demo region is provisional (S10b-15, O2).",
      },
    },
    { ...pa("collimation-excess"), evidence: { status: "educational-simplification", reference: "BONTRAGER-9 p.96 (collimate to the lung fields)", note: "Principle validated; the 5 cm margin limit is provisional / configurable." } },
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
          en: "Shoulders rolled forward (arms rotated inward), so the scapulae are moved out of the lung fields.",
          ar: "الكتفان مدوَّران للأمام (الذراعان مدارتان للداخل)، فيبتعد اللوحان عن الحقلين الرئويين.",
        },
        fail: {
          en: "The shoulders are not rolled forward, so the scapulae can stay over the lung fields. Rotate the arms inward to roll the shoulders forward.",
          ar: "الكتفان غير مدوَّرين للأمام فقد يبقى اللوحان فوق الحقلين الرئويين. أدِر الذراعين للداخل لتدوير الكتفين للأمام.",
        },
      },
      evidence: { status: "common-reference", reference: "BONTRAGER-9 p.96", note: "Scored but not drawn on the AP result image in this version (no scapula overlay for this baseline)." },
    },
    {
      id: "side-marker",
      kind: "marker",
      category: "positioning",
      weight: 1,
      label: { en: "Side marker (patient's side)", ar: "علامة الجانب (جانب المريض)" },
      feedback: {
        pass: {
          en: "Marker placed inside the image margin, clear of the lungs, on the correct side. A real AP image also needs the SID (if under 183 cm) and the position (AP supine) marked on it; this simulator does not model that label yet.",
          ar: "العلامة موضوعة في هامش الصورة بعيدًا عن الرئتين وفي الجانب الصحيح. تحتاج صورة AP حقيقية أيضًا إلى كتابة SID (إن قلّ عن 183 سم) والوضعية (AP مستلقيًا) عليها؛ ولا يحاكي المحاكي هذه البطاقة بعد.",
        },
        fail: {
          en: "No side marker placed. Choose L or R (the patient's side) and place it inside the image margin.",
          ar: "لم توضع علامة جانب. اختر L أو R (جانب المريض) وضعها داخل هامش الصورة.",
        },
        overlap: {
          en: "The marker covers the lungs. Move it into the margin, away from the anatomy of interest.",
          ar: "العلامة تغطي الرئتين. انقلها إلى الهامش بعيدًا عن التشريح المطلوب.",
        },
        wrongSide: {
          en: "The marker is on the wrong side of the image. In this display the patient's left appears on the viewer's right, as in a PA, so L belongs on the viewer's right and R on the viewer's left, in the lateral edge of the field. A wrong marker misidentifies the patient's side.",
          ar: "العلامة على الجانب الخطأ من الصورة. في هذا العرض يظهر يسار المريض على يمين المشاهد كما في PA، لذا تُوضع L على يمين المشاهد وR على يساره، عند الحافة الجانبية للمجال. العلامة الخاطئة تُحدِّد جانب المريض خطأً.",
        },
        outsideField: {
          en: "The marker is outside the collimated field, so it would not be recorded on the image. Move it inside the field.",
          ar: "العلامة خارج المجال المحدَّد فلن تُسجَّل على الصورة. انقلها إلى داخل المجال.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.32-33, 36, 96; S10b-22",
        note: "Scored from Session 13 (S10b-22): the letter is the patient's anatomical side, as for the PA. The SID and AP supine / semi-erect label (Bontrager p.96) is NOT modelled (no label control; open item).",
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
      // MAGNITUDE-ONLY (S13): the p.83 direction rule is the PA geometry; no source gives the AP direction, so no `low` / `high` text.
      feedback: {
        pass: {
          en: "The patient is square to the detector: the spine is midway between the lateral rib borders and the sternoclavicular joints are equally far from it.",
          ar: "المريض متعامد مع الكاشف: العمود الفقري في منتصف المسافة بين الحدّين الضلعيين الجانبيين، والمفصلان القصّيان الترقويان على بُعد متساوٍ منه.",
        },
        fail: {
          en: "The patient is rotated. The distances from the spine to the lateral rib borders, and to the two sternoclavicular joints, are no longer equal. Only the amount of rotation is given for the AP: the direction rule (Bontrager p.83) is described for the PA.",
          ar: "المريض مائل (دوران). لم تعد المسافات من العمود الفقري إلى الحدّين الضلعيين الجانبيين وإلى المفصلين القصّيين الترقويين متساوية. يُذكر مقدار الدوران فقط في AP؛ فقاعدة الاتجاه (Bontrager ص.83) موصوفة لإسقاط PA.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.83, 96; S10b-3; S13",
        note: "Criterion = the PA's (equal spine-to-rib-border and sternoclavicular distances, p.96). The ±2° / ±5° bands are an ENGINE TEACHING CHOICE (the same numbers as the PA; Bontrager gives no angle). Magnitude only: the sternal-clavicle-end rule (p.83) is the PA geometry and the renderer's spine shift keeps the PA sense, so no direction text for the AP (open item).",
      },
    },
    {
      id: "centering-lateral",
      kind: "centering",
      axis: "x",
      category: "centering",
      label: { en: "Central ray — midline", ar: "الشعاع المركزي — الخط المنتصف" },
      feedback: {
        pass: { en: "The central ray is aligned with the midline.", ar: "الشعاع المركزي محاذٍ للخط المنتصف." },
        fail: {
          en: "The central ray is off the midline. Re-centre it on the midsagittal plane.",
          ar: "الشعاع المركزي بعيد عن الخط المنتصف. أعد توسيطه على المستوى السهمي المنتصف.",
        },
        low: {
          en: "The central ray is shifted to the left of the midline (left side of the detector view). The chest sits off-centre and the lung edge on that side may be clipped. Move the target right, toward the midline.",
          ar: "الشعاع المركزي مزاح إلى يسار الخط المنتصف (يسار عرض الكاشف). يقع الصدر بعيدًا عن المركز وقد تُقطع حافة الرئة في ذلك الجانب. حرّك الهدف يمينًا نحو الخط المنتصف.",
        },
        high: {
          en: "The central ray is shifted to the right of the midline (right side of the detector view). The chest sits off-centre and the lung edge on that side may be clipped. Move the target left, toward the midline.",
          ar: "الشعاع المركزي مزاح إلى يمين الخط المنتصف (يمين عرض الكاشف). يقع الصدر بعيدًا عن المركز وقد تُقطع حافة الرئة في ذلك الجانب. حرّك الهدف يسارًا نحو الخط المنتصف.",
        },
      },
      evidence: { status: "educational-simplification", reference: "BONTRAGER-9 p.96; AP ref §3", note: "Midline alignment; tolerance values are provisional." },
    },
    {
      id: "centering-vertical",
      kind: "centering",
      axis: "y",
      category: "centering",
      label: { en: "Central ray — T7 level", ar: "الشعاع المركزي — مستوى T7" },
      feedback: {
        pass: {
          en: "The central ray is at about the T7 level (8–10 cm below the jugular notch).",
          ar: "الشعاع المركزي عند مستوى T7 تقريبًا (8–10 سم تحت الشق الوداجي).",
        },
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
        reference: "BONTRAGER-9 p.96 (T7, 8–10 cm below the jugular notch); S10b-23",
        note: "T7 is Bontrager's level; the position on the detector is modelled as the centre of the demo region and the tolerances are provisional.",
      },
    },
    {
      id: "angulation",
      kind: "range",
      category: "centering",
      setting: "tubeAngulationDeg",
      // ENGINE TEACHING CHOICE: Bontrager gives "about 5° caudad" only (perpendicular to the long axis of the sternum); the bands are not Bontrager.
      ideal: [3, 7],
      acceptable: [1, 10],
      unit: "°",
      label: { en: "Tube angulation (caudad)", ar: "ميل الأنبوب (نحو القدمين)" },
      feedback: {
        pass: {
          en: "About 5° caudad: the central ray is roughly perpendicular to the sternum, so the clavicles lie in the same horizontal plane and the apices are not hidden by them.",
          ar: "نحو 5° باتجاه القدمين: الشعاع المركزي عموديّ تقريبًا على القص، فتقع الترقوتان في المستوى الأفقي نفسه ولا تحجبان القمم.",
        },
        fail: {
          en: "The tube angle is far from about 5° caudad (perpendicular to the sternum).",
          ar: "ميل الأنبوب بعيد عن نحو 5° باتجاه القدمين (عموديّ على القص).",
        },
        low: {
          en: "Too little caudad angle (0° or cephalad). The beam is not perpendicular to the sternum, so the clavicles are not in the same horizontal plane and can hide the apices. About 5° caudad is advised.",
          ar: "ميل غير كافٍ باتجاه القدمين (0° أو نحو الرأس). الشعاع ليس عموديًا على القص، فلا تقع الترقوتان في المستوى الأفقي نفسه وقد تحجبان القمم. يُنصح بنحو 5° باتجاه القدمين.",
        },
        high: {
          en: "More caudad angle than needed. The aim is the beam perpendicular to the sternum, about 5° caudad.",
          ar: "ميل نحو القدمين أكبر من اللازم. الهدف شعاع عموديّ على القص، نحو 5° باتجاه القدمين.",
        },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.96-97; S10b-23; S13",
        note: "About 5° caudad (perpendicular to the long axis of the sternum) is Bontrager. The ±2° full-credit band and the 1–10° partial band are an ENGINE TEACHING CHOICE (not Bontrager). Feedback only: the clavicle / apex appearance is NOT drawn on the result image.",
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
          en: "kVp is inside the demo target band (110–125 kV), the optimal chest band in the textbook, also for the AP supine chest.",
          ar: "قيمة kVp ضمن النطاق التجريبي (110–125 kV)، وهو النطاق الأمثل للصدر في الكتاب، ومنه صدر AP المستلقي.",
        },
        low: {
          en: "kVp is below the target band. A less penetrating beam is absorbed more by the heart and the spine, so lung markings behind them are harder to see. Extra mAs adds photons, not penetration. (Only 110–125 kV is the textbook band; the 100–109 and 126–150 kV partial credit is an engine teaching choice.)",
          ar: "قيمة kVp أقل من النطاق المستهدف. الحزمة الأقل اختراقًا تمتصها البنى الكثيفة أكثر (القلب والعمود الفقري) فيصعب رؤية العلامات الرئوية خلفها. mAs الإضافي يزيد الفوتونات ولا يزيد الاختراق. (النطاق في الكتاب هو 110–125 kV فقط؛ أما الدرجة الجزئية لـ 100–109 و126–150 kV فهي اختيار تعليمي في المحاكي.)",
        },
        high: {
          en: "kVp is above the target band. The beam is more penetrating, which lowers contrast; whether that is acceptable depends on the detector and local protocol. This simulation draws no image effect for a higher kVp. (Only 110–125 kV is the textbook band; the 126–150 kV partial credit is an engine teaching choice.)",
          ar: "قيمة kVp أعلى من النطاق المستهدف. الحزمة أكثر اختراقًا فينخفض التباين؛ ومدى قبول ذلك يعتمد على الكاشف والبروتوكول المحلي. لا يرسم المحاكي أثرًا للـ kVp الأعلى. (النطاق في الكتاب هو 110–125 kV فقط؛ أما الدرجة الجزئية لـ 126–150 kV فهي اختيار تعليمي.)",
        },
        fail: { en: "kVp is outside the demo protocol's range.", ar: "قيمة kVp خارج نطاق البروتوكول التجريبي." },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.81, 92, 94, 96; S10b-1; S12-1",
        note: "110–125 kV is Bontrager (p.96). The partial bands 100–109 and 126–150 kV are an ENGINE TEACHING CHOICE (owner-approved), NOT Bontrager. kVp physics is validated but never mapped to displayed darkness.",
      },
    },
    { ...pa("exposure-adequacy"), evidence: { status: "provisional", reference: "Technique ref §5, §6, §8; S10b-9", note: "VALIDATED: DI equation and digital-exposure concepts. PROVISIONAL: the ±1 / ±3 DI bands and the demo target; no numeric mAs target and no universal EIT or DI limit is claimed. A portable AP exposure is manual and recorded per image (S10b-2); the exposure mode itself is not scored." } },
    { ...pa("dose-optimization"), evidence: { status: "provisional", reference: "Technique ref §7, §8; S10b-9", note: "VALIDATED: digital dynamic range can hide excess exposure (dose creep). PROVISIONAL: the DI bands. No patient dose is calculated." } },
    {
      id: "sid",
      kind: "range",
      category: "sid",
      setting: "sidCm",
      ideal: [180, 185],
      // Lower bound 102 cm (40 in) = the ACR-PORTABLE limit for a supine / semi-erect patient (S10b-10, S10b-23); engine teaching choice.
      acceptable: [102, 200],
      unit: "cm",
      variantOnLow: "magnified-geometry",
      label: { en: "Source-to-image distance (SID)", ar: "المسافة بين المصدر والكاشف (SID)" },
      feedback: {
        pass: { en: "SID is within the target (at least about 183 cm; 180 cm is its rounding).", ar: "قيمة SID ضمن المستهدف (183 سم على الأقل تقريبًا؛ و180 سم تقريب له)." },
        low: {
          en: "SID is shorter than 183 cm (72 in), the minimum where possible. A shorter SID can be accepted for a patient who cannot be imaged at that distance, but then the SID used must be marked on the image together with the projection (e.g. AP supine; this simulator does not model that label yet). It also makes the heart look larger (teaching only) and raises the exposure at the detector (inverse-square).",
          ar: "قيمة SID أقصر من 183 سم (72 بوصة)، وهو الحد الأدنى حيثما أمكن. يمكن قبول مسافة أقصر لمريض لا يمكن تصويره على تلك المسافة، لكن يجب حينئذٍ كتابة SID المستخدمة على الصورة مع الإسقاط (مثل AP مستلقيًا؛ ولا يحاكي المحاكي هذه البطاقة بعد). كما تجعل القلب يبدو أكبر (للتعليم فقط) وتزيد التعريض عند الكاشف (قانون التربيع العكسي).",
        },
        high: {
          en: "SID is longer than this simulator's teaching band; exposure at the detector drops (inverse-square), so in manual mode the technique would need adjusting. (The textbook gives only a minimum; the upper limit is an engine teaching choice.)",
          ar: "قيمة SID أطول من النطاق التعليمي في المحاكي؛ ينخفض التعريض عند الكاشف (قانون التربيع العكسي) فيحتاج الوضع اليدوي إلى تعديل العوامل. (الكتاب يذكر حدًا أدنى فقط؛ والحد الأعلى اختيار تعليمي في المحاكي.)",
        },
        fail: { en: "SID is outside the target band (below about 102 cm or above 200 cm).", ar: "قيمة SID خارج النطاق المستهدف (أقل من نحو 102 سم أو أكثر من 200 سم)." },
      },
      evidence: {
        status: "provisional",
        reference: "BONTRAGER-9 p.96 (minimum 183 cm where possible, otherwise label the SID); ACR-PORTABLE Sec IV (102 cm); S10b-23; S12-1",
        note: "Bontrager gives a MINIMUM of 72 in (183 cm) where possible and asks for the SID to be marked when shorter. The 185 cm upper full-credit limit, the 150–200 cm style partial band and the 102 cm lower bound (ACR-PORTABLE conversion, not Bontrager) are ENGINE TEACHING CHOICES; 180 cm earns full credit as the rounding of 183.",
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
          en: "Correct: full inspiration and hold. The exposure is made at the end of the second full inspiration. On an AP, 8–9 posterior ribs are acceptable and the lungs can look denser than on a PA.",
          ar: "صحيح: شهيق عميق مع حبس النفس. يُجرى التعريض في نهاية الشهيق الكامل الثاني. في AP يُقبل ظهور 8–9 أضلاع خلفية وقد تبدو الرئتان أكثر كثافة منها في PA.",
        },
        fail: {
          en: "The lungs will not be fully expanded. Instruct the patient to take a deep breath in and hold it; the exposure is made at the end of the second full inspiration.",
          ar: "لن تكون الرئتان ممتلئتين بالكامل. اطلب من المريض شهيقًا عميقًا مع حبس النفس؛ ويُجرى التعريض في نهاية الشهيق الكامل الثاني.",
        },
      },
      evidence: { status: "common-reference", reference: "BONTRAGER-9 p.96-97", note: "No rib-count rule is claimed (8–9 posterior ribs is stated as acceptable, not scored)." },
    },
    pa("motion-instruction"),
  ],
  possibleErrors: chestPaErectExam.possibleErrors,
  imageCriteria: [
    { id: "rotation", description: { en: "No rotation (equal spine-to-rib-border and sternoclavicular distances)", ar: "لا يوجد دوران (مسافات متساوية من العمود الفقري إلى الحدّين الضلعيين وإلى المفصلين القصّيين الترقويين)" } },
    { id: "clavicles", description: { en: "Clavicles in the same horizontal plane, apices clear (correct central-ray angle)", ar: "الترقوتان في المستوى الأفقي نفسه والقمم واضحة (زاوية صحيحة للشعاع المركزي)" } },
    { id: "coverage", description: { en: "Both lungs fully included, apices to costophrenic angles", ar: "الرئتان كاملتان من القمم إلى الزوايا الضلعية الحجابية" } },
    { id: "heart", description: { en: "Heart appears larger than on a PA (shorter SID and more object distance — teaching only)", ar: "القلب يبدو أكبر منه في PA (بسبب SID أقصر وبُعد أكبر للجسم — للتعليم فقط)" } },
    { id: "inspiration", description: { en: "Full inspiration (8–9 posterior ribs is acceptable on an AP)", ar: "شهيق كامل (يُقبل ظهور 8–9 أضلاع خلفية في AP)" } },
    { id: "sharpness", description: { en: "No loss of sharpness from patient movement", ar: "لا يوجد فقدان في الحدّة بسبب حركة المريض" } },
    { id: "exposure", description: { en: "Detector exposure near target with adequate penetration (judged by DI, not by displayed brightness)", ar: "تعريض كاشف قريب من الهدف مع اختراق كافٍ (يُحكم عليه من DI وليس من سطوع الصورة المعروضة)" } },
  ],
  scene: { id: "chest-ap-supine" },
  render: { renderer: "radiograph-2d" },
};
