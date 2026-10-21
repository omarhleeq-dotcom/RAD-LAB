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

### متابعة نقل المصدر وبناء الصورة وإنشاء المهمة — 2026-10-21

تعذر فتح رابط archive المحلي من واجهة المالك؛ لم ندعِ نجاح نقله. انتقل التسليم إلى ZIP خاصة من GitHub للرأس6b568a26a4bccc49c1c0cd3a772f50848f7aa0bd. مرشح محلي أول بحجم37008byte و118entries لم يحتو build-runtime.mjs أو package-lock.json، فرفض ولم يُرفع للبناء. لا سبب مؤكد لاختلاف المرشح. قرأ الوكيل أرشيف GitHub نفسه عبر API موثوقة:974entries و865ملفًا و36,625,096byte مفكوكة؛ لا نشر source الخاصة أو token.

حُسبت بصمة محتوى موحدة تتجاهل اسم مجلد جذر archive وتغطي كل الملفات: SHA256 لقائمة JSON مرتبة من [relative-path, SHA256(content)] بفواصل compact وensure_ascii=true. القيمة c00207f79b229a617ef607e2dc73cd041354476a53fc7b0628b9995e7bd9a297. بعد تنزيل ZIP جديدة نحو28.2MiB ورفع RAD-LAB-cloud-source.zip.zip، أرسل المالك PASS source verified and extracted وFiles865 وDirectory=/home/radlab_pilot/assess-source-6b568a2؛ الفحص يرفض mismatch قبل أي استخراج ولا يشغل المحتوى، ويكتب إلى مجلد جديد فقط. suffix.zip.zip اسم الملف الفعلي وليس خطأ بنية. لا يُعاد التحميل أو الاستخراج بعد الشاهد الناجح.

أرسل المالك Node v24.21.0 ونجاح npm ci (448حزمة/33s) ثم assess-runtime-build/1 مع output=/tmp/radlab-assess-build-729RTv. npm حذرت من eslint منتهية الدعم ومن install scripts محجوبة لأربع حزم ومنها esbuild؛ bundling نجح دون السماح العام بهذه scripts. ليس ذلك ادعاء نجاح كل أدوات QA بهذه البيئة. base image ما زالت Node24.19.0 المثبتة بـdigest المراجعة، ولم نحدث package/lock أو الصورة الأساسية لإسكات تحذير.

سجل البناء/الرفع المرفوع من المالك أثبت docker build --platform=linux/amd64 وFROM pinned Node24.19.0 وCOPY assess-job.cjs/job-main.mjs فقط، ثم push ناجحة إلى:

- image: europe-west3-docker.pkg.dev/project-bff9124a-ec31-4d57-bc0/assess-runtime/assess-worker
- tag: source-6b568a2 (نسخة المصدر المستخدمة فعليًا، لا source-aefb857 المخطط القديم).
- pushed index digest: sha256:0f4f4117608f752ddbec69f4b67ca607d04db09fd0e5e18e774f445dacee7a5f.

سجل push يميز image manifest وconfig وattestation عن manifest-list/index؛ المرجع المثبت للمهمة هو pushed index المذكور، لا config hash أو base digest أو hash الأرشيف. هذا شاهد المالك وليس registry pull مستقلًا من الوكيل، ولا signature/runtime acceptance.

ثم أرسل Job [assess-worker] has successfully been created بعد أمر create في europe-west3 بالـimage@digest المذكورة، وservice account assess-job، وCPU1/memory512Mi/task1/parallelism1/timeout300s/maxRetries0 وASSESS_JOB_ENABLED=0 دون secret mount أو execute-now أو schedule. نجاح create يثبت إنشاء التعريف، وليس قراءة ثانية للإعداد الفعلي أو execution count. توجيه CLI الافتراضي To execute this job ليس إجراءً مأذونًا أو منفذًا تلقائيًا. حارس التطبيق=0 يرفض العمل؛ ليس تعطيل Job على مستوى منصة IAM، وما زال من يملك run يستطيع إطلاق execution تتوقف عند الحارس. لا ادعاء عدم وجود حق run أو منع overrides من هذا المتغير وحده.

المتابعة الحالية تقرأ job describe وsecret versions metadata فقط؛ لا versions access/payload أو تنفيذ عامل. تبقى credential/pooler/runtimeOrLaunchVerified=false وlaunch_gate مغلقة؛ secret version/content وعدد executions الفعلي غير مثبتين بعد، وحساب DB المعطل لا يصبح صالحًا بمجرد نجاح Google bootstrap.

### metadata المهمة والسر ومراجعة surface وقناة الاعتماد

