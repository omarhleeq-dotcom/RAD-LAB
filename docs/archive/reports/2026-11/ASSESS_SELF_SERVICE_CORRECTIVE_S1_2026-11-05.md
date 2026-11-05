# RAD-105 — S1 التصحيحية (مسودة)، 2026-11-05

## 1. الانحرافات والميزانية
28 مسارًا محددًا قبل التحرير؛ [الاستثناء الضيق](../../../DECISIONS.md#assess-self-service-corrective-s1-owner-2026-11-05) مسجل في أول commit تصحيحي. التقرير السابق محفوظ كتاريخ.

## 2. المنجز والمستبعد
Verified: الرأس المحلي والبعيد يطابقان الرأس المراجع؛ #242 Draft على main، وC3 محفوظ. تصحيح SQL قبل تغيير توقع التمرين؛ C1/C2 قيد التنفيذ. S2 والعمل الحي خارج النطاق.

## 3. حالة المهمة
RAD-105 in_progress/code؛ تفويض المالك رفع العائق المحدد فقط، دون استثناء لفحوص أخرى أو ترحيلات مطبقة.

## 4. التغييرات المشتركة وScale
إعادة شرط lifecycle_version=1 إلى health_v1؛ تحديث digest المرحلي؛ المعايرة الجديدة مطلوبة قبل أي pin. حدود التصميم والقرارات محفوظة.

## 5. الطب والتقييم
لا محتوى طبي أو درجات جديدة؛ عزل عدادات v1 عن v2 هو التصحيح المطلوب.

## 6. التحقق
Verified: اختبارات العدادات والشاهد والصلاحيات المستقلة وP1/P5 ‏20/20، وtsc وlint للملف الجديد؛ فحوص الوثائق والحالة وsync مرتين ناجحة.
Not run (قيد التنفيذ): الترقية، توقع التمرين المصرح به، التمرين الكامل وDB lane وcheck/build وCI النهائي.
Not run (خارج الإذن): SQL حي، سحابة، أسرار، Variables، نشر يدوي، دمج وReady.

## 7. المفتوح
C1/C2 قيد التنفيذ؛ لا بصمات مرشح قديم معتمدة. P0 الحية لا تتغير. S2 بعد النجاح وقبول المراجعة فقط.

## 8. قائمة المالك والنص التالي
التفويض والقرارات مسجلة؛ لا إعادة سؤال عنها. نص S2 المشروط:

```text
Mode: implement (session 2 of 4), RAD-105 Assess self-service, Draft PR #242 only.
Prerequisite: verify corrective S1 C1/C2 pass on the current head and review is accepted;
otherwise STOP before S2. Preserve the corrected lifecycle-v1 health counter scope.
Read AGENTS, HANDOFF, RAD-105 status, ASSESS_SELF_SERVICE_DESIGN §12,
ASSESS_P7_LAPTOP_RUNBOOK, S1 report ASSESS_SELF_SERVICE_S1_2026-11-05,
DECISIONS anchors assess-self-service-owner-2026-11-05,
assess-self-service-delivery-owner-2026-11-05,
assess-self-service-review-owner-2026-11-05,
assess-self-service-hardening-owner-2026-11-05, and current PR #241/#242 state.
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
