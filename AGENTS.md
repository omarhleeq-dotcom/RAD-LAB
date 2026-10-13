# AGENTS.md — RAD-LAB

Instructions for coding agents (Codex, Claude Code, others). The full project rules are in [`CLAUDE.md`](CLAUDE.md): read it first, and `docs/RAD-LAB_Project_Specification.md` before large changes.

## Project status file
`docs/project-status.md` is the single source of the current task status (shared by Claude Code and Codex; shown later in Obsidian); format and update rules: `docs/status-format.md`.

- Read the latest version before starting.
- At the end of a session update only the tasks that really changed, bump `revision` and `updated_at`, and keep ids, notes and sections that are not part of your update.
- Never record planned work as done; use `done` only with suitable `completion_evidence`.
- Update the status in the same change batch as the work. Before merging, review the latest target branch and resolve conflicts without replacing others' updates.
- Check with `npm run status:check` (also run by `npm test`); it verifies organisation only, not that the work is truly done. On a PR, CI also compares with the status at the fork point (`npm run status:check -- --base origin/main`: ids never deleted or reused, `next_id` / `revision` never go back, a data change bumps `revision` and `updated_at`).
- If the status cannot be updated, give the reason in the final report.
