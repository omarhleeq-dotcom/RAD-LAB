# RAD-072 الجزء 3 المرحلة B — بصمات scene-dom المتغيرة (2026-10-24)

قبول S-STD-2 المسبق لهذه الدفعة: [قرار المرحلة B](DECISIONS.md#rad072-3b-owner-2026-10-24). المفاتيح المسموحة: الصدر PA والصدر AP والركبة AP والقدم DP والكاحل AP والكتف واليد الجانبية والقدم المائلة، وبسبب بنود القرار فقط. التقرير: [المرحلة B](RAD-072_PART3_PHASE_B_REPORT_2026-10-24.md). أسماء المفاتيح وترتيبها مطابقة لـ`origin/main` في كل ملف؛ لا characterisation ولا golden ولا `pipeline.ts` ولا ملف بصمات آخر تغيّر. الصدر الجانبي بلا أي مفتاح متغير.

- `ankle-ap-hashes.json`: **42** من 126 مفتاحًا (42 مفتاح `result`).
- `foot-ap-hashes.json`: **50** من 150 مفتاحًا (50 مفتاح `result`).
- `foot-oblique-hashes.json`: **100** من 150 مفتاحًا (100 مفتاح `scene`).
- `hand-hashes.json`: **64** من 192 مفتاحًا (64 مفتاح `scene`).
- `hashes.json`: **84** من 408 مفتاحًا (80 مفتاح `scene|chest-pa-erect`، 4 مفاتيح `scene|chest-ap-supine|shFlip`).
- `knee-ap-hashes.json`: **150** من 150 مفتاحًا (100 مفتاح `scene|knee-ap`، 50 مفتاح `result|knee-ap`).
- `shoulder-grashey-erect-hashes.json`: **32** من 96 مفتاحًا (32 مفتاح `result`).

## `scripts/qa/scene-dom/ankle-ap-hashes.json`

| المفتاح | السبب |
|---|---|
| `result\|ankle-ap\|initial\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|initial\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rot8\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rot8\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rotm8\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rotm8\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rot3\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rot3\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rot15\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rot15\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rotm15\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rotm15\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|markerL\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|markerL\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|markerR\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|markerR\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|markerMoved\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|markerMoved\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rayOff\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|rayOff\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|tight\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|tight\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|sid102\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|sid102\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|sid200\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|sid200\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|tubeM10\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|tubeM10\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|tube0\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|tube0\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|tube15\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|tube15\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|projAnkleAp\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|projAnkleAp\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|projAnkleLateral\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|projAnkleLateral\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|lowKv\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|lowKv\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|highKv\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|highKv\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|lowMas\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|ankle-ap\|lowMas\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |

## `scripts/qa/scene-dom/foot-ap-hashes.json`

| المفتاح | السبب |
|---|---|
| `result\|foot-ap\|initial\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|initial\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot8\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot8\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rotm8\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rotm8\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot3\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot3\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot15\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot15\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rotm15\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rotm15\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot40\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot40\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot55\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot55\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot20\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rot20\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|markerL\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|markerL\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|markerR\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|markerR\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|markerMoved\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|markerMoved\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rayOff\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|rayOff\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tight\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tight\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|sid102\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|sid102\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|sid200\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|sid200\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tubeM10\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tubeM10\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tubeM6\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tubeM6\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tube0\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tube0\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tube15\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|tube15\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|projFootAp\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|projFootAp\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|projFootOblique\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|projFootOblique\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|lowKv\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|lowKv\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|highKv\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|highKv\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|lowMas\|en` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |
| `result\|foot-ap\|lowMas\|ar` | نص ميل الأنبوب: «نحو العقب = نحو الرأس، −10° على أداة التحكم» في التسمية وتغذية النجاح/الإخفاق (EN/AR) |

## `scripts/qa/scene-dom/foot-oblique-hashes.json`

| المفتاح | السبب |
|---|---|
| `scene\|foot-oblique\|initial\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|initial\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|initial\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|initial\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot8\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot8\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot8\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot8\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rotm8\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rotm8\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rotm8\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rotm8\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot3\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot3\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot3\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot3\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot15\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot15\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot15\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot15\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rotm15\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rotm15\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rotm15\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rotm15\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot40\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot40\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot40\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot40\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot55\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot55\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot55\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot55\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot20\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot20\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot20\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rot20\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerL\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerL\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerL\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerL\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerR\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerR\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerR\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerR\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerMoved\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerMoved\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerMoved\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|markerMoved\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rayOff\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rayOff\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rayOff\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|rayOff\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tight\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tight\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tight\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tight\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|sid102\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|sid102\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|sid102\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|sid102\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|sid200\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|sid200\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|sid200\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|sid200\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tubeM10\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tubeM10\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tubeM10\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tubeM10\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tubeM6\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tubeM6\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tubeM6\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tubeM6\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tube0\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tube0\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tube0\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tube0\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tube15\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tube15\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tube15\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|tube15\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|projFootAp\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|projFootAp\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|projFootAp\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|projFootAp\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|projFootOblique\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|projFootOblique\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|projFootOblique\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|projFootOblique\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|lowKv\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|lowKv\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|lowKv\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|lowKv\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|highKv\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|highKv\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|highKv\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|highKv\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|lowMas\|en\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|lowMas\|en\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|lowMas\|ar\|practice` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |
| `scene\|foot-oblique\|lowMas\|ar\|assessment` | سطر `positioningFoot.rotationHelpOblique` (EN/AR): تقريب حركة العظام بتشويه وقد يبدو المشط الخامس مقصوصًا |

## `scripts/qa/scene-dom/hand-hashes.json`

| المفتاح | السبب |
|---|---|
| `scene\|hand-lateral\|initial\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|initial\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|initial\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|initial\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rot8\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rot8\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rot8\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rot8\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rotm8\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rotm8\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rotm8\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rotm8\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rot3\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rot3\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rot3\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rot3\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerL\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerL\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerL\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerL\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerR\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerR\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerR\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerR\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerMoved\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerMoved\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerMoved\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|markerMoved\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rayOff\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rayOff\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rayOff\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|rayOff\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|tight\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|tight\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|tight\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|tight\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|sid102\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|sid102\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|sid102\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|sid102\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|sid200\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|sid200\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|sid200\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|sid200\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|projPa\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|projPa\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|projPa\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|projPa\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|projLat\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|projLat\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|projLat\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|projLat\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|lowKv\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|lowKv\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|lowKv\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|lowKv\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|highKv\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|highKv\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|highKv\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|highKv\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|lowMas\|en\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|lowMas\|en\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|lowMas\|ar\|practice` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |
| `scene\|hand-lateral\|lowMas\|ar\|assessment` | سطر `positioningHand.rotationHelpLateral` (EN/AR): حركة الإبهام في الإعداد فقط ولا تُحاكى في الأشعة |

## `scripts/qa/scene-dom/hashes.json`

| المفتاح | السبب |
|---|---|
| `scene\|chest-pa-erect\|initial\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|initial\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|initial\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|initial\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rot8\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rot8\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rot8\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rot8\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rotm8\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rotm8\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rotm8\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rotm8\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rot3\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rot3\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rot3\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rot3\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|chinFlip\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|chinFlip\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|chinFlip\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|chinFlip\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|shFlip\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|shFlip\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|shFlip\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|shFlip\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerL\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerL\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerL\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerL\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerR\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerR\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerR\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerR\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerNone\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerNone\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerNone\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerNone\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerMoved\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerMoved\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerMoved\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|markerMoved\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rayOff\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rayOff\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rayOff\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|rayOff\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|tight\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|tight\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|tight\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|tight\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|sid120\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|sid120\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|sid120\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|sid120\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|sid200\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|sid200\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|sid200\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|sid200\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projPA\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projPA\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projPA\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projPA\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projAP\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projAP\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projAP\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projAP\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projLat\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projLat\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projLat\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|projLat\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|lowKv\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|lowKv\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|lowKv\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|lowKv\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|highKv\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|highKv\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|highKv\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|highKv\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|lowMas\|en\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|lowMas\|en\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|lowMas\|ar\|practice` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-pa-erect\|lowMas\|ar\|assessment` | رسم اليدين على الوركين والمرفقين للخارج في عرض الكاشف (`FrontalFigure` بخيار `hands="hips"`، الصدر PA وحده) |
| `scene\|chest-ap-supine\|shFlip\|en\|practice` | المنظر الجانبي: «الكتفان للأمام» يدوّر العضد حول الكتف بدل رفع الكتف (حالة `shFlip` = rolled-forward فقط) |
| `scene\|chest-ap-supine\|shFlip\|en\|assessment` | المنظر الجانبي: «الكتفان للأمام» يدوّر العضد حول الكتف بدل رفع الكتف (حالة `shFlip` = rolled-forward فقط) |
| `scene\|chest-ap-supine\|shFlip\|ar\|practice` | المنظر الجانبي: «الكتفان للأمام» يدوّر العضد حول الكتف بدل رفع الكتف (حالة `shFlip` = rolled-forward فقط) |
| `scene\|chest-ap-supine\|shFlip\|ar\|assessment` | المنظر الجانبي: «الكتفان للأمام» يدوّر العضد حول الكتف بدل رفع الكتف (حالة `shFlip` = rolled-forward فقط) |

## `scripts/qa/scene-dom/knee-ap-hashes.json`

| المفتاح | السبب |
|---|---|
| `scene\|knee-ap\|initial\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|initial\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|initial\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|initial\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|initial\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|initial\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot8\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot8\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot8\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot8\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot8\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot8\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rotm8\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rotm8\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rotm8\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rotm8\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rotm8\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rotm8\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot3\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot3\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot3\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot3\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot3\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot3\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot15\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot15\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot15\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot15\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot15\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot15\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rotm15\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rotm15\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rotm15\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rotm15\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rotm15\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rotm15\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot40\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot40\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot40\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot40\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot40\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot40\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot55\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot55\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot55\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot55\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot55\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot55\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot20\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot20\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot20\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rot20\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rot20\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rot20\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|markerL\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|markerL\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|markerL\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|markerL\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|markerL\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|markerL\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|markerR\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|markerR\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|markerR\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|markerR\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|markerR\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|markerR\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|markerMoved\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|markerMoved\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|markerMoved\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|markerMoved\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|markerMoved\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|markerMoved\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rayOff\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rayOff\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rayOff\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|rayOff\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|rayOff\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|rayOff\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tight\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tight\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tight\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tight\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tight\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tight\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|sid102\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|sid102\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|sid102\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|sid102\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|sid102\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|sid102\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|sid200\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|sid200\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|sid200\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|sid200\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|sid200\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|sid200\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tubeM10\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tubeM10\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tubeM10\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tubeM10\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tubeM10\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tubeM10\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tubeM6\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tubeM6\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tubeM6\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tubeM6\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tubeM6\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tubeM6\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tube0\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tube0\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tube0\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tube0\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tube0\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tube0\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tube15\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tube15\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tube15\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|tube15\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|tube15\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|tube15\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|projKneeAp\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|projKneeAp\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|projKneeAp\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|projKneeAp\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|projKneeAp\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|projKneeAp\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|projKneeLateral\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|projKneeLateral\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|projKneeLateral\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|projKneeLateral\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|projKneeLateral\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|projKneeLateral\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|lowKv\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|lowKv\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|lowKv\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|lowKv\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|lowKv\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|lowKv\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|highKv\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|highKv\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|highKv\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|highKv\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|highKv\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|highKv\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|lowMas\|en\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|lowMas\|en\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|lowMas\|en` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |
| `scene\|knee-ap\|lowMas\|ar\|practice` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `scene\|knee-ap\|lowMas\|ar\|assessment` | نص `positioningKnee.detectorCaptionAp` (EN/AR): النقطة المعلَّمة منتصف المفصل والمرجع نحو 1.25 سم أسفل قمة الرضفة غير الظاهرة |
| `result\|knee-ap\|lowMas\|ar` | نص معيار التوسيط `centreLabel` وتغذيته `centreEn/centreAr` (EN/AR): منتصف المفصل مقابل مرجع قمة الرضفة |

## `scripts/qa/scene-dom/shoulder-grashey-erect-hashes.json`

| المفتاح | السبب |
|---|---|
| `result\|shoulder-grashey-erect\|initial\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|initial\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn0\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn0\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn20\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn20\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn35\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn35\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn40\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn40\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn45\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn45\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn60\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|turn60\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|armNeutral\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|armNeutral\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|armInternal\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|armInternal\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|armExternal\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|armExternal\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|tubeM15\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|tubeM15\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|tubeP15\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|tubeP15\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|markerR\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|markerR\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|markerL\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|markerL\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|sid200\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|sid200\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|tight\|en` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
| `result\|shoulder-grashey-erect\|tight\|ar` | مفتاح الهاشور وسطر تغطية الصورة المرجعية (النسبة محسوبة من `fitAnatomyBox`) بجانب صورة النتيجة |
