# تقرير حزمة login المحدود — 2026-10-21 عمّان

## 1. السلطة والميزانية والانحرافات

قال المالك «تمام خلينا نبدأ بالعمل» بعد اقتراح تجهيز حزمة login محدود وفحوص الرفض والإلغاء للمراجعة قبل SQL الأصلية. الإذن إعداد/تجربة محلية، وليس تطبيقًا على الأصلية أو تجهيز Google. قُرئت AGENTS وHANDOFF وRAD-056 وحزمة الربط وruntime والـSQL/test patterns وتعليمات البيئة والشبكة؛ checkout نظيف قائم دون worktree/subagents.

الميزانية المعروضة قبل التحرير **11 ملفًا** وهي الفعلية: supabase/manual/assess-worker-login-provision.sql وassess-worker-login-revoke.sql؛ supabase/checks/assess-worker-login-ready.sql؛ scripts/assess/worker-login-rehearsal.mjs؛ src/features/assess/worker-login.test.ts؛ docs/ASSESS_WORKER_LOGIN.md وهذا التقرير وASSESS_RUNTIME_LOCAL.md وASSESS_EXTERNAL_BINDING_READINESS_2026-10-21.md وHANDOFF.md وproject-status.md. لا تعديل product/UI أو migrations أو helper مشترك أو package/lock أو guard/pins/Variables، ولا انحراف.

## 2. المنجز والمستبعد وشاهد TLS

أُعدت [حزمة login](ASSESS_WORKER_LOGIN.md) بملفات تجهيز NOLOGIN/password null وصلاحية منتهية، وفحص catalogue read-only، وإلغاء مثبت بـCOMMIT قبل قتل الجلسات. خيارا a/b محدودان ولا إعادة استعمال دور موجود أو إسقاطه. لا password أو SQL تفعيل تلقائي، ولا صلاحيات منقولة إلى العامل للإدارة/قتل الجلسات. يبقى سطح PUBLIC والأدوار المشتركة والمزود قبل credential activation بوابات واضحة.

### إفادة TLS من جهاز المالك

اختار المالك الملف prod-ca-2021.crt من تنزيل Supabase وأرفقه. فحص OpenSSL المحلي للملف أثبت Subject/Issuer Supabase Root 2021 CA وCA:TRUE وkey usage Certificate Sign/CRL Sign، وصلاحية2021-04-28 إلى2031-04-26 وتوقيعًا ذاتيًا صحيحًا. بصمة SHA256:

`807025AD50D4ED219D2C9C7D299C004F824EB00CF7F65AFEF607D07B72E6CAFA`

لا سر أو private key في الملف؛ لم نضفه إلى Git أو trust store. يُحفظ المحتوى الموثوق لاحقًا في config الخاصة عبر السر، ولا يستبدل بمسار ملف جهاز المالك.

المضيف الذي أعطاه المالك: aws-1-eu-central-1.pooler.supabase.com:5432، database=postgres، ومرجع vlacestfruxooznrcjqc. user الافتراضي postgres.projectRef ليس هوية العامل ولا اعتمدناه للتشغيل. أُجيز TLS فقط دون login/SQL. سياسة بيئة الوكيل كانت TCP domains/ip_ranges فارغة، فتوقف قبل اتصال خارجي ولم يتجاوز proxy أو يغير policy. لم نجد أداة لإتاحة TCP، وانتقل المالك إلى فحص مستقل على جهازه؛ كان التوجيه الأول لزر شبكة غير مثبت وصُحح دون ادعاء القدرة على جهاز Windows.

OpenSSL لم تكن متاحة على جهازه، فاستُخدمت PowerShell/.NET وPostgreSQL SSLRequest فقط، بلا StartupMessage أو username/password أو SQL. الفحص الافتراضي رفض RemoteCertificateChainErrors. diagnostic callback رفضت إكمال handshake دائمًا وأظهرت UntrustedRoot فقط، Subject=*.pooler.supabase.com وIssuer=Supabase Intermediate 2021 CA، وSAN=*.pooler.supabase.com و*.pooler.supabase.co، وانتهاء2030-03-11T15:56:33Z؛ لا NameMismatch ظاهر. ثم تحقق script من بصمة CA الملف exact، وقبل فقط chain ذات root bytes مطابقة له دون أخطاء غير UntrustedRoot، مع رفض خطأ الاسم والشهادة الغائبة وأخطاء السلسلة الأخرى. لم تثبت root في Windows، ولم تستخدم callback تقبل أي شهادة.

