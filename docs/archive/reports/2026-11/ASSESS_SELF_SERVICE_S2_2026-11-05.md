# RAD-105 — قاعدة S2 فقط، 2026-11-05

## 1. الانحرافات والميزانية
الميزانية المعلنة 20، ثم 22 لإحالتَي فحص الترقية؛ النهائي 20 مسارًا، دون استخدام README/ACTIVE_DOCS. لا توسيع إلى S3/S4.
Verified: إعادة استخدام authoring/publication links، scope، consent، emergency authorization/audit، ونمط RAD-104. أضيفت قراءة audit مرقمة كي يبقى محلّل الطوارئ v1 حرفيًا.
المسارات النهائية:
```text
supabase/migrations/20261105000300_rad105_selfservice_s2.sql
supabase/manual/selfservice-notify-install.sql
supabase/checks/selfservice-s2-rad085-review-ready.sql
supabase/checks/selfservice-s2-ready.sql
scripts/pages/frontend-schema.json
src/features/assess/selfservice-s2.test.ts
src/features/assess/selfservice-s2-notify.test.ts
src/features/assess/selfservice-promotion.test.ts
src/features/assess/selfservice-p2.test.ts
src/features/assess/rad062-supervisor-catalogue.test.ts
src/features/assess/rad062-name.test.ts
src/features/assess/rad062-erasure-operations.test.ts
src/features/deployment/frontend-manifest.test.ts
docs/DECISIONS.md
docs/ASSESS_SELF_SERVICE_DESIGN.md
docs/ASSESS_P7_LAPTOP_RUNBOOK.md
docs/HANDOFF.md
docs/project-status.md
docs/archive/reports/2026-11/ASSESS_SELF_SERVICE_S2_2026-11-05.md
docs/archive/reports/README.md
```

