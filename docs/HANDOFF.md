# RAD-LAB — ملف تسليم العمل للمحادثة التالية

ملخص؛ القرارات في [DECISIONS.md](DECISIONS.md) والحالة في [project-status.md](project-status.md). افحص Git أولاً. السابق: [archive/HANDOFF-rad-045-2026-10-16.md](archive/HANDOFF-rad-045-2026-10-16.md).

## 1. نقطة البداية
- main عند `a15cd89`: #72 (RAD-050) و#73 (الاعتمادات RAD-045) و#74 (توثيق دمجها) مدموجة. هذه الجلسة: جرد واجهة قراءةً فقط (RAD-051) على `ccr-0dee0a67-v9kgmx`، Draft PR فقط.
- [التقرير](session-ui-audit-2026-10-16.md): لا حارس دخول، تحذيرات مكررة، خطوط/ألوان بلا سلّم، كتالوج X-ray مسطح (17 فحصًا). لم تُفحص لقطات الجوال/RTL ولا التباين بالأدوات.

## 2. قرارات المالك (محفوظة: DECISIONS S-ASSESS-1…6 وO106…O108، RAD-055)
- لا وصول لأي صفحة قبل الدخول (الاستثناء: الدخول والشروط و404). حجب بالواجهة فقط.
- الكتالوج حسب المنطقة التشريحية؛ CT/MRI/US قسم «قريبًا» منفصل؛ مناقشة المظهر لاحقًا.
- Assess كاملة، المالك وحده يضع الاختبارات الآن والمعلم لاحقًا: قالب اختبار (عدد الأسئلة، المحاولات، الوقت)؛ أسئلة اختيار من متعدد (التفاعلية مؤجلة)؛ أسئلة من مصادر مرخّصة للاستخدام التجاري أو مكتوبة بصياغتنا من الكتب مع الصفحة؛ بنود محاكي بثلاثة مستويات (فحص كامل بأوزانه، فئة، فحص منفرد) بعلامات يضعها صاحب الاختبار؛ النتيجة مخفية عن الطالب وتُسجَّل فقط؛ الأخطاء الحرجة تُتجاهل في اختبار الجزء؛ الأجزاء غير المطلوبة تُخفى وتُثبَّت على القيمة الصحيحة؛ الكسور تبقى. مراجعة القيم مع خبير (RAD-019) قبل اعتماد الدرجات.
- مفتوح: O106 الاحتفاظ والموافقة، O107 محاولة واحدة أم حسب القالب، O108 مصادر البنك. D3 وقيد CLAUDE.md باقيان حتى RAD-056.

## 3. العمل التالي
1. ادمج الـDraft PR يدويًا ثم RAD-052 حارس الدخول ← RAD-053 الكتالوج ← RAD-054 المظهر ← لوحة «محاولاتي» ← RAD-055 قرارات Assess (توثيق) ثم النموذج.
2. لا .4 قبل قرار المالك. RAD-024/RAD-025 وRAD-018/019/029/032/038 كما في ملف الحالة.

## 4. برومبت المحادثة التالية
```text
SESSION: RAD-052 — حارس الدخول (لا وصول لأي صفحة قبل تسجيل الدخول)
Follow CLAUDE.md, docs/exam-recipe.md and S-STD-1. Start from updated main (predecessor merged: PR الجرد/Assess الحالي) else STOP AND REPORT. New branch, DRAFT PR only, no subscribe/poll, never open or share preview URL.
READ ONLY: docs/HANDOFF.md, docs/session-ui-audit-2026-10-16.md §1, DECISIONS S-ASSESS-1 وS-PILOT-7 وS-PILOT-26 (إن لزم)، src/features/pilot/useAccount.ts وaccount-state.ts، src/app/[locale]/layout.tsx.
OWNER DECISIONS: لا وصول لأي صفحة بلا جلسة معتمدة؛ الاستثناء الدخول والشروط و404 (والاعتمادات تُسأل المالك إن لم تُحسم)؛ الحجب بالواجهة فقط (موقع ثابت)؛ إعادة لنفس الرابط بعد الدخول؛ رسائل واضحة لـ pending وsuspended؛ الحسابات غير المفعّلة (المتغيران غير موجودين) تبقى كما هي مفتوحة.
SCOPE: 1) حارس جلسة في layout يحوّل الزائر لصفحة الدخول مع return path. 2) صفحة الدخول هي الواجهة الأولى للزائر. 3) حالات pending/suspended. 4) اختبارات الحالات الأربع (زائر، pending، approved، suspended) وEN/AR×390/1440.
ALLOWED SHARED CHANGES: layout/shell وفي messages (en+ar بنفس المفاتيح)؛ لا بيانات فحوص ولا مشاهد.
SCALE CHECK (S-STD-3): الحجب بالواجهة لا يمنع تحميل ملفات ثابتة؛ لا قائمة صفحات عامة ثابتة بالكود بل إعداد قابل للتوسع؛ لا طلبات إضافية بلا جلسة.
CHANGE BUDGET: ≤ 12 ملفًا.
OUT OF SCOPE: الكتالوج حسب المنطقة (RAD-053)، المظهر (RAD-054)، Assess، أي حماية بالخادم، المشاهد وhashes.
SESSION TYPE: EXAM-free app change → check + build + build:pages + متصفح EN/AR.
Conflict with repo docs/decisions or budget overflow → STOP AND REPORT, change nothing.
Final report in Arabic, standard 8-section order, then the next prompt (RAD-053).
```
