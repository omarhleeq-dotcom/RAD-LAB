# ADR-0002 — Static-first pilot hosting on Cloudflare Pages (private repo)
**Status:** Accepted. **Amended by owner decision D6 (Session 7) and Session 6b (PR #7):** the site is deployed by **GitHub Actions** (`.github/workflows/deploy-pages.yml`, direct upload of `out/` with Wrangler) to the Cloudflare Pages project **`rad-lab`** — Cloudflare is *not* connected to the repo; main → production, pull requests → preview with the URL posted on the PR. The repo stays private; the site must not be shared before the Zero Trust email restriction is enabled; tokens and secrets are never pasted. · **Date:** 2026-10-06

## Context
The repo is private and must stay private. The pilot needs a shareable URL (phone), per-branch previews, no cost, no secrets, no analytics, no runtime third-party requests. The app has no backend and every route can be pre-rendered.

## Decision
Build a **static export** (`npm run build:pages` → `out/`, switched on by `RADLAB_STATIC_EXPORT=1` or Cloudflare's `CF_PAGES=1`) and host it on **Cloudflare Pages connected to the private repo**, production = `main`, previews per branch. Controls in the artefact: `public/_headers` (noindex + security headers + CSP), `public/robots.txt`, `<meta robots>`, `public/_redirects` (`/ → /en`), a visible bilingual preview banner. Restrict viewers with Cloudflare Zero Trust Access (email allow-list) before educator review. Details: `docs/DEPLOYMENT.md`.

## Alternatives considered
- **GitHub Pages** — publishes a publicly reachable site (private-repo Pages needs a paid plan and the site is still public on most plans — **to verify**); the owner ruled it out.
- **Vercel / Netlify** — both fine technically; Cloudflare chosen by the owner (free, per-branch previews, Zero Trust Access on the same account, R2 for large assets later). Next.js on Vercel would also allow server features, which the pilot does not need.
- **Next.js server on a container/VM** — unnecessary cost and an attack surface for a no-data prototype; revisit with Assess (ADR-0009).
- **Cloudflare Workers + OpenNext adapter** — enables SSR/middleware on Cloudflare; adds a dependency and build complexity for no pilot benefit.
- **Self-hosting from a laptop / tunnel** — not reliable for reviewers.

## Consequences
+ Zero runtime infrastructure, reproducible local verification (`npm run preview:smoke`), same artefact for every branch.
− `src/proxy.ts` (i18n middleware) does not run on a static host; locale routing relies on `localePrefix: "always"` + the `/` redirect. Server features (auth, storage) will need a second deployment target.
− CSP needs `'unsafe-inline'` for scripts (Next's inline bootstrap, no per-request nonce).
− Preview URLs are public unless Access is enabled (documented as a must-do before sharing).
