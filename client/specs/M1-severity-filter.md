# M1 · Severity filter (лічильники знахідок за severity) — client

> Тільки клієнт. **Немає** нового роуту, нової таблиці / міграції, зміни контракту чи виклику моделі.
> Усі дані вже приходять у наявному `GET /pulls/:id/reviews` → `ReviewRecord.findings` → prop `findings` у `FindingsPanel`.
> Мета: у розгорнутому прогоні (вкладка **Agent runs**) одразу видно розподіл знахідок
> за severity, а клік по рівню лишає у списку тільки знахідки цього рівня.
> Рішення фази Initiation — 2026-11-23 (див. §8).

## 1. Де відображається

| Екран | Компонент | Місце |
|---|---|---|
| PR → вкладка **Agent runs** → розгорнутий прогін | `[number]/_components/FindingsPanel/FindingsPanel.tsx` | тулбар (`s.toolbar`), **ліворуч** від «Hide low confidence» |

Кожен прогін (`ReviewRunAccordion`) має власний `FindingsPanel` → **власний** фільтр; фільтри прогонів незалежні.

Макет:
```
(1 CRITICAL) (3 WARNING) (1 SUGGESTION)                    Hide low confidence ( )
┌ 🔴 Admin comment management endpoints lack auth …                               ┐
┌ 🟠 Admin comment endpoints use POST with body-based IDs …                       ┐
…
```
Активний рівень (фільтр увімкнено, обрано WARNING):
```
(1 CRITICAL)  [■ 3 WARNING ■]  (1 SUGGESTION)              Hide low confidence ( )
   приглушений   залитий SEV.c      приглушений
┌ 🟠 … лише WARNING-картки …                                                      ┐
```

## 2. Поведінка

| # | Правило |
|---|---|
| B1 | Завжди **три** лічильники в порядку `CRITICAL · WARNING · SUGGESTION` (`FILTER_SEVERITIES` у `FindingsPanel/constants.ts`, звірений з типом `Severity` через `satisfies Record<Severity, true>`; **не** `Severity.options` — з `@devdigest/shared` у клієнті можна імпортувати тільки типи, бо webpack у Next не резолвить його `.js`-реекспорти). `INFO` (є лише в UI-токенах `SEV`) не показуємо. |
| B2 | Формат: `{count} CRITICAL` — число, потім підпис великими літерами. Рівень без знахідок показує `0 …`, рядок не ламається. |
| B3 | **Що рахуємо:** знахідки, що лишились **після** «Hide low confidence», але **до** фільтра severity. Отже сума лічильників = довжина списку без severity-фільтра, і кожне число = кількість карток цього рівня у списку (P1). |
| B4 | Dismissed / accepted знахідки **рахуються** — вони лишаються у списку (картка лише змінює вигляд). |
| B5 | Клік по неактивному рівню → фільтр = цей рівень (тільки один активний; клік по іншому рівню переносить фільтр). |
| B6 | Клік по активному рівню → фільтр знято, всі три лічильники знову однакові. |
| B7 | Severity-фільтр і «Hide low confidence» поєднуються через **AND**: у списку — знахідки, що проходять обидві умови. |
| B8 | Фільтр дав 0 карток (напр. клік по `0 CRITICAL`) → наявний `EmptyState` «No findings match». |
| B9 | Після accept / dismiss лічильники оновлюються без перезавантаження: вони **обчислюються** з `findings` (prop) через `useMemo`, ніде не зберігаються. Обраний рівень лишається. |
| B10 | Жодних запитів: лічильники й фільтр працюють тільки з уже завантаженим `findings`. |
| B11 | Зміна фільтра (severity або hideLow) скидає `focusIdx` на `0`, щоб j/k та a/d не вказували за межі нового списку. |

## 3. Вигляд (стани кнопки)

Колір — **тільки** з `SEV[sev].c` / `SEV[sev].bg` (`@devdigest/ui`, `primitives/tokens.ts`); підпис — з i18n.

