# External Binding & Provisioning Readiness — Assess — 2026-10-21 عمّان

## صفة القرار والحدود

**مقترح محدد للمراجعة، وليس إذن provisioning أو شهادة جاهزية حية.** Cloud Run مختار في [قرار المالك](DECISIONS.md#assess-cloud-run-owner-2026-10-21). حزمة الحاوية المعتمدة محليًا وأدلتها في [الدليل](ASSESS_RUNTIME_LOCAL.md) و[التقرير](ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md). أضيف إليها دعم اسم Session pooler محليًا فقط وفق [تقرير المتابعة](ASSESS_SESSION_POOLER_REPORT_2026-10-21.md). Google IAM منفصلة عن login PostgreSQL وعن هوية المستخدم JWT؛ Pages لا يستضيف العامل.

هذه الحزمة لا تمنح إذن موارد حية أو APIs/فوترة أو SQL كتابة على الأصلية أو Variables/pins أو فتح launch_gate أو ready/merge/auto-merge. كل إجراء خارجي أدناه **وصفة مستقبلية غير منفذة** تحتاج نطاقًا مأذونًا لاحقًا. النسخة الشاملة المؤجلة باختيار المالك وO108 والبوابات المستقلة محفوظة، بلا إعادة سؤال أو إعادة الأدلة المغلقة.

## 1. إعداد التجربة والتكلفة

| البند | المقترح المحدد | شرط اعتماده قبل الإنشاء |
|---|---|---|
| المشروع | أظهر المالك My First Project بمعرف project-bff9124a-ec31-4d57-bc0 مرتبطًا بـMy Billing Account التجريبي | لقطة Console ليست تحقق agent/API؛ تثبيت صلاحية استخدامه لـAssess وهوية التشغيل والبديل ورقم المشروع قبل الإنشاء |
| region | europe-west3 (Frankfurt) وregistry بالمنطقة نفسها، بعد إفادة المالك بأن DB في AWS eu-central-1 / Central EU Frankfurt | توصية جغرافية تحل محل us-central1؛ مراجعة الإقامة وتسعير المنطقة وegress بين AWS وGoogle والـlatency قبل provisioning؛ لا نقل للقاعدة |
| الموارد | 1 vCPU، 512MiB، دون GPU، مهمة واحدة/parallelism=1/maxRetries=0 | الحد الأدنى الموثق للـJobs؛ قياس peak memory ومدة tick قبل رفع أي حد؛ لا افتراض كفاية الذاكرة من build محلي |
| timeout | task timeout=300s صراحة، runAssessJobs مرة واحدة limit=1 وpool=1 | مهلة تشغيل لا ضمان تسوية؛ SQL statement60s/lock5s/connect10s محفوظة؛ SIGTERM ثم نافذة10s قد تنتهي بالقتل، وlease5دقائق مرجع الاسترداد |
| التشغيل الأول | يدوي فقط؛ execution واحدة نشطة، بحد10 executions في اليوم و100 في الشهر كسياسة تجربة | المشغّل يفحص executions قبل run؛ هذه حدود إجرائية وليست quota منصة أو mutex. لا schedule أو تكرار فوري عند timeout/ack مفقود |
| الصورة والسر | image digest مراجع في Artifact Registry خاص؛ إصدار سر رقمي مثبت، لا latest | لا source deploy/Cloud Build أو صورة منشورة من هذه الحزمة؛ entrypoint ثابتة بلا args وASSESS_JOB_ENABLED=1 فقط عند إذن التشغيل اللاحق |

[حدود الذاكرة الرسمية](https://docs.cloud.google.com/run/docs/configuring/jobs/memory-limits) توثق حد512MiB للـJobs. [عقد الحاوية](https://docs.cloud.google.com/run/docs/container-contract) يحكم الإنهاء؛ زيادة timeout لا تلغي عدم يقين COMMIT أو تسمح بإعادة التصحيح إداريًا.

حساب تخطيطي لـ100 تنفيذ شهري ×300s: 30,000 vCPU-s و15,000 GiB-s؛ يحسب كل تنفيذ max(60s,مدة الفوترة الفعلية)، بما فيها بدء/إنهاء المثيل. [تسعير Jobs](https://cloud.google.com/run/pricing) يستخدم instance-based billing وحدًا أدنى دقيقة، مع رصيد شهري مرجعي240,000 vCPU-s و450,000 GiB-s على أساس us-central1 ومشترك على حساب Billing. عند معدلي CPU=$0.000018 وRAM=$0.000002 يكون الحوسبة الإجمالية النظرية قبل الرصيد نحو$0.57 على فرض معدلي المثال المرجعيين؛ لا يعتمد هذا الرقم كتسعير europe-west3، ويلزم تسعيرها قبل provisioning. ليست فاتورة أو سقفًا، ولا تشمل overhead أو باقي الخدمات. التشغيل كل دقيقة يتجاوز رصيد CPU حتى لو tick قصيرة بسبب حد الدقيقة؛ الجدولة قرار مستقل.

إعداد إنفاق مقترح: ميزانية مشروع شهرية$5، تنبيه actual عند$0.50/$2.50/$4/$5 وforecast عند$5، مع إيقاف التشغيل اليدوي عند أول تكلفة غير متوقعة أو بلوغ$4. تفعيل MFA وهوية بشرية مسماة، دون مفاتيح SA قابلة للتنزيل أو التزام مدفوع/CUD أو ترقية خطة DB أو إضافة IPv4 مدفوعة تلقائيًا. لا Owner/Editor للمهمة أو المشغّل. يسمح provisioning اللاحق فقط بـRun/Artifact Registry/Secret Manager والقياس الضروري؛ لا Cloud SQL/Scheduler/Cloud Build/VPC connector/NAT افتراضيًا.

[ميزانية التنبيه](https://docs.cloud.google.com/billing/docs/how-to/budgets) لا توقف الفوترة وتصل بياناتها متأخرة. توجد [spend caps](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps) للخدمات والحسابات المؤهلة؛ يفحص مسؤول Billing أهلية Cloud Run Jobs وتغطيتها وحدودها قبل اقتراح cap$5، ولا يفترض تغطية المشروع كله أو ضمان صفر تجاوز. إن لم تتوفر، تبقى الحدود الإجرائية والتنبيه فقط، بلا ادعاء hard cap. لا ربط أو تعديل Billing في هذه الجلسة.

تشمل مراجعة الفاتورة Secret Manager ونسخه/قراءاته، storage للصورة وegress بين Google وSupabase وlogs/metrics/alerts ونسخ المزود. احتفظ بصورة مراجعة واحدة ونسخة سابقة مؤقتة، بلا repositories عامة أو نسخ متعددة المناطق بلا حاجة. [Secret Manager pricing](https://cloud.google.com/secret-manager/pricing) مرجع التكلفة المستقل؛ انخفاض حساب CPU لا يعني مجانية هذه البنود.

### حالة إعداد الحساب من المالك

أظهرت لقطات المالك حساب Free trial برصيد$300 و90يومًا وتكلفة$0، وحفظ ميزانية radlab-pilot-monthly-5usd الشهرية على All projects/All services، وتنبيهات Actual10/25/50/80/100% وForecast100% مع بريد مسؤولي الفوترة. هذه **شواهد شاشة من المالك** وليست اتصالًا مستقلًا أو تجربة تسليم تنبيه؛ ليست spend cap. وُجه لاستبعاد Promotional credits وإبقاء Free tier credits؛ لم تصل لقطة بعد الاستبعاد تثبت الحفظ الفعلي لذلك الخيار، فيراجع من budget لاحقًا دون افتراض. قائمة المشاريع كانت لا تسمح باختيار منفرد فبقي نطاق الحساب كله؛ لا نسميها ميزانية مشروع واحد. لا إذن تلقائي لـJob/secret/SA من إنشاء الحساب أو الميزانية. [تقرير متابعة pooler](ASSESS_SESSION_POOLER_REPORT_2026-10-21.md) يحفظ حدود هذه الأدلة.

## 2. مصفوفة Google IAM ونطاق السر

الأسماء التالية رمزية حتى تحديد project ID/number. المورد Job واحد اسمه assess-worker، والسر الواحد assess-worker-config. **IAM يمنح الوصول إلى مورد السر، وليس إلى مسار filesystem أو حقل password داخله**؛ المسار /run/secrets/assess-worker.json ناتج mount لهذا السر وحده. لا أسرار أخرى في السر أو الـvolume أو حساب المهمة.

| الهوية | الدور/الصلاحيات | النطاق الدقيق والقيود |
|---|---|---|
| assess-job@PROJECT.iam.gserviceaccount.com | roles/secretmanager.secretAccessor: secretmanager.versions.access | على projects/PROJECT/secrets/assess-worker-config فقط، لا project-wide binding؛ لا list/create/update/destroy أو أسرار المستخدمين. النطاق لكل السر؛ تثبيت الإصدار في Job لا يجعل IAM مقيدًا بذلك الإصدار |
| هوية المشغّل البشرية المسماة، أو federated principal لاحقًا | roles/run.jobsExecutor: run.jobs.run وrun.executions.cancel فقط | IAM على Job assess-worker وحدها؛ بلا run.jobs.runWithOverrides أو update/delete/setIamPolicy أو actAs أو قراءة السر. لا allUsers/allAuthenticatedUsers ولا trigger عام |
| المشغّل للمشاهدة | دور مخصص run.jobs.get وrun.executions.get/list وrun.tasks.get/list على Job؛ run.operations.get عند الحاجة على المشروع | اختبار مسار GET/operation الفعلي قبل اعتماده؛ لا توسيع إلى run.developer لمجرد خطأ CLI. عرض logs من view مفلترة لهذا Job عبر roles/logging.viewAccessor، دون privateLogViewer أو قراءة payload الأسرار |
| ناشر موقت منفصل | run.jobs.create على المشروع عند الإنشاء فقط؛ run.jobs.get/update على Job القائمة؛ iam.serviceAccounts.actAs عبر roles/iam.serviceAccountUser على assess-job وحدها | custom role مراجع؛ لا run.jobs.run أو secretAccessor. ناشر الصورة roles/artifactregistry.writer على repository المعنية فقط وreader للناشر عند الحاجة؛ تنتهي المنح بانتهاء نافذة التغيير |
| Cloud Run service agent service-PROJECT_NUMBER@serverless-robot-prod.iam.gserviceaccount.com | roles/run.serviceAgent التي تديرها الخدمة | لا تمنح لأي إنسان/عامل؛ سحب الصورة عمل المنصة، لا artifactregistry.writer للمهمة. cross-project registry إن اقترحت لاحقًا تحتاج reader للـservice agent على repo وحدها |
| مسؤول الأسرار الموقت | secretmanager.versions.add/get/list/disable/enable/destroy كدور مخصص على السر فقط | دون versions.access متى كان إدخال القيمة من قناة آمنة مباشرة ممكنًا؛ إنشاء السر وsetIamPolicy عملية bootstrap منفصلة بيد مسؤول IAM، ثم سحبها |
| مسؤول Billing/المراقبة | صلاحيات إعداد budget/alert بيد المسؤول القائم، منفصلة عن هوية المهمة | لا منح Billing أو Monitoring editor للمهمة؛ stdout يجمعه Cloud Run فلا تحتاج logging.logWriter أو monitoring.metricWriter في التطبيق الحالي |

مرجع [أدوار Run الرسمية](https://docs.cloud.google.com/iam/docs/roles-permissions/run) يميز jobsExecutor عن jobsExecutorWithOverrides. لا يرث المشغّل صلاحيات أوسع من group/project/folder؛ مراجعة effective IAM مطلوبة، بما فيها Token Creator وWorkload Identity impersonation. فصل الناشر تشغيلي: من يستطيع تغيير image أو هوية Job قد يسرّب السر عبر كود جديد، حتى دون secretAccessor مباشر؛ لذلك نافذة نشر قصيرة ومراجعة ثانية للـdigest/config.

الـvolume المقترحة: secret واحد، key اسمها assess-worker.json وإصدار رقمي N، mount على /run/secrets؛ ملف JSON≤64KiB، الحقول host/port/database/user/password/ca مطلوبة، وحقل sessionPoolerProjectRef اختياري صريح لمسار session5432 وفق [دليل runtime](ASSESS_RUNTIME_LOCAL.md#إعداد-session-pooler-المحلي). [توثيق أسرار Jobs](https://docs.cloud.google.com/run/docs/configuring/jobs/secrets) يبين أن volume في بيئة Jobs يملكها root. يقترح mode0444 للملف لقراءة USER node؛ لا root أو chmod777. يلزم إثبات non-root read من المسار المحدد مع منع mounts/sidecars غير لازمة. 0444 ليست عزلة بين عمليات الحاوية نفسها؛ الحاوية ذات عملية موثوقة واحدة. لا تثبيت N في هذه الجلسة ولا تغيير Variables.

### التدوير والإلغاء

التدوير المقترح كل90يومًا أو فور الاشتباه، وعند تغير CA/host أو المشغّل: إيقاف إطلاق executions؛ انتظار الجاري أو اتباع إجراء الطوارئ؛ إنشاء login بديل assess_job_b بنفس ACL؛ إدخال JSON جديد بإصدارN+1 عبر قناة آمنة بلا shell args/logs؛ مراجعة version metadata وmount/digest؛ اختبار اتصال/رفض ACL مأذون ببيئة معزولة؛ تحديث مرجع الإصدار في نافذة تغيير مستقلة؛ ثم شاهد محدود مأذون. لا إعادة تشغيل تلقائية أو حذف إصدار قديم قبل إثبات الجديد. العودة للإصدار القديم لا تجوز إن كان مخترقًا؛ عند فشل البديل يبقى العامل متوقفًا.

بعد نجاح البديل: NOLOGIN وإلغاء عضوية القديم وقتل جلساته وفق القسم4، تعطيل الإصدارN ثم إتلافه بعد24ساعة من التحقق ما لم تتطلب سياسة الحادث إتلافًا فوريًا. مراجعة الإصدارات المعطلة لأنها قد تظل محسوبة في التكلفة. تدوير password وحده أو تعطيل secret version/SA لا يمحو credential من ذاكرة execution أو جلسة DB. الإلغاء الطارئ يبدأ بمنع run وإلغاء كل executions القائمة، إزالة secretAccessor وتعطيل الإصدار/SA المخصص عند الحاجة، ثم إلغاء DB وقتل جلساته والتحقق من عدم عودتها. لا تعطيل service agent المشترك أو reset لكلمة postgres.

## 3. الشبكة وTLS وlogin PostgreSQL

المسار المرشح الحالي: shared session pooler IPv4، hostname من Connect dialog للمشروع القائم، TCP5432 وTLS مع CA المزود المراجعة، login خاص assess_job_a؛ لا استخراج سر أو الاتصال بالأصلية هنا. لا Cloud SQL ولا tunnel/proxy يعطل TLS. لا عنوان IP بدل hostname أو rejectUnauthorized=false/sslmode=require وحده. config.ca تشمل PEM الموثوقة، والتحقق من سلسلة الشهادة واسم المضيف إلزامي؛ لا connectionString تتجاوز ssl options. سجل fingerprint وتاريخ صلاحية CA كـmetadata فقط، وحدّثها بإصدار جديد قبل الانتهاء؛ فشل السلسلة/الاسم توقف، بلا fallback.

| الطريق | القرار/العائق | قبول لاحق لازم |
|---|---|---|
| direct5432 | بديل بشرط الوصول؛ أكد المالك من Connect أن direct يستخدم IPv6، وجاهزية egress IPv6 من Cloud Run غير مثبتة | DNS A/AAAA والمسار الفعلي من المنطقة المختارة وTLS وlogin محدود؛ لا افتراض أن IPv6 في DNS يعني قابلية وصول. عند غياب المسار نتوقف بدل شراء IPv4 تلقائيًا |
| shared pooler session5432 | المرشح دون إضافة IPv4 مدفوعة؛ أكد المالك ظهور IPv4 proxied for free؛ عائق الاسم عولج محليًا | sessionPoolerProjectRef تركب اسم النقل role.projectRef ويبقى user هو login المتوقع؛ TLS/ACL وstartup options والإلغاء وإغلاق clients/backends تحتاج شاهد Supavisor مأذونًا، لا نجاح حي من الاختبارات المحلية |
| shared pooler transaction6543 | خارج النطاق؛ إعداد session الجديد يرفض6543 صراحة | BEGIN → فحص session_user/ACL → SET LOCAL ROLE → RPC → COMMIT على backend نفسها، ثم role reset بين المعاملات وعزل اتصالات login آخر. لا session SET ROLE أو prepared statements مسماة؛ اختبار دعم startup options الحالية search_path/statement_timeout/lock_timeout قبل اعتماده |

[دليل اتصال Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres) يفرق بين direct وsession وtransaction ويطلب اسم custom role المركب للـshared pooler؛ hostname ينسخ من المشروع ولا يخمن من region. أي dedicated pooler أو IPv4 add-on له أهلية/تكلفة مستقلة، وليس بديلًا مجانيًا مفترضًا.

لا تدّع هذه الخطة egress allowlist: Cloud Run الافتراضي قد يستخدم عناوين خروج متغيرة. شرط القبول مراجعة DB network restrictions الحالية وهل تلزم IPv4/IPv6 CIDR ثابتة. إذا كانت allowlist ثابتة مطلوبة، فـDirect VPC egress مع Cloud NAT/عنوان ثابت أو مسار خاص تصميم وتكلفة منفصلان يحتاجان إذنًا؛ لا connector/NAT تلقائيًا ولا فتح0.0.0.0/0 أو ::/0 لتجاوز قيد. حتى مسار عام TLS بلا IP ثابت يحتاج قبولًا صريحًا لسياسة الشبكة قبل provisioning. لا تغيير ACL أصلية من هذه الحزمة.

login المقترح LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION، password عشوائية قوية خارج Git، CONNECTION LIMIT 2 وVALID UNTIL لا يتجاوز90يومًا. العضوية الوحيدة assess_worker بلا ADMIN OPTION، مع SET مسموح وINHERIT معطل حيث يدعم الإصدار خيارات العضوية. CONNECT لقاعدة واحدة عند الحاجة؛ لا schema/table/sequence CREATE أو DML أو ملكية أو pg_signal_backend أو عضوية authenticated/service_role/postgres. افحص الامتيازات الموروثة من PUBLIC، ومنها CREATE/TEMP وCONNECT لقواعد أخرى؛ NOINHERIT لا يلغي PUBLIC. أي تعديل PUBLIC مشترك يحتاج قرارًا مستقلًا ولا ينفذ لتضييق حساب واحد بصمت.

قبل SET LOCAL ROLE لا direct tables أو user RPC؛ بعده schema USAGE وEXECUTE الممنوحة لـassess_worker فقط، بلا direct tables أو launch_gate. **حد least privilege الحالي:** assess_worker القائمة تملك أيضًا دوال publication/content وrecover بجانب maintain/claim/finish/fail/health؛ entrypoint لا تستدعيها لكن credential مسروقة يمكن أن تفعل. لا نسميها tick-only role؛ تضييقها يحتاج فصل دور/نقل وSQL واختبارات بإذن مستقل، مع الحفاظ على ACL العقود المثبتة. لا GRANT ALL أو تعديل تلك العقود ضمن التقرير.

شواهد القبول اللاحقة: قبول CA/hostname الصحيحين ورفض الخاطئين/الاتصال بلا TLS؛ شهادة TLS من اتصال فعلي؛ تطابق session_user/current_user قبل SET، وcurrent_user=assess_worker داخل المعاملة وعودته بعد COMMIT/ROLLBACK؛ رفض login زائد العضوية أو INHERIT/admin، ورفض direct tables/launch_gate/user RPC/roles الأخرى. بعض RPCs مثل health/maintain/claim قابلة للكتابة حتى لو كان الاسم فحصًا؛ لا تستعملها كشاهد read-only على الأصلية. اختبار ACL والقتل والـpooler أولًا على قاعدة اصطناعية معزولة مأذونة، ثم بوابة مستقلة لأي استعمال للأصلية.

### حزمة login وشاهد TLS الحالي

أُعدت [حزمة login المحدود](ASSESS_WORKER_LOGIN.md) بإنشاء مغلق NOLOGIN/password null وانتهاء صلاحية وعضوية محدودة، وفحص catalogue وإلغاء يثبت السحب قبل قتل القائم. جُربت الحزمة على PGlite وPostgreSQL محليتين، ثم أذن المالك بمرحلة NOLOGIN المحددة على الأصلية وأرسل [صف التجهيز المغلق الناجح](ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md#worker-login-stage-owner-result)؛ لا تفعيل أو اختبار إلغاء مزود ثبت بذلك. PUBLIC TEMP ظهرت في إفادة المالك، ولا تسحب الحزمة منح PUBLIC المشتركة؛ [مقترح TEMP وقناة السر](ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) يحدد شروط استثناء تجربة≤7أيام وخطوات إدخال مخفي. لا استثناء مقبول أو قناة مثبتة بعد؛ التفعيل يحتاج حسم السطح والقناة وإذنًا مستقلًا.

[إفادة المالك](ASSESS_WORKER_LOGIN_REPORT_2026-10-21.md#إفادة-tls-من-جهاز-المالك) أثبتت من جهازه PASS TLS1.2 واسم aws-1-eu-central-1.pooler.supabase.com وجذرًا مطابقًا تمامًا لملف Supabase Root 2021 CA. لم يُرسل login/SQL، ولم يُفحص certificate revocation أو وصول Google/Node أو startup options/ACL/إلغاء مزود. لا نكرر TLS أو نستخدم حساب postgres باسم العامل من ذلك.

## 4. سحب DB الفعلي وقتل الجلسات

مسؤول DB ينفذ لاحقًا من اتصال إداري منفصل موثوق، بصلاحية تغيير login المحدد وعضويته وقتل backends الخاصة به فقط؛ لا تمنحها للمهمة. [ALTER ROLE](https://www.postgresql.org/docs/current/sql-alterrole.html) و[pg_terminate_backend](https://www.postgresql.org/docs/current/functions-admin.html) مرجعا الإجراء. الأسماء هنا أمثلة وليست SQL كتابة منفذة أو ملف تطبيق على الأصلية.

1. منع إطلاق جديد وسحب run وإلغاء executions، ثم حجر المسار/إيقاف pooler clients المعنية عند استخدامها؛ مراجعة احتمالات COMMIT المفقود بلا retry أو علامة صفر.
2. تثبيت الهوية والقاعدة من catalogue دون أسرار؛ تنفيذ ALTER ROLE assess_job_a NOLOGIN، ثم REVOKE assess_worker FROM assess_job_a، وتثبيتهما بـCOMMIT قبل قتل الجلسات. تعطيل/تغيير password من قناة آمنة؛ REVOKE CONNECT وحدها لا تغلب PUBLIC ولا تنهي القائم.
3. اختيار backends عبر pg_stat_activity بشرط usename='assess_job_a' وpid<>pg_backend_pid() عبر كل قواعد الـcluster للدور المخصص، ثم pg_terminate_backend(pid,1000) لكل واحدة ضمن سقف8 جلسات/15ثانية وفق الحزمة المغلقة، وتسجيل عدد النجاح فقط. لا الاعتماد على application_name وحده أو current_user الذي قد يصبح assess_worker؛ لا طباعة query/parameters. kill داخل معاملة الإلغاء قبل COMMIT يترك نافذة إعادة اتصال.
4. مع pooler يجب إغلاق frontends الخاصة بذلك login وإخلاء backends/auth cache له أيضًا بإجراء مزود مثبت؛ NOLOGIN أو password rotation قد لا يلغيان clients مصادقًا عليها أو backends معاد استخدامها. عدم امتلاك قدرة مزود محدودة لذلك عائق قبول للـpooler؛ لا restart شامل لحسابات الآخرين أو ادعاء إلغاء من قتل client واحدة.
5. إثبات عدد جلسات القديم=0 وأنها لا تعود في فحص محدود لمدة60ثانية، ورفض إعادة اتصال بالقديم ورفض استدعاء من اتصال كان قائمًا قبل السحب. فحص login بديل/حساب غير معني يثبت عدم أثر جانبي. سجل metadata وأعدادًا دون بيانات. عند فشل terminate أو عودة جلسة يبقى الحجر، ويصعّد لمسؤول المزود دون نجاح صوري.
6. reconcile من قاعدة الحقيقة فقط تحت إذن منفصل: القتل قبل COMMIT قد يرجع المعاملة، وبعده قد تبقى نتيجة صحيحة؛ انتظر lease/retry_at واستعمل recover_v1 صراحة بحسب السياسة، بلا إعادة finish أو تشغيل أعمى. إعادة الخدمة تتطلب login/سر جديدين وشاهد رفض القديم، لا إعادة تمكين مخترق.

## 5. المراقبة والمسؤولية

المالك هو **مسؤول التشغيل المقترح مؤقتًا** وصاحب قرار الإيقاف والتكلفة؛ يجب تثبيت اسمه/بريده الفعلي وبديل مسمى ومسؤول DB/IAM قبل أي تشغيل. لا on-call مغطى24/7 مفترضًا. قناة أولى email للمسؤول وبديله، وتجربة تسليم/ack فعلية لاحقًا؛ لا قناة منشأة أو رسالة مرسلة هنا. لا تشغيل غير مراقب عند غياب البديل أو القدرة على قتل الجلسات.

| الإشارة | الحد المقترح والتصرف | ما يثبته/لا يثبته |
|---|---|---|
| STOP/configuration أو unavailable أو cleanup_failed أو execution failed/OOM/timeout | تنبيه من أول occurrence؛ ack خلال15دقيقة أثناء نافذة التجربة، وإيقاف runs حتى التشخيص | غياب JSON أو counters ليس نجاحًا أو صفرًا؛ طابق platform exit مع outcome |
| grading_uncertain أو counts.failed>0 | تنبيه فوري؛ لا إعادة تلقائية؛ مراجعة COMMIT/lease | failed عدم يقين تنفيذ لا حكم درجة أو غياب نتيجة |
| duration>240s أو memory>80% من512Mi | تحذير أول مرة؛ توقف عند timeout/OOM؛ قياس قبل رفع الموارد | لا خفض statement timeout أو تغيير lease لإخفاء مشكلة |
| counts.alert>0 | تنبيه حرج فورًا؛ ack15دقيقة وخطة معالجة خلال ساعة في النافذة | يعكس فشل التصحيح≥24ساعة من SQL؛ لا تنتظر24ساعة لتنبيه فشل التنفيذ نفسه |
| healthFailed>0 | تحذير أول مرة، تصعيد إذا استمر في شاهدين مأذونين يفصل بينهما≥5دقائق | ليس عدادًا لوقت lease أو عدد queue كلها |
| overdue>0 أو purgeDue>0 | تحذير أول مرة، حرج إن بقي بعد15دقيقة وشاهدين؛ معالجة bounded مع موافقة التشغيل | تقاس بعد maintenance؛ لا وعد بأن tick واحدة تصفي backlog أو metadata كلها |
| أكثر من execution نشطة أو تجاوز10/يوم أو100/شهر | إيقاف إطلاق جديد وتنبيه فوري | parallelism=1 ليس قفلًا عالميًا أو حد اتصال كلي |
| CA تنتهي خلال30يومًا أو login خلال14يومًا | تنبيه وتدوير قبل الانتهاء | تحقق من metadata لا طباعة CA/password في logs |
| تكلفة/forecast | حدود القسم1؛ مسؤول Billing يصعّد عند$4 ويوقف التشغيل | alerts ليست سقف إنفاق مضمونًا |

قالب log المسموح assess-job/1 فقط مع timestamp/execution ID من المنصة وoutcome/code/counts محددة؛ لا claims/أجوبة/درجات/هويات طلاب/SQL/config/raw errors. logs تشغيلية30يومًا مقترحًا، بلا نسخ BigQuery أو export عام؛ audit logs المدارة وفترات احتفاظ المزود والتكلفة تراجع منفصلة. لا حذف سجلات تدقيق إلزامية لتقليل التكلفة.

health_v1 لا تعرض oldest queue age أو lease count/age أو عدد reservation/consent metadata المتأخرة؛ لا تستنتجها من purgeDue. غيابها فجوة مراقبة قبل تشغيل مستمر تتطلب مصدر metrics مجمعًا محدودًا مأذونًا، دون scan/صفوف حساسة أو مراقب جديد الآن. في التجربة اليدوية يتوقع المشغّل خاتمة خلال6دقائق من run؛ غيابها alert يدوي. لاحقًا عند اعتماد cadence=T، يقترح heartbeat غائب بعد2T+300s؛ لا absence alert مستمر أو schedule ضمن هذه الحزمة.

## 6. قائمة قرار المراجع

- مراجعة europe-west3 القريبة من DB Frankfurt وتسعيرها والإقامة، و1CPU/512Mi/300s وحدود التجربة؛ أظهر المالك حفظ ميزانية$5 على حساب Billing، بينما الهوية التشغيلية والبديل لم يثبتا.
- مراجعة effective IAM ومورد secret واحد/إصدار مثبت وnon-root mount؛ اختبار run بلا overrides ورفض قراءة أي سر آخر ورفض المشغّل قراءة payload.
- حسم قيود DB network وقبول session5432 الحي بعد الإصلاح المحلي؛ direct IPv6 بديل مشروط. لا مسار ready قبل نجاح TLS/ACL وسحب جلسة قائمة، ولا ادعاء tick-only privilege للدور الحالي.
- قبول حدود التنبيه وقناة وack ومسؤول DB قادر على القتل، ثم إذن منفصل للتجهيز/الاختبار الخارجي؛ كل دليل يسجل منفصلًا عن البناء والتشغيل والنسخ والاستعادة والإطلاق.

تظل launch_gate مغلقة وruntimeOrLaunchVerified=false؛ لا قبول حي أو JWT/backup/restore/O108 مثبت بهذه الوثيقة. راجع [تقرير هذه الدفعة](ASSESS_EXTERNAL_BINDING_REPORT_2026-10-21.md) للفحوص وما لم ينفذ.
