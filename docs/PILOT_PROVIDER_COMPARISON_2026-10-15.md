# مقارنة مزوّدي الهوية وقاعدة البيانات للإطلاق التجريبي (RAD-040) — 2026-10-15

**النوع:** DOCS. **الحالة:** للمراجعة؛ لا حسابات ولا مفاتيح ولا كود. **تاريخ قراءة كل الصفحات أدناه:** 2026-10-15 (الأسعار والحدود تتغير: لا تُعمَّم بعد هذا التاريخ).
**المصدر الوحيد للأجوبة:** صفحات الوثائق الرسمية للمزوّد. ما لم يُقرأ مكتوب «لم يُقرأ». ما كتبته من عندي (استنتاج لا اقتباس) موسوم «استنتاج».
**القائمة المرجعية:** [`PILOT_PROVIDER_VERIFICATION_CHECKLIST.md`](PILOT_PROVIDER_VERIFICATION_CHECKLIST.md) (A1–E2). **الخطة:** [`PILOT_PLATFORM_PLAN.md`](PILOT_PLATFORM_PLAN.md).

## 1. المدخلات والقيود

| البند | القيمة |
|---|---|
| قرارات المالك (2026-10-15) | بلد المشاركين: **الأردن**؛ لا قيد جامعي أو نظامي حاليًا؛ ميزانية الإطلاق التجريبي: **مجانية**. قبول S-PILOT-2: **لم يُجب عنه بعد** (يبقى كل ما يلي مشروطًا به) |
| الحجم | 20–100 مشارك (S-PILOT-1) |
| ما لم أتحقق منه | القانون الأردني لحماية البيانات: لم أقرأ مصدرًا رسميًا عنه؛ «لا قيد» هنا إفادة المالك لا استنتاجي |

**الوصول إلى الشبكة (curl -I في هذه الجلسة):** `supabase.com` و`firebase.google.com` و`cloud.google.com` و`neon.com` تعمل (supabase.com فشل مرة واحدة بـ reset ثم عمل). **محجوبة (403 على CONNECT):** `developers.cloudflare.com` و`www.cloudflare.com` و`www.supabase.com` و`docs.supabase.com` و`neon.tech`؛ وتحويلة سياسة Neon إلى `databricks.com` محجوبة أيضًا. لم أعوّض عنها بتخمين: **مرشّح Cloudflare Access + D1 لم يُقيَّم أبدًا** (كل خاناته «لم يُقرأ»)، وسياسة خصوصية Neon لم تُقرأ.

## 2. جدول المقارنة (مرشّح × سؤال)

الرموز: ✅ يحقق معيار القائمة · ⚠️ يحققه بشرط/قيد (مكتوب) · ❌ لا يحققه · ❔ لم يُقرأ. التقييم على **الباقة المجانية** لأن الميزانية مجانية؛ ما يتطلب باقة مدفوعة يظهر ⚠️/❌ مع ذكر ذلك.

