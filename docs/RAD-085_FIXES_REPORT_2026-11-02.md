# RAD-085 — إصلاحات الحقوق والأمن والإفصاح، 2026-11-02

## 1. الانحرافات والميزانية

Verified — فرع جديد من origin/main؛ هدف واحد R1/R2/S1/P2/P3، و30/30 ملفًا، دون subagents أو worktree. أول commit للإغلاق المعلق؛ دُمج تحديث main الذي يحمل #208 أثناء القياس دون تغيير SQL أو Practice؛ التنفيذ الجديد مؤجل.
Verified — لا تعديل لأي ملف قائم تحت supabase، ولا للحزمتين المحميتين؛ الاستثناء الوحيد لتوقعات الاختبارات القائمة هو توسيع toEqual الدقيق في الملفات الثلاثة المسمّاة.
Verified — توجيه المالك اللاحق حدّد ساعة فعلية عبر الواجهة وحصة ساعة/يوم؛ القياس الكامل هو أساس القيم أدناه، وليس بروفة smoke أو اختبار تكرار الوحدات.

## 2. المنجز والمستبعد

<a id="closure"></a>
Verified — أول commit يسجل [دمج #207](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/207) المتحقق من GitHub؛ خيارC خامل و0200 مؤجلة غير مطبقة.
Verified (إفادة المالك) — إصلاحات #207 تحقق منها المراجع على PG17 حقيقي؛ هذه إفادة منقولة، لا إعادة تحقق منا. RAD-059 تبقى review/owner للقنوات/ACK والبروفة والإبطال الحي؛ [الأصل](RAD-059_ALTERNATE_REPORT_2026-11-02.md#review-fixes-2026-11-02).
Verified — أُضيفت [0300](../supabase/migrations/20261102000300_rad085_rights_write_disclosures.sql) و[successor](../supabase/checks/rad085-review-ready.sql) و[الفحص اليومي](../supabase/checks/rad085-erasure-health.sql) و[دليل اللابتوب](RAD-085_FIXES_LAPTOP_RUNBOOK.md). P4 وD1 خارج تنفيذنا وتحديثاتهما من main محفوظة؛ لا SQL حي أو نشر أو تغيير سر/دور/Variables.

## 3. بحسب المهمة

Verified — R1: savepoint لكل حساب؛ الحراس باقية، والفشل يعاد بمعرف الحساب ورمز SQLSTATE مع WARNING وNOTIFY مجمع وalert بالواجهة. الآخرون يُمحون؛ المحجوب يبقى في القائمة والموعد الأصلي. متابعة UUID صريحة حتى بحجم1؛ لا تمديد requested_at أو30/37.
Verified — R2: إعادة تفويض المجموعة بعد قفل profile وقبل/بعد الكتابات، بما فيها انتظار trigger/صف الطلب. شاهدَا قفل profile وكتابة العضوية بعد ends_at يرفضان ذريًا دون عضوية/period جزئية.
Verified — S1: trigger على INSERT المباشر لكل من events/attempts/feedback؛ وقت خادمي ونوافذ ساعة/يوم UTC، وقفل سعة مشترك ثم profile ثم حساب/مسار؛ P0851 للمعدل وP0852 للحصة. الرسالة EN/AR تبقي العمل الحالي في الصفحة، بلا مساس بالدرجات.
Verified — P2: consent_v3 شخصية، ونسخة assess-written-2026-11-02-v3؛ v2 لا تفوض التصحيح. فلترة القبول قبل paging، وإعادة فحصه في التفويض لكل قراءة/كتابة/إيصال. ثمانية مواضع زمنية محسوبة تستعمل168 ساعة فعلية حتى مع DST؛ حسابات الاختبار تعيد القبول ولا قبول جماعيًا.
Verified — P3: حمولة المشرف هي id طلب مبهم، display_name، revision وstate=pending فقط؛ لا user_id أو بريد أو تاريخ. القرار يستخدم request id؛ شروط S3 قبل paging ثابتة. Terms الجديدة مؤجلة مع تاريخ2026-11-02.

## 4. المشتركات و Scale والحراسة

Verified — requiredMigrations/checks ثابتة؛ 0300 في deferredMigrations فقط مع حارس literal=false. البصمات الثلاثة المأذونة تبقى toEqual كاملًا للمدخلين، دون partial matcher أو تعديل أي تأكيد آخر.
Verified — SHA256 للترحيل الجديد: `5ddaf223e783e5dd3f92e0b428d7d1718f41f0fc19df9fac024a718d61330f44`.
Verified — اختبار الاستثناء: [manual-grading-availability.test.ts](../src/features/assess/manual-grading-availability.test.ts)، [rad062-name.test.ts](../src/features/assess/rad062-name.test.ts) و[frontend-manifest.test.ts](../src/features/deployment/frontend-manifest.test.ts): مدخل0200 بقي حرفيًا وأضيف مدخل0300؛ مقارنة بقية بايتات الملفات بعد عزل toEqual متطابقة.
Verified — marker ثابت: `pilot-v1:001c0cf80c1a4530e7144edfe252912c34ce3859f56c1e47a59524b1cae713e3`.
Verified — preflight ما بعد0200: functions=`93e22a77fb747f843e12c7bb1eaf17ad`، relations=`3d7d341aff9dcd9fd73c5fc1f7d9132b`؛ successor: functions=`56681d7fa7dbacc6c97ebf8be577a127`، relations=`377272711efab27ce3047cad42e0ac57`، مع ACL فعلي وجرد FK والحصة والبوابة/العامل.
Verified — البصمات تشمل وظائف Assess/emergency ووظائف public SQL/PLpgSQL غير التابعة للإضافات، وجداول Assess/emergency وprofiles/events/attempts/feedback/c2_account_deletions؛ لا ادعاء بصمة كتالوج المزوّد كله.
Verified — الحصة في جدول مراجَع واحد pilot_write_limits؛ usage ثلاثة صفوف كحد أقصى/حساب وتُمحى عبر CASCADE. لا عدّاد تاريخي نامٍ. فحص finalise≤100 حساب/نداء؛ التنبيه يحتفظ بآخر جزء فاشل أثناء المتابعة، وقائمة الحذف الأصلية مقسمة بالكامل.
Inferred — السقف ليس حدًا رياضيًا للواجهة أو ضمان كلفة المزوّد؛ نافذتان ثابتتان قد تسمحان بدفعة عند حد الساعة/اليوم. رفع القيم يتطلب قياسًا ومراجعة وpin جديدًا؛ لا تغيير صلاحيات API أو مهلات الحسابات.
Verified — سؤالا AGENTS: هل غيّر الاختصار حكمًا؟ لا. هل بقي رابط الدليل الأصلي؟ نعم: [O5](DECISIONS.md#rad085-db-day-owner-2026-10-27)، [S2/S3](DECISIONS.md#rad085-sec-fixes-owner-2026-10-27)، [Auth](DECISIONS.md#rad085-auth-fk-owner-2026-10-28)، [0200](DECISIONS.md#rad059-implementation-owner-2026-11-02) و[المراجعة](RAD-085_OPEN_REVIEWS_2026-11-02.md).
البصمات القائمة التي تغيّرت بسبب الربط فقط (قديم → جديد):

| الملف | القديم | الجديد | السبب |
|---|---|---|---|
| [FeedbackBox.tsx](../src/features/pilot/FeedbackBox.tsx) | `c6ae92fc0d39108fc60f8bac3f4028ca3e6b8bb950061e24166c4de47db4e703` | `6c49fc9ae12127a7fafa190a50fbfab471b3313f75977a8320d914a59fd5b2f8` | ربط الإفصاح/الرسالة/التقرير الجزئي |
| [attempt-logger.ts](../src/features/pilot/attempt-logger.ts) | `871679b87fd9c4d6eca92f5be5de3a6f47d4db9f6d26d7a938ec7a9df5d4196c` | `720e96055deb2459dd9e514ad9aa752005072651c7db21de731f3bd781e42ee9` | ربط الإفصاح/الرسالة/التقرير الجزئي |
| [activity.ts](../src/features/pilot/activity.ts) | `ef0fbb293a0fdd42faa46d5a5556b10b570f65396dd884e8f707186fba7d0f4a` | `07fc9bc2f87161a92836dd043d5e9936117da4a4b130b0497813e046558c48f9` | ربط الإفصاح/الرسالة/التقرير الجزئي |
| [c2-contract.ts](../src/features/pilot/c2-contract.ts) | `bbf1d8373042124ba88b5e7b59052dc1c55466972bf3cdfdcf54b448389972ec` | `2ea21fcb5b638ccc29dd5bea00801ba0c2d0216b4a6d99c6774255c55a4a91e0` | ربط الإفصاح/الرسالة/التقرير الجزئي |
| [AssessConsent.tsx](../src/features/assess/AssessConsent.tsx) | `32f970a60dc71bcc9a8b79ced8e5b08644e6852c78152154c79bc908b7b65dbb` | `fc93ff5276d200a5fe08cb53e5a1e5d1d94940f7e9ba0f7baa0acdcaac96c74c` | ربط الإفصاح/الرسالة/التقرير الجزئي |
| [sql-adapter.ts](../src/features/supervisor-review/sql-adapter.ts) | `d61d586ba6b9477908d682a09ff5d1d078da4527826d99ed736107d6cd93a7f0` | `77579c1b101c058a4e8799144932fb0db000534ca2059c3944ed4aa357337419` | هوية الطلب المبهمة |

## 5. الطب والدرجات

Verified — لا طب أو امتحانات أو مشاهد أو scoring/goldens/characterisation تغيرت؛ لم يُشغّل qa:golden أو qa:characterise. الحفظ محدود خادميًا، والتقييم المحلي والعمل الحالي لا يُمسحان عند رفض الحفظ.

## 6. QA وحدود الإثبات

Not run (usage limit; reviewer will run) — DB lane: embedded + supabase17؛ أُوقف المسار بأمر المالك قبل اعتماد نتيجته النهائية. شواهد الترتيب والكتالوج والتزامن موجودة للمراجع؛ لا ادعاء نجاح المسار النهائي.
Verified — typecheck وlint (تحذيران سابقان)؛ unit: 2516 ناجحًا؛ build وbuild:pages ناجحان. تحذير Pages: NEXT_PUBLIC_SUPABASE_URL not set; CSP unchanged (connect-src 'self').
Verified — Chromium/axe:20 حالة للمكونات الفعلية EN/AR×390/1440، 0violations/overflow/page errors، مع إثبات بقاء نص الملاحظة بعد الرفض؛ نقل اصطناعي وحارس معاينة فقط. ليست هاتفًا أو تشغيلًا حيًا.
Verified — الساعة الفعلية والسكريبت والعدّادات مدرجة أدناه؛ لا تسريع للساعة أو حقن درجات/مخزن. source checks تثبت ثبات ملفات supabase القائمة والحزمتين وmarker والتوقعات خارج الاستثناء.
Verified — docs:check --base origin/main، status:check --base origin/main --require-previous، git diff --check؛ docs:sync مرتان والثانية0 تغييرات. تحذيرات السقف مراجعة فقط، لا تجاوز للميزانية.
Not run (scope) — هاتف المالك، أي SQL/مزوّد حي، ACK وقنوات خارجية أو تطبيق/ترقية؛ NOTIFY ليس إثبات وصول تنبيه للهاتف.

## 7. المفتوح

Inferred — يلزم المراجع إعادة مسار Supabase17 على الصورة المثبتة والرأس النهائي، ثم بروفة الاستعادة ونافذة المالك. لا يُعد الدمج إغلاقًا تشغيليًا لـRAD-085 أوRAD-059 ولا إذن فتح.
Verified — لم تعدّل هذه الدفعة P4/D1؛ تغييرات [#208](RAD-085_P4_D1_REPORT_2026-11-02.md) الموروثة محفوظة، وقبول مهلة العرض وفق تقريرها. بقية شروط الإطلاق والخصوصية والقنوات في مصادرها.

## 8. قرارات المالك الموحدة

1. **S1 — اعتماد القيم المقترحة**: ساعة واحدة عبر [السكريبت الفعلي](../scripts/qa/rad085-intensive-scenario.mjs)، طالب واحد/Chest PA/EN/1440؛ إعدادات قائمة بلا تعديل درجات، ملاحظة «OK» لكل محاولة، Retry فور إتمام الملاحظة، دون زمن تفكير أو انتظار بين الدورات. حركة1600px/s، ضغطة60ms وكتابة10 أحرف/s تمثل إدخالًا بشريًا سريعًا؛ النقل الاصطناعي لا يضيف زمن شبكة.
Verified — البداية `2026-11-02T17:19:30.068Z`؛ نافذة العد3600ث بالضبط، وزمن إنهاء الدورة العابرة 3605.280ث؛ 660 ملاحظة داخل النافذة و661 دورة مكتملة إجمالًا. تُستبعد كتابات التهيئة وما بعد نهاية الساعة من الأعداد أدناه؛ أي دورة تعبر النهاية تُتم ملاحظتها دون تحريف العد.
Verified — إعادة التشغيل بعد build: `node scripts/qa/rad085-intensive-scenario.mjs --tools /tmp/rad085-browser --out /tmp/rad085-intensive`؛ خيارsmoke ليس قياس الحصص.
Inferred — هذا نموذج لإيقاع بشري سريع عبر عناصر التحكم الفعلية، وليس تجربة متطوع أو حدًا أعلى لكل جهاز/أسلوب. القيم قرار مالك صريح قبل التطبيق؛ اليوم = أربع ساعات مماثلة.

| المسار | الكتابات المقاسة/ساعة | الحصة/ساعة =5× | الحصة/يوم =20× |
|---|---:|---:|---:|
| events | 1991 | 9955 | 39820 |
| attempts | 660 | 3300 | 13200 |
| feedback | 660 | 3300 | 13200 |

<!-- RAD085-MEASUREMENT:BEGIN -->
```json
{"windowSeconds":3600,"startedAt":"2026-11-02T17:19:30.068Z","counts":{"events":1991,"attempts":660,"feedback":660}}
```
<!-- RAD085-MEASUREMENT:END -->

2. **P2 — اعتماد مسودة v3 التالية بالنص الكامل EN/AR**؛ تضم الفقرات الأربع التاريخية المعروضة من v2 بلا إعادة كتابة، ثم الإفصاح الكتابي الجديد. القبول شخصي جديد، ولا يُنشر النص قبل موافقة المالك وترقية الحارس.

**EN — DRAFT**

> The first Assess pilot supports timed assessments only. Your history contains the assessment name, track, submission date, and mark and maximum when the assessment policy permits showing them. Results are deleted six calendar months after submission. Activity and export do not extend that period.
>
> Answers and simulator settings are stored temporarily to resume and grade an attempt, then deleted when its result is successfully committed. If grading fails, the frozen attempt is retained for recovery for up to seven days after submission; its details are then deleted without inventing a mark. Answers and criteria cannot be reviewed, and attempts cannot be regraded, after their details have been deleted.
>
> We retain minimal attempt-reservation data to enforce attempt limits until the assignment is permanently closed and all its attempts, results, and recovery windows have ended, then delete it. A permanently closed assignment cannot be reopened. We retain your consent version and acceptance time while Assess is enabled for your account. When Assess is disabled, new attempts are blocked; the consent record is deleted after your attempt and result data have been settled. This operational metadata may remain for longer than six months and contains no answers or marks.
>
> Our backup policy is a daily encrypted backup with seven-day rotation and a backup before a database change. Data deleted from the active service may remain in a protected backup until its retention period ends; deletion does not immediately erase an older backup. The provider's backup policy must be verified separately before operation. Following a restore, access remains closed until deletion rules have been reapplied and permissions checked. Exports contain summary results only, without answers or settings, and remain subject to the original deletion deadlines. Practice has a separate, unchanged policy.
>
> For Assess written answers, your group supervisor grades your answers. The site owner may grade them through owner takeover when supervisor grading is unavailable. Grading must finish within 168 hours of submission; after that the attempt expires without a final grade. Free-text answers may reveal your identity, even when your name is hidden. Withdrawing sharing consent or leaving the group stops the supervisor from retrieving further data. Answers already open may remain visible until the current view expires or that page is closed or refreshed. Withdrawal does not by itself delete your answers or cancel an assigned exam. The owner may still grade within the same 168-hour window. Disabling Assess stops new attempts; retention and account deletion follow the policy above.

**AR — مسودة**

> تجربة Assess الأولى للاختبارات المؤقتة فقط. يتضمن السجل اسم الاختبار ونوعه وتاريخ التسليم والعلامة ومجموعها؛ تظهر العلامة إذا سمحت سياسة الاختبار. تحذف النتائج بعد ستة أشهر تقويمية من التسليم، ولا يمدد النشاط أو التصدير هذه المدة.
>
> تحفظ الإجابات وإعدادات المحاكي مؤقتًا لاستكمال المحاولة وتصحيحها، وتحذف عند تثبيت النتيجة بنجاح. عند فشل التصحيح تحفظ المحاولة المجمدة للاسترداد حتى سبعة أيام من التسليم، ثم تحذف التفاصيل دون اختراع علامة. لا مراجعة للإجابات أو المعايير ولا إعادة تصحيح بعد حذف التفاصيل.
>
> نحتفظ ببيانات دنيا لحجز المحاولات وحماية حدها حتى إغلاق الإسناد نهائيًا وانتهاء محاولاته ونتائجه ونوافذ استرداده، ثم نحذفها. الإسناد المغلق لا يعاد فتحه. ونحتفظ بإصدار موافقتك وتوقيتها طالما Assess مفعّل لحسابك؛ عند تعطيله نمنع البدء الجديد ثم نحذف سجل الموافقة بعد تسوية بيانات محاولاتك ونتائجك. قد تبقى هذه البيانات التشغيلية أطول من ستة أشهر، ولا تتضمن أجوبة أو علامات.
>
> سياسة النسخ التي نديرها نسخة يومية مشفرة بتداول سبعة أيام ونسخة قبل تغيير القاعدة. قد تبقى بيانات حذفت من الخدمة النشطة في نسخة محمية حتى انتهاء تداولها؛ الحذف ليس محوًا فوريًا لنسخة قديمة. يلزم التحقق من سياسة نسخ المزود مستقلًا قبل التشغيل. وبعد الاستعادة يبقى الوصول مغلقًا حتى إعادة تطبيق الحذف والتحقق من الصلاحيات. التصدير للنتائج المختصرة فقط ودون أجوبة أو إعدادات، ويخضع لمواعيد الحذف الأصلية. سياسة Practice مستقلة ولم تتغير.
>
> في الإجابات الكتابية في Assess، يصحح مشرف مجموعتك إجاباتك. ويمكن لمالك الموقع تصحيحها عبر استلام المالك للتصحيح عند تعذر تصحيح المشرف. يجب إتمام التصحيح خلال 168 ساعة من التسليم؛ وبعدها تنتهي المحاولة دون درجة نهائية. قد تكشف الإجابات الحرة هويتك، حتى عند إخفاء اسمك. سحب موافقة المشاركة أو مغادرة المجموعة يوقف جلب المشرف لبيانات جديدة. قد تبقى الإجابات المفتوحة مرئية حتى انتهاء صلاحية العرض الحالي أو إغلاق صفحتها أو تحديثها. ولا يحذف السحب إجاباتك أو يلغي اختبارًا مسندًا إليك بحد ذاته. وقد يستمر المالك في التصحيح ضمن مهلة 168 ساعة نفسها. تعطيل Assess يوقف المحاولات الجديدة؛ ويخضع الاحتفاظ وحذف الحساب للسياسة أعلاه.

3. **P3 — اعتماد إضافة Terms التالية كما هي، وتاريخ موافقة Terms الجديد2026-11-02**؛ لا تضعف S3 أو تمنح الوصول إلى تاريخ التدريب.

**EN — DRAFT**
> When you request to join a group, your name is shown to that group’s supervisor so they can approve or deny the request. The request alone does not give the supervisor access to your training history, answers or results. Only a pending request from an account still eligible to join is shown; historical requests do not reveal your identity.

**AR — مسودة**
> عندما تطلب الانضمام إلى مجموعة، يظهر اسمك لمشرف تلك المجموعة ليوافق على الطلب أو يرفضه. ولا يمنح الطلب وحده المشرف وصولًا إلى سجل تدريبك أو إجاباتك أو نتائجك. لا يظهر إلا الطلب المعلق من حساب ما زال مؤهلًا للانضمام؛ ولا تكشف الطلبات التاريخية هويتك.

4. **ترتيب نافذة اللابتوب**: بروفة الحالة الحديثة →M09 إن لم تكن مطبقة→0200 وفحصها→0300 وsuccessor الجديد، في النافذة نفسها. بعد الاعتماد والتحقق فقط تأتي PR ترقية منفصلة للنصوص/الإتاحة/manifest/attestation؛ لا إعادة تشغيل الفحوص القديمة ذات أجسام M09 بعد0300. [الخطوات اليومية والرفض والمصالحة](RAD-085_FIXES_LAPTOP_RUNBOOK.md).
