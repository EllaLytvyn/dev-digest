# client (@devdigest/web) — Next.js 15 · :3000

## Before answering
Search `client/docs/`, `client/specs/`, `client/INSIGHTS.md` first.

## Conventions (not obvious from code)
- Types/contracts come from `@devdigest/shared` (Zod) — never hand-duplicate them.
- All API access goes through `src/lib/api.ts` (`apiFetch` → normalized `ApiError`).
- Tests: vitest + RTL with mocked `fetch`; no API, DB, or browser.

## Use when
- Page/route map, commands → read `client/README.md`
- UI kit → read `client/src/vendor/ui/README.md`
- Deep-dives → `client/docs/` · UI/flow specs → `client/specs/` · findings → `client/INSIGHTS.md`
- App Router, RSC boundaries, data fetching → invoke skill `next-best-practices`
- Components, hooks, state → invoke skill `react-best-practices`
- Component/hook tests → invoke skill `react-testing-library`
