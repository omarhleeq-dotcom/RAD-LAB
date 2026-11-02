# RAD-059 — تحضير البديل وبروتوكول الإيقاف للمراجعة، 2026-11-02

## 1. الانحرافات والميزانية

**خيار C غير منفذ.** اختار المالك مراجعة بروتوكول متعدد RPC بعد إثبات عائق المهلات؛ هذه الدفعة تحفظ التحضير والعمل المستقل، ولا تدعي إكمال التنفيذ.
Verified — الفرع `rad059/emergency-alternate`؛ أول commit وثائق فقط لقرارات المالك والإغلاقات المعلقة. تحديث main حافظ على تغييرات #205؛ تحقق GitHub أولًا من أن #206 مفتوحة، ثم وصلت مدموجة في main أثناء التسليم؛ دمجنا main دون تعديل ملفات 5ب، وحُفظت تحديثات RAD-062.
النطاق الحالي 8 ملفات من سقف 28، بدل 19 المقترحة قبل العوائق؛ لا وحدات منتج مشتركة:

- `docs/DECISIONS.md`
- `docs/project-status.md`
- `docs/HANDOFF.md`
- `docs/RAD-059_PHONE_RUNBOOK.md`
- `docs/RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md`
- `docs/RAD-059_ALTERNATE_REPORT_2026-11-02.md`
- `supabase/checks/rad059-backlog-health.sql`
- `src/features/assess/rad059-backlog-health.test.ts`

## 2. المنجز والمستبعد

