# RAD-105 — S1 التصحيحية (مسودة)، 2026-11-05

## 1. الانحرافات والميزانية
28 ملفًا بالضبط؛ روجعت المسارات قبل كل إعادة توزيع: جُمعت حزمة الجاهزية، وأُدمج الجرد في المولد، وبقيت حالات health مستقلة داخل ملف الترقية. أتاح ذلك عدّاء CLOSED وتثبيت مسار C1 في اختبارَي الاسم والمحو دون تجاوز السقف.
[التفويض الضيق](../../../DECISIONS.md#assess-self-service-corrective-s1-owner-2026-11-05) في أول commit تصحيحي adf7740؛ التقرير السابق لم يُعدّل. المسارات النهائية:
```text
docs/ASSESS_P7_LAPTOP_RUNBOOK.md
docs/ASSESS_SELF_SERVICE_DESIGN.md
docs/DECISIONS.md
docs/HANDOFF.md
docs/archive/reports/2026-11/ASSESS_SELF_SERVICE_CORRECTIVE_S1_2026-11-05.md
docs/archive/reports/README.md
docs/project-status.md
scripts/assess/rad062-db-day.mjs
scripts/assess/rad085-worker-rehearsal.mjs
scripts/assess/selfservice-gate-checks.d.mts
scripts/assess/selfservice-gate-checks.mjs
scripts/pages/frontend-schema.json
src/features/assess/rad062-erasure-operations.test.ts
src/features/assess/rad062-name.test.ts
src/features/assess/rad062-supervisor-catalogue.test.ts
src/features/assess/selfservice-p2.test.ts
src/features/assess/selfservice-promotion.test.ts
src/features/deployment/frontend-manifest.test.ts
supabase/checks/selfservice-assess-history-ready.sql
supabase/checks/selfservice-assess-mixed-ready.sql
supabase/checks/selfservice-assess-practical-ready.sql
supabase/checks/selfservice-assess-retention-ready.sql
supabase/checks/selfservice-rad085-review-ready.sql
supabase/checks/selfservice-ready.sql
supabase/migrations/20261105000100_rad105_windows.sql
supabase/migrations/20261105000200_rad105_witness.sql
supabase/staged/self-service/MANIFEST.json
supabase/staged/self-service/p5-witness.sql
```

## 2. المنجز والمستبعد
Verified: البداية من الرأس المراجع 0935365 بعد تطابق المحلي والبعيد؛ #242 Draft على main، دون إعادة كتابة التاريخ أو فقد عمل لاحق. C3 والقرارات محفوظة.
Verified: أُصلحت عدادات v1 قبل توقع التمرين؛ أُعيدت C1/C2 وأُثبتتا في CI. لا S2، ولا SQL حي أو سحابة أو أسرار أو Variables أو نشر يدوي أو دمج أو Ready.

## 3. حالة المهمة
RAD-105 review/reviewer؛ نجاح C1/C2 لا يعني تطبيقهما حيًا أو إكمال RAD-105. قبول المراجعة لم يُسجل؛ S2 مشروطة به وبنجاح C1/C2.

## 4. التغييرات المشتركة وScale
Verified: شرط lifecycle_version=1 محفوظ للعدادات الأربعة؛ digest ‏P5 ‏`85b76e3b08a04794e9bcc384c0b7c31ed0e375f445f52a2a92cf5a57689857da`، والترحيل مطابق للمصدر المصحح بايتًا ببايت.

| البصمة | P0 → المرشح المصحح | السبب |
|---|---|---|
| functions | `5fcd5e713c9e39b74f39ba6a969080d5` → `5105994588a3fb40c96749f0add08e1d` | start_v2 وhealth_v1 وسبع دوال مضافة؛ health يحتفظ بعزل v1 |
| relations | `95ae71fb2b1b1c45707cb6247ef6e95a` → `fd59fc5eb938c70934f4cf5517c2dae0` | جدولان مضافان فقط؛ أُعيد قياسها ولم تتغير عن المرشح المسحوب |
| marker | علامة P0 → `pilot-v1:2bcdc4dd83982e06f57adb70be8cf7597d18f242ce62e5d09b734ddb3aec2629` | بايتات ترحيل P5 المصحح وفحص بصمته؛ ترحيلان وخمسة خلفاء وحزمة جاهزية ذات معاملتين؛ تصحيح إحالة تعليق فحص النوافذ |

Verified: عُيّرت القيم من جديد، وأثبتها PG18 وSupabase17؛ لا إعادة استخدام للمرشح المسحوب. ترحيلان وخمسة خلفاء وحزمة جاهزية بمعاملتين؛ جمع الحزمتين بايتًا ببايت لم يغير تيار hash للعلامة، لأن أسماء checks لا تُهشَّم.
Verified: تغييرات الاختبارات القديمة هي قوائم/علامة المانيفست في frontend-manifest وrad062-supervisor-catalogue وselfservice-p2، ومسار خليفة واحد في rad062-name وrad062-erasure-operations؛ فحوص الاسم والمحو والبايتات والهاتف بقيت كما هي.
Verified: الأصل SQL/الترحيلات المطبقة وحزم الهاتف وC3 مطابقة للأصل. عدّاء التثبيت يعلن CLOSED صراحة ويرفض الإعداد المتعارض ويستعيد السابق؛ checkRows لم يتغير. الخلفاء المباشرون يرفضون غياب/فساد/تعارض التوقع وصف البوابة المفقود/المتعدد/المشوّه؛ فحصا الإيقاف يبقيان CLOSED.
Scale: لا صلاحية عامل سادسة أو منح جدول؛ حدود التصميم محفوظة. علامة P0 الحية والـVariable لم تتغيرا؛ لا تضبط المرشح قبل دليل P7.

## 5. الطب والتقييم
Verified: لا محتوى طبي أو منطق درجات جديد. الإصلاح لعدادات تشغيلية معزولة حسب lifecycle؛ XLSX يبقى لدى المالك ولا يُرفع، وrandom_pool v2 والمسارات الثلاثة محفوظة.

## 6. التحقق
Verified: pre-P5 تطابق حرفي لأربعة حقول؛ v1/v2 من إصدارات صحيحة تعطي 1 لكل عداد قبل/بعد P5؛ إزالة الشرط اصطناعيًا تعطي 2 وتفشل الأوراكل. تقدم الشاهد لا يغير العدادات.
Verified: توقع التمرين المصرح به يتحقق من الحقول الخمسة فقط، مفاتيح الشاهد كلها، epoch مطابق، seq +1/+2، حدود ساعة DB، acceptedAt وcredentialValidUntil من القاعدة؛ لا تجاهل لحقول زائدة.
Verified: أدوار غير مخولة لا تستدعي health ولا تقرأ restore_epoch؛ الدور المقيد يملك خمس عمليات بالضبط؛ missing/malformed/stale witnesses توقف enforcing قبل maintain/claim. ACL/TLS/revocation/redaction/cleanup الأصلية محفوظة.
Verified محليًا: 79 حالة ذات صلة، ثم حالات التقوية والتوصيل والمسار؛ check في unit lane ‏2596/2596، tsc/lint/build، health:source بلا أخطاء وhealth:test ‏9/9. الحالات غير المختارة محليًا ليست دليل نجاح لها.
Verified: [CI للرأس البرمجي d119316](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41982077194) أخضر: unit/build/docs/db/check؛ DB lane كاملة 1105/1105 في 126 ملفًا، ومعايرة البصمات متطابقة في embedded وSupabase17. التمرين الكامل PASS/complete وcleanup=true، وتمرين صورة التصحيح وdocs:test مكتملة بلا تخفيف أو skip.
Verified: النتيجة النهائية للرأس المسلّم بعد commit التقرير تُوثَّق في [فحوص #242 ووصفه](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242/checks). Deploy يظل محظورًا عند Require verified pilot schema للسبب المتوقع، لا طلب لتغيير Variable.
Verified: docs:sync مرتين (الثاني 0)، docs:check، status:check --require-previous وgit diff --check. تحذيرا lint قائمان وتحذيرات حجم الوثائق لا تعني فشلًا.
Not run (لم يكتمل محليًا): Docker input-container أوقف التمرين عند recovery-gate بعد نجاح SQL/ACL/TLS، مع cleanup=true؛ Supabase17 تعذر فكها للمساحة. CI المطلوب أعلاه أكمل البيئتين والتمرين والمسار الكامل.
Not run (S4/خارج الإذن): browser/axe/family EN/AR390/1440؛ أي SQL حي أو موارد سحابية أو أسرار أو Variables أو نشر يدوي أو merge/Ready.

## 7. المفتوح
لا عائق شفري متبقٍ لهذه الدفعة بعد CI؛ قبول المراجعة معلّق. صُحح نقص CLOSED في عدّاء التثبيت وتثبيت مساري المانيفست؛ لم يُغيّر عقد محمي آخر. P7 وS2–S4 لم تُنفذ.

## 8. قائمة المالك والنص التالي
C1/C2 جاهزتان للمراجعة في Draft؛ لا إعادة سؤال عن القرارات المسجلة. بعد قبول المراجعة ونجاح فحوص الرأس الحالي فقط، استخدم النص التالي:

```text
Mode: implement (session 2 of 4), RAD-105 Assess self-service, Draft PR #242 only.
Prerequisite: verify corrective S1 C1/C2 pass on the current head and review is accepted;
otherwise STOP before S2. Preserve the corrected lifecycle-v1 health counter scope.
Read AGENTS, HANDOFF, RAD-105 status, ASSESS_SELF_SERVICE_DESIGN §12,
ASSESS_P7_LAPTOP_RUNBOOK, original S1 report ASSESS_SELF_SERVICE_S1_2026-11-05 and
ASSESS_SELF_SERVICE_CORRECTIVE_S1_2026-11-05,
DECISIONS anchors assess-self-service-owner-2026-11-05,
assess-self-service-delivery-owner-2026-11-05,
assess-self-service-review-owner-2026-11-05,
assess-self-service-hardening-owner-2026-11-05,
assess-self-service-corrective-s1-owner-2026-11-05, and current PR #241/#242 state.
Verify base first: if #241 merged, merge origin/main into #242 with a merge commit
(no rebase) if needed and keep base main; otherwise keep stacked, never touch #241.
Preserve S1 C1/C2 and C3. Declare exact file budget before editing; revise before expanding.
Implement S2 DB only: C4 separate all-students quiz (owner always; per-supervisor
owner-granted permission default OFF, revocable/audited; recipients approved AND
Assess-consented resolved server-side at publish), plus hardening items 2,3,4,5,9.
Item 2: default 2-hour window, supervisor-editable, cap 7 days; preserve random_pool v2
server-side option shuffle; provide random-pool recommendation contract for S3.
Item 3: notice only targeted approved/consented students, no content/scores; existing
Brevo RAD-104 Vault/pg_cron/pg_net pattern, independent kill switch OFF by default.
Item 4: bounded audited own-assignment new-attempt grant only for attempts that were
active when emergency stop held them. Item 5: typed Resume for owner and appointed
alternate; Accept restored database owner-only. Item 9: bounded audited per-student
assignment extra time; deadline never past closes_at unless supervisor extends window.
Prove questions, mixed, full-practical in real DB-lane tests, including negative scope,
audit, consent revocation, notice deduplication, held-attempt eligibility and deadline bounds.
No S3 UI mounting or S4 infra, live SQL, GCP, Vault, Brevo calls, Variables, secrets,
merge or Ready. Applied migrations and RAD-059/RAD-062 phone packets byte-identical.
Use successor readiness/fingerprint tests; explain every legitimate S2 fingerprint and
marker change, never relax an existing check/golden/hash to pass. STOP on conflicting
authority, protected-file need, unexplained fingerprint, live action or secret.
Push each green step; docs:sync twice, docs:check, status:check --require-previous,
git diff --check; label Verified/Inferred/Not run with reason; Draft CI except marker block.
Arabic S-STD-1 report order 1–8, <=150 lines, exact S3 prompt. First real exam remains
owner-held XLSX through QuestionImport, never committed; three tracks proven at P7 step 13.
```
