# دليل المالك: ملخص Brevo لتسجيلات الطلاب الجدد (RAD-104، الخيار C)

**القرار:** [brevo-signup-notify-owner-2026-11-04](DECISIONS.md#brevo-signup-notify-owner-2026-11-04)؛ التصميم: [الخطة](BREVO_SIGNUP_NOTIFY_PLAN.md). المالك وحده ينفّذ هذه الخطوات؛ الوكيل لم يشغّل SQL حيًا ولم يكتب في Vault ولم يغيّر اللوحة. لا تلصق المفتاح أو أي عنوان بريد في المحادثة أو Git.

**الملفات:** التثبيت [`signup-notify-install.sql`](../supabase/manual/signup-notify-install.sql)، التراجع [`signup-notify-rollback.sql`](../supabase/manual/signup-notify-rollback.sql)، الفحص [`signup-notify-ready.sql`](../supabase/checks/signup-notify-ready.sql).

**وسم الحقائق الخارجية:** **Verified** = مقروءة في المصدر المذكور بتاريخ 2026-11-04، أو مسجلة في المستودع. **Not verified** = غير مقروءة؛ تحقّق منها في اللوحة نفسها.

## ما الذي سيحدث

- كل حساب جديد في `auth.users` يضيف صفًا واحدًا (رقم ووقت فقط) إلى طابور خاص. المشغّل لا يرفع خطأ أبدًا، فلا يتعطل التسجيل.
- كل 10 دقائق، إن وُجدت صفوف لم تُرسل، يُرسل **بريد واحد** نصه: `N new sign-up(s) since last notice; total accounts: T`، ثم تُعلَّم الصفوف مرسلة. الصفوف المرسلة تُحذف بعد 7 أيام.
- لماذا `auth.users` لا `public.profiles`؟ الفحص المعتمد [`rad085-review-ready.sql`](../supabase/checks/rad085-review-ready.sql) يحسب بصمة كل مشغّلات `public.profiles`؛ أي مشغّل هناك يكسر البصمة ويحتاج تغيير العلامة، وهذا ممنوع في هذه المهمة. `training-ready.sql` يتحقق فقط من وجود مشغّل الاسم على `auth.users`، ولا يتأثر.
- **مفتاح الإيقاف OFF افتراضيًا:** لا يُرسل شيء حتى تشغّله أنت (الخطوة 7).

## 1. مفتاح Brevo API (لابتوب أسهل)

1. Brevo ← قائمة الحساب ← **SMTP & API** ← تبويب **API Keys** ← **Generate a new API key**، الاسم `radlab-signup-notify`. (**Not verified**: مسار القائمة؛ صفحة المساعدة لم تُقرأ.)
2. هذا مفتاح **API** وليس مفتاح SMTP المستخدم لبريد المصادقة ([S-PILOT-6](PILOT_SUPABASE_SETUP.md#3-بريد-التأكيد-smtp--نُفِّذ-بـ-brevo-2026-10-15-المالك)). لا تغيّر مفتاح SMTP. أن المفتاحين منفصلان **Not verified** من Brevo، ومذكور في الخطة كذلك.
3. **أقل صلاحية:** إن عرضت Brevo تقييد صلاحيات المفتاح فاختر البريد المعاملاتي فقط (**Not verified** أن الخيار موجود). **لا تفعّل** قائمة IP مسموحة: عناوين خروج Supabase غير مثبتة هنا، والتقييد قد يوقف الإرسال (Inferred).
4. يظهر المفتاح مرة واحدة: انسخه مباشرة إلى الخطوة 2، ولا تحفظه في ملاحظة أو صورة شاشة.

**Verified** ([مرجع Brevo](https://developers.brevo.com/reference/sendtransacemail)): الإرسال عبر `POST https://api.brevo.com/v3/smtp/email` بترويسة `api-key`. الحقول `sender` و`to` و`subject` و`htmlContent` (مطلوب دون قالب) و`textContent`. النجاح `201`.

## 2. ثلاثة أسرار في Vault (يدويًا في اللوحة)

Supabase ← المشروع ← **Vault** ← **Add new secret**. المسار الدقيق للقائمة **Not verified**؛ أن للوحة واجهة Vault **Verified** ([توثيق Vault](https://supabase.com/docs/guides/database/vault)). الأسماء حرفيًا:

| الاسم | القيمة |
|---|---|
| `radlab_signup_notify_brevo_key` | مفتاح API من الخطوة 1 |
| `radlab_signup_notify_sender` | عنوان المرسل الموثّق في Brevo (نفس مرسل SMTP الحالي) |
| `radlab_signup_notify_recipient` | بريدك أنت (المستلم) |

غياب أي سر أو كونه فارغًا = لا إرسال ولا خطأ؛ الفحص يُظهر `no_secret`. تحذير من التوثيق (**Verified**): من يقرأ `vault.decrypted_secrets` يرى الأسرار، والحزمة لا تمنح أي دور قراءتها.

## 3. تأكد من `pg_net` و`pg_cron` (STOP إن لم يتوفرا مجانًا)

1. **Database ← Extensions**: ابحث عن `pg_net` وفعّله (**Verified**، [توثيق pg_net](https://supabase.com/docs/guides/database/extensions/pg_net)).
2. **Integrations ← Cron**: فعّل Cron/`pg_cron` إن طُلب منك (**Verified** أن الواجهة موجودة، [توثيق Cron](https://supabase.com/docs/guides/cron)).
3. المشروع على باقة **FREE** ([D1](DECISIONS.md#launch-records-owner-2026-11-03)، Verified في المستودع). توفر الامتدادين في الباقة المجانية **Not verified**: إن طلبت اللوحة ترقية أو دفعًا فـ**STOP**، لا ترقِّ، وأبلغ.

## 4. تطبيق الحزمة (SQL Editor؛ لابتوب أسهل للصق)

SQL Editor ← استعلام جديد ← الصق **كامل** `signup-notify-install.sql` ← Run.
- **متوقع:** نجاح بلا خطأ. السطر الأخير ينشئ مهمة cron باسم `radlab-signup-notify`.
- رسالة تبدأ بـ`STOP:` تعني أن شيئًا لم يُنشأ (المعاملة كاملة أو لا شيء). اقرأ السبب: الحزمة مثبتة سابقًا، أو امتداد ناقص، أو Vault غائب.
- إنشاء المشغّل يقفل `auth.users` لحظة؛ `lock_timeout` ثانيتان، وعند انتهائه يفشل التطبيق كاملًا وتعيده لاحقًا.

## 5. الفحص (قراءة فقط)

الصق `signup-notify-ready.sql` ← Run. **كل `ok` = true**، و`switch_state` = `OFF`. الرسالة «relation signup_notify… does not exist» تعني أن الحزمة غير مثبتة.

## 6. بريد تجريبي واحد

1. `select signup_notify.send_test();` ← متوقع `test_sent` (أو `no_secret`: راجع أسماء الخطوة 2).
2. انتظر دقيقة، ثم أعد الفحص: `last_http_status` = `201`. الإرسال يتم بعد انتهاء المعاملة (**Verified**، توثيق pg_net)، والاستجابة تُحفظ 6 ساعات فقط ثم تصير `none`.
3. في بريدك: الموضوع `RAD-LAB: sign-up notice test` والنص `Test notice; total accounts: T` فقط، بلا اسم أو بريد أو رابط.
4. حالات أخرى (Inferred): `401` = مفتاح خاطئ؛ `400` = مرسل غير موثّق أو حقل ناقص. لا تشغّل المفتاح قبل `201`.

## 7. تشغيل المفتاح

`update signup_notify.settings set enabled = true where singleton;` ثم أعد الفحص: `switch_state` = `ON`.
اختياري: سجّل حسابًا تجريبيًا واحدًا؛ خلال 10 دقائق يصل `1 new sign-up(s) since last notice; total accounts: T`، والتسجيل نفسه لا يتأخر.
**إيقاف فوري:** `update signup_notify.settings set enabled = false where singleton;` (الصفوف تبقى وتُرسل عند التشغيل).

## 8. التراجع الكامل

1. الصق `signup-notify-rollback.sql` ← Run. الصف الأخير: `schema_left`، `trigger_left`، `cron_job_left` كلها **false**. يمكن تشغيله مرتين بأمان.
2. يدويًا: احذف الأسرار الثلاثة من Vault، واحذف المفتاح `radlab-signup-notify` من Brevo. التراجع لا يلمس Vault ولا Brevo.

## 9. تدوير المفتاح

1. أنشئ مفتاح API جديدًا في Brevo (الخطوة 1).
2. Vault ← `radlab_signup_notify_brevo_key` ← عدّل القيمة إلى المفتاح الجديد (الاسم نفسه).
3. `select signup_notify.send_test();` ← بعد دقيقة الفحص يُظهر `201`.
4. احذف المفتاح القديم من Brevo. مدة صلاحية مفاتيح API في Brevo **Not verified**؛ مفتاح SMTP ينتهي بعد 90 يومًا بلا استخدام (Verified في الخطة §2).

## حدود معلنة (S-STD-3)

- **الإرسال غير متزامن:** تُعلَّم الصفوف مرسلة عند وضع الطلب في الطابور. إذا رفضت Brevo الطلب ضاع ذلك الإشعار ولا يُعاد؛ الفحص يُظهر الرمز في `last_http_status`. المحفّز: فشل متكرر، ويُقرَّر عندها التحقق من الاستجابة قبل التعليم.
- **pg_net يحتفظ بالطلب** (ومنه ترويسة `api-key`) في `net.http_request_queue` حتى إرساله، وبالاستجابة 6 ساعات في `net._http_response` (**Verified**، توثيق pg_net). من يقرأ هذين الجدولين غير مثبت هنا (**Not verified**).
- العدد `T` يشمل كل صفوف `public.profiles`، ومنها المالك والحسابات التجريبية.
- `htmlContent` يحمل النص الثابت نفسه بلا روابط. هل تضيف Brevo بكسل تتبع للفتح في HTML؟ **Not verified**.
- القفل الاستشاري ضد التشغيل المتزامن لم يُختبر بجلستين (PGlite جلسة واحدة)؛ pg_cron لا يشغّل المهمة نفسها مرتين متزامنتين عادةً (**Not verified**).
