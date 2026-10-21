# التسليم الحالي — نجاح preinstall للمهمة4 وانتظار إذن التركيب

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع --pr 96 وتحقق من أحدث main وفحوص الرأسين، ثم status:summary لـRAD-056. [project-status](project-status.md) مصدر الحالة الوحيد. استمر بالـcheckout نفسه؛ لا worktree/subagents أو ready/merge/auto-merge.

## المنجز والمتبقي
[تقرير الدفعة الثانية](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md) مرجع التنفيذ والفحوص وحدود الأدلة: أُعدت SQL مراقبة read-only ومراجع offline للنسخ/التقرير/الفشل والـleases والإغلاق، وتعبئة scope file اختيارية مثبتة ببصمة داخل build context بحارس0، و[دليل الجدولة والمراقبة والإلغاء والتكلفة](ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md). لم تُنشأ أو تُفعّل scheduler أو قناة تنبيه. CLEAR ليست قبولًا حيًا؛ الأدوات تقرأ facts المشغّل ولا تصادق مصدرها.

التجربة الحية في4 لم تتم؛ بدأ مسار التحقق بعد طلب المالك إتمامها وتوقف preinstall عند اختلاف catalogue. [الدفعة الأولى](ASSESS_TRIAL_BATCH_ONE_2026-10-22.md) و[الحماية](ASSESS_TRIAL_ISOLATION_2026-10-22.md) وأدوات [التثبيت/الإغلاق](ASSESS_TRIAL_PREPARATION_2026-10-22.md) محلية؛ المتبقي تركيب dormant مطابق على المزود، ملف نطاق مثبت داخل صورة/مهمة مقيدة، هوية/v2 ومحتوى/إسنادات مأذونة وجلسة مالك آمنة ونافذة وإغلاق. لا تعويض بالفروقات أو حذف الموافقات أو انتحال auth.uid.

## النسخ والإغلاق المثبتان
مراجعة المصدر كشفت أن main تستدعي v1 والمسودة v2، وأن الصورة العامة المبنية سابقًا لا تشمل RPC/مدخل التجربة المقيدة؛ نجاح Pages لا يثبت النسخة التي يفتحها الطالب أو نشر runtime. لا تشغّل الصورة العامة للتجربة. تثبيت نسخة UI/SQL/image/config وسلسلة البناء والسر الرقمي قبل نافذتها ما زال مطلوبًا؛ لا تغيير pins/Variables أو merge لإكمال الجدول.

[الربط](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-owner-pass) و[الإغلاق](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-closed-final) و[الجرد](ASSESS_TRIAL_PREPARATION_2026-10-22.md#trial-inventory-owner-result) محفوظة؛ لا تكرار probe/سر/password/تهيئة أو عدّ لمجرد الشاهد. backend0 وNOLOGIN لا يثبتان إلغاء cache/اتصال جديد. لا تقييم حي أو طبي أو استعادة من5/10 أو QA محلية.

## الخطوة التالية والتوقف
وصل تشخيص catalogue ثم نتيجة الدالة الواحدة؛ [المراجعة](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-catalog-reviewed-profile) تفسر30من30من المصدر:16تمثيل NOT NULL بين17/18، و12بصمة CRLF لست دوال، وجسم/تعريف owner_list_participants بتوزيع SELECT محدد وCRLF. البصمتان الكاملتان والطول مطابقان للاشتقاق المحلي؛ لا تبنٍ لمصدر مجهول أو تغيير Practice. خطأ الفحص في تمثيل NOT NULL محفوظ مع تفسيره؛ attnotnull تبقى مقارنة.

وصل [صف المالك](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-reviewed-preinstall-owner-pass) PASS بعقد assess-trial-install/2 وdormant=true وruntimeOrLaunchVerified=false من **preinstall فقط**؛ لا يعني تركيب trial_scope/triggers. لا إعادة التشخيص/preinstall أو الجرد/probe. الحماية ما زالت غير مركبة.

التالي إذن مستقل لتطبيق install.sql المراجع، المتاح ضمن الحزمة المولدة --reviewed-pg17-v1. آثاره موثقة في التقرير: جدول نطاق خاص فارغ ودوال/حراس Assess، وREAD COMMITTED للكتابة حتى dormant، وقفل15جدولًا NOWAIT أثناء التركيب والتحقق. البوابة وLOGIN مغلقان ولا نطاق/محتوى/هويات/عامل. الملف يعيد before/after والإغلاق وscope الفارغ، ثم COMMIT وتحقق مستقل. استُكملت المراجعة والاختبارات قبل طلب الإذن؛ سبب التوقف قيد المالك الأصلي الذي فصل التحضير والقراءة عن أي تطبيق حي. لا تعرض التنفيذ كأنه مأذون من PASS. بعد الموافقة يشغّل المالك install.sql كاملًا في SQL Editor بدور postgres ويرسل result؛ لا تشغيل تلقائي أو retry عمياء.

تابع المهمة4 وفق النتيجة؛ لا تعتبرها تجربة حية منفذة من فحص SQL. تركيب الحماية وتجهيز الصورة/الهوية والمحتوى والنافذة والإغلاق تبقى متطلبات منفصلة قبل أي تشغيل، بلا أسرار/OTP أو انتحال auth.uid. لا تبدأ7–8 أو ready/merge/auto-merge؛ الانتقال للدفعة الثالثة يحتاج توجيه المالك الصريح.
<a id="المتابعة"></a>
## القرارات والبوابات الثابتة
[التصميم](DECISIONS.md#assess-owner-2026-10-19) و[الاحتفاظ](DECISIONS.md#assess-retention-owner-2026-10-20) و[النسخة الشاملة المؤجلة](DECISIONS.md#assess-retention-original-no-backup-2026-10-20) محسومة وروابط أدلتها محفوظة؛ لا إعادة اعتمادها. Practice/المعايير/التوقعات/البصمات محفوظة. التشغيل المستمر ومنع التداخل وقناة الإنذار والإلغاء/cache والتكلفة والنسخ/restore/export وO108 والمصادر/الترخيص/المراجعة والخلفية والمعايير وMarker مستقلة؛ لا قبول شامل من تقدم البرمجة.
