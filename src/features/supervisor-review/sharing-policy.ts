/** SHA-256 of UTF-8 JSON.stringify({version, ar, en}), in that key order; no trailing newline.
 * Independent of Terms/Assess consent. No database configuration or acceptance. */
export const sharingPolicy = {
 // RAD085-SQL-SHARING-POLICY-LOCAL-V2-20261027: regenerated version.
 "version": "supervisor-sharing-2026-10-27-v2",
 "ar": "مشاركة بياناتي مع مشرف المجموعة:\nأوافق على إتاحة محاولات تدريبي المحفوظة منذ انضمامي إلى هذه المجموعة ونتائج اختباراتي المسندة إليّ ضمن هذه المجموعة لمشرف المجموعة، ضمن نطاق صلاحياته وخلال فترة عضويتي وموافقتي الساريتين. لا تشمل المشاركة سجل تدريبي السابق لنافذة المشاركة.\nيمكنني سحب الموافقة أو مغادرة المجموعة لإيقاف وصول المشرف إلى بياناتي. لا يؤدي ذلك وحده إلى حذف سجلاتي أو إلغاء اختبار أُسند إليّ سابقًا. تبقى صلاحيات مالك الموقع وسياسة الاحتفاظ والحذف موضحة في شروط الاستخدام.\nعدم الموافقة يمنع الانضمام إلى المجموعة التي تتطلب هذه المشاركة.",
 "en": "Sharing my data with the group supervisor:\nI agree to make my practice attempts saved since I joined this group and my exam results assigned to me within this group available to the group supervisor, within their authorised scope and while both my membership and consent remain active. Sharing does not include my practice history from before the sharing window.\nI can withdraw consent or leave the group to stop the supervisor accessing my data. This alone does not delete my records or cancel an exam previously assigned to me. The site owner's permissions and the retention and deletion policy remain explained in the Terms of Use.\nWithout consent, I cannot join a group that requires this sharing.",
 // RAD085-SQL-SHARING-POLICY-LOCAL-V2-20261027: regenerated digest.
 "digest": "cf93db16deff71f3cd949c04ae41145bc92c7dc0bc8017204b0c9d404f6753cb"
} as const;
export function knownSharingPolicy(version: unknown, digest: unknown) {
 return version === sharingPolicy.version && digest === sharingPolicy.digest;
}
