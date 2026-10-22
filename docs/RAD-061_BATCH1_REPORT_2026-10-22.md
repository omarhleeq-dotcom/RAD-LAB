# تقرير RAD-061 — الدفعة 1: تنظيف P1 الآمن (2026-10-22)

الدفعة 1 كما عرّفها [تقرير التدقيق](RAD-061_CODE_AUDIT_REPORT_2026-10-22.md#batches) (#97)، بموافقة المالك الصريحة على هذه الدفعة وحدها. لا تغيير في سلوك أو تسجيل أو قيم طبية أو رسم أو اختبارات.

## 1. الانحرافات والميزانية
- **الهدف:** حذف الكود الميت والمفاتيح غير المعروضة وتصحيح التعليقات القديمة، دون أي أثر في وقت التشغيل.
- **القاعدة:** #97 غير مدمج وقت التنفيذ، وهو يحمل التقرير وحالة `review` لـRAD-061. لذلك تفرّع هذا الفرع من رأس #97 (`cf8729c`) لا من `origin/main` مباشرة. الفرق عن #97 هو الدفعة 1 فقط؛ وإن دُمج #97 أولًا فلا تعارض متوقع.
- **الميزانية (12 ملف كود/رسائل + 3 وثائق + هذا التقرير):** `wrist-visual.ts`، `lower-limb-geometry.ts`، `lower-limb-model.ts`، `lower-limb-visual.ts`، `domain/case.ts`، `messages/en.json`، `messages/ar.json`، وتعليقات فقط في `critical.ts`، `engine.ts`، `domain/exam.ts`، `radiograph/plan.ts`، `radiograph/limb-effects.ts`؛ ووثائق `project-status.md` و`HANDOFF.md` وهذا التقرير. لا انحراف عنها. `pipeline.ts` لم يُلمس.
- **الطابع الزمني:** المراجعة 201 (09:00Z) سُجّلت في جلسة سابقة قبل الوقت الفعلي، والمراجعة 202 (09:30Z) تلتها في #97. رُفعت المراجعة إلى 203 بـ`09:45:00Z` (بعد آخر سجل) دون إعادة كتابة أي طابع سابق.

## 2. المنجز والمُسقَط
- **المنجز:** CLN-001 وCLN-002 (دون `PA_FOREARM`) وCLN-003 وCLN-004 (أ) وتعليقات CLN-020 وCLN-026 عدا `pipeline.ts`.
- **المُسقَط عمدًا:** `PA_FOREARM` (قرار المالك: keep)، مفاتيح CLN-004 (ب) (الدفعة 5)، تعليق `pipeline.ts` (الدفعة 3). أُعيد التحقق بـrg وtypecheck أن كل رمز محذوف بلا مستخدم قبل الحذف.

## 3. لكل بند (أسطر محذوفة/مضافة)
| البند | الملف | حذف/إضافة |
|---|---|---|
| CLN-001 | `wrist-visual.ts` | 42/2: حُذفت `WRIST_VISUAL` و`WristPaVisual` و`wristPaVisual` و`WristLateralVisual` و`wristLateralVisual` و`bumpedU` و`clamp` المحلية، وأُعيدت كتابة التعليق الرئيسي. بقيت `WRIST_SIDE` و`slabX` |
| CLN-002 | `lower-limb-geometry.ts` | 1/0: `lowerLimbCmPerPx` (بقي `IMAGE[k].cmPerPx`) |
| CLN-002 | `lower-limb-model.ts` | 4/0: `modelUsesReference` واستيراد `LowerLimbModelId` |
| CLN-002 | `lower-limb-visual.ts` | 4/0: `MAX_DRAWN_DEG` واستيراد `LOWER_LIMB_MODEL` |
| CLN-003 | `domain/case.ts` | 7/1: `EvidenceStatus` وتعليقها، وإزالة `EvidenceClass` من الاستيراد |
| CLN-004 (أ) | `messages/en.json`، `messages/ar.json` | 37/0 لكل ملف |
| CLN-020 | `critical.ts` | 1/1: أوزان الفئات «تُحدَّد لكل فحص» بدل ربطها بأوزان الصدر |
| CLN-020 | `engine.ts` | 1/1: اتجاه العلامة «لا يُعكس بلغة الواجهة/RTL» بدل ربطه بعرض PA الصدر |
| CLN-020 | `domain/exam.ts` | 2/2: مسار الأرشيف `docs/archive/planning/PLATFORM_ARCHITECTURE-until-2026-10-16.md`، وأمثلة الفحوص الحالية |
| CLN-026 | `plan.ts` | 4/4: لم يعد «لا تأثير مسجّلًا» صحيحًا؛ الخطوة المرسومة في `pipeline.ts`؛ التأثير مشترك بين فحوص الأطراف |
| CLN-026 | `limb-effects.ts` | 5/5: التأثير مشترك بين كل فحوص الأطراف لا الرسغ واليد فقط؛ نماذج `LowerLimbModelId` تشمل الكتف والحوض والقدم والركبة والكاحل |

**مفاتيح الرسائل المحذوفة (33 من كل ملف، متطابقة في EN وAR):** `modality.examsTitle`؛ و`myAttempts.`: `title`, `intro`, `refresh`, `first`, `loading`, `error`, `retry`, `expired`, `signInAgain`, `pageCount`, `empty`, `end`, `attemptNo`, `score`, `result`, `passed`, `notPassed`, `details`, `savedOnly`, `case`, `version`, `language`, `id`, `started`, `finished`, `critical`, `none`, `categories`, `checks`, `checksHint`, `settings`, `next`. لا استخدام لـ`useTranslations("myAttempts"|"modality")` في `src` أو السكربتات.

## 4. التغييرات المشتركة وScale
- لا تغيير مشترك: كل ما حُذف بلا مستورد. لم يُلمس أي ملف مثبّت؛ تحقق `inspectBrowserBoundaries()` من تطابق البصمات الـ25 كلها.
- **Scale (S-STD-3):** لا سقف جديد. الحذف يخفف الصيانة اليدوية. تبقى مفاتيح CLN-004 (ب) والتعليق في `pipeline.ts` بندين مفتوحين لدفعتيهما.

## 5. الطبي والتسجيل
لا تغيير في قيمة طبية أو تسجيل أو ضبط أو رسم. التعليقات الجديدة لا تضيف ادعاءً طبيًا؛ أُزيل منها فقط ما لم يعد يطابق السلوك.

## 6. QA (نتائج فعلية)
- `npm run check`: typecheck وlint نجحا. الاختبارات: 147 ملفًا نجح، وفشل `server-runtime.test.ts` الوحيد (مهلة 5000ms، الخطر المعروف). أُعيد تشغيل الملف وحده مرة واحدة: **18/18 نجح**. لم يُعدَّل أي اختبار.
- characterisation والـgoldens وscene-dom ضمن اختبارات `npm run check` ونجحت دون إعادة توليد؛ لم يُشغَّل `qa:golden` ولا `qa:characterise`، ولم يتغير أي ملف تحت `scripts/qa` أو الاختبارات.
- بصمات الحدود: 25/25 مطابقة (`inspectBrowserBoundaries()` مقارَنة بـ`frontend-schema.json`)، و`frontend-schema.test.ts` نجح.
- `npm run build`: نجح مرة واحدة.
- `docs:check`: 0 أخطاء و0 تحذيرات مراجعة. `status:check -- --base origin/main --require-previous`: OK (مع إشعار تعارض مصدر مفتوح على RAD-024 لا يخص هذا العمل). `git diff --check`: نظيف.
- لم تُشغَّل فحوص المتصفح/axe (لا تغيير مرئي؛ مفاتيح الرسائل لا يصل إليها أي مسار).

## 7. بنود مفتوحة
- مهلة `server-runtime.test.ts` تحت الحمل الكامل (سجّلت عملية الفشل مرة وعبرت منفردة)؛ تشخيصها قبل أي تعديل.
- الدفعات 2–5 تنتظر موافقات منفصلة؛ لم تبدأ الدفعة 2.
- مراجعة المالك التي تقرر هل يُدمج #97 قبل هذا الـPR.

## 8. قائمة المالك
- [ ] راجع diff الدفعة 1 (حذف فقط + تعليقات).
- [ ] تأكد أن `PA_FOREARM` باقٍ.
- [ ] CI أخضر على الـPR.
- [ ] دمج #97 قبل هذا الـPR أو بعده، وأي ترتيب مقبول.
- [ ] موافقة منفصلة على الدفعة 2 حين تريد.

**الطلب التالي المقترح:** «RAD-061 الدفعة 2: CLN-031 (ب) بموافقة المالك، من أحدث origin/main.»
