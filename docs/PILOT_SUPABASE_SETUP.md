# دليل المالك: تجهيز Supabase للإطلاق التجريبي (RAD-041a) — 2026-10-15

**من يفعل:** المالك وحده، من متصفح الحاسوب. Claude Code لا ينشئ حسابًا ولا مشروعًا ولا يرى أي مفتاح.
**المرجع:** [`PILOT_PROVIDER_COMPARISON_2026-10-15.md`](PILOT_PROVIDER_COMPARISON_2026-10-15.md) (الأدلة من وثائق Supabase الرسمية). أسماء الأزرار والقوائم أدناه **(قد تختلف)** عن لوحة Supabase الحالية؛ القيم هي المهمة.
**قواعد ثابتة:** (1) لا تلصق كلمة سر قاعدة البيانات ولا أي مفتاح سري `sb_secret_…` في محادثة أو GitHub أو ملف. (2) المفتاح العام (publishable) وحده يدخل الموقع، وفي 041b فقط. (3) لا تُدخل بيانات مرضى حقيقية.

## 1. إنشاء المشروع

1. سجّل في supabase.com بحسابك. الباقة: **Free** (الميزانية المجانية، S-PILOT-3).
2. أنشئ مشروعًا جديدًا. **المنطقة: «Central EU (Frankfurt)» `eu-central-1`** — اختر المنطقة المحددة لا «Europe» العامة (العامة قد تُنشر في لندن أو زيورخ). المنطقة لا تُغيَّر بعد الإنشاء على الأرجح (لم يُقرأ في الوثائق؛ اعتبرها ثابتة).
3. اضبط **كلمة سر قاعدة البيانات** وخزّنها في مدير كلمات مرور. لا تشاركها.
4. الحد المجاني: **مشروعان نشطان** (أحدهما لتجربة الاستعادة، §8).

## 2. إعدادات المصادقة (Authentication)

| الإعداد | القيمة | السند |
|---|---|---|
| Allow new users to sign up | **مفعّل** (تسجيل ذاتي، S-PILOT-4) | صفحة general-configuration |
| Confirm Email | **مفعّل** | نفس الصفحة |
| Allow anonymous sign-ins | **معطّل** | نفس الصفحة |
| أقل طول لكلمة المرور | **8** (قرار المالك، مع اشتراط أحرف كبيرة وصغيرة وأرقام ورموز؛ 10+ أفضل) | صفحة password-security: «Anything less than 8 characters is not recommended.» |
| Leaked password protection | غير متاح في Free (Pro) | نفس الصفحة |
| CAPTCHA (hCaptcha أو Turnstile) | اختياري؛ يُفعَّل إن ظهرت تسجيلات وهمية | صفحة auth-captcha |
| MFA (TOTP) | فعّله **لحساب المالك** | صفحة auth-mfa؛ «Basic Multi-Factor Auth: Included in free» |
| Redirect URLs | أضف عنوان الموقع الإنتاجي وعناوين المعاينة التي ستستعمل | صفحة passwords: «This URL must be configured as a Redirect URL» |

> **الموافقة اليدوية** لا تُضبط هنا: كل حساب جديد يُنشأ بحالة `pending` من الـtrigger في الـmigration، ولا يكتب شيئًا حتى توافق عليه (§5).

## 3. بريد التأكيد (SMTP) — نُفِّذ بـ Brevo (2026-10-15، المالك)

**ما اعتُمد فعليًا (S-PILOT-6):** Brevo (باقة مجانية، 300 رسالة يوميًا بحسب لوحتهم) بمرسل `radlab.pilot@gmail.com`. خطواته كما جرت، لمن يعيدها: (1) تحقق الهاتف في Brevo (شرط منهم قبل مفتاح SMTP؛ تعثر مرات قبل أن ينجح)؛ (2) Senders ← إضافة المرسل (يحذّر Brevo من العناوين المجانية فاختر Add this sender anyway)؛ (3) SMTP & API ← Generate SMTP key؛ (4) **Security ← Authorized IPs ← Deactivate for SMTP keys** (الحجب الافتراضي يمنع عناوين Supabase)؛ (5) في Supabase: Authentication ← Emails ← SMTP Settings: Host `smtp-relay.brevo.com`، Port `587`، **Username = «Login» الظاهر في صفحة SMTP & API (مثل `be…@smtp-brevo.com`) وليس بريد الحساب**، Password = مفتاح SMTP، Sender = بريد المرسل. **جُرِّب بدعوة حقيقية: وصلت إلى Inbox.** يرسل Brevo من نطاق تابع له (`…brevosend.com`) ويجعل `radlab.pilot@gmail.com` عنوان الرد. مفتاح SMTP ينتهي بعد 90 يومًا بلا استخدام. SPF/DKIM/DMARC لم تُفحص بعد (اختياري). **أسلم للتوصيل لاحقًا: نطاق خاص موثّق** (مدفوع، مؤجل).

