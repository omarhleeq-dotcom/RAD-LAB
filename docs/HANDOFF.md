# التسليم الحالي — RAD-085 / إصلاح جاهزية CRLF (B7)

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context وstatus:summary -- --id RAD-085. [project-status](project-status.md) مصدر الحالة الوحيد. تحقق من PR الحالي مباشرة، واعمل في checkout نفسه دون worktree/subagents.

## ملخص الحالة
- **الاتجاه الحالي:** إعداد DB day في #143 مدموج؛ [B7](DECISIONS.md#rad085-crlf-readiness-owner-2026-10-28) يعالج CRLF فقط في precheck وD3 readiness. [تقرير B7](RAD-085_CRLF_READINESS_REPORT_2026-10-28.md) يحفظ الشاهد وQA؛ [B1–B5](DECISIONS.md#rad085-db-day-nolaptop-owner-2026-10-27) وبقية القرارات قائمة.
- **ينتظر المالك:** مراجعة إصلاح B7 ثم إذن حي منفصل وتنفيذ [الحزمة](RAD-085_DB_DAY_P1.md). لا ترقية قبل نجاح DB day؛ marker الحالي ثابت.
- **ينتظر مراجِعًا:** مراجعة B7 والتراجع مستقلًا، ثم الأمن/ACL والحقوق والمزوّد والقبول. #144 يبقى Draft منفصلًا؛ pins المعتمدة على بايتات D3 تحتاج rebase بعد دمج B7 وفق التقرير.
- **مرجع Git:** docs:context لحالة الفرع وDraft PR؛ وصف PR لدليل CI على الرأس النهائي.
- **مخاطر معلنة:** الشاهد PostgreSQL اصطناعي محلي، وليس إثبات مزوّد أو هاتف. CSV بيانات فقط؛ Docker وRAD-082 مؤجلان حتى عودة اللابتوب، وRAD-082 وRAD-059 شرطان قبل أول امتحان.

## الخطوة التالية والعوائق
ترتيب DB day بالضبط: (1) precheck الساعة الهادئة، (2) فحوص الجاهزية التسعة الحالية، (3) نسخة B2 CSV لكل جدول مع مطابقة العدد، (4) precheck وcounts مرة أخرى، (5–8) الترحيلات الأربعة كلٌّ في استعلام مستقل مع progress بعد كل واحد، (9) rad085-d3-ready مع `set rad085.sharing_phase='pre-initializer'`، (10) المُهيِّئ الحي، (11) rad085-d3-ready مع `reset`، (12) الفحوص الثمانية الباقية والـprobe، (13) فحوص B4 من الموقع ثم smoke وcounts-after، (14) عند أي فشل: rad085-db-day-rollback فورًا، (15) بعد التحقق احذف ملفات CSV ثم يُراجَع PR الترقية. [S7](RAD-085_REMAINING_OPERATIONS_2026-10-26.md#s7-supervisor-restore): إلغاء حذف المشرف لا يعيد تعيينه أو مجموعاته.

برومبت المتابعة: «اقرأ AGENTS وHANDOFF وتقرير B7 وB1–B5؛ تحقق من Draft إصلاح CRLF وCI. لا SQL حي ولا دمج. أبلغ أن #144 يحتاج إعادة تأسيس بعد دمج B7 وفق قائمة pins، ولا تعدّله دون مهمة لاحقة؛ لا تعتبر نجاح الشاهد المحلي نجاح DB day».

<a id="المتابعة"></a>
## الحدود المستمرة
Draft فقط؛ لا ready/merge/auto-merge، ولا SQL/Supabase حي أو نشر عامل أو أسرار أو فتح/مشاركة hosted preview أو subscribe/poll. لا qa:golden أو qa:characterise. الاستثناء RAD085-DB-DAY-PROMOTION-20261027 يخص PR الترقية وحده بحدوده في القرار؛ استثناء B7 محصور بإزالة CR كما في قراره؛ أي pin خارج الاستثناءين: STOP مع قائمة.

P2 والنشر والعامل والكتابي والصور وتصدير D8 وRAD-059 وRAD-082 خارج التنفيذ الحالي. لا تغيير لدرجات/مشاهد/بيانات فحوص أو ترحيل مطبق؛ Terms وCONSENT_VERSION لا يتغيران إلا في PR الترقية غير المدموج. المالك مسؤول التشغيل؛ البريد لا يمنح صلاحيات. Assess الحقيقي وShoulder Y/forearm والفحوص والصور الجديدة خلف بواباتها.