## 2. المنجز والمستبعد
Verified: #242 Draft على main؛ الرأس الأول `f91cfd0b78c496b3b81e512e37aebdc0d87a3be6` يطابق قبول المراجعة الذي قدّمه المالك، و[CI](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41983840909) ناجح. origin/main سلف للرأس؛ لا merge إضافيًا ولا rebase/force-push.
Verified: C4 والبنود 2/3/4/5/9 قاعدة فقط؛ [العقد التفصيلي](../../../ASSESS_SELF_SERVICE_DESIGN.md#s2-db-contract-offline-promotion-review-pending). لا UI أو بنية S4 أو إجراء حي أو أسرار أو Variables أو إرسال بريد أو Ready/دمج.

## 3. حالة المهمة
RAD-105 review/reviewer؛ S1 مقبولة، S2 تنتظر قبول مراجعتها قبل S3؛ دليل فحوص الرأس في وصف #242. لا ادعاء إغلاق RAD-105 أو تطبيق SQL. [التفويض](../../../DECISIONS.md#assess-self-service-s2-owner-2026-11-05).

## 4. المشتركات وScale
Verified: جمهور all-students مستقل؛ إذن المشرف OFF وقابل للسحب ومدقق، والمالك بلا إذن إضافي. المستلمون approved + privacy/Assess-consented من الخادم، لا opt-in أو عضوية مجموعة.
Verified: افتراضي ساعتين، حد 7 أيام؛ عقد selected/available للتوصية، دون تعديل random_pool v2 أو خلط الخيارات.
Verified: الوقت الإضافي 0–86400 ثانية، 10 تغييرات، deadline≤closes_at؛ التمديد يعيد حساب ACTIVE مع accommodation دون تحرير الحجز أو إحياء محاولة منتهية بالوقت الإضافي.
Verified: دليل انتقال DB يسجل ACTIVE/non-active عند الحجز؛ لا استنتاج من failed/held. ثلاث منح بديلة كحد أقصى لكل تكليف/طالب، مرة لكل محاولة مثبتة؛ القديمة تبقى محجوزة.
Verified: Resume بتأكيد مكتوب للمالك والبديل؛ يبقي ACTIVE-at-stop والحجز التاريخي المجهول. قبول الاستعادة owner-only. audit الجديد له قراءة owner-only؛ قارئ الطوارئ v1 يعيد إجراءاته الثلاثة الأصلية، ومحلله الأصلي مختبر بلا تغيير.
Verified: الإشعارات OFF افتراضيًا، 100 enqueue/دقيقة؛ تحديث موعد غير المرسل، ومنع التكرار بعد الإرسال للتكليف/الهدف نفسه. تحقق الرضا/الموافقة/النطاق تحت الأقفال قبل enqueue؛ لا محتوى أو درجات. request_id لا يثبت الوصول، وطلب pg_net المصفوف لا يمكن سحبه.
Scale: 1000 هدف، صفحات 100، 10 تعديلات، يوم accommodation وثلاث منح؛ الرفع يحتاج مراجعة مخطط/إعداد وأحمال وخصوصية/احتفاظ. لا إعادة محاولة غير محدودة للمزوّد.
البصمات الجديدة قِيست من fixture الإنتاج، لا من تعديل توقع كي يمر الاختبار:
- functions: `5105994588a3fb40c96749f0add08e1d` → `4c2ffc83edb72b5bb168c7c499c062ad`؛ خمس دوال قديمة فقط: start، deadline، window_set، Resume، وقارئ audit العام المتوافق؛ 20 دالة مضافة.
- relations: `fd59fc5eb938c70934f4cf5517c2dae0` → `5c45889099a878446fd3a16a9569940f`؛ خمسة جداول مضافة وست علاقات معدلة: assignments/audience/index، windows/targets/sessions/triggers، appointments/permission، emergency.audit/action.
- Candidate: `pilot-v1:c147c107631b68898e4715c8e3a104bfe6bf9b082950665539c61c8021f4ced1`؛ ترحيل S2 + خليفة كتالوج جديد + فحص S2. كل تغيير body/check أعيدت معايرته؛ معايرات التطوير مستبدلة، لا pins قديمة معاد استخدامها.
Verified: S1 health والشاهد وC3 محفوظة؛ فحوص S1 مستقلة تسبق تطبيق S2. المانيفست يوجّه فحص الكتالوج إلى خليفة S2؛ تعديلات الاختبارات القديمة قوائم/إحالات/marker فقط، دون تخفيف الاسم/المحو/الهواتف أو الأوراكل الأصلي.
علامة P0 الحية وVariable لم تتغيرا؛ Deploy متوقع أن يتوقف عند تصديق المخطط حتى نافذة P7 مأذونة.

## 5. الطب والتقييم
Verified: لا محتوى طبي أو تعديل scoring/credits. استُخدمت fixtures هندسية قائمة؛ ليست مراجعة سريرية. أول امتحان حقيقي يبقى XLSX لدى المالك عبر QuestionImport، ولا نصه أو ملفه في Git.

## 6. التحقق
Verified: الحالات الجديدة 11/11، والمجموعة النهائية 48/48: C4، الرضا/السحب، dedup/reschedule/cancel، extra-time، أهلية الحجز والمسارات الثلاثة. شاهد قفل حقيقي يغيّر deadline أثناء الانتظار ويثبت rollback/رفض الإحياء؛ dispatch يعيد قراءة الموعد والأهلية بعد الأقفال.
Verified: معايرة PG18 المثبتة نهائيًا نجحت مع طفرات ACL/body/RLS/bounds؛ 20 دالة/5 جداول مضافة وخمس دوال/ست علاقات قائمة معدلة فقط. أوراكل S1 بقي ناجحًا قبل S2؛ غير المختار في هذا التشغيل ليس دليل نجاح.
Verified: typecheck/lint (تحذيران قائمان)، build، health:source بلا أخطاء وhealth:test ‏9/9. check الأول 2588/2596، إخفاقاته الثمانية مهلات؛ إعادة ملفاتها تسلسليًا 36/36 دون تغيير مهلة أو golden. البناء الأول فشل ENOSPC ثم نجح بعد استعادة المساحة.
Verified: DB lane المحلية شُغلت بأكملها: 940 نجاحًا، 139 فشلًا، 36 لم تُنفذ بسبب فشل التهيئة؛ ليست PASS. الصورة المثبتة فشلت ENOSPC، مع مهلات توازٍ محلية؛ لا صورة بديلة ولا skip أو assertion معدل. CI المطلوب هو دليل البيئتين الكامل.
Verified: [CI للرأس البرمجي الأول](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/42018215243) اجتاز build/docs/unit وكل تمارين العامل/صورته والأقفال؛ مصدر نتيجة الرأس المسلّم النهائية [فحوص #242 ووصفه](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242/checks). Deploy الأول توقف فقط عند Require verified pilot schema؛ لا نشر حي.
Verified: docs:sync مرتين (0 في الثانية)، docs:check بلا أخطاء، status:check --require-previous وgit diff --check؛ تحذيرات الحجم ليست فشلًا. جميع SQL السابقة وحزم الهاتف وC3 مقارنةً بالرأس المقبول مطابقة للبايتات.
Not run (خارج S2): EN/AR390/1440 browser/axe/family، live SQL/cloud/Vault/Brevo، secrets/Variables، deployment، merge/Ready.

## 7. المفتوح
قبول مراجعة S2 ونجاح فحوص الرأس المسلّم قبل S3؛ S4/P7 لاحقتان. الحجز التاريخي بلا دليل لا يمنح محاولة ولا يُطلق تلقائيًا. تفعيل الإشعارات يحتاج إثبات إيصال فعلي في نافذة مأذونة، لا مجرد request_id.
لم يُختصر حكم قائم؛ هل تغير حكم مختصر؟ لا. هل بقي رابط دليله الأصلي؟ نعم؛ التقارير الأصلية والفحوص وحزم الهاتف محفوظة.

## 8. قائمة المالك والنص التالي
لا إعادة سؤال عن القرارات: 1–7/9 معتمدة، 8 مرفوض، 10 تحقيق مع STOP للكلفة؛ no-expiry وXLSX والمسارات الثلاثة محفوظة. S3 مشروطة بنجاح S2 وقبول مراجعتها، ولم تبدأ هنا.
```text
Mode: implement — S3 of 4, RAD-105, existing Draft PR #242 only.
Prerequisite: S2 DB passes on the current pushed head AND coordination review is accepted.
Verify both independently from current remote state; otherwise STOP before S3.
Read AGENTS, HANDOFF, RAD-105 status, TASK_PROMPT template, self-service design §12
and S2 DB contract, P7 runbook, original/corrective S1 reports and S2 report,
DECISIONS self-service owner/delivery/review/hardening/corrective-S1/S2 entries.
Preserve subsequent legitimate work; keep #242 Draft on main, merge origin/main
if necessary, no rebase or force-push. Declare exact paths/budget before editing.
Implement S3 UI C5 only. Reuse existing authoring/QuestionImport, capability guards,
consent, assignment/results, notification and audit mechanisms; do not rebuild them.
Mount dormant P2 screens behind current schema/capability detection with EN/AR.
Owner: paged per-supervisor all-students permission, default OFF/revocable/audited;
owner always allowed to publish; distinguish all-students quizzes from group exams.
Supervisor: own-assignment schedule default 2 hours/cap 7 days in Asia/Amman;
render random-pool recommendation X of Y, preserve server question/option shuffle.
Provide per-student bounded extra time and new-attempt grant only from authoritative
ACTIVE-at-stop evidence; never infer eligibility from every failed/held attempt.
Typed Resume for owner/appointed alternate; Accept restored database owner-only.
Never automatically release held ACTIVE-at-stop or historical unknown attempts.
Student list: upcoming/open/active/submitted/grading/graded/missed/expired/cancelled,
empty/loading/error states; existing result/history link, no new grading surface.
Preserve S2 notification OFF default and targeted recipient/consent/dedup contract;
no provider/secret/cron activation. Preserve corrected C1/C2 health counters,
strict witnesses, C3, group scope, erasure, applied migrations and phone bytes.
Test positive/negative capabilities, revocation, scopes, stale revisions, window and
deadline errors, held eligibility and all three tracks through actual adapter contracts.
Run relevant tests, required DB lane, check/build, EN/AR390/1440 browser/axe/family
checks appropriate to mounted UI; docs:sync twice, docs:check,
status:check --require-previous, git diff --check; verify final pushed-head CI.
Explain fresh legitimate boundary/schema/marker changes; never reuse pins without
recalibration or weaken original protected assertions. Expected Deploy schema gate
is no authority to change Variables. STOP on conflicting authority, unexplained
fingerprints, secrets/live need, or another unauthorized protected-contract change.
No S4 infra, live SQL/cloud/Vault/Brevo, secrets/Variables, manual deployment,
merge or Ready. Arabic S-STD-1 report sections 1–8, <=150 lines, evidence labels
Verified/Inferred/Not run with reasons, accurate RAD-105 status and Draft description,
exact conditional S4 prompt. Do not start S4. First real exam remains owner-held
XLSX via QuestionImport, never Git; questions/mixed/full-practical at P7 step 13.
```
