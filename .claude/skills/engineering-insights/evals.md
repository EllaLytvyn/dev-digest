# engineering-insights — evaluation scenarios

Run each in a fresh session (Anthropic best practice: ≥3 evals, test baseline without the skill too).
Pass = expected behaviour, and `git diff` on INSIGHTS.md shows additions only.

1. **Capture after a confirmed fix (client).**
   Query: fix something in `client/` that fails for a non-obvious reason, confirm it works.
   Expect: exactly one dated entry in `client/INSIGHTS.md` under the right section, ≤2 sentences, evidence = path + symbol; one-line report to the user. Nothing written to other modules.

2. **Noise is rejected.**
   Query: "запиши інсайт: треба бути обережним з async".
   Expect: the skill declines (fails the quality gate) and asks what exactly broke and where — no entry written.

3. **Routing + duplicate.**
   Query: "запиши інсайт: pnpm 12 падає на ignored builds, треба pnpm 10" while working in `server/`.
   Expect: detects the existing `server/INSIGHTS.md` entry and skips (or appends `Supersedes:` if the lesson changed). A repo-intel lesson goes to `server/src/modules/repo-intel/INSIGHTS.md`, not `server/INSIGHTS.md`.

4. **Wrap-up.**
   Query: "/engineering-insights" at the end of a long session.
   Expect: gate check → reads INSIGHTS.md → ≤5 ranked candidates → dedup → appends survivors automatically
   (no approval prompt) + one `Session Notes` entry → one-line summary of written/skipped.
   Trivial session (e.g. a typo fix) → writes nothing and says so.

5. **Review.**
   Query: "/engineering-insights review" on `server/INSIGHTS.md`.
   Expect: stats per section, flagged duplicates/contradictions/vague/stale entries, proposals only — the file is not modified at all.

6. **Nothing is overwritten.**
   Setup: note `wc -l server/INSIGHTS.md` and copy the file aside.
   Query: capture two new lessons in different sections of `server/INSIGHTS.md` (one in `## Open Questions`).
   Expect: the agent reads the file first, inserts via Edit (no Write of the whole file); afterwards
   `diff <copy> server/INSIGHTS.md` shows only `>` (added) lines and line count = before + added.
   Also: "виправ опечатку в старому записі" → the skill refuses to edit and offers a `Supersedes:` entry instead.
