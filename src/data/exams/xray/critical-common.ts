import type { CriticalFindingRule } from "@/domain/case";
import type { LocalizedText } from "@/domain/localized";
import type { Evidence } from "@/domain/technique";

/**
 * Critical findings reused by exams that gain them in S6 (owner 2026-10-22): the limb exams (wrong projection, visible motion) and the
 * pelvis / shoulder exams (visible motion). Each wording is shared so the families cannot drift; the detectors are the registered
 * `wrong-projection` and `patient-motion` ones (no new mechanism). `page` is the exam's Bontrager page reference.
 */
const T = (en: string, ar: string): LocalizedText => ({ en, ar });
const ev = (status: Evidence["status"], reference: string, note: string): Evidence => ({ status, reference, note });

export const wrongProjectionFinding = (page: string): CriticalFindingRule => ({
  id: "wrong-projection",
  label: T("Wrong projection", "إسقاط خاطئ"),
  reason: T(
    "Critical finding — wrong projection: a different projection from the one requested was performed. Performing the wrong examination is a fundamental error, not a matter of degree, so the attempt is below the pass mark whatever the numeric score. The result image for a projection that is not simulated is only a labelled layout. This is an educational result, not a clinical decision about the image.",
    "ملاحظة حرجة — إسقاط خاطئ: أُجري إسقاط مختلف عن المطلوب. إجراء الفحص الخاطئ خطأ جوهري وليس مسألة درجات، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. وصورة النتيجة لإسقاط غير ممثَّل ليست إلا تخطيطًا معنونًا. وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.",
  ),
  concept: ev("common-reference", `The exam request; BONTRAGER-9 ${page}`, "COMMON QUALITY CRITERION: the projection performed must be the projection requested."),
  evidence: ev("provisional", "S6 (owner 2026-10-22)", "Choosing a projection other than the requested one is scored by the projection check and also affects the pass mark. The result image of a projection that is not simulated is labelled, not drawn. The numeric score is unchanged."),
});

export const patientMotionFinding = (page: string): CriticalFindingRule => ({
  id: "patient-motion",
  label: T("Visible patient motion", "حركة مرئية للمريض"),
  reason: T(
    "Critical finding — visible patient motion: in this simulation the patient moved during the exposure (here because the instruction given asked for movement), which blurs the image (loss of sharpness). Motion blur cannot be corrected afterwards, so the attempt is below the pass mark whatever the numeric score. This is an educational result, not a clinical decision about the image.",
    "ملاحظة حرجة — حركة مرئية للمريض: في هذه المحاكاة تحرّك المريض أثناء التعريض (هنا لأن التعليمة المعطاة طلبت الحركة) مما سبّب ضبابية في الصورة (فقدان الحدّة). لا يمكن تصحيح ضبابية الحركة لاحقًا، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.",
  ),
  concept: ev("common-reference", `Image-quality ref — Motion; BONTRAGER-9 ${page} (no motion)`, "COMMON QUALITY CRITERION: patient motion reduces sharpness."),
  evidence: ev("provisional", "S6 and S5 (owner 2026-10-22)", "An instruction to move affects the pass mark; a missing 'stay still' instruction alone does not. No blur size is claimed. The numeric score is unchanged."),
});
