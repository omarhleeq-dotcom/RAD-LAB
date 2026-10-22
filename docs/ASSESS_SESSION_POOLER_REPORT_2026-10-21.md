# تقرير إصلاح اسم Session pooler المحلي — 2026-10-21 عمّان

## 1. السلطة والميزانية والانحرافات

بعد إنشاء حساب Google وميزانية التنبيه يدويًا، أفاد المالك بأن DB في eu-central-1 / Central EU Frankfurt، وأن direct IPv6 وsession pooler IPv4 proxied for free، ثم أذن «تمام ابدا بحل العاء» وأكد «اكمل العمل». الإذن إصلاح محلي لعائق الاسم لا إنشاء Job/secret/SA أو ربط قاعدة حية. قُرئت AGENTS وHANDOFF وRAD-056 ودليل runtime وحزمة الربط وتقرير الحاوية والنقل/المهمة/اختباراتهما، ومهارة cloud-environment-runtime وسياسة الشبكة. البيئة enforced بلا هوية Google أو سر مربوط؛ لا credential أو قاعدة أصلية استُخدمت.

عُرضت ميزانية **تسعة ملفات** وهي الفعلية: server-runtime.ts واختباره، server-job.ts واختباره، ASSESS_RUNTIME_LOCAL.md وASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md وهذا التقرير وHANDOFF.md وproject-status.md. الوحدة المشتركة المتأثرة هي نقل العامل الخاص وإعداد Job فقط؛ لا انحراف أو worktree/subagents. لم تتغير migrations/SQL أو package/lock أو صورة Docker/entrypoint أو server-service أو frontend-schema/guard/pins أو Variables.

## 2. المنجز والمستبعد

أُضيف sessionPoolerProjectRef اختياري صريح إلى إعداد العامل وparser المهمة. user يبقى اسم login DB المحدود؛ pg يرسل user.projectRef إلى pooler، وSQL يقارن session_user بـlogin الأصلي المثبت عند إنشاء binding، ولا يستنتجه من استجابة الخادم أو suffix وارد. التحقق من current_user وNOINHERIT والعضوية الوحيدة assess_worker بلا admin والأعلام الإدارية محفوظ حرفيًا؛ SET LOCAL ROLE والمهل وCOMMIT/ROLLBACK والتنقيح وعدم replay كما هي.

المسار الاختياري يفرض port5432 وproject ref من1..63 من a-z0-9، ويرفض null/undefined/فراغ وحقول النقل البديلة أو config الزائدة. لا قبول user مركب بدل login أو postgres/admin. إعداد direct القديم بستة حقول باقٍ بلا fallback أو اكتشاف آلي؛ ملف Job واحد≤64KiB وpool1 وحد claim1 وإغلاق النقل محفوظة. لا transaction6543 أو دعم ORM/DSN عام أو تغيير startup options لتجاوز رفض مزود غير مفحوص.

