# تجهيز Google من Cloud Shell وتسليم حزمة الصورة — 2026-10-21 عمّان

## 1. السلطة والميزانية والانحرافات

طلب المالك الانتقال إلى ربط Cloud Run بـSupabase مباشرةً دون جعل psql على اللابتوب شرطًا، ثم نفذ خطوات إنشاء الهوية والسر ومستودع الصور. هذا إذن تجهيز خارجي ضمن الموارد المحددة، يحدّث منع الإنشاء السابق لهذه الموارد فقط؛ لا يفتح launch_gate أو يأذن merge/ready أو تغيير Variables أو تجاوز TLS أو تشغيل tick يكتب على الأصلية دون نطاقه المراجع. الحساب الإداري postgres ليس login العامل.

الميزانية المعروضة أربعة ملفات توثيق وهي الفعلية: هذا التقرير وASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md وHANDOFF.md وproject-status.md. الحزمة الناتجة خارج checkout، لا binary/generated code ملتزمة ولا worktree/subagents أو تغيير كود/SQL/guard/package/lock. معيار القبول بناء مصدر الرأس القائم والتحقق من هوية ملفات السياق وخلوه من أسرار وفصل تجهيز الموارد عن التشغيل. لا انحراف في ملفات المصدر.

## 2. المنجز والمستبعد وشواهد المالك

المشروع Google: project-bff9124a-ec31-4d57-bc0 ورقمه الظاهر في describe هو124842667755. هذه شواهد صور Cloud Shell من المالك وليست اتصال إدارة مستقلًا من الوكيل:

| المورد/الفحص | الشاهد | ما لا يثبته |
|---|---|---|
| Service account | ظهر Service account created لهوية assess-job، ثم policy على السر تشير إلى assess-job@project-bff9124a-ec31-4d57-bc0.iam.gserviceaccount.com | لا جرد مفاتيح أو effective IAM أو inherited roles من الصورة |
| secret metadata | describe أعاد projects/124842667755/secrets/assess-worker-config وuserManaged replicas location=europe-west3 | لا قراءة payload أو list versions؛ لا نجزم بأن السر فارغ من metadata وحدها |
| secret IAM | get-iam-policy bindings عرضت عضو serviceAccount المذكور مع roles/secretmanager.secretAccessor | منحة على هذا السر؛ لا عزل إصدار أو إثبات غياب صلاحيات موروثة/أسرار أخرى |
| Run/Artifact Registry API | gcloud services enable أعاد Operation finished successfully | لا إنشاء Job أو execution من تفعيل API |
| registry | Created repository [assess-runtime] بعد create repository-format=docker/location=europe-west3 | لا صورة/رفع/digest أو فحص سياسة repository/effective access |

حدث لصق مخرجات terminal كأوامر وظهرت bash syntax/command-not-found ثم prompt='>' بسبب quote غير مغلقة. أُلغي الإدخال بـCtrl+C حتى عاد '$' ثم نُفذت describe وget-iam-policy بنجاح؛ لا إعادة إنشاء الموارد بعد إثبات وجودها، ولا استنتاج فشل provisioning من أخطاء اللصق وحدها. التعليمات التالية سطر أو كتلة أوامر فقط، دون prompt أو المخرجات.

المسار النهائي Cloud Run→Supabase session pooler5432→DB. psql أداة تشخيص/إدارة وليست proxy أو جزءًا من مسار الخدمة؛ لا حاجة لإبقاء اللابتوب شغالًا. user runtime يبقى assess_job_a ويضيف النقل projectRef، وليس postgres أو كلمة الإدارة.

### تسليم حزمة بناء الصورة

بُنيت عبر scripts/assess/build-runtime.mjs من الرأس aefb857a218b109a5367412674dc83882b419267 والحزم الحالية المقفلة، ثم أُرشفت allowlist فقط خارج checkout:

| الملف | SHA256 |
|---|---|
| Dockerfile | 24ed5817007170957dc6b4014ae0984efa54097ee739f0e9c063c76027d8c2b2 |
| assess-job.cjs | d8ba9f87acd31f25d0dc85542d93d0e6040bb2707816cbe1eb4b5d91e96590be |
| job-main.mjs | dde1c322e4d68762fb7750ba68174300e0894597947c6e5a0ae9c8911167356a |

