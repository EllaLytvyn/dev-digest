# server — insights
Append-only · written by skill `engineering-insights` · a DRAFT under human review (monthly prune, git history).
Entry: `### YYYY-MM-DD · title` → do X instead of Y — why · evidence: path + symbol. Max 2 sentences.

## What Works
<!-- approaches and solutions that proved effective -->

## What Doesn't Work
<!-- dead ends and antipatterns — the most valuable section -->

### 2026-11-23 · Booting while other Docker containers hold 3000/3001
Docker Desktop auto-starts unrelated containers (here `open-webui` → :3000, `anythingllm` → :3001), so `next dev` dies with `EADDRINUSE :::3000` and `localhost:3001` may hit the wrong service. → Before `./scripts/dev.sh`, check `lsof -iTCP:3000,3001 -sTCP:LISTEN` and stop the foreign containers (ask the user first — they are other projects). Evidence: `docker ps` port column.

### 2026-11-23 · Money columns as double precision
Store USD in `numeric(p,s, { mode: 'number' })`, not `doublePrecision` — float SUM of three run costs returned `0.0006305600000000001` instead of `0.00063056`. Note `sql\`sum(numeric)\`` still comes back as a string from postgres-js, so keep `.mapWith(Number)`. Evidence: `src/db/schema/runs.ts:25` (`agentRuns.costUsd`), `src/modules/pulls/routes.ts:141`, migration `0011_boring_skreet.sql`.

## Codebase Patterns
<!-- non-default conventions, architecture decisions + their reason -->

### 2026-11-23 · Run cost: NULL means unknown, never 0
Persist reviewer-core's `outcome.costUsd` (real OpenRouter `usage.cost`, else PriceBook) into `agent_runs.cost_usd` and write NULL for failed/cancelled/unpriced runs — the UI renders NULL as "—", so a 0 would show a fake "$0.00". Runs created before migration 0010 have NULL and cannot be recovered (the cost was never logged), so verify the feature with a NEW review run. Evidence: `src/modules/reviews/run-executor.ts:214` (`costUsd` from `outcome`).

### 2026-11-23 · @devdigest/shared is two hand-synced copies
Edit `server/src/vendor/shared` AND `client/src/vendor/shared` identically when changing a contract — nothing syncs them and they already drift (comments in `contracts/trace.ts`). Evidence: `diff -rq server/src/vendor/shared client/src/vendor/shared`.

### 2026-11-24 · PR-list sync from GitHub is duplicated in two routes
When changing which PR fields are imported, update BOTH `GET /repos/:id/pulls` (a "read" that upserts every GitHub PR on each call when a token is set) and `POST /repos/:id/poll` — they hold separate copies of the sync loop with direct Drizzle calls, not a shared service. Evidence: `src/modules/pulls/routes.ts:45` and `src/modules/polling/routes.ts:29` (`gh.listPullRequests`).

### 2026-11-24 · Review runs bypass JobRunner and run agents sequentially
Don't look for review runs in the `jobs` table or expect retry/concurrency limits: `runReview` creates `agent_runs` rows, returns run ids, then fires `void executor.executeRuns(...)`, which awaits agents one by one; crash recovery is only the boot-time stale-run reaper. Evidence: `src/modules/reviews/service.ts:133` (`runReview`), `src/modules/reviews/run-executor.ts:108` (`executeRuns`).

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

### 2026-11-23 — M1 Run Cost Badge
Persisted per-run cost (`agent_runs.cost_usd`, migrations 0010+0011) and exposed it on `GET /pulls/:id/runs`, the run trace and a per-PR sum on `GET /repos/:id/pulls`. Reviewed against the project skills afterwards: switched the column from double precision to numeric per `postgresql-table-design`.

### 2026-11-24 — onboarding & context review
Read-only walkthrough of the architecture (DI container, modules, RunBus/SSE, review executor, repo-intel context slots) and drafted the CLAUDE.md/docs/spec/INSIGHTS layout. No code changed; findings recorded as patterns and open questions below.

## Open Questions
<!-- unresolved items, conflicting entries to review -->

- Unverified conventions from the course slides: do domain tables carry `workspace_id` with a base-repository guard? Is repo-intel accessed only via a `container.repoIntel.*` facade? Confirm in `src/platform/container.ts` before adding to `server/CLAUDE.md`.
- `ci_runs.cost_usd` and eval `cost_usd` are still `double precision` while `agent_runs.cost_usd` is now `numeric(14,10)` — align them before L08 aggregates join run costs across these tables?
- 2026-11-24 · `RunBus.complete()` deletes only the emitter; `buffers`, `seq` and `completed` are never cleared, so every run's full event log stays in memory for the process lifetime. Is this a real leak on long-running dev servers — add a TTL eviction? Evidence: `src/platform/sse.ts` (`RunBus.complete`).
