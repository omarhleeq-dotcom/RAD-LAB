# RAD-072 الجزء 2b المرحلة B — بصمات scene-dom المتغيرة (2026-10-23)

قبول S-STD-2 المسبق: [قرار 2b](DECISIONS.md#rad072-2b-owner-2026-10-23). الملفات الوحيدة المتغيرة: `scripts/qa/scene-dom/wrist-hashes.json` و`foot-ap-hashes.json` و`foot-oblique-hashes.json`. التقرير: [المرحلة B](RAD-072_PART2B_PHASE_B_REPORT_2026-10-23.md).

- المجموع: **328** مفتاح scene في ثلاثة ملفات، 0 مفتاح result. ملفات البصمات الأخرى كلها مطابقة لـmain: الصدر (`hashes.json`)، **اليد**، المرفق، الركبة AP/جانبي، الكاحل AP/جانبي، الحوض، الكتف.

## `wrist-hashes.json`

- تغيّرت **128** مفتاحًا من 192، كلها `scene|…`؛ **مفاتيح `result|…` الـ64 مطابقة**، وأسماء المفاتيح وترتيبها مطابقة.
- السبب المشترك: منظر الكاشف يرسم المخططات المستخلصة عبر دوال دوران النموذج القائمة، والمنظر الجانبي يأخذ أبعاده من المخطط؛ لا نص ولا تسمية ولا علامة أو حقل أو شعاع تغيّر.

| المفتاح | الحالة | العنصر المتغير |
|---|---|---|
| `scene\|wrist-pa\|initial\|en\|practice` | الحالة الابتدائية | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|initial\|en\|assessment` | الحالة الابتدائية | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|initial\|ar\|practice` | الحالة الابتدائية | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|initial\|ar\|assessment` | الحالة الابتدائية | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rot8\|en\|practice` | الدوران +8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rot8\|en\|assessment` | الدوران +8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rot8\|ar\|practice` | الدوران +8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rot8\|ar\|assessment` | الدوران +8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rotm8\|en\|practice` | الدوران −8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rotm8\|en\|assessment` | الدوران −8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rotm8\|ar\|practice` | الدوران −8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rotm8\|ar\|assessment` | الدوران −8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rot3\|en\|practice` | الدوران +3° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rot3\|en\|assessment` | الدوران +3° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rot3\|ar\|practice` | الدوران +3° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rot3\|ar\|assessment` | الدوران +3° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerL\|en\|practice` | علامة L | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerL\|en\|assessment` | علامة L | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerL\|ar\|practice` | علامة L | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerL\|ar\|assessment` | علامة L | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerR\|en\|practice` | علامة R | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerR\|en\|assessment` | علامة R | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerR\|ar\|practice` | علامة R | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerR\|ar\|assessment` | علامة R | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerMoved\|en\|practice` | علامة منقولة | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerMoved\|en\|assessment` | علامة منقولة | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerMoved\|ar\|practice` | علامة منقولة | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|markerMoved\|ar\|assessment` | علامة منقولة | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rayOff\|en\|practice` | الشعاع بعيد عن الهدف | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rayOff\|en\|assessment` | الشعاع بعيد عن الهدف | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rayOff\|ar\|practice` | الشعاع بعيد عن الهدف | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|rayOff\|ar\|assessment` | الشعاع بعيد عن الهدف | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|tight\|en\|practice` | تحديد ضيق | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|tight\|en\|assessment` | تحديد ضيق | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|tight\|ar\|practice` | تحديد ضيق | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|tight\|ar\|assessment` | تحديد ضيق | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|sid102\|en\|practice` | SID 102 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|sid102\|en\|assessment` | SID 102 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|sid102\|ar\|practice` | SID 102 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|sid102\|ar\|assessment` | SID 102 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|sid200\|en\|practice` | SID 200 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|sid200\|en\|assessment` | SID 200 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|sid200\|ar\|practice` | SID 200 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|sid200\|ar\|assessment` | SID 200 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|projPa\|en\|practice` | إسقاط PA | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|projPa\|en\|assessment` | إسقاط PA | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|projPa\|ar\|practice` | إسقاط PA | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|projPa\|ar\|assessment` | إسقاط PA | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|projLat\|en\|practice` | إسقاط جانبي | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|projLat\|en\|assessment` | إسقاط جانبي | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|projLat\|ar\|practice` | إسقاط جانبي | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|projLat\|ar\|assessment` | إسقاط جانبي | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|lowKv\|en\|practice` | kV منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|lowKv\|en\|assessment` | kV منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|lowKv\|ar\|practice` | kV منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|lowKv\|ar\|assessment` | kV منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|highKv\|en\|practice` | kV مرتفع | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|highKv\|en\|assessment` | kV مرتفع | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|highKv\|ar\|practice` | kV مرتفع | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|highKv\|ar\|assessment` | kV مرتفع | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|lowMas\|en\|practice` | mAs منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|lowMas\|en\|assessment` | mAs منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|lowMas\|ar\|practice` | mAs منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-pa\|lowMas\|ar\|assessment` | mAs منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|initial\|en\|practice` | الحالة الابتدائية | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|initial\|en\|assessment` | الحالة الابتدائية | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|initial\|ar\|practice` | الحالة الابتدائية | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|initial\|ar\|assessment` | الحالة الابتدائية | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rot8\|en\|practice` | الدوران +8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rot8\|en\|assessment` | الدوران +8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rot8\|ar\|practice` | الدوران +8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rot8\|ar\|assessment` | الدوران +8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rotm8\|en\|practice` | الدوران −8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rotm8\|en\|assessment` | الدوران −8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rotm8\|ar\|practice` | الدوران −8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rotm8\|ar\|assessment` | الدوران −8° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rot3\|en\|practice` | الدوران +3° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rot3\|en\|assessment` | الدوران +3° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rot3\|ar\|practice` | الدوران +3° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rot3\|ar\|assessment` | الدوران +3° | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerL\|en\|practice` | علامة L | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerL\|en\|assessment` | علامة L | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerL\|ar\|practice` | علامة L | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerL\|ar\|assessment` | علامة L | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerR\|en\|practice` | علامة R | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerR\|en\|assessment` | علامة R | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerR\|ar\|practice` | علامة R | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerR\|ar\|assessment` | علامة R | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerMoved\|en\|practice` | علامة منقولة | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerMoved\|en\|assessment` | علامة منقولة | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerMoved\|ar\|practice` | علامة منقولة | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|markerMoved\|ar\|assessment` | علامة منقولة | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rayOff\|en\|practice` | الشعاع بعيد عن الهدف | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rayOff\|en\|assessment` | الشعاع بعيد عن الهدف | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rayOff\|ar\|practice` | الشعاع بعيد عن الهدف | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|rayOff\|ar\|assessment` | الشعاع بعيد عن الهدف | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|tight\|en\|practice` | تحديد ضيق | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|tight\|en\|assessment` | تحديد ضيق | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|tight\|ar\|practice` | تحديد ضيق | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|tight\|ar\|assessment` | تحديد ضيق | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|sid102\|en\|practice` | SID 102 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|sid102\|en\|assessment` | SID 102 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|sid102\|ar\|practice` | SID 102 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|sid102\|ar\|assessment` | SID 102 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|sid200\|en\|practice` | SID 200 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|sid200\|en\|assessment` | SID 200 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|sid200\|ar\|practice` | SID 200 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|sid200\|ar\|assessment` | SID 200 | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|projPa\|en\|practice` | إسقاط PA | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|projPa\|en\|assessment` | إسقاط PA | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|projPa\|ar\|practice` | إسقاط PA | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|projPa\|ar\|assessment` | إسقاط PA | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|projLat\|en\|practice` | إسقاط جانبي | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|projLat\|en\|assessment` | إسقاط جانبي | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|projLat\|ar\|practice` | إسقاط جانبي | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|projLat\|ar\|assessment` | إسقاط جانبي | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|lowKv\|en\|practice` | kV منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|lowKv\|en\|assessment` | kV منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|lowKv\|ar\|practice` | kV منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|lowKv\|ar\|assessment` | kV منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|highKv\|en\|practice` | kV مرتفع | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|highKv\|en\|assessment` | kV مرتفع | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|highKv\|ar\|practice` | kV مرتفع | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|highKv\|ar\|assessment` | kV مرتفع | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|lowMas\|en\|practice` | mAs منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|lowMas\|en\|assessment` | mAs منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|lowMas\|ar\|practice` | mAs منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |
| `scene\|wrist-lateral\|lowMas\|ar\|assessment` | mAs منخفض | `WristDrawing` (رسم من المخططات المستخلصة وأسلوب الأطراف) و`WristSideView` (ارتفاع اليد والساعد من المخطط) |

## `foot-ap-hashes.json`

- تغيّرت **100** مفتاحًا من 150، كلها `scene|…`؛ **مفاتيح `result|…` الـ50 مطابقة**، وأسماء المفاتيح وترتيبها مطابقة.
- السبب المشترك: منظر الكاشف يرسم المخططات المستخلصة عبر دوال دوران النموذج القائمة، والمنظر الجانبي يأخذ أبعاده من المخطط؛ لا نص ولا تسمية ولا علامة أو حقل أو شعاع تغيّر.

| المفتاح | الحالة | العنصر المتغير |
|---|---|---|
| `scene\|foot-ap\|initial\|en\|practice` | الحالة الابتدائية | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|initial\|en\|assessment` | الحالة الابتدائية | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|initial\|ar\|practice` | الحالة الابتدائية | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|initial\|ar\|assessment` | الحالة الابتدائية | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot8\|en\|practice` | الدوران +8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot8\|en\|assessment` | الدوران +8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot8\|ar\|practice` | الدوران +8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot8\|ar\|assessment` | الدوران +8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rotm8\|en\|practice` | الدوران −8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rotm8\|en\|assessment` | الدوران −8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rotm8\|ar\|practice` | الدوران −8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rotm8\|ar\|assessment` | الدوران −8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot3\|en\|practice` | الدوران +3° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot3\|en\|assessment` | الدوران +3° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot3\|ar\|practice` | الدوران +3° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot3\|ar\|assessment` | الدوران +3° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot15\|en\|practice` | الدوران +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot15\|en\|assessment` | الدوران +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot15\|ar\|practice` | الدوران +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot15\|ar\|assessment` | الدوران +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rotm15\|en\|practice` | الدوران −15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rotm15\|en\|assessment` | الدوران −15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rotm15\|ar\|practice` | الدوران −15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rotm15\|ar\|assessment` | الدوران −15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot40\|en\|practice` | القيمة 40° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot40\|en\|assessment` | القيمة 40° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot40\|ar\|practice` | القيمة 40° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot40\|ar\|assessment` | القيمة 40° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot55\|en\|practice` | القيمة 55° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot55\|en\|assessment` | القيمة 55° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot55\|ar\|practice` | القيمة 55° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot55\|ar\|assessment` | القيمة 55° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot20\|en\|practice` | القيمة 20° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot20\|en\|assessment` | القيمة 20° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot20\|ar\|practice` | القيمة 20° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rot20\|ar\|assessment` | القيمة 20° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerL\|en\|practice` | علامة L | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerL\|en\|assessment` | علامة L | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerL\|ar\|practice` | علامة L | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerL\|ar\|assessment` | علامة L | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerR\|en\|practice` | علامة R | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerR\|en\|assessment` | علامة R | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerR\|ar\|practice` | علامة R | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerR\|ar\|assessment` | علامة R | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerMoved\|en\|practice` | علامة منقولة | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerMoved\|en\|assessment` | علامة منقولة | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerMoved\|ar\|practice` | علامة منقولة | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|markerMoved\|ar\|assessment` | علامة منقولة | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rayOff\|en\|practice` | الشعاع بعيد عن الهدف | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rayOff\|en\|assessment` | الشعاع بعيد عن الهدف | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rayOff\|ar\|practice` | الشعاع بعيد عن الهدف | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|rayOff\|ar\|assessment` | الشعاع بعيد عن الهدف | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tight\|en\|practice` | تحديد ضيق | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tight\|en\|assessment` | تحديد ضيق | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tight\|ar\|practice` | تحديد ضيق | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tight\|ar\|assessment` | تحديد ضيق | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|sid102\|en\|practice` | SID 102 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|sid102\|en\|assessment` | SID 102 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|sid102\|ar\|practice` | SID 102 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|sid102\|ar\|assessment` | SID 102 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|sid200\|en\|practice` | SID 200 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|sid200\|en\|assessment` | SID 200 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|sid200\|ar\|practice` | SID 200 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|sid200\|ar\|assessment` | SID 200 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tubeM10\|en\|practice` | زاوية الأنبوب −10° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tubeM10\|en\|assessment` | زاوية الأنبوب −10° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tubeM10\|ar\|practice` | زاوية الأنبوب −10° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tubeM10\|ar\|assessment` | زاوية الأنبوب −10° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tubeM6\|en\|practice` | زاوية الأنبوب −6° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tubeM6\|en\|assessment` | زاوية الأنبوب −6° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tubeM6\|ar\|practice` | زاوية الأنبوب −6° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tubeM6\|ar\|assessment` | زاوية الأنبوب −6° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tube0\|en\|practice` | زاوية الأنبوب 0° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tube0\|en\|assessment` | زاوية الأنبوب 0° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tube0\|ar\|practice` | زاوية الأنبوب 0° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tube0\|ar\|assessment` | زاوية الأنبوب 0° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tube15\|en\|practice` | زاوية الأنبوب +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tube15\|en\|assessment` | زاوية الأنبوب +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tube15\|ar\|practice` | زاوية الأنبوب +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|tube15\|ar\|assessment` | زاوية الأنبوب +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|projFootAp\|en\|practice` | إسقاط DP/AP | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|projFootAp\|en\|assessment` | إسقاط DP/AP | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|projFootAp\|ar\|practice` | إسقاط DP/AP | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|projFootAp\|ar\|assessment` | إسقاط DP/AP | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|projFootOblique\|en\|practice` | إسقاط مائل | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|projFootOblique\|en\|assessment` | إسقاط مائل | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|projFootOblique\|ar\|practice` | إسقاط مائل | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|projFootOblique\|ar\|assessment` | إسقاط مائل | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|lowKv\|en\|practice` | kV منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|lowKv\|en\|assessment` | kV منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|lowKv\|ar\|practice` | kV منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|lowKv\|ar\|assessment` | kV منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|highKv\|en\|practice` | kV مرتفع | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|highKv\|en\|assessment` | kV مرتفع | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|highKv\|ar\|practice` | kV مرتفع | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|highKv\|ar\|assessment` | kV مرتفع | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|lowMas\|en\|practice` | mAs منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|lowMas\|en\|assessment` | mAs منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|lowMas\|ar\|practice` | mAs منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-ap\|lowMas\|ar\|assessment` | mAs منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |

## `foot-oblique-hashes.json`

- تغيّرت **100** مفتاحًا من 150، كلها `scene|…`؛ **مفاتيح `result|…` الـ50 مطابقة**، وأسماء المفاتيح وترتيبها مطابقة.
- السبب المشترك: منظر الكاشف يرسم المخططات المستخلصة عبر دوال دوران النموذج القائمة، والمنظر الجانبي يأخذ أبعاده من المخطط؛ لا نص ولا تسمية ولا علامة أو حقل أو شعاع تغيّر.

| المفتاح | الحالة | العنصر المتغير |
|---|---|---|
| `scene\|foot-oblique\|initial\|en\|practice` | الحالة الابتدائية | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|initial\|en\|assessment` | الحالة الابتدائية | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|initial\|ar\|practice` | الحالة الابتدائية | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|initial\|ar\|assessment` | الحالة الابتدائية | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot8\|en\|practice` | الدوران +8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot8\|en\|assessment` | الدوران +8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot8\|ar\|practice` | الدوران +8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot8\|ar\|assessment` | الدوران +8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rotm8\|en\|practice` | الدوران −8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rotm8\|en\|assessment` | الدوران −8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rotm8\|ar\|practice` | الدوران −8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rotm8\|ar\|assessment` | الدوران −8° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot3\|en\|practice` | الدوران +3° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot3\|en\|assessment` | الدوران +3° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot3\|ar\|practice` | الدوران +3° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot3\|ar\|assessment` | الدوران +3° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot15\|en\|practice` | الدوران +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot15\|en\|assessment` | الدوران +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot15\|ar\|practice` | الدوران +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot15\|ar\|assessment` | الدوران +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rotm15\|en\|practice` | الدوران −15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rotm15\|en\|assessment` | الدوران −15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rotm15\|ar\|practice` | الدوران −15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rotm15\|ar\|assessment` | الدوران −15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot40\|en\|practice` | القيمة 40° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot40\|en\|assessment` | القيمة 40° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot40\|ar\|practice` | القيمة 40° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot40\|ar\|assessment` | القيمة 40° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot55\|en\|practice` | القيمة 55° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot55\|en\|assessment` | القيمة 55° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot55\|ar\|practice` | القيمة 55° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot55\|ar\|assessment` | القيمة 55° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot20\|en\|practice` | القيمة 20° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot20\|en\|assessment` | القيمة 20° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot20\|ar\|practice` | القيمة 20° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rot20\|ar\|assessment` | القيمة 20° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerL\|en\|practice` | علامة L | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerL\|en\|assessment` | علامة L | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerL\|ar\|practice` | علامة L | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerL\|ar\|assessment` | علامة L | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerR\|en\|practice` | علامة R | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerR\|en\|assessment` | علامة R | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerR\|ar\|practice` | علامة R | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerR\|ar\|assessment` | علامة R | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerMoved\|en\|practice` | علامة منقولة | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerMoved\|en\|assessment` | علامة منقولة | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerMoved\|ar\|practice` | علامة منقولة | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|markerMoved\|ar\|assessment` | علامة منقولة | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rayOff\|en\|practice` | الشعاع بعيد عن الهدف | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rayOff\|en\|assessment` | الشعاع بعيد عن الهدف | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rayOff\|ar\|practice` | الشعاع بعيد عن الهدف | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|rayOff\|ar\|assessment` | الشعاع بعيد عن الهدف | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tight\|en\|practice` | تحديد ضيق | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tight\|en\|assessment` | تحديد ضيق | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tight\|ar\|practice` | تحديد ضيق | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tight\|ar\|assessment` | تحديد ضيق | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|sid102\|en\|practice` | SID 102 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|sid102\|en\|assessment` | SID 102 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|sid102\|ar\|practice` | SID 102 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|sid102\|ar\|assessment` | SID 102 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|sid200\|en\|practice` | SID 200 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|sid200\|en\|assessment` | SID 200 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|sid200\|ar\|practice` | SID 200 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|sid200\|ar\|assessment` | SID 200 | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tubeM10\|en\|practice` | زاوية الأنبوب −10° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tubeM10\|en\|assessment` | زاوية الأنبوب −10° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tubeM10\|ar\|practice` | زاوية الأنبوب −10° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tubeM10\|ar\|assessment` | زاوية الأنبوب −10° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tubeM6\|en\|practice` | زاوية الأنبوب −6° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tubeM6\|en\|assessment` | زاوية الأنبوب −6° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tubeM6\|ar\|practice` | زاوية الأنبوب −6° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tubeM6\|ar\|assessment` | زاوية الأنبوب −6° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tube0\|en\|practice` | زاوية الأنبوب 0° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tube0\|en\|assessment` | زاوية الأنبوب 0° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tube0\|ar\|practice` | زاوية الأنبوب 0° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tube0\|ar\|assessment` | زاوية الأنبوب 0° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tube15\|en\|practice` | زاوية الأنبوب +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tube15\|en\|assessment` | زاوية الأنبوب +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tube15\|ar\|practice` | زاوية الأنبوب +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|tube15\|ar\|assessment` | زاوية الأنبوب +15° | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|projFootAp\|en\|practice` | إسقاط DP/AP | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|projFootAp\|en\|assessment` | إسقاط DP/AP | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|projFootAp\|ar\|practice` | إسقاط DP/AP | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|projFootAp\|ar\|assessment` | إسقاط DP/AP | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|projFootOblique\|en\|practice` | إسقاط مائل | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|projFootOblique\|en\|assessment` | إسقاط مائل | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|projFootOblique\|ar\|practice` | إسقاط مائل | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|projFootOblique\|ar\|assessment` | إسقاط مائل | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|lowKv\|en\|practice` | kV منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|lowKv\|en\|assessment` | kV منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|lowKv\|ar\|practice` | kV منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|lowKv\|ar\|assessment` | kV منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|highKv\|en\|practice` | kV مرتفع | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|highKv\|en\|assessment` | kV مرتفع | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|highKv\|ar\|practice` | kV مرتفع | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|highKv\|ar\|assessment` | kV مرتفع | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|lowMas\|en\|practice` | mAs منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|lowMas\|en\|assessment` | mAs منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|lowMas\|ar\|practice` | mAs منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |
| `scene\|foot-oblique\|lowMas\|ar\|assessment` | mAs منخفض | `LowerLimbDrawing` فرع القدم (رسم من المخططات المستخلصة، عظام صلبة، أسلوب الأطراف) و`LowerLimbSideView` فرع القدم (امتداد الأصابع وعرض مقدم القدم من المخطط) |