أعاد job describe من المالك الصورة@digest والهوية والحدود المقترحة فعلًا وenv ASSESS_JOB_ENABLED='0' دون secret mount، وReady=True بتاريخ2026-10-21T17:58:20Z؛ لم يظهر status.executionCount فلا يُفسّر كصفر. Ready يخص تعريف المهمة، لا نجاح DB أو execution. أعادت secret versions list []، فأصبح غياب الإصدارات شاهدًا صريحًا من المالك في وقت القراءة، لا تخمينًا من describe.

صفا سطح الدورين assess_job_a/assess_worker: login=false وTEMP=true وwritable_schemas=0 وoutside_assess_definer_grants=0 وother_connectable_databases=1. جرد القاعدة الإضافية حدد template1 وis_template=true وTEMP/CREATE=false. لا قاعدة تطبيق أخرى في هذا الجرد، لكن لا ادعاء حصر CONNECT في postgres أو فحص كائنات template1 بالاتصال بها. لا سحب PUBLIC مشترك من ذلك.

الفحص الأول للجداول/sequences أخطأ42809 على saml_providers_pkey: WHERE relkind لم يضمن ترتيب تقييم has_sequence_privilege. صُحح إلى CASE يحرس نوع الكائن؛ جُرب محليًا على PGlite وPostgreSQL مع جدول ذي index وsequence ومنح إيجابية، وكشف المنح دون خطأ. استعلام الأصلية كان READ ONLY؛ لم يعدل بيانات أو grants. أعاد المالك خارج assess عدد2جدول/عرض و0sequence لكل دور، وحدد extensions.pg_stat_statements وpg_stat_statements_info (views،RLS=false)، ثم SELECT=true لكليهما وpg_read_all_stats membership=false وnonSELECT=false وreset EXECUTE=false. هذه metadata منح وليست قراءة actual statistics أو query text، وRLS=false على view لا يثبت كشف بيانات بحد ذاته. لا ادعاء أقل من هذه المنح أو أمان جميع دوال SECURITY INVOKER/foreign paths من هذه الاختبارات المحدودة؛ اقتراح TEMP والتشغيل المحدود لا يصبح قرار مالك مقبولًا تلقائيًا.

Cloud Shell لديها psql16.15؛ نُسخت إليها CA العامة المطابقة مع fingerprint guard. تكررت auth failure إدارية مرة ثم وصل BEGIN/SET وdatabase=postgres/session_user=postgres/read_only=on/ROLLBACK ناجحًا من المالك. لا إعادة حلقة تشخيص psql أو reset بعد الشاهد الناجح، ولا مساواة هذا النجاح بمصادقة العامل. شُرح أمر psql -X -W بالتشفير verify-full وSET password_encryption=scram-sha-256 ثم meta-command المستهدفة \password assess_job_a، ومطالبتا السر الخاص منفصلتان عن كلمة الإدارة؛ إخفاق الإدارة في محاولة تالية توقف قبل التغيير. بعد ذلك أرسل المالك صف worker_still_disabled=t وworker_expiry_still_closed=t من نهاية التسلسل. هذا شاهد postcondition مغلق بعد الأمر، لا تحقق مستقل للـpassword/verifier أو نجاح مصادقة العامل؛ لم يُطلب أي منها بالمحادثة. لا LOGIN أو future VALID UNTIL أو Job update أُرسل.

أُعدت scripts/assess/upload-worker-secret.py وأداة اختبارها لتجهيز الإصدار الأول فقط. تتحقق من CA والوجهة، وغياب versions بقراءة محدودة، وhidden prompt مرتين دون echo fallback، وJSON UTF8 بالحقول السبعة عبر stdin، مع منع HTTP logs في gcloud والتقاط stdout/stderr وتنقيح كل فشل. لا argv/env/secret file أو readback/API payload في المخرجات، ولا DB أو activation/mount/run. ترفض وجود نسخة سابقة، وتوقف فشل/غموض الرفع والنتيجة غير إصدار1 دون retry أو delete. لا secret حقيقية أُدخلت بالوكيل ولا gcloud حية نُفذت من البيئة.

عُرضت ميزانية متابعة الأداة سبعة ملفات، ثم وُسعت قبل تحرير الملف الثامن إلى إضافة CI: الأداة واختبار Python ودليل login ووثيقة قناة السر وهذا التقرير وHANDOFF وproject-status و.github/workflows/ci.yml. خطوة CI تشغل unittest الاصطناعية دون secrets أو مزود، ولا تعديل لباقي workflow. الأداة ليست ضمن image، ولا تغير الكود الذي بُني من6b568a2؛ لا إعادة image build/push. fixture CA عامة في الاختبار، والاعتمادات اصطناعية فقط. هذه حدود إدخال مغلق لا تنازل عن مراجعة provider logs/الإلغاء أو قبول TEMP قبل activation.

## 3. لكل مهمة

