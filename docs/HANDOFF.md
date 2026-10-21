# التسليم الحالي — حاوية Assess المحلية لـCloud Run Jobs

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع تحقق GitHub لأحدث main و#96 وفحوص كل رأس مقصود، ثم status:summary لـRAD-056. [project-status](project-status.md) مصدر الحالة الوحيد. تابع checkout المعزول؛ لا worktree/subagents أو QA ناجحة معادة بلا تغير ذي صلة.

## المنجز
اختيار [Google Cloud Run](DECISIONS.md#assess-cloud-run-owner-2026-10-21) محفوظ. أُعدت حاوية Node24 خاصة بغير root وentrypoint تنفذ runAssessJobs مرة واحدة بحد1 ثم تغلق النقل القائم، دون HTTP أو schedule أو purge/recovery مكررة. [الدليل](ASSESS_RUNTIME_LOCAL.md) و[تقرير الحاوية](ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md) يحفظان بناء الصورة المحلي ورفض الإعداد وتنقيح المخرجات واختبارات SIGTERM/SIGINT/القتل وCOMMIT. لا سر أو اتصال مزود في الصورة.

## الخطوة التالية
عولج عائق اسم Session pooler محليًا بفصل user (login DB) عن sessionPoolerProjectRef (لاحقة اسم النقل)، مع بقاء ACL وSET LOCAL ROLE وTLS؛ [الدليل](ASSESS_RUNTIME_LOCAL.md#إعداد-session-pooler-المحلي) و[تقرير المتابعة](ASSESS_SESSION_POOLER_REPORT_2026-10-21.md). المرشح europe-west3 قرب DB Frankfurt، وsession5432 عبر IPv4 بحسب إفادة المالك؛ transaction6543 خارج النطاق. التالي مراجعة الكود ثم حسم hostname/CA وstartup options والشبكة والإلغاء والتنبيه ومسؤول وبديل ضمن إذن اختبار خارجي مستقل. الدور ما زال أوسع من tick-only؛ لا نجاح Supavisor أو TLS حي مستنتج.

راجع [حزمة القرار المحدثة](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md)؛ أظهر المالك حساب Google تجريبيًا وميزانية تنبيه محفوظة$5 على حساب Billing، لا spend cap أو مراقبة عامل مثبتة. لا إعادة إنشاء الميزانية أو سؤال المزوّد/النسخة. لا شراء IPv4/NAT أو إنشاء Job/سر/SA أو SQL أصلية أو Variables من التسليم.

فحص PID1 داخل Docker استخدم worker محاكى، وشاهد القتل استخدم PostgreSQL محلية باتصالات مستقلة ونقل Unix socket بلا TLS. لا يثبتان Google/JWT/TLS أو PID1+المزوّد معًا، ولا ضمان تسوية معاملة60ثانية خلال نافذة إنهاء10ثوانٍ. يبقى lease/الاسترداد مرجع عدم اليقين دون retry عمياء أو صفر مصطنع. تحقق نتائج رأس #96 الجديد مستقل؛ نجاح Pages لا ينشر runtime ولا يثبت هاتفًا جديدًا.

## الأدلة المكتملة وحدودها
وصل [صف SQL النهائي](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-install-owner-result) و[زوج retention المغلق PASS المتطابق](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-closed-pair-owner-result). لا إعادة installer/preinstall/postinstall أو أدوات الحسابين لمجرد شاهد. runtimeOrLaunchVerified=false مقصودة؛ القراءات ورفض الوصول المباشر لا تثبت قبول v2 أو start/close/disable/تصحيح/صيانة/حذف حي. اختبار SQL اصطناعي تحت login محدود ليس شبكة pg/TLS أو JWT مزود؛ v1 لا تنوب عن v2 ولا قبول نيابة عن أحد. هاتف F يخص مرحلته.

<a id="المتابعة"></a>
## المتبقي والحدود الثابتة
[اختار المالك المتابعة دون نسخة الآن ونسخة شاملة عند انتهاء العمل](DECISIONS.md#assess-retention-original-no-backup-2026-10-20)؛ لا إعادة سؤال أو تجهيز تلقائي. backup/recovery/provider غير مثبتة. restore تحتاج حجر الشبكة/API/الهويات ثم إعادة آثار الإغلاق والتعطيل والموافقة وmetadata المحذوفة والحذف وفحص ACL؛ purge النتائج وlaunch_gate وحدهما لا يحجران القراءات. لا نظام نسخ إنتاجي أو تصدير عام.

Practice ودرجاته وصوره وتوقعاته وبصماته محفوظة. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، وruntime والعامل والجدولة والمراقبة والنسخ والاستعادة والتصدير والنشر بوابات مستقلة. لا SQL كتابة على الأصلية أو تغيير PILOT_SCHEMA_VERIFIED/إعداد إنتاج أو نشر runtime/عامل/schedule أو ready/merge/auto-merge. تبقى launch_gate مغلقة؛ القبول التجريبي الحي غير مكتمل.
