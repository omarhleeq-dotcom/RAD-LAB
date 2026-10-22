# فحص اتصال Cloud Run دون تشغيل Assess

## النطاق والدليل الحالي

أذن المالك في 2026-10-22 عمّان باختبار دخول مدته ساعة مع استثناء TEMP لهذه النافذة فقط. وصل نجاح psql من Cloud Shell: database=postgres وsession_user=assess_job_a وcurrent_user=assess_worker وread_only=on ثم ROLLBACK. أُغلق الحساب صراحةً بعده ووصل login_disabled=true وexpired=true. لا تمديد تلقائي للنافذة ولا دليل على قراءة كلمة السر المحفوظة من ذلك؛ أدخل المالك كلمة الاختبار يدويًا.

نسخة السر1 ENABLED ومركّبة في Job العامل على /run/secrets/assess-worker.json، مع ASSESS_JOB_ENABLED=0 وصورة العامل المثبتة السابقة. [تقرير Google](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#connection-owner-followup) يحفظ الشواهد وحدودها. الأداة الجديدة [connection-probe](../scripts/assess/connection-probe.mjs) مستقلة؛ لا تستورد العامل أو تستدعي health/claim/maintain/publish/recover أو جداول مستخدمين.

## ما يثبته الفحص وحدوده

يفتح ملف السر بمساره الثابت قراءةً بحد64KiB، ويفرض الحقول السبعة والوجهة/login/ref والـCA الأصلية المراجعة. pg يركب الاسم المركب ويستخدم rejectUnauthorized=true وفحص hostname الافتراضي، client واحد، connect10s/query10s وstatement5s/lock2s. default_transaction_read_only=on ثم BEGIN READ ONLY؛ يتحقق من هوية login وأعلام الدور وعضويته الوحيدة قبل SET LOCAL ROLE ثم يتحقق من هوية العامل وread_only. ينهي ROLLBACK ثم client.end؛ أي فشل حتى أثناء الإغلاق يرجع STOP فقط بلا خطأ خام. مهلة العملية45s تنهيها عند التعليق؛ قطع العملية يغلق النقل لكنه لا يثبت أن المزود أغلق كل cache/frontend فورًا.

النجاح يطبع فقط assess-connection-probe/1 وoutcome=PASS وruntimeOrLaunchVerified=false. يثبت قراءة نسخة السر والاتصال بـNode من الحاوية عند حصول شاهد Google فعلي؛ لا يثبت أن العامل الفعلي نُفذ، أو JWT/قبول وظيفي/استرداد/إلغاء Supavisor أو كل صلاحيات النظام. READ ONLY تمنع الكتابة المعتادة، وليست عزل أمان ضد المشغّل المخول بتغيير الصورة. لا قراءة payload في CLI أو logs، لا secret في image/args/ENV؛ لا debug أو transcript. يبقى أثر الجزء المكشوف من كلمة العامل الذي رفض المالك تدويره خطرًا معلنًا، دون إعادة نشره.

## شاهد Google المنجز

وصل [شاهد المالك النهائي](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-owner-pass): Cloud Build SUCCESS ثم Job تشخيص بالصورة المثبتة ونسخة السر، execution مكتملة وlog PASS، ثم login_disabled=true/expired=true. أُعيد الفتح داخل النافذة الأصلية نفسها دون تمديد الموعد، وأُغلق بعد الفحص. الاتصال من Cloud Run مثبت لهذه الصورة والنسخة والتنفيذ؛ عامل Assess الفعلي لم يُشغَّل. وصل بعدها [شاهد الإغلاق النهائي](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-closed-final): login_disabled=true وexpired=true وbackend_sessions=0 وlaunch_gate_closed=true. لا إعادة هذه الخطوات الناجحة أو فتح login تلقائيًا؛ المتبقي إلغاء cache/رفض اتصال جديد وبوابات التشغيل المستقلة، وليس إعادة عدّ الجلسات للحصول على الدليل نفسه.

## مرجع التجهيز دون إعادة نقل المشروع

ينقل المالك ملفي connection-probe.mjs وbuild-connection-probe.mjs من رأس PR المراجع إلى scripts/assess داخل مصدر Cloud Shell القائم فقط. يثبت بصمتي الملفين قبل البناء، ولا ينقل secret أو كامل المشروع أو node_modules. تُعطى روابط الرأس والبصمات من التسليم، لا raw URL يحوي token خاصًا.

من جذر المصدر القائم:

```bash
node scripts/assess/build-connection-probe.mjs
```

يحوي سياق الإخراج ملفين فقط: probe.mjs المجمّعة مع pg الحالية وDockerfile بقاعدة Node24 المثبتة نفسها وUSER node. لا عملية سحابية من builder. يبني المالك صورة تشخيص جديدة في assess-runtime باسم assess-connection-probe:check-v1 من المسار الذي أعاده builder، ثم يرفعها ويسجل digest الفعلية؛ لا إعادة بناء/استبدال صورة العامل. لا وصف بناء Docker حقيقي ناجح قبل شاهد صاحبه؛ الاختبار المحلي على artifact لا يثبت تشغيل container أو google mount.

تُنشأ Job منفصلة assess-connection-check، europe-west3، بصورة التشخيص المثبتة digest لا tag فقط، SA assess-job الحالية، secret mount المثبت1، tasks1/parallelism1/retries0/timeout60s/cpu1/memory512Mi وASSESS_JOB_ENABLED=0. تراجع metadata بعد الإنشاء دون execute تلقائي؛ نفس SA تعني نفس منح السر الحالية، وليست عزلًا جديدًا لها. لا resource أو IAM أو secret version جديدة من الوكيل.

## نافذة الاختبار والإغلاق

الحساب مغلق الآن بعد PASS. خطوات النوافذ هنا مرجع لأي اختبار لاحق: يتفق المالك على موعد محدد، ولا تمديد لإذن TEMP أو إعادة فتح ضمنية. الاختبار المنجز استعمل الموعد الأصلي نفسه بعد إعادة الفتح داخله، لا نافذة ثانية. لا تضع كلمة postgres داخل السر أو الحاوية. تتوقف المحاولة عند STOP أو غموض execution؛ يفحص status/logs المنقحة أولًا، لا إعادة تنفيذ عمياء.

يُغلق LOGIN وتُنهى صلاحيته بعد المحاولة، وتُفحص جلساته ومصادقة جديدة منفصلًا. إغلاق NOLOGIN وحده لا يقتل جلسة قائمة؛ [خطة الإلغاء](ASSESS_WORKER_LOGIN.md#الإلغاء-الفعلي-وإثباته) تحفظ حدود backend/cache. لا تعديل JOB العامل أو gate أو schedule أثناء هذه المتابعة. ميزانية$5 تنبيه وليست cap؛ يمكن للبناء والتخزين والتنفيذ استهلاك الحصة.

Scale: أداة تشخيص مؤقتة بوجهة واحدة وإصدار سر ثابت واتصال واحد، وليست منصة متعددة المستأجرين أو scheduler. تغيير المشروع/login/CA أو إضافة وجهة يتطلب مراجعة صريحة بدل تعميم ضمني. المراجعة الطبية/التقييم/Practice محفوظة.
