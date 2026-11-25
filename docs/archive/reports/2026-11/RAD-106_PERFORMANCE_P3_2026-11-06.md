# RAD-106 P3 — تحميل التبويبات، 2026-11-06

## 1. الانحرافات والميزانية
Verified: رأس البداية المقبول P2 هو `5a0ae2b2c3b311a9674185b0100a50e46a389a0f`؛ طابق GitHub وجلب git الفعلي. قبول P2 وتفويض P3 سُجلا قبل المنتج في `c5abafb`؛ [القرار](../../../DECISIONS.md#performance-p3-owner-2026-11-06).
Verified: تسعة مسارات معلنة، ضمن سقف16، ووحدة إنتاج واحدة. صُححت لاحقة الاختبار قبل التنفيذ إلى `.test.ts` لتطابق جامع Vitest القائم؛ لا تغيير إعدادات.

## 2. المنفذ والمستبعد
Verified: فصل OwnerAssessPanel وOwnerTraining غير النشطين باستخدام Next dynamic داخل OwnerPanel؛ حالات loading/error محلية ونصوص قائمة ورابط reload أصلي. زر الطوارئ/controller وSafety المخفي المركب لا يؤجلان.
Inferred: اختير Owner بعد قياسه وPractice؛ لا تعديل Practice أو memoisation/selectors/virtualisation دون دليل.

## 3. المهمة والقياسات
RAD-106: قبول P1/P2 محفوظ؛ P3 مرشح للمراجعة، لا إتمام للأداء الإنتاجي أو بدء مرحلة أخرى.
Verified: baseline قبل المنتج40 زيارة؛ المقارنة الأساسية80 زيارة AB/BA ثم40 زيارة مستقلة لتدريب المالك أولًا،10 لكل نسخة/سيناريو/بارد أو دافئ، دون QA كثيف متزامن. الزمن EN390×900؛ حساب Owner اصطناعي20 سجلًا، وPractice = hand-pa والحساب signedOut. جولات تجهيز فاشلة للغلاف/ثابت Next لم تدخل المقارنة المعتمدة.
Verified: Node22.23.4 وChromium154.0.8037.57 وReact production، CPU×4، latency120ms، تنزيل200000 ورفع93750 بايت/ث؛ HTTP محلي gzip9. cold سياق جديد، warm إعادة تحميل السياق نفسه بعد استعمال التبويبات، وأصول المختبر max-age3600؛ ليست سياسة استضافة جديدة.
Verified: esbuild ESM مع تنفيذ Next App Router dynamic المثبت؛ session/client/navigation فقط حدود اصطناعية. غلاف Owner يطابق padding الصفحة، وثابت bailout الذي يضمنه Next ممثل في المختبر. الاستيرادات الفعلية وmetafile تفصل initial/shared/dynamic.
Verified: حزم Owner الأولية JS فقط376357→110079 بايت gzip؛ جميع قطعه406033→409829 (+3796). Practice الأولي والكلي278453→278453. OwnerPanel→OwnerAssessPanel→OwnerContentPanel/AuthoringEntry→authoring-review/copy والترجمات، وOwnerTraining→MyAttempts→سجل الفحوص تفسر الاختيار. OwnerSurveys يبقى eager لاعتماد lookup عليه؛ لا استخراج مساعد.
Inferred: فرصة المالك أوضح من تغيير سجلات Practice المشتركة؛ لا memoisation/selectors/virtualisation أو تغيير Practice. هذه حزم مكونات، لا أحجام Next الحالية.
كل خلية زمنية أدناه «median / nearest-rank p95» بالـms؛ عند10 عينات p95 هي أكبر عينة. usable من navigation إلى تحقق DOM والقراءات + نافذة استقرار50ms وفحص Playwright؛ ليس LCP/INP أو render time خالصًا. تفاعل Owner = refresh حتى الجاهزية؛ Practice = startPractice وإغلاق case sheet بالمساعد القائم.

| المسار/الكاش | usable قبل | usable بعد | أول تفاعل قبل | أول تفاعل بعد |
|---|---|---|---|---|
| Owner cold | 3476.2 / 3523.1 | 1938.9 / 2071.3 | 464.3 / 589.1 | 435.4 / 462.9 |
| Owner warm | 776.3 / 822.4 | 728.8 / 760.7 | 386.1 / 419.1 | 393.0 / 423.3 |
| Practice cold | 2864.9 / 2984.0 | 2889.0 / 2921.1 | 125.8 / 130.9 | 123.9 / 143.3 |
| Practice warm | 731.3 / 860.9 | 752.1 / 802.3 | 85.6 / 110.6 | 92.6 / 111.5 |

| أول استخدام في ترتيب Groups ثم Practice | الكاش | قبل | بعد |
|---|---|---|---|
| Groups أولًا | cold | 285.3 / 357.2 | 1591.7 / 1610.1 |
| Groups أولًا | warm | 269.0 / 285.8 | 577.0 / 587.7 |
| تدريب المالك بعد Groups | cold | 325.3 / 347.3 | 996.6 / 1085.9 |
| تدريب المالك بعد Groups | warm | 282.5 / 296.5 | 593.3 / 618.9 |
| العودة إلى Groups | cold | 245.3 / 272.3 | 254.8 / 277.1 |
| العودة إلى Groups | warm | 246.2 / 260.9 | 243.3 / 269.3 |

Verified: نقل JS+CSS في السيناريو البارد، الأرقام «قبل / بعد». encoded = جسم gzip، transfer = ResourceTiming ويشمل تقدير المتصفح للرؤوس. الطلبات JS+CSS فقط وRPC في عمود منفصل؛ HTML/favicon والخطوط/الصور ليست ضمن هذه البايتات. warm = صفر نقل شبكي لهذه الأصول، مع قراءات API جديدة.
| المرحلة التراكمية | طلبات JS+CSS | gzip body | transfer | RPC |
|---|---|---|---|---|
| البداية | 10 / 11 | 389020 / 122742 | 392020 / 126042 | 1 / 1 |
| Groups بعد refresh | 10 / 18 | 389020 / 307687 | 392020 / 313087 | 3 / 3 |
| تدريب المالك | 10 / 19 | 389020 / 392754 | 392020 / 398454 | 6 / 6 |
| العودة إلى Groups | 10 / 19 | 389020 / 392754 | 392020 / 398454 | 7 / 7 |
Verified: بداية Owner الباردة أقل في هذا المختبر؛ أول استخدام المؤجل أبطأ والطلبات/إجمالي بايتات الرحلة أعلى. النصوص النهائية متكافئة قبل/بعد، وطلبات القراءات متطابقة في مراحل العينات. لا تعميم سرعة للتطبيق أو تحسن warm/Practice من هذه الأرقام.
Inferred: من يفتح التبويبات فورًا قد يدفع تأخيرًا أكبر؛ انخفاض البداية ليس اختفاءً للكلفة. لذلك قيس تدريب المالك أولًا في سياقات مستقلة، ولم يُستدل على كلفته من فتحه بعد Groups فقط.

| التدريب أولًا مستقلًا | قبل median/p95 ms | بعد median/p95 ms |
|---|---|---|
| cold | 335.5 / 406.2 | 1092.4 / 1122.2 |
| warm | 304.9 / 361.6 | 606.2 / 616.0 |
Verified: عند أول تدريب cold،JS+CSS =10→14 طلبًا،gzip389020→209177 وtransfer392020→213377؛ RPC5/5 يشمل refresh والقراءات الثلاث القائمة. بعد Groups أيضًا يصل إلى392754 gzip و19 طلبًا؛ لا إخفاء لكلفة الاستخدام اللاحق.
Verified: جرد out القديم فقط: Owner391432/Practice474108 بايت gzip HTML-linked؛16/17 أصلًا و14 مشتركًا،30 قطعة JS و12 غير مرتبطة بالمسارين قد تكون لمسارات أخرى أو lazy. لم يثبت رأس هذا out؛ ليس baseline أو after لـP3.
Not run: Next hydration/RSC/waterfall الحالية. ميزانية HTML القائمة تستثني قطع lazy غير المرتبطة وRSC والخطوط والصور؛ نقل ومهلات المزوّد وcache/ضغط الاستضافة وبيانات المستخدم الحقيقية خارج المختبر.
التكرار: Node22 ثم `PLAYWRIGHT_MODULE=<installed-playwright> node scripts/qa/application-loading-performance.mjs`، ثم الأمر نفسه مع `--practice-first-only`. النتائج/الرسوم محليًا `/tmp/rad106-loading/{results,practice-first}.json` و`{before,after}/{owner,practice}/graph.json`. لا dependency/lock جديد.

## 4. الملفات والمشترك وScale
المسارات المحددة بالضبط:

- `src/features/pilot/OwnerPanel.tsx`
- `src/features/pilot/OwnerPanel-loading.test.ts`
- `scripts/qa/application-loading-performance.mjs`
- `scripts/pages/frontend-schema.json`
- `docs/DECISIONS.md`
- `docs/HANDOFF.md`
- `docs/project-status.md`
- `docs/archive/reports/2026-11/RAD-106_PERFORMANCE_P3_2026-11-06.md`
- `docs/archive/reports/README.md`

Verified — اشتقاق مستقل قبل تحديث manifest: مقارنة اتحاد حدود P2 الفعالة، بما فيها guardedFeatures الثابتة، برسم AST الحالي؛ لا حدود مضافة أو محذوفة، وتغيير OwnerPanel وحده. SHA-256 مستقل من بايتات الملف طابق الرسم:
`src/features/pilot/OwnerPanel.tsx`: `ec3d540c320b80e1387cd2aa43c7b4759116d693c1dfa4bb39dad071966f0776`.
Verified: لا استخراج helper ولا تعديل منسق/قارئ/hook/parser؛ حدود الصفحات والـAPI والحكم المحفوظ وعزل الحساب ثابتة. لا حد بيانات أو cache حساب جديد؛ cache أصول المختبر فقط لقياس البارد/الدافئ.

Verified: manifest خارج بصمة OwnerPanel مطابق حرفيًا لـP2؛ SQL/check bytes وgate/Variables والتوقعات المحمية ثابتة. marker مشتق مستقلًا من origin الموثق ومدخلات SQL/checks القديمة والحالية وطابق الحارس:
`pilot-v1:8c8207de423ba717b4607f3d9cd029f2f16436f4f6e4b8df06679eff3cc2dedc`.
Verified: fixture محلي بروابط مصادر وmanifest منفصل رفض3 pins (صفرية/القديمة/محذوفة) و4 attestations (مفقود/true/digest خاطئ/مشروع آخر)، وقبل الصحيح؛ أُزيل fixture ولم تتغير أي Variable.

## 5. الطب والتقييم
Verified: لا طب/scoring/SQL/cases/exams/radiograph/images/fonts/worker/clock/protocol أو telemetry/services/hosting/Variables متغيرة.

## 6. QA وحدوده
Verified: اختبارات baseline الموجهة74/74، ثم اختبارات المنتج/الطوارئ/manifest الموجهة123/123؛ اختبارات P3 النهائية5/5، واختبارات unit العامة2653/2653 عبر160 ملفًا على Node22. لم تتغير توقعات قديمة.
Verified: health:test9/9 وhealth:source بلا أخطاء؛ lint العام بلا أخطاء وتحذيران سابقان. tsc المباشر بلا أخطاء P3، وأربعة أخطاء route types قديمة لمسار emergency بسبب تعذر typegen.
Verified:16 حالة Owner ×EN/AR ×390/1440 ×Students/Groups/Assess/Practice؛ axe WCAG2/2.1 A/AA بلا مخالفات أو overflow، وتركيز الكيبورد وdirect/legacy links وBack محفوظة. فشل chunk فعلي مع بقاء stop ورابط reload ناجح؛ الحالات مكونات، لا تطبيق Next كامل.
Verified: محاولات build وbuild:pages وcheck على Node22 توقفتا عند ERR_SWC_NATIVE_CACHE؛ cache خاص آمن لم يحل القيد. لا تجاوز حارس أو تعديل اعتماديات/TLS/network/cache policy.
Verified: docs:sync مرتان والثانية0؛ docs:check صفر أخطاء/20 تحذير مراجعة؛ status:check --require-previous على origin/claude/rad105-promotion وgit diff --check ناجحة. health:sizes المحلي يقرأ out القديم فقط؛ ليس إثبات P3.
Not run: تطبيق Next كامل محليًا أو تحقق سريري/هاتف/مزود/بيانات حية؛ CI النهائي يثبت build/check المدعوم فقط، لا أداء إنتاج. حد المختبر يرتفع بقياس Next/هاتف مأذون منفصل؛ لا زيادة للميزانية أو تجاوز guard.

## 7. المفتوح
مرشح P3 ينتظر CI للرأس النهائي ثم مراجعة التنسيق؛ نتيجته وSHA الكامل يسجلان في وصف [Draft #243](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/243) بعد الدفع، ولا يُستنتجان من P2. تعذر Next المحلي يرفع فقط ببناء مدعوم، لا بتجاوز الحراس. فحوص عائلة Owner/Assess القائمة على static Next كامل لم تُنسب إلى out القديم؛ مصفوفة المكونات الحالية واختبارات الطوارئ أعلاه دليل محدود منفصل.

## 8. قائمة المالك والمتابعة
راجع حدود الدليل وكلفة أول استخدام المؤجل، فرق الملفات والبصمات وCI للرأس النهائي، ثم أعد P3 لمراجعة التنسيق. تبقى #243 Draft وقاعدتها المؤقتة و#242 ثابتتين؛ لا Ready/merge/deployment أو مرحلة لاحقة.
