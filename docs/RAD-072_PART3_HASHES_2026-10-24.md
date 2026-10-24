# RAD-072 الجزء 3 المرحلة A — بصمات scene-dom المتغيرة (2026-10-24)

قبول S-STD-2 المسبق: [قرار الجزء 3 البندان 4 و5](DECISIONS.md#rad072-3-owner-2026-10-24). الملفان الوحيدان المتغيران: `scripts/qa/scene-dom/pelvis-ap-supine-hashes.json` و`scripts/qa/scene-dom/shoulder-grashey-erect-hashes.json`. التقرير: [المرحلة A](RAD-072_PART3_PHASE_A_REPORT_2026-10-24.md). أسماء المفاتيح وترتيبها مطابقة لـ`origin/main` في الملفين؛ لا characterisation ولا golden ولا ملف بصمات آخر تغيّر.

- الحوض: **70** من 72 مفتاحًا (48 `scene|…` و22 `result|…`؛ مفتاحا `result|…|markerR` بلا تغيير لأن R في موضعه الصحيح تجتاز كما قبل).
- الكتف: **64** من 96 مفتاحًا، كلها `scene|…` (منظر الأعلى: موضع تسمية Anterior وقضيب الساعد ونص التسمية التوضيحية)؛ لا مفتاح `result|…`.

## الحوض

| المفتاح | السبب |
|---|---|
| `scene\|pelvis-ap-supine\|initial\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|initial\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|initial\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|initial\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|initial\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|initial\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|rotationM15\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|rotationM15\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|rotationM15\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|rotationM15\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|rotationM15\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|rotationM15\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|rotationP15\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|rotationP15\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|rotationP15\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|rotationP15\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|rotationP15\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|rotationP15\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|rotation0\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|rotation0\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|rotation0\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|rotation0\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|rotation0\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|rotation0\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|legsInternal\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|legsInternal\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|legsInternal\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|legsInternal\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|legsInternal\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|legsInternal\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|legsExternal\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|legsExternal\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|legsExternal\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|legsExternal\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|legsExternal\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|legsExternal\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|tubeM15\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|tubeM15\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|tubeM15\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|tubeM15\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|tubeM15\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|tubeM15\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|tubeP15\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|tubeP15\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|tubeP15\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|tubeP15\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|tubeP15\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|tubeP15\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|markerR\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|markerR\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|markerR\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|markerR\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|markerL\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|markerL\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|markerL\|en` | L على يمين المشاهد لم تعد جانبًا خاطئًا (القاعدة) ونص `side-marker` |
| `scene\|pelvis-ap-supine\|markerL\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|markerL\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|markerL\|ar` | L على يمين المشاهد لم تعد جانبًا خاطئًا (القاعدة) ونص `side-marker` |
| `scene\|pelvis-ap-supine\|sid200\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|sid200\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|sid200\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|sid200\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|sid200\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|sid200\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|tight\|en\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|tight\|en\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|tight\|en` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |
| `scene\|pelvis-ap-supine\|tight\|ar\|practice` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `scene\|pelvis-ap-supine\|tight\|ar\|assessment` | نص `positioningPelvis.markerConvention` و`markerHint` (EN/AR) في لوحة المشهد: قاعدة جانب R الجديدة |
| `result\|pelvis-ap-supine\|tight\|ar` | نص `side-marker` عند غياب العلامة (الحالة الابتدائية بلا علامة): تغذية راجعة جديدة EN/AR |

## الكتف

| المفتاح | السبب |
|---|---|
| `scene\|shoulder-grashey-erect\|initial\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|initial\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|initial\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|initial\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn0\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn0\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn0\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn0\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn20\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn20\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn20\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn20\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn35\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn35\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn35\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn35\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn40\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn40\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn40\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn40\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn45\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn45\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn45\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn45\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn60\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn60\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn60\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|turn60\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armNeutral\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armNeutral\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armNeutral\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armNeutral\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armInternal\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armInternal\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armInternal\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armInternal\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armExternal\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armExternal\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armExternal\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|armExternal\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tubeM15\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tubeM15\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tubeM15\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tubeM15\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tubeP15\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tubeP15\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tubeP15\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tubeP15\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|markerR\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|markerR\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|markerR\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|markerR\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|markerL\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|markerL\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|markerL\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|markerL\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|sid200\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|sid200\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|sid200\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|sid200\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tight\|en\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tight\|en\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tight\|ar\|practice` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
| `scene\|shoulder-grashey-erect\|tight\|ar\|assessment` | `ShoulderSideView`: تسمية Anterior تُبعد عن الحزمة، قضيب الساعد يتبع وضع الذراع، ونص `sideViewCaption` (EN/AR) |
