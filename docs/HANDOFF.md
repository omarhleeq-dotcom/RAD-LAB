# التسليم الحالي — حماية تجربة Assess محليًا والتركيب المغلق المتبقي

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع تحقق GitHub لأحدث main و#96 وفحوص رأسيهما، ثم status:summary لـRAD-056. [project-status](project-status.md) مصدر الحالة الوحيد. تابع checkout نفسه؛ لا worktree/subagents أو ready/merge/auto-merge.

## المنجز المثبت
وصل [نجاح اتصال Cloud Run](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-owner-pass) بالسر المثبت وNode/TLS/هوية العامل ومعاملة READ ONLY، ثم [الإغلاق النهائي](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-closed-final): دخول معطل ومنتهي ولا backend للدور والبوابة مغلقة. لا إعادة تجهيز أو سر/password أو probe أو عد جلسات لمجرد الشاهد. العامل الفعلي بحارس0 ولم يشغّل مهام Assess. [دليل التشخيص](ASSESS_CONNECTION_PROBE.md) يوضح حدود PASS؛ cache/رفض اتصال جديد والإلغاء الكامل غير مثبتة.

أُنجزت [مراجعة الدورة وخطة النسختين](ASSESS_CONTROLLED_TRIAL_READINESS_2026-10-22.md)، ثم [حزمة التحضير المحلية](ASSESS_TRIAL_PREPARATION_2026-10-22.md): جرد SQL بقراءة فقط وسقف وفشل صريح، وأداة تثبيت مرشح mixed واحد بالتحقق القائم وإغلاق النقل، وإغلاق إسناد عبر Auth ثم صلاحيات SQL. لا تثبيت ضمن grading tick أو انتحال هوية. التقرير يحفظ الفحوص المنفذة وغير المنفذة؛ الأدوات غير مستخدمة حيًا أو مضافة لصورة العامل.

## الخطوة التالية
وصل [جرد الأصلية من المالك](ASSESS_TRIAL_PREPARATION_2026-10-22.md#trial-inventory-owner-result) بلا بيانات تشغيلية أو مستحقات؛ metadata الموافقة القائمة غير مستحقة للحذف وتبقى كما هي. لا طلب إعادة الجرد أو probe أو أي أمر حي للمالك الآن. الدليل أعداد Assess فعلية في لقطة، مستقل عن backend_sessions؛ لا يثبت الحسابات أو v2 أو UI/SQL أو قفل تزامن.

نُفذت [حماية النطاق والتزامن محليًا](ASSESS_TRIAL_ISOLATION_2026-10-22.md) في SQL اختيارية تحت scripts، وليست migration مطبقة. تبدأ بلا صف نطاق؛ عند تفعيلها مستقبلًا تحصر كتابات Assess، وتحمي كل RPC للدورة بأقفال EXCLUSIVE NOWAIT وفحص bounded وروابط UUID، وتحفظ الموافقات القائمة. READ COMMITTED مطلوب لكتابات Assess المحروسة حتى في dormant لمنع snapshot قديمة تتجاوز التفعيل؛ لا ادعاء توافق حي أو عدم أثر للتثبيت الخامل. دوال المجال والمصحح والاحتفاظ أصلية بلا تعديل. تقرير الحماية يحفظ QA وحدود PostgreSQL/Unix socket الاصطناعية؛ لا JWT/TLS أو مزود جديد.

التالي تجهيز حزمة تركيب dormant مستقلة: فحص أجسام/ACL/ترتيب triggers وقيود READ COMMITTED والصلاحيات وpostcondition مغلقة على المزود قبل أي نافذة تطبيق، ثم تطابق UI/SQL وجلسة مالك آمنة وتعبئة العملية المقيدة ونافذتها. لا تشغيل ملف trial-isolation.sql في SQL Editor أو تغيير Cloud Shell/IAM/Variables أو mount الآن. لا تكرر تجهيز الحماية أو الجرد أو probe. scopedTrialWorker لا ترجع إلى RPC العامة عند غياب SQL/النطاق؛ صورة العامل الحالية عامة ولا تستخدم للتجربة. لا trigger/assert helper أو جداول للعامل؛ أضيفت RPC مغلفة دون سحب قدراته القديمة، لذلك ليس tick-only. حافظ على حجر الإدارة/DDL قبل تجربة فعلية؛ الحارس لا يحمي من إداري يعطل triggers.

التجربة لاحقًا بمالك وطالب مسند وآخر غير مسند، سؤالين MCQ غير طبيين ونسختين مؤقتتين لاختبار visible/hidden/expiry مع الحفظ والانقطاع والاستكمال والتسليم والإغلاق. الأدوات المحلية لا تُطلقها؛ يلزم تجهيز جلسة المالك الآمنة وتعبئة مستقلة وتثبيت UI/SQL ونافذة ودليل إغلاق بإذن مستقل. لا محتوى طبي/عملي كامل أو قبول طبي من نتيجة هندسية معروفة. اشرح وظيفة كل خطوة قبل أمرها وحدد مكانها؛ لا أسرار/OTP بالمحادثة.

## الأدلة المحفوظة
اختيار [Google Cloud Run](DECISIONS.md#assess-cloud-run-owner-2026-10-21) ثابت؛ [المكتبة](ASSESS_RUNTIME_LOCAL.md) و[تقرير الحاوية](ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md) يحفظان QA المحلي وحدوده. PID1 المحاكى وPostgreSQL Unix socket لا يثبتان Google/TLS/القتل مع المزود؛ lease/COMMIT يبقيان مرجع عدم اليقين دون retry عمياء. SQL وجرد وصلاحيات وزوج خدمة F/retention المغلقة مثبتة في [تقرير تركيب الاحتفاظ](ASSESS_RETENTION_INSTALL_REPORT_2026-10-20.md#retention-closed-pair-owner-result)، ولا تعاد دون تغير. v1 لا تنوب عن v2، ولا موافقة نيابة عن مشارك أو هاتف جديد من Pages.

<a id="المتابعة"></a>
## المتبقي والحدود الثابتة
[التصميم](DECISIONS.md#assess-owner-2026-10-19) و[الاحتفاظ](DECISIONS.md#assess-retention-owner-2026-10-20) و[النسخة الشاملة المؤجلة](DECISIONS.md#assess-retention-original-no-backup-2026-10-20) محسومة؛ لا إعادة سؤال أو تجهيز نسخة تلقائيًا. restore تحتاج حجر الشبكة/API/الهويات وإعادة آثار الإغلاق والتعطيل والموافقة وmetadata المحذوفة والحذف وفحص ACL؛ purge وgate وحدهما لا يحجران القراءات. لا backup/recovery/export مثبتة.

Practice ودرجاته وصوره ومعاييره وتوقعاته وبصماته محفوظة. O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، وruntime والعامل والجدولة والمراقبة/cache والتكلفة والنسخ والاستعادة والتصدير والنشر والقبول بوابات مستقلة. لا فتح launch_gate أو LOGIN أو عامل/scheduler أو محتوى حي أو IAM/Variables من التحضير. نجاح Pages لا ينشر runtime. لا قبول حي أو تشغيل مستمر من PASS الاتصال أو الأدوات المحلية.
