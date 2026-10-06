/**
 * Old public URLs that must keep working (Session 9, ADR-0011). Dependency-free on purpose: `next.config.ts`
 * imports it (no `@/` aliases there). Each entry maps `/{locale}/simulation/{caseId}` → the new Practice URL.
 * `features/platform/platform.test.ts` checks every entry resolves through the registries and is present in
 * `public/_redirects` for every locale.
 */
export const LEGACY_LOCALES = ["en", "ar"] as const;

export interface LegacyCaseRoute {
  /** The id used in the old `/simulation/{caseId}` URL (the case's public id). */
  caseId: string;
  modality: string;
  exam: string;
  /** Only for non-default cases (`?case=`); the old URLs never had one. */
  caseParam?: string;
}

export const LEGACY_CASE_ROUTES: readonly LegacyCaseRoute[] = [{ caseId: "chest-pa-erect", modality: "xray", exam: "chest-pa-erect" }];

export const legacyTarget = (r: LegacyCaseRoute, locale: string) =>
  `/${locale}/${r.modality}/${r.exam}/practice${r.caseParam ? `?case=${r.caseParam}` : ""}`;
