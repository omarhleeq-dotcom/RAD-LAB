# Arabic terminology — for educator review

> **Status (S10b-20, 2026-10-06):** the owner-proposed corrections (last section) are **owner-approved, to apply in a UI text session**; **all other listed terms are accepted by the owner**. No UI string was changed. Educator review is recommended before release or teaching students, not a gate.

All Arabic in RAD-LAB (UI in `messages/ar.json`, case text in `src/data/cases/*`) was drafted with machine assistance and has **not** been reviewed by a radiography educator. Please confirm or correct each term (final column) — then update both files. Left/right wording is always *the viewer's side of the displayed image* ("يمين/يسار المشاهد", "عرض الكاسيت"), never the patient's.

| English | Current Arabic | Where | Question for the reviewer | OK? |
|---|---|---|---|---|
| Positioning | الوضعية | score category | «وضع المريض» أدق؟ | |
| Rotation | الدوران | category / rule | «الميلان» أم «الدوران»؟ | |
| Centering | التوسيط | category | | |
| Exposure / technique | التعريض / العوامل الفنية | category | | |
| SID / setup | SID / التجهيز | category | استخدام «المسافة بين المصدر والكاسيت» بالكامل؟ | |
| Breathing | التنفس | category | | |
| Projection / view | الإسقاط / المنظر | console | | |
| PA erect / AP erect | PA وقوفًا / AP وقوفًا | console | إبقاء الاختصار لاتينيًا؟ | |
| Central ray | الشعاع المركزي | positioning | | |
| Collimated field / collimation | المجال المحدَّد / التحديد | positioning | «المُسدِّد/الكوليميتر»؟ | |
| Detector / Bucky | الكاسيت / البكي | positioning | الكاشف الرقمي ≠ الكاسيت (DR) | |
| Side marker | علامة الجانب | positioning | | |
| Detector view as displayed (patient's left on the viewer's right) | عرض الكاسيت كما يظهر في الصورة (يسار المريض على يمين المشاهد) | positioning | | |
| Lung apices | قمم الرئتين | feedback | | |
| Costophrenic angles | الزوايا الضلعية الحجابية | feedback | | |
| Scapulae | اللوحان / لوحا الكتف | feedback | | |
| Spinous processes / medial clavicle ends | النتوءات الشوكية / النهايتان الإنسيتان للترقوتين | rotation feedback | | |
| Hemithorax, transradiancy | نصف الصدر، الشفافية الإشعاعية | effect cards | مصطلح «transradiancy» غير مستقر | |
| Inspiration / reduced inspiration | الشهيق / شهيق غير كافٍ | breathing | | |
| Diaphragm | الحجاب الحاجز | feedback | | |
| Motion / loss of sharpness | الحركة / فقدان الحدّة | effect cards | | |
| Quantum noise | الضجيج الكمّي | technique | | |
| Detector exposure | تعريض الكاشف | technique | | |
| Deviation index (DI) | مؤشر الانحراف | technique | | |
| Exposure index / target (EI / EIT) | EI / EIT (لاتيني) | technique | | |
| Dose awareness / dose creep | الوعي بالجرعة / زحف الجرعة | technique | | |
| Penetration | الاختراق | technique | | |
| AEC / chambers | AEC / حجرات الاستشعار | console | | |
| Manual | يدوي | console | | |
| Educational visual approximation | تقريب بصري تعليمي | effect cards | | |
| Evidence classes | مثبت · مرجع شائع / غير عالمي · يعتمد على الجهاز / البروتوكول المحلي · تبسيط تعليمي · مؤقت | evidence badges | تأكيد المقابلات الخمسة | |
| Educational pass mark | درجة النجاح التعليمية | result | | |
| Not drawn in this image | غير مرسومة في هذه الصورة | result | | |
| Educational prototype — not for clinical use; values pending educator/physicist review | نموذج تعليمي أولي — ليس للاستخدام السريري؛ القيم بانتظار مراجعة مدرّس أو فيزيائي طبي | preview banner (every page) | «مدرّس» أم «معلّم/أستاذ»؟ «فيزيائي طبي» مناسب؟ | |

## Session 8 — feminine forms for the female case (D7; machine-drafted, not yet reviewed)

The patient-instruction and patient-description strings agree with the case's sex (ICU `select` in `messages/ar.json`; masculine is the `other` branch). Please confirm each:

