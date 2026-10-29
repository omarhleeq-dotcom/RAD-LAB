# RAD-060 — المرحلة1 للمالك وقرارات2026-10-29

## 1. الانحرافات والميزانية

الهدف: قائمة مستقلة وإغلاق نهائي للمالك في `/[locale]/owner?tab=assess` بالـRPC الحية فقط. الميزانية المعلنة قبل التعديل:9ملفات منتج/QA و4وثائق. الملفات بالضبط:

- `src/features/assess/owner-assignments.ts`
- `src/features/assess/owner-assignments.test.ts`
- `src/features/assess/OwnerAssignments.tsx`
- `src/features/assess/owner-assignments-ui.test.ts`
- `src/features/assess/OwnerAssessPanel.tsx`
- `messages/en.json`
- `messages/ar.json`
- `scripts/qa/rad-060-owner-close-audit.mjs`
- `scripts/pages/frontend-schema.json`
- هذا التقرير، `docs/project-status.md`، `docs/HANDOFF.md`، `docs/DECISIONS.md`.

صفر SQL/migrations أو وحدات مشتركة موسعة؛ لا worktree أو subagents. قاعدة البدء main المحدثة ودمج #156 تحققا عبر docs:context/GitHub وfetch. ثلاث مراحل commit/push: القرارات والحالة؛ الربط/الواجهة واختباراتهما؛ QA النهائي والتقرير وDraft PR. لا deploy أو Variables أو ready/merge/auto-merge أو skip ci أو معاينة مستضافة.

## 2. المنجز والمستبعد