| # | السؤال | Supabase (Free) | Neon (Free) + Neon Auth | Firebase (Spark / Identity Platform) | Cloudflare Access + D1 |
|---|---|---|---|---|---|
| A1 | تعطيل التسجيل العام | ✅ «Allow new users to sign up» قابل للإطفاء | ❔ لا خيار موثّق في صفحات Auth المقروءة؛ الصفحة تقول «anyone can sign up» | ✅ «disable user actions» | ❔ |
| A2 | دعوة بالبريد؛ المدعو يضع كلمته | ⚠️ `inviteUserByEmail` موجود؛ كون المدعو يضع كلمة المرور بنفسه **لم يُقرأ** | ❌ `admin.createUser` يتطلب `password` من المنشئ؛ لا دعوة فردية موثّقة | ⚠️ إنشاء مستخدم + `generatePasswordResetLink` بـ Admin SDK (يلزم خادم)؛ وصفة الدعوة غير مقروءة | ❔ |
| A3 | تأكيد البريد | ✅ «Confirm Email» | ⚠️ غير مفعّل افتراضيًا؛ الروابط تحتاج مزوّد بريد خاص | ⚠️ رابط تأكيد بـ Admin SDK؛ كونه إلزاميًا للدخول **لم يُقرأ** | ❔ |
| A4 | سياسة كلمة المرور | ⚠️ حد أدنى وفئات أحرف؛ **فحص التسريب: Pro فقط** | ❔ لم يُقرأ (سقف 128 حرفًا فقط) | ⚠️ سياسة (6–30، فئات)؛ فحص التسريب لم يُقرأ | ❔ |
| A5 | حماية من التخمين | ⚠️ تحديد معدل لكل نقطة؛ قفل الحساب لم يُقرأ؛ CAPTCHA مدعوم | ❔ | ❔ (reCAPTCHA مذكور للتطبيق؛ قفل لم يُقرأ) | ❔ |
| A6 | تحقق بخطوتين للمالك | ✅ «Basic Multi-Factor Auth: Included in free»؛ صفحة MFA تذكر «App Authenticator (TOTP)» (ربط «Basic» بـTOTP استنتاج) | ❌ «MFA support: Coming soon» | ⚠️ يتطلب الترقية إلى Identity Platform؛ SMS مدفوع؛ TOTP/الباقة لم تُقرأ | ❔ |
| A7 | سجل الدخول | ⚠️ سجل تدقيق Auth؛ **احتفاظ ساعة واحدة في Free** | ⚠️ Webhooks لأحداث Auth (قائمة محدودة)؛ سجل دخول لم يُقرأ | ⚠️ سجلات التدقيق موجودة؛ Data Access تُفعَّل يدويًا؛ مدة الاحتفاظ لم تُقرأ | ❔ |
| A8 | استعادة كلمة المرور | ✅ `resetPasswordForEmail` | ✅ Password reset بالرابط | ⚠️ رابط بـ Admin SDK؛ مسار المستخدم لم يُقرأ | ❔ |
| B1 | RLS | ✅ موثّق صراحة | ✅ RLS Postgres + Data API | ❌ لا RLS؛ Firestore Security Rules بدلها | ❔ |
| B2 | مفتاح عام لا يتجاوز RLS | ✅ publishable مقابل secret | ⚠️ JWT للـ Data API؛ تفصيل المفاتيح لم يُقرأ | ⚠️ مفاتيح الويب لم تُقرأ؛ المكتبات الخادمية تتجاوز القواعد | ❔ |
| B3 | معاملات وقيود علائقية | ✅ Postgres | ✅ Postgres | ❌ «NoSQL cloud database» | ❔ |
| C1 | مناطق التخزين | ⚠️ لا منطقة في الشرق الأوسط؛ الأقرب: فرانكفورت وغيرها | ⚠️ فرانكفورت ولندن وغيرها؛ لا شرق أوسط | ✅ Doha وDammam وTel Aviv وFrankfurt…؛ **لا تتغير بعد الإنشاء** | ❔ |
| C2 | الخصوصية والمعالجة | ⚠️ DPA مقروء؛ سياسة الخصوصية لم تُقرأ | ❔ سياسة الخصوصية لم تُقرأ (محجوبة)؛ صفحة الأمان تذكر SOC2/ISO/GDPR | ⚠️ Google «data processor»؛ شروط المعالجة مرتبطة | ❔ |
| C3 | نسخ احتياطي واستعادة | ❌ **«Automatic backups: Not included in free»**؛ نسخ منطقي يدوي بـ CLI | ⚠️ نافذة تاريخ **6 ساعات** في Free | ❌ الجدولة تتطلب Blaze (دفع) | ❔ |
| D1 | الباقة المجانية | ⚠️ 50K MAU، 500 MB، **إيقاف بعد أسبوع خمول**، مشروعان نشطان | ✅ بلا مدة، 1 GB/مشروع، Auth حتى 60K MAU؛ توقف الحساب 5 دقائق (cold start) | ✅ Spark بلا دفع؛ Auth حتى 50K MAU (Identity Platform)؛ حصص Firestore يومية | ❔ |
| D2 | أقل باقة تناسب 100 | ✅ Free كافية حجمًا؛ Pro **25$** تضيف نسخًا وتسريبًا وجلسات | ✅ Free كافية حجمًا | ✅ Free كافية حجمًا؛ النسخ تتطلب Blaze | ❔ |
| D3 | الخروج من المزوّد | ✅ `supabase db dump`؛ DPA 11.2: نسخة خلال 30 يومًا | ❔ لم يُقرأ (صفحة الترحيل لم تُجلب) | ❔ | ❔ |
| E1 | الطلبات من الواجهة الثابتة | ⚠️ نطاق المشروع؛ تمرير عبر نطاقنا = Custom Domain إضافة مدفوعة | ❌ «Standalone frontend + backend: Coming soon» (جلسات بكوكيز) | ❔ | ❔ |
| E2 | المراقبة | ⚠️ سجلات؛ احتفاظ يوم واحد في Free | ⚠️ لوحة مراقبة وتصدير إلى Datadog (بتفاصيل الباقة غير مقروءة) | ❔ | ❔ |