| Стан | Рамка | Фон | Текст | Інше |
|---|---|---|---|---|
| фільтр вимкнено (всі однакові) | `1px solid SEV.c` | transparent | `SEV.c` | — |
| активний | `1px solid SEV.c` | `SEV.c` | `var(--bg-primary)` (контраст на заливці) | `aria-pressed="true"` |
| неактивний, поки інший активний | як «вимкнено» | transparent | `SEV.c` | `opacity: 0.45` |
| count = 0 (фільтр вимкнено) | як «вимкнено» | transparent | `SEV.c` | `opacity: 0.45` |

- Форма — pill: `borderRadius: 999`, `padding: "4px 12px"`, `fontSize: 12`, `fontWeight: 600`, `letterSpacing: "0.04em"`, число — клас `tnum`.
- Виділення не залежить від hover — стан читається зі скріншоту.
- Активний стан передається **не лише кольором** (заливка vs контур + `aria-pressed`).
- Елемент — `<button type="button">`; група — `role="group"` з `aria-label` з i18n.

`SeverityBadge` напряму **не** перевикористовуємо: він `<span>` (не кнопка), завжди залитий `SEV.bg`, з іконкою і без активного стану. Беремо ті самі токени `SEV`, з яких він будується.

## 4. API helper-ів — `FindingsPanel/helpers.ts`

```ts
import type { FindingRecord, Severity } from "@devdigest/shared";

/** Optionally drop low-confidence, optionally keep one severity, sort by severity. */
export function visibleFindings(
  findings: FindingRecord[],
  hideLow: boolean,
  severity: Severity | null = null,        // NEW, default → поведінка як зараз
): FindingRecord[];

/** Count per severity; always returns all three keys (0 when absent). INFO/unknown ignored. */
export function countBySeverity(findings: FindingRecord[]): Record<Severity, number>; // NEW
```

У компоненті:
```ts
const [sevFilter, setSevFilter] = React.useState<Severity | null>(null);
const counts = React.useMemo(() => countBySeverity(visibleFindings(findings, hideLow)), [findings, hideLow]);
const shown  = React.useMemo(() => visibleFindings(findings, hideLow, sevFilter), [findings, hideLow, sevFilter]);
const toggle = (sev: Severity) => setSevFilter((cur) => (cur === sev ? null : sev));
```

## 5. Зміни по файлах

| Файл | Зміна |
|---|---|
| `FindingsPanel/helpers.ts` | 3-й параметр `severity` у `visibleFindings`; нова `countBySeverity` |
| `FindingsPanel/helpers.test.ts` (**новий**) | unit-тести helper-ів (§6) |
| `FindingsPanel/_components/SeverityFilter/SeverityFilter.tsx` (**новий**) + `index.ts` + `styles.ts` | props: `counts: Record<Severity, number>`, `active: Severity \| null`, `onToggle(sev)`. Чистий презентаційний компонент, без стану |
| `FindingsPanel/FindingsPanel.tsx` | стан `sevFilter`, `counts`, `<SeverityFilter>` першим елементом тулбару, скидання `focusIdx` (B11) |
| `FindingsPanel/FindingsPanel.test.tsx` | кейси інтеграції (§6) |
| `messages/en/prReview.json` | `panel.severityFilter` (aria-label групи) + `panel.severityCount.{CRITICAL,WARNING,SUGGESTION}` = `"{count} CRITICAL"` тощо |

Не чіпаємо: `src/vendor/ui/*` (SEV / SeverityBadge — тільки читаємо), `src/vendor/shared/*`, `ReviewRunAccordion`, сервер.

## 6. Тести

`helpers.test.ts`:
- `countBySeverity` — мікс рівнів → правильні числа; `[]` → `{CRITICAL:0, WARNING:0, SUGGESTION:0}`; `INFO` ігнорується.
- `visibleFindings(…, severity)` — лишає тільки рівень; `null` → як раніше (усі, відсортовані).
- `hideLow=true` + `severity` → тільки ті, що проходять обидві умови (B7).

