# client — insights
Append-only · written by skill `engineering-insights` · a DRAFT under human review (monthly prune, git history).
Entry: `### YYYY-MM-DD · title` → do X instead of Y — why · evidence: path + symbol. Max 2 sentences.

## What Works
<!-- approaches and solutions that proved effective -->

## What Doesn't Work
<!-- dead ends and antipatterns — the most valuable section -->

## Codebase Patterns
<!-- non-default conventions, architecture decisions + their reason -->

### 2026-11-23 · Cost display goes through formatCost / RunCostBadge
Render any USD amount via `formatCost` (or `<RunCostBadge>`), which maps null/undefined to "—" and never to "$0.00" — a missing cost means "no data" (failed, unpriced or pre-M1 run), not a free run. Format matches the design: ≤4 decimals, trailing zeros trimmed (`$0.0006`, `$0.012`, `$0.06`). Evidence: `src/lib/format-cost.ts:12` (`formatCost`), `src/components/run-cost-badge/RunCostBadge.tsx`.

### 2026-11-23 · @devdigest/shared is two hand-synced copies
Edit `client/src/vendor/shared` AND `server/src/vendor/shared` identically when changing a contract — nothing syncs them and they already drift. Evidence: `diff -rq server/src/vendor/shared client/src/vendor/shared`.

## Tool & Library Notes
<!-- dependency quirks -->

## Recurring Errors & Fixes
<!-- error → cause → fix -->

## Session Notes
<!-- ### YYYY-MM-DD — 2–3 sentence summary -->

### 2026-11-23 — M1 Run Cost Badge
Added run cost to the PR list (COST column between Status and Updated), the run timeline (`N tok · $X` under the time) and the trace drawer Stats (COST tile). Tests were then rewritten per the `react-testing-library` skill: text/title queries instead of `getByTestId` and DOM-structure assertions.

## Open Questions
<!-- unresolved items, conflicting entries to review -->
