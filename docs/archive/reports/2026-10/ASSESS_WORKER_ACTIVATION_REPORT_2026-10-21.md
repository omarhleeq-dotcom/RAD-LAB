# تقرير قرار TEMP وقناة السر — 2026-10-21 عمّان

## 1. الانحرافات والميزانية

طلب المالك «تمام ابدا» بعد عرض نجاح التجهيز المغلق والخطوة التالية لحسم TEMP وقناة السر قبل التفعيل. فُهم الطلب كبدء إعداد هذا القرار، لا توسيعًا تلقائيًا إلى LOGIN/password/Google أو سحب PUBLIC أو فتح gate. عُرضت ميزانية ستة ملفات توثيق وهي الفعلية: وثيقة القرار وهذا التقرير، ASSESS_WORKER_LOGIN.md وASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md وHANDOFF.md وproject-status.md. لا انحراف أو worktree/subagents أو تغييرات كود/SQL/migrations/package/lock أو Variables/pins.

## 2. المنجز والمستبعد

أُعد [قرار قابل للمراجعة](ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) يقارن سحب TEMP من login والسحب الجماعي والاستثناء وNOLOGIN، ويوصي باستثناء تجربة مؤقت ≤7أيام بعد جرد السطح، دون تغيير PUBLIC المشترك. يوضح خطر استهلاك TEMP وحجب الأسماء وحدود search_path='' وconnection limit. ليست الشروط اعتمادًا للاستثناء أو شهادة سلامة لمخطط المزود.

فُصل مسار السر: psql17 مخفي الإدخال وTLS verify-full، حماية plaintext **وverifier** في logs، توليد تشفيري محلي فريد، ثم أداة مستقبلية تقرأ مخفيًا وتبني JSON بالـserializer وتمره stdin إلى Secret Manager بعد إذن منفصل. وُضع تسلسل NOLOGIN ثم إدخال السر ثم تحقق ثم تفعيل مستقل، مع الحجر عند فشل أي مرحلة. لا أداة سر أُنشئت أو نُصبت أو اعتُمدت؛ تجهيزها واختبار encoding/redaction ببيانات اصطناعية خطوة مستقلة قابلة للتنفيذ محليًا.

