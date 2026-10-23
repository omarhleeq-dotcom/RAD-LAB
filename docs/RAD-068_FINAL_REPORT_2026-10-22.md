# RAD-068 الجزء الأخير — تنظيف نصوص الدليل (D1/D5) وفقرة الشروط (2026-10-22)

المرجع: [قرار علامات provisional ونصوص الدليل](DECISIONS.md#provisional-evidence-owner-2026-10-22)، [قرارات ما بعد الجزء 2](DECISIONS.md#part2-acceptance-owner-2026-10-22)، [D1–D5](DECISIONS.md#ui-inventory-owner-2026-10-22)، [تقرير الجزء 3](RAD-068_PART3_REPORT_2026-10-22.md). كل نص تغيّر (قديم ← جديد) في [ملف التغييرات](RAD-068_FINAL_TEXT_CHANGES_2026-10-22.md). الترتيب بحسب S-STD-1.

## 1. الانحرافات والميزانية

- **الميزانية المعلنة:** بيانات نصية فقط في `chest-pa-erect.ts` و`chest-lateral-erect.ts` و`chest-ap-supine.ts` و`upper-limb-common.ts` (الباني الوحيد للأطراف العليا) و`lower-limb-common.ts` و`pelvis-ap-supine.ts` و`shoulder-grashey-erect.ts`؛ `messages/en.json` و`messages/ar.json` وسطر واحد في `terms/page.tsx` (عدد فقرات قسم patients من 3 إلى 4)؛ `displayed-text.test.ts`؛ الاختبارات التي تؤكد سلاسل أُعيدت كتابتها؛ لقطتا التوصيف وبصمات scene-dom؛ الوثائق. لا وحدة مشتركة منطقية ولا درجة ولا قيمة ولا قاعدة ولا رسم ولا إصدار محرك (`/6` كما هو).
- **انحراف 1 (خارج الحرف):** أُضيف تعليق شفرة في `chest-lateral-erect.ts` يحفظ اشتقاق نطاق الدوران (a = 14 سم) الذي كان نصًا معروضًا فأُزيل من الشاشة؛ لا أثر في العرض.
- **انحراف 2 (تفسير):** `completion_evidence` غير مسموح لمهمة `review` في عقد الحالة، فوُضعت تقارير الأجزاء الأربعة في `source_ref` لـRAD-068.
- **انحراف 3:** حُذفت من الشاشة جمل تسمية الخيارات التعليمية في ملاحظات الدليل بحسب القرار 2 (مثل «ENGINE TEACHING CHOICE» و«EDUCATIONAL APPROXIMATION»)، وهي أوسع من الكلمات المحظورة نصًّا؛ وأُبقيت جمل غير حالة (انظر §5 وبند 7).

## 2. المنجز والمتروك

| البند | الحالة |
|---|---|
| قرار D4 الموضَّح في DECISIONS (أول commit) | منجز |
| A: الجرد | منجز (§3) |
| B: إعادة كتابة النصوص | منجز: 74 زوج نص فريد، 229 موضعًا |
| C: فقرة الشروط EN + AR | منجز (`terms.patients.p4`) |
| D: توسيع اختبار النصوص المعروضة | منجز |
| E: لا تغيير تقييم/قيمة/رسم | مثبت (§6) |
| نقل بنود R إلى RAD-072 | منجز في project-status |
| علامات `provisional` | **لم تُمس** (قرار 1) |
| **متروك:** نصوص `note` غير المعروضة (ملف التقنية، الصورة، مستوى الفحص، ملاحظات الافتراضات) | تحمل الصياغة داخليًا؛ خارج النطاق |

## 3. الجرد (A): العدد قبل ← بعد

| ما عُدّ | قبل | بعد |
|---|---|---|
| ملاحظات الدليل المعروضة (قواعد الفحوص + النتائج الحرجة) التي تحمل provisional/validated/pending educator/physicist review/demo/awaiting/TODO وما يشبهها | **196 موضعًا (62 نصًا فريدًا)** | **0** |
| مراجع الدليل المعروضة بنفس الكلمات | 0 | 0 |
| رسائل EN/AR (`messages`) بالكلمات المحظورة (خارج assess/credits/admin/account) | 0 | 0 |
| ملاحظات الدليل في كل البيانات، معروضة أو لا (فحص أولي بصيغة أضيق) | 294 (95 فريدًا) | الجزء غير المعروض باقٍ (§2) |

**عن رقم الجزء 2 (302 / 94):** لم أستطع إعادة إنتاجه بالضبط؛ يختلف العدد بحسب التعبير النمطي وبتضمين الملاحظات غير المعروضة (قرابة 294/95 عندي بتعبير أضيق، و213/63 بتعبير أوسع على المعروض فقط، وتضم إيجابيات كاذبة). الرقم المعتمد أعلاه هو المعروض فعلًا في `ResultPanel` (`rules[].evidence` ونتائجه الحرجة `concept`/`evidence`) و`TechniqueResult` (المراجع) ويُحسب بالدالتين `publicText`/`publicReference`. المواقع: `upper-limb-common.ts` (الباني الوحيد للأطراف العليا) و`lower-limb-common.ts` و`chest-*` الثلاثة و`pelvis`/`shoulder` (ثابت `evidence` المشترك). كل نص عدّلته مرة واحدة في موضعه المشترك.

## 4. الشارة «قيمة تعليمية» حيث حُذفت الجملة (قرار 2)

الشارة تأتي من حالة الدليل `provisional` (بيانات لم تُغيَّر). **بنود فقدت جملة الاختيار التعليمي وشارتها ليست «قيمة تعليمية»** (للإبلاغ؛ لم أُضف واجهة ولم أغيّر حالة):

| الحالة المعروضة | القواعد (عدد الفحوص) |
|---|---|
| «تبسيط تعليمي» (educational-simplification) | `collimation-excess` (15)، `collimation-clipping` (10)، `centering-lateral` (14)، `centering-vertical` (13)، `rotation` للصدر PA (1) |
| «مرجع شائع / غير عالمي» (common-reference) | `sid` للصدر PA |
| «مستند إلى مصدر» (validated) | `inverse-square` (افتراض تقنية، يُعرض مرجعه فقط) |

هذه عتبات/هوامش/دقة توسيط اختيارات تعليمية بحكم القرار 2، لكن شارتها غير «قيمة تعليمية». توحيدها بند بيانات (تغيير `status`) يمس بند 1 («لا تغيير في العلامات») فلم أفعله؛ **قرار مفتوح للمالك** (§7).

## 5. الطبي والتقييم

- لا درجة ولا قيمة ولا قاعدة ولا رسم تغيّر؛ كل الاختلافات نصوص عرض (§6).
- **قاعدة إعادة الكتابة:** (أ) حُذفت كلمات الحالة؛ (ب) ما يعبّر عن عتبة/نطاق/وزن/حجم أثر/درجة نجاح كخيار للمحاكي حُذفت جملة شرحه وبقيت القيمة فقط («Margin limit: 5 cm.»، «Rotation bands: ±2 and ±5 degrees.») أو الاستشهاد بالمصدر («110–125 kV is Bontrager»)؛ (ج) بقيت جمل تحدّ ما يفعله المحاكي ولا يفعله وليست حالة: «kVp never mapped to displayed darkness»، «No patient dose is calculated»، «Feedback only: the tube angle is NOT drawn»، «The numeric score is unchanged»، «gate is a simulator rule»، وجمل افتراض المريض والاصطلاح (educational assumption/convention)؛ (د) لم تُضَف كلمات تحقق ولا «page verified».
- **ملاحظة أُبقيت وأريد رأيك فيها:** جمل «the gate is a simulator rule / not a real-world automatic reject decision» (بوابات الفحوص الحرجة)، وجمل افتراض المريض (educational assumption)، لأنها إفصاح عن سلوك المحاكي لا شرح عتبة. أزلها إن رأيتها «شرح اختيار تعليمي».
- **بقيت جمل «engine teaching choice» في نصوص التغذية الراجعة (لا الدليل)** مثل «الحدود ±2°/±5° اختيار تعليمي في المحاكي» في ملاحظات الدوران وkVp (EN وAR، حدود تفسير العبارة «hints»). لم تُمس لأنها ليست في لوحة الدليل، وهي مسوَّغة بتصميم S12-1؛ **قرار مفتوح**.
- **الفحوص الأكبر نطاقًا:** نص الدليل الذي كان «pelvis/shoulder rules[0]» صار «Clinical facts: common reference.» (لإبقاء وسم `<p>` وفق شرط تطابق الوسوم).

## 6. QA وإثبات النص فقط (S-STD-2)

**ما حُدِّث (فقط حيث تغيّر نص من هذه الدفعة):**

| الملف | المفاتيح | الإثبات |
|---|---|---|
| `scripts/qa/characterisation/chest-pa-case.json` | 17 مفتاح `evidence.note`/`concept.note` | مقارنة بنيوية مع HEAD: 0 اختلاف في المفاتيح أو الأنواع أو الأرقام؛ كل التغييرات سلاسل `note` |
| `scripts/qa/characterisation/chest-pa-scenarios.json` | 1102 ورقة، كلها `note` (1092 `evidence` و10 `concept`)، 17 زوجًا فريدًا | نفسه: 0 اختلاف بنيوي، 0 قيمة غير نصية؛ الدرجات والأحكام وبصمة الرسم والنصوص الأخرى متطابقة |
| `scripts/qa/golden/matrix.json` و`golden-image-checksums.json` | — | **لم تتغير** (لا تُحمل نصوص الدليل) |
| `scripts/qa/scene-dom/*.json` | **676 مفتاح نتيجة (بادئة result) فقط، 0 مفتاح مشهد (بادئة scene)**: hashes 136، wrist 64، hand 64، elbow 72، foot-ap 50، foot-oblique 50، knee-ap 50، knee-lateral 50، ankle-ap 42، ankle-lateral 42، pelvis 24، shoulder 32 | سُجِّل HTML كل الحالات الـ2028 قبل (HEAD، مطابق لكل بصمة مخزنة) وبعد؛ لكل المتغيّر: تسلسل الوسوم والسمات **متطابق حرفيًا** وعدد العقد النصية متطابق؛ كل عقدة نصية مختلفة تساوي ملاحظة قديمة مستبدلة بجديدتها (من قائمة 74 زوجًا) وغيرها متطابق؛ 0 غير مفسَّر |

**توقعات الاختبارات التي تغيّرت (قديم ← جديد):**

| الاختبار | قبل | بعد |
|---|---|---|
| `critical-findings.test.ts` (تصنيف النتائج الحرجة) | `evidence.note` يطابق `/PROVISIONAL \/ educational/` | `/numeric score is unchanged/` |
| `technique-scoring.test.ts` (SID 180) | `evidence.note` يطابق `/PROVISIONAL/` | `/180 cm is a common reference/` |
| `chest-ap.test.ts` (زاوية الأنبوب) | `/ENGINE TEACHING CHOICE/` | `/NOT drawn on the result image/` |
| `chest-ap.test.ts` (الدوران) | `/ENGINE TEACHING CHOICE/` | `/Bontrager gives no angle/` |
| `chest-ap.test.ts` (kVp وSID) | `/TEACHING CHOICE/` لكليهما | kvp `/110–125 kV is Bontrager/`، sid `/ACR-PORTABLE conversion/` |
| `chest-lateral.test.ts` (الدوران) | `/ENGINE TEACHING CHOICE/` وشرط «NOT أو Neither أو not a Bontrager value» | `/Bontrager gives about 1 cm of normal separation at 183 cm and no angle/` (واسم الاختبار عُدّل؛ تبقى المعادلة 2·14·sin 2° ≈ 1) |
| `chest-lateral.test.ts` (kVp وSID) | `/TEACHING CHOICE/` | kvp `/110–125 kV is Bontrager/`، sid `/MINIMUM of 72 in \(183 cm\)/` |
| `displayed-text.test.ts` | استثناء `note`/`reference`/`status` | اختبار جديد للأدلة المعروضة؛ يضيف pending educator وphysicist review وowner-verified للقائمة المحظورة؛ يستثني فقط مسار `credits` للعبارة owner-verified (حالة الترخيص في صفحة المصادر، D3) |

**الشغل:**

| الفحص | النتيجة |
|---|---|
| `npm run check` (typecheck + lint + 155 ملف اختبار، 2492 اختبارًا) | نجح؛ لم يهلك `scene-dom.test.ts` |
| `npm run build` و`build:pages` | نجحا (build:pages مع متغيري Supabase الاصطناعيين) |
| `simulator-layout-audit` (الفحوص الـ17 صراحةً، EN/AR، 1440/390) | **4252 فحصًا، 238 axe، 0 فشل** |
| `result-marker-audit` (الفحوص الـ17 صراحةً، EN/AR، 1440/390) | **510/510** مطابق |
| `ui1-pages-audit` | **136 فحصًا، 36 axe**، نجح؛ وفقرة الشروط الجديدة ظاهرة في `out/en/terms.html` و`out/ar/terms.html` (فحصتها يدويًا لأن السكربت لا يتحقق من `p4` ولم أعدّله) |
| `docs:check` و`status:check` و`git diff --check` | انظر §7 |

## 7. مفتوح (قرارات للمالك)

1. **شارات بنود الاختيار التعليمي:** الجدول في §4 (هوامش وتوسيط ودوران الصدر PA وSID) تُعرض بشارة «تبسيط تعليمي»/«مرجع شائع» لا «قيمة تعليمية». توحيدها يتطلب تغيير `status` (قرارك 1 يمنعه الآن).
2. **جمل «engine teaching choice» في نصوص التغذية الراجعة** (EN وAR): أُبقيت؛ أزلها في جلسة نص مستقلة إن شئت.
3. **جمل الإفصاح** عن البوابات الحرجة وافتراض المريض (§5).
4. **عبارات `owner-verified` في صفحة المصادر** (`credits.*`): حالة ترخيص صور (D3)، لم تُمس واستُثنيت من الاختبار؛ قل إن أردت صياغة أخرى.
5. **ملاحظات الأدلة غير المعروضة** تحمل صياغة الحالة؛ خارج النطاق.
6. كان `Teaching value` في فقرة الشروط ضمن القسم «بيانات المرضى وضوابط الاستخدام» (p4).

**سؤالا AGENTS:** (أ) هل تغيّر حكم؟ **لا**: التوضيح [بشأن D4](DECISIONS.md#provisional-evidence-owner-2026-10-22) قرار جديد من المالك يوضح "حتى RAD-019" (لا يلزم إغلاق RAD-019 إزالة العلامات) ولا يغيّر نص D4 ولا نتيجته (تبقى `provisional` داخلية ولا تُعرض). (ب) هل بقي رابط الدليل الأصلي؟ **نعم**: سطر D4 كما هو في [قرار جرد الواجهة](DECISIONS.md#ui-inventory-owner-2026-10-22) وأُلحق به رابط التوضيح، وسجل [الإغلاق](DECISIONS.md#review-closure-owner-2026-10-22) لم يُمس.

## 8. قائمة المالك (الهاتف) والجلسة التالية

1. افتح «الدليل على هذا الفحص» في 3–4 فحوص (الصدر PA، الصدر الجانبي، رسغ PA، ركبة AP، حوض أو كتف) بعد التعريض: لا «provisional» ولا «VALIDATED» ولا «pending educator review» ولا «demo» ولا «TODO»؛ المراجع (Bontrager/EC16260/AAPM) باقية؛ الشارة «قيمة تعليمية» حيث كانت.
2. في بطاقة نتيجة حرجة (مثل علامة خاطئة): افتح «الدليل»؛ الجمل المتبقية قصيرة ولا تذكر حالة.
3. صفحة الشروط (EN ثم AR): آخر نقطة في «بيانات المرضى وضوابط الاستخدام» فقرة «قيمة تعليمية».
4. سجّل رأيك في §7.

**الجلسة التالية:** RAD-072 (رسم المشاهد وبنود R)، ثم RAD-069. التفاصيل في [HANDOFF](HANDOFF.md).

## 9. الجولة الثانية: قرارات المالك على §7 (2026-10-23، على PR #112 نفسه)

القرارات مسجلة في [القسم نفسه من DECISIONS](DECISIONS.md#provisional-evidence-owner-2026-10-22). كل نص تغيّر (199 زوجًا فريدًا) في الجزء الثاني من [ملف التغييرات](RAD-068_FINAL_TEXT_CHANGES_2026-10-22.md).

1. **انحرافات/ميزانية:** نصوص بيانات في `chest-lateral-erect.ts` و`chest-ap-supine.ts` و`chest-pa-erect.ts` و`critical-common.ts` و`upper-limb-common.ts` و`upper-limb-technique.ts` و`lower-limb-common.ts` و`lower-limb-ankle-texts.ts` و`lower-limb-technique.ts` و`pelvis-ap-supine.ts` و`shoulder-grashey-erect.ts` و`pelvis-technique.ts` و`shoulder-technique.ts` وتسميتا الحالتين `cases/pelvis-ap-supine.ts` و`cases/shoulder-grashey-erect.ts`؛ الرسائل؛ `terms/page.tsx` (عدد فقرات patients من 4 إلى 6)؛ اختبارات؛ اللقطات. أُزيلت أيضًا عبارة «teaching assumption(s)» من تسمية توهين الحوض/الكتف وملاحظتي المخطط (`schematicNote`) لأنها من العائلة نفسها؛ وأُبقيت ملاحظات `technique.*.evidence.note` الداخلية غير المعروضة (قرار 5). لا تغيير في أي حالة دليل أو درجة أو قيمة أو رسم أو إصدار محرك.
2. **المنجز:** (1) فقرة الشروط p4 تغطي الشارات الثلاث؛ (2) أُزيلت «engine teaching choice» واختيار تعليمي في المحاكي من التغذية الراجعة مع إبقاء الرقم: مثل «Full credit within ±2°, partial credit within ±5°» و«درجة كاملة ضمن ±2° ودرجة جزئية ضمن ±5°»، و«100–109 and 126–150 kV earn partial credit»، و«Margin limit: X cm»؛ جمل «حد أعلى اختيار تعليمي» حُذفت تاركةً «The textbook gives only a minimum»؛ (3) حُذفت جمل البوابات؛ (4) حُذفت جمل افتراض المريض؛ فقرتان جديدتان p5 (أخطاء حرجة تعليمية لا قرار قبول/رفض سريريًا) وp6 (سلوك المريض المحاكى يتبع افتراضات تعليمية مبسّطة) EN + AR. سطر لوحة النتيجة `scoreNote` لم يُمس.
3. **الاختبار:** يمنع الآن «teaching choice(s)» و«simulator rule» و«educational assumption» (وبالعربية «اختيار/اختيارات تعليمي») في الرسائل وكل نص حالة وملاحظات الدليل المعروضة، مع استثناء `credits` فقط (لا يشمل العبارات الجديدة).
4. **توقعات اختبارات عُدّلت (قديم ← جديد):** في اختبارات الفحوص الأربعة عشر (`ankle-ap`, `ankle-lateral`, `elbow-ap`, `elbow-lateral`, `foot-ap`, `foot-oblique`, `hand-pa`, `hand-lateral`, `knee-ap`, `knee-lateral`, `pelvis-ap`, `shoulder-grashey`, `wrist-pa`, `wrist-lateral`) كل `feedback.en` كانت تطابق `/engine teaching choice/` أو `/teaching choice/` ← صارت `/partial credit/i` للدوران وkVp والزاوية، و`/textbook gives only a minimum|minimum/` لـSID؛ لا غير (عناوين الاختبارات القديمة لم تُغيَّر).
5. **اللقطات (نص فقط):** التوصيف: `chest-pa-case.json` 5 أوراق و`chest-pa-scenarios.json` 124 ورقة، كلها `note` (4+122 `evidence` و1+2 `concept`) بلا فرق بنيوي ولا قيمة غير نصية (مقارنة مع HEAD السابق). الـgoldens لم تتغير. **scene-dom:** 788 مفتاحًا تغيّرت (النتائج 676 كما قبل + مفاتيح مشاهد الحوض 48 والكتف 64 لتغيّر `rotationHelp`/`schematicNote`): تسلسل الوسوم والسمات متطابق حرفيًا في كل المفاتيح، وكل فرق نصي مفسَّر باستبدال سلسلة واحدة من السلاسل المسجلة (0 غير مفسَّر). مفاتيح scene| لم تكن في الجولة الأولى؛ هي الآن 112 (حوض/كتف فقط) وسببها نصوص المساعدة التي أُعيدت كتابتها.
6. **الفحوص:** `npm run check` نجح (155 ملفًا، 2492 اختبارًا)، `build:pages` نجح، `ui1-pages-audit` نجح (136 فحصًا، 36 axe) ومعه تحققتُ يدويًا من فقرات p4 وp5 وp6 في `out/en/terms.html` و`out/ar/terms.html`، وdocs:check وstatus:check وgit diff --check (انظر الدفع). لم أعد تشغيل `simulator-layout-audit` و`result-marker-audit` لأن التغيير نصي ولم تُطلب.
7. **سؤالا AGENTS:** (أ) هل تغيّر حكم؟ لا؛ قرارات المالك الجديدة تُنفِّذ D1/D5 وتوضّح D4 ولا تغيّر حكمًا طبيًا أو تقييميًا. (ب) الرابط إلى الدليل الأصلي باقٍ: سطر D4 وقسم القرار الموسَّع.
8. **مفتوح:** تبقى عبارة «teaching choice» في التعليقات البرمجية وملاحظات `technique.*` الداخلية (لا تُعرض)، وفي صفحة المصادر عبارة owner-verified (D3).
