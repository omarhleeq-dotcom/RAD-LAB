# RAD-085 — إصلاح نتائج المراجعة الأمنية المستقلة · 2026-10-27

السلطة: [S1–S8](DECISIONS.md#rad085-sec-fixes-owner-2026-10-27) فوق [O1–O5](DECISIONS.md#rad085-db-day-owner-2026-10-27)، استجابةً لـ[المراجعة المستقلة](RAD-085_SECURITY_REVIEW_2026-10-27.md). الحكم: الثغرات الخمس مُصلحة ومُثبتة محليًا باختبارات PostgreSQL جديدة كتبتها هذه الجلسة. **DB day ما زال متوقفًا** حتى مراجعة مستقلة للإصلاحات وبقية بنود O4. لا تطبيق حي ولا تغيير marker.

## 1. الانحرافات والميزانية

الهدف الواحد: إصلاح SEC-01..SEC-05 وS8 مع إثبات خصومي محلي. بدأت الجلسة بتشغيل `docs:context` و`status:summary -- --id RAD-085` ونجحا. PR #141 كان مدموجًا في main، فقُرئت المراجعة من main.

**ميزانية الملفات:** الكود في ترحيل واحد هو M4 (`20261027000100_assess_management_erasure.sql`)، و`rad085-d3-ready.sql`، و`frontend-schema.json` (pinان)، و`pilot-schema-gate.mjs`، و`p1-availability.ts`. الاختبارات: ثلاثة قائمة بتوقعات مشتقة، واثنان جديدان. التوثيق: DECISIONS، وهذا التقرير، وHANDOFF، والحالة، وحزمة DB day، وتقرير D3، وقائمة التشغيل. لا تغيير في وحدة مشتركة أخرى.

**انحرافات تحتاج نظر المالك:**
- **M1–M3 لم تتغير بايتاتها.** كل جسم فعّال معيب كان في M4 (`assignment_close_v2` و`scope_page_v1` وC2 وD3). `assignment_confirm_v1` معرّف في M3 فقط، فأُعيد تعريفه في M4 بالجسم نفسه عدا فرع replay (فرق نصي مثبت). هذا يحفظ بصماتها و`rad085-p1-ready.sql` التاريخي. في يوم DB day يبقى جسم M3 القديم فعّالًا بين COMMIT الثالث وCOMMIT الرابع فقط، ولا يوجد تعيين مشرف قبل ذلك، فلا مسار استغلال ظاهر. إن فضّل المراجع تصحيح M3 أيضًا فذلك يغيّر `rad085-p1-ready.sql`، وهو خارج الاستثناء: STOP.
- **SEC-03 طُبق على مسار الإدارة كله**، أي `account_management_v1` (list/preview/transfer) والبدائيتين الخاصتين `transfer_management_d3_v1` و`erase_account_d3_v1`، لا على C2 وحده. السبب أن finalise يستدعي `erase_account_d3_v1`، وأن نقل O5 قبل اليوم30 كان سيتعطل بالإيقاف نفسه. اسم القرار كان C2؛ التوسيع ضروري لتحقيق معناه.
- **عيب كامن في فحص الجاهزية:** عمود `key` في UNION كان من نوع `name`، فيُقص إلى63 بايتًا. ترتيب المفاتيح المقصوصة المتساوية كان يتبع خطة التنفيذ، فاختلف digest القيود بين شكلين للاستعلام نفسه (`10f9…` و`700a…`)، وأي تغيير بعد البايت63 لا يظهر في المفتاح. صُحح بـ`relname::text`، فتغيرت بصمتا constraints وindexes دون أي تغيير في الكتالوج.
- **S8:** البوابة ليست أبطأ مما قبل #139 (§3). طُبق الاستثناء الزمني لأن الاختبار نفسه يتجاوز5 ثوانٍ تحت حمل CI؛ تفسير «أبطأ فعليًا» معروض للمالك.
- **البيئة:** `initdb` يرفض root، فشُغّلت اختبارات PostgreSQL والتحقق كاملًا بمستخدم محلي غير مميز وملكية ملفات محلية فقط (لا يتتبعها git). لا Docker daemon هنا، فلم يُشغّل شاهد العامل محليًا؛ CI يشغله إلزاميًا. تنزيل سجلات Actions الخام رفضه الـproxy (403)، فقُرئت عبر موصل GitHub دون أي تجاوز.

## 2. المنجز والمستبعد

**أُنجز:** إعادة تفويض المشرف بعد الأقفال في close وreplay. ترشيح طلبات الانضمام في SQL قبل paging. فصل إدارة الحذف عن أهلية Assess عبر `assess.owner_scope_enter_v1` (قفل scope ثم profile، ثم إعادة فحص المالك approved). حارس P1 حرفي يتحقق منه gate. readiness للامتيازات الفعلية والأدوار والسياسة. توثيق S7. مهلة S8.

**مستبعد:** أي ترحيل خامس أو تطبيق حي، وتغيير marker أو Terms أو CONSENT_VERSION أو C1/C2 التاريخية أو الدرجات أو المشاهد. لم يُشغّل `qa:golden` ولا `qa:characterise`. لا worktree أو وكلاء فرعيون، ولا subscribe/poll ولا روابط معاينة.

## 3. حسب البند: أُصلح / أُثبت / المتبقي

شواهد SQLSTATE مأخوذة من [الاختبار الخصومي](../src/features/assess/rad085-sec-fixes.test.ts) على PostgreSQL 18.4 المثبت محليًا (embedded، Unix socket). «خط الأساس» هو المصدر الأصلي بعد تبديل M4 مؤقتًا، ثم استعادة البايتات والتحقق من sha256.

### SEC-01 — high
**أُصلح:** مسار المشرف في `assignment_close_v2` يقرأ group من `assignment_scopes`، ثم يستدعي `supervised_group_v1` بعد قفل الإسناد وقبل إيصال `closed_at` أو أي تغيير، ويعيد الفحص بعد UPDATE. المالك ومدير D3 في فرع منفصل لم يتغير. فرع replay في `assignment_confirm_v1` يستدعي `supervised_group_v1(r.group_id)` قبل إعادة الإيصال. راجعتُ بقية مسارات كتابة المشرف (group/join/draft/prepare/targets/bridge/results)، وكلها تمر أصلًا بـ`supervised_group_v1` أو `review_current_v1`.

**أُثبت:**

| الحالة | بعد الإصلاح | خط الأساس |
|---|---|---|
| close وreplay قبل النهاية | ok | ok |
| بعد `end`: close مفتوح / إعادة close مغلق / replay | 55000 / 55000 / 55000 | ok / ok / ok |
| بعد مرور `ends_at` دون end: close / replay | 55000 / 55000 | ok / ok |
| مشرف آخر، أو scope يشير لمجموعة غيره، أو تعيين مسحوب (close وreplay) | 42501 | 42501 |
| فشل محقون بعد UPDATE | P0001 وrollback | P0001 |

بقي `closed_at` null وrevision=1 في كل رفض. المالك المدير أغلق إسنادًا بعد نهاية المجموعة بنجاح، أي أن المسار المنفصل يعمل.

**المتبقي:** مراجعة مستقلة. سباق ends_at أثناء الكتابة مغطى بإعادة الفحص بعد UPDATE، وليس باختبار توقيت دقيق.

### SEC-02 — medium
**أُصلح:** فرع `requests` يعيد pending فقط لحساب approved/participant، بلا account_stops، بموافقة مشاركة حالية، وغير عضو. الترشيح داخل SQL قبل `limit`. صفوف القرار تبقى في الجدول للمالك.

**أُثبت:** المسار approved ثم leave يخرج الطالب من members وrequests. المسار approved ثم withdraw (منفصلًا) يعطي members=[] وrequests=[]، مع بقاء الصفين approved في الجدول. إعادة الانضمام تعطي صفًا واحدًا pending بـrevision جديد (3)، ولا عضوية ولا Practice. pending لطالب موقوف أو معلق أو بلا موافقة يختفي. إعادة الموافقة بعد عضوية مقبولة تعيده عضوًا بنافذة جديدة لا طلبًا. paging: من25 طلبًا سحب10 موافقتهم، فأعطت صفحتا limit=10 عشرة ثم خمسة وnext=null، وtotal للأعضاء=10 قبل paging. العزل: قراءة المشرف A لمجموعة B وعكسها، وقراءة الطالب، كلها 42501؛ وlimit 0 و101 تعطي 22023. **خط الأساس:** أعاد الطلبين approved بهوية الطالبين، والصفحة الثانية عشرة صفوف بدل خمسة.

**المتبقي:** واجهة المشرف تعرض الحالة كما هي؛ لا اختبار متصفح جديد لأن العقد لم يتغير شكله.

### SEC-03 — medium
**أُصلح:** `owner_scope_enter_v1(p_write)` يفحص READ COMMITTED، ثم قفل scope، ثم profile للمستدعي، ثم `is_owner()`، بلا account_stops. يستخدمه C2 (deactivate/restore/finalise) وD3 (list/preview/transfer/erase). إعادة فحص المالك بعد انتظار profiles، وحماية النفس وآخر مالك، باقية كما هي.

**أُثبت:** مالك عطّل Assess لنفسه نجحت له deactivate وlist وrestore وD3 list/preview، وfinalise بنتيجة `{processed:1}` ومحو Auth. وبقي Assess نفسه مرفوضًا له (42501)، فالفصل حقيقي. الرفض 42501 لحذف النفس، ولآخر مالك (حالة صناعية: المالك الآخر معلق الحذف)، وللمشارك وللمشارك الموقوف. فشل محقون في المحو الثاني من دفعة finalise أعاد P0001، وبقي الحسابان وطلبا الحذف. ترتيب الأقفال: الطلب انتظر خلف `scope_lock FOR SHARE` (wait_event=Lock)، وخفض دور المستدعي أثناء الانتظار أدى بعد الإفراج إلى 42501 دون صف حذف. **خط الأساس:** finalise للمالك الموقوف رُفض بـ`42501 approved active account required`.

**المتبقي:** قرار المالك بشأن توسيع الفصل إلى D3 (§1).

### SEC-04 — medium
**أُصلح:** `P1_AVAILABLE` ثابت حرفي `false`، والملف بلا imports أو re-exports. الـgate يرفض أي شكل آخر («must be a literal constant»)، ويرفض حرفًا لا يطابق تصنيف manifest المقروء من القرص («does not match the manifest»). الترقية يوم DB day تغيّر الحرف وpin الحارس معًا.

**أُثبت** في [اختبار البناء الخصومي](../src/features/supervisor/p1-guard-adversarial.test.ts): وحدة عميل غير مثبتة تعدل كائن manifest وتُستورد قبل P1 في AppShell. البوابة تقبل المشروع وP1 dormant، والوحدة المعادية reachable، ولا p1-live/sql-adapter ضمن boundaries. حزمة esbuild للمستهلك الحقيقي `P1SupervisorScope` في jsdom، مع تزييف client/config/session فقط، أعطت `available=false` و`tampered=true` و**صفر استدعاءات**. **خط الأساس:** الحارس السابق المشتق مع التعديل نفسه أعطى `available=true` واستدعى `scope_page_v1`، أي أن الهجوم حقيقي، والبوابة الجديدة ترفض شكله.

**المتبقي:** الحزمة esbuild لا webpack الخاص بـNext. الإثبات يعتمد على أن المتغير الحرفي لا يمر بكائن مشترك قابل للتعديل، وهذا مستقل عن bundler.

### SEC-05 — low
**أُصلح:** أُضيفت إلى `rad085-d3-ready.sql` خمسة صفوف. `effective_privileges` digest لكل EXECUTE وجدول وعمود وschema فعّال لـPUBLIC/anon/authenticated/assess_worker/assess_authoring_bridge عبر `has_*_privilege`، فيشمل الموروث (56 مدخلًا، لا شيء لـPUBLIC/anon). `role_attributes`: لا super/bypassrls/createrole/createdb/replication/login، ولا inherit للعامل والجسر. `role_memberships`: الأدوار الأربعة ليست أعضاء في شيء، وأعضاء العامل والجسر مقصورون على `assess_job_a/b` (SET بلا INHERIT/ADMIN) أو منحة ADMIN فقط لمنشئ PG16+. `scope_lock` singleton. `sharing_policy:<phase>`: الزوج v2 بعد initializer افتراضيًا، أو null/null مع `rad085.sharing_phase=pre-initializer`.

**أُثبت:** الفحص على fixture الحالي يعطي13 صفًا كلها true، وdrift جدول صناعي يعطي false (الاختبار القائم). digest مستقر بين الاستعلام المنفرد والملف الكامل، بلا مفاتيح مكررة.

**المتبقي:** أدوار المزوّد قد تختلف عن fixture المحلي فيفشل الفحص مغلقًا ويحتاج مراجعة. لم يُكتب اختبار GRANT خصومي منفصل؛ تغيير منحة يغير digest بالتعريف، لكن ذلك غير مثبت بشاهد مستقل.

### S8 — CI flake
**قيس** (ms، خمس مرات، الوسيط): print-marker / gate كامل. قبل #139 (`cb9233c`): 674 / 668. main قبل الإصلاح: 735 / 700. هذا الفرع: 656 / 673. البوابة لم تتباطأ بـ#139. الرسم reachable يضم 270 من 332 ملفًا، فتحليل AST لا يُختصر دون إضعاف. أُلغي parse لـJSDoc (لا تزوره forEachChild)، فوفّر نحو 5%. في CI: الملف مرّ في 4298ms ثم فشل بتجاوز 5000ms (run 40452047805)؛ محليًا 2.6s قبل الإصلاح. السبب5 عمليات gate متتالية تحت تزاحم أكبر بعد ملفات #139/#140 الثقيلة.

**أُصلح:** RAD-SCHEMA-GATE-TIMEOUT-20261027 على هذا الاختبار وحده: 15000ms ≥ 3×4298. **أُثبت:** 20/20 نجاحًا محليًا، مدة الاختبار1 بين 1956 و2226ms. **المتبقي:** CI الأخضر على الرأس النهائي يُسجَّل في وصف PR.

**S7:** موثق في [قائمة التشغيل](RAD-085_REMAINING_OPERATIONS_2026-10-26.md#s7-supervisor-restore) و[تقرير D3](RAD-085_D3_REPORT_2026-10-27.md).

## 4. التغييرات المشتركة وScale والـpins

| file:line | القديم → الجديد | السبب |
|---|---|---|
| scripts/pages/frontend-schema.json:58 | `a5f704bc…3146` → `7e77817c…826e` | بايتات M4 (S1) |
| scripts/pages/frontend-schema.json:124 | guard `c15a68a5…17c3` → `aa3d569b…ca5b` | حارس حرفي (S5) |
| supabase/checks/rad085-d3-ready.sql:39 | constraints 154 `10f9…` → 154 `28bd…` | مفتاح text بدل name؛ لا تغيير كتالوج |
| :40 | — → effective_privileges 56 `f23b…` | S6 |
| :41 | functions 74 `d01b…` → 75 `0a72…` | دالة owner_scope_enter_v1 وأجسام SEC-01/02/03 ومفتاح text |
| :42 | indexes 72 `e7e2…` → 72 `dc8d…` | مفتاح text؛ لا تغيير كتالوج |
| :38,43–45 | columns/relations/schema/triggers | بلا تغيير |
| src/features/assess/rad085-d3-db.test.ts:267 | `toBe(8)` → `toBe(13)` | صفوف readiness الجديدة |
| src/features/supervisor/p1-schema.test.ts:18–21 | + تغيير الحرف وإعادة pin داخل نسخة الاختبار عند الترقية | الترقية تتطلب الحرف الآن؛ التوقع لم يتغير |
| src/features/pilot/schema-gate.test.ts:20 | 5000 (ضمني) → 15000 | S8 |

بلا تغيير: بصمات M1–M3 وconsumer `P1Session` (`f9a9…`) وboundaries p1-live/sql-adapter وmarker `pilot-v1:a514b79f…ee10` (أُعيد حسابه وطابق).

**Scale (S-STD-3):** لا سقوف جديدة. فلتر الطلبات يزيد عمل الصفحة بقراءات per-row مفهرسة ضمن حد100. owner_scope_enter يأخذ قفل scope العالمي نفسه الذي أخذه C2 سابقًا، فسقف throughput المعلن لم يتغير. أسماء `assess_job_a/b` مثبتة في readiness كما في فحص العامل القائم؛ أي login جديد يحتاج مراجعة، والرفع عند تغيير تصميم العامل.

## 5. الطب والدرجات

لا تغيير طبي أو scoring أو مشاهد أو بيانات امتحانات. كل الهويات والمحتوى في الاختبارات صناعية.

## 6. QA

| الفحص | النتيجة |
|---|---|
| docs:context / status:summary | نجحا في البداية |
| typecheck | نجح |
| lint | 0 أخطاء؛ تحذيران قائمان في ملف غير معدل |
| npm test كامل | 218 ملفًا / 3033 اختبارًا نجحت (main: 216/3023) |
| الاختبار الخصومي SEC-01..03 | 8/8 نجاح؛ خط الأساس 6 فشل / 2 نجاح |
| الاختبار الخصومي SEC-04 | 2/2 |
| schema-gate.test.ts ×20 | 20/20 |
| lock-witness / erasure-recovery (خطوات CI) | 2/2 و20/20 |
| worker rehearsal | **لم يُشغّل محليًا**: لا Docker daemon (STOP عند phase=docker). خطوة CI إلزامية |
| build / build:pages | نجحا |
| docs:check -- --base origin/main | 0 أخطاء و0 تحذيرات مراجعة |
| docs:test | 75/75 |
| status:check -- --base origin/main --require-previous | OK |
| git diff --check | نظيف |
| CI على الرأس النهائي | يُسجَّل في وصف PR |

## 7. المفتوح

DB day ينتظر: مراجعة مستقلة لهذه الإصلاحات، وقرار المالك في انحرافات §1، ثم كل بنود O4 (نسخة Docker مستعادة، والتفويض، والمزوّد، والحقوق، والهاتف). RAD-082 وRAD-059 شرطان قبل أول امتحان. اختبار GRANT خصومي منفصل لـreadiness، وحمل الأقفال، غير منفذين.

## 8. قائمة المالك وبرومبت المتابعة

- راجع انحرافات §1: M4 فقط، وتوسيع SEC-03 إلى D3، وتصحيح مفتاح readiness، وتفسير S8.
- اطلب مراجعة مستقلة للإصلاحات قبل DB day؛ Draft فقط.
- عند DB day: تغيير حرف P1 وpin الحارس مع الترقية، وتشغيل readiness بالمرحلتين.

برومبت المتابعة: «اقرأ AGENTS وHANDOFF وهذا التقرير وS1–S8؛ تحقق من Draft PR ورأس CI. راجع الإصلاحات مستقلًا على PostgreSQL محلي دون الاعتماد على اختبارات الكاتب. لا تطبيق حي ولا تغيير marker».

**سؤالا AGENTS:** هل تغيّر الحكم؟ **لا** لقرارات O1–O5 ومهل C2/O5. أُضيفت قرارات S1–S8 الجديدة كما أمر المالك، وتوسيع SEC-03 إلى D3 معروض عليه صراحة. هل بقي رابط الدليل الأصلي؟ **نعم**؛ [المراجعة](RAD-085_SECURITY_REVIEW_2026-10-27.md) و[O1–O5](DECISIONS.md#rad085-db-day-owner-2026-10-27) و[تقرير D3](RAD-085_D3_REPORT_2026-10-27.md) محفوظة بلا إعادة كتابة، وأُضيفت إلى تقرير D3 فقرة لاحقة فقط.
