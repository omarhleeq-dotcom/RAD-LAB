# جرد وثائق وأدلة RAD-089 — 2026-11-01

جرد كامل للشجرة الأصلية ثم وجهات الدفعة. مرجع العدّ هو أول commit للإغلاق؛ تواريخ آخر تعديل من Git قبل النقل (يشمل إغلاق RAD-088). الإحالات الواردة = عدد ملفات المصدر المختلفة Markdown + غير Markdown، وتشمل المسارات النصية والتعليقات وأسماء الملفات الفريدة؛ README المشترك يُحسم بالمسار النسبي. يستثني العدّ هذا الجرد وتقرير الدفعة وأداة الإثبات الجديدة لتجنب إحالات الجرد الذاتية. لا يعني انعدام الإحالات أن الدليل متجاوز. MB عشرية (1,000,000 بايت).

## 1. كل وثيقة باقية في أعلى docs/

قبل: 201؛ بعد: 161. تقارير مؤرخة مرشحة: 139؛ المنقول: 40؛ المستثنى: 99. التوصيات غير المنفذة تحتاج اعتماد المالك في الدفعة التالية.

| الملف | الغرض (سطر واحد) | آخر commit | وارد md + non-md | التوصية والسبب |
|---|---|---|---|---|
| [ARABIC_TERMINOLOGY.md](../../../ARABIC_TERMINOLOGY.md) | Arabic terminology — for educator review | 2026-10-23 | 29 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_B_REPORT_2026-10-19.md](../2026-10/ASSESS_B_REPORT_2026-10-19.md) | تقرير المرحلة B — مجموعات Assess والإسناد — 2026-10-19 | 2026-10-19 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| [ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md](../2026-10/ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md) | تقرير حاوية Assess وentrypoint المحلية — 2026-10-21 عمّان | 2026-10-20 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| [ASSESS_CLOUD_RUN_PLAN_2026-10-21.md](../2026-10/ASSESS_CLOUD_RUN_PLAN_2026-10-21.md) | اختيار Google Cloud Run ومطابقة Assess — 2026-10-21 عمّان | 2026-10-20 | 6 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md |
| [ASSESS_CONNECTION_PROBE.md](../../../ASSESS_CONNECTION_PROBE.md) | فحص اتصال Cloud Run دون تشغيل Assess | 2026-10-21 | 2 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md](../2026-10/ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md) | تحضير التشغيل والمراقبة والاستجابة — 2026-10-22 عمّان | 2026-10-21 | 6 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| [ASSESS_CONTROLLED_TRIAL_READINESS_2026-10-22.md](../2026-10/ASSESS_CONTROLLED_TRIAL_READINESS_2026-10-22.md) | مراجعة دورة Assess وخطة تجربة مضبوطة — 2026-10-22 عمّان | 2026-10-21 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md |
| [ASSESS_C_REPORT_2026-10-20.md](../2026-10/ASSESS_C_REPORT_2026-10-20.md) | تقرير Assess C — دورة المحاولة والتصحيح | 2026-10-19 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| [ASSESS_D_REPORT_2026-10-20.md](../2026-10/ASSESS_D_REPORT_2026-10-20.md) | تقرير Assess D — الأسئلة المنوعة | 2026-10-20 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/DEPLOYMENT.md |
| [ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md](../2026-10/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md) | External Binding & Provisioning Readiness — Assess — 2026-10-21 عمّان | 2026-10-21 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| [ASSESS_EXTERNAL_BINDING_REPORT_2026-10-21.md](../2026-10/ASSESS_EXTERNAL_BINDING_REPORT_2026-10-21.md) | تقرير قرار الربط الخارجي — 2026-10-21 عمّان | 2026-10-20 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| [ASSESS_E_REPORT_2026-10-20.md](../2026-10/ASSESS_E_REPORT_2026-10-20.md) | تقرير Assess E — مسار الفحوصات الكاملة | 2026-10-20 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/DEPLOYMENT.md |
| [ASSESS_FOUNDATION.md](../../../ASSESS_FOUNDATION.md) | عقد أساس Assess — المرحلة A | 2026-10-20 | 5 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_F_REPORT_2026-10-20.md](../2026-10/ASSESS_F_REPORT_2026-10-20.md) | تقرير Assess F — السجل والقبول التجريبي | 2026-10-20 | 9 + 0 | KEEP — byte-identical protected Markdown: docs/DEPLOYMENT.md |
| [ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md](../2026-10/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md) | تجهيز Google من Cloud Shell وتسليم حزمة الصورة — 2026-10-21 عمّان | 2026-10-21 | 8 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| [ASSESS_IMPLEMENTATION_PLAN.md](../../../ASSESS_IMPLEMENTATION_PLAN.md) | خطة Assess القابلة للاستئناف | 2026-10-20 | 9 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_LOCAL_OPERATIONS.md](../../../ASSESS_LOCAL_OPERATIONS.md) | تشغيل Assess الاصطناعي المحلي المحدود | 2026-10-20 | 3 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_POSTGRES_PASSWORD_IMPACT_REPORT_2026-10-21.md](../2026-10/ASSESS_POSTGRES_PASSWORD_IMPACT_REPORT_2026-10-21.md) | فحص أثر إعادة تعيين كلمة postgres — 2026-10-21 عمّان | 2026-10-21 | 2 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md |
| [ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md](../2026-10/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md) | تقرير حزمة SQL اليدوية للاحتفاظ — 2026-10-20 | 2026-10-20 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_RETENTION_POLICY.md |
| [ASSESS_RETENTION_POLICY.md](../../../ASSESS_RETENTION_POLICY.md) | سياسة احتفاظ Assess وموافقته — اعتماد المالك 2026-10-20 | 2026-10-20 | 15 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_RETENTION_PREFLIGHT_REPORT_2026-10-20.md](../2026-10/ASSESS_RETENTION_PREFLIGHT_REPORT_2026-10-20.md) | تقرير متابعة Assess — تجهيز حاجز SQL اليدوي للقراءة فقط | 2026-10-20 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md |
| [ASSESS_RETENTION_REPORT_2026-10-20.md](../2026-10/ASSESS_RETENTION_REPORT_2026-10-20.md) | تقرير إنفاذ S-ASSESS-15 المحلي — 2026-10-20 | 2026-10-20 | 6 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_RETENTION_POLICY.md |
| [ASSESS_RETENTION_REVIEW_REPORT_2026-10-20.md](../2026-10/ASSESS_RETENTION_REVIEW_REPORT_2026-10-20.md) | مراجعة حزمة S-ASSESS-15 وتسليم البوابات — 2026-10-20 | 2026-10-20 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| [ASSESS_RUNTIME_LOCAL.md](../../../ASSESS_RUNTIME_LOCAL.md) | ربط Assess المحلي — Node24 | 2026-10-21 | 8 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md](../2026-10/ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md) | تقرير ربط Assess runtime المحلي — 2026-10-20 | 2026-10-20 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_CLOUD_RUN_PLAN_2026-10-21.md |
| [ASSESS_SESSION_POOLER_REPORT_2026-10-21.md](../2026-10/ASSESS_SESSION_POOLER_REPORT_2026-10-21.md) | تقرير إصلاح اسم Session pooler المحلي — 2026-10-21 عمّان | 2026-10-21 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| [ASSESS_STAGING_PLAN.md](../../../ASSESS_STAGING_PLAN.md) | خطة تجهيز بيئة اختبار Assess — 2026-10-20 | 2026-10-20 | 6 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_TRIAL_BATCH_ONE_2026-10-22.md](../2026-10/ASSESS_TRIAL_BATCH_ONE_2026-10-22.md) | تجهيز الدفعة الأولى للتجربة — 2026-10-22 عمّان | 2026-10-21 | 2 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| [ASSESS_TRIAL_BATCH_TWO_2026-10-22.md](../2026-10/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md) | الدفعة الثانية: تجهيز التشغيل وفروق النسخ والتجربة المعلّقة — 2026-10-22 عمّان | 2026-10-22 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-061_BATCH4_REPORT_2026-10-22.md |
| [ASSESS_TRIAL_FINAL_REPORT_2026-10-22.md](../2026-10/ASSESS_TRIAL_FINAL_REPORT_2026-10-22.md) | تقرير المالك النهائي — تجربة Assess الهندسية المضبوطة (المهمة 4) | 2026-10-22 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| [ASSESS_TRIAL_ISOLATION_2026-10-22.md](../2026-10/ASSESS_TRIAL_ISOLATION_2026-10-22.md) | حماية نطاق تجربة Assess محليًا — 2026-10-22 عمّان | 2026-10-21 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md |
| [ASSESS_TRIAL_PREPARATION_2026-10-22.md](../2026-10/ASSESS_TRIAL_PREPARATION_2026-10-22.md) | تحضير أدوات التجربة المضبوطة — 2026-10-22 عمّان | 2026-10-21 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_ONE_2026-10-22.md |
| [ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md](../2026-10/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) | قرار TEMP وقناة السر لعامل Assess — مقترح للمراجعة | 2026-10-21 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| [ASSESS_WORKER_ACTIVATION_REPORT_2026-10-21.md](../2026-10/ASSESS_WORKER_ACTIVATION_REPORT_2026-10-21.md) | تقرير قرار TEMP وقناة السر — 2026-10-21 عمّان | 2026-10-21 | 2 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md |
| [ASSESS_WORKER_LOGIN.md](../../../ASSESS_WORKER_LOGIN.md) | حزمة login عامل Assess — للمراجعة المحلية | 2026-10-21 | 8 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ASSESS_WORKER_LOGIN_REPORT_2026-10-21.md](../2026-10/ASSESS_WORKER_LOGIN_REPORT_2026-10-21.md) | تقرير حزمة login المحدود — 2026-10-21 عمّان | 2026-10-21 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| [ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md](../2026-10/ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md) | تقرير تسليم مرحلة NOLOGIN على الأصلية — 2026-10-21 عمّان | 2026-10-21 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| [ASSET_LICENCE_AUDIT_2026-10-15.md](../../../ASSET_LICENCE_AUDIT_2026-10-15.md) | Asset licence audit (RAD-018, O10 follow-up) — 2026-10-15 | 2026-10-15 | 7 + 1 | KEEP — non-Markdown: src/data/credits.test.ts |
| [ASSET_PROVENANCE_AND_LICENSES.md](../../../ASSET_PROVENANCE_AND_LICENSES.md) | RAD-LAB — Asset provenance & license registry | 2026-10-24 | 27 + 24 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [DECISIONS.md](../../../DECISIONS.md) | Current decisions and residual questions | 2026-11-01 | 191 + 27 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [DEPLOYMENT.md](../../../DEPLOYMENT.md) | RAD-LAB — pilot preview deployment (Cloudflare Pages) | 2026-10-22 | 17 + 2 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [DEPS_SECURITY_REPORT_2026-11-01.md](../../../DEPS_SECURITY_REPORT_2026-11-01.md) | تقرير ترقية next وإغلاق npm audit critical/high — RAD-088، 2026-11-01 | 2026-11-01 | 2 + 0 | KEEP — done completion_evidence: RAD-088 |
| [DOCS_ARCHIVE_2_REPORT.md](../2026-10/DOCS_ARCHIVE_2_REPORT.md) | DOCS-ARCHIVE-2 — الأرشفة والأدلة المختصرة | 2026-10-17 | 6 + 0 | ARCHIVE — تقرير تاريخي غير مؤرخ الاسم؛ حفظ الدليل ونقله لاحقًا بعد موافقة المالك |
| [DOCS_CHECKS.md](../../../DOCS_CHECKS.md) | فحص الوثائق والحالة | 2026-10-24 | 11 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [DOCS_CONSISTENCY_REPORT.md](../2026-10/DOCS_CONSISTENCY_REPORT.md) | تقرير اتساق التسليم والحالة | 2026-10-17 | 0 + 0 | ARCHIVE — تقرير تاريخي غير مؤرخ الاسم؛ حفظ الدليل ونقله لاحقًا بعد موافقة المالك |
| [DOCS_MAINT_1_REPORT.md](../2026-10/DOCS_MAINT_1_REPORT.md) | تقرير DOCS-MAINT-1 — صيانة موجّهة للدوكس (2026-10-17) | 2026-10-17 | 0 + 0 | ARCHIVE — تقرير تاريخي غير مؤرخ الاسم؛ حفظ الدليل ونقله لاحقًا بعد موافقة المالك |
| [DOCS_WORKFLOW_REPORT.md](../2026-10/DOCS_WORKFLOW_REPORT.md) | DOCS-WORKFLOW — القراءة الموجّهة والفحص المشترك | 2026-10-17 | 4 + 0 | ARCHIVE — تقرير تاريخي غير مؤرخ الاسم؛ حفظ الدليل ونقله لاحقًا بعد موافقة المالك |
| [ENGINE_GUIDE.md](../../../ENGINE_GUIDE.md) | Engine and content constraints | 2026-10-25 | 15 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [FORTY_INCH_SID_CHANGES_2026-10-30.md](../2026-10/FORTY_INCH_SID_CHANGES_2026-10-30.md) | استثناء SID40in المسمى — 2026-10-30 | 2026-10-30 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/FORTY_INCH_SID_REPORT_2026-10-30.md |
| [FORTY_INCH_SID_REPORT_2026-10-30.md](../2026-10/FORTY_INCH_SID_REPORT_2026-10-30.md) | قاعدة40بوصة — Part B، 2026-10-30 | 2026-10-30 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-081_100_SETTINGS_2026-10-25.md |
| [HANDOFF.md](../../../HANDOFF.md) | التسليم الحالي — تنظيم الوثائق بعد يوم القاعدة | 2026-11-01 | 77 + 4 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [OWNER_SIGNOFF_REPORT_2026-10-30.md](../../../OWNER_SIGNOFF_REPORT_2026-10-30.md) | تقرير قبول المالك — Part A، 2026-10-30 | 2026-10-30 | 2 + 0 | KEEP — done completion_evidence: RAD-037, RAD-069, RAD-074, RAD-076, RAD-077, RAD-078, RAD-079, RAD-080, RAD-084, RAD-083 |
| [PILOT_PLATFORM_PLAN.md](../../../PILOT_PLATFORM_PLAN.md) | خطة المنصة التجريبية: الحسابات والمحاولات والملاحظات — 2026-10-15 | 2026-10-19 | 17 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [PILOT_PROVIDER_COMPARISON_2026-10-15.md](../../../PILOT_PROVIDER_COMPARISON_2026-10-15.md) | مقارنة مزوّدي الهوية وقاعدة البيانات للإطلاق التجريبي (RAD-040) — 2026-10-15 | 2026-10-15 | 8 + 0 | KEEP — done completion_evidence: RAD-040 |
| [PILOT_PROVIDER_VERIFICATION_CHECKLIST.md](../../../PILOT_PROVIDER_VERIFICATION_CHECKLIST.md) | قائمة التحقق من مزوّد الهوية وقاعدة البيانات (RAD-040) — 2026-10-15 | 2026-10-15 | 3 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [PILOT_SUPABASE_SETUP.md](../../../PILOT_SUPABASE_SETUP.md) | دليل المالك: تجهيز Supabase للإطلاق التجريبي (RAD-041a) — 2026-10-15 | 2026-10-26 | 38 + 7 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [PLATFORM_ARCHITECTURE.md](../../../PLATFORM_ARCHITECTURE.md) | Platform architecture — implemented boundaries | 2026-10-19 | 21 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-019_AI_ASSISTED_REVIEW_2026-10-22.md](../../../RAD-019_AI_ASSISTED_REVIEW_2026-10-22.md) | مراجعة علمية وتعليمية لحزمة RAD-LAB | 2026-10-22 | 5 + 0 | KEEP — done completion_evidence: RAD-065 |
| [RAD-059_OPERATIONS_DESIGN.md](../../../RAD-059_OPERATIONS_DESIGN.md) | RAD-059 — المراقبة والإيقاف والتكلفة، تصميم للهاتف | 2026-10-29 | 5 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-059_OWNER_DRY_RUN_2026-10-29.md](../2026-10/RAD-059_OWNER_DRY_RUN_2026-10-29.md) | RAD-059 — تقرير تمرين المالك الحي المغلق، 2026-10-29 | 2026-11-01 | 8 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-059_PHONE_RUNBOOK.md |
| [RAD-059_PHONE_PACKET.md](../../../RAD-059_PHONE_PACKET.md) | RAD-059 — حزمة SQL للهاتف | 2026-10-29 | 9 + 8 | KEEP — حزمة هاتف/SQL محمية بايتيًا |
| [RAD-059_PHONE_RUNBOOK.md](../../../RAD-059_PHONE_RUNBOOK.md) | RAD-059 — دليل الهاتف للإيقاف والاستعادة | 2026-11-01 | 9 + 2 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-059_REPORT_2026-10-29.md](../2026-10/RAD-059_REPORT_2026-10-29.md) | RAD-059 — تقرير التصميم والإيقاف والمراقبة المحلية | 2026-10-29 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| [RAD-061_BATCH1_REPORT_2026-10-22.md](../../../RAD-061_BATCH1_REPORT_2026-10-22.md) | تقرير RAD-061 — الدفعة 1: تنظيف P1 الآمن (2026-10-22) | 2026-10-22 | 2 + 0 | KEEP — done completion_evidence: RAD-061 |
| [RAD-061_BATCH4_REPORT_2026-10-22.md](../../../RAD-061_BATCH4_REPORT_2026-10-22.md) | تقرير RAD-061 — الدفعة 4: CLN-030 وCLN-037 وتعليقا pipeline.ts، وزر RAD-060 مؤجل إلى RAD-062 (2026-10-22) | 2026-10-22 | 3 + 0 | KEEP — done completion_evidence: RAD-061 |
| [RAD-061_BATCHES_2_3_5_6_REPORT_2026-10-22.md](../../../RAD-061_BATCHES_2_3_5_6_REPORT_2026-10-22.md) | RAD-061 — تقرير الدفعات 2 و3 و5 و6 — 2026-10-22 | 2026-10-22 | 3 + 0 | KEEP — done completion_evidence: RAD-061 |
| [RAD-061_CODE_AUDIT_REPORT_2026-10-22.md](../../../RAD-061_CODE_AUDIT_REPORT_2026-10-22.md) | RAD-061 — تقرير تدقيق الكود القرائي — 2026-10-22 | 2026-10-22 | 9 + 0 | KEEP — done completion_evidence: RAD-061 |
| [RAD-061_TIMEOUT_DIAGNOSIS_2026-10-22.md](../../../RAD-061_TIMEOUT_DIAGNOSIS_2026-10-22.md) | تشخيص بطء `server-runtime.test.ts` — RAD-061 (2026-10-22) | 2026-10-22 | 0 + 1 | KEEP — non-Markdown: src/features/assess/server-runtime.test.ts |
| [RAD-062_P05_PHONE_PACKET.md](../../../RAD-062_P05_PHONE_PACKET.md) | RAD-062 P5 — طوارئ RAD-059 v2 للهاتف | 2026-10-30 | 6 + 5 | KEEP — حزمة هاتف/SQL محمية بايتيًا |
| [RAD-062_P09_LAPTOP_RUNBOOK.md](../../../RAD-062_P09_LAPTOP_RUNBOOK.md) | RAD-062 P9 — owner laptop CLI, single 3+5a DB day | 2026-11-01 | 7 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-064_UI_INVENTORY_REPORT_2026-10-22.md](../../../RAD-064_UI_INVENTORY_REPORT_2026-10-22.md) | RAD-064: التقرير الموحّد لجرد الواجهة والمحاكي | 2026-10-22 | 6 + 0 | KEEP — done completion_evidence: RAD-064 |
| [RAD-065_REVIEW_TRIAGE_2026-10-22.md](../../../RAD-065_REVIEW_TRIAGE_2026-10-22.md) | RAD-065 — فرز رد مراجعة RAD-019 (وثائق فقط)، 2026-10-22 | 2026-10-22 | 11 + 0 | KEEP — done completion_evidence: RAD-065 |
| [RAD-066_UI1_REPORT_2026-10-22.md](../../../RAD-066_UI1_REPORT_2026-10-22.md) | RAD-066 — UI-1: تنظيف تجربة الواجهة (2026-10-22) | 2026-10-22 | 4 + 0 | KEEP — done completion_evidence: RAD-066 |
| [RAD-067_UI3_REPORT_2026-10-22.md](../../../RAD-067_UI3_REPORT_2026-10-22.md) | RAD-067 — UI-3: تخطيط المحاكي على الهاتف (2026-10-22) | 2026-10-22 | 4 + 0 | KEEP — done completion_evidence: RAD-067 |
| [RAD-068_FINAL_REPORT_2026-10-22.md](../../../RAD-068_FINAL_REPORT_2026-10-22.md) | RAD-068 الجزء الأخير — تنظيف نصوص الدليل (D1/D5) وفقرة الشروط (2026-10-22) | 2026-10-23 | 2 + 0 | KEEP — done completion_evidence: RAD-068 |
| [RAD-068_FINAL_TEXT_CHANGES_2026-10-22.md](../2026-10/RAD-068_FINAL_TEXT_CHANGES_2026-10-22.md) | RAD-068 الجزء الأخير — كل نص تغيّر (قديم ← جديد) | 2026-10-23 | 1 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-068_FINAL_REPORT_2026-10-22.md |
| [RAD-068_PART1_REPORT_2026-10-22.md](../../../RAD-068_PART1_REPORT_2026-10-22.md) | RAD-068 الجزء 1 — متابعة الوثائق، موضع العلامة في صورة النتيجة، توحيد الأطراف العليا (2026-10-22) | 2026-10-22 | 4 + 0 | KEEP — done completion_evidence: RAD-066, RAD-068 |
| [RAD-068_PART2_REPORT_2026-10-22.md](../../../RAD-068_PART2_REPORT_2026-10-22.md) | RAD-068 الجزء 2 — دفعة النص T + AR (2026-10-22) | 2026-10-22 | 4 + 0 | KEEP — done completion_evidence: RAD-068 |
| [RAD-068_PART2_TEXT_CHANGES_2026-10-22.md](../2026-10/RAD-068_PART2_TEXT_CHANGES_2026-10-22.md) | RAD-068 الجزء 2 — جدول النصوص المتغيرة (2026-10-22) | 2026-10-22 | 1 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-068_PART2_REPORT_2026-10-22.md |
| [RAD-068_PART3_REPORT_2026-10-22.md](../../../RAD-068_PART3_REPORT_2026-10-22.md) | RAD-068 الجزء 3 — بنود S (2026-10-22) | 2026-10-22 | 4 + 0 | KEEP — done completion_evidence: RAD-068 |
| [RAD-069B2A_REPORT_2026-10-24.md](../2026-10/RAD-069B2A_REPORT_2026-10-24.md) | تقرير RAD-069 الجزء B2a: الثيم الداكن/الفاتح (F7) — 2026-10-24 | 2026-10-24 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-077_PROPOSAL_2026-10-24.md |
| [RAD-069B2B_PHASE_A_REPORT_2026-10-24.md](../../../RAD-069B2B_PHASE_A_REPORT_2026-10-24.md) | تقرير RAD-069 الجزء B2b، المرحلة A: رسومات المكتبة (F8) — 2026-10-24 | 2026-10-24 | 5 + 1 | KEEP — non-Markdown: src/features/platform/pelvis-geometry-drift.test.ts |
| [RAD-069C1_REPORT_2026-10-24.md](../../../RAD-069C1_REPORT_2026-10-24.md) | RAD-069 C1 — إعادة تنظيم لوحة المالك، 2026-10-24 | 2026-10-24 | 4 + 0 | KEEP — done completion_evidence: RAD-044 |
| [RAD-069C2_PHASE2_REPORT_2026-10-24.md](../2026-10/RAD-069C2_PHASE2_REPORT_2026-10-24.md) | RAD-069 C2 — المرحلة2، 2026-10-24 | 2026-10-24 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| [RAD-069C2_REPORT_2026-10-24.md](../2026-10/RAD-069C2_REPORT_2026-10-24.md) | RAD-069 C2 — Phase 1، 2026-10-24 | 2026-10-24 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| [RAD-069_DB_DAY_REPORT_2026-10-24.md](../2026-10/RAD-069_DB_DAY_REPORT_2026-10-24.md) | RAD-069 — DB day: وصل C1 وC2، 2026-10-24 | 2026-10-25 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| [RAD-072_PART1B_HASHES_2026-10-23.md](../2026-10/RAD-072_PART1B_HASHES_2026-10-23.md) | RAD-072 الجزء 1b — كل مفتاح scene-dom متغير وسببه (2026-10-23) | 2026-10-23 | 1 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-072_PART1B_REPORT_2026-10-23.md |
| [RAD-072_PART1B_REPORT_2026-10-23.md](../2026-10/RAD-072_PART1B_REPORT_2026-10-23.md) | RAD-072 الجزء 1b — جودة رسوم الصدر (2026-10-23) | 2026-10-23 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ARABIC_TERMINOLOGY.md |
| [RAD-072_PART1_HASHES_2026-10-23.md](../2026-10/RAD-072_PART1_HASHES_2026-10-23.md) | RAD-072 الجزء 1 — كل مفتاح scene-dom متغير وسببه (2026-10-23) | 2026-10-23 | 2 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-072_PART1B_HASHES_2026-10-23.md |
| [RAD-072_PART1_REPORT_2026-10-23.md](../2026-10/RAD-072_PART1_REPORT_2026-10-23.md) | RAD-072 الجزء 1 — رسوم الصدر (2026-10-23) | 2026-10-23 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ARABIC_TERMINOLOGY.md |
| [RAD-072_PART2A_HASHES_2026-10-23.md](../2026-10/RAD-072_PART2A_HASHES_2026-10-23.md) | RAD-072 الجزء 2a المرحلة B — بصمات scene-dom المتغيرة (2026-10-23) | 2026-10-23 | 1 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md |
| [RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md](../2026-10/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md) | RAD-072 الجزء 2a — تجربة اليد، المرحلة A: التتبّع والتراكب وتشخيص H1 (2026-10-23) | 2026-10-23 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| [RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md](../2026-10/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md) | RAD-072 الجزء 2a — تجربة اليد، المرحلة B: الرسم من المخططات المعتمدة (2026-10-23) | 2026-10-23 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| [RAD-072_PART2B_HASHES_2026-10-23.md](../2026-10/RAD-072_PART2B_HASHES_2026-10-23.md) | RAD-072 الجزء 2b المرحلة B — بصمات scene-dom المتغيرة (2026-10-23) | 2026-10-23 | 1 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md |
| [RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md](../2026-10/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md) | RAD-072 الجزء 2b — الرسغ ثم القدم، المرحلة A: التتبع والتراكب (2026-10-23) | 2026-10-23 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| [RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md](../2026-10/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md) | RAD-072 الجزء 2b — الرسغ ثم القدم، المرحلة B: الرسم من المخططات المعتمدة (2026-10-23) | 2026-10-23 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| [RAD-072_PART2C_HASHES_2026-10-24.md](../2026-10/RAD-072_PART2C_HASHES_2026-10-24.md) | RAD-072 الجزء 2c المرحلة B — بصمات scene-dom المتغيرة (2026-10-24، محدَّثة بعد فحص الهاتف) | 2026-10-23 | 1 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-072_PART2C_PHASE_B_REPORT_2026-10-24.md |
| [RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md](../2026-10/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md) | RAD-072 الجزء 2c — الكتف (Grashey)، المرحلة A: التشخيص والتتبع (2026-10-24) | 2026-10-23 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| [RAD-072_PART2C_PHASE_B_REPORT_2026-10-24.md](../2026-10/RAD-072_PART2C_PHASE_B_REPORT_2026-10-24.md) | RAD-072 الجزء 2c — الكتف (Grashey)، المرحلة B: الرسم من المخططات وزاوية الجسم (2026-10-24) | 2026-10-24 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| [RAD-074_QA_TOOLING_REPORT_2026-10-24.md](../2026-10/RAD-074_QA_TOOLING_REPORT_2026-10-24.md) | RAD-074 — إصلاح أدوات فحص المتصفح على واجهة المحاكي الحالية (تقرير الدفعة) | 2026-10-24 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| [RAD-075_HOUSEKEEPING_REPORT_2026-10-24.md](../2026-10/RAD-075_HOUSEKEEPING_REPORT_2026-10-24.md) | تقرير RAD-075: تنظيف وإصلاحات صغيرة — 2026-10-24 | 2026-10-24 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md |
| [RAD-077_PROPOSAL_2026-10-24.md](../2026-10/RAD-077_PROPOSAL_2026-10-24.md) | RAD-077 — مقترح housekeeping B، خطوة1 — 2026-10-24 | 2026-10-24 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-077_REPORT_2026-10-24.md |
| [RAD-077_REPORT_2026-10-24.md](../2026-10/RAD-077_REPORT_2026-10-24.md) | RAD-077 — تنفيذ قرارات housekeeping B — 2026-10-24 | 2026-10-24 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| [RAD-080_PROPOSAL_2026-10-25.md](../2026-10/RAD-080_PROPOSAL_2026-10-25.md) | RAD-080 — مقترح تحقيق تعارض تحديد مجال الرسغ — 2026-10-25 | 2026-10-25 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| [RAD-081_100_SETTINGS_2026-10-25.md](../../../RAD-081_100_SETTINGS_2026-10-25.md) | RAD-081 A — شهادات بلوغ100 في كل الفحوص | 2026-10-30 | 5 + 1 | KEEP — non-Markdown: src/features/evaluation/forty-inch-sid.test.ts |
| [RAD-081_CHANGES_2026-10-25.md](../2026-10/RAD-081_CHANGES_2026-10-25.md) | RAD-081 — سجل استثناء C: التوقعات والبصمات | 2026-10-25 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| [RAD-081_OWNER_ITEMS_2026-10-25.md](../2026-10/RAD-081_OWNER_ITEMS_2026-10-25.md) | RAD-081 — متابعة قرارات المالك الخمسة — تنفيذ قرارات المالك | 2026-10-25 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| [RAD-081_OWNER_ITEMS_CHANGES_2026-10-25.md](../2026-10/RAD-081_OWNER_ITEMS_CHANGES_2026-10-25.md) | RAD-081 — تغييرات قرارات المالك الخمسة | 2026-10-25 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-081_OWNER_ITEMS_2026-10-25.md |
| [RAD-081_REPORT_2026-10-25.md](../2026-10/RAD-081_REPORT_2026-10-25.md) | RAD-081 — العلامة واللغة وSID الأطراف — 2026-10-25 | 2026-10-25 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/FORTY_INCH_SID_REPORT_2026-10-30.md |
| [RAD-085_AUTH_FK_REPORT_2026-10-28.md](../2026-10/RAD-085_AUTH_FK_REPORT_2026-10-28.md) | RAD-085 — إصلاح حارس جرد Auth في M4 · 2026-10-28 | 2026-10-28 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_DB_DAY_COMPLETED_2026-10-28.md |
| [RAD-085_CRLF_READINESS_REPORT_2026-10-28.md](../2026-10/RAD-085_CRLF_READINESS_REPORT_2026-10-28.md) | RAD-085 — إصلاح جاهزية CRLF وفق B7 · 2026-10-28 | 2026-10-28 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_DB_DAY_P1.md |
| [RAD-085_D3_REPORT_2026-10-27.md](../2026-10/RAD-085_D3_REPORT_2026-10-27.md) | RAD-085 — D3 / W2 / combined DB-day report · 2026-10-27 | 2026-10-27 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_SECURITY_REVIEW_2026-10-27.md |
| [RAD-085_D3_SQL_GAP.md](../../../RAD-085_D3_SQL_GAP.md) | RAD-085 — D3 SQL gap: implemented locally, deferred for review | 2026-10-27 | 6 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-085_DB_DAY_COMPLETED_2026-10-28.md](../2026-10/RAD-085_DB_DAY_COMPLETED_2026-10-28.md) | RAD-085 — إتمام DB day الحي وخطر لصق الهاتف · 2026-10-28 | 2026-10-28 | 8 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_DB_DAY_P1.md |
| [RAD-085_DB_DAY_P1.md](../../../RAD-085_DB_DAY_P1.md) | RAD-085 — combined DB day P1 / D3 · owner packet (no-laptop variant) | 2026-10-28 | 14 + 31 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-085_ERASURE_MATRIX_2026-10-26.md](../2026-10/RAD-085_ERASURE_MATRIX_2026-10-26.md) | RAD-085 — مصفوفة المحو والاحتفاظ | 2026-10-27 | 10 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| [RAD-085_P1_B_COMPLETED_2026-10-29.md](../2026-10/RAD-085_P1_B_COMPLETED_2026-10-29.md) | RAD-085 — إتمام mini DB day B وقبول الهاتف، 2026-10-29 | 2026-10-29 | 7 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| [RAD-085_P1_B_DB_DAY.md](../../../RAD-085_P1_B_DB_DAY.md) | RAD-085 — دليل mini DB day B على الهاتف | 2026-10-28 | 6 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-085_P1_B_PHONE_PACKET.md](../../../RAD-085_P1_B_PHONE_PACKET.md) | RAD-085 — mini DB day B للهاتف (مولّد محليًا) | 2026-10-28 | 3 + 2 | KEEP — حزمة هاتف/SQL محمية بايتيًا |
| [RAD-085_P1_USABILITY_A_2026-10-28.md](../2026-10/RAD-085_P1_USABILITY_A_2026-10-28.md) | RAD-085 — PR A: قابلية استخدام P1 بعد اختبار الهاتف | 2026-10-28 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_P1_B_COMPLETED_2026-10-29.md |
| [RAD-085_P1_USABILITY_B_2026-10-28.md](../2026-10/RAD-085_P1_USABILITY_B_2026-10-28.md) | RAD-085 — PR B: رمز قصير وأسماء وحزمة هاتف | 2026-10-28 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_P1_B_COMPLETED_2026-10-29.md |
| [RAD-085_PLAN_2026-10-25.md](../2026-10/RAD-085_PLAN_2026-10-25.md) | RAD-085 — المشرف أولًا، ثم أول امتحان حقيقي، ثم الكتابي، ثم الصور | 2026-10-27 | 19 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| [RAD-085_PROMOTION_REPORT_2026-10-27.md](../2026-10/RAD-085_PROMOTION_REPORT_2026-10-27.md) | RAD-085 — PR الترقية بعد DB day · 2026-10-27 | 2026-10-28 | 3 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_CRLF_READINESS_REPORT_2026-10-28.md |
| [RAD-085_REMAINING_OPERATIONS_2026-10-26.md](../2026-10/RAD-085_REMAINING_OPERATIONS_2026-10-26.md) | RAD-085 — قائمة إعدادات التشغيل المتبقية | 2026-10-27 | 15 + 0 | KEEP — byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| [RAD-085_REPORT_2026-10-27.md](../2026-10/RAD-085_REPORT_2026-10-27.md) | RAD-085 — التقرير الموحد، 2026-10-27 | 2026-10-27 | 8 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| [RAD-085_SECURITY_REVIEW_2026-10-27.md](../2026-10/RAD-085_SECURITY_REVIEW_2026-10-27.md) | RAD-085 — مراجعة أمنية مستقلة · 2026-10-27 | 2026-10-27 | 6 + 0 | KEEP — byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| [RAD-085_SEC_FIXES_REPORT_2026-10-27.md](../2026-10/RAD-085_SEC_FIXES_REPORT_2026-10-27.md) | RAD-085 — إصلاح نتائج المراجعة الأمنية المستقلة · 2026-10-27 | 2026-10-27 | 5 + 0 | KEEP — byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| [RAD-085_SQL_CONTRACTS_2026-10-26.md](../2026-10/RAD-085_SQL_CONTRACTS_2026-10-26.md) | RAD-085 — عقود SQL المحلية المؤجلة عن الواجهة | 2026-10-27 | 14 + 0 | KEEP — byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| [RAD-085_TERMS_P1_PROPOSAL.md](../../../RAD-085_TERMS_P1_PROPOSAL.md) | RAD-085 — Terms P1 · approved proposal for DB day | 2026-10-27 | 6 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-086_LAPTOP_BACKUP_RUNBOOK.md](../../../RAD-086_LAPTOP_BACKUP_RUNBOOK.md) | RAD-086 — owner laptop: daily backup, restore proof, credential-cache test (WSL2) | 2026-10-31 | 5 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-086_PROBE_SQL_PACKET.md](../../../RAD-086_PROBE_SQL_PACKET.md) | RAD-086 — Supavisor old-credential / cache probe: owner-run SQL packet (production, session pooler) | 2026-11-01 | 4 + 1 | KEEP — حزمة هاتف/SQL محمية بايتيًا |
| [RAD-086_REPORT_2026-10-31.md](../../../RAD-086_REPORT_2026-10-31.md) | RAD-086 / RAD-059 — نتيجة Supavisor من تشغيل المالك، 2026-11-01 | 2026-11-01 | 8 + 0 | KEEP — done completion_evidence: RAD-086 |
| [RAD-LAB_Medical_Reference_Ankle.md](../../../RAD-LAB_Medical_Reference_Ankle.md) | RAD-LAB — Medical Reference: Ankle AP and Ankle Lateral (adult, supine / lateral recumbent, digital radiography) | 2026-10-08 | 6 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Chest_AP.md](../../../RAD-LAB_Medical_Reference_Chest_AP.md) | RAD-LAB — Medical Reference: Adult Chest AP (erect / semi-erect / supine; fixed or mobile detector) — positioning, technique, image quality | 2026-10-17 | 4 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Chest_Lateral.md](../../../RAD-LAB_Medical_Reference_Chest_Lateral.md) | RAD-LAB — Medical Reference: Adult Chest Lateral (erect) — positioning, technique, image quality | 2026-10-17 | 6 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Chest_PA.md](../../../RAD-LAB_Medical_Reference_Chest_PA.md) | RAD-LAB Medical Reference Baseline — Adult Chest PA Erect | 2026-10-06 | 5 + 2 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md](../../../RAD-LAB_Medical_Reference_Chest_PA_Image_Quality.md) | RAD-LAB --- Medical Reference: Adult PA Chest Image Quality & Educational Result Rendering | 2026-10-06 | 3 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Chest_PA_Technique.md](../../../RAD-LAB_Medical_Reference_Chest_PA_Technique.md) | RAD-LAB --- Medical Reference: Adult PA Chest Technique (Digital Radiography) | 2026-10-06 | 2 + 2 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Elbow.md](../../../RAD-LAB_Medical_Reference_Elbow.md) | RAD-LAB — Medical Reference: Elbow AP (fully extended) and Elbow Lateral (90° flexed) (adult, seated at the table, digital radiography) | 2026-10-07 | 8 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Hand.md](../../../RAD-LAB_Medical_Reference_Hand.md) | RAD-LAB — Medical Reference: Hand PA and Hand Lateral (adult, seated at the table, digital radiography) | 2026-10-07 | 7 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Knee_Foot.md](../../../RAD-LAB_Medical_Reference_Knee_Foot.md) | RAD-LAB — Medical Reference: Knee AP, Knee Lateral, Foot AP (DP) and Foot AP Medial Oblique (adult, supine / lateral recumbent, digital radiography) | 2026-10-07 | 7 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Pelvis_AP.md](../../../RAD-LAB_Medical_Reference_Pelvis_AP.md) | RAD-LAB — Medical Reference: Pelvis AP (adult, supine, digital radiography) | 2026-10-15 | 6 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Shoulder_Grashey.md](../../../RAD-LAB_Medical_Reference_Shoulder_Grashey.md) | RAD-LAB — Medical Reference: Shoulder AP oblique, glenoid cavity (Grashey) | 2026-10-15 | 6 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Shoulder_Y.md](../../../RAD-LAB_Medical_Reference_Shoulder_Y.md) | RAD-LAB — Medical Reference: Shoulder PA oblique, scapular Y lateral | 2026-10-15 | 7 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Medical_Reference_Wrist.md](../../../RAD-LAB_Medical_Reference_Wrist.md) | RAD-LAB — Medical Reference: Wrist PA and Wrist Lateral (adult, seated at the table, digital radiography) | 2026-10-07 | 10 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD-LAB_Project_Specification.md](../../../RAD-LAB_Project_Specification.md) | RAD-LAB — Project Specification | 2026-10-17 | 4 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [RAD_047B_IMPLEMENTATION_PLAN.md](../../../RAD_047B_IMPLEMENTATION_PLAN.md) | RAD-047b — Ordered pilot core implementation plan (PROPOSED) | 2026-10-17 | 6 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [README.md](../../../README.md) | دليل قراءة وثائق RAD-LAB | 2026-10-21 | 8 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md](../../../REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md) | Consolidated review checklist — educator / medical physicist | 2026-10-17 | 9 + 3 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [REVIEW_PACKAGE.md](../../../REVIEW_PACKAGE.md) | Review package for the educator / medical physicist (O5, S10b-17) | 2026-10-25 | 22 + 3 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [ROADMAP_SESSIONS.md](../../../ROADMAP_SESSIONS.md) | Roadmap — current direction | 2026-10-19 | 17 + 0 | MERGE INTO docs/README.md — قاعدة مصدر الحالة/القراءة مكررة: ROADMAP:5 وREADME:3؛ تعارض/تقادم ROADMAP:9,14 مفصل أدناه؛ دمج الاتجاه المفيد مع إبقاء دليل التاريخ |
| [TERMS_OWNER_DRAFT_2026-10-16.md](../../../TERMS_OWNER_DRAFT_2026-10-16.md) | RAD-050 — Owner-selected bilingual draft — 2026-10-16 (Asia/Amman) | 2026-10-16 | 6 + 1 | KEEP — non-Markdown: scripts/qa/pilot-consent-audit.mjs |
| [TERMS_REVIEW_2026-10-16.md](../2026-10/TERMS_REVIEW_2026-10-16.md) | RAD-050 — Terms and Privacy consistency review — 2026-10-16 | 2026-10-16 | 4 + 0 | KEEP — byte-identical protected Markdown: docs/TERMS_OWNER_DRAFT_2026-10-16.md |
| [exam-recipe.md](../../../exam-recipe.md) | Exam recipe — adding one X-ray exam to RAD-LAB | 2026-10-17 | 24 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [project-status.md](../../../project-status.md) | حالة مشروع RAD-LAB | 2026-11-01 | 99 + 5 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [session-13b-scene-design.md](../../../session-13b-scene-design.md) | Historical session — compatibility pointer | 2026-10-17 | 1 + 0 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [session-3-technique.md](../../../session-3-technique.md) | Historical session — compatibility pointer | 2026-10-17 | 1 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [session-5-qa.md](../../../session-5-qa.md) | Historical session — compatibility pointer | 2026-10-17 | 1 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [session-7-demographics-impact.md](../../../session-7-demographics-impact.md) | Historical session — compatibility pointer | 2026-10-17 | 1 + 1 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |
| [status-archive.md](../../status-archive.md) | أرشيف ملف الحالة (للقراءة فقط، لا يُحدَّث) | 2026-10-17 | 4 + 0 | ARCHIVE — تقرير تاريخي غير مؤرخ الاسم؛ حفظ الدليل ونقله لاحقًا بعد موافقة المالك |
| [status-format.md](../../../status-format.md) | تنسيق ملف الحالة وقواعد تحديثه | 2026-10-17 | 12 + 3 | KEEP — مرجع حي أو عقد أو دليل تشغيل/مراجعة قائم |

