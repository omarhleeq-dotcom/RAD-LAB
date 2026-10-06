# Arabic terminology — for educator review

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

