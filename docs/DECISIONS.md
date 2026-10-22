# Current decisions and residual questions

Use this file for the applicable rule, [project-status](project-status.md) for task states and [AGENTS](../AGENTS.md) for workflow. Each summary links to its original authority. The [complete dated ledger](archive/decisions/DECISIONS-until-2026-10-16.md) preserves all original D/S/O identifiers, wording, sources and replaced decisions; read only the referenced record when needed. Historical instructions do not re-open implemented work.

## Active Binding Decisions

| Rule | Current application | Original authority |
|---|---|---|
| <a id="exam-freeze-current"></a> `S-SHOULDER-Y-6` | الفحوص والصور وShoulder Y مجمدة؛ الساعد مؤجل. عمل التدريب في S-MY-ATTEMPTS-1 لا يرفع هذا التجميد؛ قرارات Assess الحالية في القسم المخصص أدناه. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-shoulder-y-6) |
| <a id="xray-roadmap-current"></a> `S12-12` | X-ray v1 قبل CT/MRI/US v2، ولا يلغي ذلك التجميد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s12-12) |
| <a id="wrist-side-current"></a> `S14.1c-1` | الرسغ LEFT؛ اختيار RIGHT الأقدم مستبدل في هذا الجزء. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s14.1c-1) |
| <a id="data-and-engine"></a> `S7-1…4 / S14.1b-2` | ExamDefinition وCaseDefinition وcomposeCase؛ registries/optional mechanisms؛ renderer منفصل عن scoring. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s7-1) |
| <a id="practice-and-pilot"></a> `D1 / D3 / S-PILOT-4` | Practice منفذ؛ pilot accounts/DB استثناء معتمد من منع MVP القديم؛ Assess مؤجل، لا فتح تلقائي للنطاق. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-pilot-4) |
| <a id="assess-design"></a> `S-ASSESS-1…6` amended | التطبيق الحالي في [قرارات جلسة Assess](#assess-owner-2026-10-19): مساران مستقلان، MCQ بإجابة واحدة وأجزاء محاكي، إظهار العلامة باختيار واضع الاختبار، مجموعات ونتائج مختصرة لستة أشهر. استُبدل شرط «محاولاتي» المنفصلة؛ بقي التصحيح بالخادم وحفظ الإصدارات وحماية التدريب. التصميم معتمد؛ التنفيذ غير مأذون بهذه الدفعة. | [الأصل المحفوظ](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-assess-1)؛ سجل جلسة المالك أدناه |
| <a id="reference-and-source"></a> `S10-2 / S10b-25` | مرجع merged مع Needs قبل التنفيذ/التعميم؛ BONTRAGER-9 حاكم وO5 مراجعة provisional باقية. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s10b-25) |
| <a id="licence-authority"></a> `S10-3 / O100 / O101` | توافق تجاري وتوثيق الدليل؛ لا تعِد فحص ما قبله المالك في O100، ولا تعتبر NIH terms مثبتة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o100) |
| <a id="marker-policy"></a> `S11b-1 / S14.1c-4` | PA side-marker weight0 مع missing/wrong critical gates؛ البقية بحسب exam definition، fixed-side دون half rule. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s11b-1) |
| <a id="rotation-honesty"></a> `S13-6 / S-SHOULDER-2-6` | العلامة من result image؛ حدود one-image معلنة، O19 باقٍ، لا anatomy مخفية. تفاصيل كل أسرة في ENGINE_GUIDE. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s13-6) |
| <a id="scene-rules"></a> `S13b-1/2 / S14-0` | tokens/contrast/RTL/alternatives وحراس scene-dom؛ registries بدل flags. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s13b-2) |
| <a id="workflow-standard"></a> `S-STD-1…4` | الميزانية وQA والاختبارات والاستثناءات وScale وتنسيق الحالة محفوظة؛ نقطة العمل المشتركة AGENTS. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-std-1) |
| <a id="pilot-policy"></a> `S-PILOT-32/38/39` | قرارات consent/terms/backup تُقرأ بحدود accepted/implemented/verified، لا افتراض purge أو تحقق حي جديد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-pilot-38) |

### S-DOCS-WORKFLOW-1 — owner-authorised workflow consolidation

Owner instruction in this conversation (2026-10-16): implement the agreed simpler reading/workflow and durable checks on Draft #82. AGENTS is the one shared workflow; CLAUDE is an entry pointer. Domain rules are read by task; old decisions/plans remain evidence in the archive. Scope expressly includes documentation checker/summary scripts, their new tool tests, package commands and CI wiring; no product behaviour/tests/assets/clinical changes. This replaces duplicate workflow placement in CLAUDE/recipe without relaxing S-STD-1…4, Draft-only delivery or the current freeze. The rule summary is here; execution details belong in the [report](DOCS_WORKFLOW_REPORT.md).

### S-MY-ATTEMPTS-1 — استئناف «محاولاتي» فقط