اسم الأرشيف assess-cloud-run-build-aefb857.tar.gz، حجمه184086byte وSHA256=592db3003098dfdf6e5fca8d3f4d0267b09f550e031e190d00c22e9076f5bba4. المسار المحلي للتسليم /workspace/exports/assess-cloud-run-build-aefb857.tar.gz، خارج git. محاولة /mnt/data فشلت PermissionError قبل كتابة الأرشيف؛ استُخدم مجلد exports المملوك للبيئة دون تصعيد أو تغيير صلاحيات النظام. لا رابط تنزيل sandbox مفترض أو public release/GitHub credentials في الأرشيف. المستودع private؛ لا curl public أو مشاركة token لجلب المصدر.

الملفان المنسوخان يطابقان Dockerfile وentrypoint المراجعتين byte-for-byte، والمحتويات المستخرجة تطابق البناء بايتًا، وكل entries ملفات عادية بأسماء محددة، دون مسارات مطلقة أو links أو أسرار/CA/config/env أو باقي checkout. gzip/tar metadata ثابتة. Dockerfile مثبتة على base digest السابقة وتستعمل USER node؛ لا npm install داخل الصورة أو Cloud Build. هذه **حزمة build context** وليست صورة OCI أو digest صورة منشورة.

## 3. لكل مهمة

RAD-056 تبقى review/waiting_on owner لرفع الحزمة إلى Cloud Shell ثم بناء/رفع الصورة وتوفير شاهد digest. تبقى قناة credential ومراجعة PUBLIC/TEMP وهوية backend والإلغاء ومسؤول التشغيل والتنبيه غير مكتملة؛ no completion_evidence أو done. حدّث الوصف/source_ref والملخص الخماسي وrevision/time فقط للمهمة؛ تعارض RAD-024 الموروث محفوظ.

## 4. المشترك وScale واستمرارية الحكم

لا تغيير CPU1/memory512Mi/timeout300s/task1/parallelism1/retries0 أو عدم الجدولة وقيود الإنفاق من [حزمة القرار](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md). نقل الحزمة ثم image خاصة في repo واحدة هو سقف هذا التجهيز؛ لا repository عامة أو حفظ نسخ غير محدود. عند كل تغير runtime يلزم build جديد وdigest ومراجعة image، لا latest أو إعادة استعمال hash المصدر كـdigest للصورة.

