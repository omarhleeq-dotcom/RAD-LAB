# RAD-105 — S1 (مسودة)، 2026-11-05

## 1. الانحرافات والميزانية
الهدف: تسجيل القرارات وخطة الجلسات، ثم C1/C2 على فرع #242 فقط. الميزانية الأصلية 23 ملفًا؛ روجعت إلى 24 قبل إضافة `selfservice-gate-checks.d.mts` لتعريف أنواع الاستيراد المباشر؛ لا تعديل لقواعد Knip أو استثناءاته.
عُدلت مسارات الخلفاء الخمسة قبل النقل إلى `supabase/checks/selfservice-*.sql` لتوافق المانيفست دون تغيير بوابة النشر؛ العدد ثابت.
نسختا SQL المرحليتان بقيتا بايتات مرجعية مطابقة؛ التطبيق من الطابعين الجديدين فقط، لا من النسختين معًا.
Verified: فشل فك صورة Supabase محليًا بـ`no space left on device`؛ لم أستخدم صورة بديلة أو أغيّر الاختبارات لإخفاء ذلك.

## 2. المنجز والمستبعد
Verified: GitHub أثبت دمج [#241](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/241) وبقاء [#242](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242) Draft؛ دمج origin/main بـmerge commit دون rebase ودُفع؛ القاعدة main.
Verified: [قرارات التقوية](../../../DECISIONS.md#assess-self-service-hardening-owner-2026-11-05) مرتبطة من القرارات الثلاثة السابقة، وخطة S1–S4 في [التصميم §12](../../../ASSESS_SELF_SERVICE_DESIGN.md#12-current-hardening-and-delivery) ووصف PR.
Verified: C1 ترحيل P1/P5 بطابع جديد، مانيفست وفحصا جاهزية وبصمات وعلامة جديدة. C2 خلفاء حالة البوابة وتصنيف المراجع العشرين.
مستبعد بإذن النطاق: S2–S4، أي عمل حي، الدمج وReady؛ لا ملف XLSX أو محتوى امتحان في Git.

## 3. حالة المهمة
RAD-105 in_progress/code؛ C1/C2 محليًا مكتملان، C3 السابق محفوظ، C4–C7 لاحقًا. قبول P7 الحي منفصل ولا يزال غير منفذ.
P0: إفادة المالك بتاريخ 2026-11-05 أن فحص الإنتاج 11/11 ناجح: `functions=5fcd5e71…` و`relations=95ae71fb…`، وضبط علامة P0 `pilot-v1:466390675b4ac3c32c56c242ec02eeebfe5a745f7bfcc37f57b955576fb23d19`.
Verified (إفادة المالك فقط): هذه إفادة موثقة، وليست إعادة تحقق حي مني؛ لا عناوين أو معرّفات محفوظة في هذا الدليل.

## 4. التغييرات المشتركة وScale
| البصمة | قبل → بعد | السبب المثبت |
|---|---|---|
| functions | `5fcd5e713c9e39b74f39ba6a969080d5` → `16be493671c8050ffa9bdb0e229198b2` | تعديل start_v2 وhealth_v1 فقط بين الدوال السابقة، وإضافة سبع دوال P1/P5 |
| relations | `95ae71fb2b1b1c45707cb6247ef6e95a` → `fd59fc5eb938c70934f4cf5517c2dae0` | إضافة assignment_windows وrestore_epoch فقط |
| pilot-v1 | P0 أعلاه → `pilot-v1:b1b4f90e5da90ba789a2be5ad66bf991790ff1234d1f86f4b7450e2bcb8170e1` | ترحيلان مطلوبان، خمسة خلفاء وفحصا جاهزية في المانيفست |
Verified: البصمتان الجديدتان في فحص الخلف فقط؛ الأصل يحتفظ بقيم P0. لم تُعدّل golden أو scene hash أو منطق درجات.
Verified: تغيرت قوائم المسارات وعلامة الترقية فقط في `frontend-manifest.test.ts` و`rad062-supervisor-catalogue.test.ts` و`selfservice-p2.test.ts`؛ بصمة بايتات M09 بقيت كما هي.
C2: 16 فحص حالة متوقعة (خمسة SQL مثبتة في المانيفست، الباقي يولده `scripts/assess/selfservice-gate-checks.mjs`)، مرجعان لجرد الجدول فقط، وفحصا إيقاف طارئ يشترطان الإغلاق دائمًا.
Verified: المولد يطابق SHA256 الأصل ويرفض انحرافه؛ كل التأكيدات غير المتعلقة بالبوابة محفوظة. فحوص التثبيت التاريخية تحتفظ بشروط مخططها ولا تصبح فحوص جاهزية للمخطط الحالي.
الاستخدام: `set radlab.expected_gate='closed';` قبل التفعيل أو `'open'` في التشغيل العادي، ثم الفحص في الاتصال نفسه. لا default متساهل.
Scale: حدود نافذة 7 أيام، تغييرات 10، حالة 200 صف، ودفعة 20/240 ثانية محفوظة؛ رفعها يحتاج محفزات التصميم. دور النسخ المخطط `assess_backup` بأقل صلاحيات وإثبات الاستعادة في S4.

## 5. الطب والتقييم
Verified: لا نص طبي أو محتوى امتحان أو منطق درجات جديد؛ المسارات الثلاثة وخلط الخيارات server-side محفوظة. أول امتحان XLSX لدى المالك عبر QuestionImport.

## 6. التحقق
Verified: 77 اختبارًا معنيًا محليًا عبر 8 ملفات (اختيار embedded وP1/P5 والمانيفست/العلامة وشاشات P2 الخاملة)؛ الحالات غير المختارة ليست دليل نجاح لها.
Verified: إعادة الاختبار الجديد بعد تقوية الإثبات: اختبارا byte identity وembedded ناجحان؛ Supabase غير مختار محليًا.
Verified: طفرات ACL إضافية للعامل، grant option، منح window_guard، إعداد health، جسم start، صلاحية جدول، تعطيل RLS، قيد نافذة، صف شاهد مفقود، وحالة بوابة خاطئة/مفقودة/متعددة/تصريح ناقص تُرفض.
Verified: الإنتاج الاصطناعي يطابق بصمات الأصل قبل الترقية والخلف بعدها؛ بقية دوال/جداول الأصل لم تتغير؛ فحوص الخلف الأربعة تحفظ كل مخرجات الأصل غير المتعلقة بالبوابة.
Verified: `typecheck` و`lint` (تحذيران قائمان في simulator-layout-audit)؛ `credits.test.ts` ‏19/19؛ docs:sync مرتين (الثاني 0)، docs:check، status:check --require-previous، git diff --check.
Not run (مساحة Docker): نسخة Supabase 17.11 المحلية وDB lane كاملة؛ النسخة المطلوبة لا تُحذف من الاختبار أو CI.
Verified: `npm run build` ناجح؛ الوحدة 2595 ناجحة أولًا، واختبار adapter تجاوز مهلة 20 ثانية أثناء التوازي ثم نجح منفردًا في ثانيتين دون تعديل.
Verified: أُصلح بلاغ Knip عن المولد باستيراد مباشر وتعريف أنواع (ملف إضافي معلن)، بلا تعديل للفاحص أو استثناءاته؛ اختبارا C1/C2 أُعيدا ونجحا. `health:source` بلا أخطاء و`health:test` ناجحان؛ CI للرأس المصحح ينتظر GitHub.
Not run (S4): browser/axe/family EN/AR390/1440؛ لا شاشة جديدة مركبة هنا.
Not run (خارج الإذن): SQL حي، Google Cloud، Vault، Brevo، Variables؛ بوابة Deploy متوقع أن تحظر حتى دليل المخطط الجديد في P7.

## 7. المفتوح
الترقية Draft؛ لا دمج أو Ready. P0 لا يشهد للمخطط الجديد؛ [P7](../../../ASSESS_P7_LAPTOP_RUNBOOK.md) يحدد تطبيق الملفات الجديدة وفحوص الحالة والعلامة.
S2–S4 مطلوبة؛ البنود 1–7 و9 معتمدة، 8 مرفوض، 10 تحقيق أولًا مع STOP عند ميزة مدفوعة/زيادة كلفة، دون تفعيل.

## 8. قائمة المالك والنص التالي
لا قرار جديد مطلوب في S1؛ فعل المالك التالي هو P7 بعد اكتمال مراجعة S2–S4، وليس تغيير Variable الآن.
النص الدقيق للجلسة التالية:

```text
Mode: implement (session 2 of 4), RAD-105 Assess self-service, Draft PR #242 only.
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
