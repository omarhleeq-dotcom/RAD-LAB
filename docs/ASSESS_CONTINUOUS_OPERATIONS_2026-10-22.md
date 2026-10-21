# تحضير التشغيل والمراقبة والاستجابة — 2026-10-22 عمّان

هذا دليل تجهيز للخطوة6، لا scheduler منشأة أو إذن تشغيل مستمر. [تقرير الدفعة الثانية](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md) يحدد المنفذ والمتعذر والأدلة. اختيار Cloud Run وS-ASSESS-15 محسومان؛ المقترحات التشغيلية أدناه لا تعيد اعتمادهما أو تغير أعمار SQL. لا أدوات live في CLI الجديدة.

## الأدوات الجاهزة وحدودها

- [operations-health.sql](../scripts/assess/sql/operations-health.sql): ملف كامل للمالك في Supabase SQL Editor **في نافذة تشغيل لاحقة مرتبطة بتغير فعلي**، لا إعادة للجرد/الاتصال الآن. يقرأ كـpostgres في REPEATABLE READ READ ONLY، وrow_security=off، ثم ROLLBACK. statement5s/lock2s، وسقف100 وسنتينل101 للمحاولات والاتصالات؛ التجاوز/الدور المفقود/شكل gate غير صحيح/نقص الصلاحية يعني خطأ بلا أصفار جزئية. الأعمدة scalar فقط؛ لا أجوبة/علامات/مفاتيح أو بيانات شخص. صلاحيات الجداول لا تمنح للعامل.
- [operations-review.mjs](../scripts/assess/operations-review.mjs): دالة نقية تفحص لقطة facts منقحة يجهزها المشغّل من الأدلة. تكشف نقص/اختلاف نسخ المصدر والصورة/السر وSQL، والتداخل/retries والجدولة، والفشل والطابور والـleases وتسوية المحاولات قبل الإغلاق. ليست جامع بيانات أو مصادقًا لتوقيع/صحة أدلة المشغّل.
- [review-operations.mjs](../scripts/assess/review-operations.mjs): CLI محلية تقرأ ملف JSON واحدًا حتى64KiB، وترفض symlink والأعلام الإضافية، وتخرج رموزًا ثابتة فقط. لا gcloud/شبكة/DB أو إرسال تنبيه أو أي استدعاء worker/maintain/recover. المخرجات لا تنسخ أسماء المهمات أو المعرفات أو أي حقل خام.

وظيفة الأمر التالي **محليًا في checkout السحابي أو عند المالك على جهازه** مراجعة ملف أعده المشغّل، وليس تشغيلًا في Cloud Shell أو SQL Editor. المسار مثال لملف محلي منقح؛ لا تضف إليه JWT أو config سر العامل:

```bash
node scripts/assess/review-operations.mjs --evidence /absolute/path/operations-evidence.json
```

الخروج0 يعني CLEAR لهذا الفحص المحدود فقط؛ ATTENTION/BLOCKED يخرجان1. `runtimeOrLaunchVerified=false` و`liveAcceptanceVerified=false` دائمًا؛ لا تتحول CLEAR إلى ready/merge أو قبول حي أو إذن scheduler.

## تعبئة ملف النطاق دون سر جديد

[build-trial](../scripts/assess/build-trial.mjs) تقبل الآن ملف نطاق مراجعًا بعقد assess-trial-scope/1 وحقل trial وهو UUID controller فقط؛ لا هويات المشاركين أو حسابات أو credentials. يُطابق المالك UUID داخليًا مع النطاق الذي سيراجع في SQL؛ لا توليد/تفعيل نطاق حي من الأداة.

وظيفة الأمر التالي **محليًا قبل أي Cloud Shell deployment** إنتاج build context مقيدة بالنطاق؛ ليس Docker build أو push أو Job update:

```bash
node scripts/assess/build-trial.mjs --scope-file /absolute/path/assess-trial.json
```

المولد يقرأ ملفًا عاديًا بلا symlink وبحد4KiB وبحقلين فقط، ويكتب assess-trial.json canonical بصلاحية0400، وCOPY إلى /run/config/assess-trial.json بملكية node، وmanifest ببصمته وscopeBound=true. الحارس0 افتراضيًا ولا UUID في stdout/Dockerfile. مراجعة build context/hash لا تثبت الصورة المنشورة؛ يلزم ربط digest الصورة بالمحتويات والإصدار ثم فحص execution المستخدمة فعليًا، دون تشغيل عام لاختبار مجرد الوجود. بلا العلم يبقى scopeBound=false، فلا تستعمل تلك الحزمة في التجربة. تتغير صورة النطاق عند تغييره، ولا تُعدَّل config حية خارج المراجعة أو يضاف secret جديد لتجاوز التثبيت.

