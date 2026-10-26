/** SHA-256 of UTF-8 JSON.stringify({version, ar, en}), in that key order; no trailing newline.
 * Independent of Terms/Assess consent. No database configuration or acceptance. */
export const sharingPolicy = {
 "version": "supervisor-sharing-2026-10-26-v1",
 "ar": "مشاركة بياناتي مع مشرف المجموعة:\nأوافق على إتاحة محاولات تدريبي المحفوظة ونتائج اختباراتي لمشرف المجموعة، ضمن نطاق صلاحياته وخلال فترة عضويتي وموافقتي الساريتين. لا تشمل المشاركة سجل تدريبي السابق لنافذة المشاركة.\nيمكنني سحب الموافقة أو مغادرة المجموعة لإيقاف وصول المشرف إلى بياناتي. لا يؤدي ذلك وحده إلى حذف سجلاتي أو إلغاء اختبار أُسند إليّ سابقًا. تبقى صلاحيات مالك الموقع وسياسة الاحتفاظ والحذف موضحة في شروط الاستخدام.\nعدم الموافقة يمنع الانضمام إلى المجموعة التي تتطلب هذه المشاركة.",
 "en": "Sharing my data with the group supervisor:\nI agree to make my saved practice attempts and exam results available to the group supervisor, within their authorised scope and while both my membership and consent remain active. Sharing does not include my practice history from before the sharing window.\nI can withdraw consent or leave the group to stop the supervisor accessing my data. This alone does not delete my records or cancel an exam previously assigned to me. The site owner's permissions and the retention and deletion policy remain explained in the Terms of Use.\nWithout consent, I cannot join a group that requires this sharing.",
 "digest": "c1ad94d66041af575cd7c53635bf97b6938618fcca397f75b92d5401cb0cf510"
} as const;
export function knownSharingPolicy(version: unknown, digest: unknown) {
 return version === sharingPolicy.version && digest === sharingPolicy.digest;
}
