# RAD-062 — مرحلة4ب: التأليف والاستيراد، 2026-11-01

## 1 — الانحرافات والميزانية

نُفذت توسعة S-STD-1 التي اعتمدها المالك على [#190](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/190)، مع ربط الخروج اللاحق في [القرار الموحد](DECISIONS.md#rad062-4b-scope-owner-2026-11-01).
الميزانية النهائية25ملفًا، شاملة إغلاقات أول commit؛ لا تبعية جديدة أو SQL أو ترحيل أو تغيير توقع اختبار قائم.
القائمة الدقيقة:

1. `AGENTS.md`
2. `docs/HANDOFF.md`
3. `docs/project-status.md`
4. `docs/DECISIONS.md`
5. `docs/RAD-062_PHASE4B_REPORT_2026-11-01.md`
6. `scripts/pages/frontend-schema.json`
7. `messages/en.json`
8. `messages/ar.json`
9. `src/features/authoring-review/contracts.ts`
10. `src/features/authoring-review/sql-adapter.ts`
11. `src/features/authoring-review/Session.tsx`
12. `src/features/authoring-review/AuthoringView.tsx`
13. `src/features/assess/AssessPanel.tsx`
14. `src/features/assess/OwnerContentPanel.tsx`
15. `src/features/assess/AuthoringEntry.tsx`
16. `src/features/assess/QuestionImport.tsx`
17. `src/features/assess/import-parser.ts`
18. `src/features/assess/import-xlsx.ts`
19. `src/features/assess/import-validator.ts`
20. `src/features/assess/import-preferences.ts`
21. `src/features/assess/import-parser.test.ts`
22. `src/features/assess/import-validator.test.ts`
23. `src/features/assess/authoring-v2.test.ts`
24. `src/features/assess/authoring-audit.mjs`
25. `src/features/pilot/useAccount.ts`

## 2 — المنجز والمتروك

المسارات الثلاثة تستعمل نموذج السؤال القائم ونوع single-choice؛ لصق TSV وملفا XLSX/CSV يشتركان في validator واحد ومعاينة كاملة قابلة للتعديل والاستبعاد.
أي صف غير صالح يمنع إضافة الدفعة؛ الاستيراد المعلق أو المرفوض يمنع حفظ المسودة حتى الإكمال أو الإلغاء الصريح. الحفظ استدعاء واحد للمسودة كلها؛ لا تقسيم أو حفظ جزئي خفي.
XLSX: DecompressionStream(deflate-raw) وDOMParser، الورقة الأولى وshared strings والقيم المخزنة فقط؛ لا تقييم للصيغ أو جلب روابط أو رفع/تخزين للملف.
تُرفض xls/xlsm والماكرو والتشفير والبنية التالفة والملفات الكبيرة؛ الصيغة بلا قيمة مخزنة تعطي خطأ صف؛ CSV/TSV لا يقيّمان الصيغ.
K/N والنقاط المتساوية واستثناء خلط الخيارات لكل سؤال وإزالة سؤال من المسودة تعمل؛ لا publisher أو تغيير assignmentsEnabled أو launch_gate.
تظل5ب والصور والقرب والتصحيح الجديد خارج الدفعة.

## 3 — لكل مهمة

- RAD-090: done بأول commit؛ [#189](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/189) merged وCI/job check وDeploy Pages success؛ no phone check needed.
- RAD-087: done بأول commit؛ إفادة المالك: owner phone check on deployed main, 2026-11-01: pelvis and shoulder exams acceptable at SID 100.
- RAD-062: in_progress/owner؛4ب منفذة للمراجعة في #190،5ب متبقية؛ لا completion_evidence لمهمة غير منجزة.
- done_when4ب: PR merged + CI green + owner phone check: paste 3 rows, upload 1 .xlsx, preview, save, K>N blocked.

## 4 — المشترك وScale والتفصيل المرتبط

[المهايئ](../src/features/authoring-review/sql-adapter.ts) يضيف createSqlAuthoringV2 اختياريًا؛ كل مستهلكي createSqlAuthoring/v1 باقون. لا تحويل v1 تلقائي أو تعديل منشور.
المستهلك الجديد AuthoringEntry فقط يختار v2؛ النموذج نفسه يستقبل إعداد v2، ويمنع Author اليدوي ويرسل provenance بلا هوية؛ الخادم يحلها من اسم الحساب الثلاثي.
التفصيل: [validator](../src/features/assess/import-validator.ts)، [XLSX](../src/features/assess/import-xlsx.ts)، [اختبارات السلوك](../src/features/assess/authoring-v2.test.ts)، [تدقيق المتصفح القابل للإعادة](../src/features/assess/authoring-audit.mjs).
التأليف ملتزم بتعيين المشرف ومجموعته الحالية؛ دور المالك وحده لا يتجاوز شروط SQL ولا يمنح تفويض كتابة إضافيًا.
سقوف الاستيراد1,000,000بايت/200سؤال/50خيارًا، والوثيقة64KiB؛ حماية فك الضغط8MiB/20,000خلية/1000ZIP entries. بلوغ200سؤال لا يضمن ملاءمة الوثيقة؛ لا اقتطاع أو إنشاء مسودات آلي.
ذاكرة المصدر/الرخصة version1 محلية مع userId؛ القراءة المختلفة/بلا جلسة تمسحها، وكل لمس localStorage داخل try/catch. useAccount يستورد helper نقيًا ويستدعيه فقط في SIGNED_OUT وبعد نجاح signOut.
زيادة الحدود تحتاج قياسًا ومراجعة سياسة مستقلة؛ لا hard-coded حسابات منتج أو قراءة مجموعات بلا صفحات أو اختيار عشوائي في المتصفح.

تغييرات manifest كلها ضمن browserBoundaries؛ `∅` تعني مفتاحًا جديدًا. بقية المفاتيح، ومنها requiredMigrations/checks/deferredMigrations/contract/version والـguards، مطابقة للأساس.

| المفتاح | old → new sha256 | السبب |
|---|---|---|
| `browserBoundaries.src/features/pilot/useAccount.ts` | `b7dabc44751aa31928a5fb0625fb7c6657b856f6071eefd452e6262a3612ffa1` → `9a02c3edbecd8c39961c7619e814c58664c1625688f41bfe9d66497dd93e6073` | استدعاء helper المسح في موضعي الخروج المعتمدين فقط |
| `browserBoundaries.src/features/assess/OwnerContentPanel.tsx` | `2037a5733bef75e1295e9c6aa629babb6961471383e850cd883ad3d6a9295ae6` → `8bb33131dda5d59eb8e54b9c84fa39bcef9b761eb21fa7b1dac79f1c49cf69d7` | وصل واجهة التأليف إلى شاشة المالك القائمة |
| `browserBoundaries.src/features/assess/AssessPanel.tsx` | `2fde293b1785a86dbcf3966ccc66667d8f71d133e000de865137a9ad0971ef76` → `9ba01eadb41b33adecdfa725ab32f60e74b8efdd342b1792b5e0b064e6ae2e7e` | إظهار التأليف للحساب المعيّن مشرفًا ضمن Assess |
| `browserBoundaries.src/features/assess/AuthoringEntry.tsx` | `∅` → `991f8b2600f19a100d71ed0ed6ae0d93161bed9285394a0e7d982fa0c41e6d24` | وحدة متصفح جديدة تستعمل scope_page_v1 وdraft_page_v2 وdraft_save_v2 القائمة |
| `browserBoundaries.src/features/authoring-review/sql-adapter.ts` | `∅` → `d4fd25d7896a6888a37a018bd1317fa1e12cf7e6c44ffcfe775d3c319d8356ea` | المهايئ القائم أصبح وحدة متصفح موصولة؛ v2 اختياري وRPCs v1/v2 كلها ضمن required migrations |

## 5 — الطبي والدرجات

لا تغيير طبي أو بيانات فحوص أو goldens أو characterisation؛ الأسئلة المرفوعة no-medical-review، وليست إفادة المصدر والرخصة اعتمادًا مستقلًا.
النقاط العشرية والحوض يستعملان المساعدين الحاليين؛ الحذف وتعديل المسودة قبل النشر، وحراسة الاستبدال بعد البدء تبقى خادمية؛ نص الواجهة يبين قواعد النسخة الجديدة وإغلاق الإسناد السابق.
سؤالا AGENTS: هل تغير حكم التجميد؟ لا؛ أُعيد الوسم وحده وعدد الأسطر38قبل وبعد. هل بقي رابط الدليل الأصلي؟ نعم؛ [فهرس القاعدة](DECISIONS.md#exam-freeze-current) يحتفظ بدليل S-SHOULDER-Y-6.

## 6 — QA وحدود الدليل

- Verified: اختبارات parser/validator/الذاكرة والخروج والعزل والحفظ الذري ورفض ACK غير مطابق؛ مع اختبارات v1 للواجهة والاستعادة والمعاينة:51اختبارًا في8ملفات.
- Verified: lint العام بلا أخطاء؛ تحذيران سابقان في simulator-layout-audit؛ lint ملفات الدفعة بلا أخطاء أو تحذيرات.
- Verified:52تحقق متصفح و4axe audits، EN/AR ×390/1440، على النموذج/session/المهايئ الفعليين مع نقل اصطناعي محلي وCSS الفعلي؛ لا تجاوز عرض أو مخالفات axe أو أخطاء متصفح.
- Verified: التدقيق يغطي النموذج، لصق3صفوف، منع الحفظ الجزئي، metadata الصف، منتقي الهاتف وسحب الحاسوب، XLSX المضغوط وقيم الصيغ، CSV، K>N والنقاط والاستبعاد ورفض xls/xlsm.
- Verified: docs:sync مرتان وثبات التشغيل الثاني؛ docs:check؛ status:check --require-previous؛ git diff --check؛ سقف25وتطابق الملفات المحمية وبنية manifest عدا البصمات المعتمدة.
- Verified:28اختبارًا إضافيًا في4ملفات لحراس schema واكتشاف حدود المتصفح ومخطط المشرف؛ لا تغيير لتوقعاتها.
- Verified: طباعة marker قبل وبعد، مطابق حرفيًا: `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`.
- Inferred: إسناد المؤلف خادميًا وحراسة الاستبدال وإصدار المنشور محفوظة بعقود SQL الموجودة غير المعدلة؛ اختبار النقل الاصطناعي ليس دليل قاعدة حية.
- Not run (env): npm run check وnpm run build وnpm run build:pages؛ `ERR_SWC_NATIVE_CACHE` و`Cannot find module './swc.linux-x64-gnu.node'` قبل بدء تحقق التطبيق/البناء.
- Not run (env): اختبار PostgreSQL للحوض والحدود والمنشأ ومهايئي v1؛ `Cannot find module 'pg'` من `/tmp/radlab-ops-postgres/package.json`؛ فشلت تهيئتها، ولم تُضعف أو تُتخطّ الاختبارات.
- Not run (env): تدقيق مسارات التطبيق المبني لتعذر البناء؛ تدقيق الـharness أعلاه لا يحل محل تدقيق المراجع للتطبيق المبني.
- Not run (env): Docker؛ `docker version` أعطى `dial unix /var/run/docker.sock: connect: operation not permitted`.
- Not run (owner): فحص هاتف4ب على main؛ فحصRAD-087 من إفادة المالك لا من تشغيل الوكيل.

رسالة SWC الدقيقة: `SWC native addon: validate cache root /home/agent/.cache: cache root has a parent writable by another user without trusted sticky protection.`
محاولة cache خاص أعطت ERR_SWC_NATIVE_CACHE أيضًا. tsc المباشر لا يعرض أخطاء في ملفات الدفعة؛ يبقى غير ناجح بسبب AppRoutes القديمة التي تعذر توليدها.
تدقيق scene احتاج صلاحية البيئة لإطلاق node بعد EPERM ثم نجح؛ لم يتغير الفحص. تحذيرات docs للسقوف القريبة موثقة دون رفع السقوف أو تعديل RAD-059/RAD-060.

## 7 — المفتوح

CI المطلوب على رأس #190 وتدقيق المراجع للتطبيق المبني وفحص هاتف المالك شروط باقية؛ لا يُنسب نجاح #189 إلى هذه الدفعة.
لا SQL حي أو Variables أو حسابات حقيقية أو نشر يدوي أو preview أو subscribe/poll؛ البوابة مغلقة و5ب غير منفذة.
المسودة تعرض المصدر والرخصة كإفادة قابلة للتحرير؛ على الكاتب حسم صلاحية المصدر قبل النشر، دون اختراع ترخيص أو مراجع طبي.

## 8 — قائمة المالك الموحدة والمتابعة

1. قرارا النطاق وربط الخروج معتمدان ومسجلان في DECISIONS؛ لا قرار مكتبة أو SQL جديد مطلوب من هذه الدفعة.
2. المراجِع: CI كامل أخضر، وفحوص PostgreSQL وتدقيق التطبيق المبني EN/AR390/1440 وaxe؛ تبقى التصحيحات في #190 نفسه.
3. المالك بعد الدمج وCI: لصق3صفوف، رفع1XLSX، معاينة، حفظ، ومنعK>N؛ ثم تسجل نتيجة الهاتف. لا ready أو merge من الوكيل؛5ب بإذن مستقل.