## 3. سجل الأدلة (رابط · تاريخ القراءة 2026-10-15 · اقتباس)

### 3.1 Supabase

| السؤال | الصفحة | الاقتباس |
|---|---|---|
| A1، A3 | https://supabase.com/docs/guides/auth/general-configuration | «Allow new users to sign up: Users will be able to sign up. If this config is disabled, only existing users can sign in.» · «Confirm Email: Users will need to confirm their email address before signing in for the first time.» |
| A2 | https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail | «Sends an invite link to an email address.» (الصفحة لا تذكر انتهاء الرابط ولا من يضع كلمة المرور → **لم يُقرأ**) |
| A2 (قالب) | https://supabase.com/docs/guides/auth/auth-email-templates | قالب «Invite user»؛ مثال نصه «You've been invited to create an account. Follow the link below to accept.» |
| A4 | https://supabase.com/docs/guides/auth/password-security | «Set a large minimum password length. Anything less than 8 characters is not recommended.» · «Leaked password protection is available on the Pro Plan and above.» |
| A4، D2 | https://supabase.com/pricing | «Leaked password protection · Not included in free» · «Single session per user · Not included in free» · «Session timeouts · Not included in free» |
| A5 | https://supabase.com/docs/guides/auth/rate-limits | «Defaults to 30 requests per 5 minutes, with bursts up to 30 requests.» (الدخول/التسجيل) · «2 emails per hour with the built-in email provider.» |
| A5 | https://supabase.com/docs/guides/auth/auth-captcha | «Supabase authentication has support for hCaptcha and Cloudflare Turnstile.» |
| A6 | https://supabase.com/docs/guides/auth/auth-mfa + https://supabase.com/pricing | «App Authenticator (TOTP)» · «Basic Multi-Factor Auth · Included in free» · «Advanced Multi-Factor Auth - Phone · Not included in free» |
| A7 | https://supabase.com/docs/guides/auth/audit-logs + pricing | «Audit logs are automatically captured for all authentication events» · «Auth Audit Logs · 1 hour» (عمود Free) · الصفحة موسومة (BETA) في قائمة الإعدادات |
| A8 | https://supabase.com/docs/guides/auth/passwords | «To prevent user enumeration, resetPasswordForEmail() doesn't reveal whether an account exists for the given email address.» |
| البريد (حاسم) | https://supabase.com/docs/guides/auth/auth-smtp | «This server imposes a few important restrictions and is not meant for production use.» · «Send messages only to pre-authorized addresses.» (أعضاء المؤسسة فقط) |
| الجلسات (Q2) | https://supabase.com/docs/guides/auth/sessions | «refresh tokens never expire but can only be used once» · «This feature is only available on Pro Plans and up.» (انتهاء الجلسة بمهلة/خمول) |
| B1 | https://supabase.com/docs/guides/database/postgres/row-level-security | «Enable RLS on every table in an exposed schema.» · «service_role … Full access. It bypasses RLS, so keep it server-side» |
| B2 | https://supabase.com/docs/guides/getting-started/api-keys | «Publishable key … Anyone can read it, so it only reaches what Row Level Security allows» · «Secret key … It bypasses Row Level Security, so it must never leave your control» |
| C1 | https://supabase.com/docs/guides/platform/regions | «Each Supabase project is deployed to one primary region.» · القائمة: Frankfurt `eu-central-1`، Stockholm، Paris، London، Zurich، Mumbai، Singapore… (لا شرق أوسط) · «General regions deploy to an available AWS region within that broader area» |
| C2 | https://supabase.com/legal/customer-resources/data-processing-addendum | «Supabase may Process Covered Data anywhere that Supabase or its Sub-processors maintain facilities» · 11.2: نسخة من البيانات «within thirty (30) days of expiry of the Agreement» |
| C2 | https://supabase.com/pricing | «User data ownership · Included in free» (بند ميزات، لا شرط قانوني) |
| C3 | https://supabase.com/pricing | «Automatic backups · Not included in free» · «Point in time recovery · Not included in free» |
| C3 | https://supabase.com/docs/guides/platform/backups | «Pro Plan projects can access the last 7 days of daily backups.» · «To generate a logical backup yourself, use the Supabase CLI db dump command.» |
| D1 | https://supabase.com/pricing | «50,000 monthly active users · 500 MB database size» · «Free projects are paused after 1 week of inactivity. Limit of 2 active projects.» |
| D1 | https://supabase.com/docs/guides/platform/billing-faq | «You are entitled to two active free projects.» · «No, we do not charge for paused projects.» |
| D2 | https://supabase.com/pricing | Pro «$25» · «Daily backups stored for 7 days» · «7-day log retention» |
| D3 | https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore | `supabase db dump --db-url [CONNECTION_STRING] -f data.sql --use-copy --data-only` |
| E1 | https://supabase.com/docs/guides/platform/custom-domains | «These are available as a paid add-on for projects on a paid plan.» |
| E2 | https://supabase.com/docs/guides/observability/logs + pricing | «Retention depends on your pricing plan.» · «Log retention (API & Database) · 1 day» (Free) · «Log Drain · Not included in free» |
| لم يُقرأ | — | `supabase.com/security` وصفحة الخصوصية: جُلبتا ولم تُستخرج منهما أجوبة؛ انتهاء رابط الدعوة وقفل الحساب بعد فشل متكرر وتغيير المنطقة بعد الإنشاء: **لم يُقرأ** |

