# RAD-062 — المرحلة4أ، 2026-10-30

## 1. الانحرافات والميزانية

إذن المالك في هذه الجلسة يستأنف4أ فقط من [صف4أ في خطة #156](RAD-060_RAD-062_RECONCILIATION_2026-10-29.md). لا SQL أو migration أو يوم قاعدة أو إجراء حي. الميزانية14ملفًا، منها التقرير وproject-status وHANDOFF؛ وحدتان مشتركتان: data-guards وRunnerView. الفصل بين التنظيف وF4 بالتزامات مستقلة، مع commit/push عند كل محطة. Draft فقط، والأتمتة المعتادة مسموحة وفق [القرار](DECISIONS.md#pr-automation-owner-2026-10-29).

الملفات المقررة: `src/features/assess/{data-guards.ts,runner-data.ts,history-data.ts,admin-data.ts,owner-assignments.ts,RunnerView.tsx,AssessPanel.tsx,FullPracticalRunner.tsx}`، و`src/features/deployment/frontend-schema.test.ts`، و`scripts/pages/frontend-schema.json`، و`scripts/qa/assess-phase4a-audit.mjs`، والوثائق3 أعلاه. تعديل fixture هو إضافة نسخ اعتماد مستخرج فقط؛ جميع assertions والتوقعات القديمة محفوظة.

## 2. المنجز والمستبعد

المحطة الأولى: CLN-035/036 مكتملان محليًا؛ F4 والتحقق النهائي قيد التنفيذ في المحطة التالية. لا تنفيذ للكتابي أو P2 أو الصور أو Manage targets أو تغيير بوابات/Variables/عامل. لا تغيير Practice أو المصححات أو نتائج أو مراجع ذهبية.

## 3. بحسب المهمة

- CLN-035: الحارسان object/UUID في data-guards، واستيراد النسخ المتطابقة سلوكيًا في runner/history/admin/owner-assignments. إعادة التصدير من runner-data تحفظ المستهلكين الحاليين. حراس النصوص/الأخطاء/الحدود المختلفة تبقى في أصحابها؛ حراس الخادم خارج نطاق الواجهة.
- CLN-036: RunnerView يستخرج beforeunload وموعد recover المؤسس على وقت الخادم والحالة/التأكيد وشريط الأسئلة والتسليم والخروج؛ useRunnerController يشترك في mounting/disposal فقط. لا نسخ أو تعديل AttemptController أو حساب unresolved أو المنافذ.
- F4: ينتظر المحطة الثانية؛ [قرار F4](DECISIONS.md#ui-inventory-owner-2026-10-22) يفرق بين تبويبات إعداد Assess الإجبارية وتنقل الأسئلة المسموح وPractice الحر.
- RAD-062: in_progress/waiting_on code لهذا النطاق؛ بقية قرارات المرحلة2 وManage targets للمغلق وإعادة تقدير4ب باقية خارج الإذن.

## 4. المشترك وScale وبرهان الثبات

أجسام الحارسين المنقولة من runner-data حرفية. تعابير UUID القديمة في النسخ الأخرى لها نفس مجموعات ASCII والأطوال والفواصل وراية i؛ لا تقييد version/variant جديد. قورنت36,968نتيجة بين القديم والجديد، تشمل كل استبدال ASCII في كل موضع UUID والقيم غير النصية وأشكال object. قارنت أداة المحطة36حالة عرض EN/AR بين الأصل الثابت d138bf7 والتنظيف: تطابق بايتي بعد توحيد useId المولد من React فقط، مع حفظ ارتباط المعرّفات؛ حالات loading/error/conflict/saved/dirty/pending/busy/locked/closed للمسارين. JSX الأسئلة وضبط الأدوات وpayloads لم تُحرر؛ lifecycle المنقول له نفس شروط beforeunload وdependencies ومهلة deadline+100، وعمليات flush/navigate/recover/submit هي نفس controller بلا تغيير.

المنافذ وأسماء/معاملات RPCs ثابتة؛ مقارنة graph.calls قبل/بعد حرفية. القراءات المصحفة وسقوف100/200/64KiB لم تتغير. لا قائمة فحوص ثابتة جديدة أو حد حجم جديد.

بصمات browserBoundaries تتغير بسبب استخراج المصدر في runner-data/history-data/admin-data/owner-assignments/AssessPanel؛ بقية pins وrequiredMigrations/checks لا تتغير. marker للأصلية **باقٍ**: `pilot-v1:6d690343c1ce5e95221d9e67eda65b62dc552ac0e95e78cf41074bc069bfc1be`. لا حاجة إلى تغيير PILOT_SCHEMA_VERIFIED أو ضبطه من المالك؛ هذا لا يدعي إعادة تحقق حي.

**هل تغيّر الحكم؟** لا؛ تنفيذ4أ أصبح مأذونًا بأمر المالك الحالي، وF4 والقواعد القائمة لم تُعد صياغتها في سجل القرارات. **هل بقي رابط الدليل الأصلي؟** نعم؛ روابط [F4](DECISIONS.md#ui-inventory-owner-2026-10-22) و[القرارات](DECISIONS.md#rad062-phase2-owner-2026-10-29) و[خطة #156](RAD-060_RAD-062_RECONCILIATION_2026-10-29.md) وأدلة الحالة محفوظة.

## 5. الطب والتقييم

لا تغيير طبي أو scoring/grading/results أو expectations أو hashes الاختبارات أو goldens أو characterisation. pins المصدر في frontend-schema هي وحدها بصمات المراجعة المتغيرة وليست توقعات تقييم. لا صور أو مصادر أو ادعاء تحقق سريري.

## 6. QA

المحطة الأولى:43اختبارًا ناجحًا في runner-state/practical-state/history-data/admin-data/owner-assignments/frontend-schema. الأمر `node scripts/qa/assess-phase4a-audit.mjs --refactor-proof` نجح بالمقارنات أعلاه. lint الموجه وdocs:check (دون أخطاء/تحذيرات مراجعة) وstatus:check وgit diff --check نجحت؛ full check/build مرة واحدة بعد F4، والمتصفح EN/AR390/1440 وaxe وqa:exam-audit لم تُنفذ بعد. لا qa:golden أو qa:characterise.

## 7. المفتوح

F4 والتحقق النهائي في المحطة الثانية؛ فحص المالك بعد الدمج منفصل. launch_gate مغلقة، لذلك لا ندعي أن runner متاح من الموقع المنشور، ولا نفتحها لتصويره. لا تغيير حي أو SQL من هذه المرحلة. بقية RAD-062 تحتاج نطاقًا وإذنًا مستقلين؛ حاجب طوارئ RAD-059 وO4/المراجعة/الحقوق باقٍ.

## 8. قائمة المالك وبرومبت المتابعة

بعد الدمج والتحقق من ظهور النسخة المنشورة المعتادة على الهاتف: افتح المكتبة ثم Chest PA ثم Practice بالعربية، وابدأ الحالة؛ المس التقنية مباشرة قبل إكمال الوضعية، وتحقق أن التنقل حر وأن الناقص عليه نقطة. عد إلى التوسيط ثم المريض ثم الوضعية، وغيّر إعدادًا وارجع للتقنية وتحقق من بقائه. كرر بالإنجليزية، ثم افحص عرض سطح المكتب1440 وعدم وجود wizard. لا يلزم إنشاء حساب/إسناد أو امتحان حي لهذا الفحص؛ التعريض التدريبي إن نُفذ للمقارنة لا يثبت Assess.

**غير الممكن الآن على المنشور:** بدء محاولة Assess وتشغيل تبويباتها الإجبارية والتعريض والاستكمال/التسليم لا يمكن تأكيدها مع launch_gate مغلقة وغياب إسناد صالح؛ لا تنشئ إسنادًا ولا تفتح البوابة للفحص. دليل هذا الجزء محلي اصطناعي فقط. بعد إذن تجربة مستقل وتجهيزها لاحقًا: افتح simulator-part وfull-practical مسندين، تحقق من منع تجاوز تبويب غير مزور، Next واحدًا واحدًا، الرجوع دون فقد الإعدادات، حرية تغيير السؤال والعودة، التعريض مرة واحدة وقفل ما بعد refresh، ورسائل الحفظ والتأكيد والانقضاء. لا تعتبر هذه الخطوات إذن تشغيل الآن.

برومبت المتابعة: «اقرأ AGENTS والحالة وتقرير4أ وGitHub؛ أكمل المحطة الثانية F4 ضمن14ملفًا، ثم QA المطلوبة وDraft فقط. لا SQL أو يوم قاعدة أو تغيير حي، ولا توسعة لبقية RAD-062 أو فتح gate. حافظ على الأتمتة المعتادة، ولا تغيّر expectations أو goldens أو characterisation».
