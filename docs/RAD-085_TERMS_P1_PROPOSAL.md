# RAD-085 — Terms P1 · PROPOSAL

مقترح للمالك فقط؛ **ليس النص المنشور**. لا تغيير في messages.terms أو CONSENT_VERSION الآن. يُراجع النصان معًا، ويُضافان إلى قسم «من يرى البيانات» يوم DB day بعد موافقة المالك فقط؛ عندها تُرفع CONSENT_VERSION وتُطلب موافقة كل مستخدم بنفسه. نسخة المشاركة المستقلة [v2](../src/features/supervisor-review/sharing-policy.ts) معتمدة بنصها الحالي ولا تتغير هنا. الأصل: [الخطة §4](RAD-085_PLAN_2026-10-25.md#4-نموذج-البيانات-وrls-ونوافذ-الرؤية) و[D3](DECISIONS.md#rad085-owner-tidy-2026-10-27).

## AR — النص المطلوب اعتماده

مشرف المجموعة شخص عيّنه مالك الموقع للإشراف على مجموعته، بحساب معتمد وتعيين سارٍ. تعيينه لا يمنحه صلاحيات مالك الموقع: لا يعتمد الحسابات أو يعلقها أو يحذفها، ولا يرى جميع سجلات التدريب أو إجابات الاستبيانات. إجابات الاستبيانات يقرأها مالك الموقع وحده.

إذا اخترت الانضمام إلى مجموعة، نعرض سياسة المشاركة قبل تقديم الطلب، ويتطلب ذلك موافقتك الشخصية الصريحة بمربع غير محدد مسبقًا. إدخال رمز المجموعة ينشئ طلبًا معلقًا؛ لا يبدأ وصول المشرف بمجرد إدخال الرمز. لا يقبل المالك أو المشرف شروط الاستخدام أو المشاركة نيابةً عنك.

بعد موافقة مشرف المجموعة على طلبك، ومع سريان عضويتك وموافقتك وتعيينه والمجموعة، يمكنه رؤية محاولات التدريب المحفوظة منذ انضمامك ضمن نافذة المشاركة، ونتائج اختباراتك المسندة إليك ضمن هذه المجموعة. تبدأ نافذة التدريب من أحدث وقت بين الانضمام وبداية المجموعة وتعيين المشرف وقبول المشاركة، وتعتمد وقت الحفظ المسجل في الخادم؛ لا تشمل سجل التدريب السابق. نتائج الاختبارات تقتصر على إسنادات المجموعة ومحاولات بدأت ضمن النافذة، وتبقى النتائج المخفية أو المنتهية محجوبة. لا تمنح المشاركة وصولًا إلى اختبارات مشرف آخر.

يمكنك من «الحساب» مغادرة المجموعة أو سحب موافقتك على المشاركة. يتوقف وصول المشرف عند المغادرة أو السحب أو انتهاء المجموعة أو سحب تعيينه أو فقد شروط الوصول. إعادة الانضمام أو الموافقة أو تعيين المشرف تبدأ نافذة جديدة ولا تعيد التاريخ السابق. المغادرة أو السحب لا يحذفان سجلاتك ولا يلغيان وحدهما اختبارًا سبق إسناده إليك؛ تبقى صلاحيات مالك الموقع وفق شروط الاستخدام.

لا يغيّر هذا التحديث سياسة الاحتفاظ: يعلن المالك نهاية التجربة بعد اكتمال المشاركات ومراجعتها عبر الموقع أو البريد، وتحذف البيانات المرتبطة بالمشاركين خلال ستة أشهر من الإعلان؛ قد تبقى إحصاءات وملخصات عامة لا تحدد الهوية. عند طلب حذف حسابك والتحقق من ملكيته يبدأ تعطيله فورًا ويكتمل الحذف ضمن نافذة الثلاثين يومًا القائمة. إذا كنت مشرفًا أو مؤلفًا، تُنقل مسؤولية إدارة المحتوى اللازم إلى المالك ويكتمل محو بياناتك خلال النافذة نفسها، مع احترام الإسناد والترخيص، دون نسب تأليفك للمالك أو حجب الحذف لأجل غير محدد. لا يمدد انتقال الإدارة احتفاظ نتائج الطلاب.

## EN — text for approval

A group supervisor is a person appointed by the site owner to supervise their group, with an approved account and an active appointment. Appointment does not give them the site owner's powers: they cannot approve, suspend or delete accounts, or see all practice records or survey answers. Only the site owner can read survey answers.

If you choose to join a group, we show the sharing policy before you submit a request and require your explicit personal agreement through an initially unchecked box. Entering a group code creates a pending request; it does not itself give the supervisor access. Neither the owner nor a supervisor accepts the Terms of Use or sharing on your behalf.

After the group supervisor approves your request, and while your membership, consent, their appointment and the group remain active, they can see practice attempts saved since you joined within the sharing window, and your exam results assigned to you within this group. The practice window starts at the latest of joining, group start, supervisor appointment and sharing acceptance, using the server's recording time; it excludes earlier practice history. Exam results are limited to group assignments and attempts started within the window; hidden or expired results stay hidden. Sharing does not give access to another supervisor's exams.

From Account you can leave the group or withdraw sharing consent. The supervisor's access stops when you leave, withdraw, the group ends, their appointment is revoked or access conditions cease to hold. Rejoining, consenting again or reappointing the supervisor starts a new window and does not restore earlier history. Leaving or withdrawing does not itself delete your records or cancel an exam already assigned to you; the site owner's access remains governed by the Terms of Use.

This update does not change retention: the owner announces the end of the trial through the site or email after participation and review are complete, and participant-linked data is deleted within six months of that announcement; general statistics and summaries that do not identify anyone may remain. Once an account deletion request and ownership are verified, disabling starts immediately and deletion completes within the existing 30-day window. For a supervisor or author, management of necessary retained content transfers to the owner and personal-data erasure completes within the same window, respecting attribution and licensing, without crediting the owner as its author or blocking deletion indefinitely. Management transfer does not extend retention of students' results.

## حدود التطبيق

الفقرة عن نتائج الاختبارات تشرح السياسة المعتمدة؛ مسار P1 يعرض التدريب فقط، ولا يفعّل P2 أو نشر الامتحانات. تنفيذ نقل الإدارة غير موجود؛ [فجوة D3](RAD-085_D3_SQL_GAP.md) مانع قبل تعيين أي مشرف حقيقي. لا تغيير في نافذة C2 أو موعد finalise؛ تُراجع تسوية حد الثلاثين يومًا قبل التشغيل، كما يحدد مستند الفجوة.
