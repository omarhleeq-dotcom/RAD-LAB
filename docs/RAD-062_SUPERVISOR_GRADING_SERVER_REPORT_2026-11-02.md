# RAD-062 — تفويض تصحيح المشرف M09، 2026-11-02

## 1 — الانحرافات والميزانية

تنفيذ خادمي خامل وفق [التصميم المعتمد، القسم4 كاملًا](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md) و[قرار المالك](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02).
Recorded (GitHub read): #198 مدموجة عبر GitHub؛ الفرع `rad062/supervisor-grading-server` من main المحدث؛ commit الأول توثيقي للموافقة1–9 و5=A وشرط الإتمام.
الدفعة الأصلية13ملفًا؛ متابعة الاستثناء أضافت ملفي توقعات فقط: **15/22** إجمالًا. متابعة عيب الأدوار أعلنت fixture وهذا التقرير فقط؛ لا dependency أو workflow.
القائمة: DECISIONS/project-status/HANDOFF، هذا التقرير، [الدليل](RAD-062_M09_LAPTOP_RUNBOOK.md)، [M09](../supabase/migrations/20261102000100_rad062_supervisor_grading_authorization.sql)، [check الجديد](../supabase/checks/rad062-m09-ready.sql)، [fixture](../src/features/assess/rad062-m09-fixture.ts)، اختبارات [التفويض](../src/features/assess/rad062-supervisor-grading.test.ts)/[الأقفال](../src/features/assess/rad062-supervisor-locks.test.ts)/[الكتالوج](../src/features/assess/rad062-supervisor-catalogue.test.ts)، [البروفة](../scripts/assess/rad062-m09-rehearsal.mjs)، و[manifest](../scripts/pages/frontend-schema.json)؛ أضيف [اختبار يوم القاعدة](../scripts/docs/rad062-db-day.test.mjs) و[اختبار الاسم](../src/features/assess/rad062-name.test.ts) للاستثناء المحدد أدناه.
Not run (env): سحب صورة Supabase17.11 المطابقة فشل `failed to register layer: no space left on device`؛ نجاح PG18 لا يعوضه؛ CI والمراجع حاجبان قبل الدمج/النافذة.

## 2 — المنجز والمستبعد

M09 أمامية داخل معاملة واحدة؛ تتحقق من كتالوج M08 كاملًا قبل استبدال كتل التفويض الست وعدد كل anchor=1، ثم تثبت خصائص/OID/ACL/config/owner/FK قبل COMMIT.
تفويض المشرف يتطلب scope وحيدة متسقة مع المجموعة والمراجعة والتعيين الأصلي، حسابًا مؤهلًا وفترة واشتراكًا صالحين، والطالب مستهدفًا ومن period نفسها وبدأ بعد visible_from المثبتة والحالية.
كل read/score/replay/finalize/receipt يعيد التفويض، والطابور يرشح قبل limit/cursor بلا counts أو مراجع مرفوضة؛ وقت المجموعة و168h وhold يعاد فحصها بعد الانتظار وعند حاجز الكتابة.
المسار الأصلي owner_id/assignment_managers باقٍ، والإنقاذ scoped مشروط بزوال السلطة، يزول بعودتها؛ score إنقاذ صريح owner-takeover، ممنوع للمشرف؛ finalize عند100 لا يصطنع حدثًا.
إيصال المشرف يقتصر على final_grader_id=self؛ لا اسم/بريد/UUID طالب جديد، وحقول scope في الأثر باقية NULL.
M09 في deferredMigrations فقط؛ requiredMigrations/checks/marker والبوابة/العامل/السر/الناشر كما هي؛ لا UI أو شاشة5ب أو SQL حي أو متغيرات أو ترقية أو نشر إضافي.

## 3 — لكل مهمة

