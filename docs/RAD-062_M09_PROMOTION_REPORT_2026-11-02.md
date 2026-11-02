# RAD-062 — إغلاق الخادم وتوقف تحضير ترقية M09، 2026-11-02

## 1 — الانحرافات والميزانية

الهدف PR ترقية مراجعة تبقى Draft حتى نافذة المالك؛ توقف التنفيذ عند شروط STOP الصريحة في أمر المالك.
التعديل الفعلي خمسة ملفات توثيقية فقط: DECISIONS، project-status، HANDOFF، هذا التقرير، وM09_LAPTOP_RUNBOOK.
Commit1 يوثق إغلاق الخادم والقرار والحواجز؛ تصحيح الخطوة1 في commit تالٍ. لا وحدات مشتركة متغيرة.
الحد الأدنى للترقية **13/12** ملفًا؛ القائمة الكاملة المطلوبة قبل أي تعديل برمجي:

1. `scripts/pages/frontend-schema.json`
2. `scripts/docs/rad062-db-day.test.mjs`
3. `src/features/assess/rad062-name.test.ts`
4. `src/features/assess/rad062-freeze-foundation.test.ts`
5. `src/features/assess/rad062-lifecycle.test.ts`
6. `src/features/assess/rad062-manual-grading.test.ts`
7. `src/features/assess/rad062-erasure-operations.test.ts`
8. `src/features/assess/rad062-supervisor-catalogue.test.ts`
9. `docs/RAD-062_M09_LAPTOP_RUNBOOK.md`
10. `docs/DECISIONS.md`
11. `docs/project-status.md`
12. `docs/HANDOFF.md`
13. `docs/RAD-062_M09_PROMOTION_REPORT_2026-11-02.md`

## 2 — المنجز والمستبعد

