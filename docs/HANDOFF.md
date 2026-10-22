# التسليم الحالي — تركيب حماية المهمة4 بنجاح والمتبقي هويات التجربة

## نقطة البداية
اقرأ [AGENTS](../AGENTS.md)، وشغّل docs:context مع --pr 96 وتحقق من أحدث main وفحوص الرأسين، ثم status:summary لـRAD-056. [project-status](project-status.md) مصدر الحالة الوحيد. استمر بالـcheckout نفسه؛ لا worktree/subagents أو ready/merge/auto-merge.

## المنجز والمتبقي
[تقرير الدفعة الثانية](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md) مرجع التنفيذ والفحوص وحدود الأدلة: أُعدت SQL مراقبة read-only ومراجع offline للنسخ/التقرير/الفشل والـleases والإغلاق، وتعبئة scope file اختيارية مثبتة ببصمة داخل build context بحارس0، و[دليل الجدولة والمراقبة والإلغاء والتكلفة](ASSESS_CONTINUOUS_OPERATIONS_2026-10-22.md). لم تُنشأ أو تُفعّل scheduler أو قناة تنبيه. CLEAR ليست قبولًا حيًا؛ الأدوات تقرأ facts المشغّل ولا تصادق مصدرها.

التجربة الحية في4 لم تتم؛ بدأ مسار التحقق بعد طلب المالك إتمامها وتوقف preinstall عند اختلاف catalogue. [الدفعة الأولى](ASSESS_TRIAL_BATCH_ONE_2026-10-22.md) و[الحماية](ASSESS_TRIAL_ISOLATION_2026-10-22.md) وأدوات [التثبيت/الإغلاق](ASSESS_TRIAL_PREPARATION_2026-10-22.md) محلية؛ وصل شاهد تركيب dormant مطابق على المزود؛ المتبقي ملف نطاق مثبت داخل صورة/مهمة مقيدة، هوية/v2 ومحتوى/إسنادات مأذونة وجلسة مالك آمنة ونافذة وإغلاق. لا تعويض بالفروقات أو حذف الموافقات أو انتحال auth.uid.

## النسخ والإغلاق المثبتان
مراجعة المصدر كشفت أن main تستدعي v1 والمسودة v2، وأن الصورة العامة المبنية سابقًا لا تشمل RPC/مدخل التجربة المقيدة؛ نجاح Pages لا يثبت النسخة التي يفتحها الطالب أو نشر runtime. لا تشغّل الصورة العامة للتجربة. تثبيت نسخة UI/SQL/image/config وسلسلة البناء والسر الرقمي قبل نافذتها ما زال مطلوبًا؛ لا تغيير pins/Variables أو merge لإكمال الجدول.

