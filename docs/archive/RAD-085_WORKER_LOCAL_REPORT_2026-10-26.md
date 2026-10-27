# RAD-085 — تجهيز عامل التصحيح واختباره محليًا

## 1. الانحرافات والميزانية

الهدف الواحد: تجهيز عامل التصحيح للمسارين mixed وfull-practical وإثباته على PostgreSQL صناعية معزولة، دون تشغيل عام أو مزوّد. الميزانية المعلنة15ملفًا، ثم16 بإضافة local-database لإثبات rollback المعلوم دون تغيير توقعات قديمة. الفعلي: server-runtime وserver-service وserver-worker واختباره؛ build-worker وworker-main وworker.Dockerfile وrad085-worker-rehearsal وrad085-worker-fixture وlocal-database؛ ci.yml؛ هذا التقرير والعقود وحزمة التطبيق وHANDOFF وproject-status. لا تعديل لملفات SQL المحمية أو بصماتها أو توقعاتها؛ DDL الحاضنة صناعية فقط، ولا استثناء جديد استُخدم أو طُلب.

بدأ checkout على main بشجرة نظيفة؛ docs:context تحقق مباشرة أن#137 open/Draft/unmerged عند24c71a483c948a7e6b80c92a1f613ac1f99f0eea، وmain عند31e9cbfba6574a9e87b59d47a687f99864c74b21. لذلك فشل status:summary أولًا بـunknown task. جُلب الرأس وانتقل checkout نفسه إليه بفرع محلي جديد، ثم قُرئت الحالة والأدلة. لا worktree/subagents أو git reset/clean/stash أو عمل موجود مفقود. فُحصت الفروق قبل التعديل. استُخدمت مهارة [cloud-environment-runtime](skill://plugin_connector_1p_c5b7d5df5d7081918f2c4be5a633ed5d/cloud-environment-runtime/SKILL.md) وتعليمات Docker والشبكة؛ لا هوية مزوّد أو أسرار تشغيلية في البيئة استُعملت.

الجرد فرّق بين [صورة Job التاريخية](../ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md)، وحزمة trial ذات النطاق/الهوية التاريخيين، وهذه الحزمة. المصحح والخدمات والتثبيت وclaim/lease/finalize موجودة وتدعم المسارين؛ الفجوات كانت فصل الدور، مصدر البناء والإصدارات، حجر الاستعادة، ACK وSTOP، وإثبات الصورة والصلاحيات والمراقبة. لم تتحول trial_scope أو هوياتها أو استثناء TEMP التاريخي إلى إذن عام.

## 2. المنجز والمستبعد

[build-worker](../../scripts/assess/build-worker.mjs) هو مصدر البناء الوحيد لهذه الحزمة، مع [Dockerfile](../../scripts/assess/worker.Dockerfile) و[entrypoint](../../scripts/assess/worker-main.mjs). يستخدم العامل runAssessJobs وgradePublication وvalidatePublication وSQL القائمة؛ لا مصحح أو دورة محاولة أو صيانة/محو/استرداد موازية. بقي tick=1 وpool=1؛ tasks1/parallelism1/platformRetries0 توصيف للحزمة، وليس موارد Cloud Run منشأة.

الصورة **محلية اصطناعية فقط**: entrypoint تقبل flag واحدة ثابتة RAD085_SYNTHETIC_WORKER=1، وملفًا محدودًا بلا symlink أو flags أو ENV/URL fallback، وترفض أي وجهة سوى rad085-postgres:5432/rad085_synthetic بهوية الاختبار. هذا قيد حاضنة، وليس allowlist تشغيل عام. المصدر القديم وأدواته باقية أدلة خاملة؛ لا تفعيل مسار قديم بديلًا عن حواجز الجديد.

