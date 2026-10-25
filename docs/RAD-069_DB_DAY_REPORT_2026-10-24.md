# RAD-069 — DB day: وصل C1 وC2، 2026-10-24

## 1. الانحرافات والميزانية

الهدف تنفيذ [وصل DB day](PILOT_SUPABASE_SETUP.md#c2-phase2-wiring) بأمر المالك، لا تطبيق SQL جديد. شغلت docs:context وstatus:summary -- --id RAD-069، وقرأت AGENTS وHANDOFF ومرجعَي الإعداد وقرارات C2 وPhase 2 وتقريرها. الفرع من أحدث origin/main بعد fetch؛ تحقق docs:context -- --pr 128 أثبت دمج تجهيز Phase 2، وتطابق قاعدة الفرع مع main وقت القراءة. لا worktree أو subagents.

أعلنت24ملفًا قبل التحرير، ثم26 لإضافة عزل OwnerDirectory واختبارات انتظار DB day القديمة، ثم27 لإضافة لقطة مراجعة واحدة. الفعلي للدفعة الأصلية26ملفًا؛ وبعد تصحيح Terms صار إجمالي PR27ملفًا. frontend-schema.test.ts بقي بلا تغيير لأنه يعزل B أصلًا. القائمة النهائية: assess-staging-ready.sql؛ owner-dashboard-data.ts وOwnerPanel.tsx وOwnerDirectory.tsx وC2Session.tsx؛ `src/app/[locale]/page.tsx` و`src/app/[locale]/feedback/page.tsx` وAppShell.tsx؛ consent.ts ورسالتا EN/AR؛ frontend-schema.json؛ اختبارات deployment: owner-dashboard-deferred-schema وc2-deferred-schema وassess-d-schema وassess-e-schema وassess-f-schema؛ owner-dashboard-db.test.ts وdb-day-wiring.test.ts؛ rad-069-db-day-audit.mjs؛ PILOT_SUPABASE_SETUP وDECISIONS وproject-status وHANDOFF وهذا التقرير؛ review/rad069-db-day.jpg. لا ملفات مشتركة أخرى أو تعديل ترحيلات أو gate.

الاستثناء المسمّى من المالك يشمل جدول TRIAL والدوال المطابقة فقط في staging، وتغييرات توقعات deferred/attestation اللازمة لـDB day أدناه. تبقى كل التوقعات والبيانات والبصمات الأخرى ثابتة. حذفت الدفعة الأولى بالخطأ فقرتَي الاحتفاظ العام. صحّح المالك ذلك في مراجعة PR #131 بتاريخ2026-10-24: أعيدتا حرفيًا، وأضيفت أحكام الحذف الفردي بجانبهما؛ S-PILOT-15 لا تتغير.

ميزانية تصحيح Terms بعد مراجعة المالك:8ملفات إضافية/معدلة محددة قبل التحرير: رسالتا EN/AR؛ صفحة Terms؛ سكربت rad-069-db-day-audit.mjs لخيار --terms-only؛ لقطة review/rad069-terms-review.jpg؛ هذا التقرير؛ DECISIONS؛ project-status. لا تعديل لاختبارات أو حدود DB أو إصدار الموافقة. هذا تصحيح مراجعة على المسودة نفسها.

## 2. المنجز والمؤجل

- staging تضيف `assess.trial_scope` ودوالها **فقط** إذا كانت `to_regclass('assess.trial_scope') is not null`، بنفس نمط consents/account_stops، دون تخفيف أي شرط.
- adapter مستقرة داخل جلسة محروسة؛ مكونات المالك تعاد بمفتاح الهوية/الدور/الحالة، ومكونات المشارك بمفتاح المستخدم الموافق. الخروج أو تغير المستخدم يزيل العرض القديم ويلغي استقبال نتائج الربط السابقة.
- `OwnerDeletion` و`OwnerSurveys` داخل approved-owner panel؛ `onChanged` يحدث الدليل والتدريب. كل OwnerDirectory، بما فيها الاختيار للتصدير وAssess، تقرأ دليل C2 الذي يستبعد pending deletion. الدليل لا يستعمل parseParticipants ولا يخمن email_confirmed. قبل الموافقة فقط، owner_page_v1 تقرأ مستخدمًا محددًا بحد1؛ التحذير والتأكيد الثاني باقيان. الحقول غير المعروفة لا تعرض كتأكيد بريد معلوم.
- `examSummaryPage` تعيد ملخص C1 الفعلي من owner-dashboard-deferred؛ دليل C1 القديم ليس مصدر أي قائمة طبيعية. CSV التدريب والملاحظات وملفات التصدير القائمة لم تتغير.
- التذكير بجوار TrainingSummary للمعتمد الموافق ذي دور participant، دون حارس Practice أو توقيت أهلية محلي. صفحة `/[locale]/feedback` و«Your feedback / ملاحظاتك» في AppShell موصولتان؛ pending تأتي من الخادم عند الزيارة.
- CONSENT_VERSION: `2026-10-19` → `2026-10-24`، مع إعادة الموافقة القائمة. Terms EN/AR تذكر حذف جميع البيانات نهائيًا بعد نافذة استعادة30يومًا، وبقاء نسخ المزوّد حتى انتهاء احتفاظه، والاستبيانات للمالك وحده. SUS الأصلية الإنجليزية مع تعليمات عربية، وكود الاستبيان الخارجي ومتغيره محفوظان دون عرض بطاقته.
- requiredMigrations تنتهي بـC1 ثم C2؛ checks تنتهي بفحصيهما. deferred فارغة؛ source pins المراجعة محدثة، وgate دون تغيير.

لا SQL حي أو متغير GitHub أو خدمة أو cron أو استئناف Assess من الوكيل. ما زال تعيين الشهادة وإعادة CI والدمج والهاتف على المالك.

تصحيح مراجعة المالك: howLong.p1/p2 مطابقتان حرفيًا لـorigin/main في EN/AR؛ انتقلت نافذة الاستعادة والحذف النهائي والنسخ الاحتياطية إلى p3/p4، وتعرض صفحة Terms الفقرات الأربع. rights.p2 تحتفظ بالنص الجديد وتوضح أن طلب الحذف الفردي لا ينتظر نهاية التجربة أو فترة الستة أشهر. who.p1 تبقي إجابات الاستبيان للمالك وحده والصادرات برمز المشارك، وتحذف ذكر المشرفين لعدم وجود هذا الدور. CONSENT_VERSION تبقى2026-10-24.

## 3. حسب المهمة

RAD-069 تبقى review / owner؛ وصل اليوم في مسودة للمراجعة، ولا يُسجّل كأنه مدموج أو منشور. إفادة المالك بتاريخ2026-10-24 عن المشروع `vlacestfruxooznrcjqc`: لم توجد كائنات C1/C2 قبل التطبيق؛ طُبق `20261024000100_owner_dashboard.sql` ثم `20261024000200_owner_deletion_surveys.sql`، كل ملف مرة واحدة، وكلاهما Success. training/comparison READY، وassess-mixed/practical/history/retention true عدا runtime/restore المقصودة false؛ owner-dashboard-ready/1 وowner-deletion-surveys-ready/1 كلها true. staging القديمة أظهرت false فقط لـno_unreviewed_relations وno_unreviewed_functions وcatalogue_ready، وإضافاتها من قائمة TRIAL المراجعة.

هذه إفادة المالك، وليست نتيجة اتصال حي من الوكيل. RAD-044 مغلقة بإثبات المالك السابق، ولا يطلب التقرير بياناته مجددًا. بقية المهام ومراجعات A/B/C1 وRAD-077 محفوظة.

## 4. المشتركات وScale والاستثناءات

كل كائنات TRIAL المطابقة للمصدر: جدول واحد و12دالة، أي13كائنًا في قائمتي relations/functions. المصدر يضيف triggers أيضًا؛ staging لا تصنف triggers كـrelations/functions، ولم يغيّرها هذا العمل. الجدول RLS بلا سياسات أو منح مباشرة. كل الدوال SECURITY DEFINER وsearch_path فارغ وREVOKE للأدوار public/anon/authenticated/assess_worker؛ التنفيذ يعاد للعامل على الخمس المعينة فقط:

| التوقيع في assess | audience |
|---|---|
| `trial_assert_v1(assess.trial_scope)` | internal |
| `trial_claim_v1(uuid)` | worker |
| `trial_config_guard_v1()` | internal |
| `trial_enter_v1(uuid)` | internal |
| `trial_fail_v1(uuid,uuid,uuid)` | worker |
| `trial_finish_v1(uuid,uuid,uuid,text,text)` | worker |
| `trial_health_v1(uuid)` | worker |
| `trial_maintain_v1(uuid,integer)` | worker |
| `trial_row_allowed_v1(text,jsonb,assess.trial_scope,boolean)` | internal |
| `trial_tables_lock_v1()` | internal |
| `trial_truncate_guard_v1()` | internal |
| `trial_write_guard_v1()` | internal |

Scale: دليل C2 بحد20، وقراءة تأكيد البريد بحد1 عند طلب الموافقة فقط، بدل عدة partitions وتفاصيل لكل شخص وHEAD counts عامة. لا قراءة غير محدودة أو cache حسابات عبر الجلسات. تبقى حدود C2 القائمة: عرض20، تصدير100إجابة لكل ملف، حتى10أسئلة و1000حرف للنص، finalise حتى100طلب لكل ضغطة، وgap7–3650من الخادم. التوسعة تحتاج مراجعة عقود SQL والواجهة؛ لا تعميم صامت أو timer/cron. نوع/إصدار الاستبيان بيانات، وEN/AR محليتا المنتج الحاليتان؛ SUS العربية تحتاج citation مستقلًا. الصفحات المصدرة ليست snapshot ثابتة كما في Phase 2.

**كل توقع قديم تغيّر → الجديد، ضمن إذن DB day فقط:**

| الملف/الموضع | القديم → الجديد |
|---|---|
| owner-dashboard-deferred-schema، required | لا تحتوي C1 → آخر عنصرين C1 ثم C2 بالترتيب |
| الملف نفسه، checks | لا تحتوي فحص C1 → آخر فحصين owner-dashboard-ready ثم owner-deletion-surveys-ready |
| الملف نفسه، deferred | مفاتيح `[C1,C2]` → `{}` |
| الملف نفسه، بصمة C1 | deferred entry تساوي digest SQL → digest SQL يساوي البصمة المراجعة نفسها `d7c932ca54d1724ef8ffeb1f78c0a69834609e9e9dd49d1d0b8bb6c8b701bef2`؛ لا تغيير SQL |
| الملف نفسه، marker | `pilot-v1:0bc3743c707cff0fcef456d00096f6e186b759390708d2d963a6eabea55e5d52` → الشهادة الجديدة في §6، للبوابة وprint معًا |
| الملف نفسه، re-export غير مثبت | `Deferred backend reached the frontend` → `database boundary changed` لأن C1 أصبحت required؛ ما زال التغيير غير المراجع مرفوضًا |
| الملف نفسه، RPC غير مطلوبة | إدخال owner_dashboard_v1 المؤجلة مرفوض → إدخال unknown_future_v1 غير المعروفة مرفوض بنفس `Frontend API missing from required SQL`؛ C1 أصبحت مطلوبة |
| الملف نفسه، تغيير SQL | `Unreviewed deferred migration` → `schema compatibility has not been attested` لتغيير required SQL؛ يبقى الرفض |
| c2-deferred-schema، required/checks | لا تحتوي C2 وفحصها → تحتويهما |
| الملف نفسه، deferred/source | entry ببصمة SQL وserverModules المعزولة → entry غير موجودة، digest SQL يساوي البصمة المراجعة نفسها `757ba38b0806221e8bbce71cc2f67740188ccdcaa46664bc070ce1d339c9d99a`، وbrowserBoundary لـc2-contract يساوي digest الملف المتصل |
| الملف نفسه، marker | الشهادة القديمة أعلاه → الجديدة في §6؛ نجاح البوابة وprint يبقيان مطلوبين |
| assess-d/e/f-schema، تجهيز fixture فقط | إزالة SQL C1/C2 وحذف deferred entries من fixture → إبقاؤهما مطلوبتين مع graph الوصل الحالية. **لم يتغير أي expect أو marker تاريخي** في الملفات الثلاثة؛ B fixture في frontend-schema.test ثابتة |
| owner-dashboard-db، fallback C1 المفقودة | legacy=true، وتسلسل owner_dashboard ثم training ثلاث مرات → legacy=false، وتسلسل owner_dashboard ثم owner_account_directory مرة؛ next=null ورفض42501 باقيان |
| الملف نفسه، المسار الطبيعي | training_page_v1_with_comparison مع cursor id وlegacy=true → owner_account_directory_v1 مع cursor id/rank وlegacy=false؛ البحث/status/limit20/next=null نفسها |
| الملف نفسه، summary انتظار | null بلا RPC جديدة وبقاء عدد calls → `{rows:[],next:null}` مع call ثانية owner_dashboard_v1، p_view=summary وlimit20 |
| الملف نفسه، البحث عبر الحالات | training RPC وحالات `[pending,approved,suspended]` → C2 RPC واحدة مع `['']`؛ limit20 ونتيجة صفرية باقيان |

تغيرت أسماء الاختبارات لتعبر عن متطلبات اليوم. لا توقع درجات/سجلات قديمة أو golden/characterisation تغيّر. اختبارات db-day-wiring جديدة مستقلة لا تستبدل الحراس القديمة.

## 5. الطب والتقييم

لا تغيير للطب أو scoring أو شروط نجاح التدريب أو بيانات الفحوص أو الصور أو المحاكي أو المشاهد أو hashes. لا qa:golden أو qa:characterise. درجة SUS تبقى إسقاطًا خادميًا ولا تحسب في React؛ ليست درجة تدريب أو مصادقة طبية. ملف TRIAL المراجع والترحيلات وفحصا C1/C2 وgate باقية بالبايت.

## 6. التحقق

- typecheck الأول تعثر لاعتماديات Supabase/PGlite الناقصة في البيئة؛ npm ci المقفل نجح دون تغيير package/lock. بعده صُحح التعامل مع getPilotClient الذي قد يعيد null، وتضييق فهارس الاختبار الجديد، ثم نجح typecheck. lint نجح دون errors؛ تحذيرا vb/inv السابقان في simulator-layout-audit فقط.
- المستهدف بعد تحديث انتظار DB day:13ملفًا/70اختبارًا ناجحة. سبقتها خمسة إخفاقات متوقعة من عقود التأجيل السابقة، قبل التحديث المسمّى، لا تعديل عشوائي لجعلها تنجح. يتضمن المستهدف كتالوج staging بلا TRIAL ثم معها، ويرفض EXECUTE زائدة لـauthenticated وجدولًا ودالة غير مراجعين؛ runtime يبقى false. النقل اصطناعي PGlite فقط.
- `npm run check` الكامل مرة واحدة في النهاية نجح:181/181ملفًا و2730/2730اختبارًا،596.46ثانية للاختبارات، مع typecheck وlint ناجحين. `npm run build:pages` مرة واحدة نجح بمتغيرات الاختبار أدناه؛ اكتمل Next build والتصدير وfinalize-headers، بما فيها `/en/feedback` و`/ar/feedback`. لم تُعد المجموعة أو البناء بعد نجاحهما.
- `node scripts/qa/rad-069-db-day-audit.mjs`: نجح144تحققًا و50axe بلا violations أو overflow أو page errors، و**صفر طلب شبكة**. الصفحات/المكونات الفعلية: owner panel وhome وfeedback وaccount consent وTerms، EN/AR×390/1440، الثيم الداكن الحالي؛ إضافة قائمة الهاتف وحالات RPC الغائبة والخروج وعدم الموافقة/رفض غير المالك. تشمل تحذير البريد غير المؤكد والتأكيد الثاني بقراءة محدودة، deactivate واختفاء القائمة الطبيعية ثم restore، طلب ملخص C1، رابط feedback المحلي، أصل SUS الإنجليزي، تصفير إجابات النموذج عند تبدل المستخدم، وإعادة الموافقة بالزر القائم. بدائل الجلسة/العميل/التنقل/server locale وsaved-results فقط؛ لا بيئة Next حية أو خدمة Auth حقيقية. تعثرت محاولات إعداد harness في مطابقة react-dom/client، ثم pending count وpending envelope الاصطناعيين، ثم تمييز رابط القائمة عن روابط اللغة؛ أصلحت أداة التدقيق وحدها. المصفوفة الناجحة لم تُعد.
- [لقطة المراجعة](review/rad069-db-day.jpg)،121219بايت، راجعتها بصريًا؛ المصفوفة الكاملة وresults.json محليًا في `/tmp/rad069-db-day`. اللقطة مجمعة للمراجعة وليست دليل هاتف أو بيانات فعلية. لا عرض hosted preview.
- docs:test:75/75نجحت؛ docs:check نجح0errors/0review warnings، وstatus transition مع require-previous وgit diff --check ناجحان. تعثر docs:check أولًا لمرساة HANDOFF التي تستعملها تقارير تاريخية؛ أعدت المرساة نفسها وبقيت الروابط سليمة.
- إثبات byte مستقل: gate وكل supabase/migrations وtrial-isolation.sql بلا diff مقابل origin/main. لم تشغّل SQL حيًا أو تغير متغيرات GitHub أو تشغّل خدمة/worker/cron أو تنشر أو تدمج. source pins تطابق الملفات الفعلية، وقبلت البوابة الشهادة الجديدة ورفضت السابقة. لا تدعي هذه الفحوص تحقق backend runtime.

أمر الشهادة NEW، بالمشروع العام نفسه ومفتاح **اصطناعي**، دون اتصال:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://vlacestfruxooznrcjqc.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_synthetic_local_test_123456 node scripts/pages/pilot-schema-gate.mjs --print-marker
```

الخَرْج الحرفي، exit0:

```text
pilot-v1:a514b79f52c5816ec767730da1f88a38efad7da795bf977abef751ca7542ee10
```

المتغيرات الاصطناعية للبناء نفسها، مع `PILOT_SCHEMA_VERIFIED` الجديدة داخل أمر البناء المحلي فقط. لم يُعيّن أي متغير GitHub. القديمة لا تشهد متطلبات اليوم.

### تصحيح Terms — تنفيذ 2026-10-25، مراجعة المالك بتاريخ2026-10-24

نجح `npm run typecheck` و`npm run lint` (0errors وتحذيرا vb/inv السابقان فقط)، ثم consent.test.ts في pilot وpilot-db وmessages.test.ts وdisplayed-text.test.ts:4ملفات/58اختبارًا ناجحة. لم يتغير أي expect أو hash. أكد فحص مستقل تطابق howLong.p1/p2 حرفيًا مع origin/main في EN/AR، وبقاء CONSENT_VERSION=2026-10-24.

نجح `node scripts/qa/rad-069-db-day-audit.mjs --terms-only`:16تحققًا و4axe، EN/AR عند390، بلا overflow أو violations أو page errors أو طلب شبكة. الفقرات الأربع ظاهرة في صفحة Terms الفعلية؛ اللقطات المحلية في `/tmp/rad069-terms-review`، و[لقطة المراجعة EN/AR](review/rad069-terms-review.jpg) حجمها598351بايت ضمن حد5MB، وراجعتها بصريًا. تعثر محدد الفقرات الأول لأنه استهدف عنوان القسم بدل القسم نفسه؛ صُحح المحدد في الأداة فقط ثم نجح التدقيق، ولم تُعد المصفوفة السابقة غير المتأثرة.

أعيد تشغيل أمر --print-marker نفسه بالمشروع العام ومفتاح اصطناعي؛ خرج exit0 بالقيمة نفسها حرفيًا: `pilot-v1:a514b79f52c5816ec767730da1f88a38efad7da795bf977abef751ca7542ee10`. نجحت docs:check بلا أخطاء أو review warnings، وstatus transition مع require-previous وgit diff --check. راجعت HANDOFF كاملًا؛ قائمة المالك والحدود والمفتوح لم تتغير، والتقرير المرتبط يحمل التصحيح. لا إعادة للمجموعة الكاملة أو البناء السابقين لهذا التعديل النصي المحدود وفق طلب المالك. لا SQL أو متغيرات GitHub أو تعديل gate/manifest/consent.ts أو توقعات اختبارات.

## 7. المفتوح

ينتظر المالك إعادة staging المحدثة، ثم الشهادة وCI والدمج والهاتف. readiness لا تثبت GoTrue/JWT lifetime أو backup/restore/provider retention؛ القيود الذرية لـCASCADE باقية وقد تمنع حذف حسابات بعلاقات Assess محمية، دون تعطيل triggers أو تغيير FK. لا finalise على حساب حقيقي لاختبار ذلك. لا ادعاء نتيجة CI أو نشر. لا استئناف Assess أو تغيير لقاعدة S-PILOT-15 القائمة. SUS تبقى الإنجليزية الأصلية بتعليمات عربية؛ العربية المنشورة تحتاج citation كاملًا واعتمادًا منفصلًا. حالات pending survey required الصادقة وحدود CSV/FK كما في التقرير السابق.

## 8. قائمة المالك والخطوة التالية

التسليم Draft PR فقط. ينفذ المالك الخطوات التالية **بالترتيب**، ثم لا عمل تلقائي آخر:

1. **(a)** أعد تشغيل [`supabase/checks/assess-staging-ready.sql`](../supabase/checks/assess-staging-ready.sql) المحدثة على المشروع `vlacestfruxooznrcjqc`. المتوقع كل الأعلام true **عدا** `runtime_or_launch_verified=false`. إن اختلفت، توقف وأرسل أسماء الأعلام فقط؛ لا إعادة الترحيلات الناجحة.
2. **(b)** بعد النجاح، عيّن متغير GitHub `PILOT_SCHEMA_VERIFIED` إلى:
   `pilot-v1:a514b79f52c5816ec767730da1f88a38efad7da795bf977abef751ca7542ee10`.
3. **(c)** أعد تشغيل CI ثم ادمج؛ تخرج المزايا وTerms وCONSENT_VERSION وإعادة الموافقة معًا. لا يغير الوكيل المتغير أو يدمج المسودة.
4. **(d)** افحص الهاتف EN/AR: الموافقة الجديدة وروابط Terms؛ home والتذكير مع استمرار التدريب؛ feedback وSUS؛ موافقات المالك والحذف والاستعادة والاستبيانات وCSV، ومراجعات A/B/C1 الباقية. لا hosted preview ولا اختبار finalise على حساب حقيقي أو تغيير أوقات حقيقية.

**سؤالا AGENTS:** هل تغير الحكم؟ تغيّر توقيت التأجيل إلى وصل DB day بتفويض المالك الحالي، وترقية المتطلبات والشهادة والموافقة متزامنة؛ سياسة C2 وS-PILOT-15 وحدود Assess لم تتغير؛ تصحيح مراجعة المالك أعاد نص سياسة الاحتفاظ الأصلي حرفيًا وأبقى نافذة الحذف الفردي إضافة مستقلة. هل بقي رابط الدليل الأصلي؟ نعم: [قرار C1/DB day السابق](DECISIONS.md#rad069-deferred-db-day-2026-10-24)، [قرار C2](DECISIONS.md#rad069c2-owner-2026-10-24)، [تصحيح Phase 2](DECISIONS.md#rad069c2-phase2-deferred-ui-2026-10-24)، [تقريرها](RAD-069C2_PHASE2_REPORT_2026-10-24.md)، و[تقرير TRIAL](ASSESS_TRIAL_FINAL_REPORT_2026-10-22.md) باقية؛ [قرار اليوم](DECISIONS.md#rad069-db-day-owner-2026-10-24) مرتبط بها.

نص المتابعة: «اقرأ AGENTS والتقرير؛ تحقق من نتيجة staging والشهادة وCI والهاتف التي ينفذها المالك، دون إعادة SQL أو افتراض نشر. لا Assess إلا بأمر resume Assess مستقل». **بعد تسليم المسودة يتوقف الوكيل.**