[الربط](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-owner-pass) و[الإغلاق](ASSESS_GOOGLE_PROVISIONING_REPORT_2026-10-21.md#cloud-run-probe-closed-final) و[الجرد](ASSESS_TRIAL_PREPARATION_2026-10-22.md#trial-inventory-owner-result) محفوظة؛ لا تكرار probe/سر/password/تهيئة أو عدّ لمجرد الشاهد. backend0 وNOLOGIN لا يثبتان إلغاء cache/اتصال جديد. لا تقييم حي أو طبي أو استعادة من5/10 أو QA محلية.

## الخطوة التالية والتوقف
وصل تشخيص catalogue ثم نتيجة الدالة الواحدة؛ [المراجعة](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-catalog-reviewed-profile) تفسر30من30من المصدر:16تمثيل NOT NULL بين17/18، و12بصمة CRLF لست دوال، وجسم/تعريف owner_list_participants بتوزيع SELECT محدد وCRLF. البصمتان الكاملتان والطول مطابقان للاشتقاق المحلي؛ لا تبنٍ لمصدر مجهول أو تغيير Practice. خطأ الفحص في تمثيل NOT NULL محفوظ مع تفسيره؛ attnotnull تبقى مقارنة.

وصل [إذن المالك ونتيجة install](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-reviewed-install-owner-pass): PASS بعقد assess-trial-install/2 وdormant=true وruntimeOrLaunchVerified=false. ملف install يتضمن COMMIT ثم تحققًا مستقلًا من catalogue والإغلاق وscope الفارغ؛ رُكبت الحماية خاملًا وفق شاهد المالك. لا تطلب إذن التركيب مجددًا أو إعادة preinstall/install/postinstall والجرد/probe. الإذن للتركيب فقط؛ لا نطاق/هويات/محتوى أو تشغيل عامل منه.

وصلت إفادة توفر مالك وطالبين، ثم صورة واجهة main القديمة. بعد التوجيه لنشر الفرع من لوحة Cloudflare أرسل المالك [سطر v2 المطلوب](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-v2-visible-bound-local-artifact)؛ لا طلب فتح نسخة/قراءة الإصدار مجددًا أو دمج قبل انتهاء Assess وفق اختياره. ظهور السطر لا يثبت حفظ الموافقة أو Auth getUser/profiles. أكد المالك اعتماد الطالبين؛ لا تكرر طلب الاعتماد. لا بيانات دخول/أسماء أو UUID في المحادثة، ولا فتح/مشاركة hosted preview من المساعد.

جُهزت حزمة محلية من8ملفات وأرشيف نقل ضمن workspace المشتركة assess-task4-bound-5U8KIz، بنطاق controller مقترح ثابت وscopeBound=true وحارس0، وبصمات وشاهد STOP للـexecutable في التقرير وverification.json. لا Docker build/push أو Job/نطاق SQL مفعّل من ذلك. لا تعيد اختيار controller UUID بعد ربطه بـSQL/صورة دون مراجعة. بُنيت صورة assess-trial المحددة ورُفعت بإذن المالك وصل [digest النتيجة](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-image-built-owner-result)؛ أُعيد توليد الحزمة بعد ضياعها وتغير controller UUID فقط دون ربطه. لا تعد البناء؛ الصورة ليست Job أو نطاق SQL أو تشغيلًا. الآثار/الهوية/المشروع/الوسم والأرشيف والبصمات في التقرير؛ لا IAM/Job أو أسرار/LOGIN/gate منه. أُثبتت الهويات الثلاث بأربعة PASS من [أداة المالك](ASSESS_TRIAL_BATCH_TWO_2026-10-22.md#trial-identity-check-owner-result) (إفادة ملصوقة؛ لا ربط A/B في المستودع). بعدها يلزم جلسة مالك آمنة للإغلاق ونطاق SQL/المحتوى والإسنادات المأذونة ونافذة وإغلاق. useAccount الحالية getSession وليست getUser؛ لا تكرار الفحص دون تغير الحسابات. لا حفظ موافقة/إسناد/بدء أو LOGIN/gate/عامل أو الصورة العامة من هذه المتابعة؛ الأذونات المحددة باقية.

تابع المهمة4 وفق النتيجة؛ لا تعتبرها تجربة حية منفذة من فحص SQL. تجهيز الصورة/الهوية والمحتوى والنطاق والنافذة والإغلاق تبقى متطلبات منفصلة قبل أي تشغيل، بلا أسرار/OTP أو انتحال auth.uid. لا تبدأ7–8 أو ready/merge/auto-merge؛ الانتقال للدفعة الثالثة يحتاج توجيه المالك الصريح.
<a id="المتابعة"></a>
## القرارات والبوابات الثابتة
[التصميم](DECISIONS.md#assess-owner-2026-10-19) و[الاحتفاظ](DECISIONS.md#assess-retention-owner-2026-10-20) و[النسخة الشاملة المؤجلة](DECISIONS.md#assess-retention-original-no-backup-2026-10-20) محسومة وروابط أدلتها محفوظة؛ لا إعادة اعتمادها. Practice/المعايير/التوقعات/البصمات محفوظة. التشغيل المستمر ومنع التداخل وقناة الإنذار والإلغاء/cache والتكلفة والنسخ/restore/export وO108 والمصادر/الترخيص/المراجعة والخلفية والمعايير وMarker مستقلة؛ لا قبول شامل من تقدم البرمجة.