الحاضنة تزرع محاولات **موجودة عند مرحلة grading** ببيانات اصطناعية، بعد مرشح وتثبيت وإسناد عبر الخدمات القائمة. لا start بديلة أو فتح launch_gate؛ بقيت false طوال الشاهد. موافقة هوية اختبار صناعية عبر consent_v2 القائمة ليست قبول مستخدم أو مالك. الربط P1/P2 والجسر واختبارات بدايات المحاولات السابقة أدلة مستقلة محفوظة.

## 3. حسب المهمة

RAD-085 تبقى review/owner؛ لا completion_evidence أو إغلاق RAD-059/RAD-063 أو قبول مالك/هاتف. أُنجز تجهيز العامل المحلي، وتبقى أدوار/قنوات ومراجعات التشغيل العام محجوبة. المخزن التشغيلي للدليل ومصدر head الحديث وقنوات الحذف والسحب والإبطال ومسؤولها وحالة الكاتب المحجوب لم تُحل في هذه الدفعة. تقارير [المحو](RAD-085_ERASURE_REPORT_2026-10-26.md) و[التعافي](RAD-085_ERASURE_RECOVERY_2026-10-26.md) و[الاتصال](RAD-085_CONNECTION_IDENTITY_2026-10-26.md) تبقى سلطات حدودها.

## 4. المشترك والإصدارات والصلاحيات وScale

| الحد | المصدر والتحقق |
|---|---|
| worker | rad085-grading-worker/1: إصدار غلاف التشغيل؛ ليس إصدار تقييم جديدًا |
| evaluator | assess-grader/1 القائم، دون تغيير |
| Practice | radlab-practice-evaluation/8 القائم، دون تغيير |
| case | caseVersion القائمة: SHA-256 لكل حالة وكل بياناتها مع هويتي التقييم؛ جميع الحالات في manifest الناتجة |
| المحتوى | publication المثبتة وsnapshot المحاولة: assessment/item/case/evaluator refs المثبتة، مع مفاتيح ومراجعة هندسية خاصة. لا تبديل content إلى latest أو تعديل snapshot عند mismatch |
| سلسلة البناء | manifest.json: بصمات ملفات الصورة ومدخلات المصدر وpackage-lock وكل migrations، وحدود الحزمة والإصدارات. entrypoint تقارن هويات runtime وبايتات bundle/entrypoint؛ مصحح claim يعيد التحقق من refs |
| أساس الصورة | Node24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df |
| قاعدة الحاضنة | PostgreSQL18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382 |

بناءان متتاليان أثبتا تطابق manifest وبايتات bundle، وبناءا Docker تطابقا في image ID محليًا مع cache نفسها. هذا ليس إثبات reproducible OCI عبر أنظمة مستقلة أو سلسلة توريد مدققة. npm ci بالـlock شرط البناء؛ لا تحديث اعتماديات أو حزم أثناء الصورة. السياق المنقى ثلاثة ملفات فقط في /app، root:root/mode0444، USER node/UID1000 وexec entrypoint/Node PID1. التشغيل read-only، بلا capabilities، no-new-privileges، tmpfs محدودة noexec/nosuid؛ لا تحميل HTTPS داخل Dockerfile أو حاجة لنسخ CA الجلسة. pull/install عبر proxy والثقة الموروثة مع TLS مفعلة. كلمات الاختبار تولدت **بعد** بناء الصورة ولم تدخل context أو طبقاتها.

ملفات الإدخال الخاصة تبقى mode600. الحاضنة تستخدم volume مملوكة UID1000 ومثبتة قراءة فقط للعامل، مستقلة عن UID مضيف CI؛ helper UID1000 بلا شبكة/capabilities تكتب payload عبر stdin دون logs. preparer صناعي منفصل UID0 مع CHOWN وحدها يضبط ملكية volume الفارغة قبل وجود أي credentials، دون DB أو شبكة أو Docker socket. ليس مستخدم العامل أو مسار تشغيل مزوّد. PostgreSQL الصناعية تعمل UID/GID مالك ملفاتها في المضيف، مع tmpfs بنفس الملكية. لا chmod عام لكلمة المرور أو المفتاح أو permit، ولا تشغيل العامل root؛ manifest الاختبار المخالفة وحدها بيانات بناء عامة قابلة للقراءة.

