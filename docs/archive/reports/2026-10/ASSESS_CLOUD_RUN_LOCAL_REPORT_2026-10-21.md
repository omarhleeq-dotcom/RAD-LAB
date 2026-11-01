# تقرير حاوية Assess وentrypoint المحلية — 2026-10-21 عمّان

## 1. السلطة والميزانية والانحرافات

قال المالك «خلينا نبدا» بعد تثبيت اختيار Cloud Run وتسليم خطة الحزمة المحلية. استمر الإذن المحلي والحفظ/الرفع إلى #96 فقط، دون موارد خارجية أو SQL كتابة على الأصلية أو إعداد إنتاج أو نشر/runtime/عامل/schedule أو فتح gate أو تغيير PR state. قُرئت AGENTS وdocs:context وRAD-056 والتسليم وخطة Cloud Run ودليل runtime والنقل والخدمة والصيانة والـlease ومراجع Docker في مهارة cloud-environment-runtime. البيئة المحلية Docker متاحة بحساب UID1000؛ لا هوية Google متصلة أو أسرار جاهزة مستخدمة، ولا worktree/subagents.

عُرضت قبل التحرير ميزانية **13 ملفًا** وهي الفعلية: src/features/assess/server-job.ts وserver-job.test.ts؛ scripts/assess/job-main.mjs وruntime.Dockerfile وbuild-runtime.mjs وjob-process-rehearsal.mjs وjob-process-child.mjs؛ scripts/pages/frontend-schema.json؛ docs/ASSESS_CLOUD_RUN_PLAN_2026-10-21.md وASSESS_RUNTIME_LOCAL.md وهذا التقرير وHANDOFF.md وproject-status.md. لا انحراف؛ لا تغيير server-service/server-runtime أو المصحح/SQL أو UI أو package/lock أو workflow أو pins/Variables.

## 2. المنجز والمستبعد

**الحزمة:** server-job تنفذ runAssessJobs القائمة مرة واحدة بـlimit=1 وpool=1 ثم تنتظر close. تُسجل إشارات SIGTERM/SIGINT قبل قراءة الإعداد، ولا تُلغى RPC جارية؛ signal تمنع claim التالية. لا loop أو timer تشغيلي أو endpoint/PORT أو تثبيت محتوى/recover تلقائي أو عامل/صيانة/حذف مكرر. المستخدم ما زال Supabase Auth/Data API بهوية JWT يفحصها المزوّد ثم تفويض SQL، بلا هوية من body أو admin/service key باسمه.

**الإعداد:** entrypoint ترفض flags، وتطلب ASSESS_JOB_ENABLED=1 صراحة قبل قراءة ملف واحد ثابت /run/secrets/assess-worker.json؛ حجم≤64KiB، وحقول host/port/database/user/password/ca فقط، بلا fallback/DSN/connectionString أو connections/limit من العميل. النقل القائم يعيد فحص config والدور ويشترط TLS/CA وlogin محدودًا. لا ملف سر حي أو secret manager/IAM أُعد أو طُبع. تفعيل entrypoint لا يفتح launch_gate ولا ينشئ موافقة v2 أو إسنادًا أو صلاحية نشر.

**الرد والإغلاق:** عقد assess-job/1 يخرج COMPLETE/0 بعد tick وإقرار التنظيف فقط، أو STOP/1 عند configuration/unavailable/grading_uncertain/cleanup_failed، أو STOP/stopped/130 عند الإيقاف التعاوني. تنسخ أعدادًا صحيحة آمنة محددة وتترك counters غائبة عند فشل النقل/شكل الرد، دون اختراع zeros. failed بعد finish غير المؤكد لا يثبت غياب النتيجة؛ SQL مصدر الحقيقة، ولا تثبيت ثانٍ أو علامة صفر. التكرار والإغلاق/التعطيل والتسوية وretry_at ونوافذ C كما هي.

**الصورة:** build-runtime ما زال يبني المكتبة الخاملة ويضيف assess-job.cjs وentrypoint وDockerfile إلى مجلد مؤقت محدود. الصورة تنسخ ملفي assess-job.cjs وjob-main.mjs فقط، من Node24.19.0-bookworm-slim المثبت بـdigest `sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df`. تعمل USER node وENTRYPOINT exec/Node PID1؛ لا npm/RUN أو تحميل شبكة داخل Dockerfile ولا secret/checkout/QA modules في /app. استُخدم daemon المحلي المحدد صراحة، مع proxy الموروث والتحقق من TLS عند pull، وbuild --network=none؛ لم يحتج البناء mount CA لأنه بلا خطوة HTTPS داخل الحاوية. لا صورة دُفعت إلى registry أو Cloud Build أو خدمة حية.

