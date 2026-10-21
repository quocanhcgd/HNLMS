# Contributing

## Before a change

1. Read the relevant feature spec, plan, contracts and tasks.
2. Check `git status` and keep unrelated work intact.
3. For UI changes, verify vi/dark default plus en/light/system and mobile behavior.
4. For authorization, payment, payroll, media or AI changes, add negative/retry/audit tests.

## Required verification

Run the focused test first, then `npm test` and `npm run typecheck` for shared or cross-role changes. Keep table operations in the primary table with a `Thao tác` column; edits use validated modals, deletes require confirmation, and locked/audited records use archive, void or adjustment. Every completed task records verification, residual risk and the next task in the handoff.

## Commit convention

Use short imperative commits, for example:

- `feat(web): add lesson player shell`
- `fix(authz): reject cross-branch media playback`
- `docs(spec): define speaking assessment flow`

## Pull requests

Describe scope, migration impact, environment variables, tests, screenshots for UI, and rollback notes. Never include secrets or private learner media.