| English | Female (current) | Male (unchanged) | Where | OK? |
|---|---|---|---|---|
| "Take a deep breath in and hold it." | «خذي شهيقًا عميقًا واحبسي نفسك.» | «خذ شهيقًا عميقًا واحبس نفسك.» | patient instructions | |
| "Breathe out and hold it." | «أخرجي الزفير واحبسي نفسك.» | «أخرج الزفير واحبس نفسك.» | patient instructions | |
| "Breathe normally." | «تنفّسي بشكل طبيعي.» | «تنفّس بشكل طبيعي.» | patient instructions | |
| "Stay still and don't move until I tell you." | «ابقَي ثابتة ولا تتحركي حتى أخبرك.» | «ابقَ ثابتًا ولا تتحرك حتى أخبرك.» | patient instructions | |
| "Relax — you can move normally." | «استرخي — يمكنك التحرك بشكل طبيعي.» | «استرخِ — …» | patient instructions | |
| "{sex}, {age} years old" | أنثى عمرها {age} عامًا | ذكر عمره {age} عامًا | home card | |
| "…able to stand and follow breathing instructions" | قادرة على المشي والوقوف واتباع تعليمات التنفس | قادر … | case description | |
| "Stable… The patient has arrived slightly turned…" | حالتها مستقرة … وصلت المريضة وهي مائلة قليلًا … | حالته … وصل المريض وهو مائل … | case condition | |
| "the simulated patient (female / male)" | المريضة المحاكاة (لم تأخذ شهيقًا / تحركت) | المريض المحاكى | effect cards | |
| Generic "the patient" in headings / labels / rule feedback | المريض (unchanged) | المريض | many | generic noun — keep, or make sex-aware? |

## Session 9 — platform shell (new, flagged for educator review)
| English | Current Arabic | Where | Question for the reviewer | OK? |
|---|---|---|---|---|
| X-ray (modality) | الأشعة السينية | catalogue card | «الأشعة السينية» أم «التصوير الشعاعي»؟ | |
| CT (modality) | التصوير المقطعي المحوسب | catalogue card (coming soon) | «الأشعة المقطعية» أشيع؟ | |
| MRI (modality) | التصوير بالرنين المغناطيسي | catalogue card (coming soon) | | |
| Ultrasound (modality) | التصوير بالموجات فوق الصوتية | catalogue card (coming soon) | «السونار»؟ | |
| Practice (mode) | التدريب | exam hub, breadcrumb | | |
| Exams / Cases | الفحوص / الحالات | modality and exam pages | «الفحوصات»؟ | |
| Choose an imaging modality | اختر نوع التصوير | home | | |
| Home / Breadcrumb / Skip to main content | الرئيسية / مسار التنقل / انتقل إلى المحتوى الرئيسي | shell | | |
| Loading… | جارٍ التحميل… | shell | | |
| Page not found (+ body) | الصفحة غير موجودة / تعذّر العثور على هذه الصفحة. قد يكون الرابط خاطئًا أو قديمًا. | 404 | | |
| Case not found (+ body) | الحالة غير موجودة / لا توجد في هذا الفحص حالة بهذا المعرّف. ارجع إلى الفحص لاختيار إحدى حالاته. | unknown `?case=` | | |
| Back to the exam | العودة إلى الفحص | not-found | | |
| This page has moved (+ body, link) | انتقلت هذه الصفحة / جارٍ نقلك إلى العنوان الجديد لهذا الفحص. / المتابعة إلى الفحص | old-URL stub | | |
| Practice mode blurb | ضع المريض، اضبط عوامل التعريض، أجرِ التعريض، ثم تعلّم من تغذية راجعة دقيقة ودرجة. | exam hub | يستخدم المذكّر العام للمتعلّم (كالنص الرئيسي الحالي) | |

The shell strings are addressed to the learner, not the patient, so none is sex-aware; patient-facing Arabic still comes from the case (S8-1).

## Session 10 — Chest Lateral (proposed terms — **pending educator review**; NOT used anywhere in the UI)
Machine-assisted proposals so the Lateral exam (Session 12) starts from a reviewed list. No existing string in `messages/*.json` or case data was changed. Left/right wording stays "the viewer's side of the displayed image" unless a term explicitly names the patient's side. The anterior / posterior directions of a lateral display and the marker rule are open owner decisions (O6, O7) — do not fix wording for them yet.

