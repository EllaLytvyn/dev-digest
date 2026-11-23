---
name: engineering-insights
description: Captures non-obvious engineering lessons into the INSIGHTS.md of the module being worked on (server, server/src/modules/repo-intel, client, reviewer-core, e2e). Use proactively during a session right after a confirmed fix, a user correction, a dead end, a library/tool quirk, a non-default convention or an unresolved question; at the end of a meaningful session as a wrap-up; and for a periodic review. Triggers on "/engineering-insights", "/engineering-insights review", "запиши інсайт", "що ми дізнались", "wrap up", "retro", "remember this lesson".
---

# engineering-insights

Goal: the next agent working in this module reads INSIGHTS.md cold and avoids today's mistakes.
Judgment on WHAT to record is yours; WHERE and HOW to write is fixed below.

## Workflow

Copy this checklist and work through it:

```
- [ ] 1. Gate check — was this session substantial?
- [ ] 2. Read the touched module's INSIGHTS.md
- [ ] 3. Draft ≤5 candidates, ranked by signal
- [ ] 4. Dedup against what's already there
- [ ] 5. Append automatically (append-only)
- [ ] 6. One-line summary
```

1. **Gate check.** Did the session produce something substantial — a problem solved, a decision made, a non-obvious
   discovery? If not → **write nothing** and stop. (Mid-session capture: the single confirmed lesson is the session.)
2. **Read first.** Open the touched module's `INSIGHTS.md` in full before drafting anything; note its line count.
3. **Draft ≤5 candidates**, ranked by signal (user corrections and gotchas highest; nice-to-know patterns lowest).
   Candidate = the exact proposed entry + its target section + `file:line` evidence. Apply the quality gate below.
4. **Dedup.** Drop any candidate already covered by an existing entry. If reality contradicts an old entry, add a new
   entry that supersedes it (`Supersedes: <title>`) — never edit the old one.
5. **Append** the survivors (automatic mode — no approval prompt), following *Safe write*. If nothing substantial
   survives gate + dedup → write nothing.
6. **Summary.** One line: what was written, to which file, what was skipped.

At the end of a substantial session also append one `Session Notes` entry (2–3 sentences).

## Where to write

| Work touched | File |
|---|---|
| client (`@devdigest/web`) | `client/INSIGHTS.md` |
| server (`@devdigest/api`) | `server/INSIGHTS.md` |
| repo-intel (`server/src/modules/repo-intel/**`) | `server/src/modules/repo-intel/INSIGHTS.md` |
| reviewer-core (`@devdigest/reviewer-core`) | `reviewer-core/INSIGHTS.md` |
| e2e (`@devdigest/e2e`) | `e2e/INSIGHTS.md` |
| spans several packages | write the part relevant to each, to each file |
| pure root config / CI only | usually not a module insight — skip it |

Never write insights into this SKILL.md itself or into CLAUDE.md.

## What counts (the 7 sections)

Each `INSIGHTS.md` has fixed sections — append each entry under the right one, never add or reorder sections:
- **What Works** — an approach/solution that worked here.
- **What Doesn't Work** — dead ends and antipatterns. **Highest-value section, most often skipped — prioritize it.**
- **Codebase Patterns** — conventions and architectural decisions.
- **Tool & Library Notes** — dependency quirks and gotchas.
- **Recurring Errors & Fixes** — an error you'd hit again + the fix.
- **Session Notes** — dated session summaries (use a `### YYYY-MM-DD` subheading).
- **Open Questions** — what's still unresolved (unconfirmed hunches go here).

## Quality gate — keep a candidate only if ALL hold
1. Not obvious to anyone reading the code, and not already in README/docs/CLAUDE.md.
2. Would save the next agent 5+ minutes.
3. Confirmed (fix worked, behaviour reproduced). A hunch → `Open Questions`.
Reject: generic truisms, one-off transient failures, chat replay, anything needing a paragraph.

## Entry format (fixed)
```
### YYYY-MM-DD · <short title>
<Do X / Use X instead of Y> — <why, one clause>. Evidence: `<file:line>` (`<symbol>`) / `<command>` / "<error text>".
```
Max 2 sentences, imperative. Add the symbol next to `file:line` — lines drift. No secrets, tokens or key values.
Good vs bad entries: [examples.md](examples.md).

## Safe write — existing content is NEVER changed
1. Insert, don't rewrite: Edit with `old_string` = the next `## ` heading, `new_string` = entry + blank line + that
   same heading. For `## Open Questions` (last section) append at end of file. Never use Write on an existing INSIGHTS.md.
2. Never edit, move, reword, merge or delete an existing entry, heading or comment — not even a typo.
3. Verify: line count = before + added lines, the new title appears once, and (if tracked)
   `git diff --numstat -- <file>` shows 0 deleted lines. Any removed/changed line → restore it and tell the user.
4. File missing → create it from the 7-section template (copy another module's INSIGHTS.md headers), then insert.

## Review mode (`/engineering-insights review`, ~monthly)
REPORT ONLY: count per section, duplicates, contradictions, vague and stale entries, file >200 entries — with proposals.
Never edit the file in this mode; pruning is done by a human.

## Gotchas
- Auto-triggering from this description is unreliable — when in doubt, the user runs `/engineering-insights`.
- Don't record before the fix is verified; a wrong lesson is worse than none (it compounds).
