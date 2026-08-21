# AI Task Continuity

This file is a compact handoff log. Keep it short and update it at the end of every implementation task.

## Active Handoff

- **Current task**: T024 database foundation + Remote Command Center Phase 1.
- **Status**: Completed.
- **Current task**: Authorization context and scope guards T026 completed.
- **Next task**: T025, create Organization/TenantInstance/User/Role/Permission/ScopeGrant/AuditEvent PostgreSQL entities.
- **Blocker**: PostgreSQL runtime service and authentication/provider decisions remain open.
- **Files in focus**: `docs/task-dashboard.html`, `docs/PROJECT_MEMORY.md`, `docs/ai-task-continuity.md`, `specs/001-lms-multi-branch/tasks.md`.\n- **Verification**: 44 Vitest tests pass including 8 negative authorization matrix cases; lint/typecheck pass; API guard requires server-derived context. Demo web moved to port 3100 and `/ui-preview` returns HTTP 200.

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

Every task must update `docs/project-status.json` at start, meaningful milestones, blockers, and completion. The public dashboard polls every 15 seconds; without this update users cannot see current coding activity.

## Rules

- Do not claim a task complete from documentation alone when the task asks for code, tests or infrastructure.
- Preserve user changes and inspect dirty files before editing.
- Record conflicts between spec, plan, constitution and implementation before proceeding.
- Keep secrets and private learner media out of this file and Git.
