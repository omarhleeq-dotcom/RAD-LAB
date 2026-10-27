# RAD-085 — حزمة DB day بلا لابتوب · 2026-10-27

السلطة: [B1–B5](DECISIONS.md#rad085-db-day-nolaptop-owner-2026-10-27) فوق [S1–S8](DECISIONS.md#rad085-sec-fixes-owner-2026-10-27) و[O1–O5](DECISIONS.md#rad085-db-day-owner-2026-10-27). هذا PR (الإعداد) لا يغيّر أي ترحيل أو marker أو Terms أو CONSENT_VERSION؛ الترقية في PR Draft منفصل متفرع منه وغير مدموج. **لا SQL حي.** DB day ما زال يحتاج إذنًا حيًا منفصلًا ومراجعة مستقلة.

## 1. الانحرافات والميزانية

الهدف الواحد: حزمة DB day بلا لابتوب وبلا Docker (W1) مع تراجع مُثبت محليًا. بدأت الجلسة بـ`docs:context` و`status:summary -- --id RAD-085` ونجحا؛ #142 مدموج في main (تحققت عبر موصل GitHub: `merged_at` 19:39 والـmerge commit هو رأس هذا الفرع عند البدء).

**الميزانية:** ملفات جديدة: `supabase/manual/rad085-db-day-rollback.sql`، `…-precheck.sql`، `…-progress.sql`، `…-smoke.sql`، `…-counts-after.sql`، ومجلد `rad085-db-day-backup/` (29 ملفًا: عدّاد + 26 جدولًا + `auth.users` + الكتالوج)، واختباران `rad085-db-day-rollback.test.ts` و`rad085-db-day-packet.test.ts`، وهذا التقرير. معدّل: `RAD-085_DB_DAY_P1.md` (إعادة كتابة)، وDECISIONS (مرساة B1–B5)، وHANDOFF، وproject-status.

**انحرافان صغيران لأعرضهما:**
- **`rad085-local-db.ts`** (مساعد اختبار، ليس pin): أضفت معاملًا اختياريًا ثانيًا `migrations` افتراضيه القائمة القديمة نفسها، ليُثبت التراجع من حالتي «M1 فقط» و«M1–M3» (فشل M4 هو السيناريو الأرجح). لا يغيّر سلوك أي استدعاء قائم.
- **نص «تراجع بلا حذف» وNOT NULL:** الترحيل الرابع أسقط `NOT NULL` عن ثلاثة أعمدة `owner_id` في جداول قديمة. أعاده التراجع فقط إن لم يوجد صف NULL، وإلا تركه وأبلغ في الصف الأخير (`owner_id_not_null_not_restored`)، حتى لا يحذف بيانات ولا يفشل. اختباره موجود.

لا pin قائم تغيّر، ولا توقع اختبار، ولا ترحيل، ولا `qa:golden` أو `qa:characterise`.

## 2. المنجز والمستبعد

**أُنجز:** (B2) استعلامات نسخ CSV للقراءة فقط لكل جدول مع أعداد متوقعة واستعلام عدّ للمقارنة بعد DB day؛ (B3) سكربت التراجع واختباره؛ (B4) استعلامات progress وsmoke وcounts-after؛ (B5) precheck للساعة الهادئة؛ إعادة كتابة الحزمة بالترتيب B2 → precheck → الترحيلات الأربعة (كلٌّ في استعلام) → المُهيِّئ → الجاهزية → B4، مع قسم «عند عودة اللابتوب» يحفظ خطوات Docker والاستعادة؛ مرساة DECISIONS؛ HANDOFF؛ الحالة.

**استُبعد:** تنفيذ أي SQL حي؛ Docker والاستعادة وRAD-082 (مؤجلة بقرار B1)؛ أي تغيير في migrations أو manifest أو marker أو Terms (في PR الترقية فقط)؛ فحص `begin read only … rollback` في ملفات النسخ (الـSQL Editor قد لا يعرض نتيجة بعد `rollback`، فهي SELECT واحد بسيط للقراءة وقد أثبت الاختبار أنها تعمل داخل `begin read only`).

## 3. حسب البند

- **B2 النسخة:** 26 جدولًا من `public` و`assess` (كلها جداول ما قبل DB day) + `auth.users` بأعمدة `id,email,created_at,banned_until,consent_version` فقط + ملف كتالوج لأجسام الدوال وACL والـtriggers الحية. اختبار يثبت: القائمة = كل جدول أساسي موجود فعلًا (جدول ناقص يفشل CI)، وكل ملف يعمل داخل `begin read only`، وعدد صفوفه = عدّاده، ولا كلمات password/token/كتابة. شرط التصدير: «الصفوف المصدّرة = row_count» وإلا STOP.
- **B3 التراجع:** يستعيد أجسام وACL الدوال الأربع القديمة (`owner_account_deletion_v1`، `content_submit_v1`، `close_assignment_v1`، `assignment_terminal_v1`)، ويُسقط triggers: `assess_practice_recorded` على `public.attempts`، و`assess_managed_group` على `assess.groups`، و`assess_membership_period` على `assess.memberships`، ويسحب EXECUTE من 38 دالة جديدة (الدوال والجداول وصفوفها تبقى)، ويعيد NOT NULL كما سبق. الأجسام مأخوذة من كتالوج ما قبل DB day نفسه (`pg_get_functiondef`).
- **B4:** progress (بعد كل ترحيل)، وsmoke (آخر محاولة تدريب لها إيصال، `launch_gate` مغلق، المُهيِّئ طبّق السياسة v2، لا قبول ولا تعيين)، وcounts-after (لا جدول قديم ينقص، `scope_lock`=1 و`sharing_policy`=1)، وخطوات الموقع (حفظ محاولة، لوحة المالك، قائمة C2).
- **B5:** precheck يستثني حسابات المالك ويقرأ المحاولات والملاحظات خلال 60 دقيقة والأحداث و`last_seen_at` خلال 15 دقيقة (كلها يجب 0)، ويتحقق أن الترحيلات والـtriggers الجديدة ودور الجسر غائبة، وأن `prosrc` للدوال الأربع يطابق المستودع (md5)، ويعرض إصدار PostgreSQL.

## 4. التغييرات المشتركة وScale

مشترك واحد: معامل اختياري في `rad085-local-db.ts` (§1). **Scale (S-STD-3):** سقف CSV عبر المتصفح: عدد الصفوف المعروضة والمهلة في SQL Editor؛ الحد: ملف نسخ لكل جدول مع مطابقة العدد وإيقاف عند النقص، وتوجيه ترقيم `limit/offset` للجداول الكبيرة (`events`/`attempts`/`session_details`)؛ الرفع: عند عودة اللابتوب (نسخة كاملة، RAD-082). قوائم الجداول ثابتة في الحزمة؛ أي جدول جديد قبل DB day يُفشل اختبار التغطية فيُضاف صراحة. التراجع يعتمد قائمة الدوال الجديدة الثابتة (38)؛ دالة جديدة في ترحيل مستقبلي تحتاج إدخالًا في القائمة (يكشفه اختبار «new_rpc_closed»). المهل: `lock_timeout` 5s و`statement_timeout` 60s في التراجع.

## 5. الطب والدرجات

لا تغيير طبي أو scoring أو مشاهد أو بيانات امتحانات. كل الصفوف في الاختبارات اصطناعية.

## 6. QA

| الفحص | النتيجة |
|---|---|
| docs:context / status:summary | نجحا في البداية |
| اختبار التراجع (PostgreSQL 18 محلي) | 4/4: M1–M4+المُهيِّئ، M1–M3، M1 فقط، وحالة NULL. أجسام/ACL الدوال القديمة ومجموعة triggers مطابقة، كل جدول مطابق بالبصمة قبل/بعد التراجع، وكل صف أولي باقٍ، trigger التدريب متوقف، قائمة C2 تعمل، الدوال الجديدة 42501، وتشغيل ثانٍ no-op. أظهر في تشغيل أولي فرق ACL (دور الجسر على `content_submit_v1`) فصُحح السكربت. |
| اختبار الحزمة | 3/3: تغطية كل جدول، قراءة فقط، أعداد، precheck (وانحراف جسم دالة يقلب العمود المعني فقط)، progress/smoke/counts-after، وجاهزية d3 بمرحلتيها (13 صفًا true قبل المُهيِّئ وبعده) |
| typecheck | نجح |
| lint | 0 أخطاء؛ تحذيران قائمان في ملف غير معدّل |
| npm test كامل | 220 ملفًا / 3040 اختبارًا نجحت (كان 218/3033) بلا تغيير في أي توقع قائم |
| build / build:pages | نجحا |
| docs:check -- --base origin/main | 0 أخطاء و0 تحذيرات مراجعة |
| docs:test | 75/75 |
| status:check -- --base origin/main --require-previous | OK |
| git diff --check | نظيف |
| CI على الرأس النهائي | يُسجَّل في وصف PR |
| لم يُشغَّل | `qa:golden`، `qa:characterise`، تدقيق المتصفح (لا واجهة تغيّرت في هذا PR؛ يخص PR الترقية)، شاهد العامل (لا Docker) |

بيئة الاختبار: `initdb` يرفض root، فشُغّلت اختبارات PostgreSQL بمستخدم محلي غير مميز (ملكية ملفات محلية فقط، لا يتتبعها git).

## 7. المفتوح

- إذن حي منفصل من المالك ثم تنفيذ الحزمة؛ مراجعة مستقلة للإصلاحات S1–S8 والتراجع وملفات النسخ.
- لم يُجرَّب على Supabase الحقيقي: سلوك SQL Editor (حد الصفوف، تنزيل CSV، عرض نتيجة ملف ينتهي بـ`rollback`)، وفروق إصدار PostgreSQL وأدوار المزوّد (الجاهزية تفشل مغلقة وتتطلب مراجعة، فتوجب التراجع). التراجع مُثبت على PostgreSQL 18 المحلي فقط.
- النسخة CSV بيانات فقط: لا Auth ولا صلاحيات ولا إعدادات مشروع. نسخة Docker الكاملة وRAD-082 مؤجلتان وشرطان قبل أول امتحان؛ RAD-059 كذلك.
- ما بعد التراجع لا يُعاد تشغيل الترحيلات (تفشل على كائنات موجودة)؛ تحتاج محاولة ثانية إصلاحًا أماميًا مراجَعًا.
- PR الترقية غير مدموج (انظر تقريره).

## 8. قائمة المالك لـDB day وبرومبت المتابعة

أمر الخطوات والملفات الدقيقة في [الحزمة](RAD-085_DB_DAY_P1.md#0-the-order-in-one-table). في كل خطوة: افتح استعلامًا جديدًا في SQL Editor، وتأكد من مطابقة المشروع لـ`NEXT_PUBLIC_SUPABASE_URL`، والصق محتوى الملف **كما هو**.

| # | الخطوة | الملف الذي تلصقه | النتيجة المطلوبة |
|---|---|---|---|
| 0 | اختر ساعة هادئة، حدّد المشغّل، لا عامل ولا جسر ولا نشر | — | — |
| 1 | بوابة الهدوء | `supabase/manual/rad085-db-day-precheck.sql` | كل `recent_*`=0 وكل `*_ok`=true وإلا انتظر 15 دقيقة |
| 2 | فحوص الجاهزية التسعة الحالية، كلٌّ وحده | `supabase/checks/` : training, comparison, assess-mixed, assess-practical, assess-staging, assess-history, assess-retention, owner-dashboard, owner-deletion-surveys (`-ready.sql`) | كل الأعمدة true عدا `runtime_or_launch_verified` و`restore_verified` |
| 3 | نسخة B2: ثم نزّل CSV من كل نتيجة | `supabase/manual/rad085-db-day-backup/00-counts-before.sql` ثم `01` … `28` واحدًا واحدًا | عدد صفوف كل CSV = `row_count` في ملف 00 وإلا STOP |
| 4 | بوابة الهدوء قبل أول تغيير | `rad085-db-day-precheck.sql` ثم `00-counts-before.sql` | هادئ، والأعداد مطابقة للخطوة 3 |
| 5 | الترحيل 1 ثم progress | `supabase/migrations/20261026000100_assess_supervisor_scope.sql` ثم `supabase/manual/rad085-db-day-progress.sql` | `m1_scope` فقط true |
| 6 | الترحيل 2 ثم progress | `…20261026000200_assess_authoring_drafts.sql` | `m2_drafts` true |
| 7 | الترحيل 3 ثم progress | `…20261026000300_assess_assignment_review.sql` | `m3_review` true |
| 8 | الترحيل 4 ثم progress | `…20261027000100_assess_management_erasure.sql` | `m4_d3` true |
| 9 | جاهزية قبل المُهيِّئ | سطر أول `set rad085.sharing_phase = 'pre-initializer';` ثم `supabase/checks/rad085-d3-ready.sql` | 13 صفًا كلها true |
| 10 | المُهيِّئ الحي | `supabase/manual/rad085-sharing-policy-live-p1.sql` | COMMIT |
| 11 | جاهزية بعد المُهيِّئ | سطر أول `reset rad085.sharing_phase;` ثم `rad085-d3-ready.sql` | 13 صفًا كلها true |
| 12 | الفحوص الثمانية الباقية (دون assess-staging-ready) والـprobe | ملفات `supabase/checks/` نفسها، ثم أول كتلة SQL في الحزمة | كما في 2؛ assess-staging-ready يفشل بعد D3 وهذا متوقع |
| 13 | B4 من الموقع: احفظ محاولة تدريب واحدة، افتح لوحة المالك، افتح Account ← owner panel ← pending deletions | ثم `supabase/manual/rad085-db-day-smoke.sql` و`rad085-db-day-counts-after.sql` | كل `*_ok` true؛ العدّ لا ينقص (attempts +1) |
| 14 | عند فشل أي خطوة من 5 إلى 13 | `supabase/manual/rad085-db-day-rollback.sql` فورًا | صف أخير: true / 0 / true؛ ثم احفظ محاولة وتأكد |
| 15 | نجح كل شيء: احذف ملفات CSV وفرّغ سلة المحذوفات | — | ثم راجع PR الترقية |

بعد الخطوة 15 وبقرار منك فقط: راجع PR الترقية (Draft)، وضع `PILOT_SCHEMA_VERIFIED` على marker المطبوع في تقريره **بعد** نجاح SQL، ثم قرّر الدمج بنفسك.

برومبت المتابعة: «اقرأ AGENTS وHANDOFF وهذا التقرير وB1–B5؛ تحقق من Draft PR الإعداد وPR الترقية ورأس CI لكل منهما. لا تدمج ولا تطبّق SQL حيًا. إن نفّذ المالك DB day فاقرأ نتائجه قبل أي تغيير».

**سؤالا AGENTS:** هل تغيّر الحكم؟ **لا** لقرارات O1–O5 وS1–S8 ومهل C2/O5؛ أُضيفت B1–B5 كما أمر المالك (أسلوب التشغيل فقط: نسخة المتصفح بدل Docker مؤقتًا). هل بقي رابط الدليل الأصلي؟ **نعم**؛ بقيت خطوات Docker والاستعادة كاملة في قسم «عند عودة اللابتوب»، وقواعد الحزمة السابقة في O1–O5 وS1–S8 وتقاريرها دون إعادة كتابة.
