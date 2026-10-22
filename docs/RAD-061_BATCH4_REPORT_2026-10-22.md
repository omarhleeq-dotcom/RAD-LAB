# تقرير RAD-061 — الدفعة 4: CLN-030 وCLN-037 وتعليقا pipeline.ts، وزر RAD-060 محجوب (2026-10-22)

الدفعة 4 كما عرّفها [تقرير التدقيق](RAD-061_CODE_AUDIT_REPORT_2026-10-22.md#batches) والبندان 2 و8 من [قرار ترتيب التنظيف](DECISIONS.md#cleanup-sequencing-owner-2026-10-22)، بموافقة المالك على هذه الدفعة وحدها. الفرع من `origin/main` بعد دمج #101 (تحقق `docs:context -- --pr 101`: merged). Draft PR واحد، commit لكل جزء. برمجة Assess خارج هذه الدفعة تبقى مؤجلة.

## 1. الانحرافات والميزانية
- **الهدف:** إصلاح سلوك CLN-030، وزر إغلاق الإسناد (RAD-060)، وتعريب واجهة Assess (CLN-037)، وتصحيح تعليقين في `pipeline.ts`، دون أي أثر في التسجيل أو المحاكي أو الرسم.
- **انحراف 1 — الجزء 2 (RAD-060) لم يُنفَّذ:** تطبيقًا لقاعدة «إن لزم شيء في قاعدة البيانات فتوقف وأبلغ»:
  - `assess.close_assignment_v1(p_assignment)` موجودة ومنحتها لـ`authenticated` في `20261020001100_assess_retention.sql`.
  - القراءة الوحيدة للمالك `owner_page_v1('assignments')` في `20261020000600_assess_assignments.sql:173` تعيد `id, name, track, version, revision` فقط، بلا `closed_at`، ولم يُعد تعريفها في migration لاحقة.
  - المالك لا يقرأ `assess.assignments` مباشرة (`revoke all on all tables in schema assess`).
  - النتيجة: الواجهة لا تستطيع أن تعرض الزر «للإسناد المفتوح فقط»، ولا أن «تُظهر الحالة المغلقة» بعد إعادة التحميل. والدالة لا تعيد خطأ عند إغلاق مغلق أصلًا، فلا تكشف الحالة أيضًا.
  - تحقيق ذلك يتطلب تغيير مخرَج RPC، أي migration جديدة. هذا ممنوع في هذه الدفعة، فتوقفت عند الجزء 2 وأبلغت المالك. الخيارات في §7. لم يُضف حل مؤقت (علامة جلسة) دون قرار.
- **انحراف 2 — حالة RAD-060:** طُلب نقلها إلى `review`، لكن لا كود مدموجًا ولا منفّذًا لها. نُقلت إلى `blocked` مع `waiting_on: owner` وسبب الحجب، بدل حالة توحي بالتنفيذ.
- **وثيقة إجراء console:** لم تُعدّل، لأنه لا زر يُذكر فيها.
- **الميزانية المعلنة قبل التحرير والتزامها:**
  - **الجزء 1:** `OwnerPanel.tsx` (مثبّت)، و`src/features/pilot/session-account.test.ts` (جديد)، و`scripts/pages/frontend-schema.json`.
  - **الجزء 3:**
    - المكوّنات: `AssessPanel.tsx` (مثبّت)، و`PartControls.tsx`، و`PracticalScene.tsx`.
    - الرسائل والوثائق والصفحة: `messages/en.json` و`ar.json`، و`ARABIC_TERMINOLOGY.md`، و`src/app/[locale]/assess/page.tsx`، و`frontend-schema.json`.
    - الاختبارات: `runner-state.test.ts` و`practical-presentation.test.ts`، لغلاف مزوّد إنجليزي فقط.
  - **الجزء 4:** `pipeline.ts`.
  - **التسليم:** `project-status.md` و`HANDOFF.md` وهذا التقرير.
  - **إضافة واحدة داخل الجزء 3:** اختبار جديد `src/features/assess/ui-language.test.ts` لتغطية EN/AR، ولا يمس أي ملف آخر.
  - لا ملف خارج ذلك.
- **تعديل اختبارين قائمين:** `PartControls` و`PracticalScene` صارا يستدعيان `useTranslations`، فلا يُعرضان بلا مزوّد. لُفّ استدعاء العرض في الاختبارين بـ`NextIntlClientProvider` إنجليزي، بالنمط نفسه في `scene-dom.test.ts`. **لم يتغير أي توقع.**

## 2. المنجز والمُسقَط
| الجزء | البند | الحالة |
|---|---|---|
| 1 | CLN-030 | منجز (commit أول) |
| 2 | RAD-060 زر الإغلاق | **غير منجز — محجوب بحاجة قاعدة بيانات** (§1، §7) |
| 3 | CLN-037 وعنوان صفحة `assess` | منجز |
| 4 | تعليقا `pipeline.ts` | منجز |

## 3. لكل جزء
**الجزء 1 — CLN-030 (`19f9473`):**
- `OwnerPanel.tsx`: صار `useSessionAccount()` من `SessionGate` بدل `useAccount("")`، واستيراده بدل استيراد `useAccount`.
- النتيجة: لا نسخة حساب ثانية، فلا قراءة profile مكررة ولا heartbeat أولي إضافي عند فتح صفحة المالك. السلوك غير ذلك مطابق، لأن `useSessionAccount` يعيد كائن `useAccount` نفسه الذي ينشئه `SessionGate`.
- `redirectTo` الفارغ كان يُستخدم فقط في التسجيل وإعادة التعيين، ولا يستدعيهما `OwnerPanel`.
- **الاختبار الذي اختاره المالك** هو `session-account.test.ts`، ثابت بلا اعتمادية جديدة:
  - يمسح كل ملفات `src/` ويفشل إن وُجد استدعاء `useAccount(` أو استيراد قيمة `useAccount` (مع الاسم المستعار).
  - المستثنى: `SessionGate.tsx` و`useAccount.ts` والاختبار نفسه.
  - `import type` و`useSessionAccount` مسموحان.
  - حالة ثانية تثبت الكشف على أمثلة مصطنعة.
- **أُثبت أنه يفشل على الكود القديم:** شُغّل قبل الإصلاح، فأعاد `["src/features/pilot/OwnerPanel.tsx"]` (1 failed | 1 passed)، ثم نجح بعده.

**الجزء 3 — CLN-037 (`7029f5c`):**
- **`AssessPanel.tsx`:**
  - «Choose one answer» و«Clear answer» صارتا `assess.chooseOne` و`assess.clearAnswer`.
  - رسالتا القفل والتعريض الواحد و«Expose once» صارت تستخدم المفاتيح القائمة `assess.locked` و`assess.oneExposure` و`assess.expose`، كما يفعل `FullPracticalRunner`.
  - كل عنصر مترجم داخل البند الإنجليزي يحمل `lang={locale}` و`dir={dirFor(locale)}`.
- **`PartControls.tsx`:**
  - `legend` «Settings» صار مترجمًا مع `lang`/`dir`.
  - `aria-label` للشكل «Selected scene elements»، و`aria-label` و`<title>` للمخطط صارت مترجمة مع `lang={locale}`.
  - نصوص SVG الرقمية (`SID … cm` وحرف العلامة) ووصف القيم `figcaption` (المبني من `CONTROL_LABELS`) وُسمت `lang="en"`، لأنها محتوى السؤال.
- **`PracticalScene.tsx`:**
  - عنوان المشهد، و«Detector and patient»، و«Move marker … / Move beam …»، و`aria-label` الجهاز و`<title>`، ونص السحب، و«Current settings in text» صارت كلها من الرسائل مع `lang`/`dir`.
  - نص SVG `SID … · angle …°` وحرف العلامة وُسما `lang="en"` دون تغيير شكلهما.
- **لم يُغيَّر** (قرار المالك S-ASSESS-7):
  - `CONTROL_LABELS` في `assess/presentation.ts` ومعرّفات `choices.*`، وكل نص المحتوى الامتحاني.
  - خيار «None» في القوائم: قيمة معروضة داخل عنصر اختيار إنجليزي (§7).
- **`src/app/[locale]/assess/page.tsx`:** أُضيف `generateMetadata` بعنوان `assess.title`. الصفحة المصدّرة تعطي «Assessments — RAD-LAB» و«الاختبارات — RAD-LAB».
- **المصطلحات:** أُضيف قسم DRAFT في [ARABIC_TERMINOLOGY](ARABIC_TERMINOLOGY.md) باستخدام «الكاشف» و«الشعاع المركزي»، مع سؤال للمراجع عن «beam».

**مفاتيح الرسائل الجديدة** (13 مفتاحًا نهائيًا تحت `assess`، EN وAR بالبنية نفسها):

| المفتاح | EN | AR (DRAFT) |
|---|---|---|
| `assess.chooseOne` | Choose one answer | اختر إجابة واحدة |
| `assess.clearAnswer` | Clear answer | مسح الإجابة |
| `assess.part.settings` | Settings | الإعدادات |
| `assess.part.sceneElements` | Selected scene elements | عناصر المشهد المحددة |
| `assess.part.diagram` | Settings diagram | مخطط الإعدادات |
| `assess.scene.caption` | Positioning scene. Schematic anatomy follows the existing simulation model. | مشهد الوضعية. التشريح التخطيطي يتبع نموذج المحاكاة الحالي. |
| `assess.scene.detectorPatient` | Detector and patient | الكاشف والمريض |
| `assess.scene.moveMarker` | Move marker {marker} with arrow keys or drag | حرّك علامة الجانب {marker} بمفاتيح الأسهم أو بالسحب |
| `assess.scene.moveBeam` | Move beam with arrow keys or drag | حرّك الشعاع المركزي بمفاتيح الأسهم أو بالسحب |
| `assess.scene.equipment` | Equipment: SID {sid} cm; tube angle {angle} degrees | الجهاز: SID ‏{sid} سم؛ زاوية الأنبوب {angle} درجة |
| `assess.scene.equipmentTitle` | Current equipment settings | إعدادات الجهاز الحالية |
| `assess.scene.dragHelp` | Drag the beam, field edges or marker; … | اسحب الشعاع المركزي أو حواف المجال أو العلامة؛ … |
| `assess.scene.settingsText` | Current settings in text | الإعدادات الحالية نصًا |

لا مفتاح قائم عُدّل أو حُذف.

**الجزء 4 — تعليقا `pipeline.ts` (`fd070c4`):**
- عنوان القسم `limb rotation (wrist, S14.1c)` (~:164) صار `limb rotation (every limb exam; see limbRotationValue)`.
- السطر الداخلي `(limb-warp = the foot exams, S14.4…)` (~:241) صار يذكر القدم وAP الكاحل وGrashey الكتف وAP الحوض، مطابقًا لبيانات `limbRotation.kind` ولتعليق `limbRotationValue`.
- **إثبات أنها تعليقات فقط:** ناتج `ts.transpileModule` مع `removeComments` متطابق قبل وبعد (`true`). `pipeline.ts` لم يعد مثبّتًا.

## 4. التغييرات المشتركة وScale
**بصمات الحدود** في `scripts/pages/frontend-schema.json`، تغيّر سطران فقط:

| الملف | قبل | بعد |
|---|---|---|
| `src/features/pilot/OwnerPanel.tsx` | `bc42d14e…f166ba` | `75ac309d…1b71a6` |
| `src/features/assess/AssessPanel.tsx` | `dff0a827…cf6f` | `f89d1347…28f1` |

- `OwnerAssessPanel.tsx` و`admin-data.ts` **لم يُلمسا** (الجزء 2 غير منفذ)، فبصمتاهما كما هما.
- عدد الملفات المثبّتة 24 قبل وبعد. فحص البصمات كلها بعد التعديل: لا تطابق مفقود.
- `PartControls.tsx` و`PracticalScene.tsx` لم يصبحا حدّين، لأن الحارس لم يكتشفهما (اختبارات `deployment` ناجحة).
- **`requiredMarker` (إثبات قاعدة البيانات) لم يتغير.** حُسب بأصل وهمي `https://abcdefghijklmnopqrst.supabase.co` على `origin/main` وبعد الدفعة، فكان `pilot-v1:20eacb8b…cd4ba22` في الحالتين. السبب أن العلامة تحسب الـmigrations والفحوص فقط، ولم يُلمس ملف SQL.
- **Scale (S-STD-3):** لا سقف جديد.
  - الاتجاه عبر `dirFor` و`RTL_LOCALES` المشتركين، بدل `locale==="ar"`.
  - النصوص في الرسائل، فتمتد لأي لغة تضاف إلى `LOCALES`.
  - الاختبار الثابت يمسح `src/` كله بلا قائمة ملفات مثبتة إلا الاستثناءات الثلاثة.

## 5. الطبي والتسجيل
- لا تغيير في التسجيل أو المحاكي أو الرسم أو الضبط أو القيم الطبية.
- لا تغيير في توقعات الاختبارات أو الـgoldens أو characterisation أو بصمات المشاهد. لم يُشغَّل `qa:golden` ولا `qa:characterise`.
- لا اعتمادية جديدة: `playwright` ثُبّت `--no-save` لتشغيل QA فقط، كما تنص سكربتاته.
- لا تغيير في وقت تشغيل Assess أو العامل أو الـJob.
- عقد عرض السؤال (`CONTROL_LABELS` و`choices.*` و`server-presentation.ts`) لم يُمس.

## 6. QA (نتائج فعلية)
- **أثناء العمل:**
  - `session-account` فشل قبل الإصلاح ونجح بعده.
  - `schema-gate` و`owner-*` و`account-state`: 6 ملفات و83 اختبارًا ناجحة.
  - `deployment` (`frontend-schema` و`assess-d/e/f-schema`): 5 ملفات و24 اختبارًا.
  - `runner-state` و`practical-presentation` و`ui-language` و`platform`: ناجحة.
  - `radiograph`: 11 ملفًا و185 اختبارًا.
- **مرة في النهاية:**
  - `npm run check` (typecheck وlint وtest): نجح، 148 ملفًا و2333 اختبارًا.
  - `npm run build` و`npm run build:pages`: نجحا.
- **`npm run qa:a11y`** (BASE `next start` محلي): 48 ok، **0 violations**.
  - التغطية: الصفحة الرئيسية، والأقسام، وصفحة الفحص، والحالة المجهولة، و404، وشاشة الإعداد والنتيجة، ولوحة المفاتيح، والتجاوز الأفقي. EN/AR على 1440 و390.
  - **لا يصل** إلى صفحتي المالك وAssess.
- **فحص axe إضافي محدود** لـ`/{en,ar}/assess` و`/{en,ar}/owner` على 390 و1440:
  - 0 violations، ولا تجاوز أفقي.
  - العنوان صحيح في اللغتين.
  - هذا البناء بلا pilot، فالصفحتان تعرضان حالتهما غير الموثّقة («يلزم حساب معتمد» ولوحة المالك فارغة). عناصر المشغّل المترجمة لا تظهر فيه.
- **`npm run qa:visual -- --devices=desktop,mobile`** (EN/AR): **2817/2817 فحصًا ناجحًا** (53 سيناريو؛ en+ar × desktop+mobile، أي 1440 و390)، دون `--update-goldens`. المصفوفة تغطي مسار التدريب والمحاكي ومقارنة الـcanvas بالـgoldens، لا صفحات Assess.
- **ما لا تصله الفحوص الآلية:** صفحات المالك وAssess الموثّقة والمشغّل الحي يحتاج قاعدة بيانات وحسابًا معتمدًا.
  - التحقق من الواجهة المترجمة جاء من اختبار العرض `ui-language.test.ts` (EN/AR، و`lang`/`dir`، وغياب النصوص الإنجليزية القديمة في AR، وبقاء `CONTROL_LABELS`)، لا من متصفح.
  - **لم يُجرَّب أي شيء على القاعدة الحية، ولا يوجد زر إغلاق ليُجرَّب.**
- `docs:check -- --base origin/main`: 0 errors و0 review warnings. `status:check -- --base origin/main --require-previous`: OK، مع تعارض المصدر القائم مسبقًا في RAD-024 (غير متعلق). `git diff --check`: نظيف.

## 7. بنود مفتوحة
- **RAD-060، قرار المالك مطلوب.** الخيارات:
  - **(أ) migration صغيرة** تضيف `closed` (أو `closed_at`) إلى صفوف `owner_page_v1('assignments')`، ويُضاف التحقق في `parseAdminPage`.
    - يتغير `requiredMarker`، ويلزم فحص SQL وتحقق حي جديد قبل النشر.
    - بعدها يُبنى الزر كما طُلب: يظهر للمفتوح فقط، ويعرض حالة «مغلق» بعد التحديث.
  - **(ب) زر بلا قراءة الحالة:** يظهر لكل إسناد، ويعرض «أُغلق» في الجلسة الحالية فقط.
    - الإغلاق المكرر لا يضر، لأن الدالة لا تعيد خطأ.
    - لكنه لا يحقق شرطَي «المفتوح فقط» و«الحالة المغلقة بعد التحديث». لا أوصي به.
  - **(ج) إبقاء إجراء console** المسار الوحيد حتى RAD-062، الذي يعيد تصميم أدوار المالك والإسناد أصلًا.
- **`PracticalControls.tsx`:** فيه `legend` «Settings» إنجليزي. ليس في القائمة المسماة، فترك خارج الميزانية، ويُقترح ضمن دفعة صغيرة أو جرد RAD-064.
- **قيم داخل منطقة السؤال الإنجليزية:**
  - قراءات SVG الرقمية «SID … cm» و«angle …°»، وخيار «None»، تُركت إنجليزية بوسم `lang="en"`.
  - يقرر المالك هل تُعد قيم المحتوى أم واجهة.
- **مراجعة العربية:** المصطلحات الجديدة DRAFT، ومنها «الشعاع المركزي» مقابل «الحزمة» لـbeam.
- **ما يبقى في RAD-061:** CLN-042، والمؤجلات بمحفّزاتها (ومنها الخيار (ب) لحد الوقت).

## 8. قائمة المالك
1. راجع Draft PR الدفعة 4: commit لكل جزء (1 ثم 3 ثم 4)، وبصمتان فقط تغيّرتا (§4).
2. قرّر مسار RAD-060 من (أ) أو (ب) أو (ج) في §7. إلى حين القرار يبقى [إجراء console](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-close-console-procedure) المعتمد.
3. **بعد الدمج، فحص الهاتف (لا يوجد فحص زر حي):**
   - افتح `/ar/assess` و`/en/assess` وتأكد من عنوان التبويب.
   - افتح صفحة المالك وتأكد أنها تُحمَّل كالمعتاد (CLN-030). يُتوقع أن يسجل نشاط واحد عند الفتح بدل اثنين، إن رغبت بالتحقق من سجل النشاط.
   - إن فُتحت نافذة Assess لاحقًا بإذنك: في الواجهة العربية تظهر «الإعدادات» و«اختر إجابة واحدة» و«تعريض واحد» بالعربية، والسؤال وأسماء الأدوات بالإنجليزية.
4. أرسل مصطلحات DRAFT الجديدة مع حزمة مراجعة العربية إن رغبت.
5. **التالي:** بعد الدمج جرد RAD-064 (قراءة فقط).
