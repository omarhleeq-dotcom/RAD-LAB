# فهرس وثائق RAD-LAB

هذا مدخل الوثائق الحالية عند main `f90b3c9` بعد #80 (2026-10-16). **المرحلة البرمجية التالية مؤجلة بقرار المالك**؛ هذه الدفعة DOCS فقط، ولا تنقل ملفات إلى الأرشيف. سجلات الجلسات أدلة بتاريخها، وليست أوامر تنفيذ جديدة أو إثبات نشر حي.

## الحالة والتسليم والقرارات

- [حالة المشروع](project-status.md): المصدر الوحيد لحالة المهام؛ الدمج والفحص الحي شيئان منفصلان.
- [HANDOFF والمتابعة](HANDOFF.md): بداية الجلسة التالية وحدودها؛ لا يعاد تنفيذ برومبت تاريخي تلقائيًا.
- [DECISIONS](DECISIONS.md): القرارات ومعرّفاتها وتعديلات المالك؛ القرار اللاحق المسمى يوضح ما استُبدل.
- [تنسيق الحالة](status-format.md) و[أرشيف الحالة](status-archive.md).
- [تقرير DOCS-ALIGN-1 وخريطة الدفعة الثانية المقترحة](DOCS_ALIGN_1_REPORT_2026-10-16.md).

## آلية العمل والتشغيل

- [README المشروع](../README.md): نطاق الكود الحالي والمسارات والتشغيل المحلي.
- [CLAUDE.md](../CLAUDE.md) و[AGENTS.md](../AGENTS.md): قواعد الوكلاء والجلسات؛ اختصارهما ليس جزءًا من هذه الدفعة.
- [وصفة الفحص](exam-recipe.md): مرجع/Needs أولًا، التغييرات الاختيارية، حراس الصور والمشاهد، وQA؛ الفحوص والصور الجديدة مجمدة حاليًا.
- [المواصفات الأصلية](RAD-LAB_Project_Specification.md): رؤية المنتج الأساسية، مع الرجوع لتعديلات المالك اللاحقة في DECISIONS.
- [دليل النشر](DEPLOYMENT.md): إعدادات الاستضافة ومسار GitHub Actions؛ تاريخ التحقق وحدوده داخل الدليل.
- [دليل Supabase](PILOT_SUPABASE_SETUP.md): الإعداد والترحيلات والاختبارات والنسخ/الاستعادة؛ ليس إذنًا بتشغيل خطوات على الإنتاج.

## المعمارية والتجربة والتخطيط

- [المعمارية: المنفذ والمقترح والتاريخ](PLATFORM_ARCHITECTURE.md) و[فهرس ADR](adr/README.md).
- [خارطة الطريق الحالية وسجل الجلسات](ROADMAP_SESSIONS.md)؛ الترتيب المستقبلي لا يلغي تأجيل المالك الحالي.
- [خطة التجربة والتسجيل الحالي](PILOT_PLATFORM_PLAN.md).
- [قائمة التحقق من المزوّد](PILOT_PROVIDER_VERIFICATION_CHECKLIST.md) و[مقارنة المزوّدين بتاريخها](PILOT_PROVIDER_COMPARISON_2026-10-15.md).
- [خطة قابلية التوسع](RAD_047B_IMPLEMENTATION_PLAN.md): افصل المقترحات المشروطة عن التنفيذ المثبت في الحالة.
- [تاريخ احتياجات الجلسة 11](SESSION_11_NEEDS_SUMMARY.md) و[قائمة المرشحين التاريخية للوسائل والمصادر](MODALITY_SOURCES_CANDIDATES.md): قوائم تاريخية/للتحقق، لا اعتماد لمصدر أو ترخيص جديد.
- [مراجعة الشروط بتاريخها](TERMS_REVIEW_2026-10-16.md) و[مسودة الشروط](TERMS_OWNER_DRAFT_2026-10-16.md): القرارات اللاحقة والنص الفعلي يحسمان الحالة الحالية.

## المراجع الطبية ومكتبة المصادر والأصول

