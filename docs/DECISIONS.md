# Current decisions and residual questions

Use this file for the applicable rule, [project-status](project-status.md) for task states and [AGENTS](../AGENTS.md) for workflow. Each summary links to its original authority. The [complete dated ledger](archive/decisions/DECISIONS-until-2026-10-16.md) preserves all original D/S/O identifiers, wording, sources and replaced decisions; read only the referenced record when needed. Historical instructions do not re-open implemented work.

## Active Binding Decisions

| Rule | Current application | Original authority |
|---|---|---|
| <a id="exam-freeze-current"></a> `S-SHOULDER-Y-6` | الفحوص والصور وShoulder Y مجمدة؛ الساعد مؤجل. تأجيل البرمجة الحالية محفوظ في HANDOFF. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-shoulder-y-6) |
| <a id="xray-roadmap-current"></a> `S12-12` | X-ray v1 قبل CT/MRI/US v2، ولا يلغي ذلك التجميد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s12-12) |
| <a id="wrist-side-current"></a> `S14.1c-1` | الرسغ LEFT؛ اختيار RIGHT الأقدم مستبدل في هذا الجزء. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s14.1c-1) |
| <a id="data-and-engine"></a> `S7-1…4 / S14.1b-2` | ExamDefinition وCaseDefinition وcomposeCase؛ registries/optional mechanisms؛ renderer منفصل عن scoring. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s7-1) |
| <a id="practice-and-pilot"></a> `D1 / D3 / S-PILOT-4` | Practice منفذ؛ pilot accounts/DB استثناء معتمد من منع MVP القديم؛ Assess مؤجل، لا فتح تلقائي للنطاق. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-pilot-4) |
| <a id="reference-and-source"></a> `S10-2 / S10b-25` | مرجع merged مع Needs قبل التنفيذ/التعميم؛ BONTRAGER-9 حاكم وO5 مراجعة provisional باقية. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s10b-25) |
| <a id="licence-authority"></a> `S10-3 / O100 / O101` | توافق تجاري وتوثيق الدليل؛ لا تعِد فحص ما قبله المالك في O100، ولا تعتبر NIH terms مثبتة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o100) |
| <a id="marker-policy"></a> `S11b-1 / S14.1c-4` | PA side-marker weight0 مع missing/wrong critical gates؛ البقية بحسب exam definition، fixed-side دون half rule. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s11b-1) |
| <a id="rotation-honesty"></a> `S13-6 / S-SHOULDER-2-6` | العلامة من result image؛ حدود one-image معلنة، O19 باقٍ، لا anatomy مخفية. تفاصيل كل أسرة في ENGINE_GUIDE. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s13-6) |
| <a id="scene-rules"></a> `S13b-1/2 / S14-0` | tokens/contrast/RTL/alternatives وحراس scene-dom؛ registries بدل flags. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s13b-2) |
| <a id="workflow-standard"></a> `S-STD-1…4` | الميزانية وQA والاختبارات والاستثناءات وScale وتنسيق الحالة محفوظة؛ نقطة العمل المشتركة AGENTS. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-std-1) |
| <a id="pilot-policy"></a> `S-PILOT-32/38/39` | قرارات consent/terms/backup تُقرأ بحدود accepted/implemented/verified، لا افتراض purge أو تحقق حي جديد. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-s-pilot-38) |

### S-DOCS-WORKFLOW-1 — owner-authorised workflow consolidation

Owner instruction in this conversation (2026-10-16): implement the agreed simpler reading/workflow and durable checks on Draft #82. AGENTS is the one shared workflow; CLAUDE is an entry pointer. Domain rules are read by task; old decisions/plans remain evidence in the archive. Scope expressly includes documentation checker/summary scripts, their new tool tests, package commands and CI wiring; no product behaviour/tests/assets/clinical changes. This replaces duplicate workflow placement in CLAUDE/recipe without relaxing S-STD-1…4, Draft-only delivery or the current freeze. The rule summary is here; execution details belong in the [report](DOCS_WORKFLOW_REPORT.md).

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
| <a id="decision-o101"></a> `O101` | شروط NIH/A-008 مؤجلة إلى ما قبل الإصدار؛ يبقى وسم مصدر التحقق كما قبله المالك. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o101) |
| <a id="decision-o102"></a> `O102` | صفحة الاعتمادات/التذييل مدموجان #73 وفق S-CREDITS-4؛ المتبقي result captions مؤجلة باختيار المالك S-CREDITS-3، لا إعادة طلب دمج الصفحة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o102) |
| <a id="decision-o103"></a> `O103` | أسئلة pilot الأصلية لها إجابات/تنفيذ لاحق؛ طبّق S-PILOT-4/6/30/32/38 وحالة المهام، وتبقى provider/retention facts غير المثبتة فقط؛ لا إعادة دعوة أو SMTP setup قديم. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o103) |
| <a id="decision-o104"></a> `O104` | CSP inline scripts مع جلسات المتصفح مخاطرة موثقة؛ لا ادعاء tightening منفذ أو permission لتعديل سياسة ضمن docs. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o104) |
| <a id="decision-o105"></a> `O105` | نسخة/restore المالك مثبتة بحدود S-PILOT-38؛ تبقى audit-log availability وAccess limits وغيرها منفصلة. لا إغلاق كامل أو افتراض أن backup تتحدث ذاتيًا. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o105) |
| <a id="decision-o106"></a> `O106` | مدة حفظ/موافقة نتائج Assess تحتاج قرارًا قبل تخزينها؛ المرحلة البرمجية مؤجلة. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o106) |
| <a id="decision-o107"></a> `O107` | عدد المحاولات/time expiry/question exposure لAssess يحتاج حسمًا؛ لا تنفيذ ضمن docs. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o107) |
| <a id="decision-o108"></a> `O108` | مصادر وترخيص question banks ومالك المراجعة غير محددة؛ لا استيراد مفترض. | [السجل](archive/decisions/DECISIONS-until-2026-10-16.md#decision-o108) |

## Closed O-items

Closed question texts and their scope/evidence are retained in the [closed-question ledger](archive/decisions/DECISIONS-until-2026-10-16.md#closed-o-items). O38 is explicitly CLOSED in its original row; O87 identity/licence/master was resolved and imported (RAD-032), while clinical suitability remains O91. These do not belong to a new work queue. Partial items above never imply whole-task closure.

## Superseded records

[Replaced order and older O92/O94 snapshots](archive/decisions/DECISIONS-until-2026-10-16.md#superseded-records). Partial amendments such as D3, marker defaults and rotation conventions retain their surviving rules; authoritative family details are linked from [ENGINE_GUIDE](ENGINE_GUIDE.md) and [recipe](exam-recipe.md). No historical decision is discarded merely because it is old.
