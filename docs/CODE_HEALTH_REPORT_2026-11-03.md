# RAD-094 — Code Health بعد استئناف #216

## 1. الانحراف والميزانية

Verified: رُفع STOP بقراري المالك المؤرخين2026-11-03 في [DECISIONS](DECISIONS.md#code-health-pins-owner-2026-11-03) و[وحدة الحجم](DECISIONS.md#code-health-size-owner-2026-11-03).
Verified: دمج main بـmerge commit دون rebase/force؛ حُفظ محتوى main في HANDOFF/project-status وأعيدت أسطر RAD-094 فقط.
الميزانية22/25 ملفًا مقابل main؛ ثلاثة modules مشتركة للأدوات: checker وlayer resolver وhelper QA؛ صفر وحدات منتج مشتركة معدلة.
حُفظ [baseline الأصلي](CODE_HEALTH_BASELINE_2026-11-03.json) دون تغيير أرقامه؛ حقل resume يضم القياس بعد الدمج ونتيجة الرأس.
حد jscpd الافتراضي1000سطر/100kb محفوظ لمقارنة النسبة؛ مسح ثانٍ موسع يمنع إخفاء clone طويل في ملف أكبر.

## 2. المنجز والمتروك

- Verified: jscpd4.0.5 وKnip6.44.1 مثبتتان devDependencies وlock؛ لم يتغير إصدار أي حزمة سابقة.
- Verified: بوابات CI للمصدر في unit، والأحجام بعد build:pages؛ check الجامع يبقى معتمدًا على الوظائف الأربع دون تخفيف.
- Verified: حذف ExternalSurveyCard.tsx غير المركبة بعد إثبات غياب importer؛ لا حذف feature حية.
- Verified: توحيد axe/overflow في hand/wrist/elbow فقط؛ [خريطة المزايا](FEATURE_MAP.md) وReuse check في task template.
- المتروك: بقية تدقيقات العائلات والخادم/السيناريوهات تختلف؛ لا دمج لها دون إثبات تطابق مستقل. الصور الحالية للقياس فقط.

## 3. النتائج لكل مهمة

### الازدواج وحدود الطبقات

| القياس Verified | النتيجة |
|---|---|
| baseline الأصلي | 2.99%؛1503/50246؛63 clone |
| الرأس المدموج قبل التنظيف | 2.98%؛1499/50324؛63 clone |
| الرأس النهائي | 2.94%؛1484/50453؛64 clone |
| السقف الثابت | ≤3.49%؛ لم يُرفع baseline |
| clone جديد≥30سطرًا | صفر خارج السماح المبرر بالمحتوى وزوج الملفات وعدد التكرارات |
| حدود الطبقات | صفر؛ traversal متعدٍّ من domain/evaluation/scoring عبر resolver TypeScript |

Verified: السماح في `scripts/code-health/policy.json` يربط hash fragment وزوج الملفات وcount؛ ليس سماح ملف أو مجلد.
استثناءا إعادة تقطيع clones للأطراف بعد استخراج helper مبرران بإعادة توسيع السكربتات بايتًا إلى main، لا بمجرد تشابه ظاهري.
Verified: domain لا يستورد طبقة أعلى؛ المسار النقي يرفض React/Next/Zustand وTSX/store/DOM، حتى عبر helper وسيط.
مكونات ResultPanel/ResultImage/ResultDisclosure القائمة مستهلكات عرض محددة؛ أي TSX جديد في المسار النقي يفشل.
Inferred: هذا حارس بنيوي؛ مراجعة المعنى تبقى ضرورية لمنع نسخ معادلة داخل React لا يثبتها import graph.

### Knip والكود الميت المعلن

Verified: صفر ملفات/صادرات/dependencies غير مستخدمة خارج الاستثناءات المراجعة المحددة في policy و[شرح الإعداد](FEATURE_MAP.md).
لا استثناء ملف/دليل/pattern. نقاط دخول CLI/framework/test/esbuild الفعلية صريحة؛ لا إدخال تلقائي لأي سكربت جديد.
الرموز المستخدمة داخل ملفها حية وفق `ignoreExportsUsedInFile`؛ صادرات entry هي API المكتبة/CLI. هذا حد التحليل المعلن.
الصادرات/الأنواع التالية غير مستخدمة خارجيًا ومحتفظ بها عمدًا، وليست إزالة كود ميت مزعومة:

| الملف والرموز | السبب وشرط رفع الاستثناء |
|---|---|
| pilot/owner-data.ts: ATTEMPT_COLUMNS، NOTE_COLUMNS | **pinned browser boundary; remove with the next authorised pin change**؛ الرمزان فقط |
| wrist-model/wrist-model.ts: PA_FOREARM | ثابت هندسي ميت؛ حُفظت بايتات النموذج؛ يُزال في تغيير نموذج مأذون |
| data/exams/xray/elbow-geometry.ts: ELBOW_CM_PER_PX | re-export هندسي؛ تنظيف geometry مستقل مأذون |
| assess/server-rad085-contracts.ts: RAD085_PUBLIC_RPCS، DraftReceipt، AssignmentReviewReceipt | API/DTO قائم؛ تغيير عقد مأذون لاحق |
| assess/server-contracts.ts: AssignmentSnapshot، AttemptSnapshot | DTO غير مستخدم؛ عقد Assess المحمي محفوظ |
| assess/contracts-v2.ts: AttemptStateV2 | DTO بإصدار؛ تنظيف العقد لاحقًا |
| positioning/foot-outline-drawing.ts وwrist-outline-drawing.ts: Pt | نوع مصدّر فقط؛ تنظيف types مستقل يحفظ الرسم |
| pilot/survey.ts: SURVEY_URL | binding ميت بعد حذف البطاقة؛ helpers الحالية محفوظة؛ تنظيف survey مستقل |
| scripts/assess/rad085-production-shape.mjs: productionApplicationSql | إسقاط fixture قائم؛ محفوظ مع كود المعايرة؛ تنظيف fixture مستقل |
| scripts/library-graphics/build-library-graphics.mjs: ids | export من أداة الرسم؛ لا تعديل مصدر الرسوم هنا |

Verified: استثناء dependency jscpd محدد بالاسم: يستدعيه checker بمسار binary مركب لا يحله Knip؛ ليس كودًا ميتًا.
استثناءات الأدوات اليدوية وpayload الخارجي وimports المولدة وbinaries مفسرة في FEATURE_MAP؛ لا unused dependency جديدة مقبولة ضمنيًا.

### أحجام الصفحات والصور

Verified: الوحدة KiB=1024بايت؛ gzip.compress(level9,mtime0) لملفات JS+CSS الفريدة المرتبطة بـHTML، بما فيها preload.
92صفحة HTML؛ القيم التالية مشتركة بين EN/AR، وكل مسارات practice مفحوصة؛ القياس النهائي مطابق لما بعد الدمج.

| الصفحة | gzip bytes Verified | السقف KiB |
|---|---:|---:|
| home | 386608 | 400 |
| training | 387796 | 400 |
| supervisor | 312784 | 400 |
| account | 320268 | 400 |
| practice | 485998 | 500 |
| owner | 485836 | 500 |
| assess | 403532 | 500 |

لا يحسب المنهج lazy chunks الغائبة عن HTML أوRSC/fonts/images؛ لا مساواة مع ميزانية JS وحده أو كل تحميل تفاعلي.
Verified: لا صور جديدة؛ أي إضافة جديدة≤512000بايت؛ الصور القائمة لا تفشل بأثر رجعي.
الصور القائمة فوق السقف: pelvis2686371،shoulder1105329،foot596434بايت؛ لا تغيير لها أو ادعاء توفير.

## 4. المشترك وScale

Verified: helper page-checks يحفظ النص الأصلي وترتيب الاستدعاء والفشل؛ ثلاث إعادات توسيع byte-identical إلى main.
Verified: trace مزدوج للنجاح والفشل يقارن callbacks والمخرجات واستدعاءات evaluate قبل/بعد؛ CLI وscreenshots ومساراتها مطابقة بنيويًا.
Inferred: توسعة عائلات أخرى تحتاج البرهان نفسه؛ لا تعميم طبي أو إعدادات امتحان في helper.
Scale: budgets مصدر السقوف؛ الاستثناءات رمزية أو بصمة clone محدودة، ورفعها مشروط بتغيير مأذون في الجدول، لا إهمال كامل لميزة.
مسح clones الموسع له حد موارد1000000سطر/100mb؛ رفعه يحتاج تحديث الأداة مع شاهد رفض جديد، وليس استثناء مصدر صامتًا.

## 5. الطب وscoring والصور

Verified: كل src/supabase/public/scripts-pages وgoldens/scene-dom مطابق بايتًا للرأس المدموج عدا حذف البطاقة غير المستخدمة.
Verified: لا تغيير medical/scoring/scenes/images/hash أو manifest أو flags أو SQL؛ لا qa:golden أو qa:characterise.
Verified: print-marker على أصل المشروع العام يعطي البصمة نفسها:
`pilot-v1:3d8b505ca8605f99f226475ced8e7aa1db576a5829c66cc5e6499e1aab4c18b7`.

## 6. QA

- Verified: npm ci؛ typecheck؛ lint بلا أخطاء وتحذيرين قائمين في simulator-layout-audit؛ unit2536/150 بلا skip.
- Verified: build وbuild:pages؛ تجاوز غلاف البيئة لازم لـSWC/child processes؛ لا تعديل إعداد منتج لمعالجة البيئة.
- Verified: health:source وhealth:sizes يمران؛ health:test9/9 بلا skip، بما فيه seeded CLI exits1 للمصدر والأحجام.
- Verified: الرفض يشمل النسبة والـclone الطويل وunused file/export/dependency وReact/TSX/DOM عبر import وسيط وكل سقف صفحة وصورة جديدة.
- Verified: الحد3.49يمر و3.50يفشل؛ كل سقف KiB يمر عند الحد ويفشل+1بايت؛ رمز ثالث أو ملف آخر لا يغطيه استثناء owner-data.
- Verified: HTML assets dedup وgzip مطابقان للمنهج؛ chunk مفقود وpage family غائبة يفشلان.
- Not run: browser/axe حي؛ السكربتات موحدة بإثبات byte-identity وtrace، دون تغيير assertion أو سلوك منتج.
- Not run: DB lane محليًا؛ لا كود DB/مشترك منتج معدل؛ CI المستضاف الكامل مطلوب ولا اختبار مخفف أو متجاوز.
- Verified: docs:check بلا أخطاء؛ status:check --require-previous وgit diff --check؛ docs:sync مرتين والثانية0.
- Verified: npm audit --audit-level=high يمر؛16ملاحظة moderate، ولا إصلاح حزم خارج النطاق.
- Not run: قراءة نتائج CI المستضاف للرأس الجديد قبل رفعه؛ لا يُفترض نجاح خارجي.

## 7. المفتوح

RAD-094 review/reviewer؛ لا completion_evidence أو إغلاق من البناء المحلي وحده. يلزم CI المستضاف ومراجعة Draft ثم دمج مأذون مستقل.
بقيت الصادرات المعلنة بحدودها وشروط رفعها أعلاه؛ لا إعادة بناء أو تغيير طبي لحل تحذير أداة.

## 8. قائمة المالك والمتابعة

- قرارات2026-11-03 مسجلة: الرمزان المثبتان فقط واستثناءهما المبرر؛ KiB والسقوف المحددة؛ الصور القديمة measure-only.
- راجع Draft #216 ونتائج CI والاستثناءات الرمزية وخريطة reuse؛ تبقى قيود العمل الحي والنشر كما هي.
- متابعة: «راجع RAD-094 على رأس #216؛ حافظ على pin والmarker والاختبارات والسقوف؛ عالج فقط فشل CI أو ملاحظة مراجعة محددة».
- هل تغير حكم عند اختصار قاعدة؟ **لا؛ لم تُختصر قاعدة**. هل بقي رابط الدليل الأصلي؟ **نعم؛ الأدلة الأصلية والـbaseline محفوظة**.