### مواضع التعارض والتقادم

- `docs/ROADMAP_SESSIONS.md:9` يقول «without a separate report or checklist»، خلاف `AGENTS.md:47–48` الذي يضع الدليل في تقرير ويُلزم تقرير S-STD-1. و`ROADMAP_SESSIONS.md:14` يوجّه البدء بمرحلة A، بينما `DECISIONS.md` عند anchor `db-day-outcome-owner-2026-11-01` يسجل تنفيذ اليوم و`db-followups-owner-2026-11-01` يحدد المتابعات الحالية. التوصية: MERGE INTO docs/README.md؛ موضع تكرار قاعدة مصدر الحالة: ROADMAP:5 مقابل README:3. لا تعديل للحكم أو النص في هذه الدفعة.

- تقارير DOCS التاريخية و`status-archive.md` تصف مواضع workflow/الملخص القديمة؛ هي أدلة مؤرخة بسياقها وليست قواعد حية مضادة لـD3/D4. توصية ARCHIVE تحفظها ولا تنقلها الآن. `RAD-085_DB_DAY_P1.md:3` يصرّح بأن SQL Editor التاريخي لا يعاد تشغيله؛ لذلك ليس استثناءً جديدًا لسياسة live. لا تعارض طبي جديد مثبت في هذا الجرد القرائي؛ لا يعد اعتمادًا طبيًا أو ترخيصيًا.