Verified (GitHub read): [#199](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/199) مدموجة، merge `3c887cb31f523f3a49128305da50dd433f8e6a0c`.
Verified (GitHub read): على الرأس `5739d8d8e49e454ffa4c9c1f0be69086853c25a3` نجحت [CI](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41404586717) و[Deploy](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41404586531).
Verified (owner-provided reviewer evidence, 2026-11-02): `npm run check` كامل،3350/3350 في249ملفًا كمستخدم non-root، بما فيها M09 في embedded والصورة المثبتة Supabase17.11/ICU؛ أصلح المراجع teardown في5739d8d.
هذه إفادة المالك عن تدقيق المراجع، وليست إعادة تشغيل محلية في هذه الدفعة؛ [التقرير السابق](RAD-062_SUPERVISOR_GRADING_SERVER_REPORT_2026-11-02.md) يبقى سجلًا تاريخيًا دون إعادة كتابة.
سُجل option A في [القرار القائم](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02)؛ تصحيح الخطوة1 وحدها تالٍ.
لم تُنفذ الترقية؛ لا PR ترقية مكتملة أو marker جديد موثّق. تبقى M09 deferred وكل SQL/checks ثابتة.

## 3 — المهمة والتوقعات المطلوبة

RAD-062 تبقى in_progress/waiting_on owner؛ شرطها التالي:
`M09 applied live in the owner window + promotion PR merged with the new marker + CI/Deploy green + owner phone check`.
لم يتغير أي توقع اختباري. القيم التالية تشخيص **قبل → بعد مطلوب**، وليست تغييرات منفذة:

| file:line | قبل → بعد مطلوب |
| --- | --- |
| `scripts/docs/rad062-db-day.test.mjs:90` | required M01–M08 بعد الأساس → إضافة M09 حرفيًا |
| `scripts/docs/rad062-db-day.test.mjs:92` | إدخال M09 المؤجل بالاسم/SHA/reason/serverModules → `{}` |
| `scripts/docs/rad062-db-day.test.mjs:99` | check الأخير `rad062-ready.sql` → `rad062-m09-ready.sql` |
| `src/features/assess/rad062-name.test.ts:37` | إدخال M09 المؤجل نفسه → `{}` |
| `src/features/assess/rad062-name.test.ts:45` | check القديم → الجديد |
| `src/features/assess/rad062-name.test.ts:55` | required M01–M08/check القديم → إضافة M09/check الجديد |
| `src/features/assess/rad062-freeze-foundation.test.ts:72` | required M01–M08/check القديم → إضافة M09/check الجديد |
| `src/features/assess/rad062-lifecycle.test.ts:257` | required M01–M08/check القديم → إضافة M09/check الجديد |
| `src/features/assess/rad062-manual-grading.test.ts:215` | required M01–M08/check القديم → إضافة M09/check الجديد |
| `src/features/assess/rad062-erasure-operations.test.ts:353` | required M01–M08/check القديم → إضافة M09/check الجديد |
| `src/features/assess/rad062-erasure-operations.test.ts:354` | احتواء check القديم → الجديد |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:65` | required/checks مطابقان main الخامل → قيم الترقية الدقيقة |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:66` | SHA في deferred → SHA في guardedFeatures.rad062.migrationSha256 |
| `src/features/assess/rad062-supervisor-catalogue.test.ts:67` | marker القديم → الجديد بعد توليده من الترقية المراجعة |

## 4 — التغييرات المشتركة وScale

لا تغيير كود مشترك أو سلوك أو تبعيات؛ #196 مؤجلة. سقف12 يرفع فقط بقرار مالك جديد؛ لا تقسيم يخفي إجمالي الملفات.
يلزم أيضًا حسم مستهلكي manifest قبل استئناف الترقية، ولا تعديل لهم في هذه الدفعة.

## 5 — الطبي والدرجات وسؤالا AGENTS

لا تغيير طبي أو درجات أو امتحانات أو UI؛ لا تشغيل مؤقت للاختيار المتعدد.
هل تغير الحكم عند اختصاره؟ لا؛ الاستثناء الجديد نافذة M09 منصوص عليه بقرار المالك، ولا يخفف شروط فتح البوابة.
هل بقي رابط الدليل الأصلي؟ نعم: [التصميم §4.3/4.7](RAD-062_SUPERVISOR_GRADING_DESIGN_2026-11-02.md)، [قرار المالك](DECISIONS.md#rad062-supervisor-grading-owner-2026-11-02)، و[سابقة P10](archive/reports/2026-10/RAD-062_P10_REPORT_2026-10-30.md).

## 6 — QA

Verified: قراءة main المحدث ودمج #199 ونجاح CI/Deploy كما في القسم2؛ الأدلة المحلية النهائية تسجل بعد فحص الوثائق.
Not run (STOP scope): اختبارات الترقية و`npm run check` و`npm run build` و`npm run build:pages`؛ لا تنفيذ ترقية أو تغيير منتج، وليست عوائق pg/Docker/build مثبتة.
Not run (STOP scope): M09 بالنمطين؛ fixture لم تُمس، ونجاح المراجع السابق منفصل أعلاه.
الماركر القديم: `pilot-v1:a405c50c66f64fd7521434e09bffb1da008b38fd3cd6010b2e64c0980ba6c93c`.
Not run (STOP scope): الماركر الجديد/`--print-marker` للترقية؛ لا قيمة مؤقتة أو Variable معدلة.
Inferred: بعد الترقية يُتوقع فشل deploy/schema gate ما دام `PILOT_SCHEMA_VERIFIED` قديمًا وفق P10؛ لا ينطبق اختلاف marker على هذه الوثائق وحدها.

## 7 — الحواجز ومحفزات رفعها

Verified (static/Git): الحد الأدنى13ملفًا؛ لا يمكن استيفاء check مع12 دون تجاهل ملفات توقعات قائمة.
Verified (Git): `scripts/docs/rad062-db-day.test.mjs:104–106` يقرأ جميع requiredMigrations من023ec84، حيث M09 غير موجودة؛ `git cat-file -e` خرج128: `exists on disk, but not in '023ec84c15bfd744f317ec079e2587d90e099414'`.
هذا تأكيد هوية بايتات تاريخية، لا قائمة required/checks أو pin؛ إصلاحه خارج الاستثناء المأذون: STOP قبل تعديله أو حذف/تخفيف التأكيد.
Inferred (static): `scripts/assess/rad062-m09-rehearsal.mjs:22` يقرأ `deferredMigrations[file].sha256` مباشرةً؛ سيغيب الإدخال بعد الترقية. يلزم قرار بشأن checkout الخامل/مستهلك البروفة قبل اعتماد خطوات النافذة.
Inferred (static): `scripts/assess/rad062-db-day.mjs:12–14` يفرض ثمانية ملفات وتواريخ M01–M08؛ إضافة M09 إلى guardedFeatures.rad062.migrations تتعارض مع `package_count`؛ لا توسيع تلقائي ليوم القاعدة القديم.
أي حل لمستهلك كود يزيد النطاق والقائمة أعلاه؛ رفع السقف وحده لا يجيز تعديلًا آخر. لا SQL أو phone packets أو gate/Variable.

## 8 — قائمة المالك الموحدة والنافذة اللاحقة

1. احسم سقف13ملفًا على الأقل، واستثناء إثبات البايتات التاريخي، وخطة مستهلكي manifest؛ عندها تستأنف Draft نفسها للترقية والتحقق الكامل، بلا ready/merge.
2. راجع SHA وبصمة M09 `9152676e5975333e1bedaf453c7b7855d5f8e910df7d03dc1e64cdf78037dc0a`، وCI والبروفات والنسخ/الاستعادة وسائر شروط [الدليل](RAD-062_M09_LAPTOP_RUNBOOK.md).
3. ACK/البديل [RAD-059](RAD-059_PHONE_RUNBOOK.md) والحقوق/الخصوصية/الموافقة RAD-085 شروط فتح البوابة، لا نافذة M09؛ لا شروط أخرى مخففة.
4. بعد إذن حي مستقل: المالك ينفذ خطوات1–6؛ بعد تحقق5 والاحتواء6 يضع في الخطوة7 marker الترقية المراجع في GitHub repository Settings → Secrets and variables → Actions → Variables → `PILOT_SCHEMA_VERIFIED`، ثم يدمج PR داخل النافذة قبل8.
5. في8 يتحقق من CI/Deploy للدمج والهاتف؛ البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ شاشة5ب وفتح البوابة لاحقًا بشروطهما.
6. نص الإذن المنفصل، غير صادر هنا: «أجيز نافذة تطبيق M09 الحية من اللابتوب على SHA المراجع، بعد اكتمال CI والبروفات والنسخة والاستعادة وسائر شروط دليل M09 المعدلة بالقرار2026-11-02، ومع PR الترقية والماركر المراجعين. أنا المالك أنفذ SQL والمتغير والدمج والهاتف؛ تبقى البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ لا شاشة5ب أو إطلاق ضمن هذا الإذن».
