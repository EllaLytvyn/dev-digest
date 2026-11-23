# server — insights
Append-only · written by skill `engineering-insights` · a DRAFT under human review (monthly prune, git history).
Entry: `### YYYY-MM-DD · title` → do X instead of Y — why · evidence: path + symbol. Max 2 sentences.

## What Works
<!-- approaches and solutions that proved effective -->

## What Doesn't Work
<!-- dead ends and antipatterns — the most valuable section -->

### 2026-11-23 · Booting while other Docker containers hold 3000/3001
Docker Desktop auto-starts unrelated containers (here `open-webui` → :3000, `anythingllm` → :3001), so `next dev` dies with `EADDRINUSE :::3000` and `localhost:3001` may hit the wrong service. → Before `./scripts/dev.sh`, check `lsof -iTCP:3000,3001 -sTCP:LISTEN` and stop the foreign containers (ask the user first — they are other projects). Evidence: `docker ps` port column.

## Codebase Patterns
<!-- non-default conventions, architecture decisions + their reason -->

## Tool & Library Notes
<!-- dependency quirks -->

### 2026-11-23 · pnpm 12 fails install on ignored build scripts
pnpm 12 turns ignored build scripts (esbuild, ssh2, cpu-features, protobufjs) into a hard error `ERR_PNPM_IGNORED_BUILDS`; pnpm 10 only warns. → Use pnpm 10 (`npm i -g pnpm@10`). Evidence: `./scripts/dev.sh` output at "installing deps in server".

## Recurring Errors & Fixes
<!-- error → cause → fix -->

### 2026-11-23 · db:migrate / db:seed silently do nothing
Script prints nothing and the DB stays empty → API fails with `relation "users" does not exist`. Cause: entrypoint check `import.meta.url === \`file://${process.argv[1]}\`` — the project path contains spaces, which are `%20` in `import.meta.url` but literal in `argv[1]`. → Use `process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href`. Evidence: `src/db/migrate.ts:37`, `src/db/seed.ts:228`.

## Session Notes
<!-- ### YYYY-MM-DD — 2–3 sentence summary -->

### 2026-11-23
Booted the app from zero (pnpm 10, Docker, freed ports 3000/3001) and fixed the silent migrate/seed no-op. Created the CLAUDE.md hierarchy (root + 4 packages) with per-package docs/, specs/, INSIGHTS.md and the `engineering-insights` skill.

## Open Questions
<!-- unresolved items, conflicting entries to review -->

- Unverified conventions from the course slides: do domain tables carry `workspace_id` with a base-repository guard? Is repo-intel accessed only via a `container.repoIntel.*` facade? Confirm in `src/platform/container.ts` before adding to `server/CLAUDE.md`.
