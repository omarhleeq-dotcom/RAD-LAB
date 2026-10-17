# RAD-041b — صفحات الحساب وتسجيل النشاط (2026-10-15)

**النوع:** CODE (واجهة). **الأساس:** main بعد PR #50 (041a). **القرارات:** DECISIONS S-PILOT-4…7.

## البرومبت (مختصر، S-STD-1)
```text
SESSION: RAD-041b — عميل Supabase وصفحة الحساب وتسجيل النشاط (CODE)
Follow CLAUDE.md and S-STD-1. Start from main with PR #50 merged. New branch, DRAFT PR, no merge, never open or share the preview URL. No secret key anywhere; only the publishable key may reach the site.
SCOPE: lazy supabase-js client; /{locale}/account (sign in, create account, check-email, pending / approved / suspended, sign out); account.* messages EN + AR; header link + site-wide heartbeat only when accounts are enabled; signed_in / logout / heartbeat events; build guard against a secret key; tests + mocked-Supabase browser QA (EN/AR × 390/1440) + axe.
CHANGE BUDGET: src/features/pilot/*, src/app/[locale]/account/page.tsx, src/app/[locale]/layout.tsx (link + keeper only), messages/{en,ar}.json (account namespace only), scripts/pages/{headers,finalize-headers}.mjs + .d.mts, deploy-pages.yml (one variable), package.json/lock (@supabase/supabase-js), docs. NOT: exams, engine, attempts (RAD-042), consent / notes (RAD-043), dashboard (RAD-044).
OUT OF SCOPE: live-project verification (owner).
```

## ما نُفِّذ
| البند | الملف |
|---|---|
| مفتاح التشغيل والتحقق | `src/features/pilot/config.ts` + `scripts/pages/headers.mjs` (`assertPublishableKey`، يرفض `sb_secret_…` ويُفشل البناء) |
| العميل (كسول) | `client.ts` |
| قواعد صرفة | `account-state.ts` (خرائط الأخطاء، قاعدة كلمة المرور، قراءة الملف، النبضة) |
| النشاط | `activity.ts`، `PilotSessionKeeper.tsx` (نبضة كل 5 دقائق عند وجود جلسة محفوظة) |
| الصفحة | `useAccount.ts`، `AccountPanel.tsx`، `src/app/[locale]/account/page.tsx` |
| الترويسة | رابط «الحساب» وحارس الجلسة فقط عند تفعيل الحسابات؛ بدونهما لا يتغير الناتج |
| النصوص | `messages/{en,ar}.json` → `account` (EN/AR، 56 مفتاحًا) |
| الـworkflow | تمرير `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (متغير عام) |

## الفحوص
- `npm run check`: typecheck وlint و**1715 اختبارًا** ناجحة (31 جديدًا: الإعداد وحارس المفتاح وقواعد الحساب والنبضة).
- `build` و`build:pages` (بمتغيرين صالحين: `connect-src` يتضمن الأصل؛ بدونهما: الترويسات مطابقة بايتًا ولا رابط حساب)، `preview:smoke` **200/200**.
- متصفح (Playwright + **Supabase مُحاكى**، لا مشروع حي): عربي/إنجليزي × 390/1440 × pending/approved/suspended: زائر بلا جلسة = **صفر طلبات**؛ دخول خاطئ = رسالة عامة؛ كلمة مرور ضعيفة/غير متطابقة تُوقف الطلب عند العميل؛ `redirect_to` = `/{locale}/account`؛ approved = حدث `signed_in` واحد وعند الخروج `logout`؛ pending/suspended = لا أحداث بل `touch_last_seen`؛ بلا أخطاء CSP.
- axe (WCAG 2.1 A/AA): صفر مخالفات في الدخول والتسجيل ورسالة الخطأ، عربي/إنجليزي، هاتف/حاسوب؛ ترتيب Tab سليم.

## حدود ما أُثبت
لم يُجرَّب أي تدفق على مشروع Supabase الحي (لا أملك مفتاحه ولا حسابًا). قائمة فحوص المالك على الهاتف أدناه. أسئلة مفتوحة: O104 (CSP)، O105.

## فحص المالك (بعد دمج الـPR وضبط متغيري GitHub ونشر المعاينة)
1. افتح `/ar/account` من الهاتف: يظهر رابط «الحساب»، وصفحة تسجيل الدخول سليمة الاتجاه.
2. أنشئ حسابًا بكلمة مرور ضعيفة: يُرفض محليًا. ثم بكلمة صالحة: «تحقق من بريدك». افتح الرابط من بريدك.
3. سجّل الدخول: يظهر «حسابك بانتظار الموافقة» ورمز المشارك.
4. وافق عليه من SQL (`update public.profiles set status='approved' where participant_code='P-…'`) ثم سجّل الدخول مجددًا: «تمت الموافقة».
5. في Supabase ← Table Editor ← `events`: صف `signed_in`، وبعد الخروج صف `logout`.
6. أخطاء للتأكد: دخول بكلمة خاطئة يعطي رسالة عامة ولا يكشف وجود البريد.
