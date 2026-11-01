# RAD-089 — تنظيم الوثائق ومسار العمل والجرد، 2026-11-01

السلطة: [قرارات المالك D1–D4](../../../DECISIONS.md#workflow-owner-2026-11-01). [الجرد الكامل](DOCS_INVENTORY_2026-11-01.md) و[سكربت الإثبات](../../../../scripts/docs/verify_restructure.py). هذه الدفعة Draft فقط؛ لا ready أو merge أو auto-merge أو نشر يدوي أو preview أو subscribe/poll. إفادة الهاتف والنشر الخاصة بـRAD-088 من المالك؛ لا قراءة live من الوكيل.

## 1. الانحرافات والميزانية

الهدف: إغلاق RAD-088 أولًا، ثم أرشفة التقارير والصور المؤهلة مع حفظ الأدلة، workflow واحد وملخص واحد، وجرد المحتوى. الميزانية: ملفات Markdown القائمة لتعديل أهداف الروابط فقط، وتحرير AGENTS وCLAUDE وREADME وDECISIONS وHANDOFF وproject-status وstatus-format صراحةً، ثم تقريران جديدان وأداة إثبات Python بجانبهما. صفر تغيير في src/ أو scripts/ أو tests/ أو .github/ أو package*.json أو المنتج أو SQL أو migration أو fixture. لا تطبيق توصية خارج حدود I.

أول commit هو إغلاق RAD-088، في ملف الحالة وتقرير الاعتماديات فقط؛ النقل لاحق له. الاستثناءات البايتية تُقارن بمرجع هذا الإغلاق حتى لا تلغي سطر النتيجة المأذون في تقرير RAD-088. الوثائق الحية التي طلب المالك تحريرها صراحةً (DECISIONS/HANDOFF/README/project-status/status-format) محررة في نطاقها، وإن كانت أدوات تقرأها؛ بقية الوثائق المحمية لم تتغير بايتاتها.

فشل تشغيل docs:check الأول داخل sandbox بعلة spawnSync git EPERM؛ أُعيد خارج قيد spawning المحلي دون تعديل فاحص. وفشل تشغيل docs:test الأول بنواقص البيئة (psql/age/pg/Docker prerequisites)؛ تجهيز البيئة وإعادة التشغيل موثقان في§6. لا guard/assertion/timeout مخفف ولا اختبار متخطى.

## 2. المنجز والمتروك

| القياس | قبل | بعد |
|---|---|---|
| ملفات docs/*.md في المستوى الأعلى | 201 | 161 |
| التقارير المؤرخة المرشحة | 139 | 99 باقية باستثناء معلل |
| التقارير المنقولة | 0 | 40 |
| ملفات الصور المنقولة | 0 | 13 |
| HANDOFF سطرًا | 15 | 30 |
| ملفات محذوفة | 0 | 0 |

كل النقل بـgit mv: 40 تقريرًا إلى docs/archive/reports/YYYY-MM/، و13 صورة إلى docs/archive/review/rad-072-part3b/ وrad078/ وrad079/، ومراجع الصور الوحيدة من تقارير نُقلت فعلًا. الصور بلا إعادة ترميز أو تحجيم. [خريطة الأصل والوجهة الكاملة](DOCS_INVENTORY_2026-11-01.md#4-خريطة-النقل-المنفذ-القابلة-للفحص).

المتبقي99تقريرًا مؤرخًا محفوظة بسبب القراء غير Markdown أو completion_evidence المنجز أو روابط وثائق محمية بايتيًا؛ يُحسب الاستثناء تباعًا حتى تثبت المجموعة. لا aliases جديدة ولا نسخ أدلة إضافية ولا حذف؛ Git يحتفظ بالتاريخ وMarkdown يتجه إلى الوجهة الجديدة. بقيت المسارات النصية التاريخية داخل prose/code كما هي عمدًا؛ الأهداف القابلة للنقر وsource_ref وحدها حُدثت. الرابط القديم في commit تاريخي يُقرأ في شجرة ذلك commit.

## 3. لكل مهمة

- **RAD-088 → done في أول commit:** #186 مدموج مع CI check + deploy أخضر، وDeploy Pages ناجح على main، marker ثابت. إفادة المالك بعد نشر2026-11-01:4/4 (الموقع، فحص تدريبي كامل، EN/AR، صفحة الدخول). حُذف waiting_on وأضيف completion_evidence دون400حرف، وrevision/updated_at رُفعا. أُضيف سطر النتيجة إلى [تقرير الاعتماديات §8](../../../DEPS_SECURITY_REPORT_2026-11-01.md#8-قائمة-المالك). **16 moderate** تبقى مفتوحة وفق§7 وحدها وtrigger الأصلي.
- **RAD-089 جديدة review/owner:** تنتظر مراجعة المالك للنقل ووحدة workflow والجرد؛ إغلاقها أول commit في الدفعة التالية بعد إفادة المالك، أيا كان موضوع تلك الدفعة.
- بقية المهام: لم يتغير أي حقل إلا مسارات source_ref للنقل، بما فيها المهام done؛ completion_evidence والأوصاف وبقية النصوص ثابتة. source_ref النصي مستثنى صراحةً من إثبات أهداف Markdown فقط، وله مقارنة مستقلة حقلًا بحقل.

## 4. التغييرات المشتركة وScale

AGENTS بقي52سطرًا مع دورة مهمة قصيرة؛ CLAUDE أصبح إحالة واستيرادًا فقط. project-status يحتفظ بكتلة JSON وجدول التاريخ وإحالة واحدة للملخص. HANDOFF يحتفظ بالبنود الخمسة وقائمة إغلاقات من سطر لكل مهمة/فحص/موضع دليل، دون نسخة حالة ثانية؛ status-format §1 وrule11 و§6 يطابق D4، وrule12 يحيل إلى دورة المهمة. لا فاحص أو اختبار قائم كان يفرض وجود الملخص في project-status، لذلك **لا checker/test expectation تغير**، بما فيه اختبار السماح بنص خارج JSON الذي لا يفرض ملخصًا.

حد Scale: الفحص lexical ومحلي للوثائق المتتبعة؛ لا يثبت روابط يولدها نظام خارجي ولا الصحة الطبية ولا الترخيص. التواريخ تستخرج آليًا إلى YYYY-MM بدل قائمة أشهر ثابتة. تحليل المراجع يشمل template مخرجات السكربتات، لكنه لا يحل JavaScript العام. الحماية المحافظة قد تبقي تقريرًا كان يمكن نقله بتفويض أوسع. Trigger: كل دفعة أرشفة لاحقة تعيد حصر المستهلكين وتراجع النمط غير المفهوم قبل نقل ملفه؛ لا تعديل منتج لرفع هذا الحد الآن. لا سقف منتج أو بيانات أو دور/لغة جديد.

### كل قاعدة اختُصرت أو نُقلت: الحكم والدليل

| الموضع | هل تغير الحكم؟ | هل بقي رابط الدليل؟ |
|---|---|---|
| AGENTS: Task lifecycle | نعم، D2 يفرض الإغلاق في أول commit من الدفعة التالية وreview/owner حتى إفادة المالك؛ بقية QA والتسليم ثابتة | نعم، workflow-owner-2026-11-01 ودليل RAD-088 |
| CLAUDE → AGENTS | لا، أزيل تكرار وصف القواعد وبقي الاستيراد والرابط؛ D3 يمنع إضافة قواعد أداة | نعم، رابط AGENTS وقرارات D3 |
| project-status وstatus-format rule11 → HANDOFF | نعم في موضع الملخص فقط وفق D4؛ لا تغيير حكم حالة أي مهمة بسبب الاختصار | نعم، HANDOFF وDECISIONS وsource_ref/history القائمة |
| HANDOFF وإحالات status-format rule12 | نعم في إجراء الإغلاق فقط D2؛ الوقائع الحالية تتضمن إغلاق RAD-088 المأذون، وبقية العوائق ثابتة | نعم، تقارير المهام ومواضع الأدلة سطرًا لكل pending closure |
| قراءة README ومسارات التقارير والصور | لا، خريطة القراءة نفسها مع وجهات D1 الجديدة | نعم، جميع الأهداف المحلية مفحوصة ومعرّفات القرارات محفوظة |
| نصوص التقارير وسائر Markdown وsource_ref | لا، أهداف الروابط ومسارات source_ref فقط | نعم، نزع الأهداف ومقارنة البايتات مع إثبات تكافؤ الوجهة، وsource_ref مستقل |

## 5. الطب والتقييم

لا تعديل طبي أو scoring أو ترخيص أو منتج؛ المراجع الطبية والحقوق المحمية بقيت بايتيًا. الصور أدلة بايتية نفسها، لا تحسين صورة أو تشخيص أو توليد صور. لا qa:golden أو qa:characterise أو تغيير hashes أو expectations أو fixtures. لا SQL/live/Variables/بيانات مشاركين.

## 6. QA

| الفحص | النتيجة |
|---|---|
| npm run docs:check -- --base origin/main | 301 Markdown؛3739إحالة محلية؛417معرّف قرار؛0أخطاء و0تحذيرات مراجعة |
| npm run docs:test (المجموعة كاملة دون تخطٍّ) | آخر تشغيل:120اختبارًا،118نجاحًا و2فشل بيئة،0skipped/0cancelled. لم يتحقق شرط نجاح المجموعة كاملة |
| الفشلان الباقيان | scripts/docs/laptop-icu.test.mjs: اختبار pinned Supabase17.11؛ scripts/docs/rad062-db-day.test.mjs: actual local logical restore. سحب الصور المثبتة Supabase17.11 وPostgreSQL18.4 فشل no space left on device في مخزن Docker vfs؛ لا تغيير pin أو guard أو timeout أو توقع |
| إصلاح نواقص البيئة | جُهزت حاوية Ubuntu24.04 محلية بأدوات PostgreSQL16/age/git والـlocale en_US.UTF-8؛ واستُخدم setup-rad085-postgres.mjs القائم لاعتماديات /tmp. بعد الإصلاح اختفت أخطاء الأدوات والـlocale؛ بقي حد مساحة صور Docker. لا تغيير ملفات المشروع لذلك |
| npm run status:check -- --base origin/main --require-previous | ناجح؛ الاستمرارية وrevision/updated_at وnext_id مفحوصة |
| npx vitest run src/data/credits.test.ts src/features/qa/project-status.test.ts | 2ملف و59اختبارًا ناجحة؛ توقعات الأدلة والحالة بلا تغيير |
| ruff check verify_restructure.py | ناجح؛ أُصلحت أخطاء lint في الأداة الجديدة دون تغيير أي فاحص قائم |
| python docs/archive/reports/2026-11/verify_restructure.py | PASS:292Markdown بعد استثناء7ملفات التحرير المأذون؛248منها مطابقة بايتية؛ صفر فروق خارج أهداف الروابط، مع إثبات تكافؤ الوجهات. التقرير الوحيد بلا روابط R100، والصور13 R100 ومطابقة بايتية |
| مقارنة بيانات المهام | كل task سابق مطابق بعد نزع source_ref وحده بالنسبة إلى أول commit؛ التغييرات في source_ref مسارات النقل فقط. RAD-088 تغيرت أولًا بأمر المالك، RAD-089 وحدها جديدة |
| git diff --check وgit diff --check origin/main | ناجحان |
| git diff --stat -M origin/main | 69ملفًا:53منقولًا (40تقريرًا +13صورة)،13معدلًا،3مضافة (التقرير والجرد وأداة الإثبات). لا D |
| غير مشغّل | npm test الكامل وapp build وتدقيق المتصفح: لا تغيير منتج؛ لا qa:golden/qa:characterise. لا فحص CI بعيد/subscribe/poll ولا إعادة نشر يدوي |

الملفان اللذان فشلا لم يتغيرا. نجاح118حالة ليس نجاح المجموعة كاملة؛ يلزم بيئة Docker أكبر واستكمال المجموعة قبل اعتماد الدفعة. لم يُغيّر storage driver أو data directory ولم تُستبدل صورة مثبتة بصورة أخرى. هذان فشلا متطلبات بيئة قائمة، لا فشلا روابط النقل أو قواعد D4.

ملفات الحماية: docs/RAD-059_PHONE_PACKET.md وdocs/RAD-062_P05_PHONE_PACKET.md وجميع *_PHONE_PACKET.md و*_SQL_PACKET.md وsupabase/** وscripts/pages/frontend-schema.json ومراجع non-Markdown غير ملفات التحرير الحية الصريحة؛ مطابقة بايتية. كل الملفات الموجودة قبل الدفعة موجودة بعد تطبيق خريطة النقل، ولا حذف.

## 7. البنود المفتوحة وجرد المحتوى

الجرد جزء من هذه الدفعة: [161وثيقة باقية](DOCS_INVENTORY_2026-11-01.md#1-كل-وثيقة-باقية-في-أعلى-docs)، مع الغرض وتاريخ آخر commit والوارد md+non-md والتوصية؛ [270ملف صورة/JSON](DOCS_INVENTORY_2026-11-01.md#2-كل-صورة-وjson-في-نطاق-الجرد)، بالاسم والحجم ونوع المرجع والتقرير المالك؛ [الأرشيف السابق69ملفًا](DOCS_INVENTORY_2026-11-01.md#3-الأرشيف-السابق-التكرار-أو-الموضع-فقط) دون تكرار SHA-256، مع قائمة مواضع الجذر غير الموحدة فقط. لا إعادة تنظيم للأرشيف السابق. الجرد ليس اعتماد طب/رخصة أو بديلًا للحالة.

توصيات الوثائق: KEEP155، ARCHIVE5، MERGE INTO docs/README.md لملف ROADMAP واحد، DELETE-CANDIDATE0. تعارض ROADMAP:9 مع AGENTS:47–48 وتقادم ROADMAP:14 مقابل نتيجة يوم القاعدة محددان في الجرد؛ لا تعديل تلقائي لهما. كل توصية غير النقل المأذون بقيت توصية.

| توصية الصور/JSON | ملفات | MB |
|---|---|---|
| KEEP | 253 | 59.576985 |
| ARCHIVE | 17 | 11.384970 |
| DELETE-CANDIDATE | 0 | 0.000000 |

ARCHIVE المنفذ13ملفًا (1.649986 MB)؛4ملفات إضافية فيrad-077/rad069/rad080 توصية فقط (9.734984 MB). أي دليل يرد في ASSET_PROVENANCE_AND_LICENSES.md KEEP دائمًا.

إزالة ملفات من الشجرة لا تقلّص تاريخ Git. تقدير الحزمة في طلب المالك≈51MB؛ clone البيئة قاس114.65MiB عبر31pack قبل الدفعة، وليس قياسًا بديلًا لحزمة المصدر المفردة. حذف محتمل لاحقًا للنظافة لا لتقليص التاريخ؛ لا حذف أو rewrite أو filter-repo أو LFS migration هنا.

### قائمة non-Markdown المحسوبة بالسكربت

الحصر من snapshot الإغلاق، لكل ملف docs/ يشير إليه ملف غير Markdown؛ يشمل التعليقات وJSON والمراجع بالاسم، وحصر الصور التفصيلي في الجرد. الإشارات العامة README.md تحفظ بحذر كل README مطابق. الدليل التالي مخرَج حسابي، وليس قائمة سماح مكتوبة يدويًا:

| docs/ path | القارئ غير Markdown |
|---|---|
| `docs/ARABIC_TERMINOLOGY.md` | `src/data/modalities.ts` |
| `docs/ASSESS_RETENTION_POLICY.md` | `src/features/assess/retention.test.ts` |
| `docs/ASSET_LICENCE_AUDIT_2026-10-15.md` | `src/data/credits.test.ts` |
| `docs/ASSET_PROVENANCE_AND_LICENSES.md` | `scripts/derive-ankle-baselines.py`, `scripts/derive-chest-ap-baseline.py`, `scripts/derive-chest-lateral-baseline.py`, `scripts/derive-chest-pa-baseline.py`, `scripts/derive-elbow-baselines.py`, `scripts/derive-hand-baselines.py`, `scripts/derive-knee-foot-baselines.py`, `scripts/derive-wrist-baselines.py`, `scripts/qa/characterisation/chest-pa-case.json`, `src/data/cases/chest-ap-radiograph.ts`, `src/data/cases/chest-lateral-radiograph.ts`, `src/data/cases/chest-pa-radiograph.ts`, `src/data/cases/elbow-ap-radiograph.ts`, `src/data/cases/elbow-lateral-radiograph.ts`, `src/data/cases/hand-lateral-radiograph.ts`, `src/data/cases/hand-pa-radiograph.ts`, `src/data/cases/lower-limb-radiographs.ts`, `src/data/cases/pelvis-ap-radiograph.ts`, `src/data/cases/shoulder-grashey-radiograph.ts`, `src/data/cases/wrist-lateral-radiograph.ts`, `src/data/cases/wrist-pa-radiograph.ts`, `src/data/credits.test.ts`, `src/domain/radiograph.ts`, `src/features/evidence/public-text.test.ts` |
| `docs/DECISIONS.md` | `scripts/docs/check-docs.mjs`, `scripts/docs/check-docs.test.mjs`, `scripts/status/summary.test.mjs`, `src/data/cases/pelvis-ap-radiograph.ts`, `src/data/cases/pelvis-ap-supine.ts`, `src/data/cases/shoulder-grashey-erect.ts`, `src/data/cases/shoulder-grashey-radiograph.ts`, `src/data/credits.test.ts`, `src/data/exams/xray/chest-ap-supine.ts`, `src/data/exams/xray/chest-lateral-erect.ts`, `src/data/exams/xray/forty-inch-sid.ts`, `src/data/exams/xray/lower-limb-common.ts`, `src/data/exams/xray/pelvis-ap-supine.ts`, `src/data/exams/xray/pelvis-technique.ts`, `src/data/exams/xray/shoulder-grashey-erect.ts`, `src/data/exams/xray/shoulder-technique.ts`, `src/data/exams/xray/upper-limb-common.ts`, `src/features/platform/pelvis-geometry-drift.test.ts`, `src/features/qa/scene-dom-ankle.test.ts`, `src/features/qa/scene-dom-elbow.test.ts`, `src/features/qa/scene-dom-hand.test.ts`, `src/features/qa/scene-dom-lower-limb.test.ts`, `src/features/qa/scene-dom-pelvis.test.ts`, `src/features/qa/scene-dom-shoulder.test.ts`, `src/features/qa/scene-dom-wrist.test.ts`, `src/features/qa/scene-dom.test.ts`, `src/features/radiograph/limb-effects.ts` |
| `docs/DEPLOYMENT.md` | `.github/workflows/deploy-pages.yml`, `next.config.ts` |
| `docs/HANDOFF.md` | `scripts/docs/check-docs.mjs`, `scripts/docs/context.test.mjs`, `scripts/status/check-status.mjs`, `src/features/qa/project-status.test.ts` |
| `docs/PILOT_SUPABASE_SETUP.md` | `.github/workflows/deploy-pages.yml`, `scripts/pages/pilot-schema-gate.mjs`, `src/features/evaluation/version.ts`, `src/features/pilot-db/attempts.test.ts`, `src/features/pilot-db/owner-list.test.ts`, `src/features/pilot-db/rls.test.ts`, `supabase/migrations/20261015000100_pilot_accounts.sql` |
| `docs/RAD-059_PHONE_PACKET.md` | `scripts/assess/emergency-stop-packet.mjs`, `scripts/assess/emergency-stop-rehearsal.test.mjs`, `scripts/assess/emergency-stop-v2-packet.mjs`, `scripts/docs/rad062-db-day.test.mjs`, `src/features/assess/rad062-erasure-operations.test.ts`, `src/features/assess/rad062-freeze-foundation.test.ts`, `src/features/assess/rad062-lifecycle.test.ts`, `src/features/assess/rad062-manual-grading.test.ts` |
| `docs/RAD-059_PHONE_RUNBOOK.md` | `scripts/assess/emergency-stop-packet.mjs`, `scripts/assess/emergency-stop-v2-packet.mjs` |
| `docs/RAD-061_TIMEOUT_DIAGNOSIS_2026-10-22.md` | `src/features/assess/server-runtime.test.ts` |
| `docs/RAD-062_P05_PHONE_PACKET.md` | `scripts/assess/emergency-stop-v2-packet.mjs`, `scripts/docs/rad062-db-day.test.mjs`, `src/features/assess/rad062-erasure-operations.test.ts`, `src/features/assess/rad062-freeze-foundation.test.ts`, `src/features/assess/rad062-manual-grading.test.ts` |
| `docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md` | `src/features/platform/pelvis-geometry-drift.test.ts` |
| `docs/RAD-081_100_SETTINGS_2026-10-25.md` | `src/features/evaluation/forty-inch-sid.test.ts` |
| `docs/RAD-085_DB_DAY_P1.md` | `scripts/qa/rad085-d3-routes-audit.mjs`, `supabase/manual/rad085-db-day-backup/00-counts-before.sql`, `supabase/manual/rad085-db-day-backup/01-public-profiles.sql`, `supabase/manual/rad085-db-day-backup/02-public-attempts.sql`, `supabase/manual/rad085-db-day-backup/03-public-events.sql`, `supabase/manual/rad085-db-day-backup/04-public-feedback.sql`, `supabase/manual/rad085-db-day-backup/05-public-pilot_locales.sql`, `supabase/manual/rad085-db-day-backup/06-public-c2_account_deletions.sql`, `supabase/manual/rad085-db-day-backup/07-public-c2_survey_responses.sql`, `supabase/manual/rad085-db-day-backup/08-public-c2_survey_rounds.sql`, `supabase/manual/rad085-db-day-backup/09-public-c2_survey_settings.sql`, `supabase/manual/rad085-db-day-backup/10-public-c2_survey_versions.sql`, `supabase/manual/rad085-db-day-backup/11-assess-account_stops.sql`, `supabase/manual/rad085-db-day-backup/12-assess-assignments.sql`, `supabase/manual/rad085-db-day-backup/13-assess-consents.sql`, `supabase/manual/rad085-db-day-backup/14-assess-content_submissions.sql`, `supabase/manual/rad085-db-day-backup/15-assess-groups.sql`, `supabase/manual/rad085-db-day-backup/16-assess-launch_gate.sql`, `supabase/manual/rad085-db-day-backup/17-assess-memberships.sql`, `supabase/manual/rad085-db-day-backup/18-assess-practical_presentations.sql`, `supabase/manual/rad085-db-day-backup/19-assess-publications.sql`, `supabase/manual/rad085-db-day-backup/20-assess-receipts.sql`, `supabase/manual/rad085-db-day-backup/21-assess-reservations.sql`, `supabase/manual/rad085-db-day-backup/22-assess-results.sql`, `supabase/manual/rad085-db-day-backup/23-assess-session_details.sql`, `supabase/manual/rad085-db-day-backup/24-assess-sessions.sql`, `supabase/manual/rad085-db-day-backup/25-assess-targets.sql`, `supabase/manual/rad085-db-day-backup/26-assess-versions.sql`, `supabase/manual/rad085-db-day-backup/27-auth-users-minimal.sql`, `supabase/manual/rad085-db-day-backup/28-catalogue-functions-triggers.sql`, `supabase/manual/rad085-db-day-counts-after.sql` |
| `docs/RAD-085_P1_B_DB_DAY.md` | `scripts/assess/phone-sql-packet.mjs` |
| `docs/RAD-085_P1_B_PHONE_PACKET.md` | `scripts/assess/phone-sql-packet.mjs`, `scripts/assess/phone-sql-packet.test.mjs` |
| `docs/RAD-085_SHARING_LIVE_P1_PROPOSAL.patch` | `src/features/assess/rad085-d3-db.test.ts` |
| `docs/RAD-086_PROBE_SQL_PACKET.md` | `scripts/docs/laptop-backup.test.mjs` |
| `docs/RAD-LAB_Medical_Reference_Ankle.md` | `src/data/exams/xray/lower-limb-common.ts` |
| `docs/RAD-LAB_Medical_Reference_Chest_AP.md` | `src/data/exams/xray/chest-ap-supine.ts` |
| `docs/RAD-LAB_Medical_Reference_Chest_Lateral.md` | `src/data/exams/xray/chest-lateral-erect.ts` |
| `docs/RAD-LAB_Medical_Reference_Chest_PA.md` | `src/data/exams/xray/chest-pa-erect.ts`, `src/features/positioning/PlanView.tsx` |
| `docs/RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md` | `src/features/radiograph/tuning.ts` |
| `docs/RAD-LAB_Medical_Reference_Chest_PA_Technique.md` | `src/data/exams/xray/chest-pa-technique.ts`, `src/domain/technique.ts` |
| `docs/RAD-LAB_Medical_Reference_Elbow.md` | `src/data/exams/xray/upper-limb-common.ts` |
| `docs/RAD-LAB_Medical_Reference_Hand.md` | `src/data/exams/xray/upper-limb-common.ts` |
| `docs/RAD-LAB_Medical_Reference_Knee_Foot.md` | `src/data/exams/xray/lower-limb-common.ts` |
| `docs/RAD-LAB_Medical_Reference_Wrist.md` | `src/data/exams/xray/upper-limb-common.ts` |
| `docs/RAD-LAB_Project_Specification.md` | `src/domain/simulation.ts` |
| `docs/README.md` | `scripts/docs/check-docs.mjs`, `scripts/docs/check-docs.test.mjs`, `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace_lib.py`, `src/features/pilot-db/migration-chain.test.ts`, `src/features/qa/project-status.test.ts` |
| `docs/REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md` | `scripts/qa/characterisation/chest-pa-case.json`, `scripts/qa/characterisation/chest-pa-scenarios.json`, `src/data/exams/xray/chest-pa-erect.ts` |
| `docs/REVIEW_PACKAGE.md` | `src/data/exams/xray/lower-limb-ankle-texts.ts`, `src/data/exams/xray/lower-limb-common.ts`, `src/data/exams/xray/upper-limb-common.ts` |
| `docs/TERMS_OWNER_DRAFT_2026-10-16.md` | `scripts/qa/pilot-consent-audit.mjs` |
| `docs/adr/README.md` | `scripts/docs/check-docs.mjs`, `scripts/docs/check-docs.test.mjs`, `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace_lib.py`, `src/features/pilot-db/migration-chain.test.ts`, `src/features/qa/project-status.test.ts` |
| `docs/archive/RAD-085_ERASURE_SQL_PROPOSAL_2026-10-26.patch` | `src/features/assess/rad085-erasure-db.test.ts` |
| `docs/archive/RAD-085_SHARING_SQL_PROPOSAL_2026-10-26.patch` | `src/features/supervisor-review/sharing-policy.test.ts` |
| `docs/archive/RAD-085_SQL_AUDIT_PROPOSAL_2026-10-26.patch` | `scripts/assess/rad085-security-rehearsal.mjs` |
| `docs/archive/README.md` | `scripts/docs/check-docs.mjs`, `scripts/docs/check-docs.test.mjs`, `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace_lib.py`, `src/features/pilot-db/migration-chain.test.ts`, `src/features/qa/project-status.test.ts` |
| `docs/archive/planning/PLATFORM_ARCHITECTURE-until-2026-10-16.md` | `src/domain/exam.ts` |
| `docs/archive/sessions/session-13b-scene-design.md` | `scripts/docs/check-docs.mjs` |
| `docs/archive/sessions/session-3-technique.md` | `scripts/docs/check-docs.mjs`, `src/features/technique/model.ts` |
| `docs/archive/sessions/session-5-qa.md` | `.github/workflows/ci.yml`, `scripts/docs/check-docs.mjs` |
| `docs/archive/sessions/session-7-demographics-impact.md` | `scripts/docs/check-docs.mjs`, `src/data/cases/chest-pa-erect.ts` |
| `docs/project-status.md` | `scripts/docs/check-docs.mjs`, `scripts/docs/check-docs.test.mjs`, `scripts/status/check-status.mjs`, `scripts/status/summary.mjs`, `src/features/qa/project-status.test.ts` |
| `docs/review/rad-069b1-metrics.json` | `scripts/qa/rad-069b1-pages-audit.mjs` |
| `docs/review/rad-072-foot/ap-all.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/ap-metatarsals.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/ap-soft-tissue.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/ap-tarsals.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/ap-toes.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-all.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-metatarsals.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-soft-tissue.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-tarsals.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-toes.png` | `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-hand/lateral-all.png` | `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-hand/lateral-digits-thumb.png` | `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-hand/lateral-wrist.png` | `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-hand/pa-all.png` | `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-hand/pa-digits-joints.png` | `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-hand/pa-metacarpals-thumb.png` | `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-hand/pa-soft-tissue.png` | `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-hand/pa-wrist.png` | `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-shoulder/all.png` | `scripts/trace-outlines/trace-foot-outlines.py`, `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace-shoulder-outlines.py`, `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-shoulder/humerus.png` | `scripts/trace-outlines/trace-shoulder-outlines.py` |
| `docs/review/rad-072-shoulder/scapula-acromion-clavicle.png` | `scripts/trace-outlines/trace-shoulder-outlines.py` |
| `docs/review/rad-072-shoulder/scapular-border.png` | `scripts/trace-outlines/trace-shoulder-outlines.py` |
| `docs/review/rad-072-shoulder/soft-tissue.png` | `scripts/trace-outlines/trace-foot-outlines.py`, `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace-shoulder-outlines.py`, `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/lateral-all.png` | `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/lateral-carpals.png` | `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/lateral-forearm.png` | `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/pa-all.png` | `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/pa-carpals.png` | `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/pa-forearm-metacarpals.png` | `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/pa-soft-tissue.png` | `scripts/trace-outlines/trace-hand-outlines.py`, `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad069c1-owner.jpg` | `scripts/qa/rad-069c1-owner-audit.mjs` |
| `docs/review/rad069c2-ui.jpg` | `scripts/qa/rad-069c2-audit.mjs` |
| `docs/session-13b-scene-design.md` | `scripts/docs/check-docs.mjs` |
| `docs/session-3-technique.md` | `scripts/docs/check-docs.mjs`, `src/features/technique/model.ts` |
| `docs/session-5-qa.md` | `.github/workflows/ci.yml`, `scripts/docs/check-docs.mjs` |
| `docs/session-7-demographics-impact.md` | `scripts/docs/check-docs.mjs`, `src/data/cases/chest-pa-erect.ts` |
| `docs/status-format.md` | `.github/workflows/ci.yml`, `scripts/status/check-status.mjs`, `src/features/qa/project-status.test.ts` |

### كل تقرير مؤرخ مستثنى مع السبب

| الملف | السبب |
|---|---|
| `docs/ASSESS_B_REPORT_2026-10-19.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| `docs/ASSESS_CLOUD_RUN_PLAN_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md |
| `docs/ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| `docs/ASSESS_CONTROLLED_TRIAL_READINESS_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md |
| `docs/ASSESS_C_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/ASSESS_D_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/DEPLOYMENT.md |
| `docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| `docs/ASSESS_EXTERNAL_BINDING_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| `docs/ASSESS_E_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/DEPLOYMENT.md |
| `docs/ASSESS_F_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/DEPLOYMENT.md |
| `docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| `docs/ASSESS_POSTGRES_PASSWORD_IMPACT_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md |
| `docs/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/ASSESS_RETENTION_POLICY.md |
| `docs/ASSESS_RETENTION_PREFLIGHT_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md |
| `docs/ASSESS_RETENTION_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/ASSESS_RETENTION_POLICY.md |
| `docs/ASSESS_RETENTION_REVIEW_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/ASSESS_CLOUD_RUN_PLAN_2026-10-21.md |
| `docs/ASSESS_SESSION_POOLER_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| `docs/ASSESS_TRIAL_BATCH_ONE_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| `docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md` | byte-identical protected Markdown: docs/RAD-061_BATCH4_REPORT_2026-10-22.md |
| `docs/ASSESS_TRIAL_FINAL_REPORT_2026-10-22.md` | byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| `docs/ASSESS_TRIAL_ISOLATION_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md |
| `docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_ONE_2026-10-22.md |
| `docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| `docs/ASSESS_WORKER_ACTIVATION_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md |
| `docs/ASSESS_WORKER_LOGIN_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| `docs/ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| `docs/ASSET_LICENCE_AUDIT_2026-10-15.md` | non-Markdown: src/data/credits.test.ts |
| `docs/DEPS_SECURITY_REPORT_2026-11-01.md` | done completion_evidence: RAD-088 |
| `docs/FORTY_INCH_SID_CHANGES_2026-10-30.md` | byte-identical protected Markdown: docs/FORTY_INCH_SID_REPORT_2026-10-30.md |
| `docs/FORTY_INCH_SID_REPORT_2026-10-30.md` | byte-identical protected Markdown: docs/RAD-081_100_SETTINGS_2026-10-25.md |
| `docs/OWNER_SIGNOFF_REPORT_2026-10-30.md` | done completion_evidence: RAD-037, RAD-069, RAD-074, RAD-076, RAD-077, RAD-078, RAD-079, RAD-080, RAD-084, RAD-083 |
| `docs/PILOT_PROVIDER_COMPARISON_2026-10-15.md` | done completion_evidence: RAD-040 |
| `docs/RAD-019_AI_ASSISTED_REVIEW_2026-10-22.md` | done completion_evidence: RAD-065 |
| `docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md` | byte-identical protected Markdown: docs/RAD-059_PHONE_RUNBOOK.md |
| `docs/RAD-059_REPORT_2026-10-29.md` | byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| `docs/RAD-061_BATCH1_REPORT_2026-10-22.md` | done completion_evidence: RAD-061 |
| `docs/RAD-061_BATCH4_REPORT_2026-10-22.md` | done completion_evidence: RAD-061 |
| `docs/RAD-061_BATCHES_2_3_5_6_REPORT_2026-10-22.md` | done completion_evidence: RAD-061 |
| `docs/RAD-061_CODE_AUDIT_REPORT_2026-10-22.md` | done completion_evidence: RAD-061 |
| `docs/RAD-061_TIMEOUT_DIAGNOSIS_2026-10-22.md` | non-Markdown: src/features/assess/server-runtime.test.ts |
| `docs/RAD-064_UI_INVENTORY_REPORT_2026-10-22.md` | done completion_evidence: RAD-064 |
| `docs/RAD-065_REVIEW_TRIAGE_2026-10-22.md` | done completion_evidence: RAD-065 |
| `docs/RAD-066_UI1_REPORT_2026-10-22.md` | done completion_evidence: RAD-066 |
| `docs/RAD-067_UI3_REPORT_2026-10-22.md` | done completion_evidence: RAD-067 |
| `docs/RAD-068_FINAL_REPORT_2026-10-22.md` | done completion_evidence: RAD-068 |
| `docs/RAD-068_FINAL_TEXT_CHANGES_2026-10-22.md` | byte-identical protected Markdown: docs/RAD-068_FINAL_REPORT_2026-10-22.md |
| `docs/RAD-068_PART1_REPORT_2026-10-22.md` | done completion_evidence: RAD-066, RAD-068 |
| `docs/RAD-068_PART2_REPORT_2026-10-22.md` | done completion_evidence: RAD-068 |
| `docs/RAD-068_PART2_TEXT_CHANGES_2026-10-22.md` | byte-identical protected Markdown: docs/RAD-068_PART2_REPORT_2026-10-22.md |
| `docs/RAD-068_PART3_REPORT_2026-10-22.md` | done completion_evidence: RAD-068 |
| `docs/RAD-069B2A_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/RAD-077_PROPOSAL_2026-10-24.md |
| `docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md` | non-Markdown: src/features/platform/pelvis-geometry-drift.test.ts |
| `docs/RAD-069C1_REPORT_2026-10-24.md` | done completion_evidence: RAD-044 |
| `docs/RAD-069C2_PHASE2_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/RAD-069C2_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/RAD-069_DB_DAY_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/RAD-072_PART1B_HASHES_2026-10-23.md` | byte-identical protected Markdown: docs/RAD-072_PART1B_REPORT_2026-10-23.md |
| `docs/RAD-072_PART1B_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ARABIC_TERMINOLOGY.md |
| `docs/RAD-072_PART1_HASHES_2026-10-23.md` | byte-identical protected Markdown: docs/RAD-072_PART1B_HASHES_2026-10-23.md |
| `docs/RAD-072_PART1_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ARABIC_TERMINOLOGY.md |
| `docs/RAD-072_PART2A_HASHES_2026-10-23.md` | byte-identical protected Markdown: docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md |
| `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2B_HASHES_2026-10-23.md` | byte-identical protected Markdown: docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md |
| `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2C_HASHES_2026-10-24.md` | byte-identical protected Markdown: docs/RAD-072_PART2C_PHASE_B_REPORT_2026-10-24.md |
| `docs/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2C_PHASE_B_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-074_QA_TOOLING_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| `docs/RAD-075_HOUSEKEEPING_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md |
| `docs/RAD-077_PROPOSAL_2026-10-24.md` | byte-identical protected Markdown: docs/RAD-077_REPORT_2026-10-24.md |
| `docs/RAD-077_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| `docs/RAD-080_PROPOSAL_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| `docs/RAD-081_100_SETTINGS_2026-10-25.md` | non-Markdown: src/features/evaluation/forty-inch-sid.test.ts |
| `docs/RAD-081_CHANGES_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| `docs/RAD-081_OWNER_ITEMS_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| `docs/RAD-081_OWNER_ITEMS_CHANGES_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-081_OWNER_ITEMS_2026-10-25.md |
| `docs/RAD-081_REPORT_2026-10-25.md` | byte-identical protected Markdown: docs/FORTY_INCH_SID_REPORT_2026-10-30.md |
| `docs/RAD-085_AUTH_FK_REPORT_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_DB_DAY_COMPLETED_2026-10-28.md |
| `docs/RAD-085_CRLF_READINESS_REPORT_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_DB_DAY_P1.md |
| `docs/RAD-085_D3_REPORT_2026-10-27.md` | byte-identical protected Markdown: docs/RAD-085_SECURITY_REVIEW_2026-10-27.md |
| `docs/RAD-085_DB_DAY_COMPLETED_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_DB_DAY_P1.md |
| `docs/RAD-085_ERASURE_MATRIX_2026-10-26.md` | byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| `docs/RAD-085_P1_B_COMPLETED_2026-10-29.md` | byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| `docs/RAD-085_P1_USABILITY_A_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_P1_B_COMPLETED_2026-10-29.md |
| `docs/RAD-085_P1_USABILITY_B_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_P1_B_COMPLETED_2026-10-29.md |
| `docs/RAD-085_PLAN_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| `docs/RAD-085_PROMOTION_REPORT_2026-10-27.md` | byte-identical protected Markdown: docs/RAD-085_CRLF_READINESS_REPORT_2026-10-28.md |
| `docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/RAD-085_REPORT_2026-10-27.md` | byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| `docs/RAD-085_SECURITY_REVIEW_2026-10-27.md` | byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| `docs/RAD-085_SEC_FIXES_REPORT_2026-10-27.md` | byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| `docs/RAD-085_SQL_CONTRACTS_2026-10-26.md` | byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| `docs/RAD-086_REPORT_2026-10-31.md` | done completion_evidence: RAD-086 |
| `docs/TERMS_OWNER_DRAFT_2026-10-16.md` | non-Markdown: scripts/qa/pilot-consent-audit.mjs |
| `docs/TERMS_REVIEW_2026-10-16.md` | byte-identical protected Markdown: docs/TERMS_OWNER_DRAFT_2026-10-16.md |

## 8. قائمة المالك وبرومبت الجلسة التالية

نتيجة 2026-11-01 — RAD-089 مغلقة: #188 مدموج مع check وdeploy أخضرين؛ docs:test ناجح في CI مع Docker، فحُسم البند5. مراجعة النقل:53نقلًا بأهداف روابط فقط،13صورة R100، دون حذف، والملفات المحمية ثابتة. اعتمد المالك قرارات الجرد1–4 وتُنفّذ في RAD-090.

راجع Draft وCI الآلي دون افتراض أن نجاح QA محلي يثبت نشر الرأس. لا اشتراك أو polling أو طلب deploy يدوي من الوكيل. راجع عيّنات روابط التقارير والصور وقرارات D1–D4 وRAD-089؛ أعطِ نتيجة الفحص في prompt الدفعة التالية ليكون إغلاق RAD-089 أول commit فيها. سجل إفادة المالك هنا عند وصولها؛ لا PR إغلاق منفصل. باقي إغلاقات المالك ومواقع أدلتها في HANDOFF.

**القائمة الموحدة الوحيدة لقرارات المحتوى المطلوبة:**

1. اعتماد أرشفة DOCS_ARCHIVE_2_REPORT.md وDOCS_CONSISTENCY_REPORT.md وDOCS_MAINT_1_REPORT.md وDOCS_WORKFLOW_REPORT.md وstatus-archive.md مع حفظ الروابط؛ الخمسة غير منقولة الآن.
2. اعتماد دمج اتجاه ROADMAP المفيد في docs/README.md وإزالة منع التقرير والتوجيه المتقادم إلى مرحلة A؛ مواضع القواعد المكررة/المتعارضة موثقة في الجرد. لا يغير ذلك تجميد المنتج أو حالات المهام.
3. اعتماد أرشفة4صور/ملفات المجموعات rad-077 وrad069 وrad080 إلى docs/archive/review/<group>/ مع تفويض تحديث روابط التقارير المحمية؛ التفاصيل والأحجام في الجرد.
4. اعتماد توحيد مواضع ملفات جذر الأرشيف المؤرخة المعلّمة في الجرد بعد حصر قراء الكود/JSON؛ لا نقل patch يقرأها كود.
5. توفير بيئة Docker ذات مساحة تكفي الصور المثبتة ثم نجاح docs:test كاملة قبل الاعتماد؛ لا استثناء اختبار أو تعديل حارس مطلوب. قرار المعالجة البيئية/الاعتماد منفصل عن توصيات المحتوى1–4.

برومبت تالٍ مقترح: «نتيجة مراجعة RAD-089: [نتيجة المالك]. أغلقها أول commit بالأدلة في تقريرها. قرارات الجرد1–4: [اعتماد/تأجيل كل بند]. نفّذ النطاق المعتمد فقط ضمن الدفعة الجديدة، واحفظ bytes وروابط الأدلة، مع Draft فقط وفحوص AGENTS. بقية pending closures: [نتيجة كل فحص وصل]».

## سؤالا AGENTS

1. **هل تغيّر الحكم؟** D2 يغير توقيت ومكان إغلاق المهمة وD3/D4 يحسمان المصدر الواحد؛ D1 يغير مواضع التقارير مع استثناءات الحماية. التغيير مأذون من المالك، لا تخفيف QA أو حكم منتج/طب. جدول§4 يجيب لكل قاعدة اختُصرت أو نُقلت.
2. **هل بقي رابط الدليل الأصلي؟** نعم داخل الشجرة الحالية: كل أهداف Markdown وsource_ref مفحوصة، وتاريخ Git محفوظ، وDECISIONS يحيل إلى أدلته، والوثائق المنقولة لم يتغير سوى أهداف روابطها. الاستثناءات البايتية بقيت في أماكنها.
