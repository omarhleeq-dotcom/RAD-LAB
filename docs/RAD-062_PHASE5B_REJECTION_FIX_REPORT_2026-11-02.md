# RAD-062 — إصلاح الرفض القطعي في5ب، 2026-11-02

**1 — النطاق والميزانية:** Verified: متابعةDraft[#206](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/206)،12ملفًا/20تراكميًا من25؛ لاforce push أوready/merge؛ التقرير التاريخي ثابت.

**2 — المنجز:** Verified:55000→closed؛ كل خطأ كتابة ذيcode قطعي ويمسحpending قبل أي قراءة لاحقة؛ وحده فشل النقل بلاcode يبقي المعرف والمضمون نفسيهما.

**3 — المهمة:** RAD-062 تبقىin_progress/reviewer؛ شرط5ب `PR merged + CI green + reviewer audit on synthetic data` لم يستوفَ بهذا الإصلاح.

**4 — المشترك وScale:** Verified:closed يمسح الأجوبة، يفحص الإيصال، ويعرض النهائي إن وجد؛ وإلا يعيد القائمة برسالة وBack، دونretry للعملية المرفوضة؛ حدود100/168h ثابتة.

**5 — الطبي والدرجات:** Verified: لا تغيير طبي/احتساب/SQL/بوابة/موافقة؛ هل تغير الحكم؟ لا، تطبيق الرفض القطعي؛ هل بقي الدليل الأصلي؟ نعم، [التصميم](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md) و[التقرير](RAD-062_PHASE5B_SCREEN_REPORT_2026-11-02.md).

**6 — QA:** Verified (إفادة المراجع عبر المالك، الرأس السابق):16ملفًا/131اختبارًا معSupabase17.11 ناجحة؛ لا تُنسب إلى رأس الإصلاح.

Verified:42اختبارًا محليًا ناجحة، منها15حالة رفض جديدة وحارسا النص/الحساب؛ [اختبارات الرفض](../src/features/assess/manual-grading-rejection.test.ts) و[عقد النقل](../src/features/assess/manual-grading.test.ts) يحفظان المعرف عند فشل النقل ويمنعان تحويل رفض قطعي إلىpending.

Verified: typecheck/lint وبناء الإنتاج وPages ناجحة؛12حالةChromium/axe لمكوّن الشاشة بنقل اصطناعي EN/AR×390/1440:0overflow/violations/page errors؛ docs/status/diff ناجحة وdocs:sync ثانية0تغيير؛ marker مطابق قبل/بعد.

Verified: شُغّلnpm run check كاملًا:3321اختبارًا ناجحًا/63فشلsetup للصورة في4ملفات؛ الحراس وM09 embedded ناجحة؛ ليستcheck خضراء، ولا اختبارات مخففة أوskipped.

Not run (env):Supabase17.11/ICU محليًا: `No such image: supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d`؛ لا تخفيف توقع أو مهلة.

**7 — المفتوح:** Not run (pending CI/reviewer): قبول رأس الإصلاح؛ الهاتف الحي بعد محاولات حقيقية وفتح البوابة. لا إعادة فتح قبول الشاشات السابق.

**8 — قرار المالك الموحد والمتابعة:** كل تصحيح مالك يرسل`owner-takeover` بعد مربع التأكيد، حتى في التكليفات التي يملكها؛ الخادم يقبله، فيحمل كل تصحيح مالك هذا الوسم في الأثر. القرار المطلوب: قبول هذا المعنى؛ التوصية قبول، دون تعديل السلوك.

المتابعة: راجع الإصلاح علىDraft نفسها؛ تبقى البوابة وmarker ثابتين والدمج لاحقًا بقرار المالك وبـmerge commit فقط؛ لاrebase أوforce push.
