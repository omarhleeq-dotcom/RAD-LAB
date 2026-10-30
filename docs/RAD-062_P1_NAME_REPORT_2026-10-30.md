# RAD-062 P1 — الاسم وإصلاح CI الخامل، 2026-10-30

## 1. الانحرافات والميزانية

السلطة: [خطة3+5أ](RAD-062_3-5A_PLAN_2026-10-30.md)، و[قرارها](DECISIONS.md#rad062-plan-3-5a-owner-2026-10-30)، وأمر المالك تنفيذ P1 ثم إصلاح [Draft #166](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/166) على الفرع نفسه. **استثناء لمرة واحدة:20ملفًا إجمالًا بدل16، لهذه المسودة وحدها؛ سقوف PRs اللاحقة ثابتة.** لا worktree أو subagents أو PR جديد. القائمة الدقيقة المعتمدة:

```text
docs/HANDOFF.md
docs/RAD-062_P1_NAME_REPORT_2026-10-30.md
docs/project-status.md
scripts/assess/local-database.mjs
scripts/assess/rad062-name.test.mjs
scripts/assess/rehearse-c.mjs
scripts/pages/frontend-schema.json
src/features/assess/AssessPanel.tsx
src/features/assess/Rad062Entry.tsx
src/features/assess/Rad062NameGate.tsx
src/features/assess/historical-migrations-setup.ts
src/features/assess/rad062-availability.ts
src/features/assess/rad062-name.test.ts
src/features/pilot/full-name.ts
supabase/migrations/20261030000100_rad062_full_name.sql
vitest.config.mts
scripts/assess/rad085-worker-rehearsal.mjs
scripts/assess/build-worker.mjs
scripts/assess/rehearse-e.mjs
scripts/assess/rehearse-f.mjs
```

## 2. المنجز والمستبعد

M01 مؤجل: validator وtrigger للاسم، تحديث handle_new_user، وحارس دخول Assess. يشترط ثلاث كلمات تحتوي حروفًا بأي لغة وحد100 code points بعد القص؛ التسجيل وتعديل الاسم محميان خادميًا عند تطبيقه. القديم الناقص يبقى قادرًا على الدخول وPractice وتحديث الحقول الأخرى، ويستكمل داخل Assess فقط؛ لا اسم من البريد ولا backfill. واجهة EN/AR لا تكشف محتوى Assess قبل تأكيد الخادم بعد الحفظ.

أصلح CI الذي طبق M01 المؤجل داخل بروفة العامل ثم رفض أسماء SYNTHETIC القديمة. العامل وC/E/F يستبعدون `deferredMigrations` من manifest الحقيقي؛ build-worker يستبعدها من قائمة الترحيلات المبنية ويثبت مصدر التصنيف، وتتحقق البروفة من تطابق قائمتي البناء والتطبيق. لم تتغير الأسماء أو التوقعات القديمة. كشف التشغيل الإضافي لـF تحميل ترقية الاحتفاظ v2 في شاهد موافقة v1؛ ثُبت سقف مدخله التاريخي قبل تلك الترقية، دون تغيير الموافقة أو assertions.

**لا يتغير شيء على الموقع المنشور:** M01 لم يُطبق، وRAD062_AVAILABLE=false حرفي مستقل، وP1_AVAILABLE=true. اختبار bundle يعبث بالـmanifest قبل تحميل المستهلك ويثبت صفر تحميل adapter/RPC مؤجل. خارج النطاق SQL حي ويوم القاعدة وP2–P10 و4ب/5ب والتفعيل الحقيقي.

## 3. لكل مهمة

RAD-062 بقيت in_progress/code، مع تحديث وصف إصلاح CI والاستثناء وrevision/الوقت؛ بلا completion_evidence أو ادعاء اكتمال3/5أ. بقية المهام وnext_id وروابط الدليل محفوظة. يوم القاعدة ينتظر اللابتوب وRAD-086 والنسخة المحلية الكاملة المتحقق منها.

## 4. المشتركات وScale وسؤالا AGENTS

التصنيف من manifest، لا قائمة M01 ثابتة. تدقيق المكتشفات: security-rehearsal محدود بما قبل M1 ثم مصادر مسماة مطبقة؛ staging-preflight يأخذ required المتحقق منها؛ phone-sql-packet يستخدم loader المستبعد للمؤجل ثم M1–M4/B المسماة؛ pilot-schema-audit له سقف سابق. فحص schema يظل يرى كل الملفات الحقيقية. لا حاجة لتعديل workflow؛ دُققت الخطوة المباشرة للعامل والاختبارات التي تستدعي البروفات.

شواهد DB التاريخية تحتفظ بسقف B، وأربعة شواهد schema تستخدم شجرة B فعلية مؤرشفة في /tmp؛ الشاهد الجديد يفحص الشجرة الحالية ويطبق M01 صراحة بعد المخطط الحالي. لم تتغير توقعات أو hashes محفوظة. S-STD-3:100 code points؛ نطاق Unicode17 مثبت بين العميل بعد الترقية وSQL، ورفعه يحتاج مراجعة المصدرين والحدود وcorpus. corpus الاختبار الثابت تغطية لغوية، وليس قائمة لغات مسموحة. سقفا C/F تاريخيان للشواهد؛ استبعاد deferred يبقى من التصنيف الحقيقي. مهل M01 للقفل5ثوانٍ والتنفيذ30ثانية.

**هل تغير الحكم؟** نعم، استثناء الميزانية لهذه المسودة فقط؛ قرارات الاسم والخمول وشروط التشغيل ثابتة. **هل بقي رابط الدليل الأصلي؟** نعم؛ روابط الخطة وDECISIONS و#166 أعلاه محفوظة، ولا يعاد تفسير إذن P0 التاريخي بوصفه تنفيذًا لـP1 داخله.

## 5. الطب والتصحيح

لا تغيير للمحاكي أو القيم الطبية أو scoring أو engine version أو goldens أو scene hashes؛ لا قبول سريري أو إعادة تقييم للمحفوظ.

## 6. QA

التحقق الحالي على **Node22.23.4** مثل مسار CI:

- Docker الفعلي: `rad085-worker-rehearsal.mjs` PASS، phase complete،19فحصًا، cleanup=true؛ runtimeOrLaunchVerified=false. لم تشغّل هذه الخطوة محليًا في الجولة الأولى؛ شُغلت الآن كاملة.
- npm ci وإعداد PostgreSQL المثبت ناجحان. emergency-stop:7، lock witnesses:2، erasure/recovery:20، uploader:8، connection-probe:10، docs:test:75؛ كلها ناجحة. بروفتا E وF ناجحتان، وF على PostgreSQL18.4 متوازٍ.
- corpus ثابت متعدد اللغات: RAD062_LETTER مقابل /\p{L}/u الأصلي على Node الخاص بـCI، ثم SQL مقابل validFullName بحارس مفعل في bundle بالذاكرة فقط، على **نفس corpus**. نجح الشاهدان؛ يشمل اختبار M01 التسجيل/التعديل والحدود والقديم وكتابة Practice وACL/OID. دليل PostgreSQL17.10 من الجولة الأولى محفوظ في تاريخ #166؛ لا ادعاء تشغيل17.11 غير المتاح عند الفحص.
- `npm run check` نجح كاملًا مرة واحدة:232ملفًا و3114اختبارًا، وtypecheck وlint ناجحان؛ تحذيران سابقان فقط في simulator-layout-audit خارج النطاق. اختبار manifest العامل الجديد يثبت غياب المؤجل وصحة digests وتثبيت مصدر التصنيف.
- `npm run build` و`npm run build:pages` نجحا مرة واحدة لكل منهما، كما في CI. لا NEXT_PUBLIC_SUPABASE_URL محلي للبناء؛ بقي CSP على self. اختبار marker المنفصل يستخدم origin العام المسجل، بلا اتصال حي أو تغيير Variables.
- docs:check مع base origin/main:صفر أخطاء وصفر review warnings؛ status:check مع require-previous وgit diff --check ناجحة. تدقيق المجموعة يثبت20ملفًا بالضبط، وثبات required/checks وبايتاتها وM01 مقارنة بالرأس السابق، وحفظ الأسماء وassertions القديمة حرفيًا.

البصمة الكاملة المحفوظة، بلا تغيير متغير حي:

`pilot-v1:6d690343c1ce5e95221d9e67eda65b62dc552ac0e95e78cf41074bc069bfc1be`

## 7. المفتوح

مراجعة المسودة ونتائج الأتمتة على الرأس المدفوع؛ لا افتراض CI أخضر قبل انتهائه. لا فحص هاتف أو SQL حي أو DB day أو نشر يدوي، ولا دليل تشغيل17.11. تبقى الحقوق/O4 والخصوصية وRAD-086 والطوارئ الهاتفية والقنوات/ACK والبديل وشروط أول امتحان قائمة؛ دمج backend لا يغلقها.

## 8. قائمة المالك وبرومبت المتابعة

سطر P9 في HANDOFF يوضح أن المستخدم المنشأ بعد الترقية بلا display_name من ثلاث كلمات يُرفض، بما فيه الإنشاء من لوحة Supabase؛ لا اشتقاق من البريد. راجع #166، ثم تحقق من دمج P1 قبل أي P2 من main محدث وفق إذنه وسقفه الأصلي. أبق الترحيلات مؤجلة والحارس false والـmarker ثابتًا حتى يوم CLI المراجع بعد RAD-086 والنسخة الموثقة ثم P10. Draft فقط؛ لا ready/merge/auto-merge أو skip ci أو preview مستضاف. CI وDeploy Pages المعتادان فقط، بلا نشر يدوي.
