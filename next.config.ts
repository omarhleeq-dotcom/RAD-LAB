import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Pilot preview hosting (Cloudflare Pages) serves static files only, so `npm run build:pages` (or any build where
 * Cloudflare sets CF_PAGES=1) exports every route to `out/`. All routes are pre-rendered (`generateStaticParams`),
 * so no server, no SPA fallback and no runtime requests are needed. A plain `npm run build` is unchanged.
 * The routing middleware (`src/proxy.ts`) is ignored by a static export; `/` → `/en` is done by `public/_redirects`.
 * See docs/DEPLOYMENT.md.
 */
const staticExport = process.env.RADLAB_STATIC_EXPORT === "1" || process.env.CF_PAGES === "1";

const nextConfig: NextConfig = staticExport ? { output: "export" } : {};

export default withNextIntl(nextConfig);
