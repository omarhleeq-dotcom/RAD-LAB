# التسليم الحالي — RAD-062: قراران للمالك

اقرأ [AGENTS](../AGENTS.md)، ثم docs:context لـ#175 وstatus:summary لـRAD-062؛ استمر في checkout نفسه. [الحالة](project-status.md) مصدر المهام الوحيد.

## ملخص الحالة

- **الاتجاه الحالي:** RAD-062 in_progress/reviewer وP10 Draft. دُمجت main وأضيفت D-CRLF وjob_b(a) وprecheck وبروفة snapshot الكتالوج. [تقرير P10](RAD-062_P10_REPORT_2026-10-30.md#final-campaign-2026-11-01) يحفظ الدليل وقائمة الشروط وmarker القديمة والجديدة؛ synthetic السابقة ليست قبولًا.
- **ينتظر المالك:** [قراران موحدان](RAD-062_P10_REPORT_2026-10-30.md#final-campaign-owner-decisions): تهيئة صفوف الإعداد الأربعة في برهان no-data، ومعالجة منح service_role الأربعة على profiles. لا بذر أو REVOKE أو تغيير expected من الأمر الحالي. بعد الحل، latest الحقيقية وlive owner=yes وB الأصلية كاملة والهاتف والنافذة≤60دقيقة باقية.
- **ينتظر مراجِعًا:** ترقيعات M06/M08 وفق نهاية سطر كل anchor، وpins المتغيرة فقط، ومصدر فحص البيانات، ومحمّل event trigger بمالكه الأصلي مع metadata/roles parity. Decision C وprefix/fresh ACK والامتيازات والحراس والبصمات ثابتة. الحقوق/الخصوصية/O4 و4ب/5ب باقية؛ RAD-086 done وRAD-059 review/owner بلا تغيير.
- **مرجع Git:** docs:context لحالة الفرع والرأس وPR؛ commits/merges عادية بلا rebase/force-push/skip-ci؛ Draft فقط. [التقرير](RAD-062_P10_REPORT_2026-10-30.md#final-campaign-2026-11-01) يميز CI ومحاكاة scratch وQA. لا ready/merge/auto-merge أو live SQL/Variables/نشر إضافي/preview/goldens/بيانات مشاركين.
- **مخاطر معلنة:** CI الحالية حمراء عند pre_diagnostic بعد استعادة88جدولًا فارغًا بالصورة المثبتة؛ نجاح synthetic لا يغلقها. gate مغلقة والعامل NOLOGIN والسر DISABLED؛ حزمتا الهاتف وmanual وSQL checks ثابتة. scratch بقيت محلية غير متتبعة للكشف فقط، وليست برهان Supabase17.11.

## المتابعة

الإجراء المباشر: حسم D-CONFIG وD-PROFILES-ACL من القائمة الموحدة قبل تغيير بذر أو صلاحيات أو expected. بعد قرار المالك، نفذ الاستثناء المحدد واستأنف push→CI→logs→fix حتى الأخضر مع بقاء Draft. البروفة تستدعي restoreTest نفسها بـlocale/roles/rolconfig ومروري event triggers والتنظيف؛ لا تبديل صورة أو driver أو تجاوز عائق الصورة المحلي. لا تحجز نافذة المالك من scratch أو synthetic.

أي UNKNOWN ACK يبقى STOP؛ استخدم fresh probes قراءة فقط بالـselectors المراجعة بلا retry أو ledger مزيف. كل manifest والانتقال والcounts مطلوبة. المخرجات للمالك counts/flags/STOP ومراحل SQLSTATE/errno؛ التشخيص الكامل للاختبار الخالي من البيانات فقط بلا flag/env من main. راجع روابط القرارات الأصلية في [DECISIONS](DECISIONS.md#rad062-final-campaign-2026-11-01)؛ لا تعمم نجاح fixture على production.
