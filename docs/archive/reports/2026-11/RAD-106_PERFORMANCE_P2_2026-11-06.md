# RAD-106 — مرشح P2: ملخص النتائج، 2026-11-06

## 1. الانحرافات والميزانية
Verified: جُلب رأس #243 الفعلي `98f579c2781698b5dd4f97de700ac69ba73f75d4` وطابق GitHub؛ هذا رأس بداية P2 وP1 المقبول بالتنسيق وفق تعليمات المالك الحالية. سُجل القبول والتفويض في commit `2b1df43` قبل تنفيذ المنتج.
Verified: قُرئت AGENTS/HANDOFF/FEATURE_MAP والحالة والتدقيق الكامل31 معيارًا وتقرير P1. [قرار P2](../../../DECISIONS.md#performance-p2-owner-2026-11-06) يحدد13 مسارًا مقابل سقف16؛ الفرق محسوب من رأس البداية المقبول، ولا مسار إضافي.
Verified: أُعيد التحقق من #242 ورأس القاعدة المؤقتة `1519d28554f02fa2af8e3d4078772b1de9cdc887`؛ لا تعديل #242 أو rebase/worktree/subagent/force-push. تبقى #243 Draft؛ الرأس النهائي وCI الخاص به يثبتان في [وصف المسودة](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/243).

## 2. المنفذ والمستبعد
Verified: قارئ/hook إضافيان لـHome وCatalogue عبر getPilotClient وSessionProvider وواجهات Supabase المثبتة؛ لا API أو SQL جديد. إسقاط JSON يحتفظ بـtotal/passed/critical/categories وكل حقول الهوية والإصدار/المقارنة/التنسيق/الوقت؛ يعيد استعمال محلل history والـselectors القائمة.
Verified: total/passed للاختيار والترتيب والحكم المحفوظ؛ id/time للفصل المستقر والـcursor؛ exam/case/definition/comparison/engine/producer/format لصلاحية التاريخ. critical/categories مطلوبان لفحص الصلاحية حتى إن لم تعرضهما البطاقة؛ لا حذف لهما لتصغير البيانات.
Verified: الاستبعاد من النقل يقتصر على checks/thresholdMet/primaryVariant وأي مفاتيح نتيجة زائدة لا يستهلكها المحلل؛ لا استنتاج نجاح من درجة ولا إعادة حساب. unknown التاريخي والفحص المؤرشف يبقيان في التجميع والترتيب، ومسار العرض يختار الروابط بالطريقة السابقة.
Verified: تعداد Home يظهر بعد نجاح وفحص استجابة summary فقط؛ Continue/Review والأحكام تنتظر كل صفحات الدفعة. أي رفض/مهلة يخفي البيانات الجزئية. جيل الحساب/الموافقة يعزل النتيجة فور render، وrefresh/unmount يلغيان النقل؛ لا cache مكتمل أو مشاركة حسابات أو إعادة تلقائية.
Verified: مهلة15ث للدفعة كاملة تشمل اكتساب العميل؛ رفض مستقل عن تعاون النقل مع abort، وفحص الرد المتأخر قبل النشر. لا تغييرات للكتابات أو SessionProvider أو سلوك التدريب التفصيلي.

## 3. المهمة والقياسات
RAD-106: P1 مقبول بالتنسيق؛ P2 مرشح للمراجعة في المسودة نفسها. لا إتمام للمهمة الشاملة ولا بدءP3.
Verified: قيس خط الأساس قبل تغيير المنتج:80 عينة،10 لكل مكوّن/حجم. Home500 وسيط1136.3 وp95=1222.5ms؛ Catalogue500 وسيط1170.2 وp95=1236.3ms؛ الطلبات6 والبايتات808403 لكل منهما. حفظت النتيجة المحلية في `/tmp/rad106-summary/baseline.json`.
Verified: المقارنة النهائية160 عينة باردة،10 لكل نسخة/مكوّن/حجم، AB/BA؛ React production وChromium154.0.8037.57 وNode24.19.0، تأخير HTTP محلي120ms وCPU×4. البيانات متطابقة،4 فحوص أحدها مؤرشف، وأوقات متعادلة، و24 check اصطناعيًا لكل نتيجة.
Verified: أحجام استجابات JSON UTF-8 تشمل RPC وصفحات الـlookahead، دون رؤوس أو ضغط؛ ليست قياس نقل مزوّد حقيقي.

| السجلات | الطلبات قبل / بعد لكل مكوّن | البايتات قبل / بعد لكل مكوّن |
|---|---|---|
| 0 | 2 / 2 | 136 / 136 |
| 7 | 2 / 2 | 11388 / 2743 |
| 500 | 6 / 6 | 808403 / 185963 |
| 503 | 6 / 6 | 809999 / 186324 |

كل زوج في الجدول التالي «قبل / بعد» بالـms. أول ملخص = تعداد Home الناجح أو أحكام Catalogue؛ المكتمل = ظهور التوصيات/الأحكام بعد الدفعة، والفارغ ينتظر استجابته الناجحة.

| المكوّن | الحجم | وسيط أول ملخص | p95 أول ملخص | وسيط المكتمل | p95 المكتمل |
|---|---|---|---|---|---|
| Home | 0 | 693.5 / 700.2 | 1173.4 / 888.6 | 693.5 / 700.2 | 1173.4 / 888.7 |
| Home | 7 | 891.2 / 826.7 | 1094.0 / 1339.2 | 891.3 / 925.2 | 1094.1 / 1436.3 |
| Home | 500 | 1820.3 / 717.5 | 2294.3 / 1444.2 | 1820.8 / 1496.9 | 2297.6 / 2645.8 |
| Home | 503 | 1470.0 / 601.7 | 2009.4 / 883.4 | 1470.0 / 1338.1 | 2016.0 / 1576.1 |
| Catalogue | 0 | 679.2 / 668.2 | 834.6 / 1090.0 | 679.2 / 668.5 | 834.7 / 1090.1 |
| Catalogue | 7 | 717.3 / 722.8 | 1483.3 / 1329.5 | 717.3 / 722.8 | 1484.1 / 1329.6 |
| Catalogue | 500 | 1258.9 / 1239.1 | 1353.4 / 1270.3 | 1259.2 / 1239.1 | 1353.5 / 1270.3 |
| Catalogue | 503 | 1220.4 / 1243.5 | 1462.0 / 1661.5 | 1220.4 / 1243.5 | 1462.0 / 1661.5 |

Verified: خفض البايتات75.9% عند7 ونحو77.0% عند500/503، بلا تقليل سجلات التغطية أو الطلبات. تعداد Home الكبير ظهر أبكر في هذه العينات؛ p95 للاكتمال عند500 ارتفع. لا ادعاء تحسن زمن Catalogue أو اكتمال الملخص عمومًا.
Inferred: الحمولة الأقل مفيدة، لكن المختبر مشترك وتزامنت بعض العينات مع فحوص المستودع؛ تقلب الجدولة ظاهر. لا نسبة تسريع للمستخدم أو حكم LCP/INP/CLS من هذه النتائج.
التكرار: `PLAYWRIGHT_MODULE=/path/to/existing/playwright node scripts/qa/saved-summary-performance.mjs`؛ أو playwright المثبت المعتاد بلا المتغير. `--before-only` يعيد المصدر المثبت من Git؛ المخرجات `/tmp/rad106-summary/results.json`، ولا طلب خارج الخادم المحلي.

## 4. المشترك وScale والملفات
Verified: إعادة استعمال SAVED_PAGE_SIZE=100 وSAVED_BATCH_PAGES=5، وحد101 للـlookahead، ونفس boundary/finished_at.desc/id.asc والـcursor. تبقى تغطية500 ومحاولة أحدث لكل فحص، وفشل الدرجة العالية وترتيب reviewTarget وإفصاح recentScope وعدم ادعاء notTried عند وجود next.
Verified: readSavedResults/useSavedResults/MyAttempts وtraining.ts واختباراتها الأصلية مطابقة لبايتات البداية؛ best/comparability في التاريخ التفصيلي لم تتغير. لا N+1 أو مسح غير محدود أو framework أو اعتماد جديد أو خدمة أو تخزين دائم.
Inferred: تقليل الصفوف مع المعنى نفسه يحتاج عقد ملخص خلفي مراجع يحفظ ترتيب آخر محاولة والصلاحية والتغطية؛ لم يلزم لتحقيق تقليل الحمولة الحالي، ولم يُدخل SQL أو عقد تخميني. رفع سقف500 يحتاج نطاقًا مستقلًا ومراجعة.
المسارات المختارة قبل التحرير:
- `src/features/pilot/TrainingSummary.tsx`
- `src/features/platform/ExamCatalogue.tsx`
- `src/features/pilot/saved-summary.ts`
- `src/features/pilot/useSavedSummary.ts`
- `src/features/pilot/saved-summary.test.ts`
- `src/features/pilot/useSavedSummary.test.ts`
- `scripts/qa/saved-summary-performance.mjs`
- `scripts/pages/frontend-schema.json`
- `docs/DECISIONS.md`
- `docs/HANDOFF.md`
- `docs/project-status.md`
- `docs/archive/reports/2026-11/RAD-106_PERFORMANCE_P2_2026-11-06.md`
- `docs/archive/reports/README.md`


Verified — اشتقاق قبل تحديث manifest: فُحص رسم الحدود بـAST ثم حسبت SHA-256 مباشرة من بايتات كل مصدر وطابقت الرسم. لا حدود محذوفة؛ التغييرات التالية فقط:
- إضافة `src/features/pilot/useSavedSummary.ts`: `b26fe008dd5120bd8650c2213303ac25edf2847f9f2f6df53db95f115a0b4c54`.
- إضافة `src/features/pilot/saved-summary.ts`: `41dd73450c9f5759cecadb332e8191c908072addb927166ff12bee7056845681`.
- تغيير `src/features/pilot/TrainingSummary.tsx`: `37ebc9354fecb2a3f20eebc040b25fa9156e7834236c5f0635b8cb38b08fa390`.


Verified: بقية manifest خارج browserBoundaries متطابقة حرفيًا؛ جميع required SQL/check bytes وgate implementation والتوقعات المحمية وVariables محفوظة. أعيد حساب marker مستقلًا من origin ومدخلات SQL/checks ثم طابق الحارس:
`pilot-v1:8c8207de423ba717b4607f3d9cd029f2f16436f4f6e4b8df06679eff3cc2dedc`.
Verified: رفض4 حالات pin خاطئة (بصمات TrainingSummary والقارئ والـhook، وحذف pin القارئ)، و4 تصديقات خاطئة (مفقود/true/digest خاطئ/مشروع آخر). التصديق الاصطناعي الصحيح قُبل offline؛ fixtures مؤقتة أزيلت، بلا تعديل حي.

## 5. الطب والتقييم
Verified: لا تعديل طب أو scoring أو shuffle أو صور/مشاهد أو worker/clock/ACK/SQL؛ لا telemetry/cloud-backup. أحدث حكم محفوظ يستعمل passed نفسه؛ لا إعادة تفسير أو تبديل معنى النصوص.

## 6. QA وحدوده
Verified: اختبارات موجهة120/120 عبر9 ملفات، ومنها legacy saved-results/training/saved-training وحراس manifest/schema وcredits/status. بعد إضافتي التغطية النهائيتين نجحت اختبارات P2 الجديدة40/40؛ التوقعات القديمة لم تتغير.
Verified: تكافؤ النصوص والروابط وأصناف verdict DOM كاملةً بين المصدرين في كل160 عينة؛ اختبارات0/7/100/101/499/500/503، ties/ordering/review وunknown/archived/high-score failure، و14 نوع سجل مشوه مرفوض بالطريقة السابقة.
Verified: counts الناجحة فقط، أخطاء401/403/500، تبديل الهوية وجيل الحساب، الخروج/التعليق/سحب الموافقة/غياب provider، refresh بعد محاولة جديدة، unmount/remount، مهلة العميل والنقل والرد المتأخر بلا retry.
Verified:16 حالة Home/Catalogue ×EN/AR ×390/1440 ×empty/503؛ axe WCAG2/2.1 A/AA بلا مخالفات، لا overflow أو page errors أو اتصال خارجي. هذه مكونات حقيقية مجمعة production مع حدود جلسة/HTTP اصطناعية.
Verified: health:source صفر أخطاء؛ health:test9/9؛ lint للملفات المعدلة ناجح، والفحص العام كشف التحذيرين السابقين وإشكال probe صُحح ثم فُحص. فحص TypeScript المباشر لا أخطاء P2؛ بقيت4 أخطاء route types قديمة للمسار emergency بسبب تعذر typegen.
Verified: شُغّل check/build/build:pages محليًا؛ توقفت عند ERR_SWC_NATIVE_CACHE. اختيار cache خاص/المسار المؤقت المدعوم لم يحل قيد البيئة؛ لا guard أو اعتماد غُيّر. health:sizes نجح على out الموجود مسبقًا، ولا يُعد إثبات بناء هذا الرأس.
Verified: شُغّل الاختبار المحلي الشامل؛ إخفاقات DB بسبب غياب `/tmp/radlab-ops-postgres` الذي تثبته مرحلة CI الأصلية؛ لم تُخفف التوقعات أو تُحذف مراحل. نجاح اختبارات السجل المستهدفة منفصل عن ذلك؛ لا ادعاء نجاح محلي شامل.
Verified: docs:sync مرتان والثانية0، docs:check وstatus:check --require-previous مقابل القاعدة الفعلية وgit diff --check؛ نتائج الإقفال النهائية تسجل في وصف #243 مع SHA/CI الدقيق.
Not run: Next hydration/browser waterfall للرأس محليًا بسبب البناء، هاتف فعلي أو RUM/Lighthouse أو بيانات/مزود حي أو تحقق سريري؛ CI الكامل للرأس النهائي يجب قراءته مستقلًا، ولا يُستنتج من P1.

## 7. المفتوح وشروط رفعه
مرشح P2 ينتظر CI للرأس النهائي ومراجعة التنسيق؛ قيود المختبر لا ترفعها أرقام الحمولة وحدها. CI يجب أن ينجح بكامل المراحل المطلوبة، بلا رفع حدود أو skip؛ نتائج Deploy Pages guard منفصلة عن CI التطبيق.
لا بيانات إنتاج أو live SQL أو تشغيل/نشر يدوي أو Ready/merge أو تغيير #242. تبقى القاعدة المؤقتة؛ لا P3 قبل مراجعة التنسيق.

## 8. قائمة المالك والموجه التالي
- مراجعة فرق P2 وحد13 مسارًا، وتخفيض الحمولة مع500 سجل وتكافؤ المعنى وعزل الحساب/الموافقة والمهلة.
- مراجعة SHA/CI النهائيين في المسودة، وتفريق القياسات المختبرية عن الأداء الحقيقي؛ لا تعميم لتحسن زمن Catalogue/الاكتمال.
- الموجه التالي: «راجع مرشح RAD-106 P2 في Draft #243 ورأسه الفعلي وأدلة CI الكاملة؛ قرر قبول P2 بالتنسيق. لا تبدأP3 ولا تغيّر #242 أو بوابات/Variables النشر».
سؤالا AGENTS: هل تغير الحكم؟ التفويض الحالي أضاف P2 فقط؛ لا تغيير أحكام الطب/التشغيل أو التاريخ. هل بقي الدليل الأصلي؟ نعم، [التدقيق](RAD-106_PERFORMANCE_AUDIT_2026-11-06.md) و[تقرير P1](RAD-106_PERFORMANCE_P1_2026-11-06.md) والقرارات محفوظة.
