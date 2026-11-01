# التسليم الحالي — RAD-062 Decision C: probes بدل ledger

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer وP10 Draft #175. بروفة المالك السابقة توقفت M01/42P01؛ TOC بالعدادات تثبت غياب Supabase ledger ووجود assess. [Decision C](DECISIONS.md#rad062-catalogue-probes-2026-11-01) يزيل الافتراض من apply وfixture؛ لكل M شاهد كتالوج فريد ودائم، ولا كائنات حية جديدة. [تقرير P10](RAD-062_P10_REPORT_2026-10-30.md) للدليل وQA.
- **ينتظر المالك:** CI الجديدة خضراء؛ بروفة latest الحقيقية بعد C مجددًا؛ شرط قراءة live owner=yes في [P9 §1](RAD-062_P09_LAPTOP_RUNBOOK.md) وB الأصلية ready كاملة باقٍ، والوكيل لا يقرأ live. لا restore verified أو حجز نافذة من synthetic. الهاتف والنافذة≤60دقيقة وباقي شروط التشغيل باقية.
- **ينتظر مراجِعًا:** جدول signatures في P9 §5، false قبل كل معاملة وtrue بعدها ضمن prefix كامل؛ لا حضور يغني عن كامل readiness. UNKNOWN ACK لا يحل إلا fresh probes من اتصال جديد، بلا retry آلي أو blind rerun أو ledger8صفوف. CI الجديدة نجحت بشواهد الترتيب/الإعادة/rollback/fresh ACK وغياب ledger، وكل المراحل والشاهدين وteardown؛ النجاح السابق ذو fixture مخفية تاريخي.
- **مرجع Git:** docs:context لحالة الفرع والرأس وPR؛ commits عادية بلا rebase/force-push/skip-ci؛ Draft فقط. حلقة push/انتظار CI/قراءة logs مأذونة حتى check خضراء أو STOP يحتاج قرارًا. لا تعديل SQL/migrations/SHA/checks/expectations/timeouts/guards أو packets/manual/shared restore/tests؛ لا ready/merge/auto-merge أو live SQL/Variables/نشر إضافي/preview/goldens/بيانات مشاركين.
- **مخاطر معلنة:** gate مغلقة والعامل NOLOGIN والسر DISABLED. تصحيح ملكية هدف الاستعادة المحلي إلى postgres بشروطه السابقة باقٍ دون GRANT/role changes. probes ليست كامل بصمة الكتالوج؛ كل manifest والانتقال والcounts مطلوبة. الحقوق/الخصوصية/O4 وACK/البديل و4ب/5ب باقية؛ RAD-086 done وRAD-059 review/owner بلا تغيير.

## الحملة النهائية الحالية

[القرارات](DECISIONS.md#rad062-final-campaign-2026-11-01): D-CRLF لترقيعاتM06/M08 وjob_b(a) وفحص البيانات قبلM01. [تقرير P10](RAD-062_P10_REPORT_2026-10-30.md#final-campaign-2026-11-01) يحفظ قائمة الشروط ومصادرها وmarker القديمة والجديدة ونتائجCI وحدودها. الاختبار الأساسي يبنيRAD-086 منsnapshot main بلا بيانات ثم يستدعيrehearse الحقيقي؛ نجاحsynthetic السابق لا يثبت هذا المسار. عوائق إعدادات no-data قيد الحصر؛ أي تجاوز للكشف يبقىscratch محليًا ولا يُدفع. لا تعديل متوقعdigests أو حزم الهاتف/manual أو صلاحيات؛ RAD-062 تبقىin_progress/reviewer وDraft فقط.

## المتابعة

راجع دليل CI الخضراء ورأس PR وcheck عبر docs:context، ثم ينتقل المالك إلى بروفة latest الفعلية بعد C. إذا تغيّر الكود استأنف حلقة CI وقراءة السجل والإصلاح المأذون فقط، بلا تقرير بعد كل push. إن غاب شاهد دائم أو اختلف B عن relations أو لزم تعديل SQL/check/expectation/timeout/guard/role/privilege خارج الاستثناءات فـSTOP وقرار المالك. بعد UNKNOWN استخدم فقط قراءة probes جديدة لتحديد prefix، ولا تزيّف كتالوجًا أو ledger أو تعاود SQL. المخرجات للمالك counts/flags/STOP ومراحل وSQLSTATE/errno فقط؛ التشخيص الكامل وhooks الشواهد للاختبار الاصطناعي وحده بلا flag/env من main.

تستدعي البروفة restoreTest نفسها بالصورة/locale/prepareRolesSql وrolconfig والمرورين والفحوص وfinally. لا تبديل صورة أو driver أو skip عند عائق المساحة المحلي؛ CI الدليل الفعلي. التقرير يميز الموكات من الصورة وfull CI وبروفة المالك الفعلية؛ لا تعمم synthetic على production.
