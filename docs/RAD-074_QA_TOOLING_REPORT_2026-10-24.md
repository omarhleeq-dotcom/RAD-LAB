# RAD-074 — إصلاح أدوات فحص المتصفح على واجهة المحاكي الحالية (تقرير الدفعة)

تغيير أدوات فقط (scripts/qa وpackage.json ووثائق). لا كود منتج ولا `messages/*.json` ولا ملفات بصمات أو golden أو characterisation. الترتيب وفق S-STD-1.

## 1. الانحرافات والميزانية

**الهدف:** أن تصل سكربتات `scripts/qa` إلى ضوابط المحاكي كما يصل المتعلّم (تبويبات الهاتف، ورقة الحالة، «الضبط الدقيق») عبر مساعد واحد، وأمر واحد `qa:exam-audit` يحل محل السكربتين المؤقتين لجلستي RAD-072.

**الميزانية المعلنة قبل التعديل:** جديد: `scripts/qa/workspace.mjs`، `scripts/qa/exam-audit.mjs`، هذا التقرير. تعديل: سكربتات `scripts/qa` المعطوبة فقط، `package.json` (سطر واحد)، `docs/DOCS_CHECKS.md` (قسم واحد)، `AGENTS.md` (رابط من سطر واحد في جدول QA)، `docs/project-status.md` (مهمة RAD-074)، `docs/HANDOFF.md`.

**انحرافات/إضافات يجب ذكرها:**
- `scripts/qa/scenarios.json`: سلسلتان عربيتان في `chamberLabels` («عرض الكاسيت» ← «عرض الكاشف») لأن نص المنتج الحالي «عرض الكاشف». هذا ملف يقرؤه اختبار وحدة (`scenario-matrix.ts`) لكن لا يستعمل `chamberLabels` إلا run-matrix؛ شُغّل `npx vitest run src/features/qa` (13 ملفًا، 448 اختبارًا) نجح. لم يُشغَّل `qa:golden`.
- `label-collisions.mjs`: خيار اختياري جديد `--whole-detector` (الافتراضي كما كان) لفصل ما يظهره العرض الملائم عن عرض الكاشف كله.
- `a11y-audit.mjs`: `mkdirSync` لمجلد OUT (كان يفشل بعد انتهاء الفحوص إن لم يوجد)؛ `phone-navigation-audit.mjs`: `CHROMIUM` من البيئة بدل مسار ثابت؛ `hand-lateral-layout.mjs`: زر Expose باسمه الدقيق (المحدد القديم يطابق زرًا آخر بالعربية).
- الاختبار الذاتي عدّل مؤقتًا `PhoneWorkspace.tsx` محليًا ثم أُعيد بـ`git checkout` وأُعيد البناء؛ لم يُلتزم (انظر §6).
- `npm ci` + `npm i --no-save playwright axe-core` + `npm run build` للبيئة؛ لا تغيير في ملفات متتبَّعة.

## 2. ما أُنجز وما أُسقط

**أُنجز:** جرد 20 سكربتًا؛ مساعد مشترك؛ إصلاح 13 سكربتًا؛ `qa:exam-audit`؛ توثيق؛ إثبات على كل الفحوص السبعة عشر؛ اختبار ذاتي.

**لم يُصلح (بقرار):** `phone-navigation-audit` (سلوك الدخول تغيّر، §7)؛ سيناريو `clip-margin-only` في run-matrix (§7). لم يُخفَّف أي تأكيد ولم يُعدَّل أي عتبة.

**الجرد** (قبل الإصلاح → بعده؛ كل التشغيل على main الحالي، EN/AR، 390 و1440 حيث ينطبق):

| السكربت | قبل | بعد |
|---|---|---|
| pelvis، shoulder | معطوب: `getByRole('slider','Tube angulation')` انتهت مهلته (تبويب مخفي) | يعمل: 84 فحصًا، 0 إخفاق لكل منهما |
| ankle (2 فحصين)، elbow (2)، hand (2)، wrist (2)، lower-limb (4)، ap، lateral | معطوب: `locator.tap` على label «element is not visible» (تبويب مخفي/ورقة الحالة) | يعمل: كلها «all … checks passed» لكل المعرّفات الأحد عشر + ap + lateral |
| a11y | معطوب: نقر EXPOSE يُحجب بورقة الحالة؛ ثم لا يكتب OUT | يعمل: 48 ok، 0 مخالفة |
| label-collisions | معطوب: منزلق «Patient rotation» (تبويب مخفي) | يعمل (نتائجه في §7) |
| run-matrix | معطوب: `tap` «not visible» | يعمل: 3147/3149 (الإخفاقان في §7) |
| hand-lateral-layout | معطوب: label مخفي، ثم زر Expose خاطئ بالعربية | يعمل: الشريط 71.4% (≥70%) EN وAR |
| simulator-layout | يعمل (مصمَّم لـUI-3): 6 فحوص افتراضية 1520 فحصًا، 84 axe، 0 إخفاق | بلا تعديل: 17 فحصًا 4252 فحصًا، 238 axe، 0 إخفاق |
| result-marker | يعمل (مصمَّم لـUI-3) | بلا تعديل: 510/510 موضعًا لـ17 فحصًا |
| ui1-pages | يعمل على تصدير pilot-synthetic | بلا تعديل: 136 فحصًا، 36 axe |
| credits | يعمل على تصدير بلا pilot: 886 فحصًا، 76 axe (على تصدير pilot يُحجب المسار فتنتهي مهلة العنوان؛ هذا شرط تشغيل لا عطل) | بلا تعديل |
| phone-navigation | معطوب: مسار chromium ثابت `/usr/bin/chromium` | بعد إصلاح المسار ما زال يفشل: بعد الدخول تبقى الصفحة `/en/account` والسكربت ينتظر `/en` (§7). لم يُصلح |
| assess-history/owner/practical/runner | لم تُشغَّل: Assess مؤجل |  |
| pilot-consent/feedback/owner/reset/schema | لم تُشغَّل: تحتاج Supabase حيًّا؛ لا تشغيل على خدمة حية |  |
| appearance، category-history، session-gate، my-attempts | لم تُشغَّل: خارج القائمة المطلوبة (حسابات/دخول synthetic؛ my-attempts مرتبط بـAssess المؤجل) |  |

