# P7 — نافذة اللابتوب الواحدة لتشغيل الامتحانات الذاتية (RAD-105)

**لا يمنح هذا الملف أي إذن حي.** يكتب المالك جملة إذن جديدة في بداية النافذة؛ أي `STOP` ينهي النافذة بلا تحايل. القرار: [OD1–OD9](DECISIONS.md#assess-self-service-owner-2026-11-05) و[التسليم](DECISIONS.md#assess-self-service-delivery-owner-2026-11-05)؛ التصميم: [ASSESS_SELF_SERVICE_DESIGN](ASSESS_SELF_SERVICE_DESIGN.md). الملفات المرحلية في `supabase/staged/self-service/` (بصماتها في `MANIFEST.json`). الأوامر المجرَّبة سابقًا مُحال إليها في [دليل النافذة](ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md) بدل تكرارها.

**ما لا يدخل النافذة:** ① **PR الترقية** (Draft منفصل، يُحضَّر ويُراجع قبل النافذة ولا يُدمج إلا بعد الخطوة 3): ينقل `p1`/`p5` إلى `supabase/migrations` بطابع زمني جديد، يضيفهما إلى `frontend-schema.json` ويضيف فحوص جاهزيتهما، ويصنف مراجع البوابة العشرين: 16 فحص حالة بخلفاء صارمين، مرجعان لجرد الجدول، وفحصا إيقاف يظلان CLOSED، ويفتح شاشات P2 خلف كشف القدرة مع محوّل `p2-adapter.ts.txt` وتحديث بصمة الحدود، ويضع مدخل `p5-entry-r1.mjs` في `scripts/assess/grading-worker-main.mjs` ويحدّث توقعات اختبارات الصورة، ويرفع سقف الاعتماد (انظر أدناه). علامة `pilot-v1` تتغير هناك فقط. ② **امتحان الـ20 عنصرًا**: متوقف (P6)، لا تُنفَّذ الخطوة 15 قبل أن يقرّر المالك.

**الاعتماد (قرار المالك المستبدِل لـDS-5):** بلا انتهاء (`VALID UNTIL 'infinity'`) والتنبيهات المرتبطة بالانتهاء محذوفة؛ تطبيقه في PR الترقية فقط (الأماكن الخمسة المحمية + العلامة الجديدة). لذلك تُنفَّذ الخطوة 7.1 بأمر التدوير الذي يعدّله PR الترقية؛ قبل دمجه لا يوجد أمر بلا انتهاء، ولا تُشغَّل 7.1 بقيمة أخرى.

## خطة الترقية الحالية (S1–S4)
[الخطة](ASSESS_SELF_SERVICE_DESIGN.md#12-current-hardening-and-delivery) و[قرارات التقوية](DECISIONS.md#assess-self-service-hardening-owner-2026-11-05) تحكمان النص الأقدم: S1 للقرارات وC1/C2؛ S2 لقاعدة C4 والبنود 2/3/4/5/9؛ S3 لواجهات C5؛ S4 للبنية 1/6/7/10 وتدقيق C6 وتقرير C7. الافتراضي ساعتان، الاعتماد بلا انتهاء، والبديل يستطيع الاستئناف بتأكيد مكتوب؛ قبول الاستعادة للمالك فقط. النسخة الاحتياطية اليومية الآلية لا تلغي نسخة نافذة اللابتوب. لا إذن حي هنا.

P0: أفاد المالك بتاريخ 2026-11-05 أن فحص الإنتاج 11/11 ناجح وضبط علامة P0؛ [الدليل](DECISIONS.md#assess-self-service-hardening-owner-2026-11-05). هذا لا يشهد لترحيلات C1؛ يلزم تحقق جديد في النافذة.

## 0. قبل أي خطوة (L)
0.1 جملة إذن جديدة بخط يدك (نافذة ≤ 5 ساعات)، ثم الخطوتان 0–1 من [دليل النافذة](ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md#0-laptop-readiness-l-b-20-min) (الالتزام، `npm ci`، نسخة احتياطية جديدة موثَّقة، `baselineAt` الجديد). **Expected:** كل فحص PASS. **STOP:** أي اختلاف.
0.2 تحقق من بصمات الملفات المرحلية:
```bash
node -e "const m=require('./supabase/staged/self-service/MANIFEST.json'),c=require('crypto'),f=require('fs');let bad=0;for(const[k,v]of Object.entries(m.files)){if(c.createHash('sha256').update(f.readFileSync('supabase/staged/self-service/'+k)).digest('hex')!==v){bad++;console.log('DIFF',k)}}console.log(bad?'STOP':'STAGED_OK')"
```
**Expected:** `STAGED_OK`. **STOP:** `DIFF` أو `STOP`.

## 1. فحص قراءة فقط (L)
`owner_sql -f supabase/checks/rad085-review-ready.sql` ← 11 صفًا كلها `ok = t` (بعد P0)؛ البوابة مغلقة. **STOP:** أي `ok = f`.

## 2. جرد المحتوى (L)
`owner_sql -f supabase/staged/self-service/p6-inventory.sql`. **Expected:** جدول الإصدارات وعدّاد `available_single_choice_items`. سجّل الرقم. إن كان < 20 فالخطوة 15 ممنوعة (يُستعمل امتحان اصطناعي للإثبات فقط).

## 3. تطبيق SQL المرحلي (L) — كل ملف معاملة واحدة تتراجع كاملة عند الفشل
```bash
owner_sql -f supabase/migrations/20261105000100_rad105_windows.sql
owner_sql -f supabase/migrations/20261105000200_rad105_witness.sql
owner_sql -f supabase/migrations/20261105000300_rad105_selfservice_s2.sql
owner_sql -f supabase/migrations/20261105000400_rad105_eligibility_read.sql
owner_sql -f supabase/migrations/20261105000500_rad105_ui_reads.sql
```
**Expected:** `COMMIT` لكل ملف. تحقق: `select to_regclass('assess.assignment_windows') is not null, to_regclass('assess.restore_epoch') is not null` ← `t | t`. **STOP:** أي خطأ ← لا شيء طُبّق من ذلك الملف؛ أغلق PR الترقية.

بعد الملفات الخمسة، وفي اتصال واحد، جهّز نص التحقق ثم راجعه قبل تشغيله:
```bash
{ printf "%s\n" "set radlab.expected_gate='closed';"; cat supabase/checks/selfservice-s3-rad085-review-ready.sql supabase/checks/selfservice-ready.sql supabase/checks/selfservice-s2-ready.sql supabase/checks/selfservice-s3-ready.sql; } > /tmp/rad105-ready.sql
owner_sql -f /tmp/rad105-ready.sql
```
**Expected:** فحص الكتالوج 11 صفًا ناجحًا، وصفوف `ok` في حزمة النوافذ والشاهد كلها صحيحة. **STOP:** أي فشل أو صف مفقود. لا تطبق النسختين المرحليتين مرة أخرى؛ هما دليل بايتات مطابق للترحيلين. عدادات health تبقى لـlifecycle_version=1؛ الشاهد إضافة مستقلة.

علامة الترقية المرشحة: `pilot-v1:ddb4de0e9e50414239f8ebc0046d84608579928bbf7f3543721cb0c1ce960e4b`؛ بصمة functions `533f4f22d9f07200e6c4dbab596b4dca` وrelations `5c45889099a878446fd3a16a9569940f`. علامة P0 الحية لم تتغير بهذه الجلسة؛ لا تضبط المرشح قبل دليل النافذة.

## 4. دمج PR الترقية وفتح النشر (GitHub، L)
4.1 دمج PR الترقية بأمرك بعد CI أخضر. 4.2 اطبع العلامة الجديدة بعنوان مشروعك (`--print-marker`) واضبط `PILOT_SCHEMA_VERIFIED` كما في [دليل P0](ASSESS_P0_MARKER_RUNBOOK.md#2-اضبط-pilot_schema_verified)، ثم أعد تشغيل Deploy Pages. **Expected:** نشر أخضر. **STOP:** فشل البوابة ← لا تتخطّها.

## 5. الصورة والـJob (L، Cloud Shell)
5.1 بناء الصورة مرتين من `main` المدموج (مدخل R1) ودفعها بالـdigest: [الخطوة 3 من دليل النافذة](ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md#3-w4-image-by-digest-l-20-min)؛ طابق `manifestSha256` للبناءين. 5.2 اقرأ `volumes:` في `gcloud run jobs describe assess-worker --region=europe-west3 --format=yaml` وأزل **الحجمين غير المركّبين** المتبقيين بـ`--remove-volume` في تحديث الـJob (الترتيب المعدّل في [6.3](ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md#6-recovery-attestation-and-job-by-digest-cloud-shell-20-min): فعّل الإصدار قبل التحديث). **Expected:** `Ready=True`، كل حجم مركَّب، 0 تنفيذات، بلا `--execute-now`. **STOP:** رفض النشر ← لا إعادة محاولة بلا قراءة الخطأ.

## 6. الشاهد الخارجي والمُجدوِل (Cloud Shell)
6.1 اقرأ `gcloud storage buckets create --help` ثم أنشئ دلوًا خاصًا باسم `<projectRef>-assess-witness` في `europe-west3` بوصول موحّد ومنع الوصول العام، وامنح `assess-job` دور `roles/storage.objectUser` **على الدلو فقط**. (الأعلام والدور **Not verified** هنا؛ **STOP** إن رفضها gcloud.)
6.2 جرّب الجاف ثم طبّق:
```bash
RAD_PROJECT=<id> RAD_REGION=europe-west3 bash supabase/staged/self-service/p4-scheduler.sh
RAD_PROJECT=<id> RAD_REGION=europe-west3 APPLY=1 RAD_WINDOW_PERMISSION=I-HAVE-THE-WRITTEN-WINDOW-PERMISSION bash supabase/staged/self-service/p4-scheduler.sh
```
**Expected:** الجاف يطبع 5 أسطر؛ التطبيق ينشئ SA ويربط `run.invoker` على الـJob وحده ويُنشئ `assess-worker-tick` (`*/5 * * * *`). **STOP:** أي ربط على مستوى المشروع.
6.3 **قبل التفعيل** راجع صفحتي تسعير Cloud Scheduler وCloud Run Jobs (لم أستطع قراءتهما) واكتب أن الكلفة مقبولة؛ ميزانية 5 دولار هي الشبكة الأخيرة.

## 7. الاعتماد والتصديق (L + Cloud Shell)
7.1 اعتماد جديد بلا انتهاء: `python3 -I scripts/assess/rotate-grading-credential.py --no-expiry | owner_sql -f -` كما في [الخطوة 5](ASSESS_ENABLEMENT_WINDOW_RUNBOOK.md#5-w2w3-credential-transport-l-15-min) ثم تفعيل الإصدار الجديد، ثم LOGIN والجاهزية (الخطوة 7.1–7.3 هناك). 7.2 تصديق جديد لمرحلتي R1/R2 فقط (`recovery-attestation.mjs` كما في 6.2 هناك). **Expected:** صفوف الجاهزية كلها `t`. **STOP:** أي `f`.
7.3 **رفض الاعتماد القديم:** إن كان ملف الاعتماد القديم متاحًا محليًا: NOLOGIN ← انتظار ≥ 120 ث ← محاولة اتصال واحدة بالقديم من اللابتوب ← يجب أن تُرفض؛ ثم أعد LOGIN. غير متاح ← سجّل **Not run** (لا تُفعِّل سرًّا قديمًا لأجله).

## 8. فتح البوابة (مفتاح الإيقاف العام) وأول نبضات R1
8.1 افتح البوابة بالنص المراجع في [دليل فتح البوابة §5](ASSESS_GATE_OPEN_RUNBOOK.md#5-gate-open--exact-reviewed-sql-only-after-4-is-complete-and-03-is-written). 8.2 فحوص خلفاء التشغيل تتطلب `set radlab.expected_gate='open';` في الاتصال نفسه. الغياب/القيمة غير الصالحة/الحالة المخالفة/الصفوف المتعددة تفشل. فحصا الإيقاف الطارئ يبقيان CLOSED دائمًا. 8.3 انتظر 3 نبضات (≥ 15 دقيقة) واقرأ سجل التنفيذات. **Expected:** `outcome":"COMPLETE"` و`"witness":{"mode":"shadow","result":"init"}` ثم `"advance"`، ولا حقل أيام متبقية (الاعتماد بلا انتهاء). **STOP:** `STOP`/`witness-unreadable`/`db-witness-missing` ← أغلق البوابة (§8 هناك) وأبلغ: يعني مسار الشاهد (الشبكة أو الدور) لا يعمل.

## 9. R2 ثم إثبات الرفض الحي
9.1 ابنِ وادفع مدخل R2 (نسخة `p5-entry-r2.mjs` مكان المدخل) وحدّث الـJob بالـdigest. **Expected:** `"mode":"enforcing","result":"advance"`. 9.2 إثبات رفض آمن: اكتب بيدك نسخة من `witness.json` بـ`seq` أكبر بـ1000 (أمر `gcloud storage cp`)، انتظر نبضة. **Expected:** `outcome":"STOP"`, `"code":"restore_suspected"` ولا `claim`. ثم أعد الملف الأصلي المحفوظ مسبقًا. **Expected:** نبضة تالية `advance`. **STOP:** نبضة COMPLETE رغم التلاعب ← أغلق البوابة فورًا.

## 10. R3 وإحالة التصديق للتقاعد
ابنِ وادفع `p5-entry-r3.mjs`، حدّث الـJob **بإزالة** مسار التصديق (`--remove-secrets`/`--remove-volume` بعد قراءة `--help`)، ثم عطّل إصدارات `assess-worker-recovery`. **Expected:** نبضة `advance`، ولا قراءة لملف التصديق. **STOP:** فشل النبضة.

## 11. بديل بشري حقيقي (OD7)
تمرين البديل المرجعي [الخطوة 5](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md#5-alternate-and-channels-drill-then-a-separate-promotion-pr) بحضور الشخص نفسه؛ سجّل الأوقات في السجل المشفّر. **Expected:** وصول الإشعار للقنوات الثلاث وتنفيذ إيقاف ناجح. **STOP:** فشل أي مرحلة.

## 12. إيصال P7 (تنبيه حقيقي)
عطّل إصدار سر الإعداد مؤقتًا ثم نفّذ الـJob مرة واحدة يدويًا (`gcloud run jobs execute assess-worker --region=europe-west3 --wait`) فيفشل البدء فتطلق سياسة «فشل التنفيذ». **Expected:** بريد التنبيه عند الجهات الثلاث خلال ~10 دقائق؛ ثم أعد التفعيل وتأكد من إغلاق التنبيه. إيصال **الميزانية**: لا زر اختبار ← يبقى **Not run** (خطر مقبول).

## 12ب. عدّ كتالوج المحاكي (قراءة فقط، قبل الخطوة 13)
`owner_sql -f supabase/manual/rad105-simulator-catalogue-count.sql` ← أعداد فقط لكل نوع (`simulator-part` و`full-practical`) مفعّل/غير مفعّل، بلا مفاتيح أو محتوى. **Expected:** `simulator-part` مفعّل ≥ 1 و`full-practical` مفعّل ≥ 1. **STOP:** صفر في أيٍّ منهما ← لا يُجرَّب ذلك المسار في الخطوة 13 ويُسجَّل «Not run (لا كتالوج)»؛ لا يُنشأ محتوى بديل.

## 13. الإثبات الكامل بلا يد المالك — ثلاثة امتحانات اصطناعية
مشرف اصطناعي يجدول **ثلاثة** امتحانات من الواجهة، كلٌّ بعد ~15 دقيقة ومدته 10 دقائق، لطالب اصطناعي: (أ) أسئلة فقط (اختيار واحد)، (ب) مختلط بجزء محاكي واحد، (ج) عملي كامل. لا تلمس شيئًا. **Expected لكلٍّ منها:** يفتح عند الوقت، يُسلَّم، يصحّحه المُجدوِل، تظهر النتيجة في «سجل التقييم» وصفحة الامتحان تعرض الرابط، ويُغلق عند `closes_at`؛ وكذلك «اختبار كل الطلاب» للمسار الأول. **STOP:** أي خطوة تحتاج يدك ← الهدف لم يتحقق لذلك المسار.

## 14. الإيقاف والاستئناف
زر «إيقاف طارئ» (المالك) ← المراحل الست تنجح؛ ثم «استئناف» بالتأكيد المكتوب `RESUME ASSESS`. **Expected:** `loginEnabled: true`, `gateOpen: true` ونبضة `COMPLETE`. (إن عطّلت السر يدويًا فعِّله أنت: الاستئناف لا يلمس Google.) «قبول القاعدة المستعادة» لا يُجرَّب حيًّا (مثبت في CI).

## 15. أول امتحان حقيقي: 20 عنصرًا من ملف XLSX يحتفظ به المالك
بقرار المالك ([التسجيل](DECISIONS.md#assess-self-service-review-owner-2026-11-05)): العناصر العشرون من تأليفك في ملف XLSX بأعمدة `QuestionImport` الحالية، **لا يُرفع إلى Git ولا يُلصق نصه في أي مكان**. 15.1 داخل التطبيق (حساب المالك أو مشرف): الاستيراد عبر شاشة الاستيراد الموجودة ← معاينة ← تحقق الواجهة. **Expected:** 20 عنصرًا صالحًا، لا أخطاء. **STOP:** أي خطأ تحقق ← لا تعدّل الملف بنص طبي من عندي. 15.2 مراجعتك الواحدة للعناصر الـ20 وتسجيل القبول (DS-6). 15.3 النشر ثم الإرسال: «اختبار كل الطلاب» (ميزة منفصلة، مالك دائمًا أو مشرف بإذن) بنافذة تضعها أنت. **Expected:** الاختبار يظهر لكل حساب معتمد وموافق على الخصوصية ولا لغيره. بعد النافذة: لا خطوة يدوية.

## 16. الإغلاق
تحقق نهائي: البوابة على الحالة المتوقعة، الشاهد `advance`، لا تنفيذ عالق، كل الأحجام مركّبة، تنبيهات P7 فعالة. **ما يبقى يدويًا بعدها (سقوف S-STD-3):** تدوير الاعتماد عند الاشتباه فقط (أمر واحد)، «قبول القاعدة المستعادة» بعد استعادة حقيقية، «استئناف» بعد أي إيقاف، وقراءة التسعير. لا خطوة أخرى لكل امتحان.

## حد S2 قبل S3/S4
[عقد S2 ودليله](archive/reports/2026-11/ASSESS_SELF_SERVICE_S2_2026-11-05.md): DB فقط، لم تُطبق حيًا. S3 مشروطة بنجاح S2 وقبولها. Resume بتأكيد مكتوب للمالك والبديل؛ لا يطلق ACTIVE عند الإيقاف أو الحجز التاريخي مجهول المنشأ. قبول الاستعادة للمالك فقط.
حزمة `supabase/manual/selfservice-notify-install.sql` منفصلة لم تُنفذ؛ الإشعارات OFF. تدمج S4 فحصها وإيصالها في نافذة مأذونة لاحقة؛ لا أسرار أو بريد أو cron حي هنا. request_id يثبت enqueue فقط.

## حد S3 قبل S4/P7
S2 مقبولة؛ [تقرير S3](archive/reports/2026-11/ASSESS_SELF_SERVICE_S3_IMPLEMENTATION_2026-11-05.md) يفصل الواجهة وعقود القراءة المعتمدة. فحوص الرأس وقبول S3 مطلوبان قبل S4، ولم تبدأ البنية أو النافذة الحية.
قبل اختبار الواجهة في الخطوة 13: تأكد أن REST يعرض مخطط assess المأذون؛ كشف غير متاح يعني حالة unavailable دون استدعاء RPC غائبة، لا تجاوز للحارس. تبقى الإصدارات المراجعة المثبتة شرط النشر؛ لا تثبيت محتوى جديد من المتصفح.
المحاولة البديلة تأتي من دليل الخادم فقط وتُعاد أهلية المنح تحت القفل؛ الحجز القديم لا يُطلق. واجهة الاستئناف للمالك والبديل، وقبول الاستعادة للمالك فقط.
