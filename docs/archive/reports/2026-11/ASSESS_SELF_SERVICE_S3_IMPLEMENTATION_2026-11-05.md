# RAD-105 — S3: الواجهة وعقود القراءة، 2026-11-05

## 1. الانحرافات والميزانية
38 مسارًا ضمن الميزانية المعلنة والمراجعة قبل التوسع؛ توسعة read-only ضيقة ثم ثلاثة عقود قراءة إضافية بإذن المالك بعد مراجعة العقود معًا.
Verified: قبول S2 عند `bb56661ea9f7c330e917f424af549a1b34731957` مسجل في أول تحديث S3؛ محفوظ، لا إعادة طلب اعتماد المنتج.
المسار السابق وعطل البيئة موثقان في [تقرير الاستعادة/STOP](ASSESS_SELF_SERVICE_S3_2026-11-05.md) ولم يُعدّل؛ التفويضان في [DECISIONS](../../../DECISIONS.md#assess-self-service-s3-read-owner-2026-11-05) و[استكمال القراءات](../../../DECISIONS.md#assess-self-service-s3-reads-owner-2026-11-05).

## 2. المنجز والمستبعد
Verified: شاشات C5 مركبة خلف كشف مخطط REST الحالي؛ الغياب/الإخفاء/تعذر الكشف يعرض unavailable دون جسّ RPC مفقودة.
Verified: إذن كل الطلاب صفحات للمشرفين، OFF افتراضيًا وقابل للسحب؛ المالك ينشر الإصدارات المراجعة المثبتة دائمًا، وتمييز الاختبار العام عن امتحان المجموعة.
Verified: جدولة own-assignment ساعتان/7 أيام بتوقيت Asia/Amman، توصية الخادم X of Y، وقت إضافي محدود، ومنح بديل من أهلية موثوقة فقط. النافذة المغلقة للقراءة فقط.
Verified: Resume بتأكيد مطابق للمالك والبديل المعين فقط؛ قبول القاعدة المستعادة للمالك فقط. لا إطلاق تلقائي لـACTIVE-at-stop أو حجز تاريخي مجهول.
Verified: حالات الطالب القادمة/المفتوحة/النشطة/المسلمة/التصحيح/المصححة/الفائتة/المنتهية/الملغاة، والفارغ/التحميل/الخطأ؛ رابط السجل الحالي.
مستبعد: S4 وكل إجراء حي أو أسرار/Variables أو provider/cron أو نشر يدوي أو merge/Ready.

## 3. حالة RAD-105
review/reviewer في Draft #242 على main؛ S1/S2 مقبولتان، وS3 تنتظر فحوص الرأس المسلّم وقبول المراجعة. S4 وP7 لم تبدأ؛ لا إغلاق للمهمة.
Verified: البداية النظيفة `9056baa`، وS2 وorigin/main سلفان؛ لا rebase/force-push أو فقد عمل لاحق.

## 4. المشتركات وScale
Verified: إعادة استخدام AuthoringEntry/QuestionImport، consent، P1/emergency scopes، قوالب الجدولة، controllers/parsers للمسارات الثلاثة وHistoryPanel؛ لا مُثبّت نشر أو كاتب درجات جديد.
Verified: ترحيلان forward فقط، `20261105000400_rad105_eligibility_read.sql` و`20261105000500_rad105_ui_reads.sql`، يضيفان أربع دوال دون تغيير دالة أو علاقة قائمة أو منح جدول.
- `attempt_eligibility_page_v1`: issuer نفسه، read scope، consent/revocation/group، نوافذ وإصدار متاحان؛ captured ACTIVE وheld_at/state/expiry/granted/حد الثلاث. بيانات student/session/eligible/reason/serverTime فقط.
- `student_exams_page_v1`: أهداف الطالب نفسه ومحاولته الأخيرة بساعة الخادم؛ إشارة grant إيجابية من DB تتيح Start جديدًا مع بقاء القديم held، لا استنتاج من failed/held.
- `history_page_v2`: صفحات طالب فقط، تفويض DTO والرؤية حرفيًا إلى result_v2، ثم العرض في السجل الموجود.
- `selfservice_metadata_page_v1`: إصدارات v2 المراجعة المثبتة المرتبطة، وmetadata التكليفات الخاصة بالنطاق؛ دون أسئلة أو أجوبة أو مفاتيح أو درجات.
Scale: keyset UUID ثابت، حد الخادم100 وصفحات UI50؛ حدود S2: 7 أيام/86400 ثانية/10 تعديلات/3 منح محفوظة. الرفع يحتاج مراجعة schema/load/privacy.
وظائف الإنتاج: `4c2ffc83edb72b5bb168c7c499c062ad` → `533f4f22d9f07200e6c4dbab596b4dca` لأربع إضافات فقط؛ relations أعيد قياسها وتبقى `5c45889099a878446fd3a16a9569940f`.
Candidate: `pilot-v1:ddb4de0e9e50414239f8ebc0046d84608579928bbf7f3543721cb0c1ce960e4b` بسبب الترحيلين وخليفة catalogue وحزمة ACL إضافية؛ لا إعادة استعمال لمعايرات التطوير.
العلامة الحية P0 وVariable لم تتغيرا. original catalogue وS1/S2 oracles تعمل أولًا دون تعديل؛ طفرات ACL/body/bounds تُرفض بخليفة S3.
بادئات sha256 أدناه؛ القيم الكاملة في frontend-schema.json وdiff، دون تغيير guard availability:
| الحد | قبل → بعد | السبب |
|---|---|---|
| OwnerAssessPanel | 39a70f3b5bb9 → ccd2c6b5c245 | تركيب إدارة S3 |
| AssessPanel | ecdcf10460d5 → 83b2addd50b4 | تركيب الطالب/الإدارة/السجل وإعادة استخدام Runner |
| HistoryPanel | 2a98829cf8b9 → 0a646299ab40 | حقن قارئ v2 دون تغيير الرؤية |
| selfservice/adapter | جديد → 349386506711 | كشف المخطط وRPC المعتمدة |
| selfservice/runner | جديد → 587bd24e0495 | ربط v2 بالقوالب القائمة دون إعادة ترتيب |
| selfservice/SelfServiceSession | جديد → cc78d310d3cf | جلسة/رضا/قدرات وإلغاء الربط القديم |
| EmergencySession consumer | f94e16881bd8 → d542f380aa6a | تركيب الاستعادة خلف تفويض المالك/البديل |
Verified: SQL المطبقة وS1/S2 والشاهد/health وC3 وحزم الهاتف بلا فرق عن الرأس المقبول؛ لا assertions/goldens/timeouts خُففت.
توقع P2 للخمول استُبدل بالحارس المأذون ونقاط التركيب المسماة فقط؛ استُثني harness الاصطناعي المسمى، وRPC محصورة في محولين مثبتين. تغييرات name/erasure اختبارات إحالة خليفة فقط.

## 5. الطب والتقييم
Verified: لا محتوى طبي أو scoring جديد؛ العرض يحافظ على ترتيب الأسئلة والخيارات الذي يرسله الخادم. Fixtures هندسية قائمة، ليست قبولًا طبيًا.
أول امتحان حقيقي XLSX لدى المالك عبر QuestionImport؛ لا الملف أو نص العناصر في Git. الإثبات الحي للمسارات الثلاثة يبقى P7 خطوة13.

## 6. التحقق — استعادة البيئة منفصلة عن المنتج
Verified: الاتصال استعيد بإذن شبكة الأمر؛ proxy/CA/TLS/auth وGit config محفوظة. Next native cache على المضيف رفض الصلاحيات؛ typecheck/build نُفذا داخل حاوية Node محلية، بلا نشر.
Verified: اختبارات S3 ذات الصلة15/15: صلاحيات موجبة/سالبة، سحب/رضا/هدف، سقف وصفحات، stale revision/read، مهلة/window، capture/unknown/non-active، والمسارات الثلاثة عبر المحولين الفعليين.
Verified: معايرة production-fixture PG18 النهائية وخليفة الجاهزية وطفرات S3 ناجحة؛ كل أوراكل S1/S2 الأصلي سبقها ولم يتغير.
Verified: EN/AR390/1440، 64 تدقيق mounted browser/axe/overflow و196 تحققًا، بما فيها المالك/المشرف/الطالب/السجل/البديل وثلاث عائلات runners؛ لا أخطاء تشغيل. إضافة النافذة المغلقة: أربعة تدقيقات موجهة و80 تحققًا؛ لم تُكرر تدقيقات ناجحة بلا تغيير معني.
Verified: الصور EN1440 وAR390 فُحصت بصريًا؛ الصور الكاملة محلية /tmp فقط. harness جلسة وRPC اصطناعيتان مع منع الشبكة الخارجية؛ ليس إثبات إنتاج أو هاتف حقيقي.
Verified: health:source بلا أخطاء/new clones، health:test9/9، والبناء العادي نجح. أدلة check/unit وPages/size وDB الكاملة موثقة في وصف Draft بعد اكتمالها.
Not run محليًا: معايرة Supabase17 بعد فشل استخراج الصورة المثبتة بـENOSPC؛ لا صورة بديلة أو skip أو إضعاف. مسار DB الكامل شُغّل؛ إخفاقات البيئة لا تُسجل PASS، والنتيجة النهائية في وصف Draft.
Verified: مرجع نتائج الرأس المدفوع النهائي هو [فحوص #242 ووصفها](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242/checks)، لا نتائج الرأس السابق؛ Deploy المتوقع عند attestation لا يجيز Variable.
Verified: docs:sync مرتان والثانية0، docs:check وstatus:check --require-previous وgit diff --check ناجحة؛ التحذيرات الحجمية قائمة. حفظ alias لعنوان S2 أبقى روابط التقرير القديم صالحة.
Not run: SQL/cloud/Vault/Brevo/cron/إيصال حي، هاتف المالك، merge/Ready؛ كلها خارج الإذن.

## 7. المفتوح والحدود
قبول مراجعة S3 بعد CI؛ S4 مشروطة بذلك. OpenAPI المأذون شرط الكشف؛ المخطط المخفي يبقى unavailable، ورفعه يحتاج سياسة عرض schema مأذونة، لا probing.
القوائم الجديدة تعرض معرفات الحسابات لأن عقودها المأذونة لا تعيد الأسماء؛ لا بحث عام أو قراءة هوية إضافية. النشر يتطلب إصدارًا مثبتًا مرتبطًا؛ لم نُعد بناء مسار التثبيت.
لم يُختصر حكم قائم: هل تغير الحكم؟ لا. هل بقي رابط دليله الأصلي؟ نعم؛ التقارير السابقة والقرارات والفحوص محفوظة.

## 8. قائمة المالك والنص التالي
لا قرار منتج جديد مطلوب. التالي مراجعة S3 ثم النص المشروط أدناه؛ لا تبدأ S4 قبل تحقق شروطه، ولا إذن حي ضمنه.
```text
Mode: implement — S4 of 4, RAD-105, existing Draft PR #242 only.
Prerequisite: S3 is complete, final pushed-head CI passes, and coordination review
accepts S3. Verify current remote state and preserve subsequent legitimate work.
Otherwise STOP. Keep #242 Draft on main; merge origin/main only if needed,
no rebase, force-push, new PR, merge or Ready. Declare exact paths/budget first.
Read AGENTS, HANDOFF, RAD-105 status, TASK_PROMPT, design §12, S1 original and
corrective reports, S2/S3 reports, applicable DECISIONS and the P7 runbook.
Implement S4 only: approved items 1/6/7/10, C6 audits, P7 update and C7 report.
Offline scripts default to dry-run. Daily encrypted DB dump: private bucket,
bounded retention/failure alert, separate least-privilege assess_backup role,
credential only in Secret Manager. Prove complete dump/restore and exact read
grants without write/admin privileges before any later live activation.
Post-stop Scheduler failure notices <=1/hour and say stop may be intentional;
DB size alert at 70% of plan limit via existing alert channels. Investigate source
connection restrictions first; STOP/report options for paid features or any cost
increase. Enable nothing. Preserve S3 UI, S2 notices OFF/consent/targeting/dedup,
C1/C2 lifecycle-v1 health and strict witnesses, C3, protected assertions, applied
migrations, group scope, erasure, phone packets and existing server shuffles.
Complete relevant EN/AR390/1440 browser/axe/family audits; reuse passing evidence
unless relevant changes or unresolved concerns justify rerunning it. Run relevant
tests and repository checks/build; docs:sync twice, docs:check,
status:check --require-previous, git diff --check; verify final pushed-head CI.
Explain legitimate pins/markers; STOP on conflicting authority, unexplained
fingerprints, another unauthorized protected-contract change, live/secret need.
No live SQL/cloud/Vault/Brevo, secrets, Variables, provider/cron activation,
manual deployment, merge or Ready. Expected Deploy blocking authorizes no change.
Arabic S-STD-1 sections 1–8 <=150 lines, Verified/Inferred/Not run with reasons;
accurate status and Draft description. Leave a conditional owner P7 prompt only.
First real exam stays owner-held XLSX via QuestionImport, never Git; live proof
of questions/mixed/full-practical remains mandatory at P7 step 13.
```
