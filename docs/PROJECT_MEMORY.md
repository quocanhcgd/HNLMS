# Project Memory

**Last updated**: 2026-08-20
**Purpose**: Working memory for any AI or developer continuing HN-LMS work from another task, machine, or location.

## Current State

- Repository: `https://github.com/quocanhcgd/HNLMS`
- Default branch: `main`
- Local prototype: Next.js App Router at `apps/web`
- UI: Mantine, TanStack Table 8.x, Lucide React; default locale `vi`, default theme `dark`.
- Full-stack backend, worker, database and production infrastructure are not implemented yet.
- Tasks: `T001` to `T175`; only T002 and T003 are currently marked complete.
- Current commit baseline: `387125a`.

## Source Of Truth Order

1. `.specify/memory/constitution.md`
2. `specs/001-lms-multi-branch/spec.md`
3. `specs/001-lms-multi-branch/plan.md`
4. `specs/001-lms-multi-branch/data-model.md`
5. `specs/001-lms-multi-branch/contracts/`
6. `specs/001-lms-multi-branch/tasks.md`
7. `specs/001-lms-multi-branch/checklists/full-stack-readiness.md`
8. This file and `docs/ai-task-continuity.md`

When documents conflict, stop and record the conflict in this file before coding.

## Non-Negotiable Decisions

- Next.js App Router only; no React Router.
- TypeScript strict for web, API, worker and shared contracts.
- Mantine for UI/theme; TanStack Table 8.x for data-table logic; `next-intl` for vi/en.
- PostgreSQL is transactional source of truth; Redis is cache/queue/short lock only.
- Private object storage for all restricted media/files; signed URLs only after authorization.
- Modular monolith API plus separate worker; no production Docker baseline.
- Tenant SaaS uses one database per tenant; one-way SaaS-to-dedicated migration.
- Lesson/question extensibility uses internal typed registry with schema/migration contracts; no tenant-uploaded executable plugins.
- Runtime player, recorder, uploader, lesson renderer and assessment engine must not depend on MCP.
- MCP is optional for development tooling or governed AI integration only.
- Multimedia MVP covers text, image/gallery, audio, video, PDF/slide, attachments, quiz checkpoints, flashcards, vocabulary, practice questions and manual speaking review.
- Advanced features such as proctoring, automatic pronunciation scoring, adaptive learning and SCORM/xAPI/H5P interoperability are post-MVP.

## Task Continuity Protocol

At the start of every task:

1. Read this file and `docs/ai-task-continuity.md`.
2. Run `git status --short --branch`.
3. Open the task dashboard: `docs/task-dashboard.html`.
4. Select the smallest unblocked task, then read its referenced spec/contract paths.
5. Check whether another agent changed the same files.

Before ending every task:

1. Run the narrowest relevant tests, typecheck or build.
2. Update `tasks.md` only when the artifact/test really exists.
3. Update `docs/ai-task-continuity.md` with completed work, current task, blockers and next task.
4. Update the HTML dashboard data if task status changed.
5. Commit a coherent change; never commit secrets, `.env`, generated output, `node_modules` or private media.
6. Push only after checking the target branch and remote.

## Current Blockers / Decisions Needed

- Choose and document concrete authentication/session provider.
- Choose PostgreSQL data-access/migration tool.
- Choose payment, meeting, accounting/ERP, AI, email/SMS, storage and video provider adapters.
- Define Vietnam payroll, tax and insurance formulas with an accountable business owner.
- Define privacy/retention/legal basis for minors, parent data, recordings, voice and AI processing.

## Recent Work Log

- 2026-08-20: Created UI prototype and component gallery.
- 2026-08-20: Added TanStack Table 8.x to lead pipeline.
- 2026-08-20: Restored corrupted data model/API contracts and added multimedia requirements T144-T160.
- 2026-08-20: Added full-stack readiness checklist and T161-T175.
- 2026-08-20: Initialized Git repository and pushed `main` to GitHub.
