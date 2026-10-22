# حالة مشروع RAD-LAB

> **هذا الملف هو المصدر الموحّد للحالة الحالية** (يحدّثه Claude Code وCodex ضمن جلسات العمل، ويُعرض لاحقاً في Obsidian).
> التنسيق وقواعد التحديث: [`status-format.md`](status-format.md). الفحص: `npm run status:check`.
> الحقول الثابتة (أسماء المفاتيح وقيم `status` و`priority`) بالإنجليزية لسهولة القراءة الآلية؛ العناوين والأوصاف بالعربية.

## ملخص الحالة الحالية (سرد قصير، يُحدَّث كله في كل جلسة؛ لا يُقرأ آلياً)

- **الاتجاه الحالي:** بعد دمج #96 وإغلاق التجربة الهندسية اكتمل تدقيق RAD-061 القرائي؛ الترتيب بحسب [قرار ترتيب التنظيف](DECISIONS.md#cleanup-sequencing-owner-2026-10-22): الدفعة 1 (مدموجة) ← تشخيص حد الوقت (الخيار أ في Draft PR) ← الدفعات 2–6 ← جرد RAD-064 ← RAD-062 ← جلسة المحاكي بعد رد RAD-019 ← RAD-059 ← RAD-057 ← RAD-063.
- **ينتظر المالك:** مراجعة Draft PR [الخيار (أ) لحد الوقت](RAD-061_TIMEOUT_DIAGNOSIS_2026-10-22.md)، ثم موافقة الدفعة 2 من [تقرير RAD-061](RAD-061_CODE_AUDIT_REPORT_2026-10-22.md#batches)؛ تحقق حصص Supabase قبل RAD-062؛ استئناف برمجة Assess.
- **ينتظر مراجِعًا بشريًا:** RAD-019 ومعها بنود التدقيق CLN-018/027/034، ويجوز إرسالها الآن؛ O108 والمصادر والتراخيص والنسخ مستقلة في RAD-063.
- **مرجع Git:** docs:context والأداة المتصلة للرؤوس وفحوصها؛ تقرير RAD-061 و[قرار ترتيب المراحل](DECISIONS.md#assess-authoring-owner-2026-10-22).
- **مخاطر معلنة:** تعديل ملف مثبّت ببصمة حدود الاتصال دون تحديثها يُسقط CI؛ حد وقت `server-runtime.test.ts` قد يتذبذب (السبب المقاس تنافس على إنشاء PGlite، وطُبّق حد صريح 30000 في Draft PR؛ الخيار (ب) مؤجل بمحفّزيه في RAD-061)؛ نطاق التجربة يبقى فعّالًا بقرار الإغلاق دون تشغيل أو قبول حي.

## البيانات الحالية (قابلة للقراءة الآلية)

<!-- STATUS-DATA:BEGIN -->
```json
{
  "project": "RAD-LAB",
  "format_version": "1.1",
  "revision": 205,
  "updated_at": "2026-10-22T10:10:00+00:00",
  "timezone": "UTC",
  "next_id": "RAD-065",
  "tasks": [
    {
      "id": "RAD-001",
      "title": "محاكي Chest PA الأساسي ومعاينة النشر (الجلسات 1–6)",
      "status": "done",
      "priority": "high",
      "description": "المحاكي ثنائي اللغة لفحص Chest PA: التموضع، التقنية، مولّد صورة النتيجة، مصفوفة QA، ومعاينة ساكنة خاصة مع لافتة 'Educational prototype'.",
      "source_ref": "docs/ENGINE_GUIDE.md (Medical evidence, scoring and rendering؛ Pilot, hosting and runtime)؛ docs/archive/sessions/session-2-positioning.md، docs/archive/sessions/session-3-technique.md، docs/archive/sessions/session-4-radiograph-renderer.md، docs/archive/sessions/session-5-qa.md؛ docs/DEPLOYMENT.md",
      "completion_evidence": "الكود والاختبارات والبيانات في main؛ توثيق الجلسات؛ مصفوفة QA الموثّقة في docs/archive/sessions/session-5-qa-matrix.md؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS. (لا يثبت هذا نشر المعاينة فعلياً: انظر RAD-024.)"
    },
    {
      "id": "RAD-002",
      "title": "فصل ExamDefinition عن CaseDefinition (الجلسة 7)",
      "status": "done",
      "priority": "high",
      "description": "تقسيم بيانات Chest PA إلى فحص وحالة مع composeCase وvalidators بلا تغيير في السلوك. الباقي من نطاق الجلسة 7 مؤجَّل في RAD-021.",
      "source_ref": "docs/ROADMAP_SESSIONS.md (Session 7 'DONE in part')؛ docs/archive/sessions/session-7-engine-generalisation.md؛ DECISIONS.md S7-1…S7-4",
      "completion_evidence": "اختبار التوصيف المقارِن بايتاً ببايت src/features/qa/characterisation.test.ts مع scripts/qa/characterisation/*؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-003",
      "title": "محاذاة بيانات المريض لصورة الأساس (D7، الجلسة 8)",
      "status": "done",
      "priority": "medium",
      "description": "مواءمة عمر/جنس/ضمائر الحالة ونصوصها العربية مع صورة الأساس A-001 دون تغيير الصورة أو قيم طبية.",
      "source_ref": "docs/archive/sessions/session-8-demographics-alignment.md؛ DECISIONS.md D7 (و O1 المحسومة)",
      "completion_evidence": "اختبار src/features/qa/demographics-independence.test.ts واختبار التوصيف؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-004",
      "title": "هيكل المنصة: الكتالوج وصفحة الفحص ومسار Practice (الجلسة 9)",
      "status": "done",
      "priority": "high",
      "description": "مسارات /{locale}/{modality}/{exam}/practice، صفحات 404 ثنائية اللغة، إعادة توجيه روابط /simulation القديمة. لم تُبنَ حاويات Learn/Reference ولا مبدّل الأوضاع (قرار D1).",
      "source_ref": "docs/ROADMAP_SESSIONS.md (Session 9)؛ DECISIONS.md D1, D2؛ docs/adr/ (ADR-0011)؛ docs/PLATFORM_ARCHITECTURE.md",
      "completion_evidence": "اختبار تزامن روابط legacy مع public/_redirects ضمن مجموعة الاختبارات؛ فحص axe/QA حسب مصفوفة الجلسة؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-005",
      "title": "مراجع Chest Lateral وChest AP ومكتبة المصادر (الجلستان 10 و10b)",
      "status": "done",
      "priority": "high",
      "description": "مستندات مرجعية وسجل مصادر بملاحظات مُعاد صياغتها مع أرقام الصفحات، وملخص احتياجات الجلسة 11. أُنجز بالتوثيق فقط. ملاحظة: مطالبات المصادر قرأها مستشار المالك ولم يعد Claude Code التحقق منها.",
      "source_ref": "docs/ROADMAP_SESSIONS.md (Sessions 10, 10b)؛ docs/sources/REGISTER.md؛ docs/archive/analysis/SESSION_11_NEEDS_SUMMARY.md؛ DECISIONS.md S10-1…S10-5، S10b-1…S10b-26",
      "completion_evidence": "الملفات موجودة ومدموجة في main (docs/RAD-LAB_Medical_Reference_*.md، docs/sources/*.md). إنجاز توثيقي: لا يثبت صحة القيم الطبية (انظر RAD-019)."
    },
    {
      "id": "RAD-006",
      "title": "تعميم المحرك (الجلسة 11): آليات اختيارية دون تغيير Chest PA",
      "status": "done",
      "priority": "high",
      "description": "قواعد العلامة، زاوية الأنبوب، choiceControls، فئات لكل فحص، مسجّل المشاهد، مجموعات معالم اختيارية، توهين لكل إسقاط.",
      "source_ref": "docs/archive/sessions/session-11-generalisation.md؛ DECISIONS.md S11-1…S11-4؛ docs/ENGINE_GUIDE.md (Architecture and optional mechanisms)",
      "completion_evidence": "اختبار التوصيف وscripts/qa/golden دون تغيير؛ اختبارات generalisation.test.ts؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-007",
      "title": "تحديث تسجيل Chest PA (S11b وS11c): kV وSID والعلامة واتجاه التدوير",
      "status": "done",
      "priority": "medium",
      "description": "تثبيت kV، نطاق SID، شرط وجود العلامة كنتيجة حرجة، واتفاقية اتجاه التدوير مع ملاحظات الاتجاه. ما زالت القيم مؤقتة حتى مراجعة المعلّم/الفيزيائي.",
      "source_ref": "DECISIONS.md S11b-1، S11c-1، S11c-2 (و O12 المغلقة)؛ docs/ROADMAP_SESSIONS.md (Session 11b — سطر 'PARTLY DONE' قديم، انظر RAD-025)",
      "completion_evidence": "اختبارات التسجيل والتدوير في المستودع؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-008",
      "title": "فحص Chest Lateral (الجلسة 12)",
      "status": "done",
      "priority": "high",
      "description": "فحص chest-lateral-erect من آليات S11 فقط، مع حالته وصورته A-006/A-007 ومشهده وقواعد العلامة والذراعين. البنود المفتوحة: O14 وO15 (انظر RAD-016 وRAD-019).",
      "source_ref": "docs/archive/sessions/session-12-chest-lateral.md؛ DECISIONS.md S12-1…S12-11؛ docs/ROADMAP_SESSIONS.md (Session 12 status)",
      "completion_evidence": "اختبارات الفحص والحالة ومصفوفة lateral-audit؛ بقاء الحارس scripts/qa/characterisation لـ Chest PA دون تغيير؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-009",
      "title": "فحص Chest AP supine (الجلسة 13)",
      "status": "done",
      "priority": "high",
      "description": "فحص chest-ap-supine مع صورة NIH ChestX-ray14 وقاعدة تدوير بالحجم فقط. متغيرات erect/semi-erect وبنود O18 غير منفّذة (RAD-020).",
      "source_ref": "docs/archive/sessions/session-13-chest-ap.md؛ DECISIONS.md S13-1…S13-7؛ docs/ENGINE_GUIDE.md (Existing exam limits)",
      "completion_evidence": "اختبارات الفحص وscripts/qa/ap-audit.mjs؛ PA وLateral دون تغيير بايتياً حسب docs/archive/sessions/session-13-chest-ap.md؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-010",
      "title": "إعادة تصميم مشاهد الصدر (S13b) ووصفة الفحص (S13c)",
      "status": "done",
      "priority": "medium",
      "description": "لغة بصرية موحّدة للمشاهد الثلاثة وألوان وتباين مفحوصة آلياً، ثم docs/exam-recipe.md كقائمة ثابتة لإضافة فحوص جديدة.",
      "source_ref": "docs/archive/sessions/session-13b-scene-design.md؛ docs/exam-recipe.md؛ DECISIONS.md S13b-1, S13c-1",
      "completion_evidence": "اختبار scene-style.test.ts (تباين ≥ 3:1) وحارس scene-dom؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-011",
      "title": "تعميم للأطراف بلا تغيير سلوكي (S14-0) ومعيار صياغة الجلسات (S-STD)",
      "status": "done",
      "priority": "medium",
      "description": "ProjectionId وWordingNs سلاسل مفتوحة مسجّلة، SceneLayout وDetectorFigure، حارس scene-dom؛ وإقرار معيار الجلسة S-STD-1/2 الملزم.",
      "source_ref": "docs/archive/sessions/session-14-limbs-generalisation.md؛ DECISIONS.md S-STD-1، S-STD-2",
      "completion_evidence": "اختبار src/features/qa/scene-dom.test.ts مع scripts/qa/scene-dom/hashes.json؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-012",
      "title": "فحوص wrist-pa وwrist-lateral (S14.1)",
      "status": "done",
      "priority": "medium",
      "description": "مرجع الرسغ ثم فحصان للرسغ الأيسر مع قاعدة علامة fixed-side وتأثير تدوير تقريبي من صورة واحدة. قيود الصور وO28/O31 مفتوحة (RAD-019).",
      "source_ref": "docs/RAD-LAB_Medical_Reference_Wrist.md؛ DECISIONS.md S14.1-3، S14.1b-1، S14.1c-1…S14.1c-8؛ docs/ROADMAP_SESSIONS.md (S14.1c PR #23)",
      "completion_evidence": "اختبارات الفحصين وscene-dom-wrist.test.ts مع wrist-hashes.json؛ scripts/qa/wrist-audit.mjs؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-013",
      "title": "فحوص hand-pa وhand-lateral (S14.2b)",
      "status": "done",
      "priority": "medium",
      "description": "فحصا اليد اليسرى (الجانبي = نسخة الامتداد) بنموذج يد 2.5D مشترك بين المشهد وصورة النتيجة.",
      "source_ref": "docs/archive/sessions/session-14.2b-hand.md؛ docs/RAD-LAB_Medical_Reference_Hand.md؛ DECISIONS.md S14.2-6…S14.2-11",
      "completion_evidence": "scene-dom-hand.test.ts مع hand-hashes.json؛ scripts/qa/hand-audit.mjs؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-014",
      "title": "فحوص elbow-ap وelbow-lateral (S14.3)",
      "status": "done",
      "priority": "medium",
      "description": "فحصا الكوع الأيسر (AP ممدود، جانبي مثني 90°) بنموذج تدوير صغير مشترك.",
      "source_ref": "docs/archive/sessions/session-14.3-elbow.md؛ docs/RAD-LAB_Medical_Reference_Elbow.md؛ DECISIONS.md S14.3-5…S14.3-12",
      "completion_evidence": "scene-dom-elbow.test.ts مع elbow-hashes.json؛ scripts/qa/elbow-audit.mjs؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-015",
      "title": "فحوص knee-ap وknee-lateral وfoot-ap وfoot-oblique وankle-ap وankle-lateral (S14.4 وS14.5)",
      "status": "done",
      "priority": "medium",
      "description": "ستة فحوص أطراف سفلية (الركبة والقدم يمنى، الكاحل يسرى مستنتجة) على باني الطرف السفلي مع تحكم زاوية الأنبوب. أُنجزت في PR #29 (S14.4) وPR #31 (S14.5).",
      "source_ref": "docs/archive/sessions/session-14.4-knee-foot.md؛ docs/archive/sessions/session-14.5-ankle.md؛ DECISIONS.md S14.4-1…S14.4-18، S14.5-1…S14.5-13",
      "completion_evidence": "scene-dom-lower-limb.test.ts وscene-dom-ankle.test.ts مع ملفات التجزئة الخاصة بكل فحص؛ scripts/qa/lower-limb-audit.mjs وankle-audit.mjs؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-016",
      "title": "جولتا الوضوح البصري للأطراف (S-VIS-1a وS-VIS-1b)",
      "status": "done",
      "priority": "low",
      "description": "علامة الجانب الواضحة، إخفاء رموز القرارات الداخلية عن الطالب، تسميات الإرشاد في الهامش، نموذج تدوير الرسغ 2.5D، ودقة نتائج الرسغ/الركبة/القدم. بقي O55/O74 مفتوحاً (RAD-017).",
      "source_ref": "DECISIONS.md S-VIS-1-1…S-VIS-1-5، S-VIS-1b-1…S-VIS-1b-9؛ docs/ROADMAP_SESSIONS.md؛ سجل git (دمج PR #28 وPR #30)",
      "completion_evidence": "دمج PR #28 وPR #30 في main؛ تحديث حراس scene-dom بموافقة المالك (S-VIS-1-5، S-VIS-1b-9)؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-017",
      "title": "قرارات بيانات مفتوحة عند المالك: موضع علامة hand-PA (O55/O74)، اتجاه لوحة elbow-lateral (O52)، ملف foot (O59)",
      "status": "planned",
      "priority": "medium",
      "description": "ثلاثة قرارات صغيرة عند المالك: موضع علامة hand-PA (O55/O74)، اتجاه كاسيت elbow-lateral (O52)، ملف القدم المقصود (المعلن 1067×1913 والمرفق 1061×2431، O59). لا تعديل قبل القرار (S-STD-1).",
      "source_ref": "DECISIONS.md O55، O74، O52، O59 وS-VIS-1b-9",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-018",
      "title": "متابعة رخص الصور وحدود الدليل قبل الإصدار",
      "status": "review",
      "priority": "high",
      "description": "O100 حسم قبول أدلة المالك ولا يطلب إعادة فحص Commons؛ لا تحويل owner-verified إلى تحقق مستقل. المتبقي الخارجي شروط NIH/A-008 المؤجلة في RAD-038؛ أوصاف المريض/ملاءمة الصورة لا يحسمها قرار الرخص. تبقى المهمة review دون إعادة فتح التحقق المقبول. يُغلق عند إغلاق RAD-038 أو قرار المالك بإخراج A-008 من الإصدار؛ لا حاجة لإعادة فحص Commons.",
      "source_ref": "DECISIONS.md O100/O101/O16/O65/O77؛ docs/ASSET_LICENCE_AUDIT_2026-10-15.md؛ docs/ASSET_PROVENANCE_AND_LICENSES.md",
      "waiting_on": "external"
    },
    {
      "id": "RAD-019",
      "title": "مراجعة المعلّم والفيزيائي الطبي لكل القيم المؤقتة والنص العربي (O5)",
      "status": "review",
      "priority": "high",
      "description": "حزمة المراجعة (docs/REVIEW_PACKAGE.md) جاهزة وتنتظر معلّمًا وفيزيائيًا طبيًا: قيم Chest والأطراف والحوض والكتف، النص العربي، وحدود الصور والمقياس (بنود O). يجوز إرسالها الآن مع بنود CLN-018/027/034 (البند 6 من قرار ترتيب التنظيف). ليست بوابة للجلسات (S10b-20). يُغلق عند جواب كل بند أو تسجيل المالك تركه غير مراجَع.",
      "source_ref": "docs/REVIEW_PACKAGE.md؛ docs/REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md؛ DECISIONS.md O5، S10b-20؛ docs/RAD-061_CODE_AUDIT_REPORT_2026-10-22.md#rad-019-review-items (CLN-018/027/034)؛ docs/DECISIONS.md#cleanup-sequencing-owner-2026-10-22",
      "waiting_on": "reviewer"
    },
    {
      "id": "RAD-020",
      "title": "متغيرات Chest AP المؤجلة: erect/semi-erect، تسمية SID، كاسيت أفقي والتعريض اليدوي",
      "status": "deferred",
      "priority": "low",
      "description": "بقية O18/O19: وضعيات AP erect/semi-erect، تسمية SID والوضعية على الصورة، الكاسيت الأفقي وبناء المريض، فرض manual وعرض الإسقاط الخاطئ. صفحة الاعتمادات منفذة في RAD-045؛ لا تعاد هنا. قيمة manual الافتراضية لا تعني منع AEC؛ التنفيذ مؤجل.",
      "source_ref": "DECISIONS.md O9، O18، O19، S10b-12؛ docs/archive/sessions/session-13-chest-ap.md (البنود غير المنفّذة)",
      "defer_reason": "لم يطلب المالك جدولتها؛ تجميد الفحوص/الصور وتأجيل البرمجة باقيان. الاعتمادات مكتملة في RAD-045، لا ضمن المتبقي."
    },
    {
      "id": "RAD-021",
      "title": "نقل الكود إلى modalities/xray/* وإخراج المستهلكين من RadCase (مؤجَّل منذ S7/S11)",
      "status": "deferred",
      "priority": "low",
      "description": "ما زال RadCase عرض توافق، ولا يوجد src/modalities. يبقى مؤجلاً حتى يحتاجه فحص أو نمط جديد فعلاً، وإن احتيج يأتي بعد جلسة تعميم الأطراف العليا (CLN-016/017/025/028) لا قبلها، كي لا تُعاد هيكلة الملفات نفسها مرتين (البند 7).",
      "source_ref": "DECISIONS.md S7-2، S7-4؛ docs/archive/analysis/SESSION_11_NEEDS_SUMMARY.md (صفوف deferred)؛ docs/archive/sessions/session-11-generalisation.md؛ docs/DECISIONS.md#cleanup-sequencing-owner-2026-10-22",
      "defer_reason": "قاعدة الثلاثة (rule of three): لا حاجة ملموسة؛ التغيير كبير ويصعب إثبات عدم تغيّر السلوك فيه."
    },
    {
      "id": "RAD-022",
      "title": "فحوص X-ray v1 المتبقية: abdomen ثم head ثم spine (مرجع أولًا)",
      "status": "deferred",
      "priority": "medium",
      "description": "الحوض مكتمل في RAD-028/030. الباقي abdomen ثم head ثم spine، بمرجع وNeeds مدموجين قبل الكود؛ لا يبدأ مع تجميد الصور والفحوص الجديدة. CT/MRI/US في v2؛ الترتيب التاريخي ليس إذن تنفيذ.",
      "source_ref": "DECISIONS.md S12-12، S10-2، S-SHOULDER-Y-6؛ docs/exam-recipe.md؛ docs/ROADMAP_SESSIONS.md",
      "defer_reason": "قرار المالك S-SHOULDER-Y-6 يجمّد الفحوص والصور الجديدة؛ لا استئناف دون رفع التجميد صراحةً."
    },
    {
      "id": "RAD-023",
      "title": "تحضير الإصدار: لافتة المعاينة، تدقيق الرخص التجاري، صفحة الاعتمادات، قراءة المصادر المتبقية",
      "status": "planned",
      "priority": "low",
      "description": "تحضير الإصدار بعد اكتمال X-ray v1: قرار المالك للافتة المعاينة، تدقيق الرخص بعد الأصول الجديدة، قراءة O4/O26. الاعتمادات منفذة في RAD-045؛ شروط NIH مؤجلة في RAD-038. لا يبدأ تلقائيًا ضمن جرد الأدلة.",
      "source_ref": "DECISIONS.md S12-12، O4، O10، O26، S10b-20؛ docs/ENGINE_GUIDE.md (Pilot, hosting and runtime — لا تُزل اللافتة دون قرار المالك)",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-024",
      "title": "حالة نشر المعاينة الخاصة (Cloudflare Pages وZero Trust Access)",
      "status": "review",
      "priority": "medium",
      "description": "نجح Deploy Pages على main لرأس دمج #86 (run39074999369)، بما فيه رفع Cloudflare. لا يثبت هذا تقييد الموقع بـAccess أو حد مستخدميه. ينتظر المالك توثيق حالة Access ونطاق الحماية؛ فحص الهاتف في #85 منفصل.",
      "source_ref": "docs/DEPLOYMENT.md؛ .github/workflows/deploy-pages.yml؛ docs/archive/planning/ROADMAP-until-2026-10-16.md (Gate G0)؛ https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39074999369",
      "conflict": "سجل G0 التاريخي يطلب حماية Cloudflare Access؛ نجاح الرفع وإفادة الهاتف لا يثبتان تطبيقها. يبقى اختلاف وصف «معاينة خاصة» عن الدليل غير محسوم حتى إفادة المالك بإعداد Access ونطاقه.",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-025",
      "title": "مواءمة صياغة ROADMAP_SESSIONS.md وDECISIONS.md مع الحالة المدموجة",
      "status": "done",
      "priority": "low",
      "description": "مواءمة الوثائق وأرشفة التاريخ وتوحيد القراءة وآلية العمل والفحص المشترك مكتملة ضمن #81 و#82؛ المراجعات الطبية والهاتف والمهام الأخرى مستقلة.",
      "source_ref": "PR #82؛ docs/DOCS_WORKFLOW_REPORT.md؛ docs/DOCS_ARCHIVE_2_REPORT.md؛ AGENTS.md؛ docs/DECISIONS.md S-DOCS-WORKFLOW-1",
      "completion_evidence": "دُمج PR #82 في main عند 015ac5999b9aa1223e43cec7fcac5c6b542cf5de بتاريخ 2026-10-17؛ أكدت GitHub API الدمج ومطابقة شجرة main لرأس12041dc. نجح CI246 وDeploy238 على الرأس نفسه؛ التقارير توثق حفظ القواعد والمعرّفات."
    },
    {
      "id": "RAD-026",
      "title": "فحص تحذير lint غير المتحقَّق منه في scripts/qa/wrist-audit.mjs (O38)",
      "status": "done",
      "priority": "low",
      "description": "التحذير 'group' غير مستخدم في wrist-audit.mjs:55 تأكد أصله (سطر معرّف لا يُستدعى) وأُزيل بموافقة المالك على حزمة 2؛ lint بلا تحذيرات.",
      "completion_evidence": "npm run lint نظيف (0 تحذير) بعد حذف السطر؛ npm run check: 67 ملفًا/1646 اختبارًا ناجحًا؛ لا يثبت أي شيء عن صحة تدقيق wrist-audit في المتصفح (لم يُعد تشغيله).",
      "source_ref": "DECISIONS.md O38؛ ناتج npm run lint في جلسة RAD-STATUS"
    },
    {
      "id": "RAD-027",
      "title": "مرجع Forearm AP + Lateral وقسم Needs فقط",
      "status": "deferred",
      "priority": "high",
      "description": "مرجع الساعد AP/Lateral لم يُكتب؛ O37 لغياب الصور المناسبة باقٍ. تأجيل الساعد وتجميد الصور والفحوص الجديدة حاكمان الآن؛ توفر Bontrager لا يرفع التجميد. عند رفعه الترتيب: هذا المرجع مدموجًا (S10-2) ← جلسة تعميم الأطراف العليا (CLN-016/017/025/028) ← فحص forearm (البند 7).",
      "source_ref": "DECISIONS.md O37، S10-2، S-SHOULDER-Y-6؛ docs/archive/sessions/session-continuity-2026-10-15.md؛ S-PELVIS-REF-1؛ docs/DECISIONS.md#cleanup-sequencing-owner-2026-10-22",
      "defer_reason": "تأجيل الساعد مسجل في O37، وقرار المالك S-SHOULDER-Y-6 يجمّد الصور والفحوص الجديدة."
    },
    {
      "id": "RAD-028",
      "title": "مرجع Pelvis AP وقسم Needs",
      "status": "done",
      "priority": "high",
      "description": "مرجع Pelvis AP وNeeds مدموجان في PR #33. لا يثبت إنجاز المرجع صحة المحتوى الطبي؛ التنفيذ منفصل في RAD-030.",
      "source_ref": "docs/RAD-LAB_Medical_Reference_Pelvis_AP.md؛ docs/archive/sessions/session-pelvis-ap-reference-2026-10-15.md؛ DECISIONS.md S-PELVIS-REF-1/2؛ PR #33",
      "completion_evidence": "PR #33 مدموج في main عند f531a660c3a184677bb82807e6e06158a3a48857؛ المرجع وNeeds وقرارات S-PELVIS-REF-1/2؛ تحقق Git/API 2026-10-15."
    },
    {
      "id": "RAD-029",
      "title": "صورة Pelvis AP المنظفة من marker — مادة مراجعة",
      "status": "review",
      "priority": "high",
      "description": "A-034/A-035 مدموجان (#33) وA-036 نسخة المنتج؛ التنظيف تحقق بصفر بكسل متغير خارج الخلفية. تبقى ملاءمة الصورة وتغطيتها للمراجعة الطبية (O84/O5). يُغلق بقرار المراجِع (O84) على ملاءمة الصورة.",
      "source_ref": "docs/ASSET_PROVENANCE_AND_LICENSES.md A-034/A-035؛ scripts/derive-pelvis-baseline.py؛ DECISIONS.md O84؛ PR #33",
      "waiting_on": "reviewer"
    },
    {
      "id": "RAD-030",
      "title": "تنفيذ Pelvis AP مستلقٍ بنهج الفحوص السابقة",
      "status": "done",
      "priority": "high",
      "description": "تنفيذ Pelvis AP مستلقٍ مدموج في main بعد مراجعة المالك؛ وضع الطرفين وحبس النفس مستقلان، علامة تشريحية وتعريض يدوي ودوران تعليمي من صورة واحدة. لا يتضمن ذلك إثبات النشر أو اعتمادًا طبيًا.",
      "source_ref": "DECISIONS.md S-PELVIS-1-1…5؛ docs/archive/sessions/session-pelvis-ap-implementation.md؛ PR #34",
      "completion_evidence": "راجع المالك الفرع وأعلن دمجه؛ GitHub يؤكد دمج PR #34 في 2026-10-15T07:43:19Z بالـcommit 8ba28769a9b870cef9f7cab835af8cafd1b4083a على main. QA التنفيذ الموثقة: typecheck/lint (O38 فقط)، 63 ملفًا/1629 اختبارًا، build، حارس scene-dom للحوض، 84 فحص متصفح/axe EN/AR و648 حالة تسميات ناجحة. الفحوص الـ15 السابقة دون تغيير. لم تُعد اختبارات التطبيق في تحديث التوثيق."
    },
    {
      "id": "RAD-031",
      "title": "مرجع الكتف Grashey وNeeds قبل الكود",
      "status": "done",
      "priority": "high",
      "description": "مرجع AP oblique glenoid/Grashey وNeeds بقراءة Bontrager ص196 مباشرة، مدموج في main. لا يشمل Shoulder AP العادي أو Y أو axillary. القيم الطبية مؤقتة تحت O5؛ الدمج لا يثبت صحة المحتوى الطبي.",
      "source_ref": "توجيه المالك 2026-10-15؛ DECISIONS.md S-SHOULDER-REF-1؛ docs/RAD-LAB_Medical_Reference_Shoulder_Grashey.md؛ docs/archive/sessions/session-shoulder-grashey-reference-2026-10-15.md؛ PR #36",
      "completion_evidence": "PR #36 مدموج في main بيد المالك (merged_by omarhleeq-dotcom) في 2026-10-15T08:18:35Z عند الـcommit 91f0bc43247a2c955f1ff2c0c43e61b9707270ff؛ تحقق GitHub API وgit (HEAD = origin/main) في 2026-10-15. المرجع وNeeds وقرار S-SHOULDER-REF-1؛ توثيق فقط."
    },
    {
      "id": "RAD-032",
      "title": "مطابقة صورة الكتف وترخيصها وملاءمتها",
      "status": "review",
      "priority": "high",
      "description": "هوية صورة الكتف وترخيصها مطابقان (CC0، SHA-1 مطابق، O87 مغلق)؛ الأصل A-037 والويب A-038 بلا تعديل بكسلات. تبقى ملاحظات الصورة (الإطار ينتهي في منتصف العضد، هامش مائل، اسم الملف normal) وملاءمتها للمراجعة (O91/O5). يُغلق بقرار المراجِع (O91) على ملاحظات الصورة.",
      "source_ref": "DECISIONS.md S-SHOULDER-2-1/2-2، S-SHOULDER-3-4؛ O87/O91؛ ASSET_PROVENANCE A-037/A-038؛ مرجع Shoulder Grashey §8.8 و§12.1–12.2؛ docs/archive/sessions/session-shoulder-grashey-settlement-2026-10-15.md",
      "waiting_on": "reviewer"
    },
    {
      "id": "RAD-033",
      "title": "تنفيذ Shoulder Grashey (قائم)",
      "status": "done",
      "priority": "medium",
      "description": "تنفيذ `shoulder-grashey-erect` مدموج في main (PR #40): قائم فقط، كاشف 24×30 أفقي، علامة R ثابتة، زاوية جسم مطلقة بهضبة 35°–45°، ذراع بلا أثر على الصورة، وإشارة واحدة هي انغلاق الحيّز المفصلي. يبقى تأكيد المالك لـS-SHOULDER-2-3…6 (O96) وهندسة O95؛ الاختيارات التعليمية B غير محققة (O5). لا تنفيذ لسلسلة كتف كاملة تلقائيًا.",
      "completion_evidence": "دمج PR #40 في main (commit e7cbc85)؛ QA التنفيذ في docs/archive/sessions/session-shoulder-grashey-implementation-2026-10-15.md (استُعيد نصه بعد أن أُفرغ في دمج f7b36fd؛ جلسة استعادة السجل). لا يثبت الصحة الطبية.",
      "source_ref": "DECISIONS.md S-SHOULDER-3-1…5/O88/O95/O96؛ docs/archive/sessions/session-shoulder-grashey-implementation-2026-10-15.md؛ docs/RAD-LAB_Medical_Reference_Shoulder_Grashey.md §12"
    },
    {
      "id": "RAD-034",
      "title": "مرجع Shoulder Y وNeeds من Bontrager دون كود",
      "status": "done",
      "priority": "high",
      "description": "مرجع PA oblique scapular Y وNeeds مدموجان في main بقراءة Bontrager ص201. إنجاز توثيقي فقط؛ لا تنفيذ فحص أو استيراد صورة أو اعتماد طبي.",
      "source_ref": "توجيه المالك 2026-10-15؛ DECISIONS.md S-SHOULDER-Y-REF-1؛ docs/RAD-LAB_Medical_Reference_Shoulder_Y.md؛ docs/archive/sessions/session-shoulder-y-reference-2026-10-15.md؛ PR #38",
      "completion_evidence": "أعلن المالك دمج الدوكس؛ GitHub وGit يؤكدان دمج PR #38 في 2026-10-15T08:53:49Z بالـcommit 5821c4ec31a231529eb230d26f9f7e7b219fb0db. مرجع Shoulder_Y وأقسام Needs الثمانية وسجل الجلسة مدموجة؛ نجحت فحوص Markdown/89 رابطًا محليًا/الأسوار وفحص الحالة والانتقال وgit diff. لا يثبت ذلك الصحة الطبية أو ملاءمة الصورة أو تنفيذ الفحص."
    },
    {
      "id": "RAD-035",
      "title": "ملاءمة صورة Shoulder Y ومطابقة الأصل قبل اعتماده",
      "status": "deferred",
      "priority": "high",
      "description": "أصل Y فُحص ولم يُعتمد ولم يُستورد؛ لا عمل حتى يقدّم المالك صورة نظيفة مرخّصة.",
      "defer_reason": "قرار المالك 2026-10-15: تأجيل Shoulder Y لأن الصورة غير معتمدة؛ إيقاف رفع الصور والفحوص الجديدة والتركيز على بقية جوانب المشروع.",
      "source_ref": "DECISIONS.md S-SHOULDER-Y-2/Y-3/O92؛ S-SHOULDER-Y-REF-2؛ مرجع Shoulder Y §8.8؛ رابط Commons المرسل من المالك"
    },
    {
      "id": "RAD-036",
      "title": "Shoulder Y — بوابتا الصورة والنموذج (توقف قبل الكود)",
      "status": "deferred",
      "priority": "medium",
      "description": "Shoulder Y مؤجل؛ لم يُبنَ شيء. تُعاد البوابتان فقط إذا توفرت صورة نظيفة مرخّصة وطلب المالك استئنافه.",
      "defer_reason": "قرار المالك 2026-10-15: تأجيل Shoulder Y لأن الصورة غير معتمدة؛ إيقاف رفع الصور والفحوص الجديدة والتركيز على بقية جوانب المشروع.",
      "source_ref": "docs/RAD-LAB_Medical_Reference_Shoulder_Y.md §12؛ DECISIONS.md S-SHOULDER-Y-1…5، O92/O94/O97؛ docs/archive/sessions/session-shoulder-y-gates-2026-10-15.md"
    },
    {
      "id": "RAD-037",
      "title": "مراجعة جودة تنفيذ فحص الحوض (pelvis-ap-supine)",
      "status": "review",
      "priority": "high",
      "description": "مخطط الحوض وR ومنطقة منع العلامة منفذة (O99 محلولة). لم تتضمن إفادة #85 تحققًا محددًا لمراجعة الحوض O98؛ ينتظر إفادة المالك بهذا النطاق. ظهور قصور يبقي review حتى المعالجة، ولا يغلق RAD-029/O84/O85/O5.",
      "source_ref": "DECISIONS.md O98؛ docs/archive/sessions/session-pelvis-ap-implementation.md؛ قول المالك في المحادثة 2026-10-15",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-038",
      "title": "شروط NIH لصورة Chest AP (A-008) قبل الإصدار",
      "status": "deferred",
      "priority": "high",
      "description": "A-008 (NIH ChestX-ray14) تبقى owner-verified مؤقتًا بقرار المالك 2026-10-15؛ لم تُقرأ الشروط ولا توجد لقطة لها، فالحالة التجارية غير مثبتة بدليل. قبل الإصدار: قراءة شروط NIH عند المصدر (متصفح) أو استبدال الصورة. يُغلق بقراءة شروط NIH موثقة (إحالة/لقطة) أو باستبدال A-008.",
      "defer_reason": "قرار المالك 2026-10-15: نعود إليه لاحقًا؛ الأولوية للبنود الأخرى.",
      "source_ref": "DECISIONS.md O101، O16؛ docs/ASSET_LICENCE_AUDIT_2026-10-15.md §6؛ docs/ASSET_PROVENANCE_AND_LICENSES.md A-008"
    },
    {
      "id": "RAD-039",
      "title": "خطة المنصة التجريبية ووثيقة القرار (حسابات، محاولات، ملاحظات)",
      "status": "done",
      "priority": "high",
      "description": "خطة المنصة التجريبية ووثيقة القرار: docs/PILOT_PLATFORM_PLAN.md (حسابات، محاولات، ملاحظات، شريحة تجريبية ومعايير قبول). نُفِّذت في RAD-041…044؛ الأسئلة المفتوحة في O103.",
      "source_ref": "docs/PILOT_PLATFORM_PLAN.md؛ DECISIONS S-PILOT-1/2",
      "completion_evidence": "الخطة مدموجة (PR #49) وقبلها المالك في الجوهر (DECISIONS S-PILOT-4) ونُفِّذت في RAD-041…044 المدموجة. توثيق فقط؛ لا يثبت صحة افتراضاتها الخارجية."
    },
    {
      "id": "RAD-040",
      "title": "جلسة التحقق من مزوّد الهوية وقاعدة البيانات للإطلاق التجريبي",
      "status": "done",
      "priority": "high",
      "description": "اكتملت مقارنة مزوّدي الهوية وقاعدة البيانات وتوصية Supabase Free المشروطة من الوثائق الرسمية، ودُمجت في #49. البنود الخارجية الخاصة بـSMTP وCloudflare والأسئلة Q5–Q7 منفصلة في O103 وRAD-041؛ لا يثبت إنجاز القراءة صحة التوصية عمليًا.",
      "completion_evidence": "PR #49 مدموج في main بيد المالك (commit a66bf5a)؛ docs/PILOT_PROVIDER_COMPARISON_2026-10-15.md من الوثائق الرسمية؛ قرارات S-PILOT-3 وS-PILOT-4. لا يثبت صحة التوصية عمليًا: لا حساب ولا مشروع عند المزوّد أُنشئ؛ المتبقي (SMTP، وثائق Cloudflare، Q5–Q7) في O103 وRAD-041.",
      "source_ref": "docs/PILOT_PROVIDER_COMPARISON_2026-10-15.md؛ DECISIONS S-PILOT-3؛ docs/PILOT_PLATFORM_PLAN.md §4, §9"
    },
    {
      "id": "RAD-041",
      "title": "الحسابات والدعوات والدخول مع RLS واختبارات العزل",
      "status": "review",
      "priority": "high",
      "description": "الحسابات مدموجة (#50/#52/#53)، والدخول وحالات الحساب موثقة في #85. النسخة/الاستعادة مثبتة بحدود S-PILOT-38؛ لا تعاد كشرط ناقص. جدول العزل الحي على إنتاج setup§9 غير مثبت كاملًا؛ فحوص مشروع الاستعادة لا تعادل إنتاجًا. ينتظر المالك إتمام مطابقة الجدول أو تحديد استثناءاته.",
      "source_ref": "docs/archive/sessions/session-rad-041b-account-ui-2026-10-15.md؛ docs/PILOT_SUPABASE_SETUP.md §8/§9؛ DECISIONS.md S-PILOT-6/38؛ PR #85",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-042",
      "title": "حفظ المحاولات والأحداث (Practice محفوظ)",
      "status": "review",
      "priority": "medium",
      "description": "الحفظ مدموج (#55)، وظهور محاولات جديدة للمالك مثبت بإفادة/صورة S-PILOT-39.4 (#72). لا حاجة لإعادة إثبات حفظ المحاولة نفسه. تبقى مراجعة نطاق الأحداث والحالات غير الناجحة غير الموثقة حيًا؛ ينتظر المالك اعتماد إغلاق هذا النطاق دون تعميم الدليل على كل جهاز/حساب.",
      "source_ref": "PR #55/#72؛ DECISIONS.md S-PILOT-28، S-PILOT-39.4؛ docs/PILOT_PLATFORM_PLAN.md §5/§8",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-043",
      "title": "الموافقة وزر الملاحظات ورابط الاستبيان",
      "status": "review",
      "priority": "medium",
      "description": "الموافقة والملاحظات مدموجتان (#56/#57)؛ الشروط EN/AR والموافقة المتجددة مثبتة في S-PILOT-39.1…39.3 (#71/#72). المتبقي فحص إرسال/حفظ الملاحظة حيًا. غياب رابط الاستبيان أفاد به المالك في S-PILOT-37؛ الاستبيان الداخلي مؤجل، ولا طلب لإعداده الآن.",
      "source_ref": "PR #56/#57/#71/#72؛ DECISIONS.md S-PILOT-37، S-PILOT-39.1…39.3؛ docs/PILOT_PLATFORM_PLAN.md §6/§8",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-044",
      "title": "لوحة المالك وتصدير CSV",
      "status": "review",
      "priority": "medium",
      "description": "اللوحة والمرشحات وCSV المحاولات موثقة حيًا (S-PILOT-25/28). S-PILOT-32.3 حسم إبقاء ملفي المحاولات والملاحظات كاملين للمالك؛ لا تعاد خيارات الحجب. المتبقي تحقق ملف الملاحظات وتقرير الانقطاع/الأجزاء المتعددة على الجهاز؛ QA المحاكى لا يثبت حفظ التنزيل.",
      "source_ref": "PR #54/#58/#63/#64؛ DECISIONS.md S-PILOT-25/28، S-PILOT-32.3؛ docs/PILOT_PLATFORM_PLAN.md §8",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-045",
      "title": "صفحة المصادر والاعتمادات ثنائية اللغة",
      "status": "done",
      "priority": "medium",
      "description": "صفحة المصادر والاعتمادات EN/AR وربط التذييل مدموجة في #73 ضمن النطاق المعتمد. اعتمادات النتائج الحالية محفوظة مؤقتًا باختيار المالك؛ شروط NIH/O101/RAD-038 غير محسومة.",
      "source_ref": "PR #73؛ DECISIONS S-CREDITS-1…4؛ docs/archive/sessions/session-rad-045-credits-2026-10-16.md",
      "completion_evidence": "#73 مدموج في main عندd2b4701 (Git/API، 2026-10-16)؛ شجرة الدمج مطابقة للنسخة المفحوصة9f78ab2. QA التنفيذ: check (1891 اختبارًا/90 ملفًا)، build/build:pages، EN/AR×390/1440:878 تحققًا و76axe بلا مخالفات/overflow/طلبات خارجية. اعتمادات النتائج باقية باختيار المالك (S-CREDITS-3)."
    },
    {
      "id": "RAD-046",
      "title": "صفحة «نسيت كلمة المرور» لحسابات التجربة",
      "status": "done",
      "priority": "medium",
      "description": "صفحة «نسيت كلمة المرور» لحسابات التجربة: رابط بالبريد ثم كلمة جديدة، بلا migration (S-PILOT-29).",
      "source_ref": "DECISIONS S-PILOT-11، S-STD-3",
      "completion_evidence": "PR #67 مدموج؛ QA محلي ومحاكى (check، build، smoke، audit متصفح EN/AR). تحقق حي 2026-10-16 بيد المالك بحساب ثانٍ: وصل البريد، تغيّرت الكلمة، نجح الدخول بها ثم الخروج (تقرير نصي بلا لقطات؛ DECISIONS S-PILOT-30)."
    },
    {
      "id": "RAD-047",
      "title": "قابلية التوسع: تدقيق (047a) ثم تنفيذ (047b)",
      "status": "review",
      "priority": "high",
      "description": "التدقيق و047b.1/.2/.3 مدموجة ومطبقة؛ أُغلق نطاق RAD-049 بدليله. S-PILOT-38 يثبت نسخة واستعادة محددتين، لا تشغيل الحزمة المجمعة من الصفر أو نسخة تتحدث تلقائيًا. تبقى بقية O105 وحدود المزوّد وسياسات الاحتفاظ/الحذف و.4 غير المعتمدة؛ لا تنفيذ ضمن الجرد.",
      "source_ref": "PR #61/#62/#63/#64؛ DECISIONS S-PILOT-38؛ docs/PILOT_SUPABASE_SETUP.md §8",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-048",
      "title": "تنظيم ملف الحالة وHANDOFF (صيغة 1.1)",
      "status": "done",
      "priority": "medium",
      "description": "صيغة الحالة1.1 وسقوف الوصف والدليل وHANDOFF وجهة الانتظار وتنبيه التعارضات منفذة ومدموجة؛ حفظ التاريخ والـIDs ضمن نطاق S-STD-4. صيانة المعنى اللاحقة لا تعني أن أصل مهمة التنظيم ينتظر الدمج.",
      "source_ref": "PR #60/#86؛ DECISIONS.md S-STD-4؛ docs/status-format.md",
      "completion_evidence": "PR #60 مدموج عند1b0405f؛ GitHub API وGit يطابقان S-STD-4 والملفات. استمرار العقد مثبت بفحوص الحالة الحالية و40 اختبارًا قائمًا؛ تحسينات #82/#86 مدموجة. توثيق/فحص تنظيمي، لا اعتماد طبي."
    },
    {
      "id": "RAD-049",
      "title": "RAD-047b — أساس التوسع والصفحات وعقود السجلات (.1/.2/.3)",
      "status": "done",
      "priority": "high",
      "description": "نطاق047b.1/.2/.3 اكتمل بالدمج والتطبيق الموثق والجرد والمرشحات والمحاولة/التصدير بحدود S-PILOT-25/27/28. النسخة والاستعادة اللاحقتان موثقتان في S-PILOT-38؛ لا نسخة مثبتة قبل التطبيق. .4 والسياسات وبقية التحقق ضمن RAD-047 ولا يغلقها هذا الإنجاز.",
      "source_ref": "PR #62/#63/#64؛ DECISIONS.md S-PILOT-25/27/28/38؛ docs/PILOT_SUPABASE_SETUP.md §11؛ docs/archive/planning/ROADMAP-until-2026-10-16.md",
      "completion_evidence": "PR #62/#63/#64 مدموجة، #64 عندe5f4078 مؤكد بـAPI/Git. تقرير .3 المؤرشف: check1863/88 والبناءان وQA محاكى ناجحة؛ S-PILOT-27/28 يوثقان تطبيق6–8 ومحاولة/CSV، وS-PILOT-38 نسخة/استعادة لاحقة. نطاق .4 غير مشمول."
    },
    {
      "id": "RAD-050",
      "title": "مراجعة اتساق الشروط والخصوصية EN/AR",
      "status": "done",
      "priority": "high",
      "description": "اكتملت مراجعة النص وتطبيقه EN/AR ورفع الموافقة مرة واحدة في #71 المدموج، مع فحوص المحاكاة والتحقق الحي بأدلة المالك من النص وتجديد الموافقة وظهور المحاولات الجديدة في لوحة المالك. النسخة والاستعادة موثقتان؛ لا سياسة أو ميزة إضافية.",
      "source_ref": "PR #71؛ DECISIONS S-PILOT-37/38/39.1…39.4؛ docs/archive/sessions/session-rad-050-terms-implementation-2026-10-16.md",
      "completion_evidence": "#71 مدموج عند6021321؛ check (1872) وbuild/build:pages ناجحة؛ محاكاة EN/AR×390/1440:158 تحققًا و44 حالةaxe. أدلة المالك: نص EN/AR كامل، طلب موافقة قُبل وبقي مختفيًا بعدrefresh، ولقطة المحاولات الحديثة بلوحة الموقع الرئيسي (S-PILOT-39.1…39.4)."
    },
    {
      "id": "RAD-051",
      "title": "جرد الواجهة (قراءة فقط) قبل الدخول والكتالوج والمظهر",
      "status": "done",
      "priority": "medium",
      "description": "اكتمل جرد الواجهة من الكود وتقريره وخطة الدخول والكتالوج والمظهر. قيود عدم تصوير هاتف أو قياس تباين ضمن جلسة الجرد الأصلية محفوظة؛ التنفيذ والتحقق اللاحقان في RAD-052/053/054، والتحسين الإضافي في RAD-057.",
      "source_ref": "PR #75/#85؛ docs/archive/sessions/session-ui-audit-2026-10-16.md؛ docs/archive/sessions/session-rad-054-phone-fixes-2026-10-16.md",
      "completion_evidence": "PR #75 مدموج عند1f55d25 مؤكد بـAPI/Git، وتقرير session-ui-audit-2026-10-16 محفوظ. تنفيذ المتابعات #76–#80 وإفادة الهاتف #85 مسجلان في مهامها؛ إنجاز الجرد لا يعني قياسًا جديدًا للتباين أو اعتمادًا طبيًا."
    },
    {
      "id": "RAD-052",
      "title": "حارس الدخول: لا وصول لأي صفحة قبل تسجيل الدخول",
      "status": "done",
      "priority": "high",
      "description": "حارس الدخول مدموج في #76؛ أقرّ المالك بعد فحص الهاتف عمل الدخول والعودة لنفس الرابط والخروج وحالتَي pending وsuspended. دليل الإغلاق إفادة المالك؛ لا تحقق مستقل من النشر.",
      "source_ref": "PR #76؛ docs/archive/sessions/session-rad-052-session-gate-2026-10-16.md؛ تحقق الدمج في تقرير RAD-053",
      "completion_evidence": "إفادة المالك 2026-10-17 بعد فحص الهاتف على الموقع: الدخول والعودة لنفس الرابط والخروج وحالتا pending وsuspended تعمل «100%»؛ الكود في #76. إفادة المالك، لا إثبات مستقل ولا دليل نشر."
    },
    {
      "id": "RAD-053",
      "title": "الكتالوج حسب المنطقة التشريحية وقسم CT/MRI/US منفصل",
      "status": "done",
      "priority": "medium",
      "description": "الكتالوج مدموج في #77؛ أقرّ المالك بعد فحص الهاتف عمل التصنيفات حسب المنطقة وقسم «قريبًا» بالعربية والإنجليزية. دليل الإغلاق إفادة المالك؛ لا تحقق مستقل من النشر.",
      "source_ref": "PR #77؛ docs/archive/sessions/session-rad-053-catalogue-2026-10-16.md؛ docs/archive/sessions/session-ui-audit-2026-10-16.md §4؛ S-ASSESS-1",
      "completion_evidence": "إفادة المالك 2026-10-17 بعد فحص الهاتف: الكتالوج والتصنيفات حسب المنطقة وقسم «قريبًا» تعمل بالعربية والإنجليزية؛ الكود في #77. إفادة المالك، لا إثبات مستقل ولا دليل نشر."
    },
    {
      "id": "RAD-054",
      "title": "مراجعة المظهر: الخطوط والألوان والتحذيرات الزائدة",
      "status": "done",
      "priority": "medium",
      "description": "واجهة RAD-054 وإصلاحات الدخول والرسوم وباك مدموجة في #79/#80؛ أقرّ المالك بعد فحص الهاتف عمل الواجهة والفحوص بالعربية والإنجليزية. التحسين البصري الإضافي مؤجل في RAD-057؛ لا اعتماد طبي من هذا الإغلاق.",
      "source_ref": "PR #80 (merged f90b3c9)؛ DECISIONS S-UI-054-1…13؛ docs/archive/sessions/session-rad-054-phone-fixes-2026-10-16.md",
      "completion_evidence": "إفادة المالك 2026-10-17 بعد فحص الهاتف: الواجهة والفحوصات تعمل بالعربية والإنجليزية؛ الكود في #79/#80. تحسين الرسوم والألوان خارج هذا الإغلاق ومسجَّل في RAD-057. إفادة المالك، لا نشر مثبت."
    },
    {
      "id": "RAD-055",
      "title": "قرارات Assess (توثيق فقط)",
      "status": "done",
      "priority": "high",
      "description": "توثيق قرارات Assess وخطة المراحل مدموج في #90 بعد مراجعة المالك؛ قرارات المنتج محفوظة مع فصل المقترحات التقنية وبوابات الموافقة والمصادر. إنجاز التوثيق لا يثبت جاهزية تشغيل الامتحان.",
      "source_ref": "docs/DECISIONS.md#assess-owner-2026-10-19؛ docs/ASSESS_IMPLEMENTATION_PLAN.md؛ docs/ASSESS_DOCS_REPORT_2026-10-19.md؛ محادثة المالك 2026-10-19",
      "completion_evidence": "PR #90 مدموج بتأكيد GitHub عند8cd416c؛ أقرّ المالك ظهور قسم B وعمله على الهاتف ثم دمج الدفعة وأذن بـC. مراجع القرارات والخطة وتقارير A/B محفوظة؛ لا اعتماد شامل للـBlueprint أو إغلاق O106/O108."
    },
    {
      "id": "RAD-056",
      "title": "نموذج بيانات الاختبارات وعزل مفاتيح الإجابة",
      "status": "review",
      "priority": "high",
      "description": "نُفذت تجربة Assess حية هندسية بمحتوى اصطناعي: حماية ونطاق وصورتان وهويات مثبتة بإفادات المالك؛ visible نتيجته 5/10 وhidden محجوب، والبوابة وLOGIN والإسنادان أُغلقت. تبقى المراجعات المستقلة والمراقبة والإلغاء والنسخ والدمج؛ لا قبول سريري.",
      "source_ref": "docs/DECISIONS.md#assess-owner-2026-10-19؛ docs/ASSESS_FOUNDATION.md؛ docs/ASSESS_A_REPORT_2026-10-19.md؛ docs/ASSESS_B_REPORT_2026-10-19.md؛ إذن الاستئناف بعد تسليم A بتاريخ2026-10-19؛ docs/PILOT_SUPABASE_SETUP.md#assess-b-setup؛ مخرجات المالك 2026-10-20؛ إذن C بعد دمج #90؛ docs/ASSESS_C_REPORT_2026-10-20.md؛ إذن إصلاح حارس النشر 2026-10-20؛ docs/DEPLOYMENT.md؛ إذن D الصريح بعد #91؛ docs/ASSESS_D_REPORT_2026-10-20.md؛ تحقق GitHub لنتائج #92 بتاريخ2026-10-20 في تقرير D؛ إذن التحضير المحلي 2026-10-20؛ docs/ASSESS_STAGING_PLAN.md؛ رابط staging من المالك 2026-10-20 موثق في خطة التجهيز؛ اختيار الأصلية من المالك 2026-10-20 ومسار C/D في خطة التجهيز؛ نتيجة فحص البداية وإفادة غياب نسخة حديثة من المالك 2026-10-20 موثقتان في خطة التجهيز؛ توجيه المالك للمتابعة المباشرة دون نسخة حديثة 2026-10-20 وحزمة التطبيق في خطة التجهيز؛ إفادة المالك Success. No rows returned لحزمة C/D بتاريخ2026-10-20 في خطة التجهيز؛ نتيجتا catalogue وD من المالك 2026-10-20 وأداة خدمة D المغلقة في دليل الإعداد وخطة التجهيز؛ زوج PASS لخدمة D المغلقة وإثبات المخطط المحسوب 2026-10-20 في خطة التجهيز؛ تحقق GitHub لنجاح Deploy وفشل مهلة CI وتشخيص الأداء 2026-10-20 في خطة التجهيز؛ إذن E المحلي الصريح 2026-10-20؛ docs/ASSESS_E_REPORT_2026-10-20.md؛ تحقق GitHub لدمج #92 ونجاح CI وDeploy على main المدموج في تقرير E؛ إذن SQL E ثم اختيار المالك الصريح المتابعة على الأصلية دون نسخة حديثة 2026-10-20، وتحقق CI/حارس النشر، وحزمة E في docs/ASSESS_E_REPORT_2026-10-20.md#متابعة-تطبيق-sql-e-على-الأصلية؛ نتيجة المالك assess-e-preinstall/1 مع cd_source_bodies_match=false بتاريخ2026-10-20 وتشخيص القراءة فقط في docs/ASSESS_E_REPORT_2026-10-20.md#توقف-عند-اختلاف-بصمات-cd؛ جدول المالك assess-e-source-diff/1 بتاريخ2026-10-20 والمقارنة المستقلة للبصمات والأطوال ومراجعة LF/CRLF في docs/ASSESS_E_REPORT_2026-10-20.md#reviewed-line-endings؛ نتائج المالك preinstall المراجع وجرد B/C/D/E وفحص E والبوابة المغلقة بتاريخ2026-10-20، وأداة خدمة E الجديدة في docs/ASSESS_E_REPORT_2026-10-20.md#e-sql-owner-results؛ زوج خدمة E المغلقة PASS للمالك والمشارك 2026-10-20 وإثبات المخطط المحسوب في docs/ASSESS_E_REPORT_2026-10-20.md#e-closed-pair-attestation؛ إذن F المحلي الصريح 2026-10-20؛ docs/ASSESS_F_REPORT_2026-10-20.md؛ توجيه المتابعة على الأصلية الآن 2026-10-20 بعد سؤال النسخة، وحزمة SQL F في docs/ASSESS_F_REPORT_2026-10-20.md#f-original-sql؛ نتيجة المالك assess-f-preinstall/1 بتاريخ2026-10-20 في docs/ASSESS_F_REPORT_2026-10-20.md#f-preinstall-owner-result؛ صف المالك assess-f-install/1 النهائي بعد COMMIT بتاريخ2026-10-20 في docs/ASSESS_F_REPORT_2026-10-20.md#f-install-owner-result؛ جرد وفحص SQL F المغلق من المالك 2026-10-20 وأداة خدمة F الجديدة في docs/ASSESS_F_REPORT_2026-10-20.md#f-sql-owner-results؛ زوج PASS لخدمة F المغلقة وإثبات المخطط المحسوب 2026-10-20 في docs/ASSESS_F_REPORT_2026-10-20.md#f-closed-pair-attestation؛ إذن حزمة التشغيل المحلية المستقلة 2026-10-20؛ docs/ASSESS_LOCAL_OPERATIONS_REPORT_2026-10-20.md؛ docs/ASSESS_LOCAL_OPERATIONS.md؛ إفادة الهاتف في رأس مسودة #95 غير المدموجة b48854d كما يوثق تقرير الحزمة؛ متابعة الإيقاف الفعلي ونجاح نشر رأس #96 البرمجي في docs/ASSESS_LOCAL_OPERATIONS_REPORT_2026-10-20.md#process-stop-followup؛ اعتماد المالك الخيارات الخمسة 2026-10-20 في docs/DECISIONS.md#assess-retention-owner-2026-10-20؛ docs/ASSESS_RETENTION_POLICY.md؛ docs/ASSESS_LOCAL_OPERATIONS_REPORT_2026-10-20.md#o106-owner-policy؛ إذن إنفاذ S-ASSESS-15 المحلي 2026-10-20؛ docs/ASSESS_RETENTION_REPORT_2026-10-20.md؛ دمج #94 ونجاح CI وDeploy Pages على main المدموج8366cac بتاريخ2026-10-20 في docs/ASSESS_F_REPORT_2026-10-20.md#f-merged-main-verified؛ إفادة المالك بنجاح الهاتف 2026-10-20 في docs/ASSESS_F_REPORT_2026-10-20.md#f-phone-owner-confirmation؛ متابعة المالك والتوقف عند SQL اليدوي 2026-10-20؛ docs/ASSESS_RETENTION_PREFLIGHT_REPORT_2026-10-20.md؛ صف المالك assess-retention-preinstall/1 وإفادة عدم تحقق نسخة حديثة 2026-10-20 في docs/ASSESS_RETENTION_PREFLIGHT_REPORT_2026-10-20.md#retention-preinstall-owner-result؛ توجيه المالك الأصلية دون نسخة الآن ونسخة شاملة بعد العمل 2026-10-20 في docs/DECISIONS.md#assess-retention-original-no-backup-2026-10-20؛ docs/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md؛ صف المالك assess-retention-install/1 النهائي بعد COMMIT وتجهيز أداة الخدمة المغلقة الجديدة 2026-10-20 في docs/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-install-owner-result؛ زوج المالك والمشارك assess-retention-closed-service/1 المتطابق بتاريخ2026-10-21 عمّان في docs/ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-closed-pair-owner-result؛ مراجعة الحزمة وقائمة البوابات وتحقق GitHub للرؤوس المقصودة في docs/ASSESS_RETENTION_REVIEW_REPORT_2026-10-20.md؛ معالجة حظر النشر وتجهيز إثبات retention بتاريخ2026-10-21 عمّان في docs/ASSESS_RETENTION_REVIEW_REPORT_2026-10-20.md#retention-deploy-block-followup؛ إذن ربط runtime محلي دون تشغيل حي 2026-10-20؛ docs/ASSESS_RUNTIME_LOCAL.md؛ docs/ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md؛ اختيار المالك Google Cloud Run بتاريخ2026-10-21 عمّان في docs/DECISIONS.md#assess-cloud-run-owner-2026-10-21؛ docs/ASSESS_CLOUD_RUN_PLAN_2026-10-21.md؛ إذن بدء حزمة الحاوية المحلية 2026-10-21 عمّان؛ docs/ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md؛ docs/ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md؛ docs/ASSESS_EXTERNAL_BINDING_REPORT_2026-10-21.md؛ إذن المالك إصلاح عائق session pooler المحلي وتأكيد المتابعة 2026-10-21؛ docs/ASSESS_SESSION_POOLER_REPORT_2026-10-21.md؛ إفادة المالك PASS TLS1.2 مع hostname/root CA المطابقة من Windows بلا login/SQL وإذن تجهيز حزمة login المحلية 2026-10-21؛ docs/ASSESS_WORKER_LOGIN.md؛ docs/ASSESS_WORKER_LOGIN_REPORT_2026-10-21.md؛ صف المالك PostgreSQL17.11 وPUBLIC TEMP=true وCREATE0 وإذن تمام طبق لمرحلة NOLOGIN فقط 2026-10-21؛ docs/ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md؛ صف المالك النهائي للتجهيز المغلق 2026-10-21 في docs/ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md#worker-login-stage-owner-result؛ طلب المالك تمام ابدا بعد صف التجهيز المغلق 2026-10-21؛ docs/ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md؛ docs/ASSESS_WORKER_ACTIVATION_REPORT_2026-10-21.md؛ إفادات Windows psql18.6 وCA المطابقة وفشل المصادقة/timeout وTCP المتاح وعدم تذكر كلمة الإدارة وطلب فحص الأثر 2026-10-21؛ docs/ASSESS_POSTGRES_PASSWORD_IMPACT_REPORT_2026-10-21.md؛ إفادات GitHub/Cloudflare/Docker وreset الإدارة وفشل SCRAM وطلب الربط من Google وشواهد Cloud Shell لإنشاء الهوية والسر/IAM وregistry بتاريخ2026-10-21؛ docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md؛ إفادة المالك PASS865ملفًا وبناء Cloud Shell Node24.21 وDocker push ببصمة index ونجاح Job create بحارس=0 بلا mount/execute بتاريخ2026-10-21 في docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md؛ metadata المهمة/versions=[] وجرد TEMP/template1/statistics grants وإفادة إدارة Cloud Shell وصف postcondition العامل بعد password وأداة إدخال أول إصدار 2026-10-21 في docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md؛ شواهد النسخة1/mount وجرد الدورين وإذن ساعة TEMP ونجاح اتصال العامل من Cloud Shell وإغلاقه، وأداة Cloud Run مستقلة 2026-10-22 عمّان في docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#connection-owner-followup؛ docs/ASSESS_CONNECTION_PROBE.md؛ Cloud Build وIAM المحدد وJob التشخيص وتنفيذ assess-connection-check-mstxd وlog PASS وإغلاق login/expiry ضمن النافذة الأصلية 2026-10-22 عمّان في docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-owner-pass؛ صف المالك النهائي login_disabled/expired=true وbackend_sessions0 وgate_closed=true بعد فحص Cloud Run 2026-10-22 عمّان في docs/ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-closed-final؛ طلب المالك مراجعة الدورة كاملة وتحديد تجربة مضبوطة بعد نجاح الربط، ومراجعة source وفحوص48حالة محلية وعوائق التوصيل/العزل وخطة الاختبار 2026-10-22 عمّان في docs/ASSESS_CONTROLLED_TRIAL_READINESS_2026-10-22.md؛ طلب المالك تحضير جرد القراءة والأدوات دون تشغيل حي واختبار الحزمة محليًا 2026-10-22 عمّان في docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md؛ صف counts من المالك 2026-10-22 عمّان في docs/ASSESS_TRIAL_PREPARATION_2026-10-22.md#trial-inventory-owner-result؛ إذن بدء تحضير حماية التجربة محليًا وشاهد التنافس والحدود 2026-10-22 عمّان في docs/ASSESS_TRIAL_ISOLATION_2026-10-22.md؛ docs/ASSESS_TRIAL_BATCH_ONE_2026-10-22.md؛ docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md؛ docs/ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md؛ فشل preinstall المرسل من المالك وتشخيصه في docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-preinstall-catalog-mismatch؛ نتيجة catalogue من المالك والتحقق المحلي في docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-catalog-owner-result؛ نتيجة الدالة الواحدة والاشتقاق الكامل وحزمة التوافق في docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-catalog-reviewed-profile؛ صف PASS للـpreinstall المراجعة من المالك ومراجعة خطوة التركيب الخامل في docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-reviewed-preinstall-owner-pass؛ إذن المالك الصريح لتطبيق install وصف PASS بعده في docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-reviewed-install-owner-pass؛ إفادة المالك بتوفر مالك وطالبين في docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-three-accounts-owner-report؛ صورة واجهة المالك ومطابقتها للمصدر القديم ونجاح نشر الفرع في docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-main-ui-owner-screenshot؛ سطر v2 من المالك وتجهيز artifact محلية ذات نطاق مقترح ثابت في docs/ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-v2-visible-bound-local-artifact",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-057",
      "title": "تحسين الواجهة بصريًا: الرسوم والألوان والخطوط",
      "status": "deferred",
      "priority": "low",
      "description": "المالك (2026-10-17): الواجهة تعمل جيدًا وتحتاج تحسينًا بصريًا لكنه ليس أولوية. توقيته بعد RAD-062 كي يشمل شاشاته مرة واحدة (البند 8 من قرار ترتيب التنظيف)، ويبقى مؤجلًا حتى قرار المالك؛ لا يمس المشاهد وhashes. التفاصيل في مراجعة RAD-054.",
      "source_ref": "محادثة المالك 2026-10-17؛ DECISIONS S-UI-054-1…13؛ docs/DECISIONS.md#cleanup-sequencing-owner-2026-10-22",
      "defer_reason": "قرار المالك: ليست أولوية الآن؛ تُستأنف بعد RAD-062 وقبل RAD-063 وفق البند 8 من قرار ترتيب التنظيف."
    },
    {
      "id": "RAD-058",
      "title": "التدريب: ملخص شخصي ومتابعة المتدربين والاسم في الحساب",
      "status": "done",
      "priority": "high",
      "description": "اكتملت محاولاتي والمتابعة والاسم وهوية المقارنة المستقرة؛ دُمجت ونُشرت على main وتحقق المالك من الإنتاج. التصفير الاختياري مؤجل دون حذف، ويحتاج إجراءً واعتمادًا مستقلين عند استئنافه.",
      "source_ref": "DECISIONS.md S-MY-ATTEMPTS-1؛ PR #88؛ src/features/pilot/profile-read.test.ts؛ src/features/pilot/schema-gate.test.ts؛ scripts/qa/pilot-schema-audit.mjs؛ supabase/checks/training-ready.sql؛ بلاغ المالك في المحادثة:42703 أُعيد إنتاجه محليًا دون تأكيد الرمز الحي. QA:check1947/99، docs:test23، credits19، build وبناء static؛ متصفح PostgreSQL83/24axe والتدقيق الحالي780/56axe وتعطيل8/4axe؛ المجموع871 تحقق و84axe دون مخالفات أو تمرير أفقي، ومراجعة لقطات. فحوص الوثائق والحالة وdiff ناجحة؛ لا تغيير لتوقعات قديمة في هذا الإصلاح. إثبات النشر يدوي مرتبط بالمشروع وSQL وليس اتصالًا حيًا من CI. المحادثة2026-10-18: طُوبق مشروع rad-lab-pilot/main مع أصل Supabase في سجل النشر؛ فحص المالك الحي رفض غياب display_name بـ55000. بعد إذن إنتاج صريح نفّذ المالك الترحيل داخل معاملة مع حارس وفحص ما قبل الحفظ وأرسل TRAINING_UPDATE_APPLIED. هذا إفادة SQL حيّة من المالك، لا تحقق Auth/PostgREST أو عزل حي من الوكيل؛ متغير الإثبات لم يتغير. MY-ATTEMPTS-2: بلاغ المالك بأن الكل يعمل عدا الرسم إفادة استخدام فقط. إصلاح هوية نتيجة evaluate دون تغيير درجات أو JSON أو بصمة التعريف؛ src/features/evaluation/version.ts؛ src/features/pilot/saved-training.test.ts يمر عبر الكاتب الحقيقي وSupabase JS إلى PostgreSQL/RLS ثم RPC والقارئ والرسم. اختلاف التقييم والحالة والتعريف والكاتب والمجهول محفوظ بلا إعادة تقييم؛ رفض اختيار مستخدم آخر محلي فقط. قبل الاستثناء فشل اختبار واحد بسبب توقع engine_version=unknown القديم في src/features/pilot/record-contracts.test.ts؛ أكدته تعليقات فشل GitHub أيضًا. بعد عرض التغيير وافق المالك «تمام عدل» (2026-10-18) على استيراد PRACTICE_EVALUATION_VERSION وتوقعه وحدهما؛ نُفّذ الاستثناء دون تغيير درجات أو CSV أو تاريخ مجهول أو بصمة تعريف. npm run check كامل ناجح: typecheck وlint و1949 اختبارًا في100 ملف؛ credits19 بعد توثيق القرار ناجحة. لم تُكرر فحوص البناء أو المتصفح الناجحة لأن الدفعة اختبار وتوثيق فقط. CI الجديد غير متابع؛ Deploy السابق توقف عند Require verified pilot schema قبل البناء والرفع وفق خطوات GitHub؛ قراءة متغير الإثبات رفضت403، والسجل الكامل محجوب، دون تغيير إعداد. حد بصمة النصوص والحذف غير معتمدين بهذه الموافقة. build:pages بإعداد اصطناعي ناجح؛ scripts/qa/my-attempts-audit.mjs:1000 تحقق/68axe EN/AR390/1440 بلا مخالفات أو تمرير أفقي، لوحة مفاتيح ولقطات الرسائل والرسم روجعت؛ docs:test23 وcredits19 ناجحة. docs/PILOT_SUPABASE_SETUP.md#practice-evaluation-version يوضح الصيانة اليدوية وحد بصمة النصوص؛ لا ترحيل أو حذف أو تغيير إثبات نشر. فحص كود العلاقات: feedback.attempt_id يحذف cascade؛ events.payload لا يملك FK للمحاولة، والعميل بلا DELETE؛ لا عدد أو نسخة احتياطية حية ولا اعتماد نطاق حذف. docs:check بلا أخطاء أو تنبيهات مراجعة؛ status:check وdiff ناجحة، وتعارض RAD-024 السابق محفوظ. متابعة التحقق2026-10-18 بإذن «تمام ابدا بالعمل»: GitHub أكد نجاح check للدفعة5c6556a وفشل deploy؛ صورة المالك تظهر PILOT_SCHEMA_VERIFIED فارغًا قبل البناء والرفع. فحص الجاهزية observations_current=true والشبكة enforced لا تسمح بمضيف المشروع، ولا أسرار/متغيرات اتصال/هويات خارجية أو جلسات مهيأة؛ لم يجر طلب Supabase حي أو إعادة SQL أو تغيير إثبات. scripts/pilot/live-service-check.js إجراء قراءة للمالك في Console، مشروع محدد وجلسة موجودة ومفتاح publishable عام وUUID الآخر محليًا فقط؛ Auth والملف وown ثم owner all/selected، وparticipant deny403/42501 وإخفاء ملف ومحاولات الآخر، وpair منقح يربط الحسابين دون معرفاتهما. src/features/pilot/live-service-check.test.ts:13 اختبارًا اصطناعيًا ناجحًا مع typecheck وlint؛ وجهة واحدة وقراءات بحد1 وPOST لدالة القراءة فقط، وفشل آمن للجلسة المنتهية والتسريب والرفض غير الصحيح والمدخلات غير الآمنة، دون طباعة بيانات خاصة. docs/PILOT_SUPABASE_SETUP.md#training-owner-service-check للإجراء وحدوده؛ الهاتف وحده لا يكفي لطريقة Console، وأفاد المالك أنه على الهاتف حاليًا. لا نتائج PASS حية مستلمة ولا إثبات نشر مسجل؛ لا إعادة بناء أو تدقيق متصفح التطبيق لأن الإضافة إجراء تشغيل واختباره وتوثيق فقط. متابعة تشغيل المالك على اللابتوب: أرسل STOP/setup/DISTINCT_EXISTING_ACCOUNT_REQUIRED/status0 عند09:14:54Z و09:20:45Z، وأكد اختلاف المعرفين وصحة الإدخال ظاهريًا؛ لا يُسجل هذا كتجربة Auth/PostgREST أو فشل عزل، فالتحقق توقف قبل الطلبات. فُصلت رسالة الإعداد إلى OTHER_ACCOUNT_UUID_INVALID وOTHER_ACCOUNT_MATCHES_CURRENT_SESSION وOTHER_ACCOUNT_INPUT_CANCELLED، دون طباعة المعرف أو تغيير معناه أو إعادة طلب تلقائية. اختبارات الإجراء16 ناجحة مع typecheck/lint؛ تمييز الأسباب بلا طلب خدمة أو تسريب بيانات. السجل الصحيح للإكمال ما زال PASS من الحسابين مع pair متطابق؛ لم يصل أي PASS حي ولم يتغير متغير الإثبات. دليل الخدمة الحي المستلم2026-10-18 من تشغيل المالك نفسه للملف428ef2c، لا من اتصال الوكيل: owner={\"version\":1,\"project\":\"vlacestfruxooznrcjqc.supabase.co\",\"role\":\"owner\",\"pair\":\"6d954fdcf76b93a794d3db5eff4a864ba71cd6b4988261d789a852823791464d\",\"outcome\":\"PASS\",\"checks\":[\"auth_user\",\"own_profile\",\"own_training\",\"existing_approved_participant\",\"owner_all_training\",\"owner_selected_training\"],\"at\":\"2026-10-18T09:29:25.336Z\"}؛ participant={\"version\":1,\"project\":\"vlacestfruxooznrcjqc.supabase.co\",\"role\":\"participant\",\"pair\":\"6d954fdcf76b93a794d3db5eff4a864ba71cd6b4988261d789a852823791464d\",\"outcome\":\"PASS\",\"checks\":[\"auth_user\",\"own_profile\",\"own_training\",\"participant_other_training_denied\",\"participant_all_training_denied\",\"other_profile_hidden\",\"other_attempts_hidden\"],\"at\":\"2026-10-18T09:31:24.126Z\"}؛ pair متطابق، و403 مرتان متوقعتان ومتحقق مع code42501 داخل الأداة. يثبت Auth وقراءة الملف وown وowner all/selected ووجود المشارك المعتمد ورفض نطاق الآخر/all للمشارك وإخفاء الملف والمحاولات، ضمن الزوج والطلبات المذكورة فقط؛ ليس تحقق جميع السياسات أو الأداء أو كتابة محاولتين بالإصدار الجديد على النسخة المنشورة. لا كلمات مرور أو رموز جلسة أو معرفات مستخدمين مستلمة. جرت مطابقة ملفات SQL/check بالبايت بين998671e وHEAD دون فرق؛ لا إعادة SQL. شغّل الوكيل --print-marker للمشروع المطابق وأنتج pilot-v1:21a9f4e2b5604d83f899bf7fcc45c96d5f22d2d026176489c3ff218ff3bf5e55 بعد قبول دليل SQL السابق ودليل الخدمة الجديد. هذه قيمة مولدة لم تُسجل بعد؛ صلاحية متغيرات GitHub رُفضت سابقًا403، فيسجلها المالك. GitHub API أكد نجاح CI run39115166655 للدفعة428ef2c؛ Deploy run39115166641 فاشل قبل الإثبات. لم يُعد تشغيل النشر بعد، ولم تُفتح معاينة مستضافة من الوكيل. متابعة التسجيل والنشر: بعد عرض القيمة المولدة الصحيحة أفاد المالك «تم الحفظ» في Repository Actions Variable PILOT_SCHEMA_VERIFIED. هذه إفادة تنفيذ من المالك؛ لم يقرأ الوكيل المتغير مباشرة بسبب صلاحية Variables. قُبل POST rerun-failed-jobs للتشغيل39115855993 على22bd6b7 برد201 في2026-10-18T09:37:57Z؛ هذا إثبات بدء الإعادة فقط، لا نجاح الحارس أو البناء أو الرفع. لم يُفتح أو يُشارك رابط معاينة، ولا polling؛ نتيجة التشغيل ومراجعة محاولتين جديدتين والرسم والهاتف ما زالت معلقة. تأكيد النشر: أفاد المالك «نجح»؛ تحقق الوكيل مرة واحدة عبر GitHub API من completed/success للتشغيل39115855993 attempt2 على22bd6b7، job117642075395: Require verified pilot schema وBuild static export وDeploy to Cloudflare Pages كلها success. هذا يثبت قبول المتغير للحارس ونجاح البناء والرفع لهذا التحديث، لا اختبار المحاولات أو الرسم أو الهاتف. لم يُفتح أو يُشارك رابط معاينة من الوكيل؛ ينتقل المالك للنسخة الجديدة من تعليق النشر لاستخدامها في الاختبار. تحقق النسخة المنشورة بإفادة المالك: بعد فتح النسخة الجديدة بحساب المشارك أفاد بتنفيذ محاولتين جديدتين، ثم أرسل لقطة تدريب بالعربية على الحاسوب تظهر8 محاولات محفوظة ورسمًا بنقطتين ونص2 محاولة قابلة للمقارنة. عند فتح قراءة قيم الرسم أكد «نعم تطابقتا» مع نتيجتي المحاولتين؛ لم يرسل رقمي الدرجتين فلا يُنسب له رقم أو تحسن مقداري. بعد طلب تجربة الهاتف لنفس المحاولتين وقراءة القيم وتفاصيل المحاولة والتبديل EN/AR، أفاد «نعم كل اشي تمام». هذا دليل تشغيل وصورة من المالك، لا تشغيل متصفح مستضاف من الوكيل ولا audit/axe حي. لا حذف أو إعادة ختم للماضي؛ تبقى القديمة محفوظة والمقارنة متوافقة. التوثيق النهائي فقط في docs/HANDOFF.md وdocs/project-status.md؛ ثبت أن بقية شجرة العمل مطابقة للتحديث المنشور22bd6b7، فلا إعادة فحوص التطبيق أو الهاتف لمجرد توثيق النتائج. RAD-058 review/owner حتى المراجعة وحسم حد بصمة النصوص؛ لا ready/merge/auto-merge، ولا ترحيل أو حذف جديد. أُكد أيضًا completed/success لـCI run39115855958 على22bd6b7 عند إغلاق دفعة التوثيق؛ لا متابعة دورية لتشغيل ما بعد دفع التوثيق النهائي. MY-ATTEMPTS-3: طلب المالك هوية مقارنة مستقلة تحفظ الأصل وتجهيز تصفير اختياري. بعد شرح القديم والجديد اعتمد الاستثناءين المحددين ثم قال «تمام عدل الحارسين ضمن النطاق فقط»: saved-training.test.ts ينقل فصل البصمة إلى التاريخ بلا هوية ويثبت توافق الجديد مع تغيير النص؛ migration-chain.test.ts يسمح بعمود comparison_version وقيد صيغته المسمى فقط. لا تغيير درجات أو hashes أو CSV. طلب استثناء ثالث محدد في pilot-db/record-contracts.test.ts بعد فشل قائمة الأعمدة/nullable وعدد الدوال؛ لم يعتمد أو ينفذ بعد. docs/PILOT_SUPABASE_SETUP.md#practice-comparison-version و#practice-optional-reset للعقد وإجراء المالك؛ لا تقرير منفصل. اختار المالك جميع محاولات Practice للمعاينة فقط دون إذن حذف. البيئة الجديدة observations_current=true، لا secrets/runtime_variables/outbound_identities مهيأة، ومضيف Supabase غير مدرج؛ network_policy.state=unknown لا يثبت enforcement. لم ينفذ اتصال إداري أو catalogue أو عد حي أو نسخة حية؛ إجراء قراءة repeatable read محدود المخرجات ومهلة10ثوان في supabase/checks/practice-reset-inspect.sql جُرب محليًا دون تغيير بيانات، ولا حذف SQL قبل مراجعة catalogue الحي. النسخة والاستعادة الخاصة ومنع سباق الكتابة/النسخ القديمة تجهيز للمالك فقط. GitHub تحقق مرة في البداية: PR88 open/draft وغير مدموج، CI39117243804 وDeploy39117243835 ناجحان للتحديث السابق؛ لا إعادة للفحوص الحية المستوفاة ولا تشغيل ترحيل التدريب القديم. تنفيذ الدفعة19 ملفًا حتى استثناء الحارس الثالث: definitionVersion الأصلية مطابقة، comparison_version مستقلة nullable دون backfill، رقم محرك التقييم ثابت لعدم تغير معناه. الإسقاط /1 يحتفظ بقواعد snapshot ويستبعد فروع النص والعرض المحددة، ويلتقطه evaluate قبل الانتظار دون تغيير JSON النتيجة. الكاتب ينتظر الهوية ويقرأها من WeakMap النتيجة؛ clone بلا دليل يبقى null/unknown. RPC إضافية training_page_v1_with_comparison تستدعي v1 المحفوظة بصلاحياتها وتثري20 صفًا كحد أقصى. التاريخ بلا هوية يقارن بالبصمة الأصلية ولا يوصل بالجديد؛ الإصدار المستقبلي الصحيح يبقى في السجل ويُستبعد من الرسم حتى يدعمه القارئ. ترحيل20261020000500_practice_comparison.sql لم يُطبق على الإنتاج. فحص comparison-ready.sql منفصل يحفظ عقد training-ready.sql القديم، والحارس يربط الفحصين وسلسلة SQL؛ الإثبات السابق سيحجب النشر الجديد عمدًا حتى إذن تطبيق جديد والتحقق المطلوب. لم يُولد أو يُسجل إثبات جديد، ولم تُفتح معاينة. اختبار الكاتب الحقيقي عُدل بالاستثناء المعتمد، وبقيت توقعات الدرجات/CSV/hashes القديمة دون تغيير؛ موائم SQL يحفظ null كنول SQL بدل نص JSON. مقارنة اصطناعية تحفظ درجتي النتائج نفسها رغم تغيير النص، وتفصل القواعد/الأوزان/العتبات/البوابات/الهندسة/النموذج/المحرك؛ اختبار PostgreSQL إضافي يثبت RLS ورفض تحديث/حذف العميل ورفض النطاق الآخر والهوية غير الصحيحة والقراءة المستقبلية دون تخمين. QA محلي نهائي: build:pages بإعداد اصطناعي ناجح؛ docs:test23؛ التدقيق scripts/qa/my-attempts-audit.mjs نجح1148 تحققًا/76axe EN/AR390/1440 دون مخالفات A/AA أو تمرير أفقي مع لوحة مفاتيح، ومراجعة لقطتي ar390 لتغيير النص وen1440 لتغيير القواعد. الأرقام74/77 داخل التدقيق اصطناعية وليست درجات المالك الحية. البنية المحلية بدأت باعتمادات ناقصة ففشل typecheck؛ استُوفيت بـnpm ci دون تغيير lockfile. تثبيت أداة المتصفح بالتزامن مع البناء سبّب فشل ملف Next؛ أُعيد npm ci وعُزلت Playwright خارج الاعتمادات المقفلة، ونجح البناء بعدها. فشل الفحص الكامل الأول1967/1969 في حارس الأعمدة الثالث وفي عقد readiness القديم؛ حُل الثاني بإضافة probe مستقلة دون تعديل اختبار profile-read. الاختبارات المركزة للحفظ والجاهزية والعزل10، ثم اختبارات الهوية والسلسلة8 ناجحة؛ ليس هذا ادعاء نجاح check الكامل قبل استثناء الحارس المتبقي. docs:check بلا أخطاء أو تنبيهات وstatus:check وdiff ناجحة مع بقاء تعارض RAD-024. لا تعديل محتوى حالة أو محاكي أو احتساب درجات أو ماركر أو مشاهد أو goldens/hashes أو صور. حدود الصيانة الدلالية يدوية، والمقارنة على الصفحة، والعد الشامل له مهلة/لا ادعاء سعة10×. التصفير ليس علاج الرسم؛ إجراء النسخ/الاستعادة جُهز فقط ولم ينفذ حيًا. نتيجة الفحص الكامل النهائي بعد فصل probe الجاهزية: typecheck وlint ناجحان، و1968 من1969 اختبارًا في103 ملفات ناجحة؛ الفشل الوحيد القائمة المغلقة للأعمدة في src/features/pilot-db/record-contracts.test.ts:68 بسبب attempts.comparison_version. الملف الثالث بقي مطابقًا لرأس المسودة دون تعديل؛ يُنتظر الاعتماد المحدد للأعمدة/nullable وعدد الدوال2→3. build:pages النهائي ناجح بالاعتمادات المقفلة. لا ادعاء CI جديد ناجح أو نشر الدفعة؛ الدليل الجديد محلي، وDeploy سيحجب المخطط الجديد بالإثبات السابق حتى إجراء التحقق. متابعة اعتماد الحارس الثالث2026-10-18: بعد شرح النطاق والفشل طلب المالك «تمام ابدا العمل» مع صور CI/Deploy. GitHub API أكد فشل CI run39119194305/job117651112812 في npm test والتوقع src/features/pilot-db/record-contracts.test.ts:68 بسبب العمود الجديد؛ docs وtypecheck وlint السابقة ناجحة والبناء لم يبدأ في CI. Deploy run39119194306/job117651112987 فشل في Require verified pilot schema قبل البناء والرفع؛ التحذيرات العامة عن Node/Ubuntu ليست سبب الفشل المثبت. لا دليل من الصورة على قيمة Variables الحالية، ولا افتراض أنها فارغة. نُفذ الاستثناء الثالث المحصور: العمود ضمن القائمة، nullable له مع الاسم، وعدد الدوال2→3 واسم RPC الجديدة؛ كل توقعات البيانات/الدرجات والدوال القديمة والمنح والسياسات بقيت كما هي. الميزانية4 ملفات (الاختبار والقرارات والحالة وHANDOFF) ووصف PR؛ لا تغيير للتطبيق أو SQL أو حارس النشر. الجاهزية الحالية observations_current=true وnetwork_policy.state=enforced بلا secrets/runtime_variables/outbound_identities؛ لا اتصال إداري أو بيانات جلسة أو جمع أسرار. لا تطبيق إنتاج أو تغيير إثبات أو حذف أو ready/merge/auto-merge. أصل الأحكام وروابط أدلتها محفوظة؛ الاستثناء المحدد توسع بالاعتماد فقط. التحقق بعد الاستثناء الثالث: الاختبار المعني7/7 ناجح، ثم npm run check كامل ناجح: typecheck وlint و1969 اختبارًا في103 ملفات، بما فيها credits19. docs:check بلا أخطاء أو تنبيهات وstatus:check --base origin/main --require-previous وdiff ناجحة؛ تعارض RAD-024 السابق محفوظ. لم يُعد البناء أو تدقيق المتصفح الناجحان لأن التطبيق وSQL لم يتغيرا؛ دليل build:pages والتدقيق1148/76axe محفوظ في الدفعة السابقة. لا ادعاء نجاح CI الجديد قبل نتيجته؛ فشل GitHub السابق مؤكد بحدوده ويعالج هذا الاستثناء توقعه المحدد. بقي النشر محجوبًا دون تغيير Variables أو إثبات أو إعادة تشغيل؛ يلزم إذن الترحيل الجديد والتحقق من catalogue والخدمة الجديدة، ولا إعادة لترحيل التدريب والاسم السابق. RAD-058 review/owner وnext_id=RAD-059؛ لا مهمة جديدة أو دمج أو حذف. متابعة تأجيل الاتصال2026-10-18: قال المالك «نكمل التعديلات و نعمل الاتصال الاداري اخر اشي لانو اللابتوب مش معي». استُكمل التجهيز دون طلب أسرار أو اتصال/تطبيق إنتاج. الميزانية5 ملفات: scripts/pilot/comparison-service-check.js واختباره الجديد ودليل الإعداد والحالة وHANDOFF؛ لا تغيير التطبيق أو SQL أو الاختبارات القديمة. الإجراء القديم الناجح باقٍ؛ الإجراء الإضافي يختبر RPC المقارنة الجديدة مباشرة عبر الجلسة العادية الموجودة من متصفح الحاسوب بعد إذن الترحيل وفحصي catalogue. Auth وapproved وملخص own أولًا؛ owner all/selected وتاريخ المشارك المحدد، وparticipant رفض403/42501 لنطاق الآخر/all في الملخص والتاريخ. قراءات بحد1 بلا متابعة صفحات أو كتابة، ومضيف ثابت، وإخراج RADLAB_COMPARISON_SERVICE_CHECK منقح بعقد مستقل وpair مطابق للحسابين دون UUID/جلسة/درجات/بصمة المحاولة. witness historical-null يثبت وجود الحقل فارغًا فقط؛ identity-v1 صيغة هوية لا إثبات كتابة أو تطابقها؛ المستقبل لا يدعي توافق الرسم. الإجراء لا يولد أو يسجل إثبات النشر؛ لا PASS حي جديد أو count/backup حي. docs/PILOT_SUPABASE_SETUP.md#comparison-owner-service-check للتشغيل المؤجل وحدوده. لا فحص هاتف أو console الآن. عند بداية المتابعة: CI السابق321d363 كان جاريا، وDeploy39156606988 فشل؛ لا إعادة نشر أو تعطيل الحارس. لا إعادة بناء أو تدقيق متصفح التطبيق الناجحين لأن كوده وSQL لم يتغيرا. تحقق التسليم لهذه المتابعة: comparison-service-check.test.ts اجتاز25 اختبارًا محليًا، وtypecheck وlint للملفين ناجحان؛ docs:check بلا أخطاء/تنبيهات وstatus:check وdiff ناجحة مع حفظ تعارض RAD-024. لم يُعد الفحص الكامل أو البناء أو audit التطبيق الناجحة لأن الإضافة إجراء تشغيل واختباره فقط؛ دليل1969/103 للدفعة السابقة محفوظ، ولا يُسمى هذا PASS حيًا. عند التسليم أكد GitHub completed/success لـCI run39156606980/job117761025486 على321d363، وcompleted/failure لـDeploy39156606988/job117761026117؛ قراءة حالة واحدة في التسليم لا متابعة دورية. الفحص الجديد لم يُشغل حيًا، والاتصال والترحيل مؤجلان حتى اللابتوب ولا يُطلب اعتمادهما الآن. لا تغيير old live-service-check أو أي توقع محمي أو SQL أو Variables أو main أو نشر أو حذف. متابعة استئناف SQL2026-10-19: طلب المالك «تمام خلينا نبدا»، ثم صورة SQL Editor طابقت rad-lab-pilot/main/PRODUCTION وref vlacestfruxooznrcjqc. أُعطي استعلام catalogue للقراءة فقط، اختُبر محليًا في حالات غياب الأساس/قبل الإضافة/جزئي/موجود، ثم أرسل المالك base_rpc_present=true وcomparison_column_present=false وcomparison_constraint_present=false وcomparison_rpc_present=false وinspection_result=COMPARISON_NOT_PRESENT. هذا دليل قراءة من تشغيل المالك، لا تنفيذ ترحيل أو اتصال إداري من الوكيل، ولا يثبت جاهزية جميع ACL/RLS. GitHub API أكد completed/success لـCI39157102754 على3eda6c8 وcompleted/failure لـDeploy39157102747؛ PR88 مفتوح Draft وغير مدموج. البيئة الجديدة observations_current=true بلا secrets/runtime_variables/outbound_identities، وnetwork state unknown لا يثبت enforcement؛ لا اتصال إداري مهيأ. جُهز ملف SQL للتطبيق اليدوي المحدد، من بايتات الترحيل الجديد20261020000500_practice_comparison.sql وكتل DO من training-ready.sql وcomparison-ready.sql دون تعديل مصادرها. يبدأ بمعاملة ومهلة قفل3ثوان واستعلام15ثانية وقفل attempts، يفحص التدريب، ويرفض وجود أي عمود/قيد أو overload باسم RPC الجديدة، ثم يطبق الترحيل الجديد ويفحصه قبل COMMIT ويطبع COMPARISON_UPDATE_APPLIED بعد الحفظ. بصمة ملف التنفيذ المحروس1554e60fa594a457769a2ff70784169f881097efc7044aed886fe5d6e5e81d08. اختبار اصطناعي محلي أثبت التطبيق والحفاظ على قيم attempts/feedback/events/profiles وكل تعريفات الدوال القديمة وACL، وNULL للهوية التاريخية، والتراجع الكامل عند فشل متأخر، ورفض الجزئي/overload/إعادة التنفيذ؛ لا DB حي أو أسرار مستخدمة. ملف التنفيذ معروض للمراجعة في وصف PR؛ لا يثبت ذلك اعتمادًا عامًا أو تطبيقًا إنتاجيًا. ميزانية تحديث المستودع ملفا الحالة وHANDOFF فقط مع وصف PR؛ لا تغيير التطبيق أو SQL الأصلي أو حارس النشر أو الاختبارات المحمية. ينتظر نتيجة تنفيذ المالك المحدد قبل الخدمة والإثبات؛ لا حذف أو إعادة ترحيل التدريب السابق أو backfill أو ready/merge/auto-merge. دليل تنفيذ ترحيل المقارنة2026-10-19: بعد تقديم الملف المحروس الكامل المحدد للمشروع المطابق مع توضيح أنه إضافة فعلية للإنتاج بعمود nullable وRPC قراءة فقط، أعاد المالك جدول result=COMPARISON_UPDATE_APPLIED. هذا إفادة تطبيق من SQL Editor الخاص بالمالك، لا اتصال إداري من الوكيل. وفق الملف المقدم، النتيجة بعد COMMIT، وفحص training-ready قبل الإضافة وفحص comparison-ready قبل الحفظ ضمن المعاملة، مع حارس رفض الجزئي/إعادة التنفيذ ومهل محدودة. تقبل الإفادة بحدودها ولا تُنسب إلى Auth/PostgREST أو عزل الخدمة الجديدة أو كتابة محاولتين أو نجاح الرسم؛ يلزم سطرا RADLAB_COMPARISON_SERVICE_CHECK من المالك والمشارك بعقد practice-comparison/1 وpair متطابق. لم تُطلب إعادة SQL الناجحة، ولم يُولد/يسجل إثبات أو يُعد نشر أو يفتح رابط مستضاف أو يُحذف شيء. لا تمنح العملية إذن حذف أو تغييرات إنتاج أخرى. الترحيل الأصلي وكتل الفحص مطابقة دون تعديل، وملف التنفيذ ببصمته المسجلة في الدليل السابق. الميزانية3 ملفات توثيق فقط (دليل الإعداد والحالة وHANDOFF) ووصف PR؛ لا تغيير التطبيق أو SQL أو اختبارات أو حارس نشر. اسم وأدوار وموافقات الحسابات والنتائج التاريخية محفوظة ضمن نطاق الإجراء، ولا backfill. RAD-058 review/owner وnext_id=RAD-059؛ المقارنة/السجل لا يتطلبان تنظيفًا. فحص خدمة المقارنة الحي2026-10-19 من تشغيل المالك، لا اتصال الوكيل: owner PASS عند07:23:56Z وparticipant PASS عند07:25:07Z بالعقد practice-comparison/1 والزوج المتطابق6d954fdcf76b93a794d3db5eff4a864ba71cd6b4988261d789a852823791464d؛ شمل المالك own/all/selected والتاريخ، وشمل المشارك own مع رفض other/all في الملخص والتاريخ. الشاهد historical-null يثبت إتاحة الحقل التاريخي الفارغ فقط، لا كتابة هوية جديدة أو نجاح الرسم. وُلد محليًا من الملفات الحالية والمشروع الثابت pilot-v1:43453d125fc260b20062d1d95a21eeead6c8bc720da7f60dafb89189ae26f3f0؛ لم يسجل أو يعد النشر. متابعة النشر والتجربة2026-10-19: أفاد المالك بحفظ قيمة الإثبات الجديدة في Repository Actions Variable؛ لم يقرأها الوكيل مباشرة. أعاد الوكيل failed jobs للتشغيل39216271584 فقبل GitHub الطلب201؛ ثم أكد API completed/success للمحاولة2 على82dfdb0، job117942244903، مع نجاح Require verified pilot schema وBuild static export وDeploy to Cloudflare Pages وتعليق الرابط. لا فتح أو مشاركة معاينة من الوكيل. على رابط المعاينة فتح المالك حساب المشارك ونفذ محاولتين جديدتين للحالة نفسها؛ لقطة Training تعرض2 compatible attempts والقيم الفعلية66.3 عند10:39 و55.4 عند10:40، وأكد تطابق الرسم. ثم اختبر الهاتف وأفاد100%: القيم والتفاصيل والتبديل EN/AR بلا تمرير أفقي أو قطع. هذه إفادة وصورة من المالك، لا تشغيل متصفح الوكيل؛ لا حذف أو backfill. مسار المقارنة مكتمل وينتظر مراجعة Draft فقط.",
      "completion_evidence": "دُمج PR #88 في main عند 42782d7 بتاريخ2026-10-19. GitHub: Deploy39218700486 وCI39218700459 ناجحان، بما فيه الحارس والاختبارات والبناء والرفع. سبق ذلك تطبيق SQL المحروس وفحص خدمة متبادل بعقد practice-comparison/1 وpair متطابق، ثم محاولتان فعليتان66.3 و55.4 ورسم صحيح وهاتف/تفاصيل/EN/AR ناجحة. بعد نشر main راجع المالك الإنتاج وأكد أن كل شيء يعمل. لا حذف أو backfill؛ التصفير مؤجل ومستقل."
    },
    {
      "id": "RAD-059",
      "title": "شرط ما قبل تفعيل Assess لناس حقيقيين: المراقبة والإلغاء والتكلفة",
      "status": "planned",
      "priority": "high",
      "description": "قبل تفعيل Assess لناس حقيقيين تُخطط وتُنفذ قناة إنذار، وإيقاف طوارئ مجرّب (البوابة وLOGIN وإنهاء الجلسات وتعطيل السر والJob)، ومتابعة التكلفة. لا إنشاء جدولة أو قناة الآن.",
      "source_ref": "docs/DECISIONS.md#assess-trial-closeout-owner-2026-10-22؛ docs/ASSESS_TRIAL_FINAL_REPORT_2026-10-22.md؛ docs/ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-060",
      "title": "زر إغلاق إسناد Assess ضمن جلسة إصلاحات الواجهة",
      "status": "deferred",
      "priority": "medium",
      "description": "زر إغلاق نهائي للإسناد في لوحة المالك مع تأكيد وEN/AR واختبارات. يُدمج في جلسة إصلاحات الواجهة الشاملة؛ إجراء console الحالي يبقى المسار المعتمد.",
      "source_ref": "docs/DECISIONS.md#assess-trial-closeout-owner-2026-10-22؛ scripts/pilot/assess-close-assignment.js",
      "defer_reason": "قرار المالك 2026-10-22: يؤجل إلى جلسة إصلاحات الواجهة الشاملة."
    },
    {
      "id": "RAD-061",
      "title": "تدقيق وتنظيف الكود قبل ميزات Assess الكبيرة",
      "status": "review",
      "priority": "medium",
      "description": "الدفعة 1 مدموجة (#100). الخيار (أ) لحد الوقت (RAD-061_TIMEOUT_DIAGNOSIS_2026-10-22.md) في Draft PR؛ (ب) مؤجل: زمن npm test في CI أكثر من نحو 5 دقائق أو أكثر من نحو 40 ملف PGlite. ثم الدفعات 2–5 (CLN-037 في الدفعة 4)، فالدفعة 6، ثم CLN-042. كل دفعة بموافقة منفصلة.",
      "source_ref": "docs/RAD-061_CODE_AUDIT_REPORT_2026-10-22.md؛ docs/DECISIONS.md#assess-authoring-owner-2026-10-22؛ AGENTS.md قواعد refactor؛ docs/DECISIONS.md#cleanup-sequencing-owner-2026-10-22",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-062",
      "title": "متطلبات رفع أسئلة Assess: كتابي بتصحيح الأستاذ، دور مشرف، أداة جدول",
      "status": "planned",
      "priority": "high",
      "description": "بعد جرد RAD-064، وبعد تحقق المالك من حصص Supabase (الملفات والقاعدة) في Usage. أول خطوة تصميم الاحتفاظ والأدوار (المشرف وRLS)، ثم أداة جدول→JSON، ثم الكتابي بتصحيح الأستاذ واقتراح تطابق قريب، ثم الصور (Supabase Storage خاص)، ثم واجهة الكتابة. يشمل CLN-035/036. بالإنجليزية. لا برمجة قبل استئناف المالك.",
      "source_ref": "docs/DECISIONS.md#assess-authoring-owner-2026-10-22؛ docs/DECISIONS.md S-ASSESS-7 وS-ASSESS-11؛ docs/DECISIONS.md#cleanup-sequencing-owner-2026-10-22",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-063",
      "title": "النسخ الاحتياطي والمراجعات المستقلة لـAssess: آخر خطوة",
      "status": "planned",
      "priority": "high",
      "description": "آخر خطوة بعد دمج #96 واكتمال المراحل: نسخة احتياطية شاملة واستعادة مجربة، ومراجعات O108 والمصادر والتراخيص والطبي وMarker. بقرار المالك 2026-10-22.",
      "source_ref": "docs/DECISIONS.md#assess-authoring-owner-2026-10-22؛ docs/DECISIONS.md#assess-retention-original-no-backup-2026-10-20",
      "waiting_on": "owner"
    },
    {
      "id": "RAD-064",
      "title": "جرد قراءة فقط للواجهة والمحاكي قبل RAD-062",
      "status": "planned",
      "priority": "medium",
      "description": "بعد الدفعة 6 من RAD-061 وقبل RAD-062: يمرّ المالك على كل فحص وصفحة (EN/AR، هاتف وحاسوب) ويسجّل الملاحظات؛ تصنّف الجلسة كل ملاحظة وظيفي/بصري/محاكي بصري/محاكي يمس التصحيح أو الطب، وتحدد توقيتها وفق البند 8. قراءة فقط، دون تعديل كود.",
      "source_ref": "docs/DECISIONS.md#cleanup-sequencing-owner-2026-10-22",
      "waiting_on": "owner"
    }
  ]
}
```
<!-- STATUS-DATA:END -->

## سجل تاريخي

التاريخ ليس مهاماً مفتوحة. السجل المرحلي الكامل والملخص القديم في [`status-archive.md`](status-archive.md)؛ التفاصيل في `ROADMAP_SESSIONS.md` وDECISIONS.md وسجلات الجلسات.