| English | Proposed Arabic | Intended use | Question for the reviewer | OK? |
|---|---|---|---|---|
| Lateral projection / lateral chest | الإسقاط الجانبي / صدر جانبي | exam title, console | «الوضع الجانبي» أم «الإسقاط الجانبي»؟ | |
| Left lateral / right lateral | جانبي أيسر / جانبي أيمن | projection options (O7) | هل يُسمّى بجانب المريض الأقرب إلى الكاسيت؟ | |
| True lateral | جانبي حقيقي (تام) | rotation feedback | | |
| Obliquity (departure from true lateral) | الميلان عن الوضع الجانبي الحقيقي | rotation feedback | هل «الميلان» أم «الدوران» كما في PA؟ | |
| Midsagittal plane | المستوى السهمي المنصِّف | positioning | | |
| Anterior / posterior | الأمامي / الخلفي | positioning, image | | |
| Side against the detector | الجانب الملاصق للكاسيت | positioning control (if kept) | | |
| Arms raised above the head | رفع الذراعين فوق الرأس | arm-position control | | |
| Humeri (upper-arm bones) | عظما العضد | feedback | | |
| Superimposition / overlap | التراكب | feedback, effect cards | «التداخل»؟ | |
| Sternum | القص (عظم القص) | feedback | | |
| Thoracic spine | العمود الفقري الصدري | feedback | | |
| Posterior ribs | الأضلاع الخلفية | rotation feedback | | |
| Hemidiaphragms / diaphragmatic domes | نصفا الحجاب الحاجز / القبتان الحجابيتان | feedback | | |
| Retrosternal space | الحيّز خلف القص | image criteria | | |
| Retrocardiac space | الحيّز خلف القلب | image criteria | | |
| Posterior costophrenic sulcus | الجيب الضلعي الحجابي الخلفي | coverage feedback | قارن «الزاوية» في جدول PA أعلاه | |
| Horizontal central ray | الشعاع المركزي الأفقي | positioning | | |
| Marker nearest the detector / nearest the tube | علامة الجانب الأقرب إلى الكاسيت / إلى الأنبوب | marker rule (O6) | **لا تُعتمد قبل قرار O6** | |

## Session 10 — Chest AP (proposed terms — **pending educator review**; NOT used anywhere in the UI)
Machine-assisted proposals. No existing string in `messages/*.json` or case data was changed. The display / marker convention for AP is an open owner decision (O8) — do not fix wording that depends on it. Terms already proposed for Lateral (anterior / posterior, superimposition, etc.) are not repeated.

| English | Proposed Arabic | Intended use | Question for the reviewer | OK? |
|---|---|---|---|---|
| AP projection (anteroposterior) | الإسقاط الأمامي الخلفي (AP) | exam title, console | إبقاء الاختصار لاتينيًا كما في جدول PA؟ | |
| Semi-erect | شبه منتصب (نصف جالس) | patient state (O9) | | |
| Supine | الاستلقاء على الظهر | patient state (O9) | | |
| Portable / mobile unit | جهاز متنقل (محمول) | set-up | «الجهاز المتنقل» أم «المحمول»؟ | |
| Bedside / ward examination | فحص عند سرير المريض | order text | | |
| Magnification | التكبير | effect cards | | |
| Source-to-image distance reduced | تقليل المسافة بين المصدر والكاسيت | feedback | قارن «SID / التجهيز» في الجدول أعلاه | |
| Anti-scatter grid | شبكة منع التشتت (الجريد) | technique | | |
| Grid cut-off | قطع الشبكة | effect cards | مصطلح غير مستقر | |
| Scatter correction (software) | تصحيح التشتت (برمجي) | technique note | | |
| Cardiac silhouette size | حجم الظل القلبي | feedback | | |
| Tube angulation | زاوية الأنبوب | control (if kept) | | |
| Patient unable to take a full breath / hold still | المريض غير قادر على أخذ شهيق كامل / السكون | case condition (generic noun, see S8-1) | يُعاد النظر في المذكر / المؤنث | |


## Owner-proposed corrections (owner-approved, to apply in a UI text session; no UI string change now)
Proposed and **owner-approved** (S10b-20) in Session 10b (docs only). Nothing in `messages/*.json` or case data was changed; **all items below are to be applied in a UI text session** (educator review is recommended before release, not a gate). **All other terms listed in this file are accepted by the owner** (unreviewed by an educator). Groups refer to [`REVIEW_PACKAGE.md`](REVIEW_PACKAGE.md) §5.

