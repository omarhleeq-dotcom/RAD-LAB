# فحص أثر إعادة تعيين كلمة postgres — 2026-10-21 عمّان

## 1. النطاق والميزانية والانحرافات

قال المالك إنه لا يتذكر كلمة قاعدة البيانات ولا يعرف إن كانت مستخدمة بخدمات أخرى، ثم طلب «ابدا بالعمل» لفحص المستودع قبل reset. الإذن للفحص والتوثيق فقط؛ لا إعادة تعيين أو محاولة مصادقة أو جرد بيانات حية أو موارد Google أو SQL كتابة. تابع checkout نفسه بلا worktree/subagents.

الميزانية المعروضة أربعة ملفات توثيق وهي الفعلية: هذا التقرير وASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md وHANDOFF.md وproject-status.md. معيار القبول تحديد الاعتماد المثبت والمجهول بأدلة مصدر، وتصحيح نقطة المتابعة وفق تجهيز Windows دون كشف أسرار أو إعادة فحوص ناجحة. لا كود/SQL/migrations/Variables/pins أو سياسة صلاحيات تغيرت؛ لا انحراف.

## 2. المنجز ونتيجة فحص الاعتماد

**النتيجة:** لا اعتماد مباشر على كلمة postgres في مسار frontend المنشور أو workflow نشره كما يعرّفهما الكود المراجع. ليس ذلك إثباتًا أن كل أداة أو خدمة خارجية لا تستخدمها، ولا موافقة على reset.

| المسار الذي فُحص | الدليل | أثر reset المحتمل وحدود الاستنتاج |
|---|---|---|
| تطبيق الحسابات/Practice بالمتصفح | [config](../src/features/pilot/config.ts) و[client](../src/features/pilot/client.ts): Supabase URL وpublishable key وsupabase-js وجلسة المستخدم | لا يستقبلان password postgres أو DSN؛ مسار العميل المراجع لا يحتاج تحديث كلمة DB. لا ادعاء أن خدمة Supabase نفسها لن تتأثر مؤقتًا بتغيير إعداد المزود |
| نشر الواجهة | [deploy-pages](../.github/workflows/deploy-pages.yml): متغيرا Supabase العامان وschema attestation؛ أسرار Cloudflare للنشر؛ static export | لا اتصال DB أو migrations/worker من workflow؛ لا مبرر لتغيير Variables أو API keys من أجل كلمة postgres وحدها. ملفات العميل وworkflows المدروسة مطابقة لـmain أيضًا |
| CI | [ci](../.github/workflows/ci.yml) و[package](../package.json) | لا DB DSN أو password سرية معرفة في المسار؛ QA لا تنشر العامل. لم تُشغل workflow أو tests من أجل هذا التدقيق |
| عامل Assess الخاص | [server-runtime](../src/features/assess/server-runtime.ts) و[server-job](../src/features/assess/server-job.ts) و[entrypoint](../scripts/assess/job-main.mjs) | النقل يرفض user=postgres واسم pooler المركب كقيمة login، ويأخذ حقول binding صريحة دون connectionString أو fallback لـPG ENV؛ entrypoint يقرأ secret mount المحددة. حساب assess_job_a مستقل ومعطل بشاهد المالك، ولا secret/job حي ثبت وجودهما هنا |
| اختبار PostgreSQL المحلي | [local-database](../scripts/assess/local-database.mjs) واستخداماته في rehearsal | postgres هنا لهوية قاعدة اصطناعية جديدة عبر Unix socket مع حقول اتصال صريحة وlisten_addresses=''، وليس حساب Supabase الأصلي. متغير ASSESS_POSTGRES_MANIFEST يختار حزم العميل المحلي ولا يختار قاعدة مزود |
| فحوص خدمة pilot | [live-service-check](../scripts/pilot/live-service-check.js) وبقية أدوات scripts/pilot | طلبات HTTP باستخدام جلسة المتصفح وapikey العامة، وليست password postgres؛ بعض الفحوص قد تكتب بحدودها فلا تُشغّل كتدقيق اعتماد |
| ملفات محلية/خدمات خارجية | .env* مستثناة وفق [.gitignore](../.gitignore)، وليست جردًا للأجهزة | لم تُقرأ ملفات أسرار أو محتوى Downloads/Google Keep/Windows أو إعدادات Cloudflare/Google/Supabase الحية. لا استنتاج غياب الاستخدام من غياب DSN في الكود |

