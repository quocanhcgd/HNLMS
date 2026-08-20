# Contributing

## Before a change

1. Read the relevant feature spec, plan, contracts and tasks.
2. Check `git status` and keep unrelated work intact.
3. For UI changes, verify vi/dark default plus en/light/system and mobile behavior.
4. For authorization, payment, payroll, media or AI changes, add negative/retry/audit tests.

## Commit convention

Use short imperative commits, for example:

- `feat(web): add lesson player shell`
- `fix(authz): reject cross-branch media playback`
- `docs(spec): define speaking assessment flow`

## Pull requests

Describe scope, migration impact, environment variables, tests, screenshots for UI, and rollback notes. Never include secrets or private learner media.
