# تقرير تسليم مرحلة NOLOGIN على الأصلية — 2026-10-21 عمّان

## 1. السلطة والميزانية والانحرافات

أرسل المالك نتيجة قراءة فقط: database_name=postgres وpostgres_version=17.11 وpublic_can_create_temp=true وschemas_with_public_create=0. سبقها فشل صياغة بسبب backtick قبل begin؛ لم تنفذ القراءة في المحاولة الفاشلة. لا نعيد الشاهد الناجح ولا نسحب PUBLIC TEMP بسببها.

بعد عرض خطوة إنشاء assess_job_a بحالة NOLOGIN بلا كلمة مرور وفحصه على الأصلية، قال المالك **«تمام طبق»**. هذا إذن صريح لهذه المرحلة فقط، يرفع منع SQL الكتابة السابق عن هذا الدور المعطل وحده، ولا يجيز LOGIN/password أو عامل/Google/تغيير PUBLIC/بوابة أو حذف/تطبيق migrations. لا إعادة سؤال النسخة المؤجلة أو إذن المرحلة نفسه.

عُرضت ميزانية **ثمانية ملفات** وهي الفعلية: supabase/checks/assess-worker-login-ready.sql؛ scripts/assess/worker-login-rehearsal.mjs؛ src/features/assess/worker-login.test.ts؛ supabase/manual/assess-original-worker-login-stage.sql؛ docs/ASSESS_WORKER_LOGIN.md وهذا التقرير وHANDOFF.md وproject-status.md. لا worktree/subagents أو كود تطبيق/نقل/مصحح أو migrations أو package/lock أو guard/pins/Variables تغيرت، ولا انحراف.

## 2. المنجز والمستبعد

أُعدت [دفعة التطبيق المحددة](../supabase/manual/assess-original-worker-login-stage.sql) للمشروع vlacestfruxooznrcjqc وقاعدة postgres والدور assess_job_a فقط. تضع settings داخل المعاملة نفسها وتضم provision المراجعة دون تغيير منطقها، ثم query catalogue الفعلية كشرط **قبل COMMIT**؛ عند فشلها يرجع إنشاء الدور ومنحه كاملًا. بعدها transaction read-only مستقلة تعيد صف الحالة. اسم القاعدة/settings ليست مصادقة هوية المشروع؛ يراجع المالك selector قبل التنفيذ الكامل مرة واحدة.

لا اعتماد قاعدة أو أداة اتصال مزود متاحة في الجلسة، ولا credential/secret/outbound identity مرتبطة. بقيت TCP grants فارغة ولا توجد أداة Supabase/SQL موصولة. لذلك **لم ينفذ الوكيل SQL الأصلية**؛ التسليم للمالك كمنفذ SQL Editor تحت إذنه الصريح، ولا ندعي دورًا منشأ قبل صف المالك. لم يُطلب password أو admin key ولم يُرسل LOGIN/worker RPC إلى الأصلية.

## 3. لكل مهمة

RAD-056 تبقى review وتنتظر owner لإرجاع صف مرحلة staging، دون completion_evidence أو إغلاق بوابات التفعيل/المزود. يحدث الوصف والمصدر والملخص الخماسي وrevision/time ضمن الدفعة. تعارض RAD-024 الموروث محفوظ؛ لا مهمة أخرى تغيرت.

## 4. فرق PostgreSQL16+ وScale وحفظ الحكم

أثبت rehearsal جديدة أن منشئًا **غير superuser** يملك CREATEROLE وصلاحيات bootstrap اللازمة يحصل تلقائيًا على ADMIN-only membership في الدور الجديد (INHERIT=false وSET=false). فحص catalogue السابق كان يرفض أي member للدور؛ هذا يرفض staging سليمة على مزود لا يعطي postgres superuser. صُحح ليقبل هذه العضوية **للمشغّل الحالي فقط** مع ADMIN=true وSET/INHERIT=false، ويرفض أي عضو آخر أو مسار افتراض للدور؛ عضويات العامل نفسه وأعلامه ومنح assess_worker لم تتغير. عند تشغيل الفحص بهوية إدارية مختلفة عن المنشئ يُعرض الاختلاف ولا يُقبل تلقائيًا.

الاختبار الأول لمشغّل اصطناعي بلا BYPASSRLS توقف لأن صف launch_gate محمي بـRLS، ولم يُخفف precondition. أُعطيت هوية **إدارة fixture فقط** BYPASSRLS وUSAGE/SELECT للحارس وADMIN على assess_worker وCONNECT grant option لمحاكاة bootstrap، دون إعطائها للعامل. نجاح هذه الهوية محليًا لا يثبت امتياز postgres الفعلي على Supabase؛ خطأ مزود يوقف الإجراء ولا يبرر منح العامل إدارة.

