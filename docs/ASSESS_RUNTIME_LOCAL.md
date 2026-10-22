# ربط Assess المحلي — Node24

هذه حزمة مكتبة وentrypoint محدودة وحاوية **محلية** قابلة للمراجعة، بلا HTTP endpoint أو timer أو binding حي. [تقرير المكتبة](ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md) و[تقرير الحاوية](ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md) يفصلان الفحوص عن الأدلة الحية؛ [السياسة](ASSESS_RETENTION_POLICY.md) و[S-ASSESS-15](DECISIONS.md#assess-retention-owner-2026-10-20) حاكمتان.

## المسار المختار وحدوده

المستخدم يبقى browser → Supabase Auth/Data API → RPC المفوضة، عبر adapters الموجودة في runner-data وpractical-data وhistory-data وadmin-data وcontent-data. يتحقق المزود من توقيع JWT وصلاحيته ومصدره/جمهوره وفق إعداد Auth الفعلي، ثم يحدد auth.uid داخل SQL؛ لا هوية من body أو decoded claims بلا تحقق. لا service/admin key باسم المستخدم، ولا نقل جلسة المستخدم إلى اتصال العامل. لا adapter مستخدم جديد أو قبول v2 نيابة عن أحد. محاكاة auth.uid في QA ليست تحقق JWT. تدقيق توقيع/انتهاء/مصدر/جمهور وإلغاء جلسات المزوّد الحي يبقى بوابة مستقلة، ولا يغلقها نجاح الاختبار أو إفادة اختبارات المالك أو زوج القراءة المحدود.

الخادم الخاص Node24 لأنه البيئة المقترحة في خطة التجهيز والمتوافقة مع Buffer والمصحح وbigint والـregistries القائمة. لا توافق Deno/Edge أو استضافة العامل على Pages مستنتجة. اختار المالك لاحقًا [Google Cloud Run](DECISIONS.md#assess-cloud-run-owner-2026-10-21)؛ [خطة المطابقة المحلية](ASSESS_CLOUD_RUN_PLAN_2026-10-21.md) تقترح Jobs وتحدد فجوة الإيقاف. لا موارد أُنشئت أو تكلفة/region اعتُمدت. آلية سر التشغيل وقناة المراقبة والربط الخارجي ما زالت غير منفذة؛ [حزمة قرار الربط الخارجي](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md) تحدد المقترحات وشروط القبول وقيود pooler والدور الحالي دون provisioning.

## البناء المحلي فقط

```sh
npm ci
node scripts/assess/build-runtime.mjs
```

الأمر يبني `assess-runtime.cjs` و`assess-job.cjs` و`job-main.mjs` وDockerfile وpackage.json داخل مجلد مؤقت جديد `radlab-assess-build-*` ويطبع مساره وruntimeOrLaunchVerified=false. يستعمل esbuild مع target=node24 ويضم pg والمصحح والبيانات اللازمة، دون node-loader المرجعي أو source maps. يثبت البناء سائق pg JavaScript، ويرفض React/Next/Zustand في الرسم. ملفا المكتبة يُستوردان بلا credential أو اتصال؛ entrypoint منفصلة، ولا scheduler. الحاوية تنسخ assess-job.cjs وjob-main.mjs فقط وتعمل بغير root، من صورة Node24.19.0-bookworm-slim مثبتة بـdigest داخل runtime.Dockerfile. هذه حزمة بناء محلية وليست release artifact منشورًا أو نظام أرشفة/نسخ. لا bundle أو private keys أو ملفات مؤقتة في Git.

## entrypoint المحدودة والحاوية

`server-job` يعيد runAssessJobs نفسها مرة واحدة بـlimit=1 وconnections=1، ثم ينتظر close. `job-main.mjs` ترفض flags، ولا تقرأ ملفًا قبل ASSESS_JOB_ENABLED=1 الصريح. إعداد خارجي واحد في `/run/secrets/assess-worker.json` بحد64KiB؛ الحقول الستة المطلوبة host/port/database/user/password/ca، وحقل sessionPoolerProjectRef اختياري صريح لمسار session5432 فقط؛ بلا connectionString أو هوية مستخدم أو fallback. لا سر في ENV/args أو build، ولا config حية أو secret mount أُعدت من هذه الدفعة. المفتاح المحلي للتفعيل لا يفتح launch_gate ولا يمنح إذن تشغيل.

تسجل SIGTERM/SIGINT قبل قراءة الملف، وتتوقف عن claim التالية وتنتظر الجاري وhealth ثم close، دون إلغاء RPC جارٍ. `assess-job/1` يخرج0 مع COMPLETE فقط، أو1 عند configuration/unavailable/grading_uncertain/cleanup_failed، أو130 عند توقف تعاوني. المخرجات counters منقحة بعد تحقق العدد فقط؛ غياب/فشل رد SQL لا يولد counters صفرية. عند فشل finish قد يعني COMMIT نجح؛ counts.failed عدم يقين تنفيذ، لا علامة صفر أو غياب نتيجة. لا stdout للمستند أو claim أو config أو raw errors.

ابنِ الصورة من **مجلد الإخراج المطبوع وحده** عبر Docker محليًا و`--network=none` للبناء؛ لا تستخدم checkout كله كسياق. runtime.Dockerfile بلا RUN/npm/network steps، وENTRYPOINT بصيغة exec تجعل Node PID1. التشغيل المحلي بلا إعداد يقصد به STOP/configuration وخروج1. لا أوامر نشر أو push registry أو gcloud أو Cloud Build في هذا الدليل. Docker المحلي اختُبر بغير root وfilesystem للقراءة فقط وnetwork=none، وفُحص خلو /app من checkout/مكتبات QA والأسرار. هذا لا يثبت صلاحيات mount الفعلية لـSecret Manager على Google؛ يلزم إثبات قراءة non-root للسر المخصص دون توسيع كشفه قبل ربط حي.

هذه الحزمة لا تضع task count/parallelism/retries/schedule في Google. تبقى قيم1/1/0 في الخطة مقترحات إعداد خارجي، وتعدد executions مستقل عن parallelism؛ لا وعد بسعة أو تكلفة. مهلة Cloud Run للإيقاف قد تنتهي قبل معاملة60ثانية: لا ضمان لإتمامها في10ثوانٍ ولا تغيير مهلة SQL/lease لإخفاء ذلك.

## شاهد العمليات الحقيقي المحلي

```sh
ASSESS_POSTGRES_MANIFEST=/tmp/radlab-job-postgres/package.json node --import ./scripts/assess/node-loader.mjs scripts/assess/job-process-rehearsal.mjs --synthetic-disposable
```

حزم QA خارج المستودع كما في دليل العمليات: embedded-postgres@18.4.0-beta.17 وpg@8.23.1، Linux x64 غير root وNode24. الشاهد يعيد openLocalDatabase بقواعد جديدة فقط، يرفض كل flags/وجهة إضافية، ويمرر socket الخاص إلى child محلية عبر IPC؛ لا URL/DSN أو سر مزود أو أدوات حسابين. الطفل يستخدم lifecycle الفعلية المجمعة، مع نقل pg/Unix-socket اصطناعي تحت assess_worker، **ولا يستخدم TLS binding الإنتاجية**. Auth.uid وv2 بيانات fixture محلية، لا JWT أو موافقة حساب حقيقي.

SIGTERM/SIGINT أثناء finish تنتظران COMMIT ثم health/close. SIGKILL قبل COMMIT يترك التفاصيل بلا نتيجة حتى استرداد lease؛ وبعد COMMIT وقبل عودة الإقرار تبقى نتيجة واحدة بلا تفاصيل ولا تصحيح جديد. يقرأ الأب من اتصال مستقل مع قفل ينتظر انتهاء المعاملة، بلا polling. يشمل retry_at وrecover الصريحة وحد السبعة أيام ورفض token قديم والدرجة المثبتة وخلو Practice/events/feedback. العمر والـlease يُعدلان اصطناعيًا محليًا، لا انتظار مدة حقيقية أو اختبار provider.

الناتج `assess-job-process/1` أكواد وأسماء checks وcleanup وruntimeOrLaunchVerified=false فقط. cleanup يتلف cluster الطبيعي؛ قتل الشاهد الأب/المضيف قسرًا قد يترك بقايا، وتتبع إجراءات التنظيف المحددة في دليل العمليات، لا wildcard أو ادعاء finally عند SIGKILL. اختبار PID1 داخل Docker يستخدم worker محاكى منفصلًا، ولا يثبت PID1+PostgreSQL/TLS أو Google معًا. التفاصيل والإخفاقات المصححة في تقرير الحاوية.

## منفذ العامل

[server-runtime](../src/features/assess/server-runtime.ts) يصدّر createWorkerBinding وrunAssessJobs وinstallMixedContent وpublicationService القائمات. ينشئ pool كسولًا، ولا يبدأ العمل عند الاستيراد أو الإنشاء. لا يقرأ وجهة/كلمة مرور من environment ولا يقبل connectionString أو URL؛ كل حقول الوجهة والاعتماد وCA صريحة. لا تمرير كائن config أو pool أو الأخطاء إلى logs/المتصفح. الاستيراد مضاف إلى قائمة منع المتصفح في frontend-schema دون تغيير pins أو متطلبات SQL أو إثبات المخطط.

كل call: تحقق اسم RPC وأسماء/أنواع المعاملات → اتصال محدود → BEGIN → فحص login/current_user وNOINHERIT وغياب superuser/BYPASSRLS/CREATEDB/CREATEROLE/REPLICATION، وعضوية assess_worker وحدها دون ADMIN OPTION → SET LOCAL ROLE assess_worker → search_path فارغ ومهل statement60s/lock5s → SELECT ثابت مؤهل باسم schema ومعاملات منفصلة → COMMIT قبل إعادة الرد. فحص الدور حماية إضافية؛ **ليس مراجعة شاملة لكل المنح أو وراثة assess_worker**. خطأ/إقرار COMMIT ضائع يؤدي إلى rollback بأفضل جهد وإتلاف الاتصال، دون replay. SQL مصدر الحقيقة؛ rollback لاحق لا يلغي COMMIT سبق نجاحه.

القائمة تسع دوال فقط: maintain_v1 وclaim_v1 وfinish_v1 وfail_v1 وhealth_v1 وrecover_v1 وcontent_read_v1 وcontent_install_v1 وinstall_publication_v1. لا consent أو user impersonation أو start أو gate أو SQL إداري. recover وinstall لا يستدعيان تلقائيًا؛ يلزمهما إجراء مأذون مستقل. قيم uuid والأرقام والنصوص الرقمية وJSON محدودة، JSON≤2MB؛ الحد محلي وليس ضمان إجمالي الذاكرة لحجم الرد. المصحح والخدمات وmaintain/lease/recovery والحذف الذري لم تتغير، ولا عامل أو purge ثانٍ.

## TLS وACL والأسرار والإلغاء — قبل أي ربط حي

CA صريحة وrejectUnauthorized=true وفحص اسم المضيف الافتراضي في pg/Node، بلا تعطيل verification أو fallback إلى اتصال غير مشفر. عنوان DNS وميناء وقاعدة/login خاصون؛ socket غير مقبول لهذا الربط. لا اعتبار قبول CA الاصطناعية في mock شهادة TLS. يلزم على المزود إثبات السلسلة واسم المضيف ورفض شهادة/مضيف خاطئين، وتوافق الاتصال المباشر/الـpooler مع login وSET LOCAL وstartup options. أُضيف دعم اسم النقل المركب محليًا في [تقرير إصلاح session pooler](ASSESS_SESSION_POOLER_REPORT_2026-10-21.md)، دون شهادة Supavisor أو TLS حي.

صلاحية login مخصصة محدودة: CONNECT للقاعدة المقصودة وعضوية assess_worker فقط، بلا ملكية كائنات/منح جداول أو public CREATE أو أدوار إدارية. مراجعة ACL تشمل المنح المباشرة وPUBLIC والعضويات العابرة وصلاحيات assess_worker وsecurity definer/RLS، مع رفض مستخدم/anon لدوال العامل. فحص login في الكود لا يغلق هذه البوابة. أسرار login خارج Git/build/browser، تُحقن من مدير أسرار يختار لاحقًا، ولا تُرسل للمحادثة. لا نسخ JWT أو مفاتيح service/admin إلى العامل.

إلغاء الصلاحية يحتاج منع اتصالات login الجديدة وإلغاء العضوية/الصلاحية وإغلاق الاتصالات القائمة وإبطال/تدوير السر بحسب المنصة؛ NOLOGIN وحدها لا تنهي اتصالًا أو معاملة قائمة. عند incident لا يكتفى بإيقاف scheduler. هذا تصميم مطلوب لإجراء إلغاء مراجع، لا أوامر SQL أو تجربة إلغاء حية منفذة. يراجع المسؤول أيضًا إعدادات logs لدى DB/host/proxy: لا statements/parameters/claims/أجوبة/إعدادات/علامات/هويات أو connection config. المحوّل لا يسجل events أو أخطاء خام؛ يحولها إلى invalid/limit/denied/conflict/unavailable فقط، دون cause/detail.

## إعداد Session pooler المحلي

يبقى `user` اسم login PostgreSQL المحدود فقط (مثل assess_job_a)، دون لاحقة مشروع أو اسم postgres. عند إضافة `sessionPoolerProjectRef` الصريحة يُرسل pg اسم النقل `user.projectRef`، بينما يفحص SQL `session_user = user` و`current_user = session_user` قبل SET LOCAL ROLE assess_worker في **كل** معاملة. لا اشتقاق للهوية من استجابة pooler أو تقسيم suffix وارد أو تمرير expectedUser مستقل لتجاوز الفحص. عند غياب الحقل تبقى إعدادات direct الستة كما هي. وجود الحقل بقيمة فارغة/null/undefined أو محارف غير a-z0-9 أو طول خارج1..63 يُرفض؛ هذه صيغة توجيه محدودة وليست إثبات وجود مشروع أو ملكيته.

هذا المسار يقبل port5432 فقط ويرفض6543 وبدائل المنافذ؛ ليس دعم transaction pooler. hostname يؤخذ من Connect للمشروع ولا يُخمن من region؛ CA وhostname verification تبقيان إلزاميتين. المسار لا يُكتشف من hostname أو ENV، ولا fallback من direct إلى pooler. الحد pool1 في Job و1..4 في المكتبة محفوظ؛ إعداد الحاوية يظل ملفًا واحدًا≤64KiB. لم يتغير startup options أو statement60s/lock5s/connect10s؛ قبولها لدى Supavisor يحتاج شاهدًا مأذونًا لاحقًا ولا يحسمه نجاح mock/PGlite.

[دليل Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres) يحدد username للـshared pooler بصيغة role.project-ref. فصل اسم النقل لا يمنح Google IAM أو login أو عضوية أو شهادة TLS؛ لا إعداد حي أو سر منشأ من هذه الدفعة. نطاق الدور assess_worker ما زال أوسع من tick-only كما تسجله [حزمة الربط](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md).

## حزمة login مغلقة وشاهد TLS

أُعدت [حزمة تجهيز login والإلغاء](ASSESS_WORKER_LOGIN.md) محليًا: دور جديد NOLOGIN/password null وصلاحية منتهية، وcatalogue read-only، وCOMMIT لسحب الصلاحية قبل قتل جلساته. لا تفعيل سر أو دور على المزود؛ PUBLIC TEMP/CREATE وCONNECT إلى قواعد أخرى ما زالت تحتاج مراجعة، ولا تعديل لصلاحيات assess_worker المشتركة.

[تقرير login](ASSESS_WORKER_LOGIN_REPORT_2026-10-21.md#إفادة-tls-من-جهاز-المالك) يحفظ PASS من جهاز المالك لـTLS1.2 وhostname وجذر مطابق تمامًا للـCA المرفقة على مضيف session5432. كان رفض Windows الأول UntrustedRoot، فحُددت الثقة في الملف المطابق فقط دون تثبيته عالميًا. لا login/SQL أو certificate revocation أو Node/Cloud Run أو startup options أو ACL/إلغاء حي ثبتت بذلك، ولا نجاح شبكة الوكيل التي بقيت بلا TCP grants.

## الإيقاف والفشل وScale

التسلسل المطلوب من المضيف مستقبلًا: أوقف قبول ticks/عمليات install أو recover جديدة، أرسل AbortSignal إلى runAssessJobs، انتظر tick الجاري حتى تسوية claim وfinish/fail ثم health، ثم await binding.close. close يمنع calls جديدة وينتظر الاتصالات/المعاملات الجارية قبل pool.end، وتكراره يعيد الوعد نفسه. استدعاء close قبل تسوية tick قد يمنع finish/fail لاحقًا؛ ليس بديلًا عن Signal/انتظار tick. لا SIGKILL أو توقف مضيف موثوق من finally؛ تبقى lease/نوافذ C مرجع الاسترداد.

فقد finish ack بعد COMMIT لا يثبت غياب النتيجة؛ قد يعده runAssessJobs فشل تنفيذ غير مؤكد ويحاول fail تحت token الحالي، دون نتيجة ثانية أو صفر. لا retry داخل النقل، ولا تجاوز retry_at أو استرداد تلقائي بعد حدود C. الإغلاق النهائي وتعطيل Assess يمنعان البدء فقط؛ المحول لا يضيف حارسًا يمنع تسوية المحاولة أو النتيجة المستحقة. v1 لا تستبدل v2.

السقف pool=2 افتراضيًا وقابل للضبط1..4، ورفض فوري limit فوق الاتصالات الفعالة بدل queue غير محدودة. runAssessJobs تبقى1..100 لكل مرحلة؛ مجموع الصفوف عبر maintenance ليس حدًا إجماليًا100. تعيين الحجم والتداخل ومهلة إيقاف المضيف ومراقبة lease/purge وقياس سعة المزود يحتاج أدلة حمل مستقلة؛ لا QPS أو زمن توقف مضمون من fixture. مهلة اتصال10s وstatement60s/lock5s لا تثبت زمن إقرار الشبكة عند انقطاعها؛ إنهاء المضيف القسري يبقى نافذة عدم يقين تحتاج lease/recovery، لا إعلان rollback أو إعادة محاولة عمياء. تسع RPCs عقد إصدار صريح، وزيادتها تحتاج مراجعة أمنية واختبارات، لا تمرير أسماء حرة.

## حدود الاستعادة والبوابات

[اختيار المالك](DECISIONS.md#assess-retention-original-no-backup-2026-10-20) يؤجل النسخة الشاملة إلى نهاية العمل؛ لا إعادة سؤال أو تجهيز تلقائي. backup/recovery/provider غير مثبتة. لقطة قديمة قد تعيد إسنادًا مغلقًا أو حسابًا معطلًا أو موافقة/metadata حذفت. purge النتائج وlaunch_gate وحدهما لا يحجران history/consent وبقية القراءات: يلزم حجر الشبكة/API/الهويات ثم إعادة الآثار الأحدث والحذف وACL قبل رفعه. لا backup/export/restore system في الحزمة.

الأصلية وlaunch_gate لم تُلمسا. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، والهوية الحية وربط runtime والعامل والجدولة والمراقبة والنسخ والاستعادة والتصدير والنشر بوابات مستقلة. بناء المكتبة واختبار SQL اصطناعي لا يثبتان قبولًا حيًا أو جاهزية مزود.
