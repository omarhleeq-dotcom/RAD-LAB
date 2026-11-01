# التسليم الحالي — RAD-062 D-NAMES

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer وP10 Draft. [D-NAMES](DECISIONS.md#rad062-d-names-2026-11-01) تقبل عداد الأسماء القديمة في precheck وpost-M08، وتطبعه accepted_invalid_name_profiles؛ بقية STOP ثابتة. [تقرير P10](RAD-062_P10_REPORT_2026-10-30.md#d-names-2026-11-01) يحفظ الدليل والشواهد وmarker الثابتة.
- **ينتظر المالك:** البروفة الكاملة من latest بعد D-NAMES وبقية شروط live/الهاتف والنافذة≤60دقيقة. إفادته عن عداد الأسماء مجمعة فقط؛ لا بيانات مشاركين أو SQL حي من الوكيل.
- **ينتظر مراجِعًا:** استثناء عداد واحد فقط، مع طباعة الدفعة كاملة وإبقاء كل شرط آخر حاجبًا؛ SQL/checks/migrations/expected/guards/timeouts ثابتة. D-CONFIG وrevoke المحددة وبراهين الكتالوج السابقة محفوظة.
- **مرجع Git:** docs:context لحالة الفرع والرأس وPR؛ commits عادية وDraft فقط بلا skip-ci أو ready/merge/auto-merge. نتيجة CI الكاملة للرأس في PR والتقرير؛ لا Variables أو نشر إضافي أو preview/goldens.
- **مخاطر معلنة:** login وPractice وبقية profile updates لا تتأثر بالأسماء القديمة؛ Assess تطلب اسمًا صالحًا تجمعه P10 UI، وINSERT/name changes لا تقبل غير الصالح. لا backfill أو تعديل تلقائي لصفوف. packets/manual/fixtures ثابتة؛ سائر الحقوق/الخصوصية و4ب/5ب وRAD-059 بلا تغيير.

## المتابعة

اقرأ CI للرأس وسجلها: إن كانت حمراء فتابع push→wait→logs→fix حتى الأخضر؛ إن خضرت فالمتبقي بروفة latest والهاتف وشروطP9 للمالك. لا تجعل عداد الأسماء شرط تنظيف جماعي، ولا تقبل أي شرط آخر غير صفري. راجع أثر المستخدم في P9 §1/§3؛ marker ثابتة ولا يضعها الوكيل في Variable.