## عقد إدخال المراجعة

غلاف الملف له ثلاثة مفاتيح فقط: `current` اللقطة الحالية، `previous` لقطة سابقة من العقد نفسه أوnull، و`policy:{"maxAgeSeconds":300}`. حد freshness300ثانية مقترح تقني للمراجعة فقط؛ يقبل30..3600 دون تغيير lease/retry أو مدد المنتج. التوقيت UTC canonical مثل `2026-10-22T00:10:00.000Z`؛ يرفض وقتًا غير canonical أو مستقبليًا أو دليلًا قديمًا. يحتفظ المشغّل بالملفين محليًا بصلاحية ضيقة؛ لا أرشيف بيانات مستخدمين أو إرسال تلقائي.

`current` بالضبط: `contract:"assess-operations-evidence/1"`، و`phase:"closed"` أو`"trial"`، و`observedAt`، والأقسام الستة `job,scheduler,versions,database,execution,tick`. لا حقول إضافية؛ الحقول المجهولة تُذكرnull وفق الجدول بدل اختراع صفر/نجاح. تعدّ الواجهة facts مذكورة من مشغّل موثوق، **ولا تثبت الأداة مصدرها**.

| القسم | الحقول الدقيقة ومصدرها لاحقًا |
|---|---|
| job | `name` اسم v2 كامل projects/…/locations/…/jobs/…؛ `taskCount,parallelism,maxRetries` أعداد أوnull؛ `guard` نص0/1 أوnull؛ `kind` scoped-trial/general/null؛ `scopeBound` boolean/null؛ `activeExecutions` عدد0..100 أوnull. تُستخرج من تعريف/قالب execution الفعلية وقائمة executions محدودة101؛ parallelism لا يساوي العدد العالمي. scopeBound تحتاج إثبات ملف النطاق وبصمته داخل artifact المستخدمة، لا تخمينًا من guard. |
| scheduler | `state` ABSENT/PAUSED/ENABLED/UNKNOWN؛ `retryCount` عدد أوnull؛ `targetJob` اسم المهمة الكامل أوnull. PAUSED لا تمر إلا retry0 وtargetJob=job.name؛ ENABLED تظل BLOCKED لأن قبول التشغيل المستمر مستقل. ABSENT تحتاج جردًا محدد النطاق كاملًا، لا تجاهل خطأ صلاحية/صفحة. |
| versions | `reviewedSource` SHA40 للنسخة البرمجية المراجعة؛ `uiSource,workerSource` SHA40 أوnull؛ `expectedImage` و`observedImage` digest بصيغة sha256:…64حرفًا، observed قد تكونnull؛ `expectedSecretVersion` إصدار رقمي موجب نصي و`observedSecretVersion` مثله أوnull؛ `sqlMatched` boolean/null. لا latest. المصدر من سلسلة بناء/bundle hashes تربط المصدر بـdigest فعلي، لا label وحدها. observedImage من execution نفسها عند trial، ومن تعريف المهمة عند closed. تطابق SQL من مراجعة catalogue المصدر في نافذتها، لا PASS تاريخية. لا إعادة بناء لصورة byte-identical لمجرد commit توثيق: وثق byte proof واختر reviewedSource البرمجية الصحيحة. |
| database | صف `observation` كما يعيده SQL الجديد أوnull. مفاتيحه contract وobservedAt وhealth وcontrols؛ يقبل عقد assess-operations-health/1 فقط. controls فيها gateClosed/loginDisabled/loginExpired كقيمboolean وbackendSessions عدد0..100. health فيها activeAttempts/gradingAttempts/failed/alert/overdue/purgeDue/claimableNow/liveLeases/expiredLeases/retryWaiting بأعداد0..100 فقط. لا حذف لمفتاح مفقود لتعويضه بصفر. |
| execution | null أو`{name,state,startedAt,completedAt}`. name هو job.name متبوعًا /executions/…، وstate إحدى RUNNING/SUCCEEDED/FAILED/CANCELLED/UNKNOWN، والتوقيت canonical؛ RUNNING يلزم completedAt=null. مصدرها Cloud Run execution المحددة لا Job Ready أو سجل من تشغيل آخر. |
| tick | null أو`{execution,at,report}`؛ execution يساوي اسم execution أعلاه حرفيًا وat داخل نافذة تشغيلها. report هو whitelist عقد assess-job/1 الفعلي: contract/outcome/code/runtimeOrLaunchVerified=false، وcounts المؤكدة عند وجودها. COMPLETE بلا counts أو failed>0 مرفوض؛ STOP/unavailable لا يختلق counts. counts مفاتيح expired,purged,graded,failed,healthFailed,alert,overdue,purgeDue، واختياريًا reservationsPurged,consentsPurged، أعداد0..100 فقط. لا raw log أو claim. |