إذن المالك غيّر الحد السابق من التحضير المحلي إلى إنشاء الموارد المسماة؛ لا يعمم إلى API key/admin DB credential أو grant على المشروع أو فتح بوابة أو قبول TEMP تلقائيًا. [تجهيز NOLOGIN](ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md#worker-login-stage-owner-result) و[توصية TEMP وقناة السر](ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) محفوظان؛ التخلي عن psql على اللابتوب لا يلغي الحاجة لاعتماد DB آمن وصلاحية فعلية قبل الاتصال أو مراجعة سطح الدور. لم يتغير حكم النسخة المؤجلة أو S-ASSESS-15/O108.

## 5. الطب والدرجات والخصوصية

لا Practice/طب/صور/درجات/expectations/hashes أو بيانات مستخدمين أو موافقات أو مصادر/ترخيص/Marker تغيرت. لا plaintext password أو verifier أو JWT أو مفاتيح Google قابلـة للتنزيل أو payload سر قرئت/كتبت. الحزمة تحتوي كود العامل فقط؛ health/worker RPC قد تكتب فلا تُستخدم تلقائيًا لاختبار read-only على الأصلية.

## 6. QA وحدود الأدلة

بدأ checkout نظيفًا على aefb857a218b109a5367412674dc83882b419267؛ docs:context/GitHub أثبتا [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) open/draft وغير مدموجة ورأسها مطابقًا، وmain ff68413042e6e8414ad70884efcfa71cac7443a7 مطابقًا لـorigin/main. check/deploy completed/success لكل من الرأسين؛ لا نقل إلى الرأس التالي أو subscribe/poll أو preview.

نجح bundling الحالي وnode --check للـCJS والـentrypoint، والتحقق من allowlist والأحجام والبصمات ومطابقة tar للمصدر المبني. تشغيل entrypoint محليًا مع ASSESS_JOB_ENABLED=0 أعاد STOP/configuration وexit1 والمخرجات المنقحة المتوقعة بلا stderr؛ لم تُحمّل credentials أو يُنشأ اتصال DB. لا Docker image جديدة بُنيت هنا أو رُفعت أو Job نُشئت/شُغلت. بناء الصورة السابق وشواهده يظلان بحدودهما في [تقرير الحاوية](ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md).

نجحت docs:check مقابل origin/main بلا errors أو review warnings وstatus:check مع require-previous وgit diff --check؛ تعارض RAD-024 الموروث بقي ظاهرًا دون تعديل. لا app build أو QA تطبيق/SQL/متصفح/Docker ناجحة معادة؛ المنتج لم يتغير. نقل archive من البيئة إلى جهاز المالك ثم Cloud Shell لم يثبت بعد؛ لا ندعي upload من إنشاء ملف محلي.

## 7. المتبقي وشواهد خارجية إضافية

أرسل المالك أسماء إعدادات Actions الخمسة فقط: CLOUDFLARE_API_TOKEN وCLOUDFLARE_ACCOUNT_ID وPILOT_SCHEMA_VERIFIED وNEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY؛ لا DB password ظاهر بينها. صور Pages Production وPreview أظهرت Variables/Secrets وBindings فارغة للمشروع نفسه. docker ps -a أعاد جدولًا فارغًا لسياق Docker الحالي، لا كل contexts أو ملفات/صور/volumes الجهاز. هذه حدود جرد استعمال الإدارة وليست ضمانًا عالميًا بعدم وجود consumers.

أفاد المالك بتغيير كلمة postgres وظهور تأكيد الحفظ، ثم استمرت auth failures؛ أرسل Pooler error من psql/session للمشروع الصحيح في state=auth_scram_final_wait. هذا رفض مصادقة، لا تشخيص مؤكد لكلمة خاطئة أو cache أو قياس Cloud Run. لا كلمة/peer IP أو raw logs محفوظة. لا طلب reset/تخمين/تثبيت psql جديد؛ انتقل المالك إلى تجهيز Google بدل تعليق العمل على هذه الأداة.

يبقى secret version/content غير مثبتين وحساب العامل بلا تفعيل مثبت، وPUBLIC/TEMP والاعتماد/المزود/IAM الموروثة/إلغاء cache والجلسات/التنبيه غير مقبولة. تخزين صورة قد يستهلك حصة/تكلفة registry؛ ميزانية التنبيه ليست cap. لا direct IPv6 أو IPv4 add-on أو NAT أو تعطيل TLS كحل بديل تلقائي. لم تُفتح gate أو تُختبر JWT/backup/restore/export أو أُذن merge/ready.

## 8. تسليم المالك وبرومت الاستئناف

التالي نقل archive وحدها إلى Cloud Shell عبر upload file، والتحقق من SHA256 قبل استخراجها إلى مجلد جديد. إن لم يتمكن المستخدم من تنزيل الملف من واجهة Codex، فالتوقف عند نقل الملف صريح؛ لا نشر الحزمة في repo عامة أو طلب token، ولا تصوير نص bundle أو لصقه كأوامر. بعد نجاح النقل، تعطى أوامر Docker build وpush إلى europe-west3-docker.pkg.dev/project-bff9124a-ec31-4d57-bc0/assess-runtime/assess-worker بوسم source-aefb857 ثم يؤخذ digest الفعلي من registry. لا Cloud Build أو إنشاء/تشغيل Job ضمن خطوة رفع الصورة.

ابدأ AGENTS وHANDOFF وRAD-056 وهذا التقرير وحزمة الربط، ثم docs:context/GitHub للرؤوس وفحوصها. تابع checkout نفسه بلا worktree/subagents؛ اشرح وظيفة كل خطوة للمالك قبل تنفيذها، وحدد ميزانية ومعايير قبول لأي تعديل. لا إعادة إنشاء Google resources أو مرحلة NOLOGIN أو TLS الناجحين؛ لا طلب سر في المحادثة أو admin login للعامل أو فتح gate أو ready/merge/auto-merge. بقية نطاق الربط يحتاج تهيئة credential آمنة وفحصًا منفصلًا قبل أي worker tick حي.
