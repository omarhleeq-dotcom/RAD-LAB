# RAD-062 — مرحلة 4ج، 2026-11-01

## 1 — الانحرافات والميزانية

UI فقط وفق [التصميم المعتمد](DECISIONS.md#rad062-4c-owner-2026-11-01)، في فرع `rad062/4c-authoring-ux` ومسودة PR واحدة؛ لا ready أو merge.
الميزانية النهائية 18 ملفًا من سقف المالك 30؛ لا انحراف نطاق أو تبعية جديدة. تجاوز 30 يستلزم STOP وتقسيمًا معتمدًا.
القائمة الدقيقة، وتشمل الالتزام التوثيقي الأول:

1. `docs/project-status.md`
2. `docs/HANDOFF.md`
3. `docs/DECISIONS.md`
4. `docs/RAD-062_PHASE4C_REPORT_2026-11-01.md`
5. `messages/en.json`
6. `messages/ar.json`
7. `scripts/pages/frontend-schema.json`
8. `src/features/supervisor/P1Session.tsx`
9. `src/features/assess/AssessPanel.tsx`
10. `src/features/assess/AuthoringEntry.tsx`
11. `src/features/assess/QuestionImport.tsx`
12. `src/features/assess/AuthoringFlow.tsx`
13. `src/features/assess/authoring-visibility.test.ts`
14. `src/features/assess/authoring-v2.test.ts`
15. `src/features/assess/authoring-audit.mjs`
16. `src/features/authoring-review/AuthoringView.tsx`
17. `src/features/authoring-review/Session.tsx`
18. `src/features/assess/QuestionPreview.tsx`

## 2 — المنجز والمتروك

B1 أولًا: التعيين المؤكد يبقى أثناء إعادة الفحص الخلفي؛ السحب/الانتهاء المؤكد يخفي التأليف، والخطأ العابر لا يمسح المسودة.
قواعد إخفاء P1View والمراجعة لم تتغير. زر ملف EN/AR قابل للتشغيل باللوحة وبهدف 44px، ومدخل المتصفح الأصلي مخفي.
المالك يرى رسالة المشرفين دون بدء مهايئ التأليف؛ زر Add questions في أعلى Assess يفتح `?author=1` بنقرة واحدة.
المجموعة الوحيدة تُختار تلقائيًا فقط إن كانت الصفحة كاملة؛ غير ذلك قائمة محدودة ذات صفحات، ثم ثلاثة أزرار طريقة وقالب CSV محلي.
المعاينة تلخص الجاهز والأخطاء، وتقدم صفوف الخطأ مع رقم المصدر وإصلاح داخلي واستبعاد صريح؛ لا حفظ جزئي.
الحفظ خطوة مستقلة: K افتراضيه N، والقيمة التي يحددها المستخدم تبقى عند تغير N، مع منع K>N؛ الخلط الافتراضي واستثناء السؤال باقيان.
المصدر والرخصة والمساعدة مطوية؛ معاينة الطالب والتخلص من التعديلات في More؛ التنقل ومعاينة الطالب يحفظان الحالة المحلية.
تبقى شاشة المراجعة/التصحيح 5ب والصور والقرب والناشر وأي SQL أو يوم قاعدة خارج العمل؛ البوابة مغلقة.

## 3 — لكل مهمة ودليل الهاتف الجزئي

RAD-062 تبقى in_progress/waiting_on owner؛ [#190](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/190) مدمجة و4ب مفتوحة.
الالتزام الأول وثّق إفادة المالك بتاريخ 2026-11-01: وصل للتأليف بعد إنشاء حساب ثانٍ واعتماده وتعيينه مشرفًا وإنشاء مجموعة به.
حساب المالك لا يستطيع التأليف لأن الخادم يشترط مشرفًا مشاركًا معيّنًا؛ اختيار الملف أعاد الشاشة ولم يستورد الملف.
وجد الوصول صعبًا والتدفق معقدًا؛ لم يكمل اللصق ورفض errors CSV وK>N على الهاتف. هذا دليل جزئي لا نجاح.
لم تُحدّث أي مهمة أخرى أو تُنشأ completion_evidence لإنجاز غير مغلق؛ شرط الإغلاق الموسع في البند 8.

## 4 — المشترك وScale والتفصيل المرتبط

[التدفق](../src/features/assess/AuthoringFlow.tsx) محلي؛ [validator](../src/features/assess/import-validator.ts) ومهايئ SQL وعقد v2 لم تتغير بايتاتها.
تجهيز الصفوف في المتصفح لا يحفظها؛ الحفظ الوحيد يعيد التحقق من كامل الوثيقة الحالية قبل RPC واحد، بلا حفظ/تقسيم جزئي خفي.
ذاكرة 11(C) معزولة للمستخدم وقابلة للتحرير؛ قيم المصدر المعدلة في الحفظ تظهر عند الرجوع للمعاينة ولا تعاد الكتابة فوقها.
التفصيل: [اختبارات الرؤية](../src/features/assess/authoring-visibility.test.ts)، [اختبارات الاستيراد](../src/features/assess/authoring-v2.test.ts)، [تدقيق قابل للإعادة](../src/features/assess/authoring-audit.mjs).
حدود 1 MB و200 سؤال و50 خيارًا و64 KiB وفك الضغط باقية؛ رفعها يحتاج قياسًا وقرار سياسة مستقلًا، لا اقتطاعًا آليًا.
manifest تغير في ثلاث بصمات قائمة فقط؛ لا entry جديد ولا تغيير guard أو migration/check أو عقد أو attestation:

| المفتاح | old → new sha256 | السبب |
|---|---|---|
| `browserBoundaries.src/features/assess/AssessPanel.tsx` | `9ba01eadb41b33adecdfa725ab32f60e74b8efdd342b1792b5e0b064e6ae2e7e` → `40a67e1871cfa1a5cedd604e1e218a92aea47ab23f72220866ee950b501023a8` | رابط التأليف الأعلى واختيار العرض |
| `browserBoundaries.src/features/assess/AuthoringEntry.tsx` | `991f8b2600f19a100d71ed0ed6ae0d93161bed9285394a0e7d982fa0c41e6d24` → `fc774e2ca76500d81235597b4867265c70d41bbebc57da0daef84853c245d9a7` | رسالة المالك واختيار المجموعة الوحيدة |
| `guardedFeatures.supervisorP1.consumer.sha256` | `226670907b7ca28fbc16c32688e93362149dc6762a5ada30a22a1b9a8fc92609` → `fb376c4793df7615da9bda5ee608b09c6509d301dbdf8f864f649b25ef2d53ae` | B1 فقط: إبقاء التعيين أثناء إعادة الفحص |

## 5 — الطبي والدرجات وسؤالا AGENTS

لا تغيير طبي أو درجات أو اختيار خادمي أو equal points أو auto-author أو Reference/Licence؛ لا مستخدمين حقيقيين أو SQL حي.
هل تغير الحكم؟ لا؛ عرض أبسط تحت [قرارات المرحلة 1](DECISIONS.md#assess-phase1-owner-2026-10-29) و[الحوض](DECISIONS.md#random-question-pool-owner-2026-10-30) و[11(C)](DECISIONS.md#rad062-phase2-owner-2026-10-29).
هل بقي رابط الدليل الأصلي؟ نعم؛ الروابط السابقة و[تقرير 4ب](RAD-062_PHASE4B_REPORT_2026-11-01.md) محفوظة؛ لم تُختصر قاعدة أو تُرفع شروط تشغيل.

## 6 — QA وحدود الدليل

متابعة مراجعة المالك: رفض البطاقات الطويلة؛ [المعاينة الجديدة](../src/features/assess/QuestionPreview.tsx) جدول عند ≥768px وقائمة من سطرين تحتها، بعشرة صفوف للصفحة.
كل صف يعرض ✓ والحرف ونص الإجابة؛ التفاصيل تعرض السؤال وكل الخيارات والنقاط والمرجع. الأخطاء أولًا وموسعة بعلامة ⚠ وحد أحمر ونص، والجاهز له ⋯ ثم تعديل/استبعاد فقط.
Next بجوار الملخص وفي تذييل ثابت للهاتف؛ الترقيم وحالة التحرير محفوظان في الرجوع والتبديل؛ لا تغيير للتحقق أو عقد الحفظ.
- Verified: متابعة الخطوة 3 — 60 اختبارًا في 13 ملفًا، تشمل 200 صف/20 صفحة واستمرار الصفحة بعد visibilitychange والحراس دون تعديل.
- Verified: معدلات اختبار الاستيراد السابقة تغيرت في محددات البنية فقط: عدد صفوف الجدول بدل fieldsets، وفتح التفاصيل قبل قراءة حقول الجاهز؛ توقعات الحفظ ومنع التكرار محفوظة.
- Verified: صور الخطوة 3 الجديدة في `/tmp/rad062-4c-after-{locale}-{width}-3-preview.jpg`: جدول بأربع أعمدة عند 1440، وقائمة ذات سطرين عند 390 مع ✓ و⋯ وNext أعلى وتذييل ثابت؛ بديل البطاقات المرفوضة.
- Verified: صور التفاصيل `3-expanded.jpg` تعرض الخيارات كاملة مع ✓ داخل صف الحاسوب أو نافذة سفلية للهاتف؛ النص الإنجليزي LTR داخل التخطيط العربي RTL. فحص axe يشمل التفاصيل.
- Not run (env): اكتمال TypeScript في المتابعة؛ أخطاء AppRoutes المتولدة نفسها أدناه، دون أخطاء في ملفات المعاينة.


- Verified: اختبارات B1 أعادت إنتاج فقد الملف والمسودة قبل الإصلاح؛ بعدها نجاح الملف أثناء فحص معلق، والمسودة والمعاينة، والخطأ العابر، والسحب والانتهاء.
- Verified (الدفعة الأصلية): 121 اختبارًا في 24 ملفًا، تشمل حراس displayed-text وsession-account وschema gate واختبارات إخفاء المراجعة دون تعديلها.
- Verified: الاختبار القديم الوحيد المعدل `shows every source row and error, blocks partial append, and permits an explicit exclusion`؛ تغير محدد checkbox إلى أول صف لأن الأخطاء أولًا؛ توقعاته نفسها.
- Verified: سيناريوهات `authoring-audit.mjs` انتقلت إلى Method/Next/Fix/More؛ بقيت توقعات v2 واللصق الذري وmetadata وXLSX/CSV وK>N والنقاط والاستبعاد ورفض xls/xlsm وعدم إدخال Author، مع تغطية جديدة.
- Verified: اختبارا المجموعة الوحيدة/المتعددة والصفحات، وتزامن المصدر عند الرجوع وعدم تكرار الدفعة؛ لا تغيير توقع اختبار غير UI.
- Verified: 196 تحقق متصفح و28 axe audit، EN/AR ×390/1440، للمدخل والمجموعات والطريقة والمعاينة والحفظ والمالك؛ لا تجاوز عرض أو مخالفات أو أخطاء متصفح.
- Verified: تنزيل القالب بعناوينه الحرفية وصف واحد؛ XLSX من 20 صفًا ثم حفظ واحد، لصق 3، errors CSV بلا حفظ، K>N وequal points، الرجوع والتبديل، وزر الملف باللوحة والسحب بالحاسوب.
- Verified: تدقيق محلي بمكونات Assess/Entry/Scope/Form/Session/Adapter الفعلية وCSS الفعلي؛ الحساب والنقل اصطناعيان، بلا اتصال مزود أو ملف مرفوع خارجيًا.
- Verified: lint العام بلا أخطاء وله تحذيران سابقان في simulator-layout-audit؛ lint ملفات الدفعة بلا تحذيرات.
- Verified: docs:sync مرتان وثبات الثانية؛ docs:check وstatus:check --require-previous وgit diff --check؛ لا مساس بمهام أخرى أو ملفات محمية أو بنية manifest.
- Verified: marker مطبوع قبل وبعد ومطابق: `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`.
- Verified: صور قبل من مصادر origin/main وCSS نفسه في `/tmp/rad062-4c-before-{locale}-{width}.jpg`؛ نموذج طويل يجمع السياسات واللصق والملف وقواعد الحوض دفعة واحدة.
- Verified: صور بعد في `/tmp/rad062-4c-after-{locale}-{width}-{step}.jpg`؛ مدخل أعلى، ثلاثة أزرار، صفوف موجزة، حفظ ومصدر مطويان، ورسالة مالك واضحة؛ فُحصت صور AR390 وEN1440 بصريًا. الصور محلية وغير ملتزمة.
- Inferred: التفويض والإسناد الخادمي والحراسة والنشر باقية لأن الملفات والعقود المحمية مطابقة؛ النقل الاصطناعي لا يثبت قاعدة حية أو سلوك منتقي نظام الهاتف الفعلي.
- Not run (env): npm run check؛ توقف typegen قبل tsc/lint/test عند `ERR_SWC_NATIVE_CACHE` و`Cannot find module './swc.linux-x64-gnu.node'`؛ الاختبارات وlint أعلاه منفصلان.
- Not run (env): npm run build وnpm run build:pages؛ الخطأ نفسه عند تحميل next.config.ts قبل بدء بناء التطبيق؛ فحص مسارات التطبيق المبني متروك للمراجع.
- Not run (env): اكتمال npx tsc --noEmit؛ أنواع المسارات المتولدة متقادمة: `Type '"/[locale]/assess"' does not satisfy the constraint 'AppRoutes'` و`Property 'locale' does not exist on type 'unknown'`؛ لم تُعدّل أو تُتخطّ.
- Not run (env): اختبارا PostgreSQL في sharing-policy: `real PostgreSQL self consent…` و`approved initializer matches…` توقفا في setup عند `Cannot find module 'pg'` من `/tmp/radlab-ops-postgres/package.json`؛ لم تُضعف الاختبارات.
- Not run (pending owner): فحص الهاتف الحقيقي الجديد؛ الفحص المحلي لا يغلق 4ب أو يحل محل CI والمراجع.

## 7 — المفتوح

4ب و4ج تنتظران الدمج وCI والفحص التالي؛ 5ب تحتاج إذنًا مستقلًا. لا قرار جديد مطلوب لتوسيع النطاق، ولا اعتماد لأول امتحان أو O4/حقوق/خصوصية.

<a id="phone-check"></a>
## 8 — قائمة المالك الموحدة والمتابعة

القرارات المعتمدة: استبدال بطاقات الخطوة 3 بجدول/قائمة مضغوطة مع الإجابات والترقيم، وB1 أولًا، رسالة المالك، زر ملف محلي، أربع خطوات، سقف 30، مسودة PR واحدة والبوابة مغلقة؛ لا إعادة طلبها.
شرط إغلاق 4ب+4ج حرفيًا، وتبقى RAD-062 in_progress حتى اكتماله:
PR merged + CI green + owner phone check as supervisor: open Add questions in one tap; download template; upload sample .xlsx 20 rows → preview → save; paste 3 rows → save; errors CSV shows per-row errors and saves nothing; K>N blocked; switch apps mid-preview and return with nothing lost; owner account shows the supervisors-only message.
المتابعة: المراجع يشغّل check والبناءين والفحوص الكاملة؛ المالك ينفذ الشرط أعلاه ثم يسجل الدليل في الدفعة التالية؛ لا ready/merge/5ب ضمن هذا الإذن.
