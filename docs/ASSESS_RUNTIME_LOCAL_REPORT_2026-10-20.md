# تقرير ربط Assess runtime المحلي — 2026-10-20

## 1. السلطة والانحرافات والميزانية

أذن المالك بالقراءة والمراجعة والبرمجة والفحوص والحفظ والرفع إلى #96 فقط، دون تشغيل/نشر حي أو SQL كتابة على الأصلية أو إعداد إنتاج أو تغيير PR state. قُرئت AGENTS وdocs:context وRAD-056 والتسليم والحالة والقرارات والسياسة والتقارير ودليل العمليات والأقسام ذات الصلة من staging/setup/deployment/engine. checkout القائم كان نظيفًا على main؛ جُلب رأس المسودة وتُوبع في المجلد نفسه بفرع assess-local-operations، دون worktree/subagents. تعذر أول أمر gh لاستخدام حقل غير مدعوم، وتعذر ضبط tracking بسبب refspec النسخة؛ صُححت القراءة واستخدم المرجع المجلوب داخل checkout نفسه دون فقد عمل.

عُرض الهدف وحدوده واختيار Node24 وميزانية **11 ملفًا** ومعايير القبول وScale قبل التحرير. الفعلية: package.json وpackage-lock.json؛ scripts/assess/build-runtime.mjs؛ src/features/assess/server-runtime.ts وserver-runtime.test.ts؛ scripts/pages/frontend-schema.json؛ docs/ASSESS_RUNTIME_LOCAL.md وهذا التقرير وASSESS_LOCAL_OPERATIONS.md وHANDOFF.md وproject-status.md. لا انحراف. لا تعديل workflow أو SQL أو adapter متصفح أو pin/إثبات. إضافات pg و@types/pg وesbuild مثبتة في lock؛ لا إصدار اعتماد سابق تغير.

## 2. المنجز والمستبعد وGitHub

اختير Node24 لحزمة الخادم المحلية، توافقًا مع المقترح القائم وBuffer/المصحح وbigint والـregistries، دون اختيار خدمة مدفوعة أو إنشاء مورد أو مزود. لا حاجة لمحوّل مستخدم جديد: المتصفح الحالي يستخدم Supabase Auth/Data API وRPC بهوية JWT يفحصها المزود، مع auth.uid وتفويض SQL. لا ثقة بهوية body أو فك claims بلا تحقق أو service/admin key نيابة عن المستخدم. اختيار الاستضافة والسر والمراقبة وربط المزود قرارات لاحقة مستقلة.

أضيف محوّل خاص لتسع RPCs العامل، بوجهة وCA وlogin صريحة وTLS متحقق، وNOINHERIT وعضوية assess_worker وحدها بلا admin option بعد رفض صلاحيات login الإدارية. المعاملات منفصلة، وSET LOCAL ROLE وsearch_path/مهل ثابتة، وقيم parameterized؛ لا أسماء/SQL حرة أو استدعاء user/gate. json≤2MB واتصالات1..4 بلا queue تطبيقية غير محدودة. فحص login دفاع إضافي، لا شهادة ACL شاملة أو تحقق TLS حي.

تعاد الخدمات القائمة دون تعديلها: runAssessJobs وmaintain_v1 والمصحح وinstallMixedContent وpublicationService وlease/recovery والحذف الذري. لا job/purge/timer/HTTP جديد. close يمنع اتصالات جديدة وينتظر الأعمال/الاتصالات الجارية ثم pool.end مرة واحدة؛ المضيف المستقبلي يجب أن يرسل signal ويستقبل تسوية tick قبل close. فقد ack بعد COMMIT لا يؤدي replay أو استنتاج rollback أو تثبيت ثانٍ/صفر. retry_at ونوافذ C كما هي. حارسا الإغلاق/التعطيل في بدء SQL فقط؛ لا تعطيل تسوية مستحقة أو قبول v2 نيابة عن أحد.

بناء esbuild مكتبة CJS مؤقتة مستقلة عن node-loader، يضم سائق pg JavaScript والمصحح ولا React/Next/Zustand، والاستيراد خامل بلا اتصال أو credential. لا executable عامل أو scheduler أو deployment artifact منشور أو نسخ إنتاجية/تصدير عام. أُضيفت الوحدة إلى قائمة منع وصول المتصفح دون تغيير متطلبات SQL أو browser pins أو marker.

تحقق GitHub المباشر قبل التحرير، دون قراءة قيم Variables أو أسرار أو فتح روابط المعاينة:

