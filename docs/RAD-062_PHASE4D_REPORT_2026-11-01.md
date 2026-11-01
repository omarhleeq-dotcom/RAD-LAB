# RAD-062 — مرحلة 4د، 2026-11-01

## 1 — الانحرافات والميزانية

العمل على `rad062/4d-supervisor-owner-ux` في Draft PR واحدة، بسقف 30 ملفًا؛ قائمة الملفات والفحوص تُستكمل قبل التسليم.

## 2 — المنجز والمتروك

التنفيذ جارٍ؛ لا إغلاق 4ب أو 4ج ولا إذن 5ب أو SQL أو تفعيل البوابة.

<a id="phone-check"></a>
## 3 — دليل الهاتف بعد #191

Verified (إفادة المالك، 2026-11-01): النتيجة PARTIAL؛ وصل المشرف للتأليف، وحساب المالك يعرض سطر المشرفين فقط.
Verified (إفادة المالك): تنزيل القالب OK؛ التبديل بين التطبيقات حفظ كل شيء OK؛ errors CSV رُفض لكل صف OK.
Verified (إفادة المالك): Step 3 Next معطل بلا سبب ظاهر بسبب Reference فارغ؛ sample upload فشل لرخصة فارغة ولرفض HU خطأً.
Verified (إفادة المالك): سؤال “In Hounsfield Units (HU), dense cortical bone…” رُفض بخطأ A/B/C formula مع الخيارات الموجبة؛ السالب يمر.
Verified (إفادة المالك): اللصق OK عدا صف HU؛ صفحة المجموعات مزدحمة، ولوحة المالك توحي بكتابة الأسئلة، وغرض Reference/Licence غير واضح.
هذه أدلة هاتف من المالك وليست إعادة اختبار من الوكيل؛ 4ب و4ج تبقيان مفتوحتين بلا completion_evidence جديد.

## 4 — المشترك وScale

لا تغيير للعقود أو الخادم؛ قواعد المصدر والترخيص والحدود الحالية باقية عدا الافتراضات النصية المعتمدة وإصلاح E.

## 5 — الطبي والدرجات وسؤالا AGENTS

لا تغيير طبي أو درجات؛ سؤال HU حالة استيراد حرفية، وليس اعتمادًا طبيًا.
هل تغير الحكم؟ لا اختصار لأحكام سابقة؛ الافتراضات وتصنيف الصيغ يتبعان أمر المالك الحالي، مع بقاء العقود والحراس.
هل بقي رابط الدليل الأصلي؟ نعم: [4ج](RAD-062_PHASE4C_REPORT_2026-11-01.md)، [المرحلة1](DECISIONS.md#assess-phase1-owner-2026-10-29)، [11(C)](DECISIONS.md#rad062-phase2-owner-2026-10-29).

## 6 — QA

Not run (التنفيذ جارٍ): اختبارات وفحوص 4د لم تبدأ في commit الأدلة الأول.

## 7 — المفتوح

4ب و4ج و4د لا تغلق قبل اكتمال شرط المالك؛ 5ب وشروط التشغيل المستقلة باقية.

<a id="done-when"></a>
## 8 — قائمة المالك الموحدة والمتابعة

done_when (4b+4c+4d): PR merged + CI green + owner phone check as supervisor:
- open Add questions in one tap
- upload sample_20 → preview shows ✓ answers → save without typing Reference/Licence
- paste 3 rows → save
- errors CSV rejected per row
- K>N blocked
- app switch loses nothing
- groups page: open group, copy join code, danger zone separate
- owner panel: JSON tool only under Advanced, supervisors-only line
