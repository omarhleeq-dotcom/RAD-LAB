# RAD-062 — تحضير ترقية M09، 2026-11-02

## 1 — الانحرافات والميزانية

استئناف [Draft #200](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/200) على `rad062/m09-promotion`؛ الإغلاق التوثيقي محفوظ فيcommit1 ثم تصحيح شروط النافذة فيcommit2؛ بلا دمج.
رفع المالك السقف من12 إلى15 وأجاز استثناء الحلقة التاريخية؛ **14/15** ملفًا، معلنة قبل التعديل؛ لا تجاوز أو وحدات مشتركة إضافية.
القائمة الدقيقة:

1. `scripts/pages/frontend-schema.json`
2. `scripts/docs/rad062-db-day.test.mjs`
3. `src/features/assess/rad062-name.test.ts`
4. `src/features/assess/rad062-freeze-foundation.test.ts`
5. `src/features/assess/rad062-lifecycle.test.ts`
6. `src/features/assess/rad062-manual-grading.test.ts`
7. `src/features/assess/rad062-erasure-operations.test.ts`
8. `src/features/assess/rad062-supervisor-catalogue.test.ts`
9. `docs/RAD-062_M09_LAPTOP_RUNBOOK.md`
10. `docs/DECISIONS.md`
11. `docs/project-status.md`
12. `docs/HANDOFF.md`
13. `docs/RAD-062_M09_PROMOTION_REPORT_2026-11-02.md`
14. `scripts/assess/rad062-m09-rehearsal.mjs` — استثناء SHA اللاحق وحده

## 2 — المنجز والمستبعد

Verified (GitHub): [#199](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/199) مدموجة في `3c887cb31f523f3a49128305da50dd433f8e6a0c`؛ [CI](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41404586717) و[Deploy](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41404586531) ناجحتان على رأس5739d8d.
Verified (owner-provided reviewer evidence, 2026-11-02): check3350/3350 في249ملفًا كمستخدم non-root، وكل M09 في embedded والصورة المثبتة Supabase17.11/ICU؛ أصلح المراجع teardown في5739d8d؛ ليست إعادة تشغيل هذه الدفعة.
سجلت [قرارات الاستئناف الخمسة](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02): سقف15؛ guardedFeatures.rad062 ثابتة؛ الحلقة التاريخية مع SHA مستقل؛ خطوات1–6 قبل الترقية؛ البروفة ثابتة عدا استثناء SHA اللاحق؛ توقعات الترقية الدقيقة فقط.
manifest: أضيفت M09 إلى required، أعيد deferred إلى{}، واستبدل check RAD-062 وحده؛ الباقي مطابق. لا M09 في guardedFeatures أو migrationSha256؛ حزمة يوم القاعدة8 ثابتة، واحتمال feature مستقل مؤجل لدفعة5ب.
runbook يحدد SHA الخامل للخطوات1–6 بما فيها بروفة3، وموضع Variable والدمج في7 قبل8. ACK/البديل RAD-059 والحقوق/الخصوصية/الموافقة RAD-085 تبقى شروط فتح البوابة فقط؛ لا شرط آخر مخفف.
لا SQL حي/Variable/بوابة/عامل/سر أو UI/5ب/dependency/نشر إضافي؛ #196 مؤجلة؛ SQL/checks/historical data ثابتة.

## 3 — المهمة وكل توقع متغير

RAD-062 تبقى in_progress؛ #200 مجهزة للتحقق والمراجعة وتنتظر حسم الحاجز أدناه ثم نافذة المالك؛ ليست منجزة أو مدموجة.
`done_when`: `M09 applied live in the owner window + promotion PR merged with the new marker + CI/Deploy green + owner phone check`.
في الجدول: M09=`20261102000100_rad062_supervisor_grading_authorization.sql`؛ H=`9152676e5975333e1bedaf453c7b7855d5f8e910df7d03dc1e64cdf78037dc0a`؛ القديم/الجديد مسارا check الكاملان `supabase/checks/rad062-ready.sql`/`supabase/checks/rad062-m09-ready.sql`.
الأرقام بعد التعديل؛ لا wildcard أو تأكيد محذوف؛ التفصيل **قبل → بعد**:

| file:line | قبل → بعد |
| --- | --- |
| `scripts/docs/rad062-db-day.test.mjs:90` | required للأساس+M01–M08 → القائمة نفسها+M09 |
| `scripts/docs/rad062-db-day.test.mjs:91` | deepEqual لإدخال M09 المؤجل بالاسم/H/reason/serverModules → deepEqual `{}` |
| `scripts/docs/rad062-db-day.test.mjs:92` | checks الدقيقة مع القديم → القائمة نفسها مع الجديد فقط |
| `scripts/docs/rad062-db-day.test.mjs:97` | حلقة بايتات current.requiredMigrations → base.requiredMigrations+base.guardedFeatures.rad062.migrations من023ec84؛ نفس جميع الملفات التاريخية والpackets/checks |
| `scripts/docs/rad062-db-day.test.mjs:101` | لا تأكيد M09 مستقل → SHA256 لبايتات M09 يساوي H حرفيًا؛ إضافة مع الحلقة كاملة |
| `src/features/assess/rad062-name.test.ts:36` | إدخال M09 المؤجل نفسه → `{}` |
| `src/features/assess/rad062-name.test.ts:38` | احتواء check القديم → الجديد |
| `src/features/assess/rad062-name.test.ts:48` | required للأساس+M01–M08/checks القديمة → القائمة نفسها+M09/check الجديد |
| `src/features/assess/rad062-freeze-foundation.test.ts:72` | required للأساس+M01–M08/checks القديمة → القائمة نفسها+M09/check الجديد |
| `src/features/assess/rad062-lifecycle.test.ts:257` | required للأساس+M01–M08/checks القديمة → القائمة نفسها+M09/check الجديد |
| `src/features/assess/rad062-manual-grading.test.ts:215` | required للأساس+M01–M08/checks القديمة → القائمة نفسها+M09/check الجديد |
| `src/features/assess/rad062-erasure-operations.test.ts:353` | required للأساس+M01–M08/checks القديمة → القائمة نفسها+M09/check الجديد |
| `src/features/assess/rad062-erasure-operations.test.ts:354` | احتواء check القديم → الجديد |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:64` | أساس التوقع origin/main المتحرك → SHA main الخامل3c887cb لتثبيت المقارنة بعد الدمج أيضًا |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:65` | required/checks مطابقتان للأساس → required نفسها+M09/checks نفسها مع الاستبدال الوحيد |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:66` | SHA المحسوب يطابق deferred entry → SHA بايتات M09 يساوي H المراجع حرفيًا |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:67` | marker القديم حرفيًا → marker الجديد حرفيًا أدناه |

## 4 — التغييرات المشتركة وScale

Verified (static): لا تغيير مشترك أو fixture أو برنامج يوم القاعدة؛ البروفة تغير lookup الخاص بـSHA وحده بالاستثناء اللاحق؛ لا تعميم جديد أو توسيع حزمة8. الماركر يحسب بايتات كل required migration ولو لم تنتم إلى frontend feature.
السقف15 خاص بهذه الدفعة؛ أضيف ملف البروفة بعد إعلان الاستثناء، وأي ملف إضافي يعلن قبل التعديل، وأي تأكيد يتجاوز استثناءات المالك يوقف التنفيذ. قرار feature لـM09 يخص دفعة5ب اللاحقة.

## 5 — الطبي والدرجات وسؤالا AGENTS

لا تغيير طبي أو حساب درجات أو حدود أو JSON/signature/ACL/FK أو امتحانات؛ لا إطلاق MCQ مؤقت.
هل تغير الحكم باختصاره؟ لا؛ قرارات المالك الجديدة موثقة صراحةً، وشروط فتح البوابة مستقلة محفوظة.
هل بقي رابط الدليل الأصلي؟ نعم: [التصميم §4.3/4.7](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md)، [الخادم](RAD-062_SUPERVISOR_GRADING_SERVER_REPORT_2026-11-02.md)، [P10](archive/reports/2026-10/RAD-062_P10_REPORT_2026-10-30.md)، و[سلطة القرار](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02).

## 6 — QA والماركران

Verified (`--print-marker` قبل وبعد، URL=`https://vlacestfruxooznrcjqc.supabase.co`، بلا اتصال حي):
القديم: `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`.
الجديد: `pilot-v1:868e3885959d076de1ee17a2e9d5de96dfb6f72c18b55a1d7830f0c4c8f261a8`.
Verified: اختبار promotion preserves المستهدف1/1؛ مجموعة توقعات manifest/marker/schema المستهدفة12/12 في7ملفات، مع استبعاد80حالة بواسطة مرشح الأسماء، وليست حزمة M09 كاملة.
Verified: فحص انتقال SHA المؤقت7/7: deferred/required الصحيحان يصلان لأول readiness؛ لا تصنيف/كلاهما/SHA مؤجل خاطئ/بايتات متغيرة في أي حالة تُرفض قبل SQL. لا إعداد اختبار كتالوج تغير أو git archive استُخدم.
Verified (إعادة نهائية بعد استثناء SHA، no skip): embedded60/60 وmarker1/1 ناجحة؛ Supabase60حالة setup-fail للصورة المفقودة،0حالة وصلت SQL؛ إجمالي61نجاح/60فشل. لم تعد حالة inspectM09 تفشل فيembedded.
Not run (env): سحب digest Supabase المثبت فشل بـ`failed to register layer: no space left on device`؛ لا تبديل صورة أو digest/مهلة.
Verified: إعداد PG18 المحلي نجح بعد نقل npm cache إلى/tmp؛ المحاولة الأولى أخفقت `ENOENT: no such file or directory, mkdir '/home/agent/.npm/_cacache'`؛ لا dependency متغيرة.
Verified (قبل استثناء SHA اللاحق، attempt, no skip): M09 بالنمطين121حالة: embedded59نجاح/1فشل inspectM09؛ Supabase0نجاح/60فشل setup بالصورة المفقودة؛ شاهد marker المستقل1نجاح؛ الإجمالي60نجاح/61فشل، وليس أخضر.
Not run (env; commands attempted, exit1): `npm run check` وbuild وbuild:pages توقف كل منها عند SWC قبل الفحص/البناء: `Failed to load native binding` و`SWC native addon: validate cache root /home/agent/.cache: cache root has a parent writable by another user without trusted sticky protection`؛ لا تجاوز لأمان cache؛ npm test شُغلت منفصلة كما يلي.
Verified (full npm test, no skip):3290نجاح/60فشل setup/0skip في249ملفًا،246خضراء و3محجوبة بالصورة المفقودة،637.59ثانية؛ جميع الإخفاقات Supabase، ولا نجاح لنمط الإنتاج من ذلك.
Verified (attempt): docs:test114نجاح/10فشل/0skip؛ ثلاثة إخفاقات مرتبطة بالترقية: بروفة M01–M08 وreadiness فيPG18/المحليتين؛ السبعة الباقية عوائق أدوات/صور البيئة.
Not run (env): بروفات الأدوات/الصور: `Required tool unavailable: psql (install the PostgreSQL client packages)`، `spawnSync age-keygen ENOENT`، وصورةpostgres17.11 المفقودة؛ لا تُحتسب نجاحًا.
Verified: lint للملفات المعدلة، docs:sync مرتان idempotent، docs:check بلا أخطاء مع أربعة تحذيرات ميزانية قائمة، status:check --require-previous وgit diff --check.
Verified:1659ملفًا متتبعًا خارج قائمة14 ثابتة SHA256 مقابل main، بما فيها112ملف supabase وكل packets والبيانات/goldens/characterisation وبرنامج يوم القاعدة؛ البروفة ثابتة عدا lookup المسمى؛ manifest بالضبط ثلاث تغييرات وguardedFeatures كاملة ثابتة؛ لا ملف تاريخي سقط من الحلقة.
Inferred (gate implementation/P10): deploy/schema gate لهذه الترقية **متوقع أن يفشل** مع PILOT_SCHEMA_VERIFIED القديم؛ لا تغيير Variable أو الحارس أو الماركر لمعالجة ذلك. هذا متوقع مستقل عن وجوب نجاح required check.
Not run (external): مراجعة/CI رأس الترقية ونافذة المالك والهاتف؛ لا subscribe/poll أو نشر إضافي.

## 7 — المفتوح ومحفزات STOP

حواجز السقف والحلقة التاريخية وguarded feature حُسمت بقرارات الاستئناف، وخطوات1–6 تبقى على SHA الخامل كما أمر المالك، مع استثناء SHA اللاحق محصورًا فيlookup واحد.
Verified (قبل استثناء SHA اللاحق، read-only diagnostic): اختبار الكتالوج يستدعي inspectM09 على manifest المرقّى؛ الاستدعاء يفشل قبل أي SQL: `Cannot read properties of undefined (reading 'sha256')`، queries=0، لأن البروفة تقرأ deferredMigrations[M09].sha256.
رفض المالك استثناء git archive؛ أجاز بدلًا منه تغيير lookup SHA وحده في inspectM09 بثابت H: deferred مع sha256=H أو required حصريًا، وبايتات الملف=H دائمًا؛ غير ذلك يرفض. fixture وإعداد اختبار الكتالوج وبقية تأكيداته ثابتة.
`file:line قبل→بعد`: scripts/assess/rad062-m09-rehearsal.mjs:22–26، مقارنة SHA الملف بإدخال deferred مباشرةً→ثابت H مع تصنيف حصري deferred/required والتحقق من SHA المؤجل إن وجد وبايتات الملف في الحالتين؛ readiness/anchors/rollback/counts/teardown ثابتة.
Verified (PG18 disposable before/after witness): rad062-p1-b-ready.sql كل صفوفه true قبلM09؛ بعدM09 يفشل `functions` وحده، بينما rad062-m09-ready.sql كله true. يبصم predecessor check دوال assess كلها، وما زال required وفق manifest المأذون؛ ليس عائق بيئة أو mismatch Variable المتوقع.
Verified (docs:test): rad062-restore-rehearsal.mjs:80 يتوقع فشل rad085-p1-b-ready وحده قبلM01، لكنه يرى rad062-m09-ready أيضًا من manifest المرقّى؛ إصلاح مدخل هذه البروفة خارج الإذن الحالي.
أي SQL/check/packet أو تغيير توقع آخر أو gate/Variable أو تجاوز15: STOP. النجاح السابق للمراجع لا يغطي رأس الترقية؛ لا وصف check بالخضراء قبل الدليل.

## 8 — قائمة المالك الموحدة والنافذة اللاحقة

1. راجع قرارات الاستئناف واحسم حاجز predecessor readiness وبروفة M01–M08 وQA/required CI والمراجعة قبل حجز النافذة؛ تبقى Draft #200 نفسها، بلا ready/merge آلي.
2. راجع SHA ما قبل الترقية `3c887cb31f523f3a49128305da50dd433f8e6a0c` وبصمة M09=H وCI والبروفات والنسخ/الاستعادة وسائر شروط [الدليل](RAD-062_M09_LAPTOP_RUNBOOK.md).
3. [RAD-059 ACK/البديل](RAD-059_PHONE_RUNBOOK.md) والحقوق/الخصوصية/الموافقة RAD-085 باقية قبل فتح البوابة، لا قبل نافذة M09؛ لا شرط آخر مخفف.
4. بعد إذن حي مستقل: نفذ1–6 كلها على SHA main الخامل؛ لا checkout لرأس الترقية قبل بروفة3. تحقق5 ثم احتواء6؛ في7 افتح GitHub repository Settings → Secrets and variables → Actions → Variables، وضع marker الجديد أعلاه حرفيًا في `PILOT_SCHEMA_VERIFIED`، ثم ادمج #200 في النافذة نفسها قبل8.
5. في8 تحقق من CI/Deploy للدمج والهاتف؛ البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ شاشة5ب وفتح البوابة لاحقًا بشروطهما.
6. نص الإذن المنفصل، غير صادر هنا: «أجيز نافذة تطبيق M09 الحية من اللابتوب على SHA المراجع، بعد اكتمال CI والبروفات والنسخة والاستعادة وسائر شروط دليل M09 المعدلة بالقرار2026-11-02، ومع PR الترقية والماركر المراجعين. أنا المالك أنفذ SQL والمتغير والدمج والهاتف؛ تبقى البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ لا شاشة5ب أو إطلاق ضمن هذا الإذن».
