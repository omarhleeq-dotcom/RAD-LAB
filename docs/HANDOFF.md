# RAD-LAB — ملف تسليم العمل للمحادثة التالية

ملخص قصير (سقفه 80 سطرًا، يفرضه `npm run status:check`). القرارات الملزمة في [DECISIONS.md](DECISIONS.md)، وتعليمات العمل في [CLAUDE.md](../CLAUDE.md)، والحالة الحية للمهام في [project-status.md](project-status.md). التاريخ في [archive/HANDOFF-until-2026-10-16.md](archive/HANDOFF-until-2026-10-16.md) و[status-archive.md](status-archive.md). **افحص Git عند البداية**: هذا الملف ملخص لا سلطة.

## 1. نقطة البداية
- آخر دمج معروف: PR #59 (قاعدة S-STD-3) على `main`، بعد PR #58 (RAD-044b). تحقق من HEAD وPR المفتوحة قبل أي عمل. الدمج يدوي من المالك؛ أنشئ Draft PR ولا تدمج.
- القاعدة الجديدة (CLAUDE.md رقم 9): كل ميزة تذكر في PR السقف الذي قد تخلقه وكيف تتفاداه (`SCALE CHECK`).

## 2. أين وصلنا
- **المحاكي:** فحوص X-ray المنفَّذة والمدموجة مسجلة في الكود (`EXAMS` في `src/data/exams`) وفي CLAUDE.md؛ الاتجاه الحالي للمالك المنصة التجريبية، لا فحوص جديدة ولا رفع صور.
- **المنصة التجريبية (Supabase Frankfurt + Cloudflare Pages الساكن):** كود الحسابات والموافقة والمحاولات والملاحظات ولوحة المالك وCSV مدموج (RAD-041…044، DECISIONS S-PILOT-4…12). **لم يُجرَّب شيء منها على المشروع الحي** (تطبيق migrations الخمسة بيد المالك، دليل `PILOT_SUPABASE_SETUP.md`).
- **بنود مفتوحة عند المالك:** فحص حي، مراجعة نص الشروط قبل دعوة أي مشارك، قرار بيانات الملاحظات الشخصية في CSV، قرارات RAD-017، حالة النشر RAD-024. التفاصيل ومن ينتظر من: `waiting_on` في project-status.md.

## 3. العمل التالي
1. **RAD-047a** تدقيق قابلية التوسع (توثيق فقط): الأمر الجاهز في [prompts/rad-047a-scalability-audit.md](prompts/rad-047a-scalability-audit.md). يتبعه 047b تنفيذ بحسب نتيجته.
2. **RAD-046** صفحة «نسيت كلمة المرور» (كود صغير)، بعد أو بالتوازي حسب قرار المالك.
3. لا تبدأ فحصًا جديدًا بلا مرجع مدموج (S10-2) ولا Shoulder Y (مؤجل بقرار المالك).

## 4. تشغيل البيئة وQA (آخر ما تحقق)
- جلسة سحابية: `npm ci` ثم `npm i --no-save playwright`؛ المتصفح `CHROMIUM=/opt/pw-browsers/chromium` (لا تشغّل `playwright install`). بناء المعاينة للفحوص المحاكاة بمتغيرين وهميين: `NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…` ثم `npm run build:pages`.
- فحوص المنصة بـSupabase مُحاكى: `node scripts/qa/pilot-owner-audit.mjs` و`pilot-feedback-audit.mjs` (عربي وإنجليزي، 390 و1440، مع axe). `preview:smoke` يحتاج `CHROMIUM`.
- آخر QA كامل (PR #58): `npm run check` 82 ملفًا/1821 اختبارًا، build وbuild:pages وpreview:smoke (200/200) ناجحة. لم يُنفَّذ: أي فحص على المشروع الحي، فحص هاتف بشري، مراجعة مختص.
- `next dev` يضيف كتلة قواعد وكيل إلى CLAUDE.md: لا تُودِعها في commit.
- إنشاء PR في الجلسات السحابية: `gh pr create` يفشل (GraphQL محجوب)؛ استخدم `gh api repos/…/pulls --method POST --input ملف.json` مع `"draft": true`.

## 5. قواعد التسليم
- هدف واحد وميزانية ملفات لكل جلسة (S-STD-1)؛ QA وفق نوع الجلسة ولا تُعِد ما نجح بلا تغيير.
- في نهاية كل مرحلة حدّث هذا الملف والحالة (project-status.md، صيغة 1.1) والقرارات؛ لا تلصق تاريخًا هنا: التاريخ في سجل الجلسة أو الأرشيف.
- تقارير المالك بالعربية بترتيب S-STD-1 ذي الأقسام الثمانية، وتنتهي بأمر جاهز للمحادثة التالية.