سُجلت [قرارات المالك](DECISIONS.md#assess-phase1-owner-2026-10-29) و[دليل الميزانية](DECISIONS.md#rad059-budget-owner-2026-10-29). اكتمل الربط والواجهة: قائمة منفصلة page20+cursor، مفتوح/وقت إغلاق UTC، Close ثم Confirm/Keep open، ونص نهائية الإغلاق. يعاد جلب الصفحة عند stale revision دون إعادة الكتابة؛ عند غموض الرد تختفي إجراءات الإغلاق حتى قراءة صريحة. تعطيل retry يشمل SDK نفسه. تُلغى الطلبات وتُخفى البيانات عند تبدل الهوية/الدور. أُعيد استخدام نمط التأكيد من IssuedAssignments كتصميم محلي دون استيراد P2 runtime. P2/authoring/publisher وشاشات المشرف وكل ما بعد المرحلة1 خارج التنفيذ المأذون.

## 3. بحسب المهمة

RAD-060 إلى in_progress؛ تبقى كذلك حتى دمج المالك ونجاح فحص الهاتف ثم review. RAD-062 إلى planned/waiting_on owner؛ الخطة فقط معتمدة، والوصف يحيل إلى القرارات. RAD-059 تبقى review؛ دليل المالك: ميزانية GCP الموجودة $5 شهريًا، promotional credits مستبعدة، actual10/25/50/80/100% وforecast100%، بريد billing admins، بلا Pub/Sub؛ استلام البريد غير مختبر. لا تعديل مهام أخرى.

## 4. التغييرات المشتركة وS-STD-3

ربط خاص بالمالك بدل توسيع admin-data؛ لا استيراد runtime من P2. صفحة20 ومؤشر خادمي، بلا جمع كل الإسنادات؛ السقف ثابت للعقد الحالي ويُراجع بإصدار جديد إذا احتاج المنتج حجمًا آخر. EN/AR لغتا المنتج الحاليتان؛ أي لغة جديدة تتبع سجل الرسائل. لا قائمة IDs أو أسماء مشرفين ثابتة. قرار توسيع رفع الملفات وauto-author في4ب يستلزم إعادة تقدير ميزانية تلك المرحلة؛ لا parser أو dependency الآن.

schema gate: مراجعة المصدر أظهرت فقط RPC `assess.assignment_page_v2(p_group=null,p_after,p_limit=20)` و`assess.assignment_close_v2(p_assignment,p_revision)`؛ كلاهما في M3/M4 المطلوبة أصلًا. رفض الحارس المصادر قبل تحديث pins، ثم قبل الحدود المراجعة. لا تغيير للحارس أو متطلبات SQL/checks أو guardedFeatures/consumer pins أو `assignmentsEnabled=false`.

`PILOT_SCHEMA_VERIFIED` **لا يتغير**، وحُسب محليًا للمشروع العام المسجل، دون اتصال قاعدة:

`pilot-v1:6d690343c1ce5e95221d9e67eda65b62dc552ac0e95e78cf41074bc069bfc1be`

لا يتطلب هذه الدفعة تعيين قيمة جديدة، ولم تُقرأ/تُعدّل Variables. pins الوحيدة في `scripts/pages/frontend-schema.json`:

| المسار | القديم | الجديد | سبب المراجعة |
|---|---|---|---|
| `src/features/assess/OwnerAssessPanel.tsx` | `f8d38442b9996a0d56f711b01b744b6273a897ddbcbc40a2c7c8db5a371d6ff2` | `fd62085689b52c6065ba2002b87322b2688f61d96f83aae345d87260fd83a163` | استيراد وتركيب قائمة المالك؛ بقية الإدارة دون تغيير. |
| `src/features/assess/OwnerAssignments.tsx` | `new` | `832b3f65562ab754ee06de96e1aa0eecd3f0027df9083f5c147f8f4c0c61471b` | حد جديد يستعمل getPilotClient ويعرض التأكيد؛ حجب حسب approved owner وإلغاء طلبات الهوية القديمة. |
| `src/features/assess/owner-assignments.ts` | `new` | `f7baa8533179875df0cd8675bdbb7e408cb7372e6f62252d98b6702827a2697c` | حد جديد للـRPC الحيتين فقط؛ عقد page20/revision وإيقاف retry. |

## 5. الطب والتقييم

لا تغيير طبي أو درجات أو retention أو محتوى أو hashes/goldens/characterisation. الإغلاق النهائي لا يعيد فتح الإسناد ولا يحذفه ولا ينهي المجموعة ولا يحذف النتائج. لا تشغيل امتحان أو عامل أو فتح launch_gate.

## 6. QA وحدود الإثبات

نجحت10 اختبارات unit/contract جديدة للربط والواجهة (stale/ambiguous/paging/participant hidden/ACK/إلغاء طلبات الهوية) و25اختبارًا قائمة للحارس والاكتشاف/frontend schema، وlint الملفات الجديدة. تشغيل أول لحارس الشجرة الحالية سبق تحديث pins فرفضها؛ بعد مراجعتها وتحديثها نجحت الاختبارات دون تغيير أي توقع. المتبقي: full check/build مرة في النهاية ومتصفح محلي اصطناعي EN/AR390/1440 وaxe. لا qa:golden أو qa:characterise أو تغيير توقعات/بصمات قائمة. لا قياس حي أو هاتف من الوكيل؛ سجل النتائج النهائية هنا قبل التسليم.

## 7. المفتوح

إتمام التنفيذ وQA وتسجيل pins، ثم Draft PR. فحص الهاتف بعد دمج المالك والنشر المعتاد يبقى على المالك؛ لا نشر من الوكيل. RAD-062 وما بعد المرحلة1 ينتظر إذنًا منفصلًا. بريد الميزانية لم يُختبر وبوابات RAD-059/RAD-082 والحقوق/الخصوصية باقية.

## 8. قائمة المالك والمتابعة

ستثبت خطوات الهاتف الدقيقة بعد استقرار الواجهة؛ لا فتح launch_gate أو امتحان جديد للفحص. يُستخدم إسناد اختبار مملوك/مدار مسجل سابقًا فقط، ويُحفظ إسناد منفصل للإغلاق النهائي. لا إعادة فتح أو حذف كخطوة تنظيف.

برومبت الجلسة التالية: «اقرأ AGENTS وHANDOFF وتقرير RAD-060 المرحلة1 والحالة وتحقق من GitHub. نفذ فقط المتبقي المأذون، Draft فقط، لا deploy/Variables/SQL حي/P2 أو معاينة مستضافة. لا تغيّر RAD-060 إلى review قبل دمج المالك ونجاح الهاتف؛ RAD-062 planned ينتظر إذن المالك».

**هل تغيّر الحكم؟** نعم، اعتماد المالك الحالي أجاز تنفيذ المرحلة1 وحدها وحسم اختيارات الخطة المستقبلية؛ لا إذن لتنفيذها. دليل ميزانية GCP يحدّث بندًا كان مقترحًا، ولا يثبت استلام البريد. بقية التفويض/الاحتفاظ والبوابات ثابتة.

**هل بقي رابط الدليل الأصلي؟** نعم، source_ref السابقة محفوظة، والقرار الجديد يربط قرارات22أكتوبر وخطة #156 وقرار تشغيل RAD-059. لا حذف أو إعادة كتابة دليل تاريخي.
