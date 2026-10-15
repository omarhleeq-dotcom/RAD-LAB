# RAD-041a — الحسابات: المخطط وسياسات الصفوف واختبارات العزل (2026-10-15)

**النوع:** CODE (خلفية وسياسات وبنية بناء؛ لا واجهة). **الأساس:** main بعد دمج PR #49 (RAD-040). **القرارات:** DECISIONS S-PILOT-1…5.
**التقسيم:** الخطة قدّرت RAD-041 بجلستين (L). نُفّذ **041a** هنا (كل ما يمكن إثباته بلا مشروع Supabase حيّ)، و**041b** (عميل Supabase والواجهة وتسجيل الأحداث وفحص المتصفح مع مشروع حيّ) جلسة لاحقة.

## البرومبت المحدّد (بحسب هيكل S-STD-1 §8a)

```text
SESSION: RAD-041a — مخطط الحسابات وRLS واختبارات العزل وبنية CSP (CODE، بلا واجهة)
Follow CLAUDE.md, docs/exam-recipe.md and S-STD-1. Start from updated main (RAD-040 PR #49 merged) else STOP AND REPORT. New branch, DRAFT PR only, no merge/auto-merge, never open or share the preview URL. No Supabase account/project, no keys, no secrets, no real participant data.
READ ONLY: docs/PILOT_PLATFORM_PLAN.md §5–§7, docs/PILOT_PROVIDER_COMPARISON_2026-10-15.md, DECISIONS S-PILOT-1…4 + O103, ADR-0002, public/_headers, scripts/preview/smoke.mjs, docs/DEPLOYMENT.md.
OWNER DECISIONS (recorded as S-PILOT-4): self-registration; every new account waits for the owner (pending); Supabase Free / Frankfurt; manual dumps from the owner's laptop; pause after 1 week accepted; sign-in log written to our own table.
SCOPE:
 1. SQL migration: profiles + events, RLS, default-deny (anon has nothing), owner-only approval function, trigger creating a `pending` profile for every new auth user.
 2. Isolation tests (PGlite, real Postgres RLS) for every row of Plan §7 that concerns data (visitor, pending, suspended, participant vs participant, privilege escalation, owner, oversized/invalid events, deletion cascade).
 3. CSP/build: the Supabase origin enters `connect-src` only at build time from NEXT_PUBLIC_SUPABASE_URL (validated); absent env = headers unchanged. preview:smoke allows exactly that origin and nothing else.
 4. Docs: amend ADR-0002, CLAUDE.md, DEPLOYMENT.md; owner setup guide (project, auth settings, SMTP, migration, owner account, repo variables, manual backup + restore test); DECISIONS S-PILOT-5; status, HANDOFF, ROADMAP.
ALLOWED SHARED CHANGES: package.json/lock (devDependency @electric-sql/pglite only), build:pages script, public/_headers (comment only), scripts/preview/smoke.mjs (the external-request filter only), .github/workflows/deploy-pages.yml (pass the one public variable NEXT_PUBLIC_SUPABASE_URL to the build step; the publishable key arrives with 041b).
CHANGE BUDGET: new supabase/migrations/*.sql; src/features/pilot-db/*.test.ts; scripts/pages/{headers,finalize-headers}.mjs + one test; two docs; edits to the files above and the listed docs. NOT: src/app, src/components, messages/*, @supabase/supabase-js, any UI, any exam/engine file.
OUT OF SCOPE: client library, sign-up/sign-in pages, event logging from the app, consent screen (RAD-043), attempts table (RAD-042), dashboard (RAD-044), live Supabase verification.
SESSION TYPE: CODE → targeted tests during work; at the end npm run check + npm run build + npm run build:pages + preview:smoke (if Chromium available). No Playwright matrix (no UI change).
Conflict with repo decisions, a test that needs an existing test/hash edit, or budget overflow → STOP AND REPORT.
Final report in the standard 8-section order, in Arabic.
```

## ما نُفّذ

| البند | الملف |
|---|---|
| المخطط والسياسات | `supabase/migrations/20261015000100_pilot_accounts.sql` (جدولا `profiles` و`events`، trigger ينشئ ملفًا `pending` لكل حساب جديد، `anon` بلا أي صلاحية، الموافقة بدالة للمالك فقط) |
| اختبارات العزل (20) | `src/features/pilot-db/rls.test.ts` على Postgres حقيقي (PGlite): زائر، pending، suspended، مشارك مقابل مشارك، تصعيد الصلاحيات، المالك، حدود الأحداث، الحذف المتتابع، نظافة الصلاحيات |
| اختبارات CSP (15) | `src/features/pilot-db/headers.test.ts` + `scripts/pages/headers.mjs` |
| CSP وقت البناء | `scripts/pages/finalize-headers.mjs` (جزء من `build:pages`)؛ المتغير غير موجود = `out/_headers` مطابق بايتًا لـ`public/_headers` |
| smoke | سطران في `scripts/preview/smoke.mjs`: يسمح بأصل Supabase المهيّأ وحده |
| الـworkflow | تمرير `NEXT_PUBLIC_SUPABASE_URL` (متغير عام) لخطوة البناء |
| التوثيق | `PILOT_SUPABASE_SETUP.md` (دليل المالك)، تعديل ADR-0002 وCLAUDE.md وDEPLOYMENT.md، DECISIONS (S-PILOT-5، O104، O105)، الخطة والحالة وHANDOFF وROADMAP |

## الفحوص

- `npm run check`: typecheck وlint و**1682 اختبارًا ناجحًا** (69 ملفًا، بينها 35 جديدة)، دون تعديل أي اختبار أو hash أو golden قائم.
- فحص الطفرات: إضعاف ثلاث سياسات عمدًا أفشل 9 اختبارات، وعادت 20 ناجحة بعد الاستعادة.
- `npm run build` و`npm run build:pages` ناجحان؛ ومعه متغير صالح تظهر `connect-src 'self' https://…supabase.co`؛ ومع متغير غير صالح (`https://evil.example`) يفشل البناء.
- `npm run preview:smoke`: **200/200** (Chromium محلي؛ Playwright ثُبّت `--no-save` ولم يدخل package.json).
- لم يُشغَّل: مصفوفة Playwright الكاملة وaxe (لا تغيير في الواجهة)، وأي فحص على مشروع Supabase حي (غير موجود بعد).

## حدود ما أُثبت

الاختبارات تثبت منطق السياسات على Postgres حقيقي لكن بمحاكاة أدوار Supabase و`auth.uid()`؛ التطبيق الحي يُفحص يدويًا بجدول دليل المالك §9. لم يُنشأ حساب ولا مفتاح ولا مشروع. عناصر مفتوحة: O104 (CSP hashes)، O105 (هل تشمل النسخة المنطقية `auth.users`؟ وغيرها).

## ملاحظات انحراف

لا تعديل على أي اختبار قائم. إضافة `@electric-sql/pglite` كاعتمادية تطوير (مسجّلة في S-PILOT-5) لأن اختبار RLS الصادق يحتاج Postgres حقيقيًا ولا بديل مجاني آخر في CI.
