import type { LocalizedText } from "@/domain/localized";
const t = (en: string, ar: string): LocalizedText => ({ en, ar });
/** Presentation only; the measured square, exclusion regions and scoring predicates are unchanged. */
export const markerOverlapFeedback = {
  overlap: t("Move the marker farther from the anatomy reference so the WHOLE marker square is outside that area and inside the field. If needed, widen the field slightly toward that side to include the whole marker.", "أبعد العلامة أكثر عن منطقة التشريح المرجعية، بحيث يكون مربع العلامة كاملًا خارجها وداخل المجال. عند الحاجة، وسّع المجال قليلًا نحو تلك الجهة لاحتواء العلامة كاملةً."),
  overlapLeft: t("There is room at the left edge of the field (in the detector view).", "يوجد متسع عند الحافة اليسرى للمجال (في عرض الكاشف)."),
  overlapRight: t("There is room at the right edge of the field (in the detector view).", "يوجد متسع عند يمين المجال (في عرض الكاشف)."),
  overlapTop: t("There is room at the top edge of the field (in the detector view).", "يوجد متسع عند الحافة العلوية للمجال (في عرض الكاشف)."),
  overlapBottom: t("There is room at the bottom edge of the field (in the detector view).", "يوجد متسع عند الحافة السفلية للمجال (في عرض الكاشف)."),
};
