# خطة تجهيز بيئة اختبار Assess — 2026-10-20

## 1. الإذن والميزانية

أذن المالك بـ«تمام ابدا» بعد اقتراح إعداد خطة التجهيز وأوامر الفحص **محليًا**. هذه دفعة تجهيز قابلة للمراجعة؛ لا إنشاء موارد أو تطبيق SQL على مزود أو نشر runtime/عامل/جدولة أو تغيير Actions Variables أو launch_gate. تبقى [قرارات Assess](DECISIONS.md#assess-owner-2026-10-19) معتمدة دون إعادة سؤال، و[تقرير D](ASSESS_D_REPORT_2026-10-20.md) دليل واجهتها المحلية. لا E/F.

الميزانية8ملفات: هذا المستند؛ `scripts/assess/staging-preflight.mjs` و`scripts/docs/assess-staging-preflight.test.mjs`؛ `supabase/checks/assess-staging-ready.sql`؛ `src/features/assess/staging-catalogue.test.ts`؛ [الإعداد](PILOT_SUPABASE_SETUP.md#assess-staging-preparation)، [التسليم](HANDOFF.md)، [مصدر الحالة](project-status.md). لا تعديل تطبيق أو workflow أو migration أو frontend-schema أو pins أو package/lock أو قواعد/توقعات تدريب. لا تغيير ruling أو حذف دليل قرار؛ روابط الأصل محفوظة.

## 2. الحزمة المجهزة ومسار التنفيذ المقترح

### ما جُهّز محليًا

- أداة preflight للقراءة من المستودع فقط؛ تتحقق من اختلاف origin الاختبار عن الإنتاج، وتراجع عقد الواجهة القائم وتسرد SQL/checks مع SHA-256 ومرجع workflow. لا تقرأ مفاتيح أو تتصل بالخدمات أو تطبع attestation. الناتج `PREPARED_LOCAL_ONLY` و`deploymentReady=false` مهما نجحت فحوص المصادر.
- catalogue SQL إضافي للقراءة فقط: جرد جداول ودوال B/C/D، RLS، ACL، مصفوفة execute لـanon/authenticated/assess_worker، منع execute لـPUBLIC والوصول المباشر للمفاتيح/الأجوبة/الدرجات، search_path الفارغ وsecurity definer، وعدم عضوية المستخدمين بالعامل. يرفض أيضًا كائنات Assess غير المراجعة. لا يقرأ صفوف profiles أو المحتوى أو الأجوبة أو الدرجات.
- اختبار محلي على سلسلة الترحيلات داخل PGlite يثبت نجاح catalogue على المخطط القائم، وفشله عند غياب كائن أو منح زائد أو تعطيل RLS أو تغيير حماية دالة/عامل. لا يُنشئ مشروعًا أو حسابًا حيًا.

### فصل المعاينة عن الإنتاج — قبل أي تغيير إعداد

فحص `.github/workflows/deploy-pages.yml` الحالي وجد أن PR وpush إلى main يستعملان `vars.NEXT_PUBLIC_SUPABASE_URL` و`vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` و`vars.PILOT_SCHEMA_VERIFIED` نفسها، ويستهدفان مشروع Pages نفسه باختلاف branch. **لا تغيّر متغيرات المستودع المشتركة إلى staging**؛ ذلك يغير وجهة main أيضًا. `isolationVerified=false` في preflight هو عمدًا قيد مفتوح، لا اكتشاف isolation تلقائي من YAML.

التنفيذ المقترح للمراجعة اللاحقة:

| الحد | المقترح | دليل القبول اللازم |
|---|---|---|
| Supabase | مشروع staging مستقل، بلا استيراد بيانات/نسخ إنتاج. region/tier/حد الإنفاق ومعرف المشروع تُثبت قبل الإنشاء؛ لم تُختر أو تُنشأ هنا | URL عام مختلف عن الإنتاج، ومطابقة مشروع SQL وAuth/Data API له |
| GitHub | بيئة `assess-staging` بإذن مراجعة مستقل. قيم جديدة مسماة `STAGING_SUPABASE_URL` و`STAGING_SUPABASE_PUBLISHABLE_KEY` و`STAGING_PILOT_SCHEMA_VERIFIED`؛ تُربط بأسماء NEXT_PUBLIC المطلوبة فقط في مسار المعاينة | غياب أي قيمة staging يوقف المعاينة؛ لا fallback إلى متغيرات الإنتاج. مسار main يحتفظ بإعداداته الحالية. لا سماح لفروع/forks غير موثوقة بالوصول إلى البيئة |
| Pages | مشروع preview منفصل مقترح `rad-lab-assess-staging`، مع حماية الوصول وnoindex وCSP للمشروع التجريبي فقط | proof أن رفع المعاينة لا يستهدف مشروع/فرع الإنتاج، وأن حماية الوصول موجودة فعلًا؛ الوكيل لا يفتح أو يشارك URL مستضافًا |
| schema attestation | يبقى حارس frontend-schema الحالي دون تخفيف؛ إثبات خاص بمشروع staging ومحتويات C/D بعد التحقق | حارس staging يرفض إثبات B القديم، ومشروعًا مختلفًا أو SQL مختلفة. لا قيمة true أو إعادة pin للمرور |

لا workflow معدل أو GitHub Environment أو Pages project جديد في هذه الدفعة. تبقى D مسودة ولا تُدمج إلى main اعتمادًا على جاهزية staging؛ main نفسه يحتاج تجهيز بيئته وإثباتًا مناسبًا بإذن لاحق مستقل.

### التسلسل بعد إذن خارجي محدد

1. تثبيت مشروع staging/region/tier/حد الإنفاق ونطاق الصلاحية، وعزل إعدادات المعاينة. تسجيل public project reference فقط؛ لا مفاتيح أو passwords في المحادثة/المستودع.
2. على المشروع الجديد فقط: مراجعة قائمة الترحيلات وبصماتها من preflight وتطبيق السلسلة المطلوبة بالترتيب مرة واحدة تحت الإذن الممنوح. لا إعادة إنشاء Auth أو `auth.uid()` من bootstrap اختبارات PGlite؛ مزود Supabase يملك Auth الحقيقي. لا أداة `db push` عامة أو wildcard يستهدف اتصالًا افتراضيًا.
3. تشغيل catalogue الإضافي، ثم فحص D القائم لقيمة launch_gate المغلقة، ومراجعة metadata الترحيل وexposed schema/cache. فحص وجود/ACL لا يثبت تطابق body الدوال مع مصدر SQL؛ يلزم سجل التطبيق الصحيح ومراجعة أي تعديل يدوي.
4. بهويات staging الاصطناعية المعتمدة فقط: اختبار المالك والمشارك والمالك الآخر وغير المسند وanon. تحقق من JWT/Data API والـschema الفعلية، ومن رفض جداول المفاتيح/الأجوبة/الدرجات ودوال العامل. **لا تستخدم أداة حسابَي B المثبتة على مشروع الإنتاج لتجربة staging**؛ تجهيز checker مربوط بمشروع staging دون طباعة جلسات جزء من نطاق التنفيذ اللاحق.
5. تجهيز عامل Node والجدولة والمراقبة على staging، وإثبات الأجزاء أدناه. تبقى launch_gate مغلقة؛ لا تبدأ محاولات أو تنشئ محتوى حقيقيًا لمجرد نجاح catalogue.
6. تصريح مستقل محدد لاختبار اصطناعي محدود ببوابة staging فقط، بعد تقييد الوصول وتجهيز المسح/الاسترداد. قبول lifecycle عبر المتصفح والخادم/العامل الحقيقيين كما في جدول القبول. هذا ليس إذن فتح إنتاج أو تخزين بيانات مشاركين حقيقية.
7. بعد توثيق فحص المشروع والخدمة والعزل، يراجع المسؤول إثبات staging المطابق ويضعه في `STAGING_PILOT_SCHEMA_VERIFIED` وحدها؛ ثم يُعاد نشر المعاينة ويتحقق المالك من الهاتف. إصدار إثبات أو تعديل Variable ليس عملًا منفذًا هنا. لا إعادة Deploy الآن بنفس البيئة غير المجهزة.

### runtime والعامل — عقد ربط مقترح لا خدمة منشورة

المسار العام يبقى browser → Supabase Auth/Data API بهوية المستخدم → RPCs المفوضة في SQL. لا حاجة لمسار تصحيح عام يقبل درجة من المتصفح. المسار الخاص المقترح: job Node24/container موثوق → اتصال PostgreSQL TLS بدور login مخصص محدود → `SET LOCAL ROLE assess_worker` داخل المعاملة → قائمة ثابتة من RPCs العامل فقط؛ صلاحيات هذا الربط تُراجع وتُجرب قبل نشره. لا استنتاج توافق Deno من تجربة Node ولا اعتماد node-loader المحلي كحزمة إنتاج.

| المكون | المدخل/الصلاحية | إثباته المطلوب قبل الاختبار |
|---|---|---|
| مدقق المحتوى | `installMixedContent(worker,version)`؛ مستند خاص من content_read_v1، ثم تحقق C/D وتثبيت ذري | رفض مصدر/shape غير صحيح ونسخة مكررة؛ candidate يبقى pending عند الفشل؛ لا قراءة من participant أو مفتاح عامل في المتصفح |
| عامل التصحيح | `runAssessJobs(worker,50)`؛ worker فقط، بلا منح جداول أو admin/service key للمستخدم | lease/token وعاملان متداخلان، فشل التصحيح/finalize، استرداد دون تعريض ثانٍ، وعدم قبول رقم درجة من المستخدم |
| المجدول | tick مقترح كل دقيقة، batch50 (الحد البرمجي100)؛ لا endpoint عام غير مصادق | tick فعلي موثق بعد إغلاق المتصفح؛ expiry/purge تعملان دون جلسة الطالب، وحد run/تداخل/backoff مقاس |
| المراقبة | counts من health_v1 وسجل تشغيلي برمز/معرف ارتباط فقط | تنبيه تجريبي عند غياب tick لخمس دقائق أو overdue مستمر لدورتين، وalert الحالي لفشل24ساعة؛ thresholds تقنية مقترحة قابلة للضبط بعد القياس، لا تغيير مدد المنتج |
| الاسترداد والنسخ | فصل صلاحية recover، ومسؤول استجابة ونسخة staging قابلة للاستعادة | drill لفشل العامل والحذف الذري وإعادة تطبيق الحذف بعد restore، دون نسخ answers/keys إلى logs أو قنوات تنبيه |

اختيار مزود استضافة Node وbundling وآلية credential/TLS والدور المخصص وقناة المراقبة وتكلفتها لم يُثبت. لا تنفيذ لهذه الأجزاء أو رسائل تنبيه فعلية ضمن التحضير. مدد C المقررة24ساعة/7أيام ونتيجة6أشهر تقويمية لا يُعاد اعتمادها؛ الباقي في O106 هو الموافقة والتنفيذ والنسخ وحد المتروك غير المؤقت والمرشحات. غير المؤقت يظل محجوبًا.

### مصفوفة قبول staging الاصطناعي

| الاختبار | النتيجة المطلوبة | حدود الدليل |
|---|---|---|
| العزل | رفض JWT/هوية أخرى وغير المسند والمعلق/الموقوف وanon، وجداول/private RPCs حتى من owner؛ owner آخر لا يستولي على إصدار | catalogue وحده لا يثبت Auth/Data API أو منطق التفويض داخل function body |
| المحتوى | نسخة ثابتة، candidate غير available قبل Node validation؛ source/licence/review/background/criteria/Marker تحت O108 | fixture هندسية لا تعتمد طبًا أو تسمح بسؤال حقيقي |
| الحفظ والانقطاع | autosave مثبت بالخادم؛ timeout/ack مفقود ثم نفس operation/body؛ conflict لا يكتب الإجابة القديمة | لا مساواة بين حالة UI محلية وحفظ حي |
| التعريض | SID بلا أدوات/مشهد زائد؛ تغيير letter لا يحرك موضعًا ثابتًا؛ expose واحد يبقى مقفلًا بعد refresh وجهاز ثانٍ | لا حل/نطاق تصحيح/تلميح عبر نص أو ARIA أو tooltip |
| التسليم والوقت | تنبيه ناقص؛ submit/expiry race بنتيجة واحدة؛ انتهاء الوقت مع المتصفح مغلق؛ رفض تعديل مجمد | وقت الخادم مرجع القبول، لا ساعة الجهاز |
| التصحيح والحذف | grade hidden بلا قيمة في API؛ نجاح نهائي يمحو التفاصيل والإيصالات ذريًا؛ فشل التصحيح لا يصير صفرًا؛ restore يعيد تطبيق الحذف | لا تغيير حسابات أو بيانات Practice؛ لا إغلاق O106 بمجرد نجاح مثال |
| واجهة/تشغيل | EN/AR390/1440 وaxe والهاتف من المالك بعد نشر المعاينة المأذون؛ لا E أو محتوى طبي حقيقي | نجاح البناء أو CI لا يثبت runtime أو جاهزية إنتاج |

## 3. المهمة

RAD-056 يظل للمراجعة في [project-status](project-status.md). أضيفت حزمة تحضير محلية؛ لم يُسجل provisioning أو migration أو runtime أو live acceptance كمنجز. إعداد مزود حقيقي يحتاج نطاقًا وإذنًا لاحقًا؛ لا مهمة حالة ثانية في هذه الخطة.

## 4. الملفات المشتركة وScale

لا تعديل مشترك في التطبيق/النشر؛ الإحالات في دليل الإعداد والتسليم فقط. الجرد المحدود مطابق لعقد B/C/D الحالي؛ كائن جديد يحتاج مراجعة وتوسيع الجرد، وليس تجاهله. لا قراءة قوائم طلاب أو أجوبة غير محدودة. preflight يراجع مصادر المستودع لا قاعدة بيانات، ولا يحمل credentials أو يختار مزودًا أو يثبت region/tier تلقائيًا. لا وعد سعة Free أو تكلفة أو QPS. سقوف batch والمدة والمحاولات في C محفوظة؛ قياس التراكم/latency قبل رفعها. isolation الموثق تصميم للمراجعة لا config مثبتة.

## 5. الطب والدرجات

لا سؤال/فحص/صورة أو بنك Training Quiz جديد أو محتوى طبي منشور. لا تغيير scoring أو أوزان/بوابات أو بيانات التدريب أو توقعاته/بصماته. fixtures محلية هندسية فقط؛ O108 باقٍ لكل مصدر وترخيص ومراجع وخلفية ومعيار واعتماد Marker قبل محتوى حقيقي. قرارات المنتج الأصلية وروابطها محفوظة دون تغيير.

## 6. أوامر الفحص والدليل

من جذر المستودع، متاحة الآن دون اتصال مزود:

```sh
node --test scripts/docs/assess-staging-preflight.test.mjs
npx vitest run src/features/assess/staging-catalogue.test.ts
npx eslint scripts/assess/staging-preflight.mjs scripts/docs/assess-staging-preflight.test.mjs src/features/assess/staging-catalogue.test.ts
npm run docs:test
npm run docs:check -- --base origin/main
npm run status:check -- --base origin/main --require-previous
git diff --check
```

مثال اصطناعي محلي فقط؛ لا يعني وجود المشروعين أو السماح بإنشائهما:

```sh
node scripts/assess/staging-preflight.mjs --production-url https://production-fixture.supabase.co --staging-url https://staging-fixture.supabase.co
```

الأداة تقبل public origins فقط، وترفض تطابق المشروعين أو URL ببيانات دخول أو path/query/port أو target غير Supabase. لا تكتب ملف إعداد أو attestation أو تتصل بهذين العنوانين. لا يوجد switch لتجاوز البوابات؛ الناتج دائمًا `liveChecksPerformed=false` و`deploymentReady=false`.

بعد **إذن staging** فقط، وربط profile اتصال مخصص `assess-staging` خارج Git والتأكد من وجهته؛ هذه أوامر مراجعة مقترحة **لم تُشغل على مزود**:

```sh
psql 'service=assess-staging' -X --set ON_ERROR_STOP=1 --file supabase/checks/assess-staging-ready.sql
psql 'service=assess-staging' -X --set ON_ERROR_STOP=1 --file supabase/checks/assess-mixed-ready.sql
```

لا تستخدم اتصالًا افتراضيًا أو اسم إنتاج بدل profile مفقود. أوامر SQL تستعمل BEGIN READ ONLY وROLLBACK؛ لا تستدعي start/expose/submit/install/maintenance ولا تعطي بوابة فتح. يلزم `catalogue_ready=true` و`runtime_or_launch_verified=false` عمدًا في الأول، ثم كل شروط فحص D ومن ضمنها `launch_gate_closed=true`. فحص schema الحالي لا يقرأ قيمة gate في catalogue؛ لا تخلط النجاحين.

نتائج التحضير المحلي: اختبارات preflight الثلاثة ناجحة، واختبار catalogue على PGlite ناجح بما فيه انحرافات الصلاحيات وغياب الدالة وحماية العامل. lint للملفات الثلاثة المعدلة ناجح؛ docs:test ناجح26حالة، بما فيها اختبارات preflight الثلاثة ضمن CI القائم دون تغيير package/workflow. typecheck وفحوص docs/status/diff ناجحة، دون errors أو review warnings، مع حفظ تعارض RAD-024 الموروث. أثناء التطوير كشف الاختبار أن إعادة إنشاء دالة في fixture تحتاج revoke صريحًا قبل منح العامل؛ صُححت استعادة fixture، ولم تتغير ترحيلات/ACL التطبيق أو توقعات اختبار قائم. آخر GitHub تحقق عند بدء الدفعة أظهر CI رقم39356402428 ناجحًا وDeploy Pages رقم39356402342 محظورًا للرأس السابق؛ لا نتيجة مفترضة للرأس الجديد. PGlite يثبت صلاحية SQL والجرد ورفض الانحرافات في بيئة محلية، لا تزامن PostgreSQL أو إعداد Supabase حيًا. لا إعادة check/build/متصفح للتطبيق دون تعديل منتج؛ أدلة D السابقة في تقريرها، ولا تتحول إلى live proof.

## 7. البوابات الفعلية المتبقية

لم يُحدد أو ينشأ مشروع staging فعلي أو profile/credentials أو مزود Node، ولم يُثبت فصل معاينة PR عن production vars. C/D غير منشورتين وlaunch_gate مغلقة. CI للمسودة السابقة ناجح، وDeploy Pages يتوقف عند حارس المخطط؛ آخر نتيجة تم التحقق منها عند بدء التحضير تخص رأس التوثيق السابق، وليست دليل نجاح هذه الدفعة الجديدة. O106 والتجهيز والمراقبة والاسترداد وO108 باقية؛ لا إثبات بيئة أو بوابة من مجرد PREPARED_LOCAL_ONLY.

## 8. قائمة المراجعة والخطوة التالية

راجع المقترح: مشروع Supabase مستقل بلا بيانات إنتاج، متغيرات STAGING منفصلة بلا fallback، مشروع Pages محمي مستقل، Node24/worker role خاص بلا قناة عامة، جدول وmonitoring وrestore، وقبول اصطناعي محدود مع بقاء الإنتاج مغلقًا. قبل أي فعل خارجي يُحدد المشروع والمزود/region/tier/الكلفة والصلاحيات ويُمنح إذن محدد؛ لا موافقة شاملة مستنتجة من «تمام ابدا» للتحضير المحلي. لا تعليمات فتح gate أو تطبيق SQL إنتاج هنا. لا ready/merge/auto-merge أو E.

للجلسة التالية: اقرأ AGENTS وHANDOFF وهذه الخطة والحالة، وتحقق من PR ونتائج GitHub الحالية. نفذ النطاق الخارجي فقط إن كان مأذونًا ومحدد الوجهة؛ وإلا أكمل التحضير المحلي الممكن، ولا تطلب إعادة اعتماد قرارات Assess المحسومة.