**الشاهد:** parent محلية تنشئ PostgreSQL18.4 جديدة عبر openLocalDatabase القائمة، وتطبق السلسلة على القاعدة الفارغة وحدها، وتستخدم MCQ حروفًا اصطناعية ومسار content_submit/installMixedContent/assign/consent/start/save/submit القائم. child عملية Node حقيقية تستعمل lifecycle المجمعة، ونقل pg/Unix socket اصطناعي بهوية login محدودة وSET LOCAL ROLE assess_worker. لا TLS الإنتاجية أو JWT مزوّد في هذا الشاهد. IPC محلي خاص يحدد حد ما قبل COMMIT أو ما بعده/قبل رجوع الإقرار، ثم يرسل الأب SIGTERM/SIGINT/SIGKILL إلى PID طفلته وحدها. الأب يقرأ من اتصال مستقل بقفل ينتظر نهاية المعاملة، بلا polling أو pause زمنية مفترضة.

## 3. RAD-056

تبقى review/waiting_on reviewer دون completion_evidence. حُدث الوصف والمصدر والملخص الخماسي والتسليم وخطة Cloud Run والدليل بحسب الحزمة المنفذة محليًا وحدود الشواهد. رُفعت revision والوقت، وحُفظ تعارض RAD-024 وأدلة RAD-058 وبقية المهام. لا اكتمال حي أو O106/O108 أو provider proof من الصورة.

## 4. المشترك وScale والقرارات

المشترك الجديد lifecycle للخادم فقط، وتغليف المكتبتين؛ server-service والنقل الحالي وmaintain والمصحح وlease/finish/fail/recover والحذف الذري لم تتغير. أُضيف server-job إلى serverModules لمنع وصول المتصفح، بلا إعادة pin أو تغير متطلبات SQL/marker. لا تغيير ruling اختيار Google أو S-ASSESS-15 أو تأجيل النسخة، وروابط أصولها محفوظة؛ تغير وصف الحزمة من مقترح إلى تنفيذ محلي فقط.

السقف tick واحدة وbatch/pool1 لكل عملية، بلا queue أو retry جديد؛ كل مرحلة صيانة لها حدها لا إجمالي صف واحد لكل tick. tasks=1 وparallelism=1 وmaxRetries=0 في خطة المزوّد مقترحات إعداد **غير مطبقة**؛ تداخل executions مستقلة لا تمنعه هذه القيم. رفع السعة أو تغيير الحدود يحتاج قياس DB/ذاكرة/شبكة وتداخل ومراقبة وتكلفة، لا وعد QPS أو Free. الأعداد المقروءة لا تحتوي قائمة طلاب.

الشاهد محدود Linux x64/Node24/PostgreSQL18 محليًا وأربع child processes للحدود المراجعة، وليس مقياس سعة أو provider/pooler. الساعة والـlease/عمر المحاولة معدلة اصطناعيًا في قاعدة جديدة، لا انتظار5دقائق/7أيام فعلية. صورة Node مثبتة قابلة للتجديد بمراجعة dependencies/أمن لاحقة؛ لم يُنفذ فحص ثغرات الصورة أو Google readiness. السر خارج الصورة وقراءة non-root في Secret Manager الحقيقي تحتاج إثبات صلاحيات mount وإلغاء مستقل.

فجوة10ثوانٍ محفوظة: نجاح signal التعاونية أو PID1 بمحاكاة لا يضمن تسوية معاملة SQL60ثانية قبل قتل Cloud Run. لا تعديل statement/lock timeout أو lease/retry_at أو نافذة الاسترداد؛ القتل قد يترك عدم يقين COMMIT أو lease قائمة. لا ادعاء finally عند SIGKILL أو أن اختيار task timeout أطول يحل القتل/انهيار المضيف.

## 5. الطب والدرجات والخصوصية

لا محتوى/صورة أو مصدر/ترخيص/معيار/Marker أو درجة/إعداد Practice أو توقع/hash قائم تغير. MCQ حروف fixture هندسية، لا اعتماد طبي أو O108. v2 محلية صريحة في fixture فقط؛ v1 لا تنوب عنها، ولا قبول نيابة عن أحد. SQL والجرد والزوج المغلق على الأصلية مكتملة ولا تعاد للشاهد.

