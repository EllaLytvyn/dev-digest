# e2e (@devdigest/e2e) — deterministic browser flows

## Before answering
Search `e2e/docs/`, `e2e/specs/`, `e2e/INSIGHTS.md` first.

## Conventions (not obvious from code)
- Flows are JSON in `e2e/specs/NN-name.flow.json`, run by `run.ts` (agent-browser).
- Seeded data only, no LLM in the loop — flows must be deterministic.

## Use when
- How to run, flow format → read `e2e/README.md`
- Test strategy across suites → read `TESTING.md`
- Pitfalls → read `e2e/INSIGHTS.md`