وصلت إفادة المالك حرفيًا: `PASS: TLS + hostname + exact uploaded CA root` و`Protocol: Tls12` و`No database login or SQL sent`. هذا **شاهد من جهاز المالك وفق script المرسل**، لا اتصال مستقل من الوكيل أو فحص Node/Cloud Run أو login/Supavisor startup options/ACL أو revocation. فحص certificate revocation لم ينفذ؛ root غير الموثوقة في Windows لم تُتجاهل عامًا بل حُددت الثقة في CA المطابقة لهذا الاتصال وحده. لا provider/runtime acceptance أو gate أو تنفيذ SQL من هذه الإفادة.

## 3. لكل مهمة

RAD-056 تبقى review/waiting_on reviewer دون completion_evidence؛ تحديث source والوصف والملخص الخماسي وrevision/الوقت ضمن الدفعة. شاهد TLS يحسم فقط بند CA/hostname من جهاز المالك، لا بوابات login والتشغيل/المزود/الجدولة. تعارض RAD-024 الموروث محفوظ ولا مهمة أخرى تغيرت.

## 4. المشترك وScale وحفظ الحكم

لا تغيير للنقل أو RPCs أو الدور المشترك assess_worker؛ يظل أوسع من tick-only بما فيه publication/recover. الملفات manual خارج migration/attestation، وتُرفض قبل settings الإقرار والوجهة والاسم المسموح. الإقرار ليس مصادقة للمشروع؛ login cluster-wide واسم postgres ليس معرف مشروع. لا shared PUBLIC revoke أو GRANT ALL أو schema/table/function/column grants جديدة.

الحد فتحتان a/b للدوران، pool limit2 ومدة تفعيل مقترحة≤90يومًا، وسقف8 backends لكل إلغاء مع timeout1s لكل قتل/15s للمرحلة. تجاوز السقف أو صلاحية القتل يتوقف بعد بقاء containment مثبتة. لا scan صفوف أو queue/loop إنتاجية أو polling جديد. تغيير الاسم/السقف/سياسة إعادة الاستخدام يحتاج مراجعة منفصلة، ولا يرفع تلقائيًا. لا hard cap للـCloud Run أو ثقة أن CONNECTION LIMIT2 تمنع كل تداخل/platform retries.

لم تتغير أحكام S-ASSESS-15 أو النسخة المؤجلة أو O108 أو المنح المثبتة؛ روابط دليلها محفوظة. تغير البيان الحالي بإضافة حزمة تجهيز مغلقة وشاهد TLS من المالك بحدوده، لا حكم إطلاق أو تفعيل. كانت توصية قتل sessions مقيدة بdatname في حزمة القرار؛ صُححت إلى usename الهدف عبر كل الـcluster لأن PUBLIC CONNECT قد يسمح بقواعد أخرى. الدليل الأصلي باقٍ في التقرير السابق، والحكم الأمني ضُيّق لإغلاق الجلسات الخاصة بالهوية المخصصة فقط دون بقية الهويات.

## 5. الطب والدرجات والخصوصية

لا Practice/درجات/توقعات/hashes أو طب/مصادر/ترخيص/خلفية/معايير/Marker أو موافقة/بيانات مستخدمين تغيرت. لا admin credential أو JWT أو secret manager أو PG credential أصلية جُلبت أو طُبعت. افتراض trust في PostgreSQL الاصطناعية لا يتحول إلى مصادقة أو TLS مزود. لا قبول نيابة عن أحد أو إعلان قبول حي.

## 6. QA وحدود الأدلة

docs:context/GitHub عند البداية: أحدث main `ff68413042e6e8414ad70884efcfa71cac7443a7` ورأس [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) `0e70cf59c5f0d3f53b6967cde24efa1f3cc4a594`، open/draft وغير مدموجة، وفحوص check/deploy لكل رأس completed/success مع head_sha مطابق. لا نقل CI لرأس لاحق، ولا subscribe/poll أو workflow معاد أو hosted preview. Pages ليست تشغيل عامل.

