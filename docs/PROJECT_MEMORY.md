# Project Memory

**Last updated**: 2026-08-20
**Purpose**: Working memory for any AI or developer continuing HN-LMS work from another task, machine, or location.

## Current State

- Repository: `https://github.com/quocanhcgd/HNLMS`
- Default branch: `main`
- Local prototype: Next.js App Router at `apps/web`, demo port `3100` (`http://localhost:3100/ui-preview`)
- UI: Mantine, TanStack Table 8.x, Lucide React; default locale `vi`, default theme `dark`.
- API and worker skeletons now exist with TypeScript strict and API `/health`; Drizzle/PostgreSQL database foundation and migration generation now exist; runtime PostgreSQL still required for migration execution.
- Root quality tooling exists: ESLint 9, Prettier, Vitest 3 and Playwright 1.58; web/API/worker typecheck, lint, format check, unit smoke test and Chromium E2E pass.
- Tasks: `T001` to `T175`; T001-T024 are currently marked complete; T025+ remain open.
- Current commit baseline: `387125a`; latest foundation work is pending commit.

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
3. Run `npm run status:generate` and open `docs/task-dashboard.html`.
4. Select the smallest unblocked task, then read its referenced spec/contract paths.
5. Check whether another agent changed the same files.

Before ending every task:

1. Run the narrowest relevant tests, typecheck or build.
2. Update `tasks.md` only when the artifact/test really exists.
3. Update `docs/ai-task-continuity.md` and `docs/project-status.json` with completed work, current task percentage, activity, blockers and next task.
4. Run `npm run status:generate` so the HTML task list and live status stay synchronized.
5. Commit a coherent change; never commit secrets, `.env`, generated output, `node_modules` or private media.
6. Push only after checking the target branch and remote.

## Current Blockers / Decisions Needed

- `npm audit` currently reports 4 vulnerabilities (1 moderate, 3 high); address through T172 dependency gate, not force-upgrade without review.

- Choose and document concrete authentication/session provider.
- Database stack selected: Drizzle ORM + PostgreSQL; runtime PostgreSQL service still required for migration smoke/restore tests.
- Choose payment, meeting, accounting/ERP, AI, email/SMS, storage and video provider adapters.
- Define Vietnam payroll, tax and insurance formulas with an accountable business owner.
- Define privacy/retention/legal basis for minors, parent data, recordings, voice and AI processing.

## Recent Work Log

- 2026-08-20: Created UI prototype and component gallery.
- 2026-08-20: Added TanStack Table 8.x to lead pipeline.
- 2026-08-20: Restored corrupted data model/API contracts and added multimedia requirements T144-T160.
- 2026-08-20: Added full-stack readiness checklist and T161-T175.
- 2026-08-20: Initialized Git repository and pushed `main` to GitHub.
- 2026-08-20: Created API/worker/shared package skeletons; web typecheck/build passed; API runtime health check still pending.
- 2026-08-21: Implemented T024 Drizzle client, tenant resolver, tenant registry schema and migration runner. Added Remote Command Center queue/lock policy and GitHub Issue prefilled command link.
- 2026-08-20: Added ESLint/Prettier/Vitest/Playwright; all configured quality checks pass.
- 2026-08-20: Implemented shared domain, authorization, module, license, UI and theme contracts with invariant tests.
- 2026-08-20: Integrated next-intl provider, typed vi/en catalogs, semantic Mantine preset runtime and locale persistence tests.
- 2026-08-20: Added native Debian/Ubuntu deployment skeleton with systemd, Nginx, env templates and guarded release scripts.
- 2026-08-20: Added GitHub Actions CI, GitHub Pages dashboard redirect and README progress badges.
- 2026-08-20: Added separate public, platform and LMS App Router layout boundaries with route tests.
- 2026-08-20: Added loading/error/not-found boundaries, product metadata and deep-link/history E2E coverage.
- 2026-08-20: Added shared Mantine UI wrappers for controls/table/modal/toolbar and migrated shell/lead list.
- 2026-08-20: Formalized semantic theme tokens, state colors, spacing/typography scales and CSS runtime mapping.
- 2026-08-20: Added public shell with desktop/mobile navigation, locale/theme controls, consultation CTA and legal footer.
- 2026-08-20: Added separate platform control-plane shell with tenant/license/deployment/migration/audit navigation and mobile layout.
- 2026-08-21: Upgraded LMS shell with workspace context, grouped navigation, mobile/collapsed behavior and shared table/form wrappers.
- 2026-08-21: Added typed LMS navigation manifests, role/module filtering, active route resolver, submenu and mobile navigation tests.
- 2026-08-21: Added shared PageFrame, LoadingState, EmptyState, ErrorState, ForbiddenState and ConfirmationSummary compositions; lead list migrated to EmptyState.
- 2026-08-21: Added theme preset registry with preview/publish/rollback mock lifecycle, contrast validation and token CSS application in UI preview.
- 2026-08-21: Added UI foundation Playwright projects for visual overflow, Axe accessibility, keyboard and responsive checks; fixed contrast, labels and mobile table overflow.
- 2026-08-21: UI foundation acceptance gate T023 passed and evidence was recorded in quickstart.

## Live Coding Status

- Dashboard: `https://quocanhcgd.github.io/HNLMS/`.
- Source: `docs/project-status.json`, polled every 15 seconds.
- Update command: `npm run status:generate`.
- Start a task: `npm run status:start --task=T024` or set `STATUS_TASK`, `STATUS_STATE`, `STATUS_PERCENT`, `STATUS_ACTIVITY` before `npm run status:generate`.

- 2026-08-21: Added Drizzle database foundation, tenant resolver, migration runner and generated tenant registry migration.
- 2026-08-21: Added Remote Command Center Phase 1 queue/lock policy and GitHub Issue command link; no arbitrary shell execution.
