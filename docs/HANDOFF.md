# التسليم الحالي — RAD-062 Part2: ICU en-US لـP10

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary للمهام RAD-062 وRAD-086 وRAD-059؛ استمر في checkout نفسه. [الحالة](project-status.md) المصدر الوحيد للمهام.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer؛ P9b مدموجة في #174، وP10 في Draft #175 على الفرع القائم. دُمج main مع أدوات RAD-086؛ متابعة ICU تضيف حالة en-US بكلا lc=en_US.UTF-8 إلى التطبيق الكامل والجاهزية بجانب libc وفق [تقرير P10](RAD-062_P10_REPORT_2026-10-30.md). إصلاحا collation وتوافق v1 السابقان وبقايا4ب/5ب محفوظة للمراجعة.
- **ينتظر المالك:** RAD-086 done بإفادة النسخ والاستعادة والسجل والجدولة2026-10-31 و[نتيجة Supavisor2026-11-01](RAD-086_REPORT_2026-10-31.md#supavisor-finding-2026-11-01)؛ status الأسبوعي عادة مستمرة. RAD-059 review/owner للقنوات/الاستلام والبديل ودليل إلغاء اعتماد العامل؛ [قاعدة120ثانية](DECISIONS.md#rad086-supavisor-finding-owner-2026-11-01) لا تثبت وحدها الرفض. لا SQL حي من الوكيل.
- **ينتظر مراجِعًا:** قبول براهين P10 وICU والنافذة المتصلة؛ التقرير يسجل QA الحالية وحدودها. RAD-032 للأشعة وRAD-056 عبر RAD-063 وRAD-041 لعزل الإنتاج؛ الحقوق/D3 والأمن والخصوصية وAuth بلا FK وO4 شروط مستقلة.
- **مرجع Git:** docs:context لحالة الفرع وPR؛ [تقرير P10](RAD-062_P10_REPORT_2026-10-30.md) للفحوص والميزانية وmarker، و[تقرير RAD-086](RAD-086_REPORT_2026-10-31.md) لدليل المالك. CI وDeploy Pages المعتادان مأذونان؛ Draft فقط دون ready/merge/auto-merge أو force-push أو skip ci أو نشر إضافي أو معاينة مستضافة أو polling.
- **مخاطر معلنة:** gate مغلقة والعمال NOLOGIN والسر DISABLED؛ guard=true ليس attestation DB. نتيجة Supavisor لا تضبط pooler_cache_verified ولا تثبت إلغاء سر العامل. [قرار اللابتوب فقط](DECISIONS.md#rad086-laptop-only-owner-2026-10-31) ومخاطر فقد النسخ محفوظة. نجاح الاختبارات الاصطناعية لا يثبت يوم القاعدة أو الهاتف أو أهلية امتحان حقيقي.

## المتابعة

STOP: الترحيلات نجحت على ICU17.11، ثم شاهد D3 أعاد default_order=true مقابل false المتوقع (Node ERR_ASSERTION، لا SQLSTATE)، فلم تبدأ جاهزية ICU. حالتا libc17.11 تفشلان في rad062-ready.sql بوليانيًا بلا SQLSTATE. التفاصيل في أحدث متابعة Part2 بالتقرير؛ قرار المالك مطلوب قبل تعديل أي توقع، والنافذة محجوبة. أي فشل ICU يوقف العمل مع اسم الترحيل/الفحص وSQLSTATE؛ لا تعديل migration أو required/checks أو guard أو timeout أو expected value دون قرار مالك صريح. packetا الهاتف وsupabase/manual ثابتة بايتيًا.

المالك وحده ينفذ [دليل P9](RAD-062_P09_LAPTOP_RUNBOOK.md) و[P9b](RAD-062_P09B_REPORT_2026-10-30.md) بعد اكتمال STOP والنسخة الكاملة والاستعادة المطابقة لهوية locale والإصدار. ترتيب النافذة≤60دقيقة: live apply/checks ثم Variable ثم merge ثم CI/Deploy Pages المعتادان ثم الهاتف والطوارئ، وفق متابعة المالك في تقرير P10. الوكيل لا ينفذ أيًا من الخطوات الحية ولا يدمج #175. إذا فشل شيء بعد merge يعيد المالك Variable القديمة ثم يدمج revert PR عادية داخل النافذة مع بقاء الإغلاق؛ لا تراجع DB أعمى.

إذا تقدم main قبل اليوم، ادمجه دون rebase/force-push، تحقق البايتات وأعد QA المتأثرة وحساب marker والتقرير قبل المراجعة. البصمة في التقرير وPR فقط. فحص SID100 وبقية Part A والحقوق/الخصوصية/O4 والقنوات/ACK والبديل تبقى مستقلة.
