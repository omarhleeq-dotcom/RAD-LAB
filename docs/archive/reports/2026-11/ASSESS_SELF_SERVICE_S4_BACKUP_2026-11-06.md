# RAD-105 — استكمال نسخ S4، 2026-11-06

## 1. الانحرافات والميزانية
Verified: موافقة SELECT/RLS ثم استثناء دوال LOB الثلاث سُجلتا قبل التنفيذ في [DECISIONS](../../../DECISIONS.md#assess-self-service-s4-backup-owner-2026-11-06).
الميزانية المعلنة33 مسارًا للاستكمال، والسقف المجمع52؛ لا توسعة للعامل أو UI أو حزم الهاتف. العدد النهائي والفحوص قيد الإكمال.
Verified: بقي #242 Draft على main؛ لا rebase أو force-push أو PR جديد أو دمج. S1–S3 مقبولة، وقبول S4/P7 معلق.

## 2. المنجز والمحذوف
Verified: compiler بلا اتصال، جرد محدود، حزمة ذرية default dry-run، SELECT محدد وسياسات SELECT إضافية solely assess_backup.
Verified: عولجت قدرة إنشاء LOB عبر PUBLIC باستثناء المالك المحدد: lo_create(oid)، lo_creat(integer)، lo_from_bytea(oid,bytea) فقط.
Verified: الأدوار القائمة تحتفظ بـEXECUTE عبر منح مسمّاة، ثم سحب PUBLIC ذريًا؛ لا عضويات/كتابة جداول/إدارة/BYPASSRLS/default grants أو تبديل تعريفات.
Not run: تثبيت أو تفعيل حي؛ لا حذف وظائف أو اختبارات أو توسيع صلاحيات لمعالجة ownership غير مدعوم.

## 3. حسب المهمة
Verified: الدور يبقى NOLOGIN حتى نافذة لاحقة؛ drift أو اتصالات أو restrictive policy أو RPC/كتابة/decrypt فعالة توقف الحزمة أو النسخ.
Verified: actual pg_dump مع exported snapshot وRLS، ثم age بمفتاح عام فقط ورفع مشفر generation-match0؛ private identity خارج job.
Verified: التزامن المحلي يشمل DML وLOB وsequence advance/reset وDDL المنتظر وschema ABA وenum وrole archive ABA؛ لا upload عند STOP ولا blind replay.
Inferred: نجاح جرد المزوّد وصلاحياته واستعادة النسخة الفعلية شرط لتغطية الإنتاج؛ fixture ليست ذلك الدليل.
Not run: retention الفعلية ورسائل التنبيه/حد الساعة/الاستلام و70% وحد الخطة وتقييد المصدر؛ تتطلب نافذة/قراءة حساب لاحقة مأذونة.

## 4. المشترك وScale
Verified: جرد≤2000 relation و4096 LOB و256 دورًا و5000 دالة؛ لا بيانات صفوف/كلمات مرور/دوال/قيم إعدادات في ملف جرد المالك.
Verified: native TABLE DATA لكل جدول مطلوب؛ extension filter وforeign/materialized required data غير مدعومة تعني STOP، لا استثناء صامت.
Verified: الصفوف/LOB من snapshot واحد؛ sequences متزايدة بلا cycle فقط، قيمة archive لا تتراجع عن البداية أو max العمود المملوك. gaps مسموحة، لا ادعاء snapshot عالمي للأدوار/sequences.
Verified: role SQL الفعلية تُستعاد بقاعدة محلية socket-only داخل ذاكرة job وتُقارن بmetadata؛ catalogue drift أو نقص/اختلاف الاستعادة توقف النشر.
الأدوار/الجداول المستقبلية تتطلب مراجعة جرد جديد؛ دوال constructor لا تُمنح تلقائيًا لدور جديد. رفع السقوف يحتاج عقدًا ومراجعة حمل جديدة.
Verified: وظائف العامل بقيت `50f46f597788805b0e67bc40c04401d4`؛ الجداول بعد سياسات النسخ `9e9702304abbc3e87e50005468638737`، وقبلها البصمة الأصلية مع غياب الدور فقط.
Verified: المرشح `pilot-v1:84c980aa7325174878ccb41d73c044f9961aacb7f8ef68f64af58cd9ccc5f3d6` من check الخلف الجديد؛ لا تعديل pin للمتصفح أو P0 أو Variable.

## 5. الطب والتصحيح
Verified: لا تغيير للمحتوى الطبي أو scoring أو server shuffle أو ساعة S3 أو QuestionImport؛ أول ملف XLSX حقيقي يبقى عند المالك خارج Git.
Verified: أدلة S3 EN/AR390/1440 وaxe/family تُعاد الاستفادة منها لثبات UI؛ لا سبب متعلق بالنسخ لإعادة تصويرها.

## 6. QA
Verified: الاختبارات المحلية الفعلية أثبتت dump/encrypt/restore والمنح السلبية ورفض RPC/SET ROLE وconstructor بعد التصحيح وحفظ وصول الأدوار القائمة.
Verified: بناء الصورة المثبتة نجح على CI، مع default صفر اتصال/رفع وnon-root وtmpfs وTLS؛ متابعة الاستعادة ومقارنة الجرد قيد الإكمال.
Verified: Ubuntu-latest أصبح26.04 دون PG16؛ ثُبتت مهمتا DB/backup على24.04، دون تغيير bases/assertions أو حدود15دقيقة. لا cleanup إلا لموارد المهمة.
Not run: إثبات pushed-head النهائي جارٍ؛ لا ادعاء CI أخضر قبل اكتماله. ستُسجل نتيجة docs sync مرتين/check/status/diff في الإقفال.

## 7. الفجوات الدقيقة والتكلفة
Not run: inventory وownership الفعليان للمزوّد، وحق تثبيت سياسات Auth/Storage ووظائف PG المملوكة للمزوّد وإنشاء دور دون عضوية آلية. [حزمة القراءة فقط](../../../../supabase/checks/selfservice-backup-inventory.sql) جاهزة ولا تُنفذ هنا.
Not run: restore فعلية مع provider extensions/settings وVault external key؛ استعادة ciphertext لا تثبت فك Vault. Storage metadata ليست object bytes؛ role passwords مستبعدة عمدًا وتدوّر بعد الاستعادة.
Not run: provider recovery/retention deletion/notification receipt/old-credential rejection/alternate drill/live Scheduler tracks؛ النسخ الآلي غير مفعل واللابتوب مطلوب.
Inferred: إعادة استخدام dual-stack subnet قد تجنب رسم عنوان IPv6، مع كلفة مرور قائمة؛ CIDR/stability/المشاركون/entitlement غير متحققين.
Verified سابقًا: [مصادر السعر بتاريخ5نوفمبر](../../../ASSESS_S4_OPERATIONS.md#source-restrictions--cost-stop-sources-read-2026-11-05): NAT IPv4 نحو$3.60/720h +$0.045/GiB ورسوم gateway؛ Supabase IPv4 نحو$4/شهر، وPro من$25 إن لزم. لا فاتورة حساب فعلية أو تفعيل مدفوع.

## 8. قائمة المالك الموحدة والموجّه اللاحق
1. راجع التقرير والرأس وCI والبصمات والاستثناءين؛ S4 تنتظر قبول المراجع، ولا تُوصف Assess operational.
2. بإذن قراءة مستقل لاحق: احفظ الجرد غير السري خارج Git، طابق provider ownership والامتيازات والتغطية وحد الخطة/التكلفة؛ أي gap يعني STOP، لا صلاحيات إضافية تلقائية.
3. أبقِ نسخة اللابتوب؛ أثبت native provider dump/restore مع مفاتيح Vault الخارجية وStorage files/config المطلوبة دون إدخال private key إلى job.
4. بعد قبول S4 فقط اطلب نافذة المالك الجديدة وفق [الدليل الموحد](../../../ASSESS_P7_LAPTOP_RUNBOOK.md): migrations، الحزمة اليدوية، readiness/schema/OpenAPI/marker، image/binding/Scheduler وR1/R2/R3.
5. أكمل نسخة02:17UTC والتنبيهات/إيصال الشخصين وحد الساعة/70% والاعتماد القديم والبديل والإيقاف/الاستئناف والمسارات الثلاثة قبل تشغيل فعلي أو استيراد XLSX.
الموجّه المشروط: «بعد قبول مراجعة S4 وإغلاق فجوات المزوّد، راجع الرأس النهائي والدليل وأدلة الجرد/الاستعادة/السعر؛ جهّز نافذة P7 واحدة تطابق02:17UTC، وانتظر إذن المالك الحي المحدد. لا تبدأ من هذا التقرير.»
