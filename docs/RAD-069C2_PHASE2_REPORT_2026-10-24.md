# RAD-069 C2 — المرحلة2، 2026-10-24

## 1. الانحرافات والميزانية

الهدف تجهيز واجهات الحذف والاستبيانات دون وصلها بالصفحات الحية. تحقق docs:context من دمج PR #127؛ الفرع من أحدث origin/main. رفض المالك استثناء الحارس، واعتمد [التجهيز عبر adapters](DECISIONS.md#rad069c2-phase2-deferred-ui-2026-10-24). قائمة الميزانية الأولية19 ملفًا؛ استبدلت c2-client-deferred.ts بـc2-contract.ts لتبقى serverModules مطابقة لاختبارها القديم. frontend-schema.json ضمن الميزانية لكن لم يلزم تغييره. سقف الملفات المتغيرة الفعلي18: c2-ui/c2-contract/OwnerDeletion/OwnerSurveys/ParticipantSurvey/ExternalSurveyCard/AccountPanel؛ اختباران جديدان c2-ui وc2-client-deferred؛ messages EN/AR؛ سكربت تدقيق C2؛ DECISIONS/PILOT_SUPABASE_SETUP/project-status/HANDOFF/هذا التقرير؛ لقطة مراجعة واحدة. لا ملف خارج القائمة.

## 2. المنجز والمؤجل

جهزت مكونات محقونة غير موصولة: الحذف بتأكيد من خطوتين وإقرار ونهائية30يومًا ونسخ المزوّد، directory C2 المستبعدة للحذف، pending/days/restore وزر finalise المحدود؛ جولات وإصدارات وفتح/إغلاق وفاصل وإجابات وCSV مجزأ؛ بطاقة تذكير غير مانعة ونموذج مرتبط بمعرف pending وحالات الإرسال. أزيل عرض البطاقة الخارجية فقط، وكودها محفوظ في ExternalSurveyCard والمتغير ودوال survey.ts بلا تغيير. الوصل وDB day والموافقة والإطلاق مؤجلة.

## 3. حسب المهمة