| Group | Current | Proposed | Note |
|---|---|---|---|
| AR-B | «…واحبسي نفسك» (breath) | «…واحبسي نَفَسَكِ» | «نفسك» is ambiguous (نَفْس / نَفَس) |
| AR-B | «أخرجي الزفير واحبسي نفسك» | «أخرجي نَفَسَكِ واحبسيه» | same |
| AR-B | «قادرة على المشي والوقوف…» | «قادرة على الوقوف…» | match the English |
| AR-B | «أنثى عمرها {age} عامًا» | pattern «أنثى، العمر: {age} سنة» | number agreement breaks for 3–10 |
| AR-A / D / E | «الكاسيت» for detector (detector view, side against the detector, SID wording «المسافة بين المصدر والكاسيت») | «الكاشف» throughout, e.g. «المسافة بين المصدر والكاشف»; keep «البكي» for Bucky | detector ≠ cassette (DR) |
| AR-A | «اللوحان / لوحا الكتف» | «لوحا الكتف» | |
| AR-D | «الجيب الضلعي الحجابي الخلفي» | «الزاوية الضلعية الحجابية الخلفية» | consistency with the PA table |
| AR-E | «…أخذ شهيق كامل / السكون» | «…البقاء ساكنًا» | |
| AR-A | «الإسقاط / المنظر» | prefer «الإسقاط» | |
| AR-A | collimation; quantum noise («الضجيج / الضوضاء الكمّية») | — | left to the educator |

New proposed terms:

| Group | English | Proposed Arabic |
|---|---|---|
| AR-D | leaning slightly forwards | مائل قليلًا إلى الأمام |
| AR-D | holding the support arm | الإمساك بذراع الحامل |
| AR-E | patient-position label | علامة وضعية المريض |

## Session 12 — Chest Lateral strings added to the UI (**DRAFT, pending owner / educator review; machine-assisted**)
Rules followed: "الكاشف" (not "الكاسيت") for the detector; phone-short wording; left / right always tied to the viewer's side of the display unless a term names the patient's side. None of these is reviewed.
| Where | Keys / data | Draft Arabic (summary) |
|---|---|---|
| Lateral positioning view | `messages/ar.json` → `positioningLateral.*` (alt, midline, sideView, schematicNote, rotationHelp, markerConvention, cuesLegendHelp, cueErect, cueSide, cueArms, cueChin, cueStraight) | «خط منتصف الصدر»، «مقدمة الصدر على يسار المشاهد»، «ويدل خط الضلع الثاني المتقطع على الدوران»، … |
| Lateral result image + effect cards | `radiograph.lateral.*` (alt, notRepresentative, altReference, altFindings.rotation / projection, effects.baseline / rotation / chin / projection) | «الدوران ← تباعد الأضلاع الخلفية»، «تقريب تعليمي: صورة جانبية طبيعية تمثيلية لشخص بالغ آخر» |
| Lateral exam data (case text, rules, critical findings, choice controls, AEC labels, baseline credit line) | `src/data/exams/xray/chest-lateral-erect.ts`, `chest-lateral-technique.ts`, `src/data/cases/chest-lateral-erect.ts`, `chest-lateral-radiograph.ts` (every `ar:` value) | «الجانب الملاصق للكاشف»، «الذراعان»، «مرفوعتان فوق الرأس»، «علامة خاطئة (الجانب الملاصق للكاشف)»، «الحقل الأمامي / المركزي / الخلفي»، … |

Questions for the reviewer: «الجانب الملاصق للكاشف» (side against the detector); «تباعد الأضلاع الخلفية» (posterior rib separation); «مسند للذراعين» (arm support); «جهة القص» (sternum side); the draft marker-convention sentence (L left margin / R right margin).

## Session 13 — Chest AP strings added to the UI (**DRAFT, pending owner / educator review; machine-assisted**)
Rules followed: "الكاشف" (not "الكاسيت"); phone-short wording; left / right tied to the viewer's side of the display. None is reviewed.
| Where | Keys / data | Draft Arabic (summary) |
|---|---|---|
| AP positioning view | `messages/ar.json` → `positioningAp.*` (sideAlt, sideViewCaption, head, feet, angleReadout, frontView, schematicNote, rotationHelp, markerConvention, cuesLegendHelp, cuePosition, cueShoulders, cueAngle, cueCentre) | «الرأس»، «القدمان»، «زاوية الأنبوب: {angle}° (+ = نحو القدمين)»، «عرض جانبي (جهة الرأس على يسار المشاهد)» |
| AP result image + effect cards | `radiograph.ap.*` (alt, notRepresentative, altReference, altFindings.projection, effects.baseline / rotation / projection) | «المظهر المرجعي»، «الدوران ← عدم تناظر الصدر»، «الإسقاط غير مُحاكى» |
| AP exam data (case text, rules, critical findings, `state` choice control, AEC labels, baseline credit line with the NIH attribution) | `src/data/exams/xray/chest-ap-supine.ts`, `chest-ap-technique.ts`, `src/data/cases/chest-ap-supine.ts`, `chest-ap-radiograph.ts` | «AP مستلقيًا»، «وضعية المريض»، «شبه جالس»، «ميل الأنبوب (نحو القدمين)»، «علامة الجانب (جانب المريض)» |

