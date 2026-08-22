# Project Memory

**Last updated**: 2026-08-22
**Purpose**: Working memory for any AI or developer continuing HN-LMS work from another task, machine, or location.

## Current State

- Repository: `https://github.com/quocanhcgd/HNLMS`
- Default branch: `main`
- Local prototype: Next.js App Router at `apps/web`, demo port `3100` (`http://localhost:3100/ui-preview`)
- UI: Mantine, TanStack Table 8.x, Lucide React; default locale `vi`, default theme `dark`.
- Ngôn ngữ sản phẩm: mọi UI/content hướng tới người dùng Việt Nam phải dùng tiếng Việt hoàn chỉnh, có đầy đủ dấu và ngữ pháp tự nhiên trong mọi phase; chỉ giữ nguyên thương hiệu, tên riêng, thuật ngữ quốc tế và mã kỹ thuật.
- API and worker skeletons now exist with TypeScript strict and API `/health`; the Nest Express runtime adapter is installed and the API smoke test passes on port `4100`; Drizzle/PostgreSQL database foundation and migration generation now exist; runtime PostgreSQL still required for migration execution.
- Root quality tooling exists: ESLint 9, Prettier, Vitest 3 and Playwright 1.58; web/API/worker typecheck, lint, format check, unit smoke test and Chromium E2E pass.
- Tasks: `T001` to `T175`; T001-T083 are complete; T084 is the next open task.
- Current baseline: Phase 11 is in progress; T081-T083 backend assessment foundation/policy/attempt state machine are complete, and T084 assessment UI is next.

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
- UI consistency is mandatory: authenticated data/list pages must use one shared TanStack Table 8.x data-table pattern, one page layout pattern and semantic color tokens; do not let each page invent its own table, toolbar, spacing or status colors.
- Shell consistency is mandatory: authenticated breadcrumb belongs only in the topbar, sidebar collapse must resize the sidebar column, topbar search is icon-triggered, global topbar actions stay right-aligned, and table headers use the filled primary button color/contrast tokens.
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

During every task:

1. Update `docs/project-status.json` at task start, each meaningful progress milestone, any blocker and task completion; regenerate `docs/task-dashboard.html` each time.
2. Treat the public dashboard as updated only after the status checkpoint is committed and successfully pushed to the branch monitored by GitHub Pages.
3. Do not allow the public dashboard to lag across completed tasks. Push each coherent completion checkpoint when push authorization is available.
4. If push is not authorized or fails, immediately state that only local status is current, the public dashboard is stale, and request permission or report the failure.

Before ending every task:

1. Run the narrowest relevant tests, typecheck or build.
2. Update `tasks.md` only when the artifact/test really exists.
3. Update `docs/ai-task-continuity.md` and `docs/project-status.json` with completed work, current task percentage, activity, blockers and next task.
4. Run `npm run status:generate` so the HTML task list and live status stay synchronized.
5. Commit a coherent change; never commit secrets, `.env`, generated output, `node_modules` or private media.
6. Check the target branch and remote, then push the completion checkpoint when authorized so the public dashboard remains current.

## Current Blockers / Decisions Needed

- `npm audit` currently reports 7 vulnerabilities (4 moderate, 3 high); address through T172 dependency gate, not force-upgrade without review.

- Choose and document concrete authentication/session provider.
- Database stack selected: Drizzle ORM + PostgreSQL; runtime PostgreSQL service still required for migration smoke/restore tests.
- Choose payment, meeting, accounting/ERP, AI, email/SMS, storage and video provider adapters.
- Define Vietnam payroll, tax and insurance formulas with an accountable business owner.
- Define privacy/retention/legal basis for minors, parent data, recordings, voice and AI processing.

## Recent Work Log

