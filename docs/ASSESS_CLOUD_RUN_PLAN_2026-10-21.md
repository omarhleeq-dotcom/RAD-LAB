# اختيار Google Cloud Run ومطابقة Assess — 2026-10-21 عمّان

## 1. السلطة والميزانية والانحرافات

حدد المالك Google Cloud Run بعد مراجعة [تقرير الربط المحلي](ASSESS_RUNTIME_LOCAL_REPORT_2026-10-20.md). سُجل الاختيار في [القرار](DECISIONS.md#assess-cloud-run-owner-2026-10-21)، دون استنتاج إذن خارجي. عُرضت قبل التحرير ميزانية خمسة ملفات توثيقية وهي الفعلية: DECISIONS وASSESS_RUNTIME_LOCAL وهذا الملف وHANDOFF وproject-status. لا وحدة مشتركة أو كود/SQL/UI أو package/lock أو workflow/guard/pins أو Variable تغيرت، ولا انحراف. تابعنا checkout القائم النظيف دون worktree/subagents.

## 2. المنجز وخيار الربط

المعتمد من المالك: **Google Cloud Run حاليًا**. المقترح التقني لهذه المرحلة: **Cloud Run Jobs**، لأن العمل الخاص دفعة محدودة يعيد runAssessJobs ثم ينتهي، ولا يحتاج خادم مستخدم أو PORT/HTTP عام. [عقد الحاوية الرسمي](https://docs.cloud.google.com/run/docs/container-contract) يميز Job المكتملة بخروج0 عن الفشل بخروج غير صفري. هذه مطابقة تصميم، لا job أو container أو deployment أُنشئ أو اختُبر على Google.

المسار العام الحالي يبقى browser → Supabase Auth/Data API → RPC مفوضة بـauth.uid، مع تحقق JWT عند المزوّد، دون body identity أو admin/service key باسم المستخدم. لا نقل قاعدة البيانات إلى Cloud SQL أو الواجهة من Pages، ولا كشف المصحح أو claim للمتصفح. اختيار Cloud Run لا يثبت JWT حيًا أو موافقة v2، ولا v1 بديلًا عنها.

المسار الخاص المقترح: container Node24 لمهمة محدودة → createWorkerBinding → PostgreSQL/TLS بالـlogin المقيد → SET LOCAL ROLE assess_worker → runAssessJobs القائمة. installMixedContent وpublicationService وrecover_v1 تظل أدوات مأذونة مستقلة لا عمليات تلقائية في tick أو عند startup. لا عامل/صيانة/حذف أو lease أو recovery مكرر.

| الجانب | الخطة المحلية التالية | دليل القبول المطلوب قبل أي ربط حي |
|---|---|---|
| الحاوية | بناء محلي من bundle الحالية، صورة Node24 مراجعة ومثبتة، مستخدم غير root وملفات لازمة فقط، دون أسرار/مجلد checkout كامل. | build/import مستقلان دون loader المرجعي؛ فحص المحتويات واعتماديات الصورة وإشارات PID1؛ لا نشر registry أو Cloud Build الآن. |
| entrypoint | tick واحدة محدودة، لا loop أو timer؛ config صريحة، fail closed عند غيابها، وإغلاق binding بعد انتهاء tick. | synthetic worker/config injection، exit/status منقحان؛ فشل/إيقاف لا يعلن complete. لا إعادة graded=0 على خطأ نقل. |
| حدود Job | مقترح أولي tasks=1 وparallelism=1 وmaxRetries=0 صراحة، بلا schedule؛ batch أولي صغير داخل1..100 وpool1. | فحص configuration محلي؛ تداخل executions مستقلة لا تمنعه parallelism، والـlease القائمة مصدر التزامن. لا ادعاء حد إجمالي اتصال من هذه القيم. |
| هوية Google | service account مخصص بأقل وصول مطلوب، مع فصل هوية ناشر/مشغّل المهمة عن هويتها. | مراجعة IAM للحساب والأسرار وحق تشغيل المهمة دون override غير مأذون. لا Owner/Editor أو مفتاح JSON داخل الحاوية. هوية Google لا تمنح تلقائيًا صلاحية PostgreSQL. |
| السر | اقتراح Secret Manager بإصدار مراجع للوصول المحدود، ثم تمرير credential إلى config الخاصة، لا args/stdout أو browser/build. | رفض secret مفقود/غير متاح/مدور دون تسريب؛ تحديد حق القراءة للسر المعني وحده. لا إنشاء أسرار أو منح IAM الآن. |
| قاعدة البيانات والشبكة | login منفصل محدود، وCA صريحة وhostname verification؛ مراجعة الوصول الخارجي/IPv4-v6 وpooler/port وACL دون فرض تغييرات أو نقل DB. | اتصال TLS فعلي ورفض المضيف/الشهادة الخاطئة، ورفض direct tables/roles/user RPC، وسحب الصلاحية مع إغلاق الاتصالات القائمة. NOLOGIN أو سحب IAM وحدهما لا ينهيان جلسة DB قائمة. |
| المراقبة والتكلفة | counts وأكواد فقط؛ مسؤول وقناة تنبيه وحدود تأخر وفشل/lease/purge وإجراء استرداد. project/region والموارد والتكلفة لم تحدد. | رفض logs تحوي claims/أجوبة/إعدادات/علامات/هويات/أسرار، واختبار تنبيه مأذون. اختيار الخدمة لا يثبت Free أو حد إنفاق أو quota أو نسخة مزوّد. |

وفق [توثيق retries](https://docs.cloud.google.com/run/docs/configuring/max-retries)، القيمة الافتراضية3 لكل task؛ المقترح0 يمنع إعادة المهمة من طبقة المنصة في التجربة الأولى، ولا يلغي retry_at أو تعافي lease داخل SQL. [parallelism](https://docs.cloud.google.com/run/docs/configuring/parallelism) حد المهام داخل execution، وليس قفلًا عالميًا. لا scheduler خارجي/داخلي أو تكرار تلقائي أُعد الآن.

[هوية الخدمة](https://docs.cloud.google.com/run/docs/securing/service-identity) تتيح حسابًا مخصصًا؛ لا استخدام مفتاح service account في GOOGLE_APPLICATION_CREDENTIALS داخل Cloud Run. [أسرار Jobs](https://docs.cloud.google.com/run/docs/configuring/jobs/secrets) تتطلب وصولًا للسر من هوية المهمة. اختيار طريقة حقن السر وإصداره/تدويره وإلغاء قراءته نهائيًا يخضع لاختبار لاحق؛ ليس مجرد نجاح startup شهادة إدارة سر أو إلغاء جلسة DB.

## 3. RAD-056

تبقى review/waiting_on reviewer دون completion_evidence. حُدث وصف المتبقي والمصدر والملخص الخماسي والتسليم، ورُفعت revision والوقت. لم تُغلق بوابة provider/runtime أو مهمة أخرى. حُفظ تعارض RAD-024 الموروث؛ «اختيار المزوّد» لم يعد سؤالًا معلقًا، بينما تفاصيل الربط والتشغيل ما زالت غير منفذة.

## 4. المشترك وScale وفجوة الإيقاف

لا شيفرة مشتركة تغيرت. لا حجم/CPU/ذاكرة/QPS أو task timeout نهائي اعتُمد، ولا region أو حساب دفع. الحدود الأولية المقترحة أعلاه لا تثبت سعة ولا تمنع تعدد executions من مشغّلين مختلفين. رفعها يحتاج قياس DB/ذاكرة وحمل وتداخل وتشغيل ومراقبة معروفة، دون scan أو queue تطبيقية غير محدودة.

**فجوة مطابقة مهمة:** يوضح [عقد Jobs الرسمي](https://docs.cloud.google.com/run/docs/container-contract) أن انتهاء task timeout يرسل SIGTERM ثم SIGKILL بعد10ثوانٍ. binding الحالية تسمح statement60s واتصال10s، وقد يضيف tick تصحيحًا وfinish/fail/health. لذلك لا تضمن signal التعاونية وحدها انتهاء التسوية داخل نافذة الإنهاء؛ اختيار task timeout أطول لا يلغي احتمال القتل/الإلغاء أثناء معاملة. لا تُخفض مهلة SQL أو تغير lease/retry windows لمجرد وعد إيقاف.

قبول الحزمة التالية محليًا يتطلب: signal تمنع claim التالية دون قطع إقرار الجاري؛ اختبار قتل حقيقي أثناء finish وقرب COMMIT، ثم فحص حالة DB من اتصال مستقل؛ نتيجة واحدة أو حالة قابلة للاسترداد تحت lease دون صفر؛ فقد إقرار finish لا يجيز تثبيتًا ثانيًا؛ انتظار retry_at ونافذة الاسترداد ورفض token قديم؛ close بعد تسوية tick أو إبقاء عدم اليقين واضحًا عند القتل. اختبار service signal القائم ليس تجربة PID1/منصة أو برهانًا على crash recovery. لا منظومة استرداد جديدة بدل recover_v1 القائمة، ولا تشغيل على الأصلية للشاهد.

تغير الحكم الحالي الوحيد هو اعتماد استضافة Google Cloud Run بدل مزوّد غير مختار. لا تغير لسياسة S-ASSESS-15 أو مصدرها أو [توجيه النسخة](DECISIONS.md#assess-retention-original-no-backup-2026-10-20)، وروابط الأدلة الأصلية محفوظة. Jobs والحدود وSecret Manager مقترحات تقنية لم تُنسب كاختيارات تفصيلية للمالك.

## 5. الطب والدرجات والخصوصية

لا محتوى أو طب/مصادر/ترخيص أو معايير أو Marker أو درجات/إعدادات/صور/توقعات/hashes Practice تغيرت، ولا نص موافقة أو قبول نيابة عن أحد. لا claims أو credentials أو صفوف إنتاج جُلبت. التشغيل الاصطناعي السابق ليس قبولًا سريريًا؛ العربية DRAFT وO108 والمراجعة مستقلة.

## 6. التحقق والفحوص وحدود الدليل

عند الاستئناف كان checkout نظيفًا على `16980f96d04a31fd0ee2c3e65c1d0a3b643861df`. تحقق GitHub من بقاء [#96](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/96) open/draft وغير مدموجة وعلى الرأس نفسه؛ [CI39503012835](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39503012835) و[Deploy39503012836](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39503012836) completed/success وhead_sha مطابق. أحدث main عند القراءة وبعد fetch هو `ff68413042e6e8414ad70884efcfa71cac7443a7`، و[CI39464823281](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39464823281) و[Deploy39464823264](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/39464823264) ناجحان على الرأس نفسه. لا نقل لنتائج رأس سابق/لاحق أو نشر runtime من Pages، ولا هاتف جديد أو قبول حي. لم يُعَد workflow أو يُفتح رابط preview.

روجعت مصادر Google الرسمية المرتبطة أعلاه عبر أداة الويب؛ لا دخول إلى Console أو حساب/مشروع Google أو قراءة أسرار أو تفعيل APIs/فوترة أو إنشاء service account/Job/Artifact Registry/Secret Manager/Scheduler. جاهزية البيئة لا تحتوي هوية Google متصلة ولا شهادة provider؛ لم يُستخدم gcloud أو Docker أو اتصال قاعدة.

نجحت docs:check مقابل origin/main بلا errors أو review warnings، وstatus:check مقابلها مع require-previous، وgit diff --check. بقي تعارض RAD-024 الموروث ظاهرًا دون تغيير أو إغلاق آلي.

لم يُعد check/build/Practice أو EN/AR390/1440/axe أو rehearsal أو SQL/أدوات الحسابين؛ لا تغير كود أو UI أو فشل جديد يبرر ذلك. فحوص المنتج السابقة محفوظة بحدودها في تقرير الربط. لا رفع مهل أو تغيير توقعات/hashes أو guard/pins لإخفاء فشل.

## 7. المتبقي والبوابات

أُعدت لاحقًا [حزمة container/entrypoint المحلية وشاهد قتل العملية](ASSESS_CLOUD_RUN_LOCAL_REPORT_2026-10-21.md)، مع بقاء هذه الخطة دليل اختيار المزوّد ومقترحات الإعداد. لا ملفات config أو موارد Cloud Run فعلية؛ الصورة محلية فقط. لم تُحسم project/region/التكلفة أو مسار الشبكة والـlogin/CA أو مسؤول التشغيل/IAM والأسرار/الإلغاء/المراقبة. لا إعداد live runtime/عامل/schedule، ولا أدوات deployment عامة أو إذن تشغيل مستنتج من اختيار Google.

SQL والزوج المغلق المكتملان لا يعادان؛ runtimeOrLaunchVerified=false مقصودة. launch_gate الأصلية مغلقة وفق آخر دليل ولم تُلمس. نسخة شاملة واحدة مؤجلة لنهاية العمل حسب المالك، دون إعادة سؤال أو تجهيز تلقائي، وbackup/recovery/provider غير مثبتة. snapshot قديمة قد تعيد إسنادًا مغلقًا أو حسابًا معطلًا أو موافقة/metadata محذوفة؛ purge النتائج وlaunch_gate وحدهما لا يحجران القراءات. حجر الشبكة/API/الهويات وإعادة الآثار والحذف وفحص ACL قبل رفع الحجر متطلبات مستقلة، لا نسخة/restore أو تصدير منفذ.

O108 والمصادر والترخيص والمراجعة والخلفية والمعايير وMarker، وJWT/TLS/ACL الحية وruntime والعامل والجدولة والمراقبة والنسخ والاستعادة والتصدير والنشر بوابات مستقلة؛ لا قبول تجريبي حي مكتمل.

## 8. الخطوة التالية وبرومت الاستئناف

راجع حزمة container/entrypoint وشاهدها المحليين في التقرير المرتبط أعلاه. التالي تحديد project/region والتكلفة ومسؤول التشغيل وصلاحية/سر وشبكة الربط، ومراجعة الأدلة المطلوبة قبل أي تجهيز خارجي؛ لا إعادة بناء الشاهد الناجح بلا تغير ذي صلة. اختيار Cloud Run محسوم فلا يُسأل ثانية؛ project/region/التكلفة والتجهيز الخارجي تحسم عند الحاجة إليها قبل أي إنشاء موارد، دون افتراض خدمة مدفوعة أو بيانات اعتماد.

ابدأ AGENTS وHANDOFF وRAD-056 وهذا الملف ودليل runtime، ثم docs:context/GitHub لأحدث main و#96 وفحوص كل رأس. تابع checkout نفسه بلا worktree/subagents، واعرض ميزانية ومعايير قبول قبل تحرير كود جديد. لا merge/ready أو SQL كتابة أو Variables/PILOT_SCHEMA_VERIFIED أو نشر/runtime/عامل/schedule أو فتح launch_gate. أبق مرحلة البناء منفصلة عن الربط والتشغيل والمراقبة الحية.