### 3.2 Neon (+ Managed Better Auth)

| السؤال | الصفحة | الاقتباس |
|---|---|---|
| الهوية | https://neon.com/docs/auth/about | «Managed Better Auth is the managed authentication service in the Neon backend … It stores users, sessions, and auth configuration directly in your Neon database.» |
| A1 | https://neon.com/docs/auth/production-checklist | «Since anyone can sign up for your application, enabling email verification adds an important verification step» (لا خيار تعطيل تسجيل موثّق في الصفحات المقروءة) |
| A2 | https://neon.com/docs/auth/guides/plugins/admin | `authClient.admin.createUser({ email, password, name … })` — حقل `password` مطلوب (✓ في الجدول) |
| A3 | https://neon.com/docs/auth/guides/email-verification | «Verification links require a custom email provider.» · «Email verification is not enabled by default.» (production-checklist) |
| A6، E1 | https://neon.com/docs/auth/roadmap | «MFA support · Coming soon» · «Architectures where frontend and backend are separate deployments … are not yet supported.» |
| A8 | https://neon.com/docs/auth/guides/password-reset | «Managed Better Auth supports password reset via verification links sent to the user's email address.» |
| A7 | https://neon.com/docs/auth/guides/webhooks | أحداث: `send.otp, send.magic_link, user.before_create, user.created, phone_number.verified, organization.invitation.created, organization.invitation.accepted` (لا حدث دخول مذكور) |
| B1 | https://neon.com/docs/guides/row-level-security | «When using the Data API for client-side querying, RLS policies are required to secure your data.» |
| C1 | https://neon.com/docs/introduction/regions | AWS: US East (Virginia/Ohio)، US West (Oregon)، **Frankfurt**، **London**، Singapore، Sydney، São Paulo؛ مناطق Azure مهجورة |
| C2 | https://neon.com/docs/security/security-overview | «aligned with SOC2, ISO27001, ISO27701 standards and GDPR and CCPA regulations» (تقييم ذاتي من المزوّد؛ سياسة الخصوصية **لم تُقرأ**، المضيف محجوب) |
| C3 | https://neon.com/docs/introduction/plans | «History window: 6 hours, up to 1 GB-month» (Free) · «Up to 7 days» (Launch) · «Up to 30 days» (Scale) |
| D1 | https://neon.com/pricing | «Build and learn free with no time limits and no credit card required.» · الخطة: «100 CU-hours/project, 1 GB Postgres storage per project (up to 20 GB total across all projects)» · «Auth · Up to 60k MAU» (Free) |
| D1 | https://neon.com/docs/introduction/scale-to-zero | «it automatically scales to zero after 5 minutes … For Neon Free plan users, this setting is fixed.» |
| E2 | https://neon.com/docs/introduction/monitoring + plans | «Metrics/logs export · Export metrics and Postgres logs to Datadog or any OTel-compatible platform.» (توفرها على Free لم يُقرأ) |
| لم يُقرأ | — | سياسة الخصوصية، DPA، صفحة Data API، التصدير/الترحيل، نص انتهاء الجلسات وقفل الحساب |

