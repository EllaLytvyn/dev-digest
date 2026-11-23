# M1 · Run Cost Badge — server

> Пара до UI-специфікації: [`client/specs/M1-cost-badge.md`](../../client/specs/M1-cost-badge.md).
> Мета: віддавати клієнту вартість (USD) і токени кожного прогону агента та сумарну вартість PR.
> **Нуль додаткових викликів моделі** — дані вже приходять у відповіді LLM.

## 1. Поточний стан (звідки беремо дані)

| Шар | Що є | Що губиться |
|---|---|---|
| `reviewer-core/src/llm/openrouter.ts` | `costUsd` = реальна ціна з `usage.cost` (OpenRouter, `usage: { include: true }`), інакше — `estimateCost` (PriceBook), інакше `null` | — |
| `reviewer-core/src/review/run.ts` | `outcome.costUsd` — сума всіх викликів прогону; `null`, якщо хоч один виклик без ціни | — |
| `server/src/modules/reviews/run-executor.ts:213` | бере з `outcome` тільки `tokensIn, tokensOut, grounding` | **`costUsd` відкидається** |
| `agent_runs` (`db/schema/runs.ts`) | `tokens_in`, `tokens_out` | **колонки `cost_usd` немає** |
| `RunSummary`, `RunStats`, `PrMeta` (`vendor/shared/contracts`) | токени є (крім `PrMeta`) | **поля cost немає** |

Отже фіча на сервері — це «довести `outcome.costUsd` до БД і до трьох відповідей API». Нового обчислення ціни не потрібно.

## 2. Рішення (узгоджено 2026-11-23)

1. **Джерело правди** — `agent_runs.cost_usd`, записується один раз при завершенні прогону. Значення беремо з `outcome.costUsd` як є (реальна ціна OpenRouter має пріоритет над оцінкою з PriceBook — так уже працює `OpenRouterProvider`).
2. **Немає даних → `null`, ніколи не `0`.** `null` пишемо для: failed / cancelled прогонів, прогонів, де модель невідома прайсу, і для всіх старих рядків. `0` допустимий тільки як реальна ціна (наприклад, `:free`-модель).
3. **Без бекфілу.** Старі прогони лишаються з `cost_usd = NULL` → UI показує «—». Оцінку «токени × прайс» заднім числом не робимо: це була б вигадана, а не реальна ціна.
4. **Вартість PR у списку = сума `cost_usd` усіх прогонів PR зі `status = 'done'` і `cost_usd IS NOT NULL`.** Якщо таких немає → `null`.
   - Наслідок: якщо в PR є і старі прогони (без ціни), і нові, сума покриває тільки нові. Це прийнятно: показуємо лише реальні дані.
5. **Правки в `vendor/shared` дозволені** для цієї фічі (узгоджено з власницею). Правимо **обидві копії** однаково: `server/src/vendor/shared` і `client/src/vendor/shared`.
6. **Поза скоупом:** рядок вартості у VerdictBanner, вартість у CI-прогонах (`source = 'ci'`), агрегати по агентах і моделях (це L08 / productionize).

## 3. Зміни контрактів (`@devdigest/shared`, обидві копії)

`contracts/trace.ts`
```ts
export const RunStats = z.object({
  duration_ms: z.number().int(),
  tokens_in: z.number().int(),
  tokens_out: z.number().int(),
  /** USD for the whole run; null = unknown (failed / unpriced model / pre-M1 trace). */
  cost_usd: z.number().nullish(),          // nullish: old jsonb traces have no key
  findings: z.number().int(),
  grounding: z.string(),
});

export const RunSummary = z.object({
  // …existing fields…
  tokens_in: z.number().int().nullable(),
  tokens_out: z.number().int().nullable(),
  /** USD for this run; null = no data → UI shows "—". */
  cost_usd: z.number().nullable(),
  // …
});
```

`contracts/platform.ts`
```ts
export const PrMeta = z.object({
  // …existing fields…
  score: z.number().int().nullish(),
  /** Sum of cost_usd over this PR's settled runs (list endpoint only); null = no priced runs. */
  cost_usd: z.number().nullish(),
});
```

`nullish`, а не `nullable`, там, де старі дані можуть не мати ключа (`run_traces.trace` у jsonb) або де ендпоінт його не віддає (`PrMeta` у `GET /pulls/:id`).

## 4. Схема БД і міграція

`server/src/db/schema/runs.ts` → в `agentRuns` після `tokensOut`:
```ts
/** Run cost in USD (OpenRouter usage.cost, else PriceBook estimate); null = unknown. */
costUsd: numeric('cost_usd', { precision: 14, scale: 10, mode: 'number' }),
```
Тип `NUMERIC(14,10)`, не float — правило скіла `postgresql-table-design` («Money: NUMERIC, never float»). Перша версія з `double precision` давала суму `0.0006305600000000001` замість `0.00063056`. `mode: 'number'` лишає TS-тип `number` (без нього postgres-js повертає рядок), тож контракти не змінюються. Nullable, без default (старі рядки → `NULL`).
Примітка: `cost_usd` у `ci.ts` / `eval.ts` досі `double precision` — розбіжність, на L08 (агрегати) варто вирівняти.

Міграції: `0010_*.sql` (`ADD COLUMN cost_usd double precision`) + `0011_*.sql` (`ALTER COLUMN cost_usd SET DATA TYPE numeric(14,10)`). Старі міграції не чіпаємо.