`FindingsPanel.test.tsx` (RTL, запити за текстом/роллю, не `getByTestId`):
- Рендерить три лічильники з правильними числами, включно з `0 CRITICAL` (B1–B2).
- Клік `WARNING` → видно лише WARNING-картки, `aria-pressed=true` на ньому, `false` на інших (B5).
- Повторний клік → усі картки повернулись, жоден не pressed (B6).
- Клік `WARNING`, потім `SUGGESTION` → активний лише SUGGESTION (B5).
- Ввімкнено «Hide low confidence» → лічильники рахують тільки видимі (B3); разом із severity — AND (B7).
- Клік по рівню з 0 → «No findings match» (B8).
- `rerender` з оновленими `findings` (dismissed) → числа збігаються зі списком, обраний рівень лишився (B9).
- `fetch` не викликається при кліках (B10) — `vi.spyOn(globalThis, "fetch")`.

## 7. Acceptance criteria → як перевіряємо

| ID | Критерій | Перевірка |
|---|---|---|
| P1-1 | Видно лічильники трьох рівнів | RTL + вручну |
| P1-2 | Числа = картки у списку | RTL (B3) + вручну |
| P1-3 | Клік лишає тільки цей рівень | RTL |
| P1-4 | Фільтр можна зняти | RTL |
| P1-5 | PR у форку з описом і відео | Completion |
| P2-1 | Без запитів / моделі | RTL (fetch spy) + DevTools → Network порожній при кліках |
| P2-2 | AND з Hide low confidence | unit + RTL |
| P2-3 | Кольори з `SEV` | code review |
| P2-4 | Тести; `pnpm test`, `pnpm typecheck` зелені | CI-локально в `client/` |
| P2-5…8 | INSIGHTS, CLAUDE.md, 5 фаз і звіт рев'юверів у PR | Completion |
| P3-1 | Активний рівень виділений, інші приглушені, один активний, повторний клік знімає | RTL (`aria-pressed`) + скріншот |
| P3-2 | `0` не ламає рядок | RTL + вручну |
| P3-3 | Порожній стан | RTL |
| P3-4 | Підписи в `prReview.json` | code review |
| P3-5 | Після accept/dismiss числа збігаються | RTL (rerender) + вручну |

## 8. План реалізації

| # | Крок | Перевірка |
|---|---|---|
| I1 | `helpers.ts`: `countBySeverity` + 3-й параметр + `helpers.test.ts` | `pnpm exec vitest run helpers` |
| I2 | i18n ключі в `prReview.json` | — |
| I3 | `SeverityFilter` (презентаційний) | typecheck |
| I4 | Підключити у `FindingsPanel` (стан, useMemo, B11) + RTL-тести | `pnpm test` |
| I5 | `pnpm test` + `pnpm typecheck` у `client/` | зелені |
| I6 | Вручну: PR #482 → Agent runs → прогін із кількома рівнями; клік по кожному, разом з Hide low confidence, accept/dismiss; Network без запитів | скріншоти / відео |

Порядок: I1 → I2 → I3 → I4 → I5 → I6.

**Дані для I6 — без виклику моделі.** Фіча не залежить від нових прогонів:
- Усі комбінації рівнів / confidence / dismissed покривають **фікстури** в RTL-тестах (§6).
- Вручну вистачає наявного прогону з seed у PR #482: `1 CRITICAL · 1 WARNING · 0 SUGGESTION` —
  це показує лічильники, фільтр, зняття фільтра, рівень з `0` і порожній стан (клік по `0 SUGGESTION`).
- Прогони рев'юверів для звіту в PR — **окрема частина домашки**, не крок цієї фічі; якщо вони
  дадуть прогін з усіма трьома рівнями, його можна взяти для відео, але це не передумова.