شمل البحث أسماء DATABASE_URL وPGPASSWORD وPGHOST وPGUSER وPOSTGRES وSUPABASE وconnectionString ومواضع إنشاء العملاء عبر src/scripts/.github، ثم قراءة المصادر المعنية؛ لا كلمات مرور أو env dumps أو query text جلسات أو service keys ظهرت في الناتج. أسماء المتغيرات والرموز البرمجية ليست قيم اعتماد. التوثيق التاريخي وأمثلة SQL ليست اتصالات حية.

## 3. لكل مهمة

RAD-056 تبقى review/waiting_on owner لمراجعة استخدامات الإدارة الخارجية واتخاذ قرار reset مستقل أو استرجاع الكلمة المحفوظة. وصفها لم يعد ينتظر تثبيت psql: وصل شاهد النسخة والمسار بالفعل. حدّث source_ref والملخص الخماسي وrevision/time، بلا completion_evidence أو تعديل مهمة أخرى؛ تعارض RAD-024 الموروث محفوظ.

## 4. المشترك وScale واستمرارية الحكم

لا حكم أمني أو إذن تفعيل تغير. [مقترح TEMP وقناة السر](ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) يبقى مشروطًا، و[صف NOLOGIN](ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md#worker-login-stage-owner-result) محفوظ ولا يعاد. لا فتح gate أو قبول ضمني لـTEMP أو اختزال دور العامل إلى tick-only.

حد التدقيق نسخة المصدر الحالية وmetadata GitHub المتاحة؛ ليس جردًا تلقائيًا عالميًا أو مانع drift. قبل أي reset أو تشغيل مستمر يلزم سجل اتصالات بأسماء الخدمة والدور ومسؤول التحديث فقط، دون كلمة/DSN. أي إضافة consumer إداري أو secret خارجي تُرفع إلى ذلك السجل قبل تغيير كلمة الإدارة، بدل استنتاج الاعتماد من اسم متغير وحده. لا registry أو monitor جديد أو scan لبيانات المستخدمين.

## 5. الطب والدرجات والخصوصية

لا تغييرات طب/Practice/صور/درجات/توقعات/hashes أو موافقة مستخدم/مصادر/ترخيص/Marker. لا كلمة قديمة أو جديدة أو verifier أو JWT من المالك مطلوبة أو محفوظة. لا إعادة تعيين عامة أو استخراج أسرار أو محاولة الوصول إلى Google Keep. حساب DB الإداري postgres مختلف عن كلمة دخول موقع Supabase وAPI keys وlogin العامل المستقل.

## 6. QA وأدلة المصدر والجهاز

البداية نظيفة على `e09f1db17b76859a171b2e9f77e8336d65eb1f5d`. docs:context/GitHub أثبتا [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) مفتوحة/draft وغير مدموجة ورأسها مطابقًا، وmain `ff68413042e6e8414ad70884efcfa71cac7443a7` مطابقًا لـorigin/main. check/deploy completed/success على كل من هذين الرأسين؛ لا نقل النتيجة للرأس التالي أو subscribe/poll أو preview.

طلب قراءة **أسماء** GitHub Actions repository secrets وvariables فقط رفضه GitHub بـHTTP403 Resource not accessible by integration؛ لم تُقرأ قيم أو أسماء منهما ولم يُعد الطلب أو تُستخدم طريقة تجاوز. endpoint environments أعاد قائمة فارغة في نطاق المستودع فقط؛ لا يثبت غياب organization secrets أو Cloudflare/Google config أو ملفات محلية. workflow يثبت أسماء الاعتماد التي يطلبها الكود، لا جرد التخزين الفعلي.

شواهد المالك من Windows، وليست فحوصًا مستقلة من الوكيل:

- psql (PostgreSQL)18.6 اشتغلت من D:\Tools\PostgreSQL\17\bin\psql.exe؛ اسم المجلد17 لا يغير نسخة البرنامج. الملفات الأساسية على D، والمؤقتة على C مسموحة بتوجيهه. لا خادم محلي مطلوب من اختيار Command Line Tools.
- فحص شهادة DER النهائي أعاد PASS: certificate fingerprint matches; copied to D، إلى D:\Tools\PostgreSQL\certs\prod-ca-2021.crt. حدث قبله خطأ من الوكيل بمقارنة hash ملف PEM بـfingerprint الشهادة DER؛ صُحح المنهج ولم يُرخّص تجاوز mismatch. نسخ الملف بعد throw السابق لم يُعتبر تحققًا؛ PASS المنفصل اللاحق هو الدليل.
- محاولة psql أعادت FATAL password authentication failed for user postgres؛ ثم محاولات timeout expired على عناوين pooler. لا جدول SQL ناجح أو worker credential verification من ذلك. الإخفاق مختلف عن منح الإدارة أو نجاح هوية backend؛ لا سبب لتغيير TLS أو التحول إلى IP ثابت.
- Test-NetConnection على session5432 أعاد TcpTestSucceeded=True لعنوان واحد في تلك اللحظة؛ يثبت TCP فقط، لا TLS أو كلمة المرور أو بقية عناوين DNS أو شبكة Google. لم يُغيّر المالك كلمة postgres وفق الإفادات المتاحة، وقال لاحقًا إنه لا يتذكرها؛ توقف التخمين.

نجحت فحوص التوثيق: docs:check مقابل origin/main بلا errors أو review warnings، وstatus:check مع require-previous، وgit diff --check؛ بقي تعارض RAD-024 الموروث ظاهرًا دون تغيير. لا app build أو QA تطبيق/SQL/Docker/هاتف ناجحة معادة بلا تغيير ذي صلة. الفحص البنيوي لا يثبت غياب consumers خارج المستودع.

## 7. المتبقي وخطة قرار reset

لا حاجة حاليًا لإبقاء اللابتوب شغالًا؛ الأوامر الفاشلة عادت إلى prompt ولا توجد عملية تعمل بالخلفية بدأناها. لا ندعي فحص عمليات الجهاز الأخرى. جهوزية psql وCA محفوظة؛ استعادة كلمة الإدارة أو إعادة تعيينها هي عائق الاتصال التالي، وليست إعادة تثبيت الأدوات أو تعديل C/D.

قائمة المراجعة الخارجية قبل reset: أدوات SQL/IDE أو pgAdmin/DBeaver إن استُعملت، Supabase CLI/link/db-push أو migrations، أدوات نسخ/ETL/integrations، وDSN/connection secrets في hosting/CI/Jobs أو إعدادات Windows. يتحقق المسؤول محليًا من **الدور postgres والمشروع المعني** دون إرسال القيمة؛ تعليم اسم المتغير فقط لا يثبت محتواه. ما تعذر جرده يسجل unknown مع أثر توقف مقبول وخطة تحديث، ولا يحوّل إلى absent.

إن اختير reset لاحقًا: نافذة قصيرة بيد المالك، كلمة قوية فريدة محفوظة في مدير كلمات مرور موثوق، تحديث consumers المثبتة فقط، وفحص قراءة psql مرة واحدة بـverify-full وCA الحالية، ومراجعة عمل التطبيق القائم بلا worker RPC/تعديل بيانات. تبقى القديمة غير متاحة ولا نفترض إمكان التراجع إليها؛ عند فشل الاتصال لا loop/reset ثانية تلقائية. قد تظل جلسات مصادق عليها قائمة بعد reset؛ ذلك لا يثبت الإلغاء. لا تدوير API keys أو JWT أو تغيير schema Variables أو كلمة assess_job_a كأثر تلقائي، ولا طلب كلمة جديدة في المحادثة. هذه خطة مراجعة لا عملية reset مأذونة أو منفذة.

## 8. تسليم المالك وبرومت الاستئناف

النتيجة للمالك: تطبيق الموقع المراجع لا يعتمد مباشرة على كلمة postgres؛ يبقى أثر الخدمات الخارجية مجهولًا. لا كود مطلوب على اللابتوب الآن ولا reset من التقرير. الخطوة التالية مراجعة سجل الاستخدامات الخارجية ثم قرار إعادة تعيين ضيق، أو الرجوع بكلمة مؤكدة عبر prompt فقط؛ يُشرح قبل كل خطوة دورها وما ستغيره وفق طلب المالك.

ابدأ AGENTS وHANDOFF وRAD-056 وهذا التقرير ومقترح التفعيل، ثم docs:context/GitHub للرؤوس وفحوصها؛ تابع checkout نفسه بلا worktree/subagents. لا إعادة staging/TLS أو تثبيت psql الناجحين ولا طلب النسخة المؤجلة؛ لا SQL كتابة أو secret/LOGIN أو موارد Google أو runtime/schedule أو Variables/gate أو ready/merge/auto-merge دون نطاقه المستقل.