## 2. كل صورة وJSON في نطاق الجرد

270 ملفًا =269صورة +1JSON. EXACT = الاسم الكامل أو basename؛ GLOB يشمل نمطًا موثقًا أو template مخرجات سكربت بعد تحويل المتغيرات إلى * أو دليل directory/*؛ NONE = لا إحالة ملفية/نمطية مكتشفة. تقرير المالك للمجموعة مذكور منفصلًا حتى عندما لا يسرد كل اسم. فُحصت ملفات غير Markdown أيضًا، بما فيها المسارات التي يركّبها الكود. مراجع سجلات الحقوق تعامل KEEP دائمًا.

### p1

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 4 ملفًا؛ 0.342271 MB.

التقارير المالكة: `docs/RAD-085_P1_USABILITY_B_2026-10-28.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/p1-b-ar.jpg` | 80287 | EXACT `docs/RAD-085_P1_USABILITY_B_2026-10-28.md`; GLOB `scripts/qa/rad085-p1-routes-audit.mjs`; p1-b-*.jpg |
| `docs/review/p1-b-en.jpg` | 90971 | EXACT `docs/RAD-085_P1_USABILITY_B_2026-10-28.md`; GLOB `scripts/qa/rad085-p1-routes-audit.mjs`; p1-b-*.jpg |
| `docs/review/p1-usability-ar.jpg` | 80200 | NONE |
| `docs/review/p1-usability-en.jpg` | 90813 | NONE |
### rad-069a

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 16 ملفًا؛ 10.485512 MB.

التقارير المالكة: `docs/archive/reports/2026-10/RAD-069A_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-069a-ar-1440-fail-after.png` | 426631 | EXACT `docs/archive/reports/2026-10/RAD-069A_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-ar-1440-fail-before.png` | 1469731 | EXACT `docs/archive/reports/2026-10/RAD-069A_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-ar-1440-pass-after.png` | 255604 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-ar-1440-pass-before.png` | 1059109 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-ar-390-fail-after.png` | 273743 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-ar-390-fail-before.png` | 1003705 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-ar-390-pass-after.png` | 129590 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-ar-390-pass-before.png` | 589282 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-en-1440-fail-after.png` | 406117 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-en-1440-fail-before.png` | 1504297 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-en-1440-pass-after.png` | 257226 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-en-1440-pass-before.png` | 1066673 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-en-390-fail-after.png` | 256299 | EXACT `docs/archive/reports/2026-10/RAD-069A_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-en-390-fail-before.png` | 1043677 | EXACT `docs/archive/reports/2026-10/RAD-069A_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-en-390-pass-after.png` | 130392 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
| `docs/review/rad-069a-en-390-pass-before.png` | 613436 | GLOB `scripts/qa/rad-069a-review.mjs`; rad-069a-*-*.png |
### rad-069b1

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 57 ملفًا؛ 5.183969 MB.

التقارير المالكة: `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-069b1-after-ar-1440-body.png` | 87790 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-1440-home.png` | 51648 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-1440-library.png` | 69949 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-1440-lower-limb.png` | 93110 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-1440-training-collapsed.png` | 64335 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-1440-training-expanded.png` | 129878 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-1440-upper-limb.png` | 94904 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-390-body.png` | 53709 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-390-home.png` | 32205 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-390-library.png` | 41979 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-390-lower-limb.png` | 56626 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-390-training-collapsed.png` | 40246 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-390-training-expanded.png` | 101299 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-ar-390-upper-limb.png` | 63032 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-1440-body.png` | 90910 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-1440-home.png` | 60326 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-1440-library.png` | 77054 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-1440-lower-limb.png` | 97165 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-1440-training-collapsed.png` | 75083 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-1440-training-expanded.png` | 147226 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-1440-upper-limb.png` | 100716 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-390-body.png` | 54783 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-390-home.png` | 35853 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-390-library.png` | 45989 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-390-lower-limb.png` | 58614 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-390-training-collapsed.png` | 46281 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-390-training-expanded.png` | 115653 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-after-en-390-upper-limb.png` | 66521 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-1440-body.png` | 121113 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-1440-home.png` | 163592 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-1440-library.png` | 101992 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-1440-lower-limb.png` | 132880 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-1440-training-collapsed.png` | 77153 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-1440-training-expanded.png` | 98776 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-1440-upper-limb.png` | 149296 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-390-body.png` | 114850 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-390-home.png` | 72483 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-390-library.png` | 85380 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-390-lower-limb.png` | 136619 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-390-training-collapsed.png` | 60629 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-390-training-expanded.png` | 66654 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-ar-390-upper-limb.png` | 149103 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-1440-body.png` | 121184 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-1440-home.png` | 167640 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-1440-library.png` | 106363 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-1440-lower-limb.png` | 134660 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-1440-training-collapsed.png` | 84510 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-1440-training-expanded.png` | 110361 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-1440-upper-limb.png` | 152407 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-390-body.png` | 116875 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-390-home.png` | 76656 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-390-library.png` | 87966 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-390-lower-limb.png` | 139857 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-390-training-collapsed.png` | 65786 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-390-training-expanded.png` | 74821 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-before-en-390-upper-limb.png` | 155135 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; GLOB `scripts/qa/rad-069b1-pages-audit.mjs`; rad-069b1-*-*-*.png |
| `docs/review/rad-069b1-metrics.json` | 6344 | EXACT `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md`; EXACT `scripts/qa/rad-069b1-pages-audit.mjs` |
### rad-069b2a

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 72 ملفًا؛ 18.100280 MB.

التقارير المالكة: `docs/RAD-069B2A_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-069b2a-dark-ar-1440-account.png` | 28115 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-1440-credits.png` | 1277533 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-1440-exam-hub.png` | 59597 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-1440-home.png` | 34022 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-1440-library.png` | 68889 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-1440-practice.png` | 204960 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-1440-result.png` | 238820 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-1440-terms.png` | 344860 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-1440-training.png` | 132164 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-account.png` | 23489 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-credits.png` | 1169312 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-exam-hub.png` | 37936 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-home.png` | 14210 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-library.png` | 43484 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-practice.png` | 90210 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-result.png` | 89436 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-terms.png` | 309227 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-ar-390-training.png` | 103212 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-account.png` | 31762 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-credits.png` | 1424834 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-exam-hub.png` | 67158 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-home.png` | 36575 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-library.png` | 76165 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-practice.png` | 227830 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-result.png` | 254066 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-terms.png` | 426497 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-1440-training.png` | 150167 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-account.png` | 26824 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-credits.png` | 1303956 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-exam-hub.png` | 42720 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-home.png` | 13302 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-library.png` | 47651 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-practice.png` | 96418 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-result.png` | 93584 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-terms.png` | 372105 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-dark-en-390-training.png` | 118322 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-account.png` | 28082 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-credits.png` | 1273755 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-exam-hub.png` | 59331 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-home.png` | 33778 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-library.png` | 68189 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-practice.png` | 202967 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-result.png` | 237951 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-terms.png` | 342957 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-1440-training.png` | 131349 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-account.png` | 23176 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-credits.png` | 1160821 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-exam-hub.png` | 37448 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-home.png` | 13955 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-library.png` | 41963 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-practice.png` | 89871 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-result.png` | 88820 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-terms.png` | 306091 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-ar-390-training.png` | 101290 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-account.png` | 31645 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-credits.png` | 1417975 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-exam-hub.png` | 66621 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-home.png` | 36401 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-library.png` | 75217 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-practice.png` | 225840 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-result.png` | 253454 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-terms.png` | 425366 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-1440-training.png` | 148847 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-account.png` | 26548 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-credits.png` | 1293250 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-exam-hub.png` | 41988 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-home.png` | 13078 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-library.png` | 45906 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-practice.png` | 95881 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-result.png` | 92570 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-terms.png` | 372818 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
| `docs/review/rad-069b2a-light-en-390-training.png` | 115669 | GLOB `docs/RAD-069B2A_REPORT_2026-10-24.md`; docs/review/rad-069b2a-*; GLOB `scripts/qa/rad-069b2a-themes-audit.mjs`; rad-069b2a-*-*-*-*.png |
### rad-069b2b

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 6 ملفًا؛ 1.021873 MB.

التقارير المالكة: `docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-069b2b-contact-dark.jpg` | 334195 | EXACT `docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md` |
| `docs/review/rad-069b2b-contact-light.jpg` | 324605 | EXACT `docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md` |
| `docs/review/rad-069b2b-phaseb-contact-dark.jpg` | 133060 | EXACT `docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md` |
| `docs/review/rad-069b2b-phaseb-contact-light.jpg` | 131685 | NONE |
| `docs/review/rad-069b2b-phaseb2-contact-dark.jpg` | 49158 | NONE |
| `docs/review/rad-069b2b-phaseb2-contact-light.jpg` | 49170 | NONE |
### rad-072-foot

**KEEP** — رخصة/provenance؛ KEEP إلزامي. 11 ملفًا؛ 6.596377 MB.

التقارير المالكة: `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-072-foot/ankle-lateral-orientation-check.png` | 445407 | EXACT `docs/ASSET_PROVENANCE_AND_LICENSES.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; GLOB `scripts/trace-outlines/trace-foot-outlines.py`; directory/* |
| `docs/review/rad-072-foot/ap-all.png` | 562907 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/ap-metatarsals.png` | 789205 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/ap-soft-tissue.png` | 541564 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/ap-tarsals.png` | 748755 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/ap-toes.png` | 710379 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-all.png` | 430254 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-metatarsals.png` | 748735 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-soft-tissue.png` | 410129 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-tarsals.png` | 512589 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
| `docs/review/rad-072-foot/oblique-toes.png` | 696453 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py` |
### rad-072-hand

**KEEP** — رخصة/provenance؛ KEEP إلزامي. 8 ملفًا؛ 4.162929 MB.

التقارير المالكة: `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-072-hand/lateral-all.png` | 341713 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; GLOB `scripts/trace-outlines/README.md`; directory/*; EXACT `scripts/trace-outlines/trace-hand-outlines.py`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-hand/lateral-digits-thumb.png` | 395720 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; GLOB `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; directory/*; GLOB `scripts/trace-outlines/README.md`; directory/*; EXACT `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-hand/lateral-wrist.png` | 321525 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; GLOB `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; directory/*; GLOB `scripts/trace-outlines/README.md`; directory/*; EXACT `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-hand/pa-all.png` | 768674 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`; GLOB `scripts/trace-outlines/README.md`; directory/*; EXACT `scripts/trace-outlines/trace-hand-outlines.py`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-hand/pa-digits-joints.png` | 666636 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; GLOB `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; directory/*; GLOB `scripts/trace-outlines/README.md`; directory/*; EXACT `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-hand/pa-metacarpals-thumb.png` | 476095 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; GLOB `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; directory/*; GLOB `scripts/trace-outlines/README.md`; directory/*; EXACT `scripts/trace-outlines/trace-hand-outlines.py` |
| `docs/review/rad-072-hand/pa-soft-tissue.png` | 748921 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`; GLOB `scripts/trace-outlines/README.md`; directory/*; EXACT `scripts/trace-outlines/trace-hand-outlines.py`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-hand/pa-wrist.png` | 443645 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; GLOB `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; directory/*; GLOB `scripts/trace-outlines/README.md`; directory/*; EXACT `scripts/trace-outlines/trace-hand-outlines.py` |
### rad-072-part3b

**ARCHIVE** — منفذ: المراجع الوحيدة تقارير نُقلت في الدفعة. 10 ملفًا؛ 0.962652 MB. الوجهة `docs/archive/review/rad-072-part3b/`.

التقارير المالكة: `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-072-part3b-ankle-ap-result-key-1440.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-ankle-ap-result-key-1440.png` | 72383 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-ankle-ap-result-key-390.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-ankle-ap-result-key-390.png` | 83468 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-chest-ap-supine-1-relaxed-after.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-ap-supine-1-relaxed-after.png` | 107917 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-chest-ap-supine-1-relaxed-before.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-ap-supine-1-relaxed-before.png` | 107917 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-chest-ap-supine-1-rolled-after.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-ap-supine-1-rolled-after.png` | 107934 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-chest-ap-supine-1-rolled-before.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-ap-supine-1-rolled-before.png` | 108086 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-chest-pa-erect-0-after.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-pa-erect-0-after.png` | 113009 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-chest-pa-erect-0-before.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-pa-erect-0-before.png` | 104766 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-shoulder-grashey-erect-result-key-1440.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-shoulder-grashey-erect-result-key-1440.png` | 68307 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
| `docs/review/rad-072-part3b-shoulder-grashey-erect-result-key-390.png` → `docs/archive/review/rad-072-part3b/rad-072-part3b-shoulder-grashey-erect-result-key-390.png` | 88865 | EXACT `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` |
### rad-072-shoulder

**KEEP** — رخصة/provenance؛ KEEP إلزامي. 5 ملفًا؛ 3.611385 MB.

التقارير المالكة: `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`; `docs/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-072-shoulder/all.png` | 808866 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py`; EXACT `scripts/trace-outlines/trace-hand-outlines.py`; EXACT `scripts/trace-outlines/trace-shoulder-outlines.py`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-shoulder/humerus.png` | 640560 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md`; EXACT `scripts/trace-outlines/trace-shoulder-outlines.py` |
| `docs/review/rad-072-shoulder/scapula-acromion-clavicle.png` | 863866 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md`; EXACT `scripts/trace-outlines/trace-shoulder-outlines.py` |
| `docs/review/rad-072-shoulder/scapular-border.png` | 527017 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md`; EXACT `scripts/trace-outlines/trace-shoulder-outlines.py` |
| `docs/review/rad-072-shoulder/soft-tissue.png` | 771076 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md`; EXACT `scripts/trace-outlines/trace-foot-outlines.py`; EXACT `scripts/trace-outlines/trace-hand-outlines.py`; EXACT `scripts/trace-outlines/trace-shoulder-outlines.py`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
### rad-072-wrist

**KEEP** — رخصة/provenance؛ KEEP إلزامي. 7 ملفًا؛ 3.209727 MB.

التقارير المالكة: `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-072-wrist/lateral-all.png` | 259862 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-hand-outlines.py`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/lateral-carpals.png` | 498317 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/lateral-forearm.png` | 302896 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/pa-all.png` | 547297 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-hand-outlines.py`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/pa-carpals.png` | 529463 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/pa-forearm-metacarpals.png` | 552489 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
| `docs/review/rad-072-wrist/pa-soft-tissue.png` | 519403 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; directory/*; EXACT `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md`; EXACT `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md`; EXACT `scripts/trace-outlines/trace-hand-outlines.py`; EXACT `scripts/trace-outlines/trace-wrist-outlines.py` |
### rad-074

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 3 ملفًا؛ 0.245297 MB.

التقارير المالكة: `docs/RAD-074_QA_TOOLING_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-074-knee-ap-en-390-fitted-guides-on.png` | 75992 | EXACT `docs/RAD-074_QA_TOOLING_REPORT_2026-10-24.md` |
| `docs/review/rad-074-pelvis-ap-supine-en-390-fitted-guides-on.png` | 88085 | EXACT `docs/RAD-074_QA_TOOLING_REPORT_2026-10-24.md` |
| `docs/review/rad-074-pelvis-ap-supine-en-390-whole-guides-on.png` | 81220 | EXACT `docs/RAD-074_QA_TOOLING_REPORT_2026-10-24.md` |
### rad-077

**ARCHIVE** — مقترح فقط: أدلة جلسة مكتملة مع تقارير باقية؛ تحتاج تحديث إحالاتها بعد موافقة المالك. 1 ملفًا؛ 4.791492 MB. الوجهة `docs/archive/review/rad-077/`.

التقارير المالكة: `docs/RAD-077_PROPOSAL_2026-10-24.md`; `docs/RAD-077_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad-077-contact.jpg` | 4791492 | EXACT `docs/RAD-077_PROPOSAL_2026-10-24.md`; EXACT `docs/RAD-077_REPORT_2026-10-24.md` |
### rad069

**ARCHIVE** — مقترح فقط: أدلة جلسة مكتملة مع تقارير باقية؛ تحتاج تحديث إحالاتها بعد موافقة المالك. 2 ملفًا؛ 0.719570 MB. الوجهة `docs/archive/review/rad069/`.

التقارير المالكة: `docs/RAD-069_DB_DAY_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad069-db-day.jpg` | 121219 | EXACT `docs/RAD-069_DB_DAY_REPORT_2026-10-24.md` |
| `docs/review/rad069-terms-review.jpg` | 598351 | EXACT `docs/RAD-069_DB_DAY_REPORT_2026-10-24.md` |
### rad069c1

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 1 ملفًا؛ 0.313665 MB.

التقارير المالكة: `docs/RAD-069C1_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad069c1-owner.jpg` | 313665 | EXACT `docs/RAD-069C1_REPORT_2026-10-24.md`; EXACT `scripts/qa/rad-069c1-owner-audit.mjs` |
### rad069c2

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 1 ملفًا؛ 0.170018 MB.

التقارير المالكة: `docs/RAD-069C2_PHASE2_REPORT_2026-10-24.md`; `docs/archive/reports/2026-10/RAD-076_REPORT_2026-10-24.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad069c2-ui.jpg` | 170018 | EXACT `docs/RAD-069C2_PHASE2_REPORT_2026-10-24.md`; EXACT `docs/archive/reports/2026-10/RAD-076_REPORT_2026-10-24.md`; EXACT `scripts/qa/rad-069c2-audit.mjs` |
### rad078

**ARCHIVE** — منفذ: المراجع الوحيدة تقارير نُقلت في الدفعة. 1 ملفًا؛ 0.174962 MB. الوجهة `docs/archive/review/rad078/`.

التقارير المالكة: `docs/archive/reports/2026-10/RAD-078_REPORT_2026-10-25.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad078-consent-review.jpg` → `docs/archive/review/rad078/rad078-consent-review.jpg` | 174962 | EXACT `docs/archive/reports/2026-10/RAD-078_REPORT_2026-10-25.md` |
### rad079

**ARCHIVE** — منفذ: المراجع الوحيدة تقارير نُقلت في الدفعة. 2 ملفًا؛ 0.512372 MB. الوجهة `docs/archive/review/rad079/`.

التقارير المالكة: `docs/archive/reports/2026-10/RAD-079_REPORT_2026-10-25.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad079-result-after.jpg` → `docs/archive/review/rad079/rad079-result-after.jpg` | 266593 | EXACT `docs/archive/reports/2026-10/RAD-079_REPORT_2026-10-25.md` |
| `docs/review/rad079-result-before.jpg` → `docs/archive/review/rad079/rad079-result-before.jpg` | 245779 | EXACT `docs/archive/reports/2026-10/RAD-079_REPORT_2026-10-25.md` |
### rad080

**ARCHIVE** — مقترح فقط: أدلة جلسة مكتملة مع تقارير باقية؛ تحتاج تحديث إحالاتها بعد موافقة المالك. 1 ملفًا؛ 4.223922 MB. الوجهة `docs/archive/review/rad080/`.

التقارير المالكة: `docs/RAD-080_PROPOSAL_2026-10-25.md`; `docs/archive/reports/2026-10/RAD-080_REPORT_2026-10-25.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad080-collimation-contact.jpg` | 4223922 | EXACT `docs/RAD-080_PROPOSAL_2026-10-25.md`; EXACT `docs/archive/reports/2026-10/RAD-080_REPORT_2026-10-25.md` |
### rad081

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 8 ملفًا؛ 0.701089 MB.

التقارير المالكة: `docs/RAD-081_REPORT_2026-10-25.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad081-a-pa-ar390-overlap.jpg` | 44692 | EXACT `docs/RAD-081_REPORT_2026-10-25.md` |
| `docs/review/rad081-a-pa-en1440-overlap.jpg` | 95269 | EXACT `docs/RAD-081_REPORT_2026-10-25.md` |
| `docs/review/rad081-b-lateral-en1440-result.jpg` | 79434 | EXACT `docs/RAD-081_REPORT_2026-10-25.md` |
| `docs/review/rad081-b-pa-ar390-result.jpg` | 37746 | EXACT `docs/RAD-081_REPORT_2026-10-25.md` |
| `docs/review/rad081-b-pa-ar390-setup.jpg` | 49394 | EXACT `docs/RAD-081_REPORT_2026-10-25.md` |
| `docs/review/rad081-c-knee-ar390-sid100.jpg` | 63772 | EXACT `docs/RAD-081_REPORT_2026-10-25.md` |
| `docs/review/rad081-c-wrist-en1440-sid100.jpg` | 22502 | EXACT `docs/RAD-081_REPORT_2026-10-25.md` |
| `docs/review/rad081-owner-items-before-after.jpg` | 308280 | EXACT `docs/RAD-081_OWNER_ITEMS_2026-10-25.md` |
### rad083

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 2 ملفًا؛ 0.362568 MB.

التقارير المالكة: `docs/archive/reports/2026-10/RAD-083_REPORT_2026-10-25.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad083-reminder.jpg` | 46811 | EXACT `docs/archive/reports/2026-10/RAD-083_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-083-survey-audit.mjs`; rad083-*.jpg,rad083-*.jpg |
| `docs/review/rad083-survey.jpg` | 315757 | EXACT `docs/archive/reports/2026-10/RAD-083_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-083-survey-audit.mjs`; rad083-*.jpg,rad083-*.jpg |
### rad085

**KEEP** — مسار سكربت/JSON ثابت أو دليل مراجعة/هاتف قائم. 22 ملفًا؛ 3.212395 MB.

التقارير المالكة: `docs/RAD-085_D3_REPORT_2026-10-27.md`; `docs/archive/RAD-085_ASSIGNMENT_BRIDGE_REPORT_2026-10-26.md`; `docs/archive/RAD-085_FULL_PRACTICAL_UI_REPORT_2026-10-25.md`; `docs/archive/RAD-085_P1_SQL_REPORT_2026-10-26.md`; `docs/archive/RAD-085_P1_UI_REPORT_2026-10-25.md`; `docs/archive/RAD-085_P2_SQL_REPORT_2026-10-26.md`; `docs/archive/RAD-085_P2_UI_REPORT_2026-10-25.md`; `docs/archive/RAD-085_SCENE_PREVIEW_REPORT_2026-10-25.md`; `docs/archive/RAD-085_SHARING_OWNER_REPORT_2026-10-26.md`; `docs/archive/reports/2026-10/RAD-085_P1_WIRING_REPORT_2026-10-27.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/review/rad085-ar.jpg` | 170364 | EXACT `docs/archive/RAD-085_P1_UI_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-assignment-sql-ar.jpg` | 141771 | EXACT `docs/archive/RAD-085_ASSIGNMENT_BRIDGE_REPORT_2026-10-26.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-assignment-sql-en.jpg` | 168533 | EXACT `docs/archive/RAD-085_ASSIGNMENT_BRIDGE_REPORT_2026-10-26.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-d3-ar-active.jpg` | 32460 | EXACT `docs/RAD-085_D3_REPORT_2026-10-27.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg; GLOB `scripts/qa/rad085-d3-routes-audit.mjs`; rad085-d3-*-*.jpg |
| `docs/review/rad085-d3-ar-not-supervisor.jpg` | 10780 | EXACT `docs/RAD-085_D3_REPORT_2026-10-27.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg; GLOB `scripts/qa/rad085-d3-routes-audit.mjs`; rad085-d3-*-*.jpg |
| `docs/review/rad085-d3-en-active.jpg` | 35684 | EXACT `docs/RAD-085_D3_REPORT_2026-10-27.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg; GLOB `scripts/qa/rad085-d3-routes-audit.mjs`; rad085-d3-*-*.jpg |
| `docs/review/rad085-d3-en-not-supervisor.jpg` | 12238 | EXACT `docs/RAD-085_D3_REPORT_2026-10-27.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg; GLOB `scripts/qa/rad085-d3-routes-audit.mjs`; rad085-d3-*-*.jpg |
| `docs/review/rad085-en.jpg` | 193496 | EXACT `docs/archive/RAD-085_P1_UI_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-p1-routes-ar.jpg` | 74968 | EXACT `docs/archive/reports/2026-10/RAD-085_P1_WIRING_REPORT_2026-10-27.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-p1-routes-en.jpg` | 82374 | EXACT `docs/archive/reports/2026-10/RAD-085_P1_WIRING_REPORT_2026-10-27.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-p1-sql-ar.jpg` | 364814 | EXACT `docs/archive/RAD-085_P1_SQL_REPORT_2026-10-26.md`; GLOB `scripts/qa/rad-085-p1-sql-audit.mjs`; rad085-p1-sql-*.jpg; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-p1-sql-en.jpg` | 405631 | EXACT `docs/archive/RAD-085_P1_SQL_REPORT_2026-10-26.md`; GLOB `scripts/qa/rad-085-p1-sql-audit.mjs`; rad085-p1-sql-*.jpg; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-p2-ar.jpg` | 157968 | EXACT `docs/archive/RAD-085_P2_UI_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-p2-en.jpg` | 182413 | EXACT `docs/archive/RAD-085_P2_UI_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-p2-sql-ar.jpg` | 133811 | EXACT `docs/archive/RAD-085_P2_SQL_REPORT_2026-10-26.md`; GLOB `scripts/qa/rad-085-p2-sql-audit.mjs`; rad085-p2-sql-*.jpg; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-p2-sql-en.jpg` | 159571 | EXACT `docs/archive/RAD-085_P2_SQL_REPORT_2026-10-26.md`; GLOB `scripts/qa/rad-085-p2-sql-audit.mjs`; rad085-p2-sql-*.jpg; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-practical-ar.jpg` | 168405 | EXACT `docs/archive/RAD-085_FULL_PRACTICAL_UI_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-practical-en.jpg` | 200451 | EXACT `docs/archive/RAD-085_FULL_PRACTICAL_UI_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-scene-ar.jpg` | 146455 | EXACT `docs/archive/RAD-085_SCENE_PREVIEW_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-085-authoring-audit.mjs`; rad085-scene-*.jpg; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-scene-en.jpg` | 163100 | EXACT `docs/archive/RAD-085_SCENE_PREVIEW_REPORT_2026-10-25.md`; GLOB `scripts/qa/rad-085-authoring-audit.mjs`; rad085-scene-*.jpg; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-sharing-ar.jpg` | 89840 | EXACT `docs/archive/RAD-085_SHARING_OWNER_REPORT_2026-10-26.md`; GLOB `scripts/qa/rad-085-p1-sql-audit.mjs`; rad085-sharing-*.jpg; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
| `docs/review/rad085-sharing-en.jpg` | 117268 | EXACT `docs/archive/RAD-085_SHARING_OWNER_REPORT_2026-10-26.md`; GLOB `scripts/qa/rad-085-p1-sql-audit.mjs`; rad085-sharing-*.jpg; GLOB `scripts/qa/rad-085-supervisor-audit.mjs`; rad085-*.jpg |
### session-4-renders

**KEEP** — رخصة/provenance؛ KEEP إلزامي. 29 ملفًا؛ 1.474213 MB.

التقارير المالكة: `docs/archive/sessions/session-4-radiograph-renderer.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/session-4-renders/ar-01-correct-baseline.jpg` | 36594 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-02-rotation.jpg` | 36649 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-03-centering-off.jpg` | 34784 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-04-collimation-clipping-top.jpg` | 24535 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-05-scapulae-poor-shoulders.jpg` | 36783 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-06-chin-tucked.jpg` | 36698 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-07-low-exposure-noise.jpg` | 74581 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-08-excess-exposure-no-change.jpg` | 36594 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-09-low-penetration.jpg` | 35476 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-10-reduced-inspiration.jpg` | 36146 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-11-motion-blur.jpg` | 25433 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-12-combined-errors.jpg` | 76353 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-13-open-field-no-data-hatch.jpg` | 42914 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/ar-contact-sheet.jpg` | 174539 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-01-correct-baseline.jpg` | 36594 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-02-rotation.jpg` | 36649 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-03-centering-off.jpg` | 34784 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-04-collimation-clipping-top.jpg` | 24535 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-05-scapulae-poor-shoulders.jpg` | 36783 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-06-chin-tucked.jpg` | 36698 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-07-low-exposure-noise.jpg` | 74581 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-08-excess-exposure-no-change.jpg` | 36594 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-09-low-penetration.jpg` | 35476 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-09b-low-penetration-vs-baseline-crop.jpg` | 58055 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-10-reduced-inspiration.jpg` | 36146 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-11-motion-blur.jpg` | 25433 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-12-combined-errors.jpg` | 76353 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-13-open-field-no-data-hatch.jpg` | 42914 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
| `docs/session-4-renders/en-contact-sheet.jpg` | 174539 | GLOB `docs/ASSET_PROVENANCE_AND_LICENSES.md`; docs/session-4-renders/*.jpg; GLOB `docs/archive/README.md`; directory/* |
### session-5-renders

**KEEP** — رخصة/provenance؛ KEEP إلزامي. 1 ملفًا؛ 0.383417 MB.

التقارير المالكة: `docs/archive/sessions/session-5-qa.md`.

| الملف الأصلي → الوجهة إن نُقل | الحجم بالبايت | نوع الإحالة ومصدرها |
|---|---|---|
| `docs/session-5-renders/matrix-contact-sheet.jpg` | 383417 | EXACT `docs/ASSET_PROVENANCE_AND_LICENSES.md`; GLOB `docs/archive/README.md`; directory/*; EXACT `docs/archive/sessions/session-5-qa.md` |

### مجموع توصيات الصور/JSON

| التوصية | ملفات | MB |
|---|---|---|
| KEEP | 253 | 59.576985 |
| ARCHIVE | 17 | 11.384970 |
| DELETE-CANDIDATE | 0 | 0.000000 |

ARCHIVE المنفذ: 13 ملفًا، 1.649986 MB. الباقي مقترح فقط. DELETE-CANDIDATE=0؛ لم يثبت اجتماع التجاوز وانعدام المراجع لأي ملف.

## 3. الأرشيف السابق: التكرار أو الموضع فقط

فُحصت SHA-256 لكل69ملفًا كان تحت docs/archive/ قبل الدفعة: لا تكرار بايتي بينها أو مع بقية ملفات الشجرة الأصلية. تقاطعات لقطات القرارات/التخطيط متعمدة، ولا تُعد نسخًا زائدة قابلة للحذف. ملفات الإحالة القديمة الأربعة ليست نسخًا من تقاريرها. لا إعادة تنظيم للأرشيف السابق.

الملفات التالية مؤرخة وباقية مباشرة في جذر archive؛ موضع غير موحد مع YYYY-MM الجديد. هذا تنبيه فقط؛ اقتراح نقل لاحق بعد مراجعة المستهلكين، وحزم patch تبقى في مكانها إن قرأها كود:

- `docs/archive/HANDOFF-rad-045-2026-10-16.md`
- `docs/archive/HANDOFF-rad-047b3-2026-10-16.md`
- `docs/archive/HANDOFF-until-2026-10-16.md`
- `docs/archive/RAD-085_APPLICATION_PACKET_2026-10-26.md`
- `docs/archive/RAD-085_ASSIGNMENT_BRIDGE_REPORT_2026-10-26.md`
- `docs/archive/RAD-085_CONNECTION_IDENTITY_2026-10-26.md`
- `docs/archive/RAD-085_ERASURE_RECOVERY_2026-10-26.md`
- `docs/archive/RAD-085_ERASURE_REPORT_2026-10-26.md`
- `docs/archive/RAD-085_ERASURE_SQL_PROPOSAL_2026-10-26.patch`
- `docs/archive/RAD-085_FULL_PRACTICAL_UI_REPORT_2026-10-25.md`
- `docs/archive/RAD-085_P1_SQL_REPORT_2026-10-26.md`
- `docs/archive/RAD-085_P1_UI_REPORT_2026-10-25.md`
- `docs/archive/RAD-085_P2_SQL_REPORT_2026-10-26.md`
- `docs/archive/RAD-085_P2_UI_REPORT_2026-10-25.md`
- `docs/archive/RAD-085_SCENE_PREVIEW_REPORT_2026-10-25.md`
- `docs/archive/RAD-085_SECURITY_AUDIT_2026-10-26.md`
- `docs/archive/RAD-085_SHARING_OWNER_REPORT_2026-10-26.md`
- `docs/archive/RAD-085_SHARING_SQL_PROPOSAL_2026-10-26.patch`
- `docs/archive/RAD-085_SQL_AUDIT_PROPOSAL_2026-10-26.patch`
- `docs/archive/RAD-085_SQL_BLOCKER_REPORT_2026-10-26.md`
- `docs/archive/RAD-085_SQL_COMPLETION_REPORT_2026-10-26.md`
- `docs/archive/RAD-085_SQL_REPORT_2026-10-26.md`
- `docs/archive/RAD-085_UI_READINESS_REPORT_2026-10-25.md`
- `docs/archive/RAD-085_WORKER_LOCAL_REPORT_2026-10-26.md`

## 4. خريطة النقل المنفذ القابلة للفحص

| الأصل | الوجهة | الإجراء |
|---|---|---|
| `docs/ASSESS_A_REPORT_2026-10-19.md` | `docs/archive/reports/2026-10/ASSESS_A_REPORT_2026-10-19.md` | MOVE |
| `docs/ASSESS_DOCS_REPORT_2026-10-19.md` | `docs/archive/reports/2026-10/ASSESS_DOCS_REPORT_2026-10-19.md` | MOVE |
| `docs/ASSESS_LOCAL_OPERATIONS_REPORT_2026-10-20.md` | `docs/archive/reports/2026-10/ASSESS_LOCAL_OPERATIONS_REPORT_2026-10-20.md` | MOVE |
| `docs/DOCS_ALIGN_1_REPORT_2026-10-16.md` | `docs/archive/reports/2026-10/DOCS_ALIGN_1_REPORT_2026-10-16.md` | MOVE |
| `docs/RAD-060_PHASE1_FOLLOWUP_2026-10-29.md` | `docs/archive/reports/2026-10/RAD-060_PHASE1_FOLLOWUP_2026-10-29.md` | MOVE |
| `docs/RAD-060_PHASE1_REPORT_2026-10-29.md` | `docs/archive/reports/2026-10/RAD-060_PHASE1_REPORT_2026-10-29.md` | MOVE |
| `docs/RAD-060_RAD-062_RECONCILIATION_2026-10-29.md` | `docs/archive/reports/2026-10/RAD-060_RAD-062_RECONCILIATION_2026-10-29.md` | MOVE |
| `docs/RAD-062_3-5A_PLAN_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_3-5A_PLAN_2026-10-30.md` | MOVE |
| `docs/RAD-062_P02_PROVENANCE_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P02_PROVENANCE_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P03_P04_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P03_P04_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P05_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P05_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P06_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P06_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P07_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P07_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P08_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P08_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P09B_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P09B_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P09_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P09_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P10_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P10_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_P1_NAME_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_P1_NAME_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-062_PHASE2_DESIGN_2026-10-29.md` | `docs/archive/reports/2026-10/RAD-062_PHASE2_DESIGN_2026-10-29.md` | MOVE |
| `docs/RAD-062_PHASE2_OWNER_DECISIONS_REPORT_2026-10-29.md` | `docs/archive/reports/2026-10/RAD-062_PHASE2_OWNER_DECISIONS_REPORT_2026-10-29.md` | MOVE |
| `docs/RAD-062_PHASE4A_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RAD-062_PHASE4A_REPORT_2026-10-30.md` | MOVE |
| `docs/RAD-069A_HASHES_2026-10-24.md` | `docs/archive/reports/2026-10/RAD-069A_HASHES_2026-10-24.md` | MOVE |
| `docs/RAD-069A_REPORT_2026-10-24.md` | `docs/archive/reports/2026-10/RAD-069A_REPORT_2026-10-24.md` | MOVE |
| `docs/RAD-069B1_REPORT_2026-10-24.md` | `docs/archive/reports/2026-10/RAD-069B1_REPORT_2026-10-24.md` | MOVE |
| `docs/RAD-072_PART3B_HASHES_2026-10-24.md` | `docs/archive/reports/2026-10/RAD-072_PART3B_HASHES_2026-10-24.md` | MOVE |
| `docs/RAD-072_PART3_HASHES_2026-10-24.md` | `docs/archive/reports/2026-10/RAD-072_PART3_HASHES_2026-10-24.md` | MOVE |
| `docs/RAD-072_PART3_PHASE_A_REPORT_2026-10-24.md` | `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_A_REPORT_2026-10-24.md` | MOVE |
| `docs/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` | `docs/archive/reports/2026-10/RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md` | MOVE |
| `docs/RAD-076_REPORT_2026-10-24.md` | `docs/archive/reports/2026-10/RAD-076_REPORT_2026-10-24.md` | MOVE |
| `docs/RAD-078_REPORT_2026-10-25.md` | `docs/archive/reports/2026-10/RAD-078_REPORT_2026-10-25.md` | MOVE |
| `docs/RAD-079_HASHES_2026-10-25.md` | `docs/archive/reports/2026-10/RAD-079_HASHES_2026-10-25.md` | MOVE |
| `docs/RAD-079_REPORT_2026-10-25.md` | `docs/archive/reports/2026-10/RAD-079_REPORT_2026-10-25.md` | MOVE |
| `docs/RAD-080_HASHES_2026-10-25.md` | `docs/archive/reports/2026-10/RAD-080_HASHES_2026-10-25.md` | MOVE |
| `docs/RAD-080_REPORT_2026-10-25.md` | `docs/archive/reports/2026-10/RAD-080_REPORT_2026-10-25.md` | MOVE |
| `docs/RAD-083_REPORT_2026-10-25.md` | `docs/archive/reports/2026-10/RAD-083_REPORT_2026-10-25.md` | MOVE |
| `docs/RAD-085_DB_DAY_NOLAPTOP_REPORT_2026-10-27.md` | `docs/archive/reports/2026-10/RAD-085_DB_DAY_NOLAPTOP_REPORT_2026-10-27.md` | MOVE |
| `docs/RAD-085_OWNER_PICKER_REPORT_2026-10-28.md` | `docs/archive/reports/2026-10/RAD-085_OWNER_PICKER_REPORT_2026-10-28.md` | MOVE |
| `docs/RAD-085_P1_WIRING_REPORT_2026-10-27.md` | `docs/archive/reports/2026-10/RAD-085_P1_WIRING_REPORT_2026-10-27.md` | MOVE |
| `docs/RAD-085_TRIAL_REMOVAL_REPORT_2026-10-28.md` | `docs/archive/reports/2026-10/RAD-085_TRIAL_REMOVAL_REPORT_2026-10-28.md` | MOVE |
| `docs/RANDOM_QUESTION_DECISIONS_REPORT_2026-10-30.md` | `docs/archive/reports/2026-10/RANDOM_QUESTION_DECISIONS_REPORT_2026-10-30.md` | MOVE |
| `docs/review/rad-072-part3b-ankle-ap-result-key-1440.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-ankle-ap-result-key-1440.png` | MOVE |
| `docs/review/rad-072-part3b-ankle-ap-result-key-390.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-ankle-ap-result-key-390.png` | MOVE |
| `docs/review/rad-072-part3b-chest-ap-supine-1-relaxed-after.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-ap-supine-1-relaxed-after.png` | MOVE |
| `docs/review/rad-072-part3b-chest-ap-supine-1-relaxed-before.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-ap-supine-1-relaxed-before.png` | MOVE |
| `docs/review/rad-072-part3b-chest-ap-supine-1-rolled-after.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-ap-supine-1-rolled-after.png` | MOVE |
| `docs/review/rad-072-part3b-chest-ap-supine-1-rolled-before.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-ap-supine-1-rolled-before.png` | MOVE |
| `docs/review/rad-072-part3b-chest-pa-erect-0-after.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-pa-erect-0-after.png` | MOVE |
| `docs/review/rad-072-part3b-chest-pa-erect-0-before.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-chest-pa-erect-0-before.png` | MOVE |
| `docs/review/rad-072-part3b-shoulder-grashey-erect-result-key-1440.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-shoulder-grashey-erect-result-key-1440.png` | MOVE |
| `docs/review/rad-072-part3b-shoulder-grashey-erect-result-key-390.png` | `docs/archive/review/rad-072-part3b/rad-072-part3b-shoulder-grashey-erect-result-key-390.png` | MOVE |
| `docs/review/rad078-consent-review.jpg` | `docs/archive/review/rad078/rad078-consent-review.jpg` | MOVE |
| `docs/review/rad079-result-after.jpg` | `docs/archive/review/rad079/rad079-result-after.jpg` | MOVE |
| `docs/review/rad079-result-before.jpg` | `docs/archive/review/rad079/rad079-result-before.jpg` | MOVE |

## 5. المستثنى المؤرخ وسببه

| الملف | سبب إبقائه بايتيًا |
|---|---|
| `docs/ASSESS_B_REPORT_2026-10-19.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| `docs/ASSESS_CLOUD_RUN_PLAN_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md |
| `docs/ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| `docs/ASSESS_CONTROLLED_TRIAL_READINESS_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md |
| `docs/ASSESS_C_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/ASSESS_D_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/DEPLOYMENT.md |
| `docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| `docs/ASSESS_EXTERNAL_BINDING_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| `docs/ASSESS_E_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/DEPLOYMENT.md |
| `docs/ASSESS_F_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/DEPLOYMENT.md |
| `docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| `docs/ASSESS_POSTGRES_PASSWORD_IMPACT_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md |
| `docs/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/ASSESS_RETENTION_POLICY.md |
| `docs/ASSESS_RETENTION_PREFLIGHT_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md |
| `docs/ASSESS_RETENTION_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/ASSESS_RETENTION_POLICY.md |
| `docs/ASSESS_RETENTION_REVIEW_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md` | byte-identical protected Markdown: docs/ASSESS_CLOUD_RUN_PLAN_2026-10-21.md |
| `docs/ASSESS_SESSION_POOLER_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| `docs/ASSESS_TRIAL_BATCH_ONE_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md |
| `docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md` | byte-identical protected Markdown: docs/RAD-061_BATCH4_REPORT_2026-10-22.md |
| `docs/ASSESS_TRIAL_FINAL_REPORT_2026-10-22.md` | byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| `docs/ASSESS_TRIAL_ISOLATION_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md |
| `docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md` | byte-identical protected Markdown: docs/ASSESS_TRIAL_BATCH_ONE_2026-10-22.md |
| `docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| `docs/ASSESS_WORKER_ACTIVATION_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md |
| `docs/ASSESS_WORKER_LOGIN_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md |
| `docs/ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md` | byte-identical protected Markdown: docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md |
| `docs/ASSET_LICENCE_AUDIT_2026-10-15.md` | non-Markdown: src/data/credits.test.ts |
| `docs/DEPS_SECURITY_REPORT_2026-11-01.md` | done completion_evidence: RAD-088 |
| `docs/FORTY_INCH_SID_CHANGES_2026-10-30.md` | byte-identical protected Markdown: docs/FORTY_INCH_SID_REPORT_2026-10-30.md |
| `docs/FORTY_INCH_SID_REPORT_2026-10-30.md` | byte-identical protected Markdown: docs/RAD-081_100_SETTINGS_2026-10-25.md |
| `docs/OWNER_SIGNOFF_REPORT_2026-10-30.md` | done completion_evidence: RAD-037, RAD-069, RAD-074, RAD-076, RAD-077, RAD-078, RAD-079, RAD-080, RAD-084, RAD-083 |
| `docs/PILOT_PROVIDER_COMPARISON_2026-10-15.md` | done completion_evidence: RAD-040 |
| `docs/RAD-019_AI_ASSISTED_REVIEW_2026-10-22.md` | done completion_evidence: RAD-065 |
| `docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md` | byte-identical protected Markdown: docs/RAD-059_PHONE_RUNBOOK.md |
| `docs/RAD-059_REPORT_2026-10-29.md` | byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| `docs/RAD-061_BATCH1_REPORT_2026-10-22.md` | done completion_evidence: RAD-061 |
| `docs/RAD-061_BATCH4_REPORT_2026-10-22.md` | done completion_evidence: RAD-061 |
| `docs/RAD-061_BATCHES_2_3_5_6_REPORT_2026-10-22.md` | done completion_evidence: RAD-061 |
| `docs/RAD-061_CODE_AUDIT_REPORT_2026-10-22.md` | done completion_evidence: RAD-061 |
| `docs/RAD-061_TIMEOUT_DIAGNOSIS_2026-10-22.md` | non-Markdown: src/features/assess/server-runtime.test.ts |
| `docs/RAD-064_UI_INVENTORY_REPORT_2026-10-22.md` | done completion_evidence: RAD-064 |
| `docs/RAD-065_REVIEW_TRIAGE_2026-10-22.md` | done completion_evidence: RAD-065 |
| `docs/RAD-066_UI1_REPORT_2026-10-22.md` | done completion_evidence: RAD-066 |
| `docs/RAD-067_UI3_REPORT_2026-10-22.md` | done completion_evidence: RAD-067 |
| `docs/RAD-068_FINAL_REPORT_2026-10-22.md` | done completion_evidence: RAD-068 |
| `docs/RAD-068_FINAL_TEXT_CHANGES_2026-10-22.md` | byte-identical protected Markdown: docs/RAD-068_FINAL_REPORT_2026-10-22.md |
| `docs/RAD-068_PART1_REPORT_2026-10-22.md` | done completion_evidence: RAD-066, RAD-068 |
| `docs/RAD-068_PART2_REPORT_2026-10-22.md` | done completion_evidence: RAD-068 |
| `docs/RAD-068_PART2_TEXT_CHANGES_2026-10-22.md` | byte-identical protected Markdown: docs/RAD-068_PART2_REPORT_2026-10-22.md |
| `docs/RAD-068_PART3_REPORT_2026-10-22.md` | done completion_evidence: RAD-068 |
| `docs/RAD-069B2A_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/RAD-077_PROPOSAL_2026-10-24.md |
| `docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md` | non-Markdown: src/features/platform/pelvis-geometry-drift.test.ts |
| `docs/RAD-069C1_REPORT_2026-10-24.md` | done completion_evidence: RAD-044 |
| `docs/RAD-069C2_PHASE2_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/RAD-069C2_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/RAD-069_DB_DAY_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/RAD-072_PART1B_HASHES_2026-10-23.md` | byte-identical protected Markdown: docs/RAD-072_PART1B_REPORT_2026-10-23.md |
| `docs/RAD-072_PART1B_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ARABIC_TERMINOLOGY.md |
| `docs/RAD-072_PART1_HASHES_2026-10-23.md` | byte-identical protected Markdown: docs/RAD-072_PART1B_HASHES_2026-10-23.md |
| `docs/RAD-072_PART1_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ARABIC_TERMINOLOGY.md |
| `docs/RAD-072_PART2A_HASHES_2026-10-23.md` | byte-identical protected Markdown: docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md |
| `docs/RAD-072_PART2A_PHASE_A_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2B_HASHES_2026-10-23.md` | byte-identical protected Markdown: docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md |
| `docs/RAD-072_PART2B_PHASE_A_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2C_HASHES_2026-10-24.md` | byte-identical protected Markdown: docs/RAD-072_PART2C_PHASE_B_REPORT_2026-10-24.md |
| `docs/RAD-072_PART2C_PHASE_A_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-072_PART2C_PHASE_B_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/ASSET_PROVENANCE_AND_LICENSES.md |
| `docs/RAD-074_QA_TOOLING_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| `docs/RAD-075_HOUSEKEEPING_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/RAD-069B2B_PHASE_A_REPORT_2026-10-24.md |
| `docs/RAD-077_PROPOSAL_2026-10-24.md` | byte-identical protected Markdown: docs/RAD-077_REPORT_2026-10-24.md |
| `docs/RAD-077_REPORT_2026-10-24.md` | byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| `docs/RAD-080_PROPOSAL_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| `docs/RAD-081_100_SETTINGS_2026-10-25.md` | non-Markdown: src/features/evaluation/forty-inch-sid.test.ts |
| `docs/RAD-081_CHANGES_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| `docs/RAD-081_OWNER_ITEMS_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-081_REPORT_2026-10-25.md |
| `docs/RAD-081_OWNER_ITEMS_CHANGES_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-081_OWNER_ITEMS_2026-10-25.md |
| `docs/RAD-081_REPORT_2026-10-25.md` | byte-identical protected Markdown: docs/FORTY_INCH_SID_REPORT_2026-10-30.md |
| `docs/RAD-085_AUTH_FK_REPORT_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_DB_DAY_COMPLETED_2026-10-28.md |
| `docs/RAD-085_CRLF_READINESS_REPORT_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_DB_DAY_P1.md |
| `docs/RAD-085_D3_REPORT_2026-10-27.md` | byte-identical protected Markdown: docs/RAD-085_SECURITY_REVIEW_2026-10-27.md |
| `docs/RAD-085_DB_DAY_COMPLETED_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_DB_DAY_P1.md |
| `docs/RAD-085_ERASURE_MATRIX_2026-10-26.md` | byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| `docs/RAD-085_P1_B_COMPLETED_2026-10-29.md` | byte-identical protected Markdown: docs/RAD-059_OWNER_DRY_RUN_2026-10-29.md |
| `docs/RAD-085_P1_USABILITY_A_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_P1_B_COMPLETED_2026-10-29.md |
| `docs/RAD-085_P1_USABILITY_B_2026-10-28.md` | byte-identical protected Markdown: docs/RAD-085_P1_B_COMPLETED_2026-10-29.md |
| `docs/RAD-085_PLAN_2026-10-25.md` | byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| `docs/RAD-085_PROMOTION_REPORT_2026-10-27.md` | byte-identical protected Markdown: docs/RAD-085_CRLF_READINESS_REPORT_2026-10-28.md |
| `docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md` | byte-identical protected Markdown: docs/PILOT_SUPABASE_SETUP.md |
| `docs/RAD-085_REPORT_2026-10-27.md` | byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| `docs/RAD-085_SECURITY_REVIEW_2026-10-27.md` | byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| `docs/RAD-085_SEC_FIXES_REPORT_2026-10-27.md` | byte-identical protected Markdown: docs/OWNER_SIGNOFF_REPORT_2026-10-30.md |
| `docs/RAD-085_SQL_CONTRACTS_2026-10-26.md` | byte-identical protected Markdown: docs/RAD-085_REMAINING_OPERATIONS_2026-10-26.md |
| `docs/RAD-086_REPORT_2026-10-31.md` | done completion_evidence: RAD-086 |
| `docs/TERMS_OWNER_DRAFT_2026-10-16.md` | non-Markdown: scripts/qa/pilot-consent-audit.mjs |
| `docs/TERMS_REVIEW_2026-10-16.md` | byte-identical protected Markdown: docs/TERMS_OWNER_DRAFT_2026-10-16.md |

## 6. قائمة موحدة تحتاج قرار المالك

1. اعتماد أرشفة تقارير DOCS غير المؤرخة الاسم وstatus-archive المذكورة في جدول§1 (خمسة ملفات)، مع تحديث روابط الأدلة فقط في الدفعة التالية.
2. اعتماد دمج المحتوى الحي المفيد من ROADMAP_SESSIONS.md في docs/README.md وإزالة توجيه المرحلة A المتقادم وتعارض منع التقرير؛ مواضع القاعدتين موثقة أعلاه. لا إغلاق مهمة أو رفع تجميد من الدمج.
3. اعتماد أرشفة الصور غير المنفذة للمجموعات rad-077 وrad069 وrad080 إلى docs/archive/review/<group>/ مع تحديث إحالات التقارير المحمية بموافقة صريحة؛ التفاصيل والأحجام في§2.
4. اعتماد توحيد مواضع ملفات جذر الأرشيف المؤرخة المعلّمة في§3، بعد حصر قراء الكود/JSON؛ المقترح لا يشمل نقل patch يقرأها الكود.

لا حذف مقترح بلا دليل تجاوز وانعدام مراجع. إزالة ملفات من شجرة العمل لا تصغّر تاريخ Git: تقدير الطلب للحزمة≈51MB؛ clone البيئة يقيس114.65MiB عبر31pack قبل الدفعة، وليس قياسًا جديدًا لمستودع المصدر المضغوط. أي حذف مستقبلي للنظافة، لا لاستعادة الحجم من التاريخ. لا rewrite أو LFS migration.

## 7. إعادة الإثبات

شغّل `python docs/archive/reports/2026-11/verify_restructure.py` من جذر المستودع. الأداة تقرأ خريطة النقل أعلاه، تنزع أهداف الروابط وتقارن البايتات، تثبت تكافؤ وجهة كل تعديل، وتطبع قائمة استثناءات non-Markdown المحسوبة من snapshot الإغلاق. لا تعدّل الملفات ولا تتصل بالشبكة.