| الهوية | القدرة الفعلية محليًا |
|---|---|
| مستخدم/مشرف | authenticated/auth.uid وعقوده القائمة؛ لا token عامل أو اختيار هوية من طلب |
| جسر | assess_authoring_bridge ودليل اتصاله السابق؛ لا عضوية للعامل أو مشاركة secret |
| مثبت fixture | منفذ حاضنة إداري منفصل يستعمل خدمات التثبيت القائمة فقط لتجهيز العينة؛ ليس هوية العامل |
| LOGIN اصطناعي | rad085_synthetic_worker: NOINHERIT، expiry صناعية محددة، لا إدارة/تجاوز RLS؛ عضوية SET-only واحدة في assess_grading_worker |
| دور التصحيح | NOLOGIN/NOINHERIT بلا عضويات: USAGE assess وEXECUTE لخمس دوال قائمة: maintain_v1/claim_v1/finish_v1/fail_v1/health_v1. لا recover أو نشر أو حزم مراجعة أو جداول/حسابات/surveys أو جسر |

createGradingWorkerBinding يعيد فحص LOGIN/expiry/العضويات وSET/INHERIT/ADMIN والدور والمنح الفعالة قبل كل RPC؛ يرفض منح assess الإضافية أو وصول جداول public/auth/assess أو CREATE/TEMP. PostgreSQL16+ لازمة لحقول العضوية المفحوصة؛ الإثبات هنا18.4 فقط. لا CREATE/TEMP من PUBLIC في قاعدة الحاضنة. **لم نَسحب منح PUBLIC من قاعدة مزوّد مشتركة**؛ أثر ذلك على التطبيقات الأخرى يحتاج تصميمًا ومراجعة منفصلين، ولا يُورث استثناء TEMP التجريبي. الدور الجديد موجود في fixture فقط؛ لا migration أو LOGIN تشغيلي جاهز. الجرد الكامل للمزوّد، ومنها sequences والأدوار وقواعد البيانات والمخططات/الامتدادات الأخرى والمالكون وdefault privileges، يبقى شرطًا مستقلًا؛ probe وقت RPC ليست شهادة ACL شاملة.

الناقل ذاته يستعمل معاملات SET LOCAL القائمة. خطأ اتصال/إقرار في مسار التصحيح يوقف binding نهائيًا دون reconnect صامت؛ تُستهلك أخطاء الاتصالات الخاملة والمستعارة دون raw logs. لا advisory lock أضيف أو افتراض ثبات backend عبر RPCs؛ SQL lease/token هي مصدر التزامن. نجاح تداخل صورتين لا يثبت سعة إنتاج.

runAssessJobs أضافت خيارات مضيف موثوق للمصالحة والمقاييس وstopBeforeFinalize. العامل الجديد يترك lease عند STOP قبل finalize؛ المسار التاريخي يحفظ عقد drain للـclaim المعلومة. كلاهما ينتظر RPC الجارية. بعد finish غير المحسومة لا fail/recover/finish تلقائية ولا claim تالية. يمكن استعمال fail تحت token الحالية فقط عند فشل تقييم محلي معلوم، أو rollback أقرّ به adapter **قبل محاولة COMMIT**. SQLSTATE أو ROLLBACK لاحق بعد COMMIT مجهولة لا يكفيان. local-database تضيف علامة داخلية بعد rollback المؤكد؛ لا تغيير SQL أو توقع قديم لتجاوز الحارس.

