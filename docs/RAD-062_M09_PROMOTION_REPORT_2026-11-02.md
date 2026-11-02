# RAD-062 — تحضير ترقية M09، 2026-11-02

## 1 — الانحرافات والميزانية

[Draft #200](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/200) على `rad062/m09-promotion`؛ commit1 أغلق الخادم توثيقيًا، ثم صُححت شروط النافذة؛ لم يحدث دمج أو عمل حي.
رفع المالك السقف12→15→17؛ القائمة المعلنة **16/17** ملفًا؛ استثناء SQL يضيف check واحدًا فقط ولا يحرر أي SQL قائم:

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
14. `scripts/assess/rad062-m09-rehearsal.mjs`
15. `supabase/checks/rad062-p1-b-m09-ready.sql`
16. `scripts/assess/rad062-restore-rehearsal.mjs`

## 2 — المنجز والمستبعد

Verified (GitHub): [#199](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/199) مدموجة في `3c887cb31f523f3a49128305da50dd433f8e6a0c`؛ [CI](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41404586717) و[Deploy](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41404586531) ناجحتان على5739d8d.
Verified (owner-provided reviewer evidence): تدقيق2026-11-02: check3350/3350 في249ملفًا كمستخدم non-root، وكل M09 في embedded وSupabase17.11/ICU المثبتة؛ إصلاح teardown في5739d8d؛ ليس دليل رأس الترقية.
[قرارات المالك المتراكمة](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02): required+=M09 وdeferred={}؛ المساران الجديدان فقط بدل القديمين في checks وبالموضعين نفسيهما؛ guardedFeatures.rad062 كاملة وحزمة8 ثابتة.
الاستثناءات: حلقة بايتات023ec84 كاملة مع SHA مستقل لـM09؛ inspectM09 يقبل deferred/required حصريًا مع SHA مراجع ثابت؛ لا git archive أو تغيير إعداد اختبار الكتالوج.
حُسم حاجزا predecessor readiness والبروفة القديمة: check خلف جديد ببصمة functions فقط، وM08_CHECKS حرفية من main قبل الترقية؛ بقية البروفة ثابتة.
الدليل1–6 على SHA الخامل؛2 بالفحوص القديمة،5 بالجديدين وبقية required،7 للمتغير والدمج قبل8؛ توافر commit الترقية وSHA256 لملفB9 يتحقق في1 قبل SQL، ثم يستخرج B9 من Git إلى مجلد الأدلة المحمي في5 دون تغيير checkout. ACK/البديل RAD-059 وحقوق/خصوصية/موافقة RAD-085 شروط فتح البوابة فقط؛ لا شرط آخر مخفف.
لا SQL حي أو Variable أو بوابة/عامل/سر أو UI/5ب أو dependency/نشر إضافي؛ #196 مؤجلة؛ كل migration وSQL القائم وحزمتي الهاتف والبيانات/goldens/characterisation ثابتة.

## 3 — المهمة وكل توقع متغير

RAD-062 تبقى in_progress/reviewer؛ #200 مجهزة وتنتظر CI والمراجعة ثم نافذة المالك؛ ليست منجزة أو مدموجة.
`done_when`: `M09 applied live in the owner window + promotion PR merged with the new marker + CI/Deploy green + owner phone check`.
الرموز للجدول فقط: M09=`20261102000100_rad062_supervisor_grading_authorization.sql`، H=`9152676e5975333e1bedaf453c7b7855d5f8e910df7d03dc1e64cdf78037dc0a`.
R=`supabase/checks/rad062-ready.sql`، B=`supabase/checks/rad062-p1-b-ready.sql`؛ R9/B9 هما `rad062-m09-ready.sql`/`rad062-p1-b-m09-ready.sql` في الدليل نفسه. الأرقام بعد التعديل، والفرق تراكمي من main:

| file:line | قبل → بعد |
| --- | --- |
| `scripts/docs/rad062-db-day.test.mjs:90` | required للأساس+M01–M08 → نفسها+M09 |
| `scripts/docs/rad062-db-day.test.mjs:91` | إدخال M09 المؤجل بالاسم/H/reason/serverModules → deepEqual `{}` |
| `scripts/docs/rad062-db-day.test.mjs:92` | checks الدقيقة مع B/R → نفسها مع B9/R9 بالموضعين نفسيهما |
| `scripts/docs/rad062-db-day.test.mjs:97` | حلقة current.requiredMigrations → base.requiredMigrations+base.guardedFeatures.rad062.migrations من023ec84؛ كل packets/checks والملفات التاريخية باقية |
| `scripts/docs/rad062-db-day.test.mjs:101` | لا تأكيد M09 مستقل → SHA256 بايتات M09 يساوي H حرفيًا مع الحلقة كاملة |
| `scripts/docs/rad062-db-day.test.mjs:179` | فحصا رفض grant بعد الترقية R/B → R9/B9؛ نفس assert.rejects |
| `scripts/docs/rad062-db-day.test.mjs:184` | readiness بعد الترقية R → R9؛ كل تأكيدات relations/NOT NULL/rollback نفسها |
| `src/features/assess/rad062-name.test.ts:36` | إدخال M09 المؤجل نفسه → `{}` |
| `src/features/assess/rad062-name.test.ts:37` | احتواء B → B9 |
| `src/features/assess/rad062-name.test.ts:38` | احتواء R → R9 |
| `src/features/assess/rad062-name.test.ts:48` | required للأساس+M01–M08/checks القديمة → نفسها+M09 وB9/R9 |
| `src/features/assess/rad062-freeze-foundation.test.ts:72` | required للأساس+M01–M08/checks القديمة → نفسها+M09 وB9/R9 |
| `src/features/assess/rad062-lifecycle.test.ts:257` | required للأساس+M01–M08/checks القديمة → نفسها+M09 وB9/R9 |
| `src/features/assess/rad062-manual-grading.test.ts:215` | required للأساس+M01–M08/checks القديمة → نفسها+M09 وB9/R9 |
| `src/features/assess/rad062-erasure-operations.test.ts:353` | required للأساس+M01–M08/checks القديمة → نفسها+M09 وB9/R9 |
| `src/features/assess/rad062-erasure-operations.test.ts:354` | احتواء R → R9 |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:64` | أساس التوقع origin/main المتحرك → SHA main الخامل3c887cb لتثبيت المقارنة بعد الدمج |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:65` | required/checks مطابقتان للأساس → required نفسها+M09/checks نفسها مع B9/R9 |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:66` | SHA المحسوب يطابق deferred entry → SHA بايتات M09 يساوي H حرفيًا |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:67` | marker القديم حرفيًا → marker النهائي أدناه |

التغيير البرمجي المسمى: `scripts/assess/rad062-m09-rehearsal.mjs:22–26`، lookup المؤجل→ثابت H وتصنيف حصري deferred/required وبايتات=H؛ لا تغيير readiness/anchors/rollback/counts/teardown.
استثناء البروفة: `scripts/assess/rad062-restore-rehearsal.mjs:14` إضافة M08_CHECKS حرفية من checks في main3c887cb؛ عند64 و152 بدل manifest().checks في الموضعين الأصليين51/139 فقط؛ بقية الملف مطابق، بما فيه تأكيداته.

## 4 — التغييرات المشتركة وScale وفرق SQL الحرفي

Verified (clean PG18.4 apply): current-schema وM01–M09،32migration؛ مقارنة أصناف inventory التسعة بالقديم: functions وحدها تختلف، وعددها131؛ بقية الأنواع/الأعداد/البصمات مطابقة.
الأمر: `diff -u --label supabase/checks/rad062-p1-b-ready.sql --label supabase/checks/rad062-p1-b-m09-ready.sql supabase/checks/rad062-p1-b-ready.sql supabase/checks/rad062-p1-b-m09-ready.sql`؛ خرج1 لأن الفرق التالي فقط موجود، وهذه مخرجاته الحرفية:

```diff
--- supabase/checks/rad062-p1-b-ready.sql
+++ supabase/checks/rad062-p1-b-m09-ready.sql
@@ -1,4 +1,4 @@
--- RAD-062 P10 required successor: complete reviewed B + M01-M08 catalogue.
+-- RAD-062 M09 required successor: complete reviewed B + M01-M09 catalogue.
 -- Derived from the unchanged migration bytes on isolated PostgreSQL, never live.
 -- ACLs normalize NULL/default, order and grantor only; all effective grants,
 -- bodies, owners, attributes, policies and unexpected additions remain checked.
@@ -40,7 +40,7 @@
  ('columns',260,'2a4f62c65b0ef5f74e3b59ddb5f29ff4ca6dc9d2d5f7779d075c688573aeadeb'),
  ('constraints',221,'a7c1a48b2d68ec92fdbf2719940332283a76158c0fd2541f9b0606dd5c614261'),
  ('effective_privileges',84,'e7f712f682fc23bbba49a72220cbf1c45d8f4d1a5a1f0d57e79a4d998f2394be'),
- ('functions',131,'a2ad4d3e206656830910ea18969d57711b58a8c7c725dcbca6efea6d8fce1ad7'),
+ ('functions',131,'a78a6494b28984e1f947674f84b8dc3c8933a7b9919b428267e79d4e41442bac'),
  ('indexes',88,'4d7c2c8842e8c02f1e16556f4ba6748e5e7a971104452d363e0803c10a9a4509'),
  ('policies',3,'4c0eeccc70b84b81aa2070ede181507ad8c31f81b79e20f49fb7b49efa00fc78'),
  ('relations',50,'c74ea4a32105af8cd1c911bfff00fd4f32daa4665c64b60bfc345943a3c60c13'),
```

لا تعميم أو توسيع لحزمة8؛ قرار feature مستقل لـM09 مؤجل لدفعة5ب؛ سقف17 خاص بهذه الدفعة ولا يجيز أي SQL آخر أو تخفيف تأكيد.

## 5 — الطبي والدرجات وسؤالا AGENTS

لا تغيير طبي أو حساب/حدود درجات أو JSON/signature/ACL/FK أو امتحانات؛ لا تشغيل MCQ مؤقت.
هل تغير الحكم باختصاره؟ لا؛ استثناءات المالك الجديدة موثقة صراحةً دون تغيير حكم أقدم أو إسقاط شرط تشغيل.
هل بقي رابط الدليل الأصلي؟ نعم: [التصميم §4.3/4.7](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md)، [الخادم](RAD-062_SUPERVISOR_GRADING_SERVER_REPORT_2026-11-02.md)، [P10](archive/reports/2026-10/RAD-062_P10_REPORT_2026-10-30.md)، و[القرار](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02).

## 6 — QA والماركرات

Verified (`--print-marker`، URL=`https://vlacestfruxooznrcjqc.supabase.co`، offline): القديم قبل الترقية `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`.
الوسيط المطبوع في8754e7b: `pilot-v1:868e3885959d076de1ee17a2e9d5de96dfb6f72c18b55a1d7830f0c4c8f261a8`؛ النهائي بعد B9: `pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`.
Verified: جميع required checks العشرة بعدM09 ناجحة علىPG18 محلي نظيف؛ docs:test117نجاح/7فشل بيئي/0skip؛ بروفة M01–M08 بالاستعادة والأقفال وrollback ناجحة، وfull-apply/checks في C وen_US.UTF-8 ناجحان.
Verified: توقعات الترقية المستهدفة18/18 في6ملفات؛ مرشح الأسماء استبعد57حالة، فلا تُعد حزمة كاملة. حلقة بايتات023ec84 وSHA المستقل ناجحتان ضمن docs:test؛ لا wildcard أو تأكيد محذوف.
Not run (env): بروفات psql/age وصور17.11: `Required tool unavailable: psql (install the PostgreSQL client packages)` و`spawnSync age-keygen ENOENT` و`No such image` لصورةpostgres17.11 المثبتة؛ المراجع يكملها.
Not run (env; attempted, exit1): `npm run check` وbuild وbuild:pages توقفت عند `Failed to load native binding` ثم `SWC native addon: validate cache root /home/agent/.cache: cache root has a parent writable by another user without trusted sticky protection`؛ لا نجاح check أو build ولا تجاوز أمان cache.
Verified: صياغة bash لكل كتل الدليل الخمس اجتازت bash -n؛ lint بلا أخطاء؛ تحذير manifest غير المستخدم في بروفة M08 لأن الاستثناء لا يجيز تغيير import؛ لا تعديل ثالث للبروفة.
Verified (M09 repeat, no skip): embedded60/60 وmarker1/1 ناجحة؛ Supabase0نجاح/60فشل setup قبل SQL؛ الإجمالي61نجاح/60فشل في3ملفات، وليس أخضر.
Not run (env): M09/Supabase17.11/ICU: `No such image: supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d`؛ محاولة السحب السابقة أخفقت `failed to register layer: no space left on device`؛ لا تبديل digest/مهلة.
Verified: docs:sync مرتان بلا تغيير، docs:check بلا أخطاء وخمسة تحذيرات ميزانية للمراجعة، status:check --require-previous وgit diff --check؛ هذا التقرير≤150سطرًا.
Verified:1658ملفًا متتبعًا خارج القائمة ثابتة SHA256 مقابل main، منها كل112ملف supabase القائم وكل packets والبيانات/goldens/characterisation؛ الإضافة SQL الوحيدة B9؛ manifest بالضبط الترقية والاستبدالان وباقي entries/guardedFeatures ثابتة.
Verified: M08_CHECKS تطابق checks في main3c887cb حرفيًا بالقيم والترتيب؛ إعادة الملف بحذف الثابت/تعليقه ورد lookup في الموضعين تطابق بايتات الأصل؛ فرق B9 أعلاه حرفي وفقط سطران؛ الحلقة التاريخية لم تفقد ملفًا.
Verified (دليل8754e7b السابق فقط): full npm test3290نجاح/60setup-fail/0skip في249ملفًا، وكل الفشل Supabase؛ لا ينسب هذا التشغيل إلى المتابعة الجديدة. شاهد تصنيف SHA7/7 سابق باقٍ دون تعديل.
Inferred (P10/gate): deploy/schema gate **متوقع أن يفشل** مع PILOT_SCHEMA_VERIFIED القديم؛ لا تغيير Variable أو gate أو marker لمعالجته؛ required check يجب أن ينجح قبل النافذة.
Not run (external): CI/مراجعة الرأس الجديد، النافذة الحية والهاتف؛ لا subscribe/poll أو نشر إضافي.

## 7 — المفتوح ومحفزات STOP

حواجز الكود السابقة حُسمت بالاستثناءين المحددين والتحقق المحلي؛ الباقي CI/المراجع وصورة17.11/ICU والنسخ/الاستعادة وأدلة النافذة.
لا تشغّل R أو B على كتالوجM09؛ يبقيان ثابتين لفحص ما قبل التطبيق. step5 يستخدم R9/B9 وبقية القائمة، وstep2 يحتفظ بالقديمين.
STOP عند أي فرق آخر في SQL الجديد/عدد131، أو تعديل SQL قائم/packet/توقع خارج القيم المأذونة، أو gate/Variable أو تجاوز17؛ لا تخفيف مهلة أو اختبار أو assertion.

## 8 — قائمة المالك الموحدة والنافذة اللاحقة

1. راجع فرق SQL والقائمة المثبتة ونتائج QA، وأكمل required CI والمراجعة وإثباتSupabase17.11/ICU والنسخة المستعادة؛ تبقى Draft #200 نفسها بلا ready/merge آلي.
2. تأكد أن commit رأس الترقية المراجع متاح محليًا وأن artifact B9 يطابق SHA256 المثبت في الدليل قبل التطبيق؛ راجع SHA ما قبل الترقية `3c887cb31f523f3a49128305da50dd433f8e6a0c` وبصمةM09=H؛ نفذ خطوات1–6 كلها على هذا المصدر الخامل، بما فيها بروفة3؛ لا checkout لرأس الترقية قبلها.
3. [RAD-059 ACK/البديل](RAD-059_PHONE_RUNBOOK.md) وحقوق/خصوصية/موافقة RAD-085 شروط فتح البوابة؛ بقية شروط النافذة ثابتة؛ لا شاشة5ب أو إطلاق ضمن هذه الدفعة.
4. بعد إذن حي مستقل: تحقق5 بالجديدين وبقية checks ثم احتواء6؛ في7 ضع marker النهائي أعلاه حرفيًا في GitHub repository Settings → Secrets and variables → Actions → Variables → `PILOT_SCHEMA_VERIFIED`، ثم ادمج #200 في النافذة نفسها قبل8.
5. في8 تحقق من CI/Deploy للدمج والهاتف؛ تبقى البوابة مغلقة والعامل NOLOGIN والسر DISABLED حتى كل متطلبات التشغيل اللاحقة.
6. نص الإذن المنفصل، غير صادر هنا: «أجيز نافذة تطبيق M09 الحية من اللابتوب على SHA المراجع، بعد اكتمال CI والبروفات والنسخة والاستعادة وسائر شروط دليل M09 المعدلة بقرارات2026-11-02، ومع PR الترقية والماركر المراجعين. أنا المالك أنفذ SQL والمتغير والدمج والهاتف؛ تبقى البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ لا شاشة5ب أو إطلاق ضمن هذا الإذن».