## 9. Рішення Initiation і що свідомо викинуто

Рішення (2026-11-23):
- Рахуємо **видимі** після Hide low confidence (а не всі знахідки прогону) — інакше числа розходяться зі списком.
- Рівень з `0` **показуємо** (критерій P3), хоча на макеті він прихований.
- `INFO` не показуємо — контракт `Severity` має лише 3 рівні.
- Колір — з `SEV`, підпис — з i18n (`SEV.label` не локалізований).

Викинуто з плану:
- Перевикористання `SeverityBadge` як є (не кнопка, немає активного стану) — тільки його токени.
- Збереження фільтра в URL / між прогонами / після перезавантаження.
- Мультивибір кількох рівнів одночасно (критерій вимагає один активний).
- Гарячі клавіші для фільтра.
- Лічильники в заголовку акордеона та в списку PR. (Таймлайн повернуто в скоуп — §10.)

## 10. Розширення скоупу: розбивка за severity + поповер у таймлайні (2026-11-24)

> **Чому:** у критеріях цього не було, але це показано в демо-відео завдання (таймлайн:
> `ⓘ 1 ⚠ 4`, при наведенні — список «5 FINDINGS IN THIS RUN»). Додано після Implementation
> основної фічі, за рішенням автора PR. Обмеження те саме: **тільки клієнт**, без нового роуту,
> таблиці, зміни контракту чи виклику моделі.

**Дані.** `RunSummary` має лише `findings_count` і `blockers`, без розбивки. Але `FindingsTab`
уже має завантажені `ReviewRecord[]` (з `run_id` і `findings`) → будуємо `findingsByRun`
(`run_id → FindingRecord[]`) і передаємо в `RunHistory`. Прогін без зіставленого рев'ю
(старий / seed / failed) → показуємо як раніше `N finding(s)`.

| # | Правило |
|---|---|
| T1 | Рядок done-прогону в таймлайні: замість `N finding(s)` — **іконка + число** для кожного рівня, у якого `> 0` (іконка й колір — `SEV[sev]`), далі як раніше ` · N blockers`. Рівні з `0` тут **приховані** — це підсумок, а не фільтр (на відміну від §2 B2). |
| T2 | Наведення або фокус на лічильниках → **поповер** «`N` FINDINGS IN THIS RUN»: для кожної знахідки — іконка severity, заголовок (1 рядок, `…`), `CategoryTag`, `file:line` (`MonoLink` → GitHub, як у картці), `ConfidenceNum`, **короткий опис** — `rationale`, обрізаний до 2 рядків. Порядок — за severity (`visibleFindings(findings, false)`). Довгий список прокручується (max-height). |
| T3 | **Той самий опис, що в Review runs:** поповер бере ті самі поля, що й `FindingCard` (`title`, `category`, `file:line`, `confidence`, `rationale`). У картці `rationale` повністю (Markdown) після розгортання; у поповері — той самий текст, скорочений. |
| T4 | Клік по заголовку знахідки в поповері → `onGoToReview(run_id)`: акордеон цього прогону в Review runs відкривається й прокручується (наявний механізм). |
| T5 | Клавіатура: лічильники — `<button aria-expanded>`; фокус відкриває, `Escape` / втрата фокусу закриває. Миша: поповер — нащадок обгортки (з прозорим «містком» над ним), тож перехід курсора з лічильників у поповер його не закриває. |
| T6 | Жодних запитів: усе з уже завантажених рев'ю. |

**Файли.**

| Файл | Зміна |
|---|---|
| `FindingsTab/FindingsTab.tsx` | `findingsByRun` з `runs` (ReviewRecord[]) → проп у `RunHistory` (+ `repoFullName`, `headSha` для посилань) |
| `RunHistory/RunHistory.tsx` | новий опційний проп `findingsByRun`; рядок done-прогону рендерить `<RunFindingsSummary>` або старий текст |
| `RunHistory/_components/RunFindingsSummary/*` (**новий**) | лічильники + поповер (стан відкриття — локальний) |
| `messages/en/prReview.json` | `timeline.findingsInRun` (ICU plural), `timeline.showFindings` (aria-label) |
| `RunHistory/RunHistory.test.tsx` | кейси T1, T2/T3, T4, fallback |