| الرأس | الحالة والفحوص المرتبطة به |
|---|---|
| #96: `9263a09300b611cc31ee462fbdb4983f17f0d9a1` | open/draft وغير مدموجة؛ [CI39500288609](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39500288609) completed/success attempt1؛ [Deploy39500288132](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39500288132) completed/success attempt4. head_sha في API مطابق؛ Require verified pilot schema والبناء والرفع إلى Pages نجحت. |
| main: `ff68413042e6e8414ad70884efcfa71cac7443a7` | أحدث main عند القراءة؛ [CI39464823281](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39464823281) و[Deploy39464823264](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39464823264) completed/success وhead_sha مطابق. |

إفادة المالك أنه أصلح البادئة المكررة ونجحت الاختبارات مدعومة بنجاح حارس/بناء/رفع الرأس المحدد؛ لا قراءة مستقلة لقيمة Variable ولا شهادة هاتف أو قبول حي. لم يغير الوكيل PILOT_SCHEMA_VERIFIED ولم يُعد workflow/نشرًا أو SQL/أدوات الحسابين. النتائج السابقة لا تنتقل إلى رأس تسليم هذه الدفعة.

## 3. RAD-056

تبقى review/waiting_on reviewer دون completion_evidence. حُدث الوصف والمصدر والملخص الخماسي وHANDOFF لربط الحزمة المحلية ونجاح Pages السابق، بدل انتظار Variable عالجه المالك بالفعل. لم تُغلق مهمة أخرى أو O106/O108 أو بوابة تشغيل؛ revision والوقت مرفوعان، وأدلة RAD-058 وتعارض RAD-024 الموروث محفوظة.

## 4. المشترك وScale والقرارات

الوحدة الجديدة تستهلك AssessRpc والخدمات؛ server-service وSQL والمحرك/التقييم/Practice لم تتغير. إعداد منفذ النقل محدود بإصدار RPCs قائم؛ توسيعه يحتاج مراجعة، لا أسماء ديناميكية حرة. السقف1..4 اتصالات وbatch1..100 لكل مرحلة، لا حد إجمالي100 لكل tick أو وعد QPS/ذاكرة الرد/سعة مزود. JSON≤2MB حد نقل محلي، ووقت اتصال10s وstatement60s/lock5s لا تثبت deadline شبكة عند فقدها؛ إيقاف المضيف القسري يترك عدم يقين للـlease والاسترداد. قياس السعة والتداخل ومهلة إيقاف المنصة وحدود التنبيه ومسؤول المراقبة لم تُخترع.

الدليل يحدد بوابات ACL/TLS وإدارة السر وإلغائه: لا صلاحية جداول/ملكية/admin أو secret في المتصفح، ومراجعة PUBLIC والوراثة وsecurity definer وRLS. إيقاف login وحده لا يلغي اتصالًا قائمًا؛ يلزم قطع الوصول وإغلاق الجلسات وسحب العضوية/تدوير السر وفق إجراء مراجع. لا provisioning أو اختبار إلغاء حي منفذ. لا ruling تغير أو اختصار لقرار؛ روابط أصل S-ASSESS-15 وتأجيل النسخة باقية.

## 5. الطب والدرجات والخصوصية

لا محتوى طبي أو صور أو مصادر أو ترخيص أو معايير/Marker أو درجة/إعداد Practice أو توقعات/hashes متغيرة. العربية DRAFT والمراجعة الطبية/العلمية وO108 مستقلة. لا consent أو حساب/نتيجة حقيقية مستخدمة أو مسجلة. v1 لا تنوب عن v2، ولا قبول بالنيابة.

لا events/logs جديدة؛ الأخطاء محدودة بلا raw message/detail/cause أو claims/أجوبة/إعدادات/علامات/هويات/أسرار. بيانات الدور والاختبار اصطناعية ولا تُطبع. logs DB/host/proxy الحية وإخفاء statements/parameters ليست متحققة من غياب console محلي. pool idle error يوقف calls التالية بأمان، دون طباعة الخطأ أو retry.

## 6. QA وحدود الدليل

اختبارات الربط الجديدة **12 حالة ناجحة**: config/TLS المصرح بها وعدم فتح pool عند الرفض؛ حصر RPC والمعاملات؛ parameterization وCOMMIT قبل الرد؛ أعطال connect/ACL/RPC/COMMIT/rollback وتنقيحها وعدم replay؛ حد التوازي وإغلاق متكرر ينتظر الجاري؛ idle pool error؛ SQL فعلي من النقل على PGlite جديدة مع سلسلة الترحيل الحالية وlogin محدود وتنفيذ runAssessJobs/maintain/health ورفض قراءة sessions وبقاء الدور خارج المعاملة؛ بناء المكتبة واستيرادها في عملية Node دون loader أو credential.

