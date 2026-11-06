# RAD-106 — تدقيق الأداء وخطة أول دفعة، 2026-11-06

## 1. النطاق والميزانية
Verified: مراجعة قراءة فقط عند `1519d28554f02fa2af8e3d4078772b1de9cdc887` من Draft #242، مقارنةً بـmain `009a206623f4b4a394319ee95d93d2fc4167ab14`. تحقق GitHub من الرأس/المسودة، وجُلب المصدر إلى checkout المراجعة القائم.
الميزانية لهذه التهيئة:6 ملفات توثيق فقط؛ لا كود تطبيق أو SQL أو بوابات مخطط متغيرة. التدقيق الأول كان خارج المستودع؛ هذه الدفعة تحفظه مع الإذن والخطة في Draft مستقل. لم يبدأ تنفيذP1 أو أي إجراء حي.
هذه مراجعة مسارات ومكونات وإعدادات ومعايير محددة، وليست ادعاء قراءة كل سطر أو إثبات عدم وجود أي مشكلة أخرى.

## 2. النتيجة والأولويات
Verified من الكود: تكرار أول قراءة directory عند الحالة الافتراضية للمالك، ودفعة نتائج تصل إلى500 محاولة مع طلب ملخص سابق، وتفاوت حدود طلبات المتصفح الصريحة.
Verified: البنية ثابتة على Cloudflare Pages، والاعتماديات الإنتاجية محدودة، والخطوط محلية؛ لا حاجة مثبتة لإضافة Redis أو خادم SSR أو موازن خاص أو AI.
Inferred: تقليل هذه القراءات وفصل الحزم مرشحان لتحسين الأداء؛ مقدار التحسن وزمن فتح الواجهة لم يُقاسا في هذه الجولة. لا نسبة تسريع مختلقة.
قضايا المالك/النتائج/الصور/الخطوط/Workspace المذكورة موجودة أيضًا في main، إذ إن الملفات المشار إليها مطابقة بين main وهذا الرأس. مسارات selfservice وscheduled v2 الجديدة تخص المرشح غير المدموج.

## 3. مصفوفة المعايير الـ31
«مطبق» يصف المصدر أو CI المحدد، ولا يثبت إعداد الاستضافة أو قاعدة الإنتاج الحالية. «غير موجود» لا يعني ضرورة إضافته.

