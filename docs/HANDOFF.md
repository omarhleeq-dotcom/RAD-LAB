# التسليم الحالي — RAD-062: تنفيذ D-CONFIG وD-PROFILES-ACL

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ استمر في checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer وP10 Draft. قرارا المالك معتمدان: بذر الإعدادات في اختبار CI وحده بعد restore، وrevoke المحددة داخلM01. [تقرير P10 الحالي](RAD-062_P10_REPORT_2026-10-30.md#config-acl-approved-2026-11-01) يحفظ التنفيذ والدليل وmarker القديمة والجديدة؛ PG18 السابقة ليست دليلًا للحملة الحالية.
- **ينتظر المالك:** latest الحقيقية وبقية شروط live/الهاتف والنافذة≤60دقيقة؛ أفاد باجتياز pre_diagnostic ووجود إعدادات live. لا SQL حي من الوكيل أو Variables أو ready/merge. القرار القادم مطلوب فقط إن ظهر فرق صلاحيات آخر أو STOP خارج الاستثناءات.
- **ينتظر مراجِعًا:** بذر4صفوف من initializers المراجعة داخل الاختبار بعد counts، دون تعديل بروفة المالك أو precheck أو STOP. M01 تسحب الأربعة المعتمدة فقط؛ شاهد no-op للـrepo وشاهد ACL delta للصورة الحقيقية. البصمات والمهلات والحراس ثابتة.
- **مرجع Git:** docs:context لحالة الفرع والرأس وPR؛ commits/merges عادية بلا rebase/force-push/skip-ci وDraft فقط. التقرير يحفظ QA وCI؛ لا نشر إضافي أو preview/goldens/بيانات مشاركين. بقية مهام الحقوق/الخصوصية و4ب/5ب وRAD-059 بلا تغيير.
- **مخاطر معلنة:** لا قبول من synthetic أو PG18 وحدهما. الصورة المثبتة هي مصدر أي كشف لاحق؛ التجاوزات غير المعتمدة تبقى scratch محلية ولا تُدفع. gate مغلقة والعامل NOLOGIN والسر DISABLED؛ packets/manual/SQL checks ثابتة.

## المتابعة

استمر push→wait CI→read logs→fix حتى check خضراء وكل البرهان مكتمل، أو قائمة موحدة لكل قرارات المالك المتبقية. أي فرق privilege آخر STOP بلا revoke إضافي. لا تعديل كود بروفة المالك أو data precheck أو expected/guards/timeouts؛ لا تعمم نجاح fixture على production. [الاعتماد الحالي](DECISIONS.md#rad062-config-acl-approved-2026-11-01) يحفظ حدود الاستثناءين وأصل القرارين.
