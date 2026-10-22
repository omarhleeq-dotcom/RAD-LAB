# تشغيل Assess الاصطناعي المحلي المحدود

أداة تجهيز ومراجعة، لا runtime منشور أو adapter لمزوّد أو مجدول. تعيد استخدام [خدمة C](../src/features/assess/server-service.ts) و`runAssessJobs` و`installMixedContent` وRPCs الحالية. لا endpoint أو عامل أو حذفًا ثانيًا. إضافة إنفاذ S-ASSESS-15 المحلية تستخدم ترحيلًا إضافيًا وتمدد الصيانة نفسها؛ شاهدها المحدود موضح أدناه. الأدلة في [التقرير](ASSESS_LOCAL_OPERATIONS_REPORT_2026-10-20.md)، والسلطة في [قرارات المالك](DECISIONS.md#assess-owner-2026-10-19).

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

## دليل إيقاف العملية الفعلي

متابعة محلية على رأس الحزمة البرمجي اختبرت SIGINT وSIGTERM من عملية أب: لكل حالة TMPDIR خاص وcluster جديد، وانتظار socket PostgreSQL الخاص ثم إرسال الإشارة إلى PID الأداة وحدها. كلاهما أعاد STOP/stopped بخروج130 وcleanup=true وticks=0، وبقي مجلد الأب فارغًا. اختبر أيضًا manifest لحزم QA غير موجود: STOP/setup وخروج1 وcleanup=true، بلا مسار الاعتماد المفقود أو رسالة require الخام في stdout. تفاصيل الدليل في [تقرير المتابعة](ASSESS_LOCAL_OPERATIONS_REPORT_2026-10-20.md#process-stop-followup).

هذا دليل إيقاف أثناء التهيئة قبل أول tick، وليس SIGKILL أو إشارة أثناء lease جارٍ أو استرداد مضيف بعد انهيار. إتمام claim/finish/fail عند signal مثبت باختبارات الخدمة؛ lease المنتهية والاسترداد مثبتان بالتجربة الاصطناعية السابقة. فشل shutdown نفسه ووجود cluster متروك لا يُعلن اختبارهما من نجاح cleanup هنا.

## الانتقال اللاحق والبوابات

أُعدت [حزمة ربط Node24 محلية](ASSESS_RUNTIME_LOCAL.md) دون تشغيل أو نشر. اختيار مزود وحزمة evaluator مثبتة، والتحقق الحي من هوية المستخدم وربط العامل بصلاحية محدودة مستقلة، وفحص ACL/TLS وإلغاء الصلاحيات، وجدول bounded ticks وقياس التأخر والتنبيه ومسؤوله، تحتاج نطاقًا وإذنًا لاحقين. حدود التنبيه والدقائق المقترحة في [خطة التجهيز](ASSESS_STAGING_PLAN.md) ليست سياسة معتمدة بهذه الأداة. Pages لا يستضيف العامل؛ نجاحه لا يثبت الإسناد والحفظ والانقطاع والتعريض والتسليم والتصحيح حيًا.

O106: اعتمد المالك [السياسة](DECISIONS.md#assess-retention-owner-2026-10-20)، ونُفذ إنفاذ الإغلاق/التعطيل وموافقة v2 وتنظيف metadata محليًا في المسودة. [السياسة](ASSESS_RETENTION_POLICY.md) و[تقرير الإنفاذ](ASSESS_RETENTION_REPORT_2026-10-20.md) يفصلان ذلك عن التشغيل والنسخ والتصدير والاستعادة غير المنفذة. لا تعاد الخيارات المعتمدة. غير المؤقت محجوب، ومدة متروكه خارج التجربة غير محددة. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، وruntime والعامل والجدولة والمراقبة والنسخ والاستعادة والنشر بوابات مستقلة؛ launch_gate مغلقة ولا قبول حي.

## شاهد إنفاذ السياسة المحلي

```sh
node --import ./scripts/assess/node-loader.mjs scripts/assess/retention-rehearsal.mjs --synthetic-disposable --backend=pglite
ASSESS_POSTGRES_MANIFEST=/tmp/radlab-ops-postgres/package.json node --import ./scripts/assess/node-loader.mjs scripts/assess/retention-rehearsal.mjs --synthetic-disposable --backend=postgres
```

يعيد استخدام `openLocalDatabase` و`server-service` و`runAssessJobs` وRPCs C للـlease/recovery والحذف الذري. لا loop أو runtime أو schedule جديد؛ خطوات ثابتة محدودة وbatch≤100، وعاملان في التنافس. `close_assignment_v1` للمالك صاحب الإسناد، و`disable_account_v1` للذات أو مالك معتمد، منفذان عبر خدمة المستخدم؛ لا UI إدارة جديدة أو endpoint أو هوية عامل للمستخدم. تم تحديث موافقات fixtures الأدوات التي تتبع السلسلة الحالية إلى v2؛ أدوات F التاريخية الخاصة بمرحلتها ليست شاهدًا للسلسلة الجديدة ولا تُعاد على مزود.

الشاهد يقارن قفل البدء بالإغلاق/التعطيل، ويثبت التسوية والقراءة بعدهما، وقبول v2 الصريح وتكراره ورفض v1 كبديل، وحماية العداد بعد purge، وشروط تنظيف metadata وعاملين، وفشل التصحيح والحذف واستردادهما. اختبار ترقية مستقل يضع v1 ومحاولة نشطة قبل ترحيل السياسة ويثبت عدم إعادة ختمها وعدم منع تسويتها. كل البيانات اصطناعية. المخرجات عقد `assess-retention-rehearsal/1` ورمز مرحلة وقائمة checks وbackend وcleanup و`restoreVerified=false` و`runtimeOrLaunchVerified=false` فقط، دون صفوف أو أخطاء SQL خام.

**حد الاستعادة:** ينشئ الشاهد جداول مؤقتة تمثل حالات قبل الإغلاق والتعطيل والحذف، ويثبت اختلافها عن الحالة الأحدث. لا pg_dump/نسخة مشفرة أو import أو إعادة بناء لقواعد الصلاحيات من أرشيف، ولا سجل حذف مستقل أو دورة restore مكتملة. purge النتائج المنتهية لا يعيد إغلاقًا/تعطيلًا أو موافقة/metadata حذفت بعد اللقطة. launch_gate تحرس البدء فقط؛ يلزم عزل الوصول والـAPI إلى القاعدة المستعادة حتى إعادة تطبيق جميع الآثار والتحقق من ACL. لا فتح بوابة من نجاح هذا الشاهد. وثّق لاحقًا دليل الأثر الأدنى وعمره بحسب كل نسخة قابلة للاستعادة، بما فيها المزود؛ لا تفترض سبعة أيام للمزود.

لا ميزة تصدير عامة أو نظام نسخ إنتاجي هنا. قبل ربطهما: نتائج مختصرة فقط بموعد حذفها الأصلي، ونسخ نديرها يومية مشفرة بتداول سبعة أيام ونسخة قبل التغيير ضمن التداول، ومفاتيح خارج Git، وجرد/إتلاف وتنبيه فشل وتحقق مزود مستقل وتجربة استعادة قبل التشغيل وبعد تغير مؤثر. هذه متطلبات سياسة، لا نسخ موجودة أو RPO/RTO أو مدد محتوى مخترعة.