Verified — قرارات المالك 1–11 حرفيًا في [قائمة واحدة](DECISIONS.md#rad059-alternate-owner-2026-11-02)، وإجابتاه اللاحقتان في [قرار مراجعة البروتوكول](DECISIONS.md#rad059-protocol-review-owner-2026-11-02).
Verified — إغلاق RAD-085 P1/P5 بإفادة المالك، وتصحيح بروفة P5v2 للهاتف المثبتة في 2026-11-01، وقبول خطر اللابتوب الواحد؛ لا إعادة طلب هذه الأدلة.
Verified — [قائمة الهاتف](RAD-059_PHONE_RUNBOOK.md#قرارات2026-11-02--القنوات-والبديلc): بريد الاثنين، ثلاث سياسات Monitoring، Usage/backlog، إشعارات الهاتف، TEST لكل إشارة ومستجيب، ACK و30 دقيقة، غياب المالك/الاثنين والسجل المشفر.
Verified — [دليل اللابتوب](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md): خطة preflight/backup/rehearsal/apply/verify محجوبة؛ محاولة psql واحدة بالاعتماد القديم على LIVE بعد ≥120 ثانية، وتصنيف محافظ، ثم PR ترقية مستقلة.
Verified — [قراءة backlog](../supabase/checks/rad059-backlog-health.sql): READ ONLY وlock2s/statement5s؛ أعداد تراكمية ≥120/144/167/168 ساعة وheld وأقدم submitted_at للمنتظرين؛ بلا هويات أو محتوى. NULL submission له عداد مستقل.
Not run (pending protocol review) — الترحيل وsuccessor check وواجهتا المالك/البديل وavailability/adapters والترجمات لم تُنشأ؛ لا تعيين أو زر إيقاف عامل.

## 3. حالة المهام

RAD-059 تبقى review/owner حتى القنوات/ACK والبديل والإبطال بشواهد؛ done_when لم تتغير.
RAD-085 تبقى review/owner لبقية الحقوق/D3 والأمن والخصوصية؛ إغلاق P1/P5 فقط. الإحالة التشغيلية الصحيحة RAD-086 بدل RAD-082 التاريخية.
Verified (إفادة المالك، لا إعادة اختبار حي منا) — سجلات Auth/flow_state والأيتام وتوكنات المحذوفين صفر؛ FREE بسجلات ≤24 ساعة وبلا نسخ مزوّد؛ حذف النسخ غير المشفرة وCSV والمهملات كما في القرار.

## 4. المشتركات وScale

Verified — manifest وrequiredMigrations/checks والحراس ثابتة؛ الماركر طُبع قبل وبعد مطابقًا:
`pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`.
Verified — كل ملفات supabase السابقة والحزمتان byte-identical مقابل origin/main؛ لا dependency أو exam/golden أو تغيير 5ب.
Inferred — قراءة backlog قد تمسح كامل sessions؛ مهلة 5 ثوانٍ حاجز فشل لا ضمان سعة. timeout = UNKNOWN؛ رافع السقف قياس وفهرسة مستقلة عند الحمل المتوقع، لا قص أو زيادة مهلة صامتة.
هل تغير حكم بالاختصار؟ لا؛ متطلبات المهلات باقية، وتغيير عقد الاستدعاء مقترح صراحة للمراجعة. هل بقي رابط الدليل الأصلي؟ نعم: [الخطة](RAD-059_REMAINING_PLAN_2026-11-02.md)، [متطلبات C §4](RAD-085_OPEN_REVIEWS_2026-11-02.md#4-المتطلبات-المشتركة-وscale--البديلc-فقط)، [v2](../supabase/manual/assess-emergency-stop-v2.sql)، [P10](archive/reports/2026-10/RAD-062_P10_REPORT_2026-10-30.md#db-day-2026-11-01).

## 5. الطب والدرجات

Verified — لا تعديل طبي أو احتساب درجات أو بيانات امتحانات أو goldens؛ لا SQL حي أو Variables أو بوابة/عامل/سر أو إعداد مزوّد.

## 6. QA وحدود الإثبات

Verified — قراءة AGENTS/HANDOFF والمراجع، docs:context وstatus:summary للمهمتين، fetch main والتحقق من #206 دون subscribe/poll.
Verified — PostgreSQL المضمّن: اختبار backlog بالأعمار الاصطناعية وheld وREAD ONLY وبقاء الصفوف، واختبار مهلات الدالة أدناه. أُصلح consent في fixture الجديدة فقط؛ لم يُعدّل اختبار سابق.
Not run (env) — نمط Supabase17.11/ICU: `No such image: supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d`؛ التشغيل الكامل ذو النمطين فشل setup، وليس نجاحًا كاملًا.
Verified (قبل دمج #206) — `npm run build` و`npm run build:pages` نجحا؛ Pages بلا public Variables: `NEXT_PUBLIC_SUPABASE_URL not set; CSP unchanged (connect-src 'self')`؛ لا دليل نشر أو اتصال حي.
Not run (env) — بعض docs:test: `Required tool unavailable: psql (install the PostgreSQL client packages)` و`spawnSync age-keygen ENOENT`؛ أُطلق الأمر دون تخفيف التوقعات، وليس أخضر.
Verified (قبل دمج main الأحدث الحاوي #206) — شُغل `npm run check` كاملًا: typecheck/lint ناجحان بتحذيرين سابقين؛ 3298 اختبارًا ناجحًا و62 فشل setup في4ملفات للصورة المفقودة أعلاه، مع فشل teardown التابع لها. لا assertion فاشلة بعد نجاح setup؛ ليست check خضراء، ولا skip في التشغيل الكامل.
Verified — الحراس السابقة للنص والحساب والمخطط/الماركر وخصوصية المشرف والحزم وgoldens نجحت ضمن التشغيل الكامل؛ لم تتغير توقعاتها أو ملفاتها.
Verified — docs:sync مرتان والثانية صفر تغيير؛ docs:check بصفر أخطاء وتحذيرات سقف، status:check --require-previous وgit diff --check ناجحان. احتاج docs:check صلاحية البيئة المدعومة بعد `spawnSync git EPERM` دون تعديل الفاحص.
Not run (pending implementation) — owner/alternate flows وEN/AR390/1440 وaxe؛ لا واجهة جديدة لاختبارها، ولا حذف لمعيار قبول.
Not run (later owner window) — القنوات/ACK والغياب وSQL حي وإثبات رفض الاعتماد القديم؛ يلزم المراجع إعادة الفحوص المحجوبة قبل النافذة.

## 7. البروتوكول المقترح والعوائق

Verified — وافق المالك على استثناء ضيق لتوقعات الحارسين اللذين يفرضان deferredMigrations={}؛ لم يُستخدم بعد لأن الترحيل لم يُكتب. تبقى بقية التأكيدات والماركر ثابتة.
Verified — [اختبار PostgreSQL](../src/features/assess/rad059-backlog-health.test.ts) يثبت أن function SET statement_timeout=50ms لا يوقف pg_sleep(150ms)، وأن التقاط انتهاء مهلة100ms لا يعيد تشغيلها لمرحلة200ms التالية. set_config داخل RPC لا يصنع مؤقتًا مستقلًا لكل مرحلة.
Inferred — [البروتوكول المحدد للمراجعة](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md#protocol-for-review--not-approved-for-implementation): start/phase/receipt، ست مراحل مستقلة، إيصال لكل عملية ومرحلة، إعادة تفويض وترتيب أقفال موحد مع الإزالة، ونتيجة pending/UNKNOWN واضحة عند فقد الرد.
Inferred — مهلة كل طلب يجب أن تُسلّح في اتصال الخادم قبل SELECT، مع إثبات سلوك PostgREST. لا ضمان من AbortController أو function SET. إن لم يدعم المسار الموجود ذلك، يلزم نطاق خادم موثوق منفصل بإذن محدد؛ لا تغيير إعداد مشترك أو إضافة اعتماد صامتة.
المقترح يوضح أيضًا محو هوية audit دون tombstone، حدود إساءة الاستعمال، آثار إنهاء الاتصالات غير المعاملية، ووجوب مراجعة الاحتفاظ وقابلية الاستعادة. لا ادعاء بأن هذه التفاصيل اعتُمدت أو نُفذت.

## 8. قائمة المالك والمتابعة

القرارات المقبولة في [DECISIONS](DECISIONS.md#rad059-alternate-owner-2026-11-02) و[قرار اتجاه المراجعة](DECISIONS.md#rad059-protocol-review-owner-2026-11-02)، دون تكرار قائمتها. FREE inactivity ومراجعة Terms عند ترقية الخطة في قائمة الهاتف.
المطلوب الآن مراجعة البروتوكول وتثبيت عقد timeout/UNKNOWN والاحتفاظ؛ ثم إكمال SQL/ACL/erasure/audit والواجهة واختبارات الصلاحية/الإزالة/التزامن/الفشل في Draft نفسها وبسقف28.
بعد إكمالها فقط: نافذة مالك مستقلة للتطبيق والتحقق والإبطال وترقية لاحقة، ثم إثبات البديل والقنوات قبل الإغلاق. البوابة مغلقة والعامل NOLOGIN والسر DISABLED.