Questions for the reviewer: «مستلقيًا / شبه جالس» (supine / semi-erect); «ميل الأنبوب نحو القدمين» (caudad); «الشق الوداجي» (jugular notch); «المفصلان القصّيان الترقويان» (sternoclavicular joints); the NIH credit line (Latin citation inside Arabic text).

## Session 13 fix (S13-7) — AP projection labels (**DRAFT, pending owner / educator review**)
| Where | Data | Draft Arabic |
|---|---|---|
| AP exam projection button + result "Your setting" | `chest-ap-supine.ts` → `choiceControls[state].projectionLabels` | «AP مستلقيًا» (AP supine), «AP شبه جالس» (AP semi-erect) |

## Session 13b — scene labels (S13b-1) (**DRAFT, pending owner / educator review; machine-assisted**)
Keys: `messages/ar.json` → `scene.*`. Rule followed: «الكاشف» for the detector; anatomical directions are image conventions and are not mirrored in RTL.
| EN | Draft Arabic | Key |
|---|---|---|
| Anterior / Posterior | أمامي / خلفي | `anterior`, `posterior` |
| Head / Feet | الرأس / القدمان | `head`, `feet` |
| Tube | الأنبوب | `tube` |
| Detector | الكاشف | `detector` |
| Bed | السرير | `bed` |
| Heart | القلب | `heart` |
| Patient's right / left | يمين المريض / يسار المريض | `patientRight`, `patientLeft` |
| Central ray | الشعاع المركزي | `centralRay` |
| Arms over the lungs | الذراعان فوق الرئتين | `armsOverLungs` |
| Chin tucked / lifted; shoulders rolled / relaxed; arms raised / lowered; lying supine / head end raised (alt-text parts) | مخفوضة / مرفوعة؛ مدورتان إلى الأمام / مسترخيتان؛ مرفوعتان فوق الرأس / منخفضتان فوق الحقلين الرئويين؛ مستلقيًا على الظهر / جهة الرأس مرفوعة | `chinTucked` … `stateSemierect` |
| Text alternatives of the three drawings | see `altFrontal`, `altLateral`, `altSide` | `alt*` |

Questions for the AR reviewer: «أمامي / خلفي» as anatomical directions; «الشاقول» (vertical) in the AP side alt text; «القدمان» for Feet. `positioning.detector` («الكاسيت / البكي») is no longer used by the scenes.

## Session 13b-2 — «الكاسيت» → «الكاشف» in the positioning scenes (owner-approved correction, text only)
Only the word / phrase below was replaced; no other Arabic string was touched. «الكاسيت» elsewhere (AEC console / technique texts, result panel, exam data) is outside the three positioning scenes and unchanged.
| Key (`messages/ar.json`) | Before | After |
|---|---|---|
| `positioning.midline` | الخط المنتصف للكاسيت | خط منتصف الكاشف |
| `positioning.rotationGuide` | عمودي على الكاسيت | عمودي على الكاشف |
| `positioning.frontView` (detector caption) | عرض الكاسيت كما يظهر … | عرض الكاشف كما يظهر … |
| `positioning.schematicNote` | … يسار ويمين عرض الكاسيت. | … يسار ويمين عرض الكاشف. |
| `positioning.cueAnterior` | الصدر الأمامي باتجاه الكاسيت | الصدر الأمامي باتجاه الكاشف |
| `positioning.cueDetector` (no longer shown) | الكاسيت | الكاشف |
| `positioning.cueSideAlt` | … ووجهه نحو الكاسيت … | … ووجهه نحو الكاشف … |
| `positioning.detector` (no longer shown) | الكاسيت / البكي | الكاشف / البكي |
New draft strings (`scene.*`): `sidValue` «SID {value} سم», `tubeAngle` «زاوية الأنبوب: {angle}° (+ = نحو القدمين)» (numbers isolated with LRM), `rotationReadout` «دوران المريض: {deg}°», `rotationArc` «{deg}°». The old `positioningAp.angleReadout` is no longer used by the scene.

