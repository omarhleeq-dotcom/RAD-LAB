# تشغيل Assess الاصطناعي المحلي المحدود

أداة تجهيز ومراجعة، لا runtime منشور أو adapter لمزوّد أو مجدول. تعيد استخدام [خدمة C](../src/features/assess/server-service.ts) و`runAssessJobs` و`installMixedContent` وRPCs الحالية. لا endpoint إضافيًا أو ترحيلًا أو حذفًا ثانيًا. الأدلة في [التقرير](ASSESS_LOCAL_OPERATIONS_REPORT_2026-10-20.md)، والسلطة في [قرارات المالك](DECISIONS.md#assess-owner-2026-10-19).

## الإعداد والتشغيل

من جذر checkout مع Node24 واعتماديات `npm ci`:

```sh
node --import ./scripts/assess/node-loader.mjs scripts/assess/local-operations.mjs --synthetic-disposable --backend=pglite
```

هذه قاعدة PGlite جديدة في الذاكرة، **متسلسلة**. لإثبات معاملات مستقلة متزامنة، على Linux x64 بحساب غير root، ثبّت اعتماديات QA خارج المستودع ثم شغّل:

```sh
npm install --prefix /tmp/radlab-ops-postgres embedded-postgres@18.4.0-beta.17 pg@8.23.1
ASSESS_POSTGRES_MANIFEST=/tmp/radlab-ops-postgres/package.json node --import ./scripts/assess/node-loader.mjs scripts/assess/local-operations.mjs --synthetic-disposable --backend=postgres
```

manifest يحدد حزم QA فقط، لا عنوان قاعدة أو credential. ينشأ cluster PostgreSQL في مجلد مؤقت0700، وUnix socket خاص به؛ `listen_addresses=''`، بلا TCP أو Docker أو استيراد بيانات. كل RPC له اتصال ومعاملة منفصلان. CLI لا يقبل URL/DSN/مشروعًا أو مسار بيانات، ويرفض flags المجهولة وغياب `--synthetic-disposable` قبل القاعدة. لا يستعمل إعدادات pilot أو متغيرات PG لاختيار وجهة، ولا يتصل بالأصلية `vlacestfruxooznrcjqc`.

تطبق السلسلة على **القاعدة الجديدة الفارغة وحدها** مع Auth اصطناعي وحسابين وحروف MCQ محلية. لا إعادة ترحيلات على قاعدة قائمة أو أدوات الحسابين/CRLF أو نسخ موافقات/محتوى إنتاجية. يبدأ launch_gate مغلقًا ويُختبر رفض البدء؛ يفتح في هذه القاعدة الاصطناعية وحدها للتجربة ثم يغلق قبل الإتلاف. لا إذن من ذلك لفتح بوابة أصلية أو اختبار حي.

## الدورة والعقود

مرشح owner عبر `content_submit_v1` → مدقق Node القائم `installMixedContent` → `assign_v1` → موافقة Assess اصطناعية صريحة → start/save/read/submit القائمة. المستخدم بدور authenticated وهوية fixture ثابتة، والعامل بدور assess_worker دون هوية مستخدم. يُختبر رفض المستخدم/المالك/anon لدوال العامل؛ لا أسرار إدارية في متصفح أو اعتماد لعلامة/هوية عميل. **auth.uid محاكى محليًا، وليس JWT أو Auth/Data API حيًا.**

السقف24 استدعاء `runAssessJobs`، وlimit=1 لكل استدعاء، وعاملان فقط في مراحل التنافس. لا loop مستمر أو interval/schedule أو polling أو retry تلقائي في CLI. كل tick يعيد استخدام `maintain_v1` ثم `claim_v1` → المصحح → `finish_v1`/`fail_v1` ثم `health_v1`. lease وretry/recovery والأعمار والحذف من C بلا تعديل أو retention clock جديد. تغييرات الساعة وtrigger فشل الحذف تقع محليًا فقط.

تختبر الدورة replay للبدء والحفظ والتسليم، عاملين ونتيجة واحدة، حجب العلامة وحذف التفاصيل، انتهاء lease ورفض token قديم، تعطل المصحح دون صفر، احترام retry_at والتنبيه المجمع بعد24ساعة و`recover_v1` صريحًا، فقد ack بعد COMMIT، rollback لفشل الحذف، انتهاء نافذة السبعة أيام بلا علامة، انتهاء المهلة دون متصفح، وقراءة منتهية مقابل عاملَي purge وتكراره وبقاء الحجز. لا كتابة إلى Practice/events/feedback. أداة التشغيل الجديدة MCQ اصطناعية فقط؛ اختبارات المسارين والتعريض والمحاكاة القائمة حراس مستقلة، لا UI جديد هنا.

## الإيقاف والفشل

Ctrl+C أو SIGTERM يمنعان tick لاحقًا. `signal` الاختياري في الخدمة يفحص التوقف قبل أول RPC وقبل كل claim. قبل البداية يرمي `stopped` دون قاعدة؛ أثناء maintenance ينتظر الإقرار ثم يتجاوز claims؛ أثناء claim/التصحيح/finish يتم العمل الجاري أو `fail_v1` تحت token الحالي ثم health، دون حجز تالٍ. لا إلغاء RPC مع افتراض rollback. تهيئة fixtures قد تبلغ نقطة التوقف التالية قبل إتلاف القاعدة؛ ليس إيقافًا فوريًا لكل statement.

فشل maintain/claim/health يوقف tick بخطأ منقح، بلا counts مصطنعة. فشل التصحيح/finalize يحاول fail تحت token الحالي؛ فشلها يترك الاسترداد للـlease/الحالة المخزنة. `failed` في استجابة tick عدد محاولات تنفيذ غير مؤكدة: ضياع ack لـfinish قد يأتي **بعد commit ناجح**، فلا يثبت غياب النتيجة أو يجيز تثبيتها إداريًا مرة أخرى. SQL مصدر الحقيقة ويمنع التكرار. لا backoff جديد أو تجاوز retry_at أو استرداد آلي بعد حد C.

`finally` يغلق الاتصالات ويوقف cluster ويتلفه عند النجاح والفشل والإيقاف. ينتظر فرعَي العمل المتوازي حتى عند فشل أحدهما قبل إغلاق القاعدة. إن فشل الإيقاف تبقى الملفات ويصدر `cleanup_failed`، بما فيه فشل التنظيف أثناء setup، دون حذف ملفات cluster يعمل. SIGKILL/انهيار المضيف لا ينفذ finally: بعد توقف العملية افحص بقايا `/tmp/radlab-assess-ops-*` والعمليات محليًا، وأوقف الكتلة المعنية بـpg_ctl من حزمة QA قبل إزالة **مجلدها المحدد وحده**. لا wildcard حذف أو إشارة لقواعد أخرى. ليست هذه تجربة backup/restore أو إجراء استرداد إنتاج.

## المخرجات وحدود الأدلة

سطر JSON بعقد `assess-local-operations/1`: runId عشوائي، backend وPASS/STOP ورمز مرحلة وعدد ticks وأسماء checks وcleanup. لا claims/أجوبة/إعدادات/علامات/صفوف أو أخطاء خام في stdout. تسجيل statements/parameters وأخطاء SQL الاختبارية معطل في PostgreSQL المحلي؛ سجل بدء التشغيل داخل مجلده الخاص ويُتلف معه. لا telemetry/events أو قناة تنبيه خارجية. تحذيرات Node للـloader التجريبي قد تظهر على stderr بلا بيانات؛ لا حاجة لتغيير package type لإخفائها.

PASS يشترط إتمام المراحل وcleanup، ويخرج0. STOP يخرج1، أو130 للإيقاف؛ `configuration` رفض قبل القاعدة، وبقية الرموز تحدد مرحلة التشخيص. لا تحويل STOP لنجاح بتغيير مهلة/توقع. الاختبارات تغطي التوقف وأعطال المنافذ ورفض وجهة/flags وتنقيح stdout. كل تشغيل جديد مستقل؛ لا يضيف إلى قاعدة سابقة.

`runtimeOrLaunchVerified=false` دائمًا. Node/PGlite وPostgreSQL18 المحليان لا يثبتان توافق Supabase/Edge/Deno أو bundling إنتاج أو JWT/TLS أو هاتفًا/مراجعة طبية أو أداءً/تنبيهًا. لا تُرسل تفاصيل إضافية لإنتاج شاهد.

## الانتقال اللاحق والبوابات

اختيار مزود وحزمة evaluator مثبتة، binding للمستخدم بهويته وللعامل بصلاحية محدودة مستقلة، وفحص ACL/TLS وإلغاء الصلاحيات، وجدول bounded ticks وقياس التأخر والتنبيه ومسؤوله، تحتاج نطاقًا وإذنًا لاحقين. حدود التنبيه والدقائق المقترحة في [خطة التجهيز](ASSESS_STAGING_PLAN.md) ليست سياسة معتمدة بهذه الأداة. Pages لا يستضيف العامل؛ نجاحه لا يثبت الإسناد والحفظ والانقطاع والتعريض والتسليم والتصحيح حيًا.

O106 المتبقي: احتفاظ غير المؤقت المتروك، أعمار metadata الحجز/الموافقة، اعتماد الموافقة وإجراءاتها، ودورة النسخ/التصدير/الحذف بعد restore وتجربة الاسترداد. غير المؤقت محجوب؛ الستة أشهر التقويمية من التسليم والحقول الأربعة وسياسة العلامة والمساران محسومة. لا مدة احتفاظ/موافقة جديدة أو سياسة تنظيف مرشحات لحل عائق هندسي. O108 للمصادر والترخيص والمراجعة والخلفية والمعايير واعتماديات Marker مستقلة. runtime والعامل والجدولة والمراقبة والموافقة والاحتفاظ والنسخ والاستعادة وlaunch بوابات مستقلة، لا اعتماد Blueprint أو قبول حي أو استثناء نسخ جديدًا.
