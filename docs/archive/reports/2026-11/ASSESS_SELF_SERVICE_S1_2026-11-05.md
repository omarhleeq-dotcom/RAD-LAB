# RAD-105 — S1 (مسودة متوقفة)، 2026-11-05

## 1. الانحرافات والميزانية
الهدف: القرارات والخطة وC1/C2 على فرع #242 فقط. الميزانية الأصلية 23 ملفًا، روجعت قبل الإضافة إلى 24 لتعريف أنواع المولد؛ لا استثناء لقواعد Knip.
STOP: اصطدمت الترقية بفحص قائم لا يسمح الطلب بتغيير توقعه؛ سُحبت كل تغييرات C1/C2 البرمجية إلى حد ما قبل الترقية. المحصلة الحالية توثيق فقط فوق C3 السابق.

## 2. المنجز والمستبعد
Verified: [#241](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/241) مدموج؛ [#242](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242) Draft وقاعدته main؛ merge commit من origin/main دون rebase دُفع.
Verified: [القرارات](../../../DECISIONS.md#assess-self-service-hardening-owner-2026-11-05) مرتبطة من القرارات الثلاثة السابقة، والخطة في [التصميم §12](../../../ASSESS_SELF_SERVICE_DESIGN.md#12-current-hardening-and-delivery) ووصف PR.
C1/C2 غير مكتملين وغير مفعّلين في الرأس الحالي؛ C3 محفوظ. S2–S4 والعمل الحي والدمج وReady خارج الجلسة.

## 3. حالة المهمة
RAD-105 blocked/owner؛ رفع العائق في §7 مطلوب قبل إعادة C1/C2 ثم S2. الأدلة المرشحة محفوظة في تاريخ فرع PR، وليست مخططًا مطبقًا.
P0، Verified (إفادة المالك فقط بتاريخ 2026-11-05): فحص الإنتاج 11/11 ناجح، `functions=5fcd5e71…` و`relations=95ae71fb…`، وضبط `PILOT_SCHEMA_VERIFIED` إلى `pilot-v1:466390675b4ac3c32c56c242ec02eeebfe5a745f7bfcc37f57b955576fb23d19`.
Not run (خارج الإذن): إعادة هذا التحقق حيًا مني؛ لا عناوين أو معرّفات محفوظة في الدليل.

## 4. التغييرات المشتركة وScale
Verified: الترحيلات المطبقة والفحوص الأصلية وحزم الهاتف بقيت بايتًا ببايت. تغييرات الترقية واختبارات المانيفست الثلاثة سُحبت كلها؛ العلامة الفعلية للرأس تبقى P0.
القيم التالية معايرة مرشح مسحوب، وليست pins مفعلة:

| البصمة | قبل → مرشح بعد | السبب المثبت محليًا |
|---|---|---|
| functions | `5fcd5e713c9e39b74f39ba6a969080d5` → `16be493671c8050ffa9bdb0e229198b2` | start_v2 وhealth_v1 فقط بين القديمة، وإضافة سبع دوال P1/P5 |
| relations | `95ae71fb2b1b1c45707cb6247ef6e95a` → `fd59fc5eb938c70934f4cf5517c2dae0` | إضافة assignment_windows وrestore_epoch فقط |
| pilot-v1 | P0 أعلاه → `pilot-v1:b1b4f90e5da90ba789a2be5ad66bf991790ff1234d1f86f4b7450e2bcb8170e1` | ترحيلان وخمسة خلفاء وفحصا جاهزية؛ أزيلت من المانيفست الحالي |

Verified: المراجع العشرون تصنّف إلى 16 فحص حالة، مرجعين لجرد الجدول، وفحصي إيقاف طارئ يبقيان مغلقين دائمًا؛ المرشح استخدم تصريحًا صريحًا في الاتصال نفسه بلا default متساهل.
Scale: الحدود الأصلية محفوظة؛ النسخ اليومي المخطط بدور `assess_backup` بأقل صلاحيات وإثبات الاستعادة في S4، لا تفعيل الآن.

## 5. الطب والتقييم
Verified: لا نص طبي أو محتوى امتحان أو منطق درجات جديد؛ أول امتحان XLSX لدى المالك عبر QuestionImport، لا Git. المسارات الثلاثة وخلط الخيارات محفوظة.

## 6. التحقق
Verified على المرشح المسحوب: 77 اختبارًا معنيًا عبر 8 ملفات؛ اختبارا byte identity وembedded بعد تقوية الإثبات نجحا؛ لا ادعاء نجاح للحالات غير المختارة.
Verified على المرشح: طفرات ACL وgrant option وجسم start وإعداد health وصلاحيات جدول وRLS وقيد نافذة وصف شاهد وحالة بوابة خاطئة/مفقودة/متعددة/تصريح ناقص تُرفض.
Verified على المرشح: typecheck وlint والبناء وcredits ‏19/19؛ الوحدة 2595 ناجحة، واختبار adapter تجاوز مهلة أثناء التوازي ثم نجح منفردًا في ثانيتين دون تعديل؛ health:source بلا أخطاء وhealth:test ‏9/9.
Not run (مساحة Docker): Supabase 17.11 المحلية؛ فشل فك الصورة بـno space left on device، دون صورة بديلة أو تخفيف الاختبار.
Verified عبر [CI المرشح](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41973403138): build وdocs ناجحان، وDB فشل في تمرين العامل عند acl-tls قبل DB lane الجديدة. Deploy توقف عند بوابة marker بالسبب المتوقع.
Not run (توقف المسار قبلها): DB lane الكاملة ومعايرة Supabase للمرشح؛ لا توصف C1/C2 بأنهما مكتملان.
Verified على حد التسليم بعد السحب: docs:sync مرتين (الثاني 0)، docs:check، status:check --require-previous وgit diff --check؛ شجرة الكود تطابق حد ما قبل الترقية بايتًا ببايت.
Not run (S4): browser/axe/family EN/AR390/1440. Not run (خارج الإذن): SQL حي، Google Cloud، Vault، Brevo، Variables.

## 7. المفتوح
Verified: `scripts/assess/rad085-worker-rehearsal.mjs:247` يطابق نتيجة `health_v1` حرفيًا مع `{failed,alert,overdue,purgeDue}`؛ المانيفست يجعل التمرين يطبق P5، وهي تضيف `witness` للنتيجة. CI سجّل assertion-failed في acl-tls.
رفع العائق: إذن صريح لاستثناء توقع health من حظر تغيير الفحوص، مع اختبار مستقل يثبت حقول الشاهد وحدود الصلاحية، ومراجعة بقية تمرين الترقية قبل استئناف C1/C2؛ أو تصميم متوافق يحافظ على العقد القائم ويُراجع أولًا.
لم أُحدّث التوقع ولم أتجاوز التمرين أو أخفف CI. النص التالي لـS2 محفوظ حسب الطلب، لكنه ممنوع حتى تُستكمل C1/C2 بعد رفع العائق.

## 8. قائمة المالك والنص التالي
القرارات والخطة لا تحتاج إعادة سؤال؛ البنود 1–7 و9 معتمدة، 8 مرفوض، 10 تحقيق أولًا مع STOP للكلفة ودون تفعيل. المطلوب قبل المتابعة هو رفع عائق الفحص المحدد في §7؛ لا Variable الآن.
النص الدقيق لـS2 بعد رفع العائق وإكمال S1:

```text
Mode: implement (session 2 of 4), RAD-105 Assess self-service, Draft PR #242 only.
Prerequisite: do not start S2 until the S1 health-contract STOP is explicitly resolved
and C1/C2 are reimplemented with green CI; verify this first, otherwise STOP.
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