> النص التالي كان قبل الاعتماد ويُترك للتوثيق: الخادم المدمج لا يصلح…

الخادم المدمج **لا يصلح**: «Send messages only to pre-authorized addresses» (أعضاء مؤسستك فقط)، وحده 2 رسالة في الساعة. المشاركون الخارجيون لن يصلهم بريد التأكيد بدونه.
المطلوب: خدمة إرسال بريد SMTP من اختيارك وإدخال بياناتها في Authentication → SMTP **(قد يختلف)**. لم أقرأ شروط أي خدمة بريد، فاقرأ حدودها المجانية بنفسك أو اطلب جلسة DOCS لمقارنتها. بعد الإدخال جرّب إرسال بريد تأكيد إلى عنوان **ليس عضوًا** في مؤسستك.

## 4. تطبيق المخطط (Migration)

1. افتح SQL Editor **(قد يختلف)** في المشروع.
2. الصق محتوى الملف [`supabase/migrations/20261015000100_pilot_accounts.sql`](../supabase/migrations/20261015000100_pilot_accounts.sql) كاملًا ونفّذه مرة واحدة.
3. تحقق: الجدولان `profiles` و`events` ظاهران وRLS مفعّلة عليهما.

### 4ب. المخطط الثاني: قائمة المشاركين للمالك (RAD-044a)
بعد المخطط الأول نفّذ بنفس الطريقة (SQL Editor ← استعلام جديد ← Run) محتوى [`supabase/migrations/20261016000100_owner_list_participants.sql`](../supabase/migrations/20261016000100_owner_list_participants.sql) **مرة واحدة**. يضيف دالة `owner_list_participants()` تقرأ بريد كل مشارك **للمالك المعتمد فقط** (وإلا ترفض بالخطأ `owner only`)، دون نسخ البريد إلى أي جدول يقرؤه التطبيق. وبعدها تظهر صفحة **`/{locale}/owner`** («لوحة المالك») ورابطها في صفحة الحساب عندك، وفيها أزرار موافقة / إيقاف بدل SQL.

### 4ج. المخطط الثالث: حفظ المحاولات (RAD-042)
نفّذ بنفس الطريقة (SQL Editor ← استعلام جديد ← الصق **محتوى** الملف لا اسمه ← Run) محتوى [`supabase/migrations/20261017000100_attempts.sql`](../supabase/migrations/20261017000100_attempts.sql). المتوقع «Success. No rows returned». بدونه لا يفشل التطبيق (الحفظ صامت) لكن لا تُحفظ المحاولات. للتحقق: Table Editor ← `attempts` بعد محاولة بحساب معتمد.

### 4د. المخطط الرابع: الموافقة على الشروط والخصوصية (RAD-043a)
نفّذ بنفس الطريقة محتوى [`supabase/migrations/20261018000100_consent.sql`](../supabase/migrations/20261018000100_consent.sql) (انسخ المحتوى لا الاسم). **أثره:** لا تُحفظ المحاولات (في التطبيق ولا في قاعدة البيانات) إلا لحساب سجّل موافقته. الحسابات الموجودة (حسابك والحسابان التجريبيان) ستجد بطاقة «يرجى مراجعة الشروط والخصوصية» في صفحة الحساب: اضغط الصندوق ثم «أوافق وأتابع» مرة واحدة. راجع نص `/ar/terms` وعدّله قبل دعوة أي أحد (مدة الاحتفاظ، البريد، من يرى البيانات).

## 5. حساب المالك والموافقة على المشاركين

1. أنشئ حسابك بأي طريقة متاحة (Authentication → Users → Add user **(قد يختلف)**، أو بعد 041b من صفحة التسجيل). أكّد بريدك.
2. اجعله المالك (SQL Editor، يعمل بصلاحية عالية فلا يمنعه RLS):
   ```sql
   update public.profiles set role = 'owner', status = 'approved'
   where user_id = (select id from auth.users where email = 'بريدك@example.com');
   ```
3. الموافقة على مشارك (حتى تُبنى لوحة المالك في RAD-044):
   ```sql
   update public.profiles set status = 'approved' where participant_code = 'P-xxxxxxxx';
   ```
   (من SQL Editor. الدالة `public.set_participant_status` تعمل من تطبيق المالك لاحقًا لأنها تتحقق أن المستدعي مالك معتمد.)
4. الإيقاف: نفس الأمر مع `'suspended'`. الحذف الكامل لمشارك (طلب حذف، Q7): احذفه من Authentication → Users؛ يُحذف ملفه وكل أحداثه تلقائيًا (مُختبَر).

## 6. ربط الموقع (متغيران عامان فقط)

في GitHub: Settings → Secrets and variables → Actions → **Variables** → New repository variable:

