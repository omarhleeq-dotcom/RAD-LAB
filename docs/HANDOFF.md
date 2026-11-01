# التسليم الحالي — RAD-062: حكم P9b مثبت؛ STOP جديد عند M01

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ استمر في checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer؛ P10 Draft #175. [التقرير الحالي](RAD-062_P10_REPORT_2026-10-30.md) و[القرار](DECISIONS.md#rad062-owner-rehearsal-2026-11-01) يحفظان قياس CI17.11 الذي طبع relations وحدها قبل الترميز؛ أعيد حكم [P9b](RAD-062_P09B_REPORT_2026-10-30.md). CI التالية اجتازت B المصححة ثم توقفت عند أول apply لـM01؛ لا نجاح البروفة الكاملة مثبت.
- **ينتظر المالك:** B المجمدة ready بالكامل على live غير المستعادة بقراءة المالك فقط؛ لا قراءة حية من الوكيل. أمر البروفة على latest الحقيقية يجب أن ينجح كاملًا قبل RAD062_RESTORE_VERIFIED=yes أو حجز النافذة. RAD-086 done بإفادة المالك السابقة؛ RAD-059 review/owner للقنوات/ACK والبديل وإلغاء اعتماد العامل.
- **ينتظر مراجِعًا:** تشخيص M01 ضمن إذن متابعة؛ لا SQLSTATE/سبب أدنى مثبت من الرمز، ولا افتراض privilege أو catalogue أو إصلاح SQL/دور/توقع لتجاوزه. diagnostic وB المقاسة مرّا؛ نجاح M01/ledger وبقية M02–M08 وmanifest/transition/counts والشاهدان المقصودان لم يثبت. finally(absent) مرّ بعد فشل أول apply، لكنه لا يجعل passcase ناجحًا.
- **مرجع Git:** docs:context لحالة الفرع وPR؛ commits عادية بلا rebase/force-push؛ #175 Draft فقط. CI وDeploy Pages المعتادان مأذونان بلا skip-ci أو نشر إضافي أو preview أو polling. SQL وpackets الهاتف وsupabase/manual وaccepted behaviour/tests لـRAD-086 ثابتة؛ marker أعيد حسابها وثبتت.
- **مخاطر معلنة:** gate مغلقة والعامل NOLOGIN والسر DISABLED. على المستعادة diagnostic كامل وB exactly relations false مع كل13نوعًا وبلا null/تكرار؛ صفر/اختلاف STOP pre_frozen_b. ذلك لا يعفي B الحية أو STOP M01 أو الهاتف والحقوق/الخصوصية/O4 وACK والبديل و4ب/5ب؛ نافذة≤60دقيقة وشروطها باقية.

## المتابعة

اقرأ قياس القائمة قبل الترميز ثم سجل CI البروفة الذي توقف M01 في التقرير. حكم B المصحح مثبت؛ المتابعة تشخيص أول apply، لا تعديل حكم B مجددًا أو تجاوز STOP. المخرجات counts/yes-no/STOP ومراحل وSQLSTATE/errno فقط؛ observer kinds للاختبار الاصطناعي وحده. لا pre-initializer أو initializer replay على نسخة الإنتاج، ولا SQL حي أو Variables من الوكيل.

المصادقة المؤقتة socket SCRAM تحافظ على postgres غير superuser والكتالوج/الامتيازات؛ لا تغيير لها من تخمين سبب M01. teardown في finally. الصورة محجوبة محليًا بعائق المساحة الموثق؛ لا صورة بديلة أو driver change أو skip. CI هي الدليل الفعلي. يبقى [دليل P9](RAD-062_P09_LAPTOP_RUNBOOK.md) وP10 والهاتف والإرجاع حاكمًا؛ إذا تقدمت main ادمجها عاديًا وأعد QA المتأثرة وmarker. لا ready/merge/auto-merge أو عامل/gate/LOGIN/secret من الوكيل.
