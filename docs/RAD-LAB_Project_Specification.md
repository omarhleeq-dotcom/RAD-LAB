# RAD-LAB — Project Specification

> **المواصفات الأصلية للرؤية، وليست وصف الحالة الحالية.** تعديلات المالك اللاحقة في [DECISIONS](DECISIONS.md) تحكم النطاق الساري؛ التنفيذ الحالي في [المعمارية](PLATFORM_ARCHITECTURE.md)، وحالات المهام في [project-status](project-status.md). عبارات MVP/الحسابات وخريطة الجلسات أدناه محفوظة في سياقها الأصلي؛ لا تعِد تنفيذها كأوامر جديدة.
وثيقة مرجعية شاملة للمشروع

- **اسم المشروع:** RAD-LAB
- **نوع المشروع:** منصة ويب تعليمية تفاعلية لمحاكاة التصوير الطبي بالأشعة
- **الوضع الحالي:** مرحلة تأسيس المشروع والـMVP
- **المستودع / الفرع الأساسي:** RAD-LAB / `main`
- **بيئة التطوير المستهدفة:** Claude Code Cloud — Default Environment

> Source of truth for the project (copied from the original specification supplied by the project owner). Section numbering is preserved.

## 1) الفكرة العامة
RAD-LAB برنامج تعليمي على الويب لتعليم وتدريب مستخدمي التصوير الطبي بالأشعة عبر محاكاة تفاعلية لبيئة العمل الحقيقية. ليس مجرد عرض معلومات نظرية ولا مجرد واجهة لجهاز أشعة، بل مزج بين محاكاة وضع المريض والتعامل مع الجهاز وبين واجهة تقنية تفاعلية تسمح للمتعلم باتخاذ قرارات مشابهة للعمل الحقيقي. البداية مع Chest X-ray ثم التوسع مستقبلًا إلى فحوصات وتقنيات أخرى.

## 2) الفئات المستهدفة
- طلاب Radiologic Technology / Medical Imaging.
- العاملون في قطاع الأشعة الطبية.
- الجامعات والكليات.
- المدرسون والمحاضرون.

في المرحلة الأولى لا يوجد نظام حسابات أو تسجيل دخول. لاحقًا: Student, Instructor / Doctor, University / Institution, Admin.

## 3) هدف المشروع
بيئة آمنة وتفاعلية للتدرب على: اختيار الفحص، وضعية المريض، Projection / View، Rotation، Centering، Collimation، SID، اختيار التقنية، kVp، mAs، تعليمات التنفس، Exposure، تقييم جودة الصورة، وفهم أثر الأخطاء.

العلاقة المطلوب فهمها:
**Patient Positioning → Equipment Setup → Exposure Technique → Radiographic Result**

## 4) قرار شكل المحاكاة — Hybrid Simulation
**A. Patient Positioning View:** المريض، X-ray tube، Detector / Bucky، اتجاه الإسقاط، Positioning، Rotation، Centering، Collimation، SID. لا يشترط 3D كامل في أول نسخة؛ الهدف تفاعل بصري واضح تعليميًا بدون Physics/3D Engine ثقيل.

**B. Console / Technique Panel:** Projection / View، kVp، mAs، SID، Grid عند الحاجة، Breathing instruction، Exposure، Notes، Markers لاحقًا.

الجزآن يتفاعلان بحيث تؤثر اختيارات المستخدم في النتيجة النهائية.

## 5) أول فحص
**Adult Chest X-ray — PA Erect.** بعد استقراره: AP Portable Chest ثم Lateral Chest.

## 6) السيناريوهات المستقبلية
Correct PA erect، Rotated chest، Incorrect centering، Incorrect collimation، Underexposure، Overexposure، Poor inspiration، Supine patient، Trauma patient، Portable chest، ICU patient، Pediatric cases. الهدف ألا يتعلم الطالب الوضع المثالي فقط بل اكتشاف الأخطاء وفهم نتائجها.

## 7) Ready-Made Cases
حالات جاهزة تحتوي: Patient profile، Requested examination، Clinical scenario، Patient condition، Required projection، Expected positioning، Expected technique range، Possible positioning errors، Possible exposure errors، Expected image-quality criteria. لاحقًا مستويات صعوبة.

