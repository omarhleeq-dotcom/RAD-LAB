# التسليم الحالي — RAD-085 / DB day بلا لابتوب (B1–B5)

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context وstatus:summary -- --id RAD-085. [project-status](project-status.md) مصدر الحالة الوحيد. تحقق من PR الحالي مباشرة، واعمل في checkout نفسه دون worktree/subagents.

## ملخص الحالة
- **الاتجاه الحالي:** [B1–B5](DECISIONS.md#rad085-db-day-nolaptop-owner-2026-10-27) فوق [S1–S8](DECISIONS.md#rad085-sec-fixes-owner-2026-10-27) و[O1–O5](DECISIONS.md#rad085-db-day-owner-2026-10-27). إصلاحات SEC-01..05 دُمجت (#142). الحزمة مكتوبة من جديد بلا Docker: نسخة CSV من المتصفح، فحص ساعة هادئة، تراجع مُختبر، فحوص دخان. التقريران: [تقرير DB day](RAD-085_DB_DAY_NOLAPTOP_REPORT_2026-10-27.md) و[تقرير الترقية](RAD-085_PROMOTION_REPORT_2026-10-27.md) (PR Draft منفصل غير مدموج: الترحيلات وP1_AVAILABLE وTerms وCONSENT_VERSION وmarker).
- **ينتظر المالك:** إذن حي منفصل ثم تنفيذ [حزمة DB day](RAD-085_DB_DAY_P1.md) بخطواتها الخمس عشرة؛ بعدها فقط مراجعة PR الترقية (Draft منفصل) وضبط `PILOT_SCHEMA_VERIFIED` على marker المطبوع فيه بعد نجاح SQL.
- **ينتظر مراجِعًا:** مراجعة مستقلة للإصلاحات والحزمة والتراجع، ثم الأمن/ACL/الحقوق والمزوّد والقبول كما في الحزمة.
- **مرجع Git:** docs:context لحالة الفرع وDraft PR؛ نتيجة CI على الرأس النهائي في وصف كل PR.
- **مخاطر معلنة:** لا نسخة Docker ولا RAD-082 حتى عودة اللابتوب؛ النسخة CSV بيانات فقط ولا تستعيد Auth أو الصلاحيات. التراجع يُبقي الجداول الجديدة ولا يُعيد تشغيل الترحيلات. RAD-082 وRAD-059 شرطان قبل أول امتحان.

## الخطوة التالية والعوائق
ترتيب DB day بالضبط: (1) precheck الساعة الهادئة، (2) فحوص الجاهزية التسعة الحالية، (3) نسخة B2 CSV لكل جدول مع مطابقة العدد، (4) precheck وcounts مرة أخرى، (5–8) الترحيلات الأربعة كلٌّ في استعلام مستقل مع progress بعد كل واحد، (9) rad085-d3-ready مع `set rad085.sharing_phase='pre-initializer'`، (10) المُهيِّئ الحي، (11) rad085-d3-ready مع `reset`، (12) الفحوص الثمانية الباقية والـprobe، (13) فحوص B4 من الموقع ثم smoke وcounts-after، (14) عند أي فشل: rad085-db-day-rollback فورًا، (15) بعد التحقق احذف ملفات CSV ثم يُراجَع PR الترقية. [S7](RAD-085_REMAINING_OPERATIONS_2026-10-26.md#s7-supervisor-restore): إلغاء حذف المشرف لا يعيد تعيينه أو مجموعاته.

برومبت المتابعة: «اقرأ AGENTS وHANDOFF وتقرير DB day وB1–B5؛ تحقق من Draft PR الإعداد وPR الترقية ورأس CI لكل منهما. لا تدمج ولا تطبّق SQL حيًا. إن نفّذ المالك DB day فاقرأ نتائجه قبل أي تغيير في الحالة».

<a id="المتابعة"></a>
## الحدود المستمرة
Draft فقط؛ لا ready/merge/auto-merge، ولا SQL/Supabase حي أو نشر عامل أو أسرار أو فتح/مشاركة hosted preview أو subscribe/poll. لا qa:golden أو qa:characterise. الاستثناء RAD085-DB-DAY-PROMOTION-20261027 يخص PR الترقية وحده بحدوده في القرار؛ أي pin آخر: STOP مع قائمة.

P2 والنشر والعامل والكتابي والصور وتصدير D8 وRAD-059 وRAD-082 خارج التنفيذ الحالي. لا تغيير لدرجات/مشاهد/بيانات فحوص أو ترحيل مطبق؛ Terms وCONSENT_VERSION لا يتغيران إلا في PR الترقية غير المدموج. المالك مسؤول التشغيل؛ البريد لا يمنح صلاحيات. Assess الحقيقي وShoulder Y/forearm والفحوص والصور الجديدة خلف بواباتها.
