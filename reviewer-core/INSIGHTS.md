# reviewer-core — insights
Append-only · written by skill `engineering-insights` · a DRAFT under human review (monthly prune, git history).
Entry: `### YYYY-MM-DD · title` → do X instead of Y — why · evidence: path + symbol. Max 2 sentences.

## What Works
<!-- approaches and solutions that proved effective -->

## What Doesn't Work
<!-- dead ends and antipatterns — the most valuable section -->

### 2026-11-24 · Grounding accepts any range touching one diff line
Don't rely on the grounding gate to reject imprecise locations: a finding passes if its `[start_line, end_line]` intersects a single hunk line, so a range like 1–5000 almost always survives (and is iterated line by line). Tighten in `groundFindings` with a test if precision matters. Evidence: `src/grounding.ts:41` (`rangeIntersects`).

## Codebase Patterns
<!-- non-default conventions, architecture decisions + their reason -->

### 2026-11-24 · @devdigest/shared resolves to the server's copy
After changing a contract, run `npm run typecheck` here too: the tsconfig path alias points `@devdigest/shared` at `../server/src/vendor/shared` (not the client copy) and pins `zod` to this package's own `node_modules`. Evidence: `reviewer-core/tsconfig.json` (`compilerOptions.paths`).

## Tool & Library Notes
<!-- dependency quirks -->

## Recurring Errors & Fixes
<!-- error → cause → fix -->

## Session Notes
<!-- ### YYYY-MM-DD — 2–3 sentence summary -->

## Open Questions
<!-- unresolved items, conflicting entries to review -->