## 8) منطق المحاكاة في النسخة الأولى
**Rule-Based Simulation:** مقارنة مدخلات المستخدم مع قواعد ومعايير الحالة (projection، rotation، centering، collimation، SID، kVp/mAs، breathing) ثم اختيار/تكوين النتيجة.
**Image Variants:** صور/Variants جاهزة للأخطاء (Rotation، Clipping، Underexposure، Overexposure، Poor inspiration) بدون محاكاة فيزياء الأشعة كاملة.

## 9) أوضاع الاستخدام
- **Practice Mode:** Hints، Immediate feedback، توضيح الخطأ، اقتراح التصحيح، إظهار القيم/المعايير، إعادة المحاولة.
- **Assessment Mode:** لا مساعدة أثناء الحل، لا تظهر الإجابة الصحيحة مباشرة، تسجيل قرارات الطالب، النتيجة في النهاية، استخدام مستقبلي بواسطة المدرسين والجامعات.

## 10) نظام التقييم Scoring
| العنصر | الوزن |
|---|---|
| Positioning | 25% |
| Rotation | 20% |
| Centering | 15% |
| Exposure / Technique | 20% |
| SID / Setup | 10% |
| Breathing | 10% |
| **Total** | **100%** |

يمكن تعديل الأوزان حسب نوع الفحص. التقييم يوضح: ماذا فعل صحيحًا، أين أخطأ، لماذا هو خطأ، كيف يؤثر على الصورة، وما التصحيح المناسب.

## 11) تقييم الصورة Image Evaluation
لا تنتهي المحاكاة عند Expose. يقيّم المستخدم الصورة أو يشاهد تقييم النظام: Rotation، Inspiration، Centering، Collimation، Exposure، Coverage of required anatomy، Overall acceptability. يُطوَّر بعمق بعد تأسيس محاكاة Chest الأساسية.

## 12) دور المدرس / الجامعة مستقبلًا
إنشاء Assessment، تحديد Case أو مجموعة Cases، إرسال الاختبار، تحديد وقت/عدد محاولات، مشاهدة النتائج والأخطاء الشائعة، مقارنة المحاولات، Scoring rubric واضح. ليس مطلوبًا في أول MVP لكن يجب أن تسمح Architecture بإضافته.

## 13) اللغات
العربية و English من البداية، Localization بدل النصوص المكتوبة داخل الـcomponents، LTR للإنجليزية و RTL للعربية، وتغيير لغة سهل.

## 14) التسجيل والحسابات
المرحلة الأولى: بدون Login / Signup. لاحقًا: Authentication وأدوار (Student, Instructor, Institution, Admin).

## 15) الـTech Stack المقترح للـMVP
Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, next-intl (أو i18n مناسب), JSON-based cases في المرحلة الأولى. بيانات الحالات منفصلة عن الواجهة. قاعدة البيانات والحسابات لاحقًا.

## 16) Architecture المطلوبة
Modules واضحة: UI / Frontend، Simulation Engine، Patient Positioning، Equipment / Console، Technique Controls، Case Engine، Image Result / Variants، Evaluation Engine، Scoring Engine، Practice Mode، Assessment Mode، Localization، Future Authentication / Instructor Tools. إضافة فحص جديد لا تتطلب إعادة بناء البرنامج.

## 17) هيكل الـCase المقترح
id، title، patient، clinicalScenario، examination، projection، expectedPosition، expectedRotation، expectedCentering، expectedCollimation، expectedSID، expectedKvpRange، expectedMasRange، breathingInstruction، imageCriteria، possibleErrors، feedback، scoringRules.

## 18) قابلية التوسع
General Radiography (Chest, Abdomen, Upper/Lower extremity, Spine, Skull, Trauma)، CT (Patient setup, Scan range, Parameters, Protocol, Contrast workflow, Image review)، MRI (Positioning, Coil, Sequence, Basic parameters, Safety). CT وMRI ليسا جزءًا من الـMVP لكنهما سبب لبناء Architecture عامة.

