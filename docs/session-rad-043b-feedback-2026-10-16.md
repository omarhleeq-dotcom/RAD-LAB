# RAD-043b — زر الملاحظات ورابط الاستبيان (جلسة 2026-10-16)

الفرع `feat/rad-043b-feedback` من main بعد دمج PR #56. القرارات: [DECISIONS S-PILOT-11](DECISIONS.md). دليل المالك: [PILOT_SUPABASE_SETUP.md](PILOT_SUPABASE_SETUP.md) §4هـ.

## ما نُفِّذ
- `supabase/migrations/20261019000100_feedback.sql`: جدول `feedback` (نص 1–1000 حرف)، RLS: إدراج لحساب معتمد وموافِق على محاولته هو فقط، قراءة الذات والمالك، بلا تعديل أو حذف.
- `src/features/pilot/FeedbackBox.tsx` + `saved-attempt.ts` + `feedback.ts`: صندوق الملاحظة تحت لوحة النتيجة، يظهر فقط حين حُفظت المحاولة فعلًا (المسجِّل يبلّغ بعد نجاح الإدراج)، تحذير «لا بيانات شخصية»، عدّاد، `dir="auto"`. المحرك والمخزن والتقييم دون تغيير.
- `survey.ts` + بطاقة في `AccountPanel`: رابط من `NEXT_PUBLIC_SURVEY_URL` (https فقط) يضاف إليه `code=<رمز المشارك>`؛ غائب = مخفي. الحدثان `feedback_sent` (معرّفات فقط) و`survey_opened`.
- صفحة الشروط: سطران (الملاحظات، رمز المشارك للاستبيان) ورفع `CONSENT_VERSION` إلى 2026-10-17.

## QA
نُفِّذ: `npm run check` (81 ملفًا/1783 اختبارًا، منها 9 PGlite للجدول)، `npm run build`، `npm run build:pages` (مع متغيرات Supabase وهمية)، `npm run preview:smoke` (200/200)، `scripts/qa/pilot-feedback-audit.mjs` (Supabase مُحاكى، EN/AR على 390px مع axe: 42 فحصًا). تأكد أن بناء بلا `NEXT_PUBLIC_SURVEY_URL` لا يحوي الرابط. **لم يُنفَّذ:** أي اختبار على مشروع Supabase الحي (يتطلب تطبيق migration خامس)، فحص هاتف حقيقي، سطح المكتب 1440 لهذا الصندوق.
