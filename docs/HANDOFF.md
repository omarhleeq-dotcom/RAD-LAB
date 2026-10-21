# التسليم الحالي — حاوية Assess المحلية لـCloud Run Jobs

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع تحقق GitHub لأحدث main و#96 وفحوص كل رأس مقصود، ثم status:summary لـRAD-056. [project-status](project-status.md) مصدر الحالة الوحيد. تابع checkout المعزول؛ لا worktree/subagents أو QA ناجحة معادة بلا تغير ذي صلة.

## المنجز
اختيار [Google Cloud Run](DECISIONS.md#assess-cloud-run-owner-2026-10-21) محفوظ. أُعدت حاوية Node24 خاصة بغير root وentrypoint تنفذ runAssessJobs مرة واحدة بحد1 ثم تغلق النقل القائم، دون HTTP أو schedule أو purge/recovery مكررة. [الدليل](ASSESS_RUNTIME_LOCAL.md) و[تقرير الحاوية](ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md) يحفظان بناء الصورة المحلي ورفض الإعداد وتنقيح المخرجات واختبارات SIGTERM/SIGINT/القتل وCOMMIT. لا سر أو اتصال مزود في الصورة.

## الخطوة التالية
وصل [صف NOLOGIN](ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md#worker-login-stage-owner-result) الناجح؛ لا replay. انتقل المالك إلى الربط من Google دون psql كشرط على اللابتوب، ونفّذ Cloud Shell لإنشاء assess-job والسر assess-worker-config في europe-west3 وربط secretAccessor على السر نفسه، ثم repo assess-runtime وتفعيل Run/Artifact Registry. [تقرير التجهيز](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md) يحفظ الشواهد والجرد وتغيير كلمة الإدارة الذي أبلغ به وفشل المصادقة اللاحق؛ لا إعادة reset/تخمين أو إنشاء موارد مثبتة.

وصل PASS لنقل ZIP المصدر المتحقق865ملفًا إلى Cloud Shell، ثم build-runtime وDocker build/push وصورة source-6b568a2 ذات index digest الموثقة في [التقرير](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md)، ثم نجاح إنشاء assess-worker بالصورة المثبتة وASSESS_JOB_ENABLED=0 بلا secret mount أو execute. لا إعادة نقل/بناء/رفع/إنشاء. التالي job describe وsecret versions metadata دون payload؛ لم يثبت execution count أو إعداد فعلي بقراءة مستقلة بعد. الحارس=0 لا يسحب صلاحية run من IAM؛ لا تضغط Execute أو تقبل overrides من ذلك. [مقترح TEMP والقناة](ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) ما زال مشروطًا وDB login بلا تفعيل مثبت؛ لا admin postgres للعامل أو ادعاء اتصال DB من create. اشرح وظيفة كل خطوة للمالك.

راجع [حزمة login](ASSESS_WORKER_LOGIN.md)؛ تُقبل عضوية ADMIN-only للمشغّل المنشئ غير superuser دون SET/INHERIT، مع رفض غيرها. صف المالك أثبت PostgreSQL17.11 وPUBLIC TEMP=true وschema CREATE0؛ لا سحب PUBLIC أو قبول LOGIN من ذلك. قبل التفعيل تبقى قناة السر/surface/صلاحيات الإدارة والقتل واختبار المزود مستقلة. الدور أوسع من tick-only، ولا كلمة مرور أو قبول تشغيل حي من تسليم login المغلق.

أرسل المالك PASS لفحص TLS1.2 وhostname وجذر CA المطابق من جهازه دون login/SQL؛ لا إعادة الشاهد دون تغير. لا revocation للشهادة أو شبكة Google/Node أو startup options/backend identity/ACL أو إلغاء Supavisor ثبتت بذلك. المرشح europe-west3/session5432 و[دعم الاسم المحلي](ASSESS_RUNTIME_LOCAL.md#إعداد-session-pooler-المحلي) محفوظان؛ transaction6543 خارج النطاق. راجع [حزمة القرار](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md)، ولا تعِد إعداد حساب Google/ميزانية$5 المحفوظين أو سؤال النسخة/المزوّد.

فحص PID1 داخل Docker استخدم worker محاكى، وشاهد القتل استخدم PostgreSQL محلية باتصالات مستقلة ونقل Unix socket بلا TLS. لا يثبتان Google/JWT/TLS أو PID1+المزوّد معًا، ولا ضمان تسوية معاملة60ثانية خلال نافذة إنهاء10ثوانٍ. يبقى lease/الاسترداد مرجع عدم اليقين دون retry عمياء أو صفر مصطنع. تحقق نتائج رأس #96 الجديد مستقل؛ نجاح Pages لا ينشر runtime ولا يثبت هاتفًا جديدًا.

## الأدلة المكتملة وحدودها
وصل [صف SQL النهائي](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-install-owner-result) و[زوج retention المغلق PASS المتطابق](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-closed-pair-owner-result). لا إعادة installer/preinstall/postinstall أو أدوات الحسابين لمجرد شاهد. runtimeOrLaunchVerified=false مقصودة؛ القراءات ورفض الوصول المباشر لا تثبت قبول v2 أو start/close/disable/تصحيح/صيانة/حذف حي. اختبار SQL اصطناعي تحت login محدود ليس شبكة pg/TLS أو JWT مزود؛ v1 لا تنوب عن v2 ولا قبول نيابة عن أحد. هاتف F يخص مرحلته.

<a id="المتابعة"></a>
## المتبقي والحدود الثابتة
[اختار المالك المتابعة دون نسخة الآن ونسخة شاملة عند انتهاء العمل](DECISIONS.md#assess-retention-original-no-backup-2026-10-20)؛ لا إعادة سؤال أو تجهيز تلقائي. backup/recovery/provider غير مثبتة. restore تحتاج حجر الشبكة/API/الهويات ثم إعادة آثار الإغلاق والتعطيل والموافقة وmetadata المحذوفة والحذف وفحص ACL؛ purge النتائج وlaunch_gate وحدهما لا يحجران القراءات. لا نظام نسخ إنتاجي أو تصدير عام.

Practice ودرجاته وصوره وتوقعاته وبصماته محفوظة. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، وruntime والعامل والجدولة والمراقبة والنسخ والاستعادة والتصدير والنشر بوابات مستقلة. إذن تجهيز Google للربط لا يفتح بوابة Assess أو يأذن tick يكتب على الأصلية؛ لا تغيير PILOT_SCHEMA_VERIFIED أو نشر/تشغيل عامل أو schedule أو ready/merge/auto-merge من خطوة رفع الصورة وحدها. تبقى launch_gate مغلقة؛ القبول التجريبي الحي غير مكتمل.