المخرجات whitelist من contract/outcome/code/counts/cleanup/checks وأعلام false بحسب الأداة، دون claims/أجوبة/إعدادات/علامات/هويات/أسرار أو أخطاء خام وسببها. الأعطال الاصطناعية تحتوي sentinel خاصًا للتأكد من عدم ظهوره. لا events/telemetry جديدة؛ بيانات درجات fixture تقرأ داخليًا للفحص ولا تطبع. PostgreSQL QA تعطل statements/parameters/raw SQL errors وفق helper القائمة وتتلف cluster بعد الانتهاء. logs Google/host/proxy وIAM والأسرار والتدوير/الإلغاء الحي غير متحققة من ذلك.

## 6. QA وGitHub وحدود الدليل

عند الاستئناف تحقق docs:context/GitHub من #96 open/draft وغير مدموجة على `5b49e40fe449766c1d59a57422f63ffea03b5d4a`، و[CI39508264623](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39508264623) و[Deploy39508264707](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39508264707) completed/success وhead_sha مطابق. main الحالي بعد fetch هو `ff68413042e6e8414ad70884efcfa71cac7443a7`، و[CI39464823281](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39464823281) و[Deploy39464823264](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39464823264) ناجحان على الرأس نفسه. لا نقل إلى رأس التسليم الجديد أو نشر runtime/هاتف/قبول حي. لم يُعَد workflow أو تُفتح معاينة مستضافة.

- lifecycle/entrypoint:12اختبارًا جديدًا ناجحًا، مع12للنقل القائم مستهدفة. تشمل shape/حدود config، pre-abort والتوقف أثناء تحميل السر، tick واحدة وإغلاقها، signal والتنقيح، فشل maintain/claim/health بلا counts مختلقة، grading_uncertain بلا replay/zero، الرد المشوّه وcleanup_failed، وبناء الحزمة وتشغيل entrypoint الفعلية دون إعداد/مع flags مرفوضة. typecheck وlint المستهدفان ناجحان.
- شاهد assess-job-process/1:PASS على PostgreSQL18 محلية مع cleanup=true وruntimeOrLaunchVerified=false. SIGTERM/SIGINT أثناء finish أكملتا COMMIT ثم توقفتا130؛ SIGKILL قبل COMMIT رجعت كتابة النتيجة مع بقاء التفاصيل وlease، فلا تصحيح فوري قبل انتهائها؛ بعد انتهاء lease الاصطناعي ثبتت نتيجة واحدة وحذفت التفاصيل ورُفض token القديم. SIGKILL بعد COMMIT وقبل الإقرار أبقت نتيجة واحدة وحذفت التفاصيل ولم تبدأ تصحيحًا ثانيًا. retry_at حُترمت وrecover صريحة، ونافذة7أيام لم تنتج صفرًا، ولم تكتب Practice/events/feedback. النتائج المثبتة في الحالات المفحوصة طابقت درجة fixture داخليًا.
- Docker محلي:نجح build بصورة مثبتة ودون شبكة خطوات البناء؛ فُحص USER node وملفا /app فقط. تشغيل read-only/network=none/cap-drop=ALL رفض غياب التفعيل، وغياب الملف عند التفعيل، وJSON المشوّه وملفًا أكبر من64KiB بخروج1 وconfiguration بلا stderr/سر. فحص PID1 منفصل استخدم lifecycle الفعلية وworker محاكى، وأكد استقبال SIGTERM وإنهاء tick/close وخروج130 بغير root، لا اتصال PostgreSQL/TLS من داخل الصورة.

نجح npm run check كاملًا: typecheck وlint و**139 ملفًا/2269 اختبارًا**، بما فيها حراس Practice/characterisation/scoring/marker/store/scene-dom والعزل والنشر وretention. نجح npm run build وnpm run build:pages، بإعداد pilot غير مفعل محليًا ودون أسرار أو شهادة مزود؛ finalize-headers أبقى connect-src self. فُحصت static chunks ولم توجد executeAssessJob أو assess-job/1 أو ASSESS_JOB_ENABLED أو assess-worker.json أو radlab-assess-worker-v1. بعد إضافة تحقق الدرجة الخاصة وخلو Practice إلى الشاهد وحده أعيد شاهد PostgreSQL وlint المتغير ونجحا؛ لا تغير منتج بعد full check/build أو تكرار QA ناجحة بلا سبب.

نجحت docs:check مقابل origin/main بلا errors أو review warnings، وstatus:check مقابلها مع require-previous وgit diff --check، مع بقاء تعارض RAD-024 الموروث. لم تتغير توقعات قديمة أو hashes أو timeout أو حارس نشر. تحذيرات Node24 للـloader المرجعي ظهرت في parent QA فقط دون بيانات؛ الحاوية والطفلة تستعملان bundle دون loader.

