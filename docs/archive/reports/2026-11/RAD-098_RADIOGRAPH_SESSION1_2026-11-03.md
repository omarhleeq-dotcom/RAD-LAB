# RAD-098 — محرك صورة الأشعة، الجلسة 1، 2026-11-03

## 1. الانحرافات والميزانية

تصحيح صريح بتكليف المالك لفشلCI unit في#220: إعادة التقاط الشهود مسموحة علىmain الخالص فقط. الإصلاح8 ملفات حالية (مع إعادة تسمية التقرير وتحديث المعرّف بعدالدمج) وصفر وحدات منتج؛ إجماليPR باقٍ12 ملفًا و3 وحدات منتج منSession1.
الملفات: cross-family-test-utils.ts، cross-family-pixels.test.ts، radiograph-pixel-witnesses.json، radiograph-performance.mjs، هذا التقرير وproject-status.md وDECISIONS.md وفهرس التقاريرREADME.md.
[التقرير الأول وأرقامه محفوظة في38a51a4](https://github.com/omarhleeq-dotcom/RAD-LAB/blob/38a51a48e63d764c1241b47d2be0a9a03e4b6c08/docs/archive/reports/2026-11/RAD-097_RADIOGRAPH_SESSION1_2026-11-03.md)؛ هذه المراجعة تصحح ادعاء قابلية نقل هاش الخطة وتستبدل تقدير تراجعHand lateral القصير.

## 2. المنجز والمستبعد

وُحّدJSON التشخيصي بترتيب مفاتيح كائنات حسبUnicode وحفظ ترتيب المصفوفات وتنسيق الأرقام المحدودة إلى12 رقمًا معنويًا. التقريب للهاش فقط؛ الخطة الخام وFloat32 ومدخلات الرسم وluma بلا تقريب.
حارس الالتقاط يعمل قبل الاختبارات: HEAD=origin/main، لاdiff ولا ملفات منتج غيرمتتبعة، Node22 وUbuntu، ومخرج جديد خارج المستودع. لا التقاط منالفرع ولا استبدال تلقائي لملف مقفل.
أعيد الالتقاط داخلUbuntu24.04.5،Node22.23.4/V8 12.4.254.21-node.57،تثبيتnpm ci جديد منlockfile،TZ=UTC وLANG=C.UTF-8،علىmain4731e55 فقط، بعدإعادة الالتقاط عقب دمج#222. نقل الملف إلىالفرع مطابقSHA256:
`5cffd7dccb11a37b9ed499b54b7ca843b0178f7ddc6e9ec848b4367aab66fdfb`.
كل1293 حالة احتفظت بالأصل وهاش فك ترميزه وpatch/effects/size؛ مقارنة2586 هاشluma كامل/معزول بالملف الأول مطابقة. تغيرهاشاplan/soloPlan فقط بفعلEncoding الجديد.

## 3. لكل مهمة: RAD-098

كانmain9ca1802 مدموجًا أولًا و#222 مسودة؛ ثم دُمجت#222 أثناء التحقق وتقدمmain إلى4731e55. دُمج التحديث وحُفظت مهمتهاRAD-097 حرفيًا، وأخذت خطة الأشعة المعرف الحرRAD-098؛ next_id=RAD-099. لم يتغيرsrc أوالأصول أوحزم التطبيق بينرأسيmain.
تبقى خطة الجلسات2–4 planned/code، و[D-R1…D-R3](../../../DECISIONS.md#radiograph-plan-owner-2026-11-03) محفوظة فيالالتزام الأول؛ لا إغلاق للخطة أوready/merge.

## 4. السبب والتغييرات المشتركة وScale

السبب قيمة محسوبة منMath.pow، لاDate/TZ/Intl ولا ترتيب المفاتيح: `Math.pow(100/120,3)` يعيد0.5787037037037037 فيNode22 مقابل0.5787037037037038 فيNode24/V8 13.6.233.17-node.51.
ينتقل فرقULP إلىnoiseSigma:7.6790624427725565 مقابل7.679062442772553؛ وفيالركبتين يتغيرdetailGain من0.8817981135861931 إلى0.8817981135861932. أُعيد إنتاجهاشCI الخامde65aad1… للصدرPA علىNode22.
الترميز الجديد يقبل هذا الفرق التشخيصي الضئيل، ويحفظ ترتيب المصفوفات ويميز التغير العددي الملموس ويرفضNaN؛ اختبارObject.freeze يثبت عدم تعديل الخطة. هاشات البكسل تظلSHA-256 كاملة دون تسامح.

### العمليات المنقولة فيSession1 — لم تتغير فيهذا الإصلاح

| القديم فيpipeline | العملية الآن |
|---|---|
| `handPaShiftU` | wrapper → `limb-effects.warpColumnsShiftU`؛ anchors/bands عامة |
| `elbowApValue` | wrapper → `limb-effects.twoLayerValue`؛ first/second بدل أسماء العظام |
| `limbRotationValue` | wrapper → `limb-effects.prepareLimbRow` واختيار العملية مرة للصف |
| فرعhand-lateral داخلlimbRotationValue | `equalWindowCopiesValue`، بالمجاميع نفسها |
| فرعlateral/copies داخلlimbRotationValue | `windowCopiesValue`، بالأوزان وترتيبها نفسيهما |
| `bandWeight` و`anchorShift` | re-export منlimb-effects؛ interpolation الأصلي فيlimb-warp لم يتغير |
| `inspirationLut`، `rotationShiftU`، `lateralSeparation`، `scapulaOverlay`، `jawOverlay` | الأسماء نفسها فيchest-operations، معcompatibility re-exports منpipeline |

### هوية البايتات —1293 سيناريو

الأعداد حالات مطابقة علىmain/الفرع؛ الخطة بتنسيقcanonical أعلاه وluma خام. B أساس؛R دوران؛F قص؛C توسيط؛EF حقل زائد؛E−/E+ تعريض؛P اختراق؛M حركة؛I شهيق؛S كتفان؛J ذقن؛Pr إسقاط؛Mk علامة؛Σ مركب. — غيرمعلن.

| الفحص | B | R | F | C | EF | E− | E+ | P | M | I | S | J | Pr | Mk | Σ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| chest-pa-erect | 1 | 6 | 8 | 24 | 14 | 4 | 4 | 4 | 3 | 4 | 2 | 2 | 3 | 3 | 1 |
| chest-lateral-erect | 1 | 6 | 8 | 24 | 14 | 4 | 4 | 4† | 3 | 4 | — | — | 3 | 3 | 1 |
| chest-ap-supine | 1 | 6 | 8 | 24 | 14 | 4 | 4 | 4 | 3 | 4 | — | — | 3 | 3 | 1 |
| wrist-pa | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| wrist-lateral | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| hand-pa | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| hand-lateral | 1 | 6 | 8 | 24 | 14 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| elbow-ap | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| elbow-lateral | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| foot-ap | 1 | 6 | 8 | 24 | 14 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| foot-oblique | 1 | 6 | 8 | 24 | 14 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| knee-ap | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| knee-lateral | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| ankle-ap | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| ankle-lateral | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4 | 3 | — | — | — | 2 | 3 | 1 |
| pelvis-ap-supine | 1 | 6 | 8 | 24 | 12 | 4 | 4 | 4† | 3 | — | — | — | 1 | 3 | 1 |
| shoulder-grashey-erect | 1 | 6 | 8 | 24 | 16 | 4 | 4 | 4† | 3 | — | — | — | 1 | 3 | 1 |

† فجوة معروفة باقية: changesPixels/drawn=true بلاdenseZones، وluma المعزولة مطابقة للأساس؛ إصلاحها للجلسة2 وفقD-R1.

### الأداء الأول —3 إحماءات/9 عينات، محفوظ للتتبع

Chromium154.0.8037.57،390×844،DPR1،دقة المحرك،دورانmax،توقيتrenderRadiograph فقط بلاdecode/plan/annotations. تقديرHand lateral فيالجدول الأول استُبدل بالقياس الموسع أدناه.

| الفحص | بلا أثر: قبل→بعد ms | دوران: قبل→بعد ms | تغير وسيط الدوران |
|---|---:|---:|---:|
| chest-pa-erect | 32.4→31.6 | 84.2→77.7 | -7.7% |
| chest-lateral-erect | 32.4→28.6 | 43.1→37.2 | -13.7% |
| chest-ap-supine | 34.5→29.8 | 86.4→86.0 | -0.5% |
| wrist-pa | 35.5→34.6 | 156.6→115.4 | -26.3% |
| wrist-lateral | 41.2→36.6 | 274.4→95.5 | -65.2% |
| hand-pa | 73.6→72.6 | 428.9→334.7 | -22.0% |
| hand-lateral | 20.4→19.6 | 64.4→76.5 | +18.8% |
| elbow-ap | 16.1→17.3 | 47.0→42.7 | -9.1% |
| elbow-lateral | 13.3→12.2 | 67.8→30.2 | -55.5% |
| foot-ap | 69.5→61.3 | 307.6→229.0 | -25.6% |
| foot-oblique | 74.5→65.7 | 293.4→242.2 | -17.5% |
| knee-ap | 77.8→72.8 | 225.1→214.2 | -4.8% |
| knee-lateral | 84.1→76.3 | 414.1→171.0 | -58.7% |
| ankle-ap | 77.4→62.8 | 287.4→229.7 | -20.1% |
| ankle-lateral | 73.9→66.1 | 411.7→137.5 | -66.6% |
| pelvis-ap-supine | 84.2→73.1 | 381.5→347.9 | -8.8% |
| shoulder-grashey-erect | 23.8→22.4 | 90.1→70.3 | -22.0% |

### إعادة قياسHand lateral —25 إحماءً،5 جولات×51 عينة لكل نسخة

نفسChromium والحجم والدقة والبذرة، أصل واحد مفكوك الترميز؛ main يُبنى منكل وحدات المنتج الأصلية فيorigin/main. ترتيبAB/BA يتناوب لكل عينة، والخطط الخام وهاشات البكسل متطابقة بين النسختين.

| الحالة | main median/IQR ms | الفرع median/IQR ms | تغير الزمن |
|---|---:|---:|---:|
| baseline |17.90 /16.50–19.60|17.60 /16.40–19.30|−1.68%|
| rotation/max |87.70 /83.60–94.40|81.30 /77.40–87.40|−7.30%|

وسيط الدوران لكل جولة main→branch:88.4→83.8؛85.1→78.2؛87.4→81.1؛90.4→81.6؛90.8→83.3. لم يتكرر التراجع السابق+18.8%؛ الفرع أسرع في5/5 جولات، فلم يلزم تغيير منتج أوتراجع عن الاستخراج.
`node scripts/qa/radiograph-performance.mjs /tmp/hand-lateral.json --exam hand-lateral --compare-main --warmups 25 --samples 51 --rounds 5`
Scale: القياس جهاز واحد وحالةsteady-state؛ لا ضمان للهاتف. الخيط الرئيسي وسقف1.8MP باقِيان؛ رفعهما يحتاج نطاق أداء مستقلًا، ولاWeb Worker هنا.

## 5. الطب والدرجات

Verified: لم يتغير أي كود منتج فيالإصلاح؛ pipeline/limb-effects/chest-operations/plan/TUNING مطابقة لـ38a51a4. الأصول والتقييم/الدرجات والـgoldens والcharacterisation وscene hashes لم تُعدّل. لا حقائق طبية جديدة.

## 6. QA — التشغيلان المطلوبان

داخلUbuntu/Node22 نفسه، استخدمنا أمرCI unit نفسه، بعدتثبيتlockfile. الالتقاط فقط يضيف متغيريالمخرج وCAPTURE؛ اختبارالبناء مرة واحدة لم يُعطّل:

```sh
CI=true CI_TEST_LANE=unit CAPTURE_RADIOGRAPH_BASELINE=origin/main RADIOGRAPH_WITNESS_OUTPUT=/tmp/origin-main-473-witnesses.json npm test
CI=true CI_TEST_LANE=unit npm test
```

| التصنيف | التشغيل والنتيجة |
|---|---|
| Verified | main4731e55:2561 ناجحًا، وإخفاق واحد متوقع فقط لاختبارconstructs the active rotation model only once؛ التقطت الفحوص17 كاملة ونجحت بقية الملفات151. |
| Verified | الفرع:2562/2562 ناجحًا في152 ملفًا، ومنها21 اختبارشهود/ترميز/تحسين، مع الملف الملتقط منmain فقط. |
| Verified | Node24.19.0 معPacific/Honolulu:21/21؛ اختبارcanonical إضافي معlocale tr-TR ناجح. لا اعتماد علىTZ/locale. |
| Verified | typecheck وlint علىUbuntu/Node22؛ تحذيراvb/inv السابقان فقط. health:source/sizes بلاأخطاء وhealth:test9/9؛ البناء السابق فيCI ناجح وكود المنتج لم يتغير. |
| Verified | تشغيل أول للفرع تحتQA متزامن أعطى3 timeouts قديمة عند5ثوانٍ؛ أعيد الأمر منفردًا فنجح كله بلا تعديل مهلة أوإخفاء اختبار. |
| Verified | docs:sync مرتان مع ثباتdiff،docs:check،status:check --base origin/main --require-previous،git diff --check؛ تحفظ ميزانيةbudgets.json. |
| Inferred | التراجع القصير القديم كان حساسًا للإحماء/الترتيب؛ لا يثبت القياس الحالي سببًا بعينه أوتحسنًا عامًا لكل جهاز. |
| Not run | نتيجةCI الجديدة بعدpush وفحص هاتف حقيقي ومراجعة طبية؛ لا ادعاء نجاحها. CI السابق كانunit أحمر، وDB/build ناجحين. |

## 7. المفتوح

حُسم تصادم المعرّف بعددمج#222 بتخصيصRAD-098 لخطة الأشعة وحفظRAD-097 الخاصة بها. فجوةD-R1 واستمراريةالدوران وحدودأداءالهاتف باقية للجلسات اللاحقة.

## 8. قائمة المالك والمتابعة

مراجعة فرقEncoding وحارسmain وشاهدي التشغيل وقياس255 عينة، والتحقق مننتيجةCI؛ تبقى#220 مسودة بلاready/merge.
برومبتSession2: اقرأAGENTS وRAD-098 وقراراتradiograph-plan-owner-2026-11-03، ثم أصلحD-R1 أولًا بتحويلexpected-gap إلىعقدسببي دونdenseZones مختلقة أوتغييرالدرجات. أعلنالميزانيةوتوقعاتالتغيير، واحفظD-R2 وفصلrubric وD-R3 للمخططالمستقل؛ الدورانقرارلاحق. فرعجديد وDraftواحدفقط بعدتوافرشواهدSession1 فيالأساس.