في closed يلزم guard0 وصفر execution جارية وإغلاق gate/login/expiry وصفرbackend، وتسوية active/grading/live leases. في trial يلزم guard1 وصورة scoped-trial/نطاق مراجع وحد1/parallelism1/retries0، وتقرير مرتبط بالتنفيذ وتأكيد نجاح المنصة؛ لا يستنتج من ذلك موافقة v2 أو نجاح سيناريو المستخدم. السابقة يلزم أن تسبق الحالية في الزمن ومن phase نفسها، وأن يكون توقيت DB السابق أقدم وبفاصل freshness مناسب لاستنتاج overdue_persistent. لا يربط مجرد count بهوية مشارك.

## الجدولة المجهزة كمقترح مغلق

| البند | الإعداد/الفحص المطلوب قبل تفعيل لاحق |
|---|---|
| نوع العملية | Job محدودة وتنتهي؛ لا خادم HTTP للعامل أو loop جديد داخل tick. تجربة MCQ يدوية فقط، ولا تُحوّل صورتها تلقائيًا إلى خدمة عامة مستمرة. |
| Cloud Run | taskCount1/parallelism1/maxRetries0، digest وصلاحية خدمة/سر رقمي مراجعة، timeout من قياس الدورة والإيقاف. القيمة السابقة300ثانية شاهد تاريخي وليست قياس قدرة للصورة المقيدة. |
| Cloud Scheduler | تحضير تعريف **PAUSED** فقط بعد إذن إنشاء مستقل؛ API jobs:run بهدف محدد وbody فارغة بلا overrides، ومصادقة OAuth لهوية invoker مخصصة، لا endpoint عام أو مفتاح SA JSON. retries0؛ لا إعادة بسبب غموض ACK. |
| التزامن | jobs:run تعيد operation قبل اكتمال execution. parallelism1 يقيد المهام داخل execution فقط. قبل أي schedule يلزم تصميم/إثبات منع تداخل التشغيلات اليدوية/المجدولة، أو قبول واختبار تزامن مقاس خارج قفل التجربة. لقطة list قبل run ليست mutex ذريًا. لا ادعاء وجود موزع مانع للتداخل في هذه الدفعة. |
| الإيقاع | اقتراح الدقيقة السابق وbatch50 ليسا اعتمادًا للتشغيل. يحدد الإيقاع بعد قياس زمن tick/صفوف backlog/DB connections/تكلفة؛ لا cron مفعلة أو حجز موعد الآن. رفع batch1 أوpool1 يحتاج نطاقًا وقياسًا ومراجعة. |
| الصلاحيات | فصل ناشر/مشغّل/هوية العامل/مراقب القراءة. invoker للهدف المعني، دون منح execute-with-overrides لعموم المشغلين؛ راجع inherited IAM وحق انتحال الهوية والوصول للسر. لا IAM تغيرت هنا. |

لا تعريف scheduler حي أو ملف deployment قابل للتطبيق أُنشئ؛ جدول الشروط والمراجع المحليان أدوات التحضير. التفعيل ينتظر قبول التجربة والنسخ/المراقبة والتزامن والتكلفة وإذنه، لا ينتج من نجاح هذه الأدوات.

## المراقبة والتنبيه والاستجابة

المشغّل المسؤول وقناته الفعلية وبديله لم تُعين؛ لا Slack/email أو تنبيه خارجي أُرسل. `notificationRecommended` اقتراح محلي عند finding جديدة أو تغير الأعداد مع وجود عائق، ويهدأ عند الدليل نفسه دون تغير جوهري؛ overdue_first_sample وoverdue_persistent من الفئة نفسها لتجنب تكرار التنبيه دون تغير. لا history دائم أو قاعدة dedup للتنبيهات؛ يحفظ المشغّل السابقة صراحةً. تحذير العينة الأولى لا ينوب عن قناة إنذار مجربة للعينة المستمرة.

