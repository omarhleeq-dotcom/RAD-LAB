# RAD-062 — شاشة التصحيح الكتابي، 2026-11-02

## 1 — الانحرافات والميزانية

تنفيذ5ب بأمر المالك الحالي بعد تطبيقM09 وترقيتها؛ البوابة مغلقة. لا إغلاقات معلقة لهذه الدفعة؛ تسجيل نافذةM09 للدفعة المتوازية وحدها.
الفرع `rad062/5b-grading-screen`؛ مسودة واحدة، دون ready/merge.18ملفًا من سقف25، بلا وحدة مشتركة خارج Assess:

- `src/features/assess/manual-grading-data.ts`
- `src/features/assess/manual-grading.ts`
- `src/features/assess/ManualGradingPanel.tsx`
- `src/features/assess/ManualGradingEntry.tsx`
- `src/features/assess/manual-grading-availability.ts`
- `src/features/assess/AssessPanel.tsx`
- `src/features/assess/OwnerAssessPanel.tsx`
- `src/features/assess/manual-grading.test.ts`
- `src/features/assess/manual-grading-panel.test.ts`
- `src/features/assess/manual-grading-m09.test.ts`
- `src/features/assess/manual-grading-availability.test.ts`
- `src/features/assess/manual-grading-browser.test.ts`
- `messages/en.json` و`messages/ar.json`
- `scripts/pages/frontend-schema.json`
- `docs/project-status.md` و`docs/HANDOFF.md` وهذا التقرير.

تعديل اسمي اختبارَي panel/m09 إلى`.test.ts` أُعلن قبل إنشائهما ليلتقطهما إعدادVitest القائم؛ لا تغيير له أو أي اختبار سابق.
Verified: تحديث checkout النظيف إلىmain المرقّى قبل التنفيذ؛ قراءة GitHub تثبت دمج#200، لا إثبات منا لـSQL حي أو نافذته.

## 2 — المنجز والمستبعد

قائمة خادمية بلا ترشيح عميل،20صفًا للطلب وحد≤100 في adapter، و«تحميل المزيد» تراكمي. كل بطاقة هدف نقر واحد.
التصحيح دون هوية: لا اسم/بريد/معرف طالب أو مصحح؛ مرجعا المحاولة والتكليف تحت Details مطوية فقط؛ لا ربط بقوائم الأعضاء.
عرض prompt/answer حرفيًا كنص دون HTML/trim/normalization، مع حفظ المسافات والأسطر وعزل اتجاه Unicode والتفاف الكلمات الطويلة.
حفظ النقاط فعل أساسي، والتثبيت منطقة خطر مستقلة بتأكيد؛ بعد النهائي إيصال آمن بالوقت والإصدار وعدد العمليات دون معرف المصحح أو إعادة تصحيح.
لا اقتراح/قرب/تشابه أو صور، ولا موافقة/Terms/CONSENT_VERSION أو طب أو SQL أو dependencies أو gate/publisher/assignmentsEnabled تغيرت.

## 3 — المهمة والحالة

RAD-062 تبقى `in_progress / reviewer`، وشرط5ب: `PR merged + CI green + reviewer audit on synthetic data`؛ التنفيذ المحلي لا يستوفيه.
الدخول عبر Assess للمشرف ذي التعيين القائم أو المالك المعتمد، وعبر لوحة Assess للمالك؛ session account مشتركة، لاuseAccount جديدة.
الخادم يعيد التفويض في كلRPC؛ لا يعد إظهار الرابط دليل وصول لكل محاولة. الإتاحة تتبع حزمةRAD062 المرقاة وM09 المطلوبة فيmanifest.
درجات المالك تتطلب إقرارًا صريحًا وتستخدم`owner-takeover`؛ الخادم يقرر المسار الأصلي/الإنقاذ ويمنع الإنقاذ عند عودة سلطة المشرف.
يُعرض موعد`finalizeBefore` وتوقيت عمّان؛ لا تمديد168ساعة أو رفعhold أو افتراضvoid من خطأ وصول.

## 4 — العقود المشتركة وScale