RAD-056 تبقى review/waiting_on owner لتشغيل أداة الإصدار الأول بكلمة العامل المخفية وإرجاع metadata فقط، بعد وصول describe وversions=[] ومراجعة المنح وصف postcondition المغلق. تبقى قناة credential ومراجعة PUBLIC/TEMP وهوية backend والإلغاء ومسؤول التشغيل والتنبيه غير مكتملة؛ no completion_evidence أو done. حدّث الوصف/source_ref والملخص الخماسي وrevision/time فقط للمهمة؛ تعارض RAD-024 الموروث محفوظ.

## 4. المشترك وScale واستمرارية الحكم

لا تغيير CPU1/memory512Mi/timeout300s/task1/parallelism1/retries0 أو عدم الجدولة وقيود الإنفاق من [حزمة القرار](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md). نقل الحزمة ثم image خاصة في repo واحدة هو سقف هذا التجهيز؛ لا repository عامة أو حفظ نسخ غير محدود. عند كل تغير runtime يلزم build جديد وdigest ومراجعة image، لا latest أو إعادة استعمال hash المصدر كـdigest للصورة.

إذن المالك غيّر الحد السابق من التحضير المحلي إلى إنشاء الموارد المسماة؛ لا يعمم إلى API key/admin DB credential أو grant على المشروع أو فتح بوابة أو قبول TEMP تلقائيًا. [تجهيز NOLOGIN](ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md#worker-login-stage-owner-result) و[توصية TEMP وقناة السر](ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) محفوظان؛ التخلي عن psql على اللابتوب لا يلغي الحاجة لاعتماد DB آمن وصلاحية فعلية قبل الاتصال أو مراجعة سطح الدور. لم يتغير حكم النسخة المؤجلة أو S-ASSESS-15/O108.

## 5. الطب والدرجات والخصوصية

لا Practice/طب/صور/درجات/expectations/hashes أو بيانات مستخدمين أو موافقات أو مصادر/ترخيص/Marker تغيرت. لا plaintext password أو verifier أو JWT أو مفاتيح Google قابلـة للتنزيل أو payload سر قرئت/كتبت. الحزمة تحتوي كود العامل فقط؛ health/worker RPC قد تكتب فلا تُستخدم تلقائيًا لاختبار read-only على الأصلية.

## 6. QA وحدود الأدلة

بدأ checkout نظيفًا على aefb857a218b109a5367412674dc83882b419267؛ docs:context/GitHub أثبتا [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) open/draft وغير مدموجة ورأسها مطابقًا، وmain ff68413042e6e8414ad70884efcfa71cac7443a7 مطابقًا لـorigin/main. check/deploy completed/success لكل من الرأسين؛ لا نقل إلى الرأس التالي أو subscribe/poll أو preview.

نجح bundling الحالي وnode --check للـCJS والـentrypoint، والتحقق من allowlist والأحجام والبصمات ومطابقة tar للمصدر المبني. تشغيل entrypoint محليًا مع ASSESS_JOB_ENABLED=0 أعاد STOP/configuration وexit1 والمخرجات المنقحة المتوقعة بلا stderr؛ لم تُحمّل credentials أو يُنشأ اتصال DB. لا Docker image جديدة بُنيت هنا أو رُفعت أو Job نُشئت/شُغلت. بناء الصورة السابق وشواهده يظلان بحدودهما في [تقرير الحاوية](ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md).

نجحت docs:check مقابل origin/main بلا errors أو review warnings وstatus:check مع require-previous وgit diff --check؛ تعارض RAD-024 الموروث بقي ظاهرًا دون تعديل. لا app build أو QA تطبيق/SQL/متصفح/Docker ناجحة معادة؛ المنتج لم يتغير. عند تسليم الحزمة المحلية الأولى لم يثبت نقلها؛ المتابعة أعلاه تحفظ انتقال التسليم إلى ZIP المصدر وشواهد النقل/build/push/create من المالك، دون تعميمها إلى تشغيل ناجح.

متابعة شواهد المالك بدأت بشجرة نظيفة على6b568a26a4bccc49c1c0cd3a772f50848f7aa0bd؛ docs:context/GitHub أثبتا بقاء #96 مسودة مفتوحة وmain المذكورة، وcheck/deploy completed/success لكليهما. نجحت فحوص docs/status/diff لهذه المتابعة بلا errors أو review warnings؛ لا إعادة app/Docker QA أو نقل CI للرأس التالي.

متابعة أداة السر بدأت على2abdc74d3513ff8a9b7bfed89c9638592f64b8e8 بشجرة نظيفة؛ docs:context/GitHub يثبتان #96 open/draft ورأسها مطابقًا وmain المذكورة، وcheck/deploy completed/success لكليهما. نجحت8اختبارات unittest اصطناعية: CA/شكل JSON وescaping، stdin فقط وعدم إدراج السر في args/env/output، منع وجود نسخة قبل prompt، تأكيد الكلمة، رفض echo fallback، تنقيح raw stderr/timeout وعدم retry، ورفض metadata إصدار غير1. لا اختبار يتصل بالمزود؛ subprocess/getpass مبدلان داخل الاختبار فقط، ولا CLI bypass في الأداة.

نجح Python compile، وتحميل CI YAML بـjs-yaml القائمة وفحص خطوة Python، واختبار تمرير UTF8 payload اصطناعية من Python إلى parseJobConfig الفعلية في Node bundle القائمة مع user=assess_job_a وpool1 وprojectRef الصحيح. نجحت docs:test75 وdocs:check بلا errors/review warnings وstatus:check مع require-previous وgit diff --check؛ تعارض RAD-024 محفوظ. لا lint Python منفصل متاح بالمشروع؛ فحص syntax وunittest هما فحصا الأداة، ولا app build/full check معادة لأن التطبيق والصورة لم يتغيرا. CI الجديدة ستشغل اختبارات Python؛ لا ننقل نتائج الرأس السابق للرأس التالي أو ندعي upload حيًا من mocks.

## 7. المتبقي وشواهد خارجية إضافية

أرسل المالك أسماء إعدادات Actions الخمسة فقط: CLOUDFLARE_API_TOKEN وCLOUDFLARE_ACCOUNT_ID وPILOT_SCHEMA_VERIFIED وNEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY؛ لا DB password ظاهر بينها. صور Pages Production وPreview أظهرت Variables/Secrets وBindings فارغة للمشروع نفسه. docker ps -a أعاد جدولًا فارغًا لسياق Docker الحالي، لا كل contexts أو ملفات/صور/volumes الجهاز. هذه حدود جرد استعمال الإدارة وليست ضمانًا عالميًا بعدم وجود consumers.

أفاد المالك بتغيير كلمة postgres وظهور تأكيد الحفظ، ثم استمرت auth failures؛ أرسل Pooler error من psql/session للمشروع الصحيح في state=auth_scram_final_wait. هذا رفض مصادقة، لا تشخيص مؤكد لكلمة خاطئة أو cache أو قياس Cloud Run. لا كلمة/peer IP أو raw logs محفوظة. لا طلب reset/تخمين/تثبيت psql جديد؛ انتقل المالك إلى تجهيز Google بدل تعليق العمل على هذه الأداة.

أثبتت versions=[] عدم وجود إصدار وقت قراءة المالك، ولم يصل بعد شاهد upload جديد أو مصادقة العامل؛ حسابه يبقى معطلًا بشاهد postcondition، وPUBLIC/TEMP والاعتماد/المزود/IAM الموروثة/إلغاء cache والجلسات/التنبيه غير مقبولة. تخزين صورة قد يستهلك حصة/تكلفة registry؛ ميزانية التنبيه ليست cap. لا direct IPv6 أو IPv4 add-on أو NAT أو تعطيل TLS كحل بديل تلقائي. لم تُفتح gate أو تُختبر JWT/backup/restore/export أو أُذن merge/ready.

## 8. تسليم المالك وبرومت الاستئناف

التالي نقل كود أداة uploader المحدد إلى Cloud Shell وتشغيلها مرة واحدة بإدخال كلمة assess_job_a المخفية، لا كلمة postgres. ترفض الأداة أي نسخة موجودة؛ عند PASS تُراجع metadata إصدار1 ثم mount بإصدار رقمي فقط مع إبقاء الحارس0. عند خطأ أو انقطاع توقف وافحص versions metadata؛ لا retry أو إظهار سر. تفعيل DB/login ومدة الصلاحية وTEMP والإلغاء واختبار credential/runtime خطوات مستقلة قبل أي tick حي؛ لا admin postgres في config. لا إعادة describe/surface/تعيين password أو staging/build/push/create الناجحين لمجرد تكرار الشاهد.

ابدأ AGENTS وHANDOFF وRAD-056 وهذا التقرير وحزمة الربط، ثم docs:context/GitHub للرؤوس وفحوصها. تابع checkout نفسه بلا worktree/subagents؛ اشرح وظيفة كل خطوة للمالك قبل تنفيذها، وحدد ميزانية ومعايير قبول لأي تعديل. لا إعادة إنشاء Google resources أو مرحلة NOLOGIN أو TLS أو النقل/build/push الناجحين؛ لا طلب سر في المحادثة أو admin login للعامل أو فتح gate أو ready/merge/auto-merge. بقية نطاق الربط يحتاج تهيئة credential آمنة وفحصًا منفصلًا قبل أي worker tick حي.
