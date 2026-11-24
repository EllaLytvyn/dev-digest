# engineering-insights — good vs bad entries

Bar: the next agent reads the entry cold and KNOWS what to do, without re-investigating.

| ❌ Reject | Why | ✅ Record |
|---|---|---|
| "Promises can be tricky" | generic truism | "Use `Promise.allSettled()` in batches of 10 on the ingest pipeline — `Promise.all()` times out after 30 items." |
| "careful with async" | says nothing actionable | "Keep checkout state in Zustand (`cartStore.ts`) — 3 components share the cart; local state desyncs." |
| "Be careful with imports" | unclear what to watch | "Avoid relative imports in `/utils` — the build step resolves them incorrectly." |
| "Fixed a bug on line 47 of parser.py" | bare line number, history not lesson | "Use `2>&1` with bats-core `run` — it captures the exit code but swallows stderr." |
| "Today we fixed the DB" | chat replay | "Use `pathToFileURL(argv[1]).href` for entrypoint checks — the project path has spaces (`%20` in `import.meta.url`), so `file://${argv[1]}` never matches and migrate/seed silently no-op. Evidence: `server/src/db/migrate.ts` (CLI entrypoint)." |
| "Prisma is slow sometimes" | vague | "Use `select`, not `include`, with Prisma Accelerate — responses are capped at 5MB." |
| "network failed once during install" | one-off transient | — (don't record) |

One-liners in the same spirit (from real projects):
- "`vercel link` overwrites `.env.local` — restore it from git afterwards."
- "Webhook returns 404 but the body holds valid data — don't check `response.ok`."
- "Use pnpm 10 — pnpm 12 fails install with `ERR_PNPM_IGNORED_BUILDS`."

## Entry templates

```markdown
### 2026-11-23 · <short title>
<Do X instead of Y> — <why>. Evidence: `<path>` (`<symbol>`) / `<command>` / "<error text>".
```

Changed lesson (append-only — the old entry stays):

```markdown
### 2026-12-10 · <new title>
Supersedes: <old title>. <new rule> — <what changed>. Evidence: …
```

Unconfirmed hunch → `## Open Questions`:

```markdown
- 2026-11-23 · Does repo-intel go only through `container.repoIntel.*`? Check `server/src/platform/container.ts`.
```

## Wrap-up: candidates → dedup → one-line summary (automatic, no approval prompt)

```
Candidates (ranked):
1. [What Doesn't Work → server] ### 2026-11-23 · Booting with foreign containers on 3000/3001 …
2. [Tool & Library Notes → server] ### 2026-11-23 · pnpm 12 fails on ignored builds …   ← already in file → drop

Summary: wrote 1 entry + Session Notes to server/INSIGHTS.md; skipped 1 (duplicate: pnpm 12).
```
