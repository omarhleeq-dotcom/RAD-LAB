# RAD-059 — دليل الهاتف للإيقاف والاستعادة

حزمة مراجعة محلية فقط؛ ينفذ المالك أي خطوة حية بعد قرار مستقل. [التصميم](RAD-059_OPERATIONS_DESIGN.md) و[اختيارات المالك](DECISIONS.md#rad059-stop-owner-2026-10-29) هما المرجع. لا CLI أو Cloud Shell مفترضة.

## SQL للهاتف

افتح مشروع Supabase الصحيح في Dashboard → SQL Editor → New query. افتح [الحزمة المولدة](RAD-059_PHONE_PACKET.md) من GitHub على نسخة PR المراجعة. اجمع كل أجزاء قسم الإيقاف بالترتيب في استعلام واحد ثم Run مرة واحدة؛ لا تنفيذ جزء منفرد أو تعديل base64. gate لا يلزم أن تكون مغلقة قبل الطوارئ. لا حسابات أو UUID أو scores أو كلمات مرور مطلوبة.

النتيجة صف واحد بعقد assess-emergency-stop/1؛ STOPPED يعني نجاح مراحل SQL الست في المعاملة فقط. PARTIAL/FAILED يعرض errors رموزًا ثابتة وحقول المرحلة؛ أبقِ الاحتواء ولا تستعد التشغيل. lock2s/statement5s لكل مرحلة؛ نحو30ثانية لست مراحل متعثرة، دون sleep داخل معاملة. أخطاء القتل قد تكون جزئية ولا يعيد ROLLBACK الاتصالات المنتهية.

بعد نجاح COMMIT، افتح New query مستقلًا لقسم التحقق، ثم أعد القراءة مرة واحدة بعد60ثانية من الهاتف. لا انتظار داخل المعاملة أو polling من الوكيل. النتيجة STOPPED، gate_closed=true، login_disabled=true، backend_sessions=0، unheld_sessions=0. missing_roles معلومة عن slot غير موجودة، لا إنشاء دور. cloud_stop_verified وpooler_cache_verified تبقيان false.

إذا انقطع الاتصال أو عرض SQL Editor خطأ COMMIT فلا تعتبر الصف السابق إثباتًا. تحقق باستعلام جديد؛ إن كانت المعاملة ما زالت مفتوحة في المحرر نفّذ ROLLBACK قبل إعادة الملف كاملًا. إذا لم يظهر صف أو انتهت مهلة تحقق القراءة فهذا UNKNOWN، لا نجاح. خطأ بنية/صلاحية خارج المراحل المحمية يحتاج المالك؛ لا تغيّر مخططًا أو grants لتجاوز الفشل.

## تجهيز المالك قبل نافذة مستقلة

احتفظ بثلاث علامات متصفح: Supabase Dashboard/SQL Editor للمشروع المقصود، وGoogle Cloud Console للمشروع والمنطقة المحددين في ربط العامل المراجع، وGitHub لنسخة الحزمة المراجعة. افتحها بحساب المالك قبل النافذة وتحقق من اسم المشروع في كل تبويب؛ لا تستنتج الهوية من نجاح SQL أو اسم Job وحده. يمكن طلب Desktop site من قائمة المتصفح إن اختفت قائمة Actions؛ لا terminal أو Console JavaScript.

من Cloud Run → Jobs → المهمة المقصودة → Configuration/YAML اقرأ فقط: image digest، عدد tasks/parallelism/retries/timeout، service account، واسم السر وإصداره الرقمي. سجل metadata تشغيلية منقحة فقط دون محتوى السر. لا تستعمل latest، ولا تفترض أن الصورة التاريخية assess-trial صالحة بعد إزالة B8؛ أي اعتماد على trial isolation يمنع تشغيلها ويحتاج ربطًا مراجعًا لاحقًا. لا تشغيل Job لمجرد اختبار وجودها.

الصلاحيات المطلوبة مسبقًا: SQL postgres القادر على تعديل LOGIN وإنهاء الأدوار المستهدفة؛ scheduler.jobs.pause؛ run.executions.cancel وقراءة Job/executions؛ secretmanager.versions.disable/enable وقراءة metadata. Cloud Run Developer يتضمن cancel؛ Secret Version Manager يتضمن disable. لا agent grants أو تغيير IAM في هذه الحزمة؛ نقص الصلاحية عائق تجربة يبقي gate مغلقة.

## الإيقاف الكامل — خطوات المالك بالترتيب

إذا وقع الحادث فابدأ الاحتواء؛ لا تؤخر SQL لجمع دليل أو انتظار الفوترة. لا يرفض SQL وجود جلسات أو gate مفتوحة. إذا تعذر جزء سحابي، نفذ بقية أجزاء الاحتواء المتاحة ولا تُعلن اكتمالًا.

| الخطوة من متصفح الهاتف | الشاشة والحالة المتوقعة | عند الفشل أو الغموض |
|---|---|---|
| 1. Cloud Scheduler من بحث Console؛ راجع المشروع وكل الصفحات/المناطق ذات الصلة بهدف العامل، حدد كل جدول يستهدف Job → Pause → تأكيد | الصف PAUSED. إذا لا مورد ضمن جرد كامل ومحدد النطاق فسجل ABSENT؛ لا تنشئ Scheduler للتجربة | خطأ Permission/صفحة غير مقروءة يعني UNKNOWN. Pause لا يلغي طلبًا سُلّم أصلًا؛ انتقل لإلغاء executions وSQL |
| 2. Cloud Run → Jobs → المهمة → Executions؛ افتح كل execution جارية/معلقة → Actions/⋮ → Cancel → تأكيد؛ راجع الصفحات كلها | CANCELLED أو حالة نهائية FAILED/SUCCEEDED إذا سبقت الإلغاء؛ لا RUNNING/pending/reconciling، وعدد running tasks صفر. لا Delete، كي تبقى الأدلة | حدّث الصفحة يدويًا حتى يظهر الإقرار؛ نجاح طلب cancel ليس نهاية التنفيذ. إن انتهى عبر timeout راجع النتيجة. نقص cancel صلاحية/بقاء الجاري يعني cloud stop غير مثبت، مع الاستمرار إلى SQL/السر |
| 3. Supabase → SQL Editor → New query؛ نفذ قسم الإيقاف كاملًا من الحزمة ثم تحقق مستقل | صف STOPPED ثم COMMIT؛ والتحقق STOPPED مع صفر backends/unheld. اقرأ errors عند PARTIAL/FAILED | لا تغيّر درجات/أجوبة أو تمسح جداول. اترك PAUSED/NOLOGIN، عالج العائق مع المالك، ثم أعد الإجراء كاملًا بعد ROLLBACK لأي معاملة معلقة |
| 4. Secret Manager → السر المراجع → Versions؛ راجع الإصدارات الرقمية التي تمنح العامل اعتمادًا فعالًا، حددها → ⋮/Actions → Disable → Disable selected versions | كل إصدار مستهدف DISABLED. إن كان معطلًا بالفعل فلا Enable للتجربة. لا Reveal secret value أو Download أو Destroy | أي إصدار مجهول/باقٍ ENABLED أو نقص صلاحية يبقي الإلغاء ناقصًا. النسخ المحملة في الذاكرة لا تُسحب بهذا الزر؛ لذلك Cancel وSQL كلاهما ضروري |
| 5. راجع Executions مرة أخرى، وSQL verify فورًا ثم مرة بعد60ثانية، وmetadata السر والجدولة | لا عودة لاتصال/تشغيل؛ gate مغلقة وLOGIN ممنوعة؛ Scheduler PAUSED/ABSENT والسر DISABLED | عودة backend قد تعني race قبل COMMIT أو cache؛ كرر الاحتواء، لا نجاح شامل من snapshot واحدة ولا إعادة تشغيل مشتركة للمزوّد |

SQL له ست مراحل محمية مستقلة داخل المعاملة. 55P03 يعني lock timeout/lock unavailable، و57014 إلغاء statement عند5ثوانٍ، و42501 نقص صلاحية. الحقول التي true تعني نجاح المرحلة، لا أن بقية المراحل نجحت. لو فشل تجميد الجلسات تبقى الأجزاء الناجحة مثبتة عند COMMIT؛ timeout داخلي يلغي تعديل تلك المرحلة نفسها. إذا فشلت مرحلة الإنهاء فقد تكون بعض الاتصالات أُغلقت فعلًا؛ rollback لا يعيدها. حدود الزمن تخص تنفيذ SQL على خادم متاح، ولا تضمن زمن شبكة الهاتف أو خدمة غير متاحة؛ لا صف عند فقد الاتصال يعني UNKNOWN، لا STOPPED.

NOLOGIN تظهر للاتصالات الجديدة بعد COMMIT؛ قد يعبر اتصال أثناء المعاملة، وSupavisor قد تحتفظ بواجهة أو cache. لذلك لا تمنح هذه الخطوات pooler_cache_verified=true، ولا تختبر اعتمادًا قديمًا بكلمة مرور في SQL Editor/history. شاهد رفض اتصال الاعتماد القديم عبر مسار المزود نفسه يبقى شرط إلغاء مستقل؛ إن احتاج CLI فيُرفع عبر RAD-082، لا workaround من الهاتف أو نشر probe جديد.

## حدود Job ووقف الإنفاق

بعد احتواء الجاري، راجع Job → View and edit job configuration → Containers/Task capacity/Parallelism: task count1، parallelism1، Number of retries per failed task0، Task timeout300 seconds، CPU1، memory512Mi. هذه **إعدادات مقترحة لقرار المالك اللاحق**؛ تعديلها لا يوقف execution بدأت، فلا تؤخر Cancel لتعديلها. لا تضع tasks0/parallelism0 أو max instances0 كبديل للإلغاء. راجع retries0 وmaxRetryDuration0 لأي Scheduler موجودة، مع بقائها PAUSED.

وقف الإنفاق الحوسبي يثبت من انتهاء الجاري ومنع الجديد، لا من انخفاض budget graph الفوري. تعطيل السر يمنع وصولًا جديدًا بعد انتشار التغيير، ولا يمنع وحده دفع تكلفة بدايات Job فاشلة؛ Pause وإلغاء التشغيلات ضروريان. لا تكرار يدوي أو Execute with overrides، ولا تشغّل tick لتثبت أنه ممنوع. إذا كان invoker آخر قادرًا على إعادة التشغيل، يلزم المالك معالجة صلاحياته بقرار حادث مستقل؛ تبقى الحماية غير مكتملة حتى احتوائه.

Billing → Reports/Cost table → مرشح المشروع والفترة والخدمة: راجع Cloud Run وScheduler وArtifact Registry وSecret Manager وCloud Logging/Build. التكلفة السابقة لا تُعكس عند Cancel؛ التخزين والسجلات وScheduler المتوقفة قد تبقى لها تكلفة. لا حذف صور أو destroy أسرار أو فصل Billing لتجميل الرسم. خيار صفر إنفاق مشروع كامل منفصل، قد يؤثر خدمات أخرى، ولم يختره المالك. لا auto-upgrade لـSupabase Free، ولا provider backups/PITR مفترضة.

## الاستعادة — قرار مستقل، عكس الاعتمادات والبوابة آخرًا

لا Undo شاملًا للإيقاف ولا استعادة تلقائية. الإيقاف لا يحذف role أو password أو expiry أو membership أو بيانات؛ لا تعكسه بتكرار provision/revoke التاريخيين. التسلسل التالي بعد قرار مكتوب للنافذة وسبب الحادث واستيفاء البوابات السابقة:

1. أبقِ Scheduler PAUSED وgate مغلقة، وصفر executions. راجع SQL/worker/UI/image digest والسر الرقمي الحالي. إن كانت الصورة trial أو غير مطابقة، أو انتهت صلاحية العامل أو سرّب الاعتماد، فتوقف: دوران password/secret وربط صورة جديدة يحتاج مسارًا آمنًا مراجعًا وقرار مالك؛ الهاتف لا يلصق password/verifier في SQL Editor. لا CLI بديلة داخل الدليل؛ RAD-082 هو رافع هذا العائق.
2. Secret Manager → Versions → الإصدار الآمن المراجع DISABLED → Actions → Enable → التأكيد؛ المتوقع ENABLED. لا إعادة تمكين إصدار مكشوف أو اختيار latest. يبقى العامل غير LOGIN ولا execution جديدة أثناء هذه الخطوة.
3. من SQL Editor راجع الدورين والبوابة باستعلام القراءة أدناه. حدد **دورًا واحدًا** يطابق السر المراجع وصلاحية مستقبلية سارية ومقيدة وفق قرار التشغيل؛ لا تفعّل الاثنين. سطر LOGIN التالي نموذج لـa فقط؛ إن كان القرار b فاختيار السطر المناظر يحتاج مطابقة صريحة للسر. لا تغيّر الصلاحية لتجاوز انتهاء نافذة التشغيل.

```sql
begin read only;
set local lock_timeout='2s';
set local statement_timeout='5s';
select rolname,rolcanlogin,rolvaliduntil from pg_roles where rolname in ('assess_job_a','assess_job_b') order by rolname;
select count(*)=1 and bool_and(not enabled) gate_closed from assess.launch_gate;
rollback;
```

Supabase تعرض آخر SELECT فقط؛ نفذ SELECT الدورين وSELECT gate في استعلامَي قراءة منفصلين إذا لم تعرض كليهما، مع أغلفة READ ONLY والمهلات نفسها. لا تخمّن الصف غير المعروض. بعد التحقق اليدوي والقرار، سطر الدور المختار بلا كلمة مرور:

```sql
begin;
set local lock_timeout='2s';
set local statement_timeout='5s';
alter role assess_job_a login;
commit;
```

4. راجع المحاولات المجمدة داخل SQL Editor الخاص فقط: `select id,state,submitted_at,submitted_at+interval '7 days' recovery_until from assess.sessions where state='grading-failed' order by submitted_at,id limit 20;` داخل READ ONLY بمهلات2s/5s. لا تنزيل/ملف/محادثة أو أسماء/درجات؛ الأعداد وحدها في تقرير التجربة. استعمل cursor `(submitted_at,id)` للصفحة التالية عند الحاجة؛ لا رفع الحد أو scan شامل للعرض.
5. لكل محاولة يختارها المالك، قبل7أيام ومع مراجعة غموض finish، نفذ `select assess.recover_v1('<SESSION_UUID>'::uuid);` في معاملة مستقلة بمهلات2s/5s؛ `<SESSION_UUID>` placeholder فاشل حتى يختار المالك المعرف داخل محرره الخاص. لا recovery جماعية، أو تغيير submitted_at/deadline/expires_at أو محاولة خارج المهلة. لا يعود الطالب إلى الإجابة؛ التصحيح يستخدم آخر إجابات محفوظة. بعد7أيام يحكم maintain_v1 القائم الإبطال/purge، ولا نمدد العقد لتجاوز التوقف.
6. شغّل أقسام4 من الحزمة: فحوص manifest التسعة، بينها `supabase/checks/rad085-p1-b-ready.sql`، المتوقع13/13؛ باقي حقول الجاهزية true، بينما restore_verified/runtime_or_launch_verified تبقى false كما صممت. كل قسم يُجمع وحده كاملًا قبل Run، ولا يستعمل readiness M1–M4 القديمة بدل B. القسم5.a أو5.b لفحص LOGIN القائم مع `assess.worker_login_target` المحدد داخل المعاملة؛ اختر المطابق للسر فقط. المتوقع active_catalogue_valid=true، مع credential_verified/pooler_verified=false ما لم يصل دليل مستقل. النتيجة المحلية لا تُعتمد دليل مزود.
7. راجع حدود Job السابقة، ثم اسمح بتشغيل bounded واحد فقط **بعد إذن تشغيل مستقل وربط صالح بعد B8** لمعالجة المختار. لا تعِد execution ملغاة أو ترفع retries. راجع completion وtick المطابق وصفر executions وSQL بعده؛ لا تستنتج من exit0 وحده نجاح التصحيح. هذا التشغيل ليس جزءًا من تجربة الإيقاف المغلقة أدناه.
8. فتح gate آخر خطوة SQL فقط بعد استيفاء RAD-059/RAD-082 وكل بوابات المنتج والحقوق والخصوصية ووجود مستجيب حاضر؛ لا تكفي سلامة الأداة المحلية أو CI. Scheduler تستعاد **أخيرًا** فقط بقرار تشغيل مستمر مستقل يثبت منع التداخل؛ وإلا تبقى PAUSED/ABSENT. لا تعكس Pause بمجرد أن LOGIN صارت متاحة.

أمر فتح البوابة التالي **لنافذة الاستعادة المأذونة وحدها**، ولا يدخل تمرين الإيقاف المغلق:

```sql
begin;
set local lock_timeout='2s';
set local statement_timeout='5s';
update assess.launch_gate set enabled=true where singleton;
select count(*)=1 and bool_and(enabled) gate_open from assess.launch_gate;
commit;
```

تعود gate إلى false فور أي فشل/شك أثناء الاستعادة. إلغاء execution لا يمكن عكسه؛ إعادة التشغيل تنفيذ جديد يحتاج إذنه. حتى اختيار البديل، التصعيد يعني gate مغلقة. لا خطوة تستوجب CLI أو كشف سر في هذا المسار؛ إذا احتاج العلاج ذلك فلا استعادة هاتفية آمنة الآن.

## تجربة المالك مرة واحدة قبل أول مستخدم حقيقي

هذه قائمة **غير منفذة**. تُنفذ في نافذة مأذونة على DB الحية والبوابة مغلقة، لا بيئة staging مزعومة أو مشروع جديد. لا participant حقيقي أو حساب/جلسة اصطناعية تضاف لإثبات الطوارئ. لا نسخ CSV جديدة؛ Free بلا provider backup/PITR، وRAD-082 مستقل قبل أول امتحان.

- [ ] راجع نسخة الحزمة/المصادر والقرار مع المراجع؛ تأكد من الوصول من متصفح الهاتف للمشاريع الصحيحة والصلاحيات. لا تعِد DB day/B/initializer ولا تقبل تحديث schema مختلفًا ضمن التمرين.
- [ ] قبل التمرين تحقق READ ONLY من gate مغلقة وصفر active/grading/grading-failed، وصفر executions؛ إن وجدت محاولات فلا تعتبر النافذة تمرينًا هادئًا: توقف وحدد قرار الحادث بدل تجميدها كتجربة. هذا شرط **التمرين فقط** وليس حارس أداة الطوارئ.
- [ ] سجل على الشاشة فقط أعداد sessions/results/details/receipts وحالة roles/expiry والجدولة والسر، دون scores أو هويات أو ملفات. لا حاجة لاسترجاع secret value. لا تغيير درجات أو حذف صفوف أو إنشاء نسخة احتياطية سحابية.
- [ ] Pause لما هو موجود؛ إن ABSENT فلا تنشئه. Cancel للجاري إن ظهر فعليًا؛ لا تبدأ execution لإثبات cancel. DISABLED للسر الموجود؛ لا تولد إصدارًا جديدًا. سجّل ALREADY/ABSENT للخطوات التي لم تغير شيئًا، لا «اختبار إلغاء نشط».
- [ ] نفذ الإيقاف كاملًا مرة واحدة، تحقق من STOPPED وCOMMIT، ثم استعلام التحقق المستقل. PARTIAL/FAILED أو خطأ/مهلة قراءة يوقف قبول التجربة؛ تبقى gate مغلقة ويعالج المالك السبب.
- [ ] نفذ الإيقاف كاملًا مرة ثانية، ثم التحقق؛ الأعداد والحالات نفسها، وصفر backends/unheld. راجع الأعداد السابقة على الشاشة دون إخراج بيانات إلى ملفات. لا يدّعي هذا مقارنة بايتات بيانات حية؛ الثبات التفصيلي مثبت محليًا.
- [ ] بعد60ثانية اقرأ التحقق مرة أخرى وراجع Executions وVersions وScheduler؛ تبقى gate مغلقة وNOLOGIN وصفر backends/runs، والسر DISABLED والجدولة PAUSED/ABSENT.
- [ ] شغّل جاهزية P1 B وفحوص المخطط الحالية دون إعادة ترحيل؛ كلها ready. لا resume أو LOGIN أو فتح gate ضمن هذا التمرين. إن كان أي مصدر جاهزية منفرد أكبر من15000حرف فقسّمه على حدود الأسطر واجمعه قبل Run، ولا تُنشئ functions من raw multiline paste.
- [ ] أرسل فقط نتيجة منقحة: وقت النافذة، نسخة الحزمة، STOPPED مرتين، تحقق فورًا وبعد60ثانية، ثبات الأعداد نعم/لا، readiness نعم/لا، وحالات السحابة ALREADY/ABSENT/CANCELLED/DISABLED أو UNKNOWN. لا UUID أو بريد أو logs/raw SQL results أو درجات أو أسرار.

ما تثبته: قدرة الهاتف والصلاحيات الفعلية على الإجراء في حالة مغلقة، صلاحية النقل، الالتزام والتكرار، وتحقق الاحتواء في اللقطات المذكورة. ما لا تثبته: إلغاء Job نشطة إن لم توجد، تجميد مستخدمين حقيقيين/سباقات إنتاج، تسليم البريد، غياب كل invoker خفي، cache Supavisor/رفض credential قديمة، سعة/تكلفة صفرية، نسخ/استعادة أو قبول سريري. تبقى الشواهد المشغولة محلية وحدها، والفجوات الحية أعمال مالك مفتوحة.

## تشغيل التنبيهات لاحقًا — مالك فقط

اتبع جدول القنوات في التصميم؛ لا تفتح gate قبل اختيار القنوات والمبلغ واستلام بريدها فعليًا. ضع السياسات على Job والمشروع/المنطقة الصحيحين، دون بيانات المشاركين أو query text في أسماء السياسات/الرسائل. Monitoring → Alerting → Create policy → Select metric → cloud_run_job → المقياس الوارد في الجدول؛ مرشحات project/location/job_name للهدف المراجع. الفشل: completed_execution_count مع result غير الناجح وsum على5دقائق >0؛ التداخل: running_executions >1 بلا نافذة انتظار إضافية؛ الإشغال الطويل: running_executions >0 وRetest window420s. اختر Email للمالك، عطّل repeated notifications وفعّل إشعار الإغلاق، ثم راجع الملخص قبل Save. إن لم تعرض الواجهة metric/label أو إعدادًا مطابقًا، توقف وراجع المصدر بدل اختراع مقياس أو تفعيل paid/custom metric.

جرّب قناة البريد من Test notification إذا عرضته الواجهة؛ إن لم يتوفر فإجراء اختبار استلام مستقل مراجع دون إنشاء VM/خدمة/Job أو توليد صرف. لا تسجل استلامًا من مجرد Save. فقد المقاييس في وضع closed/لا executions ليس فشلًا متوقعًا لهذه السياسات وحده؛ وجود data أو عدمها لا يثبت نجاح worker tick.

لا تذكير آلي دوري؛ افتح حادثًا واحدًا لكل سياسة وأغلقه بعد المعالجة. عند15دقيقة دون استجابة يفعّل المالك البديل المعتمد، وحتى وجوده تعني escalation بقاء gate مغلقة. توقف فور طلب خدمة مدفوعة إلزامية أو secret جديد أو وصول حي من الوكيل؛ اعرض بديلًا بدل تهيئة الموارد.
