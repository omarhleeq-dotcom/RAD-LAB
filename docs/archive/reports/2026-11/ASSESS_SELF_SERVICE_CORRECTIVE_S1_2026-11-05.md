# RAD-105 — S1 التصحيحية (مسودة)، 2026-11-05

## 1. الانحرافات والميزانية
28 مسارًا محددًا قبل التحرير، وروجعت قبل توصيل عدّاء التثبيت: حزمة selfservice-ready تجمع الفحصين الجديدين، والمسار المحرر هو rad062-db-day.mjs؛ لا زيادة في العدد؛ [الاستثناء الضيق](../../../DECISIONS.md#assess-self-service-corrective-s1-owner-2026-11-05) مسجل في أول commit تصحيحي. التقرير السابق محفوظ كتاريخ.

## 2. المنجز والمستبعد
Verified: الرأس المحلي والبعيد يطابقان الرأس المراجع؛ #242 Draft على main، وC3 محفوظ. تصحيح SQL قبل تغيير توقع التمرين؛ C1/C2 أعيد تنفيذهما ومرشحهما ينتظر دليل CI والمراجعة. S2 والعمل الحي خارج النطاق.

## 3. حالة المهمة
RAD-105 review/reviewer؛ تفويض المالك رفع العائق المحدد فقط، دون استثناء لفحوص أخرى أو ترحيلات مطبقة. قبول المراجعة لم يُسجل.

## 4. التغييرات المشتركة وScale
Verified: أُعيد شرط lifecycle_version=1 أولًا؛ digest ‏P5 أصبح `85b76e3b08a04794e9bcc384c0b7c31ed0e375f445f52a2a92cf5a57689857da`، والترحيل مطابق له بايتًا ببايت.

| البصمة | P0 → المرشح المصحح | السبب |
|---|---|---|
| functions | `5fcd5e713c9e39b74f39ba6a969080d5` → `5105994588a3fb40c96749f0add08e1d` | start_v2 وhealth_v1 وسبع دوال مضافة؛ health يحتفظ بعزل v1 |
| relations | `95ae71fb2b1b1c45707cb6247ef6e95a` → `fd59fc5eb938c70934f4cf5517c2dae0` | جدولان مضافان فقط؛ أُعيد قياسها ولم تتغير عن المرشح المسحوب |
| marker | علامة P0 → `pilot-v1:2bcdc4dd83982e06f57adb70be8cf7597d18f242ce62e5d09b734ddb3aec2629` | بايتات ترحيل P5 المصحح وفحص بصمته؛ ترحيلان وخمسة خلفاء وحزمة جاهزية ذات معاملتين؛ تصحيح إحالة تعليق فحص النوافذ |

Verified: ليست إعادة استخدام لبصمات مسحوبة؛ أزيلت pins أثناء المعايرة واستُخرجت القيم من مخطط الإنتاج الاصطناعي. تغيرت قوائم المانيفست وعلامته فقط في اختبارات frontend-manifest وrad062-supervisor-catalogue وselfservice-p2؛ بصمة M09 الأصلية ثابتة.
Scale: حدود التصميم والقرارات وC3 محفوظة؛ لا صلاحية عامل سادسة أو منح جدول، وgate successors صارمة؛ فحصا الإيقاف يبقيان CLOSED.

## 5. الطب والتقييم
لا محتوى طبي أو درجات جديدة؛ عزل عدادات v1 عن v2 هو التصحيح المطلوب.

## 6. التحقق
Verified: اختبارات العدادات والشاهد والصلاحيات المستقلة وP1/P5 ‏20/20، وtsc وlint للملف الجديد؛ فحوص الوثائق والحالة وsync مرتين ناجحة.
Verified: معايرة embedded واختبار هوية البايتات 2/2 بعد التصحيح؛ typecheck وlint والبناء ناجحة (تحذيران قائمان في simulator-layout-audit).
Not run (لم يكتمل محليًا): التمرين الكامل توقف داخل تجهيز مدخلات Docker بعد نجاح الشاهد وACL/TLS وتركيب المسارين؛ cleanup=true، لا تأكيد مخفف. Supabase 17.11 غير متاحة محليًا بعد فشل فك صورتها سابقًا بسبب المساحة؛ التمرين الكامل وDB lane مطلوبان في CI.
Verified: الاختبارات المعنية 79 ناجحة في 9 ملفات؛ بعد التقوية أُعيدت حالات العقد والترقية 4/4؛ health:source بلا أخطاء وhealth:test ‏9/9.
Verified: `CI_TEST_LANE=unit npm run check` ناجح (2596/2596)؛ بعد توصيل العدّاء نجحت ست حالات ترقية/مانيفست، واختبار explicit-latest embedded القائم دون تعديل، وtsc وhealth:source؛ checkRows مطابق للأصل.
Not run (وقت إعداد الدفعة): CI للرأس المعدل؛ دليل الرأس النهائي ونتائجه يُسجلان في [وصف PR وفحوصه](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242/checks)، ولا يُستنتجان من نجاح embedded.
Not run (خارج الإذن): SQL حي، سحابة، أسرار، Variables، نشر يدوي، دمج وReady.

Verified: CI أكمل تمرين العامل بـPASS/complete وcleanup=true، وتمرين صورة التصحيح؛ توقف بعدها docs:test لأن عدّاء التثبيت لم يمرر CLOSED للخلفاء. صُحح الإدخال بسياسة التثبيت الصريحة دون تعديل checkRows أو توقعات الاختبارات؛ يلزم CI جديد.

## 7. المفتوح
المرشح المصحح يحتاج اكتمال CI وقبول المراجعة؛ لا تعارض عقد محمي إضافي مثبت. P0 الحية لم تتغير؛ S2 بعد نجاح C1/C2 وقبول المراجعة فقط.

## 8. قائمة المالك والنص التالي
التفويض والقرارات مسجلة؛ لا إعادة سؤال عنها. نص S2 المشروط:

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
