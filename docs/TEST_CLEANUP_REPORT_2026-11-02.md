# تنظيف الاختبارات وCI — 2026-11-02

## 1. الانحرافات والميزانية
الهدف أربع وظائف متوازية مع الحراس ثابتة؛ السقف32 ملفًا؛25 في الدفعة الأولى و26 بعد شاهد إصلاح umask بطلب مراجعة #205.
القائمة الدقيقة26 ملفًا (helper اعتُمد بعد القياس؛ يضيف الإصلاح شاهد umask):

- `.github/workflows/ci.yml`
- `package.json`
- `vitest.config.mts`
- `scripts/docs/rad062-db-day.test.mjs`
- `src/features/assess/rad062-name.test.ts`
- `src/features/assess/rad062-freeze-foundation.test.ts`
- `src/features/assess/rad062-lifecycle.test.ts`
- `src/features/assess/rad062-manual-grading.test.ts`
- `src/features/assess/rad062-erasure-operations.test.ts`
- `src/features/assess/rad085-local-db.ts`
- `src/features/assess/rad085-template.test.ts`
- `src/features/deployment/frontend-manifest.test.ts`
- `src/features/deployment/finalize-headers.test.ts`
- `src/features/pilot/session-account.test.ts`
- `src/features/qa/scene-dom-ankle.test.ts`
- `src/features/qa/scene-dom-elbow.test.ts`
- `src/features/qa/scene-dom-hand.test.ts`
- `src/features/qa/scene-dom-lower-limb.test.ts`
- `src/features/qa/scene-dom-pelvis.test.ts`
- `src/features/qa/scene-dom-shoulder.test.ts`
- `src/features/qa/scene-dom-wrist.test.ts`
- `docs/project-status.md`
- `docs/HANDOFF.md`
- `docs/DECISIONS.md`
- `docs/DOCS_CHECKS.md`
- `docs/TEST_CLEANUP_REPORT_2026-11-02.md`

سؤالا AGENTS: هل تغيّر حكم مختصر؟ **لا**. هل بقي رابط دليله الأصلي؟ **نعم**؛ لا اختصار للأحكام السابقة.

## 2. المنجز والمستبعد
الإغلاقات وقرارات المالك في أول commit توثيقي؛ split CI والشواهد وتجربة template في الدفعة نفسها.
لا SQL حي أو نشر إضافي أو إعادة توليد goldens؛ #196/#197 وشاشة5ب وإصلاحات RAD-085 خارج النطاق.

## 3. حالة المهام وإغلاقات المالك
<a id="owner-closures"></a>
Verified (إفادة المالك، وليست قراءة الوكيل للقاعدة): نافذة M09 بتاريخ2026-11-02 اكتملت بخطوات1–8 من [الدليل](RAD-062_M09_LAPTOP_RUNBOOK.md).
1. تحقق مصدر ما قبل الترقية وبصمات M09 وفحصَي successor، وطُبع marker القديم.
2. preflight كلهاtrue: البوابة مغلقة، NOLOGIN، اتصالات العامل0، D3 exact، جاهزية M08 القديمة6/6 وp1-b14/14؛ السر DISABLED وScheduler غائب والتنفيذات0.
3. نسخة RAD-086 جديدة:96 جدولًا، count_errors=0، PG170011؛ verify نجح. على المستعادة: m09_committed=1، pre_m08_ready=1، post_m09_ready=1، anchor_rollbacks=2، foreign_keys_unchanged=1، teardown_pass=1.
4. طُبقت M09 مرة واحدة بمعاملة COMMIT واحدة.
5. rad062-m09-ready6/6 وrad062-p1-b-m09-ready14/14؛ الفحوص الثمانية الثابتةtrue باستثناء الحقول المتنصّل منها؛ FK inventory متطابقة bytes.
دوال assess عددها128 وOIDs ثابتة وصفر تغييرات properties/ACL/config؛ تغيرت6 bodies فقط: manual_authorize/queue/read/score/finalize/receipt_v1؛ البوابة مغلقة وD3 exact.
6. P5v2 stop والتحقق المستقل5/5 STOPPED: stop، verify، repeat stop، verify، verify بعد60ثانية.
7. ضبط المالك PILOT_SCHEMA_VERIFIED إلى `pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3` ثم دمج #200.
8. CI وDeploy Pages خضراء على main المرقاة؛ فحص هاتف المالك4/4: login، Practice، Assess بلا امتحانات طلاب متاحة، supervisor/groups.
انحرافات النافذة: فُعّلت Cloud Scheduler API بموافقة gcloud التفاعلية ثم عُطلت في النافذة نفسها دون إنشاء job؛ لا أثر على DB.
احتواء الخطوة6 من SQL Editor باللابتوب، لا الهاتف: **OPEN** إعادة copy/paste dry-run من الهاتف قبل فتح البوابة ضمن RAD-059.
WSL اللابتوب بلاIPv6؛ npm يحتاج `NODE_OPTIONS=--dns-result-order=ipv4first`؛ لا يُعمم على CI.
RAD-062 تبقىin_progress والتالي5ب؛ البوابة مغلقة والعامل NOLOGIN والسر DISABLED.
Verified: قراءة GitHub تثبت دمج #200 و#202 و#203 و#204؛ #203 أغلق فجوة rehearseM09، فلا إعادة تنفيذ لها.
#204 تقرير مراجعات RAD-085 فقط، بلا تغيير حالتها؛ الإصلاحات لاحقة. **OPEN:** ملفات DB-day القديمة في home لابتوب المالك لقراره ضمن RAD-085 P5؛ لا إجراء عليها.
سُجل التدقيق عبر next_id كمهمة RAD-092 منجزة بدليل #202، والتنظيف RAD-093 تحتها؛ التنظيف غير منجز قبل المراجعة والدمج.

