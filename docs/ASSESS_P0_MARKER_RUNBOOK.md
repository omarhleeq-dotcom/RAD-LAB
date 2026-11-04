# P0 — بعد دمج إصلاح بصمة `rad085-review-ready`: فتح النشر المحظور

للمالك فقط، بعد دمج Draft الخاص بـP0. لا يمنح هذا الملف إذنًا حيًا بذاته؛ كل خطوة قراءة أو ضبط Variable أو إعادة تشغيل Workflow. القرار: [DS-9](DECISIONS.md#assess-self-service-owner-2026-11-05) والاقتراح الأصلي [هنا](ASSESS_SELF_SERVICE_DESIGN.md#7-gap-ledger).

**ماذا تغيّر:** الفحص يستبعد من بصمة `functions` منحَ EXECUTE الخمسة الخاصة بـW1 لـ`assess_grading_worker` فقط (مطابقة الاسم والصلاحية وعدم قابلية المنح والتواقيع الخمسة)؛ أي منح آخر ما زال يُفشل البصمة. لذلك تعود القيمة المتوقعة `5fcd5e713c9e39b74f39ba6a969080d5` صحيحة في الإنتاج وفي CI. تغيّر بايتات ملف فحص يغيّر علامة `pilot-v1`.

| | القيمة |
|---|---|
| العلامة قبل P0 | `pilot-v1:3d8b505ca8605f99f226475ced8e7aa1db576a5829c66cc5e6499e1aab4c18b7` |
| العلامة الجديدة (بعد P0 وبعد P6) | `pilot-v1:466390675b4ac3c32c56c242ec02eeebfe5a745f7bfcc37f57b955576fb23d19` |

**ما يحدث عند الدمج:** Deploy Pages على `main` يفشل عند بوابة المخطط لأن `PILOT_SCHEMA_VERIFIED` ما زال القيمة القديمة. هذا متوقع؛ الموقع المنشور سابقًا يبقى كما هو. الترتيب أدناه إلزامي.

## 1. شغّل الفحص على الإنتاج (قراءة فقط)

الطريقة المجرّبة: من WSL على اللابتوب، بدالة `owner_sql` نفسها المعرّفة في [دليل النافذة](RAD-085_RAD-059_WINDOW_RUNBOOK.md) (تطبع كل مجموعات النتائج):

```bash
owner_sql -f supabase/checks/rad085-review-ready.sql
```

بديل SQL Editor (لم يُجرَّب هنا، **Inferred**: المحرر يعرض غالبًا آخر نتيجة فقط، فشغّل الكتل منفصلة): الكتلة A = الأسطر 6–45، B = السطر 46، C = الأسطر 47–57 من الملف (بدون `begin`/`rollback`). الملف يقرأ فقط ولا يغيّر شيئًا.

**المتوقع (11 صفًا في المجموع، كلها `ok = t`):** A ستة صفوف: `functions` بالقيمتين الفعلية والمتوقعة `5fcd5e713c9e39b74f39ba6a969080d5`، و`relations` `95ae71fb2b1b1c45707cb6247ef6e95a`، و`identity_inventory` و`not_null_constraints_plain` و`closed_gate` و`worker_nologin`؛ B صف واحد `quota_values`؛ C أربعة صفوف `quota_private` و`quota_helper_private` و`consent_v3_acl` و`emergency_schema_private`.

**STOP:** أي `ok = f` (خاصة `functions` بقيمة فعلية مختلفة عن `5fcd5e71…`) ← لا تكمل إلى الخطوة 2؛ أرسل الصف كاملًا ولا تضبط Variable.

## 2. اضبط `PILOT_SCHEMA_VERIFIED`

1. تحقق من العلامة بعنوان مشروعك الحقيقي (من اللابتوب، في نسخة `main` بعد الدمج): `NEXT_PUBLIC_SUPABASE_URL=<عنوان المشروع العام> node scripts/pages/pilot-schema-gate.mjs --print-marker`. **المتوقع:** السطر الوحيد `pilot-v1:466390675b4ac3c32c56c242ec02eeebfe5a745f7bfcc37f57b955576fb23d19`. أي قيمة أخرى ← STOP (العنوان أو النسخة مختلفان).
2. GitHub ← Settings ← Secrets and variables ← Actions ← **Variables** ← `PILOT_SCHEMA_VERIFIED` ← Edit ← الصق القيمة الجديدة كاملة ← Update. لا تغيّر أي Variable أو Secret آخر.

## 3. أعد تشغيل Deploy Pages المحظور

Actions ← Deploy Pages ← آخر تشغيل فاشل على `main` ← **Re-run failed jobs**.

**المتوقع:** خطوة بوابة المخطط تنجح ثم يكتمل النشر أخضر. **STOP:** إن فشلت البوابة مجددًا فالقيمة المضبوطة لا تطابق §2.1؛ أعد الخطوة 2 ولا تعطّل البوابة ولا تتخطّها.
