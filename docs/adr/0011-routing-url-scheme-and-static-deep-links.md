# ADR-0011 — Public URL scheme and static deep-link strategy
**Status:** Accepted (owner decision "Option A", Session 9) · **Date:** 2026-10-06 · **Implements:** ADR-0003, ADR-0002 · **Decision S7-1 clarified below**

## Context
Session 9 builds the platform shell (D2): home/catalogue → modality → exam → Practice (D1: one mode). The site is a fully static export on Cloudflare Pages (ADR-0002): no server, no middleware, no SPA fallback. Existing shared links (`/{locale}/simulation/chest-pa-erect`) must keep working. ADR-0003 proposed `/[locale]/[modality]/[exam]/[mode]`; S7-1 mentioned `/{exam}/{mode}?case=…`.

## Decision
**Routes** (locale prefix always; `{locale}` ∈ `en | ar`):

| Route | Meaning |
|---|---|
| `/{locale}` | catalogue: modalities from `src/data/modalities.ts` (X-ray available; CT / MRI / Ultrasound "coming soon", name only) |
| `/{locale}/{modality}` | exams of that modality (exams from `EXAMS` whose `modality` matches the entry's `examModality`) |
| `/{locale}/{modality}/{exam}` | exam hub: its modes (today only Practice) and cases |
| `/{locale}/{modality}/{exam}/practice[?case=…]` | Practice (today's Chest PA experience) |

Clarification of S7-1: `/{exam}/{mode}?case=…` in S7-1 is shorthand for the *tail* of this path. Exam ids stay unique per modality; the default case of an exam keeps the exam id as its public id (S7-1 unchanged).

**Registry-driven.** Pages contain no per-exam code: they read `MODALITIES` / `MODES` (`src/data/modalities.ts`), `EXAMS`, `CASE_DEFINITIONS` through `features/platform/resolve.ts`. A new exam is registry data; a new modality is one `MODALITIES` entry. Planned modalities have **no routes** (404) and show no descriptive or medical text.

**Cases.** The default case has no `?case=` and is what the static HTML is built for. Any other case is `?case=<case id>`, resolved on the client from the registry (`PracticeEntry`, `useSearchParams` inside `Suspense`); an unknown value shows an in-page, translated not-found state (a static host cannot return a 404 for a query string). The language switch preserves the query.

**Old URLs → new** (no alias URLs: the old path only redirects, it is never a second canonical URL):
- `/` → `/en` (unchanged, `_redirects`);
- `/{en,ar}` is now the catalogue (was the case list);
- `/{en,ar}/simulation/chest-pa-erect` → `/{en,ar}/xray/chest-pa-erect/practice`:
  1. `public/_redirects`, one explicit rule per locale and case, **no catch-all** (static host);
  2. `redirects()` in `next.config.ts` for `next dev` / `next start` (not allowed with `output: "export"`, so only in non-export builds);
  3. the old page itself is kept as a client-side redirect stub (`LegacyRedirect`) so the link still works if the host rules are not applied.
  All three read `src/data/legacy-routes.ts`; `features/platform/platform.test.ts` fails if `_redirects` drifts from it. Redirects are 302 during the pilot (switch to 301 once the scheme is final).

**Static deep links.** `generateStaticParams` over locale × catalogue emits one real HTML file per route (`out/en/xray.html`, `out/en/xray/chest-pa-erect.html`, `…/practice.html`, plus the legacy stub), which Cloudflare serves as clean URLs; refresh and deep links need no server and no SPA fallback (a catch-all would hide real 404s). Unmatched URLs get `404.html` from `src/app/global-not-found.tsx` (Next `experimental.globalNotFound`): it is **bilingual** (host cannot know the locale), keeps the EN + AR preview banner and noindex. In server-rendered builds, `notFound()` inside a locale renders the localized `[locale]/not-found.tsx`.

**Shell a11y.** One `<main id="main-content" tabindex="-1">` in the locale layout, skip link, banner / nav (breadcrumb, language) / main / footer landmarks, one `h1` per page, `lang`/`dir` on `<html>`; `RouteFocus` moves focus to `main` after client-side route changes (not on first load, not on query-only changes).

## Alternatives considered
- **`/{locale}/{exam}/{mode}` (no modality)** — shorter, but exam ids would have to be unique across modalities and the URL would not show the hierarchy. Rejected (Option B).
- **Both shapes with an alias (Option C)** — more redirects and two canonical candidates. Rejected by the owner.
- **Catch-all redirect `/…/simulation/:id`** — would also redirect unknown ids; explicit per-case rules keep real 404s.
- **SPA fallback (`/* /index.html 200`)** — hides 404s; nothing is client-routed.

## Consequences
+ Shared links keep working; adding an exam / modality is data. + Same file layout works locally and on Pages.
− Non-default `?case=` URLs are not individually pre-rendered (acceptable: client resolution; only one case exists today).
− `_redirects` / `legacy-routes.ts` are two lists (kept in sync by a test). − The in-page "unknown case" state is HTTP 200.
− When a second modality or non-default case ships, re-check `generateStaticParams`, the `_redirects` rules and the smoke test.
