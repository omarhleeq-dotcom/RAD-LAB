# RAD-085 — إصلاح جاهزية CRLF وفق B7 · 2026-10-28

1. **الانحرافات والميزانية:** الهدف إزالة حساسية CR في فحوص DB day تحت الاستثناء [RAD085-CRLF-READINESS-20261028](DECISIONS.md#rad085-crlf-readiness-owner-2026-10-28). الملفات: D3 readiness، precheck، تعليق rollback، شاهد جديد `rad085-crlf-readiness.test.ts`، المساعد `local-database.mjs`، وهذا التقرير وDECISIONS والحزمة وHANDOFF والحالة. استُخدم اختبار جديد واحد من ميزانية اختبارين؛ لا تعديل لتوقع اختبار قائم. توسعة المساعد أُعلنت قبل التعديل: خيار `allMigrationLineEndings:true` يشمل كل التاريخ، وافتراضيه يحفظ شواهد التاريخ المختلط القديمة.

2. **المنجز والمستبعد:** نجح docs:context وstatus:summary عند البدء. الفرع من main المحدّث؛ #143 مدموج (#143 رأس البداية)، و#144 Draft مفتوح وغير مدموج (قراءة GitHub مباشرة). لا SQL حي أو تعديل لترحيل أو manifest أو Terms أو CONSENT_VERSION. marker بقي `pilot-v1:a514b79f52c5816ec767730da1f88a38efad7da795bf977abef751ca7542ee10`. لا merge/ready/auto-merge ولا preview URLs ولا subscribe/poll.

3. **حسب البند:**

| البند | التغيير والدليل |
|---|---|
| R1 | إزالة CR من `pg_get_functiondef` قبل SHA-256؛ ومن تعريفات default/constraint/trigger/index وqual/with_check للسياسات قبل تجميعها وبصمتها. أسماء الكائنات وACL والمالكون والإعدادات والامتيازات والأعداد والأدوار وFK والسياسة تبقى مقارناتها كما كانت. كل expected digest باقٍ حرفيًا. |
| R2 | md5 بعد إزالة CR للدوال الأربع فقط؛ أربعة أعمدة `*_has_cr` معلوماتية. `*_ok` يجب true و`recent_*` صفر؛ CR ليس سبب توقف. |
| R3 | سكربت التراجع التنفيذي لم يتغير؛ تعليق يوضح أن LF يستبدل CRLF. الشاهد يقارن كل دالة قديمة بعد إزالة CR مع owner/ACL حرفيًا، ومجموعة triggers كاملة. حفظ محاولة يعمل، إيصالات RAD-085 تتوقف، قائمة C2 تعمل وRPC جديد يُرفض 42501. |
| R4 | PostgreSQL 18 اصطناعي بلا TCP أو مزوّد: `openLocalDatabase('postgres',{through:'pre-rad085',lineEndings:'crlf',allMigrationLineEndings:true})`. تجربتان مستقلتان: M1–M4 والمُهيّئ LF ثم CRLF. precheck هادئ وكل OK true وكل has_cr true؛ progress بعد كل مصدر كما في الحزمة؛ 13/13 true قبل المُهيّئ وبعده؛ smoke/counts صحيحة؛ rollback مرتان true/0/true. كل صف أولي باقٍ بمقارنة JSON containment، وكل جدول قديم وجديد مطابق ببصمته قبل/بعد التراجع، بما فيه receipt جديد. الدوال الأربع المستعادة LF. |
| حواجز سلبية | انحراف محتوى close_assignment يرفضه precheck؛ تغيير محتوى health يرفضه صف functions؛ منح anon EXECUTE يرفضه functions وeffective_privileges. لا إعادة توليد بصمات. |
| R5 | جرى فحص progress، smoke، counts-after، الـprobe في الحزمة، ملفات النسخ ومنها كتالوج 28، المُهيّئ، rollback والفحوص التسعة الحالية. لا مقارنة نصية أخرى حساسة لـCR في مسار DB day؛ `training-ready` يبحث عن الرمز `display_name` فقط فلا يتأثر. النسخ يحتفظ بالتعريف الخام عمدًا. `rad085-p1-ready.sql` التاريخي لديه البصمة الخام نفسها، لكنه خارج الحزمة الحالية وبقي دون تعديل؛ `rad085-application-inventory.sql` يعرض SHA خامًا تشخيصيًا دون مقارنة/بوابة، وبقي كما هو. |

**القيم المتوقعة وpins هذه الشعبة:** لا تغيير، لذلك لا قائمة old/new مخفية. البصمات الثماني في D3 والأربع في precheck بقيت حرفيًا؛ اختبارا LF القديمان للحزمة/التراجع محفوظان. لا qa:golden أو qa:characterise.

**#144 — قائمة rebase فقط، بلا تعديل أو تعليق عليه:** قرئ رأسه `a9be5adb51a33d78457d3cc9ab4abfa9dd6f4c95`. إدخال `supabase/checks/rad085-d3-ready.sql` في `scripts/pages/frontend-schema.json` يجعل marker الترقية يعتمد على بايتات هذا الملف؛ لا pin SHA مستقل له. بعد دمج B7 يجب إعادة حساب marker الترقية وإعادة QA على #144، ثم تحديث مواضع القيمة القديمة `pilot-v1:42cc4a1a2cab288bfc814bc853cb760efaf151316a24ac1d47674ebe36ec73cf`:

- `src/features/deployment/c2-deferred-schema.test.ts:8`.
- `src/features/deployment/owner-dashboard-deferred-schema.test.ts:10`.
- `src/features/supervisor/p1-schema.test.ts:56`.
- `docs/RAD-085_PROMOTION_REPORT_2026-10-27.md:26` و`:92`، وجدول pins المختصر في `:46`، ووصف PR نفسه.

القيمة الجديدة **غير محسوبة أو معدّلة هنا**؛ هذا الفرع يحتفظ بالـmarker الحالي. marker الحالة الخاملة في `p1-schema` لا يعتمد على D3 لأنه يستخدم assess-staging-ready. لا تغيير مطلوب لـpin الحارس بسبب B7.

4. **المشترك وScale:** خيار المساعد محلي اصطناعي فقط؛ لا مصدر اتصال جديد. نطاق الترحيلات الأربعة والدوال الأربع ثابت لهذه الحزمة، وليس آلية ترقية عامة. رفعه عند إضافة مصدر DB day يحتاج مراجعة الشاهد وقائمة التراجع؛ قوائم الكتالوج والأعداد الحالية تظل تفشل عند أي انحراف. لا سقف منتج أو قراءة مستخدمين جديدة.

5. **الطب والدرجات:** لا تغيير طبي أو scoring أو مشاهد أو بيانات امتحانات؛ الصفوف اصطناعية.

6. **QA:** نجح typecheck؛ lint بلا أخطاء مع تحذيرين قائمين في `scripts/qa/simulator-layout-audit.mjs` غير المعدّل؛ **221 ملفًا / 3042 اختبارًا** نجحت في التشغيل الكامل، ومنها شاهدا B7 واختبارات الحزمة والتراجع القديمة. نجح build وbuild:pages وdocs:check (صفر أخطاء/تحذيرات مراجعة) وdocs:test (75/75) وstatus:check مع `--base origin/main --require-previous` وgit diff --check. شواهد CI الإضافية محليًا: القفل 2/2، الاستعادة20/20، العامل الفعلي داخل Docker بنتيجة PASS وcleanup=true، رافع الأسرار الاصطناعي8/8، وفحص الاتصال10/10. أداة marker طبعت القيمة الحالية حرفيًا. حدث انقطاع عابر لاتصال البيئة ثم عاد، وأُعيد docs:context وstatus:summary بنجاح؛ العمليات أكملت دون إعادة الاختبارات الناجحة. **CI على الرأس النهائي ودليله يسجلان في وصف Draft PR** بعد قراءة النتيجة مرة واحدة؛ لا subscribe/poll. لا تدقيق متصفح مطلوب لأن الواجهة لم تتغير؛ لا qa:golden أو qa:characterise.

7. **المفتوح:** مراجعة مستقلة، ثم إذن حي منفصل وتنفيذ المالك للحزمة. لم يُثبت SQL Editor أو المزوّد أو الهاتف محليًا. #144 يحتاج rebase لاحقًا؛ CSV ليس استعادة Auth/ACL؛ Docker وRAD-082 مؤجلان، وRAD-082/RAD-059 قبل أول امتحان.

8. **قائمة المالك والمتابعة:** راجع B7 وشاهده وCI أولًا. بعد دمجه أعد تأسيس #144 وتحديث pins المذكورة وإعادة QA؛ DB day يظل وفق [الحزمة](RAD-085_DB_DAY_P1.md) وبإذن حي منفصل. برومبت المتابعة: «اقرأ AGENTS وHANDOFF وB7 وهذا التقرير؛ تحقق من Draft وCI، لا SQL حي ولا دمج أو ready أو تعديل #144 دون مهمة لاحقة».

**هل تغيّر الحكم؟** نعم فقط تمثيل نهايات الأسطر وفق B7؛ باقي O1–O5 وS1–S8 وB1–B5 ثابت. **هل بقي دليل الحكم الأصلي؟** نعم، روابط القرارات وتقارير B1–B5 محفوظة؛ عدّل وصف المطابقة في الحزمة إلى المطابقة بعد إزالة CR مع توثيق استعادة LF.
