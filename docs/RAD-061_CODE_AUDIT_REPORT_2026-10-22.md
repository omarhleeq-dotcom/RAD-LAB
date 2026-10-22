# RAD-061 — تقرير تدقيق الكود القرائي — 2026-10-22

**السلطة:** الخطوة (ب) من [قرار المالك](DECISIONS.md#assess-authoring-owner-2026-10-22)، بعد دمج #96 والتحقق منه عن بُعد. التدقيق قراءة فقط على أربع مراحل، وكل مرحلة راجعها المالك وصحّحها قبل التالية. التقرير يجمع التصنيف النهائي بعد كل تصحيحات المالك. **لم يُعدَّل أي ملف كود أثناء التدقيق.** هذا الملف وتحديث الحالة وHANDOFF دفعة توثيق فقط.

**الهدف:** إيجاد الكود الميت والمكرر والمعزول والمعقد بلا داع، مع خطة تنظيف مثبتة بالأدلة. لا يُحذف شيء ولا يُعاد تنظيمه قبل موافقة منفصلة من المالك على كل دفعة. لا يرفع هذا التقرير تأجيل برمجة Assess ولا تجميد الفحوص والصور.

## 1. الانحرافات والميزانية

- **الميزانية:** كل ملفات TypeScript ضمن `tsconfig` (`src` و`scripts/*.ts`)، وكل الـexports، وكل مفاتيح `messages/en.json` و`ar.json`. وكذلك `public/` و`assets/` و`scripts/` و`supabase/` والإعدادات وملفا CI. القراءة المفصلة حسب المناطق: 3a domain/exam/evaluation/scoring/technique/simulation/data، 3b radiograph/النماذج/positioning/console، 3c app/components/stores/platform/i18n/messages/pilot، 3d Assess (تقرير فقط) وسكربت غير محمي والإعدادات.
- **حالة RAD-061:** نُقلت إلى `review` بانتظار المالك، لا `done`. التدقيق اكتمل، والدفعات لم تبدأ. التنسيق ([status-format](status-format.md) §3) يمنع `completion_evidence` لغير المنجز، فوُضع الدليل في `source_ref` (هذا التقرير) وفي الوصف. هذا تعارض بين الطلب والتنسيق، وحُسم لصالح التنسيق.
- **CLN-038 غير مستخدم:** ملاحظة «حجم اختبارات Assess» نُقلت إلى قائمة «أُبقي بعد التحقق» دون رقم. لا يُعاد استخدام الرقم حفاظًا على ثبات المعرّفات.

## 2. الطريقة والأدلة

- **فحص المترجم:** فحص TypeScript صارم بخياري `--noUnusedLocals --noUnusedParameters` أعطى صفر أخطاء. فحص `--allowUnreachableCode false` أعطى صفر أخطاء.
- **سكربتات قراءة مؤقتة خارج المستودع، بمكتبة TypeScript المثبتة في المشروع ودون حزم جديدة:**
  - مراجع كل export عبر LanguageService (`findReferences`)، مع تمييز استخدام الإنتاج من استخدام الاختبارات.
  - شجرة الاستيراد انطلاقًا من نقاط دخول Next، لإيجاد الملفات التي لا يصل إليها التطبيق.
  - مقارنة مفاتيح الرسائل بالرموز في كود الإنتاج، مع فحص يدوي لكل مفتاح يُبنى ديناميكيًا.
  - إغلاق الاستيراد لملفات التصحيح (`engine.ts` و`comparison-version.ts` و`version.ts` و`server-grader.ts`).
  - تطبيق معايير حارس النشر على الملفات المثبّتة لمعرفة سبب تثبيت كل منها.
- **مقارنات:** بصمات md5 لأجسام الدوال، ونسبة الأسطر المتطابقة بين الملفات المتقابلة بعد توحيد أسماء العائلات.
- **ما يُعدّ دليلًا:** النتيجة الآلية وحدها فرضية (Hypothesis) ما لم تؤكدها قراءة الكود والبحث في `scripts` و`docs` و`supabase` و`public` و`messages` و`.github`.

## 3. التصنيف النهائي

| ID | الفئة | الموقع | الحالة | التصنيف النهائي |
|---|---|---|---|---|
| CLN-001 | كود ميت | `src/features/positioning/wrist-visual.ts:8-43` (نموذج الرسم القديم الذي استبدله S-VIS-1b) | Verified | **P1 — دفعة 1** |
| CLN-002 | كود ميت | `lowerLimbCmPerPx` في `lower-limb-geometry.ts:40`، `modelUsesReference` في `lower-limb-model.ts:213`، `MAX_DRAWN_DEG` في `lower-limb-visual.ts:35` | Verified | **P1 — دفعة 1**. `PA_FOREARM` (`wrist-model.ts:61`) **keep**، لأنه قياس مقروء بالعين وموثّق |
| CLN-003 | كود ميت | `EvidenceStatus` في `domain/case.ts:60-63` | Verified | **P1 — دفعة 1** |
| CLN-004 | مفاتيح غير معروضة | (أ) فضاءا `myAttempts` و`modality`؛ (ب) 19 مفتاحًا فرديًا | Verified | **(أ) P1 دفعة 1؛ (ب) P1 دفعة 5** بعد `qa:visual` و`qa:a11y` |
| CLN-005 | ملف معزول | `src/features/platform/catalogue.ts` (حلّ محله `library.ts`) | Verified | P4 — قرار مؤجل حتى انتهاء الدفعات |
| CLN-006 | ملف معزول | `src/features/pilot/my-attempts.ts` | Verified | P4 — قرار مؤجل |
| CLN-007 | لا يستخدمه إلا الاختبار | مساعدات CSV القديمة في `owner-data.ts` | Verified | **keep** — عقد ثابت ([PILOT_SUPABASE_SETUP](PILOT_SUPABASE_SETUP.md) «CSVv1 ثابت») |
| CLN-008 | لا يستخدمه إلا الاختبار | export من نوع `RadCase` لكل حالة | Verified | P4 — RAD-021 |
| CLN-009 | لا يستخدمه إلا الاختبار | مرجع DI وتحويل الإحداثيات وعقود Assess | Verified | keep |
| CLN-010 | فرضية | `home.catalogTitle` مطلوب في `scripts/qa/catalogue-audit.mjs` ولا يعرضه الإنتاج | Hypothesis | P4 — قرار مؤجل؛ يُتحقق منه عند تشغيل qa |
| CLN-011 | أصل غير محمّل | `public/images/chest-pa/chest-pa-baseline.jpg` | Verified | P4 — قرار مؤجل. سجل provenance يصفها بـ«served by the app»، فيُعدَّل إن نُقلت |
| CLN-012 | سكربت بلا مرجع | `scripts/qa/hand-lateral-layout.mjs` | Verified | P4 — قرار مؤجل |
| CLN-013 | اعتمادية | `pg` | Verified | keep — تستخدمها أدوات `scripts/assess` أيضًا |
| CLN-014 | أنواع غير مستوردة | `assess/server-contracts.ts:35,47` | Verified | keep — عقد موثّق |
| CLN-015 | export داخلي | 126 export يُستخدم داخل ملفه فقط | Verified | keep |
| CLN-016 | تكرار | بيانات الرسغ واليد والكوع (البُناة والتقنية والحالات) | Verified | **P3 مؤجل** — انظر §6 |
| CLN-017 | تكرار | سلسلة mAs منسوخة 6 مرات | Verified | مدمج في CLN-016 ولا يُنفذ منفردًا |
| CLN-018 | متطلب غير معروض | `imageCriteria` | Verified | keep مؤجل — متطلب أصلي ([المواصفات](RAD-LAB_Project_Specification.md) §17) يُعرض بعد مراجعة طبية |
| CLN-019 | سياسة عامة | `PARTIAL_CREDIT` في `engine.ts:33` | Verified | keep — تغيير معناه يرفع إصدار المحرك ([القاعدة](PILOT_SUPABASE_SETUP.md#practice-evaluation-version)) |
| CLN-020 | تعليقات قديمة | `critical.ts:7`، `engine.ts:105-109`، `domain/exam.ts:27` | Verified | **P1 — دفعة 1** |
| CLN-021 | تكرار صغير | معادلة تحويل الإحداثيات إلى سنتيمترات (8 مواضع) | Verified | keep |
| CLN-022 | مصدر ثانٍ | `src/data/credits.ts` | Verified | keep (محمي ومحروس باختبار) |
| CLN-023 | Scale | تسجيل يدوي للفحوص؛ `LocalizedText` يفرض كل اللغات | Verified | قرار مؤجل — محفّز: لغة ثالثة أو أداة تأليف فحوص |
| CLN-024 | تكرار | `monotone` و`interpolateAnchors` و`WarpAnchor` و`oddPart` منسوخة في 4 نماذج و`pipeline.ts` | Verified | **P2 — دفعة 3** |
| CLN-025 | معمارية | 9 أنواع لدوران الأطراف تقابلها 4 خوارزميات رسم | Verified | **P3 مؤجل** — استثناء S-STD-2 يُطلب عند التنفيذ |
| CLN-026 | تعليقات قديمة | `plan.ts:205-212,229`، `limb-effects.ts:3-8,39,205`، `pipeline.ts:233-237` | Verified | **P1 — دفعة 1، عدا `pipeline.ts` ففي دفعة 3** |
| CLN-027 | مصدر ثانٍ لقيمة سريرية | `SID_REFERENCE_CM` (102 و183) في المشاهد | Verified | keep — بند مراجعة (§7) |
| CLN-028 | تكرار | المشاهد الجانبية للرسغ واليد والكوع | Verified | **P3 مؤجل** |
| CLN-029 | تكرار صغير | مجموعتا الاختيار، ودوال `clamp` | Verified | keep |
| CLN-030 | خلل سلوكي | `OwnerPanel.tsx:24` يستدعي `useAccount("")` خارج `SessionGate` | Verified بالقراءة | **إصلاح — أول commit في دفعة 4** |
| CLN-031 | معمارية النشر | بصمات حدود الاتصال؛ `pipeline.ts` مُصنَّف حدًّا خطأً | Verified | **دفعة 2 (ب)، ثم (أ)**: قبول صريح لتحديث البصمة في كل دفعة |
| CLN-032 | تكرار | صف CSV في `attemptsCsv` و`exportOwnerPart` | Verified | keep — عقد |
| CLN-033 | تكرار صغير | تعبير UUID و`timeKey` ودوال التحقق | Verified | keep |
| CLN-034 | RTL ولغة | اتجاه الأسهم وفروق الصياغة في `ar.json` | Verified | بند مراجعة (§7) |
| CLN-035 | تكرار | دوال Assess المساعدة (`runner-data.ts:14-15` يُعاد تعريفها) | Verified | P4 — محفّز RAD-062 |
| CLN-036 | تكرار | `AssessPanel.tsx` و`FullPracticalRunner.tsx` | Verified | P4 — محفّز RAD-062 |
| CLN-037 | انحراف عن قرار | نصوص واجهة وARIA إنجليزية في Assess | Verified | يُصحَّح في جلسة الواجهة (RAD-060/062) وفق [S-ASSESS-7](DECISIONS.md#decision-s-assess-7) |
| CLN-039 | معمارية النشر | جدول الملفات المثبّتة وأسبابها (§5) | Verified | مدخل لدفعة 2 |
| CLN-040 | سكربت قديم محتمل | `scripts/verify-session4.mjs` | Hypothesis | keep في مكانه (سجل provenance يذكر مساره) |
| CLN-041 | إعداد | `noUnusedParameters` في `tsconfig` | Verified | اختياري ومنخفض. `no-unused-vars` مفعّل في lint كتحذير لا يُسقط CI |
| CLN-042 | أمان سلسلة التوريد | `npx --yes wrangler@4`، والـactions مثبتة بالوسم لا بالـSHA | Verified | بند أمان منفصل منخفض، وليس تنظيفًا (§8) |
| CLN-043 | أسلوب | لا يوجد formatter | Verified | keep — لا إعادة تنسيق شاملة |

**CLN-037 بالتفصيل:**
- **انحراف واضح:** «Choose one answer» و«Clear answer» و«Expose once» ورسالتا القفل في `AssessPanel.tsx`، ونصوص «Settings» وARIA في `PartControls.tsx` و`PracticalScene.tsx`.
- **قد يُعدّ محتوى امتحانيًا:** `CONTROL_LABELS` في `assess/presentation.ts`. السبب أن `server-presentation.ts` يتحقق منها ضمن عقد عرض السؤال المنشور. يُقرَّر صراحة عند التنفيذ.

## 4. التحقق العدائي وما أُسقط

**التحقق العدائي من بنود P1 وP2:**
- **CLN-001 وCLN-002 وCLN-003:**
  - لا استيراد بنمط `import * as` ولا `export *` ولا `require(` في `src`، ولا أي ذكر لهذه الأسماء في الوثائق الحالية أو السكربتات.
  - حذفها يترك استيرادات بلا استخدام تُحذف معها: `LowerLimbModelId` في `lower-limb-model.ts:32`، و`LOWER_LIMB_MODEL` في `lower-limb-visual.ts:7`، و`EvidenceClass` في `domain/case.ts:4`.
- **CLN-004 (أ):**
  - فُحصت كل استدعاءات الترجمة المبنية بقوالب وبمتغيرات، و`t.has` و`useMessages`.
  - لا مسار يصل إلى `myAttempts.*` أو `modality.*`. آخر استخدام لـ`myAttempts` حُذف عند إنشاء لوحة التدريب.
- **CLN-020 وCLN-026:**
  - المواقع مؤكدة.
  - تعليق `pipeline.ts` نُقل إلى الدفعة 3، لأن الملف مثبّت ببصمة. تعديله في الدفعة 1 يُسقط اختبارات schema.
- **CLN-024:**
  - لا يصل أي ملف معني إلى إغلاق الاستيراد للتصحيح، فلا يُرفع `PRACTICE_EVALUATION_VERSION`.
  - الاختبارات تستورد `interpolateAnchors` و`oddPart` من ملفات النماذج. لذلك تبقى النماذج تعيد تصديرهما كي لا يُلمس أي اختبار.
- **CLN-031:**
  - اختبارات `assess-d/e/f-schema.test.ts` تنسخ المستودع وتشغّل الحارس.
  - أي تعديل في ملف مثبّت دون تحديث بصمته يُسقط CI، لا النشر وحده.

**ما أُسقط وسببه:**

| العنصر | السبب |
|---|---|
| `runAssessJobProcess` وملفات `server-*` | نقاط دخول esbuild |
| ملفات Next الضمنية و`src/proxy.ts` | استخدام ضمني من Next |
| ملفات `.d.mts` | أنواع لاستيراد `.mjs` |
| `scripts/docs/*.test.mjs` | يشغّلها glob في `docs:test` |
| `derive-*.py` | سجل provenance |
| ملفات `supabase/checks` و`manual` | مذكورة في الوثائق |
| `lib/localized` مقابل `domain/localized` | دالة مقابل أنواع |
| المفاتيح الديناميكية (`detectorCaption*` و`rotationHelp*` و`pelvisLeg_*` و`terms.keep.p4`…) | تُبنى بقوالب أو بحلقة |
| `markerL` في بصمات scene-dom | اسم حالة وليس مفتاحًا |
| `LOCALES` | مصدر واحد، و`LEGACY_LOCALES` تاريخية مجمّدة عن قصد |
| `score.passed` مقابل `thresholdMet` | فصل موثّق |
| `validate.ts` لا يستخدمه إلا الاختبار | موثّق لمسار التأليف المستقبلي |
| `RENDERER_IDS` بعارض واحد | موثّق |
| استيراد `data` من `features` | `composeCase` فقط |
| مكوّنات React في مجلدات المنطق | تعرض ولا تحسب |
| `getImageData` | يقرأ صورة الإدخال لا الناتج |
| `pelvisShift` و`shoulderShift` | معنى مختلف عن `interpolateAnchors` |
| مفاتيح `tuning.ts` | كلها مستخدمة |
| شكل الصفحات المتكرر | نمط Next القياسي |
| اختبارات `scripts/` | كلها تعمل في CI |
| بناءان في CI | هدفان مختلفان |
| `NOTE_COLUMNS` | مذكور في PILOT_SUPABASE_SETUP |
| `pg` | تستخدمها سكربتات `assess` |

## 5. حدود الاتصال المثبّتة (CLN-031 وCLN-039)

`scripts/pages/frontend-schema.json` يثبّت SHA-256 لـ25 ملفًا يكتشفها `pilot-schema-gate.mjs` حدودًا للاتصال بقاعدة البيانات:
- **23 حدًّا حقيقيًا:** تستورد supabase-js، أو تستدعي `getPilotClient`، أو تستخدم `client.from` أو `client.rpc` أو `client.schema`. هي ملفات `src/features/pilot` (`client` و`useAccount` و`profile-read` و`training` و`activity` و`attempt-logger` و`FeedbackBox` و`AttemptRecorder` و`useOwnerData` و`OwnerPanel` و`OwnerActivity` و`TrainingSummary` و`PilotSessionKeeper`)، وملفات `src/features/assess` (`admin-data` و`content-data` و`runner-data` و`history-data` و`practical-data` و`OwnerAssessPanel` و`OwnerContentPanel` و`HistoryPanel` و`AssessPanel` و`AssessConsent`).
- **`src/features/radiograph/pipeline.ts` — تصنيف خاطئ:** السبب الوحيد `Float32Array.from`. كاشف الحد يستثني `Array` و`Buffer` و`Object` فقط، وجامع الاستدعاءات يستثني `Float32Array` أيضًا.
- **`src/features/pilot/owner-data.ts` — مثبّت بالصدفة، والتثبيت مرغوب:** يُكتشف فقط عبر حقل التاريخ `filters.from`، مع أنه يبني فعلًا عقد RPC. يصبح تثبيته صريحًا في الدفعة 2.

إثبات قاعدة البيانات (`requiredMarker`) يحسب ملفات SQL والفحوص فقط، فتحديث بصمة ملف واجهة لا يتطلب تحققًا حيًا جديدًا.

<a id="batches"></a>
## 6. خطة الدفعات (كل دفعة Draft PR مستقل بموافقة منفصلة)

> **تعديل الترتيب:** تشخيص حد الوقت بعد الدفعة 1، وCLN-037 في الدفعة 4، ودفعة 6 بعد الدفعة 5، وCLN-042 بعدها، بحسب [قرار المالك](DECISIONS.md#cleanup-sequencing-owner-2026-10-22).

**الدفعة 1 — تنظيف آمن P1** — مخاطرة **منخفضة**
- **البنود:** CLN-001، وCLN-002 دون `PA_FOREARM`، وCLN-003، وCLN-004 (أ)، وتعليقات CLN-020 وCLN-026 عدا `pipeline.ts`.
- **البصمات:** لا شيء. لا ملف مثبّت.
- **الاختبارات:** `npm run check` كامل، وcharacterisation والـgoldens وscene-dom مطابقة دون إعادة توليد، وتطابق بصمات الحدود، وbuild مرة واحدة، و`docs:check` و`status:check`.

**الدفعة 2 — CLN-031 (ب)** — مخاطرة **متوسطة**، لأنه حارس نشر
- **التغيير:**
  - قائمة استثناء موحّدة بين كاشف الحد وجامع الاستدعاءات.
  - إزالة بصمة `pipeline.ts`.
  - تثبيت صريح لـ`owner-data.ts`.
  - اختبار جديد في `frontend-schema.test.ts`، وتحديث `DEPLOYMENT.md` عند الحاجة.
- **المراجعة:** تغيير البصمات يتم بمراجعة المالك.
- **الاختبارات:** `frontend-schema` و`assess-d/e/f-schema`، و`npm run check`.

**الدفعة 3 — CLN-024، مع تعليق `pipeline.ts`** — مخاطرة **منخفضة-متوسطة**
- **التغيير:**
  - وحدة محايدة جديدة `src/features/limb-warp/` لا تستورد شيئًا. النماذج الأربعة و`pipeline.ts` تستوردها، فلا اتجاه استيراد جديد ولا حلقة.
  - النماذج تعيد تصدير الدالتين للاختبارات.
  - ثوابت كل أسرة تبقى في مكانها.
- **البصمات:** لا شيء بعد الدفعة 2.
- **إصدار المحرك:** لا يُرفع (§4).
- **الاختبارات:** اختبارات العرض والدوران، والـgoldens وscene-dom وcharacterisation مطابقة، و`check` كامل، وbuild مرة واحدة.

**الدفعة 4 — RAD-060** — مخاطرة **منخفضة** للإصلاح
- **أول commit:** CLN-030، أي `OwnerPanel.tsx` يستخدم `useSessionAccount()`، مع تحديث بصمته بقبول صريح.
- **الاختبار المفضّل:** اختبار ثابت يمنع استدعاء `useAccount` خارج `SessionGate`، دون اعتمادية جديدة. يُؤكَّد مع المالك قبل التنفيذ.
- **بعد ذلك:** زر الإغلاق.
- **الاختبارات:** `owner-*` و`account-state`، واختبارات schema، و`qa:a11y` لصفحة المالك.

**الدفعة 5 — CLN-004 (ب)** — مخاطرة **منخفضة-متوسطة**
- **التغيير:** حذف المفاتيح الـ19 من اللغتين، وملاحظة في `ARABIC_TERMINOLOGY.md` لـ`cueDetector` و`sideAlt` و`angleReadout` دون حذف سجلها.
- **شرط مسبق:** تشغيل `qa:visual` و`qa:a11y` لـEN/AR عند 390 و1440، قبل التغيير وبعده، بإذن المالك.

**أأمن نقطة بداية:** الدفعة 1، وأول commit فيها CLN-001. الملفات غير مستوردة، وغير مثبّتة، وخارج إغلاق التصحيح.

**المؤجلات بمحفّزاتها:**
- **CLN-016 (ومعه CLN-017):** استئناف forearm، أو تصحيحات المراجع على النصوص المشتركة. جلسة تعميم مستقلة للبيانات فقط، دون نماذج الرسغ واليد والكوع.
- **CLN-025 وCLN-028:** المحفّز نفسه.
- **CLN-035 وCLN-036 والجزء الأسلوبي من CLN-037:** RAD-062.
- **قرارات CLN-005 وCLN-006 وCLN-010 وCLN-011 وCLN-012 وCLN-023:** مؤجلة حتى انتهاء الدفعات الخمس.

<a id="rad-019-review-items"></a>
## 7. بنود مراجعة المعلّم والفيزيائي والعربية (RAD-019)

| البند | المطلوب من المراجعة |
|---|---|
| CLN-018 | مراجعة محتوى `imageCriteria` في الفحوص الـ18 قبل عرضه في Learn أو الواجهة. لا يُعرض قبل ذلك |
| CLN-027 | قيمتا SID المرجعيتان في المشاهد: 102 cm للأطراف و183 cm للصدر. تبقيان في المشهد، ويُحدَّث المشهد مع أي تغيير في نطاق قاعدة SID. النقل إلى البيانات يكون فقط عند تغيير فعلي |
| CLN-034 | اتجاه الأسهم في `ar.json` («←» و«→» للمعنى نفسه، مثل `radiograph.effects.rotation.title` مقابل `radiograph.ap.effects.rotation.title`)، وفروق الصياغة («يُفترض أن» مقابل «يجب أن») لنص إنجليزي واحد. تُضاف إلى [ARABIC_TERMINOLOGY](ARABIC_TERMINOLOGY.md) عند المراجعة |

## 8. البنود المفتوحة

- **حد الوقت في `src/features/assess/server-runtime.test.ts`:**
  - تجاوز اختبار واحد حد 5000ms تحت التشغيل الكامل، ونجح ملفه منفردًا. هذا خطر على CI.
  - **التشخيص الأولي من الكود:** الاختبار يُنشئ PGlite جديدة ويطبّق كل الـmigrations. اختبارات كثيرة أخرى تفعل الشيء نفسه بالتوازي، والكلفة تزيد مع كل migration جديد.
  - **المطلوب لاحقًا:** قياس زمنه منفردًا وتحت الحمل قبل أي تعديل. لا رفع للحد وحده، وأي تعديل بموافقة المالك.
- **CLN-042:** تثبيت إصدار wrangler والـactions بند أمان سلسلة توريد منفصل منخفض الأولوية.
- **سقف الأدوار والحالات:** `ProfileRole` و`isStatus` و`parseProfile` و`parseParticipant` و`actionsFor` مكتوبة صراحة. تُصمَّم ضمن RAD-062 مع RLS.
- **CLN-040 وCLN-010:** فرضيتان، تُتحقق منهما عند تشغيل أدوات `qa` بإذن.

## 9. التحقق المنفذ أثناء التدقيق

- `npm ci` مرة واحدة.
- `typecheck` و`lint`: نجحا، و`lint` بلا تحذيرات.
- `npm test`: فشل اختبار واحد بانتهاء الوقت (§8) ونجحت البقية. أُعيد ملفه منفردًا مرة واحدة فنجح.
- فحوص المترجم الإضافية في §2.
- **لم يُشغَّل:** build ولا `qa:*` ولا أوامر توليد التوقعات، ولا أي اتصال بقاعدة بيانات أو مزوّد.
- **ما يثبته هذا التقرير وما لا يثبته:** يثبت بنية الكود فقط، ولا يثبت صحة طبية أو تراخيص أو نشرًا.