### 3.3 Firebase / Identity Platform

| السؤال | الصفحة | الاقتباس |
|---|---|---|
| A1 | https://firebase.google.com/docs/auth/users | «you can disable user actions from the Firebase Authentication Settings page, which prevents account creation and deletion by end-users.» |
| A2، A3، A8 | https://firebase.google.com/docs/auth/admin/email-action-links | دوال Admin SDK: `generatePasswordResetLink` و`generateEmailVerificationLink` و`generateSignInWithEmailLink` (الوصفة الكاملة للدعوة ليست في الصفحة) |
| A4 | https://cloud.google.com/identity-platform/docs/password-policy (يحوَّل إلى docs.cloud.google.com) | «Minimum password length (ranges from 6 to 30 characters; defaults to 6)» · وضعا التطبيق «Require» و«Notify» |
| A6 | https://cloud.google.com/identity-platform/docs/web/mfa | «Ensure your app is verifying user emails. MFA requires email verification.» · https://firebase.google.com/docs/auth/extend-with-blocking-functions: «To use blocking functions you must upgrade your Firebase project to Firebase Authentication with Identity Platform.» · تسعير: «Phone and multi-factor authentication users are charged per message sent.» |
| A7 | https://cloud.google.com/identity-platform/docs/audit-logging | قسم «Enable Data Access audit logs» (سجلات Data Access لا تعمل افتراضيًا؛ مدة الاحتفاظ لم تُقرأ) |
| B1 | https://firebase.google.com/docs/firestore/security/get-started | «The server client libraries bypass all Cloud Firestore Security Rules» |
| B3 | https://firebase.google.com/docs/auth | «Store and sync data using a scalable NoSQL cloud database with rich data models and queryability.» |
| C1 | https://firebase.google.com/docs/firestore/locations | الشرق الأوسط: `me-central1` Doha، `me-central2` Dammam، `me-west1` Tel Aviv؛ أوروبا: Frankfurt، Berlin، Paris… · «once you provision a database instance, you cannot change its location setting.» |
| C2 | https://firebase.google.com/support/privacy | «Firebase customers typically act as the "data controller" … operates as a "data processor"» (الصياغة: Google معالِج) |
| C3 | https://firebase.google.com/docs/firestore/backups | «This feature requires the Blaze pricing plan.» · «up to one daily backup schedule and up to one weekly» |
| D1 | https://firebase.google.com/pricing + https://cloud.google.com/identity-platform/pricing | «No-cost (Spark plan)» · «Monthly active users · No-cost up to 50K MAUs» · Firestore «No-cost up to 20K writes/day» |
| لم يُقرأ | — | قفل الحساب/التخمين، TOTP على أي باقة، مدة سجلات التدقيق، التصدير الكامل، النطاقات التي تتصل بها الواجهة، المراقبة |

### 3.4 Cloudflare Access + D1

**كل الخانات «لم يُقرأ».** المضيفان `developers.cloudflare.com` و`www.cloudflare.com` محجوبان في هذه الجلسة. ما يُقال عنه في الوثائق الداخلية (الخطة §4: «لا يدعم RLS»، ADR-0002: Zero Trust Access على المعاينة) **ليس قراءة لوثائق Cloudflare** ولا يُعامل هنا دليلًا. حدّ مستخدمي Access على الباقة المجانية ودعم الدخول بكلمة مرور يضعها المستخدم: **لم يُقرأ** ويؤثر في المعاينة نفسها إن كانت خلف Access (انظر §6).

## 4. التوصية

**الترشيح: Supabase على الباقة المجانية، منطقة `eu-central-1` (Frankfurt) المحددة، مشروط بقبول المالك لـ S-PILOT-2.**