## 5. API

| Ендпоінт | Зміна |
|---|---|
| `GET /pulls/:id/runs` (`RunSummary[]`, `run.repo.ts → listRunsForPull`) | + `cost_usd: run.costUsd` |
| `GET /runs/:id/trace` (`RunTrace`) | `stats.cost_usd` записується в trace-документ при завершенні прогону |
| `GET /repos/:id/pulls` (`PrMeta[]`, `pulls/routes.ts`) | + `cost_usd` — сума по PR (див. п. 2.4) |

Запит для списку PR — **один** `GROUP BY` поруч з наявним запитом `latestReviewByPr` (без N+1):
```ts
const costRows = await container.db
  .select({
    prId: t.agentRuns.prId,
    cost: sql<number | null>`sum(${t.agentRuns.costUsd})`.mapWith(Number),
  })
  .from(t.agentRuns)
  .where(and(
    eq(t.agentRuns.workspaceId, workspaceId),
    inArray(t.agentRuns.prId, prIds),
    eq(t.agentRuns.status, 'done'),
    isNotNull(t.agentRuns.costUsd),
  ))
  .groupBy(t.agentRuns.prId);
```
PR без рядків у `costRows` → `cost_usd: null`.

## 6. Acceptance criteria (server)

- [ ] **AC-S1** Після успішного прогону `agent_runs.cost_usd` = `outcome.costUsd` (з mock LLM — `0.001` на виклик, див. `src/adapters/mocks.ts`).
- [ ] **AC-S2** `run_traces.trace.stats.cost_usd` дорівнює тому самому значенню.
- [ ] **AC-S3** Failed / cancelled / pre-work-failed прогін → `cost_usd = NULL` (не `0`) і в рядку, і в trace.
- [ ] **AC-S4** `outcome.costUsd === null` (модель без ціни) → `NULL`, прогін при цьому `done`.
- [ ] **AC-S5** `GET /pulls/:id/runs` повертає `cost_usd` для кожного прогону; старі рядки → `null`.
- [ ] **AC-S6** `GET /repos/:id/pulls` повертає `cost_usd` = сума done-прогонів з ціною; PR без таких → `null`. Failed-прогони в суму не входять.
- [ ] **AC-S7** Сума рахується в межах workspace (фільтр `workspace_id`).
- [ ] **AC-S8** Старий `run_traces` без `stats.cost_usd` проходить Zod-парсинг.
- [ ] **AC-S9** Жодного додаткового виклику LLM (кількість викликів mock LLM не змінилась).
- [ ] **AC-S10** Звірка на одному реальному прогоні: `cost_usd` у БД = рядок `usage.cost` у лозі = OpenRouter dashboard (Activity → generation за `session_id`).

## 7. План реалізації (server)

| # | Крок | Файли | Перевірка |
|---|---|---|---|
| S1 | Контракти: `cost_usd` у `RunStats`, `RunSummary`, `PrMeta` — **в обох копіях** | `server/src/vendor/shared/contracts/{trace,platform}.ts`, `client/src/vendor/shared/contracts/{trace,platform}.ts` | `pnpm exec tsc --noEmit` у server і client (впаде там, де `RunSummary` будується без нового поля — це і є чеклист) |
| S2 | Колонка `costUsd` + міграція | `src/db/schema/runs.ts`, `pnpm db:generate`, `pnpm db:migrate` | `\d agent_runs` у psql |
| S3 | `completeAgentRun` приймає `costUsd: number \| null` (обов'язковий параметр — компілятор знайде всі виклики) | `src/modules/reviews/repository/run.repo.ts`, `repository.ts` | tsc |
| S4 | `run-executor.ts`: деструктуризувати `costUsd` з `outcome` → передати в `completeAgentRun` і в `trace.stats.cost_usd`; у `failAll`, catch-гілці та `traceFromBuffer` → `null` | `src/modules/reviews/run-executor.ts` (≈ рядки 78, 213, 244, 262, 298, 424) | AC-S1…S4 |
| S5 | `listRunsForPull` → `cost_usd: run.costUsd` | `repository/run.repo.ts` | AC-S5 |
| S6 | Агрегат вартості в `GET /repos/:id/pulls` | `src/modules/pulls/routes.ts` | AC-S6, AC-S7 |
| S7 | Тести | `test/reviews.it.test.ts` (S1–S5), новий кейс у `test/pulls-*.it.test.ts` (S6, S7), unit на парсинг старого trace (S8) | `pnpm exec vitest run` (unit + `.it.test`) |
| S8 | Ручна звірка з OpenRouter (AC-S10) | — | скріншот / нотатка в PR |

Залежності: S1 → S3 → S4. S2 незалежний від S1. S5 і S6 — після S2.

## 8. Ризики

- **Розсинхрон копій `vendor/shared`.** Вони вже трохи різняться коментарями в `trace.ts`. Правимо тільки потрібні поля, однаково в обох; у PR-описі окремо позначити, що vendor змінено за узгодженням.
- **`sum()` над `numeric`** повертає `numeric`, який драйвер віддає рядком — тому `.mapWith(Number)` обов'язковий.
- **Ретраї в `completeStructured`** уже входять у `costFromApi` (сумується по спробах) — ціна реальна, з урахуванням repair-спроб.
