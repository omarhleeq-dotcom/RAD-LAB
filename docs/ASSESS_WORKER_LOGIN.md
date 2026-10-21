# حزمة login عامل Assess — للمراجعة المحلية

حزمة منفصلة عن schema migrations؛ أذن المالك لاحقًا بمرحلة إنشاء NOLOGIN محددة على الأصلية وفق القسم التالي، دون تجهيز عامل حي. تحافظ على [حزمة الربط](ASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md) و[عقد runtime](ASSESS_RUNTIME_LOCAL.md)، ودور assess_worker القائم دون توسيع أو تضييق منح مشتركة. [تقرير الدفعة](ASSESS_WORKER_LOGIN_REPORT_2026-10-21.md) يفصل نتيجة TLS من جهاز المالك عن التجارب المحلية والربط الحي غير المثبت.

## الملفات والمراحل

| المرحلة | الملف/الإجراء | النتيجة وحدودها |
|---|---|---|
| تجهيز مغلق | [provision](../supabase/manual/assess-worker-login-provision.sql) | إنشاء assess_job_a أو assess_job_b جديد فقط، NOLOGIN وPASSWORD NULL وصلاحية منتهية وconnection limit2؛ عضوية assess_worker فقط مع ADMIN FALSE/INHERIT FALSE/SET TRUE، وCONNECT للقاعدة المختارة. لا كلمة مرور أو تفعيل |
| فحص catalogue | [readiness](../supabase/checks/assess-worker-login-ready.sql) | معاملة READ ONLY تنتهي ROLLBACK؛ أعلام وأعداد فقط، بلا auth/public rows أو worker RPC. staged وactive منفصلان، وcredential/pooler/runtime=false دائمًا |
| تفعيل | خطوة مستقبلية مستقلة بعد حسم PUBLIC والسر والصلاحية | لا كلمة مرور نموذجية أو SQL تفعيل تلقائي في الحزمة؛ دور NOLOGIN ليس login صالحًا لتشغيل الحاوية |
| إلغاء | [revoke](../supabase/manual/assess-worker-login-revoke.sql) | NOLOGIN وPASSWORD NULL وصلاحية منتهية وإلغاء العضوية وCONNECT ثم COMMIT، وبعده قتل backends الخاصة بالدور وفحص منفصل؛ لا DROP أو حذف بيانات |
| rehearsal | [أداة اصطناعية](../scripts/assess/worker-login-rehearsal.mjs) | تنشئ قاعدة جديدة فقط وتُتلفها، بلا URL/DSN أو أصلية؛ PostgreSQL تختبر الجلسات، وPGlite تختبر catalogue فقط |

## مرحلة الأصلية المأذونة الآن