المراجع تبقى ملفات نشطة؛ وجود مرجع لا يثبت اعتماد قيمه طبيًا. لا تُنقل أو تُختصر ادعاءاتها في دفعة التنظيم.

- [Ankle](RAD-LAB_Medical_Reference_Ankle.md)
- [Chest AP](RAD-LAB_Medical_Reference_Chest_AP.md)
- [Chest Lateral](RAD-LAB_Medical_Reference_Chest_Lateral.md)
- [Chest PA](RAD-LAB_Medical_Reference_Chest_PA.md)
- [Chest PA Image Quality](RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md)
- [Chest PA Technique](RAD-LAB_Medical_Reference_Chest_PA_Technique.md)
- [Elbow](RAD-LAB_Medical_Reference_Elbow.md)
- [Hand](RAD-LAB_Medical_Reference_Hand.md)
- [Knee Foot](RAD-LAB_Medical_Reference_Knee_Foot.md)
- [Pelvis AP](RAD-LAB_Medical_Reference_Pelvis_AP.md)
- [Shoulder Grashey](RAD-LAB_Medical_Reference_Shoulder_Grashey.md)
- [Shoulder Y](RAD-LAB_Medical_Reference_Shoulder_Y.md)
- [Wrist](RAD-LAB_Medical_Reference_Wrist.md)

- [قالب المرجع وNeeds](templates/EXAM_REFERENCE_TEMPLATE.md).
- [سجل المصادر](sources/REGISTER.md): حالات القراءة والمواضع؛ ملاحظات المصادر في المجلد نفسه.
- [سجل الأصول والرخص](ASSET_PROVENANCE_AND_LICENSES.md) و[تدقيق الرخص بتاريخ 2026-10-15](ASSET_LICENCE_AUDIT_2026-10-15.md).

## المراجعة البشرية والنص العربي

- [حزمة المراجعة](REVIEW_PACKAGE.md) **و**[قائمة مراجعة Chest PA](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md): كلاهما نشط؛ الحزمة تعتمد على القائمة ولا تستبدلها بالكامل.
- [المصطلحات العربية](ARABIC_TERMINOLOGY.md): المسودة وحالة المراجعة كما هي؛ لا اعتماد لغوي جديد من تنظيف الملفات.

## تقارير الجلسات والأرشيف

[آخر تقرير واجهة/باك](session-rad-054-phone-fixes-2026-10-16.md) يوثق QA المحلي لـ#80؛ تحقق الهاتف بعد الدمج يبقى مفتوحًا. تقارير الجلسات التسعة والثلاثون أدناه تبقى بمساراتها في هذه الدفعة. الأرشفة اللاحقة لها خريطة مستقلة في تقرير DOCS-ALIGN-1.

<details>
<summary>سجل تقارير الجلسات الموجودة الآن (تاريخي)</summary>

