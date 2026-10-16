import type { LocalizedText } from "@/domain/localized";
import type { RadiographAssetSpec } from "@/domain/radiograph";

export interface ImageCredit {
  assetId: string;
  registryIds: readonly string[];
  title: LocalizedText;
  url: string;
  author: LocalizedText;
  license: LocalizedText | null;
  licenseUrl: string | null;
  date: LocalizedText;
  evidence: "verified" | "ownerVerified" | "deferred";
  modifications: LocalizedText;
  context?: LocalizedText;
}

// Transcribed from the asset registry and the audit §2/§6; never parsed at runtime.
export const IMAGE_CREDITS: readonly ImageCredit[] = [
  {
    "assetId": "chest-pa-baseline",
    "registryIds": [
      "A-001",
      "A-002",
      "A-003"
    ],
    "title": {
      "en": "Normal posteroanterior (PA) chest radiograph (X-ray).jpg",
      "ar": "Normal posteroanterior (PA) chest radiograph (X-ray).jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:Normal_posteroanterior_(PA)_chest_radiograph_(X-ray).jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-06-28",
      "ar": "2017-06-28"
    },
    "evidence": "verified",
    "modifications": {
      "en": "Side annotations removed by background interpolation; greyscale JPEG web copy, resized to 1000 × 1144.",
      "ar": "إزالة علامتي الجانب باستيفاء الخلفية؛ نسخة ويب JPEG رمادية مصغرة إلى \u20661000 × 1144\u2069."
    }
  },
  {
    "assetId": "chest-lateral-baseline",
    "registryIds": [
      "A-006",
      "A-007"
    ],
    "title": {
      "en": "Normal lateral chest radiograph (X-ray).jpg",
      "ar": "Normal lateral chest radiograph (X-ray).jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:Normal_lateral_chest_radiograph_(X-ray).jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-06-28",
      "ar": "2017-06-28"
    },
    "evidence": "verified",
    "modifications": {
      "en": "Greyscale JPEG web copy, resized to 1000 × 1387, metadata removed; no crop or retouch.",
      "ar": "نسخة ويب JPEG رمادية مصغرة إلى \u20661000 × 1387\u2069 دون بيانات وصفية؛ دون اقتصاص أو تنقيح."
    }
  },
  {
    "assetId": "chest-ap-baseline",
    "registryIds": [
      "A-008",
      "A-009"
    ],
    "title": {
      "en": "NIH ChestX-ray14 — 00023616_000",
      "ar": "NIH ChestX-ray14 — 00023616_000"
    },
    "url": "https://nihcc.app.box.com/v/ChestXray-NIHCC",
    "author": {
      "en": "NIH Clinical Center — data provider",
      "ar": "NIH Clinical Center — مزوّد البيانات"
    },
    "license": null,
    "licenseUrl": null,
    "date": {
      "en": "2017 (dataset)",
      "ar": "2017 (dataset)"
    },
    "evidence": "deferred",
    "modifications": {
      "en": "Lossless PNG re-encode without timestamp metadata; pixels unchanged. Acquisition posture is not established.",
      "ar": "إعادة ترميز PNG بلا فقد وحذف بيانات الوقت؛ البكسلات دون تغيير. وضعية المريض وقت التصوير غير مثبتة."
    },
    "context": {
      "en": "Reference radiograph: an AP chest radiograph from the NIH ChestX-ray14 dataset (teaching approximation: a representative normal adult of a different person, not the patient of this case). Data provider: NIH Clinical Center, download site https://nihcc.app.box.com/v/ChestXray-NIHCC. Citation: Xiaosong Wang, Yifan Peng, Le Lu, Zhiyong Lu, Mohammadhadi Bagheri, Ronald Summers, ChestX-ray8: Hospital-scale Chest X-ray Database and Benchmarks on Weakly-Supervised Classification and Localization of Common Thorax Diseases, IEEE CVPR, pp. 3462-3471, 2017.",
      "ar": "الصورة المرجعية: صورة صدر AP من مجموعة بيانات NIH ChestX-ray14 (تقريب تعليمي: صورة تمثيلية طبيعية لشخص بالغ آخر، وليست للمريضة في هذه الحالة). مزوّد البيانات: المركز السريري في المعاهد الوطنية للصحة الأمريكية (NIH Clinical Center)، موقع التنزيل: https://nihcc.app.box.com/v/ChestXray-NIHCC. المرجع: Xiaosong Wang, Yifan Peng, Le Lu, Zhiyong Lu, Mohammadhadi Bagheri, Ronald Summers, ChestX-ray8: Hospital-scale Chest X-ray Database and Benchmarks on Weakly-Supervised Classification and Localization of Common Thorax Diseases, IEEE CVPR, pp. 3462-3471, 2017."
    }
  },
  {
    "assetId": "wrist-pa-baseline",
    "registryIds": [
      "A-010",
      "A-011"
    ],
    "title": {
      "en": "X-ray of normal wrist by dorsoplantar projection (crop).jpg",
      "ar": "X-ray of normal wrist by dorsoplantar projection (crop).jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_wrist_by_dorsoplantar_projection_(crop).jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-10-29",
      "ar": "2017-10-29"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Greyscale JPEG web copy without metadata; no additional crop or resizing.",
      "ar": "نسخة ويب JPEG رمادية بلا بيانات وصفية؛ دون اقتصاص إضافي أو تغيير الحجم."
    }
  },
  {
    "assetId": "wrist-lateral-baseline",
    "registryIds": [
      "A-012",
      "A-013"
    ],
    "title": {
      "en": "X-ray of normal wrist by lateral projection.jpg",
      "ar": "X-ray of normal wrist by lateral projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_wrist_by_lateral_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-10-29",
      "ar": "2017-10-29"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Lower 356 rows cropped to remove side text; greyscale JPEG web copy without metadata.",
      "ar": "اقتصاص 356 صفًا من الأسفل لإزالة نص الجانب؛ نسخة ويب JPEG رمادية بلا بيانات وصفية."
    }
  },
  {
    "assetId": "hand-pa-baseline",
    "registryIds": [
      "A-014",
      "A-015"
    ],
    "title": {
      "en": "X-ray of normal hand by dorsoplantar projection.jpg",
      "ar": "X-ray of normal hand by dorsoplantar projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_hand_by_dorsoplantar_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-10-29",
      "ar": "2017-10-29"
    },
    "evidence": "verified",
    "modifications": {
      "en": "Burned-in side text filled; no crop; greyscale JPEG web copy without metadata.",
      "ar": "إزالة نص الجانب المطبوع بالتعبئة؛ دون اقتصاص؛ نسخة ويب JPEG رمادية بلا بيانات وصفية."
    }
  },
  {
    "assetId": "hand-lateral-baseline",
    "registryIds": [
      "A-016",
      "A-017"
    ],
    "title": {
      "en": "X-ray of normal hand by lateral projection.jpg",
      "ar": "X-ray of normal hand by lateral projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_hand_by_lateral_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-10-29",
      "ar": "2017-10-29"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Burned-in side text filled; no crop; greyscale JPEG web copy without metadata. Small soft-tissue fill artefact remains.",
      "ar": "إزالة نص الجانب المطبوع بالتعبئة؛ دون اقتصاص؛ نسخة ويب JPEG رمادية بلا بيانات وصفية. بقي أثر تعبئة صغير في النسج الرخوة."
    }
  },
  {
    "assetId": "elbow-ap-baseline",
    "registryIds": [
      "A-018",
      "A-019"
    ],
    "title": {
      "en": "X-ray of normal elbow by anteroposterior projection.jpg",
      "ar": "X-ray of normal elbow by anteroposterior projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_elbow_by_anteroposterior_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-10-29",
      "ar": "2017-10-29"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Side text filled; bottom 38 and top 3 rows cropped to remove lettering and frame; greyscale JPEG web copy without metadata.",
      "ar": "إزالة نص الجانب بالتعبئة؛ اقتصاص 38 صفًا من الأسفل و3 من الأعلى لإزالة الحروف والإطار؛ نسخة ويب JPEG رمادية بلا بيانات وصفية."
    }
  },
  {
    "assetId": "elbow-lateral-baseline",
    "registryIds": [
      "A-020",
      "A-021"
    ],
    "title": {
      "en": "X-ray of normal elbow by lateral projection.jpg",
      "ar": "X-ray of normal elbow by lateral projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_elbow_by_lateral_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-10-29",
      "ar": "2017-10-29"
    },
    "evidence": "verified",
    "modifications": {
      "en": "Greyscale JPEG web copy without metadata; no crop or fill.",
      "ar": "نسخة ويب JPEG رمادية بلا بيانات وصفية؛ دون اقتصاص أو تعبئة."
    }
  },
  {
    "assetId": "knee-ap-baseline",
    "registryIds": [
      "A-022",
      "A-023"
    ],
    "title": {
      "en": "X-ray of a normal knee by anteroposterior projection.jpg",
      "ar": "X-ray of a normal knee by anteroposterior projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_a_normal_knee_by_anteroposterior_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2018-01-05",
      "ar": "2018-01-05"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Side text filled and bright top/left edge artefacts repaired; greyscale JPEG web copy without metadata, no crop.",
      "ar": "إزالة نص الجانب بالتعبئة وإصلاح آثار الحافتين العليا واليسرى؛ نسخة ويب JPEG رمادية بلا بيانات وصفية ودون اقتصاص."
    }
  },
  {
    "assetId": "knee-lateral-baseline",
    "registryIds": [
      "A-024",
      "A-025"
    ],
    "title": {
      "en": "X-ray of a normal knee by lateral projection.jpg",
      "ar": "X-ray of a normal knee by lateral projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_a_normal_knee_by_lateral_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2018-01-05",
      "ar": "2018-01-05"
    },
    "evidence": "verified",
    "modifications": {
      "en": "Side text filled and bright top/left edge artefacts repaired; greyscale JPEG web copy without metadata, no crop. Source description notes a minimal osteophyte.",
      "ar": "إزالة نص الجانب بالتعبئة وإصلاح آثار الحافتين العليا واليسرى؛ نسخة ويب JPEG رمادية بلا بيانات وصفية ودون اقتصاص. يذكر وصف المصدر نابتة عظمية طفيفة."
    }
  },
  {
    "assetId": "foot-ap-baseline",
    "registryIds": [
      "A-026",
      "A-027"
    ],
    "title": {
      "en": "X-ray of normal right foot by dorsoplantar projection.jpg",
      "ar": "X-ray of normal right foot by dorsoplantar projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_right_foot_by_dorsoplantar_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-07-28",
      "ar": "2017-07-28"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Side text filled, bright edge artefacts repaired and bottom cropped at row 2405; greyscale JPEG web copy without metadata.",
      "ar": "إزالة نص الجانب بالتعبئة وإصلاح آثار الحواف المضيئة واقتصاص الأسفل عند الصف 2405؛ نسخة ويب JPEG رمادية بلا بيانات وصفية."
    }
  },
  {
    "assetId": "foot-oblique-baseline",
    "registryIds": [
      "A-028",
      "A-029"
    ],
    "title": {
      "en": "X-ray of normal right foot by oblique projection.jpg",
      "ar": "X-ray of normal right foot by oblique projection.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_right_foot_by_oblique_projection.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-07-28",
      "ar": "2017-07-28"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Side text filled and bottom frame cropped at row 1960; greyscale JPEG web copy without metadata.",
      "ar": "إزالة نص الجانب بالتعبئة واقتصاص الإطار السفلي عند الصف 1960؛ نسخة ويب JPEG رمادية بلا بيانات وصفية."
    }
  },
  {
    "assetId": "ankle-ap-baseline",
    "registryIds": [
      "A-030",
      "A-031"
    ],
    "title": {
      "en": "X-ray of normal ankle - frontal.jpg",
      "ar": "X-ray of normal ankle - frontal.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_ankle_-_frontal.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-10-24",
      "ar": "2017-10-24"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Greyscale JPEG web copy without metadata; no pixel repair or crop.",
      "ar": "نسخة ويب JPEG رمادية بلا بيانات وصفية؛ دون إصلاح بكسلات أو اقتصاص."
    }
  },
  {
    "assetId": "ankle-lateral-baseline",
    "registryIds": [
      "A-032",
      "A-033"
    ],
    "title": {
      "en": "X-ray of normal ankle - lateral.jpg",
      "ar": "X-ray of normal ankle - lateral.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_normal_ankle_-_lateral.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-10-24",
      "ar": "2017-10-24"
    },
    "evidence": "ownerVerified",
    "modifications": {
      "en": "Greyscale JPEG web copy without metadata; no pixel repair or crop. Residual source obliquity remains.",
      "ar": "نسخة ويب JPEG رمادية بلا بيانات وصفية؛ دون إصلاح بكسلات أو اقتصاص. بقي الميل الموجود في المصدر."
    }
  },
  {
    "assetId": "pelvis-ap-baseline",
    "registryIds": [
      "A-034",
      "A-035",
      "A-036"
    ],
    "title": {
      "en": "X-ray of the pelvis of an 18 year old male - case 1 - anteroposterior.jpg",
      "ar": "X-ray of the pelvis of an 18 year old male - case 1 - anteroposterior.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:X-ray_of_the_pelvis_of_an_18_year_old_male_-_case_1_-_anteroposterior.jpg",
    "author": {
      "en": "UC San Diego Health radiology staff / bonepit.com",
      "ar": "طاقم الأشعة في UC San Diego Health / bonepit.com"
    },
    "license": {
      "en": "Public domain (Commons declaration)",
      "ar": "ملكية عامة (بحسب تصريح كومنز)"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "date": {
      "en": "2018-03-14",
      "ar": "2018-03-14"
    },
    "evidence": "verified",
    "modifications": {
      "en": "Edge marker and graphics removed from background only; lossless PNG product copy, no crop or resize.",
      "ar": "إزالة علامة الحافة ورسومها من الخلفية فقط؛ نسخة PNG بلا فقد ودون اقتصاص أو تغيير الحجم."
    },
    "context": {
      "en": "Reference: AP pelvis of an 18-year-old male, per UC San Diego Health radiology staff / bonepit.com, Wikimedia Commons, public domain. Edge marker/graphics removed from background only. Educational appearance reference, not a diagnostic image or the fictional case patient. Pelvic rotation is approximated by a warp of this one image; femoral-neck/hidden-trochanter changes are not reconstructed.",
      "ar": "المرجع: حوض AP لذكر عمره 18 عامًا بحسب طاقم الأشعة في UC San Diego Health / bonepit.com، ويكيميديا كومنز، ملكية عامة. أُزيلت علامة الحافة ورسومها من الخلفية فقط. مرجع مظهر تعليمي، وليس صورة تشخيصية أو للمريض الافتراضي في الحالة. يُقرّب دوران الحوض بتحويل هذه الصورة الواحدة؛ لا يُعاد بناء تغيّرات عنق الفخذ أو المدورات المخفية."
    }
  },
  {
    "assetId": "shoulder-grashey-baseline",
    "registryIds": [
      "A-037",
      "A-038"
    ],
    "title": {
      "en": "Anteroposterior glenoid (Grashey view) X-ray of a normal shoulder.jpg",
      "ar": "Anteroposterior glenoid (Grashey view) X-ray of a normal shoulder.jpg"
    },
    "url": "https://commons.wikimedia.org/wiki/File:Anteroposterior_glenoid_(Grashey_view)_X-ray_of_a_normal_shoulder.jpg",
    "author": {
      "en": "Mikael Häggström",
      "ar": "Mikael Häggström"
    },
    "license": {
      "en": "CC0 1.0 Universal",
      "ar": "CC0 1.0 Universal"
    },
    "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
    "date": {
      "en": "2017-08-27",
      "ar": "2017-08-27"
    },
    "evidence": "verified",
    "modifications": {
      "en": "Lossless greyscale PNG without metadata; pixels unchanged. The uploader describes recurrent dislocation with no visible abnormality; this is not presented as an asymptomatic shoulder.",
      "ar": "نسخة PNG رمادية بلا فقد ودون بيانات وصفية؛ البكسلات دون تغيير. يصف الرافع خلعًا متكررًا دون شذوذ ظاهر؛ ولا تُعرض ككتف بلا أعراض."
    },
    "context": {
      "en": "Reference: AP glenoid (Grashey) radiograph of the right shoulder of a 31-year-old man, by Mikael Häggström, Wikimedia Commons, CC0 1.0. The uploader describes recurrent shoulder dislocation with no visible abnormality; it is not presented as a normal or asymptomatic shoulder. Educational appearance reference, not a diagnostic image or the fictional case patient. The only simulated cue is the closing of the joint space, drawn by a warp of this one image outside the 35°–45° body-turn range.",
      "ar": "المرجع: صورة أشعة للجوف الحقاني (غراشي) للكتف الأيمن لرجل عمره 31 عامًا، بواسطة Mikael Häggström، ويكيميديا كومنز، CC0 1.0. يصف الرافع خلعًا متكررًا في الكتف دون شذوذ ظاهر؛ ولا تُعرض على أنها كتف سليم أو بلا أعراض. مرجع مظهر تعليمي، وليس صورة تشخيصية أو للمريض الافتراضي في الحالة. الإشارة المحاكاة الوحيدة هي انغلاق الحيّز المفصلي، وتُرسم بتحويل هذه الصورة الواحدة خارج نطاق دوران الجسم 35°–45°."
    }
  }
];

export function creditFor(asset: Pick<RadiographAssetSpec, "id" | "registryIds">): ImageCredit | undefined {
  return IMAGE_CREDITS.find((credit) => credit.assetId === asset.id &&
    credit.registryIds.length === asset.registryIds.length &&
    credit.registryIds.every((id) => asset.registryIds.includes(id)));
}

/** Deduplicate shared baselines across scenarios; new cases need no JSX edits. */
export function usedImageCredits(cases: readonly { examId: string; radiograph: RadiographAssetSpec }[]) {
  const assets = new Map<string, { credit: ImageCredit; examIds: Set<string> }>();
  for (const item of cases) {
    const credit = creditFor(item.radiograph);
    if (!credit) throw new Error(`Missing credit for ${item.radiograph.id}`);
    const entry = assets.get(credit.assetId) ?? { credit, examIds: new Set<string>() };
    entry.examIds.add(item.examId);
    assets.set(credit.assetId, entry);
  }
  return [...assets.values()];
}

export interface ScientificCredit {
  id: string;
  title: LocalizedText;
  author: LocalizedText;
  edition: LocalizedText;
  locators: LocalizedText;
  role: "governing" | "supporting" | "recorded";
}
export const SCIENTIFIC_CREDITS: readonly ScientificCredit[] = [
  {
    "id": "bontrager",
    "title": {
      "en": "Bontrager’s Textbook of Radiographic Positioning and Related Anatomy",
      "ar": "Bontrager’s Textbook of Radiographic Positioning and Related Anatomy"
    },
    "author": {
      "en": "Lampignano JP; Kendrick LE — Elsevier",
      "ar": "Lampignano JP; Kendrick LE — Elsevier"
    },
    "edition": {
      "en": "9th ed., 2018",
      "ar": "9th ed., 2018"
    },
    "locators": {
      "en": "pp. 32–33, 36, 81–84, 87, 92, 94, 96, 150, 152–153, 156, 158, 166, 172, 196, 201, 224–225, 232–233, 239–240, 242–243, 246, 249, 271–272, 279",
      "ar": "pp. 32–33, 36, 81–84, 87, 92, 94, 96, 150, 152–153, 156, 158, 166, 172, 196, 201, 224–225, 232–233, 239–240, 242–243, 246, 249, 271–272, 279"
    },
    "role": "governing"
  },
  {
    "id": "ec",
    "title": {
      "en": "European Guidelines on Quality Criteria for Diagnostic Radiographic Images, EUR 16260 EN",
      "ar": "European Guidelines on Quality Criteria for Diagnostic Radiographic Images, EUR 16260 EN"
    },
    "author": {
      "en": "European Commission",
      "ar": "European Commission"
    },
    "edition": {
      "en": "1996",
      "ar": "1996"
    },
    "locators": {
      "en": "PDF pp. 15, 20–21",
      "ar": "PDF pp. 15, 20–21"
    },
    "role": "supporting"
  },
  {
    "id": "who-chest",
    "title": {
      "en": "The WHO manual of diagnostic imaging: radiographic anatomy and interpretation of the chest and the pulmonary system",
      "ar": "The WHO manual of diagnostic imaging: radiographic anatomy and interpretation of the chest and the pulmonary system"
    },
    "author": {
      "en": "Ellis SM; Flower C; eds Ostensen H, Pettersson H — WHO",
      "ar": "Ellis SM; Flower C; eds Ostensen H, Pettersson H — WHO"
    },
    "edition": {
      "en": "2006 (web listing 2012)",
      "ar": "2006 (web listing 2012)"
    },
    "locators": {
      "en": "pp. 3–5, 17, 27–29, 32",
      "ar": "pp. 3–5, 17, 27–29, 32"
    },
    "role": "supporting"
  },
  {
    "id": "statpearls",
    "title": {
      "en": "X-ray Radiographic Patient Positioning, NBK565865",
      "ar": "X-ray Radiographic Patient Positioning, NBK565865"
    },
    "author": {
      "en": "StatPearls Publishing / NCBI Bookshelf",
      "ar": "StatPearls Publishing / NCBI Bookshelf"
    },
    "edition": {
      "en": "Revision date not recorded",
      "ar": "تاريخ المراجعة غير مسجل"
    },
    "locators": {
      "en": "Projections; Positioning – Chest",
      "ar": "الإسقاطات؛ التموضع – الصدر"
    },
    "role": "supporting"
  },
  {
    "id": "acr-chest",
    "title": {
      "en": "ACR–SPR–STR Practice Parameter for the Performance of Chest Radiography",
      "ar": "ACR–SPR–STR Practice Parameter for the Performance of Chest Radiography"
    },
    "author": {
      "en": "ACR / SPR / STR",
      "ar": "ACR / SPR / STR"
    },
    "edition": {
      "en": "2022; amended 2023",
      "ar": "2022; amended 2023"
    },
    "locators": {
      "en": "I, IV, VI",
      "ar": "I, IV, VI"
    },
    "role": "supporting"
  },
  {
    "id": "acr-portable",
    "title": {
      "en": "ACR–SPR–STR Practice Parameter for the Performance of Portable (Mobile Unit) Chest Radiography",
      "ar": "ACR–SPR–STR Practice Parameter for the Performance of Portable (Mobile Unit) Chest Radiography"
    },
    "author": {
      "en": "ACR / SPR / STR",
      "ar": "ACR / SPR / STR"
    },
    "edition": {
      "en": "2022; amended 2023",
      "ar": "2022; amended 2023"
    },
    "locators": {
      "en": "I, II, IV, VI",
      "ar": "I, II, IV, VI"
    },
    "role": "supporting"
  },
  {
    "id": "who-tech",
    "title": {
      "en": "The WHO manual of diagnostic imaging: Radiographic technique and projections",
      "ar": "The WHO manual of diagnostic imaging: Radiographic technique and projections"
    },
    "author": {
      "en": "Sandstrom S; eds Ostensen H, Pettersson H — WHO / ISR",
      "ar": "Sandstrom S; eds Ostensen H, Pettersson H — WHO / ISR"
    },
    "edition": {
      "en": "2003",
      "ar": "2003"
    },
    "locators": {
      "en": "pp. 4, 6–10",
      "ar": "pp. 4, 6–10"
    },
    "role": "supporting"
  },
  {
    "id": "clark",
    "title": {
      "en": "Clark’s Positioning in Radiography",
      "ar": "Clark’s Positioning in Radiography"
    },
    "author": {
      "en": "Whitley AS et al. — Hodder Arnold",
      "ar": "Whitley AS et al. — Hodder Arnold"
    },
    "edition": {
      "en": "12th ed., 2005",
      "ar": "12th ed., 2005"
    },
    "locators": {
      "en": "p. 10 only; chest chapter unread",
      "ar": "ص. 10 فقط؛ فصل الصدر غير مقروء"
    },
    "role": "supporting"
  },
  {
    "id": "iaea796",
    "title": {
      "en": "IAEA-TECDOC-796",
      "ar": "IAEA-TECDOC-796"
    },
    "author": {
      "en": "IAEA",
      "ar": "IAEA"
    },
    "edition": {
      "en": "Year / locators not recorded in the PA reference",
      "ar": "السنة ومواضع الاستشهاد غير مسجلة في مرجع الصدر PA"
    },
    "locators": {
      "en": "PA technique reference; original reading not established in the source register",
      "ar": "مرجع تقنية الصدر PA؛ القراءة الأصلية غير مثبتة في سجل المصادر"
    },
    "role": "recorded"
  },
  {
    "id": "iaea47",
    "title": {
      "en": "Quality Control in Diagnostic Radiology, Human Health Series No. 47",
      "ar": "Quality Control in Diagnostic Radiology, Human Health Series No. 47"
    },
    "author": {
      "en": "IAEA",
      "ar": "IAEA"
    },
    "edition": {
      "en": "Year / locators not recorded in the PA reference",
      "ar": "السنة ومواضع الاستشهاد غير مسجلة في مرجع الصدر PA"
    },
    "locators": {
      "en": "PA technique reference; original reading not established in the source register",
      "ar": "مرجع تقنية الصدر PA؛ القراءة الأصلية غير مثبتة في سجل المصادر"
    },
    "role": "recorded"
  },
  {
    "id": "aapm116",
    "title": {
      "en": "An Exposure Indicator for Digital Radiography, Report 116",
      "ar": "An Exposure Indicator for Digital Radiography, Report 116"
    },
    "author": {
      "en": "AAPM TG-116",
      "ar": "AAPM TG-116"
    },
    "edition": {
      "en": "Year / locators not recorded in the PA reference",
      "ar": "السنة ومواضع الاستشهاد غير مسجلة في مرجع الصدر PA"
    },
    "locators": {
      "en": "PA technique reference; original reading not established in the source register",
      "ar": "مرجع تقنية الصدر PA؛ القراءة الأصلية غير مثبتة في سجل المصادر"
    },
    "role": "recorded"
  },
  {
    "id": "aapm232",
    "title": {
      "en": "Current State of Practice Regarding Digital Radiography Exposure Indicators and Deviation Indices",
      "ar": "Current State of Practice Regarding Digital Radiography Exposure Indicators and Deviation Indices"
    },
    "author": {
      "en": "AAPM TG-232",
      "ar": "AAPM TG-232"
    },
    "edition": {
      "en": "2018",
      "ar": "2018"
    },
    "locators": {
      "en": "PA technique reference; original reading not established in the source register",
      "ar": "مرجع تقنية الصدر PA؛ القراءة الأصلية غير مثبتة في سجل المصادر"
    },
    "role": "recorded"
  },
  {
    "id": "iec",
    "title": {
      "en": "IEC 62494-1 — Exposure index of digital X-ray imaging systems",
      "ar": "IEC 62494-1 — Exposure index of digital X-ray imaging systems"
    },
    "author": {
      "en": "IEC",
      "ar": "IEC"
    },
    "edition": {
      "en": "Edition / locators not recorded in the PA reference",
      "ar": "الطبعة ومواضع الاستشهاد غير مسجلة في مرجع الصدر PA"
    },
    "locators": {
      "en": "PA technique reference; original reading not established in the source register",
      "ar": "مرجع تقنية الصدر PA؛ القراءة الأصلية غير مثبتة في سجل المصادر"
    },
    "role": "recorded"
  },
  {
    "id": "iaea1423",
    "title": {
      "en": "Optimization of the radiological protection of patients undergoing radiography, fluoroscopy and computed tomography — IAEA-TECDOC-1423",
      "ar": "Optimization of the radiological protection of patients undergoing radiography, fluoroscopy and computed tomography — IAEA-TECDOC-1423"
    },
    "author": {
      "en": "International Atomic Energy Agency",
      "ar": "الوكالة الدولية للطاقة الذرية"
    },
    "edition": {
      "en": "2004",
      "ar": "2004"
    },
    "locators": {
      "en": "Cited in earlier PA references; pages not recorded. Further full-text material was not obtained.",
      "ar": "مذكور في مراجع الصدر PA السابقة؛ الصفحات غير مسجلة. لم تتوفر المواد الإضافية من النص الكامل."
    },
    "role": "recorded"
  }
];