| # | المعيار | الحالة | الدليل والتطبيق المناسب |
|---|---|---|---|
| 1 | Skeleton Loading — هيكل التحميل | جزئي | حالات انتظار ونصوص status وSuspense؛ لا مكوّن Skeleton عام. أضف بدائل ثابتة الأبعاد فقط للشاشات التي يثبت فيها انتظار أو اهتزاز. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/pilot/SessionGate.tsx#L58) |
| 2 | WebP / AVIF — صيغ الصور | غير موجودة؛ مشروطة | المجلد العام يحوي 14 JPEG و3 PNG، بلا WebP/AVIF. صور الأشعة تُفك إلى luminance؛ لا تحويل تلقائي ضياعي. افحص نقلًا lossless وتطابق البكسلات والترخيص قبل تغيير الأصل. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/radiograph/RadiographCanvas.tsx#L26) |
| 3 | Duplicate API Calls — الطلبات المكررة | يحتاج تحسينًا مثبتًا بالكود | OwnerPanel يقرأ directoryPage للتعداد، وOwnerDirectory يقرأ أول صفحة أيضًا؛ المعاملات تتطابق عند القائمة الافتراضية. شارك الطلب المتطابق فقط مع الحفاظ على التعداد العام وعزل الحساب والإبطال. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/pilot/OwnerPanel.tsx#L46) |
| 4 | Debounce — تأخير البحث | غير لازم في البحث الحالي | OwnerDirectory يفصل النص المكتوب عن البحث المرسل ويطلب عند submit؛ بحث المكتبة محلي. لا تؤخر تفاعلًا محليًا أو تضف debounce بلا طلبات لكل حرف. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/pilot/OwnerDirectory.tsx#L20) |
| 5 | Pagination — تقسيم الصفحات | مطبق مع فرصة تحسين | قوائم 20/50 وعقود محدودة وcursor؛ لكن readSavedResults يجلب حتى خمس صفحات ×100 لكل دفعة بعد الملخص. راجع بيانات البطاقات قبل زيادة المكتبات أو تغيير الحدود. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/pilot/saved-results.ts#L5) |
| 6 | CDN — شبكة التوزيع | مهيأ؛ التقديم الحي غير مفحوص | مسار النشر Cloudflare Pages موجود. لا حاجة CDN جديد؛ لم نفحص hit/miss أو الرؤوس على الاستضافة الحالية. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/next.config.ts#L5) |
| 7 | Background Job Queue — طابور الخلفية | مطبق برمجيًا؛ التفعيل منفصل | Assess يستعمل حالات وleases وclaim وSKIP LOCKED وعاملًا مجدولًا؛ إشعارات S2 خارج الواجهة أيضًا. الإصدار الجديد لم يُفعّل؛ لا إضافة Redis/BullMQ بدل العقود القائمة. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/supabase/migrations/20261020000700_assess_lifecycle.sql#L296) |
| 8 | N+1 Queries — استعلام لكل سجل | ليس عنق زجاجة مثبتًا | قوائم RPC مجمعة ومحدودة. history_page_v2 يستدعي result_v2 لكل سجل في صفحة محدودة؛ افحص خطة وحملًا اصطناعيًا قبل تغيير قراءة تطبق حراس الرؤية. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/supabase/migrations/20261105000500_rad105_ui_reads.sql#L26) |
| 9 | Brotli / Gzip — ضغط النقل | القياس موجود؛ التفعيل الحي غير مثبت | CI يحسب gzip لوزن JS+CSS، وهذا ليس إثبات Content-Encoding على Cloudflare. تحقق من النقل الحقيقي لاحقًا؛ لا تضف خادم ضغط لصفحات ثابتة. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/scripts/code-health/pages.py#L1) |
| 10 | Redis Caching — التخزين في Redis | غير مستخدم وغير مبرر حاليًا | واجهة ثابتة وRPC مباشرة إلى Supabase؛ لا طبقة API خاصة تتطلبه. ذاكرة محدودة لطلبات قراءة متزامنة أو أصول ثابتة تكفي للتجارب الأولى، مع إبطال الهوية/الصلاحيات. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/pilot/client.ts#L6) |
| 11 | Unused Dependencies — الاعتماديات غير المستخدمة | مطبق كحارس | health:source يشغل Knip وفحص الطبقات والنسخ مع استثناءات معللة؛ CI النهائي ناجح. لا قائمة اعتماديات جديدة مؤكدة للحذف؛ صادرات الأنواع غير المستعملة لا تعني وحدها تحميل متصفح زائدًا. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/scripts/code-health/check.mjs#L94) |
| 12 | API Timeouts — مهلات الطلبات | جزئي؛ أولوية | مسار v1 له 15 ثانية لكل طلب والعامل له حدود اتصال/SQL. بعض قراءات الحساب والمالك بلا حد صريح؛ S3 يحد تهيئة binding ثم يمسح المؤقت، والطلبات التالية تستخدم signal لعمر المكوّن. تحقق من SDK ثم وحّد deadline مع إلغاء المكوّن، بلا إعادة تلقائية لكتابة ذات ACK مجهول. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/assess/selfservice/SelfServiceSession.tsx#L34) |
| 13 | AI Streaming — بث الذكاء الاصطناعي | غير منطبق | لا مسار AI أو SSE ظاهر في كود المنتج أو الاعتماديات. لا نضيف ذكاءً اصطناعيًا لتحسين سرعة تطبيق لا يستخدمه. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/package.json#L1) |
| 14 | Optimistic UI — الواجهة المتفائلة | انتقائي؛ ليس مطلبًا عامًا | الإعدادات المحلية تتغير فورًا؛ الكتابات الحساسة تنتظر الخادم. لا تعرض نجاح تقديم/تصحيح/صلاحية قبل تأكيده؛ حسن busy/error والقراءات الآمنة أولًا. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/assess/selfservice/SelfServiceSession.tsx#L52) |
| 15 | Lazy Loading — التحميل عند الحاجة | مطبق جزئيًا | Supabase lazy singleton وSelfServiceSession dynamic؛ صور النتيجة تُطلب عند تركيب Canvas. أجزاء أخرى مستوردة مبكرًا؛ افحص مخطط الحزمة ثم افصل ما لا يلزم أول تفاعل. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/assess/OwnerAssessPanel.tsx#L1) |
| 16 | Parallel Requests — الطلبات المتوازية | مطبق في المواضع المستقلة | Management يجلب metadata/capability/permissions بالتوازي؛ OwnerSurveys وauthoring كذلك. صفحات cursor وقراءات تعتمد هوية أو إذنًا لا تُوازى عشوائيًا. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/assess/selfservice/Management.tsx#L18) |
| 17 | Database Indexes — فهارس القاعدة | مطبقة؛ كفايتها تحتاج خططًا | فهارس المستخدم/الوقت/الواجب/الطابور موجودة. لا فهرس جديد أو حذف متشابه دون EXPLAIN وحجم ممثل؛ live plans/statistics لم تُقرأ. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/supabase/migrations/20261020000200_owner_paged_reads.sql#L1) |
| 18 | OpenTelemetry — تتبع موزع | غير مستخدم؛ مؤجل للحاجة | لا SDK للتتبع؛ توجد تقارير عامل منظمة وحراس تشغيل. أولوية القياس الآن واجهة وطلبات؛ تتبع متعدد الخدمات يستلزم حاجة واضحة ومراجعة بيانات/تكلفة. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/assess/server-worker-scheduled-v2.ts#L57) |
| 19 | Server / Database Proximity — قرب العامل والقاعدة | غير متحقق من الإعدادات الحية | دليل العامل يحدد europe-west3؛ سجل المالك السابق أظهر pooler في eu-central-1. هذا ليس قراءة region الحالية أو قياس RTT للمسار المباشر. لا نقل منطقة بناءً على أسماء مضيفين وحدها. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/docs/ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md#L98) |
| 20 | SSR / Static Generation — التوليد الثابت | مطبق | output:export وgenerateStaticParams و94 صفحة HTML في بناء CI. لا تحويل إلى SSR؛ البيانات الخاصة تُجلب بعد حراس الحساب. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/app/[locale]/[modality]/[exam]/practice/page.tsx#L15) |
| 21 | Third-Party Scripts — سكربتات خارجية | مطبق جيدًا كتقليل | لا تحليلات/متتبعات أو next/script خارجية في المنتج؛ خطوط محلية وCSP ذاتي مع استثناء Supabase المحدد. حافظ على ذلك بدل إضافة متتبعات تلقائيًا. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/public/_headers#L1) |
| 22 | Code Splitting — تقسيم الشيفرة | مطبق؛ يحتاج قياسًا أدق | تقسيم Next بالمسارات وdynamic موجود. وزن JS+CSS المرتبط بصفحة Practice نحو497 ألف بايت gzip؛ registries تستورد كل الامتحانات والحالات. افحص مساهمة كل import قبل الفصل، مع ثبات المحتوى والعقود. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/data/exams/index.ts#L1) |
| 23 | Virtualization — عرض الجزء المرئي | غير موجودة؛ ليست أولوية عامة | معظم القوائم صفحات 20/50؛ لا حاجة لمكتبة عرض افتراضي لها. السجل المتراكم والرسوم قد يعرضان عددًا أكبر؛ قس DOM/التفاعل أولًا واحفظ التنقل بلوحة المفاتيح. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/pilot/MyAttempts.tsx#L31) |
| 24 | Required Columns Only — الأعمدة اللازمة | مطبق في عينات المسارات الأساسية | profile وattempts تختار أعمدة محددة وRPC ترجع DTO محدودة. بقيت فرصة تقليل الصفوف قبل الأعمدة في شاشة الملخص؛ SQL داخلي SELECT * لا يساوي تسريب كل الأعمدة للمتصفح. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/pilot/profile-read.ts#L19) |
| 25 | Connection Pooling — تجميع الاتصالات | مطبق في العامل | pg.Pool في الربط؛ scheduled v2 محدود باتصال واحد مع connect10s/idle30s وTLS. المتصفح يستعمل HTTP إلى Supabase؛ لا إنشاء اتصال PG/Redis في المتصفح أو تغيير pooler لمجرد السرعة. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/assess/server-runtime-v2.ts#L38) |
| 26 | Unnecessary Re-renders — إعادة الرسم الزائدة | مطبق جزئيًا؛ يحتاج profiling | ResultPanel يحفظ خطة الرسم بـuseMemo وlumaCache يمنع إعادة فك الأصل. Workspace يشترك في المتجر كاملًا؛ افحص React/CPU قبل تقسيم المكونات. مجرد استبدال hook بselectors لا يضمن تحسنًا إذا كانت كل الحقول مستخدمة. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/features/simulation/SimulationWorkspace.tsx#L28) |
| 27 | Browser Caching — كاش المتصفح | مطبق جزئيًا | الأصول ذات hash تحت _next/static لها سنة immutable. الصور والخطوط غير ذات hash بلا سياسة مخصصة ظاهرة؛ افحص رؤوسها أولًا. لا year-immutable لمسار يتغير محتواه ولا cache عام لبيانات حساب/صلاحيات. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/public/_headers#L13) |
| 28 | Load Balancing — موازنة الحمل | ليس مكوّنًا مطلوبًا في التطبيق الآن | التوزيع الأمامي لدى Cloudflare والبنية الخلفية لدى المزوّد؛ لا خادم ويب خاص متعدد النسخ لإضافة موازن له. DB/load والـworker overlap تحتاج قياسًا، لا رفع توازي التصحيح. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/.github/workflows/deploy-pages.yml#L1) |
| 29 | Font Optimization — تحسين الخطوط | مطبق أساسًا | 5 ملفات WOFF2 محلية وfont-display:swap وخط Inter متغير. لا Google Fonts خارجي. preloading/subsetting يقرره waterfall مع حفظ العربية والتشكيل والأوزان والفوكس. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/src/app/globals.css#L112) |
| 30 | Real User Monitoring — قياس الاستخدام الحقيقي | غير موجود؛ يحتاج قرار بيانات | لا web-vitals أو PerformanceObserver أو sendBeacon في المصدر. ابدأ قياسًا مختبريًا؛ أي إرسال لقياسات المستخدمين يحتاج غرضًا وحدودًا ومراجعة الخصوصية، دون معرّفات/درجات/محتوى. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/public/_headers#L2) |
| 31 | Performance Testing — اختبار الأداء | مطبق جزئيًا | ميزانيات gzip بـCI وبروفة radiograph AB/BA وpixel hashes موجودة، مع أدلة تاريخية RAD-098. لا بوابة تطبيق كاملة لـLCP/INP/CLS/TTFB أو خطط حمل DB فعلية مثبتة في هذه الجولة. [المصدر](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/1519d28554f02fa2af8e3d4078772b1de9cdc887/scripts/qa/radiograph-performance.mjs#L61) |

## 4. قياسات البناء والمشترك وScale
Verified: أُعيدت قراءة [سجل بناء الرأس النهائي](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/42225081981)؛ شغّل CI النهائي health:sizes بعد static export، مع94 صفحة ونجاح البوابة. لم نُعد الاختبارات أو البناء دون تغيير.
المنهج: مجموع JS+CSS الفريدة المرتبطة بكل HTML، بما فيها preload، gzip9/mtime0؛ يستثني HTML/RSC والخطوط والصور وطلبات runtime وقطعًا ديناميكية غير مرتبطة. هذا وزن اصطناعي قابل للمقارنة، وليس حجم النقل الفعلي أو إثبات ضغط HTTP.
| العائلة | gzip بايت | KiB (1024 بايت) |
|---|---:|---:|
| en.html | 394833 | 385.6 |
| en/training.html | 396070 | 386.8 |
| en/assess.html | 420355 | 410.5 |
| en/owner.html | 494788 | 483.2 |
| en/xray/hand-pa/practice.html | 496948 | 485.3 |
Verified: public =17 صورة أصلية:14JPEG+3PNG؛ أكبرها pelvis2,686,371 بايت، shoulder1,105,329 بايت. تُحمّل أصول النتيجة عند تركيب Canvas؛ حجمها ليس تلقائيًا تكلفة فتح الصفحة الرئيسية.
Verified: ملفات ترجمة المصدر الخام en176,460/ar237,614 بايت؛ layout يضع NextIntlClientProvider عامًا. مساهمتها المضغوطة في HTML/RSC تحتاج قياسًا مستقلًا؛ ليست إضافة مثبتة كاملة إلى JS السابق.
قواعد Scale: لا إلغاء pagination أو تجميع كل السجل؛ لا زيادة حدود CI/worker أو اتصالاته؛ لا caching لصلاحيات/درجات أو حسابات متعددة. افصل cache البيانات العامة عن المعطيات ذات الإبطال والهوية.

## 5. الطب والتقييم والواجهة
لا تحويل صور الأشعة تلقائيًا إلى صيغة ضياعية؛ هي مدخل للرسم، وليست صور زينة. أي تحسين له انتقال lossless مثبت بالبكسلات/الـhash والترخيص وأدلة العائلات المقبولة.
لا تعديل scoring أو shuffle أو توقيت الامتحان أو v1/v2 أو الشاهد أو ACK/leases. المهلة لا تثبت تراجع كتابة ولا تسمح بإعادتها تلقائيًا.
لا اختصار ملخصات latest/best/comparability إلى أول صفحة مع إبقاء ادعاء تغطية السجل كله. لا إزالة فحوص طبقات/حزم محمية أو تغيير goldens لإخفاء أثر.

## 6. التحقق وحدوده
Verified: كان checkout التدقيق مطابقًا للرأس البعيد المذكور ونظيفًا؛ قراءات source/config/SQL وCI وجرد الأحجام. [إذن المالك](../../../DECISIONS.md#performance-rounds-owner-2026-11-06) يفتح تهيئة مستقلة فوقه دون تعديل #242.
Verified من CI المعاد قراءته: unit2596/2596، DB1144/1144، build/docs/check ناجحة؛ بروفة worker الصورة PASS/cleanup=true. نجاحها حماية وظيفية، وليس قياس سرعة شاملًا.
Verified: أدوات منع الاعتماديات المهجورة وحجم الحزم واختبار رسم الصور موجودة. الأدلة التاريخية للرسم منفصلة عن أرقام هذا الرأس ولا تُقدّم كقياس هاتف جديد.
Not run: Lighthouse/Chrome trace/React Profiler جديدة، LCP/INP/CLS حقيقية، waterfall على هاتف فعلي، Content-Encoding/Cache headers على الاستضافة، خطط EXPLAIN/ANALYZE أو RLS/load لدى المزوّد. لم نزر التطبيق الحي أو نقرأ بيانات حسابات.
Verified لهذه التهيئة: docs:sync مرتان (الثانية0)، docs:check صفر أخطاء و20 تحذير مراجعة، status:check --require-previous وgit diff --check ناجحة؛ credits/project-status59/59. Not run: بناء تطبيق محلي لدفعة توثيق فقط. أرقام CI أعلاه تخص رأس #242؛ فحوص مسودة الأداء الجديدة تبقى منفصلة وتُسجل في وصفها.

## 7. القرارات العملية والأعمال المؤجلة
أولوية1: عدّ طلبات المالك والنتائج في سيناريوهات اصطناعية، ثم dedupe متطابق أثناء الطلب فقط، وإلغاء قراءات غير مستخدمة وتوحيد مهلاتها. التعداد العام لا يُستبدل بتعداد قائمة مفلترة.
أولوية2: فصل بيانات الملخص عن تفاصيل السجل بقراءات محدودة صحيحة؛ تقليل ما يحتاجه أول تفاعل، مع منع نتائج قديمة/تسرب حساب/تجاهل إبطال.
أولوية3: تحليل الحزم وترجمات RSC ثم lazy loading موجّه، وقياس React عند تحريك controls/فتح tabs. حافظ على الطوارئ المتاحة وحالة stop المستمرة.
أولوية مشروطة: الصور/كاش الخطوط/virtualization/فهارس جديدة، بعد قياس يثبت الحاجة. Redis وOTel وموازن خاص وSSR وAI ليست إضافات مقترحة الآن.
RUM وإعدادات الاستضافة/المنطقة والتكلفة خطوات مستقلة؛ لا تفعيل مدفوع أو نقل قاعدة أو رفع توازي العامل. النسخ السحابي يبقى مؤجلًا، ولا يُعاد فتح نطاقه عبر هذا التدقيق.

## 8. خطة الجلسات والمالك
التقدير4 جلسات إجمالًا، هذه الجولة أولها؛3 جلسات لاحقة تقريبًا، بحسب نتائج القياس وميزانية الملفات. الخامسة مشروطة بثبوت حاجة لتغيير SQL/صور أوسع، وليست نطاقًا معتمدًا سلفًا.
| الجلسة | الهدف | دليل الإقفال |
|---|---|---|
| 1 — هذه الجولة | تدقيق المعايير كلها وتثبيت خط أساس المصدر والبناء والأولويات | هذه المصفوفة، مع فصل Verified/Inferred/Not run |
| 2 | قياس طلبات/زمن أول عرض مختبريًا؛ تحسين القراءة المكررة والمهلات والملخص المحدود حسب ما يثبته القياس | أعداد طلبات وحجم بيانات وزمن قبل/بعد، وفحوص الهوية/الإبطال/ACK والشبكة البطيئة |
| 3 | تحسين حزم التحميل والرسم حيث يثبت القياس، دون تغيير المحتوى أو المحاكاة | مخطط حزمة ووزن قبل/بعد وReact/CPU trace عند الحاجة وثبات pixels/المعنى |
| 4 | تحقق شامل لأثر التعديلات والوصول EN/AR390/1440 وتثبيت حراس الأداء المناسبة | القياسات نفسها قبل/بعد، وظائف/RTL/كيبورد/فشل الشبكة وCI للرأس النهائي |
القياس المختبري يستهدف نسخة production محلية وشبكة/CPU ثابتين وتكرارات ووسيط/p95؛ dev/StrictMode لا يكفي لإثبات تكرار إنتاج. افحص نجاح وفشل الطلب، والحساب الفارغ والكبير، وبداية استخدام باردة ودافئة.
أهداف الاسترشاد المعيارية عند القياس: LCP≤2.5s وINP≤200ms وCLS≤0.1؛ ليست أرقامًا محققة ولا ضمانًا. في المختبر نقيس تفاعلات ممثلة؛ الحكم على INP الفعلي/p75 يحتاج قياسات ميدانية مناسبة.
[الجلسة التنفيذية الأولى](../../../RAD-106_PERFORMANCE_P1_PROMPT.md) مأذونة للفرع المستقل codex/rad106-performance؛ حدها12 مسارًا وتركز على قراءة دليل المالك فقط. أساس المسودة المؤقت فرع #242 لحفظ بوابة النشر القائمة؛ يُحوّل إلىmain بعد دمج #242 لاحقًا ومراجعة الفرق. لا تعديل/دمج/تفعيل لـ#242، ولا بدءP2 من التقرير وحده.


سؤالا AGENTS: هل تغير الحكم؟ أُضيف إذن تهيئة Draft وأول دفعة أداء فقط؛ أحكام الطب والخصوصية وAssess والتشغيل محفوظة. هل بقي رابط الدليل الأصلي؟ نعم، الروابط المثبتة والتقارير السابقة محفوظة.