روجعت مصادر [CREATE ROLE](https://www.postgresql.org/docs/current/sql-createrole.html) و[إنهاء الجلسات](https://www.postgresql.org/docs/current/functions-admin.html) و[أدوار Supabase](https://supabase.com/docs/guides/database/postgres/roles) الرسمية. تُظهر version gate16+ وخصائص العضوية وهوية الدور cluster-wide والحاجة لصلاحية kill؛ superuser المحلية لا تثبت أن postgres المزود يملك كل امتيازها. استُخدمت مهارة cloud-environment-runtime لقراءة الشبكة والجاهزية، لا منح إعدادات أو اكتشاف أسرار.

نجحت PGlite ثم اختبارات Vitest الثلاثة الجديدة. شُغلت scripts الفعلية على PostgreSQL18.4 مؤقتة بغير root من حزم QA خارج repo في /tmp/radlab-login-postgres؛ Unix socket خاص وlisten_addresses=''، بلا Docker/TCP أو مزود، وcleanup=true. مخرجات أسماء checks فقط وprovider/runtime=false.

الشواهد: رفض missing ack/target injection/admin/wrong DB/بوابة مفتوحة/replay؛ exception بعد إنشاء الدور ترجع role/grants بالكامل؛ NOLOGIN/expired/passwordless staging ورفض infinite/expired active validity؛ كشف منح الجدول والعمود/extra role/INHERIT/admin؛ PUBLIC TEMP الافتراضية تظهر بدل سحبها. actual pg client محدود ينجح health على قاعدة جديدة وSET LOCAL role ثم يعود إلى login، ويرفض جدول assess وSET ROLE postgres. بعد COMMIT الإلغاء يفشل اتصال جديد، لكن جلسة قائمة سبق ضبط دورها تظل تعمل حتى termination. kill من operator بلا صلاحية تفشل دون إلغاء containment، ثم kill الصحيحة تغلقها وتثبت count0 وتبقي login آخر متصلًا؛ unmanaged role وpostgres يرفضان كهدف. لا كتابة Practice أو تغيير gate في نهاية fixture، ولا zero/results أو business lifecycle مدعى من QA login.

نجح npm run check كاملًا: typecheck وlint و140 ملفًا/2280 اختبارًا، بما فيها حراس Practice والعزل والنشر والاختبارات الجديدة. نجح lint المستهدف لأداة rehearsal واختبارها، وdocs:check مقابل origin/main بلا errors أو review warnings وstatus:check مع require-previous وgit diff --check. بقي تعارض RAD-024 الموروث ظاهرًا دون تغيير. لا إعادة crash/Docker/retention installer/أدوات الحسابين أو EN/AR390/1440/axe/هاتف، ولا app build لأن التطبيق ومكتباته لم تتغير. لا شهادة Windows revocation أو network password auth أو PID1+Supavisor أو kill cache/frontends أو نافذة60ثانية مزود فعلية. لا توسيع timeouts أو تعديل اختبار/expectation قديم أو schema guard لإخفاء فشل.

## 7. المفتوح

الحزمة للمراجعة، لا دور حي منشأ أو مفعّل. يلزم اعتماد سطح PUBLIC خارج assess والعضويات الفعلية ومنفذ إدارة يستطيع kill، وقناة secret/سجلات آمنة قبل password/LOGIN. فحص runtime الحالي يرفض login inactive؛ لا نعطي المالك أمر SQL للتنفيذ على الأصلية الآن. لا إعادة سؤال النسخة الشاملة المؤجلة أو تنفيذها.

TLS من جهاز المالك لا يثبت شبكة Google؛ startup options وbackend session_user وSET LOCAL/ACL وauth expiry والإلغاء بالمزود وقناة التنبيه والمسؤول/البديل تحتاج اختبارًا مأذونًا منفصلًا. لا تضييق للدور المشترك أو تفعيل Cloud Run Job/secret/SA أو schedule أو Variables/pins/attestation/gate. النسخ/restore/export وJWT وO108 والنشر والقبول الحي مستقلة، وruntimeOrLaunchVerified=false.

## 8. قائمة المالك وبرومت الاستئناف

راجع حزمة login والتجهيز المغلق/facts/الإلغاء وشواهدها. التالي قرار نطاق التطبيق/اختبار المزود وقناة السر وسطح PUBLIC بعد مراجعة النتيجة، لا إذن مستنتج من شاهد TLS. لا ترسل كلمة مرور أو SCRAM verifier أو ملف إعداد فعلي للمحادثة. لا تعاد خطوات الحساب/الميزانية/TLS الناجحة دون تغير مؤثر.

ابدأ AGENTS وHANDOFF وRAD-056 وحزمة login وهذا التقرير وruntime وحزمة الربط، ثم docs:context/GitHub لأحدث main و#96 وفحوص كل رأس. تابع checkout نفسه بلا worktree/subagents، واعرض ميزانية ومعايير قبول قبل التحرير؛ لا SQL أصلية/موارد/Variables/gate أو ready/merge/auto-merge من التسليم المحلي.
