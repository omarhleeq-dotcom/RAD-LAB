# RAD-072 الجزء 2a المرحلة B — بصمات scene-dom المتغيرة (2026-10-23)

قبول S-STD-2 المسبق: [قرار 2a](DECISIONS.md#rad072-2a-hand-owner-2026-10-23). الملف الوحيد المتغير: `scripts/qa/scene-dom/hand-hashes.json`. التقرير: [المرحلة B](RAD-072_PART2A_PHASE_B_REPORT_2026-10-23.md).

- تغيّرت **128** مفتاحًا من 192، كلها مفاتيح `scene|hand-pa|…` و`scene|hand-lateral|…`: كل حالة مسجلة ترسم منظر الكاشف لليد (`HandDrawing`) والمنظر الجانبي (`HandSideView`)، وتغيّر الاثنان في هذه المرحلة، فلا حالة مشهد تبقى بلا تغيير.
- **مفاتيح `result|…` الأربعة والستون مطابقة** (لوحة النتيجة وصورة النتيجة بلا تغيير). أسماء المفاتيح وترتيبها مطابقة.
- ملفات البصمات الأخرى كلها مطابقة لـmain: الصدر (`hashes.json`)، الرسغ، المرفق، الركبة AP/جانبي، القدم AP/مائل، الكاحل AP/جانبي، الحوض، الكتف.
- السبب المشترك لكل مفتاح: (1) منظر الكاشف يرسم المخططات المستخلصة من A-015/A-017 عبر دوال دوران نموذج اليد القائمة، بطبقات الأطراف (نسيج رخو، مسافات مفصلية، عظام شفافة جزئيًا، حواف فوق كل التعبئات)، فيتغير SVG في كل زاوية؛ (2) المنظر الجانبي يأخذ ارتفاع اليد والساعد من المخطط المستخلص. لا نص ولا تسمية ولا موضع علامة أو حقل أو شعاع تغيّر.

| المفتاح | الحالة | العنصر المتغير |
|---|---|---|
| `scene\|hand-pa\|initial\|en\|practice` | الحالة الابتدائية للحالة (إسقاطها الابتدائي) | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|initial\|en\|assessment` | الحالة الابتدائية للحالة (إسقاطها الابتدائي) | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|initial\|ar\|practice` | الحالة الابتدائية للحالة (إسقاطها الابتدائي) | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|initial\|ar\|assessment` | الحالة الابتدائية للحالة (إسقاطها الابتدائي) | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rot8\|en\|practice` | الدوران +8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rot8\|en\|assessment` | الدوران +8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rot8\|ar\|practice` | الدوران +8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rot8\|ar\|assessment` | الدوران +8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rotm8\|en\|practice` | الدوران −8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rotm8\|en\|assessment` | الدوران −8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rotm8\|ar\|practice` | الدوران −8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rotm8\|ar\|assessment` | الدوران −8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rot3\|en\|practice` | الدوران +3° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rot3\|en\|assessment` | الدوران +3° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rot3\|ar\|practice` | الدوران +3° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rot3\|ar\|assessment` | الدوران +3° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerL\|en\|practice` | علامة L | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerL\|en\|assessment` | علامة L | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerL\|ar\|practice` | علامة L | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerL\|ar\|assessment` | علامة L | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerR\|en\|practice` | علامة R | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerR\|en\|assessment` | علامة R | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerR\|ar\|practice` | علامة R | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerR\|ar\|assessment` | علامة R | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerMoved\|en\|practice` | علامة منقولة | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerMoved\|en\|assessment` | علامة منقولة | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerMoved\|ar\|practice` | علامة منقولة | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|markerMoved\|ar\|assessment` | علامة منقولة | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rayOff\|en\|practice` | شعاع مزاح | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rayOff\|en\|assessment` | شعاع مزاح | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rayOff\|ar\|practice` | شعاع مزاح | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|rayOff\|ar\|assessment` | شعاع مزاح | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|tight\|en\|practice` | حقل ضيق | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|tight\|en\|assessment` | حقل ضيق | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|tight\|ar\|practice` | حقل ضيق | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|tight\|ar\|assessment` | حقل ضيق | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|sid102\|en\|practice` | SID 102 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|sid102\|en\|assessment` | SID 102 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|sid102\|ar\|practice` | SID 102 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|sid102\|ar\|assessment` | SID 102 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|sid200\|en\|practice` | SID 200 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|sid200\|en\|assessment` | SID 200 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|sid200\|ar\|practice` | SID 200 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|sid200\|ar\|assessment` | SID 200 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|projPa\|en\|practice` | إسقاط PA | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|projPa\|en\|assessment` | إسقاط PA | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|projPa\|ar\|practice` | إسقاط PA | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|projPa\|ar\|assessment` | إسقاط PA | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|projLat\|en\|practice` | إسقاط جانبي | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|projLat\|en\|assessment` | إسقاط جانبي | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|projLat\|ar\|practice` | إسقاط جانبي | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|projLat\|ar\|assessment` | إسقاط جانبي | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|lowKv\|en\|practice` | kV منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|lowKv\|en\|assessment` | kV منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|lowKv\|ar\|practice` | kV منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|lowKv\|ar\|assessment` | kV منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|highKv\|en\|practice` | kV مرتفع | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|highKv\|en\|assessment` | kV مرتفع | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|highKv\|ar\|practice` | kV مرتفع | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|highKv\|ar\|assessment` | kV مرتفع | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|lowMas\|en\|practice` | mAs منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|lowMas\|en\|assessment` | mAs منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|lowMas\|ar\|practice` | mAs منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-pa\|lowMas\|ar\|assessment` | mAs منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|initial\|en\|practice` | الحالة الابتدائية للحالة (إسقاطها الابتدائي) | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|initial\|en\|assessment` | الحالة الابتدائية للحالة (إسقاطها الابتدائي) | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|initial\|ar\|practice` | الحالة الابتدائية للحالة (إسقاطها الابتدائي) | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|initial\|ar\|assessment` | الحالة الابتدائية للحالة (إسقاطها الابتدائي) | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rot8\|en\|practice` | الدوران +8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rot8\|en\|assessment` | الدوران +8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rot8\|ar\|practice` | الدوران +8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rot8\|ar\|assessment` | الدوران +8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rotm8\|en\|practice` | الدوران −8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rotm8\|en\|assessment` | الدوران −8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rotm8\|ar\|practice` | الدوران −8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rotm8\|ar\|assessment` | الدوران −8° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rot3\|en\|practice` | الدوران +3° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rot3\|en\|assessment` | الدوران +3° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rot3\|ar\|practice` | الدوران +3° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rot3\|ar\|assessment` | الدوران +3° | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerL\|en\|practice` | علامة L | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerL\|en\|assessment` | علامة L | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerL\|ar\|practice` | علامة L | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerL\|ar\|assessment` | علامة L | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerR\|en\|practice` | علامة R | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerR\|en\|assessment` | علامة R | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerR\|ar\|practice` | علامة R | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerR\|ar\|assessment` | علامة R | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerMoved\|en\|practice` | علامة منقولة | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerMoved\|en\|assessment` | علامة منقولة | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerMoved\|ar\|practice` | علامة منقولة | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|markerMoved\|ar\|assessment` | علامة منقولة | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rayOff\|en\|practice` | شعاع مزاح | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rayOff\|en\|assessment` | شعاع مزاح | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rayOff\|ar\|practice` | شعاع مزاح | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|rayOff\|ar\|assessment` | شعاع مزاح | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|tight\|en\|practice` | حقل ضيق | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|tight\|en\|assessment` | حقل ضيق | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|tight\|ar\|practice` | حقل ضيق | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|tight\|ar\|assessment` | حقل ضيق | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|sid102\|en\|practice` | SID 102 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|sid102\|en\|assessment` | SID 102 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|sid102\|ar\|practice` | SID 102 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|sid102\|ar\|assessment` | SID 102 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|sid200\|en\|practice` | SID 200 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|sid200\|en\|assessment` | SID 200 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|sid200\|ar\|practice` | SID 200 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|sid200\|ar\|assessment` | SID 200 | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|projPa\|en\|practice` | إسقاط PA | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|projPa\|en\|assessment` | إسقاط PA | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|projPa\|ar\|practice` | إسقاط PA | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|projPa\|ar\|assessment` | إسقاط PA | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|projLat\|en\|practice` | إسقاط جانبي | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|projLat\|en\|assessment` | إسقاط جانبي | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|projLat\|ar\|practice` | إسقاط جانبي | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|projLat\|ar\|assessment` | إسقاط جانبي | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|lowKv\|en\|practice` | kV منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|lowKv\|en\|assessment` | kV منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|lowKv\|ar\|practice` | kV منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|lowKv\|ar\|assessment` | kV منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|highKv\|en\|practice` | kV مرتفع | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|highKv\|en\|assessment` | kV مرتفع | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|highKv\|ar\|practice` | kV مرتفع | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|highKv\|ar\|assessment` | kV مرتفع | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|lowMas\|en\|practice` | mAs منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|lowMas\|en\|assessment` | mAs منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|lowMas\|ar\|practice` | mAs منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
| `scene\|hand-lateral\|lowMas\|ar\|assessment` | mAs منخفض | `HandDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`HandSideView` (ارتفاع اليد والساعد) |
