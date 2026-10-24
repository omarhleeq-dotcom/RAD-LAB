# تقرير RAD-075: تنظيف وإصلاحات صغيرة — 2026-10-24

القرار: [قرارات المالك 2026-10-24](DECISIONS.md#housekeeping-owner-2026-10-24). الفرع `claude/zen-babbage-ujdiyo` من main بعد دمج #123 (تحقق: `docs:context --pr 123` → merged).

## 1. الانحرافات والميزانية
- **الميزانية المعلنة:** `DOCS_CHECKS.md`، سطر رابط في `AGENTS.md`، `DECISIONS.md`، `project-status.md`، `HANDOFF.md`، هذا التقرير؛ ثمانية `scene-dom*.test.ts` (مهلة فقط)؛ `AccountPanel.tsx` و`account-state.ts` واختباره ورسالتا `messages/*.json`؛ `phone-navigation-audit.mjs`.
- **لا انحراف** عن الميزانية. لا لقطات جديدة مُلتزمة (0 MB). لم يُلمس أي hash/golden/characterisation.

## 2. المنجز والمتروك
- **منجز:** (1) سياسة اللقطات؛ (3) مهلة 30 ثانية لحراس scene-dom؛ (4) حالة «جارٍ تسجيل الدخول…»؛ (5) تشخيص phone-navigation وإصلاح عيب الـfixture.
- **غير منجز:** (2) **حذف الفروع المدموجة**: `git push --delete` رُفض من الوكيل (HTTP 403) ولا توجد أداة MCP لحذف الفروع؛ لم أحاول التفافًا. الفروع المحتواة فعلًا في origin/main دون PR مفتوح وقت الفحص ثلاثة فقط: `claude/docs-owner-decisions-rad-017-042-043`، `claude/relaxed-mendel-rmjc7m`، `fix/rad-054-phone-navigation-art`. الثلاثة الأخرى في قائمتك (`docs/prompt-rad-050-terms-review`، `docs/status-file-diet`، `feat/rad-044a-owner-page`) **ليست أسلافًا** لـmain الآن (غالبًا دُمجت بـsquash) فلم تُعامل كمدموجة.
- **متوقف حسب التعليمات:** إصلاح خلل المنتج في هبوط الدخول (انظر §3 بند 5).

## 3. لكل مهمة
1. **اللقطات:** القسم `#screenshot-policy` في DOCS_CHECKS ورابط في صف Exam/product من جدول AGENTS؛ لم تُحذف لقطات.
2. **الفروع:** انظر §2 و§7.
3. **المهلات:** `it(..., 30_000)` في 8 ملفات `scene-dom*.test.ts` مع تعليق يحيل للقرار. التوقعات والـhashes والمهلة العامة كما هي. 12/12 اختبارًا ناجحًا.
4. **وميض الدخول:** `postLoginTarget` دالة نقية في `account-state.ts` (نفس قواعد الوجهة حرفيًا: معتمد فقط، لا fragment/استرداد ولا بعد تغيير كلمة المرور، `returnTo` الآمن دائمًا، وإلا الرئيسية عند دخول تم على الصفحة). أبقيت `window.location.replace` (إعادة تحميل كاملة) وأخفيت الوميض بعرض `account-redirecting` («Signing in…» / «جارٍ تسجيل الدخول…»)، فلا تنقّل عميل جديد. سبعة اختبارات جديدة: الرئيسية، لغة AR، returnTo، زيارة متعمدة، غير معتمد (يبقى)، استرداد/خطأ رابط، بعد تغيير كلمة المرور. استبدلتُ `useRef` بـ`useState` لأن قاعدة lint تمنع قراءة ref أثناء العرض.
5. **phone-navigation:** سببان: **(أ) عيب fixture (أُصلح):** استجابة `profiles` الاصطناعية بلا `display_name` فيرفضها `readAccountProfile` ("invalid") وتظهر «تعذّرت قراءة ملفك». أضفتُ `display_name: null` فقط (لا تغيير توقع). **(ب) خلل منتج حقيقي (غير مُصلح، تُبلَّغ):** بعد الإصلاح يبقى الدخول على `/account` رغم أن الحساب معتمد. التتبع: `AppShell` يبدّل شجرة التخطيط من «standalone» (غير معتمد) إلى القشرة الكاملة لحظة الاعتماد (`approved` في سطر 37–38، من RAD-066)، فيُعاد تركيب `AccountPanel` ويضيع علم «دخلتُ للتو» (كان `useRef` أصلًا، وهو الآن state) فلا يحدث التحويل للرئيسية؛ التحويل بـ`returnTo` يعمل لأنه يُقرأ من العنوان. أي أن الدخول المباشر دون returnTo لا يفتح الرئيسية في المنتج الحالي. حسب التعليمات توقفتُ ولم أغيّر المنتج (الإصلاح يحتاج حفظ العلم خارج المكوّن أو في سياق الجلسة، وهو تغيير لسلوك الوجهة).

## 4. التغييرات المشتركة وفحص التوسع (S-STD-3)
- مشترك: `account-state.ts` (دالة جديدة فقط)، `messages/*.json` (مفتاح واحد `account.redirecting`).
- Scale: لا سقف جديد؛ لا مجموعات ثابتة ولا قراءات غير محدودة. سقف قائم: علم «دخلتُ للتو» محلي للمكوّن (§3.5) — يُرفع بقرار المالك على مكان حفظه.

## 5. الطب والتقييم
لا تغيير. golden وcharacterisation وكل مفتاح `scene|…`/`result|…` حرفيًا؛ لم يُشغَّل qa:golden ولا qa:characterise.

## 6. التحقق
- `npm ci` على النسخ المقفلة (ثم `npm i --no-save playwright@1.63.0` للأدوات اليدوية، بلا تعديل package.json/lock).
- **vitest الكامل منفردًا: 170 ملفًا، 2632/2632 اختبارًا ناجحًا.**
- lint: صفر أخطاء، تحذيران قديمان في simulator-layout-audit.mjs. `next build` ناجح؛ `build:pages` بإعداد اصطناعي ناجح.
- تدقيق الحساب والرئيسية (ui1-pages وrad-069b1-pages) في الثيمين: **136 فحصًا و36 axe** و**76 فحصًا و38 axe** في dark وفي light، EN/AR ×390/1440؛ لقطات B1 كتبت خارج المستودع (`REVIEW_DIR`).
- phone-navigation: **يفشل (خلل المنتج §3.5)**؛ بعد إصلاح fixture يصل إلى `/en/account` معتمدًا ولا يحوّل.
- لم تُلتقط حالة «Signing in…» بصريًا لأنها تعيش لحظة قبل إعادة التحميل؛ مغطاة بمنطق نقي واختبارات.
- docs:check وdocs:test وstatus:check: انظر ناتج الجلسة (يُشغَّل قبل التسليم).

## 7. بنود مفتوحة (للمالك)
1. **خلل هبوط الدخول** (§3.5): قرار إصلاحه (يلزم لسلوك «الدخول يفتح الرئيسية»).
2. **حذف الفروع:** نفّذ بنفسك أو امنح إذنًا: `claude/docs-owner-decisions-rad-017-042-043`، `claude/relaxed-mendel-rmjc7m`، `fix/rad-054-phone-navigation-art` (محتواة في main، لا PR).
3. **فروع غير محتواة في main** (لا تُحذف دون قرارك):

| الفرع | آخر commit | الموضوع |
|---|---|---|
| `ccr-af211b2d-y2gc70` | 2026-10-15 | Merge origin/main into shoulder Grashey implementation (docs-only conflicts) |
| `ccr-d7738da9-ccvtug-smoke` | 2026-10-15 | docs: record static preview smoke re-run on main 28edfec |
| `claude/affectionate-brown-cvrh6u` | 2026-10-06 | Session 2: interactive patient positioning workspace |
| `docs/pelvis-ap-merged-handoff` | 2026-10-15 | docs: record owner merge of Pelvis AP PR 34 |
| `docs/prompt-rad-050-terms-review` | 2026-10-16 | docs: save the RAD-050 Terms and Privacy review prompt |
| `docs/status-file-diet` | 2026-10-15 | docs: status file diet, format 1.1, short HANDOFF (RAD-048, S-STD-4) |
| `feat/rad-044a-owner-page` | 2026-10-15 | docs: ROADMAP line for RAD-044a |

## 8. قائمة المالك والجلسة التالية
- راجع القرار 1 و2 في §7. افحص على الهاتف أن الدخول يعرض «جارٍ تسجيل الدخول…» عند returnTo.
- **سؤالا AGENTS:** هل تغيّر الحكم؟ لا: لم يُعاد صياغة قاعدة قائمة؛ أُضيفت سياسة اللقطات وسطر رابط فقط في AGENTS دون تغيير نص القاعدة. هل بقي رابط الدليل الأصلي؟ نعم: القرار الجديد يحيل إلى هذا التقرير والمواضع الأصلية دون حذف أي رابط.
