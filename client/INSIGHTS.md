# client — insights
Append-only · written by skill `engineering-insights` · a DRAFT under human review (monthly prune, git history).
Entry: `### YYYY-MM-DD · title` → do X instead of Y — why · evidence: path + symbol. Max 2 sentences.

## What Works
<!-- approaches and solutions that proved effective -->

## What Doesn't Work
<!-- dead ends and antipatterns — the most valuable section -->

### 2026-11-24 · Runtime imports from @devdigest/shared break the Next build
Import only types from `@devdigest/shared` in the client (`import type`) — a value import such as `Severity.options` makes webpack fail with "Module not found: Can't resolve './contracts/findings.js'" while vitest and `tsc` stay green, because only they map the `.js` re-exports to `.ts`. Derive runtime lists locally and pin them to the contract type with `satisfies Record<Severity, true>`. Evidence: `src/vendor/shared/index.ts:17`, `src/app/repos/[repoId]/pulls/[number]/_components/FindingsPanel/constants.ts:7` (`FILTER_SEVERITIES`).

## Codebase Patterns
<!-- non-default conventions, architecture decisions + their reason -->

### 2026-11-23 · Cost display goes through formatCost / RunCostBadge
Render any USD amount via `formatCost` (or `<RunCostBadge>`), which maps null/undefined to "—" and never to "$0.00" — a missing cost means "no data" (failed, unpriced or pre-M1 run), not a free run. Format matches the design: ≤4 decimals, trailing zeros trimmed (`$0.0006`, `$0.012`, `$0.06`). Evidence: `src/lib/format-cost.ts:12` (`formatCost`), `src/components/run-cost-badge/RunCostBadge.tsx`.

### 2026-11-23 · @devdigest/shared is two hand-synced copies
Edit `client/src/vendor/shared` AND `server/src/vendor/shared` identically when changing a contract — nothing syncs them and they already drift. Evidence: `diff -rq server/src/vendor/shared client/src/vendor/shared`.

### 2026-11-24 · Popovers over the PR list go through a portal, and clicks still bubble
Render hover popovers in the PR list via `createPortal` to `document.body` with `position: fixed` — the table card clips with `overflow: hidden`. React events from portal content still bubble to the row's `onClick` (navigate to PR), so stop propagation in the cell. Evidence: `src/components/findings-summary/FindingsSummary.tsx:93` (`createPortal`), `src/app/repos/[repoId]/pulls/_components/PrFindingsCell/PrFindingsCell.tsx:25`, `src/app/repos/[repoId]/pulls/styles.ts:90` (`tableCard`).

## Tool & Library Notes
<!-- dependency quirks -->

## Recurring Errors & Fixes
<!-- error → cause → fix -->

### 2026-11-24 · "Updating a style property during rerender (borderColor) when a conflicting property is set (borderLeftColor)"
`borderColor` / `borderWidth` are shorthands too: style a card with per-side longhands (`borderTopColor`…`borderLeftColor`) when one side differs and the colour changes on rerender (focus). Evidence: `src/app/repos/[repoId]/pulls/[number]/_components/FindingCard/styles.ts:10` (`s.card`).

## Session Notes
<!-- ### YYYY-MM-DD — 2–3 sentence summary -->

### 2026-11-23 — M1 Run Cost Badge
Added run cost to the PR list (COST column between Status and Updated), the run timeline (`N tok · $X` under the time) and the trace drawer Stats (COST tile). Tests were then rewritten per the `react-testing-library` skill: text/title queries instead of `getByTestId` and DOM-structure assertions.

### 2026-11-24 — M1 Severity filter
Added per-severity counters + click filter to each run's findings list (counts follow "Hide low confidence"; AND with it), then — beyond the acceptance criteria, as shown in the assignment video — icon counts with a findings popover in the run timeline and a Findings column in the PR list. Client-only: the list reuses `GET /pulls/:id/reviews` per reviewed PR instead of changing `PrMeta`; the browser check caught a build break and a style warning that green tests missed.

## Open Questions
<!-- unresolved items, conflicting entries to review -->