صُححت عبارة حزمة الربط القديمة «لم تُطبق على الأصلية» لتشير بدقة إلى [صف المالك للتجهيز المغلق](ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md#worker-login-stage-owner-result). لا إعادة تطبيق/فحص ناجح أو TLS من جهاز المالك، ولا ادعاء اتصال مستقل من الوكيل أو نجاح pooler/credential/runtime. لا موارد خارجية أو كلمة مرور أو SQL كتابة نُفذت.

## 3. لكل مهمة

RAD-056 تبقى review/waiting_on owner: يلزم جاهزية psql على جهاز Windows وحسم السطح/قناة السر والاستثناء قبل تفعيل مستقل. لا completion_evidence أو نقل إلى done. حدّث الوصف والمصدر والملخص الخماسي وrevision/time دون تعديل أي مهمة أخرى؛ تعارض RAD-024 الموروث يبقى ظاهرًا.

## 4. المشترك وScale واستمرارية الحكم

لا تغيير لعقد runtime أو دور assess_worker الذي يشمل publication/recover، ولا إلغاء PUBLIC ضمن NOINHERIT. مقترح7أيام يضيق نافذة التجربة المستقبلية فقط داخل سقف catalogue≤90يومًا؛ لم تتغير سياسة الدوران العامة أو الحواجز أو الموردان a/b. لا حصص TEMP مختلقة أو اعتماد على tuning يستطيع login تغييره كحاجز أمان.

الجرد اليدوي المقترح محصور بالـcatalogue وملخص منقح؛ حجم سطح المزود غير معلوم ولا يوجد scan دوري أو سجل أسرار جديد. قبل تحويل التجربة لتشغيل مستمر يلزم جرد قابل للإعادة بحدود إخراج ومراجعة للمزود ومسؤول وبديل وقناة تنبيه وقبول الإلغاء؛ التجربة لا تتوسع بتجديد تلقائي للاستثناء. لا تغيير لقرار S-ASSESS-15 أو تأجيل النسخة أو O108؛ روابط الحكم وأدلته محفوظة. تغيرت التوصية المقترحة فقط، لا حكم المالك المعتمد.

## 5. الطب والدرجات والخصوصية

لا تغييرات Practice أو طب/صور/درجات/expectations/hashes أو مصادر/ترخيص/Marker أو موافقات مستخدمين. لا بيانات حقيقية أو credentials أو verifier أو PEM مطبوعة أو ملفات سر؛ وثيقة القناة تصف إجراء مستقبليًا وتمنع طلبها بالمحادثة. صاحب النافذة المقترح المالك؛ لا تعيين/رسالة لطرف آخر من ذلك.

## 6. QA وحدود الأدلة

البداية checkout نظيف على `ce7aa43ea9a1e5ef4836ee8e915355e7c0ecc823`، وdocs:context/GitHub أثبتا [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) open/draft وغير مدموجة ورأسها مطابقًا، وmain `ff68413042e6e8414ad70884efcfa71cac7443a7` مطابقًا لمرجع origin/main. لقطة فحوص البداية: main check/deploy completed/success؛ رأس PR deploy completed/success وcheck in_progress. لا تعميم نتيجة لرأس تالٍ أو subscribe/poll/preview أو workflow معاد.

قُرئت مهارة cloud-environment-runtime ومرجع networking والسياسة المدعومة؛ observations_current=true والشبكة restricted/enforced، ولا secrets/runtime variables/outbound identities؛ TCP grants فارغة. لا اتصال DB/Google أو وصول لجهاز Windows متاح. استُخدم GitHub لقراءة مصدر PostgreSQL الرسمي17 لشرح PUBLIC TEMP وpsql password؛ لم نزعم فحص موقع المزوّد أو logs أو برنامج العميل. مصادر الوثيقة ليست أوامر تنفيذ.

نجحت فحوص التسليم: docs:check مقابل origin/main بلا errors أو review warnings، وstatus:check مع require-previous، وgit diff --check. بقي تعارض RAD-024 الموروث معلنًا دون تغيير. لا app build أو اختبارات تطبيق/SQL/Docker/متصفح ناجحة معادة؛ التغيير توثيقي فقط. الفحص البنيوي لا يثبت أمن قناة غير مبنية أو قبول المزوّد.

## 7. المفتوح

لا موافقة TEMP خاصة بعد، ولا جرد فعلي للسطح خارج assess أو للقواعد الأخرى أو حدود موارد TEMP. لا psql على جهاز Windows ثبتت أو أداة سر آمنة بُنيت أو حماية verifier في logs تأكدت. إبقاء NOLOGIN صحيح إلى حسم هذه النقاط؛ لا يمكن تغطيتها بإعادة readiness أو TLS الناجحين.

الشبكة Google/Node وbackend identity وstartup options/ACL والإلغاء الفعلي/cache/frontends ومسؤول التشغيل/البديل وتسليم التنبيه تبقى شواهد مستقلة. O108 وJWT/backup/restore/export والجدولة والنشر بوابات مستقلة؛ لا ترقية حساب أو مورد أو تشغيل عامل من المقترح.

## 8. قائمة المالك وبرومت الاستئناف

الخطوة الحالية من Windows: التحقق فقط من وجود psql ونسخته وإرسال المسار/النسخة أو نتيجة عدم وجوده؛ لا اتصال أو password أو SQL. بعدها يمكن تجهيز أداة الإدخال والجرد واختبارهما اصطناعيًا قبل عرض موافقة محددة على التفعيل. لا إعادة إنشاء assess_job_a أو سؤال النسخة المؤجلة أو تنفيذ \password الآن.

ابدأ AGENTS وHANDOFF وRAD-056 و[وثيقة القرار](ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) وحزمة login وتقرير صف المالك، ثم docs:context/GitHub للرؤوس وفحوصها. تابع checkout نفسه بلا worktree/subagents؛ اعرض ميزانية ومعايير قبول قبل أي تعديل، وراجع الأداة ومسار البيانات قبل اقتراح أي secret حقيقي. تبقى launch_gate مغلقة و#96 مسودة بلا ready/merge/auto-merge أو تغيير Variables.
