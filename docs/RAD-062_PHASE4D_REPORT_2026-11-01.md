# RAD-062 — مرحلة 4د، 2026-11-01

## 1 — الانحرافات والميزانية

[القرار المعتمد](DECISIONS.md#rad062-4d-owner-2026-11-01)؛ الفرع `rad062/4d-supervisor-owner-ux`، Draft PR واحدة، بلا ready أو merge.
22 ملفًا من سقف30؛ لا تبعية مشروع جديدة. مُجهّز PostgreSQL المثبت في المستودع ومتصفح البيئة للتدقيق المحلي فقط.
القائمة الدقيقة، وتشمل commit الأدلة الأول `548aaf2`:

- `docs/DECISIONS.md`
- `docs/HANDOFF.md`
- `docs/RAD-062_PHASE4D_REPORT_2026-11-01.md`
- `docs/project-status.md`
- `messages/ar.json`
- `messages/en.json`
- `scripts/pages/frontend-schema.json`
- `src/features/assess/AuthoringEntry.tsx`
- `src/features/assess/AuthoringFlow.tsx`
- `src/features/assess/OwnerContentPanel.tsx`
- `src/features/assess/QuestionImport.tsx`
- `src/features/assess/QuestionPreview.tsx`
- `src/features/assess/authoring-audit.mjs`
- `src/features/assess/import-parser.test.ts`
- `src/features/assess/import-parser.ts`
- `src/features/assess/import-preferences.ts`
- `src/features/assess/import-validator.ts`
- `src/features/assess/import-xlsx.ts`
- `src/features/supervisor-review/ReviewSession.tsx`
- `src/features/supervisor-review/SupervisorReview.tsx`
- `src/features/supervisor/P1Session.tsx`
- `src/features/assess/phase4d.test.ts`

## 2 — المنجز والمتروك والشاشات قبل/بعد

Verified: المصدر والرخصة قبلًا فارغان وغرضهما غامض؛ الآن نصا العمل الأصلي من اسم الحساب، تحت سؤال واحد مطوي مع مثال لكل حقل.
Verified: الافتراضات لا تدخل localStorage؛ المعدّل فقط لكل حساب/جهاز، ويُمسح عند الخروج؛ مرجع الصف في الملف يعلو على الدفعة.
Verified: Next قبلًا بلا سبب؛ الآن سبب دقيق وعدد الصفوف وروابط تفتح الصف والحقل، مع أسباب Save وK>N والاسم والحجم والاسترداد.
Verified: نافذة JSON قبلًا توحي بالتأليف؛ الآن رسالة المشرفين ورابط التعيين، وأداة JSON عاملة تحت Advanced مطوية.
Verified: المجموعات قبلًا تجمع المواعيد وUUID والإجراءات؛ الآن بطاقة واحدة قابلة للنقر وDetails للمرجع والنسخ وزر + New group.
Verified: داخل المجموعة أقسام Students | Results | Settings؛ النتائج الفارغة «لا نتائج بعد»، وإنهاء المجموعة في منطقة خطر مستقلة بالتأكيد نفسه.
Verified: الكود يظل مرة واحدة؛ عرضه ونسخه في لوحة Settings بعد الإنشاء/التدوير، دون استرجاع أو تخزين جديد أو تغيير مدة ظهوره.
Inferred: أعداد البطاقة للمجموعة المفتوحة من snapshot الحالي؛ غير المفتوحة تعرض — بدل عدد غير متاح لأن العقد لا يعيد counts لكل المجموعات.
لم تُضف قراءة أو cache عابر للرؤية لاختراع الأعداد؛ العدد المحدود بصفحة يحمل + عند وجود صفحة تالية. لا تنفيذ5ب أو صور أو ناشر أو SQL.

<a id="phone-check"></a>
## 3 — دليل الهاتف بعد #191

Verified (إفادة المالك، 2026-11-01): النتيجة PARTIAL؛ وصل المشرف للتأليف، وحساب المالك يعرض سطر المشرفين فقط.
Verified (إفادة المالك): تنزيل القالب OK؛ التبديل بين التطبيقات حفظ كل شيء OK؛ errors CSV رُفض لكل صف OK.
Verified (إفادة المالك): Step 3 Next معطل بلا سبب ظاهر بسبب Reference فارغ؛ sample upload فشل لرخصة فارغة ولرفض HU خطأً.
Verified (إفادة المالك): سؤال “In Hounsfield Units (HU), dense cortical bone…” رُفض بخطأ A/B/C formula مع الخيارات الموجبة؛ السالب يمر.
Verified (إفادة المالك): اللصق OK عدا صف HU؛ صفحة المجموعات مزدحمة، ولوحة المالك توحي بكتابة الأسئلة، وغرض Reference/Licence غير واضح.
هذه أدلة هاتف من المالك وليست إعادة اختبار من الوكيل؛ 4ب و4ج تبقيان مفتوحتين بلا completion_evidence جديد.

## 4 — المشترك وScale وقاعدة E

Verified: قيم XLSX النصية والمشتركة ليست صيغًا مهما بادئتها؛ `<f>` وحده يحدد الصيغة، وقيمة `<v>` تُستورد حرفيًا؛ غيابها/فراغها خطأ صف.
Verified: CSV واللصق يرفضان، بعد مسافات البداية، `=` أو `@`، أو `+`/`-` متبوعًا مباشرة بحرف Unicode أو `(`؛ رقم أو مسافة بعد الإشارة نص عادي.
Verified: `+40 to +60 HU` و`+100 to +300 HU` و`+1000 HU` و`-1000 HU` تُحفظ حرفيًا؛ لا تقييم صيغة أو تحويل نص إلى رقم.
إشارة مصدر XLSX داخلية Symbol لا تعبر JSON؛ النص المخزن في draft لا يعاد تفسيره كصيغة عند المعاينة/الحفظ أو فتحه مجددًا.
Verified: `validateProvenanceV2` وuploader-authored وعقد الحفظ ثابتة؛ لا تعديل SQL/RPC أو scope أو التحديث أو B1 أو حدود الاستيراد.
Scale: 1 MB و200 سؤال و50 خيارًا و64 KiB باقية؛ رفعها يتطلب قياسًا وقرارًا مستقلًا، بلا اقتطاع أو تقسيم خفي.
ثلاث بصمات موجودة فقط تغيرت، لا مفاتيح جديدة أو عقود أو guards أو migration/check:

| المفتاح | old → new sha256 | السبب |
|---|---|---|
| `browserBoundaries.src/features/assess/OwnerContentPanel.tsx` | `8bb33131dda5d59eb8e54b9c84fa39bcef9b761eb21fa7b1dac79f1c49cf69d7` → `3e0c676a98b1d3774fa0db3c17be42759a2a1dfaaf806f1df6dc26b83d9b40e7` | طي JSON وأسبابه |
| `browserBoundaries.src/features/assess/AuthoringEntry.tsx` | `cf6c209427841c80266dae8275557ea6df9a87a45bf93dbb9b55277f8ea5e9e0` → `2abd42dd80e3a1572d563df78cc7c3f2420b9703b094557ad826fc427fa7af52` | رابط تعيين المشرفين |
| `guardedFeatures.supervisorP1.consumer.sha256` | `fb376c4793df7615da9bda5ee608b09c6509d301dbdf8f864f649b25ef2d53ae` → `5f726a65f1130c9acd6539155a9d868b9a7fa4e50834fc828c840a332619540a` | طي نصوص المعلومات فقط؛ B1 ثابت |

## 5 — الطبي والدرجات وسؤالا AGENTS

لا تعديل طبي أو درجات أو equal points أو K≤N أو auto-author؛ سؤال HU دليل استيراد من المالك وليس اعتمادًا طبيًا.
هل تغير الحكم؟ لا اختصار لأحكام سابقة؛ تغيّر الافتراضي وتصنيف الصيغ فقط بأمر المالك الحالي؛ العقود والبوابة ثابتة.
هل بقي رابط الدليل الأصلي؟ نعم: [4ج](RAD-062_PHASE4C_REPORT_2026-11-01.md)، [المرحلة1](DECISIONS.md#assess-phase1-owner-2026-10-29)، [11(C)](DECISIONS.md#rad062-phase2-owner-2026-10-29).

## 6 — QA وحدود الدليل

Verified: الاختبارات الموجهة النهائية31/5 تشمل UI والحراس؛ اختبارات الخصوصية والرؤية وPostgreSQL السابقة نجحت دون تعديل توقعاتها.
Verified: تدقيق المكونات EN/AR ×390/1440:356 تحققًا و64axe، بلا مخالفات أو تمرير أفقي، ويشمل الخطوات الأربع والمصدر وأسباب المنع والمالك والقائمة والمجموعة وSettings.
Verified: XLSX اصطناعي20 صفًا يصل للحفظ دون كتابة Reference/Licence؛ provenance بالنصين الأصليين؛ لصق3، أخطاء CSV، K>N، البقاء عند الرجوع والتبديل، ونسخ الكود.
Verified: اختبارات HU عبر XLSX/CSV/TSV، `<f>` بقيمة/دونها، نص XLSX ببادئات مختلفة، ورفض `=SUM(A1)` من اللصق؛ لا تغيير توقع قديم.
Verified: مراجعة صور AR390 وAR1440 وEN390 وEN1440 محليًا؛ مرجع LTR داخل RTL، الأمثلة ملتفة دون كسر؛ زر الحفظ والروابط متاحة.
الصور `/tmp/rad062-4d-after-{locale}-{width}-{screen}.jpg`؛ `3-source/4-source` للمصدر، `3-blocked-reference` للإصلاح، `owner-panel/owner-advanced` للطي، و`groups-list/group/settings/settings-code` للمجموعات.
Verified: npm run build وnpm run build:pages ناجحان؛ بناء محلي بلا متغيرات مزوّد، وCSP بقي connect-src self؛ لا دليل نشر أو خدمة حية.
Verified: npm run check ناجح: typecheck وlint و3229 اختبارًا في246 ملفًا؛ displayed-text وsession-account وschema gate وكل اختبارات supervisor-review خضراء ودون تعديل.
Verified: lint الملفات المتغيرة بلا تحذير؛ lint العام تحذيران سابقان فقط في simulator-layout-audit.
Verified: فحص الحدود:22 ملفًا؛ supabase وحزم الهاتف وبيانات الامتحانات وgoldens وcharacterisation بلا فروق؛ الحراس واختبارات الخصوصية ثابتة البايتات.
Verified: marker قبل وبعد مطابق `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`.
Verified: docs:sync مرتان والثانية بلا تغيير؛ docs:check وstatus:check --require-previous وgit diff --check ناجحة؛3 تنبيهات ميزانية سابقة (AGENTS وRAD-059 وRAD-060).

Verified: النصوص الباقية ظاهرة: `shownOnce` للكود لمرة واحدة؛ `selectGroupHint` لتوقع F4/F7؛ `groupHint` لتوقيت UTC داخل نموذج الإنشاء؛ حالات المنع والتأكيد والمشاركة الأصلية.
Verified: نُقلت `archiveHint` و`refreshHint` و`discardHelp` و`sqlHint/resultHint` خلف ⓘ؛ قواعد الخصوصية والإخفاء والتحديث لم تتغير.
Verified: لا تعديل لاختبار guard أو supervisor-review؛ `import-parser.test.ts` إضافات فقط؛ ملف الاختبارات الجديد `phase4d.test.ts` يطابق إعداد Vitest.
Verified: تغييرات UI في `authoring-audit.mjs` فقط: القيم الأصلية بدل تهيئة الذاكرة؛ فتح مصدر الصف قبل تحرير الرخصة؛ Save معطل للنقاط المختلفة بدل نقرة؛ انتظار إخفاء React؛ توقعات الحفظ والمنع باقية.
Inferred: فحوص المتصفح للمكونات الفعلية وCSS الفعلي بنقل وحساب اصطناعيين؛ لا اتصال خدمة حية أو مستخدمين حقيقيين أو بديل لفحص الهاتف.
Not run (pending owner): فحص الهاتف الحقيقي بعد4د؛ لا متابعة CI أو اشتراك أو polling، والدمج وحده لا يثبت نشرًا.

مراجعة لاحقة على fe26739: إصلاح E قبل خلية XLSX فيها صيغة نتيجتها خطأ Excel (t="e"، مثل #DIV/0!) كنص؛ 4ب كانت ترفضها. أعاد المراجع الرفض بسطر واحد في import-xlsx.ts مع اختبار انحدار يفشل دون الإصلاح.
- Verified (reviewer, non-root): npm run check، 246 ملفًا و3229 اختبارًا شاملة PostgreSQL؛ npm run build وbuild:pages؛ marker ثابت.

## 7 — المفتوح

RAD-062 تبقى in_progress/waiting_on owner؛ 4ب و4ج و4د مفتوحة حتى الشرط أدناه؛ أعداد المجموعات غير المفتوحة غير متاحة بالعقد الحالي.
لا قرار توسيع خادم أو خصوصية ضمن هذه الدفعة؛5ب وشروط التشغيل والحقوق والمحو والمراجعة المستقلة باقية.

<a id="done-when"></a>
## 8 — قائمة المالك الموحدة والمتابعة

قرارات المالك المعتمدة، موحدة: (A) نصا العمل الأصلي والحقلان المطويان وذاكرة المعدّل فقط؛ (B) أسباب المنع وروابط الإصلاح؛ (C) Advanced للـJSON ورسالة المشرفين؛ (D) تبسيط المجموعات مع ثبات الخصوصية؛ (E) تمييز الصيغ وقيمها كما في §4.
لا قرار تشغيل جديد مطلوب أو بوابة مفتوحة؛ فحص المالك التالي هو الشرط الوحيد الخاص بالهاتف، مع PR وCI؛ الأعداد غير المحمّلة تعرض — حتى فتح المجموعة؛ طلبها مسبقًا يحتاج تصميم قراءة مستقلًا يحفظ الخصوصية خارج نطاق4د.

done_when (4b+4c+4d): PR merged + CI green + owner phone check as supervisor:
- open Add questions in one tap
- upload sample_20 → preview shows ✓ answers → save without typing Reference/Licence
- paste 3 rows → save
- errors CSV rejected per row
- K>N blocked
- app switch loses nothing
- groups page: open group, copy join code, danger zone separate
- owner panel: JSON tool only under Advanced, supervisors-only line
