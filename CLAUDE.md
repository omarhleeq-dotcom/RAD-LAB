# CLAUDE.md — RAD-LAB development guide

RAD-LAB is a bilingual (AR/EN) educational radiography simulator. Source of truth: `docs/RAD-LAB_Project_Specification.md` — **read it before large changes**. Work in small, focused sessions; do not build unrelated features (no auth, DB, CT/MRI, 3D, physics until the spec says so).

## Rules
1. **Do not invent medical facts.** Unvalidated clinical values must be marked provisional (`provisional: true`, TODO comments) and never shown as authoritative. Never fabricate diagnostic radiographs; result visuals are labelled placeholders until validated imagery exists.
2. **Cases are data.** Exams live in `src/data/cases/*` as `RadCase` objects; no per-case pages or hard-coded case logic in components.
3. **Keep modules separate.** `domain/` (types) ← `features/evaluation|scoring` (pure logic, no React) ← `stores/` ← UI. Simulation logic must not live in React components.
4. **Bilingual always.** UI strings go in `messages/en.json` + `messages/ar.json` (keep keys in sync); case text uses `LocalizedText` with both locales. Use logical CSS (`ms-`, `ps-`, `border-s-`), keep numbers/units `dir="ltr"`, test both directions.
5. **Scoring weights are configuration** (`RadCase.scoring`), must sum to 100 (tested).
6. Prefer reusable components; avoid unnecessary dependencies and global state.
7. Practice mode exists; keep the design Assessment-ready (no help/answers leaked in assessment) and instructor-ready.
8. Document significant architectural decisions in README or `docs/`.

## Before finishing a task
`npm run check` (typecheck + lint + tests) and `npm run build` must pass; exercise the flow in a browser in both `/en` and `/ar`.

## Notes
- Next 16: routing middleware is `src/proxy.ts`; `LayoutProps`/`PageProps` types come from `next typegen` (part of `npm run typecheck`).
- Image variants: `ImageVariantId` is produced by the engine from failed/partial checks; `ResultImage` is the single place to swap in validated imagery.
- Collimation is scored under `positioning` (spec table has no separate category).
- Technique (Session 3): protocol values live in `RadCase.technique` (a `TechniqueProfile`), never in components. Keep selectable range (`controls`), protocol target, scoring tolerance and evidence class separate; every new medical rule needs one of the five evidence classes (`EVIDENCE_CLASSES`). Digital brightness is never an exposure indicator; do not invent a numeric EI/EIT or a universal DI limit. Renderers consume `EvaluationResult.resultState`; they never score from pixels. Numeric console sliders are `dir="ltr"` even in RTL.
