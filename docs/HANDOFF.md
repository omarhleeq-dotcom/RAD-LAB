# التسليم الحالي — RAD-072 الجزء 2c (الكتف Grashey): المرحلة B قيد التنفيذ بعد قرارات المالك

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، ثم شغّل `npm run docs:context` (مع `-- --pr NUMBER` لـPR المسودة للجزء 2b) و`npm run status:summary -- --id RAD-072`. [project-status](project-status.md) مصدر الحالة الوحيد. استمر في الـcheckout نفسه، بلا worktree أو subagents. PR مسودة فقط؛ لا ready أو merge أو auto-merge، ولا اشتراك أو polling، ولا فتح أو مشاركة معاينة مستضافة.

## ملخص الحالة
- **الاتجاه الحالي:** RAD-072 قيد التنفيذ. **2c = الكتف (`shoulder-grashey-erect` فقط).** A منجزة ([تقرير A](RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md)) وقرارات المالك D1–D6 مسجّلة في [DECISIONS](DECISIONS.md#rad072-2c-owner-2026-10-24). **B قيد التنفيذ:** (1) رفع سقف الإغلاق في `TUNING.limbRotation` للكتف مع اختبار؛ (2) رسم الكاشف من `shoulder-outlines.json` وتحريكه بـ`shoulderShift`؛ (3) منظر الأعلى: خط مرجعي وقوس زاوية وقراءة دائمة وسهم الصدر؛ (4) بصمات `shoulder-grashey-erect-hashes.json` وحدها؛ (5) التحقق وتقرير B.
- **ينتظر المالك:** فحص هاتف 2b؛ بعد B فحص الهاتف لـ2c.
- **مرجع Git:** الفرع وPR عبر docs:context.

## الخطوة التالية والعوائق
- **الخطوة الحالية:** أول عنصر غير مكتمل في القائمة أعلاه (تحقق من `git log` للفرع).
- النطاق الميت 35–45° كما سُجّل؛ أي ملف بصمات غير ملف الكتف أو golden/characterisation يتغير = توقف وإبلاغ.

<a id="المتابعة"></a>
## الحدود المستمرة
- القيم provisional داخليًا؛ [قرار الدليل والشروط](DECISIONS.md#provisional-evidence-owner-2026-10-22) باقٍ؛ لا ادعاء مصادقة طبية.
- Assess مؤجل حتى استئناف صريح، والفحوص والصور الجديدة وShoulder Y مجمدة.
- RAD-070 وRAD-071 مؤجلتان؛ RAD-057 بعد RAD-062، وRAD-021 بعد جلسة التعميم.
- لا أسرار أو بيانات شخصية أو UUID؛ لا qa:golden أو qa:characterise. ملف scene-dom.test.ts لا يُعدّل؛ إذا انتهت مهلته تحت الحمل الكامل يُعاد مرة واحدة ويُذكر ذلك في التقرير.