adapter متصفح واحد يستدعي queue/read/score/finalize/receipt فقط بحساب الجلسة؛ لاmanual_authorize أو worker key أو كودNode في الحزمة.
عقود النوع فقط منserver-manual-contracts؛ نموذج الحالة بلاReact، وأخطاء42501/40001/22023/54000 mapped إلىdenied/conflict/invalid/limit؛ الباقيunavailable.
النقاط نصوص عشرية، والمقارنة بـBigInt micro-points حتى6منازل دون تقريب؛ الحد100عملية خادمي والتثبيت مستقل عنه.
تعارض الإصدار يعيد القراءة ويعرض الإصدار الحالي؛55000 لا يعني نهائيًا إلا عند وجود إيصال مفوض.
ACK غير المؤكد يبقي المعرف والمضمون نفسيهما في ذاكرة الشاشة؛ replay لا يولد معرفًا جديدًا، ويُمنع التعديل حتى الحسم.
الخروج/تبديل الحساب/الرفض يمسح الشاشة؛ إخفاء الصفحة يمسح النصوص والدرجات المرئية، ويحتفظ فقط بالعملية المعلقة في الذاكرة حتى القراءة المفوضة/الحسم.
لاlocalStorage/sessionStorage للأجوبة أو النقاط. انتهاء نافذة الشاشة يمسح البيانات؛ لا اشتراك/polling أو وعد سحب نسخة نُزلت سابقًا.
رفع100عملية/10كتابيات/4000code points/100صف أو إضافة أسماء يحتاج قرارًا وعقدًا منفصلين، لا تجاوزًا في العميل.
manifest: فقطboundary جديدة وبصمتاAssessPanel/OwnerAssessPanel؛ required/deferred/checks/guardedFeatures ثابتة.

## 5 — الطبي والدرجات وسؤالا AGENTS

