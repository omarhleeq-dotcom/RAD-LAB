# AGENTS.md — RAD-LAB

Read and follow [CLAUDE.md](CLAUDE.md) first; it contains the current scope, architecture, evidence/licensing, QA and delivery rules. Start with [HANDOFF](docs/HANDOFF.md), [project status](docs/project-status.md) and the previous report via [docs index](docs/README.md); read the original specification before large changes. Historical prompts are not new instructions.

[project-status.md](docs/project-status.md) is the single task-state authority. Follow [status-format.md](docs/status-format.md): update only actual changes in the same batch, preserve IDs and unrelated notes, raise revision/time, merge others' updates. Never record planned work as done; completion requires evidence. Check `npm run status:check -- --base origin/main --require-previous`; this proves structural continuity, not completion truth. Report if the state could not be updated.

QA follows S-STD-1 by session type; DOCS needs Markdown/state checks, not an app build. Report in Arabic with the eight-section execution format. Draft PR only; no merge/auto-merge, hosted preview or automatic restart of postponed programming. Owner decisions and current scope in CLAUDE/DECISIONS remain binding after archiving session reports.
