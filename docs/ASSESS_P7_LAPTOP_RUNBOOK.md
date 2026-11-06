# P7 — نافذة اللابتوب الواحدة لتشغيل الامتحانات الذاتية (RAD-105)

**لا إذن حي هنا، ولا تبدأ P7 من هذه الدفعة.** يلزم قبول مراجعة S4 وCI أخضر للرأس النهائي، ثم إذن مالك جديد مكتوب ونافذة≤5ساعات. Assess ليست operational حتى اكتمال الأدلة الحية. [السلطة والخطة](ASSESS_SELF_SERVICE_DESIGN.md#12-current-hardening-and-delivery)، [استثناء العامل](DECISIONS.md#assess-self-service-s4-worker-owner-2026-11-05)، [تفصيل S4 والتكاليف وحدود النسخ](ASSESS_S4_OPERATIONS.md)، [تقرير النسخ](archive/reports/2026-11/ASSESS_SELF_SERVICE_S4_BACKUP_2026-11-06.md).

## خطة الترقية الحالية (S1–S4)
S1/S2/S3 مقبولة، بما فيها الساعة الرتيبة؛ S4 ما زالت للمراجعة واستكمال بواباتها. العلامة المرشحة منفصلة عن P0 الحية. لا دمج أو Variable أو تفعيل من هذا الدليل وحده. أول امتحان حقيقي XLSX لدى المالك عبر QuestionImport، لا Git.

كل خطوة تحفظ دليل UTC منقحًا في سجل محلي محمي ومشفر وفق RAD-086؛ لا بريد/اعتماد/بيانات مشارك في Git. `owner_sql` هو اتصال المالك المراجع في [دليل النافذة](ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md). خطأ أو UNKNOWN أو مهلة أو إيصال مفقود يعني STOP، لا retry أعمى.
**تراجع الاحتواء المشترك R:** Pause لكل Scheduler يستهدف العامل/النسخ حسب الحادث، Cancel لكل تنفيذ عامل/معلق، حزمة الإيقاف v2 الأصلية، Disable للإصدار الرقمي المربوط، ثم تحقق CLOSED/NOLOGIN/صفر backends وexecutions فورًا وبعد60ثانية. احتفظ بالمحاولة ذات ACK المجهول للمصالحة المستقلة؛ لا تمسح lease أو تعيد finish. التفاصيل [دليل الهاتف](RAD-059_PHONE_RUNBOOK.md)؛ لا تغيير لحزم الهاتف.

**مسار الاستئناف المشترك S، بعد قرار مكتوب فقط:** تبقى Scheduler PAUSED وgate CLOSED والفتحة NOLOGIN وصفر executions؛ راجع سبب الإيقاف وdigest r3 والخمس وظائف وreadiness مع expected_gate=closed والشاهد بلا restore غير مقبول. فعّل إصدار config الآمن الرقمي فقط إذا عُطّل، والفتحة تبقى NOLOGIN؛ عند الاشتباه يلزم تدوير مراجع، لا إعادة سر قديم. ثم تأكيد UI المكتوب `RESUME ASSESS` للمالك/البديل عبر owner_resume_v1 يفتح gate وLOGIN معًا كآخر كتابة SQL؛ لا recover_v1 أو unfreeze عام. اقرأ readiness مع expected_gate=open وتحقق أن ACTIVE-at-stop/UNKNOWN بقيت held، ثم استعد Scheduler أخيرًا. **Expected:** أول نبضة r3 enforcing/advance وصفر backends/تداخل. **STOP:** restore أو hold أو ACL أو إيصال مجهول. **rollback:** R؛ قبول restored DB للمالك وحده في نافذة منفصلة.

## 0. قبل أي خطوة (L)
0.1 راجع S4 المقبولة ووصف #242 والرأس/merge-base والفحوص والبصمات وبيان الصورة والتسعير؛ اختر نافذة تضم02:17UTC ووقت الاستعادة وساعة لإثبات حد التنبيه، وإلا أعد التخطيط دون تغيير cron. لا نافذة إذا بقي استثناء backup أو اكتمال provider-owned tables/Vault/الأدوار أو بروفة الصورة/الاستعادة دون دليل. **Expected:** لا فجوة غير محسومة. **STOP:** أي فجوة. **rollback:** لا إجراء، تبقى CLOSED/NOLOGIN.
0.2 اكتب إذن النافذة الجديد، ثم نفذ [جاهزية اللابتوب والنسخة الجديدة](ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md#0-laptop-readiness-l-b-20-min) وRAD-086؛ سجّل baselineAt جديدًا بعد اكتمالها. نسخة اللابتوب مطلوبة حتى إثبات الآلية اليومية؛ لا استعمال baseline/إذن نافذة قديمة. **Expected:** restore/checksums ناجحة. **STOP:** فشل/قدم النسخة. **rollback:** لا ترحيل.
0.3 طابق كل digest في `supabase/staged/self-service/MANIFEST.json` مع sha256 للملفات، وطابق ملفات الصورة/المخطط مع commit المراجع. **Expected:** تطابق كامل. **STOP:** drift. **rollback:** لا بناء أو رفع.

## 1. فحص قراءة فقط (L)
`owner_sql -f supabase/checks/rad085-review-ready.sql` على P0 قبل الترحيلات؛11صفًا ناجحًا، gate مغلقة. سجّل أصل P0 الذي أفاد به المالك، لا تستبدله بالمرشح. جرد الخطتين/الفتحتين/كل المناطق والـJobs والجدولة والأسرار رقميًا دون عرض القيم. **Expected:** الحالة المغلقة المعروفة. **STOP:** صف فاشل/مفقود أو LOGIN/backend/تنفيذ غير متوقع. **rollback:** R؛ راجع السبب قبل نافذة جديدة.

## 2. جرد المحتوى (L)
`owner_sql -f supabase/staged/self-service/p6-inventory.sql`؛ سجّل عدد العناصر المتاحة، دون نسخ النص. ملف20عنصرًا الحقيقي يظل لدى المالك وخطوة15 لا تبدأ من جرد Git. **Expected:** جرد مقروء، وfixtures هندسية للمسارات الثلاثة في13. **STOP:** خطأ أو مصدر غير واضح. **rollback:** لا محتوى جديد أو تركيب بديل.

## 3. تطبيق SQL المرحلي (L) — كل ملف معاملة واحدة تتراجع كاملة عند الفشل
بالترتيب، عبر مسار migrations المراجع فقط، بعد فحص ledger لرفض التكرار:
```bash
owner_sql -f supabase/migrations/20261105000100_rad105_windows.sql
owner_sql -f supabase/migrations/20261105000200_rad105_witness.sql
owner_sql -f supabase/migrations/20261105000300_rad105_selfservice_s2.sql
owner_sql -f supabase/migrations/20261105000400_rad105_eligibility_read.sql
owner_sql -f supabase/migrations/20261105000500_rad105_ui_reads.sql
owner_sql -f supabase/migrations/20261105000600_rad105_worker_health.sql
```
لا تطبق مصادر P1/P5 المرحلية مرة ثانية. في اتصال واحد اضبط `set radlab.expected_gate='closed'` ثم شغّل selfservice-s4-rad085-review-ready.sql وselfservice-ready.sql وselfservice-s2-ready.sql وselfservice-s3-ready.sql من `supabase/checks/`.
**Expected:** COMMIT لكل ملف وكل صف ok=true؛ functions `50f46f597788805b0e67bc40c04401d4` وrelations `5c45889099a878446fd3a16a9569940f`. **STOP:** خطأ/صف مفقود/drift. **rollback:** المعاملة الفاشلة ROLLBACK؛ لا عكس ارتجالي لترحيل ناجح، نفذR ومصالحة migration لاحقة مراجعة.

## 3ب. حزمة النسخ المنفصلة قبل علامة النشر (L، بعد إثبات الجرد في مراجعة S4)
`owner_sql -At -f supabase/checks/selfservice-backup-inventory.sql` إلى ملف محلي محمي خارج Git؛ طابق الجرد ومجموعة الأدوار والسلطة القائمة مع الحزمة المقبولة. شغّل compiler دون اتصال وراجع التطابق مع selfservice-backup-read.sql؛ default dry-run أولًا، ثم فقط بإذن النافذة `set radlab.backup_apply='reviewed-select-only'` في الاتصال نفسه والحزمة. يلزم CLOSED وassess_backup NOLOGIN وصفر اتصالاته؛ تظل Scheduler النسخ PAUSED ولا سر مفعّل. لا عضوية أو صلاحية إدارة لمعالجة غياب ownership.
**Expected:** SELECT/سياسات إضافية scoped فقط؛ توزيع EXECUTE للأدوار الموجودة ثم سحب PUBLIC من الدوال الثلاث في المعاملة نفسها؛ لا تغيير سياسة قائمة أو تعريف دالة. شغّل selfservice-backup-ready.sql: كل صف true؛ ثم selfservice-s4-backup-rad085-review-ready.sql مع expected_gate=closed: relations `9e9702304abbc3e87e50005468638737` وfunctions بلا تغيير. الفحص الأخير يقبل قبل الحزمة فقط البصمة الأصلية وغياب دور النسخ؛ وجود دور جزئي يفشل، ولا يُغني عن جاهزية النسخ الكاملة.
**STOP:** جرد/أدوار/ACL مختلف، constructor متاح، ownership غير مدعوم، نقص تغطية، LOGIN أو backend. **rollback:** المعاملة الفاشلة تتراجع كاملة؛ بعدCOMMIT اترك الدورNOLOGIN والجدولةPAUSED، احتفظ باللابتوب وصالح السبب؛ لا إعادة PUBLIC أو replay تلقائي. الأدوار المستقبلية تحتاج مراجعة ومنحًا صريحًا للدوال الثلاث. اقرأ دليل امتيازات/مفاتيح المزوّد الناقص قبل أي credential أو02:17UTC.

## 4. دمج PR الترقية وفتح النشر (GitHub، L)
في النافذة المأذونة فقط وبعد قبول S4: دمج PR الترقية بأمر المالك الصريح، ثم `--print-marker` وقارن `pilot-v1:84c980aa7325174878ccb41d73c044f9961aacb7f8ef68f64af58cd9ccc5f3d6`، ثم إجراء [P0 للعلامة](ASSESS_P0_MARKER_RUNBOOK.md#2-اضبط-pilot_schema_verified) وإعادة Deploy المسموح للمالك. **Expected:** نشر الرأس المراجع فقط بعد دليل3 و3ب. **STOP:** gate النشر أو marker مختلف. **rollback:** R، لا تجاوز attestation أو تغيير علامة لتجميل الفشل.
قبل UI: تحقق OpenAPI للمستخدم المصادق يعرض مخطط assess والـRPC المطلوبة. اختبر missing/hidden schema يظهر unavailable دون probing. **Expected:** كشف schema صحيح ونقاط S3 الأصلية. **STOP:** REST مخفي/غير جاهز. **rollback:** gate مغلقة؛ لا توسيع schema/ACL أو تعطيل الحارس دون قرار.

## 5. الصورة والـJob (L، Cloud Shell)
5.1 ابنِ مرتين `node scripts/assess/build-grading-worker.mjs --selfservice-r1` من الرأس المدموج؛ قارن manifestSha256، وابنِ [الصورة بالـdigest](ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md#3-w4-image-by-digest-l-20-min). لاحقًا كرر للرأسيْن r2/r3؛ لا تنسخ فوق المدخل v1 الأصلي. **Expected:** كل manifest.selfservice يطابق مرحلته، Dockerfile/base ثابتان، USER=node، المصدر بلا أسرار. **STOP:** فرق أو فشل رفع. **rollback:** لا ربط، R عند وجود تنفيذ.
5.2 جهز مراجعة Job فقط؛ الربط الفعلي يؤجل إلى7.2 بعد إنشاء الإصدارين الرقميين وتفعليهما، لأن Cloud Run يرفض مرجع DISABLED. المطلوب taskCount1/parallelism1/retries0/timeout300s، payload بستة مفاتيح، direct host5432/postgres/assess_job_b وTLS، بلا fallback/pooler. **Expected:** خطة mounts config/recovery وsecretAccessor على السرّين المحددين فقط، وكل إصدار قديم DISABLED. **STOP:** امتياز زائد/secret=latest أو محاولة ربط مبكرة. **rollback:** لا تحديث؛ احتفظ بالصورة القديمة للمراجعة دون تشغيلها.

## 6. الشاهد الخارجي والمُجدوِل (Cloud Shell)
6.1 قبل تغيير grants: CLOSED، NOLOGIN لكلا a/b، صفر اتصالات عامل وصفر تنفيذ/جدولة نشطة؛ جرد كل v1 active/grading/failed/awaiting-manual/held/leased. لا تستثنِ held أو lease لأن state نهائية. راجع dry-run للحزمة `supabase/manual/selfservice-worker-v2-switch.sql`؛ في الاتصال نفسه، وبإذن النافذة فقط، اضبط `set radlab.worker_switch_authorized='apply-reviewed-v2'` ثم شغّل الحزمة، وبعدها `selfservice-s4-worker-ready.sql`.
**Expected:** خمس عمليات v2 بالضبط، بلا جدول/DDL/إدارة/عضوية زائدة، وتبديل ذري؛ لا فترة grants مشتركة. **STOP:** أي v1 غير منتهية، اتصال أو ACL مختلف. **rollback:** الفشل يعيد المعاملة كاملة؛ بعد COMMIT نفذR واترك v2 NOLOGIN. عكس الربط يحتاج نافذة مراجعة وصفر v2 غير منتهية ومصالحة مستقلة؛ لا blind replay.
6.2 bucket الشاهد الخاص `${projectRef}-assess-witness` وwitness.json؛ runtime يملك القراءة/الكتابة المحددة بهذا المورد فقط، وCAS generation مطلوب. **Expected:** لا وصول عام؛ غياب الكائن يسمح init فيR1 فقط. **STOP:** IAM/CAS مجهول. **rollback:** R، لا حذف شاهد لتصفير مشكلة استعادة.
6.3 راجع dry-run للـ`p4-scheduler.sh`، ثم الإجراء المأذون فقط بمتغيرَي APPLY وRAD_WINDOW_PERMISSION المنصوصين فيه. إنشاء Scheduler قد يجعله ENABLED؛ تبقى gate CLOSED والفتحة NOLOGIN والسر DISABLED. مباشرة نفذ `gcloud scheduler jobs pause assess-worker-tick --location="$RAD_REGION" --project="$RAD_PROJECT"`، ثم اقرأ الإعداد والتنفيذ وانتظر صفر executions/backends قبل7؛ تبقى PAUSED حتى8. OAuth يستهدفJob واحدًا، كل5دقائق، retries0/maxRetryDuration0. **Expected:** PAUSED وURI والحساب والموقع والتواتر مطابقة. **STOP:** مورد بإعداد مختلف أو تنفيذ متبقٍّ؛ EXISTS لا يثبت التطابق. **rollback:** Pause ثم R؛ لا تكرار Create.

## 7. الاعتماد والتصديق (L + Cloud Shell)
7.1 تدوير آمن مراجع بـ`rotate-grading-credential.py --no-expiry`؛ القيمة في Secret Manager فقط، slot يبقىNOLOGIN حتى اكتمال الفحص. **Expected:** VALID UNTIL infinity، الإصدار الرقمي المحدد فقط وربط خمس وظائف. **STOP:** عرض/تسرب/إصدار قديم ممكّن. **rollback:**R ثم تدوير جديد عند الاشتباه؛ لا استعادة كلمة قديمة.
7.2 أنشئ تصديق B حديثًا مرتبطًا بbaselineAt وmanifest r1؛ سجل config=N وrecovery=M. مع CLOSED/NOLOGIN وScheduler PAUSED وصفر executions، فعّل N وM فقط ثم حدّث Job إلىdigest r1 ومساري SM الرقميين وفق حدود5.2؛ أزل volumes غير المركبة بعد جردها. اقرأ Job/IAM وVersions بعد التحديث: N/M فقط ENABLED، والصورة والمنافذ والحدود مطابقة. أبقِ B فيR2، وتقاعده فيR3. **Expected:** نافذة≤48ساعة وrestoresSinceBaseline0 وربط صالح بلا تنفيذ. **STOP:** expired/manifest mismatch/restore أو إصدار إضافي أو خطأ تحديث؛ لا execute-now. **rollback:**R، لا إعادة توقيت نص لإخفاء استعادة.
7.3 نفذ [رفض الاعتماد القديم](RAD-059_REMAINING_PLAN_2026-11-02.md) من اتصال جديد، مع أزمنة الانتظار/قطع الجلسة/cleanup المعتمدة. **Expected:** AUTH_REJECTED حقيقية للقديم وصفرbackends؛ لا ALREADY/ABSENT بدل اختبار نشط. **STOP:** نجاح القديم أو نتيجة مجهولة. **rollback:**R وتدوير/مصالحة جديدة.

## 8. فتح البوابة (مفتاح الإيقاف العام) وأول نبضات R1
اكتمال الفحوص السابقة والمستجيبان حاضران؛ نفذ تحضير12 وإثبات النسخة والتنبيهات قبل هذه الخطوة مع بقاء العامل مغلقًا، وأبقِ أدلة receipt/التواتر في12. لا فتح قبل استيفائها. تحقق أن N/M المربوطين في7.2 وحدهما ENABLED، ثم فعّل LOGIN بالحزمة المراجعة وافتح gate آخر خطوة SQL، واستعد Scheduler أخيرًا. **Expected:** نبضتان أصليتان من Scheduler (لا Manual Execute)، R1 shadow init ثمadvance، أوقات الشاهد منDB وseq متقدم، batch≤20/240s وصفرbackends بعد النهاية. **STOP:** خطأ/تداخل/وصول شاهد مجهول. **rollback:**R، لا اعتبار HTTP200 وحده تصحيحًا ناجحًا.

## 9. R2 ثم إثبات الرفض الحي
Pause/انتظر صفرexecutions؛ أنشئ وفعّل تصديق r2 المطابق ثم اربط digest r2 ومساري N/M الجديدين بترتيب7.2، وعطّل تصديق r1؛ تحقق metadata ثم استعد الجدولة. سجّل advance أصليًا. أنشئ من UI محاولة اصطناعية start_v2/submit معروفة بلا lease/نتيجة؛ لا SQL مساعد للمحاولة. Pause ثم احفظ witness.json وgeneration في المسار المحلي المشفر خارج Git. جهّز نسخة مطابقة تزيد seq بمقدار100 فقط؛ راجع المفاتيح والأعداد دون تغيير epoch/projectRef/updatedAt. ارفعها إلى الكائن نفسه بـ`gcloud storage cp --if-generation-match=GENERATION`، وسجّل generation الناتج. استعد Scheduler لنبضة واحدة: seq أمام DB يجب أن يمنع maintain/claim ويحفظ المحاولة دون تغيير. Pause؛ أعد النسخة الصحيحة فقط بشرط CAS يطابق generation الذي أنشأه التمرين، ثم أعد الفحص والنبضة. لا حذف لكائن أو تعديل DB؛ هذه الخطوات هي حزمة التمرين وتحتاج مراجعة S4 قبل النافذة.
**Expected:** STOP موثقة قبل claim، بلا نتيجة/حذف/إطلاق held؛ إعادة الشاهد الصحيح عبرCAS وإعادة الفحص تستعيدadvance. **STOP:** حزمة تمرين غير مقبولة أو غياب دليل ما قبل claim أو CAS conflict. **rollback:**R؛ لا الكتابة فوق شاهد أحدث أو تعديل restore_epoch يدويًا.

## 10. R3 وإحالة التصديق للتقاعد
Pause/صفرruns، اربطdigest r3، أزل mount وصلاحية تصديق B فقط بعد مراجعة أن المدخل لا يقرأه، وعطّل كل إصدارات B وأبقِ config/witness المحددين؛ استعد Scheduler. **Expected:** نبضتان enforcing/advance ناجحتان دون تصديق يدوي؛ رفض الشاهد يظل فعالًا. **STOP:** اعتماد خفي علىB أو صلاحيات/حجم غير مستخدم. **rollback:**R؛ عودةr2 فقط بصورة وتصديق مطابقين حديثين ونافذة مراجعة.

## 11. بديل بشري حقيقي (OD7)
نفّذ تمرين غياب المالك وACK من البديل المعين بحسابه، ثم الإيقاف من الواجهة والصلاحيات الأصلية؛ تأكيد Resume للبديل لا يمنحه قبول الاستعادة. **Expected:** القنوات لكل مستجيب، اكتشاف/ACK/احتواء موثقة؛ gateمغلقة وNOLOGIN وصفرruns/backends، ولا قبول restored DB من البديل. **STOP:** عدم استلام/حضور/صلاحية. **rollback:**R؛ تبقى مغلقة، لا تعيين بديل اصطناعي. بعد نجاح تمرين البديل وقبل13 يلزم قرار Resume موثق ومسار S؛ لا تتجاوز gate مغلقة باختبار SQL.

## 12. إيصال P7 (تنبيه حقيقي)
12.1 اعرض مخطط `selfservice-ops-plan.mjs` بقنوات المالك والبديل القائمة؛ راجع السعر الفعلي قبل الحفظ. طبّق سياسة فشل واحدة تجمع Scheduler وworkerSTOP بحد3600s بلا labels/renotify/closure؛ النص «قد يكون الإيقاف مقصودًا». امنع ازدواج failure routing مع حفظ سياسات budget/overlap/long-running والطوارئ. قبل8، مع CLOSED/NOLOGIN وN/M المراجعين ENABLED، اسمح بنبضات Scheduler الاصطناعية الفاشلة للمدة اللازمة للتحقق ثم Pause وصفر executions؛ لا تغيير IAM أو URI لافتعال فشل. **Expected:** إخفاقات متكررة وتغلق/تعاد فتحها لا تنتج أكثر من رسالة/ساعة لكل قناة؛ الإيصال وACK أصليان. **STOP:** زيادة/قناة ناقصة/مصدر غير مطابق. **rollback:** عطّل السياسة الجديدة وأبقِR والقنوات الأصلية؛ لا اعتماد قبل مراجعة التواتر.
12.2 backup: فقط بعد قبول exact inventory/grants/RLS وcoverage الكامل واستعادة الأدوار/Vault المراجعة؛ credential منفصل assess_backup فيSM، لا BYPASSRLS/كتابة/إدارة/عضوية، ولا مفتاحageخاص فيjob. ابنِ صورة النسخ مرتين وراجع digests؛ قِس peak scratch/RSS والمدة للحجم الفعلي (البروفة1GiB/work512MiB والخطة900s؛ ملفات متعددة متزامنة)، توقف قبل زيادة ذاكرة/كلفة بلا مراجعة؛ ذاكرة/work خاصة، task1/retries0، bucketprivate/objectCreator فقط،30يومًا وversioningOFF/soft-delete0، Scheduler02:17UTC تبقى PAUSED حتى نجاح فحوص الصورة والمنح والتشفير. بعدها، والعامل ما زال CLOSED/NOLOGIN، اضبط Job النسخ المراجع على `--run` صراحة، استعد Scheduler النسخ فقط لنبضة02:17UTC داخل النافذة ثم Pause للاستعادة والتحقق؛ لا Manual Execute بدل النبضة.
في الاستعادة المعزولة: age private identity عند المالك فقط؛ تحقق checksums لكل project.dump/roles.sql/metadata.json، ثم prepareRolesSql من RAD-086. جرد TOC بـ`pg_restore --create --list` قبل restorePlan؛ استعادة pass1 بـ`--create --use-list` إلىtemplate1، ثم event triggers المؤجلة بمالكيها إلىpostgres. قارن metadata للأدوار والجرد/DB ACL/الإعدادات والدوال الثلاث والبيانات وsequences/LOB؛ لا TOC بلا--create لأنه يسقط خصائص قاعدة البيانات من القائمة المختارة.
**Expected:** أول نسخة مجدولة مشفرة؛ فك واستعادة معزولة ومقارنة كل جدول/sequence/LOB/schema/ACL/RLS/دور والتجزئات؛ لا استثناءات صامتة. جرّب فشلًا اصطناعيًا وآخر ناجحًا وإيصال failure للاثنين؛ طابق readback لسياسة Age30 وversioningOFF/soft-delete0. إن وُجد كائن منتهٍ فتحقق حذفه بعد تأخر المزوّد، وإلا سجّل NOT YET DUE ومتابعة بعد مدة الاحتفاظ؛ لا ادعاء أن فحص الإعداد برهان حذف فعلي، ولا تغيير timestamps/retention. بعد إثبات النسخة والاستلام، استئناف الجدولة اليومية يحتاج إذن المالك المسجل. **STOP:** نقص/تأخر/صلاحية أوسع/مفتاح خاص/صورة غير مراجعة. **rollback:** Pausebackup،Rعندالحاجة؛ احتفظ بالنسخة السليمة واللابتوب، لا تحذفها بدعوى نجاح آلي.
12.3 حجم DB: قارن `pg_database_size(current_database())` مع Usage وحد الخطة بوحدته الدقيقة؛ اضبط planLimitBytes و70% بحساب صحيح، والقياس اليومي عبر job النسخ. اختبر threshold-1/exact/+1 ببيانات اصطناعية ورسالة المزوّد للشخصين؛ غياب القياس UNKNOWN. **Expected:** عتبة وتسلم موثقان، بلا upgrade/delete تلقائي؛ disk/WAL/Storage منفصلة. **STOP:** اختلاف المقياس/الوحدة أو قناة مفقودة. **rollback:** عطّل السياسة الجديدة، نفذ R حسب الحادث وراقب Usage حتى الإصلاح.
12.4 تقييد المصدر: [خيارات وكلفة S4](ASSESS_S4_OPERATIONS.md#source-restrictions--cost-stop-sources-read-2026-11-05). **Expected:** قرار مالك موثق بعد التسعير والـentitlement وتحقق IPv6/IPv4 ووصول اللابتوب والبديل والنسخ؛ افحص أولًا CIDR الشبكة dual-stack القائمة ومن يشاركها، ولا تصف subnet بأنها عزل لدور واحد. **STOP:** ميزة مدفوعة أو زيادة كلفة بلا قرار؛ لا NAT/IP/plan upgrade أو pooler fallback. **rollback:** لا تفعيل؛ لا تدّعِ تقييدًا من TLS وحده.

## 12ب. عدّ كتالوج المحاكي (قراءة فقط، قبل الخطوة 13)
أعد أولًا selfservice-s4-backup-rad085-review-ready.sql مع expected_gate=open في الاتصال نفسه؛ كل الصفوف ناجحة. ثم `owner_sql -f supabase/manual/rad105-simulator-catalogue-count.sql`؛ الحزمة الأصلية تقرأ authoring_references وتجمع kind/active/count فقط. فحص fingerprint منفصل، ولا تدّعِ أن counts تفحص private_items أو صحة publication. **Expected:** active غير صفر لكل simulator-part/full-practical المطلوب، وربط fixtures الصحيحة يثبت منفصلًا في13. **STOP:** drift أو صفر أو مصدر/نسخة غير مثبتة. **rollback:** R؛ لا تعديل للحزمة أو seed محتوى طبي.

## 13. الإثبات الكامل بلا يد المالك — ثلاثة امتحانات اصطناعية
من الواجهة الأصلية وبحسابات اصطناعية موافق عليها: questions، mixed، full-practical؛ نسخة مراجعة مثبتة ومرتبطة، استهداف صحيح، نافذة افتراضية ساعتان وحد7أيام، Asia/Amman. انشر واختبر upcoming→open→active→submitted→grading→graded ثم history/result بالرؤية المقررة. التقديم عبر start_v2/command_v2، والتصحيح من Scheduler وصورة r3 المقيدة فقط؛ لا Manual Execute/claim/finish أو تغيير DB مساعد.
**Expected:** نتيجة وحيدة مطابقة لكل track، حذف details، شاهد advance، صفر backends/overlap، حفظ shuffle وclock، ورفض غير المستهدف والمسحوب وغير الموافق. **STOP:** محاولة عالقة أو held/score/رؤية/تنظيف مختلف. **rollback:** R ومصالحة المحاولة دون replay؛ لا امتحان حقيقي من نجاح مسار واحد.
اختبر إشعار S2 من حزمة `selfservice-notify-install.sql` المراجعة فقط: OFF قبل أي سر/cron؛ رسالة وقت واحدة للمستهدف الموافق، dedup/reschedule/revocation، وإيصال فعلي؛ request_id ليس إيصالًا. **STOP:** مستلم زائد أو تكرار أو محتوى أو إيصال ناقص. **rollback:** notice_switch OFF وPause للـcron المحدد؛ لا استرجاع لـpg_net سبق enqueue.

## 14. الإيقاف والاستئناف
ابدأ محاولة ACTIVE اصطناعية وأخرى submitted، ثم إيقاف من الواجهة والهاتف وفق R؛ اختبر منع البدء والتصحيح والاعتماد القديم. Resume عبر مسار S بتأكيد مكتوب للمالك/البديل؛ قبول الاستعادة للمالك فقط وبوابة مغلقة وبعد restore proof.
**Expected:** ACTIVE-at-stop والتاريخ المجهول يبقيان held؛ فقط التقاط non-active المثبت يسمح بالإطلاق. grant بديل من own-assignment يثبت الأهلية تحت القفل ويبقي القديمة held؛ لا استنتاج من failed. **STOP:** إطلاق غير مثبت أو صلاحية بديل زائدة أو عودة backend. **rollback:** R؛ معالجة المحاولات كل واحدة بعد المراجعة، لا unfreeze عام.

## 15. أول امتحان حقيقي: 20 عنصرًا من ملف XLSX يحتفظ به المالك
بعد اكتمال13 و14 و12 وقرار المالك: استيراد ملف الـ20 عنصرًا المحفوظ عند المالك عبر QuestionImport، معاينة وتحقق، ثم مراجعة واحدة وقبول المالك، ونشر «اختبار كل الطلاب» بإذنه أو إذن مشرف ممنوح OFF افتراضيًا. **Expected:**20 صالحة وكل المستهدفين approved+consented فقط. **STOP:** مصدر أو ترخيص أو تحقق أو نص غير معتمد. **rollback:** أغلق التكليف وR حسب الحادث؛ لا اختراع عناصر أو رفع XLSX إلى Git.

## 16. الإغلاق
راجع ledger/readiness/marker/image/binding/Scheduler/witness والنسخة والتنبيهات وإيصال الشخصين وكل المسارات والبديل والإيقاف/الاستئناف؛ اختم السجل المشفر. **Expected:** لا gap أو دليل UNKNOWN؛ لا خطوة يدوية لكل امتحان بعد القبول. **STOP:** أي أثر ناقص. **rollback:** R؛ لا وصف operational قبل الدليل الحي الكامل. تبقى الدوران عند الاشتباه، وقبول استعادة حقيقية، وResume بعد إيقاف، ومراجعة التسعير عمليات مالك معلنة.

## حد S2 قبل S3/S4
S2 مقبولة، والإشعارات OFF بشكل مستقل؛ تطبيق cron والأسرار والإيصال في النافذة فقط. لا request_id بدل receipt ولا held release عام.

## حد S3 قبل S4/P7
S3 وساعتها مقبولتان؛ أدلة EN/AR390/1440 وaxe والعائلات يعاد استخدامها عند ثبات UI. OpenAPI/REST وschema detection بوابة صريحة في4؛ لا تجاوز guard. يبقى دليل P7 المباشر غير منفذ.
