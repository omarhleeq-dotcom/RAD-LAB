# Pelvis AP — التنفيذ بعد مراجعة الفحوص السابقة، 2026-10-15

الأساس `f531a660c3a184677bb82807e6e06158a3a48857` (دمج PR #33)، الفرع `feat/pelvis-ap`. شجرة البداية نظيفة. هذه المرحلة إضافة فحص واحد، دون دمج أو نشر من الوكيل. commit التنفيذ `de582c2bb4bee314815e8038670dd63f81fa2058`، [Draft PR #34](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/34) مفتوح وغير مدموج؛ auto-merge لم يُفعّل.

**تحديث بعد المرحلة:** أعلن المالك مراجعة الفرع والتأكد منه ودمجه. تحقق GitHub وGit من دمج PR #34 في 2026-10-15T07:43:19Z، commit `8ba28769a9b870cef9f7cab835af8cafd1b4083a`. أصبح RAD-030 منجزًا؛ النشر والمراجعة الطبية غير مثبتين. وصف Draft أدناه سجل تاريخي لوقت التنفيذ. تحديث التسليم توثيقي فقط؛ لا تغييرات تطبيق أو إعادة QA للتطبيق.

## 1. الانحرافات

- طلب المالك مراجعة الفحوص السابقة واتباع نهجها قبل الحوض. قورنت صور الأطراف الـ12 الفعلية عبر renderer عند المرجع و+10°؛ جميعها تعتمد صورة واحدة لكل إسقاط مع مؤثر وقت العرض. نجح 89 اختبار دوران موجودًا. المقترح الأول بإبقاء صورة الحوض ثابتة استُبدل بنموذج حوض على `limb-warp` الموجود (S-PELVIS-1-1).
- تعثّر أول فحص شامل بسبب إدخال الفحص الجديد أول القائمة وافتراض بعض الاختبارات أن CASES[0] هو Chest PA؛ صُحح التسجيل بإضافته **آخر** القائمة. كما كشفت حراسة النص العام تسرب مراجع القرارات ذات التسمية الجديدة، فوضعت إشاراتها خلف مسارات docs التي يزيلها المنسق القائم. **لم تُعدّل توقعات الاختبارات لإخفاء الفشل.**
- كشف فحص التسميات تداخلًا بسبب قياسات الخط وعنوان الكاشف قرب المقبض السفلي. صُحح في مشهد الحوض فقط: wrapper محلي يحدد خط SVG، واستعمال محور التسميات الاختياري الموجود. لا تغيير لخط أو هوامش أي مشهد سابق.
- الاختبار القديم الوحيد المعدل: `src/features/exam/generalisation.test.ts`، إضافة اسم المشهد إلى قائمة التسجيل فقط (الاستثناء المسموح بالوصفة/S-STD-2). تجدد ملف hash **الجديد الخاص بالحوض فقط** أثناء إصلاح المشهد؛ لا hash قديم تغير.

## 2. النطاق المنجز والمستبعد

المنجز: فحص `pelvis-ap-supine` واحد للبالغ غير المصاب برض، مع بيانات exam/technique/geometry/case/radiograph؛ نموذج حوض ورسم detector/side view؛ نسخة public من A-035؛ تحكم مستقل بوضع الطرفين وحبس النفس؛ تقنية يدوية وسياق grid؛ علامة تشريحية؛ EN/AR؛ اختبارات الفحص/النموذج/المشهد، حارس جديد، audit وlabel states والوثائق.

الميزانية بقيت ضمن هذه العائلات والتسجيلات المعلنة: exam/case/projection/body-part/scene registries، model-id/limb hook/tuning، EN/AR، إضافة قائمة المشهد للاختبار، والوثائق المطلوبة. أضيف wrapper محلي للرسم لحل قياسات التسميات؛ لا توسعة لواجهة عامة. لا فحص آخر حوكي أو عدل؛ تشغيل الصور السابقة كان مراجعة فقط.

المستبعد: بقية إسقاطات الحوض/الورك، الرضوض والتشخيص، محاكاة تشريح مخفي، AEC جديد، settings أو pixel algorithm جديد، إعادة هيكلة عامة، تعديل صور/بيانات/حراس قديمة، إصلاح خلل ResultPanel العربي السابق، النشر والدمج.

## 3. نتيجة كل مهمة

- اكتمل مرجع الحوض وNeeds ودمجهما قبل الكود؛ ص271–272/279 من Bontrager 9. تسجل S-PELVIS-1-1…5 اختيارات التنفيذ قبل البيانات. القيم غير المنصوص عليها في المصدر اختيارات تعليمية معلنة، وليست قياسات أو توصيات سريرية.
- البيانات مستقلة، لا صفحة مخصصة: `src/data/exams/xray/pelvis-ap-supine.ts` و`pelvis-technique.ts` و`pelvis-geometry.ts`؛ `src/data/cases/pelvis-ap-supine.ts` و`pelvis-ap-radiograph.ts`. المساران EN/AR عبر routing/catalog القائمين.
- `rotationDeg` للحوض؛ `choices.legPosition` للطرفين (داخلي15°–20°/محايد/خارجي)؛ `choices.respiration` لحبس النفس دون فرض شهيق/زفير. فئة تنفس خاصة بالفحص `respiration` بعلامة ثنائية اللغة تتجنب نموذج الشهيق الصدري؛ لا `breathing` أو lung landmarks.
- اختيار الرجلين يغيّر الرسم التخطيطي وتقييم الوضعية؛ **لا يُعاد بناء قِصَر عنق الفخذ أو المدورات الصغيرة المخفية في الأشعة**. تظهر هذه الحدود في النص و«غير مرسوم». الحركة مستقلة: تعليمات الثبات تقود blur، دون صف مستقل لتقييم أمر الثبات أو رصده؛ لا ادعاء بإصلاح ResultPanel السابق.
- `features/pelvis-model` يحرك معالم عدم التناظر في الأشعة ورسم الحوض بالنموذج نفسه. لا خوارزمية pixel جديدة؛ band warp الموجود، حتمي ولا يطوي ترتيب المعالم، مع حدود مرئية معلنة. المرجع الصحيح يعرض الصورة الأصلية دون warp.
- A-036 نسخة PNG مطابقة لـA-035 بلا EXIF وبالدقة الأصلية، في `public/images/pelvis/pelvis-ap-baseline.png`. الأصل/الاشتقاق A-034/A-035 بقيا دون تغيير. خط marker التفاعلي مستقل، مع credit ثنائي اللغة وملاحظة التنظيف والحدود.

## 4. تغييرات الكود المشترك

- إضافة `pelvis-ap` إلى نوع model-id وفرع مخصص في `limb-effects.ts`، وgain تعليمي في tuning. المدخلات والمخرجات السابقة لم تتغير؛ كل الفروع الجديدة محصورة بمعرف الأصل الجديد.
- التسجيل في exam/case/projection/body-part/scene lists، مع بقاء ترتيب الفحوص القديمة. SceneLayout الجديد وPelvisScene/PelvisFigure/PelvisSideView؛ لا تعديل DetectorWorkspace أو PositioningView أو console أو engine أو pipeline أو patient response.
- النصوص **مفاتيح جديدة فقط** في EN/AR وبيانات ثنائية اللغة، بلا تغيير أي قيمة ترجمة قديمة. استخدام اختيار التنفس الخاص بالفحص يجنّب إنشاء علاقة كاذبة بين شهيق الصدر وصورة الحوض.

## 5. جدول الطب والتقييم

| البند | القيمة والبينة |
|---|---|
| طبي من المصدر | Bontrager ص279: SID≥102cm؛ كاشف43×35cm أفقي؛ grid؛ digital80–90kV؛ CR عمودي منتصف ASIS/الارتفاق تقريبًا5cm تحت ASIS؛ حبس النفس. ص271–272/279: دوران الطرفين للداخل15°–20°، **مع منع ذلك عند الاشتباه بكسر/خلع** |
| rubric تعليمي | الوضعية25، الدوران20، التمركز15، التعريض20، SID10، تعليمات التنفس10؛ النجاح70؛ missing/wrong-side marker بوابتان تعليميتان. ليس rubric طبيًا معتمدًا |
| تسامحات تعليمية | دوران ±2°/±5°؛ زاوية أنبوب ±2°/±5°؛ SID102–110/95–130 (الحد الأدنى102 فقط من المصدر)؛ kV جزئي75–95 (80–90 من المصدر)؛ تمركز1/2.5cm؛ هامش زائد2.6cm |
| نموذج تعريض تعليمي | anchor85kV/2.5mAs/102cm، exponent3، attenuation1، DI bands عامة مؤقتة. **ليست mAs موصى بها ولا EI/DI عالميًا** |
| هندسة/رسم | box100…2640 و30…2070، مقياس0.015cm/px، CR(1337.5,1042)؛ جميعها تقديرات تعليمية بالعين؛ render48px/cm أقل من دقة الأصل66.7px/cm؛ gain2.3. لا تشريح مخفي مولّد |
| غير ممثل على الأشعة | إعادة تراكب العظام المستقلة، تغيّر عنق الفخذ/المدور المخفي، زاوية الأنبوب، حبس النفس؛ معلنة كتغذية راجعة/رسم إعداد فقط، وليست مؤثرات سريرية مولدة |

كلها موثقة في REVIEW_PACKAGE. العربية DRAFT. إرشادات shielding التاريخية في الكتاب لم تتحول إلى بروتوكول/تحكم أو تقييم جديد.

## 6. إثبات عدم تأثر السابق وQA

- Typecheck وlint نجحا، مع تحذير O38 القديم فقط (`group` في wrist-audit.mjs)، دون إصلاح جانبي.
- **63 ملفًا / 1629 اختبارًا نجحت**: `npm test -- --maxWorkers=2 --testTimeout=30000`، تشمل characterisation/goldens وحراس المشاهد والنتائج السابقة والفحص/النموذج والحارس الجديد للحوض. استُخدم `UPDATE_PELVIS_HASHES=pelvis-ap-supine` فقط لإنشاء/تحديث إضافة هذه الجلسة؛ لا متغير تحديث قديم أو شامل.
- `npm run build` نجح، 73 صفحة SSG تشمل مساري الحوض EN/AR. أُعيد البناء بعد إصلاحات التسجيل والنص/التسميات لتكون QA النهائية على النسخة النهائية.
- `scripts/qa/pelvis-audit.mjs`: **84 فحصًا دون فشل**، EN/AR ×1440/390؛ hub/setup/result، axe WCAG2/2.1 A/AA دون مخالفات، لا overflow أو أخطاء runtime/console؛ المحاولة الصحيحة100؛ دوران10° يغيّر بكسلات النتيجة ويخفض الدرجة؛ محاولة بلا marker تُظهر critical finding. عولج selector ملتبس في أداة التدقيق الجديدة دون تعديل الواجهة لأجله.
- `scripts/qa/label-collisions.mjs pelvis-ap-supine --spec scripts/qa/label-states/pelvis-ap-supine.json --obstacles`: **648 حالة** (اختيارات الطرفين والتنفس ×الدوران/زاوية الأنبوب ×guides ×اللغة/العرض)، **صفر تداخل وصفر label خارج الإطار** بعد الإصلاح. أصغر تسمية10.9px على الهاتف/12px على الكمبيوتر في قياس الأداة. فُحصت screenshots بصريًا EN/AR والهاتف، لا بديل عن مراجعة المالك على جهازه.
- قورنت ملفات JSON للحالات المركبة الـ15 السابقة قبل/بعد: **متطابقة byte-for-byte**. تأكد عبر Git أن كل صور/masters/hash/characterisation/goldens القديمة دون تغيير، وأن الاختبار القديم الوحيد المعدل هو قائمة scene-id المسموحة.
- A-036 SHA-256 `5337360693c4939cee02f0225cd0e082fcf55dd7a5f09bd02658dcdc2297c7d9` يطابق A-035، بلا EXIF. لم يتغير تشريح الملف المصدر. package.json/lockfile لم يتغيرا؛ أدوات Playwright/axe مؤقتة مع الحفاظ على حزم التطبيق المثبتة من lockfile.
- `git diff --check` وفحص Markdown/الروابط/الحالة والانتقال نجحت. لم تُشغّل static-host preview smoke أو مراجعة مختص أو نشر؛ `next start` المحلي استُخدم للمتصفح. لا URL معاينة منشور أو مشارك.

### تدقيق شكل الرسم

جناحا الحرقفة والعجز/أسفل الفقرات وحلقة الحوض: outlines تعليمية مشتركة الإزاحة مع النتيجة؛ الثقبتان السداديتان: فراغا الحلقة؛ رأسا الفخذ والجزآن القريبان: مفاصل وساقان متصلتان، لا دوائر غير مفسرة؛ gauge الطرفين يوضح الاختيار المستقل؛ العرض الجانبي يوضح الاستلقاء والأنبوب/الكاشف وSID. المحاور image conventions لا تنعكس في RTL؛ الألوان والسماكات من scene-style؛ النص البديل يتبع حالة الطالب. حدود التشريح والدقة ليست قياسًا سريريًا.

## 7. البنود المفتوحة

O5 للمراجعة الطبية/الفيزيائية والعربية، O81 للمعايرة السريرية للأرقام التعليمية، O84 لتغطية/ملاءمة المصدر، O85 لحدود التقريب من صورة واحدة، O86 لمراجعة shielding المعاصر. O82/O83 لها اختيارات تنفيذ في S-PELVIS-1 لا تحويل إلى حقائق معتمدة. الساعد O37/RAD-027 بقي مؤجلًا. خلل ResultPanel العربي السابق غير معدّل؛ لم تُغير الاختبارات القديمة لإخفائه.

RAD-028 مرجع مدموج done، RAD-029 مراجعة ملاءمة الصورة، RAD-030 تنفيذ جاهز للمراجعة (review، **ليس done أو منشورًا** حتى دمج المالك).

## 8. قائمة فحص صاحب المشروع

راجع Draft PR الجديد، جرّب الحوض على الهاتف EN/AR: تغيير دوران الحوض والاختيار المنفصل للطرفين، وضع R/L وسحبها، التحديد والتمركز، نتيجة100 ومحاولة خاطئة. راجع مظهر الـwarp وحدوده وتعليمات عدم دوران الطرفين في الرضوض. لا إسقاط حوض آخر أو فحص آخر أضيف.

الدمج والنشر بيد المالك؛ لم يدمج الوكيل أو يفعّل auto-merge. البرومبت الجاهز للمرحلة التالية في HANDOFF §8.


## Addendum — owner review round (RAD-037, 2026-10-15)

Owner said the implementation was poor and sent a phone screenshot. Changes (docs S-PELVIS-2-1/2-2):

1. **Setup schematic redrawn** (`PelvisFigure.tsx`): the old drawing had narrow wings, boxy femora and no sacrum/pubic rings. New polygons were traced by eye over the A-036 baseline (overlay check against the picture before porting); one polygon per side. Not anatomically exact; labelled "schematic" as before.
2. **Marker made fixed (R, letter only)** like the other exams: `pelvis-ap-supine.ts` (rule, default positions, wording), `positioningPelvis.markerConvention/markerHint` EN + AR, test section in `pelvis-ap.test.ts` (semantic edit: the old test asserted the anatomical-half rule this change removes; owner-directed), pelvis hash file `scripts/qa/scene-dom/pelvis-ap-supine-hashes.json` regenerated (the pelvis drawing changed; no other hash file touched).
3. **Code review** (owner asked for errors not visible in the app). Read the exam, case, technique, geometry, model, scene files and the existing test; ran a throw-away fuzz of 1500 random settings through `evaluate` → `buildRenderPlan` → `renderRadiograph`: no exception, no NaN pixel, scores within 0–100, critical findings consistent with the marker rule (R never flagged, L / none always flagged, a passing attempt never carries a critical finding). **No logic defect found.** Observations, not fixed (S-STD-1 (2)): (a) the baseline itself is slightly asymmetric (spine and symphysis are not on one vertical, wings differ), so 0° is "the image unchanged", not a proven symmetric pelvis (known O85); (b) leg position is scored but has no radiograph effect (labelled "not drawn"); (c) a keep-still instruction changes the image (motion variant) but has no scored row; (d) the side-view figure is illustrative only.
4. QA: `npm run check`, `npm run build`, pelvis browser audit 84 checks EN/AR × 1440/390 + axe, label/obstacle matrix 648 states, all clean; the other 16 exams' hashes untouched. Not run: phone check by a human, educator review (O5).
