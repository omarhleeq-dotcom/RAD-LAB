# RAD-062 — مرحلة 5ب، 2026-11-02

## 1 — الانحرافات والميزانية

STOP قبل تنفيذ الشاشة: التفويض الخادمي الحالي للمالك وحده يخالف شرط تصحيح المشرف لمجموعاته؛ لا تغيير نطاق مفترض.
ثلاثة ملفات من سقف25، أُعلنت قبل التحرير:

- `docs/project-status.md`
- `docs/HANDOFF.md`
- `docs/RAD-062_PHASE5B_REPORT_2026-11-02.md`

الفرع `rad062/5b-manual-grading`؛ دفعة واحدة Draft فقط، بلا ready أو merge؛ commit الأول توثيق الإغلاقات.

## 2 — المنجز والمتروك

سُجلت إغلاقات المالك أدناه؛ لم تُنشأ شاشة أو browser adapter أو نصوص جديدة، ولم يُخفَ رفض الخادم بعينة اصطناعية.
لا SQL أو RPC أو dependencies أو manifest أو بوابة أو ناشر أو assignmentsEnabled تغيرت؛ الملفات المحمية باقية.
لا اقتراح تصحيح أو قرب/تشابه أو صور؛ لا مستخدمين حقيقيين أو SQL حي.

<a id="closures"></a>
## 3 — لكل مهمة: الإغلاقات أولًا

Verified (GitHub read): #190 و#191 و#193 مدموجة؛ CI وDeploy Pages خضراء على main بإفادة المالك2026-11-02.
Verified (إفادة المالك، main المنشور، مشرف، 2026-11-02): فحص الهاتف7/7 OK:

1. Add questions بنقرة واحدة.
2. sample_20.xlsx: الأسئلة20 جاهزة، بما فيها HU، دون كتابة Reference/Licence.
3. لصق3صفوف نجح.
4. errors CSV مرفوض لكل صف، بلا حفظ جزئي.
5. K>N ممنوع بسبب ظاهر.
6. المجموعات بسيطة، بلا UUID في العرض الرئيسي، والأرشفة في منطقة خطر مستقلة.
7. أداة JSON للمالك تحت Advanced.