## Session 14.1c — wrist exam strings added to the UI (DRAFT, machine-assisted, pending owner / educator review)
Keys: `messages/ar.json` → `scene.altWrist*`, `sceneWrist.*`, `positioningWrist.*`, `console.projections.wrist-*`, `radiograph.wrist-pa.*`, `radiograph.wrist-lateral.*`; exam / case text in `src/data/exams/xray/wrist-common.ts`, `src/data/cases/wrist-*.ts`. Rule followed: «الكاشف» for the detector (never «الكاسيت»); left / right of a drawing means the viewer's side; the wrist case patient is male (masculine forms).
| EN | Draft Arabic | Where |
|---|---|---|
| Wrist | الرسغ | titles, request, labels |
| Carpals / metacarpals | عظام الرسغ / عظام مشط اليد | feedback, effect cards |
| Distal radius and ulna | الطرف السفلي للكعبرة والزند | coverage / rotation feedback |
| Ulnar head | رأس الزند | lateral rotation text |
| Midcarpal area | وسط الرسغ | centring, scene |
| Pronated (palm down) / thumb up | راحة اليد للأسفل / الإبهام لأعلى | projection names, captions |
| Ulna / Radius / Fingers / Arm (forearm) | الزند / الكعبرة / الأصابع / الساعد | scene labels |
| Ulnar side / Thumb side | جهة الزند / جهة الإبهام | PA orientation labels (guides) |
| Patient seated | المريض جالس | side view |
| One level (not scored) | على مستوى واحد (غير محسوب) | side view guide |
| Wrist rotation (forearm turn) | دوران الرسغ (دوران الساعد) | rotation control |
| Wrist PA / Wrist lateral | الرسغ PA / الرسغ جانبي | projection buttons |
Questions for the AR reviewer: «مشط اليد» vs «مشط»; «الكعبرة والزند»; the unit-isolated numbers (‎LRM‎) in the alt texts; «نموذج بصري تعليمي».

## Session 14.2b — hand exam strings added to the UI (DRAFT, machine-assisted, pending owner / educator review)
Keys: `messages/ar.json` → `scene.altHand*`, `sceneHand.*`, `positioningHand.*`, `console.projections.hand-*`, `radiograph.hand-pa.*`, `radiograph.hand-lateral.*`; exam / case text in `src/data/exams/xray/hand-common.ts`, `src/data/cases/hand-*.ts`. Male forms for the male patient (ذكر، جالس، قادر، حالته مستقرة ومتعاون). Detector = «الكاشف».
| EN | Draft Arabic | Where |
|---|---|---|
| Hand | اليد | titles, request, labels |
| Fingertips | أطراف الأصابع | clipping feedback |
| Phalanges | السلاميات | rotation text |
| Metacarpal shafts | أجسام عظام مشط اليد | rotation text |
| Metacarpophalangeal (MCP) joint | المفصل السلامي المشطي | centring text, scene (abbreviated «MCP») |
| Third MCP joint / MCP joints 2–5 | المفصل السلامي المشطي الثالث / المفاصل السلامية المشطية من الثاني إلى الخامس | centring labels; scene «مفصل MCP الثالث» / «مفاصل MCP 2–5» |
| Distal forearm | الساعد السفلي | coverage text |
| Lateral (extension) | جانبي (بسط) | titles, projection button |
| Superimposed | متراكبة | lateral criteria |
| Soft tissue on each side of the phalanges | الأنسجة الرخوة على جانبي السلاميات | PA rotation text |
| Hand rotation (forearm turn) | دوران اليد (دوران الساعد) | rotation control |
Questions for the AR reviewer: «السلاميات» vs «عظام الأصابع»; «بسط» for extension; the mixed «MCP» in scene labels (full term too long for the label); «مشط اليد».


## Session 14.3 — elbow exam strings added to the UI (DRAFT, machine-assisted, pending owner / educator review)
Keys: `messages/ar.json` → `scene.altElbow*`, `sceneElbow.*`, `positioningElbow.*`, `console.projections.elbow-*`, `radiograph.elbow-ap.*`, `radiograph.elbow-lateral.*`; exam / case text in `src/data/exams/xray/elbow-common.ts`, `src/data/cases/elbow-*.ts`. Receptor = «الكاشف»; male forms for the male patient.
| EN | Draft Arabic | Where |
|---|---|---|
| Elbow | المرفق | titles, request, labels |
| Upper arm / humerus | العضد | scene labels, clipping text |
| Forearm | الساعد | scene labels |
| Epicondyle (medial / lateral) | اللقيمة (الإنسية / الوحشية) | rotation text, clipping text |
| Olecranon (the point of the elbow) | الزج (رأس المرفق) | lateral text |
| Posterior | الخلف | lateral scene label (bottom of the detector view) |
| Radial head / neck / tubercle | رأس الكعبرة / عنقها / حدبتها | AP rotation text |
| Coronoid process | النتوء الإكليلي | lateral rotation text |
| Condyle outline | حدود اللقيمتين | lateral effect text |
| Trochlear sulcus (concentric arcs) | أخدود البكرة (الأقواس المتحدة المركز) | lateral text |
| Extended / flexed 90° | ممدود / مثني 90° | titles, projection buttons |
| Medial / lateral side | الجهة الإنسية / الجهة الوحشية | scene labels |
| Palm up (supinated) | راحة اليد للأعلى | AP text (instead of a supination term) |
| Elbow rotation (arm turn) | دوران المرفق (دوران الذراع) | rotation control |
Questions for the AR reviewer: «اللقيمة» for epicondyle; «الزج» vs «رأس الزند / المرفق» for olecranon; «النتوء الإكليلي» for coronoid; the phrase for supinated.