**Поза скоупом розширення:** розгортання конкретної картки після переходу з поповера
(відкривається прогін, не окрема знахідка). Список PR — див. §11.

## 11. Розширення скоупу №2: колонка FINDINGS у списку PR (2026-11-24)

> **Чому:** показано в демо-відео завдання (список PR: колонка **FINDINGS** `ⓘ 1 ⚠ 4`,
> при наведенні — той самий список знахідок). Додано за рішенням автора PR.

**Дані — свідомий компроміс.** `PrMeta` (відповідь `GET /repos/:id/pulls`) не містить знахідок;
сервер навмисно їх не віддає (коментар у `server/src/modules/pulls/routes.ts`). Щоб лишитися
в межах «тільки клієнт, без нового роуту / контракту / моделі», рядок бере знахідки через
**наявний** хук `usePrReviews(pr.id)` → **наявний** `GET /pulls/:id/reviews`:
- запит іде **лише для PR, що вже мають рев'ю** (`pr.score != null`); не-рев'ювані PR — без запиту, `—`;
- кеш React Query (`["reviews", prId]`) спільний зі сторінкою PR → перехід у PR без повторного запиту;
- ціна: 1 запит на кожен відрев'юваний PR при завантаженні списку (N, а не 1). Для локального
  списку на кілька PR — прийнятно. **Альтернатива на потім:** додати `severity_counts` у `PrMeta`
  на сервері (один GROUP BY) — але це зміна контракту в обох копіях `@devdigest/shared`.

| # | Правило |
|---|---|
| L1 | Нова колонка **Findings** між **Score** і **Status**. |
| L2 | Показуємо знахідки **найновішого рев'ю** (`kind === "review"`, перше в `GET /pulls/:id/reviews`, newest-first) — того самого, чий `score` у кільці рядка. |
| L3 | Вигляд — як у таймлайні (T1): іконка + число для рівнів `> 0`. Немає рев'ю / 0 знахідок / ще вантажиться → `—`. |
| L4 | Наведення / фокус → той самий поповер, що в таймлайні (T2, T3): заголовок, категорія, `file:line`, confidence, короткий `rationale`. |
| L5 | Клік по лічильниках або по заголовку знахідки → сторінка PR на вкладці **Agent runs** (`?tab=findings`). Кліки всередині комірки не спрацьовують як клік по рядку; посилання `file:line` веде на GitHub. |
| L6 | Таблиця має `overflow: hidden` → поповер рендериться через **портал** у `document.body` з `position: fixed` (закривається при прокрутці). Той самий компонент — у таймлайні. |

**Файли.**

| Файл | Зміна |
|---|---|
| `src/components/findings-summary/*` (**перенесено** з `RunHistory/_components/RunFindingsSummary`) | спільний `FindingsSummary` (лічильники + поповер у порталі); проп `onSelect` |
| `RunHistory/RunHistory.tsx` | імпорт з нового місця |
| `pulls/_components/PrFindingsCell/*` (**новий**) | `usePrReviews` → найновіше рев'ю → `FindingsSummary` / `—` |
| `pulls/_components/PRRow/PRRow.tsx` | комірка `<PrFindingsCell>` між score і status |
| `pulls/constants.ts` | `GRID` + колонка `104px`; `COLUMN_KEYS` + `"findings"` |
| `messages/en/prReview.json` | `list.columns.findings` |
| `PRRow/PRRow.test.tsx` | рендер у `QueryClientProvider`, `fetch` замокано: лічильники, `—`, без запиту для не-рев'юваного PR |