حدث [دليل runtime](ASSESS_RUNTIME_LOCAL.md#إعداد-session-pooler-المحلي) و[حزمة القرار](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md): europe-west3 مرشحة قرب DB Frankfurt بدل توصية us-central1 الأولية، وsession5432 مرشح IPv4 دون شراء إضافة مدفوعة. حساب$0.57 السابق يبقى مثال المعدلات المرجعية لا تسعيرة europe-west3؛ تسعير المنطقة وegress وقبول الإقامة مطلوب قبل provisioning. اختيار المسار ليس قبول TLS/Supavisor أو ضمان كلفة صفر.

لقطات المالك أثبتت عرض مشروع My First Project ومعرفه وربطه بحساب تجريبي وميزانية تنبيه شهرية محفوظة$5 على جميع مشاريع حساب Billing، مع Actual10/25/50/80/100% وForecast100% وبريد billing admins/users. هذه شواهد شاشة لا agent API أو اختبار وصول البريد. إلغاء Promotional credits كان توجيهًا؛ لم تصل لقطة بعده تؤكد حفظ تلك القيمة فلا نعلنها مثبتة. لا استنتاج MFA أو spend cap أو إنشاء runtime من إعداد الحساب. لم يُعدل الحساب أو budget بواسطة الوكيل ولم يُعَد إنشاؤهما.

## 3. لكل مهمة

RAD-056 باقية review/waiting_on reviewer؛ جرى تحديث وصف المتبقي ومصدر الدليل والملخص الخماسي وrevision والوقت، بلا completion_evidence أو إغلاق بوابة مستقلة. تعارض RAD-024 الموروث محفوظ. إنجاز إصلاح محلي غير مدموج لا يساوي اكتمال تجهيز العامل أو قبول حي.

## 4. المشترك وScale وحفظ الحكم

التغيير إضافة اختيارية في النقل الخاص وparser الحاوية؛ لا تأثير browser أو user RPC أو Practice. لا قائمة مناطق/مشاريع ثابتة أو hostname مخمن، وproject ref bounded1..63 دون قبول separators أو دوال SQL. هذا عقد مسار Supabase session5432 فقط؛ رفع حد المرجع أو دعم صيغة أخرى/transaction mode يحتاج تحقق مزود واختبارات مستقلة، لا تعميم صامت. pool1 للمهمة و1..4 للمكتبة، batch1 ومهلات60s/5s/10s والـlease كما هي، بلا loop أو queue جديدة.

لم تتغير أحكام S-ASSESS-15 أو الدور/ACL المثبتة أو قرار النسخة المؤجلة؛ بقيت روابطها الأصلية. تغيرت التوصية الجغرافية بعد معلومة DB من المالك وحالة العائق البرمجي من «غير متوافق» إلى «مدعوم محليًا، غير متحقق حيًا». حفظ التقرير السابق وحزمة الاختيار القديمة دليلًا مؤرخًا، وتحدث البيان الحالي دون تكرار حكم جديد في DECISIONS.

## 5. الطب والدرجات والخصوصية

لا طب/محتوى/مصادر/ترخيص/خلفية/معايير/Marker أو موافقة/درجات/صور/توقعات/hashes تغيرت. لا أسرار أو JWT أو claims أو بيانات مستخدمين وصلت للكود أو السجلات. بيانات الاختبارات اصطناعية فقط. O108 والعربية DRAFT والقبول الحي بوابات مستقلة.

## 6. QA والأدلة وحدودها

عند البداية كان checkout نظيفًا على `ce85887364e5eb0d3226b0a046e7b61ddca2fa54`. تحقق docs:context عبر GitHub أن [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) open/draft وغير مدموجة ورأسها مطابق؛ فحوص check/deploy على هذا الرأس completed/success. أحدث main المقروء `ff68413042e6e8414ad70884efcfa71cac7443a7` وفحوص الرأس نفسه completed/success. لا نقل نجاح CI لرأس التعديل الجديد أو runtime من Pages، ولا subscribe/poll أو إعادة workflow.

روجع [دليل اتصال Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres) و[Supavisor FAQ](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI) الرسميان: اسم custom role المركب، session5432 وtransaction6543، وفرق تخصيص الاتصال. لم تجر زيارة Console أو APIs/فوترة/شبكة Supabase من الوكيل أو اتصال TLS إلى مزود. التوصية بموقع قريب استدلال جغرافي لا قياس أداء.

التشغيل الأول للاختبارين تعذر قبل جمع الاختبارات لغياب pg وPGlite في node_modules الابتدائية. اكتمل npm ci من lock القائمة دون تعديل package/lock؛ لا تغيير توقعات أو timeout. كشف الاختبار الجديد أن RESET SESSION AUTHORIZATION في PGlite لا يعيد fixture إلى admin كما افترض؛ شاهد تشخيصي محلي أثبت ذلك، فاستُخدم SET SESSION AUTHORIZATION postgres صريحًا لإدارة fixture الاصطناعية فقط. كشف typecheck لاحقًا أن خطأ Promise في اختبار التنقيح الجديد unknown، فاستُعمل فحص الشكل القائم toMatchObject دون افتراض نوعه. لا تغيير للنقل أو ACL أو توقع قديم لإخفاء الفشل، ولا ادعاء مصادقة PostgreSQL فعلية من تغيير session authorization في VM.

الاختبارات الجديدة تتحقق من اسم pg المركب مع بقاء TLS/hostname وخيارات البدء، وعدم تغير login المتوقع عند تعديل object المصدر، ورفض reference/port/privileged user/fields البديلة. شاهد PGlite ينفذ SQL الفعلية تحت login محدود: نجاح RPC وعودة الدور بعد COMMIT، رفض الجداول والدور الإداري والـRPC المباشر، ورفض backend باسم آخر أو current_user ملوث أو INHERIT/عضوية زائدة/admin option، ورفض المعاملة التالية بعد سحب العضوية. فشل ACL/RPC/COMMIT في mock يبقى منقحًا وبلا replay ويهمل backend. اختبار parser/lifecycle يحفظ pool1 وغياب بيانات الإعداد من المخرجات.

نجح الاختباران المستهدفان32/32. نجح npm run check كاملًا: typecheck وlint و139 ملفًا/2277 اختبارًا، بما فيها حراس Practice/العزل/النشر/retention. نجح npm run build بإعداد محلي دون أسرار. نجحت docs:check مقابل origin/main بلا errors أو review warnings، وstatus:check مع require-previous وgit diff --check؛ تعارض RAD-024 الموروث بقي ظاهرًا. PGlite ليست Supavisor أو شبكة pg/TLS؛ لا إثبات CA/hostname حي أو startup options لدى المزود أو إغلاق pooler caches/sessions أو PID1 جديد. لا إعادة Docker/crash rehearsal أو SQL/الحسابين أو EN/AR/axe/هاتف؛ لا تغير UI أو SQL أو إشارات أو معاملة التسوية يبرر إعادتها. لا تعديلات expectations/characterisation/goldens أو guard/pins.

## 7. المفتوح

يلزم إذن منفصل لشاهد مزود آمن معزول: hostname من Connect لا تخمين، CA صحيحة/hostname ورفض الخاطئين، login محدود وهوية backend، startup options الحالية، SET LOCAL والدور بعد المعاملة، ACL وسحب الصلاحية وقتل frontends/backends والتحقق من عدم عودتها. الإصلاح لا يثبت أن pooler جاهز أو أن Google يصل إليه، ولا يضيق صلاحيات assess_worker الأوسع من tick-only.

تثبيت المسؤول/البديل ومراجعة effective IAM والإقامة/egress وتسعيرة europe-west3 والتنبيه المجرّب باقية. لا Job/SA/secret/image push/schedule أو نشر runtime أو تعديل Variables أو SQL كتابة على الأصلية. gate مغلقة وruntimeOrLaunchVerified=false. النسخة الشاملة مؤجلة بقرار المالك دون سؤال أو تنفيذ جديد؛ restore تحتاج حجر القراءات وإعادة آثار الإغلاق/التعطيل/الموافقة والحذف وACL. O108 وJWT والنسخ/restore/export والنشر والقبول الحي مستقلة.

## 8. قائمة المالك وبرومت الاستئناف

راجع الإصلاح المحلي والدليل وحدود شواهده؛ لا ترسل credential أو DSN للمحادثة. عند قرار الاختبار الخارجي حدد نطاقًا معزولًا وإذنًا مستقلًا قبل أي موارد أو SQL أصلية؛ لا إعادة خطوات الحساب/الميزانية الناجحة أو افتراض أنها إذن نشر.

ابدأ AGENTS وHANDOFF وRAD-056 ودليل runtime وحزمة الربط وهذا التقرير، ثم docs:context وGitHub لأحدث main و#96 وفحوص كل رأس. تابع checkout نفسه بلا worktree/subagents، واعرض ميزانية ومعايير قبول قبل التحرير. لا ready/merge/auto-merge أو فتح gate أو موارد/SQL أصلية/Variables من التسليم المحلي.
