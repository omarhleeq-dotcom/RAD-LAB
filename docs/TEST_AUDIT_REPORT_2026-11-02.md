# تدقيق الاختبارات وCI — 2026-11-02

## 1. الانحرافات والميزانية

الهدف قياس المجموعة كاملة واقتراح دفعة تنظيف؛ التغيير ملفان جديدان فقط: هذا التقرير و[الجرد الآلي](TEST_AUDIT_INVENTORY_2026-11-02.json).
الأساس main المحدّث `3c887cb`، والفرع `test-audit/2026-11-02`؛ سقف [الميزانية](budgets.json) 150 سطرًا للتقرير، ولا سقف JSON معرفًا.
لم تتغير الحالة أو HANDOFF أو DECISIONS أو الاختبارات أو المصدر أو CI أو SQL أو الحزم أو البصمات؛ تسجيل المهمة مؤجل لدفعة التنظيف بأمر المالك.
سؤالا AGENTS: هل تغيّر الحكم؟ **لا**. هل بقي رابط الدليل الأصلي؟ **نعم**؛ لم تُختصر قاعدة، و[القرارات](DECISIONS.md#current-rules) محفوظة.

## 2. المنجز والمستبعد

Verified: حصر276 ملفًا:249 Vitest، و26 Node، وملف Python؛ الجرد يسجل لكل ملف غرضه وعناوين شواهده، الحماية، الزمن/الخطأ، المتطلبات، التداخل والهشاشة والحكم.
Verified: جرد إضافي71 برنامج بروفة/QA يدوي، مع المستدعين الآليين؛ helpers/fixtures ليست ملفات اختبار مستقلة. مصدر الاكتشاف Git ومطابقة إعداد Vitest وسجل CI.
استُبعد التنفيذ الحي وفحوص الهاتف والمتصفح والبناء وتوليد goldens/characterisation؛ لم تُفتح معاينة أو تُطلق جدولة أو إعادة CI يدوية.

## 3. النتائج لكل محور

Verified: آخر ثلاث CI خضراء على main أدناه؛ الأزمنة من start/finish عبر أداة GitHub للقراءة، والتوقيت الكامل لكل خطوة محفوظ في `ci.runs_newest_first` بالجرد.

| التشغيل، UTC | بداية job ← نهايتها | الزمن | هامش15د |
|---|---|---|---|
| [41406040457](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41406040457) | 07:23:59 ← 07:37:07 | 13:08 | 1:52 |
| [41375099049](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41375099049) | 01:57:02 ← 02:07:24 | 10:22 | 4:38 |
| [41368714110](https://github.com/omarhleeq-dotcom/RAD-LAB/actions/runs/41368714110) | 00:43:57 ← 00:54:33 | 10:36 | 4:24 |

كلها2026-11-02؛ تشمل أزمنة job فروقًا صغيرة عن إنشاء workflow/انتظار runner. الجدول التالي بالثواني، بالأحدث أولًا؛ الصفر دقة ثانية أو خطوة متخطاة مسماة.

| خطوة CI بالترتيب | الأحدث | السابق | الأقدم |
|---|---|---|---|
| تهيئة job | 1 | 0 | 1 |
| checkout / setup-node | 3 / 4 | 3 / 4 | 4 / 1 |
| npm ci | 57 | 13 | 50 |
| npm audit high | 2 | 2 | 22 |
| apt: age وPG16 | 10 | 9 | 9 |
| سحب Supabase17.11 | 16 | 17 | 15 |
| ICU restore المستقل | 7 | 8 | 6 |
| laptop + data-precheck | 29 | 28 | 25 |
| الكتالوج الحقيقي CRLF | 23 | 21 | 19 |
| سحب postgres17.11 | 5 | 5 | 5 |
| تجهيز embedded PG | 2 | 2 | 2 |
| emergency stop | 21 | 21 | 20 |
| lock witnesses | 12 | 11 | 10 |
| erasure recovery | 0 | 0 | 1 |
| worker rehearsal | 33 | 32 | 30 |
| docs:check / docs:test | 2 / 23 | 2 / 22 | 2 / 19 |
| Python / connection probe | 0 / 0 | 0 / 0 | 0 / 1 |
| typecheck / lint | 17 / 28 | 15 / 26 | 15 / 25 |
| Vitest | 436 | 325 | 297 |
| انتقال الحالة، PR فقط: skipped | 0 | 0 | 0 |
| build / build:pages | 27 / 28 | 26 / 27 | 26 / 27 |
| post-node / post-checkout / complete | 0 / 0 / 0 | 0 / 1 / 0 | 1 / 0 / 0 |

Verified: المسار الحرج هو جميع خطوات job الوحيدة متسلسلة؛ الأحدث: إعداد67ث ← أدوات/بروفات158ث ← docs25ث ← type/lint45ث ← Vitest436ث ← بناء55ث ← إنهاء≈2ث.
Verified: Vitest ازداد111ث عن السابق؛ npm ci ازداد44ث. سجل الأحدث يثبت **cache hit** لـnpm، لذلك نسبة التباطؤ كلها إلى غياب cache غير صحيحة.
Verified: سجل الأحدث249 ملفًا/3350 اختبارًا ناجحًا؛ مجموع أزمنة الملفات1170.518ث متداخل، ولا يساوي زمن CI البالغ435.40ث في reporter.
أثقل الملفات: M09 grading189.071ث، locks101.815ث، catalogue29.030ث؛ ثم trial-reviewed42.427ث وrad085-db39.171ث وrad085-d3-db38.659ث.
Verified: [ICU](../scripts/docs/laptop-icu.test.mjs) ينفذ مرتين: [الخطوة المستقلة، سطر32](../.github/workflows/ci.yml) ثم glob [docs:test](../package.json)؛ الوفر المقاس الممكن6–8ث، **OWNER DECISION REQUIRED**.
Verified: ستة مواضع تطابق قائمة required/checks الكاملة: name:55، freeze:72، lifecycle:257، manual:215، erasure:353، وNode db-day:90/99؛ المسارات والأسطر والتأكيدات في `overlap_groups` بالجرد.
توجد أيضًا pins جزئية لـprovenance/limits/random؛ ليست ستة اختبارات متطابقة: الشواهد الطبية/السلوكية والعبث والصلاحيات والrollback مستقلة وتبقى كلها.
Verified: Node phone-packet وrad062-name يصلان عبر أغلفة Vitest، لا خطوتين مستقلتين إضافيتين؛ security-rehearsal.test.mjs الكامل غير موصول بـCI، بينما lock-witness يشغل فرعه المقيد.
Inferred: اللقطات التاريخية مهمة للتوافق، لكنها تتطلب تاريخ Git كاملًا وSHA ثابتة ومرشحات ترحيل وcwd مؤقتًا؛ لا تصلح برهانًا للمخطط الحالي وحدها.
Verified: سبعة scene-dom tests تكتب baseline عند غيابه حتى دون UPDATE؛ هذا قد يخفي فقد ملف golden. اقتراح تقوية: الفقد يفشل؛ التوليد يبقى بإذن مستقل، دون تغيير بصمة حالية.

## 4. البنية المقترحة وScale

جميع الأرقام التالية **تقديرات Inferred** إلا الأزمنة المقتبسة أعلاه؛ ليست وفرًا محققًا، ولا تُجمع الخيارات المتداخلة حسابيًا.

| الخيار | الوفر/المسار المتوقع من الأحدث | الثقة والمخاطر وما يبقى محميًا |
|---|---|---|
| 1A: أربع jobs: unit، DB+Docker، docs/status، build | نحو9:30–10:30 بدل13:08؛ وفر2:38–3:38 | متوسطة-منخفضة؛ نموذج71 ملف DB/178 غيرها، لا مجرد فصل npm test كله في unit. كل شاهد باقٍ، إعداد PG والصور في job DB. |
| 1B: فصل DB Vitest عن البروفات أيضًا، خمس jobs | نحو7:30–8:30؛ وفر4:38–5:38 | منخفضة؛ كلفة runners وnpm إضافية وتفاوت CPU/ذاكرة. انتهاء جميع jobs شرط check جامع. |
| 2: بروفات ثقيلة مشروطة بالمسارات على PR | إزالة≈125ث بروفات وحتى15ث أدوات من lane DB؛ M09 يبقي صورة Supabase وembedded PG لازمتين | منخفضة؛ تغيير شرط no-skip يحتاج OWNER DECISION REQUIRED. كامل main إلزامي، وكامل قبل كل نافذة DB حية، والحراس السريعة دائمًا؛ الوفر الحرج يتبع الخيار1. |
| 3: اختبار عالمي مستقل للmanifest/promotion | سقف مرشح من مجموع اختبارات pins≈0–10ث؛ لم يُعزل زمن التأكيدات | منخفضة؛ الهدف تقليل كلفة التعديل أكثر من الزمن. OWNER DECISION REQUIRED؛ توقع مستقل مراجع، لا اشتقاق المتوقع من manifest الجاري نفسه. |
| 4: templates للـDB وتجريب pools معزولة | هدف تجريبي10–25% من زمن lane DB، لا وعد؛ لا قياس قبل/بعد | منخفضة؛ ترحيل baseline مرة ثم clone لكل حالة؛ roles/ACL وrollback والتوقيت والنسختان والlocale ثابتة. لا isolate:false عام. |
| 5: cache صور Docker | سقف إجمالي السحب20–22ث، الصافي قد يكون صفرًا أو سالبًا | منخفضة؛ كلفة حفظ/load صورة كبيرة غير مقاسة، digest نفسه مطلوب. npm cache موجود بالفعل. |
| 5: npm/Next/artifacts | npm ci يتراوح13–57ث رغم hit؛ لا وفر مضمون. بناء CI العادي+static يكلف53–55ث | منخفضة؛ cache `.next/cache` بمفاتيح lock/config ونمط البناء، ولا مشاركة output بين static/server. فصل النمطين يحميهما. |

نموذج1: أزمنة ملفات CI بالأحدث، جدولة أطول ملف أولًا على3عمال؛ DB≈341ث وunit≈49ث قبل overhead. تُضاف إعدادات/بروفات158ث وبداية67ث، ثم هامش للتهيئة والتفاوت.
في1B يصبح DB Vitest المسار الحرج بدل جمعه مع البروفات؛ الأرقام تفترض runners متاحة، لا تثبت زمن الطابور أو تكلفة الفوترة. التقسيم والجدولة محفوظان بالجرد بعد اكتمال القياس.
M09 يستعمل template بالفعل لكل ملف:27/25/8 clones، وأزمنة fixture81.12/38.16/12.51ث؛ هذه ليست مقارنة مع بديل، ولا يجوز احتسابها وفرًا متاحًا.
نطاق path filters يجب أن يتتبع المستدعين: SQL/checks/fixtures، scripts، المصدر المتصل بالDB، workflow/lock/config، وحزم الهاتف/وثائق يقرأها الكود؛ المسار المجهول يشغل الكامل.
حد Scale: forecast من3تشغيلات خضراء فقط، بلا quantiles أو A/B؛ يُرفع بعد دفعة تجريبية تقيس نفس الرأس والحراس والذاكرة والمهلات دون رفع timeout15.
Verified: Deploy Pages مستقل عن نجاح CI ويعيد npm ci وbuild:pages؛ schema gate يحمي توافق DB فقط. توحيد artifact لا يصح دون نفس public variables/schema gate ونمط البناء؛ لا تغيير نشر بهذه الدفعة.

## 5. الطب والدرجات والحراس

تبقى displayed-text والكلمات المحظورة، session-account، schema gate/marker، خصوصية supervisor-review، emergency packets، goldens/characterisation/scene hashes محمية.
لا توصية بحذف حارس أو تخفيفه؛ كل دمج للتأكيدات المحمية موسوم **OWNER DECISION REQUIRED** مع الدليل. دمج الملف ليس إذن تغيير العدد/النافذة/النتيجة أو تطبيع SQL.
لا تغيير طبي أو درجات ولا إثبات سريري؛ اختبارات geometry/pixels/scoring طبقات مختلفة وليست تكرارًا لمجرد اشتراك الحالة.

## 6. QA وحدود الأدلة

Verified: قراءة AGENTS/HANDOFF/DOCS_CHECKS/budgets/template وworkflows/scripts/config والقرارات؛ فحص #200 قراءة واحدة: Draft مفتوحة؛ ملفاتها محفوظة خارج نطاق الدفعة.
قيد القياس المحلي: Node24 مقابل22 في CI؛ nproc=3 لكن availableParallelism=2 وعامل Vitest واحد مرصود. محاولة sandbox الأولى أوقفت بسبب spawnSync EPERM؛ أعيدت بإذن الشبكة المدعوم.
Verified: Vitest JSON اكتمل في616.99ث؛246 ملفًا نجحت، وثلاثة M09 جزئية:3290 حالة ناجحة و60 Not run (env) لخطأ `No such image: supabase/postgres:17.11.0.016@sha256:6ce438…`؛ الخطأ الكامل لكل ملف بالجرد، ولا فشل مستقل عن البيئة.
Verified: Node المحلي19/27 ملف Node+Python نجحت؛8 محجوبة/جزئية: age-keygen ENOENT، psql غير متاح، /usr/lib/postgresql مفقود، صور Docker مفقودة، وpgtools/pg_dump ENOENT؛ الأخطاء حرفيًا في الجرد.
Not run (env): البروفات المستقلة وفحوص المتصفح، لعدم تجهيز server موثوق/backup أو جلسات المالك. out/.next موجودان لكن رأس بنائهما غير مثبت؛ لا اعتماد عليهما.
Verified: docs:check وstatus:check مقابل origin/main نجحا؛ أربعة تنبيهات سقف سابقة: AGENTS38/40، التصميم147/150، وصفRAD-059 وRAD-060؛ بقيت دون تعديل وفق النطاق.
Verified: docs:sync مرتان، كل مرة0 ملفات محدثة؛ git diff --check وفحص staged نجحا؛ مقارنة main تثبت أن الملفين الجديدين فقط تغيرا، وحصر الجرد يطابق276 مسارًا وبصمة المصدر لكل منها.

## 7. الفجوات والبنود المفتوحة

Verified: M09 catalogue يستدعي inspectM09، لكن لا اختبار يستدعي rehearseM09 كاملًا من backup مشفر إلى restore callback/STOP/teardown؛ يلزم شاهد اصطناعي ثم أحدث snapshot مراجعة قبل النافذة الحية.
Inferred: session-account regex يستثني ما بعد النقطة ويختبر named imports؛ namespace import ثم `x.useAccount()` فجوة حارس قريبة قابلة لشاهد سلبي، دون تغيير حكم الحساب الواحد.
Verified: لا coverage reporter/threshold في الأوامر الحالية؛ عدم وجود ملف مماثل للاسم ليس برهان فجوة. الجرد يميز overlap مؤكدًا عن shared-import candidate، ويورد كل حدود الاكتشاف.
Verified: Playwright/axe وفحوص EN/AR390/1440 يدوية؛ تعليق Deploy بأنCI يغطي Playwright غير مطابق للأوامر؛ حراس SSR/DOM لا تثبت سلوك المتصفح أو لمس الهاتف.
Inferred: فشل missing-baseline، اختبار finalize-headers على out مؤقت، وربط نشر Pages بنجاح CI تغطية/سياسة إضافية مقترحة؛ لا تعني أن headers helpers أو schema gate بلا اختبارات.

## 8. قائمة المالك الموحدة لدفعة التنظيف

1. اختر A=أربع jobs أولًا، B=خمس، C=إبقاء البنية؛ مع قياس نفس الرأس وإلزام جميع الحراس وcheck جامع، دون رفع timeout.
2. نعم/لا: السماح مستقبلًا بتصفية البروفات الثقيلة على PR فقط، مع full main وfull إلزامي قبل كل نافذة DB، وfail-open إلى الكامل للمسار المجهول؟
3. نعم/لا: OWNER DECISION REQUIRED لنقل التنفيذ المكرر لـICU إلى مسار إلزامي واحد، مع بقاء الشاهد كاملًا وفشله حاجبًا؟
4. نعم/لا: OWNER DECISION REQUIRED لتجميع pins العالمية الستة في اختبار مستقل ذي توقع مراجع، مع حفظ كل الشواهد الخاصة والbytes/marker واللقطات التاريخية؟
5. نعم/لا: تجربة templates لكل baseline/version/locale وعمال محددين، مع عزل كل حالة وroles/ACL وبدون isolate:false عام؛ واعتماد cache فقط إذا قيس وفر صافٍ؟
6. نعم/لا: إضافة شهود rehearseM09/namespace-account/missing-golden/finalize-headers؛ وإدخال security-rehearsal الكامل بعد إصلاح تجهيز أدواته في نطاق مستقل؟
7. اختر A=إبقاء نشر Pages المستقل، B=تصميم نشر ينتظر CI مع schema/public-env/artifact مطابق؛ القرار لا ينفذ نشرًا الآن.
8. نعم/لا: بدء دفعة تنظيف مسماة بالاختيارات المقبولة وميزانية جديدة؛ أول commit يسجل مهمة التدقيق والإغلاقات المأذونة، وتبقى هذه PR Draft فقط؟