**لماذا:** هو المرشّح الوحيد الذي طابق من الوثائق المقروءة بنود الأساس معًا: تعطيل التسجيل العام (A1)، تأكيد البريد (A3)، TOTP لحسابات المالك على Free (A6)، RLS صريحة (B1)، مفتاح عام لا يتجاوز RLS (B2)، Postgres علائقي يلائم المؤسسات لاحقًا (B3)، وتصدير بأدوات قياسية (D3)، وكل ذلك بـ$0.

**ما يكلّفه «المجاني» (يجب أن يعلمه المالك):**
1. **البريد:** الخادم المدمج يرسل فقط لعناوين أعضاء المؤسسة، فدعوة 20–100 مشارك خارجي **تتطلب SMTP مخصصًا** (الميزة مجانية عند Supabase، لكن خدمة إرسال بريد خارجية ملزمة؛ لم أقرأ شروط أي مزوّد بريد). هذه أكبر عقبة أمام «مجاني تمامًا» ويجب حلها قبل RAD-041.
2. **لا نسخ احتياطي تلقائي في Free:** معيار الخطة §6/§7 («استعادة ناجحة قبل أول مشارك») يتحقق يدويًا فقط: `supabase db dump` ثم استعادة إلى مشروع Free ثانٍ (الحد مشروعان نشطان).
3. **الإيقاف بعد أسبوع خمول:** مقبول إن كان هناك استخدام أسبوعي؛ يحتاج المالك لإعادة التشغيل بعد فترات توقف.
4. **غير متاح في Free:** فحص كلمات المرور المسرّبة، مهلة الجلسة/الخمول، جلسة واحدة لكل مستخدم، تسجيل التدقيق لأكثر من ساعة، سجلات أكثر من يوم. الترقية إلى Pro (25$/شهر) تضيفها، **وهذا خارج الميزانية الحالية**.
5. **سجل الدخول:** احتفاظ ساعة واحدة يعني أن «من دخل ومتى» يجب أن يأتي من جدول `events` الخاص بنا (الخطة §5) لا من سجل Supabase.

**البدائل:**
- **Firebase:** أفضل مناطق للأردن (Doha/Dammam) وSpark مجاني، لكنه غير علائقي وبلا RLS (B1/B3 ❌)، والدعوة بكلمة يضعها المستخدم تحتاج كود خادم (Admin SDK) وهو خارج الاستضافة الثابتة، والنسخ الاحتياطي يتطلب Blaze. يُعاد النظر فيه فقط إن قدّم المالك قيد إقامة بيانات في المنطقة أو رفض Postgres.
- **Neon + Neon Auth:** Postgres جيد وRLS، لكن هوية Neon تعارض شرطين: لا دعوة فردية ولا تعطيل تسجيل موثّقان (A1/A2)، ولا MFA بعد (A6)، والواجهة المنفصلة عن الخادم غير مدعومة (E1) وهو بالضبط موقعنا الثابت.
- **Cloudflare Access + D1:** غير مقيَّم (§3.4).

**أسباب الاستبعاد مختصرة:** Firebase للعلائقية/RLS · Neon للدعوة وMFA والواجهة المنفصلة · Cloudflare لانعدام القراءة (لا يُستبعد على الجوهر).

**ما يبقى غير مؤكد (يُحسم في RAD-041 قبل الكود أو عند المالك):**
1. هل يضع المدعو كلمة مرور بنفسه عبر `inviteUserByEmail`، ومدة انتهاء رابط الدعوة، وقفل الحساب بعد المحاولات الفاشلة (لم تُقرأ).
2. خدمة SMTP مجانية مناسبة (حدودها وشروطها).
3. تغيير المنطقة بعد إنشاء المشروع (لم يُقرأ؛ يُفترض ثابتة).
4. سياسة خصوصية Supabase وصفحة الأمان (جُلبتا ولم تُستخرج منهما أجوبة).
5. هل المعاينة خلف Cloudflare Access، وما حد المستخدمين على الباقة المجانية (لم يُقرأ؛ يتطلب فتح الشبكة).
6. القانون الأردني لحماية البيانات إن ظهر قيد لاحق.
7. شروط Google Forms/Tally إن اختير استبيان خارجي (لم تُقرأ).

## 5. حسم Q1–Q4 (مقترحات تُعتمد بدمج الـPR)