**توضيح حالي:** هذا إذن التدريب المنفذ ومحفوظ بأدلته؛ [تعديل Assess](#assess-owner-2026-10-19) يستبدل فقط اشتراط صفحة «محاولاتي» منفصلة قبل Assess، ولا يحذف وجهة التدريب أو يعيد تنفيذها.

قرار المالك في جلسة MY-ATTEMPTS-1 (2026-10-17): استئناف عرض Practice المحفوظ وفق ترتيب [S-ASSESS-1](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-assess-1). الإذن الأول كان عرض محاولات المستخدم داخل الحساب. بعد مراجعة المسودة طلب المالك الفصل والتبسيط، ثم وافق على الاسم في «حسابي» وأمر «تمام 100% ابدا بالعمل»؛ الحكم الجاري أدناه يحل محل موقع العرض ونطاق المالك في الإذن الأول، مع بقاء أصل القرار هنا.

- الرئيسية ملخص للتدريب؛ وجهة «التدريب» تعرض «تدريبي» مجمّعًا حسب الفحص، ومحاولات مختصرة وتفاصيل تعليمية دون معرّفات تقنية. تعرض النتائج المحفوظة دون إعادة تقييم أو درجة إتقان مستحدثة. الرسم لمحاولات متوافقة في الفحص والحالة وإصدارات التقييم فقط، وتُذكر حدود الصفحة والمقارنة.
- للمالك المعتمد «متابعة المتدربين» كعرض افتراضي مستقل عن تدريبه الشخصي وإدارة الحسابات، مع بحث بالاسم/البريد وصفحات خادمية. الاسم أساسي والبريد ثانوي؛ هوية الربط تبقى user_id. إدخال الاسم عند التسجيل وتعديله من الحساب؛ الحسابات القديمة تُدعى لاستكماله دون حظر التدريب. الاسم غير فريد ولا يشترط عدد كلمات.
- لا دور مشرف الآن. تُفصل صلاحية قراءة التدريب عن نطاقها بالخادم، لتُدرس صلاحيات المشرف المحدودة أو المستقلة لاحقًا دون وراثة جميع صلاحيات المالك. لا فتح تلقائي لصلاحيات جديدة.
- البيانات Practice فقط وليست نتائج اختبار؛ Assess له نتائج ومسار مستقلان مستقبلًا، ولا تنفيذ له أو لوحة تقييم اختبار الآن. RAD-056 وO106–O108 تبقى مؤجلة ولا تمنع هذا العمل.
- العربية والإنجليزية ونمط الواجهة المعتمد وعزل المستخدمين وقراءة محدودة وترتيب ثابت. التوسعة تحتاج ترحيلًا إضافيًا للاسم ودوال القراءة وفهرسها، أُعلن ضمن ميزانية 24 ملفًا قبل التنفيذ؛ توسعت إلى 27 بإضافة إصدار الموافقة واختبارَي السلسلة أدناه. لا تطبيق إنتاج أو تغيير إعداد مزوّد. لا تغيير محاكي أو درجات أو ماركر أو مشاهد أو hashes أو توقعات قديمة لإخفاء تراجع.
- التسليم Draft PR فقط؛ الفحص محلي والهاتف الفعلي للمالك. الفحوص والصور الجديدة والتحسين البصري المستقل تبقى مؤجلة. الأدلة والمتبقي في RAD-058 ووصف PR، دون تقرير أو قائمة تحقق منفصلة. بقية الأحكام وروابط أدلتها محفوظة.

استثناء S-STD-1 المحدد: بعد بيان فشل المقارنة الحرفية للمخطط القديم وطلب الاستثناء، وجّه المالك «اكمل العمل» (2026-10-18). يُحدَّث في `migration-chain.test.ts` و`record-contracts.test.ts` فقط السماح بعمود الاسم nullable وقيده ومنحه، وتعريف مشغّل التسجيل ودالتَي التدريب الجديدتين. لا حذف ترحيلات من السلسلة ولا تغيير بيانات قديمة أو hashes أو توقعات درجات. يثبت اختبار `training.test.ts` المستقل بقاء البيانات والسياسات والدوال القديمة والمنح المحددة. إفصاح الاسم وإصدار الموافقة جزء لازم من إضافة الاسم، وليس سياسة احتفاظ جديدة.

إصلاح توافق المعاينة ضمن الإذن نفسه: بعد صور المالك وتشخيص تعارض الواجهة مع مخطط قديم، أمر المالك «ابدأ بالعمل». الميزانية18 ملفًا تشمل تصنيف أخطاء الحساب والتدريب، اختبار واجهة مقابل PostgreSQL قديم/جزئي/محدّث، وفحص SQL للقراءة فقط وحارس نشر. تسجيل `PILOT_SCHEMA_VERIFIED` يأتي بعد التحقق من المشروع ومسار الخدمة؛ يربط المشروع بمحتوى SQL، ولا يدّعي فحصًا حيًا تلقائيًا أو يأذن بتطبيق إنتاج. غيابه يحجب نشر رابط جديد. لا تغيير للترحيل أو المنح أو RLS أو توقعات الاختبارات السابقة في هذا الإصلاح. بقيت أصول القرار وأحكام الطب وAssess وDraft-only محفوظة؛ الأدلة في RAD-058 ووصف PR.

في MY-ATTEMPTS-2 (2026-10-18) طلب المالك إصلاح التعارض بين الكاتب الذي يسجل engine مجهولًا والمقارنة التي تستبعده، بميزانية معلنة15 ملفًا. الإذن يشمل بيانات هوية التقييم الجديدة واختبار الكاتب والحفظ والقراءة الفعلي ورسائل EN/AR، دون تغيير منطق النتائج أو ترحيل مطبّق أو نسب إصدار للماضي. آلية الصيانة وحدودها في [عقد هوية التقييم](PILOT_SUPABASE_SETUP.md#practice-evaluation-version). استثناء S-STD-1 الجديد والمحدد: بعد عرض فشل CI والتغيير المقترح، وافق المالك بقوله «تمام عدل» (2026-10-18). يقتصر على استيراد `PRACTICE_EVALUATION_VERSION` وتوقعه بدل `unknown` في `src/features/pilot/record-contracts.test.ts` للمحاولة الجديدة الناتجة من `evaluate`. لا تغيير لتوقعات الدرجات أو التاريخ المجهول أو CSV أو بصمة التعريف؛ ولا يمتد إذن SQL البنيوي السابق أو هذا الاستثناء إلى تعديلات أخرى. بصمة التعريف الأصلية تبقى محمية؛ احتواؤها على نصوص الحالة يجعل أثر ترجمتها على المقارنة قرار نطاق منفصلًا. لا إذن حذف في هذا الطلب: الميل لتصفير التجارب لا يعتمد النطاق أو العدد أو حذف الملاحظات المرتبطة. إفادة المالك بأن الحسابات والمحاولات والمتابعة تعمل والرسم وحده معطل هي إفادة استخدام، وليست فحص عزل سلبي حي. الدليل الجاري والمتبقي في RAD-058 ووصف المسودة؛ بقية الأحكام وروابط أصلها محفوظة.

في MY-ATTEMPTS-3 (2026-10-18) طلب المالك فصل تغييرات النص والعرض عن معنى المقارنة مع حفظ بصمة التعريف الأصلية. بعد شرح الفرق بين القديم والجديد وافق: «نعم، اعتمد الاستثناءين المحددين» ثم «تمام عدل الحارسين ضمن النطاق فقط». الاستثناء الأول في `saved-training.test.ts`: نقل فصل اختلاف البصمة الأصلية إلى التاريخ بلا هوية مستقلة، وإثبات توافق الجديد ذي الهوية الدلالية المتطابقة رغم اختلاف النص، دون تغيير الدرجات. الاستثناء الثاني في `migration-chain.test.ts`: السماح بعمود `attempts.comparison_version` وحده وقيد صيغته المسمى `attempts_comparison_version_check`؛ لا سماح بقيد NOT NULL له. الدوال القديمة والمنح والسياسات والقيم الأصلية تبقى محفوظة. تفاصيل العقد وضرورة الترحيل الإضافي في [هوية المقارنة](PILOT_SUPABASE_SETUP.md#practice-comparison-version). لا يتضمن هذا تطبيق SQL على الإنتاج أو توسيع الاستثناء إلى حارس آخر. اختار المالك جميع محاولات Practice لنطاق المعاينة فقط؛ ليس اعتماد حذف أو عدد أو نسخة أو توقيت. [إجراء التجهيز](PILOT_SUPABASE_SETUP.md#practice-optional-reset) يبقي الحسابات والأسماء والأدوار والموافقات، وينتظر catalogue حيًا وعدًّا ونسخة مجرّبة ومنع كتابة فعليًا قبل طلب حذف محدد. أصل الأحكام السابقة وروابط أدلتها باقية.


متابعة اعتماد الحارس الثالث (2026-10-18): بعد عرض فشل الاختبار وشرح العمود والدوال والحدود قال المالك «تمام ابدا العمل» مع صور فشل CI والنشر. يعتمد هذا التعديل المحدد في `src/features/pilot-db/record-contracts.test.ts` فقط: إضافة `attempts.comparison_version` إلى قائمة الأعمدة، إثبات nullable له مع بقاء بقية metadata إلزامية، وعدد الدوال الإضافية من2 إلى3 مع اسم `training_page_v1_with_comparison`. لا تغيير لتوقعات البيانات الأصلية أو الدرجات أو تعريفات الدوال القديمة أو المنح أو السياسات. لا يمتد إلى تطبيق إنتاج أو تغيير إثبات نشر أو حذف؛ الحارس يبقى فعالًا لحين إجراء التحقق للترحيل الجديد. هذا استثناء محدد إضافي بعد الاستثناءين السابقين، وليس إذنًا عامًا.


<a id="assess-owner-2026-10-19"></a>
### قرارات جلسة Assess — 2026-10-19

**المصدر:** محادثة المالك الحالية، بدءًا من «لا تعدل اي كود ... بس بدنا نتناقش»، ثم الإجابات التفصيلية، وانتهاءً بإذن «تمام ابدا بالعمل» لتحديث القرارات والخارطة والتسليم فقط. هذا سجل قرارات المالك، وليس استنتاجًا بأن منتج Assess نُفّذ. ملف `RAD-LAB_Assess_Blueprint_v0.1.md` مادة نقاش فقط بقول المالك «الملف مابعكس قرارت جديدة ... نوخذ الافضل منو»؛ وصفه الداخلي «معتمد» لا يمنح سلطة، وأعداد محتواه وأنواعه وتحليلاته ليست التزامًا. القرارات الضرورية محفوظة هنا؛ الاستئناف لا يحتاج المرفق أو ذاكرة المحادثة.

| القرار | الحكم المعتمد ودليله من المحادثة |
|---|---|
| <a id="decision-s-assess-7"></a> `S-ASSESS-7` | **المساران والمحتوى:** «مسار خاص بالفحوصات ... الفحص كامل بكل متغيراتو» مستقل عن «مسار خاص بالاسئلة المنوعة من ضمنها اسئلة اجزاء من المحاكي». البداية MCQ بإجابة واحدة، وليست multiple-response، وأجزاء المحاكي؛ المحتوى الامتحاني English فقط، وواجهة المنصة تبقى ثنائية اللغة. البنية تستقبل أنواعًا وصورًا مستقبلًا دون تنفيذها الآن. |
| <a id="decision-s-assess-8"></a> `S-ASSESS-8` | **المحاكي:** تعريض واحد لكل بند/فحص؛ يتقفل بعد التعريض مع إمكان الرجوع إليه. سؤال الجزء يختبر إعدادًا أو عدة إعدادات، ويظهر فقط ما يحتاجه الطالب من أدوات ومشهد، لا المحاكي الكامل. تُثبت بقية القيم بما يناسب الحالة وتُستبعد من العلامة. جانب Marker وموضعه أو كلاهما حسب السؤال. تبقى علامات الأجزاء من واضع الاختبار دون فرض أوزان الفحص الكامل؛ لا بوابة أخطاء حرجة خارج الجزء. حسابات التدريب ومعاييره لا تتغير ضمن الدمج. |
| <a id="decision-s-assess-9"></a> `S-ASSESS-9` | **سياسة الاختبار:** واضع الاختبار يحدد الوقت وعدد المحاولات. التنقل وتعديل الأسئلة مسموحان قبل التسليم؛ بند المحاكي لا يُعدّل بعد التعريض. غير المحلول صفر، مع تنبيه قبل التسليم اليدوي. عند انتهاء الوقت يُسلّم المحفوظ تلقائيًا. لا تلميحات أو حلول أو تصحيح كاشف أثناء الحل. المجموع وعلامات البنود إعدادات قالب بإصدار، لا ثوابت برمجية؛ التصحيح بالخادم ومفاتيح MCQ لا تصل للطالب. |
| <a id="decision-s-assess-10"></a> `S-ASSESS-10` | **النتيجة والسجل:** «اظهار العلامة فقط و يحدد ظهورها واضع الامتحان»؛ اختيار الإظهار بعد التسليم أو الحجب لكل اختبار. سجل داخل Assess بدل صفحة «محاولاتي» مستقلة، يعرض فقط اسم الاختبار، نوعه، تاريخ التسليم والعلامة إذا سُمح، وإلا النتيجة محجوبة. لا عرض رقم محاولة أو توزيع مهاري أو فتح الأسئلة/الإجابات أو مراجعة امتحان كامل. التدريب ونتائجه التفصيلية يبقيان في قسم التدريب. |
| <a id="decision-s-assess-11"></a> `S-ASSESS-11` | **الإدارة والإسناد:** المالك وحده ينشئ ويدير الاختبارات الآن؛ المشرف لاحقًا ضمن نطاقه. الاختبار لطلاب نختارهم، فرديًا أو عبر مجموعات؛ إدارة العضوية للمالك الآن والمشرف لاحقًا، لا انضمام ذاتي. قُبل اقتراح الإضافة الجماعية للطلاب المسجلين، وعضوية الطالب في عدة مجموعات، وتثبيت المستهدفين عند الإتاحة؛ تغيير العضوية لا يغير وصول اختبار منشور بصمت، ويُعدل إسناده صراحةً. استيراد القوائم ورمز طلب الانضمام امتدادات لاحقة، لا MVP. |
| <a id="decision-s-assess-12"></a> `S-ASSESS-12` | **الانقطاع:** وافق المالك على حفظ تلقائي واستكمال نفس المحاولة عند الرجوع؛ الوقت يستمر للاختبار المؤقت، والتعريض المسجّل لا يُعاد. نجاح الحفظ والتسليم يُثبت من الخادم؛ حدود الإجابات غير المتزامنة وتسليم التعريض أثناء الانقطاع قرار بروتوكول قبل التنفيذ، لا وعد بأن التخزين المحلي يثبت وقتًا موثوقًا. |
| <a id="decision-s-assess-13"></a> `S-ASSESS-13` | **الحفظ التجريبي:** «6 اشهر بدون بيانات تفصيلية ما الها داعي» ثم قبول الاحتساب من تسليم المحاولة. السجل الدائم الأدنى: هوية الطالب والاختبار وإصداره، تاريخ التسليم، العلامة ومجموعها؛ التفاصيل تُحفظ مؤقتًا للاستكمال والتصحيح ثم تُحذف بعد تثبيت النتيجة بنجاح. النتيجة تُحذف تلقائيًا بعد ستة أشهر؛ النشاط لا يمددها. لا إعادة تصحيح أو تحليل مهارات/أسئلة بعد حذف التفاصيل. مدة حفظ بيانات Practice القديمة لم تتغير. |
| <a id="decision-s-assess-14"></a> `S-ASSESS-14` | **النطاق والاستئناف:** هذه الدفعة توثيق وخارطة قابلة للاستئناف فقط، بعد مراجعة قراءة للكود. شرط «محاولاتي قبل Assess» في الترتيب القديم مستبدل بقسم السجل داخل Assess؛ لا اعتماد شامل للـBlueprint ولا بناء تحليلات/صفحة مشرف/مؤسسات أو صور وفحوص جديدة. تأجيل البرمجة في D3 باقٍ حتى استئناف صريح؛ نشر هذه الوثائق لا يثبت تنفيذًا أو طبًا أو نشرًا حيًا. |

**ما تغير عن الأصل:** S-ASSESS-1 في ترتيب «محاولاتي»؛ S-ASSESS-3 في English أولًا وتوضيح single-choice؛ S-ASSESS-4 في إمكان عرض العلامة دون الحل؛ S-ASSESS-5 في فصل الفحص الكامل عن السؤال الجزئي والظهور الانتقائي والتعريض الواحد؛ S-ASSESS-6 في استبدال الحفظ التفصيلي طويل المدة بنتيجة مختصرة. بقيت بنية القوالب والإصدارات، المالك أولًا، التصحيح بالخادم، المصادر المرخصة والمراجعة العلمية. [النص الأصلي لم يُعدّل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-assess-1).

[خطة التنفيذ والتدقيق](ASSESS_IMPLEMENTATION_PLAN.md) تفصل قرارات المنتج أعلاه عن المقترحات التقنية؛ [تقرير الدفعة](ASSESS_DOCS_REPORT_2026-10-19.md) يحفظ التحقق وحدوده. الحالة الحالية في project-status وحده.

<a id="assess-retention-owner-2026-10-20"></a>
### S-ASSESS-15 — سياسة O106 للتجربة الأولى، 2026-10-20

**السلطة:** بعد عرض الخيارات الخمسة في المحادثة قال المالك «اعتمد الخيارات». هذا اعتماد السياسة التالية، لا دليل تنفيذ أو إذن SQL/نشر/فتح بوابة. [السياسة ونص EN/AR وخطة الإنفاذ](ASSESS_RETENTION_POLICY.md) تحفظ التفاصيل والتمييز بين المعتمد والمنفذ والمتحقق.

- التجربة الأولى مؤقتة فقط؛ غير المؤقت خارجها حتى سياسة مستقلة للمتروك، دون مهلة inactivity مخترعة. مسارا mixed/full-practical والسجل والحقول الأربعة وحجب العلامة والستة أشهر التقويمية من التسليم لا تتغير.
- metadata الحجز الدنيا لحماية حد المحاولات تبقى بعد حذف النتيجة، ثم تحذف بعد إغلاق الإسناد نهائيًا وانتهاء جميع محاولاته ونتائجه ونوافذ استرداده. لا إعادة فتح للإسناد المغلق؛ الإتاحة الجديدة بإسناد جديد.
- إصدار الموافقة وتوقيتها يبقيان طوال تفعيل Assess للحساب. عند تعطيله يمنع البدء الجديد، ثم يحذف سجل الموافقة بعد تسوية بيانات المحاولات والنتائج. يمكن أن تبقى metadata أطول من ستة أشهر دون أجوبة أو علامات؛ لا عمر تقويمي آخر اختير لها.
- النسخ التي نديرها: يومية مشفرة بتداول سبعة أيام، ونسخة قبل تغيير القاعدة. تجربة استرداد قبل التشغيل وبعد تغير مؤثر في إجراء الاستعادة؛ يبقى الوصول مغلقًا بعد restore حتى إعادة تطبيق الحذف وفحص الصلاحيات. نسخ المزود تحتاج تحققًا مستقلًا، ولا وعد لها بسبعة أيام أو محو فوري.
- التصدير نتائج مختصرة فقط، بلا أجوبة أو إعدادات، وبموعد حذف النتيجة الأصلي؛ لا ستة أشهر جديدة أو نسخة دائمة بسبب التصدير.

يتبع ذلك نص موافقة بإصدار جديد وقبول صريح؛ لا إعادة ختم v1 أو تغيير النص تحت إصدارها. اعتماد السياسة لا يثبت موافقة مستخدم أو تشغيل النسخ أو purge/restore، ولا يغير Practice أو يمنح إتلاف أرشيف قائم. المتبقي تنفيذ وتجربة وضبط مزود، لا إعادة طلب هذه الخيارات. O108 وruntime والعامل والجدولة والمراقبة والنشر والاسترداد بوابات مستقلة، ولا اعتماد Blueprint أو قبول حي. لم تُختر مدد مرشحات المحتوى أو RPO/RTO أو قناة مراقبة بهذا القرار.

<a id="assess-retention-original-no-backup-2026-10-20"></a>
### متابعة S-ASSESS-15 — الأصلية الآن والنسخة الشاملة لاحقًا، 2026-10-20

بعد نتيجة الفحص المطابقة وإفادة عدم توفر نسخة حديثة مثبتة، قال المالك صراحة: «خلينا نشتغل بدون نسخة احتياطية، ما بدنا إياها خلاص، بدنا نشتغل على النسخة الأساسية»، ثم «لما نخلص كل إشي من عمل نسخة احتياطية مرة واحدة لكل السيستم». **هذا يغيّر ترتيب هذه العملية: تجهيز/تطبيق إضافة الاحتفاظ يدويًا على الأصلية vlacestfruxooznrcjqc دون نسخة حديثة مثبتة، وتأجيل نسخة شاملة واحدة إلى نهاية العمل.** لا يعاد طلب إذن النسخة قبل هذه الخطوة. لا يثبت هذا التوجيه وجود نسخة أو استرداد، ولا يجعل نسخة لاحقة وسيلة للرجوع إلى ما قبل التغيير. أوقف مسار إعداد النسخة الحالية؛ لا إتلاف لأرشيف قديم أو اتصال إدارة من الوكيل.

بقية S-ASSESS-15 أعلاه محفوظة، بما فيها سياسة التشغيل اليومية المشفرة ذات تداول سبعة أيام، وتجربة الاسترداد وحجر الوصول بعد restore والتحقق المستقل من المزود. لا يُفسر ترتيب النسخة لهذه العملية على أنه تنفيذ هذه الوسائل أو إلغاء دائم لها، ولا تُغيّر نصوص v1/v2 أو تُسجل موافقة نيابة عن مستخدم. [تقرير الحزمة اليدوية](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md) يوضح فحوصها وحدود الأدلة والمتبقي. تبقى البوابة مغلقة وPR مسودة، ولا runtime/عامل/جدولة أو إعدادات إنتاج.

<a id="assess-cloud-run-owner-2026-10-21"></a>
### اختيار استضافة Assess — Google Cloud Run، 2026-10-21 عمّان

**السلطة:** بعد مراجعة تقرير الربط قال المالك إنه اختار خطة Google، ثم حدد صراحة «Google Cloud Run». يُعتمد Google Cloud Run خيار الاستضافة في الوقت الراهن لحزمة Node24 الخاصة، بدل إبقاء المزوّد غير مختار. هذا اختيار مزوّد ضمن الإذن المحلي القائم، لا إذن إنشاء مشروع/موارد أو تفعيل فوترة أو IAM/أسرار أو SQL أو نشر/تشغيل عامل/جدولة أو فتح launch_gate. لا اعتماد تكلفة أو region أو ضمان Free من اختيار الخدمة.

[خطة المطابقة](ASSESS_CLOUD_RUN_PLAN_2026-10-21.md) تقترح Cloud Run Jobs لدفعة runAssessJobs المحدودة دون HTTP عام، وتفصل ذلك عن قرار المالك باختيار Cloud Run عمومًا. ما زالت container/entrypoint وهوية التشغيل وACL/TLS وإدارة السر والإلغاء واختبار SIGTERM/القتل/فقد الإقرار والمراقبة والتكلفة والجدولة تحتاج تجهيزًا وأدلة مستقلة. Supabase Auth/Data API للمستخدم وPages للواجهة كما هما، ولا نقل قاعدة البيانات أو انتحال مستخدم/قبول v2. S-ASSESS-15 وقرار النسخة الشاملة المؤجلة وحدود restore وO108 وبوابات القبول الحي محفوظة.

<a id="assess-trial-closeout-owner-2026-10-22"></a>
### إغلاق تجربة Assess الهندسية وقرارات ما بعدها — 2026-10-22 عمّان

**السلطة:** بعد [التقرير النهائي](ASSESS_TRIAL_FINAL_REPORT_2026-10-22.md) ناقش المالك البنود المفتوحة وقرر: (1) **النطاق** `assess.trial_scope` **يبقى فعّالًا** (`active=true`) حتى قرار مستقل بتشغيل Assess الحقيقي؛ البوابة والإسنادان وLOGIN مغلقة، وتعطيله بأمر واحد مسموح عند غياب محاولات نشطة. (2) **زر إغلاق الإسناد** في الواجهة يُؤجَّل إلى جلسة إصلاحات الواجهة الشاملة؛ يبقى إجراء console للمالك المسار المعتمد حاليًا. (3) **المراقبة والإلغاء** (قناة إنذار، إيقاف طوارئ مجرّب بما فيه إنهاء الجلسات، ومتابعة التكلفة) **شرط مسبق قبل تفعيل Assess لناس حقيقيين**، لا قبله: تُخطط وتُنفذ قبل ذلك التفعيل، ولا تُنشأ جدولة أو قناة تنبيه الآن.

**الحدود:** لا يمنح القرار إذن تشغيل أو جدولة أو فتح بوابة أو دمج #96، ولا يعتمد قبولًا شاملًا لـAssess أو RAD-056. النسخ الاحتياطي/الاستعادة والمراجعات المستقلة (O108، المصادر والتراخيص، الطبي، Marker) ودمج #96 تبقى بنودًا منفصلة بتوجيه المالك. مهام المتابعة: RAD-059 (شرط ما قبل التفعيل الفعلي) وRAD-060 (زر الإغلاق).

<a id="assess-authoring-owner-2026-10-22"></a>
### متطلبات رفع الأسئلة وترتيب المراحل بعد التجربة — 2026-10-22 عمّان

**السلطة:** بعد التجربة الهندسية ناقش المالك كيف يرفع هو أو المشرف الأسئلة وحدد:
1. **الأنواع:** اختيار من متعدد؛ إجابة كتابية حرفية يصححها الأستاذ (فرق حرف قد يغير العلامة، فيقترح النظام «تطابقًا قريبًا» ويقرر الأستاذ ولا يصحح آليًا)؛ أسئلة جزء من المحاكي بعلاماتها؛ صور. المحتوى بالإنجليزية فقط.
2. **المراجعة الطبية لمحتوى المحاكي فقط.** الأسئلة وعلاماتها مسؤولية من يرفعها، ولا مراجعة لكل سؤال حتى تُبنى طريقة عملية؛ تُسمى بيانات المراجعة في الوثيقة صراحة «من تأليف الرافع بلا مراجعة طبية» ولا يُنسب مراجع لم يراجع.
3. **دور الأستاذ/المشرف يُبنى من الصفر** (قاعدة بيانات وRLS وRPC وواجهة) مرتبطًا بالتصحيح اليدوي؛ وتُراجع سياسة الاحتفاظ لأن التفاصيل تُحذف اليوم بعد التصحيح.
4. **الصور تُنفذ ضمن مرحلة رفع الأسئلة بعد تنظيف الكود.** التخزين المقترح Supabase Storage خاص (حصة الملفات مستقلة عن القاعدة بحسب إفادة المالك: 1GB ملفات و500MB قاعدة، بانتظار تحققه من لوحة Usage). لا تخزين في GitHub/الموقع (أي طالب معتمد قد يفتح الرابط مباشرة قبل الإسناد) ولا base64 داخل الوثيقة؛ Cloudflare R2 بديل. الصور بقيود حجم ونوع ومصدر/ترخيص إلزامي وتدخل في خطة النسخ.
5. **الترتيب:** (أ) دمج #96 بتعليمة المالك الصريحة وبعد CI أخضر على آخر رأس؛ (ب) **جلسة إصلاحات الكود والواجهة مباشرة بعد الدمج** (RAD-061، وتشمل زر الإغلاق RAD-060) وتبدأ بتدقيق قراءة فقط يراجعه المالك قبل أي حذف، دون حذف أدوات الأدلة الخاملة أو تغيير توقعات/بصمات قائمة؛ (ج) رفع الأسئلة (RAD-062): أداة جدول→JSON للاختيار المتعدد، ثم الكتابي مع المشرف وشاشة التصحيح، ثم الصور، ثم واجهة الكتابة؛ (د) المراقبة والإلغاء والتكلفة (RAD-059) شرط قبل تفعيل Assess لناس حقيقيين؛ (هـ) **النسخ الاحتياطي والمراجعات المستقلة** (O108 والمصادر والتراخيص والطبي وMarker) **آخر خطوة بعد الدمج واكتمال المراحل** (RAD-063)، متسقة مع قرار النسخة الشاملة المؤجلة.

**الحدود:** لا إذن لبرمجة Assess أو تغيير الصلاحيات أو التخزين أو بدء جلسة التنظيف الآن؛ برمجة Assess تبقى مؤجلة حتى استئناف المالك الصريح، ولا دمج #96 دون تعليمته. أرقام Supabase تُثبت بعد تحقق المالك.

## Open O-items

These are **residual scope descriptions**, not a second task-status register. Owner/reviewer/waiting states come only from [project-status](project-status.md); use `npm run status:summary -- --id RAD-045` for the credits task (O102); text queries search task fields only. Partial implementation and later decisions are stated beside the item so the old ledger cannot be mistaken for current instructions.

| Item | What remains / what already changed | Original evidence |
|---|---|---|
| <a id="decision-o2"></a> `O2` | مراجعة منطقة الصدر التجريبية وملاءمة القياس؛ تبقى provisional إلى مراجعة المحتوى. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o2) |
| <a id="decision-o3"></a> `O3` | تقييم rubric الماركر سريريًا؛ PA check weight0 مع بوابات حرجة، وبقية الفحوص وفق تعريفها. لا تعميم للأوزان. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o3) |
| <a id="decision-o4"></a> `O4` | قراءة المصادر المتبقية فقط من سجل المصادر، لا إعادة قراءة ما ثبتت قراءته أو اعتبار تعليمات «قبل S12» موعدًا حاليًا. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o4) |
| <a id="decision-o5"></a> `O5` | مراجعة المعلم/الفيزيائي والنص العربي واللافتة. ليست بوابة للجلسات؛ موصى بها قبل الإصدار/التدريس (S10b-20). | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o5) |
| <a id="decision-o9"></a> `O9` | Supine AP وآلية state منفذان؛ المتبقي نطاق/تمثيل البدائل المستقبلية، لا إعادة بناء AP الحالي. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o9) |
| <a id="decision-o15"></a> `O15` | مراجعة حدود نتيجة Lateral وcritical list والتوهين2×؛ رسم المشهد لا يثبت تنفيذ overlays في صورة النتيجة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o15) |
| <a id="decision-o16"></a> `O16` | شروط NIH الرسمية ومطابقة الأصل قبل الإصدار؛ قبول الاستخدام الثانوي الحالي لا يثبت الشروط الرسمية (O101). | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o16) |
| <a id="decision-o18"></a> `O18` | صفحة الاعتمادات مدموجة (#73). تبقى SID/position label وlandscape/build وmanual enforcement بحسب النطاق؛ projection labels عولجت S13-7، لا إعادة طلبها. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o18) |
| <a id="decision-o19"></a> `O19` | قرار مستقل بشأن plan-view sign عند اختيار AP داخل PA/Lateral؛ لا تعديل ضمن تنظيف التوثيق. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o19) |
| <a id="decision-o20"></a> `O20` | تداخل عربي AP عند tube+15° وguides ON: ما زال finding مسجلًا؛ لا يُغلق بنتيجة فحص توثيق. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o20) |
| <a id="decision-o26"></a> `O26` | قيم التقنية المحلية وClark الداعم قبل الإصدار؛ الأرقام الحالية teaching choices، لا mAs target سريري. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o26) |
| <a id="decision-o27"></a> `O27` | قرار O100 اللاحق يقيّد طلب إعادة فحص الرخص القديم؛ احتفظ بحالة مصدر الدليل في سجل الأصول، دون إعادة فتح ما قبله المالك. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o27) |
| <a id="decision-o28"></a> `O28` | حد تغطية صور الرسغ عند proximal metacarpals؛ مراجعة الملاءمة/صورة أفضل مستقبلًا تحت قرار التجميد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o28) |
| <a id="decision-o29"></a> `O29` | side الحالي في markerRule على الفحص؛ case-level side مؤجل حتى وجود حالتي يمين/يسار في الفحص نفسه. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o29) |
| <a id="decision-o30"></a> `O30` | حدود العناصر غير المقيّمة في نطاق الرسغ/اليد (plane/arch/shielding/grid/coverage)؛ لا إضافة تقييم بلا قرار/مصدر. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o30) |
| <a id="decision-o31"></a> `O31` | مراجعة صلاحية تقريب دوران الرسغ من صورة واحدة، لا الادعاء بميكانيكا رسغ حقيقية. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o31) |
| <a id="decision-o32"></a> `O32` | نموذج اليد نُفّذ S14.2b-FIX-3؛ المتبقي قبول حدود التقريب عند المراجعة (O41/O46)، لا بوابة تنفيذ قديمة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o32) |
| <a id="decision-o35"></a> `O35` | صور اليد وتنظيف النص منفذان؛ المتبقي مراجعة حدود التغطية/الترميم ومصدر صياغة التعرض، مع مراعاة قرار الرخص O100. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o35) |
| <a id="decision-o36"></a> `O36` | هندسة مشهد اليد منفذة؛ المقياس/landmarks تقريبية وتحتاج مراجعة O41، لا إعادة إنشاء المشهد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o36) |
| <a id="decision-o37"></a> `O37` | الساعد مؤجل: لا صور معتمدة مناسبة لكلا المفصلين؛ لا استئناف ضمن جلسة docs. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o37) |
| <a id="decision-o39"></a> `O39` | طلب Commons التاريخي مقيد بقرار الرخص O100؛ سجّل نوع التحقق بدقة ولا تحوله إلى تحقق مستقل أو تعِد طلب الفحص المقبول. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o39) |
| <a id="decision-o40"></a> `O40` | هامش collimation أحادي الجانب في hand-lateral؛ حد تعليمي للمراجعة، لا قرار لإضافة offset جديد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o40) |
| <a id="decision-o41"></a> `O41` | مراجعة المقياس والlandmarks وترميم صور اليد باعتبارها تقديرات بصرية. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o41) |
| <a id="decision-o46"></a> `O46` | حدود thumb/capped warp/ghost copies والهندسة التقريبية لليد؛ قبول المعلم مطلوب، لا hidden anatomy. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o46) |
| <a id="decision-o47"></a> `O47` | طلب التحقق التاريخي لرخص الكوع يُقرأ مع O100؛ تبقى حدود مصدر الدليل في السجل دون إعادة فتح قرار المالك. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o47) |
| <a id="decision-o48"></a> `O48` | قبول crop/fill وآثاره في صور الكوع للمراجعة الطبية؛ لا تعديل صورة من تنظيف docs. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o48) |
| <a id="decision-o49"></a> `O49` | مقياس/landmarks/هندسة الكوع تقديرية؛ مراجعة القياس والموديل. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o49) |
| <a id="decision-o50"></a> `O50` | مراجعة حدود النتيجة للكوع: ghosting وعدم رسم concentric arcs/double ridges؛ لا ادعاء occlusion حقيقي. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o50) |
| <a id="decision-o52"></a> `O52` | قرار اتجاه كاشف elbow-lateral أو اعتماد portrait الحالي؛ عند تغيير الاتجاه يلزم نطاق بيانات/اختبارات مستقل. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o52) |
| <a id="decision-o54"></a> `O54` | كبرت guide labels في S-VIS-1b؛ المتبقي تأكيد القراءة على الهاتف، لا إعادة تنفيذ تعديل الحجم. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o54) |
| <a id="decision-o55"></a> `O55` | تقارب marker/handle في hand-PA؛ ينتظر قرار الموضع مع O74، دون تغيير موضع يؤثر في scoring الآن. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o55) |
| <a id="decision-o56"></a> `O56` | ملاحظات الرخص القديمة للركبة/القدم مقيدة بقرار O100؛ لا تجاوز لحالة owner-verified أو إعادة تحقق مقبول. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o56) |
| <a id="decision-o57"></a> `O57` | قبول osteophyte الأدنى في baseline الركبة باعتباره حدًا لصورة near-normal يحتاج مراجعة المعلم. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o57) |
| <a id="decision-o58"></a> `O58` | اختلاف flexion صورة الركبة≈45° عن target20–30° الموثق؛ مراجعة الملاءمة، لا تغيير قيمة طبية. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o58) |
| <a id="decision-o59"></a> `O59` | تأكيد ملف القدم المقصود لاختلاف الأبعاد المعلنة عن المرفق؛ قرار المالك. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o59) |
| <a id="decision-o60"></a> `O60` | قبول crop/fill وآثار إزالة Dx في صور الركبة/القدم؛ مراجعة جودة الصورة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o60) |
| <a id="decision-o61"></a> `O61` | غياب posterior calcaneus من baseline القدم؛ المنطقة المطلوبة محدودة بما يظهر، ومراجعة صورة أفضل مؤجلة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o61) |
| <a id="decision-o62"></a> `O62` | مراجعة المقياس والlandmarks ونماذج الركبة/القدم: تقديرات بصرية لا قياس. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o62) |
| <a id="decision-o63"></a> `O63` | أضيف absolute-angle control للقدم؛ زاوية الصورة الفعلية ما زالت غير مقاسة (S14.4-15)، فلا تُعرض كقياس مريض. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o63) |
| <a id="decision-o64"></a> `O64` | grid سياق في النص ولا تحكم/تقييم له؛ مراجعة المعلّم، لا بناء grid ضمن docs. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o64) |
| <a id="decision-o65"></a> `O65` | تأكيد وصف المريض من المصدر؛ قرار O100 للرخص لا يحسم age/sex أو suitability. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o65) |
| <a id="decision-o67"></a> `O67` | فرق internal leg rotation السريري عن engine tolerance التعليمي؛ مراجعة المعلّم. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o67) |
| <a id="decision-o68"></a> `O68` | تحسنت دقة wrist/knee/foot في S-VIS-1b؛ المتبقي elbow resolution وحدود العرض، لا إعادة تنفيذ المغلق. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o68) |
| <a id="decision-o69"></a> `O69` | هامش collimation في القدم أحادي الجانب؛ مراجعة الحد التعليمي أو نطاق مستقل لآلية offset. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o69) |
| <a id="decision-o70"></a> `O70` | قد تتقاطع labels/handles بعد سحب CR؛ تدقيق المحاور المحدودة لا يثبت كل حالات السحب. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o70) |
| <a id="decision-o71"></a> `O71` | معايير تشريحية لا يرسمها نموذج الركبة/القدم من صورة واحدة؛ تبقى حدودًا معلنة للمراجعة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o71) |
| <a id="decision-o73"></a> `O73` | أرقام موديل الرسغ تقديرية/gain تعليمي؛ مراجعة قبول صور الدوران. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o73) |
| <a id="decision-o74"></a> `O74` | اختيار موضع marker الافتراضي لhand-PA مع O55 ثم نطاق تحقق scoring مستقل. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o74) |
| <a id="decision-o75"></a> `O75` | طلب التحقق التاريخي للكاحل مقيد بقرار O100؛ تبقى owner-verified ولا تصبح independently verified. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o75) |
| <a id="decision-o76"></a> `O76` | جانب الكاحل LEFT مستنتج؛ يحتاج تأكيد المعلم، لا تغيير side دون دليل. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o76) |
| <a id="decision-o77"></a> `O77` | تغطية metatarsals/tarsals للكاحل ناقصة؛ تبقى المنطقة بحدود الصورة دون anatomy مختلقة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o77) |
| <a id="decision-o78"></a> `O78` | قبول baseline الكاحل (sprain history/suboptimal lateral) للمراجعة؛ لا تعديل طبي تلقائي. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o78) |
| <a id="decision-o79"></a> `O79` | ترميم artefact حافة الكاحل منفذ؛ قبول أثر الترميم للمراجعة لا مهمة ترميم جديدة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o79) |
| <a id="decision-o80"></a> `O80` | مقياس/landmarks/نموذج الكاحل تقديري؛ مراجعة المعلم. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o80) |
| <a id="decision-o81"></a> `O81` | حُددت أرقام الحوض التعليمية S-PELVIS-1-3؛ المتبقي التحقق السريري/البروتوكول المحلي تحت O5، لا اختيار أرقام ثانية. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o81) |
| <a id="decision-o82"></a> `O82` | استقلال وضع الساقين/الدوران نُفّذ S-PELVIS-1-1/2؛ راجع حدود تمثيله مع O85، لا آلية جديدة مفترضة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o82) |
| <a id="decision-o83"></a> `O83` | rubric/marker/manual/respiration منفذة S-PELVIS-1 و2؛ المتبقي مراجعتها طبيًا، لا أنها قرارات غير موجودة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o83) |
| <a id="decision-o84"></a> `O84` | الصورة والتنظيف/provenance مستوردة وموثقة؛ تبقى الملاءمة والتغطية للمراجعة الطبية (RAD-029). | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o84) |
| <a id="decision-o85"></a> `O85` | موديل الحوض منفذ S-PELVIS-1-4؛ المتبقي قبول حدوده البصرية وعدم إعادة بناء anatomy مخفية. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o85) |
| <a id="decision-o86"></a> `O86` | تحديث دليل shielding قبل تقديم نصيحة سريرية؛ لا تحكم أو scoring جديد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o86) |
| <a id="decision-o88"></a> `O88` | أرقام/هندسة الكتف محددة S-SHOULDER-3-3/4؛ المتبقي مراجعة سريرية/معايرة محلية، لا نقص تنفيذ. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o88) |
| <a id="decision-o89"></a> `O89` | detector24×30/landscape وfixed R/manual/rubric منفذة S-SHOULDER-3؛ افتراض قبول بقية الشرح محفوظ كما سجل، والمراجعة الطبية باقية. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o89) |
| <a id="decision-o90"></a> `O90` | numeric margins/gain/cap للكتف حُددت S-SHOULDER-3-3؛ يبقى صدق/ملاءمة التقريب للمراجعة، دون gate جديدة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o90) |
| <a id="decision-o91"></a> `O91` | ملاءمة سياق/تغطية/ميل baseline Grashey للمراجعة؛ هوية/رخصة/master حُسمت في O87/RAD-032. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o91) |
| <a id="decision-o92-2"></a> <a id="o92-current"></a> `O92` | Y original مفحوص/hash-matched؛ المتبقي اختيار المالك لصورة مقبولة ومراجعة الملاءمة؛ الفحص مجمد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o92-2) |
| <a id="decision-o93"></a> `O93` | نطاق/معايرة/قواعد Y مؤجلة؛ لا نقل defaults من Grashey أو الحوض. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o93) |
| <a id="decision-o94-2"></a> <a id="o94-current"></a> `O94` | بوابة نموذج Y لم تمر؛ absolute-angle convention غير محسومة، ولا تنفيذ دون استئناف صريح. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o94-2) |
| <a id="decision-o95"></a> `O95` | هندسة/margins/marker position للكتف بالعين؛ مراجعة المعلّم/الفيزيائي مع O88؛ لا قياس جديد مفترض. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-shoulder-3-4) |
| <a id="decision-o96"></a> `O96` | تأكيد المالك لافتراض قبول erect-only/arm distractors/dead band كما سجّل S-SHOULDER-3-1؛ لا إعادة طلب اعتماد الواجهة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-shoulder-3-1) |
| <a id="decision-o97"></a> `O97` | marker Y مؤجل مع الفحص. وضع Grashey الحالي يُقرأ من S-SHOULDER-3-1، لا يعاد كأنه لم ينفذ. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o97) |
| <a id="decision-o98"></a> `O98` | مراجعة الحوض: round1 للرسم/الماركر منفذة؛ ينتظر وصف أي عيوب إضافية من المالك، لا فتح كل عمل الحوض. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o98) |
| <a id="decision-o101"></a> `O101` | **DEFERRED by the owner** — شروط NIH/A-008 مؤجلة إلى ما قبل الإصدار؛ يبقى وسم مصدر التحقق كما قبله المالك. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o101) |
| <a id="decision-o102"></a> `O102` | صفحة الاعتمادات/التذييل مدموجان #73 وفق S-CREDITS-4؛ المتبقي result captions مؤجلة باختيار المالك S-CREDITS-3، لا إعادة طلب دمج الصفحة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o102) |
| <a id="decision-o103"></a> `O103` | أسئلة pilot الأصلية لها إجابات/تنفيذ لاحق؛ طبّق S-PILOT-4/6/30/32/38 وحالة المهام، وتبقى provider/retention facts غير المثبتة فقط؛ لا إعادة دعوة أو SMTP setup قديم. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o103) |
| <a id="decision-o104"></a> `O104` | CSP inline scripts مع جلسات المتصفح مخاطرة موثقة؛ لا ادعاء tightening منفذ أو permission لتعديل سياسة ضمن docs. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o104) |
| <a id="decision-o105"></a> `O105` | نسخة/restore المالك مثبتة بحدود S-PILOT-38؛ تبقى audit-log availability وAccess limits وغيرها منفصلة. لا إغلاق كامل أو افتراض أن backup تتحدث ذاتيًا. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o105) |
| <a id="decision-o106"></a> `O106` | قرارات [حفظ النتائج](#decision-s-assess-13) وتقليل البيانات محفوظة، واعتمدت سياسة التجربة الأولى وmetadata والنسخ والتصدير في [S-ASSESS-15](#assess-retention-owner-2026-10-20). المتبقي إنفاذها بنسخة موافقة جديدة وتجربتها والتحقق من نسخ المزود والاسترداد؛ ليس اعتماد السياسة دليل تشغيل أو تغيير Practice. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o106) |
| <a id="decision-o107"></a> `O107` | حُسمت إعدادات الوقت والمحاولات والتعريض والتنقل في [سياسة الاختبار](#decision-s-assess-9). المتبقي بروتوكول الخادم للانقطاع والمهلة والتزامن ومنع تكرار التعريض والتسليم؛ لا إعادة طلب القرارات المحسومة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o107) |
| <a id="decision-o108"></a> `O108` | مصادر أسئلة البداية وتوثيق تراخيصها ومراجعها وتكليف المراجعين لم تُحدد. Blueprint ليس اعتماد بنك أو لجنة أو أسئلة؛ لا نشر محتوى قبل الدليل والمراجعة، وفق S-ASSESS-3 المتبقي. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o108) |

## Closed O-items

Closed question texts and their scope/evidence are retained in the [closed-question ledger](archive/decisions/DECISIONS-until-2026-10-16.md#closed-o-items). O38 is explicitly CLOSED in its original row; O87 identity/licence/master was resolved and imported (RAD-032), while clinical suitability remains O91. These do not belong to a new work queue. Partial items above never imply whole-task closure.

## Superseded records

[Replaced order and older O92/O94 snapshots](archive/decisions/DECISIONS-until-2026-10-16.md#superseded-records). Partial amendments such as D3, marker defaults and rotation conventions retain their surviving rules; authoritative family details are linked from [ENGINE_GUIDE](ENGINE_GUIDE.md) and [recipe](exam-recipe.md). No historical decision is discarded merely because it is old.
