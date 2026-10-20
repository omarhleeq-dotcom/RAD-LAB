# التسليم الحالي — اختيار Cloud Run لحزمة Assess

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع تحقق GitHub لأحدث main و#96 وفحوص كل رأس مقصود، ثم status:summary لـRAD-056. [project-status](project-status.md) مصدر الحالة الوحيد. تابع checkout المعزول؛ لا worktree/subagents أو QA ناجحة معادة بلا تغير ذي صلة.

## المنجز
جُهزت [مكتبة Node24 المحلية](ASSESS_RUNTIME_LOCAL.md) لنقل RPC العامل المحدود عبر PostgreSQL/TLS، مع إعادة استخدام server-service وrunAssessJobs وmaintain والمصحح وlease/recovery والحذف الذري. المستخدم يبقى Supabase Auth/Data API بهوية JWT المتحقق منها لدى المزود؛ لا وسيط مستخدم جديد أو admin key باسمه. [تقرير الربط](ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md) يحفظ الفحوص وحدود محاكاة النقل والمكتبة مقابل المزود الحي. الحزمة داخل المسودة، وليست عاملًا أو schedule أو نشر runtime.

## الخطوة التالية
اختار المالك [Google Cloud Run](DECISIONS.md#assess-cloud-run-owner-2026-10-21). [خطة المطابقة](ASSESS_CLOUD_RUN_PLAN_2026-10-21.md) تقترح Jobs محدودة دون HTTP، وتوثق فجوة SIGTERM/القتل مقابل مهلة SQL. التالي تجهيز container وentrypoint محليين يعيدان runAssessJobs نفسها، واختبار الإيقاف/القتل وفقد الإقرار والـlease دون تخفيف المهل أو إعادة محاولة عمياء. لا إعادة سؤال اختيار المزوّد أو النسخة. لم يُبن container أو يبدأ عامل من تثبيت القرار.

ثبت نجاح CI وDeploy Pages لرأس حزمة الربط السابق نفسه؛ تفاصيل الرأس وروابط النتائج في خطة المطابقة، ولا هاتف جديد أو قبول حي. حزمة البناء منفصلة عن binding والنشر والعامل والجدولة والمراقبة الحية؛ project/region والتكلفة ومسؤول التشغيل وIAM/السر/TLS/ACL والإلغاء ما زالت بوابات ربط مستقل.

## الأدلة المكتملة وحدودها
وصل [صف SQL النهائي](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-install-owner-result) و[زوج retention المغلق PASS المتطابق](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-closed-pair-owner-result). لا إعادة installer/preinstall/postinstall أو أدوات الحسابين لمجرد شاهد. runtimeOrLaunchVerified=false مقصودة؛ القراءات ورفض الوصول المباشر لا تثبت قبول v2 أو start/close/disable/تصحيح/صيانة/حذف حي. اختبار SQL اصطناعي تحت login محدود ليس شبكة pg/TLS أو JWT مزود؛ v1 لا تنوب عن v2 ولا قبول نيابة عن أحد. هاتف F يخص مرحلته.

<a id="المتابعة"></a>
## المتبقي والحدود الثابتة
[اختار المالك المتابعة دون نسخة الآن ونسخة شاملة عند انتهاء العمل](DECISIONS.md#assess-retention-original-no-backup-2026-10-20)؛ لا إعادة سؤال أو تجهيز تلقائي. backup/recovery/provider غير مثبتة. restore تحتاج حجر الشبكة/API/الهويات ثم إعادة آثار الإغلاق والتعطيل والموافقة وmetadata المحذوفة والحذف وفحص ACL؛ purge النتائج وlaunch_gate وحدهما لا يحجران القراءات. لا نظام نسخ إنتاجي أو تصدير عام.

Practice ودرجاته وصوره وتوقعاته وبصماته محفوظة. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، وruntime والعامل والجدولة والمراقبة والنسخ والاستعادة والتصدير والنشر بوابات مستقلة. لا SQL كتابة على الأصلية أو تغيير PILOT_SCHEMA_VERIFIED/إعداد إنتاج أو نشر runtime/عامل/schedule أو ready/merge/auto-merge. تبقى launch_gate مغلقة؛ القبول التجريبي الحي غير مكتمل.