لا تغيير لحكم NOLOGIN/PASSWORD NULL وانتهاء الصلاحية أو LIMIT2 أو اسمَي الدوران أو ceilings/timeout للإلغاء، ولا scan/queue جديدة. الحماية لا تنفذ إلغاءًا أو تفعيلًا تلقائيًا؛ PUBLIC TEMP تظل منحة فعلية معلنة تحتاج قرارًا قبل LOGIN. تغير إذن الكتابة ضيقًا بفعل المالك، وصُحح تفسير عضوية المنشئ؛ روابط الحزمة والدليل الأصلي محفوظة. لا تغيير S-ASSESS-15 أو النسخة المؤجلة أو O108 أو schema attestation.

## 5. الطب والدرجات والخصوصية

لا Practice أو درجات/صور/توقعات/hashes أو طب/مصادر/ترخيص/Marker أو موافقة/بيانات مستخدمين تغيرت. محتوى الدفعة بلا password أو SCRAM verifier أو بيانات خاصة؛ المخرجات booleans/counts فقط. لا قبول حي أو عمل نيابة عن هوية مستخدم.

## 6. QA وحدود الأدلة

عند البداية checkout نظيف على `056c69d1cf231da5c1e9efd1d96d002aa2cddfb5`. docs:context/GitHub يثبتان [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) open/draft وغير مدموجة ورأسها مطابق، وmain `ff68413042e6e8414ad70884efcfa71cac7443a7`؛ فحوص check/deploy لكل رأس completed/success. لا نقل CI لرأس التسليم التالي ولا subscribe/poll أو preview أو workflow معاد.

نجح PGlite ثم PostgreSQL18.4 المحلية عبر Unix socket خاص بغير root وlisten_addresses='' وcleanup=true. rehearsal تنفذ ملف التسليم الفعلي، وتحقن grant جدول قبل حارس catalogue لإثبات rollback للدور قبل COMMIT، وتثبت النجاح العادي. كما تختبر منشئًا غير superuser ورفض SET/INHERIT على عضويته الإدارية، مع بقاء شواهد حدود الدور/الإلغاء/قتل الجلسات السابقة. هذا ليس تطبيقًا على PostgreSQL17.11 الأصلية أو Supavisor أو اعتمادًا لامتيازات المزود.

نجحت اختبارات Vitest المستهدفة الأربعة ومنها byte-identity بين دفعة التسليم وprovision/query المراجعتين، وlint المتغير. نجح npm run check كاملًا: typecheck وlint و140 ملفًا/2281 اختبارًا، وdocs:check مقابل origin/main بلا errors أو review warnings، وstatus:check مع require-previous وgit diff --check. بقي تعارض RAD-024 الموروث ظاهرًا دون تغيير. لا app build أو Docker/retention installer/حسابين/هاتف/EN/AR/axe معادة؛ التطبيق لم يتغير. لا expectations قديمة أو timeout/guard/hashes تغيرت لإخفاء فشل.

## 7. المتبقي

المتبقي الآن تنفيذ المالك **الدفعة كاملة مرة واحدة** ثم صف catalogue. المتوقع: target_present/staged_catalogue_valid/launch_gate_closed=true، وactive_catalogue_valid/direct_assess_table_access=false، وbackend_sessions=0، وcredential/pooler/runtime=false. public_surface_review_required=true متوقع من TEMP، ولا يمنع مرحلة NOLOGIN المأذونة أو يُقدّم كحل لصلاحية PUBLIC. لا إعلان نجاح قبل الرد، ولا replay عند خطأ أو target موجود.

قبل أي LOGIN: مراجعة PUBLIC خارج assess وقناة secret/logs وصلاحيات التشغيل/الإلغاء ومدة credential، ثم إذن مستقل. الشبكة Google/Node وstartup options وهوية backend وACL والإلغاء/cache/frontends والتنبيه والمسؤول/البديل غير مثبتة. TLS من جهاز المالك ونسخة الحزمة السابقة محفوظان بحدودهما؛ gate مغلقة والنسخ/restore/export/JWT/O108 والنشر مستقلة.

## 8. تسليم المالك وبرومت الاستئناف

افتح SQL Editor للمشروع الأصلي الصحيح، استبدل محتوى المحرر بملف الدفعة **كاملًا** دون Markdown/backticks، شغله مرة واحدة، وأرسل الصف النهائي فقط أو code/message منقحين عند الخطأ؛ لا تعِد التطبيق قبل التشخيص. لا إنشاء password أو LOGIN أو موارد Google أو تعديل PUBLIC من ذلك. لا طلب إذن جديد للمرحلة التي أذن بها المالك.

ابدأ AGENTS وHANDOFF وRAD-056 وحزمة login وهذا التقرير، ثم docs:context/GitHub للرؤوس وفحوصها. تابع checkout نفسه بلا worktree/subagents؛ ميزانية ومعايير قبول قبل أي تعديل، ولا توسيع إذن NOLOGIN إلى تفعيل أو تشغيل أو ready/merge/auto-merge أو Variables/gate.