Scale: حد tick1/pool1 ثابت؛ لا queue/retry تطبيقية أو رفع حدود lease5دقائق/retry/نافذتي24ساعة و7أيام أو statement60s/lock5s. قارئ مقاييس QA محدود101صفًا ويرفض تجاوز100، وليس observer إنتاجيًا؛ health_v1 القائمة تجمع الجلسات كما كانت. manifest تتسع للحالات المسجلة من المصدر؛ الإصدارات الجديدة تحتاج حزمة بناء ومراجعة، ولا تحديث صامت. private reviews وحدود المحتوى والاحتفاظ من العقود السابقة باقية. رفع السعة أو ربط pooler أو إدخال observer تشغيلي يحتاج قياسًا وتصميمًا مستقلين.

## 5. الطب والدرجات والخصوصية

mixed تحتوي MCQ حروفًا وأجزاء محاكي قائمة؛ full-practical تستخدم حالات قائمة ومحتوى engineering/SYNTHETIC داخل الحاضنة فقط. initialSettings هنا عينة توافق، وليست إجابة أو خلفية معتمدة طبيًا. لا مصدر أو ترخيص أو مراجعة مستقلة أو اعتماد سريري مخترع. لم تتغير حالات أو درجات أو أوزان أو بوابات حرجة أو نسخ تقييم أو Marker أو صور/فحوص/كتابي. بقيت O108 والمصادر والرخص والمراجعات الحقيقية مطلوبة.

اختُبرت hidden من result_v1 الحقيقية للمشارك؛ لا درجة أو maximum أو مفاتيح أو تفاصيل. السجلات تقتصر على عقد/كود/أعداد/مدد وCPU/RSS؛ لا attempt/token أو إجابات أو أسئلة أو هوية/نص SQL أو credentials. canary لملاحظة خاصة لا تظهر في الردود أو stdout أو PostgreSQL logs؛ كلمة الاختبار لا تظهر في logs. بعد نجاح finish تحذف التفاصيل والإيصالات ذريًا، ولا يعاد تقييم النتيجة المحفوظة عند tick لاحقة.

## 6. QA والإيقاف والمصالحة والقياس

أمر الإثبات الآلي المطلوب في CI، دون skip أو تخفيف حارس:

```sh
npm ci --ignore-scripts
node scripts/assess/setup-rad085-postgres.mjs
node scripts/assess/rad085-worker-rehearsal.mjs
```

وصفة بناء فقط: npm ci ثم node scripts/assess/build-worker.mjs؛ ينتج مجلدًا مؤقتًا ومسار manifest، ثم docker --host=unix:///var/run/docker.sock build --network=none -t rad085-worker-local <output>. لا push أو registry أو gcloud أو نشر. الحاضنة تملك network/container/image/قواعد وملفاتها وتزيلها في finally؛ لا استعمال DB URL أو إعداد PG موروث، ولا host networking أو منفذ مستضاف أو tunnel. الشبكة internal بعناوين محلية مملوكة للشاهد، مع TLS/CA واسم/SAN صحيحين؛ اختُبر رفض CA واسم خاطئين، لا TLS/IAM/pooler مزوّد.

