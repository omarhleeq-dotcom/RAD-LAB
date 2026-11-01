# التسليم الحالي — RAD-062: إعادة حكم P9b بعد قياس CI

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ استمر في checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer؛ P10 Draft #175. [التقرير الحالي](RAD-062_P10_REPORT_2026-10-30.md) و[القرار](DECISIONS.md#rad062-owner-rehearsal-2026-11-01) يحفظان قياس CI17.11 الذي طبع relations وحدها قبل ترميز التوقع؛ لذلك أعيد حكم [P9b](RAD-062_P09B_REPORT_2026-10-30.md). diagnostic ينجح كاملًا على المستعادة، وB تفشل relations فقط مع الأنواع13 كاملة بلا null/تكرار؛ صفر أو اختلاف STOP pre_frozen_b.
- **ينتظر المالك:** B المجمدة ready بالكامل على live غير المستعادة بقراءة المالك فقط؛ لا قراءة حية من الوكيل. ثم أمر البروفة على latest الحقيقية يجب أن ينجح كاملًا قبل RAD062_RESTORE_VERIFIED=yes أو حجز النافذة. RAD-086 done بإفادة المالك السابقة؛ RAD-059 review/owner للقنوات/ACK والبديل وإلغاء اعتماد العامل.
- **ينتظر مراجِعًا:** اختبار الصورة بعد ترميز الحكم المقاس، وكل M01–M08 وmanifest/transition/counts وشاهدي check/M01 والـteardown. قياس kinds وغياب بقايا الحاوية عند STOP السابق ليسا نجاح البروفة الكاملة؛ أي فشل تالٍ STOP دون تغيير SQL أو توقع آخر. auth مثبت من CI السابقة مع postgres غير superuser وثبات صفاته/عضوياته.
- **مرجع Git:** docs:context لحالة الفرع وPR؛ commits عادية بلا rebase/force-push؛ #175 Draft فقط. CI وDeploy Pages المعتادان مأذونان بلا skip-ci أو نشر إضافي أو preview أو polling. SQL وpackets الهاتف وsupabase/manual وaccepted behaviour/tests لـRAD-086 ثابتة؛ marker أعيد حسابها وثبتت.
- **مخاطر معلنة:** gate مغلقة والعامل NOLOGIN والسر DISABLED. قياس B المستعادة لا يعفي B الحية غير المستعادة أو الهاتف والحقوق/الخصوصية/O4 وACK والبديل و4ب/5ب. نافذة≤60دقيقة وشروطها باقية؛ لا SQL حي أو Variables من الوكيل.

## المتابعة

اقرأ دليل قياس القائمة في التقرير ثم CI البروفة بعد الترميز. التوقع الوحيد المصحح هو pre-M01 frozen B على النسخة المستعادة وفق P9b؛ لا إعفاء أو normalization أو تغيير SQL. CLI المالك لا يطبع kinds؛ observer للاختبار الاصطناعي فقط، والمخرجات الباقية counts/yes-no/STOP ومراحل وSQLSTATE/errno المحجوبة. لا pre-initializer أو initializer replay على نسخة الإنتاج.

المصادقة المؤقتة socket SCRAM تحافظ على postgres غير superuser والكتالوج/الامتيازات؛ teardown في finally. الصورة محجوبة محليًا بعائق المساحة الموثق؛ لا صورة بديلة أو driver change أو skip. CI هي الدليل المطلوب. يبقى [دليل P9](RAD-062_P09_LAPTOP_RUNBOOK.md) وP10 والهاتف والإرجاع حاكمًا؛ إذا تقدمت main ادمجها عاديًا وأعد QA المتأثرة وmarker. لا ready/merge/auto-merge أو عامل/gate/LOGIN/secret من الوكيل.