- [Session 11 — engine generalisation against the Chest Lateral + Chest AP needs](session-11-generalisation.md)
- [Session 12 — Chest Lateral (erect) implementation](session-12-chest-lateral.md)
- [Session 13 — Chest AP (supine) implementation](session-13-chest-ap.md)
- [Session 13b — Scene design pass (S13b-1, closes O13)](session-13b-scene-design.md)
- [Session S14-0 — Generalisation for limbs (byte-identical refactor)](session-14-limbs-generalisation.md)
- [Session 14.2b — Hand PA + Hand Lateral (extension) exams (and Elbow reference, phase 2)](session-14.2b-hand.md)
- [Session 14.3 — Elbow AP (extended) and Elbow Lateral (flexed 90°)](session-14.3-elbow.md)
- [Session 14.4 — Knee AP / lateral and Foot AP (DP) / medial oblique (right side)](session-14.4-knee-foot.md)
- [Session 14.5 — Ankle AP and Ankle lateral (left side, inferred)](session-14.5-ankle.md)
- [Session 2 — Interactive positioning workspace](session-2-positioning.md)
- [Session 3 — Technique & exposure console](session-3-technique.md)
- [Session 4 — Chest PA educational radiograph renderer](session-4-radiograph-renderer.md)
- [Session 5 — adult-male PA baseline: options for the owner](session-5-baseline-options.md)
- [Session 5 — scenario matrix (generated)](session-5-qa-matrix.md)
- [Session 5 — Chest PA: full QA, polish and end-to-end testing](session-5-qa.md)
- [Session 7 — impact of aligning the case demographics to the baseline image](session-7-demographics-impact.md)
- [Session 7 — engine generalisation: exam / case split (pure refactor, zero behaviour change)](session-7-engine-generalisation.md)
- [Session 8 — D7: align the case demographics to the baseline image](session-8-demographics-alignment.md)
- [استعادة نقطة العمل — 2026-10-11](session-continuity-2026-10-11.md)
- [تحقق الاستمرار — 2026-10-15](session-continuity-2026-10-15.md)
- [Pelvis AP — التنفيذ بعد مراجعة الفحوص السابقة، 2026-10-15](session-pelvis-ap-implementation.md)
- [Pelvis AP — المرجع وNeeds وتنظيف العلامة، 2026-10-15](session-pelvis-ap-reference-2026-10-15.md)
- [RAD-041a — الحسابات: المخطط وسياسات الصفوف واختبارات العزل (2026-10-15)](session-rad-041a-accounts-backend-2026-10-15.md)
- [RAD-041b — صفحات الحساب وتسجيل النشاط (2026-10-15)](session-rad-041b-account-ui-2026-10-15.md)
- [RAD-043b — زر الملاحظات ورابط الاستبيان (جلسة 2026-10-16)](session-rad-043b-feedback-2026-10-16.md)
- [RAD-045 — صفحة المصادر والاعتمادات، 2026-10-16](session-rad-045-credits-2026-10-16.md)
- [RAD-047a — Pilot core scalability audit](session-rad-047a-scalability-audit-2026-10-16.md)
- [RAD-050 — تطبيق الشروط المعتمدة — 2026-10-16 (Asia/Amman)](session-rad-050-terms-implementation-2026-10-16.md)
- [RAD-052 — حارس الدخول (2026-10-16)](session-rad-052-session-gate-2026-10-16.md)
- [RAD-053 — الكتالوج حسب المنطقة التشريحية (2026-10-16)](session-rad-053-catalogue-2026-10-16.md)
- [RAD-054 — اعتماد التصميم الثالث لمكتبة الفحوصات، 2026-10-16](session-rad-054-appearance-2026-10-16.md)
- [RAD-054 — تنفيذ التصميم الثالث ومراجعة المالك، 2026-10-16](session-rad-054-implementation-2026-10-16.md)
- [RAD-054 — إصلاح ملاحظات الهاتف، 2026-10-16](session-rad-054-phone-fixes-2026-10-16.md)
- [Shoulder Grashey — التنفيذ (RAD-033)، 2026-10-15](session-shoulder-grashey-implementation-2026-10-15.md)
- [Shoulder Grashey — المرجع وNeeds، 2026-10-15](session-shoulder-grashey-reference-2026-10-15.md)
- [Shoulder Grashey — مطابقة الصورة وحسم الوضعية وحدود المحاكاة قبل الكود، 2026-10-15](session-shoulder-grashey-settlement-2026-10-15.md)
- [Shoulder Y — بوابتا RAD-036، 2026-10-15 (DOCS، توقف قبل الكود)](session-shoulder-y-gates-2026-10-15.md)
- [Shoulder Y — المرجع وNeeds دون كود، 2026-10-15](session-shoulder-y-reference-2026-10-15.md)
- [جرد الواجهة (قراءة فقط) — 2026-10-16 (RAD-051)](session-ui-audit-2026-10-16.md)

</details>

- [الأرشيف الموجود](archive/): تسليمات قديمة، لا تُستعمل كالحالة الحالية؛ [الأرشيف الجامع حتى 2026-10-16](archive/HANDOFF-until-2026-10-16.md).
- [برومبتات محفوظة](prompts/): نصوص مرحلة معينة، لا أوامر تُشغّل بمجرد قراءتها.
