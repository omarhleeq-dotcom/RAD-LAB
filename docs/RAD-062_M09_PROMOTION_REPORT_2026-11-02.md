# RAD-062 — ترقية M09 وتوحيد فحوص M08، 2026-11-02
## 1 — الانحرافات والميزانية
[Draft #200](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/200)؛ الإغلاق التوثيقي للخادم محفوظ فيcommit1؛ سقف المالك19، الفعلي **18/19**؛ التشخيص ليس ملفًا متغيرًا.
القائمة الدقيقة بالمجلدات: `scripts/assess/`: rad062-db-day.mjs، rad062-laptop-rehearsal.mjs، rad062-restore-rehearsal.mjs، rad062-m09-rehearsal.mjs.
`scripts/pages/frontend-schema.json`، `scripts/docs/rad062-db-day.test.mjs`، `supabase/checks/rad062-p1-b-m09-ready.sql`.
`src/features/assess/`: rad062-name.test.ts، rad062-freeze-foundation.test.ts، rad062-lifecycle.test.ts، rad062-manual-grading.test.ts، rad062-erasure-operations.test.ts، rad062-supervisor-catalogue.test.ts.
`docs/`: DECISIONS.md، project-status.md، HANDOFF.md، RAD-062_M09_LAPTOP_RUNBOOK.md، RAD-062_M09_PROMOTION_REPORT_2026-11-02.md.
## 2 — المنجز والمستبعد
Verified (GitHub/owner): [#199](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/199) مدموجة في3c887cb، و[CI](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41404586717)/[Deploy](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41404586531) على5739d8d خضراوان؛ تدقيق الخادم3350/3350 بالنمطين non-root بإفادة المالك.
Verified (owner-forwarded reviewer, a31e46b vs main3c887cb): check3350/3350 والبناءان وdocs:test142/142 والطوارئ/الأقفال/الاسترداد/probe/uploader ناجحة non-root بالصور المثبتة؛ لكن CI الكاملة **فاشلة** عند owner rehearsal/check_05؛ هذا ليس إغلاقًا للترقية.
سبب المراجع: laptop يطبقM01–M08 ثم يقرأ check M09 الخامس؛ catalogue يستدعي المسار نفسه، وفشله البيئي علىmain أيضًا لا يثبت إصلاحه هنا. الثابت المصدّر الواحد يعزل هذين المسارين وrestore فقط؛ لا تغيير مراحل/تعدادات/teardown/توقعات.
[تصحيح المالك](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02): readiness-diagnostic هو latest+manifest، فيبقى مطابقًا لـmain؛ رُفض استثناء مدخله. لا SQL حي/Variable/بوابة/عامل/سر/UI/5ب/dependency/نشر إضافي؛ #196 مؤجلة.
## 3 — المهمة والتوقعات الدقيقة
RAD-062 تبقى in_progress/reviewer؛ تنتظر إعادة CI الكاملة ثم نافذة المالك. done_when: `M09 applied live in the owner window + promotion PR merged with the new marker + CI/Deploy green + owner phone check`.
الرموز: M09=`20261102000100_rad062_supervisor_grading_authorization.sql`، H=`9152676e5975333e1bedaf453c7b7855d5f8e910df7d03dc1e64cdf78037dc0a`؛ R/B هما rad062-ready.sql/rad062-p1-b-ready.sql فيsupabase/checks؛ R9/B9 هما rad062-m09-ready.sql/rad062-p1-b-m09-ready.sql.
كل فرق توقع تراكمي منmain أدناه؛ **لم يتغير أي اختبار أو توقع عنa31e46b في هذه المتابعة**:
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
الاستثناءات البرمجية: inspectM09:22–26 lookup المؤجل→ثابتH وتصنيف حصري وبايتات=H؛ بقية البروفة ثابتة. M08_CHECKS انتقل من restore إلى db-day:10 بلا تغيير القائمة/تعليقها؛ restore:51,139 وlaptop:77 تستورد الثابت؛ default db-day:96 باقٍ علىmanifest.
## 4 — تدقيق كل المستهلكين وScale والفرق الحرفي
Verified (source audit): بحث properties/aliases المطلوبة في scripts وsrc، مع تتبع استيراد frontend-schema وmanifest؛ حقول checks للتقييم/تقارير الأمن ليست عقد frontend. فئة historical تشمل شواهد B الأقدم المثبتة أصلًا؛ لا تُحوّلها إلى M08 أو تغير توقعاتها.
- `scripts/assess/build-worker.mjs:24` → current/live (manifest): حزمة العامل تبصم كل required الحالي.
- `scripts/assess/local-database.mjs:90` → current/live (manifest): through:'latest' يطبق required كله؛ السقوف التاريخية الأخرى ثابتة أصلًا.
- `scripts/assess/rad062-db-day.mjs:10` → historical M01–M08 (frozen): التعريف المصدّر الوحيد مطابق لقائمة main3c887cb.
- `scripts/assess/rad062-db-day.mjs:96` → current/live (manifest): default checks() يبقى manifest().checks بلا تغيير.
- `scripts/assess/rad062-laptop-rehearsal.mjs:77` → historical M01–M08 (frozen): يطبق ثماني ترحيلات فقط؛ القائمة الموحدة تمنع check_05 الجديد.
- `scripts/assess/rad062-m09-rehearsal.mjs:24` → current/live (manifest): يصنف M09 مؤجلة/مطلوبة مع SHA المراجع؛ لا اختيار فحوص تاريخية.
- `scripts/assess/rad062-readiness-diagnostic.mjs:59` → current/live (manifest): through:'latest' + manifest().checks؛ مطابق لبايتات main بقرار المالك المصحح.
- `scripts/assess/rad062-restore-rehearsal.mjs:51,139` → historical M01–M08 (frozen): مسارا ما قبلM01/بعدM08؛ استيراد واحد بدل النسخة المحلية.
- `scripts/assess/rad085-worker-rehearsal.mjs:209` → current/live (manifest): يطبق كل required ويقارنه بحزمة العامل الحالية.
- `scripts/assess/staging-preflight.mjs:29,30` → current/live (manifest): يبصم سلسلة النشر الحالية وفحوصها.
- `scripts/docs/assess-staging-preflight.test.mjs:15` → current/live (manifest): يفحص ناتج التحضير الحالي، وليس checks تاريخية.
- `scripts/docs/rad062-db-day.test.mjs:90,92,96,97,178,194,206` → current/live (manifest): عقد الترقية/كل required؛96–97 تقارن بايتات023ec84 فقط دون SQL تاريخي علىM09.
- `scripts/pages/frontend-schema.json:4,38` → current/live (manifest): مصدر عقد التشغيل الحالي؛ لا تغيير في هذه المتابعة.
- `scripts/pages/pilot-schema-gate.mjs:70,74,177,178,179,223,232,233` → current/live (manifest): تصنيف/حواجز/بصمة المتطلبات الحالية كاملة.
- `scripts/qa/rad085-d3-routes-audit.mjs:134` → current/live (manifest): نسخة متطلبات واجهة حالية، لا بروفةM08.
- `scripts/qa/rad085-p1-routes-audit.mjs:138` → current/live (manifest): اختبار ترقية guard في نسخة العقد الحالي.
- `src/features/assess/rad062-authoring-limits.test.ts:30` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/assess/rad062-erasure-operations.test.ts:353,354,357,363,364` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/assess/rad062-freeze-foundation.test.ts:66,72,73,78,79` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/assess/rad062-lifecycle.test.ts:257,260,265,266` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/assess/rad062-manual-grading.test.ts:215,218,224,225` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/assess/rad062-name.test.ts:15,16,18,37,38,39,41,48,50,52,53,102` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/assess/rad062-provenance.test.ts:50` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/assess/rad062-random-pool.test.ts:56` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/assess/rad062-supervisor-catalogue.test.ts:65` → current/live (manifest): يثبت متطلبات/بصمة الترقية الحالية؛ قراءة base للمقارنة التاريخية بالبايتات لا لتنفيذ checks.
- `src/features/deployment/assess-d-schema.test.ts:15` → historical M01–M08 (frozen): fixture B مثبتة أصلًا بآلية historical-migrations-setup.
- `src/features/deployment/assess-e-schema.test.ts:15,18` → historical M01–M08 (frozen): fixture B وماركرها القديم؛ لا تنفيذ علىM09.
- `src/features/deployment/assess-f-schema.test.ts:11` → historical M01–M08 (frozen): fixture B مثبتة؛ لا تعديل توقعات أو قائمة.
- `src/features/deployment/c2-deferred-schema.test.ts:11,12` → historical M01–M08 (frozen): fixture B ثابتة موجودة مسبقًا.
- `src/features/deployment/fixtures/frontend-through-b.json:4,17` → historical M01–M08 (frozen): مصدر fixture B قبلM01، ليس manifest التشغيل.
- `src/features/deployment/frontend-schema.test.ts:103,114,115` → current/live (manifest): يتلف العقد الحالي عمدًا في نسخ اختبار؛ لا SQL تاريخي.
- `src/features/deployment/owner-dashboard-deferred-schema.test.ts:14` → historical M01–M08 (frozen): fixture B ثابتة لا كتالوجM09.
- `src/features/supervisor/p1-availability.ts:11,12` → current/live (manifest): يحكم توافرP1 من التصنيف الحالي.
- `src/features/supervisor/p1-dormant-fixture.ts:35,37` → historical M01–M08 (frozen): يعيد B الحقيقي المثبت؛ القائمة التاريخية معزولة أصلًا.
- `src/features/supervisor/p1-guard-adversarial.test.ts:15,16,68` → current/live (manifest): حارس العقد الحالي ضد العبث؛ demotion معزول عبر fixture B.
- `src/features/supervisor/p1-schema.test.ts:19` → historical M01–M08 (frozen): fixture B الأصلية ثم demotion داخل نسخة اختبار.
- `src/features/supervisor/p1-wiring.test.ts:27,31,42` → current/live (manifest): يربط التوافر بمتطلبات الواجهة الحالية.
Verified: من تطبيق current+M01–M09 محلي نظيف، functions131 فقط تغير digest؛ بقية أصناف inventory الثمانية ثابتة. الأمر `diff -u --label supabase/checks/rad062-p1-b-ready.sql --label supabase/checks/rad062-p1-b-m09-ready.sql supabase/checks/rad062-p1-b-ready.sql supabase/checks/rad062-p1-b-m09-ready.sql` خرج1؛ مخرجاته الحرفية:
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
لا توسيع حزمة8 أو guardedFeatures.rad062؛ feature لـM09 مؤجل لدفعة5ب؛ قائمة main المجمدة تبقى10، والعقد الحالي10 مع الاستبدالين في الموضعين نفسيهما.
## 5 — الطبي والدرجات وسؤالا AGENTS
لا تغيير طبي/درجات/حدود/JSON/signature/ACL/FK/امتحانات أو حزم هاتف. هل تغير الحكم باختصاره؟ لا؛ استثناءات المالك الجديدة صريحة. هل بقي رابط الأصل؟ نعم: [التصميم](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md)، [الخادم](RAD-062_SUPERVISOR_GRADING_SERVER_REPORT_2026-11-02.md)، [P10](archive/reports/2026-10/RAD-062_P10_REPORT_2026-10-30.md) و[القرار](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02).
## 6 — QA بترتيب CI والماركران
Verified (marker offline للمشروع https://vlacestfruxooznrcjqc.supabase.co): القديم `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`؛ الجديد يبقى `pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`؛ لا Variable تغيرت.
تُنفذ خطوات workflow بالترتيب محليًا معCI=true؛ checkout/setup-node إجراءات مضيف: مصدر الفرع/main متحقق، والبيئة توفرNode24.19.0 بدلNode22؛ نتائج المراجع السابق لا تنسب للرأس الجديد.
1. Verified: npm ci ناجح؛ package/lockfile ثابتان.
2. Verified: npm audit --audit-level=high ناجح؛16moderate قائمة، بلا audit fix.
3. Not run (env): تثبيت RAD-086 tools توقف `/bin/bash: line 1: sudo: command not found`.
4. Not run (env): سحب Supabase17.11 المثبت: `failed to register layer: no space left on device`.
5. Not run (env): vault/ICU0pass/1setup-fail: `No such image` للصورة نفسها.
6. Not run (env): owner/data-precheck15pass/1setup-fail/0skip؛ pinned owner case توقف `spawnSync age-keygen ENOENT` قبل check_05، فلا يثبت نجاحه.
7. Not run (env): catalogue0pass/1setup-fail؛ `No such image` لـSupabase17.11؛ لا إعفاء لفشله علىmain أو PR.
8. Not run (env): سحب postgres17.11 المثبت: `failed to register layer: no space left on device`.
9. Verified: setup-rad085-postgres ناجح، دون تغيير dependency أو selector.
10. Verified: phone emergency7/7.
11. Verified: pinned lock witness2/2.
12. Verified: erasure recovery20/20.
13. Not run (env): worker STOP/build/execution-failed وcleanup=true؛ Docker build الافتراضي: `mkdir /home/agent/.docker/buildx: read-only file system`؛ بعد cache مؤقت، تهيئة الحاوية توقفت `docker: Error response from daemon: no space left on device`؛ builder المنفرد ناجح، لا ادعاء تكامل.
14. Verified: docs:check ناجح؛ تحذيرات الميزانية لا تخفي فشل بروفة المالك.
15. Not run (env, partial): docs:test117pass/7setup-fail/0skip من124؛ الأدوات/الصور: `Required tool unavailable: psql (install the PostgreSQL client packages)` و`spawnSync age-keygen ENOENT` و`No such image`؛ بقية الحالات بما فيها restoreM08 ناجحة.
16. Verified: secret uploader Python8/8.
17. Verified: connection probe10/10.
18. Not run (env): typecheck توقف `Failed to load native binding` و`SWC native addon: validate cache root /home/agent/.cache: cache root has a parent writable by another user without trusted sticky protection`.
19. Verified: lint ناجح؛ تحذيرا simulator-layout-audit القائمان فقط؛ لا تحذير import جديد.
20. Not run (env, partial): npm test3290pass/60setup-fail/0skip في249ملفًا،246خضراء و3Supabase محجوبة بالصورة المفقودة؛632.64ثانية، لا نجاح CI كامل.
21. Verified: docs:check --base origin/main ناجح.
22. Verified: status:check --base origin/main --require-previous ناجح.
23. Not run (env): build توقف بخطأ SWC نفسه أعلاه، قبل البناء.
24. Not run (env): build:pages توقف بخطأ SWC نفسه أعلاه، قبل التصدير.
Verified: شاهد PG18 فعلي: M08_CHECKS العشرة تمر بعدM08؛ checks() الافتراضي يرفضه بـrequired_check_failed:B9؛ بعدM09 تمر العشرة الحالية؛ لا تشغيل B/R القديمين علىM09.
Verified: كل الاختبارات/التوقعات وSQL وmanifest والدليل مطابقة لـa31e46b في هذه المتابعة؛ تغييرات الكود فقط الثابت/imports/lookup التاريخيين؛ diagnostic مطابق لـmain؛1656ملفًا خارج النطاق مطابقة لـmain، منها112ملف supabase القائم وكل packets والبيانات/goldens/characterisation. docs:sync مرتان idempotent وdocs/status/diff checks النهائية؛ تدقيق المستهلكين شامل كما أعلاه.
Not run (env, recovery note): امتلاء Docker منع sandbox startup؛ حُذفت cache المهمة فقط، ونقلت خرائط npm-ci وملف musl غير المستخدم مع SHA إلى/tmp/rad062-ci-generated-metadata-backup؛ runtime JS/glibc وlockfile وصورةPG/volumes السابقة ثابتة؛ لا استنتاج توافق CI من هذا الإنقاذ.
## 7 — المفتوح وSTOP
تنتظر owner/catalogue وإعادة CI الكاملة في بيئة المراجع؛ نقص الصور لا يثبت زوال check_05. لا تشغيل R/B ضدM09، ولا تغيير default/live لتعويض التاريخي؛ لا تخفيف assertion/مهلة/teardown.
أي SQL قائم/packet/توقع خارج القيم المأذونة أو stage/count/teardown أو gate/Variable أو تجاوز19: STOP؛ إضافة B9 وحدها استثناء SQL السابق.
## 8 — قائمة المالك الموحدة والنافذة
1. أعد كل CI بالترتيب على الرأس الجديد بما فيها owner/catalogue بالصور المثبتة؛ بعد الخضرة والمراجعة تبقى Draft حتى النافذة، ولا ready/merge آلي.
2. بعد إذن حي مستقل نفذ1–6 على SHA main الخامل3c887cb31f523f3a49128305da50dd433f8e6a0c؛ بروفة3 على المصدر نفسه. أكد في1 commit الترقية وSHA256 لملفB9، واستخرجه محليًا محميًا في5 دون تغييرcheckout؛5 يستخدم R9/B9 وبقيةchecks، و2 يحتفظ بالقديمين.
3. ACK/البديل [RAD-059](RAD-059_PHONE_RUNBOOK.md) وحقوق/خصوصية/موافقة RAD-085 شروط فتح البوابة فقط؛ بقية شروط النافذة ثابتة، والبوابة مغلقة والعامل NOLOGIN والسر DISABLED.
4. بعد تحقق5 واحتواء6، في7 ضع marker أعلاه حرفيًا في GitHub Settings→Secrets and variables→Actions→Variables→PILOT_SCHEMA_VERIFIED ثم ادمج#200 داخل النافذة قبل8؛ بعدها CI/Deploy والهاتف. فشل deploy مع Variable القديم متوقع ولا يُصلح بتجاوز gate أو تغيير مبكر.
5. نص الإذن المنفصل غير صادر هنا: «أجيز نافذة M09 الحية على SHA المراجع بعد CI والبروفات والنسخة والاستعادة وسائر شروط الدليل المعدلة بقرارات2026-11-02؛ أنا المالك أنفذ SQL والمتغير والدمج والهاتف؛ البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ لا5ب أو إطلاق ضمن الإذن».
