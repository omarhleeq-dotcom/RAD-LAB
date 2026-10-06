import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { LEGACY_CASE_ROUTES, LEGACY_LOCALES, legacyTarget } from "./src/data/legacy-routes";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Pilot preview hosting (Cloudflare Pages) serves static files only, so `npm run build:pages` (or any build where
 * Cloudflare sets CF_PAGES=1) exports every route to `out/`. All routes are pre-rendered (`generateStaticParams`),
 * so no server, no SPA fallback and no runtime requests are needed. A plain `npm run build` is unchanged.
 * The routing middleware (`src/proxy.ts`) is ignored by a static export; `/` → `/en` and the old-URL redirects are
 * done by `public/_redirects` there. `redirects()` below is the same old-URL map for `next dev` / `next start`
 * (Next does not allow `redirects()` with `output: "export"`). See docs/DEPLOYMENT.md and docs/adr/0011.
 */
const staticExport = process.env.RADLAB_STATIC_EXPORT === "1" || process.env.CF_PAGES === "1";

const nextConfig: NextConfig = staticExport
  ? { output: "export", experimental: { globalNotFound: true } }
  : {
      experimental: { globalNotFound: true },
      async redirects() {
        return LEGACY_LOCALES.flatMap((locale) =>
          LEGACY_CASE_ROUTES.map((r) => ({ source: `/${locale}/simulation/${r.caseId}`, destination: legacyTarget(r, locale), permanent: false })),
        );
      },
    };

export default withNextIntl(nextConfig);
