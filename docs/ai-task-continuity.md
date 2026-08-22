# AI Task Continuity

This file is a compact handoff log. Keep it short and update it at the end of every implementation task.

## Active Handoff

- **Current task**: T055 consultant portal, notes, next actions and conversion flow.
- **Status**: Completed with consultant work queue, lead detail/timeline, required future next actions and guarded enrollment conversion preview.
- **Next task**: T056, link entrance-assessment assignment from lead into the assessment module.
- **Blocker**: PostgreSQL runtime service and authentication/provider decisions remain open.
- **Files in focus**: `apps/api/src/modules/assessment-english/` for T056.
- **Verification**: 297 unit/contract tests, workspace typecheck, lint and format check pass; 2/2 focused T055 E2E pass. Full Playwright reached 31/35 under eight-worker cold compilation; all four failures (three navigation timeouts and one transient Axe theme result) passed isolated reruns.

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

Standing authorization (2026-08-22): normal coherent task/status checkpoints may be pushed to `origin/main` without asking again, after branch/remote and quality-gate verification. Force-push is also authorized for this repository when history rewriting is genuinely required; prefer `--force-with-lease`, fetch and verify the exact ref first, preserve a recoverable local ref, and report the rewritten commits afterward.

## Rules

- Do not claim a task complete from documentation alone when the task asks for code, tests or infrastructure.
- Preserve user changes and inspect dirty files before editing.
- Record conflicts between spec, plan, constitution and implementation before proceeding.
- Keep secrets and private learner media out of this file and Git.

- **Quy định ngôn ngữ bắt buộc**: mọi nội dung hiển thị cho người dùng Việt Nam trong mọi phase/task phải là tiếng Việt hoàn chỉnh, có dấu; khi review phải rà soát cả hard-coded text, fixture, metadata, empty/loading/error state và E2E assertion.
- **Quy định đồng bộ UI bắt buộc**: mọi trang authenticated có dữ liệu dạng bảng/list phải dùng một pattern TanStack Table 8.x dùng chung, cùng page layout, toolbar, pagination, empty/loading/error state và semantic color tokens; không được để mỗi trang một kiểu bảng/bố cục/màu.
- **Quy định shell/topbar bắt buộc**: breadcrumb chỉ render ở topbar theo route; PageHeader không lặp breadcrumb; nút đóng/mở sidebar nằm sát mép sidebar và phải resize cột sidebar; search topbar chỉ mở input khi bấm icon; các nút search/ngôn ngữ/theme/thông báo/user luôn căn phải; header bảng dùng màu filled primary button qua token.
