# تقرير Dependabot وبوابة CI audit — 2026-11-01

## 1. الانحرافات والميزانية
الهدف: تحديثات أمنية آلية مع بقاء الدمج للمالك. ستة ملفات فقط:
`.github/dependabot.yml`، `.github/workflows/ci.yml`، `docs/DECISIONS.md`،
`docs/project-status.md`، `docs/HANDOFF.md`، وهذا التقرير. لا انحراف؛ HANDOFF سطر واحد.
لا إغلاقات معلقة لهذه الدفعة؛ RAD-062 وأدلتها بلا تعديل.
السلطة: [قرار المالك](DECISIONS.md#dependabot-owner-2026-11-01)، امتدادًا [للبند3](DECISIONS.md#db-followups-owner-2026-11-01).

## 2. المنجز والمتروك
- Dependabot v2: npm في `/`، الأحد09:00 Asia/Amman، أسبوعيًا، حد3 لطلبات تحديث الإصدارات.
- `npm-minor-patch` تجمع minor/patch؛ major منفصل، label `dependencies`، prefix `deps`.
- GitHub Actions في `/` أسبوعيًا في الموعد نفسه؛ مجموعة `github-actions` لكل الإجراءات، prefix `ci`.
- الغرض يشمل تحذيرات Node20 في checkout/setup-node؛ تبقى المراجع SHA وتعليقات الإصدار ليحدّثهما Dependabot.
- خطوة `npm audit --audit-level=high` مباشرة بعد `npm ci`؛ تشمل dev وprod بلا omit أو تخفيف.
- لم تتغير الحزم أو lockfile أو المنتج أو الصلاحيات أو Docker؛ لا auto-merge/approve أو assignees.

## 3. لكل مهمة
RAD-091 «Dependabot and CI audit gate»: `review`، `waiting_on: owner`.
`done_when`: PR merged + CI green incl. audit step + owner enabled Dependabot alerts/security updates in Settings + first Dependabot PR observed
كل المهام السابقة محفوظة؛ شروط RAD-062 وإغلاقات دفعة4د خارج هذه الدفعة.

## 4. التغييرات المشتركة وScale — S-STD-3
الحد3 يضبط طلبات version updates المفتوحة لـnpm، ولا يثبت حدًا مماثلًا لطلبات security updates.
الجدولة أسبوعية وليست مراقبة لحظية؛ security updates تحتاج تفعيل Settings من المالك.
رفع الحد أو تغيير التواتر عند تراكم تحديثات مراجعة قرار لاحق للمالك؛ لا دمج آلي.
فحص audit يتبع بيانات npm وقت التشغيل؛ high/critical مستقبلية توقف CI وتحتاج إصلاحًا مراجعًا.

## 5. الطب والتقييم
لا تغيير طبي أو درجات أو marker أو golden/characterisation/scene hashes.
ملفا بوابة المخطط وfrontend-schema مطابقان لـmain؛ مدخلات بصمة المخطط بلا تعديل.

## 6. QA
| الفحص | التصنيف والنتيجة |
|---|---|
| `npm audit --audit-level=high` على main `515017c` قبل التعديل | Verified — exit0، 16 moderate فقط |
| `npm ci` على الفرع | Verified — exit0؛ Node24.19.0 / npm11.9.0 محليًا، CI يبقى Node22 |
| `npm audit --audit-level=high` بعد التعديل | Verified — exit0 بعد npm ci، 0 high و0 critical |
| `npm audit --json` | Verified — 16 moderate، 0 low/high/critical؛ exit1 متوقع للـmoderate في audit الكامل |
| YAML للملفين dependabot/ci | Verified — PyYAML parse نجح |
| مخطط Dependabot | Verified — jsonschema Draft7 نجح مقابل [SchemaStore](https://raw.githubusercontent.com/SchemaStore/schemastore/master/src/schemas/json/dependabot-2.0.json) |
| `docs:sync` مرتين، ثم docs/status checks وdiff | Verified — الأولى حدّثت الحالة فقط؛ الثانية0 ملفات، checks نجحت بلا أخطاء |
| نطاق التعديل | Verified — CI القديم مطابق بعد حذف خطوة audit الوحيدة؛ كل المهام السابقة وملفات الحزم/المخطط/النشر مطابقة لـmain |
| CI المستضاف وفتح أول Dependabot PR | Not run — ينتظر التشغيل المعتاد ومراجعة المالك؛ لا subscribe/poll |
| البناء واختبارات المنتج وDocker محليًا | Not run — لا كود منتج تغير؛ خطوات CI القائمة محفوظة |
| SHA وتعليق الإصدار في تحديثات Dependabot | Inferred — يحافظ Dependabot على أسلوب المراجع المثبتة؛ يؤكد المالك في أول PR |
| البصمة الحية في Repository Variables | Not run — لم تُقرأ أو تُغير الإعدادات؛ المدخلات المحلية لم تتغير |

تحذيرات docs الخمسة تخص الاقتراب من السقوف: أسطر AGENTS/HANDOFF وطول سطر HANDOFF ووصفَي RAD-059/RAD-060؛ لا أخطاء أو رفع للسقوف.

### Deploy Pages على Dependabot PR
**Inferred من قراءة workflow، لا تجربة PR فعلي:** المهمة `deploy` تبدأ ولا تُتخطى بكاملها؛
خطوة `Check Cloudflare secrets` تنجح وتكتب `enabled=false` عند غياب السرّين الافتراضي في Dependabot.
كل ما بعدها، بما فيه checkout/install/schema/build/upload/comment، مشروط بـ`enabled == 'true'`؛
لذلك تُتخطى خطوات النشر وتنتهي المهمة بنجاح، ولا يوجد فشل يتطلب قرار إصلاح.
`Require verified pilot schema` تعتمد على Repository Variables الثلاثة:
`NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` و`PILOT_SCHEMA_VERIFIED`، وليست أسرارًا.
تشغيلها نفسه مشروط بوجود سرّي Cloudflare؛ في PR المذكور تُتخطى قبل قراءة تحقق المخطط.
إذا شُغلت: غياب URL والمفتاح معًا يعطّل pilot بنجاح؛ نقص أحدهما أو attestation غير مطابق يفشل.
لا تعديل لـdeploy-pages.yml أو أي Variables/Secrets.

## 7. البنود المفتوحة
تبقى **16 moderate** في سلسلة eslint/typescript-eslint/minimatch كما هي وفق [التقرير السابق §7](DEPS_SECURITY_REPORT_2026-11-01.md#7-البنود-المفتوحة).
المحفز: ترقية eslint الرئيسية التالية أو ارتفاع أي منها إلى high؛ لا ادعاء بإغلاقها.
تفعيل Settings ورصد أول PR وCI المستضاف شروط خارجية لم تُثبت محليًا.

## 8. قائمة المالك الموحدة والمتابعة
1. افتح المستودع في GitHub، ثم **Settings**، ثم **Code security**.
2. عند **Dependabot alerts** اختر **Enable** وتحقق أن الحالة مفعّلة.
3. عند **Dependabot security updates** اختر **Enable** وتحقق أن الحالة مفعّلة؛ الوكيل لا ينفذ هذه الإعدادات.
4. راجع Draft PR وCI، خصوصًا خطوة audit؛ الدمج بيدك وحدك بعد نجاح الفحوص.
5. بعد الدمج راقب أول Dependabot PR؛ تحقق من التجميع وSHA مع تعليق الإصدار، ثم أبلغ بنتيجة الإعدادات وCI ورقم PR.
6. لا قرار إصلاح نشر مطلوب في حالة غياب الأسرار الافتراضية: النشر يُتخطى كما سبق. لا تمنح أسرارًا أو صلاحيات لهذه الدفعة.
طلب الجلسة التالية: «تحقق من أدلة RAD-091 وحدّثها في دفعة العمل التالية إذا استوفت done_when؛ اترك moderates مفتوحة».

**سؤالا AGENTS:** هل تغيّر حكم مختصر؟ لا؛ لا اختصار لقواعد قائمة، وهذا اعتماد جديد للأتمتة.
هل بقي رابط الدليل الأصلي؟ نعم: [قرار المتابعة3](DECISIONS.md#db-followups-owner-2026-11-01) و[تقرير الاعتماديات](DEPS_SECURITY_REPORT_2026-11-01.md) محفوظان.