## 4. التغييرات المشتركة وScale
Verified: أربع jobs مع جامع `check` حاجب؛ Node22 وtimeout15 والصور وأدوات apt المثبتة ثابتة؛ [التخطيط](DOCS_CHECKS.md#ci) و[التنفيذ](../.github/workflows/ci.yml).
Verified: لكل اختبار Vitest قسم واحد؛ قائمة الجمع قبل1856 وبعد1861 بالدفعة الأولى (+5: pin1، namespace1، headers3؛ أضاف إصلاح umask حالة لاحقًا)، دون حذف حالة. التعريفات المعلَمة parameterized تُحسب منفصلة عن عدد التنفيذ أدناه.
Verified:106 ملفات DB و145 unit في القياس الأول؛ أضاف إصلاح umask ملف DB واحدًا؛ التقاطع0 وكل71 ملفًا محتاجًا DB في الجرد داخل DB lane؛ جرى فحص union مقابل قائمة ما قبل التغيير، والفروق فقط الشواهد الخمسة.
Verified: أزيلت whole-list asserts فقط؛ بقيت derived-marker والbytes والتاريخ والprivileges والrollback وكل السلوك. الأرقام من main الحالية بعد #200 (name كانت55 في الجرد القديم):
| الملف داخل assess إلا Node | الأسطر قبل ← موضع الإحالة بعد |
|---|---|
| rad062-name.test.ts |48 ←48|
| rad062-freeze-foundation.test.ts |72 ←72|
| rad062-lifecycle.test.ts |257 ←257|
| rad062-manual-grading.test.ts |215 ←215|
| rad062-erasure-operations.test.ts |353 ←353|
| scripts/docs/rad062-db-day.test.mjs |90–92 ←89|
البديل [pin مستقل](../src/features/deployment/frontend-manifest.test.ts) بتوقع literal لـ32 required وdeferred فارغة و10 checks وmarker المرقّى؛ لا اشتقاق للتوقع من manifest.
Verified: تجربة template على HEAD نفسه `af0f2e5`، Node22.23.4، الأمر `npx vitest run src/features/assess/rad085-db.test.ts --reporter=json`:14/14 قبل وبعد.
القياس النهائي يشمل العملية كاملة من الإطلاق حتى الخروج/التنظيف: قبل23.817ث وبعد21.863ث؛ وفر صافٍ1.955ث (8.2%)؛ هذا لملف التجربة فقط، لا وعد لوفر lane كاملة.
اعتمدت [helper](../src/features/assess/rad085-local-db.ts): baseline واحدة لكل binary/C/UTF8/migration-list، نسخ cluster متوقفة لكل حالة لحفظ عزل roles/ACL، مع sockets/clients/teardown مستقلة.
Verified: تجربة مستقلة مؤقتة أثبتت عدم تسرب rows/roles/ACL، rollback، وهوية version/locale؛ مسار beforeUpgrade غير مخبأ؛ Supabase17/ICU وباقي helpers بلا تغيير، ولا isolate:false.
Not run (env): قياس Docker-image cache محجوب بفشل pull؛ لم يُضف cache بلا دليل وفر. Scale: القياس المحلي عينة واحدة؛ اعتماد توزيعات CI وتوسيع allowlist ينتظر دليلًا ومراجعة تتبع المستدعين.

المطابقة التالية لكل25 خطوة أصلية في [CI السابقة](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/411df95feca88b5b5b16fb9ce2ded4f6ebd41408/.github/workflows/ci.yml)؛ لا خطوة عمل مفقودة أو مكررة.
checkout/setup-node/npm ci تهيئة مستقلة لكل runner؛ `npm test` قسمان متكاملان ينفذ كل اختبار مرة؛ ICU كانت مكررة والآن مرة حاجبة.
| خطوة قبل | العمل | job بعد |
|---|---|---|
|1|checkout الكامل|الأربع، تهيئة|
|2|setup-node22/npm cache|الأربع، تهيئة|
|3|npm ci|الأربع، تهيئة|
|4|npm audit high|unit|
|5|apt age وPG16 client/server|db|
|6|pull Supabase17.11 digest نفسه|db|
|7|laptop-icu|db، إلزامي مرة|
|8|laptop-rehearsal + data-precheck|db، filter PR فقط|
|9|CRLF catalogue-rehearsal|db، filter PR فقط|
|10|pull postgres17.11 digest نفسه|db|
|11|setup-rad085-postgres|db|
|12|emergency-stop-rehearsal|db، دائمًا|
|13|rad085-lock-witness|db، دائمًا|
|14|rad085-erasure-recovery|db، دائمًا|
|15|rad085-worker-rehearsal|db، filter PR فقط|
|16|docs:check|docs|
|17|docs:test، باستثناء ICU المكرر فقط|db|
|18|Python secret uploader|db|
|19|connection-probe|db|
|20|typecheck|unit|
|21|lint|unit|
|22|npm test|unit+db، بلا تداخل|
|23|PR docs:check + status:check/previous|docs، الشرط السابق نفسه|
|24|build|build|
|25|build:pages|build|
Verified:11 تجارب على filter الفعلية داخل Git مؤقتة: docs audit فقط=false؛ supabase/scripts/src/lock/phone/runbook/unknown=true؛ push main=true؛ فشل diff=true؛ diff فارغ=true.
Verified:16 نتيجة للجامع (كل job مع success/failure/cancelled/skipped)؛ success للجميع فقط ينجح، وكل timeout15. لا تغيير Deploy Pages أو صلاحيات workflow.

## 5. الطب والدرجات
لا تغيير طبي أو scoring أو منتج؛ الحراس والبصمات والـpackets ثابتة.

## 6. QA
نتائج الدفعة الأولى أدناه تخص `c77178c`؛ نتائج متابعة إصلاح umask مميزة في نهاية هذا القسم.
Verified: الشواهد ذات الصلة37/37 ناجحة قبل full؛ mutation: فقد baseline في السبع suites يفشل (9 حالات ثم حالتان)، بلا إنشاء ملف؛ استعادة bytes ثم full أدناه.
Verified: mutation لـrequired/deferred/checks وstdout marker تفشل pin؛ إعادة regex القديم تفشل namespace؛ تعطيل write يفشل headers؛ كل مصدر/manifest/golden مستعاد byte-identical.
Verified: typecheck ناجح بعد إصلاح tuple في الشاهد الجديد؛ lint صفر أخطاء وتحذيران سابقان في simulator-layout-audit؛ فشل البداية مسجل ولم يُخفَ.
Not run (env): docs:test126 إجمالًا،119pass/7fail/0skip؛ `Required tool unavailable: psql (install the PostgreSQL client packages)` و`spawnSync age-keygen ENOENT` و`ENOENT: no such file or directory, scandir '/usr/lib/postgresql'` وصورة postgres17.11 غائبة.
Not run (env): pull لصورة Supabase المثبتة فشل حرفيًا `failed to register layer: no space left on device`؛ تثبيت أدوات النظام محجوب بـ`sudo: command not found`؛ لا fallback ولا تعطيل شاهد.
Not run (env): full `npm run check` انتهى type/lint ناجحين؛ Vitest248 ملفًا ناجحًا و3 ملفات M09 محجوبة بالصورة:3295pass/60fail/0skip من3355،568.85ث.
الخطأ: `No such image: supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d`؛ لا فشل مستقل عن البيئة.
Verified:3355 حالة نهائية؛ Inferred:3350 قبل ←3355 بعد (+pin1/namespace1/headers3، يطابق التدقيق). قائمة الجمع قبل/بعد وdiff يثبتان عدم حذف أي حالة؛ Node بلا حذف، وتكرار ICU فقط أزيل.
Verified: displayed-text/banned words/schema gate/marker/supervisor privacy/emergency packets/goldens ضمن الملفات248 الناجحة؛ الحراس ثابتة عدا تقوية session-account المأذونة.
Verified: manual-QA helper bundle يفتح ويغلق fixture نظيفة مرتين خارج Vitest؛ typecheck وchanged-file lint ناجحان بعد ضبط lifecycle الشرطية. Python8/8 وconnection-probe10/10 ناجحة.
Verified: `npm run build` و`npm run build:pages` ناجحان؛ emergency-stop/lock/erasure29/29 ناجحة؛ audit high ناجح مع16 moderate سابقة دون تعديل الحزم؛ لا نشر يدوي أو preview URL.
Verified: `docs:sync` مرتان مع idempotence، ثم `docs:check --base origin/main` و`status:check --base origin/main --require-previous` و`git diff --check`؛ تنبيهات السقوف للمراجعة لا أخطاء.
Not run (external): قياس PR CI بعد مقابل13:08 main القديم في [التدقيق](TEST_AUDIT_REPORT_2026-11-02.md) يحتاج اكتمال CI على رأس PR؛ النوعان مختلفان فلا ادعاء مقارنة مكافئة أو وفر CI مقاس.
Not run: browser/phone/live لهذه الدفعة؛ اختبارات الحراس البنيوية لا تثبت تحققًا سريريًا أو نشرًا؛ لا subscribe/poll أو تشغيل workflow يدوي.

### متابعة مراجعة #205 — صلاحيات clone
Verified: أُعيد إنتاج `pg_ctl: could not start server` بشاهد جديد تحت umask0022 قبل الإصلاح؛ بعده يفتح أول fixture وclone ويتحقق من mode0700 ويعيد umask في finally.
Verified: التغيير التنفيذي فقط import chmodSync ثم chmodSync(data,0o700) مباشرة بعد cpSync؛ لا تغيير SQL أو roles/ACL/locale أو مهلة أو حارس.
Verified: typecheck وeslint للملفين ناجحان؛ `umask 0022; CI_TEST_LANE=db npm test`:104 ملفات/809 حالات ناجحة، صفر pg_ctl startup failures، وشاهد mode0700 ناجح.
Not run (env):60 حالة M09 في3 ملفات محجوبة بالصورة المثبتة المفقودة نفسها الموثقة أعلاه؛ إجمالي DB869/107 ملفات،0skip؛ الزمن463.79ث.
Not run (external، وقت دفع الإصلاح): CI على رأس الإصلاح وwall time تنتظر التشغيل المعتاد؛ يسجل التقرير النهائي زمن التشغيل الأخضر ورابطه؛ لا قياس من تشغيل failed.

## 7. البنود المفتوحة
إعادة تمرين الهاتف RAD-059 وقرار ملفات اللابتوب RAD-085 P5؛ شاشة5ب في دفعة مستقلة. CI وقياس PR والمراجعة حاجبة لإغلاق RAD-093؛ القيود البيئية لا تعني نجاحًا.

## 8. قائمة المالك الموحدة والمتابعة
القرارات الثمانية المعتمدة محفوظة حرفيًا في [DECISIONS](DECISIONS.md#test-cleanup-owner-2026-11-02)؛ لا قرارات جديدة مطلوبة الآن.
المتابعة: مراجعة Draft وCI وقياسات الدفعة، مع إبقاء شروط فتح البوابة مستقلة.