تشخيص الفشل دون إخفاء: توقع الشاهد **الجديد** خطأً بقاء صف void بعد maintain؛ مراجعة C أثبتت أن المعاملة نفسها تضبط expiry وتحذف الصف. صُحح شاهد النافذة ليتحقق من غياب session/details/result ورفض recover55000، دون تغيير SQL أو توقع قديم. كشف typecheck في الاختبار الجديد نوع call أضيق من AssessRpc وغياب NODE_ENV من env الاصطناعية؛ صُحح النوع والبيئة. فحص PID1 المؤقت الأول انتهى قبل إرسال الإشارة لأن Promise المحاكاة بلا I/O لا تُبقي event loop حية؛ أضيف مؤقت QA محدود لإبقاء fixture عند الحد، وأُزيل عند signal، ثم نجح. لا مؤقت إنتاجي أو رفع مهلة أو تعديل توقع/hash قديم أو تخفيف guard لإخفاء فشل.

لم يُعد تدقيق EN/AR390/1440/axe أو هاتف؛ لا UI/نص/مشهد تغير. لا installer/preinstall/postinstall أو أداة حسابين أو rehearsal إنتاجي معاد. parent/child QA محليتان؛ PID1 بمحاكاة وcrash بـPostgreSQL منفصلان، لا برهان PID1+TLS+Google مجتمع أو توقيت استجابة تحت حمل أو قدرة مزوّد.

## 7. المتبقي والبوابات

الحزمة جاهزة **للمراجعة المحلية** لا للنشر المعلن. project/region وCPU/ذاكرة/task timeout والتكلفة/الفوترة ومسؤول التشغيل وservice account/IAM والسر/CA/login والشبكة/IPv4-v6/pooler وACL والإلغاء والتنبيه والجدولة لم تُجهز. لم يُنشأ مشروع أو API أو Artifact Registry/Cloud Build/Secret Manager/Job/Scheduler، ولم تستخدم Google credentials أو مفاتيح خدمة Supabase. لا provider/TLS/JWT حية أو image vulnerability scan أو تجربة سحب الصلاحيات الفعلية.

الحذف وlease/recovery من C نفسها، والإغلاق/التعطيل يمنعان بدءًا جديدًا دون حاجز إضافي في تسوية المستحق؛ أدلة retention القائمة مستقلة. launch_gate الأصلية مغلقة وفق آخر صف SQL ولم تُلمس؛ runtimeOrLaunchVerified=false مقصودة، ولا محاولات/حذف/صيانة/قبول حي على الأصلية.

النسخة الشاملة مؤجلة لنهاية العمل باختيار المالك، دون إعادة سؤال أو تجهيز تلقائي. backup/recovery/provider غير مثبتة؛ snapshot قديمة قد تعيد إسنادًا مغلقًا أو حسابًا معطلًا أو موافقة/metadata محذوفة. purge النتائج وlaunch_gate وحدهما لا يحجران history/consent وبقية القراءات؛ يلزم حجر الشبكة/API/الهويات ثم إعادة الآثار والحذف وACL قبل رفعه. لا نظام نسخ إنتاجي أو export/restore أُنشئ.

O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، وruntime والعامل والجدولة والمراقبة والنسخ والاستعادة والتصدير والنشر بوابات مستقلة. لا إعلان قبول تجريبي حي مكتمل أو موافقة بالنيابة.

## 8. الخطوة التالية وتسليم المالك

راجع ملفات lifecycle/entrypoint/Dockerfile والشواهد وحدودها. التالي تجهيز قرار ربط خارجي قابل للمراجعة: project/region والتكلفة ومسؤول التشغيل وIAM الأقل صلاحية وسر/CA/login/network/ACL والإلغاء والمراقبة، ثم إذن مستقل لأي إنشاء/نشر/تشغيل. لا إعادة سؤال المزوّد أو النسخة؛ لا إعادة QA ناجحة بلا تغير مؤثر. لا تتخذ counts.complete المحلية شهادة مزود أو إطلاق.

برومت الاستئناف: AGENTS وHANDOFF وRAD-056 والدليل وهذا التقرير، ثم docs:context وGitHub لأحدث main و#96 وفحوص كل رأس. تابع checkout نفسه، لا worktree/subagents أو merge/ready/auto-merge أو SQL كتابة/Variables/PILOT_SCHEMA_VERIFIED أو موارد/نشر/runtime/عامل/schedule أو فتح gate من تسليم محلي. افصل كل دليل بناء/ربط/تشغيل/مراقبة/استعادة.
