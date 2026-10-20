# RAD-LAB — pilot preview deployment (Cloudflare Pages)

**Deployment prerequisites:** the workflow needs the Cloudflare repo secrets and, for an enabled pilot, the verified schema attestation in §A. Live deployment evidence belongs in [project-status](project-status.md). The repo stays **private**; do not use GitHub Pages or change its visibility.

> Cloudflare changes its dashboard often. Wording marked **(may differ)** could not be verified from this environment (no Cloudflare account, no network access to the dashboard) and is written from the documented flow as I know it. If a label differs, pick the closest one; the *values* (build command, output directory, Node version, branch) are what matter.

## 0. What the repo already contains

| Item | Where | Notes |
|---|---|---|
| Build command | `npm run build:pages` | = `RADLAB_STATIC_EXPORT=1 next build`; exports every route to static files |
| Output directory | `out` | |
| Node version | `22` | `.node-version`; same as CI |
| Static-export switch | `next.config.ts` | exports when `RADLAB_STATIC_EXPORT=1` **or** `CF_PAGES=1` (Cloudflare sets `CF_PAGES=1` itself), so even a plain `npm run build` produces `out/` on Cloudflare. A normal local `npm run build` / `npm start` is unchanged |
| Root + old-URL redirects | `public/_redirects` | `/ → /en` (302) and one explicit rule per locale for the old `/{locale}/simulation/chest-pa-erect` → `/{locale}/xray/chest-pa-erect/practice` (302; no catch-all; kept in sync with `src/data/legacy-routes.ts` by a unit test, ADR-0011). The Next routing middleware (`src/proxy.ts`) is *not* part of a static export |
| SPA fallback | **none, deliberately** | The app has no client-only routes: `/en`, `/ar`, `/{en,ar}/xray`, `/{en,ar}/xray/chest-pa-erect`, `/{en,ar}/xray/chest-pa-erect/practice` (and the old-URL stub `/{en,ar}/simulation/chest-pa-erect`) are real pre-rendered files, so deep links and refresh work; a non-default `?case=` is resolved on the client (ADR-0011). A catch-all `/* /index.html 200` would hide real 404s and there is no `index.html` to serve. Unknown paths return `404.html` (bilingual EN + AR, banner and noindex kept; `src/app/global-not-found.tsx`) |
| Headers | `public/_headers` | `X-Robots-Tag: noindex, nofollow, noarchive`, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (camera, mic, geolocation… off), COOP, a CSP, immutable caching for hashed assets |
| Crawlers | `public/robots.txt` (`Disallow: /`) and `<meta name="robots" content="noindex, nofollow">` on every page | |
| Visible preview banner | every page, EN + AR (`common.previewBanner`) | "Educational prototype — not for clinical use; values pending educator/physicist review" |
| Runtime requests | none external (one optional exception) | no analytics, no tracking, no fonts/CDN (system font stack), no secrets. Verified by `npm run preview:smoke` (every request same-origin, no console/CSP errors). **RAD-041a:** if the repo variable `NEXT_PUBLIC_SUPABASE_URL` is set, `npm run build:pages` adds that one `https://<ref>.supabase.co` origin to `connect-src` in `out/_headers` and `preview:smoke` allows only that origin (setup: `docs/PILOT_SUPABASE_SETUP.md`). **RAD-043b:** the optional public variable `NEXT_PUBLIC_SURVEY_URL` (https) only adds a link to the account page (new tab, `?code=<participant code>`); it is a navigation, not a request, so the CSP and the smoke test are unchanged |

**CSP note.** `script-src` has to include `'unsafe-inline'` because a static Next export embeds its bootstrap as inline scripts and a static host cannot add per-request nonces; `style-src` needs it for inline styles. Everything else is `'self'` only. This was acceptable for a no-login, no-data prototype. **The pilot now has accounts (RAD-041a/b), so tightening with script hashes is an open item (O104)** before any wider release.

## A. Primary route: GitHub Actions direct upload