## 3. لكل مهمة

**RAD-074 (جديدة، `review`، تنتظر المالك):** السبب الجذري واحد: (1) ورقة الحالة modal تُفتح عند التحميل على الهاتف، (2) الضوابط في أربعة تبويبات والمخفي منها `hidden`، (3) «الضبط الدقيق» `<details>` مطوي. الحل: `scripts/qa/workspace.mjs` (`startPractice` و`reveal` و`driver`): يغلق الورقة بزر «Start»، ويفتح التبويب صاحب اللوحة (يسأل الـDOM عن `tabpanel` الأب، وإلا يجرّب التبويبات) وينقر ملخص `<details>` المطوي، ثم يعيد المحدد. يعمل على الحاسوب بلا فعل. محددات بالدور والاسم فقط، بلا `data-testid`. الأمر `npm run qa:exam-audit -- <معرّفات>|--all` موثّق في [DOCS_CHECKS](DOCS_CHECKS.md#browser-audits) مع رابط سطر واحد في جدول AGENTS.

## 4. التغييرات المشتركة وScale

- المساعد المشترك واحد ولا نسخ في السكربتات؛ `qa:exam-audit --all` يستخرج المعرّفات من سجل `src/data/exams/index.ts` فلا قائمة ثابتة تتقادم، ومعرّف بلا صفحة مركز يفشل صراحة.
- **سقوف معلنة (S-STD-3):** (أ) المساعد يعرف أسماء التبويبات الأربعة وعتبة 1023px من المنتج (`workspace-tabs.ts`، `PHONE_QUERY`)؛ إضافة تبويب أو تغيير العتبة تحتاج تحديث `workspace.mjs`، والحدّ يظهر كخطأ صريح «control not visible in any phone tab». (ب) نص الاستخراج من السجل يعتمد صيغة `from "./xray/<id>"`؛ تغيير الصيغة يُفشل التشغيل بصراحة (قائمة فارغة). (ج) الفحوص يدوية لا CI، وتحتاج بنية محلية (build + playwright + axe) كما هو معتاد؛ قرار إدخالها في CI مفتوح للمالك. (د) `qa:exam-audit` يستعمل الإعدادات الافتراضية فلا يختبر التسجيل؛ ذلك لسكربتات كل فحص.

## 5. الطب والتسجيل

لا تغيير: لا قيم ولا قواعد ولا نصوص منتج ولا صور. ملفات golden وcharacterisation وبصمات المشاهد لم تُلمس، و`git diff --stat origin/main` لا يظهر إلا scripts/qa وpackage.json وdocs وسطر AGENTS.

## 6. التحقق

| الفحص | النتيجة |
|---|---|
| سكربتات الفحوص الفردية (17 فحصًا، EN/AR، 390/1440) | كلها تمر؛ pelvis وshoulder 84 فحصًا لكل منهما |
| **`qa:exam-audit --all`** (17 فحصًا × EN/AR × 390/1440) | **1122 فحصًا، 0 إخفاق** (66 لكل فحص: 20 على الهاتف و13 على الحاسوب لكل لغة) |
| simulator-layout (17) | 4252 فحصًا، 238 axe، 0 إخفاق |
| result-marker (17) | 510/510 |
| run-matrix (53 سيناريو، EN+AR، 3 أجهزة) | 3147/3149 (إخفاقان معلنان §7) |
| a11y | 48 ok، 0 مخالفة |
| label-collisions (15 فحصًا بمواصفات الحالات؛ الصدر PA والجانبي بلا ملف حالات) | 0 تداخل في أي حالة؛ **«خارج الإطار» في كل حالات 390** (§7)؛ بـ`--whole-detector`: 0 إلا الحوض EN 390 (81 حالة) |
| hand-lateral-layout | 71.4% EN وAR |
| credits (تصدير بلا pilot) / ui1-pages (تصدير pilot synthetic) | 886 فحصًا/76 axe؛ 136 فحصًا/36 axe |
| **اختبار ذاتي** | عُدّل `PhoneWorkspace.tsx` محليًا: حُذف `aria-label` زر تفاصيل الحالة وأُخفي زر Expose. شُغّل `qa:exam-audit chest-pa-erect pelvis-ap-supine`: **124 فحصًا، 24 إخفاقًا** (كلها 390: `axe button-name` على التبويبات الأربعة، و«Expose is visible and enabled»، وانتهاء مهلة النقر؛ الحاسوب نظيف). `pelvis-audit.mjs` المُصلَح توقف بخطأ «control not visible after opening its tab/panel». أُعيد الملف بـ`git checkout` وأُعيد البناء، وعاد الفحص إلى 66/66 للحوض. لم يُلتزم الكسر |
| lint للسكربتات المتغيّرة (`npx eslint`) | 0 أخطاء |
| `docs:check --base origin/main` | 0 أخطاء، 0 تحذيرات مراجعة |
| `docs:test` | 75 نجحت، 0 فشل |
| `status:check --base origin/main --require-previous` | OK |
| `git diff --check` | نظيف |

**لم يُشغَّل:** `qa:golden`، `qa:characterise`، بناء التطبيق للتسليم (لا كود منتج)، أي سكربت Assess/pilot، appearance/category-history/session-gate/my-attempts، وفحص المالك على الهاتف.

## 7. بنود مفتوحة ونتائج الواجهة الحقيقية

1. **(نتيجة واجهة) إطار العرض الملائم على الهاتف 390:** في كل الفحوص الخمسة عشر المقيسة وفي كل الحالات (إرشادات on وoff) تقع تسميات الإطار «Head/Feet/Detector» (ومع الإرشادات «Patient's right/left» و«Midsagittal plane» و«Centering target region» وما يعادلها) خارج `viewBox` المقصوص، و`overflow: hidden` على الـSVG، فلا تظهر حتى يُضغط «Whole detector». أمثلة: الحوض `viewBox` −6 −6 442 362 والتسمية عند y = −137. التداخل بين التسميات: 0. القرار للمالك: هل تُنقل التسميات داخل الإطار الملائم أم يكفي أن تُعرض في «Whole detector»؟ لم تُغيَّر الواجهة.
2. **(نتيجة واجهة) عرض الكاشف الكامل على الهاتف، الحوض EN 390 مع الإرشادات:** تسمية «Patient's left» خارج الإطار بنحو 20 وحدة في 81 حالة؛ بالعربية سليم.
3. **سيناريو `clip-margin-only` (run-matrix، سطح المكتب EN/AR):** يضبط ارتفاع الحقل 29.6 سم لكن منزلق «Field height» خطوته 1 سم فيقرّب إلى 30، فلا تظهر ملاحظتا «margin only» (0 بدل 2). لا يمكن بلوغ السيناريو عبر الواجهة؛ إما تدخّل المالك (دقة المنزلق) أو إعادة تعريف السيناريو في جلسة تسمح بتغيير الاختبارات. لم يُخفَّف التأكيد.
4. **phone-navigation-audit:** بعد الدخول تبقى الصفحة `/en/account` (دخول مستقل بعد RAD-066) والسكربت يتوقع `/en` ثم لوحة الرئيسية؛ تعديل التوقع يغيّر المفحوص، فلم يُعدَّل.
5. **فجوات تغطية:** لا ملف حالات label-collisions للصدر PA ولا الصدر الجانبي؛ credits وphone-navigation يحتاجان تصديرين مختلفين (بلا pilot / pilot synthetic).
6. **وصف RAD-072 في project-status** ما زال يقول إن المرحلة B على PR مسودة مع أن #119 مدموج؛ لم أغيّره (خارج النطاق).
7. تحذيران lint قديمان في `simulator-layout-audit.mjs` (خارج النطاق).

**إجابتا AGENTS:** هل تغيّر الحكم؟ لا: لم تُعدَّل قاعدة في AGENTS ولا DECISIONS؛ أُضيف رابط واحد إلى أمر الفحص في سطر جدول QA بلا إعادة صياغة، وقسم جديد في DOCS_CHECKS لا يحل محل قاعدة. هل بقي رابط الدليل الأصلي؟ نعم: لم يُحذف أو يُختصر أي نص قائم، وقواعد exam-recipe §7 والعتبات في السكربتات كما هي.

## 8. قائمة المالك والجلسة التالية

- ادمج PR المسودة بقرارك وحدك؛ لا أثر على المنتج.
- قرّر: (1) تسميات الإطار خارج العرض الملائم على 390؛ (2) «Patient's left» في الحوض EN 390 بعرض الكاشف الكامل؛ (3) دقة منزلق ارتفاع الحقل وسيناريو `clip-margin-only`؛ (4) هل تُدخل فحوص المتصفح إلى CI؛ (5) تحديث توقع `phone-navigation-audit` لسلوك الدخول.
- **الجلسة التالية:** RAD-069 الجزء A (صفحة النتيجة)، تنتظر مدخلات المالك. للفحص في أي جلسة قادمة: `BASE=http://localhost:3100 npm run qa:exam-audit -- <معرّفات>`.
