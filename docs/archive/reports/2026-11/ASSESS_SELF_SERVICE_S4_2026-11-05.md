# RAD-105 — S4 تحضير التشغيل، 2026-11-05

## 1. الانحرافات والميزانية
السقف39 مسارًا محددة قبل التعديل؛ استُعمل38 وحُجزت حزمة backup دون كتابتها قبل الاعتماد؛ بدأت11 ثم توسعت باستثناء العامل المعتمد، ثم مسار واحد لإلحاق بروفة الصورة بالأصل دون تغيير تأكيداته، ومساران لتغليف صورة النسخ الخاملة، ثم فحصا p2/p3 لتحديث marker ومقارنة تسميتي الصورة المعتمدتين فقط.
Verified: قبول S3 وتصحيح الساعة عند `894e58089a6365848074550973da2a18d80ff715` سُجل في أول تحديث توثيقي؛ قبول S1/S2 محفوظ.
Verified: تحقق GitHub والجلب المحدود من #242 Draft على main؛ لا عمل لاحق مفقود أو حاجة لدمج؛ لا rebase/force-push/PR جديد.

## 2. المنجز والمستبعد
Verified: مراجعة العقود معًا كشفت أن الصورة ومداخل R1/R2/R3 والجدولة تسلك v1 بينما الواجهة تنشئ v2؛ claim_v1 لا يلتقطها. الاختبارات اليدوية القديمة ليست إثبات أتمتة.
Verified: [استثناء المالك الضيق](../../../DECISIONS.md#assess-self-service-s4-worker-owner-2026-11-05) لخليفة العامل بخمس عمليات فقط؛ لا جدول/إدارة/عضوية إضافية للعامل.
Verified: محول v2 مجدول، wrapper صحة/شاهد منفصل العدادات، بناء R1/R2/R3 مميز بالمانيفست، وحزمة تبديل ذرية وفحص خليفة. الأصل v1 محفوظ.
Verified: مخطط بنية يطبع dry-run فقط: bucket خاص، احتفاظ محدود، Scheduler يومية PAUSED، وسياسات تنبيه DISABLED للقنوات القائمة.
Verified: runner نسخ مشفر خامل افتراضيًا؛ المخزن لا يستقبل إلا age archive كاملًا بعد نجاح المراحل. مفتاح فك التشفير خارج job وGit.
مستبعد: كل إجراء حي وSQL/cloud/Vault/Brevo/provider/cron أو أسرار/Variables/نشر يدوي/merge/Ready. P7 لم تبدأ، وAssess ليست operational.

## 3. حالة المهمة
S4 قيد التنفيذ؛ اعتماد سياسات قراءة backup المحددة ما زال معلقًا، ثم دليل CI للرأس المدفوع ومراجعة التنسيق. لا إكمال RAD-105 أو إذن تشغيل من هذه الدفعة.
[العقود والتكاليف والحدود التشغيلية](../../../ASSESS_S4_OPERATIONS.md) و[الدليل الموحد](../../../ASSESS_P7_LAPTOP_RUNBOOK.md).

## 4. المشتركات وScale
Verified: إعادة استخدام Scheduler OAuth/run.invoker وRAD-086 age/snapshot/restore والقنوات والطوارئ وgrader v2 والشاهد القائم؛ لا مسار تقييم أو إشعار جديد للطلاب.
التبديل يرفض إلا CLOSED، NOLOGIN لكلا الفتحتين، صفر backends وصفر v1 غير منتهية أو held أو leased؛ لا جمع مؤقت لمجموعتي grants. rollback احتواء ومصالحة بلا replay أعمى.
Verified: معايرة production-fixture embedded وSupabase17.11 المستقلة الجديدة: functions `533f4f22d9f07200e6c4dbab596b4dca` → `50f46f597788805b0e67bc40c04401d4` لدالة واحدة مضافة؛ كل تعريف قديم مطابق، وrelations أعيد قياسها ثابتة `5c45889099a878446fd3a16a9569940f`.
Candidate: `pilot-v1:8c8207de423ba717b4607f3d9cd029f2f16436f4f6e4b8df06679eff3cc2dedc` لترحيل006 وخليفة catalogue؛ لا pin متصفح جديد، ولا تغيير P0 الحية/Variable.
خليفة catalogue يستثني EXECUTE غير القابل للتفويض على عمليات العامل المسماة فقط؛ ACL التفصيلية منفصلة. دوال/منح/بنية أخرى أو grant option تُرفض؛ الأوراكل S1/S2/S3 تسبق S4 دون تغيير.
Verified:65 مسارًا محميًا مطابقة بايتًا للرأس المقبول، بما فيها الترحيلات السابقة وC3 وحزم الهاتف وgrader وUI/clock؛ browser pins/guards ثابتة.
المراجع الشرعية فقط: قائمتا migrations/checks والعلامة في frontend-manifest وrad062-supervisor-catalogue؛ إحالة خليفة واحدة في name/erasure. digests مداخل R1/R2/R3 تغيرت لتتطلب build المسمى؛ P1/P5 وC3 والهاتف والترحيلات السابقة ثابتة.
Scale:20 محاولة/240 ثانية، pool1، retries0؛ احتفاظ1–90 يومًا (مرشح30)، قياس حجم يومي حتى24ساعة + تأخر القناة. الرفع يحتاج مراجعة الحمل/الكلفة/الخصوصية؛ لا ادعاء حذف لحظي من lifecycle.

## 5. الطب والتقييم
Verified: لا محتوى طبي أو scoring أو ترتيب سؤال/خيار أو ساعة S3 تغير. fixtures هندسية قائمة، لا اعتماد طبي.
أول امتحان حقيقي يبقى XLSX لدى المالك عبر QuestionImport خارج Git؛ إثبات المسارات الثلاثة الحي مطلوب في P7 خطوة13.

## 6. التحقق
Verified: preflight محلي يعيد فجوة claim_v1 وRLS، ثم فحوص التبديل الذري ورفض النافذة/LOGIN/v1 غير المنتهية وشكل الصحة المنفصل؛ خمسة اختبارات مركزة ناجحة مع معايرة embedded وحارس marker.
Verified: بروفة PostgreSQL17.11 فعلية للنسخ: dump/age/decrypt/restore في cluster جديدة ناجحة، مع أدوار ومِلْكية وعضويات وdefault ACL عبر helper RAD-086، وبيانات محمية وثنائية وLOB/sequence وACL/RLS وchecksums، ورفض الكتابة/nextval/DDL/SET ROLE؛ drift وفشل upload ينظفان المؤقت ولا يرفعان archive.
Verified: health:sizes بالسقوف القائمة وhealth:test9/9؛ dry-run لا يقرأ اعتمادًا أو يفتح اتصالًا؛ خطط التنبيه ترفض credentials/حقن الأوامر/قنوات غريبة، وحد70% يُفحص عند العتبة وقبلها والحجوم الكبيرة.
Verified: بناء سياقَي العامل الأصلي والجديد؛ lint/typecheck والبناء العادي وPages ناجحة داخل Node22؛ health:source بلا أخطاء. لا تغيير سقف أو تأكيد. CI للرأس المدفوع قيد الانتظار.
Not run محليًا: Supabase17 المطلوبة بعد فشل extraction بـENOSPC؛ لا صورة بديلة أو skip. CI الأول نجح في unit/build/docs والعامل الأصلي الكامل وW1–W3؛ الإضافة توقفت عند M02 لأن fixture W4 يفتقد singleton data. أُضيفت تهيئة المصدر المراجع نفسها من معايرة الإنتاج. المحاولة التالية رفضت M09 لوجود W1 قبلها في fixture؛ صُحح ترتيبها مع NOLOGIN وصفر backends وإعادة grants v1 الدقيقة قبل التبديل، دون تعديل guard. أُكمل إعداد اسم الطالب وصلاحيات المشغّل الاصطناعي وحجم TLS خاص بفارق UID؛ Verified: الرأس البرمجي b219f34 اجتاز بروفة صورة S4 المضافة للمسارات الثلاثة وR1/R2/R3 وwitness/ACL/stop/replay والتنظيف؛ DB1140/1142؛ فشلان في توقع marker S3 وتسميتي R1/R2 فقط، صُححا بقيم S4 الدقيقة دون تغيير guards أو تأكيدات v1. أضيف أيضًا اختبار رفض lease حقيقية منتهية عبر host enforcing ينتظر CI؛ دليل آخر رأس المدفوع مرجعه [فحوص ووصف #242](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/242/checks).
Verified: host SWC رفض cache؛ فُصل عطل البيئة وشُغلت typecheck/lint/build داخل Node22 محلي. unit المحلية2570/2596:22مهلة و4إخفاقات DOM لاحقة لمهلة في ملف owner-surveys غير المعدل؛ لا ادعاء PASS كامل أو تخفيف مهلة. الإعادة المنفردة للملفات الـ16 ناجحة424/424، وCI مطلوب للرأس المدفوع.
Verified: أدلة S3 browser/axe/family EN/AR390/1440 والساعة يعاد استخدامها لعدم تغيير UI؛ لا تكرار بلا مبرر.
Not run: استلام بريد أو suppress حي لمدة ساعة، SQL/cloud/Vault/Brevo، فحص هاتف، جدولة/تقييد مصدر فعلي أو P7؛ كلها تحتاج النافذة المستقلة.

## 7. المفتوح والتكلفة
سياسات backup للقراءة فقط تحتاج الاعتماد المطلوب؛ SELECT وحده يخفي صفوف RLS. `--enable-row-security` مشروط بسياسة true كاملة محددة للدور ورفض restrictive/inventory drift، لا قبول dump ناقصة.
اكتمال جداول Auth/extension والـlarge objects وVault وإعدادات المزوّد، وصورة job النهائية واستعادة الأدوار كاملة، يجب إثباته قبل أي استبدال لنسخة اللابتوب؛ لا صلاحية BYPASSRLS أو إدارة ضمن المقترح.
Verified: Google توثق static egress عبر VPC/NAT؛ IP بسعر0.005USD/ساعة (~3.60USD/720h)، processing0.045USD/GiB إضافة إلى gateway/egress. **COST STOP**؛ لا موارد مدفوعة أُنشئت.
Verified: Free معلنة0USD و500MB، Pro من25USD/شهر؛ IPv4 المباشرة0.0055USD/ساعة (~4USD/شهر) منفصلة. أهلية هذا الحساب وIPv6/IPv4 غير متحققة؛ لا تحويل pooler أو توسيع CIDR. [المصادر الأولية الحالية](../../../ASSESS_S4_OPERATIONS.md#source-restrictions--cost-stop-sources-read-2026-11-05).
هل تغير حكم مختصر؟ لا. هل بقي رابط دليله الأصلي؟ نعم؛ تقارير S1–S3 وقراراتها والأوراكل المحمية محفوظة.

## 8. قائمة المالك والنص التالي
قائمة موحدة: اعتماد سياسة backup المحددة؛ مراجعة اكتمال S4 وCI للرأس النهائي؛ اختيار خيار المصدر بعد الكلفة أو قبول الخطر صراحة؛ ثم قبول مراجعة S4 قبل أي نافذة P7. لا قرار منتج معاد.
بعد استيفاء S4 وقبولها فقط، يكون النص التالي صالحًا؛ ليس أمرًا للوكيل الآن:
```text
Mode: owner P7 window — RAD-105, only after S4 coordination acceptance and green
final pushed-head CI. Verify the reviewed merged candidate and all remaining S4
coverage/image/backup/cost decisions first; otherwise STOP. Read the single P7
runbook and applicable decisions. Owner supplies fresh written live permission,
fresh laptop backup and baseline; this prompt itself grants no live authority.
Follow each Expected/STOP/rollback in order: migrations and schema/OpenAPI,
readiness/marker, atomic five-operation worker switch with CLOSED/NOLOGIN/zero
connections/zero unfinished v1, digest image, Scheduler, R1/R2/R3, encrypted
backup/restore and receipt, alerts/rate proof, old-credential rejection, alternate
drill, stop/resume and synthetic questions/mixed/full-practical at step13.
No blind replay or release of ACTIVE-at-stop/unknown holds. Stop on any gap.
First real exam remains owner-held XLSX through QuestionImport, never Git.
```
