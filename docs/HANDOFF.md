# التسليم الحالي — RAD-062 P10، توقف M02/collation على Draft نفسها

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary للمهام RAD-062 وRAD-086 وRAD-059؛ استمر في checkout نفسه. [الحالة](project-status.md) المصدر الوحيد للمهام.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 review/owner؛ P9b مدموجة في #174، وP10 في Draft #175. فصل مستهلكي B والجرد والبصمة في [التقرير المحدث](RAD-062_P10_REPORT_2026-10-30.md). حاجب CI هو M02/SQL55000 على en_US.utf8 بسبب ترتيب FK name مقابل text؛ بقية Part A في RAD-057 وRAD-087 محفوظة.
- **ينتظر المالك:** تفويض إصلاح M02 المجمدة ومراجعة النمط في M05، دون تبديل locale الشاهد لإخفاء الفشل؛ ثم RAD-086 واللابتوب والنسخة المحلية الكاملة والاستعادة ورفض Supavisor القديم/cache و17.11 وبقية STOP. ترتيب النافذة حُسم: live apply/checks ثم Variable ثم merge ثم CI/Deploy Pages ثم الهاتف والطوارئ. RAD-059 القنوات/ACK والبديل والخصوصية/O4 وفحص SID100 مستقلة.
- **ينتظر مراجِعًا:** جرد successor المراجع دون تغيير SQL، فصل archive/check inputs التاريخية، source QA ناجحة؛ CI check حمراء بحاجب M02 الموثق، ثم براهين المالك والهاتف. assertions/timeouts وسقوف المراحل وبايتات packetين محفوظة؛ current tools تبقى بالحزمة كلها.
- **مرجع Git:** docs:context لحالة الفرع وPR؛ [التقرير](RAD-062_P10_REPORT_2026-10-30.md) لجرد كل المستهلكين، الاستثناء والملفات الدقيقة وQA والبصمة. لا PR جديدة أو force-push؛ الأتمتة المعتادة فقط وDraft بلا ready/merge/auto-merge من الوكيل أو معاينة مستضافة.
- **مخاطر معلنة:** gate مغلقة والعمال NOLOGIN والسر DISABLED؛ guard=true ليس attestation DB. deploy قبل النافذة متوقع أحمر بسبب marker فقط، وcheck يجب أن يكون أخضر بالكامل؛ لا يعفى Docker أو فشل آخر. لا Variable أو SQL حي من الوكيل.

## المتابعة

توقف التنفيذ عند تجميد SQL: التقرير يتضمن أول ملف وخطأ فعلي ودليل أن37edges نفسها اختلف ترتيبها فقط. لا تعديل migration/check أو assertion/timeout أو fixture locale لقبولها. يلزم إصلاح منفصل مأذون ثم check أخضر؛ CI/النشر لا يثبتان نسخ المالك أو الهاتف أو أهلية امتحان حقيقي. الطب/scoring/goldens والواجهات الأخرى و4ب/5ب خارج الدفعة.

المالك وحده ينفذ [runbook](RAD-062_P09_LAPTOP_RUNBOOK.md) و[P9b](RAD-062_P09B_REPORT_2026-10-30.md) داخل نافذة متصلة≤60دقيقة. بعد فشل بعد merge: يعيد Variable القديمة أولًا ثم يدمج revert PR عادية داخل النافذة مع بقاء الإغلاق؛ لا تراجع DB أعمى.

إذا تقدم main قبل اليوم، ادمجه دون force-push وتحقق البايتات وأعد QA المتأثرة وحساب marker والتقرير وPR قبل المراجعة. البصمة الجديدة في التقرير وPR فقط؛ لا تشغيل من دمج backend.