## Session 14.4 — knee and foot exam strings added to the UI (DRAFT, machine-assisted, pending owner / educator review)
Keys: `messages/ar.json` → `scene.altKnee*`, `scene.altFoot*`, `sceneKnee.*`, `sceneFoot.*`, `positioningKnee.*`, `positioningFoot.*`, `console.projections.knee-*` / `foot-*`, `radiograph.knee-*.*`, `radiograph.foot-*.*`; exam / case text in `src/data/exams/xray/lower-limb-common.ts`, `src/data/cases/lower-limb-case.ts`, `lower-limb-radiographs.ts`. Male forms for the patient; the receptor is «الكاشف».
| EN | Draft Arabic | Where |
|---|---|---|
| Knee / foot | الركبة / القدم | titles, request, labels |
| Femur | عظم الفخذ | scene label, clipping text |
| Tibia / fibula | الظنبوب / الشظية | clipping text, rotation text |
| Lower leg (bottom axis label of the knee view) | الساق | scene label (a term without descenders so that the label stays inside its frame) |
| Patella | الرضفة | lateral coverage text |
| Femoral condyles / epicondyle | لقمتا عظم الفخذ / اللقيمة | rotation text |
| Fibular head | رأس الشظية | rotation text |
| Intercondylar eminence | النتوء بين اللقمتين | AP knee rotation text |
| Tibial plateau | الهضبة الظنبوبية | tube-angle text |
| Metatarsals / phalanges | عظام مشط القدم / السلاميات | foot texts |
| Navicular / cuboid / cuneiforms | الزورقي / النردي / الإسفينيات | foot coverage text |
| Sesamoids | السمسمانيات | foot image criterion |
| Calcaneus / talus | العقب / الكاحل | foot oblique criterion |
| 5th metatarsal tuberosity | حدبة المشط الخامس | foot oblique criterion |
| Sinus tarsi | جيب الرسغ | foot oblique criterion |
| Dorsoplantar / medial oblique | ظهري أخمصي / المائل الإنسي | titles, projection buttons |
| Plantar surface (sole) | الأخمص | oblique texts, end-view label |
| Toward the heel (cephalad) | باتجاه العقب (نحو الرأس) | foot AP tube-angle text |
| Cephalad / caudad | نحو الرأس / نحو القدمين | tube-angle texts |
| Lateral recumbent | استلقاء جانبي | knee lateral text |
| Medial / lateral side | الجهة الإنسية / الجهة الوحشية | scene labels |
| Front / back (of the knee) | الأمام / الخلف | knee lateral scene labels |
| ASIS-to-table distance | المسافة بين الشوكة الحرقفية الأمامية العليا والطاولة | knee AP case and tube-angle text |
| End view | منظر من الطرف | side-view gauge |

### S14.5 ankle terms (DRAFT, machine-assisted; not reviewed; receptor = «الكاشف»)
| English | Arabic (draft) | Where |
|---|---|---|
| Ankle (joint / region) | مفصل الكاحل / الكاحل | titles, case text, scene labels |
| Talus | عظم الكاحل | image and effect texts (the bone; the joint is «مفصل الكاحل») |
| Medial / lateral malleolus | الكعب الإنسي / الكعب الوحشي | AP texts |
| Ankle mortise | تجويف مفصل الكاحل | AP rotation text |
| Tibiotalar joint | مفصل الظنبوب والكاحل | lateral rotation text |
| Dorsiflexed foot | القدم مثنية ظهريًّا | lateral request, captions |
| Heel bone | عظم العقب | effect texts |
| Foot (bottom axis label) | القدم | detector axis |
Question for the AR reviewer: «الكاحل» names both the joint and the talus in common usage; confirm the split «مفصل الكاحل» / «عظم الكاحل».

Questions for the AR reviewer: «الظنبوب» vs «القصبة»; «الكاحل» for talus; «السمسمانيات»; «جيب الرسغ» for sinus tarsi; «الأخمص» vs «باطن القدم»; the bottom knee label «الساق» (chosen for layout, not for exactness).

