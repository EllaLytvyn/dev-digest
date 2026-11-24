# M1 · Run Cost Badge — client

> Серверна частина й контракти: [`server/specs/M1-cost-badge.md`](../../server/specs/M1-cost-badge.md).
> Мета: показати вартість (і токени) прогонів у **трьох** місцях UI.
> Поза скоупом: рядок у VerdictBanner (рішення 2026-11-23).

## 1. Де відображається

| # | Екран | Компонент | Що показуємо | Звідки дані |
|---|---|---|---|---|
| 1 | Список PR (`/repos/[repoId]/pulls`) | `pulls/_components/PRRow/PRRow.tsx` + заголовок у `pulls/page.tsx` | нова колонка **COST**, компактно: `$0.012` | `PrMeta.cost_usd` (сума done-прогонів PR) |
| 2 | Таймлайн прогонів, вкладка «Agent runs» | `[number]/_components/RunHistory/RunHistory.tsx` | у правому стовпчику під часом: `9,119 tok · $0.0013` | `RunSummary.tokens_in + tokens_out`, `RunSummary.cost_usd` |
| 3 | Дровер «Agent run · … » → Stats | `RunTraceDrawer/_components/TraceBody/TraceBody.tsx` | 4-та плитка **COST** між TOKENS і FINDINGS: `$0.0006` | `RunTrace.stats.cost_usd` |

Макет (2) з дизайну:
```
[reviewed] (38) Security Reviewer openrouter/deepseek-v4-flash      8:52:51 PM   [⧉] [🗑]
                ⓘ2 ⚠1 · 2 blockers                         9,119 tok · $0.0013
```

## 2. Компонент `RunCostBadge` (2 види)

Один компонент — одна логіка форматування і одна поведінка для «немає даних».

```tsx
// client/src/components/run-cost-badge/RunCostBadge.tsx
type Props =
  | { variant: "compact"; costUsd: number | null | undefined }                       // PR list, trace Stat
  | { variant: "inline";  costUsd: number | null | undefined; tokens: number | null } // timeline: "9,119 tok · $0.0013"
```

- `compact` → тільки `$0.012` або `—`.
- `inline` → `<tokens> tok · <cost>`; якщо `tokens` теж `null` → `—`.
- Числа шрифтом `mono`, колір `var(--text-muted)`; для `—` — `title` / tooltip «No cost data for this run» (i18n).
- Плитка в Stats використовує наявний `Stat` з `atoms.tsx`: `val={formatCost(stats.cost_usd)}` (окремий бейдж там не потрібен; форматер спільний).

### Форматер `formatCost` — `client/src/lib/format-cost.ts`

| Вхід | Вихід | Правило |
|---|---|---|
| `null` / `undefined` / `NaN` | `—` | немає даних — **ніколи** не `$0.00` |
| `0` | `$0.00` | реальна нульова ціна (free-модель) |
| `0.0006` | `$0.0006` | < $1: `toFixed(4)`, хвостові нулі прибираємо, але лишаємо мінімум 2 знаки |
| `0.00134` | `$0.0013` | |
| `0.012` | `$0.012` | |
| `0.06` | `$0.06` | |
| `0.1234` | `$0.1234` | |
| `0.00004` | `<$0.0001` | ненульова ціна, що округлюється до 0 — **не** `$0.00` |
| `1.5` | `$1.50` | ≥ $1: 2 знаки |

Правило для `0 < v < 1`: `v.toFixed(4)` → прибрати хвостові нулі → доповнити до мінімум 2 знаків після коми; якщо результат `0.00` → `<$0.0001`.
Звірено з усіма прикладами з дизайну: `$0.0006` (дровер), `$0.0013` (таймлайн), `$0.06` (дровер), `$0.012` / `$0.014` (слайд). Вимогу слайда «$0.012, не $0.01» (не округлювати до центів) правило виконує.

Токени для `inline`: `(tokens_in ?? 0) + (tokens_out ?? 0)` → `toLocaleString("en-US")` → `9,119`.

## 3. Правила показу (stale / незавершені прогони)

| Стан прогону | Таймлайн (2) | Дровер (3) |
|---|---|---|
| `running` | нічого (бейдж не рендеримо) | Stats ще немає — без змін |
| `done`, `cost_usd` є | `9,119 tok · $0.0013` | `$0.0013` |
| `done`, `cost_usd = null` (стара або неціноутворена модель) | `9,119 tok · —` | `—` |
| `failed` / `cancelled` | нічого (там показується помилка) | `—` |

Список PR (1): `cost_usd = null` → `—` (як для `score` зараз). Колонку показуємо завжди.