بعد قراءة المالك PostgreSQL17.11 وPUBLIC TEMP=true وPUBLIC schema CREATE count0، أذن «تمام طبق» بإنشاء assess_job_a معطّلًا دون password وفحصه فقط. [ملف التطبيق الكامل](../supabase/manual/assess-original-worker-login-stage.sql) يحدد settings داخل transaction نفسها، ويعيد استعمال provision وcatalogue المراجعتين، مع فحص staged/gate/no-direct-tables/no-sessions قبل COMMIT ثم صف مستقل بعده. [تقرير المتابعة](ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md) يحفظ الإذن وحدود الدليل؛ وصل [صف المالك النهائي](ASSESS_WORKER_LOGIN_STAGE_REPORT_2026-10-21.md#worker-login-stage-owner-result): staged=true وactive=false وdirect table=false وsessions0 وgate مغلقة؛ credential/pooler/runtime=false وPUBLIC review=true. لا وصول مباشر من الوكيل.

نفّذ المالك مرحلة التجهيز وأرسل الصف المتوقع؛ لا إعادة ملف الإنشاء أو طلب تنفيذ جديد. يبقى الملف مرجعًا للدفعة المأذونة فقط، وليس إجراء replay. نجاح NOLOGIN لا يرفع شرط PUBLIC/قناة السر قبل LOGIN أو يفتح gate. لا إعادة سؤال إذن هذه المرحلة أو النسخة المؤجلة.

## اختيار الهدف والحواجز

المشغّل الإداري المأذون يختار المشروع من Console/قناة الإدارة ويتحقق من الهوية الحقيقية للوجهة. setting تطابق اسم القاعدة ليست إثبات هوية مشروع Supabase: يمكن لقواعد مختلفة أن تسمى postgres. لا تضع administrator credential في worker config أو المحادثة. الأسماء ثابتة بفتحتين للدوران a/b، وليست registry عامة للهويات.

تُختار settings التالية على **الجلسة الإدارية نفسها** قبل تشغيل الملف كله. لا تعتمد على بقاء session settings بين SQL Editor tabs أو اتصالات pooler، ولا تشغل مقتطفًا منفصلًا من ملف الكتابة. التالي وصف للمتطلبات، لا أمر تطبيق الآن:

- assess.worker_login_target يساوي assess_job_a أو assess_job_b فقط.
- assess.worker_login_database يساوي current_database() الفعلية التي راجعها المشغّل.
- assess.worker_login_action يساوي provision-reviewed للتجهيز أو revoke-reviewed للإلغاء؛ هو ack تشغيلي لا بديل للصلاحيات.

provision يرفض عدم الإقرار/اسمًا آخر/قاعدة مختلفة/إصدار PostgreSQL أقل من16/دورًا موجودًا أو بوابة مفتوحة أو baseline دور العامل والدوال الغائبة. لا IF NOT EXISTS أو إعادة تأهيل حساب قديم بصمت. marker على الدور باسم radlab-assess-login/1 واسم القاعدة يساعد على رفض إلغاء دور غير مُدار؛ ليس سرًا أو إثبات origin. يعمل operator واحد ضمن نافذة التغيير؛ advisory lock داخل القاعدة لا يحمي من كل DBA أو تعديل خارج الحزمة/قاعدة أخرى.

منفذ الإدارة يحتاج CREATEROLE والقدرة على منح assess_worker وCONNECT والتعليق على الدور؛ قد يتطلب PostgreSQL16+ ADMIN OPTION على الدور المشترك وحقوق إدارة الهدف. قتل الجلسات يحتاج صلاحية منفصلة على backends الهدف. لا تمنح CREATEROLE أو pg_signal_backend أو دور إدارة للعامل كي تمر الأداة. دعم هذه العمليات على Supabase الفعلي غير مثبت بالـsuperuser المحلي.

## قبول الصلاحيات قبل التفعيل

لا يكفي staged_catalogue_valid وحده: يلزم launch_gate_closed=true وdirect_assess_table_access=false ومراجعة public_surface_review_required. الفحص يكشف صلاحيات الجداول والأعمدة المباشرة، الملكية، الأعلام الإدارية/INHERIT، خيارات العضوية وعضويات أخرى أو أعضاء غير متوقعة في الهدف. تُقبل عضوية ADMIN-only لمنشئ غير superuser عندما يكون هو المشغّل الحالي فقط، بشرط SET=false وINHERIT=false؛ أي عضو آخر أو إمكان افتراض للدور يفشل الفحص. لا يمسح كل دوال/extensions/foreign access في المزود؛ مراجعة surface خارج assess وPUBLIC والعضويات العابرة والـdefault privileges مطلوبة مستقلة.

PUBLIC TEMP افتراضية في PostgreSQL المحلية وظهرت في الشاهد، وقد يوجد PUBLIC CREATE في مخططات المزود. NOINHERIT لا يلغي PUBLIC وREVOKE عن login وحده لا ينفي منحة PUBLIC. لذلك لا سحب جماعي لـTEMP/CREATE/CONNECT أو تعديلات Practice من الحزمة. يبقى التفعيل محجوبًا إلى أن يُراجع privilege surface الحقيقي ويُعتمد علاج منفصل أو استثناء محدد بحدوده؛ لا ادعاء tick-only: assess_worker تتيح publication/recover أيضًا بحسب العقد الحالي.

أدوار PostgreSQL cluster-wide؛ CONNECT للقاعدة المعنية لا يمنع CONNECT عبر PUBLIC إلى قواعد أخرى. readiness تعرض إعداد القاعدة الحالية ولا تثبت عزل كل قاعدة/endpoint. يجب جرد قواعد المزود المسموح بها والمنح قبل ادعاء قاعدة واحدة فقط؛ لا إنشاء/إزالة قواعد لذلك. يعالج الفحص عضوية المنشئ الإدارية المحدودة كما سبق؛ التشغيل بهوية مختلفة أو خيارات إضافية يبقي الاختلاف ظاهرًا، دون إسقاط حماية SET/INHERIT أو عضويات العامل نفسه.

## السر والتفعيل والدوران — غير منفذ

[قرار TEMP وقناة السر المقترح](ASSESS_WORKER_ACTIVATION_DECISION_2026-10-21.md) يحدد استثناء تجربة ≤7أيام مشروطًا بجرد السطح، ومسار psql بالمطالبة المخفية ثم إدخال Secret Manager عبر stdin بأداة مستقبلية مراجعة؛ لم يُقبل الاستثناء أو تُجهز القناة. الحد العام ≤90يومًا أدناه لا يجيز تجاوز نافذة التجربة المقترحة.

بعد اعتماد سطح الصلاحية، يُولّد password عشوائي فريد بطول≥32 محرفًا في قناة إدارة سر آمنة. لا يُلصق في SQL Editor/history أو shell args/ENV أو Git أو المحادثة، ولا يستخدم service/admin key أو كلمة postgres. الإدخال عبر أداة آمنة مثل psql مع password prompt قابل للمراجعة لاحقًا؛ حتى SCRAM verifier مادة اعتماد يجب منع تسجيلها. لم تُجهز قناة السر/إخفاء سجلات المزود، لذلك لا أمر تفعيل أو طلب كلمة مرور الآن.

يتحقق المشغّل من بقاء شروط staging، يضبط password خارج المستودع وVALID UNTIL بحد90يومًا وفق UTC، ثم LOGIN في نافذة تغيير مستقلة ويفحص active_catalogue_valid. PASSWORD expiry تحكم مصادقة password فقط، لا الجلسة القائمة أو trust/طرق مزود أخرى. اختبار credential/TLS واسم session_user والدور والرفض مستقل عن catalogue. لا كلمة مرور بسيطة/fixture صالحة للإنتاج أو تفعيل لاختبار حي من هذا التسليم.

الاسم المقترح للحزمة عند ذلك: user=assess_job_a وsessionPoolerProjectRef=vlacestfruxooznrcjqc وhost=aws-1-eu-central-1.pooler.supabase.com وport5432 وdatabase=postgres؛ الاسم المركب assess_job_a.vlacestfruxooznrcjqc يركبه النقل فقط. CA العامة المراجعة من المالك، وpassword الخاصة الجديدة، تدخلان عبر Secret Manager بإصدار رقمي ثابت وفق حزمة IAM. لا config فعلية أو secret file أُنشئ.

للدوران يُجهّز الطرف b مغلقًا ويفحص، ثم يُفعّل بسر جديد في نطاق مستقل، ويُختبر قبل تحويل Job. بعدها يُلغى a ويُقتل القائم ويُعطّل الإصدار القديم. role موجودة ترفضها provision حتى لو أُلغيت؛ لا حذفها لإعادة استعمال الاسم تلقائيًا. إضافة slot أو سياسة إعادة استعمال تحتاج مراجعة ملكية/dependencies/منح ومفاتيح cache، ولا تُرفع الحواجز لإعادة التشغيل.

## الإلغاء الفعلي وإثباته

1. امنع runs جديدة وألغ executions والحساب/secret accessor بحسب الحادث. أوقف pooler frontends الخاصة بالـlogin بآلية المزود المراجعة؛ Google IAM وحدها لا توقف DB session أو credential محمّلة.
2. نفّذ ملف revoke كاملًا بإذن مستقل. مرحلة NOLOGIN/expiry/password null/revoke تُثبّت قبل مرحلة termination؛ عند فشل الثانية لا تتراجع الأولى؛ وعمليات قتل تمت فعلًا لا يعيدها ROLLBACK لاحق، فقد تنجح المرحلة جزئيًا. لا إعادة تمكين تلقائيًا أو ادعاء نجاح من COMMIT الأول.
3. القتل يختار **usename للدور المحدد عبر كل قواعد الـcluster**، ويستثني جلسة الإدارة؛ current_user قد يكون assess_worker وapplication_name قابلة للتزوير. لا query text أو rows أو PID inventory في الناتج. السقف8 backends وtimeout1s لكل قتل، ومهلة مرحلة15s؛ تجاوزها يبقي الحجر ويحتاج مشغّلًا، لا scan/kill غير محدود.
4. تحقق login_disabled وworker_membership_absent وbackend_sessions_absent جميعًا، ثم شاهد رفض اتصال جديد وفشل الجلسة التي كانت قائمة، وبقاء غير المعني متصلًا. كرر فحص الأعداد من snapshot جديدة بعد نافذة مراقبة60ثانية، لا success من لقطة لحظية أو انتظار داخل معاملة. لا فحص60ثانية منفذ على المزود هنا.
5. Supavisor قد تبقي client/auth cache أو backend مشتركة؛ SQL لا تغلق cache أو frontends ولا تثبت عدم عودتها. حقل pooler_frontends_and_cache_verified يبقى false في الملف. لا إعادة تشغيل شاملة لحسابات الآخرين؛ عجز المزوّد عن إغلاق الهدف المحدد عائق قبول يحتاج معالجة مستقلة.
6. القتل أثناء COMMIT يترك عدم يقين النتيجة. SQL مصدر الحقيقة والـlease/retry_at حاكمتان؛ لا إعادة finish أو علامة صفر، ولا recover/maintenance أو فتح gate تلقائيًا. revoke لا تمحو بيانات أو role أو أثر تدقيق، ولا تدعي إزالة كل منح drift أو عكس معاملات مثبتة.

## تشغيل الشواهد المحلية فقط

```sh
node scripts/assess/worker-login-rehearsal.mjs --synthetic-disposable --backend=pglite
npm install --prefix /tmp/radlab-login-postgres embedded-postgres@18.4.0-beta.17 pg@8.23.1
ASSESS_POSTGRES_MANIFEST=/tmp/radlab-login-postgres/package.json node scripts/assess/worker-login-rehearsal.mjs --synthetic-disposable --backend=postgres
```

PostgreSQL18 المحلية تعمل بغير root عبر Unix socket0700 مع listen_addresses=''، دون TCP أو TLS أو Docker أو بيانات حقيقية. تستخدم local-database القائمة وترحيلات repo على قاعدة جديدة فقط. كلمة fixture للاختبار وحدها؛ Unix trust لا يثبت مصادقة password أو صلاحيتها على المزود. لا تعديل helper أو ترحيل أو schema attestation. الخرج assess-worker-login-rehearsal/1 بأسماء checks وcleanup وأعلام provider/runtime=false فقط؛ raw errors/config/credentials غير مطبوعة.

لا إعادة SQL/الحسابين أو النسخة المؤجلة أو تنبيه الميزانية؛ مرحلة NOLOGIN المحددة وحدها مأذونة على الأصلية، ولا worker run/Job/secret/IAM أو Variables/gate أو ready/merge/auto-merge من هذه الحزمة.