| الاسم | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<مرجع-المشروع>.supabase.co` (من Project Settings / Connect) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (041b) | `sb_publishable_…` (من Supabase: Connect ← API Keys) |

كلاهما **متغير** لا سر. **لا تضع أبدًا `sb_secret_…` هناك:** البناء يفشل عمدًا إن وُجد (`scripts/pages/headers.mjs`)، لأن كل ما يبدأ بـ`NEXT_PUBLIC_` يُرسل لمتصفح كل زائر. بدون المتغيرين معًا تبقى الحسابات **مطفأة**: لا رابط في الترويسة ولا طلبات إلى Supabase. أثر العنوان في الترويسات: إضافة هذا الأصل وحده إلى `connect-src` (`scripts/pages/finalize-headers.mjs`).

## 7. مراجعة حماية المعاينة (Cloudflare Access)

إن بقيت المعاينة خلف قائمة بريد Cloudflare Access (ADR-0002، DEPLOYMENT §3) فالمشاركون لن يصلوا إلى الموقع إلا بإدراجهم. **حد المستخدمين في الباقة المجانية لم يُقرأ** (وثائق Cloudflare محجوبة في جلسة RAD-040). قرارك قبل الإطلاق: إزالة Access عن الموقع المنشور (الاعتماد على الموافقة اليدوية للحسابات) أو إبقاؤه.

## 8. النسخ الاحتياطي اليدوي واختبار الاستعادة (من لابتوبك)

الباقة المجانية: «Automatic backups: Not included in free». المطلوب نسخة منطقية بأدوات Supabase (صفحة backup-restore، قرأتها بتاريخ 2026-10-15):

1. ثبّت **Supabase CLI** و**Docker Desktop**.
2. من المشروع: **Connect** → انسخ سلسلة **Session pooler** واستبدل `[YOUR-PASSWORD]` بكلمة سر قاعدة البيانات (Database Settings إن نسيتها).
3. نفّذ:
   ```
   supabase db dump --db-url [CONNECTION_STRING] -f roles.sql --role-only
   supabase db dump --db-url [CONNECTION_STRING] -f schema.sql
   supabase db dump --db-url [CONNECTION_STRING] -f data.sql --use-copy --data-only
   ```
4. خزّن الملفات الثلاثة خارج GitHub في مكان مشفّر؛ تحوي بيانات المشاركين.
5. **اختبار الاستعادة قبل أول مشارك** (معيار الخطة §7): أنشئ مشروع Free ثانيًا ثم:
   ```
   psql --single-transaction --variable ON_ERROR_STOP=1 \
     --file roles.sql --file schema.sql \
     --command 'SET session_replication_role = replica' \
     --file data.sql --dbname [CONNECTION_STRING_OF_NEW_PROJECT]
   ```
   ثم تحقق أن `profiles` و`events` ظاهران بصفوفهما.
6. **سؤال مفتوح مهم:** هل تشمل هذه النسخة جدول المستخدمين `auth.users` (بريد وكلمات مرور مجزّأة)؟ **لم أتحقق من ذلك في الوثائق.** إن لم تشمله فالمستخدمون لا يُستعادون ويُعاد تسجيلهم. تحقق في اختبار الاستعادة: افتح `auth.users` في المشروع الثاني. سجّل النتيجة في DECISIONS.
7. المشروع يتوقف بعد أسبوع خمول (مقبول، S-PILOT-4): خذ نسخة قبل أي توقف طويل ثم أعد التشغيل يدويًا من اللوحة.

## 9. فحوص يدوية على المشروع الحي (قبل أول مشارك)

اختبارات `src/features/pilot-db` تُثبت السياسات على Postgres حقيقي لكن بمحاكاة أدوار Supabase. كرّر على المشروع الحي بحسابين تجريبيين (لا بيانات حقيقية) بعد اكتمال 041b:

| الفحص | المتوقع |
|---|---|
| طلب `/rest/v1/profiles` بالمفتاح العام دون تسجيل دخول | مرفوض (permission denied) |
| حساب جديد بعد تأكيد بريده | ملفه `pending` ولا يكتب أحداثًا |
| بعد موافقتك | يكتب حدثًا باسمه فقط |
| محاولة كتابة حدث بمعرّف مشارك آخر | مرفوض |
| مشارك يطلب صف مشارك آخر | لا شيء يُعاد |
| حساب موقوف | يقرأ ملفه فقط ولا يكتب |
| الاستعادة من نسخة | ناجحة (§8) |

## 10. ما لم يُثبت هنا

لم يُجرَّب أي تدفق على مشروع حي. لا يثبت هذا الدليل أن إعدادات لوحة Supabase بهذه الأسماء بعينها، ولا أن بيانات `auth.users` تدخل في النسخة المنطقية، ولا وجود خيار «Write audit logs to the database» على الباقة المجانية (يُجرَّب في 041b).