**فصل الأدلة:** pg Pool/network محاكى؛ SQL والقواعد والأدوار في اختبار PGlite حقيقية محليًا لكن متسلسلة. auth.uid اصطناعي لا JWT، ولا شهادة TLS أو ACL مزود/pg pooler أو اختبار إلغاء حي. اختبارات lease/finish/retry_at والإغلاق/التعطيل/v1-v2 والحذف الذري والتنافس السابقة تبقى مرجعها؛ لم يُعد installer أو زوج الحسابين أو PostgreSQL QA أو تدقيق متصفح ناجح لمجرد شاهد.

نجح npm run check كاملًا: typecheck وlint و**138 ملفًا/2257 اختبارًا**، بما فيها حراس Practice/characterisation/scoring/marker/store/scene-dom والعزل والنشر وretention. نجح npm run build وnpm run build:pages بإعداد pilot غير مفعل محليًا؛ finalize-headers أبقى connect-src self بلا متغير مزود أو أسرار. لم يجد فحص static chunks أسماء createWorkerBinding أو radlab-assess-worker-v1 أو سر fixture. نجحت docs:check مقابل origin/main بلا errors/review warnings، وstatus:check مقابلها مع require-previous وgit diff --check؛ بقي تعارض RAD-024 الموروث ظاهرًا. لم تتغير نسخة اعتماد سابقة في lock. لم يفشل فحص قبول محلي خلال هذه الدفعة ولم تُرفع مهلة/تُعدل توقعات لإخفاء فشل.

لا واجهة أو مشهد أو نص تغير؛ لا إعادة EN/AR390/1440/axe أو هاتف. لا تبديل توقع/hash أو رفع timeout أو تخفيف حارس لإخفاء فشل. نجاح بناء المكتبة/Next/الفحوص لا يثبت مزودًا أو تشغيلًا حيًا.

## 7. المتبقي وحدود الأدلة المكتملة

صف assess-retention-install/1 النهائي بعد COMMIT على الأصلية وفق إفادة المالك، وزوج assess-retention-closed-service/1 owner/participant PASS بنفس pair `d509c6b71cd5ad9bbba5ba1786d2c4598a45f01b1e146c943de76e995a9649e4` مكتملان ضمن شروطهما؛ runtimeOrLaunchVerified=false عمدًا. لا إعادة installer/preinstall/postinstall أو أدوات الحسابين أو قبول v2 أو محاولات/عامل/صيانة/حذف حي لإنتاج شاهد. launch_gate مغلقة في آخر دليل ولم تُلمس.

النسخة الشاملة مؤجلة لنهاية العمل باختيار المالك؛ لم يُعد السؤال ولم يبدأ تجهيزها. backup/recovery/provider غير مثبتة. snapshot قديمة تعيد إسنادًا مغلقًا أو حسابًا معطلًا أو موافقة/metadata حذفت؛ purge النتائج وlaunch_gate وحدهما لا تحجران القراءة. يلزم حجر الشبكة/API/الهويات ثم إعادة الآثار والحذف ومراجعة ACL قبل رفعه، مع دليل آثار أحدث مستقل وتجربة استعادة مأذونة. لا نظام نسخ إنتاجي أو export/restore مكتمل من بناء مكتبة.

O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، وJWT/TLS/ACL الحية وربط runtime والعامل والجدولة والمراقبة والنسخ والاستعادة والتصدير والنشر بوابات مستقلة. لا قبول تجريبي حي مكتمل.

## 8. قائمة المالك والخطوة التالية

راجع المحول وحدود صلاحياته وحزمة البناء والدليل. التالي نطاق مستقل لاختيار استضافة Node24 وسر login وCA وآلية الشبكة وACL وإلغاء الصلاحيات ومسؤول المراقبة والجدولة؛ لا إنشاء موارد/تكلفة أو نشر تلقائي من هذا التسليم. قبل أي تجربة مزود يراجع نطاق الإذن والبوابات، دون إعادة السياسات أو أدلة SQL/الحسابين المكتملة أو طلب النسخة الآن.

برومت الاستئناف: AGENTS وHANDOFF وRAD-056 والدليل والتقرير، ثم docs:context وGitHub لأحدث main و#96 وفحوص كل رأس. تابع checkout القائم، لا worktree/subagents أو SQL كتابة/Variables/PILOT_SCHEMA_VERIFIED أو runtime/عامل/schedule أو ready/merge/auto-merge. افصل حزمة البناء عن binding والتشغيل والمراقبة الحية وأبق launch_gate مغلقة.
