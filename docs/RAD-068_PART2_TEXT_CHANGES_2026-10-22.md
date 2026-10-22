# RAD-068 الجزء 2 — جدول النصوص المتغيرة (2026-10-22)

ملحق [التقرير](RAD-068_PART2_REPORT_2026-10-22.md) (§3). مولَّد من سجل التعديلات؛ كل صف صفّ فرز أو قرار مالك مذكور في عمود «البند». لا أرقام ولا درجات ولا قيم ولا رسم تغيّرت (انظر الإثبات في التقرير §4 و§5).

## أ. رسائل الواجهة (`messages/en.json` و`messages/ar.json`)

| الملف | المفتاح | قبل | بعد | البند |
|---|---|---|---|---|
| EN | `evidence.validated` | VALIDATED | SOURCE-BASED | owner decision 2 (D5) |
| AR | `evidence.validated` | مثبت | مستند إلى مصدر | owner decision 2 (D5) |
| EN | `evidence.provisional` | PROVISIONAL | TEACHING VALUE | A; owner decision 2 |
| AR | `evidence.provisional` | مؤقت | قيمة تعليمية | A; owner decision 2 |
| EN | `result.criticalImplementation` | Implementation (provisional / educational) | Implementation (educational simulator rule) | A (D1) |
| AR | `result.criticalImplementation` | التطبيق (مؤقت / تعليمي) | التطبيق (قاعدة تعليمية في المحاكي) | A (D1) |
| EN | `technique.model` | Educational model — it does not predict a real detector's exposure index or any patient dose, and its DI bands are provisional. | Educational model — the simulated exposure indicator is not a real detector's exposure index, and the model does not predict any patient dose. | A (D1) + G3 |
| AR | `technique.model` | نموذج تعليمي — لا يتنبأ بمؤشر التعريض لكاشف حقيقي ولا بأي جرعة للمريض، ونطاقات DI فيه مؤقتة. | نموذج تعليمي — مؤشر التعريض المحاكى ليس مؤشر تعريض كاشف حقيقي، ولا يتنبأ النموذج بأي جرعة للمريض. | A (D1) + G3 |
| EN | `technique.gaugeNote` | DI = 10 × log10(EI / EIT). +3 ≈ twice the target exposure, −3 ≈ half. The ±1 and ±3 scoring bands are provisional demo values, not universal limits. EI is not patient dose. | DI = 10 × log10(EI / EIT). +3 ≈ twice the target exposure, −3 ≈ half. The ±1 and ±3 scoring bands are teaching choices of this simulator, not universal limits. EI here is a simulated exposure indicator, not patient dose. | A (D1) + G3 |
| AR | `technique.gaugeNote` | DI = 10 × log10(EI / EIT). ‏+3 ≈ ضعف التعريض المستهدف و−3 ≈ نصفه. نطاقا التقييم ±1 و±3 قيم تجريبية مؤقتة وليست حدودًا عالمية. EI ليس جرعة المريض. | DI = 10 × log10(EI / EIT). ‏+3 ≈ ضعف التعريض المستهدف و−3 ≈ نصفه. نطاقا التقييم ±1 و±3 اختياران تعليميان في هذا المحاكي وليسا حدودًا عالمية. EI هنا مؤشر تعريض محاكى وليس جرعة المريض. | A (D1) + G3 |
| EN | `radiograph.clippingMarginNote` | Margin only at {sides}: the field cuts only the margin of the provisional required region (a demo size awaiting educator review), beyond the lungs, ribs and costophrenic angles drawn in this baseline picture. The score still applies the region, but the picture shows those structures complete. | Margin only at {sides}: the field cuts only the margin of the required region, beyond the lungs, ribs and costophrenic angles drawn in this baseline picture. The score still applies the region, but the picture shows those structures complete. | A (D1) |
| AR | `radiograph.clippingMarginNote` | هامش فقط عند {sides}: يقطع المجال هامش المنطقة المطلوبة المؤقتة (حجم تجريبي بانتظار مراجعة المعلّم) خلف الرئتين والأضلاع والزاويتين الضلعيتين الحجابيتين المرسومة في هذه الصورة المرجعية. ما زالت الدرجة تطبّق المنطقة، لكن الصورة تُظهر تلك البنى كاملة. | هامش فقط عند {sides}: يقطع المجال هامش المنطقة المطلوبة فقط، خلف الرئتين والأضلاع والزاويتين الضلعيتين الحجابيتين المرسومة في هذه الصورة المرجعية. ما زالت الدرجة تطبّق المنطقة، لكن الصورة تُظهر تلك البنى كاملة. | A (D1) |
| EN | `radiograph.educationalNote` | Educational reference appearance — not an image of the case patient, and not a diagnostic or clinically validated radiograph. The visual effects are educational approximations: their size does not measure real rotation, movement, noise or dose. | Educational reference appearance — not an image of the case patient. The visual effects are educational approximations: their size does not measure real rotation, movement, noise or dose. | B |
| AR | `radiograph.educationalNote` | مظهر مرجعي تعليمي — وليس صورة لمريض الحالة، وليس صورة أشعة تشخيصية أو مُعتمدة سريريًا. المؤثرات البصرية تقريبات تعليمية: حجمها لا يقيس الدوران أو الحركة أو الضجيج أو الجرعة الحقيقية. | مظهر مرجعي تعليمي — وليس صورة لمريض الحالة. المؤثرات البصرية تقريبات تعليمية: حجمها لا يقيس الدوران أو الحركة أو الضجيج أو الجرعة الحقيقية. | B |
| EN | `technique.assumptionsIntro` | Every medical rule behind this feedback is classified. Only “validated” items are claims of fact; the rest are protocol- or demo-specific. | Every medical rule behind this feedback is classified. Only “source-based” items are claims taken from a cited source; the rest are protocol-specific or teaching choices. | C (badge label in running text) |
| AR | `technique.assumptionsIntro` | كل قاعدة طبية وراء هذه التغذية الراجعة مصنَّفة. فقط البنود «المثبتة» تُعدّ ادعاءات حقائق؛ أما البقية فخاصة بالبروتوكول أو بالعرض التجريبي. | كل قاعدة طبية وراء هذه التغذية الراجعة مصنَّفة. فقط البنود «المستندة إلى مصدر» تُعدّ ادعاءات مأخوذة من مصدر مذكور؛ أما البقية فخاصة بالبروتوكول أو اختيارات تعليمية. | C (badge label in running text) |
| EN | `radiograph.effectsIntro` | Each item links something you did to a visible effect. The clinical concept and the amount drawn are classified separately: the amount drawn is always an educational approximation, never a validated appearance. | Each item links something you did to a visible effect. The clinical concept and the amount drawn are classified separately: the amount drawn is always an educational approximation, never a measured appearance. | A/C (D5) |
| AR | `radiograph.effectsIntro` | كل بند يربط شيئًا فعلته بأثر ظاهر. يُصنَّف المفهوم السريري والمقدار المرسوم كلٌّ على حدة: المقدار المرسوم تقريب تعليمي دائمًا وليس مظهرًا مُعتمدًا. | كل بند يربط شيئًا فعلته بأثر ظاهر. يُصنَّف المفهوم السريري والمقدار المرسوم كلٌّ على حدة: المقدار المرسوم تقريب تعليمي دائمًا وليس مظهرًا مقيسًا. | A/C (D5) |
| EN | `radiograph.effects.excess-field.desc` | A larger field exposes and shows more tissue. No scatter or contrast penalty is drawn, because there is no validated physical model for it here; the real cost is unnecessary exposure. | A larger field exposes and shows more tissue. No scatter or contrast penalty is drawn, because this simulator has no physical model for it; the real cost is unnecessary exposure. | A/C (D5) |
| AR | `radiograph.effects.excess-field.desc` | المجال الأكبر يُعرِّض ويُظهر نسيجًا أكثر. لا يُرسم أي أثر للتشتت أو التباين لعدم وجود نموذج فيزيائي معتمد لذلك هنا؛ والكلفة الحقيقية هي التعريض غير الضروري. | المجال الأكبر يُعرِّض ويُظهر نسيجًا أكثر. لا يُرسم أي أثر للتشتت أو التباين لأن هذا المحاكي لا يملك نموذجًا فيزيائيًا لذلك؛ والكلفة الحقيقية هي التعريض غير الضروري. | A/C (D5) |
| EN | `technique.di` | Deviation index (DI-like) | Deviation index (simulated) | G3 |
| AR | `technique.di` | مؤشر الانحراف (شبيه بـ DI) | مؤشر الانحراف (محاكى) | G3 |
| EN | `radiograph.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.lateral.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.lateral.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.ap.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.ap.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.wrist-pa.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.wrist-pa.effects.rotation.desc` | (النص الحالي) | + «في إسقاط PA الصحيح للرسغ تكون المسافات بين قواعد عظام مشط اليد متقاربة، ويظهر تقعر متساوٍ على جانبي أجسامها، وتكون النهايتان البعيدتان للكعبرة والزند منفصلين (Bontrager ص.156). مع الدوران تصبح المسافات بين عظام مشط اليد غير متساوية وتتباعد الكعبرة والزند أو تتقاربان حتى تتراكبا بحسب اتجاه الدوران. يُحتسب مقدار الدوران فقط دون اتجاهه. الصورة تقريب تعليمي من صورة مرجعية واحدة بنموذج عمق بسيط (الدوران مرسوم مبالغًا فيه بنحو 2.3 ضعف القيمة) وليست قياسًا للدرجات؛ ولا تُمثَّل حركة عظام الرسغ الحقيقية ولا تقعر الأجسام. تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.wrist-lateral.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.wrist-lateral.effects.rotation.desc` | (النص الحالي) | + «في الإسقاط الجانبي الصحيح للرسغ يقع رأس الزند فوق النهاية البعيدة للكعبرة وتتراكب قواعد عظام مشط اليد من الثانية إلى الخامسة (Bontrager ص.158). مع الدوران تُرسم كل من هذه البنى مرتين منفصلتين: نسخة أقوى للجهة الأقرب إلى الكاشف وأضعف للجهة الأبعد عنه. يُحتسب مقدار الدوران فقط دون اتجاهه. الصورة تقريب تعليمي (نسختان ممزوجتان لنوافذ كاملة، لا بنى تغطي بعضها بعضًا) من صورة مرجعية واحدة بنموذج عمق بسيط (الدوران مرسوم مبالغًا فيه بنحو 2.3 ضعف القيمة) وليست قياسًا للدرجات. تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.hand-pa.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.hand-pa.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.hand-lateral.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.hand-lateral.effects.rotation.desc` | (النص الحالي) | + «في الإسقاط الجانبي الصحيح لليد (الأصابع ممدودة) تكون عظام مشط اليد والسلاميات متراكبة ويكون النهايتان البعيدتان للكعبرة والزند متراكبين (Bontrager ص.153). مع الدوران تُرسم العظام التي يجب أن تتراكب متباعدة. يُحتسب مقدار الدوران فقط دون اتجاهه. المقدار المرسوم تقريب تعليمي من صورة مرجعية واحدة وليس قياسًا للدرجات. تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.elbow-ap.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.elbow-ap.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.elbow-lateral.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.elbow-lateral.effects.rotation.desc` | (النص الحالي) | + «في الإسقاط الجانبي الصحيح للمرفق (انثناء 90°) تكون اللقيمتان وحدودهما متراكبة ويكون نحو نصف رأس الكعبرة مغطى بالنتوء الإكليلي (Bontrager ص.172). مع الدوران تُرسم حدود اللقمتين ومنطقة رأس الكعبرة والنتوء الإكليلي مرتين منفصلتين: نسخة أقوى للجهة الأقرب إلى الكاشف وأضعف للجهة الأبعد عنه. يُحتسب مقدار الدوران فقط دون اتجاهه. الأقواس المتحدة المركز لأخدود البكرة والحافتان المزدوجتان للرأس والبكرة (معيارا Bontrager آخران) لا تُرسم لأن صورة مرجعية واحدة لا تُظهرها بأمانة. المقدار المرسوم تقريب تعليمي (نسختان ممزوجتان، لا نموذج لتغطية البنى بعضها لبعض) وليس قياسًا للدرجات. تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.foot-ap.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.foot-ap.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.foot-oblique.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.foot-oblique.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.knee-ap.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.knee-ap.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.knee-lateral.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.knee-lateral.effects.rotation.desc` | (النص الحالي) | + « تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.ankle-ap.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.ankle-ap.effects.rotation.desc` | (النص الحالي) | + «في إسقاط AP الصحيح للكاحل يكون الجزء الإنسي من تجويف مفصل الكاحل مفتوحًا والجزء الوحشي مغلقًا والشظية السفلية متراكبة جزئيًّا بالظنبوب وعظم القَعْب (Bontrager ص.239). مع الدوران تنزاح أعمدة الكعبين وحواف سقف المفصل بمقادير مختلفة فتنفتح الحيّزات الشفافة بجانب عظم القَعْب أو تنغلق. يُحتسب مقدار الدوران فقط دون اتجاهه. المقدار المرسوم تقريب تعليمي من صورة مرجعية واحدة (التواء أفقي واحد سلس للساق والكاحل معًا؛ ولا يُرسم تراكب الشظية السفلية) وليس قياسًا للدرجات. تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| EN | `radiograph.ankle-lateral.effects.rotation.desc` | (النص الحالي) | + « A warp of one image cannot reconstruct hidden anatomy, so this does not show how real joints open or bones overlap at a different angle.» | G9 |
| AR | `radiograph.ankle-lateral.effects.rotation.desc` | (النص الحالي) | + «في الإسقاط الجانبي الصحيح للكاحل تكون الشظية السفلية فوق النصف الخلفي للظنبوب والكعب الوحشي ظاهرًا عبر الظنبوب السفلي وعظم القَعْب ومفصل الظنبوب والكاحل مفتوحًا بحيز منتظم (Bontrager ص.242). مع الدوران تُرسم الشظية وحد المفصل مرتين، نسخة للجهة البعيدة ونسخة للجهة القريبة، فتصبح الحدود مزدوجة. يُحتسب مقدار الدوران فقط دون اتجاهه. المقدار المرسوم تقريب تعليمي من صورة مرجعية واحدة (نوافذ كاملة تُرسم مرتين وليس حجبًا) وليس قياسًا للدرجات. تشويه صورة واحدة لا يعيد بناء التشريح المحجوب، لذا لا يبيّن كيف تنفتح المفاصل الحقيقية أو تتراكب العظام عند زاوية أخرى.» | G9 |
| AR | `radiograph.elbow-lateral.altFindings.rotation` | رسم حدود اللقيمتين ورأس الكعبرة والنتوء الإكليلي منفصلة (حدّ مزدوج) بسبب الدوران | رسم حدود اللقمتين ورأس الكعبرة والنتوء الإكليلي منفصلة (حدّ مزدوج) بسبب الدوران | AR (c) Condyle |
| AR | `radiograph.elbow-lateral.effects.rotation.title` | الدوران → حدود اللقيمتين غير متراكبة | الدوران ← حدود اللقمتين غير متراكبة | AR (c) Condyle + CLN-034 arrows |
| AR | `radiograph.elbow-lateral.altFindings.low-penetration` | انخفاض وضوح العظام الكثيفة (اللقيمتان والزند العلوي والزج) والتفاصيل العظمية | انخفاض وضوح العظام الكثيفة (اللقمتان والزند العلوي والناتئ الزُّجّي للزند) والتفاصيل العظمية | AR (c) Condyle / Olecranon |
| AR | `radiograph.elbow-lateral.effects.low-penetration.desc` | مع kVp المنخفض تُظهر العظام الكثيفة (اللقيمتان والزند العلوي والزج) تفاصيل داخلية أقل. وهذا منفصل عن تعريض الكاشف، وزيادة mAs لا تعالجه. التغيّر في الوضوح تقريب تعليمي وليس قياسًا. | مع kVp المنخفض تُظهر العظام الكثيفة (اللقمتان والزند العلوي والناتئ الزُّجّي للزند) تفاصيل داخلية أقل. وهذا منفصل عن تعريض الكاشف، وزيادة mAs لا تعالجه. التغيّر في الوضوح تقريب تعليمي وليس قياسًا. | AR (c) Condyle / Olecranon |
| AR | `radiograph.ankle-ap.altFindings.low-penetration` | انخفاض وضوح العظام الكثيفة (عظم الكاحل وعظم العقب) والتفاصيل العظمية | انخفاض وضوح العظام الكثيفة (عظم القَعْب وعظم العقب) والتفاصيل العظمية | AR (c) Talus |
| AR | `radiograph.ankle-ap.effects.low-penetration.desc` | مع kVp منخفض تُظهر العظام الكثيفة (عظم الكاحل وعظم العقب) تفاصيل داخلية أقل. وهذا منفصل عن تعريض الكاشف ولا يعالجه زيادة mAs. التغيّر في الوضوح تقريب تعليمي وليس قياسًا. | مع kVp منخفض تُظهر العظام الكثيفة (عظم القَعْب وعظم العقب) تفاصيل داخلية أقل. وهذا منفصل عن تعريض الكاشف ولا يعالجه زيادة mAs. التغيّر في الوضوح تقريب تعليمي وليس قياسًا. | AR (c) Talus |
| AR | `radiograph.ankle-lateral.altFindings.low-penetration` | انخفاض وضوح العظام الكثيفة (عظم الكاحل وعظم العقب) والتفاصيل العظمية | انخفاض وضوح العظام الكثيفة (عظم القَعْب وعظم العقب) والتفاصيل العظمية | AR (c) Talus |
| AR | `radiograph.ankle-lateral.effects.low-penetration.desc` | مع kVp منخفض تُظهر العظام الكثيفة (عظم الكاحل وعظم العقب) تفاصيل داخلية أقل. وهذا منفصل عن تعريض الكاشف ولا يعالجه زيادة mAs. التغيّر في الوضوح تقريب تعليمي وليس قياسًا. | مع kVp منخفض تُظهر العظام الكثيفة (عظم القَعْب وعظم العقب) تفاصيل داخلية أقل. وهذا منفصل عن تعريض الكاشف ولا يعالجه زيادة mAs. التغيّر في الوضوح تقريب تعليمي وليس قياسًا. | AR (c) Talus |
| AR | `positioningAp.cueCentre` | الشعاع المركزي عند T7، أي 8–10 سم تحت الشق الوداجي | الشعاع المركزي عند T7، أي 8–10 سم تحت الثَّلمة الوداجية | AR (c) Jugular notch |
| AR | `positioningShoulder.midline` | المفصل الكتفي العضدي | المفصل الحقاني العضدي | AR (c) Glenohumeral |
| AR | `radiograph.shoulder-grashey.effects.rotation.title` | إدارة الجسم خارج 35°–45° ← انغلاق الحيّز المفصلي | تدوير الجسم خارج 35°–45° ← انغلاق الحيّز المفصلي | AR (c) Body rotation (Grashey) |
| AR | `radiograph.shoulder-grashey.effects.rotation.desc` | خارج نطاق إدارة الجسم 35°–45° (Bontrager ص.196) يغلق تحويل الصورة الواحدة التعليمي الحيّز المفصلي بين رأس العضد والجوف الحقاني. لا يُعاد بناء حافتي الجوف أو التراكب الحقيقي للرأس أو جسم لوح الكتف أو وضع الذراع؛ والإشارة نفسها لأي جهة من النطاق. ليس إسقاطًا مقاسًا أو تشخيصيًا. | خارج نطاق تدوير الجسم 35°–45° (Bontrager ص.196) يغلق تحويل الصورة الواحدة التعليمي الحيّز المفصلي بين رأس العضد والجوف الحقاني. لا يُعاد بناء حافتي الجوف أو التراكب الحقيقي للرأس أو جسم لوح الكتف أو وضع الذراع؛ والإشارة نفسها لأي جهة من النطاق. ليس إسقاطًا مقاسًا أو تشخيصيًا. | AR (c) Body rotation (Grashey) |
| AR | `positioningShoulder.sideViewCaption` | منظر علوي: المريض واقفًا، وإدارة الجسم، ووضع الذراع المستقل | منظر علوي: المريض واقفًا، وتدوير الجسم، ووضع الذراع المستقل | AR (c) Body rotation (Grashey) |
| AR | `positioningShoulder.schematicNote` | رسم تعليمي تقريبي وليس تشريحًا دقيقًا. يغلق نموذج الصورة الواحدة نفسه الحيّز المفصلي في الإعداد والنتيجة عندما تقع إدارة الجسم خارج نطاق المصدر 35°–45°. يُرسم وضع الذراع في الإعداد فقط ولا يغيّر صورة الأشعة؛ ولا تُعاد حافتا الجوف ولا تراكب الرأس. المقياس والمنطقة والتسامحات افتراضات تعليمية. | رسم تعليمي تقريبي وليس تشريحًا دقيقًا. يغلق نموذج الصورة الواحدة نفسه الحيّز المفصلي في الإعداد والنتيجة عندما تقع تدوير الجسم خارج نطاق المصدر 35°–45°. يُرسم وضع الذراع في الإعداد فقط ولا يغيّر صورة الأشعة؛ ولا تُعاد حافتا الجوف ولا تراكب الرأس. المقياس والمنطقة والتسامحات افتراضات تعليمية. | AR (c) Body rotation (Grashey) |
| AR | `positioningShoulder.rotation` | إدارة الجسم نحو الكتف الأيمن | تدوير الجسم نحو الكتف المفحوص (الأيمن) | AR (c) Body rotation (Grashey) |
| AR | `sceneShoulder.turn` | إدارة الجسم {deg}° | تدوير الجسم {deg}° | AR (c) Body rotation (Grashey) |
| AR | `console.aec.detector` | الكاسيت | الكاشف | AR (c) Detector |
| AR | `radiograph.effects.centering.desc` | يتمركز المجال حول الشعاع المركزي، لذا يُزيح خطأ الشعاع المركزي المنطقة المعرَّضة عبر التشريح. أما التشريح نفسه فيبقى في موضعه على الكاسيت. | يتمركز المجال حول الشعاع المركزي، لذا يُزيح خطأ الشعاع المركزي المنطقة المعرَّضة عبر التشريح. أما التشريح نفسه فيبقى في موضعه على الكاشف. | AR (c) Detector |
| AR | `radiograph.effects.marker.desc` | تُرسم علامتك حيث وضعتها على الكاسيت ويقطعها المجال كأي محتوى آخر في الصورة. لا تُصحَّح نيابةً عنك. | تُرسم علامتك حيث وضعتها على الكاشف ويقطعها المجال كأي محتوى آخر في الصورة. لا تُصحَّح نيابةً عنك. | AR (c) Detector |
| AR | `patient.breathingOptions.deep-inspiration-hold` | {sex, select, female {«خذي شهيقًا عميقًا واحبسي نفسك.»} other {«خذ شهيقًا عميقًا واحبس نفسك.»}} | {sex, select, female {«خذي شهيقًا عميقًا واحبسي نَفَسَكِ.»} other {«خذ شهيقًا عميقًا واحبس نَفَسَك.»}} | AR (c) Breath |
| AR | `patient.breathingOptions.expiration-hold` | {sex, select, female {«أخرجي الزفير واحبسي نفسك.»} other {«أخرج الزفير واحبس نفسك.»}} | {sex, select, female {«أخرجي الزفير واحبسي نَفَسَكِ.»} other {«أخرج الزفير واحبس نَفَسَك.»}} | AR (c) Breath |
| AR | `assess.saving` | بانتظار إقرار الخادم… | بانتظار تأكيد الخادم… | AR (c) Server acknowledgement |
| AR | `assess.interrupted` | انقطع الاتصال أو توقفت الخدمة أثناء العملية. إقرار الخادم وحده يؤكد الإجابات. | انقطع الاتصال أو توقفت الخدمة أثناء العملية. تأكيد الخادم وحده يؤكد الإجابات. | AR (c) Server acknowledgement |
| AR | `assess.conflict` | غيّرت جلسة أخرى المحاولة. المصالحة تلغي التعديلات المحلية وتحمّل حالة الخادم. | غيّرت جلسة أخرى المحاولة. المزامنة تلغي التعديلات المحلية وتحمّل حالة الخادم. | AR (c) Reconcile |
| AR | `assess.reconcile` | مصالحة مع الخادم | مزامنة الحالة مع الخادم | AR (c) Reconcile |
| AR | `assess.unconfirmed` | العملية غير مؤكدة. صالِح الحالة قبل المتابعة. | العملية غير مؤكدة. زامِن الحالة مع الخادم قبل المتابعة. | AR (c) Reconcile |
| AR | `home.patientLine` | {sex, select, female {{sexLabel} عمرها {age} عامًا} other {{sexLabel} عمره {age} عامًا}} | {sex, select, female {{sexLabel} عمرها {age, plural, one {عام واحد} two {عامان} few {{age} أعوام} other {{age} عامًا}}} other {{sexLabel} عمره {age, plural, one {عام واحد} two {عامان} few {{age} أعوام} other {{age} عامًا}}}} | AR (c) Age |
| AR | `radiograph.ap.effects.rotation.title` | الدوران → عدم تناظر الصدر | الدوران ← عدم تناظر الصدر | CLN-034 arrows |
| AR | `radiograph.wrist-pa.effects.rotation.title` | الدوران → تباعد غير متساوٍ بين عظام مشط اليد وتراكب الكعبرة والزند | الدوران ← تباعد غير متساوٍ بين عظام مشط اليد وتراكب الكعبرة والزند | CLN-034 arrows |
| AR | `radiograph.wrist-pa.effects.low-penetration.title` | ضعف الاختراق → تفاصيل عظمية أقل | ضعف الاختراق ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.wrist-lateral.effects.rotation.title` | الدوران → عظام غير متراكبة | الدوران ← عظام غير متراكبة | CLN-034 arrows |
| AR | `radiograph.wrist-lateral.effects.low-penetration.title` | ضعف الاختراق → تفاصيل عظمية أقل | ضعف الاختراق ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.hand-pa.effects.rotation.title` | الدوران → تباعد غير متساوٍ بين عظام مشط اليد والأصابع | الدوران ← تباعد غير متساوٍ بين عظام مشط اليد والأصابع | CLN-034 arrows |
| AR | `radiograph.hand-pa.effects.low-penetration.title` | ضعف الاختراق → تفاصيل عظمية أقل | ضعف الاختراق ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.hand-lateral.effects.rotation.title` | الدوران → عظام غير متراكبة | الدوران ← عظام غير متراكبة | CLN-034 arrows |
| AR | `radiograph.hand-lateral.effects.low-penetration.title` | ضعف الاختراق → تفاصيل عظمية أقل | ضعف الاختراق ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.elbow-ap.effects.rotation.title` | الدوران → اللقيمتان ليستا في وضع جانبي ورأس الكعبرة والزند منفصلان أو متراكبان | الدوران ← اللقيمتان ليستا في وضع جانبي ورأس الكعبرة والزند منفصلان أو متراكبان | CLN-034 arrows |
| AR | `radiograph.elbow-ap.effects.low-penetration.title` | ضعف الاختراق → تفاصيل عظمية أقل | ضعف الاختراق ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.elbow-lateral.effects.low-penetration.title` | ضعف الاختراق → تفاصيل عظمية أقل | ضعف الاختراق ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.foot-ap.effects.rotation.title` | الدوران → مسافات غير متساوية بين مشط القدم 2–5 | الدوران ← مسافات غير متساوية بين مشط القدم 2–5 | CLN-034 arrows |
| AR | `radiograph.foot-ap.effects.low-penetration.title` | اختراق منخفض → تفاصيل عظمية أقل | اختراق منخفض ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.foot-oblique.effects.rotation.title` | زاوية الأخمص → عظام مشط القدم 3–5 أقرب أو أبعد بعضها عن بعض | زاوية الأخمص ← عظام مشط القدم 3–5 أقرب أو أبعد بعضها عن بعض | CLN-034 arrows |
| AR | `radiograph.foot-oblique.effects.low-penetration.title` | اختراق منخفض → تفاصيل عظمية أقل | اختراق منخفض ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.knee-ap.effects.rotation.title` | الدوران → لقمتان غير متناظرتين ورأس الشظية مغطى أكثر أو أقل | الدوران ← لقمتان غير متناظرتين ورأس الشظية مغطى أكثر أو أقل | CLN-034 arrows |
| AR | `radiograph.knee-ap.effects.low-penetration.title` | اختراق منخفض → تفاصيل عظمية أقل | اختراق منخفض ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.knee-lateral.effects.rotation.title` | الدوران → حدود اللقمتين غير متراكبة | الدوران ← حدود اللقمتين غير متراكبة | CLN-034 arrows |
| AR | `radiograph.knee-lateral.effects.low-penetration.title` | اختراق منخفض → تفاصيل عظمية أقل | اختراق منخفض ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.ankle-ap.effects.rotation.title` | الدوران → تتغير حيّزات تجويف المفصل | الدوران ← تتغير حيّزات تجويف المفصل | CLN-034 arrows |
| AR | `radiograph.ankle-ap.effects.low-penetration.title` | اختراق منخفض → تفاصيل عظمية أقل | اختراق منخفض ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `radiograph.ankle-lateral.effects.rotation.title` | الدوران → تُزدوج حدود الشظية والمفصل | الدوران ← تُزدوج حدود الشظية والمفصل | CLN-034 arrows |
| AR | `radiograph.ankle-lateral.effects.low-penetration.title` | اختراق منخفض → تفاصيل عظمية أقل | اختراق منخفض ← تفاصيل عظمية أقل | CLN-034 arrows |
| AR | `positioning.alt` | رسم تفاعلي للكاسيت مع المريض والمجال المحدَّد وهدف الشعاع المركزي وعلامة الجانب. | رسم تفاعلي للكاشف مع المريض والمجال المحدَّد وهدف الشعاع المركزي وعلامة الجانب. | AR (c) Detector |
| AR | `console.aec.diagramAlt` | مخطط تعليمي محايد للكاسيت يبيّن الحقلين الرئويين للمريض والمجال المحدَّد وثلاث حجرات استشعار AEC. | مخطط تعليمي محايد للكاشف يبيّن الحقلين الرئويين للمريض والمجال المحدَّد وثلاث حجرات استشعار AEC. | AR (c) Detector |
| EN | `result.criticalNote` | A critical finding forces “Below the educational pass mark” whatever the numeric score. The numeric score ({total}) and the category weights are unchanged. | A critical finding forces “Below the educational pass mark” whatever the numeric score. It is an important error to correct in training, not a clinical decision about the image. The numeric score ({total}) and the category weights are unchanged. | T (b) E |
| AR | `result.criticalNote` | أي ملاحظة حرجة تجعل النتيجة «دون درجة النجاح التعليمية» مهما كانت الدرجة الرقمية. الدرجة الرقمية ({total}) وأوزان الفئات لا تتغير. | أي ملاحظة حرجة تجعل النتيجة «دون درجة النجاح التعليمية» مهما كانت الدرجة الرقمية. وهي خطأ مهم يجب تصحيحه في التدريب وليست قرارًا سريريًا بشأن الصورة. الدرجة الرقمية ({total}) وأوزان الفئات لا تتغير. | T (b) E |

## ب. نصوص بيانات الفحوص والحالات (`src/data/...`)

النص المستبدل بالضبط (قد يظهر في أكثر من فحص عبر الباني المشترك؛ العمود «×» عدد مرات ورود النص في الملف).

| الملف | اللغة | قبل | بعد | × | البند |
|---|---|---|---|---|---|
| `exams/xray/chest-pa-erect.ts` | EN |  In practice such an image would normally be repeated or corrected. |  This is an educational result, not a clinical decision about the image. | 2 | G8 / S7 (wording only) |
| `exams/xray/chest-pa-erect.ts` | EN |  In practice such an image would normally be repeated. |  This is an educational result, not a clinical decision about the image. | 2 | G8 / S7 (wording only) |
| `exams/xray/chest-pa-erect.ts` | AR |  وفي الممارسة العملية تُعاد الصورة أو تُصحَّح عادةً في مثل هذه الحالة. |  وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة. | 2 | G8 / S7 (wording only) |
| `exams/xray/chest-pa-erect.ts` | AR |  وفي الممارسة العملية تُعاد الصورة عادةً في مثل هذه الحالة. |  وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة. | 2 | G8 / S7 (wording only) |
| `exams/xray/chest-ap-supine.ts` | EN |  In practice such an image would normally be repeated. |  This is an educational result, not a clinical decision about the image. | 1 | G8 / S7 (wording only) |
| `exams/xray/chest-ap-supine.ts` | AR |  وفي الممارسة تُعاد الصورة عادةً. |  وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة. | 1 | G8 / S7 (wording only) |
| `exams/xray/chest-lateral-erect.ts` | EN |  In practice such an image would normally be repeated. |  This is an educational result, not a clinical decision about the image. | 1 | G8 / S7 (wording only) |
| `exams/xray/chest-lateral-erect.ts` | AR |  وفي الممارسة تُعاد الصورة عادةً. |  وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة. | 1 | G8 / S7 (wording only) |
| `exams/xray/chest-lateral-erect.ts` | EN | Such a lateral would normally be repeated, so the attempt is below the pass mark whatever the numeric score. | In this simulator that is a critical error to correct in training, so the attempt is below the pass mark whatever the numeric score. | 1 | G8 / S7 (wording only) |
| `exams/xray/chest-lateral-erect.ts` | AR | تُعاد الصورة الجانبية عادةً، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. | وهذا في هذا المحاكي خطأ مهم يجب تصحيحه في التدريب، لذا تقع المحاولة دون درجة النجاح مهما كانت الدرجة الرقمية. | 1 | G8 / S7 (wording only) |
| `exams/xray/chest-lateral-erect.ts` | EN |  and the lateral is repeated. |  and can hide lung tissue. | 1 | G8 / S7 (wording only) |
| `exams/xray/chest-lateral-erect.ts` | EN | Raise the arms above the head; a lateral like this is normally repeated. | Raise the arms above the head. This setup is not suitable for a lateral; its effect is not drawn in this image. | 1 | G8 + S12-11 (not drawn) |
| `exams/xray/chest-lateral-erect.ts` | AR | ارفع الذراعين فوق الرأس؛ وتُعاد مثل هذه الصورة الجانبية عادةً. | ارفع الذراعين فوق الرأس. هذا إعداد غير مناسب للصورة الجانبية؛ وأثره غير ممثَّل في هذه الصورة. | 1 | G8 + S12-11 (not drawn) |
| `exams/xray/chest-lateral-erect.ts` | EN | A clearly rotated lateral is usually repeated. | A clearly rotated lateral is a positioning error to correct in training. | 1 | G8 / S7 (wording only) |
| `exams/xray/chest-lateral-erect.ts` | AR | وتُعاد الصورة الجانبية المائلة بوضوح عادةً. | والصورة الجانبية المائلة بوضوح خطأ في الوضعية يجب تصحيحه في التدريب. | 1 | G8 / S7 (wording only) |
| `exams/xray/upper-limb-common.ts` | EN |  In practice such an image would normally be repeated. |  This is an educational result, not a clinical decision about the image. | 1 | G8 / S7 (wording only) |
| `exams/xray/upper-limb-common.ts` | AR |  وفي الممارسة تُعاد الصورة عادةً. |  وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة. | 1 | G8 / S7 (wording only) |
| `exams/xray/upper-limb-common.ts` | EN | , because an unmarked image is normally repeated.` | . A missing marker is a critical error to correct in training; this is an educational result, not a clinical decision about the image.` | 1 | G8 / S7 (wording only) |
| `exams/xray/upper-limb-common.ts` | AR | ، لأن الصورة بلا علامة تُعاد عادةً.` | . غياب العلامة خطأ مهم يجب تصحيحه في التدريب، وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.` | 1 | G8 / S7 (wording only) |
| `exams/xray/lower-limb-common.ts` | EN |  In practice such an image would normally be repeated. |  This is an educational result, not a clinical decision about the image. | 1 | G8 / S7 (wording only) |
| `exams/xray/lower-limb-common.ts` | AR |  وفي الممارسة تُعاد الصورة عادةً. |  وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة. | 1 | G8 / S7 (wording only) |
| `exams/xray/lower-limb-common.ts` | EN | , because an unmarked image is normally repeated.` | . A missing marker is a critical error to correct in training; this is an educational result, not a clinical decision about the image.` | 1 | G8 / S7 (wording only) |
| `exams/xray/lower-limb-common.ts` | AR | ، لأن الصورة بلا علامة تُعاد عادةً.` | . غياب العلامة خطأ مهم يجب تصحيحه في التدريب، وهذه نتيجة تعليمية وليست قرارًا سريريًا بشأن الصورة.` | 1 | G8 / S7 (wording only) |
| `src/features/evaluation/critical.ts` |  | A critical finding is one that would get a radiograph rejected / repeated in practice (concept: a COMMON QUALITY | A critical finding is an important error that must be corrected in training (concept: a COMMON QUALITY | 1 | G8 / S7 (wording only) (comment) |
| `src/domain/case.ts` |  | such an image would be rejected / repeated in practice | such an image would be an important quality error | 1 | G8 / S7 (wording only) (comment) |
| `exams/xray/chest-pa-erect.ts` | EN | kVp is inside this demo protocol's target band. | kVp is inside this case's protocol target band. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | kVp is below this demo protocol's target band. | kVp is below this case's protocol target band. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | kVp is above this demo protocol's target band. | kVp is above this case's protocol target band. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | The exact band is a provisional demo target, not a universal value. | The exact band is this case's teaching target, not a universal value. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | so the band is a provisional demo target rather than a universal limit. | so the band is this case's teaching target rather than a universal limit. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | kVp is outside the demo protocol's range. | kVp is outside this case's protocol range. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | قيمة kVp ضمن النطاق المستهدف في هذا البروتوكول التجريبي. | قيمة kVp ضمن النطاق المستهدف في بروتوكول هذه الحالة. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | النطاق الدقيق هدف تجريبي مؤقت وليس قيمة عالمية. | النطاق الدقيق هدف تعليمي لهذه الحالة وليس قيمة عالمية. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | قيمة kVp أقل من النطاق المستهدف في هذا البروتوكول التجريبي. | قيمة kVp أقل من النطاق المستهدف في بروتوكول هذه الحالة. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | قيمة kVp أعلى من النطاق المستهدف في هذا البروتوكول التجريبي. | قيمة kVp أعلى من النطاق المستهدف في بروتوكول هذه الحالة. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | لذا فالنطاق هدف تجريبي مؤقت وليس حدًا عالميًا. | لذا فالنطاق هدف تعليمي لهذه الحالة وليس حدًا عالميًا. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | قيمة kVp خارج نطاق البروتوكول التجريبي. | قيمة kVp خارج نطاق بروتوكول هذه الحالة. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | In this demo protocol the lung-field chambers are used for chest; | In this case's protocol the lung-field chambers are used for chest; | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | في هذا البروتوكول التجريبي تُستخدم حجرات الحقلين الرئويين للصدر؛ | في بروتوكول هذه الحالة تُستخدم حجرات الحقلين الرئويين للصدر؛ | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | SID is within the demo target band. | SID is within this case's target band. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | قيمة SID ضمن النطاق التجريبي المستهدف. | قيمة SID ضمن النطاق المستهدف لهذه الحالة. | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | SID is shorter than the demo target ( | SID is shorter than this case's target ( | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | قيمة SID أقصر من النطاق التجريبي ( | قيمة SID أقصر من النطاق المستهدف لهذه الحالة ( | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | EN | SID is longer than the demo target; | SID is longer than this case's target; | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | قيمة SID أطول من النطاق التجريبي؛ | قيمة SID أطول من النطاق المستهدف لهذه الحالة؛ | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` |  | fail: { en: "SID is outside the target band.", ar: "قيمة SID خارج النطاق المستهدف." } | fail: { en: "SID is outside this case's target band.", ar: "قيمة SID خارج النطاق المستهدف لهذه الحالة." } | 1 | G1 |
| `exams/xray/chest-pa-erect.ts` | AR | الكاسيت | الكاشف | 12 | AR (c) Detector |
| `exams/xray/chest-lateral-erect.ts` | EN | kVp is inside the demo target band (110–125 kV). | kVp is inside this case's target band (110–125 kV). | 1 | G1 |
| `exams/xray/chest-lateral-erect.ts` | AR | قيمة kVp ضمن النطاق التجريبي (110–125 kV). | قيمة kVp ضمن النطاق المستهدف لهذه الحالة (110–125 kV). | 1 | G1 |
| `exams/xray/chest-lateral-erect.ts` |  | fail: { en: "kVp is outside the demo protocol's range.", ar: "قيمة kVp خارج نطاق البروتوكول التجريبي." } | fail: { en: "kVp is outside this case's protocol range.", ar: "قيمة kVp خارج نطاق بروتوكول هذه الحالة." } | 1 | G1 |
| `exams/xray/chest-lateral-erect.ts` | EN | this demo protocol uses the central chamber. | this case's protocol uses the central chamber. | 1 | G1 |
| `exams/xray/chest-lateral-erect.ts` | AR | يستخدم هذا البروتوكول التجريبي الحجرة المركزية. | يستخدم بروتوكول هذه الحالة الحجرة المركزية. | 1 | G1 |
| `exams/xray/chest-lateral-erect.ts` |  | fail: { en: "SID is outside the target band.", ar: "قيمة SID خارج النطاق المستهدف." } | fail: { en: "SID is outside this case's target band.", ar: "قيمة SID خارج النطاق المستهدف لهذه الحالة." } | 1 | G1 |
| `exams/xray/chest-ap-supine.ts` | EN | kVp is inside the demo target band (110–125 kV), | kVp is inside this case's target band (110–125 kV), | 1 | G1 |
| `exams/xray/chest-ap-supine.ts` | AR | قيمة kVp ضمن النطاق التجريبي (110–125 kV)، | قيمة kVp ضمن النطاق المستهدف لهذه الحالة (110–125 kV)، | 1 | G1 |
| `exams/xray/chest-ap-supine.ts` |  | fail: { en: "kVp is outside the demo protocol's range.", ar: "قيمة kVp خارج نطاق البروتوكول التجريبي." } | fail: { en: "kVp is outside this case's protocol range.", ar: "قيمة kVp خارج نطاق بروتوكول هذه الحالة." } | 1 | G1 |
| `exams/xray/chest-ap-supine.ts` |  | fail: { en: "SID is outside the target band (below about 102 cm or above 200 cm).", ar: "قيمة SID خارج النطاق المستهدف (أقل من نحو 102 سم أو أكثر من 200 سم)." } | fail: { en: "SID is outside this case's target band (below about 102 cm or above 200 cm).", ar: "قيمة SID خارج النطاق المستهدف لهذه الحالة (أقل من نحو 102 سم أو أكثر من 200 سم)." } | 1 | G1 |
| `exams/xray/chest-ap-supine.ts` | AR | الشق الوداجي | الثَّلمة الوداجية | 1 | AR (c) Jugular notch |
| `exams/xray/chest-ap-technique.ts` | AR | الكاسيت | الكاشف | 1 | AR (c) Detector |
| `exams/xray/chest-pa-technique.ts` | AR | الكاسيت | الكاشف | 2 | AR (c) Detector |
| `exams/xray/upper-limb-common.ts` | EN | kVp is outside this simulator's range for the | kVp is outside this case's protocol range for the | 1 | G1 |
| `exams/xray/upper-limb-common.ts` | EN | SID is outside this simulator's range for the | SID is outside this case's protocol range for the | 1 | G1 |
| `exams/xray/lower-limb-common.ts` | EN | kVp is outside this simulator's range for the | kVp is outside this case's protocol range for the | 1 | G1 |
| `exams/xray/lower-limb-common.ts` | EN | SID is outside this simulator's range for the | SID is outside this case's protocol range for the | 1 | G1 |
| `exams/xray/upper-limb-common.ts` | AR | قيمة kVp خارج نطاق المحاكي ${f.forPart} | قيمة kVp خارج نطاق بروتوكول هذه الحالة ${f.forPart} | 1 | G1 |
| `exams/xray/upper-limb-common.ts` | AR | قيمة SID خارج نطاق المحاكي ${f.forPart} | قيمة SID خارج نطاق بروتوكول هذه الحالة ${f.forPart} | 1 | G1 |
| `exams/xray/lower-limb-common.ts` | AR | قيمة kVp خارج نطاق المحاكي لـ${p.part.ar} | قيمة kVp خارج نطاق بروتوكول هذه الحالة لـ${p.part.ar} | 1 | G1 |
| `exams/xray/lower-limb-common.ts` | AR | قيمة SID خارج نطاق المحاكي لـ${p.part.ar} | قيمة SID خارج نطاق بروتوكول هذه الحالة لـ${p.part.ar} | 1 | G1 |
| `exams/xray/chest-pa-technique.ts` | EN | Demo protocol — average adult, generic DR system (provisional) | Teaching protocol — average adult, generic DR system | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | AR | بروتوكول تجريبي — بالغ متوسط، نظام DR عام (مؤقت) | بروتوكول تعليمي — بالغ متوسط، نظام DR عام | 1 | A (D1) / D5 |
| `exams/xray/chest-lateral-technique.ts` | EN | Demo protocol — average adult lateral, generic DR system (provisional) | Teaching protocol — average adult lateral, generic DR system | 1 | A (D1) / D5 |
| `exams/xray/chest-lateral-technique.ts` | AR | بروتوكول تجريبي — صورة جانبية لبالغ متوسط، نظام DR عام (مؤقت) | بروتوكول تعليمي — صورة جانبية لبالغ متوسط، نظام DR عام | 1 | A (D1) / D5 |
| `exams/xray/chest-ap-technique.ts` | EN | Demo protocol — average adult AP supine, generic DR system (provisional) | Teaching protocol — average adult AP supine, generic DR system | 1 | A (D1) / D5 |
| `exams/xray/chest-ap-technique.ts` | AR | بروتوكول تجريبي — بالغ متوسط AP مستلقيًا، نظام DR عام (مؤقت) | بروتوكول تعليمي — بالغ متوسط AP مستلقيًا، نظام DR عام | 1 | A (D1) / D5 |
| `exams/xray/lower-limb-technique.ts` | EN | Demo protocol — adult ${c.part.en}, generic DR system, manual technique (provisional) | Teaching protocol — adult ${c.part.en}, generic DR system, manual technique | 1 | A (D1) / D5 |
| `exams/xray/lower-limb-technique.ts` | AR | بروتوكول تجريبي — ${c.part.ar} لدى بالغ، نظام DR عام، تقنية يدوية (مؤقت) | بروتوكول تعليمي — ${c.part.ar} لدى بالغ، نظام DR عام، تقنية يدوية | 1 | A (D1) / D5 |
| `exams/xray/upper-limb-technique.ts` | EN | Demo protocol — adult ${f.en} ${p.labelName}, generic DR system, manual technique (provisional) | Teaching protocol — adult ${f.en} ${p.labelName}, generic DR system, manual technique | 1 | A (D1) / D5 |
| `exams/xray/upper-limb-technique.ts` | AR | بروتوكول تجريبي — ${f.ar} بالغ ${p.labelNameAr}، نظام DR عام، تقنية يدوية (مؤقت) | بروتوكول تعليمي — ${f.ar} بالغ ${p.labelNameAr}، نظام DR عام، تقنية يدوية | 1 | A (D1) / D5 |
| `exams/xray/shoulder-technique.ts` | EN | Demo shoulder Grashey protocol — manual DR with grid (provisional) | Teaching shoulder Grashey protocol — manual DR with grid | 1 | A (D1) / D5 |
| `exams/xray/shoulder-technique.ts` | AR | بروتوكول كتف غراشي تجريبي — DR يدوي مع شبكة (مؤقت) | بروتوكول كتف غراشي تعليمي — DR يدوي مع شبكة | 1 | A (D1) / D5 |
| `exams/xray/pelvis-technique.ts` | EN | Demo pelvis AP protocol — manual DR with grid (provisional) | Teaching pelvis AP protocol — manual DR with grid | 1 | A (D1) / D5 |
| `exams/xray/pelvis-technique.ts` | AR | بروتوكول حوض AP تجريبي — DR يدوي مع شبكة (مؤقت) | بروتوكول حوض AP تعليمي — DR يدوي مع شبكة | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | EN | Demo kVp target band 110–125 | Case kVp target band 110–125 | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | AR | نطاق kVp المستهدف التجريبي 110–125 | نطاق kVp المستهدف لهذه الحالة 110–125 | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | EN | Full credit in this demo protocol only. | Full credit in this case's protocol only. | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | AR | درجة كاملة في هذا البروتوكول التجريبي فقط. | درجة كاملة في بروتوكول هذه الحالة فقط. | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | EN | Demo scoring tolerances only; | Teaching scoring tolerances only; | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | AR | حدود تقييم تجريبية فقط؛ | حدود تقييم تعليمية فقط؛ | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | EN | the lung-field preference is this demo's choice. | the lung-field preference is this case's choice. | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | AR | تفضيل حقلي الرئتين هو اختيار هذا العرض. | تفضيل حقلي الرئتين هو اختيار هذه الحالة. | 1 | A (D1) / D5 |
| `exams/xray/chest-pa-technique.ts` | EN | The physics is validated; how it becomes | The physics is source-based; how it becomes | 1 | A (D1) / D5 (D5) |
| `exams/xray/chest-pa-technique.ts` | AR | الفيزياء مثبتة؛ أما | الفيزياء مستندة إلى مصدر؛ أما | 1 | A (D1) / D5 (D5) |
| `cases/upper-limb-case.ts` | EN | (reference attenuation; provisional) | (reference attenuation) | 3 | A (D1) / D5 |
| `cases/upper-limb-case.ts` | AR | (توهين مرجعي؛ مؤقت) | (توهين مرجعي) | 3 | A (D1) / D5 |
| `cases/lower-limb-case.ts` | EN | (reference attenuation; provisional) | (reference attenuation) | 6 | A (D1) / D5 |
| `cases/lower-limb-case.ts` | AR | (توهين مرجعي؛ مؤقت) | (توهين مرجعي) | 6 | A (D1) / D5 |
| `cases/chest-lateral-erect.ts` | EN | lateral path about 2× the PA exposure; provisional) | lateral path about 2× the PA exposure; teaching value) | 1 | A (D1) / D5 |
| `cases/chest-lateral-erect.ts` | AR | مسار جانبي نحو ضعف تعريض PA؛ مؤقت) | مسار جانبي نحو ضعف تعريض PA؛ قيمة تعليمية) | 1 | A (D1) / D5 |
| `cases/chest-ap-supine.ts` | EN | AP path taken as the PA reference; provisional) | AP path taken as the PA reference; teaching value) | 1 | A (D1) / D5 |
| `cases/chest-ap-supine.ts` | AR | مسار AP كمرجع PA؛ مؤقت) | مسار AP كمرجع PA؛ قيمة تعليمية) | 1 | A (D1) / D5 |
| `exams/xray/upper-limb-common.ts` | AR | قد يُقطع الطرف السفلي للكعبرة والزند. | قد تُقطع النهايتان البعيدتان للكعبرة والزند. | 1 | AR (c) Distal radius and ulna |
| `exams/xray/upper-limb-common.ts` | AR | تقطع الطرف السفلي للكعبرة والزند. | تقطع النهايتين البعيدتين للكعبرة والزند. | 1 | AR (c) Distal radius and ulna |
| `exams/xray/upper-limb-common.ts` | AR | "الطرف السفلي للكعبرة والزند وعظام الرسغ وعظام مشط اليد الظاهرة" | "النهايتان البعيدتان للكعبرة والزند وعظام الرسغ وعظام مشط اليد الظاهرة" | 1 | AR (c) Distal radius and ulna |
| `exams/xray/upper-limb-common.ts` | AR | "الطرف السفلي للكعبرة والزند وعظام الرسغ وعظام مشط اليد ضمن الصورة | "النهايتان البعيدتان للكعبرة والزند وعظام الرسغ وعظام مشط اليد ضمن الصورة | 1 | AR (c) Distal radius and ulna |
| `exams/xray/upper-limb-common.ts` | AR | فلم يعد الطرفان السفليان للكعبرة والزند منفصلين | فلم تعد النهايتان البعيدتان للكعبرة والزند منفصلتين | 1 | AR (c) Distal radius and ulna |
| `exams/xray/upper-limb-common.ts` | AR | ولم يعد الطرفان السفليان للكعبرة والزند متراكبين | ولم تعد النهايتان البعيدتان للكعبرة والزند متراكبتين | 1 | AR (c) Distal radius and ulna |
| `exams/xray/upper-limb-common.ts` | AR | فوق الطرف السفلي للكعبرة | فوق النهاية البعيدة للكعبرة | 3 | AR (c) Distal radius and ulna |
| `exams/xray/upper-limb-common.ts` | AR | قد يُقطع الرسغ والساعد السفلي. حرّك الهدف للأسفل نحو المفاصل السلامية المشطية. | قد يُقطع الرسغ والجزء البعيد من الساعد. حرّك الهدف للأسفل نحو المفاصل المشطية السلامية (MCP). | 1 | AR (c) Distal forearm / MCP |
| `exams/xray/upper-limb-common.ts` | AR | تقطع الرسغ أو الساعد السفلي (يطلب Bontrager نحو 2.5 سم من الساعد السفلي). | تقطع الرسغ أو الجزء البعيد من الساعد (يطلب Bontrager نحو 2.5 سم من الجزء البعيد من الساعد). | 1 | AR (c) Distal forearm |
| `exams/xray/upper-limb-common.ts` | AR | اليد كاملة والرسغ مع الساعد السفلي المطلوب | اليد كاملة والرسغ مع الجزء البعيد المطلوب من الساعد | 1 | AR (c) Distal forearm |
| `exams/xray/upper-limb-common.ts` | AR | اليد كاملة والرسغ مع نحو 2.5 سم من الساعد السفلي ضمن الصورة | اليد كاملة والرسغ مع نحو 2.5 سم من الجزء البعيد من الساعد ضمن الصورة | 1 | AR (c) Distal forearm |
| `exams/xray/upper-limb-common.ts` | AR | المفصل السلامي المشطي الثالث | المفصل المشطي السلامي (MCP) الثالث | 2 | AR (c) MCP |
| `exams/xray/upper-limb-common.ts` | AR | حدود اللقيمتين | حدود اللقمتين | 2 | AR (c) Condyle |
| `exams/xray/upper-limb-common.ts` | AR | تقطع المرفق (الزج) أي رأس الزند. | تقطع الناتئ الزُّجّي للزند (نتوء المرفق). | 1 | AR (c) Olecranon |
| `exams/xray/upper-limb-common.ts` | AR | يقطع خلف المرفق (الزج). | يقطع خلف المرفق (الناتئ الزُّجّي للزند). | 1 | AR (c) Olecranon |
| `exams/xray/upper-limb-common.ts` | AR | قد يُقطع الزج (رأس المرفق). | قد يُقطع الناتئ الزُّجّي للزند (نتوء المرفق). | 1 | AR (c) Olecranon |
| `exams/xray/upper-limb-common.ts` | AR | قد يُقطع الزج. | قد يُقطع الناتئ الزُّجّي للزند. | 1 | AR (c) Olecranon |
| `exams/xray/upper-limb-common.ts` | AR | بما فيه الزج | بما فيه الناتئ الزُّجّي للزند | 2 | AR (c) Olecranon |
| `exams/xray/upper-limb-common.ts` | AR |     // Kept as written (the Arabic says «لليد», "for the hand"): a text correction belongs to the RAD-068 text batch, not to this refactor.     sidForPart: "لليد",     moving: T("arm" |     sidForPart: "للمرفق",     moving: T("arm" | 1 | AR (c) elbow SID text (found in part 1) |
| `cases/upper-limb-case.ts` | AR | ويده مائلة قليلًا | ويده ملتفة قليلًا | 2 | AR (c) Arrived turned |
| `cases/upper-limb-case.ts` | AR | وساعده مائل قليلًا | وساعده ملتف قليلًا | 1 | AR (c) Arrived turned |
| `cases/lower-limb-case.ts` | AR | مائلة قليلًا | ملتفة قليلًا | 5 | AR (c) Arrived turned |
| `cases/chest-pa-erect.ts` | AR | قادرة على المشي والوقوف واتباع تعليمات التنفس | قادرة على الوقوف واتباع تعليمات التنفس | 1 | AR (c) Able to stand |
| `cases/chest-lateral-erect.ts` | AR | قادرة على المشي والوقوف ورفع الذراعين واتباع تعليمات التنفس | قادرة على الوقوف ورفع الذراعين واتباع تعليمات التنفس | 1 | AR (c) Able to stand |
| `exams/xray/lower-limb-ankle-texts.ts` | AR | عظم الكاحل | عظم القَعْب | 11 | AR (c) Talus |
| `exams/xray/lower-limb-ankle-texts.ts` | AR | النردي | المكعبي | 2 | AR (c) Cuboid |
| `exams/xray/lower-limb-common.ts` | AR | الزورقي والنردي | الزورقي والمكعبي | 2 | AR (c) Cuboid |
| `exams/xray/shoulder-grashey-erect.ts` | AR | المفصل الكتفي العضدي | المفصل الحقاني العضدي | 4 | AR (c) Glenohumeral |
| `exams/xray/shoulder-grashey-erect.ts` | AR | ميل الجسم نحو الكتف الأيمن | تدوير الجسم نحو الكتف المفحوص (الأيمن) | 1 | AR (c) Body rotation (Grashey) |
| `exams/xray/shoulder-grashey-erect.ts` | AR | إدارة الجسم | تدوير الجسم | 2 | AR (c) Body rotation (Grashey) |
| `cases/lower-limb-radiographs.ts` | EN | a normal adult right knee, | an adult right knee (the source description mentions no trauma), | 2 | T (b) S14.4-R2 / S14.5-R3, R8 |
| `cases/lower-limb-radiographs.ts` | EN | a normal adult right foot, | an adult right foot (the source description mentions no trauma), | 2 | T (b) S14.4-R2 / S14.5-R3, R8 |
| `cases/lower-limb-radiographs.ts` | EN | a normal adult ankle, | an adult ankle (the source description mentions no trauma), | 2 | T (b) S14.4-R2 / S14.5-R3, R8 |
| `cases/lower-limb-radiographs.ts` | AR | كاحل طبيعي لشخص بالغ | كاحل لشخص بالغ (لا تظهر إصابة في وصف المصدر) | 2 | T (b) S14.4-R2 / S14.5-R3, R8 |
| `cases/lower-limb-radiographs.ts` | AR | ركبة يمنى طبيعية لشخص بالغ | ركبة يمنى لشخص بالغ (لا تظهر إصابة في وصف المصدر) | 2 | T (b) S14.4-R2 / S14.5-R3, R8 |
| `cases/lower-limb-radiographs.ts` | AR | قدم يمنى طبيعية لشخص بالغ | قدم يمنى لشخص بالغ (لا تظهر إصابة في وصف المصدر) | 2 | T (b) S14.4-R2 / S14.5-R3, R8 |