## Pelvis AP reference — 2026-10-15 (DRAFT, pending owner/educator review; not in UI)

| English | Proposed Arabic |
|---|---|
| Pelvis / pelvic girdle | الحوض / الحزام الحوضي |
| AP pelvis | إسقاط أمامي خلفي للحوض |
| Anterior superior iliac spine (ASIS) | الشوكة الحرقفية الأمامية العلوية |
| Pubic symphysis | الارتفاق العاني |
| Obturator foramen | الثقبة السدادية |
| Iliac wing / ischial spine | جناح الحرقفة / الشوكة الإسكية |
| Femoral head / neck | رأس عظم الفخذ / عنق عظم الفخذ |
| Greater / lesser trochanter | المدور الكبير / المدور الصغير |
| Internal rotation of both legs | دوران الطرفين السفليين للداخل |
| Pelvic rotation | دوران الحوض |
| Suspend respiration during exposure | حبس النَّفَس أثناء التعريض |
| Image receptor | الكاشف |

Machine-assisted proposed terms only. Distinguish pelvic rotation from leg rotation and avoid adding inspiration/expiration to a phase-neutral source instruction.

## Pelvis AP implementation — S-PELVIS-1 (DRAFT, machine-assisted, pending owner/educator review)

UI additions: أشعة الحوض للبالغ — AP مستلقٍ؛ دوران الحوض؛ وضع الطرفين السفليين؛ دوران داخلي/خارجي/محايد؛ تعليمات التنفس؛ احبس نَفَسك أثناء التعريض؛ المستوى الناصف؛ جناحا الحرقفة؛ الثقبتان السداديتان؛ الارتفاق العاني؛ الكاشف؛ علامة الجانب التشريحي. All keys under positioningPelvis/scenePelvis and radiograph.pelvis-ap, the pelvis projection label and scene alternatives are new. Exam/case/rule/technique prose is bilingual data. Distinguish pelvis turn from leg positioning; no instruction forces inspiration or expiration. Receptor remains «الكاشف». Numerical values explicitly labelled «اختيار تعليمي في المحاكي» where applicable. No existing Arabic string changed.

## Shoulder Grashey reference — 2026-10-15 (DRAFT, pending educator/Arabic review)

Documentation only; machine-assisted, no UI strings changed. الكتف (shoulder)؛ الإسقاط الأمامي الخلفي المائل للكتف، غراشي (AP oblique shoulder, Grashey)؛ الجوف الحقاني (glenoid cavity)؛ حافة الجوف الحقاني (glenoid rim)؛ المفصل الكتفي العضدي (scapulohumeral joint)؛ رأس العضد (humeral head)؛ جسم لوح الكتف (scapular body)؛ دوران محايد للذراع (neutral arm rotation)؛ حبس النَّفَس أثناء التعريض (suspend respiration). «الكاشف» remains the detector term. Body obliquity and arm rotation must not be conflated.

## Shoulder Y reference — 2026-10-15 (DRAFT, pending educator/Arabic review)

Documentation only, machine-assisted; no UI strings changed. الإسقاط الجانبي للوح الكتف على شكلY (scapularY lateral)؛ إسقاط خلفي أمامي مائل (PA oblique)؛ الأخرم (acromion)؛ الناتئ الغرابي (coracoid process)؛ الزاوية العلوية/السفلية للوح الكتف (superior/inferior scapular angle)؛ المفصل الأخرمي الترقوي (AC joint)؛ المفصل الكتفي العضدي (scapulohumeral joint). Keep body obliquity separate from arm rotation and preserve the source warning; الكاشف remains detector.

## Shoulder Grashey implementation — S-SHOULDER-3 (DRAFT, machine-assisted, pending owner/educator review)

UI additions: أشعة الكتف للبالغ — الجوف الحقاني المائل (غراشي)، واقف؛ الكتف — الإسقاط المائل (غراشي)؛ ميل الجسم نحو الكتف الأيمن / إدارة الجسم نحو الكتف الأيمن؛ وضع الذراع؛ مبعدة قليلًا، المرفق مثني، دوران محايد؛ إلى الجانب، دوران داخلي / خارجي؛ المفصل الكتفي العضدي؛ نطاق المصدر ‏35°–45°؛ الحيّز المفصلي (joint space)؛ انغلاق الحيّز المفصلي؛ رأس العضد؛ الجوف الحقاني؛ الأخرم (acromion)؛ الناتئ الغرابي (coracoid); طرف الترقوة الوحشي؛ منظر علوي؛ العلامة R (يمين المريض). Reuses «الكاشف» (never «الكاسيت»), «حبس النَّفَس».