| الشاهد | النتيجة وحدودها |
|---|---|
| المساران | صورة فعلية مع PostgreSQL فعلية ودور محدود؛ مقارنة الكسور بالمصحح القائم، hidden ومحو التفاصيل، وtick لاحقة بلا إعادة تصحيح |
| mismatch | case/evaluator/item وworker manifest مرفوضة؛ snapshot مخالفة تفشل بلا نتيجة/تغيير محتوى وتبقى نافذة retry القائمة |
| الذرية | فشل حذف التفاصيل أثناء finalize يرجع النتيجة كلها؛ لا صفر أو reconnect/إصلاح محتوى تلقائي؛ تسوية لاحقة فقط بعد معالجة علة العينة وانتهاء lease الاصطناعية |
| STOP | قبل claim وبعدها وقبل finalize وبعد COMMIT؛ بعد commit نتيجة واحدة، وقبلها تبقى lease للتسوية. فحص إضافي يمنع claim إذا وصل STOP أثناء verifier |
| SIGTERM/PID1 | إطلاق الصورة الحقيقي: drain لـfinish المحجوزة ثم STOP وإغلاق pool؛ وعند تجميد PostgreSQL الاصطناعية يتوقف PID1 بحد8ثوانٍ، دون رفع timeout؛ حد ملاحظة Docker الخارجي10ثوانٍ. OS تغلق sockets، والنتيجة تحتاج قراءة مستقلة |
| lease/ACK | فقد ACK محقون بعد claim/finish/health حقيقية، وقطع backend حقيقي؛ لا mutation عمياء. رفض token منتهية/قديمة/أجنبية ومحاولة أخرى، وتكرار finish بنفس token لا يكرر النتيجة |
| التداخل | صورتان فعليتان بالتزامن؛ كل محاولة لها نتيجة واحدة. لا قفل اتصال جديد |
| المراقبة | فشل sink أثناء التقييم وفشل health بعد finish لا يسربان payload أو يعيدان الكتابة؛ counters المفقودة لا تصير صفرًا. backlog/lease من observer قراءة فقط، منفصل عن العامل |
| الاستعادة | entrypoint ترفض permit مفقودة/قديمة/غير مكتملة/غير مُبطلة أو بناء مختلف. الإصدار المحلي يصدر بعد reconcileSynthetic القائمة على دليل خارج القاعدة وhead مجمدة ومراجعة الصيانة/الإبطال، لتاريخ صناعي **فارغ جديد فقط**. replay حذف/سحب غير فارغ وفشل قنواته مثبتان في اختبار التعافي المطلوب القائم؛ لا ادعاء replay مزوّد أو مخزن دليل تشغيلي |

permit ليست اعتماد تشغيل: قناتها مضيف اختبار موثوق وmount قراءة فقط أثناء التنفيذ، وتُعاد قراءتها قبل مراحل العمل. لا verifier تشغيلي أو قبول frozen=true من مصدر غير موثوق. لا يبدأ ربط عام حتى دليل كامل لكل الحذف والسحب والتعطيل والإغلاق والصيانة وإبطال الجلسات والقدرات/pool/cache والأسرار الأحدث من restore؛ launch_gate وحدها لا تثبت ذلك.

أُعيد شاهد العمليات التاريخي بعد الفصل: SIGTERM/SIGINT وSIGKILL قبل COMMIT وبعده، رفض token قديمة وretry_at والاسترداد الصريح ونافذة7أيام، بلا صفر أو كتابة Practice. حقن فقد ACK الجديد بعد استلام adapter للإقرار يثبت فقد التسليم إلى الخدمة؛ شاهد القتل التاريخي يثبت حد العملية قبل الإقرار. لا ادعاء اختبار شبكة مزوّد/partition حقيقية من wrapper.

تعثرات العمل لم تُخفَ: منفذ شبكة internal لا ينشر للمضيف، فاستُخدم عنوان bridge المحلية مع CA/SAN؛ COPY root مع mode600 من المضيف منع قراءة entrypoint، فثبتت mode0444؛ اختبار قطع backend كشف listener مفقودة للاتصال المستعار فأُصلحت ونُظفت موارده؛ STOP الجديدة اصطدمت بتوقعات drain القديمة فصارت opt-in؛ فشل الحذف المؤكد انفصل عن غموض COMMIT بعلامة rollback الموثوقة. [CI الرأس3c3c622](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/40373038854) فشلت في postgres-connect مع cleanup=true، بينما النشر متخطى؛ أُصلح افتراض تطابق UID المضيف والحاوية بعزل الملكية أعلاه، دون جعل الأسرار عامة أو تخطي الاختبار. لا رفع مهلة أو تغيير توقع/بصمة أو skip.