RAD-069 تبقى review/owner. C1 وC2 Phase 1 مدموجتان، وتجهيز Phase 2 في [المسودة #128](https://github.com/omarhleeq-dotcom/RAD-LAB/pull/128) للمراجعة، دون ready/merge. مراجعات A/B والهاتف القائمة محفوظة؛ RAD-044 مغلقة بإثبات المالك السابق، ولا طلب لبياناته.

## 4. المشتركات وScale

لا تعديل لحدود اتصال قائمة؛ adapter في c2-contract المصنفة deferred لا تستوردها المكونات. التعريفات ذات إصدارات من الخادم، حتى10أسئلة و1000حرف للنص لكل سؤال. الصفحات20 والتصدير100إجابة في الملف (سطر مستقل لكل سؤال لضمان formula escaping على النص الحر)، وfinalise حتى100بضغطة؛ لا تجميع شامل بالمتصفح أو retry/timer/cron. صفحات CSV ليست snapshot ثابتة؛ الإجابات المضافة أثناء التنزيل قد تحتاج تصديرًا جديدًا، وفق pagination الـRPC القائمة. الفاصل7–3650يومًا من الخادم، ولا أهلية محسوبة محليًا. زيادة الحدود تحتاج مراجعة SQL يوم القاعدة، لا توسيعًا صامتًا. محليتا المنتج EN/AR قائمتان؛ SUS الإنجليزية فقط، وتبقى الأنواع/الإصدارات الأخرى بيانات لا قائمة مغلقة. العرض لا يُدخل أسماء أو بريدًا من إسقاطات C2 إلى DOM أو CSV أو logs.

## 5. الطب والتقييم

لا تغيير للتقييم أو scoring التدريب أو المحاكي أو المشاهد أو الصور أو منطق الثيم أو الرسوم أو hashes أو توقع اختبار قديم؛ لا qa:golden/qa:characterise. درجة SUS تُعرض من إسقاط الخادم ولا تحسب في React، وليست درجة طبية أو تدريب. تستعمل المكونات tokens الموجودة وRTL.

## 6. التحقق

- `npm ci` المقفل نجح دون تعديل package.json/lock. typecheck الأول قبل التثبيت تعثر بسبب غياب Supabase/PGlite، ثم نجح بعده. دفعة الواجهات دفعت بعد typecheck وlint والمستهدف:5ملفات/24اختبارًا (الجديدان وsurvey القديم وحارسا C1/C2 المؤجلان). lint بلا errors، بتحذيري vb/inv السابقين فقط في simulator-layout-audit خارج الميزانية.
- `npm run check` الكامل الأول:177ملفًا و2688اختبارًا نجحوا؛ فشل واحد في displayed-text القديم لأن العبارة **الجديدة** c2.susEnglish احتوت كلمة validated المحظورة عالميًا. عدلت العبارة الجديدة إلى عدم اعتماد إصدار عربي هنا، دون تغيير أي توقع أو كلمة قديمة أو حكم SUS. نجح المستهدف displayed-text بعدها12/12. إعادة `npm run check` بعد هذا الإصلاح نجحت كاملة:178/178ملفًا و2689/2689اختبارًا،212.96ثانية؛ شملت typecheck وlint، ولا إعادة بعد النجاح.
- `node scripts/qa/rad-069c2-audit.mjs`: harness مستقل يجمع المكونات الحقيقية وNextIntl والرسائل وCSS/tokens والخطوط المحلية؛ لا صفحة حية أو import للـRPC adapter المؤجلة. نجحت EN/AR ×390/1440 ×dark/light ×missing/mock للمالك (حذف + جولات) والتذكير والنموذج:328تحققًا و65axe بلا violations أو overflow أو page errors أو شبكة. تشمل تأكيد خطوتين/30يومًا/restore/finalise/paging/open/close/gap، وصحة id للإرسال، وCSV جزأين100+1 بلا prefetch مع formula escaping والعربية/الاقتباس والأسطر، ورفض غير المالك وأخطاء adapter وحالات already/closed/stale/unavailable/error وغياب أهلية من الخادم. مصفوفة missing تمثل الدوال الغائبة، ولا تدعي اتصال القاعدة الحالية. محاولات إعداد harness توقفت في محددات fixture/ترتيب restore؛ أصلحت الأداة وحدها، ثم أكملت المصفوفة بنجاح.
- بعد تعديل شرح SUS الإنجليزي فقط، شغلت `node scripts/qa/rad-069c2-audit.mjs --english-sus-only`:20تحققًا و4axe إضافية ناجحة لـEN390/1440 والثيمين. لم تُعد المصفوفة الناجحة غير المتأثرة. `--sheet-only` أعاد تركيب صورة المراجعة فقط، بلا تكرار UI QA. [اللقطة](review/rad069c2-ui.jpg) عينات AR390 dark،171891بايت (نحو168KiB)، دون5MB. الصور المحلية التفصيلية خارج Git؛ راجعت اللقطة بصريًا، وكل البيانات اصطناعية، مع فحص حالات غياب الدوال دون عرض raw errors أو retry loop.
- `npm run docs:test`:75/75نجح. فحصا status transition وdocs نجحا قبل الدفعة الأولى:0errors و0review warnings؛ نجحت إعادتهما لتغييرات التقرير/التسليم المتأثرة في الدفعة الأخيرة:0errors و0review warnings، وفحص الانتقال مقابل origin/main ناجح. `git diff --check` نجح.
- إثبات byte/graph مستقل: manifest كله مطابق للأصل، وكل browserBoundaries تطابق الملفات الفعلية؛ c2-contract.ts غير reachable من frontend. كل رسائل EN/AR القديمة مطابقة، بما فيها consent/terms. SQL/checks/الحارس/attestation وملفات اتصال/لوحة C1 والموافقات وCSV الأصلية والرسوم والتقييم والمحاكي والمشاهد والصور والاختبارات القديمة بلا تغيير. لا hashes أو goldens/characterisation يعاد توليدها.
- إثبات الشهادة offline بالمشروع الأصلي ومفتاح **اصطناعي عام**، بلا اتصال DB:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://vlacestfruxooznrcjqc.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_synthetic_local_test_123456 PILOT_SCHEMA_VERIFIED=pilot-v1:0bc3743c707cff0fcef456d00096f6e186b759390708d2d963a6eabea55e5d52 node scripts/pages/pilot-schema-gate.mjs --print-marker
```

الخَرْج حرفيًا، exit0:

```text
pilot-v1:0bc3743c707cff0fcef456d00096f6e186b759390708d2d963a6eabea55e5d52
```

`npm run build:pages` نجح بمتغيرات الاختبار نفسها، بما فيها الشهادة الحالية؛ اكتمل Next build والتصدير وfinalize-headers. تحقق أيضًا حارس المخطط العادي و--print-marker بـexit0. فحص ناتج out أثبت عدم وجود أسماء RPCs الأربع في ملفات المتصفح المبنية. لم تشغّل qa:golden/qa:characterise أو SQL حي أو خدمة/cron أو بيانات حقيقية أو preview أو subscribe/poll. لا نجاح CI أو نشر أو backup/restore/provider verification مفترض.

## 7. المفتوح

الوصل يوم القاعدة فقط؛ كل C2 غير mounted، فلا توجد صفحة feedback حية جديدة الآن. تعليمات الوصل الدقيقة في دليل الإعداد. العربية SUS قرار مالك مفتوح: لا citation لترجمة validated معتمدة في المستودع، فتستعمل البنود الإنجليزية الأصلية مع تعليمات عربية؛ citation Brooke1996 من تعريف SQL القائم. RPC لا تميز pending survey required بعد answered/cancelled؛ يظهر نص صادق بالاحتمالين، وround closed الصريح منفصل. لا تغيير SQL أو gate لتجاوز ذلك. تأكيد GoTrue وJWT/backup/restore/provider retention والقيود الذرية CASCADE والهاتف ليست مثبتة باختبارات fixtures.

## 8. قائمة المالك والخطوة التالية

دفعة الواجهات commit/push ثم دفعة QA والتقرير commit/push، والمسودة #128 باقية draft/open وغير مدموجة عند التحقق؛ لا subscribe/poll أو preview. HANDOFF22سطرًا، وRAD-069 محدثة في الدفعتين بلا تغيير مهمة أخرى. بعد مراجعة المسودة، ينفذ DB day مستقلًا وفق [القائمة](PILOT_SUPABASE_SETUP.md#owner-dashboard-c1) و[patch الوصل](PILOT_SUPABASE_SETUP.md#c2-phase2-wiring): جرد المشروع والنسخ/الاسترداد؛ تطبيق C1 ثم C2 فقط وبالترتيب؛ كل checks الحالية ثم فحصا C1/C2 والتحقق من الخدمة والصلاحيات بعينات؛ وصل adapters والواجهات وحراس الجلسة ودليل C2 لجميع القوائم؛ جعل C1/C2 والفحصين required وتحديث browserBoundaries؛ check/build والتدقيق؛ شهادة جديدة واحدة؛ إطلاق consent/الشروط وإعادة الموافقة والمزايا معًا. لا SQL أو تغيير شهادة أو CONSENT_VERSION الآن. لا استئناف Assess أو تنفيذ مشرف أو ready/merge.

**سؤالا AGENTS:** هل تغير الحكم؟ تصحح توقيت الوصل فقط بأمر المالك: تجهيز الآن ووصل يوم القاعدة، لا استثناء للحارس؛ سياسة الحذف والاستبيانات ثابتة. هل بقي رابط الدليل الأصلي؟ نعم، [قرار C2](DECISIONS.md#rad069c2-owner-2026-10-24) و[استثناؤه القديم المحدد](DECISIONS.md#rad069c2-test-exception-2026-10-24) وتقرير المرحلة1 وقرارات C1/DB day باقية، والتصحيح الجديد مرتبط بها ولا يمحوها.
