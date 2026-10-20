# التسليم الحالي — إضافة الاحتفاظ جاهزة لـSQL اليدوي

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع تحقق GitHub لـ#95 و#96 وأحدث main وفحوص رأسه، ثم status:summary لـRAD-056. [project-status](project-status.md) المصدر الوحيد للحالة. تابع checkout المعزول؛ لا worktree/subagents أو إعادة QA ناجحة بلا سبب.

## المنجز
إنفاذ الإغلاق والتعطيل وموافقة EN/AR v2 الصريحة وتنظيف metadata محلي في #96. v1 محفوظة دون تحويل؛ الاستكمال والنتائج لا يحجبهما توقف البدء. [تقرير الإنفاذ](ASSESS_RETENTION_REPORT_2026-10-20.md) و[تقرير الحزمة اليدوية](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md) يحفظان العقود والفحوص وحدودها. #95 وأدلة F والهاتف مدموجة؛ نجاحها لا يثبت الإضافة الجديدة.

## الخطوة التالية
[صف ما قبل التثبيت من المالك مطابق](ASSESS_RETENTION_PREFLIGHT_REPORT_2026-10-20.md#retention-preinstall-owner-result). [اختار المالك لاحقًا الأصلية دون نسخة الآن، ونسخة شاملة واحدة عند انتهاء العمل](DECISIONS.md#assess-retention-original-no-backup-2026-10-20)؛ أوقف مسار النسخ ولا تعِد طلب إذنه. جهّزت حزمة retention وحدها؛ التالي تنفيذ المالك [الملف اليدوي كاملًا مرة واحدة](../supabase/manual/assess-original-retention-install.sql) على vlacestfruxooznrcjqc وفق [الخطوات](PILOT_SUPABASE_SETUP.md#assess-retention-original-install). لا نتيجة تنفيذ أصلية وصلت بعد. نحتاج الصف النهائي بعد COMMIT؛ أي خطأ توقف، لا إعادة/تجاوز للحارس أو ترحيل B–F. فقدان الاستجابة بعد COMMIT يعالج بفحص postinstall المقروء، لا إعادة installer.

## المتبقي وحدود الأدلة
PGlite متسلسل وPostgreSQL محلي؛ لا شهادة مزود حي أو JWT/هاتف أو طب. النسخ/الاسترداد/المزود غير مثبتة، ونسخة لاحقة لا تعيد ما قبل التغيير. عند تجهيز النسخة الشاملة لاحقًا راجع تغطية القاعدة وAuth/Storage والإعدادات والتبعيات؛ لا تساوها بـdump قاعدة فقط. restore تحتاج وصولًا معزولًا وإعادة آثار الإغلاق والتعطيل والموافقة والحذف وفحص ACL؛ launch_gate وحدها لا تحجر القراءة، وشاهد snapshot القديم ليس دورة restore.

<a id="المتابعة"></a>
## البوابات الثابتة
Practice ودرجاته وصوره وتوقعاته وبصماته محفوظة. لا نشر runtime/عامل/schedule أو مراقبة أو تغيير إعدادات إنتاج أو فتح launch_gate أو ready/merge/auto-merge. عقد frontend يُراجع بحسب الاتصال الفعلي؛ لا pins أو PILOT_SCHEMA_VERIFIED لتجاوز deploy. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، والنسخ والاستعادة والتصدير والنشر بوابات مستقلة؛ لا قبول تجريبي حي مكتمل.
