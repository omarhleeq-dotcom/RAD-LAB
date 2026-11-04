# التسليم الحالي — قرار إطلاق الخميس

اقرأ [تعليمات العمل](../AGENTS.md)، ثم `npm run docs:context` و`npm run status:summary`؛ [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** إطلاق الخميس2026-11-05 Practice فقط والبوابة مغلقة ([القرار](DECISIONS.md#launch-practice-only-owner-2026-11-03))؛ سجلات D1–D13 في [التقرير](LAUNCH_RECORDS_REPORT_2026-11-03.md).
- **ينتظر المالك:** قبول إغلاقي RAD-085 وRAD-041؛ بديل بشري حقيقي وتمرينه قبل أي طالب؛ مراجعة Draft [نافذة التفعيل](ASSESS_ENABLEMENT_WINDOW_REPORT_2026-11-03.md) وW7.
- **ينتظر مراجِعًا:** [حزم W1–W8](ASSESS_GATE_W_PACKAGES.md) و[تقريرها](RAD-085_GATE_W_REPORT_2026-11-03.md): قُبل D-W6 والانحرافان، ورُفض W8.
- **مرجع Git:** `docs:context`؛ Draft فقط؛ لا SQL حي أو Variables أو أسرار من هذه الدفعة.
- **مخاطر معلنة:** البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ تنبيهات المزوّد الأصلية غير مثبتة؛ المنفذ5432 حُجب مرة من شبكة اللابتوب.

RAD-094: [Code Health](CODE_HEALTH_REPORT_2026-11-03.md) نُفذت ببوابات KiB وشواهد الرفض؛ تنتظر CI والمراجعة؛ تبقى Draft.

RAD-102: [شق القدم](archive/reports/2026-11/RAD-102_FOOT_SOFT_TISSUE_2026-11-04.md) في Draft (الخيار 1)؛ ينتظر مراجعة المالك لصورة المراجعة وفحص الهاتف.

RAD-103: المرحلة B في Draft ‏#237 ([التقرير](archive/reports/2026-11/RAD-103_STAGE_B_PHONE_SIMULATOR_2026-11-04.md))؛ تنتظر موافقة النصوص وفحص الهاتف، والدمج بعد الإطلاق.

## المتابعة

نافذة 11-04 وقفت عند 2.2 ([التقرير](archive/reports/2026-11/ASSESS_WINDOW_2026-11-04.md)): مسار الدفع قرار للمالك؛ البوابة مغلقة وNOLOGIN وDISABLED. RAD-104: [Brevo](BREVO_SIGNUP_NOTIFY_PLAN.md).

## الإغلاقات المعلقة

`npm run status:summary -- --pending`