نجح شاهد الصورة النهائي بعد فصل ملكية UID، بجميع حدوده وcleanup=true وruntimeOrLaunchVerified=false. manifest SHA-256: `09a94bfe91b7515ea58606daf5582d702a3973f2baab35ca9db180c83ab6b8b4`؛ image ID محلي (ليس Registry digest): `sha256:8e3d5e068eb6a7490f8d4b240c100121e92e1552dbb94ac1eadbd17d8573afe1`. حجم الصورة المفحوص غير المضغوط مع أساسها 230028228bytes، والـbundle 933195bytes. لا استنتاج لحجم نقل Registry من هذا الرقم. PostgreSQL في tmpfs صناعية مؤقتة؛ الشاهد يثبت الذرية وحالة المعاملة، ولا يثبت تحمل انقطاع الطاقة أو durability قرص مزوّد.

| المسار (n=4 لكل مسار) | wall ms (min/median/max) | job ms (min/median/max) | grade ms (min/median/max) | CPU ms للعملية (min/max) | peak RSS MiB (min/max) |
|---|---|---|---|---|---|
| mixed | 993/1050/1140 | 99/102/105 | 16/16.5/17 | 151.9/160.1 | 68.1/68.4 |
| full-practical | 888/925/933 | 82/86.5/88 | 9/11/12 | 126.2/137.3 | 66.5/72.2 |

SIGTERM drain=130ms؛ watchdog داخل العملية=8001ms، ورصد Docker=8085ms. آخر observer: backlog=0/live lease=0/expired lease=0؛ ليست مراقبة مستمرة. الجرد النهائي للحاضنة: لا container/network/volume/image مؤقتة أو قاعدة أو أسرار اختبار متبقية.

بعد إصلاح UID نجح lint للسكربتين واختبار الصورة الفعلية و69/69 اختبارًا موجهًا في6ملفات. نجح check الكامل المحلي قبل إصلاح ملكية الحاضنة:2992/2992 في210ملفات مع TypeScript وlint والتحذيرين التاريخيين فقط، وbuild وbuild:pages؛ لم تتغير وحدات TypeScript أو الواجهة بعده. نجحت docs:test75/75 وNode32/32 (مصالحة20/أقفال2/probe10) وPython8/8، وdocs/status/diff بلا أخطاء أو تنبيهات مراجعة. لا skip أو تخفيف حارس. CI على رأس الإصلاح يسجل في وصف PR بعد اكتماله. الفحص الكامل الأول قبل الإصلاح أظهر4إخفاقات في العقد التاريخي/rollback من2990، وأُصلحت الشيفرة دون تغيير توقعاتها.  المنهج:4محاولات لكل مسار في عمليات Node جديدة وصورة فعلية، مع ticks فارغة إضافية للتأكد من عدم التكرار؛ سقف العامل1CPU/192MiB، وPostgreSQL1CPU/384MiB، نفس المضيف. wall تشمل إنشاء Docker وإقلاعه؛ job داخل tick بعد استيراد الوحدات؛ grade زمن المصحح فقط مقرب لأعلى. CPU/RSS من process.resourceUsage لعملية Node كاملة، لا استهلاك الحاوية/قاعدة البيانات أو زمن فوترة. العينة صغيرة صناعية وليست تحميل120طالبًا أو p95/p99 أو ضمان FREE؛ تزاحم فحوص المضيف يؤثر القياس. الحدود لا تعني موارد Cloud Run معتمدة.

لا QA واجهات/هاتف أُعيدت: لم تتغير واجهة أو بيانات حالة أو renderer. check/build وbuild:pages والوثائق والاختبارات الجديدة مطلوبة؛ لا screenshots/hosted preview.

## 7. المراقبة والتكلفة وبوابات التشغيل

