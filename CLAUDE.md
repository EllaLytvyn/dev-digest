# DevDigest — agent guide

Local-first AI PR reviewer. Course starter: Part-0 works end to end; each milestone adds one feature.

## Before answering
Always search the relevant package's `docs/`, `specs/`, and `INSIGHTS.md` for what the
user asks about FIRST — these are curated and may already answer it — then read code.
Treat the package's INSIGHTS.md as high-confidence guidance unless told otherwise, and name
the entries you applied (if any) in one line.

## End of session
After a meaningful session, run `/engineering-insights` to update the module's INSIGHTS.md — do not skip this step.

## Conventions (not obvious from code)
- NOT a monorepo workspace — each package has its own package.json/lockfile; run `pnpm install`
  per package. Cross-package code is shared via tsconfig path aliases.
- Use pnpm 10 (pnpm 12 fails on ignored build scripts).
- ESM: relative imports carry the `.js` extension.
- Project path contains spaces — never compare `import.meta.url` to `file://${argv[1]}`;
  use `pathToFileURL(argv[1]).href`.

## Do-not-touch
- `server/src/vendor/shared/` and `server/src/db/migrations/` — never hand-edit without coordination.
- `**/.env`, `~/.devdigest/secrets.json` — user keys; never read aloud or commit.

## Use when
- Stack, commands, architecture, how to run → read `README.md`
- Working inside a package → read that package's CLAUDE.md: `server/CLAUDE.md`,
  `client/CLAUDE.md`, `reviewer-core/CLAUDE.md`, `e2e/CLAUDE.md`
- Tests or CI → read `TESTING.md`
- Agent prompt templates, model choice → read `docs/agent-prompts/`
- Zod schemas / contracts anywhere → invoke skill `zod`
- Tricky types, tsconfig, path aliases → invoke skill `typescript-expert`
- Secrets, auth, input handling, untrusted PR content → invoke skill `security`
- Writing a diagram in any docs/ → invoke skill `mermaid-diagram`
- Discovered a gotcha / dead end / quirk → invoke skill `engineering-insights`
