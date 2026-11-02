# RAD-059 — البديل داخل التطبيق، 2026-11-02

## 1. الانحرافات والميزانية

Verified — تنفيذ خيار C الخامل في Draft #207 نفسها، على `rad059/emergency-alternate`؛ 27 ملفًا من سقف 28. لا فرع إضافي أو force push أو ready/merge.
Verified — أول commit في الاستكمال وثائق فقط: القرارات 12–14 حرفيًا وإغلاق 5 ب بالدليل الجديد. أول commit في PR حفظ القرارات 1–11 وإغلاق RAD-085 P1/P5 وتصحيح بروفة P5v2.
الاستثناء المحدد للحراس: توقع مدخل deferred المسمى في ثلاثة ملفات، بإذن المالك؛ لا تغيير بقية التأكيدات أو SQL/الحزم القائمة أو تبعيات المشروع. أدوات المتصفح المؤقتة في `/tmp` فقط.
قائمة الملفات الدقيقة:

- `docs/DECISIONS.md`، `docs/project-status.md`، `docs/HANDOFF.md`.
- `docs/RAD-059_PHONE_RUNBOOK.md`، `docs/RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md`، هذا التقرير.
- `supabase/migrations/20261102000200_rad059_emergency_alternate.sql`.
- `supabase/checks/rad059-alternate-ready.sql`، `supabase/checks/rad059-backlog-health.sql`.
- `scripts/pages/frontend-schema.json`.
- `src/features/pilot/OwnerPanel.tsx`، `src/features/pilot/SessionGate.tsx`.
- `src/features/emergency/availability.ts`، `contracts.ts`، `browser-adapter.ts`، `controller.ts`، `EmergencySession.tsx`، `EmergencyView.tsx`، `emergency.test.ts`، `browser.test.ts`.
- `src/features/assess/rad059-alternate.test.ts`، `src/features/assess/rad059-backlog-health.test.ts`، `src/features/assess/rad062-name.test.ts`.
- `src/features/deployment/frontend-manifest.test.ts`، `src/features/assess/manual-grading-availability.test.ts`، `messages/en.json`، `messages/ar.json`.

## 2. المنجز والمستبعد

Verified — [الترحيل](../supabase/migrations/20261102000200_rad059_emergency_alternate.sql) ذري: أساس M09 الكامل، جرد D3، البوابة المغلقة و NOLOGIN وصلاحيات postgres قبل أي إنشاء. مخطط emergency خاص و RPC عامة محددة؛ لا تغيير جسم دالة قائمة أو إعداد دور/قاعدة/PostgREST.
Verified — بديل واحد؛ set/remove/read للمالك المعتمد فقط، وهدف معتمد غير معطل أو معلق الحذف. الهوية من auth.uid وحده. التعيين لا يضيف دورًا أو عضوية أو صلاحية منتج أخرى.
Verified — start/phase/receipt: ست مراحل مرتبة ومستقلة، إيصال لكل مرحلة، وتفويض/نسخة تعيين بعد انتظار الأقفال. قفل profiles ثم singleton ثم operation ثم قفل المرحلة؛ الإزالة تبطل كل استدعاء لاحق، بما فيه إعادة إيصال نجاح قديم.
Verified — المراحل: gate=false، NOLOGIN لـ a ثم b الموجودة، إنهاء session_user للعاملين فقط، freeze_v2 القائمة، ثم تحقق مجمع. غياب b معلومة؛ لا إنشاء أدوار أو فتح/LOGIN/recover/worker/secret/تصحيح/D3 من هذه الواجهة.
Verified — request timeout القائم للمستخدم المسجل، 8 ث افتراضيًا؛ lock_timeout=2s على الدوال. QUERY_CANCELED لا تُلتقط داخل الطلب؛ يحتفظ COMMIT السابق بأثره، وتعرض الواجهة UNKNOWN ثم تقرأ الإيصال قبل متابعة المراحل غير المكتملة فقط.
Verified — audit محمي: فاعل/فعل/وقت/نسخة/عملية و booleans فقط. مسار C2/D3 القائم يضع actor=NULL ويبقي الحدث، دون tombstone. تنظيف خاص لمشغل SQL بعد إعلان نهاية التجربة، ضمن مهلة الستة أشهر، بلا execute لأدوار API.
Verified — لوحة المالك: اختيار حساب واحد من دليل معتمد محدود، هوية تحت Details مطوية، إزالة بمنطقة خطر وتأكيد، وقائمة audit مؤرخة ومقسمة. البديل يرى تأكيدًا واحدًا للإيقاف وحالات المراحل و«متابعة الإيقاف»؛ لا استعادة خدمة أو Undo.
Verified — الإتاحة literal=false خلف حارس مضبوط، و adapter محمل ديناميكيًا؛ الواجهتان مخفيتان تمامًا قبل الترقية. إعادة تحميل الصفحة تسترد العملية غير المكتملة من الخادم عند بدء إيقاف مؤكد جديد، دون تخزين محلي للهوية أو الأجوبة.
Not run (later owner window) — أي تعيين/إيقاف/SQL حي أو تغيير GCP/Supabase/Variables؛ [دليل اللابتوب](RAD-059_ALTERNATE_LAPTOP_RUNBOOK.md) يحدد apply→verify→محاولة الاعتماد القديم الواحدة بعد≥120 ث→PR ترقية منفصلة.

