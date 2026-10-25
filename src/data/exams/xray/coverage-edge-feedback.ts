import type { CheckRule } from "@/domain/case";
import type { LocalizedText } from "@/domain/localized";
const t = (en: string, ar: string): LocalizedText => ({ en, ar });
const edges = {
  left: ["left", "اليسرى"], right: ["right", "يمين"], top: ["top", "العلوية"], bottom: ["bottom", "السفلية"],
} as const;
const arabicEdge = (ar: string) => ar === "يمين" ? "حافة يمين المجال" : `الحافة ${ar}`;
const excessSides = Object.fromEntries(Object.entries(edges).map(([key, [en, ar]]) => [key, t(`Too wide at the ${en} edge: move that edge inward without clipping anatomy or the marker.`, `المجال واسع أكثر من اللازم عند ${arabicEdge(ar)}: حرّكها للداخل دون قطع التشريح أو العلامة.`)])) as Record<keyof typeof edges, LocalizedText>;
const clippedSides = Object.fromEntries(Object.entries(edges).map(([key, [en, ar]]) => [key, t(`The ${en} edge of the field cuts off required anatomy (in the detector view).`, `${arabicEdge(ar)} تقطع جزءًا من التشريح المطلوب (في عرض الكاشف).`)])) as Record<keyof typeof edges, LocalizedText>;
const clipping = t("Adjust only the named clipped edges outward, or re-centre the ray. Keep the required anatomy and marker included; reduce any edges identified as excessive separately.", "حرّك حواف القص المذكورة فقط إلى الخارج، أو أعد توسيط الشعاع. أبقِ التشريح المطلوب والعلامة داخل المجال، وضيّق حواف الزيادة المذكورة بشكل مستقل.");

/** Authoring helper only. Existing optional excessSides is already excluded from comparison identity. No evaluator changes. */
export function withCoverageEdgeWording(rules: CheckRule[], preserveExisting = false): CheckRule[] {
  // Wrist wording was accepted in RAD-080; keep its already configured copy byte-for-byte.
  if (preserveExisting) return rules;
  return rules.map(r => r.kind !== "coverage" ? r : r.check === "clipping"
    ? { ...r, clippedSides: r.clippedSides ?? clippedSides, feedback: { ...r.feedback, fail: clipping } }
    : { ...r, excessSides, feedback: { ...r.feedback, high: t(
      `Reduce only the named excessive edges, keeping required anatomy and the whole marker inside the field. Adjust any clipped edges outward separately. Margin limit: ${r.maxMarginCm} cm; an opening required by the ray position or marker is allowed by the existing rule.`,
      `ضيّق حواف الزيادة المذكورة فقط، مع إبقاء التشريح المطلوب والعلامة كاملة داخل المجال. حرّك حواف القص إلى الخارج بشكل مستقل. حدّ الهامش ${r.maxMarginCm} سم؛ تسمح القاعدة القائمة بالفتح الذي يفرضه موضع الشعاع أو العلامة.`,
    ) } });
}