- 2026-08-22: Completed T083 by adding timed assessment attempt service, start idempotency, autosave, submit idempotency and timeout auto-submit handling with in-memory repository and tests; API typecheck and assessment module tests pass.
- 2026-08-22: Completed T082 by adding assessment policy service for question approval, blueprint/time-window/attempt-limit/scoring-policy publication validation, in-memory repository and focused tests; API typecheck passes.
- 2026-08-22: Completed T081 by adding assessment banks, questions, question versions, attempts, and assessment/result schema extensions with Drizzle migration 0012; API typecheck and focused assessment/database Vitest tests pass.
- 2026-08-22: Completed T075/T080 and closed Phase 9/10 by adding US6 parent delegation authorization tests, US6 parent E2E, US7 communication contract tests and US7 communication E2E; web/API/worker typechecks, full Vitest 335 tests and focused Playwright 2/2 pass.
- 2026-08-22: Completed T079 by adding communication center, notification inbox and parent conversation pages using shared PageHeader/PageToolbar/UiDataTable patterns; web typecheck and full Vitest 333 tests pass.
- 2026-08-22: Completed T078 by adding deterministic notification worker for in-app/email delivery, retry/error result handling and worker tests; worker typecheck and full Vitest 333 tests pass.
- 2026-08-22: Completed T074/T077 by extending communication service with three-party parent-teacher conversations, member lifecycle, attachment policy, message moderation, notification audience resolution and delivery creation; API typecheck and full Vitest 330 tests pass.
- 2026-08-22: Completed T073 by adding student and parent portal pages for schedule, progress, scores, tuition and homework using the shared PageHeader/PageToolbar/UiDataTable pattern; web typecheck and full Vitest 328 tests pass.
- 2026-08-22: Completed T076 by adding communication conversation/member/message/notification/delivery schemas with migration 0011; full Vitest 328 tests pass. Phase 9 T073 remains open for student/parent portals.
- 2026-08-22: Completed T072 by adding communication service and in-memory repository for parent links, delegation grant/revoke/expiry and parent scoped data resolver; API typecheck and full Vitest 328 tests pass.
- 2026-08-22: Completed T071 by implementing student enrollment, progress updates, attendance, score recording, completion/at-risk state transitions, in-memory repository support and migration 0010 for enrollment attendance/score tables; API typecheck and full Vitest 326 tests pass.
- 2026-08-22: Completed T070 by adding student/enrollment schemas in academic-learning, parent link/delegation schemas in communication, database exports and Drizzle migration 0009; API typecheck and full Vitest 324 tests pass.
- 2026-08-22: Completed T069 and closed Phase 8 by adding US5 content-scope authorization tests and focused library E2E coverage; full Vitest passes 324 tests and US5 E2E passes 2/2.
- 2026-08-22: Completed T068 by adding `worker/src/jobs/content-processing` processing stub and worker tests; full Vitest now passes 322 tests.
- 2026-08-22: Completed T067 by adding teacher content editor UI at `/admin/teacher/content`, student library/player UI at `/admin/student/library`, learning navigation entries/i18n, and US5 focused E2E coverage; web typecheck, full Vitest 320 tests and focused US4/US5/LMS E2E pass.
- 2026-08-22: Completed T066 by adding `saved_library_resources` schema, library search/filter/stats/category services and saved-resource toggle; full Vitest now passes 320 tests.
- 2026-08-22: Completed T065 by adding `LearningContent` and `LibraryResource` approval/versioning, class-scope protection, file asset integration and private signed URL service path; updated lead-list composition tests to expect `UiDataTable` instead of direct `EmptyState`; full Vitest now passes 319 tests.
- 2026-08-22: Completed T064 by adding academic learning content/library/file schemas and Drizzle migration 0007 for `file_assets`, `learning_contents`, `learning_content_versions`, `library_resources` and `library_resource_versions`; API typecheck and API node test pass.
- 2026-08-22: Formalized authenticated shell/topbar rules after UI review: breadcrumb moved to topbar, page headers no longer duplicate breadcrumbs, sidebar collapse resizes to icon rail, topbar search opens on demand, utility actions stay right-aligned, and table headers follow primary button color.
- 2026-08-22: Added UI consistency mandate: one TanStack Table pattern, one page layout language and shared semantic colors across pages; noted current UI drift risk around ad-hoc Mantine tables/cards/status colors.
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

- 2026-08-22: Chuẩn hóa toàn bộ nội dung public landing/catalog/program detail và ProgramCard sang tiếng Việt đầy đủ dấu; thêm quy định ngôn ngữ bắt buộc áp dụng cho mọi phase/task vào constitution, PROJECT_MEMORY và ai-task-continuity. Landing E2E 2/2 và full Vitest 310 tests pass.

- 2026-08-22: Completed Role & Workspace Correction before Phase 11: formalized business operating model and role-workspace matrix, separated self-service portals from `/admin` into `/teacher`, `/student`, `/parent`, kept `/admin` for staff operations only, added legacy redirects and workspace-specific navigation. Verification: web typecheck, production build, full Vitest 338 tests pass; focused Playwright retry is blocked by current localhost:3100 dev server returning HTTP 500 / webServer exits early.

## Live Coding Status