## 3. حالة المهام

RAD-059 تبقى review/owner؛ done_when بمعناها ثابتة: القنوات/ACK + البديل + إبطال الاعتماد بشواهد. تطبيق هذه PR أو دمجها لا يغلقها.
Verified (إفادة المالك) — RAD-062 5 ب مغلقة: #206 مدموجة و CI بأربع وظائف و Deploy خضراء على main؛ الهاتف 2026-11-02: المدخل ظاهر للمالك، رسالة القائمة الفارغة والتخطيط سليمان. المهمة مفتوحة لإفصاح موافقة P2 وبقية شروط الإطلاق.
Verified (إفادة المالك) — RAD-085 P1/P5 مغلقتان كما في القرار؛ بقية الحقوق/D3 والأمن والخصوصية مفتوحة. بروفة P5v2 للهاتف مثبتة 2026-11-01، وبند#205 المغلق لا يُعاد فتحه؛ خطر اللابتوب الواحد مقبول.

## 4. المشتركات و Scale والحراسة

Verified — requiredMigrations/checks و contract/version لم تتغير. marker قبل/بعد:
`pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`.
Verified — بصمة OwnerPanel: `af817f0c4b38d9da149b2af32db88069f4930d43bf721ef493bb469a10476a57` → `c302104f4ce9d9213d312c197a0c470fd78e0b0512bfa5be1d2b2a3639d78e55`.
Verified — manifest تغير فقط في deferredMigrations للترحيل الجديد، guardedFeatures.emergencyAlternate، وبصمة browserBoundaries.OwnerPanel بسبب ربط القسم. adapter الجديد تحت boundaries المحروسة؛ شاهد PostgreSQL الخاص هو serverModules للترحيل المؤجل ولا يصل للمتصفح.
Verified — `src/features/assess/rad062-name.test.ts:36` و`src/features/deployment/frontend-manifest.test.ts:42`: استبدال `{}` بالمدخل الحرفي الدقيق للترحيل، SHA/reason/serverModules. بقيت كل تأكيدات required/checks/marker والحراس الأخرى حرفية؛ scripts/docs لم تتغير.
Verified — `src/features/assess/manual-grading-availability.test.ts:8` استثناء إضافي صريح: لا تغيير في أي بايت آخر من الملف، ولا أي ملف manual-grading آخر. الفرق الحرفي:

```diff
- expect(schema.deferredMigrations).toEqual({});
+ expect(schema.deferredMigrations).toEqual({"20261102000200_rad059_emergency_alternate.sql":{"sha256":"efd5a5e61e93beef66354c016f619f17ed0acb59ad52eada7b374ebba0068c1e","reason":"RAD-059 dormant until a later owner apply window and separate promotion; request phases use the existing authenticated timeout.","serverModules":["src/features/assess/rad059-alternate.test.ts"]}});
```