| إشارة | الاستجابة المجهزة، بلا تنفيذ تلقائي |
|---|---|
| تقرير مفقود/قديم أو execution مجهولة/فاشلة/ملغاة | توقف إطلاق تشغيلات جديدة؛ راجع execution بعينها وlog المنقح وحالة DB. غياب log ليس graded0 ولا نجاحًا من exit0 وحده. freshness300ثانية مقترحة، وليست SLA. |
| grading-failed أو alert24h أو STOP/grading_uncertain | لا تغيير درجة أو إعادة finish أو recover عمياء. SQL مصدر الحقيقة: افحص هل finish التزمت بالفعل، ثم انتظار retry_at/lease أو recover_v1 القائمة بإذن وعقدها قبل سبعة أيام. لا worker retry جديدة. |
| lease حية أو منتهية | الحية لا تُنتزع؛ SQL تحدد صلاحية token. بعد timeout/SIGKILL قد تبقى معاملة/إقرار غامض؛ لا افتراض rollback. المنتهية تحتاج مراجعة مستقلة، لا تغيير timestamps أو force claim. نافذة lease5دقائق، retry الأولي دقيقة و24ساعة/7أيام من SQL تبقى كما هي. |
| overdue أو backlog/purgeDue | تحقق من وصول العامل/إيقافه/الأقفال وكفاية الحد، ثم مصالحة الصيانة الأصلية. لا تحذف الصفوف أو الموافقات لتنظيف التنبيه؛ حفظ الإسناد/metadata والأعمار والستة أشهر ثابتة. |
| تداخل executions أو NOWAIT/lock error | أوقف التشغيلات الجديدة، سجل عدم اليقين وراجع الجاري/DB. لا رفع limit أو retries أو مهلات لتمرير التجربة؛ قفل التجربة خشن القفل ولا يعد تشغيلًا دائمًا ذا throughput مقبول. |
| ظهور claim/answer/config/JWT/درجة أو هوية في logs | أوقف التوسع، قيّد الوصول للسجل المتأثر وراجع مصدر التسريب وإجراء الأسرار مع المالك؛ لا نسخ raw log للمحادثة أو التنبيه. لا ادعاء تنقيح المزود من mocks. |

## الإغلاق والإلغاء وSupavisor

خطوات مستقبلية مرتبة، ينفذ كل صاحب صلاحية جزءه بعد إذنه: المالك في المتصفح/الأداة المفوضة يغلق إسنادَي التجربة نهائيًا؛ تُسوّى المحاولات القائمة بالعقد ولا تحذف. المالك في SQL Editor يغلق gate ويعطل/ينهي LOGIN وفق الأدوات المعتمدة؛ المالك في Cloud Shell يمنع executions جديدة ويغلق الحارس ويوقف الجاري عند الحاجة ويراجع task/execution status. لإلغاء الاعتماد الكامل تلزم مراجعة IAM ونسخة السر والحق في جلبها والاتصالات القائمة، لا guard0 فقط.

NOLOGIN/expired لا ينهيان اتصال DB قائمًا، وbackend_sessions0 لقطة لا دليل cache. لا تثبت Supavisor password-cache invalidation من metadata؛ بعد نافذة تشغيل فعلية وخطة إلغاء مأذونة يلزم إثبات رفض اتصال جديد بالاعتماد القديم من مسار المزود نفسه، والتحقق من إنهاء الاتصالات المستهدفة الموجودة وتوقف executions وحق استرداد السر. لا إعادة probe الناجحة السابقة الآن أو رفع/تغيير سر/password من هذا الدليل، ولا طلبها بالمحادثة. فشل أو غموض الاختبار يبقي الإلغاء الكامل غير مثبت، ولا يحوّل النتيجة إلى نجاح.

الهدف النهائي ليس حذف حسابات Auth أو Practice. disable_account_v1 تعطيل Assess منطقي دائم بعقده الحالي، ولا يساوي سحب JWT/Auth أو قتل جلسة DB. أي استعمال له على حسابات التجربة يحتاج إذنه، ولا يفترض وجود حسابات مخصصة أو يستعمل على طالب فعلي لإكمال القائمة.

## التكلفة وقبول التشغيل المستمر

قبل تفعيل لاحق: قِس CPU/ذاكرة/مدة وتشغيلات وDB connections وstatement/lock failures وحجمlogs وArtifact Registry/Secret Manager/Cloud Build وSupabase storage/egress. ميزانية Billing وتنبيه الإنفاق **ليسا cap** أو ضمان Free؛ حد التشغيلات/الموارد/IAM إجراء مستقل. لم تُقرأ فوترة أو quotas ولا تُقدّر قيمة نقدية بلا حساب/منطقة/قياس وأسعار مثبتة. يشمل الاعتماد مسؤول تكلفة وقناة إنذار وتجربة استلام مأذونة وحد إيقاف عملي؛ كلها مفتوحة.

قبول التشغيل المستمر يحتاج شاهد تجربة هندسية حية بإذنها، ومطابقة UI/SQL/image، وهوية/ACL/تسوية/إلغاء فعلي، ومنع/قبول تداخل مراجع، وجدولة/مراقبة وقناة مجربة وقياس تكلفة، وبوابات النسخ/الاستعادة/المحتوى المستقلة. لا scheduler أو نشر أو إعادة قبول تصميم/احتفاظ أو نسخة شاملة جديدة من هذه الخطة.
