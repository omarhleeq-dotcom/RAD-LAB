# RAD-061 — تقرير الدفعات 2 و3 و5 و6 — 2026-10-22

**السلطة:** موافقة المالك على الدفعات 2 و3 و5 و6 معًا، كما عرّفها [تقرير التدقيق](RAD-061_CODE_AUDIT_REPORT_2026-10-22.md#batches) و[قرار ترتيب التنظيف](DECISIONS.md#cleanup-sequencing-owner-2026-10-22) (البند 3 للدفعة 6). الدفعة 4 (RAD-060 وCLN-030 وCLN-037) وCLN-042 **خارج** هذا العمل.

**التسليم:** Draft PR #101 نفسه، فوق إصلاح حد الوقت. commit لكل دفعة بالترتيب 2 ← 3 ← 5 ← 6، فتُراجع كل دفعة وتُسترجع وحدها.

## 1. الانحرافات والميزانية

- **الميزانية:** ملفات كل دفعة المذكورة في طلب المالك فقط، إضافة إلى هذا التقرير و[project-status](project-status.md) و[HANDOFF](HANDOFF.md).
- **الدفعة 5 — قائمة المفاتيح:** تقرير التدقيق ذكر «19 مفتاحًا» دون أسمائها. أعادت الفحوص الديناميكية اشتقاقها، فوجدت 17 مفتاحًا بلا أي ذكر، و8 مفاتيح كلمتها عامة. سُئل المالك أثناء الجلسة، **فاعتمد قائمة الـ17 المسمّاة**. **رقم «19» في التدقيق خطأ عدّ**، والقائمة المعتمدة هي الـ17 في §3.
- **الدفعة 5 — qa:** ظهر فرقان غير وظيفيين بين تشغيلي qa قبل وبعد (§3). عُرضا على المالك فحكم بأنهما متكافئان وطلب تسجيلهما.
- **الدفعة 2:** عُدّل `docs/DEPLOYMENT.md` (اختياري في الميزانية). أُضيف صف واحد لـ`explicitBoundaries`، وصارت عبارة «أربعة أجزاء» «أجزاؤه».
- **الدفعة 3:** تعليق الدالة `limbRotationValue` وحده صُحّح، أي ~233-237 في الأصل. سطر داخلي قديم مماثل (`(limb-warp = the foot exams…)`، الآن `pipeline.ts:241`) وعنوان القسم `limb rotation (wrist, S14.1c)` (`pipeline.ts:164`) **لم يُلمسا**، لأنهما خارج الموضع المحدد. سُجّلا بندًا مفتوحًا (§7).
- **لم يُشغَّل:** `qa:golden` ولا `qa:characterise`، ولا أي إعادة توليد.

## 2. المنجز والمُسقط

| الدفعة | البند | النتيجة |
|---|---|---|
| 2 | CLN-031 (ب) | منجز |
| 3 | CLN-024 وتعليق `pipeline.ts` من CLN-026 | منجز |
| 5 | CLN-004 (ب) | منجز بـ17 مفتاحًا بقرار المالك. الثمانية العامة لم تُحذف |
| 5 | CLN-010 | لم يُغيَّر شيء، والنتيجة في §3 |
| 6 | CLN-005 وCLN-006 وCLN-011 | منجز |

## 3. تفاصيل كل دفعة

### الدفعة 2 — حارس النشر (CLN-031 ب)

**الملفات:** `scripts/pages/pilot-schema-gate.mjs`، `scripts/pages/frontend-schema.json`، `src/features/deployment/frontend-schema.test.ts`، `docs/DEPLOYMENT.md`.

- **قائمة استثناء موحّدة:** `nonClientReceivers` (`pilot-schema-gate.mjs:20-21`) تضم `Array` و`Buffer` و`Object` و`Float32Array` و`Float64Array` و`Int8/16/32Array` و`Uint8/16/32Array` و`Uint8ClampedArray` و`BigInt64Array` و`BigUint64Array`، ولا شيء غيرها. يستعملها كاشف الحد (`:79`) وجامع الاستدعاءات (`:89`) معًا.
- **التثبيت الصريح:** حقل اختياري `explicitBoundaries` في العقد. يقرؤه `inspectBrowserBoundaries` (`:49-52`)، ويعامل كل ملف مدرج حدًّا باسمه (`:57`).
  - ملف مدرج لا يصله المتصفح يوقف الحارس (`:106`).
  - القائمة تُتحقق: مسارات نصية تبدأ بـ`src/` ولا تحوي `..`.
  - آلية البصمة نفسها لم تتغير، فالبصمة تبقى في `browserBoundaries`.
- **كل تغييرات `frontend-schema.json`:**
  1. أُضيف `"explicitBoundaries": ["src/features/pilot/owner-data.ts"]`.
  2. حُذف سطر `"src/features/radiograph/pipeline.ts": "ee6a508b…87b8"` من `browserBoundaries`.
  - لا تغيير آخر: البصمات الـ24 الباقية بالقيم نفسها حرفيًا، ومنها `owner-data.ts` (`cf88fe69…9373`).
- **اختباران جديدان** (`frontend-schema.test.ts:115-136`)، والتوقعات القائمة لم تتغير:
  - `.from` على 11 مصفوفة نوعية لا يُعدّ حدًّا.
  - ملف مدرج صراحة دون أي استدعاء حدّ يبقى مثبّتًا. تغييره يُسقط الحارس، وبلا بصمته يُسقط الحارس، وإن لم يصله المتصفح يُسقط الحارس.
  - **إثبات أن الاختبارين يقيسان التغيير:** بعد استعادة الحارس القديم مؤقتًا فشلا كلاهما (18 نجاح و2 فشل)، ونجحا مع الحارس الجديد.
- **الإثباتات:**
  - `requiredMarker` لم يتغير. `--print-marker` للمشروع نفسه أعطى قبل التغيير وبعده `pilot-v1:0bc3743c…5d52` نفسها. إثبات القاعدة يحسب ملفات SQL والفحوص فقط.
  - `inspectBrowserBoundaries()` للقراءة فقط: 24 مدخلًا قبل التسليم وبعده. `pipeline.ts` غير موجود، و`owner-data.ts` موجود.
  - الحدود الحقيقية الـ23 بصماتها مطابقة. قائمة `calls` مطابقة، وعدد الملفات المكتشفة 221 قبل وبعد.
  - تراجع عدد `literals` من 1429 إلى 1394. هذه نصوص `pipeline.ts` التي لم تعد تُجمع، ولا ترحيلات مؤجلة في العقد الحالي.
- **الاختبارات:** `src/features/deployment` (`frontend-schema` و`assess-d/e/f-schema` و`schema-gate-discovery`): 5 ملفات و24 اختبارًا ناجحة. lint الملفين نظيف.

### الدفعة 3 — رياضيات التشويه المشتركة (CLN-024) وتعليق `pipeline.ts` (CLN-026)

**الملفات:** `src/features/limb-warp/warp.ts` (جديد)، `wrist-model.ts`، `elbow-model.ts`، `hand-model.ts`، `lower-limb-model.ts`، `radiograph/pipeline.ts`.

- **التطابق قبل النقل:** بصمات md5 لأجسام النسخ:
  - `monotone`: متطابقة في النماذج الأربعة.
  - `interpolateAnchors`: متطابقة في الرسغ والكوع والطرف السفلي، و`anchorShift` في `pipeline.ts` بعد توحيد التوقيع فقط.
  - `oddPart`: متطابقة في اليد والطرف السفلي.
  - `WarpAnchor` و`MIN_SLOPE = 0.2`: متطابقان في النماذج الأربعة.
  - **الأجسام في `warp.ts` منسوخة حرفيًا.** اختلف تعليق `oddPart` بين اليد والطرف السفلي، فاعتُمد تعليق اليد.
- **`warp.ts`** لا يستورد شيئًا، ويصدّر `WarpAnchor` و`MIN_SLOPE` و`monotone` و`interpolateAnchors` و`oddPart`.
- **النماذج تعيد تصدير ما كانت تصدّره فقط**، فلم يتغير سطح التصدير ولا أي ملف اختبار:
  - الرسغ والكوع: `interpolateAnchors` و`WarpAnchor`.
  - اليد: `oddPart` و`WarpAnchor`.
  - الطرف السفلي: الثلاثة.
- **`pipeline.ts`** يستورد `interpolateAnchors as anchorShift` ويصدّر `anchorShift` (`:26`، `:173`)، فلم يتغير أي مستدعٍ.
- **ثوابت كل أسرة** في مكانها، ومنها `THUMB_CAP` في اليد. ملاحظة اليد الخاصة عن حد عدم الطي بقيت تعليقًا فوق `THUMB_CAP`.
- **تعليق `limbRotationValue`** (`pipeline.ts:226-232`) صار يعدّد كل فحوص الأطراف ومسار كل منها، كما في الكود:
  - hand-pa و`limb-warp` (القدم، والكاحل AP، وGrashey، والحوض AP).
  - hand-lateral.
  - elbow-ap وwrist-pa و`limb-layers` (الركبة AP).
  - elbow-lateral وwrist-lateral و`limb-copies` (الركبة والكاحل جانبيًا).
- **الإثباتات:**
  - **الإغلاق:** أُغلق الاستيراد بمحلّل TypeScript للمشروع. إغلاق `evaluation/engine.ts` 21 ملفًا، و`comparison-version.ts` 7، و`version.ts` 11، و`assess/server-grader.ts` 102. لا يحوي أيٌّ منها ملفًا معدّلًا أو `warp.ts`، **فلا يُرفع إصدار المحرك**.
  - **لا حلقة جديدة:** `warp.ts` ورقة لا تستورد شيئًا. عدد الحلقات في `src` 11 قبل وبعد، كلها قائمة مسبقًا، ولا تمر أيٌّ منها بالملفات المعدلة. اتجاه الاستيراد الجديد الوحيد نحو `limb-warp`.
  - **الحارس:** `pipeline.ts` لم يعد مثبّتًا بعد الدفعة 2، و`frontendRequirements()` ناجح.
- **الاختبارات:** `radiograph` و`positioning` و`qa` (goldens وcharacterisation وscene-dom) والنماذج الأربعة: 26 ملفًا و650 اختبارًا، **دون أي إعادة توليد**. `npm run typecheck` ناجح، وlint الملفات نظيف.

### الدفعة 5 — المفاتيح غير المستخدمة (CLN-004 ب)

**الملفات:** `messages/en.json`، `messages/ar.json`، `docs/ARABIC_TERMINOLOGY.md`.

- **إعادة التحقق:** قبل الحذف أعيد التحقق من كل مفتاح بالمراحل الأربع التالية:
  1. البحث عن المسار الكامل وكل لاحقة منه نصًا مقتبسًا.
  2. مطابقة كل قالب نصي `${…}` له جزء حرفي.
  3. مطابقة التجميع بـ`+` (`pelvisLeg_` وأمثاله).
  4. مسح AST لكل استدعاءات `useTranslations` و`getTranslations` والقوالب والوسائط الديناميكية.
  - **نتيجة هذه المراحل:** مفاتيح `terms.*.pN` ديناميكية فاستُبعدت. ولم يُعثر على أي مسار لـ26 مفتاحًا.
  - **التفتيش اليدوي:** فُتّشت `scripts` و`src/features/qa` و`global-not-found.tsx` يدويًا، ولم يُستعمل منها إلا `home.catalogTitle` (CLN-010).
  - `positioning.rotationValue` يبقى بقرار المالك، لاحتمال بنائه عبر `positioning${ns}.rotation${kind}`.
- **المحذوف من اللغتين بالتطابق (17):**
  - `workspace`: `step1` و`step2` و`step3`.
  - `positioning`: `fieldHandle` و`markerL` و`markerR` و`cueDetector` و`chinOverlay`.
  - `console.patientPrep`.
  - `technique`: `gaugeTarget` و`aecChamber` و`aecState`.
  - `positioningAp`: `sideAlt` و`angleReadout`.
  - `scene.altPlan`.
  - `library`: `backToExams` و`backToCategories`.
  - لم يُفرَّغ أي فضاء أسماء، وتنسيق JSON محفوظ (indent 2 وUTF-8).
  - الفرق في كل ملف 17 سطرًا محذوفًا، وسطر يتغير فيه الفاصلة الأخيرة فقط.
- **لم تُحذف — مرشحات جديدة لم يدققها التدقيق:** `console.exposing` و`positioning.field` و`scene.bed` و`account.nav` و`credits.details` و`library.regions` و`assessHistory.privacy` و`assessHistory.limits`. كلمتها عامة تظهر في كود غير متعلق، ولم يُعثر لها على مسار ترجمة. تُراجع في جرد RAD-064 أو دفعة لاحقة.
- **ARABIC_TERMINOLOGY:** أضيفت ملاحظة بعد سجل S13-7: حُذف `positioning.cueDetector` و`positioningAp.sideAlt` و`positioningAp.angleReadout` من الرسائل، ولم يُحذف سجلها.
- **qa قبل وبعد** (بناء إنتاجي و`next start` محلي، EN/AR، desktop 1440 وmobile 390):

| الأداة | قبل | بعد |
|---|---|---|
| `qa:visual` (`--devices=desktop,mobile`) | 2817/2817 ناجحة (53 سيناريو) | 2817/2817 ناجحة، والسجل مطابق حرفيًا |
| `qa:a11y` | 48 ok/info، 0 violations | 48 ok/info، 0 violations، والتقرير JSON مطابق حرفيًا |

  - **الفرقان المسجّلان بقرار المالك:**
    - **85 فحصًا «radiograph inside the viewport»** في `results.json`: قيمة y للصورة مختلفة، مثل 792→1011. كلها ناجحة، والعرض والارتفاع نفسهما، والقيم نفسها موجودة في التشغيلين على سيناريوهات مختلفة.
    - **9 من 16 لقطة صفحة كاملة:** الفرق في شريط بارتفاع نحو 100–200px، حيث التُقط الهيدر الثابت عند موضع تمرير مختلف. لا فرق نصي ولا محتوى.
  - **الاستنتاج:** توقيت تمرير غير حتمي في التقاط المتصفح، لا تغيير تخطيط، مع تطابق 2817/2817 و48 ok و0 violations.
- **CLN-010 (`home.catalogTitle`):**
  - تشغيلا qa:visual وqa:a11y لا يشغّلان `scripts/qa/catalogue-audit.mjs`، فلم تحسم qa الفرضية.
  - HTML الصفحة الرئيسية المخدومة `/en` فيه عنوانا `h2` فقط: «Main navigation» و«Overview».
  - النص «Choose an imaging modality» موجود فقط داخل حمولة الرسائل المسلسلة، لا عنوانًا ظاهرًا.
  - هذا يدعم الفرضية: `catalogue-audit.mjs:70` ينتظر عنوانًا لا يعرضه الإنتاج.
  - **لم يُغيَّر شيء، والقرار للمالك.**

### الدفعة 6 — الحذف ونقل الأصل (البند 3 من القرار)

**الملفات:** حذف `src/features/platform/catalogue.ts` و`catalogue.test.ts` و`src/features/pilot/my-attempts.ts` و`src/features/pilot/my-attempts.test.ts`. نقل `public/images/chest-pa/chest-pa-baseline.jpg` إلى `assets/source/chest-pa/chest-pa-baseline.jpg`. تعديل `scripts/derive-chest-pa-baseline.py:26` و`docs/ASSET_PROVENANCE_AND_LICENSES.md:93,771`.

- **CLN-005 وCLN-006:**
  - لا مستورد للملفين المحذوفين غير اختباريهما.
  - `src/features/pilot-db/my-attempts.test.ts` لا يستورد الوحدة المحذوفة (يستورد `fs` و`path` وPGlite وvitest فقط)، فلم يُلمس.
  - حذف الاختبارين هو الاستثناء الصريح لهذه الدفعة.
- **CLN-011:**
  - **التخطيط:** `assets/source/<الأسرة>/` هو التخطيط الوحيد القائم. يضم الأصول غير المخدومة، ومنها ملف معالَج مثل `pelvis-ap-marker-removed.png`، فوُضع الملف بجانب أصله A-001.
  - **البايتات لم تتغير:** SHA-1 `c9010f963f51dd8ea31c500e52aacae7b79e1bb1` قبل النقل وبعده، مطابق لسجل A-002. Git يسجّله rename.
  - **المرجع الوحيد للمسار القديم** كان مخرج سكربت الاشتقاق وسجل الأصول.
  - **مراجع لا علاقة لها بالمسار:** `credits` و`chest-pa-case.json` و`chest-pa-scenarios.json` تذكر المعرّف `chest-pa-baseline` لا المسار. `_headers` لا يذكر الملف، ولا اختبار يشير إلى المسار القديم.
  - **سجل A-002:** «not served by the app». الملف المخدوم `-1000.jpg` باقٍ، و`out/images/chest-pa/` بعد `build:pages` يحوي `chest-pa-baseline-1000.jpg` وحده.
- **الاختبارات:** `platform` و`pilot` و`pilot-db` و`qa` و`data`: 49 ملفًا و791 اختبارًا ناجحة.

## 4. التغييرات المشتركة وScale (S-STD-3)

- **الوحدة المشتركة الجديدة:** `src/features/limb-warp/warp.ts`، لا تستورد شيئًا.
- **العقد المشترك:** `frontend-schema.json` بحقل اختياري جديد `explicitBoundaries`.
- **Scale:**
  - `explicitBoundaries` قائمة مراجعة يدويًا بإصدار العقد نفسه، وتكبر بإضافة سطر فقط. كلفة الفحص مرتبطة بملفات المستودع، لا بالمستخدمين.
  - `nonClientReceivers` قائمة ثابتة مقصودة لمستقبلات JavaScript المدمجة. محفّز توسيعها: مستقبل مدمج جديد يُصنَّف حدًّا خطأً، ويكون بمراجعة.
  - لا سقف جديد في البيانات أو اللغات أو الأدوار.

## 5. الطب والتصحيح

- لا تغيير طبي، ولا تغيير في التصحيح أو الدرجات أو feedback.
- لم يُلمس أي ملف في إغلاق التصحيح، ولم يُرفع `PRACTICE_EVALUATION_VERSION`.
- الصورة المنقولة لم تتغير بايتاتها، والصورة المخدومة لم تُلمس.

## 6. QA

| الفحص | النتيجة |
|---|---|
| اختبارات كل دفعة | §3، كلها ناجحة |
| `npm run check` (typecheck وlint وtest كامل) | ناجح: 146 ملفًا و2328 اختبارًا، وlint بلا تحذيرات |
| `npm run build` | ناجح |
| `npm run build:pages` | ناجح |
| فحص الحدود (`inspectBrowserBoundaries`) | 24 مدخلًا، دون `pipeline.ts`، و`owner-data.ts` موجود، وكل البصمات مطابقة للأصل |
| qa:visual وqa:a11y قبل وبعد الدفعة 5 | §3 |
| `docs:check -- --base origin/main` | ناجح: 0 errors و0 review warnings |
| `status:check -- --base origin/main --require-previous` | ناجح. يبقى تعارض المصدر الموروث RAD-024 ظاهرًا كما هو |
| `git diff --check` | نظيف |

- لم يُشغَّل `qa:golden` ولا `qa:characterise`.
- لا اتصال بقاعدة بيانات أو مزوّد، ولا hosted preview.
- `playwright` و`axe-core` ثُبّتا بـ`npm i --no-save`، فلم يتغير `package.json` ولا القفل.

## 7. البنود المفتوحة

- الدفعة 4 (RAD-060 وCLN-030 وCLN-037) بعد موافقتها، ثم CLN-042.
- قرار CLN-010 للمالك.
- **8 مفاتيح بكلمات عامة** (§3) مرشحة لجرد RAD-064 أو دفعة لاحقة.
- **أدوات qa:** لقطات الصفحة الكاملة في `qa:visual` غير حتمية بسبب الهيدر الثابت، وقيم y في فحص viewport تتبع توقيت التمرير. بند صغير، لا يُصلح الآن.
- **تعليقان قديمان في `pipeline.ts`** خارج موضع CLN-026: `:164` عنوان القسم، و`:241` «limb-warp = the foot exams» مع أنه يشمل الكاحل AP وGrashey والحوض.
- **ruling والروابط:** لم يتغير أي حكم. التعديلان في `DEPLOYMENT.md` و`ASSET_PROVENANCE_AND_LICENSES.md` يصفان الحالة الجديدة، وروابط الأدلة الأصلية (سجلا A-001 وA-003 وقسم عقد الواجهة) باقية.

## 8. قائمة المالك وموجّه الجلسة التالية

- [ ] مراجعة Draft PR #101 commit بعد commit: حد الوقت، ثم الدفعات 2 و3 و5 و6.
- [ ] مراجعة تغييري `frontend-schema.json` (§3، الدفعة 2).
- [ ] قرار CLN-010.
- [ ] قرار المفاتيح الثمانية، الآن أو في RAD-064.
- [ ] موافقة الدفعة 4.

**موجّه الجلسة التالية:** «اتبع AGENTS.md. بعد مراجعة #101 ودمجه، نفّذ الدفعة 4 من تقرير تدقيق RAD-061 (RAD-060 وCLN-030 وCLN-037) بحسب قرار ترتيب التنظيف. أول commit CLN-030 بتحديث بصمة `OwnerPanel.tsx` بقبول صريح، وأكّد الاختبار الثابت مع المالك قبل التنفيذ.»
