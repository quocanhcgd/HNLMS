# AI Task Continuity

This file is a compact handoff log. Keep it short and update it at the end of every implementation task.

## Active Handoff

- **Current task**: T054 lead routing, ownership, duplicate detection and lifecycle.
- **Status**: Completed with rule-based routing, assignment transfer and lifecycle guards.
- **Next task**: T055, implement consultant portal, notes, next actions and conversion flow.
- **Blocker**: PostgreSQL runtime service and authentication/provider decisions remain open.
- **Files in focus**: `apps/web/src/app/admin/admission/` and consultation timeline APIs for T055.
- **Verification**: 294 unit/contract tests, workspace typecheck, lint and format check pass.

## Completed Handoff\n\nDate: 2026-08-20\nTask: Build task dashboard and project memory\nStatus: completed\nChanged files: `docs/task-dashboard.html`, `docs/PROJECT_MEMORY.md`, `docs/ai-task-continuity.md`, `.specify/memory/constitution.md`\nTests/checks: 175 tasks, 175 prompts; no obsolete shadcn/Radix/Tailwind references in audited architecture files; git diff check passed except normal CRLF warning\nDecisions: project memory is committed; dashboard is generated from `tasks.md`; prompt template tells the next AI to read source-of-truth and inspect git\nBlockers: GitHub/provider/authentication decisions remain open\nNext task: T001\n\n## Handoff Format

```text
Date:
Task:
Status: pending | in_progress | blocked | completed
Changed files:
Tests/checks:
Decisions:
Blockers:
Next task:
```

## Live Status Handoff

Every task must update `docs/project-status.json` and regenerate `docs/task-dashboard.html` at start, meaningful milestones, blockers, and completion. The public dashboard polls the files published through GitHub Pages every 15 seconds; changing them locally is not enough.

A dashboard checkpoint counts as published only after it is committed and successfully pushed to the monitored branch. Do not let the public dashboard lag across completed tasks. When push is not authorized or fails, explicitly report that the local status is current but the public dashboard is stale, then request permission or surface the push failure. Never claim the public dashboard was updated based only on local generation.

Standing authorization (2026-08-22): normal coherent task/status checkpoints may be pushed to `origin/main` without asking again, after branch/remote and quality-gate verification. Force-push and history rewriting remain unauthorized.

## Rules

- Do not claim a task complete from documentation alone when the task asks for code, tests or infrastructure.
- Preserve user changes and inspect dirty files before editing.
- Record conflicts between spec, plan, constitution and implementation before proceeding.
- Keep secrets and private learner media out of this file and Git.