مخطط log محدد: contract/outcome/code/counts/milliseconds/gradeMilliseconds/resources/reconciliationRequired فقط؛ watchdog تضيف shutdownMilliseconds. لا labels بمعرف مشارك/محاولة/حالة أو raw errors. نجاح/فشل وSTOP وgrading_uncertain/cleanup_failed/shutdown_uncertain قابلة للرصد؛ قياسات backlog/lease/retry/purge من قارئ تشغيلي منفصل خاضع لمراجعة، لا منح SELECT للعامل. observer التاريخي المربوط بهوية trial لم يُحوّل إلى عام. missing/stale observer أو counters مجهولة تبقي الإنذار/الحجر، لا zeros أو إعادة finalize.

متطلبات القناة اللاحقة: مسؤول أساسي وبديل، destination خاصة، حق إرسال محدود، معايير حداثة وتأخر/backlog/lease/failure/STOP وغياب heartbeat ومتابعة acknowledgements وتصعيد موثق. تُختبر رسالة صناعية end-to-end وفشل الإرسال/الإقرار دون payload، ويُربط الإيقاف بمسؤول DB قادر على تعطيل LOGIN/سحب العضوية وإنهاء الجلسات المستهدفة وpooler/cache ومراجعة الأثر. لا تنبيه أو رسالة أو قناة خارجية أُنشئت. لا مدة احتفاظ logs جديدة؛ يراجع المسؤول المدة والحذف والنسخ قبل إنشاء القناة. سياسة [الاحتفاظ](../ASSESS_RETENTION_POLICY.md) للبيانات والنسخ التي نديرها (يومي مشفر/تداول7أيام/قبل تغيير) وحدود المزوّد باقية.

نموذج تكلفة بلا أسعار مخترعة أو اطلاع على فوترة: لكل خدمة i، usage_i × price_i، مع الرسوم الثابتة والتخزين/النقل والحدود/الخصومات المثبتة لاحقًا. القيم price_i وproject/region/quota/billing minima **غير مفحوصة**؛ لا إجمالي نقدي أو خصم FREE مفترض.

| المدخل القابل للقياس/الافتراض لاحقًا | بند الحساب |
|---|---|
| N تشغيلات، CPU مخصصة v، RAM g، مدة فوترة b بعد minima/rounding الفعلية | N×v×b CPU-seconds وN×g×b GiB-seconds؛ wall المحلية ليست b ولا قدرة تشغيل مستمرة |
| SQL/RPC والجلسات/الكتابات والتخزين والفهارس والنسخ والنمو والحذف | PostgreSQL/Supabase وAuth/Data API/pooler/Storage وخطة المزود؛ الكتالوج/النسخ/restore/PITR والصادرات ودليل المحو بنود مستقلة |
| حجم image والإصدارات وعدد builds/pulls وحجم النقل | Registry وتخزين الصور والبناء وegress بين المناطق/المزوّدين؛ لا Registry أُنشئت |
| مرات/إصدارات قراءة السر والتدوير | Secret Manager وKMS إن استُخدمت؛ لا latest أو مفاتيح SA محمولة |
| bytes logs/metrics وعدد time series والاحتفاظ والاستعلام والتنبيه | Cloud Logging/Monitoring وقناة الإرسال/الاستجابة؛ counts محدودة لا تجعل هذه البنود مجانية |
| Scheduler مستقبلية، retries/فشل/تشغيلات فارغة، نسخ/اختبارات restore | تحسب منفصلة عند الإذن؛ لا Scheduler أو retries منصة مفعلة الآن |

TLS verify-full وCA/hostname مثبتان محليًا فقط. لاحقًا: هوية Google خدمة مستقلة بأقل secret-access على الإصدار الرقمي المحدد، دون Owner/Editor أو صلاحية نشر/إدارة حسابات؛ ناشر Job ومشغلها منفصلان، مع منع overrides غير المأذونة. سر DB فريد ومسار تدوير/إبطال مختبر وموعد صلاحية UTC ومسؤول قتل جلسات، وليس secret الجسر أو user/JWT. تثبيت الصورة بـregistry digest وربط مصدرها وmanifest والكتالوج الفعلي ضروريان؛ لا إعادة استعمال الصورة/credentials التاريخية. كل هذا موثق ولم يُنشأ أو يُختبر حيًا.