هذا يستوفي done_when للمراحل4ب+4ج+4د؛ [دليل PARTIAL2026-11-01](RAD-062_PHASE4D_REPORT_2026-11-01.md#phone-check) باقٍ تاريخًا.
RAD-062 تبقى in_progress؛ شرط5ب: `PR merged + CI green + reviewer audit on synthetic data`.
Verified (GitHub read): #192 و#194 (github-actions) و#195 (npm minor/patch) مدموجة؛ #196 مفتوحة.
Verified (إفادة المالك): إعدادات GitHub فُعّلت، #194/#195 خضراوان ودمجهما المالك، وأول Deploy Pages بالإجراءات المحدثة نجح على main.
RAD-091 أصبحت done؛ [الدليل الأصلي](DEPENDABOT_REPORT_2026-11-01.md) محفوظ.
TypeScript 7 في #196 مؤجل: يكسر استعمال TypeScript JS API في `scripts/pages/pilot-schema-gate.mjs` بإفادة المالك؛ لا إصلاح هنا.
محفز استئنافه: `a dedicated TS7 batch`؛ ليس عائقًا لإغلاق RAD-091.

<a id="stop"></a>
## 4 — العقود المشتركة وScale والعائق

Verified (قراءة المصدر): RPCs الست موجودة؛ `manual_authorize_v1` helper داخلي وليس مدخل متصفح ممنوحًا.
M08 يمنح authenticated تنفيذ queue/read/score/finalize/receipt؛ لا يغيّر شرط المالك داخل الدوال.
[`manual_authorize_v1`](../supabase/migrations/20261030000700_rad062_manual_grading.sql) يستدعي owner_scope_enter_v1 ويفرض public.is_owner، السطور20–33.
`manual_queue_v1` يستدعي owner_scope_enter_v1، السطور38–50؛ التصفية عبر owner_id/assignment_managers وليست عضوية مجموعات المشرف.
[`owner_scope_enter_v1`](../supabase/migrations/20261027000100_assess_management_erasure.sql) يرفض غير المالك بـ42501، السطور416–423.
[`اختبار PostgreSQL الحالي`](../src/features/assess/rad062-manual-grading.test.ts) يثبت رفض المشرف والطالب، السطور69–91.
لا ينجح مدير المحاولة في الاختبار إلا بعد ترقيته إلى owner ثم إضافته إلى assignment_managers؛ هذا ليس تفويض مشرف مجموعة.
Inferred: تحقيق قبول supervisor end-to-end يتطلب عقد تفويض خادمي مراجع؛ UI وحدها لا تستطيع توفيره.
إضافة SQL أو تغيير توقع رفض المشرف شرطان STOP صريحان؛ لذلك توقف التنفيذ قبل بناء UI أو transport يخفي التعارض.
Scale المحفوظ:10كتابيات،4000code points للجواب،100عملية؛ finalize مستقل عن السقف، بلا إعادة تصحيح بعده حتى hidden.
رفع أي حد يحتاج قرارًا وقياسًا مستقلين؛ لا عتبات أو تقسيم أو تطبيع جواب جديد.

## 5 — الطبي والدرجات وسؤالا AGENTS

لا تغيير طبي أو احتساب درجات؛ [قرارات1/2/4/5](DECISIONS.md#rad062-phase2-owner-2026-10-29) باقية.
هل تغير الحكم؟ لا؛ لم تُختصر قاعدة أو تُبدل صلاحية؛ STOP يطبق حد المالك الحالي ولا يجيز schema جديدًا.
هل بقي رابط الدليل الأصلي؟ نعم: [تصميم5ب](archive/reports/2026-10/RAD-062_PHASE2_DESIGN_2026-10-29.md)، و[نمط4د](DECISIONS.md#rad062-4d-owner-2026-11-01).

## 6 — QA وحدود الدليل

Verified: اختبارات server-manual-service السبعة نجحت دون تعديل.
Not run (env):10اختبارات PostgreSQL فشلت عند الإعداد: `Cannot find module 'pg'` من `/tmp/radlab-ops-postgres/package.json`.
Not run (env): اختبار الحزمة/marker داخل الملف نفسه تعطل بـ`spawnSync git EPERM`؛ لا تغيير اختبار أو توقع.
Verified: طُبع marker قبل التحرير: `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`.
Not run (STOP): قبول شاشة اصطناعي/SQL وEN/AR390/1440 وaxe؛ الشاشة غير منفذة بسبب التفويض.
Not run (STOP): check وbuild وbuild:pages؛ هذه دفعة توثيق فقط بعد التوقف، وليست ادعاء تحقق المنتج.
Not run (pending): حراس الخصوصية والمخطط وفحص الوثائق النهائي جارٍ؛ يسجل commit المتابعة النتيجة.
Not run (pending owner): فحص هاتف التصحيح الحي ينتظر محاولات حقيقية بعد فتح البوابة؛ التدقيق الاصطناعي لا يعوضه.
Inferred: نجاح CI/Deploy Pages والإعدادات المذكور أعلاه من إفادة المالك؛ أداة قراءة GitHub تحققت من الدمج فقط، ولم تُتابع workflows.

## 7 — المفتوح ومحفزاته

تفويض المشرف لتصحيح مجموعاته غير متاح بالعقود الحالية؛ الاستئناف بعد قرار المالك أدناه، مع بقاء البوابة مغلقة.
#196 مفتوحة مؤجلة لدفعة TS7 مخصصة؛ متطلبات التشغيل والخصوصية والحقوق المستقلة لم تُغلق بهذه الدفعة.

<a id="owner-next"></a>
## 8 — قائمة قرارات المالك الموحدة ونص المتابعة

1. حسم تعارض التفويض: هل تتغير5ب صراحةً إلى شاشة المالك بالعقود الحالية، أم تُخطط دفعة مستقلة لتفويض المشرف خادميًا؟
2. إذا بقي الهدف للمشرف: يلزم إذن منفصل لتصميم schema/RPC واختباراته قبل التنفيذ؛ لا إذن ضمني ولا SQL حي الآن.
3. أبقِ #196 مؤجلة حتى `a dedicated TS7 batch`؛ لا تتطلب هذه الدفعة قرار ترقيتها.

نص المتابعة: «اقرأ عائق5ب في هذا التقرير وقرار التفويض الجديد؛ أكمل على الفرع والمسودة نفسيهما ضمن سقف25، دون فتح البوابة».
