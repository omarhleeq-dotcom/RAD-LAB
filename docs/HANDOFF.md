# التسليم الحالي — RAD-062: ملكية قاعدة البروفة مأذونة بشروط

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer وP10 Draft #175. [المالك أذن](DECISIONS.md#rad062-restore-owner-parity-2026-11-01) بملكية postgres لقاعدة الاستعادة المؤقتة فقط قبل pre-M01 checks، مع ثبات الصفات/العضويات والتحقق غير superuser. [تقرير P10](RAD-062_P10_REPORT_2026-10-30.md) يحفظ قياس B بعد التصحيح ونجاح CI check بكل مراحل البروفة والشاهدين وteardown؛ لا تستنتج نجاح النسخة الحقيقية من ذلك.
- **ينتظر المالك:** أمر read-only في [P9 §1](RAD-062_P09_LAPTOP_RUNBOOK.md) يطبع yes/no فقط عن مالك قاعدة live؛ لا تصح نتيجة البروفة إلا بعد yes، وإلا STOP. الوكيل لا ينفذه. بروفة latest الحقيقية والهاتف والنافذة ≤60دقيقة تبقى حاجبة، ولا restore verified أو حجز من synthetic وحدها.
- **ينتظر مراجِعًا:** CI أعادت قياس frozen B بعد الملكية وبقيت relations وحدها؛ diagnostic كامل وكل الأنواع الأصلية وبلا null/تكرار وفق [P9b](RAD-062_P09B_REPORT_2026-10-30.md). كل migrations/manifest/transition/counts والشاهدين المقصودين مرّت في CI؛ يلزم دليل المالك المستقل. التشخيص الكامل للاختبار الاصطناعي في CI فقط؛ main بلا flag/env له. لا إضافات fixture مفترضة.
- **مرجع Git:** docs:context لحالة الفرع وPR؛ commits عادية بلا rebase/force-push/skip-ci؛ #175 Draft فقط. متابعة push/انتظار CI/قراءة السجل مأذونة صراحة إلى check خضراء أو STOP يحتاج قرارًا آخر. shared restore/tests وSQL وpackets وmanual ثابتة؛ لا ready/merge/auto-merge أو SQL حي/Variables/نشر إضافي/preview/goldens/بيانات مشاركين.
- **مخاطر معلنة:** gate مغلقة والعامل NOLOGIN والسر DISABLED. لا GRANT أو role/attribute/config/membership changes؛ الاستثناء ملكية قاعدة الهدف المحلي وحدها. B الحية غير المستعادة مطلوبة ready بالكامل بقراءة المالك فقط؛ نجاح B المستعادة لا يعفيها. الحقوق/الخصوصية/O4 وACK والبديل و4ب/5ب باقية؛ RAD-086 done وRAD-059 review/owner بلا تغيير.

## المتابعة

الخطوة التالية مراجعة الدليل ورأس PR وcheck عبر docs:context ثم قراءة المالك في §1 وبروفة latest الحقيقية وفق شروط الدليل. حلقة CI الحالية نجحت؛ إن تغيّر الكود استأنف push/انتظار CI/قراءة logs والإصلاح المأذون فقط. أي عجز ينطبق على live أو يحتاج migration/check/expectation/timeout/guard أو دور/امتياز خارج استثناء الملكية = STOP وقرار المالك. إذا اختلفت kinds عن relations بعد الملكية فلا تعتمد الفرق. المخرجات للمالك counts/yes-no/STOP ومراحل وSQLSTATE/errno فقط؛ credential لا تدخل التشخيص الخام. لا pre-initializer أو replay على نسخة الإنتاج.

تستدعي البروفة restoreTest نفسها بالصورة/locale/prepareRolesSql وrolconfig والمرورين والفحوص وfinally. لا تبديل للصورة أو driver أو skip عند عائق المساحة المحلي؛ CI الدليل الفعلي. التقرير يميز QA المحلية وCI وما لم يُبلَغ، ويحفظ الأصل التاريخي.
