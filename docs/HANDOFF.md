# التسليم الحالي — SQL الاحتفاظ مثبتة وفق صف المالك؛ التالي الخدمة المغلقة

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع تحقق GitHub لـ#95 و#96 وأحدث main وفحوص رأسه، ثم status:summary لـRAD-056. [project-status](project-status.md) المصدر الوحيد للحالة. تابع checkout المعزول؛ لا worktree/subagents أو إعادة QA ناجحة بلا سبب.

## المنجز
إنفاذ الإغلاق والتعطيل وموافقة EN/AR v2 الصريحة وتنظيف metadata محلي في #96. v1 محفوظة دون تحويل؛ الاستكمال والنتائج لا يحجبهما توقف البدء. [تقرير الإنفاذ](ASSESS_RETENTION_REPORT_2026-10-20.md) و[تقرير الحزمة اليدوية](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md) يحفظان العقود والفحوص وحدودها. #95 وأدلة F والهاتف مدموجة؛ نجاحها لا يثبت الإضافة الجديدة.

## الخطوة التالية
وصل [صف التثبيت النهائي المطابق بعد COMMIT](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-install-owner-result) من المالك على الأصلية، مع launch_gate مغلقة. لا إعادة installer أو preinstall/postinstall أو أدوات F القديمة. التالي [أداة retention المغلقة الجديدة](../scripts/pilot/assess-retention-closed-service-check.js)، مرة كمالك ومرة كمشارك معتمد وفق [الدليل](PILOT_SUPABASE_SETUP.md#assess-retention-closed-service). تقرأ v2 مع null فقط ولا تسجل قبولًا؛ انتظر زوج PASS بعقدها وpair متطابق. أي STOP يحتاج تشخيصًا دون إعادة SQL. [اختار المالك الأصلية دون نسخة الآن ونسخة شاملة عند انتهاء العمل](DECISIONS.md#assess-retention-original-no-backup-2026-10-20)؛ لا تعِد طلب إذنه أو تستأنف مسار النسخ الآن.

## المتبقي وحدود الأدلة
PGlite متسلسل وPostgreSQL محلي؛ صف المزود من المالك يثبت شروط SQL فقط، ولا زوج JWT جديد وصل أو شهادة هاتف/طب. النسخ/الاسترداد/المزود غير مثبتة، ونسخة لاحقة لا تعيد ما قبل التغيير. عند تجهيز النسخة الشاملة لاحقًا راجع تغطية القاعدة وAuth/Storage والإعدادات والتبعيات؛ لا تساوها بـdump قاعدة فقط. restore تحتاج وصولًا معزولًا وإعادة آثار الإغلاق والتعطيل والموافقة والحذف وفحص ACL؛ launch_gate وحدها لا تحجر القراءة، وشاهد snapshot القديم ليس دورة restore.

<a id="المتابعة"></a>
## البوابات الثابتة
Practice ودرجاته وصوره وتوقعاته وبصماته محفوظة. لا نشر runtime/عامل/schedule أو مراقبة أو تغيير إعدادات إنتاج أو فتح launch_gate أو ready/merge/auto-merge. عقد frontend يُراجع بحسب الاتصال الفعلي؛ لا pins أو PILOT_SCHEMA_VERIFIED لتجاوز deploy. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، والنسخ والاستعادة والتصدير والنشر بوابات مستقلة؛ لا قبول تجريبي حي مكتمل.
