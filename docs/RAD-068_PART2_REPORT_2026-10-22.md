# RAD-068 الجزء 2 — دفعة النص T + AR (2026-10-22)

المرجع: [قرارات دفعة النص](DECISIONS.md#text-batch-owner-2026-10-22)، [تقرير الفرز](RAD-065_REVIEW_TRIAGE_2026-10-22.md) (الجدولان ب وج)، [تقرير الجزء 1](RAD-068_PART1_REPORT_2026-10-22.md)، و[جدول النصوص المتغيرة](RAD-068_PART2_TEXT_CHANGES_2026-10-22.md) (الملحق: كل نص، قبل ← بعد، مع البند). الترتيب بحسب S-STD-1. الجزء 3 (بنود S) لم يبدأ.

## 1. الانحرافات والميزانية
**الهدف:** نصوص فقط (لا درجة ولا قيمة ولا قاعدة ولا رسم ولا إصدار محرك): نصوص D1 الخمسة، تسميات شارات الأدلة، صياغة G1/G3/G8/G9، مصطلحات العربية (الجدول ج)، CLN-034، تسمية زر AP، ومعالجة CLN-018 إن كان في الفرز صياغة.

**الميزانية المعلنة:**
- **وثائق:** `docs/DECISIONS.md`، `docs/project-status.md`، `docs/ARABIC_TERMINOLOGY.md`، `docs/HANDOFF.md`، وهذا التقرير وملحقه.
- **رسائل:** `messages/en.json`، `messages/ar.json`.
- **بيانات الفحوص:** `chest-pa-erect.ts` و`chest-pa-technique.ts` و`chest-lateral-erect.ts` و`chest-lateral-technique.ts` و`chest-ap-supine.ts` و`chest-ap-technique.ts` و`upper-limb-common.ts` و`upper-limb-technique.ts` و`lower-limb-common.ts` و`lower-limb-technique.ts` و`lower-limb-ankle-texts.ts` و`shoulder-grashey-erect.ts` و`shoulder-technique.ts` و`pelvis-technique.ts`؛ والحالات `chest-pa-erect.ts` و`chest-lateral-erect.ts` و`chest-ap-supine.ts` و`upper-limb-case.ts` و`lower-limb-case.ts` و`lower-limb-radiographs.ts`. تعليقان فقط (لا نص معروض) في `evaluation/critical.ts` و`domain/case.ts` لصياغة G8.
- **وحدة مشتركة واحدة:** `ConsolePanel.tsx` (سطر `help` واحد لتسمية AP، البند F).
- **اختبارات:** اختبار جديد `src/i18n/displayed-text.test.ts`؛ وتحديث توقعات نصية فقط في `critical-findings.test.ts` و`messages.test.ts` و`laterality-audit.test.ts` (§5).
- **لقطات وبصمات (استثناء S-STD-2 للنص فقط بقرار المالك):** `scripts/qa/characterisation/chest-pa-case.json` و`chest-pa-scenarios.json`، و12 ملف بصمات في `scripts/qa/scene-dom/`.
- نصوص الباني المشترك للأطراف العليا عُدّلت مرة واحدة في `upper-limb-common.ts` (والطرف السفلي مرة واحدة في `lower-limb-common.ts`).

**الانحرافات:**
- **نصوص الأدلة الداخلية (`note` / `reference`) لم تُلمس.** تظهر في قسم «الدليل على هذا الفحص» القابل للطي، وفيها «provisional» و«VALIDATED» و«pending educator review»: 302 ورودًا و94 نصًا فريدًا في بيانات الفحوص. يتداخل تغييرها مع بند علامات `provisional` المستقل (استثناء S-STD-2 يمس أكثر من نصوص هذه الدفعة)، فأبقيتها بند مفتوحًا (§7) واستثنيتها صراحةً من اختبار «لا كلمات محذوفة». ما عداها من النص المعروض خضع للفحص.
- **أُضيفت نصوص لم تُدرج بأسمائها في المهمة لكنها تحمل الكلمات المحظورة:** عنوانا بروتوكول التقنية «Demo protocol … (provisional)» (17 فحصًا) وتسمية المريض «(… provisional)»، وقيمتان في افتراضات التقنية («The physics is validated» و«Demo scoring tolerances»)، وصياغة «demo protocol / demo target» في رسائل kVp وSID وAEC. عُدّلت كلها (D1/D5) لأن الفحص المطلوب يمنع الكلمات في أي نص معروض.
- **صياغة G8 المقترحة في الفرز («قد تحتاج إلى إعادة…») لم تُستعمل:** قرار المالك لهذه الجلسة «لا لغة إعادة»، فاستُبدلت بـ«هذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة».
- **صياغة الإنجليزية لـ«لا تظهر إصابة في وصف المصدر»:** اختبارات الكاحل القائمة تمنع كلمة «injur» في نص الطالب، فاستُعملت «the source description mentions no trauma»؛ والعربية بنص الفرز حرفيًا.
- **CLN-018 غير منفذ:** الفرز لا يعطي صياغة؛ يبقى مفتوحًا وغير معروض.
- **صفوف الجدول ج غير الموجودة في النص المعروض:** «جيب الرسغ» و«السمسمانيات» لا يردان في أي نص حاليًا؛ سُجل المقترح في المصطلحات ليُطبق عند ظهورهما. «يُفترض أن» لا يرد في العربية المعروضة (CLN-034).
- سجل خطأ في سكربت مؤقت (خارج المستودع) أوقف التشغيل قبل حفظ سجل التعديلات؛ أُعيد توليد السجل بتشغيل السكربتات نفسها على نسخة نظيفة من `HEAD` وطابق الفرق الناتج النسخة العاملة في كل ملف مصدر (باستثناء التعديلات اليدوية الموثقة هنا).

## 2. المنجز والمتروك
**منجز**
- **أ.** نصوص D1 الخمسة (§3 أ)، دون «provisional / demo values / awaiting educator review»، مع بقاء المعنى الأمين («نموذج تعليمي»، «مؤشر تعريض محاكى»، «ليس مؤشر تعريض كاشف حقيقي»).
- **ب.** `radiograph.educationalNote`: بقيت «ليست صورة مريض الحالة» وملاحظة المؤثرات البصرية؛ حُذفت «ليست صورة تشخيصية أو مُعتمدة سريريًا». بدائل «not a diagnostic image» كما هي.
- **ج.** شارتا الأدلة: «SOURCE-BASED» / «مستند إلى مصدر» و«TEACHING VALUE» / «قيمة تعليمية» في كل موضع؛ المعرّفات وقيم البيانات كما هي (D4). وما يشير إلى «validated» في النص الجاري (مقدمة الافتراضات ومقدمة الآثار ونص المجال الأكبر) بُدّل بما يتسق.
- **د.** G1 (kVp وSID: «خارج بروتوكول هذه الحالة» بدل «التجريبي/المحاكي»)، G3 («مؤشر تعريض محاكى»)، G8 (لا لغة إعادة في كل بوابات العلامة والحركة والإسقاط والذراعين، ولا في ملاحظة الدوران الجانبي)، G9 (جملة «تشويه صورة واحدة لا يعيد بناء التشريح المحجوب» في 15 وصف دوران)، E (`result.criticalNote`)، S12-11 (أثر الذراعين غير ممثَّل)، S14.4-R2/S14.5-R3/R8 (أوصاف مراجع الركبة والقدم والكاحل).
- **هـ.** كل صفوف الجدول ج الموجودة، ونص SID للمرفق («للمرفق»)، وCLN-034 (الأسهم «←» في كل العناوين العربية)، و`ARABIC_TERMINOLOGY.md`.
- **و.** زر AP: سطر مساعدة تحت «الإسقاط / المنظر» يقول إن التسمية تتبع وضعية المريض المختارة حاليًا.
- اختبار جديد: لا كلمة محذوفة في أي نص معروض (EN/AR)، وتسميتا الشارتين، وقواعد جمع العمر بالعربية.

**متروك**
- نصوص الأدلة الداخلية (§1 و§7)، وCLN-018، وصفوف §12 خارج الجدول ج، وCLN-025 (قرار المالك: لا في الوقت الحالي).
- الجزء 3 (بنود S)، وبنود R، وعلامات `provisional` في البيانات.

## 3. لكل مهمة
**RAD-068 (in_progress):** الجزء 1 مدموج (#109) والجزء 2 هذا في PR مسودة. لا يُضبط `done`. CLN-025 مؤجل ومسجل في RAD-068 وفي متابعة RAD-061.

### جدول كل نص تغيّر
الجدول الكامل (المفتاح، EN وAR، قبل ← بعد، بند الفرز) في [الملحق](RAD-068_PART2_TEXT_CHANGES_2026-10-22.md): 107 مفتاح رسائل و136 استبدالًا في ملفات البيانات. ملخصه بحسب البند:

| البند | EN | AR | الموضع | صف الفرز |
|---|---|---|---|---|
| A | `evidence.provisional`: PROVISIONAL ← TEACHING VALUE | مؤقت ← قيمة تعليمية | `evidence.provisional` | قرار المالك 2؛ D1 |
| A | `result.criticalImplementation`: «Implementation (provisional / educational)» ← «Implementation (educational simulator rule)» | «التطبيق (مؤقت / تعليمي)» ← «التطبيق (قاعدة تعليمية في المحاكي)» | `result.criticalImplementation` | D1 |
| A | `technique.model`: «…its DI bands are provisional» ← «the simulated exposure indicator is not a real detector's exposure index, and the model does not predict any patient dose» | «ونطاقات DI فيه مؤقتة» ← «مؤشر التعريض المحاكى ليس مؤشر تعريض كاشف حقيقي…» | `technique.model` | D1 + G3 |
| A | `technique.gaugeNote`: «provisional demo values» ← «teaching choices of this simulator»؛ «EI here is a simulated exposure indicator» | «قيم تجريبية مؤقتة» ← «اختياران تعليميان في هذا المحاكي»؛ «EI هنا مؤشر تعريض محاكى» | `technique.gaugeNote` | D1 + G3 |
| A | `radiograph.clippingMarginNote`: حُذف «provisional … (a demo size awaiting educator review)» | حُذف «المؤقتة (حجم تجريبي بانتظار مراجعة المعلّم)» | `radiograph.clippingMarginNote` | D1 |
| B | `radiograph.educationalNote`: حُذف «and not a diagnostic or clinically validated radiograph» | حُذف «وليس صورة أشعة تشخيصية أو مُعتمدة سريريًا» | `radiograph.educationalNote` | B |
| C | `evidence.validated`: VALIDATED ← SOURCE-BASED | مثبت ← مستند إلى مصدر | `evidence.validated`، `technique.assumptionsIntro` | قرار المالك 2 |
| D | G1: «outside the demo protocol's range» / «this simulator's range» ← «outside this case's protocol range» | «خارج نطاق البروتوكول التجريبي / المحاكي» ← «خارج نطاق بروتوكول هذه الحالة» | قواعد kVp وSID لكل الفحوص | G1 |
| D | G3: «Deviation index (DI-like)» ← «(simulated)» | «(شبيه بـ DI)» ← «(محاكى)» | `technique.di` | G3 |
| D | G8: «normally repeated» وما يماثله ← «This is an educational result, not a clinical decision about the image.» | «تُعاد الصورة عادةً» ← «وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة» | بوابات الصدر PA/AP/جانبي والأطراف العليا والسفلى | G8 / S7 |
| D | G9: جملة «A warp of one image cannot reconstruct hidden anatomy…» | «تشويه صورة واحدة لا يعيد بناء التشريح المحجوب…» | `radiograph.*.effects.rotation.desc` (15) | G9 |
| D | E: `result.criticalNote` «…an important error to correct in training, not a clinical decision about the image» | «وهي خطأ مهم يجب تصحيحه في التدريب وليست قرارًا سريريًا بشأن الصورة» | `result.criticalNote` | E (Checklist E) |
| D | S12-11: «Raise the arms… This setup is not suitable for a lateral; its effect is not drawn in this image.» | «هذا إعداد غير مناسب للصورة الجانبية؛ وأثره غير ممثَّل في هذه الصورة» | الصدر الجانبي، الذراعان | S12-11 |
| D | «an adult ankle (the source description mentions no trauma)» ← «a normal adult ankle» (الركبة والقدم كذلك) | «كاحل لشخص بالغ (لا تظهر إصابة في وصف المصدر)» ← «كاحل طبيعي لشخص بالغ» | `lower-limb-radiographs.ts` | S14.4-R2، S14.5-R3/R8 |
| E | — | «للمرفق» بدل «لليد» في نص SID للمرفق | `upper-limb-common.ts` (`sidForPart`) | وُجد في الجزء 1 |
| E | — | الأسهم «→» ← «←» في 25 عنوان أثر | `radiograph.*.effects.*.title` | CLN-034 |
| E | — | الكاسيت←الكاشف؛ النهايتان البعيدتان للكعبرة والزند؛ المفصل المشطي السلامي (MCP)؛ الجزء البعيد من الساعد؛ اللقمتان؛ الناتئ الزُّجّي للزند؛ عظم القَعْب؛ المكعبي؛ المفصل الحقاني العضدي؛ تدوير الجسم نحو الكتف المفحوص؛ الثَّلمة الوداجية؛ احبس نَفَسَك؛ قادرة على الوقوف؛ ملتفة؛ تأكيد الخادم؛ مزامنة الحالة مع الخادم؛ قواعد جمع العمر | الرسائل والبيانات | الجدول ج |
| F | الإسقاط: سطر مساعدة «The AP label follows the patient position currently selected (supine or semi-erect); it does not change the projection.» | «تسمية AP تتبع وضعية المريض المختارة حاليًا (مستلقيًا أو شبه جالس)؛ ولا تغيّر الإسقاط.» | `console.projectionFollowsPosition` (يظهر في الفحص الذي يعلن `projectionLabels` فقط، أي الصدر AP) | البند 4 من قائمة الصور |
| D1 (إضافة) | «Demo protocol — … (provisional)» ← «Teaching protocol — …»؛ «(reference attenuation; provisional)» ← «(reference attenuation)»؛ «The physics is validated» ← «source-based»؛ «Demo scoring tolerances» ← «Teaching scoring tolerances» | «بروتوكول تجريبي — … (مؤقت)» ← «بروتوكول تعليمي — …»؛ «؛ مؤقت)» حُذفت؛ «الفيزياء مثبتة» ← «مستندة إلى مصدر» | بيانات التقنية والحالات | D1/D5 |

### CLN-018 وCLN-025 وCLN-034
- **CLN-018:** الفرز لا يعطي صياغة لـ`imageCriteria`؛ غير معروضة؛ تبقى مفتوحة.
- **CLN-025:** مؤجل بقرار المالك (لا في الوقت الحالي).
- **CLN-034:** نُفذ (الأسهم). فروق «يُفترض أن / يجب أن» لا وجود لها في العربية المعروضة.

## 4. التغييرات المشتركة وScale
- **وحدة مشتركة:** `ConsolePanel.tsx`: `help` واحد يظهر عندما يعلن الفحص `projectionLabels` (الصدر AP فقط الآن). لا تغيير في التحكم أو التقييم أو الـDOM لبقية الفحوص.
- **الباني المشترك:** كل نص مشترك للأطراف العليا عُدّل مرة في `upper-limb-common.ts`، وللأطراف السفلى في `lower-limb-common.ts`.
- **Scale (S-STD-3):** (1) جملة G9 مكررة في 15 مفتاح وصف دوران (مفتاح لكل فحص في `messages`)؛ فحص جديد يحتاج جملة في مفتاحه، والسقف: أكثر من نحو 20 فحصًا أو جلسة تعميم تدمجها في مفتاح مشترك. (2) قواعد جمع العمر بالعربية عبر ICU: أي لغة إضافية تحتاج قواعدها؛ المحفّز: لغة ثالثة. (3) اختبار الكلمات المحظورة يمرّ على كل `CASES` تلقائيًا (فحص جديد يدخل دون تعديل)، لكنه يستثني `note` و`reference` و`status` عن قصد حتى يُحسم بند الأدلة الداخلية (§7)؛ محفّز رفع الاستثناء: قرار علامات `provisional`.

## 5. الطبي والتقييم
- **لا تغيير** في أي درجة أو قيمة أو حد أو وزن أو حالة أو قاعدة أو رسم أو `PRACTICE_EVALUATION_VERSION`.
- **صياغة ذات مضمون طبي** تحتاج عين المالك: (1) نصوص G8 (لا «تُعاد»)؛ (2) «عظم القَعْب» (talus) مع بقاء «عظم الكاحل» مرادفًا في الشرح؛ (3) «لا تظهر إصابة في وصف المصدر»؛ (4) جملة G9؛ (5) «النهايتان البعيدتان للكعبرة والزند». مصدر كل صياغة بند الفرز المذكور؛ لا ادعاء مراجعة معلّم (D5).
- **توقعات اختبارات نصية حُدّثت (نص فقط، ولا رقم):** `critical-findings.test.ts` (المطابقة على نص G8 الجديد بدل «normally be repeated»)، و`messages.test.ts` (ثلاث: `effectsIntro` «measured» بدل «validated»؛ `educationalNote` لا يحوي «diagnostic|validated|clinically»؛ «نَفَسَك» في تعليمات التنفس)، و`laterality-audit.test.ts` (النمط يقبل «عرض الكاشف»). لم يُغيَّر أي توقع رقمي أو درجة.

## 6. QA
**أُثبت قبل تحديث أي لقطة (الإثبات):**
- **بصمات scene-dom (12 ملفًا، 988 مفتاحًا من 2256 مفتاحًا، كلها نص):** أُعيد توليد كل مشهد ولوحة نتيجة من `HEAD` ومن الشجرة المعدّلة بالمُصيِّر نفسه (مُصيِّر الاختبارات)؛ طابقت بصمة `HEAD` كل مفتاح في الملفات الـ12 (التحقق من أن الطريقة تعيد القيم الأصلية)، ثم قورنت كل لوحة وسم بوسم: **تسلسل الوسوم وكل سمة غير `aria-label` متطابقان حرفيًا، وتسلسل الأرقام في كل عقدة نص وفي كل سمة متطابق، والفرق الوحيد نصوص وسمات `aria-label`**: صفر فرق غير نصي. الحالات المركبة (`CASES`) متطابقة في كل قيمة غير نصية.
- **لقطات توصيف الصدر PA:** `chest-pa-case.json` (50 نصًا) و`chest-pa-scenarios.json` (848 ورودًا، 52 نصًا فريدًا): نفس المفاتيح والبنية، كل الدرجات والأحكام والأرقام والبصمات الست (render hash) والقيم المنطقية متطابقة، والفرق نص فقط. `golden-image-checksums.json` لم يتغير (لا تغيير في الصور).
- جدول الملفات (الفحص ← مفاتيح البصمة المتغيرة): `hashes.json` (الصدر: PA 80، جانبي 96، AP 96)؛ wrist 64 (PA 32، جانبي 32)؛ hand 64 (32/32)؛ elbow 72 (36/36)؛ foot-ap 50؛ foot-oblique 50؛ knee-ap 100؛ knee-lateral 50؛ ankle-ap 42؛ ankle-lateral 42؛ pelvis-ap-supine 24؛ shoulder-grashey-erect 64. النصوص المتغيرة بين `HEAD` وهذه الشجرة في هذه المفاتيح: 335 فرقًا فريدًا (نصوص الملحق نفسها).

**مُشغَّل:** أثناء العمل: اختبارات `src/features/exam` و`src/features/qa` و`src/i18n`. في النهاية مرة واحدة: `npm run check` (typecheck وlint وvitest)، `npm run build`، `npm run build:pages`، `simulator-layout-audit.mjs` و`result-marker-audit.mjs` (390 و1440، EN/AR). وثائق: `docs:check -- --base origin/main`، `status:check -- --base origin/main --require-previous`، `git diff --check`.

**النتائج:** (تُستكمل في آخر commit بعد التشغيل النهائي.)

**غير مُشغَّل:** `qa:golden` (لا تغيير في صور) و`qa:visual` و`qa:a11y` (لا تغيير مرئي سوى سطر المساعدة). لا معاينة مستضافة (المالك يفحص من هاتفه). `qa:characterise` شُغّل بالصيغة المسموحة فقط (`UPDATE_CHARACTERISATION=1` على اختبار التوصيف) بعد إثبات أن الفرق نص فقط.

## 7. بنود مفتوحة
1. **نصوص الأدلة الداخلية المعروضة** (`note`/`reference`: 302 ورودًا، 94 نصًا فريدًا) تحوي «provisional» و«VALIDATED» و«pending educator review»؛ تظهر في «الدليل على هذا الفحص» القابل للطي. تغييرها يغيّر لقطات الصدر PA ويتصل بقرار علامات `provisional` المستقل؛ يلزم قرار المالك على استثناء S-STD-2 أوسع أو على إبقائها داخلية (D4).
2. CLN-018 (`imageCriteria`): لا صياغة في الفرز؛ غير معروضة.
3. صفوف §12 من المراجعة خارج الجدول ج.
4. CLN-025: مؤجل بقرار المالك.
5. البند 16 من قائمة الصور (ينتظر المالك).
6. هشاشة توقيت `scene-dom.test.ts` تحت الحمل (سابقة؛ لا إجراء).

## 8. قائمة المالك وموجّه الجلسة التالية
**قائمة الهاتف (Practice، عربي وإنجليزي):**
1. **صفحة النتيجة:** عرّض أي فحص: هل تقرأ الجمل بلا «مؤقت/تجريبي/بانتظار مراجعة»؟ افتح «الدليل على هذا الفحص»: هذه نصوص الأدلة الداخلية (بند مفتوح).
2. **التغذية الراجعة:** عرّض الصدر PA بـkVp خارج النطاق، وبـSID بعيد: «خارج بروتوكول هذه الحالة» لا «غير صحيح».
3. **الشارتان:** «مستند إلى مصدر» و«قيمة تعليمية» (و SOURCE-BASED / TEACHING VALUE بالإنجليزية) في الأدلة وفي وحدة التقنية.
4. **زر AP (الصدر AP):** تحت «الإسقاط / المنظر» سطر يوضح أن التسمية تتبع وضعية المريض؛ بدّل المستلقي/شبه الجالس وانظر الزر.
5. **نص SID للمرفق بالعربية:** اجعل SID قصيرًا في المرفق: «…الذي يذكره Bontrager للمرفق».
6. **غياب العلامة:** عرّض بلا علامة في الرسغ: النص الحرج بلا لغة إعادة.

**موجّه الجلسة التالية:** RAD-068 الجزء 3 (بنود S): S2 (التغطية، الصدر PA أولًا ثم الأطراف) وS3 الخيار «د» وS5 وS6 وفحص S8، كل منها دفعةً مستقلة برفع `PRACTICE_EVALUATION_VERSION` وموافقة المالك على البند. ثم بند علامات `provisional` ونصوص الأدلة الداخلية (قرار المالك على الاستثناء الأوسع)، ثم RAD-072.

**السؤالان (AGENTS) عن القواعد المعاد صياغتها:**
- **قرار الإقرار أعلاه** `text-batch-owner-2026-10-22`: جديد، لا يعيد صياغة قاعدة قائمة؛ لا يغيّر D1 وD4 وD5 وS-STD-2 بل يطبقها (استثناء النص فقط لهذه الدفعة).
- **وصف RAD-068 و RAD-061 في الحالة:** اختُصر وصف RAD-068 (350 حرفًا) فنُقلت قصة الجزء 1 والتفاصيل إلى التقريرين؛ الحكم لم يتغير، والمراجع الأصلية باقية في `source_ref`. أُضيف إلى RAD-061 سطر عن CLN-025 دون حذف شيء.
- **ARABIC_TERMINOLOGY:** صفوف الجداول القديمة (جلسة 8) حُدّثت إلى الصيغ الحالية؛ الحكم تغيّر فعلًا بقرار المالك/الفرز (الشارتان وجدول ج)، والرابط إلى الدليل الأصلي (تقرير الفرز وقرار الإقرار) باقٍ في القسم الجديد.