- Dashboard: `https://quocanhcgd.github.io/HNLMS/`.
- Source: `docs/project-status.json`, polled every 15 seconds.
- Update command: `npm run status:generate`.
- Start a task: `npm run status:start --task=T024` or set `STATUS_TASK`, `STATUS_STATE`, `STATUS_PERCENT`, `STATUS_ACTIVITY` before `npm run status:generate`.
- A local generation does not update GitHub Pages. The dashboard is current only after the generated status/dashboard files are committed, pushed and visible on the monitored branch.
- Required cadence: task start, meaningful milestones, blockers and completion; never batch multiple completed tasks while leaving the public dashboard stale.
- Standing authorization recorded 2026-08-22: push normal coherent task/status checkpoints to `origin/main` without asking again after verifying the branch, remote and quality gate.
- Force-push authorization recorded 2026-08-22 for this repository when history rewriting is genuinely required. Prefer `--force-with-lease`; first fetch, verify the exact remote/branch and preserve a recoverable local ref. Do not force-push when a normal push can succeed, and report the rewritten commits afterward.

- 2026-08-21: Added Drizzle database foundation, tenant resolver, migration runner and generated tenant registry migration.
- 2026-08-21: Added Remote Command Center Phase 1 queue/lock policy and GitHub Issue command link; no arbitrary shell execution.

- 2026-08-21: Implemented T025 Drizzle schemas for organization, tenant instance, users, roles, permissions, scope grants and append-only audit events; generated migration 0001. Remote queue now displays workspace lock and command history.

- 2026-08-21: Implemented T026 server-derived authorization context, permission/resource assertions and negative organization/branch/class/student/delegation matrix tests.

- 2026-08-21: Implemented T027 scrypt password primitives, opaque hashed sessions/reset tokens, tenant/platform realms, super-admin MFA boundary and authentication schema migration 0002.

- 2026-08-21: Phase 3 Wave 1 used 7 Codex worktree agents. Merged T028/T029/T030/T033/T034/T035/T036; integration gate passed 89 tests after fixing Redis scheduled-job metadata preservation.

- 2026-08-21: Phase 3 Wave 2 merged T031/T032/T037 from 3 worktree agents; full gate passed 106 tests.

- 2026-08-21: Phase 3 Wave 3 merged T038/T039/T040. Full Phase 3 quality gate: 45 files, 161 tests passed; Phase 3 closed.

- 2026-08-21: Phase 4 Wave 1 merged T041 organization/branch/theme schema, T043 access assignment foundation and T045 module management UI; 169 tests pass.

- 2026-08-21: Phase 4 Wave 2 merged T042 branch lifecycle and T044 organization settings/theme service/UI; 176 tests pass.

- 2026-08-21: Phase 4 US1 closed through T046. API contract 3/3 and Playwright E2E 2/2 passed; organization/access/settings/module foundations complete.

- 2026-08-21: Phase 5 Wave 1 merged T047 landing content schema, T048 public catalog and T050 consultation/idempotency; 195 unit tests and consultation E2E pass.

- 2026-08-21: Phase 5 Wave 2 merged T049 landing admin CRUD/lifecycle/order and T051 SEO/sitemap/route states; 273 unit tests, typecheck, lint, format and production build pass.

- 2026-08-22: T052 closed US2 with publication/tenant/idempotency/consent contract coverage and landing/catalog/consultation E2E; 277 unit/contract and 17 Chromium E2E tests pass.

- 2026-08-22: T053 added tenant-scoped Lead, Consultation and LeadAssignment entities, lifecycle enums, consent/idempotency fields, routing constraints and migration 0005; 280 tests pass and Drizzle reports no schema drift.

- 2026-08-22: T054 added tenant-scoped duplicate detection, deterministic routing with branch fallback, consultant ownership/transfer and guarded lead lifecycle; 294 tests pass.
- 2026-08-22: Fixed the API runtime by installing `@nestjs/platform-express`; Nest starts successfully on port `4100`, `/health` returns HTTP 200 with the expected payload, and CORS accepts the web origin `http://localhost:3100`. T055 remains the next task.
- 2026-08-22: T055 added the consultant work queue and lead detail at `/admin/admission`, duplicate/assessment context, immutable consultation timeline, required future next actions, and guarded enrollment conversion preview with student/class/finance confirmation. Verification: 297 unit/contract tests, 2 focused T055 E2E, full typecheck/lint/format; the full 35-test Playwright pass had four cold parallel-load flakes and all four passed isolated reruns.
