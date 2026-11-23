# server (@devdigest/api) — Fastify · :3001

## Before answering
Search `server/docs/`, `server/specs/`, `server/INSIGHTS.md` first.

## Commands
- `pnpm dev` · `pnpm db:migrate` · `pnpm db:seed` (migrations are NOT applied on boot)
- unit (hermetic): `pnpm exec vitest run --exclude '**/*.it.test.ts'`
- integration (Postgres via testcontainers): `pnpm exec vitest run .it.test`

## Conventions (non-default)
- Feature = Fastify plugin in `src/modules/<name>/routes.ts`, registered statically in
  `src/modules/index.ts` (no filesystem autoload). New feature = new module + 1 line there.
- Route schemas are Zod from `@devdigest/shared` (fastify-type-provider-zod) — no manual `.parse(req.body)`.
- External world only via adapters behind DI (`src/platform/container.ts`); tests mock
  through `src/adapters/mocks.ts`.
- A test importing `test/helpers/pg.ts` MUST be named `*.it.test.ts`.
- Schema change: edit `src/db/schema/` → `pnpm db:generate` → own migration. Never edit old ones.
- Secrets only through `SecretsProvider` (`src/adapters/secrets/local.ts`), never from config.

## Use when
- Route/API map, request & DI flow, env vars → read `server/README.md`
- Indexer / repo map → read `server/src/modules/repo-intel/README.md`
- Indexer pitfalls → read `server/src/modules/repo-intel/INSIGHTS.md`
- Deep architecture → `server/docs/` · feature acceptance → `server/specs/` · pitfalls → `server/INSIGHTS.md`
- Routes, plugins, hooks, error handling → invoke skill `fastify-best-practices`
- Queries, relations, transactions, migrations → invoke skill `drizzle-orm-patterns`
- New table, index, constraint → invoke skill `postgresql-table-design`
