# التسليم الحالي — RAD-062: قياس B المستعادة وفق تصحيح P9b

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ استمر في checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer؛ P10 Draft #175 على الفرع القائم. [تقرير التشخيص](RAD-062_P10_REPORT_2026-10-30.md) و[القرار](DECISIONS.md#rad062-owner-rehearsal-2026-11-01) يحفظان دليل CI: connect/28000 ثم إصلاح socket-only SCRAM مع password عشوائية لكل تشغيل، ثم STOP pre_frozen_b قبل M01. لا تغيير SQL أو expectations أو مهلات/حراس أو marker.
- **ينتظر المالك:** لا تشغيل M01 أو حجز نافذة أو تصدير RAD062_RESTORE_VERIFIED=yes حتى تنجح البروفة كاملة؛ تصحيح المالك يعيد P9b: B جاهزة على live غير المستعادة بقراءة المالك؛ على المستعادة diagnostic كامل وB relations فقط بعد قياس CI، بلا pre-initializer. RAD-086 done بإفادة المالك السابقة؛ لا دليل نسخ مالك جديد. RAD-059 review/owner للقنوات/ACK والبديل وإلغاء اعتماد العامل.
- **ينتظر مراجِعًا:** قياس قائمة kinds الفاشلة فقط في CI الاصطناعية قبل ترميز حكم P9b: relations وحدها تجيز التوقع المأذون، وأي اختلاف/صفر STOP وتقرير دون تبنيه. لا تغيير check/fixture/SQL. CI أثبتت قبل هذا STOP قاعدة peer/ident وإصلاح SCRAM/reload وثبات pg_roles/العضويات واتصال postgres غير superuser ونجاح التشخيص. M01–M08 وبقية الفحوص وشاهدا الفشل لم تُبلَغ. أدلة QA وحدودها في التقرير.
- **مرجع Git:** docs:context لحالة الفرع وPR؛ commits عادية بلا rebase/force-push؛ #175 Draft فقط. CI وDeploy Pages المعتادان مأذونان بلا skip-ci أو نشر إضافي أو preview أو polling. packetا الهاتف وsupabase/manual وكل SQL واختبارات RAD-086 المقبولة ثابتة.
- **مخاطر معلنة:** gate مغلقة والعامل NOLOGIN والسر DISABLED. إزالة خطأ الاتصال لا تعني نجاح البروفة؛ STOP عند B محجوب. نافذة≤60دقيقة وشروط الهاتف والحقوق/الخصوصية/O4 وACK والبديل و4ب/5ب مستقلة؛ لا SQL حي أو Variables من الوكيل.

## المتابعة

اقرأ تصحيح المالك في أعلى التقرير ودليل P9b الأصلي. observer الاختبار الاصطناعي يطبع القائمة المرتبة فقط؛ لا يغيّر STOP بعد. اقرأ CI أولًا؛ إن كانت relations وحدها ثبّت التوقع مع كل الأنواع وبلا null/تكرار، ثم شغّل البروفة الكاملة. أي اختلاف STOP وتقرير دون ترميز الاختلاف. المخرجات تسمح فقط بالعدد/نعم-لا/STOP والمراحل وSQLSTATE/errno المحجوبة؛ لا messages/hosts/names/data. الأمر يرفض live selectors وhost غير loopback، ولا يقرأ حيًا. الحاوية network=none بلا ports؛ المصادقة الجديدة تخص local/rad_restore/postgres، ولا تغير صلاحيات التطبيق أو supautils. لا تعديل accepted behaviour/tests لـlaptop-restore-test.

محليًا أُفرغت npm cache والصور/build cache غير المستخدمة؛ لم توجد مساحة مستردة، وpull للصورة المثبتة فشل مجددًا بنفاد المساحة. لا صورة بديلة أو تغيير storage driver أو skip. CI هي الدليل الفعلي؛ لا تدّع نجاح pass أو teardown witnesses اللاحقة من هذا الفشل. يبقى ترتيب [P9](RAD-062_P09_LAPTOP_RUNBOOK.md) وP10 والهاتف والإرجاع حاكمًا. إذا تقدمت main: merge عادية ثم QA المتأثرة وحساب marker قبل إعادة المراجعة. لا ready/merge/auto-merge أو عامل/gate/LOGIN/secret من الوكيل.
