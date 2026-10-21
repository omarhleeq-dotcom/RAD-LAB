# التسليم الحالي — المهمة4 متوقفة عند اختلاف catalogue قبل التركيب

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع --pr 96 وتحقق من أحدث main وفحوص الرأسين، ثم status:summary لـRAD-056. [project-status](project-status.md) مصدر الحالة الوحيد. استمر بالـcheckout نفسه؛ لا worktree/subagents أو ready/merge/auto-merge.

## المنجز والمتبقي
[تقرير الدفعة الثانية](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md) مرجع التنفيذ والفحوص وحدود الأدلة: أُعدت SQL مراقبة read-only ومراجع offline للنسخ/التقرير/الفشل والـleases والإغلاق، وتعبئة scope file اختيارية مثبتة ببصمة داخل build context بحارس0، و[دليل الجدولة والمراقبة والإلغاء والتكلفة](ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md). لم تُنشأ أو تُفعّل scheduler أو قناة تنبيه. CLEAR ليست قبولًا حيًا؛ الأدوات تقرأ facts المشغّل ولا تصادق مصدرها.

التجربة الحية في4 لم تتم؛ بدأ مسار التحقق بعد طلب المالك إتمامها وتوقف preinstall عند اختلاف catalogue. [الدفعة الأولى](ASSESS_TRIAL_BATCH_ONE_2026-10-22.md) و[الحماية](ASSESS_TRIAL_ISOLATION_2026-10-22.md) وأدوات [التثبيت/الإغلاق](ASSESS_TRIAL_PREPARATION_2026-10-22.md) محلية؛ المتبقي تركيب dormant مطابق على المزود، ملف نطاق مثبت داخل صورة/مهمة مقيدة، هوية/v2 ومحتوى/إسنادات مأذونة وجلسة مالك آمنة ونافذة وإغلاق. لا تعويض بالفروقات أو حذف الموافقات أو انتحال auth.uid.

## النسخ والإغلاق المثبتان
مراجعة المصدر كشفت أن main تستدعي v1 والمسودة v2، وأن الصورة العامة المبنية سابقًا لا تشمل RPC/مدخل التجربة المقيدة؛ نجاح Pages لا يثبت النسخة التي يفتحها الطالب أو نشر runtime. لا تشغّل الصورة العامة للتجربة. تثبيت نسخة UI/SQL/image/config وسلسلة البناء والسر الرقمي قبل نافذتها ما زال مطلوبًا؛ لا تغيير pins/Variables أو merge لإكمال الجدول.

[الربط](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-owner-pass) و[الإغلاق](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-closed-final) و[الجرد](ASSESS_TRIAL_PREPARATION_2026-10-22.md#trial-inventory-owner-result) محفوظة؛ لا تكرار probe/سر/password/تهيئة أو عدّ لمجرد الشاهد. backend0 وNOLOGIN لا يثبتان إلغاء cache/اتصال جديد. لا تقييم حي أو طبي أو استعادة من5/10 أو QA محلية.

## الخطوة التالية والتوقف
طلب المالك إتمام4 ثم نفّذ preinstall القراءة فقط وأعاد55000: trial preinstall catalog mismatch. السبب غير محدد بعد؛ لا تركيب/تفعيل أو إعادة الجرد/probe. [التفاصيل وشاهد المالك](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-preinstall-catalog-mismatch) و[مولد التشخيص](../scripts/assess/trial-catalog-diff.mjs) يحفظان المرجع الأصلي؛ التالي ملف catalog-diff.sql كاملًا في SQL Editor بدور postgres وإرسال عمود diagnostic. الملف ينهي معاملة الفحص الفاشلة ثم يقرأ metadata وبصمات فقط؛ لا أجسام دوال أو إعدادات خاصة. لا تعديل baseline/hash/ACL لتجاوز الرفض.

تابع المهمة4 وفق النتيجة؛ لا تعتبرها تجربة حية منفذة من فحص SQL. تركيب الحماية وتجهيز الصورة/الهوية والمحتوى والنافذة والإغلاق تبقى متطلبات منفصلة قبل أي تشغيل، بلا أسرار/OTP أو انتحال auth.uid. لا تبدأ7–8 أو ready/merge/auto-merge؛ الانتقال للدفعة الثالثة يحتاج توجيه المالك الصريح.
<a id="المتابعة"></a>
## القرارات والبوابات الثابتة
[التصميم](DECISIONS.md#assess-owner-2026-10-19) و[الاحتفاظ](DECISIONS.md#assess-retention-owner-2026-10-20) و[النسخة الشاملة المؤجلة](DECISIONS.md#assess-retention-original-no-backup-2026-10-20) محسومة وروابط أدلتها محفوظة؛ لا إعادة اعتمادها. Practice/المعايير/التوقعات/البصمات محفوظة. التشغيل المستمر ومنع التداخل وقناة الإنذار والإلغاء/cache والتكلفة والنسخ/restore/export وO108 والمصادر/الترخيص/المراجعة والخلفية والمعايير وMarker مستقلة؛ لا قبول شامل من تقدم البرمجة.