| # | الحسم المقترح | السند والمحاذير |
|---|---|---|
| Q1 منطقة التخزين | Supabase **Frankfurt `eu-central-1`** كمنطقة محددة (لا «Europe» العامة التي قد تُنشر في لندن/زيورخ). لا قيد جامعي/نظامي معلن (المالك)؛ أي قيد لاحق يغيّر القرار | regions: الإقامة تحددها المنطقة؛ لا توجد منطقة شرق أوسط في Supabase. أقرب مسافة جغرافيًا (استنتاج لا من الوثائق). تغيير المنطقة بعد الإنشاء لم يُقرأ → اعتبرها ثابتة |
| Q2 مدة الجلسة والاحتفاظ | **الجلسة:** على Free لا مهلة خمول ولا مدة قصوى من جهة الخادم (Pro فقط)، والتجديد لا ينتهي؛ لذا تُحَدّد مهلة خمول **في العميل** (مثلاً 7 أيام بلا نشاط ثم تسجيل خروج) وهي راحة لا حدّ أمني، مع زر «خروج» وعمر رمز وصول قصير. **الاحتفاظ:** 6 أشهر بعد انتهاء التجربة ثم الحذف (كما الخطة)، والتصدير/الحذف بطلب عبر المالك (Q7) | sessions: «refresh tokens never expire»؛ مهلة الجلسة Pro. سجل Supabase يحتفظ ساعة فقط → تعتمد «آخر نشاط» على `events` |
| Q3 الاستبيان | **نموذج خارجي** برمز المشارك كما اقتُرح، مع إفصاح في الموافقة؛ بديل مسجَّل: استبيان قصير داخل التطبيق في قاعدتنا (بلا طرف ثالث، لكنه كود إضافي) | شروط Google Forms/Tally **لم تُقرأ**؛ القرار للمالك. الرابط الخارجي تنقّل لا طلب `connect-src` |
| Q4 الطلبات الخارجية | **تعديل CSP وفحص `preview:smoke` وإفصاح الموافقة**، لا تمرير عبر نطاقنا. التعديل: `connect-src 'self' https://<مرجع-المشروع>.supabase.co` فقط، ويسمح الفحص بهذه الأصل **وحده** (أي أصل آخر يفشله)؛ ويُضاف عنوان إعادة التوجيه لنطاق الموقع إلى Redirect URLs | التمرير عبر نطاقنا يتطلب مكوّنًا خادميًا على Cloudflare (وثائقه لم تُقرأ) أو Custom Domain مدفوعًا عند Supabase. الحالي: `connect-src 'self'` في `public/_headers`، والفحص يفشل عند أي طلب غير نفس الأصل (`scripts/preview/smoke.mjs`) |

## 6. التعارضات مع الوثائق القائمة (لا تُعدَّل هنا؛ تُعدَّل في RAD-041)

1. **ADR-0002:** «no runtime third-party requests» وموقع بلا خلفية؛ الحل المقترح يضيف أصلًا واحدًا وهوية/بيانات خارجية. العبارة «Server features (auth, storage) will need a second deployment target» تتسق مع هذا الاتجاه.
2. **CLAUDE.md:** قاعدة «no auth, DB» وملاحظة Session 6 «no runtime third-party requests (`npm run preview:smoke` checks it)».
3. **`public/_headers`:** تعليق «no third-party requests» و`connect-src 'self'`، و`docs/DEPLOYMENT.md` إن ذكر الأمر.
4. **حماية المعاينة بـAccess:** إن بقيت المعاينة خلف قائمة بريد Cloudflare Access، فالمشاركون (20–100) يحتاجون إدراجهم فيها أو إزالتها؛ **حد الباقة المجانية لم يُقرأ**. قرار للمالك قبل الإطلاق.
5. **«المجاني» مقابل معايير الخطة:** §6 «نسخ احتياطي مع تجربة استعادة» والقائمة A4 (فحص التسريب) والجلسات لا تتحقق كاملة على Free (انظر §4).

## 7. ما لا تثبته هذه الوثيقة

لا تثبت جاهزية Supabase ولا أن تدفق الدعوة يطابق معيار A2 قبل تجربته عمليًا؛ لا تثبت امتثالًا قانونيًا أردنيًا؛ ولا تقيّم Cloudflare. الأسعار والحدود صحيحة بتاريخ القراءة فقط. لم يُنشأ أي حساب أو مفتاح أو مشروع، ولم يُقبل أي سعر أو شرط نيابة عن المالك.
