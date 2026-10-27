# RAD-085 — Terms P1 · approved proposal for DB day

معتمد بقرار [O1/O5](DECISIONS.md#rad085-db-day-owner-2026-10-27)؛ **ليس النص المنشور**. لا تغيير في messages.terms أو CONSENT_VERSION الآن. النصان معتمدان معًا بحدود O1/O5، ويُضافان إلى قسم «من يرى البيانات» يوم DB day فقط؛ عندها تُرفع CONSENT_VERSION وتُطلب موافقة كل مستخدم بنفسه. نسخة المشاركة المستقلة [v2](../src/features/supervisor-review/sharing-policy.ts) معتمدة بنصها الحالي ولا تتغير هنا. الأصل: [الخطة §4](RAD-085_PLAN_2026-10-25.md#4-نموذج-البيانات-وrls-ونوافذ-الرؤية) و[D3](DECISIONS.md#rad085-owner-tidy-2026-10-27).

## AR — النص المعتمد ليوم DB day

مشرف المجموعة شخص عيّنه مالك الموقع للإشراف على مجموعته، بحساب معتمد وتعيين سارٍ. تعيينه لا يمنحه صلاحيات مالك الموقع: لا يعتمد الحسابات أو يعلقها أو يحذفها، ولا يرى جميع سجلات التدريب أو إجابات الاستبيانات. إجابات الاستبيانات يقرأها مالك الموقع وحده.

إذا اخترت الانضمام إلى مجموعة، نعرض سياسة المشاركة قبل تقديم الطلب، ويتطلب ذلك موافقتك الشخصية الصريحة بمربع غير محدد مسبقًا. إدخال رمز المجموعة ينشئ طلبًا معلقًا؛ لا يبدأ وصول المشرف بمجرد إدخال الرمز. لا يقبل المالك أو المشرف شروط الاستخدام أو المشاركة نيابةً عنك.

بعد موافقة مشرف المجموعة على طلبك، ومع سريان عضويتك وموافقتك وتعيينه والمجموعة، يمكنه رؤية محاولات التدريب المحفوظة منذ انضمامك ضمن نافذة المشاركة، ونتائج اختباراتك المسندة إليك ضمن هذه المجموعة. تبدأ نافذة التدريب من أحدث وقت بين الانضمام وبداية المجموعة وتعيين المشرف وقبول المشاركة، وتعتمد وقت الحفظ المسجل في الخادم؛ لا تشمل سجل التدريب السابق. نتائج الاختبارات تقتصر على إسنادات المجموعة ومحاولات بدأت ضمن النافذة، وتبقى النتائج المخفية أو المنتهية محجوبة. لا تمنح المشاركة وصولًا إلى اختبارات مشرف آخر.

يمكنك من «الحساب» مغادرة المجموعة أو سحب موافقتك على المشاركة. يتوقف وصول المشرف عند المغادرة أو السحب أو انتهاء المجموعة أو سحب تعيينه أو فقد شروط الوصول. إعادة الانضمام أو الموافقة أو تعيين المشرف تبدأ نافذة جديدة ولا تعيد التاريخ السابق. المغادرة أو السحب لا يحذفان سجلاتك ولا يلغيان وحدهما اختبارًا سبق إسناده إليك؛ تبقى صلاحيات مالك الموقع وفق شروط الاستخدام.

لا يغيّر هذا التحديث سياسة الاحتفاظ: يعلن المالك نهاية التجربة بعد اكتمال المشاركات ومراجعتها عبر الموقع أو البريد، وتحذف البيانات المرتبطة بالمشاركين خلال ستة أشهر من الإعلان؛ قد تبقى إحصاءات وملخصات عامة لا تحدد الهوية. يُعطّل حسابك فورًا. يمكنك إلغاء طلب الحذف خلال 30 يومًا. بعد ذلك يُحذف نهائيًا خلال 7 أيام. إذا كنت مشرفًا أو مؤلفًا، تُنقل مسؤولية إدارة المحتوى اللازم الاحتفاظ به إلى المالك قبل اليوم الثلاثين وقبل الحذف، مع احترام الإسناد والترخيص، دون نسب تأليفك للمالك أو حجب الحذف لأجل غير محدد. لا يمدد انتقال الإدارة احتفاظ نتائج الطلاب.

## EN — approved text for DB day

A group supervisor is a person appointed by the site owner to supervise their group, with an approved account and an active appointment. Appointment does not give them the site owner's powers: they cannot approve, suspend or delete accounts, or see all practice records or survey answers. Only the site owner can read survey answers.

If you choose to join a group, we show the sharing policy before you submit a request and require your explicit personal agreement through an initially unchecked box. Entering a group code creates a pending request; it does not itself give the supervisor access. Neither the owner nor a supervisor accepts the Terms of Use or sharing on your behalf.

After the group supervisor approves your request, and while your membership, consent, their appointment and the group remain active, they can see practice attempts saved since you joined within the sharing window, and your exam results assigned to you within this group. The practice window starts at the latest of joining, group start, supervisor appointment and sharing acceptance, using the server's recording time; it excludes earlier practice history. Exam results are limited to group assignments and attempts started within the window; hidden or expired results stay hidden. Sharing does not give access to another supervisor's exams.

From Account you can leave the group or withdraw sharing consent. The supervisor's access stops when you leave, withdraw, the group ends, their appointment is revoked or access conditions cease to hold. Rejoining, consenting again or reappointing the supervisor starts a new window and does not restore earlier history. Leaving or withdrawing does not itself delete your records or cancel an exam already assigned to you; the site owner's access remains governed by the Terms of Use.

This update does not change retention: the owner announces the end of the trial through the site or email after participation and review are complete, and participant-linked data is deleted within six months of that announcement; general statistics and summaries that do not identify anyone may remain. Your account is disabled immediately. You can cancel within 30 days. After that, it is permanently deleted within 7 days. For supervisors or authors, management of necessary retained content transfers to the owner before day 30 and before deletion, respecting attribution and licensing, without crediting the owner as author or blocking deletion indefinitely. Management transfer does not extend retention of students' results.

## حدود التطبيق

الفقرة عن نتائج الاختبارات تشرح السياسة المعتمدة؛ مسار P1 يعرض التدريب فقط، ولا يفعّل P2 أو نشر الامتحانات. القبول النهائي يتطلب مراجعة واختبار ترحيل D3؛ [فجوة D3](RAD-085_D3_SQL_GAP.md) مانع قبل تعيين أي مشرف حقيقي. لا تغيير في نافذة C2 أو موعد finalise؛ المهلة محسومة في O5: نقل قبل30، وfinalise الطبيعي بعدها، وإكمال خلال7أيام دون تعديل C2.


## Current published Terms inspection and exact DB-day correction

> **Promotion PR (RAD085-DB-DAY-PROMOTION-20261027):** the five approved paragraphs below are published in `terms.who.p3–p7` (EN/AR), `terms.howLong.p3/p4` and `c2.permanent`/`c2.confirmDeactivate` carry the table values, and `CONSENT_VERSION` is raised. It is Draft and unmerged until the owner finishes DB day; the text of this section below is the pre-promotion inspection and is kept unchanged.

Inspected messages/en.json and messages/ar.json: `terms.howLong.p3` already describes a **30-day recovery window**, and p4 deletes **after** it; neither currently promises deletion “within 30 days”. They omit the seven-day completion limit. `c2.permanent`/`c2.confirmDeactivate` also need the O5 timing wording on DB day. No published Terms/message value below is changed in this PR.

At the same release as the approved sharing paragraphs and CONSENT_VERSION bump, prepare these exact timing replacements:

| Key | EN | AR |
|---|---|---|
| terms.howLong.p3 | Your account is disabled immediately. You can cancel within 30 days. | يُعطّل حسابك فورًا. يمكنك إلغاء طلب الحذف خلال 30 يومًا. |
| terms.howLong.p4 (timing sentences; retain the existing provider-backup notice) | After that, it is permanently deleted within 7 days. For supervisors or authors, management of necessary retained content transfers to the owner before deletion, without crediting the owner as author. | بعد ذلك يُحذف نهائيًا خلال 7 أيام. إذا كنت مشرفًا أو مؤلفًا، تُنقل مسؤولية إدارة المحتوى اللازم الاحتفاظ به إلى المالك قبل الحذف، دون نسب تأليفك للمالك. |
| c2.permanent | Your account is disabled immediately. You can cancel within 30 days. After that, it is permanently deleted within 7 days. | يُعطّل حسابك فورًا. يمكنك إلغاء طلب الحذف خلال 30 يومًا. بعد ذلك يُحذف نهائيًا خلال 7 أيام. |
| c2.confirmDeactivate | Confirm deactivation and deletion after the 30-day recovery window | تأكيد التعطيل والحذف بعد نافذة الاستعادة ذات 30 يومًا |

The full approved proposal above additionally requires management transfer before day30; this table changes timing only and grants no owner authorship, early finalise, new retention extension or acceptance on another person's behalf.
