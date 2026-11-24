# reviewer-core (@devdigest/reviewer-core) — pure review engine

## Iron rule
No I/O — no DB, fs, GitHub, or persistence. Only the injected `LLMProvider`.
The same code runs in the studio (server) and in CI. Keep it pure.

## Before answering
Search `reviewer-core/docs/`, `reviewer-core/specs/`, `reviewer-core/INSIGHTS.md` first.

## Conventions (not obvious from code)
- The grounding gate (`src/grounding.ts`) is mandatory; score is computed from findings that
  SURVIVED grounding, not the model's self-report.
- `INJECTION_GUARD` in `src/prompt.ts` is the only prompt-injection defense — don't add keyword scanning.
- skills/memory/specs arrive as RESOLVED strings (slug→body is the caller's job).

## Use when
- Pipeline overview → read `reviewer-core/README.md`
- Deep-dives → `reviewer-core/docs/` · specs → `reviewer-core/specs/` · findings → `reviewer-core/INSIGHTS.md`
- Finding/output schemas → invoke skill `zod`
