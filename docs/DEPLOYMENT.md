# RAD-LAB — pilot preview deployment (Cloudflare Pages)

**Status:** the repository is *prepared*; nothing is deployed. The owner only has to connect it (≈ 10 minutes, doable from a phone browser). The repo stays **private**; do not use GitHub Pages and do not change the repo's visibility or settings.

> Cloudflare changes its dashboard often. Wording marked **(may differ)** could not be verified from this environment (no Cloudflare account, no network access to the dashboard) and is written from the documented flow as I know it. If a label differs, pick the closest one; the *values* (build command, output directory, Node version, branch) are what matter.

## 0. What the repo already contains

| Item | Where | Notes |
|---|---|---|
| Build command | `npm run build:pages` | = `RADLAB_STATIC_EXPORT=1 next build`; exports every route to static files |
| Output directory | `out` | |
| Node version | `22` | `.node-version`; same as CI |
| Static-export switch | `next.config.ts` | exports when `RADLAB_STATIC_EXPORT=1` **or** `CF_PAGES=1` (Cloudflare sets `CF_PAGES=1` itself), so even a plain `npm run build` produces `out/` on Cloudflare. A normal local `npm run build` / `npm start` is unchanged |
| Root redirect | `public/_redirects` | `/ → /en` (302). The Next routing middleware (`src/proxy.ts`) is *not* part of a static export |
| SPA fallback | **none, deliberately** | The app has no client-only routes: `/en`, `/ar`, `/en/simulation/chest-pa-erect`, `/ar/simulation/chest-pa-erect` are real pre-rendered files. A catch-all `/* /index.html 200` would hide real 404s and there is no `index.html` to serve. Unknown paths return `404.html` |
| Headers | `public/_headers` | `X-Robots-Tag: noindex, nofollow, noarchive`, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy` (camera, mic, geolocation… off), COOP, a CSP, immutable caching for hashed assets |
| Crawlers | `public/robots.txt` (`Disallow: /`) and `<meta name="robots" content="noindex, nofollow">` on every page | |
| Visible preview banner | every page, EN + AR (`common.previewBanner`) | "Educational prototype — not for clinical use; values pending educator/physicist review" |
| Runtime requests | none external | no analytics, no tracking, no fonts/CDN (system font stack), no secrets, no env vars needed. Verified by `npm run preview:smoke` (every request same-origin, no console/CSP errors) |

**CSP note.** `script-src` has to include `'unsafe-inline'` because a static Next export embeds its bootstrap as inline scripts and a static host cannot add per-request nonces; `style-src` needs it for inline styles. Everything else is `'self'` only. This is acceptable for a no-login, no-data prototype; tighten with hashes if the app ever handles accounts.

## 1. Connect the repo (phone browser steps)

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

Production deploys (`main`) happen automatically on every merge to `main`. Nothing deploys from a draft PR to production.

## 3. IMPORTANT before sharing the link: restrict who can open it (Cloudflare Zero Trust Access, free tier)

The repo is private but **the deployed site is public to anyone who has the URL** (it is `noindex`, so search engines should not list it, but that is not access control). The prototype contains provisional medical values and a clearly marked banner, yet you may not want strangers — or unreviewed educator feedback — hitting it. **Recommended before sending any link to an educator/physicist:** allow only named email addresses.

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
