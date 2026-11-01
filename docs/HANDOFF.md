# التسليم الحالي — RAD-062: STOP لقرار المالك في بروفة M01

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ استمر في checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer وP10 Draft #175. حكم [P9b](RAD-062_P09B_REPORT_2026-10-30.md) مثبت على المستعادة: diagnostic كامل وB exactly relations false، وكل الأنواع الأصلية وبلا null/تكرار. [التقرير الحالي](RAD-062_P10_REPORT_2026-10-30.md) يحفظ القياس قبل الترميز، ثم تشخيص CI الجديد: M01 توقف عند CREATE FUNCTION/42501؛ لا نجاح البروفة الكاملة.
- **ينتظر المالك:** قرار محدد في التقرير لإقرار postgres مالكًا مقصودًا لهدف بروفة latest أيضًا والسماح بتصحيح ملكية القاعدة المؤقتة محليًا فقط؛ قياس CI أثبت اختلاف مالك المصدر/الهدف وفقد CREATE بعد restore بسبب وراثة ملكية schema من قاعدة البيانات. لم يُنفذ ALTER DATABASE أو GRANT أو تعديل دور/امتياز. المصدر الاصطناعي يملك الامتياز بالفعل، فليست فجوة fixture؛ لا نجزم بعجز live. الحظر مصدره بند4 من أمر المالك الحالي.
- **ينتظر مراجِعًا:** main بلا flag/env لتفعيل التشخيص؛ callback الكامل للاختبار الاصطناعي في CI وحده. apply تضيف label وSQLSTATE فقط دون تغيير رسالتها/سلوكها. فحص غياب container/volume مرّ بعد الفشل، لكن الشاهدين المقصودين وبقية البروفة لم يبلغا. لا إضافات fixture من افتراض إنتاجي.
- **مرجع Git:** docs:context لحالة الفرع وPR؛ commits عادية بلا rebase/force-push؛ #175 Draft فقط. متابعة CI الحالية مأذونة صراحة؛ لا ready/merge/auto-merge. SQL وpackets الهاتف وsupabase/manual وaccepted behaviour/tests لـRAD-086 ثابتة؛ marker أعيد حسابها وثبتت. لا live SQL/Variables أو نشر إضافي أو preview أو goldens أو بيانات مشاركين.
- **مخاطر معلنة:** gate مغلقة والعامل NOLOGIN والسر DISABLED. B الحية غير المستعادة مطلوبة ready بالكامل بقراءة المالك فقط؛ الوكيل لا يقرأ live. لا RAD062_RESTORE_VERIFIED=yes أو حجز نافذة قبل نجاح أمر المالك كاملًا. الهاتف والحقوق/الخصوصية/O4 وACK والبديل و4ب/5ب ونافذة≤60دقيقة باقية؛ RAD-086 done بإفادة المالك السابقة وRAD-059 review/owner بلا تغيير.

## المتابعة

انتظر قرار المالك المحدد في التقرير؛ لا ترفع امتيازًا أو تغيّر ownership أو SQL/expectation/guard/timeout لإخفاء STOP. بعد الإذن استأنف الاختبارات الاصطناعية ودورات push/انتظار CI/قراءة السجل حتى check خضراء أو STOP يحتاج قرارًا آخر. مخرجات CLI للمالك counts/yes-no/STOP ومراحل وSQLSTATE/errno فقط؛ full driver diagnostics للاختبار الاصطناعي وحده، بلا opt-in من main. لا pre-initializer أو replay على نسخة الإنتاج.

بروفة [دليل P9](RAD-062_P09_LAPTOP_RUNBOOK.md) تستدعي restoreTest نفسها، مع الصورة/locale/prepareRolesSql وrolconfig والمرورين والفحوص وfinally. socket SCRAM المؤقت لا يغيّر الكتالوج/الامتيازات؛ لا تعدّ auth سبب STOP الجديد. عائق مساحة الصورة المحلي موثق؛ لا صورة بديلة أو driver change أو skip، وCI هي الدليل الفعلي. التقرير يميز الاختبارات المحلية من CI وما لم يُبلَغ.
