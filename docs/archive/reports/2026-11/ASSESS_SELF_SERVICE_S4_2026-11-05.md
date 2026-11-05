# RAD-105 — S4 تحضير التشغيل، 2026-11-05

## 1. الانحرافات والميزانية
Verified: السقف39 مسارًا، استُعمل38 وحُجز `supabase/manual/selfservice-backup-read.sql` دون كتابته قبل الاعتماد.
بدأ السقف11؛ توسع إلى34 باستثناء العامل، ثم35 لإلحاق بروفة الصورة، ثم37 لتغليف النسخ، ثم39 لتحديث فحصَي p2/p3 الدقيقين؛ أُعلنت المسارات قبل كل توسع.
Verified: قبول S3 وتصحيح الساعة عند `894e58089a6365848074550973da2a18d80ff715` سُجل في أول تحديث توثيقي؛ قبول S1/S2 محفوظ.
Verified: GitHub والجلب يثبتان #242 Draft على main؛ لا عمل لاحق مفقود، ولا حاجة لدمج main، ولا rebase/force-push/PR جديد.

## 2. المنجز والمستبعد
Verified: الصورة ومداخل R1/R2/R3 كانت تستخدم v1، بينما S2/S3 تنشئ start_v2؛ claim_v1 يترك محاولات v2. الاختبار اليدوي القديم ليس إثبات أتمتة.
Verified: نُفّذ [استثناء العامل الضيق](../../../DECISIONS.md#assess-self-service-s4-worker-owner-2026-11-05): خمس عمليات فقط، بلا جدول/إدارة/عضوية إضافية للعامل؛ عقود وتأكيدات v1 محفوظة.
Verified: بناء خليفة R1/R2/R3، binding مقيد، health/witness منفصل العدادات، حزمة تبديل ذرية وفحص جاهزية؛ الصورة المقصودة صححت المسارات الثلاثة.
Verified: runner نسخ مشفر وسياق صورة خاملان افتراضيًا؛ مخطط bucket خاص واحتفاظ محدود وجدولة PAUSED وتنبيهات DISABLED للقنوات القائمة.
Verified: دليل P7 موحد لكل خطوة Expected/STOP/rollback؛ إنشاء Scheduler قد يكون ENABLED، لذا يلزم pause فوري وصفر executions مع CLOSED/NOLOGIN/سر DISABLED قبل تفعيل الاعتماد.
مستبعد: SQL/cloud/Vault/Brevo حي، أسرار/Variables، provider/cron، نشر يدوي، merge/Ready/auto-merge؛ P7 لم تبدأ وAssess ليست operational.

## 3. حالة البنود
Verified: RAD-105 تبقى blocked/owner؛ S4 محضرة جزئيًا، وليست مقبولة أو مكتملة بهذا التقرير.
1: النسخ والتشفير والاستعادة الاصطناعية جاهزة؛ حزمة grants/RLS الإنتاجية وتغطية المزوّد وصورة النسخ لم تثبت بعد.
6: سياسة الفشل تجمع Scheduler وworkerSTOP، حد3600s بلا labels/reminders/closure، ونص «قد يكون الإيقاف مقصودًا»؛ الاستلام والتواتر الحيان غير مجرّبين.
7: قياس pg_database_size وعتبة70% صحيحة حسابيًا؛ مطابقة Usage ووحدة حد الخطة وتسليم القناتين تبقى بوابات P7.
10: الخيارات والتكاليف موثقة، بما فيها dual-stack القائمة؛ لا تقييد مصدر مفعّل ولا مورد مدفوع جديد.
[التفصيل والأدلة الأولية](../../../ASSESS_S4_OPERATIONS.md)؛ [الدليل الموحد](../../../ASSESS_P7_LAPTOP_RUNBOOK.md).

## 4. المشتركات وScale والعلامات
Verified: إعادة استخدام Scheduler OAuth/run.invoker وRAD-086 age/snapshot/role reconciliation، والقنوات والطوارئ وgrader v2 والشاهد؛ لا مسار إشعار طلاب جديد.
التبديل يرفض إلا CLOSED وNOLOGIN لكلا الفتحتين وصفر backends وصفر v1 غير منتهية أو held أو leased؛ grants تُستبدل ذريًا. rollback احتواء ومصالحة بلا replay أعمى.
Verified: معايرتان مستقلتان، embedded وSupabase17.11: functions `533f4f22d9f07200e6c4dbab596b4dca` → `50f46f597788805b0e67bc40c04401d4` لدالة worker_health_v2 وحدها؛ كل تعريف قديم مطابق.
Verified: relations أعيد قياسها ثابتة `5c45889099a878446fd3a16a9569940f`؛65 مسارًا محميًا مطابقة بايتًا لـS3 المقبولة، بما فيها الترحيلات السابقة وC3 والهاتف وgrader وUI/clock.
Candidate: `pilot-v1:8c8207de423ba717b4607f3d9cd029f2f16436f4f6e4b8df06679eff3cc2dedc` لترحيل006 وخليفة catalogue؛ لا تغيير P0 الحية أو Variable أو browser pins/guards.
المراجع الشرعية: قوائم migrations/checks والmarker في frontend-manifest وrad062-supervisor-catalogue وp2؛ إحالة الخليفة في name/erasure؛ digests مداخل R1/R2/R3 وتسميتا الصورة في مقارنة p3 الدقيقة.
خليفة catalogue تستثني grants العمليات المسماة غير القابلة للتفويض فقط؛ فحص ACL الدقيق منفصل. دالة/جدول/عضوية/grant option زائدة تُرفض؛ أوراكل S1–S3 تسبق S4 دون تغيير.
Scale:20 محاولة/240ثانية، pool1/retries0؛ احتفاظ1–90 يومًا (مرشح30) مع حذف lifecycle غير لحظي؛ قياس حجم يومي بتأخر≤24ساعة ثم تأخر القناة. رفع الحدود يحتاج مراجعة حمل وكلفة وخصوصية.

## 5. الطب والتقييم
Verified: لا محتوى طبي أو scoring أو server shuffle أو ساعة S3 تغير؛ fixtures هندسية قائمة، وليست اعتمادًا طبيًا.
أول امتحان حقيقي يبقى XLSX لدى المالك عبر QuestionImport خارج Git، بعد أدلة P7 الحية؛ لا يُنشأ من fixtures المستودع.

## 6. التحقق C6
Verified: [CI للرأس البرمجي 7ff13df](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/42124346725): unit2596/2596 وDB1142/1142، build وPages وhealth:sizes وdocs ناجحة.
Verified: بروفة العامل الأصلية PASS/complete/cleanup=true؛ خليفة الصورة PASS/cleanup=true: أسئلة/mixed/full-practical عبر start_v2/submit والصورة المقيدة، نتيجة وحيدة وحذف details، R1/R2/R3 وwitness/ACL/revocation/stop/replay.
Verified: lease حقيقية تُكتسب ثم تُنهى اصطناعيًا؛ host enforcing يرفض finish ولا ينشئ نتيجة أو يحذف التفاصيل. grant option/عضوية/دالة/جدول زائد، NOLOGIN والشاهد القديم تتوقف قبل claim؛ SIGTERM يغلق الاتصالات.
Verified: بروفة PostgreSQL17.11 محلية للنسخ 2/2: dump/age/decrypt/restore في cluster جديدة؛ أدوار/إعدادات/عضويات/ملكية/default ACL وRLS وبيانات ثنائية وLOB/sequence/checksums مطابقة.
Verified: النسخ يرفض كتابة/nextval/DDL/SET ROLE وsecurity-definer writer وrestrictive policy وinventory drift؛ فشل upload ينظف المؤقت. مفتاح age الخاص في الاستعادة فقط، لا job/API/repo.
Verified: المخطط3/3؛ dry-run بلا قراءة اعتماد أو اتصال؛ عتبة70% وحدودها والحجوم الكبيرة ورفض config/حقن/قنوات غريبة. فحوص التبديل الذري والmarker ومعايرة catalogue/mutations ناجحة.
Verified: lint/typecheck والبناء العادي وPages وhealth:source وhealth:test9/9؛ docs:sync مرتان (الثانية0)، docs:check بلا أخطاء مع21 تحذير مراجعة قائم، status:check --require-previous وdiff --check ناجحة.
Verified: فشل host SWC أُسند للcache وشُغلت أدوات البناء داخل Node22 محليًا؛ unit المحلية2570/2596 بسبب22مهلة و4DOM لاحقة، ثم424/424 عند إعادة الملفات الـ16 منفردة. CI الكامل أعلاه ناجح؛ لا تخفيف مهلة أو golden.
Verified: فشلا marker S3 وتسميتي R1/R2 القديمين صُححا بالقيم المعتمدة؛ إعداد fixture يحفظ singletons وترتيب M09/W1 واسم/موافقة الحساب وTLS الخاص بـUID، دون تعديل guard أو تأكيد v1.
Verified: أُعيد استخدام أدلة S3 EN/AR390/1440 وaxe/family/clock لثبات UI، وفق أمر المالك؛ لم يُكرر المتصفح بلا سبب.
Not run محليًا: صورة Supabase17 وصورة النسخ النهائية توقفتا عند ENOSPC في vfs؛ الأولى أثبتتها CI المطلوبة، والثانية تبقى فجوة. سياقا النسخ متطابقان، لكن ذلك ليس برهان صورة؛ نُظفت cache هذه المحاولة فقط.
Verified: Deploy يتوقف عند Require verified pilot schema، قبل Build/deploy؛ لا Variable تغيرت. آخر دفعة توثيق/مخطط تحتاج فحص رأسها المدفوع، ومرجعه النهائي [وصف وفحوص #242](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242/checks).
Not run: استلام بريد/suppression لمدة ساعة، SQL/cloud/Vault/Brevo، فحص هاتف، جدولة أو مصدر فعلي وP7؛ لا سلطة حية في هذه الدفعة.

## 7. الفجوات والتكلفة
Not run: اعتماد حزمة SELECT/RLS المحددة؛ SELECT وحده يخفي الصفوف وrow_security=off يرفضها. `--enable-row-security` مشروط بسياسة true SELECT للدور وحده ورفض restrictive/inventory drift؛ لا قبول dump ناقصة.
Not run: اكتمال Auth/extension/Vault وإعدادات المزوّد وتغطية كل LOB/sequence والأدوار على الصورة الإنتاجية؛ لا BYPASSRLS/إدارة/عضوية للنسخ ضمن المقترح. لا استبدال لنسخة اللابتوب قبل هذه الأدلة والفشل/الاستلام.
Inferred: قد تسمح شبكة dual-stack القائمة بتقييد IPv6 CIDR بلا NAT جديد؛ العنوان الفردي ephemeral وsubnet ليست عزلًا لدور واحد. جرد CIDR ومشاركيها وأهلية الحساب ووصول اللابتوب والبديل والنسخ غير متحقق.
Verified: Google لا تسعّر نطاق IPv6 الخارجي للsubnet كعنوان؛ تكاليف النقل تبقى. بديلIPv4/NAT يحتاج COST STOP:0.005USD/ساعة للعنوان (~3.60/720ساعة) و0.045USD/GiB، فوق gateway/egress.
Verified: Supabase Free معلنة0USD و500MB، Pro من25USD/شهر؛ IPv4 المباشرة0.0055USD/ساعة (~4USD/شهر). لا تُفترض ترقية أو أهلية أو فاتورة صفرية؛ [المصادر الحالية](../../../ASSESS_S4_OPERATIONS.md#source-restrictions--cost-stop-sources-read-2026-11-05).
هل تغير حكم مختصر؟ لا. هل بقي رابط دليله؟ نعم؛ [قرارات وتسليم S1–S3](../../../ASSESS_SELF_SERVICE_DESIGN.md#12-current-hardening-and-delivery) وتقاريرها وأوراكلها محفوظة.

## 8. قائمة المالك والنص التالي
قائمة موحدة: اعتماد سياسة backup المحددة؛ إثبات تغطية المزوّد وصورة النسخ والاستعادة؛ مراجعة S4 وCI للرأس النهائي؛ اختيار المصدر بعد دليل الكلفة/الأهلية أو قبول الخطر صراحة؛ ثم قبول مراجعة S4 قبل أي نافذة P7.
بعد استيفاء S4 وقبولها فقط يكون النص التالي صالحًا، وليس أمرًا الآن:
```text
Mode: owner P7 window — RAD-105, only after S4 coordination acceptance and green
final pushed-head CI. Verify the reviewed candidate and all remaining S4 backup,
coverage/image and source/cost decisions; otherwise STOP. Read the single P7
runbook and applicable decisions. Owner supplies fresh written live permission,
fresh laptop backup and baseline. Merge requires explicit owner instruction at
runbook step4; this prompt itself grants no live authority.
Follow Expected/STOP/rollback: migrations, schema/OpenAPI, readiness/marker,
atomic five-operation switch with CLOSED/NOLOGIN/zero connections/zero unfinished
v1, digest image, paused Scheduler, witness R1/R2/R3, encrypted backup/restore,
alerts/rate/receipt, old-credential rejection, alternate drill, stop/resume and
synthetic questions/mixed/full-practical at step13. Stop on any missing evidence.
No blind replay or release of ACTIVE-at-stop/unknown holds. First real exam is
the owner-held XLSX through QuestionImport, never Git.
```
