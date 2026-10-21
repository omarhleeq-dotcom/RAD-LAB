# دليل قراءة وثائق RAD-LAB

ابدأ من [تعليمات العمل المشتركة](../AGENTS.md) و[التسليم](HANDOFF.md). [الحالة](project-status.md) وحدها تحدد حالات المهام؛ [القرارات](DECISIONS.md) تحدد الحكم الساري. التقارير والتاريخ أدلة تُفتح عند الحاجة، وليست قائمة قراءة إلزامية أو أوامر تنفيذ جديدة.

<a id="read-by-task"></a>
## اقرأ حسب المهمة

| مهمتك | القراءة المطلوبة بعد البداية | عند الحاجة فقط |
|---|---|---|
| مراجعة/تعديل docs | البند المعني من الحالة، القسم المعني من القرارات، [طريقة الفحص](DOCS_CHECKS.md) | السجل التاريخي الذي يستند إليه التغيير |
| تخطيط/تنفيذ Assess عند استئنافه | [قرارات المالك](DECISIONS.md#assess-owner-2026-10-19)، [خطة التنفيذ والتدقيق](ASSESS_IMPLEMENTATION_PLAN.md)، [مراجعة الدورة وخطة التجربة المضبوطة](ASSESS_CONTROLLED_TRIAL_READINESS_2026-10-22.md)، RAD-055/RAD-056 من الحالة | [تقرير التوثيق](ASSESS_DOCS_REPORT_2026-10-19.md)، ENGINE_GUIDE وpilot setup بحسب الوحدة؛ Blueprint ليس اعتمادًا |
| فهم المعمارية | [المعمارية الحالية](PLATFORM_ARCHITECTURE.md) | [ADR](adr/README.md)، تفاصيل القسم المعني من [دليل المحرك](ENGINE_GUIDE.md) |
| تعديل حسابات/سياسات/تشغيل pilot | [الخطة والتسجيل الحالي](PILOT_PLATFORM_PLAN.md)، قرارات pilot ذات الصلة | [إعداد Supabase](PILOT_SUPABASE_SETUP.md)، [تحقق المزوّد](PILOT_PROVIDER_VERIFICATION_CHECKLIST.md)؛ لا إذن تشغيل إنتاج تلقائي |
| تعديل scoring/rendering/المشاهد | الأقسام المعنية من [دليل المحرك](ENGINE_GUIDE.md)، قرار الأسرة ودليلها | التقرير الأصلي أو حارس الأسرة؛ لا قراءة كل تقارير الفحوص |
| مرجع/فحص مستقبلي مأذون | [الوصفة](exam-recipe.md)، [قالب المرجع](templates/EXAM_REFERENCE_TEMPLATE.md)، المرجع الطبي المطلوب و[sources](sources/REGISTER.md) | المراجع الأخرى للاحتياج المشترك المثبت؛ التجميد الحالي لا يُرفع بهذا المسار |
| مراجعة طبية/عربية | [الحزمة](REVIEW_PACKAGE.md) و[القائمة](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md)، المرجع الطبي المعني، [المصطلحات](ARABIC_TERMINOLOGY.md) | [الأصول/الرخص](ASSET_PROVENANCE_AND_LICENSES.md)، ملاحظات المصدر ذي الصلة |
| تتبع سبب قرار/تغيير | رابط الأصل من [DECISIONS](DECISIONS.md) أو source_ref المهمة | [فهرس الأرشيف](archive/README.md)؛ لا تُنفّذ برومبتًا تاريخيًا |

## الوصول السريع للحالة

`npm run docs:context` يعرض Git المحلي دون كتابة أو شبكة. `npm run docs:context -- --pr NUMBER` يقرأ حالة PR ورأس فرعه الأساسي من GitHub عبر `gh` المتاح؛ إن تعذر التحقق استخدم الأداة المتصلة وسجّل أنه غير متحقق. لا تنسخ الفرع وSHA أو «ينتظر الدمج» إلى HANDOFF؛ [تفاصيل الأمر وحدوده](DOCS_CHECKS.md#حقائق-الجلسة-دون-نسخها).

`npm run status:summary` يعرض المهام المفتوحة باختصار؛ `npm run status:summary -- --id RAD-025` يعرض مهمة ودليلها، و`--all --query NIH` يبحث في النص والإحالات. `--all` يشمل المنجز و`--json` يصلح للأدوات. كلها قراءة مشتقة من الملف نفسه دون نسخة ثانية. دون Node، اقرأ الملخص ذي البنود الخمسة في [ملف الحالة](project-status.md) وابحث عن معرّف المهمة؛ [status-format](status-format.md) مطلوب عند تعديل JSON فقط.

## المراجع والفهارس المتخصصة

- [README المشروع](../README.md): المنتج والتشغيل المحلي؛ [النشر](DEPLOYMENT.md) لإعداد الاستضافة.
- المراجع الطبية: [الصدر PA](RAD-LAB_Medical_Reference_Chest_PA.md)، [تقنيته](RAD-LAB_Medical_Reference_Chest_PA_Technique.md)، [جودته](RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md)، [AP](RAD-LAB_Medical_Reference_Chest_AP.md)، [Lateral](RAD-LAB_Medical_Reference_Chest_Lateral.md).
- الأطراف: [الرسغ](RAD-LAB_Medical_Reference_Wrist.md)، [اليد](RAD-LAB_Medical_Reference_Hand.md)، [الكوع](RAD-LAB_Medical_Reference_Elbow.md)، [الركبة/القدم](RAD-LAB_Medical_Reference_Knee_Foot.md)، [الكاحل](RAD-LAB_Medical_Reference_Ankle.md).
- [الحوض](RAD-LAB_Medical_Reference_Pelvis_AP.md)، [Grashey](RAD-LAB_Medical_Reference_Shoulder_Grashey.md)، [Shoulder Y](RAD-LAB_Medical_Reference_Shoulder_Y.md). وجود المرجع لا يثبت اعتمادًا طبيًا أو إذن تنفيذ.
- [خارطة الطريق الحالية](ROADMAP_SESSIONS.md)، [خطة قابلية التوسع](RAD_047B_IMPLEMENTATION_PLAN.md)، [المواصفات الأصلية](RAD-LAB_Project_Specification.md) للرؤية مع تعديلات المالك اللاحقة.
- [تقرير تنظيم القراءة والفحص](DOCS_WORKFLOW_REPORT.md)، [تقرير الأرشفة الأول داخل #82](DOCS_ARCHIVE_2_REPORT.md)، [الأرشيف](archive/README.md). لا تُقرأ التقارير الثلاثة لبدء كل مهمة.

## صيانة الوثائق

لكل معلومة موضع واحد: workflow في AGENTS، المهام في الحالة، الحكم الحالي في DECISIONS، التفاصيل المتخصصة في دليلها، والدليل التاريخي في الأرشيف. حدّث العبارة الحالية بدل إضافة «ملخص أحدث» فوقها؛ اربط القواعد ولا تنسخها. سجل الجلسة يحوي الأدلة/التحقق، وHANDOFF نقطة الاستئناف فقط. فحص [docs:check](DOCS_CHECKS.md) مشترك محليًا وفي CI، والمراجعة البشرية تحسم المعنى والدليل.