## 4. Зміни по файлах

| Файл | Зміна |
|---|---|
| `client/src/vendor/shared/contracts/{trace,platform}.ts` | поля `cost_usd` (див. server spec §3) — **ідентично серверній копії** |
| `client/src/lib/format-cost.ts` (+ `.test.ts`) | `formatCost`, `formatTokenCount` |
| `client/src/components/run-cost-badge/*` (+ `.test.tsx`) | компонент, 2 варіанти |
| `pulls/constants.ts` | `GRID`: колонка `84px` між `status` і `updated` (як на дизайні) → `"1fr 132px 92px 60px 118px 84px 78px"`; `COLUMN_KEYS`: `"cost"` після `"status"` |
| `pulls/_components/PRRow/PRRow.tsx` | новий `<div>` з `<RunCostBadge variant="compact" costUsd={pr.cost_usd} />` після клітинки статусу |
| `RunHistory/RunHistory.tsx` | у правому стовпчику (де `ran_at`) другий рядок `<RunCostBadge variant="inline" …/>`, тільки якщо `settled` |
| `TraceBody/TraceBody.tsx` | `<Stat label={t("trace.stat.cost")} val={formatCost(stats.cost_usd)} />` між tokens і findings |
| `messages/en/prReview.json` | `list.columns.cost: "Cost"`, `list.noCost`, `timeline.noCost` (tooltip для «—»); одиниця `tok` — як символ `$`, без i18n |
| `messages/en/runs.json` | `trace.stat.cost: "COST"` |

## 5. Acceptance criteria (client)

- [ ] **AC-C1** Список PR має колонку **Cost**; PR з прогонами показує суму (`$0.012`), PR без прогонів з ціною — `—`.
- [ ] **AC-C2** Кожен завершений (`done`) прогін у таймлайні показує `N tok · $X` праворуч під часом.
- [ ] **AC-C3** У дровері Stats 4 плитки: DURATION · TOKENS · COST · FINDINGS.
- [ ] **AC-C4** Жодне місце не показує `$0.00` за відсутності даних — тільки `—` (failed, cancelled, старі прогони, `null`).
- [ ] **AC-C5** Формат як на дизайні: до 4 знаків після коми без хвостових нулів (`$0.0006`, `$0.012`, `$0.06`), не округлювати до центів.
- [ ] **AC-C6** Ціна в UI = значення в `GET /pulls/:id/runs` = рядок у лозі прогону = OpenRouter dashboard (звірити на одному прогоні).
- [ ] **AC-C7** Сума в списку PR = сума бейджів done-прогонів цього PR у таймлайні.
- [ ] **AC-C8** Немає нових запитів з клієнта: дані приходять у наявних відповідях.

## 6. План реалізації (client)

| # | Крок | Перевірка |
|---|---|---|
| C1 | Контракти в `client/src/vendor/shared` (разом із server S1) | `pnpm exec tsc --noEmit` |
| C2 | `formatCost` + unit-тести (таблиця з §2 — це готові кейси) | `pnpm exec vitest run format-cost` |
| C3 | `RunCostBadge` + RTL-тести (`compact` / `inline` / `null` → `—`) | vitest |
| C4 | Екран 3 — Stats у `TraceBody` + i18n; оновити фікстуру в `RunTraceDrawer.test.tsx` (`stats.cost_usd`) і додати кейс «trace без cost → `—`» | vitest |
| C5 | Екран 2 — `RunHistory`; оновити фікстуру `RunSummary` у `RunHistory.test.tsx` (`cost_usd`), кейси done / failed / null | vitest |
| C6 | Екран 1 — `GRID`, `COLUMN_KEYS`, `PRRow`, i18n; тест на `PRRow` | vitest |
| C7 | Ручна перевірка в застосунку: `./scripts/dev.sh`, запустити рев'ю на PR, звірити з OpenRouter (AC-C6, AC-C7) | скріншоти 3 екранів у PR |

Порядок: C1 → C2 → C3 → (C4, C5, C6 у будь-якому порядку) → C7.
Серверні кроки S1–S6 мають бути готові до C7; C2–C6 можна робити паралельно з сервером на фікстурах.

## 7. Відкрите / на потім

- Tooltip у списку PR із розбивкою «N прогонів, з них M без ціни» — корисно, коли в PR змішані старі й нові прогони. Не в M1.
- VerdictBanner (`$0.014 · 8.2K→1.3K`) — свідомо поза скоупом; `RunCostBadge variant="inline"` перевикористовується без змін.
- На L08 повертаємось до цих цифр (агрегати по агентах і моделях).