**Pilot database gate:** an enabled-account deployment must pass `scripts/pages/pilot-schema-gate.mjs` before build/upload. The owner must first verify the target database and service path, then set the project/required-frontend-SQL-bound `PILOT_SCHEMA_VERIFIED` repo variable. Missing or stale attestation stops upload and replaces the PR preview comment with a blocked notice. This is an offline attestation check, not an automated live-database check; no migration is applied by the workflow. See the [single verification procedure](PILOT_SUPABASE_SETUP.md#training-deployment-check). The reviewed [frontend contract](../scripts/pages/frontend-schema.json) selects the SQL/checks required by this static UI; dormant backends have a separate pinned classification and are not deployed. Existing preview URLs retain their previously deployed code. Manual uploads and the legacy Git integration bypass this workflow and must follow the same verification procedure.

Why: the Cloudflare Git-integration flow (§1) could not be completed from the owner's phone browser. `.github/workflows/deploy-pages.yml` builds the static export in GitHub Actions and uploads `out/` to Cloudflare Pages with Wrangler. The repo stays private; Cloudflare never gets access to the repo. The workflow:

- runs on every push to `main` (production deploy, branch `main`) and every pull request (preview deploy, branch = PR branch name);
- creates the Pages project `rad-lab` if missing (idempotent), then runs `pages deploy out --project-name=rad-lab`;
- posts or updates **one** comment on the PR with the preview URL after successful upload, or a blocked notice when schema attestation fails;
- is **skipped with a notice** (not failed) when the secrets are absent, and for fork PRs (GitHub withholds secrets from forks);
- does not run tests or Playwright (`ci.yml` does).

### Owner steps (phone browser)

Cloudflare/GitHub labels below **may differ**. If deployment secrets already exist, continue at step4; the schema check does not require recreating the Cloudflare project or credentials.

1. **Find the Account ID.** Log in at <https://dash.cloudflare.com>. Open **Workers & Pages** (☰ menu); the **Account ID** is shown on that overview page (right side, or at the bottom on a phone), with a copy button. Alternatively, on the account home page open the ⋮ menu next to the account name and choose **Copy account ID**. **(may differ)** Do not paste it into issues or chats.
2. **Create the scoped API token.** Tap the profile icon → **My Profile → API Tokens → Create Token → Create Custom Token → Get started**. **(may differ)**
   - Token name: `rad-lab-pages-deploy`.
   - Permissions: one row only: **Account** → **Cloudflare Pages** → **Edit**.
   - Account Resources: **Include → your account**. No zone permissions, no other scopes.
   - Optional: set an expiry date.
   - **Continue to summary → Create Token.** Copy the token now; Cloudflare shows it only once.
3. **Add the two repo secrets.** On GitHub open `omarhleeq-dotcom/RAD-LAB` → **Settings → Secrets and variables → Actions → New repository secret** (on a phone, "Desktop site" mode may help to reach Settings). **(may differ)** Add:

   | Name (exact) | Value |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | the token from step 2 |
   | `CLOUDFLARE_ACCOUNT_ID` | the Account ID from step 1 |

4. **Verify pilot compatibility, then trigger the authorised deployment.** For an enabled pilot, complete the [schema and service verification](PILOT_SUPABASE_SETUP.md#training-deployment-check) and record its attestation first. Then open the workflow run for the intended change under **Actions → Deploy Pages** and tap **Re-run all jobs** (there is no manual trigger). Production changes remain subject to owner authorisation.
5. **Find the deployed URL.**
   - Production (push to `main`): `https://rad-lab.pages.dev`. If the name `rad-lab` was already taken on Cloudflare, the project gets a different `*.pages.dev` host; the real URL is printed in the deploy step log and shown at **Workers & Pages → rad-lab**. **(may differ)**
   - Pull request previews: the PR gets one comment (updated on every push) with a branch URL like `https://<branch-name>.rad-lab.pages.dev` (branch name lower-cased, non-alphanumerics replaced by `-`, possibly truncated) and a per-commit URL like `https://<8-char-hash>.rad-lab.pages.dev`. All deployments are also listed at **Workers & Pages → rad-lab → Deployments**. **(may differ)**
6. **Restrict access before sharing the link:** follow the Zero Trust Access steps in §3 (email one-time-PIN allow-list). The Pages shortcut in §3 step 5 may differ because the project was created by Wrangler, so the manual Access application (§3 step 3) is the reliable path. Cover both `rad-lab.pages.dev` and `*.rad-lab.pages.dev`.

Troubleshooting: *"Authentication error [code: 10000]"* in the log means the token lacks **Account → Cloudflare Pages → Edit** or targets another account. The notice "Deploy skipped" means a secret is missing or misspelled. Rotate the token any time at **My Profile → API Tokens**, then update the secret. The workflow never echoes secrets (they are only passed via `env` / action inputs).

## 1. Alternative: Cloudflare Git integration (failed from a phone browser)

Kept for reference; it could not be completed on mobile, so §A is the primary route. Do not enable both for the same project name, or every push deploys twice.

1. Open <https://dash.cloudflare.com/sign-up> and create a free Cloudflare account (email + password); confirm the email.
2. Log in at <https://dash.cloudflare.com>. In the left menu (on a phone: the ☰ menu) open **Workers & Pages**. **(may differ — recently labelled "Compute (Workers)" / "Workers & Pages")**
3. Tap **Create** (or **Create application**). Choose the **Pages** tab and **Connect to Git**. **(may differ — newer dashboards fold Pages into a single "Create" flow; choose the option that connects a Git repository and has "Pages"/static site output.)**
4. Tap **Connect GitHub**. GitHub opens: sign in and, when asked which repositories to give "Cloudflare Pages" access to, choose **Only select repositories → `omarhleeq-dotcom/RAD-LAB`** (not "All repositories"). Tap **Install & Authorize**.
   - This is a *separate* GitHub App from the Claude app; it needs read access to the private repo to build it. It does not make the repo public.
5. Back in Cloudflare select the **RAD-LAB** repository and tap **Begin setup**.
6. Fill in:

   | Field | Value |
   |---|---|
   | Project name | `rad-lab` (it becomes `rad-lab.pages.dev`; any name is fine, but it appears in every URL) |
   | Production branch | `main` |
   | Framework preset | **Next.js (Static HTML Export)**. If you pick "None", the values below are still correct |
   | Build command | `npm run build:pages` |
   | Build output directory | `out` |
   | Root directory (advanced) | leave empty |
   | Environment variables (advanced) | optional: `NODE_VERSION` = `22` (the repo's `.node-version` normally covers this) |

   If the preset fills in `npx next build`, that also works (Cloudflare sets `CF_PAGES=1`, which switches the static export on); replacing it with `npm run build:pages` is the clearer choice.
7. Tap **Save and Deploy**. The first build takes a few minutes. When it ends you get a link like `https://rad-lab.pages.dev`.
8. Open it. You should land on `/en` with the yellow banner at the top. Add `/ar` for Arabic, and check `/robots.txt` shows `Disallow: /`.

## 2. Preview URLs for other branches

Cloudflare builds every non-production branch you push and gives it its own URL.

1. In Cloudflare: **Workers & Pages → rad-lab → Deployments** (tabs/sections: **Production** and **Preview**). **(may differ)**
2. Under **Preview** (branch deployments) tap the row for the branch, then **Visit** (or the link in the row).
3. The URL pattern is `https://<branch-name>.rad-lab.pages.dev` (branch name lower-cased, `/` and other characters turned into `-`, long names truncated) and every commit also has `https://<commit-hash>.rad-lab.pages.dev` **(may differ in detail)**. For this session's branch that is `https://ccr-dc71dbdd-luas1s.rad-lab.pages.dev` once Cloudflare has built it.
4. If previews don't appear: **rad-lab → Settings → Builds → Branch control**, set **Preview branches** to *All non-Production branches*. **(may differ)**
5. Cloudflare can also post the preview link as a comment/check on the GitHub pull request (the check shows "Cloudflare Pages"). On a phone the GitHub PR page is often the quickest way to the link: open the PR → the **Cloudflare Pages** check → **Details**.

Production deploys (`main`) run after merges to `main` only when deployment guards pass. Nothing deploys from a draft PR to production.

## 3. IMPORTANT before sharing the link: restrict who can open it (Cloudflare Zero Trust Access, free tier)

The repo is private but **the deployed site is public to anyone who has the URL** (it is `noindex`, so search engines should not list it, but that is not access control). The prototype contains provisional medical values and a clearly marked banner, yet you may not want strangers — or unreviewed educator feedback — hitting it. (Educator / physicist review is recommended before commercial release or teaching students but is not a gate for owner use, S10b-20.) **Recommended before sending any link to an educator/physicist:** allow only named email addresses.

Free plan: Zero Trust is free for up to 50 users. **(may differ — plan limits change; check the pricing page.)** Sign-in uses a one-time PIN sent to the allowed email, so reviewers need no Cloudflare account.

1. Open <https://one.dash.cloudflare.com> (Zero Trust). The first time, it asks to choose a team name (any, e.g. `rad-lab-team`) and the **Free** plan; a payment method may be requested even for the free plan **(may differ)**.
2. **Settings → Authentication → Login methods**: confirm **One-time PIN** is enabled (it is by default). **(may differ)**
3. **Access → Applications → Add an application → Self-hosted**. **(may differ — newer menus: "Access controls → Applications")**
   - Application name: `RAD-LAB preview`.
   - Application domain: `*.rad-lab.pages.dev` (covers every branch/commit preview) and add a second public hostname for `rad-lab.pages.dev` (the production site). If the UI offers wildcard-plus-apex, one entry each.
   - Session duration: e.g. 24 hours.
4. **Add a policy**: name `Reviewers`, action **Allow**, rule **Emails** → list each reviewer's address (yours first). Save. Anyone else sees a Cloudflare sign-in wall.
5. Shortcut inside Pages: **Workers & Pages → rad-lab → Settings → General → Access policy → Enable / Manage** protects the *preview* deployments with one click and creates the Access application for you; check afterwards that the production hostname is covered too (step 3). **(may differ)**
6. Test it in a private/incognito tab: the URL should ask for an email; an address that is not on the list gets no PIN.

Notes: a request that must stay reachable by machines (e.g. a link-preview bot) will be blocked by Access — expected. Revoke access any time by deleting the email from the policy.

## 4. Local verification (what was done in Session 6)

```bash
npm ci
npm run build:pages          # → out/
npm i --no-save playwright   # not a project dependency
npm run preview:smoke        # serves out/ like Cloudflare Pages, then drives it in Chromium
```

`scripts/preview/serve-out.mjs` is a minimal stand-in for Cloudflare Pages (clean URLs, `_redirects`, `_headers`, `404.html`); real Cloudflare behaviour may differ in details. `preview:smoke` checks: `/` → `/en`; headers / robots / 404; banner and `noindex` meta on every page in EN and AR; EN↔AR switching; every request same-origin and no console/CSP errors at 390 px; then the real-UI scenario runner (one fully correct exam and three exams with critical findings, EN + AR, mobile, with the golden-image comparison).

**Results (2026-10-06, Session 6, static export served by the stand-in server):** typecheck, lint, 662/662 unit tests (golden phantom hash unchanged), `npm run build`, `npm run build:pages` pass; `preview:smoke` 200/200 scenario checks + header/banner/same-origin/console checks; full EN/AR × desktop/tablet/mobile browser matrix **3159/3159** (identical to Session 5, so the banner changed no golden image — none was regenerated); axe audit 0 violations.

**Re-run (2026-10-15, on main `28edfec`, 17 registered exams):** `npm run build:pages` then `CHROMIUM=/opt/pw-browsers/chromium npm run preview:smoke` (the script needs `CHROMIUM` when Playwright's own browser is not installed): 81 page / header / redirect / same-origin / console checks and the scenario runner 200/200 (4 scenarios, EN + AR, mobile) all passed. Scope note: the smoke script's route and scenario checks cover Chest PA only; the 16 later exams are not exercised by it. This does not prove the Cloudflare deployment itself (RAD-024).

## 5. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Build fails with "Node version" errors | Set the env var `NODE_VERSION` = `22` (Settings → Environment variables). |
| Build succeeds but the site is a blank/404 | Output directory must be exactly `out`; build command must be `npm run build:pages`. |
| `/` shows 404 | `public/_redirects` missing from `out/`; rebuild. `/en` works regardless. |
| Arabic page looks left-to-right | Not expected: `<html dir="rtl">` is set per locale; hard-refresh and check you opened `/ar`. |
| Preview URL not created for a branch | Branch control setting (§2 step 4); or the build for that branch failed — open the deployment log. |
| Repo access error | Re-run step 4 and ensure `RAD-LAB` is ticked under the Cloudflare GitHub App's repository access (GitHub → Settings → Applications → Cloudflare Pages → Configure). |

## 6. Alternative if Cloudflare Pages is unavailable for the account **(may differ)**

Cloudflare is steering new projects toward Workers *Static Assets*. The `out/` directory with `_headers` and `_redirects` is also valid input there (`wrangler deploy` with `assets.directory = "out"`); that would need a `wrangler.toml`, which is deliberately **not** added now (no account, nothing to verify against). Decide when you see which flow your dashboard offers.

## 7. Still not decided (owner)

- Project name / custom domain (none planned for the pilot).
- Whether previews of *every* branch should be built (cost: none; exposure: more URLs — mitigated by Access).
- Who the first reviewers are (email list for Access).


## عقد متطلبات الواجهة — فصل النشر عن الخدمات الخلفية

أذن المالك بهذا الإصلاح بعد توقف PR #91 عند Require verified pilot schema. السبب كان حساب البصمة من **كل** ملفات SQL، بما فيها C التي لا يستوردها المتصفح ولا يستدعيها. الإصلاح لا يطبق SQL ولا يفتح launch_gate أو ينشر عاملًا أو يبدأ D. يبقى PR مسودة؛ نشر Pages هو نشر الواجهة الساكنة وحدها.

[`frontend-schema.json`](../scripts/pages/frontend-schema.json) عقد مراجع بإصدار، وله أربعة أجزاء:

| الجزء | دوره |
|---|---|
| requiredMigrations + checks | ملفات SQL والفحوص التي تحتاجها الواجهة الحالية؛ البصمة تربط محتوياتها كاملةً بالمشروع. تغيير أي منها يطلب إثباتًا جديدًا بعد التحقق الحي المأذون |
| deferredMigrations | تصنيف صريح لترحيل خلفي غير مستخدم بالواجهة: SHA-256 مطابق وسبب ووحداته الخادمية. ملف SQL جديد غير مصنف أو تعديل غير مراجع في المؤجل يوقف النشر |
| serverModules | استيرادها في شبكة المتصفح يوقف النشر حتى لو أُعيد تثبيت بصمة ملف الاتصال؛ imports/reexports/dynamic imports المحلية تُفحص، وtype-only لا يشحن كودًا |
| browserBoundaries | SHA-256 لمصادر حدود الاتصال المكتشفة؛ حد جديد أو تغيير فيها يطلب مراجعة العقد، لا تعديل إثبات قاعدة البيانات آليًا |

الحارس يبدأ من كل وحدات use client ويتتبع اعتمادياتها المحلية وقت التشغيل باستعمال TypeScript المقفل في المشروع. يستكشف حدود SDK وgetPilotClient/RPC/table/schema/fetch، ويفحص أسماء RPC والجداول الحرفية مع schema المعلنة مقابل SQL المطلوب؛ كما يرفض أسماء دوال الخلفية المؤجلة داخل adapters ذات RPC ديناميكي. **هذا فحص محافظ للعقود وليس برهانًا على JavaScript أو SQL عشوائيين**: computed calls أو مكتبة نقل/SQL vocabulary جديدة تحتاج مراجعة المراجع وتوسيع التحقق قبل اعتمادها. تغيير pins ليس أمرًا آليًا لتمرير النشر؛ راجع فرق الكود واحتياجات SQL. قد تتطلب تعديلات JSX في ملف اتصال مختلط مراجعة pin، لكن لا تحتاج بصمة قاعدة جديدة إذا لم تتغير متطلبات SQL. لا قوائم مستخدمين أو قراءة قاعدة أو وعود سعة؛ تكلفة الفحص مرتبطة بمصادر المستودع، لا بعدد الطلاب.

الواجهة الحالية تحتاج السلسلة حتى Assess B فقط. يعيد الحارس **نفس البصمة المثبتة سابقًا** لهذه الملفات والمشروع؛ لا fallback أو قيمة true أو تغيير Actions Variable. C مثبتة كخلفية مؤجلة ببصمة ملفها، وحماياتها القديمة واختبارات العزل باقية. عند ربط runner بخدمات C: تُراجع طبقة الاتصال، وتُنقل C إلى requiredMigrations، وتُحدّث مصادر الحدود والعقد؛ حينها تتغير البصمة ويُمنع النشر حتى تجهيز بيئة اختبار والتحقق من المخطط/خدمة الحسابات وفق الإجراء قبل أي إذن إنتاج مستقل. لا إنشاء لمشروع Supabase تجريبي أو binding أو مجدول ضمن هذا الإصلاح.

التحقق المحلي لهذه الدفعة: الاختبارات القائمة للحارس محفوظة دون تعديل، واختبارات جديدة في [`frontend-schema.test.ts`](../src/features/deployment/frontend-schema.test.ts) تثبت مطابقة B، اختلاف المشروع/SQL والفحوص، الترحيل المجهول/المعدل، مؤجل جديد مراجع، تغييرات العرض، حدود الاتصال، استيراد C بثلاث صيغ، RPC/table غير جاهزة حتى بعد إعادة pin، وترقية C التي تطلب إثباتًا جديدًا. مصدر الحالة ونتائج الفحوص النهائية في [project-status](project-status.md) والتسليم؛ لا يُعد الاختبار المحلي فحص مزود حي أو مراجعة طبية. لم تُعدّل توقعات أو hashes تدريب، ولم يتغير ruling لقرارات المنتج أو روابط أدلتها؛ تغير تنظيم حارس النشر التقني بإذن المالك فقط.


فحوص دفعة الفصل بتاريخ2026-10-20: `npm run check` ناجح (114ملفًا/2098اختبارًا مع typecheck وlint)، ثم22حالة مستهدفة للحارس بعد توسيع فحص schema وتقسيم حالات API مستقلة؛ `npm run docs:test` ناجح (23حالة)، وفحوص الوثائق والحالة وdiff ناجحة بلا review warnings، مع إبقاء تعارض RAD-024 الموروث. الفحص الشامل الأول التقط fixture في مجلد pilot بواسطة حارس عزل C؛ نُقل الاختبار الجديد إلى deployment ولم تُغير توقعات الحارس. لا تغيير للتطبيق يستدعي إعادة البناء/تدقيق المتصفح لهذه الدفعة؛ أدلة البناء والمتصفح السابقة تخص C وتبقى بحدودها. نجحت محاكاة الحارس للمشروع المعني بمفتاح عام اصطناعي وإثبات B المعروف، دون اتصال قاعدة أو تغيير Repository Variable. نتيجة GitHub بعد الرفع تُتحقق مستقلة؛ نجاح محلي لا يثبت نشرًا بعيدًا.