## 8. قائمة المالك والمزوّد والتسليم

لتقليل وقت اللابتوب، تجمع المراجعات والقرارات أولًا؛ لا طلب لابتوب أو أسرار أو دخول مزوّد لهذه الدفعة:

1. خارج اللابتوب: مراجعة التقرير والمحتوى/O108 والأمن/التزامن والصلاحيات مع المراجع المناسب؛ تحديد مسؤول الدليل والمراقبة والبديل وقنوات أحدث head ومخزنه، وحل حالة الكاتب المحجوب بإذن مستقل. لا استبدال ذلك بـpermit صناعية.
2. قبل نافذة التنفيذ: يجهز المزوّد جرد النسخ/Auth/Storage/PITR والصادرات وTLS/pooler والإبطال والفوترة/region والأسعار والموارد. يراجع تصميم دور التصحيح الخماسي وPUBLIC CREATE/TEMP وأثره على القاعدة المشتركة؛ لا إعادة استخدام استثناء التجربة أو سحب جماعي. يحتاج SQL تشغيلي جديد فرقًا واستثناءً مسمى جديدًا قبل تحريره؛ لا migration خامسة جاهزة للتطبيق هنا.
3. دفعة لابتوب واحدة لاحقًا بعد المراجعات: الجرد والنسخة والاستعادة المحجورة والتحقق من replay والإبطال، ثم هوية/سر ودور/صورة pinned واختبار القناة والإيقاف والقياس بإذن مستقل لكل التنفيذ الخارجي المطلوب. لا تفعيل عام قبل مراجعة P1/P2 والجسر والإسناد والإغلاق والقبول الفعلي والهاتف.

الحدود باقية: لا Supabase/SQL/DB day حي أو Registry/Cloud Run/IAM/Scheduler أو عامل حي، ولا variables/PILOT_SCHEMA_VERIFIED/launch_gate/CONSENT_VERSION/شهادات أو صلاحيات owner/حسابات/surveys للمشرف أو بيانات حقيقية. PR Draft؛ workflows روجعت، Deploy Pages محجوبة على Draft؛ لا ready/merge/auto-merge. الدمج إلىmain ينشر تلقائيًا وخارج الإذن. CI وتخطي deploy على رأس الدفع نفسه يثبتان في وصف PR بعد اكتماله، دون commit توثيق لاحق يغير الرأس.

عند التسليم: تُحذف الصورة المحلية المؤقتة وحاويات وقواعد/شبكة وvolume الاختبار ومفاتيح TLS وكلماتها وملفات permit/dumps/build contexts والدليل الصناعي؛ تبقى وصفة المصدر والتقرير المنقح. لا حذف صورة/معاينة تاريخية أو سر تشغيل. برومت المتابعة: اقرأ AGENTS وHANDOFF وهذا التقرير والعقود وحزمة التطبيق وتقارير المحو والاتصال، وشغّل docs:context وstatus:summary وتحقق#137 مباشرة؛ تابع checkout نفسه. ابدأ بعوائق الدليل والكاتب والمراجعات وتصميم منح المزوّد، دون اعتبار النجاح المحلي جاهزية تشغيل حي.

هل تغير الحكم؟ الإذن الجديد لتجهيز وتشغيل الصورة **محليًا** فقط؛ تغيّر غلاف العامل وسلوك ACK المجهولة، وحُفظ drain التاريخي صراحة، ولم تتغير سياسات المحو أو التقييم أو إذن حي. هل بقي الأصل؟ نعم، الروابط أعلاه و[اختيار Cloud Run](../ASSESS_CLOUD_RUN_PLAN_2026-10-21.md) و[المراقبة السابقة](../ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md) و[قرار TEMP التجريبي](../ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) محفوظة بحدودها، دون تعميم هوياتها.
