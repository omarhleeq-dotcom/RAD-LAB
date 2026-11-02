# RAD-062 — تفويض تصحيح المشرف M09، 2026-11-02

## 1 — الانحرافات والميزانية

تنفيذ خادمي خامل وفق [التصميم المعتمد، القسم4 كاملًا](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md) و[قرار المالك](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02).
Verified: #198 مدموجة عبر GitHub؛ الفرع `rad062/supervisor-grading-server` من main المحدث؛ commit الأول توثيقي للموافقة1–9 و5=A وشرط الإتمام.
أُعلنت12ملفًا ثم إضافة بروفة اللابتوب بالاسم قبل تحريرها: **13/22**، بلا استثناء اختبار قائم أو dependency أو workflow.
القائمة: DECISIONS/project-status/HANDOFF، هذا التقرير، [الدليل](RAD-062_M09_LAPTOP_RUNBOOK.md)، [M09](../supabase/migrations/20261102000100_rad062_supervisor_grading_authorization.sql)، [check الجديد](../supabase/checks/rad062-m09-ready.sql)، [fixture](../src/features/assess/rad062-m09-fixture.ts)، اختبارات [التفويض](../src/features/assess/rad062-supervisor-grading.test.ts)/[الأقفال](../src/features/assess/rad062-supervisor-locks.test.ts)/[الكتالوج](../src/features/assess/rad062-supervisor-catalogue.test.ts)، [البروفة](../scripts/assess/rad062-m09-rehearsal.mjs)، و[manifest](../scripts/pages/frontend-schema.json).
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
Verified: [Draft #199](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/199) واحدة فقط؛ لا ready/merge/auto-merge أو subscribe/poll؛ CI المرجع النهائي، ولا ادعاء جاهزية حية من هذا التنفيذ.

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

Verified: PostgreSQL18 الحقيقي أثبت60حالة M09 محلية، وفحص manifest/marker مستقلًا؛ التشغيل الكامل للنمطين121اختبارًا. نمطSupabase60حالة فشل بسبب الصورة المفقودة بلا skip. أُصلحت موافقة Assess في fixture صف paging، وأُثبتت منفردة.
Verified: فحص الأقفال النهائي25/25؛ تُسلح نافذة500ms بعد شاهد انتظار profile، ويُجهز مسار commit تحت savepoint تتراجع كل آثاره قبل التسليح؛ لا تغيير لأي مهلة أو تقليل لأي تأكيد.
Verified: byte proof لكل205ملفات محمية من main، بما فيها كل SQL/checks القديمة وmanual/fixtures وحزمتا الهاتف وبيانات/اختبارات QA؛ لا تغيّر توقع قائم أو golden/characterisation.
Verified: الماركر قبل وبعد التعديل `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`؛ بلا تغيير متغير أو اتصال حي.
Verified: npm ci وإعداد PostgreSQL المثبت وnpm audit --audit-level=high؛16تنبيهًا متوسطًا قائمًا، بلا إصلاح dependency خارج النطاق.
Verified: فحوص CI PostgreSQL للطوارئ/الأقفال/الاسترداد/connection-probe:39/39؛ secret-uploader Python:8/8، دون skip.
Verified: حراس displayed-text/session-account/schema/supervisor-review الخصوصية:71/71 في11ملفًا بلا تغيير.
Verified: typecheck وlint بلا خطأ جديد؛ تحذيرا lint سابقان فقط؛ build وbuild:pages نجحا مرة لكل منهما دون نشر، وdocs:sync مرتان idempotent وdocs:check وstatus:check --require-previous وdiff --check خضراء.
Verified: إعادة معزولة لاختبارات manual-grading11 والخدمة7 وlifecycle19 وtrial14:51/51 خضراء بالمهلات الأصلية. مهلات5000/20000ms في التشغيل المتزامن باقية دليلًا تاريخيًا، لا نجاحًا مخفيًا.
Not run (env): تثبيت age/PG16 تعذر: `sudo: command not found` ثم apt `Acquire (13: Permission denied)`؛ توثيق الاستعادة لا يعوض تشغيلها.
Not run (env): نمطM09/Supabase17 والبروفات المطابقة وlocale matrix؛ صورة Supabase وصورةpostgres17.11 كلتاهما فشلتا عند تسجيل layer بمساحة القرص. Worker rehearsal توقف عند postgres-container مع cleanup=true.
Verified: npm run check شُغّلت كاملة:3283pass/67fail/0skip؛ تضمنت عوائق الصورة/التوقع القديم ومهلات وشاهدَي SHA/fixture أُصلحا وفُحصا لاحقًا؛ ليست خضراء.
Verified: docs:test شُغّلت:115pass/9fail/0skip؛ عائق manifest أدناه غير بيئي، والبقية age-keygen/psql/PG16 أو صور Docker المفقودة؛ ليست خضراء.
Inferred: توافق صورة الإنتاج والنسخة الحقيقية يحتاج بروفة المالك وCI؛ لا نتائج سريرية أو تشغيل حقيقي أو فحص هاتف تصحيح في هذه الدفعة.

## 7 — المفتوح ومحفزات STOP

Verified: عائق غير بيئي: [scripts/docs/rad062-db-day.test.mjs:91](../scripts/docs/rad062-db-day.test.mjs) و[src/features/assess/rad062-name.test.ts:36](../src/features/assess/rad062-name.test.ts) يفرضان deferredMigrations={}، ويتعارض مع إضافة M09 المؤجلة. التوقعان والملفان ثابتان؛ لا التفاف أو تعديل دون استثناء مالك مسمى، ولا ادعاء docs:test خضراء.

أي فشل CI غير بيئي يحتاج إصلاحًا في Draft نفسها؛ فشل البيئة هنا لا يرفع شرط Supabase17/ICU أو يخفف مهلة/حارس/اختبار؛ المراجع يشغل الحزمة كاملة قبل الدمج.
STOP عند أي drift/ACL/FK/anchor أو packet أو marker أو توقع قديم متغير، أو حاجة توقيع/JSON/grant/table، أو تبعية جديدة أو تجاوز22؛ حزم الهاتف وlive خارج التعديل.
لا ادعاء نجاح نسخة مشفرة مستعادة أو بيئة الإنتاج حتى إثباتها؛ شروط القنوات/ACK/البديل والحقوق/الخصوصية/الموافقة والنسخ المستقلة تبقى قبل التشغيل.

## 8 — قائمة قرارات المالك الموحدة والمتابعة

1. النقاط1–9 مع5=A معتمدة ومحفوظة؛ لا قرار اسم طالب أو ملء scope audit في هذه الدفعة.
2. قرار مطلوب: استثناء مسمى لتوقع deferredMigrations الفارغة في scripts/docs/rad062-db-day.test.mjs:91 وsrc/features/assess/rad062-name.test.ts:36، ليقبلا M09 المؤجلة وحدها ببصمتها المراجعة مع بقاء بقية الحراس؛ ممنوع تنفيذه بالإذن الحالي. ثم مراجعة Draft وCI كاملة والمراجع على بيانات اصطناعية، ثم المالك وحده يدمجها خاملة؛ لا ترقية تلقائية.
3. استكمال إثبات صورة Supabase17.11/ICU والنسخة المستعادة، ثم تجهيز PR ترقية منفصلة وماركرها المراجع وحجز نافذة وفق [الدليل الجديد](RAD-062_M09_LAPTOP_RUNBOOK.md)؛ شاشة5ب بعد التطبيق والتحقق.
4. نص الإذن الحي المستقل لاحقًا: «أجيز نافذة تطبيق M09 الحية من اللابتوب على SHA المراجع، بعد اكتمال CI والبروفات والنسخة والاستعادة والقنوات، وفق دليل M09 وخطواته1–8 ومع PR الترقية والماركر المراجعين. أنا المالك أنفذ SQL والمتغير والدمج والهاتف؛ تبقى البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ لا شاشة5ب أو إطلاق ضمن هذا الإذن».
5. #196 لا تستأنف إلا في a dedicated TS7 batch؛ بقية متطلبات أول امتحان مستقلة، ولا إطلاق MCQ مؤقت.