Verified — SHA256 للترحيل: `efd5a5e61e93beef66354c016f619f17ed0acb59ad52eada7b374ebba0068c1e`؛ [successor](../supabase/checks/rad059-alternate-ready.sql) يثبت الكتالوج و ACL/RLS والملكية والقيود، ويعيد فحص M09 دون تعديل القديم.
حدود السعة: صفحة audit≤100 والواجهة 20؛ عملية غير مكتملة واحدة لكل actor/revision. في وضع STOPPED السليم، طلبات metadata المكررة خلال 30 ث تعيد الإيصال؛ أي حقيقة غير آمنة تسمح بإيقاف جديد فورًا. لا quota تمنع احتواء حادث.
المسح المجمع و freeze/terminate قد يتجاوزان مهلة الطلب مع الحجم/الأقفال: تبقى النتيجة PARTIAL/UNKNOWN، والرفع يتطلب قياسًا وتصميمًا مراجعًا؛ لا قص بيانات أو زيادة إعدادات. حذف audit ضمن 6 أشهر التزام تشغيل موثق، لا خدمة مجدولة جديدة.
هل تغير حكم بالاختصار؟ لا؛ عقد المهلات الجديد قرار صريح في 12، لا ادعاء أن function SET يفرض statement timeout. هل بقي رابط الأصل؟ نعم: [متطلبات C §4](RAD-085_OPEN_REVIEWS_2026-11-02.md#4-المتطلبات-المشتركة-وscale--البديلc-فقط)، [v2](../supabase/manual/assess-emergency-stop-v2.sql)، [P10](archive/reports/2026-10/RAD-062_P10_REPORT_2026-10-30.md#db-day-2026-11-01).

## 5. الطب والدرجات

Verified — لا طب أو حساب درجات أو امتحانات/goldens أو محتوى بيانات تغير. سلوك وملفات manual-grading/ManualGrading و 5 ب ثابتة مقابل main، عدا سطر 8 المأذون في اختبارالإتاحة وحده. لا تغيير Terms أو CONSENT_VERSION؛ إفصاح P2 يظل شرط فتح مستقلًا.

## 6. QA وحدود الإثبات

Verified — PostgreSQL المضمّن:13 حالة للترحيل/الأساس الذري والكتالوج، التعيين/الإزالة، owner/alternate/other/anon، تعليق/حذف الحساب، فقد ردالمرحلة 1، إعادة التشغيل الآمنة، ومنع الصلاحيات الأخرى و ACL/search_path.
Verified — انتظار قفل داخل RPC انتهى عند 2 ث بإعداد function-level lock_timeout. المرحلة 5 البطيئة أُلغيت عند 8 ث المأخوذة من rolconfig قبل SELECT؛ المراحل 1–4 مثبتة و receipt=PARTIAL، ثم استكمال 5/6 فقط إلى STOPPED. آخر تشغيل مركز بعد تثبيت UTC:30 ناجحًا و 13 فشل setup للصورةالمفقودة، دون فشل assertion بعد نجاح setup.
Verified — شاهدَا سباق الإزالة أعطيا ترتيبًا حتميًا، وإنهاء العامل بعد SET ROLE أبقى الاتصال غير المستهدف؛ ومحو C2/D3 أبقى الحدث بفاعل NULL، وتنظيف نهاية التجربة حذف الأثر. الاختبارات اصطناعية وليست إثبات مزوّد حي.
Not run (env) — نمط Supabase17.11/ICU في جميع الشواهد: `No such image: supabase/postgres:17.11.0.016@sha256:6ce438c186e9f0a0aad707c2151cc0023e26bb7afd57e20080fdcd2bd76ba57d`؛ الاختبارات موجودة وتفشل setup دون skip أو تخفيف.
Verified —17 اختبارًا مركّزًا للواجهة/النقل/الخمول و EN/AR والحراس ناجحة؛ لا raw error أو هوية في العرض الرئيسي. يُفحص الإيصال بعد UNKNOWN، ولا تتكرر المراحل المكتملة، وتُمسح الحالة عند رفض التفويض أو الخروج.
Verified — Chromium/axe:32 حالة لمكونات فعلية بنقل ودليل اصطناعيين و CSS البناء؛ EN/AR×390/1440، 0overflow/violations/page errors. تشمل التأكيد، UNKNOWN بعد 1،المتابعة، STOPPED،والاختيار/التعيين/إزالةمؤكدة؛ ليست قبول هاتف حي.
Verified — `npm run build` و`npm run build:pages` ناجحان؛ تحذير Pages: `NEXT_PUBLIC_SUPABASE_URL not set; CSP unchanged (connect-src 'self')`؛ ليس دليل نشر/اتصالحي.
Verified — شُغل check كاملًا: typecheck/lint ناجحان بتحذيرين سابقين؛ 3348 اختبارًا ناجحًا و 79 فشلًا، منها 78 setup للصورة المفقودة وواحد لحارس 5 ب الجديد. بعد إذن سطر 8 نجح الحارس مع الاختبارات المركزة؛ بعد ذلك أُضيف شاهد تصنيف psql وتثبيت UTC وأُعيدت اختبارات التغيير والحراس فقط؛ لم يُعد التشغيل الكامل، ولا ادعاء check خضراء.
Not run (env) — بعض إثباتات docs:test: أُطلق الأمر وفشل إعدادها بـ`Required tool unavailable: psql (install the PostgreSQL client packages)` و`spawnSync age-keygen ENOENT`؛ ليست نتيجة خضراء.
Verified — docs:check و status:check --require-previous و git diff --check ناجحة؛ docs:sync مرتان والثانية صفر تغيير. ملفات SQL القائمة والحزمتان باقية byte-identical؛ لم يُشغّل qa:golden أو qa:characterise.

Verified — الدوال الجديدة تثبت UTC كما تفعل حزمة v2؛ اختبار طلب بمنطقة America/New_York وتسليم يعبر تبدّل DST أثبت أن retry_at يبقى بعد 168 ساعة بالضبط، مع بقاء دوال Assess الأصلية ثابتة. أُعيد اشتقاق كتالوجالدوال الجديدة فقط من تطبيق محلي نظيف.

## 7. المفتوح

إعادة كل الفحوص المحجوبة على صورة PG17.11 المثبتة ورأس PR النهائي ومراجعة الصلاحيات والمحو والكتالوج قبل نافذة المالك؛ لا إطلاق من build/CI وحدهما. في PR الترقية اللاحقة يعود سطر 8 في manual-grading-availability.test.ts إلى `toEqual({})` عند نقل الترحيل إلى requiredMigrations؛ وتُحدّث توقعات الحارسين الآخرين مع الترقية.
Not run (later owner window) — فحص rolconfig للدور authenticated: موجود و>0 و≤8 ثوانٍ؛ وإلا STOP دون تغيير إعداد. ثم النسخة والبروفة والتطبيق والتحقق المستقل ورفض القديم؛ غيابه محليًا = Not run، وقبوله = FAILED واحتواء فوري.
Not run (owner evidence) — TEST لكل إشارة ومستجيب، ACK البشري، بروفة البديل والغياب، وخطوات Pause/Cancel/Disable بيد المالك. SQL وحده لا يثبت وقف تكلفة GCP أو رفض cache.

## 8. قرارات المالك والمتابعة

القائمة المعتمدة محفوظة حرفيًا: [1–11](DECISIONS.md#rad059-alternate-owner-2026-11-02) و[12–14](DECISIONS.md#rad059-implementation-owner-2026-11-02)، مع [إذن الحراس واتجاه المراحل](DECISIONS.md#rad059-protocol-review-owner-2026-11-02). لا إعادة قرار النسخ الاحتياطي أو بروفة P5v2 المثبتة.
المالك لاحقًا: ينفذ قائمة القنوات و ACK والغياب، ويحجز نافذة اللابتوب بعد المراجعة و QA، ويثبت الإبطال بالمحاولة الواحدة، ثم PR ترقية منفصلة بالماركر المراجع، ثم بروفة البديل الحي وقبول الأدلة. يسجل إعلان نهاية التجربة وموعد تنظيف audit ضمن ستة أشهر في السجل المشفر.
تبقى البوابة مغلقة والعامل NOLOGIN والسر DISABLED؛ RAD-059 مفتوحة، و P2 وبقية شروط الإطلاق مستقلة.