## 19) الواقعية المطلوبة
Educational Realism: لقرارات المستخدم أثر، الأخطاء تنتج نتائج مختلفة، القيم التقنية تدخل في المنطق، Positioning يؤثر على النتيجة، Feedback مرتبط بسبب واضح. لا نبدأ بـ Full radiation physics engine أو Full 3D anatomy engine أو Exact detector physics.

## 20) تجربة المستخدم المقترحة
Select Case → Read Patient / Examination Request → Position Patient → Set Projection → Adjust Rotation / Centering / Collimation → Set SID → Set kVp / mAs / Technique → Select Breathing Instruction → Expose → Generate Radiographic Result → Evaluate Image → Score + Feedback.

## 21) MVP 1 — Chest PA
1. فتح التطبيق. 2. اختيار اللغة. 3. الدخول إلى Chest X-ray simulation. 4. تحميل Adult PA Erect case. 5. رؤية المريض والجهاز/Detector تعليميًا. 6. تعديل أهم عناصر Positioning. 7. تعديل أهم Technique parameters. 8. Expose. 9. ظهور Result مرتبط بالاختيارات. 10. عرض Score. 11. عرض Feedback. 12. إعادة المحاولة.

## 22) الأولويات
1 Architecture + foundation · 2 Chest PA Erect simulation · 3 Patient positioning + rotation logic · 4 Technique console and kVp/mAs behavior · 5 Radiographic result variants · 6 Scoring and feedback · 7 Practice / Assessment modes · 8 AP Portable and Lateral · 9 Instructor / university features · 10 Additional modalities and examinations.

## 23) ما لا نريد فعله من البداية
لا نظام حسابات، لا قاعدة بيانات معقدة، لا 3D كامل، لا فيزياء أشعة بدقة بحثية، لا كل الفحوصات دفعة واحدة، لا CT/MRI قبل إثبات Chest MVP، لا ربط Architecture بحالة واحدة، لا بيانات حالات hard-coded.

## 24) أول Cloud Session
تحليل المتطلبات، اختيار Architecture، Project Scaffold، Next.js/TypeScript، Styling، Localization (AR/EN)، هيكل Simulation modules، Case data structure، أول Skeleton لـChest PA، التأكد من عمل المشروع، README، CLAUDE.md، Commit منظم، الحفاظ على قابلية التوسع.

## 25) استراتيجية Claude Cloud
Session 1 Architecture + Foundation · 2 Patient Positioning UI · 3 X-ray Console / Technique Panel · 4 Chest PA Simulation Logic · 5 Image Variants + Exposure Errors · 6 Scoring + Feedback · 7 Practice / Assessment Mode · 8 AP Portable · 9 Lateral Chest.

## 26) مبادئ أساسية
1. Educational first. 2. Modular architecture. 3. Data-driven cases. 4. Bilingual from the beginning. 5. Simple first, realistic later. 6. Explain mistakes, not just score them. 7. Extensible beyond Chest X-ray. 8. Instructor-ready architecture.

## 27) الوضع الحالي
مشروع مستقل، مستودع RAD-LAB (Private)، GitHub مربوط بـClaude، Claude GitHub App على RAD-LAB فقط، Default environment، branch `main`.

## 28) نقاط لم تُحسم بعد
الشكل البصري النهائي، 2D المتقدم أو 3D، مصدر الصور التعليمية، القيم المرجعية الدقيقة لكل Technique، قاعدة البيانات، Authentication، الاستضافة، نموذج الاشتراك، Dashboard المدرس، تخزين نتائج الطلاب، مستوى الذكاء الاصطناعي. تُحسم تدريجيًا بعد نجاح الـMVP.

## 29) تعريف مختصر
RAD-LAB is a bilingual Arabic-English web-based educational radiography simulation platform for radiologic technology students, medical imaging professionals, instructors, and universities. The initial MVP focuses on Adult Chest X-ray PA Erect and combines an interactive patient-positioning environment with an X-ray technique console. Users configure positioning, rotation, centering, collimation, SID, kVp, mAs, and breathing instructions, perform an exposure, then receive a simulated radiographic result, score, and educational feedback. The platform should use a modular, data-driven architecture that can later expand to AP portable, lateral chest, additional radiographic examinations, CT, MRI, student accounts, instructor assessments, and institutional use.