لا احتساب آلي جديد أو تغيير طبي؛ [قواعد1/2/4/5](DECISIONS.md#rad062-phase2-owner-2026-10-29) و[تصميم التفويض](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md) ثابتة.
هل تغير الحكم؟ لا؛ التنفيذ يطبق [الاختيارات1–9 و5=A](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02)، ولا يختصر قاعدة تغير معناها.
هل بقي رابط الدليل الأصلي؟ نعم؛ [نمط4د](RAD-062_PHASE4D_REPORT_2026-11-01.md) و[قرارات المرحلة1](DECISIONS.md#assess-phase1-owner-2026-10-29) باقية.

## 6 — QA وحدود الإثبات

Verified: الاختبارات الاصطناعية ونقل الأخطاء والإتاحة والـDOM باللغتين، بما فيها غياب الهوية/UUID في العرض الرئيسي وحرفيةUnicode والمسافات.
Verified: M09 isolated PostgreSQL18:3اختبارات جديدة ناجحة تشمل شاشة كاملة،100عملية+finalize،ACK مفقود بعدCOMMIT/replay،المشرف الآخر/الطالب/إنقاذ المالك.
Not run (env): الصورةSupabase17.11/ICU المثبتة؛ pull انتهى`failed to register layer: no space left on device`؛ fixture ترفض`No such image`، دون تخفيف توقع/مهلة أو حذف حالة.
Verified: Chromium الحقيقي بمكوّن الشاشة الفعلي ونقل اصطناعي وCSS التطبيق؛ EN/AR×390/1440×قراءة/تأكيد/إيصال:12حالة،0overflow و0axe WCAG2/2.1 A/AA و0page errors.
Inferred: فصل تدقيق المكوّن عن shell/auth الحي؛ اختبارentry المحلي يثبت شرط الدور والإبطال، ولا يثبت جلسة مزوّد منشورة أو مراجعة بشرية.
Verified:13اختبارًا جديدًا غيرSQL ناجحة؛ [النموذج والنقل](../src/features/assess/manual-grading.test.ts)، [العرضEN/AR](../src/features/assess/manual-grading-panel.test.ts)، [إبطال الدخول](../src/features/assess/manual-grading-browser.test.ts)، و[الإتاحة](../src/features/assess/manual-grading-availability.test.ts).
Verified: [اختبار الشاشة علىM09](../src/features/assess/manual-grading-m09.test.ts) يمر فيembedded؛ نمطsupabase17 باقٍ مطلوبًا دونskip في المصدر.
Verified: حراسschema وsupervisor-review والخصوصية ناجحة؛ displayed-text وsession-account ناجحان بعد تصحيح النص الجديد واختبار جديد، دون تغيير الحراس. انظر تفصيلالجولات أدناه.
Verified: typecheck وlint كاملان، مع تحذيرين سابقين فيsimulator-layout-audit فقط؛ build وbuild:pages ناجحان بلا إعداد حسابات/مزوّد حي، ولا نشر.
Verified: docs:sync مرتان والثانية0تغيير، docs:check0أخطاء/6تحذيرات سابقة، status:check --require-previous وgit diff --check ناجحة.
Verified: شُغّلnpm run check كاملًا:3305ناجحة/64فاشلة من3369؛63فشلsetup للصورة، وواحد لنصexpiry قبل تصحيحه؛ guard النص المصحح ناجح بتشغيل جديد. ليستcheck خضراء.
Not run (env): إثبات63حالةSupabase17.11/ICU في4ملفات؛ الخطأ`No such image` بعد فشلpull بالمساحة؛4afterAll hooks ترجع رفضsetup نفسه.
Verified: اختبارowner-dashboard-deferred-schema الأول مرّ ثم بلغ5000ms تحت الحمل؛ أُعيد وحده دون تغيير المهلة/التوقع، مع حارسيالنص/الحساب بعد انتهاءالجولة.
Verified:18ملفًا فقط؛ اختبارات الماضي وsupabase وحزمتاالهاتف والبيانات/goldens/characterisation وpackage/lock وملفاتCI ثابتة البايتات مقابلmain.
Verified: marker قبل التنفيذ `pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`؛ إعادة الطباعة مطابقة بعدboundary.
Not run (pending owner): التصحيح الهاتفي الحي ينتظر محاولات حقيقية بعد فتح البوابة؛ التدقيق الاصطناعي لا يغلقه.

## 7 — المفتوح وحدود الاستئناف

CI ومراجعة البيانات الاصطناعية والدمج لم تُستوفَ بعد؛ لا إعلانdone. البوابة مغلقة وشروط التشغيل المستقلة باقية.
صورةPG17.11/ICU تحتاج بيئة المراجع ذات مساحة كافية؛ لا بديلPG18 لإثباتها. #196/#197 تبقيان مفتوحتين دون تعديل اعتماديات.
إفصاحP2 شرط فتح البوابة، وليس مانع دمج5ب بأمر المالك الحالي؛ لا تغيير نص أو نسخة موافقة هنا.

## 8 — قائمة المالك الموحدة والمتابعة

1. مراجعة المسودة وCI والتدقيق الاصطناعي؛ الدمج للمالك وحده. بعد فتح البوابة ووجود محاولات حقيقية: فحص هاتف التصحيح للمشرف والمالك.
2. اعتماد إفصاحEN/AR ونسخة الموافقة وربط قبول الذات في دفعة مستقلة قبل فتح البوابة، بناءً على [P2](RAD-085_OPEN_REVIEWS_2026-11-02.md).
   EN proposed: “Your group's supervisor grades your written answers. If that supervisor can no longer grade them, an authorised owner may rescue the attempt. Grading must be finalized within 168 hours of submission; unfinished attempts are voided without a mark and may disappear. Free-text answers may identify you. Withdrawing group sharing or leaving the group stops supervisor access on the next authorised request; an authorised owner may still settle the attempt under the applicable owner route. Withdrawal does not undo a final result or delete copies already read; erasure follows the separate deletion policy.”
   AR مقترح: «يصحح مشرف مجموعتك أجوبتك الكتابية. إذا تعذر عليه التصحيح، فقد يتولى مالك مفوض إنقاذ المحاولة. يجب تثبيت التصحيح خلال168ساعة من التسليم؛ تُلغى المحاولات غير المثبتة دون علامة وقد تختفي. قد تكشف الأجوبة الحرة هويتك. سحب مشاركة المجموعة أو مغادرتها يوقف وصول المشرف عند الطلب المفوض التالي؛ وقد يبقى للمالك المفوض تسوية المحاولة ضمن مسار المالك المسموح. لا يلغي السحب نتيجة نهائية ولا يحذف نسخًا قُرئت بالفعل؛ يتبع المحو سياسة الحذف المنفصلة».
3. لا إعادة سؤال عنBLIND أوowner-takeover أو168h؛ الأحكام معتمدة. لا إذن تشغيل/Variable/SQL حي أو إغلاق نافذةM09 ضمن هذه الدفعة.

نص المتابعة: «راجع شاشة5ب واختباراتها على بيانات اصطناعية، وأكملPG17.11/ICU والفحوص المحجوبة على الرأس نفسه؛ أبقِDraft والبوابة مغلقة».
