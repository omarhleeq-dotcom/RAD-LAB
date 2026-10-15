# حالة مشروع RAD-LAB

> **هذا الملف هو المصدر الموحّد للحالة الحالية** (يحدّثه Claude Code وCodex ضمن جلسات العمل، ويُعرض لاحقاً في Obsidian).
> التنسيق وقواعد التحديث: [`status-format.md`](status-format.md). الفحص: `npm run status:check`.
> الحقول الثابتة (أسماء المفاتيح وقيم `status` و`priority`) بالإنجليزية لسهولة القراءة الآلية؛ العناوين والأوصاف بالعربية.

## ملخص الحالة الحالية (سرد، لا يُقرأ آلياً)

- **المنفّذ والمدموج في `main`** (آخر مراجعة: `29630d9`، دمج PR #39؛ الأساس البرمجي `8ba2876` دمج PR #34): محاكي Chest PA، تقسيم الفحص/الحالة، منصة التصفح، المراجع المكتوبة ومكتبة المصادر، آليات التعميم (S11)، فحوص الصدر الثلاثة (PA وLateral وAP supine)، وفحوص الأطراف: wrist وhand وelbow وknee وfoot وankle (12 فحصاً أطراف + 3 صدر)، وPelvis AP (المجموع 16)، مع جولتي تحسين بصري (S-VIS-1a/1b).
- **الاتجاه الحالي (المالك، 2026-10-15):** الكتف Grashey: المرجع وNeeds مدموجان (RAD-031، PR #36)؛ الصورة مستوردة (A-037/A-038، SHA-1 مطابق)، وحُسمت وضعية الحالة (قائم فقط) وحدود المحاكاة قبل الكود، وتبقى ملاءمة الصورة للمراجعة (RAD-032)؛ التنفيذ (RAD-033) جاهز للمراجعة في Draft PR دون دمج: فحص `shoulder-grashey-erect` قائم، كاشف 24×30، علامة R ثابتة، إشارة دوران واحدة. الحوض مدموج (RAD-028/RAD-030)، ومراجعته الطبية باقية (RAD-029). الساعد مؤجل في RAD-027/O37؛ بقية abdomen & pelvis ثم head ثم spine ثم Assess ثم Release لم تبدأ. CT/MRI/US في v2.
- **إضافة النطاق الحالية (المالك):** مرجع Shoulder Y وNeeds مدموجان في PR #38 (RAD-034 منجز توثيقيًا)، وصورته للمراجعة (RAD-035). لا كود لأي كتف أو محاكي3D بموجب هذه الجلسة؛ Grashey المدموج وقراراته محفوظة.
- **ما يحتاج المالك أو المراجع البشري:** مراجعة المعلّم/الفيزيائي (O5، ليست بوابة)، إعادة التحقق من رخص الصور على Commons قبل الإصدار، وقرارات بيانات صغيرة (O55/O74 وO52 وO59)، وتأكيد حالة نشر المعاينة (RAD-024).
- **تعارضات بين المصادر:** مسجّلة في حقل `conflict` داخل المهام المعنيّة (RAD-024 وRAD-025) ولا تُكرَّر هنا.
- **لا تُحسب نسبة إنجاز للمشروع**: عدد المهام لا يعكس حجم العمل ولا المخاطر.

## البيانات الحالية (قابلة للقراءة الآلية)

<!-- STATUS-DATA:BEGIN -->
```json
{
  "project": "RAD-LAB",
  "format_version": "1.0",
  "revision": 11,
  "updated_at": "2026-10-15T09:03:31Z",
  "timezone": "UTC",
  "next_id": "RAD-036",
  "tasks": [
    {
      "id": "RAD-001",
      "title": "محاكي Chest PA الأساسي ومعاينة النشر (الجلسات 1–6)",
      "status": "done",
      "priority": "high",
      "description": "المحاكي ثنائي اللغة لفحص Chest PA: التموضع، التقنية، مولّد صورة النتيجة، مصفوفة QA، ومعاينة ساكنة خاصة مع لافتة 'Educational prototype'.",
      "source_ref": "CLAUDE.md (ملاحظات Sessions 2–6)؛ docs/session-2-positioning.md، session-3-technique.md، session-4-radiograph-renderer.md، session-5-qa.md؛ docs/DEPLOYMENT.md",
      "completion_evidence": "الكود والاختبارات والبيانات في main؛ توثيق الجلسات؛ مصفوفة QA الموثّقة في docs/session-5-qa-matrix.md؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS. (لا يثبت هذا نشر المعاينة فعلياً: انظر RAD-024.)"
    },
    {
      "id": "RAD-002",
      "title": "فصل ExamDefinition عن CaseDefinition (الجلسة 7)",
      "status": "done",
      "priority": "high",
      "description": "تقسيم بيانات Chest PA إلى فحص وحالة مع composeCase وvalidators بلا تغيير في السلوك. الباقي من نطاق الجلسة 7 مؤجَّل في RAD-021.",
      "source_ref": "docs/ROADMAP_SESSIONS.md (Session 7 'DONE in part')؛ docs/session-7-engine-generalisation.md؛ DECISIONS.md S7-1…S7-4",
      "completion_evidence": "اختبار التوصيف المقارِن بايتاً ببايت src/features/qa/characterisation.test.ts مع scripts/qa/characterisation/*؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-003",
      "title": "محاذاة بيانات المريض لصورة الأساس (D7، الجلسة 8)",
      "status": "done",
      "priority": "medium",
      "description": "مواءمة عمر/جنس/ضمائر الحالة ونصوصها العربية مع صورة الأساس A-001 دون تغيير الصورة أو قيم طبية.",
      "source_ref": "docs/session-8-demographics-alignment.md؛ DECISIONS.md D7 (و O1 المحسومة)",
      "completion_evidence": "اختبار src/features/qa/demographics-independence.test.ts واختبار التوصيف؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-004",
      "title": "هيكل المنصة: الكتالوج وصفحة الفحص ومسار Practice (الجلسة 9)",
      "status": "done",
      "priority": "high",
      "description": "مسارات /{locale}/{modality}/{exam}/practice، صفحات 404 ثنائية اللغة، إعادة توجيه روابط /simulation القديمة. لم تُبنَ حاويات Learn/Reference ولا مبدّل الأوضاع (قرار D1).",
      "source_ref": "docs/ROADMAP_SESSIONS.md (Session 9)؛ DECISIONS.md D1, D2؛ docs/adr/ (ADR-0011)؛ CLAUDE.md (Platform shell)",
      "completion_evidence": "اختبار تزامن روابط legacy مع public/_redirects ضمن مجموعة الاختبارات؛ فحص axe/QA حسب مصفوفة الجلسة؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-005",
      "title": "مراجع Chest Lateral وChest AP ومكتبة المصادر (الجلستان 10 و10b)",
      "status": "done",
      "priority": "high",
      "description": "مستندات مرجعية وسجل مصادر بملاحظات مُعاد صياغتها مع أرقام الصفحات، وملخص احتياجات الجلسة 11. أُنجز بالتوثيق فقط. ملاحظة: مطالبات المصادر قرأها مستشار المالك ولم يعد Claude Code التحقق منها.",
      "source_ref": "docs/ROADMAP_SESSIONS.md (Sessions 10, 10b)؛ docs/sources/REGISTER.md؛ docs/SESSION_11_NEEDS_SUMMARY.md؛ DECISIONS.md S10-1…S10-5، S10b-1…S10b-26",
      "completion_evidence": "الملفات موجودة ومدموجة في main (docs/RAD-LAB_Medical_Reference_*.md، docs/sources/*.md). إنجاز توثيقي: لا يثبت صحة القيم الطبية (انظر RAD-019)."
    },
    {
      "id": "RAD-006",
      "title": "تعميم المحرك (الجلسة 11): آليات اختيارية دون تغيير Chest PA",
      "status": "done",
      "priority": "high",
      "description": "قواعد العلامة، زاوية الأنبوب، choiceControls، فئات لكل فحص، مسجّل المشاهد، مجموعات معالم اختيارية، توهين لكل إسقاط.",
      "source_ref": "docs/session-11-generalisation.md؛ DECISIONS.md S11-1…S11-4؛ CLAUDE.md (Generalisation)",
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
      "source_ref": "docs/session-12-chest-lateral.md؛ DECISIONS.md S12-1…S12-11؛ docs/ROADMAP_SESSIONS.md (Session 12 status)",
      "completion_evidence": "اختبارات الفحص والحالة ومصفوفة lateral-audit؛ بقاء الحارس scripts/qa/characterisation لـ Chest PA دون تغيير؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-009",
      "title": "فحص Chest AP supine (الجلسة 13)",
      "status": "done",
      "priority": "high",
      "description": "فحص chest-ap-supine مع صورة NIH ChestX-ray14 وقاعدة تدوير بالحجم فقط. متغيرات erect/semi-erect وبنود O18 غير منفّذة (RAD-020).",
      "source_ref": "docs/session-13-chest-ap.md؛ DECISIONS.md S13-1…S13-7؛ CLAUDE.md (Chest AP supine)",
      "completion_evidence": "اختبارات الفحص وscripts/qa/ap-audit.mjs؛ PA وLateral دون تغيير بايتياً حسب docs/session-13-chest-ap.md؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-010",
      "title": "إعادة تصميم مشاهد الصدر (S13b) ووصفة الفحص (S13c)",
      "status": "done",
      "priority": "medium",
      "description": "لغة بصرية موحّدة للمشاهد الثلاثة وألوان وتباين مفحوصة آلياً، ثم docs/exam-recipe.md كقائمة ثابتة لإضافة فحوص جديدة.",
      "source_ref": "docs/session-13b-scene-design.md؛ docs/exam-recipe.md؛ DECISIONS.md S13b-1, S13c-1",
      "completion_evidence": "اختبار scene-style.test.ts (تباين ≥ 3:1) وحارس scene-dom؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-011",
      "title": "تعميم للأطراف بلا تغيير سلوكي (S14-0) ومعيار صياغة الجلسات (S-STD)",
      "status": "done",
      "priority": "medium",
      "description": "ProjectionId وWordingNs سلاسل مفتوحة مسجّلة، SceneLayout وDetectorFigure، حارس scene-dom؛ وإقرار معيار الجلسة S-STD-1/2 الملزم.",
      "source_ref": "docs/session-14-limbs-generalisation.md؛ DECISIONS.md S-STD-1، S-STD-2",
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
      "source_ref": "docs/session-14.2b-hand.md؛ docs/RAD-LAB_Medical_Reference_Hand.md؛ DECISIONS.md S14.2-6…S14.2-11",
      "completion_evidence": "scene-dom-hand.test.ts مع hand-hashes.json؛ scripts/qa/hand-audit.mjs؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-014",
      "title": "فحوص elbow-ap وelbow-lateral (S14.3)",
      "status": "done",
      "priority": "medium",
      "description": "فحصا الكوع الأيسر (AP ممدود، جانبي مثني 90°) بنموذج تدوير صغير مشترك.",
      "source_ref": "docs/session-14.3-elbow.md؛ docs/RAD-LAB_Medical_Reference_Elbow.md؛ DECISIONS.md S14.3-5…S14.3-12",
      "completion_evidence": "scene-dom-elbow.test.ts مع elbow-hashes.json؛ scripts/qa/elbow-audit.mjs؛ تحقق آلي: npm run check (typecheck وlint وvitest: 59 ملفاً، 1583 اختباراً ناجحاً) على المراجعة 4118326 في جلسة RAD-STATUS."
    },
    {
      "id": "RAD-015",
      "title": "فحوص knee-ap وknee-lateral وfoot-ap وfoot-oblique وankle-ap وankle-lateral (S14.4 وS14.5)",
      "status": "done",
      "priority": "medium",
      "description": "ستة فحوص أطراف سفلية (الركبة والقدم يمنى، الكاحل يسرى مستنتجة) على باني الطرف السفلي مع تحكم زاوية الأنبوب. أُنجزت في PR #29 (S14.4) وPR #31 (S14.5).",
      "source_ref": "docs/session-14.4-knee-foot.md؛ docs/session-14.5-ankle.md؛ DECISIONS.md S14.4-1…S14.4-18، S14.5-1…S14.5-13",
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
      "description": "ثلاثة قرارات صغيرة: (1) موضع علامة hand-PA الافتراضي ثم إعادة براهين التسجيل (O55 وO74؛ يؤثر في فحص العلامة)؛ (2) تأكيد أو تغيير اتجاه كاسيت elbow-lateral (O52)؛ (3) تأكيد ملف القدم المقصود، فالمعلن 1067×1913 والمرفق 1061×2431 (O59). لا تعديل قبل قرار المالك (S-STD-1).",
      "source_ref": "DECISIONS.md O55، O74، O52، O59 وS-VIS-1b-9"
    },
    {
      "id": "RAD-018",
      "title": "إعادة التحقق من رخص ومصادر الصور على Commons وNIH قبل الإصدار",
      "status": "planned",
      "priority": "high",
      "description": "إعادة التحقق عند المصدر (المؤلف، سطر الرخصة، التاريخ، SHA-1) للصور المسجّلة 'owner-verified' بعد فشل واجهة Commons (HTTP 429)، وهي المذكورة في O14 وO27 وO39 وO47 وO56 وO75 داخل docs/ASSET_PROVENANCE_AND_LICENSES.md، وشروط NIH لـ A-008 (O16)، ووصف مريض القدم (O65). لم تُعد المحاولة في هذه الجلسة.",
      "source_ref": "DECISIONS.md O14، O16، O27، O39، O47، O56، O65، O75؛ docs/ASSET_PROVENANCE_AND_LICENSES.md"
    },
    {
      "id": "RAD-019",
      "title": "مراجعة المعلّم والفيزيائي الطبي لكل القيم المؤقتة والنص العربي (O5)",
      "status": "review",
      "priority": "high",
      "description": "حزمة المراجعة جاهزة وتنتظر مراجِعاً بشرياً: قيم Chest PA/Lateral/AP، فحوص الأطراف، النص العربي المساعَد آلياً، واقتراحات المصطلحات. ليست بوابة للجلسات (S10b-20) لكنها موصى بها قبل الإصدار أو التدريس. تشمل أيضاً حدود الصور وتقديرات المقياس والمعالم (O28، O31، O41، O49، O57، O58، O60، O62، O73، O76، O77، O78، O79، O80) وبنود O15 وO71.",
      "source_ref": "docs/REVIEW_PACKAGE.md؛ docs/REVIEW_CHECKLIST_EDUCATOR_PHYSICIST.md؛ DECISIONS.md O5، S10b-20"
    },
    {
      "id": "RAD-020",
      "title": "متغيرات Chest AP المؤجلة: erect/semi-erect، تسمية SID على الصورة، صفحة الاعتمادات، كاسيت أفقي",
      "status": "deferred",
      "priority": "low",
      "description": "إضافة متغيرات الوضعية وبنود O18 (تسمية SID/الوضعية على الصورة، صفحة مصادر واعتمادات ثنائية اللغة، كاسيت أفقي وبناء المريض، فرض التعريض اليدوي، زر AP erect) وقرار O19 لعرض الإسقاط الخاطئ في PA/Lateral.",
      "source_ref": "DECISIONS.md O9، O18، O19، S10b-12؛ docs/session-13-chest-ap.md (البنود غير المنفّذة)",
      "defer_reason": "لم يطلب المالك جدولتها؛ ترتيب S12-12 يقدّم بقية فحوص X-ray v1. صفحة الاعتمادات تُعاد النظر فيها ضمن RAD-023."
    },
    {
      "id": "RAD-021",
      "title": "نقل الكود إلى modalities/xray/* وإخراج المستهلكين من RadCase (مؤجَّل منذ S7/S11)",
      "status": "deferred",
      "priority": "low",
      "description": "ما زال RadCase عرض توافق، ولا يوجد src/modalities. يبقى مؤجلاً حتى يحتاجه فحص أو نمط جديد فعلاً.",
      "source_ref": "DECISIONS.md S7-2، S7-4؛ docs/SESSION_11_NEEDS_SUMMARY.md (صفوف deferred)؛ docs/session-11-generalisation.md",
      "defer_reason": "قاعدة الثلاثة (rule of three): لا حاجة ملموسة؛ التغيير كبير ويصعب إثبات عدم تغيّر السلوك فيه."
    },
    {
      "id": "RAD-022",
      "title": "فحوص X-ray v1 المتبقية: abdomen & pelvis ثم head ثم spine (مرجع أولاً)",
      "status": "planned",
      "priority": "medium",
      "description": "بدأ مرجع Pelvis AP فقط في RAD-028 بتوجيه المالك 2026-10-15؛ لا تنفيذ للحوض. بقية البطن والحوض ثم الرأس والعمود الفقري لم تبدأ، وتبقى خاضعة لقاعدة المرجع وNeeds ودمجهما قبل الكود (S10-2). لا يشمل ذلك CT/MRI/US في v2.",
      "source_ref": "DECISIONS.md S12-12، S10-2؛ docs/exam-recipe.md؛ docs/ROADMAP_SESSIONS.md (ملاحظة S14-0 والجلسة 14)"
    },
    {
      "id": "RAD-023",
      "title": "تحضير الإصدار: لافتة المعاينة، تدقيق الرخص التجاري، صفحة الاعتمادات، قراءة المصادر المتبقية",
      "status": "planned",
      "priority": "low",
      "description": "آخر بند في ترتيب المالك (Release). يشمل قرار إزالة لافتة 'Educational prototype' (قرار المالك فقط)، إعادة تدقيق O10 بعد الأصول الجديدة (RAD-018)، صفحة المصادر/الاعتمادات، وقراءة المصادر غير المقروءة (ACR للتصوير الرقمي، IAEA، AIR/RCR، Fitzgerald 2025؛ O4) ومصدر تقنية الأطراف (O26: Clark قبل الإصدار). لا يبدأ قبل اكتمال فحوص X-ray v1.",
      "source_ref": "DECISIONS.md S12-12، O4، O10، O26، S10b-20؛ CLAUDE.md (Pilot preview — لا تُزل اللافتة دون قرار المالك)"
    },
    {
      "id": "RAD-024",
      "title": "حالة نشر المعاينة الخاصة (Cloudflare Pages وZero Trust Access)",
      "status": "review",
      "priority": "medium",
      "description": "لا يوجد في المستودع دليل على أن النشر ربط فعلاً بـ Cloudflare أو أن الوصول مقيّد ببريد المراجعين. المطلوب إجابة من المالك: هل النشر يعمل ومن يملك الوصول؟ ثم إما تسجيل المهمة done بدليل (رابط النشر الناجح) أو تحديد المتبقي.",
      "source_ref": "docs/DEPLOYMENT.md؛ .github/workflows/deploy-pages.yml؛ docs/ROADMAP_SESSIONS.md (Gate G0)",
      "conflict": "G0 في ROADMAP_SESSIONS.md يعدّ ربط Cloudflare وتفعيل Access عملاً للمالك وملاحظاته 'partly resolved'؛ ولا يوجد سجل لنتيجته. وجود workflow النشر لا يثبت تنفيذه."
    },
    {
      "id": "RAD-025",
      "title": "مواءمة صياغة ROADMAP_SESSIONS.md وDECISIONS.md مع الحالة المدموجة",
      "status": "planned",
      "priority": "low",
      "description": "تحديث نصوص قديمة دون تغيير القرارات: سطر الحالة العلوي في ROADMAP (يصف الجلسة 11+ كمقترح)، وسطر 'PARTLY DONE' للجلسة 11b مع أن S11c سجّلت إكمال اتجاه التدوير، وعبارة 'draft PR' لجلسات مدموجة، وبقاء ترقيم الجلسات 14–18 مقابل ترتيب S12-12 (v2 للـCT/MRI/US)، وتناقض O24 ('RIGHT') مع S14.1c-1 (اليسرى) في صفّ O24 نفسه. تُعدَّل بجلسة توثيق ولا تُعامَل كمهام منتجة.",
      "source_ref": "docs/ROADMAP_SESSIONS.md (سطر 3 وSession 11b وملاحظة S14-0)؛ DECISIONS.md O24، S14.1c-1",
      "conflict": "المصدران يتعارضان صراحة؛ قاعدة الحسم المعلنة في ROADMAP نفسها: DECISIONS.md وexam-recipe.md هما الأعلى عند التعارض. لذلك اعتُمدت DECISIONS.md هنا ولم يُعدَّل أي مصدر."
    },
    {
      "id": "RAD-026",
      "title": "فحص تحذير lint غير المتحقَّق منه في scripts/qa/wrist-audit.mjs (O38)",
      "status": "planned",
      "priority": "low",
      "description": "ظهر التحذير فعلاً عند تشغيل npm run lint على 4118326: 'group' is assigned a value but never used (wrist-audit.mjs:55). لم يُصلَح هنا (S-STD-1: لا إصلاحات انتهازية). يُصلح في جلسة كود قادمة بموافقة المالك.",
      "source_ref": "DECISIONS.md O38؛ ناتج npm run lint في جلسة RAD-STATUS"
    },
    {
      "id": "RAD-027",
      "title": "مرجع Forearm AP + Lateral وقسم Needs فقط",
      "status": "deferred",
      "priority": "high",
      "description": "مرجع الساعد AP/Lateral لم يُكتب؛ O37 باقٍ مفتوحًا لغياب الصور المناسبة المعتمدة. أصبح كتاب Bontrager 9 متاحًا عبر Drive، لكن صفحات الساعد لم تُستخرج في مرحلة الحوض.",
      "source_ref": "تعليمات المالك 2026-10-15؛ DECISIONS.md O37 وS10-2؛ docs/HANDOFF.md؛ docs/session-continuity-2026-10-15.md؛ DECISIONS.md S-PELVIS-REF-1",
      "defer_reason": "اختار المالك الحوض في 2026-10-15 كنطاق العمل الحالي؛ الساعد يبقى مؤجلًا وفق O37."
    },
    {
      "id": "RAD-028",
      "title": "مرجع Pelvis AP وقسم Needs",
      "status": "done",
      "priority": "high",
      "description": "مرجع Pelvis AP وNeeds مدموجان في PR #33. لا يثبت إنجاز المرجع صحة المحتوى الطبي؛ التنفيذ منفصل في RAD-030.",
      "source_ref": "docs/RAD-LAB_Medical_Reference_Pelvis_AP.md؛ docs/session-pelvis-ap-reference-2026-10-15.md؛ DECISIONS.md S-PELVIS-REF-1/2؛ PR #33",
      "completion_evidence": "PR #33 مدموج في main عند f531a660c3a184677bb82807e6e06158a3a48857؛ المرجع وNeeds وقرارات S-PELVIS-REF-1/2؛ تحقق Git/API 2026-10-15."
    },
    {
      "id": "RAD-029",
      "title": "صورة Pelvis AP المنظفة من marker — مادة مراجعة",
      "status": "review",
      "priority": "high",
      "description": "A-034/A-035 مدموجان في #33؛ حُفظ الأصل والاشتقاق بلا علامة، وتحقق صفر بكسل متغير خارج خلفية التنظيف. اعتمد المالك متابعة الحوض بنهج الفحوص السابقة؛ أُضيفت نسخة منتج A-036 ضمن RAD-030. تبقى ملاءمة/تغطية الصورة للمراجعة الطبية O84/O5.",
      "source_ref": "docs/ASSET_PROVENANCE_AND_LICENSES.md A-034/A-035؛ scripts/derive-pelvis-baseline.py؛ DECISIONS.md O84؛ PR #33"
    },
    {
      "id": "RAD-030",
      "title": "تنفيذ Pelvis AP مستلقٍ بنهج الفحوص السابقة",
      "status": "done",
      "priority": "high",
      "description": "تنفيذ Pelvis AP مستلقٍ مدموج في main بعد مراجعة المالك؛ وضع الطرفين وحبس النفس مستقلان، علامة تشريحية وتعريض يدوي ودوران تعليمي من صورة واحدة. لا يتضمن ذلك إثبات النشر أو اعتمادًا طبيًا.",
      "source_ref": "DECISIONS.md S-PELVIS-1-1…5؛ docs/session-pelvis-ap-implementation.md؛ PR #34",
      "completion_evidence": "راجع المالك الفرع وأعلن دمجه؛ GitHub يؤكد دمج PR #34 في 2026-10-15T07:43:19Z بالـcommit 8ba28769a9b870cef9f7cab835af8cafd1b4083a على main. QA التنفيذ الموثقة: typecheck/lint (O38 فقط)، 63 ملفًا/1629 اختبارًا، build، حارس scene-dom للحوض، 84 فحص متصفح/axe EN/AR و648 حالة تسميات ناجحة. الفحوص الـ15 السابقة دون تغيير. لم تُعد اختبارات التطبيق في تحديث التوثيق."
    },
    {
      "id": "RAD-031",
      "title": "مرجع الكتف Grashey وNeeds قبل الكود",
      "status": "done",
      "priority": "high",
      "description": "مرجع AP oblique glenoid/Grashey وNeeds بقراءة Bontrager ص196 مباشرة، مدموج في main. لا يشمل Shoulder AP العادي أو Y أو axillary. القيم الطبية مؤقتة تحت O5؛ الدمج لا يثبت صحة المحتوى الطبي.",
      "source_ref": "توجيه المالك 2026-10-15؛ DECISIONS.md S-SHOULDER-REF-1؛ docs/RAD-LAB_Medical_Reference_Shoulder_Grashey.md؛ docs/session-shoulder-grashey-reference-2026-10-15.md؛ PR #36",
      "completion_evidence": "PR #36 مدموج في main بيد المالك (merged_by omarhleeq-dotcom) في 2026-10-15T08:18:35Z عند الـcommit 91f0bc43247a2c955f1ff2c0c43e61b9707270ff؛ تحقق GitHub API وgit (HEAD = origin/main) في 2026-10-15. المرجع وNeeds وقرار S-SHOULDER-REF-1؛ توثيق فقط."
    },
    {
      "id": "RAD-032",
      "title": "مطابقة صورة الكتف وترخيصها وملاءمتها",
      "status": "review",
      "priority": "high",
      "description": "طُوبقت الهوية والترخيص في 2026-10-15 (صفحة Commons وAPI، CC0 1.0، Häggström، SHA-1 للأصل يساوي المعلن 74f43679…8337؛ O87 مغلق للهوية/الترخيص). استُوردت في Draft PR الكتف: الأصل A-037 (غير مخدوم) ونسخة ويب رمادية بلا فقدان A-038، بلا أي تعديل للبكسلات. ملاحظات الصورة (الإطار ينتهي في منتصف العضد، هامش مستقيم مائل، اسم الملف normal مقابل وصف الخلع المتكرر) وملاءمتها للمراجعة (O91/O5).",
      "source_ref": "DECISIONS.md S-SHOULDER-2-1/2-2، S-SHOULDER-3-4؛ O87/O91؛ ASSET_PROVENANCE A-037/A-038؛ مرجع Shoulder Grashey §8.8 و§12.1–12.2؛ docs/session-shoulder-grashey-settlement-2026-10-15.md"
    },
    {
      "id": "RAD-033",
      "title": "تنفيذ Shoulder Grashey (قائم) — للمراجعة",
      "status": "review",
      "priority": "medium",
      "description": "تنفيذ `shoulder-grashey-erect` جاهز للمراجعة في Draft PR ولم يُدمج: قائم فقط، كاشف 24×30 أفقي، علامة R ثابتة، زاوية جسم مطلقة بهضبة 35°–45°، ذراع بلا أثر على الصورة، وإشارة واحدة هي انغلاق الحيّز المفصلي. تنتظر مراجعة المالك وتأكيد S-SHOULDER-2-3…6 (O96) وهندسة O95؛ الاختيارات التعليمية B غير محققة (O5). لا تنفيذ لسلسلة كتف كاملة تلقائيًا.",
      "source_ref": "DECISIONS.md S-SHOULDER-3-1…5/O88/O95/O96؛ docs/session-shoulder-grashey-implementation-2026-10-15.md؛ docs/RAD-LAB_Medical_Reference_Shoulder_Grashey.md §12"
    },
    {
      "id": "RAD-034",
      "title": "مرجع Shoulder Y وNeeds من Bontrager دون كود",
      "status": "done",
      "priority": "high",
      "description": "مرجع PA oblique scapular Y وNeeds مدموجان في main بقراءة Bontrager ص201. إنجاز توثيقي فقط؛ لا تنفيذ فحص أو استيراد صورة أو اعتماد طبي.",
      "source_ref": "توجيه المالك 2026-10-15؛ DECISIONS.md S-SHOULDER-Y-REF-1؛ docs/RAD-LAB_Medical_Reference_Shoulder_Y.md؛ docs/session-shoulder-y-reference-2026-10-15.md؛ PR #38",
      "completion_evidence": "أعلن المالك دمج الدوكس؛ GitHub وGit يؤكدان دمج PR #38 في 2026-10-15T08:53:49Z بالـcommit 5821c4ec31a231529eb230d26f9f7e7b219fb0db. مرجع Shoulder_Y وأقسام Needs الثمانية وسجل الجلسة مدموجة؛ نجحت فحوص Markdown/89 رابطًا محليًا/الأسوار وفحص الحالة والانتقال وgit diff. لا يثبت ذلك الصحة الطبية أو ملاءمة الصورة أو تنفيذ الفحص."
    },
    {
      "id": "RAD-035",
      "title": "ملاءمة صورة Shoulder Y ومطابقة الأصل قبل اعتماده",
      "status": "review",
      "priority": "high",
      "description": "تحقق ترخيص CC0 على صفحة Y وAPI؛ الوصف يذكر انحرافًا بسيطًا وخلعًا متكررًا. صورة الأشعة المرفقة مطابقة بالبصمة لـGrashey السابق ولقطة الترخيص تخصه. يلزم فحص أصل Y وتغطيته وعلاماته وبصمته وقرار ملاءمته قبل الاستيراد؛ لم ينزّل أو يعدّل أو يخدم.",
      "source_ref": "DECISIONS.md S-SHOULDER-Y-REF-2/O92؛ مرجع Shoulder Y §8.8؛ رابط Commons المرسل من المالك"
    }
  ]
}
```
<!-- STATUS-DATA:END -->

## سجل تاريخي مختصر (لا يُحدَّث آلياً؛ المرجع الكامل في ROADMAP_SESSIONS.md وDECISIONS.md)

| المرحلة | ما حدث | المرجع |
|---|---|---|
| الجلسات 1–6 | محاكي Chest PA، تقنية، مولّد الصورة، QA، معاينة ساكنة | `session-*.md`، `DEPLOYMENT.md` |
| 7–9 | فصل الفحص/الحالة، محاذاة D7، هيكل المنصة | `ROADMAP_SESSIONS.md` |
| 10–10b | مراجع الصدر ومكتبة المصادر (توثيق فقط) | `docs/sources/REGISTER.md` |
| 11–13c | تعميم، Chest Lateral، Chest AP، تصميم المشاهد، وصفة الفحص | `session-11…13b`، `exam-recipe.md` |
| 14-0 … 14.5 | تعميم الأطراف ثم wrist وhand وelbow وknee/foot وankle | `session-14*.md` |
| S-VIS-1a/1b | جولتا وضوح بصري للأطراف | `DECISIONS.md` |
| 2026-10-13 | إنشاء هذا الملف (مراجعة 1) | هذه الجلسة |

> ملاحظة: التواريخ والقرارات الماضية تاريخ وليست مهاماً مفتوحة. وُسمت `done` فقط الأعمال المدموجة التي يوجد لها أثر قابل للفحص (اختبار/سجل git/مستند جلسة)، لا استناداً إلى العنوان وحده.