RAD-062 تبقى in_progress/reviewer؛ شرط هذه الخطوة: `PR merged + CI green + reviewer audit; live apply waits for a separate owner window`.
الإغلاقات السابقة محفوظة؛ [STOP5ب](RAD-062_PHASE5B_REPORT_2026-11-02.md#stop) أصل الفصل بين دفعة التفويض والشاشة، و#196 مؤجلة لـa dedicated TS7 batch.
Recorded (GitHub read): [Draft #199](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/199) واحدة فقط؛ لا ready/merge/auto-merge أو subscribe/poll؛ CI المرجع النهائي، ولا ادعاء جاهزية حية من هذا التنفيذ.

## 4 — المشترك وScale

ترتيب الأقفال: capacity ثم scope SHARE ثم actor ثم profiles مرتبة ثم appointment/group/scope ثم assignment SHARE ثم session UPDATE ثم manual_work؛ بلا تعديل D3/freeze.
الطابور يحمي أهلية profiles قبل الصفحة ويعيد التفويض لكل صف بعد الأقفال؛ قفل scope القائم يحمي العضوية/المشاركة والتعيين حتى نهاية المعاملة، وprofile SHARE يحمي الأهلية.
لفحص بصمة baseline فقط يستعمل السياق public المطابق للفحص القديم، ثم يعيد search_path الفارغ قبل الترقيع؛ LF/CRLF تمثيل فقط، وأي anchor ناقصة/مضاعفة يلغي المعاملة.
سقف100عملية و10كتابيات و4000code points وpage20–100 و168h كما هي؛ الطابور يقفل profiles المرشحة الحالية ضمن pilot المحدود؛ رفع الحمل أو scopes/مشرفين متعددين يحتاج تصميمًا وقياسًا مستقلين.
البروفة الجديدة تستعيد أحدث نسخة RAD-086 في صورة مثبتة مع ICU والتحقق القائم من الأدوار/الأعداد، وتطبق M09 فقط؛ لا اتصال مزود أو إخراج بيانات طلاب.
الـcheck الجديد يغير بصمة الدوال فقط؛ بصمة العلاقات ثابتة. القديم قبلM09 والجديد بعدها؛ لا تشغيل توقعين ضد الكتالوج نفسه أو ترقيتهما في manifest هنا.

## 5 — الطبي والدرجات وسؤالا AGENTS

لا تغيير طبي أو حساب أو limits أو JSON أو signature أو grant أو جدول/FK؛ نص Unicode/المسافات محفوظ حرفيًا والتعديل الحر قبل النهائي فقط؛ لا appeal/regrade بعده حتى hidden.
هل تغير الحكم؟ لا؛ نفّذت سلطة المالك الجديدة صراحةً دون اختصار يغير قاعدة؛ [قرارات الأصل](DECISIONS.md#rad062-phase2-owner-2026-10-29) و[S3](DECISIONS.md#rad085-sec-fixes-owner-2026-10-27) باقيتان.
هل بقي رابط الدليل الأصلي؟ نعم: [التصميم](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md)، [P6](archive/reports/2026-10/RAD-062_P06_REPORT_2026-10-30.md)، [P7](archive/reports/2026-10/RAD-062_P07_REPORT_2026-10-30.md)، [P10](archive/reports/2026-10/RAD-062_P10_REPORT_2026-10-30.md) و[دليلP9](RAD-062_P09_LAPTOP_RUNBOOK.md).

## 6 — QA وحدود الدليل

السجلات التالية أدلة محلية، ولا تمنح تحقق CI/المراجع؛ لا وصف Verified لنمط17.11/ICU قبل تشغيله ونجاحه لدى CI أو المراجع.

Inferred (local evidence; CI/reviewer pending): PostgreSQL18 الحقيقي أثبت60حالة M09 محلية، وفحص manifest/marker مستقلًا؛ التشغيل الكامل للنمطين121اختبارًا. نمطSupabase60حالة فشل بسبب الصورة المفقودة بلا skip. أُصلحت موافقة Assess في fixture صف paging، وأُثبتت منفردة.
Inferred (local evidence; CI/reviewer pending): فحص الأقفال النهائي25/25؛ تُسلح نافذة500ms بعد شاهد انتظار profile، ويُجهز مسار commit تحت savepoint تتراجع كل آثاره قبل التسليح؛ لا تغيير لأي مهلة أو تقليل لأي تأكيد.
Inferred (local evidence; CI/reviewer pending): byte proof لكل205ملفات محمية من main، بما فيها كل SQL/checks القديمة وmanual/fixtures وحزمتا الهاتف وبيانات/اختبارات QA؛ التوقعان المحددان فقط مستثنيان لاحقًا؛ بقية التأكيدات والملفات المحمية وgolden/characterisation ثابتة.
Inferred (local evidence; CI/reviewer pending): الماركر قبل وبعد التعديل `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`؛ بلا تغيير متغير أو اتصال حي.
Inferred (local evidence; CI/reviewer pending): npm ci وإعداد PostgreSQL المثبت وnpm audit --audit-level=high؛16تنبيهًا متوسطًا قائمًا، بلا إصلاح dependency خارج النطاق.
Inferred (local evidence; CI/reviewer pending): فحوص CI PostgreSQL للطوارئ/الأقفال/الاسترداد/connection-probe:39/39؛ secret-uploader Python:8/8، دون skip.
Inferred (local evidence; CI/reviewer pending): حراس displayed-text/session-account/schema/supervisor-review الخصوصية:71/71 في11ملفًا بلا تغيير.
Inferred (local evidence; CI/reviewer pending): typecheck وlint بلا خطأ جديد؛ تحذيرا lint سابقان فقط؛ build وbuild:pages نجحا مرة لكل منهما دون نشر، وdocs:sync مرتان idempotent وdocs:check وstatus:check --require-previous وdiff --check خضراء.
Inferred (local evidence; CI/reviewer pending): إعادة معزولة لاختبارات manual-grading11 والخدمة7 وlifecycle19 وtrial14:51/51 خضراء بالمهلات الأصلية. مهلات5000/20000ms في التشغيل المتزامن باقية دليلًا تاريخيًا، لا نجاحًا مخفيًا.
Not run (env): تثبيت age/PG16 تعذر: `sudo: command not found` ثم apt `Acquire (13: Permission denied)`؛ توثيق الاستعادة لا يعوض تشغيلها.
Not run (env): نمطM09/Supabase17 والبروفات المطابقة وlocale matrix؛ صورة Supabase وصورةpostgres17.11 كلتاهما فشلتا عند تسجيل layer بمساحة القرص. Worker rehearsal توقف عند postgres-container مع cleanup=true.
Inferred (local evidence; CI/reviewer pending): npm run check شُغّلت كاملة:3283pass/67fail/0skip؛ تضمنت عوائق الصورة/التوقع القديم ومهلات وشاهدَي SHA/fixture أُصلحا وفُحصا لاحقًا؛ ليست خضراء.
Inferred (local evidence; CI/reviewer pending): docs:test السابقة:115pass/9fail/0skip قبل الاستثناء؛ لا تُعد نتيجة CI.
Inferred: توافق صورة الإنتاج والنسخة الحقيقية يحتاج بروفة المالك وCI؛ لا نتائج سريرية أو تشغيل حقيقي أو فحص هاتف تصحيح في هذه الدفعة.

Inferred (local follow-up; CI/reviewer pending): اجتاز شاهد يوم القاعدة المعدل محليًا1/1، واختبار الاسم7/7 وlint للملفين؛ أُثبت حرفيًا أن الفرق في كل ملف هو التوقع المحدد والتعليق فقط، وباقي الملفات خارج الستة ثابتة البايتات.
Not run (env): docs:test في المتابعة116pass/8fail/0skip؛ زال فشل التوقع المحدد، وبقيت أدوات age/PG16 وصور Docker/الاستعادة محجوبة محليًا. امتلأ القرص أثناء البروفة (`No space left on device`)؛ حُذفت صورتها المحلية غير المستخدمة فقط لاستكمال الفحوص والدفع؛ لا تخفيف للفحص.
Not run (CI, prior owner statement): توقف CI عند docs:test قبل نمط17.11؛ الإفادة التالية من المراجع تشغيل محلي لاحق على8b0c038، وليست نجاح CI. لا انتظار أو polling هنا.
### متابعة fixture — عيب الأدوار العامة، 2026-11-02

Verified (reviewer, 8b0c038): embedded نجح كله؛ Supabase17.11 المثبت مرّ بأول حالة لكل ملف ثم فشل57بـ`role "assess_worker" already exists`؛ السبب إعادة الترحيلات لكل قاعدة داخل الحاوية، لا M09.
Inferred (fixture repair; production rerun pending): تُطبّق M01–M08 مرة واحدة لكل حاوية بلا بيانات أشخاص أو M09، ثم يغلق اتصال القالب ويُسمى m09_template ويُمنع الاتصال به. كل حالة تستنسخ قاعدة مستقلة وتزرع بياناتها وتطبق M09 صراحةً؛ لا catch/ignore للأدوار الموجودة.
Inferred (local run, three files, no skip): embedded: catalogue8/8 + grading27/27 + locks25/25 =60pass/0fail؛ فحص manifest المستقل1pass. Supabase17:0pass/60setup-fail، موزعة8+27+25؛ لم تصل أي حالة إلى SQL في الحاوية لأن الصورة مفقودة.
Not run (env): سحب digest المثبت فشل مجددًا بـ`failed to register layer: no space left on device` على Docker vfs؛ الزمن الكلي للمحاولة165.294ثانية، وembedded160.720ثانية مجموع الحالات. هذه ليست قياسًا صالحًا لزمن Supabase.
Inferred (supplemental PG18 SQL only): قاعدتان مستنسختان من قالب M08 مغلق اجتازتا old readiness ثم M09 ثم new readiness، ودور assess_worker موجود مرة واحدة؛ لا دليل بديل على17.11/ICU. typecheck وlint نجحا محليًا.
Not run (valid Supabase timing): الميزانية15دقيقة وmain≈11بإفادة المالك، فيبقى≈240ثانية؛ زمن الإضافة غير معلوم، ولا يجوز استنتاج ملاءمتها من فشل setup. سجل fixture الجديد `M09 Supabase17 fixture timing` يطبع عدد القواعد المستنسخة وزمن عمر الحاوية شاملًا بدءها وترحيل القالب والإزالة عند تشغيل صالح؛ CI timeout ثابت.

## 7 — المفتوح ومحفزات STOP

اعتمد المالك2026-11-02 استثناء الموضعين الأصليين [rad062-db-day.test.mjs:91](../scripts/docs/rad062-db-day.test.mjs) و[rad062-name.test.ts:36](../src/features/assess/rad062-name.test.ts) فقط: deep-equal حرفي لإدخال M09 الوحيد، بالاسم وSHA `9152676e5975333e1bedaf453c7b7855d5f8e910df7d03dc1e64cdf78037dc0a` وreason وserverModules كما في manifest؛ بلا wildcard أو تعديل أي تأكيد آخر.
التعليق الحرفي في الموضعين: `M09 dormant until promotion; the promotion batch restores {}`؛ دفعة الترقية ملزمة بإرجاع التوقعين إلى `{}`. لا تغيير SQL أو manifest أو marker في المتابعة.

أي فشل CI غير بيئي يحتاج إصلاحًا في Draft نفسها؛ فشل البيئة هنا لا يرفع شرط Supabase17/ICU أو يخفف مهلة/حارس/اختبار؛ المراجع يشغل الحزمة كاملة قبل الدمج.
STOP عند أي drift/ACL/FK/anchor أو packet أو marker أو توقع قديم متغير خارج الاستثناء المسمى، أو حاجة توقيع/JSON/grant/table، أو تبعية جديدة أو تجاوز22؛ حزم الهاتف وlive خارج التعديل.
تحقق17.11/ICU وإثبات زمن الإضافة مقابل هامش240ثانية حاجبان؛ STOP إذا تجاوز التقدير15دقيقة، بلا رفع مهلة CI. لا ادعاء نجاح نسخة مشفرة مستعادة أو بيئة الإنتاج حتى إثباتها؛ شروط القنوات/ACK/البديل والحقوق/الخصوصية/الموافقة والنسخ المستقلة تبقى قبل التشغيل.

## 8 — قائمة قرارات المالك الموحدة والمتابعة

1. النقاط1–9 مع5=A معتمدة ومحفوظة؛ لا قرار اسم طالب أو ملء scope audit في هذه الدفعة.
2. حُسم استثناء التوقعين المحددين أعلاه؛ لا قرار معلق بشأنهما. دفعة الترقية تعيدهما إلى `{}`. ينتظر الدمج الخامل CI كاملة والمراجع على بيانات اصطناعية، وينفذه المالك وحده؛ لا ترقية تلقائية.
3. استكمال إثبات صورة Supabase17.11/ICU والنسخة المستعادة، ثم تجهيز PR ترقية منفصلة وماركرها المراجع وحجز نافذة وفق [الدليل الجديد](RAD-062_M09_LAPTOP_RUNBOOK.md)؛ شاشة5ب بعد التطبيق والتحقق.
4. نص الإذن الحي المستقل لاحقًا: «أجيز نافذة تطبيق M09 الحية من اللابتوب على SHA المراجع، بعد اكتمال CI والبروفات والنسخة والاستعادة والقنوات، وفق دليل M09 وخطواته1–8 ومع PR الترقية والماركر المراجعين. أنا المالك أنفذ SQL والمتغير والدمج والهاتف؛ تبقى البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ لا شاشة5ب أو إطلاق ضمن هذا الإذن».
5. #196 لا تستأنف إلا في a dedicated TS7 batch؛ بقية متطلبات أول امتحان مستقلة، ولا إطلاق MCQ مؤقت.
