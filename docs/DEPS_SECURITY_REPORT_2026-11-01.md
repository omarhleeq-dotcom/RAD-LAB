# تقرير ترقية next وإغلاق npm audit critical/high — RAD-088، 2026-11-01

السلطة: [قرار المالك3 بعد يوم القاعدة](DECISIONS.md#db-followups-owner-2026-11-01) («الترقية التالية إلى patched16.4.x وإغلاق critical/high findings»). المهمة: RAD-088 في [الحالة](project-status.md).

## 1. الانحرافات والميزانية

الميزانية: `package.json` و`package-lock.json` و`docs/project-status.md` و`docs/HANDOFF.md` وهذا التقرير. لا انحراف عن الميزانية. `DECISIONS.md` لم يُعدَّل؛ بند moderate المفتوح مسجّل هنا (§7) لا كقرار جديد.

انحراف إجرائي واحد: توقفت محاولة Codex السابقة قبل الترقية بسبب عائقي بيئته (`ERR_SWC_NATIVE_CACHE` في البناء، و`no space left on device` في سحب صور Docker) دون تغيير اعتماديات أو فتح PR. بموافقة المالك نُفذت الدفعة في جلسة Claude Code على فرعها المخصص بدل `deps/next-16-4-security`. لا يحتاج أي من العائقين تغييرًا في المشروع؛ بناء `main` نجح في هذه البيئة قبل الترقية.

## 2. المنجز والمتروك

| الحزمة | قبل | بعد | النوع |
|---|---|---|---|
| next | 16.3.8 | 16.4.3 | مباشرة (`^16.4.3`) |
| eslint-config-next | 16.3.8 | 16.4.3 | مباشرة dev (`^16.4.3`) |
| zod | 4.6.5 | 4.6.7 | غير مباشرة عبر eslint-plugin-react-hooks؛ lockfile فقط |
| vite | 8.3.2 | 8.3.5 | غير مباشرة عبر vitest؛ lockfile فقط |

تبعات lockfile نفسها: `@next/env` و`@next/eslint-plugin-next` و`@next/swc-*` إلى16.4.3، و`rolldown`1.2.12→1.2.16 مع `@rolldown/binding-*`، و`@oxc-project/types`0.152.0→0.156.0، و`postcss`8.5.29→8.5.32 (كلها ضمن النطاقات القائمة). لا حزمة أضيفت أو حذفت، ولا overrides، ولا تغيير نطاق آخر، ولا `npm audit fix`.

طريقة vite: `npm update vite` في npm10.9.4 يفشل بعلة arborist داخلية (`Cannot read properties of null (reading 'edgesOut')` في `#loadPeerSet`). الحل بأدوات npm10 نفسها: `npm install -D vite@8.3.5` ثم `npm uninstall vite`، فبقي vite غير مباشر ولم يتغير `package.json`. جُرّب npm11 وتُرك لأنه غيّر صيغة lockfile وإصدارات wasm اختيارية خارج النطاق.

متروك عمدًا: 16 moderate (§7).

## 3. لكل مهمة

- **RAD-088** جديدة: `review`/`owner`؛ تنتظر دمج المالك ثم فحص الهاتف المختصر (§8). لا تُغلق قبل ذلك.
- RAD-062 وRAD-059 وRAD-085 وغيرها بلا تغيير.

## 4. التغييرات المشتركة وScale (S-STD-3)

لا كود منتج أو مخطط أو migration أو سكربت. الحد: الاعتماديات مثبتة بنطاقات caret وlockfile؛ الثغرات المستقبلية تظهر في `npm audit` ولا فحص آلي له في CI اليوم. Trigger الرفع: كل دفعة اعتماديات تالية تبدأ بـ`npm audit` وتغلق critical/high بنفس الطريقة؛ إضافة فحص audit إلى CI قرار مفتوح للمالك.

## 5. الطب والتقييم

لا تغيير طبي أو تقييمي. golden/characterisation/scene hashes غير معاد توليدها، وكل اختباراتها نجحت دون تعديل.

## 6. QA

| الفحص | النتيجة |
|---|---|
| `npm ci` من lockfile الجديد (npm10.9.4، Node22) | نجح |
| `npm audit` | قبل 1 critical + 2 high + 16 moderate = 19؛ بعد 0 critical + 0 high + 16 moderate = 16 |
| العلامة `pilot-schema-gate.mjs --print-marker` | قبل وبعد `pilot-v1:a405c50c…ba6c93c`، مطابقة لقيمة Variable |
| `npm run typecheck` | نجح |
| `npm run lint` | 0 أخطاء؛ تحذيران في `scripts/qa/simulator-layout-audit.mjs:67` موجودان على `main` قبل الترقية بنفس العدد |
| `npm test` | 241 ملف و3198 اختبارًا نجحت. شُغّل كمستخدم غير root على نسخة من الشجرة لأن `initdb` المدمج يرفض root في هذه البيئة؛ تشغيل root فشل بهذا السبب وحده (165 اختبار DB) |
| `npm run build` | نجح |
| `npm run build:pages` و`out/` | 609 ملفات قبل وبعد؛ الملفات غير `_next/static` (574) متطابقة الأسماء؛ الفرق محصور في أسماء chunks المجزّأة ومجلد build id (30 js و1 css في الطرفين) |
| `docs:check` و`status:check --require-previous` و`git diff --check` | نجحت: 0 أخطاء و0 تحذيرات مراجعة، والانتقال مفحوص من نقطة التفرع |
| تجارب Docker في CI (rehearsal والكتالوج والإيقاف وRAD-085) | لم تُشغّل محليًا (لا Docker في البيئة)؛ تشغّلها CI المطلوبة على PR بلا تخطٍّ |

الملفات المحمية بلا تغيير بايت: حزمتا الهاتف و`supabase/manual/*` و`supabase/fixtures/*` و`supabase/migrations/*` و`scripts/pages/frontend-schema.json` (الفرق محصور في ملفات الميزانية).

## 7. البنود المفتوحة

- **16 moderate** في سلسلة eslint/typescript-eslint/minimatch (`eslint` و`eslint-config-next` و`@typescript-eslint/*` و`eslint-plugin-*` و`minimatch`). إصلاح npm المقترح semver-major. الحد: أدوات تطوير فقط، لا تدخل static export المنشور. **Trigger:** ترقية eslint الرئيسية التالية، أو ارتفاع أي منها إلى high. لا يُدّعى إغلاقها.
- تقييم المالك أن الثغرات غير قابلة للاستغلال على static export ما زال تقييمًا؛ الترقية وقائية.

## 8. قائمة المالك

نتيجة الإغلاق بإفادة المالك2026-11-01: #186 مدموج وCI (check + deploy) أخضر وDeploy Pages ناجح على main؛ marker لم يتغير. فحص الهاتف بعد النشر4/4 ناجح: فتح الموقع، فحص تدريبي كامل، تبديل EN/AR، فتح صفحة الدخول. RAD-088 منجزة؛16 moderate تبقى بندًا مفتوحًا وفق §7.

1. راجع Draft PR وCI الأخضر، بما فيه «Require verified pilot schema».
2. ادمج.
3. بعد نجاح Deploy Pages، على الهاتف: افتح الموقع ← تدرّب على فحص واحد ← بدّل EN/AR ← صفحة الدخول تفتح.
4. أبلغ بالنتيجة لإغلاق RAD-088.

## سؤالا AGENTS

1. **هل تغيّر الحكم؟** لا. القرار3 نُفذ كما هو؛ HANDOFF والحالة أعيدت صياغتهما فقط لإضافة RAD-088.
2. **هل بقي الرابط إلى الدليل الأصلي؟** نعم، إلى [db-followups-owner-2026-11-01](DECISIONS.md#db-followups-owner-2026-11-01) وهذا التقرير.
