# التسليم الحالي — RAD-062: بروفة المالك الموحدة من RAD-086

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ استمر في checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer؛ P10 Draft #175 على الفرع القائم. [تقرير البروفة](RAD-062_P10_REPORT_2026-10-30.md) و[قرارها](DECISIONS.md#rad062-owner-rehearsal-2026-11-01) يوثقان استبدال initdb في §3 بأمر واحد يستخدم استعادة RAD-086 نفسها ثم postgres غير superuser وapply القائمة والفحوص والانتقال والعدادات قبل teardown. لا تغيير SQL أو expectations أو مهلات/حراس أو marker.
- **ينتظر المالك:** نجاح `node scripts/assess/rad062-laptop-rehearsal.mjs` على latest الحقيقية قبل تصدير RAD062_RESTORE_VERIFIED=yes أو حجز النافذة؛ B المجمدة والتشخيص مطلوبان ready قبل M01 بلا إعفاء ACL أو pre-initializer. RAD-086 done بإفادة المالك السابقة؛ لا دليل مالك جديد من هذه الدفعة. RAD-059 review/owner للقنوات/ACK والبديل وإلغاء اعتماد العامل.
- **ينتظر مراجِعًا:** اختبار الصورة الاصطناعي المطلوب pass وشاهدي فشل check/migration وteardown في CI، ثم مراجعة البروفة وبقية شروط P10؛ محليًا لم يبدأ شاهد الصورة لأن pull فشل بنفاد مساحة daemon. أي عجز postgres عن apply أو فشل B/check/transition/counts/teardown STOP وتقرير، بلا elevation أو إصلاح SQL لإخفائه. الأدلة وQA المنفذة وغير المنفذة في التقرير.
- **مرجع Git:** docs:context لحالة الفرع وPR؛ commits عادية بلا rebase/force-push؛ #175 Draft فقط. CI وDeploy Pages المعتادان مأذونان بلا skip-ci أو نشر إضافي أو preview أو polling. packetا الهاتف وsupabase/manual وكل SQL والاختبارات المقبولة السابقة ثابتة.
- **مخاطر معلنة:** gate مغلقة والعامل NOLOGIN والسر DISABLED. لا حجز النافذة من اختبار رفض المحددات أو تعديل الدليل؛ نافذة≤60دقيقة من أول M01 COMMIT إلى تحقق P10 والنشر المعتاد والهاتف. الحقوق/الخصوصية/O4 وACK والبديل و4ب/5ب مستقلة؛ لا SQL حي أو Variables من الوكيل.

## المتابعة

تحقق من GitHub ونتيجة check على الرأس الحالي واقرأ قسم البروفة الحالي في التقرير. الأمر الجديد يرفض live selectors وhost غير loopback ولا يقرأ حيًا؛ يحتاج Docker daemon المحلي والصورة المثبتة وأدوات age القائمة، لا PostgreSQL مثبتًا محليًا. لا تغيّر accepted behaviour أو tests لـlaptop-restore-test. عائق الصورة المحلي لا يبرر skip أو صورة بديلة أو تغيير storage driver. أصلحه عبر بيئة ذات مساحة كافية ثم شغّل الاختبار المطلوب، أو استند إلى دليل CI الفعلي؛ لا تفترض نجاحه.

بعد نجاح الاختبار والمراجعة، المالك يشغّل الأمر من اللابتوب؛ عند أي STOP لا يصدّر restore verified ولا يحجز اليوم. يبقى ترتيب [P9](RAD-062_P09_LAPTOP_RUNBOOK.md) وP10 والهاتف والإرجاع المعتمد حاكمًا. إذا تقدمت main: merge عادية دون rebase/force-push، تحقق البايتات وأعد QA المتأثرة وmarker المصدر قبل إعادة المراجعة. لا ready/merge/auto-merge أو تشغيل عامل أو gate/LOGIN/secret من الوكيل.
