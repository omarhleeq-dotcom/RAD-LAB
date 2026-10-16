# DOCS-ALIGN-1 — مواءمة الحالة والوثائق، 2026-10-16

[Draft PR #81](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/81) مفتوح ومسودة؛ نسخة المواءمة `f812e9b0d5757cfc7b854596f037b85c96d39e46`، ويلحقها توثيق رابط المراجعة فقط.

## 1. الانحرافات والميزانية

ثبت دمج #80 عبر Git/API عند `f90b3c9e28501fa52d27fa154419a6586344db71`، وهو أحدث main عند البداية. الفرع `docs/align-status-tables-and-core-docs` يبدأ منه. جُلب كائن الدمج الموقّع عبر موصل GitHub، وأعيد تكوينه محليًا مع مطابقة SHA وشجرة الملفات، ثم حُدث origin/main؛ لا افتراض أن المرجع المحلي القديم كان أحدث main. لا worktree أو وكلاء أو تعديل خارج التوثيق.

ميزانية معلنة قبل التحرير:16 ملفًا، هي README الجذر؛ HANDOFF وproject-status وDECISIONS؛ تسليما الأرشيف rad-045 وrad-047b3؛ تقارير Grashey implementation/reference/settlement وShoulder Y reference (روابط فقط)؛ PLATFORM_ARCHITECTURE وفهرس adr وROADMAP وPILOT_PLATFORM_PLAN؛ فهرس docs/README وهذا التقرير. لا نقل ملفات في هذه الدفعة.

## 2. النطاق المنجز والمؤجل

تصحيح الحالة لدمج #80 مع إبقاء فحص الهاتف مفتوحًا، وتسجيل تأجيل المرحلة البرمجية التالية. RAD-025 review، وليس done؛ RAD-054 review للفحص الحي، وRAD-056 deferred. جميع56 معرّفًا وnext_id=RAD-057 محفوظة؛ بقية المهام دون تغيير. أُصلحت الجداول والإحالات، ووُضعت ملخصات حالية وفهرس دون مسح التاريخ أو اختصار القواعد الملزمة. لا أرشفة ولا اختصار CLAUDE أو الوصفة الآن.

## 3. بحسب المهمة

- DECISIONS: كانت82 صفًا غير متطابقة مع الترويسات. وُسعت الترويسات إلى أكبر عدد أعمدة فعلي مع حقل مصدر/متابعة، وأضيفت خلايا فارغة فقط عند النقص؛ لم تُدمج خلايا أو تُحذف نصوص. أضيفت إحالات عند O92/O94 التاريخيين إلى الجدول اللاحق، وإيضاح أن S14.1c-1 يستبدل جانب الرسغ السابق في O24، دون محو أي صياغة تاريخية.
- الروابط:6 مسارات في تسليمَي الأرشيف صارت تشير إلى المجلد الأب؛4 روابط إلى HANDOFF §8 القديم صارت تشير إلى قسم المتابعة الحالي بوسم واضح. لم تُعد إلى برومبت مرحلة قديمة غير مناسبة.
- README: نطاق الكود الفعلي، التسجيل/الموافقة، تعطيل الحسابات، الفرق بين حارس الواجهة وRLS، المسارات، ملفات البيانات وإضافة CaseDefinition عبر وصفة الفحص. عدد الفحوص لقطة مؤرخة مرتبطة بسجلها، لا ادعاء اعتماد أو نشر.
- المعمارية وADR وخارطة الطريق والخطة: ملخص حالي يميز المنفذ من المقترح والمقاطع التاريخية، مع إبقاء التفاصيل والقرارات الأصلية. الخطة تعرض التسجيل الذاتي pending ثم موافقة المالك بدل استعمال الدعوة القديمة كإجراء حالي.
- الفهرس: الحالة والعمل والتشغيل والمعمارية والمراجع والمصادر والأصول والمراجعة وتقارير الجلسات والأرشيف. قائمة المراجعة الطبية وحزمتها تبقيان نشطتين.

## 4. المشترك وScale check

لا كود أو schema أو API أو اعتماد جديد. الفهرس يحيل إلى سجلات موجودة، والملخصات تحمل نقطة تحقق وتاريخًا بدل تحويل أعداد الفحوص إلى قيد دائم. الملخص السردي للحالة لا يكرر عددًا مشتقًا من السجل. خريطة النقل التالية تفصل الأثر على المسارات والإحالات؛ يجب إعادة حسابها على main عند تنفيذها، لا تنفيذ نقل جماعي بلا فحص الاعتمادات.

## 5. الطب والدرجات

| العنصر | التغيير |
|---|---|
| تعريفات وحالات وقيم طبية وأوزان ودرجات | لا شيء |
| صور ومشاهد وhashes وgoldens وcharacterisation | لا شيء |
| نصوص قرارات DECISIONS ومصادرها ومعرّفاتها | محفوظة؛ تنسيق وإحالات مضافة فقط |
| المراجع والحزمة والقائمة الطبية والنص العربي | لم تُعدّل أو تُعتمد طبيًا/لغويًا |
| حالة النشر وفحص الهاتف | لا تحقق حي جديد؛ لا استنتاج إغلاق من دمج #80 |

## 6. QA ودليل عدم التراجع

نجحت الفحوص النهائية لهذه الدفعة:

- `npm run status:check -- --base origin/main --require-previous`: مقارنة انتقال فعلية مع main f90b3c9، ناجحة. بقي تنبيه تعارض RAD-024 الموروث فقط؛ لم يُغلق استنتاجًا. RAD-025 review لا done، وتأجيل RAD-056 صريح.
- فُحصت111 ملف Markdown (ملفات الجذر وdocs، بما فيها الملفان الجديدان)، و493 إحالة محلية، مع التحقق من المسارات وعناوين GitHub/المعرّفات الصريحة والأسوار البرمجية. النتيجة: صفر مسار معطل وصفر عنوان داخلي معطل وصفر سور غير مغلق.
- فُحصت أعمدة كل جداول Markdown: صفر صف غير مطابق بعد إصلاح82 صفًا في DECISIONS. مقارنة خلايا القرارات قبل/بعد أثبتت حفظ403 صفوف بيانات بترتيبها ومحتواها، وحفظ443 ظهورًا لمعرّفاتها؛ سمحت المقارنة بالخلايا الفارغة/الترويسة المضافة وإحالات التنقل المعلنة فقط، دون حذف أو استبدال نص أصلي.
- فُحصت124 إحالة مسار نصية في source_ref: كلها تحل إلى ملفات/مجلدات موجودة، مع مراعاة ملفات الجذر مثل CLAUDE.md. بقيت جميع56 مهمة وnext_id دون تغيير؛ تغيّرت RAD-025/054/056 فقط، وبقية53 مهمة مطابقة لنسخة البداية.
- `git diff --check` ناجح، والميزانية16 ملف Markdown فقط. لا حذف أو نقل؛ تقارير الجلسات39 باقية في مواضعها وملفا التحليل لم يُعدلا. لا src/public/assets/messages أو scripts/CI أو اختبارات/توصيف أو dependencies/lock ضمن diff.

التدقيق المحلي استخدم أدوات مؤقتة خارج المستودع؛ ملخصه `/tmp/docs-align-qa-result.json`. الروابط الخارجية وصحة الطب/الرخص لم يُعاد التحقق منها في هذه الدفعة. لم تُشغّل check/build/browser لأن التطبيق لم يتغير؛ نتائج #80 تاريخية في تقريرها، وليست إعادة اختبار أو تحقق نشر حي هنا.

## 7. المفتوح

مراجعة ودمج Draft التوثيق يدويًا؛ RAD-025 لا يغلق قبل دليل الدمج. فحص المالك للنسخة المعدلة على الهاتف، وRAD-052/053 وRAD-024 وO105 والمراجعات الأخرى تبقى كما هي. المرحلة البرمجية التالية مؤجلة. الأرشفة والاختصار أدناه مقترحان فقط، ولا يبدأ تنفيذهما أو تنفيذ برومبت مؤرشف تلقائيًا.

## 8. قائمة المالك وخريطة الدفعة الثانية المقترحة

على الهاتف: افتح فهرس docs ثم الحالة والتسليم؛ تحقق من ظهور أن #80 مدموج وأن فحص الهاتف لم يغلق. افتح نموذجًا من الروابط المصححة ومن جدول القرارات؛ هذه مراجعة توثيق وليست اختبار التطبيق.

### خريطة المحتوى — مقترح غير منفذ

39 تقرير جلسة إلى `docs/archive/sessions/`، وملفا تحليل إلى `docs/archive/analysis/`. لا تنقل REVIEW_CHECKLIST_EDUCATOR_PHYSICIST أو REVIEW_PACKAGE أو المراجع أو سجل الأصول/المصادر. الوجهات التالية نصوص مقترحة وليست روابط إلى ملفات موجودة الآن.

| المسار الحالي | المسار المقترح |
|---|---|
| [docs/archive/sessions/session-11-generalisation.md](archive/sessions/session-11-generalisation.md) | `docs/archive/sessions/session-11-generalisation.md` |
| [docs/archive/sessions/session-12-chest-lateral.md](archive/sessions/session-12-chest-lateral.md) | `docs/archive/sessions/session-12-chest-lateral.md` |
| [docs/archive/sessions/session-13-chest-ap.md](archive/sessions/session-13-chest-ap.md) | `docs/archive/sessions/session-13-chest-ap.md` |
| [docs/archive/sessions/session-13b-scene-design.md](archive/sessions/session-13b-scene-design.md) | `docs/archive/sessions/session-13b-scene-design.md` |
| [docs/archive/sessions/session-14-limbs-generalisation.md](archive/sessions/session-14-limbs-generalisation.md) | `docs/archive/sessions/session-14-limbs-generalisation.md` |
| [docs/archive/sessions/session-14.2b-hand.md](archive/sessions/session-14.2b-hand.md) | `docs/archive/sessions/session-14.2b-hand.md` |
| [docs/archive/sessions/session-14.3-elbow.md](archive/sessions/session-14.3-elbow.md) | `docs/archive/sessions/session-14.3-elbow.md` |
| [docs/archive/sessions/session-14.4-knee-foot.md](archive/sessions/session-14.4-knee-foot.md) | `docs/archive/sessions/session-14.4-knee-foot.md` |
| [docs/archive/sessions/session-14.5-ankle.md](archive/sessions/session-14.5-ankle.md) | `docs/archive/sessions/session-14.5-ankle.md` |
| [docs/archive/sessions/session-2-positioning.md](archive/sessions/session-2-positioning.md) | `docs/archive/sessions/session-2-positioning.md` |
| [docs/archive/sessions/session-3-technique.md](archive/sessions/session-3-technique.md) | `docs/archive/sessions/session-3-technique.md` |
| [docs/archive/sessions/session-4-radiograph-renderer.md](archive/sessions/session-4-radiograph-renderer.md) | `docs/archive/sessions/session-4-radiograph-renderer.md` |
| [docs/archive/sessions/session-5-baseline-options.md](archive/sessions/session-5-baseline-options.md) | `docs/archive/sessions/session-5-baseline-options.md` |
| [docs/archive/sessions/session-5-qa-matrix.md](archive/sessions/session-5-qa-matrix.md) | `docs/archive/sessions/session-5-qa-matrix.md` |
| [docs/archive/sessions/session-5-qa.md](archive/sessions/session-5-qa.md) | `docs/archive/sessions/session-5-qa.md` |
| [docs/archive/sessions/session-7-demographics-impact.md](archive/sessions/session-7-demographics-impact.md) | `docs/archive/sessions/session-7-demographics-impact.md` |
| [docs/archive/sessions/session-7-engine-generalisation.md](archive/sessions/session-7-engine-generalisation.md) | `docs/archive/sessions/session-7-engine-generalisation.md` |
| [docs/archive/sessions/session-8-demographics-alignment.md](archive/sessions/session-8-demographics-alignment.md) | `docs/archive/sessions/session-8-demographics-alignment.md` |
| [docs/archive/sessions/session-continuity-2026-10-11.md](archive/sessions/session-continuity-2026-10-11.md) | `docs/archive/sessions/session-continuity-2026-10-11.md` |
| [docs/archive/sessions/session-continuity-2026-10-15.md](archive/sessions/session-continuity-2026-10-15.md) | `docs/archive/sessions/session-continuity-2026-10-15.md` |
| [docs/archive/sessions/session-pelvis-ap-implementation.md](archive/sessions/session-pelvis-ap-implementation.md) | `docs/archive/sessions/session-pelvis-ap-implementation.md` |
| [docs/archive/sessions/session-pelvis-ap-reference-2026-10-15.md](archive/sessions/session-pelvis-ap-reference-2026-10-15.md) | `docs/archive/sessions/session-pelvis-ap-reference-2026-10-15.md` |
| [docs/archive/sessions/session-rad-041a-accounts-backend-2026-10-15.md](archive/sessions/session-rad-041a-accounts-backend-2026-10-15.md) | `docs/archive/sessions/session-rad-041a-accounts-backend-2026-10-15.md` |
| [docs/archive/sessions/session-rad-041b-account-ui-2026-10-15.md](archive/sessions/session-rad-041b-account-ui-2026-10-15.md) | `docs/archive/sessions/session-rad-041b-account-ui-2026-10-15.md` |
| [docs/archive/sessions/session-rad-043b-feedback-2026-10-16.md](archive/sessions/session-rad-043b-feedback-2026-10-16.md) | `docs/archive/sessions/session-rad-043b-feedback-2026-10-16.md` |
| [docs/archive/sessions/session-rad-045-credits-2026-10-16.md](archive/sessions/session-rad-045-credits-2026-10-16.md) | `docs/archive/sessions/session-rad-045-credits-2026-10-16.md` |
| [docs/archive/sessions/session-rad-047a-scalability-audit-2026-10-16.md](archive/sessions/session-rad-047a-scalability-audit-2026-10-16.md) | `docs/archive/sessions/session-rad-047a-scalability-audit-2026-10-16.md` |
| [docs/archive/sessions/session-rad-050-terms-implementation-2026-10-16.md](archive/sessions/session-rad-050-terms-implementation-2026-10-16.md) | `docs/archive/sessions/session-rad-050-terms-implementation-2026-10-16.md` |
| [docs/archive/sessions/session-rad-052-session-gate-2026-10-16.md](archive/sessions/session-rad-052-session-gate-2026-10-16.md) | `docs/archive/sessions/session-rad-052-session-gate-2026-10-16.md` |
| [docs/archive/sessions/session-rad-053-catalogue-2026-10-16.md](archive/sessions/session-rad-053-catalogue-2026-10-16.md) | `docs/archive/sessions/session-rad-053-catalogue-2026-10-16.md` |
| [docs/archive/sessions/session-rad-054-appearance-2026-10-16.md](archive/sessions/session-rad-054-appearance-2026-10-16.md) | `docs/archive/sessions/session-rad-054-appearance-2026-10-16.md` |
| [docs/archive/sessions/session-rad-054-implementation-2026-10-16.md](archive/sessions/session-rad-054-implementation-2026-10-16.md) | `docs/archive/sessions/session-rad-054-implementation-2026-10-16.md` |
| [docs/archive/sessions/session-rad-054-phone-fixes-2026-10-16.md](archive/sessions/session-rad-054-phone-fixes-2026-10-16.md) | `docs/archive/sessions/session-rad-054-phone-fixes-2026-10-16.md` |
| [docs/archive/sessions/session-shoulder-grashey-implementation-2026-10-15.md](archive/sessions/session-shoulder-grashey-implementation-2026-10-15.md) | `docs/archive/sessions/session-shoulder-grashey-implementation-2026-10-15.md` |
| [docs/archive/sessions/session-shoulder-grashey-reference-2026-10-15.md](archive/sessions/session-shoulder-grashey-reference-2026-10-15.md) | `docs/archive/sessions/session-shoulder-grashey-reference-2026-10-15.md` |
| [docs/archive/sessions/session-shoulder-grashey-settlement-2026-10-15.md](archive/sessions/session-shoulder-grashey-settlement-2026-10-15.md) | `docs/archive/sessions/session-shoulder-grashey-settlement-2026-10-15.md` |
| [docs/archive/sessions/session-shoulder-y-gates-2026-10-15.md](archive/sessions/session-shoulder-y-gates-2026-10-15.md) | `docs/archive/sessions/session-shoulder-y-gates-2026-10-15.md` |
| [docs/archive/sessions/session-shoulder-y-reference-2026-10-15.md](archive/sessions/session-shoulder-y-reference-2026-10-15.md) | `docs/archive/sessions/session-shoulder-y-reference-2026-10-15.md` |
| [docs/archive/sessions/session-ui-audit-2026-10-16.md](archive/sessions/session-ui-audit-2026-10-16.md) | `docs/archive/sessions/session-ui-audit-2026-10-16.md` |
| [docs/archive/analysis/SESSION_11_NEEDS_SUMMARY.md](archive/analysis/SESSION_11_NEEDS_SUMMARY.md) | `docs/archive/analysis/SESSION_11_NEEDS_SUMMARY.md` |
| [docs/archive/analysis/MODALITY_SOURCES_CANDIDATES.md](archive/analysis/MODALITY_SOURCES_CANDIDATES.md) | `docs/archive/analysis/MODALITY_SOURCES_CANDIDATES.md` |

### ميزانية الدفعة الثانية

هذه **ميزانية مقترحة للمسارات، وليست عملًا منفذًا أو بدءًا تلقائيًا**:41 نقل محتوى =82 مسارًا قديمًا/جديدًا، و20 ملفًا غير منقول تتطلب إحالاته أو قواعده المراجعة، وملفان جديدان؛ السقف المقترح **104 مسارات توثيق**. هذه41 عملية نقل ملف، و20 تحديثًا لملفات غير منقولة، وإنشاء ملفين؛ عرض المسار القديم والجديد لكل نقل يفسر سقف104، ولا يعني104 عمليات نقل. أعد الجرد على main عند بدء الدفعة؛ إن توسعت القائمة، حدّث الميزانية قبل التحرير.

الملفات غير المنقولة العشرون (الإحالات/التسليم/اختصار القواعد فقط، دون تغيير حقائق طبية):

- [CLAUDE.md](../CLAUDE.md)
- [README.md](../README.md)
- [docs/ASSET_PROVENANCE_AND_LICENSES.md](ASSET_PROVENANCE_AND_LICENSES.md)
- [docs/DECISIONS.md](DECISIONS.md)
- [docs/DOCS_ALIGN_1_REPORT_2026-10-16.md](DOCS_ALIGN_1_REPORT_2026-10-16.md)
- [docs/HANDOFF.md](HANDOFF.md)
- [docs/PLATFORM_ARCHITECTURE.md](PLATFORM_ARCHITECTURE.md)
- [docs/RAD-LAB_Medical_Reference_Chest_AP.md](RAD-LAB_Medical_Reference_Chest_AP.md)
- [docs/RAD-LAB_Medical_Reference_Chest_Lateral.md](RAD-LAB_Medical_Reference_Chest_Lateral.md)
- [docs/RAD_047B_IMPLEMENTATION_PLAN.md](RAD_047B_IMPLEMENTATION_PLAN.md)
- [docs/README.md](README.md)
- [docs/REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md](REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md)
- [docs/ROADMAP_SESSIONS.md](ROADMAP_SESSIONS.md)
- [docs/archive/HANDOFF-rad-045-2026-10-16.md](archive/HANDOFF-rad-045-2026-10-16.md)
- [docs/archive/HANDOFF-until-2026-10-16.md](archive/HANDOFF-until-2026-10-16.md)
- [docs/exam-recipe.md](exam-recipe.md)
- [docs/project-status.md](project-status.md)
- [docs/prompts/rad-047b-core-foundation.md](prompts/rad-047b-core-foundation.md)
- [docs/status-archive.md](status-archive.md)
- [docs/status-format.md](status-format.md)

ملفان جديدان مقترحان: `docs/archive/README.md` لفهرسة الأرشيف و`docs/DOCS_ARCHIVE_2_REPORT.md` للتقرير والتسليم. CLAUDE.md والوصفة ضمن العشرين، لا ملفان إضافيان. لا تغيير لآلية فحص الحالة أو CI أو src أو الاختبارات/التوصيف.

تبقى أربعة مسارات قديمة **كملفات إحالة قصيرة** بعد نقل المحتوى؛ فهي مذكورة في ملفات غير توثيقية لا نغيّرها. تدخل هذه الملفات القديمة ضمن الـ82، ولا تزيد الميزانية:

| مسار الإحالة القديم | المرجع الثابت الذي يبقى دون تعديل |
|---|---|
| `docs/archive/sessions/session-5-qa.md` | `.github/workflows/ci.yml` |
| `docs/archive/sessions/session-7-demographics-impact.md` | `src/data/cases/chest-pa-erect.ts` |
| `docs/archive/sessions/session-13b-scene-design.md` | `src/features/positioning/LateralFigure.tsx` |
| `docs/archive/sessions/session-3-technique.md` | `src/features/technique/model.ts` |

قبل النقل: افحص جميع الروابط والعناوين وsource_ref والإحالات النصية مرة أخرى، واحفظ خريطة old→new والمحتوى الأصلي. بعد النقل: أعد كتابة الروابط النسبية داخل المنقول وغير المنقول، واحفظ المعرفات والعناوين/إحالات التوافق المطلوبة. REVIEW_CHECKLIST وREVIEW_PACKAGE يبقيان نشطتين؛ لا تغيير لمرجع المصدر داخل الفحوص أو ملفات التوصيف.

اختصار CLAUDE.md والوصفة ينقل القواعد الملزمة والفجوات المفتوحة إلى مواضع قابلة للوصول قبل حذف تكرارها: السلطة الطبية، المرجع أولًا، التراخيص، الحراس وS-STD، حدود النماذج وحقيقة التأثير، الحسابات والاستثناءات، والقرارات المؤجلة. لا تعميم marker weight: Chest PA ما زال weight0 في الكود، ولا يُحوَّل إلى موزون بتنظيف وثائق. لا حذف تلقائي لقسم Known gaps قبل توزيع البنود المفتوحة وتمييز المغلق؛ ولا إزالة قرار قديم لمجرد قدمه إن بقي ملزمًا.

```text
SESSION: DOCS-ARCHIVE-2 — مقترح للمالك، لا يبدأ تلقائيًا
ابدأ فقط عند طلب المالك ومن main محدث بعد التحقق من دمج دفعة DOCS-ALIGN-1. اقرأ HANDOFF والحالة وهذا التقرير، وأعد حساب خريطة41 نقلًا/104 مسارات مقترحة. لا src/public/assets/messages أو tests/characterisation/hashes أو تغيير طبي/درجات؛ أبق القائمة والحزمة الطبية نشطتين وأربعة مسارات الإحالة القديمة للمرجع الثابت. اختصر CLAUDE والوصفة بحفظ القواعد والفجوات، ثم افحص روابط/عناوين/source_ref والجداول والحالة والمحتوى المنقول. Draft PR فقط؛ لا دمج أو معاينة مستضافة أو استئناف برمجي.
```
